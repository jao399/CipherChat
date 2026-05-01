# CipherChat External Audit Readiness

CipherChat is audit-preparation ready, not production-approved. This package defines what an external security reviewer should inspect before any production user data is handled.

## Audit scope

In scope:

- Expo React Native mobile app security boundaries.
- Device identity, session storage, and OS-backed key strategy.
- Message encryption provider boundary and live-mode crypto gates.
- Encrypted local database and prototype AsyncStorage migration controls.
- Node API authentication, encrypted envelope delivery, queue fanout, metadata retention, and abuse controls.
- Push notification privacy boundary.
- Secure file encryption boundary and Phase 79 production adapter plan.
- Release operations, CI, Docker image, health checks, and smoke tests.

Out of scope until implemented:

- Final Signal/libsignal protocol adapter internals.
- MLS group messaging internals.
- Production APNs/FCM provider credentials and cloud platform configuration.
- Final backup, recovery, account deletion, and privacy-policy implementation.
- Final production file encryption adapter internals until an adapter is installed.

## Critical blockers

- Real one-to-one cryptography must use a reviewed Signal-style X3DH plus Double Ratchet implementation.
- Group messaging must use MLS or a reviewed MLS implementation strategy.
- Device private-key handling must move from the current Expo SecureStore fallback to stronger non-exportable native Keychain/Keystore providers where possible.
- iOS SQLCipher runtime verification must be completed on macOS/Xcode.
- Key-change warning UX must block sends until changed safety numbers are reviewed.
- External security review must verify the live crypto provider, local storage, API authorization, metadata minimization, and release process.
- Production file encryption must remain blocked until the Phase 79 criteria are implemented and reviewed.

## Reviewer entry points

- Threat model: `CipherChat-threat-model.md`
- Security acceptance criteria: `docs/security/security-acceptance-criteria.md`
- Evidence manifest: `docs/security/audit-evidence-manifest.md`
- External review request package: `docs/security/external-review-request-package.md`
- Dependency advisory triage: `docs/security/dependency-advisory-triage.md`
- Backend boundaries: `docs/architecture/backend-boundaries.md`
- Security model: `docs/architecture/security-model.md`
- Release checklist: `docs/release/production-readiness-checklist.md`

## Audit tracks

### Mobile application

- Verify no session tokens are stored in AsyncStorage.
- Verify device identity private-key use is isolated behind the signing-key store.
- Verify encrypted database readiness gates prevent plaintext persistence.
- Verify onboarding and UI-only prototype state cannot be confused with production message storage.

### Cryptography

- Verify live send and receive paths fail closed unless a reviewed provider is installed.
- Verify no custom cryptographic protocol is introduced for production messaging.
- Verify future provider tests include X3DH, Double Ratchet, replay handling, skipped-message keys, key rotation, and interoperability vectors.
- Verify file encryption uses reviewed authenticated encryption, per-file keys, encrypted metadata, per-recipient key wrapping, and native runtime evidence before production file transfer is enabled.

### API and infrastructure

- Verify all protected routes require device-session authentication.
- Verify sender account and device identity are enforced for outbound envelopes.
- Verify queued envelope reads are scoped to the authenticated recipient device.
- Verify rate limits, fanout caps, metadata retention, and queue cleanup policies are enforced.

### Privacy and metadata

- Verify push payloads contain only opaque wake data.
- Verify audit events and logs avoid message content, filenames, private contact graphs, private keys, and safety numbers.
- Verify metadata retention cleanup does not delete active sessions, active challenges, or valid queued envelopes.

### Release operations

- Verify `npm run validate:ci` passes on the release commit.
- Verify the API container builds from `apps/api/Dockerfile`.
- Verify `npm run release:smoke` passes against the deployed API.
- Verify production secrets are configured outside source control and rotated by policy.

## Current self-review scan

The current TypeScript scan found no `dangerouslySetInnerHTML`, `innerHTML`, `insertAdjacentHTML`, `eval`, or `new Function` usage in app/API source. AsyncStorage remains present for prototype and migration-controlled metadata; production blockers require encrypted storage verification and migration before production encrypted messaging.

## External audit deliverables

The external reviewer should produce:

- Findings report with severity, exploitability, evidence, and remediation guidance.
- Cryptography review notes for selected Signal/libsignal and MLS integration.
- Mobile storage and key-management review notes for Android and iOS.
- API authorization and metadata-minimization review notes.
- Release-blocker signoff or explicit launch-blocking issues.
- Dependency advisory disposition for unresolved Expo transitive advisories.
