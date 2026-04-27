# CipherChat Phase 4 Secure Foundation

Phase 4 selects the implementation foundation for the real secure system. This phase still does not build the backend or implement encryption. It chooses the stack, documents the reasoning, and defines the gates that must be met before production data is handled.

## Selected Stack

### Mobile Runtime

- Keep Expo React Native TypeScript.
- Move real secure builds from Expo Go to Expo development builds before adding native cryptography or encrypted database modules.
- Use config plugins and Continuous Native Generation when native dependencies are introduced.

Reasoning:

- The current UI prototype is stable in Expo.
- Real encrypted storage and protocol libraries will require native code.
- Expo development builds are the correct path for adding custom native modules while preserving Expo tooling.

References:

- Expo development builds: https://docs.expo.dev/develop/development-builds/introduction/
- Expo custom native code: https://docs.expo.dev/workflow/customizing/
- Expo config plugins: https://docs.expo.dev/config-plugins/plugins-and-mods/

### Secure Small-Secret Storage

- Use `expo-secure-store` for small secrets during early implementation.
- Do not use AsyncStorage for private keys, database keys, session secrets, or recovery secrets.
- Reassess with a custom native Keychain/Keystore wrapper before production if non-exportable hardware-backed key operations are required.

Reference:

- Expo SecureStore: https://docs.expo.dev/versions/latest/sdk/securestore/

### Encrypted Local Database

- Use SQLCipher-backed SQLite for local encrypted data.
- Preferred React Native candidate: OP-SQLite with SQLCipher support in a development build.
- Store the database key through OS secure storage, never in AsyncStorage.

References:

- OP-SQLite: https://op-engineering.github.io/op-sqlite/
- SQLCipher: https://github.com/sqlcipher/sqlcipher

### One-to-One Encryption

- Use Signal’s official `libsignal` family for X3DH and Double Ratchet implementation work.
- Do not use old/unmaintained JavaScript-only Signal protocol packages.
- Expect native integration work and license review before production.

Reference:

- Signal libsignal: https://github.com/signalapp/libsignal

### Group Encryption

- Use MLS for group messaging.
- Preferred implementation candidate: OpenMLS through a native/Rust bridge when group messaging begins.
- Group messaging should not be built by adapting one-to-one sessions manually.

Reference:

- OpenMLS: https://www.mintlify.com/openmls/openmls/concepts/mls-protocol

### Backend API

- Use TypeScript Fastify for the API service.
- Use strict request/response schemas for every API boundary.
- Generate OpenAPI from schemas before broad client integration.

Reference:

- Fastify TypeScript docs: https://fastify.dev/docs/latest/Reference/TypeScript/

### Database

- Use PostgreSQL for server-side account, device, prekey, queue metadata, encrypted envelope metadata, abuse controls, and audit events.
- Use Prisma ORM initially for typed schema management and migration ergonomics.
- Do not store plaintext message bodies, plaintext files, private keys, or recovery secrets in PostgreSQL.

References:

- Prisma TypeScript: https://www.prisma.io/typescript
- Prisma PostgreSQL connector: https://docs.prisma.io/docs/v6/orm/overview/databases/postgresql

### Queue

- Use Redis-backed BullMQ for delivery, push, retry, expiry, cleanup, and abuse-control jobs.
- Message contents remain encrypted envelopes.

Reference:

- BullMQ docs: https://docs.bullmq.io/

### Object Storage

- Use S3-compatible object storage for encrypted file blobs.
- Use short-lived presigned upload/download URLs.
- File keys never go to object storage.

Reference:

- AWS S3 presigned URLs: https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html

### Push

- Use generic push notifications only.
- Payloads may contain opaque event ids and badge hints.
- Payloads must not contain message text, sender names, group names, filenames, or plaintext previews.

### Observability

- Use structured logs and metrics.
- Logs must contain opaque ids and event types only.
- Do not log ciphertext bodies unless explicitly needed for delivery debugging, and never log plaintext or keys.

## Phase 4 Implementation Boundaries

Allowed in Phase 4:

- Documentation.
- ADRs.
- Type contracts.
- Stack manifest.
- Validation scripts.

Not allowed in Phase 4:

- Real backend endpoints.
- Fake encryption.
- Custom cryptography.
- Storage of real secrets.
- Production account flows.

## Phase 4 Exit Criteria

- Stack decisions documented.
- ADRs written.
- TypeScript stack manifest compiles.
- README reflects Phase 4.
- Existing app still passes TypeScript and Expo Doctor.
- Android bundle still loads.
