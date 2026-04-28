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
  const { remoteTrustRecords, syncRemoteIdentity, trustRemoteIdentity, status } = useBackend();
  const [syncing, setSyncing] = useState(false);

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

  return (
    <ScreenContainer scroll contentContainerStyle={styles.content}>
      <ScreenHeader title="Contacts" subtitle="Discover verified people and keys" />

      <View style={styles.search}>
        <Ionicons name="at" size={18} color={colors.muted} />
        <TextInput placeholder="Search username or key" placeholderTextColor={colors.muted} style={styles.searchInput} />
      </View>

      <DarkCard style={styles.profileCard}>
        <Text style={styles.profileTitle}>Your secure profile</Text>
        <Text style={styles.profileText}>Share this code to let trusted contacts verify your identity key.</Text>
        <QRCard />
        <View style={styles.profileActions}>
          <GlowButton icon="share-social">Share Profile</GlowButton>
          <SecondaryButton onPress={() => navigation.navigate('DeviceVerification')} icon="scan">Verify Device</SecondaryButton>
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
