import type { FastifyInstance } from 'fastify';

import { requireDeviceSession } from '../auth/deviceAuth.js';
import type { AccountRepository, SessionRepository } from '../repositories/types.js';
import { accountCreateBodySchema, accountResponseSchema, errorResponseSchema } from '../schemas.js';

type AccountCreateBody = {
  id?: string;
  displayName: string;
  username?: string;
};

export async function registerAccountRoutes(
  app: FastifyInstance,
  accounts?: AccountRepository,
  sessions?: SessionRepository,
) {
  app.post<{ Body: AccountCreateBody }>(
    '/v1/accounts',
    {
      schema: {
        body: accountCreateBodySchema,
        response: {
          201: accountResponseSchema,
          503: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      if (!accounts) {
        return reply.code(503).send({
          error: 'database_unavailable',
          message: 'Account creation requires DATABASE_URL and a reachable database.',
        });
      }

      const account = await accounts.createAccount(request.body);
      return reply.code(201).send(account);
    },
  );

  app.get(
    '/v1/accounts/me',
    {
      schema: {
        response: {
          200: accountResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
          503: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      if (!accounts) {
        return reply.code(503).send({
          error: 'database_unavailable',
          message: 'Account lookup requires DATABASE_URL and a reachable database.',
        });
      }

      const session = await requireDeviceSession(request, reply, sessions);

      if (!session) {
        return reply;
      }

      const account = await accounts.getAccount(session.accountId);

      if (!account) {
        return reply.code(404).send({
          error: 'account_not_found',
          message: 'The authenticated account was not found.',
        });
      }

      return reply.send(account);
    },
  );
}
