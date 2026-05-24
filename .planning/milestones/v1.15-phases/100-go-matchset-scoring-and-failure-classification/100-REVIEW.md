---
phase: 100-go-matchset-scoring-and-failure-classification
reviewed: 2026-05-24T03:44:32Z
depth: standard
files_reviewed: 11
files_reviewed_list:
  - apps/go-backend/scoring.go
  - apps/go-backend/matchset_status.go
  - apps/go-backend/completion.go
  - apps/go-backend/job_lifecycle.go
  - apps/go-backend/live_backend.go
  - apps/go-backend/scoring_test.go
  - apps/go-backend/matchset_status_test.go
  - apps/go-backend/completion_test.go
  - apps/go-backend/job_lifecycle_test.go
  - packages/persistence/src/scoring.ts
  - packages/persistence/src/matchset-status.ts
findings:
  critical: 3
  warning: 2
  info: 0
  total: 5
status: fixed
---

# Phase 100: Code Review Report

**Reviewed:** 2026-05-24T03:44:32Z
**Depth:** standard
**Files Reviewed:** 11
**Status:** fixed

## Summary

Reviewed the Go MatchSet scoring/status refresh path, completion and job failure hooks, public MatchSet/ladder standings projection, and parity sources in `packages/persistence/src/scoring.ts` and `packages/persistence/src/matchset-status.ts`. The core scorer mostly matches TypeScript, but the Go public surfaces and refresh transaction model can publish stale or empty standings.

## Critical Issues

### CR-01: Public MatchSet summaries read stale scoring/status

**File:** `apps/go-backend/live_backend.go:974`
**Severity:** BLOCKER
**Issue:** `publicMatchSetResult` reads `match_sets.status` and `match_sets.scoring` directly at lines 978-983, then builds standings from that stored JSON at line 1016. The TypeScript public builder explicitly calls `refreshMatchSetStatus(pool, matchSetId)` before reading the row (`packages/persistence/src/competition.ts:461`). In Go, a public request can therefore return stale `queued`/empty standings after matches have completed, failed, or started but before a separate hook refreshed the MatchSet.
**Fix:**
```go
func (server *LiveServer) publicMatchSetResult(ctx context.Context, matchSetID string) (map[string]any, error) {
    if _, _, err := newMatchSetStatusService(server.pool).refreshMatchSetStatus(ctx, matchSetID); err != nil {
        return nil, err
    }
    // existing select/build logic
}
```

**Resolution:** Fixed. `publicMatchSetResult` now verifies the public competition MatchSet exists, runs Go-owned `refreshMatchSetStatus`, then reads the refreshed row. DB integration coverage proves a stale `pending`/null-scoring public MatchSet returns refreshed complete standings.

### CR-02: Public ladder standings are never populated

**File:** `apps/go-backend/live_backend.go:903`
**Severity:** BLOCKER
**Issue:** `publicLadder` always emits `"standings": []map[string]any{}` and `ladderMatchSets` only returns stored summaries. The TypeScript ladder builder refreshes every MatchSet and aggregates counted refreshed scores into standings (`packages/persistence/src/ladder.ts:671-753`). This makes the Go public ladder permanently empty even after completed counted MatchSets.
**Fix:** Mirror the TypeScript flow: load ladder MatchSets, call `refreshMatchSetStatus` for each, classify counted vs non-counted, aggregate `refreshed.scoring.rankings`, sort by the scoring tie breakers, and emit populated standings plus entrant IDs.

**Resolution:** Fixed. `publicLadder` now refreshes ladder MatchSets through Go, classifies counted evidence, aggregates counted scoring, maps entries into public standings, and includes entrant ids in MatchSet summaries. DB integration coverage proves a counted ladder MatchSet emits non-empty standings.

### CR-03: Concurrent refreshes can overwrite newer MatchSet scoring

**File:** `apps/go-backend/matchset_status.go:69`
**Severity:** BLOCKER
**Issue:** `refreshMatchSetStatusTx` reads all child matches at lines 70-75 and updates the parent MatchSet at lines 80-87 without first locking the `match_sets` row. Completion and failure transactions call this independently (`apps/go-backend/completion.go:200`, `apps/go-backend/job_lifecycle.go:252`). Two matches in the same MatchSet completing concurrently can compute different snapshots; the older snapshot can commit last and overwrite the newer complete/degraded scoring/status.
**Fix:**
```go
func refreshMatchSetStatusTx(ctx context.Context, tx pgx.Tx, matchSetID string) (string, matchSetScore, error) {
    var lockedID string
    if err := tx.QueryRow(ctx,
        `select id from match_sets where id = $1 for update`,
        matchSetID,
    ).Scan(&lockedID); err != nil {
        return "", matchSetScore{}, err
    }
    matches, statuses, err := listMatchSetScoreInputsTx(ctx, tx, matchSetID)
    // existing scoring/update logic
}
```

**Resolution:** Fixed. `refreshMatchSetStatusTx` locks the parent `match_sets` row with `FOR UPDATE` before reading child Match rows and writing refreshed scoring/status.

## Warnings

### WR-01: Public match evidence no longer matches the TypeScript DTO

**File:** `apps/go-backend/live_backend.go:1060`
**Severity:** WARNING
**Issue:** `matchSetEvidence` returns bottom/top Strategy Revision ids at lines 1085-1088 and omits `arenaVariantId` and `publicReason`. TypeScript maps those sides back to entrant ids and includes `arenaVariantId` plus `system_failure` for failed-system matches (`packages/persistence/src/competition.ts:568-585`). This breaks public result parity and makes the public evidence harder to correlate with standings.
**Fix:** Load entrant snapshots into a revision-to-entrant map, select `m.arena_variant_id`, map bottom/top to entrant ids, and add `publicReason: "system_failure"` when `m.status = 'failed_system'`.

**Resolution:** Fixed. `matchSetEvidence` now maps bottom/top Strategy Revisions to public entrant ids, includes `arenaVariantId`, and includes `publicReason: "system_failure"` for failed-system Matches.

### WR-02: High-risk public standings paths lack live tests

**File:** `apps/go-backend/matchset_status_test.go:118`
**Severity:** WARNING
**Issue:** The only public standings-specific test in the Phase 100 Go tests checks penalty filtering in isolation. There is no live public MatchSet summary test proving stale DB rows are refreshed, and no public ladder test proving completed MatchSet scores aggregate into non-empty standings. The fixture currently hard-codes empty standings for a MatchSet summary (`apps/go-backend/testdata/service-fixtures/degraded-match-set-summary.json:121`), so these regressions are not caught.
**Fix:** Add integration tests that seed a MatchSet with stale `match_sets.scoring`, call `publicMatchSetResult`, and assert refreshed status/standings; add a ladder DTO test with at least one complete counted MatchSet and assert non-empty aggregated standings with tie-breaker order.

**Resolution:** Fixed. Added DB integration coverage for stale public MatchSet summary refresh and counted ladder standings aggregation.

---

_Reviewed: 2026-05-24T03:44:32Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
