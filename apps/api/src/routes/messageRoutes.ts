import type { FastifyInstance } from 'fastify';

import { requireDeviceSession } from '../auth/deviceAuth.js';
import type { JobQueuePort } from '../queue/jobQueue.js';
import type { MessageRepository, SessionRepository } from '../repositories/types.js';
import {
  acceptedResponseSchema,
  encryptedEnvelopeBodySchema,
  encryptedEnvelopeFanoutBodySchema,
  envelopeAckResponseSchema,
  envelopeListResponseSchema,
  errorResponseSchema,
  fanoutAcceptedResponseSchema,
} from '../schemas.js';

type EncryptedEnvelopeBody = {
  messageId: string;
  conversationId: string;
  senderAccountId: string;
  senderDeviceId: string;
  recipientAccountId: string;
  recipientDeviceId: string;
  ciphertext: string;
  header: string;
};

type EncryptedEnvelopeFanoutBody = {
  conversationId: string;
  senderAccountId: string;
  senderDeviceId: string;
  envelopes: Array<{
    messageId: string;
    recipientAccountId: string;
    recipientDeviceId: string;
    ciphertext: string;
    header: string;
  }>;
};

function readLimit(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? '50', 10);

  if (!Number.isFinite(parsed)) {
    return 50;
  }

  return Math.min(Math.max(parsed, 1), 100);
}

export async function registerMessageRoutes(
  app: FastifyInstance,
  repository?: MessageRepository,
  sessions?: SessionRepository,
  jobQueue?: JobQueuePort,
) {
  app.post<{ Body: EncryptedEnvelopeBody }>(
    '/v1/messages/envelopes',
    {
      schema: {
        body: encryptedEnvelopeBodySchema,
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
          message: 'Encrypted envelope persistence requires DATABASE_URL and a reachable database.',
        });
      }

      const session = await requireDeviceSession(request, reply, sessions);

      if (!session) {
        return reply;
      }

      if (session.accountId !== request.body.senderAccountId || session.deviceId !== request.body.senderDeviceId) {
        return reply.code(403).send({
          error: 'sender_device_mismatch',
          message: 'Encrypted envelopes can only be sent by the authenticated device.',
        });
      }

      const stored = await repository.storeEncryptedEnvelope({
        messageId: request.body.messageId,
        conversationId: request.body.conversationId,
        senderAccountId: request.body.senderAccountId,
        senderDeviceId: request.body.senderDeviceId,
        recipientAccountId: request.body.recipientAccountId,
        recipientDeviceId: request.body.recipientDeviceId,
        headerCiphertext: request.body.header,
        bodyCiphertext: request.body.ciphertext,
      });
      await jobQueue?.enqueueDeliveryFanout({
        messageIds: [stored.messageId],
        recipientDeviceCount: 1,
      });

      return reply.code(202).send({
        accepted: true,
        envelopeId: stored.envelopeId,
        messageId: stored.messageId,
        deliveryState: stored.deliveryState,
      });
    },
  );

  app.post<{ Body: EncryptedEnvelopeFanoutBody }>(
    '/v1/messages/envelopes/fanout',
    {
      schema: {
        body: encryptedEnvelopeFanoutBodySchema,
        response: {
          202: fanoutAcceptedResponseSchema,
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
          message: 'Encrypted envelope fanout requires DATABASE_URL and a reachable database.',
        });
      }

      const session = await requireDeviceSession(request, reply, sessions);

      if (!session) {
        return reply;
      }

      if (session.accountId !== request.body.senderAccountId || session.deviceId !== request.body.senderDeviceId) {
        return reply.code(403).send({
          error: 'sender_device_mismatch',
          message: 'Encrypted fanout can only be sent by the authenticated device.',
        });
      }

      const fanout = await repository.storeEncryptedEnvelopeFanout({
        conversationId: request.body.conversationId,
        senderAccountId: request.body.senderAccountId,
        senderDeviceId: request.body.senderDeviceId,
        envelopes: request.body.envelopes.map((envelope) => ({
          messageId: envelope.messageId,
          recipientAccountId: envelope.recipientAccountId,
          recipientDeviceId: envelope.recipientDeviceId,
          headerCiphertext: envelope.header,
          bodyCiphertext: envelope.ciphertext,
        })),
      });
      await jobQueue?.enqueueDeliveryFanout({
        messageIds: fanout.messageIds,
        recipientDeviceCount: fanout.envelopeCount,
      });

      return reply.code(202).send(fanout);
    },
  );

  app.get<{ Querystring: { limit?: string; cursor?: string } }>(
    '/v1/messages/envelopes',
    {
      schema: {
        response: {
          200: envelopeListResponseSchema,
          401: errorResponseSchema,
          503: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      if (!repository) {
        return reply.code(503).send({
          error: 'database_unavailable',
          message: 'Encrypted envelope delivery requires DATABASE_URL and a reachable database.',
        });
      }

      const session = await requireDeviceSession(request, reply, sessions);

      if (!session) {
        return reply;
      }

      const page = await repository.listQueuedEnvelopes({
        recipientAccountId: session.accountId,
        recipientDeviceId: session.deviceId,
        limit: readLimit(request.query.limit),
        cursor: request.query.cursor,
      });

      return reply.send(page);
    },
  );

  app.post<{ Params: { messageId: string } }>(
    '/v1/messages/envelopes/:messageId/ack',
    {
      schema: {
        response: {
          200: envelopeAckResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
          503: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      if (!repository) {
        return reply.code(503).send({
          error: 'database_unavailable',
          message: 'Encrypted envelope acknowledgement requires DATABASE_URL and a reachable database.',
        });
      }

      const session = await requireDeviceSession(request, reply, sessions);

      if (!session) {
        return reply;
      }

      const acknowledged = await repository.acknowledgeEnvelope({
        messageId: request.params.messageId,
        recipientAccountId: session.accountId,
        recipientDeviceId: session.deviceId,
      });

      if (!acknowledged) {
        return reply.code(404).send({
          error: 'envelope_not_found',
          message: 'No deliverable envelope was found for this authenticated device.',
        });
      }

      return reply.send(acknowledged);
    },
  );
}
