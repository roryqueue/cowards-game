# Phase 14: Competitive Ownership and Sessions - Research

**Date:** 2026-05-19
**Status:** Complete

## Findings

- Existing persistence already has `users`, `strategies`, and `strategy_revisions`, but no credential or session storage. Additive auth tables are safer than rewriting existing user seed behavior.
- Workshop flows intentionally use `user:local` and `player:workshop-local`; competitive ownership should be added beside that path, not by breaking anonymous Workshop testing.
- Node's built-in `crypto.scrypt` and `randomBytes` are enough for local alpha password hashing and session token generation without introducing a broad auth framework.
- Next.js route handlers can set HTTP-only cookies for server-side sessions while keeping private authorization checks in server code.

## Implementation Direction

1. Add account/session persistence helpers in `packages/persistence`.
2. Add web session utilities and sign up/sign in/sign out API/UI.
3. Add account-owned revision save/list/source helpers.
4. Gate competitive APIs by session User.
5. Preserve anonymous Workshop flows.

## Risks

- Accidentally treating `player:workshop-local` as a competitive owner.
- Exposing Strategy source through public result DTOs.
- Making auth too ambitious by adding recovery/OAuth/admin concepts.

