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
}
