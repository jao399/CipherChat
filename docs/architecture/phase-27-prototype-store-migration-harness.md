# Phase 27 - Prototype Store Migration Harness

Phase 27 adds a disabled-by-default migration harness for moving prototype AsyncStorage state into the encrypted local database.

This phase does not delete source AsyncStorage data and does not automatically run migration on app startup. It creates the controlled copy path that later phases can enable only after SQLCipher is verified in a development build.

## What changed

- Added `src/services/local/prototypeStoreMigration.ts`.
- Added tests in `src/services/local/prototypeStoreMigration.test.ts`.
- Exported migration helpers from `src/services/local/index.ts`.
- Runtime AsyncStorage readers are lazy-loaded so Node tests do not import React Native modules.

## Migrated record groups

The harness collects:

- remote trust records as `remoteTrustRecord`
- outbound envelope queue items as `outboundEnvelope`
- inbound delivery receipt metadata as `inboundReceipt`

Records are copied through `EncryptedLocalDatabasePort.transaction()` so the migration can later run as a single database operation.

## Safety gates

The migration is intentionally conservative:

- skipped by default unless `enabled: true`
- blocked unless the encrypted database reports `available=true`
- blocked unless the encrypted database reports `encrypted=true`
- does not remove source AsyncStorage data
- does not migrate plaintext message cache
- does not run automatically from app startup or Settings

## Test coverage

`npm run app:test` now verifies:

- the harness collects all three prototype store groups
- migration is skipped by default
- migration is blocked when encrypted storage is unavailable
- collected records are written through one encrypted database transaction when explicitly enabled

## Next phase

Phase 28 should add the explicit app-side migration control surface:

- Settings status row for migration readiness
- manual migration action hidden behind development-only controls
- migration result summary
- no source deletion until a separate backup/rollback policy exists
