# Phase 223: Unified Supported Language Registry and Eligibility Model - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 223 establishes the shared supported-language source of truth for JS/TS, Python, Rust, and Zig. It does not complete provider execution or per-language production proof; it creates the model those later phases consume.

</domain>

<decisions>
## Implementation Decisions

### Registry Shape
- **D-01:** The canonical model should be named clearly, such as `SUPPORTED_STRATEGY_LANGUAGES`, and may evolve or wrap the existing `STRATEGY_LANGUAGE_REGISTRY`.
- **D-02:** The model must cover language id, display label, support status, counted eligibility, source/artifact policy, build/compile/package policy, runtime adapter/provider id, validation behavior, limits, deterministic restrictions, starter templates, docs references, public labels, privacy, and public-output rules.
- **D-03:** Product code should ask capability and eligibility questions of the registry/provider rather than branching directly on language ids.

### Eligibility Semantics
- **D-04:** JS/TS, Python, Rust, and Zig should all be representable as fully supported counted languages in the active model once evidence gates pass.
- **D-05:** Historical "experimental non-counted" semantics should remain as archived evidence, not active product truth.

### The Agent's Discretion
- The planner may choose whether to create a new module or evolve `packages/spec/src/runtime.ts`, but must avoid creating two competing sources of truth.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/PROJECT.md` - v1.32 target feature list.
- `.planning/REQUIREMENTS.md` - `LANG-01..LANG-05`.
- `.planning/ROADMAP.md` - Phase 223 success criteria.
- `.planning/phases/222-language-surface-inventory/222-CONTEXT.md` - Inventory expectations and classification model.

### Code
- `packages/spec/src/runtime.ts` - Existing language registry, adapter registry, broker registry, product semantics, and counted eligibility.
- `packages/spec/src/types.ts` - Strategy artifacts, source formats, compiled artifact metadata, and public summaries.
- `apps/web/lib/runtime-labels.ts` - Existing product label helper to replace or route through the registry.
- `packages/persistence/src/workshop.ts` - Existing templates, samples, validation routing, and revision build behavior.
- `packages/spec/src/public-discovery.ts` - Public discovery DTO language/eligibility shape.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `StrategyLanguageId`, `StrategyRuntimeMetadata`, `StrategyRuntimeAdapterRecord`, `StrategyRuntimeProductSemantics`, and `evaluateStrategyRuntimeCountedEligibility` are existing model pieces.
- `RUNTIME_BROKER_REGISTRY` already derives runtime entries from adapter support and language records.

### Established Patterns
- Spec package owns shared contracts and DTO semantics.
- Web and persistence should consume spec-level semantics rather than duplicate lists.

### Integration Points
- Registry/model tests belong near `packages/spec/src/spec.test.ts` or a dedicated runtime test.
- Product helpers should be thin consumers of provider-derived labels.

</code_context>

<specifics>
## Specific Ideas

Keep the model boring and explicit. The value is not a clever abstraction; it is one place where downstream code learns what each language can do and what evidence is required.

</specifics>

<deferred>
## Deferred Ideas

Provider execution behavior is deferred to Phase 224. Per-language promotion is deferred to Phases 225-227.

</deferred>

---

*Phase: 223-Unified Supported Language Registry and Eligibility Model*
*Context gathered: 2026-05-31*
