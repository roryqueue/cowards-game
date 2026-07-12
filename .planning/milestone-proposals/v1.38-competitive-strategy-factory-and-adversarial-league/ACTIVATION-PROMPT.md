# Activation Prompt: Competitive Strategy Factory and Adversarial League

> Proposed next-after-foundation milestone prompt. Verify the next available version before activation.

```text
$gsd-new-milestone v1.38 Competitive Strategy Factory and Adversarial League

Start this only after “Rules Integrity and Strategy Evaluation Foundations” has passed audit, been archived, and been tagged. Use the next available version if v1.38 is no longer available.

Create the milestone with no workstream and run the normal staged GSD flow, research first. Use spikes before committing to the final implementation architecture, and pause at the milestone-summary, requirements, and roadmap approval checkpoints.

Required context:

- .planning/research/competitive-strategy-factory-and-adversarial-league.md
- .planning/seeds/SEED-002-competitive-strategy-factory-and-adversarial-league.md
- .planning/research/v2.0-core-rules-enforcement-runtime-and-metagame-audit.md
- .planning/artifacts/v2.0-core-rules-audit/README.md
- .planning/artifacts/v2.0-core-rules-audit/run-current-meta-matrix.ts
- .planning/research/v1.5-STRATEGY-LIBRARY.md
- .planning/milestone-proposals/v2.0-rules-integrity-and-metagame-renewal/PROPOSAL.md
- .planning/milestone-proposals/v2.0-rules-integrity-and-metagame-renewal/REQUIREMENTS.md
- .planning/milestone-proposals/v2.0-rules-integrity-and-metagame-renewal/ROADMAP.md
- The archived requirements, roadmap, audit, and phase artifacts from the immediately preceding integrity milestone
- CowardsGameSpec_Full_Consolidated_v1.md
- CowardsGameSpec_CycleInterleaved_v1.4.md

Goal:

Build a reproducible factory for genuinely competitive, independently implemented, legally deployable Strategies; a frozen multi-oracle best-response league; a human/model red-team process; and an equal-compute experimental protocol. Use the frozen lab to compare the current starting rank, a full inward rank, and an edge-anchored bracket shield without shipping a rule change.

The existing Starter and Advanced Strategies remain smoke tests and regression fixtures. Their results are not balance evidence.

Production boundaries:

- Do not change production game rules, legal Actions, Cycle timing, movement, reversal, collision, Backstab, push, STONE, Contraction, outcome, official arenas, counted policy, or runtime eligibility.
- Consume the canonical engine; never copy or independently reimplement transition rules.
- No experimental profile may be registered, persisted as canonical evidence, scheduled as counted play, or exposed in public product surfaces.
- Do not repair integrity/runtime defects here. If prerequisites are missing or contaminated, stop and return them to the integrity milestone.
- No live model inference, network, filesystem, clock, nondeterministic randomness, dynamic code, imports, or external services may run inside a Match.
- Offline search, evolution, self-play, and model-assisted authoring must be distilled into deterministic, self-contained Strategy source.
- Never claim mathematical optimality, exact exploitability, permanent balance, or that the game can never develop a meta.

Stage 1 — Freeze the measurement contract:

- Reproduce the persisted current-rules matrix as a regression fixture.
- Freeze engine/rules/runtime identities, scoring, sides, initiative states, design arenas, sealed holdouts, opponent splits, candidate budgets, search-node budgets, model/prompt/token budgets, human-review procedure, metrics, and pass/fail interpretation before tuning.
- Separate process success from metagame success. A rigorous failure of the practical anti-dominance gate is a valid milestone result.

Stage 2 — Legal hierarchical planner spike:

- Build a full-board selectActivations planner that enumerates or beam-searches ordered Soldier/mission assignments.
- Support evacuation, rear entry, edge push, screen, anchor, graph-cut STONE, reserve, recovery, bait, and pincer missions.
- Evaluate hard survival and tactical constraints lexicographically under both initiative hypotheses.
- Build a 5x5 SoldierBrain that enumerates all nine Actions, handles stale objectives, uses exact visible rules, tracks authoritative Advance state, and retains a cheap legal fallback.
- Prove source, objective, memory, determinism, hostile-input, and runtime limits before continuing.

Stage 3 — Factory and independent response oracles:

- Emit immutable Strategy revisions with source/hash, compatibility, lineage, doctrine/oracle family, deterministic build manifest, validation, runtime profile, and behavior fingerprint.
- Implement at least three materially independent response mechanisms: a structured tactical optimizer; a high-level search teacher distilled to deterministic source; and model-guided explicit program synthesis.
- Add a separately documented human/external-submission channel.
- Shared helpers may cover literal legality, geometry, validation, artifact creation, and reporting. Competing doctrines must not share one global selector or Action-scoring function.

Stage 4 — Freeze the current-rules PSRO/double-oracle league:

- Maintain a complete mirrored payoff matrix across sides, initiative states, and distinct design arenas.
- Train independent approximate best responses against both the meta-distribution and strongest pure policies.
- Reject source or behavioral clones and add only legal, novel, positive responses.
- Produce a diverse pure Strategy portfolio and a separately selected robust pure finalist.
- Complete the current-rules development/red-team budget and freeze its sources, population, thresholds, and holdout policy before constructing alternate starting profiles.

Stage 5 — Lab-only starting-formation experiment:

Compare three initial-state profiles while holding the current Cycle cap, MOVE rules, Backstab geometry and timing, activation counts, arenas, runtime contract, and every other rule fixed:

1. Current edge rank: x=2..9; top y=0; bottom y=11.
2. Inward-rank control: x=2..9; top y=1; bottom y=10.
3. Edge-anchored bracket shield:
   - top rear wings y=0, x={2,3,8,9}; top forward center y=1, x={4,5,6,7};
   - bottom forward center y=10, x={4,5,6,7}; bottom rear wings y=11, x={2,3,8,9};
   - all Soldiers retain their current inward facing.

The bracket’s setup rationale must be preserved in the experiment contract:

- rear-wing behind squares are off-board;
- the four empty center rear squares form an initially sealed pocket;
- all eight directly inward squares are empty;
- only four Soldiers remain on the first-Contraction boundary;
- protection decays as the formation moves rather than disabling Backstab globally.

Implement profiles through one versioned lab-only initial-state boundary and use the unchanged canonical transition engine afterward. Prove experimental profiles cannot enter production or counted paths.

Retrain separately for all three profiles with equal doctrine families, candidate counts, response iterations, oracle/model/human budgets, search nodes, Match schedules, sides, initiative states, arena corpus, holdout policy, runtime limits, and replay-review effort. Do not compare fixed current-rules Strategies as final evidence.

Do not combine the primary formation experiment with cap reduction, attacker-facing Backstab, facing-only MOVE, or Backstab scan changes. Those interactions belong in separately approved follow-up profiles after the causal formation result is known.

Measure opening selection entropy, forced evacuation, unselected first-Contraction reserves, first interaction, Backstabs by timing/cause, pushes and blocks, no-Advance STONE, center-rush/wing-guard/convoy/turtle behavior, draw and Match length, ACTIVE survival, response gap, pure-policy worst case, and best-response graph.

Reject the bracket if independent best responses converge on a robust scripted opening, convoy or STONE-shield turtle, materially lower interaction, or worse oracle-relative exploitability. A passing bracket produces a later-rules-milestone decision packet; it does not ship here.

Stage 6 — Equal human/model red team and sealed evaluation:

- Give each frozen profile the same independently budgeted model and human attack process.
- Preserve failed attacks as evidence and apply identical legality/runtime gates.
- Freeze every population before opening the common sealed arena/opponent holdout once.
- Do not tune after holdout disclosure.
- Test side, initiative, symmetry, opaque-ID, Soldier-order, deterministic-repeat, and held-out-opponent invariance.
- Certify current-rules finalists through supported runtimes, runtime-service, replay, persistence, privacy, standings, and E2E paths. Experimental-profile artifacts remain lab evidence only.

Starting competitive gates to calibrate and precommit:

- Zero accepted runtime violations, system failures, information-boundary violations, or private-data leaks.
- Source below 64KB, preferably below 48KB, and direct execution targeting less than 5ms p99 under a fixed benchmark.
- At least 12 league Strategies across six behavioral families and five genuinely independent planner cores.
- At least three structurally and behaviorally distinct finalists.
- Two consecutive response iterations exceeding 55% Set score against the preceding frozen mixture on untouched conditions.
- At least one deployable Strategy exceeding 60% against an independent probe field; beating the current Advanced library above 70% remains only a regression gate.
- A fresh red team either cannot exceed 60% against the robust finalist or produces a counter to which the next response iteration successfully adapts.
- No leading result depends materially on side, initiative, duplicate arenas, opaque IDs, invalid output, runtime failure, or source-order tie-breaks.

Required persistent outputs:

- One-command reproducible lab runner and immutable compute manifests.
- Legal Strategy corpus, lineage, behavior fingerprints, independence evidence, populations, payoff matrices, meta-distributions, and best-response graphs.
- Oracle and human/model red-team logs, including failures.
- Current-rules finalist source and runtime certification.
- Versioned current/inward/bracket manifests, separately retrained populations, causal comparison, and explicit rejection/pass decision.
- Equal-compute protocol for later cap, movement, and Backstab experiments.
- A final report that plainly states whether the current rules and bracket experiment passed or failed their precommitted empirical gates.

Finish with verification, audit, archive, and tag. Do not soften thresholds after seeing results, and do not change production rules to rescue a failed result.
```
