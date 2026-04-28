# Phase 37 - Metadata Retention and Cleanup

Phase 37 adds an enforceable server-side retention boundary for operational metadata. It does not weaken encrypted delivery or inspect message contents. Cleanup only targets records that are expired, acknowledged long enough to age out, explicitly deleted, or older than the audit-retention window.

## Metadata retention windows

Current retention constants live in `apps/api/src/security/metadataRetentionPolicy.ts`:

- device-session challenges: 1 day
- expired or revoked device sessions: 30 days
- acknowledged encrypted envelopes: 30 days
- expired encrypted envelopes: 7 days
- deleted or expired encrypted file objects: 30 days
- audit events: 180 days

These windows are conservative prototype defaults. Production can tune them by replacing the policy object at repository construction time, but retention windows must stay explicit and reviewed.

## Cleanup job

Cleanup is implemented through:

- `PrismaMetadataRetentionRepository.cleanupExpiredMetadata`
- BullMQ job name `metadata.cleanup`
- internal endpoint `POST /v1/internal/jobs/metadata/cleanup`
- worker processor support in `createJobProcessor`

The internal endpoint uses the same `x-internal-job-token` guard as the envelope expiry sweep. It only enqueues work; the worker performs database cleanup.

## What cleanup removes

The cleanup repository deletes:

- expired or consumed device-session challenges older than the challenge retention window
- expired or revoked device sessions older than the session retention window
- acknowledged encrypted envelopes older than the acknowledged-envelope window
- expired encrypted envelopes older than the expired-envelope window
- deleted or expired encrypted file object metadata older than the file retention window
- audit events older than the audit-event retention window

## What cleanup must not delete

Cleanup must not remove:

- active unexpired device-session challenges
- active unexpired device sessions
- queued or delivered envelopes that have not expired
- valid encrypted file objects that have not expired or been deleted
- recent audit events

`apiPersistence.integration.test.ts` seeds old and active records together, runs cleanup, and asserts that active sessions and valid queued envelopes remain.

## Verification

`npm run verify:metadata-retention` checks that the policy, repository, maintenance route, worker processor, integration test, and phase documentation are still present.

`npm run validate:ci` now includes the metadata retention verification gate.

## Follow-up

Phase 38 added delivery queue retention and Redis operational cleanup controls in `docs/architecture/phase-38-delivery-queue-redis-operations.md`.
