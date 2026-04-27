import { PrismaClient } from '@prisma/client';

export function createPrismaClient() {
  return new PrismaClient({
    log: ['warn', 'error'],
  });
}

export async function checkPrismaReady(prisma: PrismaClient) {
  await prisma.$queryRaw`SELECT 1`;
}
