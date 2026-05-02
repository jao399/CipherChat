import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../../theme';
import { useLanguage } from '../../i18n';

type SectionHeaderProps = {
  title: string;
  action?: string;
};

export function SectionHeader({ title, action }: SectionHeaderProps) {
  const { textAlign, rowDirection } = useLanguage();

  return (
    <View style={[styles.row, { flexDirection: rowDirection }]}>
      <Text style={[styles.title, { textAlign }]}>{title}</Text>
      {action ? <Text style={[styles.action, { textAlign }]}>{action}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.subtitle,
    fontSize: 17,
  },
  action: {
    ...typography.small,
    color: colors.primaryBright,
  },
});
