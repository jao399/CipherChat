# CipherChat

CipherChat is a premium Expo React Native TypeScript UI prototype for a future secure encrypted messaging app. It is frontend-only today: all screens use mock data, local onboarding persistence, reusable UI components, and a future-ready project structure for real encryption and backend work later.

Design direction: dark cyber-security aesthetic, neon purple brand glow, green security accents, elevated glass cards, shield/chat/lock logo language, and polished onboarding inspired by the supplied reference image.

## Tech Stack

- Expo + React Native
- TypeScript
- React Navigation native stack + bottom tabs
- AsyncStorage for first-launch onboarding persistence
- Expo Linear Gradient
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
  assets/logo/          Brand SVG and PNG logo assets
  components/common/    Buttons, cards, inputs, logo, QR, headers, badges
  components/chat/      Chat list item and message bubble components
  components/settings/  Settings rows
  constants/            Storage keys and shared constants
  data/                 Mock chats, messages, files, contacts, calls, stats
  navigation/           Root stack and tab navigation
  screens/              Auth, onboarding, main, security, settings screens
  theme/                Colors, spacing, typography, radii, shadows, gradients
  types/                Shared TypeScript models
```

## Branding Assets

Logo assets are in `src/assets/logo/`:

- `master-logo.svg` / `master-logo.png`
- `logo-mark.svg` / `logo-mark.png`
- `horizontal-lockup.svg` / `horizontal-lockup.png`
- `splash-lockup.svg` / `splash-lockup.png`
- `app-icon-source.svg` / `app-icon-source.png`
- `adaptive-icon-foreground.svg` / `adaptive-icon-foreground.png`
- `monochrome-icon.svg` / `monochrome-icon.png`
- `header-tab-icon.svg` / `header-tab-icon.png`

Expo launcher assets are configured in `assets/` and referenced from `app.json`:

- `assets/icon.png`
- `assets/adaptive-icon.png`
- `assets/splash-icon.png`
- `assets/favicon.png`

## Onboarding Persistence

The onboarding carousel writes `@cipherchat/onboarding-complete` to AsyncStorage when the user taps Skip, Start Now, or Get Started. The splash screen reads that key and routes first-time users to onboarding; returning users go to the welcome screen. Settings includes a prototype reset action that removes the key and reopens onboarding.

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

## Next Steps

1. Pick audited crypto libraries and define the security model.
2. Write a protocol specification before backend implementation.
3. Add real auth, device identity, secure storage, and encrypted local database layers.
4. Build an encrypted messaging service with prekey distribution and message queues.
5. Add security tests, threat modeling, independent review, and abuse-prevention workflows.
