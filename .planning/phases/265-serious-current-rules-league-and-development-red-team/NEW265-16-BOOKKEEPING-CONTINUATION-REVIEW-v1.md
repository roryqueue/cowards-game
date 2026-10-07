---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-10-07T01:28:40Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - packages/strategy-lab/src/league/lean-experiment.ts
  - scripts/run-v1-38-lean-correction.ts
  - scripts/lib/v1-38-lean-correction-retained.ts
  - scripts/lib/v1-38-lean-bookkeeping-continuation.test.ts
  - scripts/run-v1-38-lean-host-stage-v8.test.ts
  - scripts/run-v1-38-lean-baseline.test.ts
diff_base: b45ea833de8f01408bf17617f14906803939e022
source_commit: ee69f881b64d12497b130210bddebc4348460e4d
reviewer_agent: /root/review_265_cap_bookkeeping
independently_reviewed: true
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
status: issues_found
---

# Plan 16: Bookkeeping Continuation Source Review v1

## Summary

Focused independent source review of the approved additive ordinal2 continuation at the stated GREEN commit, after reading the prospective approval, research supplement, checked plan and source summary. Reviewed the six-file diff, exact binding/ordinal admission, extension-aware source/request/setup/authorization joins, pinned failed-baseline custody, historical-prefix elapsed floor, survivor collection and unchanged baseline-own-accepted-FINAL gate. One confirmed retained-accounting defect must be corrected before source passing: diagnostic1 administrative survivors are omitted from the fresh inventory.

The additive binding preserves the prior singleton/policy/caps/cache implementation and limits the new binding to ordinal2 with the exact prior diagnostic root and 30/31 predecessor charge counts. The baseline request and unchanged retained gate still require baseline2's own accepted diagnostic2 check and actual FINAL closure. Historical pins grant custody, not new acceptance. Accounting keeps 62,024,083ms carried at1791335391279, excludes only the separately approved human-idle interval, and advances current ordinal2 closure floors continuously. These observations do not establish full36 fit or an empirical memory cure.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: BLOCKER — Fresh survivor inventory omits diagnostic1 authorization and data-review bytes

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-lean-correction-retained.ts:401-402`; connected consumer `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-lean-correction.ts:687`, `:701`, `:710-712`.

**Issue:** The new historical helper returns the failed baseline1 store/temp/request/allocation and administrative references from the **baseline1** request only. The diagnostic1 request is byte-pinned earlier but never parsed for its distinct administrative references. The connected predecessor collector adds diagnostic1 store/temp/request/allocation/setup, seeds the rest from the older V7 predecessor, and does not add diagnostic1 authorization or data review. Those are standalone files outside the inventoried roots. Fresh allocated-byte accounting therefore omits retained historical work, contrary to the approved unchanged cumulative15GB envelope and all-survivors requirement. An existing conservative reserve is not a substitute for including newly surviving files in the measured inventory.

**Independent bounded evidence:** Read only the explicit finite diagnostic1 closure/request and baseline1 request metadata through the existing descriptor-based byte reader, validating the closure against the new binding's raw pin, the diagnostic request against that pinned closure's request digest, and the baseline request against its exact raw pin. `lstat` of the diagnostic references established regular non-symlink survivors:

| Omitted diagnostic1 survivor | Actual allocated bytes |
| --- | ---: |
| `.strategy-lab/lean-retry-authorization-diagnostic-v8-1.json` | 4096 |
| `.planning/phases/265-serious-current-rules-league-and-development-red-team/NEW265-16-TWENTY-HOUR-DIAGNOSTIC-1-DATA-REVIEW-v1.md` | 8192 |

The pinned baseline1 request references its separate baseline authorization and baseline data review, not these diagnostic files. Its source review/setup references are shared and already included, so they are not counted as additional omissions. A bounded read of the exact pinned V7 canonical allocation confirmed neither omitted target is covered by its predecessor survivor roots. The resulting confirmed omission is **at least12,288 allocated bytes**. No old ordinary reader, result/Chronicle/Strategy payload or full history scan was used.

**Fix:** Collect the surviving administrative references from **both** exact pinned historical requests—authorization, setup, source review and data review—alongside both route roots. Treat these references strictly as inventory custody, never as old execution grants or acceptance. Pass the combined identities through the existing deduplicated inode-safe measured inventory so shared files are charged once and the distinct diagnostic files are debited. Preserve the old binding branches, new ordinal2-only transition, failed-baseline status and current diagnostic2 accepted-FINAL requirement. Add an inert regression with disjoint diagnostic/baseline authorization and data-review paths plus shared setup/source-review paths; assert complete identity coverage and exact unique allocated-byte debit, rather than checking only that baseline store/temp/auth are present.

### Independent checks and limits

- Narrow inert continuation tests passed **30**, with **1 intentionally unselected** source-manifest case: `pnpm exec vitest run scripts/lib/v1-38-lean-bookkeeping-continuation.test.ts --maxWorkers=1 -t 'admits only|rejects changed|admits fresh|does not authorize|refuses historical|counts every|does not re-add|keeps baseline2|keeps the existing|accepts only|joins finite|refuses unsafe'`.
- Scoped diff whitespace check passed. The six reviewed source/test paths were clean and matched the stated GREEN commit at review; subsequent fixes belong to a later review, not this immutable failure report.
- The author's90 selected passes /57 unselected, configured lab typecheck and1414-file zero-violation source boundary scan are author-reported, not independently rerun here. Passing existing tests does not cover the confirmed missing-survivor debit.

## Review boundary

Only this review artifact was written. No source, prior review, request, allocation, store, payload, historical artifact or source manifest was modified. No empirical/provider/Strategy/Match/native route, historical ordinary retained reader or full history scan ran. This report neither authorizes an entry nor grants Phase265/LEAG/freeze/holdout/public/counted/production credit; MAIN retains the separately approved single fresh pair and all source/data/capacity/terminal gates. The source defect must be fixed and independently re-reviewed before a clean source handoff.

---

_Reviewer: /root/review_265_cap_bookkeeping (gsd-code-reviewer)_
_Result: issues_found; one confirmed BLOCKER, with no empirical RSS-cause/cure claim._
