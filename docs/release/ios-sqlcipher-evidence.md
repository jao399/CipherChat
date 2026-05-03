# iOS SQLCipher Evidence

Evidence status: missing
Blocking status: blocking-before-production
Last verified: not verified on this Windows workspace

## Current Evidence

No iOS SQLCipher runtime evidence is available from this Windows workspace. iOS verification requires macOS/Xcode for simulator or local builds, or an EAS iOS internal build installed on an enrolled iOS device.

Android Phase 75 evidence does not close this item. The iOS blocker closes only after the iOS app is built, installed, opened, and Settings > Release Evidence or Development Evidence > SQLCipher Runtime Check reports a pass.

## Required Passing Result

The captured result must show:

```text
SQLCipher check passed
SQLCipher runtime verification passed: encrypted database opened, schema v1 applied, and a harmless test record round-tripped.
```

The check must prove that the adapter reports `encrypted=true`, schema v1 is applied, and the harmless `deviceMetadata` verification record is written, read, and deleted. The record must not contain message text, file content, filenames, contact graph data, private keys, tokens, safety numbers, or decrypted identifiers.

## EAS iOS Cloud Build From Windows

Use EAS cloud builds from Windows when macOS/Xcode is not available locally. This prepares an installable iOS artifact, but it does not close the evidence blocker until the installed app passes the runtime check on an iPhone or TestFlight build.

### Internal iPhone Build

Use this path for an enrolled iPhone/ad hoc internal build.

```powershell
npx eas-cli@latest login
npx eas-cli@latest whoami
npx eas-cli@latest device:create
npm run eas:ios:device-preview
```

Install the resulting internal build on the enrolled iPhone using the EAS install link. Open CipherChat, complete the demo entry flow, open Settings > Release Evidence, run SQLCipher Runtime Check, and record the pass/fail result.

### TestFlight Build

Use this path when Apple Developer Program and App Store Connect access are ready.

```powershell
npx eas-cli@latest login
npx eas-cli@latest whoami
npm run eas:ios:testflight
npm run eas:ios:submit-latest
```

Install the TestFlight build on an enrolled tester iPhone. Open CipherChat, complete the demo entry flow, open Settings > Release Evidence, run SQLCipher Runtime Check, and record the pass/fail result.

Do not commit Apple credentials, certificates, provisioning profiles, App Store Connect API keys, EAS credentials, logs with secrets, screenshots with private data, or build artifacts.

## EAS iOS Internal Build Path

Use this path when an enrolled iOS device and EAS credentials are available.

1. Confirm the preview profile exposes the release evidence control:

```powershell
npm run collect:sqlcipher-evidence
```

2. Build the iOS preview/internal artifact:

```powershell
npm run eas:ios:device-preview
```

3. Install the resulting internal build on the enrolled iOS device using the EAS installation link or Apple internal distribution flow.
4. Open CipherChat on the device.
5. Complete the demo entry flow:
   - complete or skip onboarding,
   - sign in or sign up,
   - complete Device Verification,
   - open Settings.
6. Scroll to Release Evidence.
7. Run SQLCipher Runtime Check.
8. Capture a screenshot or device log showing the pass/fail result.

Do not capture message content, filenames, contact graph data, private keys, tokens, safety numbers, push tokens, or decrypted identifiers.

## macOS/Xcode Simulator Development Path

Use this path for repeatable development evidence. It is useful before device testing, but production release evidence should still be captured from the release-candidate build under review.

1. On macOS with Xcode installed, install dependencies:

```bash
npm install
```

2. Build an iOS simulator development client:

```bash
npx eas build --profile development --platform ios --local
```

If local EAS is unavailable, run a hosted EAS development build for iOS simulator.

3. Boot a simulator and install the produced app:

```bash
xcrun simctl list devices available
xcrun simctl boot "iPhone 16"
xcrun simctl install booted <path-to-CipherChat.app>
```

4. Start Metro and launch the app:

```bash
npx expo start --dev-client
xcrun simctl launch booted com.amgadalzomi.cipherchat
```

5. In CipherChat, open Settings > Development Evidence > SQLCipher Runtime Check.
6. Capture the pass/fail result and attach it to this document.

## macOS/Xcode Local Release-Candidate Path

Use this path only when native iOS prebuild and signing are available locally.

```bash
EXPO_PUBLIC_CIPHERCHAT_API_MODE=mock EXPO_PUBLIC_CIPHERCHAT_RELEASE_EVIDENCE=true npx expo prebuild --platform ios
EXPO_PUBLIC_CIPHERCHAT_API_MODE=mock EXPO_PUBLIC_CIPHERCHAT_RELEASE_EVIDENCE=true npx expo run:ios --configuration Release
```

Then open Settings > Release Evidence > SQLCipher Runtime Check and record the result. If the app cannot install, the native SQLCipher module cannot load, or the check fails, keep this evidence blocking and document the exact error.

## Evidence To Attach

- Build profile and command used.
- Artifact identifier or EAS build URL.
- Device or simulator model and iOS version.
- App installation result.
- Screenshot or logs showing the SQLCipher check title and result.
- Confirmation that no sensitive app data was captured.
- Any failure logs needed to reproduce an install/module/runtime failure, with secrets and identifiers redacted.

## Production Status

This remains blocking for production. Demo and mock mode remain usable, and production claims must not say iOS encrypted storage has been verified until this evidence exists.
