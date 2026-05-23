# Phase 85 Research: Auth, Session, and Account Read Ownership

## Findings

- Current auth behavior is in `packages/persistence/src/auth.ts` and `apps/web/app/competitive/server.ts`.
- Cookie contract is defined in `apps/web/app/competitive/http.ts` and `apps/web/lib/competitive-session.ts`.
- Account Strategy Revision list is source-free in `packages/service/src/index.ts`.
- Sensitive values include session tokens, token hashes, cookies, password hashes, and session ids.

## Implementation Notes

- Add Go auth handlers for sign-up, sign-in, sign-out/revoke, and session read.
- Proxy existing Next auth routes to Go only when selected.
- Preserve token hashing, expiry, revocation, `last_seen_at`, and cookie headers.
- Add account revision metadata list to Go and selected-owner adapter.

