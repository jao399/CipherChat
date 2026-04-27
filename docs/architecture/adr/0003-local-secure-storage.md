# ADR 0003: Local Secure Storage

## Status

Accepted

## Decision

Use OS secure storage for small secrets and SQLCipher-backed SQLite for encrypted local data. AsyncStorage is limited to non-sensitive prototype state such as onboarding completion.

## Context

The prototype currently uses AsyncStorage for onboarding only. Future production state includes message plaintext cache, session state, verification records, local database keys, and identity material.

## Consequences

- AsyncStorage must not store private keys, database keys, access tokens, recovery secrets, or session state.
- `expo-secure-store` is acceptable for early small-secret work.
- Production may require a stricter native wrapper for hardware-backed or non-exportable key requirements.
- Encrypted local database work requires a development build.
