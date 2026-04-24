import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { DarkCard } from '../../components/common/DarkCard';
import { PrivacyScoreCard } from '../../components/common/PrivacyScoreCard';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { privacyMetrics } from '../../data/mockData';
import { colors, radii, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'PrivacyDashboard'>;

export function PrivacyDashboardScreen({ navigation }: Props) {
  return (
    <ScreenContainer scroll>
      <ScreenHeader title="Privacy Dashboard" subtitle="Transparency and control" back />
      <PrivacyScoreCard score={97} />
      <View style={styles.metrics}>
        {privacyMetrics.map((metric) => (
          <TouchableOpacity key={metric.id} activeOpacity={0.78} style={styles.metricRow}>
            <View style={[styles.metricIcon, { borderColor: metric.accent }]}>
              <Ionicons name={metric.icon as keyof typeof Ionicons.glyphMap} size={22} color={metric.accent} />
            </View>
            <View style={styles.metricBody}>
              <Text style={styles.metricTitle}>{metric.title}</Text>
              <Text style={styles.metricDetail}>{metric.detail}</Text>
            </View>
            <Text style={styles.metricValue}>{metric.value}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </TouchableOpacity>
        ))}
      </View>
      <DarkCard style={styles.audit}>
        <Text style={styles.auditTitle}>Future audit trail</Text>
        <Text style={styles.auditText}>
          Server events can later be audited without exposing message content, identities, or keys.
        </Text>
      </DarkCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  metrics: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(17,17,26,0.82)',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  metricRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  metricIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(25,217,142,0.08)',
  },
  metricBody: {
    flex: 1,
  },
  metricTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '800',
  },
  metricDetail: {
    ...typography.small,
  },
  metricValue: {
    ...typography.small,
    color: colors.security,
  },
  audit: {
    marginTop: spacing.xl,
  },
  auditTitle: {
    ...typography.subtitle,
    marginBottom: spacing.xs,
  },
  auditText: {
    ...typography.body,
  },
});
