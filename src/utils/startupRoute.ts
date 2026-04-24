import AsyncStorage from '@react-native-async-storage/async-storage';

import { ONBOARDING_STORAGE_KEY } from '../constants/storage';

export async function resolvePostSplashRoute() {
  const completed = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
  return completed ? 'Welcome' : 'Onboarding';
}
