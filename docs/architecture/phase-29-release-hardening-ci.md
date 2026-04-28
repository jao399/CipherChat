# Phase 29 - Release Hardening CI

Phase 29 adds the first project-level CI gate and formalizes the release checklist for production-readiness work.

This phase does not claim CipherChat is production-ready. It makes the current prototype harder to regress and documents the gates that must pass before handling production data.

## What changed

- Added `.github/workflows/ci.yml`.
- Added `npm run validate:ci`.
- CI runs on pushes and pull requests to `master`.
- CI uses disposable PostgreSQL and Redis services.
- CI generates the Prisma client before validation.

## CI gates

`npm run validate:ci` runs:

- app and API typecheck
- app adapter tests
- API route/security tests
- API TypeScript build
- Prisma schema validation
- Expo Doctor
- high-threshold npm audit

The high-threshold audit intentionally allows the current moderate Expo transitive advisories. Running `npm audit fix --force` currently proposes an Expo 49 downgrade, so that is not a safe automatic fix.

## Release gates before production data

CipherChat must not handle production user data until these gates are complete:

- formal threat model
- native development-client SQLCipher verification on Android and iOS
- non-exportable OS-backed key strategy review
- libsignal integration plan and protocol tests
- MLS group messaging design review
- secure backup design
- push notification privacy review
- metadata minimization review
- abuse-prevention design that does not expose message content
- CI integration tests using disposable Postgres and Redis with real persistence enabled
- release build review for Android and iOS

## Next phase

Phase 30 should add API integration tests against disposable Postgres and Redis:

- run Prisma migrations in the test database
- exercise device session persistence
- exercise encrypted envelope persistence
- exercise delivery job enqueue behavior
- keep message plaintext out of server persistence
