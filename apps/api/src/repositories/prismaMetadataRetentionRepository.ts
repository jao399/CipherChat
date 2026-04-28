import type { PrismaClient } from '@prisma/client';

import {
  buildMetadataRetentionCutoffs,
  metadataRetentionPolicy,
  type MetadataRetentionCleanupResult,
  type MetadataRetentionPolicy,
} from '../security/metadataRetentionPolicy.js';

export class PrismaMetadataRetentionRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly policy: MetadataRetentionPolicy = metadataRetentionPolicy,
  ) {}

  async cleanupExpiredMetadata(now = new Date()): Promise<MetadataRetentionCleanupResult> {
    const cutoffs = buildMetadataRetentionCutoffs(now, this.policy);

    const [
      deletedChallenges,
      deletedSessions,
      deletedAcknowledgedEnvelopes,
      deletedExpiredEnvelopes,
      deletedFileObjects,
      deletedAuditEvents,
    ] = await this.prisma.$transaction([
      this.prisma.deviceSessionChallenge.deleteMany({
        where: {
          OR: [
            { expiresAt: { lte: cutoffs.challengesBefore } },
            { consumedAt: { lte: cutoffs.challengesBefore } },
          ],
        },
      }),
      this.prisma.deviceSession.deleteMany({
        where: {
          OR: [
            { expiresAt: { lte: cutoffs.sessionsBefore } },
            { revokedAt: { lte: cutoffs.sessionsBefore } },
          ],
        },
      }),
      this.prisma.encryptedMessageEnvelope.deleteMany({
        where: {
          deliveryState: 'ACKNOWLEDGED',
          acknowledgedAt: {
            lte: cutoffs.acknowledgedEnvelopesBefore,
          },
        },
      }),
      this.prisma.encryptedMessageEnvelope.deleteMany({
        where: {
          deliveryState: 'EXPIRED',
          OR: [
            { expiresAt: { lte: cutoffs.expiredEnvelopesBefore } },
            { queuedAt: { lte: cutoffs.expiredEnvelopesBefore } },
          ],
        },
      }),
      this.prisma.encryptedFileObject.deleteMany({
        where: {
          OR: [
            { deletedAt: { lte: cutoffs.deletedFilesBefore } },
            { expiresAt: { lte: cutoffs.deletedFilesBefore } },
          ],
        },
      }),
      this.prisma.auditEvent.deleteMany({
        where: {
          createdAt: {
            lte: cutoffs.auditEventsBefore,
          },
        },
      }),
    ]);

    return {
      deletedChallenges: deletedChallenges.count,
      deletedSessions: deletedSessions.count,
      deletedAcknowledgedEnvelopes: deletedAcknowledgedEnvelopes.count,
      deletedExpiredEnvelopes: deletedExpiredEnvelopes.count,
      deletedFileObjects: deletedFileObjects.count,
      deletedAuditEvents: deletedAuditEvents.count,
    };
  }
}
