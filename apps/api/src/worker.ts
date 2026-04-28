import { Worker } from 'bullmq';

import { readApiConfig } from './config.js';
import { createPrismaClient } from './db/prisma.js';
import { createJobProcessor } from './jobs/processors.js';
import { jobQueueName } from './jobs/types.js';
import { createRedisClient } from './redis/client.js';
import { PrismaMessageRepository } from './repositories/prismaMessageRepository.js';
import { PrismaMetadataRetentionRepository } from './repositories/prismaMetadataRetentionRepository.js';

const config = readApiConfig();

if (!config.databaseUrl || !config.redisUrl) {
  throw new Error('DATABASE_URL and REDIS_URL are required to run the CipherChat worker');
}

const prisma = createPrismaClient();
const redis = createRedisClient(config.redisUrl);
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

const shutdown = async () => {
  await worker.close();
  await redis.quit();
  await prisma.$disconnect();
};

process.on('SIGINT', () => {
  void shutdown().then(() => process.exit(0));
});

process.on('SIGTERM', () => {
  void shutdown().then(() => process.exit(0));
});
