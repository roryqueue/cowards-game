---
status: diagnosed
trigger: "Approved repair-and-retest round: investigate supervision failure before another Match"
created: 2026-10-08T10:42:00Z
updated: 2026-10-08T10:49:18Z
---

## Current Focus

hypothesis: Confirmed CURRENT SYNTHETIC mechanism only: queued clean exit cannot clear sampling until exit-event delivery; synchronous sampler/other branch failure sets sticky uncertainty, then exitCode0 produces child_failed; finite receipt has no operation attribution. Historical v11-2 initiating cause UNKNOWN.
test: Actual production parent consumer and time-budget function with trusted in-memory host mocks/fake timers; tracked full run7PASS/1RED and repeated controls7PASS/1SKIP.
expecting: No native/historical causation, safe-success exemption, empirical acceptance or GREEN implementation follows from these synthetic results.
next_action: Return compact diagnosis to invoking manager via root relay; source implementation follows researched/checked Plan16 supplement and separate authority. End diagnosis-only work now.
tdd_checkpoint:
  test_file: scripts/run-v1-38-lean-supervisor-exit-repro.test.ts
  test_name: RED should retain finite child-RSS operation provenance without weakening failure
  status: red
  failure_output: Expected finite resourceSamplingOperation child_rss; received undefined. Existing parent failure and privacy assertions passed before this assertion.

## Evidence

- timestamp: 2026-10-08T10:47:00Z
  checked: Required immutable finite v11-2 report and debug file; STATE first30lines; full current baseline source and existing baseline test source
  found: Historical finite result is child_failed/exitCode0/nullsignal with resource_sampling_exception and unique-reader refusal; no retained throwing-operation attribution. Source baseline.ts350-355 catches child RSS, parent RSS, time-budget and threshold kill together;358-359 clears timers only after exit delivery;384 requires !uncertain for child_exited.
  implication: Test current source mechanism only, not historic initiating cause. No success exemption is justified.
- timestamp: 2026-10-08T10:47:00Z
  checked: baseline.ts311-317 and175-180; baseline.test.ts14-62 fixture style
  found: rssOf uses synchronous ps; actual retry reserve guard throws inside time-budget call. Existing fixtures mock host filesystem/child process and real parent consumer but do not reproduce disappearance during queued exit or attribute multiple throwing operations.
  implication: The new isolated fixture can exercise actual parent/budget logic without physical store, real child, private payload or Match execution. No project-local skills or matching debug knowledge-base/memory entries found.
- timestamp: 2026-10-08T10:47:40Z
  checked: Targeted new synthetic test file; actual runLeanBoundedParent and actual leanBoundedParentTimeBudget; host filesystem/process/accounting IO mocked
  found: Full targeted run exit1;7 controls passed/1 deliberate provenance assertion RED. Queued clean OS exit during ps failure produces kill-before-exit-event ordering, then child_failed/exitCode0/nullsignal with sticky uncertaintrue. Live ps, parentRSS, accounting, actual retry reserve refusal and threshold-kill throws all preserve failure. Clean control is only child_exited_pending_independent_verification, issuedfalse. Threshold-kill throw causes resource_threshold plus resource_sampling_exception and two kill attempts.
  implication: Current synthetic lifecycle/catch mechanism is reproduced, not the native v11-2 initiating cause. RED is missing finite resourceSamplingOperation child_rss; raw synthetic sentinel is not present in retained reason bytes. No production change is necessary to demonstrate the mechanism.
- timestamp: 2026-10-08T10:49:18Z
  checked: Exact targeted control-only rerun and scoped production-source diff
  found: Control-only run exit0;7PASS/1SKIP,4.67seconds. Production baseline source and existing baseline tests have no diff. Owned new test exercises actual parent terminal-status predicate; terminal writer/identity derivation and filesystem accounting IO are mocked, not production custody verification.
  implication: Seven source-level controls reproduced twice in tracked results; RED remains deliberately unfixed. No real fixture store/fork/provider/Match or old/full reader was invoked.

## Eliminated

- hypothesis: Clean child exit alone causes the parent supervision failure.
  evidence: Clean control with successful sampling returns child_exited_pending_independent_verification, issuedfalse, uncertainfalse and no reasons/kills. The injected failure before exit delivery is the distinguishing variable.
  timestamp: 2026-10-08T10:49:18Z
- hypothesis: resource_sampling_exception uniquely attributes synchronous ps failure.
  evidence: Synthetic live-ps, parent-RSS, accounting and actual retry reserve cases yield the same reason and sticky failure; threshold-kill throw yields the same exception reason plus resource_threshold and two kill attempts.
  timestamp: 2026-10-08T10:49:18Z

## Resolution

root_cause: CURRENT SYNTHETIC mechanism confirmed, not native/historical cause: scripts/run-v1-38-lean-baseline.ts350-355 performs synchronous RSS sampling inside one broad try before child exit-event delivery clears timers358-359. Injected PID disappearance during sampling sets sticky uncertaintrue and attempts kill before queued clean exit is delivered;384 then computes child_failed even with exitCode0/nullsignal. The same catch masks parent-RSS, accounting/reserve and threshold-kill throws. Historic v11-2 initiating cause remains UNKNOWN; synthetic scheduling is not proof that v11-2 followed it.
fix: NONE. Diagnosis-only; production GREEN/guard/resource/rules changes and commits not authorized. Prospective minimal direction is versioned/schema-bound finite trusted operation provenance (child_rss,parent_rss,time_budget,threshold_kill), sequence/relative time and exit-observed state, while preserving sticky uncertainty, kill attempts, thresholds, refusal and reader gates. Unknown remains unknown/failed; do not suppress sampler failures or grant a clean-exit exemption. The RED field spelling is a candidate diagnostic assertion, not an adopted production schema.
verification: Full tracked targeted run exit1 with7PASS/1intentionalRED in4.52seconds; targeted control rerun exit0 with7PASS/1SKIP in4.67seconds. Actual parent/budget source used, trusted HOST IO mocks only. No empirical or native race claim, production custody verification, regression suite, historic reader, private payload, raw private exception or Strategy/runtime execution.
files_changed: [.planning/debug/supervisor-sampling-repair.md,scripts/run-v1-38-lean-supervisor-exit-repro.test.ts]
specialist_hint: typescript

## Exact targeted commands

Full RED reproduction (tracked second invocation; exit1,7PASS/1RED):
`NODE_OPTIONS=--max-old-space-size=768 TSX_DISABLE_CACHE=1 NODE_DISABLE_COMPILE_CACHE=1 pnpm exec vitest run scripts/run-v1-38-lean-supervisor-exit-repro.test.ts --maxWorkers=1 --fileParallelism=false --reporter=dot`

Control-only repeat (exit0,7PASS/1SKIP):
`NODE_OPTIONS=--max-old-space-size=768 TSX_DISABLE_CACHE=1 NODE_DISABLE_COMPILE_CACHE=1 pnpm exec vitest run scripts/run-v1-38-lean-supervisor-exit-repro.test.ts --maxWorkers=1 --fileParallelism=false --reporter=dot -t 'clean control|queued clean exit|remains failed'`

Three test invocations were started: an initial invocation's returned session identifier was not retained and its result is not claimed; the tracked full reproduction and control repeat above supply the evidence. All invocations, files, coordination and elapsed time remain costs; no refund/reset or historic rerun occurred. 768MiB old-space was requested for the Node test processes, not certified as whole-tree RSS/2GB feasibility. Frozen fullold108Mms plus all newcontinuous costs from1791455941097 under136800000ms/deadline18:39:01.097Z,15GB300/34charges/exact2GB768MiB remain unchanged.

## Static and synthetic references

- scripts/run-v1-38-lean-baseline.ts175: synchronous child RSS helper/validation;311: actual accounting/reserve guard;350: broad interval;358: exit delivery/timer clearing;373: finite unknown provenance;384: sticky fail-closed terminal predicate;388: rejected parent disposition.
- scripts/run-v1-38-lean-supervisor-exit-repro.test.ts12: actual-host mocks with queued exit schedule;38: accounting IO mock;50: pure in-memory retry fixture;69: parent-RSS injection;74: actual source parent entry;82: fail-closed/privacy assertions;99: clean control;105: queued-exit ordering;112: alternate throws;118: RED provenance test.
- Prior .planning/debug/v11-2-resource-sampling.md and finite terminal verification report remain immutable and inconclusive about historic initiating cause.

## Symptoms

expected: Successful child completion is accepted only when actual resource supervision, cleanup and unique retained verification pass.
actual: Closed v11-2 charged one cell with compact success/OK/cleanupComplete=true, while parent child_failed/exitCode0/nullsignal and resource_sampling_exception caused unique reader refusal/FINALfalse.
errors: finite resource_sampling_exception only; do not read or publish private raw errors or Strategy/objective/memory/runtimeIO/stdio.
timeline: Current source84b80756/915; earlier bounded source-only diagnosis could not attribute the throw operation. Consumed v11-1/v11-2 evidence immutable.
reproduction: Local synthetic host lifecycle tests only; no fresh Match before source review/validation/verification and fresh admission gates.

## Scope

Direct approved eight-hour round carries fullold108Mms plus newcontinuous costs from1791455941097; cap136800000ms/deadline2026-10-08T18:39:01.097Z. Same15GB300/34priorcharges/allfilescosts/exact2GB768MiB and all frozen gameplay/runtime/privacy bounds. One prospective diagnostic/conditional36baseline pair only, unstarted. This session grants no empirical acceptance or execution authority.
