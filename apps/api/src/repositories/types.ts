export type PublishDeviceBundleInput = {
  accountId: string;
  accountDisplayName?: string;
  deviceId: string;
  deviceName: string;
  authIdentityKey?: string;
  signalIdentityKey?: string;
  prekeyBundleFormat?: string;
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

export type DeviceBundlePublicationStatus = {
  accountExists: boolean;
  accountDeviceCount: number;
  deviceExists: boolean;
  deviceAccountId?: string;
};

export type PublicDeviceBundle = {
  accountId: string;
  accountDisplayName: string;
  deviceId: string;
  deviceName: string;
  signalIdentityKey?: string;
  prekeyBundleFormat?: string;
  identityKey: string;
  signedPrekey: string;
  signedPrekeySignature: string;
  oneTimePrekeys: string[];
  publishedAt: string;
};

export type RevokeDeviceInput = {
  accountId: string;
  deviceId: string;
  actorDeviceId: string;
};

export type RevokedDevice = {
  accountId: string;
  deviceId: string;
  revoked: boolean;
  revokedAt: string;
};

export type AccountDevice = {
  accountId: string;
  deviceId: string;
  deviceName: string;
  trustState: string;
  lastSeenAt?: string;
  revokedAt?: string;
  createdAt: string;
  updatedAt: string;
  isCurrentDevice: boolean;
};

export type DevicePrekeyStatus = {
  accountId: string;
  deviceId: string;
  oneTimePrekeyCount: number;
  lowWatermark: number;
  recommendedCount: number;
  needsTopUp: boolean;
};

export type TopUpDevicePrekeysInput = {
  accountId: string;
  deviceId: string;
  oneTimePrekeys: string[];
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
  signalIdentityKey?: string;
  prekeyBundleFormat?: string;
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
  getDeviceBundlePublicationStatus(input: { accountId: string; deviceId: string }): Promise<DeviceBundlePublicationStatus>;
  publishDeviceBundle(input: PublishDeviceBundleInput): Promise<PublishedDeviceBundle>;
  getDeviceBundle(accountId: string, deviceId: string): Promise<PublicDeviceBundle | null>;
  claimDevicePrekeyBundle(accountId: string, deviceId: string): Promise<PublicDeviceBundle | null>;
  getDevicePrekeyStatus(input: { accountId: string; deviceId: string }): Promise<DevicePrekeyStatus | null>;
  topUpDevicePrekeys(input: TopUpDevicePrekeysInput): Promise<DevicePrekeyStatus | null>;
  revokeDevice(input: RevokeDeviceInput): Promise<RevokedDevice | null>;
  listAccountDevices(input: { accountId: string; currentDeviceId: string }): Promise<AccountDevice[]>;
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
