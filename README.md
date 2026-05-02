# CipherChat

**A demo-ready secure messaging prototype with honest production security gates.**

CipherChat is a polished Expo React Native TypeScript mobile app with a Fastify/PostgreSQL/Redis backend workspace, SQLCipher runtime evidence workflow, trust-state UI, and fail-closed cryptography boundaries. It is built to demonstrate secure product engineering without pretending unfinished production cryptography is complete.

Author: **Amgad Hussein Alzomi**

Status: **demo-ready and portfolio-ready**.  
Production status: **blocked by design until reviewed cryptography, native evidence, push evidence, dependency triage, and external audit are complete**.

Current phase: **Phase 85 - Arabic localization and first-launch language selection**.

## Badges

![Expo](https://img.shields.io/badge/Expo-55-000020?style=for-the-badge&logo=expo)
![React Native](https://img.shields.io/badge/React_Native-0.83-61DAFB?style=for-the-badge&logo=react&logoColor=111111)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Fastify](https://img.shields.io/badge/Fastify-API-000000?style=for-the-badge&logo=fastify)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-local_backend-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-BullMQ-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)
![SQLCipher](https://img.shields.io/badge/SQLCipher-evidence_workflow-0B7F57?style=for-the-badge)
![CI Passing](https://img.shields.io/badge/CI-passing-1F9D55?style=for-the-badge)
![Demo Ready](https://img.shields.io/badge/Demo-ready-7C3AED?style=for-the-badge)
![Production Blocked](https://img.shields.io/badge/Production-blocked_by_design-B91C1C?style=for-the-badge)

## Contents

- [Why CipherChat](#why-cipherchat)
- [Screenshots](#screenshots)
- [Key Features](#key-features)
- [Security Architecture](#security-architecture)
- [Project Status](#project-status)
- [Architecture And Tech Stack](#architecture-and-tech-stack)
- [Quick Start](#quick-start)
- [Validation](#validation)
- [Documentation Hub](#documentation-hub)
- [Honest Limitations](#honest-limitations)
- [What This Project Demonstrates](#what-this-project-demonstrates)
- [Author](#author)
- [Copyright](#copyright)

## Why CipherChat

CipherChat is a secure messaging prototype that treats security communication as part of the product. It was built to show how a modern encrypted messenger can look, feel, and behave while keeping production claims honest.

What makes it technically strong:

- a polished Expo React Native mobile experience,
- a real TypeScript backend workspace with PostgreSQL, Prisma, Redis, and BullMQ,
- device verification, trust-state, prekey, revocation, and readiness surfaces,
- repeatable validation and release-evidence scripts,
- security boundaries that fail closed instead of quietly downgrading behavior.

What makes it security-focused:

- no homemade production encryption,
- no fake Signal/libsignal claim,
- no live production message sending without reviewed crypto,
- no durable plaintext message/file storage unless encrypted storage is active and verified,
- explicit blockers for iOS SQLCipher evidence, native non-exportable keys, file crypto, push providers, external audit, and dependency advisories.

## Screenshots

Public-safe mock/demo screenshots are stored in [screenshots/](screenshots/README.md). They use prototype data only and do not represent production encrypted messaging readiness.

![CipherChat animated splash](assets/cipherchat-splash.gif)

| Splash | Onboarding | Sign In |
| --- | --- | --- |
| ![CipherChat splash](screenshots/01-splash.png) | ![CipherChat onboarding](screenshots/02-onboarding.png) | ![CipherChat sign in](screenshots/03-sign-in.png) |

| Device Verification | Chats | Conversation |
| --- | --- | --- |
| ![Device verification](screenshots/04-device-verification.png) | ![CipherChat chats](screenshots/05-chats.png) | ![CipherChat conversation](screenshots/06-conversation.png) |

| Contacts | Secure File Transfer | Privacy Dashboard |
| --- | --- | --- |
| ![Contacts trust state](screenshots/07-contacts-trust-state.png) | ![Secure file transfer prototype](screenshots/08-secure-file-transfer.png) | ![Privacy dashboard](screenshots/09-privacy-dashboard.png) |

| Settings Readiness | SQLCipher Runtime Check |
| --- | --- |
| ![Settings readiness dashboard](screenshots/10-settings-readiness.png) | ![SQLCipher runtime check passed](screenshots/11-sqlcipher-runtime-check.png) |

Arabic screenshot slots are documented for Phase 85: language selection, Arabic onboarding, and Arabic settings. Captures use mock/demo data only.

## Key Features

| Area | What is included |
| --- | --- |
| Animated Splash | Dark cyber-security launch sequence with CipherChat branding. |
| English/Arabic UI | First-launch language selection before onboarding, persisted language choice, Arabic UI labels, and RTL-aware helpers. |
| Onboarding | Polished tutorial flow for secure messaging concepts. |
| Auth UX | Sign in and sign up screens that route through device verification. |
| Device Verification | Device identity, safety-number style display, and trust flow. |
| Chat List | Premium secure inbox surface with mock/demo conversation state. |
| Conversation UI | Demo message flow with trust warnings and retry-aware send behavior. |
| Contacts And Trust | Public key sync concepts, new/changed trust states, and safety review UX. |
| Secure File Transfer Prototype | Demo UI plus production file-crypto gates and adapter plan. |
| Privacy Dashboard | Security posture and privacy-oriented presentation surface. |
| Settings Readiness Dashboard | Backend, crypto, Signal adapter, file crypto, push provider, database, prekey, and evidence status. |
| Backend/API Foundation | Fastify API routes for accounts, device sessions, bundles, envelopes, inbox, ack, prekeys, revocation, and health. |
| CI/Test Validation | TypeScript, app/API tests, Prisma validation, integration tests, release gates, Expo Doctor, and high audit gate. |
| SQLCipher Evidence Workflow | Android release-candidate evidence for the tested APK and documented iOS verification path. |

## Security Architecture

CipherChat separates demo behavior from production readiness. Mock mode stays usable. Live production send paths stay blocked until reviewed adapters and evidence exist.

```mermaid
flowchart TD
  A["Mobile Demo UI"] --> B["Trust And Device Verification"]
  B --> C["Message Crypto Policy"]
  C -->|"Mock mode"| D["Prototype Demo Provider"]
  C -->|"Live production"| E["Signal/libsignal Adapter Gate"]
  E -->|"Missing reviewed adapter"| F["Fail Closed"]
  E -->|"Future reviewed adapter"| G["Encrypted Envelope Flow"]
  G --> H["Fastify API Metadata Routes"]
  H --> I["PostgreSQL And Redis"]
  A --> J["Encrypted Local Database Boundary"]
  J --> K["SQLCipher Runtime Evidence"]
  A --> L["File Crypto Provider Gate"]
  A --> M["Generic Push Metadata Policy"]
```

Core security ideas:

- **Fail-closed crypto boundaries:** live production sends are blocked unless a reviewed Signal/X3DH + Double Ratchet adapter is installed and eligible.
- **Device verification:** device identity, safety-number style UX, trust state, and revocation are surfaced in the app.
- **Trust states:** missing, new, and changed recipient keys block sends until reviewed.
- **Encrypted local database boundary:** SQLCipher runtime checks must prove `encrypted=true` before evidence is complete.
- **Push metadata minimization:** generic wake/sync payloads only; no message bodies, sender names, filenames, contact graph identifiers, tokens, or safety numbers.
- **Backend metadata-only design:** API routes handle device/session metadata, public bundles, encrypted envelopes, opaque headers, prekey counts, and operational state.
- **Production blocker philosophy:** the project makes missing security work visible instead of hiding it.

## Project Status

| Item | Status |
| --- | --- |
| Demo readiness | Complete |
| Portfolio readiness | Complete |
| English/Arabic UI support | Complete for core demo surfaces |
| Android SQLCipher RC evidence | Complete for the exact tested APK |
| Production secure messaging | Blocked |
| iOS SQLCipher runtime evidence | Blocked |
| Signal/libsignal adapter | Blocked |
| Production file encryption adapter | Blocked |
| Native non-exportable signing key provider | Blocked |
| APNs/FCM provider evidence | Blocked |
| External security review | Blocked |
| Moderate Expo transitive advisories | Tracked, unresolved |

## Architecture And Tech Stack

| Layer | Stack |
| --- | --- |
| Mobile | Expo React Native, TypeScript, React Navigation, Expo SecureStore, Expo Crypto |
| Backend | Fastify, TypeScript, PostgreSQL, Prisma, Redis, BullMQ |
| Security | device identity boundary, recipient trust policy, Signal adapter gate, file crypto gate, push metadata policy |
| Storage | SQLCipher-ready OP-SQLite boundary, SecureStore for prototype secrets, PostgreSQL metadata persistence |
| Tooling / CI | Node test runner, TypeScript, Prisma validation, Expo Doctor, release-evidence scripts, audit/readiness gates |

## Quick Start

Install and run the mobile app:

```powershell
npm install
npm start
```

Run Android from the local workspace:

```powershell
npm run android
```

Run the local backend dependencies:

```powershell
docker compose up -d postgres redis
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

Start the worker:

```powershell
$env:DATABASE_URL="postgresql://cipherchat:cipherchat@localhost:5432/cipherchat?schema=public"
$env:REDIS_URL="redis://localhost:6379"
$env:INTERNAL_JOB_TOKEN="local-demo-internal-token"
npm run api:worker
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

Current expected validation state:

- app tests pass,
- API tests pass,
- `npm run validate:ci` passes,
- `npx expo-doctor` passes 18/18,
- release evidence reports Android OK for the tested APK and iOS still blocking,
- high-severity audit gate passes,
- moderate Expo transitive advisories are tracked in documentation.

## Documentation Hub

- [Demo readiness report](docs/release/demo-readiness-report.md)
- [Final project status](docs/release/final-project-status.md)
- [Production blocker burndown](docs/release/production-blocker-burndown.md)
- [Demo script](docs/release/demo-script.md)
- [External review request package](docs/security/external-review-request-package.md)
- [Dependency advisory triage](docs/security/dependency-advisory-triage.md)
- [Portfolio case study](docs/portfolio/cipherchat-case-study.md)
- [Screenshots guide](screenshots/README.md)
- [Public repository checklist](docs/release/public-repo-checklist.md)

## Honest Limitations

CipherChat is not production-ready encrypted messaging software.

Remaining blockers:

- no real reviewed Signal/libsignal adapter yet,
- no reviewed production file encryption adapter,
- iOS SQLCipher runtime evidence is missing,
- no native non-exportable signing key provider evidence,
- no production APNs/FCM provider evidence,
- no external security audit yet,
- moderate Expo transitive advisories are tracked, not hidden.
- Arabic localization does not change the production-blocked security status.

`prototype-sha256-envelope-v1` is a demo-only provider. It must not be described as real production encryption.

## What This Project Demonstrates

- React Native / Expo engineering
- TypeScript architecture
- polished mobile product UX
- backend/API design with Fastify, PostgreSQL, Redis, Prisma, and BullMQ
- English/Arabic localization and RTL-aware mobile UI work
- mobile security thinking and secure storage planning
- release readiness and CI discipline
- threat-aware documentation
- honest security gating and blocker communication

## Phase 50 - External Security Review And Audit Readiness

CipherChat keeps its external audit package in `docs/security/external-audit-readiness.md`. The audit readiness gate is `npm run verify:audit-readiness`, and it remains a documentation/readiness gate only. It does not complete external review or mark CipherChat production-ready.

## Phase 85 - Arabic Localization And First-Launch Language Selection

CipherChat now asks first-time users to choose English or Arabic before onboarding starts. The selected language is persisted with `@cipherchat/language-v1`, Arabic uses RTL-aware text alignment and row direction helpers, and Settings includes language switching. This phase is UI/localization work only and does not change production security blockers.

## Author

**Amgad Hussein Alzomi**

## Copyright

Copyright (c) 2026 **Amgad Alzomi**. All rights reserved.

CipherChat is public as a portfolio and demonstration project. See [LICENSE](LICENSE) for ownership and usage terms.
