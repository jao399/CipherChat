import { buildApi } from './app.js';
import { readApiConfig } from './config.js';
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

const config = readApiConfig();
const prisma = config.databaseUrl ? createPrismaClient() : undefined;
const redis = config.redisUrl ? createRedisClient(config.redisUrl) : undefined;
const signatureVerifier = createDeviceSignatureVerifier();
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
  databaseHealthCheck: prisma ? () => checkPrismaReady(prisma) : undefined,
  queueHealthCheck: redis ? async () => { await redis.ping(); } : undefined,
  close: async () => {
    await prisma?.$disconnect();
    await redis?.quit();
  },
});

try {
  await app.listen({ host: config.host, port: config.port });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
