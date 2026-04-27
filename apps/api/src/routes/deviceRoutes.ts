import type { FastifyInstance } from 'fastify';

import type { DeviceRepository } from '../repositories/types.js';
import { acceptedResponseSchema, deviceBundleBodySchema, errorResponseSchema } from '../schemas.js';

type DeviceBundleBody = {
  accountDisplayName?: string;
  accountId: string;
  deviceId: string;
  deviceName: string;
  identityKey: string;
  signedPrekey: string;
  signedPrekeySignature: string;
  oneTimePrekeys?: string[];
};

export async function registerDeviceRoutes(app: FastifyInstance, repository?: DeviceRepository) {
  app.post<{ Body: DeviceBundleBody }>(
    '/v1/devices/bundles',
    {
      schema: {
        body: deviceBundleBodySchema,
        response: {
          202: {
            ...acceptedResponseSchema,
          },
          503: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      if (!repository) {
        return reply.code(503).send({
          error: 'database_unavailable',
          message: 'Device bundle persistence requires DATABASE_URL and a reachable database.',
        });
      }

      const published = await repository.publishDeviceBundle(request.body);

      return reply.code(202).send({
        accepted: true,
        accountId: published.accountId,
        deviceId: published.deviceId,
        bundleId: published.bundleId,
      });
    },
  );
}
