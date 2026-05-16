---
phase: 03-chronicle-and-replay-core
plan: 03-02
subsystem: replay
tags: [typescript, chronicle, replay, engine, privacy, snapshots]

requires:
  - phase: 03-01
    provides: Versioned Chronicle contracts, boundary snapshot types, privacy sections, and Zod schemas
provides:
  - Engine transition summaries with Chronicle context, privacy, and owner-only private payload candidates
  - Chronicle builder that runs deterministic engine transitions and captures boundary snapshots
  - Replay builder tests for required events, snapshots, owner Awareness Grid privacy, and runMatch parity
affects: [replay-validation, replay-projection, replay-viewer, match-orchestration]

tech-stack:
  added: []
  patterns:
    - Chronicle construction outside GameState using transition summaries and boundary snapshots
    - Owner-only private payloads stored behind deterministic private:event references
    - Replay package consumes engine transitions rather than duplicating game rules

key-files:
  created:
    - packages/replay/src/build.ts
    - packages/replay/src/build.test.ts
    - .planning/phases/03-chronicle-and-replay-core/03-02-SUMMARY.md
  modified:
    - packages/engine/src/types.ts
    - packages/engine/src/activation.ts
    - packages/replay/src/index.ts
    - packages/replay/package.json
    - packages/replay/tsconfig.json
    - pnpm-lock.yaml

key-decisions:
  - "Kept GameState free of Chronicle logs; Chronicle construction is a replay-package concern."
  - "Recorded exact Awareness Grid data from SoldierBrainInput in owner-only private payloads and kept public events to markers/metadata."
  - "Made @cowards/replay depend on @cowards/engine so Chronicle construction can use the same deterministic transition functions as runMatch."

patterns-established:
  - "TransitionEventSummary may carry optional context, privacy, and privatePayload metadata without mutating engine state."
  - "Chronicle public events receive privateRef values when private payloads are stored in private.byPlayerId."
  - "Boundary snapshots anchor MATCH, ROUND, ACTIVATION, CONTRACTION, and terminal replay points."

requirements-completed: [REPLAY-01, REPLAY-02, REPLAY-03, REPLAY-04, REPLAY-07]

duration: 8min 49s
completed: 2026-05-16
---

# Phase 3 Plan 03-02: Chronicle Construction and Boundary Capture Summary

**Chronicle construction from deterministic engine transitions with boundary snapshots and owner-only Awareness Grid debug payloads**

## Performance

- **Duration:** 8min 49s
- **Started:** 2026-05-16T14:45:22Z
- **Completed:** 2026-05-16T14:54:11Z
- **Tasks:** 3
- **Files modified:** 8 source/config files plus this summary

## Accomplishments

- Enriched engine transition summaries with optional Chronicle context, privacy classification, and private payload candidates while leaving `GameState` free of Chronicle logs.
- Added `buildChronicleFromMatch` and `buildChronicleFromResult` in `@cowards/replay`, including required boundary snapshots and deterministic `private:event:{sequence}` references.
- Added replay builder tests proving required event construction, snapshot coverage, owner-only exact 25-cell Awareness Grid storage, and final outcome parity with `runMatch`.

## Task Commits

Each task was committed atomically:

1. **Task 03-02-01: Enrich engine transition summaries for Chronicle construction** - `bbcf6c3` (`feat`)
2. **Task 03-02-02: Implement Chronicle builder with boundary snapshots** - `0e2b5ee` (`feat`)
3. **Task 03-02-03: Add required event and snapshot construction tests** - `8c3e73b` (`test`)

## Files Created/Modified

- `packages/engine/src/types.ts` - Added optional `context`, `privacy`, and `privatePayload` fields to transition summaries.
- `packages/engine/src/activation.ts` - Captures owner-only StrategyMemory, SoldierMemory, exact Awareness Grid, objective payloads, and raw runtime violation details.
- `packages/replay/src/build.ts` - Builds canonical Chronicles from match inputs or existing results, with boundary snapshots and private section references.
- `packages/replay/src/build.test.ts` - Covers required events, snapshots, private Awareness Grid payloads, and `runMatch` final outcome parity.
- `packages/replay/src/index.ts` - Exports the builder API.
- `packages/replay/package.json`, `packages/replay/tsconfig.json`, `pnpm-lock.yaml` - Wire replay to engine and project-reference typechecking.
- `.planning/phases/03-chronicle-and-replay-core/03-02-SUMMARY.md` - Records execution outcome and verification.

## Decisions Made

- Used existing engine transition functions for Chronicle construction instead of duplicating rule execution in replay.
- Stored private payloads by owner player under deterministic references while leaving public event payloads marker-oriented.
- Represented `buildChronicleFromResult` missing intermediate snapshots as structured `SNAPSHOT_MISSING` warnings in metadata for Plan 03-03 validation hardening.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Wired replay package to engine package**
- **Found during:** Task 03-02-02
- **Issue:** `@cowards/replay` did not depend on `@cowards/engine`, but the plan requires Chronicle construction to use existing engine transition functions.
- **Fix:** Added the workspace dependency, TypeScript project reference, and `tsc -b` typecheck script for referenced package builds.
- **Files modified:** `packages/replay/package.json`, `packages/replay/tsconfig.json`, `pnpm-lock.yaml`
- **Verification:** `pnpm --filter @cowards/replay typecheck` and `pnpm verify` passed.
- **Committed in:** `0e2b5ee`

**2. [Rule 1 - Bug] Fixed private payload JSON typing**
- **Found during:** Task 03-02-02
- **Issue:** TypeScript rejected structurally JSON-compatible private payload objects because spec interfaces such as `RuntimeViolation` and `AwarenessGrid5x5` do not carry JSON index signatures.
- **Fix:** Added a narrow `privateJson` cast helper at the transition summary boundary without changing emitted payload shape.
- **Files modified:** `packages/engine/src/activation.ts`
- **Verification:** `pnpm --filter @cowards/replay typecheck`, engine tests, and `pnpm verify` passed.
- **Committed in:** `0e2b5ee`

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes were required to complete the planned builder and keep verification passing. No unrelated code was modified.

## Issues Encountered

- `pnpm verify` initially failed on Prettier formatting for the new test file. The file was formatted and the full verification command passed.
- The local `gsd-sdk query` command was unavailable in this checkout/PATH, so state updates were applied directly to planning files instead of through SDK handlers.

## Known Stubs

None - empty arrays/objects in touched files are internal accumulators or defaults, not UI/data-source stubs.

## Threat Flags

None - the new private replay data and boundary snapshot surfaces were explicitly covered by the plan threat model.

## Verification

- `pnpm --filter @cowards/engine test -- activation.test.ts match.test.ts` - PASS, 8 files / 37 tests
- `pnpm --filter @cowards/replay test -- build.test.ts` - PASS, 1 file / 3 tests
- `pnpm verify` - PASS, format/lint/typecheck/test successful across 8 packages

## Acceptance Criteria

- `packages/engine/src/types.ts` contains `privatePayload?: JsonValue` - PASS
- `packages/engine/src/types.ts` contains `context?: ChronicleEventContext` - PASS
- `packages/engine/src/activation.ts` contains `awarenessGrid: input.awarenessGrid` - PASS
- `packages/engine/src/activation.ts` contains `objectivePayload: objective` - PASS
- `packages/replay/src/build.ts` contains `export const buildChronicleFromMatch` - PASS
- `packages/replay/src/build.ts` contains `MATCH_START` - PASS
- `packages/replay/src/build.ts` contains `ACTIVATION_END` - PASS
- `packages/replay/src/build.ts` contains `private:event` - PASS
- `packages/replay/src/build.test.ts` contains `AWARENESS_GRID_OBSERVED` - PASS
- `packages/replay/src/build.test.ts` contains `toHaveLength(25)` - PASS
- `packages/replay/src/build.test.ts` contains `MATCH_ENDED` - PASS
- `packages/replay/src/build.test.ts` contains `runMatch` - PASS
- `GameState` remains free of Chronicle logs - PASS

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 03-03 can build replay reconstruction, validation, and integrity checks against constructed Chronicles with boundary snapshots and private owner sections.

## Self-Check: PASSED

- Verified created files exist: `packages/replay/src/build.ts`, `packages/replay/src/build.test.ts`, `.planning/phases/03-chronicle-and-replay-core/03-02-SUMMARY.md`.
- Verified commits `bbcf6c3`, `0e2b5ee`, and `8c3e73b` exist in git history.

---
*Phase: 03-chronicle-and-replay-core*
*Completed: 2026-05-16*
