import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors, radii, spacing, typography } from '../../theme';

type PrivacyScoreCardProps = {
  score: number;
};

export function PrivacyScoreCard({ score }: PrivacyScoreCardProps) {
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <View style={styles.card}>
      <View style={styles.ring}>
        <Svg width={174} height={174} viewBox="0 0 174 174">
          <Circle cx="87" cy="87" r="80" stroke="rgba(255,255,255,0.06)" strokeWidth="1" fill="none" />
          <Circle cx="87" cy="87" r="62" stroke="rgba(139,61,255,0.24)" strokeWidth="14" fill="none" />
          <Circle
            cx="87"
            cy="87"
            r={radius}
            stroke={colors.security}
            strokeWidth="14"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={offset}
            rotation="-90"
            origin="87, 87"
          />
        </Svg>
        <View style={styles.shield}>
          <Ionicons name="shield-checkmark" size={54} color={colors.primaryBright} />
        </View>
      </View>
      <Text style={styles.label}>Your Privacy Score</Text>
      <Text style={styles.score}>{score}%</Text>
      <Text style={styles.status}>Excellent</Text>
      <Text style={styles.detail}>Keep it up. You're protected.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.22)',
    backgroundColor: 'rgba(17,17,26,0.86)',
    padding: spacing.xl,
    alignItems: 'center',
  },
  ring: {
    width: 174,
    height: 174,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shield: {
    position: 'absolute',
  },
  label: {
    ...typography.small,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  score: {
    ...typography.hero,
    marginTop: spacing.xs,
  },
  status: {
    ...typography.small,
    color: colors.security,
    textTransform: 'uppercase',
  },
  detail: {
    ...typography.small,
    color: colors.security,
    marginTop: spacing.xs,
  },
});
