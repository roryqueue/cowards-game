# Phase 100: Go MatchSet Scoring and Failure Classification - Plan

**Status:** Ready for execution
**Research:** `100-RESEARCH.md`
**Requirements:** SCORE-01, SCORE-02, SCORE-03, SCORE-04, SCORE-05, SCORE-06

## Objective

Make Go the normal MatchSet scoring/status-refresh owner with TypeScript parity and conservative failure classification.

## Tasks

1. Port scoring logic to Go.
   - Preserve points, wins/losses/draws, strategy-failure penalties, failed-system Match counting, survivor totals, survival turns, and stable tie-breakers.

2. Port MatchSet status refresh to Go.
   - Load Match rows for a MatchSet.
   - Compute status for pending, running, complete, degraded, failed-system, and blocked input states.
   - Update `match_sets.status`, `scoring`, `degraded`, and `completed_at`.

3. Wire scoring refresh after Go terminal completion.
   - Ensure public reads see Go-refreshed scoring instead of TypeScript lazy refresh.

4. Preserve failure classification.
   - System failures degrade or fail without assigning false wins/losses.
   - Runtime violations affect scoring only as Strategy/player failures where existing rules require.

5. Add tests and parity fixtures.
   - Go scoring tests for complete, running, degraded, failed-system, strategy-failure penalty, and tie-breaker scenarios.
   - Public MatchSet read tests verifying penalties and standings are preserved.

6. Write `100-SUMMARY.md`, `100-VERIFICATION.md`, and `100-VALIDATION.md`.

## Verification

- `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...`
- TypeScript scoring parity tests
- Public MatchSet summary tests
- `git diff --check`

## Exit Criteria

- Go owns scoring/status refresh for normal workflows and public standings reflect Go-scored MatchSets.
