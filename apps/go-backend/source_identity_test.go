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

func TestPhase258SourceIdentityPostgres(t *testing.T) {
	databaseURL := os.Getenv("COWARDS_GO_BACKEND_TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Fatal("COWARDS_GO_BACKEND_TEST_DATABASE_URL is required; this proof must not skip")
	}
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil { t.Fatal(err) }
	defer pool.Close()
	if err := ensurePersistenceSchema(ctx, pool); err != nil { t.Fatal(err) }

	userID := "user:phase258-source-identity"
	_, _ = pool.Exec(ctx, "delete from strategy_revisions where strategy_id in (select id from strategies where owner_user_id=$1)", userID)
	_, _ = pool.Exec(ctx, "delete from strategies where owner_user_id=$1", userID)
	_, _ = pool.Exec(ctx, "delete from user_sessions where user_id=$1", userID)
	_, _ = pool.Exec(ctx, "delete from users where id=$1", userID)
	defer func() {
		_, _ = pool.Exec(ctx, "delete from strategy_revisions where strategy_id in (select id from strategies where owner_user_id=$1)", userID)
		_, _ = pool.Exec(ctx, "delete from strategies where owner_user_id=$1", userID)
		_, _ = pool.Exec(ctx, "delete from user_sessions where user_id=$1", userID)
		_, _ = pool.Exec(ctx, "delete from users where id=$1", userID)
	}()
	if _, err := pool.Exec(ctx, "insert into users (id, username, handle, display_name, metadata) values ($1,'phase258source','phase258source','Phase 258','{}'::jsonb)", userID); err != nil { t.Fatal(err) }

	runtimeServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var body map[string]any
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil { t.Fatal(err) }
		source := body["source"].(string)
		writeRuntimeServiceTestJSON(t, w, runtimeServiceValidationResponse{
			OK: true, Kind: "strategyValidation", SourceFormat: "typescript",
			Runtime: defaultRuntimeMetadata(), EngineCompatibility: engineCompatibility(),
			Validation: validateSourceMetadata(source), SourceHash: hashString(source), SourceBytes: len([]byte(source)),
			Metadata: map[string]any{},
		})
	}))
	defer runtimeServer.Close()
	server := &LiveServer{pool: pool, now: func() time.Time { return time.Date(2026,7,14,12,0,0,0,time.UTC) }, strategyArtifacts: map[string]strategyArtifact{}, orchestrator: newGoMatchOrchestrator(pool, runtimeServer.URL)}
	token, err := server.createSessionToken(ctx, userID)
	if err != nil { t.Fatal(err) }

	vectors := []string{"a\nb\n", "a\r\nb\r\n", "a\rb\r", "a\r\nb\nc\r", "a\nb", "\ufeffa\r\n"}
	for i, source := range vectors {
		body, _ := json.Marshal(map[string]any{"source": source, "sourceFormat": "typescript", "label": "vector"})
		req := httptest.NewRequest(http.MethodPost, "/account/strategy-revisions", bytes.NewReader(body))
		req.Header.Set("authorization", "Bearer "+token)
		rec := httptest.NewRecorder()
		server.routes().ServeHTTP(rec, req)
		if rec.Code != http.StatusCreated { t.Fatalf("vector %d status %d: %s", i, rec.Code, rec.Body.String()) }
		var response map[string]any
		if err := json.Unmarshal(rec.Body.Bytes(), &response); err != nil { t.Fatal(err) }
		revisionID := stringValue(response, "strategyRevisionId")
		var stored string
		var hexBytes, version, originalHash, normalizedHash, policy string
		var originalBytes, normalizedBytes int
		var endingsRaw []byte
		var finalNewline bool
		if err := pool.QueryRow(ctx, `select source, encode(convert_to(source,'UTF8'),'hex'), source_identity_version, original_source_hash, original_source_bytes, normalized_source_hash, normalized_source_bytes, source_normalization_policy, source_line_endings, source_has_final_newline from strategy_revisions where id=$1`, revisionID).Scan(&stored,&hexBytes,&version,&originalHash,&originalBytes,&normalizedHash,&normalizedBytes,&policy,&endingsRaw,&finalNewline); err != nil { t.Fatal(err) }
		if stored != source || hexBytes != strings.ToLower(string(byteToHex([]byte(source)))) { t.Fatalf("vector %d bytes changed", i) }
		if version != sourceIdentityVersionV2 || policy != sourceNormalizationPolicyV117 || originalHash == "" || normalizedHash == "" || originalBytes != len([]byte(source)) { t.Fatalf("vector %d incomplete identity", i) }
		if normalizedBytes != len([]byte(normalizeSourceV117(source))) { t.Fatalf("vector %d normalized byte count mismatch", i) }
		if len(endingsRaw) == 0 || finalNewline != strings.HasSuffix(source, "\n") && finalNewline != strings.HasSuffix(source, "\r") { t.Fatalf("vector %d facts mismatch", i) }
	}
}

func byteToHex(value []byte) []byte {
	const digits = "0123456789abcdef"
	out := make([]byte, len(value)*2)
	for i, b := range value { out[i*2] = digits[b>>4]; out[i*2+1] = digits[b&15] }
	return out
}
