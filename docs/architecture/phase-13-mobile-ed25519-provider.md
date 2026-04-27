# Phase 13 Mobile Ed25519 Signing Provider

Phase 13 completes the device-authentication loop between the Expo app and the API. The mobile app now generates a real Ed25519 signing key, publishes the public key in the API verifier format, and signs device-session challenges without using the local `dev:<challenge>` bridge.

## What Changed

- Added `@noble/curves` and `@noble/hashes`.
- Updated `src/security/deviceIdentityProvider.ts`.
- The provider is now `ed25519-noble-v1`.
- The public key is exported as `ed25519-spki:<base64 DER SPKI public key>`.
- The challenge signature is returned as `ed25519:<base64 signature>`.
- The Ed25519 private key is stored in `expo-secure-store`.
- Public identity metadata is stored in AsyncStorage under a v2 key.
- Legacy Phase 11 prototype identity data is cleared during migration.
- `BackendProvider` clears stale stored sessions when the persisted session no longer matches the active local identity.

## Live API Mode

Run the API with:

```bash
docker compose up -d postgres redis
$env:DATABASE_URL="postgresql://cipherchat:cipherchat@localhost:5432/cipherchat?schema=public"
$env:REDIS_URL="redis://localhost:6379"
$env:DEVICE_SIGNATURE_VERIFIER="ed25519"
$env:API_HOST="0.0.0.0"
npm run prisma:migrate:deploy
npm run api:dev
```

Then enable Live API Mode in Settings and verify the device. The mobile app should publish an Ed25519 public key, sign the server challenge, receive a session token, and store the token in SecureStore.

## Security Notes

This is a real Ed25519 challenge-signing path, but it is still not the complete production security model:

- The private key is exportable because `expo-secure-store` stores opaque strings, not non-exportable asymmetric keys.
- The provider does not yet implement Signal identity keys, signed prekey semantics, X3DH, Double Ratchet, or MLS.
- The signed prekey fields are still placeholders for future protocol integration.
- Safety-number verification and key-change warnings are not complete.

The next production hardening step is an Expo development build with native security modules so private signing keys can be generated and used through OS-backed key APIs where possible.

## Validation Target

The Phase 13 validation target is:

1. App typecheck passes.
2. API verifier tests pass.
3. API live Ed25519 smoke test passes against Postgres and Redis.
4. Android Metro bundle compiles.
5. Expo Doctor passes.
