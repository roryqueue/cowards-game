# Phase 104: Isolated Runtime Service Boundary Hardening - Context

**Gathered:** 2026-05-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 104 hardens the JS/TS Strategy execution boundary so it is explicitly a narrow hostile-code execution service invoked by Go through a broker-ready public runtime contract. The phase keeps JS/TS Strategy support, but only inside the isolated runtime service and adapter boundary. It must make clear that the current TypeScript implementation is not the backend and not the future abstraction itself.

This phase does not build the future language-neutral Runtime Broker, replace JS/TS execution, promote WASM/WASI/component-model, or implement a production sandbox replacement. It defines and enforces the contract shape needed for a future broker to front or replace the current service.

</domain>

<decisions>
## Implementation Decisions

### Contract Naming
- **D-01:** Name the future-facing abstraction **Strategy Execution Service / Runtime Broker** in docs, manifests, and monitor-facing artifacts.
- **D-02:** Label today's implementation as the isolated JS/TS runtime service, not as the backend and not as the final Runtime Broker.

### Transport And ABI
- **D-03:** Keep the current HTTP+JSON runtime service as the v1.16 implementation.
- **D-04:** Describe the boundary in transport-neutral contract terms so a future broker can front or replace it without changing Go orchestration, persistence, scoring, or public evidence ownership.
- **D-05:** Require every future language runtime to implement the same JSON/runtime ABI with schema-validated request and response envelopes.
- **D-06:** Do not permit language-specific shortcut contracts for counted Match execution.

### Strategy Revision Artifact Policy
- **D-07:** Validate, compile/transpile, hash, size-check, and package Strategy Revisions at submission where practical.
- **D-08:** Matches must execute immutable Strategy Revision artifacts/revisions rather than mutable source or web/API evaluation paths.
- **D-09:** Go and web/API processes must not import, evaluate, transpile, or execute Strategy source.

### Runtime Service Authority
- **D-10:** The runtime service may execute Strategy code and return schema-validated internal runtime results to Go only.
- **D-11:** The runtime service must not claim jobs, complete Matches, persist Chronicles, refresh scoring, serve public product API routes, deliver public evidence, touch web session state, or act as a backend fallback.
- **D-12:** Runtime service outputs must remain internal to Go orchestration and must preserve public replay/privacy projection boundaries.

### Sandbox And Language Readiness
- **D-13:** Keep worker-thread, subprocess, container-subprocess, non-JS, and WASM/WASI/component-model readiness as explicit labels rather than implicit promotions.
- **D-14:** Treat WASM/WASI/component-model as a strong long-term candidate path for some languages, not a v1.16 promotion or a universal sandbox answer.
- **D-15:** Node `node:wasi` is not accepted as an untrusted Strategy sandbox.

### Failure And Privacy Semantics
- **D-16:** Malformed input, ABI drift, timeout, invalid output, crash, oversized payload, source mismatch, and unsafe diagnostics must fail closed.
- **D-17:** Failure responses must be schema-validated and redacted; they must not leak Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, session, token, DB DSN, host path, or private runtime internals.
- **D-18:** Runtime service failure must not trigger fallback to retired TypeScript backend paths.

### the agent's Discretion
The agent may decide whether Phase 104 expresses the broker-ready contract as spec exports, JSON schema artifacts, runtime-service tests, monitor metadata, documentation, or some combination, provided Go keeps calling the public runtime execution contract and the current service remains DB/job/API-free.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Context
- `.planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-CONTEXT.md` - Strict TypeScript role taxonomy, inventory format, and monitor-ready artifact decisions.
- `.planning/REQUIREMENTS.md` - RT-01 through RT-07 and related baseline requirements.
- `.planning/ROADMAP.md` - Phase 104 boundary and success criteria.
- `.planning/research/v1.16-SUMMARY.md` - Runtime service findings and broker-ready contract notes.

### Runtime Contracts
- `packages/spec/src/runtime-execution-service.ts` - Current `runtime-execution-service-v1.15` TypeScript contract definitions.
- `packages/spec/src/runtime.ts` - Strategy runtime ABI definitions.
- `packages/spec/artifacts/runtime-execution-service-request.v1.15.json` - Existing runtime service request schema artifact.
- `apps/go-backend/runtime_service_client.go` - Go runtime service client and invocation boundary.
- `apps/go-backend/runtime_service_client_test.go` - Go runtime service client tests.

### Runtime Implementation
- `apps/runtime-service/src/server.ts` - HTTP service wrapper and health/execute endpoints.
- `apps/runtime-service/src/execute-match.ts` - Runtime request validation, Strategy Revision source validation, execution, and response shaping.
- `apps/runtime-service/src/redaction.ts` - Runtime failure diagnostic redaction.
- `apps/runtime-service/src/runtime-config.ts` - Runtime adapter selection and metadata.
- `packages/runtime-js/src/abi-bridge.ts` - JS/TS runtime ABI bridge.
- `packages/runtime-js/src/executor.ts` - JS/TS Strategy runtime execution implementation.
- `packages/runtime-js/src/worker-thread-adapter.ts` - Worker-thread adapter candidate.
- `packages/runtime-js/src/subprocess-adapter.ts` - Subprocess adapter candidate.
- `packages/runtime-js/src/container-subprocess-adapter.ts` - Container subprocess adapter candidate.

### Project Non-Negotiables
- `AGENTS.md` - Do not execute user Strategy code in web/API process; do not use Node `vm` as a security boundary; treat Strategy code as hostile; validate every runtime boundary with schemas.
- `CowardsGame_Technical_Architecture_Spec_V1.md` - Runtime/backend separation constraints.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `RuntimeExecutionServiceRequestSchema` and `RuntimeExecutionServiceResponseSchema` already provide schema validation for request and response envelopes.
- `executeRuntimeServiceRequest` already validates source byte/hash mismatch and returns schema-validated system failures.
- Runtime service redaction helpers already centralize public failure messages and diagnostic filtering.
- Existing runtime-js adapter tests cover worker-thread, subprocess, container-subprocess, hostile matrix, validation, and isolation boundary behavior.

### Established Patterns
- Runtime service contract version is currently `runtime-execution-service-v1.15`.
- Strategy ABI version is currently `strategy-runtime-abi-v1.14`.
- Go invokes runtime execution through HTTP+JSON today; Phase 104 should preserve that implementation while documenting it as a replaceable transport binding.

### Integration Points
- Future monitor checks should assert that `apps/runtime-service` and `packages/runtime-js` do not import persistence, job lifecycle, web session, or product API modules.
- Runtime readiness labels should flow into the Phase 103/108 TypeScript surface manifest rather than relying on free-text docs only.

</code_context>

<specifics>
## Specific Ideas

The user confirmed that v1.16 should end with a contract shaped as if a language-neutral Strategy Execution Service / Runtime Broker will arrive soon, while keeping the actual v1.16 work limited to backend retirement and isolated JS/TS runtime service hardening.

</specifics>

<deferred>
## Deferred Ideas

- Building the actual language-neutral Runtime Broker.
- Replacing JS/TS runtime execution.
- Promoting counted non-JS Strategy play.
- Promoting WASM/WASI/component-model or Node `node:wasi` as a production hostile-code sandbox.
- Replacing the production sandbox boundary.

</deferred>

---

*Phase: 104-Isolated Runtime Service Boundary Hardening*
*Context gathered: 2026-05-24*
