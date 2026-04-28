import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { EncryptedLocalRecord } from '../ports';
import {
  buildEncryptedDatabaseSchemaStatements,
  createOpSQLiteEncryptedLocalDatabase,
  type OpSQLiteAdapterModule,
  type OpSQLiteDatabase,
  type OpSQLiteScalar,
} from './opSQLiteEncryptedLocalDatabaseCore.js';

type StoredRow = Record<string, OpSQLiteScalar>;

function createMockDatabase() {
  const tables = new Map<string, Map<string, StoredRow>>();
  const executed: string[] = [];

  const getTable = (name: string) => {
    const existing = tables.get(name);
    if (existing) {
      return existing;
    }

    const next = new Map<string, StoredRow>();
    tables.set(name, next);
    return next;
  };

  const execute = async (query: string, params: OpSQLiteScalar[] = []) => {
    executed.push(query);
    const insertTarget = query.match(/INSERT OR REPLACE INTO ([a-z_]+)/)?.[1];
    if (insertTarget === 'metadata') {
      const [key, valueJson, , createdAt, updatedAt] = params;
      getTable('metadata').set(String(key), {
        key,
        value_json: valueJson,
        created_at: createdAt,
        updated_at: updatedAt,
      });
      return { rows: [], rowsAffected: 1 };
    }

    if (insertTarget) {
      const [id, payloadCiphertext, , createdAt, updatedAt] = params;
      getTable(insertTarget).set(String(id), {
        id,
        payload_ciphertext: payloadCiphertext,
        created_at: createdAt,
        updated_at: updatedAt,
      });
      return { rows: [], rowsAffected: 1 };
    }

    const metadataLookup = query.match(/FROM metadata WHERE key = \?/);
    if (metadataLookup) {
      const row = getTable('metadata').get(String(params[0]));
      return { rows: row ? [row] : [], rowsAffected: 0 };
    }

    const idLookup = query.match(/FROM ([a-z_]+) WHERE id = \?/);
    if (idLookup) {
      const row = getTable(idLookup[1]).get(String(params[0]));
      return { rows: row ? [row] : [], rowsAffected: 0 };
    }

    const metadataList = query.match(/FROM metadata WHERE/);
    if (metadataList) {
      return { rows: Array.from(getTable('metadata').values()), rowsAffected: 0 };
    }

    const tableList = query.match(/FROM ([a-z_]+) WHERE/);
    if (tableList) {
      return { rows: Array.from(getTable(tableList[1]).values()), rowsAffected: 0 };
    }

    const metadataDelete = query.match(/DELETE FROM metadata WHERE key = \?/);
    if (metadataDelete) {
      getTable('metadata').delete(String(params[0]));
      return { rows: [], rowsAffected: 1 };
    }

    const tableDelete = query.match(/DELETE FROM ([a-z_]+) WHERE id = \?/);
    if (tableDelete) {
      getTable(tableDelete[1]).delete(String(params[0]));
      return { rows: [], rowsAffected: 1 };
    }

    return { rows: [], rowsAffected: 0 };
  };

  const db = {
    closeAsync: async () => undefined,
    execute,
    transaction: async (work: (tx: { execute: typeof execute }) => Promise<void>) => work({ execute }),
  } as OpSQLiteDatabase;

  return { db, executed };
}

function createModule(db: OpSQLiteDatabase, sqlCipher = true): OpSQLiteAdapterModule {
  return {
    isSQLCipher: () => sqlCipher,
    openAsync: async () => db,
  };
}

describe('OP-SQLite encrypted local database core', () => {
  it('builds schema v1 statements for every expected encrypted table', () => {
    const statements = buildEncryptedDatabaseSchemaStatements();

    assert.ok(statements.some((statement) => statement.includes('CREATE TABLE IF NOT EXISTS metadata')));
    assert.ok(statements.some((statement) => statement.includes('CREATE TABLE IF NOT EXISTS messages')));
    assert.ok(statements.some((statement) => statement.includes('CREATE TABLE IF NOT EXISTS ratchet_sessions')));
    assert.ok(statements.some((statement) => statement.includes('CREATE INDEX IF NOT EXISTS idx_messages_conversation_received')));
  });

  it('reports unavailable when the native build is not compiled with SQLCipher', async () => {
    const { db } = createMockDatabase();
    const adapter = createOpSQLiteEncryptedLocalDatabase({
      getOrCreateDatabaseKey: async () => 'test-key',
      loadModule: async () => createModule(db, false),
    });

    const status = await adapter.initialize();

    assert.equal(status.available, false);
    assert.equal(status.encrypted, false);
    assert.match(status.lastError ?? '', /not compiled with SQLCipher/);
  });

  it('initializes schema v1 and round-trips encrypted local records', async () => {
    const { db, executed } = createMockDatabase();
    const adapter = createOpSQLiteEncryptedLocalDatabase({
      getOrCreateDatabaseKey: async () => 'test-key',
      loadModule: async () => createModule(db),
      now: () => '2026-04-28T00:00:00.000Z',
    });
    const record: EncryptedLocalRecord<{ ciphertext: string }> = {
      createdAt: '2026-04-28T00:00:00.000Z',
      id: 'message-1',
      kind: 'message',
      updatedAt: '2026-04-28T00:00:00.000Z',
      value: { ciphertext: 'opaque-payload' },
    };

    const status = await adapter.initialize();
    await adapter.put(record);
    const restored = await adapter.get<typeof record.value>('message', record.id);

    assert.equal(status.available, true);
    assert.equal(status.encrypted, true);
    assert.equal(status.schemaVersion, 1);
    assert.ok(executed.some((statement) => statement.includes('CREATE TABLE IF NOT EXISTS messages')));
    assert.deepEqual(restored?.value, record.value);
  });

  it('surfaces database open failures without marking encrypted storage available', async () => {
    const adapter = createOpSQLiteEncryptedLocalDatabase({
      getOrCreateDatabaseKey: async () => 'wrong-key',
      loadModule: async () => ({
        isSQLCipher: () => true,
        openAsync: async () => {
          throw new Error('file is encrypted or is not a database');
        },
      }),
    });

    const status = await adapter.initialize();

    assert.equal(status.available, false);
    assert.equal(status.encrypted, false);
    assert.match(status.lastError ?? '', /encrypted or is not a database/);
  });
});
