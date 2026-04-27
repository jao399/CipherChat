import type { PrismaClient } from '@prisma/client';

import type { DeviceRepository, PublishDeviceBundleInput } from './types.js';

export class PrismaDeviceRepository implements DeviceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async publishDeviceBundle(input: PublishDeviceBundleInput) {
    const accountDisplayName = input.accountDisplayName ?? 'CipherChat User';

    return this.prisma.$transaction(async (tx) => {
      await tx.account.upsert({
        where: { id: input.accountId },
        create: {
          id: input.accountId,
          displayName: accountDisplayName,
        },
        update: {
          displayName: accountDisplayName,
        },
      });

      await tx.device.upsert({
        where: { id: input.deviceId },
        create: {
          id: input.deviceId,
          accountId: input.accountId,
          displayName: input.deviceName,
          identityKey: input.identityKey,
          lastSeenAt: new Date(),
        },
        update: {
          displayName: input.deviceName,
          identityKey: input.identityKey,
          lastSeenAt: new Date(),
          revokedAt: null,
        },
      });

      const bundle = await tx.prekeyBundle.upsert({
        where: { deviceId: input.deviceId },
        create: {
          deviceId: input.deviceId,
          signedPrekey: input.signedPrekey,
          signedPrekeySignature: input.signedPrekeySignature,
          oneTimePrekeys: input.oneTimePrekeys ?? [],
        },
        update: {
          signedPrekey: input.signedPrekey,
          signedPrekeySignature: input.signedPrekeySignature,
          oneTimePrekeys: input.oneTimePrekeys ?? [],
          publishedAt: new Date(),
        },
      });

      return {
        accountId: input.accountId,
        deviceId: input.deviceId,
        bundleId: bundle.id,
      };
    });
  }
}
