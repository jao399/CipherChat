import type { FastifyInstance } from 'fastify';

import { requireDeviceSession } from '../auth/deviceAuth.js';
import type { DeviceRepository, SessionRepository } from '../repositories/types.js';
import {
  acceptedResponseSchema,
  accountDeviceListResponseSchema,
  deviceBundleBodySchema,
  devicePrekeyStatusResponseSchema,
  devicePrekeyTopUpBodySchema,
  deviceRevokedResponseSchema,
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

type DevicePrekeyTopUpBody = {
  oneTimePrekeys: string[];
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
          401: errorResponseSchema,
          403: errorResponseSchema,
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

      const publicationStatus = await repository.getDeviceBundlePublicationStatus({
        accountId: request.body.accountId,
        deviceId: request.body.deviceId,
      });

      if (publicationStatus.deviceAccountId && publicationStatus.deviceAccountId !== request.body.accountId) {
        return reply.code(403).send({
          error: 'device_account_mismatch',
          message: 'That device identity is already associated with another account.',
        });
      }

      if (publicationStatus.accountDeviceCount > 0) {
        const session = await requireDeviceSession(request, reply, sessions);

        if (!session) {
          return reply;
        }

        if (session.accountId !== request.body.accountId) {
          return reply.code(403).send({
            error: 'account_device_publish_forbidden',
            message: 'Only an authenticated device for this account can add device bundle material.',
          });
        }

        if (publicationStatus.deviceExists && session.deviceId !== request.body.deviceId) {
          return reply.code(403).send({
            error: 'device_bundle_update_forbidden',
            message: 'Only the authenticated device can update its own device bundle material.',
          });
        }
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

  app.post<{ Params: { accountId: string; deviceId: string } }>(
    '/v1/devices/bundles/:accountId/:deviceId/claim',
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
          message: 'Device prekey bundle claims require DATABASE_URL and a reachable database.',
        });
      }

      const bundle = await repository.claimDevicePrekeyBundle(request.params.accountId, request.params.deviceId);

      if (!bundle) {
        return reply.code(404).send({
          error: 'device_bundle_not_found',
          message: 'No active public device bundle was found for that account and device.',
        });
      }

      return reply.send(bundle);
    },
  );

  app.delete<{ Params: { accountId: string; deviceId: string } }>(
    '/v1/devices/:accountId/:deviceId',
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
          200: deviceRevokedResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
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
          message: 'Device revocation requires DATABASE_URL and a reachable database.',
        });
      }

      if (session.accountId !== request.params.accountId) {
        return reply.code(403).send({
          error: 'device_revoke_forbidden',
          message: 'Only an authenticated device for this account can revoke account devices.',
        });
      }

      const revoked = await repository.revokeDevice({
        accountId: request.params.accountId,
        deviceId: request.params.deviceId,
        actorDeviceId: session.deviceId,
      });

      if (!revoked) {
        return reply.code(404).send({
          error: 'device_not_found',
          message: 'No device was found for that account.',
        });
      }

      return reply.send(revoked);
    },
  );

  app.get(
    '/v1/devices/prekeys/status',
    {
      schema: {
        response: {
          200: devicePrekeyStatusResponseSchema,
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
          message: 'Device prekey inventory requires DATABASE_URL and a reachable database.',
        });
      }

      const status = await repository.getDevicePrekeyStatus({
        accountId: session.accountId,
        deviceId: session.deviceId,
      });

      if (!status) {
        return reply.code(404).send({
          error: 'device_prekey_status_not_found',
          message: 'No active prekey bundle was found for the authenticated device.',
        });
      }

      return reply.send(status);
    },
  );

  app.post<{ Body: DevicePrekeyTopUpBody }>(
    '/v1/devices/prekeys/top-up',
    {
      schema: {
        body: devicePrekeyTopUpBodySchema,
        response: {
          200: devicePrekeyStatusResponseSchema,
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
          message: 'Device prekey top-up requires DATABASE_URL and a reachable database.',
        });
      }

      const status = await repository.topUpDevicePrekeys({
        accountId: session.accountId,
        deviceId: session.deviceId,
        oneTimePrekeys: request.body.oneTimePrekeys,
      });

      if (!status) {
        return reply.code(404).send({
          error: 'device_prekey_bundle_not_found',
          message: 'No active prekey bundle was found for the authenticated device.',
        });
      }

      return reply.send(status);
    },
  );

  app.get(
    '/v1/devices',
    {
      schema: {
        response: {
          200: accountDeviceListResponseSchema,
          401: errorResponseSchema,
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
          message: 'Device listing requires DATABASE_URL and a reachable database.',
        });
      }

      const devices = await repository.listAccountDevices({
        accountId: session.accountId,
        currentDeviceId: session.deviceId,
      });

      return reply.send({ devices });
    },
  );
}
