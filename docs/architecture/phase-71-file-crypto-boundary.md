# Phase 71 - File Crypto Boundary

CipherChat now has an explicit production boundary for secure file encryption. This phase does not implement custom cryptography and does not make file transfer production-ready.

## What Changed

- `src/security/fileCryptoPolicy.ts` defines the production readiness policy for file encryption adapters.
- `src/services/files/fileEncryptionProvider.ts` defines the future adapter contract for client-side file byte encryption and encrypted file metadata.
- `src/services/files/secureFileTransferProvider.ts` now uses the file encryption provider boundary before upload or download.
- Tests prove secure file transfer stays blocked by default and requires encrypted filenames and MIME types.

## Production Policy

A file encryption adapter is eligible only when it declares:

- production-ready status,
- reviewed implementation status,
- client-side file byte encryption,
- encrypted filenames and MIME types,
- a reviewed authenticated encryption algorithm from the allowed contract.

If any item is missing, secure file transfer remains fail-closed for production.

## Security Notes

- The prototype/mock file transfer UI remains demo-only.
- No plaintext file content is persisted as if encrypted by this boundary.
- No homemade file encryption was added.
- A reviewed native or well-audited file crypto adapter is still required before production file transfer.

