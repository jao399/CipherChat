export { isSecureStoreAvailable, secureStoreAdapter } from './secureStoreAdapter';
export {
  ENCRYPTED_DATABASE_ADAPTER_CANDIDATE,
  LOCAL_DATA_CLASSIFICATION,
  LOCAL_DATABASE_MIGRATION_STEPS,
  getEncryptedDatabaseReadiness,
} from './encryptedDatabasePlan';
export {
  ENCRYPTED_LOCAL_DATABASE_SCHEMA,
  ENCRYPTED_LOCAL_DATABASE_SCHEMA_VERSION,
  getEncryptedLocalSchemaSummary,
} from './encryptedDatabaseSchema';
export {
  createOpSQLiteEncryptedLocalDatabase,
  opSQLiteEncryptedLocalDatabase,
} from './opSQLiteEncryptedLocalDatabase';
export {
  collectPrototypeStoreMigrationItems,
  migratePrototypeStoresToEncryptedDatabase,
} from './prototypeStoreMigration';
export type {
  EncryptedLocalColumnDefinition,
  EncryptedLocalColumnType,
  EncryptedLocalIndexDefinition,
  EncryptedLocalTableDefinition,
  EncryptedLocalTableName,
} from './encryptedDatabaseSchema';
export type {
  LocalDataClassification,
  LocalDataSensitivity,
  LocalDatabaseMigrationStep,
} from './encryptedDatabasePlan';
export type {
  PrototypeStoreMigrationItem,
  PrototypeStoreMigrationOptions,
  PrototypeStoreMigrationReaders,
  PrototypeStoreMigrationResult,
} from './prototypeStoreMigration';
export { bytesToHex, hexToBytes } from './secureStoreEncoding';
