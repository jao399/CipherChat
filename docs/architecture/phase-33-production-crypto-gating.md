# Phase 33 - Production Crypto Provider Gating

Phase 33 blocks live message sends while CipherChat is still using prototype-only envelope preparation.

The app can still use mock mode for UI and flow testing, but live API sends now require a production-ready message crypto provider before any outbound fanout is prepared.

## What changed

- Added `src/security/messageCryptoPolicy.ts`.
- Added `src/security/messageCryptoPolicy.test.ts`.
- Exported message crypto readiness helpers from `src/security/index.ts`.
- Updated `BackendProvider` to block live sends and live retries before preparing prototype fanout data.
- Added Settings visibility for the active message crypto provider.
- Updated the threat model, security acceptance criteria, production readiness checklist, and README.

## Current provider

The active provider is:

```text
prototype-sha256-envelope-v1
```

It is mock-ready but not production-ready.

This provider is only a UI/backend integration placeholder. It is not Signal, not Double Ratchet, and not production encryption.

## Runtime behavior

- Mock mode can still prepare and queue prototype envelope fanout.
- Live mode throws before prototype envelope preparation.
- Live retry also throws before reusing prototype fanout.
- Settings shows Message Crypto readiness so testers can see why production sends are blocked.

## Tests

`npm run app:test` now verifies:

- prototype crypto is allowed in mock mode
- prototype crypto is blocked in live mode
- the active provider is marked not production-ready
- the policy can allow live sends once a future reviewed provider is wired

## Next phase

Phase 34 adds a production crypto provider interface.

More detail: `docs/architecture/phase-34-message-encryption-provider.md`.
