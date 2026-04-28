import type { PrismaClient } from '@prisma/client';

import type { AccountRepository, CreateAccountInput } from './types.js';

export class PrismaAccountRepository implements AccountRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createAccount(input: CreateAccountInput) {
    const account = await this.prisma.account.create({
      data: {
        id: input.id,
        displayName: input.displayName,
        username: input.username,
      },
    });

    await this.prisma.auditEvent.create({
      data: {
        accountId: account.id,
        eventType: 'account.created',
        targetId: account.id,
      },
    });

    return {
      accountId: account.id,
      displayName: account.displayName,
      username: account.username ?? undefined,
      createdAt: account.createdAt.toISOString(),
    };
  }

  async getAccount(accountId: string) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      return null;
    }

    return {
      accountId: account.id,
      displayName: account.displayName,
      username: account.username ?? undefined,
      createdAt: account.createdAt.toISOString(),
    };
  }

  async searchAccounts(query: string, limit: number) {
    const normalizedQuery = query.trim();

    if (normalizedQuery.length < 2) {
      return [];
    }

    const accounts = await this.prisma.account.findMany({
      where: {
        OR: [
          { id: { contains: normalizedQuery, mode: 'insensitive' } },
          { displayName: { contains: normalizedQuery, mode: 'insensitive' } },
          { username: { contains: normalizedQuery, mode: 'insensitive' } },
        ],
      },
      orderBy: [{ username: 'asc' }, { displayName: 'asc' }],
      take: limit,
      include: {
        devices: {
          where: {
            revokedAt: null,
            prekeyBundle: {
              isNot: null,
            },
          },
          orderBy: { updatedAt: 'desc' },
          include: {
            prekeyBundle: true,
          },
        },
      },
    });

    return accounts.map((account) => ({
      accountId: account.id,
      displayName: account.displayName,
      username: account.username ?? undefined,
      devices: account.devices
        .filter((device) => device.prekeyBundle)
        .map((device) => ({
          deviceId: device.id,
          deviceName: device.displayName,
          identityKey: device.identityKey,
          signedPrekey: device.prekeyBundle?.signedPrekey ?? '',
          signedPrekeySignature: device.prekeyBundle?.signedPrekeySignature ?? '',
          oneTimePrekeys: Array.isArray(device.prekeyBundle?.oneTimePrekeys)
            ? device.prekeyBundle.oneTimePrekeys.filter((item): item is string => typeof item === 'string')
            : [],
          publishedAt: device.prekeyBundle?.publishedAt.toISOString() ?? device.updatedAt.toISOString(),
        })),
    }));
  }
}
