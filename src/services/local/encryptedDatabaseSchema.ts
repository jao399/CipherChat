export type EncryptedLocalColumnType = 'text' | 'integer' | 'json' | 'ciphertext';

export type EncryptedLocalColumnDefinition = {
  name: string;
  type: EncryptedLocalColumnType;
  nullable?: boolean;
  primaryKey?: boolean;
  unique?: boolean;
};

export type EncryptedLocalIndexDefinition = {
  name: string;
  columns: string[];
  unique?: boolean;
};

export type EncryptedLocalTableDefinition = {
  name: EncryptedLocalTableName;
  purpose: string;
  columns: EncryptedLocalColumnDefinition[];
  indexes: EncryptedLocalIndexDefinition[];
};

export type EncryptedLocalTableName =
  | 'metadata'
  | 'messages'
  | 'outbound_envelopes'
  | 'inbound_receipts'
  | 'remote_trust_records'
  | 'ratchet_sessions'
  | 'file_metadata';

export const ENCRYPTED_LOCAL_DATABASE_SCHEMA_VERSION = 1;

const TIMESTAMP_COLUMNS: EncryptedLocalColumnDefinition[] = [
  { name: 'created_at', type: 'text' },
  { name: 'updated_at', type: 'text' },
];

export const ENCRYPTED_LOCAL_DATABASE_SCHEMA: EncryptedLocalTableDefinition[] = [
  {
    name: 'metadata',
    purpose: 'Database versioning, migration checkpoints, and local feature flags.',
    columns: [
      { name: 'key', type: 'text', primaryKey: true },
      { name: 'value_json', type: 'json' },
      ...TIMESTAMP_COLUMNS,
    ],
    indexes: [],
  },
  {
    name: 'messages',
    purpose: 'Encrypted message records and display metadata after protocol decryption.',
    columns: [
      { name: 'id', type: 'text', primaryKey: true },
      { name: 'conversation_id', type: 'text', nullable: true },
      { name: 'direction', type: 'text', nullable: true },
      { name: 'sent_at', type: 'text', nullable: true },
      { name: 'received_at', type: 'text', nullable: true },
      { name: 'payload_ciphertext', type: 'ciphertext' },
      ...TIMESTAMP_COLUMNS,
    ],
    indexes: [
      { name: 'idx_messages_conversation_received', columns: ['conversation_id', 'received_at'] },
      { name: 'idx_messages_conversation_sent', columns: ['conversation_id', 'sent_at'] },
    ],
  },
  {
    name: 'outbound_envelopes',
    purpose: 'Durable encrypted send queue and recipient-device fanout state.',
    columns: [
      { name: 'id', type: 'text', primaryKey: true },
      { name: 'conversation_id', type: 'text', nullable: true },
      { name: 'recipient_device_id', type: 'text', nullable: true },
      { name: 'state', type: 'text', nullable: true },
      { name: 'attempt_count', type: 'integer', nullable: true },
      { name: 'last_error', type: 'text', nullable: true },
      { name: 'payload_ciphertext', type: 'ciphertext' },
      ...TIMESTAMP_COLUMNS,
    ],
    indexes: [
      { name: 'idx_outbound_state_updated', columns: ['state', 'updated_at'] },
      { name: 'idx_outbound_conversation', columns: ['conversation_id'] },
    ],
  },
  {
    name: 'inbound_receipts',
    purpose: 'Encrypted envelope sync cursors, acknowledgement state, and delivery receipts.',
    columns: [
      { name: 'id', type: 'text', primaryKey: true },
      { name: 'envelope_id', type: 'text', unique: true, nullable: true },
      { name: 'conversation_id', type: 'text', nullable: true },
      { name: 'delivery_state', type: 'text', nullable: true },
      { name: 'queued_at', type: 'text', nullable: true },
      { name: 'acknowledged_at', type: 'text', nullable: true },
      { name: 'payload_ciphertext', type: 'ciphertext' },
      ...TIMESTAMP_COLUMNS,
    ],
    indexes: [
      { name: 'idx_inbound_delivery_state', columns: ['delivery_state', 'queued_at'] },
      { name: 'idx_inbound_conversation', columns: ['conversation_id'] },
    ],
  },
  {
    name: 'remote_trust_records',
    purpose: 'Contact and device trust snapshots used for key-change warnings.',
    columns: [
      { name: 'id', type: 'text', primaryKey: true },
      { name: 'account_id', type: 'text', nullable: true },
      { name: 'device_id', type: 'text', nullable: true },
      { name: 'trust_state', type: 'text', nullable: true },
      { name: 'payload_ciphertext', type: 'ciphertext' },
      ...TIMESTAMP_COLUMNS,
    ],
    indexes: [
      { name: 'idx_trust_account_device', columns: ['account_id', 'device_id'], unique: true },
      { name: 'idx_trust_state', columns: ['trust_state'] },
    ],
  },
  {
    name: 'ratchet_sessions',
    purpose: 'Signal/MLS protocol session state after native cryptography is integrated.',
    columns: [
      { name: 'id', type: 'text', primaryKey: true },
      { name: 'conversation_id', type: 'text', nullable: true },
      { name: 'remote_device_id', type: 'text', nullable: true },
      { name: 'protocol', type: 'text', nullable: true },
      { name: 'payload_ciphertext', type: 'ciphertext' },
      ...TIMESTAMP_COLUMNS,
    ],
    indexes: [
      { name: 'idx_ratchet_conversation_device', columns: ['conversation_id', 'remote_device_id'], unique: true },
    ],
  },
  {
    name: 'file_metadata',
    purpose: 'Encrypted file transfer metadata, object references, and retention state.',
    columns: [
      { name: 'id', type: 'text', primaryKey: true },
      { name: 'owner_account_id', type: 'text', nullable: true },
      { name: 'object_ref', type: 'text', nullable: true },
      { name: 'retention_state', type: 'text', nullable: true },
      { name: 'payload_ciphertext', type: 'ciphertext' },
      ...TIMESTAMP_COLUMNS,
    ],
    indexes: [
      { name: 'idx_file_owner_updated', columns: ['owner_account_id', 'updated_at'] },
      { name: 'idx_file_retention_state', columns: ['retention_state'] },
    ],
  },
];

export function getEncryptedLocalSchemaSummary() {
  return {
    version: ENCRYPTED_LOCAL_DATABASE_SCHEMA_VERSION,
    tableCount: ENCRYPTED_LOCAL_DATABASE_SCHEMA.length,
    tables: ENCRYPTED_LOCAL_DATABASE_SCHEMA.map((table) => table.name),
    encryptedPayloadTables: ENCRYPTED_LOCAL_DATABASE_SCHEMA.filter((table) =>
      table.columns.some((column) => column.type === 'ciphertext'),
    ).map((table) => table.name),
  };
}
