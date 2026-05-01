import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { GlowButton, SecondaryButton } from '../../components/common/Buttons';
import { DarkCard } from '../../components/common/DarkCard';
import { QRCard } from '../../components/common/QRCard';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { SectionHeader } from '../../components/common/SectionHeader';
import { SecureBadge } from '../../components/common/SecureBadge';
import { contacts } from '../../data/mockData';
import { useBackend } from '../../hooks/useBackend';
import { describeRemoteTrustState, findRemoteTrustRecord } from '../../security';
import { colors, radii, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

export function ContactsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    remoteTrustRecords,
    contactDiscoveryResults,
    discoverContacts,
    addDiscoveredContact,
    syncRemoteIdentity,
    trustRemoteIdentity,
    status,
  } = useBackend();
  const [query, setQuery] = useState('');
  const [discovering, setDiscovering] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const runDiscovery = async () => {
    const normalizedQuery = query.trim();

    if (normalizedQuery.length < 2) {
      Alert.alert('Search needs more detail', 'Enter at least two characters to discover CipherChat accounts.');
      return;
    }

    setDiscovering(true);

    try {
      await discoverContacts(normalizedQuery);
    } catch (error) {
      Alert.alert(
        'Contact discovery unavailable',
        error instanceof Error ? error.message : 'CipherChat could not search for contact identity bundles.',
      );
    } finally {
      setDiscovering(false);
    }
  };

  const syncPublicKeys = async () => {
    setSyncing(true);

    try {
      for (const contact of contacts) {
        const trust = findRemoteTrustRecord(remoteTrustRecords, contact.id, contact.name);

        if (trust) {
          await syncRemoteIdentity(trust.id);
        }
      }
    } catch (error) {
      Alert.alert(
        'Public key sync unavailable',
        error instanceof Error ? error.message : 'CipherChat could not sync public identity bundles.',
      );
    } finally {
      setSyncing(false);
    }
  };

  const trustContact = async (recordId: string) => {
    try {
      await trustRemoteIdentity(recordId);
    } catch (error) {
      Alert.alert(
        'Trust update failed',
        error instanceof Error ? error.message : 'CipherChat could not update this trust record.',
      );
    }
  };

  const addDiscoveryResult = async (accountId: string, deviceId?: string) => {
    if (!deviceId) {
      Alert.alert('No device bundle', 'This contact has not published an active identity bundle yet.');
      return;
    }

    try {
      await addDiscoveredContact(accountId, deviceId);
    } catch (error) {
      Alert.alert(
        'Could not add contact',
        error instanceof Error ? error.message : 'CipherChat could not add this discovered contact.',
      );
    }
  };

  return (
    <ScreenContainer scroll contentContainerStyle={styles.content}>
      <ScreenHeader title="Contacts" subtitle="Discover verified people and keys" />

      <View style={styles.search}>
        <Ionicons name="at" size={18} color={colors.muted} />
        <TextInput
          accessibilityLabel="Search contacts by username or key"
          testID="contacts-search"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => void runDiscovery()}
          returnKeyType="search"
          placeholder="Search username or key"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
        />
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Discover contacts"
          testID="contacts-discover-submit"
          disabled={discovering}
          onPress={() => void runDiscovery()}
          style={[styles.searchButton, discovering && styles.searchButtonDisabled]}
        >
          <Ionicons name={discovering ? 'sync' : 'search'} size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      {query.trim().length >= 2 ? (
        <View style={styles.discoveryBlock}>
          <SectionHeader title="Discovery Results" action={discovering ? 'Searching...' : `${contactDiscoveryResults.length} found`} />
          <View style={styles.discoveryList}>
            {contactDiscoveryResults.length > 0 ? (
              contactDiscoveryResults.map((result) => {
                const device = result.devices[0];
                const tracked = remoteTrustRecords.some(
                  (record) => record.accountId === result.accountId && record.deviceId === device?.deviceId,
                );

                return (
                  <View key={`${result.accountId}:${device?.deviceId ?? 'none'}`} style={styles.discoveryRow}>
                    <View style={styles.discoveryIcon}>
                      <Ionicons name="finger-print" size={20} color={colors.primaryBright} />
                    </View>
                    <View style={styles.contactBody}>
                      <Text style={styles.contactName}>{result.displayName}</Text>
                      <Text style={styles.handle}>
                        {result.username ? `@${result.username}` : result.accountId} | {result.devices.length} active device
                        {result.devices.length === 1 ? '' : 's'}
                      </Text>
                      <Text style={styles.safetyNumber}>{device?.deviceName ?? 'No active identity bundle'}</Text>
                    </View>
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={tracked ? `${result.displayName} is tracked` : `Add ${result.displayName}`}
                      testID={`contact-discovery-add-${result.accountId}`}
                      disabled={tracked || !device}
                      style={[styles.discoveryAdd, tracked && styles.discoveryTracked]}
                      onPress={() => void addDiscoveryResult(result.accountId, device?.deviceId)}
                    >
                      <Text style={styles.discoveryAddText}>{tracked ? 'Tracked' : 'Add Key'}</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            ) : (
              <View style={styles.discoveryEmpty}>
                <Ionicons name="search" size={18} color={colors.muted} />
                <Text style={styles.handle}>Search results will show verified public device bundles here.</Text>
              </View>
            )}
          </View>
        </View>
      ) : null}

      <DarkCard style={styles.profileCard}>
        <Text style={styles.profileTitle}>Your secure profile</Text>
        <Text style={styles.profileText}>Share this code to let trusted contacts verify your identity key.</Text>
        <QRCard />
        <View style={styles.profileActions}>
          <GlowButton accessibilityLabel="Share prototype profile" testID="contacts-share-profile" icon="share-social">
            Share Profile
          </GlowButton>
          <SecondaryButton
            accessibilityLabel="Verify this device"
            testID="contacts-verify-device"
            onPress={() => navigation.navigate('DeviceVerification')}
            icon="scan"
          >
            Verify Device
          </SecondaryButton>
        </View>
      </DarkCard>

      <SectionHeader title="Suggested Contacts" action={status.remoteTrustSyncing || syncing ? 'Syncing...' : 'Verified first'} />
      <SecondaryButton
        accessibilityLabel="Sync public contact keys"
        testID="contacts-sync-public-keys"
        icon="sync"
        style={styles.syncButton}
        disabled={syncing || status.remoteTrustSyncing}
        onPress={syncPublicKeys}
      >
        Sync Public Keys
      </SecondaryButton>
      <View style={styles.list}>
        {contacts.map((contact) => {
          const trust = findRemoteTrustRecord(remoteTrustRecords, contact.id, contact.name);
          const trustCopy = trust ? describeRemoteTrustState(trust.trustState) : null;
          const needsReview = trust?.trustState === 'changed' || trust?.trustState === 'new';

          return (
            <View key={contact.id} style={styles.contactRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{contact.avatar}</Text>
              </View>
              <View style={styles.contactBody}>
                <View style={styles.contactNameRow}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  {contact.verified && trust?.trustState === 'trusted' ? <SecureBadge /> : null}
                  {trustCopy && needsReview ? (
                    <View style={[styles.trustBadge, trust.trustState === 'changed' && styles.changedBadge]}>
                      <Ionicons
                        name={trustCopy.icon}
                        size={12}
                        color={trust.trustState === 'changed' ? colors.warning : colors.primaryBright}
                      />
                      <Text style={[styles.trustBadgeText, trust.trustState === 'changed' && styles.changedBadgeText]}>
                        {trustCopy.label}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.handle}>{contact.handle} | {contact.mutualKeys} mutual keys</Text>
                {trust ? (
                  <Text style={styles.safetyNumber}>{trust.safetyNumberBlocks.join(' ')}</Text>
                ) : null}
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={needsReview && trust ? `Trust ${contact.name} safety number` : `Add ${contact.name}`}
                testID={`contact-trust-${contact.id}`}
                style={[styles.add, needsReview && styles.review]}
                onPress={needsReview && trust ? () => void trustContact(trust.id) : undefined}
              >
                <Ionicons name={needsReview ? 'shield-outline' : 'person-add'} size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 110,
  },
  search: {
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontWeight: '600',
  },
  searchButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  discoveryBlock: {
    marginBottom: spacing.xl,
  },
  discoveryList: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(124,45,255,0.35)',
    backgroundColor: 'rgba(17,17,26,0.72)',
    overflow: 'hidden',
  },
  discoveryRow: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  discoveryIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.34)',
    backgroundColor: 'rgba(124,45,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discoveryAdd: {
    minHeight: 34,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discoveryTracked: {
    backgroundColor: 'rgba(126,132,153,0.22)',
  },
  discoveryAddText: {
    ...typography.small,
    color: colors.text,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  discoveryEmpty: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  profileCard: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  profileTitle: {
    ...typography.subtitle,
  },
  profileText: {
    ...typography.body,
  },
  profileActions: {
    gap: spacing.md,
  },
  list: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(17,17,26,0.78)',
    paddingHorizontal: spacing.lg,
  },
  syncButton: {
    marginBottom: spacing.lg,
  },
  contactRow: {
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.button,
  },
  contactBody: {
    flex: 1,
    gap: spacing.xs,
  },
  contactNameRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  contactName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '800',
  },
  handle: {
    ...typography.small,
  },
  safetyNumber: {
    ...typography.small,
    color: colors.primaryBright,
    fontSize: 11,
  },
  trustBadge: {
    minHeight: 22,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.32)',
    backgroundColor: 'rgba(124,45,255,0.1)',
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  changedBadge: {
    borderColor: 'rgba(244,183,64,0.42)',
    backgroundColor: 'rgba(244,183,64,0.08)',
  },
  trustBadgeText: {
    ...typography.small,
    color: colors.primaryBright,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  changedBadgeText: {
    color: colors.warning,
  },
  add: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  review: {
    backgroundColor: colors.primaryDeep,
    borderWidth: 1,
    borderColor: colors.primaryBright,
  },
});
