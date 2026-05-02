import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';

import { AppLogo } from '../../components/common/AppLogo';
import { DarkCard } from '../../components/common/DarkCard';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { SecureBadge } from '../../components/common/SecureBadge';
import { useLanguage } from '../../i18n';
import { colors, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'About'>;

export function AboutScreen(_: Props) {
  const { t, textAlign } = useLanguage();

  return (
    <ScreenContainer scroll>
      <ScreenHeader title={t('about.title')} subtitle={t('about.subtitle')} back />
      <View style={styles.hero}>
        <AppLogo size={96} subtitle={t('settings.tagline')} />
        <SecureBadge label={t('about.badge')} tone="purple" />
      </View>
      <DarkCard style={styles.card}>
        <Text style={styles.title}>CipherChat</Text>
        <Text style={[styles.text, { textAlign }]}>{t('about.text')}</Text>
        <View style={styles.row}>
          <Text style={[styles.label, { textAlign }]}>{t('about.version')}</Text>
          <Text style={styles.value}>0.1.0 prototype</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.label, { textAlign }]}>{t('about.identity')}</Text>
          <Text style={[styles.value, { textAlign }]}>{t('about.identity.value')}</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.label, { textAlign }]}>{t('about.credit')}</Text>
          <Text style={[styles.value, { textAlign }]}>{t('about.madeBy')}</Text>
        </View>
      </DarkCard>
      <DarkCard style={styles.card}>
        <Text style={[styles.title, { textAlign }]}>{t('about.futureLinks')}</Text>
        <Text style={[styles.text, { textAlign }]}>{t('about.futureLinks.text')}</Text>
      </DarkCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: spacing.lg,
    marginVertical: spacing.xl,
  },
  card: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.subtitle,
  },
  text: {
    ...typography.body,
  },
  row: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.md,
    gap: spacing.xs,
  },
  label: {
    ...typography.small,
    color: colors.muted,
  },
  value: {
    ...typography.body,
    color: colors.text,
  },
});
