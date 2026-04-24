import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
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

import { GlowButton, SecondaryButton } from '../../components/common/Buttons';
import { LogoMark } from '../../components/common/LogoMark';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { ONBOARDING_STORAGE_KEY } from '../../constants/storage';
import { onboardingSlides } from '../../data/mockData';
import { colors, gradients, radii, spacing, typography } from '../../theme';
import type { OnboardingSlide } from '../../types';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export function OnboardingScreen({ navigation }: Props) {
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<OnboardingSlide>>(null);
  const { width: windowWidth } = useWindowDimensions();
  const slideWidth = Math.min(windowWidth, 480);

  const finish = async () => {
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    navigation.replace('Welcome');
  };

  const next = () => {
    if (index === onboardingSlides.length - 1) {
      void finish();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / slideWidth);
    setIndex(nextIndex);
  };

  return (
    <ScreenContainer padded={false}>
      <View style={styles.header}>
        <Text style={styles.logoText}>
          Cipher<Text style={styles.logoPurple}>Chat</Text>
        </Text>
        <TouchableOpacity onPress={finish} hitSlop={8}>
          <Text style={styles.skip}>Skip</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        data={onboardingSlides}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <OnboardingSlideView slide={item} width={slideWidth} />}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {onboardingSlides.map((slide, dotIndex) => (
            <View key={slide.id} style={[styles.dot, dotIndex === index && styles.activeDot]} />
          ))}
        </View>
        <GlowButton onPress={next} icon={index === onboardingSlides.length - 1 ? 'arrow-forward' : 'chevron-forward'}>
          {index === onboardingSlides.length - 1 ? 'Get Started' : 'Next'}
        </GlowButton>
        {index < onboardingSlides.length - 1 ? (
          <SecondaryButton onPress={finish}>Start Now</SecondaryButton>
        ) : null}
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
