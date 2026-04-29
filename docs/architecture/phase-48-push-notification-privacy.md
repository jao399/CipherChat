# Phase 48 - Push Notification Privacy And Delivery Boundary

CipherChat now has a backend push-notification boundary that keeps mobile wakeups generic while routing delivery through APNs/FCM-shaped provider ports.

## Implemented

- Added `apps/api/src/push/pushPrivacy.ts` to create and validate generic wake payloads.
- Added `apps/api/src/push/pushNotificationService.ts` with `PushNotificationPort`, APNs/FCM provider ports, configured provider message builders, and a no-op implementation reserved for explicit test/development injection.
- Added runtime configuration plumbing for APNs and FCM provider credentials.
- Updated the delivery fanout worker path to create a generic push wake and send it through the configured push adapter instead of the default no-op service.
- Added tests that reject sensitive payload fields such as message text, sender names, group names, filenames, and plaintext previews, and prove unsafe payloads never reach provider ports.

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

A production APNs/FCM sender should sit behind `ApnsPushProviderPort` and `FcmPushProviderPort`. The generic `PushNotificationPort` remains the worker boundary and calls `assertPushPayloadPrivacy` before any provider-specific message is built or delivered. Provider-facing payload data is limited to:

- `opaqueEventId`
- `deliveryHint`
- `badgeCount`

APNs messages are background wakes with `apns-push-type=background`, `apns-priority=5`, and no alert body. FCM messages use data-only wake fields and no `notification` block. Device push tokens should be stored separately from message metadata and rotated or deleted when devices are revoked.

## Runtime Configuration

Production startup fails closed unless at least one provider is configured completely.

Required for APNs when `PUSH_APNS_ENABLED=true`:

- `PUSH_APNS_TEAM_ID`
- `PUSH_APNS_KEY_ID`
- `PUSH_APNS_BUNDLE_ID`
- `PUSH_APNS_PRIVATE_KEY`
- `PUSH_APNS_ENVIRONMENT` set to `production` or `sandbox`

Required for FCM when `PUSH_FCM_ENABLED=true`:

- `PUSH_FCM_PROJECT_ID`
- `PUSH_FCM_CLIENT_EMAIL`
- `PUSH_FCM_PRIVATE_KEY`

The worker constructs the configured push adapter during startup. Missing provider configuration blocks startup, and a provider enabled without an injected APNs/FCM port fails the delivery job rather than silently dropping or downgrading to no-op delivery.

## Operational Expectations

- Treat push delivery as wake-only; clients fetch encrypted envelopes after wake.
- Monitor APNs and FCM delivery error rates separately from queue health.
- Alert on repeated provider-port failures, credential-expiry errors, and unexpected notification payload validation failures.
- Rotate APNs/FCM credentials through the deployment secret manager; never commit provider private keys.
- Keep provider logs free of message IDs, sender names, group names, filenames, or plaintext previews.
