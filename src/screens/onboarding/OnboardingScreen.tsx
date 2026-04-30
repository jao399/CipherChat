import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { GlowButton } from '../../components/common/Buttons';
import { LogoMark } from '../../components/common/LogoMark';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { ONBOARDING_STORAGE_KEY } from '../../constants/storage';
import { onboardingSlides } from '../../data/mockData';
import { colors, gradients, radii, spacing, typography } from '../../theme';
import type { OnboardingSlide } from '../../types';
import {
  getNextOnboardingIndex,
  getOnboardingCtaLabel,
  isFinalOnboardingSlide,
} from '../../utils/onboardingNavigation';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

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
    <ScreenContainer padded={false}>
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <LogoMark size={30} />
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
        >
          <Text style={styles.skip}>Skip</Text>
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
    </ScreenContainer>
  );
}

function OnboardingSlideView({ slide, width }: { slide: OnboardingSlide; width: number }) {
  return (
    <View style={[styles.slide, { width }]}>
      <LinearGradient colors={gradients.card} style={styles.hero}>
        <View style={styles.orbit}>
          <View style={styles.orbitRing} />
          <LogoMark size={118} />
          <View style={styles.floatingIcon}>
            <Ionicons name={slide.icon as keyof typeof Ionicons.glyphMap} size={26} color={colors.security} />
          </View>
        </View>
      </LinearGradient>
      <Text style={styles.title}>{slide.title}</Text>
      <Text style={styles.text}>{slide.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    minHeight: 56,
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
  },
  logoPurple: {
    color: colors.primaryBright,
  },
  skip: {
    ...typography.small,
    color: colors.textSecondary,
  },
  slide: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    width: '100%',
    maxWidth: 330,
    height: 310,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxxl,
  },
  orbit: {
    width: 210,
    height: 210,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitRing: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.58)',
  },
  floatingIcon: {
    position: 'absolute',
    right: 18,
    bottom: 26,
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: 'rgba(25,217,142,0.46)',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.title,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  text: {
    ...typography.body,
    textAlign: 'center',
    maxWidth: 330,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  dots: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  activeDot: {
    width: 22,
    backgroundColor: colors.primaryBright,
  },
});
