# Phase 46: Production Send/Receive Flow Gating

Phase 46 wires both outbound sending and inbound receiving to the production crypto readiness boundary.

## What Changed

- Added `assertCanProcessInboundEnvelopes`.
- Live inbound envelope polling now fails closed when the active message crypto provider is not production-ready.
- The Signal one-to-one adapter contract now includes `decryptInboundEnvelope`.
- Tests cover both send and receive crypto gates.

## Send Flow

The production send flow remains:

1. require a verified live device session
2. require trusted recipient identity state
3. require `signal-x3dh-double-ratchet-v1` to report `productionReady=true`
4. prepare encrypted envelope fanout
5. send opaque headers/ciphertexts to the API
6. queue retry metadata without plaintext

Without a reviewed Signal adapter, live sends remain blocked.

## Receive Flow

The production receive flow is now gated before polling and acknowledging live envelopes:

1. require a verified live device session
2. require production-ready message crypto
3. fetch pending opaque envelopes
4. decrypt through the Signal adapter
5. write decrypted display records only through SQLCipher
6. acknowledge after local processing succeeds

The current code implements the gate and adapter contract. The full decrypt/write/ack transaction remains the next implementation step after the reviewed Signal adapter is installed.

## Why This Matters

Receiving is as sensitive as sending. A live client must not acknowledge server envelopes before it can decrypt and persist them safely, otherwise messages can be lost or moved through an unreviewed plaintext path.

## Validation

Run:

```bash
npm run app:test
npm run typecheck
```

The tests verify that live send and live receive processing are both blocked until the crypto provider is production-ready.

## Next Phase

Phase 47 implements the secure file encryption/upload/download boundary.
