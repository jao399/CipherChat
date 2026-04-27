# ADR 0004: Backend Stack

## Status

Accepted

## Decision

Use a TypeScript Fastify API, PostgreSQL with Prisma, Redis with BullMQ, and S3-compatible object storage.

## Context

CipherChat needs strict API boundaries, high-throughput encrypted envelope delivery, durable account/device/prekey metadata, job queues, encrypted file blob storage, and operational auditability.

## Consequences

- Server implementation can share TypeScript types with the client contracts.
- Every API route must have schema validation.
- PostgreSQL stores metadata and encrypted envelope records only.
- Redis/BullMQ handles delivery, retries, expiry, and cleanup jobs.
- Object storage stores encrypted blobs only, accessed through short-lived presigned URLs.
