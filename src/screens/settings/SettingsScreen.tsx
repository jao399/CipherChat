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
import { useLanguage, type Language } from '../../i18n';
import {
  collectPrototypeStoreMigrationItems,
  getEncryptedDatabaseReadiness,
  migratePrototypeStoresToEncryptedDatabase,
  opSQLiteEncryptedLocalDatabase,
  runSqlCipherRuntimeVerification,
  type PrototypeStoreMigrationResult,
  type SqlCipherRuntimeVerificationResult,
} from '../../services/local';
import type { EncryptedLocalDatabaseStatus } from '../../services/ports';
import { secureStorePrototypeSigningKeyProviderReadiness } from '../../security/nativeSigningKeyProvider';
import { evaluateNativeSigningKeyReadiness } from '../../security/nativeSigningKeyReadiness';
import { evaluateFileCryptoReadiness } from '../../security/fileCryptoPolicy';
import {
  evaluatePushProviderReadiness,
  missingProductionPushProviderEvidence,
} from '../../services/notifications/pushProviderReadiness';
import { colors, radii, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

const releaseEvidenceEnabled = process.env.EXPO_PUBLIC_CIPHERCHAT_RELEASE_EVIDENCE === 'true';

export function SettingsScreen() {
  const { language, setLanguage, t, textAlign } = useLanguage();
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
    devicePrekeyStatus,
  } = useBackend();
  const [readReceipts, setReadReceipts] = useState(false);
  const [appLock, setAppLock] = useState(true);
  const [disappearing, setDisappearing] = useState(true);
  const [pollingInbox, setPollingInbox] = useState(false);
  const [revokingDevice, setRevokingDevice] = useState(false);
  const [checkingEncryptedDatabase, setCheckingEncryptedDatabase] = useState(false);
  const [encryptedDatabaseStatus, setEncryptedDatabaseStatus] = useState<EncryptedLocalDatabaseStatus | null>(null);
  const [checkingSqlCipherRuntime, setCheckingSqlCipherRuntime] = useState(false);
  const [sqlCipherVerificationResult, setSqlCipherVerificationResult] =
    useState<SqlCipherRuntimeVerificationResult | null>(null);
  const [checkingMigrationReadiness, setCheckingMigrationReadiness] = useState(false);
  const [runningMigration, setRunningMigration] = useState(false);
  const [migrationPreview, setMigrationPreview] = useState<PrototypeStoreMigrationResult['migratedCounts'] | null>(null);
  const [migrationResult, setMigrationResult] = useState<PrototypeStoreMigrationResult | null>(null);
  const showSqlCipherEvidenceControls = __DEV__ || releaseEvidenceEnabled;
  const encryptedDatabase = getEncryptedDatabaseReadiness();
  const encryptedDatabaseState = encryptedDatabaseStatus
    ? encryptedDatabaseStatus.available
      ? `Available - schema v${encryptedDatabaseStatus.schemaVersion}`
      : encryptedDatabaseStatus.lastError ?? 'Unavailable until development build is installed'
    : `Schema v${encryptedDatabase.schemaVersion} planned`;
  const nativeSigningReadiness = evaluateNativeSigningKeyReadiness(
    secureStorePrototypeSigningKeyProviderReadiness,
  );
  const fileCryptoReadiness = evaluateFileCryptoReadiness();
  const pushProviderReadiness = evaluatePushProviderReadiness(missingProductionPushProviderEvidence);
  const sqlCipherVerificationSubtitle = sqlCipherVerificationResult
    ? sqlCipherVerificationResult.passed
      ? `Passed at ${sqlCipherVerificationResult.checkedAt}; encrypted=${String(sqlCipherVerificationResult.status.encrypted)}`
      : sqlCipherVerificationResult.summary
    : t('settings.sqlcipherRoundtrip');

  const resetOnboarding = async () => {
    await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
    navigation.replace('Onboarding');
  };

  const changeLanguage = async (nextLanguage: Language) => {
    const result = await setLanguage(nextLanguage);

    if (result.restartRecommended) {
      Alert.alert(t('settings.language.change'), t('language.restartNotice'));
    }
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

  const runSqlCipherEvidenceCheck = async () => {
    setCheckingSqlCipherRuntime(true);

    try {
      const result = await runSqlCipherRuntimeVerification(opSQLiteEncryptedLocalDatabase);
      setSqlCipherVerificationResult(result);
      setEncryptedDatabaseStatus(result.status);
      Alert.alert(
        result.passed ? 'SQLCipher check passed' : 'SQLCipher check blocked',
        result.summary,
      );
    } catch (error) {
      Alert.alert(
        'SQLCipher check failed',
        error instanceof Error ? error.message : 'CipherChat could not run SQLCipher runtime verification.',
      );
    } finally {
      setCheckingSqlCipherRuntime(false);
    }
  };

  const trustLabel = {
    changed: t('settings.trust.changed'),
    new: t('settings.trust.new'),
    trusted: t('settings.trust.trusted'),
  }[status.identityTrustState ?? 'new'];
  const backendModeSubtitle =
    status.mode === 'live'
      ? `${t('settings.backendLive')} - ${status.baseUrl}`
      : t('settings.backendMock');
  const backendReadinessSubtitle = `${status.ready ? t('settings.ready') : t('settings.unavailable')} - ${status.summary}`;
  const trustStateSubtitle =
    status.identityTrustState === 'trusted'
      ? t('settings.currentTrusted')
      : status.identityTrustState === 'changed'
        ? t('settings.identityChanged')
        : t('settings.identityNew');
  const prekeyInventorySubtitle = devicePrekeyStatus
    ? `${devicePrekeyStatus.oneTimePrekeyCount} one-time prekeys; ${devicePrekeyStatus.needsTopUp ? 'top-up recommended' : 'inventory healthy'}`
    : t('settings.prekeyOpenManagement');
  const inboxSubtitle = inboundEnvelopeStatus.lastError
    ? inboundEnvelopeStatus.lastError
    : inboundEnvelopeStatus.lastPolledAt
      ? `${inboundEnvelopeStatus.pendingCount} fetched now | ${inboundEnvelopeStatus.totalAcknowledged} total acknowledged${inboundEnvelopeStatus.nextCursor ? ' | more pages ready' : ''}`
      : t('settings.pollInbox');
  const migrationSubtitle = migrationPreview
    ? `${migrationPreview.localMessages} messages | ${migrationPreview.remoteTrustRecords} trust | ${migrationPreview.outboundQueueItems} outbound | ${migrationPreview.inboundReceipts} receipts`
    : t('settings.migrationPreview');
  const migrationRunSubtitle = migrationResult
    ? migrationResult.status === 'completed'
      ? `${migrationResult.migratedCounts.localMessages + migrationResult.migratedCounts.remoteTrustRecords + migrationResult.migratedCounts.outboundQueueItems + migrationResult.migratedCounts.inboundReceipts} records copied`
      : migrationResult.reason ?? 'Migration did not run'
    : t('settings.copiesEncryptedOnly');
  const nativeSigningStatusLabel = {
    blocked: t('settings.nativeSigningStatus.blocked'),
    'development-only': t('settings.nativeSigningStatus.developmentOnly'),
    ready: t('settings.nativeSigningStatus.ready'),
    unavailable: t('settings.nativeSigningStatus.unavailable'),
  }[nativeSigningReadiness.status];
  const nativeSigningProtectionLabel = {
    'android-keystore-non-exportable': t('settings.nativeSigningProtection.androidKeystore'),
    'ios-keychain-non-exportable': t('settings.nativeSigningProtection.iosKeychain'),
    'ios-secure-enclave-non-exportable': t('settings.nativeSigningProtection.secureEnclave'),
    'os-backed-exportable-unknown': t('settings.nativeSigningProtection.unknownExportable'),
    'prototype-securestore': t('settings.nativeSigningProtection.prototypeSecureStore'),
    unavailable: t('settings.nativeSigningProtection.unavailable'),
  }[nativeSigningReadiness.keyProtectionLevel];
  const nativeSigningEvidenceSubtitle =
    nativeSigningReadiness.missingEvidence.length > 0
      ? nativeSigningReadiness.missingEvidence.join(' | ')
      : t('settings.nativeSigningEvidenceComplete');

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
      <ScreenHeader title={t('settings.title')} subtitle={t('settings.subtitle')}>
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
        <Text style={[styles.profileText, { textAlign }]}>{t('settings.tagline')}</Text>
      </DarkCard>

      <SectionHeader title={t('settings.language.section')} />
      <View style={styles.group}>
        <SettingRow
          icon="language"
          title={t('settings.language.current')}
          subtitle={language === 'ar' ? t('language.arabic') : t('language.english')}
          testID="settings-language-current"
        />
        <SettingRow
          icon="globe"
          title={t('language.english')}
          subtitle={language === 'en' ? t('settings.language.current') : t('settings.language.change')}
          testID="settings-language-english"
          onPress={() => void changeLanguage('en')}
        />
        <SettingRow
          icon="globe-outline"
          title={t('language.arabic')}
          subtitle={language === 'ar' ? t('settings.language.current') : t('settings.language.note')}
          testID="settings-language-arabic"
          onPress={() => void changeLanguage('ar')}
        />
      </View>

      <SectionHeader title={t('settings.account.section')} />
      <View style={styles.group}>
        <SettingRow icon="person" title={t('settings.account.title')} subtitle={t('settings.account.subtitle')} testID="settings-account" />
        <SettingRow icon="shield-checkmark" title={t('settings.privacyDashboard')} subtitle={t('settings.privacyDashboard.subtitle')} testID="settings-privacy-row" onPress={() => navigation.navigate('PrivacyDashboard')} />
        <SettingRow icon="phone-portrait" title={t('settings.deviceManagement')} subtitle={t('settings.deviceManagement.subtitle')} testID="settings-device-management" onPress={() => navigation.navigate('DeviceManagement')} />
        <SettingRow icon="qr-code" title={t('settings.deviceVerification')} subtitle={t('settings.deviceVerification.subtitle')} testID="settings-device-verification" onPress={() => navigation.navigate('DeviceVerification')} />
      </View>

      <SectionHeader title={t('settings.privacySecurity.section')} />
      <View style={styles.group}>
        <SettingRow icon="key" title={t('settings.safetyNumber')} subtitle={t('settings.safetyNumber.subtitle')} testID="settings-safety-number" />
        <SettingRow icon="checkmark-done" title={t('settings.readReceipts')} subtitle={t('settings.readReceipts.subtitle')} testID="settings-read-receipts" value={readReceipts} onValueChange={setReadReceipts} />
        <SettingRow icon="timer" title={t('settings.disappearingMessages')} subtitle={t('settings.disappearingMessages.subtitle')} testID="settings-disappearing-messages" value={disappearing} onValueChange={setDisappearing} />
        <SettingRow icon="lock-closed" title={t('settings.appLock')} subtitle={t('settings.appLock.subtitle')} testID="settings-app-lock" value={appLock} onValueChange={setAppLock} />
        <SettingRow icon="finger-print" title={t('settings.twoStep')} subtitle={t('settings.twoStep.subtitle')} testID="settings-two-step" />
        <SettingRow icon="ban" title={t('settings.blockedContacts')} subtitle={t('settings.blockedContacts.subtitle')} testID="settings-blocked-contacts" />
      </View>

      <SectionHeader title={t('settings.app.section')} />
      <View style={styles.group}>
        <SettingRow icon="notifications" title={t('settings.notifications')} subtitle={t('settings.notifications.subtitle')} testID="settings-notifications" />
        <SettingRow icon="file-tray-full" title={t('settings.dataStorage')} subtitle={t('settings.dataStorage.subtitle')} testID="settings-data-storage" />
        <SettingRow icon="help-circle" title={t('settings.help')} subtitle={t('settings.help.subtitle')} testID="settings-help" />
        <SettingRow icon="information-circle" title={t('settings.about')} subtitle={t('settings.about.subtitle')} testID="settings-about" onPress={() => navigation.navigate('About')} />
      </View>

      <SectionHeader title={t('settings.backend.section')} />
      <View style={styles.group}>
        <SettingRow
          icon="server"
          title={t('settings.backendMode')}
          subtitle={backendModeSubtitle}
          testID="settings-live-api-mode"
          value={status.mode === 'live'}
          onValueChange={toggleLiveApi}
        />
        <SettingRow
          icon={status.ready ? 'cloud-done' : 'cloud-offline'}
          title={t('settings.backendReadiness')}
          subtitle={backendReadinessSubtitle}
          testID="settings-backend-status"
          onPress={refreshStatus}
        />
        <SettingRow
          icon={status.sessionActive ? 'key' : 'key-outline'}
          title={t('settings.prototypeSession')}
          subtitle={status.sessionActive ? t('settings.sessionStored') : t('settings.noSession')}
          testID="settings-prototype-session"
          onPress={resetApiSession}
        />
        <SettingRow
          icon="finger-print"
          title={t('settings.deviceIdentity')}
          subtitle={status.identityFingerprint ? `${trustLabel} - ${status.identityFingerprint}` : t('settings.preparingIdentity')}
          testID="settings-device-identity"
          onPress={rotateIdentity}
        />
        <SettingRow
          icon={status.identityTrustState === 'trusted' ? 'shield-checkmark' : 'warning'}
          title={t('settings.trustState')}
          subtitle={trustStateSubtitle}
          testID="settings-trust-state"
          onPress={() => navigation.navigate('DeviceVerification')}
        />
        <SettingRow
          icon={revokingDevice ? 'sync' : 'trash'}
          title={t('settings.revokeThisDevice')}
          subtitle={
            revokingDevice
              ? t('settings.revoking')
              : status.sessionActive
                ? t('settings.revokeAvailable')
                : t('settings.revokeNeedsSession')
          }
          testID="settings-revoke-device"
          onPress={revokeThisDevice}
        />
        <SettingRow
          icon={status.identityTrustState === 'changed' ? 'warning' : 'shield-checkmark'}
          title={t('settings.safetyNumber')}
          subtitle={status.identitySafetyNumber?.join(' ') ?? t('settings.preparingIdentity')}
          testID="settings-device-safety-number"
          onPress={() => navigation.navigate('DeviceVerification')}
        />
        <SettingRow
          icon={inboundEnvelopeStatus.polling || pollingInbox ? 'sync' : 'mail-unread'}
          title={t('settings.encryptedInbox')}
          subtitle={inboundEnvelopeStatus.polling || pollingInbox ? t('settings.pollingInbox') : inboxSubtitle}
          testID="settings-encrypted-inbox"
          onPress={pollEncryptedInbox}
        />
        <SettingRow
          icon="server"
          title={t('settings.encryptedDatabase')}
          subtitle={
            checkingEncryptedDatabase
              ? t('settings.checkingSqlcipher')
              : `${encryptedDatabaseState} - ${encryptedDatabase.migrationItemCount} prototype stores to migrate`
          }
          testID="settings-encrypted-local-database"
          onPress={checkEncryptedDatabase}
        />
        <SettingRow
          icon="hardware-chip"
          title={t('settings.deviceCryptoProvider')}
          subtitle={status.cryptoProvider ?? t('settings.preparingIdentity')}
          testID="settings-device-crypto-provider"
        />
        <SettingRow
          icon={nativeSigningReadiness.eligibleForProduction ? 'shield-checkmark' : 'warning'}
          title={t('settings.nativeSigningProvider')}
          subtitle={nativeSigningReadiness.summary}
          testID="settings-native-signing-key-provider"
        />
        <SettingRow
          icon={nativeSigningReadiness.safeForProduction ? 'checkmark-circle' : 'alert-circle'}
          title={t('settings.nativeSigningStatus')}
          subtitle={nativeSigningStatusLabel}
          testID="settings-native-signing-key-status"
        />
        <SettingRow
          icon="lock-closed"
          title={t('settings.nativeSigningProtectionLevel')}
          subtitle={nativeSigningProtectionLabel}
          testID="settings-native-signing-key-protection"
        />
        <SettingRow
          icon={nativeSigningReadiness.evidenceStatus === 'complete' ? 'document-text' : 'document-text-outline'}
          title={t('settings.nativeSigningProductionEvidence')}
          subtitle={nativeSigningEvidenceSubtitle}
          testID="settings-native-signing-key-evidence"
        />
        <SettingRow
          icon="information-circle"
          title={t('settings.nativeSigningPrototypeOnly')}
          subtitle={t('settings.nativeSigningProductionRequires')}
          testID="settings-native-signing-key-prototype-note"
        />
        <SettingRow
          icon={status.messageCryptoReady ? 'shield-checkmark' : 'warning'}
          title={t('settings.messageCrypto')}
          subtitle={status.messageCryptoSummary}
          testID="settings-message-crypto"
        />
        <SettingRow
          icon={status.signalAdapterEligible ? 'hardware-chip' : 'construct'}
          title={t('settings.signalAdapter')}
          subtitle={status.signalAdapterSummary ?? t('settings.signalNotChecked')}
          testID="settings-signal-adapter"
        />
        <SettingRow
          icon={fileCryptoReadiness.eligibleForProduction ? 'lock-closed' : 'warning'}
          title={t('settings.fileCryptoProvider')}
          subtitle={fileCryptoReadiness.summary}
          testID="settings-file-crypto-provider"
        />
        <SettingRow
          icon={pushProviderReadiness.productionReady ? 'notifications' : 'notifications-off'}
          title={t('settings.pushProvider')}
          subtitle={pushProviderReadiness.summary}
          testID="settings-push-provider-readiness"
        />
        <SettingRow
          icon={pushProviderReadiness.productionReady ? 'shield-checkmark' : 'warning'}
          title={t('settings.genericPushPolicy')}
          subtitle={t('settings.genericPushPolicy.subtitle')}
          testID="settings-push-payload-policy"
        />
        <SettingRow
          icon={devicePrekeyStatus?.needsTopUp ? 'warning' : 'key'}
          title={t('settings.prekeyInventory')}
          subtitle={prekeyInventorySubtitle}
          testID="settings-prekey-inventory"
          onPress={() => navigation.navigate('DeviceManagement')}
        />
      </View>

      {showSqlCipherEvidenceControls ? (
        <>
          <SectionHeader title={__DEV__ ? t('settings.developmentEvidence') : t('settings.releaseEvidence')} />
          <View style={styles.group}>
            <SettingRow
              icon={checkingSqlCipherRuntime ? 'sync' : 'shield-checkmark'}
              title={t('settings.sqlcipherRuntimeCheck')}
              subtitle={checkingSqlCipherRuntime ? t('settings.sqlcipherOpening') : sqlCipherVerificationSubtitle}
              testID="settings-sqlcipher-runtime-check"
              onPress={runSqlCipherEvidenceCheck}
            />
          </View>
        </>
      ) : null}

      {__DEV__ ? (
        <>
          <SectionHeader title={t('settings.developmentMigration')} />
          <View style={styles.group}>
            <SettingRow
              icon={checkingMigrationReadiness ? 'sync' : 'analytics'}
              title={t('settings.migrationReadiness')}
              subtitle={checkingMigrationReadiness ? t('settings.inspectingStores') : migrationSubtitle}
              testID="settings-migration-readiness"
              onPress={checkMigrationReadiness}
            />
            <SettingRow
              icon={runningMigration ? 'sync' : 'lock-closed'}
              title={t('settings.copyToEncryptedDatabase')}
              subtitle={runningMigration ? t('settings.runningMigration') : migrationRunSubtitle}
              testID="settings-run-encrypted-migration"
              onPress={runPrototypeMigration}
            />
          </View>
        </>
      ) : null}

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={t('settings.resetOnboarding')}
        testID="settings-reset-onboarding"
        style={styles.reset}
        onPress={resetOnboarding}
      >
        <Text style={styles.resetText}>{t('settings.resetOnboarding')}</Text>
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
