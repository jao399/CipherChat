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

The provider ids are:

- `prototype-sha256-envelope-v1`: mock-ready, not production-ready
- `signal-double-ratchet-pending`: legacy production contract placeholder, not operational
- `signal-x3dh-double-ratchet-v1`: active Signal-style integration boundary, blocked until a reviewed adapter is installed

## Runtime selection

Provider selection is handled by `selectMessageEncryptionProvider`:

- mock mode defaults to `prototype-sha256-envelope-v1`
- live mode defaults to `signal-x3dh-double-ratchet-v1`
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

Phase 35 adds outbound plaintext lifecycle controls.

More detail: `docs/architecture/phase-35-outbound-plaintext-lifecycle.md`.
