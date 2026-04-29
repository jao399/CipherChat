# Phase 41: Android Development Client SQLCipher Verification

Phase 41 validates that CipherChat can run as a native Android build and initialize the encrypted local database through the real `@op-engineering/op-sqlite` SQLCipher adapter.

## Scope

- Built a native Android debug development client from the Expo project.
- Built and installed a release-style Android APK for emulator runtime verification.
- Verified the app launches on the Android emulator and reaches the main tab shell.
- Triggered the Settings > Prototype Backend > Encrypted Local Database row.
- Confirmed the runtime status changes from `Schema v1 planned` to `Available - schema v1`.

## Environment

- Android emulator: `Medium_Phone_API_36.1`
- Device id: `emulator-5554`
- Package: `com.amgadalzomi.cipherchat`
- Release APK: `android/app/build/outputs/apk/release/app-release.apk`

The generated `android/` project remains ignored and is treated as local native build output.

## Native Build Notes

The native build required `expo-splash-screen` because the development client runtime expected the splash screen native module. This dependency is now installed through Expo-compatible package resolution.

The local Android SDK had a partial/corrupt NDK `27.0.12077973` installation. For local verification only, the generated Android project was pointed at the installed NDK `27.1.12297006`. The build output included:

```text
[OP-SQLITE] using sqlcipher.
```

## Runtime Result

The Android release APK launched successfully after install. The app rendered the welcome flow, signed into the main mock app shell, opened Settings, and initialized the encrypted local database row. The visible runtime status after tapping the row was:

```text
Encrypted Local Database
Available - schema v1 - 3 prototype stores to migrate
```

This confirms that the Android native SQLCipher adapter is present and usable by the app runtime.

## Follow-Up

- Keep Android SQLCipher verification in the release smoke checklist.
- Move the local NDK override into documented machine setup instead of committing generated native files.
- Add a deterministic automated Detox/Maestro smoke test later so this row can be checked without manual ADB taps.
