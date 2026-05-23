# Phase 72 Summary: Workshop Analytics Compare Read Boundary

**Completed:** 2026-05-23  
**Status:** Complete

## Delivered

- Added spec-owned Workshop analytics comparison schemas and service DTO types.
- Added `CowardsService.compareWorkshopAnalyticsRuns()`.
- Routed `GET /api/workshop/analytics/profiles/{profileId}/compare` through the Workshop read service boundary.
- Preserved route-level local/Playwright availability gating, `no-store`, null-to-404 behavior, storage-unavailable 503 behavior, and the legacy raw comparison response.
- Added route and service tests for success, missing, gated, and storage-unavailable behavior.

## Validation

- `pnpm exec vitest run packages/spec/src/spec.test.ts packages/service/src/service.test.ts apps/web/app/api/workshop/analytics/profiles/[profileId]/compare/route.test.ts --testTimeout=90000 --pool=forks --maxWorkers=1` - passed as part of focused route/service test run.
- `pnpm --filter @cowards/web typecheck` - passed.
- `pnpm --filter @cowards/web test -- route.test.ts workshop-client.test.tsx evidence-state.test.ts` - passed.

## Notes

Analytics rerun, profile save, export, gauntlet execution, test launch, worker execution, and persistence writes remain outside the migrated read boundary.

