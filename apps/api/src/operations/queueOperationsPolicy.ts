import type { JobsOptions } from 'bullmq';

import type { CipherChatJob } from '../jobs/types.js';

export type QueueJobName = CipherChatJob['name'];

export type QueueDepthStatus = 'healthy' | 'warning';

export type QueueDepthCounts = {
  waiting: number;
  active: number;
  delayed: number;
  failed: number;
  completed: number;
  paused: number;
};

export type QueueOperationsPolicy = {
  retainedCompletedJobs: number;
  retainedFailedJobs: number;
  completedJobCleanupGraceMs: number;
  failedJobCleanupGraceMs: number;
  cleanupBatchSize: number;
  depthWarningThresholds: QueueDepthCounts;
  jobs: Record<QueueJobName, JobsOptions>;
};

export const queueOperationsPolicy: QueueOperationsPolicy = {
  retainedCompletedJobs: 1000,
  retainedFailedJobs: 5000,
  completedJobCleanupGraceMs: 1000 * 60 * 60 * 24,
  failedJobCleanupGraceMs: 1000 * 60 * 60 * 24 * 7,
  cleanupBatchSize: 1000,
  depthWarningThresholds: {
    waiting: 1000,
    active: 100,
    delayed: 5000,
    failed: 100,
    completed: 5000,
    paused: 100,
  },
  jobs: {
    'delivery.fanout': {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    },
    'envelopes.expire': {
      attempts: 3,
      removeOnComplete: 1000,
      removeOnFail: 5000,
    },
    'metadata.cleanup': {
      attempts: 3,
      removeOnComplete: 1000,
      removeOnFail: 5000,
    },
  },
};

export function evaluateQueueDepth(
  counts: QueueDepthCounts,
  thresholds = queueOperationsPolicy.depthWarningThresholds,
): { status: QueueDepthStatus; warnings: string[] } {
  const warnings = Object.entries(thresholds).flatMap(([key, threshold]) => {
    const count = counts[key as keyof QueueDepthCounts];
    return count > threshold ? [`${key}:${count}>${threshold}`] : [];
  });

  return {
    status: warnings.length > 0 ? 'warning' : 'healthy',
    warnings,
  };
}
