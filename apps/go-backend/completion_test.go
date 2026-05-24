package main

import (
	"context"
	"encoding/json"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func TestGoMatchCompletionFields(t *testing.T) {
	fields, err := deriveGoMatchCompletionFields(completionFinalStateForTest("match:complete:001"))
	if err != nil {
		t.Fatal(err)
	}
	if fields.MatchID != "match:complete:001" || fields.SurvivingSoldiers != 1 || fields.BottomSurvivingSoldiers != 1 || fields.TopSurvivingSoldiers != 0 || fields.SurvivalTurns != 48 {
		t.Fatalf("unexpected completion fields: %+v", fields)
	}
	if fields.WinnerPlayerID == nil || *fields.WinnerPlayerID != "player:bottom:complete:001" {
		t.Fatalf("unexpected winner: %+v", fields.WinnerPlayerID)
	}
}

func TestGoChronicleMetadataValidation(t *testing.T) {
	chronicle := completionChronicleForTest("match:complete:001")
	metadata, err := createGoChronicleMetadata(chronicle)
	if err != nil {
		t.Fatal(err)
	}
	if metadata.MatchID != "match:complete:001" || metadata.EventCount != 4 || metadata.SnapshotCount != 2 || metadata.Outcome == nil || metadata.ID == "" || metadata.Hash == "" {
		t.Fatalf("unexpected metadata: %+v", metadata)
	}
	invalid := completionChronicleForTest("match:private")
	invalidEvents := invalid["events"].([]any)
	invalidEvents[1].(map[string]any)["payload"] = map[string]any{"ownerDebug": "leak"}
	if _, err := createGoChronicleMetadata(invalid); err == nil {
		t.Fatal("expected private marker validation failure")
	}
	ownerPrivate := completionChronicleForTest("match:owner-private")
	ownerPrivate["private"] = map[string]any{"byPlayerId": map[string]any{"player:bottom": map[string]any{"strategyMemory": "PRIVATE_allowed_in_private_section"}}}
	if _, err := createGoChronicleMetadata(ownerPrivate); err != nil {
		t.Fatalf("expected owner-private Chronicle section to persist without public leak failure: %v", err)
	}
	missingTerminal := completionChronicleForTest("match:missing-terminal")
	missingTerminal["snapshots"] = []any{}
	if _, err := createGoChronicleMetadata(missingTerminal); err == nil {
		t.Fatal("expected missing terminal validation failure")
	}
	nonContiguous := completionChronicleForTest("match:non-contiguous")
	nonContiguousEvents := nonContiguous["events"].([]any)
	nonContiguousEvents[2].(map[string]any)["sequence"] = 9
	if _, err := createGoChronicleMetadata(nonContiguous); err == nil {
		t.Fatal("expected non-contiguous event sequence validation failure")
	}
	invalidBoard := completionChronicleForTest("match:invalid-board")
	invalidSnapshots := invalidBoard["snapshots"].([]any)
	invalidSnapshots[0].(map[string]any)["board"] = map[string]any{}
	if _, err := createGoChronicleMetadata(invalidBoard); err == nil {
		t.Fatal("expected invalid board validation failure")
	}
	withIntegrity := completionChronicleForTest("match:hash-parity")
	withIntegrity["integrity"] = map[string]any{"normalizedContentHash": "ignored"}
	withIntegrity["storageMetadata"] = map[string]any{"hostPath": "/Users/private/ignored"}
	hashWithExtra, err := hashChronicleArtifact(withIntegrity)
	if err != nil {
		t.Fatal(err)
	}
	withoutIntegrity := completionChronicleForTest("match:hash-parity")
	hashWithoutExtra, err := hashChronicleArtifact(withoutIntegrity)
	if err != nil {
		t.Fatal(err)
	}
	if hashWithExtra != hashWithoutExtra {
		t.Fatalf("expected Chronicle hash to ignore integrity/storage metadata: %s != %s", hashWithExtra, hashWithoutExtra)
	}
}

func TestGoMatchCompletionIntegration(t *testing.T) {
	databaseURL := os.Getenv("COWARDS_GO_BACKEND_TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("set COWARDS_GO_BACKEND_TEST_DATABASE_URL for Go completion integration tests")
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

	t.Run("completes atomically with Chronicle", func(t *testing.T) {
		prefix := "phase99-complete"
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
		ids := seedPhase97MatchJob(t, ctx, pool, prefix, 3, "queued", 0, nil)
		if _, err := pool.Exec(ctx, "insert into match_sets (id, status, matrix) values ($1, 'pending', '{}'::jsonb)", "match-set:"+prefix); err != nil {
			t.Fatal(err)
		}
		if _, err := pool.Exec(ctx, "insert into match_set_matches (match_set_id, match_id, matrix_index) values ($1, $2, 0)", "match-set:"+prefix, ids.matchID); err != nil {
			t.Fatal(err)
		}
		lifecycle := newTestMatchJobLifecycle(pool, time.Date(2026, 5, 16, 12, 0, 0, 0, time.UTC), "lease:go:complete")
		claimed, err := lifecycle.claimNextMatchJob(ctx, claimMatchJobInput{WorkerID: "worker:go:complete"})
		if err != nil {
			t.Fatal(err)
		}
		service := newMatchCompletionService(pool)
		result, err := service.completeMatch(ctx, completeMatchInput{
			JobID:      claimed.JobID,
			LeaseToken: claimed.LeaseToken,
			Chronicle:  completionChronicleForTest(ids.matchID),
			FinalState: completionFinalStateForTest(ids.matchID),
		})
		if err != nil {
			t.Fatal(err)
		}
		if result.Status != "complete" || result.MatchID != ids.matchID || result.ChronicleID == "" {
			t.Fatalf("unexpected completion result: %+v", result)
		}
		assertPhase97Job(t, ctx, pool, ids.jobID, "complete", 1, "worker:go:complete", "lease:go:complete")
		assertPhase97MatchStatus(t, ctx, pool, ids.matchID, "complete")
		assertChronicleExists(t, ctx, pool, ids.matchID)
		assertPhase97Attempt(t, ctx, pool, ids.jobID, 1, "complete")
		assertPhase100MatchSetStored(t, ctx, pool, "match-set:"+prefix, matchSetStatusComplete, false, true)

		duplicate, err := service.completeMatch(ctx, completeMatchInput{
			JobID:      claimed.JobID,
			LeaseToken: claimed.LeaseToken,
			Chronicle:  completionChronicleForTest(ids.matchID),
			FinalState: completionFinalStateForTest(ids.matchID),
		})
		if err != nil {
			t.Fatal(err)
		}
		if duplicate.ChronicleID != result.ChronicleID {
			t.Fatalf("duplicate completion returned different Chronicle: %+v", duplicate)
		}
	})

	t.Run("fails closed on invalid lease or invalid Chronicle", func(t *testing.T) {
		prefix := "phase99-invalid"
		cleanupPhase97Rows(t, ctx, pool, prefix)
		defer cleanupPhase97Rows(t, ctx, pool, prefix)
		ids := seedPhase97MatchJob(t, ctx, pool, prefix, 3, "queued", 0, nil)
		lifecycle := newTestMatchJobLifecycle(pool, time.Date(2026, 5, 16, 12, 0, 0, 0, time.UTC), "lease:go:invalid")
		claimed, err := lifecycle.claimNextMatchJob(ctx, claimMatchJobInput{WorkerID: "worker:go:invalid"})
		if err != nil {
			t.Fatal(err)
		}
		service := newMatchCompletionService(pool)
		if _, err := service.completeMatch(ctx, completeMatchInput{
			JobID:      claimed.JobID,
			LeaseToken: "wrong-token",
			Chronicle:  completionChronicleForTest(ids.matchID),
			FinalState: completionFinalStateForTest(ids.matchID),
		}); err == nil {
			t.Fatal("expected invalid lease completion to fail")
		}
		invalidChronicle := completionChronicleForTest(ids.matchID)
		invalidChronicle["snapshots"] = []any{}
		if _, err := service.completeMatch(ctx, completeMatchInput{
			JobID:      claimed.JobID,
			LeaseToken: claimed.LeaseToken,
			Chronicle:  invalidChronicle,
			FinalState: completionFinalStateForTest(ids.matchID),
		}); err == nil {
			t.Fatal("expected invalid Chronicle completion to fail")
		}
		assertPhase97Job(t, ctx, pool, ids.jobID, "running", 1, "worker:go:invalid", "lease:go:invalid")
	})

	t.Run("rejects a lease for a different Match", func(t *testing.T) {
		prefixA := "phase99-wrong-job-a"
		prefixB := "phase99-wrong-job-b"
		cleanupPhase97Rows(t, ctx, pool, prefixA)
		cleanupPhase97Rows(t, ctx, pool, prefixB)
		defer cleanupPhase97Rows(t, ctx, pool, prefixA)
		defer cleanupPhase97Rows(t, ctx, pool, prefixB)
		idsA := seedPhase97MatchJob(t, ctx, pool, prefixA, 3, "queued", 0, nil)
		idsB := seedPhase97MatchJob(t, ctx, pool, prefixB, 3, "queued", 0, nil)
		lifecycle := newTestMatchJobLifecycle(pool, time.Date(2026, 5, 16, 12, 0, 0, 0, time.UTC), "lease:go:wrong-job")
		claimed, err := lifecycle.claimNextMatchJob(ctx, claimMatchJobInput{WorkerID: "worker:go:wrong-job"})
		if err != nil {
			t.Fatal(err)
		}
		if claimed.JobID != idsA.jobID {
			t.Fatalf("expected first seeded job to be claimed, got %s", claimed.JobID)
		}
		service := newMatchCompletionService(pool)
		if _, err := service.completeMatch(ctx, completeMatchInput{
			JobID:      claimed.JobID,
			LeaseToken: claimed.LeaseToken,
			Chronicle:  completionChronicleForTest(idsB.matchID),
			FinalState: completionFinalStateForTest(idsB.matchID),
		}); err == nil {
			t.Fatal("expected wrong-job lease completion to fail")
		}
		assertPhase97MatchStatus(t, ctx, pool, idsB.matchID, "pending")
	})

	t.Run("rejects outcome drift between final state and Chronicle", func(t *testing.T) {
		prefix := "phase99-outcome-drift"
		cleanupPhase97Rows(t, ctx, pool, prefix)
		defer cleanupPhase97Rows(t, ctx, pool, prefix)
		ids := seedPhase97MatchJob(t, ctx, pool, prefix, 3, "queued", 0, nil)
		lifecycle := newTestMatchJobLifecycle(pool, time.Date(2026, 5, 16, 12, 0, 0, 0, time.UTC), "lease:go:outcome-drift")
		claimed, err := lifecycle.claimNextMatchJob(ctx, claimMatchJobInput{WorkerID: "worker:go:outcome-drift"})
		if err != nil {
			t.Fatal(err)
		}
		chronicle := completionChronicleForTest(ids.matchID)
		snapshots := chronicle["snapshots"].([]any)
		snapshots[1].(map[string]any)["outcome"] = map[string]any{"type": "WIN", "winnerPlayerId": "player:top:" + strings.TrimPrefix(ids.matchID, "match:")}
		service := newMatchCompletionService(pool)
		if _, err := service.completeMatch(ctx, completeMatchInput{
			JobID:      claimed.JobID,
			LeaseToken: claimed.LeaseToken,
			Chronicle:  chronicle,
			FinalState: completionFinalStateForTest(ids.matchID),
		}); err == nil {
			t.Fatal("expected outcome drift to fail")
		}
		assertPhase97Job(t, ctx, pool, ids.jobID, "running", 1, "worker:go:outcome-drift", "lease:go:outcome-drift")
	})
}

func completionFinalStateForTest(matchID string) map[string]any {
	suffix := strings.TrimPrefix(matchID, "match:")
	bottomPlayerID := "player:bottom:" + suffix
	topPlayerID := "player:top:" + suffix
	return map[string]any{
		"matchId":         matchID,
		"seed":            "seed:" + matchID,
		"phaseNumber":     2,
		"roundNumber":     3,
		"activationCount": 4,
		"players": []any{
			map[string]any{"id": bottomPlayerID, "side": "bottom", "strategyRevisionId": "strategy-revision:" + suffix, "strategyMemory": map[string]any{}},
			map[string]any{"id": topPlayerID, "side": "top", "strategyRevisionId": "strategy-revision:" + suffix, "strategyMemory": map[string]any{}},
		},
		"soldiers": []any{
			map[string]any{"id": "soldier:bottom:" + suffix, "ownerPlayerId": bottomPlayerID, "status": "ACTIVE"},
			map[string]any{"id": "soldier:top:" + suffix, "ownerPlayerId": topPlayerID, "status": "FALLEN"},
		},
		"outcome": map[string]any{"type": "WIN", "winnerPlayerId": bottomPlayerID},
	}
}

func completionChronicleForTest(matchID string) map[string]any {
	suffix := strings.TrimPrefix(matchID, "match:")
	bottomPlayerID := "player:bottom:" + suffix
	topPlayerID := "player:top:" + suffix
	board := map[string]any{
		"bounds": map[string]any{"minX": 0, "maxX": 4, "minY": 0, "maxY": 4},
		"soldiers": []any{
			map[string]any{"id": "soldier:bottom:" + suffix, "ownerPlayerId": bottomPlayerID, "status": "ACTIVE", "position": map[string]any{"x": 1, "y": 3}},
			map[string]any{"id": "soldier:top:" + suffix, "ownerPlayerId": topPlayerID, "status": "FALLEN", "position": map[string]any{"x": 3, "y": 1}},
		},
		"terrainStones": []any{
			map[string]any{"x": 2, "y": 2},
		},
	}
	return map[string]any{
		"schemaVersion": "chronicle-v1.4",
		"reproducibility": map[string]any{
			"matchId":             matchID,
			"seed":                "seed:" + matchID,
			"arenaVariantId":      "arena:" + suffix,
			"arenaVariantVersion": "arena-v1",
			"strategyRevisionIds": []any{"strategy-revision:" + suffix, "strategy-revision:" + suffix},
			"versions":            map[string]any{"spec": "cowards-rules-v1.4", "engine": "0.1.4", "runtimeJs": "0.1.0", "chronicle": "chronicle-v1.4", "strategyRevision": "0.1.0", "arenaVariant": "arena-v1"},
		},
		"events": []any{
			map[string]any{"type": "MATCH_STARTED", "sequence": 0, "context": map[string]any{}, "privacy": "public", "payload": map[string]any{"matchId": matchID}},
			map[string]any{"type": "STRATEGY_EVALUATED", "sequence": 1, "context": map[string]any{"actingPlayerId": bottomPlayerID}, "privacy": "private", "privateRef": "private:event:1", "payload": map[string]any{"playerId": bottomPlayerID}},
			map[string]any{"type": "STRATEGY_EVALUATED", "sequence": 2, "context": map[string]any{"actingPlayerId": topPlayerID}, "privacy": "private", "privateRef": "private:event:2", "payload": map[string]any{"playerId": topPlayerID}},
			map[string]any{"type": "MATCH_ENDED", "sequence": 3, "context": map[string]any{}, "privacy": "public", "payload": map[string]any{"type": "WIN", "winnerPlayerId": bottomPlayerID}},
		},
		"snapshots": []any{
			map[string]any{"kind": "MATCH_START", "sequence": 0, "context": map[string]any{}, "board": board},
			map[string]any{"kind": "TERMINAL", "sequence": 3, "context": map[string]any{}, "outcome": map[string]any{"type": "WIN", "winnerPlayerId": bottomPlayerID}, "board": board},
		},
	}
}

func assertChronicleExists(t *testing.T, ctx context.Context, pool *pgxpool.Pool, matchID string) {
	t.Helper()
	var count int
	if err := pool.QueryRow(ctx, "select count(*) from chronicles where match_id = $1", matchID).Scan(&count); err != nil {
		t.Fatal(err)
	}
	if count != 1 {
		t.Fatalf("expected one Chronicle, got %d", count)
	}
}

func decodeJSONMapForCompletion(t *testing.T, bytes []byte) map[string]any {
	t.Helper()
	var value map[string]any
	if err := json.Unmarshal(bytes, &value); err != nil {
		t.Fatal(err)
	}
	return value
}
