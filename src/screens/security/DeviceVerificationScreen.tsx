import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';

import { GlowButton } from '../../components/common/Buttons';
import { DarkCard } from '../../components/common/DarkCard';
import { QRCard, VerificationCodeCard } from '../../components/common/QRCard';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { SecureBadge } from '../../components/common/SecureBadge';
import { colors, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'DeviceVerification'>;

export function DeviceVerificationScreen({ navigation }: Props) {
  return (
    <ScreenContainer scroll>
      <ScreenHeader title="Verify Your Device" subtitle="Confirm trusted devices" back />
      <View style={styles.center}>
        <SecureBadge label="Safety check" tone="purple" />
        <Text style={styles.title}>Verify Your Device</Text>
        <Text style={styles.text}>
          Scan the QR code with your other device or enter the safety code manually.
        </Text>
      </View>
      <QRCard />
      <View style={styles.gap} />
      <VerificationCodeCard />
      <DarkCard style={styles.note}>
        <Text style={styles.noteText}>
          This ensures end-to-end encryption and verifies your devices before messages sync.
        </Text>
      </DarkCard>
      <GlowButton onPress={() => navigation.replace('MainTabs')} icon="shield-checkmark">
        Verify and Continue
      </GlowButton>
      <Text style={styles.help}>Need help?</Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.title,
    textAlign: 'center',
  },
  text: {
    ...typography.body,
    textAlign: 'center',
    maxWidth: 300,
  },
  gap: {
    height: spacing.xl,
  },
  note: {
    marginVertical: spacing.xl,
  },
  noteText: {
    ...typography.small,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  help: {
    ...typography.small,
    color: colors.primaryBright,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
