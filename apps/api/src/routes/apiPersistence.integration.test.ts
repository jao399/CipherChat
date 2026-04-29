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
import { PrismaMetadataRetentionRepository } from '../repositories/prismaMetadataRetentionRepository.js';
import { PrismaSessionRepository } from '../repositories/prismaSessionRepository.js';
import { metadataRetentionPolicy } from '../security/metadataRetentionPolicy.js';

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
        metadataRetention: new PrismaMetadataRetentionRepository(prisma),
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

    const claimedPrekey = await app.inject({
      method: 'POST',
      url: `/v1/devices/bundles/${recipientAccountId}/${recipientDeviceId}/claim`,
      headers: {
        authorization: `Bearer ${senderToken}`,
      },
    });
    const exhaustedPrekey = await app.inject({
      method: 'POST',
      url: `/v1/devices/bundles/${recipientAccountId}/${recipientDeviceId}/claim`,
      headers: {
        authorization: `Bearer ${senderToken}`,
      },
    });

    assert.equal(claimedPrekey.statusCode, 200);
    assert.deepEqual(claimedPrekey.json().oneTimePrekeys, ['recipient-one-time-prekey-material-01']);
    assert.equal(exhaustedPrekey.statusCode, 200);
    assert.deepEqual(exhaustedPrekey.json().oneTimePrekeys, []);

    const prekeyStatus = await app.inject({
      method: 'GET',
      url: '/v1/devices/prekeys/status',
      headers: {
        authorization: `Bearer ${recipientToken}`,
      },
    });

    assert.equal(prekeyStatus.statusCode, 200);
    assert.equal(prekeyStatus.json().oneTimePrekeyCount, 0);
    assert.equal(prekeyStatus.json().needsTopUp, true);
    assert.doesNotMatch(JSON.stringify(prekeyStatus.json()), /identity-key|signed-prekey|one-time-prekey/i);

    const topUpPrekeys = await app.inject({
      method: 'POST',
      url: '/v1/devices/prekeys/top-up',
      headers: {
        authorization: `Bearer ${recipientToken}`,
      },
      payload: {
        oneTimePrekeys: ['recipient-top-up-prekey-0001', 'recipient-top-up-prekey-0002'],
      },
    });

    assert.equal(topUpPrekeys.statusCode, 200);
    assert.equal(topUpPrekeys.json().oneTimePrekeyCount, 2);
    assert.equal(topUpPrekeys.json().needsTopUp, true);
    assert.doesNotMatch(JSON.stringify(topUpPrekeys.json()), /recipient-top-up-prekey/i);

    const toppedUpClaim = await app.inject({
      method: 'POST',
      url: `/v1/devices/bundles/${recipientAccountId}/${recipientDeviceId}/claim`,
      headers: {
        authorization: `Bearer ${senderToken}`,
      },
    });

    assert.equal(toppedUpClaim.statusCode, 200);
    assert.deepEqual(toppedUpClaim.json().oneTimePrekeys, ['recipient-top-up-prekey-0001']);

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

    const queueStatsResponse = await app.inject({
      method: 'GET',
      url: '/v1/internal/ops/queue',
      headers: {
        'x-internal-job-token': 'test-internal-token',
      },
    });

    assert.equal(queueStatsResponse.statusCode, 200);
    assert.equal(queueStatsResponse.json().queueName, jobQueueName);
    assert.ok(queueStatsResponse.json().counts.waiting >= 1);
    assert.equal(queueStatsResponse.json().retention.retainedCompletedJobs, 1000);

    const rateLimitStatsResponse = await app.inject({
      method: 'GET',
      url: '/v1/internal/ops/redis/rate-limits',
      headers: {
        'x-internal-job-token': 'test-internal-token',
      },
    });

    assert.equal(rateLimitStatsResponse.statusCode, 200);
    assert.equal(rateLimitStatsResponse.json().namespace, 'rate-limit');
    assert.equal(rateLimitStatsResponse.json().cleanup, 'ttl-managed');

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

    const deviceListResponse = await app.inject({
      method: 'GET',
      url: '/v1/devices',
      headers: {
        authorization: `Bearer ${recipientToken}`,
      },
    });

    assert.equal(deviceListResponse.statusCode, 200);
    assert.equal(deviceListResponse.json().devices.length, 1);
    assert.equal(deviceListResponse.json().devices[0].deviceId, recipientDeviceId);
    assert.equal(deviceListResponse.json().devices[0].isCurrentDevice, true);

    const revokeDeviceResponse = await app.inject({
      method: 'DELETE',
      url: `/v1/devices/${recipientAccountId}/${recipientDeviceId}`,
      headers: {
        authorization: `Bearer ${recipientToken}`,
      },
    });

    assert.equal(revokeDeviceResponse.statusCode, 200);
    assert.equal(revokeDeviceResponse.json().revoked, true);

    const revokedBundleResponse = await app.inject({
      method: 'GET',
      url: `/v1/devices/bundles/${recipientAccountId}/${recipientDeviceId}`,
      headers: {
        authorization: `Bearer ${senderToken}`,
      },
    });

    assert.equal(revokedBundleResponse.statusCode, 404);

    const revokedSessionInboxResponse = await app.inject({
      method: 'GET',
      url: '/v1/messages/envelopes?limit=5',
      headers: {
        authorization: `Bearer ${recipientToken}`,
      },
    });

    assert.equal(revokedSessionInboxResponse.statusCode, 401);

    const storedEnvelope = await prisma.encryptedMessageEnvelope.findUnique({
      where: { messageId: 'message_integration_0001' },
    });
    const auditEvents = await prisma.auditEvent.findMany({
      where: {
        eventType: {
          in: [
            'device_bundle.first_device_published',
            'device_session.created',
            'device_bundle.one_time_prekey_claimed',
            'device_bundle.one_time_prekeys_topped_up',
            'encrypted_envelopes.fanout_queued',
            'encrypted_envelopes.delivered',
            'encrypted_envelope.acknowledged',
            'device.revoked',
          ],
        },
      },
    });

    assert.equal(storedEnvelope?.deliveryState, 'ACKNOWLEDGED');
    assert.equal(storedEnvelope?.bodyCiphertext, 'encrypted-body-only');
    assert.ok(auditEvents.length >= 10);
    assert.doesNotMatch(JSON.stringify(auditEvents), /identity-key|signed-prekey|recipient-top-up-prekey/i);
  });

  it('cleans expired metadata without touching active sessions or valid queued envelopes', async () => {
    await cleanDatabase();

    const now = new Date('2026-04-28T12:00:00.000Z');
    const oldChallengeDate = new Date(now.getTime() - metadataRetentionPolicy.challengeRetentionMs - 1);
    const oldSessionDate = new Date(now.getTime() - metadataRetentionPolicy.sessionRetentionMs - 1);
    const oldAcknowledgedEnvelopeDate = new Date(
      now.getTime() - metadataRetentionPolicy.acknowledgedEnvelopeRetentionMs - 1,
    );
    const oldExpiredEnvelopeDate = new Date(now.getTime() - metadataRetentionPolicy.expiredEnvelopeRetentionMs - 1);
    const oldFileDate = new Date(now.getTime() - metadataRetentionPolicy.deletedFileRetentionMs - 1);
    const oldAuditDate = new Date(now.getTime() - metadataRetentionPolicy.auditEventRetentionMs - 1);

    await prisma.account.create({
      data: {
        id: 'account_retention_0001',
        displayName: 'Retention Test',
        devices: {
          create: {
            id: 'device_retention_0001',
            displayName: 'Retention Device',
            identityKey: 'identity-key-retention-0001',
          },
        },
      },
    });

    await prisma.deviceSessionChallenge.createMany({
      data: [
        {
          id: 'challenge_old_expired',
          accountId: 'account_retention_0001',
          deviceId: 'device_retention_0001',
          challenge: 'challenge-old-expired',
          expiresAt: oldChallengeDate,
        },
        {
          id: 'challenge_active',
          accountId: 'account_retention_0001',
          deviceId: 'device_retention_0001',
          challenge: 'challenge-active',
          expiresAt: new Date(now.getTime() + 60_000),
        },
      ],
    });

    await prisma.deviceSession.createMany({
      data: [
        {
          id: 'session_old_expired',
          accountId: 'account_retention_0001',
          deviceId: 'device_retention_0001',
          tokenHash: 'token-hash-old-expired',
          expiresAt: oldSessionDate,
        },
        {
          id: 'session_active',
          accountId: 'account_retention_0001',
          deviceId: 'device_retention_0001',
          tokenHash: 'token-hash-active',
          expiresAt: new Date(now.getTime() + 60_000),
        },
      ],
    });

    await prisma.encryptedMessageEnvelope.createMany({
      data: [
        {
          messageId: 'message_old_acknowledged',
          conversationId: 'conversation_retention',
          senderAccountId: 'sender_retention',
          senderDeviceId: 'sender_device_retention',
          recipientAccountId: 'account_retention_0001',
          recipientDeviceId: 'device_retention_0001',
          headerCiphertext: 'header-old-acknowledged',
          bodyCiphertext: 'body-old-acknowledged',
          deliveryState: 'ACKNOWLEDGED',
          queuedAt: oldAcknowledgedEnvelopeDate,
          deliveredAt: oldAcknowledgedEnvelopeDate,
          acknowledgedAt: oldAcknowledgedEnvelopeDate,
        },
        {
          messageId: 'message_old_expired',
          conversationId: 'conversation_retention',
          senderAccountId: 'sender_retention',
          senderDeviceId: 'sender_device_retention',
          recipientAccountId: 'account_retention_0001',
          recipientDeviceId: 'device_retention_0001',
          headerCiphertext: 'header-old-expired',
          bodyCiphertext: 'body-old-expired',
          deliveryState: 'EXPIRED',
          queuedAt: oldExpiredEnvelopeDate,
          expiresAt: oldExpiredEnvelopeDate,
        },
        {
          messageId: 'message_valid_queued',
          conversationId: 'conversation_retention',
          senderAccountId: 'sender_retention',
          senderDeviceId: 'sender_device_retention',
          recipientAccountId: 'account_retention_0001',
          recipientDeviceId: 'device_retention_0001',
          headerCiphertext: 'header-valid-queued',
          bodyCiphertext: 'body-valid-queued',
          deliveryState: 'QUEUED',
          queuedAt: now,
          expiresAt: new Date(now.getTime() + 60_000),
        },
      ],
    });

    await prisma.encryptedFileObject.createMany({
      data: [
        {
          id: 'file_old_deleted',
          ownerAccountId: 'account_retention_0001',
          objectRef: 'object-ref-old-deleted',
          sizeBytes: 12n,
          contentDigest: 'digest-old-deleted',
          deletedAt: oldFileDate,
        },
        {
          id: 'file_active',
          ownerAccountId: 'account_retention_0001',
          objectRef: 'object-ref-active',
          sizeBytes: 12n,
          contentDigest: 'digest-active',
          expiresAt: new Date(now.getTime() + 60_000),
        },
      ],
    });

    await prisma.auditEvent.createMany({
      data: [
        {
          eventType: 'retention.old',
          createdAt: oldAuditDate,
        },
        {
          eventType: 'retention.active',
          createdAt: now,
        },
      ],
    });

    const result = await new PrismaMetadataRetentionRepository(prisma).cleanupExpiredMetadata(now);

    assert.deepEqual(result, {
      deletedChallenges: 1,
      deletedSessions: 1,
      deletedAcknowledgedEnvelopes: 1,
      deletedExpiredEnvelopes: 1,
      deletedFileObjects: 1,
      deletedAuditEvents: 1,
    });

    assert.equal(await prisma.deviceSessionChallenge.count({ where: { id: 'challenge_active' } }), 1);
    assert.equal(await prisma.deviceSession.count({ where: { id: 'session_active' } }), 1);
    assert.equal(await prisma.encryptedMessageEnvelope.count({ where: { messageId: 'message_valid_queued' } }), 1);
    assert.equal(await prisma.encryptedFileObject.count({ where: { id: 'file_active' } }), 1);
    assert.equal(await prisma.auditEvent.count({ where: { eventType: 'retention.active' } }), 1);
  });
});
