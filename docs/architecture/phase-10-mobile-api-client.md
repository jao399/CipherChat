# Phase 10 Mobile API Client Integration

Phase 10 connects the Expo app to the backend contracts without turning the UI prototype into a production encrypted messenger yet. The app still defaults to mock mode so onboarding, navigation, and demos work offline, but the same screens can now prepare a device session against the local Fastify API.

## Scope

- Add a typed mobile API client for the Phase 8 and Phase 9 backend routes.
- Keep mock mode as the default for reliable UI demos.
- Store device-session identifiers with AsyncStorage and bearer tokens with `expo-secure-store`.
- Expose backend mode, readiness, and prototype-session state from a React provider.
- Wire Device Verification so "Continue Securely" prepares a prototype session before entering the main app.
- Add Settings controls to switch between mock and live API mode, refresh backend readiness, and clear the prototype session.

## Mobile Files

- `src/config/api.ts` centralizes API storage keys, default mode, default Android emulator base URL, and prototype labels.
- `src/services/api/cipherChatApiClient.ts` wraps backend HTTP routes with typed methods.
- `src/services/api/mockCipherChatApiClient.ts` provides a deterministic local fallback for UI-only operation.
- `src/services/api/apiSessionStore.ts` persists account/device IDs and protects the session token through SecureStore.
- `src/services/api/BackendProvider.tsx` owns backend mode, readiness, active session state, and prototype session bootstrap.
- `src/security/deviceIdentityProvider.ts` owns local prototype identity material and challenge signing.
- `src/hooks/useBackend.ts` exposes the backend context to screens.

## Startup And UI Flow

`App.tsx` now wraps navigation with `BackendProvider`. During app startup, the provider loads stored backend mode, base URL, and any existing prototype session.

The app starts in `mock` mode:

1. Splash and onboarding remain unchanged.
2. Device Verification calls `bootstrapPrototypeSession`.
3. Mock mode creates a local session and enters the main tabs.
4. Settings shows backend state as "Mock mode active".

When `Live API Mode` is enabled in Settings:

1. The app checks `http://10.0.2.2:4000/ready` by default, which targets the host machine from the Android emulator.
2. Device Verification publishes an Ed25519-backed device bundle.
3. It creates a device challenge.
4. It signs the challenge with the local Ed25519 private key.
5. The returned token is stored in SecureStore.

Live mode requires the API to run locally with the Ed25519 verifier enabled:

```bash
docker compose up -d postgres redis
$env:DATABASE_URL="postgresql://cipherchat:cipherchat@localhost:5432/cipherchat?schema=public"
$env:REDIS_URL="redis://localhost:6379"
$env:DEVICE_SIGNATURE_VERIFIER="ed25519"
$env:API_HOST="0.0.0.0"
npm run prisma:migrate:deploy
npm run api:dev
```

Do not enable `ALLOW_INSECURE_DEV_SIGNATURES` unless you are explicitly testing legacy local development flows.

## Security Boundary

This phase is an integration bridge. Phase 13 upgrades challenge signing to Ed25519, but messaging encryption and Signal/MLS protocol state are still future work. The important boundary is structural:

- The mobile app now has one typed place for backend calls.
- Tokens are not stored in AsyncStorage.
- Screens do not call `fetch` directly.
- Mock mode and live mode share the same conceptual flow.
- Future real crypto can replace prototype bundle creation without rewriting navigation.

Phase 13 adds the mobile Ed25519 signing provider. Production work must still add OS-backed non-exportable private-key protection where possible, encrypted local storage, Signal/MLS protocol state, and security review.
