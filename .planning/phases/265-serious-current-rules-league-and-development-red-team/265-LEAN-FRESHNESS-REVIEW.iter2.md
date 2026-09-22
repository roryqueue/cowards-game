---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "07"
reviewed: 2026-09-22T12:27:47Z
reviewed_head: d35e58d218f53c07218bb33608b14d4fd0fd5398
diff_base: dbda8c04b0cf1c23be588ffc0382bc3d625e71fb
scope: narrow-source-only-freshness-fix-rereview
files_reviewed: 4
files_reviewed_list:
  - packages/strategy-lab/src/league/allocation.ts
  - packages/strategy-lab/src/league/allocation.test.ts
  - scripts/run-v1-38-serious-league.ts
  - scripts/run-v1-38-serious-league.test.ts
documentation_reviewed:
  - 265-LEAN-FRESHNESS-REVIEW.md
  - 265-LEAN-FRESHNESS-REVIEW-FIX.md
  - 265-LEAN-AMENDMENT.md
  - 265-07-PLAN.md
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: clean
empirical_authority: false
---

# Phase 265: Freshness Fix Independent Re-review (Iteration 2)

## Scope and method

Reviewed only the freshness correction at `d35e58d218f53c07218bb33608b14d4fd0fd5398`, including its four changed source/test files and the connected receipt/reservation boundary.  Compared `dbda8c04..HEAD`, inspected the prior blocker and correction report, and ran `git diff --check`.  This was source-only: no empirical preflight, capacity measurement, provider, Match, allocation, or full validation gate was run.

## Resolution of prior CR-01

**Resolved — technical independent review passed.** The previous deterministic-expiry defect is removed without changing the 300,000 ms age limit. `LeagueCapacityPlanInput` is runtime exact-key admitted and contains only the rooted data-only inputs: it excludes receipt root/schema, timestamps, filesystem device/free bytes, and available memory. The existing receipt is still constructed and admitted with a real host observation after static work.

For prospective `run --capacity-input`, `prepareLeagueRunInputs()` completes allocation/source admission, retained historical candidate import, closure validation, authoring-packet validation, output binding, and journal inspection before `measureProspectiveCapacity()` observes the host. The candidates are returned only in local process memory; no static result, historical verification, or provider cache is persisted or caller-accepted. The fresh receipt is then re-admitted in the connected-session construction immediately before the allocation-only reservation; no historical reader is repeated in that freshness interval. `run-start` retains the constructed receipt and first fresh observation.

The standalone `preflight` path uses the same static preparation before its host observation and returns a receipt without reservation. Conversely, `--capacity-receipt` retains its strict before-and-after-static admission: it is never converted into a plan or refreshed. The CLI rejects the two forms together, and legacy V1 branches remain receipt-free and reject both prospective capacity flags.

The focused timing seam advances static work beyond 300,000 ms and covers fresh plan/preflight success, stale supplied-receipt failure, static failures before host observation, insufficient/unavailable host failure before reservation, live disk/memory stop, and reservation-crash consumption. It also asserts different fresh host device/free-space/memory values, plan/receipt exclusivity, and exact receipt binding. No changed numerical capacity bound, live free-space/memory guard, allocation-only reservation key, or final gate was found.

## Narrative Findings (AI reviewer)

None. No actionable correctness, security, or test-reliability defect was found in this narrow correction scope.

## Limits of this verdict

This is an independent technical source review of the freshness fix only, not human UAT, an empirical capacity receipt, an empirical run, or full Phase 265 completion. The required complete validation gate and the approved conditional Task 3 remain outside this review.

---

_Reviewer: independent source-only reviewer_
_Reviewed head: `d35e58d218f53c07218bb33608b14d4fd0fd5398`_
