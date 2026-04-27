import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';

import { GlowButton, SecondaryButton } from '../../components/common/Buttons';
import { LogoMark } from '../../components/common/LogoMark';
import { colors, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

const welcomeHero = require('../../assets/images/welcome-hero.png');

export function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <ImageBackground source={welcomeHero} resizeMode="cover" style={styles.hero}>
          <LinearGradient colors={['rgba(5,5,9,0.05)', 'rgba(5,5,9,0.12)', '#050509']} style={styles.heroFade} />
        </ImageBackground>

        <View style={styles.brand}>
          <LogoMark size={78} />
          <Text style={styles.title}>
            Cipher<Text style={styles.titlePurple}>Chat</Text>
          </Text>
          <Text style={styles.text}>Private messaging.{'\n'}Reimagined for a safer world.</Text>
          <View style={styles.dots}>
            {[0, 1, 2, 3].map((dot) => (
              <View key={dot} style={[styles.dot, dot === 0 && styles.activeDot]} />
            ))}
          </View>
        </View>

        <View style={styles.actions}>
          <GlowButton
            accessibilityLabel="Create a CipherChat account"
            testID="welcome-get-started"
            onPress={() => navigation.navigate('SignUp')}
          >
            GET STARTED
          </GlowButton>
          <SecondaryButton
            accessibilityLabel="Sign in to an existing CipherChat account"
            testID="welcome-sign-in"
            onPress={() => navigation.navigate('SignIn')}
          >
            I ALREADY HAVE AN ACCOUNT
          </SecondaryButton>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  hero: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '62%',
    overflow: 'hidden',
  },
  heroFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    height: '100%',
  },
  brand: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xxxl,
  },
  title: {
    ...typography.hero,
    fontSize: 40,
    lineHeight: 48,
    textAlign: 'center',
  },
  titlePurple: {
    color: colors.primary,
  },
  text: {
    ...typography.body,
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 31,
    maxWidth: 330,
    marginTop: spacing.sm,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xxxl,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#30313C',
  },
  activeDot: {
    backgroundColor: colors.primary,
  },
  actions: {
    gap: spacing.md,
    width: '100%',
  },
});
