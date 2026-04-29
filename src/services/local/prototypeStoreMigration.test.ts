import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type {
  EncryptedLocalDatabasePort,
  EncryptedLocalDatabaseStatus,
  EncryptedLocalRecord,
  EncryptedLocalRecordKind,
} from '../ports';
import {
  collectPrototypeStoreMigrationItems,
  migratePrototypeStoresToEncryptedDatabase,
  type PrototypeStoreMigrationReaders,
} from './prototypeStoreMigration.js';

function createReaders(): PrototypeStoreMigrationReaders {
  return {
    readLocalMessages: async () => [
      {
        chatId: 'chat-1',
        id: 'message-local-1',
        time: '2026-04-28T00:30:00.000Z',
      },
    ],
    readRemoteTrustRecords: async () => [
      {
        deviceId: 'device-1',
        id: 'trust-1',
        trustState: 'trusted',
      },
    ],
    readOutboundQueue: async () => [
      {
        createdAt: '2026-04-28T01:00:00.000Z',
        id: 'outbound-1',
        updatedAt: '2026-04-28T01:05:00.000Z',
      },
    ],
    readInboundEnvelopeSyncState: async () => ({
      receipts: [
        {
          acknowledgedAt: '2026-04-28T02:05:00.000Z',
          messageId: 'message-1',
          queuedAt: '2026-04-28T02:00:00.000Z',
        },
      ],
    }),
  };
}

function createDatabase(status: EncryptedLocalDatabaseStatus) {
  const records: EncryptedLocalRecord[] = [];
  const database: EncryptedLocalDatabasePort = {
    close: async () => undefined,
    delete: async () => undefined,
    get: async () => null,
    getStatus: async () => status,
    initialize: async () => status,
    list: async () => ({ records: [] }),
    put: async (record) => {
      records.push(record);
    },
    transaction: async (work) => {
      await work({
        delete: async () => undefined,
        put: async (record) => {
          records.push(record);
        },
      });
    },
  };

  return { database, records };
}

describe('prototype store migration', () => {
  it('collects remote trust, outbound queue, and inbound receipt items', async () => {
    const items = await collectPrototypeStoreMigrationItems(createReaders());

    assert.equal(items.remoteTrustRecords[0].id, 'trust-1');
    assert.equal(items.remoteTrustRecords[0].kind, 'remoteTrustRecord');
    assert.equal(items.localMessages[0].id, 'message-local-1');
    assert.equal(items.localMessages[0].kind, 'message');
    assert.equal(items.outboundQueueItems[0].id, 'outbound-1');
    assert.equal(items.outboundQueueItems[0].kind, 'outboundEnvelope');
    assert.equal(items.inboundReceipts[0].id, 'message-1');
    assert.equal(items.inboundReceipts[0].kind, 'inboundReceipt');
  });

  it('skips by default so prototype data is not migrated accidentally', async () => {
    const { database, records } = createDatabase({
      adapterName: 'mock',
      available: true,
      encrypted: true,
      requiresDevelopmentBuild: true,
      schemaVersion: 1,
    });

    const result = await migratePrototypeStoresToEncryptedDatabase(database, {}, createReaders());

    assert.equal(result.status, 'skipped');
    assert.equal(records.length, 0);
  });

  it('blocks migration unless encrypted storage is available', async () => {
    const { database, records } = createDatabase({
      adapterName: 'mock',
      available: false,
      encrypted: false,
      lastError: 'SQLCipher unavailable',
      requiresDevelopmentBuild: true,
      schemaVersion: 1,
    });

    const result = await migratePrototypeStoresToEncryptedDatabase(database, { enabled: true }, createReaders());

    assert.equal(result.status, 'blocked');
    assert.equal(result.reason, 'SQLCipher unavailable');
    assert.equal(records.length, 0);
  });

  it('writes all collected prototype records through a single encrypted database transaction', async () => {
    const { database, records } = createDatabase({
      adapterName: 'mock',
      available: true,
      encrypted: true,
      requiresDevelopmentBuild: true,
      schemaVersion: 1,
    });

    const result = await migratePrototypeStoresToEncryptedDatabase(database, { enabled: true }, createReaders());
    const kinds = records.map((record) => record.kind).sort();

    assert.equal(result.status, 'completed');
    assert.deepEqual(result.migratedCounts, {
      inboundReceipts: 1,
      localMessages: 1,
      outboundQueueItems: 1,
      remoteTrustRecords: 1,
    });
    assert.deepEqual(kinds, ['inboundReceipt', 'message', 'outboundEnvelope', 'remoteTrustRecord'] satisfies EncryptedLocalRecordKind[]);
  });
});
