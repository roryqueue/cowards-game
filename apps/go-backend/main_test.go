package main

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"testing"
)

func TestEndpointFixturesMatchCanonicalJSON(t *testing.T) {
	tests := []struct {
		name        string
		path        string
		fixtureName string
	}{
		{
			name:        "health",
			path:        "/health",
			fixtureName: "health.json",
		},
		{
			name:        "public player page",
			path:        "/public/players/go-parity",
			fixtureName: "public-player-page.json",
		},
		{
			name:        "public ladder page",
			path:        "/public/ladders/ladder-season%3Ademo",
			fixtureName: "public-ladder-page.json",
		},
		{
			name:        "public matchset summary",
			path:        "/public/matchsets/match-set%3Ago-parity%3Agolden/summary",
			fixtureName: "public-match-set-summary.json",
		},
		{
			name:        "degraded matchset summary",
			path:        "/public/matchsets/match-set%3Ago-parity%3Adegraded/summary",
			fixtureName: "degraded-match-set-summary.json",
		},
		{
			name:        "public replay metadata",
			path:        "/public/replays/golden%3Av1-7%3Amatch/metadata",
			fixtureName: "public-replay-metadata.json",
		},
		{
			name:        "public replay evidence",
			path:        "/public/replays/golden%3Av1-7%3Amatch/evidence",
			fixtureName: "public-replay-evidence.json",
		},
		{
			name:        "public strategy page",
			path:        "/public/strategies/strategy%3Ago-parity%3Asentinel",
			fixtureName: "public-strategy-page.json",
		},
		{
			name:        "analytics run summary",
			path:        "/analytics/runs/analytics-run%3Aworkshop-v1.6-demo%3A2/summary",
			fixtureName: "analytics-run-summary.json",
		},
	}

	server := newTestServer(t)
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			response := httptest.NewRecorder()
			request := httptest.NewRequest(http.MethodGet, test.path, nil)
			if test.fixtureName == "analytics-run-summary.json" {
				request.Header.Set("Authorization", "Bearer local-owner-token")
			}

			server.routes().ServeHTTP(response, request)

			if response.Code != http.StatusOK {
				t.Fatalf("expected 200, got %d", response.Code)
			}
			assertJSONEqual(t, readTestFixture(t, test.fixtureName), response.Body.Bytes())
		})
	}
}

func TestLiveServerRoutesIncludeV116SelectedGoManifestPaths(t *testing.T) {
	source, err := os.ReadFile("live_backend.go")
	if err != nil {
		t.Fatal(err)
	}
	required := []string{
		`mux.HandleFunc("GET /health"`,
		`mux.HandleFunc("GET /auth/session"`,
		`mux.HandleFunc("POST /auth/session"`,
		`mux.HandleFunc("POST /auth/sign-up"`,
		`mux.HandleFunc("DELETE /auth/session"`,
		`mux.HandleFunc("GET /account/strategy-revisions"`,
		`mux.HandleFunc("POST /account/strategy-revisions"`,
		`mux.HandleFunc("GET /account/strategy-revisions/{strategyRevisionId}/source"`,
		`mux.HandleFunc("POST /account/starter-forks"`,
		`mux.HandleFunc("POST /account/advanced-forks"`,
		`mux.HandleFunc("POST /matchsets"`,
		`mux.HandleFunc("GET /public/strategies/{strategyId}"`,
		`mux.HandleFunc("GET /public/players/{handle}"`,
		`mux.HandleFunc("GET /public/ladders/{seasonId}"`,
		`mux.HandleFunc("GET /public/matchsets/{matchSetId}/summary"`,
		`mux.HandleFunc("GET /public/replays/{matchId}/metadata"`,
		`mux.HandleFunc("GET /public/replays/{matchId}/evidence"`,
	}
	for _, registration := range required {
		if !strings.Contains(string(source), registration) {
			t.Fatalf("live backend missing selected v1.16 route registration %s", registration)
		}
	}
}

func TestStrategyArtifactManifestParsesAsDataOnly(t *testing.T) {
	type artifactManifest struct {
		SchemaVersion string `json:"schemaVersion"`
		ArtifactCount int    `json:"artifactCount"`
		ContentHash   string `json:"contentHash"`
		Artifacts     []struct {
			ID               string `json:"id"`
			Kind             string `json:"kind"`
			SourceVisibility string `json:"sourceVisibility"`
			ForkEligibility  struct {
				Forkable bool `json:"forkable"`
			} `json:"forkEligibility"`
			Source struct {
				Text  string `json:"text"`
				Hash  string `json:"hash"`
				Bytes int    `json:"bytes"`
			} `json:"source"`
			Validation struct {
				Valid      bool   `json:"valid"`
				SourceHash string `json:"sourceHash"`
			} `json:"validation"`
		} `json:"artifacts"`
	}

	bytes, err := os.ReadFile("../../packages/spec/artifacts/strategy-artifacts.v1.14.json")
	if err != nil {
		t.Fatal(err)
	}
	var manifest artifactManifest
	if err := json.Unmarshal(bytes, &manifest); err != nil {
		t.Fatal(err)
	}
	if manifest.SchemaVersion != "strategy-artifact-manifest-v1.14" {
		t.Fatalf("unexpected schema version %q", manifest.SchemaVersion)
	}
	if manifest.ArtifactCount != len(manifest.Artifacts) || manifest.ArtifactCount == 0 {
		t.Fatalf("artifact count mismatch: %d vs %d", manifest.ArtifactCount, len(manifest.Artifacts))
	}
	if !strings.HasPrefix(manifest.ContentHash, "sha256:") {
		t.Fatalf("manifest missing content hash: %q", manifest.ContentHash)
	}
	for _, artifact := range manifest.Artifacts {
		if artifact.Kind == "account-revision" {
			t.Fatalf("generated manifest must not contain owner-private account source: %s", artifact.ID)
		}
		if artifact.SourceVisibility != "built-in-forkable" || !artifact.ForkEligibility.Forkable {
			t.Fatalf("artifact is not explicitly built-in forkable: %s", artifact.ID)
		}
		if artifact.Source.Text == "" || artifact.Source.Hash == "" || artifact.Source.Bytes <= 0 {
			t.Fatalf("artifact has incomplete source metadata: %s", artifact.ID)
		}
		if artifact.Validation.SourceHash != artifact.Source.Hash {
			t.Fatalf("artifact validation hash drifted for %s", artifact.ID)
		}
	}
}

func TestLiveStrategyArtifactManifestSupportsForkLookups(t *testing.T) {
	artifacts, err := loadStrategyArtifactManifest("../../packages/spec/artifacts/strategy-artifacts.v1.14.json")
	if err != nil {
		t.Fatal(err)
	}
	server := &LiveServer{strategyArtifacts: artifacts}

	artifact, err := server.forkableStrategyArtifact("starter", "aggro-chaser")
	if err != nil {
		t.Fatal(err)
	}
	insert := artifact.accountRevisionInsert("user:manifest-test")
	if insert.Source == "" || insert.SourceHash == "" || insert.SourceHash != hashString(insert.Source) {
		t.Fatalf("fork insert did not preserve manifest source hash")
	}
	if insert.Runtime == nil || stringValue(insert.Runtime, "abiVersion") != "strategy-runtime-abi-v1.14" {
		t.Fatalf("fork insert did not preserve runtime ABI metadata")
	}
	if insert.Validation == nil || !boolValue(insert.Validation, "valid") {
		t.Fatalf("fork insert did not preserve validation status")
	}
	if _, ok := insert.Metadata["starterLineage"]; !ok {
		t.Fatalf("fork insert missing starter lineage")
	}
	if _, ok := insert.Metadata["tags"]; !ok {
		t.Fatalf("fork insert missing public tags")
	}

	if _, err := server.forkableStrategyArtifact("advanced", "aggro-chaser"); err == nil {
		t.Fatalf("starter artifact was accepted as an advanced fork")
	}
}

func TestPublicRuntimeMetadataOmitsPrivateLimits(t *testing.T) {
	runtime := defaultRuntimeMetadata()
	publicRuntime := publicRuntimeMetadata(runtime)

	if _, ok := publicRuntime["limits"]; ok {
		t.Fatalf("public runtime leaked limits")
	}
	if _, ok := runtime["limits"]; !ok {
		t.Fatalf("public runtime projection mutated source runtime")
	}
	if stringValue(publicRuntime, "abiVersion") != "strategy-runtime-abi-v1.14" {
		t.Fatalf("public runtime lost ABI metadata")
	}
}

func TestPythonRuntimeMetadataIsCountedProviderEligible(t *testing.T) {
	t.Setenv("COWARDS_PROVIDER_VALIDATION_SECRET", "cowards-provider-validation-test-secret-v1.32")
	runtime := pythonRuntimeMetadata()
	sourceHash := "sourcehash:python"
	sourceBytes := 123
	metadata := map[string]any{
		"providerValidation": map[string]any{
			"providerId":      "strategy-language-provider-python",
			"contractVersion": "strategy-language-provider-contract-v1.32",
			"sourceHash":      sourceHash,
			"sourceBytes":     sourceBytes,
			"proof":           pythonProviderValidationProof(sourceHash, sourceBytes),
		},
	}
	semantics := runtimeSemantics(runtime)

	if stringValue(mapValue(runtime, "language"), "id") != "python" {
		t.Fatalf("python runtime metadata did not preserve language id")
	}
	if semantics["languageId"] != "python" || semantics["countedPlayEligible"] != true {
		t.Fatalf("Python runtime semantics must be counted provider eligible: %+v", semantics)
	}
	if runtimeSemanticsForRevision(runtime, nil, sourceHash, sourceBytes)["countedPlayEligible"] == true {
		t.Fatalf("Python revision semantics accepted missing provider validation")
	}
	if runtimeSemanticsForRevision(runtime, metadata, sourceHash, sourceBytes)["countedPlayEligible"] != true {
		t.Fatalf("Python revision semantics rejected matching provider validation")
	}
	if !runtimeAllowsNonCountedExhibition(runtime) ||
		!runtimeAllowsCountedPlay(runtime, metadata, sourceHash, sourceBytes) {
		t.Fatalf("Python runtime eligibility gate drifted")
	}
	if runtimeAllowsCountedPlay(runtime, nil, sourceHash, sourceBytes) ||
		runtimeAllowsCountedPlay(runtime, metadata, "other", sourceBytes) ||
		runtimeAllowsCountedPlay(runtime, metadata, sourceHash, sourceBytes+1) {
		t.Fatalf("Python counted gate accepted missing or stale provider validation")
	}
}

func TestPublicReadRoutesDecodeIdentifiersWithoutCrossRouteFallback(t *testing.T) {
	tests := []struct {
		name          string
		path          string
		topLevelField string
		nestedField   []string
		expectedValue string
	}{
		{
			name:          "public player page",
			path:          "/public/players/go-parity",
			nestedField:   []string{"payload", "handle"},
			expectedValue: "go-parity",
		},
		{
			name:          "public ladder page",
			path:          "/public/ladders/ladder-season%3Ademo",
			nestedField:   []string{"payload", "seasonId"},
			expectedValue: "ladder-season:demo",
		},
		{
			name:          "public matchset summary",
			path:          "/public/matchsets/match-set%3Ago-parity%3Agolden/summary",
			topLevelField: "matchSetId",
			expectedValue: "match-set:go-parity:golden",
		},
		{
			name:          "degraded matchset summary",
			path:          "/public/matchsets/match-set%3Ago-parity%3Adegraded/summary",
			topLevelField: "matchSetId",
			expectedValue: "match-set:go-parity:degraded",
		},
		{
			name:          "public replay metadata",
			path:          "/public/replays/golden%3Av1-7%3Amatch/metadata",
			topLevelField: "matchId",
			expectedValue: "golden:v1-7:match",
		},
		{
			name:          "public strategy page",
			path:          "/public/strategies/strategy%3Ago-parity%3Asentinel",
			nestedField:   []string{"payload", "strategy", "strategyId"},
			expectedValue: "strategy:go-parity:sentinel",
		},
	}

	server := newTestServer(t).routes()
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			response := httptest.NewRecorder()
			request := httptest.NewRequest(http.MethodGet, test.path, nil)

			server.ServeHTTP(response, request)

			if response.Code != http.StatusOK {
				t.Fatalf("expected 200, got %d", response.Code)
			}
			body := decodeJSONMap(t, response.Body.Bytes())
			var got string
			if len(test.nestedField) > 0 {
				got = nestedString(t, body, test.nestedField...)
			} else {
				got = stringField(t, body, test.topLevelField)
			}
			if got != test.expectedValue {
				t.Fatalf("expected decoded id %q, got %q", test.expectedValue, got)
			}
		})
	}
}

func TestReplayMetadataUsesV18Shape(t *testing.T) {
	response := httptest.NewRecorder()
	request := httptest.NewRequest(
		http.MethodGet,
		"/public/replays/golden%3Av1-7%3Amatch/metadata",
		nil,
	)

	NewServer().routes().ServeHTTP(response, request)

	if strings.Contains(response.Body.String(), `"chronicle"`) {
		t.Fatal("replay metadata used legacy v1.7 chronicle envelope")
	}
	if strings.Contains(response.Body.String(), `"replayAvailable"`) {
		t.Fatal("replay metadata used legacy v1.7 replayAvailable field")
	}
	if !strings.Contains(response.Body.String(), `"metadata"`) {
		t.Fatal("replay metadata missing v1.8 metadata envelope")
	}
}

func TestReplayEvidenceUsesPublicProjectionShape(t *testing.T) {
	response := httptest.NewRecorder()
	request := httptest.NewRequest(
		http.MethodGet,
		"/public/replays/golden%3Av1-7%3Amatch/evidence",
		nil,
	)

	NewServer().routes().ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", response.Code)
	}
	bodyText := response.Body.String()
	for _, forbidden := range []string{"ownerPrivate", "strategyMemory", "soldierMemory", "objectivePayload", "ownerDebug"} {
		if strings.Contains(bodyText, forbidden) {
			t.Fatalf("public replay evidence leaked %s", forbidden)
		}
	}
	body := decodeJSONMap(t, response.Body.Bytes())
	if stringField(t, body, "kind") != "publicReplayEvidence" {
		t.Fatal("replay evidence did not use the public evidence kind")
	}
	projection, ok := body["projection"].(map[string]any)
	if !ok {
		t.Fatal("replay evidence missing projection")
	}
	viewer, ok := projection["viewer"].(map[string]any)
	if !ok || viewer["access"] != "public" {
		t.Fatal("replay evidence did not use the public viewer")
	}
}

func TestAnalyticsRunSummaryRequiresTrustedOwnerToken(t *testing.T) {
	server := newTestServer(t).routes()
	path := "/analytics/runs/analytics-run%3Aworkshop-v1.6-demo%3A2/summary"
	missingPath := "/analytics/runs/analytics-run%3Amissing/summary"

	tests := []struct {
		name          string
		path          string
		authorization string
		fixtureName   string
	}{
		{name: "missing token existing run", path: path, fixtureName: "forbidden-error.json"},
		{name: "missing token missing run", path: missingPath, fixtureName: "forbidden-error.json"},
		{name: "unknown token", path: path, authorization: "Bearer unknown-token", fixtureName: "forbidden-error.json"},
		{name: "token for wrong owner", path: path, authorization: "Bearer other-owner-token", fixtureName: "not-found-error.json"},
		{name: "owner token missing run", path: missingPath, authorization: "Bearer local-owner-token", fixtureName: "not-found-error.json"},
	}

	for _, test := range tests {
		response := httptest.NewRecorder()
		request := httptest.NewRequest(http.MethodGet, test.path, nil)
		if test.authorization != "" {
			request.Header.Set("Authorization", test.authorization)
		}

		server.ServeHTTP(response, request)

		expectedStatus := http.StatusForbidden
		if test.fixtureName == "not-found-error.json" {
			expectedStatus = http.StatusNotFound
		}
		if response.Code != expectedStatus {
			t.Fatalf("%s: expected %d, got %d", test.name, expectedStatus, response.Code)
		}
		assertJSONEqual(t, readTestFixture(t, test.fixtureName), response.Body.Bytes())
	}

	response := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, path, nil)
	request.Header.Set("Authorization", "Bearer local-owner-token")
	server.ServeHTTP(response, request)
	if response.Code != http.StatusOK {
		t.Fatalf("expected owner token to authorize analytics summary, got %d", response.Code)
	}
}

func TestMissingResourcesReturnPublicErrorShape(t *testing.T) {
	tests := []string{
		"/public/players/missing-player",
		"/public/ladders/ladder-season%3Amissing",
		"/public/matchsets/match-set%3Amissing/summary",
		"/public/replays/match%3Amissing/metadata",
		"/public/replays/match%3Amissing/evidence",
		"/public/strategies/strategy%3Amissing",
	}

	for _, path := range tests {
		response := httptest.NewRecorder()
		request := httptest.NewRequest(http.MethodGet, path, nil)

		NewServer().routes().ServeHTTP(response, request)

		if response.Code != http.StatusNotFound {
			t.Fatalf("expected 404 for %s, got %d", path, response.Code)
		}
		assertJSONEqual(t, readTestFixture(t, "not-found-error.json"), response.Body.Bytes())
	}
}

func TestRouteInventoryIsReadOnlyAllowlist(t *testing.T) {
	var manifest []routeSpec
	if err := json.Unmarshal(readTestFixture(t, "route-manifest.json"), &manifest); err != nil {
		t.Fatal(err)
	}
	if !reflect.DeepEqual(routeInventory, manifest) {
		t.Fatalf("route inventory drifted from generated manifest")
	}
	for _, route := range routeInventory {
		if route.Method != http.MethodGet {
			t.Fatalf("route %s is not read-only: %s", route.ID, route.Method)
		}
		if route.AuthScope == "owner" && !route.RequiresBearerToken {
			t.Fatalf("owner route %s does not require bearer token auth", route.ID)
		}
	}
}

func TestRouteManifestValidationRejectsCutoverDrift(t *testing.T) {
	tests := []struct {
		name   string
		mutate func([]routeSpec) []routeSpec
	}{
		{
			name: "extra route",
			mutate: func(manifest []routeSpec) []routeSpec {
				return append(manifest, routeSpec{
					ID:         "unexpectedWriteRoute",
					Method:     http.MethodPost,
					Pattern:    "/unexpected",
					AuthScope:  "owner",
					Privacy:    "owner",
					SamplePath: "/unexpected",
				})
			},
		},
		{
			name: "public read method drift",
			mutate: func(manifest []routeSpec) []routeSpec {
				manifest[1].Method = http.MethodPost
				return manifest
			},
		},
		{
			name: "owner route missing bearer requirement",
			mutate: func(manifest []routeSpec) []routeSpec {
				manifest[len(manifest)-1].RequiresBearerToken = false
				return manifest
			},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			manifest := append([]routeSpec(nil), routeInventory...)
			if err := validateRouteManifest(test.mutate(manifest)); err == nil {
				t.Fatal("expected route manifest validation to reject drift")
			}
		})
	}
}

func TestCompetitionArenasContainCanonicalStartingPositions(t *testing.T) {
	startingPositions := []map[string]int{
		{"x": 2, "y": 11},
		{"x": 3, "y": 11},
		{"x": 4, "y": 11},
		{"x": 5, "y": 11},
		{"x": 6, "y": 11},
		{"x": 7, "y": 11},
		{"x": 8, "y": 11},
		{"x": 9, "y": 11},
		{"x": 2, "y": 0},
		{"x": 3, "y": 0},
		{"x": 4, "y": 0},
		{"x": 5, "y": 0},
		{"x": 6, "y": 0},
		{"x": 7, "y": 0},
		{"x": 8, "y": 0},
		{"x": 9, "y": 0},
	}

	for _, arena := range competitionArenaDefinitions() {
		bounds := arena["initialBounds"].(map[string]any)
		for _, position := range startingPositions {
			if !pointInBounds(position["x"], position["y"], bounds) {
				t.Fatalf("%s initial bounds do not contain starting position (%d,%d)", arena["id"], position["x"], position["y"])
			}
		}
	}
}

func pointInBounds(x int, y int, bounds map[string]any) bool {
	return x >= bounds["minX"].(int) &&
		x <= bounds["maxX"].(int) &&
		y >= bounds["minY"].(int) &&
		y <= bounds["maxY"].(int)
}

func TestMutationVerbsDoNotSucceed(t *testing.T) {
	server := NewServer().routes()
	for _, route := range routeInventory {
		for _, method := range []string{
			http.MethodPost,
			http.MethodPut,
			http.MethodPatch,
			http.MethodDelete,
		} {
			response := httptest.NewRecorder()
			request := httptest.NewRequest(method, route.SamplePath, nil)
			if route.RequiresBearerToken {
				request.Header.Set("Authorization", "Bearer local-owner-token")
			}

			server.ServeHTTP(response, request)

			if response.Code < 400 {
				t.Fatalf("%s %s unexpectedly succeeded with %d", method, route.SamplePath, response.Code)
			}
		}
	}
}

func TestPublicResponsesDoNotExposePrivateMarkers(t *testing.T) {
	privateMarkers := []string{
		"strategyMemory",
		"soldierMemory",
		"objectivePayload",
		"ownerDebug",
		"rawRuntimeDetails",
		"PRIVATE_",
		"GOLDEN_PRIVATE_",
	}
	server := newTestServer(t).routes()
	for _, route := range routeInventory {
		response := httptest.NewRecorder()
		request := httptest.NewRequest(http.MethodGet, route.SamplePath, nil)
		if route.RequiresBearerToken {
			request.Header.Set("Authorization", "Bearer local-owner-token")
		}

		server.ServeHTTP(response, request)

		body := response.Body.String()
		for _, marker := range privateMarkers {
			if strings.Contains(body, marker) {
				t.Fatalf("%s leaked private marker %q", route.ID, marker)
			}
		}
	}
}

func TestFixtureOverrideFailsOnPrivateOrInvalidPayloads(t *testing.T) {
	tests := []struct {
		name        string
		fixtureName string
		payload     string
	}{
		{
			name:        "private Player source",
			fixtureName: "public-player-page.json",
			payload:     `{"apiVersion":"service-api-v1.8","kind":"publicPage","page":"player","canonicalHref":"/players/bad","payload":{"handle":"bad","displayName":"Bad","strategies":[],"ladderHistory":[],"results":[],"source":"private"}}`,
		},
		{
			name:        "schema-invalid Player page",
			fixtureName: "public-player-page.json",
			payload:     `{"apiVersion":"service-api-v1.8","kind":"publicPage","page":"player","canonicalHref":"/players/bad","payload":{}}`,
		},
		{
			name:        "private Ladder runtime internals",
			fixtureName: "public-ladder-page.json",
			payload:     `{"apiVersion":"service-api-v1.8","kind":"publicPage","page":"ladder","canonicalHref":"/ladder/bad","payload":{"seasonId":"ladder:bad","runtimeInternals":{}}}`,
		},
		{
			name:        "schema-invalid Ladder page",
			fixtureName: "public-ladder-page.json",
			payload:     `{"apiVersion":"service-api-v1.8","kind":"publicPage","page":"ladder","canonicalHref":"/ladder/bad","payload":{}}`,
		},
		{
			name:        "private source key",
			fixtureName: "public-match-set-summary.json",
			payload:     `{"apiVersion":"service-api-v1.8","kind":"publicMatchSetSummary","matchSetId":"match-set:bad","result":{},"source":"private"}`,
		},
		{
			name:        "missing matchset result",
			fixtureName: "public-match-set-summary.json",
			payload:     `{"apiVersion":"service-api-v1.8","kind":"publicMatchSetSummary","matchSetId":"match-set:bad"}`,
		},
		{
			name:        "schema-invalid nested matchset result",
			fixtureName: "public-match-set-summary.json",
			payload:     `{"apiVersion":"service-api-v1.8","kind":"publicMatchSetSummary","matchSetId":"match-set:bad","result":{"status":"complete"}}`,
		},
		{
			name:        "private diagnostics key",
			fixtureName: "public-replay-metadata.json",
			payload:     `{"apiVersion":"service-api-v1.8","kind":"publicReplayMetadata","matchId":"match:bad","metadata":{},"privateDiagnostics":{}}`,
		},
		{
			name:        "private Strategy source",
			fixtureName: "public-strategy-page.json",
			payload:     `{"apiVersion":"service-api-v1.8","kind":"publicPage","page":"strategy","canonicalHref":"/strategies/strategy:bad","payload":{"strategy":{"strategyId":"strategy:bad","source":"private"}}}`,
		},
		{
			name:        "schema-invalid Strategy page",
			fixtureName: "public-strategy-page.json",
			payload:     `{"apiVersion":"service-api-v1.8","kind":"publicPage","page":"strategy","canonicalHref":"/strategies/strategy:bad","payload":{}}`,
		},
		{
			name:        "schema-invalid nested replay metadata",
			fixtureName: "public-replay-metadata.json",
			payload:     `{"apiVersion":"service-api-v1.8","kind":"publicReplayMetadata","matchId":"match:bad","metadata":{"matchId":"match:bad"}}`,
		},
		{
			name:        "stderr key",
			fixtureName: "analytics-run-summary.json",
			payload:     `{"apiVersion":"service-api-v1.8","kind":"analyticsRunSummary","runId":"run:bad","profileId":"profile:bad","summary":{"ownerUserId":"user:local","stderr":"private"}}`,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			dir := copyTestFixturesToTemp(t)
			if err := os.WriteFile(
				filepath.Join(dir, test.fixtureName),
				[]byte(test.payload),
				0o600,
			); err != nil {
				t.Fatal(err)
			}

			if _, err := NewServerFromFixtureDirWithOwnerTokens(dir, testOwnerTokens()); err == nil {
				t.Fatal("expected invalid fixture override to fail startup")
			}
		})
	}
}

func TestValidateNoPrivateKeysUsesCentralizedPublicOutputContract(t *testing.T) {
	tests := []struct {
		name    string
		payload any
	}{
		{name: "source text", payload: map[string]any{"sourceText": "private"}},
		{name: "normalized stack trace", payload: map[string]any{"Stack_Trace": "private"}},
		{name: "raw awareness grid", payload: map[string]any{"rawAwarenessGrid": map[string]any{}}},
		{name: "private error", payload: map[string]any{"privateError": "private"}},
		{name: "authorization", payload: map[string]any{"authorization": "Bearer secret"}},
		{name: "access token", payload: map[string]any{"access_token": "secret"}},
		{name: "session id", payload: map[string]any{"session-id": "secret"}},
		{name: "database url", payload: map[string]any{"databaseUrl": "postgres://private"}},
		{name: "db dsn", payload: map[string]any{"dbDSN": "postgres://private"}},
		{name: "private marker string", payload: map[string]any{"message": "Bearer secret"}},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if err := validateNoPrivateKeys(test.payload, "$"); err == nil {
				t.Fatal("expected payload to fail privacy validation")
			}
		})
	}

	if err := validateNoPrivateKeys(map[string]any{
		"sourceHash": "abc",
		"runtime": map[string]any{
			"abiVersion": "strategy-runtime-abi-v1.14",
		},
	}, "$"); err != nil {
		t.Fatalf("safe public payload failed privacy validation: %v", err)
	}
}

func TestFixtureOverrideCannotBlessNestedInvalidPayloadWithManifest(t *testing.T) {
	dir := copyTestFixturesToTemp(t)
	payload := []byte(`{"apiVersion":"service-api-v1.8","kind":"publicMatchSetSummary","matchSetId":"match-set:bad","result":{"status":"complete"}}`)
	if err := os.WriteFile(
		filepath.Join(dir, "public-match-set-summary.json"),
		payload,
		0o600,
	); err != nil {
		t.Fatal(err)
	}
	rewriteFixtureManifestHash(t, dir, "public-match-set-summary.json", payload)

	if _, err := NewServerFromFixtureDirWithOwnerTokens(dir, testOwnerTokens()); err == nil {
		t.Fatal("expected override manifest to fail against embedded TypeScript fixture reference")
	}
}

func newTestServer(t *testing.T) *Server {
	t.Helper()
	server, err := NewServerFromFixtureDirWithOwnerTokens(
		"testdata/service-fixtures",
		testOwnerTokens(),
	)
	if err != nil {
		t.Fatal(err)
	}
	return server
}

func testOwnerTokens() map[string]string {
	return map[string]string{
		"local-owner-token": "user:local",
		"other-owner-token": "user:not-owner",
	}
}

func copyTestFixturesToTemp(t *testing.T) string {
	t.Helper()
	dir := t.TempDir()
	entries, err := os.ReadDir("testdata/service-fixtures")
	if err != nil {
		t.Fatal(err)
	}
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		source := filepath.Join("testdata/service-fixtures", entry.Name())
		target := filepath.Join(dir, entry.Name())
		bytes, err := os.ReadFile(source)
		if err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(target, bytes, 0o600); err != nil {
			t.Fatal(err)
		}
	}
	return dir
}

func rewriteFixtureManifestHash(t *testing.T, dir string, fileName string, payload []byte) {
	t.Helper()
	manifestPath := filepath.Join(dir, "fixture-manifest.json")
	bytes, err := os.ReadFile(manifestPath)
	if err != nil {
		t.Fatal(err)
	}
	var manifest fixtureChecksumManifest
	if err := json.Unmarshal(bytes, &manifest); err != nil {
		t.Fatal(err)
	}
	sum := sha256.Sum256(payload)
	manifest.Files[fileName] = fmt.Sprintf("sha256:%x", sum)
	next, err := json.MarshalIndent(manifest, "", "  ")
	if err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(manifestPath, append(next, '\n'), 0o600); err != nil {
		t.Fatal(err)
	}
}

func readTestFixture(t *testing.T, fileName string) []byte {
	t.Helper()
	bytes, err := os.ReadFile(filepath.Join("testdata/service-fixtures", fileName))
	if err != nil {
		t.Fatal(err)
	}
	return bytes
}

func assertJSONEqual(t *testing.T, expected []byte, actual []byte) {
	t.Helper()
	var expectedValue any
	if err := json.Unmarshal(expected, &expectedValue); err != nil {
		t.Fatal(err)
	}
	var actualValue any
	if err := json.Unmarshal(actual, &actualValue); err != nil {
		t.Fatal(err)
	}
	if !reflect.DeepEqual(expectedValue, actualValue) {
		t.Fatalf("JSON mismatch\nexpected: %s\nactual:   %s", expected, actual)
	}
}

func decodeJSONMap(t *testing.T, raw []byte) map[string]any {
	t.Helper()
	var value map[string]any
	if err := json.Unmarshal(raw, &value); err != nil {
		t.Fatalf("response is not JSON object: %v", err)
	}
	return value
}

func stringField(t *testing.T, value map[string]any, field string) string {
	t.Helper()
	got, ok := value[field].(string)
	if !ok {
		t.Fatalf("missing string field %q", field)
	}
	return got
}

func nestedString(t *testing.T, value map[string]any, path ...string) string {
	t.Helper()
	var current any = value
	for _, field := range path[:len(path)-1] {
		object, ok := current.(map[string]any)
		if !ok {
			t.Fatalf("missing object field before %q", field)
		}
		current = object[field]
	}
	object, ok := current.(map[string]any)
	if !ok {
		t.Fatalf("missing object field before %q", path[len(path)-1])
	}
	return stringField(t, object, path[len(path)-1])
}
