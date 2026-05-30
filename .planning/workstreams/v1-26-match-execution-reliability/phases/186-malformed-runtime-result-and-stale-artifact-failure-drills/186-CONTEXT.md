# Phase 186: Malformed Runtime Result and Stale Artifact Failure Drills - Context

**Gathered:** 2026-05-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Prove malformed runtime result and stale artifact paths fail closed with correct retry semantics and public-safe evidence. This phase distinguishes service envelope failures from Strategy/runtime-output failures.

</domain>

<decisions>
## Implementation Decisions

### Malformed Failure Split
- **D-01:** Malformed runtime-service HTTP/envelope response is a retryable system/envelope failure while attempts remain.
- **D-02:** Malformed Strategy/runtime output is non-retryable Strategy/runtime-output failure evidence, not runtime-service unavailability.
- **D-03:** Tests and drill artifacts must make this distinction visible in job attempts, public projection, and compatibility checks.

### Stale Artifact Handling
- **D-04:** Stale or mismatched immutable WASM/WASI artifact metadata must fail closed before or inside runtime-service without source fallback.
- **D-05:** Stale artifact paths should project to public-safe `stale_artifact` evidence where the frozen contract supports it.
- **D-06:** Stale artifact failures must not promote ABI changes, direct exports, Component Model/WIT, production sandbox claims, or counted non-JS play.

### Privacy and Boundaries
- **D-07:** Malformed/stale evidence must never expose source, StrategyMemory, SoldierMemory, objective payloads, raw diagnostics, host paths, env values, tokens, DB details, package paths, or private runtime internals.
- **D-08:** Do not add Strategy execution in web/API/Go to create these drills; use runtime-service and persisted metadata boundaries.

### the agent's Discretion
The planner may choose controlled fake runtime-service responses, crafted revisions/artifacts, or fixture-backed proof helpers as long as live/public evidence still exercises the real translation boundaries.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope
- `.planning/workstreams/v1-26-match-execution-reliability/REQUIREMENTS.md` — FAIL requirements.
- `.planning/workstreams/v1-26-match-execution-reliability/ROADMAP.md` — Phase 186 success criteria.
- `.planning/research/v1.26-SUMMARY.md` — malformed/stale uncertainty list.

### Contract and Artifact Handling
- `packages/spec/src/match-execution-contract.ts` — `malformed_runtime_result` and `stale_artifact` public categories.
- `apps/go-backend/runtime_service_client.go` — malformed envelope and response contract classification.
- `apps/runtime-service/src/execute-match.ts` — source/artifact validation and system failure envelopes.
- `packages/runtime-wasm-wasi/src/wasm-wasi-subprocess-adapter.ts` — WASM/WASI runtime behavior and artifact execution lane.
- `scripts/evaluate-wasm-wasi-runtime.ts` — historical stale artifact and no-fallback evidence patterns.

### Tests
- `apps/go-backend/runtime_service_client_test.go` — malformed/oversized/contract drift tests.
- `apps/runtime-service/src/execute-match.test.ts` — artifact missing/mismatch, invalid response, and redaction tests.
- `packages/spec/src/match-execution-contract.test.ts` — public category and fixture coverage tests.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing contract fixtures already include `malformed_runtime_result` and `stale_artifact` scenarios.
- Runtime-service artifact validation already checks compiled artifact metadata, byte count, hash, target triple, source hash, ABI version, and Preview 1 envelope.

### Established Patterns
- Go treats malformed runtime-service response envelopes as retryable system failures.
- Runtime-service treats source/artifact mismatch as system failure envelopes with redacted diagnostics.

### Integration Points
- Add or extend tests in Go, runtime-service, and spec contract layers.
- Drill evidence should connect private failure classifications to public frozen categories.

</code_context>

<specifics>
## Specific Ideas

This phase should make the phrase "malformed runtime result" unambiguous: malformed service envelope may be retried; malformed Strategy/runtime output fails closed.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 186-Malformed Runtime Result and Stale Artifact Failure Drills*
*Context gathered: 2026-05-30*
