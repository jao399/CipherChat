export type EncryptedLocalRecordKind =
  | 'message'
  | 'outboundEnvelope'
  | 'inboundReceipt'
  | 'ratchetSession'
  | 'remoteTrustRecord'
  | 'fileMetadata'
  | 'deviceMetadata';

export type EncryptedLocalRecord<T = unknown> = {
  id: string;
  kind: EncryptedLocalRecordKind;
  value: T;
  createdAt: string;
  updatedAt: string;
};

export type EncryptedLocalDatabaseStatus = {
  available: boolean;
  encrypted: boolean;
  adapterName: string;
  schemaVersion: number;
  requiresDevelopmentBuild: boolean;
  driver?: string;
  lastError?: string;
};

export type EncryptedLocalDatabaseTransaction = {
  put<T>(record: EncryptedLocalRecord<T>): Promise<void>;
  delete(kind: EncryptedLocalRecordKind, id: string): Promise<void>;
};

export type EncryptedLocalDatabasePort = {
  initialize(): Promise<EncryptedLocalDatabaseStatus>;
  close(): Promise<void>;
  getStatus(): Promise<EncryptedLocalDatabaseStatus>;
  get<T>(kind: EncryptedLocalRecordKind, id: string): Promise<EncryptedLocalRecord<T> | null>;
  list<T>(kind: EncryptedLocalRecordKind, limit: number, cursor?: string): Promise<{
    records: Array<EncryptedLocalRecord<T>>;
    nextCursor?: string;
  }>;
  put<T>(record: EncryptedLocalRecord<T>): Promise<void>;
  delete(kind: EncryptedLocalRecordKind, id: string): Promise<void>;
  transaction(work: (tx: EncryptedLocalDatabaseTransaction) => Promise<void>): Promise<void>;
};
