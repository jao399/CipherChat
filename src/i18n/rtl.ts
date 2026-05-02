import { I18nManager } from 'react-native';

import type { Language } from './translations';

export function isArabic(language: Language) {
  return language === 'ar';
}

export function isRTL(language: Language) {
  return isArabic(language);
}

export function rtlTextAlign(language: Language) {
  return isRTL(language) ? 'right' : 'left';
}

export function rtlRowDirection(language: Language) {
  return isRTL(language) ? 'row-reverse' : 'row';
}

export function maybeRtlIcon(icon: 'chevron-back' | 'chevron-forward', language: Language) {
  if (!isRTL(language)) {
    return icon;
  }

  return icon === 'chevron-back' ? 'chevron-forward' : 'chevron-back';
}

export function configureRtlForLanguage(language: Language) {
  const nextRtl = isRTL(language);
  I18nManager.allowRTL(true);

  if (I18nManager.isRTL !== nextRtl) {
    I18nManager.forceRTL(nextRtl);
    return { restartRecommended: true };
  }

  return { restartRecommended: false };
}

