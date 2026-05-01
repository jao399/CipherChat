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
| Release evidence placeholder gate | `npm run verify:release-evidence` |
| SQLCipher evidence helper | `npm run collect:sqlcipher-evidence` |
| Signal integration plan gate | `npm run verify:signal-integration-plan` |
| File crypto plan gate | `npm run verify:file-crypto-plan` |
| Audit readiness gate | `npm run verify:audit-readiness` |
| External review package gate | `npm run verify:external-review-package` |
| Release smoke test | `npm run release:smoke` |
| High-severity dependency audit | `npm audit --omit=dev --audit-level=high` |
| Moderate dependency advisory triage | `npm audit --audit-level=moderate` |

## Architecture evidence

| Area | Evidence |
| --- | --- |
| Threat model | `CipherChat-threat-model.md` |
| Security criteria | `docs/security/security-acceptance-criteria.md` |
| Backend boundaries | `docs/architecture/backend-boundaries.md` |
| Local secure storage | `docs/architecture/adr/0003-local-secure-storage.md` |
| Push and metadata | `docs/architecture/adr/0005-push-and-metadata.md` |
| Release operations | `docs/architecture/phase-49-production-release-operations.md` |
| Secure file crypto boundary | `docs/architecture/phase-71-file-crypto-boundary.md` |
| Production file encryption adapter plan | `docs/architecture/phase-79-production-file-encryption-adapter-plan.md` |
| Push metadata boundary | `docs/architecture/phase-72-push-metadata-boundary.md` |
| Runtime SQLCipher evidence workflow | `docs/architecture/phase-73-runtime-sqlcipher-evidence-workflow.md` |
| Native signing key boundary | `docs/architecture/phase-74-native-signing-key-boundary.md` |
| Signal/libsignal integration plan | `docs/architecture/phase-76-signal-libsignal-integration-plan.md` |
| Push provider evidence boundary | `docs/architecture/phase-78-push-provider-evidence-boundary.md` |

## Implementation evidence

| Control | Evidence |
| --- | --- |
| Device-session auth | `apps/api/src/auth/signatureVerifier.ts`, `apps/api/src/repositories/prismaSessionRepository.ts` |
| Production config validation | `apps/api/src/config.ts`, `apps/api/src/config.test.ts` |
| Runtime health | `apps/api/src/startup/runtimeHealth.ts`, `apps/api/src/routes/healthRoutes.ts` |
| Graceful shutdown | `apps/api/src/startup/gracefulShutdown.ts` |
| Message crypto gate | `src/security/messageCryptoPolicy.ts`, `src/services/messages/messageEncryptionProvider.ts` |
| Signal provider boundary | `src/services/messages/signalOneToOneCryptoProvider.ts`, `docs/architecture/phase-76-signal-libsignal-integration-plan.md` |
| Native signing key boundary | `src/security/nativeSigningKeyProvider.ts`, `src/security/deviceSigningKeyStore.ts` |
| Secure file transfer boundary | `src/security/fileCryptoPolicy.ts`, `src/services/files/fileEncryptionProvider.ts`, `src/services/files/secureFileTransferProvider.ts` |
| Push privacy boundary | `src/services/notifications/pushNotificationPolicy.ts`, `src/services/notifications/pushProviderReadiness.ts`, `apps/api/src/push/pushPrivacy.ts`, `apps/api/src/push/pushNotificationService.ts` |
| Encrypted local database | `src/services/local/opSQLiteEncryptedLocalDatabase.ts`, `src/services/local/sqlCipherRuntimeVerification.ts` |
| Prototype migration harness | `src/services/local/prototypeStoreMigration.ts` |

## Runtime evidence to attach before launch

- Android SQLCipher evidence from `docs/release/android-sqlcipher-evidence.md`, including the Phase 73 BlueStacks development runtime pass and Phase 75 BlueStacks release-candidate APK pass for the current APK. Future Android release-candidate APKs require the same probe.
- iOS development-client or preview-build SQLCipher evidence from `docs/release/ios-sqlcipher-evidence.md`, plus screenshot or logs showing encrypted database availability. Phase 77 documents the path, but no iOS runtime evidence is attached yet.
- Signal/libsignal adapter evidence showing the Phase 76 production readiness criteria are satisfied; the plan alone is not production crypto evidence.
- Production file encryption adapter evidence showing the Phase 79 readiness criteria are satisfied; the plan alone is not production file crypto evidence.
- APNs/FCM provider evidence showing configured provider ports, generic wake-only payloads, provider log review, and release smoke results. The Phase 78 boundary alone is not provider evidence.
- Native signing key provider review and runtime evidence showing non-exportable private key behavior and public-key-only export. BlueStacks can support Android development checks, but it is not final production evidence for non-exportable key storage by itself.
- Release smoke workflow run URL.
- Container image digest promoted to staging or production.
- External security review report and remediation tracking link.
- Dependency review output for the release commit.
- Dependency advisory triage from `docs/security/dependency-advisory-triage.md`, including any unresolved moderate Expo transitive advisories.
- Production secret rotation record for `INTERNAL_JOB_TOKEN`, PostgreSQL credentials, Redis credentials, and push provider credentials.
