# Phase 69 - Auth And Signal Identity Split

Phase 69 separates device authentication identity from Signal/X3DH messaging identity.

## What changed

- Device bundle publication now accepts optional `authIdentityKey` and `signalIdentityKey`.
- `Device.identityKey` remains the device-session authentication public key used for challenge verification.
- `PrekeyBundle.signalIdentityKey` stores the Signal/X3DH public identity key used for messaging session setup.
- Public bundle lookup, prekey claim, and account discovery return `identityKey` as the Signal identity alias and also include `signalIdentityKey` explicitly.
- Legacy prototype requests that only send `identityKey` still work by using the same value for both auth and messaging identity.
- The mobile live publication helper now sends the local Ed25519 auth identity separately from generated Signal prekey material.

## Why this matters

A real encrypted messenger cannot overload one key field for both account-device authentication and Signal/X3DH identity semantics. Device-session signatures need an authentication key, while senders need the recipient's Signal identity and prekey material for session setup.

## Compatibility

The change is backward-compatible for existing prototype data:

- If `authIdentityKey` is omitted, the server uses `identityKey` for device authentication.
- If `signalIdentityKey` is omitted, public discovery falls back to the stored device authentication identity.
- New live clients should always send both fields once the reviewed native Signal adapter is installed.

## Remaining production blocker

The server still validates only transport shape, not cryptographic proof that the Signal signed prekey was signed by the Signal identity key. That verification belongs in the reviewed native Signal/libsignal integration and client trust workflow before production launch.
