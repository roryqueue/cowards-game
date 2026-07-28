---
phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
plan: "24"
subsystem: candidate-web-projection
tags: [web, replay, public-contract, arena-catalog, set-conditions, privacy]

requires:
  - phase: 260-09
    provides: Exact inactive replay envelope and catalog/condition validation
  - phase: 260-23
    provides: Strict privacy-safe v1.19 public condition-result DTO
provides:
  - Explicit inactive candidate replay arena dispatch backed by the spec-owned catalog
  - Mechanical candidate result labels derived only from the strict public DTO
  - Fail-closed missing, alias, unknown, and mixed-version handling with exact Phase-259 preservation
affects: [260-14, 260-21, 260-25, replay-web, result-workbench]

tech-stack:
  added: []
  patterns: [explicit-candidate-dispatch, contract-only-rendering, isolated-current-branch]

key-files:
  created: []
  modified:
    - apps/web/app/matches/replay-ready.ts
    - apps/web/app/matches/replay-fixture.ts
    - apps/web/app/matches/replay-fixture.test.ts
    - apps/web/app/matchsets/result-view-model.ts
    - apps/web/app/matchsets/result-view-model.test.ts

key-decisions:
  - "Keep the Phase-259 canonical arena literals inside an explicit current-only branch; candidate replay resolution uses the strict v1.19 DTO and spec-owned catalog."
  - "Expose candidate web projections as inactive and non-publishable until Plan 260-14; do not wire them into the current replay or result page."
  - "Render candidate arena, catalog, condition, side, and initiative labels byte-for-byte from the approved DTO without deriving hashes, fairness, seeds, rules, or runtime semantics."

patterns-established:
  - "Candidate web admission: strict public DTO parse -> exact active catalog equality -> inactive candidate projection or unavailable."
  - "Current web compatibility: unchanged current function signatures and output shape, guarded by focused and full-package regressions."

requirements-completed: [STRAT-04, SET-01, SET-02, SET-04, SET-05]

coverage:
  - id: D1
    description: "Candidate replay readiness accepts only exact active catalog authority and remains explicitly non-current and non-publishable."
    requirement: SET-02
    verification:
      - kind: unit
        ref: "apps/web/app/matches/replay-fixture.test.ts#candidate replay authority matrix"
        status: pass
      - kind: integration
        ref: "pnpm --filter @cowards/web exec vitest run --maxWorkers=1 --no-file-parallelism"
        status: pass
    human_judgment: false
  - id: D2
    description: "Candidate result projection renders only approved publication, arena, catalog, condition, side, and initial-initiative fields and fails closed on invalid input."
    requirement: STRAT-04
    verification:
      - kind: unit
        ref: "apps/web/app/matchsets/result-view-model.test.ts#candidate DTO and structural no-derivation tests"
        status: pass
      - kind: other
        ref: "pnpm --filter @cowards/web typecheck && pnpm --filter @cowards/web lint"
        status: pass
    human_judgment: false
  - id: D3
    description: "Current Phase-259 replay realism checks, fixtures, and result workbench output remain exact while the candidate stays unselected."
    requirement: SET-05
    verification:
      - kind: compatibility
        ref: "apps/web/app/matches/replay-fixture.test.ts and apps/web/app/matchsets/result-view-model.test.ts#Phase-259 preservation"
        status: pass
      - kind: integration
        ref: "@cowards/web full suite: 42 files, 234 tests"
        status: pass
    human_judgment: false

duration: 8min
completed: 2026-07-17
status: complete
---

# Phase 260 Plan 24: Candidate Replay and Result Projection Summary

**Web can now inspect exact inactive v1.19 replay/result facts without acquiring arena, fairness, gameplay, Strategy-execution, or publication authority.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-07-17T07:07:18Z
- **Completed:** 2026-07-17T07:15:29Z
- **Tasks:** 2 TDD tasks
- **Files modified:** 5

## Accomplishments

- Replaced the unversioned replay canonical-arena lookup with explicit current/candidate dispatch while keeping all three Phase-259 literals and behavior in the current branch.
- Added candidate replay admission that parses the strict public DTO, checks the exact active/schedulable spec catalog record and semantic identity, rejects aliases/unknown/missing/mixed inputs, and reports valid evidence as non-current and non-publishable.
- Added a mechanical candidate result view model that copies only approved publication, arena/catalog, condition, side, and initial-initiative labels.
- Preserved the existing current replay builders, fixture routes, result workbench function, page wiring, and serialized current view shape without a visual redesign.

## Task Commits

Each TDD task was committed as a RED/GREEN pair:

1. **Task 1 RED: candidate replay readiness contract** - `f7e26df` (test)
2. **Task 1 GREEN: exact candidate replay authority** - `2106b05` (feat)
3. **Task 2 RED: mechanical candidate result projection** - `d97b926` (test)
4. **Task 2 GREEN: fail-closed candidate labels** - `6d04ee0` (feat)

## Files Created/Modified

- `apps/web/app/matches/replay-ready.ts` - Adds explicit current/candidate arena dispatch and exact catalog-backed candidate admission.
- `apps/web/app/matches/replay-fixture.ts` - Exposes a test-only candidate readiness fixture seam without changing current fixture generation.
- `apps/web/app/matches/replay-fixture.test.ts` - Covers exact candidate, missing, unknown, alias, mixed-version, and current-literal behavior.
- `apps/web/app/matchsets/result-view-model.ts` - Adds the inactive contract-only candidate result projection beside the unchanged current workbench.
- `apps/web/app/matchsets/result-view-model.test.ts` - Covers candidate labels, fail-closed data, structural no-derivation boundaries, and current output preservation.

## Decisions Made

- Candidate web dispatch is addressed only as `runtime-v1.19-candidate`; no unversioned alias or current selector reaches it before the atomic activation owner runs.
- Catalog identity is validated by comparing the DTO to the immutable spec-owned record. Web computes no geometry hash and defines no candidate arena geometry.
- Candidate result output intentionally omits the approved DTO's semantic hash because the view needs labels, not evidence internals; the hash is used only for admission equality.
- Current page wiring remains untouched. The candidate projections are staging APIs for later activation/proof, not a visual redesign or premature public route.

## Deviations from Plan

None - the action explicitly required alias/unknown/mixed-version and structural tests; the existing replay fixture test file was included to satisfy that TDD requirement even though the plan frontmatter listed only the two Task-1 production files.

## Issues Encountered

- The first full web run under concurrent Phase-260 executors timed out one pre-existing 5-second replay fixture case after 233 tests passed. The focused fixture suite had already passed; a serialized full-package rerun passed all 42 files and 234 tests, confirming resource contention rather than a regression.

## User Setup Required

None - no dependency, database, service, secret, environment variable, or UI setup is required.

## Automated Evidence

- Replay fixture focused suite: 28/28 tests passed.
- Result view-model focused suite: 10/10 tests passed.
- Serialized full `@cowards/web` suite: 42 files, 234/234 tests passed.
- `pnpm --filter @cowards/web typecheck`: passed.
- `pnpm --filter @cowards/web lint`: passed.
- Protected working-tree baseline: exact at `sha256:c0e1c2a6319f01377df74a2d6e5c493d26382f2882c059116c5ba467e5e81707`.
- Stub scan: no TODO, FIXME, placeholder, or unimplemented candidate path.
- Threat scan: no new network, persistence, authentication, Strategy execution, gameplay, seed, Cartesian fairness, or UI route authority.

## TDD Gate Compliance

- Task 1 RED `f7e26df` failed on six missing candidate/current dispatch expectations; GREEN `2106b05` passes the complete replay authority matrix.
- Task 2 RED `d97b926` failed on six missing projection/boundary expectations; GREEN `6d04ee0` passes candidate labels, fail-closed behavior, structural ownership, and current compatibility.

## Next Phase Readiness

- Plan 260-25 can monitor the concrete web consumer graph for handwritten arena authority, semantic derivation, and execution imports.
- Plan 260-21 can include candidate replay/result evidence in the complete preactivation proof while all current paths remain Phase 259.
- Plan 260-14 remains the sole activation owner; this plan changed no current selector, route, page, Chronicle interpretation, gameplay, or historical evidence.

## Self-Check: PASSED

- All five modified files exist and all four RED/GREEN commits are present in git history.
- Focused/full tests, typecheck, lint, privacy/structural scans, current compatibility, and protected-baseline checks pass.
- No unexpected deletion, untracked plan output, active sibling-plan file, protected file, public-private field, or current selector was staged or committed.

---
*Phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness*
*Completed: 2026-07-17*
