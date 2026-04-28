# Phase 30 - API Integration Tests

Phase 30 adds real API integration coverage against disposable PostgreSQL and Redis services.

The fast API route tests still use injected repositories. The new integration test exercises the real Prisma repositories, real BullMQ queue integration, and real Fastify route flow.

## What changed

- Added `apps/api/src/routes/apiPersistence.integration.test.ts`.
- Added `apps/api/scripts/run-integration-tests.mjs`.
- Added root script `npm run api:test:integration`.
- Added API workspace script `npm run test:integration`.
- `npm run validate:ci` now includes the API integration test.

## Integration coverage

The integration test verifies:

- Prisma migrations are applied before running tests.
- Device bundles persist through PostgreSQL.
- Device challenges and sessions persist through PostgreSQL.
- Development challenge signatures create real sessions in the test environment.
- Encrypted envelope fanout persists encrypted envelope metadata only.
- BullMQ receives a generic delivery fanout job through Redis.
- Recipient inbox fetch marks envelopes delivered.
- Acknowledgement marks envelopes acknowledged.
- Audit events are written for session and encrypted-envelope lifecycle events.

## Runtime requirements

Local execution requires:

- PostgreSQL at `postgresql://cipherchat:cipherchat@localhost:5432/cipherchat`
- Redis at `redis://localhost:6379`

The project `docker-compose.yml` provides both services.

Run locally:

```bash
docker compose up -d
npm run api:test:integration
```

## CI behavior

GitHub Actions provisions PostgreSQL and Redis services, then runs `npm run validate:ci`, which includes the integration test.

Fast tests still skip the integration suite unless `RUN_API_INTEGRATION_TESTS=true` is set by the integration runner.

## Next phase

Phase 31 should add EAS development-client build verification:

- Android development-client build checklist
- iOS development-client build checklist
- SQLCipher Settings probe verification
- migration control verification on a real development build
