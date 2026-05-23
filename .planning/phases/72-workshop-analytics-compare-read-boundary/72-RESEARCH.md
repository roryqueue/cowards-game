# Phase 72 Research: Workshop Analytics Compare Read Boundary

## Findings

- `apps/web/app/api/workshop/analytics/profiles/[profileId]/compare/route.ts` keeps a local/playwright availability gate, maps storage-unavailable to 503, maps null to 404, and returns the comparison object directly.
- `workshopServer.compareAnalyticsRuns(profileId)` delegates to `comparePersistedWorkshopAnalyticsRuns(pool, profileId)`.
- The comparison behavior can be reproduced from `getWorkshopAnalyticsSnapshot(pool)` by taking the two newest runs for the profile and requiring matching compatibility hashes.
- `@cowards/service` already owns `getWorkshopAnalyticsSnapshot()` and analytics privacy checks.

## Implementation Notes

- Add a spec-owned analytics compare service DTO envelope with a raw-compatible `comparison` payload.
- Add `CowardsService.compareWorkshopAnalyticsRuns(profileId)`.
- Keep the local/production gate in the route.
- Keep null-to-404, storage-unavailable 503, and external response shape unchanged.

