# Phase 28 - Development Migration Control

Phase 28 adds an explicit development-only Settings surface for encrypted database migration readiness and manual copy execution.

This phase still does not run migration automatically and still does not delete source AsyncStorage data.

## What changed

- Added a `Development Migration` section to Settings, visible only when `__DEV__` is true.
- Added `Migration Readiness` to preview the number of prototype records available to copy.
- Added `Copy to Encrypted Database` to run the guarded migration manually.
- Migration results are shown in the Settings row and in an alert.
- Encrypted database status is updated when the migration reports adapter status.

## Control behavior

The readiness action inspects:

- remote trust records
- outbound envelope queue items
- inbound receipt metadata

The copy action calls `migratePrototypeStoresToEncryptedDatabase()` with `enabled: true`.

The migration still blocks unless the encrypted database reports:

- `available=true`
- `encrypted=true`

## Safety boundaries

- Hidden from production builds through `__DEV__`.
- No source AsyncStorage deletion.
- No automatic startup migration.
- No plaintext message cache migration.
- No bypass if SQLCipher is unavailable.

## Next phase

Phase 29 adds a release hardening and CI plan:

- CI commands for typecheck, app tests, API tests, API build, Expo Doctor, and audit
- disposable Postgres/Redis integration test path
- EAS development-build verification checklist
- security release gates before any production data handling
