import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppLogo } from '../../components/common/AppLogo';
import { DarkCard } from '../../components/common/DarkCard';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { SectionHeader } from '../../components/common/SectionHeader';
import { SettingRow } from '../../components/settings/SettingRow';
import { ONBOARDING_STORAGE_KEY } from '../../constants/storage';
import { useBackend } from '../../hooks/useBackend';
import { colors, radii, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

export function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { status, setMode, refreshStatus, clearSession, rotateDeviceIdentity, inboundEnvelopeStatus, pollInboundEnvelopes } =
    useBackend();
  const [readReceipts, setReadReceipts] = useState(false);
  const [appLock, setAppLock] = useState(true);
  const [disappearing, setDisappearing] = useState(true);
  const [pollingInbox, setPollingInbox] = useState(false);

  const resetOnboarding = async () => {
    await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
    navigation.replace('Onboarding');
  };

  const toggleLiveApi = async (enabled: boolean) => {
    await setMode(enabled ? 'live' : 'mock');
  };

  const resetApiSession = async () => {
    await clearSession();
    await refreshStatus();
  };

  const rotateIdentity = async () => {
    await rotateDeviceIdentity();
    await refreshStatus();
  };

  const pollEncryptedInbox = async () => {
    setPollingInbox(true);

    try {
      await pollInboundEnvelopes();
    } catch (error) {
      Alert.alert(
        'Encrypted inbox unavailable',
        error instanceof Error ? error.message : 'CipherChat could not poll encrypted envelopes.',
      );
    } finally {
      setPollingInbox(false);
    }
  };

  const trustLabel = {
    changed: 'Changed - review safety number',
    new: 'New - not trusted yet',
    trusted: 'Trusted',
  }[status.identityTrustState ?? 'new'];
  const inboxSubtitle = inboundEnvelopeStatus.lastError
    ? inboundEnvelopeStatus.lastError
    : inboundEnvelopeStatus.lastPolledAt
      ? `${inboundEnvelopeStatus.pendingCount} fetched | ${inboundEnvelopeStatus.acknowledgedCount} acknowledged`
      : 'Poll pending envelopes for this device';

  return (
    <ScreenContainer scroll contentContainerStyle={styles.content}>
      <ScreenHeader title="Settings" subtitle="Privacy and account controls">
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Open privacy dashboard"
          testID="settings-privacy-dashboard"
          style={styles.iconButton}
          onPress={() => navigation.navigate('PrivacyDashboard')}
        >
          <Ionicons name="shield-checkmark" size={20} color={colors.text} />
        </TouchableOpacity>
      </ScreenHeader>

      <DarkCard style={styles.profile}>
        <AppLogo size={48} variant="horizontal" />
        <Text style={styles.profileText}>Secure. Private. Yours alone.</Text>
      </DarkCard>

      <SectionHeader title="Account" />
      <View style={styles.group}>
        <SettingRow icon="person" title="Account" subtitle="Profile, email, and recovery" testID="settings-account" />
        <SettingRow icon="shield-checkmark" title="Privacy Dashboard" subtitle="97% privacy score" testID="settings-privacy-row" onPress={() => navigation.navigate('PrivacyDashboard')} />
        <SettingRow icon="phone-portrait" title="Device Verification" subtitle="Manage trusted devices" testID="settings-device-verification" onPress={() => navigation.navigate('DeviceVerification')} />
      </View>

      <SectionHeader title="Privacy & Security" />
      <View style={styles.group}>
        <SettingRow icon="key" title="Safety Number" subtitle="Verify contacts manually" testID="settings-safety-number" />
        <SettingRow icon="checkmark-done" title="Read Receipts" subtitle="Control delivery transparency" testID="settings-read-receipts" value={readReceipts} onValueChange={setReadReceipts} />
        <SettingRow icon="timer" title="Disappearing Messages" subtitle="Default timer: 30 seconds" testID="settings-disappearing-messages" value={disappearing} onValueChange={setDisappearing} />
        <SettingRow icon="lock-closed" title="App Lock" subtitle="Require biometric unlock" testID="settings-app-lock" value={appLock} onValueChange={setAppLock} />
        <SettingRow icon="finger-print" title="Two-Step Verification" subtitle="Add a security PIN" testID="settings-two-step" />
        <SettingRow icon="ban" title="Blocked Contacts" subtitle="3 blocked identities" testID="settings-blocked-contacts" />
      </View>

      <SectionHeader title="App" />
      <View style={styles.group}>
        <SettingRow icon="notifications" title="Notifications" subtitle="Private previews enabled" testID="settings-notifications" />
        <SettingRow icon="file-tray-full" title="Data & Storage" subtitle="Encrypted local only" testID="settings-data-storage" />
        <SettingRow icon="help-circle" title="Help & Support" subtitle="Security guide and support" testID="settings-help" />
        <SettingRow icon="information-circle" title="About CipherChat" subtitle="Version and credits" testID="settings-about" onPress={() => navigation.navigate('About')} />
      </View>

      <SectionHeader title="Prototype Backend" />
      <View style={styles.group}>
        <SettingRow
          icon="server"
          title="Live API Mode"
          subtitle={status.mode === 'live' ? status.baseUrl : 'Mock mode keeps the UI fully offline'}
          testID="settings-live-api-mode"
          value={status.mode === 'live'}
          onValueChange={toggleLiveApi}
        />
        <SettingRow
          icon={status.ready ? 'cloud-done' : 'cloud-offline'}
          title="Backend Status"
          subtitle={`${status.ready ? 'Ready' : 'Unavailable'} - ${status.summary}`}
          testID="settings-backend-status"
          onPress={refreshStatus}
        />
        <SettingRow
          icon={status.sessionActive ? 'key' : 'key-outline'}
          title="Prototype Session"
          subtitle={status.sessionActive ? 'Device session stored securely' : 'No device session yet'}
          testID="settings-prototype-session"
          onPress={resetApiSession}
        />
        <SettingRow
          icon="finger-print"
          title="Device Identity"
          subtitle={status.identityFingerprint ? `${trustLabel} - ${status.identityFingerprint}` : 'Preparing local identity'}
          testID="settings-device-identity"
          onPress={rotateIdentity}
        />
        <SettingRow
          icon={status.identityTrustState === 'changed' ? 'warning' : 'shield-checkmark'}
          title="Safety Number"
          subtitle={status.identitySafetyNumber?.join(' ') ?? 'Preparing safety number'}
          testID="settings-device-safety-number"
          onPress={() => navigation.navigate('DeviceVerification')}
        />
        <SettingRow
          icon={inboundEnvelopeStatus.polling || pollingInbox ? 'sync' : 'mail-unread'}
          title="Encrypted Inbox"
          subtitle={inboundEnvelopeStatus.polling || pollingInbox ? 'Polling encrypted envelopes...' : inboxSubtitle}
          testID="settings-encrypted-inbox"
          onPress={pollEncryptedInbox}
        />
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Reset onboarding prototype"
        testID="settings-reset-onboarding"
        style={styles.reset}
        onPress={resetOnboarding}
      >
        <Text style={styles.resetText}>Reset onboarding prototype</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 110,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profile: {
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  profileText: {
    ...typography.small,
    color: colors.textSecondary,
  },
  group: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(17,17,26,0.82)',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  reset: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  resetText: {
    ...typography.small,
    color: colors.primaryBright,
  },
});
