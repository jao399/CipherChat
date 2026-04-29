import type {
  AccountResponse,
  AccountDiscoveryResponse,
  AccountDeviceListResponse,
  ApiReadiness,
  DeviceChallengeResponse,
  DevicePrekeyStatus,
  DevicePrekeyTopUpRequest,
  DeviceRevocationResponse,
  DeviceSessionResponse,
  EncryptedEnvelopeFanoutRequest,
  EncryptedEnvelopeFanoutResponse,
  EncryptedEnvelopeRequest,
  EncryptedEnvelopeResponse,
  PendingEnvelopePage,
  PublicDeviceBundleResponse,
  PublishDeviceBundleRequest,
} from './types';

type RequestOptions = {
  token?: string | null;
};

export class CipherChatApiError extends Error {
  constructor(
    message: string,
    readonly statusCode?: number,
  ) {
    super(message);
  }
}

export class CipherChatApiClient {
  constructor(private readonly baseUrl: string) {}

  async readiness() {
    return this.request<ApiReadiness>('/ready');
  }

  async createAccount(input: { id?: string; displayName: string; username?: string }) {
    return this.request<AccountResponse>('/v1/accounts', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async getCurrentAccount(token: string) {
    return this.request<AccountResponse>('/v1/accounts/me', undefined, { token });
  }

  async discoverAccounts(input: { query: string; limit?: number; token: string }) {
    const params = new URLSearchParams({
      query: input.query,
      limit: String(input.limit ?? 10),
    });

    return this.request<AccountDiscoveryResponse>(`/v1/accounts/discover?${params.toString()}`, undefined, {
      token: input.token,
    });
  }

  async publishDeviceBundle(input: PublishDeviceBundleRequest) {
    return this.request<{ accepted: boolean; accountId: string; deviceId: string; bundleId: string }>(
      '/v1/devices/bundles',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    );
  }

  async getPublicDeviceBundle(input: { accountId: string; deviceId: string; token: string }) {
    return this.request<PublicDeviceBundleResponse>(
      `/v1/devices/bundles/${encodeURIComponent(input.accountId)}/${encodeURIComponent(input.deviceId)}`,
      undefined,
      { token: input.token },
    );
  }

  async claimDevicePrekeyBundle(input: { accountId: string; deviceId: string; token: string }) {
    return this.request<PublicDeviceBundleResponse>(
      `/v1/devices/bundles/${encodeURIComponent(input.accountId)}/${encodeURIComponent(input.deviceId)}/claim`,
      { method: 'POST', body: '{}' },
      { token: input.token },
    );
  }

  async createDeviceChallenge(input: { accountId: string; deviceId: string }) {
    return this.request<DeviceChallengeResponse>('/v1/auth/device-challenges', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async createDeviceSession(input: { accountId: string; deviceId: string; challengeId: string; signature: string }) {
    return this.request<DeviceSessionResponse>('/v1/auth/device-sessions', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async revokeCurrentSession(token: string) {
    return this.request<{ sessionId: string; revoked: boolean }>(
      '/v1/auth/device-sessions/current',
      { method: 'DELETE' },
      { token },
    );
  }

  async revokeDevice(input: { accountId: string; deviceId: string; token: string }) {
    return this.request<DeviceRevocationResponse>(
      `/v1/devices/${encodeURIComponent(input.accountId)}/${encodeURIComponent(input.deviceId)}`,
      { method: 'DELETE' },
      { token: input.token },
    );
  }

  async listAccountDevices(token: string) {
    return this.request<AccountDeviceListResponse>('/v1/devices', undefined, { token });
  }

  async getDevicePrekeyStatus(token: string) {
    return this.request<DevicePrekeyStatus>('/v1/devices/prekeys/status', undefined, { token });
  }

  async topUpDevicePrekeys(input: DevicePrekeyTopUpRequest, token: string) {
    return this.request<DevicePrekeyStatus>(
      '/v1/devices/prekeys/top-up',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
      { token },
    );
  }

  async sendEnvelope(input: EncryptedEnvelopeRequest, token: string) {
    return this.request<EncryptedEnvelopeResponse>(
      '/v1/messages/envelopes',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
      { token },
    );
  }

  async sendEnvelopeFanout(input: EncryptedEnvelopeFanoutRequest, token: string) {
    return this.request<EncryptedEnvelopeFanoutResponse>(
      '/v1/messages/envelopes/fanout',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
      { token },
    );
  }

  async getPendingEnvelopes(input: { token: string; limit: number; cursor?: string }) {
    const params = new URLSearchParams({ limit: String(input.limit) });

    if (input.cursor) {
      params.set('cursor', input.cursor);
    }

    return this.request<PendingEnvelopePage>(`/v1/messages/envelopes?${params.toString()}`, undefined, {
      token: input.token,
    });
  }

  async acknowledgeEnvelope(messageId: string, token: string) {
    return this.request<{ messageId: string; deliveryState: string; acknowledgedAt: string }>(
      `/v1/messages/envelopes/${encodeURIComponent(messageId)}/ack`,
      {
        method: 'POST',
        body: '{}',
      },
      { token },
    );
  }

  private async request<T>(path: string, init: RequestInit = {}, options: RequestOptions = {}) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        ...(init.headers ?? {}),
      },
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
      throw new CipherChatApiError(data?.message ?? 'CipherChat API request failed', response.status);
    }

    return data as T;
  }
}
