import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlowButton } from '../../components/common/Buttons';
import { LogoMark } from '../../components/common/LogoMark';
import { ONBOARDING_STORAGE_KEY } from '../../constants/storage';
import { onboardingSlides } from '../../data/mockData';
import { colors, radii, spacing, typography } from '../../theme';
import type { OnboardingSlide } from '../../types';
import {
  getNextOnboardingIndex,
  getOnboardingCtaLabel,
  isFinalOnboardingSlide,
} from '../../utils/onboardingNavigation';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const welcomeHero = require('../../assets/images/welcome-hero.png');

export function OnboardingScreen({ navigation }: Props) {
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<OnboardingSlide>>(null);
  const { width: slideWidth } = useWindowDimensions();
  const isLastSlide = isFinalOnboardingSlide(index, onboardingSlides.length);
  const ctaLabel = getOnboardingCtaLabel(index, onboardingSlides.length);

  const finish = async () => {
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    navigation.replace('Welcome');
  };

  const next = () => {
    if (index === onboardingSlides.length - 1) {
      void finish();
      return;
    }
    const nextIndex = getNextOnboardingIndex(index, onboardingSlides.length);
    setIndex(nextIndex);
    listRef.current?.scrollToOffset({ offset: slideWidth * nextIndex, animated: true });
  };

  const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / Math.max(1, slideWidth));
    setIndex(Math.min(onboardingSlides.length - 1, Math.max(0, nextIndex)));
  };

  const keyExtractor = useCallback((item: OnboardingSlide) => item.id, []);

  const renderSlide = useCallback(
    ({ item }: { item: OnboardingSlide }) => <OnboardingSlideView slide={item} width={slideWidth} />,
    [slideWidth],
  );

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#020205', colors.background, '#090515']} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={styles.gridLayer}>
        {Array.from({ length: 8 }).map((_, gridIndex) => (
          <View key={`grid-v-${gridIndex}`} style={[styles.gridLineVertical, { left: `${(gridIndex + 1) * 11}%` }]} />
        ))}
        {Array.from({ length: 8 }).map((_, gridIndex) => (
          <View key={`grid-h-${gridIndex}`} style={[styles.gridLineHorizontal, { top: `${(gridIndex + 1) * 11}%` }]} />
        ))}
      </View>
      <View pointerEvents="none" style={styles.deepGlow} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <View style={styles.headerBrand}>
            <LogoMark size={28} />
            <Text style={styles.logoText}>
              Cipher<Text style={styles.logoPurple}>Chat</Text>
            </Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
            testID="onboarding-skip"
            onPress={finish}
            hitSlop={8}
            style={styles.skipButton}
          >
            <Text style={styles.skip}>SKIP</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          ref={listRef}
          data={onboardingSlides}
          keyExtractor={keyExtractor}
          renderItem={renderSlide}
          horizontal
          pagingEnabled
          bounces={false}
          decelerationRate="fast"
          getItemLayout={(_, itemIndex) => ({
            length: slideWidth,
            offset: slideWidth * itemIndex,
            index: itemIndex,
          })}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => {
              listRef.current?.scrollToIndex({ index: info.index, animated: true });
            }, 80);
          }}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumScrollEnd}
        />

        <View style={styles.footer}>
          <View style={styles.dots}>
            {onboardingSlides.map((slide, dotIndex) => (
              <View
                key={slide.id}
                testID={`onboarding-dot-${dotIndex}`}
                style={[styles.dot, dotIndex === index && styles.activeDot]}
              />
            ))}
          </View>
          <GlowButton
            accessibilityLabel={isLastSlide ? 'Finish onboarding' : 'Next onboarding slide'}
            testID={isLastSlide ? 'onboarding-get-started' : 'onboarding-next'}
            onPress={next}
            icon={isLastSlide ? 'arrow-forward' : 'chevron-forward'}
          >
            {ctaLabel}
          </GlowButton>
        </View>
      </SafeAreaView>
    </View>
  );
}

function OnboardingSlideView({ slide, width }: { slide: OnboardingSlide; width: number }) {
  return (
    <View style={[styles.slide, { width }]}>
      <View style={styles.heroFrame}>
        <Image source={welcomeHero} resizeMode="contain" style={styles.heroArtwork} />
        <LinearGradient
          colors={['rgba(5,5,9,0.00)', 'rgba(5,5,9,0.06)', 'rgba(5,5,9,0.70)']}
          locations={[0, 0.58, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View pointerEvents="none" style={styles.heroArc} />
        <View style={styles.floatingIcon}>
          <Ionicons name={slide.icon as keyof typeof Ionicons.glyphMap} size={22} color={colors.primaryBright} />
        </View>
      </View>
      <View style={styles.copyPanel}>
        <View style={styles.slideLogo}>
          <LogoMark size={52} />
        </View>
        <Text testID={`onboarding-title-${slide.id}`} style={styles.title}>{slide.title}</Text>
        <Text style={styles.text}>{slide.text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safe: {
    flex: 1,
  },
  gridLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.13,
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(168,85,247,0.35)',
  },
  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(168,85,247,0.26)',
  },
  deepGlow: {
    position: 'absolute',
    top: 66,
    alignSelf: 'center',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(124,45,255,0.22)',
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoText: {
    ...typography.subtitle,
    color: colors.text,
    letterSpacing: 0,
  },
  logoPurple: {
    color: colors.primaryBright,
  },
  skipButton: {
    minWidth: 54,
    minHeight: 34,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.22)',
    backgroundColor: 'rgba(10,10,18,0.58)',
  },
  skip: {
    ...typography.small,
    color: colors.primaryBright,
    fontWeight: '800',
  },
  slide: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  heroFrame: {
    width: '100%',
    maxWidth: 348,
    height: 390,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.30)',
    backgroundColor: colors.surface,
    shadowColor: colors.primaryBright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 26,
    elevation: 12,
  },
  heroArtwork: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroArc: {
    position: 'absolute',
    top: 64,
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.42)',
    shadowColor: colors.primaryBright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 18,
  },
  floatingIcon: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.50)',
    backgroundColor: 'rgba(10,10,18,0.86)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyPanel: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    marginTop: spacing.xxxl,
  },
  slideLogo: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    backgroundColor: 'rgba(124,45,255,0.14)',
    shadowColor: colors.primaryBright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.52,
    shadowRadius: 18,
  },
  title: {
    ...typography.title,
    fontSize: 28,
    lineHeight: 34,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  text: {
    ...typography.body,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 330,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  dots: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(156,163,175,0.34)',
  },
  activeDot: {
    width: 24,
    backgroundColor: colors.primaryBright,
  },
});
