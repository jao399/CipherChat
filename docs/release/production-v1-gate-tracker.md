# CipherChat Production v1 Gate Tracker

Date: 2026-05-03

Branch: `production-v1`

CipherChat is not production-ready encrypted messaging software. This tracker replaces the open-ended phase loop with a fixed production-candidate gate list. A gate can move to complete only when the listed evidence exists and has been reviewed.

## Gate Summary

| Gate | Current status | Exact evidence needed | Implementation tasks | Tests required | Owner/action needed from Amgad | Blocking external dependency | Completion criteria |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1. iOS SQLCipher runtime evidence | Active workstream; still blocking | Installed iOS device or TestFlight build screenshot/log showing Settings > Release Evidence > SQLCipher Runtime Check passed with `encrypted=true` and schema v1; matching build profile, commit SHA, bundle id, date, and device/iOS version recorded in `docs/release/ios-sqlcipher-evidence.md` | Use existing EAS iOS device/TestFlight profiles from Windows; build signed iOS artifact; install on enrolled iPhone or TestFlight; run app; complete entry flow; run SQLCipher check; capture public-safe evidence | `npm run validate:ci`; `npm run verify:eas-ios-cloud-build`; `npm run verify:release-evidence`; `npm run collect:sqlcipher-evidence`; manual installed-iOS SQLCipher probe | Enroll Apple Developer device or TestFlight tester; run the iPhone/TestFlight app; capture evidence without secrets or personal data | Apple Developer account, EAS cloud build, physical iPhone or TestFlight install path | `docs/release/ios-sqlcipher-evidence.md` says complete for the exact tested iOS artifact, `verify:release-evidence` reports iOS complete, and reviewer accepts evidence |
| 2. Real reviewed Signal/libsignal adapter | Android bridge skeleton prepared; still blocking | Adapter design review, dependency/license review, Android Java/Kotlin bridge compile proof, iOS Swift bridge proof, official libsignal version pin, X3DH/prekey vectors, Double Ratchet session tests, interoperability evidence, external crypto review sign-off | Use `docs/architecture/gate-02-libsignal-feasibility-spike.md` and `docs/architecture/gate-02a-android-libsignal-bridge-skeleton.md`; compile Android bridge with pinned `org.signal` artifacts; implement X3DH/prekey APIs; implement Double Ratchet APIs; implement encrypted session storage; implement iOS bridge to `LibSignalClient`; keep production send fail-closed until evidence exists | Native unit tests; JS adapter contract tests; Android bridge build test; X3DH prekey validation; Double Ratchet send/receive vectors; changed-key/safety-number tests; encrypted session storage tests; live send fail-closed regression tests | Approve AGPLv3/legal risk and implementation scope; provide review budget; choose whether to proceed with official libsignal despite unsupported external API warning | Signal libsignal API stability/support policy, AGPLv3 license review, native Android/iOS build environment, external cryptography reviewer | Reviewed adapter is installed, production readiness checks pass, live one-to-one sends use reviewed Signal/libsignal provider, prototype provider remains blocked in production, and external review accepts the implementation |
| 3. Native non-exportable signing keys for Android/iOS | Blocking | Runtime proof that device auth private keys are generated and retained in Android Keystore and iOS Keychain/Secure Enclave where possible; public-key-only export; challenge signing without exposing private bytes to JavaScript; review evidence | Implement native signing key provider behind Phase 87 boundary; Android Keystore provider; iOS Keychain/Secure Enclave provider; rotation/revocation; Settings evidence reporting | Provider descriptor/readiness tests; native challenge-signing tests; export-blocking tests; rotation/revocation tests; release runtime evidence checks | Provide physical iPhone and Android release target; approve native provider review; capture runtime evidence | Android Keystore behavior, iOS Keychain/Secure Enclave constraints, native module review | `evaluateNativeSigningKeyReadiness` reports ready only for reviewed native providers with complete evidence; SecureStore remains demo-only |
| 4. Reviewed production file encryption adapter | Blocking | Review report and tests proving authenticated encryption, per-file random keys, encrypted filenames/MIME/thumbnails, per-recipient key wrapping, chunk integrity, resumable upload safety, no plaintext durable persistence | Implement adapter behind file crypto boundary; encrypted metadata model; chunking and upload policy; key wrapping; local encrypted metadata; failure handling | File crypto policy tests; large-file/chunk tests; metadata encryption tests; plaintext persistence tests; multi-recipient key wrapping tests; download/decrypt integrity tests | Approve adapter design and review budget; provide target file-size/product requirements | Reviewed crypto library/adapter selection, external security review | Secure file transfer no longer uses prototype path for production and readiness gate passes with review evidence |
| 5. APNs/FCM provider wiring and evidence | Blocking | Provider configuration evidence from deployment secrets; generic wake-only payload log review; APNs and FCM smoke results; proof no message text, sender names, filenames, conversation ids, account/contact graph ids, tokens, or safety numbers appear in payloads/logs | Wire provider ports; configure APNs/FCM through secrets only; add release smoke checks; add provider log review process; keep fail-closed production config | Push policy tests; provider readiness tests; API config tests; release smoke tests; log redaction review | Provide Apple/Firebase project access and credentials through secret manager only; run smoke checks | Apple APNs, Firebase FCM, deployment secret manager | Production push provider readiness reports complete evidence and generic payload policy remains enforced |
| 6. External security review package and remediation tracking | Blocking | External review report, finding list, severity ratings, remediation PRs, retest evidence, final reviewer sign-off | Freeze review scope; attach evidence manifest; provide native adapter internals; track findings; remediate and retest | `npm run validate:ci`; reviewer-required tests; regression tests for every fixed finding | Select reviewer, provide budget, review schedule, and acceptance authority | External security reviewer availability | All critical/high findings fixed or formally accepted; reviewer sign-off attached |
| 7. Moderate Expo advisory remediation or formal risk acceptance | Blocking for production release decision | Current `npm audit --audit-level=moderate` output, Expo-compatible remediation attempt or documented risk acceptance, owner sign-off, retest after any Expo upgrade | Monitor Expo SDK advisories; test safe upgrade path; avoid forced breaking downgrade; refresh Android/iOS SQLCipher evidence after dependency changes | `npm audit --audit-level=moderate`; `npm run validate:ci`; Android/iOS runtime evidence refresh after upgrade | Decide whether to wait for Expo-compatible fix or formally accept risk for a production-candidate release | Expo upstream dependency releases, security advisory updates | Advisories are resolved through validated upgrade or accepted with documented owner/security-review sign-off |

## Active Workstream 1 - Gate 1 iOS SQLCipher Evidence From Windows

The Windows host can prepare EAS iOS cloud builds but cannot complete iOS runtime evidence by itself. The blocker closes only after an installed iPhone/TestFlight build runs the SQLCipher check successfully.

### Prepared Flow

1. Verify static readiness:

   ```powershell
   npm run verify:eas-ios-cloud-build
   npm run collect:sqlcipher-evidence
   ```

2. Authenticate EAS:

   ```powershell
   npx eas-cli@latest login
   npx eas-cli@latest whoami
   ```

3. For internal iPhone install, enroll the device and build:

   ```powershell
   npx eas-cli@latest device:create
   npm run eas:ios:device-preview
   ```

4. For TestFlight, build and submit:

   ```powershell
   npm run eas:ios:testflight
   npm run eas:ios:submit-latest
   ```

5. Install the resulting app on an enrolled iPhone or through TestFlight.
6. Open CipherChat and complete the demo entry flow.
7. Open Settings > Release Evidence > SQLCipher Runtime Check.
8. Run the check.
9. Capture only public-safe evidence: pass/fail result, `encrypted=true`, schema version, app version/build profile, commit SHA, device model, iOS version, and date. Do not capture message content, filenames, contacts, tokens, private keys, safety numbers, or personal data.
10. Update `docs/release/ios-sqlcipher-evidence.md` only if the installed app passes.

### Completion Rule

Gate 1 remains open until the iOS app is actually installed and the runtime check passes on the installed artifact. Static EAS readiness is useful preparation but is not runtime evidence.

## Active Workstream 2 - Gate 2 Official libsignal Integration Path

Feasibility spike output: `docs/architecture/gate-02-libsignal-feasibility-spike.md` and `src/services/messages/signalNativeAdapter.ts`.

Android skeleton output: `docs/architecture/gate-02a-android-libsignal-bridge-skeleton.md`, `plugins/withCipherChatAndroidLibsignalBridge.js`, and the Android readiness wrapper in `src/services/messages/signalNativeAdapter.ts`.

The official libsignal repository states that libsignal exposes platform APIs used by official Signal clients and servers as Java, Swift, or TypeScript libraries over Rust implementations. It also states that use outside Signal is unsupported and that APIs and bridge layers may change without notice. CipherChat must treat this as an integration risk, not as completed production support.

Sources:

- Official libsignal repository: `https://github.com/signalapp/libsignal`
- Signal protocol specifications: `https://signal.org/docs/`
- Signal Maven artifact metadata for `org.signal:libsignal-client`: `https://central.sonatype.com/artifact/org.signal/libsignal-client`
- Signal build artifacts Maven repository documented by libsignal: `https://build-artifacts.signal.org/libraries/maven/`
- `LibSignalClient.podspec` in the official repository for iOS CocoaPods integration.

### Research Findings

- Android path: use official `org.signal` libsignal artifacts through Gradle/Maven and expose a CipherChat native bridge in Java/Kotlin. The bridge must hide libsignal internals from JavaScript and expose only the existing app adapter contract.
- iOS path: use `LibSignalClient` through CocoaPods/Swift and expose a Swift native bridge to React Native. The bridge must store sessions locally in the encrypted database boundary and never expose private session material to JavaScript.
- React Native path: create a native module/TurboModule boundary that implements the existing `SignalOneToOneCryptoAdapter` surface without changing production fail-closed behavior.
- Licensing path: libsignal is AGPLv3. Production work needs legal/owner approval before shipping or distributing an app that links it.
- Support risk: official docs state external use is unsupported and APIs may change. Version pinning and upgrade tests are required.

### Initial Adapter Shape

The production adapter should expose only:

- readiness/evidence report,
- identity/prekey generation through native code,
- public prekey bundle export,
- session creation from validated `signal-x3dh-v1` bundles,
- encrypt/decrypt operations for one-to-one envelopes,
- key-change/safety-number metadata needed by existing trust UI,
- session deletion/rotation hooks,
- error codes that do not include plaintext, keys, tokens, or contact graph data.

### Completion Rule

Gate 2 remains open until a reviewed native Android/iOS adapter is installed, test-covered, externally reviewed, and wired through the existing production crypto gate. The existing prototype provider must remain blocked for production.

### Next Exact Implementation Step

Run Expo prebuild or EAS Android preview in a clean environment to prove the generated Java bridge compiles with pinned `org.signal:libsignal-android:0.86.5` and `org.signal:libsignal-client:0.86.5`, then implement identity and prekey generation behind the bridge while keeping production readiness false.
