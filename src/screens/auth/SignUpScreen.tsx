import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { GlowButton } from '../../components/common/Buttons';
import { GlassCard } from '../../components/common/DarkCard';
import { InputField, PasswordField } from '../../components/common/InputField';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { colors, radii, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

export function SignUpScreen({ navigation }: Props) {
  const [agreed, setAgreed] = useState(true);

  return (
    <ScreenContainer scroll>
      <ScreenHeader title="Create Account" subtitle="Start with a protected identity" back />
      <GlassCard style={styles.card}>
        <InputField label="Full name" icon="person" placeholder="Amgad Alzomi" />
        <InputField label="Email" icon="mail" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
        <InputField label="Phone (optional)" icon="call" placeholder="+1 555 014 0092" keyboardType="phone-pad" />
        <PasswordField label="Password" placeholder="Create a strong password" />
        <PasswordField label="Confirm password" placeholder="Repeat your password" />
        <TouchableOpacity style={styles.checkRow} onPress={() => setAgreed((value) => !value)}>
          <View style={[styles.checkbox, agreed && styles.checked]}>
            {agreed ? <Ionicons name="checkmark" size={16} color={colors.text} /> : null}
          </View>
          <Text style={styles.terms}>I agree to the privacy-first terms and secure messaging policy.</Text>
        </TouchableOpacity>
        <GlowButton disabled={!agreed} onPress={() => navigation.replace('DeviceVerification')} icon="shield-checkmark">
          Create Account
        </GlowButton>
      </GlassCard>
      <TouchableOpacity style={styles.switch} onPress={() => navigation.navigate('SignIn')}>
        <Text style={styles.switchText}>Already have an account? Sign in</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
  },
  checkRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  checked: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryBright,
  },
  terms: {
    ...typography.small,
    flex: 1,
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
