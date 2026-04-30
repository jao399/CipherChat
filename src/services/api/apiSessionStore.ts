import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import {
  API_SESSION_ACCOUNT_ID_KEY,
  API_SESSION_DEVICE_ID_KEY,
  API_SESSION_TOKEN_KEY,
} from '../../config/api';

export type StoredApiSession = {
  accountId: string;
  deviceId: string;
  token: string;
};

const webApiSessionTokenKey = `${API_SESSION_TOKEN_KEY}.web-fallback`;
const secureStoreOptions = { keychainService: 'cipherchat' };

async function getSessionToken() {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(webApiSessionTokenKey);
  }

  return SecureStore.getItemAsync(API_SESSION_TOKEN_KEY, secureStoreOptions);
}

async function setSessionToken(token: string) {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(webApiSessionTokenKey, token);
    return;
  }

  await SecureStore.setItemAsync(API_SESSION_TOKEN_KEY, token, secureStoreOptions);
}

async function deleteSessionToken() {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(webApiSessionTokenKey);
    return;
  }

  await SecureStore.deleteItemAsync(API_SESSION_TOKEN_KEY, secureStoreOptions);
}

export async function getStoredApiSession(): Promise<StoredApiSession | null> {
  const [accountId, deviceId, token] = await Promise.all([
    AsyncStorage.getItem(API_SESSION_ACCOUNT_ID_KEY),
    AsyncStorage.getItem(API_SESSION_DEVICE_ID_KEY),
    getSessionToken(),
  ]);

  if (!accountId || !deviceId || !token) {
    return null;
  }

  return { accountId, deviceId, token };
}

export async function setStoredApiSession(session: StoredApiSession) {
  await Promise.all([
    AsyncStorage.setItem(API_SESSION_ACCOUNT_ID_KEY, session.accountId),
    AsyncStorage.setItem(API_SESSION_DEVICE_ID_KEY, session.deviceId),
    setSessionToken(session.token),
  ]);
}

export async function clearStoredApiSession() {
  await Promise.all([
    AsyncStorage.removeItem(API_SESSION_ACCOUNT_ID_KEY),
    AsyncStorage.removeItem(API_SESSION_DEVICE_ID_KEY),
    deleteSessionToken(),
  ]);
}
