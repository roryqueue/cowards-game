# Phase 178: Contract Test Harness and Drift Monitors - Context

**Gathered:** 2026-05-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Prove Go/service/app outputs match the versioned DTO schemas and add monitors for contract, privacy, fixture, lifecycle, and ownership drift.

</domain>

<decisions>
## Implementation Decisions

### Test Strategy
- **D-01:** Use fixture-first contract tests for deterministic coverage.
- **D-02:** Validate Go public MatchSet summary/result, replay metadata, and replay evidence outputs against DTO schemas.
- **D-03:** Validate runtime-service failure envelopes are translated into public-safe failure evidence without private diagnostics.
- **D-04:** App tests must render every fixture scenario without private fields or execution-internal terms.

### Drift Monitors
- **D-05:** Prefer extending `scripts/check-boundary-monitors.ts` over adding an unrelated governance entrypoint.
- **D-06:** Monitors should fail on lifecycle vocabulary drift, DTO version drift, fixture coverage gaps, public/private evidence leaks, and Go/runtime-service ownership drift.

### the agent's Discretion
Downstream agents may add focused helper scripts if needed, but the aggregate monitor should remain the main operator-facing boundary gate.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Shared Milestone Context
- `.planning/phases/v1.25-MILESTONE-DISCUSSION-CONTEXT.md` - approved lifecycle and DTO/evidence model.

### Planning
- `.planning/REQUIREMENTS.md` - TEST-01..TEST-07.
- `.planning/ROADMAP.md` - Phase 178 scope and success criteria.

### Code
- `packages/spec/src/service-contract.test.ts` - schema contract test pattern.
- `apps/go-backend/main_test.go` - Go route and privacy tests.
- `apps/go-backend/orchestrator_test.go` - replay/evidence orchestration tests.
- `apps/web/app/matchsets/[matchSetId]/page.tsx` - result page render target.
- `apps/web/app/matchsets/evidence-copy.test.ts` - existing public evidence copy test pattern.
- `apps/web/app/matches/[matchId]/replay/replay-state.test.ts` - replay state test pattern.
- `scripts/check-boundary-monitors.ts` - drift monitor to extend.
- `scripts/check-service-boundary-imports.ts` - import boundary monitor.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing boundary monitor already scans route ownership, private markers, evidence artifacts, and runtime claims.
- Existing Go tests validate public fixture routes and reject private markers.

### Established Patterns
- Contract tests should fail loudly on stale, malformed, or private-shaped payloads.
- Privacy scans should cover JSON fixtures, Markdown evidence, Go outputs, and rendered app pages.

### Integration Points
- This phase links schemas from Phase 176 and fixtures from Phase 177 to app/Go/runtime-service behavior.

</code_context>

<specifics>
## Specific Ideas

Add coverage for every scenario fixture and make failures point to the drifting layer: schema, fixture, Go output, app render, or monitor rule.

</specifics>

<deferred>
## Deferred Ideas

Final live signed-in proof belongs to Phase 181.

</deferred>

---

*Phase: 178-Contract Test Harness and Drift Monitors*
*Context gathered: 2026-05-30*
