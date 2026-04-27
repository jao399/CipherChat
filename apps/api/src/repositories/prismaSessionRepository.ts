import type { PrismaClient } from '@prisma/client';

import { randomBytes } from 'node:crypto';

import {
  type DeviceSignatureVerifier,
  RejectingDeviceSignatureVerifier,
} from '../auth/signatureVerifier.js';
import { createSessionToken, hashSessionToken } from '../auth/tokens.js';
import type { CreateDeviceChallengeInput, CreateDeviceSessionInput, SessionRepository } from './types.js';

const sessionTtlMs = 1000 * 60 * 60 * 24 * 30;
const challengeTtlMs = 1000 * 60 * 5;

export class PrismaSessionRepository implements SessionRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly signatureVerifier: DeviceSignatureVerifier = new RejectingDeviceSignatureVerifier(),
  ) {}

  async createDeviceChallenge(input: CreateDeviceChallengeInput) {
    const device = await this.prisma.device.findFirst({
      where: {
        id: input.deviceId,
        accountId: input.accountId,
        revokedAt: null,
      },
      select: {
        id: true,
        accountId: true,
      },
    });

    if (!device) {
      return null;
    }

    const challenge = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + challengeTtlMs);
    const stored = await this.prisma.deviceSessionChallenge.create({
      data: {
        accountId: input.accountId,
        deviceId: input.deviceId,
        challenge,
        expiresAt,
      },
    });

    await this.prisma.auditEvent.create({
      data: {
        accountId: input.accountId,
        eventType: 'device_session.challenge_created',
        actorId: input.deviceId,
        targetId: stored.id,
      },
    });

    return {
      challengeId: stored.id,
      accountId: stored.accountId,
      deviceId: stored.deviceId,
      challenge: stored.challenge,
      expiresAt: stored.expiresAt.toISOString(),
    };
  }

  async createDeviceSession(input: CreateDeviceSessionInput) {
    const challenge = await this.prisma.deviceSessionChallenge.findFirst({
      where: {
        id: input.challengeId,
        accountId: input.accountId,
        deviceId: input.deviceId,
        consumedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        device: true,
      },
    });

    if (!challenge || challenge.device.revokedAt) {
      return null;
    }

    const verified = await this.signatureVerifier.verifyDeviceChallenge({
      accountId: input.accountId,
      deviceId: input.deviceId,
      identityKey: challenge.device.identityKey,
      challenge: challenge.challenge,
      signature: input.signature,
    });

    if (!verified) {
      return null;
    }

    const token = createSessionToken();
    const expiresAt = new Date(Date.now() + sessionTtlMs);
    const session = await this.prisma.$transaction(async (tx) => {
      await tx.deviceSessionChallenge.update({
        where: { id: challenge.id },
        data: { consumedAt: new Date() },
      });

      const created = await tx.deviceSession.create({
        data: {
          accountId: input.accountId,
          deviceId: input.deviceId,
          tokenHash: hashSessionToken(token),
          expiresAt,
        },
      });

      await tx.auditEvent.create({
        data: {
          accountId: input.accountId,
          eventType: 'device_session.created',
          actorId: input.deviceId,
          targetId: created.id,
        },
      });

      return created;
    });

    return {
      sessionId: session.id,
      accountId: session.accountId,
      deviceId: session.deviceId,
      token,
      expiresAt: expiresAt.toISOString(),
    };
  }

  async verifyDeviceSession(token: string) {
    const session = await this.prisma.deviceSession.findFirst({
      where: {
        tokenHash: hashSessionToken(token),
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        accountId: true,
        deviceId: true,
      },
    });

    if (!session) {
      return null;
    }

    await this.prisma.deviceSession.update({
      where: { id: session.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      sessionId: session.id,
      accountId: session.accountId,
      deviceId: session.deviceId,
    };
  }

  async revokeDeviceSession(sessionId: string) {
    const session = await this.prisma.deviceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.revokedAt) {
      return null;
    }

    await this.prisma.deviceSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });

    await this.prisma.auditEvent.create({
      data: {
        accountId: session.accountId,
        eventType: 'device_session.revoked',
        actorId: session.deviceId,
        targetId: session.id,
      },
    });

    return {
      sessionId,
      revoked: true,
    };
  }
}
