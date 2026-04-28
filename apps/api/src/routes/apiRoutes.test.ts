import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import type { FastifyInstance } from 'fastify';

import { buildApi } from '../app.js';
import type { JobQueuePort } from '../queue/jobQueue.js';
import type {
  AccountRepository,
  DeviceRepository,
  EncryptedEnvelopePage,
  MessageRepository,
  PublishDeviceBundleInput,
  SessionRepository,
  StoreEncryptedEnvelopeInput,
} from '../repositories/types.js';
import { envelopeAbusePolicy } from '../security/abusePolicy.js';

const config = {
  host: '127.0.0.1',
  port: 0,
  corsOrigin: 'http://localhost:8081',
  nodeEnv: 'test',
  internalJobToken: 'test-internal-token',
  rateLimitWindowMs: 60_000,
  rateLimitMaxRequests: 1_000,
};

const apps: FastifyInstance[] = [];

class CapturingJobQueue implements JobQueuePort {
  deliveryFanoutJobs: Array<{ messageIds: string[]; recipientDeviceCount: number }> = [];
  expirySweepCount = 0;
  metadataCleanupCount = 0;

  async enqueueDeliveryFanout(input: { messageIds: string[]; recipientDeviceCount: number }) {
    this.deliveryFanoutJobs.push(input);
  }

  async enqueueEnvelopeExpirySweep() {
    this.expirySweepCount += 1;
  }

  async enqueueMetadataRetentionCleanup() {
    this.metadataCleanupCount += 1;
  }
}

async function buildTestApi(options?: Parameters<typeof buildApi>[1]) {
  const app = await buildApi(config, options);
  apps.push(app);
  return app;
}

function createSessionRepository(overrides: Partial<SessionRepository> = {}): SessionRepository {
  return {
    async createDeviceChallenge(input) {
      return {
        challengeId: 'challenge_000001',
        accountId: input.accountId,
        deviceId: input.deviceId,
        challenge: 'challenge-value',
        expiresAt: new Date(60_000).toISOString(),
      };
    },
    async createDeviceSession(input) {
      return {
        sessionId: 'session_00000001',
        accountId: input.accountId,
        deviceId: input.deviceId,
        token: 'issued-token',
        expiresAt: new Date(60_000).toISOString(),
      };
    },
    async verifyDeviceSession(token) {
      if (token !== 'valid-session-token' && token !== 'recipient-session-token') {
        return null;
      }

      return {
        sessionId: 'session_00000001',
        accountId: 'account_00000001',
        deviceId: 'device_000000001',
      };
    },
    async revokeDeviceSession(sessionId) {
      return {
        sessionId,
        revoked: true,
      };
    },
    ...overrides,
  };
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe('health routes', () => {
  it('reports a disabled database when no database dependency is configured', async () => {
    const app = await buildTestApi();
    const response = await app.inject({ method: 'GET', url: '/ready' });

    assert.equal(response.statusCode, 200);
    assert.equal(response.json().checks.database, 'disabled');
  });

  it('reports a connected database when the health check succeeds', async () => {
    const app = await buildTestApi({
      databaseHealthCheck: async () => undefined,
    });
    const response = await app.inject({ method: 'GET', url: '/ready' });

    assert.equal(response.statusCode, 200);
    assert.equal(response.json().checks.database, 'connected');
  });
});

describe('device bundle route', () => {
  const body = {
    accountId: 'account_00000001',
    accountDisplayName: 'Eleanor',
    deviceId: 'device_000000001',
    deviceName: 'Pixel Test Device',
    identityKey: 'identity-key-material-ciphertext-0001',
    signedPrekey: 'signed-prekey-material-ciphertext-01',
    signedPrekeySignature: 'signed-prekey-signature-ciphertext',
    oneTimePrekeys: ['one-time-prekey-0001'],
  };

  it('returns 503 when persistence is not configured', async () => {
    const app = await buildTestApi();
    const response = await app.inject({
      method: 'POST',
      url: '/v1/devices/bundles',
      payload: body,
    });

    assert.equal(response.statusCode, 503);
    assert.equal(response.json().error, 'database_unavailable');
  });

  it('persists a device bundle through the injected repository', async () => {
    const publishedBundles: PublishDeviceBundleInput[] = [];
    const devices: DeviceRepository = {
      async publishDeviceBundle(input) {
        publishedBundles.push(input);
        return {
          accountId: input.accountId,
          deviceId: input.deviceId,
          bundleId: 'bundle_000000001',
        };
      },
      async getDeviceBundle() {
        return null;
      },
    };
    const app = await buildTestApi({ repositories: { devices } });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/devices/bundles',
      payload: body,
    });

    assert.equal(response.statusCode, 202);
    assert.equal(response.json().accepted, true);
    assert.equal(response.json().bundleId, 'bundle_000000001');
    assert.equal(publishedBundles.length, 1);
    assert.equal(publishedBundles[0]?.identityKey, body.identityKey);
  });

  it('returns a public device bundle for authenticated devices', async () => {
    const devices: DeviceRepository = {
      async publishDeviceBundle() {
        throw new Error('should not publish during lookup');
      },
      async getDeviceBundle(accountId, deviceId) {
        return {
          accountId,
          accountDisplayName: 'Eleanor',
          deviceId,
          deviceName: 'Pixel Test Device',
          identityKey: body.identityKey,
          signedPrekey: body.signedPrekey,
          signedPrekeySignature: body.signedPrekeySignature,
          oneTimePrekeys: body.oneTimePrekeys,
          publishedAt: new Date(0).toISOString(),
        };
      },
    };
    const app = await buildTestApi({
      repositories: {
        devices,
        sessions: createSessionRepository(),
      },
    });

    const response = await app.inject({
      method: 'GET',
      url: `/v1/devices/bundles/${body.accountId}/${body.deviceId}`,
      headers: {
        authorization: 'Bearer valid-session-token',
      },
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.json().identityKey, body.identityKey);
    assert.equal(response.json().oneTimePrekeys.length, 1);
  });

  it('requires a device session before returning public device bundles', async () => {
    const devices: DeviceRepository = {
      async publishDeviceBundle() {
        throw new Error('should not publish during lookup');
      },
      async getDeviceBundle() {
        throw new Error('should not look up without auth');
      },
    };
    const app = await buildTestApi({ repositories: { devices, sessions: createSessionRepository() } });

    const response = await app.inject({
      method: 'GET',
      url: `/v1/devices/bundles/${body.accountId}/${body.deviceId}`,
    });

    assert.equal(response.statusCode, 401);
    assert.equal(response.json().error, 'missing_session');
  });

  it('returns 404 when a public device bundle is not found', async () => {
    const devices: DeviceRepository = {
      async publishDeviceBundle() {
        throw new Error('should not publish during lookup');
      },
      async getDeviceBundle() {
        return null;
      },
    };
    const app = await buildTestApi({
      repositories: {
        devices,
        sessions: createSessionRepository(),
      },
    });

    const response = await app.inject({
      method: 'GET',
      url: `/v1/devices/bundles/${body.accountId}/${body.deviceId}`,
      headers: {
        authorization: 'Bearer valid-session-token',
      },
    });

    assert.equal(response.statusCode, 404);
    assert.equal(response.json().error, 'device_bundle_not_found');
  });
});

describe('encrypted envelope route', () => {
  const body = {
    messageId: 'message_00000001',
    conversationId: 'conversation_0001',
    senderAccountId: 'sender_account01',
    senderDeviceId: 'sender_device001',
    recipientAccountId: 'recipient_acct01',
    recipientDeviceId: 'recipient_dev001',
    ciphertext: 'body-ciphertext-only',
    header: 'header-ciphertext-only',
  };

  it('returns 503 when persistence is not configured', async () => {
    const app = await buildTestApi();
    const response = await app.inject({
      method: 'POST',
      url: '/v1/messages/envelopes',
      payload: body,
    });

    assert.equal(response.statusCode, 503);
    assert.equal(response.json().error, 'database_unavailable');
  });

  it('stores encrypted envelopes through the injected repository', async () => {
    const storedEnvelopes: StoreEncryptedEnvelopeInput[] = [];
    const jobQueue = new CapturingJobQueue();
    const messages: MessageRepository = {
      async storeEncryptedEnvelope(input) {
        storedEnvelopes.push(input);
        return {
          envelopeId: 'envelope_0000001',
          messageId: input.messageId,
          deliveryState: 'QUEUED',
        };
      },
      async storeEncryptedEnvelopeFanout(input) {
        return {
          accepted: true,
          envelopeCount: input.envelopes.length,
          messageIds: input.envelopes.map((envelope) => envelope.messageId),
        };
      },
      async listQueuedEnvelopes() {
        return { envelopes: [] };
      },
      async acknowledgeEnvelope() {
        return null;
      },
      async expireStaleEnvelopes() {
        return 0;
      },
    };
    const sessions = createSessionRepository({
      async verifyDeviceSession(token) {
        if (token !== 'valid-session-token') {
          return null;
        }

        return {
          sessionId: 'session_00000001',
          accountId: body.senderAccountId,
          deviceId: body.senderDeviceId,
        };
      },
    });
    const app = await buildTestApi({ repositories: { messages, sessions }, jobQueue });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/messages/envelopes',
      headers: {
        authorization: 'Bearer valid-session-token',
      },
      payload: body,
    });

    assert.equal(response.statusCode, 202);
    assert.equal(response.json().deliveryState, 'QUEUED');
    assert.equal(storedEnvelopes.length, 1);
    assert.equal(storedEnvelopes[0]?.bodyCiphertext, body.ciphertext);
    assert.equal(storedEnvelopes[0]?.headerCiphertext, body.header);
    assert.equal(jobQueue.deliveryFanoutJobs.length, 1);
    assert.equal(jobQueue.deliveryFanoutJobs[0]?.recipientDeviceCount, 1);
  });

  it('stores encrypted fanout envelopes and enqueues generic delivery jobs', async () => {
    const jobQueue = new CapturingJobQueue();
    const messages: MessageRepository = {
      async storeEncryptedEnvelope(input) {
        return {
          envelopeId: 'envelope_0000001',
          messageId: input.messageId,
          deliveryState: 'QUEUED',
        };
      },
      async storeEncryptedEnvelopeFanout(input) {
        return {
          accepted: true,
          envelopeCount: input.envelopes.length,
          messageIds: input.envelopes.map((envelope) => envelope.messageId),
        };
      },
      async listQueuedEnvelopes() {
        return { envelopes: [] };
      },
      async acknowledgeEnvelope() {
        return null;
      },
      async expireStaleEnvelopes() {
        return 0;
      },
    };
    const sessions = createSessionRepository({
      async verifyDeviceSession() {
        return {
          sessionId: 'session_00000001',
          accountId: body.senderAccountId,
          deviceId: body.senderDeviceId,
        };
      },
    });
    const app = await buildTestApi({ repositories: { messages, sessions }, jobQueue });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/messages/envelopes/fanout',
      headers: {
        authorization: 'Bearer valid-session-token',
      },
      payload: {
        conversationId: body.conversationId,
        senderAccountId: body.senderAccountId,
        senderDeviceId: body.senderDeviceId,
        envelopes: [
          {
            messageId: 'message_fanout_001',
            recipientAccountId: body.recipientAccountId,
            recipientDeviceId: body.recipientDeviceId,
            ciphertext: 'recipient-one-ciphertext',
            header: 'recipient-one-header',
          },
          {
            messageId: 'message_fanout_002',
            recipientAccountId: 'recipient_acct02',
            recipientDeviceId: 'recipient_dev002',
            ciphertext: 'recipient-two-ciphertext',
            header: 'recipient-two-header',
          },
        ],
      },
    });

    assert.equal(response.statusCode, 202);
    assert.equal(response.json().envelopeCount, 2);
    assert.equal(jobQueue.deliveryFanoutJobs.length, 1);
    assert.deepEqual(jobQueue.deliveryFanoutJobs[0]?.messageIds, ['message_fanout_001', 'message_fanout_002']);
  });

  it('rejects encrypted fanout requests above the recipient-device cap', async () => {
    const messages: MessageRepository = {
      async storeEncryptedEnvelope() {
        throw new Error('should not store oversized fanout');
      },
      async storeEncryptedEnvelopeFanout() {
        throw new Error('should not store oversized fanout');
      },
      async listQueuedEnvelopes() {
        return { envelopes: [] };
      },
      async acknowledgeEnvelope() {
        return null;
      },
      async expireStaleEnvelopes() {
        return 0;
      },
    };
    const sessions = createSessionRepository({
      async verifyDeviceSession() {
        return {
          sessionId: 'session_00000001',
          accountId: body.senderAccountId,
          deviceId: body.senderDeviceId,
        };
      },
    });
    const app = await buildTestApi({ repositories: { messages, sessions } });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/messages/envelopes/fanout',
      headers: {
        authorization: 'Bearer valid-session-token',
      },
      payload: {
        conversationId: body.conversationId,
        senderAccountId: body.senderAccountId,
        senderDeviceId: body.senderDeviceId,
        envelopes: Array.from({ length: envelopeAbusePolicy.maxFanoutRecipients + 1 }, (_, index) => ({
          messageId: `message_fanout_${String(index).padStart(3, '0')}`,
          recipientAccountId: `recipient_acct${String(index).padStart(2, '0')}`,
          recipientDeviceId: `recipient_dev${String(index).padStart(3, '0')}`,
          ciphertext: 'recipient-ciphertext',
          header: 'recipient-header',
        })),
      },
    });

    assert.equal(response.statusCode, 400);
    assert.equal(response.json().error, 'request_error');
  });

  it('rejects encrypted envelopes above the payload-size cap', async () => {
    const messages: MessageRepository = {
      async storeEncryptedEnvelope() {
        throw new Error('should not store oversized payload');
      },
      async storeEncryptedEnvelopeFanout() {
        throw new Error('should not store oversized payload');
      },
      async listQueuedEnvelopes() {
        return { envelopes: [] };
      },
      async acknowledgeEnvelope() {
        return null;
      },
      async expireStaleEnvelopes() {
        return 0;
      },
    };
    const sessions = createSessionRepository({
      async verifyDeviceSession() {
        return {
          sessionId: 'session_00000001',
          accountId: body.senderAccountId,
          deviceId: body.senderDeviceId,
        };
      },
    });
    const app = await buildTestApi({ repositories: { messages, sessions } });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/messages/envelopes',
      headers: {
        authorization: 'Bearer valid-session-token',
      },
      payload: {
        ...body,
        ciphertext: 'x'.repeat(envelopeAbusePolicy.maxBodyCiphertextChars + 1),
      },
    });

    assert.equal(response.statusCode, 400);
    assert.equal(response.json().error, 'request_error');
  });

  it('rejects encrypted envelope sends from a different authenticated device', async () => {
    const messages: MessageRepository = {
      async storeEncryptedEnvelope() {
        throw new Error('should not store mismatched sender envelope');
      },
      async storeEncryptedEnvelopeFanout() {
        throw new Error('should not store mismatched fanout envelope');
      },
      async listQueuedEnvelopes() {
        return { envelopes: [] };
      },
      async acknowledgeEnvelope() {
        return null;
      },
      async expireStaleEnvelopes() {
        return 0;
      },
    };
    const sessions = createSessionRepository({
      async verifyDeviceSession() {
        return {
          sessionId: 'session_00000001',
          accountId: 'another_account01',
          deviceId: 'another_device001',
        };
      },
    });
    const app = await buildTestApi({ repositories: { messages, sessions } });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/messages/envelopes',
      headers: {
        authorization: 'Bearer valid-session-token',
      },
      payload: body,
    });

    assert.equal(response.statusCode, 403);
    assert.equal(response.json().error, 'sender_device_mismatch');
  });

  it('fetches queued envelopes for the authenticated recipient device only', async () => {
    const messages: MessageRepository = {
      async storeEncryptedEnvelope(input) {
        return {
          envelopeId: 'envelope_0000001',
          messageId: input.messageId,
          deliveryState: 'QUEUED',
        };
      },
      async storeEncryptedEnvelopeFanout(input) {
        return {
          accepted: true,
          envelopeCount: input.envelopes.length,
          messageIds: input.envelopes.map((envelope) => envelope.messageId),
        };
      },
      async listQueuedEnvelopes(input): Promise<EncryptedEnvelopePage> {
        assert.equal(input.recipientAccountId, 'recipient_acct01');
        assert.equal(input.recipientDeviceId, 'recipient_dev001');
        assert.equal(input.limit, 10);

        return {
          envelopes: [
            {
              envelopeId: 'envelope_0000001',
              messageId: body.messageId,
              conversationId: body.conversationId,
              senderAccountId: body.senderAccountId,
              senderDeviceId: body.senderDeviceId,
              recipientAccountId: body.recipientAccountId,
              recipientDeviceId: body.recipientDeviceId,
              headerCiphertext: body.header,
              bodyCiphertext: body.ciphertext,
              deliveryState: 'DELIVERED',
              queuedAt: new Date(0).toISOString(),
            },
          ],
          nextCursor: 'next-page',
        };
      },
      async acknowledgeEnvelope() {
        return null;
      },
      async expireStaleEnvelopes() {
        return 0;
      },
    };
    const sessions = createSessionRepository({
      async verifyDeviceSession() {
        return {
          sessionId: 'session_00000002',
          accountId: body.recipientAccountId,
          deviceId: body.recipientDeviceId,
        };
      },
    });
    const app = await buildTestApi({ repositories: { messages, sessions } });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/messages/envelopes?limit=10',
      headers: {
        authorization: 'Bearer recipient-session-token',
      },
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.json().envelopes.length, 1);
    assert.equal(response.json().envelopes[0].bodyCiphertext, body.ciphertext);
    assert.equal(response.json().nextCursor, 'next-page');
  });

  it('acknowledges envelopes only for the authenticated recipient device', async () => {
    const messages: MessageRepository = {
      async storeEncryptedEnvelope(input) {
        return {
          envelopeId: 'envelope_0000001',
          messageId: input.messageId,
          deliveryState: 'QUEUED',
        };
      },
      async storeEncryptedEnvelopeFanout(input) {
        return {
          accepted: true,
          envelopeCount: input.envelopes.length,
          messageIds: input.envelopes.map((envelope) => envelope.messageId),
        };
      },
      async listQueuedEnvelopes() {
        return { envelopes: [] };
      },
      async acknowledgeEnvelope(input) {
        assert.equal(input.recipientAccountId, body.recipientAccountId);
        assert.equal(input.recipientDeviceId, body.recipientDeviceId);

        return {
          messageId: input.messageId,
          deliveryState: 'ACKNOWLEDGED',
          acknowledgedAt: new Date(0).toISOString(),
        };
      },
      async expireStaleEnvelopes() {
        return 0;
      },
    };
    const sessions = createSessionRepository({
      async verifyDeviceSession() {
        return {
          sessionId: 'session_00000003',
          accountId: body.recipientAccountId,
          deviceId: body.recipientDeviceId,
        };
      },
    });
    const app = await buildTestApi({ repositories: { messages, sessions } });

    const response = await app.inject({
      method: 'POST',
      url: `/v1/messages/envelopes/${body.messageId}/ack`,
      headers: {
        authorization: 'Bearer recipient-session-token',
      },
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.json().deliveryState, 'ACKNOWLEDGED');
  });
});

describe('device session route', () => {
  it('creates a device challenge through the injected repository', async () => {
    const app = await buildTestApi({ repositories: { sessions: createSessionRepository() } });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/device-challenges',
      payload: {
        accountId: 'account_00000001',
        deviceId: 'device_000000001',
      },
    });

    assert.equal(response.statusCode, 201);
    assert.equal(response.json().challengeId, 'challenge_000001');
  });

  it('creates a device session through the injected repository', async () => {
    const sessions = createSessionRepository();
    const app = await buildTestApi({ repositories: { sessions } });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/device-sessions',
      payload: {
        accountId: 'account_00000001',
        deviceId: 'device_000000001',
        challengeId: 'challenge_000001',
        signature: 'signed-challenge',
      },
    });

    assert.equal(response.statusCode, 201);
    assert.equal(response.json().token, 'issued-token');
  });

  it('revokes the current device session', async () => {
    const app = await buildTestApi({ repositories: { sessions: createSessionRepository() } });

    const response = await app.inject({
      method: 'DELETE',
      url: '/v1/auth/device-sessions/current',
      headers: {
        authorization: 'Bearer valid-session-token',
      },
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.json().revoked, true);
  });
});

describe('account route', () => {
  it('creates and returns account metadata', async () => {
    const accounts: AccountRepository = {
      async createAccount(input) {
        return {
          accountId: input.id ?? 'account_00000001',
          displayName: input.displayName,
          username: input.username,
          createdAt: new Date(0).toISOString(),
        };
      },
      async getAccount() {
        return null;
      },
      async searchAccounts() {
        return [];
      },
    };
    const app = await buildTestApi({ repositories: { accounts } });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/accounts',
      payload: {
        id: 'account_00000001',
        displayName: 'Eleanor',
        username: 'eleanor',
      },
    });

    assert.equal(response.statusCode, 201);
    assert.equal(response.json().displayName, 'Eleanor');
  });

  it('throttles repeated account creation attempts per route policy', async () => {
    const app = await buildTestApi();
    let response;

    for (let index = 0; index < 21; index += 1) {
      response = await app.inject({
        method: 'POST',
        url: '/v1/accounts',
        payload: {
          id: `account_rate_${String(index).padStart(6, '0')}`,
          displayName: 'Rate Limited',
          username: `rate${index}`,
        },
      });
    }

    assert.equal(response?.statusCode, 429);
    assert.equal(response?.json().error, 'rate_limited');
  });

  it('returns the authenticated account profile', async () => {
    const accounts: AccountRepository = {
      async createAccount(input) {
        return {
          accountId: input.id ?? 'account_00000001',
          displayName: input.displayName,
          username: input.username,
          createdAt: new Date(0).toISOString(),
        };
      },
      async getAccount(accountId) {
        return {
          accountId,
          displayName: 'Eleanor',
          username: 'eleanor',
          createdAt: new Date(0).toISOString(),
        };
      },
      async searchAccounts() {
        return [];
      },
    };
    const app = await buildTestApi({
      repositories: {
        accounts,
        sessions: createSessionRepository(),
      },
    });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/accounts/me',
      headers: {
        authorization: 'Bearer valid-session-token',
      },
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.json().accountId, 'account_00000001');
  });

  it('discovers account public device bundles for authenticated devices', async () => {
    const accounts: AccountRepository = {
      async createAccount(input) {
        return {
          accountId: input.id ?? 'account_00000001',
          displayName: input.displayName,
          username: input.username,
          createdAt: new Date(0).toISOString(),
        };
      },
      async getAccount() {
        return null;
      },
      async searchAccounts(query, limit) {
        assert.equal(query, 'maya');
        assert.equal(limit, 5);

        return [
          {
            accountId: 'account_maya_000001',
            displayName: 'Maya',
            username: 'maya.sec',
            devices: [
              {
                deviceId: 'device_maya_000001',
                deviceName: 'Maya Pixel',
                identityKey: 'identity-key-material-ciphertext-0001',
                signedPrekey: 'signed-prekey-material-ciphertext-01',
                signedPrekeySignature: 'signed-prekey-signature-ciphertext',
                oneTimePrekeys: ['one-time-prekey-0001'],
                publishedAt: new Date(0).toISOString(),
              },
            ],
          },
        ];
      },
    };
    const app = await buildTestApi({
      repositories: {
        accounts,
        sessions: createSessionRepository(),
      },
    });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/accounts/discover?query=maya&limit=5',
      headers: {
        authorization: 'Bearer valid-session-token',
      },
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.json().results.length, 1);
    assert.equal(response.json().results[0].devices[0].identityKey, 'identity-key-material-ciphertext-0001');
  });

  it('requires a device session before account discovery', async () => {
    const accounts: AccountRepository = {
      async createAccount(input) {
        return {
          accountId: input.id ?? 'account_00000001',
          displayName: input.displayName,
          username: input.username,
          createdAt: new Date(0).toISOString(),
        };
      },
      async getAccount() {
        return null;
      },
      async searchAccounts() {
        throw new Error('should not search without auth');
      },
    };
    const app = await buildTestApi({ repositories: { accounts, sessions: createSessionRepository() } });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/accounts/discover?query=maya',
    });

    assert.equal(response.statusCode, 401);
    assert.equal(response.json().error, 'missing_session');
  });
});

describe('maintenance route', () => {
  it('enqueues an envelope expiry sweep with the internal token', async () => {
    const jobQueue = new CapturingJobQueue();
    const app = await buildTestApi({ jobQueue });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/internal/jobs/envelopes/expire',
      headers: {
        'x-internal-job-token': 'test-internal-token',
      },
    });

    assert.equal(response.statusCode, 202);
    assert.equal(response.json().queued, true);
    assert.equal(jobQueue.expirySweepCount, 1);
  });

  it('rejects expiry job enqueue without the internal token', async () => {
    const app = await buildTestApi({ jobQueue: new CapturingJobQueue() });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/internal/jobs/envelopes/expire',
    });

    assert.equal(response.statusCode, 403);
  });

  it('enqueues a metadata retention cleanup job with the internal token', async () => {
    const jobQueue = new CapturingJobQueue();
    const app = await buildTestApi({ jobQueue });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/internal/jobs/metadata/cleanup',
      headers: {
        'x-internal-job-token': 'test-internal-token',
      },
    });

    assert.equal(response.statusCode, 202);
    assert.equal(response.json().queued, true);
    assert.equal(jobQueue.metadataCleanupCount, 1);
  });

  it('rejects metadata cleanup enqueue without the internal token', async () => {
    const app = await buildTestApi({ jobQueue: new CapturingJobQueue() });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/internal/jobs/metadata/cleanup',
    });

    assert.equal(response.statusCode, 403);
  });
});
