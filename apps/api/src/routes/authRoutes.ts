import type { FastifyInstance } from 'fastify';

import { requireDeviceSession } from '../auth/deviceAuth.js';
import type { SessionRepository } from '../repositories/types.js';
import {
  deviceChallengeBodySchema,
  deviceChallengeResponseSchema,
  deviceSessionBodySchema,
  deviceSessionResponseSchema,
  deviceSessionRevokedResponseSchema,
  errorResponseSchema,
} from '../schemas.js';

type DeviceSessionBody = {
  accountId: string;
  deviceId: string;
  challengeId: string;
  signature: string;
};

export async function registerAuthRoutes(app: FastifyInstance, repository?: SessionRepository) {
  app.post<{ Body: Pick<DeviceSessionBody, 'accountId' | 'deviceId'> }>(
    '/v1/auth/device-challenges',
    {
      schema: {
        body: deviceChallengeBodySchema,
        response: {
          201: deviceChallengeResponseSchema,
          403: errorResponseSchema,
          503: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      if (!repository) {
        return reply.code(503).send({
          error: 'database_unavailable',
          message: 'Device challenge creation requires DATABASE_URL and a reachable database.',
        });
      }

      const challenge = await repository.createDeviceChallenge(request.body);

      if (!challenge) {
        return reply.code(403).send({
          error: 'device_not_trusted',
          message: 'The requested device does not belong to the account or has been revoked.',
        });
      }

      return reply.code(201).send(challenge);
    },
  );

  app.post<{ Body: DeviceSessionBody }>(
    '/v1/auth/device-sessions',
    {
      schema: {
        body: deviceSessionBodySchema,
        response: {
          201: deviceSessionResponseSchema,
          403: errorResponseSchema,
          503: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      if (!repository) {
        return reply.code(503).send({
          error: 'database_unavailable',
          message: 'Device session creation requires DATABASE_URL and a reachable database.',
        });
      }

      const session = await repository.createDeviceSession(request.body);

      if (!session) {
        return reply.code(403).send({
          error: 'device_not_trusted',
          message: 'The requested device does not belong to the account or has been revoked.',
        });
      }

      return reply.code(201).send(session);
    },
  );

  app.delete(
    '/v1/auth/device-sessions/current',
    {
      schema: {
        response: {
          200: deviceSessionRevokedResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
          503: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const session = await requireDeviceSession(request, reply, repository);

      if (!session) {
        return reply;
      }

      const revoked = await repository?.revokeDeviceSession(session.sessionId);

      if (!revoked) {
        return reply.code(404).send({
          error: 'session_not_found',
          message: 'The current session could not be revoked.',
        });
      }

      return reply.send(revoked);
    },
  );
}
