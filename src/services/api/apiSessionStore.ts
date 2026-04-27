import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

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

export async function getStoredApiSession(): Promise<StoredApiSession | null> {
  const [accountId, deviceId, token] = await Promise.all([
    AsyncStorage.getItem(API_SESSION_ACCOUNT_ID_KEY),
    AsyncStorage.getItem(API_SESSION_DEVICE_ID_KEY),
    SecureStore.getItemAsync(API_SESSION_TOKEN_KEY, { keychainService: 'cipherchat' }),
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
    SecureStore.setItemAsync(API_SESSION_TOKEN_KEY, session.token, { keychainService: 'cipherchat' }),
  ]);
}

export async function clearStoredApiSession() {
  await Promise.all([
    AsyncStorage.removeItem(API_SESSION_ACCOUNT_ID_KEY),
    AsyncStorage.removeItem(API_SESSION_DEVICE_ID_KEY),
    SecureStore.deleteItemAsync(API_SESSION_TOKEN_KEY, { keychainService: 'cipherchat' }),
  ]);
}
