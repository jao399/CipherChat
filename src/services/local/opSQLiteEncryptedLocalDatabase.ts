import * as Crypto from 'expo-crypto';

import { bytesToHex } from './secureStoreEncoding';
import { secureStoreAdapter } from './secureStoreAdapter';
import {
  createOpSQLiteEncryptedLocalDatabase,
  type OpSQLiteAdapterModule,
} from './opSQLiteEncryptedLocalDatabaseCore';

const DATABASE_KEY_BYTES = 32;

async function loadOpSQLiteModule(): Promise<OpSQLiteAdapterModule> {
  return import('@op-engineering/op-sqlite');
}

async function getOrCreateDatabaseKey() {
  const existing = await secureStoreAdapter.getSecret('localDatabaseKey');
  if (!existing.ok) {
    throw new Error(existing.message);
  }

  if (existing.value) {
    return bytesToHex(existing.value);
  }

  const keyBytes = await Crypto.getRandomBytesAsync(DATABASE_KEY_BYTES);
  const stored = await secureStoreAdapter.setSecret('localDatabaseKey', keyBytes);
  if (!stored.ok) {
    throw new Error(stored.message);
  }

  return bytesToHex(keyBytes);
}

export { createOpSQLiteEncryptedLocalDatabase } from './opSQLiteEncryptedLocalDatabaseCore';
export type {
  OpSQLiteAdapterModule,
  OpSQLiteEncryptedLocalDatabaseOptions,
} from './opSQLiteEncryptedLocalDatabaseCore';

export const opSQLiteEncryptedLocalDatabase = createOpSQLiteEncryptedLocalDatabase({
  getOrCreateDatabaseKey,
  loadModule: loadOpSQLiteModule,
});
