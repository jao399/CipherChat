# Phase 86 - EAS iOS Cloud Build Preparation

## Goal

Prepare CipherChat for iOS cloud builds from a Windows host while keeping iOS SQLCipher runtime evidence blocking until an installed iPhone or TestFlight build passes Settings > Release Evidence > SQLCipher Runtime Check.

## Build Profiles

Phase 86 adds explicit iOS EAS profiles:

- `ios-device-preview`: internal/ad hoc iPhone build for enrolled devices.
- `ios-testflight`: store-signed iOS build intended for TestFlight submission.

Both profiles run in mock mode and expose Release Evidence controls:

```json
{
  "EXPO_PUBLIC_CIPHERCHAT_API_MODE": "mock",
  "EXPO_PUBLIC_CIPHERCHAT_RELEASE_EVIDENCE": "true"
}
```

These profiles do not enable production message encryption and do not close any production cryptography blockers.

## Windows Cloud Build Commands

Internal iPhone build:

```powershell
npx eas-cli@latest login
npx eas-cli@latest whoami
npx eas-cli@latest device:create
npm run eas:ios:device-preview
```

TestFlight build:

```powershell
npx eas-cli@latest login
npx eas-cli@latest whoami
npm run eas:ios:testflight
npm run eas:ios:submit-latest
```

The TestFlight path requires Apple Developer Program access and App Store Connect configuration. No Apple credentials, certificates, provisioning profiles, API keys, or secrets are committed to this repository.

## Evidence Rule

iOS SQLCipher evidence remains incomplete until all of the following are true:

1. The iOS build is produced by EAS or a reviewed macOS/Xcode release-candidate path.
2. The app is installed on an iPhone or distributed through TestFlight.
3. CipherChat opens successfully.
4. Settings > Release Evidence > SQLCipher Runtime Check passes.
5. The evidence record is updated with the build profile, EAS build URL or artifact identifier, device model, iOS version, install result, and pass/fail screenshot or redacted logs.

The runtime check must report `encrypted=true` and schema v1 after writing, reading, and deleting a harmless `deviceMetadata` record.

## Static Readiness Gate

`npm run verify:eas-ios-cloud-build` verifies:

- iOS bundle identifier exists.
- OP-SQLite SQLCipher config is present.
- `ios-device-preview` is configured as an internal device build.
- `ios-testflight` is configured as a store-signed device build.
- Release Evidence controls are enabled for both profiles.
- `docs/release/ios-sqlcipher-evidence.md` still says evidence is missing/blocking.

This is a configuration gate only. It does not build the app, install it on iOS, or mark SQLCipher evidence complete.

## Security Status

Phase 86 does not change CipherChat's production security status. Signal/libsignal, production file encryption, non-exportable native signing keys, push provider evidence, iOS SQLCipher runtime evidence, external security review, and moderate Expo transitive advisories remain blockers.
