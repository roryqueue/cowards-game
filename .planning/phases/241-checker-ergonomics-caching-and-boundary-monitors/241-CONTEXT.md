# Phase 241: Checker Ergonomics, Caching, and Boundary Monitors - Context

**Gathered:** 2026-06-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 241 makes Workshop validation realistic for editing by adding debounce, request coalescing, ephemeral cache behavior, stale-state handling, and explicit boundary monitors. The phase should particularly protect Rust/Zig compile-heavy provider validation from excessive duplicate calls while keeping submit/save authoritative. It also proves that v1.34 checker work has not moved Strategy execution into web/API/Go and has not exposed TinyGo as a production surface.

</domain>

<decisions>
## Implementation Decisions

### Rust/Zig Validation Pacing
- **D-01:** Use debounce plus request coalescing/cache for compile-heavy Rust/Zig validation.
- **D-02:** Preserve a responsive Validate source experience instead of forcing Rust/Zig into manual-only validation.
- **D-03:** Long debounce alone is insufficient because identical duplicate compile calls can still churn runtime-service/toolchains.

### Cache Scope
- **D-04:** Checker cache/coalescing should be ephemeral only.
- **D-05:** Cache identity must follow the Phase 238 contract: language, provider id, source hash/bytes, artifact hash/bytes where applicable, provider contract version, runtime ABI version, validation policy, and toolchain/provider compatibility metadata.
- **D-06:** Persisted checker results are out of scope; preflight cache must not become authoritative provenance evidence.
- **D-07:** Submit/save remains authoritative and must revalidate rather than trusting cached checker results.

### Stale State Behavior
- **D-08:** Keep stale results visible while a new check is pending, but clearly mark them stale.
- **D-09:** Stale results must not be treated as current readiness for submit/save.
- **D-10:** Do not block editing while checking; avoid flicker and preserve useful diagnostic context.

### Boundary Monitors
- **D-11:** Phase 241 must add explicit boundary monitors for no Strategy execution in web/API/Go.
- **D-12:** Phase 241 must prove TinyGo remains hidden from production Workshop validation, submit/save, entry, result, replay, and public evidence surfaces.
- **D-13:** Phase 241 must prove runtime-service/provider ownership is preserved and checker responses are schema-validated data before UI/use.

### the agent's Discretion
- Planner may choose whether coalescing/cache lives client-side, server-side, or both, provided the implementation reduces duplicate runtime-service/toolchain churn and does not persist authoritative checker evidence.
- Planner may tune debounce durations by language based on existing UX patterns and testability.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning and Prior Decisions
- `.planning/PROJECT.md` - Current milestone state and runtime/language hard boundaries.
- `.planning/REQUIREMENTS.md` - `CHECKERG-01..CHECKERG-04`, caching, stale-state, and boundary requirements.
- `.planning/ROADMAP.md` - Phase 241 goal, canonical refs, and success criteria.
- `.planning/phases/238-workshop-checker-path-inventory-and-public-contract/238-CONTEXT.md` - Checker contract and cache-relevant identity fields.
- `.planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md` - Provider parity and unavailable-state semantics.
- `.planning/phases/240-language-diagnostic-ux-and-availability-states/240-CONTEXT.md` - UX category and display decisions.
- `.planning/artifacts/v1.34-workshop-checker-contract.md` - Cache identity rules, stale status semantics, and public checker envelope.
- `.planning/artifacts/v1.34-workshop-checker-parity-matrix.md` - Current debounce/cache gap and Phase 241 fix set.
- `.planning/artifacts/v1.33-tinygo-wasi-spike-evidence.md` - TinyGo hidden/spike-only boundary.

### Code Paths
- `apps/web/app/workshop/workshop-client.tsx` - Current 500ms auto-validation, manual Validate source button, and stale validation source/sourceFormat logic.
- `apps/web/app/workshop/workshop-client-state.ts` - Draft validation state model and submit gating.
- `apps/web/app/api/workshop/validate/route.ts` - Server-side validation entrypoint and potential coalescing/cache boundary.
- `apps/web/app/api/workshop/revisions/route.ts` - Submit/save authoritative validation path.
- `apps/runtime-service/src/server.ts` - Runtime-service provider validation endpoint.
- `packages/runtime-wasm-wasi/src/validation.ts` - Rust/Zig compile/toolchain-heavy validation implementation.
- `packages/spec/src/runtime.ts` - Supported language list, provider ids, ABI version, and TinyGo absence from production language records.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Workshop client already stores `validationSource` and `validationSourceFormat`, which can support stale-state detection.
- Phase 238 checker contract defines `cacheIdentity`, `status: "stale"`, and unavailable states.
- Runtime/provider metadata in `packages/spec/src/runtime.ts` supplies provider ids, contract version, ABI version, and language labels needed for cache keys.

### Established Patterns
- Current Workshop auto-validation uses a 500ms dirty-source debounce plus manual Validate source.
- Current stale behavior is inferred by source/sourceFormat mismatch but does not yet have the full checker status model.
- Submit/save performs provider validation independently and should remain authoritative.

### Integration Points
- Client can avoid flicker by displaying stale result state while a pending check runs.
- API route can coalesce identical in-flight validation requests to reduce duplicate runtime-service calls.
- Boundary monitor coverage should inspect app/API/Go code paths and production language registries for forbidden Strategy execution/TinyGo drift.

</code_context>

<specifics>
## Specific Ideas

- Ephemeral caching may live in memory only and must be invalidated by source identity, provider contract/runtime ABI, toolchain compatibility, validation policy, and artifact identity where applicable.
- Rust/Zig compile-heavy validation is the primary pacing target, but the state model should work for all four production languages.
- Stale UI should preserve the prior diagnostic context but make clear that it no longer proves readiness.

</specifics>

<deferred>
## Deferred Ideas

- Persisted checker evidence is deferred/out of scope.
- Final service-backed proof and privacy scans belong to Phase 242.
- Any TinyGo production support remains future-only and requires an explicit productionization milestone.

</deferred>

---

*Phase: 241-Checker Ergonomics, Caching, and Boundary Monitors*
*Context gathered: 2026-06-14*
