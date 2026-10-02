---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "07"
type: execute
supplemental: true
status: source-only-repair-plan-revised-after-check-v1
wave: 5
depends_on: []
autonomous: true
requirements: [LEAG-02, LEAG-09]
files_modified:
  - packages/strategy-lab/src/league/repository.ts
  - packages/strategy-lab/src/league/repository.test.ts
  - scripts/run-v1-38-serious-league.ts
  - scripts/run-v1-38-serious-league.test.ts
  - scripts/lib/v1-38-league-response-runtime.ts
  - scripts/lib/v1-38-league-response-runtime.test.ts
must_haves:
  truths:
    - "Only the two dependency file fsyncs overlap; both complete successfully before the unchanged dependency directory barrier and serial descriptor publication."
    - "No descriptor head, wrapper-issued evidence, subsequent invocation, cleanup record or terminal overtakes an unsettled dependency operation."
    - "Every actual fresh publication attempt is charged before write under the unchanged byte/record limits; failure or uncertainty never refunds charges."
    - "The synchronous path remains available and unchanged; successful asynchronous records reproduce its exact artifact bytes, roots and successful accounting."
  artifacts:
    - path: packages/strategy-lab/src/league/repository.ts
      provides: bounded two-dependency asynchronous fsync publisher with real production fsync delegation
    - path: scripts/run-v1-38-serious-league.ts
      provides: one-in-flight invocation append and ordinary-provider awaited retention
    - path: scripts/lib/v1-38-league-response-runtime.ts
      provides: retention awaited before WeakMap issuance and response-provider return
  key_links:
    - from: repository asynchronous dependency publisher
      to: existing publishLeagueArtifact
      via: both file fsync settlements and dependency directory barrier before descriptor publication
    - from: LeagueRecordGraph.appendInvocation
      to: wrapLeagueProbeProvider
      via: awaited retention callback before issued.set and return
    - from: ordinary and response provider callbacks
      to: LeagueRecordGraph
      via: runtimeRecords/invocationRecords appended only after durable completion
---

# Plan 07 supplemental repair: overlap two dependency file fsyncs

<objective>
Repair the measured single-chunk invocation writer within the existing Plan 07 corrective implementation loop. Preserve D-01, D-02, D-04, D-05, D-06 and D-10: immutable canonical records, fail-closed evidence, hostile-provider isolation, complete charges, fixed gameplay/runtime bounds and deterministic reduction. This is not a new numbered phase plan, empirical allocation, permission artifact or authority chain.

Purpose: remove serial waiting between two independent file fsyncs while keeping the durability boundary that makes invocation evidence usable. Output: a narrow six-file source/test change, suitable for the existing scoped review and unchanged source gate. No measured speedup or successful full-Match outcome is promised.
</objective>

<execution_context>
@/Users/roryquinlan/.codex/gsd-core/workflows/execute-plan.md
</execution_context>

<context>
@AGENTS.md
@.planning/PROJECT.md
@.planning/REQUIREMENTS.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/research/SUMMARY.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-07-PLAN.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-CONTEXT.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-LEAN-AMENDMENT.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-PROSPECTIVE-LEAGUE-APPROVAL-20261001.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-07-V6-COST-PROFILE-RESULT-v1.md
@.planning/debug/phase265-league-lifetime-v3.md
@packages/strategy-lab/src/league/repository.ts
@packages/strategy-lab/src/league/repository.test.ts
@scripts/run-v1-38-serious-league.ts
@scripts/run-v1-38-serious-league.test.ts
@scripts/lib/v1-38-league-response-runtime.ts
@scripts/lib/v1-38-league-response-runtime.test.ts
</context>

## Evidence and implementation boundary

Current measured production source is dbf5daa24b0764f68124af2e475b9aa6135dc8ae, implementation70430463/source2f008952. Its completed, closed data-only profile reproduced the five selected original invocation records in 50 fresh writes: mean107.54758ms, 150 file fsyncs totaling2931.027ms and 100 directory fsyncs totaling1906.276ms, approximately90% sampled synchronization time. The no-op-capacity beforeInvocation mean is1.3197ms, full-value admission3.24278ms and encode-only0.95408ms. The separate closed ten-observation actual pressure-reader mean is2.865ms; it created no receipt or admission. Components overlap; do not sum them or extrapolate a whole-Match completion claim.

The current ordinary hot path is LeagueRecordGraph.publish: two individually fsynced dependency files, one dependency directory barrier, then publishLeagueArtifact for the descriptor with its own file fsync and directory barrier. Successful fresh records therefore still require three file fsyncs and two directory fsyncs. The new response invocation path uses this same narrow durability sequence for its two dependencies; its canonical kind remains response-runtime-invocation. The old synchronous append path, including its current response and large-record behavior, stays intact.

### Partial-failure accounting is an implementation detail, not a new product decision

D-05 requires all attempts and failures to remain charged. CONTEXT's discretion permits storage chunking and worker scheduling when identities, charged work, canonical reductions, privacy and output roots remain invariant. The lean amendment fixes caps, all-starts-charged and no-refund semantics; it does not freeze the serial writer's incidental first-failure attempt subset. Two fresh dependency operations actually attempted in parallel must both remain charged even if the first fails. Successful counts/bytes remain identical, actual attempted work is never hidden, and caps cannot be exceeded. This is permitted conservative scheduling, not authority to charge only successes, refund an absent file, or lower a gate. Serial failpoint assertions remain unchanged for the retained synchronous API; async assertions explicitly expect both charges when both attempts started.

No human-only checkpoint is identified for this bounded repair. Stop for direction only if implementation requires an actual frozen-contract change, such as removing a fsync/barrier, relaxing no-refund/caps, changing capacity cadence, increasing120000ms, adding cache/provider reuse or changing dispatch policy. Standard asynchronous file I/O does not itself require another approval.

### Interface and call-chain contract

- Add publishLeagueArtifactDependenciesAsync(repository, dependencies) accepting exactly two bounded byte arrays at runtime and returning Promise of ordered roots. Add a typed async file-fsync durability seam to createLeagueRepository; the default delegates node:fs.fsync(fd, callback), rejecting the callback error. Keep syncDirectory synchronous and the descriptor on publishLeagueArtifact.
- Add LeagueRecordGraph.appendInvocation(kind, value, links), returning Promise&lt;LabRoot&gt;, for runtime-invocation and response-runtime-invocation only. Share canonical preparation with publish rather than maintain a second encoder. Keep append returning LabRoot. Multi-chunk, execution-stream and other record paths remain synchronous fallbacks with their existing barriers.
- Extend the wrapper retention callback to void | Promise&lt;void&gt;. It must await retention before issued.set(wrapped, evidence) and returning wrapped. Existing synchronous fixture callbacks remain valid.
- Add optional appendInvocation to LeagueResponseRetention, retaining append's synchronous signature. Production response retention receives session.graph, which implements it; existing injected retainers may use their synchronous append fallback. Both branches are awaited by the wrapper callback.
- Ordinary call chain: kernel awaits wrapped invoke → provider invoke/verify/projection → awaited graph appendInvocation → two dependency fsync settlements → dependency directory barrier → serial descriptor fsync/publication/final barrier → graph head commit and runtimeRecords.push → wrapper WeakMap issuance/return → next kernel invocation.
- Response call chain is identical through invocationRecords.push and response-runtime-invocation. Failure callbacks, provider cleanup and Match/attempt terminals execute only after that invocation promise has settled.

### Check-v1 corrections: racing calls and synchronous close

Independent plan-check-v1 found two Task3 blockers, resolved by the following
mandatory implementation/test requirements. They do not change runtime limits
or add a new operator checkpoint. `FactorySupervisionProvider.close()` remains
synchronous; do not turn it into a promise or widen its public contract.

- Track the complete active wrapper invocation, not only its retention tail.
  A racing same-wrapper `invoke` waits for that active operation to settle,
  then rejects without calling the guest, capacity callback or retainer. It
  must not surface an early error to outer failure/cleanup handlers.
- Expose a graph-owned settlement gate for its one active append. It waits
  without queuing a publication/guest call, issuing evidence, refunding work,
  changing the dispatch latch or replacing the initiating error. A shared-graph
  pending guard may still refuse immediately, but both ordinary and response
  async outer failure handlers MUST await this gate before synchronous failure
  append or actual provider cleanup. Audit all affected catches/finally paths;
  no error handler may bypass the gate while another wrapper's append is pending.
- Wrapper synchronous `close()` refuses while its active invocation/retention
  is pending, without calling the underlying provider. Actual owned cleanup in
  async production paths first waits for graph/wrapper settlement, then uses
  the unchanged synchronous close contract. A refusal is not a cleanup-success
  record, and uncertainty/error objects are not replaced by a guard failure.
- Test two calls to one wrapper, two distinct wrappers sharing a graph, and a
  direct pending `close()`. Pause one real fsync; assert no second guest call,
  failure record, provider close or terminal before settlement. Resolve/reject
  it, verify the original initiating error and conservative charges survive,
  then verify cleanup/failure retention proceeds without speculative evidence.
  Preserve one-active-operation/no-queue limits and stop future dispatch after
  a genuine retention failure. No host/provider interface beyond the six-file
  repair may silently change; if a wider edit is necessary, report it to root.

## Dependency and execution order

One supplemental implementation unit, three sequential tasks: repository primitive → graph append → provider wiring. No parallel file ownership or new plan numbering. Task 3 intentionally revisits only the runner's ordinary retention callback introduced in Task 2; the rest of its changes belong to response-runtime. Preserve other agents' edits and unrelated worktree changes.

<tasks>
<task type="auto" tdd="true">
<name>Task 1: Retain the durability boundary while overlapping two file fsyncs</name>
<files>packages/strategy-lab/src/league/repository.ts, packages/strategy-lab/src/league/repository.test.ts</files>
<behavior>
- Both fresh dependency fsyncs start before either controlled completion is released; at most two file operations are in flight. No hardlink publication/group success precedes successful settlement of both fsyncs.
- One failed fsync plus one delayed fsync does not reject the group or begin failure cleanup until the delayed operation settles. Every launched operation is observed; no rejected promise escapes handling.
- Both fresh attempts retain their charges after either async failure. Existing-identical dependencies have no fresh charge; conflicting/type/symlink/temp/collision cases cannot overwrite a target or remove another operation's file.
- Fresh, mixed-existing and all-existing pairs retain one real dependency directory barrier; failure before that successful barrier returns no committed group.
</behavior>
<action>
Add the typed async fsync seam and the exactly-two-dependency API per D-01/D-02/D-05. Use a private helper for real node:fs.fsync callback completion; do not replace durable I/O with immediate resolved promises. Snapshot the two byte arrays into owned copies and validate size, digest, safe directory, existing file type/content and temporary-name constraints before async suspension. Deduplicate identical target roots while returning ordered roots, preserving existing-identical reuse accounting. Before launching any write, invoke beforePublication once for each fresh distinct target in input order; no await separates these callbacks. A callback refusal aborts before writes, preserves any completed prior charge and propagates its error. No callback error is swallowed.

For each charged fresh target retain mode0600, O_EXCL|O_NOFOLLOW, full-write completion checks and exact hardlink publication; only its file fsync is asynchronous. Hold each fd open until its fsync settles. Bound the group to two operations, capture synchronous launch exceptions and use all-settlement handling before error propagation, closing fds, temporary disposition or any caller cleanup. After both successful fsyncs, publish links and unlink owned temporary names in deterministic input order, then call the existing real syncDirectory once, even when both targets already existed. A failed group never deletes a published dependency, overwrites a target, refunds a charge or returns a committed group. Preserve current inspection-only residue on failed/uncertain publication rather than adding recovery or sweeping files. Preserve current error objects where possible; choose simultaneous errors by input order, not completion order. Leave atomic, publishLeagueArtifactDependencies and all synchronous callers unchanged.

Extend repository.test.ts's existing real-I/O observation pattern. Use the typed seam with controlled promises that delegate real fsync before successful release; reject selected completions or syscall boundaries explicitly. Cover first/second fsync, open/write/link/unlink, callback and dependency-directory failures, identical reuse and conflicting files, invalid lengths/types, bad temporary names, pre-existing temporary O_EXCL collisions and symlink refusal. Two separate repository instances using colliding target/temp names must not overwrite or unlink each other's ownership. Label these as source-level order/error checks, not simulated power-loss proof.
</action>
<verify><automated>./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/league/repository.test.ts</automated></verify>
<done>The old synchronous tests remain valid; new asynchronous tests prove exactly-two concurrency, real fsync delegation, barrier order, ownership protection, conservative charges and complete settlement before rejection.</done>
</task>

<task type="auto" tdd="true">
<name>Task 2: Add a single-in-flight graph invocation append with an unchanged serial fallback</name>
<files>scripts/run-v1-38-serious-league.ts, scripts/run-v1-38-serious-league.test.ts</files>
<behavior>
- Async and sync append in separate fresh stores produce identical payload/chunk/descriptor bytes and roots for both invocation kinds, including exact links to a prior head and equal successful accounting.
- While either dependency sync is pending, latestRoot remains the prior durable head; synchronous append, another async append, beforeDispatch and beforeInvocation reject without graph mutation or new charges.
- Failed dependencies or dependency barrier cannot create the descriptor. Descriptor file-sync/final-barrier failure cannot credit a head. A descriptor may exist as uncertain residue after its final barrier fails, but is never returned as committed evidence.
- Exact full-group byte/record prechecks and reserve checks reject without a write. Charges already made by a refusing callback or failed operation persist; charged-but-absent targets cannot be republished.
- A multi-chunk invocation, non-invocation or execution-stream record follows the original synchronous path and its exact per-artifact barriers.
</behavior>
<action>
Refactor private canonical preparation only enough to share the existing admitted bytes, ordered pending artifacts, descriptor, deduplicated/sorted links, chunk roots and complete-group precheck between publish and appendInvocation; retain existing synchronous append behavior per D-01/D-10. Hold one graph-wide pending operation, never a queue. Snapshot the prior latestRoot and copied prepared bytes before await. Before launching the pair, compute the exact unique fresh-target bytes/records plus descriptor and reserve against the existing LeagueRetentionBudget and graph limits, with no new capacity metric or cadence. Perform precheck and ordered dependency charge callbacks in the same synchronous turn before the first suspension. Preserve the existing successful accounting definition; no reservation is refunded on refusal or failure.

For exactly one payload chunk and no stream artifacts, await the new two-dependency publisher, then call unchanged publishLeagueArtifact for the descriptor, and only after its final directory barrier succeeds commit latestRoot. Use the same path for runtime-invocation and response-runtime-invocation. Noneligible calls use the original synchronous publication path. Protect public append, appendInvocation, beforeDispatch and beforeInvocation while pending; internal synchronous link-group preparation must not bypass the single-operation boundary or alter the committed head during asynchronous waiting. Ensure record-links grouping follows existing deterministic semantics. Clear pending only after all dependency operations settle and publication success/failure is known. On async publication failure latch a dispatch stop without refunding or misreporting budget exhaustion; allow existing failure/cleanup retention after settlement, but never another runtime dispatch. Do not introduce a graph/provider cache or terminalMode across an await.

Add a focused describe block named asynchronous invocation graph retention. Parameterize both invocation kinds, fresh/mixed/all-existing targets, prior-head preservation, callback refusals and byte/record/reserve boundaries. Observe both fsync completions, real dependency barrier, descriptor file sync and final barrier; verify exact bytes/roots with the existing expectedArtifacts pattern extended only for kind/links. Use controlled promises to assert no overlapping graph mutation or head commit; hold one fsync while rejecting the other and prove caller rejection waits for settlement. Verify large/multichunk and execution-stream fallback plus existing synchronous tests without changing their serial failpoint expectations.
</action>
<verify><automated>./node_modules/.bin/vitest run --maxWorkers=1 scripts/run-v1-38-serious-league.test.ts -t 'asynchronous invocation graph retention|graph dependency durability'</automated></verify>
<done>A graph can retain one invocation asynchronously without exposing a speculative head, overlapping mutation or reducing any durability/accounting bound; both invocation kinds and the serial fallback are covered.</done>
</task>

<task type="auto" tdd="true">
<name>Task 3: Await durable invocation retention in ordinary and response providers</name>
<files>scripts/lib/v1-38-league-response-runtime.ts, scripts/lib/v1-38-league-response-runtime.test.ts, scripts/run-v1-38-serious-league.ts, scripts/run-v1-38-serious-league.test.ts</files>
<behavior>
- A delayed retain callback keeps invoke unresolved and verify false for the captured admitted evidence. Only successful durable retention permits WeakMap issuance/return and the next guest invocation.
- A retention rejection preserves its error, issues no evidence, stops subsequent guest calls and reaches cleanup/failure retention only after all dependency syncs settle.
- Ordinary and response production callbacks call appendInvocation and push their invocation root only after resolution. Synchronous injected retention still works, with no detached async callback.
- Projection, identity, capacity-before-provider ordering, failure classification, provider cleanup and read-only issued:false verification remain unchanged.
</behavior>
<action>
Change wrapLeagueProbeProvider's retain type to void | Promise&lt;void&gt; and await it immediately before issued.set and return, preserving provider.verify and projection admission per D-02/D-04. Maintain a per-wrapper pending guard and failed-retention stop so an attempted concurrent or later invocation cannot call the underlying provider while prior retention is pending or failed. Do not add provider reuse, retry, parallel kernel dispatch or change close's contract. Normal kernel callers already await invoke; the graph promise must finish settlement before its rejection reaches existing catch/finally cleanup paths.

In the ordinary host callback, await graph.appendInvocation("runtime-invocation", value, [startRecord]), then runtimeRecords.push. In LeagueResponseRetention add the optional typed appendInvocation capability; in produceLeagueResponse choose it when present, otherwise use the existing synchronous append, await the resulting completion, then invocationRecords.push. The production session.graph always provides the async capability. Preserve response Match charges, authoring, factory-supervision retention, cleanup and all failure/result records on their current synchronous path. Audit the two wrapLeagueProbeProvider call sites and the test's result-retention adapter: it must forward the new optional capability where wrapping a production graph, not accidentally strip it. No other caller interface needs an asynchronous rewrite.

Extend the short host-bound league behavioral probes tests with controlled success/failure retention promises, captured admitted evidence and counters for provider.invoke/verify/close. Add focused source-only ordinary and response integration cases to the asynchronous invocation graph retention block using existing fixture host/run seams: pause a real repository async fsync, prove no evidence return, invocation-record root, next provider call, cleanup or terminal, then resolve/reject and assert correct ordering. For the response case reuse the existing three-arm fixture setup but stop intentionally after the first Match on retention failure; do not run the full response schedule just to test this seam. Keep legacy synchronous retainer/projection tests intact. These fixtures do not execute submitted Strategy code or launch Docker/model work.
</action>
<verify><automated>./node_modules/.bin/vitest run --maxWorkers=1 scripts/lib/v1-38-league-response-runtime.test.ts -t 'host-bound league behavioral probes' &amp;&amp; ./node_modules/.bin/vitest run --maxWorkers=1 scripts/run-v1-38-serious-league.test.ts -t 'asynchronous invocation graph retention'</automated></verify>
<done>Both production invocation paths await durable retention before usable evidence and future calls; delayed/error paths cannot race cleanup or terminal publication, and synchronous fixture callers remain compatible.</done>
</task>
</tasks>

<threat_model>
## Trust boundaries and scoped STRIDE register

| Threat | Category | Boundary/component | Severity | Disposition | Specific mitigation |
| --- | --- | --- | --- | --- | --- |
| T-265-ASYNC-01 | Tampering | prepared bytes → async repository | high | mitigate | owned byte snapshots, digest/type/path guards, exclusive no-follow temporary files and no-overwrite hardlinks; Task1/2 tests |
| T-265-ASYNC-02 | Elevation of privilege | retained result → host-issued wrapper evidence | high | mitigate | await pair + dependency barrier + serial descriptor/final barrier before head and WeakMap issuance; Tasks2/3 |
| T-265-ASYNC-03 | Repudiation | failed publication → allocation charges | high | mitigate | ordered per-target prewrite charges, same complete-group cap precheck, no refunds and uncertain-republication rejection; Tasks1/2 |
| T-265-ASYNC-04 | Denial of service | asynchronous operations → graph/kernel cleanup | high | mitigate | two file operations maximum, one graph operation, all-settlement error handling, pending mutation guards and failure dispatch latch; all tasks |
| T-265-ASYNC-05 | Information disclosure | private graph → reports/public product | high | mitigate | no payload projection/schema/public path changes, unchanged existing boundary gate; Task3 |
| T-265-ASYNC-SC | Tampering | dependency installation | low | accept | no package install, lockfile, toolchain or new external dependency in this repair |
</threat_model>

## Multi-source coverage audit for the supplemental scope

This artifact supplements the existing plan set; it does not replace or claim implementation of the full Phase265 goal. Non-repair features remain assigned to their existing plans, not deferred by this supplement.

| Source | Item | Coverage |
| --- | --- | --- |
| GOAL | complete attacked current-rules game without sparse/hidden evidence | existing265-01..07; this repair preserves durable invocation closure/failure evidence in Tasks1..3, no empirical completion claim |
| REQ | LEAG-02, LEAG-09 | Tasks1..3 preserve system-failure blocking, charged failures and unchanged complete response/probe denominator |
| REQ | LEAG-01,03,04,05,06,07,08 | existing265-01..07 unchanged; no matrix, solver, response admission, report or finalist behavior reduction |
| RESEARCH | current v6 sampled sync cost; independent dependency fsync overlap | Tasks1..3; no speedup/whole-Match inference, no second profile invocation |
| RESEARCH | dependency barrier before descriptor; final descriptor barrier; hostile file/accounting bounds | Tasks1/2; actual fsync delegation, fault/ownership tests and exact byte comparison |
| CONTEXT | D-01,02,04,05,10 | Tasks1..3 explicitly preserve identity, integrity, issuance, charging and deterministic ordering |
| CONTEXT | D-03,06 | unchanged kernel, gameplay, bounds, runtime/container/cache and privacy fences; no engine/source execution edit |
| CONTEXT | D-07,08,09,11,12,13,14,15,16,17,18,19,20,21 | existing265-01..07 remain coverage; Tasks2/3 preserve all matrices/solver/response/portfolio/finalist/probe/report paths and gates |
| CONTEXT | deferred formation/retraining/holdout/product certification/rule experiments | excluded; no such action or artifact in this repair |
| AMENDMENT/APPROVAL | fixed limits, zero retries, fresh-route-only standing scope | all tasks retain120000ms, capacity cadence/caps, cache-disabled container isolation; consumed routes and unique verifiers stay closed |

<verification>
Run the three focused source-only commands above during implementation, targeting under60seconds per command; if a focused test exceeds that budget, investigate the test seam instead of launching broad empirical work. After source is complete, the existing independent scoped review and unchanged Plan07/CI source gate apply once to the repaired source; do not substitute the focused tests for that gate or recreate historical custody. Include strategy-lab build, required strict runner/response-runtime types and unchanged boundary checks from the existing gate. No package installation is needed.

Before handoff inspect the six-file diff: only two independent dependency file fsyncs overlap; descriptor remains serial; fresh small ordinary/response records have three file fsyncs/two directory barriers; synchronous/large/journal paths retain their old sequences. No imports/profiles/tests are run by the planner creating this document. No retained verifier or closed profiler is repeated. Subsequent bounded measurement or any fresh empirical preparation is outside this supplement and belongs to the existing root-owned corrective loop.
</verification>

<success_criteria>
The six-file repair is feasible without a human-only contract change, all dependency work settles before publication/error handoff, both production paths await durable evidence, successful bytes/roots/accounting match the synchronous reference, and failed attempts remain charged under the same caps. Existing Plan07 scope and final-quality gates remain unchanged. Source acceptance is not LEAG completion, freeze eligibility, successful empirical timing or production certification.
</success_criteria>

<output>
Return the actual six-file diff, focused test outcomes, any unresolved source defect and the existing scoped review/gate handoff to the root. Do not create a new numbered plan, summary chain, permission packet, capacity receipt or empirical allocation as an output of this supplement. During this planning task only this supplemental document is written; no code edit, test, import, profile, Match, Docker/model action, commit or push occurs.
</output>
