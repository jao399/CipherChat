# Phase 73 - Runtime SQLCipher Evidence Workflow

Phase 73 makes SQLCipher runtime verification easier to repeat without pretending local configuration is device evidence.

## What Changed

- `src/services/local/sqlCipherRuntimeVerification.ts` runs a focused runtime check through the encrypted local database port.
- Settings now includes a development-only `SQLCipher Runtime Check` action.
- Phase 75 exposes the same action in release-candidate APKs when `EXPO_PUBLIC_CIPHERCHAT_RELEASE_EVIDENCE=true`.
- `scripts/collect-sqlcipher-evidence.mjs` summarizes static project configuration and prints manual Android/iOS runtime evidence steps.
- Release evidence documents now point reviewers to the in-app verification action.
- Android development runtime verification now includes a BlueStacks workflow for teams that have BlueStacks available instead of a standard Android emulator.

## Runtime Check

The in-app check:

1. initializes the encrypted database adapter,
2. applies schema v1 through the existing OP-SQLite boundary,
3. writes a harmless `deviceMetadata` verification record,
4. reads that record back,
5. confirms `encrypted=true`,
6. deletes the verification record.

The record contains only a fixed non-sensitive marker. It does not contain message text, file content, filenames, contact graph data, private keys, tokens, safety numbers, or decrypted identifiers.

## BlueStacks Android Workflow

BlueStacks can be used for Android development runtime evidence, but it is not final production evidence for device-bound key storage or release-candidate signing. The documented workflow is:

1. Enable Android Debug Bridge / ADB in BlueStacks Settings > Advanced.
2. Detect the target with `C:\Program Files\BlueStacks_nxt\HD-Adb.exe devices -l`.
3. Install the Expo development APK with `HD-Adb.exe -s <serial> install -r -t android\app\build\outputs\apk\debug\app-debug.apk`.
4. Start Metro with `npx expo start --dev-client --host lan --port 8083`.
5. Reverse the Metro port with `HD-Adb.exe -s <serial> reverse tcp:8083 tcp:8083`.
6. Open the development client deep link.
7. Navigate to Settings > Development Evidence > SQLCipher Runtime Check.
8. Record the pass/fail result without sensitive app data.

Phase 73 observed BlueStacks as `emulator-5554`, installed the development APK successfully, loaded the current Expo development bundle, and received `SQLCipher check passed` from the in-app probe.

## BlueStacks Release-Candidate Workflow

For Android release-candidate evidence, build an installable APK with the release evidence flag enabled:

```powershell
$env:EXPO_PUBLIC_CIPHERCHAT_API_MODE='mock'
$env:EXPO_PUBLIC_CIPHERCHAT_RELEASE_EVIDENCE='true'
cd android
.\gradlew.bat :app:assembleRelease
```

Install the APK on BlueStacks and run Settings > Release Evidence > SQLCipher Runtime Check:

```powershell
& "C:\Program Files\BlueStacks_nxt\HD-Adb.exe" -s emulator-5554 install -r android\app\build\outputs\apk\release\app-release.apk
& "C:\Program Files\BlueStacks_nxt\HD-Adb.exe" -s emulator-5554 shell am start -n com.amgadalzomi.cipherchat/.MainActivity
```

Phase 75 installed the release APK on BlueStacks `emulator-5554` and the in-app SQLCipher probe passed. This is valid Android SQLCipher runtime evidence for that exact APK only. It must be repeated for future release-candidate artifacts.

## Production Status

BlueStacks development runtime evidence is captured for Android, and Phase 75 captured Android release-candidate evidence for the current APK. iOS runtime evidence remains blocking until screenshots or logs are captured from an installed iOS client for the exact build under review. CI checks placeholders and configuration only.
