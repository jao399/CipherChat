import AsyncStorage from '@react-native-async-storage/async-storage';

import { ONBOARDING_STORAGE_KEY } from '../constants/storage';
import { readStoredLanguage } from '../i18n/languageStorage';

type StartupStorage = Pick<typeof AsyncStorage, 'getItem' | 'setItem' | 'removeItem'>;
export type PostSplashRoute = 'LanguageSelection' | 'Onboarding' | 'Welcome';

export async function resolvePostSplashRoute(
  storage: StartupStorage = AsyncStorage,
): Promise<PostSplashRoute> {
  const language = await readStoredLanguage(storage);

  if (!language) {
    return 'LanguageSelection';
  }

  const completed = await storage.getItem(ONBOARDING_STORAGE_KEY);
  return completed ? 'Welcome' : 'Onboarding';
}
