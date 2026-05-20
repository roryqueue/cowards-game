# Phase 26: Engine Cycle Scheduler Rewrite - Context

**Gathered:** 2026-05-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 26 rewrites the pure rules engine scheduler so selected Soldier slots execute by Cycle layer across the Round snake order instead of resolving one full Activation before the next selected Soldier acts. It owns engine behavior, transition summaries, Backstab boundary naming, slot state, terminal handling, and focused engine tests for the corrected `cowards-rules-v1.4` contract.

This phase does not fully settle Chronicle grammar/replay compatibility, regenerate replay fixtures, retune starter Strategies, update public replay UI, or rebuild demo ladder evidence. Those are later phases. Phase 26 may emit Cycle-oriented engine transition summaries now so Phase 27 has the correct event source to rebaseline.

</domain>

<decisions>
## Implementation Decisions

### Scheduler Structure
- **D-01:** Round-level scheduling owns Cycle-layer iteration across all selected slots.
- **D-02:** Extract reusable single-Cycle or slot-step helpers from the current `resolveActivation` logic, but do not keep full-Activation sequencing in the core path.
- **D-03:** Rename aggressively where old names imply full-Activation sequencing. Stable high-level names such as `resolveRound` may remain, but internals should use corrected terms such as slot, Cycle, Cycle layer, and scheduler.
- **D-04:** Retire `resolveActivation` from production Round/Match execution. Any remaining test-only helper must not imply that production still resolves a full Activation contiguously.
- **D-05:** Engine transition summaries should move to Cycle-oriented semantics in Phase 26. Chronicle schema/replay compatibility for old `ACTIVATION_*` assumptions is Phase 27's job.

### Activation Slot State and Skip Semantics
- **D-06:** Track full explicit state for each selected slot: slot id/order, player id, Soldier id, objective, current cycle index, advanced flag, ended flag, terminal reason, last produced memory state, and whether end cleanup has run.
- **D-07:** Emit a skip event every time an ended selected slot is skipped in a later Cycle layer so replay timelines can show the missing opportunity.
- **D-08:** Skipped slots must not call SoldierBrain, must not write SoldierMemory, must not resolve Actions, and must not repeat no-Advance cleanup.
- **D-09:** No-Advance stoning runs exactly once when the selected slot ends, unless the Soldier is FALLEN. It never repeats during later skipped layers.
- **D-10:** If a selected Soldier becomes STONE or FALLEN due to another slot's Action or Backstab before its next opportunity, its slot ends at its next Cycle-start opportunity before SoldierBrain input, after applicable boundary/match-end handling.
- **D-11:** SoldierMemory writes only after a schema-valid SoldierBrain result for that slot's current Cycle. Skips, runtime violations, invalid output, and off-turn termination do not write memory.

### Backstab Integration Timing
- **D-12:** Each non-ended, currently ACTIVE slot opportunity runs in this order: Cycle-start Backstab, match-end check, acting Soldier ACTIVE check, SoldierBrain input, valid memory write, Action resolution, Cycle-end Backstab, match-end check, then slot advance or close.
- **D-13:** Already-ended slots skip before Cycle-start Backstab. They emit the selected skip event but do not run Backstab boundaries for the skipped opportunity.
- **D-14:** Cycle-start Backstab runs only for non-ended slots whose selected Soldier is currently ACTIVE. It does not run for already-ended slots or for selected Soldiers already STONE/FALLEN before their opportunity.
- **D-15:** If Cycle-start Backstab ends the Match before input, emit Backstab and match-end events and stop the Round/Match immediately with no SoldierBrain input and no extra slot cleanup beyond accurate interrupted state/events.
- **D-16:** If Cycle-end Backstab ends the Match after a valid Action, preserve the valid Action and memory effects, emit Cycle-end Backstab and match-end, then stop the Round/Match immediately.
- **D-17:** Replace engine Backstab boundary vocabulary with `cycle-start` and `cycle-end` in Phase 26. Phase 27 handles compatibility for old Chronicle boundary names such as `activation-start`, `activation-end`, and `post-advance`.

### Failure and No-Advance Outcomes
- **D-18:** Runtime violations and invalid SoldierBrain output are slot-local terminal failures: emit the violation, run no-Advance cleanup once if applicable, mark that slot ended, then continue other selected slots unless match-end occurs.
- **D-19:** Blocked MOVE/PUSH is non-terminal in v1.4. It consumes the current Cycle opportunity, does not count as Advance, receives normal Cycle-end Backstab handling, and leaves the selected slot alive for later Cycle layers.
- **D-20:** Schema-invalid output and schema-valid but impossible Actions remain terminal. Impossible Actions get Cycle-end Backstab before terminal cleanup; runtime violations skip Cycle-end because no valid Action resolved.
- **D-21:** TURN_TO_STONE is a slot-local voluntary terminal Action. It stones the Soldier, ends the selected slot immediately, and later layers emit skip events.
- **D-22:** A slot ends with terminal reason `CYCLE_EXHAUSTED` after completing its 12th valid Cycle opportunity. If it never Advanced and is still ACTIVE, no-Advance stoning runs once.
- **D-23:** For terminal Actions that produce a valid Action resolution, no-Advance cleanup runs after Cycle-end Backstab and match-end checks, if the Match continues.
- **D-24:** FALLEN remains an exception to no-Advance stoning.
- **D-25:** Other selected slots continue after slot-local failure unless a match-end condition interrupts the Round.

### Engine Test Contract
- **D-26:** Ordering tests must trace exact Round 3 interleaving, including Cycle 1 and Cycle 2 repetitions of `P1S1 -> P2S1 -> P2S2 -> P1S2 -> P1S3 -> P2S3`.
- **D-27:** Skip and memory tests must cover early terminal slots, off-turn STONE/FALLEN, skip event emission in later layers, no extra SoldierBrain calls, no memory writes on skips, and no duplicate no-Advance cleanup.
- **D-28:** Backstab tests must cover Cycle-start before input, Cycle-end after every schema-valid Action, simultaneous all-board victims, no boundary for already-ended skips, immediate match-end interruption at start/end, and no extra post-Advance boundary.
- **D-29:** Failure/no-Advance tests must cover runtime violation, invalid output, invalid/impossible Action, blocked MOVE/PUSH non-terminal behavior, TURN_TO_STONE, FALLEN, 12-Cycle exhaustion, no-Advance stoning once, and successful Advance exemption.
- **D-30:** Add focused invariant/property-style tests proving determinism, selected slots never exceed 12 valid Cycles, ended slots never call SoldierBrain again, memory writes only follow valid outputs, and public/private event payload constraints remain sane.

### the agent's Discretion
- The planner may choose exact helper/type names as long as they avoid stale full-Activation semantics and align with canonical terminology.
- The planner may decide whether skip events are public, owner, or private transition summaries in Phase 26, with Phase 27 settling Chronicle projection compatibility.
- The planner may choose exact terminal reason enum names if they preserve the distinctions above.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning and Rule Contract
- `.planning/PROJECT.md` — engine purity, determinism, canonical terminology, runtime boundary, and v1.4 rule-correction constraints.
- `.planning/REQUIREMENTS.md` — ENGINE-01 through ENGINE-08 define Phase 26 requirements.
- `.planning/ROADMAP.md` — Phase 26 goal, success criteria, and notes.
- `.planning/STATE.md` — active milestone state and accumulated v1.4 intent.
- `.planning/milestones/v1.4-phases/25-rule-source-of-truth-version/25-CONTEXT.md` — locked v1.4 source-of-truth decisions, including Cycle interleaving, Backstab boundary vocabulary, and blocked MOVE/PUSH non-terminal amendment.
- `CowardsGameSpec_Full_Consolidated_v1.md` — historical source to supersede; useful for identifying old semantics that must not survive.
- `.planning/spec-amendments/02-backstab-rule.md` — historical Backstab amendment superseded by Cycle-start/Cycle-end semantics.

### Engine Surfaces
- `packages/engine/src/match.ts` — current `resolveRound` walks selected orders and calls `resolveActivation` contiguously; this is the primary scheduler rewrite surface.
- `packages/engine/src/activation.ts` — current full-Activation resolver, selection filtering, Round player order, runtime call, memory write, no-Advance cleanup, and start/end Backstab behavior.
- `packages/engine/src/movement.ts` — current Action resolution, blocked movement terminal reasons, and embedded `post-advance` Backstab behavior.
- `packages/engine/src/backstab.ts` — simultaneous Backstab pair detection/resolution to keep while renaming boundaries and changing callers.
- `packages/engine/src/types.ts` — Backstab boundary enum, terminal reasons, transition summaries, runtime interface, and future slot-state types.
- `packages/engine/src/runtime-inputs.ts` — StrategyInput and SoldierBrainInput construction; must produce fresh Cycle input after Cycle-start boundary.
- `packages/engine/src/outcome.ts` — match-end checks after Cycle boundaries and terminal actions.
- `packages/engine/src/state.ts` — initial GameState shape and version propagation.

### Tests and Downstream Consumers
- `packages/engine/src/activation.test.ts` — current activation selection/runtime/no-Advance tests to replace or reframe.
- `packages/engine/src/backstab.test.ts` — current activation-boundary Backstab tests to convert to Cycle-boundary matrix.
- `packages/engine/src/match.test.ts` — current match/round event ordering expectations to update.
- `packages/engine/src/movement.test.ts` — blocked MOVE/PUSH and invalid movement expectations to update for v1.4.
- `packages/replay/src/build.ts` — current Chronicle builder mirrors old full-Activation engine loop; Phase 27 consumes Phase 26 event changes.
- `packages/replay/src/grammar.ts` — current one-active-Activation assumptions; useful context but not Phase 26's primary write scope.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `resolveActivationSelection` already filters duplicate, inactive, FALLEN, and excess orders and can likely remain part of Round setup.
- `getRoundPlayerOrder` already produces the snake slot order per activation count; Phase 26 can reuse the order but apply it per Cycle layer.
- `resolveBackstabBoundary` already uses simultaneous all-board ACTIVE snapshot semantics.
- `resolveAction` centralizes Action resolution and terminal reasons; it is the right place to revise blocked MOVE/PUSH terminal behavior and remove embedded `post-advance` Backstab.
- `createSoldierBrainInput` already builds fresh limited visibility input from current state, which fits Cycle-interleaved observation.

### Established Patterns
- Engine functions return pure `TransitionResult` values with event summaries and next state.
- Runtime Strategy calls return schema-validated success or classified RuntimeViolation; engine should keep this boundary.
- No-Advance cleanup currently happens at the end of contiguous `resolveActivation`; Phase 26 must move it to selected slot close.
- Match-end checks already return state/events and should remain explicit after boundaries.

### Integration Points
- `resolveRound` should become the main Cycle-layer scheduler.
- Existing full-Activation `resolveActivation` tests need either removal or reframing around Cycle-slot helpers.
- Backstab boundary enum and event payloads must switch to `cycle-start`/`cycle-end` for engine summaries.
- Replay/Chronicle builders will lag until Phase 27; Phase 26 should avoid bending engine behavior to preserve old Chronicle assumptions.

</code_context>

<specifics>
## Specific Ideas

- A slot-state type should make cleanup idempotence obvious, probably with an explicit `cleanupApplied` or equivalent field.
- Skip events are intentionally visible every later layer, because replay needs to explain why a selected Soldier no longer acts.
- The movement change is deliberate: blocked MOVE/PUSH should feel like tactical friction that costs a Cycle, not an immediate selected-slot death.
- `post-advance` Backstab should disappear from engine code in this phase.

</specifics>

<deferred>
## Deferred Ideas

- Full Chronicle grammar migration for interleaved open slots belongs to Phase 27.
- Replay UI timeline/inspector language belongs to Phase 27.
- Starter Strategy retuning for blocked-move and interleaved timing belongs to Phase 28.
- Demo evidence regeneration belongs to Phase 29.

</deferred>

---

*Phase: 26-Engine Cycle Scheduler Rewrite*
*Context gathered: 2026-05-20*
