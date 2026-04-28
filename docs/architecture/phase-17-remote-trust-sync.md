# Phase 17 Remote Trust Sync

Phase 17 connects the remote contact trust UI to the public device bundle API added in Phase 16. The app still ships with mock contacts, but trust records are now loaded from local persistence and can be refreshed through the typed API client.

## What Changed

- Remote trust records now include account ID, device ID, identity key, sync source, and sync timestamp.
- `src/security/remoteContactTrust.ts` persists remote trust records in AsyncStorage.
- The backend provider loads remote trust records at startup.
- Contacts reads remote trust state from the provider instead of static-only mock data.
- Contacts includes a "Sync Public Keys" action.
- In mock mode, sync uses the mock API client.
- In live mode, sync uses `GET /v1/devices/bundles/:accountId/:deviceId` with the active device-session token.
- Conversation reads remote trust state from the provider, so warnings reflect synced records.

## Storage

Remote contact trust records are stored locally at:

```text
@cipherchat/remote-contact-trust-v1
```

Mock records are used as seed data, and persisted records override seed records by contact ID.

## Sync Behavior

For each contact with a known account/device pair:

1. Fetch the public device bundle.
2. Compare the fetched identity key with the locally stored identity key.
3. Mark the record `changed` when the identity key differs.
4. Regenerate fingerprint and safety-number blocks from the fetched identity material.
5. Persist the updated trust record locally.

The app still requires a valid device session for live sync. If the user has not verified this device yet, the sync action reports that live remote identity sync requires a verified session.

## Remaining Work

- Replace mock contact account/device IDs with real contact discovery.
- Add a dedicated safety-number comparison screen for remote contacts.
- Block or add a stronger confirmation before sending to changed-key contacts.
- Persist user trust decisions with more explicit audit metadata.
- Integrate fetched bundles into Signal/libsignal session setup once message encryption begins.
