import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../../theme';
import { LogoMark } from './LogoMark';

type AppLogoProps = {
  size?: number;
  variant?: 'horizontal' | 'stacked' | 'mark';
  subtitle?: string;
};

export function AppLogo({ size = 70, variant = 'stacked', subtitle }: AppLogoProps) {
  if (variant === 'mark') {
    return <LogoMark size={size} />;
  }

  const isHorizontal = variant === 'horizontal';

  return (
    <View style={[styles.container, isHorizontal && styles.horizontal]}>
      <LogoMark size={size} />
      <View style={isHorizontal ? styles.wordmarkLeft : styles.wordmarkCenter}>
        <Text style={[styles.wordmark, isHorizontal && styles.wordmarkSmall]}>
          Cipher<Text style={styles.purple}>Chat</Text>
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.md,
  },
  horizontal: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  wordmarkCenter: {
    alignItems: 'center',
  },
  wordmarkLeft: {
    alignItems: 'flex-start',
  },
  wordmark: {
    ...typography.title,
    fontSize: 32,
  },
  wordmarkSmall: {
    fontSize: 26,
  },
  purple: {
    color: colors.primaryBright,
  },
  subtitle: {
    ...typography.small,
    marginTop: spacing.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
