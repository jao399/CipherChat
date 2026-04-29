# Phase 48 - Push Notification Privacy And Delivery Boundary

CipherChat now has a backend push-notification boundary that keeps mobile wakeups generic until a production APNs/FCM provider is connected.

## Implemented

- Added `apps/api/src/push/pushPrivacy.ts` to create and validate generic wake payloads.
- Added `apps/api/src/push/pushNotificationService.ts` with a `PushNotificationPort` and development-safe no-op implementation.
- Updated the delivery fanout worker path to create a generic push wake and send it through the push port.
- Added tests that reject sensitive payload fields such as message text, sender names, group names, filenames, and plaintext previews.

## Payload Shape

Allowed payload fields:

- `opaqueEventId`
- `deliveryHint`
- `badgeCount`

Forbidden payload fields include:

- message text or plaintext previews
- sender, contact, chat, or group names
- filenames or media captions

Clients must treat push as a wake signal only. After a wake, the app fetches encrypted envelopes from the server and decrypts locally.

## Production Provider Contract

A production APNs/FCM sender should implement `PushNotificationPort` and must call `assertPushPayloadPrivacy` before provider delivery. Device push tokens should be stored separately from message metadata and rotated or deleted when devices are revoked.
