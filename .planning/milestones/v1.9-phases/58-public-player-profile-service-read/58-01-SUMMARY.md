---
phase: 58
plan: 01
slug: public-player-profile-service-read
status: completed
created: 2026-05-22
---

# Phase 58-01 Summary — Public Player Profile Service Read

## Completed

- Added `CowardsService.getPublicPlayerPage(handle)`.
- Added `PublicPlayerPageServiceDto`.
- Rewired the public player profile page through `apps/web/lib/public-service-boundary.ts`.
- Removed the direct public profile persistence call from `competitive/server`.
- Added the player page to strict import enforcement.
- Reduced broad web report-only offenses from 41 to 39.

## Evidence

- `pnpm --filter @cowards/service test`
- `pnpm exec vitest run scripts/check-service-boundary-imports.test.ts scripts/check-boundary-monitors.test.ts`
- `pnpm boundary:imports`
- `pnpm boundary:monitors`
- `pnpm --filter @cowards/web test -- --runInBand`
- `pnpm typecheck`

## Changed Files

- `packages/spec/src/service.ts`
- `packages/service/src/index.ts`
- `packages/service/src/service.test.ts`
- `apps/web/lib/public-service-boundary.ts`
- `apps/web/app/players/[handle]/page.tsx`
- `apps/web/app/competitive/server.ts`
- `scripts/check-service-boundary-imports.ts`
- `scripts/check-service-boundary-imports.test.ts`
- `scripts/check-boundary-monitors.ts`
