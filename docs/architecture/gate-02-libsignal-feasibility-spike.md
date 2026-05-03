# Gate 2 - Official Signal/libsignal Feasibility Spike

Date: 2026-05-03

Branch: `gate-02-libsignal-feasibility-spike`

This spike prepares CipherChat for a future official Signal/libsignal integration. It does not install libsignal, does not implement production encryption, and does not enable production message sending.

## Feasibility Conclusion

Gate 2 is technically feasible as a native React Native integration, but it is not complete. The practical path is:

- Android: Kotlin/Java native module wrapping official `org.signal` libsignal artifacts.
- iOS: Swift native module wrapping official `LibSignalClient`.
- JavaScript: a narrow TypeScript contract that maps native operations into the existing fail-closed `SignalOneToOneCryptoAdapter` and prekey generation boundaries.

The work is blocked by native implementation, license review, interoperability testing, encrypted session storage evidence, and external cryptography review.

## Official Package Options

Official sources checked:

- `https://github.com/signalapp/libsignal`
- `https://signal.org/docs/`
- `https://build-artifacts.signal.org/libraries/maven/`
- `https://central.sonatype.com/artifact/org.signal/libsignal-client`
- `https://raw.githubusercontent.com/signalapp/libsignal/main/LibSignalClient.podspec`
- `https://raw.githubusercontent.com/signalapp/libsignal/main/swift/README.md`

The official libsignal repository describes Java, Swift, and TypeScript wrappers over Rust implementations. It also states that use outside Signal is unsupported and APIs or bridge layers may change without notice. CipherChat must treat this as an integration risk.

### Android

Preferred path:

- Use official Signal Maven artifacts, primarily `org.signal:libsignal-android` and `org.signal:libsignal-client` from Signal build artifacts, with Maven Central as historical/metadata reference.
- Implement a Kotlin/Java native module in the Android app.
- Exclude non-Android native libraries from packaged APK/AAB as recommended by the libsignal README.
- Pin exact libsignal versions in Gradle and document the selected artifact/version in the production evidence record.

### iOS

Preferred path:

- Use the official `LibSignalClient` CocoaPod.
- Integrate through Swift native module code.
- Use the CocoaPods flow, because the official Swift README says Swift Package use is not supported for client integration.
- Account for `use_frameworks!`, iOS 15 minimum in the podspec, FFI prebuild checksums, and EAS cloud build compatibility.

## Android Bridge Approach

Create a React Native native module in Kotlin or Java that owns all libsignal calls. JavaScript should never receive private identity keys, prekey private material, ratchet keys, skipped message keys, or serialized plaintext session material.

The Android bridge should expose only:

- readiness/evidence report,
- identity public key metadata,
- public signed prekey material,
- public one-time prekey material,
- X3DH session creation,
- Double Ratchet encrypt/decrypt,
- opaque encrypted session snapshot references,
- safety-number/fingerprint strings for display,
- identity-change result codes.

## iOS Bridge Approach

Create a Swift native module that wraps `LibSignalClient` and mirrors the Android bridge. The Swift bridge should keep private material inside native/libsignal storage and return only public keys, opaque ciphertext/header values, fingerprints, evidence metadata, and non-sensitive error codes.

The iOS bridge must be validated through an EAS iOS device/TestFlight build because Expo Go cannot load this custom native module.

## Expo Development Build Requirements

The libsignal path requires custom native code and native dependencies, so it requires:

- Expo development build for local testing,
- EAS Android/iOS builds or local native builds,
- config plugin or prebuild changes for Gradle, CocoaPods, and native module registration,
- Android NDK/packaging validation,
- iOS CocoaPods validation,
- release-like runtime evidence for both platforms.

## What Cannot Work In Expo Go

Expo Go cannot load the custom Kotlin/Java or Swift native bridge, cannot link `org.signal` native artifacts, cannot link `LibSignalClient`, and cannot prove runtime native adapter behavior. Expo Go can remain useful for UI-only mock mode, but it cannot be used as Gate 2 production evidence.

## Required Native APIs

The TypeScript feasibility contract is in `src/services/messages/signalNativeAdapter.ts`. A production bridge must implement these capabilities:

- identity key generation,
- signed prekey generation,
- one-time prekey generation,
- X3DH session creation from validated `signal-x3dh-v1` bundles,
- Double Ratchet one-to-one encrypt/decrypt,
- session serialization as encrypted opaque state only,
- session restore/delete,
- safety number or identity fingerprint derivation,
- key-change detection,
- readiness/evidence reporting.

## Local Encrypted Storage Requirements

Signal session state must be stored only in verified encrypted storage:

- Android and iOS SQLCipher runtime evidence must be complete for the tested artifacts.
- Session snapshots must be encrypted/opaque before persistence.
- Plaintext messages stay in transient UI state only.
- Session metadata must not include plaintext message bodies, filenames, tokens, safety numbers, contact graph identifiers, or private keys.
- Migration from prototype stores must not convert prototype envelopes into production Signal sessions.

## Migration Path From Prototype Provider

1. Keep `prototype-sha256-envelope-v1` mock-only.
2. Add native Android and iOS bridges behind `SignalNativeAdapter`.
3. Wrap the native bridge with the existing `SignalOneToOneCryptoAdapter` and `SignalPrekeyGenerationAdapter`.
4. Generate new Signal identity/prekey material for live accounts.
5. Require users to review safety numbers before first production live send.
6. Store sessions only after encrypted database evidence passes.
7. Keep live sends fail-closed until all Gate 2 evidence is complete.

## Risks And Unknowns

- Official libsignal use outside Signal is unsupported.
- Java, Swift, TypeScript, JNI, C, and bridge APIs may change.
- libsignal is AGPLv3; release and distribution need legal/owner approval.
- iOS CocoaPods integration may require `use_frameworks!` and explicit module/header-search work.
- EAS iOS builds must prove the pod and FFI prebuild flow work.
- Android packaging must exclude non-Android native libraries from final app artifacts.
- CipherChat must decide whether to store Signal sessions in SQLCipher or native storage, then prove the selected path.
- External cryptography review is required before production sends.

## Exact Proof Needed Before Gate 2 Can Close

- Official libsignal version pinned for Android and iOS.
- Android native module compiles in a release-candidate build.
- iOS Swift native module compiles in an EAS device/TestFlight build.
- X3DH/prekey interoperability tests pass.
- Double Ratchet encrypt/decrypt tests pass.
- Changed-key and safety-number behavior matches existing trust policy.
- Encrypted local session storage evidence is attached for Android and iOS.
- Production live sending remains blocked when adapter readiness is incomplete.
- No plaintext, private keys, public prekey values, safety numbers, tokens, filenames, or contact graph data appear in logs.
- External cryptography/security review accepts the adapter and remediation is tracked.

## Current Status After This Spike

- `src/services/messages/signalNativeAdapter.ts` defines the TypeScript native bridge contract.
- Tests prove the contract alone does not enable production readiness.
- No native package was installed.
- No production Signal/libsignal support is claimed.
- Gate 2 remains blocked.
