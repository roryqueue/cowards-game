---
phase: 263
plans: [263-01, 263-06, 263-07]
status: approved_pending_review
approved: 2026-09-13
operator_response: yes
maximum_fresh_attempts: 1
attempts_started: 0
attempts_remaining: 1
---

# Approved pre-search timing calibration

The operator answered **yes** to the proposal: selection p99 strictly below **20 ms**, SoldierBrain p99 strictly below **5 ms**, every other limit unchanged, then **one fresh bounded attempt**, with Matches only after validation and timing pass. This is a prospective revision of D-14 and existing Plans01/06/07, not retroactive credit, a game-rule change, or a new numbered plan/custody chain.

## Rationale and preserved history

The last bounded run measured selection p99 14.171262 ms and SoldierBrain 1.732708 ms. Selection improved from 64.135270 ms through behavior-preserving source optimizations. All four historical Phase263 runs remain non-pass under their original strict 5 ms gate. The original allocation and exhausted three-attempt envelope are immutable and cannot be reused. This explicitly disclosed calibration happens before factory/league search, not after competitive or formation outcomes. A fresh measurement is required; the previous 14.171262 ms result is not newly admitted evidence.

## Exact execution plan

1. Revise the private protocol to version2 with explicit per-method thresholds. Prove strict boundary rejection at 20 ms selection and 5 ms brain with pure/injected tests. Preserve candidate source, corpus/order, observer, percentile/rank, runtime and every budget. Independently review the delta before preparation.
2. Use fresh manifest `263-feasibility-calibration-1-manifest.json` in this phase directory and private output `.strategy-lab/phase263-feasibility-calibration-1`, with separate review `263-CALIBRATION-REVIEW.md`. No clobber or old destination reuse. Reserve once before preparation; exactly one run, zero internal retries.
3. Run all 256 fixed validation cases (232 guest calls plus 24 expected pre-runtime rejects on full pass), then 100 warmups and 1000 measured calls per method: 2200 benchmark calls. Use unchanged nearest-rank p99, sample990, direct trusted method observer, exact corpus traversal, fresh inputs/memories and hardware class. Both timing predicates must pass before Matches.
4. Only full validation/timing pass permits the existing 24-Match allocation: one candidate against the fixed Advanced fixture, 12 label tasks per pass but eight scientific cells, baseline1worker/shard1/forward then reproduction2workers/shard3/reversed. Preserve checkpoint after six complete baseline tasks, zero-inflight restart, and completed-inventory resume with zero redispatch. No unused historical Match slots roll forward.
5. Keep 120000 ms/Match, 3600000 ms outer run including build/startup/cleanup, 2 CPU/256 MB container, selected 1000 ms/method runtime, maxPhases100, 597656 total invocation ceiling, beam4/256expansions, brain64 optional evaluations plus nine reserved Actions, all source/memory/objective/output bounds. Retain all private traces, review eight geometry-distinct baseline starts and every failure, and require byte-identical scientific reductions.
6. Read-only verification rederives the result before further source edits. Independently close validation/UAT/goal-verification records. Full pass enables ordinary Phase264 GSD work; non-pass exhausts this one-run authority and requires an operator decision before another run or further changed limit.

Canonical engine, rules, formations, legal-information boundaries, privacy, accounting and cleanup remain unchanged. No factory scale before Phase263 passes; no formation before Phase266 freeze; no holdout opening, public/counting/production or rules authority is granted. All historical receipts, manifests, authorization bytes and 36 locks are preserved. Historical verification uses its historical source/protocol, never rewritten manifests.

## Outcome

Not run. No pass is inferred from approval or source tests.
