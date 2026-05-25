# Phase 146: Signed-In Rust Exhibition Proof and JS/TS Regression Gate - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Run realistic signed-in non-counted JS/TS-vs-Rust and Rust-vs-Rust proof with result/replay evidence, plus optional Rust-vs-Zig only if Zig passed Phase 145. This phase proves the product flow under bounded repeatability and checks JS/TS regression safety.

**Roadmap source:** "Run realistic signed-in non-counted JS/TS-vs-Rust and Rust-vs-Rust proof with result/replay evidence."

**Requirements:** PROOF-01, PROOF-02, PROOF-03, PROOF-04, PROOF-05, PROOF-06, PROOF-07, PROOF-08

</domain>

<decisions>
## Implementation Decisions

### Proof Shape
- **D-01:** Signed-in proof runs two bounded cycles.
- **D-02:** Each proof must create or sign into a local account, save one JS/TS Strategy Revision, save one Rust Strategy Revision compiled to immutable WASM, create JS/TS-vs-Rust and Rust-vs-Rust non-counted exhibitions, open result/replay evidence, and verify replay plausibility.
- **D-03:** Optional Zig proof saves one Zig revision and runs Rust-vs-Zig only if Phase 145 passed.

### Runtime And Evidence
- **D-04:** Execution must flow through Go -> Runtime Broker/runtime-service -> WASM/WASI runtime implementation -> Wasmtime, with no silent fallback.
- **D-05:** Evidence must show language/runtime labels, non-counted status, artifact evidence, timeout/fuel behavior, replay plausibility, public-safe output, and JS/TS support intact.
- **D-06:** Public output must not leak Strategy source, private memories, objective payloads, stderr, stacks, host paths, env, tokens, DB DSNs, artifact internals, private runtime internals, Rust/Zig counted eligibility, or JS/TS regression.

### Regression Safety
- **D-07:** JS/TS remains the counted Strategy path and must be explicitly regression-checked after Rust is added.
- **D-08:** Python remains non-counted exhibition beta and should not become the proof focus except for ensuring no regression where relevant.

### the agent's Discretion
Planner may adapt v1.20 proof helper code to keep runtime cost bounded, but the two-cycle proof must be strong enough to inspect results and replay evidence for both mixed and Rust-only exhibitions.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/PROJECT.md` - Milestone proof target and conservative promotion stance.
- `.planning/REQUIREMENTS.md` - Signed-in proof and privacy requirements.
- `.planning/ROADMAP.md` - Phase boundary, dependencies, and success criteria.
- `.planning/STATE.md` - Active proof constraints and non-goals.
- `.planning/research/SUMMARY.md` - Recommended proof scope and watch-outs.

### Runtime And Spec
- `packages/spec/src/runtime.ts` - Runtime labels and eligibility semantics.
- `packages/spec/src/types.ts` - Revision/artifact metadata surfaced in proof.
- `packages/spec/src/schemas.ts` - Runtime and public evidence validation schemas.
- `packages/spec/src/runtime-execution-service.ts` - Runtime-service contract in proof path.

### Runtime Service And Go Boundary
- `apps/runtime-service/src/execute-match.ts` - WASM/JS mixed Match execution.
- `apps/runtime-service/src/runtime-config.ts` - Runtime adapter evidence and config.
- `apps/go-backend/runtime_service_client.go` - Go runtime-service request path.

### Workshop And Proof
- `packages/persistence/src/workshop.ts` - Revision creation from Workshop.
- `apps/web/app/workshop/server.ts` - Save/validation endpoint behavior.
- `apps/web/app/workshop/workshop-client.tsx` - UX labels and diagnostics used in proof.
- `apps/web/e2e/v1-20-reliability-proof.spec.ts` - Primary proof pattern to adapt.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- v1.20 reliability proof already creates signed-in local accounts, revisions, MatchSets, evidence artifacts, and private marker scans.
- Existing replay tests include board plausibility requirements and public-safe checks.
- Runtime-service and Go topology checks already support no-fallback proof patterns.

### Established Patterns
- Browser proof should create real saved revisions rather than synthetic fixtures when proving product flow.
- Public evidence should include labels and hashes, not private implementation details.
- Proof cycles should be bounded and repeatable.

### Integration Points
- Extend Playwright proof to load/save Rust source, trigger compile, create non-counted exhibitions, and inspect result/replay evidence.
- Include JS/TS validation and execution regression checks.
- Include optional Zig only behind Phase 145 pass evidence.

</code_context>

<specifics>
## Specific Ideas

Two cycles are the selected balance: enough repeatability to avoid a one-off proof, without the heavier v1.20 three-cycle runtime.

</specifics>

<deferred>
## Deferred Ideas

- Three-cycle or longer soak proof.
- Counted/ranked proof.
- Production sandbox certification.

</deferred>

---

*Phase: 146-Signed-In Rust Exhibition Proof and JS/TS Regression Gate*
*Context gathered: 2026-05-25*
