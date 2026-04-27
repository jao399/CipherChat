import { Queue } from 'bullmq';
import type { Redis } from 'ioredis';

import { jobQueueName } from '../jobs/types.js';

export type JobQueuePort = {
  enqueueDeliveryFanout(input: { messageIds: string[]; recipientDeviceCount: number }): Promise<void>;
  enqueueEnvelopeExpirySweep(): Promise<void>;
  close?(): Promise<void>;
};

export class NoopJobQueue implements JobQueuePort {
  async enqueueDeliveryFanout() {}
  async enqueueEnvelopeExpirySweep() {}
}

export class BullMqJobQueue implements JobQueuePort {
  private readonly queue: Queue;

  constructor(connection: Redis) {
    this.queue = new Queue(jobQueueName, {
      connection,
    });
  }

  async enqueueDeliveryFanout(input: { messageIds: string[]; recipientDeviceCount: number }) {
    await this.queue.add(
      'delivery.fanout',
      {
        messageIds: input.messageIds,
        recipientDeviceCount: input.recipientDeviceCount,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    );
  }

  async enqueueEnvelopeExpirySweep() {
    await this.queue.add(
      'envelopes.expire',
      {
        requestedAt: new Date().toISOString(),
      },
      {
        attempts: 3,
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    );
  }

  async close() {
    await this.queue.close();
  }
}
