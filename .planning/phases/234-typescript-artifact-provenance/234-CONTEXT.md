# Phase 234: TypeScript Artifact Provenance - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 234 adds TypeScript artifact provenance. It should produce a canonical executable artifact during provider validation/build, bind source and artifact evidence in provider proof, force Match and MatchSet execution through that validated artifact path, and fail closed when artifact evidence is missing, stale, mismatched, unverifiable, oversized, or incompatible.

</domain>

<decisions>
## Implementation Decisions

### Artifact Form
- **D-01:** TypeScript artifact form should be a canonical transpiled JavaScript executable artifact produced by provider validation/build.
- **D-02:** The artifact should be treated as hostile until validated; generated artifact bytes are not public output.
- **D-03:** Keep TypeScript in the JS/TS provider/runtime-js lane. This phase is provenance parity, not a new sandbox or WASM migration.

### Provider Proof
- **D-04:** Provider proof must bind provider id, contract version, source hash, source byte count, artifact hash, artifact byte count, TypeScript compiler/options metadata, and runtime compatibility key.
- **D-05:** Planner should prefer versioned provider proof/schema changes over ad hoc metadata fields when proof shape changes.
- **D-06:** Public evidence may say TypeScript is artifact-proven, but must not expose Strategy source, artifact bytes, StrategyMemory, SoldierMemory, objective payloads, host paths, stack traces, or private runtime internals.

### Execution and Failure Semantics
- **D-07:** Match and MatchSet execution must use the validated artifact path, not silently re-transpile mutable source.
- **D-08:** Missing, stale, mismatched, unverifiable, oversized, or incompatible TypeScript artifacts fail closed.
- **D-09:** No silent fallback to mutable source or another language runtime is allowed.

### Regression Expectations
- **D-10:** Existing TypeScript counted support and runtime-js behavior must remain green.
- **D-11:** Existing no Strategy execution in web/API/Go boundary remains mandatory.

### the agent's Discretion
- Planner may choose the exact canonical artifact storage/metadata shape if it preserves deterministic output, explicit compatibility metadata, fail-closed validation, and public privacy.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/REQUIREMENTS.md` - `TSART-01..TSART-06`.
- `.planning/ROADMAP.md` - Phase 234 success criteria.
- `.planning/STATE.md` - Active v1.33 boundary notes.
- `.planning/research/SUMMARY.md` - v1.33 source-language artifact provenance direction.

### Prior Decisions
- `.planning/phases/231-drift-monitors-and-boundary-coverage/231-CONTEXT.md` - Monitor and boundary drift expectations.
- `.planning/phases/232-live-four-language-signed-in-proof/232-CONTEXT.md` - Proof/privacy expectations.
- `.planning/phases/233-audit-archive-commit-and-tag/233-CONTEXT.md` - Closure/audit gates and non-claim discipline.

### Code
- `packages/spec/src/runtime.ts` - Supported language registry, provider registry, proof/compatibility model, TypeScript current build behavior.
- `packages/spec/src/runtime-execution-service.ts` - Runtime execution service contracts and fallback prohibitions.
- `apps/runtime-service/src/server.ts` - Provider validation proof generation and validation endpoints.
- `packages/runtime-js/src/transpile.ts` - Current TypeScript transpilation path.
- `packages/runtime-js/src/revision.ts` - Current StrategyRevision source hash and compatibility key construction.
- `packages/runtime-js/src/validation.ts` - TypeScript/JS validation behavior.
- `scripts/check-boundary-monitors.ts` - Boundary, provider, privacy, and direct-special-case monitor surface.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `transpileStrategySource` already produces JavaScript output from TypeScript using fixed compiler options.
- `buildStrategyRevision` already computes source hash, source bytes via validation, runtime metadata, and compatibility key.
- Runtime provider records already have provider id, contract version, build behavior, artifact policy labels, and evidence requirements.
- Runtime-service provider proof already signs provider id, contract version, source hash/bytes, and optional artifact hash/bytes for non-JS providers.

### Established Patterns
- Rust/Zig artifact proof is the comparison pattern for source hash/bytes plus artifact hash/bytes.
- Public evidence should describe provenance while omitting raw source and artifact material.
- Contract/version changes should be explicit and tested.

### Integration Points
- TypeScript provider record in `packages/spec/src/runtime.ts`.
- Runtime-js validation/build/revision construction.
- Runtime-service validation proof shape and any public/private evidence DTOs consuming provider proof.
- Boundary monitors and privacy scans.

</code_context>

<specifics>
## Specific Ideas

The core implementation result should be boring and strict: the validated TypeScript artifact is the executable thing for Match play, and any drift between source, artifact, proof, or runtime metadata fails closed.

</specifics>

<deferred>
## Deferred Ideas

WASM migration for TypeScript, package ecosystem expansion, and production sandbox certification are outside this phase.

</deferred>

---

*Phase: 234-TypeScript Artifact Provenance*
*Context gathered: 2026-05-31*
