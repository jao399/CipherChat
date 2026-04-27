import AsyncStorage from '@react-native-async-storage/async-storage';

import type { LocalDeviceIdentity } from './deviceIdentityProvider';
import { createSafetyNumberBlocks } from './safetyNumber';

const TRUSTED_IDENTITIES_STORAGE_KEY = '@cipherchat/trusted-identities-v1';

export type IdentityTrustState = 'new' | 'trusted' | 'changed';

export type TrustedIdentityRecord = {
  accountId: string;
  deviceId: string;
  identityKey: string;
  fingerprint: string;
  safetyNumberBlocks: string[];
  firstSeenAt: string;
  lastSeenAt: string;
  trustedAt?: string;
};

export type IdentityTrustStatus = {
  state: IdentityTrustState;
  record: TrustedIdentityRecord;
};

function identityRecordKey(identity: Pick<LocalDeviceIdentity, 'accountId' | 'deviceId'>) {
  return `${identity.accountId}:${identity.deviceId}`;
}

async function readRecords() {
  const stored = await AsyncStorage.getItem(TRUSTED_IDENTITIES_STORAGE_KEY);
  return stored ? (JSON.parse(stored) as Record<string, TrustedIdentityRecord>) : {};
}

async function writeRecords(records: Record<string, TrustedIdentityRecord>) {
  await AsyncStorage.setItem(TRUSTED_IDENTITIES_STORAGE_KEY, JSON.stringify(records));
}

async function createRecord(identity: LocalDeviceIdentity): Promise<TrustedIdentityRecord> {
  const now = new Date().toISOString();

  return {
    accountId: identity.accountId,
    deviceId: identity.deviceId,
    identityKey: identity.identityKey,
    fingerprint: identity.fingerprint,
    safetyNumberBlocks: await createSafetyNumberBlocks(identity),
    firstSeenAt: now,
    lastSeenAt: now,
  };
}

export async function getIdentityTrustStatus(identity: LocalDeviceIdentity): Promise<IdentityTrustStatus> {
  const records = await readRecords();
  const key = identityRecordKey(identity);
  const existing = records[key];

  if (!existing) {
    return {
      state: 'new',
      record: await createRecord(identity),
    };
  }

  if (existing.identityKey !== identity.identityKey) {
    return {
      state: 'changed',
      record: {
        ...(await createRecord(identity)),
        firstSeenAt: existing.firstSeenAt,
      },
    };
  }

  const refreshed = {
    ...existing,
    fingerprint: identity.fingerprint,
    lastSeenAt: new Date().toISOString(),
  };

  records[key] = refreshed;
  await writeRecords(records);

  return {
    state: refreshed.trustedAt ? 'trusted' : 'new',
    record: refreshed,
  };
}

export async function markIdentityTrusted(identity: LocalDeviceIdentity): Promise<IdentityTrustStatus> {
  const records = await readRecords();
  const key = identityRecordKey(identity);
  const existing = records[key];
  const now = new Date().toISOString();
  const record = {
    ...(await createRecord(identity)),
    firstSeenAt: existing?.firstSeenAt ?? now,
    lastSeenAt: now,
    trustedAt: now,
  };

  records[key] = record;
  await writeRecords(records);

  return {
    state: 'trusted',
    record,
  };
}

export async function clearTrustedIdentity(identity: Pick<LocalDeviceIdentity, 'accountId' | 'deviceId'>) {
  const records = await readRecords();
  delete records[identityRecordKey(identity)];
  await writeRecords(records);
}
