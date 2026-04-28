# Phase 23 - Encrypted Local Database Boundary

## Status

Phase 23 defines the encrypted local database boundary and migration plan. It does not install a native database or pretend that local encrypted storage exists. The app now has a typed port, migration classification, and readiness metadata so future implementation can replace AsyncStorage safely.

## What changed

- Added `EncryptedLocalDatabasePort` in `src/services/ports/encryptedLocalDatabase.ts`.
- Added `src/services/local/encryptedDatabasePlan.ts`.
- Classified current local stores by sensitivity and target storage.
- Added migration steps for moving prototype state into a SQLCipher-backed database.
- Added a Settings row that reports the encrypted local database as planned.
- Added a security invariant blocking plaintext persistence until encrypted database status reports `encrypted=true`.

## Target adapter

The current candidate remains:

```text
SQLCipher-backed SQLite via OP-SQLite candidate
```

This requires an Expo development build. Expo Go remains acceptable for UI and API prototype work, but it is not the target runtime for native SQLCipher or custom platform key wrappers.

## Storage classification

AsyncStorage can keep:

- onboarding completion
- other non-sensitive UI prototype state

SecureStore keeps:

- API bearer token
- prototype Ed25519 private signing key
- future local database key or database-key wrapper material

Encrypted local database should receive:

- remote trust records
- outbound encrypted envelope queue
- inbound delivery receipt metadata
- plaintext message cache, only after encryption is active
- Signal/MLS ratchet and group state
- encrypted file metadata

## Migration gates

1. Move to an Expo development build.
2. Provision the database key through OS secure storage.
3. Create encrypted schema v1.
4. Migrate prototype AsyncStorage records idempotently.
5. Enable plaintext message cache only after the database reports `encrypted=true`.

## Security boundary

The code now makes the future local data boundary explicit:

- no plaintext message persistence in AsyncStorage
- no private keys in AsyncStorage
- no access tokens in AsyncStorage
- no database keys in AsyncStorage
- no fake encrypted database adapter

## Next phase

Phase 24 should add development-build preparation and dependency decision work:

- create EAS/development-build notes
- decide OP-SQLite/SQLCipher integration details
- add native dependency checklist
- define local database schema v1 before installing native modules
