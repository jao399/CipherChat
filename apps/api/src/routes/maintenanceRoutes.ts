import type { FastifyInstance } from 'fastify';

import type { RedisRateLimitOperationalStats } from '../middleware/redisRateLimitStore.js';
import type { JobQueuePort } from '../queue/jobQueue.js';
import {
  errorResponseSchema,
  queuedJobResponseSchema,
  queueOperationalCleanupResponseSchema,
  queueOperationalStatsResponseSchema,
  redisRateLimitOperationalStatsResponseSchema,
} from '../schemas.js';

type RateLimitOperationalStatsStore = {
  getOperationalStats(): Promise<RedisRateLimitOperationalStats>;
};

export async function registerMaintenanceRoutes(
  app: FastifyInstance,
  jobQueue?: JobQueuePort,
  internalJobToken?: string,
  rateLimitOperationalStats?: RateLimitOperationalStatsStore,
) {
  app.post(
    '/v1/internal/jobs/envelopes/expire',
    {
      schema: {
        response: {
          202: queuedJobResponseSchema,
          403: errorResponseSchema,
          503: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      if (!internalJobToken || request.headers['x-internal-job-token'] !== internalJobToken) {
        return reply.code(403).send({
          error: 'forbidden',
          message: 'A valid internal job token is required.',
        });
      }

      if (!jobQueue) {
        return reply.code(503).send({
          error: 'queue_unavailable',
          message: 'Job queue is not configured.',
        });
      }

      await jobQueue.enqueueEnvelopeExpirySweep();
      return reply.code(202).send({ queued: true });
    },
  );

  app.post(
    '/v1/internal/jobs/metadata/cleanup',
    {
      schema: {
        response: {
          202: queuedJobResponseSchema,
          403: errorResponseSchema,
          503: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      if (!internalJobToken || request.headers['x-internal-job-token'] !== internalJobToken) {
        return reply.code(403).send({
          error: 'forbidden',
          message: 'A valid internal job token is required.',
        });
      }

      if (!jobQueue) {
        return reply.code(503).send({
          error: 'queue_unavailable',
          message: 'Job queue is not configured.',
        });
      }

      await jobQueue.enqueueMetadataRetentionCleanup();
      return reply.code(202).send({ queued: true });
    },
  );

  app.get(
    '/v1/internal/ops/queue',
    {
      schema: {
        response: {
          200: queueOperationalStatsResponseSchema,
          403: errorResponseSchema,
          503: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      if (!internalJobToken || request.headers['x-internal-job-token'] !== internalJobToken) {
        return reply.code(403).send({
          error: 'forbidden',
          message: 'A valid internal job token is required.',
        });
      }

      if (!jobQueue?.getOperationalStats) {
        return reply.code(503).send({
          error: 'queue_unavailable',
          message: 'Queue operational stats are not configured.',
        });
      }

      return jobQueue.getOperationalStats();
    },
  );

  app.post(
    '/v1/internal/jobs/queue/cleanup',
    {
      schema: {
        response: {
          200: queueOperationalCleanupResponseSchema,
          403: errorResponseSchema,
          503: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      if (!internalJobToken || request.headers['x-internal-job-token'] !== internalJobToken) {
        return reply.code(403).send({
          error: 'forbidden',
          message: 'A valid internal job token is required.',
        });
      }

      if (!jobQueue?.cleanupOperationalState) {
        return reply.code(503).send({
          error: 'queue_unavailable',
          message: 'Queue operational cleanup is not configured.',
        });
      }

      return jobQueue.cleanupOperationalState();
    },
  );

  app.get(
    '/v1/internal/ops/redis/rate-limits',
    {
      schema: {
        response: {
          200: redisRateLimitOperationalStatsResponseSchema,
          403: errorResponseSchema,
          503: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      if (!internalJobToken || request.headers['x-internal-job-token'] !== internalJobToken) {
        return reply.code(403).send({
          error: 'forbidden',
          message: 'A valid internal job token is required.',
        });
      }

      if (!rateLimitOperationalStats) {
        return reply.code(503).send({
          error: 'redis_unavailable',
          message: 'Redis rate-limit operational stats are not configured.',
        });
      }

      return rateLimitOperationalStats.getOperationalStats();
    },
  );
}
