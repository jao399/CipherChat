# Phase 59 - Authenticated Prekey Top-Up Publishing

Phase 59 adds a production-shaped path for replenishing one-time prekey inventory without giving the server any private key role.

## Scope

- `POST /v1/devices/prekeys/top-up` requires a verified device session.
- The authenticated session controls the account and device identity. Clients cannot top up another account or another device.
- The request body contains only client-generated public one-time prekeys.
- The response returns metadata-only inventory status: count, low watermark, recommended count, and top-up state.
- Device Management can generate prototype public prekeys locally and publish a bounded top-up batch.

## Security Properties

- The server does not generate identity keys, signed prekeys, one-time prekeys, private keys, session secrets, or ratchet state.
- Audit events store only counts and device identifiers already needed for account/device operations.
- Responses do not expose public prekey values after publishing.
- Topped-up prekeys remain compatible with the transactional claim path from Phase 57 and are consumed at most once.

## Current Prototype Limits

- Mobile prekey generation still uses the prototype provider and is not Signal/libsignal X3DH material.
- Top-up rate limiting is inherited from general API rate limits; endpoint-specific abuse controls are still needed.
- Production crypto must replace `prototype_one_time_prekey` payloads with reviewed prekey bundle formats.

## Verification

- API unit tests cover authenticated current-device routing and response minimization.
- Persistence integration tests publish new public prekeys, claim one, and assert audit logs avoid key material.
- Mobile type checking covers the live client, mock client, backend provider, and Device Management action.

## Next Phase

Add endpoint-specific abuse controls for prekey claim and top-up paths, including Redis-backed rate limits, payload-size limits, and operational counters that do not expose key material.
