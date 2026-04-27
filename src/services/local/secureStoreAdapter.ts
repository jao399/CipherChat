import * as SecureStore from 'expo-secure-store';

import type {
  CryptoOperationResult,
  SecureStorageSecret,
} from '../../security';
import type { LocalSecureStorePort } from '../ports';
import { bytesToHex, hexToBytes } from './secureStoreEncoding';

const keyPrefix = 'cipherchat.secure.';

function secureStoreKey(name: SecureStorageSecret) {
  return `${keyPrefix}${name}`;
}

function success<T>(value: T): CryptoOperationResult<T> {
  return { ok: true, value };
}

function failure(error: unknown): CryptoOperationResult<never> {
  return {
    ok: false,
    errorCode: 'secure_store_error',
    message: error instanceof Error ? error.message : 'Secure storage operation failed',
  };
}

export const secureStoreAdapter: LocalSecureStorePort = {
  async setSecret(name, value) {
    try {
      await SecureStore.setItemAsync(secureStoreKey(name), bytesToHex(value), {
        keychainService: 'cipherchat',
      });
      return success(undefined);
    } catch (error) {
      return failure(error);
    }
  },

  async getSecret(name) {
    try {
      const value = await SecureStore.getItemAsync(secureStoreKey(name), {
        keychainService: 'cipherchat',
      });
      return success(value ? hexToBytes(value) : null);
    } catch (error) {
      return failure(error);
    }
  },

  async deleteSecret(name) {
    try {
      await SecureStore.deleteItemAsync(secureStoreKey(name), {
        keychainService: 'cipherchat',
      });
      return success(undefined);
    } catch (error) {
      return failure(error);
    }
  },
};

export async function isSecureStoreAvailable() {
  return SecureStore.isAvailableAsync();
}
