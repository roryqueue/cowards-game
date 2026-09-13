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
  - root-bound data-only factory packet emitter compiled from exact tactical controller modules
affects: [264-05, 264-07, private-factory-admission]
tech-stack:
  added: []
  patterns: [leaf-owned strategic core, static module bundling, free-identifier source closure, data-only factory packet]
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
  - "Compile the exact leaf-owned controller modules into static checked candidate data; neither tests nor the leaf execute it."
  - "Record required local deterministic optimizer provenance without asserting any model participation."
patterns-established:
  - "Factory leaves bind fixed inherited engine/runtime/source-closure pins while owning their algorithm version."
  - "Trusted leaf controllers receive legal inputs in unit tests; candidate source execution remains reserved for existing supervision."
requirements-contributed: [ORCL-01, ORCL-02]
requirement_status: implementation_only_pending_phase_integration_and_evidence
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
duration: 21min
completed: 2026-09-13
status: complete
---

# Phase 264 Plan 02: Independent Tactical Optimizer Summary

**A private tactical leaf compiles its own selector, scoring, bounded search, and response modules into deterministic root-bound candidate data.**

## Performance

- **Duration:** 21 min
- **Started:** 2026-09-13T23:25:00Z
- **Completed:** 2026-09-13T23:44:01Z
- **Tasks:** 2/2
- **Files modified:** 8

## Accomplishments

- Added a physically separate tactical selector with owned mission scoring, Action scoring, bounded beam expansion, and local Soldier response generation.
- Added static module bundling for the exact tactical controller plus AST closure checks that reject unresolved identifiers and capability recovery paths, without evaluating generated candidate code.
- Bound exact source bytes, factory packet root, inherited authority, native lane, and required local optimizer provenance through the factory schema.

## Task Commits

1. **Task 1: Establish the tactical leaf package and owned strategic core** - `eea1fa2f` (feat)
2. **Task 2 RED: Emit and prove legal deterministic tactical candidate source** - `98f217b7` (test)
3. **Task 2 GREEN: Emit and prove legal deterministic tactical candidate source** - `09aecee0` (feat)
4. **Task 2 correction: Bundle exact tactical controller source** - `24cf671b` (fix)

## Files Created/Modified

- `packages/strategy-oracle-tactical/package.json` - private leaf package metadata without new package installation.
- `packages/strategy-oracle-tactical/tsconfig.json` - independent composite build and foundation references.
- `packages/strategy-oracle-tactical/src/{selector,scoring,search}.ts` - owned tactical strategic core.
- `packages/strategy-oracle-tactical/src/emit.ts` - static bundler, manifest-root correspondence proof, checked source closure, and exact `emitTacticalFactoryPacket` data emitter.
- `packages/strategy-oracle-tactical/src/{index,tactical.test}.ts` - narrow leaf entrypoint and focused legal-input/provenance tests.

## Decisions Made

- Tactical behavior ranks only canonical board or awareness observations, objectives, and deterministic tie keys; it reads no hidden or counterfactual input.
- The emitted source is a transpiled closure of the exact trusted tactical modules, not a handwritten mirror. Unit tests exercise trusted controllers and static source structure; existing supervised runtime admission remains the only later source-execution lane.
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

**3. [Rule 1 - Bug] Replaced the emitted handwritten tactical surrogate with the exact owned controller closure**
- **Found during:** Same-plan integration review after Task 2
- **Issue:** The source advertised `tactical-beam-v1` but had independently handwritten greedy selection and Action scoring, so it could drift from the owned bounded-search controller.
- **Fix:** Statically bundled the authored `scoring.ts`, `search.ts`, and `selector.ts` modules in dependency order; added a source-manifest correspondence root plus free-identifier and capability-recovery closure tests.
- **Files modified:** `packages/strategy-oracle-tactical/src/{emit,index,tactical.test}.ts`
- **Verification:** Six focused Vitest tests and the package TypeScript build pass; tests do not execute emitted code.
- **Committed in:** `24cf671b`

**Total deviations:** 3 auto-fixed (Rule 1: 2; Rule 3: 1). No scope expansion or package installation occurred.

## Known Stubs

None. The correction replaces the handwritten emitted surrogate with a static bundle of the leaf's real scoring, bounded-search, selector, and response modules. Candidate source remains intentionally data-only until existing later supervision.

## Issues Encountered

The package was intentionally added without altering the root workspace lockfile or installing a new workspace link. The scoped relative foundation import permits the required focused verification in the current checkout; root workspace integration remains owned by the phase coordinator.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 05 can ingest the exact `emitTacticalFactoryPacket` export after it wires all leaf packages. The remaining phase requirement status is intentionally contributed/implementation-only pending combined-wave integration, static boundary review, and later supervised source behavior verification. Nothing here claims independent-oracle evidence, actual candidate admission, model participation, calibration, Match execution, league readiness, or empirical success.

## Self-Check: PASSED

- Confirmed all eight tactical package source/config artifacts and this summary exist.
- Confirmed task commits `eea1fa2f`, `98f217b7`, `09aecee0`, and `24cf671b` exist in git history.
