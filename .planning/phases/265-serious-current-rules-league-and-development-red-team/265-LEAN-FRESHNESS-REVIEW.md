---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "07"
task: "2-lean-amendment"
reviewed: 2026-09-22T12:09:30Z
scope: source-only-prospective-receipt-freshness-and-dispatch-order
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
status: issues_found
empirical_authority: false
---

# Phase 265: Lean Freshness and Pre-dispatch Review

## Narrative Findings (AI reviewer)

### CR-01: Mandatory retained verification can deterministically expire the prospective receipt before reservation

**Classification:** BLOCKER

**Files:**

- `scripts/run-v1-38-serious-league.ts:200-224`
- `scripts/run-v1-38-serious-league.ts:259-278`
- `scripts/run-v1-38-serious-league.ts:541-565`
- `packages/strategy-lab/src/league/allocation.ts:112,196-222`
- `packages/strategy-lab/src/league/contracts.ts:86-106`

**Issue:** The approved receipt is valid for at most 300,000 ms
(`allocation.ts:112,200-221`). In the
standalone `preflight` path, `readLeagueInitialCandidates()` performs retained
historical assessment verification before the caller-provided receipt is
admitted against a current host observation. In the standalone prospective
`run` path, the code admits the receipt first, then performs that same retained
reader, then admits it again immediately before reservation. Thus all required
retained work lies inside the receipt's freshness window.

That reader is intentionally expensive and unbounded by the receipt age: it
first calls `verifyHistoricalFactoryAssessmentForLeague` for each assessment
(`run-v1-38-serious-league.ts:203`), then
`importAssessedFactoryCandidate` invokes the same complete verification once
per base (`:216`; `league/contracts.ts:88-91`). For the three-base prospective
route, the current code therefore executes the complete retained assessment at
least four times before a provider is available. A healthy, unchanged retained
repository whose required reopen exceeds five minutes consequently makes a
fresh, otherwise valid capacity receipt expire before `reserveRun()`; moving
the caller's measurement earlier cannot solve it.

This contradicts the amendment's intended sequence: receipt admission is
repeated immediately before durable reservation, while host free-space and
memory checks remain active before charged dispatch
(`265-LEAN-AMENDMENT.md:93-100`). The decision requires a fresh successful
receipt before the allocated run, not that bounded retained validity work must
fit inside the host-observation age (`265-07-PLAN.md:96-99`).

**Fix:** Do not lengthen the 300,000 ms age, trust a persisted verification
cache, cache providers, or relax any historical import check. Instead factor
the prospective execution boundary into one process with two distinct phases:

1. Perform all static/read-only work first: exact allocation and source
   admission, the full historical reader/import for S01/S03/S05, candidate
   closure checks, response-authoring packet checks, output-directory and
   empty-run-repository checks. Keep the resulting candidates only in local
   process memory; never serialize them as a new authority or accept them from
   a caller.
2. Immediately after that work, capture the actual host observation, construct
   and admit the receipt from the rooted data-only cost inputs and that fresh
   observation, create the allocation-only reservation, and attach the exact
   resulting receipt/observation to `run-start`. Then retain the existing live
   free-space/memory guard before every charged dispatch and invocation.

The `preflight` API should likewise validate static retained inputs before its
fresh host measurement is captured. A separately emitted rooted receipt must
not authorize a later standalone prospective `run` that repeats the expensive
reader. Provide an explicit one-process prospective preflight-and-reserve/run
entry point (the V1 `prepare`, `run`, and `verify-retained` APIs remain
unchanged), or make the prospective run accept the data-only capacity plan and
derive its receipt only after its own static verification. This preserves the
one-way root DAG and concrete receipt root without inventing a result-cache
authority.

Add source-only timing-seam regressions that make static retained validation
advance past 300,000 ms: pre-existing/obsolete receipt data must not reach
reservation, while the same static validation followed by a fresh host
observation can reserve exactly once. Assert the fresh receipt binds the same
allocation/amendment/source/history/cost roots, and that a later live disk or
memory drop still stops before provider issuance.

## Provider-path check

The expensive historical assessment is not in the per-Match provider path.
After initial admission, `LeagueConnectedSession.execute()` passes the
already-built candidates to `issueLeagueProviderFromFactoryCandidate`.
`connected-runner.ts:59-100` re-admits the candidate closure/source and issues
the host provider, but has no call to
`verifyHistoricalFactoryAssessmentForLeague` or
`importAssessedFactoryCandidate`. That per-Match closure check should remain;
the proposed correction targets only the pre-reservation order.

No empirical preflight, receipt, allocation, provider/model work, Match,
holdout access, or source edit occurred during this review.

_Reviewer: independent source-only freshness diagnostic_
