# Phase 61 - Signal X3DH Prekey Contract

Phase 61 adds a stricter contract for future Signal/libsignal prekey bundle integration without implementing custom cryptography.

## What changed

- Mobile security code now defines `signal-x3dh-v1` as the only accepted production prekey bundle format.
- The validator rejects prototype placeholders such as `prototype_one_time_prekey` and non-Signal key prefixes.
- The Signal one-to-one provider only reports production readiness when an injected adapter declares the `signal-x3dh-v1` prekey bundle format.
- Tests cover valid bundle shape, rejected prototype placeholders, and adapter format gating.

## Why this matters

CipherChat already has backend prekey publication, claim, inventory, and top-up plumbing. Those routes are still transport and persistence boundaries. They do not make the prototype production encrypted until the mobile client publishes and consumes reviewed Signal/libsignal-compatible X3DH material.

## Explicit non-goals

- No custom X3DH or Double Ratchet implementation was added.
- No fake private key generation was added.
- No production encryption readiness was claimed.

## Remaining production blocker

Install and review a real libsignal-compatible native adapter that can:

- generate Signal identity, signed prekey, and one-time prekey material;
- sign and verify signed prekeys;
- establish X3DH sessions from claimed prekey bundles;
- run Double Ratchet encryption/decryption;
- persist session state only in encrypted local storage.
