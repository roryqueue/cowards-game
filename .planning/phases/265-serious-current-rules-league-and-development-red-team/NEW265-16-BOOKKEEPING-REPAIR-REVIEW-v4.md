---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-10-07T00:09:43Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - packages/strategy-lab/src/league/lean-experiment.ts
  - scripts/lib/v1-38-lean-admitted-cap-cache.test.ts
  - scripts/check-v1-38-lab-boundaries.ts
  - scripts/check-v1-38-lab-boundaries.test.ts
  - scripts/check-v1-38-factory-boundaries.ts
  - scripts/check-v1-38-factory-boundaries.test.ts
diff_base: 6ca2f82dd0548c96d2a822e14300f29092962a0a
source_commit: 13b2fe13ce5b0677ab5ac44f2df463914b983e7d
author_agent: /root/fix_265_cap_bookkeeping
reviewer_agent: /root/review_265_cap_bookkeeping
independently_reviewed: true
resolved_findings: [CR-01, CR-02, CR-03]
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: clean
---

# Phase 265: Bookkeeping Repair Source Re-review v4

## Summary

No remaining findings in this narrow source-repair scope at the actual commit above. Reviewed the own-extension cache-value correction, retained bounded cache eligibility, the exact-path Node utility allowance in both boundary monitors, and the associated regression tests. Prior issues_found REVIEW-v1/v2/v3 remain unchanged; this report does not erase those historical findings or broaden the original review scope into a full Phase 265 audit.

## Narrative Findings (AI reviewer)

No new BLOCKER or WARNING findings.

### Earlier findings resolved

- **CR-01 resolved:** Registration still occurs only after successful full v8 reconstruction and existing key/root/equality checks. Eligibility rejects proxies before reflection, requires ordinary object/array prototypes and frozen containers, inspects own data descriptors rather than getters, and recursively checks those values. Accessor-backed arrays, transparent proxies, custom prototypes and non-enumerable getters remain uncached. Caller inputs, roots, mutable/shallow/deep-frozen clones and legacy versions do not gain identity-cache authority. Explicit `admitLeanAllocation` remains a full reconstruction path.
- **CR-02 resolved:** Eligibility is iterative and conservatively bounded at depth 32, 4096 object nodes and 4096 property-work units. A WeakSet makes repeated objects/cycles ineligible. Hidden/symbol cycles and large/deep hidden graphs return ordinary cache-ineligible results without overflowing admission. Array length is work-bounded and every numeric index must have an own data descriptor, so a sparse array cannot qualify using mutable inherited elements. Eligibility misses preserve historical full admission and do not alter canonical data or caps.
- **CR-03 resolved:** Cache registration uses `Object.hasOwn(expected, "timeboxExtension")` (`packages/strategy-lab/src/league/lean-experiment.ts:896`). Reconstruction already validates a present own extension. Inherited counterfeit extension data can no longer grant a cached 20-hour cap to a canonically nonextended 16-hour allocation. The isolated subprocess regression proves legacy cap parity both during and after temporary inherited-property exposure, valid own-extension 20-hour behavior, and unchanged rejection on the uncached clone path.

### Boundary-monitor scope

Both global `allowedNode` sets are unchanged. `node:util` receives an exact-source-path exception only for `packages/strategy-lab/src/league/lean-experiment.ts`, matching its private `types.isProxy` eligibility use. Other private package/script owners remain denied, including unreviewed helpers reached transitively. Existing legitimate public/runtime `node:util` imports retain their previous treatment. Public reachability of the private metadata owner is still denied; the allowance does not add process loaders, user Strategy execution or an engine/public import. Existing `node:zlib` exception and denials remain intact.

### Independent checks

1. `pnpm exec vitest run scripts/lib/v1-38-lean-admitted-cap-cache.test.ts --maxWorkers=1`: **27/27 passed**, including all prior failure regressions and the isolated prototype-extension case. These are inert allocation metadata tests; the subprocess does not execute Strategy, Worker, provider or Match work.
2. `pnpm exec vitest run scripts/check-v1-38-lab-boundaries.test.ts scripts/check-v1-38-factory-boundaries.test.ts --maxWorkers=1 -t 'allows util only|allows gzip only|keeps the lean CLI and gzip codec'`: **4 passed, 77 intentionally unselected**. Covers exact-owner allowances, other-owner denials, private transitive denials, preserved public/runtime compatibility and denied public reachability.
3. Scoped `git diff --check` passed. All six reviewed source/test paths were clean in the working tree and matched the stated source commit.

The author's separate 25 selected affected-existing tests / 61 unselected, configured lab typecheck and actual 1413-source boundary scan with zero violations were reported but not independently rerun here. This is not a claim that every phase test or a standalone whole-script-project typecheck passed.

### Review boundary

Only this review artifact was written. No source, earlier review, historical record, private payload, allocation, store or source manifest was modified; no historical ordinary reader or empirical/native/Worker/provider/Strategy/Match route was executed. All prior resource, charge, source and reader-boundary code is unchanged by the repair. This clean result addresses the reviewed source defects only: it is not proof that caching cures observed RSS pressure, not source-inventory regeneration or execution admission, and not Phase 265 completion or permission for a fresh diagnostic/baseline.

---

_Reviewer: /root/review_265_cap_bookkeeping (gsd-code-reviewer)_
_Result: clean within the stated narrow source scope; CR-01/CR-02/CR-03 resolved._

## Test-only coverage addendum — 2026-10-07T00:15:51Z

**Test commit:** `f56a325e6f0afd2769b38969de3f378969b11597`  
**Production source remains:** `13b2fe13ce5b0677ab5ac44f2df463914b983e7d`  
**Scope:** Only the 38-line added sparse inherited numeric-array regression in `scripts/lib/v1-38-lean-admitted-cap-cache.test.ts`. Original review observations/frontmatter above remain bound to their original source commit. REVIEW-v1/v2/v3 remain untouched.

**Result: clean; no additional findings.** The new test runs in an isolated metadata-only subprocess and restores both the previous `Array.prototype[0]` descriptor and array-prototype length in `finally`. Its assertions establish that the admitted survivor array is frozen yet has no own numeric index, its inherited survivor remains mutable, and initial cap selection retains the valid own-extension cap. Mutating the inherited survivor then causes both explicit full admission and the cap API to reject with the predecessor-validation error, proving the sparse allocation did not acquire cache authority. This closes the direct regression-coverage gap for the dense-own-index eligibility check without altering historical admission or the shared test process.

**Independent checks:** `pnpm exec vitest run scripts/lib/v1-38-lean-admitted-cap-cache.test.ts --maxWorkers=1` passed **28/28**. The scoped test-commit whitespace check passed. Diff inspection confirmed no changes to production `lean-experiment.ts` or either boundary-monitor source between the original reviewed commit and this test-only commit.

Only this addendum was written. No source, retained data, provider/Strategy/Worker/Match route, historical ordinary reader, source manifest or execution authority was changed or consumed. The original narrow review boundaries and absence of empirical RSS-cure claims remain unchanged.
