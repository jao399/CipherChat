# CipherChat Demo Script

## What To Show First

Start with the mobile app in mock mode. Show the splash, onboarding, sign-in or sign-up, device verification, and then the main tabs. The strongest first impression is the polished secure-product flow followed by Settings, where the app clearly reports what is ready and what remains blocked.

## 3-Minute Demo Flow

1. Open CipherChat and show the splash/onboarding visual identity.
2. Sign in or sign up and continue through Device Verification.
3. Open Chats and show the demo conversation UI.
4. Open Contacts and point out key review/trust-state behavior.
5. Open Settings and show backend mode, device identity, message crypto, Signal adapter, file crypto, push provider, encrypted database, and SQLCipher evidence rows.
6. Close by saying: CipherChat is demo-ready and intentionally not production-ready until the remaining security blockers are reviewed and verified.

## 5-Minute Demo Flow

1. Show Splash -> Onboarding -> Welcome/Auth -> Device Verification.
2. In Chats, show the polished conversation surface and explain mock mode.
3. In Contacts, show trust states and explain that new/changed keys block sends until reviewed.
4. In Files, open Secure File Transfer and explain that the UI is demo-only until a reviewed file crypto adapter exists.
5. In Settings, show:
   - Backend Mode,
   - Backend Readiness,
   - Device Identity,
   - Native Signing Key Provider,
   - Message Crypto,
   - Signal Adapter,
   - File Crypto Provider,
   - Push Provider,
   - Encrypted Database Status,
   - SQLCipher Runtime Check.
6. Mention the local API workspace: Fastify, PostgreSQL, Prisma, Redis/BullMQ, metadata-only routes, and tests.
7. End with the production blockers and validation evidence.

## How To Explain Security Honestly

Use this wording:

CipherChat is a secure-messaging architecture prototype with real production gates. It does not claim production end-to-end encryption yet. The demo uses mock/prototype message flow, while live production sending remains blocked until a reviewed Signal/libsignal adapter is installed. The backend is designed for encrypted envelopes and metadata-only operations, and the app exposes readiness states instead of hiding missing security work.

## Answer: Is It Production Ready?

No. CipherChat is demo-ready, not production-ready. It still needs real reviewed Signal/libsignal integration, iOS SQLCipher runtime evidence, native non-exportable signing key evidence, reviewed production file encryption, APNs/FCM provider evidence, external security review, and dependency advisory resolution or formal release acceptance.

## Answer: Does It Use Real Encryption?

It uses real security building blocks in limited places, such as prototype Ed25519 device challenge signing and SQLCipher runtime evidence for the tested Android APK. It does not yet implement production message end-to-end encryption. The `prototype-sha256-envelope-v1` provider is demo-only and is not real production encryption. Production messaging remains blocked until a reviewed Signal/X3DH + Double Ratchet adapter is installed and verified.
