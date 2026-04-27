# Phase 6 Persistence Foundation

Phase 6 turns the Phase 5 API shell into a persistence-ready backend while preserving the core security boundary: the server stores encrypted protocol payloads and delivery metadata only. It does not receive plaintext message bodies, private identity keys, local database keys, decrypted filenames, or decrypted file contents.

## Added In This Phase

- PostgreSQL development service in `docker-compose.yml`.
- Prisma migration at `apps/api/prisma/migrations/20260426000100_phase_6_persistence/migration.sql`.
- Prisma client bootstrap and readiness check in `apps/api/src/db/prisma.ts`.
- Repository interfaces in `apps/api/src/repositories/types.ts`.
- Prisma-backed device bundle persistence in `apps/api/src/repositories/prismaDeviceRepository.ts`.
- Prisma-backed encrypted envelope persistence in `apps/api/src/repositories/prismaMessageRepository.ts`.
- API route tests in `apps/api/src/routes/apiRoutes.test.ts`.

## Runtime Behavior

When `DATABASE_URL` is not set, the API still starts for UI/mobile work. `/ready` reports `database: "disabled"` and persistence routes return `503 database_unavailable`.

When `DATABASE_URL` is set and the database is reachable:

- `POST /v1/devices/bundles` upserts the account, device identity public key material, and signed prekey bundle.
- `POST /v1/messages/envelopes` stores an idempotent encrypted message envelope keyed by `messageId`.
- `/ready` reports `database: "connected"`.

## Local Database

Start PostgreSQL:

```bash
docker compose up -d postgres
```

Apply migrations:

```bash
npm run prisma:migrate:deploy
```

Run the API with persistence enabled:

```bash
$env:DATABASE_URL="postgresql://cipherchat:cipherchat@localhost:5432/cipherchat?schema=public"
npm run api:dev
```

## Security Boundary

The database schema intentionally stores:

- device public identity key material
- signed prekeys and one-time prekey payloads
- encrypted message headers
- encrypted message bodies
- delivery state
- encrypted file object metadata
- minimal account/device routing metadata

The database schema intentionally does not store:

- plaintext messages
- private keys
- decrypted filenames
- decrypted MIME types
- decrypted file contents
- local mobile secure-store material

## Exit Criteria

- TypeScript passes for app and API.
- API unit/integration-style route tests pass.
- Prisma schema validates.
- Prisma client generates.
- Expo Doctor passes.
- Android Metro bundle still compiles.
- Optional local Postgres smoke test can apply migrations and persist device/message records.

## Next Phase

Phase 7 should add the authenticated device/session layer before real cryptographic protocol integration:

- account registration/login contract
- device session tokens
- request authentication middleware
- account/device ownership checks
- delivery fetch/ack APIs
- rate limiting and abuse-safe audit events
- no custom cryptography yet
