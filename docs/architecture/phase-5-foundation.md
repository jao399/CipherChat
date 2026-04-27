# CipherChat Phase 5 Foundation

Phase 5 creates the first implementation foundation for the future secure system. It does not implement real encryption, real auth, production message delivery, or production file transfer.

## Completed In Phase 5

### API Workspace

Created `apps/api` as a TypeScript Fastify workspace package.

Implemented:

- `GET /health`
- `GET /ready`
- `POST /v1/devices/bundles`
- `POST /v1/messages/envelopes`

The device and message routes intentionally return `501 not_implemented`. They validate payload shapes and reserve the API boundary, but do not persist data or pretend to deliver encrypted messages.

### Prisma Metadata Schema

Created `apps/api/prisma/schema.prisma` for future server metadata:

- Accounts
- Devices
- Prekey bundles
- Encrypted message envelopes
- Encrypted file objects
- Abuse reports
- Audit events

The schema avoids plaintext message body storage, plaintext file storage, and private key storage.

### Mobile Secure Storage Adapter

Created `src/services/local/secureStoreAdapter.ts`.

The adapter implements the `LocalSecureStorePort` and uses `expo-secure-store` for small secret storage. AsyncStorage remains limited to non-sensitive prototype state.

## Current Non-Production Boundaries

- API routes are scaffolds only.
- Database is not connected.
- Queue is not connected.
- Object storage is not connected.
- No cryptographic protocol is implemented.
- No private keys are generated.
- No real user credentials are accepted.

## Run Commands

Root validation:

```bash
npm run typecheck
npx expo-doctor
```

API validation:

```bash
npm run typecheck:api
npm run prisma:generate
npm run prisma:validate --workspace @cipherchat/api
```

API development:

```bash
npm run api:dev
```

## Phase 5 Exit Criteria

- API workspace compiles.
- Prisma schema validates.
- Mobile app typechecks.
- Expo Doctor passes.
- Android bundle loads.
- No fake encryption or fake delivery is introduced.

## Next Phase

Phase 6 should add the first real backend adapters:

- PostgreSQL connection and migrations.
- Prisma repositories.
- Device bundle persistence.
- Prekey publishing and retrieval.
- Encrypted envelope queue persistence.
- Redis/BullMQ job scaffolding.
- API integration tests.

Do not add real encryption until the selected crypto libraries are integrated and tested.
