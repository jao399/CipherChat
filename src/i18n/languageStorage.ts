import AsyncStorage from '@react-native-async-storage/async-storage';

import { isSupportedLanguage, type Language } from './translations';

export const LANGUAGE_STORAGE_KEY = '@cipherchat/language-v1';

type LanguageStorage = Pick<typeof AsyncStorage, 'getItem' | 'setItem' | 'removeItem'>;

export async function readStoredLanguage(storage: LanguageStorage = AsyncStorage): Promise<Language | null> {
  const value = await storage.getItem(LANGUAGE_STORAGE_KEY);
  return isSupportedLanguage(value) ? value : null;
}

export async function writeStoredLanguage(language: Language, storage: LanguageStorage = AsyncStorage): Promise<void> {
  await storage.setItem(LANGUAGE_STORAGE_KEY, language);
}

export async function clearStoredLanguage(storage: LanguageStorage = AsyncStorage): Promise<void> {
  await storage.removeItem(LANGUAGE_STORAGE_KEY);
}

