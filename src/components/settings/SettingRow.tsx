import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

import { colors, spacing, typography } from '../../theme';

type SettingRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
};

export function SettingRow({ icon, title, subtitle, onPress, value, onValueChange }: SettingRowProps) {
  const hasSwitch = typeof value === 'boolean';

  return (
    <TouchableOpacity activeOpacity={0.78} onPress={onPress} style={styles.row} disabled={!onPress && !hasSwitch}>
      <View style={styles.icon}>
        <Ionicons name={icon} size={21} color={colors.security} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {hasSwitch ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ true: colors.primary, false: colors.border }}
          thumbColor={value ? colors.text : colors.muted}
        />
      ) : (
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  icon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.body,
    color: colors.text,
    fontWeight: '800',
  },
  subtitle: {
    ...typography.small,
  },
});
