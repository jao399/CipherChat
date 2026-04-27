import type { FastifyReply, FastifyRequest } from 'fastify';

import type { SessionRepository, VerifiedDeviceSession } from '../repositories/types.js';

declare module 'fastify' {
  interface FastifyRequest {
    auth?: VerifiedDeviceSession;
  }
}

function readBearerToken(request: FastifyRequest) {
  const header = request.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return undefined;
  }

  return header.slice('Bearer '.length).trim();
}

export async function requireDeviceSession(
  request: FastifyRequest,
  reply: FastifyReply,
  repository?: SessionRepository,
) {
  if (!repository) {
    void reply.code(503).send({
      error: 'auth_unavailable',
      message: 'Device session authentication requires DATABASE_URL and a reachable database.',
    });
    return undefined;
  }

  const token = readBearerToken(request);

  if (!token) {
    void reply.code(401).send({
      error: 'missing_session',
      message: 'A device session bearer token is required.',
    });
    return undefined;
  }

  const session = await repository.verifyDeviceSession(token);

  if (!session) {
    void reply.code(401).send({
      error: 'invalid_session',
      message: 'The device session is invalid, expired, or revoked.',
    });
    return undefined;
  }

  request.auth = session;
  return session;
}
