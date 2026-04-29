import type {
  EncryptedLocalDatabasePort,
  EncryptedLocalDatabaseStatus,
  EncryptedLocalRecord,
  EncryptedLocalRecordKind,
} from '../ports';

export type PrototypeStoreMigrationItem = {
  id: string;
  kind: EncryptedLocalRecordKind;
  value: unknown;
  createdAt: string;
  updatedAt: string;
};

export type PrototypeStoreMigrationReaders = {
  readLocalMessages(): Promise<
    Array<{
      id: string;
      chatId?: string;
      time?: string;
    }>
  >;
  readRemoteTrustRecords(): Promise<unknown[]>;
  readOutboundQueue(): Promise<
    Array<{
      id: string;
      createdAt: string;
      updatedAt: string;
    }>
  >;
  readInboundEnvelopeSyncState(): Promise<{
    receipts: Array<{
      messageId: string;
      queuedAt: string;
      acknowledgedAt: string;
    }>;
  }>;
};

export type PrototypeStoreMigrationOptions = {
  enabled?: boolean;
};

export type PrototypeStoreMigrationResult = {
  status: 'skipped' | 'blocked' | 'completed';
  reason?: string;
  encryptedDatabaseStatus?: EncryptedLocalDatabaseStatus;
  migratedCounts: {
    inboundReceipts: number;
    localMessages: number;
    outboundQueueItems: number;
    remoteTrustRecords: number;
  };
};

const zeroCounts = {
  inboundReceipts: 0,
  localMessages: 0,
  outboundQueueItems: 0,
  remoteTrustRecords: 0,
};

const defaultReaders: PrototypeStoreMigrationReaders = {
  readLocalMessages: async () => {
    const { messages } = await import('../../data/mockData');
    return messages;
  },
  readRemoteTrustRecords: async () => {
    const { readRemoteTrustRecords } = await import('../../security/remoteContactTrust');
    return readRemoteTrustRecords([]);
  },
  readOutboundQueue: async () => {
    const { readOutboundQueue } = await import('../messages/outboundQueueStore');
    return readOutboundQueue();
  },
  readInboundEnvelopeSyncState: async () => {
    const { readInboundEnvelopeSyncState } = await import('../messages/inboundEnvelopeStore');
    return readInboundEnvelopeSyncState();
  },
};

function fallbackTimestamp() {
  return new Date().toISOString();
}

function timestampFrom(value: string | undefined) {
  return value ?? fallbackTimestamp();
}

function remoteTrustId(value: unknown, index: number) {
  if (value && typeof value === 'object' && 'id' in value && typeof value.id === 'string') {
    return value.id;
  }

  return `remote-trust-${index}`;
}

function localMessageId(value: { id: string }, index: number) {
  return value.id || `local-message-${index}`;
}

export async function collectPrototypeStoreMigrationItems(
  readers: PrototypeStoreMigrationReaders = defaultReaders,
): Promise<{
  inboundReceipts: PrototypeStoreMigrationItem[];
  localMessages: PrototypeStoreMigrationItem[];
  outboundQueueItems: PrototypeStoreMigrationItem[];
  remoteTrustRecords: PrototypeStoreMigrationItem[];
}> {
  const [localMessages, remoteTrustRecords, outboundQueue, inboundSync] = await Promise.all([
    readers.readLocalMessages(),
    readers.readRemoteTrustRecords(),
    readers.readOutboundQueue(),
    readers.readInboundEnvelopeSyncState(),
  ]);

  return {
    localMessages: localMessages.map((message, index) => {
      const timestamp = fallbackTimestamp();
      return {
        createdAt: timestampFrom(message.time) || timestamp,
        id: localMessageId(message, index),
        kind: 'message',
        updatedAt: timestamp,
        value: message,
      };
    }),
    remoteTrustRecords: remoteTrustRecords.map((record, index) => {
      const timestamp = fallbackTimestamp();
      return {
        createdAt: timestamp,
        id: remoteTrustId(record, index),
        kind: 'remoteTrustRecord',
        updatedAt: timestamp,
        value: record,
      };
    }),
    outboundQueueItems: outboundQueue.map((item) => ({
      createdAt: timestampFrom(item.createdAt),
      id: item.id,
      kind: 'outboundEnvelope',
      updatedAt: timestampFrom(item.updatedAt),
      value: item,
    })),
    inboundReceipts: inboundSync.receipts.map((receipt) => ({
      createdAt: timestampFrom(receipt.queuedAt),
      id: receipt.messageId,
      kind: 'inboundReceipt',
      updatedAt: timestampFrom(receipt.acknowledgedAt),
      value: receipt,
    })),
  };
}

function asEncryptedRecord(item: PrototypeStoreMigrationItem): EncryptedLocalRecord {
  return {
    createdAt: item.createdAt,
    id: item.id,
    kind: item.kind,
    updatedAt: item.updatedAt,
    value: item.value,
  };
}

export async function migratePrototypeStoresToEncryptedDatabase(
  database: EncryptedLocalDatabasePort,
  options: PrototypeStoreMigrationOptions = {},
  readers: PrototypeStoreMigrationReaders = defaultReaders,
): Promise<PrototypeStoreMigrationResult> {
  const enabled = options.enabled ?? false;

  if (!enabled) {
    return {
      status: 'skipped',
      reason: 'Prototype store migration is disabled by default.',
      migratedCounts: zeroCounts,
    };
  }

  const encryptedDatabaseStatus = await database.initialize();
  if (!encryptedDatabaseStatus.available || !encryptedDatabaseStatus.encrypted) {
    return {
      status: 'blocked',
      reason: encryptedDatabaseStatus.lastError ?? 'Encrypted local database is not available.',
      encryptedDatabaseStatus,
      migratedCounts: zeroCounts,
    };
  }

  const items = await collectPrototypeStoreMigrationItems(readers);
  const records = [
    ...items.localMessages,
    ...items.remoteTrustRecords,
    ...items.outboundQueueItems,
    ...items.inboundReceipts,
  ].map(asEncryptedRecord);

  await database.transaction(async (tx) => {
    for (const record of records) {
      await tx.put(record);
    }
  });

  return {
    status: 'completed',
    encryptedDatabaseStatus,
    migratedCounts: {
      inboundReceipts: items.inboundReceipts.length,
      localMessages: items.localMessages.length,
      outboundQueueItems: items.outboundQueueItems.length,
      remoteTrustRecords: items.remoteTrustRecords.length,
    },
  };
}
