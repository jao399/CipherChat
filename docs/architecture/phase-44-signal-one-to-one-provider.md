# Phase 44: Signal-Style One-to-One Crypto Provider

Phase 44 replaces the old live-mode placeholder with a production-shaped one-to-one Signal provider boundary.

## What Changed

- Added `src/services/messages/signalOneToOneCryptoProvider.ts`.
- Added provider id `signal-x3dh-double-ratchet-v1`.
- Live mode now defaults to the active Signal provider gate instead of the legacy `signal-double-ratchet-pending` placeholder.
- The provider supports an injected `SignalOneToOneCryptoAdapter`.
- Tests prove the provider remains blocked without a reviewed adapter and can fan out envelopes when a production-ready adapter is injected.

## Design Boundary

CipherChat still does not invent custom cryptography. The new provider is an integration boundary for a reviewed native/libsignal implementation.

The adapter must own:

- X3DH session setup
- signed prekey validation
- one-time prekey consumption
- Double Ratchet session state
- message header encryption/serialization
- ciphertext generation
- session persistence into encrypted local storage
- key rotation and stale-session recovery

The app-level provider owns:

- trusted-recipient filtering
- conversation and sender metadata binding
- fanout envelope shaping for the API
- production readiness gating

## Current Runtime Behavior

Mock mode still uses:

```text
prototype-sha256-envelope-v1
```

Live mode now selects:

```text
signal-x3dh-double-ratchet-v1
```

Because no reviewed adapter is installed yet, `productionReady=false` and live sends remain blocked by `assertCanPrepareOutboundFanout`.

## Adapter Contract

The production adapter must implement:

```ts
type SignalOneToOneCryptoAdapter = {
  id: string;
  productionReady: boolean;
  encryptForRecipient(input: SignalOneToOneEncryptInput): Promise<{
    messageId: string;
    header: string;
    ciphertext: string;
  }>;
};
```

`productionReady` must be set only after implementation review and device-runtime verification.

## Validation

Run:

```bash
npm run app:test
npm run typecheck
```

The tests cover:

- mock mode provider selection
- live mode provider selection
- explicit provider override
- blocked live Signal provider without adapter
- fanout with an injected production-ready adapter

## Next Phase

Phase 45 migrates local message records into the encrypted SQLCipher-backed database boundary.
