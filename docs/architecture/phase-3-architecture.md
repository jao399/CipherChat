# CipherChat Phase 3 Architecture

Phase 3 defines how the current UI prototype can become a real encrypted messaging product. This phase does not build a backend and does not implement cryptography. It establishes product boundaries, security invariants, data ownership, API shapes, and implementation gates for later phases.

## Current State

- Expo React Native TypeScript UI prototype.
- Mock data only.
- AsyncStorage only stores onboarding completion.
- No real account creation, login, message sending, file transfer, calls, or encryption.
- No server can currently receive, store, or process user data because no backend exists.

## Product Boundary

CipherChat should be designed as a client-secure messaging system:

- The mobile client owns plaintext messages, plaintext files, private keys, and local decrypted state.
- The server stores only encrypted envelopes, routing metadata, prekey material, public keys, device records, and operational events.
- The server must never receive plaintext message bodies, file contents, private keys, recovery secrets, or decrypted local database contents.
- Every device is a first-class identity participant, not only a login session.

## Primary Components

### Mobile Client

Responsibilities:

- Account session and device identity management.
- Local key generation and secure storage.
- Contact verification and safety-number display.
- Client-side message encryption and decryption.
- Client-side file encryption and decryption.
- Encrypted local database.
- Push notification fetch/decrypt flow.
- Voice/video call identity display and media security state.

### API Server

Responsibilities:

- Account lookup and abuse-resistant registration.
- Device registry and device revocation.
- Public identity key and prekey distribution.
- Encrypted message queueing and delivery acknowledgements.
- Encrypted file object coordination.
- Push notification fanout using privacy-preserving payloads.
- Server-side audit logs for operational events only.

Non-responsibilities:

- Reading message contents.
- Reading file contents.
- Generating user private keys.
- Recovering plaintext.
- Silently adding devices to an account.

### Encrypted Object Storage

Responsibilities:

- Store encrypted file blobs.
- Support resumable upload/download.
- Enforce object access authorization.
- Delete expired or revoked encrypted objects.

Non-responsibilities:

- Storing file plaintext.
- Generating file content keys.
- Creating thumbnails from plaintext.

### Push Provider

Responsibilities:

- Wake devices with generic notifications.
- Carry opaque delivery references when needed.

Non-responsibilities:

- Carrying message text, sender names, group names, filenames, or plaintext previews.

## Trust Boundaries

1. User device to OS secure storage:
   - Private identity keys, local database keys, and recovery material must use Android Keystore or iOS Keychain.

2. Mobile client to API server:
   - Server receives authenticated requests and encrypted payloads only.
   - Server responses must be schema-validated client-side.

3. Mobile client to object storage:
   - Client uploads encrypted bytes only.
   - Per-file keys are created client-side and delivered through encrypted message envelopes.

4. Mobile client to push provider:
   - Push payloads must be generic.
   - Client fetches encrypted content after wake.

5. Device to device:
   - Device trust is verified through safety numbers or QR code confirmation.
   - New device linking must require explicit approval from an existing trusted device or secure recovery flow.

## Security Invariants

- Never invent custom cryptography.
- Never store plaintext message content on the server.
- Never log plaintext message content, file names, contact graphs, private keys, safety numbers, or recovery secrets.
- Never make device verification cosmetic. Verification state must be tied to real identity keys later.
- Every encrypted message must be authenticated, replay-protected, and tied to sender and recipient device identities.
- Local decrypted data must be protected at rest.
- Key changes must be visible to users and must affect trust state.
- Group membership changes must rotate or update group secrets.
- Deleted or disappearing content must be deleted locally and server-side where possible, with clear limits.

## Phase 3 Deliverables

- Security architecture docs.
- Future API boundary docs.
- TypeScript security/domain contracts.
- TypeScript service port interfaces.
- README update showing Phase 3 status.

## Exit Criteria

Phase 3 is complete when:

- The future secure system is documented clearly enough to guide implementation.
- No backend or cryptographic placeholder pretends to provide security.
- TypeScript contracts compile.
- Current UI prototype still runs and passes validation.
