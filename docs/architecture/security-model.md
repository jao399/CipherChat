# CipherChat Security Model

This document defines the intended security model for future CipherChat implementation. It is a design specification for later phases, not a claim that the current UI prototype is encrypted.

## Goals

- End-to-end encrypted one-to-one messaging.
- End-to-end encrypted group messaging.
- Client-side encrypted files.
- Explicit device identity and verification.
- Forward secrecy and post-compromise security.
- Encrypted local storage.
- Push notification privacy.
- Metadata minimization where practical.
- Abuse prevention that does not require server access to message plaintext.

## Non-Goals

- Custom cryptographic protocol design.
- Server-readable message scanning.
- Transparent device addition without user-visible trust changes.
- Recovery flows that let the server decrypt user history.
- Push notifications containing sensitive content.

## Recommended Protocols

### One-to-One Messaging

Use Signal-style X3DH for asynchronous session setup:

- Long-term identity key pair per device.
- Signed prekey per device.
- One-time prekeys for initial session creation.
- Server distributes public prekey bundles only.

Use Double Ratchet for message sessions:

- Per-message keys.
- Forward secrecy.
- Post-compromise security.
- Out-of-order message support.
- Skipped message key handling with strict limits.

### Group Messaging

Use MLS for secure groups:

- Group epochs.
- Membership authentication.
- Efficient group updates.
- Secret rotation on membership change.
- Sender authentication.

### File Transfer

Use client-generated per-file content keys:

- Encrypt file bytes on device before upload.
- Use authenticated encryption.
- Store encrypted blob in object storage.
- Send file key and object reference only through encrypted message envelopes.
- Encrypt metadata where possible, including thumbnails and previews.

### Calls

Use WebRTC for voice/video transport:

- DTLS-SRTP media encryption.
- Identity verification bound to device keys.
- Clear in-call security state.
- No server-side media recording or transcription by default.

## Key Storage

Use OS secure storage:

- Android Keystore for private key wrapping and sensitive local secrets.
- iOS Keychain and Secure Enclave where available.
- SQLCipher or equivalent encrypted local database for messages and session state.

Never store private keys in AsyncStorage.

## Device Model

Each device has:

- Device id.
- Device display name.
- Long-term identity key pair.
- Signed prekey.
- One-time prekeys.
- Trust state.
- Last seen timestamp.
- Revocation state.

Device linking must require one of:

- QR verification from an existing trusted device.
- Safety-number confirmation.
- Secure account recovery with visible trust reset.

## Verification Model

Verification should compare cryptographic identity material, not UI-only labels:

- QR code displays account and device identity fingerprints.
- Safety number is derived from identity keys.
- Verification state is stored locally and synced carefully.
- Key changes downgrade verification state and notify users.

## Local Data Protection

Sensitive local state:

- Message plaintext.
- File plaintext cache.
- Session state.
- Private keys or wrapped key material.
- Contact verification state.
- Drafts.

Required controls:

- Encrypted local database.
- OS-backed key wrapping.
- App lock with biometric or device credential.
- Clear cache and attachment retention controls.
- Secure deletion best effort with documented OS limits.

## Metadata Minimization

Minimize:

- Message content metadata.
- File names and previews.
- Contact graph exposure.
- Group membership exposure.
- Push notification content.
- IP and device telemetry retention.

Server may need limited routing metadata:

- Recipient account/device ids.
- Queue timestamps.
- Delivery state.
- Abuse-control counters.

Retention must be short and documented.

## Abuse Prevention

Use controls that preserve privacy:

- Rate limits by account, device, IP range, and registration signal.
- User-controlled report flow that discloses only selected messages.
- Server-side spam scoring on metadata and behavior only.
- Device reputation and key churn anomaly detection.
- Contact request limits.
- Attachment size and type limits.
- Clear blocking and safety controls.

## Critical Implementation Rules

- Use audited libraries.
- Keep crypto code isolated from UI code.
- Add protocol test vectors.
- Add key migration tests before shipping.
- Require external security review before production launch.
- Treat every key lifecycle change as a product event, not only an engineering event.
