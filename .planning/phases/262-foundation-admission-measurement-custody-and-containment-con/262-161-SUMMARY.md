---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "161"
subsystem: replay-runtime-integrity
tags: [replay, runtime-service, terrain, canonicalization, tdd]
requires:
  - plan: 262-156
    provides: reviewed corrective runner source and active-arena alias resolution
provides:
  - one shared side-effect-free y-then-x replay terrain projection
  - Standard Cross terminal binding across replay reconstruction and runtime comparison
  - focused fail-closed coverage for missing, duplicate, changed, and out-of-bounds terrain
affects: [262-157, 262-158, replay-integrity, runtime-terminal-binding]
tech-stack:
  added: []
  patterns: [canonical-boundary-projection, clone-before-sort, semantic-validation-before-normalization]
key-files:
  created:
    - .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-161-SUMMARY.md
  modified:
    - packages/replay/src/reconstruct.ts
    - packages/replay/src/index.ts
    - apps/runtime-service/src/execute-match.ts
    - apps/runtime-service/src/execute-match-v1-18.test.ts
key-decisions:
  - "Normalize only cloned terrain iteration order at replay/runtime comparison boundaries; never alter coordinates, multiplicity, arena geometry, or engine state."
  - "Use the arena catalog's y-then-x contract as the single projection order for replay reconstruction and runtime terminal comparison."
requirements-completed: []
coverage:
  - id: D1
    description: Equivalent Standard Cross terrain arrays no longer fail replay reconstruction or runtime terminal binding solely because their iteration order differs.
    requirement: ADMIT-03
    verification:
      - kind: integration
        ref: apps/runtime-service/src/execute-match-v1-18.test.ts#accepts Standard Cross across replay reconstruction and terminal binding
        status: pass
    human_judgment: false
  - id: D2
    description: Missing, duplicate, changed, and out-of-bounds terrain remain integrity failures.
    requirement: ADMIT-04
    verification:
      - kind: integration
        ref: apps/runtime-service/src/execute-match-v1-18.test.ts#keeps non-order terrain mutations behind the integrity boundary
        status: pass
    human_judgment: false
  - id: D3
    description: Replay and runtime consume one exported clone-and-sort terrain projection without creating live or authority effects.
    requirement: MEAS-09
    verification:
      - kind: unit
        ref: pnpm exec vitest run packages/replay/src/reconstruct.test.ts apps/runtime-service/src/execute-match-v1-18.test.ts --pool=forks --maxWorkers=1 --no-file-parallelism --bail=1
        status: pass
      - kind: other
        ref: pnpm exec tsc --noEmit --pretty false
        status: pass
    human_judgment: false
duration: 7min
completed: 2026-09-01
status: complete
---

# Phase 262 Plan 161: Canonical Replay Terrain Projection Summary

**Replay reconstruction and runtime terminal binding now share a clone-only y-then-x terrain projection, closing the Standard Cross order defect without changing game semantics.**

## Performance

- **Duration:** 7 minutes
- **Started:** 2026-09-01T19:17:00Z
- **Completed:** 2026-09-01T19:23:53Z
- **Tasks:** 1
- **Files modified:** 5

## Accomplishments

- Added and publicly exported `canonicalReplayTerrain`, which clones positions and sorts them by y then x without interpreting or mutating coordinates.
- Applied the same projection to replay final-state reconstruction, Chronicle terminal snapshot comparison, and runtime terminal comparison.
- Added an actual current-service Standard Cross regression plus fail-closed mutations for missing stones, duplicates, changed coordinates, and out-of-bounds coordinates.
- Preserved Smoke behavior, engine state, arena geometry, transition/event semantics, evidence bytes, and all live/authority boundaries.

## Task Commits

1. **Task 1 RED: Reproduce Standard Cross terrain-order failure** — `42cd65fd`
2. **Task 1 GREEN: Canonicalize replay terrain projection** — `40599f1a`

## Files Created/Modified

- `packages/replay/src/reconstruct.ts` — Defines the shared terrain projection and normalizes replay terminal comparison inputs.
- `packages/replay/src/index.ts` — Explicitly exposes the canonical terrain projection from the replay package.
- `apps/runtime-service/src/execute-match.ts` — Uses the shared projection on both sides of runtime terminal equality.
- `apps/runtime-service/src/execute-match-v1-18.test.ts` — Exercises Standard Cross through the real current Match service and verifies semantic terrain mutations still fail closed.
- `.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-161-SUMMARY.md` — Records the source-only correction and proof.

## Decisions Made

- Ordering normalization is restricted to comparison projections. It does not repair, discard, deduplicate, clamp, or otherwise reinterpret terrain.
- The helper returns fresh coordinate objects before sorting, preventing callers from mutating engine, Chronicle, or arena-owned arrays.
- Existing semantic validation remains authoritative for coordinate validity, multiplicity, bounds, and arena-set equality.

## Verification

- RED gate: the Standard Cross regression failed with a runtime `systemFailure` before implementation.
- GREEN focused suite: 7/7 runtime-service tests passed.
- Expanded affected suite: 15/15 replay reconstruction and runtime-service tests passed.
- `pnpm exec tsc --noEmit --pretty false`: passed.
- `git diff --check`: passed.
- Corrective manifest, review, readiness, invocation, and terminal artifacts remain absent.
- All 36 successor lockfiles remain present and untouched.

## TDD Gate Compliance

- RED commit `42cd65fd` precedes GREEN commit `40599f1a`.
- The RED test demonstrated the order-only terminal-binding failure before the production correction.
- The GREEN implementation passes the regression and the mutation boundary checks.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

The initial uncommitted fixture allowed the engine to normalize both compared arrays into the same order, so it passed unexpectedly. The regression was tightened before the RED commit to exercise deliberately different equivalent orders, then finalized against the actual current Match service rather than weakening semantic validation.

## Known Stubs

None.

## Threat Flags

None. The change adds no endpoint, authentication path, filesystem access, network surface, schema, package, live invocation, or authority artifact.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 157 may independently review the exact combined Plan 156 and Plan 161 closure. No corrective Match, readiness, authority, or downstream-phase permission was created by this source-only plan.

## Self-Check: PASSED

Both task commits resolve, all five plan files exist, focused tests and TypeScript pass, corrective effect destinations remain absent, and the only untracked files are the preserved 36 successor locks.

---
*Phase: 262-foundation-admission-measurement-custody-and-containment-con*
*Completed: 2026-09-01*
