# ADR 0001: Mobile Runtime

## Status

Accepted

## Decision

Keep Expo React Native TypeScript for CipherChat, but require Expo development builds before adding native cryptography, SQLCipher-backed database modules, or custom Keychain/Keystore wrappers.

## Context

The current UI prototype is Expo-based and runs correctly in Expo Go. Real encrypted messaging will require native modules for secure storage, encrypted databases, and possibly crypto protocol bindings.

## Consequences

- UI work can continue in Expo.
- Production security work must move to development builds.
- Native dependencies must be introduced through config plugins or generated native projects.
- Expo Go remains useful for UI-only work, not secure protocol implementation.
