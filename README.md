# CipherChat

CipherChat is a demo-ready Expo React Native secure messaging prototype by **Amgad Hussein Alzomi**. It presents a polished dark cyber-security mobile app, a local backend/API workspace, and security-focused production gates that intentionally prevent false claims about real end-to-end encryption.

CipherChat is **demo-ready, not production-ready**. Mock mode is usable for portfolio demos. Live production message sending remains fail-closed until a reviewed Signal/libsignal-compatible native adapter and the remaining release evidence are installed and verified.

## Demo Status

- Mobile mock/demo mode: complete.
- Backend local API foundation: complete for protocol metadata flows.
- Android SQLCipher release-candidate evidence: complete for the exact Phase 75 tested APK.
- Production encrypted messaging: blocked by design until reviewed adapters and external evidence are complete.

## Tech Stack

- Expo React Native, TypeScript, React Navigation
- Expo development builds, Expo SecureStore, Expo Crypto
- OP-SQLite with SQLCipher build flag
- Noble Ed25519 primitives for prototype device challenge signing
- Fastify API workspace, PostgreSQL, Prisma, Redis/BullMQ
- Node test runner, TypeScript, Expo Doctor, CI verification scripts

## Features

- Splash, onboarding, welcome/auth, and device verification flow.
- Main tabs: Chats, Calls, Files, Contacts, Settings.
- Mock conversation flow with trust warnings and retry controls.
- Device management, revocation controls, prekey inventory, and safety-number surfaces.
- Secure file transfer preview with production file-crypto gates shown honestly.
- Settings readiness dashboard for backend mode, device identity, trust state, message crypto, Signal adapter, file crypto, push provider, encrypted database, and SQLCipher evidence.
- Backend routes for health/readiness, accounts, device sessions, public bundles, envelope fanout, inbox polling, acknowledgements, prekey claim/top-up, device revocation, and device listing.

## Security Architecture

CipherChat keeps production-security claims conservative:

- No homemade production cryptography.
- `prototype-sha256-envelope-v1` is demo-only and is not real production encryption.
- Live production send/receive remains blocked without a reviewed Signal/X3DH + Double Ratchet adapter.
- Secure file transfer remains blocked without a reviewed production file encryption adapter.
- Push notifications are limited to generic wake/sync metadata by policy.
- Durable plaintext message/file storage is blocked unless encrypted storage is active and verified.
- Logs and audit events are metadata-only and must not include content, filenames, contact graphs, keys, tokens, safety numbers, or decrypted identifiers.

## What Works Now

- Polished mobile demo in mock mode.
- Local API/dev backend with PostgreSQL, Redis, Prisma, and integration tests.
- Android BlueStacks release-candidate SQLCipher runtime probe passed for the tested APK.
- CI validation passes with typecheck, tests, API build, Prisma validation, integration tests, security gates, Expo Doctor, and high-severity audit.
- Release/security docs clearly track remaining production blockers.

## Intentionally Blocked Before Production

- Real reviewed Signal/libsignal one-to-one adapter.
- Production Signal prekey generation and session storage.
- iOS SQLCipher runtime evidence.
- Native non-exportable Android Keystore/iOS Keychain signing provider evidence.
- Reviewed production file encryption adapter.
- Production APNs/FCM provider wiring and evidence.
- External security review and remediation.
- Moderate Expo transitive advisory resolution or formally accepted release risk.

## Run The Mobile Demo

```powershell
npm install
npm start
```

Then open the project in an Expo development client or run Android:

```powershell
npm run android
```

Mock mode is the default. Use the app flow:

1. Splash
2. Onboarding
3. Sign in or sign up
4. Device verification
5. Main tabs and Settings readiness dashboard

## Run The Backend Locally

Start PostgreSQL and Redis:

```powershell
docker compose up -d postgres redis
```

Apply migrations:

```powershell
npm run prisma:migrate:deploy
```

Start the API:

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

## Validation

```powershell
npm run typecheck
npm test
npm run validate:ci
npx expo-doctor
npm run verify:release-evidence
npm run collect:sqlcipher-evidence
```

Expected current status:

- App tests: passing.
- API tests: passing.
- `npx expo-doctor`: passing 18/18.
- `npm run verify:release-evidence`: Android OK for the tested APK; iOS remains blocking.
- `npm run collect:sqlcipher-evidence`: prints static config and manual iOS/Android evidence steps without faking runtime proof.

## Screens

- Splash
- Onboarding
- Welcome
- Sign In
- Sign Up
- Device Verification
- Chats
- Conversation
- Calls
- Files
- Contacts
- Settings
- Device Management
- Secure File Transfer
- Privacy Dashboard
- About CipherChat

## Key Documents

- [Demo readiness report](docs/release/demo-readiness-report.md)
- [Production blocker burndown](docs/release/production-blocker-burndown.md)
- [Phase 50 external audit readiness](docs/security/external-audit-readiness.md)
- [External review request package](docs/security/external-review-request-package.md)
- [Dependency advisory triage](docs/security/dependency-advisory-triage.md)
- [Portfolio case study](docs/portfolio/cipherchat-case-study.md)
- [Demo script](docs/release/demo-script.md)
- [Final project status](docs/release/final-project-status.md)

## Phase 50 - External Security Review And Audit Readiness

CipherChat keeps its external audit package in `docs/security/external-audit-readiness.md`. The audit readiness gate is `npm run verify:audit-readiness`, and it remains a documentation/readiness gate only. It does not complete external review or mark CipherChat production-ready.

## Phase 81 - Final Demo Release Package

Phase 81 packages CipherChat for GitHub, CV, portfolio, and demo presentation. It adds the portfolio case study, demo script, final project status, and this recruiter-friendly README. This phase does not close production blockers or claim production readiness.

## Author

Amgad Hussein Alzomi
