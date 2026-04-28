import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

import type { PublicDeviceBundleResponse } from '../services/api/types';
import type { RemoteIdentityTrustRecord, RemoteIdentityTrustState } from '../types';
import { createSafetyNumberBlocks } from './safetyNumber';

const REMOTE_TRUST_STORAGE_KEY = '@cipherchat/remote-contact-trust-v1';

export function describeRemoteTrustState(state: RemoteIdentityTrustState) {
  switch (state) {
    case 'changed':
      return {
        label: 'Key changed',
        detail: 'Review the safety number before sending sensitive messages.',
        icon: 'warning' as const,
      };
    case 'new':
      return {
        label: 'New key',
        detail: 'Verify this contact before trusting the conversation.',
        icon: 'help-circle' as const,
      };
    case 'trusted':
      return {
        label: 'Trusted',
        detail: 'Safety number is trusted on this device.',
        icon: 'shield-checkmark' as const,
      };
  }
}

export function findRemoteTrustRecord(records: RemoteIdentityTrustRecord[], id: string, displayName?: string) {
  const normalizedName = displayName?.trim().toLowerCase();
  return records.find((record) => record.id === id || record.displayName.toLowerCase() === normalizedName);
}

function mergeRecords(seedRecords: RemoteIdentityTrustRecord[], storedRecords: RemoteIdentityTrustRecord[]) {
  const records = new Map(seedRecords.map((record) => [record.id, record]));

  for (const record of storedRecords) {
    records.set(record.id, record);
  }

  return Array.from(records.values());
}

async function fingerprintFor(identityKey: string) {
  const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, identityKey);
  return digest.match(/.{1,4}/g)?.slice(0, 6).join(' ') ?? digest.slice(0, 24);
}

async function recordFromBundle(
  previous: RemoteIdentityTrustRecord,
  bundle: PublicDeviceBundleResponse,
): Promise<RemoteIdentityTrustRecord> {
  const identityChanged = previous.identityKey !== bundle.identityKey;
  const now = new Date().toISOString();

  return {
    ...previous,
    accountId: bundle.accountId,
    deviceId: bundle.deviceId,
    displayName: bundle.accountDisplayName,
    identityKey: bundle.identityKey,
    trustState: identityChanged ? 'changed' : previous.trustState,
    identityFingerprint: await fingerprintFor(bundle.identityKey),
    safetyNumberBlocks: await createSafetyNumberBlocks({
      accountId: bundle.accountId,
      deviceId: bundle.deviceId,
      identityKey: bundle.identityKey,
    }),
    changedAt: identityChanged ? now : previous.changedAt,
    syncedAt: now,
    source: 'api',
  };
}

export async function readRemoteTrustRecords(seedRecords: RemoteIdentityTrustRecord[] = []) {
  const stored = await AsyncStorage.getItem(REMOTE_TRUST_STORAGE_KEY);
  const storedRecords = stored ? (JSON.parse(stored) as RemoteIdentityTrustRecord[]) : [];
  return mergeRecords(seedRecords, storedRecords);
}

export async function writeRemoteTrustRecords(records: RemoteIdentityTrustRecord[]) {
  await AsyncStorage.setItem(REMOTE_TRUST_STORAGE_KEY, JSON.stringify(records));
}

export async function updateRemoteTrustRecord(
  records: RemoteIdentityTrustRecord[],
  record: RemoteIdentityTrustRecord,
) {
  const updated = records.map((item) => (item.id === record.id ? record : item));
  const exists = updated.some((item) => item.id === record.id);
  const nextRecords = exists ? updated : [...updated, record];
  await writeRemoteTrustRecords(nextRecords);
  return nextRecords;
}

export async function applyRemoteBundleToTrustRecord(
  records: RemoteIdentityTrustRecord[],
  recordId: string,
  bundle: PublicDeviceBundleResponse,
) {
  const existing = records.find((record) => record.id === recordId);

  if (!existing) {
    throw new Error('Remote trust record was not found.');
  }

  const nextRecord = await recordFromBundle(existing, bundle);
  return updateRemoteTrustRecord(records, nextRecord);
}

export async function markRemoteTrustRecordTrusted(records: RemoteIdentityTrustRecord[], recordId: string) {
  const now = new Date().toISOString();
  const nextRecords = records.map((record) =>
    record.id === recordId
      ? {
          ...record,
          trustState: 'trusted' as const,
          lastVerifiedAt: now,
          changedAt: undefined,
        }
      : record,
  );
  await writeRemoteTrustRecords(nextRecords);
  return nextRecords;
}
