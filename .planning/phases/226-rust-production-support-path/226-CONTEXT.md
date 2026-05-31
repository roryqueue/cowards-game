# Phase 226: Rust Production Support Path - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 226 promotes Rust through the shared provider model. It covers Rust validation, immutable WASM/WASI artifact policy, execution, counted eligibility gates, product surfaces, public evidence, and signed-in Rust proof without changing Zig behavior.

</domain>

<decisions>
## Implementation Decisions

### Rust Promotion
- **D-01:** Rust support must be promoted through provider/runtime/artifact evidence, not label changes.
- **D-02:** Rust execution remains behind runtime-service / Runtime Broker / Rust provider boundaries.
- **D-03:** Rust may not execute mutable source or silently fall back to JS/TS.

### Artifact Policy
- **D-04:** Rust counted support requires immutable artifact metadata including toolchain version, target triple, WASI profile, ABI envelope, artifact hash, source hash, byte count, validation status, and compatibility data.
- **D-05:** Default ABI assumption carries forward: WASI Preview 1 stdin/stdout JSON remains active for Rust unless Phase 224 proves a migration.

### The Agent's Discretion
- Decide exact artifact metadata versioning and compatibility-key shape during planning, using the existing compiled artifact model where possible.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/REQUIREMENTS.md` - `RUST-01..RUST-05`.
- `.planning/ROADMAP.md` - Phase 226 success criteria.
- `.planning/phases/224-strategylanguageprovider-runtime-contract/224-CONTEXT.md` - Provider/ABI decisions.

### Code
- `packages/runtime-wasm-wasi/src/metadata.ts` - Rust/Zig runtime metadata.
- `packages/runtime-wasm-wasi/src/validation.ts` - WASM/WASI validation and artifact checks.
- `packages/runtime-wasm-wasi/src/wasm-wasi-subprocess-adapter.ts` - Wasmtime Preview 1 execution adapter.
- `packages/spec/src/types.ts` - `CompiledStrategyArtifact` and public artifact metadata.
- `packages/spec/src/runtime.ts` - Runtime adapter records, Rust language semantics, and eligibility.
- `scripts/evaluate-v1-23-wasm-wasi-beta.ts` - Existing Rust/Zig beta readiness probes.
- `apps/web/e2e/v1-21-rust-wasm-exhibition-proof.spec.ts` - Rust exhibition alpha proof baseline.
- `apps/web/e2e/v1-23-multi-compiler-exhibition-proof.spec.ts` - Rust/Zig multi-compiler proof baseline.

### Evidence
- `.planning/artifacts/v1.21-wasm-wasi-hostile-probe-evidence.md` - Rust WASM/WASI hostile probe baseline.
- `.planning/artifacts/v1.23-wasm-wasi-beta-readiness-evidence.md` - Rust/Zig beta readiness baseline.
- `.planning/artifacts/v1.23-signed-in-multi-compiler-proof.md` - Signed-in Rust proof baseline.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Rust compile/proof scripts already generate immutable artifact metadata.
- Existing artifact failure probes cover stale/mismatched/missing artifact behavior.

### Established Patterns
- Rust is currently WASM/WASI Preview 1 evidence only. Promotion must update evidence and public semantics together.
- Public artifact evidence must omit raw artifact bytes by default.

### Integration Points
- Runtime-service validation/build, Workshop save, Account reads, Match execution, result/replay/public labels, conformance matrix, and monitors.

</code_context>

<specifics>
## Specific Ideas

Rust should be treated as the stronger WASM/WASI production path before Zig because it has a broader existing proof history and fewer no-std helper constraints.

</specifics>

<deferred>
## Deferred Ideas

Direct export or WIT replacement remains deferred unless Phase 224 already proved migration.

</deferred>

---

*Phase: 226-Rust Production Support Path*
*Context gathered: 2026-05-31*
