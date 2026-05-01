# CipherChat Portfolio Case Study

## Project Overview

CipherChat is a polished Expo React Native secure messaging prototype with a local backend workspace and an explicit security architecture. The project is designed for demo, portfolio, and technical review use. It is not presented as production encrypted messaging software.

Author: Amgad Hussein Alzomi

## Problem Solved

Secure messaging demos often overstate security or hide unfinished cryptography behind polished UI. CipherChat solves that presentation problem by pairing a premium mobile experience with honest production gates. The app demonstrates how a secure messenger can be designed, tested, and documented while keeping real production launch blocked until reviewed cryptography, native key storage, platform evidence, push provider evidence, and external audit are complete.

## Tech Stack

- Expo React Native and TypeScript
- React Navigation native stack and bottom tabs
- Expo SecureStore, Expo Crypto, OP-SQLite SQLCipher build configuration
- Noble Ed25519 primitives for prototype device challenge signing
- Fastify API workspace with PostgreSQL, Prisma, Redis, and BullMQ
- Node test runner, TypeScript checks, Expo Doctor, and custom release/security verification scripts

## Key Features

- Splash, onboarding, welcome/auth, device verification, and main-tab flow.
- Chats, calls, files, contacts, settings, privacy dashboard, device management, and secure file transfer preview.
- Mock conversation flow with trust-state warnings for new or changed contact keys.
- Device identity, safety-number display, revocation controls, and prekey inventory surfaces.
- Backend metadata flows for account creation, device sessions, public bundle lookup, envelope fanout, inbox polling, acknowledgements, prekey claim/top-up, device revocation, and device listing.
- Settings dashboard that exposes backend, cryptography, encrypted database, file crypto, push provider, and runtime evidence status.

## Security-Focused Architecture

CipherChat is built around explicit production boundaries:

- Live message sending fails closed without a reviewed Signal/libsignal adapter.
- Prototype crypto is labeled as demo-only and cannot be renamed into production encryption.
- Secure file transfer remains blocked without a reviewed authenticated file encryption adapter.
- Push payload policy allows only generic wake/sync metadata.
- SQLCipher runtime checks must pass before encrypted local storage evidence is considered complete.
- Native non-exportable signing key providers remain blocked until Android Keystore/iOS Keychain or Secure Enclave evidence exists.
- API logs and audit events are metadata-only and avoid message content, filenames, contact graph details, private keys, public prekey values, safety numbers, tokens, and decrypted identifiers.

## Backend/API Work

The backend is a TypeScript Fastify workspace with Prisma, PostgreSQL, Redis, and BullMQ. It includes health/readiness routes, account/device-session flows, public bundle publication and lookup, encrypted envelope fanout, inbox polling, acknowledgements, device revocation, prekey claim/top-up, metadata retention cleanup, queue operations, rate limits, and production config validation.

The API is intentionally metadata-only for message delivery. It does not need or receive plaintext message bodies.

## Mobile Work

The mobile app implements a complete demo flow with a dark cyber-security aesthetic, neon purple glow, green security accents, glass cards, and security-focused Settings visibility. Mock mode supports smooth demo conversations while live production sending remains blocked until the missing crypto adapter is reviewed and installed.

## Testing/CI Evidence

The project includes app tests, API tests, API persistence integration tests, Prisma validation, TypeScript checks, Expo Doctor, release-evidence gates, Signal adapter readiness gates, file crypto plan gates, external review package gates, plaintext lifecycle checks, abuse controls, metadata retention checks, queue operations checks, production config checks, and startup health checks.

Current expected validation commands:

```powershell
npm run typecheck
npm test
npm run validate:ci
npx expo-doctor
npm run verify:release-evidence
npm run collect:sqlcipher-evidence
```

## Android SQLCipher Evidence Summary

Android SQLCipher runtime evidence is complete for the exact Phase 75 release-candidate APK tested on BlueStacks. The app installed, opened, and Settings > Release Evidence > SQLCipher Runtime Check passed after creating/opening the encrypted database, applying schema v1, and round-tripping a harmless test record.

This evidence applies only to that tested APK. Future Android release candidates must repeat the runtime probe.

## Production Blockers Honestly Stated

- iOS SQLCipher runtime evidence is missing.
- Real reviewed Signal/libsignal production messaging is missing.
- Native non-exportable signing key provider evidence is missing.
- Reviewed production file encryption adapter is missing.
- Production APNs/FCM provider wiring and evidence are missing.
- External security review is not complete.
- Moderate Expo transitive advisories remain tracked and unresolved.

## Professional Demonstration

CipherChat demonstrates:

- senior-level product polish in a mobile prototype,
- backend API design for secure protocol metadata,
- threat-aware engineering and fail-closed security gates,
- practical CI/release evidence workflows,
- honest security communication,
- ability to separate demo functionality from production claims,
- documentation quality suitable for GitHub, portfolio, recruiter review, and external audit preparation.
