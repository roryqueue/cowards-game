---
phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
plan: "17"
subsystem: public-spec-map-config-dispatch
tags: [public-spec, map-configs, versioned-dispatch, arena-catalog, preactivation]

requires:
  - phase: 260-02
    provides: Exact inactive runtime-v1.19 tuple and generated Phase-259 current selector
  - phase: 260-01
    provides: Frozen v1.19 observation, arena-catalog, and four-condition Set-policy candidates
provides:
  - Package-root explicit v1.17/v1.19 observation schemas and generated-selector-backed unversioned aliases
  - Exact manifest-projected v1.19 map-config catalog beside the byte-stable Phase-259 branch
  - Mutation-resistant candidate dispatch with Open Field historical-only for schedulable diversity
affects: [260-03, 260-05, 260-14, 260-18, 260-23, public-spec-consumers, map-config-consumers]

tech-stack:
  added: []
  patterns: [generated-current-alias, explicit-candidate-dispatch, manifest-projected-facade]

key-files:
  created: []
  modified:
    - packages/spec/src/types.ts
    - packages/spec/src/schemas.ts
    - packages/spec/src/index.ts
    - packages/spec/src/strategy-observation-abi-v1-19.ts
    - packages/spec/src/spec.test.ts
    - packages/map-configs/src/index.ts
    - packages/map-configs/src/index.test.ts

key-decisions:
  - "Keep unversioned StrategyInput and SoldierBrainInput schemas/types selected by the generated semantic authority while explicit v1.17 and v1.19 contracts remain directly addressable."
  - "Preserve the complete handwritten Phase-259 map-config branch and derive only the v1.19 candidate projection from the canonical spec manifest."
  - "Keep Open Field readable in the candidate catalog as a historical alias while excluding it from candidate schedulable diversity."

patterns-established:
  - "Public candidate facade: version-specific imports are exact while current aliases follow the compact generated selector."
  - "Map authority projection: candidate geometry is copied only from the validated spec manifest; legacy literals remain isolated to the historical branch."

requirements-completed: [STRAT-01, STRAT-02, STRAT-03, SET-01, SET-02, SET-05]

coverage:
  - id: D1
    description: "The public spec root exposes exact v1.19 observation/catalog/policy candidates while unversioned observation schemas remain the generated Phase-259 selection before activation."
    requirement: STRAT-01
    verification:
      - kind: unit
        ref: "packages/spec/src/spec.test.ts#versioned public semantic authority"
        status: pass
      - kind: integration
        ref: "pnpm --filter @cowards/spec test && pnpm --filter @cowards/spec build"
        status: pass
    human_judgment: false
  - id: D2
    description: "The v1.19 map-config facade projects unchanged official arena bytes from the spec manifest, marks Open Field historical-only for scheduling, and preserves all Phase-259 exports/defaults."
    requirement: SET-02
    verification:
      - kind: unit
        ref: "packages/map-configs/src/index.test.ts#curated arena variants"
        status: pass
      - kind: integration
        ref: "pnpm --filter @cowards/map-configs test && pnpm --filter @cowards/map-configs typecheck"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-07-17
status: complete
---

# Phase 260 Plan 17: Public Spec and Map-Config Candidate Dispatch Summary

**The public spec and map-config packages now expose exact runtime-v1.19 candidate contracts while every unversioned/current alias still resolves to the complete Phase-259 authority.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-17T02:58:34Z
- **Completed:** 2026-07-17T03:10:12Z
- **Tasks:** 2 TDD tasks
- **Files modified:** 7

## Accomplishments

- Added exact v1.17 and v1.19 Strategy/SoldierBrain types and schemas to the package-root API, with current aliases selected from `CURRENT_SEMANTIC_RUNTIME_ABI_VERSION` and mixed candidate inputs rejected strictly.
- Exported the generated current semantic selector and all candidate observation, arena, and Set-policy APIs from `@cowards/spec` without changing its Phase-259 source, projection, tuple, registry, or defaults.
- Added explicit Phase-259 and runtime-v1.19 map-config catalogs, with the current alias resolving from the generated selector and the candidate projected only from the validated spec manifest.
- Preserved exact Smoke, Standard Cross, and Open Field `ArenaVariant` bytes while excluding historical Open Field from candidate schedulable diversity and rejecting alias/hash/status/geometry substitutions.

## Task Commits

Each TDD task was committed as an atomic RED/GREEN pair:

1. **Task 1 RED: public spec candidate facade expectations** - `5046066` (test)
2. **Task 1 GREEN: selector-backed public candidates** - `68ae7cc` (feat)
3. **Task 2 RED: map-config candidate dispatch expectations** - `38d4cfd` (test)
4. **Task 2 GREEN: manifest-backed map candidate** - `d5417df` (feat)

## Files Created/Modified

- `packages/spec/src/types.ts` - Explicit v1.17/v1.19 observation types and generated-selector-backed current aliases.
- `packages/spec/src/schemas.ts` - Explicit versioned schemas, exact runtime-version resolution, and generated current aliases.
- `packages/spec/src/index.ts` - Package-root exports for the generated current selector and v1.19 observation candidate.
- `packages/spec/src/strategy-observation-abi-v1-19.ts` - Re-exports the single selector-backed versioned schema/type definitions while retaining D-01 through D-08 validation semantics.
- `packages/spec/src/spec.test.ts` - Package-root candidate, current-alias, and mixed-selector regression proof.
- `packages/map-configs/src/index.ts` - Complete legacy catalog plus spec-manifest-projected explicit candidate/current dispatch.
- `packages/map-configs/src/index.test.ts` - Phase-259 byte snapshots, candidate scheduling, exact dispatch, mutation, and board-realism proof.

## Decisions Made

- Current observation aliases are resolved from the generated semantic selector instead of a second handwritten default. The active key remains `runtime-v1.17` before Plan 260-14.
- The v1.19 candidate schema and its public candidate module share one implementation; no duplicate validator can drift from the package-root facade.
- The map-config candidate keeps all three official records readable, but only Smoke and Standard Cross are schedulable. The complete legacy branch still treats its three historical variants exactly as before.
- No geometry, rules-owned starting position, Action legality, runtime ownership, current tuple, preset, or historical dispatch changed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Consolidated the candidate schema into the selector-backed schema authority**
- **Found during:** Task 1 GREEN
- **Issue:** Leaving the Plan-01 v1.19 schemas defined separately while adding selector-backed public schemas would create two writable schema authorities that could drift before activation.
- **Fix:** Made `strategy-observation-abi-v1-19.ts` re-export the versioned schemas/types from `schemas.ts`/`types.ts` while retaining its contextual initiative validator and immutable D-01 through D-08 contract.
- **Files modified:** `packages/spec/src/strategy-observation-abi-v1-19.ts`
- **Verification:** Focused candidate tests, full spec suite, typecheck, build, lint, and package-root identity assertions pass.
- **Committed in:** `68ae7cc`

---

**Total deviations:** 1 auto-fixed missing-critical issue.
**Impact on plan:** The adjustment prevents duplicate schema authority and does not change candidate semantics, released bytes, current selection, or scope.

## Issues Encountered

None.

## User Setup Required

None - no dependency, environment variable, service, database, or secret is required.

## Verification

- `pnpm --filter @cowards/spec test`: 18 files, 329 tests passed, 1 existing skip.
- `pnpm --filter @cowards/spec build`: passed.
- Focused spec facade/observation/selector suite: 3 files, 77 tests passed.
- `pnpm --filter @cowards/map-configs test`: 1 file, 5 tests passed.
- `pnpm --filter @cowards/map-configs typecheck`: passed.
- `pnpm --filter @cowards/map-configs build`: passed.
- ESLint on every changed TypeScript/test file: passed.
- Current-selector drift check: no diff in compact/generated selector, versions, or integrity-authority files from the Plan-17 starting commit.
- Protected-baseline check: passed; `.planning/config.json` remains `a9502647...953f7b` and `CowardsGameSpec_Full_Consolidated_v1.md` remains `01b0a95c...fa46`.
- Stub and threat-surface scans: no TODO/FIXME/placeholder implementation and no new network, authentication, filesystem, database, or Strategy-execution surface.

## TDD Gate Compliance

- Task 1 RED `5046066` failed only for absent public candidate/current-facade exports; GREEN `68ae7cc` passes focused and full spec gates.
- Task 2 RED `38d4cfd` failed for absent catalog/dispatch/projection behavior, including named mutation error assertions; GREEN `d5417df` passes focused and full map-config gates.

## Next Phase Readiness

- Plan 260-03 can consume explicit v1.19 observation schemas while all current engine/runtime imports remain Phase-259.
- Plans 260-05, 260-18, and 260-23 can use exact public candidate dispatch without source-subpath imports or geometry redefinition.
- Plan 260-14 remains the sole owner of changing the compact current selector; no early activation occurred.
- The pre-existing user modifications to `.planning/config.json` and `CowardsGameSpec_Full_Consolidated_v1.md` remain untouched, unstaged, and uncommitted.

## Self-Check: PASSED

- All seven changed source/test files exist and all four TDD commits are present in git history.
- All declared verification, build, typecheck, lint, selector-drift, mutation, no-new-geometry, and protected-baseline checks pass.
- No unexpected deletion, untracked generated output, current-selector change, new official geometry, or protected-file mutation was introduced.

---
*Phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness*
*Completed: 2026-07-17*
