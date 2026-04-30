# Phase 68 - Live Prekey Publication Boundary

Phase 68 wires device-bundle publication and one-time prekey top-up through the Signal prekey generation boundary.

## What changed

- `deviceBundlePublicationProvider` builds publishable device bundles for the mobile app.
- Mock mode still uses `prototypeDeviceIdentityProvider` so the UI prototype and local demo flow keep working.
- Live mode calls `SignalPrekeyGenerationProvider` before publishing public identity, signed prekey, signature, or one-time prekeys.
- Live mode fails closed when no reviewed production-ready `signal-x3dh-v1` native adapter is installed.
- Current-device prekey top-up also uses the same live Signal boundary instead of prototype one-time prekey strings.

## Security properties

The server still receives only public device/prekey material. The mobile client must generate all identity and prekey material locally. Prototype `prototype_*` prekeys are now isolated to mock mode and cannot be silently published by the live device verification or top-up paths.

## Remaining production blocker

The current API schema still uses a single `identityKey` field for both public device discovery and Ed25519 device-session verification. A production Signal integration should split authentication identity from Signal identity/prekey material before real launch so challenge verification and X3DH identity semantics do not compete for the same field.

## Validation

- `src/services/api/deviceBundlePublication.test.ts` covers mock isolation, live fail-closed behavior, live Signal bundle publication, and live top-up generation.
- `npm run validate:ci` remains the release gate for this boundary.
