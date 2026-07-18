package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"reflect"
	"strings"
	"testing"
)

func TestRunMatchJobOnceForwardsOptionalMatchAllowlist(t *testing.T) {
	t.Setenv("COWARDS_GO_BACKEND_INTERNAL_TOKEN", "operator-token")
	tests := []struct {
		name     string
		body     string
		expected []string
	}{
		{
			name:     "exact allowlist",
			body:     `{"matchIds":["match:phase258:a","match:phase258:b"]}`,
			expected: []string{"match:phase258:a", "match:phase258:b"},
		},
		{
			name:     "legacy empty body",
			body:     "",
			expected: nil,
		},
		{
			name:     "legacy whitespace body",
			body:     " \n\t ",
			expected: nil,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			calls := 0
			var forwarded []string
			server := &LiveServer{
				runOrchestrationOnce: func(_ context.Context, matchIDs []string) (*goMatchOrchestrationResult, error) {
					calls++
					forwarded = matchIDs
					return &goMatchOrchestrationResult{Status: "idle"}, nil
				},
			}
			request := httptest.NewRequest(http.MethodPost, "/internal/match-jobs/run-once", strings.NewReader(test.body))
			request.Header.Set("X-Cowards-Internal-Token", "operator-token")
			response := httptest.NewRecorder()

			server.routes().ServeHTTP(response, request)

			if response.Code != http.StatusOK || calls != 1 {
				t.Fatalf("run-once forwarding failed: status=%d calls=%d body=%s", response.Code, calls, response.Body.String())
			}
			if !reflect.DeepEqual(forwarded, test.expected) {
				t.Fatalf("forwarded match allowlist mismatch: got=%#v expected=%#v", forwarded, test.expected)
			}
		})
	}
}

func TestRunMatchJobOnceRejectsInvalidBodyBeforeOrchestration(t *testing.T) {
	t.Setenv("COWARDS_GO_BACKEND_INTERNAL_TOKEN", "operator-token")
	tooMany, err := json.Marshal(map[string]any{"matchIds": func() []string {
		ids := make([]string, 101)
		for index := range ids {
			ids[index] = fmt.Sprintf("match:phase258:limit:%03d", index)
		}
		return ids
	}()})
	if err != nil {
		t.Fatal(err)
	}
	tests := []struct {
		name string
		body string
	}{
		{name: "missing matchIds", body: `{}`},
		{name: "unknown field", body: `{"matchIds":["match:a"],"privateDiagnostics":"must-not-leak"}`},
		{name: "duplicate field", body: `{"matchIds":["match:a"],"matchIds":["match:b"]}`},
		{name: "duplicate match id", body: `{"matchIds":["match:a","match:a"]}`},
		{name: "empty list", body: `{"matchIds":[]}`},
		{name: "null list", body: `{"matchIds":null}`},
		{name: "non-string id", body: `{"matchIds":[1]}`},
		{name: "empty id", body: `{"matchIds":[""]}`},
		{name: "whitespace id", body: `{"matchIds":["  "]}`},
		{name: "over list limit", body: string(tooMany)},
		{name: "trailing value", body: `{"matchIds":["match:a"]}{"private":"tail"}`},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			calls := 0
			server := &LiveServer{
				runOrchestrationOnce: func(_ context.Context, _ []string) (*goMatchOrchestrationResult, error) {
					calls++
					return &goMatchOrchestrationResult{Status: "idle"}, nil
				},
			}
			request := httptest.NewRequest(http.MethodPost, "/internal/match-jobs/run-once", strings.NewReader(test.body))
			request.Header.Set("X-Cowards-Internal-Token", "operator-token")
			response := httptest.NewRecorder()

			server.routes().ServeHTTP(response, request)

			if response.Code != http.StatusBadRequest || calls != 0 {
				t.Fatalf("invalid run-once body reached orchestration: status=%d calls=%d body=%s", response.Code, calls, response.Body.String())
			}
			var serviceError serviceErrorFixture
			if err := json.Unmarshal(response.Body.Bytes(), &serviceError); err != nil {
				t.Fatal(err)
			}
			if serviceError.Code != "VALIDATION_FAILED" || serviceError.Message != "Request body is invalid." || !serviceError.PublicSafe {
				t.Fatalf("invalid body returned unsafe error: %+v", serviceError)
			}
			for _, forbidden := range []string{"privateDiagnostics", "must-not-leak", "match:a", "duplicate JSON key"} {
				if strings.Contains(response.Body.String(), forbidden) {
					t.Fatalf("validation error leaked %q: %s", forbidden, response.Body.String())
				}
			}
		})
	}
}

func TestRunMatchJobOnceAuthenticatesBeforeBodyAdmission(t *testing.T) {
	t.Setenv("COWARDS_GO_BACKEND_INTERNAL_TOKEN", "operator-token")
	calls := 0
	server := &LiveServer{
		runOrchestrationOnce: func(_ context.Context, _ []string) (*goMatchOrchestrationResult, error) {
			calls++
			return &goMatchOrchestrationResult{Status: "idle"}, nil
		},
	}
	request := httptest.NewRequest(http.MethodPost, "/internal/match-jobs/run-once", strings.NewReader(`{"matchIds":"private malformed body"}`))
	response := httptest.NewRecorder()

	server.routes().ServeHTTP(response, request)

	if response.Code != http.StatusForbidden || calls != 0 {
		t.Fatalf("run-once auth ordering drifted: status=%d calls=%d body=%s", response.Code, calls, response.Body.String())
	}
	if strings.Contains(response.Body.String(), "private malformed body") {
		t.Fatalf("forbidden response leaked request body: %s", response.Body.String())
	}
}

func TestCandidatePairwiseFourConditionMatchesV119MatchTypeScriptCanonicalBytes(t *testing.T) {
	entrantA := candidateSetEntrantV119{
		EntrantKey: "entrant:a", StrategyRevisionID: "revision:a", PlayerID: "player:a",
	}
	entrantB := candidateSetEntrantV119{
		EntrantKey: "entrant:b", StrategyRevisionID: "revision:b", PlayerID: "player:b",
	}
	matches, err := generateCandidateFourConditionMatchesV119(
		"runtime-v1.19",
		"match-set:candidate",
		"arena:smoke:v1",
		"seed:smoke:001",
		entrantA,
		entrantB,
	)
	if err != nil {
		t.Fatal(err)
	}
	if len(matches) != 4 {
		t.Fatalf("candidate scenario produced %d rows, want 4", len(matches))
	}
	wantScenarioID := "set-scenario:sha256:f2ed13a31310a105e40f939a6b13ca8151fb924dd29ffec66aaa13bc9dae1517"
	wantConditionIDs := []string{
		"set-condition:sha256:a6236e8738e680c2f7f19fce95abaee8cbe9520e81768181340c73f3bbd95b12",
		"set-condition:sha256:3e923813f7bea0afdd287cdf7950a7cdd4d7354d0bc80574d4176e8e37738342",
		"set-condition:sha256:020165c1c510fbac455462404257ecd09d6cf40c28745150ea7b299ffb4091ec",
		"set-condition:sha256:a9ad5b0f8777f12f3d0ec8a7a203481815bab53f5d37a6d3d613ddaa4d18b3a5",
	}
	wantRequestIDs := []string{
		"set-request:sha256:ec8bba50a631cd3263624c71cb76647e49123dd95dccf3927e953b8f2ecee244",
		"set-request:sha256:ce688c2c486d5fdf79598bac10f17feef2f53071d3bb01848fa919116b4eac4f",
		"set-request:sha256:1cd3a34b22b73176a035623918deffb1a0da6cc8ba2e4861a131c415d7bb1a3b",
		"set-request:sha256:91a089f384bae16e111968179959fc6f2b5678ce95849bc0e8c07df869119b7e",
	}
	wantBottom := []string{"entrant:a", "entrant:a", "entrant:b", "entrant:b"}
	wantFirst := []string{"entrant:a", "entrant:b", "entrant:a", "entrant:b"}
	for index, match := range matches {
		if match.ScenarioID != wantScenarioID || match.ConditionID != wantConditionIDs[index] ||
			match.RequestIdentity != wantRequestIDs[index] || match.ConditionOrdinal != index ||
			match.BottomEntrantKey != wantBottom[index] || match.InitialInitiativeEntrantKey != wantFirst[index] ||
			match.Seed != "seed:smoke:001" || match.ArenaCatalogVersion != "canonical-arena-catalog-v1.37" ||
			match.ArenaSemanticGeometryHash != "sha256:39aecc22c184660c1c08ab810fbfa3066da1a650b20e91d72a838ed7fb70a0e1" {
			t.Fatalf("candidate row %d drifted from TypeScript: %+v", index, match)
		}
	}
	for _, key := range []string{"runtime-v1.17", "runtime-v1.18", "runtime-v1.20"} {
		if _, err := generateCandidateFourConditionMatchesV119(key, "match-set:candidate", "arena:smoke:v1", "seed:smoke:001", entrantA, entrantB); err == nil {
			t.Fatalf("candidate scheduler admitted semantic key %q", key)
		}
	}
	blankMatches, blankErr := generateCandidateFourConditionMatchesV119("", "match-set:candidate", "arena:smoke:v1", "seed:smoke:001", entrantA, entrantB)
	if currentSemanticAuthorityGenerated().SemanticAuthorityKey == "runtime-v1.19" {
		if blankErr != nil || !reflect.DeepEqual(blankMatches, matches) {
			t.Fatalf("current v1.19 scheduler did not admit the default key: %v", blankErr)
		}
	} else if blankErr == nil {
		t.Fatal("inactive v1.19 candidate became the default scheduler")
	}
	if _, err := generateCandidateFourConditionMatchesV119("runtime-v1.19", "match-set:candidate", "arena:open-field:v1", "seed:smoke:001", entrantA, entrantB); err == nil {
		t.Fatal("historical Open Field alias became schedulable")
	}
}

func simulatedCurrentSemanticAuthorityV119() currentSemanticAuthorityGeneratedSelection {
	return currentSemanticAuthorityGeneratedSelection{
		SemanticAuthorityKey:          "runtime-v1.19",
		TupleID:                       "sha256:37c9a07425d454c74859112debcc3ef362d43e80d5767560d9bde28a3c8d5e73",
		Rules:                         "cowards-rules-v1.4",
		Engine:                        "engine-kernel-v1.37-candidate-1",
		RuntimeABI:                    "strategy-runtime-abi-v1.19",
		Chronicle:                     "chronicle-recorder-current-events-v1.37-candidate-1",
		ArenaCatalog:                  "canonical-arena-catalog-v1.37",
		SetPolicy:                     "canonical-set-policy-v1.37-four-condition-v1",
		ConformanceCertificateVersion: "runtime-conformance-certificate-v1.19",
		SourceSHA256:                  "sha256:110d30db98623cb90f07b473045cf04aca3433fb823964163191a0a8cba64b61",
		OutputSHA256:                  "sha256:15030ee59b81a2bf04667e045344de36d1b11b9834e64f71be05ccf7b73d80d5",
	}
}

func TestGoSemanticAuthoritySelectionAcceptsOnlyClosedCurrentValues(t *testing.T) {
	for _, current := range []currentSemanticAuthorityGeneratedSelection{
		currentSemanticAuthorityGenerated(),
		simulatedCurrentSemanticAuthorityV119(),
	} {
		selection, root, err := resolveCurrentGoSemanticAuthoritySelection(current)
		if err != nil {
			t.Fatalf("closed current %q was rejected: %v", current.SemanticAuthorityKey, err)
		}
		if selection.SemanticAuthorityKey != current.SemanticAuthorityKey || selection.TupleID != current.TupleID || selection.RuntimeABIVersion != current.RuntimeABI {
			t.Fatalf("closed current %q projected a mixed selection: %+v", current.SemanticAuthorityKey, selection)
		}
		if root != selection.Root() {
			t.Fatalf("closed current %q root drifted: %q", current.SemanticAuthorityKey, root)
		}
	}

	mixed := simulatedCurrentSemanticAuthorityV119()
	mixed.RuntimeABI = "strategy-runtime-abi-v1.17"
	if _, _, err := resolveCurrentGoSemanticAuthoritySelection(mixed); err == nil {
		t.Fatal("mixed generated current selection was admitted")
	}
	unknown := currentSemanticAuthorityGenerated()
	unknown.SemanticAuthorityKey = "runtime-v1.18"
	if _, _, err := resolveCurrentGoSemanticAuthoritySelection(unknown); err == nil {
		t.Fatal("unknown generated current selection was admitted")
	}
	forged := currentSemanticAuthorityGenerated()
	forged.SourceSHA256 = "sha256:" + strings.Repeat("z", 64)
	if _, _, err := resolveCurrentGoSemanticAuthoritySelection(forged); err == nil {
		t.Fatal("non-digest generated current selection was admitted")
	}
}

func TestGoSemanticAuthorityHeadRejectsPendingMixedAndStaleValues(t *testing.T) {
	for _, current := range []currentSemanticAuthorityGeneratedSelection{
		currentSemanticAuthorityGenerated(),
		simulatedCurrentSemanticAuthorityV119(),
	} {
		selection, root, err := resolveCurrentGoSemanticAuthoritySelection(current)
		if err != nil {
			t.Fatal(err)
		}
		bytes, err := json.Marshal(selection)
		if err != nil {
			t.Fatal(err)
		}
		state := "active-v1.17-bootstrap"
		if current.SemanticAuthorityKey == "runtime-v1.19" {
			state = "active-v1.19-finalized"
		}
		head := goSemanticAuthorityHeadSnapshot{State: state, ActiveSelection: bytes, ActiveSelectionRoot: root}
		if _, _, err := validateCurrentGoSemanticAuthorityHead(current, head); err != nil {
			t.Fatalf("exact %q head was rejected: %v", current.SemanticAuthorityKey, err)
		}
		pending := head
		pending.State = "pending-precommit"
		pending.PendingIntent = json.RawMessage(`{"direction":"forward"}`)
		if _, _, err := validateCurrentGoSemanticAuthorityHead(current, pending); err == nil {
			t.Fatal("pending semantic authority head was admitted")
		}
		stale := head
		stale.ActiveSelectionRoot = "sha256:" + strings.Repeat("0", 64)
		if _, _, err := validateCurrentGoSemanticAuthorityHead(current, stale); err == nil {
			t.Fatal("stale semantic authority head was admitted")
		}
		mixed := head
		mixed.ActiveSelection = append([]byte(nil), bytes...)
		mixed.ActiveSelection = []byte(strings.Replace(string(mixed.ActiveSelection), current.RuntimeABI, "strategy-runtime-abi-v1.18", 1))
		if _, _, err := validateCurrentGoSemanticAuthorityHead(current, mixed); err == nil {
			t.Fatal("mixed semantic authority head was admitted")
		}
	}
}

func TestGoSchedulingReadsHeadOnlyAtCreationAndFreezesWork(t *testing.T) {
	bytes, err := os.ReadFile("live_backend.go")
	if err != nil {
		t.Fatal(err)
	}
	source := string(bytes)
	for _, functionName := range []string{"createExhibitionMatchSetWithDependencies", "createCandidateFourConditionMatchSetV119"} {
		body := goFunctionSource(t, source, functionName)
		for _, required := range []string{"lockCurrentGoSemanticAuthorityHead", "semantic_authority_selection", "semantic_authority_selection_root"} {
			if !strings.Contains(body, required) {
				t.Fatalf("%s does not freeze %q", functionName, required)
			}
		}
	}
	runOnce := goFunctionSource(t, source, "runMatchJobOnce")
	for _, forbidden := range []string{"semantic_authority_selection_head", "lockCurrentGoSemanticAuthorityHead", "currentSemanticAuthorityGenerated"} {
		if strings.Contains(runOnce, forbidden) {
			t.Fatalf("job execution rereads or derives authority through %q", forbidden)
		}
	}
}

func TestCandidatePairwiseStagingPreservesClosedCurrentGoScheduler(t *testing.T) {
	current := currentSemanticAuthorityGenerated()
	if _, _, err := resolveCurrentGoSemanticAuthoritySelection(current); err != nil {
		t.Fatalf("generated current selector is not closed: %v", err)
	}
	if _, err := candidateSchedulingAuthorityV119ForCurrent("runtime-v1.19", current); err != nil {
		t.Fatalf("explicit inactive candidate was rejected: %v", err)
	}
	if _, err := candidateSchedulingAuthorityV119ForCurrent("", simulatedCurrentSemanticAuthorityV119()); err != nil {
		t.Fatalf("simulated v1.19 current did not become default: %v", err)
	}
	if _, err := candidateSchedulingAuthorityV119ForCurrent("", current); current.SemanticAuthorityKey == "runtime-v1.19" {
		if err != nil {
			t.Fatalf("selected v1.19 authority did not become default: %v", err)
		}
	} else if err == nil {
		t.Fatal("inactive v1.19 candidate became default while v1.17 is current")
	}
	entrants := []map[string]any{
		{"entrantId": "entrant:0", "entrantIndex": 0, "strategyRevisionId": "revision:0"},
		{"entrantId": "entrant:1", "entrantIndex": 1, "strategyRevisionId": "revision:1"},
	}
	want := []map[string]any{
		{
			"id": "match:match-set:current:0", "bottomStrategyRevisionId": "revision:0", "topStrategyRevisionId": "revision:1",
			"arenaVariantId": "arena:smoke:v1", "seed": "seed:smoke:001:pair:0-1", "bottomPlayerId": "player:match-set:current:entrant:0",
			"topPlayerId": "player:match-set:current:entrant:1", "bottomExecutionEntrantKey": "entrant:0", "topExecutionEntrantKey": "entrant:1",
		},
		{
			"id": "match:match-set:current:1", "bottomStrategyRevisionId": "revision:1", "topStrategyRevisionId": "revision:0",
			"arenaVariantId": "arena:smoke:v1", "seed": "seed:smoke:001:pair:0-1:mirror", "bottomPlayerId": "player:match-set:current:entrant:1",
			"topPlayerId": "player:match-set:current:entrant:0", "bottomExecutionEntrantKey": "entrant:1", "topExecutionEntrantKey": "entrant:0",
		},
	}
	if got := generatePairwiseMatches("match-set:current", "smoke-v1", entrants); !reflect.DeepEqual(got, want) {
		t.Fatalf("legacy v1.17 scheduler changed:\nwant=%#v\n got=%#v", want, got)
	}
	for _, arena := range competitionArenaDefinitions() {
		_, hasCandidateKey := arena["semanticAuthorityKey"]
		if stringValue(arena, "id") == "arena:open-field:v1" || hasCandidateKey {
			t.Fatalf("candidate authority leaked into selected current arenas: %+v", arena)
		}
	}
}
