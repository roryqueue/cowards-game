# Phase 219: Privacy, Boundary, and Discovery Monitor Coverage - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 219 adds privacy scans, schema/DTO tests, rendered-page/proof-artifact scans, and boundary monitors proving discovery APIs remain separate from `match-execution-app-v1` and public-safe.

</domain>

<decisions>
## Implementation Decisions

### Privacy Scans
- **D-01:** Add discovery-specific privacy scans over DTO fixtures, rendered public pages, copy snapshots, and proof artifacts.
- **D-02:** Use the existing forbidden-marker posture from v1.29, extended to discovery pages.
- **D-03:** Player-facing copy should avoid private implementation field names.

### Boundary Monitors
- **D-04:** Monitors should fail if discovery DTOs are named, versioned, or validated as `match-execution-app-v1`.
- **D-05:** Monitors should fail if existing execution DTO fields change for discovery.
- **D-06:** Monitors should fail if discovery imports runtime-service/private execution internals or fixture/test-support paths become production fallback.

### Failure Clarity
- **D-07:** Monitor failures should identify whether the issue is privacy, contract drift, import ownership, or production fallback.
- **D-08:** Safety coverage should include both schema/DTO-level tests and rendered-page/proof-artifact scans.

### the agent's Discretion
- Choose the exact monitor script/test placement that best fits existing boundary monitor patterns.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/REQUIREMENTS.md` - SAFE-01 through SAFE-05.
- `.planning/ROADMAP.md` - Phase 219 scope.
- `.planning/phases/212-discovery-read-requirements-and-boundary-design/212-CONTEXT.md` - Discovery boundary.
- `.planning/artifacts/v1.31-discussion-summary.md` - Safety decisions.

### Existing Safety/Monitor Patterns
- `.planning/artifacts/v1.29-replay-result-trust-proof.md` - v1.29 public proof non-claims.
- `scripts/check-boundary-monitors.ts` - Existing boundary monitor script.
- `packages/spec/src/public-output-privacy.ts` - Public output privacy assertions.
- `packages/spec/src/match-execution-contract.ts` - Frozen execution contract to protect.
- `apps/web/e2e/v1-29-public-result-replay-proof.spec.ts` - Public rendered-page proof precedent.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing privacy denylist and public output leak-safe validation.
- Existing boundary monitor script and public proof tests.

### Established Patterns
- Public result/replay proof records contract version, privacy results, state coverage, and non-claims.
- Monitors already protect fixture fallback and execution contract drift.

### Integration Points
- Discovery monitor should extend current monitor vocabulary rather than create an unrelated safety lane.

</code_context>

<specifics>
## Specific Ideas

Monitor output should be explicit enough that future agents can immediately see whether to fix privacy copy, schema drift, import ownership, or fixture fallback.

</specifics>

<deferred>
## Deferred Ideas

Owner-only analytics explanation and richer public Strategy explanations require separate privacy design.

</deferred>

---
*Phase: 219-privacy-boundary-and-discovery-monitor-coverage*
*Context gathered: 2026-05-31*
