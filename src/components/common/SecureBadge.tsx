import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '../../theme';

type SecureBadgeProps = {
  label?: string;
  tone?: 'green' | 'purple';
};

export function SecureBadge({ label = 'Verified', tone = 'green' }: SecureBadgeProps) {
  const isGreen = tone === 'green';

  return (
    <View style={[styles.badge, isGreen ? styles.green : styles.purple]}>
      <Ionicons
        name={isGreen ? 'shield-checkmark' : 'lock-closed'}
        size={11}
        color={isGreen ? colors.security : colors.primaryBright}
      />
      <Text style={[styles.label, isGreen ? styles.greenText : styles.purpleText]}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xxs,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderWidth: 1,
  },
  green: {
    backgroundColor: 'rgba(25,217,142,0.10)',
    borderColor: 'rgba(25,217,142,0.30)',
  },
  purple: {
    backgroundColor: 'rgba(139,61,255,0.12)',
    borderColor: 'rgba(168,85,247,0.34)',
  },
  label: {
    ...typography.small,
    fontSize: 9,
    lineHeight: 11,
    letterSpacing: 0.2,
  },
  greenText: {
    color: colors.security,
  },
  purpleText: {
    color: colors.primaryBright,
  },
});
