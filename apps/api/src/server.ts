import { buildApi } from './app.js';
import { readApiConfig, validateApiConfigForRuntime } from './config.js';
import { checkPrismaReady, createPrismaClient } from './db/prisma.js';
import { createDeviceSignatureVerifier } from './auth/signatureVerifier.js';
import { RedisRateLimitStore } from './middleware/redisRateLimitStore.js';
import { BullMqJobQueue, NoopJobQueue } from './queue/jobQueue.js';
import { createRedisClient } from './redis/client.js';
import { PrismaAccountRepository } from './repositories/prismaAccountRepository.js';
import { PrismaDeviceRepository } from './repositories/prismaDeviceRepository.js';
import { PrismaMessageRepository } from './repositories/prismaMessageRepository.js';
import { PrismaMetadataRetentionRepository } from './repositories/prismaMetadataRetentionRepository.js';
import { PrismaSessionRepository } from './repositories/prismaSessionRepository.js';
import { createGracefulShutdown } from './startup/gracefulShutdown.js';
import { ensureStartupDependencies } from './startup/runtimeHealth.js';

const config = readApiConfig();
validateApiConfigForRuntime(config);
const prisma = config.databaseUrl ? createPrismaClient() : undefined;
const redis = config.redisUrl ? createRedisClient(config.redisUrl) : undefined;
const signatureVerifier = createDeviceSignatureVerifier();
const databaseHealthCheck = prisma ? () => checkPrismaReady(prisma) : undefined;
const queueHealthCheck = redis
  ? async () => {
      await redis.ping();
    }
  : undefined;

await ensureStartupDependencies({
  databaseCheck: databaseHealthCheck,
  queueCheck: queueHealthCheck,
});

const app = await buildApi(config, {
  repositories: prisma
    ? {
        accounts: new PrismaAccountRepository(prisma),
        devices: new PrismaDeviceRepository(prisma),
        messages: new PrismaMessageRepository(prisma),
        metadataRetention: new PrismaMetadataRetentionRepository(prisma),
        sessions: new PrismaSessionRepository(prisma, signatureVerifier),
      }
    : undefined,
  jobQueue: redis ? new BullMqJobQueue(redis) : new NoopJobQueue(),
  rateLimitStore: redis ? new RedisRateLimitStore(redis) : undefined,
  databaseHealthCheck,
  queueHealthCheck,
  close: async () => {
    await prisma?.$disconnect();
    await redis?.quit();
  },
});

const shutdown = createGracefulShutdown({
  label: 'CipherChat API',
  close: async () => {
    await app.close();
  },
  logger: app.log,
});

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

try {
  await app.listen({ host: config.host, port: config.port });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
