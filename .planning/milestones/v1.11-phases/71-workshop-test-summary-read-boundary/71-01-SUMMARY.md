# Phase 71 Summary: Workshop Test Summary Read Boundary

**Completed:** 2026-05-23  
**Status:** Complete

## Delivered

- Added spec-owned Workshop test-summary schemas and service DTO types.
- Added `CowardsService.getWorkshopTestSummary()`.
- Added web Workshop read service adapter/boundary helpers.
- Routed `GET /api/workshop/tests/{matchSetId}` through `@cowards/service` while returning the legacy raw summary payload.
- Added route and service tests for success, missing summary, and private-field rejection.

## Validation

- `pnpm exec vitest run packages/spec/src/spec.test.ts packages/service/src/service.test.ts apps/web/app/api/workshop/tests/[matchSetId]/route.test.ts --testTimeout=90000 --pool=forks --maxWorkers=1` - passed as part of focused route/service test run.
- `pnpm --filter @cowards/web typecheck` - passed.
- `pnpm --filter @cowards/web test -- route.test.ts workshop-client.test.tsx evidence-state.test.ts` - passed.

## Notes

The underlying persistence helper still refreshes MatchSet status as it did before. Phase 71 preserves existing route behavior and moves only the web read boundary, not Match orchestration or worker behavior.

