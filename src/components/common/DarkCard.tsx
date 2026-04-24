import type { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { colors, radii, shadows, spacing } from '../../theme';

type DarkCardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

export function DarkCard({ children, style }: DarkCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function GlassCard({ children, style }: DarkCardProps) {
  return <View style={[styles.glass, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    ...shadows.card,
  },
  glass: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.24)',
    backgroundColor: colors.surfaceGlass,
    padding: spacing.lg,
    ...shadows.purpleGlow,
  },
});
