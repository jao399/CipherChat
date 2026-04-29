import type { Job } from 'bullmq';

import type { MessageRepository, MetadataRetentionRepository } from '../repositories/types.js';
import type { PushNotificationPort } from '../push/pushNotificationService.js';
import { createGenericDeliveryPushPayload } from '../push/pushPrivacy.js';
import type { CipherChatJob, DeliveryFanoutJobData } from './types.js';

export function createJobProcessor(
  messages: MessageRepository,
  metadataRetention?: MetadataRetentionRepository,
  pushNotifications?: PushNotificationPort,
) {
  return async function processJob(job: Job<CipherChatJob['data'], unknown, CipherChatJob['name']>) {
    if (job.name === 'envelopes.expire') {
      const expiredCount = await messages.expireStaleEnvelopes();
      return { expiredCount };
    }

    if (job.name === 'metadata.cleanup') {
      if (!metadataRetention) {
        throw new Error('Metadata retention repository is not configured');
      }

      return metadataRetention.cleanupExpiredMetadata();
    }

    if (job.name === 'delivery.fanout') {
      if (!pushNotifications) {
        throw new Error('Push notification service is not configured');
      }

      const data = job.data as DeliveryFanoutJobData;
      const payload = createGenericDeliveryPushPayload(data);
      return pushNotifications.sendGenericWake({
        recipientDeviceCount: data.recipientDeviceCount,
        payload,
      });
    }

    return { ignored: true };
  };
}
