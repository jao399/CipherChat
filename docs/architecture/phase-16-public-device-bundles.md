# Phase 16 Public Device Bundle Lookup

Phase 16 adds authenticated lookup for public device identity/prekey bundles. This is the backend and mobile client plumbing needed before remote contact trust can move from mock records to real fetched identity material.

## API

New endpoint:

```text
GET /v1/devices/bundles/:accountId/:deviceId
Authorization: Bearer <device-session-token>
```

The route returns only public device material:

- account ID
- account display name
- device ID
- device display name
- identity public key
- signed prekey
- signed prekey signature
- one-time prekeys
- bundle publish timestamp

The route requires an authenticated device session. Bundle discovery is not anonymous.

## Files

- `apps/api/src/repositories/types.ts`
- `apps/api/src/repositories/prismaDeviceRepository.ts`
- `apps/api/src/routes/deviceRoutes.ts`
- `apps/api/src/schemas.ts`
- `apps/api/src/routes/apiRoutes.test.ts`
- `src/services/api/cipherChatApiClient.ts`
- `src/services/api/mockCipherChatApiClient.ts`
- `src/services/api/types.ts`

## Security Notes

This endpoint intentionally exposes public key material only. It must not return private keys, session tokens, message content, local trust decisions, contact graph details, or decrypted identifiers.

Future production hardening should add:

- abuse controls around bundle lookup volume
- privacy-preserving contact discovery
- server-side limits on one-time prekey depletion
- audit events that do not expose contact graphs
- client pinning and local trust comparison before using changed bundles

## Next Use

The mobile app can now call `getPublicDeviceBundle` from the typed API client. The next phase should replace mock remote trust records with fetched bundles and local trust persistence for contacts.
