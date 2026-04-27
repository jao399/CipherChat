# CipherChat Backend Boundaries

This document defines future API boundaries. It is intentionally high level and does not create a backend in the current prototype.

## Server Principles

- The server is a relay, registry, and queue.
- The server does not decrypt content.
- The server stores public keys, encrypted envelopes, encrypted file references, and minimal operational metadata.
- Authorization is enforced on accounts, devices, queues, files, and group state.
- All payloads must be schema-validated.
- All identifiers exposed over APIs should be high-entropy opaque ids.

## Suggested Services

### Identity Service

Responsibilities:

- Register accounts.
- Authenticate users.
- Issue short-lived access tokens and refresh tokens.
- Track account recovery state.
- Enforce abuse controls.

Sensitive constraints:

- Authentication does not grant message decryption.
- Account recovery must not expose old message history unless recovery keys are client-held.

### Device Service

Responsibilities:

- Register devices.
- Publish device public identity keys and prekey bundles.
- Revoke devices.
- Track device trust changes.

Sensitive constraints:

- Device addition must be user-visible.
- Silent device insertion is a critical security failure.

### Prekey Service

Responsibilities:

- Store signed prekeys and one-time prekeys.
- Serve prekey bundles to message senders.
- Prevent unlimited one-time prekey reuse.

Sensitive constraints:

- Server must not generate private keys.
- Clients must verify signed prekeys.

### Message Service

Responsibilities:

- Accept encrypted message envelopes.
- Queue envelopes per recipient device.
- Deliver pending envelopes.
- Track delivery acknowledgements.

Sensitive constraints:

- Message body is opaque ciphertext.
- Server logs must not include envelope plaintext fields that reveal sensitive metadata.

### Group Service

Responsibilities:

- Store encrypted MLS group state references.
- Coordinate group membership operations.
- Deliver MLS commits and application messages.

Sensitive constraints:

- Membership changes must have authenticated commits.
- Group secrets are client-side.

### File Service

Responsibilities:

- Create encrypted upload sessions.
- Store encrypted blobs.
- Return opaque object references.
- Delete expired objects.

Sensitive constraints:

- File keys are never sent to the file service.
- Thumbnails and previews must be encrypted client-side.

### Push Service

Responsibilities:

- Send generic notifications.
- Wake clients to fetch encrypted payloads.

Sensitive constraints:

- No message text, sender name, group name, file name, or plaintext preview in push payloads.

### Audit Service

Responsibilities:

- Store operational security events.
- Support abuse investigations and device/account recovery review.

Sensitive constraints:

- Logs contain event types and opaque ids only.
- Logs do not contain message content, file content, private keys, safety numbers, or contact graphs.

## Example API Groups

```text
POST /v1/accounts
POST /v1/sessions
POST /v1/devices
GET  /v1/devices
POST /v1/devices/{deviceId}/revoke
PUT  /v1/devices/{deviceId}/prekeys
GET  /v1/prekeys/{accountId}
POST /v1/messages
GET  /v1/messages/pending
POST /v1/messages/{messageId}/ack
POST /v1/files/upload-sessions
POST /v1/groups
POST /v1/groups/{groupId}/commits
POST /v1/reports
```

## Implementation Gates

Before backend implementation:

- Finalize data classification.
- Finalize account and device lifecycle.
- Choose auth provider or first-party auth.
- Choose audited crypto libraries.
- Define payload schemas.
- Define abuse limits.
- Define log retention.
- Define backup and recovery model.

Before production:

- Complete threat model.
- Complete protocol review.
- Complete external security review.
- Add fuzzing and protocol test vectors.
- Add incident response runbooks.
