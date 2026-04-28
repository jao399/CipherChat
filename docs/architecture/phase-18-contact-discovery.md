# Phase 18 - Contact Discovery Plumbing

## Status

Phase 18 adds the first production-shaped account discovery contract. This is still not privacy-preserving private contact discovery, but it replaces the static-only app boundary with an authenticated API and mobile search flow that can later be hardened.

## What changed

- Added `GET /v1/accounts/discover?query=&limit=` behind device-session authentication.
- Added a repository contract for account search results with active public device bundles.
- Implemented the Prisma-backed search over account ID, display name, and username.
- Added typed mobile API support for account discovery.
- Added mock discovery support so the UI remains usable without the API.
- Added BackendProvider methods for searching contacts and adding discovered public keys into local trust review.
- Updated the Contacts screen search field so it can discover accounts and add keys for safety-number review.

## Security boundary

Discovery only returns public account metadata and active public device bundle material:

- account ID
- display name and optional username
- device ID and device display name
- identity key
- signed prekey and signature
- available one-time prekey material
- bundle publish timestamp

The server still cannot read message contents. Discovery is authenticated so public bundle lookup is not anonymous scraping.

## Known limitations

- This is not yet private set intersection or hashed-contact discovery.
- Query matching is direct server-side search.
- Abuse throttling relies on the existing API rate-limit layer and should be strengthened before public launch.
- Discovered contacts are added locally as `new` trust records; the user still needs to verify safety numbers before treating them as trusted.

## Next phase

Phase 19 should start encrypted message draft plumbing on the mobile side:

- model plaintext drafts separately from encrypted outbound envelopes
- prepare per-recipient fanout from discovered/trusted device bundles
- keep mock UI behavior intact while building the encryption boundary
- add clear send-state UX for queued, delivered, acknowledged, and failed encrypted envelopes
