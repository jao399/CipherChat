# Phase 45: Encrypted Local Message Database Migration

Phase 45 extends the SQLCipher migration harness to include local message records.

## What Changed

- `collectPrototypeStoreMigrationItems` now collects `localMessages`.
- `migratePrototypeStoresToEncryptedDatabase` writes local messages as encrypted local `message` records.
- Migration counts now include:
  - local message records
  - remote trust records
  - outbound queue items
  - inbound receipts
- Settings > Development Migration now previews and reports message records.
- The encrypted database readiness plan now counts prototype message records as a required migration item.

## Safety Model

The migration still follows the existing guarded behavior:

- skipped by default unless explicitly enabled
- blocked unless the encrypted database initializes and reports `encrypted=true`
- source prototype data is copied, not deleted
- all writes run through the encrypted database transaction boundary

This keeps the current UI prototype usable while preparing for production message persistence.

## Current Limit

The migrated message records are still prototype/mock display records. They are not the output of a real Signal Double Ratchet decrypt path yet. Production message storage must wait until:

- the Signal provider has a reviewed native adapter
- inbound decrypt writes only through SQLCipher
- plaintext lifecycle controls prevent AsyncStorage or logs from receiving message bodies

## Validation

Run:

```bash
npm run app:test
npm run typecheck
```

The migration tests verify that `message`, `remoteTrustRecord`, `outboundEnvelope`, and `inboundReceipt` records are copied through one encrypted database transaction.

## Next Phase

Phase 46 builds the production send/receive flow around the real crypto provider boundary.
