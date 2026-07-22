---
phase: 256-counted-safety-and-canonical-authority
plan: "16"
subsystem: persistence-integrity
tags: [postgresql, matchsets, evidence-authority, fail-closed, structural-inventory]
requires:
  - phase: 256-05
    provides: canonical integrity identity and per-entrant persistence writer
  - phase: 256-15
    provides: verified runtime evidence import boundary
  - phase: 256-19
    provides: retired direct TypeScript worker boundary
provides:
  - exact per-entrant evidence resolution at every active production MatchSet caller
  - explicit fixture-only development authority with zero-write default failure
  - exhaustive AST and SQL creation-path inventory integrated into boundary monitors
  - honest advanced-demo execution-unavailable preflight with zero persisted rows
affects: [phase-259-conformance, competition, workshop, ladder, runtime-service, boundary-monitors]
tech-stack:
  added: []
  patterns: [pre-write aggregate evidence resolution, production-fixture trust split, AST-backed caller inventory]
key-files:
  created:
    - scripts/check-v1-37-integrity-boundaries.ts
    - scripts/check-v1-37-integrity-boundaries.test.ts
  modified:
    - packages/persistence/src/matchset-service.ts
    - packages/persistence/src/competition.ts
    - packages/persistence/src/workshop.ts
    - packages/persistence/src/ladder.ts
    - packages/persistence/src/dev-smoke.ts
    - scripts/run-v1-5-advanced-demo.ts
    - scripts/check-boundary-monitors.ts
key-decisions:
  - "Production MatchSet creation defaults to an empty authority and fails before database access; callers must supply exact verified per-entrant evidence."
  - "Fixture evidence is explicit, development-only, exhibition-only, and structurally incapable of authorizing counted creation."
  - "The retired advanced demo now creates zero rows and reports execution unavailable after an eight-entrant fixture-authority preflight."
patterns-established:
  - "Resolve-before-write: gather and semantically validate the complete entrant evidence set before seed, transaction, or scheduling mutations."
  - "Inventory-by-ownership: every canonical creation call, protected-table SQL insert, and legacy worker consumer has an exact reviewed owner path."
requirements-completed: [SAFE-01, SAFE-02, AUTH-02, AUTH-03, AUTH-05]
coverage:
  - id: D1
    description: "Competition, Workshop, and ladder callers preserve exact heterogeneous per-entrant evidence and fail before writes when any entrant is unproved"
    requirement: AUTH-02
    verification:
      - kind: unit
        ref: "packages/persistence/src/competition.test.ts, workshop.test.ts, matchset-service.test.ts, ladder.test.ts (88 passed across focused caller suite)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Development smoke requires explicit fixture authority and the retired advanced demo creates zero rows while reporting execution unavailable"
    requirement: SAFE-02
    verification:
      - kind: unit
        ref: "packages/persistence/src/dev-smoke.test.ts#fails before touching PostgreSQL without explicit fixture authority"
        status: pass
      - kind: other
        ref: "COWARDS_V15_DEMO_FIXTURE_AUTHORITY=1 pnpm exec tsx scripts/run-v1-5-advanced-demo.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "AST-backed inventory accounts for all active creation calls, protected-table SQL inserts, and legacy worker consumers and rejects synthetic bypasses"
    requirement: AUTH-05
    verification:
      - kind: unit
        ref: "scripts/check-v1-37-integrity-boundaries.test.ts (13 passed)"
        status: pass
      - kind: other
        ref: "pnpm exec tsx scripts/check-v1-37-integrity-boundaries.ts (270 files, 5 creation calls, 9 SQL writers, 4 registered legacy consumers)"
        status: pass
    human_judgment: false
duration: 16min
completed: 2026-07-13
status: complete
---

# Phase 256 Plan 16: Complete TypeScript Caller Integrity Summary

**Every active TypeScript MatchSet creation surface now resolves an exact entrant evidence set before writes, while a repository-wide structural monitor blocks unowned callers, SQL writers, and worker bypasses.**

## Performance

- **Duration:** 16 min
- **Started:** 2026-07-13T05:40:00Z
- **Completed:** 2026-07-13T05:56:00Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments

- Migrated competition, Workshop, and trial-ladder scheduling to resolve complete, exact evidence for every entrant before any MatchSet mutation and to retain each Match's ordered execution pair.
- Added a strict production/fixture resolver boundary: production has no implicit authority, fixture evidence cannot count, and dev smoke touches no database without explicit fixture configuration.
- Replaced the retired v1.5 direct-worker demo with an honest, non-persisting eight-entrant fixture-authority preflight that reports `V15_DEMO_EXECUTION_UNAVAILABLE`.
- Added an AST-backed repository inventory covering canonical creation APIs, nine protected-table SQL writers, and registered legacy worker consumers, plus independent synthetic bypass tests and the aggregate boundary monitor hook.

## Task Commits

1. **Task 1 RED: production caller evidence tests** - `ff9f46d` (test)
2. **Task 1 GREEN: production competition/Workshop/ladder migration** - `c586d6a` (feat)
3. **Task 2 RED: development and inventory bypass tests** - `ea0e96b` (test)
4. **Task 2 GREEN: fixture-only dev/demo and structural inventory** - `062926d` (feat)

## Files Created/Modified

- `packages/persistence/src/matchset-service.ts` - Production-empty and fixture-only evidence resolvers plus validated aggregate resolution.
- `packages/persistence/src/competition.ts` - Exact entrant evidence and ordered-pair wiring for exhibitions.
- `packages/persistence/src/workshop.ts` - Independent Workshop/revision evidence resolution before seed writes.
- `packages/persistence/src/ladder.ts` - Aggregate counted-pod evidence resolution before scheduling mutations.
- `packages/persistence/src/dev-smoke.ts` - Explicit fixture authority requirement before migration or seed access.
- `scripts/run-v1-5-advanced-demo.ts` - Non-persisting, execution-unavailable fixture preflight.
- `scripts/check-v1-37-integrity-boundaries.ts` - AST/SQL creation ownership inventory.
- `scripts/check-boundary-monitors.ts` - Aggregate monitor integration.

## Decisions Made

- Kept production authority empty in Phase 256. Documentation, lane names, or fixture records cannot authorize rows or counted status.
- Used stable strategy revision IDs as execution entrant keys at two-entrant surfaces and retained explicit stable entry/revision mapping for competition and ladder entrants.
- Made the obsolete advanced demo stop at proof preflight rather than preserve a command that could imply retired worker execution or counted evidence.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Migrated the trial-ladder direct canonical writer**
- **Found during:** Task 1 caller inventory
- **Issue:** `ladder.ts` directly called `insertMatchSetWithMatrixOnClient` and would otherwise remain an active counted caller without exact evidence.
- **Fix:** Resolved every prepared pod before the scheduling transaction, passed exact identity and entrant keys, and rejected fixture authority for counted scheduling.
- **Files modified:** `packages/persistence/src/ladder.ts`, `packages/persistence/src/ladder.test.ts`
- **Verification:** Focused five-file caller suite passed 88 tests with three configured-database tests skipped.
- **Committed in:** `c586d6a`

**2. [Rule 2 - Missing Critical] Integrated the new inventory into the aggregate boundary monitor**
- **Found during:** Task 2 monitor wiring
- **Issue:** A standalone inventory would not protect the established repository boundary-monitor gate.
- **Fix:** Added a fail-closed v1.37 creation-inventory check to `runBoundaryMonitorChecks`.
- **Files modified:** `scripts/check-boundary-monitors.ts`
- **Verification:** Standalone current-repository inventory and 13 synthetic bypass tests passed.
- **Committed in:** `062926d`

---

**Total deviations:** 2 auto-fixed missing-critical caller/monitor gaps.
**Impact on plan:** Both changes close reachable bypasses required by the plan; no gameplay or historical evidence semantics changed.

## Issues Encountered

- `scripts/dev-local-postgres.sh --setup-only` found a host PostgreSQL on port 5432 but attempted host-user authentication and failed before the configured integration filter could run. The full persistence unit suite passed 166 tests with 23 configured-database tests skipped.
- Package typecheck remains blocked only by independent Plan 18 errors in `match-service.test.ts:274` and `runtime-evidence-authority-publisher.ts:1608-1750`. No reported type error points to a Plan 16 file; focused ESLint, root TypeScript compilation, and all Plan 16 tests pass.

## User Setup Required

None. The v1.5 authority preflight is intentionally opt-in through `COWARDS_V15_DEMO_FIXTURE_AUTHORITY=1` and never persists or executes Matches.

## Verification

- Full persistence test suite: 166 passed, 23 configured-database tests skipped.
- Focused caller suite: 88 passed, 3 configured-database tests skipped.
- Integrity inventory suite: 13 passed.
- Live inventory: 270 TypeScript files, 5 canonical creation calls, 9 protected SQL writers, and 4 registered legacy worker consumers; zero findings.
- Development demo preflight: eight exact fixture entrants, zero rows, stable execution-unavailable result.
- Focused ESLint, Prettier, `git diff --check`, and root TypeScript compilation passed.

## Next Phase Readiness

- Phase 259 can introduce separately reviewed executable conformance authority without changing caller ownership or allowing fixture evidence to count.
- Service/runtime work can rely on one explicit MatchSet identity and ordered per-Match evidence pair at every current creation surface.
- No Match state, Action legality, event order, outcome, Strategy observation, or immutable v1.4 Chronicle/result was changed.

## Self-Check: PASSED

- All four RED/GREEN task commits exist and the planned summary/inventory artifacts are present.
- Protected dirty `.planning/config.json` and consolidated specification remain untouched and unstaged.
- All Plan 16-scoped automated gates pass; external PostgreSQL authentication and independent Plan 18 type errors are recorded explicitly.

---
*Phase: 256-counted-safety-and-canonical-authority*
*Completed: 2026-07-13*
