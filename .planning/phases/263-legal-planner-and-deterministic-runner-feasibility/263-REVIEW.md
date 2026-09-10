---
phase: 263-legal-planner-and-deterministic-runner-feasibility
reviewed: 2026-09-10T03:15:37Z
depth: standard
review_scope: partial-pre-integration-completed-slices
review_commit: d13db633
diff_base: b26a0caa
files_reviewed: 32
files_reviewed_list:
  - packages/runtime-js/src/planner-benchmark-observer.test.ts
  - packages/runtime-js/src/worker-harness.ts
  - packages/strategy-lab/package.json
  - packages/strategy-lab/src/benchmark.test.ts
  - packages/strategy-lab/src/benchmark.ts
  - packages/strategy-lab/src/contracts.test.ts
  - packages/strategy-lab/src/contracts.ts
  - packages/strategy-lab/src/feasibility-protocol.test.ts
  - packages/strategy-lab/src/feasibility-protocol.ts
  - packages/strategy-lab/src/identity.ts
  - packages/strategy-lab/src/index.ts
  - packages/strategy-lab/src/planner/assign.test.ts
  - packages/strategy-lab/src/planner/assign.ts
  - packages/strategy-lab/src/planner/missions.test.ts
  - packages/strategy-lab/src/planner/missions.ts
  - packages/strategy-lab/src/reduce.ts
  - packages/strategy-lab/src/runner-invariance.test.ts
  - packages/strategy-lab/src/runner.ts
  - packages/strategy-lab/src/runtime-bridge.test.ts
  - packages/strategy-lab/src/runtime-bridge.ts
  - packages/strategy-lab/src/shards.test.ts
  - packages/strategy-lab/src/shards.ts
  - packages/strategy-lab/src/tasks.test.ts
  - packages/strategy-lab/src/tasks.ts
  - packages/strategy-lab/src/worker.ts
  - packages/strategy-lab/tsconfig.json
  - scripts/check-v1-38-lab-boundaries.test.ts
  - scripts/check-v1-38-lab-boundaries.ts
  - scripts/lib/v1-38-lean-container-match-session.test.ts
  - scripts/lib/v1-38-lean-container-match-session.ts
  - scripts/lib/v1-38-planner-supervised-runtime.test.ts
  - scripts/lib/v1-38-planner-supervised-runtime.ts
findings:
  critical: 5
  warning: 1
  info: 0
  total: 6
status: issues_found
---

# Phase 263: Partial Pre-integration Code Review

## Summary

Standard adversarial review of the 32 explicitly submitted files from completed Plans 01, 02, 04 and 05 at `d13db633`. This is **not a whole-phase pass**, empirical feasibility result, or review of in-progress Plan 03 brain/emission work. Plans 06/07 integration and actual execution remain outside this review. Five blockers affect result validity or bounded execution; one warning concerns the boundary monitor. Fix in the existing plans before empirical execution; no new certification or custody workflow is required.

No structural pre-pass was supplied. Source files were not modified. No live Strategy, supervisor, container, preflight, benchmark or Match was executed. Reproductions used trusted synthetic worker output, pure reductions, injected failing callbacks and source-graph fixtures only. Temporary synthetic shard directories were removed by their own scoped cleanup; historical files and locks were untouched.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Completed synthetic inventory is accepted as supervised work on resume

**Classification:** BLOCKER

**File:** `/Users/roryquinlan/runtime/cowards-game/packages/strategy-lab/src/runner.ts:15-27` and `:62`

**Issue:** Resume admits records solely against the task graph. The supervised trace requirement and machine/layout binding checks apply only to newly returned worker results, not the existing inventory. Execution mode is not retained in stored records or an immutable inventory header. Running the synthetic job to completion, then calling the same runner with the same directory/graph and `job.kind: "supervised"`, produces a complete reduction with zero supervised dispatches and 24 null traces. The operational context now says `mode: "supervised"`. This permits synthetic protocol output to cross into the live integration path and also omits expected-machine checks on resumed records.

**Evidence:** Synthetic-only reproduction returned `{"calls":0,"dispatched":0,"status":"complete","traceNull":24}` when the second call's supervised callback was a counter that would throw if invoked.

**Fix:** Persist and validate the run's immutable evidence class and expected execution commitments before accepting any resumed record. Reject synthetic inventory in a supervised run. Apply supervised trace and expected machine/source/protocol checks to resumed records as well as fresh results. Keep physical layout operational rather than adding it to scientific task identity. Add a synthetic-to-supervised resume regression that rejects before dispatch or reduction.

### CR-02: Worker lifetime incorrectly consumes the per-Match deadline

**Classification:** BLOCKER

**File:** `/Users/roryquinlan/runtime/cowards-game/packages/strategy-lab/src/worker.ts:49-55`

**Issue:** The single 120000 ms timer is created when the worker starts and is never reset between its tasks. A baseline worker owns 24 sequential attempts; a two-worker layout gives each worker 12. Thus two otherwise valid 70-second asynchronous Match jobs exceed the worker lifetime timer even though each is below the admitted 120-second per-Match limit and the run is far below the 3600000 ms overall ceiling. Worker count can consequently change success/failure, not just operational metadata. The fast synthetic matrix never exercises this timing boundary.

**Fix:** Separate worker startup/transport health from the admitted per-attempt deadline and coordinator-owned overall deadline. Arm/reset the attempt timer at dispatch and cancel it after that attempt's terminal result; do not apply one Match's allowance to the whole worker batch. Retain explicit owned-supervisor cancellation on expiry. Use fake clocks or injected timer hooks to prove multiple individually valid tasks can exceed 120 seconds cumulatively while one over-limit task remains charged and terminal non-pass.

### CR-03: Alias compatibility outcomes are never compared with their representatives

**Classification:** BLOCKER

**File:** `/Users/roryquinlan/runtime/cowards-game/packages/strategy-lab/src/reduce.ts:19-27`

**Issue:** `comparable` checks only baseline versus variant for the same task ID. The reducer carries `representativeId` but never checks an alias task against that representative. Both passes of an alias can therefore disagree with the canonical geometry's outcome and still yield `status: "complete"` and scientific payoffs. Excluding alias tasks from the denominator is not an alias compatibility check.

**Evidence:** Starting with the synthetic 24-record result, changing every alias record's outcome from DRAW to top in both passes and recomputing its semantic-record hash still returned `complete`; scientific representatives remained DRAW.

**Fix:** Add an explicit schema-owned alias comparison against each representative for the agreed geometry-equivalent semantic fields (at minimum outcome, and the appropriate normalized state/transition/runtime semantics). Exclude label/task identity from that comparison without arbitrarily stripping fields. A mismatch must be non-pass with no payoffs. Add a regression where both reproduction passes agree on the wrong alias outcome.

### CR-04: Frozen timing corpus has no deployed mission packets

**Classification:** BLOCKER — pending integration before measurement

**File:** `/Users/roryquinlan/runtime/cowards-game/packages/strategy-lab/src/feasibility-protocol.ts:41-50`; `/Users/roryquinlan/runtime/cowards-game/packages/strategy-lab/src/benchmark.ts:22-30`

**Issue:** Every SoldierBrain objective is either a `fixtureContext` packet or a boundary string packet, never `mission-v1`. None passes the submitted mission guard. StrategyMemory likewise has no `missions` list. Consequently the ten mission labels do not supply active/stale/failed deployed mission inputs for timing. Furthermore, benchmark admission hardcodes this exact corpus, so simply passing a mapped mission corpus from integration is rejected. This is a known Plan 01 handoff gap, not a claim that an empirical pass has already been misreported, and the in-progress brain implementation was not reviewed. Leaving it unresolved before timing would make the mission-path workload unrepresentative.

**Fix:** Complete and test the explicit legal mission-packet/memory mapping before any measurement, freeze its exact corpus root and bind benchmark admission to that final precommitted corpus. Include genuine active, stale, failed and fallback paths while keeping deliberately invalid objectives separate where appropriate. Preserve sample count/order and the strict 5 ms thresholds; do not adapt the corpus after observing timing. Test path coverage, not only schema validity and family labels.

### CR-05: Benchmark validates the provider's committed identity only after spending calls

**Classification:** BLOCKER

**File:** `/Users/roryquinlan/runtime/cowards-game/packages/strategy-lab/src/benchmark.ts:77-99`

**Issue:** Pre-dispatch admission checks corpus/profile/budget but does not compare `provider.identity` with the frozen source/executable/harness/attempt commitment. Each invocation instead receives `provider.identity` itself. Identity mismatches are first caught by `evaluatePlannerBenchmark` after all 2200 successful observations; the per-call loop checks issuance and basic success only. A wrongly wired but otherwise genuine provider therefore consumes the no-retry allocation on the wrong committed source/harness before failing, and the final binding exception escapes rather than returning the charged failure summary.

**Evidence:** An injected provider with a wrong source identity was still invoked once and charged once before its deliberately thrown synthetic stop. No source was executed. The full-success branch reaches the late evaluator at line 99.

**Fix:** Validate the provider's complete relevant identity against the frozen commitment before the first dispatch, then pass that admitted immutable identity to `invoke`. Validate each observation's full request/identity/timing binding before scheduling the next call. Preserve charged counts and a bounded non-pass result if post-dispatch validation fails. Add regressions proving wrong initial source/harness/attempt consumes zero calls and a wrong returned binding stops after exactly the first charged call.

## Warnings

### WR-01: File-wide constant lookup loses lexical scope and misses lab imports

**Classification:** WARNING

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/check-v1-38-lab-boundaries.ts:66-77`

**Issue:** All variable declarations are stored in one map keyed only by identifier text, with later nested declarations overwriting outer bindings. For `const target = "@cowards/strategy-lab"; void import(target); function f() { const target = "node:fs"; }`, the real production import resolves to the lab, but the monitor follows the unrelated inner declaration and returns no violation. This affects a specifically supported constant dynamic-import form, not an arbitrary runtime-generated-code case.

**Evidence:** The two-file fixture containing that production source plus the lab index returned `{"ok":true,"violations":[],"scannedFiles":2}`.

**Fix:** Resolve identifier declarations in lexical scope using a TypeScript checker or a scoped binding stack, including reassignment handling. If a binding cannot be determined safely, retain potentially lab-directed candidates and fail closed rather than selecting an unrelated declaration. Add the shadowing fixture as a negative test.

## Review limitations

The synthetic checks establish the stated counterexamples, not runtime availability or empirical feasibility. Existing tests were inspected but the complete test matrix was not rerun, particularly historical session tests that execute guest source. Expected-manifest construction, actual observer source selection, aggregate timebox enforcement, retained failure traces and real source/runtime semantic projections still need inspection in the later integration slice. No finding here authorizes changing game rules, runtime limits, sample thresholds, retry budgets, production exports or historical evidence.

_Reviewer: gsd-code-reviewer; depth: standard; partial pre-integration review._
