# Phase 42: iOS Development Client SQLCipher Verification

Phase 42 adds a repeatable iOS SQLCipher verification gate and documents the macOS-only runtime path.

## Current Host Result

This workspace is running on Windows, so it cannot run Xcode, build an iOS simulator app locally, or inspect iOS Keychain/SQLCipher behavior on a simulator. The phase therefore does not claim a completed iOS runtime test from this machine.

What is complete:

- iOS development-client configuration is checked by `npm run verify:ios-sqlcipher-readiness`.
- The check is included in `npm run validate:ci`.
- The runbook below defines the exact macOS verification steps.

## Configuration Gate

Run:

```bash
npm run verify:ios-sqlcipher-readiness
```

The gate checks:

- `expo-dev-client` is installed.
- `expo-secure-store` is installed.
- `@op-engineering/op-sqlite` is installed.
- `package.json` enables `op-sqlite.sqlcipher=true`.
- `app.json` contains an iOS bundle identifier.
- `eas.json` development builds are development clients.
- `eas.json` iOS development builds target simulator artifacts.
- On macOS, Xcode command-line tools and `simctl` are available.

On non-macOS hosts, the script passes configuration checks and reports that runtime verification requires macOS/Xcode.

## macOS Runtime Verification

On a macOS host with Xcode installed:

```bash
npm run validate:ci
npx eas build --profile development --platform ios
npm start -- --dev-client
```

Install the generated simulator app, launch CipherChat, then run the same app flow verified on Android:

1. Complete splash and onboarding or sign in from Welcome.
2. Open the main app shell.
3. Open Settings.
4. Scroll to Prototype Backend.
5. Tap Encrypted Local Database.
6. Confirm the row reports `Available - schema v1`.
7. Capture simulator logs and verify there are no fatal JavaScript/native crashes.

## Acceptance Criteria

iOS SQLCipher runtime verification is complete only when a macOS/Xcode run confirms:

- SecureStore provisions the local database key through iOS Keychain.
- OP-SQLite is present in the installed development client.
- OP-SQLite reports SQLCipher support.
- The encrypted local database opens successfully.
- Schema v1 applies successfully.
- Settings shows `Available - schema v1`.

## Next Phase

Phase 43 replaces exportable device private key handling with a stronger OS-backed key strategy.
