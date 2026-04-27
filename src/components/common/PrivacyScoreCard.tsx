import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

import { colors, spacing, typography } from '../../theme';

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
        <Svg width={236} height={236} viewBox="0 0 236 236">
          {[102, 82, 62, 42].map((ring) => (
            <Circle key={ring} cx="118" cy="118" r={ring} stroke="rgba(255,255,255,0.055)" strokeWidth="1" fill="none" />
          ))}
          {[0, 30, 60, 90, 120, 150].map((angle) => {
            const radians = (Math.PI * angle) / 180;
            const x = Math.cos(radians) * 106;
            const y = Math.sin(radians) * 106;
            return (
              <Line
                key={angle}
                x1={118 - x}
                y1={118 - y}
                x2={118 + x}
                y2={118 + y}
                stroke="rgba(124,45,255,0.16)"
                strokeWidth="1"
              />
            );
          })}
          <Circle cx="118" cy="118" r="66" stroke="rgba(124,45,255,0.45)" strokeWidth="15" fill="none" />
          <Circle cx="118" cy="118" r="88" stroke="rgba(30,112,255,0.42)" strokeWidth="2" fill="none" />
          <Circle
            cx="118"
            cy="118"
            r={radius}
            stroke={colors.security}
            strokeWidth="15"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={offset}
            rotation="-90"
            origin="118, 118"
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
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  ring: {
    width: 236,
    height: 236,
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
    marginTop: -spacing.md,
    fontSize: 14,
    letterSpacing: 1.2,
  },
  score: {
    ...typography.hero,
    fontSize: 44,
    lineHeight: 52,
    marginTop: spacing.xs,
  },
  status: {
    ...typography.small,
    color: colors.security,
    textTransform: 'uppercase',
    fontSize: 15,
    letterSpacing: 1.5,
  },
  detail: {
    ...typography.body,
    color: colors.security,
    marginTop: spacing.xs,
  },
});
