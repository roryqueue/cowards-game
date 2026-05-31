# Phase 227: Zig Production Support Path - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 227 promotes Zig through the shared provider model. It covers Zig validation, no-std/helper/import policy, immutable WASM/WASI artifact policy, execution, counted eligibility gates, product surfaces, public evidence, and signed-in Zig proof.

</domain>

<decisions>
## Implementation Decisions

### Zig Promotion
- **D-01:** Zig support must be promoted through provider/runtime/artifact/import evidence, not label changes.
- **D-02:** Zig execution remains behind runtime-service / Runtime Broker / Zig provider boundaries.
- **D-03:** Zig may not execute mutable source or silently fall back to JS/TS.

### Import and Helper Policy
- **D-04:** Zig counted support requires an explicit no-std/helper policy and allowed WASI import audit.
- **D-05:** Zig artifact metadata must include toolchain version, target triple, WASI profile, ABI envelope, import audit, artifact hash, source hash, byte count, validation status, and compatibility data.

### The Agent's Discretion
- Planner may decide whether to preserve current no-std helper constraints or evolve them, but any change must be validated by import and privacy evidence.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/REQUIREMENTS.md` - `ZIG-01..ZIG-05`.
- `.planning/ROADMAP.md` - Phase 227 success criteria.
- `.planning/phases/224-strategylanguageprovider-runtime-contract/224-CONTEXT.md` - Provider/ABI decisions.
- `.planning/phases/226-rust-production-support-path/226-CONTEXT.md` - WASM/WASI artifact promotion decisions that likely carry to Zig.

### Code
- `packages/runtime-wasm-wasi/src/metadata.ts` - Zig runtime metadata.
- `packages/runtime-wasm-wasi/src/validation.ts` - Zig validation, import policy, and artifact checks.
- `packages/runtime-wasm-wasi/src/wasm-wasi-subprocess-adapter.ts` - Wasmtime Preview 1 execution adapter.
- `packages/spec/src/types.ts` - `CompiledStrategyArtifact` model.
- `packages/spec/src/runtime.ts` - Zig language semantics and runtime adapter records.
- `scripts/evaluate-v1-23-wasm-wasi-beta.ts` - Zig helper and beta readiness probes.
- `apps/web/e2e/v1-23-multi-compiler-exhibition-proof.spec.ts` - Signed-in Zig proof baseline.

### Evidence
- `.planning/artifacts/v1.22-zig-readiness-evidence.md` - Zig readiness baseline.
- `.planning/artifacts/v1.23-zig-helper-capability-evidence.md` - Zig helper import audit baseline.
- `.planning/artifacts/v1.23-signed-in-multi-compiler-proof.md` - Signed-in Zig proof baseline.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Zig no-std helper proof and import audit already exist.
- Existing tests check `@import("std")` and WASI fd import limitations.

### Established Patterns
- Zig must fail loud when local toolchain, compile, artifact, import audit, or Wasmtime proof is unavailable.
- Zig public evidence must not expose compiler/runtime diagnostics by default.

### Integration Points
- Runtime-service validation/build, Workshop samples, Account reads, Match execution, result/replay labels, conformance matrix, and monitors.

</code_context>

<specifics>
## Specific Ideas

Zig should inherit as much of the Rust WASM/WASI provider shape as possible, with only the helper/import/toolchain differences modeled separately.

</specifics>

<deferred>
## Deferred Ideas

Broad Zig std/package ergonomics are deferred unless the provider/import audit proves them safely in this phase.

</deferred>

---

*Phase: 227-Zig Production Support Path*
*Context gathered: 2026-05-31*
