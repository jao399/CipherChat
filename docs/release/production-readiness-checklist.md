# CipherChat Production Readiness Checklist

CipherChat is still a prototype. This checklist defines the minimum gates before any production user data is handled.

## Build and CI

- `npm run validate:ci` passes.
- GitHub Actions CI passes on `master`.
- `npm run verify:dev-build-config` passes.
- Android development client validates SQLCipher adapter status.
- iOS development client validates SQLCipher adapter status.
- Release builds are generated and smoke-tested.

## Cryptography

- Formal threat model is complete.
- No custom message cryptography is introduced.
- One-to-one messaging uses a reviewed Signal/X3DH + Double Ratchet implementation.
- Group messaging uses MLS or a reviewed MLS implementation strategy.
- Key verification UX handles new, trusted, changed, and revoked identities.
- Key rotation behavior is documented and tested.

## Local Security

- Database key is provisioned through OS secure storage.
- SQLCipher encrypted database reports `encrypted=true` on Android and iOS.
- Prototype AsyncStorage stores are migrated only after encrypted database verification.
- Source AsyncStorage deletion has rollback and backup policy.
- Plaintext message cache is blocked unless encrypted database is active.
- Device identity private keys move toward non-exportable Keychain/Keystore usage where possible.

## Server Security

- Server stores encrypted envelopes only.
- Server never receives plaintext message bodies.
- Server audit logs avoid message content, filenames, and private contact details.
- Abuse prevention is designed without breaking message privacy.
- Rate limits and queue limits are configured per environment.

## Privacy

- Push notifications contain opaque event IDs only.
- Metadata minimization review is complete.
- Secure backup design is complete.
- Account recovery design is complete.
- Privacy policy and data retention policy are written.

## Operations

- Production secrets are stored outside source control.
- Database migrations have rollback plans.
- Redis and queue monitoring are configured.
- Incident response plan exists.
- Dependency review cadence is defined.
