# Phase 74 - Native Signing Key Boundary

Phase 74 adds a future-safe boundary for production device-authentication signing keys. It does not replace the current prototype SecureStore-backed Ed25519 implementation.

## What Changed

- `src/security/nativeSigningKeyProvider.ts` defines the native signing key provider contract and readiness policy.
- The default native provider is blocked and reports that no reviewed implementation is installed.
- SecureStore-backed prototype signing keys are explicitly marked as not production non-exportable evidence.
- Settings now reports the native signing key provider readiness state.
- Tests prove production readiness is blocked by default and that SecureStore-held JavaScript-readable private bytes do not satisfy the production requirement.

## Required Production Provider

A production provider must support:

- provider identity and production-readiness metadata,
- key generation in native non-exportable storage,
- public key export only,
- challenge signing without exposing private key bytes to JavaScript,
- key rotation and revocation,
- reviewed implementation evidence,
- runtime device evidence.

## Production Status

The production blocker remains open until a reviewed Android Keystore/iOS Keychain or Secure Enclave provider is installed, tested, and externally reviewed. The current SecureStore boundary remains acceptable for demo and development only.

