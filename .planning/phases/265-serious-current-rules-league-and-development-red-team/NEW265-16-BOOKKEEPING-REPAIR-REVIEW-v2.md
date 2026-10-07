---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-10-07T00:00:41Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - packages/strategy-lab/src/league/lean-experiment.ts
  - scripts/lib/v1-38-lean-admitted-cap-cache.test.ts
diff_base: c04de227ef7336ff8fd33e7d17209a4d5bacecc8
source_commit: 8b143b29c587b9ce429118af4961da14ec9c3d72
author_agent: /root/fix_265_cap_bookkeeping
reviewer_agent: /root/review_265_cap_bookkeeping
independently_reviewed: true
resolved_findings: [CR-01]
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
status: issues_found
---

# Phase 265: Bookkeeping Repair Source Re-review v2

## Summary

Narrow independent review of the actual correction commit and its new accessor/proxy regressions. REVIEW-v1 remains unchanged. CR-01 is resolved: the eligibility check rejects proxies before reflection, rejects nonstandard prototypes and accessor descriptors, and gates cache registration only after existing full admission and equality checks. Unchanged ordinary admitted diagnostic/baseline identities still reuse their caps. However, the new eligibility recursion is not cycle-safe or bounded; a canonically accepted hidden self-reference causes admission to crash instead of falling back to uncached historical behavior.

Independent filtered metadata tests passed: `pnpm exec vitest run scripts/lib/v1-38-lean-admitted-cap-cache.test.ts --maxWorkers=1 -t 'accessor-backed survivors|remain outside cache eligibility|repeated admitted diagnostic reads|repeated admitted baseline reads'` — 9 passed, 13 intentionally unselected. These include the original getter failure, proxy exclusions and ordinary cache-hit parity. Scoped diff whitespace check passed. The author's broader 22 focused / 25 selected / 61 unselected and lab-typecheck results were not independently rerun here.

This report is source-only, not a full Phase 265 audit, manifest/source admission, empirical feasibility finding, RSS-cause/cure claim or execution authorization. Only this review artifact was written; no source, previous review, retained data, store, allocation or ordinary reader was changed or executed.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-02: BLOCKER — Hidden cycles overflow the new cache-eligibility traversal

**File:** `/Users/roryquinlan/runtime/cowards-game/packages/strategy-lab/src/league/lean-experiment.ts:852-854` (called during admission at `:868`)

**Issue:** `immutableRetryData` recursively traverses every own data descriptor without cycle detection or a traversal budget. Canonical validation does not bound this entire graph: array encoding examines numeric elements and ignores extra array properties, while `freezeLabValue` traverses enumerable string-keyed values. A non-enumerable array data property pointing back to that array therefore survives construction and freezing, is absent from the canonical representation, and reaches the new recursive checker. The checker loops until it throws `RangeError`, turning an optimization-only eligibility check into an admission failure. Symbol-keyed cycles and arbitrarily deep hidden frozen graphs are also outside the canonical traversal's safeguards. Unsafe metadata must remain uncached, not crash admission.

**Independent reproduction:** Use an otherwise valid extended v8 diagnostic fixture with an ordinary one-element `predecessor.survivors` array. Before constructing the allocation, execute `Object.defineProperty(survivors, "hidden", { value: survivors, enumerable: false, configurable: true })`. Recompute the predecessor root and construct the allocation. `Object.isFrozen(survivors)` is `true`, and `leanCanonicalBytes(allocation)` succeeds. Calling `admitLeanAllocation(allocation)` now throws `RangeError: Maximum call stack size exceeded`. This was reproduced with a small in-memory metadata-only `tsx` invocation; no filesystem, Strategy, provider, Worker or Match dispatch occurred.

**Fix:** Make cache eligibility bounded and cycle-safe. Detect revisiting an active object and return `false`, and enforce conservative depth/node limits so hidden graphs cannot overflow the stack. Exhausting any eligibility limit must return `false` and preserve the existing uncached full-admission behavior. Keep proxy rejection before reflection and descriptor-only inspection without invoking getters. Add non-enumerable and symbol-keyed self-cycle regressions plus a hidden depth-limit case; verify they remain uncached without throwing, while ordinary admitted immutable data retains its cache hit. Do not change cap constants, historical canonical bytes, authorization checks or allocation admission semantics.

---

_Reviewer: /root/review_265_cap_bookkeeping (gsd-code-reviewer)_
_CR-01 resolved; CR-02 requires correction before the source repair is clean._
