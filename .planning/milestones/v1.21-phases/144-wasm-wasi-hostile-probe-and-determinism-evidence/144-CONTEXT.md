# Phase 144: WASM/WASI Hostile Probe and Determinism Evidence - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Add capability, determinism, resource, malformed ABI, privacy, no-fallback, and monitor evidence for the WASM/WASI lane. This phase proves failure behavior and public-safe evidence, not broad production sandbox certification.

**Roadmap source:** "Add capability, determinism, resource, malformed ABI, privacy, no-fallback, and monitor evidence for the WASM/WASI lane."

**Requirements:** WASM-06, PROBE-01, PROBE-02, PROBE-03, PROBE-04, PROBE-05, PROBE-06, PROBE-07, PROBE-08

</domain>

<decisions>
## Implementation Decisions

### Probe Coverage
- **D-01:** Probes must cover filesystem/preopens, host paths, package paths, network/DNS/sockets/localhost/metadata IP/proxy, clock/time/random, env/args, memory growth/caps, fuel/timeout, stack, trap, panic, abort, process exit, malformed stdin/stdout, oversized streams/results, invalid actions, invalid activation order, invalid memory payload, and schema-invalid results.
- **D-02:** No-fallback drills must cover missing Wasmtime, unsupported WASI profile, missing artifact, artifact hash mismatch, stale registry metadata, stopped runtime-service, and Zig unavailable.
- **D-03:** Resource evidence must be bounded and repeatable; no unbounded local stress tests.

### Privacy And Claims
- **D-04:** Diagnostics must redact Strategy source, StrategyMemory, SoldierMemory, objective payloads, stderr, stacks, host paths, package paths, environment values, tokens, DB DSNs, sessions, artifact internals, and private runtime internals.
- **D-05:** Monitors must fail on WASM/WASI registry drift, ABI drift, Node `node:wasi` promotion, production-claim drift, backend ownership creep, and JS/TS regression.
- **D-06:** Evidence remains candidate/readiness evidence and must not be described as production sandbox certification.

### the agent's Discretion
Planner may group probes into scripts/artifacts however the repo's v1.19/v1.20 hostile probe patterns suggest, but must keep fail-loud results and public-safe redaction checks explicit.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/PROJECT.md` - Current milestone goals, baseline, non-goals, and promotion stance.
- `.planning/REQUIREMENTS.md` - Probe and monitor requirements.
- `.planning/ROADMAP.md` - Phase boundary, dependencies, and success criteria.
- `.planning/STATE.md` - Active constraints around privacy, no fallback, and bounded proof.
- `.planning/research/SUMMARY.md` - Hostile/determinism probe taxonomy.

### Runtime And Spec
- `packages/spec/src/runtime.ts` - Registry and eligibility metadata to monitor.
- `packages/spec/src/types.ts` - Public summary and artifact fields.
- `packages/spec/src/schemas.ts` - Runtime envelope/result schema validation.
- `packages/spec/src/runtime-execution-service.ts` - Runtime-service ABI contracts.

### Runtime Service And Go Boundary
- `apps/runtime-service/src/execute-match.ts` - Runtime failure handling and output boundaries.
- `apps/runtime-service/src/runtime-config.ts` - Wasmtime runner configuration.
- `apps/go-backend/runtime_service_client.go` - Go request validation and public-safe failure propagation.

### Workshop And Proof
- `packages/persistence/src/workshop.ts` - Validation diagnostics and source/artifact policy.
- `apps/web/app/workshop/server.ts` - Save/validation diagnostics boundary.
- `apps/web/app/workshop/workshop-client.tsx` - User-facing diagnostics labels.
- `apps/web/e2e/v1-20-reliability-proof.spec.ts` - Private marker and no-fallback proof precedent.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- v1.19/v1.20 hostile probe and no-fallback artifacts are the closest local precedent.
- Boundary monitor infrastructure already checks runtime adapter drift, topology, privacy, and production-claim style regressions.
- Runtime-service already has timeout/output/failure classification for JS/TS and Python lanes.

### Established Patterns
- Probe evidence must distinguish Strategy failure from system failure.
- Public outputs should describe safe categories, not raw internals.
- Missing runtime dependencies fail loudly rather than silently switching language/runtime.

### Integration Points
- Add WASM/WASI-specific probes and monitor rules.
- Extend redaction scans to artifact/toolchain/Wasmtime diagnostics.
- Ensure JS/TS and Python existing probes do not regress while adding WASM coverage.

</code_context>

<specifics>
## Specific Ideas

The evidence set should be sharp enough to prevent accidental promotion language. Passing local Wasmtime probes still means "candidate/readiness evidence", not "production sandbox certified".

</specifics>

<deferred>
## Deferred Ideas

- Cloud/production isolation certification.
- Unbounded stress testing.
- Abuse/moderation/governance gates for counted play.

</deferred>

---

*Phase: 144-WASM/WASI Hostile Probe and Determinism Evidence*
*Context gathered: 2026-05-25*
