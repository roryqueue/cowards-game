# Phase 71: Workshop Test Summary Read Boundary - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 71 migrates the existing `GET /api/workshop/tests/{matchSetId}` read path behind `@cowards/service` and `@cowards/spec` while preserving the external API response shape. It must not move Workshop test launch, Strategy source validation, Strategy source save/retrieval, runtime execution, Match orchestration, worker behavior, analytics rerun, profile save, or export behavior.

</domain>

<decisions>
## Implementation Decisions

### External API Response Shape

- **D-01:** Preserve the legacy route response shape. The API route should still return the raw Workshop test summary object the web client already expects.
- **D-02:** Internally, the route should call a service DTO/envelope and adapt it back to the legacy summary response.
- **D-03:** Do not introduce query/header dual-mode behavior or expose service envelopes externally in Phase 71.

### Service DTO Shape

- **D-04:** Use a service envelope with a raw-compatible payload, likely `{ apiVersion, kind, matchSetId, summary }`.
- **D-05:** The route adapts by returning `summary` unchanged.
- **D-06:** The DTO should be schema-validated through `@cowards/spec`, including both the envelope and the summary payload.

### Source-Free Summary Fields

- **D-07:** The summary payload should include exact current fields only: `matchSetId`, `status`, `matchCount`, optional `matchIds` if present, `matches`, and `scoring`.
- **D-08:** Preserve existing match row fields, including `outcome` and `winnerPlayerId`, because they are already part of current Workshop test summary behavior.
- **D-09:** Do not add provenance, compatibility, runtime, schema metadata, or renamed normalized fields in Phase 71.
- **D-10:** The DTO and route must omit Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, and private runtime internals by default.

### Error Behavior

- **D-11:** Preserve current route behavior: `null` summary remains a 404 with current-style error body.
- **D-12:** Do not newly normalize unexpected/storage errors into 503 unless the planner finds this route already has that behavior.
- **D-13:** The service method may use service-safe errors internally if that matches `@cowards/service` patterns, but the external route behavior must remain compatible.

### Rollback

- **D-14:** Document route-level rollback in Phase 71 artifacts: restore `GET /api/workshop/tests/{matchSetId}` to `workshopServer.getTestSummary`, remove any Phase 71 strict target, and keep DTO/service tests isolated enough to back out without disturbing Phase 72.

### the agent's Discretion

- The planner may choose exact schema and type names, but names should make clear this is a Workshop test-summary read DTO, not a launch/test execution DTO.
- The planner may decide whether the route imports a new web boundary helper or calls an existing/adapted Workshop read helper, provided strict import enforcement can prove the safe dependency closure.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and Prior Phase Context

- `.planning/PROJECT.md` - Current v1.11 milestone goal and project constraints.
- `.planning/REQUIREMENTS.md` - WTEST requirements and v1.11 out-of-scope boundaries.
- `.planning/ROADMAP.md` - Phase 71 goal and success criteria.
- `.planning/phases/70-boundary-debt-rebaseline-and-v1-11-scope-lock/70-CONTEXT.md` - Candidate/defer thresholds and route-level rollback policy.

### Current Workshop Test Summary Code

- `apps/web/app/api/workshop/tests/[matchSetId]/route.ts` - Existing GET route to migrate internally while preserving external response.
- `apps/web/app/workshop/server.ts` - Existing `getTestSummary` facade and adjacent out-of-scope Workshop behaviors.
- `apps/web/app/workshop/types.ts` - Current Workshop type exports and source-bearing type import debt.
- `packages/persistence/src/workshop.ts` - Current `WorkshopTestSummary` shape and `getWorkshopTestSummary` persistence implementation.
- `packages/persistence/src/matchset-status.ts` - Current match row and scoring status summary shape.

### Service and Spec Patterns

- `packages/service/src/index.ts` - Existing local service method, schema parse, and privacy-check patterns.
- `packages/spec/src/service.ts` - Service route metadata and envelope conventions.
- `packages/spec/src/schemas.ts` - Existing service DTO schema patterns.
- `apps/web/lib/workshop-analytics-service-boundary.ts` - Existing Workshop read boundary adapter pattern.
- `scripts/check-service-boundary-imports.ts` - Strict import enforcement target configuration.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `workshopServer.getTestSummary(matchSetId)` currently returns `WorkshopTestSummary | null`.
- `getWorkshopTestSummary(pool, matchSetId)` already guards non-Workshop MatchSet ids by returning `null`.
- Existing service methods use envelope DTOs, parse through spec schemas, and apply public/privacy leak checks before returning.

### Established Patterns

- Web boundary helpers adapt service envelopes back to existing page/route shapes when product shape should not change.
- Selected read migrations should not move adjacent writes or source-bearing behavior.
- Route-level rollback is the preferred rollback shape for v1.11 Workshop read migrations.

### Integration Points

- The likely route integration point is `apps/web/app/api/workshop/tests/[matchSetId]/route.ts`.
- The likely service integration point is a new `CowardsService` method for Workshop test-summary reads.
- The likely spec integration point is a new source-free Workshop test-summary service DTO schema.

</code_context>

<specifics>
## Specific Ideas

- Preserve existing external API behavior first; use the service boundary internally.
- Keep the Phase 71 service DTO small and reversible so Phase 72 can proceed independently.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

</deferred>

---

*Phase: 71-Workshop Test Summary Read Boundary*
*Context gathered: 2026-05-23*
