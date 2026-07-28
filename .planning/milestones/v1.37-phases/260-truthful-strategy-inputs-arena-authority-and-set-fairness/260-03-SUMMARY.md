---
phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
plan: "03"
subsystem: engine-kernel-observations
tags: [strategy-input, initiative, activation-slot, compatibility, candidate-dispatch]

requires:
  - phase: 260-02
    provides: Inactive runtime-v1.19 tuple and Phase-259-preserving selector
  - phase: 260-17
    provides: Selector-backed public candidate dispatch and current-map preservation
provides:
  - Explicit candidate-only v1.19 kernel dispatch with entrant-validated initial initiative
  - Kernel-derived initial/current Round initiative observations for every selection request
  - Pre-Action scheduler-owned hasAdvancedThisActivation at both SoldierBrain call sites
  - Full v1.4 state/event/outcome/cleanup differential and refreshed integrity evidence
affects: [260-05, 260-06, 260-10, 260-14, runtime-service, four-language-conformance]

tech-stack:
  added: []
  patterns: [version-specific-candidate-dispatch, canonical-state-observation, pre-action-slot-fact, observation-only-differential]

key-files:
  created:
    - packages/engine/src/test/strategy-observations-v1-19.test.ts
    - packages/engine/src/test/compatibility-v1-4.test.ts
  modified:
    - packages/engine/src/types.ts
    - packages/engine/src/kernel/create-initial-state.ts
    - packages/engine/src/runtime-inputs.ts
    - packages/engine/src/kernel/step.ts
    - packages/engine/src/kernel/driver.ts
    - packages/engine/src/kernel/types.ts
    - packages/engine/src/kernel/validate.ts
    - packages/engine/src/public-surface.test.ts
    - packages/spec/artifacts/v1.37-current-event-coverage.json
    - .planning/artifacts/v1.37-kernel-integrity-proof.json
    - .planning/artifacts/v1.37-kernel-integrity-proof.md
    - .planning/artifacts/v1.37-phase-257-browser-playwright.json

key-decisions:
  - "Keep v1.19 execution behind explicit candidate-only match and activation entry points until Plan 14; current and v1.17 dispatch remain Phase-259 exact."
  - "Store initial initiative only on successor state while retaining initiativePlayerId as the canonical current-Round owner."
  - "Pass slot.advanced directly to both SoldierBrain input constructions before the requested Action and bind the fact into v1.19 request identity."
  - "Treat initial/current initiative and slot Advance fields as observations only; preserve Action, lifecycle, cleanup, Backstab, terminal, event, and outcome behavior."

patterns-established:
  - "Candidate observation dispatch: exact v1.19 entry points validate successor-only state before yielding runtime effects."
  - "Historical preservation: seed-derived initial initiative and old input shapes exist only on v1.17/historical dispatch."

requirements-completed: [STRAT-01, STRAT-02, STRAT-03, STRAT-04, SET-05]

coverage:
  - id: D1
    description: "The kernel owns explicit initial and current-Round initiative and derives absolute plus observer-relative Strategy observations under v1.19 candidate dispatch."
    requirement: STRAT-01
    verification:
      - kind: unit
        ref: "packages/engine/src/test/strategy-observations-v1-19.test.ts#successor Strategy observations"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every v1.19 SoldierBrain call receives the authoritative pre-Action slot Advance fact across TURN, blocked actions, successful push, pushed-target isolation, persistence, and slot reset."
    requirement: STRAT-02
    verification:
      - kind: unit
        ref: "packages/engine/src/test/strategy-observations-v1-19.test.ts#successor SoldierBrain observations"
        status: pass
    human_judgment: false
  - id: D3
    description: "The successor observation fields are the only semantic delta; valid v1.4 state, Action legality, events, cleanup, Backstab, terminal behavior, outcome, and historical observations remain exact."
    requirement: SET-05
    verification:
      - kind: integration
        ref: "packages/engine/src/test/compatibility-v1-4.test.ts#v1.19 observation-only v1.4 preservation"
        status: pass
      - kind: integration
        ref: "pnpm --filter @cowards/engine test && pnpm v1.37:kernel-integrity:check"
        status: pass
    human_judgment: false

duration: 17min
completed: 2026-07-17
status: complete
---

# Phase 260 Plan 03: Successor Kernel Observation Summary

**Candidate-only v1.19 kernel dispatch now derives initiative and pre-Action Advance observations from canonical state while preserving every valid v1.4 gameplay and historical-dispatch behavior.**

## Performance

- **Duration:** 17 min
- **Started:** 2026-07-17T03:24:55Z
- **Completed:** 2026-07-17T03:42:13Z
- **Tasks:** 3
- **Files modified:** 14

## Accomplishments

- Added explicit v1.19 Match and Activation kernel entry points that require an entrant-owned initial initiative, retain it across Rounds, flip only current initiative, and reject malformed successor state before runtime effects.
- Added complete D-05 through D-07 truth-table coverage and passed `slot.advanced` to both SoldierBrain construction sites before Action resolution; successful actor displacement is monotonic within a slot and resets for each new slot.
- Proved D-08 with a successor/v1.17 differential and the frozen 20-fixture v1.4 corpus: only the approved private observations differ, with no Action, state, event, cleanup, Backstab, terminal, outcome, HOLD, or historical observation drift.
- Refreshed exact current-event coverage and browser-backed kernel-integrity evidence after the deliberate additive candidate surface change.

## Task Commits

1. **Task 1 RED: Initiative observation contract** - `f92fb39`
2. **Task 1 GREEN: Successor initiative derivation** - `5530c07`
3. **Task 2 RED: Slot Advance truth table** - `88a2282`
4. **Task 2 GREEN: Pre-Action slot observation** - `baef3a7`
5. **Task 3: v1.4 compatibility differential** - `c31fc9d`

## Files Created/Modified

- `packages/engine/src/test/strategy-observations-v1-19.test.ts` - Initiative consistency, Round flip, observer swap, dispatch fence, and complete slot Advance truth table.
- `packages/engine/src/test/compatibility-v1-4.test.ts` - Successor-only observation differential against v1.17 state/event/cleanup/terminal/outcome behavior and locked historical corpus.
- `packages/engine/src/kernel/create-initial-state.ts` - Separate seed-derived v1.17 and explicit entrant-validated v1.19 initial-state construction.
- `packages/engine/src/runtime-inputs.ts` - Sole engine-owned v1.19 Strategy and SoldierBrain observation construction.
- `packages/engine/src/kernel/step.ts` - Canonical-state selection inputs and explicit pre-Action `slot.advanced` at observation and effect call sites.
- `packages/engine/src/kernel/driver.ts`, `kernel/types.ts`, `kernel/validate.ts` - Exact candidate-only v1.19 dispatch, tuple admission, state validation, and request identity binding.
- `packages/engine/src/types.ts` - Successor initial-state input and immutable optional successor state fact without changing historical state shape.
- `packages/engine/src/public-surface.test.ts` - Exact additive candidate dispatch surface.
- Current event coverage and kernel-integrity artifacts - regenerated through their official write/check paths.

## Decisions Made

- The v1.19 kernel path is explicit and candidate-only. Generic/current and v1.17 entry points remain on the complete Phase-259 authority until the atomic Plan 14 activation.
- Initial initiative is stored as successor state, while `initiativePlayerId` remains the current-Round scheduling authority. Round transitions change only the current owner.
- `hasAdvancedThisActivation` is sourced only from `ActivationSlotState.advanced`; neither adapters, events, position diffs, StrategyMemory, nor SoldierMemory derive it.
- The observation is bound into both owner observation evidence and the candidate effect-request identity, but it does not participate in Action resolution or slot closure decisions.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added explicit v1.19 kernel dispatch and tuple admission**
- **Found during:** Task 1 GREEN
- **Issue:** The listed files could construct successor observations but had no exact candidate kernel entry point capable of selecting the inactive v1.19 tuple without changing current dispatch.
- **Fix:** Added version-specific match/activation constructors and runners plus tuple/state validation in `kernel/driver.ts`, `kernel/types.ts`, and `kernel/validate.ts`.
- **Verification:** Wrong/missing initial initiative fails before runtime start; v1.17 observations remain old-shape; full engine suite passes.
- **Committed in:** `5530c07`, `baef3a7`

**2. [Rule 3 - Blocking] Refreshed generated current-event and kernel-integrity evidence**
- **Found during:** Task 3 verification
- **Issue:** The deliberate additive candidate surface and new event-producing tests made the exact current-event manifest and kernel source hashes stale, causing the required integrity check to fail closed.
- **Fix:** Regenerated current event coverage, reran the browser-backed kernel proof official write path, and updated the exact public-surface snapshot.
- **Verification:** `pnpm v1.37:integrity-boundaries:check`, `pnpm v1.37:kernel-integrity:write`, and `pnpm v1.37:kernel-integrity:check` pass.
- **Committed in:** `c31fc9d`

---

**Total deviations:** 2 auto-fixed (1 missing critical functionality, 1 blocking generated-proof refresh).
**Impact on plan:** Both changes were required to keep successor dispatch explicit and the repository's exact integrity gates current; neither expands gameplay semantics or activates v1.19.

## Issues Encountered

- The first kernel-integrity write attempt failed because current event coverage was intentionally stale after the new candidate tests. Regenerating that prerequisite through its official generator cleared the gate; no expectation or historical artifact was manually edited.

## User Setup Required

None - no external service configuration required.

## Verification

- Focused observation/adapter/compatibility suite: 3 files, 12 tests passed.
- Full engine suite: 19 files, 147 tests passed.
- `pnpm --filter @cowards/engine typecheck`: passed.
- `pnpm --filter @cowards/engine lint`: passed.
- `pnpm v1.37:kernel-integrity:check`: passed.
- Protected baseline: passed at `sha256:c0e1c2a6319f01377df74a2d6e5c493d26382f2882c059116c5ba467e5e81707`.
- Stub and threat-surface scans: no placeholder implementation and no new network, auth, filesystem, database, public-output, or Strategy-execution surface.

## TDD Gate Compliance

- Task 1 RED `f92fb39` precedes GREEN `5530c07`.
- Task 2 RED `88a2282` precedes GREEN `baef3a7`.
- Both RED gates failed on the absent version-specific behavior, and both GREEN gates pass focused tests, typecheck, lint, and the full engine matrix.

## Next Phase Readiness

- Plan 260-10 can transport exact signed v1.19 inputs without deriving initiative or Advance state.
- Plans 260-05 and 260-06 can pass explicit initial initiative from canonical four-condition scheduling.
- Plan 260-14 remains the sole owner of activating v1.19; current runtime, map, tuple, certificate, and historical dispatch remain Phase-259 exact.
- The pre-existing user modifications to `.planning/config.json` and `CowardsGameSpec_Full_Consolidated_v1.md` remain untouched and uncommitted.

## Self-Check: PASSED

- Both declared test artifacts and every modified source/proof file exist.
- All five task commits are present in order with no deletions.
- All plan-level focused, full-engine, typecheck, lint, integrity, and protected-baseline gates pass.

---
*Phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness*
*Completed: 2026-07-17*
