---
phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
plan: "09"
subsystem: engine-kernel
tags: [activation-orders, lifecycle, backstab, terminal-order, compatibility]
requires:
  - phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
    provides: exact D-09 through D-11 RED contracts
  - phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
    provides: locked 20-scenario D-12 compatibility corpus
  - phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
    provides: pure candidate transition kernel and arbitrary-state Activation runner
provides:
  - Candidate-only literal cap-then-validate activation-order precedence
  - Immediate no-Advance terminal outcome after exact INVALID_MOVE closure
  - Cycle-end Backstab actor closure as BACKSTABBED before terminal outcome
  - Exact simultaneous Backstab-effect-before-closure regression proof
affects: [257-10, 257-13, 257-18, 257-19, activation-migration, replay]
tech-stack:
  added: []
  patterns: [retained-prefix validation, status-reread closure, closure-before-outcome]
key-files:
  created:
    - packages/engine/src/kernel/lifecycle-repairs.test.ts
  modified:
    - packages/engine/src/kernel/step.ts
    - packages/engine/src/types.ts
    - packages/engine/src/lifecycle-repairs.test.ts
key-decisions:
  - "The candidate slices raw orders to the round quota before schema parsing and validates every retained entry as shape-valid, unique, known, owned, and ACTIVE; any retained defect invalidates the whole selection."
  - "Cycle-end closure re-reads the actor after the simultaneous Backstab scan, emits all scan effects and CYCLE_ENDED, then emits one BACKSTABBED Activation closure before outcome."
  - "INVALID_MOVE no-Advance cleanup emits its status and Activation closure before checking the newly changed active count and emitting MATCH_ENDED."
  - "Active legacy Match and Activation behavior remains staged-old until Plans 18/19; candidate tests are the GREEN authority for D-09 through D-11."
patterns-established:
  - "Candidate delta proof: repaired semantics are tested through candidate machine/driver APIs while legacy callers retain explicit pre-activation observations."
  - "Terminal ordering: causal action/status events, CYCLE_ENDED, ACTIVATION_ENDED, outcome/MATCH_ENDED, then no further scheduling."
requirements-completed: [KERN-04, KERN-05, KERN-06, KERN-10, KERN-11]
coverage:
  - id: D1
    description: All twelve valid/malformed/duplicate/unknown/wrong-owner/inactive inside/outside cases obey literal cap-then-validate semantics in the candidate kernel.
    requirement: KERN-06
    verification:
      - kind: unit
        ref: "packages/engine/src/kernel/lifecycle-repairs.test.ts#retained prefix 12-case matrix"
        status: pass
    human_judgment: false
  - id: D2
    description: Final-Soldier no-Advance cleanup emits INVALID_MOVE closure before exactly one immediate terminal event.
    requirement: KERN-04
    verification:
      - kind: unit
        ref: "packages/engine/src/kernel/lifecycle-repairs.test.ts#closes a no-Advance invalid move before evaluating the immediate outcome"
        status: pass
    human_judgment: false
  - id: D3
    description: Cycle-end Backstab emits every simultaneous effect, CYCLE_ENDED, one BACKSTABBED closure, and only then terminal outcome.
    requirement: KERN-05
    verification:
      - kind: unit
        ref: "packages/engine/src/kernel/lifecycle-repairs.test.ts#Cycle-end Backstabbed actor and simultaneous effect tests"
        status: pass
    human_judgment: false
  - id: D4
    description: D-12 Match state, event, runtime, memory, objective, collision, movement, Backstab, and terminal observations remain unchanged.
    requirement: KERN-11
    verification:
      - kind: integration
        ref: "packages/engine/src/compatibility-fixtures.test.ts"
        status: pass
      - kind: integration
        ref: "focused kernel, lifecycle, Backstab, compatibility, Match contract run: 53/53 passed"
        status: pass
    human_judgment: false
duration: 10min
completed: 2026-07-13
status: complete
---

# Phase 257 Plan 09: Candidate Lifecycle Repairs Summary

**The candidate kernel now applies literal retained-prefix precedence and closes no-Advance and Cycle-end Backstab Activations before evaluating terminal outcomes, with all D-12 observations preserved.**

## Performance

- **Duration:** 10 min
- **Completed:** 2026-07-13
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Implemented the complete D-09 rule: slice raw orders to quota first, validate all retained shape/identity/ownership/status/uniqueness, invalidate the whole retained selection on any defect, and never inspect or backfill from the suffix.
- Implemented D-11 as exact `MOVE_BLOCKED` → `CYCLE_ENDED` → `SOLDIER_STONED(NO_ADVANCE)` → `ACTIVATION_ENDED(INVALID_MOVE)` → `MATCH_ENDED` ordering.
- Implemented D-10 by re-reading actor status after simultaneous Cycle-end Backstab, emitting every scan effect before `CYCLE_ENDED`, closing the actor once as `BACKSTABBED`, then evaluating outcome.
- Added an explicit simultaneous two-victim kernel regression and preserved Cycle-start scans, collision distinctions, push behavior, reversal history, and the absence of HOLD/END_ACTIVATION.
- Kept active `runMatch`, selection, and Activation runtime behavior unchanged until their owned migration plans.

## Task Commits

1. **Candidate RED: Lock D-09 through D-11 contracts** - `efc6f70`
2. **Task 1 GREEN: Enforce retained-prefix precedence** - `844e303`
3. **Task 2 GREEN: Order terminal Activation closure** - `efeabe4`
4. **Task 2 regression: Cover simultaneous Backstab closure** - `3bc5fd3`

## Files Created/Modified

- `packages/engine/src/kernel/lifecycle-repairs.test.ts` - Candidate 12-case order matrix and exact D-10/D-11 state/event regressions.
- `packages/engine/src/kernel/step.ts` - Candidate retained-order parser and closure-before-outcome logic.
- `packages/engine/src/types.ts` - Adds the candidate-visible `BACKSTABBED` Activation terminal reason.
- `packages/engine/src/lifecycle-repairs.test.ts` - Explicit staged-old assertions for legacy callers pending Plan 18 migration.

## Decisions Made

- Strategy memory commits only when the retained prefix is fully valid. A retained semantic defect remains a player violation with empty orders and unchanged memory; canonical machine invalidity remains a system failure.
- A malformed ignored suffix is never schema-parsed. This is deliberately different from the active legacy whole-result parser and is confined to the candidate path.
- Cycle-end Backstab actor removal is identified by comparing actor ACTIVE status immediately before and after the simultaneous scan, not by reimplementing Backstab geometry or interpreting event payloads.
- Other terminal causes retain their existing candidate behavior. The additional post-closure outcome check is limited to the approved `INVALID_MOVE` no-Advance change; the Backstab-specific path is limited to an actor removed by that scan.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Correctness] Kept repairs in the existing transition authority instead of creating a detached helper**

- **Found during:** Task 1 implementation
- **Issue:** The original manifest named `kernel/lifecycle-repairs.ts`, but creating standalone helpers would duplicate or detach lifecycle ownership from the pure reducer.
- **Fix:** Implemented both narrow repairs directly in `kernel/step.ts` and used one candidate test file; no dead lifecycle helper was created.
- **Verification:** Candidate 15/15 and focused cross-suite 53/53 pass; forbidden legacy Match loops remain absent from the kernel.
- **Committed in:** `844e303`, `efeabe4`

**2. [Rule 3 - Blocking] Converted legacy lifecycle RED expectations to explicit staged-old observations**

- **Found during:** Task 2 cross-suite verification
- **Issue:** Active legacy callers must remain unchanged until Plans 18/19, so asserting candidate behavior through them would leave the Plan 09 focused gate falsely RED or force an early activation.
- **Fix:** Candidate tests remain the GREEN repair authority; legacy lifecycle tests assert their actual pre-activation event/state observations without changing production code.
- **Verification:** Legacy lifecycle tests pass 3/3 while active `activation.ts` and `match.ts` retain zero diff.
- **Committed in:** `efeabe4`

---

**Total deviations:** 2 auto-fixed (1 correctness, 1 blocking staged-migration repair)
**Impact on plan:** No scope expansion or unapproved gameplay change. The implementation follows the corrected candidate-only activation boundary.

## Issues Encountered

- A first simultaneous-scan fixture placed the second victim in a relationship already reachable at Cycle start, correctly proving the preserved Cycle-start scan. The final regression initializes the pure response boundary directly so it tests simultaneous Cycle-end composition without suppressing or changing Cycle-start behavior.
- The broad engine run is **101 passed, 5 intentional legacy D-09 RED assertions** in `activation.test.ts`. Those five still invoke the active old selection path and remain for Plan 18 migration. D-10 and D-11 contribute no remaining broad failure, and there are no unrelated failures.

## Verification

- Candidate lifecycle repair suite: **15/15 passed**, including the complete twelve-case retained-prefix matrix.
- Kernel lifecycle, legacy lifecycle, Backstab, compatibility, kernel contract, and Match suites: **53/53 passed**.
- Complete locked v1.4 compatibility corpus passes with no D-12 drift.
- Broad engine suite: **101 passed; 5 intentional staged-old D-09 assertions fail; 0 unrelated failures**.
- Engine typecheck and package lint: passed.
- Plan 11 reference inventory: **12/12 passed**; baseline remains exactly **69 executable references and 13 non-executable mentions**.
- Active `packages/engine/src/activation.ts` and `packages/engine/src/match.ts`: no diff.
- Current `packages/spec/src/versions.ts` remains `98ac9b63482c0a392694551db9a5de2443aa3119f62387316457f03d64341821`.
- Targeted Prettier, ESLint, and diff checks pass.

## Protected Working Bytes

- `.planning/config.json` remains `a9502647c42da6e83564e56e35833a66d2daad6704f2ac2a2d98cf12cc953f7b`.
- `CowardsGameSpec_Full_Consolidated_v1.md` remains `01b0a95c79e2ba5e8a089abe7106856e7f081bb10193d5ab8e86171f6ee0fa46`.
- Neither protected file was staged or modified by this plan.

## User Setup Required

None.

## Next Phase Readiness

- Chronicle/replay plans can rely on exact causal status, Activation closure, and terminal event order from one candidate transition record.
- Plan 18 can migrate remaining legacy Activation tests/callers to the candidate seam and retire the stale public helper.
- Plan 19 remains the only owner of activating candidate Match execution and eliminating the five staged legacy D-09 RED assertions.

## Self-Check: PASSED

- All four implementation/test commits and the created candidate repair suite exist.
- D-09 through D-11 candidate behavior is green; D-12 compatibility is unchanged.
- Reference inventory, protected bytes, active authority sources, and current tuple bytes remain unchanged.
- Only the two protected pre-existing dirty files remain unstaged before this summary commit.

---

_Phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity_
_Completed: 2026-07-13_
