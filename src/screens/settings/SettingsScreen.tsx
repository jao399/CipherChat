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
import {
  collectPrototypeStoreMigrationItems,
  getEncryptedDatabaseReadiness,
  migratePrototypeStoresToEncryptedDatabase,
  opSQLiteEncryptedLocalDatabase,
  type PrototypeStoreMigrationResult,
} from '../../services/local';
import type { EncryptedLocalDatabaseStatus } from '../../services/ports';
import { colors, radii, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

export function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    status,
    setMode,
    refreshStatus,
    clearSession,
    revokeCurrentDevice,
    rotateDeviceIdentity,
    inboundEnvelopeStatus,
    pollInboundEnvelopes,
  } = useBackend();
  const [readReceipts, setReadReceipts] = useState(false);
  const [appLock, setAppLock] = useState(true);
  const [disappearing, setDisappearing] = useState(true);
  const [pollingInbox, setPollingInbox] = useState(false);
  const [revokingDevice, setRevokingDevice] = useState(false);
  const [checkingEncryptedDatabase, setCheckingEncryptedDatabase] = useState(false);
  const [encryptedDatabaseStatus, setEncryptedDatabaseStatus] = useState<EncryptedLocalDatabaseStatus | null>(null);
  const [checkingMigrationReadiness, setCheckingMigrationReadiness] = useState(false);
  const [runningMigration, setRunningMigration] = useState(false);
  const [migrationPreview, setMigrationPreview] = useState<PrototypeStoreMigrationResult['migratedCounts'] | null>(null);
  const [migrationResult, setMigrationResult] = useState<PrototypeStoreMigrationResult | null>(null);
  const encryptedDatabase = getEncryptedDatabaseReadiness();
  const encryptedDatabaseState = encryptedDatabaseStatus
    ? encryptedDatabaseStatus.available
      ? `Available - schema v${encryptedDatabaseStatus.schemaVersion}`
      : encryptedDatabaseStatus.lastError ?? 'Unavailable until development build is installed'
    : `Schema v${encryptedDatabase.schemaVersion} planned`;

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

  const revokeThisDevice = () => {
    Alert.alert(
      'Revoke this device?',
      'This removes the device from public key discovery and invalidates its active session. You will need to verify again before using live encrypted delivery.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke Device',
          style: 'destructive',
          onPress: () => {
            setRevokingDevice(true);
            void revokeCurrentDevice()
              .then(refreshStatus)
              .then(() => {
                Alert.alert('Device revoked', 'This device session has been cleared locally.');
              })
              .catch((error) => {
                Alert.alert(
                  'Device revocation failed',
                  error instanceof Error ? error.message : 'CipherChat could not revoke this device.',
                );
              })
              .finally(() => setRevokingDevice(false));
          },
        },
      ],
    );
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

  const checkEncryptedDatabase = async () => {
    setCheckingEncryptedDatabase(true);

    try {
      const nextStatus = await opSQLiteEncryptedLocalDatabase.initialize();
      setEncryptedDatabaseStatus(nextStatus);
    } finally {
      setCheckingEncryptedDatabase(false);
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
      ? `${inboundEnvelopeStatus.pendingCount} fetched now | ${inboundEnvelopeStatus.totalAcknowledged} total acknowledged${inboundEnvelopeStatus.nextCursor ? ' | more pages ready' : ''}`
      : 'Poll pending envelopes for this device';
  const migrationSubtitle = migrationPreview
    ? `${migrationPreview.localMessages} messages | ${migrationPreview.remoteTrustRecords} trust | ${migrationPreview.outboundQueueItems} outbound | ${migrationPreview.inboundReceipts} receipts`
    : 'Preview prototype stores before copying';
  const migrationRunSubtitle = migrationResult
    ? migrationResult.status === 'completed'
      ? `${migrationResult.migratedCounts.localMessages + migrationResult.migratedCounts.remoteTrustRecords + migrationResult.migratedCounts.outboundQueueItems + migrationResult.migratedCounts.inboundReceipts} records copied`
      : migrationResult.reason ?? 'Migration did not run'
    : 'Copies only when encrypted DB is active';

  const checkMigrationReadiness = async () => {
    setCheckingMigrationReadiness(true);

    try {
      const items = await collectPrototypeStoreMigrationItems();
      setMigrationPreview({
        inboundReceipts: items.inboundReceipts.length,
        localMessages: items.localMessages.length,
        outboundQueueItems: items.outboundQueueItems.length,
        remoteTrustRecords: items.remoteTrustRecords.length,
      });
    } catch (error) {
      Alert.alert(
        'Migration preview unavailable',
        error instanceof Error ? error.message : 'CipherChat could not inspect prototype stores.',
      );
    } finally {
      setCheckingMigrationReadiness(false);
    }
  };

  const runPrototypeMigration = async () => {
    setRunningMigration(true);

    try {
      const result = await migratePrototypeStoresToEncryptedDatabase(opSQLiteEncryptedLocalDatabase, {
        enabled: true,
      });
      setMigrationResult(result);
      if (result.encryptedDatabaseStatus) {
        setEncryptedDatabaseStatus(result.encryptedDatabaseStatus);
      }
      Alert.alert(
        result.status === 'completed' ? 'Migration copied' : 'Migration blocked',
        result.status === 'completed'
          ? `${result.migratedCounts.localMessages} message records, ${result.migratedCounts.remoteTrustRecords} trust records, ${result.migratedCounts.outboundQueueItems} outbound items, and ${result.migratedCounts.inboundReceipts} inbound receipts were copied. Source AsyncStorage data was not deleted.`
          : result.reason ?? 'Encrypted local database is not ready.',
      );
    } catch (error) {
      Alert.alert(
        'Migration failed',
        error instanceof Error ? error.message : 'CipherChat could not run the prototype migration.',
      );
    } finally {
      setRunningMigration(false);
    }
  };

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
        <SettingRow icon="phone-portrait" title="Device Management" subtitle="Review and revoke account devices" testID="settings-device-management" onPress={() => navigation.navigate('DeviceManagement')} />
        <SettingRow icon="qr-code" title="Device Verification" subtitle="Verify this device safety number" testID="settings-device-verification" onPress={() => navigation.navigate('DeviceVerification')} />
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
          icon={revokingDevice ? 'sync' : 'trash'}
          title="Revoke This Device"
          subtitle={
            revokingDevice
              ? 'Revoking device access...'
              : status.sessionActive
                ? 'Remove this device and invalidate its session'
                : 'Start a verified session before revocation'
          }
          testID="settings-revoke-device"
          onPress={revokeThisDevice}
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
        <SettingRow
          icon="server"
          title="Encrypted Local Database"
          subtitle={
            checkingEncryptedDatabase
              ? 'Checking SQLCipher adapter...'
              : `${encryptedDatabaseState} - ${encryptedDatabase.migrationItemCount} prototype stores to migrate`
          }
          testID="settings-encrypted-local-database"
          onPress={checkEncryptedDatabase}
        />
        <SettingRow
          icon={status.messageCryptoReady ? 'shield-checkmark' : 'warning'}
          title="Message Crypto"
          subtitle={status.messageCryptoSummary}
          testID="settings-message-crypto"
        />
        <SettingRow
          icon={status.signalAdapterEligible ? 'hardware-chip' : 'construct'}
          title="Signal Adapter"
          subtitle={status.signalAdapterSummary ?? 'Native adapter readiness has not been checked yet'}
          testID="settings-signal-adapter"
        />
      </View>

      {__DEV__ ? (
        <>
          <SectionHeader title="Development Migration" />
          <View style={styles.group}>
            <SettingRow
              icon={checkingMigrationReadiness ? 'sync' : 'analytics'}
              title="Migration Readiness"
              subtitle={checkingMigrationReadiness ? 'Inspecting prototype stores...' : migrationSubtitle}
              testID="settings-migration-readiness"
              onPress={checkMigrationReadiness}
            />
            <SettingRow
              icon={runningMigration ? 'sync' : 'lock-closed'}
              title="Copy to Encrypted Database"
              subtitle={runningMigration ? 'Running guarded migration...' : migrationRunSubtitle}
              testID="settings-run-encrypted-migration"
              onPress={runPrototypeMigration}
            />
          </View>
        </>
      ) : null}

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
