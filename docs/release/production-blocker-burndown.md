# CipherChat Production Blocker Burndown

Date: 2026-05-01

This burndown tracks what can be closed inside this repository versus what still requires native adapter selection, external infrastructure, or third-party review. It does not downgrade any production gate.

## Closed Or Reduced In Repo

| Blocker | Current status | Evidence |
| --- | --- | --- |
| Mock/demo UX readiness | Reduced | `docs/release/demo-readiness-report.md`; mobile screens route through device verification and show honest prototype language. |
| Android SQLCipher runtime evidence | Reduced | `docs/architecture/phase-41-android-development-client-sqlcipher.md`; must be refreshed for the exact release-candidate build. |
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

## Still Blocking Production Launch

| Blocker | Why it remains blocking | Next concrete action |
| --- | --- | --- |
| Reviewed Signal/libsignal one-to-one adapter | Real production E2EE is not implemented. The app only has a provider boundary and fail-closed gate. | Select a maintained native Signal/libsignal integration, implement the adapter behind `SignalOneToOneCryptoAdapter`, add interoperability vectors, and obtain cryptography review. |
| Production Signal prekey generation | Live bundle publication correctly blocks without a production-ready Signal prekey generator. | Implement `SignalPrekeyGenerationAdapter` using the same reviewed native adapter and non-exportable key storage where available. |
| Android SQLCipher release-candidate evidence | Phase 73 provides an in-app runtime check, but the exact release-candidate build still needs fresh Android proof. | Run Settings > Development Evidence > SQLCipher Runtime Check on the Android development client and update `docs/release/android-sqlcipher-evidence.md`. |
| iOS SQLCipher runtime evidence | Current workspace is Windows; iOS runtime evidence requires macOS/Xcode. Phase 73 provides the in-app check but no iOS proof is attached. | Run Settings > Development Evidence > SQLCipher Runtime Check on the iOS development client and update `docs/release/ios-sqlcipher-evidence.md`. |
| Non-exportable device signing keys | Phase 74 defines the provider boundary, but the current SecureStore fallback is still JavaScript-readable inside the signing store and not production non-exportable evidence. | Implement and review native Android Keystore/iOS Keychain or Secure Enclave signing providers, then attach runtime evidence. |
| Production secure file crypto | Phase 71 defines the adapter and policy boundary, but no reviewed implementation is installed. | Implement a reviewed client-side file crypto adapter, add large-file and metadata-minimization tests, and complete file handling review. |
| Push provider production wiring | Phase 72 defines the payload metadata policy, but production APNs/FCM credentials, provider ports, and provider evidence are not configured here. | Configure provider ports in deployment secrets, run release smoke checks, and confirm generic wake-only payloads in provider logs. |
| External security review | Required before any production user data. | Provide this repository, CI outputs, native runtime evidence, adapter internals, and remediation tracking to an external reviewer. |
| Moderate Expo transitive advisories | `postcss` and `uuid` advisories are under Expo tooling. The safe fix is an Expo-compatible upstream update, not a blind forced override. | Track Expo SDK patch availability; avoid `npm audit fix --force` unless an Expo upgrade plan has been tested. |

## Commands That Must Stay Green

```powershell
npm run typecheck
npm test
npm run validate:ci
npm run verify:release-evidence
npm run collect:sqlcipher-evidence
npx expo-doctor
```

## Non-Negotiable Guardrails

- Do not rename `prototype-sha256-envelope-v1` as production encryption.
- Do not enable live production sends without a reviewed Signal/X3DH + Double Ratchet provider.
- Do not store plaintext messages durably outside a verified encrypted database boundary.
- Do not log message content, filenames, contact graphs, safety numbers, private keys, public prekey values, tokens, or decrypted identifiers.
- Do not treat this prototype as production-ready until the blockers above are closed and externally reviewed.
