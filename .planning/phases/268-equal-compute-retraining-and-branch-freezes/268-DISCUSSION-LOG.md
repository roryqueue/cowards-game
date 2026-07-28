# Phase 268: Equal-Compute Retraining and Branch Freezes - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-27
**Phase:** 268-equal-compute-retraining-and-branch-freezes
**Areas discussed:** equal-opportunity accounting, cold and warm starts, model/human symmetry, branch isolation, consumption audit, branch freeze

---

## Milestone-wide recommendation batch

The user asked for strong recommendations for all v1.38 phase discussions in one batch, with option comparisons only where uncertainty was significant. The batch included the Phase-268 recommendation to use opportunity-vector equality, cold-root primary evidence, separately equal warm-start sensitivity, common model/human pools, counterbalanced/blinded review, symmetric restart on provider identity loss, and fail-closed consumption audits.

| Option | Description | Selected |
|--------|-------------|----------|
| Approve the entire recommendation batch | Lock the presented recommendations for every phase and create the context and discussion-log artifacts. | ✓ |
| Approve with exceptions | Name a phase and the decision that should change. | |
| Request a focused option comparison | Compare alternatives only for a remaining area with significant uncertainty. | |

**User's choice:** `1` — approve the entire recommendation batch.
**Notes:** No Phase-268 exception or additional comparison was requested. The remaining implementation uncertainties are assigned to the named contained spikes and do not relax the approved policy.

---

## the agent's Discretion

- After the required spikes, choose internal modules, schema names, deterministic shard and worker settings, cache layout, numeric encoding, and CLI names.
- No discretion exists to scalarize equal opportunity, pad work, allow arm-local substitutions or retries, reuse learned cross-branch state, alter frozen classifiers, or open the holdout early.

## Deferred Ideas

- Holdout opening, causal decision, and current-only certification are Phase 269.
- Rule changes and combined experiments remain later separately approved work.
