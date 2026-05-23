# Phase 72: Workshop Analytics Compare Read Boundary - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 72 migrates the existing `GET /api/workshop/analytics/profiles/{profileId}/compare` read path behind `@cowards/service` and `@cowards/spec` while preserving the external API response shape. It must not move analytics rerun, profile save, export, gauntlet execution, test Match launch, worker execution, persistence writes, runtime behavior, or Strategy source behavior.

</domain>

<decisions>
## Implementation Decisions

### External API Response Shape

- **D-01:** Preserve the legacy comparison response shape. The route should continue returning the current comparison object with `profileId`, `baseRunId`, `compareRunId`, `compatibilityEquivalent`, and `delta`.
- **D-02:** Internally, use a service envelope with a raw-compatible payload and adapt the route back to the legacy comparison response.
- **D-03:** Do not return service envelopes externally and do not add richer comparison fields, totals, evidence bands, exports, source data, rerun metadata, or private runtime/replay data in Phase 72.

### Null, Compatibility, and Error Behavior

- **D-04:** Preserve current null-to-404 behavior. Not enough comparable runs, missing profile data, and compatibility mismatch should continue producing the current external 404 shape.
- **D-05:** Service internals may optionally distinguish null reasons for tests or implementation diagnostics, but the route must preserve the same external response.
- **D-06:** Preserve current storage-unavailable behavior. This route already maps `isStorageUnavailableError` to a public-safe 503 response.
- **D-07:** Preserve current local/production availability behavior. The route gate remains `NODE_ENV !== "production" || PLAYWRIGHT_TEST === "1"` unless implementation discovers an already-established owner auth pattern in this route family.

### Availability Gate Ownership

- **D-08:** Keep `localAnalyticsAllowed()` in the route only. The route decides local/production availability before calling the service.
- **D-09:** Do not move the local/production environment gate into `@cowards/service`, and do not duplicate it in both route and service.
- **D-10:** The service method remains a read DTO boundary rather than a web environment-policy or auth owner.

### Rollback

- **D-11:** Document route-level rollback in Phase 72 artifacts: restore `GET /api/workshop/analytics/profiles/{profileId}/compare` to `workshopServer.compareAnalyticsRuns`, remove any Phase 72 strict target, and keep DTO/service tests isolated from Phase 71.

### the agent's Discretion

- The planner may choose exact schema/type names, but names should make clear this is a Workshop analytics comparison read DTO, not analytics rerun/export/profile-save ownership.
- The planner may choose whether the route uses a new web helper or extends an existing Workshop analytics read helper, provided strict import enforcement can prove the safe dependency closure.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and Prior Phase Context

- `.planning/PROJECT.md` - Current v1.11 milestone goal and project constraints.
- `.planning/REQUIREMENTS.md` - WCOMP requirements and v1.11 out-of-scope boundaries.
- `.planning/ROADMAP.md` - Phase 72 goal and success criteria.
- `.planning/phases/70-boundary-debt-rebaseline-and-v1-11-scope-lock/70-CONTEXT.md` - Candidate/defer thresholds and route-level rollback policy.
- `.planning/phases/71-workshop-test-summary-read-boundary/71-CONTEXT.md` - Preserved external response and service-envelope pattern carried into Phase 72.

### Current Analytics Compare Code

- `apps/web/app/api/workshop/analytics/profiles/[profileId]/compare/route.ts` - Existing GET route to migrate internally while preserving external response and availability gate.
- `apps/web/app/workshop/server.ts` - Existing `compareAnalyticsRuns` facade and adjacent out-of-scope Workshop behaviors.
- `packages/persistence/src/workshop-analytics.ts` - Current `comparePersistedWorkshopAnalyticsRuns` behavior, null semantics, and delta shape.

### Service and Spec Patterns

- `packages/service/src/index.ts` - Existing local service method, schema parse, and privacy-check patterns.
- `packages/spec/src/service.ts` - Service route metadata and envelope conventions.
- `packages/spec/src/schemas.ts` - Existing service DTO schema patterns.
- `apps/web/lib/workshop-analytics-service-boundary.ts` - Existing Workshop analytics read boundary adapter pattern.
- `scripts/check-service-boundary-imports.ts` - Strict import enforcement target configuration.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `workshopServer.compareAnalyticsRuns(profileId)` currently returns the legacy comparison object or `null`.
- `comparePersistedWorkshopAnalyticsRuns(pool, profileId)` sorts runs by `runIndex`, requires at least two runs, requires matching compatibility hashes, and returns W-L-D/points deltas.
- The route already has public-safe 403, 404, and storage-unavailable 503 responses with `cache-control: no-store`.

### Established Patterns

- Web routes can keep their external response shape while calling service-owned DTOs internally.
- Local/production availability gates belong to the web route unless a phase explicitly scopes owner auth/session ownership.
- Selected read migrations should avoid moving adjacent analytics mutations or execution behavior.

### Integration Points

- The likely route integration point is `apps/web/app/api/workshop/analytics/profiles/[profileId]/compare/route.ts`.
- The likely service integration point is a new `CowardsService` method for Workshop analytics comparison reads.
- The likely spec integration point is a new source-free Workshop analytics comparison service DTO schema.

</code_context>

<specifics>
## Specific Ideas

- Preserve the current external API behavior first; use the service boundary internally.
- Do not make Phase 72 a product improvement to analytics comparison copy or data richness.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

</deferred>

---

*Phase: 72-Workshop Analytics Compare Read Boundary*
*Context gathered: 2026-05-23*
