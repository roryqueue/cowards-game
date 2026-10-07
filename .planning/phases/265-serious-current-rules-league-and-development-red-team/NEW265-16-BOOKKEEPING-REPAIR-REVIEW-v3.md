---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-10-07T00:05:00Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - packages/strategy-lab/src/league/lean-experiment.ts
  - scripts/lib/v1-38-lean-admitted-cap-cache.test.ts
diff_base: 8b143b29c587b9ce429118af4961da14ec9c3d72
source_commit: 6ca2f82dd0548c96d2a822e14300f29092962a0a
author_agent: /root/fix_265_cap_bookkeeping
reviewer_agent: /root/review_265_cap_bookkeeping
independently_reviewed: true
resolved_findings: [CR-01, CR-02]
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
status: issues_found
---

# Phase 265: Bookkeeping Repair Source Re-review v3

## Summary

CR-01 remains resolved, and CR-02 is resolved: the iterative eligibility check rejects proxies before reflection, examines only own data descriptors, conservatively rejects repeated objects, bounds depth/nodes/property work, and requires every array index to be an own data property. Hidden/symbol cycles and large/deep hidden graphs now preserve historical uncached admission rather than overflowing. Dense own-index checks also prevent mutable inherited array elements from qualifying. However, cache registration still chooses extension authority with the inherited-property `in` operator, allowing a prototype property to produce a cached cap inconsistent with the authenticated allocation.

Independent `pnpm exec vitest run scripts/lib/v1-38-lean-admitted-cap-cache.test.ts --maxWorkers=1` passed 26/26. Scoped diff whitespace check passed. The author's selected existing 25 passing / 61 unselected tests and configured lab typecheck were not rerun here. An additional small, isolated metadata subprocess independently reproduced CR-03 and removed its temporary prototype property in `finally` before exiting.

REVIEW-v1 and REVIEW-v2 are preserved. This is narrow source review only, not full Phase 265 certification, source-inventory/admission, an empirical RSS-cause/cure claim, or authorization to execute any route. No source, previous artifact, private payload, historical record, allocation or store was modified; no ordinary reader, native/Worker/provider/Strategy/Match execution occurred.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-03: BLOCKER — Inherited extension property grants an unauthenticated cached 20-hour cap

**File:** `/Users/roryquinlan/runtime/cowards-game/packages/strategy-lab/src/league/lean-experiment.ts:896`

**Issue:** V8 reconstruction authenticates an extension only when it is an own property (`:830`), but cache registration selects the extended cap using `"timeboxExtension" in expected`. The strict eligibility check verifies own descriptors and allows ordinary `Object.prototype`; it does not prove inherited optional properties are authenticated. A non-enumerable inherited counterfeit extension therefore passes construction, root equality and eligibility and causes the registered identity to receive the 20-hour cap, although its canonical allocation has no extension and declares the 16-hour cap. Unlike the existing uncached branch (`:1526`), the cache hit never validates that inherited extension. The wrong cap remains cached after the prototype property is removed.

**Independent reproduction:** Construct a valid nonextended v8 diagnostic fixture, then in a one-shot metadata subprocess define `Object.prototype.timeboxExtension` as a non-enumerable configurable data property containing `{ fake: true }`. Fully admit the allocation and read its cap. Results: `Object.hasOwn(admitted, "timeboxExtension") === false`; `admitted.caps.elapsedMs === 57600000`; `leanCapsForAllocation(admitted).elapsedMs === 72000000`. Calling the cap helper on a JSON clone instead throws `LEAN_EXPERIMENT_RETRY_TIMEBOX`. Delete the prototype property in `finally`; the cached identity still returns `72000000`, whereas a newly fully re-admitted identity returns `57600000`. This isolates a new cached-policy mismatch without altering the shared test harness or any retained data.

**Fix:** Derive the cached cap exclusively from the authenticated own data, for example replace the registration predicate with `Object.hasOwn(expected, "timeboxExtension")`, or use the fully authenticated own `expected.caps`. Keep the existing uncached admission/validation behavior unchanged. Add an isolated, cleanup-safe regression for a nonextended allocation under a counterfeit inherited extension: registration must never give that identity the extended cap, and it must remain at 16 hours after the inherited property is removed. Preserve the valid own-extension 20-hour cache-hit tests and all unsafe-object fallback regressions.

---

_Reviewer: /root/review_265_cap_bookkeeping (gsd-code-reviewer)_
_CR-01 and CR-02 resolved; CR-03 requires correction before the source repair is clean._
