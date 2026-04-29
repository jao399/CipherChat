# Phase 57 - One-Time Prekey Claiming

Phase 57 adds a future-ready prekey consumption path for Signal-style asynchronous session setup.

## Backend

- `POST /v1/devices/bundles/:accountId/:deviceId/claim` requires a verified device session.
- The route returns the recipient public identity key, signed prekey, signed prekey signature, and at most one one-time prekey.
- When a one-time prekey is available, it is removed from the stored bundle inside the same database transaction.
- Claims create metadata-only `device_bundle.one_time_prekey_claimed` audit events with remaining prekey count only.

## Why This Matters

One-time prekeys must not be treated as endlessly reusable public metadata. Real Signal-style X3DH setup consumes a one-time prekey when one is available, which improves asynchronous session setup and limits prekey reuse.

## Privacy Boundary

The claim event does not log prekey values, identity keys, signed prekeys, safety numbers, sender identity, message content, filenames, push tokens, or contact graph details.

## Remaining Work

- Integrate this claim endpoint into the reviewed Signal/libsignal-compatible message provider.
- Add prekey top-up and low-watermark alerts for active devices.
- Add abuse limits for high-rate prekey claims before production rollout.
