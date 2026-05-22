---
phase: 59
plan: 01
slug: owner-account-read-service-slice
status: completed
created: 2026-05-22
---

# Phase 59-01 Summary — Owner Account Read Service Slice

## Completed

- Added service-owned auth session and Strategy Revision list reads.
- Added owner-safe account read DTO fields for username, revision metadata, runtime semantics, counted eligibility, and compatibility data.
- Added an account read boundary for web session and revision reads.
- Rewired account page, auth session route, exhibition entry setup, and account revisions `GET`.
- Kept revision `POST`, source retrieval, fork routes, auth mutations, exhibition creation, and Workshop flows out of scope.
- Reduced broad web report-only offenses from 39 to 35.

## Evidence

- `pnpm --filter @cowards/service test`
- `pnpm --filter @cowards/spec test`
- `pnpm exec vitest run scripts/check-service-boundary-imports.test.ts scripts/check-boundary-monitors.test.ts`
- `pnpm boundary:imports`
- `pnpm boundary:monitors`
- `pnpm --filter @cowards/web test -- --runInBand`
- `pnpm typecheck`

## Changed Files

- `packages/spec/src/schemas.ts`
- `packages/spec/src/service.ts`
- `packages/service/src/index.ts`
- `packages/service/src/service.test.ts`
- `apps/web/lib/account-service-adapter.ts`
- `apps/web/lib/account-service-boundary.ts`
- `apps/web/app/account/page.tsx`
- `apps/web/app/api/auth/session/route.ts`
- `apps/web/app/api/account/revisions/route.ts`
- `apps/web/app/exhibitions/new/page.tsx`
- `apps/web/app/exhibitions/new/exhibition-client.tsx`
- `scripts/check-service-boundary-imports.ts`
- `scripts/check-service-boundary-imports.test.ts`
- `scripts/check-boundary-monitors.ts`
- `scripts/check-boundary-monitors.test.ts`
