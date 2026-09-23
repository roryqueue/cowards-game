---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-09-23T04:56:02Z
depth: deep
reviewed_commit: 0c0178de
diff_base: df9d8280^
files_reviewed: 4
files_reviewed_list:
  - scripts/run-v1-38-serious-league.ts
  - scripts/run-v1-38-serious-league.test.ts
  - packages/strategy-lab/src/league/allocation.ts
  - packages/strategy-lab/src/league/allocation.test.ts
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
status: issues_found
empirical_authority: false
---

# Phase 265 Plan 07: Capacity-memory code re-review

**Reviewed:** 2026-09-23T04:56:02Z  
**Depth:** deep  
**Files reviewed:** 4  
**Status:** issues_found

## Summary

The two repair commits close the source-level defects identified as CR-01 and WR-01 in the historical review. A shared 1 GiB minimum now rejects lower data-only plans and receipts and is checked at receipt admission and live dispatch. The Darwin adapter uses a no-shell, C-locale, 200 ms `spawnSync` request with `SIGKILL`, rejects command errors, and wipes its owned output buffers. The new tests cover the floor boundaries and injected command/timeout behavior. No new source-level security, accounting, or contract defect was established in the changed paths.

CR-02 remains a **BLOCKER** for empirical use. Both repair commits alter the reviewed source inventory, but the published allocation and its dependent capacity/packet lineage have not been regenerated. A current admission fails closed; the historical allocation cannot authorize Task 3.

## Prior-finding disposition

- **CR-01 — closed in source:** `allocation.ts:227,235,244,273` requires at least `2 ** 30` bytes, and `run-v1-38-serious-league.ts:600` enforces that floor at dispatch. The direct boundary cases are in `allocation.test.ts:137-140`. The normative handoff still describes only “positive explicit process headroom”; reconcile that wording during source-bound regeneration, but it does not create a lower-threshold code path.
- **CR-02 — open:** see the critical finding below. Source repair alone is not lineage repair.
- **WR-01 — closed in source:** `run-v1-38-serious-league.ts:264-273` passes `killSignal: "SIGKILL"`, rejects a returned timeout/error, and zeroes returned buffers; the injectable adapter test at `run-v1-38-serious-league.test.ts:58-68` checks those options and failure handling. This is a bounded direct-child strategy, not a claim that any operating-system command has an absolute wall-clock guarantee.

## Narrative Findings (AI reviewer)

### Critical Issues

#### CR-02: Published allocation and dependent capacity lineage are stale

**Classification:** BLOCKER  
**File:** `scripts/run-v1-38-serious-league.ts:241-247` (affected artifact: `.planning/artifacts/v1.38-phase-265-allocation.json`)  
**Issue:** `leagueCurrentSourceIdentity()` hashes the current source inventory, which includes the repaired runner and allocation module. At this review it returns implementation/source roots `sha256:cedd42f36589fd01d2768ee78d2443524941aec3ed4a35a29197a3b7b3bf0b58` / `sha256:d55a60cfaebfb87221afcb4ee907b60db25bf9473e18e28c39d215174e1bc008`. The committed allocation still binds `sha256:67d8f60e2691582d2d4e7f8d5f7ba52deb5a1ec65784111161f3adeb85ba7049` / `sha256:32465649b2c9727c116a6bb2e661315f0e7eea256db58b7afa421a4acf836fe9`. `prepareProspectiveSeriousLeague` and `prepareLeagueRunInputs` therefore reject the published allocation before host observation; this fail-closed behavior is correct, but the old allocation root, packet disclosures, witness/source-bound capacity plan, and earlier proof cannot be treated as current authority.

**Fix:** After final source review and the complete approved Phase 265 source-validation gate, revalidate or rebuild each source-bound packet disclosure and measurement witness, then rebuild the amendment, allocation, and data-only capacity plan from the exact S01/S03/S05 historical preparation path. Publish their new roots and reconcile the 1 GiB minimum in the handoff. Only then attempt a fresh same-process receipt and the single authorized run; do not refresh an old receipt or retry a consumed allocation.

## Source-bound validation status

This was a source-only re-review. Seven selected capacity/parser tests passed across the two test files; 75 unrelated tests were skipped. I computed the current source identity and read the committed allocation, but did not run the complete Phase 265 gate, private boundary scans, packet revalidation, live `memory_pressure`, preflight, provider, Strategy, or Match execution. No source file or historical review was modified, and this report does not confer empirical authority.

---

_Reviewed: 2026-09-23T04:56:02Z_  
_Reviewer: gsd-code-reviewer_  
_Depth: deep_
