import type { PrismaClient } from '@prisma/client';

import type {
  AcknowledgeEncryptedEnvelopeInput,
  ListEncryptedEnvelopesInput,
  MessageRepository,
  StoreEncryptedEnvelopeInput,
  StoreEncryptedEnvelopeFanoutInput,
} from './types.js';

function encodeCursor(envelope: { id: string; queuedAt: Date }) {
  return Buffer.from(JSON.stringify({ envelopeId: envelope.id, queuedAt: envelope.queuedAt.toISOString() }), 'utf8').toString(
    'base64url',
  );
}

function decodeCursor(cursor: string | undefined) {
  if (!cursor) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as {
      envelopeId?: string;
      queuedAt?: string;
    };
    return parsed.envelopeId && parsed.queuedAt ? { id: parsed.envelopeId, queuedAt: new Date(parsed.queuedAt) } : undefined;
  } catch {
    return undefined;
  }
}

export class PrismaMessageRepository implements MessageRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async storeEncryptedEnvelope(input: StoreEncryptedEnvelopeInput) {
    const envelope = await this.prisma.encryptedMessageEnvelope.upsert({
      where: { messageId: input.messageId },
      create: {
        messageId: input.messageId,
        conversationId: input.conversationId,
        senderAccountId: input.senderAccountId,
        senderDeviceId: input.senderDeviceId,
        recipientAccountId: input.recipientAccountId,
        recipientDeviceId: input.recipientDeviceId,
        headerCiphertext: input.headerCiphertext,
        bodyCiphertext: input.bodyCiphertext,
      },
      update: {},
    });

    await this.prisma.auditEvent.create({
      data: {
        accountId: input.senderAccountId,
        eventType: 'encrypted_envelope.queued',
        actorId: input.senderDeviceId,
        targetId: envelope.messageId,
        metadata: {
          recipientAccountId: input.recipientAccountId,
          recipientDeviceId: input.recipientDeviceId,
        },
      },
    });

    return {
      envelopeId: envelope.id,
      messageId: envelope.messageId,
      deliveryState: envelope.deliveryState,
    };
  }

  async storeEncryptedEnvelopeFanout(input: StoreEncryptedEnvelopeFanoutInput) {
    const envelopes = await this.prisma.$transaction(async (tx) => {
      const stored = [];

      for (const envelope of input.envelopes) {
        const created = await tx.encryptedMessageEnvelope.upsert({
          where: { messageId: envelope.messageId },
          create: {
            messageId: envelope.messageId,
            conversationId: input.conversationId,
            senderAccountId: input.senderAccountId,
            senderDeviceId: input.senderDeviceId,
            recipientAccountId: envelope.recipientAccountId,
            recipientDeviceId: envelope.recipientDeviceId,
            headerCiphertext: envelope.headerCiphertext,
            bodyCiphertext: envelope.bodyCiphertext,
          },
          update: {},
        });
        stored.push(created);
      }

      await tx.auditEvent.create({
        data: {
          accountId: input.senderAccountId,
          eventType: 'encrypted_envelopes.fanout_queued',
          actorId: input.senderDeviceId,
          metadata: {
            conversationId: input.conversationId,
            recipientDeviceCount: stored.length,
          },
        },
      });

      return stored;
    });

    return {
      accepted: true,
      envelopeCount: envelopes.length,
      messageIds: envelopes.map((envelope) => envelope.messageId),
    };
  }

  async listQueuedEnvelopes(input: ListEncryptedEnvelopesInput) {
    const cursor = decodeCursor(input.cursor);
    const envelopes = await this.prisma.encryptedMessageEnvelope.findMany({
      where: {
        recipientAccountId: input.recipientAccountId,
        recipientDeviceId: input.recipientDeviceId,
        deliveryState: 'QUEUED',
        AND: [
          { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
          ...(cursor
            ? [
                {
                  OR: [
                    { queuedAt: { gt: cursor.queuedAt } },
                    {
                      queuedAt: cursor.queuedAt,
                      id: { gt: cursor.id },
                    },
                  ],
                },
              ]
            : []),
        ],
      },
      orderBy: [{ queuedAt: 'asc' }, { id: 'asc' }],
      take: input.limit + 1,
    });
    const page = envelopes.slice(0, input.limit);
    const nextEnvelope = envelopes[input.limit];

    if (page.length > 0) {
      await this.prisma.encryptedMessageEnvelope.updateMany({
        where: {
          id: {
            in: page.map((envelope) => envelope.id),
          },
        },
        data: {
          deliveryState: 'DELIVERED',
          deliveredAt: new Date(),
        },
      });

      await this.prisma.auditEvent.create({
        data: {
          accountId: input.recipientAccountId,
          eventType: 'encrypted_envelopes.delivered',
          actorId: input.recipientDeviceId,
          metadata: {
            count: page.length,
          },
        },
      });
    }

    return {
      envelopes: page.map((envelope) => ({
        envelopeId: envelope.id,
        messageId: envelope.messageId,
        conversationId: envelope.conversationId,
        senderAccountId: envelope.senderAccountId,
        senderDeviceId: envelope.senderDeviceId,
        recipientAccountId: envelope.recipientAccountId,
        recipientDeviceId: envelope.recipientDeviceId,
        headerCiphertext: envelope.headerCiphertext,
        bodyCiphertext: envelope.bodyCiphertext,
        deliveryState: 'DELIVERED',
        queuedAt: envelope.queuedAt.toISOString(),
      })),
      nextCursor: nextEnvelope && page.length > 0 ? encodeCursor(page[page.length - 1]!) : undefined,
    };
  }

  async acknowledgeEnvelope(input: AcknowledgeEncryptedEnvelopeInput) {
    const acknowledgedAt = new Date();
    const result = await this.prisma.encryptedMessageEnvelope.updateMany({
      where: {
        messageId: input.messageId,
        recipientAccountId: input.recipientAccountId,
        recipientDeviceId: input.recipientDeviceId,
        deliveryState: {
          in: ['QUEUED', 'DELIVERED'],
        },
      },
      data: {
        deliveryState: 'ACKNOWLEDGED',
        acknowledgedAt,
      },
    });

    if (result.count === 0) {
      return null;
    }

    await this.prisma.auditEvent.create({
      data: {
        accountId: input.recipientAccountId,
        eventType: 'encrypted_envelope.acknowledged',
        actorId: input.recipientDeviceId,
        targetId: input.messageId,
      },
    });

    return {
      messageId: input.messageId,
      deliveryState: 'ACKNOWLEDGED',
      acknowledgedAt: acknowledgedAt.toISOString(),
    };
  }

  async expireStaleEnvelopes(now = new Date()) {
    const result = await this.prisma.encryptedMessageEnvelope.updateMany({
      where: {
        expiresAt: {
          lte: now,
        },
        deliveryState: {
          in: ['QUEUED', 'DELIVERED'],
        },
      },
      data: {
        deliveryState: 'EXPIRED',
      },
    });

    if (result.count > 0) {
      await this.prisma.auditEvent.create({
        data: {
          eventType: 'encrypted_envelopes.expired',
          metadata: {
            count: result.count,
          },
        },
      });
    }

    return result.count;
  }
}
