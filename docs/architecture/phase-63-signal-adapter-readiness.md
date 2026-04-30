# Phase 63 - Signal Adapter Readiness

Phase 63 adds startup-facing readiness metadata for the future native Signal/libsignal adapter.

## What changed

- Added `evaluateSignalAdapterReadiness` to report whether a native Signal adapter is registered.
- Readiness reports whether the adapter is production-ready, uses `signal-x3dh-v1`, and is eligible for provider use.
- Message crypto readiness now includes Signal adapter status.
- Settings exposes a Signal Adapter row so development and release builds can show the current adapter state.
- Tests cover missing adapters, incompatible adapters, and eligible reviewed adapters.

## Security Position

This does not implement Signal cryptography. It makes the integration state explicit so production release checks can distinguish:

- no native adapter installed;
- adapter installed but not reviewed/production-ready;
- adapter installed but using the wrong prekey contract;
- adapter installed, reviewed, and eligible for provider registration.

## Remaining Production Blocker

The next implementation phase still needs a real reviewed native adapter that generates Signal identity/prekey material, performs X3DH session setup, runs Double Ratchet encryption/decryption, and persists session state only through encrypted local storage.
