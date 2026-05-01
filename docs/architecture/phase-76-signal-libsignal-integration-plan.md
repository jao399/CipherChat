# Phase 76 - Signal/libsignal Integration Plan

Phase 76 prepares CipherChat for real Signal/libsignal integration without claiming that production end-to-end encryption is implemented.

## Current Status

- No reviewed native Signal/libsignal adapter is installed.
- Live production message sending remains fail-closed.
- `prototype-sha256-envelope-v1` remains mock/demo-only and must not be used for production encryption.
- Existing `SignalOneToOneCryptoAdapter`, Signal prekey generation, adapter readiness, and provider-selection boundaries remain the only accepted integration points.

## Native Adapter Requirements

A production adapter must be a real reviewed native Signal/libsignal-compatible implementation, not JavaScript-only custom cryptography. It must:

- expose a narrow TypeScript boundary without exporting private key bytes,
- implement X3DH session setup and Double Ratchet message encryption/decryption,
- declare `signal-x3dh-v1` prekey bundle compatibility,
- provide readiness and evidence metadata,
- fail closed when native capabilities, storage, or version checks are missing,
- avoid logging plaintext, private keys, public prekey values, safety numbers, tokens, filenames, contact graph data, or decrypted identifiers.

The app must continue to select `signal-x3dh-double-ratchet-v1` only when the reviewed adapter passes readiness checks.

## Android Requirements

- Use a maintained native Android libsignal-compatible library or reviewed wrapper.
- Keep long-term device authentication signing behind the Phase 74 native signing key boundary.
- Store Signal identity/session material only inside verified encrypted storage or reviewed native storage.
- Validate Android release-candidate SQLCipher evidence for the exact APK under review.
- Verify behavior on a physical or release-equivalent Android target; BlueStacks is useful development evidence but not final non-exportable-key proof.

## iOS Requirements

- Use a maintained native iOS libsignal-compatible library or reviewed wrapper.
- Store private material through iOS Keychain or Secure Enclave where applicable, behind the Phase 74 boundary.
- Verify SQLCipher or equivalent encrypted session storage on macOS/Xcode targets.
- Keep adapter registration blocked until runtime evidence is attached for the reviewed iOS build.

## X3DH And Prekey Requirements

- Generate Signal identity keys, signed prekeys, signed prekey signatures, and one-time prekeys through the reviewed adapter.
- Publish only public prekey bundle material using the `signal-x3dh-v1` contract.
- Reject prototype bundle formats for production session setup.
- Claim at most one one-time prekey transactionally.
- Top up only current-device public prekeys and never return or log key material values.
- Treat missing, malformed, reused, stale, or incompatible prekeys as fail-closed errors.

## Double Ratchet Session Requirements

- Create per-recipient-device sessions after successful X3DH setup.
- Encrypt and authenticate message bodies and required protocol headers through the native adapter.
- Decrypt only inside transient UI/session boundaries after trust and storage checks pass.
- Support replay handling, skipped message keys, out-of-order delivery, session repair, and key rotation rules.
- Keep server fanout limited to ciphertext, opaque headers, recipient routing metadata, and delivery state.

## Safety Number And Key-Change Behavior

- Derive safety numbers from the production Signal identity material and stable account/device identifiers.
- Preserve the current send-blocking behavior for new, missing, changed, or revoked recipient trust.
- Require user review before sending after key changes.
- Re-check trust before queued retries.
- Surface adapter/key-change status in Settings without exposing raw keys or safety numbers in logs.

## Local Encrypted Session Storage Requirements

- Store session state, skipped keys, prekey state, and message indexes only inside a verified encrypted database or reviewed native encrypted storage.
- Do not persist plaintext messages or files unless the encrypted database boundary reports `encrypted=true`.
- Migration from prototype stores must remain guarded and rollback-aware.
- Runtime SQLCipher evidence must be collected for Android and iOS release-candidate builds before production.

## Test Plan

- Unit tests for adapter readiness, registration, provider selection, and fail-closed missing-adapter behavior.
- Interoperability vectors for X3DH session setup and Double Ratchet message exchange.
- Replay, tampering, malformed prekey, stale prekey, skipped-key, and out-of-order delivery tests.
- Key-change warning and queued retry trust re-check tests.
- Local encrypted session storage tests proving plaintext is not durably stored.
- Android and iOS runtime tests for native adapter loading, encrypted storage, and release build behavior.
- Metadata-log tests proving sensitive fields are not logged.

## Migration Plan From Prototype Provider

1. Keep `prototype-sha256-envelope-v1` available only for mock/demo mode.
2. Install the reviewed native adapter behind `SignalOneToOneCryptoAdapter` and `SignalPrekeyGenerationAdapter`.
3. Add adapter-specific readiness evidence and native runtime checks.
4. Generate new Signal prekey bundles for live accounts without converting prototype placeholder keys.
5. Require users to review production safety numbers before first live encrypted send.
6. Keep old prototype demo messages out of production durable stores.
7. Enable live sending only after production readiness criteria pass.

## Production Readiness Criteria

Production one-to-one messaging remains blocked until all of these are true:

- reviewed native Signal/libsignal-compatible adapter installed for Android and iOS,
- adapter declares and validates `signal-x3dh-v1`,
- `signal-x3dh-double-ratchet-v1` provider passes readiness checks,
- encrypted local session storage evidence is attached for Android and iOS release-candidate builds,
- native signing key provider evidence is attached where production policy requires non-exportable keys,
- interoperability and negative test suites pass,
- external security review accepts the adapter, storage, migration, and logging behavior.

## Why prototype-sha256-envelope-v1 Cannot Be Used For Production

`prototype-sha256-envelope-v1` is a demo envelope marker. It does not implement X3DH, Double Ratchet, forward secrecy, post-compromise security, replay handling, authenticated message encryption, or Signal interoperability. Renaming it or adding more hashing would be custom cryptography and is prohibited. Production must use the reviewed Signal/libsignal adapter boundary above.
