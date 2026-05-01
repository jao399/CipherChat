# Android SQLCipher Evidence

Evidence status: phase-75-bluestacks-release-candidate-runtime-passed
Blocking status: complete-for-this-android-release-candidate-apk
Last verified: Phase 75 BlueStacks Android release-candidate APK runtime verification

## Current Evidence

Phase 41 documented Android development-client SQLCipher availability for the secure local database boundary.

Phase 73 refreshed the Android development runtime path on BlueStacks. The installed Expo development build loaded the current CipherChat bundle, opened Settings > Development Evidence > SQLCipher Runtime Check, and reported:

```text
SQLCipher check passed
SQLCipher runtime verification passed: encrypted database opened, schema v1 applied, and a harmless test record round-tripped.
```

This proves the current development build can execute the SQLCipher runtime probe on the available BlueStacks Android runtime. It does not replace release-candidate evidence for a production build by itself.

Phase 75 added a release-candidate path and ran the same SQLCipher probe against an installed Android release APK on BlueStacks. That release-candidate result is now the current Android evidence for this APK only.

## BlueStacks Development Runtime Workflow

BlueStacks can be used as an Android development runtime target when a physical Android device or standard emulator is not available. Treat this as development evidence only.

1. Enable ADB in BlueStacks:
   - Open BlueStacks Settings.
   - Go to Advanced.
   - Enable Android Debug Bridge / ADB.
   - Restart BlueStacks if `adb devices` does not show a target.
2. Prefer one ADB binary for the whole session. On this machine, the BlueStacks binary is:

```powershell
& "C:\Program Files\BlueStacks_nxt\HD-Adb.exe" devices -l
```

If Android SDK ADB is preferred, use:

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" devices -l
```

If the BlueStacks and SDK ADB server versions conflict, run `adb kill-server` for the binary in use and then continue with only one binary.

3. Detect the BlueStacks target:

```powershell
& "C:\Program Files\BlueStacks_nxt\HD-Adb.exe" connect 127.0.0.1:5555
& "C:\Program Files\BlueStacks_nxt\HD-Adb.exe" devices -l
netstat -ano | Select-String -Pattern ':5555|:5037'
```

Observed Phase 73 target:

```text
emulator-5554 device
ro.product.manufacturer=samsung
ro.product.model=SM-S908E
ro.build.version.release=9
```

4. Install the Android debug development build:

```powershell
& "C:\Program Files\BlueStacks_nxt\HD-Adb.exe" -s emulator-5554 install -r -t android\app\build\outputs\apk\debug\app-debug.apk
```

Observed Phase 73 result:

```text
Success
package:com.amgadalzomi.cipherchat
```

5. Start Metro for the Expo development client and reverse the port:

```powershell
npx expo start --dev-client --host lan --port 8083
& "C:\Program Files\BlueStacks_nxt\HD-Adb.exe" -s emulator-5554 reverse tcp:8083 tcp:8083
```

6. Open the development client URL:

```powershell
& "C:\Program Files\BlueStacks_nxt\HD-Adb.exe" -s emulator-5554 shell am start -a android.intent.action.VIEW -d "cipherchat://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8083"
```

7. In the app:
   - Close the Expo development menu if it is visible.
   - Complete or skip onboarding.
   - Sign in or sign up.
   - Trust the device safety number for the local demo.
   - Open Settings.
   - Scroll to Development Evidence.
   - Run SQLCipher Runtime Check.
   - Record the pass/fail result without message content, filenames, contact graph data, private keys, tokens, safety numbers, or decrypted identifiers.

## BlueStacks Phase 73 Result

- BlueStacks detected: yes, as `emulator-5554`.
- App installed: yes, `android\app\build\outputs\apk\debug\app-debug.apk` installed with `Success`.
- Current JavaScript bundle loaded: yes, via Expo development client and Metro on port `8083`.
- SQLCipher probe passed: yes, the app reported encrypted DB open, schema v1 applied, and harmless record round-trip.
- Evidence classification: BlueStacks development runtime evidence completed.
- Production classification: development evidence only; Phase 75 is the release-candidate evidence for the current APK.

## BlueStacks Phase 75 Release-Candidate Result

BlueStacks was used as the Android runtime target for the installed release-candidate APK.

- BlueStacks detected: yes, as `emulator-5554`.
- Target details: Android 9, model `SM_S908E`.
- EAS CLI availability: `npx eas --version` failed locally with `could not determine executable to run`, so an equivalent local native Gradle release APK was built instead of using the hosted EAS CLI.
- Build command:

```powershell
$env:EXPO_PUBLIC_CIPHERCHAT_API_MODE='mock'
$env:EXPO_PUBLIC_CIPHERCHAT_RELEASE_EVIDENCE='true'
cd android
.\gradlew.bat :app:assembleRelease
```

- Build result: `BUILD SUCCESSFUL`.
- Native SQLCipher path: Gradle reported `[OP-SQLITE] using sqlcipher.`
- Artifact: `android\app\build\outputs\apk\release\app-release.apk`
- Artifact size: `110666771` bytes.
- Artifact timestamp: `2026-05-01 13:31:55` local workstation time.
- Install command:

```powershell
& "C:\Program Files\BlueStacks_nxt\HD-Adb.exe" -s emulator-5554 install -r android\app\build\outputs\apk\release\app-release.apk
```

- Install result: `Success`.
- Launch target: `com.amgadalzomi.cipherchat/.MainActivity`.
- App path: Welcome/auth to Device Verification to Settings.
- Evidence action: Settings > Release Evidence > SQLCipher Runtime Check.
- SQLCipher probe result:

```text
SQLCipher check passed
SQLCipher runtime verification passed: encrypted database opened, schema v1 applied, and a harmless test record round-tripped.
```

This closes Android SQLCipher runtime evidence for this exact release-candidate APK. Every future Android release-candidate APK must repeat the same runtime probe before being treated as covered.

## Required Future Release Evidence

- Re-run this workflow for every new Android release-candidate APK.
- Run `npm run collect:sqlcipher-evidence` to capture static project configuration and manual runtime steps.
- Confirm the runtime check opens the encrypted database, applies schema v1, writes/reads/deletes the harmless verification record, and reports `encrypted=true`.
- Capture logs or screenshots showing the adapter status without message content, filenames, contact graph data, private keys, tokens, safety numbers, or decrypted identifiers.
- Attach the evidence to this document or the external audit packet.

## Production Status

Android SQLCipher runtime evidence is complete for the Phase 75 BlueStacks release-candidate APK. iOS SQLCipher runtime evidence, Signal/libsignal production crypto, production file crypto, native non-exportable signing key evidence, push provider evidence, dependency review, and external security review remain production blockers.
