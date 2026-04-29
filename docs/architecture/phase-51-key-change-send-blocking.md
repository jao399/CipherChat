# Phase 51 - Key-Change Send Blocking

Phase 51 closes a send-safety gap around changed remote identity keys.

## What changed

- Added `src/security/recipientTrustPolicy.ts`.
- Added tests for missing, new, changed, and trusted recipient states.
- Updated `BackendProvider` so first sends and queued-message retries both require the current recipient trust state to be `trusted`.

## Security behavior

CipherChat now fails closed when:

- no recipient identity record is available
- a recipient identity is new and has not been reviewed
- a recipient identity changed after the previous trusted safety number
- a queued message is retried after the recipient trust record moved out of `trusted`

This matters because retrying a locally queued encrypted fanout should not bypass a changed-key warning that appeared after the original queue item was created.

## Verification

Run:

```bash
npm run app:test
npm run validate:ci
```
