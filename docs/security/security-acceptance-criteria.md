# CipherChat Security Acceptance Criteria

These criteria are production blockers. CipherChat must not process production user message content until each applicable gate is satisfied and evidence is attached to the release record.

## Production blockers

- No production plaintext message body or file content may be sent to the API.
- Secure file upload must encrypt bytes client-side before object upload; plaintext filenames and MIME types must be encrypted before persistence.
- Prototype crypto paths must be disabled or blocked in production mode.
- Live sends must be blocked while the active message crypto provider is prototype-only.
- Native encrypted local storage must be verified on Android and iOS development clients.
- Device-session auth must support revocation, expiry, token hashing at rest, and abuse monitoring.
- Device revocation must invalidate active sessions and remove the revoked device from public key discovery.
- Key-change warnings must block send until users review changed safety numbers.
- External security review must be completed before production launch.
- CI must pass `npm run validate:ci` on the release commit.

## Cryptography gates

- One-to-one messaging must use a reviewed Signal-style X3DH plus Double Ratchet implementation.
- Group messaging must use MLS or a reviewed MLS implementation strategy before production group E2EE.
- Device identity keys, signed prekeys, one-time prekeys, and session state must have documented lifecycle rules.
- Production Signal adapters must use the `signal-x3dh-v1` prekey bundle contract and reject prototype placeholder prekeys.
- Production Signal adapter registration must be explicit, startup-checked, and backed by release evidence for the installed native adapter.
- One-time prekey claim routes must consume at most one prekey transactionally and avoid returning reusable prekey arrays for production session setup.
- Prekey inventory status must expose counts and thresholds only, never key material or message/contact metadata.
- Prekey top-up routes must accept only client-generated public one-time prekeys from the authenticated current device and must not log or return prekey values.
- The server must only receive public key material, ciphertext, opaque headers, delivery metadata, and selected user-disclosed abuse report content.
- No custom cryptographic primitive may be introduced without a formal design review.
- One-to-one production sends must use the `signal-x3dh-double-ratchet-v1` provider with a reviewed Signal/libsignal-compatible adapter.
- A reviewed production provider must replace `prototype-sha256-envelope-v1` before live sends are enabled.
- Message encryption provider selection must remain explicit and test-covered.
- Test vectors and interoperability tests must cover key agreement, message ratcheting, replay handling, and key rotation.

## Mobile security gates

- Session tokens must remain in OS secure storage, not AsyncStorage.
- Device private key material must remain out of AsyncStorage and logs.
- SQLCipher or equivalent encrypted local database must report `encrypted=true` in installed Android and iOS development clients.
- Prototype AsyncStorage metadata migration must preserve source data until verified rollback exists.
- Production builds must block plaintext message persistence unless encrypted storage is active.
- Durable outbound queue records must reject plaintext-shaped fields before persistence.
- Device identity signing must be isolated behind a key-store/provider boundary; direct app flows must not load private key bytes.
- Non-exportable Android Keystore and iOS Keychain options must replace the Expo SecureStore fallback before production encrypted messaging.
- Mobile settings must expose device revocation and clear local sessions after successful revocation.

## API and infrastructure gates

- All protected endpoints must require verified device sessions.
- Additional-device bundle publication must require an authenticated session for the same account.
- Existing-device bundle updates must require an authenticated session for that same device.
- Sender device identity must match the authenticated session for outbound envelopes.
- Recipient account and device filters must be enforced for inbox reads and acknowledgements.
- Account creation, discovery, bundle lookup, envelope fanout, and session creation must have durable rate limits.
- One-time prekey claim and current-device prekey top-up routes must have endpoint-specific durable rate limits.
- Envelope size, fanout recipient count, and queue depth must have explicit per-environment limits.
- Account/session abuse-control tests must pass before release.
- Metadata retention cleanup tests must pass before release.
- Delivery queue retention, cleanup, and Redis operational visibility tests must pass before release.
- Internal routes must use managed secrets, rotation policy, and network restrictions where available.
- PostgreSQL and Redis credentials must live outside source control and CI logs.
- Device bundle publication and identity-key changes must create metadata-only audit events.
- Device revocation must require same-account device authentication and create metadata-only audit events.
- Account device listing must be scoped to the authenticated account and must not return key material, session tokens, push tokens, or message metadata.

## Privacy and abuse gates

- Contact discovery must have scraping resistance and a privacy review.
- Metadata retention limits must exist for delivery events, expired envelopes, audit records, and queue jobs.
- Metadata cleanup must not delete active sessions, active challenges, or valid queued envelopes.
- Queue cleanup must not delete waiting, active, delayed, or paused delivery jobs.
- Production API startup must fail when required persistence, queue, signature-verifier, CORS, or internal-token configuration is unsafe.
- Startup and readiness health checks must expose safe reason codes without leaking connection strings or credentials.
- Push notifications must use generic payloads with no message content, sender names, group names, filenames, or plaintext previews.
- Abuse reports must disclose only user-selected message content or metadata.
- Audit events must avoid plaintext content, file names, private contact graph details, and private keys.

## Evidence required before release

- Current threat model: `CipherChat-threat-model.md`
- Production crypto provider gate test output: `npm run app:test`
- Outbound plaintext lifecycle gate output: `npm run verify:plaintext-lifecycle`
- Account/session abuse-control gate output: `npm run verify:abuse-controls`
- Metadata retention gate output: `npm run verify:metadata-retention`
- Queue operations gate output: `npm run verify:queue-operations`
- Production config gate output: `npm run verify:production-config`
- Startup health gate output: `npm run verify:startup-health`
- Audit readiness gate output: `npm run verify:audit-readiness`
- Key-change send blocking test output: `npm run app:test`
- Passing CI output for `npm run validate:ci`
- Android development-client SQLCipher verification result
- iOS development-client SQLCipher verification result
- Cryptography design review and implementation evidence
- Account/session abuse-control test evidence
- Metadata retention cleanup test evidence
- Queue operations and Redis stats test evidence
- Production secret and environment validation test evidence
- Startup health and graceful shutdown test evidence
- Key-change warning UX test evidence
- Production secret storage and rotation plan
- External security review report and remediation evidence
