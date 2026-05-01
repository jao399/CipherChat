# Phase 72 - Push Metadata Boundary

CipherChat now has a mobile-side push notification payload policy for future APNs/FCM integration. This phase does not configure production push credentials or provider delivery.

## What Changed

- `src/services/notifications/pushNotificationPolicy.ts` defines the generic push payload contract.
- `src/services/notifications/pushNotificationPolicy.test.ts` verifies allowed and blocked payload shapes.
- Push payloads are limited to opaque event IDs, generic delivery hints, and bounded badge counts.

## Allowed Payload Shape

```ts
{
  opaqueEventId: string;
  deliveryHint: 'encrypted_envelope_available' | 'sync_required';
  badgeCount?: number;
}
```

## Blocked Data

Push payloads must not include:

- message plaintext or previews,
- sender, contact, group, or chat names,
- filenames or media captions,
- conversation, thread, chat, account, or recipient identifiers,
- safety numbers,
- tokens or decrypted identifiers.

## Production Policy

Production APNs/FCM wiring must use this generic wake/sync policy and provider logs must be reviewed to confirm no sensitive metadata is emitted. Push production wiring remains blocked until credentials, provider ports, release smoke checks, and privacy evidence are complete.

