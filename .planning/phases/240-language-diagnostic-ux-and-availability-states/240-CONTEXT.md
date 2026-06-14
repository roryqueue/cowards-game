# Phase 240: Language Diagnostic UX and Availability States - Context

**Gathered:** 2026-06-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 240 implements actionable public-safe diagnostic UX and availability-state behavior for Python, Rust, and Zig on top of the shared Workshop checker contract and Phase 239 provider parity. The phase maps provider/runtime validation results into language-specific public categories, copy, actionability, and safe display fields. It must not expose raw diagnostics or private runtime artifacts, and it must not place validation semantics inside React components.

</domain>

<decisions>
## Implementation Decisions

### Diagnostic Detail Level
- **D-01:** Diagnostics should expose actionable categories, short public-safe messages, constraints, remediation, references, and safe structured line/column when available.
- **D-02:** Default/public Workshop output must not expose raw compiler/runtime diagnostics, host paths, package paths, env values, artifact bytes, source text, tokens, DB details, StrategyMemory, SoldierMemory, objective payloads, or private runtime internals.
- **D-03:** Minimal status-only output is insufficient for Workshop; users need actionable guidance before submit/save.

### Unavailable State Copy
- **D-04:** Runtime-service and toolchain unavailable states should use a shared calm copy template plus language-specific next steps.
- **D-05:** Unavailable copy must communicate that checking could not complete and that the Strategy has not been judged invalid/unsafe.
- **D-06:** Language-specific next steps should be concise and concrete, such as retrying later, starting runtime-service, or configuring the Rust/Zig WASI toolchain.

### Diagnostic Mapping Ownership
- **D-07:** Diagnostic category, actionability, and redaction mapping should live in shared checker utilities/schema outside React components.
- **D-08:** API responses, submit/save normalization, and UI display should consume the same normalized diagnostic contract to avoid drift.
- **D-09:** React components should render already-normalized public checker data rather than deciding provider/runtime failure semantics.

### Line, Column, and References
- **D-10:** Include line, column, and reference fields only when they come from structured public-safe validation fields.
- **D-11:** Do not parse raw compiler/runtime diagnostic text to recover locations or references.
- **D-12:** Rust/Zig diagnostics may omit line/column if safe structured locations are unavailable.

### the agent's Discretion
- Planner may choose exact shared package/module location for checker diagnostic mapping, provided React components remain display-only.
- Planner may tune copy wording for brevity and consistency with existing Workshop tone, provided unavailable states remain calm and non-blaming.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning and Prior Decisions
- `.planning/PROJECT.md` - Current milestone goal and hard privacy/runtime boundaries.
- `.planning/REQUIREMENTS.md` - `CHECKDIAG-01..CHECKDIAG-05` and public-safe diagnostic requirements.
- `.planning/ROADMAP.md` - Phase 240 goal, canonical refs, and success criteria.
- `.planning/phases/238-workshop-checker-path-inventory-and-public-contract/238-CONTEXT.md` - Checker contract and response category decisions.
- `.planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md` - Provider parity, envelope ownership, and unavailable-state decisions.
- `.planning/artifacts/v1.34-workshop-checker-contract.md` - Status model, diagnostic category set, actionability fields, and privacy exclusions.
- `.planning/artifacts/v1.34-workshop-checker-parity-matrix.md` - Current diagnostic gaps and Phase 240 fix set.
- `.planning/artifacts/v1.18-python-validation-diagnostics.json` - Earlier Python diagnostic evidence.
- `.planning/artifacts/v1.21-zig-readiness-evidence.md` - Zig readiness and fail-loud context.
- `.planning/artifacts/v1.22-zig-readiness-evidence.md` - Zig validation/toolchain context.

### Code Paths
- `apps/web/app/api/workshop/validate/route.ts` - Public checker response route.
- `apps/web/app/workshop/workshop-client-state.ts` - Current validation labels, issue headings, and guidance formatting.
- `apps/web/app/workshop/workshop-client.tsx` - Workshop diagnostic display surface.
- `apps/web/app/api/workshop/revisions/route.ts` - Submit/save public failure normalization touchpoint.
- `packages/spec/src/runtime.ts` - Language/provider records and public labels.
- `packages/runtime-js/src/validation.ts` - TypeScript validation issue shape and current diagnostic quality baseline.
- `packages/runtime-python/src/validation.ts` - Python constrained validation issue codes and source artifact provenance.
- `packages/runtime-wasm-wasi/src/validation.ts` - Rust/Zig compile, import, artifact, and toolchain diagnostics.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `formatValidationIssueHeading` and `formatValidationIssueGuidance` are existing UI helpers that can be adapted or superseded by a shared checker diagnostic presenter.
- `StrategyRevisionValidationIssue` already supports public-safe constraint, remediation, reference, line, and column fields.
- The Phase 238 checker contract already defines diagnostic `category`, `severity`, `actionability`, `message`, `constraint`, `remediation`, `reference`, `line`, `column`, and `publicSafe`.

### Established Patterns
- Existing Workshop UI displays issue headings and guidance rather than raw logs.
- Runtime validators currently collapse some Rust/Zig toolchain/compile/import failures into coarse `TRANSPILE_FAILED`/forbidden-pattern style issues.
- Python validation already has policy/import/package-like concepts that should become public categories without leaking host/package paths.

### Integration Points
- Shared checker diagnostic utilities should sit between app/API normalization and Workshop display.
- Submit/save public normalization from Phase 239 should share category/actionability mapping with Validate source.
- UI state/copy should distinguish invalid user source from runtime-service/toolchain unavailable states.

</code_context>

<specifics>
## Specific Ideas

- Python public categories must distinguish policy/capability, forbidden import, package/dependency, syntax/build, provenance, runtime-service unavailable, timeout/limit, and invalid output/schema failures.
- Rust public categories must distinguish compile, artifact/provenance, forbidden WASI/import, runtime-service, toolchain unavailable, timeout/limit, and invalid output/schema failures.
- Zig public categories must distinguish compile, artifact/provenance, forbidden WASI/import, no-std/helper misuse, runtime-service, toolchain unavailable, timeout/limit, and invalid output/schema failures.
- Unavailable-state copy should explicitly avoid blaming the user or implying unsafe Strategy behavior.

</specifics>

<deferred>
## Deferred Ideas

- Rust/Zig debounce/cache/coalescing belongs to Phase 241.
- Four-language proof and privacy scans belong to Phase 242.
- Raw diagnostics may only be considered later behind an existing private/test-only gate; they are out of scope for default/public Workshop output.

</deferred>

---

*Phase: 240-Language Diagnostic UX and Availability States*
*Context gathered: 2026-06-14*
