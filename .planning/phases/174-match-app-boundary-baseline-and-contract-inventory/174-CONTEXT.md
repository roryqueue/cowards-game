# Phase 174: Match/App Boundary Baseline and Contract Inventory - Context

**Gathered:** 2026-05-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Inventory current Match execution app-facing surfaces and classify stable versus internal dependencies. This phase produces the baseline map; it should not freeze schemas or refactor app pages beyond what is necessary to make the inventory honest.

</domain>

<decisions>
## Implementation Decisions

### Baseline Scope
- **D-01:** Start from the v1.24 floor: JS/TS counted, non-JS non-counted exhibition beta, Preview 1 JSON ABI active, no production sandbox certification.
- **D-02:** Classify each surface as app-facing contract, owner/test-only contract, execution-internal, persistence-internal, or intentionally unstable.
- **D-03:** Treat app dependencies on execution internals as follow-up targets for phases 176-180.
- **D-04:** Carry forward the lifecycle and DTO/evidence decisions in `.planning/phases/v1.25-MILESTONE-DISCUSSION-CONTEXT.md`.

### the agent's Discretion
Downstream agents may choose the inventory format, tables, and code search strategy. The result must be complete enough to drive schema, fixture, monitor, and UI hardening phases.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Shared Milestone Context
- `.planning/phases/v1.25-MILESTONE-DISCUSSION-CONTEXT.md` - approved lifecycle, DTO, evidence, and non-goal decisions.

### Planning
- `AGENTS.md` - project boundaries and non-negotiables.
- `.planning/REQUIREMENTS.md` - BASE-01..BASE-05.
- `.planning/ROADMAP.md` - Phase 174 scope and success criteria.
- `.planning/research/v1.25-SUMMARY.md` - initial research inventory.

### Code Surfaces To Inventory
- `packages/spec/src/service.ts` - public service DTOs.
- `packages/spec/src/service-fixtures.ts` - current fixture DTO examples.
- `apps/web/lib/public-service-adapter.ts` - app service adapter.
- `apps/web/app/matchsets/[matchSetId]/page.tsx` - MatchSet result page dependency.
- `apps/web/app/matches/server.ts` - replay/result data loading.
- `apps/go-backend/live_backend.go` - Go public output surface.
- `apps/go-backend/runtime_service_client.go` - runtime-service envelope boundary.
- `scripts/check-boundary-monitors.ts` - current drift monitor.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing public DTOs and fixtures already provide a starting map for summary, replay metadata, and replay evidence.
- Boundary monitors already scan privacy markers and route ownership.

### Established Patterns
- Public evidence is category-based and redacted.
- Go/backend public routes should serve app-facing shapes rather than runtime-service internals.

### Integration Points
- Inventory output should feed phases 175-180 directly.

</code_context>

<specifics>
## Specific Ideas

Include MatchSet creation, Go lifecycle, runtime-service envelopes, public result DTOs, replay metadata/evidence DTOs, app pages, adapters, fixtures, and monitors.

</specifics>

<deferred>
## Deferred Ideas

Schema creation belongs to Phase 176. Fixture catalog implementation belongs to Phase 177. UI hardening belongs to Phase 179.

</deferred>

---

*Phase: 174-Match/App Boundary Baseline and Contract Inventory*
*Context gathered: 2026-05-30*
