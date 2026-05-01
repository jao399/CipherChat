# CipherChat Production Readiness Checklist

CipherChat is still a prototype. This checklist defines the minimum gates before any production user data is handled.

## Build and CI

- `npm run validate:ci` passes.
- GitHub Actions CI passes on `master`.
- Audit readiness package is attached to the release record.
- API container image builds from `apps/api/Dockerfile`.
- Release smoke workflow passes before promoting a backend build.
- `npm run release:smoke` passes against the deployed API.
- `npm run verify:dev-build-config` passes.
- `npm run verify:signal-adapter-readiness` passes.
- `npm run verify:release-evidence` passes and linked runtime evidence is no longer marked blocking.
- `npm run collect:sqlcipher-evidence` output is attached with matching Android/iOS runtime screenshots or logs.
- Android development client validates SQLCipher adapter status; Phase 41 evidence exists and must be refreshed for the release-candidate build.
- iOS development client validates SQLCipher adapter status.
- Release builds are generated and smoke-tested.

## Cryptography

- Formal threat model is complete.
- Security acceptance criteria are complete.
- Production-mode prototype crypto blockers are implemented.
- Settings reports production message crypto readiness.
- Message encryption provider selection is explicit and test-covered.
- No custom message cryptography is introduced.
- One-to-one messaging uses a reviewed Signal/X3DH + Double Ratchet implementation.
- Signal one-to-one adapters declare and validate the `signal-x3dh-v1` prekey bundle contract.
- Signal one-to-one adapter registration is backed by startup readiness evidence for the installed native adapter.
- File encryption provider selection is explicit and test-covered.
- Secure file transfer uses a reviewed production-ready file crypto adapter that encrypts file bytes, filenames, and MIME types before upload.
- One-time prekeys are claimed through a transactional consume-on-read path.
- Current-device prekey inventory reports counts and low-watermark status without returning key material.
- Current-device prekey top-up accepts client-generated public prekeys only and never logs or returns prekey values.
- Group messaging uses MLS or a reviewed MLS implementation strategy.
- Key verification UX handles new, trusted, changed, and revoked identities.
- Key rotation behavior is documented and tested.

## Local Security

- Database key is provisioned through OS secure storage.
- SQLCipher encrypted database reports `encrypted=true` on Android and iOS.
- Prototype AsyncStorage stores are migrated only after encrypted database verification.
- Source AsyncStorage deletion has rollback and backup policy.
- Plaintext message cache is blocked unless encrypted database is active.
- Outbound queue persistence rejects plaintext-shaped fields.
- Device identity private keys move toward non-exportable Keychain/Keystore usage where possible.
- Native signing key provider readiness reports reviewed implementation evidence, runtime evidence, non-exportable private keys, public-key-only export behavior, rotation support, and revocation support.

## Server Security

- Server stores encrypted envelopes only.
- Server never receives plaintext message bodies.
- Server audit logs avoid message content, filenames, and private contact details.
- Abuse prevention is designed without breaking message privacy.
- Device revocation invalidates active sessions and removes revoked devices from public key discovery.
- Account device listing is scoped to authenticated account metadata only.
- Rate limits and queue limits are configured per environment.
- Prekey claim and prekey top-up routes have endpoint-specific rate limits.
- Account creation, session creation, discovery, and fanout abuse controls are test-covered.
- Metadata retention cleanup is configured, tested, and scheduled.
- Delivery queue retention, queue cleanup, and Redis rate-limit visibility are configured.

## Privacy

- Push notifications contain opaque event IDs only.
- Push notification payloads are checked against the generic metadata policy and reject message plaintext, sender names, filenames, conversation identifiers, account identifiers, safety numbers, and tokens.
- APNs/FCM provider configuration is complete and production startup fails closed without it.
- Push provider ports are wired with background/data-only wake delivery and no alert or notification body.
- Metadata minimization review is complete.
- Data retention policy is implemented for server metadata cleanup.
- Contact discovery scraping-resistance review is complete.
- Secure backup design is complete.
- Account recovery design is complete.
- Privacy policy and data retention policy are written.

## Operations

- Production secrets are stored outside source control.
- Production API config validation passes with strong secrets and managed dependency URLs.
- Push credentials are stored in the deployment secret manager and rotation owners are assigned.
- API and worker startup dependency checks pass before accepting traffic.
- Database migrations have rollback plans.
- Redis and queue monitoring are configured.
- Internal cleanup jobs are scheduled and alerting thresholds are documented.
- Incident response plan exists.
- Dependency review cadence is defined.
- External security review is complete.
