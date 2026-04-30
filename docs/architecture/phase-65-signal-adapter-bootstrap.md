# Phase 65 - Signal Adapter Bootstrap

Phase 65 adds a deterministic startup boundary for future native Signal/libsignal adapter registration.

## What changed

- Added `bootstrapSignalOneToOneAdapter`.
- Startup bootstrap clears stale registered adapters before evaluating a candidate adapter.
- Ineligible adapters are not registered.
- Eligible, production-ready `signal-x3dh-v1` adapters are registered and become visible to live provider selection.
- Tests cover no adapter, non-production-ready adapter, and eligible adapter paths.

## Security Position

This phase still does not implement Signal cryptography. It prevents accidental registration of an unreviewed adapter and gives future app startup code one reviewed place to integrate a native adapter.

## Future Integration

When a real native adapter is installed, app startup should call:

```ts
bootstrapSignalOneToOneAdapter(nativeSignalAdapter);
```

The adapter must still satisfy the readiness gate, use the `signal-x3dh-v1` prekey contract, and persist session state only through encrypted local storage before production sends can be enabled.
