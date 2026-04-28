# Phase 19 - Outbound Envelope Preparation

## Status

Phase 19 connects the mobile conversation composer to the encrypted-envelope delivery boundary. This is still not real Signal encryption. It is a deliberately named prototype envelope preparation layer that preserves the architecture shape without pretending to provide production cryptography.

## What changed

- Added typed mobile support for `POST /v1/messages/envelopes/fanout`.
- Added mock fanout support for UI-only mode.
- Added a client-side outbound envelope preparation service.
- Added BackendProvider `sendSecureMessage`.
- Wired the Conversation composer to prepare and queue outbound envelopes.
- Added local send-state UX after fanout acceptance.
- Blocked sending when no trusted recipient identity key is available.

## Security boundary

The new mobile service does not implement real encryption and does not claim to. It prepares prototype envelope payloads that:

- never send the plaintext body to the API
- derive opaque prototype header/body values from hashes
- use the authenticated sender device session
- fan out per recipient device
- require the remote identity record to be trusted

Production encryption must replace this layer with a reviewed Signal-style X3DH + Double Ratchet implementation for one-to-one messaging and MLS for groups.

## Send flow

1. Conversation screen passes the plaintext draft to BackendProvider.
2. BackendProvider verifies there is a device session.
3. BackendProvider verifies the recipient trust state is `trusted`.
4. `preparePrototypeOutboundFanout` creates per-device envelope inputs.
5. Mock mode calls the mock fanout client.
6. Live mode calls `POST /v1/messages/envelopes/fanout`.
7. The UI appends the plaintext locally only after the API accepts the envelope fanout.

## Known limitations

- Prototype hashes are not decryptable ciphertext.
- No ratchet session state exists yet.
- No local encrypted message database exists yet.
- No retry queue exists on the mobile device yet.
- Group messaging still needs MLS design and implementation.

## Next phase

Phase 20 should add a local outbound queue and pending-send state:

- persist pending outbound fanout attempts locally
- retry failed sends when the API becomes available
- show durable queued/sending/failed states in Conversation
- keep plaintext storage behind the future encrypted local database boundary
