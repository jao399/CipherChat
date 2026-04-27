import type { Job } from 'bullmq';

import type { MessageRepository } from '../repositories/types.js';
import type { CipherChatJob } from './types.js';

export function createJobProcessor(messages: MessageRepository) {
  return async function processJob(job: Job<CipherChatJob['data'], unknown, CipherChatJob['name']>) {
    if (job.name === 'envelopes.expire') {
      const expiredCount = await messages.expireStaleEnvelopes();
      return { expiredCount };
    }

    if (job.name === 'delivery.fanout') {
      // Push payloads must stay generic. Actual clients fetch encrypted envelopes after wake.
      return {
        queuedGenericPushes: (job.data as { recipientDeviceCount: number }).recipientDeviceCount,
      };
    }

    return { ignored: true };
  };
}
