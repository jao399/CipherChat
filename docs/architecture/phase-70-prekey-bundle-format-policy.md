# Phase 70 - Prekey Bundle Format Policy

Phase 70 adds explicit backend policy for public prekey bundle formats.

## What changed

- `PrekeyBundle.format` records whether stored public prekey material is `prototype-v1` or `signal-x3dh-v1`.
- Device bundle publication accepts optional `prekeyBundleFormat`.
- Legacy prototype bundles default to `prototype-v1`.
- Declared `signal-x3dh-v1` bundles must use the expected Signal identity, signed prekey, signed prekey signature, and one-time prekey string shapes before storage.
- Public bundle lookup, prekey claim, and account discovery return `prekeyBundleFormat`.
- Current-device prekey top-up validates incoming one-time prekeys against the stored bundle format.
- Malformed declared Signal bundles return `400 invalid_prekey_bundle_format` instead of being stored.

## Security boundary

This is still not cryptographic verification. The backend cannot prove a signed prekey signature is valid or that a client owns a Signal identity key. It only prevents malformed or prototype-shaped values from being stored under a production Signal format label.

## Why this matters

The future native Signal/libsignal adapter needs a precise storage contract. Without a format field, prototype and production-shaped key material are indistinguishable once stored and discovered.
