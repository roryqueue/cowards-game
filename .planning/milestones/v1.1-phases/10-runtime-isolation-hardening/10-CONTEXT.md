# Phase 10: Runtime Isolation Hardening - Context

**Gathered:** 2026-05-18
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase makes the Strategy runtime boundary explicit, tests hostile Strategy code, and moves the project beyond treating worker threads as the final sandbox. It covers adapter boundaries, active-adapter visibility, subprocess/container/WASM spike or implementation, resource limits, IPC contracts, and strategy-versus-system failure taxonomy.

</domain>

<decisions>
## Implementation Decisions

### Implementation Ambition
- **D-01:** Plan for a real `StrategyExecutionAdapter` boundary and attempt a subprocess adapter implementation.
- **D-02:** If platform friction is high, a documented spike is acceptable only if it leaves adapter contract tests and a clear path toward container/WASM isolation.

### Default Runtime Behavior
- **D-03:** Keep the current worker-thread adapter as the default runtime behavior for now so the v1.0 author -> execute -> replay loop stays stable.
- **D-04:** Add configurability and visibility for which runtime adapter is active, but do not make a stronger adapter default until it is proven.

### Subprocess Contract
- **D-05:** Subprocess execution should use no shell.
- **D-06:** IPC should be one-shot JSON or JSON-lines, with schema-valid input and schema-validated output.
- **D-07:** Subprocess execution should use minimal environment, no inherited app secrets, stdout/stderr byte caps, timeout kill behavior, and no unnecessary inherited host capabilities.

### Failure Taxonomy
- **D-08:** Make runtime/system failures more granular than the v1.0 prototype.
- **D-09:** Distinguish timeout, forbidden capability, invalid output, oversized output, malformed IPC, subprocess nonzero exit, signal termination, and system failure.
- **D-10:** Only player-caused violations should map into gameplay/runtime violation semantics; infrastructure failures remain system failures.

### Hostile Test Posture
- **D-11:** Prefer a hostile test matrix over isolated examples.
- **D-12:** Tests should cover forbidden globals, dynamic import, worker/process access, filesystem/network attempts, infinite loop, memory pressure, oversized output, invalid output, thrown exceptions, and malformed subprocess responses.

### the agent's Discretion
- The planner may choose the exact adapter interface names, config surface, subprocess harness format, and test fixture organization as long as the decisions above are preserved.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project and Milestone Context
- `.planning/PROJECT.md` — Current v1.1 goal and runtime constraints.
- `.planning/REQUIREMENTS.md` — Phase 10 requirements ISO-01 through ISO-07.
- `.planning/ROADMAP.md` — Phase 10 goal, success criteria, and phase boundary.
- `.planning/research/SUMMARY.md` — v1.1 research summary.
- `.planning/research/STACK.md` — Runtime isolation findings and official-source guidance.
- `.planning/research/ARCHITECTURE.md` — Proposed runtime adapter boundary.
- `.planning/research/PITFALLS.md` — Worker-thread, Node permission, and sandbox complacency risks.
- `.planning/phases/09-strict-chronicle-grammar-and-compatibility/09-CONTEXT.md` — Failure and validation behavior that runtime violations feed into.

### Source Specifications
- `CowardsGameSpec_Full_Consolidated_v1.md` — Strategy, SoldierBrain, runtime violation, and deterministic Match constraints.
- `CowardsGame_Technical_Architecture_Spec_V1.md` — Runtime boundary and worker-process architecture constraints.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/runtime-js/src/worker-bridge.ts`: Current Worker-based execution path with timeouts, empty env, execArgv clearing, and V8 resource limits.
- `packages/runtime-js/src/worker-harness.ts`: Current synthetic module wrapper and forbidden capability shims.
- `packages/runtime-js/src/executor.ts`: Runtime result validation integration point.
- `packages/runtime-js/src/guards.ts`: Existing runtime limits and guard constants.
- `apps/worker/src/runner.ts`: Worker orchestration path that must continue distinguishing strategy failures from system failures.
- `packages/runtime-js/src/*.test.ts`: Existing validation, execution, and integration tests to expand into hostile matrix coverage.

### Established Patterns
- Executable runtime APIs are isolated behind `@cowards/runtime-js/worker`.
- `apps/web` uses validation/source APIs but should not execute Strategy code.
- Runtime output validation is separate from engine rule resolution.
- Runtime violations can become Chronicle events, while system failures are retried/failed by worker policy.

### Integration Points
- Runtime adapter selection likely belongs in `packages/runtime-js` and `apps/worker`, not `apps/web`.
- Worker completion and failure handling in persistence must preserve strategy/system failure distinctions.
- Chronicle runtime violation event payloads should receive player-caused violations only.
</code_context>

<specifics>
## Specific Ideas

- Attempt useful implementation, not only documentation, but do not destabilize the existing worker-thread path.
- Make the active adapter visible to developers.
- Treat subprocess/container/WASM as stronger boundary direction; Node `vm` is forbidden as a security boundary.
</specifics>

<deferred>
## Deferred Ideas

- Making subprocess/container/WASM the default production runtime is deferred until the stronger adapter is proven.
</deferred>

---

*Phase: 10-Runtime Isolation Hardening*
*Context gathered: 2026-05-18*
