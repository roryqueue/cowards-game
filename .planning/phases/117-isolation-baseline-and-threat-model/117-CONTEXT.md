# Phase 117: Isolation Baseline and Threat Model - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 117 establishes the v1.18 baseline and threat model. It documents the current JS/TS and Python runtime behavior, treats v1.17 as the floor, and defines promotion criteria for exhibition-beta isolation readiness versus production sandbox certification.

</domain>

<decisions>
## Implementation Decisions

### Threat Model
- **D-01:** Use an exhibition-beta hostile Strategy threat model, not local-dev-only and not production certification.
- **D-02:** Treat current Python subprocess support as baseline evidence, not a sufficient sandbox.
- **D-03:** Threat model must include filesystem, network, package/import, shell/process, environment, memory/output, timeout, crash, stderr/stack/path, and private-output leak risks.

### Promotion Criteria
- **D-04:** Python may promote to non-counted exhibition beta only if signed-in proof and isolation monitors pass.
- **D-05:** Production sandbox promotion remains out of scope unless evidence genuinely exceeds the milestone target.
- **D-06:** JS/TS regression safety is part of the baseline, not a later gate.

### the agent's Discretion
The agent may choose artifact names, but must produce monitor-readable JSON plus human-readable markdown.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Baseline
- `.planning/PROJECT.md` - Current shipped baseline and constraints.
- `.planning/STATE.md` - v1.17 archived state and deferred items.
- `.planning/REQUIREMENTS.md` - Active v1.18 requirements.
- `.planning/ROADMAP.md` - Active v1.18 roadmap.
- `AGENTS.md` - Non-negotiable engine/runtime/privacy constraints.

### v1.17 Baseline
- `.planning/milestones/v1.17-MILESTONE-AUDIT.md` - v1.17 audit residuals.
- `.planning/milestones/v1.17-REQUIREMENTS.md` - Completed v1.17 requirements.
- `.planning/artifacts/v1.17-runtime-broker-registry.json` - Broker registry baseline.
- `.planning/artifacts/v1.17-runtime-broker-registry.md` - Broker registry explanation.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/runtime-python` currently owns Python validation/runtime support.
- `apps/runtime-service` selects runtime implementations behind broker metadata.
- `apps/go-backend/runtime_service_client.go` validates runtime-service metadata.
- `scripts/check-boundary-monitors.ts` and `scripts/check-local-topology.ts` are the main monitor/topology extension points.

### Established Patterns
- Runtime metadata and artifacts should be machine-checkable, not only prose.
- Promotion decisions should preserve explicit non-goals.

### Integration Points
- Phase 118 consumes the threat model as hardening scope.
- Phase 123 consumes this baseline for final promotion/defer wording.

</code_context>

<specifics>
## Specific Ideas

The milestone is intentionally not a production sandbox certification effort. It is an exhibition-beta readiness milestone with stronger evidence and a real signed-in proof.

</specifics>

<deferred>
## Deferred Ideas

- Production sandbox certification.
- Python counted/ranked eligibility.
- Arbitrary package installs.
- WASM/WASI promotion.

</deferred>

---

*Phase: 117-isolation-baseline-and-threat-model*
*Context gathered: 2026-05-25*
