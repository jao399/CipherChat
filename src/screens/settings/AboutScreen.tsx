import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';

import { AppLogo } from '../../components/common/AppLogo';
import { DarkCard } from '../../components/common/DarkCard';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { SecureBadge } from '../../components/common/SecureBadge';
import { colors, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'About'>;

export function AboutScreen(_: Props) {
  return (
    <ScreenContainer scroll>
      <ScreenHeader title="About CipherChat" subtitle="Private messaging identity" back />
      <View style={styles.hero}>
        <AppLogo size={96} subtitle="Secure. Private. Yours alone." />
        <SecureBadge label="UI prototype" tone="purple" />
      </View>
      <DarkCard style={styles.card}>
        <Text style={styles.title}>CipherChat</Text>
        <Text style={styles.text}>
          A premium Expo React Native prototype for a future end-to-end encrypted messaging product.
        </Text>
        <View style={styles.row}>
          <Text style={styles.label}>Version</Text>
          <Text style={styles.value}>0.1.0 prototype</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Identity</Text>
          <Text style={styles.value}>Zero-knowledge messaging UI</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Credit</Text>
          <Text style={styles.value}>Made by Amgad Alzomi</Text>
        </View>
      </DarkCard>
      <DarkCard style={styles.card}>
        <Text style={styles.title}>Future Links</Text>
        <Text style={styles.text}>Security whitepaper, audit reports, privacy policy, and source code links can live here.</Text>
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
