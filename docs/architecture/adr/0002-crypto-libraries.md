# ADR 0002: Cryptographic Libraries

## Status

Accepted

## Decision

Use Signal `libsignal` for one-to-one messaging and OpenMLS for group messaging evaluation. Do not invent custom cryptography and do not use old JavaScript-only protocol implementations as the production foundation.

## Context

CipherChat needs asynchronous one-to-one messaging, forward secrecy, post-compromise security, secure group messaging, and device verification. These are protocol-level requirements, not UI features.

## Consequences

- One-to-one messaging implementation must support X3DH and Double Ratchet.
- Group messaging must use MLS instead of manually combining one-to-one sessions.
- Native integration and license review are required before implementation.
- Protocol test vectors and external review are required before production.
