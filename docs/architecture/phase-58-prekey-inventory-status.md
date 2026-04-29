# Phase 58 - Prekey Inventory Status

Phase 58 adds metadata-only prekey inventory visibility for the authenticated device.

## Backend

- `GET /v1/devices/prekeys/status` requires a verified device session.
- The endpoint reports only:
  - account id
  - device id
  - one-time prekey count
  - low-watermark threshold
  - recommended inventory count
  - whether a top-up is needed
- The repository reads the active device prekey bundle and calculates status without returning key material.

## Mobile

- `CipherChatApiClient.getDevicePrekeyStatus` loads current-device inventory status.
- `BackendProvider.refreshDevicePrekeyStatus` stores the status for UI.
- `DeviceManagementScreen` displays whether the current device is below the low watermark.

## Privacy Boundary

The status path does not return identity keys, signed prekeys, one-time prekey values, safety numbers, message metadata, push tokens, or contact graph details.

## Remaining Work

- Add authenticated one-time prekey top-up publishing for the current device.
- Add server-side low-watermark operational metrics.
- Add client notifications or warnings when production messaging would run out of one-time prekeys.
