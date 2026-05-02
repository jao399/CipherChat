import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { GlowButton } from '../../components/common/Buttons';
import { QRCard, VerificationCodeCard } from '../../components/common/QRCard';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { LogoMark } from '../../components/common/LogoMark';
import { useBackend } from '../../hooks/useBackend';
import { useLanguage } from '../../i18n';
import { colors, radii, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'DeviceVerification'>;

export function DeviceVerificationScreen({ navigation }: Props) {
  const { t, textAlign, rowDirection, isRTL } = useLanguage();
  const { status, bootstrapPrototypeSession, trustCurrentDeviceIdentity } = useBackend();
  const [linking, setLinking] = useState(false);

  const continueToApp = async () => {
    setLinking(true);

    try {
      await bootstrapPrototypeSession();
      navigation.replace('MainTabs');
    } catch (error) {
      Alert.alert(
        t('deviceVerification.secureSessionUnavailable.title'),
        error instanceof Error ? error.message : t('deviceVerification.secureSessionUnavailable.text'),
      );
    } finally {
      setLinking(false);
    }
  };

  const trustStateText = {
    changed: t('deviceVerification.trust.changed'),
    new: t('deviceVerification.trust.new'),
    trusted: t('deviceVerification.trust.trusted'),
  }[status.identityTrustState ?? 'new'];

  return (
    <ScreenContainer scroll contentContainerStyle={styles.screen}>
      <View style={styles.topBar}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Back from device verification"
          testID="device-verification-back"
          style={styles.back}
          onPress={() => navigation.goBack()}
          hitSlop={8}
        >
          <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={30} color={colors.text} />
        </TouchableOpacity>
      </View>
      <View style={styles.center}>
        <LogoMark size={58} />
        <Text style={[styles.title, { textAlign }]}>{t('deviceVerification.title')}</Text>
        <Text style={[styles.text, { textAlign }]}>{t('deviceVerification.subtitle')}</Text>
      </View>
      <QRCard />
      <View style={styles.gap} />
      <VerificationCodeCard blocks={status.identitySafetyNumber} />
      <View style={[styles.trustCard, { flexDirection: rowDirection }, status.identityTrustState === 'changed' && styles.changedTrustCard]}>
        <Ionicons
          name={status.identityTrustState === 'trusted' ? 'shield-checkmark' : 'warning-outline'}
          size={20}
          color={status.identityTrustState === 'changed' ? colors.warning : colors.primaryBright}
        />
        <Text style={styles.trustText}>{trustStateText}</Text>
      </View>
      <View style={[styles.note, { flexDirection: rowDirection }]}>
        <Ionicons name="information-circle-outline" size={22} color={colors.textSecondary} />
        <Text style={styles.noteText}>
          {t('deviceVerification.note')}
        </Text>
      </View>
      <Text style={styles.backendNote}>
        {status.mode === 'mock'
          ? t('deviceVerification.mockMode')
          : status.summary}
      </Text>
      {status.identityFingerprint ? (
        <Text style={styles.fingerprint}>{t('deviceVerification.fingerprint')} {status.identityFingerprint}</Text>
      ) : null}
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Trust this safety number"
        testID="device-verification-trust-safety-number"
        style={styles.trustAction}
        onPress={trustCurrentDeviceIdentity}
      >
        <Text style={styles.trustActionText}>{t('deviceVerification.trustAction')}</Text>
      </TouchableOpacity>
      <GlowButton
        accessibilityLabel="Continue after device verification"
        testID="device-verification-continue"
        style={styles.continueButton}
        onPress={continueToApp}
        disabled={linking}
        icon="shield-checkmark"
      >
        {linking ? t('deviceVerification.preparing') : t('deviceVerification.continue')}
      </GlowButton>
      <TouchableOpacity accessibilityRole="link" accessibilityLabel="Need help with device verification" hitSlop={10}>
        <Text style={styles.help}>{t('deviceVerification.help')}</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'flex-start',
    paddingBottom: spacing.xxxl,
  },
  topBar: {
    height: 42,
    justifyContent: 'center',
  },
  back: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.title,
    textAlign: 'center',
    fontSize: 32,
    lineHeight: 39,
    marginTop: spacing.sm,
  },
  text: {
    ...typography.body,
    textAlign: 'center',
    maxWidth: 304,
    fontSize: 18,
    lineHeight: 28,
  },
  gap: {
    height: spacing.xxl,
  },
  note: {
    marginVertical: spacing.lg,
    minHeight: 78,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(10,10,18,0.72)',
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  trustCard: {
    marginTop: spacing.lg,
    minHeight: 58,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.32)',
    backgroundColor: 'rgba(124,45,255,0.08)',
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  changedTrustCard: {
    borderColor: 'rgba(244,183,64,0.42)',
    backgroundColor: 'rgba(244,183,64,0.08)',
  },
  trustText: {
    ...typography.small,
    color: colors.textSecondary,
    flex: 1,
  },
  continueButton: {
    marginTop: spacing.sm,
  },
  noteText: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  backendNote: {
    ...typography.small,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
  },
  fingerprint: {
    ...typography.small,
    color: colors.primaryBright,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  trustAction: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  trustActionText: {
    ...typography.small,
    color: colors.primaryBright,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  help: {
    ...typography.body,
    color: colors.primaryBright,
    textAlign: 'center',
    fontWeight: '700',
  },
});
