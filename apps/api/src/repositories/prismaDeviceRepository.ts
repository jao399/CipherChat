import type { PrismaClient } from '@prisma/client';

import { prekeyInventoryPolicy } from '../security/prekeyPolicy.js';
import type { DeviceRepository, PublishDeviceBundleInput } from './types.js';

function readOneTimePrekeys(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export class PrismaDeviceRepository implements DeviceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getDeviceBundlePublicationStatus(input: { accountId: string; deviceId: string }) {
    const [account, device] = await Promise.all([
      this.prisma.account.findUnique({
        where: { id: input.accountId },
        select: {
          id: true,
          _count: {
            select: { devices: true },
          },
        },
      }),
      this.prisma.device.findUnique({
        where: { id: input.deviceId },
        select: {
          id: true,
          accountId: true,
        },
      }),
    ]);

    return {
      accountExists: Boolean(account),
      accountDeviceCount: account?._count.devices ?? 0,
      deviceExists: Boolean(device),
      deviceAccountId: device?.accountId,
    };
  }

  async publishDeviceBundle(input: PublishDeviceBundleInput) {
    const accountDisplayName = input.accountDisplayName ?? 'CipherChat User';

    return this.prisma.$transaction(async (tx) => {
      const [existingAccount, existingDevice] = await Promise.all([
        tx.account.findUnique({
          where: { id: input.accountId },
          select: {
            _count: {
              select: { devices: true },
            },
          },
        }),
        tx.device.findUnique({
          where: { id: input.deviceId },
          select: {
            accountId: true,
            identityKey: true,
          },
        }),
      ]);
      const identityChanged = Boolean(existingDevice && existingDevice.identityKey !== input.identityKey);

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

      await tx.auditEvent.create({
        data: {
          accountId: input.accountId,
          eventType: selectDeviceBundleAuditEvent(existingAccount?._count.devices ?? 0, Boolean(existingDevice), identityChanged),
          actorId: input.deviceId,
          targetId: input.deviceId,
          metadata: {
            deviceKnown: Boolean(existingDevice),
            identityChanged,
            oneTimePrekeyCount: input.oneTimePrekeys?.length ?? 0,
          },
        },
      });

      return {
        accountId: input.accountId,
        deviceId: input.deviceId,
        bundleId: bundle.id,
      };
    });
  }

  async getDeviceBundle(accountId: string, deviceId: string) {
    const device = await this.prisma.device.findFirst({
      where: {
        id: deviceId,
        accountId,
        revokedAt: null,
      },
      include: {
        account: true,
        prekeyBundle: true,
      },
    });

    if (!device?.prekeyBundle) {
      return null;
    }

    return {
      accountId: device.accountId,
      accountDisplayName: device.account.displayName,
      deviceId: device.id,
      deviceName: device.displayName,
      identityKey: device.identityKey,
      signedPrekey: device.prekeyBundle.signedPrekey,
      signedPrekeySignature: device.prekeyBundle.signedPrekeySignature,
      oneTimePrekeys: readOneTimePrekeys(device.prekeyBundle.oneTimePrekeys),
      publishedAt: device.prekeyBundle.publishedAt.toISOString(),
    };
  }

  async claimDevicePrekeyBundle(accountId: string, deviceId: string) {
    return this.prisma.$transaction(async (tx) => {
      const device = await tx.device.findFirst({
        where: {
          id: deviceId,
          accountId,
          revokedAt: null,
        },
        include: {
          account: true,
          prekeyBundle: true,
        },
      });

      if (!device?.prekeyBundle) {
        return null;
      }

      const oneTimePrekeys = readOneTimePrekeys(device.prekeyBundle.oneTimePrekeys);
      const claimedOneTimePrekey = oneTimePrekeys[0];

      if (claimedOneTimePrekey) {
        await tx.prekeyBundle.update({
          where: { deviceId },
          data: {
            oneTimePrekeys: oneTimePrekeys.slice(1),
          },
        });

        await tx.auditEvent.create({
          data: {
            accountId,
            eventType: 'device_bundle.one_time_prekey_claimed',
            targetId: deviceId,
            metadata: {
              remainingOneTimePrekeyCount: oneTimePrekeys.length - 1,
            },
          },
        });
      }

      return {
        accountId: device.accountId,
        accountDisplayName: device.account.displayName,
        deviceId: device.id,
        deviceName: device.displayName,
        identityKey: device.identityKey,
        signedPrekey: device.prekeyBundle.signedPrekey,
        signedPrekeySignature: device.prekeyBundle.signedPrekeySignature,
        oneTimePrekeys: claimedOneTimePrekey ? [claimedOneTimePrekey] : [],
        publishedAt: device.prekeyBundle.publishedAt.toISOString(),
      };
    });
  }

  async getDevicePrekeyStatus(input: { accountId: string; deviceId: string }) {
    const device = await this.prisma.device.findFirst({
      where: {
        id: input.deviceId,
        accountId: input.accountId,
        revokedAt: null,
      },
      include: {
        prekeyBundle: true,
      },
    });

    if (!device?.prekeyBundle) {
      return null;
    }

    const oneTimePrekeyCount = readOneTimePrekeys(device.prekeyBundle.oneTimePrekeys).length;

    return {
      accountId: device.accountId,
      deviceId: device.id,
      oneTimePrekeyCount,
      lowWatermark: prekeyInventoryPolicy.lowWatermark,
      recommendedCount: prekeyInventoryPolicy.recommendedCount,
      needsTopUp: oneTimePrekeyCount < prekeyInventoryPolicy.lowWatermark,
    };
  }

  async revokeDevice(input: { accountId: string; deviceId: string; actorDeviceId: string }) {
    const revokedAt = new Date();

    return this.prisma.$transaction(async (tx) => {
      const device = await tx.device.findFirst({
        where: {
          id: input.deviceId,
          accountId: input.accountId,
        },
        select: {
          id: true,
          accountId: true,
          revokedAt: true,
        },
      });

      if (!device) {
        return null;
      }

      if (!device.revokedAt) {
        await tx.device.update({
          where: { id: input.deviceId },
          data: { revokedAt },
        });

        await tx.deviceSession.updateMany({
          where: {
            accountId: input.accountId,
            deviceId: input.deviceId,
            revokedAt: null,
          },
          data: { revokedAt },
        });

        await tx.auditEvent.create({
          data: {
            accountId: input.accountId,
            eventType: 'device.revoked',
            actorId: input.actorDeviceId,
            targetId: input.deviceId,
            metadata: {
              sessionsRevoked: true,
            },
          },
        });
      }

      return {
        accountId: device.accountId,
        deviceId: device.id,
        revoked: true,
        revokedAt: (device.revokedAt ?? revokedAt).toISOString(),
      };
    });
  }

  async listAccountDevices(input: { accountId: string; currentDeviceId: string }) {
    const devices = await this.prisma.device.findMany({
      where: {
        accountId: input.accountId,
      },
      orderBy: [{ revokedAt: 'asc' }, { updatedAt: 'desc' }],
      select: {
        id: true,
        accountId: true,
        displayName: true,
        trustState: true,
        lastSeenAt: true,
        revokedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return devices.map((device) => ({
      accountId: device.accountId,
      deviceId: device.id,
      deviceName: device.displayName,
      trustState: device.trustState,
      lastSeenAt: device.lastSeenAt?.toISOString(),
      revokedAt: device.revokedAt?.toISOString(),
      createdAt: device.createdAt.toISOString(),
      updatedAt: device.updatedAt.toISOString(),
      isCurrentDevice: device.id === input.currentDeviceId,
    }));
  }
}

function selectDeviceBundleAuditEvent(accountDeviceCount: number, deviceKnown: boolean, identityChanged: boolean) {
  if (!deviceKnown) {
    return accountDeviceCount > 0 ? 'device_bundle.device_added' : 'device_bundle.first_device_published';
  }

  return identityChanged ? 'device_bundle.identity_changed' : 'device_bundle.updated';
}
