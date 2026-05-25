# Phase 114 Summary: Go Orchestration and Non-Counted Eligibility

**Status:** Complete
**Completed:** 2026-05-24

## One-Liner

Kept Go as Match orchestrator while allowing Python only through runtime-service metadata and rejecting it from counted/ranked eligibility.

## Delivered

- Hardened Go runtime-service Strategy validation against registered broker metadata.
- Added non-counted exhibition request support and counted status/reason/explanation fields.
- Preserved counted filters so Python cannot enter counted MatchSet or ranked-style paths.
- Added exhibition UI/client Counted and Unranked modes.

## Verification

- `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...`
- `pnpm --filter @cowards/web typecheck`
- `pnpm --filter @cowards/web test`
- Browser page smoke for `/exhibitions/new`

## Notes

Unranked mode permits experimental valid revisions; counted mode still filters to counted-eligible revisions.
