# Phase 24: Production Runtime Boundary Spike - Context

**Gathered:** 2026-05-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 24 chooses and prototypes the production Strategy runtime boundary behind the existing `StrategyExecutionAdapter`. It must document the recommended path, keep worker-thread runtime as a local/dev fallback if useful, expose adapter metadata, validate JSON IPC boundaries, distinguish Strategy failures from system failures, and expand hostile Strategy regression coverage.

This phase does not change engine rules, Strategy API contracts, ladder scoring, public profile behavior, or add non-JS Strategy languages.

</domain>

<decisions>
## Implementation Decisions

### Runtime Path Recommendation
- **D-01:** Treat containerized subprocess as the leading production-boundary recommendation for v1.3.
- **D-02:** Hardened host subprocess is an acceptable intermediate prototype step if container execution cannot be completed in one phase.
- **D-03:** Worker-thread runtime remains available only as an explicitly labeled local/dev fallback, not a production hostile-code security boundary.
- **D-04:** WASM/WASI should remain a documented future/prototype option, not the selected v1.3 production path for JS/TS Strategy authoring.
- **D-05:** Do not rely on Node `node:wasi` for untrusted Strategy code.

### Adapter Contract
- **D-06:** The chosen boundary must live behind the existing `StrategyExecutionAdapter`.
- **D-07:** Do not change engine rules or Strategy API input/output contracts.
- **D-08:** JSON IPC input and output schemas remain strict; malformed IPC is a system failure, not a player penalty.
- **D-09:** Adapter metadata must expose isolation boundary, resource controls, timeout behavior, output caps, environment policy, exec policy, and production-readiness status.

### Failure Classification
- **D-10:** Preserve the Strategy failure vs system failure taxonomy.
- **D-11:** Strategy failures include invalid output, forbidden capability use, thrown exceptions, and timeouts where the Strategy consumed its budget.
- **D-12:** System failures include spawn/container infrastructure failure, malformed IPC, container termination outside Strategy classification, resource control misconfiguration, and harness failure.
- **D-13:** System failures must not become player losses or ladder penalties.

### Resource Controls and Diagnostics
- **D-14:** Prototype must prove timeout, stdout/stderr/output caps, memory/resource constraints, minimal environment, shell-disabled execution, and no inherited dangerous host capabilities.
- **D-15:** Containerized path should prefer no network, read-only filesystem where feasible, explicit CPU/memory/pids limits, minimal environment, and short-lived execution.
- **D-16:** Add preflight or diagnostics that make selected runtime, resource controls, and fallback behavior visible to developers before trial ladder launch.
- **D-17:** If Docker/container support is unavailable locally, fallback behavior should be explicit and visible rather than silent.

### Hostile Strategy Regression Coverage
- **D-18:** Hostile regression matrix must cover forbidden globals, dynamic import, process/worker access, filesystem/network attempts, infinite loops, memory pressure, oversized output, invalid output, thrown exceptions, malformed IPC, timeout, and subprocess/container termination.
- **D-19:** Tests must distinguish Strategy failure from system failure.
- **D-20:** Tests should run against the chosen adapter path where host support exists and still keep deterministic local fallback coverage.

### the agent's Discretion
- The planner may decide whether Phase 24 lands full containerized subprocess or a hardened subprocess plus container prototype, as long as the final recommendation is explicit.
- The planner may choose exact container tooling if it fits the repo's Docker Compose/local preflight patterns.
- The planner may choose exact adapter metadata fields if they satisfy D-09.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/PROJECT.md` — runtime isolation and hostile Strategy non-negotiables.
- `.planning/REQUIREMENTS.md` — RUNTIME-01 through RUNTIME-07 define Phase 24 requirements.
- `.planning/ROADMAP.md` — Phase 24 goal and success criteria.
- `.planning/research/SUMMARY.md` — v1.3 runtime research recommendation.
- `.planning/phases/21-ladder-scheduling-and-standings/21-CONTEXT.md` — failure classification impacts standings.
- `.planning/phases/23-disputes-and-competition-governance/23-CONTEXT.md` — governance and invalid result behavior.

### Existing Runtime Code
- `packages/runtime-js/src/adapter.ts` — existing StrategyExecutionAdapter and metadata contract.
- `packages/runtime-js/src/subprocess-adapter.ts` — existing subprocess adapter spike and JSON IPC execution path.
- `packages/runtime-js/src/subprocess-ipc.ts` — IPC encoding, parsing, byte caps, and system failure types.
- `packages/runtime-js/src/subprocess-harness.ts` — subprocess harness source.
- `packages/runtime-js/src/worker-thread-adapter.ts` — worker-thread fallback path.
- `packages/runtime-js/src/hostile-matrix.test.ts` — hostile Strategy regression coverage to expand.
- `packages/runtime-js/src/isolation-boundary.test.ts` — isolation boundary tests.
- `apps/worker/src/runtime-config.ts` — worker runtime adapter selection/configuration.
- `scripts/preflight.ts` — local/service preflight pattern to extend if needed.

### External Primary References
- Node child process docs: https://nodejs.org/api/child_process.html
- Node worker threads docs: https://nodejs.org/api/worker_threads.html
- Node WASI docs: https://nodejs.org/api/wasi.html
- Docker resource constraints docs: https://docs.docker.com/engine/containers/resource_constraints/
- Wasmtime interruption docs: https://docs.wasmtime.dev/examples-interrupting-wasm.html

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `StrategyExecutionAdapter` already isolates adapter choice from engine rules.
- `createSubprocessStrategyExecutionAdapter()` already uses shell disabled, explicit env, timeout, SIGKILL, stdout/stderr caps, and JSON IPC parsing.
- Worker-thread metadata already says it is not final hostile-code isolation.
- Hostile matrix and subprocess adapter tests already cover many failure cases.

### Established Patterns
- Runtime failures are schema-validated and classified.
- Subprocess infrastructure failures throw typed system failures rather than returning gameplay RuntimeViolation values.
- Local tooling already has Docker/no-Docker preflight patterns.

### Integration Points
- Add containerized subprocess adapter or wrapper behind `StrategyExecutionAdapter`.
- Extend runtime config to select production candidate vs worker fallback.
- Extend hostile matrix to chosen adapter.
- Extend preflight/diagnostics to report adapter/resource readiness.

</code_context>

<specifics>
## Specific Ideas

- Adapter metadata should make it impossible to accidentally present worker-thread as production-ready.
- Container failure should be classified as system failure unless the harness can prove the Strategy caused a classified violation.
- The final output should include a written recommendation, even if implementation lands as a prototype.

</specifics>

<deferred>
## Deferred Ideas

- Non-JS Strategy runtimes.
- Full WASM/WASI Strategy language migration.
- microVM/firecracker-style runtime.
- Distributed sandbox execution service.

</deferred>

---

*Phase: 24-Production Runtime Boundary Spike*
*Context gathered: 2026-05-19*
