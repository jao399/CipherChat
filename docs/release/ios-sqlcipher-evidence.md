# iOS SQLCipher Evidence

Evidence status: missing
Blocking status: blocking-before-production
Last verified: not verified on this Windows workspace

## Current Evidence

No iOS SQLCipher runtime evidence is available from this Windows workspace. iOS verification requires macOS, Xcode, and an installed Expo development client.

## Required Release Evidence

- Build and install the iOS Expo development client for the release-candidate configuration.
- Open CipherChat and confirm the encrypted database boundary reports SQLCipher availability and `encrypted=true`.
- Capture simulator or device logs or screenshots showing the adapter status without message content, filenames, contact graph data, private keys, tokens, safety numbers, or decrypted identifiers.
- Attach the evidence to this document or the external audit packet.

## Production Status

This remains blocking for production. Demo and mock mode remain usable, and production claims must not say iOS encrypted storage has been verified until this evidence exists.

