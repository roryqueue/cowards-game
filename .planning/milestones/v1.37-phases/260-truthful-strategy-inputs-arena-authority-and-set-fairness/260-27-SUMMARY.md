---
phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
plan: "27"
subsystem: semantic-authority
tags: [authority-inversion, semantic-selection, generator, go-parity, activation]

requires:
  - phase: 260-22
    provides: Activated-state and rollback evaluator contract
provides:
  - One compact TypeScript source as the sole current semantic selector
  - Closed immutable v1.17 and v1.19 semantic-authority selections
  - Selection-neutral Go candidate evidence and an independently generated current mirror
affects: [260-28, 260-29, 260-30, 260-31, 260-32, 260-33, 260-14]

tech-stack:
  added: []
  patterns: [closed-selection-registry, derived-current-identity, candidate-current-digest-separation]

key-files:
  created: []
  modified:
    - packages/spec/src/current-semantic-authority-generated.ts
    - packages/spec/src/versions.ts
    - packages/spec/src/integrity-authority.ts
    - packages/spec/src/integrity-authority.test.ts
    - scripts/generate-v1-37-arena-set-authority.ts
    - scripts/generate-v1-37-arena-set-authority.test.ts
    - apps/go-backend/arena_set_authority_v1_37_generated.go
    - apps/go-backend/arena_set_authority_v1_37_generated_test.go
    - apps/go-backend/current_semantic_authority_generated.go

key-decisions:
  - "The compact semantic source is the sole TypeScript current selector; versions and integrity authority derive current identity from its exact closed selection."
  - "The closed resolver admits only exact v1.17 or exact v1.19 selections and rejects unknown or mixed version tuples."
  - "Candidate Go source/output hashes exclude the current selector; only the compact current Go mirror changes during a simulated activation."
  - "Live current authority remains exact v1.17 throughout this plan, preserving all Phase-259 defaults and behavior."

requirements-completed: [STRAT-01, STRAT-02, STRAT-03, STRAT-04, SET-01, SET-02, SET-03, SET-04, SET-05]

duration: 9min
completed: 2026-07-17
status: complete
---

# Phase 260 Plan 27: Authority Inversion and Candidate Evidence Decoupling Summary

**One compact source now owns current semantic identity, while closed v1.17/v1.19 projections and selection-neutral Go candidate evidence make the eventual activation a bounded current-mirror change.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-07-17T10:15:00Z
- **Completed:** 2026-07-17T10:24:00Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- Replaced reverse authority imports with a deeply frozen two-selection registry keyed only by the compact semantic source. Exact v1.17 and v1.19 records are resolvable, while unknown and mixed selections fail closed.
- Derived runtime ABI and tuple-key current values from the compact selection and privately selected the integrity-authority record without changing any live v1.17 export.
- Separated candidate Go source/output digests from current-selection source/output digests. A simulated v1.19 flip now changes only `current_semantic_authority_generated.go`; candidate evidence and its generated invariant test remain byte-identical.
- Regenerated and verified the live v1.17 Go mirrors, then passed spec, engine, replay, Go parity, integrity-artifact, and protected-baseline gates.

## Task Commits

1. **RED: closed authority inversion contract** — `cb573d7`
2. **GREEN: compact source owns current TypeScript authority** — `bbbdebd`
3. **GREEN: candidate Go hashes decoupled from current selection** — `09b3295`

## Decisions Made

- Current semantic identity is selected once. `versions.ts` and integrity-authority exports project that selection instead of participating in a validation cycle.
- The resolver uses generic overloads so the live exact v1.17 source retains literal TypeScript inference while simulated sources can resolve the full closed v1.17/v1.19 union.
- Candidate evidence represents the candidate payload independently of which selection is current. The compact Go mirror alone carries current-selection source and output digests.
- The live source remains v1.17; this plan prepares activation without activating v1.19 or changing gameplay, public defaults, Chronicle behavior, arena authority, or Set behavior.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking type inference] Closed selection resolution widened live current exports**
- **Found during:** Task 1 typecheck
- **Issue:** A non-generic resolver widened the exact live v1.17 selection to the v1.17/v1.19 union, breaking consumers that correctly depend on literal current types.
- **Fix:** Added a generic overload that preserves the input selection's exact return type while retaining the closed union for simulated sources.
- **Files modified:** `packages/spec/src/current-semantic-authority-generated.ts`
- **Verification:** Focused integrity/spec tests and `@cowards/spec` typecheck pass.
- **Committed in:** `bbbdebd`

---

**Total deviations:** 1 auto-fixed blocking inference issue.
**Impact:** Type-level current identity remains as exact as the Phase-259 runtime identity; runtime semantics and scope are unchanged.

## Issues Encountered

- The full Go suite requires `COWARDS_GO_BACKEND_TEST_DATABASE_URL`. The first environment-free run reached the six PostgreSQL proof tests and failed for missing setup; rerunning with the repository's local test database URL passed completely.

## User Setup Required

None.

## Verification

- Focused integrity/spec tests: 65 passed.
- Generator tests: 5 passed, including simulated v1.19 byte-invariance proof.
- `@cowards/spec` typecheck: passed.
- Generator `--write` followed by `--check`: passed.
- Full Go suite with the local PostgreSQL test URL: passed.
- Full `@cowards/spec` suite: 333 passed, 1 skipped.
- Full `@cowards/engine` and `@cowards/replay` suites: passed.
- Go parity and v1.37 integrity-authority checks: passed.
- Protected baseline: passed at `sha256:c0e1c2a6319f01377df74a2d6e5c493d26382f2882c059116c5ba467e5e81707`.

## TDD Gate Compliance

- RED commit `cb573d7` established exact v1.17/v1.19 resolution, unknown/mixed rejection, and simulated-flip invariance before implementation.
- GREEN commits `bbbdebd` and `09b3295` satisfy that contract and the complete live-equivalence gate.

## Next Phase Readiness

- Plan 260-28 can add the singleton transactional database selection head against one exact, cycle-free semantic authority.
- Plans 260-29, 260-30, and 260-32 can delegate consumers without discovering a second current selector.
- Final activation will not rewrite candidate Go evidence: its generated-file inventory is bounded to the compact current Go mirror for this seam.

## Self-Check: PASSED

- All nine planned implementation, test, and generated files were changed and committed in three focused TDD commits.
- No activation, gameplay, default, public-output, or protected-file delta was introduced.
- The only remaining working-tree changes before this summary commit are the two pre-existing protected user files.

---
*Phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness*
*Completed: 2026-07-17*
