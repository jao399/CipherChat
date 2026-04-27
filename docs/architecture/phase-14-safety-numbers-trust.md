# Phase 14 Safety Numbers And Identity Trust

Phase 14 makes device identity state visible in the mobile app. CipherChat now derives safety-number blocks from the active local Ed25519 identity, stores local trust records, and detects when the same account/device identity key changes.

## What Changed

- Added `src/security/safetyNumber.ts`.
- Added `src/security/trustedIdentityStore.ts`.
- Device Verification now displays the generated safety number instead of a static placeholder.
- Device Verification shows whether the local identity is new, trusted, or changed.
- Settings now shows the current identity trust state and safety number.
- Identity rotation preserves account/device IDs and changes the key, so the trust store can detect a changed identity.
- Continuing through Device Verification marks the current device identity trusted after session bootstrap.
- The app clears stale stored sessions when they no longer match the active local identity.

## Trust States

- `new`: no trusted record exists yet for this account/device pair.
- `trusted`: the stored trusted identity key matches the active local identity key.
- `changed`: the account/device pair is known, but the active identity key is different.

`changed` is the important security state. It means the app should require review before treating the identity as trusted again.

## Safety Number

Safety numbers are derived from:

```text
accountId:deviceId:identityKey
```

The app hashes that material with SHA-256 and displays the first six four-character blocks. This gives a compact verification surface for the current prototype. A production app should define the safety-number format in the cryptographic protocol specification and include all required identity material for both parties.

## Storage

Trusted identity records are stored locally in AsyncStorage:

```text
@cipherchat/trusted-identities-v1
```

Records include account ID, device ID, identity key, fingerprint, safety-number blocks, first-seen time, last-seen time, and trusted time.

## Remaining Work

- Add contact-to-contact safety number comparison, not only local device identity display.
- Add high-friction UI for changed remote contact keys.
- Add notification surfaces for changed safety numbers inside conversations.
- Make key rotation a deliberate security workflow with confirmation and recovery guidance.
- Tie safety numbers to the final Signal/libsignal identity material.
