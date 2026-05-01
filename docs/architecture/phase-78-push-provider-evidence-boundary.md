# Phase 78 - Push Provider Evidence Boundary

Phase 78 adds a production readiness boundary for APNs/FCM provider evidence. It does not configure push providers, add credentials, send push notifications, or mark push delivery production-ready.

## What Changed

- `src/services/notifications/pushProviderReadiness.ts` reports APNs/FCM provider readiness.
- The default readiness state is blocked: APNs and FCM are not configured, provider log review is missing, and release smoke evidence is missing.
- `src/services/notifications/pushProviderReadiness.test.ts` proves generic payload policy alone is not enough to close provider evidence.
- Settings now surfaces Push Provider and Generic Push Payload Policy status.

## Required Production Evidence

Production push remains blocked until all of the following are true:

- APNs provider is configured through deployment secrets, not source control.
- FCM provider is configured through deployment secrets, not source control.
- Provider ports enforce the generic payload policy from Phase 72.
- Release smoke evidence shows only opaque wake/sync payloads are sent.
- Provider logs are reviewed and show no sensitive payload fields.
- Push tokens, Apple keys/certificates, Firebase service credentials, and device tokens are not committed or logged.

## Sensitive Data That Must Stay Out Of Push Payloads

Push payloads must not contain:

- plaintext message bodies or previews,
- sender, contact, group, or chat names,
- filenames, MIME types, or media captions,
- conversation, thread, account, contact, or graph identifiers,
- push tokens or provider registration tokens,
- safety numbers,
- decrypted identifiers.

## Production Status

APNs/FCM provider evidence remains blocking. CipherChat currently has the generic payload policy and provider readiness boundary only. No production push provider is configured in this repository.
