# Phase 088 Test Sidecar Review

Date: 2026-05-23

## Scope

This review covers bounded test and planning evidence for the v1.13 Go backend ownership cutover sidecar. Runtime implementation files were read only.

## Tests Added

- `apps/web/lib/public-service-adapter.test.ts`
  - Strengthened the public read adapter cutover test so `COWARDS_GO_PUBLIC_STRATEGY_READS=1` routes only `getPublicStrategyPage` to Go.
  - Added assertions that `getPublicMatchSetSummary`, `getPublicReplayMetadata`, `getPublicPlayerPage`, and `getPublicLadderSeason` continue through the TypeScript service until the all-public cutover switch is selected.
  - Added all-public cutover coverage for `COWARDS_GO_PUBLIC_READS=1`, verifying every public read is served by the Go client without TypeScript fallback.
- `apps/web/lib/public-go-read-client.test.ts`
  - Added multi-route request, encoding, and schema coverage for public player, ladder, MatchSet summary, and replay metadata reads.
  - Added route-specific diagnostic coverage for multi-route Go read failures.
- `apps/go-backend/main_test.go`
  - Added public read route coverage that checks encoded path IDs decode to the expected DTO identifiers across MatchSet summary, degraded MatchSet summary, replay metadata, and Strategy page routes.
  - Added route manifest drift tests for extra routes, public read method drift, and owner routes missing bearer-token requirements.

## Deferred Test Shapes

The v1.13 manifest monitor implementation exists in `scripts/check-boundary-monitors.ts`, but `scripts/check-boundary-monitors.test.ts` was outside this sidecar's edit scope. Expected executable monitor tests when scope permits:

- Corrupt `schemaVersion`, `milestone`, `decision`, or `typeScriptRole` in a temporary v1.13 manifest and assert the monitor reports a failing `go_promotion` check.
- Remove a required selected route such as `authSession` or `createMatchSet` and assert the monitor identifies the missing route.
- Change a selected non-worker route to `selectedOwner: "typescript_service"` or a fallback policy other than `no_fallback_when_go_selected` and assert failure.
- Change `workerRuntime` away from `worker_owned` or `goOwnedMigrations` away from `deferred` and assert failure.

## Notes

- No runtime implementation files were modified.
- The dirty worktree already contained active implementation edits in `apps/go-backend/main.go`, `apps/go-backend/live_backend.go`, `apps/go-backend/go.mod`, `apps/go-backend/go.sum`, and `scripts/check-boundary-monitors.ts`; this sidecar worked around them without reverting or editing them.
