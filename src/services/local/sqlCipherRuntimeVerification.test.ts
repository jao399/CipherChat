import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type {
  EncryptedLocalDatabasePort,
  EncryptedLocalDatabaseStatus,
  EncryptedLocalRecord,
  EncryptedLocalRecordKind,
} from '../ports/encryptedLocalDatabase';
import { runSqlCipherRuntimeVerification } from './sqlCipherRuntimeVerification';

const availableStatus: EncryptedLocalDatabaseStatus = {
  adapterName: 'test-sqlcipher',
  available: true,
  driver: '@op-engineering/op-sqlite',
  encrypted: true,
  requiresDevelopmentBuild: true,
  schemaVersion: 1,
};

function createDatabase(status: EncryptedLocalDatabaseStatus): EncryptedLocalDatabasePort {
  const records = new Map<string, EncryptedLocalRecord>();

  return {
    async close() {
      return undefined;
    },
    async delete(kind: EncryptedLocalRecordKind, id: string) {
      records.delete(`${kind}:${id}`);
    },
    async get<T>(kind: EncryptedLocalRecordKind, id: string) {
      return (records.get(`${kind}:${id}`) as EncryptedLocalRecord<T> | undefined) ?? null;
    },
    async getStatus() {
      return status;
    },
    async initialize() {
      return status;
    },
    async list<T>() {
      return { records: [] as Array<EncryptedLocalRecord<T>> };
    },
    async put<T>(record: EncryptedLocalRecord<T>) {
      records.set(`${record.kind}:${record.id}`, record);
    },
    async transaction() {
      return undefined;
    },
  };
}

describe('SQLCipher runtime verification', () => {
  it('passes only when encrypted database schema v1 round-trips a harmless record', async () => {
    const result = await runSqlCipherRuntimeVerification(
      createDatabase(availableStatus),
      () => '2026-05-01T00:00:00.000Z',
    );

    assert.equal(result.passed, true);
    assert.equal(result.status.encrypted, true);
    assert(result.steps.some((item) => item.id === 'write-test-record' && item.passed));
    assert(result.steps.some((item) => item.id === 'cleanup-test-record' && item.passed));
  });

  it('fails honestly when SQLCipher is unavailable', async () => {
    const result = await runSqlCipherRuntimeVerification(
      createDatabase({
        ...availableStatus,
        available: false,
        encrypted: false,
        lastError: 'OP-SQLite is not compiled with SQLCipher.',
      }),
      () => '2026-05-01T00:00:00.000Z',
    );

    assert.equal(result.passed, false);
    assert.match(result.summary, /initialize/);
  });

  it('does not accept an unencrypted adapter as runtime evidence', async () => {
    const result = await runSqlCipherRuntimeVerification(
      createDatabase({
        ...availableStatus,
        encrypted: false,
      }),
      () => '2026-05-01T00:00:00.000Z',
    );

    assert.equal(result.passed, false);
    assert(result.steps.some((item) => item.id === 'encrypted-status' && !item.passed));
  });
});

