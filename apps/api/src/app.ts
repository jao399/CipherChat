import cors from '@fastify/cors';
import Fastify from 'fastify';

import type { ApiConfig } from './config.js';
import { createRateLimitHook } from './middleware/rateLimit.js';
import type { RateLimitStore } from './middleware/rateLimit.js';
import type { RedisRateLimitOperationalStats } from './middleware/redisRateLimitStore.js';
import type { JobQueuePort } from './queue/jobQueue.js';
import type { ApiRepositories } from './repositories/types.js';
import { registerAccountRoutes } from './routes/accountRoutes.js';
import { registerAuthRoutes } from './routes/authRoutes.js';
import { registerDeviceRoutes } from './routes/deviceRoutes.js';
import { registerHealthRoutes } from './routes/healthRoutes.js';
import { registerMaintenanceRoutes } from './routes/maintenanceRoutes.js';
import { registerMessageRoutes } from './routes/messageRoutes.js';

export type ApiDependencies = {
  repositories?: ApiRepositories;
  jobQueue?: JobQueuePort;
  rateLimitStore?: RateLimitStore;
  databaseHealthCheck?: () => Promise<void>;
  queueHealthCheck?: () => Promise<void>;
  close?: () => Promise<void>;
};

function hasOperationalStats(value: unknown): value is { getOperationalStats(): Promise<RedisRateLimitOperationalStats> } {
  return Boolean(value && typeof (value as { getOperationalStats?: unknown }).getOperationalStats === 'function');
}

export async function buildApi(config: ApiConfig, dependencies: ApiDependencies = {}) {
  const app = Fastify({
    logger: config.nodeEnv !== 'test',
  });

  await app.register(cors, {
    origin: config.corsOrigin,
  });

  app.addHook(
    'onRequest',
    createRateLimitHook({
      windowMs: config.rateLimitWindowMs,
      maxRequests: config.rateLimitMaxRequests,
      store: dependencies.rateLimitStore,
    }),
  );

  await registerHealthRoutes(app, dependencies.databaseHealthCheck, dependencies.queueHealthCheck);
  await registerAccountRoutes(app, dependencies.repositories?.accounts, dependencies.repositories?.sessions);
  await registerAuthRoutes(app, dependencies.repositories?.sessions);
  await registerDeviceRoutes(app, dependencies.repositories?.devices, dependencies.repositories?.sessions);
  await registerMessageRoutes(
    app,
    dependencies.repositories?.messages,
    dependencies.repositories?.sessions,
    dependencies.jobQueue,
  );
  await registerMaintenanceRoutes(
    app,
    dependencies.jobQueue,
    config.internalJobToken,
    hasOperationalStats(dependencies.rateLimitStore) ? dependencies.rateLimitStore : undefined,
  );

  if (dependencies.close) {
    app.addHook('onClose', async () => {
      await dependencies.jobQueue?.close?.();
      await dependencies.close?.();
    });
  }

  app.setErrorHandler((error: { statusCode?: number; message?: string }, _request, reply) => {
    app.log.error({ err: error }, 'request failed');
    const statusCode = error.statusCode && error.statusCode >= 400 ? error.statusCode : 500;

    return reply.code(statusCode).send({
      error: statusCode === 500 ? 'internal_error' : 'request_error',
      message: statusCode === 500 ? 'Request failed' : error.message,
    });
  });

  return app;
}
