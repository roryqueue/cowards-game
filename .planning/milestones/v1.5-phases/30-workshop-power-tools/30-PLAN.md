# Phase 30: Workshop Power Tools - Plan

## Research Summary

- Workshop is rendered by `apps/web/app/page.tsx` through `WorkshopClient`.
- Existing Workshop tests already cover client helpers and server facades.
- MatchSet/job/replay infrastructure is the correct execution path; Strategy code must not execute in web/API routes.

## Implemented Plan

1. Add Advanced Library entry point to the Workshop surface.
2. Add revision comparison summary for selected immutable revisions.
3. Reframe Workshop tests as profile-scoped gauntlet results with replay handoff links.
4. Preserve validation diagnostics and public/owner replay separation.

## Verification

- `pnpm typecheck`
- `pnpm lint`
- `pnpm --filter @cowards/web test -- workshop-client.test.tsx server.test.ts`
- Browser check at `http://localhost:3000/`
