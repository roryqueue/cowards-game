package main

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func TestGoMatchOrchestratorIntegration(t *testing.T) {
	databaseURL := os.Getenv("COWARDS_GO_BACKEND_TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("set COWARDS_GO_BACKEND_TEST_DATABASE_URL for Go orchestrator integration tests")
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

	prefix := "phase102-orchestrator"
	cleanupPhase102ExhibitionRows(t, ctx, pool, prefix, "user:"+prefix)
	userID, revisionIDs := seedPhase102OwnedRevisions(t, ctx, pool, prefix)
	defer cleanupPhase102ExhibitionRows(t, ctx, pool, prefix, userID)

	liveServer := &LiveServer{
		pool:              pool,
		now:               func() time.Time { return time.Date(2026, 5, 24, 1, 20, 0, 0, time.UTC) },
		strategyArtifacts: map[string]strategyArtifact{},
	}
	created, err := liveServer.createExhibitionMatchSet(ctx, userID, "smoke-exhibition-v1", revisionIDs, true)
	if err != nil {
		t.Fatal(err)
	}
	matchSetID := stringValue(created, "matchSetId")
	rows, err := pool.Query(ctx, `
		select match_id
		from match_set_matches
		where match_set_id = $1
		order by matrix_index asc
	`, matchSetID)
	if err != nil {
		t.Fatal(err)
	}
	defer rows.Close()
	matchIDs := []string{}
	for rows.Next() {
		var matchID string
		if err := rows.Scan(&matchID); err != nil {
			t.Fatal(err)
		}
		matchIDs = append(matchIDs, matchID)
	}
	if err := rows.Err(); err != nil {
		t.Fatal(err)
	}
	if len(matchIDs) == 0 {
		t.Fatal("expected created exhibition to have Matches")
	}

	var runtimeRequest runtimeServiceRequest
	runtimeServer := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if request.URL.Path != "/execute-match" {
			t.Fatalf("unexpected runtime path %s", request.URL.Path)
		}
		if err := json.NewDecoder(request.Body).Decode(&runtimeRequest); err != nil {
			t.Fatal(err)
		}
		writeRuntimeServiceTestJSON(t, writer, runtimeServiceResponse{
			ContractVersion:   runtimeExecutionServiceVersion,
			OK:                true,
			Kind:              "executionResult",
			RequestID:         runtimeRequest.RequestID,
			MatchID:           runtimeRequest.Match.MatchID,
			RuntimeABIVersion: strategyRuntimeABIVersion,
			Result: map[string]any{
				"privacy":                    "internal_runtime_result",
				"chronicle":                  orchestratorChronicleForRequest(runtimeRequest, false),
				"finalState":                 orchestratorFinalStateForRequest(runtimeRequest),
				"runtimeViolationEventCount": 0,
			},
		})
	}))
	defer runtimeServer.Close()

	orchestrator := newGoMatchOrchestrator(pool, runtimeServer.URL)
	orchestrator.lifecycle = newTestMatchJobLifecycle(pool, time.Date(2026, 5, 25, 1, 20, 0, 0, time.UTC), "lease:go:orchestrator")
	for _, matchID := range matchIDs {
		result, err := orchestrator.runOnce(ctx, []string{matchID})
		if err != nil {
			t.Fatal(err)
		}
		if result.Status != "complete" || result.MatchID != matchID || result.ChronicleID == "" {
			t.Fatalf("unexpected orchestration result: %+v", result)
		}
		if runtimeRequest.Match.MatchID != matchID {
			t.Fatalf("runtime service was not called with claimed Match: %+v", runtimeRequest.Match)
		}
		assertChronicleExists(t, ctx, pool, matchID)
	}
	assertPhase100MatchSetStored(t, ctx, pool, matchSetID, matchSetStatusComplete, false, true)
	evidence, err := liveServer.publicReplayEvidenceResult(ctx, matchIDs[0])
	if err != nil {
		t.Fatal(err)
	}
	if evidence == nil || stringValue(evidence, "kind") != "publicReplayEvidence" {
		t.Fatalf("expected Go public replay evidence after orchestration, got %+v", evidence)
	}
	evidenceBytes, err := json.Marshal(evidence)
	if err != nil {
		t.Fatal(err)
	}
	if text := string(evidenceBytes); strings.Contains(text, "ownerPrivate") {
		t.Fatalf("public replay evidence leaked owner-private projection: %s", text)
	}
}

func TestMatchJobLeaseForRuntimeServiceBudget(t *testing.T) {
	t.Setenv("COWARDS_RUNTIME_SERVICE_HTTP_TIMEOUT_MS", "90000")
	if got := matchJobLeaseForRuntimeService(); got != 95*time.Second {
		t.Fatalf("expected runtime-service lease to cover HTTP timeout plus grace, got %s", got)
	}

	t.Setenv("COWARDS_RUNTIME_SERVICE_HTTP_TIMEOUT_MS", "1000")
	if got := matchJobLeaseForRuntimeService(); got != defaultMatchJobLease {
		t.Fatalf("expected runtime-service lease to preserve default minimum, got %s", got)
	}
}

func TestStrategyFailureRevisionIDFromChronicle(t *testing.T) {
	artifact, err := json.Marshal(map[string]any{
		"events": []any{
			map[string]any{
				"type":    "RUNTIME_VIOLATION",
				"context": map[string]any{"actingPlayerId": "player:top"},
				"payload": map[string]any{"type": "INVALID_OUTPUT"},
			},
		},
	})
	if err != nil {
		t.Fatal(err)
	}
	failed := strategyFailureRevisionIDFromChronicle(
		artifact,
		"player:bottom",
		"player:top",
		"strategy-revision:bottom",
		"strategy-revision:top",
	)
	if failed == nil || *failed != "strategy-revision:top" {
		t.Fatalf("expected top strategy failure, got %+v", failed)
	}
}

func orchestratorFinalStateForRequest(request runtimeServiceRequest) map[string]any {
	return map[string]any{
		"matchId":         request.Match.MatchID,
		"seed":            request.Match.Seed,
		"phaseNumber":     1,
		"roundNumber":     1,
		"activationCount": 1,
		"players": []any{
			map[string]any{"id": request.Match.BottomPlayerID, "side": "bottom", "strategyRevisionId": request.Match.BottomStrategyRevisionID, "strategyMemory": map[string]any{}},
			map[string]any{"id": request.Match.TopPlayerID, "side": "top", "strategyRevisionId": request.Match.TopStrategyRevisionID, "strategyMemory": map[string]any{}},
		},
		"soldiers": []any{
			map[string]any{"id": "soldier:bottom:" + request.Match.MatchID, "ownerPlayerId": request.Match.BottomPlayerID, "status": "ACTIVE"},
			map[string]any{"id": "soldier:top:" + request.Match.MatchID, "ownerPlayerId": request.Match.TopPlayerID, "status": "FALLEN"},
		},
		"outcome": map[string]any{"type": "WIN", "winnerPlayerId": request.Match.BottomPlayerID},
	}
}

func orchestratorChronicleForRequest(request runtimeServiceRequest, includeRuntimeViolation bool) map[string]any {
	board := map[string]any{
		"bounds": mapValue(request.Match.ArenaVariant, "initialBounds"),
		"soldiers": []any{
			map[string]any{"id": "soldier:bottom:" + request.Match.MatchID, "ownerPlayerId": request.Match.BottomPlayerID, "status": "ACTIVE", "position": map[string]any{"x": 1, "y": 1}},
			map[string]any{"id": "soldier:top:" + request.Match.MatchID, "ownerPlayerId": request.Match.TopPlayerID, "status": "FALLEN", "position": map[string]any{"x": 2, "y": 2}},
		},
		"terrainStones": []any{},
	}
	events := []any{
		map[string]any{"type": "MATCH_STARTED", "sequence": 0, "context": map[string]any{}, "privacy": "public", "payload": map[string]any{"matchId": request.Match.MatchID, "seed": request.Match.Seed}},
		map[string]any{"type": "STRATEGY_EVALUATED", "sequence": 1, "context": map[string]any{"actingPlayerId": request.Match.BottomPlayerID}, "privacy": "private", "privateRef": "private:event:1", "payload": map[string]any{"playerId": request.Match.BottomPlayerID}},
		map[string]any{"type": "STRATEGY_EVALUATED", "sequence": 2, "context": map[string]any{"actingPlayerId": request.Match.TopPlayerID}, "privacy": "private", "privateRef": "private:event:2", "payload": map[string]any{"playerId": request.Match.TopPlayerID}},
	}
	terminalSequence := 3
	if includeRuntimeViolation {
		events = append(events, map[string]any{"type": "RUNTIME_VIOLATION", "sequence": 3, "context": map[string]any{"actingPlayerId": request.Match.TopPlayerID}, "privacy": "owner", "payload": map[string]any{"playerId": request.Match.TopPlayerID, "type": "INVALID_OUTPUT"}})
		terminalSequence = 4
	}
	events = append(events, map[string]any{"type": "MATCH_ENDED", "sequence": terminalSequence, "context": map[string]any{}, "privacy": "public", "payload": map[string]any{"type": "WIN", "winnerPlayerId": request.Match.BottomPlayerID}})
	return map[string]any{
		"schemaVersion": "chronicle-v1.4",
		"reproducibility": map[string]any{
			"matchId":             request.Match.MatchID,
			"seed":                request.Match.Seed,
			"arenaVariantId":      stringValue(request.Match.ArenaVariant, "id"),
			"arenaVariantVersion": "arena-v1",
			"strategyRevisionIds": []any{request.Match.BottomStrategyRevisionID, request.Match.TopStrategyRevisionID},
			"versions":            map[string]any{"spec": "cowards-rules-v1.4", "engine": "0.1.4", "runtimeJs": "0.1.0", "chronicle": "chronicle-v1.4", "strategyRevision": "0.1.0", "arenaVariant": "arena-v1"},
		},
		"events": events,
		"snapshots": []any{
			map[string]any{"kind": "MATCH_START", "sequence": 0, "context": map[string]any{}, "board": board},
			map[string]any{"kind": "TERMINAL", "sequence": terminalSequence, "context": map[string]any{}, "outcome": map[string]any{"type": "WIN", "winnerPlayerId": request.Match.BottomPlayerID}, "board": board},
		},
	}
}
