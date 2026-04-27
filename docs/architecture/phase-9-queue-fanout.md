# Phase 9 Queue, Fanout, And Expiry Jobs

Phase 9 adds Redis/BullMQ infrastructure for delivery fanout, background expiry sweeps, and Redis-backed rate limiting. It keeps CipherChat's privacy boundary intact: job payloads contain routing IDs and encrypted envelope identifiers only, never plaintext message content.

## Added In This Phase

- Redis service in `docker-compose.yml`.
- BullMQ and ioredis in the API workspace.
- `apps/api/src/queue/jobQueue.ts` job queue port with BullMQ and no-op implementations.
- `apps/api/src/jobs/processors.ts` job processors.
- `apps/api/src/worker.ts` background worker entry point.
- Redis-backed rate limiting in `apps/api/src/middleware/redisRateLimitStore.ts`.
- `POST /v1/messages/envelopes/fanout` for per-recipient-device encrypted fanout.
- `POST /v1/internal/jobs/envelopes/expire` internal expiry sweep enqueue route.

## Runtime Behavior

When `REDIS_URL` is unset:

- API still runs.
- Rate limiting uses in-memory buckets.
- Job enqueueing uses a no-op queue.
- `/ready` reports `queue: "disabled"`.

When `REDIS_URL` is set:

- `/ready` reports `queue: "connected"`.
- API enqueues generic delivery fanout jobs after encrypted envelope writes.
- API can enqueue expiry sweep jobs through the internal maintenance endpoint.
- `npm run api:worker` processes BullMQ jobs.

## Local Commands

```bash
docker compose up -d postgres redis
npm run api:dev
npm run api:worker
```

Environment:

```bash
DATABASE_URL="postgresql://cipherchat:cipherchat@localhost:5432/cipherchat?schema=public"
REDIS_URL="redis://localhost:6379"
INTERNAL_JOB_TOKEN="replace-with-local-secret"
```

## Privacy Rules

- Fanout requests must provide already-encrypted per-recipient payloads.
- Worker jobs must not contain plaintext message content.
- Push notification fanout remains generic; clients should wake and fetch encrypted envelopes.
- Expiry jobs update delivery state only.

## Next Phase

Phase 10 should connect the mobile prototype to these backend contracts behind a local API client layer while preserving mock-mode fallback for UI demos.
