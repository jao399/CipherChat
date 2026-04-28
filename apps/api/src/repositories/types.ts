export type PublishDeviceBundleInput = {
  accountId: string;
  accountDisplayName?: string;
  deviceId: string;
  deviceName: string;
  identityKey: string;
  signedPrekey: string;
  signedPrekeySignature: string;
  oneTimePrekeys?: string[];
};

export type PublishedDeviceBundle = {
  accountId: string;
  deviceId: string;
  bundleId: string;
};

export type PublicDeviceBundle = {
  accountId: string;
  accountDisplayName: string;
  deviceId: string;
  deviceName: string;
  identityKey: string;
  signedPrekey: string;
  signedPrekeySignature: string;
  oneTimePrekeys: string[];
  publishedAt: string;
};

export type CreateAccountInput = {
  id?: string;
  displayName: string;
  username?: string;
};

export type AccountProfile = {
  accountId: string;
  displayName: string;
  username?: string;
  createdAt: string;
};

export type AccountDiscoveryDevice = {
  deviceId: string;
  deviceName: string;
  identityKey: string;
  signedPrekey: string;
  signedPrekeySignature: string;
  oneTimePrekeys: string[];
  publishedAt: string;
};

export type AccountDiscoveryResult = {
  accountId: string;
  displayName: string;
  username?: string;
  devices: AccountDiscoveryDevice[];
};

export type StoreEncryptedEnvelopeInput = {
  messageId: string;
  conversationId: string;
  senderAccountId: string;
  senderDeviceId: string;
  recipientAccountId: string;
  recipientDeviceId: string;
  headerCiphertext: string;
  bodyCiphertext: string;
};

export type StoreEncryptedEnvelopeFanoutInput = {
  conversationId: string;
  senderAccountId: string;
  senderDeviceId: string;
  envelopes: Array<{
    messageId: string;
    recipientAccountId: string;
    recipientDeviceId: string;
    headerCiphertext: string;
    bodyCiphertext: string;
  }>;
};

export type StoredEncryptedEnvelope = {
  envelopeId: string;
  messageId: string;
  deliveryState: string;
};

export type StoredEncryptedEnvelopeFanout = {
  accepted: boolean;
  envelopeCount: number;
  messageIds: string[];
};

export type EncryptedEnvelopeDelivery = {
  envelopeId: string;
  messageId: string;
  conversationId: string;
  senderAccountId: string;
  senderDeviceId: string;
  recipientAccountId: string;
  recipientDeviceId: string;
  headerCiphertext: string;
  bodyCiphertext: string;
  deliveryState: string;
  queuedAt: string;
};

export type ListEncryptedEnvelopesInput = {
  recipientAccountId: string;
  recipientDeviceId: string;
  limit: number;
  cursor?: string;
};

export type EncryptedEnvelopePage = {
  envelopes: EncryptedEnvelopeDelivery[];
  nextCursor?: string;
};

export type AcknowledgeEncryptedEnvelopeInput = {
  messageId: string;
  recipientAccountId: string;
  recipientDeviceId: string;
};

export type AcknowledgedEncryptedEnvelope = {
  messageId: string;
  deliveryState: string;
  acknowledgedAt: string;
};

export type CreateDeviceSessionInput = {
  accountId: string;
  deviceId: string;
  challengeId: string;
  signature: string;
};

export type CreateDeviceChallengeInput = {
  accountId: string;
  deviceId: string;
};

export type CreatedDeviceChallenge = {
  challengeId: string;
  accountId: string;
  deviceId: string;
  challenge: string;
  expiresAt: string;
};

export type CreatedDeviceSession = {
  sessionId: string;
  accountId: string;
  deviceId: string;
  token: string;
  expiresAt: string;
};

export type VerifiedDeviceSession = {
  sessionId: string;
  accountId: string;
  deviceId: string;
};

export type RevokedDeviceSession = {
  sessionId: string;
  revoked: boolean;
};

export type MetadataRetentionCleanup = {
  deletedChallenges: number;
  deletedSessions: number;
  deletedAcknowledgedEnvelopes: number;
  deletedExpiredEnvelopes: number;
  deletedFileObjects: number;
  deletedAuditEvents: number;
};

export type AccountRepository = {
  createAccount(input: CreateAccountInput): Promise<AccountProfile>;
  getAccount(accountId: string): Promise<AccountProfile | null>;
  searchAccounts(query: string, limit: number): Promise<AccountDiscoveryResult[]>;
};

export type DeviceRepository = {
  publishDeviceBundle(input: PublishDeviceBundleInput): Promise<PublishedDeviceBundle>;
  getDeviceBundle(accountId: string, deviceId: string): Promise<PublicDeviceBundle | null>;
};

export type MessageRepository = {
  storeEncryptedEnvelope(input: StoreEncryptedEnvelopeInput): Promise<StoredEncryptedEnvelope>;
  storeEncryptedEnvelopeFanout(input: StoreEncryptedEnvelopeFanoutInput): Promise<StoredEncryptedEnvelopeFanout>;
  listQueuedEnvelopes(input: ListEncryptedEnvelopesInput): Promise<EncryptedEnvelopePage>;
  acknowledgeEnvelope(input: AcknowledgeEncryptedEnvelopeInput): Promise<AcknowledgedEncryptedEnvelope | null>;
  expireStaleEnvelopes(now?: Date): Promise<number>;
};

export type SessionRepository = {
  createDeviceChallenge(input: CreateDeviceChallengeInput): Promise<CreatedDeviceChallenge | null>;
  createDeviceSession(input: CreateDeviceSessionInput): Promise<CreatedDeviceSession | null>;
  verifyDeviceSession(token: string): Promise<VerifiedDeviceSession | null>;
  revokeDeviceSession(sessionId: string): Promise<RevokedDeviceSession | null>;
};

export type MetadataRetentionRepository = {
  cleanupExpiredMetadata(now?: Date): Promise<MetadataRetentionCleanup>;
};

export type ApiRepositories = {
  accounts?: AccountRepository;
  devices?: DeviceRepository;
  messages?: MessageRepository;
  sessions?: SessionRepository;
  metadataRetention?: MetadataRetentionRepository;
};
