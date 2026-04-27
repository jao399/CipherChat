# Phase 15 Remote Contact Trust

Phase 15 extends identity trust from the local device to remote contacts. CipherChat now has mock remote identity trust records and visible key-review surfaces in Contacts and Conversation.

## What Changed

- Added `RemoteIdentityTrustState` and `RemoteIdentityTrustRecord` types.
- Added mock remote identity trust records in `src/data/mockData.ts`.
- Added `src/security/remoteContactTrust.ts`.
- Contacts now shows trusted, new, and changed contact identity states.
- Contacts now shows each contact's safety-number blocks.
- Conversation now displays a warning card when the remote contact identity is new or changed.

## Trust States

- `trusted`: safety number is trusted on this device.
- `new`: the contact has identity material but has not been verified locally.
- `changed`: the contact's identity key changed for a known account/device context.

The changed state is intentionally prominent because it can mean legitimate device migration, account recovery, or compromise. Production behavior should require deliberate review before sending sensitive messages.

## Current Scope

This phase uses mock remote identity records because contact discovery and real remote key retrieval are not implemented yet. The important UI and domain shape are now present:

- Contacts can display identity review state.
- Conversations can interrupt the normal message flow with a key-change warning.
- Safety-number blocks are visible where users expect to compare them.

## Remaining Work

- Fetch remote identity bundles from the backend.
- Persist remote contact trust decisions locally.
- Add a dedicated contact safety-number comparison screen.
- Block or warn before sending after a changed remote key.
- Record key-change audit events without exposing message contents or contact graphs.
- Tie remote trust records to Signal/libsignal identity keys once message encryption is implemented.
