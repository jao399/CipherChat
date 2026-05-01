# Phase 73 - Runtime SQLCipher Evidence Workflow

Phase 73 makes SQLCipher runtime verification easier to repeat without pretending local configuration is device evidence.

## What Changed

- `src/services/local/sqlCipherRuntimeVerification.ts` runs a focused runtime check through the encrypted local database port.
- Settings now includes a development-only `SQLCipher Runtime Check` action.
- `scripts/collect-sqlcipher-evidence.mjs` summarizes static project configuration and prints manual Android/iOS runtime evidence steps.
- Release evidence documents now point reviewers to the in-app verification action.

## Runtime Check

The in-app check:

1. initializes the encrypted database adapter,
2. applies schema v1 through the existing OP-SQLite boundary,
3. writes a harmless `deviceMetadata` verification record,
4. reads that record back,
5. confirms `encrypted=true`,
6. deletes the verification record.

The record contains only a fixed non-sensitive marker. It does not contain message text, file content, filenames, contact graph data, private keys, tokens, safety numbers, or decrypted identifiers.

## Production Status

Android and iOS runtime evidence remain blocking until screenshots or logs are captured from installed development clients for the exact build under review. CI checks placeholders and configuration only.

