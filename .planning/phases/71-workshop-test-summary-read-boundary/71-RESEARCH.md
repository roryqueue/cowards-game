# Phase 71 Research: Workshop Test Summary Read Boundary

## Findings

- `apps/web/app/api/workshop/tests/[matchSetId]/route.ts` currently calls `workshopServer.getTestSummary()` and returns the raw summary shape.
- `apps/web/app/workshop/server.ts` delegates the read to `getWorkshopTestSummary(pool, matchSetId)`.
- `packages/persistence/src/workshop.ts` defines `WorkshopTestSummary` and returns source-free fields: `matchSetId`, `status`, `matchCount`, optional `matchIds`, `matches`, and `scoring`.
- `packages/spec/src/schemas.ts` has service DTO patterns but no Workshop test-summary service schema yet.
- `packages/service/src/index.ts` already validates service DTOs through spec schemas and privacy guards before returning them.

## Implementation Notes

- Add a spec-owned Workshop test-summary DTO envelope with a raw-compatible `summary` payload.
- Add `CowardsService.getWorkshopTestSummary(matchSetId)`.
- Add a web adapter/boundary helper that creates the local service with a DB pool.
- Route `GET /api/workshop/tests/{matchSetId}` through the helper and return `dto.summary` to preserve API behavior.
- Keep POST launch, source validation, source save/retrieval, runtime, and worker flows untouched.

