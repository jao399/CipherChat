# Phase 32 - Threat Model and Security Acceptance Criteria

Phase 32 adds the first formal production security gate for CipherChat.

## What changed

- Added `CipherChat-threat-model.md`.
- Added `docs/security/security-acceptance-criteria.md`.
- Added `scripts/verify-security-docs.mjs`.
- Added root script `npm run verify:security-docs`.
- Added the security documentation gate to `npm run validate:ci`.

## Security posture

The threat model is repo-grounded and covers:

- mobile app trust boundaries
- Fastify API entry points
- device-session and Ed25519 challenge authentication
- encrypted envelope fanout and delivery
- PostgreSQL and Redis persistence surfaces
- local SecureStore, AsyncStorage, and SQLCipher migration boundaries
- CI, EAS, and build-chain risks

## Acceptance criteria

The security acceptance criteria define blockers before CipherChat can process production user message content:

- real reviewed one-to-one cryptography
- group crypto strategy
- native encrypted local database verification
- key-change warning gates
- metadata minimization
- abuse prevention
- production secret handling
- CI and release evidence

## CI behavior

`npm run validate:ci` now includes `npm run verify:security-docs`.

The check is intentionally lightweight. It prevents accidental removal of the core threat model and acceptance criteria sections while keeping the repo fast to validate.

## Next phase

Phase 33 should add production-mode crypto provider gating:

- block live sends when the active crypto provider is prototype-only
- expose crypto readiness in Settings
- add tests that production mode cannot use prototype envelope preparation
