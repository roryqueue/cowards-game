---
phase: 03-chronicle-and-replay-core
plan: 03-04
subsystem: replay
tags: [typescript, chronicle, replay, privacy, projection, testing]

requires:
  - phase: 03-01
    provides: Versioned Chronicle projection contracts and privacy section types
  - phase: 03-02
    provides: Canonical Chronicles with public events and owner-private sections
  - phase: 03-03
    provides: Validated Chronicle replay utilities and integrity-aware artifacts
provides:
  - Privacy-safe public Chronicle projection utilities
  - Per-player owner Chronicle projection utilities
  - Marker-based projection privacy regression tests
affects: [replay-viewer, match-orchestration, persistence, public-sharing]

tech-stack:
  added: []
  patterns:
    - Pure projection from canonical Chronicle artifacts without mutating source data
    - Runtime violation payload redaction for public replay output
    - Owner-private projection scoped to one requested player ID

key-files:
  created:
    - packages/replay/src/project.ts
    - packages/replay/src/project.test.ts
    - .planning/phases/03-chronicle-and-replay-core/03-04-SUMMARY.md
  modified:
    - packages/replay/src/index.ts

key-decisions:
  - "Public projection preserves board snapshots, outcomes, public event identity, and sanitized marker payloads while omitting private sections and privateRef links."
  - "Owner projection composes public projection with only private.byPlayerId[playerId], preventing opponent debug data exposure."
  - "Runtime violation public payloads are reduced to type/category and affected player/Soldier identifiers; raw violation details remain owner-only."

patterns-established:
  - "projectChronicle dispatches by ChronicleViewer access, with projectPublicChronicle and projectOwnerChronicle as explicit convenience APIs."
  - "Projection tests stringify outputs and assert known private markers are absent or player-scoped."

requirements-completed: [REPLAY-06, REPLAY-07, TEST-03]

duration: 3min 18s
completed: 2026-05-16
---

# Phase 3 Plan 03-04: Public and Owner Replay Projections Summary

**Privacy-safe Chronicle projections with public replay redaction and per-player owner debug views**

## Performance

- **Duration:** 3min 18s
- **Started:** 2026-05-16T15:11:01Z
- **Completed:** 2026-05-16T15:14:19Z
- **Tasks:** 2
- **Files modified:** 3 source/test files plus this summary

## Accomplishments

- Added `projectChronicle`, `projectPublicChronicle`, and `projectOwnerChronicle` to derive replay projections from one canonical Chronicle artifact.
- Public projections now strip `private`, `privateRef`, exact Awareness Grids, objective payloads, StrategyMemory, SoldierMemory, strategy source, and raw runtime details while retaining board snapshots, outcomes, and public event markers.
- Owner projections include only the requested player's private section and never include the opponent private section.
- Added marker-based privacy tests covering public redaction, runtime violation sanitization, and player-scoped owner debug views.

## Task Commits

Each task was committed atomically:

1. **Task 03-04-01: Implement public and owner projection utilities** - `efa3f4a` (`feat`)
2. **Task 03-04-02: Add projection privacy tests** - `d37a475` (`test`)

## Files Created/Modified

- `packages/replay/src/project.ts` - Implements public, owner, and viewer-dispatched Chronicle projection utilities.
- `packages/replay/src/project.test.ts` - Verifies public redaction and owner-only private section scoping with known private marker strings.
- `packages/replay/src/index.ts` - Exports the projection API from `@cowards/replay`.
- `.planning/phases/03-chronicle-and-replay-core/03-04-SUMMARY.md` - Records execution outcome and verification.

## Decisions Made

- Kept projection pure by cloning projected JSON-compatible data and never mutating the canonical Chronicle.
- Treated `AWARENESS_GRID_OBSERVED` as a public event marker while removing exact grid payloads from public output.
- Reduced public `RUNTIME_VIOLATION` payloads to safe marker fields only: type, category, owner/player ID, and Soldier ID when present.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added initial projection test during utility implementation**
- **Found during:** Task 03-04-01
- **Issue:** The task acceptance criteria required `pnpm --filter @cowards/replay test -- project.test.ts` to pass before the separate test task existed.
- **Fix:** Added a minimal projection smoke test with the utility implementation, then expanded it with the required marker privacy coverage in Task 03-04-02.
- **Files modified:** `packages/replay/src/project.test.ts`
- **Verification:** `pnpm --filter @cowards/replay test -- project.test.ts` passed after Task 03-04-01 and after Task 03-04-02.
- **Committed in:** `efa3f4a`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The adjustment satisfied the plan's hard acceptance gate without changing the intended projection scope.

## Issues Encountered

- Replay typecheck initially caught an optional-field typing issue in the runtime violation projection helper. The helper was tightened before the Task 03-04-01 commit so projected payloads never include `undefined` values.
- The local `gsd-sdk query` command was unavailable in this checkout/PATH, so planning state updates were applied directly to planning files instead of through SDK handlers.

## Known Stubs

None - marker strings in `packages/replay/src/project.test.ts` are intentional privacy fixtures, and empty objects in `packages/replay/src/project.ts` are internal projection accumulators.

## Threat Flags

None - the new projection surface is explicitly covered by this plan's threat model and verified by marker-based tests.

## Verification

- `pnpm --filter @cowards/replay test -- project.test.ts` - PASS, replay package tests passed with 5 files / 16 tests.
- `pnpm --filter @cowards/replay typecheck` - PASS.
- `pnpm verify` - PASS, format/lint/typecheck/test successful across 8 packages.

## Acceptance Criteria

- `packages/replay/src/project.ts` contains `export const projectChronicle` - PASS
- `packages/replay/src/project.ts` contains `export const projectPublicChronicle` - PASS
- `packages/replay/src/project.ts` contains `export const projectOwnerChronicle` - PASS
- `packages/replay/src/index.ts` exports from `./project.js` - PASS
- `packages/replay/src/project.test.ts` contains `PRIVATE_STRATEGY_MEMORY_MARKER` - PASS
- `packages/replay/src/project.test.ts` contains `PRIVATE_AWARENESS_GRID_MARKER` - PASS
- `packages/replay/src/project.test.ts` contains `AWARENESS_GRID_OBSERVED` - PASS
- `packages/replay/src/project.test.ts` contains `not.toContain` - PASS
- `pnpm --filter @cowards/replay test -- project.test.ts` exits 0 - PASS

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 03-05 can prove deterministic normalized Chronicles and replay package polish with projection APIs now available through `@cowards/replay`.

## Self-Check: PASSED

- Verified created files exist: `packages/replay/src/project.ts`, `packages/replay/src/project.test.ts`, `.planning/phases/03-chronicle-and-replay-core/03-04-SUMMARY.md`.
- Verified task commits `efa3f4a` and `d37a475` exist in git history.

---
*Phase: 03-chronicle-and-replay-core*
*Completed: 2026-05-16*
