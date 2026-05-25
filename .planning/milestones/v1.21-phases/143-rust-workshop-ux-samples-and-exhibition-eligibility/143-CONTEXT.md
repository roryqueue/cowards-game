# Phase 143: Rust Workshop UX, Samples, and Exhibition Eligibility - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Add safe Rust samples, Workshop save/validation UX, non-counted labels, and JS/TS regression safety. This phase exposes Rust authoring and saving for exhibition alpha, after artifact compile and runtime execution are available.

**Roadmap source:** "Add safe Rust samples, save/validation UX, non-counted labels, and JS/TS regression safety."

**Requirements:** RUST-01, RUST-02, RUST-03, RUST-06, RUST-07

</domain>

<decisions>
## Implementation Decisions

### Rust Workshop Path
- **D-01:** Add Rust as a Workshop language/source format only as non-counted exhibition alpha/beta.
- **D-02:** Rust save flow must invoke the submission-time compile/validation path and persist immutable artifact metadata.
- **D-03:** Rust starter samples should use repo-owned helper/sample code for the WASI Preview 1 JSON envelope.

### Diagnostics And Labels
- **D-04:** Compile and validation diagnostics must be public-safe: syntax, compile, missing API, unsupported imports/packages, forbidden capabilities, source limits, and artifact limits are allowed as sanitized categories.
- **D-05:** Public and user-facing labels must consistently say Rust is non-counted exhibition alpha/beta, not ranked, ladder, counted, gauntlet, production multi-language support, or production sandbox support.

### Regression Safety
- **D-06:** JS/TS validation, counted eligibility, exhibition creation, result evidence, and replay safety must remain intact.
- **D-07:** Python remains non-counted exhibition beta and should not become the focus of v1.21 beyond regression safety.

### the agent's Discretion
Planner may decide exact UI labels and diagnostics layout, but they should be compact, clear, and consistent with existing Python beta semantics and Workshop controls.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/PROJECT.md` - Current milestone goals, baseline, non-goals, and promotion stance.
- `.planning/REQUIREMENTS.md` - Active v1.21 requirements and traceability.
- `.planning/ROADMAP.md` - Phase boundary, dependencies, and success criteria.
- `.planning/STATE.md` - Current status and active constraints.
- `.planning/research/SUMMARY.md` - Rust alpha label and package policy guidance.

### Runtime And Spec
- `packages/spec/src/runtime.ts` - Language ids, adapter ids, runtime labels, and eligibility metadata.
- `packages/spec/src/types.ts` - Strategy Revision/source format/artifact types.
- `packages/spec/src/schemas.ts` - Workshop and runtime validation schemas.
- `packages/spec/src/runtime-execution-service.ts` - Runtime validation contracts used by save flow.

### Runtime Service And Go Boundary
- `apps/runtime-service/src/execute-match.ts` - Rust runtime execution assumptions from Phase 142.
- `apps/runtime-service/src/runtime-config.ts` - Adapter config labels and runtime capabilities.
- `apps/go-backend/runtime_service_client.go` - Go validation of saved revision metadata.

### Workshop And Proof
- `packages/persistence/src/workshop.ts` - Samples, source validation, and revision construction.
- `apps/web/app/workshop/server.ts` - Workshop save/validation server path.
- `apps/web/app/workshop/workshop-client.tsx` - Language selector, editor state, diagnostics, and labels.
- `apps/web/e2e/v1-20-reliability-proof.spec.ts` - Signed-in proof UX pattern for later.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Workshop currently has TypeScript and Python language options, sample loading, source validation, and save paths.
- Python beta labels provide a precedent for non-counted language language, but Rust should not inherit Python's implementation assumptions.
- Existing JS/TS Workshop flow is the counted regression baseline.

### Established Patterns
- Source remains owner-private.
- Public evidence exposes labels and safe hashes, not source or private runtime internals.
- UI should not imply counted or ranked eligibility for non-JS languages.

### Integration Points
- Extend Workshop source formats and language selector.
- Add Rust starter source and diagnostics copy.
- Ensure saved Rust revisions carry artifact metadata from Phase 141.
- Add tests that Rust does not replace or degrade JS/TS Workshop behavior.

</code_context>

<specifics>
## Specific Ideas

Rust samples should be safe and boring: clear envelope handling, deterministic actions, no package magic, and labels that help users understand "exhibition alpha" without implying production support.

</specifics>

<deferred>
## Deferred Ideas

- Rich Rust documentation or package ecosystem support.
- Counted Rust play.
- Zig Workshop UX until Phase 145 preflight passes.

</deferred>

---

*Phase: 143-Rust Workshop UX, Samples, and Exhibition Eligibility*
*Context gathered: 2026-05-25*
