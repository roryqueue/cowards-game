# Phase 26 Research: Engine Cycle Scheduler Rewrite

## Findings

- `packages/engine/src/match.ts` owned the old production sequencing by walking
  selected orders and resolving each whole Activation before moving to the next
  selected Soldier.
- `packages/engine/src/activation.ts` already contained most of the reusable
  pieces needed for a slot-step scheduler: selection filtering, SoldierBrain
  input creation, runtime violation handling, action resolution, memory writes,
  no-Advance cleanup, and Backstab calls.
- `packages/engine/src/movement.ts` made blocked movement terminal, which
  contradicted the v1.4 decision that blocked MOVE/PUSH consumes only the Cycle
  and remains non-terminal.
- Backstab was still wired as Activation-start, post-Advance, and Activation-end
  behavior. v1.4 requires start/end checks around each Cycle opportunity.

## Implementation Risks

- Slot-local failures must not stop other selected slots unless the Match has
  actually ended.
- No-Advance cleanup must happen exactly once when a slot closes.
- Memory writes must only occur after a valid SoldierBrain result.
- Ended slots must be explainable via skip events without re-running runtime
  code or Backstab checks.

