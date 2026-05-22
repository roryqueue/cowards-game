---
phase: 60
plan: 01
slug: public-ladder-service-read-follow-up
status: completed
created: 2026-05-22
---

# Phase 60-01 Summary — Public Ladder Service Read Follow-Up

## Completed

- Added canonical public ladder season service schemas and `getPublicLadderSeason` route metadata.
- Regenerated the public service OpenAPI artifact with `/public/ladders/{seasonId}`.
- Added `CowardsService.getPublicLadderSeason`, schema validation, and public leak guarding.
- Rewired the public ladder page through `apps/web/lib/public-service-boundary.ts` and account read current-user affordance.
- Removed `competitiveServer.getTrialLadderSeason` while leaving ladder mutations and admin/governance flows in place.
- Added the ladder page to strict import enforcement and reduced broad web report-only offenses from 35 to 34.
- Left Go route manifest and Go parity fixtures unchanged, preserving the no-Go-expansion scope.

## Evidence

- `pnpm --filter @cowards/spec test`
- `pnpm --filter @cowards/service test`
- `pnpm exec vitest run scripts/check-service-boundary-imports.test.ts scripts/check-boundary-monitors.test.ts`
- `pnpm boundary:imports`
- `pnpm boundary:monitors`
- `pnpm --filter @cowards/web test -- --runInBand`
- `pnpm typecheck`

## Changed Files

- `packages/spec/src/schemas.ts`
- `packages/spec/src/service.ts`
- `packages/spec/src/service-fixtures.ts`
- `packages/spec/src/spec.test.ts`
- `packages/spec/src/service-contract.test.ts`
- `packages/spec/artifacts/service-api-v1.8.openapi.json`
- `packages/service/src/index.ts`
- `packages/service/src/service.test.ts`
- `apps/web/lib/public-service-boundary.ts`
- `apps/web/app/ladder/[seasonId]/page.tsx`
- `apps/web/app/competitive/server.ts`
- `scripts/check-service-boundary-imports.ts`
- `scripts/check-service-boundary-imports.test.ts`
- `scripts/check-boundary-monitors.ts`
