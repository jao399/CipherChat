# Phase 53 - Device Key Audit History

Phase 53 adds metadata-only audit events for device bundle and public key material publication.

## What changed

- `PrismaDeviceRepository.publishDeviceBundle` now records an audit event in the same transaction as account/device/prekey persistence.
- Audit event types distinguish:
  - `device_bundle.first_device_published`
  - `device_bundle.device_added`
  - `device_bundle.identity_changed`
  - `device_bundle.updated`
- Integration tests assert device bundle audit events exist and do not contain public key/prekey material.

## Privacy boundary

The audit event metadata intentionally stores only:

- whether the device was already known
- whether the identity key changed
- the number of one-time prekeys published

It does not store identity keys, signed prekeys, one-time prekey values, safety numbers, message content, filenames, or contact graph details.

## Remaining production work

This is not key transparency. Production still needs auditable key history or transparency semantics that clients can verify, changed-key notifications, and an external protocol review.
