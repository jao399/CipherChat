import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppLogo } from '../../components/common/AppLogo';
import { GlowButton, SecondaryButton } from '../../components/common/Buttons';
import { GlassCard } from '../../components/common/DarkCard';
import { InputField, PasswordField } from '../../components/common/InputField';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { SecureBadge } from '../../components/common/SecureBadge';
import { colors, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SignIn'>;

export function SignInScreen({ navigation }: Props) {
  return (
    <ScreenContainer scroll>
      <ScreenHeader title="Sign In" subtitle="Return to your secure space" back />
      <View style={styles.logo}>
        <AppLogo size={60} variant="horizontal" />
      </View>
      <GlassCard style={styles.card}>
        <InputField label="Email or phone" icon="mail" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
        <PasswordField placeholder="Enter your password" />
        <TouchableOpacity style={styles.forgot}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>
        <GlowButton
          accessibilityLabel="Sign in securely"
          testID="signin-submit"
          onPress={() => navigation.replace('DeviceVerification')}
          icon="lock-closed"
        >
          Sign In Securely
        </GlowButton>
        <SecondaryButton accessibilityLabel="Use biometric sign in" testID="signin-biometric" icon="finger-print">
          Use Biometric Sign In
        </SecondaryButton>
        <View style={styles.note}>
          <SecureBadge label="Prototype gated" />
          <Text style={styles.noteText}>
            Production message encryption is blocked until a reviewed Signal adapter is installed.
          </Text>
        </View>
      </GlassCard>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Create a new CipherChat account"
        testID="signin-create-account"
        style={styles.switch}
        onPress={() => navigation.navigate('SignUp')}
      >
        <Text style={styles.switchText}>New to CipherChat? Create an account</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  logo: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  card: {
    gap: spacing.lg,
  },
  forgot: {
    alignSelf: 'flex-end',
  },
  forgotText: {
    ...typography.small,
    color: colors.primaryBright,
  },
  note: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  noteText: {
    ...typography.small,
    color: colors.textSecondary,
  },
  switch: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  switchText: {
    ...typography.small,
    color: colors.textSecondary,
  },
});
