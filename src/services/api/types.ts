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
  remoteTrustSyncing?: boolean;
};
