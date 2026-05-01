# Phase 79 - Production File Encryption Adapter Plan

CipherChat still does not have a production file encryption adapter. Phase 79 defines the adapter implementation plan and CI documentation gate so a future implementation can be reviewed without weakening the existing fail-closed behavior.

## Authenticated Encryption Only

Production file encryption must use reviewed authenticated encryption only. The current policy allows `AES-256-GCM` and `ChaCha20-Poly1305` as adapter-declared algorithm families. A future adapter must not introduce a homemade cipher, unauthenticated stream, checksum-only integrity check, or compression-before-encryption behavior without formal cryptographic review.

## Per-File Random Keys

Every uploaded file must use a fresh random content-encryption key generated on the client. Keys must be produced by the platform CSPRNG through the reviewed adapter, never derived from filenames, account IDs, message IDs, timestamps, or deterministic hashes. Nonce/IV generation must follow the selected AEAD requirements and must be unique for the key.

## Per-Recipient File Key Wrapping Strategy

The file content key must be wrapped separately for each authorized recipient device using the production message/session key material or a reviewed file-key wrapping primitive. The server may store encrypted key-wrapping records and recipient device IDs needed for delivery, but it must never receive plaintext file keys. Revoked devices must stop receiving new wrapped file keys.

## Encrypted Thumbnails Policy

Generated previews, thumbnails, filenames, MIME types, dimensions, and media metadata are sensitive. Production thumbnails must either be encrypted with the file metadata envelope or disabled. No plaintext thumbnail object may be uploaded to object storage or cached durably outside the verified encrypted database boundary.

## Chunking And Resumable Upload Requirements

Large files need chunking and resumable upload support. Each chunk must have authenticated integrity and ordering metadata. The final descriptor must authenticate the full file manifest, chunk count, byte lengths, and content digest. Resume tokens must not expose filenames, content types, contact graph data, file keys, or decrypted identifiers.

## Integrity And Authentication Requirements

The adapter must authenticate encrypted bytes, encrypted metadata, owner account, intended recipient set, file ID, expiry, and chunk manifest where applicable. The backend should accept encrypted bytes and descriptors only; it must not attempt to parse plaintext file metadata. Download must verify authentication before releasing plaintext to transient UI state.

## Local Encrypted Metadata Requirements

Plaintext filenames, MIME types, thumbnails, and file contents may only exist in transient UI state. Durable file records, previews, transfer queues, retry state, and download cache entries require the encrypted local database to report `encrypted=true`. If encrypted local storage is unavailable, production file transfer must stay blocked.

## Key Rotation And Revocation Limitations

Existing downloaded plaintext cannot be revoked from recipient devices. Rotation can prevent future access by withholding new wrapped keys and by deleting server-side encrypted objects where policy allows. The product must be clear that file revocation is best-effort after a recipient has obtained and decrypted the file.

## Android And iOS Native Dependency Requirements

The adapter must use reviewed native or mature audited cryptographic libraries compatible with Expo development/release builds. Android evidence must cover the tested APK or AAB path. iOS evidence must cover simulator or device runtime with Xcode/EAS. Native dependency versions, platform entropy sources, key wrapping behavior, and failure modes must be documented.

## Test Plan

Required tests before production readiness:

- default provider remains blocked without a reviewed adapter,
- unsupported algorithms are rejected,
- plaintext filenames and MIME types cannot pass as encrypted metadata,
- upload sends only encrypted bytes and encrypted metadata to the backend,
- download authenticates before returning plaintext to UI,
- large-file chunk manifests detect missing, reordered, or modified chunks,
- recipient key wrapping creates per-device wrapped keys only,
- revoked devices do not receive new wrapped keys,
- encrypted database is required before durable plaintext-adjacent transfer state is stored,
- native runtime tests pass on Android and iOS release candidates.

## Abuse And Size-Limit Considerations

The API must enforce object size limits, chunk count limits, upload expiry, fanout caps, rate limits, and retention cleanup without inspecting plaintext content. Logs and audit events may include file IDs, upload IDs, byte counts, expiry, and safe reason codes only. They must not include filenames, MIME types, thumbnails, file keys, recipient contact graph details, tokens, or decrypted identifiers.

## Why Mock File Transfer Cannot Be Production

The current mock/prototype file transfer demonstrates UI flow and policy boundaries only. It does not provide reviewed file content encryption, per-recipient key wrapping, chunk authentication, native runtime evidence, encrypted thumbnails, or production storage guarantees. It must remain labeled as prototype/demo behavior.

## Production Readiness Criteria

Production file transfer can be considered only after:

- a reviewed production-ready file crypto adapter is installed,
- adapter code and native dependencies are reviewed,
- authenticated encryption and metadata encryption are test-covered,
- Android and iOS runtime evidence is attached for the release candidate,
- encrypted local database gating is verified,
- object storage upload/download paths are smoke-tested with encrypted bytes only,
- logs and audit events are reviewed for metadata-only behavior,
- external security review signs off on file encryption and file handling.

No homemade file cryptography is allowed, and this plan does not mark production file encryption complete.
