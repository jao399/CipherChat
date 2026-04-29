# Phase 54 - Device Revocation And Compromise Handling

Phase 54 adds a server-enforced device revocation boundary for lost or compromised devices.

## Behavior

- `DELETE /v1/devices/:accountId/:deviceId` requires a valid device session.
- The authenticated session must belong to the same account as the device being revoked.
- Revocation sets `Device.revokedAt` and revokes all active sessions for that device.
- Revoked devices are excluded from public device bundle lookup and account discovery.
- Existing sessions from a revoked device fail future protected-route checks.

## Audit And Privacy

Revocation creates a metadata-only `device.revoked` audit event with:

- account id
- actor device id
- target device id
- a boolean indicating sessions were revoked

The audit event does not store device public keys, prekeys, safety numbers, message content, filenames, push tokens, or contact graph details.

## Security Rationale

Device session logout is not enough after suspected compromise. The device identity itself must stop being discoverable for new sessions and prekey lookup, and any active bearer tokens for that device must be invalidated. This phase gives later client UX a durable backend action for account device management.

## Remaining Work

- Add mobile UI actions for trusted-device review and revocation.
- Add user-visible key-change/revocation warnings in conversation trust state.
- Add operational alerting for unusual device add/revoke patterns.
