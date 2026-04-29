import type { BackendMode } from '../../config/api';
import type { IdentityTrustState } from '../../security';

export type ApiReadiness = {
  ok: boolean;
  checks: {
    api: string;
    database: string;
    queue: string;
    objectStorage: string;
  };
};

export type AccountResponse = {
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

export type AccountDiscoveryResponse = {
  results: AccountDiscoveryResult[];
};

export type PublishDeviceBundleRequest = {
  accountId: string;
  accountDisplayName?: string;
  deviceId: string;
  deviceName: string;
  identityKey: string;
  signedPrekey: string;
  signedPrekeySignature: string;
  oneTimePrekeys?: string[];
};

export type PublicDeviceBundleResponse = {
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

export type DeviceChallengeResponse = {
  challengeId: string;
  accountId: string;
  deviceId: string;
  challenge: string;
  expiresAt: string;
};

export type DeviceSessionResponse = {
  sessionId: string;
  accountId: string;
  deviceId: string;
  token: string;
  expiresAt: string;
};

export type DeviceRevocationResponse = {
  accountId: string;
  deviceId: string;
  revoked: boolean;
  revokedAt: string;
};

export type EncryptedEnvelopeRequest = {
  messageId: string;
  conversationId: string;
  senderAccountId: string;
  senderDeviceId: string;
  recipientAccountId: string;
  recipientDeviceId: string;
  ciphertext: string;
  header: string;
};

export type EncryptedEnvelopeResponse = {
  accepted: boolean;
  envelopeId?: string;
  messageId: string;
  deliveryState: string;
};

export type EncryptedEnvelopeFanoutRequest = {
  conversationId: string;
  senderAccountId: string;
  senderDeviceId: string;
  envelopes: Array<{
    messageId: string;
    recipientAccountId: string;
    recipientDeviceId: string;
    ciphertext: string;
    header: string;
  }>;
};

export type EncryptedEnvelopeFanoutResponse = {
  accepted: boolean;
  envelopeCount: number;
  messageIds: string[];
};

export type PendingEnvelope = {
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

export type PendingEnvelopePage = {
  envelopes: PendingEnvelope[];
  nextCursor?: string;
};

export type InboundEnvelopeSyncStatus = {
  polling: boolean;
  pendingCount: number;
  acknowledgedCount: number;
  totalFetched: number;
  totalAcknowledged: number;
  receiptCount: number;
  pageCount: number;
  nextCursor?: string;
  lastPolledAt?: string;
  lastAcknowledgedAt?: string;
  lastError?: string;
};

export type BackendStatus = {
  mode: BackendMode;
  baseUrl: string;
  ready: boolean;
  sessionActive: boolean;
  summary: string;
  identityFingerprint?: string;
  identitySafetyNumber?: string[];
  identityTrustState?: IdentityTrustState;
  cryptoProvider?: string;
  messageCryptoProvider?: string;
  messageCryptoReady: boolean;
  messageCryptoSummary: string;
  remoteTrustSyncing?: boolean;
};
