# Gate 2a - Android libsignal Bridge Skeleton

Date: 2026-05-03

Branch: `gate-02a-android-libsignal-bridge-skeleton`

This work starts the Android side of Gate 2 by preparing an Expo development-build compatible native bridge skeleton. It does not implement production E2EE, does not perform encryption/decryption, and does not enable production message sending.

## Approach Chosen

CipherChat is a managed Expo app with no committed `android/` native project. The safest Android path is an Expo config plugin that generates the bridge during prebuild/EAS instead of committing generated native project files.

Chosen approach:

- local Expo config plugin: `plugins/withCipherChatAndroidLibsignalBridge.js`,
- Java React Native native module skeleton generated under the Android package during prebuild,
- app Gradle dependency/repository injection during prebuild,
- TypeScript readiness wrapper in `src/services/messages/signalNativeAdapter.ts`.

This avoids committing generated native folders, APKs, AABs, Gradle caches, or build output.

## Official libsignal Artifact

The plugin pins official Signal artifacts:

- `org.signal:libsignal-android:0.86.5`
- `org.signal:libsignal-client:0.86.5`

Source:

- official repository guidance: `https://github.com/signalapp/libsignal`
- official Maven repository: `https://build-artifacts.signal.org/libraries/maven/`

The version is pinned. No dynamic `latest` dependency is used. No unofficial crypto package is added.

## Generated Android Skeleton

During Expo prebuild/EAS, the config plugin writes:

- `CipherChatSignalBridgeModule.java`
- `CipherChatSignalBridgePackage.java`

The skeleton exposes only readiness metadata:

- `adapterInstalled: true`,
- `platform: android`,
- `libraryTarget: official libsignal Android artifact`,
- `androidPackage: org.signal:libsignal-android`,
- `companionPackage: org.signal:libsignal-client`,
- `officialLibsignalVersion: 0.86.5`,
- `productionReady: false`,
- `missingRequirements` with the implementation and evidence still required.

The skeleton rejects `encryptOneToOne` and `decryptOneToOne` with `CIPHERCHAT_SIGNAL_NOT_IMPLEMENTED`.

## Missing Requirements

Production readiness remains blocked because these are not implemented:

- X3DH identity and prekey generation,
- Double Ratchet encrypt/decrypt,
- encrypted Signal session storage,
- safety-number verification,
- key-change warnings,
- Android runtime evidence,
- external security review.

## TypeScript Wrapper

`src/services/messages/signalNativeAdapter.ts` now includes:

- `SignalAndroidBridgeReadiness`,
- `SignalAndroidNativeBridge`,
- `officialAndroidLibsignalVersion`,
- `missingAndroidLibsignalBridgeRequirements`,
- `readAndroidSignalBridgeReadiness`,
- `getInstalledAndroidSignalNativeBridge`,
- `readInstalledAndroidSignalBridgeReadiness`.

The wrapper safely reports `adapterInstalled=false` when the native bridge is unavailable, which is expected in Expo Go and Node tests. Even when a skeleton bridge is present, it reports `productionReady=false`.

## Expo Go Limitation

Expo Go cannot load this custom native bridge and cannot link official libsignal artifacts. The Android bridge can only be tested in an Expo development build, EAS preview APK, or generated native Android project.

## Production Status

Gate 2 is still blocked. This skeleton is not reviewed production crypto. Existing fail-closed message crypto gates remain active, and live production message sending is still blocked without a reviewed Signal/libsignal adapter.

## Validation Notes

The safe validation path for this branch is:

```powershell
npm run typecheck
npm test
npm run validate:ci
npx expo-doctor
npm run verify:release-evidence
```

The next native validation step is to run Expo prebuild or EAS Android preview in a clean environment and confirm the generated Java module compiles with the pinned official Signal artifacts.

## Next Implementation Step

Implement the Android Kotlin/Java bridge methods behind `CipherChatSignalBridgeModule` for identity key generation and signed/one-time prekey generation using official libsignal APIs, while keeping readiness false until X3DH, Double Ratchet, encrypted session storage, safety-number behavior, and external review evidence pass.
