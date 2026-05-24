---
phase: 106-typescript-worker-and-persistence-quarantine
plan: 1
subsystem: backend-retirement
tags: [typescript, worker, persistence, go-backend, boundary-monitors, tdd]
requires:
  - phase: 105-web-api-go-only-cutover-and-fallback-removal
    provides: selected Go-only routes and no TypeScript fallback baseline
provides:
  - TypeScript worker startup guard requiring rollback, test, or parity purpose
  - Explicit persistence quarantine lifecycle subpath
  - Non-normal service and competition persistence role labels
  - v1.16 TypeScript worker rollback artifact and refreshed backend inventory
affects: [phase-107, phase-108, phase-109, no-typescript-backend, rollback]
tech-stack:
  added: []
  patterns:
    - TypeScript lifecycle helpers are imported through `@cowards/persistence/quarantine-lifecycle`
    - Normal `@cowards/persistence` root omits job, completion, scoring, and MatchSet creation helpers
key-files:
  created:
    - packages/persistence/src/quarantine-lifecycle.ts
    - .planning/artifacts/v1.16-typescript-worker-quarantine.json
    - .planning/artifacts/v1.16-typescript-worker-quarantine.md
    - .planning/phases/106-typescript-worker-and-persistence-quarantine/106-VALIDATION.md
  modified:
    - apps/worker/src/index.ts
    - apps/worker/src/runner.ts
    - packages/persistence/src/index.ts
    - packages/persistence/src/competition.ts
    - packages/service/src/index.ts
    - scripts/check-boundary-monitors.ts
    - scripts/generate-typescript-backend-inventory.ts
key-decisions:
  - "COWARDS_MATCH_JOB_LIFECYCLE_OWNER=typescript no longer grants normal job ownership; the worker requires rollback, test, or parity purpose."
  - "Retained TypeScript lifecycle persistence is reachable only through an explicit quarantine subpath."
  - "@cowards/service and TypeScript competition persistence are labeled parity/fixture/rollback/deferred support, not selected normal backend."
patterns-established:
  - "Worker executable guards run before database pool creation and pass resolved ownership into loop iterations."
  - "Boundary monitors validate worker quarantine source tokens, artifact policy, export boundary, and no mixed Go plus TypeScript owners."
requirements-completed: [QUAR-01, QUAR-02, QUAR-03, QUAR-04, QUAR-05, QUAR-06, QUAR-07]
duration: 11min
completed: 2026-05-24
---

# Phase 106 Plan 1: TypeScript Worker and Persistence Quarantine Summary

**TypeScript worker and lifecycle persistence are rollback/test/parity-only, with normal job ownership, scoring refresh, MatchSet creation, and selected public evidence kept Go-owned.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-05-24T20:41:34Z
- **Completed:** 2026-05-24T20:51:54Z
- **Tasks:** 3
- **Files modified:** 19

## Accomplishments

- Blocked normal TypeScript worker startup and normal TypeScript lifecycle ownership, including `COWARDS_MATCH_JOB_LIFECYCLE_OWNER=typescript` without an explicit non-normal purpose.
- Removed lifecycle helpers from the normal persistence root and added `@cowards/persistence/quarantine-lifecycle`.
- Labeled `@cowards/service` and TypeScript competition persistence as non-normal support.
- Added Phase 106 monitor coverage, refreshed TypeScript backend inventory artifacts, and created single-owner rollback artifacts.

## Task Commits

1. **Task 1 RED:** `7cf58d9` test worker quarantine guard expectations.
2. **Task 1 GREEN:** `64ede71` worker startup ownership quarantine.
3. **Task 2 RED:** `ba6d550` export boundary and service role expectations.
4. **Task 2 GREEN:** `927de15` persistence lifecycle quarantine subpath and labels.
5. **Task 3 RED:** `f06051f` monitor and inventory quarantine expectations.
6. **Task 3 GREEN:** `6aec9e3` monitor lane, rollback artifacts, inventory refresh, and validation notes.

## Verification

- `pnpm exec vitest run apps/worker/src/runner.test.ts` passed.
- `pnpm exec vitest run packages/persistence/src/competition.test.ts packages/service/src/service.test.ts apps/web/lib/account-service-adapter.test.ts apps/web/lib/public-service-adapter.test.ts apps/web/app/matches/server.test.ts` passed.
- `pnpm exec vitest run scripts/check-boundary-monitors.test.ts scripts/generate-typescript-backend-inventory.test.ts` passed.
- `pnpm --filter @cowards/worker typecheck`, `pnpm --filter @cowards/persistence typecheck`, and `pnpm --filter @cowards/service typecheck` passed.
- `pnpm boundary:imports`, `pnpm typescript-backend:inventory`, `pnpm typescript-backend:inventory:check`, and `pnpm boundary:monitors` passed.
- `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...` passed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Used async-IIFE for the export-boundary eval command**
- **Found during:** Task 2 verification
- **Issue:** The exact top-level `await` `tsx -e` form compiled eval as CJS in this environment.
- **Fix:** Ran the same import/export assertion under `pnpm --filter @cowards/persistence exec tsx -e` with an async-IIFE form.
- **Files modified:** `106-VALIDATION.md`
- **Verification:** Equivalent root-export quarantine assertion passed.
- **Committed in:** `6aec9e3`

**Total deviations:** 1 auto-fixed (Rule 3)
**Impact on plan:** No behavioral scope change. The export boundary itself is also covered by Vitest and `boundary:monitors`.

## Residual Risks

- Full live web/Go/runtime-service page smoke was not required by Phase 106 and remains a Phase 108/109 strict topology concern. `pnpm boundary:monitors` passed with optional live topology diagnostics.

## Known Stubs

None found. Stub-pattern scan matched initialized arrays/objects in tests and scanner internals only.

## Threat Flags

None beyond planned Phase 106 boundaries. The new rollback artifact and monitor lane cover operator env, TypeScript worker to PostgreSQL lifecycle tables, selected web/API to Go, public DTO/replay output, and rollback topology ownership.

## User Setup Required

None.

## Next Phase Readiness

Phase 107 can relabel remaining deferred Workshop, ladder, governance, owner-debug, test-support, and parity surfaces using the refreshed 184-surface inventory and Phase 106 quarantine artifact.

## Self-Check: PASSED

- Found summary, validation, quarantine lifecycle module, and rollback artifacts.
- Verified task commits: `7cf58d9`, `64ede71`, `ba6d550`, `927de15`, `f06051f`, `6aec9e3`.

---
*Phase: 106-typescript-worker-and-persistence-quarantine*
*Completed: 2026-05-24*
