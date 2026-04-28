# Phase 26 - Encrypted Database Verification

Phase 26 adds automated verification around the encrypted local database adapter.

The adapter still needs a real Expo development build to prove SQLCipher on-device behavior, but the repository now has fast Node-side tests for the adapter logic that can run in CI and on every local change.

## What changed

- Split the OP-SQLite adapter into:
  - `opSQLiteEncryptedLocalDatabaseCore.ts` for testable adapter logic
  - `opSQLiteEncryptedLocalDatabase.ts` for the Expo wrapper and SecureStore key provisioning
- Added `buildEncryptedDatabaseSchemaStatements()` for schema assertion.
- Added app-level tests with `tsx --test`.
- Added root scripts:
  - `npm run app:test`
  - `npm test`

## Automated coverage

`src/services/local/opSQLiteEncryptedLocalDatabaseCore.test.ts` verifies:

- schema v1 creates the expected tables and indexes
- non-SQLCipher native builds report unavailable
- schema v1 initializes and can round-trip an opaque encrypted local record
- database open failures, including wrong-key style errors, do not mark encrypted storage available

These tests use a mock OP-SQLite module and database executor. They do not claim that a device database file is encrypted. That must still be verified in a development build.

## Local native verification status

Native verification was checked during this phase:

- `adb` is not available in PATH in this workspace.
- The repo does not currently include generated `android/` or `ios/` folders.
- A local emulator install test cannot run until Android platform tooling is available.

The app still passes Metro Android bundle verification, which confirms the lazy native adapter import does not break bundling.

## Required device-build verification

Before migrating real prototype stores into the encrypted database:

1. Install Android platform tools so `adb devices` works.
2. Generate or build an Expo development client:
   - `npx expo run:android`, or
   - `eas build --profile development --platform android`
3. Install the build on an emulator or physical device.
4. Open Settings and tap `Encrypted Local Database`.
5. Confirm the row reports `Available - schema v1`.
6. Close and reopen the app, then confirm database state survives restart.
7. Add an instrumentation test that opens with the wrong key and confirms failure.

## Next phase

Phase 27 adds the disabled-by-default migration harness from prototype AsyncStorage stores into the encrypted database:

- remote trust records
- outbound envelope queue
- inbound receipt metadata

The migration should remain disabled until native development-build verification confirms SQLCipher is active.
