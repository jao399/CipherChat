# Phase 11 Device Identity Boundary

Phase 11 moved CipherChat away from hardcoded prototype key strings in the app flow and introduced a replaceable mobile device-identity provider. Phase 13 upgrades that provider to Ed25519 challenge signing.

## What Changed

- Added `expo-crypto` for native secure random bytes and SHA-256 fingerprints.
- Added `@noble/curves` / `@noble/hashes` for audited JavaScript Ed25519 signing in the Expo app.
- Added `src/security/deviceIdentityProvider.ts`.
- Device identity is created once and reused across app launches.
- Public device identity metadata is stored in AsyncStorage.
- The Ed25519 private signing key is stored in `expo-secure-store`.
- Device Verification publishes the provider-generated bundle instead of ad hoc strings.
- Challenge signing is centralized behind `signDeviceChallenge`.
- Settings exposes a Device Identity row with the local fingerprint and a rotate action.

## Current Provider

The current provider is named `ed25519-noble-v1`.

It creates:

- Stable prototype `accountId`
- Stable prototype `deviceId`
- Device display name
- Ed25519 public identity key in API-compatible SPKI format
- Signed prekey placeholder
- Signed prekey signature placeholder
- One-time prekey placeholder
- Human-readable SHA-256 fingerprint
- SecureStore-protected Ed25519 private signing key

The generated Ed25519 key is now a real signing key for device challenge authentication. It is still not a full Signal identity bundle, not an X3DH/Double Ratchet implementation, and not sufficient for production encrypted messaging.

## Challenge Signing

The provider now returns an API-compatible Ed25519 signature:

```text
ed25519:<base64 signature>
```

The API accepts it when running with:

```bash
DEVICE_SIGNATURE_VERIFIER=ed25519
```

The API safe default still rejects all signatures unless a verifier is explicitly configured.

## Why This Boundary Matters

Screens and navigation no longer know how identity material is made. They ask the backend provider to prepare a session. The backend provider asks the device identity provider for:

1. The local device identity.
2. A publishable public device bundle.
3. A challenge signature.

That keeps future work focused:

- Swap `prototypeDeviceIdentityProvider` for a `libsignalDeviceIdentityProvider`.
- Keep `BackendProvider` and screen navigation mostly unchanged.
- Move private-key handling into one audited module.
- Add explicit tests around identity persistence, rotation, and signing.

## Production Replacement Requirements

Before production data:

- Move from exportable SecureStore-held keys to non-exportable Android Keystore / iOS Keychain keys where possible.
- Use Signal-compatible identity, signed prekey, and one-time prekey semantics.
- Sign challenges with the device identity private key.
- Verify signatures server-side using the registered public identity key.
- Rotate prekeys independently from long-term identity keys.
- Add key-change warnings and safety-number verification in the mobile UI.
- Treat identity rotation as a high-friction security event, not a casual settings action.
