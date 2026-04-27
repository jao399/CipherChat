export type OpaqueId<TScope extends string> = string & { readonly __scope: TScope };

export type AccountId = OpaqueId<'AccountId'>;
export type DeviceId = OpaqueId<'DeviceId'>;
export type ConversationId = OpaqueId<'ConversationId'>;
export type MessageId = OpaqueId<'MessageId'>;
export type GroupId = OpaqueId<'GroupId'>;
export type FileId = OpaqueId<'FileId'>;
export type KeyId = OpaqueId<'KeyId'>;

export type Base64String = string;
export type IsoTimestamp = string;

export type KeyAlgorithm =
  | 'X25519'
  | 'Ed25519'
  | 'AES-256-GCM'
  | 'ChaCha20-Poly1305'
  | 'MLS-1.0';

export type PublicKeyMaterial = {
  keyId: KeyId;
  algorithm: KeyAlgorithm;
  publicKey: Base64String;
  createdAt: IsoTimestamp;
};

export type DeviceIdentityBundle = {
  accountId: AccountId;
  deviceId: DeviceId;
  deviceName: string;
  identityKey: PublicKeyMaterial;
  signedPrekey: PublicKeyMaterial;
  signedPrekeySignature: Base64String;
  oneTimePrekeys: PublicKeyMaterial[];
  publishedAt: IsoTimestamp;
};

export type VerificationState = 'unverified' | 'verified' | 'changed' | 'revoked';

export type SafetyNumber = {
  accountId: AccountId;
  deviceId: DeviceId;
  fingerprint: string;
  displayBlocks: string[];
};

export type RatchetSessionState = {
  conversationId: ConversationId;
  localDeviceId: DeviceId;
  remoteDeviceId: DeviceId;
  sessionId: KeyId;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
};

export type EncryptedMessageEnvelope = {
  messageId: MessageId;
  conversationId: ConversationId;
  senderAccountId: AccountId;
  senderDeviceId: DeviceId;
  recipientAccountId: AccountId;
  recipientDeviceId: DeviceId;
  algorithm: 'Signal-X3DH-DoubleRatchet';
  ciphertext: Base64String;
  header: Base64String;
  sentAt: IsoTimestamp;
};

export type MlsGroupState = {
  groupId: GroupId;
  epoch: number;
  cipherSuite: string;
  memberDeviceIds: DeviceId[];
  updatedAt: IsoTimestamp;
};

export type EncryptedFileDescriptor = {
  fileId: FileId;
  ownerAccountId: AccountId;
  objectRef: string;
  encryptedName?: Base64String;
  encryptedMimeType?: Base64String;
  sizeBytes: number;
  contentDigest: Base64String;
  algorithm: 'AES-256-GCM' | 'ChaCha20-Poly1305';
  createdAt: IsoTimestamp;
  expiresAt?: IsoTimestamp;
};

export type SecureStorageSecret =
  | 'deviceIdentityPrivateKey'
  | 'localDatabaseKey'
  | 'messageSessionState'
  | 'backupRecoverySecret';

export type CryptoOperationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errorCode: string; message: string };
