# Phase 180: Execution/App Parallelization Adapter - Context

**Gathered:** 2026-05-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a fixture-backed app/test adapter for result and replay work without live Match execution services. This phase enables parallel app work; it must not create silent production fallback behavior.

</domain>

<decisions>
## Implementation Decisions

### Adapter Contract
- **D-01:** The adapter returns the same versioned app-facing DTO shapes as Go/service-backed reads.
- **D-02:** The adapter covers all required fixture scenarios from Phase 177.
- **D-03:** Adapter selection must be explicit and fail closed outside test/local development modes.

### Gating
- **D-04:** Fixture-backed execution should be enabled only in test/dev contexts through explicit env flags.
- **D-05:** Production must not silently fall back to fixtures when live Match execution or Go/service reads fail.

### the agent's Discretion
Downstream agents may decide exact env flag names and route boundaries, but should prefer obvious names consistent with existing replay fixture gating.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Shared Milestone Context
- `.planning/phases/v1.25-MILESTONE-DISCUSSION-CONTEXT.md` - approved lifecycle and DTO/evidence model.

### Planning
- `.planning/REQUIREMENTS.md` - ADAPT-01..ADAPT-05.
- `.planning/ROADMAP.md` - Phase 180 scope and success criteria.

### Code
- `apps/web/lib/public-service-adapter.ts` - public service adapter.
- `apps/web/app/api/test-support/replay-fixture/route.ts` - existing fixture gating pattern.
- `apps/web/app/api/test-support/replay-fixture/route.test.ts` - fixture enablement tests.
- `apps/web/app/matches/replay-fixture.ts` - replay fixture source.
- `packages/spec/src/service-fixtures.ts` - shared fixture definitions.
- `scripts/check-service-boundary-imports.ts` - boundary import constraints.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing replay fixture test-support route has enablement checks that can inform the new adapter.
- Public-service adapter is the natural place to select a fixture-backed source for app tests.

### Established Patterns
- Test support routes and fixture modes should be impossible to enable accidentally in production.
- Adapters should validate DTOs before returning data to pages.

### Integration Points
- This phase connects the fixture catalog to result/replay UI tests and local app development workflows.

</code_context>

<specifics>
## Specific Ideas

Consider a dedicated explicit flag such as `COWARDS_ENABLE_MATCH_EXECUTION_FIXTURES=1`, alongside existing test-mode gates, but let implementation confirm the best local naming.

</specifics>

<deferred>
## Deferred Ideas

Live signed-in proof remains Phase 181.

</deferred>

---

*Phase: 180-Execution/App Parallelization Adapter*
*Context gathered: 2026-05-30*
