import { Animated, Image, StyleSheet, Text, View } from 'react-native';

import { LogoMark } from '../common/LogoMark';
import { encryptedSplash } from '../../constants/splash';

const splashLogoGif = require('../../../assets/cipherchat-splash.gif');

type EncryptedCoreLogoProps = {
  logoProgress: Animated.Value;
  pulseProgress: Animated.Value;
  textProgress: Animated.Value;
};

export function EncryptedCoreLogo({
  logoProgress,
  pulseProgress,
  textProgress,
}: EncryptedCoreLogoProps) {
  const logoOpacity = logoProgress.interpolate({
    inputRange: [0, 0.28, 1],
    outputRange: [0, 0.35, 1],
  });
  const logoScale = logoProgress.interpolate({
    inputRange: [0, 0.65, 1],
    outputRange: [0.72, 1.08, 1],
  });
  const coreGlowOpacity = pulseProgress.interpolate({
    inputRange: [0, 0.24, 0.7, 1],
    outputRange: [0, 0.9, 0.35, 0],
  });
  const coreGlowScale = pulseProgress.interpolate({
    inputRange: [0, 0.38, 1],
    outputRange: [0.82, 1.22, 1.5],
  });
  const ringOpacity = pulseProgress.interpolate({
    inputRange: [0, 0.25, 1],
    outputRange: [0, 0.52, 0],
  });
  const ringScale = pulseProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 2.15],
  });
  const textOpacity = textProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const textTranslateY = textProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.pulseRing,
          {
            opacity: ringOpacity,
            transform: [{ scale: ringScale }],
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.coreGlow,
          {
            opacity: coreGlowOpacity,
            transform: [{ scale: coreGlowScale }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.logoShell,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Image
          source={splashLogoGif}
          style={styles.logoGifBackdrop}
          resizeMode="contain"
          accessibilityLabel="CipherChat animated splash logo"
        />
        <View style={styles.logoMarkOverlay}>
          <LogoMark size={124} />
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.copy,
          {
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }],
          },
        ]}
      >
        <Text style={styles.title}>
          Cipher<Text style={styles.titlePurple}>Chat</Text>
        </Text>
        <Text style={styles.tagline}>{encryptedSplash.text.tagline}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    top: -18,
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1,
    borderColor: encryptedSplash.colors.glowPurple,
  },
  coreGlow: {
    position: 'absolute',
    top: 29,
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: 'rgba(168,85,247,0.26)',
    shadowColor: encryptedSplash.colors.glowPurple,
    shadowOpacity: 0.9,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
  },
  logoShell: {
    width: 178,
    height: 178,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGifBackdrop: {
    position: 'absolute',
    width: 178,
    height: 178,
    opacity: 0.62,
  },
  logoMarkOverlay: {
    width: 136,
    height: 136,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    alignItems: 'center',
    marginTop: 18,
  },
  title: {
    color: encryptedSplash.colors.whiteText,
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '800',
  },
  titlePurple: {
    color: encryptedSplash.colors.primaryPurple,
  },
  tagline: {
    color: encryptedSplash.colors.mutedText,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    marginTop: 5,
  },
});
