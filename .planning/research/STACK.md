# Stack Research: v1.2 Competitive Alpha

**Date:** 2026-05-19

## Direction

Keep the existing stack:

- TypeScript monorepo with shared packages.
- Next.js web app.
- PostgreSQL-backed persistence and migrations.
- Worker-based Match execution.
- `packages/spec` schemas as runtime boundary contracts.
- `packages/engine` pure deterministic rules.
- `packages/replay` Chronicle validation, reconstruction, projection, and hashing.
- `packages/runtime-js` Strategy execution adapters and failure taxonomy.
- Vitest and Playwright verification.

## Additions

- Minimal User/session persistence for username/password authentication.
- Password hashing and session storage through conventional server-side libraries selected during Phase 14 planning.
- Competition preset, entry, snapshot, scoring, publication, and result DTO schemas.
- Server-side rate limit storage suitable for local alpha enforcement.

## Non-Additions

- No OAuth/passkey/email integration in v1.2.
- No external ranking service.
- No new runtime language or production sandbox replacement.
- No game rules or scoring rules in React components.

## Version Notes

Library/version selection should happen during Phase 14 planning against the current package set. Prefer small, conventional dependencies over broad auth frameworks unless they clearly reduce code and risk for username/password sessions.
