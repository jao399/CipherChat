import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { GlowButton, SecondaryButton } from '../../components/common/Buttons';
import { DarkCard } from '../../components/common/DarkCard';
import { QRCard } from '../../components/common/QRCard';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { SectionHeader } from '../../components/common/SectionHeader';
import { SecureBadge } from '../../components/common/SecureBadge';
import { contacts } from '../../data/mockData';
import { colors, radii, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

export function ContactsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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

      <SectionHeader title="Suggested Contacts" action="Verified first" />
      <View style={styles.list}>
        {contacts.map((contact) => (
          <View key={contact.id} style={styles.contactRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{contact.avatar}</Text>
            </View>
            <View style={styles.contactBody}>
              <View style={styles.contactNameRow}>
                <Text style={styles.contactName}>{contact.name}</Text>
                {contact.verified ? <SecureBadge /> : null}
              </View>
              <Text style={styles.handle}>{contact.handle} | {contact.mutualKeys} mutual keys</Text>
            </View>
            <TouchableOpacity style={styles.add}>
              <Ionicons name="person-add" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
        ))}
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
  contactRow: {
    minHeight: 76,
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
  },
  contactName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '800',
  },
  handle: {
    ...typography.small,
  },
  add: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
