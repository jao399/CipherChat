import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LogoMark } from '../../components/common/LogoMark';
import { useLanguage, type Language } from '../../i18n';
import { colors, radii, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'LanguageSelection'>;

const options: Array<{ language: Language; labelKey: 'language.english' | 'language.arabic'; subtitle: string }> = [
  { language: 'en', labelKey: 'language.english', subtitle: 'English interface' },
  { language: 'ar', labelKey: 'language.arabic', subtitle: 'واجهة عربية باتجاه RTL' },
];

export function LanguageSelectionScreen({ navigation }: Props) {
  const { setLanguage, t, textAlign, rowDirection } = useLanguage();

  const chooseLanguage = async (language: Language) => {
    await setLanguage(language);
    navigation.replace('Onboarding');
  };

  return (
    <View style={styles.root} testID="language-selection-screen">
      <LinearGradient colors={['#020205', colors.background, '#090515']} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={styles.deepGlow} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.brand}>
          <LogoMark size={72} />
          <Text style={styles.logo}>
            Cipher<Text style={styles.logoPurple}>Chat</Text>
          </Text>
        </View>

        <View style={styles.card}>
          <View style={[styles.titleRow, { flexDirection: rowDirection }]}>
            <View style={styles.iconWrap}>
              <Ionicons name="language" size={24} color={colors.primaryBright} />
            </View>
            <View style={styles.copy}>
              <Text style={[styles.title, { textAlign }]}>{t('language.title')}</Text>
              <Text style={[styles.subtitle, { textAlign }]}>{t('language.subtitle')}</Text>
            </View>
          </View>

          <View style={styles.options}>
            {options.map((option) => (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={t(option.labelKey)}
                testID={`language-option-${option.language}`}
                key={option.language}
                style={[styles.option, { flexDirection: rowDirection }]}
                activeOpacity={0.82}
                onPress={() => void chooseLanguage(option.language)}
              >
                <View style={styles.optionIcon}>
                  <Ionicons
                    name={option.language === 'ar' ? 'globe' : 'shield-checkmark'}
                    size={22}
                    color={colors.security}
                  />
                </View>
                <View style={styles.optionCopy}>
                  <Text style={[styles.optionLabel, { textAlign }]}>{t(option.labelKey)}</Text>
                  <Text style={[styles.optionSubtitle, { textAlign }]}>{option.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.primaryBright} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={[styles.honestNote, { textAlign }]}>{t('security.warning.notProductionReady')}</Text>
      </SafeAreaView>
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
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  deepGlow: {
    position: 'absolute',
    top: 90,
    alignSelf: 'center',
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor: 'rgba(124,45,255,0.22)',
  },
  brand: {
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xxxl,
  },
  logo: {
    ...typography.hero,
    fontSize: 39,
    lineHeight: 45,
  },
  logoPurple: {
    color: colors.primaryBright,
  },
  card: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.34)',
    backgroundColor: 'rgba(17,17,26,0.84)',
    padding: spacing.xl,
    gap: spacing.xl,
    shadowColor: colors.primaryBright,
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  titleRow: {
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.40)',
    backgroundColor: 'rgba(124,45,255,0.14)',
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.title,
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  options: {
    gap: spacing.md,
  },
  option: {
    minHeight: 78,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(10,10,18,0.82)',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  optionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(25,217,142,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCopy: {
    flex: 1,
    gap: 3,
  },
  optionLabel: {
    ...typography.body,
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  optionSubtitle: {
    ...typography.small,
    color: colors.textSecondary,
  },
  honestNote: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xl,
  },
});

