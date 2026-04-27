# Phase 8 Auth And Delivery Hardening

Phase 8 strengthens the Phase 7 backend by moving device sessions behind challenge issuance, adding account lifecycle endpoints, adding session revocation, and making delivery pagination stable.

## Added In This Phase

- `DeviceSessionChallenge` Prisma model and migration.
- `POST /v1/accounts` for account metadata creation.
- `GET /v1/accounts/me` for authenticated account metadata lookup.
- `POST /v1/auth/device-challenges` for issuing short-lived device challenges.
- `POST /v1/auth/device-sessions` now requires `challengeId` and `signature`.
- `DELETE /v1/auth/device-sessions/current` for session revocation.
- Stable `(queuedAt, id)` seek pagination for encrypted-envelope fetch.
- Envelope expiry repository hook for future scheduled cleanup jobs.
- Explicit signature verifier interface.
- `RejectingDeviceSignatureVerifier` as the safe default.
- `InsecureDevelopmentSignatureVerifier` only when `ALLOW_INSECURE_DEV_SIGNATURES=true`.

## Important Security Boundary

This phase does not invent production cryptography. The API defines where signed device challenges must be verified, but production verification must be backed by the selected audited cryptographic library and device identity-key design.

By default, the server rejects challenge signatures. The local development verifier accepts `dev:<challenge>` only when explicitly enabled with:

```bash
ALLOW_INSECURE_DEV_SIGNATURES=true
```

Do not enable that flag in production.

## Device Session Flow

1. Account metadata is created.
2. Device publishes public identity/prekey bundle metadata.
3. Client requests a device challenge.
4. Client signs the challenge with its device identity key.
5. API verifies the signature through the configured verifier.
6. API creates a hashed-token device session.
7. Client sends/fetches/acks encrypted envelopes using `Authorization: Bearer <token>`.
8. Client can revoke the current session.

## Delivery Pagination

`GET /v1/messages/envelopes?limit=...&cursor=...` returns:

- `envelopes`: encrypted envelopes scoped to the authenticated recipient device
- `nextCursor`: opaque cursor for the next page when more queued envelopes exist

The cursor is based on `(queuedAt, id)` instead of Prisma's unique cursor mechanism because fetched rows are immediately moved from `QUEUED` to `DELIVERED`.

## What Still Remains

- Replace the development verifier with real `libsignal`/identity-key signature verification.
- Add Redis-backed or database-backed rate limits.
- Add background jobs for expiry, cleanup, push fanout, and retry.
- Add recipient-device fanout instead of single-recipient-device writes.
- Add account recovery and device revocation UX/API.
- Add proper integration tests against a disposable Postgres database in CI.
