# Phase 12 Production Signature Verifier

Phase 12 adds the first production-shaped device challenge verifier to the API. The backend can now verify Ed25519 signatures over device-session challenges using Node's built-in crypto implementation.

This does not make the mobile app production-encrypted yet. Phase 13 adds the matching mobile Ed25519 signing provider, while Signal/MLS message encryption remains future work. The important Phase 12 change is that the API has a real verifier path and tests for the expected production signature format.

## Verifier Modes

The API signature verifier is selected at startup:

- Safe default: `RejectingDeviceSignatureVerifier`
- Local development: `ALLOW_INSECURE_DEV_SIGNATURES=true`
- Production-shaped verifier: `DEVICE_SIGNATURE_VERIFIER=ed25519`

The insecure development verifier still takes priority when `ALLOW_INSECURE_DEV_SIGNATURES=true` is set. That keeps local mobile smoke tests working, but it must not be enabled outside local development.

## Ed25519 Format

The Ed25519 verifier expects:

```text
identityKey = ed25519-spki:<base64 DER SPKI public key>
signature   = ed25519:<base64 Ed25519 signature>
payload     = UTF-8 challenge string issued by /v1/auth/device-challenges
```

The server verifies:

1. The device exists and belongs to the requested account.
2. The challenge exists, is unexpired, and is unconsumed.
3. The stored `identityKey` has the Ed25519 SPKI prefix.
4. The submitted signature has the Ed25519 signature prefix.
5. Node crypto verifies the signature over the exact challenge bytes.

Malformed keys, malformed signatures, wrong challenges, and wrong keys all fail closed.

## Files

- `apps/api/src/auth/signatureVerifier.ts`
- `apps/api/src/auth/signatureVerifier.test.ts`
- `apps/api/src/server.ts`

## Why This Matters

Before this phase, production mode could only reject signatures. That was secure as a default, but it did not give the backend an implementation path for real device sessions. Phase 12 creates that path while keeping the unsafe local verifier explicitly gated.

The mobile app now follows this path through the Phase 13 provider:

1. Generate a real Ed25519 device signing key on the device.
2. Store the private key in SecureStore for this prototype phase.
3. Publish `ed25519-spki:<public key>` as the device identity key.
4. Sign challenges with the private key.
5. Disable `ALLOW_INSECURE_DEV_SIGNATURES`.
6. Run the API with `DEVICE_SIGNATURE_VERIFIER=ed25519`.

## Remaining Production Work

- Move from SecureStore-held exportable keys to non-exportable OS-backed keys where possible.
- Decide whether identity signing keys are pure Ed25519 or part of the selected Signal-compatible key strategy.
- Add key rotation and key-change warning semantics.
- Add integration tests that run the full API against disposable Postgres with Ed25519 signatures.
- Add abuse controls around challenge creation to prevent device-auth probing.
