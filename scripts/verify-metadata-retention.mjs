import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

const checks = [
  {
    path: 'apps/api/src/security/metadataRetentionPolicy.ts',
    markers: [
      'challengeRetentionMs',
      'sessionRetentionMs',
      'acknowledgedEnvelopeRetentionMs',
      'expiredEnvelopeRetentionMs',
      'auditEventRetentionMs',
      'metadataRetentionTargets',
    ],
  },
  {
    path: 'apps/api/src/repositories/prismaMetadataRetentionRepository.ts',
    markers: [
      'cleanupExpiredMetadata',
      'deviceSessionChallenge.deleteMany',
      'deviceSession.deleteMany',
      'encryptedMessageEnvelope.deleteMany',
      'auditEvent.deleteMany',
    ],
  },
  {
    path: 'apps/api/src/routes/maintenanceRoutes.ts',
    markers: [
      '/v1/internal/jobs/metadata/cleanup',
      'enqueueMetadataRetentionCleanup',
    ],
  },
  {
    path: 'apps/api/src/jobs/processors.ts',
    markers: [
      'metadata.cleanup',
      'cleanupExpiredMetadata',
    ],
  },
  {
    path: 'apps/api/src/routes/apiPersistence.integration.test.ts',
    markers: [
      'cleans expired metadata without touching active sessions or valid queued envelopes',
      'message_valid_queued',
      'session_active',
    ],
  },
  {
    path: 'docs/architecture/phase-37-metadata-retention-cleanup.md',
    markers: [
      'Metadata retention windows',
      'Cleanup job',
      'What cleanup must not delete',
    ],
  },
];

let failures = 0;

for (const check of checks) {
  const content = readFileSync(join(root, check.path), 'utf8');
  console.log(`Checking ${check.path}`);

  for (const marker of check.markers) {
    if (!content.includes(marker)) {
      console.error(`FAIL - missing marker: ${marker}`);
      failures += 1;
    } else {
      console.log(`PASS - ${marker}`);
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} metadata-retention check(s) failed.`);
  process.exit(1);
}

console.log('\nMetadata retention cleanup controls are present.');
