# Phase 87 - Native Non-Exportable Key Provider Plan

## Purpose

Phase 87 prepares CipherChat for a future production native device-authentication signing provider. It improves the interface, readiness evaluation, tests, Settings visibility, and release documentation without claiming that production non-exportable key storage is implemented.

## Current Prototype State

CipherChat currently uses a prototype Ed25519 device identity flow backed by Expo SecureStore. That keeps private signing bytes out of AsyncStorage and supports the demo device-verification flow, but it is still a JavaScript-accessible signing-store boundary.

## Why SecureStore Prototype Keys Are Not Enough For Production

SecureStore prototype keys are not enough for production because the app has not proven that private key bytes are generated inside native non-exportable storage, remain unavailable to JavaScript, and can only be used for public-key export plus challenge signing. SecureStore prototype evidence must not be treated as Android Keystore, iOS Keychain, or Secure Enclave production evidence.

## Android Keystore Target Behavior

A production Android provider should generate signing keys in Android Keystore where private key material is non-exportable, expose public key export only, sign challenges without returning private bytes to JavaScript, support rotation and revocation, and include runtime evidence from release-like Android builds.

## iOS Keychain / Secure Enclave Target Behavior

A production iOS provider should use iOS Keychain access controls or Secure Enclave where the selected algorithm and device class support it. It must prove that private key material is not exportable to JavaScript, expose only the public key, sign challenges natively, and include real iPhone/TestFlight runtime evidence.

## React Native / Expo Build Requirement

The production provider requires a React Native native module inside an Expo development build or release build. Expo Go and web cannot prove native non-exportable signing-key behavior.

## Provider Interface Summary

The Phase 87 provider descriptor tracks:

- provider id,
- platform support for Android, iOS, web, or unavailable,
- production readiness,
- evidence status,
- key protection level,
- key generation support,
- public-key-only export behavior,
- challenge signing support,
- private-key exportability,
- native build requirement,
- rotation and revocation support,
- required evidence,
- limitations.

## Required Runtime Evidence

Production readiness remains blocked until evidence shows:

- reviewed native implementation,
- Android Keystore or iOS Keychain/Secure Enclave non-exportable private-key behavior,
- public-key-only export,
- challenge signing without exposing private key bytes to JavaScript,
- runtime evidence from release-like Android and iOS builds,
- rotation and revocation behavior,
- no private keys, safety numbers, or tokens in logs.

## Test Strategy

Phase 87 adds unit tests for the provider descriptor and readiness evaluator. Tests prove default production readiness is blocked, SecureStore remains demo-only, exportable keys are blocked, missing evidence is blocked, and reviewed Android/iOS non-exportable providers can evaluate as ready only when evidence is complete.

## Integration Plan

1. Select or build a reviewed native signing provider for Android Keystore and iOS Keychain/Secure Enclave.
2. Keep private key operations inside native code.
3. Expose only public key export, challenge signing, rotation, revocation, and evidence reporting to JavaScript.
4. Connect the provider behind `src/security/nativeSigningKeyProvider.ts`.
5. Run Settings evidence checks on release-like Android and iOS builds.
6. Attach external review and runtime evidence before changing production readiness to ready.

## Remaining Blockers

- Reviewed native Android Keystore provider is not installed.
- Reviewed native iOS Keychain/Secure Enclave provider is not installed.
- Runtime evidence for native non-exportability is missing.
- External security review is missing.
- Production Signal/libsignal support remains blocked separately.

## What Must Not Be Claimed Yet

CipherChat must not claim production non-exportable signing-key support, production-ready encrypted messaging, or Signal/libsignal production support until reviewed native adapters and runtime evidence are attached.
