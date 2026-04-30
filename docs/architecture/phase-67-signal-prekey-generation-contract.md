# Phase 67 - Signal Prekey Generation Contract

Phase 67 adds the native-adapter contract for future Signal/libsignal prekey generation.

## What changed

- Added `SignalPrekeyGenerationAdapter`.
- Added `createSignalPrekeyGenerationProvider`.
- The provider is blocked until a reviewed production-ready `signal-x3dh-v1` adapter is installed.
- Adapter output is validated with the Phase 61 Signal X3DH prekey bundle validator before it can be used.
- Tests cover blocked default behavior, valid adapter output, and malformed adapter output rejection.

## Why this matters

CipherChat still uses prototype device identity/prekey generation for the UI and local development flow. This contract defines the future replacement boundary for generating:

- Signal identity public key material;
- signed prekeys;
- signed prekey signatures;
- one-time prekeys.

## Security Position

This phase does not implement X3DH, Double Ratchet, or key generation. It defines the required adapter shape and validation boundary so the eventual native implementation can be integrated without publishing malformed or prototype prekey material.

## Next Phase

Wire the future prekey-generation provider into device-bundle publication behind a production gate, while leaving the prototype provider active only for mock/development flows until a reviewed native adapter exists.
