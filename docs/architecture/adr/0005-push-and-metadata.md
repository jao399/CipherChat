# ADR 0005: Push And Metadata

## Status

Accepted

## Decision

Use generic push notifications and minimize server-retained metadata.

## Context

Push notifications and operational logs can accidentally leak sensitive relationship and message metadata even when message bodies are encrypted.

## Consequences

- Push payloads may contain opaque event ids and badge hints only.
- Push payloads must not contain message text, sender names, group names, filenames, or plaintext previews.
- Server logs must use opaque ids and event types.
- Retention limits must be defined before production.
