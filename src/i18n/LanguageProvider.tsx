import type { PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { configureRtlForLanguage, isRTL as getIsRTL, rtlRowDirection, rtlTextAlign } from './rtl';
import { readStoredLanguage, writeStoredLanguage } from './languageStorage';
import { translate, type Language, type TranslationKey } from './translations';

type LanguageContextValue = {
  language: Language;
  isReady: boolean;
  isRTL: boolean;
  setLanguage: (language: Language) => Promise<{ restartRecommended: boolean }>;
  t: (key: TranslationKey) => string;
  textAlign: 'left' | 'right';
  rowDirection: 'row' | 'row-reverse';
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: PropsWithChildren) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isReady, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    void readStoredLanguage()
      .then((stored) => {
        if (!mounted) {
          return;
        }

        const nextLanguage = stored ?? 'en';
        setLanguageState(nextLanguage);
        configureRtlForLanguage(nextLanguage);
      })
      .finally(() => {
        if (mounted) {
          setReady(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const setLanguage = useCallback(async (nextLanguage: Language) => {
    await writeStoredLanguage(nextLanguage);
    const rtlResult = configureRtlForLanguage(nextLanguage);
    setLanguageState(nextLanguage);
    return rtlResult;
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      isReady,
      isRTL: getIsRTL(language),
      setLanguage,
      t: (key) => translate(language, key),
      textAlign: rtlTextAlign(language),
      rowDirection: rtlRowDirection(language),
    }),
    [isReady, language, setLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider');
  }

  return context;
}

