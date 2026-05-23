# Phase 66 Research: Workshop Analytics Evidence Read Boundary

## Findings

- `packages/spec/src/analytics.ts` already owned the analytics profile, run, matchup, evidence, replay, compatibility, and public privacy helper contracts. It lacked only the aggregate `WorkshopAnalyticsSnapshot` type and matching Zod schema.
- `packages/service/src/index.ts` already depended on persistence analytics for owner-scoped run summaries, so adding a full Workshop analytics snapshot service read kept persistence behind `@cowards/service`.
- `apps/web/app/workshop/evidence/evidence-client.tsx` only needed `initialData.analytics`, not the broader `WorkshopInitialData` type.
- The broad Workshop server module remains appropriate deferred debt for source/save/test/runtime and mutation flows.
- Evidence and heatmap state tests only needed representative analytics rows, so a spec-only fixture could replace persistence demo fixture imports.

## Decision

Implement one strict read closure for `apps/web/app/workshop/evidence/page.tsx`:

- Add spec-owned `WorkshopAnalyticsSnapshot` and `WorkshopAnalyticsSnapshotSchema`.
- Add `CowardsService.getWorkshopAnalyticsSnapshot()`.
- Add web service adapter/boundary files for Workshop analytics reads.
- Update the Evidence page to call only the analytics read boundary.
- Update web state tests to use a spec-only analytics fixture.
- Promote the Evidence page and analytics read boundary to strict import enforcement.

