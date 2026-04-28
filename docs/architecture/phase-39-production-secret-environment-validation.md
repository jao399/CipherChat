# Phase 39 - Production Secret and Environment Validation

Phase 39 adds startup validation for production API deployments. Development and test mode remain flexible for UI work and local integration testing, but `NODE_ENV=production` now fails fast when required production dependencies or secret controls are missing.

## Production startup blockers

`validateApiConfigForRuntime` blocks production startup unless:

- `DATABASE_URL` is configured.
- `REDIS_URL` is configured.
- `INTERNAL_JOB_TOKEN` is configured and strong enough.
- `DEVICE_SIGNATURE_VERIFIER=ed25519`.
- `ALLOW_INSECURE_DEV_SIGNATURES` is not enabled.
- `CORS_ORIGIN` is a production origin, not wildcard or localhost.

The API server calls this validator immediately after reading config, before opening PostgreSQL, Redis, or Fastify listeners.

## Secret strength

`INTERNAL_JOB_TOKEN` must:

- be at least 32 characters
- include at least three character classes
- avoid obvious placeholder words such as `replace`, `local`, `test`, `development`, `secret`, or `password`

This token is still only one layer. Production deployments should also restrict internal routes with private networking, ingress policy, or platform-level service authentication.

## Environment separation

Development defaults intentionally stay local:

- `API_HOST=127.0.0.1`
- `CORS_ORIGIN=http://localhost:8081`
- optional `DATABASE_URL`
- optional `REDIS_URL`

Production must be explicit:

```text
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
INTERNAL_JOB_TOKEN=<strong generated token>
DEVICE_SIGNATURE_VERIFIER=ed25519
CORS_ORIGIN=https://<production app origin>
```

Do not enable `ALLOW_INSECURE_DEV_SIGNATURES` outside disposable local or CI test environments.

## Rotation plan

Recommended production rotation:

1. Store `INTERNAL_JOB_TOKEN`, PostgreSQL credentials, and Redis credentials in the deployment platform's secret manager.
2. Rotate `INTERNAL_JOB_TOKEN` at least every 90 days and immediately after suspected exposure.
3. Use a short overlap window by deploying route callers with the new token before replacing the API token.
4. Rotate database and Redis credentials through managed credential rotation where available.
5. Never print production secret values in CI logs, app logs, issue trackers, or screenshots.
6. After rotation, run `GET /ready`, `GET /v1/internal/ops/queue`, and a maintenance enqueue smoke test from the private operations network.

## Verification

`npm run verify:production-config` checks that production validation, startup wiring, tests, and this documentation remain present.

`npm run validate:ci` now includes this verification gate.

## Next phase

Phase 40 should add production dependency startup health hardening:

- startup smoke checks for PostgreSQL and Redis before accepting traffic
- explicit readiness failure reasons without leaking credentials
- graceful shutdown coverage for Redis, Prisma, queue, and worker processes
- operational documentation for deploy, rollback, and smoke-test sequence
