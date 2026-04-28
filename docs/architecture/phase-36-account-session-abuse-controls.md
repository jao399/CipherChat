# Phase 36 - Account and Session Abuse Controls

Phase 36 adds the first explicit API abuse-control policy layer.

The API already had a global rate limiter. This phase makes sensitive routes policy-aware and adds envelope fanout and payload caps so abuse controls are named, tested, and visible in release gates.

## What changed

- Added `apps/api/src/security/abusePolicy.ts`.
- Updated `apps/api/src/middleware/rateLimit.ts` to apply route-aware policies.
- Updated encrypted envelope schemas with fanout and payload caps.
- Added route tests for account creation throttling, fanout recipient caps, and envelope payload caps.
- Added `scripts/verify-abuse-controls.mjs`.
- Added `npm run verify:abuse-controls`.
- Added the abuse-control gate to `npm run validate:ci`.

## Route-aware rate limiting

Route-aware rate limiting now covers:

- `POST /v1/accounts`
- `POST /v1/auth/device-challenges`
- `POST /v1/auth/device-sessions`
- `GET /v1/accounts/discover`
- `POST /v1/messages/envelopes/fanout`

The key includes the policy id, request IP, and authorization header when present. This keeps account creation abuse separate from delivery fanout abuse and avoids one noisy route consuming the entire global budget.

## Envelope abuse policy

The envelope policy currently limits:

- fanout recipient devices per request
- encrypted header ciphertext size
- encrypted body ciphertext size

These are ciphertext and metadata limits only. They do not inspect or decrypt message content.

## Tests

`npm run api:test` verifies:

- repeated account creation attempts are throttled
- oversized fanout recipient lists are rejected before persistence
- oversized encrypted envelope payloads are rejected before persistence

## Release gate

`npm run verify:abuse-controls` checks that:

- the abuse policy exists
- route-aware rate limiting is still wired
- abuse-control route tests are still present
- this phase documentation remains present

## Follow-up

Phase 37 added metadata retention and cleanup policy in `docs/architecture/phase-37-metadata-retention-cleanup.md`.
