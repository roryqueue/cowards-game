# Phase 21: Ladder Scheduling and Standings - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-19
**Phase:** 21-Ladder Scheduling and Standings
**Areas discussed:** Scheduling Shape, Scheduling Trigger and Cadence, Counted Result Policy, Standings Projection and Tie-breakers, Retry and Degraded Handling

---

## Scheduling Shape

Selected: small deterministic round-robin pods, targeting 4-player pods. Leftovers wait for the next scheduling run with visible pending status. Pod assignment uses season seed plus stable entry identifiers/snapshot hashes.

Alternatives considered: seeded pairings, Swiss-style batches, manual operator pods, 3-player pods, 6-player pods, variable pods, head-to-head leftovers, operator-decided leftovers, created-at ordering, hash-only ordering, operator seed per run.

## Scheduling Trigger and Cadence

Selected: hybrid trigger model. Operators trigger scheduling manually in v1.3; a periodic job can later call the same deterministic scheduler. Periodic path assumes daily beta cadence. Each run creates as many full pods as possible. Re-running with no eligible full pods is an idempotent no-op.

Alternatives considered: admin-only, periodic-only, entry-count threshold trigger, hourly cadence, weekly cadence, configurable-only cadence, one pod per run, operator-chosen count, configurable cap, duplicate pod creation, rebalance existing pods, confirmation warning.

## Counted Result Policy

Selected: only complete, valid, evidence-backed MatchSets count. Non-counted MatchSets remain visible with public reasons. Strategy failures count as entrant penalties; system failures never become player losses. Unresolved exhausted system failure makes a MatchSet non-counted/degraded.

Alternatives considered: partial completion, worker-complete-only counting, manual counted marking, hiding or deleting non-counted MatchSets, no runtime penalties, visible-but-not-counted penalties, repeated-failure-only penalties, partial Match counting, draws for missing evidence.

## Standings Projection and Tie-breakers

Selected: standings are recomputed projections from counted evidence, with optional cache. Existing v1.2 points policy is primary score. Tie-breakers are points, wins, surviving Soldiers, survival turns, stable Strategy/entry id. Public UI shows compact breakdown and evidence links.

Alternatives considered: mutable standings table, append-only standings events, page-load-only compute, win percentage, pod placement points, survival score, head-to-head first, fewest penalties first, strength of schedule, formula-only panel, rank/points-only UI, raw ledger first.

## Retry and Degraded Handling

Selected: retries happen before counted/non-counted classification. Retry state is visible but not noisy. Public non-counted/degraded reasons use a small taxonomy. Exhausted retries preserve evidence and exclude the MatchSet from standings until valid complete counted evidence exists.

Alternatives considered: retry after standings update, manual-only retries, no retries, hidden retry state, public retry ledger, admin-only retry state, exposing internal failure codes, generic not-counted-only reason, admin-written reason only, partial evidence counting.

## the agent's Discretion

- Choose exact enum names for public degraded/non-counted reasons.
- Choose scheduler result object shape.
- Decide whether standings cache is necessary in Phase 21.

## Deferred Ideas

- Variable pod sizes.
- Swiss-style scheduling.
- Advanced tie-breakers.
- Fully automated scheduling.
- Governance invalidation workflow.
