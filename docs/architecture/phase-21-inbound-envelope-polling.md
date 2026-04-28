# Phase 21 - Inbound Envelope Polling

## Status

Phase 21 adds mobile inbound encrypted-envelope polling and acknowledgement. The app can now fetch pending encrypted envelopes for the active device, acknowledge them through the API, and expose inbox sync status in Settings.

## What changed

- Added `InboundEnvelopeSyncStatus` to the mobile API types.
- Added BackendProvider `pollInboundEnvelopes`.
- Mock API mode now supports acknowledgement calls.
- Settings includes an `Encrypted Inbox` row for manual polling.
- The inbox status shows fetched and acknowledged envelope counts.
- Polling errors are surfaced in Settings without storing decrypted message contents.

## Security boundary

The mobile app still does not decrypt message payloads in this phase. Polling handles only encrypted delivery records:

- envelope IDs
- message IDs
- routing account/device IDs
- encrypted headers
- encrypted bodies
- delivery timestamps and states

The provider acknowledges fetched envelopes so the server can advance delivery state, but plaintext message rendering remains blocked until the real client-side crypto and encrypted local database exist.

## Poll flow

1. User taps `Encrypted Inbox` in Settings.
2. BackendProvider verifies or creates a prototype device session.
3. The app calls `GET /v1/messages/envelopes?limit=25`.
4. Each returned envelope is acknowledged with `POST /v1/messages/envelopes/:messageId/ack`.
5. Settings displays pending and acknowledged counts.
6. Errors are stored as non-sensitive status text.

## Known limitations

- Polling is manual; no background poller exists yet.
- No decryption or plaintext rendering is attempted.
- No encrypted local database exists yet.
- Acknowledged envelopes are not merged into chat history.
- Pagination beyond the first page is not implemented yet.

## Next phase

Phase 22 should add a mobile delivery receipt and inbox state layer:

- persist non-sensitive envelope sync cursors
- support paginated inbound polling
- show encrypted inbox health in Chats
- model delivery receipt state separately from decrypted message state
