# Phase 20 - Local Outbound Queue

## Status

Phase 20 adds durable mobile send-state plumbing. The app can now persist prepared outbound fanout attempts locally, show queued/sending/failed/sent states in the conversation, and retry failed envelope fanout without retyping the message.

## What changed

- Added `src/services/messages/outboundQueueStore.ts`.
- BackendProvider loads outbound queue state at startup.
- `sendSecureMessage` now persists a queued item before attempting delivery.
- Outbound items move through `queued`, `sending`, `sent`, and `failed` states.
- Conversation reads provider-backed outbound queue state.
- Failed or queued outbound items show a retry control.
- Message bubbles now display pending/failed/sent indicators.

## Storage boundary

The queue intentionally stores prepared prototype fanout payloads and routing metadata, not plaintext message bodies. This keeps AsyncStorage within the current prototype boundary:

- no bearer tokens
- no private keys
- no recovery secrets
- no plaintext message bodies

In production, this queue should move into the encrypted local database alongside message drafts, ratchet state, and delivery receipts.

## Retry behavior

1. A send creates and persists a queued outbound item.
2. The provider marks the item as sending.
3. Mock mode calls the mock fanout client.
4. Live mode calls the authenticated fanout API.
5. Accepted fanout marks the item sent.
6. Failures mark the item failed and preserve the prepared fanout for retry.
7. Conversation retry reuses the prepared fanout and updates state.

## Known limitations

- The queue is AsyncStorage-backed because the encrypted local database is not built yet.
- Prepared prototype fanout hashes are not production ciphertext.
- There is no background retry worker yet.
- Sent queue cleanup policy is not implemented yet.
- Delivery receipts are not yet merged back into chat state.

## Next phase

Phase 21 should add inbound encrypted envelope polling:

- fetch pending envelopes for the current device
- acknowledge fetched envelopes
- show encrypted inbox status in Settings or Chats
- keep decrypted plaintext out of storage until the encrypted local database is ready
