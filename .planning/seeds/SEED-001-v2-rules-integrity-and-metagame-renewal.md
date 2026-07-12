---
id: SEED-001
status: dormant
planted: 2026-07-12
planted_during: v1.36 Competition Maturity shipped; next-milestone selection
trigger_when: when selecting the next major rules, runtime ABI, Chronicle, or counted-competition milestone after v1.36
scope: large
---

# SEED-001: v2.0 Rules Integrity and Metagame Renewal

## Why This Matters

The core-rules audit found that valid canonical play has a strong tactical kernel, but rule authority, semantic state validation, Chronicle grammar, runtime failure classification, cross-language proof, arena/initiative fairness, and metagame evidence can drift independently.

The next major milestone should restore trustworthy evidence before selecting the smallest rule changes that improve pacing and practical anti-dominance. It should not promise that a frozen deterministic finite game can mathematically prevent a stable meta.

## When to Surface

**Trigger:** when selecting the next major rules, runtime ABI, Chronicle, or counted-competition milestone after v1.36.

This seed should surface during `$gsd-new-milestone` when the milestone scope includes any of:

- counted runtime certification or containment;
- runtime ABI or cross-language parity;
- core rule changes;
- Chronicle/replay authority;
- arena or mirrored Set fairness;
- Strategy benchmark diversity or anti-dominance.

## Scope Estimate

**Large — full major milestone.**

The proposal contains 13 phases (256–268) and 63 draft requirements. Phase 256 is intentionally separable as an immediate safety checkpoint.

## Breadcrumbs

- [Milestone proposal](../milestone-proposals/v2.0-rules-integrity-and-metagame-renewal/PROPOSAL.md)
- [Draft requirements](../milestone-proposals/v2.0-rules-integrity-and-metagame-renewal/REQUIREMENTS.md)
- [Draft roadmap](../milestone-proposals/v2.0-rules-integrity-and-metagame-renewal/ROADMAP.md)
- [Core rules, enforcement, runtime, and metagame audit](../research/v2.0-core-rules-enforcement-runtime-and-metagame-audit.md)
- [Focused reproductions and current-rules matrix](../artifacts/v2.0-core-rules-audit/README.md)
- [Canonical v1 rules](../../CowardsGameSpec_Full_Consolidated_v1.md)
- [v1.4 Cycle-interleaving amendment](../../CowardsGameSpec_CycleInterleaved_v1.4.md)
- [v1.4 technical architecture](../../CowardsGame_Technical_Architecture_Spec_v1.4.md)

## Notes

- This seed and its proposal are durable inputs, not approval to replace active GSD state.
- Cycle-cap reduction must use the `12/8/6/5/4` ablation ladder; cap 6 is the safest first challenger and cap 4 is a stress test, not the presumed default.
- Backstab scan timing and attacker-facing geometry are independent experiments.
- The expensive service/four-language proof should run only for candidates that survive cheap analytic, micro-scenario, and in-process screening.
