# Phase 56 - Account Device Management

Phase 56 adds account-device visibility across the API and mobile app.

## Backend

- `GET /v1/devices` requires a valid device session.
- The endpoint returns only devices belonging to the authenticated account.
- Returned metadata includes device name, trust state, current-device marker, timestamps, and revocation status.
- The endpoint does not return identity keys, signed prekeys, one-time prekeys, safety numbers, session tokens, push tokens, or message metadata.

## Mobile

- `CipherChatApiClient.listAccountDevices` loads the authenticated account device list.
- `BackendProvider.refreshAccountDevices` stores device metadata for UI rendering.
- `DeviceManagementScreen` shows current, active, and revoked devices.
- Users can revoke an account device from the device-management screen.

## Remaining Work

- Add real multi-device naming and rename support.
- Add account recovery warnings when revoking the final active device.
- Add push-token cleanup when production push-token storage is implemented.
