import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { AppLogo } from '../../components/common/AppLogo';
import { GlowButton, SecondaryButton } from '../../components/common/Buttons';
import { LogoMark } from '../../components/common/LogoMark';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { colors, gradients, radii, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  return (
    <ScreenContainer>
      <View style={styles.content}>
        <View style={styles.heroWrap}>
          <LinearGradient colors={gradients.card} style={styles.hero}>
            <View style={styles.moon} />
            <View style={styles.tower}>
              <View style={styles.spire} />
              <View style={styles.towerBody} />
              <View style={styles.towerBase} />
            </View>
            <View style={styles.logoFloat}>
              <LogoMark size={76} />
            </View>
          </LinearGradient>
        </View>

        <View style={styles.brand}>
          <AppLogo size={64} variant="horizontal" />
          <Text style={styles.title}>Secure. Private. Yours alone.</Text>
          <Text style={styles.text}>Zero-knowledge messaging for a world that values privacy.</Text>
        </View>

        <View style={styles.actions}>
          <GlowButton onPress={() => navigation.navigate('SignUp')} icon="arrow-forward">
            Get Started
          </GlowButton>
          <SecondaryButton onPress={() => navigation.navigate('SignIn')} icon="log-in">
            I Already Have an Account
          </SecondaryButton>
        </View>

        <Text style={styles.credit}>Made by Amgad Alzomi</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: spacing.lg,
    gap: spacing.xl,
  },
  heroWrap: {
    alignItems: 'center',
  },
  hero: {
    width: '100%',
    maxWidth: 342,
    height: 300,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.24)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  moon: {
    position: 'absolute',
    top: 28,
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 2,
    borderColor: colors.primaryBright,
    opacity: 0.58,
    shadowColor: colors.primaryBright,
    shadowOpacity: 0.9,
    shadowRadius: 22,
  },
  tower: {
    alignItems: 'center',
    marginBottom: 42,
  },
  spire: {
    width: 3,
    height: 72,
    backgroundColor: colors.primaryBright,
  },
  towerBody: {
    width: 72,
    height: 92,
    backgroundColor: 'rgba(91,33,182,0.86)',
    borderTopLeftRadius: radii.sm,
    borderTopRightRadius: radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.36)',
  },
  towerBase: {
    width: 176,
    height: 42,
    backgroundColor: 'rgba(10,8,18,0.94)',
    borderTopLeftRadius: radii.md,
    borderTopRightRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.28)',
  },
  logoFloat: {
    position: 'absolute',
    bottom: 22,
    width: 86,
    height: 86,
    borderRadius: radii.md,
    backgroundColor: 'rgba(7,7,11,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    ...typography.hero,
    textAlign: 'center',
  },
  text: {
    ...typography.body,
    textAlign: 'center',
    maxWidth: 310,
  },
  actions: {
    gap: spacing.md,
  },
  credit: {
    ...typography.small,
    color: colors.muted,
    textAlign: 'center',
  },
});
