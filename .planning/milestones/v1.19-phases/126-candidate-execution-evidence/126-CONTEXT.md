# Phase 126: Candidate Execution Evidence - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 126 runs and records runtime isolation candidate evidence. It must always include hardened subprocess readiness evidence, gather Docker/container evidence where available, record gVisor/runsc availability and compatibility honestly, and make strict candidate lanes fail loudly when evidence is skipped, stale, unavailable, or silently substituted.

</domain>

<decisions>
## Implementation Decisions

### Required And Optional Evidence
- **D-01:** Default readiness evidence must always include hardened subprocess behavior.
- **D-02:** Docker/container evidence is gathered where available and has an explicit required command lane that fails loudly when unavailable or skipped.
- **D-03:** gVisor/runsc evidence records availability and compatibility; run actual probes only where runsc is locally available.
- **D-04:** Default milestone completion may use readiness lanes; explicit strict candidate commands provide stronger evidence.

### Candidate Comparison
- **D-05:** Candidate comparison must state what each candidate proves, does not prove, and what would be needed before promotion.
- **D-06:** Required candidate lanes must reject stale artifacts and silent substitution.
- **D-07:** Artifacts and UI copy must not claim production sandbox certification.

### the agent's Discretion
The agent may choose whether gVisor/runsc is modeled as a candidate in the existing sandbox artifact or as a v1.19 supplemental artifact, as long as it is monitor-readable and not confused with a passing Docker lane.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Candidate Execution
- `scripts/evaluate-runtime-sandbox.ts` - Existing sandbox evaluation CLI.
- `packages/runtime-js/src/container-subprocess-adapter.ts` - Container subprocess metadata and adapter behavior.
- `packages/runtime-js/src/sandbox-evaluation.ts` - Candidate evaluation schema and readiness criteria.
- `apps/worker/src/runtime-config.ts` - Worker/runtime adapter selection.
- `.planning/artifacts/runtime-sandbox-evaluation.json` - Existing candidate artifact.
- `.planning/artifacts/v1.15-docker-orbstack-retest.json` - Prior Docker/OrbStack evidence pattern.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `pnpm sandbox:evaluate` and `pnpm sandbox:evaluate:container` already split default and stricter evidence.
- `assertRequiredSandboxCandidatesPassed` already fails when a required candidate is skipped.
- Existing candidate metadata includes runtime controls, readiness labels, counted eligibility, and promotion criteria.

### Established Patterns
- Required live evidence is command-lane based, not silently inferred from optional artifacts.
- Skipped container evidence is acceptable for default readiness but blocks required container promotion/evidence lanes.
- Public artifact text must be sanitized.

### Integration Points
- Phase 127 should add monitor checks for v1.19 candidate artifacts.
- Phase 131 should cite candidate comparison in promotion decisions.

</code_context>

<specifics>
## Specific Ideas

The gVisor/runsc candidate should be honest: record whether runsc exists locally, what it would add over normal Docker, and why unavailable runsc is not passing evidence.

</specifics>

<deferred>
## Deferred Ideas

- Requiring Docker/runsc for normal `pnpm boundary:monitors`.
- Promoting container/gVisor to counted production hostile-code sandbox.
- Building cloud runtime infrastructure.

</deferred>

---

*Phase: 126-candidate-execution-evidence*
*Context gathered: 2026-05-25*
