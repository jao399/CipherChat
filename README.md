# CipherChat

CipherChat is a premium Expo React Native TypeScript UI prototype for a future secure encrypted messaging app. It is frontend-only today: all screens use mock data, local onboarding persistence, reusable UI components, and a future-ready project structure for real encryption and backend work later.

Design direction: dark cyber-security aesthetic, neon purple brand glow, green security accents, elevated glass cards, shield/chat/lock logo language, and polished onboarding inspired by the supplied reference image.

## Tech Stack

- Expo + React Native
- TypeScript
- React Navigation native stack + bottom tabs
- AsyncStorage for first-launch onboarding persistence
- Expo Linear Gradient
- Expo Crypto
- Noble Ed25519 primitives for mobile device challenge signing
- React Native SVG
- Expo Vector Icons

## Run

```bash
npm install
npm start
```

Then open the project in Expo Go, an emulator, or a development build.

## Implemented Screens

- Splash screen
- 4-slide onboarding carousel
- Welcome / Get Started
- Sign In
- Sign Up
- Main tab shell: Chats, Calls, Files, Contacts, Settings
- Chat list
- Conversation
- Device Verification
- Secure File Transfer
- Privacy Dashboard
- Settings / Privacy
- About CipherChat

## Folder Structure

```text
src/
  assets/logo/          Official PNG logo assets
  components/common/    Buttons, cards, inputs, logo, QR, headers, badges
  components/chat/      Chat list item and message bubble components
  components/settings/  Settings rows
  constants/            Storage keys and shared constants
  data/                 Mock chats, messages, files, contacts, calls, stats
  navigation/           Root stack and tab navigation
  screens/              Auth, onboarding, main, security, settings screens
  config/               Future stack decision manifest
  security/             Future crypto/security contracts and policy constants
  services/api/         Typed mobile API client, mock client, and backend provider
  services/ports/       Future backend/local service boundary interfaces
  services/local/       SecureStore adapter foundation
  theme/                Colors, spacing, typography, radii, shadows, gradients
  types/                Shared TypeScript models
apps/
  api/                  Fastify API workspace, Prisma schema, repositories, tests
docker-compose.yml      Local PostgreSQL development service
```

## Branding Assets

The official logo source is the attached PNG copied directly into:

- `src/assets/logo/cipherchat-official-logo.png`
- `assets/cipherchat-official-logo.png`

Legacy logo PNG aliases in `src/assets/logo/` are kept only for compatibility and should not be edited directly. The generated SVG logo files were removed so the app does not accidentally show a redrawn logo.

Expo launcher assets are configured in `assets/` and referenced from `app.json`:

- `assets/icon.png`
- `assets/adaptive-icon.png`
- `assets/splash-icon.png`
- `assets/favicon.png`

## Onboarding Persistence

The onboarding carousel writes `@cipherchat/onboarding-complete-v2` to AsyncStorage when the user taps Skip or the final Get Started button. The splash screen reads that key and routes first-time users to onboarding; returning users go to the welcome screen. Settings includes a prototype reset action that removes the key and reopens onboarding.

## Prototype Hardening Status

Phase 2 hardening is complete for the current UI prototype:

- Android emulator startup and navigation flow verified.
- Onboarding confirmed as four slides: slides 1-3 show Next, slide 4 shows Get Started.
- Device Verification now has an explicit Continue Securely CTA.
- Privacy Dashboard now has a visible back control.
- Critical buttons, rows, filters, settings, and form actions include accessibility labels and stable test IDs.
- Temporary QA screenshots, XML dumps, and Expo log files are excluded from the project.

Validation commands:

```bash
npm run typecheck
npx expo-doctor
```

## Animated Splash

The startup experience uses a real React Native screen, not only a static launch image. `src/screens/onboarding/SplashScreen.tsx` orchestrates the "Encrypted Core Awakening" sequence:

1. Dark background and subtle circuit grid fade in.
2. Purple encrypted particles drift inward.
3. Particles assemble around the CipherChat logo mark.
4. The lock/shield core glows and a purple pulse ring expands.
5. `CipherChat`, `Secure. Private. Yours Alone.`, and `Made by Amgad Alzomi` fade in.
6. The screen fades out and routes to onboarding or welcome.

Splash-specific pieces:

- `src/constants/splash.ts` controls splash colors, text, and timing.
- `src/components/splash/CircuitBackground.tsx` renders the grid and circuit layer.
- `src/components/splash/EncryptedParticleField.tsx` renders deterministic animated particles.
- `src/components/splash/EncryptedCoreLogo.tsx` renders the logo, glow, pulse, and text block.
- `src/utils/startupRoute.ts` resolves the next route after splash.

## Future Secure Chat Roadmap

CipherChat should not invent custom cryptography. A real implementation should use mature, reviewed protocols and audited libraries.

Recommended future architecture:

- Use Signal-style X3DH for initial one-to-one key agreement with identity keys, signed prekeys, and one-time prekeys.
- Use the Double Ratchet for forward secrecy and post-compromise security in one-to-one conversations.
- Use MLS for scalable secure group messaging, group membership changes, and sender authentication.
- Keep encryption client-side only. Servers should never receive plaintext message bodies, file contents, private keys, or recovery secrets.
- Store long-term device identity keys in Android Keystore and iOS Keychain.
- Use SQLCipher or an equivalent encrypted local database for messages, file metadata, contact keys, and session state.
- Implement QR code and safety number verification for device and contact trust.
- Use encrypted file transfer with per-file keys, authenticated encryption, resumable uploads, and encrypted thumbnails.
- Design secure backups with client-held recovery keys or passphrases; avoid server-readable backup material.
- Minimize push notification metadata with generic payloads and client-side fetch/decrypt after wake.
- Build multi-device support around explicit device linking, per-device identity keys, device revocation, and auditable trust changes.
- Secure voice/video with WebRTC, DTLS-SRTP, identity verification, and clear call security state.
- Rotate keys for device changes, suspected compromise, group membership changes, and long-lived sessions.
- Minimize metadata through private contact discovery, sealed-sender style routing where possible, retention limits, and careful logging.
- Add abuse prevention without breaking privacy through rate limits, report flows that require user-selected message disclosure, spam scoring on metadata only, and privacy-preserving account controls.
- Keep server audit logs focused on operational events, not content, keys, contact graphs, or decrypted identifiers.

## Phase 3 Architecture Package

The project now includes a future-ready architecture package for the real secure messaging implementation:

- `docs/architecture/phase-3-architecture.md`
- `docs/architecture/security-model.md`
- `docs/architecture/backend-boundaries.md`
- `docs/architecture/phase-4-readiness-checklist.md`
- `src/security/cryptoContracts.ts`
- `src/security/securityPolicy.ts`
- `src/services/ports/`

These files define the future account, device, message, file, verification, secure storage, and backend boundaries. They do not implement backend behavior or encryption in the UI prototype.

## Phase 4 Secure Foundation

The project now includes secure foundation stack decisions and ADRs:

- `docs/architecture/phase-4-secure-foundation.md`
- `docs/architecture/adr/0001-mobile-runtime.md`
- `docs/architecture/adr/0002-crypto-libraries.md`
- `docs/architecture/adr/0003-local-secure-storage.md`
- `docs/architecture/adr/0004-backend-stack.md`
- `docs/architecture/adr/0005-push-and-metadata.md`
- `src/config/foundationStack.ts`

Selected direction:

- Expo React Native TypeScript, moving to Expo development builds for native security modules.
- `expo-secure-store` for early small-secret storage, with production review for stricter Keychain/Keystore wrappers.
- SQLCipher-backed SQLite for encrypted local storage.
- Signal `libsignal` for X3DH + Double Ratchet one-to-one messaging.
- MLS/OpenMLS evaluation for group messaging.
- TypeScript Fastify backend, PostgreSQL + Prisma, Redis + BullMQ, and S3-compatible encrypted blob storage.
- Generic push notifications with no sensitive plaintext payloads.

## Phase 5 Foundation

The project now includes a first implementation foundation:

- `apps/api/` Fastify TypeScript API workspace.
- `apps/api/prisma/schema.prisma` server metadata schema.
- `src/services/local/secureStoreAdapter.ts` mobile secure storage adapter using `expo-secure-store`.
- Root npm workspaces for the app and API package.

Phase 5 introduced the API shell and secure local-storage foundation. The initial API routes were schema-validated placeholders until database wiring was ready.

## Phase 6 Persistence Foundation

The API now has a real persistence layer for encrypted protocol metadata:

- `docker-compose.yml` local PostgreSQL service.
- `apps/api/prisma/migrations/20260426000100_phase_6_persistence/migration.sql` initial database migration.
- `apps/api/src/repositories/` repository interfaces and Prisma implementations.
- `apps/api/src/db/prisma.ts` Prisma client and database readiness check.
- `apps/api/src/routes/apiRoutes.test.ts` route tests for readiness, disabled persistence, and injected persistence.

When `DATABASE_URL` is unset, the API can still run for UI work and returns `503 database_unavailable` from persistence endpoints. When `DATABASE_URL` is set, the API persists device bundles and encrypted message envelopes.

Local database commands:

```bash
docker compose up -d postgres
npm run prisma:migrate:deploy
npm run api:dev
```

Validation commands:

```bash
npm run typecheck
npm run api:test
npm run api:build
npm run prisma:validate
npm run prisma:generate
npx expo-doctor
```

## Phase 7 Device Sessions And Delivery

The API now has its first authenticated device flow:

- `apps/api/prisma/migrations/20260426000200_phase_7_device_sessions/migration.sql` adds `DeviceSession`.
- `apps/api/src/auth/` creates and verifies hashed bearer session tokens.
- `POST /v1/auth/device-sessions` creates a device-scoped session after a bundle exists.
- `POST /v1/messages/envelopes` now requires the authenticated sender device.
- `GET /v1/messages/envelopes` fetches queued encrypted envelopes for the authenticated recipient device.
- `POST /v1/messages/envelopes/:messageId/ack` acknowledges only that recipient device's envelope.
- `apps/api/src/middleware/rateLimit.ts` adds lightweight in-memory rate limiting.
- Metadata-only audit events are recorded for session creation, queueing, delivery, and acknowledgement.

This is still not production account authentication or cryptographic device proof. The next phase should replace simple session issuance with signed device challenges, session revocation, persistent rate limits, and delivery pagination.

## Phase 8 Auth And Delivery Hardening

The API now has a challenge-based device-session flow and stable delivery pagination:

- `apps/api/prisma/migrations/20260427000100_phase_8_auth_delivery_hardening/migration.sql` adds `DeviceSessionChallenge`.
- `POST /v1/accounts` creates account metadata.
- `GET /v1/accounts/me` returns the authenticated account profile.
- `POST /v1/auth/device-challenges` issues short-lived device challenges.
- `POST /v1/auth/device-sessions` requires `challengeId` and `signature`.
- `DELETE /v1/auth/device-sessions/current` revokes the active session.
- `GET /v1/messages/envelopes` now supports opaque `nextCursor` pagination.
- `apps/api/src/auth/signatureVerifier.ts` keeps production signature verification behind an explicit interface.

The safe default verifier rejects signatures. Local smoke tests can enable the intentionally insecure development verifier with `ALLOW_INSECURE_DEV_SIGNATURES=true`, where the accepted test signature is `dev:<challenge>`. Do not use that mode outside local development.

## Phase 9 Queue, Fanout, And Expiry Jobs

The backend now has Redis/BullMQ infrastructure:

- `docker-compose.yml` includes Redis.
- `apps/api/src/queue/jobQueue.ts` defines the job queue port and BullMQ implementation.
- `apps/api/src/worker.ts` runs the background worker.
- `apps/api/src/middleware/redisRateLimitStore.ts` enables Redis-backed rate limiting.
- `POST /v1/messages/envelopes/fanout` stores per-recipient-device encrypted envelopes.
- `POST /v1/internal/jobs/envelopes/expire` queues expiry cleanup with `x-internal-job-token`.

Run locally:

```bash
docker compose up -d postgres redis
npm run api:dev
npm run api:worker
```

The queue jobs contain message IDs, recipient-device counts, and timestamps only. They do not carry plaintext message content.

## Phase 10 Mobile API Client Integration

The Expo app now has a mobile backend integration layer while keeping mock mode as the default UI-safe path:

- `src/services/api/cipherChatApiClient.ts` provides typed methods for readiness, account/device sessions, device bundles, and encrypted envelopes.
- `src/services/api/mockCipherChatApiClient.ts` keeps demos working without a running backend.
- `src/services/api/apiSessionStore.ts` stores account/device IDs in AsyncStorage and the session token in SecureStore.
- `src/services/api/BackendProvider.tsx` owns backend mode, readiness state, and prototype session bootstrap.
- `src/security/deviceIdentityProvider.ts` owns reusable prototype device identity material and challenge signing.
- `src/hooks/useBackend.ts` exposes backend state and actions to screens.
- Device Verification now prepares a prototype session before routing into the main tab shell.
- Settings now exposes Live API Mode, Backend Status, Prototype Session, and Device Identity controls.

Live mode defaults to `http://10.0.2.2:4000` for Android emulator access to the host API. Run the API with `API_HOST=0.0.0.0` for emulator access. Local live session bootstrap still uses the explicit development signature format from Phase 8 and requires `ALLOW_INSECURE_DEV_SIGNATURES=true`; it is not production authentication.

More detail: `docs/architecture/phase-10-mobile-api-client.md`.

## Phase 11 Device Identity Boundary

The mobile app now has a replaceable local device-identity provider:

- `expo-crypto` supplies native secure random bytes and SHA-256 fingerprints.
- `@noble/curves` supplies Ed25519 signing for device challenge authentication.
- `src/security/deviceIdentityProvider.ts` creates and persists a stable local prototype account/device identity.
- Public prototype identity metadata is stored in AsyncStorage.
- The Ed25519 private signing key is stored in SecureStore.
- Device Verification publishes the provider-generated device bundle.
- Challenge signing is centralized behind `signDeviceChallenge`.
- Settings shows the device fingerprint and can rotate the prototype identity.

This is now a real Ed25519 challenge-signing path, but it is not complete production messaging cryptography. Signal/MLS protocol state, signed prekey semantics, encrypted local message storage, key-change warnings, and non-exportable OS-backed key storage are still future work.

More detail: `docs/architecture/phase-11-device-identity-boundary.md`.

## Phase 12 Production Signature Verifier

The API now has a production-shaped Ed25519 device challenge verifier:

- `apps/api/src/auth/signatureVerifier.ts` includes `Ed25519DeviceSignatureVerifier`.
- The safe default remains reject-all.
- `ALLOW_INSECURE_DEV_SIGNATURES=true` still enables the local-only `dev:<challenge>` bridge.
- `DEVICE_SIGNATURE_VERIFIER=ed25519` enables verification of Ed25519 signatures over issued device challenges.
- The expected public key format is `ed25519-spki:<base64 DER SPKI public key>`.
- The expected signature format is `ed25519:<base64 signature>`.
- `apps/api/src/auth/signatureVerifier.test.ts` covers valid signatures, wrong challenges, malformed input, safe defaults, and dev mode.

This is the backend half of real device authentication. Phase 13 adds the matching mobile Ed25519 provider.

More detail: `docs/architecture/phase-12-production-signature-verifier.md`.

## Phase 13 Mobile Ed25519 Provider

The mobile app now signs live device-auth challenges without the local `dev:<challenge>` bridge:

- `src/security/deviceIdentityProvider.ts` now uses `ed25519-noble-v1`.
- The app publishes `ed25519-spki:<base64 DER SPKI public key>`.
- The app signs challenges as `ed25519:<base64 signature>`.
- The Ed25519 private key is stored in SecureStore.
- Legacy prototype identity data is migrated away automatically.
- Stale stored sessions are cleared if they no longer match the active local identity.

Run the API for live mobile testing with `DEVICE_SIGNATURE_VERIFIER=ed25519` and without `ALLOW_INSECURE_DEV_SIGNATURES`.

More detail: `docs/architecture/phase-13-mobile-ed25519-provider.md`.

## Phase 14 Safety Numbers And Identity Trust

The mobile app now surfaces local identity trust state:

- `src/security/safetyNumber.ts` derives displayable safety-number blocks from the active account/device identity.
- `src/security/trustedIdentityStore.ts` stores trusted identity records locally.
- Device Verification shows the real generated safety number instead of a static placeholder.
- Device Verification labels the identity as new, trusted, or changed.
- Settings shows the current trust state, device fingerprint, and safety number.
- Rotating device identity preserves the account/device pair and changes the key, so the app can detect a changed identity.
- Completing Device Verification marks the active identity trusted.

More detail: `docs/architecture/phase-14-safety-numbers-trust.md`.

## Phase 15 Remote Contact Trust

The app now surfaces remote contact identity trust:

- `RemoteIdentityTrustState` and `RemoteIdentityTrustRecord` model trusted, new, and changed contact keys.
- `src/data/mockData.ts` includes mock remote identity trust records.
- `src/security/remoteContactTrust.ts` centralizes trust-state copy and lookup.
- Contacts shows key-review badges and safety-number blocks.
- Conversation shows a prominent warning when the remote contact key is new or changed.

More detail: `docs/architecture/phase-15-remote-contact-trust.md`.

## Phase 16 Public Device Bundle Lookup

The API and mobile client now support authenticated public device bundle lookup:

- `GET /v1/devices/bundles/:accountId/:deviceId`
- Requires a bearer device-session token.
- Returns only public identity/prekey material.
- Prisma repository now reads active public bundles.
- Mobile `CipherChatApiClient` exposes `getPublicDeviceBundle`.
- Mock API client supports bundle lookup for UI-only work.

More detail: `docs/architecture/phase-16-public-device-bundles.md`.

## Phase 17 Remote Trust Sync

Remote contact trust is now provider-backed and can sync public bundles:

- Remote trust records persist in AsyncStorage.
- The backend provider loads remote contact trust at startup.
- Contacts uses provider trust records instead of static-only mock data.
- Contacts includes a "Sync Public Keys" action.
- Mock mode syncs through the mock API client.
- Live mode syncs through authenticated public device bundle lookup.
- Conversation warnings reflect synced trust records.

More detail: `docs/architecture/phase-17-remote-trust-sync.md`.

## Phase 18 Contact Discovery

CipherChat now has authenticated contact discovery plumbing:

- `GET /v1/accounts/discover?query=&limit=` searches account metadata and active public device bundles.
- The route requires a verified device session before returning public key material.
- Prisma search covers account ID, display name, and username.
- Mobile `CipherChatApiClient` exposes `discoverAccounts`.
- Mock mode returns seeded discovery results for prototype use.
- BackendProvider exposes contact discovery results and can add discovered device keys into local safety-number review.
- Contacts search now submits real discovery requests instead of being a static field only.

More detail: `docs/architecture/phase-18-contact-discovery.md`.

## Phase 19 Outbound Envelope Preparation

The mobile conversation composer now connects to the encrypted envelope fanout boundary:

- `CipherChatApiClient` exposes `sendEnvelopeFanout`.
- Mock API mode accepts fanout so the prototype remains usable offline.
- `src/services/messages/outboundEnvelopeService.ts` prepares prototype per-recipient envelopes.
- BackendProvider exposes `sendSecureMessage`.
- Conversation sends through the provider and shows queued envelope status.
- Sending is blocked until a recipient identity key is trusted.
- Plaintext is kept local to the UI path; the API receives only prototype envelope payloads.

This is not production encryption. The prototype service is intentionally named and documented so it can be replaced by Signal-style X3DH + Double Ratchet later.

More detail: `docs/architecture/phase-19-outbound-envelope-preparation.md`.

## Phase 20 Local Outbound Queue

CipherChat now has durable outbound send-state plumbing on mobile:

- `src/services/messages/outboundQueueStore.ts` persists prepared outbound fanout attempts.
- BackendProvider loads the queue at startup.
- `sendSecureMessage` persists a queued item before attempting API fanout.
- Queue items move through `queued`, `sending`, `sent`, and `failed`.
- Conversation displays durable send states from the queue.
- Failed or queued outbound items can be retried from the conversation.
- The queue stores prepared fanout metadata, not plaintext message bodies.

More detail: `docs/architecture/phase-20-outbound-queue.md`.

## Phase 21 Inbound Envelope Polling

CipherChat now has mobile inbound encrypted-envelope polling:

- BackendProvider exposes `pollInboundEnvelopes`.
- The app fetches pending encrypted envelopes for the active device.
- Each fetched envelope is acknowledged through the delivery API.
- Mock mode supports acknowledgement calls.
- Settings includes an `Encrypted Inbox` row for manual polling.
- The UI shows fetched and acknowledged envelope counts.
- No decrypted plaintext is stored or rendered in this phase.

More detail: `docs/architecture/phase-21-inbound-envelope-polling.md`.

## Phase 22 Inbound Sync State

CipherChat now persists inbound encrypted-envelope sync metadata:

- `src/services/messages/inboundEnvelopeStore.ts` stores non-sensitive delivery receipt state.
- BackendProvider can poll up to five inbound pages per manual sync.
- Stored sync state tracks cursors, totals, receipt count, and timestamps.
- Each fetched encrypted envelope is acknowledged before status is updated.
- Settings shows total acknowledgement status and whether more pages remain.
- Chats shows encrypted inbox health.
- Plaintext and encrypted envelope bodies are not persisted in this phase.

More detail: `docs/architecture/phase-22-inbound-sync-state.md`.

## Phase 23 Encrypted Local Database Boundary

CipherChat now has an explicit encrypted local database boundary:

- `src/services/ports/encryptedLocalDatabase.ts` defines the future database port.
- `src/services/local/encryptedDatabasePlan.ts` classifies local stores by sensitivity.
- The migration plan identifies AsyncStorage prototype records that must move before production.
- Settings shows encrypted local database readiness as planned, not falsely available.
- Security policy now blocks plaintext message persistence until encrypted storage reports `encrypted=true`.
- The target remains SQLCipher-backed SQLite in an Expo development build.

More detail: `docs/architecture/phase-23-encrypted-local-database-boundary.md`.

## Phase 24 Development Build and Local Schema v1

CipherChat is now prepared for native development builds and local encrypted database implementation:

- `expo-dev-client` is installed for development-client builds.
- `eas.json` defines development, preview, and production build profiles.
- `app.json` now has stable iOS/Android identifiers and the `cipherchat` URL scheme.
- `src/services/local/encryptedDatabaseSchema.ts` defines encrypted local database schema v1.
- Settings reports `Schema v1 planned` for the encrypted local database boundary.
- The app still does not persist plaintext messages until a real encrypted adapter reports `encrypted=true`.

More detail: `docs/architecture/phase-24-development-build-and-local-schema.md`.

## Phase 25 Native Encrypted Database Adapter Spike

CipherChat now has a first native encrypted local database adapter behind the existing port:

- `@op-engineering/op-sqlite` is installed.
- Root `package.json` enables OP-SQLite SQLCipher compilation.
- `src/services/local/opSQLiteEncryptedLocalDatabase.ts` lazy-loads OP-SQLite so Expo Go does not crash.
- The adapter provisions a 32-byte database key through SecureStore.
- The adapter opens `cipherchat-secure.db` with SQLCipher encryption and applies schema v1.
- Settings can probe the adapter and show whether the current runtime supports it.
- Prototype AsyncStorage data is intentionally not migrated yet.

More detail: `docs/architecture/phase-25-native-encrypted-database-adapter.md`.

## Phase 26 Encrypted Database Verification

CipherChat now has automated verification for the encrypted local database adapter:

- The OP-SQLite adapter is split into a testable core and an Expo runtime wrapper.
- `npm run app:test` verifies schema v1 statements, SQLCipher gating, record round-trip behavior, and wrong-key style open failure handling.
- `npm test` runs app tests and API tests together.
- Native emulator verification is documented but blocked locally until Android platform tools are available in PATH.
- Metro Android bundle verification still passes, so the lazy native adapter import does not break the prototype runtime.

More detail: `docs/architecture/phase-26-encrypted-database-verification.md`.

## Phase 27 Prototype Store Migration Harness

CipherChat now has a disabled-by-default migration harness for prototype AsyncStorage state:

- `src/services/local/prototypeStoreMigration.ts` collects remote trust records, outbound queue items, and inbound receipt metadata.
- Migration is skipped unless explicitly enabled.
- Migration is blocked unless the encrypted database reports `available=true` and `encrypted=true`.
- Records are copied through one encrypted database transaction.
- Source AsyncStorage data is not deleted.
- `npm run app:test` covers the skip, block, collect, and write paths.

More detail: `docs/architecture/phase-27-prototype-store-migration-harness.md`.

## Phase 28 Development Migration Control

CipherChat now has a development-only Settings control for migration inspection:

- `Migration Readiness` previews prototype records available to copy.
- `Copy to Encrypted Database` runs the guarded migration manually.
- The control is visible only in `__DEV__` builds.
- Migration remains blocked unless encrypted storage is active.
- Source AsyncStorage data is still preserved.

More detail: `docs/architecture/phase-28-development-migration-control.md`.

## Phase 29 Release Hardening CI

CipherChat now has a first CI/release hardening layer:

- `.github/workflows/ci.yml` runs on pushes and pull requests to `master`.
- CI provisions disposable PostgreSQL and Redis services.
- `npm run validate:ci` runs typecheck, app/API tests, API build, Prisma validation, Expo Doctor, and high-threshold audit.
- A production readiness checklist now lives in `docs/release/production-readiness-checklist.md`.

More detail: `docs/architecture/phase-29-release-hardening-ci.md`.

## Phase 30 API Integration Tests

CipherChat now has API integration tests against real disposable services:

- `npm run api:test:integration` applies Prisma migrations and runs integration tests.
- The test uses real PostgreSQL persistence through Prisma.
- The test uses real Redis/BullMQ delivery job enqueueing.
- It covers device bundle publication, device sessions, encrypted envelope fanout, inbox delivery, acknowledgement, and audit events.
- `npm run validate:ci` now includes the integration test.

More detail: `docs/architecture/phase-30-api-integration-tests.md`.

## Phase 31 EAS Development-Client Verification

CipherChat now has a repeatable development-client readiness gate:

- `scripts/verify-development-build-config.mjs` checks EAS, Expo, SecureStore, OP-SQLite, SQLCipher, Android, and iOS configuration.
- `npm run verify:dev-build-config` runs the native-readiness configuration check.
- `npm run validate:ci` includes the development-client configuration check.
- `docs/release/development-client-verification.md` documents Android and iOS installation smoke tests.

Local tool availability is treated separately from project configuration. Missing `eas`, missing `adb`, and absent `android/` or `ios/` folders are reported as environment warnings so CI can still validate the managed Expo configuration.

More detail: `docs/architecture/phase-31-eas-development-client-verification.md`.

## Phase 32 Threat Model and Security Acceptance Criteria

CipherChat now has a formal production security gate:

- `CipherChat-threat-model.md` documents assets, trust boundaries, entry points, abuse paths, prioritized threats, and manual review focus paths.
- `docs/security/security-acceptance-criteria.md` defines production blockers before real user message content can be handled.
- `scripts/verify-security-docs.mjs` checks that the threat model and acceptance criteria stay present.
- `npm run verify:security-docs` runs the security documentation gate.
- `npm run validate:ci` includes the security documentation gate.

More detail: `docs/architecture/phase-32-threat-model-security-criteria.md`.

## Phase 33 Production Crypto Provider Gating

CipherChat now blocks live message sends while the app is still using the prototype message crypto provider:

- `src/security/messageCryptoPolicy.ts` defines message crypto readiness.
- `src/security/messageCryptoPolicy.test.ts` proves prototype crypto is mock-only.
- `BackendProvider` blocks live sends and live retries before preparing prototype fanout data.
- Settings shows the active Message Crypto provider and readiness.
- The threat model and security acceptance criteria now reference the live-send blocker.

More detail: `docs/architecture/phase-33-production-crypto-gating.md`.

## Phase 34 Message Encryption Provider Interface

CipherChat now has an explicit message encryption provider boundary:

- `src/services/messages/messageEncryptionProvider.ts` defines the provider contract.
- `prototype-sha256-envelope-v1` is an explicit mock provider for UI/backend flow testing.
- `signal-double-ratchet-pending` is the production provider contract placeholder.
- `BackendProvider` uses the selected provider instead of importing prototype fanout directly.
- `messageCryptoPolicy` derives readiness from the selected provider.
- Provider selection is test-covered and can be controlled with `EXPO_PUBLIC_CIPHERCHAT_MESSAGE_CRYPTO_PROVIDER`.

More detail: `docs/architecture/phase-34-message-encryption-provider.md`.

## Phase 35 Outbound Plaintext Lifecycle Controls

CipherChat now guards the durable outbound queue against plaintext-shaped fields:

- `src/services/messages/outboundQueuePrivacy.ts` scans queue records before persistence.
- `src/services/messages/outboundQueueStore.ts` calls the scanner before writing to AsyncStorage.
- `src/services/messages/outboundQueuePrivacy.test.ts` covers direct and nested plaintext-shaped fields.
- `scripts/verify-plaintext-lifecycle.mjs` adds a lightweight release gate.
- `npm run validate:ci` includes `npm run verify:plaintext-lifecycle`.

Plaintext remains limited to transient UI state and the provider call boundary.

More detail: `docs/architecture/phase-35-outbound-plaintext-lifecycle.md`.

## Phase 36 Account and Session Abuse Controls

CipherChat now has explicit API abuse-control policy:

- `apps/api/src/security/abusePolicy.ts` defines route rate-limit and envelope cap constants.
- `apps/api/src/middleware/rateLimit.ts` applies route-aware rate limits.
- Encrypted envelope schemas cap fanout recipients, header size, and ciphertext size.
- API tests cover account creation throttling, fanout recipient caps, and payload-size caps.
- `scripts/verify-abuse-controls.mjs` adds a release gate.
- `npm run validate:ci` includes `npm run verify:abuse-controls`.

More detail: `docs/architecture/phase-36-account-session-abuse-controls.md`.

## Phase 37 Metadata Retention and Cleanup

CipherChat now has an enforceable server metadata cleanup boundary:

- `apps/api/src/security/metadataRetentionPolicy.ts` defines explicit retention windows.
- `apps/api/src/repositories/prismaMetadataRetentionRepository.ts` deletes stale challenges, sessions, acknowledged/expired envelopes, deleted file metadata, and old audit events.
- `POST /v1/internal/jobs/metadata/cleanup` enqueues the cleanup job behind the internal job token.
- The BullMQ worker handles `metadata.cleanup` jobs.
- Integration tests prove cleanup does not remove active sessions or valid queued envelopes.
- `scripts/verify-metadata-retention.mjs` adds a release gate.
- `npm run validate:ci` includes `npm run verify:metadata-retention`.

More detail: `docs/architecture/phase-37-metadata-retention-cleanup.md`.

## Phase 38 Delivery Queue and Redis Operations

CipherChat now has explicit Redis/BullMQ operational controls:

- `apps/api/src/operations/queueOperationsPolicy.ts` defines retained job counts, cleanup grace windows, and queue depth thresholds.
- `BullMqJobQueue` applies the policy to delivery fanout, envelope expiry, and metadata cleanup jobs.
- Internal ops routes expose queue depth, queue retention settings, and Redis rate-limit namespace stats.
- `POST /v1/internal/jobs/queue/cleanup` removes retained completed/failed jobs without touching active delivery work.
- Tests cover queue threshold evaluation, internal ops routes, and Redis-backed integration visibility.
- `scripts/verify-queue-operations.mjs` adds a release gate.
- `npm run validate:ci` includes `npm run verify:queue-operations`.

More detail: `docs/architecture/phase-38-delivery-queue-redis-operations.md`.

## Next Steps

1. Add production secret and environment validation.
2. Build and install an Expo development client before adding native Signal/MLS modules.
3. Replace exportable SecureStore-held private signing keys with non-exportable OS-backed keys where possible.
4. Complete a formal crypto integration plan for `libsignal` and MLS before implementing message encryption.
5. Install Android platform tools and run the SQLCipher adapter in a real development client.
6. Run the Android and iOS development-client verification checklist on installed native builds.
7. Add key transparency or auditable key-history design before production contact trust.
