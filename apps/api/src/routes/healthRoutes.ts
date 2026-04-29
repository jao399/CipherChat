import type { FastifyInstance } from 'fastify';

import { healthResponseSchema, readinessResponseSchema } from '../schemas.js';
import { probeApiRuntimeHealth } from '../startup/runtimeHealth.js';

export async function registerHealthRoutes(
  app: FastifyInstance,
  databaseHealthCheck?: () => Promise<void>,
  queueHealthCheck?: () => Promise<void>,
) {
  app.get(
    '/health',
    {
      schema: {
        response: {
          200: healthResponseSchema,
        },
      },
    },
    async () => ({
      ok: true,
      service: 'cipherchat-api',
      version: '0.1.0',
    }),
  );

  app.get(
    '/ready',
    {
      schema: {
        response: {
          200: readinessResponseSchema,
        },
      },
    },
    async () => {
      return probeApiRuntimeHealth({
        databaseCheck: databaseHealthCheck,
        queueCheck: queueHealthCheck,
      });
    },
  );
}
