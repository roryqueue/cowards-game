# Phase 124: Isolation Readiness Baseline and Candidate Contract - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 124 establishes the v1.19 runtime isolation readiness baseline and candidate contract. It treats v1.18 as the floor, preserves the normal web -> Go -> Strategy Execution Service / Runtime Broker -> isolated runtime topology, and defines how hardened subprocess, Docker/container subprocess, and gVisor/runsc-style candidates will be compared without overclaiming production sandbox certification.

</domain>

<decisions>
## Implementation Decisions

### Baseline
- **D-01:** Treat v1.18 as the floor: same topology, same Python non-counted exhibition beta status, same no Strategy execution in web/API/Go.
- **D-02:** JS/TS counted support remains intact through the broker/runtime ABI; Python remains runtime-only and non-counted.
- **D-03:** Python ranked/ladder/counted eligibility, arbitrary package installs, Python backend ownership, and production sandbox certification remain out of scope.

### Candidate Contract
- **D-04:** Define three candidate families: hardened subprocess, Docker/container subprocess, and gVisor/runsc-style container sandbox.
- **D-05:** Candidate evidence uses readiness lanes: default milestone evidence can pass with subprocess plus documented availability; Docker/runsc required commands fail loudly if unavailable.
- **D-06:** Evidence taxonomy must distinguish readiness evidence, required live proof, skipped/unsupported candidate state, and production sandbox certification.
- **D-07:** Production sandbox certification remains explicitly not promoted in this phase.

### Artifacts
- **D-08:** Produce both monitor-readable JSON and human-readable Markdown artifacts.
- **D-09:** Artifacts must state what each candidate proves, does not prove, and what proof would be needed before promotion.

### the agent's Discretion
The agent may choose exact artifact names and schema layout, but artifacts must live under `.planning/artifacts/`, be referenced by monitors, and avoid production certification wording unless stronger proof genuinely passes.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project And Milestone Baseline
- `.planning/PROJECT.md` - Current milestone goal, constraints, and v1.18 baseline.
- `.planning/REQUIREMENTS.md` - Active v1.19 requirements.
- `.planning/ROADMAP.md` - Phase 124 scope and dependencies.
- `.planning/research/v1.19-SUMMARY.md` - Runtime isolation readiness research and tradeoffs.
- `AGENTS.md` - Non-negotiable engine/runtime/privacy constraints.

### Runtime Evidence Baseline
- `.planning/artifacts/v1.18-isolation-baseline.md` - Human-readable v1.18 threat model and promotion stance.
- `.planning/artifacts/v1.18-runtime-isolation-hardening.json` - v1.18 Python subprocess hardening evidence.
- `.planning/artifacts/runtime-sandbox-evaluation.json` - Existing runtime candidate evaluation artifact.
- `packages/runtime-js/src/sandbox-evaluation.ts` - Runtime candidate/probe model.
- `scripts/evaluate-runtime-sandbox.ts` - Sandbox evaluation artifact command.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/runtime-js/src/sandbox-evaluation.ts` already models candidates, probes, promotion criteria, and public-safe checks.
- `scripts/evaluate-runtime-sandbox.ts` already writes/checks `.planning/artifacts/runtime-sandbox-evaluation.json`.
- `packages/runtime-python/src/python-subprocess-adapter.ts` and `packages/runtime-python/src/python-host-config.ts` already contain hardened subprocess launch behavior.

### Established Patterns
- Runtime isolation evidence is machine-readable plus human-readable.
- Production promotion decisions are explicit and conservative.
- Required stronger-candidate lanes should fail loudly instead of silently substituting weaker candidates.

### Integration Points
- Phase 125 consumes the taxonomy for probe expansion.
- Phase 126 consumes the candidate families for execution evidence.
- Phase 127 consumes the artifact shape for monitor checks.

</code_context>

<specifics>
## Specific Ideas

The central v1.19 stance is "honest readiness evidence": make stronger isolation candidates more concrete and harder to regress, without pretending subprocess, Docker, or gVisor evidence is production sandbox certification unless the proof genuinely supports that claim.

</specifics>

<deferred>
## Deferred Ideas

- Production hostile-code sandbox certification.
- Python ranked, ladder, counted, or gauntlet eligibility.
- Arbitrary PyPI/package install support.
- Cloud/Kubernetes/service-mesh runtime deployment.

</deferred>

---

*Phase: 124-isolation-readiness-baseline-and-candidate-contract*
*Context gathered: 2026-05-25*
