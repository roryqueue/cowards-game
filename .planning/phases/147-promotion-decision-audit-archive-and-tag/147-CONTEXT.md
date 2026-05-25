# Phase 147: Promotion Decision, Audit, Archive, and Tag - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Verify, audit, document conservative promotion decisions, archive v1.21, remove active requirements, commit, and tag `v1.21`. This phase completes the milestone and records honest outcomes for Rust, Zig, and WASM/WASI readiness.

**Roadmap source:** "Verify, audit, document conservative promotion decisions, archive v1.21, remove active requirements, commit, and tag `v1.21`."

**Requirements:** EXIT-01, EXIT-02, EXIT-03, EXIT-04, EXIT-05, EXIT-06

</domain>

<decisions>
## Implementation Decisions

### Promotion Decision
- **D-01:** Rust/WASM remains non-counted exhibition alpha/beta unless a future milestone passes explicit counted-play gates.
- **D-02:** Zig is either a non-counted stretch with proof or fail-loud unavailable/non-promoted.
- **D-03:** WASM/WASI runtime evidence remains candidate/readiness evidence, not production sandbox certification.
- **D-04:** JS/TS remains the counted Strategy path. Python remains non-counted exhibition beta.

### Final Audit
- **D-05:** Final verification must cover spec/contracts, runtime-js/runtime-service, runtime-wasm-wasi, optional Zig proof, Go backend, web, topology, boundary monitors, privacy, JS/TS regression, and signed-in browser proof.
- **D-06:** Final artifacts must cover baseline, ABI decision, Rust artifact contract, Rust compile evidence, WASM/WASI runtime evidence, hostile probes, Zig readiness, signed-in proof, replay plausibility, privacy checks, no-fallback drills, and JS/TS regression.

### Archive Mechanics
- **D-07:** Completion archives requirements, roadmap, and phases; removes active `.planning/REQUIREMENTS.md`; updates `.planning/PROJECT.md`, `.planning/STATE.md`, `.planning/MILESTONES.md`, and `.planning/RETROSPECTIVE.md`; audits cleanly; commits; and tags `v1.21`.

### the agent's Discretion
Planner may choose exact artifact filenames and audit command ordering, but the promotion decision must be explicit, conservative, and traceable to evidence.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/PROJECT.md` - Current and final milestone status.
- `.planning/REQUIREMENTS.md` - Exit requirements before archive.
- `.planning/ROADMAP.md` - Final phase and archive scope.
- `.planning/STATE.md` - State transition and active constraints.
- `.planning/research/SUMMARY.md` - Original v1.21 research claims to compare against evidence.

### Runtime And Spec
- `packages/spec/src/runtime.ts` - Final language/runtime eligibility metadata.
- `packages/spec/src/types.ts` - Final artifact/revision contracts.
- `packages/spec/src/schemas.ts` - Final schema validation.
- `packages/spec/src/runtime-execution-service.ts` - Final runtime-service ABI contract.

### Runtime Service And Go Boundary
- `apps/runtime-service/src/execute-match.ts` - Final execution boundary.
- `apps/runtime-service/src/runtime-config.ts` - Final runtime configuration.
- `apps/go-backend/runtime_service_client.go` - Final Go orchestration/request boundary.

### Workshop And Proof
- `packages/persistence/src/workshop.ts` - Final Workshop revision behavior.
- `apps/web/app/workshop/server.ts` - Final save/validation behavior.
- `apps/web/app/workshop/workshop-client.tsx` - Final UX labels and diagnostics.
- `apps/web/e2e/v1-20-reliability-proof.spec.ts` - Prior proof pattern for audit comparison.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- v1.20 archive and promotion decision files provide the model for conservative completion.
- Milestone archive paths under `.planning/milestones/` should be used for final documents and phases.
- Existing audit/monitor commands should be run before tagging.

### Established Patterns
- Active `.planning/REQUIREMENTS.md` is removed at milestone completion.
- Final promotion decisions must distinguish evidence from production claims.
- Tags are created only after audit and commit.

### Integration Points
- Generate final promotion decision artifact.
- Run milestone audit and verification gates.
- Archive active roadmap/requirements/phases and update project state files.

</code_context>

<specifics>
## Specific Ideas

The milestone should end with no ambiguity: executable Rust WASM alpha if proven, Zig proof or fail-loud unavailable if not, and no counted/ranked/production promotion without future evidence.

</specifics>

<deferred>
## Deferred Ideas

- Future counted Rust/Zig promotion criteria.
- WASI component model promotion.
- Production sandbox certification.
- Broad multi-language marketplace.

</deferred>

---

*Phase: 147-Promotion Decision, Audit, Archive, and Tag*
*Context gathered: 2026-05-25*
