---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-10-06T23:58:00Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - packages/strategy-lab/src/league/lean-experiment.ts
  - scripts/lib/v1-38-lean-admitted-cap-cache.test.ts
diff_base: 1b5f59d62704cf6672b4ba2953925ddede8a9957
source_commit: c04de227ef7336ff8fd33e7d17209a4d5bacecc8
author_agent: /root/fix_265_cap_bookkeeping
reviewer_agent: /root/review_265_cap_bookkeeping
independently_reviewed: true
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
status: issues_found
---

# Phase 265: Bookkeeping Repair Source Review

## Summary

Independent narrow review of the seven additive production lines and new inert metadata tests between the stated base and GREEN commit. Read the repair research plan and checked plan, traced v8 reconstruction, canonical value hashing, recursive freezing, cap selection and retained/full-admission consumers. The cache registers only the reconstructed v8 identity after successful equality checks and does not change cap constants or legacy branches. However, the required deep-immutability premise is false for accessor-backed array elements, allowing a cached allocation to change after admission.

This is source-only review, not source-inventory regeneration, admission approval, execution authority, or Phase 265 completion. It makes no empirical RSS-cause or cure claim. No source files, historical records, private payloads, allocations, stores or ordinary readers were modified or executed. Existing 17 focused and 25 selected passing tests are author-reported; they were not rerun here. A small in-memory metadata reproduction was run independently, and the scoped diff whitespace check passed.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: BLOCKER — Cache trusts a recursively frozen allocation that can still change through array accessors

**File:** `/Users/roryquinlan/runtime/cowards-game/packages/strategy-lab/src/league/lean-experiment.ts:856` and `:1483-1484`

**Issue:** The cache assumes the reconstructed `expected` object cannot change after admission. Yet v8 reconstruction retains the caller's predecessor reference (`:841`), and `freezeLabValue` (`packages/strategy-lab/src/contracts.ts:5-9`) visits current child values and freezes containers without rejecting accessors. Canonical encoding rejects accessor properties on ordinary objects, but its array branch reads indexed values directly (`packages/spec/src/canonical-json-encode.ts:252-266`). An array accessor may therefore survive both canonical admission and freezing. Its closure can later return a different survivor object even though all containers and the previously returned survivor are frozen. Full allocation admission then rejects the changed predecessor, but the new identity-cache hit accepts that same invalid allocation without revalidation. This violates the explicit requirement to register only genuinely deeply immutable objects; a fresh root or clone is not required to bypass the retained validation.

**Independent reproduction:** Create an otherwise valid extended v8 diagnostic allocation with `predecessor.survivors` containing an enumerable accessor at index `0` returning a closure variable initially set to `{ identity: ".strategy-lab/inert-cap-review", allocatedBytes: 4096 }`. Construct and fully admit it. `Object.isFrozen(admitted)`, `Object.isFrozen(survivors)` and `Object.isFrozen(originalSurvivor)` are all `true`; the numeric descriptor still contains `get`. Reassign the closure variable to a survivor with `allocatedBytes: 0`. The admitted allocation now exposes that changed value; `leanCapsForAllocation(admitted)` returns `72000000`, while `admitLeanAllocation(admitted)` throws `LEAN_EXPERIMENT_RETRY_PREDECESSOR`. This was reproduced without filesystem, provider, Worker, Strategy or Match dispatch.

**Test gap:** `scripts/lib/v1-38-lean-admitted-cap-cache.test.ts:22` checks only the current values of a recursive traversal. Its deep-freeze and mutation tests (`:42-49`, `:88-109`) use ordinary data arrays and cannot prove the accessor-free invariant assumed by the cache.

**Fix:** Preserve historical admission behavior, but condition cache registration on a strict, bounded descriptor/proxy eligibility check of the entire returned subtree: recursively frozen plain data objects/arrays only, no accessors and no proxies. Objects failing that eligibility check must remain uncached, so cap reads continue through the existing full-admission path. Do not invoke getters during eligibility inspection, weaken key/root/equality checks, or change cap selection. Add the above closure-backed numeric-array-accessor regression: the initial full admission may retain its previous behavior, but after the closure changes the cap API must miss the cache and reject the invalid predecessor. Also cover proxies and normal admitted data retaining the cache hit. A detached canonical snapshot is another possible design, but it changes historical admission semantics and is not needed for this narrow correction. Preserve the existing identity-only, mutable/clone, extension, legacy and explicit-full-admission regressions.

---

_Reviewer: /root/review_265_cap_bookkeeping (gsd-code-reviewer)_
_Result: source repair requires correction; no new empirical route authorized by this report._
