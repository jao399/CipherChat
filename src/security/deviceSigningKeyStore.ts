import { ed25519 } from '@noble/curves/ed25519.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const DEVICE_IDENTITY_PRIVATE_KEY = 'cipherchat.device-identity-ed25519-private-key-v1';
const LEGACY_DEVICE_IDENTITY_PRIVATE_SEED_KEY = 'cipherchat.device-identity-private-seed-v1';
const DEVICE_IDENTITY_KEYCHAIN_SERVICE = 'cipherchat.device-identity';
const WEB_DEVICE_IDENTITY_PRIVATE_KEY = `${DEVICE_IDENTITY_PRIVATE_KEY}.web-fallback`;
const WEB_LEGACY_DEVICE_IDENTITY_PRIVATE_SEED_KEY = `${LEGACY_DEVICE_IDENTITY_PRIVATE_SEED_KEY}.web-fallback`;

export type DeviceSigningKeyProtection = {
  strategy: 'expo-secure-store-os-backed-ed25519-v1';
  storage: 'expo-secure-store';
  keychainService: string;
  keychainAccessible: 'after-first-unlock-this-device-only';
  privateKeyHandle: string;
  exportableToJavaScript: true;
  productionUpgradeRequired: 'native-non-exportable-key-provider';
};

export type DeviceSigningPublicKey = {
  publicKey: Uint8Array;
  provider: 'ed25519-noble-os-secure-store-v1';
  protection: DeviceSigningKeyProtection;
};

export type DeviceSigningKeyStore = {
  getProtection(): DeviceSigningKeyProtection;
  getPublicKey(): Promise<DeviceSigningPublicKey | null>;
  getOrCreatePublicKey(): Promise<DeviceSigningPublicKey>;
  rotateKeyPair(): Promise<DeviceSigningPublicKey>;
  sign(challenge: Uint8Array): Promise<Uint8Array>;
  clear(): Promise<void>;
};

export const deviceSigningKeyProtection: DeviceSigningKeyProtection = {
  strategy: 'expo-secure-store-os-backed-ed25519-v1',
  storage: 'expo-secure-store',
  keychainService: DEVICE_IDENTITY_KEYCHAIN_SERVICE,
  keychainAccessible: 'after-first-unlock-this-device-only',
  privateKeyHandle: DEVICE_IDENTITY_PRIVATE_KEY,
  exportableToJavaScript: true,
  productionUpgradeRequired: 'native-non-exportable-key-provider',
};

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string) {
  if (hex.length % 2 !== 0 || /[^a-f0-9]/i.test(hex)) {
    throw new Error('Invalid hex payload');
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < hex.length; index += 2) {
    bytes[index / 2] = Number.parseInt(hex.slice(index, index + 2), 16);
  }
  return bytes;
}

const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainService: DEVICE_IDENTITY_KEYCHAIN_SERVICE,
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

async function storePrivateKey(privateKey: Uint8Array) {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(WEB_DEVICE_IDENTITY_PRIVATE_KEY, bytesToHex(privateKey));
    return;
  }

  await SecureStore.setItemAsync(DEVICE_IDENTITY_PRIVATE_KEY, bytesToHex(privateKey), secureStoreOptions);
}

async function loadPrivateKey() {
  const stored = Platform.OS === 'web'
    ? await AsyncStorage.getItem(WEB_DEVICE_IDENTITY_PRIVATE_KEY)
    : await SecureStore.getItemAsync(DEVICE_IDENTITY_PRIVATE_KEY, secureStoreOptions);
  return stored ? hexToBytes(stored) : null;
}

async function deletePrivateKey() {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(WEB_DEVICE_IDENTITY_PRIVATE_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(DEVICE_IDENTITY_PRIVATE_KEY, secureStoreOptions);
}

async function deleteLegacyPrivateSeed() {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(WEB_LEGACY_DEVICE_IDENTITY_PRIVATE_SEED_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(LEGACY_DEVICE_IDENTITY_PRIVATE_SEED_KEY, {
    keychainService: 'cipherchat',
  });
}

function publicKeyResult(privateKey: Uint8Array): DeviceSigningPublicKey {
  return {
    publicKey: ed25519.getPublicKey(privateKey),
    provider: 'ed25519-noble-os-secure-store-v1',
    protection: deviceSigningKeyProtection,
  };
}

export const expoSecureStoreDeviceSigningKeyStore: DeviceSigningKeyStore = {
  getProtection() {
    return deviceSigningKeyProtection;
  },

  async getPublicKey() {
    const privateKey = await loadPrivateKey();
    return privateKey ? publicKeyResult(privateKey) : null;
  },

  async getOrCreatePublicKey() {
    const existing = await this.getPublicKey();
    if (existing) {
      return existing;
    }

    return this.rotateKeyPair();
  },

  async rotateKeyPair() {
    const privateKey = Crypto.getRandomBytes(32);
    await storePrivateKey(privateKey);
    await deleteLegacyPrivateSeed();
    return publicKeyResult(privateKey);
  },

  async sign(challenge) {
    const privateKey = await loadPrivateKey();

    if (!privateKey) {
      throw new Error('Device identity private key is missing. Rotate the device identity and verify again.');
    }

    return ed25519.sign(challenge, privateKey);
  },

  async clear() {
    await deletePrivateKey();
    await deleteLegacyPrivateSeed();
  },
};
