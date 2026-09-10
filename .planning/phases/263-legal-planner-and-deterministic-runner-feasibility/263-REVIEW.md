---
phase: 263-legal-planner-and-deterministic-runner-feasibility
reviewed: 2026-09-10T05:10:00Z
review_iteration: 3
depth: standard
review_scope: full-source-pre-empirical
review_commit: d98e3ddf8d03688d9de73112acc3a27d71ade5b1
diff_base: b26a0caa
files_reviewed: 42
files_reviewed_list:
  - .gitignore
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
  - packages/strategy-lab/src/planner-corpus.ts
  - packages/strategy-lab/src/planner/brain.ts
  - packages/strategy-lab/src/planner/brain.test.ts
  - packages/strategy-lab/src/planner/information-boundary.test.ts
  - packages/strategy-lab/src/planner/emit.ts
  - packages/strategy-lab/src/planner/emission.test.ts
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
  - packages/strategy-lab/src/worker.test.ts
  - packages/strategy-lab/tsconfig.json
  - scripts/check-v1-38-lab-boundaries.test.ts
  - scripts/check-v1-38-lab-boundaries.ts
  - scripts/lib/v1-38-lean-container-match-session.test.ts
  - scripts/lib/v1-38-lean-container-match-session.ts
  - scripts/lib/v1-38-planner-supervised-runtime.test.ts
  - scripts/lib/v1-38-planner-supervised-runtime.ts
  - scripts/run-v1-38-planner-feasibility.ts
  - scripts/run-v1-38-planner-feasibility.test.ts
findings:
  critical: 5
  warning: 0
  info: 0
  total: 5
resolved_findings: [CR-01, CR-02, CR-03, CR-04, CR-05, WR-01, CR-06, CR-07]
active_findings: [CR-08, CR-09, CR-10, CR-11, CR-12]
source_root: sha256:6bf1f02f273f4c743781aee7f9a9693aa55096e687bedaedba49504e4c14907b
execution_root: sha256:33b9d8486ed6cac2f5219706406dfddf0a7b482067b3ffe2298fe8213f4160f0
status: issues_found
---

# Phase 263: Full-source Pre-empirical Code Review

## Summary

Iteration 3 covers the complete submitted source path through `d98e3ddf`, including the newly completed brain/emitter and CLI, with 41 source/configuration files plus `.gitignore`. The eight earlier findings are resolved; five new integration blockers remain. Frontmatter counts describe only active findings. This is a full-source **pre-empirical** review, not a whole-phase pass or empirical feasibility result. The historical partial reviews below remain unchanged evidence, not active fix lists.

No structural pre-pass was supplied. Source files were not modified. No live Strategy, supervisor, container, preflight, benchmark or Match was executed. Reproductions used trusted synthetic worker output, pure reductions, injected failing callbacks and source-graph fixtures only. Temporary synthetic shard directories were removed by their own scoped cleanup; historical files and locks were untouched.

## Narrative Findings (AI reviewer)

## Iteration 3 — Active Findings

### CR-08: Benchmark inherits a 120-second Match lifetime

**Classification:** BLOCKER

**Files:** `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-planner-supervised-runtime.ts:50`, `:69`; `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-planner-feasibility.ts:385`.

**Issue:** One supervised host serves all 2,200 benchmark calls, but every host stops 120 seconds after construction. This is the per-Match cap applied to a non-Match benchmark. Transport and module setup are intentionally excluded from direct-call p99: 2,200 valid calls with 60 ms transport each take 132 seconds and fail despite direct calls below 5 ms and remaining overall budget. This is a static operational counterexample, not a measured latency claim.

**Fix:** Give the benchmark an explicit host lifetime bounded by remaining overall time, while retaining the 120-second cap for each Match, the selected 1,000 ms invocation profile and unchanged strict 5 ms p99. Add a fake-clock/injected-transport test completing benchmark calls across 120 seconds and a separate Match test proving its deadline remains enforced.

### CR-09: Failed-run receipts lose durable precharges

**Classification:** BLOCKER

**Files:** `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-planner-feasibility.ts:257-285`, `:381`, `:389-391`, `:411`.

**Issue:** Receipt counts come from successfully returned in-memory summaries rather than the durable charge ledger. If the guard throws after N validation records, `finally` publishes those records, but the assignment to `validation` never completes; the receipt reports zero cases and guest calls. For the benchmark, a charge is published before `host.invoke`; if invocation throws before returning evidence, no record is published. Benchmark accounting retains the charge, whereas read-only verification counts records and rejects the truthful failure summary. A consumed/interrupted run cannot be represented consistently, and already-charged work appears unused or disappears.

**Fix:** Derive terminal charged/guest-call/unused/uncertain counts from durable precharges and retained dispositions in a guaranteed failure path. Keep invocation attempts distinct from allocated charges when dispatch is uncertain. Publish an explicit failed/uncertain disposition for a charged call without normal evidence; verify this as non-pass without retrying or fabricating completion. Inject failure after N completed cases and after benchmark precharge but before evidence, and assert run/verify count agreement.

### CR-10: Read-only verification accepts malformed counts and drops failure predicates

**Classification:** BLOCKER

**Files:** `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-planner-feasibility.ts:333-352`, `:427-434`, `:451-453`.

**Issue:** Retained JSON is type-cast instead of schema-admitted. The receipt comparison never checks `matchAttemptsCharged`, unused counts, guest-call count, schema version or status enum. Validation evidence checks only a subset of runtime binding and does not establish classification from the retained result; the read-only Match path also skips the expected immutable run-binding admission used by execution. Benchmark rederivation returns `passed` solely from timings/count, disregarding a retained non-pass cleanup result. These are local consistency checks, not an external-authenticity requirement.

**Evidence:** A temporary prepared synthetic fixture with a correctly bound consumed marker and receipt `{status:"non_pass",casesCharged:0,benchmarkCalls:0,matchAttemptsCharged:999,matchAttemptsUnused:-975}` was accepted by `verifyPlannerFeasibility`, returning `status:"non_pass"` instead of rejecting the impossible receipt. The receipt lacked every other required field. No runtime host was constructed. The scoped temporary directory was removed.

**Fix:** Strictly admit retained envelopes and receipts; independently derive all published counts from the charge/terminal inventory, bind the existing run header to expected manifest identities read-only, and retain cleanup/provenance/completion predicates in derived pass status. Cross-check validation result classification and runtime identity, not just value hashes. Add tamper tests for missing/unknown fields, impossible counts, changed classification/identity, wrong run binding, and complete timing samples with cleanup failure. No producer attestation or new custody layer is needed.

### CR-11: Execution root omits selected executable dependencies

**Classification:** BLOCKER

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-planner-feasibility.ts:169-171`.

**Issue:** `implementationRoot` hashes the CLI, host/session and selected lab modules, but not their selected runtime executor/ABI/normalization or canonical engine implementation dependencies. A change to `packages/runtime-js/src/executor.ts`, for example, can alter actual dispatch or results without changing this execution root, candidate bytes or observer harness. The inherited source-closure constant is not recomputed against that live dependency closure. Prepare captures the new working tree, and run compares against that prepared tree, so changing such a dependency between review and prepare does not invalidate the root-based review gate.

**Fix:** Hash the actual selected local executable dependency closure using the existing static dependency resolution machinery or an explicitly checked closure, including runtime and canonical kernel dependencies. Do not include self-referential report/artifact files or introduce a separate custody route. Test that mutating an executor/ABI/kernel dependency changes executionRoot and that unresolved selected dependencies fail closed.

### CR-12: A routine test starts real execution after the review becomes clean

**Classification:** BLOCKER

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-planner-feasibility.test.ts:69-77`.

**Issue:** The test prepares current material and calls the real `runPlannerFeasibility`, expecting the repository's actual review to be unresolved. There is no mocked host or injected review fixture. As soon as the review becomes clean with matching roots, that gate passes and an ordinary test starts supervised validation/source execution before eventually failing its expectation or timeout. Safety and test outcome depend on mutable planning-document status, violating the synthetic-only pre-empirical test boundary.

**Fix:** Inject a deterministic unresolved review fixture and a denied/spied host factory, or isolate admission behind an injected read-only dependency. Assert zero host/provider invocations even when the repository contains a valid clean review. Do not rerun this test against a clean report until it is isolated.

## Iteration 3 — Resolution and verification

CR-06 is resolved by moving all provider-owned admission inside cleanup handling, including zero-allocation rejection; cleanup uncertainty remains non-pass. CR-07 is resolved by terminating relays independently and bounding cancellation by the remaining cleanup budget, with explicit incomplete cleanup. Earlier six resolutions remain applicable. The resource-owner change closes the 170 validation contexts as their final cases finish, keeping peak ownership one without resetting intentional reused contexts.

Read-only source inspection yielded candidate size **24,294 bytes**, sourceRoot `sha256:6bf1f02f273f4c743781aee7f9a9693aa55096e687bedaedba49504e4c14907b` and executionRoot `sha256:33b9d8486ed6cac2f5219706406dfddf0a7b482067b3ffe2298fe8213f4160f0`. These identify an **issues-found** snapshot, not admission for Task 3. The inspected brain is self-contained emitted tactics, not a copied engine resolver; the mapped 100-case corpus, 256-case inventory (232 intended guest calls and 24 source/input rejections), semantic geometry projection and private production exclusion remain present. No measured feasibility assertion follows from these static checks.

Independent current synthetic regression run: **5 suites, 45 tests passed**, 76.30 seconds wall time (57.71 seconds tests): `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/benchmark.test.ts packages/strategy-lab/src/worker.test.ts packages/strategy-lab/src/planner/emission.test.ts packages/strategy-lab/src/planner/information-boundary.test.ts scripts/run-v1-38-planner-feasibility.test.ts`. The CLI test was safe only because the report was still unresolved (CR-12). No live guest, supervisor, container, preflight, Match, benchmark or final empirical manifest was run. Only this report was edited; no commit was made.

## Iteration 2 — Historical Findings (both resolved in iteration 3)

### CR-06: Pre-dispatch benchmark rejection skips provider cleanup

**Classification:** BLOCKER

**File:** `/Users/roryquinlan/runtime/cowards-game/packages/strategy-lab/src/benchmark.ts:89-97`

**Issue:** The new provider identity admission (and corpus admission/immutable-copy steps) executes before the `try/finally` that closes the provider. A mismatched source/harness/attempt now correctly consumes zero invocations, but rejects without closing the already-created provider. `createPlannerSupervisedRuntime` creates its container session before returning the provider, so this leaves owned resources running on precisely the rejected setup path. This is distinct from the corrected late-dispatch defect CR-05.

**Evidence:** A synthetic provider with a wrong identity and counters returned `LAB_BENCHMARK_PROVIDER_IDENTITY` with `invoked: 0, closed: 0`. No source or container was executed.

**Fix:** Put all admission after provider ownership inside an outer cleanup guard, keeping zero invocation charge on admission rejection. Close exactly once on invalid corpus, identity mismatch and clone/admission exceptions; preserve cleanup uncertainty as non-pass rather than asserting successful cleanup. Add close-count assertions to the initial-binding rejection tests and a malformed-corpus rejection test.

### CR-07: A stuck cancellation callback prevents terminal failure and relay termination

**Classification:** BLOCKER

**File:** `/Users/roryquinlan/runtime/cowards-game/packages/strategy-lab/src/worker.ts:85-90`

**Issue:** Failure handling clears every deadline, then awaits all external `cancel` callbacks without any bound, and only afterward terminates relay workers. The public callback type explicitly allows a Promise. If owned-supervisor cancellation never settles, the failed pool never returns, surviving relay threads are never terminated, and `runLabTasks` cannot publish its charged-failure/unused dispositions. Thus the newly added cleanup hook can defeat the bounded failure path even after a timeout or worker loss has already been detected.

**Evidence:** A synthetic relay was deliberately lost at ordinal 0 and its cancellation hook returned a never-settling Promise. Cancellation was invoked once and the pool remained unsettled. Static tracing confirms all pool deadlines were cleared before that wait and no subsequent timeout exists. The synthetic test process exited after observing the condition; it launched no external supervisor.

**Fix:** Terminate owned relay workers in a guaranteed cleanup path independent of callback settlement. Bound asynchronous supervisor cancellation using the declared cleanup/remaining outer budget; retain unresolved cleanup as explicit incomplete/non-pass evidence and preserve charges without retrying. Add tests for rejected and never-settling cancellation, including two workers so a surviving relay is verified terminated. A cancellation failure must not be reported as successful cleanup.

## Iteration 2 — Resolved Original Findings

| Finding | Disposition and inspected correction |
| --- | --- |
| CR-01 | Resolved: immutable run-binding header joins graph, evidence class, machine and execution commitment before resume; old unbound inventory cannot be adopted; resumed scored supervised records require traces. |
| CR-02 | Resolved: per-attempt timer resets at each charged dispatch; two synthetic 70-second attempts can complete cumulatively. The new cancellation implementation has the separate CR-07 defect. |
| CR-03 | Resolved: explicit alias projection compares classification, outcome and all three semantic roots with its scientific representative; mismatch prevents payoffs. |
| CR-04 | Resolved before measurement: mapped mission corpus is now used by the frozen protocol and benchmark. Actual mission/absence/stale/failure paths and exact mapped root are tested; no empirical result was reinterpreted. |
| CR-05 | Resolved: full immutable provider identity is admitted before dispatch and every returned observation is bound before the next call. The admission cleanup omission is separately CR-06. |
| WR-01 | Resolved: TypeScript lexical symbols distinguish outer and inner bindings; candidate assignments remain conservative and the original shadowing counterexample is covered. |

`attemptOrdinals` only filters the already-allocated graph, rejects duplicates/non-integers/out-of-range values, excludes already-published work, and cannot reduce fewer than 24 records into scored coverage. It does not mint attempts or change scientific identities. `executionRoot` is immutable inventory admission, not authority to skip runtime identity checks; its concrete construction remains Plan 06's responsibility. System/unused records still cannot yield payoffs, and normal lost-worker terminalization conservatively retains incomplete cleanup.

### Iteration 2 verification

Independent explicit completed-file run: **7 suites, 74 tests passed**, 185.12 seconds wall time (167.75 seconds tests). Command: `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/worker.test.ts packages/strategy-lab/src/shards.test.ts packages/strategy-lab/src/runner-invariance.test.ts packages/strategy-lab/src/benchmark.test.ts packages/strategy-lab/src/feasibility-protocol.test.ts packages/strategy-lab/src/planner/emission.test.ts scripts/check-v1-38-lab-boundaries.test.ts`. This includes the complete 36-case synthetic worker/layout/order/lifecycle matrix, real relay workers with synthetic payloads/fake time, mapped corpus checks, static emission, injected benchmark calculations and boundary fixtures. Passing regressions do not cover the two newly reproduced cleanup defects. No Plan 06 WIP CLI suite or historical guest-execution suite was included. `git diff --check` passes for the review artifact. No source files were changed or committed by this reviewer.

## Original Review — Iteration 1 Historical Record (all six findings resolved)

Reviewed at `d13db633` on 2026-09-10T03:15:37Z. The original severity, evidence and fix suggestions below are retained; they are not additional active findings.

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
