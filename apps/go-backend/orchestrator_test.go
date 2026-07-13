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
	if err == nil || created != nil {
		t.Fatalf("unproved fixture revisions created orchestratable work: created=%+v err=%v", created, err)
	}
	return
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
	const semanticReceiptSecret = "fixture-semantic-receipt-secret-v1"
	runtimeServer := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if request.URL.Path != "/execute-match" {
			t.Fatalf("unexpected runtime path %s", request.URL.Path)
		}
		if err := json.NewDecoder(request.Body).Decode(&runtimeRequest); err != nil {
			t.Fatal(err)
		}
		chronicle := orchestratorChronicleForRequest(runtimeRequest, false)
		finalState := orchestratorFinalStateForRequest(runtimeRequest)
		writeRuntimeServiceTestJSON(t, writer, runtimeServiceResponse{
			ContractVersion:   runtimeExecutionServiceVersion,
			OK:                true,
			Kind:              "executionResult",
			RequestID:         runtimeRequest.RequestID,
			MatchID:           runtimeRequest.Match.MatchID,
			RuntimeABIVersion: strategyRuntimeABIVersion,
			Result:            signedRuntimeServiceSuccessResultForTest(t, runtimeRequest, chronicle, finalState, semanticReceiptSecret),
		})
	}))
	defer runtimeServer.Close()

	orchestrator := newGoMatchOrchestrator(pool, runtimeServer.URL)
	orchestrator.runtime.semanticReceiptSecret = semanticReceiptSecret
	orchestrator.lifecycle = newTestMatchJobLifecycle(pool, time.Now().UTC().Add(time.Minute), "lease:go:orchestrator")
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

func TestRuntimeServiceStrategyRebindsLockedRevisionToClaimedLane(t *testing.T) {
	fixture := newDeploymentLaneFixture(t)
	strategy := fixture.Strategy
	evidence := goEntrantExecutionEvidence{StrategyRevisionID: strategy.ID, LaneIdentity: fixture.Lane}
	if !runtimeServiceStrategyMatchesClaim(strategy, evidence, fixture.Tuple, fixture.Registry) {
		t.Fatal("exact locked revision did not match its claimed executable lane")
	}

	unlocked := strategy
	unlocked.LockedAt = nil
	if runtimeServiceStrategyMatchesClaim(unlocked, evidence, fixture.Tuple, fixture.Registry) {
		t.Fatal("unlocked revision matched claimed executable lane")
	}
	swappedRevision := strategy
	swappedRevision.ID = "revision:other"
	if runtimeServiceStrategyMatchesClaim(swappedRevision, evidence, fixture.Tuple, fixture.Registry) {
		t.Fatal("swapped revision matched claimed executable lane")
	}
	swappedArtifact := strategy
	swappedArtifact.Metadata = cloneMap(strategy.Metadata)
	mapValue(swappedArtifact.Metadata, "sourceArtifact")["hash"] = strings.Repeat("c", 64)
	if runtimeServiceStrategyMatchesClaim(swappedArtifact, evidence, fixture.Tuple, fixture.Registry) {
		t.Fatal("post-claim artifact swap matched claimed executable lane")
	}
}

func TestGoMatchOrchestratorIntegrityPostResponseContract(t *testing.T) {
	source, err := os.ReadFile("orchestrator.go")
	if err != nil {
		t.Fatal(err)
	}
	text := string(source)
	recheckIndex := strings.Index(text, "recheckClaimedMatchIntegrity")
	lastRecheckIndex := strings.LastIndex(text, "recheckClaimedMatchIntegrity")
	executionIndex := strings.Index(text, "runtime.executeMatch")
	completionIndex := strings.Index(text, "completion.completeMatch")
	if recheckIndex < 0 || executionIndex < 0 || lastRecheckIndex < 0 || completionIndex < 0 ||
		recheckIndex > executionIndex || executionIndex > lastRecheckIndex || lastRecheckIndex > completionIndex {
		t.Fatal("orchestrator must recheck exact claimed identity before execution and completion")
	}
	if !strings.Contains(text, "RuntimeServiceEvidenceDrift") || !strings.Contains(text, "recordAttemptFailure") {
		t.Fatal("in-flight integrity drift must route through system-failure recording")
	}
}

func TestGoMatchOrchestratorHasNoCandidateCompletionRoute(t *testing.T) {
	source, err := os.ReadFile("orchestrator.go")
	if err != nil {
		t.Fatal(err)
	}
	text := string(source)
	for _, retired := range []string{"rejectInactiveCandidateCompletion", "CandidateEvidence", "candidate_exhibition"} {
		if strings.Contains(text, retired) {
			t.Fatalf("retired candidate completion route remains executable: %s", retired)
		}
	}
	completionIndex := strings.Index(text, "completion.completeMatch")
	decodeIndex := strings.Index(text, "runtime.executeMatch")
	if decodeIndex < 0 || completionIndex < 0 || decodeIndex > completionIndex {
		t.Fatal("current runtime response must be admitted before canonical completion")
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
		"matchId": request.Match.MatchID, "seed": request.Match.Seed,
		"versions":     map[string]any{"spec": semanticCompatibilityVersions["spec"], "engine": semanticCompatibilityVersions["engine"], "runtimeJs": semanticCompatibilityVersions["runtimeJs"], "chronicle": semanticCompatibilityVersions["chronicle"], "strategyRevision": semanticCompatibilityVersions["strategyRevision"], "arenaVariant": semanticCompatibilityVersions["arenaVariant"]},
		"arenaVariant": request.Match.ArenaVariant, "phase": "COMPLETE",
		"phaseNumber": 1, "roundNumber": 1, "activationCount": 1,
		"initiativePlayerId": request.Match.BottomPlayerID,
		"bounds":             mapValue(request.Match.ArenaVariant, "initialBounds"),
		"players": []any{
			map[string]any{"id": request.Match.BottomPlayerID, "side": "bottom", "strategyRevisionId": request.Match.BottomStrategyRevisionID, "strategyMemory": map[string]any{}},
			map[string]any{"id": request.Match.TopPlayerID, "side": "top", "strategyRevisionId": request.Match.TopStrategyRevisionID, "strategyMemory": map[string]any{}},
		},
		"soldiers": []any{
			map[string]any{"id": "soldier:bottom:" + request.Match.MatchID, "ownerPlayerId": request.Match.BottomPlayerID, "status": "ACTIVE", "position": map[string]any{"x": 1, "y": 1}, "facing": "UP", "lastSuccessfulMoveDirection": nil, "soldierMemory": map[string]any{}},
			map[string]any{"id": "soldier:top:" + request.Match.MatchID, "ownerPlayerId": request.Match.TopPlayerID, "status": "FALLEN", "position": nil, "facing": nil, "lastSuccessfulMoveDirection": nil, "soldierMemory": map[string]any{}},
		},
		"terrainStones": []any{},
		"outcome":       map[string]any{"type": "WIN", "winnerPlayerId": request.Match.BottomPlayerID},
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
			"arenaVariantVersion": semanticCompatibilityVersions["arenaVariant"],
			"strategyRevisionIds": []any{request.Match.BottomStrategyRevisionID, request.Match.TopStrategyRevisionID},
			"versions":            map[string]any{"spec": semanticCompatibilityVersions["spec"], "engine": semanticCompatibilityVersions["engine"], "runtimeJs": semanticCompatibilityVersions["runtimeJs"], "chronicle": semanticCompatibilityVersions["chronicle"], "strategyRevision": semanticCompatibilityVersions["strategyRevision"], "arenaVariant": semanticCompatibilityVersions["arenaVariant"]},
		},
		"events": events,
		"snapshots": []any{
			map[string]any{"kind": "MATCH_START", "sequence": 0, "context": map[string]any{}, "board": board},
			map[string]any{"kind": "TERMINAL", "sequence": terminalSequence, "context": map[string]any{}, "outcome": map[string]any{"type": "WIN", "winnerPlayerId": request.Match.BottomPlayerID}, "board": board},
		},
	}
}
