---
phase: 259-executable-four-language-and-chronicle-conformance
plan: "05"
subsystem: chronicle-grammar
tags: [chronicle, grammar, activation-slots, deterministic-validation]

requires:
  - phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
    provides: Canonical interleaved Activation scheduling and lifecycle event stream
provides:
  - Immutable per-Activation-slot current Chronicle grammar state
  - Exact open-Cycle boundary ownership and deterministic slot diagnostics
  - Copy-on-accept grammar transitions whose rejection preserves prior state
affects: [259-06, 259-14, chronicle-validation, replay-reconstruction]

tech-stack:
  added: []
  patterns:
    - Frozen sorted arrays at the public grammar boundary with internal Maps never serialized
    - Pure event advancement returning the identical prior state on rejection

key-files:
  created: []
  modified:
    - packages/replay/src/grammar.ts
    - packages/replay/src/grammar.test.ts

key-decisions:
  - "Each activationId owns independent actor, Soldier, Cycle, Advance, terminal, and close history."
  - "Exactly one global open-Cycle coordinate owns Cycle-bound events, while selected slots remain independently addressable."
  - "NO_ADVANCE stoning remains v1.4 Activation-close cleanup without a Cycle coordinate and cannot coexist with successful Advance history."

requirements-completed: [CHRN-01]

coverage:
  - id: D1
    description: "Interleaved Activation slots retain independent deterministic lifecycle state."
    requirement: CHRN-01
    verification:
      - kind: unit
        ref: "packages/replay/src/grammar.test.ts#tracks interleaved activation slots independently in deterministic frozen state"
        status: pass
      - kind: unit
        ref: "packages/replay/src/grammar.test.ts#rejects per-slot lifecycle corruption"
        status: pass
    human_judgment: false
  - id: D2
    description: "Rejected events do not partially advance grammar state."
    requirement: CHRN-01
    verification:
      - kind: unit
        ref: "packages/replay/src/grammar.test.ts#does not mutate grammar state when the first event is rejected"
        status: pass
    human_judgment: false

duration: 15min
completed: 2026-07-16
status: complete
---

# Phase 259 Plan 05: Per-Slot Chronicle Grammar Summary

**Current Chronicle grammar now validates every interleaved Activation slot independently through one immutable, deterministic state machine.**

## Performance

- **Duration:** 15 min
- **Completed:** 2026-07-16
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments

- Replaced the singleton Activation/Cycle cursor with frozen per-slot records tracking exact identity, next Cycle, successful Advance history, terminal reason, close state, and last accepted event.
- Added one exact open-Cycle coordinate with start, observation, and action-emitted boundaries.
- Added stable rejection coverage for duplicate lifecycle events, wrong actor/slot, skipped Cycles, after-close events, terminal mismatches, and Advance/no-Advance contradictions.
- Kept public diagnostics deterministic by returning sorted arrays and never exposing the internal Map.
- Made advancement copy-on-accept: a rejected event returns the identical prior state object.

## Task Commits

1. **RED: Specify per-slot lifecycle, boundary, and immutability behavior** — `14b30ce` (test)
2. **GREEN: Implement immutable per-slot Chronicle grammar** — `02a9a22` (feat)
3. **Proof refresh: Bind the current event-coverage artifact to the new grammar bytes** — `266020c` (test)

## Files Modified

- `packages/replay/src/grammar.ts` — Per-slot grammar state, exact boundary advancement, deterministic freezing, and stable validation errors.
- `packages/replay/src/grammar.test.ts` — Interleaving, mutation-family, rejection-immutability, and valid no-Advance cleanup coverage.

## Decisions Made

- Preserved `PUSH_ATTEMPTED` acceptance in this current grammar step until the historical/current vocabulary split in Plan 259-06 can separate it without changing old evidence.
- Preserved canonical v1.4 `NO_ADVANCE` cleanup as an Activation-close event without `cycleIndex`; successful Advance history still makes that reason invalid.
- Reset active Phase ownership after Contraction so the next Phase can establish its own exact coordinate.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Canonical no-Advance cleanup was initially treated as a Cycle-bound event**

- **Found during:** Wider replay validation after focused GREEN tests.
- **Issue:** The kernel emits `SOLDIER_STONED` with reason `NO_ADVANCE` from Activation closure, without `context.cycleIndex`. Requiring an open Cycle would reject valid v1.4 Cycle-exhaustion and player-violation closure evidence.
- **Fix:** Model `NO_ADVANCE` as self-Soldier Activation-close cleanup, reject an attached Cycle coordinate, and retain the successful-Advance contradiction check.
- **Verification:** Focused grammar tests passed 36/36; all replay tests passed 176/176 serially; Phase-257 compatibility/kernel tests passed 31/31.

**2. [Rule 3 - Blocking] Current event-coverage proof retained the pre-refactor grammar source hash**

- **Found during:** Combined Wave-1 replay proof.
- **Issue:** The event vocabulary and dispositions were unchanged, but the generated artifact still pinned the old `packages/replay/src/grammar.ts` bytes.
- **Fix:** Regenerated the current-only event-coverage artifact with the repository generator.
- **Verification:** Generator tests passed 4/4 and `--current --check` reported byte-exact current evidence.

---

**Total deviations:** 2 auto-fixed (1 compatibility bug, 1 derived-proof refresh).
**Impact on plan:** Both corrections preserve existing valid v1.4 event timing and add no gameplay, outcome, observation, vocabulary, or public/private projection change.

## Issues Encountered

- A package-wide Vitest run with default parallel workers exceeded the existing 5-second per-test limit on seven CPU-heavy fixtures. The same full 176-test package suite passed serially, confirming infrastructure contention rather than functional failures.

## User Setup Required

None.

## Next Phase Readiness

- Plan 259-06 can freeze the historical v1.4 interpreter while the stricter current grammar remains isolated.
- Plan 259-14 can consume exact per-slot/open-boundary state at each recorded transition ordinal.
- No valid v1.4 gameplay or historical evidence changed.

## Self-Check: PASSED

- RED commit `14b30ce` precedes GREEN commit `02a9a22`.
- Focused grammar tests passed 36/36.
- Replay typecheck, lint, and formatting checks passed.
- All replay tests passed 176/176 with one worker.
- Phase-257 compatibility and kernel-contract tests passed 31/31.
- Current event-coverage generator tests passed 4/4 and the persisted artifact is byte-exact.

---
*Phase: 259-executable-four-language-and-chronicle-conformance*
*Completed: 2026-07-16*
