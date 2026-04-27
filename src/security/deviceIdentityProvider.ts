import AsyncStorage from '@react-native-async-storage/async-storage';
import { ed25519 } from '@noble/curves/ed25519.js';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

import { PROTOTYPE_ACCOUNT_DISPLAY_NAME } from '../config/api';
import type { PublishDeviceBundleRequest } from '../services/api/types';

const DEVICE_IDENTITY_STORAGE_KEY = '@cipherchat/device-identity-public-v2';
const LEGACY_DEVICE_IDENTITY_STORAGE_KEY = '@cipherchat/device-identity-public-v1';
const DEVICE_IDENTITY_PRIVATE_KEY = 'cipherchat.device-identity-ed25519-private-key-v1';
const LEGACY_DEVICE_IDENTITY_PRIVATE_SEED_KEY = 'cipherchat.device-identity-private-seed-v1';
const ED25519_SPKI_PREFIX = '302a300506032b6570032100';

export type LocalDeviceIdentity = {
  accountId: string;
  accountDisplayName: string;
  deviceId: string;
  deviceName: string;
  identityKey: string;
  signedPrekey: string;
  signedPrekeySignature: string;
  oneTimePrekeys: string[];
  fingerprint: string;
  provider: 'ed25519-noble-v1';
  createdAt: string;
};

export type DeviceIdentityProvider = {
  getOrCreateIdentity(): Promise<LocalDeviceIdentity>;
  rotateIdentity(): Promise<LocalDeviceIdentity>;
  clearIdentity(): Promise<void>;
  createDeviceBundle(identity: LocalDeviceIdentity): PublishDeviceBundleRequest;
  signDeviceChallenge(input: {
    identity: LocalDeviceIdentity;
    challenge: string;
  }): Promise<string>;
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

function bytesToBase64(bytes: Uint8Array) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';

  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index] ?? 0;
    const second = bytes[index + 1] ?? 0;
    const third = bytes[index + 2] ?? 0;
    const combined = (first << 16) | (second << 8) | third;

    output += alphabet[(combined >> 18) & 63];
    output += alphabet[(combined >> 12) & 63];
    output += index + 1 < bytes.length ? alphabet[(combined >> 6) & 63] : '=';
    output += index + 2 < bytes.length ? alphabet[combined & 63] : '=';
  }

  return output;
}

function utf8Bytes(value: string) {
  const bytes: number[] = [];

  for (let index = 0; index < value.length; index += 1) {
    const codePoint = value.charCodeAt(index);

    if (codePoint < 0x80) {
      bytes.push(codePoint);
    } else if (codePoint < 0x800) {
      bytes.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f));
    } else {
      bytes.push(0xe0 | (codePoint >> 12), 0x80 | ((codePoint >> 6) & 0x3f), 0x80 | (codePoint & 0x3f));
    }
  }

  return new Uint8Array(bytes);
}

function randomBytes(byteCount: number) {
  return Crypto.getRandomBytes(byteCount);
}

function randomToken(prefix: string, byteCount = 32) {
  return `${prefix}_${bytesToHex(randomBytes(byteCount))}`;
}

function nowSuffix() {
  return Date.now().toString();
}

async function fingerprintFor(identityKey: string) {
  const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, identityKey);
  return digest.match(/.{1,4}/g)?.slice(0, 6).join(' ') ?? digest.slice(0, 24);
}

function spkiIdentityKey(publicKey: Uint8Array) {
  const spki = hexToBytes(`${ED25519_SPKI_PREFIX}${bytesToHex(publicKey)}`);
  return `ed25519-spki:${bytesToBase64(spki)}`;
}

async function storePrivateKey(privateKey: Uint8Array) {
  await SecureStore.setItemAsync(DEVICE_IDENTITY_PRIVATE_KEY, bytesToHex(privateKey), {
    keychainService: 'cipherchat',
  });
}

async function loadPrivateKey() {
  const stored = await SecureStore.getItemAsync(DEVICE_IDENTITY_PRIVATE_KEY, {
    keychainService: 'cipherchat',
  });

  return stored ? hexToBytes(stored) : null;
}

async function createIdentity(existing?: Partial<LocalDeviceIdentity>): Promise<LocalDeviceIdentity> {
  const suffix = nowSuffix();
  const privateKey = randomBytes(32);
  const publicKey = ed25519.getPublicKey(privateKey);
  const identityKey = spkiIdentityKey(publicKey);

  await storePrivateKey(privateKey);

  const identity: LocalDeviceIdentity = {
    accountId: existing?.accountId ?? `account_mobile_${suffix}`,
    accountDisplayName: existing?.accountDisplayName ?? PROTOTYPE_ACCOUNT_DISPLAY_NAME,
    deviceId: existing?.deviceId ?? `device_mobile_${suffix}`,
    deviceName: existing?.deviceName ?? 'CipherChat Mobile Prototype',
    identityKey,
    signedPrekey: randomToken('prototype_signed_prekey'),
    signedPrekeySignature: randomToken('prototype_signed_prekey_signature'),
    oneTimePrekeys: [randomToken('prototype_one_time_prekey')],
    fingerprint: await fingerprintFor(identityKey),
    provider: 'ed25519-noble-v1',
    createdAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(DEVICE_IDENTITY_STORAGE_KEY, JSON.stringify(identity));
  await AsyncStorage.removeItem(LEGACY_DEVICE_IDENTITY_STORAGE_KEY);
  await SecureStore.deleteItemAsync(LEGACY_DEVICE_IDENTITY_PRIVATE_SEED_KEY, {
    keychainService: 'cipherchat',
  });
  return identity;
}

export const prototypeDeviceIdentityProvider: DeviceIdentityProvider = {
  async getOrCreateIdentity() {
    const [stored, privateKey] = await Promise.all([
      AsyncStorage.getItem(DEVICE_IDENTITY_STORAGE_KEY),
      loadPrivateKey(),
    ]);

    if (stored && privateKey) {
      const identity = JSON.parse(stored) as LocalDeviceIdentity;

      if (identity.provider === 'ed25519-noble-v1') {
        return identity;
      }
    }

    return createIdentity();
  },

  async rotateIdentity() {
    const existing = await this.getOrCreateIdentity();
    await this.clearIdentity();
    return createIdentity(existing);
  },

  async clearIdentity() {
    await AsyncStorage.multiRemove([DEVICE_IDENTITY_STORAGE_KEY, LEGACY_DEVICE_IDENTITY_STORAGE_KEY]);
    await SecureStore.deleteItemAsync(DEVICE_IDENTITY_PRIVATE_KEY, {
      keychainService: 'cipherchat',
    });
    await SecureStore.deleteItemAsync(LEGACY_DEVICE_IDENTITY_PRIVATE_SEED_KEY, {
      keychainService: 'cipherchat',
    });
  },

  createDeviceBundle(identity) {
    return {
      accountId: identity.accountId,
      accountDisplayName: identity.accountDisplayName,
      deviceId: identity.deviceId,
      deviceName: identity.deviceName,
      identityKey: identity.identityKey,
      signedPrekey: identity.signedPrekey,
      signedPrekeySignature: identity.signedPrekeySignature,
      oneTimePrekeys: identity.oneTimePrekeys,
    };
  },

  async signDeviceChallenge({ challenge }) {
    const privateKey = await loadPrivateKey();

    if (!privateKey) {
      throw new Error('Device identity private key is missing. Rotate the device identity and verify again.');
    }

    const signature = ed25519.sign(utf8Bytes(challenge), privateKey);
    return `ed25519:${bytesToBase64(signature)}`;
  },
};
