import type {
  EncryptedLocalDatabasePort,
  EncryptedLocalDatabaseStatus,
  EncryptedLocalRecord,
  EncryptedLocalRecordKind,
} from '../ports';
import { ENCRYPTED_DATABASE_ADAPTER_CANDIDATE } from './encryptedDatabasePlan';
import {
  ENCRYPTED_LOCAL_DATABASE_SCHEMA,
  ENCRYPTED_LOCAL_DATABASE_SCHEMA_VERSION,
  type EncryptedLocalColumnDefinition,
  type EncryptedLocalColumnType,
  type EncryptedLocalTableName,
} from './encryptedDatabaseSchema';

export type OpSQLiteDatabase = import('@op-engineering/op-sqlite').DB;
export type OpSQLiteScalar = import('@op-engineering/op-sqlite').Scalar;

export type OpSQLiteAdapterModule = {
  isSQLCipher(): boolean;
  openAsync(params: { name: string; encryptionKey?: string }): Promise<OpSQLiteDatabase>;
};

export type OpSQLiteEncryptedLocalDatabaseOptions = {
  loadModule(): Promise<OpSQLiteAdapterModule>;
  getOrCreateDatabaseKey(): Promise<string>;
  databaseName?: string;
  now?: () => string;
};

type SqlExecutor = {
  execute(query: string, params?: OpSQLiteScalar[]): Promise<unknown>;
};

const DEFAULT_DATABASE_NAME = 'cipherchat-secure.db';
const METADATA_SCHEMA_VERSION_KEY = 'schema_version';

const RECORD_TABLE_BY_KIND: Record<EncryptedLocalRecordKind, EncryptedLocalTableName> = {
  deviceMetadata: 'metadata',
  fileMetadata: 'file_metadata',
  inboundReceipt: 'inbound_receipts',
  message: 'messages',
  outboundEnvelope: 'outbound_envelopes',
  ratchetSession: 'ratchet_sessions',
  remoteTrustRecord: 'remote_trust_records',
};

const BASE_UNAVAILABLE_STATUS: EncryptedLocalDatabaseStatus = {
  available: false,
  encrypted: false,
  adapterName: ENCRYPTED_DATABASE_ADAPTER_CANDIDATE.name,
  schemaVersion: ENCRYPTED_LOCAL_DATABASE_SCHEMA_VERSION,
  requiresDevelopmentBuild: true,
  driver: '@op-engineering/op-sqlite',
};

function sqlType(type: EncryptedLocalColumnType) {
  switch (type) {
    case 'integer':
      return 'INTEGER';
    case 'json':
    case 'ciphertext':
    case 'text':
      return 'TEXT';
  }
}

function columnSql(column: EncryptedLocalColumnDefinition) {
  return [
    column.name,
    sqlType(column.type),
    column.primaryKey ? 'PRIMARY KEY' : undefined,
    column.unique ? 'UNIQUE' : undefined,
    column.nullable || column.primaryKey ? undefined : 'NOT NULL',
  ]
    .filter(Boolean)
    .join(' ');
}

export function buildEncryptedDatabaseSchemaStatements() {
  const tableStatements = ENCRYPTED_LOCAL_DATABASE_SCHEMA.map((table) => {
    const columns = table.columns.map(columnSql).join(', ');
    return `CREATE TABLE IF NOT EXISTS ${table.name} (${columns});`;
  });

  const indexStatements = ENCRYPTED_LOCAL_DATABASE_SCHEMA.flatMap((table) =>
    table.indexes.map((index) => {
      const unique = index.unique ? 'UNIQUE ' : '';
      return `CREATE ${unique}INDEX IF NOT EXISTS ${index.name} ON ${table.name} (${index.columns.join(', ')});`;
    }),
  );

  return [...tableStatements, ...indexStatements];
}

function defaultNow() {
  return new Date().toISOString();
}

function ensureSerializable(value: unknown) {
  return JSON.stringify(value ?? null);
}

function parseStoredRecord<T>(kind: EncryptedLocalRecordKind, row: Record<string, OpSQLiteScalar>): EncryptedLocalRecord<T> {
  const rawValue = String(row.value_json ?? row.payload_ciphertext ?? 'null');

  return {
    id: String(row.id ?? row.key),
    kind,
    value: JSON.parse(rawValue) as T,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

async function applySchema(db: OpSQLiteDatabase, now: () => string) {
  await db.transaction(async (tx) => {
    for (const statement of buildEncryptedDatabaseSchemaStatements()) {
      await tx.execute(statement);
    }

    const timestamp = now();
    await tx.execute(
      'INSERT OR REPLACE INTO metadata (key, value_json, created_at, updated_at) VALUES (?, ?, COALESCE((SELECT created_at FROM metadata WHERE key = ?), ?), ?);',
      [
        METADATA_SCHEMA_VERSION_KEY,
        JSON.stringify({ version: ENCRYPTED_LOCAL_DATABASE_SCHEMA_VERSION }),
        METADATA_SCHEMA_VERSION_KEY,
        timestamp,
        timestamp,
      ],
    );
  });
}

function requireInitialized(db: OpSQLiteDatabase | null) {
  if (!db) {
    throw new Error('Encrypted local database has not been initialized.');
  }

  return db;
}

export function createOpSQLiteEncryptedLocalDatabase({
  databaseName = DEFAULT_DATABASE_NAME,
  getOrCreateDatabaseKey,
  loadModule,
  now = defaultNow,
}: OpSQLiteEncryptedLocalDatabaseOptions): EncryptedLocalDatabasePort {
  let db: OpSQLiteDatabase | null = null;
  let status: EncryptedLocalDatabaseStatus = BASE_UNAVAILABLE_STATUS;

  const initialize = async () => {
    if (db) {
      return status;
    }

    try {
      const opSQLite = await loadModule();
      if (!opSQLite.isSQLCipher()) {
        status = {
          ...BASE_UNAVAILABLE_STATUS,
          lastError: 'OP-SQLite is installed, but this native build was not compiled with SQLCipher.',
        };
        return status;
      }

      const encryptionKey = await getOrCreateDatabaseKey();
      db = await opSQLite.openAsync({
        name: databaseName,
        encryptionKey,
      });

      await applySchema(db, now);
      status = {
        available: true,
        encrypted: true,
        adapterName: ENCRYPTED_DATABASE_ADAPTER_CANDIDATE.name,
        schemaVersion: ENCRYPTED_LOCAL_DATABASE_SCHEMA_VERSION,
        requiresDevelopmentBuild: true,
        driver: '@op-engineering/op-sqlite',
      };
      return status;
    } catch (error) {
      db = null;
      status = {
        ...BASE_UNAVAILABLE_STATUS,
        lastError: error instanceof Error ? error.message : 'Encrypted local database initialization failed.',
      };
      return status;
    }
  };

  const putRecord = async (targetDb: SqlExecutor, record: EncryptedLocalRecord) => {
    const table = RECORD_TABLE_BY_KIND[record.kind];
    const timestamp = now();
    const createdAt = record.createdAt || timestamp;
    const updatedAt = record.updatedAt || timestamp;
    const value = ensureSerializable(record.value);

    if (table === 'metadata') {
      await targetDb.execute(
        'INSERT OR REPLACE INTO metadata (key, value_json, created_at, updated_at) VALUES (?, ?, COALESCE((SELECT created_at FROM metadata WHERE key = ?), ?), ?);',
        [record.id, value, record.id, createdAt, updatedAt],
      );
      return;
    }

    await targetDb.execute(
      `INSERT OR REPLACE INTO ${table} (id, payload_ciphertext, created_at, updated_at) VALUES (?, ?, COALESCE((SELECT created_at FROM ${table} WHERE id = ?), ?), ?);`,
      [record.id, value, record.id, createdAt, updatedAt],
    );
  };

  return {
    async initialize() {
      return initialize();
    },

    async close() {
      if (db) {
        await db.closeAsync();
        db = null;
      }
    },

    async getStatus() {
      return status;
    },

    async get<T>(kind: EncryptedLocalRecordKind, id: string) {
      const activeDb = requireInitialized(db);
      const table = RECORD_TABLE_BY_KIND[kind];
      const result =
        table === 'metadata'
          ? await activeDb.execute('SELECT key, value_json, created_at, updated_at FROM metadata WHERE key = ? LIMIT 1;', [
              id,
            ])
          : await activeDb.execute(
              `SELECT id, payload_ciphertext, created_at, updated_at FROM ${table} WHERE id = ? LIMIT 1;`,
              [id],
            );

      const row = result.rows[0];
      return row ? parseStoredRecord<T>(kind, row) : null;
    },

    async list<T>(kind: EncryptedLocalRecordKind, limit: number, cursor?: string) {
      const activeDb = requireInitialized(db);
      const table = RECORD_TABLE_BY_KIND[kind];
      const boundedLimit = Math.max(1, Math.min(limit, 100));
      const paginationSql = cursor ? 'updated_at < ?' : '1 = 1';
      const params: OpSQLiteScalar[] = cursor ? [cursor, boundedLimit + 1] : [boundedLimit + 1];
      const result =
        table === 'metadata'
          ? await activeDb.execute(
              `SELECT key, value_json, created_at, updated_at FROM metadata WHERE ${paginationSql} ORDER BY updated_at DESC LIMIT ?;`,
              params,
            )
          : await activeDb.execute(
              `SELECT id, payload_ciphertext, created_at, updated_at FROM ${table} WHERE ${paginationSql} ORDER BY updated_at DESC LIMIT ?;`,
              params,
            );
      const rows = result.rows.slice(0, boundedLimit);
      const extraRow = result.rows[boundedLimit];

      return {
        records: rows.map((row) => parseStoredRecord<T>(kind, row)),
        nextCursor: extraRow ? String(extraRow.updated_at) : undefined,
      };
    },

    async put<T>(record: EncryptedLocalRecord<T>) {
      const activeDb = requireInitialized(db);
      await putRecord(activeDb, record);
    },

    async delete(kind, id) {
      const activeDb = requireInitialized(db);
      const table = RECORD_TABLE_BY_KIND[kind];
      if (table === 'metadata') {
        await activeDb.execute('DELETE FROM metadata WHERE key = ?;', [id]);
        return;
      }

      await activeDb.execute(`DELETE FROM ${table} WHERE id = ?;`, [id]);
    },

    async transaction(work) {
      const activeDb = requireInitialized(db);
      await activeDb.transaction(async (tx) => {
        await work({
          async put(record) {
            await putRecord(tx, record);
          },
          async delete(kind, id) {
            const table = RECORD_TABLE_BY_KIND[kind];
            if (table === 'metadata') {
              await tx.execute('DELETE FROM metadata WHERE key = ?;', [id]);
              return;
            }

            await tx.execute(`DELETE FROM ${table} WHERE id = ?;`, [id]);
          },
        });
      });
    },
  };
}
