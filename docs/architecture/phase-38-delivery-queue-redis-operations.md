# Phase 38 - Delivery Queue and Redis Operations

Phase 38 makes Redis and BullMQ operational behavior explicit. It keeps the privacy boundary from earlier phases: queue jobs contain routing IDs, encrypted envelope IDs, recipient-device counts, and timestamps only. They do not contain plaintext message bodies, filenames, contact names, or decrypted metadata.

## Delivery queue retention

Queue retention is centralized in `apps/api/src/operations/queueOperationsPolicy.ts`.

Current defaults:

- completed BullMQ jobs retained by count: 1000
- failed BullMQ jobs retained by count: 5000
- completed-job manual cleanup grace: 1 day
- failed-job manual cleanup grace: 7 days
- cleanup batch size: 1000

The policy is applied by `BullMqJobQueue` for:

- `delivery.fanout`
- `envelopes.expire`
- `metadata.cleanup`

Each job type uses explicit `removeOnComplete` and `removeOnFail` settings.

## Redis operational visibility

Redis rate-limit keys are intentionally TTL-managed. `RedisRateLimitStore.getOperationalStats` scans the `rate-limit:*` namespace and returns:

- namespace
- current key count
- scan count
- cleanup mode

This is visibility only. It does not delete rate-limit keys because Redis expirations already enforce the window.

## Queue depth thresholds

`evaluateQueueDepth` compares queue counts against policy thresholds and returns either `healthy` or `warning`. The goal is not to block requests at this phase; it gives operators a stable signal for alerts.

Tracked queue states:

- waiting
- active
- delayed
- failed
- completed
- paused

## Operational routes

Internal routes require `x-internal-job-token`:

- `GET /v1/internal/ops/queue`
- `POST /v1/internal/jobs/queue/cleanup`
- `GET /v1/internal/ops/redis/rate-limits`

Queue cleanup uses BullMQ `queue.clean` for retained completed and failed jobs. It does not delete waiting, active, delayed, or paused jobs.

## Runbook

Recommended production schedule:

1. Run `POST /v1/internal/jobs/envelopes/expire` every 5 to 15 minutes.
2. Run `POST /v1/internal/jobs/metadata/cleanup` daily.
3. Run `POST /v1/internal/jobs/queue/cleanup` daily after metadata cleanup.
4. Poll `GET /v1/internal/ops/queue` every minute from monitoring.
5. Poll `GET /v1/internal/ops/redis/rate-limits` every 5 minutes.
6. Alert when queue status is `warning`, failed jobs remain above threshold for 10 minutes, or Redis rate-limit key count grows unexpectedly.

Production deployment should restrict these internal routes at the network layer in addition to the internal token.

## Verification

`npm run verify:queue-operations` checks that the queue policy, BullMQ cleanup, Redis rate-limit stats, internal routes, tests, and documentation remain present.

`npm run validate:ci` now includes this verification gate.

## Next phase

Phase 39 should add production secret and environment validation:

- required production env vars
- secret strength checks for internal job token
- startup failure in production when required persistence or queue dependencies are missing
- release documentation for secret rotation and environment separation
