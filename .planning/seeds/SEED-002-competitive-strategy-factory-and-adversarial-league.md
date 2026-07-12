---
id: SEED-002
status: dormant
planted: 2026-07-12
planted_during: v1.36 shipped; core-rules audit follow-up
trigger_when: when planning serious competitive Strategies, a metagame lab, benchmark replacement, or any adaptive ruleset comparison
scope: large
---

# SEED-002: Competitive Strategy Factory and Adversarial League

## Why This Matters

The existing Strategy field is useful for smoke tests but is too weak and too dependent on one generated decision skeleton to support balance conclusions. Stronger human- or model-authored controllers could discover qualitatively different tactics and counters.

Before changing rules based on toy-agent statistics, build a reproducible best-response factory: legal hierarchical controllers, offline search and optimization distilled to deterministic source, a frozen multi-oracle league, independent red teams, sealed holdouts, and equal-compute retraining for every future rule profile.

## When to Surface

**Trigger:** when planning serious competitive Strategies, a metagame lab, benchmark replacement, or any adaptive ruleset comparison.

Surface this seed before:

- treating the current Advanced library as balance evidence;
- choosing among Cycle, movement, Backstab, starting-layout, or other rule candidates;
- replacing the public Advanced library with “competitive” Strategies;
- claiming practical anti-dominance or a robust pure champion;
- building Phase 261 of the proposed v2.0 roadmap.

## Scope Estimate

**Large — a dedicated milestone following a small feasibility spike.**

The first program should prove a legal hierarchical planner, add structured optimizer and search-teacher response oracles, run a human/model red team, and freeze a reproducible league. A planning envelope of roughly 500,000 direct-engine Matches and two to three engineering weeks must be recalibrated after measuring the first strong controller.

## Breadcrumbs

- [Competitive Strategy factory research handoff](../research/competitive-strategy-factory-and-adversarial-league.md)
- [Core rules, enforcement, runtime, and metagame audit](../research/v2.0-core-rules-enforcement-runtime-and-metagame-audit.md)
- [Focused reproductions and current-rules matrix](../artifacts/v2.0-core-rules-audit/README.md)
- [Proposed v2.0 milestone](../milestone-proposals/v2.0-rules-integrity-and-metagame-renewal/PROPOSAL.md)
- [Proposed v2.0 requirements](../milestone-proposals/v2.0-rules-integrity-and-metagame-renewal/REQUIREMENTS.md)
- [Proposed v2.0 roadmap](../milestone-proposals/v2.0-rules-integrity-and-metagame-renewal/ROADMAP.md)
- [Updated Milestone 2 activation prompt](../milestone-proposals/v1.38-competitive-strategy-factory-and-adversarial-league/ACTIVATION-PROMPT.md)
- [Earlier Advanced Strategy library research](../research/v1.5-STRATEGY-LIBRARY.md)
- [Canonical Strategy input and limits](../../packages/spec/src/types.ts)
- [Input construction and information boundaries](../../packages/engine/src/runtime-inputs.ts)

## Required Posture

- Current toy Strategies remain regression fixtures, not credible meta evidence.
- Match-time execution uses only legal serialized inputs and deterministic source.
- Training may use offline search, evolution, or external models, but deployment is distilled explicit code.
- Multiple independent response-oracle families and a human/model red team attack every provisional leader.
- “Exploitability” is always qualified as oracle-relative.
- Every rule candidate receives equal adaptation and training compute.
- Production runtimes certify finalists; they are not the training loop.
- The milestone itself changes no production game rules. After freezing the current-rules league, it runs a versioned lab-only, equal-compute comparison of the current edge rank, full inward rank, and edge-anchored bracket start.

## Notes

- Start with the legal hierarchical planner spike, then immediately build the counter-oracle loop.
- Produce a portfolio plus a robust pure finalist; the PSRO mixture is diagnostic evidence, not one deployable entrant.
- Resolve initiative visibility, authoritative Advance state, runtime-budget mismatch, and language-envelope asymmetry in the preceding integrity milestone.
- Preserve failed attacks, negative results, manifests, payoff matrices, behavior fingerprints, and holdout identities for later rule evaluation.
- Treat the bracket as an experiment, not a selected rule: top `y=0, x={2,3,8,9}` plus `y=1, x={4,5,6,7}`, vertically mirrored for bottom. Keep cap, MOVE, Backstab, arenas, and other rules fixed during the primary comparison.
