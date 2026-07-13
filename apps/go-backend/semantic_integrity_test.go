package main

import (
	"context"
	"encoding/json"
	"os"
	"strings"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
)

type semanticIntegrityExpectedIssue struct {
	Code string `json:"code"`
}

type semanticIntegrityVector struct {
	ID       string                           `json:"id"`
	Scope    string                           `json:"scope"`
	Expected []semanticIntegrityExpectedIssue `json:"expected"`
}

type semanticIntegrityCorpus struct {
	Profile        string                    `json:"profile"`
	PublicCategory string                    `json:"publicCategory"`
	Ownership      string                    `json:"ownership"`
	FamilyOrder    []string                  `json:"familyOrder"`
	Vectors        []semanticIntegrityVector `json:"vectors"`
	MultiFault     struct {
		VectorIDs     []string `json:"vectorIds"`
		ExpectedCodes []string `json:"expectedCodes"`
	} `json:"multiFault"`
}

type semanticDatabaseSnapshot struct {
	Matches    int
	Jobs       int
	Attempts   int
	Chronicles int
	Results    int
	Standings  int
}

func loadSemanticIntegrityCorpus(t *testing.T) semanticIntegrityCorpus {
	t.Helper()
	bytes, err := os.ReadFile("../../packages/spec/src/fixtures/semantic-integrity-vectors.json")
	if err != nil {
		t.Fatal(err)
	}
	var corpus semanticIntegrityCorpus
	if err := json.Unmarshal(bytes, &corpus); err != nil {
		t.Fatal(err)
	}
	return corpus
}

func semanticDatabaseState(t *testing.T, ctx context.Context, pool *pgxpool.Pool) semanticDatabaseSnapshot {
	t.Helper()
	var state semanticDatabaseSnapshot
	err := pool.QueryRow(ctx, `
		select
		  (select count(*)::integer from matches),
		  (select count(*)::integer from match_jobs),
		  (select count(*)::integer from match_job_attempts),
		  (select count(*)::integer from chronicles),
		  (select count(*)::integer from result_flags),
		  (select count(*)::integer from trial_ladder_entries)
	`).Scan(&state.Matches, &state.Jobs, &state.Attempts, &state.Chronicles, &state.Results, &state.Standings)
	if err != nil {
		t.Fatal(err)
	}
	return state
}

func TestSemanticIntegrityMissingEnforcement(t *testing.T) {
	corpus := loadSemanticIntegrityCorpus(t)
	if corpus.Profile != "semantic-integrity-v1" || corpus.PublicCategory != "CANONICAL_INTEGRITY_FAILURE" || corpus.Ownership != "system_integrity" {
		t.Fatalf("unexpected semantic corpus identity: %+v", corpus)
	}
	expectedFamilies := []string{"TUPLE", "ARENA", "PLAYER", "SOLDIER", "POSITION", "LIFECYCLE", "OUTCOME", "TRANSITION"}
	if strings.Join(corpus.FamilyOrder, "|") != strings.Join(expectedFamilies, "|") {
		t.Fatalf("semantic family order drift: %v", corpus.FamilyOrder)
	}
	if len(corpus.Vectors) < 27 || len(corpus.MultiFault.ExpectedCodes) != len(expectedFamilies) {
		t.Fatalf("semantic corpus is incomplete: vectors=%d multi=%v", len(corpus.Vectors), corpus.MultiFault.ExpectedCodes)
	}
	knownCodes := make(map[string]bool)
	for _, vector := range corpus.Vectors {
		if vector.ID == "" || vector.Scope == "" || len(vector.Expected) == 0 {
			t.Fatalf("invalid semantic vector: %+v", vector)
		}
		for _, issue := range vector.Expected {
			knownCodes[issue.Code] = true
		}
	}
	for _, code := range corpus.MultiFault.ExpectedCodes {
		if !knownCodes[code] {
			t.Fatalf("multi-fault code %q has no shared vector", code)
		}
	}

	request := validRuntimeServiceRequestForTest()
	invalidFinalState := completionFinalStateForTest(request.Match.MatchID)
	players := invalidFinalState["players"].([]any)
	bottomPlayerID := players[0].(map[string]any)["id"].(string)
	invalidFinalState["soldiers"] = []any{
		map[string]any{"id": "soldier:semantic:a", "ownerPlayerId": bottomPlayerID, "status": "ACTIVE", "position": map[string]any{"x": 2, "y": 2}, "facing": "UP"},
		map[string]any{"id": "soldier:semantic:b", "ownerPlayerId": bottomPlayerID, "status": "ACTIVE", "position": map[string]any{"x": 2, "y": 2}, "facing": "UP"},
	}
	response := &runtimeServiceResponse{
		ContractVersion:   runtimeExecutionServiceVersion,
		OK:                true,
		Kind:              "executionResult",
		RequestID:         request.RequestID,
		MatchID:           request.Match.MatchID,
		RuntimeABIVersion: strategyRuntimeABIVersion,
		Result: map[string]any{
			"chronicle":  completionChronicleForTest(request.Match.MatchID),
			"finalState": invalidFinalState,
		},
	}
	if failure := validateRuntimeServiceResponse(request, response); failure != nil {
		if failure.ErrorClass != "RuntimeServiceSemanticIntegrity" || !failure.Retryable {
			t.Fatalf("semantic response failure was not retryable system ownership: %+v", failure)
		}
		return
	}
	if _, err := deriveGoMatchCompletionFields(invalidFinalState); err != nil {
		if !strings.Contains(err.Error(), "POSITION_OCCUPANCY_DUPLICATE") {
			t.Fatalf("unexpected semantic completion failure: %v", err)
		}
		return
	}

	for _, forbidden := range []string{"func resolveActivation", "func resolveRound", "func resolveCycle", "func resolveContraction"} {
		entries, err := os.ReadDir(".")
		if err != nil {
			t.Fatal(err)
		}
		for _, entry := range entries {
			if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".go") || strings.HasSuffix(entry.Name(), "_test.go") {
				continue
			}
			source, err := os.ReadFile(entry.Name())
			if err != nil {
				t.Fatal(err)
			}
			if strings.Contains(string(source), forbidden) {
				t.Fatalf("Go gameplay scheduler detected in %s: %s", entry.Name(), forbidden)
			}
		}
	}

	databaseURL := os.Getenv("COWARDS_GO_BACKEND_TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Fatal("COWARDS_GO_BACKEND_TEST_DATABASE_URL is required for semantic rollback RED")
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
	before := semanticDatabaseState(t, ctx, pool)
	service := newMatchCompletionService(pool)
	service.allowLegacyTestCompletion = true
	_, completionError := service.completeMatch(ctx, completeMatchInput{
		JobID:      "job:semantic-red:not-seeded",
		LeaseToken: "lease:semantic-red:not-seeded",
		Chronicle:  completionChronicleForTest(request.Match.MatchID),
		FinalState: invalidFinalState,
	})
	if completionError == nil {
		t.Fatal("shape-valid semantic invalidity reached canonical completion")
	}
	after := semanticDatabaseState(t, ctx, pool)
	if before != after {
		t.Fatalf("semantic invalidity mutated PostgreSQL: before=%+v after=%+v", before, after)
	}

	t.Fatal("[EXPECTED_RED:MISSING_SEMANTIC_ENFORCEMENT:GO]")
}
