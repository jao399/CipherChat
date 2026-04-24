import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { PropsWithChildren } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';

import { colors, gradients, radii, shadows, spacing, typography } from '../../theme';

type ButtonProps = PropsWithChildren<{
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}>;

export function GlowButton({ children, onPress, icon, style, disabled }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed, disabled && styles.disabled, style]}
    >
      <LinearGradient colors={gradients.purple} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primary}>
        <Text style={styles.primaryText}>{children}</Text>
        {icon ? <Ionicons name={icon} size={18} color={colors.text} /> : null}
      </LinearGradient>
    </Pressable>
  );
}

export function SecureButton({ children, onPress, icon, style, disabled }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed, disabled && styles.disabled, style]}
    >
      <LinearGradient colors={gradients.green} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.primary, styles.green]}>
        <Text style={[styles.primaryText, styles.greenText]}>{children}</Text>
        {icon ? <Ionicons name={icon} size={18} color={colors.background} /> : null}
      </LinearGradient>
    </Pressable>
  );
}

export function SecondaryButton({ children, onPress, icon, style, disabled }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.secondary,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={styles.secondaryText}>{children}</Text>
      {icon ? <Ionicons name={icon} size={17} color={colors.primaryBright} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: radii.md,
    ...shadows.purpleGlow,
  },
  primary: {
    minHeight: 52,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  green: {
    ...shadows.greenGlow,
  },
  primaryText: {
    ...typography.button,
  },
  greenText: {
    color: colors.background,
  },
  secondary: {
    minHeight: 50,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.34)',
    backgroundColor: 'rgba(17,17,26,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  secondaryText: {
    ...typography.button,
    color: colors.primaryBright,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.5,
  },
});
