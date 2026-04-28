# Phase 22 - Inbound Sync State

## Status

Phase 22 adds paginated inbound polling, persisted sync cursor state, and delivery receipt metadata on mobile. This keeps encrypted envelope delivery observable without attempting decryption or storing plaintext.

## What changed

- Added `src/services/messages/inboundEnvelopeStore.ts`.
- Persisted inbound sync metadata in AsyncStorage:
  - next cursor
  - last cursor
  - last poll timestamp
  - last acknowledgement timestamp
  - total fetched count
  - total acknowledged count
  - recent delivery receipt metadata
- BackendProvider now walks up to five inbound pages per manual poll.
- Each fetched encrypted envelope is acknowledged.
- Settings shows richer total acknowledgement status.
- Chats shows encrypted inbox health and whether more pages are ready.

## Storage boundary

The inbound sync store keeps only non-sensitive delivery metadata:

- envelope ID
- message ID
- conversation ID
- sender and recipient routing IDs
- queued and acknowledged timestamps
- delivery state

It does not store decrypted plaintext. Encrypted headers and bodies are not persisted in this phase. Production storage should move this state into the encrypted local database.

## Pagination behavior

Polling starts from the stored `nextCursor` when one exists. Each API page is fetched with:

```text
GET /v1/messages/envelopes?limit=25&cursor=<opaque cursor>
```

The provider acknowledges every fetched envelope and then stores the returned `nextCursor`. A single manual poll processes up to five pages to prevent long UI-blocking loops.

## Known limitations

- Polling is still manual.
- The cursor is delivery pagination state, not a full encrypted inbox sync protocol.
- Decryption and plaintext rendering are still intentionally absent.
- Delivery receipts are not yet tied into read receipts or conversation ordering.
- Background sync and notification-triggered sync are not implemented yet.

## Next phase

Phase 23 should add a real encrypted local database plan/scaffold:

- introduce an encrypted local data-access boundary
- prepare migration path away from AsyncStorage for message-related state
- keep secrets in OS secure storage
- keep plaintext message cache out of the app until the encryption layer is selected
