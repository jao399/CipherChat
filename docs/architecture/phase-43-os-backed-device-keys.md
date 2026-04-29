# Phase 43: OS-Backed Device Private-Key Strategy

Phase 43 tightens the device identity private-key boundary without claiming full production-grade non-exportable Ed25519 keys yet.

## What Changed

- Added `src/security/deviceSigningKeyStore.ts`.
- Moved private-key loading and signing out of `deviceIdentityProvider.ts`.
- The identity provider now receives signatures from a signing-key store instead of directly handling private bytes.
- Public identity metadata now records the private-key protection policy.
- The SecureStore key is configured with a dedicated Keychain service and `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY` where the platform supports it.
- Added `npm run verify:os-backed-key-strategy` and wired it into `npm run validate:ci`.

## Current Strategy

The current Expo-compatible strategy is:

```text
expo-secure-store-os-backed-ed25519-v1
```

This means:

- Android uses Expo SecureStore's Android-backed encrypted storage path.
- iOS uses Keychain-backed storage with this-device-only accessibility where supported.
- The rest of the app receives only public identity metadata and signatures.
- Private key bytes are no longer exposed through the identity provider interface.

## Remaining Production Gap

Expo SecureStore still stores an opaque value that JavaScript can read inside the key-store implementation. That is stronger than AsyncStorage and keeps private bytes out of the app flow, but it is not the final high-security target.

Before production encrypted messaging, this boundary must be replaced with a native provider that:

- generates the device identity key in Android Keystore / iOS Keychain or Secure Enclave where supported
- returns a public key and signs challenges by handle
- never returns private key bytes to JavaScript
- reports hardware-backed / biometric policy metadata
- supports deliberate identity rotation and recovery UX

## Verification

Run:

```bash
npm run verify:os-backed-key-strategy
```

The gate ensures:

- `deviceIdentityProvider.ts` delegates signing to the key store
- the identity provider does not load private bytes directly
- public identity metadata includes private-key protection policy
- the signing-key store uses a device-only SecureStore policy
- the non-exportable native provider remains documented as a production requirement

## Next Phase

Phase 44 adds the real Signal-style one-to-one crypto integration plan and provider implementation boundary.
