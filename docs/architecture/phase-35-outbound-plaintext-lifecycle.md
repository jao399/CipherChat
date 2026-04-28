# Phase 35 - Outbound Plaintext Lifecycle Controls

Phase 35 adds a guardrail around outbound message plaintext.

Plaintext exists only in transient UI state: the conversation composer draft and the local optimistic message preview. Durable outbound queue records are scanned before persistence so plaintext-shaped fields cannot be written to AsyncStorage.

## What changed

- Added `src/services/messages/outboundQueuePrivacy.ts`.
- Added `src/services/messages/outboundQueuePrivacy.test.ts`.
- Updated `src/services/messages/outboundQueueStore.ts` to scan outbound queue records before `AsyncStorage.setItem`.
- Added `scripts/verify-plaintext-lifecycle.mjs`.
- Added `npm run verify:plaintext-lifecycle`.
- Added the plaintext lifecycle gate to `npm run validate:ci`.

## Plaintext boundary

Allowed:

- `ConversationScreen` keeps the current draft in React component state.
- `ConversationScreen` keeps an optimistic local preview in component state after send.
- Message encryption providers may receive plaintext only through `prepareOutboundFanout`.

Blocked:

- outbound queue item fields named `plaintext`, `text`, `draft`, `messageText`, `messageBody`, `body`, `content`, or equivalent normalized forms
- nested plaintext-shaped fields inside fanout objects
- future durable queue writes that accidentally add plaintext-shaped fields

Allowed durable queue fields include encrypted envelope metadata such as `messageId`, `header`, and `ciphertext`.

## Tests

`npm run app:test` verifies:

- valid durable queue metadata passes
- direct plaintext fields are rejected
- nested message text fields are rejected
- encrypted payload field names are not false positives

## Release gate

`npm run verify:plaintext-lifecycle` checks that:

- outbound queue writes still call the plaintext scanner
- privacy guard tests still cover direct and nested plaintext-shaped fields
- this phase documentation remains present

## Next phase

Phase 36 adds account and session abuse controls.

More detail: `docs/architecture/phase-36-account-session-abuse-controls.md`.
