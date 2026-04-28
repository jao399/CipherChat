import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { Queue } from 'bullmq';
import type { FastifyInstance } from 'fastify';
import type { Redis } from 'ioredis';

import { InsecureDevelopmentSignatureVerifier } from '../auth/signatureVerifier.js';
import { buildApi } from '../app.js';
import { checkPrismaReady, createPrismaClient } from '../db/prisma.js';
import { jobQueueName } from '../jobs/types.js';
import { RedisRateLimitStore } from '../middleware/redisRateLimitStore.js';
import { BullMqJobQueue } from '../queue/jobQueue.js';
import { createRedisClient } from '../redis/client.js';
import { PrismaAccountRepository } from '../repositories/prismaAccountRepository.js';
import { PrismaDeviceRepository } from '../repositories/prismaDeviceRepository.js';
import { PrismaMessageRepository } from '../repositories/prismaMessageRepository.js';
import { PrismaSessionRepository } from '../repositories/prismaSessionRepository.js';

const runIntegrationTests = process.env.RUN_API_INTEGRATION_TESTS === 'true';

const config = {
  host: '127.0.0.1',
  port: 0,
  corsOrigin: 'http://localhost:8081',
  nodeEnv: 'test',
  internalJobToken: 'test-internal-token',
  rateLimitWindowMs: 60_000,
  rateLimitMaxRequests: 1_000,
};

const prisma = createPrismaClient();
let redis: Redis;
let app: FastifyInstance;
let queue: Queue;

async function cleanDatabase() {
  await prisma.auditEvent.deleteMany();
  await prisma.abuseReport.deleteMany();
  await prisma.encryptedFileObject.deleteMany();
  await prisma.encryptedMessageEnvelope.deleteMany();
  await prisma.deviceSession.deleteMany();
  await prisma.deviceSessionChallenge.deleteMany();
  await prisma.prekeyBundle.deleteMany();
  await prisma.device.deleteMany();
  await prisma.account.deleteMany();
}

describe('API persistence integration', { skip: !runIntegrationTests }, () => {
  before(async () => {
    redis = createRedisClient(process.env.REDIS_URL ?? 'redis://localhost:6379');
    queue = new Queue(jobQueueName, { connection: redis });
    await cleanDatabase();
    await queue.drain(true);

    const signatureVerifier = new InsecureDevelopmentSignatureVerifier();
    app = await buildApi(config, {
      repositories: {
        accounts: new PrismaAccountRepository(prisma),
        devices: new PrismaDeviceRepository(prisma),
        messages: new PrismaMessageRepository(prisma),
        sessions: new PrismaSessionRepository(prisma, signatureVerifier),
      },
      jobQueue: new BullMqJobQueue(redis),
      rateLimitStore: new RedisRateLimitStore(redis),
      databaseHealthCheck: () => checkPrismaReady(prisma),
      queueHealthCheck: async () => {
        await redis.ping();
      },
      close: async () => {
        await prisma.$disconnect();
        await redis.quit();
      },
    });
  });

  after(async () => {
    await app?.close();
    await queue?.close();
  });

  it('persists device sessions, encrypted envelope delivery, acknowledgements, and delivery jobs', async () => {
    const senderAccountId = 'account_sender_integration_0001';
    const senderDeviceId = 'device_sender_integration_0001';
    const recipientAccountId = 'account_recipient_integration_1';
    const recipientDeviceId = 'device_recipient_integration_1';

    const senderBundle = {
      accountId: senderAccountId,
      accountDisplayName: 'Sender Integration',
      deviceId: senderDeviceId,
      deviceName: 'Sender Pixel',
      identityKey: 'sender-identity-key-material-00000001',
      signedPrekey: 'sender-signed-prekey-material-000001',
      signedPrekeySignature: 'sender-signed-prekey-signature-0001',
      oneTimePrekeys: ['sender-one-time-prekey-material-0001'],
    };
    const recipientBundle = {
      accountId: recipientAccountId,
      accountDisplayName: 'Recipient Integration',
      deviceId: recipientDeviceId,
      deviceName: 'Recipient Pixel',
      identityKey: 'recipient-identity-key-material-0001',
      signedPrekey: 'recipient-signed-prekey-material-001',
      signedPrekeySignature: 'recipient-signed-prekey-signature-01',
      oneTimePrekeys: ['recipient-one-time-prekey-material-01'],
    };

    for (const payload of [senderBundle, recipientBundle]) {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/devices/bundles',
        payload,
      });

      assert.equal(response.statusCode, 202);
    }

    const senderChallenge = await app.inject({
      method: 'POST',
      url: '/v1/auth/device-challenges',
      payload: {
        accountId: senderAccountId,
        deviceId: senderDeviceId,
      },
    });
    const recipientChallenge = await app.inject({
      method: 'POST',
      url: '/v1/auth/device-challenges',
      payload: {
        accountId: recipientAccountId,
        deviceId: recipientDeviceId,
      },
    });

    assert.equal(senderChallenge.statusCode, 201);
    assert.equal(recipientChallenge.statusCode, 201);

    const senderChallengeBody = senderChallenge.json();
    const recipientChallengeBody = recipientChallenge.json();
    const senderSession = await app.inject({
      method: 'POST',
      url: '/v1/auth/device-sessions',
      payload: {
        accountId: senderAccountId,
        deviceId: senderDeviceId,
        challengeId: senderChallengeBody.challengeId,
        signature: `dev:${senderChallengeBody.challenge}`,
      },
    });
    const recipientSession = await app.inject({
      method: 'POST',
      url: '/v1/auth/device-sessions',
      payload: {
        accountId: recipientAccountId,
        deviceId: recipientDeviceId,
        challengeId: recipientChallengeBody.challengeId,
        signature: `dev:${recipientChallengeBody.challenge}`,
      },
    });

    assert.equal(senderSession.statusCode, 201);
    assert.equal(recipientSession.statusCode, 201);

    const senderToken = senderSession.json().token;
    const recipientToken = recipientSession.json().token;
    const sendResponse = await app.inject({
      method: 'POST',
      url: '/v1/messages/envelopes/fanout',
      headers: {
        authorization: `Bearer ${senderToken}`,
      },
      payload: {
        conversationId: 'conversation_integration_0001',
        senderAccountId,
        senderDeviceId,
        envelopes: [
          {
            messageId: 'message_integration_0001',
            recipientAccountId,
            recipientDeviceId,
            ciphertext: 'encrypted-body-only',
            header: 'encrypted-header-only',
          },
        ],
      },
    });

    assert.equal(sendResponse.statusCode, 202);
    assert.equal(sendResponse.json().envelopeCount, 1);

    const queuedJobs = await queue.getJobs(['waiting', 'delayed', 'paused']);
    assert.equal(queuedJobs.length, 1);
    assert.deepEqual(queuedJobs[0]?.data.messageIds, ['message_integration_0001']);

    const inboxResponse = await app.inject({
      method: 'GET',
      url: '/v1/messages/envelopes?limit=5',
      headers: {
        authorization: `Bearer ${recipientToken}`,
      },
    });

    assert.equal(inboxResponse.statusCode, 200);
    assert.equal(inboxResponse.json().envelopes.length, 1);
    assert.equal(inboxResponse.json().envelopes[0].bodyCiphertext, 'encrypted-body-only');

    const ackResponse = await app.inject({
      method: 'POST',
      url: '/v1/messages/envelopes/message_integration_0001/ack',
      headers: {
        authorization: `Bearer ${recipientToken}`,
      },
    });

    assert.equal(ackResponse.statusCode, 200);
    assert.equal(ackResponse.json().deliveryState, 'ACKNOWLEDGED');

    const storedEnvelope = await prisma.encryptedMessageEnvelope.findUnique({
      where: { messageId: 'message_integration_0001' },
    });
    const auditEvents = await prisma.auditEvent.findMany({
      where: {
        eventType: {
          in: [
            'device_session.created',
            'encrypted_envelopes.fanout_queued',
            'encrypted_envelopes.delivered',
            'encrypted_envelope.acknowledged',
          ],
        },
      },
    });

    assert.equal(storedEnvelope?.deliveryState, 'ACKNOWLEDGED');
    assert.equal(storedEnvelope?.bodyCiphertext, 'encrypted-body-only');
    assert.ok(auditEvents.length >= 4);
  });
});
