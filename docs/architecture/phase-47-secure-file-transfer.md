# Phase 47: Secure File Encryption and Transfer Boundary

Phase 47 adds the production-shaped secure file transfer provider.

## What Changed

- Added `src/services/files/secureFileTransferProvider.ts`.
- Added tests for encrypted upload/download flow.
- Added a local file crypto adapter contract.
- Added an encrypted object transfer adapter contract.
- The upload flow now requires client-side file encryption before object upload.
- The download flow requires encrypted bytes to be fetched before local decrypt.

## Upload Flow

The provider enforces this order:

1. validate local file input
2. require `FileCryptoAdapter.productionReady=true`
3. encrypt file bytes locally
4. request an encrypted upload session
5. upload encrypted bytes only
6. complete upload with encrypted metadata only

Plain file bytes, plaintext filenames, and plaintext MIME types must not go to the API or object storage.

## Download Flow

The provider enforces this order:

1. require production-ready file crypto
2. download encrypted bytes by descriptor/object reference
3. decrypt locally
4. return plaintext only to the local caller

## Current Runtime Status

This phase adds the secure boundary and tests. A production app still needs a reviewed native/file crypto adapter and object storage adapter before enabling real transfers from the UI.

## Validation

Run:

```bash
npm run app:test
npm run typecheck
```

The tests verify:

- upload is blocked without production-ready file crypto
- only encrypted bytes reach the object transfer adapter
- completed metadata uses encrypted filename/MIME fields
- download fetches encrypted bytes before local decrypt

## Next Phase

Phase 48 adds push notification privacy and delivery integration.
