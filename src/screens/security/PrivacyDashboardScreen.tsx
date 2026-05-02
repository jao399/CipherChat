import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { PrivacyScoreCard } from '../../components/common/PrivacyScoreCard';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { useLanguage } from '../../i18n';
import { privacyMetrics } from '../../data/mockData';
import { colors, radii, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'PrivacyDashboard'>;

export function PrivacyDashboardScreen({ navigation }: Props) {
  const { t, isRTL } = useLanguage();

  return (
    <ScreenContainer scroll contentContainerStyle={styles.screen}>
      <View style={styles.topBar}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Back from privacy dashboard"
          testID="privacy-dashboard-back"
          style={styles.back}
          onPress={() => navigation.goBack()}
          hitSlop={8}
        >
          <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={30} color={colors.text} />
        </TouchableOpacity>
      </View>
      <Text style={styles.screenTitle}>{t('security.privacy.title')}</Text>
      <PrivacyScoreCard score={97} />
      <View style={styles.metrics}>
        {privacyMetrics.map((metric) => (
          <TouchableOpacity
            key={metric.id}
            accessibilityRole="button"
            accessibilityLabel={`${metric.title}. ${metric.detail}. ${metric.value}.`}
            testID={`privacy-metric-${metric.id}`}
            activeOpacity={0.78}
            style={styles.metricRow}
          >
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
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'center',
  },
  topBar: {
    height: 42,
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  back: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    ...typography.subtitle,
    textAlign: 'center',
    fontSize: 26,
    marginBottom: spacing.sm,
  },
  metrics: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(17,17,26,0.82)',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xxl,
  },
  metricRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  metricIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  metricBody: {
    flex: 1,
  },
  metricTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '800',
    fontSize: 18,
  },
  metricDetail: {
    ...typography.body,
    color: colors.textSecondary,
  },
  metricValue: {
    ...typography.small,
    color: colors.security,
  },
});
