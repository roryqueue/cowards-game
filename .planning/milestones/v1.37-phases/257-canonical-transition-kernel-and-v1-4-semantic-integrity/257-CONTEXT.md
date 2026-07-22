# Phase 257: Canonical Transition Kernel and v1.4 Semantic Integrity - Context

**Gathered:** 2026-07-12
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase replaces duplicate Match loops with one engine-owned state-machine kernel and driver, validates every transition semantically, repairs all confirmed lifecycle defects, freezes exact v1.4 compatibility rulings, and removes obsolete execution/event surfaces. Runtime ABI limits, four-language certification, Chronicle grammar convergence, and Set fairness remain in later phases.

</domain>

<decisions>
## Implementation Decisions

### Kernel transition contract
- **D-01:** One kernel step is one explicit validated state-machine transition at a lifecycle or runtime-response boundary. An engine-owned driver repeatedly invokes the kernel for a complete Match.
- **D-02:** Each authoritative transition record contains transition kind, semantic compatibility tuple, lifecycle coordinates, validated input/result classification, ordered canonical events, before/after state hashes, and terminal/failure status. Full private state remains in controlled execution context rather than the event envelope.
- **D-03:** Runtime calls are effects-as-data. The pure kernel yields a typed request; the engine driver invokes the runtime boundary and resumes the kernel with success, player violation, or system failure.
- **D-04:** One public engine Match driver returns both canonical result and transition stream. Direct execution and runtime-service call it; Chronicle records its transitions and never runs a second Match loop.

### Semantic-validation behavior
- **D-05:** Full semantic validation runs on incoming state/command and outgoing state/events for every kernel transition in every environment, then again at runtime-service, persistence, and reconstruction trust boundaries.
- **D-06:** Classify validation failures by ownership. Invalid canonical state, arena, tuple, transition output, or persisted evidence is a system/integrity failure. Only invalid Strategy output at the canonical legality boundary may become a player violation.
- **D-07:** A failed transition returns the unchanged pre-transition state and a typed failure. No invalid or partial Chronicle becomes canonical Match evidence; a restricted diagnostic record may retain hashes, transition kind, stable codes, and safe metadata.
- **D-08:** Validators return a deterministic bounded set of stable invariant codes in canonical order. Operator detail uses bounded paths and metadata; public output receives a safe top-level category.

### Exact compatibility rulings
- **D-09:** Cap the raw activation-order list at the Round quota before validation. Validate every retained-prefix entry for shape, identity, ownership, status, and duplication; ignored excess entries cannot invalidate the prefix.
- **D-10:** If Cycle-end Backstab stones/falls the actor, finish the simultaneous scan and Backstab events, close the slot with explicit terminal reason `BACKSTABBED`, then evaluate Match outcome immediately.
- **D-11:** If no-Advance cleanup removes the final active Soldier, canonical ordering is status-change event, activation-slot closure with the no-Advance reason, then immediate Match outcome before any further scheduling/skipped-slot event.
- **D-12:** Preserve the approved v1.4 bundle: same-direction rear approach blocks; successful push updates the pusher's successful-move history to the attempted direction and preserves the pushed Soldier's prior history; blocked MOVE/PUSH is non-terminal; outcome follows every active-count/status change; Backstab uses the victim rear square without attacker-facing; Cycle-start scans remain unless the optional later equivalence proof passes.

### API and event cleanup
- **D-13:** Remove the contiguous `resolveActivation` public export and internal wrapper completely. Provide no compatibility alias or test-only copy; rewrite callers and tests onto kernel transitions or the canonical Match driver.
- **D-14:** Remove `PUSH_ATTEMPTED` from the current event vocabulary because canonical resolved/blocked effects already cover it. Retain a historical-only decoder branch only if committed evidence actually contains it.
- **D-15:** Removing a declared event is a semantic contract change: mint/certify the corresponding current tuple component version rather than calling it documentation cleanup. Historical v1.4 decoding remains untouched.
- **D-16:** Structural guards forbid replay imports of scheduling/resolution functions, restrict runtime-service to the Match driver, snapshot package exports, require current event producer/consumer/validator coverage, and detect duplicate Phase/Round/Cycle/Activation/Contraction loops outside engine authority.

### the agent's Discretion
- Kernel command/type names, transition hashing encoding, validation module layout, and exact stable code names are left to research and planning within these locked semantics.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Active milestone and prior decisions
- `.planning/PROJECT.md` — v1.37 hard boundaries and preservation posture.
- `.planning/REQUIREMENTS.md` — KERN-01 through KERN-11.
- `.planning/ROADMAP.md` — Phase 257 boundary and success criteria.
- `.planning/phases/256-counted-safety-and-canonical-authority/256-CONTEXT.md` — Exact tuple, failure, historical, and visibility decisions inherited by this phase.
- `.planning/research/SUMMARY.md` — Recommended functional-core/evidence-adapter architecture.

### Audit and reproduced defects
- `.planning/research/v2.0-core-rules-enforcement-runtime-and-metagame-audit.md` — F-01 and F-03 through F-12, including two loops and each compatibility ambiguity.
- `.planning/artifacts/v2.0-core-rules-audit/README.md` — Current-HEAD expected reproduction output.
- `.planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts` — Permanent focused regression input.

### Canonical historical semantics
- `CowardsGameSpec_Full_Consolidated_v1.md` — Original rule definitions and current user-owned edit boundary.
- `CowardsGameSpec_CycleInterleaved_v1.4.md` — Cycle-interleaved scheduling, Backstab boundaries, and blocked-action semantics.
- `CowardsGame_Technical_Architecture_Spec_v1.4.md` — v1.4 engine/Chronicle ownership intent.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/engine/src/match.ts`: Existing `resolveRound` and `runMatch` provide the engine scheduling baseline to extract into the one driver/kernel model.
- `packages/engine/src/activation.ts`: Existing selection, Cycle resolution, slot closure, and stale `resolveActivation` wrapper contain the focused lifecycle defects and reusable action-level logic.
- `packages/engine/src/state.ts`: Initial state construction is the starting semantic-validation and constant-cloning seam.
- `packages/replay/src/build.ts`: Existing duplicate Match runner must become a transition recorder/Chronicle builder.
- `packages/replay/src/replay-transition.ts`: Existing event-to-reconstruction logic is a later consumer of transition/event guarantees.

### Established Patterns
- Engine functions already return state plus ordered events, which can evolve into typed transition records.
- Runtime-service currently calls `buildChronicleFromMatch`; it must move to the canonical engine driver.
- Focused engine/replay tests already compare deterministic results and can become compatibility fixtures rather than re-recorded goldens.

### Integration Points
- `apps/runtime-service/src/execute-match.ts` switches from replay-owned execution to engine driver plus recorder.
- `packages/engine/src/index.ts` export surface must lose the stale contiguous wrapper.
- `packages/spec/src/types.ts` and `packages/spec/src/schemas.ts` own event vocabulary/version changes.
- `packages/replay/src/grammar.ts` and reconstruction consumers need explicit historical-only handling if real evidence requires removed events.

</code_context>

<specifics>
## Specific Ideas

- Treat runtime invocation as a resumable effect so the transition function stays pure and system failure can return unchanged state.
- Separate private execution state from canonical transition evidence using hashes and typed effects.
- Make event-vocabulary coverage executable: every current event has a producer and consumer/validator mapping.

</specifics>

<deferred>
## Deferred Ideas

- Removing Cycle-start Backstab scans remains optional and requires complete reachable-state, event, terminal, and observation equivalence proof.
- Adding `HOLD`/`END_ACTIVATION` remains outside required completion and requires separate approval plus semantic equivalence proof.

</deferred>

---

*Phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity*
*Context gathered: 2026-07-12*
