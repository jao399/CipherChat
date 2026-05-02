import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { DarkCard } from '../../components/common/DarkCard';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { SectionHeader } from '../../components/common/SectionHeader';
import { callHistory } from '../../data/mockData';
import { useLanguage } from '../../i18n';
import { colors, radii, spacing, typography } from '../../theme';

export function CallsScreen() {
  const { t, rowDirection } = useLanguage();

  return (
    <ScreenContainer scroll contentContainerStyle={styles.content}>
      <ScreenHeader title={t('calls.title')} subtitle={t('calls.subtitle')}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Start a secure call demo"
          testID="calls-start-demo"
          style={styles.iconButton}
        >
          <Ionicons name="call" size={20} color={colors.text} />
        </TouchableOpacity>
      </ScreenHeader>

      <DarkCard style={[styles.activeCard, { flexDirection: rowDirection }]}>
        <View style={styles.activeIcon}>
          <Ionicons name="videocam" size={25} color={colors.security} />
        </View>
        <View style={styles.activeText}>
          <Text style={styles.activeTitle}>{t('calls.demoReady')}</Text>
          <Text style={styles.activeSubtitle}>{t('calls.demoText')}</Text>
        </View>
      </DarkCard>

      <SectionHeader title={t('calls.recent')} />
      <View style={styles.list}>
        {callHistory.map((call) => (
          <View key={call.id} style={styles.callRow}>
            <View style={[styles.callIcon, call.type === 'missed' && styles.missedIcon]}>
              <Ionicons
                name={call.video ? 'videocam' : call.type === 'incoming' ? 'call' : 'arrow-up'}
                size={20}
                color={call.type === 'missed' ? colors.danger : colors.security}
              />
            </View>
            <View style={styles.callBody}>
              <Text style={styles.callName}>{call.name}</Text>
              <Text style={styles.callMeta}>{call.type} | {call.time} | {call.duration}</Text>
            </View>
            {call.secure ? <Ionicons name="lock-closed" size={16} color={colors.security} /> : null}
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 110,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  activeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  activeIcon: {
    width: 54,
    height: 54,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(25,217,142,0.36)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(25,217,142,0.10)',
  },
  activeText: {
    flex: 1,
  },
  activeTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '800',
  },
  activeSubtitle: {
    ...typography.small,
  },
  list: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(17,17,26,0.80)',
    paddingHorizontal: spacing.lg,
  },
  callRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  callIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(25,217,142,0.10)',
  },
  missedIcon: {
    backgroundColor: 'rgba(255,95,122,0.10)',
  },
  callBody: {
    flex: 1,
  },
  callName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '800',
  },
  callMeta: {
    ...typography.small,
  },
});
