# Phase 16 Summary: Exhibition Queue and Entry

## Completed
- Added `/exhibitions/new` UI for selecting 2-8 owned valid Strategy Revisions.
- Added `/api/exhibitions` to create public unranked exhibition MatchSets.
- Added mirrored pairwise Match matrix generation over selected revisions.
- Added account page link into exhibition creation.

## Key Files
- `apps/web/app/exhibitions/new/page.tsx`
- `apps/web/app/exhibitions/new/exhibition-client.tsx`
- `apps/web/app/api/exhibitions/route.ts`
- `apps/web/app/competitive/server.ts`
- `packages/persistence/src/competition.ts`

## Notes
- "One strategy per user" remains intentionally deferred; v1.2 allows 2-8 distinct owned revisions by the same user.
