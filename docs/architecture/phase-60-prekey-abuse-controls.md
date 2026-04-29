# Phase 60 - Prekey Abuse Controls

Phase 60 adds endpoint-specific abuse controls for one-time prekey claim and top-up operations.

## Prekey claim throttling

- `prekey-claim` limits repeated `POST /v1/devices/bundles/:accountId/:deviceId/claim` calls per requester/session bucket.
- The policy protects recipient prekey inventories from rapid depletion.
- The route still returns at most one public one-time prekey and consumes it transactionally.

## Prekey top-up throttling

- `prekey-top-up` limits repeated `POST /v1/devices/prekeys/top-up` calls from the authenticated current device.
- The existing top-up body schema also caps the number of public prekeys per request.
- Rate-limit responses expose only the generic `rate_limited` error and no key material.

## Dynamic route matching

The rate-limit hook now supports colon parameters in configured policy paths. This keeps route-aware policies readable while covering dynamic account/device IDs.

## Verification

- API tests cover throttling for dynamic prekey claim routes.
- API tests cover throttling for prekey top-up publishing.
- `npm run verify:abuse-controls` now checks for both prekey policies, dynamic route matching, and this phase document.
