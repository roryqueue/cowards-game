---
phase: 51-service-contract-generation-and-route-migration
plan: 02
subsystem: api
tags: [service-boundary, nextjs, public-dto, replay-metadata, privacy]
requires:
  - phase: 51-service-contract-generation-and-route-migration
    provides: "v1.8 service route metadata and canonical public DTO schemas from Plan 51-01"
provides:
  - "Service-backed public Strategy page read through @cowards/service"
  - "Canonical schema parsing for public replay metadata DTOs"
  - "Public replay metadata API route backed by the service boundary"
  - "Web facade migration for selected public read slice without moving writes or runtime execution"
affects: [phase-51, phase-52, service-contract, boundary-monitors]
tech-stack:
  added: []
  patterns:
    - "Web public reads delegate to @cowards/service and adapt service DTO payloads back to existing page shapes."
    - "Public service DTOs are leak-scanned before canonical Zod schema parsing."
key-files:
  created:
    - apps/web/app/api/replays/[matchId]/metadata/route.ts
  modified:
    - packages/service/src/index.ts
    - packages/service/src/service.test.ts
    - packages/spec/src/service.ts
    - apps/web/app/competitive/server.ts
    - apps/web/app/matches/server.ts
    - apps/web/app/matches/server.test.ts
key-decisions:
  - "Kept the Phase 51 migration slice read-only: public Strategy page and replay metadata only, with MatchSet summary already service-backed."
  - "Used the canonical Plan 51-01 Strategy page envelope shape, `payload.strategy`, and adapted it in the web facade to preserve existing Strategy page rendering."
patterns-established:
  - "Service methods construct public DTOs, call `assertPublicServiceDtoLeakSafe`, then parse through canonical schemas before returning."
  - "Next API metadata routes return service DTO JSON directly and preserve stable public 404/error shapes."
requirements-completed: [GEN-04, GEN-05, GEN-06]
duration: 6min
completed: 2026-05-22
---

# Phase 51 Plan 02: Service Route Migration Summary

**Public Strategy page and replay metadata reads now flow through `@cowards/service` with canonical v1.8 DTO validation and privacy checks**

## Performance

- **Duration:** 6 min
- **Started:** 2026-05-22T19:47:49Z
- **Completed:** 2026-05-22T19:53:53Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Added `CowardsService.getPublicStrategyPage(strategyId)` and optional injection for `buildPublicStrategyCardDto`, returning a public page envelope or `null`.
- Updated public replay metadata service reads to parse through `PublicReplayMetadataServiceDtoSchema` after privacy leak scanning.
- Migrated `competitiveServer.getPublicStrategyCard` to call the service-backed public Strategy page read while preserving the existing page/card shape.
- Added `matchReplayServer.getPublicReplayMetadata` and a new public API route at `apps/web/app/api/replays/[matchId]/metadata/route.ts`.
- Added TDD coverage for Strategy page service envelopes, replay metadata DTO shape, encoded Match ids, null behavior, and private-field redaction.

## Task Commits

1. **Task 1 RED:** `7e00a9e` test public service read behavior.
2. **Task 1 GREEN:** `0abed68` add public Strategy page service read and DTO validation.
3. **Task 2 RED:** `f3c231d` test replay metadata web facade behavior.
4. **Task 2 GREEN:** `2b9b97c` wire public web reads through service.

## Files Created/Modified

- `packages/service/src/index.ts` - Added `getPublicStrategyPage`, replay metadata schema parsing, and public DTO leak checks before return.
- `packages/service/src/service.test.ts` - Added service tests for Strategy page envelopes, null results, private-field rejection, and replay metadata.
- `packages/spec/src/service.ts` - Exported the canonical `PublicStrategyPageServiceDto` type needed by the service implementation.
- `apps/web/app/competitive/server.ts` - Migrated public Strategy card reads to `cowardsService.getPublicStrategyPage`.
- `apps/web/app/matches/server.ts` - Added service-backed `getPublicReplayMetadata`.
- `apps/web/app/matches/server.test.ts` - Added replay metadata facade tests.
- `apps/web/app/api/replays/[matchId]/metadata/route.ts` - New public metadata route returning service DTO JSON or `{ error: "Replay metadata not found." }`.

## Decisions Made

- Followed the canonical schema produced by Plan 51-01 for Strategy page payloads: `payload.strategy`. The web facade unwraps this back to the existing `StrategyCardDto` shape so page rendering remains unchanged.
- Kept full Chronicle/replay reconstruction in `apps/web/app/matches/server.ts`; the new service path only returns public replay metadata.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added missing canonical Strategy page service DTO type**
- **Found during:** Task 1 typecheck
- **Issue:** Plan 51-01 provided `PublicStrategyPageServiceDtoSchema` but not the matching exported TypeScript interface required by Plan 51-02.
- **Fix:** Added `PublicStrategyPageServiceDto` to `packages/spec/src/service.ts`.
- **Files modified:** `packages/spec/src/service.ts`
- **Verification:** `pnpm --filter @cowards/service typecheck` passed.
- **Committed in:** `0abed68`

**2. [Rule 3 - Blocking] Resolved plan/schema payload mismatch**
- **Found during:** Task 1 implementation
- **Issue:** Plan text described a bare Strategy card payload, while the canonical Plan 51-01 schema requires `payload.strategy`.
- **Fix:** Built and parsed the canonical `payload.strategy` envelope, then adapted it in `competitiveServer.getPublicStrategyCard`.
- **Files modified:** `packages/service/src/index.ts`, `apps/web/app/competitive/server.ts`
- **Verification:** `pnpm --filter @cowards/service test`, `pnpm --filter @cowards/web test`, and typechecks passed.
- **Committed in:** `0abed68`, `2b9b97c`

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both adjustments were needed to honor the canonical schema and complete the planned service-boundary migration. No auth, writes, orchestration, runtime execution, or Strategy source retrieval was migrated.

## Issues Encountered

- The local `gsd-sdk` on PATH did not expose `query` subcommands, so planning state updates were applied directly to `.planning` files.

## Verification

- `pnpm --filter @cowards/service test` - passed, 6 tests.
- `pnpm --filter @cowards/service typecheck` - passed.
- `pnpm --filter @cowards/web test` - passed, 94 tests.
- `pnpm --filter @cowards/web typecheck` - passed.
- `pnpm --filter @cowards/spec contract:check` - passed.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 51-03 can add strict named-slice import guards for the migrated route/page files and report-only broad app scanning. The new replay metadata route already avoids direct persistence, runtime, worker, and Strategy execution imports.

## Self-Check: PASSED

- Created and modified files verified present.
- Task commits verified present: `7e00a9e`, `0abed68`, `f3c231d`, `2b9b97c`.

---
*Phase: 51-service-contract-generation-and-route-migration*
*Completed: 2026-05-22*
