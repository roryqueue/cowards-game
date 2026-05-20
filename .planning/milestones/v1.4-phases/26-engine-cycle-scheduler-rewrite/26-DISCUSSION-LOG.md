# Phase 26: Engine Cycle Scheduler Rewrite - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-20
**Phase:** 26-Engine Cycle Scheduler Rewrite
**Areas discussed:** Scheduler Structure, Activation State and Skip Semantics, Backstab Integration Timing, Failure and No-Advance Outcomes, Engine Test Contract

---

## Scheduler Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Round-level scheduler owns it | Make `resolveRound` or a new Round scheduler own Cycle-layer iteration across all selected slots, while extracting reusable single-Cycle helpers. | ✓ |
| Rewrite `resolveActivation` to be resumable | Turn `resolveActivation` into an Activation-state stepper and have Round call it repeatedly. | |
| New scheduler, old wrapper | Add a new Cycle scheduler for v1.4 behavior and keep `resolveActivation` as a compatibility helper. | |

**User's choice:** Round-level scheduler owns it.
**Notes:** The user also chose aggressive renaming away from stale full-Activation semantics, retiring `resolveActivation` from the core path, and moving engine transition summaries to Cycle-oriented semantics in Phase 26.

---

## Activation State and Skip Semantics

| Option | Description | Selected |
|--------|-------------|----------|
| Full explicit slot state | Track slot id/order, player id, Soldier id, objective, cycle index, advanced flag, ended flag, terminal reason, last produced memory state, and cleanup state. | ✓ |
| Minimal slot state | Track only Soldier id, objective, cycle index, advanced flag, and ended flag. | |
| Event-driven state | Avoid explicit slot state and reconstruct status from emitted events/current GameState. | |

**User's choice:** Full explicit slot state.
**Notes:** The user selected always emitting skip events for ended slots, no-Advance cleanup exactly once at slot end, off-turn STONE/FALLEN closing at the next Cycle-start opportunity, and memory writes only after valid SoldierBrain output.

---

## Backstab Integration Timing

| Option | Description | Selected |
|--------|-------------|----------|
| Boundary, input, action, boundary | Cycle-start Backstab, match-end, ACTIVE check, SoldierBrain input, valid memory write, Action, Cycle-end Backstab, match-end, then slot advance/close. | ✓ |
| Input before start boundary | Build input from pre-boundary state, then resolve Cycle-start Backstab before Action. | |
| Action then all boundaries | Run SoldierBrain/Action first, then resolve boundaries as cleanup. | |

**User's choice:** Boundary, input, action, boundary.
**Notes:** The user selected no Cycle-start boundary for ended slots, Cycle-start only for non-ended currently ACTIVE Soldiers, immediate match interruption at Cycle-start or Cycle-end, and replacing engine boundary names with `cycle-start` / `cycle-end`.

---

## Failure and No-Advance Outcomes

| Option | Description | Selected |
|--------|-------------|----------|
| Slot-local terminal failure | Runtime violations and invalid output terminate only the selected slot, then other slots continue unless match-end occurs. | ✓ |
| Round-ending failure | Runtime violation or invalid output ends the entire Round. | |
| Match-losing failure | Strategy failure immediately loses the Match. | |

**User's choice:** Slot-local terminal failure.
**Notes:** The user changed the v1.4 rule for blocked MOVE/PUSH: blocked MOVE/PUSH consumes the Cycle, is non-terminal, and does not count as Advance. Schema-invalid/impossible Actions remain terminal. TURN_TO_STONE is slot-local terminal. Exhaustion happens after 12 valid Cycle opportunities. Terminal Action no-Advance cleanup runs after Cycle-end Backstab and match-end if the Match continues. Runtime violations skip Cycle-end; schema-valid but impossible Actions get Cycle-end before cleanup.

---

## Engine Test Contract

| Option | Description | Selected |
|--------|-------------|----------|
| Trace exact interleaving | Assert a Round 3 trace repeats `P1S1 -> P2S1 -> P2S2 -> P1S2 -> P1S3 -> P2S3` by Cycle layer. | ✓ |
| Round 2 only | Assert only the smaller `A -> B -> B -> A` order repeats by Cycle layer. | |
| Property-style only | Test invariants without hardcoding specific traces. | |

**User's choice:** Trace exact interleaving.
**Notes:** The user selected full skip/memory matrix, Backstab boundary matrix, terminal reason matrix, and focused invariant/property-style tests for determinism, 12-Cycle caps, ended-slot calls, memory writes, and event payload sanity.

---

## the agent's Discretion

- The planner may choose exact helper/type names if canonical terminology stays clean.
- The planner may choose exact skip event privacy/projection semantics for engine summaries, with Chronicle/public projection finalized in Phase 27.

## Deferred Ideas

- Chronicle/replay grammar migration is Phase 27.
- Starter Strategy retuning is Phase 28.
- Demo evidence regeneration is Phase 29.
