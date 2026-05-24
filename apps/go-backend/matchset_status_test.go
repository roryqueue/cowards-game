package main

import (
	"context"
	"encoding/json"
	"os"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
)

func TestGoMatchSetStatusIntegration(t *testing.T) {
	databaseURL := os.Getenv("COWARDS_GO_BACKEND_TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("set COWARDS_GO_BACKEND_TEST_DATABASE_URL for Go MatchSet status integration tests")
	}
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()
	if err := ensurePersistenceSchema(ctx, pool); err != nil {
		t.Fatal(err)
	}

	t.Run("refreshes complete MatchSet scoring", func(t *testing.T) {
		prefix := "phase100-complete"
		cleanupPhase100Rows(t, ctx, pool, prefix)
		defer cleanupPhase100Rows(t, ctx, pool, prefix)
		ids := seedPhase100MatchSet(t, ctx, pool, prefix)
		setMatchCompleteForScoring(t, ctx, pool, ids.matchA, ids.bottomRevision, ids.bottomPlayerA, 2, 0, 10)
		setMatchCompleteForScoring(t, ctx, pool, ids.matchB, ids.topRevision, ids.topPlayerB, 0, 3, 12)

		status, scoring, err := newMatchSetStatusService(pool).refreshMatchSetStatus(ctx, ids.matchSetID)
		if err != nil {
			t.Fatal(err)
		}
		if status != matchSetStatusComplete || scoring.Degraded || !scoring.Complete {
			t.Fatalf("unexpected refreshed status/scoring: status=%s scoring=%+v", status, scoring)
		}
		assertPhase100MatchSetStored(t, ctx, pool, ids.matchSetID, matchSetStatusComplete, false, true)
		if got := strategyRevisionIDsFromRankings(scoring.Rankings); len(got) != 2 || got[0] != ids.topRevision || got[1] != ids.bottomRevision {
			t.Fatalf("unexpected scoring order: %v", got)
		}
	})

	t.Run("refreshes degraded failed-system MatchSet without false losses", func(t *testing.T) {
		prefix := "phase100-degraded"
		cleanupPhase100Rows(t, ctx, pool, prefix)
		defer cleanupPhase100Rows(t, ctx, pool, prefix)
		ids := seedPhase100MatchSet(t, ctx, pool, prefix)
		for _, matchID := range []string{ids.matchA, ids.matchB} {
			if _, err := pool.Exec(ctx, `
			update matches
			set status = 'failed_system',
			    completed_at = now(),
			    failure_category = 'SYSTEM',
			    failure_message = 'runtime service stopped'
			where id = $1
		`, matchID); err != nil {
				t.Fatal(err)
			}
		}

		status, scoring, err := newMatchSetStatusService(pool).refreshMatchSetStatus(ctx, ids.matchSetID)
		if err != nil {
			t.Fatal(err)
		}
		if status != matchSetStatusDegraded || !scoring.Degraded || scoring.Complete {
			t.Fatalf("unexpected degraded scoring: status=%s scoring=%+v", status, scoring)
		}
		for _, ranking := range scoring.Rankings {
			if ranking.Losses != 0 {
				t.Fatalf("system failure created a false loss: %+v", ranking)
			}
		}
		assertPhase100MatchSetStored(t, ctx, pool, ids.matchSetID, matchSetStatusDegraded, true, true)
	})

	t.Run("job failure exhaustion refreshes attached MatchSet", func(t *testing.T) {
		prefix := "phase100-failure-hook"
		cleanupPhase97Rows(t, ctx, pool, prefix)
		if _, err := pool.Exec(ctx, "delete from match_sets where id = $1", "match-set:"+prefix); err != nil {
			t.Fatal(err)
		}
		defer cleanupPhase97Rows(t, ctx, pool, prefix)
		defer func() {
			if _, err := pool.Exec(ctx, "delete from match_sets where id = $1", "match-set:"+prefix); err != nil {
				t.Fatal(err)
			}
		}()
		ids := seedPhase97MatchJob(t, ctx, pool, prefix, 1, "running", 1, nil)
		if _, err := pool.Exec(ctx, "insert into match_sets (id, status, matrix) values ($1, 'running', '{}'::jsonb)", "match-set:"+prefix); err != nil {
			t.Fatal(err)
		}
		if _, err := pool.Exec(ctx, "insert into match_set_matches (match_set_id, match_id, matrix_index) values ($1, $2, 0)", "match-set:"+prefix, ids.matchID); err != nil {
			t.Fatal(err)
		}
		status, err := newMatchJobLifecycle(pool).recordAttemptFailure(ctx, recordAttemptFailureInput{
			JobID:        ids.jobID,
			LeaseToken:   "lease:old:" + prefix,
			ErrorClass:   "SYSTEM",
			ErrorMessage: "runtime service stopped",
			Retryable:    true,
			Details:      map[string]any{"phase": "100"},
		})
		if err != nil {
			t.Fatal(err)
		}
		if status != matchStatusFailedSystem {
			t.Fatalf("expected failed_system lifecycle status, got %s", status)
		}
		assertPhase100MatchSetStored(t, ctx, pool, "match-set:"+prefix, matchSetStatusDegraded, true, true)
	})

	t.Run("public MatchSet summary refreshes stale stored scoring", func(t *testing.T) {
		prefix := "phase100-public-refresh"
		cleanupPhase100Rows(t, ctx, pool, prefix)
		defer cleanupPhase100Rows(t, ctx, pool, prefix)
		ids := seedPhase100MatchSet(t, ctx, pool, prefix)
		seedPhase100CompetitionEntrants(t, ctx, pool, ids)
		if _, err := pool.Exec(ctx, `
			update match_sets
			set competition_preset_id = 'smoke-exhibition-v1',
			    competition_preset_version = 'v1',
			    scoring_policy_version = 'v1',
			    visibility = 'public',
			    status = 'pending',
			    scoring = null
			where id = $1
		`, ids.matchSetID); err != nil {
			t.Fatal(err)
		}
		setMatchCompleteForScoring(t, ctx, pool, ids.matchA, ids.bottomRevision, ids.bottomPlayerA, 2, 0, 10)
		setMatchCompleteForScoring(t, ctx, pool, ids.matchB, ids.topRevision, ids.bottomPlayerB, 0, 3, 12)

		result, err := (&LiveServer{pool: pool}).publicMatchSetResult(ctx, ids.matchSetID)
		if err != nil {
			t.Fatal(err)
		}
		if stringValue(result, "status") != matchSetStatusComplete {
			t.Fatalf("expected refreshed public complete status, got %+v", result["status"])
		}
		standings, ok := result["standings"].([]map[string]any)
		if !ok || len(standings) != 2 {
			t.Fatalf("expected refreshed public standings, got %+v", result["standings"])
		}
		matches, ok := result["matches"].([]map[string]any)
		if !ok || len(matches) != 2 {
			t.Fatalf("expected public match evidence, got %+v", result["matches"])
		}
		firstEntrants := matches[0]["entrants"].(map[string]any)
		if firstEntrants["bottom"] != "entrant:"+prefix+":bottom" || stringValue(matches[0], "arenaVariantId") != ids.arenaID {
			t.Fatalf("expected entrant-mapped evidence with arena, got %+v", matches[0])
		}
		assertPhase100MatchSetStored(t, ctx, pool, ids.matchSetID, matchSetStatusComplete, false, true)
	})

	t.Run("public ladder aggregates refreshed counted scoring", func(t *testing.T) {
		prefix := "phase100-ladder"
		cleanupPhase100Rows(t, ctx, pool, prefix)
		defer cleanupPhase100Rows(t, ctx, pool, prefix)
		ids := seedPhase100MatchSet(t, ctx, pool, prefix)
		seedPhase100CompetitionEntrants(t, ctx, pool, ids)
		seedPhase100Ladder(t, ctx, pool, ids)
		setMatchCompleteForScoring(t, ctx, pool, ids.matchA, ids.bottomRevision, ids.bottomPlayerA, 2, 0, 10)
		setMatchCompleteForScoring(t, ctx, pool, ids.matchB, ids.topRevision, ids.bottomPlayerB, 0, 3, 12)
		insertPhase100ChronicleRow(t, ctx, pool, ids.matchA, "a")
		insertPhase100ChronicleRow(t, ctx, pool, ids.matchB, "b")

		result, err := (&LiveServer{pool: pool}).publicLadder(ctx, "trial-ladder:"+prefix)
		if err != nil {
			t.Fatal(err)
		}
		standings, ok := result["standings"].([]map[string]any)
		if !ok || len(standings) != 2 {
			t.Fatalf("expected aggregated ladder standings, got %+v", result["standings"])
		}
		if standings[0]["entrantId"] != "entry:"+prefix+":top" {
			t.Fatalf("expected top entry to lead on survivor tie-breaker, got %+v", standings)
		}
		matchSets, ok := result["matchSets"].([]map[string]any)
		if !ok || len(matchSets) != 1 || matchSets[0]["countedStatus"] != "counted" {
			t.Fatalf("expected counted ladder MatchSet, got %+v", result["matchSets"])
		}
	})
}

func TestGoPublicStandingsPreservePenalties(t *testing.T) {
	penalties := publicPenaltiesFromScoring(map[string]any{
		"penalties": []any{
			map[string]any{"matchId": "match:penalty", "reason": "strategy_failure", "points": float64(-1)},
			map[string]any{"matchId": "match:private", "reason": "debug_only", "points": float64(-99)},
		},
	})
	if len(penalties) != 1 {
		t.Fatalf("expected one public penalty, got %+v", penalties)
	}
	if penalties[0]["matchId"] != "match:penalty" || penalties[0]["reason"] != "strategy_failure" || penalties[0]["points"] != -1 {
		t.Fatalf("unexpected public penalty: %+v", penalties[0])
	}
}

type phase100IDs struct {
	prefix         string
	userID         string
	bottomStrategy string
	topStrategy    string
	bottomRevision string
	topRevision    string
	arenaID        string
	matchSetID     string
	matchA         string
	matchB         string
	bottomPlayerA  string
	topPlayerA     string
	bottomPlayerB  string
	topPlayerB     string
}

func seedPhase100MatchSet(t *testing.T, ctx context.Context, pool *pgxpool.Pool, prefix string) phase100IDs {
	t.Helper()
	ids := phase100IDs{
		prefix:         prefix,
		userID:         "user:" + prefix,
		bottomStrategy: "strategy:" + prefix + ":bottom",
		topStrategy:    "strategy:" + prefix + ":top",
		bottomRevision: "strategy-revision:" + prefix + ":bottom",
		topRevision:    "strategy-revision:" + prefix + ":top",
		arenaID:        "arena:" + prefix,
		matchSetID:     "match-set:" + prefix,
		matchA:         "match:" + prefix + ":a",
		matchB:         "match:" + prefix + ":b",
		bottomPlayerA:  "player:" + prefix + ":a:bottom",
		topPlayerA:     "player:" + prefix + ":a:top",
		bottomPlayerB:  "player:" + prefix + ":b:bottom",
		topPlayerB:     "player:" + prefix + ":b:top",
	}
	if _, err := pool.Exec(ctx, "insert into users (id, display_name, metadata) values ($1, $2, '{}'::jsonb) on conflict (id) do nothing", ids.userID, prefix); err != nil {
		t.Fatal(err)
	}
	for _, strategy := range []struct {
		id       string
		revision string
		label    string
	}{
		{ids.bottomStrategy, ids.bottomRevision, "bottom"},
		{ids.topStrategy, ids.topRevision, "top"},
	} {
		if _, err := pool.Exec(ctx, "insert into strategies (id, owner_user_id, name, metadata) values ($1, $2, $3, '{}'::jsonb) on conflict (id) do nothing", strategy.id, ids.userID, prefix+":"+strategy.label); err != nil {
			t.Fatal(err)
		}
		if _, err := pool.Exec(ctx, `
			insert into strategy_revisions (
			  id, strategy_id, source, source_hash, source_bytes, runtime,
			  engine_compatibility, validation, metadata
			)
			values ($1, $2, 'export default {}', $3, 17, '{}'::jsonb, '{}'::jsonb, '{"valid":true}'::jsonb, '{}'::jsonb)
			on conflict (id) do nothing
		`, strategy.revision, strategy.id, "sha256:"+strategy.label); err != nil {
			t.Fatal(err)
		}
	}
	if _, err := pool.Exec(ctx, `
		insert into arena_variants (id, name, version, config, metadata)
		values ($1, $2, 'arena-v1', '{}'::jsonb, '{}'::jsonb)
		on conflict (id) do nothing
	`, ids.arenaID, prefix); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, `
		insert into match_sets (id, status, matrix, scoring, degraded, scoring_policy_version)
		values ($1, 'pending', '{}'::jsonb, null, false, 'v1')
	`, ids.matchSetID); err != nil {
		t.Fatal(err)
	}
	insertPhase100Match(t, ctx, pool, ids.matchA, ids.bottomRevision, ids.topRevision, ids.arenaID, ids.bottomPlayerA, ids.topPlayerA)
	insertPhase100Match(t, ctx, pool, ids.matchB, ids.bottomRevision, ids.topRevision, ids.arenaID, ids.bottomPlayerB, ids.topPlayerB)
	if _, err := pool.Exec(ctx, `
		insert into match_set_matches (match_set_id, match_id, matrix_index)
		values ($1, $2, 0), ($1, $3, 1)
	`, ids.matchSetID, ids.matchA, ids.matchB); err != nil {
		t.Fatal(err)
	}
	return ids
}

func seedPhase100CompetitionEntrants(t *testing.T, ctx context.Context, pool *pgxpool.Pool, ids phase100IDs) {
	t.Helper()
	for index, entrant := range []struct {
		id       string
		revision string
		label    string
	}{
		{"entrant:" + ids.prefix + ":bottom", ids.bottomRevision, "bottom"},
		{"entrant:" + ids.prefix + ":top", ids.topRevision, "top"},
	} {
		snapshot := map[string]any{
			"entrantId":           entrant.id,
			"strategyRevisionId":  entrant.revision,
			"ownerUserId":         ids.userID,
			"ownerHandle":         "owner-" + entrant.label,
			"displayLabel":        "Strategy " + entrant.label,
			"sourceHash":          "sha256:" + entrant.label,
			"sourceBytes":         17,
			"runtime":             map[string]any{},
			"engineCompatibility": map[string]any{},
		}
		snapshotBytes, err := json.Marshal(snapshot)
		if err != nil {
			t.Fatal(err)
		}
		if _, err := pool.Exec(ctx, `
			insert into competition_entrants (
			  id, match_set_id, entrant_index, strategy_revision_id, owner_user_id,
			  owner_handle, display_label, source_hash, source_bytes,
			  runtime, engine_compatibility, snapshot
			)
			values ($1, $2, $3, $4, $5, $6, $7, $8, 17, '{}'::jsonb, '{}'::jsonb, $9)
		`, ids.matchSetID+":"+entrant.id, ids.matchSetID, index, entrant.revision, ids.userID, "owner-"+entrant.label, "Strategy "+entrant.label, "sha256:"+entrant.label, snapshotBytes); err != nil {
			t.Fatal(err)
		}
	}
}

func seedPhase100Ladder(t *testing.T, ctx context.Context, pool *pgxpool.Pool, ids phase100IDs) {
	t.Helper()
	seasonID := "trial-ladder:" + ids.prefix
	topUserID := "user:" + ids.prefix + ":top"
	if _, err := pool.Exec(ctx, "insert into users (id, display_name, metadata) values ($1, $2, '{}'::jsonb) on conflict (id) do nothing", topUserID, ids.prefix+":top"); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, `
		insert into trial_ladder_seasons (id, slug, name, status, season_seed, minimum_entries, target_pod_size)
		values ($1, $2, $3, 'active', $4, 2, 2)
	`, seasonID, ids.prefix, "Phase 100 Ladder", "seed:"+ids.prefix); err != nil {
		t.Fatal(err)
	}
	for index, entry := range []struct {
		id       string
		revision string
		userID   string
		label    string
	}{
		{"entry:" + ids.prefix + ":bottom", ids.bottomRevision, ids.userID, "bottom"},
		{"entry:" + ids.prefix + ":top", ids.topRevision, topUserID, "top"},
	} {
		snapshot := map[string]any{
			"entryId":            entry.id,
			"strategyRevisionId": entry.revision,
			"ownerHandle":        "owner-" + entry.label,
			"displayLabel":       "Strategy " + entry.label,
			"sourceHash":         "sha256:" + entry.label,
		}
		snapshotBytes, err := json.Marshal(snapshot)
		if err != nil {
			t.Fatal(err)
		}
		if _, err := pool.Exec(ctx, `
			insert into trial_ladder_entries (
			  id, season_id, owner_user_id, owner_handle, strategy_id,
			  strategy_revision_id, status, snapshot, entry_index
			)
			values ($1, $2, $3, $4, $5, $6, 'active', $7, $8)
		`, entry.id, seasonID, entry.userID, "owner-"+entry.label, map[bool]string{true: ids.bottomStrategy, false: ids.topStrategy}[entry.label == "bottom"], entry.revision, snapshotBytes, index); err != nil {
			t.Fatal(err)
		}
	}
	if _, err := pool.Exec(ctx, `
		update match_sets
		set ladder_season_id = $1,
		    counted_status = 'pending'
		where id = $2
	`, seasonID, ids.matchSetID); err != nil {
		t.Fatal(err)
	}
}

func insertPhase100Match(t *testing.T, ctx context.Context, pool *pgxpool.Pool, matchID string, bottomRevision string, topRevision string, arenaID string, bottomPlayerID string, topPlayerID string) {
	t.Helper()
	if _, err := pool.Exec(ctx, `
		insert into matches (
		  id, bottom_strategy_revision_id, top_strategy_revision_id, arena_variant_id,
		  seed, bottom_player_id, top_player_id, status
		)
		values ($1, $2, $3, $4, $5, $6, $7, 'pending')
	`, matchID, bottomRevision, topRevision, arenaID, "seed:"+matchID, bottomPlayerID, topPlayerID); err != nil {
		t.Fatal(err)
	}
}

func setMatchCompleteForScoring(t *testing.T, ctx context.Context, pool *pgxpool.Pool, matchID string, winnerRevision string, bottomPlayerID string, bottomSurvivors int, topSurvivors int, survivalTurns int) {
	t.Helper()
	var winnerPlayerID string
	var bottomRevision string
	var topRevision string
	var topPlayerID string
	if err := pool.QueryRow(ctx, `
		select bottom_strategy_revision_id, top_strategy_revision_id, top_player_id
		from matches
		where id = $1
	`, matchID).Scan(&bottomRevision, &topRevision, &topPlayerID); err != nil {
		t.Fatal(err)
	}
	if winnerRevision == bottomRevision {
		winnerPlayerID = bottomPlayerID
	} else if winnerRevision == topRevision {
		winnerPlayerID = topPlayerID
	}
	outcome, err := json.Marshal(map[string]any{"type": "WIN", "winnerPlayerId": winnerPlayerID})
	if err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, `
		update matches
		set status = 'complete',
		    outcome = $1,
		    winner_player_id = $2,
		    surviving_soldiers = $3,
		    bottom_surviving_soldiers = $4,
		    top_surviving_soldiers = $5,
		    survival_turns = $6,
		    bottom_survival_turns = $6,
		    top_survival_turns = $6,
		    completed_at = now()
		where id = $7
	`, outcome, winnerPlayerID, bottomSurvivors+topSurvivors, bottomSurvivors, topSurvivors, survivalTurns, matchID); err != nil {
		t.Fatal(err)
	}
}

func assertPhase100MatchSetStored(t *testing.T, ctx context.Context, pool *pgxpool.Pool, matchSetID string, wantStatus string, wantDegraded bool, wantCompletedAt bool) {
	t.Helper()
	var status string
	var degraded bool
	var completedAt *string
	var scoringRaw []byte
	if err := pool.QueryRow(ctx, `
		select status::text, degraded, completed_at::text, scoring
		from match_sets
		where id = $1
	`, matchSetID).Scan(&status, &degraded, &completedAt, &scoringRaw); err != nil {
		t.Fatal(err)
	}
	if status != wantStatus || degraded != wantDegraded {
		t.Fatalf("unexpected stored MatchSet status=%s degraded=%v", status, degraded)
	}
	if (completedAt != nil) != wantCompletedAt {
		t.Fatalf("unexpected completed_at presence: %v", completedAt)
	}
	if len(scoringRaw) == 0 {
		t.Fatal("expected stored scoring JSON")
	}
}

func insertPhase100ChronicleRow(t *testing.T, ctx context.Context, pool *pgxpool.Pool, matchID string, suffix string) {
	t.Helper()
	if _, err := pool.Exec(ctx, `
		insert into chronicles (
		  id, match_id, schema_version, hash, outcome, event_count,
		  snapshot_count, bottom_player_id, top_player_id,
		  bottom_strategy_revision_id, top_strategy_revision_id,
		  arena_variant_id, artifact
		)
		select
		  $1, m.id, 'chronicle-v1.4', $2, '{}'::jsonb, 1,
		  1, m.bottom_player_id, m.top_player_id,
		  m.bottom_strategy_revision_id, m.top_strategy_revision_id,
		  m.arena_variant_id, '{}'::jsonb
		from matches m
		where m.id = $3
	`, "chronicle:"+matchID+":"+suffix, "hash:"+matchID+":"+suffix, matchID); err != nil {
		t.Fatal(err)
	}
}

func cleanupPhase100Rows(t *testing.T, ctx context.Context, pool *pgxpool.Pool, prefix string) {
	t.Helper()
	if _, err := pool.Exec(ctx, "delete from trial_ladder_entries where season_id like $1", "trial-ladder:"+prefix+"%"); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, "delete from match_set_matches where match_set_id like $1 or match_id like $2", "match-set:"+prefix+"%", "match:"+prefix+"%"); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, "delete from competition_entrants where match_set_id like $1", "match-set:"+prefix+"%"); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, "delete from match_jobs where match_id like $1", "match:"+prefix+"%"); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, "delete from chronicles where match_id like $1", "match:"+prefix+"%"); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, "delete from matches where id like $1", "match:"+prefix+"%"); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, "delete from match_sets where id like $1", "match-set:"+prefix+"%"); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, "delete from trial_ladder_seasons where id like $1", "trial-ladder:"+prefix+"%"); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, "delete from strategy_revisions where id like $1", "strategy-revision:"+prefix+"%"); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, "delete from strategies where id like $1", "strategy:"+prefix+"%"); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, "delete from users where id like $1", "user:"+prefix+"%"); err != nil {
		t.Fatal(err)
	}
}
