import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { GlowButton } from '../../components/common/Buttons';
import { GlassCard } from '../../components/common/DarkCard';
import { InputField, PasswordField } from '../../components/common/InputField';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { useLanguage } from '../../i18n';
import { colors, radii, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

export function SignUpScreen({ navigation }: Props) {
  const { t, textAlign, rowDirection } = useLanguage();
  const [agreed, setAgreed] = useState(true);

  return (
    <ScreenContainer scroll>
      <ScreenHeader title={t('auth.signUp.title')} subtitle={t('auth.signUp.subtitle')} back />
      <GlassCard style={styles.card}>
        <InputField label={t('auth.signUp.fullName')} icon="person" placeholder="Amgad Alzomi" />
        <InputField label={t('auth.signUp.email')} icon="mail" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
        <InputField label={t('auth.signUp.phone')} icon="call" placeholder="+1 555 014 0092" keyboardType="phone-pad" />
        <PasswordField label={t('auth.signUp.password')} placeholder={t('auth.signUp.passwordPlaceholder')} />
        <PasswordField label={t('auth.signUp.confirmPassword')} placeholder={t('auth.signUp.confirmPasswordPlaceholder')} />
        <TouchableOpacity
          accessibilityRole="checkbox"
          accessibilityLabel="Agree to privacy-first terms and secure messaging policy"
          accessibilityState={{ checked: agreed }}
          testID="signup-terms"
          style={[styles.checkRow, { flexDirection: rowDirection }]}
          onPress={() => setAgreed((value) => !value)}
        >
          <View style={[styles.checkbox, agreed && styles.checked]}>
            {agreed ? <Ionicons name="checkmark" size={16} color={colors.text} /> : null}
          </View>
          <Text style={[styles.terms, { textAlign }]}>{t('auth.signUp.terms')}</Text>
        </TouchableOpacity>
        <GlowButton
          accessibilityLabel="Create account"
          testID="signup-submit"
          disabled={!agreed}
          onPress={() => navigation.replace('DeviceVerification')}
          icon="shield-checkmark"
        >
          {t('auth.signUp.submit')}
        </GlowButton>
      </GlassCard>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Sign in to an existing CipherChat account"
        testID="signup-sign-in"
        style={styles.switch}
        onPress={() => navigation.navigate('SignIn')}
      >
        <Text style={styles.switchText}>{t('auth.signUp.switch')}</Text>
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
