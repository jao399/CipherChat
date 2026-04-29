# CipherChat Audit Evidence Manifest

This manifest lists the evidence an external reviewer should request or reproduce.

## Core commands

| Evidence | Command |
| --- | --- |
| Full CI gate | `npm run validate:ci` |
| App security/unit tests | `npm run app:test` |
| API tests | `npm run api:test` |
| API persistence integration tests | `npm run api:test:integration` |
| Prisma schema validation | `npm run prisma:validate` |
| Production config gate | `npm run verify:production-config` |
| Startup health gate | `npm run verify:startup-health` |
| Release operations gate | `npm run verify:release-operations` |
| Audit readiness gate | `npm run verify:audit-readiness` |
| Release smoke test | `npm run release:smoke` |
| High-severity dependency audit | `npm audit --omit=dev --audit-level=high` |

## Architecture evidence

| Area | Evidence |
| --- | --- |
| Threat model | `CipherChat-threat-model.md` |
| Security criteria | `docs/security/security-acceptance-criteria.md` |
| Backend boundaries | `docs/architecture/backend-boundaries.md` |
| Local secure storage | `docs/architecture/adr/0003-local-secure-storage.md` |
| Push and metadata | `docs/architecture/adr/0005-push-and-metadata.md` |
| Release operations | `docs/architecture/phase-49-production-release-operations.md` |

## Implementation evidence

| Control | Evidence |
| --- | --- |
| Device-session auth | `apps/api/src/auth/signatureVerifier.ts`, `apps/api/src/repositories/prismaSessionRepository.ts` |
| Production config validation | `apps/api/src/config.ts`, `apps/api/src/config.test.ts` |
| Runtime health | `apps/api/src/startup/runtimeHealth.ts`, `apps/api/src/routes/healthRoutes.ts` |
| Graceful shutdown | `apps/api/src/startup/gracefulShutdown.ts` |
| Message crypto gate | `src/security/messageCryptoPolicy.ts`, `src/services/messages/messageEncryptionProvider.ts` |
| Signal provider boundary | `src/services/messages/signalOneToOneCryptoProvider.ts` |
| Secure file transfer boundary | `src/services/files/secureFileTransferProvider.ts` |
| Push privacy boundary | `apps/api/src/push/pushPrivacy.ts`, `apps/api/src/push/pushNotificationService.ts` |
| Encrypted local database | `src/services/local/opSqliteEncryptedDatabase.ts` |
| Prototype migration harness | `src/services/local/prototypeStoreMigration.ts` |

## Runtime evidence to attach before launch

- Android development-client SQLCipher screenshot or logs showing encrypted database availability.
- iOS development-client SQLCipher screenshot or logs showing encrypted database availability.
- Release smoke workflow run URL.
- Container image digest promoted to staging or production.
- External security review report and remediation tracking link.
- Dependency review output for the release commit.
- Production secret rotation record for `INTERNAL_JOB_TOKEN`, PostgreSQL credentials, Redis credentials, and push provider credentials.
