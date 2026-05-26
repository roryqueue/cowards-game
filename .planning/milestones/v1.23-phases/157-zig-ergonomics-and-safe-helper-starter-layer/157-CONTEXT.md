# Phase 157: Zig Ergonomics and Safe Helper/Starter Layer - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Improve Zig authoring ergonomics only inside the WASI Preview 1 artifact lane. This phase may add or refine Zig starter/helper source and validation evidence, but it must not broaden Zig package support, enable counted play, change the execution ABI, or expose helpers that import forbidden capabilities.

</domain>

<decisions>
## Implementation Decisions

### Helper Policy
- **D-01:** Prefer a small project-owned Zig helper/starter layer over Zig std-backed helpers unless the compiled import audit proves std remains inside the accepted WASI import boundary.
- **D-02:** The helper should make ordinary Strategy authoring less raw than v1.22's tiny no-std proof, but safety wins over comfort. If the ergonomic helper imports forbidden capabilities, Zig remains alpha.
- **D-03:** Keep helper scope focused on input parsing/output writing for the existing Preview 1 stdin/stdout JSON envelope. Do not add package/dependency support or a new ABI in this phase.

### Capability Evidence
- **D-04:** Every exposed Zig helper/starter must produce inspectable import/capability evidence, including the exact WASI imports in the compiled artifact.
- **D-05:** Forbidden imports fail loud before Workshop/account exposure: filesystem/path, network/socket, clock/time/random, poll, args/env, process/package-like surfaces, and any unrecognized host import.
- **D-06:** UI copy should be honest: Zig helper/starter support is still non-counted and may remain alpha if the helper layer is too narrow or too fragile.

### Carry-Forward Defaults
- **D-07:** Carry forward Phase 156's beta semantics: ergonomic success alone cannot promote Zig to beta without later signed-in proof, hardening, labels, privacy, no-fallback, and promotion decision gates.

### the agent's Discretion
- The planner may choose whether the helper is implemented as sample source, reusable snippets, tiny Zig functions, or generated starter text, as long as capability evidence remains clear.
- The planner may reuse or extend existing validation tests rather than invent a separate helper audit harness.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope
- `.planning/REQUIREMENTS.md` — ERG-01 through ERG-05.
- `.planning/ROADMAP.md` — Phase 157 goal and success criteria.
- `.planning/phases/156-baseline-beta-criteria-and-regression-floor/156-CONTEXT.md` — Beta semantics and regression floor.
- `.planning/research/v1.23-SUMMARY.md` — Zig ergonomics risk and Preview 1 JSON recommendation.

### Zig Baseline
- `.planning/research/v1.22-SUMMARY.md` — Zig no-std finding and std-backed capability risk.
- `.planning/artifacts/v1.22-zig-readiness-evidence.json` — Zig compile/runtime readiness floor.
- `.planning/artifacts/v1.22-wasm-wasi-hardening-evidence.json` — Existing `zig-std-host-capability-denied` probe.
- `.planning/milestones/v1.22-CODE-REVIEW.md` — Residual risk around no-std Zig and future ergonomics.

### Code
- `packages/runtime-wasm-wasi/src/validation.ts` — Zig forbidden patterns, compile path, import parsing, and artifact construction.
- `packages/runtime-wasm-wasi/src/metadata.ts` — Zig runtime metadata and target triple.
- `apps/runtime-service/src/server.ts` — Runtime-service `/validate-strategy` path for Zig validation.
- `apps/web/app/workshop/workshop-client.tsx` — Workshop language/sample surface.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `validateZigStrategySource` and `buildZigStrategyRevision` already compile/validate Zig through runtime-service-owned code.
- `listWasmImports` and `validateWasmWasiImports` already inspect WASM imports and can support helper capability proof.
- Runtime-service `/validate-strategy` already returns runtime, validation, metadata, source hash, and source bytes for Zig.

### Established Patterns
- Zig target triple is language-sensitive: `wasm32-wasi`, not Rust's `wasm32-wasip1`.
- Artifact metadata carries `tags` including non-counted/exhibition-alpha in current validation output.
- Forbidden capability messaging should stay public-safe and avoid host path leakage.

### Integration Points
- Workshop samples and validation copy should stay downstream of runtime-service validation.
- Phase 158 should reuse the helper capability evidence as part of hardening.
- Phase 161 should reflect helper limitations in user-facing labels.

</code_context>

<specifics>
## Specific Ideas

Make Zig better without pretending Zig is comfortable yet. A modest helper/starter that hides fd plumbing is valuable if it does not widen host imports.

</specifics>

<deferred>
## Deferred Ideas

- Arbitrary Zig package/dependency support belongs to a future package policy milestone.
- std-backed Zig helper promotion belongs to a future milestone unless this phase proves the compiled imports remain safe.

</deferred>

---

*Phase: 157-Zig Ergonomics and Safe Helper/Starter Layer*
*Context gathered: 2026-05-25*
