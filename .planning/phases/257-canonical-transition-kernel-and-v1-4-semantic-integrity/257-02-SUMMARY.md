---
phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
plan: "02"
subsystem: testing
tags: [engine, lifecycle, activation-order, compatibility, red-regressions]
requires:
  - phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
    provides: exact pre-refactor identity and marker-qualified kernel RED baseline from Plan 01
provides:
  - Exact no-Advance final-Soldier state, event, closure, and outcome RED contract
  - Exact Cycle-end Backstab slot closure and terminal ordering RED contract
  - Complete cap-before-validate activation-order prefix/suffix precedence matrix
affects: [257-09, kernel-lifecycle-repairs, activation-selection, compatibility-fixtures]
tech-stack:
  added: []
  patterns: [exact public-event projection, table-driven hostile-order matrix, expected-RED shell gate]
key-files:
  created:
    - packages/engine/src/lifecycle-repairs.test.ts
  modified:
    - packages/engine/src/activation.test.ts
key-decisions:
  - "No-Advance preserves the existing INVALID_MOVE slot reason and NO_ADVANCE status reason, then evaluates the final outcome immediately."
  - "Cycle-end Backstab emits the simultaneous scan effects and CYCLE_ENDED, closes the actor once as BACKSTABBED, then emits the sole MATCH_ENDED event."
  - "Any invalid retained order invalidates the selection as a player violation; ignored suffix entries are never parsed and cannot replace a retained entry."
patterns-established:
  - "Lifecycle RED: compare complete final GameState plus ordered event type, payload, and lifecycle context, not only event presence."
  - "Retained-prefix RED: cross every hostile classification inside and outside the literal quota and assert classification, memory, observation count, and retained order."
requirements-completed: [KERN-04, KERN-05, KERN-06, KERN-10, KERN-11]
coverage:
  - id: D1
    description: Final-Soldier no-Advance cleanup is frozen as status change, slot closure, immediate outcome, and exactly one final MATCH_ENDED event.
    requirement: KERN-04
    verification:
      - kind: unit
        ref: "packages/engine/src/lifecycle-repairs.test.ts#no-Advance cleanup closes the final Soldier slot before MATCH_ENDED (qualified expected RED)"
        status: pass
    human_judgment: false
  - id: D2
    description: Cycle-end Backstab is frozen as completed simultaneous effects, CYCLE_ENDED, one BACKSTABBED closure, and immediate outcome with no later event.
    requirement: KERN-05
    verification:
      - kind: unit
        ref: "packages/engine/src/lifecycle-repairs.test.ts#Cycle-end Backstab closes the removed actor as BACKSTABBED before outcome (qualified expected RED)"
        status: pass
    human_judgment: false
  - id: D3
    description: Activation orders are capped before retained-entry validation across valid, malformed, duplicate, unknown, wrong-owner, and inactive inside/outside cases.
    requirement: KERN-06
    verification:
      - kind: unit
        ref: "packages/engine/src/activation.test.ts#retained prefix matrix and packages/engine/src/lifecycle-repairs.test.ts#retained prefix (qualified expected RED)"
        status: pass
    human_judgment: false
  - id: D4
    description: Existing engine behavior remains unchanged while the three approved defect families are the only new RED failures.
    requirement: KERN-11
    verification:
      - kind: integration
        ref: "pnpm --filter @cowards/engine test: 53 preserved tests pass; only Plan 01 missing-authority and Plan 02 approved RED contracts fail"
        status: pass
    human_judgment: false
duration: 9min
completed: 2026-07-13
status: complete
---

# Phase 257 Plan 02: Lifecycle and Retained-Prefix RED Contracts Summary

**Exact state/event lifecycle contracts and a 12-case hostile activation-order matrix now constrain the three approved repairs without changing production semantics.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-07-13T14:51:54Z
- **Completed:** 2026-07-13T15:00:51Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Froze the final-Soldier no-Advance sequence through complete state, lifecycle coordinates, event payload/context order, runtime calls, terminal uniqueness, and absence of later scheduling.
- Froze Cycle-end Backstab as simultaneous Backstab effects followed by `CYCLE_ENDED`, one `ACTIVATION_ENDED(BACKSTABBED)`, immediate outcome, and no post-terminal event.
- Added the complete 12-case D-09 matrix covering every valid or hostile order classification inside and outside the retained prefix, including the no-replacement rule.

## Task Commits

Each task was committed atomically:

1. **Task 1: Freeze no-Advance and Cycle-end Backstab event order** - `64140e9` (test)
2. **Task 2: Freeze literal cap-then-validate precedence** - `cb10530` (test)

## Files Created/Modified

- `packages/engine/src/lifecycle-repairs.test.ts` - Exact lifecycle and focused malformed-excess expected-RED regressions.
- `packages/engine/src/activation.test.ts` - Full retained-prefix/suffix classification and observation matrix.

## Decisions Made

- The no-Advance fixture preserves the current immediate-reversal closure reason `INVALID_MOVE`; `NO_ADVANCE` remains the Soldier status-change reason. The approved change is the immediate outcome after closure.
- A retained semantic defect is a player violation for the complete selection, not a reason to keep a partial valid prefix or scan the suffix for a replacement.
- No current production source or valid v1.4 expectation changed. The observed failures match only D-09, D-10, and D-11, so no KERN-11 approval checkpoint was triggered.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

The complete engine run also reports Plan 257-01's intentional `[EXPECTED_RED:MISSING_KERNEL_AUTHORITY]` marker. Apart from that existing Wave-0 RED and this plan's three approved defect families, all 53 engine tests pass.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 257-09 has exact candidate-kernel GREEN targets for all three repairs.
- The protected `.planning/config.json` and `CowardsGameSpec_Full_Consolidated_v1.md` retain their pre-plan byte hashes.
- No valid Match state, Action legality, event order, outcome, terminal timing/reason, or Strategy observation outside the approved repair set changed.

## Self-Check: PASSED

- Both delivered test files and this summary exist.
- Task commits `64140e9` and `cb10530` are present.
- Focused expected-RED gates, engine typecheck, Prettier, and diff checks pass.

---
*Phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity*
*Completed: 2026-07-13*
