# Phase 100: Go MatchSet Scoring and Failure Classification - Summary

**Completed:** 2026-05-24
**Status:** Complete

## What Changed

- Added Go-owned MatchSet scoring in `apps/go-backend/scoring.go`, porting the TypeScript points, W/L/D, failed-system participation, strategy-failure penalty, and stable tie-breaker rules.
- Added Go-owned MatchSet status refresh in `apps/go-backend/matchset_status.go`, which loads Match rows, computes scoring/status, and persists `match_sets.status`, `scoring`, `degraded`, and `completed_at`.
- Wired scoring refresh into Go terminal paths:
  - successful Match completion in `apps/go-backend/completion.go`
  - exhausted system failure in `apps/go-backend/job_lifecycle.go`
- Updated public standings and evidence projection in `apps/go-backend/live_backend.go` to refresh through Go, preserve safe strategy-failure penalties, map evidence to public entrant ids, include arena ids, and aggregate public ladder standings from counted refreshed MatchSets.
- Added Go unit and DB integration tests for parity tie-breakers, side-specific survivor totals, strategy-failure penalties, failed-system degradation, completion-time refresh, exhausted-failure refresh, stale public summary refresh, public ladder aggregation, and public penalty projection.

## Requirements Covered

- SCORE-01: Go scorer covers wins, losses, draws, points, strategy-failure penalties, failed-system Matches, survivor totals, survival turns, and tie-breakers.
- SCORE-02: Go status refresh handles pending, running, complete, degraded, failed-system Match evidence, and blocked status.
- SCORE-03: Go updates stored MatchSet status/scoring proactively after terminal Match outcomes.
- SCORE-04: Go public summary and ladder endpoints refresh through Go-owned scoring and preserve public-safe penalties/standings.
- SCORE-05: Failed-system Matches degrade MatchSets without assigning false player losses; strategy-failure penalties remain explicit score penalties.
- SCORE-06: Go and TypeScript oracle tests cover the main scoring/status/public-read scenarios.

## Verification Run

- `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...`
- `cd apps/go-backend && COWARDS_GO_BACKEND_TEST_DATABASE_URL='postgresql://cowards:cowards@localhost:5432/cowards_game' PATH=/usr/local/go/bin:$PATH go test ./...`
- `pnpm exec vitest run packages/persistence/src/scoring.test.ts packages/persistence/src/competition.test.ts`
- `pnpm boundary:imports`
- `pnpm exec tsx scripts/check-boundary-monitors.ts`
- `git diff --check`

## Notes

Go scoring intentionally ports current semantics rather than redesigning competition rules. TypeScript scoring/status code remains the parity oracle and rollback/test reference.
