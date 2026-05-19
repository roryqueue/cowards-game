# Phase 14 Summary: Competitive Ownership and Sessions

## Completed
- Added username/password account creation, sign-in, sign-out, hashed session tokens, and 30-day session persistence.
- Added stable account-backed Strategy Revision save/list/source APIs.
- Added ownership checks for account Strategy Revision source retrieval and competitive entry.
- Added account UI and Workshop "Save to account" path while preserving anonymous local Workshop drafting.

## Key Files
- `packages/persistence/src/auth.ts`
- `packages/persistence/src/account-revisions.ts`
- `packages/persistence/migrations/0003_competitive_alpha.sql`
- `apps/web/app/auth/*`
- `apps/web/app/account/page.tsx`
- `apps/web/app/api/auth/*`
- `apps/web/app/api/account/revisions/*`
- `apps/web/app/workshop/workshop-client.tsx`

## Notes
- No email, password reset, or enterprise auth was added.
- Account source access remains owner-only through session-backed authorization.
