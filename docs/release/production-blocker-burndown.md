# CipherChat Production Blocker Burndown

Date: 2026-05-01

This burndown tracks what can be closed inside this repository versus what still requires native adapter selection, external infrastructure, or third-party review. It does not downgrade any production gate.

## Closed Or Reduced In Repo

| Blocker | Current status | Evidence |
| --- | --- | --- |
| Mock/demo UX readiness | Reduced | `docs/release/demo-readiness-report.md`; mobile screens route through device verification and show honest prototype language. |
| Android SQLCipher runtime evidence | Closed for current RC APK | `docs/release/android-sqlcipher-evidence.md`; Phase 73 BlueStacks development runtime probe passed and Phase 75 BlueStacks release-candidate APK probe passed. Future Android RCs must repeat the probe. |
| API local live-mode coherence | Reduced | `npm run api:test:integration`, `/health`, `/ready`, Prisma migrations, Redis/BullMQ queue tests. |
| Live production send gate | Closed as a safety gate | `src/security/messageCryptoPolicy.ts`; live send/receive fail closed without reviewed production crypto. |
| Trust re-check on retry | Closed | `src/services/api/BackendProvider.tsx` re-checks recipient trust before retrying queued fanout. |
| Worker error log minimization | Reduced | `apps/api/src/worker.ts` logs job ID/name and generic error summaries instead of raw error objects. |
| Audit evidence path hygiene | Reduced | `docs/security/audit-evidence-manifest.md` points to the active encrypted database adapter path. |
| Secure file crypto boundary | Reduced | `src/security/fileCryptoPolicy.ts`, `src/services/files/fileEncryptionProvider.ts`, and `docs/architecture/phase-71-file-crypto-boundary.md` keep production file transfer blocked without a reviewed adapter. |
| Push metadata boundary | Reduced | `src/services/notifications/pushNotificationPolicy.ts` and `docs/architecture/phase-72-push-metadata-boundary.md` define generic wake-only push payloads and block sensitive fields. |
| Release evidence placeholders | Reduced | `npm run verify:release-evidence` checks Android/iOS SQLCipher evidence documents exist while still reporting missing runtime proof as blocking. |
| Runtime SQLCipher evidence workflow | Reduced | `src/services/local/sqlCipherRuntimeVerification.ts`, Settings > Development Evidence, and `npm run collect:sqlcipher-evidence` make runtime verification repeatable without faking evidence. |
| Native signing key provider boundary | Reduced | `src/security/nativeSigningKeyProvider.ts` keeps production non-exportable signing keys blocked until a reviewed native provider and runtime evidence exist. |
| Native signing key provider readiness boundary | Reduced | Phase 87 improves the native key provider boundary with platform support, protection level, evidence status, demo/production readiness evaluation, Settings visibility, and `npm run verify:native-key-provider-boundary`. |
| Signal/libsignal integration plan | Reduced | `docs/architecture/phase-76-signal-libsignal-integration-plan.md` defines required native adapter, X3DH, Double Ratchet, storage, migration, and readiness criteria while keeping live sends fail-closed. |
| iOS SQLCipher evidence workflow | Reduced | `docs/release/ios-sqlcipher-evidence.md` and `npm run collect:sqlcipher-evidence` now document EAS, simulator, real-device, and macOS/Xcode verification paths without marking iOS complete. |
| Push provider evidence boundary | Reduced | `src/services/notifications/pushProviderReadiness.ts` and `docs/architecture/phase-78-push-provider-evidence-boundary.md` keep APNs/FCM production evidence blocked until provider configuration, log review, and smoke evidence exist. |
| Production file encryption adapter plan | Reduced | `docs/architecture/phase-79-production-file-encryption-adapter-plan.md` and `npm run verify:file-crypto-plan` define required adapter criteria without installing or certifying a production adapter. |
| External review package and dependency triage | Reduced | `docs/security/external-review-request-package.md`, `docs/security/dependency-advisory-triage.md`, and `npm run verify:external-review-package` prepare review materials and keep moderate advisories visible. |
| EAS iOS cloud build preparation | Reduced | `ios-device-preview` and `ios-testflight` EAS profiles plus `npm run verify:eas-ios-cloud-build` prepare Windows-hosted iOS cloud builds while keeping iOS SQLCipher evidence blocking until an installed iPhone/TestFlight runtime check passes. |

## Still Blocking Production Launch

| Blocker | Why it remains blocking | Next concrete action |
| --- | --- | --- |
| Reviewed Signal/libsignal one-to-one adapter | Real production E2EE is not implemented. The app only has a provider boundary, Phase 76 integration plan, and fail-closed gate. | Select a maintained native Signal/libsignal integration, implement the adapter behind `SignalOneToOneCryptoAdapter`, add interoperability vectors, and obtain cryptography review. |
| Production Signal prekey generation | Live bundle publication correctly blocks without a production-ready Signal prekey generator. | Implement `SignalPrekeyGenerationAdapter` using the same reviewed native adapter and non-exportable key storage where available. |
| iOS SQLCipher runtime evidence | Current workspace is Windows; Phase 86 prepares EAS iOS cloud builds, but no installed iPhone/TestFlight SQLCipher pass is attached. | Build/install `ios-device-preview` or `ios-testflight`, run Settings > Release Evidence > SQLCipher Runtime Check on the iPhone/TestFlight build, and update `docs/release/ios-sqlcipher-evidence.md` only after it passes. |
| Non-exportable device signing keys | Phase 87 improves the native key provider boundary, but the current SecureStore fallback is still JavaScript-readable inside the signing store and not production non-exportable evidence. BlueStacks runtime testing is useful development evidence only and does not prove Android Keystore non-exportability. | Implement and review native Android Keystore/iOS Keychain or Secure Enclave signing providers, then attach runtime evidence from appropriate production targets. |
| Production secure file crypto | Phase 71 defines the adapter and policy boundary and Phase 79 defines the implementation plan, but no reviewed implementation is installed. | Implement a reviewed client-side file crypto adapter, add large-file, key-wrapping, chunk integrity, and metadata-minimization tests, and complete file handling review. |
| Push provider production wiring | Phase 78 defines provider readiness evidence, but production APNs/FCM credentials, provider ports, provider log review, and release smoke evidence are not configured here. | Configure provider ports in deployment secrets, run release smoke checks, and confirm generic wake-only payloads in provider logs without sensitive fields. |
| External security review | Required before any production user data. | Provide this repository, CI outputs, native runtime evidence, adapter internals, and remediation tracking to an external reviewer. |
| Moderate Expo transitive advisories | `postcss` and `uuid` advisories are under Expo tooling. Phase 80 documents triage and the safe fix is an Expo-compatible upstream update, not a blind forced override. | Track Expo SDK patch availability; avoid `npm audit fix --force` unless an Expo upgrade plan has been tested and Android/iOS SQLCipher evidence is refreshed. |

## Commands That Must Stay Green

```powershell
npm run typecheck
npm test
npm run validate:ci
npm run verify:signal-integration-plan
npm run verify:file-crypto-plan
npm run verify:native-key-provider-boundary
npm run verify:release-evidence
npm run collect:sqlcipher-evidence
npm run verify:external-review-package
npm audit --audit-level=moderate
npx expo-doctor
```

## Non-Negotiable Guardrails

- Do not rename `prototype-sha256-envelope-v1` as production encryption.
- Do not enable live production sends without a reviewed Signal/X3DH + Double Ratchet provider.
- Do not store plaintext messages durably outside a verified encrypted database boundary.
- Do not log message content, filenames, contact graphs, safety numbers, private keys, public prekey values, tokens, or decrypted identifiers.
- Do not treat this prototype as production-ready until the blockers above are closed and externally reviewed.
