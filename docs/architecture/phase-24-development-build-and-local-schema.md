# Phase 24 - Development Build and Local Schema v1

Phase 24 prepares CipherChat for native mobile security work without installing the encrypted database adapter yet. The app can still run as a UI/API prototype, but the repository now has the build metadata and schema contract needed for the SQLCipher-backed local database phase.

## What changed

- Added `expo-dev-client` so CipherChat can run in Expo development builds.
- Added `eas.json` with development, preview, and production build profiles.
- Added stable native identifiers in `app.json`:
  - iOS bundle identifier: `com.amgadalzomi.cipherchat`
  - Android package: `com.amgadalzomi.cipherchat`
  - deep-link scheme: `cipherchat`
- Added encrypted local database schema v1 as typed TypeScript metadata.
- Settings now reports the encrypted local database as `Schema v1 planned`.

## EAS profiles

The development profile creates an internal development-client build and defaults to mock API mode:

- Android: internal APK.
- iOS: simulator build.
- Runtime: development client, not Expo Go.

The preview profile is for internal QA builds. The production profile is reserved for release-grade builds and uses live API mode.

## Local encrypted database schema v1

Schema v1 is defined in `src/services/local/encryptedDatabaseSchema.ts`.

Tables:

- `metadata` for migration state and local feature flags.
- `messages` for encrypted message records after protocol decryption.
- `outbound_envelopes` for durable encrypted send queue state.
- `inbound_receipts` for envelope sync, acknowledgement, and receipt state.
- `remote_trust_records` for device trust and key-change warning state.
- `ratchet_sessions` for future Signal/MLS protocol state.
- `file_metadata` for encrypted file transfer metadata.

Most user-sensitive tables require a `payload_ciphertext` column. That keeps the future adapter contract focused on encrypted payload storage instead of spreading plaintext fields through the schema.

## Security boundary

This phase still does not enable plaintext persistence.

The app must continue to reject message-cache persistence until the encrypted database adapter reports:

- `available=true`
- `encrypted=true`
- schema version compatible with v1

Database keys must be provisioned through OS secure storage and must not appear in AsyncStorage, source control, logs, API payloads, or crash reports.

## Native dependency decision

The current candidate remains SQLCipher-backed SQLite through OP-SQLite in an Expo development build.

Before installation:

1. Confirm current Expo SDK compatibility.
2. Confirm SQLCipher support on Android and iOS.
3. Add a development-build smoke test.
4. Add database-open tests for wrong-key and migration behavior.
5. Review licensing and release-build implications.

## Next phase

Phase 25 should add the native encrypted database adapter spike behind the existing port:

- install and configure the SQLCipher-capable SQLite dependency
- open an encrypted database with a SecureStore-provisioned key
- report real adapter status through `EncryptedLocalDatabasePort`
- add migration tests for schema v1
- keep existing AsyncStorage prototype stores until the adapter is verified
