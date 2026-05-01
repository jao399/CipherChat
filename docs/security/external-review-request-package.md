# CipherChat External Review Request Package

CipherChat is requesting security review as a demo-ready secure messaging prototype with production gates, not as production encrypted messaging software.

## Review Scope

- Expo React Native mobile app security boundaries.
- Device identity, signing-key storage, trust-state UX, and revocation flows.
- Message encryption provider boundary and fail-closed live-mode behavior.
- File encryption boundary and production adapter requirements.
- SQLCipher runtime evidence process for Android and iOS.
- Node/Fastify API authorization, encrypted envelope metadata flows, rate limits, and retention.
- Push notification privacy and APNs/FCM readiness boundary.
- Release operations, CI gates, dependency triage, and audit evidence packaging.

## Out Of Scope

- Final Signal/libsignal adapter internals until a reviewed native adapter is selected.
- Production MLS group messaging internals.
- Production APNs/FCM credentials and cloud deployment secrets.
- Production file encryption adapter internals until an adapter is installed.
- Production account recovery, secure backup, privacy-policy operations, and billing.

## Architecture Summary

The mobile app defaults to mock/demo mode and live production message sending remains fail-closed. The API stores protocol metadata and encrypted envelopes only. Local encrypted storage is modeled through the OP-SQLite SQLCipher adapter and runtime probe. Device authentication is separated from future Signal messaging identity. Production crypto, native key storage, push, and file transfer are all behind explicit boundaries.

## Crypto Blockers

- No reviewed Signal/libsignal-compatible X3DH and Double Ratchet adapter is installed.
- `prototype-sha256-envelope-v1` is demo-only and cannot be used for production.
- Production prekey generation remains blocked without the reviewed Signal adapter.
- Group E2EE requires MLS or a reviewed MLS implementation strategy.

## Mobile Storage Blockers

- iOS SQLCipher runtime evidence is still missing.
- Expo SecureStore-held prototype signing keys do not satisfy production non-exportable key requirements.
- A reviewed Android Keystore/iOS Keychain or Secure Enclave signing provider is still required.
- Durable plaintext message/file state must remain blocked unless encrypted storage is active and verified.

## Backend Metadata And Audit Boundaries

The backend should receive device/session metadata, public key material, encrypted envelopes, opaque headers, encrypted file descriptors, and safe operational counters only. Logs and audit events must not include message content, filenames, contact graph details, safety numbers, private keys, public prekey values, push tokens, bearer tokens, or decrypted identifiers.

## Push Notification Privacy Boundary

Push payloads are limited to generic wake/sync data. APNs/FCM evidence remains blocked until provider credentials are configured outside source control, provider ports are wired, logs are reviewed for generic payloads only, and release smoke evidence is attached.

## File Encryption Boundary

Production file transfer remains blocked until a reviewed adapter encrypts file bytes, filenames, MIME types, thumbnails/previews where applicable, and per-recipient file keys. The Phase 79 plan defines the required algorithm family, key wrapping, chunking, integrity, and evidence criteria.

## Required Reviewer Deliverables

- Findings report with severity, impact, reproduction, and remediation guidance.
- Cryptography review of the selected Signal/libsignal and file encryption adapters once installed.
- Mobile storage and native key-management review for Android and iOS.
- API authorization, metadata minimization, logging, and retention review.
- Release gate signoff or explicit launch-blocking issues.
- Retest notes after remediation.

## Evidence Docs To Attach

- `CipherChat-threat-model.md`
- `docs/security/security-acceptance-criteria.md`
- `docs/security/audit-evidence-manifest.md`
- `docs/release/production-readiness-checklist.md`
- `docs/release/production-blocker-burndown.md`
- `docs/release/android-sqlcipher-evidence.md`
- `docs/release/ios-sqlcipher-evidence.md`
- `docs/architecture/phase-76-signal-libsignal-integration-plan.md`
- `docs/architecture/phase-79-production-file-encryption-adapter-plan.md`
- `docs/security/dependency-advisory-triage.md`

## Known Non-Production Areas

- Signal/libsignal production encryption is not implemented.
- Production file encryption adapter is not implemented.
- iOS SQLCipher runtime evidence is missing.
- Native non-exportable signing key provider evidence is missing.
- Production APNs/FCM evidence is missing.
- External security review is not complete.
- Moderate Expo transitive advisories remain under monitoring.
