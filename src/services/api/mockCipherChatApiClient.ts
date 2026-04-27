import type {
  AccountResponse,
  ApiReadiness,
  DeviceChallengeResponse,
  DeviceSessionResponse,
  EncryptedEnvelopeRequest,
  EncryptedEnvelopeResponse,
  PendingEnvelopePage,
  PublishDeviceBundleRequest,
} from './types';

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

  async publishDeviceBundle(input: PublishDeviceBundleRequest) {
    return {
      accepted: true,
      accountId: input.accountId,
      deviceId: input.deviceId,
      bundleId: 'mock_bundle_0001',
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

  async getPendingEnvelopes(): Promise<PendingEnvelopePage> {
    return { envelopes: [] };
  },
};
