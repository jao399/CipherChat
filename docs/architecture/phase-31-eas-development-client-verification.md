# Phase 31 - EAS Development-Client Verification

Phase 31 makes the native development-client readiness gate repeatable.

CipherChat remains a managed Expo project. The app has no committed `android/` or `ios/` native directories, so native module verification must happen through Expo development-client builds instead of Expo Go.

## What changed

- Added `scripts/verify-development-build-config.mjs`.
- Added root script `npm run verify:dev-build-config`.
- Added the development-client config check to `npm run validate:ci`.
- Added `docs/release/development-client-verification.md`.

## Verified configuration

The verification script checks:

- `expo-dev-client` is installed.
- `@op-engineering/op-sqlite` is installed.
- OP-SQLite SQLCipher compilation is enabled.
- `app.json` has stable Android and iOS identifiers.
- The `cipherchat` app scheme is configured.
- `expo-secure-store` is configured as an Expo plugin.
- `eas.json` development builds produce a development client.
- Android development builds produce APKs.
- iOS development builds target the simulator.

The script treats missing local `eas`, missing local `adb`, and absent native project folders as environment warnings, not configuration failures.

## Manual build verification

Run the full release checklist when native tooling is available:

```bash
npm run validate:ci
npx eas build --profile development --platform android
npx eas build --profile development --platform ios
```

The native build should then be installed and smoke-tested with the checklist in `docs/release/development-client-verification.md`.

## Local environment result

This Windows workspace can verify the project configuration, but it cannot complete native install verification until Android platform tools are available in `PATH`.

iOS simulator verification also requires macOS/Xcode or an EAS simulator artifact tested on a macOS host.

## Next phase

Phase 32 should add the formal threat model and security acceptance criteria:

- assets and trust boundaries
- attacker capabilities
- cryptographic protocol acceptance gates
- metadata and abuse-prevention boundaries
- release blockers for production user data
