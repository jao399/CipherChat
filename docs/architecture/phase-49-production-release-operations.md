# Phase 49 - Production Release Operations

Phase 49 adds the operational scaffolding needed to package, smoke-test, and monitor the CipherChat API before production promotion. It does not deploy real infrastructure from this repository; it defines reproducible release gates that a deployment platform can run.

## Production deployment

- `apps/api/Dockerfile` builds the API as a production Node container.
- The container starts `apps/api/dist/server.js` with `NODE_ENV=production`.
- Runtime must provide managed PostgreSQL, managed Redis, a strong `INTERNAL_JOB_TOKEN`, a production `CORS_ORIGIN`, and `DEVICE_SIGNATURE_VERIFIER=ed25519`.
- Database migrations remain an explicit deploy step through `npm run prisma:migrate:deploy`.

## Monitoring

Release smoke and monitoring systems should poll:

- `GET /health` for process liveness.
- `GET /ready` for dependency readiness with safe reason codes.
- `GET /v1/internal/ops/queue` from a private network with the internal token for delivery queue health.
- `GET /v1/internal/ops/redis/rate-limits` from a private network with the internal token for rate-limit visibility.

Internal operations routes must be protected by the internal token and by platform networking or service-to-service authentication.

## CI/CD

- `.github/workflows/ci.yml` continues to run `npm run validate:ci` on pushes and pull requests to `master`.
- `.github/workflows/release-smoke.yml` runs manually or on version tags.
- The release smoke workflow builds the API Docker image, applies Prisma migrations to disposable PostgreSQL, starts the container with Redis, and runs `npm run release:smoke`.

## Release smoke tests

`scripts/release-smoke-test.mjs` verifies:

1. `/health` returns the CipherChat API liveness response.
2. `/ready` reports PostgreSQL and Redis as connected.
3. Queue operations are available through the internal monitoring route when `INTERNAL_JOB_TOKEN` is set.

The smoke test is intentionally narrow. It proves the release artifact starts, connects to dependencies, and exposes safe operational visibility. Protocol-level send/receive verification remains covered by integration tests and later production crypto provider tests.

## Verification

`npm run verify:release-operations` checks that the Dockerfile, release-smoke workflow, smoke script, and release documentation remain present. `npm run validate:ci` includes this verification gate.
