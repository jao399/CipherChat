import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '../../theme';

type EmptyStateProps = {
  title: string;
  text: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function EmptyState({ title, text, icon = 'lock-closed' }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={28} color={colors.primaryBright} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.huge,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 62,
    height: 62,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.36)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139,61,255,0.10)',
  },
  title: {
    ...typography.subtitle,
  },
  text: {
    ...typography.body,
    textAlign: 'center',
  },
});
