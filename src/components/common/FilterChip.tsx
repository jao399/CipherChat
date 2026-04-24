import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radii, spacing, typography } from '../../theme';

type FilterChipProps = {
  label: string;
  active?: boolean;
  onPress?: () => void;
};

export function FilterChip({ label, active, onPress }: FilterChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, active && styles.active, pressed && styles.pressed]}
    >
      <Text style={[styles.text, active && styles.activeText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 34,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  active: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryBright,
  },
  text: {
    ...typography.small,
    color: colors.textSecondary,
  },
  activeText: {
    color: colors.text,
  },
  pressed: {
    opacity: 0.78,
  },
});
