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

func TestPublicReadRoutesDecodeIdentifiersWithoutCrossRouteFallback(t *testing.T) {
	tests := []struct {
		name          string
		path          string
		topLevelField string
		nestedField   []string
		expectedValue string
	}{
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
		"/public/matchsets/match-set%3Amissing/summary",
		"/public/replays/match%3Amissing/metadata",
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
