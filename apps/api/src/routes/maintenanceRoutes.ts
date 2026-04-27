import type { FastifyInstance } from 'fastify';

import type { JobQueuePort } from '../queue/jobQueue.js';
import { errorResponseSchema, queuedJobResponseSchema } from '../schemas.js';

export async function registerMaintenanceRoutes(
  app: FastifyInstance,
  jobQueue?: JobQueuePort,
  internalJobToken?: string,
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
}
