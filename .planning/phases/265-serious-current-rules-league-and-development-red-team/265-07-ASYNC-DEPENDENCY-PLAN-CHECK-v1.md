# Plan 07 asynchronous dependency supplement check

## ISSUES FOUND

Scope: one source-only supplement to existing Plan 265-07; three sequential tasks, six files. Static inspection only. No source edits, tests, imports, profiling, Match, provider/model/Docker work, commit or empirical authority. Phase 265 remains incomplete.

Two BLOCKER findings require a Task 3 revision before execution. No human-only checkpoint is necessary: the proposed repair can preserve the approved bounds, durability, no-refund accounting and dispatch policy.

### BLOCKER 1 — racing invocation rejection can overtake active retention

Task 3 adds a per-wrapper pending guard but does not define how its rejection passes through the existing ordinary and response outer `invoke` catches. Those catches currently synchronously append `runtime-invocation-failure` (`scripts/run-v1-38-serious-league.ts:446-450`) and `response-runtime-invocation-failure` (`scripts/lib/v1-38-league-response-runtime.ts:188-192`). A second call rejected while the first append is pending reaches these catches before that append settles. A second wrapper sharing the graph can similarly fail `beforeInvocation` immediately. Task 2's public append guard prevents the premature append, but its error can replace the initiating error and propagate into cleanup/terminal handling while the other operation is active. Merely awaiting the successful initiating invoke does not cover these rejection paths.

Fix: specify a graph-owned read-only settlement gate (for example `whenIdle`/`settlePending`, not a dispatch queue), and await it in the ordinary/response failure-retention and asynchronous cleanup paths before synchronous failure append, provider cleanup or terminal publication. Preserve the initiating operation's original failure; the settlement gate must not detach or silently consume it. Same-wrapper racing invocation may await its active operation's settlement and then reject without another guest call. Shared-graph refusals must not call a second provider, mutate the head, charge another publication or begin cleanup while pending. The existing stopped-after-retention-failure latch remains mandatory.

Add controlled tests for both same-wrapper and two-wrapper races through the actual outer catch adapters, with one fsync delayed and the other rejected. Assert no premature failure record, provider close or terminal; both launched operations settle, original errors remain observable, and no subsequent guest invocation occurs after retention failure.

### BLOCKER 2 — direct synchronous close remains unguarded

Current `wrapLeagueProbeProvider.close` directly calls `provider.close` (`scripts/lib/v1-38-league-response-runtime.ts:57`); ordinary host close also immediately appends cleanup (`scripts/run-v1-38-serious-league.ts:453`). Task 3 says not to change close's contract but assigns no pending behavior. A direct close during delayed retention can therefore stop the provider and attempt cleanup before fsync settlement, contradicting the planned no-cleanup-overtakes invariant.

Fix: preserve the synchronous close signature and explicitly reject close while wrapper/graph work is pending without calling underlying close or retaining cleanup. Production asynchronous cleanup paths must await the settlement gate from finding 1 before invoking synchronous close. Do not return a Promise from the existing synchronous provider close contract. Test direct close while pending (underlying close count stays zero), then settled success/failure cleanup, including the ordinary close adapter and response finally path.

```yaml
issues:
  - plan: "265-07 supplemental"
    task: 3
    dimension: key_links_planned
    severity: BLOCKER
    description: "Pending-guard rejection can enter ordinary/response failure retention and cleanup before another invocation's dependency operations settle."
    fix_hint: "Define graph-owned settlement gate; await it before failure append/cleanup/terminal; test same-wrapper and shared-graph racing calls without another guest dispatch and preserve original errors."
  - plan: "265-07 supplemental"
    task: 3
    dimension: task_completeness
    severity: BLOCKER
    description: "Direct synchronous close has no planned pending guard and can close a provider before durable retention settles."
    fix_hint: "Keep synchronous close, reject pending close without side effects, await settlement in asynchronous cleanup callers, and test adapter/finally ordering."
```

### Covered without additional blockers

- Repository task names a real default `node:fs.fsync(fd, callback)` seam, owned byte snapshots, exactly two bounded dependencies, fd lifetime, all-settlement error handling, input-order error selection and exclusive temporary ownership. Both successful file syncs precede dependency directory sync, descriptor file sync and final directory sync. Default production delegation should be exercised by the named real-I/O tests, not only asserted on an injected seam.
- Ordered prewrite callbacks, conservative partial charges, cap/reserve prechecks, no refunds and charged-but-absent republication refusal are explicit. Callback refusal before writes can leave a prior charge without a file; this is preserved, not treated as reusable capacity.
- Graph task explicitly guards public append/appendInvocation/beforeDispatch/beforeInvocation while pending, preserves prior durable head, stops dispatch after async publication failure and keeps synchronous/large/stream paths intact. Exact bytes/roots and successful accounting are required for both invocation kinds.
- Wrapper retention is awaited before WeakMap issuance/return; ordinary and response root arrays are pushed afterward. The optional typed response capability and production-graph adapter forwarding are executable requirements, not a future promise.
- D-01/02/04/05/06/10, lean amendment and standing approval support this internal I/O repair without changing 120000 ms, capacity cadence, limits, zero-retry policy, isolation or final gates. Current 107.548 ms sampled append and approximately 90% synchronization support investigating this bottleneck; 2.865 ms pressure-reader observations neither authorize cadence changes nor forecast whole-Match completion.
- Tasks include files/action/automated verify/done; three tasks/six unique files are bounded. The document is explicitly a sequential supplemental unit, not a newly scheduled numbered plan. Existing validation artifact is present; all three tasks have source-only automated commands and no missing-test/watch/E2E command issue. Architectural ownership remains private offline lab; engine and hostile-runtime ownership are unchanged. Phase pattern map does not assign these six repair files a new analog. Full phase coverage and historical research questions are not re-opened by this narrow check.

### Actual reviewed byte hashes

Raw SHA-256, measured read-only during this check:

| File | SHA-256 |
| --- | --- |
| `265-07-ASYNC-DEPENDENCY-REPAIR-PLAN-v1.md` | `c05c55a3b2921e138f3ec581779845d0e7c4af426e27d7d9cdc1bf13d573df68` |
| `packages/strategy-lab/src/league/repository.ts` | `98b68cce1a3805d495feb9153b937dce69529866f604a1bfba96b43f370efdc2` |
| `packages/strategy-lab/src/league/repository.test.ts` | `bf6e31683edb1372759ab853364bd292ef1c6fb9123b35efda5e1947316ce4da` |
| `scripts/run-v1-38-serious-league.ts` | `6bd13928345b91d2736bc6c4cc3ca9c234ddd9594b5c1dd1d511d688eefc83a3` |
| `scripts/run-v1-38-serious-league.test.ts` | `4b0104a8620adb394559add1c682c8f49f152dbb279d181bfbcbd3f9b437442e` |
| `scripts/lib/v1-38-league-response-runtime.ts` | `686c83d954178ee75d3c0af68c49b569af83d93abec1560c7b7e4254708ba607` |
| `scripts/lib/v1-38-league-response-runtime.test.ts` | `f94015d69669416606a7c9e00ea8daed5206fd5b53dc310431efbe9b23e506fc` |

Return to root for the focused Task 3 revision, then source implementation and the existing scoped review/gate. No longer lifetime, new allocation, repeated profiler or custody/certification process is prescribed.
