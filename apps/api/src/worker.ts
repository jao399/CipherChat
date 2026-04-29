import { Worker } from 'bullmq';

import { readApiConfig } from './config.js';
import { createPrismaClient } from './db/prisma.js';
import { createJobProcessor } from './jobs/processors.js';
import { jobQueueName } from './jobs/types.js';
import { createRedisClient } from './redis/client.js';
import { PrismaMessageRepository } from './repositories/prismaMessageRepository.js';
import { PrismaMetadataRetentionRepository } from './repositories/prismaMetadataRetentionRepository.js';
import { checkPrismaReady } from './db/prisma.js';
import { createGracefulShutdown } from './startup/gracefulShutdown.js';
import { ensureStartupDependencies } from './startup/runtimeHealth.js';

const config = readApiConfig();

if (!config.databaseUrl || !config.redisUrl) {
  throw new Error('DATABASE_URL and REDIS_URL are required to run the CipherChat worker');
}

const prisma = createPrismaClient();
const redis = createRedisClient(config.redisUrl);
await ensureStartupDependencies({
  databaseCheck: () => checkPrismaReady(prisma),
  queueCheck: async () => {
    await redis.ping();
  },
});

const messages = new PrismaMessageRepository(prisma);
const metadataRetention = new PrismaMetadataRetentionRepository(prisma);

const worker = new Worker(jobQueueName, createJobProcessor(messages, metadataRetention), {
  connection: redis,
});

worker.on('failed', (job, error) => {
  console.error({ jobId: job?.id, jobName: job?.name, error }, 'CipherChat job failed');
});

worker.on('completed', (job) => {
  console.log({ jobId: job.id, jobName: job.name }, 'CipherChat job completed');
});

const shutdown = createGracefulShutdown({
  label: 'CipherChat worker',
  close: async () => {
    await worker.close();
    await redis.quit();
    await prisma.$disconnect();
  },
  logger: {
    error: (error, message) => {
      console.error({ error }, message);
    },
    info: (message) => {
      console.log(message);
    },
  },
});

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
