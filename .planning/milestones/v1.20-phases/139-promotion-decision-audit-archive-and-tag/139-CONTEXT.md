# Phase 139: Promotion Decision, Audit, Archive, and Tag - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 139 closes v1.20. It verifies the milestone against the original intent, writes explicit promotion decisions, audits artifacts and gates, archives active planning docs, removes active `.planning/REQUIREMENTS.md`, updates project state docs, commits, and tags `v1.20`.

</domain>

<decisions>
## Implementation Decisions

### Promotion Decision
- **D-01:** Python remains non-counted exhibition beta.
- **D-02:** Runtime isolation remains readiness evidence unless stronger production-grade proof genuinely passes.
- **D-03:** Docker/runc candidate evidence can improve readiness confidence but must not be called production sandbox certification by default.
- **D-04:** `runsc` absence remains a fail-loud non-promotion record, not a hidden pass.

### Audit Inputs
- **D-05:** Final audit must inspect v1.20 artifacts for baseline, candidate decision, executable container evidence, runsc fail-loud evidence, hostile probes, no-fallback drills, timeout budgets, latency measurements, degraded UX, public evidence, signed-in proof, and privacy checks.
- **D-06:** Final verification must cover runtime-python, runtime-js/runtime-service, spec/contracts, Go backend, web, topology, boundary monitors, privacy, container candidate evidence, JS/TS regression, and signed-in browser proof.
- **D-07:** Public outputs remain private-data safe and JS/TS support remains intact.

### Archive
- **D-08:** Archive requirements, roadmap, and active phase directories under `.planning/milestones/` following the v1.19 pattern.
- **D-09:** Remove active `.planning/REQUIREMENTS.md` after successful archive so the next milestone can create fresh requirements.
- **D-10:** Update `.planning/PROJECT.md`, `.planning/STATE.md`, `.planning/MILESTONES.md`, and `.planning/RETROSPECTIVE.md`, then commit and tag `v1.20`.

### the agent's Discretion
The agent may choose exact audit artifact wording, but the promotion decision must be conservative, explicit, and boring.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Inputs
- `.planning/phases/132-v1-20-baseline-candidate-decision-and-budget-contract/132-CONTEXT.md`
- `.planning/phases/138-signed-in-reliability-proof-and-js-ts-regression-gate/138-CONTEXT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `.planning/MILESTONES.md`
- `.planning/RETROSPECTIVE.md`

### Archive Models
- `.planning/milestones/v1.19-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.19-ROADMAP.md`
- `.planning/milestones/v1.19-REQUIREMENTS.md`
- `.planning/milestones/v1.19-phases/`
- `.planning/artifacts/v1.19-promotion-decision.md`

### Final Gates
- `package.json` - Project verification commands.
- `scripts/check-boundary-monitors.ts` - Boundary and artifact monitors.
- `scripts/check-local-topology.ts` - Local topology checks.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- v1.19 archive/tag structure is the model for v1.20 closure.
- Prior promotion decision artifacts use explicit conservative promotion ids.
- `git status` was clean after v1.20 milestone initialization commits.

### Known Gaps
- Active `.planning/REQUIREMENTS.md` must remain during implementation and be removed only after archive.
- Final audit should not declare promotion before proof artifacts and verification have run.

</code_context>

<specifics>
## Specific Ideas

Promotion decision wording should be close to: `keep-python-non-counted-exhibition-beta-runtime-isolation-readiness-with-container-candidate-evidence`.

</specifics>

<deferred>
## Deferred Ideas

- Production sandbox certification.
- Python counted play.
- gVisor/runsc promotion.
- Cloud deployment proof.

</deferred>

---

*Phase: 139-promotion-decision-audit-archive-and-tag*
*Context gathered: 2026-05-25*
