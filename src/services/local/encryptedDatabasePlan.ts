import type { EncryptedLocalRecordKind } from '../ports';

export type LocalDataSensitivity = 'public-metadata' | 'delivery-metadata' | 'sensitive' | 'secret';

export type LocalDataClassification = {
  name: string;
  currentStore: 'AsyncStorage' | 'SecureStore' | 'future-encrypted-database';
  targetStore: 'AsyncStorage' | 'SecureStore' | 'encrypted-database';
  sensitivity: LocalDataSensitivity;
  recordKind?: EncryptedLocalRecordKind;
  migrationRequired: boolean;
  notes: string;
};

export type LocalDatabaseMigrationStep = {
  id: string;
  title: string;
  gate: string;
  details: string;
};

export const ENCRYPTED_DATABASE_ADAPTER_CANDIDATE = {
  name: 'SQLCipher-backed SQLite via OP-SQLite candidate',
  requiresDevelopmentBuild: true,
  schemaVersion: 1,
  databaseKeySecretName: 'localDatabaseKey',
} as const;

export const LOCAL_DATA_CLASSIFICATION: LocalDataClassification[] = [
  {
    name: 'Onboarding completion',
    currentStore: 'AsyncStorage',
    targetStore: 'AsyncStorage',
    sensitivity: 'public-metadata',
    migrationRequired: false,
    notes: 'Non-sensitive UI state can remain in AsyncStorage.',
  },
  {
    name: 'API session bearer token',
    currentStore: 'SecureStore',
    targetStore: 'SecureStore',
    sensitivity: 'secret',
    migrationRequired: false,
    notes: 'Bearer tokens must never move to AsyncStorage or the SQLCipher database.',
  },
  {
    name: 'Device identity private key',
    currentStore: 'SecureStore',
    targetStore: 'SecureStore',
    sensitivity: 'secret',
    migrationRequired: false,
    notes: 'Future production work should prefer non-exportable Android Keystore / iOS Keychain keys.',
  },
  {
    name: 'Remote trust records',
    currentStore: 'AsyncStorage',
    targetStore: 'encrypted-database',
    sensitivity: 'sensitive',
    recordKind: 'remoteTrustRecord',
    migrationRequired: true,
    notes: 'Trust records influence send safety and should migrate before production use.',
  },
  {
    name: 'Outbound envelope queue',
    currentStore: 'AsyncStorage',
    targetStore: 'encrypted-database',
    sensitivity: 'delivery-metadata',
    recordKind: 'outboundEnvelope',
    migrationRequired: true,
    notes: 'The prototype queue stores prepared encrypted-envelope fanout metadata, not plaintext.',
  },
  {
    name: 'Inbound delivery receipts',
    currentStore: 'AsyncStorage',
    targetStore: 'encrypted-database',
    sensitivity: 'delivery-metadata',
    recordKind: 'inboundReceipt',
    migrationRequired: true,
    notes: 'Receipt metadata reveals routing history and should move behind database encryption.',
  },
  {
    name: 'Plaintext message cache',
    currentStore: 'future-encrypted-database',
    targetStore: 'encrypted-database',
    sensitivity: 'sensitive',
    recordKind: 'message',
    migrationRequired: false,
    notes: 'Do not add plaintext message persistence before the encrypted database exists.',
  },
  {
    name: 'Ratchet session state',
    currentStore: 'future-encrypted-database',
    targetStore: 'encrypted-database',
    sensitivity: 'secret',
    recordKind: 'ratchetSession',
    migrationRequired: false,
    notes: 'Signal/MLS state must enter only through the encrypted database boundary.',
  },
];

export const LOCAL_DATABASE_MIGRATION_STEPS: LocalDatabaseMigrationStep[] = [
  {
    id: 'dev-build',
    title: 'Move to Expo development build',
    gate: 'Native SQLCipher-capable module can be installed and tested.',
    details: 'Expo Go is not enough for native SQLCipher or custom keychain/keystore modules.',
  },
  {
    id: 'db-key',
    title: 'Provision database key through OS secure storage',
    gate: 'Database key never appears in AsyncStorage, logs, API requests, or source control.',
    details: 'Use SecureStore initially, then review non-exportable platform key wrapping.',
  },
  {
    id: 'schema',
    title: 'Create encrypted schema v1',
    gate: 'Tables exist for messages, receipts, outbound envelopes, remote trust records, and protocol state.',
    details: 'Schema migrations must be explicit, versioned, and covered by tests.',
  },
  {
    id: 'migration',
    title: 'Migrate prototype AsyncStorage records',
    gate: 'Remote trust, outbound queue, and inbound receipt metadata are copied then removed from AsyncStorage.',
    details: 'Migration must be idempotent and safe to resume after interruption.',
  },
  {
    id: 'plaintext',
    title: 'Enable plaintext cache only after encryption is active',
    gate: 'App refuses plaintext persistence unless encrypted database status reports encrypted=true.',
    details: 'Conversation rendering can then hydrate from encrypted local records.',
  },
];

export function getEncryptedDatabaseReadiness() {
  const migrationItems = LOCAL_DATA_CLASSIFICATION.filter((item) => item.migrationRequired);

  return {
    available: false,
    encrypted: false,
    adapterName: ENCRYPTED_DATABASE_ADAPTER_CANDIDATE.name,
    schemaVersion: ENCRYPTED_DATABASE_ADAPTER_CANDIDATE.schemaVersion,
    requiresDevelopmentBuild: ENCRYPTED_DATABASE_ADAPTER_CANDIDATE.requiresDevelopmentBuild,
    migrationItemCount: migrationItems.length,
    migrationItems: migrationItems.map((item) => item.name),
    nextGate: LOCAL_DATABASE_MIGRATION_STEPS[0],
  };
}
