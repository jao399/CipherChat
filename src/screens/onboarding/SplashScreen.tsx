import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CircuitBackground } from '../../components/splash/CircuitBackground';
import { EncryptedCoreLogo } from '../../components/splash/EncryptedCoreLogo';
import { EncryptedParticleField } from '../../components/splash/EncryptedParticleField';
import { encryptedSplash } from '../../constants/splash';
import type { RootStackParamList } from '../../navigation/types';
import { resolvePostSplashRoute } from '../../utils/startupRoute';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export function SplashScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const gridOpacity = useRef(new Animated.Value(0)).current;
  const particleProgress = useRef(new Animated.Value(0)).current;
  const logoProgress = useRef(new Animated.Value(0)).current;
  const pulseProgress = useRef(new Animated.Value(0)).current;
  const textProgress = useRef(new Animated.Value(0)).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let active = true;

    const routeToNextScreen = async () => {
      const nextRoute = await resolvePostSplashRoute();
      if (active) {
        navigation.replace(nextRoute);
      }
    };

    Animated.sequence([
      Animated.timing(gridOpacity, {
        toValue: 1,
        duration: encryptedSplash.timing.gridFadeIn,
        useNativeDriver: true,
      }),
      Animated.timing(particleProgress, {
        toValue: 1,
        duration: encryptedSplash.timing.particlesIn,
        useNativeDriver: true,
      }),
      Animated.timing(logoProgress, {
        toValue: 1,
        duration: encryptedSplash.timing.logoAssemble,
        useNativeDriver: true,
      }),
      Animated.timing(pulseProgress, {
        toValue: 1,
        duration: encryptedSplash.timing.logoPulse,
        useNativeDriver: true,
      }),
      Animated.timing(textProgress, {
        toValue: 1,
        duration: encryptedSplash.timing.textFadeIn,
        useNativeDriver: true,
      }),
      Animated.delay(encryptedSplash.timing.holdBeforeExit),
      Animated.timing(exitOpacity, {
        toValue: 0,
        duration: encryptedSplash.timing.fadeOut,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        void routeToNextScreen();
      }
    });

    return () => {
      active = false;
      gridOpacity.stopAnimation();
      particleProgress.stopAnimation();
      logoProgress.stopAnimation();
      pulseProgress.stopAnimation();
      textProgress.stopAnimation();
      exitOpacity.stopAnimation();
    };
  }, [exitOpacity, gridOpacity, logoProgress, navigation, particleProgress, pulseProgress, textProgress]);

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.scene, { opacity: exitOpacity }]}>
        <CircuitBackground opacity={gridOpacity} />
        <EncryptedParticleField progress={particleProgress} width={width} height={height} />
        <SafeAreaView style={styles.safe}>
          <View style={styles.center}>
            <EncryptedCoreLogo
              logoProgress={logoProgress}
              pulseProgress={pulseProgress}
              textProgress={textProgress}
            />
          </View>
          <Animated.View style={[styles.signatureWrap, { opacity: textProgress }]}>
            <Text style={styles.signature}>{encryptedSplash.text.signature}</Text>
            <Text style={styles.copyright}>{encryptedSplash.text.copyright}</Text>
          </Animated.View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: encryptedSplash.colors.background,
  },
  scene: {
    flex: 1,
    backgroundColor: encryptedSplash.colors.background,
    overflow: 'hidden',
  },
  safe: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  signatureWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 28,
    alignItems: 'center',
  },
  signature: {
    color: encryptedSplash.colors.whiteText,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    opacity: 0.9,
  },
  copyright: {
    color: encryptedSplash.colors.mutedText,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    marginTop: 3,
    opacity: 0.74,
  },
});
