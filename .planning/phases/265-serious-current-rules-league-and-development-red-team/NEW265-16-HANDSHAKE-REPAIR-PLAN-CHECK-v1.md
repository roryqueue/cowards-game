# NEW265-16 handshake-repair plan check v1

**Result: ISSUES FOUND — 1 blocker.** Narrow source-only review of `NEW265-16-HANDSHAKE-REPAIR-PLAN-v1.md` against `.planning/debug/v7-first-exchange-cleanup.md` and current `scripts/lib/v1-38-lean-container-match-session.ts`. No tests, helpers, native execution, or source changes were performed.

## Blocker

**[task_completeness / key_links_planned] The planned fake-transport regression cannot currently be connected through the session's startup-authority API.** The plan requires exercising the real producer with issued v5/v6/v7 authorities and a fake transport/stream. But `createLeanContainerMatchSession` rejects `transport` and `streamFactory` whenever `leanExperimentAuthority`/`leanExperimentBinding` is present (`LEAN_EXPERIMENT_SESSION_BINDING`, around lines 389-394). The injectable `transport`/`streamFactory` seams are therefore unavailable on the very path the test must drive. “Mock sealed fixture/admission seams transparently” does not identify a concrete supported test seam or how the actual `runMethod` producer will be reached without bypassing that guard. A source-text test or a test of a detached helper would not prove the required producer-to-broker contract.

**Fix required before execution:** revise the plan to specify a safe, existing test-only interception strategy that reaches the actual session producer and observes its emitted frame plus selected broker source, without weakening production authority checks or adding an unused helper. If no such seam exists, explicitly scope a minimal isolated test seam into the source/test ownership and define how production rejects it; otherwise the central regression is not executable under the stated “fake transport/stream” constraint.

## Confirmed coverage

- The diagnosed defect is represented correctly: startup version 7 selects `buildLeanContainerBrokerSourceV7()`, while `startupBinding.requestRoot` currently chooses the v5 domain for every version except 6. The generated v7 broker validates the v7 domain before Worker construction.
- The proposed correction is appropriately narrow: select the matching version domain, retaining v5/v6 identities and avoiding bounds, cleanup, policy, allocation, authority, privacy, or semantic changes.
- The plan explicitly forbids any empirical route, native Docker/Worker/subprocess/Strategy execution, private-payload access, reopening readers, or treating repair readiness as Match permission. It preserves the refused/consumed diagnostic and spent costs.
- One serial task is feasible in scope once the test seam is made executable. The test must assert the actual producer's frame against generated broker expectations for v5/v6/v7, including a wrong-domain rejection; keep v5/v6 regression assertions; and avoid asserting unobserved cleanup subresults or empirical outcomes.

## Structured issue

```yaml
issues:
  - plan: NEW265-16-HANDSHAKE-REPAIR-PLAN-v1
    dimension: task_completeness
    severity: blocker
    description: "The required fake transport/stream cannot be injected through createLeanContainerMatchSession when startup authority is supplied; the plan gives no supported test interception strategy for reaching the real request producer."
    task: 1
    fix_hint: "Specify a safe test-only interception that exercises the real session producer and captures emitted frame plus selected broker source without weakening production authority checks; otherwise add an explicitly bounded isolated seam with production rejection behavior to task ownership."
```

## Revision-gate disposition

This is one bounded plan-check iteration, not execution approval. Return the blocker to the plan author for revision and re-check. If the revision loop reaches its configured cap without resolving it, escalate to the developer under the Revision Gate policy; do not proceed with a test that misses the real producer or circumvents authority controls.
