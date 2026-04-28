# Phase 25 - Native Encrypted Database Adapter Spike

Phase 25 adds the first real native encrypted local database adapter behind `EncryptedLocalDatabasePort`.

This is still a controlled spike, not a migration of production data. Existing prototype stores remain in place until the adapter is validated on development builds and migration tests are added.

## What changed

- Added `@op-engineering/op-sqlite`.
- Enabled OP-SQLite SQLCipher compilation through root `package.json`:
  - `"op-sqlite": { "sqlcipher": true }`
- Added `src/services/local/opSQLiteEncryptedLocalDatabase.ts`.
- The adapter lazy-loads OP-SQLite so Expo Go and web prototype screens do not crash.
- The adapter provisions a 32-byte database key in `expo-secure-store` under `localDatabaseKey`.
- The adapter opens `cipherchat-secure.db` with `encryptionKey`.
- Schema v1 is applied through the OP-SQLite transaction API.
- Settings can now probe the encrypted local database status.

## Runtime behavior

In Expo Go:

- OP-SQLite native JSI bindings are unavailable.
- The adapter returns `available=false`.
- Settings reports the unavailable reason instead of crashing.

In an Expo development build compiled with SQLCipher:

- `isSQLCipher()` must return true.
- The adapter opens the encrypted database with the SecureStore-provisioned key.
- Schema v1 is created if missing.
- `getStatus()` reports `available=true` and `encrypted=true`.

## Current adapter scope

The adapter currently supports:

- initialization
- close
- status reporting
- generic `get`
- generic `list`
- generic `put`
- generic `delete`
- transaction wrapper for `put` and `delete`

Opaque record payloads are serialized into the schema's encrypted payload columns. This is acceptable for the spike because SQLCipher encrypts the database file. Future protocol phases should store protocol ciphertext and typed query columns separately.

## Security notes

- The database key is generated on device and stored through SecureStore.
- The key is not stored in AsyncStorage.
- The key is not sent to the API.
- The adapter does not log keys or record payloads.
- Existing AsyncStorage prototype stores are not automatically migrated yet.
- Plaintext message persistence remains gated behind `encrypted=true`.

## Validation still required on device builds

The local TypeScript and Metro checks can validate wiring, but SQLCipher behavior must be validated in a real development build:

1. Build Android development client with `eas build --profile development --platform android`.
2. Install the APK on the emulator or physical device.
3. Open Settings and tap `Encrypted Local Database`.
4. Confirm it reports available with schema v1.
5. Reopen the app and confirm records remain readable with the same SecureStore key.
6. Add wrong-key and migration tests before moving any prototype data.

## Next phase

Phase 26 adds adapter verification:

- Node-side adapter core tests
- schema version assertion
- wrong-key failure test
- basic record round-trip test
- documented native development-build verification path
