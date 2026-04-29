import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { GenericPushWakeResult, PushNotificationPort } from '../push/pushNotificationService.js';
import type { MessageRepository, MetadataRetentionRepository } from '../repositories/types.js';
import { createJobProcessor } from './processors.js';

function createMessageRepository(): MessageRepository {
  return {
    async storeEncryptedEnvelope() {
      throw new Error('not used');
    },
    async storeEncryptedEnvelopeFanout() {
      throw new Error('not used');
    },
    async listQueuedEnvelopes() {
      return { envelopes: [] };
    },
    async acknowledgeEnvelope() {
      return null;
    },
    async expireStaleEnvelopes() {
      return 3;
    },
  };
}

describe('job processor', () => {
  it('runs metadata retention cleanup jobs through the retention repository', async () => {
    let cleanupCalls = 0;
    const metadataRetention: MetadataRetentionRepository = {
      async cleanupExpiredMetadata() {
        cleanupCalls += 1;
        return {
          deletedChallenges: 1,
          deletedSessions: 2,
          deletedAcknowledgedEnvelopes: 3,
          deletedExpiredEnvelopes: 4,
          deletedFileObjects: 5,
          deletedAuditEvents: 6,
        };
      },
    };
    const processor = createJobProcessor(createMessageRepository(), metadataRetention);

    const result = await processor({
      name: 'metadata.cleanup',
      data: { requestedAt: new Date(0).toISOString() },
    } as never);

    assert.equal(cleanupCalls, 1);
    assert.deepEqual(result, {
      deletedChallenges: 1,
      deletedSessions: 2,
      deletedAcknowledgedEnvelopes: 3,
      deletedExpiredEnvelopes: 4,
      deletedFileObjects: 5,
      deletedAuditEvents: 6,
    });
  });

  it('fails metadata cleanup jobs when retention storage is unavailable', async () => {
    const processor = createJobProcessor(createMessageRepository());

    await assert.rejects(
      () =>
        processor({
          name: 'metadata.cleanup',
          data: { requestedAt: new Date(0).toISOString() },
        } as never),
      /Metadata retention repository is not configured/,
    );
  });

  it('sends only generic push wake payloads for delivery fanout jobs', async () => {
    const sentPayloads: unknown[] = [];
    const pushNotifications: PushNotificationPort = {
      async sendGenericWake(input) {
        sentPayloads.push(input.payload);
        return {
          provider: 'configured',
          queuedGenericPushes: input.recipientDeviceCount,
          opaqueEventId: input.payload.opaqueEventId,
        };
      },
    };
    const processor = createJobProcessor(createMessageRepository(), undefined, pushNotifications);

    const result = await processor({
      name: 'delivery.fanout',
      data: {
        messageIds: ['message_001', 'message_002'],
        recipientDeviceCount: 2,
      },
    } as never);

    assert.equal(sentPayloads.length, 1);
    assert.deepEqual(Object.keys(sentPayloads[0] as Record<string, unknown>).sort(), [
      'deliveryHint',
      'opaqueEventId',
    ]);
    const pushResult = result as GenericPushWakeResult;
    assert.equal(pushResult.queuedGenericPushes, 2);
    assert.equal(pushResult.provider, 'configured');
  });
});
