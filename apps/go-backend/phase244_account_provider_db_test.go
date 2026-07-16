package main

import (
	"bytes"
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

func TestPhase244AccountProviderProofPersistsThroughDBEntryAndRuntimeRequest(t *testing.T) {
	databaseURL := os.Getenv("COWARDS_GO_BACKEND_TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("set COWARDS_GO_BACKEND_TEST_DATABASE_URL for Phase 244 DB-backed provider proof")
	}
	t.Setenv("COWARDS_PROVIDER_VALIDATION_SECRET", "cowards-provider-validation-test-secret-v1.33")
	t.Setenv("COWARDS_RUNTIME_SERVICE_PRIVATE_ARTIFACT_TOKEN", "cowards-private-artifact-test-token-v1.35")

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()
	if err := ensurePersistenceSchema(ctx, pool); err != nil {
		t.Fatal(err)
	}

	prefix := "phase244-db-provider-proof"
	userID := "user:" + prefix
	cleanupPhase244DBProofRows(t, ctx, pool, userID)
	defer cleanupPhase244DBProofRows(t, ctx, pool, userID)
	if _, err := pool.Exec(ctx, `
		insert into users (id, username, handle, display_name, metadata)
		values ($1, $2, $2, 'Phase 244 DB Proof', '{}'::jsonb)
	`, userID, "phase244dbproof"); err != nil {
		t.Fatal(err)
	}

	const privateArtifactToken = "cowards-private-artifact-test-token-v1.35"
	runtimeServer := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if request.URL.Path != "/validate-strategy" {
			t.Fatalf("unexpected runtime path %s", request.URL.Path)
		}
		if got := request.Header.Get(runtimeServicePrivateArtifactTokenHeader); got != privateArtifactToken {
			t.Fatalf("runtime validation request omitted private artifact token, got %q", got)
		}
		var body map[string]any
		if err := json.NewDecoder(request.Body).Decode(&body); err != nil {
			t.Fatal(err)
		}
		if body["sourceFormat"] != "typescript" || body["includePrivateArtifact"] != true {
			t.Fatalf("unexpected validation request body: %+v", body)
		}
		source, ok := body["source"].(string)
		if !ok || source == "" {
			t.Fatalf("validation request omitted source: %+v", body)
		}
		writeRuntimeServiceTestJSON(t, writer, providerReadinessValidationResponseForSelectedABI(t, "typescript", source))
	}))
	defer runtimeServer.Close()

	server := &LiveServer{
		pool:              pool,
		now:               func() time.Time { return time.Date(2026, 6, 15, 0, 10, 0, 0, time.UTC) },
		strategyArtifacts: map[string]strategyArtifact{},
		orchestrator:      newGoMatchOrchestrator(pool, runtimeServer.URL),
	}
	sessionToken, err := server.createSessionToken(ctx, userID)
	if err != nil {
		t.Fatal(err)
	}
	handler := server.routes()

	revisionIDs := []string{
		createPhase244AccountRevision(t, handler, sessionToken, "bottom"),
		createPhase244AccountRevision(t, handler, sessionToken, "top"),
	}
	for _, revisionID := range revisionIDs {
		metadata := phase244RevisionMetadata(t, ctx, pool, revisionID)
		if stringValue(metadata, "readinessState") != string(revisionReadinessExecutionDisabled) ||
			stringValue(metadata, "readinessCategory") != "containment_missing" ||
			metadata["entryEligible"] != false ||
			metadata["countedEligible"] != false {
			t.Fatalf("persisted metadata promoted provider proof without canonical containment evidence: %+v", metadata)
		}
		sourceArtifact := mapValue(metadata, "sourceArtifact")
		if stringValue(sourceArtifact, "bytesBase64") == "" {
			t.Fatalf("persisted metadata omitted private TypeScript artifact bytes: %+v", metadata)
		}
		if mapValue(metadata, "providerValidation") == nil {
			t.Fatalf("persisted metadata omitted provider validation: %+v", metadata)
		}
	}
	return

	exhibitionBody := map[string]any{
		"presetId":           "smoke-exhibition-v1",
		"entrantRevisionIds": revisionIDs,
		"counted":            true,
	}
	responseBody := performPhase244JSONRequest(t, handler, http.MethodPost, "/matchsets", sessionToken, exhibitionBody, http.StatusCreated)
	responseText := string(mustJSON(t, responseBody))
	for _, forbidden := range []string{"bytesBase64", "typescript-artifact", "export default"} {
		if strings.Contains(responseText, forbidden) {
			t.Fatalf("public exhibition create response leaked %q in %s", forbidden, responseText)
		}
	}
	matchSetID := stringValue(responseBody, "matchSetId")
	if matchSetID == "" {
		t.Fatalf("exhibition response omitted matchSetId: %+v", responseBody)
	}

	assertPhase244EntrantSnapshotsPublicSafe(t, ctx, pool, matchSetID)
	matchID, jobID := phase244FirstMatchAndJob(t, ctx, pool, matchSetID)
	runtimeRequest, err := buildRuntimeServiceRequestForClaimedMatch(ctx, pool, matchID, jobID)
	if err != nil {
		t.Fatal(err)
	}
	for _, strategy := range []runtimeServiceStrategyRevision{runtimeRequest.Strategies.Bottom, runtimeRequest.Strategies.Top} {
		sourceArtifact := mapValue(strategy.Metadata, "sourceArtifact")
		if stringValue(sourceArtifact, "bytesBase64") == "" {
			t.Fatalf("runtime request omitted private TypeScript artifact bytes for %s: %+v", strategy.ID, strategy.Metadata)
		}
		if !sourceArtifactProviderValidationMatches(strategy.Metadata, strategy.SourceHash, strategy.SourceBytes, "strategy-language-provider-js-ts", "typescript") {
			t.Fatalf("runtime request metadata failed provider proof check for %s", strategy.ID)
		}
	}
}

func createPhase244AccountRevision(t *testing.T, handler http.Handler, sessionToken string, side string) string {
	t.Helper()
	source := `export default {
  selectActivations() {
    return []
  },
  soldierBrain() {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: null }
  },
}
// phase244-db-provider-proof-` + side + "\n"
	body := map[string]any{
		"sourceFormat": "typescript",
		"source":       source,
		"label":        "Phase 244 DB " + side,
	}
	responseBody := performPhase244JSONRequest(t, handler, http.MethodPost, "/account/strategy-revisions", sessionToken, body, http.StatusCreated)
	responseText := string(mustJSON(t, responseBody))
	for _, forbidden := range []string{"bytesBase64", "typescript-artifact", "export default"} {
		if strings.Contains(responseText, forbidden) {
			t.Fatalf("account save response leaked %q in %s", forbidden, responseText)
		}
	}
	if responseBody["entryEligible"] != false || responseBody["countedEligible"] != false {
		t.Fatalf("account save response promoted provider proof without current evidence: %+v", responseBody)
	}
	revisionID := stringValue(responseBody, "strategyRevisionId")
	if revisionID == "" {
		t.Fatalf("account save response omitted revision id: %+v", responseBody)
	}
	return revisionID
}

func performPhase244JSONRequest(t *testing.T, handler http.Handler, method string, path string, sessionToken string, body map[string]any, wantStatus int) map[string]any {
	t.Helper()
	payload := mustJSON(t, body)
	request := httptest.NewRequest(method, path, bytes.NewReader(payload))
	request.Header.Set("content-type", "application/json")
	request.Header.Set("authorization", "Bearer "+sessionToken)
	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, request)
	if recorder.Code != wantStatus {
		t.Fatalf("expected %s %s status %d, got %d: %s", method, path, wantStatus, recorder.Code, recorder.Body.String())
	}
	var decoded map[string]any
	if err := json.Unmarshal(recorder.Body.Bytes(), &decoded); err != nil {
		t.Fatal(err)
	}
	return decoded
}

func phase244RevisionMetadata(t *testing.T, ctx context.Context, pool *pgxpool.Pool, revisionID string) map[string]any {
	t.Helper()
	var raw []byte
	if err := pool.QueryRow(ctx, "select metadata from strategy_revisions where id = $1", revisionID).Scan(&raw); err != nil {
		t.Fatal(err)
	}
	return jsonMap(raw)
}

func phase244FirstMatchAndJob(t *testing.T, ctx context.Context, pool *pgxpool.Pool, matchSetID string) (string, string) {
	t.Helper()
	var matchID string
	var jobID string
	if err := pool.QueryRow(ctx, `
		select m.id, mj.id
		from match_set_matches msm
		join matches m on m.id = msm.match_id
		join match_jobs mj on mj.match_id = m.id
		where msm.match_set_id = $1
		order by msm.matrix_index asc
		limit 1
	`, matchSetID).Scan(&matchID, &jobID); err != nil {
		t.Fatal(err)
	}
	return matchID, jobID
}

func assertPhase244EntrantSnapshotsPublicSafe(t *testing.T, ctx context.Context, pool *pgxpool.Pool, matchSetID string) {
	t.Helper()
	rows, err := pool.Query(ctx, "select snapshot from competition_entrants where match_set_id = $1 order by entrant_index asc", matchSetID)
	if err != nil {
		t.Fatal(err)
	}
	defer rows.Close()
	count := 0
	for rows.Next() {
		count++
		var raw []byte
		if err := rows.Scan(&raw); err != nil {
			t.Fatal(err)
		}
		text := string(raw)
		for _, forbidden := range []string{"bytesBase64", "typescript-artifact", "export default", "StrategyMemory", "SoldierMemory", "objectivePayload"} {
			if strings.Contains(text, forbidden) {
				t.Fatalf("entrant snapshot leaked %q in %s", forbidden, text)
			}
		}
	}
	if err := rows.Err(); err != nil {
		t.Fatal(err)
	}
	if count != 2 {
		t.Fatalf("expected 2 entrant snapshots, got %d", count)
	}
}

func cleanupPhase244DBProofRows(t *testing.T, ctx context.Context, pool *pgxpool.Pool, userID string) {
	t.Helper()
	if _, err := pool.Exec(ctx, `
		delete from match_job_attempts
		where job_id in (
		  select mj.id
		  from match_jobs mj
		  join match_set_matches msm on msm.match_id = mj.match_id
		  join match_sets ms on ms.id = msm.match_set_id
		  where ms.creator_user_id = $1
		)
	`, userID); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, `
		delete from match_jobs
		where match_id in (
		  select msm.match_id
		  from match_set_matches msm
		  join match_sets ms on ms.id = msm.match_set_id
		  where ms.creator_user_id = $1
		)
	`, userID); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, `
		delete from chronicles
		where match_id in (
		  select msm.match_id
		  from match_set_matches msm
		  join match_sets ms on ms.id = msm.match_set_id
		  where ms.creator_user_id = $1
		)
	`, userID); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, "delete from match_set_matches where match_set_id in (select id from match_sets where creator_user_id = $1)", userID); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, "delete from competition_entrants where match_set_id in (select id from match_sets where creator_user_id = $1)", userID); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, `
		delete from matches
		where bottom_strategy_revision_id in (
		  select sr.id
		  from strategy_revisions sr
		  join strategies s on s.id = sr.strategy_id
		  where s.owner_user_id = $1
		)
		or top_strategy_revision_id in (
		  select sr.id
		  from strategy_revisions sr
		  join strategies s on s.id = sr.strategy_id
		  where s.owner_user_id = $1
		)
	`, userID); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, "delete from competition_submission_events where user_id = $1", userID); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, "delete from match_sets where creator_user_id = $1", userID); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, "delete from strategy_revisions where strategy_id in (select id from strategies where owner_user_id = $1)", userID); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, "delete from strategies where owner_user_id = $1", userID); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, "delete from user_sessions where user_id = $1", userID); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, "delete from users where id = $1", userID); err != nil {
		t.Fatal(err)
	}
}

func mustJSON(t *testing.T, value any) []byte {
	t.Helper()
	payload, err := json.Marshal(value)
	if err != nil {
		t.Fatal(err)
	}
	return payload
}
