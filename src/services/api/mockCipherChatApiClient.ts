import type {
  AccountDiscoveryResponse,
  AccountResponse,
  ApiReadiness,
  DeviceChallengeResponse,
  DeviceSessionResponse,
  EncryptedEnvelopeFanoutRequest,
  EncryptedEnvelopeFanoutResponse,
  EncryptedEnvelopeRequest,
  EncryptedEnvelopeResponse,
  PendingEnvelopePage,
  PublicDeviceBundleResponse,
  PublishDeviceBundleRequest,
} from './types';
import { remoteIdentityTrust } from '../../data/mockData';

const publishedBundles = new Map<string, PublishDeviceBundleRequest>();

function bundleKey(accountId: string, deviceId: string) {
  return `${accountId}:${deviceId}`;
}

export const mockCipherChatApiClient = {
  async readiness(): Promise<ApiReadiness> {
    return {
      ok: true,
      checks: {
        api: 'mock-ready',
        database: 'mock',
        queue: 'mock',
        objectStorage: 'mock',
      },
    };
  },

  async createAccount(input: { id?: string; displayName: string; username?: string }): Promise<AccountResponse> {
    return {
      accountId: input.id ?? 'mock_account_0001',
      displayName: input.displayName,
      username: input.username,
      createdAt: new Date().toISOString(),
    };
  },

  async discoverAccounts(input: { query: string; limit?: number }): Promise<AccountDiscoveryResponse> {
    const normalizedQuery = input.query.trim().toLowerCase();
    const limit = input.limit ?? 10;
    const results = remoteIdentityTrust
      .filter((record) => {
        const handle = record.handle?.toLowerCase() ?? '';
        return (
          normalizedQuery.length >= 2 &&
          (record.displayName.toLowerCase().includes(normalizedQuery) ||
            handle.includes(normalizedQuery) ||
            record.accountId.toLowerCase().includes(normalizedQuery))
        );
      })
      .slice(0, limit)
      .map((record) => ({
        accountId: record.accountId,
        displayName: record.displayName,
        username: record.handle?.replace(/^@/, ''),
        devices: [
          {
            deviceId: record.deviceId,
            deviceName: `${record.displayName}'s primary device`,
            identityKey: record.identityKey,
            signedPrekey: 'mock-signed-prekey-material',
            signedPrekeySignature: 'mock-signed-prekey-signature-material',
            oneTimePrekeys: ['mock-one-time-prekey-material'],
            publishedAt: record.syncedAt ?? new Date().toISOString(),
          },
        ],
      }));

    return { results };
  },

  async publishDeviceBundle(input: PublishDeviceBundleRequest) {
    publishedBundles.set(bundleKey(input.accountId, input.deviceId), input);

    return {
      accepted: true,
      accountId: input.accountId,
      deviceId: input.deviceId,
      bundleId: 'mock_bundle_0001',
    };
  },

  async getPublicDeviceBundle(input: { accountId: string; deviceId: string }): Promise<PublicDeviceBundleResponse> {
    const bundle = publishedBundles.get(bundleKey(input.accountId, input.deviceId));

    if (bundle) {
      return {
        accountId: bundle.accountId,
        accountDisplayName: bundle.accountDisplayName ?? 'CipherChat User',
        deviceId: bundle.deviceId,
        deviceName: bundle.deviceName,
        identityKey: bundle.identityKey,
        signedPrekey: bundle.signedPrekey,
        signedPrekeySignature: bundle.signedPrekeySignature,
        oneTimePrekeys: bundle.oneTimePrekeys ?? [],
        publishedAt: new Date().toISOString(),
      };
    }

    return {
      accountId: input.accountId,
      accountDisplayName: 'Mock Contact',
      deviceId: input.deviceId,
      deviceName: 'Mock Trusted Device',
      identityKey: 'ed25519-spki:mock-public-device-bundle-key-material',
      signedPrekey: 'mock-signed-prekey-material',
      signedPrekeySignature: 'mock-signed-prekey-signature-material',
      oneTimePrekeys: ['mock-one-time-prekey-material'],
      publishedAt: new Date().toISOString(),
    };
  },

  async createDeviceChallenge(input: { accountId: string; deviceId: string }): Promise<DeviceChallengeResponse> {
    return {
      challengeId: 'mock_challenge_0001',
      accountId: input.accountId,
      deviceId: input.deviceId,
      challenge: 'mock-challenge',
      expiresAt: new Date(Date.now() + 300000).toISOString(),
    };
  },

  async createDeviceSession(input: { accountId: string; deviceId: string }): Promise<DeviceSessionResponse> {
    return {
      sessionId: 'mock_session_0001',
      accountId: input.accountId,
      deviceId: input.deviceId,
      token: 'mock-session-token',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };
  },

  async sendEnvelope(input: EncryptedEnvelopeRequest): Promise<EncryptedEnvelopeResponse> {
    return {
      accepted: true,
      envelopeId: 'mock_envelope_0001',
      messageId: input.messageId,
      deliveryState: 'QUEUED',
    };
  },

  async sendEnvelopeFanout(input: EncryptedEnvelopeFanoutRequest): Promise<EncryptedEnvelopeFanoutResponse> {
    return {
      accepted: true,
      envelopeCount: input.envelopes.length,
      messageIds: input.envelopes.map((envelope) => envelope.messageId),
    };
  },

  async getPendingEnvelopes(): Promise<PendingEnvelopePage> {
    return { envelopes: [] };
  },

  async acknowledgeEnvelope(messageId: string) {
    return {
      messageId,
      deliveryState: 'ACKNOWLEDGED',
      acknowledgedAt: new Date().toISOString(),
    };
  },
};
