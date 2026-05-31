# Phase 222: Language Surface Inventory - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 222 delivers an inventory and classification artifact only. It identifies every active and historical JS/TS, Python, Rust, Zig, counted eligibility, runtime adapter, validation, starter/template, product UI, public evidence, docs, and monitor surface before any behavior or labels change.

</domain>

<decisions>
## Implementation Decisions

### Inventory Scope
- **D-01:** Inventory must include code, specs, planning artifacts, proof artifacts, tests, scripts, monitors, generated fixtures, docs, and UI copy that mention language support or counted eligibility.
- **D-02:** Classify every finding as source of truth, active consumer, stale historical artifact, approved provider boundary, or drift risk.
- **D-03:** Treat historical v1.17-v1.31 proof artifacts as baseline evidence, not code to "fix" unless an active monitor or active product surface depends on old semantics.

### Promotion Question
- **D-04:** The inventory must explicitly answer: "What must be true before Python, Rust, and Zig can honestly be fully supported and counted alongside JS/TS, and what monitors prevent future drift?"
- **D-05:** No runtime, product, or monitor behavior should change in this phase. Any discovered remediations become recommended follow-up work for later phases.

### The Agent's Discretion
- Use repo-local search and lightweight scripts to produce the inventory format. Prefer structured tables with file path, surface type, current behavior, classification, and likely target phase.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/PROJECT.md` - Current milestone goals and hard constraints.
- `.planning/REQUIREMENTS.md` - Phase 222 requirements `INV-01..INV-05`.
- `.planning/ROADMAP.md` - Phase 222 goal and success criteria.
- `.planning/research/SUMMARY.md` - v1.32 research synthesis.
- `.planning/MILESTONES.md` - Historical promotion decisions and active constraints.

### Specs and Evidence
- `AGENTS.md` - Project non-negotiables.
- `CowardsGameSpec_Full_Consolidated_v1.md` - Canonical language and engine expectations.
- `CowardsGame_Technical_Architecture_Spec_V1.md` - Runtime boundary architecture.
- `.planning/artifacts/v1.23-signed-in-multi-compiler-proof.md` - Rust/Zig beta proof baseline.
- `.planning/artifacts/v1.24-production-sandbox-readiness-matrix.md` - Sandbox-readiness and non-promotion baseline.
- `.planning/artifacts/v1.25-match-execution-boundary-inventory.md` - Frozen app-facing execution boundary.
- `.planning/artifacts/v1.31-public-site-spine-proof.md` - Latest public discovery boundary proof.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `rg` inventories over `packages`, `apps`, `scripts`, and `.planning` are sufficient for the first pass.
- Existing monitor logic in `scripts/check-boundary-monitors.ts` already encodes many old non-promotion assertions that can become inventory rows.

### Established Patterns
- Prior milestone artifacts use markdown proof/inventory docs under `.planning/artifacts/`.
- Prior monitor work distinguishes active code surfaces from archived historical evidence.

### Integration Points
- `packages/spec/src/runtime.ts`
- `packages/spec/src/types.ts`
- `packages/spec/src/runtime-execution-service.ts`
- `packages/runtime-js/src`
- `packages/runtime-python/src`
- `packages/runtime-wasm-wasi/src`
- `apps/runtime-service/src`
- `apps/web`
- `packages/persistence/src/workshop.ts`
- `scripts/check-boundary-monitors.ts`

</code_context>

<specifics>
## Specific Ideas

The inventory should be designed as Phase 223 input. It should call out direct product special-casing and old non-counted/beta language claims clearly enough that the registry/provider phase can replace them methodically.

</specifics>

<deferred>
## Deferred Ideas

Behavior changes, label changes, runtime promotion, and monitor conversion are deferred to Phases 223-231.

</deferred>

---

*Phase: 222-Language Surface Inventory*
*Context gathered: 2026-05-31*
