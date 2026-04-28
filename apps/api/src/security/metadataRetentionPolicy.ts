const dayMs = 1000 * 60 * 60 * 24;

export const metadataRetentionPolicy = {
  challengeRetentionMs: dayMs,
  sessionRetentionMs: 30 * dayMs,
  acknowledgedEnvelopeRetentionMs: 30 * dayMs,
  expiredEnvelopeRetentionMs: 7 * dayMs,
  deletedFileRetentionMs: 30 * dayMs,
  auditEventRetentionMs: 180 * dayMs,
} as const;

export type MetadataRetentionPolicy = typeof metadataRetentionPolicy;

export type MetadataRetentionCutoffs = {
  challengesBefore: Date;
  sessionsBefore: Date;
  acknowledgedEnvelopesBefore: Date;
  expiredEnvelopesBefore: Date;
  deletedFilesBefore: Date;
  auditEventsBefore: Date;
};

export type MetadataRetentionCleanupResult = {
  deletedChallenges: number;
  deletedSessions: number;
  deletedAcknowledgedEnvelopes: number;
  deletedExpiredEnvelopes: number;
  deletedFileObjects: number;
  deletedAuditEvents: number;
};

function cutoff(now: Date, retentionMs: number) {
  return new Date(now.getTime() - retentionMs);
}

export function buildMetadataRetentionCutoffs(
  now = new Date(),
  policy: MetadataRetentionPolicy = metadataRetentionPolicy,
): MetadataRetentionCutoffs {
  return {
    challengesBefore: cutoff(now, policy.challengeRetentionMs),
    sessionsBefore: cutoff(now, policy.sessionRetentionMs),
    acknowledgedEnvelopesBefore: cutoff(now, policy.acknowledgedEnvelopeRetentionMs),
    expiredEnvelopesBefore: cutoff(now, policy.expiredEnvelopeRetentionMs),
    deletedFilesBefore: cutoff(now, policy.deletedFileRetentionMs),
    auditEventsBefore: cutoff(now, policy.auditEventRetentionMs),
  };
}

export const metadataRetentionTargets = [
  'device-session-challenges',
  'expired-or-revoked-device-sessions',
  'acknowledged-encrypted-envelopes',
  'expired-encrypted-envelopes',
  'deleted-or-expired-file-objects',
  'audit-events',
] as const;
