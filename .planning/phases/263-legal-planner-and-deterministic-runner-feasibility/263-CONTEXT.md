# Phase 263: Legal Planner and Deterministic Runner Feasibility - Context

**Gathered:** 2026-07-27
**Status:** Discussion complete; planning and execution denied pending Phase 262 ADMIT-03

<domain>
## Phase Boundary

This phase proves, before factory scale, that a deployable hierarchical Strategy planner and one-command private lab runner can produce legal, bounded, deterministic, reproducible work through the exact canonical kernel. It delivers the full-board assignment and 5x5 SoldierBrain feasibility spike, legal-information tests, the private lab dependency spine, stable task/stream identities, atomic shards, and worker/order/restart-invariant reduction. It does not build the scaled candidate factory or independent response channels, run league response rounds, materialize formation profiles, open a holdout, or relax any limit to rescue a failed spike.

</domain>

<decisions>
## Implementation Decisions

### Carry-forward integrity and containment
- **D-01:** Phase 262's admitted tuple, measurement contract, budgets, retry/burn policy, privacy classes, and custody commitment are immutable inputs. Missing or mismatched inputs stop Phase 263.
- **D-02:** The selected canonical `MATCH_KERNEL` is the sole transition authority. The lab may coordinate its public machine/effect API but may not copy Action legality, resolution, scheduling, event order, or state transitions into a second loop.
- **D-03:** Trusted repository-owned search and teacher representations may call the canonical engine for offline analysis. Any emitted Strategy source is hostile and executes only through the existing supervised provider/runtime boundary with exact success, player-violation, and system-failure semantics.
- **D-04:** The lab remains a private offline dependency. Production packages, apps, Go code, images, routes, generated contracts, and deployment manifests must not import it or expose its artifacts.
- **D-05:** Every task, attempt, failure, retry, shard, and unused allocation is content-addressed and charged. Missing, duplicate, conflicting, invalid, system-failed, or tampered work cannot enter a reduction.

### Hierarchical planner contract
- **D-06:** The full-board planner deterministically enumerates or beam-searches ordered Soldier/mission assignments under both entrant-level initiative hypotheses. Canonical ordering and tie-breaks must make identical legal inputs produce identical output.
- **D-07:** The mission vocabulary is evacuation, rear entry, edge push, screen, anchor, graph-cut STONE, reserve, recovery, bait, and pincer. Each mission has explicit objective, stale-objective, completion, failure, and cheap fallback semantics.
- **D-08:** Hard survival, legality, immediate tactical, and mission-consistency constraints are applied lexicographically before soft preferences. A soft score cannot compensate for a failed hard constraint.
- **D-09:** The 5x5 SoldierBrain evaluates all nine canonical concrete Actions—four `MOVE` directions, four `TURN` directions, and `TURN_TO_STONE`—and handles immediate legal threats/opportunities, stale objectives, the authoritative `hasAdvancedThisActivation` value, and budget exhaustion.
- **D-10:** A cheap deterministic legal fallback is always reserved before optional search. Exhausting a soft-search budget must not create invalid output, hidden fallback compute, or a system failure.
- **D-11:** Emitted decisions reproduce from only canonical `StrategyInput` or `SoldierBrainInput`, the assigned objective, `StrategyMemory`, and `SoldierMemory`. Privileged teacher state may score or label offline examples but can never be serialized into an emitted decision dependency.

### Feasibility gate
- **D-12:** Forced-tactic, defense, legality, hidden-state-pair, stale-objective, hostile-input, determinism, source-size, objective, memory, output, and runtime tests must pass before factory scale. Paired states that are identical under the legal information set must produce identical deployed choices.
- **D-13:** Accepted output is synchronous, package-free, capability-free, self-contained deterministic source. It performs no live inference, human interaction, network, filesystem, clock, random, dynamic import, or host-capability access during a Match.
- **D-14:** The exact Phase 262 source and runtime limits control the gate. Unless Phase 262 validly calibrated replacements, this means a 64 KB hard source cap, a preferred under-48 KB target, and a below-5 ms p99 direct-execution target on the one identified benchmark.
- **D-15:** Feasibility failure is a valid stop result. It blocks scaled factory work and is preserved with full evidence; it cannot be hidden by extra compute, a larger source, weaker information rules, an easier runtime lane, or a relaxed threshold.

### Deterministic lab runner
- **D-16:** Use one private `@cowards/strategy-lab` core for contracts, identity, task planning, ledgers, artifacts, canonical reduction, and profile-neutral orchestration. It is an offline package/CLI, not a network service or production database client.
- **D-17:** The runner pre-enumerates the complete bounded task graph before execution. Each task identity binds the admitted root, algorithm/version, inputs, split, budget, ordinal, and purpose; independent deterministic streams derive from that identity with domain-separated hashing.
- **D-18:** Task assignment occurs before workers run. Trusted `worker_threads` may provide CPU parallelism, but worker count, shard size, completion order, restart, and resume may not change task identities or reduced bytes.
- **D-19:** Workers write complete temporary shards, validate strict bounded schemas, coverage, identities, and digests, then publish atomically. Reduction reads shards in canonical task-id order and rejects gaps, duplicates, conflicts, truncation, stale identities, or tampering.
- **D-20:** One non-secret command rebuilds the declared feasibility candidates, schedules, outcomes, telemetry, and roots from an immutable manifest. It records the exact Git/dirty state, lockfile, Node/V8/OpenSSL/OS/architecture/CPU identity, worker configuration, algorithm/PRNG/schema versions, and selected semantic/runtime tuple.
- **D-21:** The lab drives `MATCH_KERNEL.createMachineV119`/`stepMatch` (or the exact currently selected equivalents) and resumes effects only with supervised runtime results. `new Function`, `eval`, Node `vm`, a copied `resolveRound`, or an alternate legality/transition implementation is forbidden.
- **D-22:** Byte-identical reduction is required across the precommitted worker/shard/order/restart/resume matrix. Wall-clock timing is operational metadata and capacity evidence, never a search identity or equal-compute currency.

### the agent's Discretion
- Beam width, search representation, mission scoring details, objective encoding, and fallback heuristics are selected after the planner/source/runtime spike, provided they satisfy the locked legal-information, hard-before-soft, determinism, and budget rules.
- Task-id field names, shard size, trusted worker-pool size, artifact directory layout, and canonical reduction implementation are technical choices, provided the required invariance and tamper tests pass.
- Trace-retention sampling follows the Phase 262 contract; implementation may choose compression and internal review tooling without creating a canonical Chronicle or public replay.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Active milestone and inherited contract
- `.planning/PROJECT.md` — v1.38 goal, canonical-kernel rule, hostile-runtime boundary, and privacy posture.
- `.planning/REQUIREMENTS.md` — PLAN-01 through PLAN-06 and FACT-01 through FACT-04.
- `.planning/ROADMAP.md` — Phase 263 boundary, success criteria, dependency, and spike requirements.
- `.planning/STATE.md` — Current milestone state and blockers.
- `.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-CONTEXT.md` — Frozen admission, budget, custody, claims, and non-materialization decisions.
- `.planning/milestone-proposals/v1.38-competitive-strategy-factory-and-adversarial-league/ACTIVATION-PROMPT.md` — Binding planner missions, SoldierBrain, runtime, and unchanged-kernel contract.
- `.planning/research/SUMMARY.md` — Recommended lab stack, architecture, deterministic task model, and feasibility risks.
- `.planning/research/competitive-strategy-factory-and-adversarial-league.md` — Detailed planner, factory, and league design handoff.

### Canonical rules and predecessor decisions
- `CowardsGameSpec_Full_Consolidated_v1.md` — Full rules and Strategy/SoldierBrain contract.
- `CowardsGameSpec_CycleInterleaved_v1.4.md` — Current Cycle, Activation, Action, Advance, and Backstab semantics.
- `CowardsGame_Technical_Architecture_Spec_V1.md` — Engine purity and runtime ownership boundary.
- `.planning/artifacts/v1.37-strategy-evaluation-foundation.md` — Exact selected tuple, runtime identities, limits, arenas, and Set policy.
- `.planning/milestones/v1.37-phases/257-canonical-transition-kernel-and-v1-4-semantic-integrity/257-CONTEXT.md` — Single transition owner and system-failure rollback semantics.
- `.planning/milestones/v1.37-phases/258-canonical-json-failure-semantics-and-artifact-identity/258-CONTEXT.md` — Canonical JSON, budget, three-way failure, and identity decisions.
- `.planning/milestones/v1.37-phases/260-truthful-strategy-inputs-arena-authority-and-set-fairness/260-CONTEXT.md` — Truthful initiative/Advance inputs and complete Set-condition authority.

### Existing implementation seams
- `packages/engine/src/kernel/driver.ts` — `MATCH_KERNEL`, machine/effect driver, current tuple binding, and three-way resume behavior.
- `packages/engine/src/kernel/step.ts` — Sole canonical transition-step implementation.
- `packages/engine/src/kernel/types.ts` — Effect, resume, transition record, machine, and restricted-failure types.
- `packages/engine/src/runtime-inputs.ts` — Full-board Strategy input, 5x5 Awareness Grid, and authoritative Advance input construction.
- `packages/spec/src/schemas.ts` — Strict Strategy/SoldierBrain input/output, nine concrete Actions, and memory/objective limits.
- `packages/spec/src/runtime.ts` — Runtime registry, source cap, package policy, and public/private runtime semantics.
- `packages/spec/src/runtime-invocation-v1-17.ts` — Authenticated request, budget, retry, accounting, and three-way result contract.
- `apps/runtime-service/src/execute-match.ts` — Existing supervised provider execution seam.
- `packages/runtime-js/src/supervised-subprocess-adapter.ts` — Existing hostile-source subprocess supervision pattern.
- `scripts/check-v1-37-integrity-boundaries.ts` — Existing single-kernel and forbidden-reference drift checks.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `MATCH_KERNEL` already exposes exact tuple-bound machine creation, `stepMatch`, full Match execution, and activation execution; the lab should adapt to this effect protocol rather than invent transition ownership.
- `createStrategyInputV119` and `createSoldierBrainInputV119` already produce the legal full-board and 5x5 observations, including initiative and `hasAdvancedThisActivation`.
- Zod schemas already enforce Strategy/SoldierBrain shapes, 32 KB StrategyMemory, 2 KB SoldierMemory, 1 KB objective payloads, and the 64 KB Strategy source ceiling.
- Runtime invocation contracts already bind signed budgets, request identity, cumulative ledgers, retries, and success/player-violation/system-failure classifications.
- Canonical JSON and domain-separated identity helpers provide the base for task, stream, shard, and root identities.

### Established Patterns
- The engine owns state transitions while the runtime supplies effects; a system failure returns unchanged gameplay evidence rather than being scored.
- Production packages are separated by pnpm workspace boundaries and reinforced by source/import monitor scripts.
- Current replay/Chronicle helpers are canonical evidence paths; private lab traces must be a separate class even when internal reconstruction helpers are reused.

### Integration Points
- The new private lab core imports `@cowards/spec`, `@cowards/engine`, selected replay helpers, and supervised runtime adapters.
- A repository-local CLI under the lab/script boundary owns manifest loading, pre-enumeration, worker orchestration, shard publication, and reduction.
- Boundary monitors must reject any reverse import from production packages/apps/Go/deployment files into the lab.
- Phase 264 consumes the proved candidate format, deterministic scheduler, hostile-runtime bridge, and feasibility receipt; it must not bypass a failed gate.

</code_context>

<specifics>
## Specific Ideas

- Reserve the cheap fallback before spending optional search work.
- Model the planner under both initiative hypotheses even when the current observation exposes the actual initiative state, so doctrine robustness is not accidentally one-sided.
- Treat each root/task stream as an explicit deterministic identity, not a call to ambient randomness or a completion-order seed.

</specifics>

<deferred>
## Deferred Ideas

- Scaled immutable candidate production, clone fingerprints, independent oracle packages, and human/external intake belong to Phase 264.
- PSRO/double-oracle solving and current-rules red-team execution belong to Phase 265.
- Executable current/inward/bracket states remain prohibited until after the valid Phase 266 freeze.
- Production/runtime migrations and all rule experiments remain outside this phase and milestone.

</deferred>

---

*Phase: 263-legal-planner-and-deterministic-runner-feasibility*
*Context gathered: 2026-07-27*
