# CipherChat Demo Readiness Report

Date: 2026-05-01

## Status

CipherChat is demo-ready as a polished Expo prototype in mock mode. It presents the secure messaging product flow, device verification UX, trust-state handling, device management, prekey inventory, encrypted database boundary checks, secure file transfer surface, and local/API readiness controls.

CipherChat is not production-ready encrypted messaging software. Live production message send/receive remains fail-closed until a reviewed Signal/libsignal-compatible native adapter is installed and wired through the existing adapter boundary.

## What Works Now

- Splash -> onboarding -> welcome/auth -> device verification -> main tabs flow.
- Sign in and sign up both route through device verification before the main app.
- Main tabs render: Chats, Calls, Files, Contacts, Settings.
- Mock mode supports a smooth demo conversation flow for trusted contacts.
- New or changed contact keys show clear warnings and block sends until trusted.
- Outbound retry re-checks trust before resending queued envelopes.
- Contacts can discover, add, sync, and trust public device bundles in mock/live metadata flows.
- Device management shows active devices, revocation controls, and prekey inventory/top-up.
- Settings shows backend mode, backend readiness, device identity, trust state, crypto provider, Signal adapter readiness, encrypted database status, device management, prekey inventory, and dev-only migration controls.
- API routes and tests cover account creation, device sessions, bundle publication/lookup, contact discovery, envelope fanout, inbox polling, ack, prekey claim/top-up, device revocation, and device listing.
- Production API config fails fast for missing persistence, Redis, strong internal token, production CORS origin, and Ed25519 verifier settings.
- Phase 71 secure file crypto boundary is in place; production file transfer stays blocked without a reviewed adapter.
- Phase 72 push metadata boundary is in place; generic wake/sync payloads are allowed and sensitive fields are rejected.
- Release evidence placeholders and `npm run verify:release-evidence` track Android/iOS SQLCipher evidence without faking runtime proof.
- Phase 73 adds a dev-only SQLCipher runtime check in Settings and `npm run collect:sqlcipher-evidence` for manual evidence collection steps.
- Phase 73 BlueStacks Android development runtime verification passed: the debug development APK installed, the current Expo bundle loaded, and Settings > Development Evidence > SQLCipher Runtime Check reported a pass.
- Phase 75 BlueStacks Android release-candidate verification passed: the release APK installed, Settings > Release Evidence > SQLCipher Runtime Check reported a pass, and Android SQLCipher evidence is complete for that APK.
- Phase 74 adds a native non-exportable signing key provider boundary while keeping SecureStore marked as prototype-only.
- Phase 76 documents the Signal/libsignal integration plan and adds a documentation gate without claiming production Signal support.
- Phase 77 documents the repeatable iOS SQLCipher runtime evidence workflow while keeping iOS evidence blocking until a real iOS run passes.
- Phase 78 adds APNs/FCM provider readiness reporting and Settings visibility while keeping production push evidence blocked.
- Phase 79 documents the production file encryption adapter plan and adds a CI documentation gate while keeping file transfer production-blocked.
- Phase 80 adds an external review request package and dependency advisory triage without suppressing the existing moderate Expo transitive advisories.
- Phase 81 packages the project for GitHub, CV, portfolio, and demos with a concise README, case study, final demo script, and final project status document.

## How To Run Mobile Mock Mode

Mock mode is the default mobile mode.

```powershell
npm install
npm start
```

Then open the app in an Expo development client or run a platform target:

```powershell
npm run android
```

Use the app flow:

1. Splash opens automatically.
2. Complete or skip onboarding.
3. Choose sign up or sign in.
4. Trust/continue through device verification.
5. Use Chats, Calls, Files, Contacts, and Settings.

## How To Run API Live Mode Locally

Start PostgreSQL and Redis:

```powershell
docker compose up -d postgres redis
```

Apply Prisma migrations:

```powershell
npm run prisma:migrate:deploy
```

Start the API with local development environment values:

```powershell
$env:DATABASE_URL="postgresql://cipherchat:cipherchat@localhost:5432/cipherchat?schema=public"
$env:REDIS_URL="redis://localhost:6379"
$env:API_HOST="127.0.0.1"
$env:API_PORT="4000"
$env:CORS_ORIGIN="http://localhost:8081"
$env:INTERNAL_JOB_TOKEN="local-demo-internal-token"
npm run api:dev
```

Optional worker:

```powershell
$env:DATABASE_URL="postgresql://cipherchat:cipherchat@localhost:5432/cipherchat?schema=public"
$env:REDIS_URL="redis://localhost:6379"
$env:INTERNAL_JOB_TOKEN="local-demo-internal-token"
npm run api:worker
```

Health checks:

```powershell
Invoke-RestMethod http://127.0.0.1:4000/health
Invoke-RestMethod http://127.0.0.1:4000/ready
```

In the app, open Settings and switch Backend Mode to live. Live mode supports backend protocol metadata flows, but production message encryption remains blocked without the reviewed Signal adapter.

## Required Validation Commands

```powershell
npm run typecheck
npm test
npm run verify:release-evidence
npm run collect:sqlcipher-evidence
npm run validate:ci
npx expo-doctor
```

Baseline and final validation on 2026-05-01:

- `npm install`: passed; npm reported 11 moderate transitive advisories.
- `npm run typecheck`: passed.
- `npm test`: passed; app tests 72/72 and API tests 78/78.
- `npm run verify:release-evidence`: passed evidence document checks; Android release-candidate SQLCipher evidence is complete for the Phase 75 APK and iOS runtime SQLCipher evidence remains marked blocking.
- `npm run collect:sqlcipher-evidence`: prints static config, Android/iOS evidence status, and manual iOS/Android runtime steps without faking iOS proof.
- `npm run verify:file-crypto-plan`: passes documentation and boundary checks for the Phase 79 production file encryption adapter plan.
- `npm run verify:external-review-package`: passes external review package and dependency triage document checks.
- `npm run validate:ci`: passed, including Prisma validation, integration tests, release/security verification scripts, Expo Doctor, and high-severity audit gate.
- `npx expo-doctor`: passed, 18/18 checks.
- `npm audit --audit-level=moderate`: reports the known moderate Expo transitive advisories and remains tracked as a production blocker.

The remaining npm audit output is moderate severity in Expo transitive dependencies (`postcss`, `uuid` paths). `npm audit fix --force` suggests a breaking Expo downgrade, so this was not applied during the demo polish pass.

## Screens And Features Completed

- Splash and animated onboarding with existing tutorial artwork.
- Welcome/auth screens with device verification in the entry flow.
- Chats list, encrypted inbox status, trust warnings, mock composer, outbound queue, and retry controls.
- Calls tab as a clearly labeled prototype UI surface.
- Files tab and secure file transfer preview with production file-crypto gates described honestly.
- Contacts discovery, public key sync, safety number review, and trust actions.
- Settings readiness dashboard and dev-only prototype store migration controls.
- Development Evidence and Release Evidence sections with SQLCipher Runtime Check for installed development and release-candidate clients.
- Settings shows push provider readiness, generic push payload policy status, and missing APNs/FCM evidence.
- Settings shows file crypto provider readiness and clearly reports the missing reviewed production adapter.
- Privacy dashboard and device management.
- API health/readiness, persistence-backed sessions/devices/messages/prekeys, and metadata retention jobs.
- Portfolio and presentation docs: `docs/portfolio/cipherchat-case-study.md`, `docs/release/demo-script.md`, and `docs/release/final-project-status.md`.

## Security Limitations

- Signal/libsignal production crypto is not implemented.
- `prototype-sha256-envelope-v1` is a mock/demo envelope provider only and is not real production encryption.
- Live production message sending and inbound plaintext processing must remain blocked until a reviewed Signal/X3DH + Double Ratchet provider is installed.
- Secure file transfer production upload is blocked until a reviewed client-side file crypto adapter exists.
- The Phase 71 file crypto boundary is policy and adapter shape only; no production file encryption adapter is installed.
- The Phase 79 production file encryption plan is documentation and a gate only; it does not install or certify a production adapter.
- The Phase 72 push metadata boundary allows generic notifications only; production APNs/FCM wiring and provider evidence remain incomplete.
- The Phase 78 push provider evidence boundary reports APNs/FCM as not configured by default; no provider evidence is complete.
- Calls are a UI prototype; production encrypted voice/video transport is not implemented.
- Android SQLCipher runtime availability has Phase 75 release-candidate APK evidence for the current artifact; Phase 77 documents the iOS path, but iOS SQLCipher runtime availability still requires macOS/Xcode or EAS device verification.
- BlueStacks passed the Phase 73 Android development SQLCipher probe and the Phase 75 Android release-candidate APK probe, but BlueStacks is not final production evidence for non-exportable native signing keys.
- OS-backed non-exportable signing keys require the Phase 74 native provider plus runtime/review evidence before production launch.
- External security review and remediation evidence remain required before production launch.

## Remaining Production Blockers

- Install and review a native Signal/libsignal-compatible one-to-one crypto adapter.
- Provide production Signal prekey generation and storage using non-exportable native key material.
- Complete iOS SQLCipher runtime evidence on macOS/Xcode or an installed EAS iOS build.
- Re-run Settings > Release Evidence > SQLCipher Runtime Check for every new Android release-candidate APK.
- Install and review a native non-exportable signing key provider behind the Phase 74 boundary.
- Complete production secure file encryption adapter and file handling review.
- Complete push notification provider configuration, provider log review, and release smoke evidence with generic wake-only payloads.
- Attach real SQLCipher release evidence to `docs/release/android-sqlcipher-evidence.md` and `docs/release/ios-sqlcipher-evidence.md`.
- Complete external security audit and attach remediation evidence.
- Resolve or accept with documented risk any remaining dependency advisories before a real release.
