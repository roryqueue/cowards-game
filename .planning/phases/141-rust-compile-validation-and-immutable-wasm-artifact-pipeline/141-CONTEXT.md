# Phase 141: Rust Compile Validation and Immutable WASM Artifact Pipeline - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the Rust source-to-WASM validation/compile path and artifact metadata without making Match execution depend on mutable source. This phase produces immutable Rust WASM artifact generation and validation, but not the full Wasmtime Match execution lane.

**Roadmap source:** "Build the Rust source-to-WASM validation/compile path and artifact metadata without making Match execution depend on mutable source."

**Requirements:** ART-01, ART-02, ART-03, ART-04, ART-05, ART-06, ART-07, RUST-04

</domain>

<decisions>
## Implementation Decisions

### Compile And Validation
- **D-01:** Rust uses submission-time compile/validation through a runtime-owned path, not local proof only.
- **D-02:** Runtime-service owns Rust compile and validation. Go may validate metadata and hashes, but must not compile, execute, or evaluate Strategy code.
- **D-03:** Rust compile evidence must include rustc/cargo version, target triple, command summary, artifact hash, validation status, and public-safe diagnostics.

### Immutable Artifact Model
- **D-04:** Strategy Revisions/artifacts must represent compiled WASM metadata directly: source hash/bytes, artifact hash/bytes or reference, WASI profile, target triple, ABI envelope version, toolchain evidence, validation status, and non-counted eligibility.
- **D-05:** Match eligibility for Rust must point at immutable artifact bytes/hash/metadata. Source edits after submission must not mutate the eligible artifact.
- **D-06:** Stale, missing, oversized, malformed, unsupported, or hash-mismatched WASM artifacts fail loudly with no fallback to source execution.

### Rust Package Policy
- **D-07:** Rust samples use repo-owned helper/sample code for JSON envelope types.
- **D-08:** Arbitrary Cargo package installs are not supported as a product feature in v1.21.

### the agent's Discretion
Planners may decide whether artifact bytes are persisted inline or through a repository-appropriate artifact reference, as long as hash validation and immutable Match execution semantics are preserved.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/PROJECT.md` - Current milestone goals, baseline, non-goals, and promotion stance.
- `.planning/REQUIREMENTS.md` - Active v1.21 requirements and traceability.
- `.planning/ROADMAP.md` - Phase boundary, dependencies, and success criteria.
- `.planning/STATE.md` - Current status and active constraints.
- `.planning/research/SUMMARY.md` - Rust WASI feasibility and artifact model guidance.

### Runtime And Spec
- `packages/spec/src/runtime.ts` - Runtime target, adapter, language id, and eligibility metadata.
- `packages/spec/src/types.ts` - Strategy Revision and artifact type model.
- `packages/spec/src/schemas.ts` - Strategy Revision and artifact validation schemas.
- `packages/spec/src/runtime-execution-service.ts` - Runtime service envelope contracts.

### Runtime Service And Go Boundary
- `apps/runtime-service/src/execute-match.ts` - Current revision validation and runtime construction flow.
- `apps/runtime-service/src/runtime-config.ts` - Runtime adapter configuration patterns.
- `apps/go-backend/runtime_service_client.go` - Go-side Strategy Revision metadata and hash validation.

### Workshop And Proof
- `packages/persistence/src/workshop.ts` - Revision construction, source formats, validation, and starter source patterns.
- `apps/web/app/workshop/server.ts` - Workshop save/validation server path.
- `apps/web/app/workshop/workshop-client.tsx` - Workshop diagnostics and language selection.
- `apps/web/e2e/v1-20-reliability-proof.spec.ts` - Later proof pattern.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing source hash/source bytes validation in runtime-service and Go should be extended to artifact hash/artifact bytes validation.
- `StrategyArtifactSourceFormat` currently covers JavaScript, TypeScript, and Python; Rust must be added with conservative eligibility.
- Python compile/validation diagnostics provide a useful non-counted precedent, but Rust artifact immutability is stricter.

### Established Patterns
- Strategy Revisions are immutable once submitted for Match or MatchSet play.
- Public artifact summaries expose safe labels and hashes only.
- Runtime metadata mismatch must fail closed.

### Integration Points
- Workshop save/validation should invoke the Rust compile path at submission time.
- Runtime-service should produce artifact metadata and diagnostics, while Go persists/validates the metadata as data.
- Boundary monitors later need to detect source fallback and backend compile/execution creep.

</code_context>

<specifics>
## Specific Ideas

Rust should compile to `wasm32-wasip1` for the WASI Preview 1 lane. The product-facing claim should remain "non-counted exhibition alpha/beta" even if local compile proof is strong.

</specifics>

<deferred>
## Deferred Ideas

- Arbitrary Cargo package install and supply-chain policy.
- Counted Rust eligibility.
- Full runtime execution proof, which belongs to Phase 142.

</deferred>

---

*Phase: 141-Rust Compile Validation and Immutable WASM Artifact Pipeline*
*Context gathered: 2026-05-25*
