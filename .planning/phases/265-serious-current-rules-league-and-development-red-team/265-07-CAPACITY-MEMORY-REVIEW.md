---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-09-23T04:50:50Z
depth: deep
reviewed_commit: df9d82804ef0e04f81e30be1923772a22d5bdf97
diff_base: df9d8280^
files_reviewed: 2
files_reviewed_list:
  - scripts/run-v1-38-serious-league.ts
  - scripts/run-v1-38-serious-league.test.ts
findings:
  critical: 2
  warning: 1
  info: 0
  total: 3
status: issues_found
empirical_authority: false
---

# Phase 265 Plan 07: Capacity-memory code review

**Reviewed:** 2026-09-23T04:50:50Z  
**Depth:** deep  
**Files reviewed:** 2  
**Status:** issues_found

## Summary

The Darwin adapter uses the previously reviewed exact `memory_pressure -Q` parser. For ordinary command failures it fails closed: `spawnSync.error` is rejected, and the parser rejects nonzero status, signals, nonempty stderr, malformed/oversized output, invalid UTF-8, and inconsistent page totals. The derived whole-percent byte estimate does not apply Phase 262's separate 25% admission threshold. Focused tests passed (2/2), as did strict TypeScript checking; neither is the required complete Phase 265 source gate. No live `memory_pressure`, preflight, provider, Strategy, or Match command was run in this review.

Two blocking capacity/lineage issues remain. The source also relies on a synchronous timeout that is not a hard wall-clock bound.

## Narrative Findings (AI reviewer)

### Critical Issues

#### CR-01: The 1 GiB host-memory floor is plan-controlled, not frozen

**Classification:** BLOCKER  
**File:** `scripts/run-v1-38-serious-league.ts:600` (cross-module contract: `packages/strategy-lab/src/league/allocation.ts:232,241,270`)  
**Issue:** Both receipt admission and the live dispatch guard compare the new available-memory estimate against `receipt.processHeadroomBytes`. Capacity-plan admission requires only a positive integer; the 1 GiB value appears in the test fixture, not in the admitted policy. A caller can supply `processHeadroomBytes: 1`, obtain a rooted receipt, and pass the live check with far less than 1 GiB (for example, 1% of the test's 16 GiB host is only 171,798,691 bytes). Thus the requested frozen 1 GiB byte gate is bypassable even though the Darwin measurement itself is conservative. This is a pre-existing cross-module weakness exposed by the new observation path; it is not a reason to import Phase 262's 25% threshold. The approved amendment currently says only “positive” headroom, so the authority text and source must be reconciled explicitly before dispatch.

**Fix:** Make the approved prospective capacity contract require at least `2 ** 30` bytes in `admitLeagueCapacityPlanInput`/receipt admission, and compare live observed bytes against at least that same floor (or a stricter explicitly approved plan value). Add cases proving 1 GiB minus one byte refuses, 1 GiB admits, and a lower supplied plan threshold cannot weaken the gate. Re-root the policy/amendment if its bytes change.

#### CR-02: The committed prospective allocation is stale under the repaired source

**Classification:** BLOCKER  
**File:** `scripts/run-v1-38-serious-league.ts:241-247` (affected artifact: `.planning/artifacts/v1.38-phase-265-allocation.json`)  
**Issue:** `leagueCurrentSourceIdentity()` hashes the source inventory, which includes this changed runner. At reviewed commit `df9d8280`, its current implementation/source roots are `sha256:dcdeff45891f000340c048708df483dad1d3a3ed9bd2e1fc0c3c3065e78c3a1f` / `sha256:bd714b497123c7ea4173c3c5bc3251b97ff84c052c37e60d596676b135525a70`; the committed allocation still binds `sha256:67d8f60e2691582d2d4e7f8d5f7ba52deb5a1ec65784111161f3adeb85ba7049` / `sha256:32465649b2c9727c116a6bb2e661315f0e7eea256db58b7afa421a4acf836fe9`. `prepareLeagueRunInputs` therefore rejects that allocation before host measurement, correctly fail-closed, but Task 3 cannot use the published root or its source-bound capacity plan/packet disclosure as though still current. The old focused/full proof predates these bytes.

**Fix:** After this independent source review and any repairs, rerun the complete approved source validation gate. Revalidate/rebuild each source-bound packet disclosure, measurement witness, amendment, allocation, and data-only capacity plan against the final committed source; publish the new allocation root through the exact historical S01/S03/S05 preparation path. Only then attempt a fresh same-process receipt and the single authorized run. Do not refresh an old receipt or retry a consumed allocation.

### Warnings

#### WR-01: `spawnSync` does not make the 200 ms observation a hard timeout

**Classification:** WARNING  
**File:** `scripts/run-v1-38-serious-league.ts:264-269` (coverage gap: `scripts/run-v1-38-serious-league.test.ts:48-57`)  
**Issue:** The adapter passes a 200 ms `timeout` but leaves Node's default `SIGTERM` kill signal. Node documents that `spawnSync` still blocks until the child actually exits after a timeout; a child that handles/ignores `SIGTERM` can stall the one-process run indefinitely, including during the before-dispatch guard. The new timeout test exercises only the pure parser's injected `timedOut` field; production hardcodes that field to `false` and depends on `spawnSync.error`, which is not exercised. The normal timeout/error path does fail closed once `spawnSync` returns, but bounded observation is not proved.

**Fix:** Use a host adapter with an enforceable termination strategy (at minimum an explicit `SIGKILL` timeout for this synchronous invocation), and add an injectable adapter test for the exact executable/arguments/environment, timeout/error/signal/max-buffer results, and buffer zeroing. Keep the strict parser and absence of a shell. See [Node's `spawnSync` timeout contract](https://nodejs.org/api/child_process.html#child_processspawnsynccommand-args-options).

## Source-bound validation status

The reviewed patch changes source identity; the current published allocation and earlier proof are historical, not dispatch authority. This report performed only the focused two-test parser run and strict affected-script typecheck. It did not perform the 29-suite Phase 265 gate, private boundary scans, source-bound packet revalidation, actual host observation, or a real preflight. Those remain required before the approved conditional Task 3 run. No source file or existing `265-REVIEW.md` was modified.

---

_Reviewed: 2026-09-23T04:50:50Z_  
_Reviewer: gsd-code-reviewer_  
_Depth: deep_
