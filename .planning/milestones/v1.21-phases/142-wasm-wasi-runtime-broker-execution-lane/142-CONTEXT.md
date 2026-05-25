# Phase 142: WASM/WASI Runtime Broker Execution Lane - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Execute Rust WASM artifacts through runtime-service/Wasmtime behind the Runtime Broker and preserve Go ownership boundaries. This phase wires the executable lane and failure taxonomy; Workshop polish and signed-in browser proof come later.

**Roadmap source:** "Execute Rust WASM artifacts through runtime-service/Wasmtime behind the broker and preserve Go ownership boundaries."

**Requirements:** WASM-04, WASM-05, RUST-05, EXEC-01, EXEC-02, EXEC-03, EXEC-04, EXEC-05, EXEC-06, EXEC-07

</domain>

<decisions>
## Implementation Decisions

### Execution Lane
- **D-01:** WASM runtime calls use WASI Preview 1 stdin/stdout JSON envelopes with `selectActivations` and `soldierBrain`.
- **D-02:** Runtime-service owns hostile Rust WASM execution through a registered `runtime-wasm-wasi` implementation.
- **D-03:** Execution uses immutable WASM artifact bytes/hash/metadata, never mutable Rust source.

### Wasmtime Runner
- **D-04:** Use Wasmtime CLI subprocess for alpha execution, launched by runtime-service with strict args.
- **D-05:** Wasmtime must run with no inherited env, no host preopens by default, no inherited network, output caps, memory/resource controls where practical, and fuel/timeout behavior.
- **D-06:** Missing Wasmtime, unsupported adapter/profile, missing artifact, stale artifact, malformed runtime response, and stopped runtime-service fail closed with public-safe diagnostics and no fallback.

### Go Boundary
- **D-07:** Go sends schema-validated runtime-service requests and validates metadata/hashes as data only.
- **D-08:** Go must not compile, execute, evaluate, or embed Rust/Zig Strategy code, and must keep lifecycle, scoring, retry, and public evidence ownership.

### Failure Taxonomy
- **D-09:** Malformed JSON, invalid method names, invalid actions, panics, traps, aborts, memory growth failures, timeouts/fuel exhaustion, oversized output, and schema-invalid results must classify safely.

### the agent's Discretion
Planner may decide whether the Wasmtime CLI runner lives in a new package or runtime-service module, provided it remains behind the existing runtime-service boundary and registry lookup.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/PROJECT.md` - Current milestone goals, baseline, non-goals, and promotion stance.
- `.planning/REQUIREMENTS.md` - Active v1.21 requirements and traceability.
- `.planning/ROADMAP.md` - Phase boundary, dependencies, and success criteria.
- `.planning/STATE.md` - Current status and active constraints.
- `.planning/research/SUMMARY.md` - Wasmtime/fuel/WASI execution guidance.

### Runtime And Spec
- `packages/spec/src/runtime.ts` - Runtime target and adapter registry.
- `packages/spec/src/types.ts` - Strategy Revision artifact metadata.
- `packages/spec/src/schemas.ts` - Runtime envelope and result validation.
- `packages/spec/src/runtime-execution-service.ts` - Runtime service request/response schema.

### Runtime Service And Go Boundary
- `apps/runtime-service/src/execute-match.ts` - Match execution runtime selection and source validation.
- `apps/runtime-service/src/runtime-config.ts` - Runtime adapter launch config patterns.
- `apps/go-backend/runtime_service_client.go` - Go-side request structs and runtime metadata validation.

### Workshop And Proof
- `packages/persistence/src/workshop.ts` - Revision data produced by Workshop save.
- `apps/web/app/workshop/server.ts` - Server-side validation/save entry point.
- `apps/web/app/workshop/workshop-client.tsx` - Diagnostics labels affected by runtime failures.
- `apps/web/e2e/v1-20-reliability-proof.spec.ts` - Later proof style and no-fallback checks.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/runtime-service/src/execute-match.ts` already constructs side-specific runtimes and routes Python separately from JS/TS.
- Go already serializes Strategy Revision metadata into runtime-service requests and validates source hash/source bytes.
- Existing runtime failure taxonomy and output caps can be adapted for WASM/WASI.

### Established Patterns
- Runtime-service implements hostile Strategy execution, while Go orchestrates jobs and persists results.
- Runtime adapter mismatches and unsupported metadata must fail closed.
- Public diagnostics are safe summaries, not raw stderr/stacks.

### Integration Points
- Add a Wasmtime-backed runtime implementation selected from runtime metadata.
- Add artifact hash/bytes validation to the runtime-service request path.
- Add tests for Rust-vs-Rust and JS/TS-vs-Rust execution without degrading JS/TS.

</code_context>

<specifics>
## Specific Ideas

The runner can be alpha-quality if it is honest: CLI subprocess, strict launch controls, bounded output, timeouts/fuel where practical, and explicit evidence that this is candidate/readiness proof rather than production sandbox certification.

</specifics>

<deferred>
## Deferred Ideas

- Embedded Wasmtime library integration.
- Component-model execution.
- Production sandbox certification.
- Workshop UI polish, covered by Phase 143.

</deferred>

---

*Phase: 142-WASM/WASI Runtime Broker Execution Lane*
*Context gathered: 2026-05-25*
