# Android SQLCipher Evidence

Evidence status: phase-73-bluestacks-development-runtime-passed-release-candidate-refresh-required
Blocking status: release-candidate-refresh-required-before-production
Last verified: Phase 73 BlueStacks Android development-client runtime verification

## Current Evidence

Phase 41 documented Android development-client SQLCipher availability for the secure local database boundary.

Phase 73 refreshed the Android development runtime path on BlueStacks. The installed Expo development build loaded the current CipherChat bundle, opened Settings > Development Evidence > SQLCipher Runtime Check, and reported:

```text
SQLCipher check passed
SQLCipher runtime verification passed: encrypted database opened, schema v1 applied, and a harmless test record round-tripped.
```

This proves the current development build can execute the SQLCipher runtime probe on the available BlueStacks Android runtime. It does not replace release-candidate evidence for the exact production build.

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
- Production classification: Android release-candidate SQLCipher evidence still blocking until the exact release-candidate APK/build is installed and the same probe passes there.

## Required Release Evidence

- Build and install the Android Expo development client for the release-candidate configuration.
- Run `npm run collect:sqlcipher-evidence` to capture static project configuration and manual runtime steps.
- Open CipherChat and go to Settings > Development Evidence > SQLCipher Runtime Check.
- Confirm the runtime check opens the encrypted database, applies schema v1, writes/reads/deletes the harmless verification record, and reports `encrypted=true`.
- Capture logs or screenshots showing the adapter status without message content, filenames, contact graph data, private keys, tokens, safety numbers, or decrypted identifiers.
- Attach the evidence to this document or the external audit packet.

## Production Status

BlueStacks supports the development runtime probe in Phase 73. This remains blocking for production until release-candidate Android evidence is captured from the exact build under review. Demo and mock mode remain usable.
