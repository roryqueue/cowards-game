---
phase: 264-immutable-factory-independent-oracles-and-quarantined-intake
plan: "02"
subsystem: private tactical oracle
tags: [typescript, vitest, deterministic-strategy, factory-packet, source-closure]
requires:
  - phase: 264-01
    provides: strict private FactoryOraclePacket contract and inherited authority pins
provides:
  - independent tactical selector, mission/Action scoring, bounded search, and local response logic
  - root-bound data-only tactical factory packet emitter with a self-contained deterministic source closure
affects: [264-05, 264-07, private-factory-admission]
tech-stack:
  added: []
  patterns: [leaf-owned strategic core, static emitted-source closure, data-only factory packet]
key-files:
  created:
    - packages/strategy-oracle-tactical/src/selector.ts
    - packages/strategy-oracle-tactical/src/scoring.ts
    - packages/strategy-oracle-tactical/src/search.ts
    - packages/strategy-oracle-tactical/src/emit.ts
    - packages/strategy-oracle-tactical/src/tactical.test.ts
  modified: []
key-decisions:
  - "Keep tactical mission, Action, search, and response logic physically local to this leaf."
  - "Return a static checked candidate as packet data; neither tests nor the leaf execute emitted source."
  - "Record required local deterministic optimizer provenance without asserting any model participation."
patterns-established:
  - "Factory leaves bind fixed inherited engine/runtime/source-closure pins while owning their algorithm version."
  - "Trusted leaf controllers receive legal inputs in unit tests; candidate source execution remains reserved for existing supervision."
requirements-completed: [ORCL-01, ORCL-02]
coverage:
  - id: D1
    description: Independent tactical selector, scoring, bounded search, and legal-input response behavior.
    requirement: ORCL-02
    verification:
      - kind: unit
        ref: packages/strategy-oracle-tactical/src/tactical.test.ts#varies tactical missions with legal board observations while ignoring counterfactual fields
        status: pass
      - kind: unit
        ref: packages/strategy-oracle-tactical/src/tactical.test.ts#is deterministic and picks a local response from only the tactical objective and awareness
        status: pass
    human_judgment: false
  - id: D2
    description: Strict data-only FactoryOraclePacket with checked source closure and provenance roots.
    requirement: ORCL-01
    verification:
      - kind: unit
        ref: packages/strategy-oracle-tactical/src/tactical.test.ts#exports the exact data-only packet emitter with source and provenance roots
        status: pass
      - kind: other
        ref: ./node_modules/.bin/tsc -b packages/strategy-oracle-tactical
        status: pass
    human_judgment: false
duration: 6min
completed: 2026-09-13
status: complete
---

# Phase 264 Plan 02: Independent Tactical Optimizer Summary

**A private tactical leaf with independently owned scoring and bounded search emits deterministic, root-bound candidate source as factory data.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-09-13T23:25:00Z
- **Completed:** 2026-09-13T23:30:56Z
- **Tasks:** 2/2
- **Files modified:** 8

## Accomplishments

- Added a physically separate tactical selector with owned mission scoring, Action scoring, bounded beam expansion, and local Soldier response generation.
- Added static AST/lexical closure checks and a self-contained deterministic source emitter without evaluating or importing generated candidate code.
- Bound exact source bytes, factory packet root, inherited authority, native lane, and required local optimizer provenance through the factory schema.

## Task Commits

1. **Task 1: Establish the tactical leaf package and owned strategic core** - `eea1fa2f` (feat)
2. **Task 2 RED: Emit and prove legal deterministic tactical candidate source** - `98f217b7` (test)
3. **Task 2 GREEN: Emit and prove legal deterministic tactical candidate source** - `09aecee0` (feat)

## Files Created/Modified

- `packages/strategy-oracle-tactical/package.json` - private leaf package metadata without new package installation.
- `packages/strategy-oracle-tactical/tsconfig.json` - independent composite build and foundation references.
- `packages/strategy-oracle-tactical/src/{selector,scoring,search}.ts` - owned tactical strategic core.
- `packages/strategy-oracle-tactical/src/emit.ts` - checked source closure and exact `emitTacticalFactoryPacket` data emitter.
- `packages/strategy-oracle-tactical/src/{index,tactical.test}.ts` - narrow leaf entrypoint and focused legal-input/provenance tests.

## Decisions Made

- Tactical behavior ranks only canonical board or awareness observations, objectives, and deterministic tie keys; it reads no hidden or counterfactual input.
- The emitted source is never executed by this package. Unit tests exercise the trusted owned controller; existing supervised runtime admission remains the only later source-execution lane.
- The factory contract's provider fields identify the local deterministic optimizer's required provenance and do not represent real model evidence or participation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Kept focused Vitest independent of an uninstalled workspace package link**
- **Found during:** Task 2
- **Issue:** The root workspace has no installed `@cowards/strategy-lab` link for the new leaf, so direct target-test resolution failed before the feature test could run.
- **Fix:** Used the existing factory source entrypoint through a relative private workspace path while retaining the typed factory reference and composite project reference. No lockfile, root configuration, or package installation changed.
- **Files modified:** `packages/strategy-oracle-tactical/src/emit.ts`, `packages/strategy-oracle-tactical/src/tactical.test.ts`
- **Verification:** Focused Vitest and `tsc -b packages/strategy-oracle-tactical` pass.
- **Committed in:** `09aecee0`

**2. [Rule 1 - Bug] Corrected strict fixture typing after schema parsing**
- **Found during:** Task 2
- **Issue:** The schema parser preserves optional-field typing that is stricter than the controller's exact v1.19 input type under `exactOptionalPropertyTypes`.
- **Fix:** Narrowed the parsed test fixture to the canonical controller input type after validation.
- **Files modified:** `packages/strategy-oracle-tactical/src/tactical.test.ts`
- **Verification:** Package TypeScript build passes.
- **Committed in:** `09aecee0`

**Total deviations:** 2 auto-fixed (Rule 1: 1; Rule 3: 1). No scope expansion or package installation occurred.

## Known Stubs

None. The emitted source is intentionally data-only, not an unwired candidate or placeholder; supervised execution is deliberately deferred to the existing factory/runtime path.

## Issues Encountered

The package was intentionally added without altering the root workspace lockfile or installing a new workspace link. The scoped relative foundation import permits the required focused verification in the current checkout; root workspace integration remains owned by the phase coordinator.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 05 can ingest the exact `emitTacticalFactoryPacket` export after it wires all leaf packages. These unit mechanics establish implementation readiness only; they do not claim independent-oracle evidence, actual candidate admission, model participation, calibration, Match execution, league readiness, or empirical success.

## Self-Check: PASSED

- Confirmed all eight tactical package source/config artifacts and this summary exist.
- Confirmed task commits `eea1fa2f`, `98f217b7`, and `09aecee0` exist in git history.
