# NEW265-16 handshake-repair plan check v2

**Result: PLAN_CHECK_PASSED.** The revised `NEW265-16-HANDSHAKE-REPAIR-PLAN-v1.md` resolves the v1 blocker by specifying an existing test-only interception pattern that drives the real session producer without passing injected `transport`/`streamFactory` options under startup authority.

## Seam verification

The plan now points to the concrete pattern in `scripts/run-v1-38-lean-startup-v5.test.ts`: hoisted, deny-by-default `node:child_process` and `node:worker_threads` mocks intercept `spawnSync` and `Worker` (lines 32-46); the existing end-to-end fixture wires synthetic control responses, captures request frames, and returns a fake Worker (approximately lines 395-450). This exercises the ordinary default transport/stream code and the session's real request-frame producer while creating no OS process or native Worker. The production `LEAN_EXPERIMENT_SESSION_BINDING` guard remains in force, and the plan explicitly retains a negative assertion that authority plus injected transport/stream options are rejected.

The task's assertions are appropriately tied to the real producer and generated broker selection: exercise v5/v6/v7 authorities, compare emitted request roots to the corresponding version-domain digest for identical payload/ordinal, preserve v5/v6 behavior, reject wrong-version roots, and assert the broker source selected for each version. No detached helper or source-text-only test is proposed.

## Goal-backward and scope check

- Diagnosis and minimal fix align: v7 selects the v7 broker but currently emits a v5-domain startup request root; only the producer's version selection should change.
- Legacy v5/v6 domains, startup/guest/host/Match/cleanup bounds, policy, allocations, authority, privacy, and cleanup semantics are explicitly preserved.
- The source-only boundary remains explicit: no empirical route, native Docker/Worker/subprocess/Strategy execution, private payload inspection, reader reopening, refund/recredit, or completion claim. Existing refusal and charges stay immutable.
- One serial source-and-test task is feasible with the named existing test fixture. Required focused tests and typecheck are scoped integration verification, not additional feature work.

No remaining blocker or warning found in this narrow finite check. This passes the plan revision gate; it does not authorize any empirical execution or imply phase completion.
