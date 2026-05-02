import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

import { colors, spacing, typography } from '../../theme';
import { useLanguage } from '../../i18n';

type SettingRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  testID?: string;
};

export function SettingRow({ icon, title, subtitle, onPress, value, onValueChange, testID }: SettingRowProps) {
  const { textAlign, rowDirection, isRTL } = useLanguage();
  const hasSwitch = typeof value === 'boolean';

  return (
    <TouchableOpacity
      accessibilityRole={hasSwitch ? 'switch' : 'button'}
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      accessibilityState={hasSwitch ? { checked: value } : undefined}
      activeOpacity={0.78}
      onPress={hasSwitch && onValueChange ? () => onValueChange(!value) : onPress}
      style={[styles.row, { flexDirection: rowDirection }]}
      testID={testID}
      disabled={!onPress && !hasSwitch}
    >
      <View style={styles.icon}>
        <Ionicons name={icon} size={21} color={colors.security} />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.title, { textAlign }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { textAlign }]}>{subtitle}</Text> : null}
      </View>
      {hasSwitch ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          accessibilityLabel={title}
          trackColor={{ true: colors.primary, false: colors.border }}
          thumbColor={value ? colors.text : colors.muted}
        />
      ) : (
        <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.muted} />
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
