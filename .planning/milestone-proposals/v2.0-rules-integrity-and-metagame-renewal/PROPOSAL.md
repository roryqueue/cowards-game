---
status: proposed
version: v2.0
name: Rules Integrity and Metagame Renewal
created: 2026-07-12
starting_phase: 256
requirements: 63
phases: 13
---

# Proposed Milestone: v2.0 Rules Integrity and Metagame Renewal

> This is a durable proposal, not the active GSD milestone. It does not replace `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`, or `.planning/STATE.md`. Start it only through `$gsd-new-milestone` after explicit approval and revalidation of Phase 256’s safety assumptions.

**Source audit:** [Core Rules, Enforcement, Runtime, and Metagame Audit](../../research/v2.0-core-rules-enforcement-runtime-and-metagame-audit.md)
**Strategy-development handoff:** [Competitive Strategy Factory and Adversarial League](../../research/competitive-strategy-factory-and-adversarial-league.md)
**Draft requirements:** [REQUIREMENTS.md](REQUIREMENTS.md)
**Draft roadmap:** [ROADMAP.md](ROADMAP.md)
**Reproduction artifacts:** [v2.0 core-rules audit artifacts](../../artifacts/v2.0-core-rules-audit/README.md)

## Recommendation

Make the next major rules/runtime milestone **v2.0 Rules Integrity and Metagame Renewal**, not v1.37.

The work crosses major compatibility boundaries: core rules, Strategy inputs and Actions, runtime ABI and failure semantics, Chronicle grammar, replay compatibility, arena and Set policy, and counted eligibility.

The milestone should target a defensible property:

> A Match produced from canonical inputs is deterministic, replayable, language-independent, failure-safe, and part of a practical metagame in which every leading pure Strategy has a robust counter across sealed, mirrored, multi-arena evaluation.

A frozen deterministic finite game cannot guarantee that no stable metagame will ever emerge. The product target is **practical anti-dominance**, supported by held-out evidence and continued versioned arena/doctrine challenges.

## Why this is one milestone

Balance results are not trustworthy until execution, failure classification, state semantics, and Chronicle evidence are trustworthy. Conversely, repairing those foundations without revisiting the current action economy would leave the Contraction macrogame, benchmark independence, and official Set fairness unresolved.

The dependency order is therefore:

1. quarantine unproven counted execution;
2. establish one versioned authority and one transition kernel;
3. prove language-neutral runtime behavior;
4. build an independent measurement lab;
5. select the smallest rule bundle through ablation;
6. define Chronicle v2 from the frozen event model;
7. migrate counted competition and product surfaces atomically;
8. open the sealed holdout only for the final launch decision.

## Non-negotiable decisions

- Phase 256 is an immediately deployable safety checkpoint; it should not wait for the complete v2.0 release.
- Runtime system failure never becomes a player violation or gameplay loss.
- No counted lane runs without current executable containment and conformance evidence tied to exact runtime/toolchain identity.
- v1.4 Chronicles and results remain immutable historical evidence under v1.4 semantics.
- One canonical transition kernel owns gameplay; Chronicle and services consume its transitions.
- Candidate rule changes are experiments, not commitments.
- Thresholds and holdouts are fixed before candidate results are inspected.
- No candidate ships merely because the milestone proposed it.
- Counted Sets prove that each entrant receives each side and each initial-initiative state across distinct arenas.

## Rule-experiment posture

The clear simplifications remain good candidates:

- add an explicit `HOLD`/`END_ACTIVATION` after a Soldier has Advanced;
- expose initial initiative to Strategy selection;
- remove or define promised-but-unused event vocabulary;
- explicitly rule same-direction collision, push history, excess-order precedence, and terminal timing;
- replace duplicate empty arenas with genuinely distinct symmetry-balanced scenarios;
- make a mirrored multi-arena Set—not an isolated Match—the counted unit.

The following three changes are **coupled experiments** and must not be bundled before their individual effects are known:

- Cycle cap reduction;
- starting Soldiers one row inward;
- facing-only MOVE plus removal of persistent reversal history.

The following two Backstab questions are also separate:

- remove redundant Cycle-start scans and scan after each Action;
- require attacker orientation.

## Revised Cycle-cap experiment

The original recommendation—“cap 4, use 6 as fallback”—was too confident. Current geometry shows a meaningful distinction.

Two aligned Soldiers advancing directly inward produce:

| Starts | Cap | First enemy Awareness | End of Round 1 | First collision attempt |
|---|---:|---|---|---|
| `y=0 / y=11` | 4 | Round 2, layer 1 | Separation 3; no contact | Round 2, layer 2 |
| `y=0 / y=11` | 5 | Round 1, layer 5 | Adjacent | Round 2, layer 1 |
| `y=0 / y=11` | 6 | Round 1, layer 5 | Contact resolves | Round 1, layer 6 |
| `y=1 / y=10` | 4 | Round 1, layer 4 | Adjacent | Round 2, layer 1 |
| `y=1 / y=10` | 5 | Round 1, layer 4 | Contact resolves | Round 1, layer 5 |
| `y=1 / y=10` | 6 | Round 1, layer 4 | Contact plus one response layer | Round 1, layer 5 |

The current starts are defined in the [canonical setup](https://github.com/roryqueue/cowards-game/blob/38f4a83db9298502c12db44cd66d026878803d20/CowardsGameSpec_Full_Consolidated_v1.md#L221-L265), Round selection counts are 1/2/3/4 ([v1.4 selection](https://github.com/roryqueue/cowards-game/blob/38f4a83db9298502c12db44cd66d026878803d20/CowardsGameSpec_CycleInterleaved_v1.4.md#L29-L46)), and slots alternate by Cycle layer ([v1.4 ordering](https://github.com/roryqueue/cowards-game/blob/38f4a83db9298502c12db44cd66d026878803d20/CowardsGameSpec_CycleInterleaved_v1.4.md#L48-L68)).

Action ceilings per player per Phase are:

| Cap | Maximum Actions (`10 slots × cap`) | Reduction from current |
|---:|---:|---:|
| 12 | 120 | baseline |
| 8 | 80 | 33% |
| 6 | 60 | 50% |
| 5 | 50 | 58% |
| 4 | 40 | 67% |

The ordered experiment should be:

1. Instrument the current cap-12 baseline.
2. Test cap only, preserving current starts and current free-direction MOVE: `8`, `6`, `5`, then `4`.
3. Treat cap 6 as the safest first challenger because it halves throughput while preserving Round-1 contact.
4. Treat cap 4 as a stress test for an intentional deployment Round, not the preferred default.
5. Select the least aggressive reduction that materially increases Contraction relevance without unacceptable first-contact delay, draw rate, inactivity, or loss of counterplay.
6. Test inward starts separately at the selected cap, watching for reserve/turtle doctrines.
7. Test facing-only MOVE separately, then retest the selected cap and the next two larger caps because TURN now consumes movement budget.

Simply applying all three changes at once would make attribution impossible and could create the quiet game this proposal is intended to avoid.

## Revised Backstab experiment

Current Backstab requires an enemy in the victim’s rear square; attacker facing is ignored by both [the written rule](https://github.com/roryqueue/cowards-game/blob/38f4a83db9298502c12db44cd66d026878803d20/CowardsGameSpec_Full_Consolidated_v1.md#L802-L857) and [the implementation](https://github.com/roryqueue/cowards-game/blob/38f4a83db9298502c12db44cd66d026878803d20/packages/engine/src/backstab.ts#L16-L35).

Attacker-facing changes fewer deliberate Backstabs than it appears to. If a victim faces UP, a Soldier entering the rear square from farther south must MOVE UP. Successful MOVE updates the mover’s facing to UP ([movement.ts](https://github.com/roryqueue/cowards-game/blob/38f4a83db9298502c12db44cd66d026878803d20/packages/engine/src/movement.ts#L193-L209)), so ordinary self-propelled rear ingress already leaves the attacker facing the victim.

The added condition mainly removes:

1. a pushed Soldier landing behind a victim while facing elsewhere;
2. a victim TURN exposing its rear to an adjacent enemy that faces elsewhere;
3. a stationary rear attacker that is facing elsewhere.

Those may be delightful emergent interactions rather than noise, so the condition is not a clear win. Under facing-only MOVE, it also combines with TURN cost and could suppress flanking too much.

The ordered experiment should be:

1. Instrument current Backstabs by cause: attacker Advance, victim TURN, push displacement, or pre-existing relationship.
2. Remove Cycle-start scans only; retain current victim-rear geometry and confirm reachable outcomes remain effectively unchanged.
3. Add attacker-facing to the post-Action scan under current MOVE.
4. Repeat attacker-facing under any surviving facing-only MOVE profile.
5. Reject attacker-facing if it materially delays first engagement, collapses Backstab incidence, creates evasive TURN loops, or increases head-to-head jams/draws without compensating push/position play.
6. Test stronger restrictions such as “attacker Advanced into the rear square this Action” only if Backstab remains dominant after the simpler variant.

“Directly behind and facing the same direction as the victim” is the clearest equivalent wording if the orientation condition survives.

## Affordable staged comparison

Iterative comparison does not need to begin with the expensive full service/four-language matrix.

### Stage A — Analytic and micro-scenario screen

- reachability and first-contact calculations;
- targeted collision, push, Backstab, TURN, Contraction, and reserve scenarios;
- no Strategy corpus required.

### Stage B — Paired engine screen

- 6–12 representative matchup pairs;
- the two currently distinct geometries, counting Smoke/Open once;
- both initiative states;
- mirrored sides;
- 48–96 Matches per rule profile.

Use identical scenario IDs for every ruleset. Measure first Awareness/contact/push/Backstab, Actions before interaction, TURN:MOVE ratio, Contractions, ACTIVE counts, no-Advance stones, draws, and runtime/event volume.

### Stage C — Full in-process field

Promote only survivors to the complete pairwise matrix. The persisted current-rules matrix executes 540 Matches in about 11.4 seconds on the audit machine, so several engine-level rule profiles cost minutes, not days.

### Stage D — Independent and sealed field

Use independently implemented doctrines and held-out arena families. This is the first valid anti-dominance gate.

### Stage E — Cross-language and service proof

Only the final candidate pays the expensive runtime-service, four-language, persistence, replay, standings, privacy, and E2E cost.

This funnel makes iterative ruleset comparison a required scientific step without multiplying the expensive certification work across every idea.

## Proposed metagame gate

Phase 261 should calibrate and lock exact values before candidate evaluation. Starting targets:

- at least 12 independently implemented doctrines spanning at least six behavioral families;
- design and sealed-holdout pools with genuinely distinct symmetry-balanced arena families;
- every pairing covers both sides and both entrant-level initiative states;
- every top-quartile doctrine has at least one robust held-out counter;
- the top best-response graph has no singleton sink strongly connected component;
- no doctrine exceeds 60% aggregate held-out Set points;
- at least one robust non-transitive cycle includes a top-quartile doctrine;
- pacing and contact distributions remain within precommitted bounds;
- every retained advertised mechanic has measurable incidence across multiple matchup families;
- the accepted rules have a non-increasing concept budget.

The exact numeric counter threshold should be fixed only after the independent baseline reveals how many scenario points exist and how coarse their deterministic percentages are.

The benchmark field must be produced through the [competitive Strategy factory and multi-oracle best-response process](../../research/competitive-strategy-factory-and-adversarial-league.md), not by adding more parameter profiles to the current shared generator. Any ruleset promoted from Phase 262 must receive equal adaptation and training compute; fixed-agent comparisons are screening evidence only.

## Explicit non-goals

- durable ratings, prizes, staffed moderation, appeals service levels, or full account recovery;
- new Strategy languages, TinyGo promotion, package ecosystems, or unrelated runtime technology migration;
- live randomness, LLM inference, adaptive rules, or per-Match rule mutation;
- hidden enemy positions unless a separately approved contingency is triggered;
- user-authored arenas in counted competition;
- broad visual redesign;
- silent rewriting of v1.4 results or inferred v2 compatibility for old revisions;
- production-sandbox certification language beyond the evidence;
- shipping every proposed rule candidate.

## Activation condition

When this proposal is selected, run `$gsd-new-milestone v2.0 Rules Integrity and Metagame Renewal`, use these files as input, reconfirm the safety posture, approve the requirements interactively, and let the active workflow create `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, and `.planning/STATE.md`.

The first implementation work should remain Phase 256 even if it is released operationally as a v1.36.1 safety checkpoint.
