# Phase 40 - Startup Health Hardening

Phase 40 makes API and worker startup fail predictably when configured production dependencies are unreachable. It also makes readiness responses more useful without leaking credentials or connection strings.

## Startup dependency checks

`ensureStartupDependencies` runs before the API starts listening and before the worker starts processing BullMQ jobs.

The check covers configured dependencies only:

- PostgreSQL through `checkPrismaReady`
- Redis through `redis.ping`

If `DATABASE_URL` or `REDIS_URL` is not configured in development, the related dependency remains disabled. Production still requires both through Phase 39 config validation.

## Readiness reasons

`GET /ready` now returns dependency states and safe reason codes:

- `not_configured`
- `connection_failed`

The response does not include exception messages, credentials, hostnames, or connection URLs.

## Graceful shutdown

`createGracefulShutdown` makes shutdown idempotent for both the API and worker.

The API handles:

- `SIGINT`
- `SIGTERM`
- Fastify close hooks
- Prisma disconnect
- Redis quit
- BullMQ queue close

The worker handles:

- `SIGINT`
- `SIGTERM`
- BullMQ worker close
- Redis quit
- Prisma disconnect

Repeated shutdown requests reuse the same close promise instead of starting duplicate cleanup.

## Deploy smoke test

Recommended production deploy smoke sequence:

1. Apply Prisma migrations.
2. Start the API process.
3. Confirm `GET /health` returns `ok=true`.
4. Confirm `GET /ready` returns `database=connected` and `queue=connected`.
5. Start the worker process.
6. Enqueue `POST /v1/internal/jobs/envelopes/expire` from the private operations network.
7. Check `GET /v1/internal/ops/queue` for healthy queue depth.
8. Send `SIGTERM` to API and worker in staging and confirm clean shutdown logs.

## Verification

`npm run verify:startup-health` checks that startup health, readiness reasons, graceful shutdown, tests, and this documentation remain present.

`npm run validate:ci` now includes the startup-health verification gate.

## Next phase

Phase 41 should run the Android development client path and record SQLCipher verification evidence from an installed native build.
