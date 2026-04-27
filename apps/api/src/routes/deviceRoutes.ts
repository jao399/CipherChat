import type { FastifyInstance } from 'fastify';

import { requireDeviceSession } from '../auth/deviceAuth.js';
import type { DeviceRepository, SessionRepository } from '../repositories/types.js';
import {
  acceptedResponseSchema,
  deviceBundleBodySchema,
  errorResponseSchema,
  publicDeviceBundleResponseSchema,
} from '../schemas.js';

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

export async function registerDeviceRoutes(
  app: FastifyInstance,
  repository?: DeviceRepository,
  sessions?: SessionRepository,
) {
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

  app.get<{ Params: { accountId: string; deviceId: string } }>(
    '/v1/devices/bundles/:accountId/:deviceId',
    {
      schema: {
        params: {
          type: 'object',
          required: ['accountId', 'deviceId'],
          additionalProperties: false,
          properties: {
            accountId: { type: 'string', minLength: 16 },
            deviceId: { type: 'string', minLength: 16 },
          },
        },
        response: {
          200: publicDeviceBundleResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
          503: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const session = await requireDeviceSession(request, reply, sessions);

      if (!session) {
        return reply;
      }

      if (!repository) {
        return reply.code(503).send({
          error: 'database_unavailable',
          message: 'Device bundle lookup requires DATABASE_URL and a reachable database.',
        });
      }

      const bundle = await repository.getDeviceBundle(request.params.accountId, request.params.deviceId);

      if (!bundle) {
        return reply.code(404).send({
          error: 'device_bundle_not_found',
          message: 'No active public device bundle was found for that account and device.',
        });
      }

      return reply.send(bundle);
    },
  );
}
