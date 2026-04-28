# Phase 34 - Message Encryption Provider Interface

Phase 34 separates message encryption provider selection from the backend send orchestration.

The previous live-send gate correctly blocked prototype crypto, but the prototype fanout function was still imported directly by `BackendProvider`. This phase introduces an explicit provider contract so future Signal/X3DH + Double Ratchet work has a clear integration point.

## What changed

- Added `src/services/messages/messageEncryptionProvider.ts`.
- Added `src/services/messages/messageEncryptionProvider.test.ts`.
- Moved prototype fanout behind `prototypeMessageEncryptionProvider`.
- Added `pendingSignalMessageEncryptionProvider` as the production provider contract placeholder.
- Updated `BackendProvider` to call the selected provider instead of importing prototype fanout directly.
- Updated `messageCryptoPolicy` to derive readiness from the selected provider.
- Updated README, threat model, security acceptance criteria, and release checklist.

## Provider contract

`MessageEncryptionProvider` defines:

- provider id
- label and detail for UI/status reporting
- `productionReady`
- `mockReady`
- `prepareOutboundFanout`

The active providers are:

- `prototype-sha256-envelope-v1`: mock-ready, not production-ready
- `signal-double-ratchet-pending`: production contract placeholder, not operational yet

## Runtime selection

Provider selection is handled by `selectMessageEncryptionProvider`:

- mock mode defaults to `prototype-sha256-envelope-v1`
- live mode defaults to `signal-double-ratchet-pending`
- `EXPO_PUBLIC_CIPHERCHAT_MESSAGE_CRYPTO_PROVIDER` can explicitly request either provider for controlled testing

Live mode remains blocked because the selected provider is not production-ready.

## Test coverage

`npm run app:test` verifies:

- mock mode selects the prototype provider
- live mode selects the pending Signal provider contract
- explicit provider selection works for future rollout controls
- pending Signal provider refuses to prepare fanout
- the production crypto provider shape is stable
- policy checks still block live sends until a provider is production-ready

## Next phase

Phase 35 should add outbound plaintext lifecycle controls:

- prevent plaintext from being written to durable stores
- make message composer plaintext live only in component memory
- add tests for outbound queue records containing no plaintext
- add a release gate that scans queued envelope records for plaintext-shaped fields
