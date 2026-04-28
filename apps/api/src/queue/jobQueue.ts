import { Queue } from 'bullmq';
import type { Redis } from 'ioredis';

import { jobQueueName } from '../jobs/types.js';
import {
  evaluateQueueDepth,
  queueOperationsPolicy,
  type QueueDepthCounts,
  type QueueOperationsPolicy,
} from '../operations/queueOperationsPolicy.js';

export type QueueOperationalStats = {
  queueName: string;
  status: 'disabled' | 'healthy' | 'warning';
  counts: QueueDepthCounts;
  warnings: string[];
  retention: {
    retainedCompletedJobs: number;
    retainedFailedJobs: number;
    completedJobCleanupGraceMs: number;
    failedJobCleanupGraceMs: number;
  };
};

export type QueueOperationalCleanupResult = {
  cleanedCompletedJobs: number;
  cleanedFailedJobs: number;
};

export type JobQueuePort = {
  enqueueDeliveryFanout(input: { messageIds: string[]; recipientDeviceCount: number }): Promise<void>;
  enqueueEnvelopeExpirySweep(): Promise<void>;
  enqueueMetadataRetentionCleanup(): Promise<void>;
  getOperationalStats?(): Promise<QueueOperationalStats>;
  cleanupOperationalState?(): Promise<QueueOperationalCleanupResult>;
  close?(): Promise<void>;
};

export class NoopJobQueue implements JobQueuePort {
  async enqueueDeliveryFanout() {}
  async enqueueEnvelopeExpirySweep() {}
  async enqueueMetadataRetentionCleanup() {}

  async getOperationalStats(): Promise<QueueOperationalStats> {
    return {
      queueName: jobQueueName,
      status: 'disabled',
      counts: {
        waiting: 0,
        active: 0,
        delayed: 0,
        failed: 0,
        completed: 0,
        paused: 0,
      },
      warnings: [],
      retention: {
        retainedCompletedJobs: queueOperationsPolicy.retainedCompletedJobs,
        retainedFailedJobs: queueOperationsPolicy.retainedFailedJobs,
        completedJobCleanupGraceMs: queueOperationsPolicy.completedJobCleanupGraceMs,
        failedJobCleanupGraceMs: queueOperationsPolicy.failedJobCleanupGraceMs,
      },
    };
  }

  async cleanupOperationalState(): Promise<QueueOperationalCleanupResult> {
    return {
      cleanedCompletedJobs: 0,
      cleanedFailedJobs: 0,
    };
  }
}

export class BullMqJobQueue implements JobQueuePort {
  private readonly queue: Queue;

  constructor(
    connection: Redis,
    private readonly policy: QueueOperationsPolicy = queueOperationsPolicy,
  ) {
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
      this.policy.jobs['delivery.fanout'],
    );
  }

  async enqueueEnvelopeExpirySweep() {
    await this.queue.add(
      'envelopes.expire',
      {
        requestedAt: new Date().toISOString(),
      },
      this.policy.jobs['envelopes.expire'],
    );
  }

  async enqueueMetadataRetentionCleanup() {
    await this.queue.add(
      'metadata.cleanup',
      {
        requestedAt: new Date().toISOString(),
      },
      this.policy.jobs['metadata.cleanup'],
    );
  }

  async getOperationalStats(): Promise<QueueOperationalStats> {
    const counts = await this.queue.getJobCounts('waiting', 'active', 'delayed', 'failed', 'completed', 'paused');
    const normalizedCounts: QueueDepthCounts = {
      waiting: counts.waiting ?? 0,
      active: counts.active ?? 0,
      delayed: counts.delayed ?? 0,
      failed: counts.failed ?? 0,
      completed: counts.completed ?? 0,
      paused: counts.paused ?? 0,
    };
    const evaluation = evaluateQueueDepth(normalizedCounts, this.policy.depthWarningThresholds);

    return {
      queueName: jobQueueName,
      status: evaluation.status,
      counts: normalizedCounts,
      warnings: evaluation.warnings,
      retention: {
        retainedCompletedJobs: this.policy.retainedCompletedJobs,
        retainedFailedJobs: this.policy.retainedFailedJobs,
        completedJobCleanupGraceMs: this.policy.completedJobCleanupGraceMs,
        failedJobCleanupGraceMs: this.policy.failedJobCleanupGraceMs,
      },
    };
  }

  async cleanupOperationalState(): Promise<QueueOperationalCleanupResult> {
    const cleanedCompletedJobs = await this.queue.clean(
      this.policy.completedJobCleanupGraceMs,
      this.policy.cleanupBatchSize,
      'completed',
    );
    const cleanedFailedJobs = await this.queue.clean(
      this.policy.failedJobCleanupGraceMs,
      this.policy.cleanupBatchSize,
      'failed',
    );

    return {
      cleanedCompletedJobs: cleanedCompletedJobs.length,
      cleanedFailedJobs: cleanedFailedJobs.length,
    };
  }

  async close() {
    await this.queue.close();
  }
}
