# Phase 17 Summary: Result Pages and Replay Evidence

## Completed
- Added public `/matchsets/[matchSetId]` result page.
- Added `/api/matchsets/[matchSetId]` public result DTO route.
- Added standings, entrant cards, scoring policy, validity state, replay links, and provenance.
- Added owner-only source links when the signed-in user owns an entrant revision.

## Key Files
- `apps/web/app/matchsets/[matchSetId]/page.tsx`
- `apps/web/app/api/matchsets/[matchSetId]/route.ts`
- `packages/persistence/src/competition.ts`
- `packages/spec/src/competition.ts`

## Notes
- Replay links reuse the existing replay viewer and public replay privacy projection.
