# Phase 55 - Mobile Device Revocation UX

Phase 55 wires the device revocation backend boundary into the Expo app.

## App Behavior

- `CipherChatApiClient.revokeDevice` calls `DELETE /v1/devices/:accountId/:deviceId`.
- Mock mode deletes the local mock public bundle so prototype behavior mirrors live revocation.
- `BackendProvider.revokeCurrentDevice` revokes the active device, clears the stored session, and updates backend status.
- Settings now exposes a guarded **Revoke This Device** action under Prototype Backend.

## Security Properties

- The app never sends private key material during revocation.
- Revocation uses the existing bearer device session.
- Local session state is cleared only after the server or mock adapter accepts revocation.
- Users must verify/bootstrap again before live encrypted delivery can resume on that device.

## Remaining Work

- Add a full device-management screen that lists all account devices.
- Add recovery flow guidance for users who revoke their only active device.
- Add push-token cleanup once production push-token storage is implemented.
