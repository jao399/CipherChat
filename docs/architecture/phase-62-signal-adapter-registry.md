# Phase 62 - Signal Adapter Registry

Phase 62 adds a runtime registry for a future reviewed native Signal/libsignal adapter.

## What changed

- `signalAdapterRegistry` can register, read, and clear a `SignalOneToOneCryptoAdapter`.
- Live provider selection now uses the registered adapter when one exists.
- Without a registered adapter, live mode still returns the gated Signal provider.
- Registered adapters must still pass the Phase 61 `signal-x3dh-v1` prekey bundle format gate before production readiness is reported.
- Tests cover registered-adapter fanout and clearing back to the gated provider.

## Why this matters

This gives the eventual native adapter a stable integration point. The app no longer needs to rewrite provider selection when libsignal wiring lands; the reviewed adapter can be registered during startup and the existing production crypto gates remain in force.

## Security Notes

- This phase does not implement Signal, X3DH, Double Ratchet, key generation, or session storage.
- A registered adapter that does not declare `signal-x3dh-v1` remains blocked.
- Production sends still require a reviewed adapter, encrypted local session storage, and release evidence.

## Next Phase

Add a native-adapter readiness checklist and startup hook boundary so development builds can report whether a real Signal adapter is installed, reviewed, and eligible for production-mode registration.
