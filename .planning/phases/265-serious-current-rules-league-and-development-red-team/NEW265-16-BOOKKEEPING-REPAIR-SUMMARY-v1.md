---
phase: 265-serious-current-rules-league-and-development-red-team
plan: 16
supplement: source_only_authenticated_cap_reuse
scope: source_only
status: complete
subsystem: private-coordinator-bookkeeping
tags: [weakmap, identity-cache, inert-tests, tdd]
requires:
  - phase: 265
    provides: Checked bookkeeping repair plan and released baseline source hold
provides:
  - Exact admitted immutable v8 allocation cap reuse without repeat canonical reconstruction
affects: [private-parent-resource-sampling]
tech-stack:
  added: []
  patterns: [private weak identity registration after successful full admission]
key-files:
  created: [scripts/lib/v1-38-lean-admitted-cap-cache.test.ts]
  modified: [packages/strategy-lab/src/league/lean-experiment.ts, scripts/check-v1-38-lab-boundaries.ts, scripts/check-v1-38-factory-boundaries.ts, scripts/check-v1-38-lab-boundaries.test.ts, scripts/check-v1-38-factory-boundaries.test.ts]
key-decisions:
  - Cache only the freshly reconstructed expected object after successful full v8 admission
  - Require recursively frozen plain data descriptors and exclude proxies before reflection
  - Bound eligibility with iterative depth/node/property-work budgets and conservative repeated-reference fallback
  - Select cached caps only from an authenticated own extension and admit util only at the exact private metadata owner
  - Preserve explicit full admission and all resource/authorization boundaries
requirements-completed: []
completed: 2026-10-06
---

# Phase 265 Plan 16: Source-only admitted-cap bookkeeping repair

An internal weak identity cache removes repeated v8 allocation reconstruction, canonical hashing and freezing from cap reads on an exactly admitted, recursively frozen plain-data object that passes bounded iterative eligibility. Accessor/proxy/exotic-prototype/cyclic/oversized inputs retain full admission on every cap read. Cached cap selection uses only an authenticated own extension. The private import monitors allow the new Proxy predicate only at the exact lean metadata owner. This completes the bounded source repair only, not Plan 16, Phase 265, any LEAG requirement, or empirical feasibility; independent review v4 remains MAIN's next gate.

## Implementation and TDD evidence

- RED `155912fc`: focused inert metadata tests failed as expected, 8 cache expectations failing and 9 admission/legacy checks passing. The recorded legacy admitted diagnostic loop grew from 29 to 125 hash calls and 4 to 28 top-level reconstruction/freeze calls; the extended loop also repeated work. No empirical route was invoked.
- GREEN `c04de227`: seven additive production lines add the internal WeakMap, register `expected` only after existing v8 exact-key/construction/root/equality checks succeed, and consult the map before re-admission in `leanCapsForAllocation`. One test-only type narrowing preserves explicit predecessor immutability assertions.
- Review v1 found a real blocker in this first GREEN: recursive freezing alone does not make accessor-backed arrays immutable. A getter's closure could return a changed survivor record after registration, causing a cached cap read to succeed while explicit full admission rejected it.
- Follow-up RED `15040568`: five new regressions failed on the original cache, reproducing stale cap acceptance after changed getter results (with and without a Proxy), plus improper caching of transparent Proxy arrays, custom array prototypes and non-enumerable accessors.
- Fix GREEN `8b143b29`: registration now additionally requires recursively frozen plain data. `node:util` `types.isProxy` excludes proxies before reflection; arrays must use `Array.prototype`, records must use `Object.prototype` or null, and every own string/symbol property must be a data descriptor with recursively safe content. Functions, accessors, mutable nested objects and exotic prototypes are ineligible. The private eligibility check is run once at registration, not on cache hits. Unsafe but previously admissible inputs are still admitted and returned; no canonical/runtime/legacy acceptance change was made.
- Review v2 found CR-02: recursive eligibility could throw on non-enumerable/symbol self-cycles or deep hidden data that existing canonical array admission intentionally ignores. Follow-up RED `5f44accb` reproduced three RangeErrors and oversized-graph caching; original 22 tests remained passing.
- Fix GREEN `6ca2f82d`: eligibility now uses a private iterative stack, a WeakSet, maximum object depth 32, maximum nodes 4096 and maximum property-work 4096. Repeated objects/cycles and budget excess return false, preserving historical full admission rather than throwing or caching. Array length is checked against remaining property-work before iteration; each numeric index must have an own data descriptor so inherited mutable prototype slots cannot qualify. All own string/symbol descriptors are still inspected; proxy rejection precedes reflection. Conservative misses do not alter resource/Match/authority caps.
- Review v3 found CR-03: inherited `Object.prototype.timeboxExtension` could select 72M for an admitted legacy allocation whose own cap was 57.6M, leaving the poisoned cache after prototype cleanup. MAIN also found the new `node:util` import lacked its exact-owner boundary exception. Additional ownership was explicitly granted for both boundary monitors and their existing focused test files.
- RED `386d0074`: an isolated inert Node metadata subprocess reproduces the 72M poisoned legacy cache during and after pollution, while the uncached clone rejects the invalid inherited extension and the real own extension remains 72M. Two monitor tests fail on the missing exact-owner permission.
- Final GREEN `13b2fe13`: only cache-value selection changes to `Object.hasOwn(expected, "timeboxExtension")`; the uncached legacy path is unchanged. The lab/factory monitors mirror the exact lean owner gzip exception for `node:util` without adding it to global `allowedNode`. Other lab/oracle/known private owners and unreviewed private transitive helpers reject; public reach into the private metadata owner remains denied. Existing legitimate public/runtime/persistence `node:util` consumers keep their previous monitor behavior.
- Only full successful `admitLeanAllocation` registration grants a hit. Constructor output, fresh JSON, mutable/shallow-frozen/deep-frozen clones and root strings do not. On a miss, existing full admission remains intact. Explicit `admitLeanAllocation` still reconstructs even a registered object.
- Existing `freezeLabValue` recursively freezes ordinary expected v8 objects. The additional cache-eligibility proof does not mistake frozen accessors for immutable data. Focused tests reject nested metadata mutations and prove unchanged hash/freeze counters on repeated safe exact-identity hits; unsafe references fully revalidate before a getter change and reject afterward exactly as explicit admission does.

## Verification

1. `pnpm exec vitest run scripts/lib/v1-38-lean-admitted-cap-cache.test.ts --maxWorkers=1`: 27/27 PASS after the final review fix (original 17 plus five descriptor/proxy, four hidden-graph and one isolated prototype-pollution regression).
2. `pnpm exec vitest run scripts/run-v1-38-lean-host-stage-v8.test.ts scripts/run-v1-38-lean-host-stage-v7.test.ts scripts/run-v1-38-lean-baseline.test.ts --maxWorkers=1 -t 'authenticates the additive binding|binds ordinal at actual allocation admission|reconstructs exact v7 caps|actual conditional baseline parent timebox consumer|opt-in finite parent supervisor observations'`: 25 selected tests PASS; 61 intentionally unselected. This is not a full phase-suite claim.
3. `pnpm --filter @cowards/strategy-lab typecheck`: configured `tsc -b` PASS. This does not assert a standalone strict whole-script-project compiler pass; the lab project includes package source, not scripts.
4. `pnpm exec vitest run scripts/check-v1-38-lab-boundaries.test.ts scripts/check-v1-38-factory-boundaries.test.ts --maxWorkers=1 -t 'allows util only|allows gzip only|keeps the lean CLI and gzip codec'`: four selected monitor tests PASS; 77 intentionally unselected.
5. `pnpm exec tsx scripts/check-v1-38-factory-boundaries.ts`: final actual source scan PASS, 1413 files, zero violations. An initial over-broad new util denial caught 18 pre-existing legitimate public/runtime/persistence imports; it was narrowed to private owners before this final passing scan, without changing those consumers or global builtin policy.
6. `git diff --check`: PASS. Task commits contain no deletions and only explicitly owned source/test paths. No package install or shell implementation edit occurred.

Fifty-six distinct focused/affected inert tests passed at the final source; all 27 cap tests, 25 selected cap/parent tests, four selected monitor tests and configured types were rerun after the final changes. Mocks deny empirical parent child/native execution. The single isolated metadata subprocess performs admission/cap reads only, cleans its temporary prototype property in `finally`, and writes no allocation/store/artifact. No Strategy, provider, Worker, Match, empirical entry or historical ordinary reader was dispatched by this repair. The stable Node built-in Proxy predicate was checked against [official Node documentation](https://nodejs.org/api/util.html#utiltypesisproxyvalue); no package installation occurred.

## Frozen roots, resource bounds and authorization

Allocation constructors, canonical serializers, root domains, policy/approval/carry constants, extension validation and slot schedules were not changed. Tests preserve admitted root equality and canonical bytes, both diagnostic and 36-slot baseline schedules, the exact 72,000,000-ms extension versus historical 57,600,000-ms v8 cap, and every other cap field. v1 and supervisor v2–v7 cap behavior/full re-admission remain covered and unchanged. All live charge/source/retained boundary code remains unchanged.

The source/HEAD holds were already released; this repair starts none. The approved conditional baseline is spent by failure, all 30 historical charges/costs/files remain carried, and a fresh empirical route requires a new prospective human amendment. No empirical request/helper/allocation/store, source inventory or resource-decision schema was created. The existing 904-entry inventory and all historical review/diagnostic artifacts were left untouched. No diagnostic-accepted source label is inferred for the repaired source.

This proves source-overhead reduction only. It does not prove repeated allocation reconstruction caused elevated RSS, does not establish a causal RSS repair, and does not change kill predicates, thresholds, reserve calculations, runtime/game rules, public APIs, policy or execution authority. The same cumulative 20-hour/15GB/300 ceiling and all later repair/review costs continue to apply; legacy route bounds retain history. Freeze/formation/holdout/public/counting/production remain gated.

## Deviations and deferred issues

Three review-driven Rule 1 fixes: exclude unsafe descriptor/proxy data, bound graph traversal/dense array slots, and prevent inherited-extension cache poisoning. A Rule 3 source-boundary integration repair adds the exact private metadata util permission under explicitly expanded ownership; an initially over-broad denial was narrowed before final verification. None changes admission acceptance, canonical serialization, runtime boundaries or global builtin policy. MAIN owns state, review, validation and source-verification integration; those shared documents were not staged or edited by this executor. Independent review v4/source verification remains MAIN's next source-only step, not another empirical run. No new stub or security-relevant endpoint/auth/file/schema surface was introduced.

## Self-Check: PASSED

All six owned source/test files exist; original RED `155912fc`/GREEN `c04de227`, review-fix RED `15040568`/GREEN `8b143b29`, bounded-traversal RED `5f44accb`/GREEN `6ca2f82d`, and own-extension/boundary RED `386d0074`/GREEN `13b2fe13` exist in Git history. The summary is present on disk for MAIN documentation integration and is not part of any source commit. Review v1/v2/v3 issue records are preserved. No push was performed.

## Test-only post-verification coverage addendum

Independent SOURCE-VERIFICATION-v1 passed 5/5 at production source `13b2fe13`, but correctly flagged that the focused suite originally lacked a dedicated sparse/inherited numeric-index regression. This small coverage gap is now closed by test-only commit `f56a325e`; production and monitor files were not changed.

The isolated trusted metadata subprocess admits an ordinary `Array.prototype` survivor array with no own numeric index 0, confirms the array is frozen but its inherited survivor record remains mutable, and observes the initial authenticated 72M cap. After changing that inherited record's `allocatedBytes`, both explicit full admission and the cap read reject `LEAN_EXPERIMENT_RETRY_PREDECESSOR`. The subprocess restores the original prototype index descriptor and array length in `finally`; the ambient test harness is never polluted. No Strategy/provider/Match or empirical artifact execution occurs.

Static regression sensitivity: without the own-data-index eligibility requirement, the frozen sparse array would qualify based only on its own length descriptor, ignoring the inherited mutable record. Its exact object would then return a cached cap after the mutation, causing the final `capRefused` assertion to fail. Production was not modified to demonstrate this sensitivity.

`pnpm exec vitest run scripts/lib/v1-38-lean-admitted-cap-cache.test.ts --maxWorkers=1` passes 28/28 at `f56a325e`; `git diff --check` passes. This was one narrow test cycle, not a rerun of the broader earlier gates or a new empirical verification. The earlier source-gate results remain historical scoped evidence; all resource/authority/phase gates remain unchanged. Self-check: the test-only commit exists and changes exactly the focused test file. This addendum remains unstaged for MAIN documentation integration.
