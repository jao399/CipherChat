import type { FastifyInstance } from 'fastify';

import { healthResponseSchema, readinessResponseSchema } from '../schemas.js';

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
      let database = 'disabled';

      if (databaseHealthCheck) {
        try {
          await databaseHealthCheck();
          database = 'connected';
        } catch {
          database = 'unavailable';
        }
      }
      let queue = 'disabled';

      if (queueHealthCheck) {
        try {
          await queueHealthCheck();
          queue = 'connected';
        } catch {
          queue = 'unavailable';
        }
      }

      return {
        ok: database !== 'unavailable' && queue !== 'unavailable',
        checks: {
          api: 'ready',
          database,
          queue,
          objectStorage: 'not-connected-in-phase-9',
        },
      };
    },
  );
}
