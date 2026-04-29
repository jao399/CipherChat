# CipherChat Development-Client Verification

Use this checklist before treating native storage, SecureStore, or future Signal/MLS modules as verified.

## Preconditions

- `npm run validate:ci` passes.
- EAS project access is configured.
- Android platform tools are available when testing an Android emulator or physical device.
- macOS/Xcode is available when testing iOS simulator builds locally.

## Configuration gate

```bash
npm run verify:dev-build-config
```

Warnings about missing local `eas` or `adb` are environment warnings. Configuration failures must be fixed before building.

## Android development client

```bash
npx eas build --profile development --platform android
```

After the APK is available:

1. Install the APK on an Android emulator or physical device.
2. Start Metro with `npm start -- --dev-client`.
3. Launch CipherChat from the installed development client.
4. Complete splash, onboarding, welcome, and device verification.
5. Open Settings.
6. Confirm `Encrypted Local Database` reports native availability and schema status.
7. In development builds, open `Migration Readiness`.
8. Confirm prototype records can be inspected without copying plaintext message bodies.
9. Run `Copy to Encrypted Database` only after the database reports `encrypted=true`.
10. Confirm no crashes in the development-client logs.

## iOS simulator development client

First verify that this machine is capable of checking the iOS SQLCipher path:

```bash
npm run verify:ios-sqlcipher-readiness
```

```bash
npx eas build --profile development --platform ios
```

After the simulator build is available:

1. Install the simulator artifact on a macOS host.
2. Start Metro with `npm start -- --dev-client`.
3. Launch CipherChat from the installed simulator app.
4. Complete the same flow as Android.
5. Confirm SecureStore and OP-SQLite behavior match Android expectations.

## SQLCipher acceptance gate

Do not migrate sensitive prototype stores until the installed development client confirms:

- encrypted database adapter is available
- database key is provisioned through SecureStore
- schema v1 applies successfully
- adapter reports `encrypted=true`
- migration preview count matches expected prototype records
- source AsyncStorage records are preserved after copy

## Failure handling

If SQLCipher is unavailable in the installed development client:

- keep plaintext message persistence blocked
- do not enable migration deletion
- record the device, OS, build profile, app version, and logs
- fix native build configuration before continuing production security work
