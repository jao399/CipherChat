# Phase 7 Device Sessions And Delivery APIs

Phase 7 adds the first authenticated backend flow for CipherChat. It is still not a production cryptographic implementation, but it removes anonymous encrypted-envelope writes and introduces account/device-scoped delivery behavior.

## Added In This Phase

- `DeviceSession` Prisma model and migration.
- Hashed bearer session tokens for device-scoped API calls.
- `POST /v1/auth/device-sessions` for creating a temporary device session after a device bundle exists.
- Auth middleware that verifies bearer tokens and attaches the authenticated account/device to the request.
- Protected `POST /v1/messages/envelopes`.
- Recipient-scoped `GET /v1/messages/envelopes?limit=...`.
- Recipient-scoped `POST /v1/messages/envelopes/:messageId/ack`.
- Metadata-only audit events for session creation, envelope queueing, delivery, and acknowledgement.
- Lightweight in-memory rate limiting with no new dependency.

## Security Boundary

Device sessions are a backend application control. They are not a replacement for Signal/MLS cryptographic device authentication. Future production work must replace the simple session issuance flow with signed device assertions and stronger account recovery/session policies.

The server still only handles encrypted payloads:

- message headers are stored as ciphertext
- message bodies are stored as ciphertext
- session tokens are hashed before storage
- audit events avoid plaintext content

## Delivery Flow

1. A device publishes a prekey bundle.
2. The API creates a device session for that account/device pair.
3. A sender device posts an encrypted envelope with its bearer token.
4. The API rejects the send if the bearer token does not match the sender account/device in the envelope.
5. A recipient device fetches queued envelopes with its bearer token.
6. Fetch marks returned envelopes as `DELIVERED`.
7. The recipient device acknowledges a message, marking it `ACKNOWLEDGED`.

## Local Verification

```bash
docker compose up -d postgres
npm run prisma:migrate:deploy
npm run api:test
npm run api:build
```

The live smoke test should prove:

- `/ready` reports `database: "connected"`
- device sessions can be created
- sends require the sender session
- fetches are scoped to the recipient device
- acknowledgements are scoped to the recipient device

## Next Phase

Phase 8 should add production-grade auth and abuse controls:

- account registration/login lifecycle
- signed device-session challenges
- session revocation endpoint
- rate-limit persistence or Redis-backed limits
- delivery pagination cursors
- message expiry cleanup jobs
- recipient-device fanout
- structured server audit review
