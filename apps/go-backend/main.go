package main

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
)

const serviceAPIVersion = "service-api-v1.8"

type routeSpec struct {
	ID                  string `json:"id"`
	Method              string `json:"method"`
	Pattern             string `json:"path"`
	AuthScope           string `json:"authScope"`
	Privacy             string `json:"privacyClass"`
	SamplePath          string `json:"samplePath"`
	RequiresBearerToken bool   `json:"requiresBearerToken,omitempty"`
}

var routeInventory = []routeSpec{
	{
		ID:         "health",
		Method:     http.MethodGet,
		Pattern:    "/health",
		AuthScope:  "public",
		Privacy:    "public",
		SamplePath: "/health",
	},
	{
		ID:         "getPublicMatchSetSummary",
		Method:     http.MethodGet,
		Pattern:    "/public/matchsets/{matchSetId}/summary",
		AuthScope:  "public",
		Privacy:    "public",
		SamplePath: "/public/matchsets/match-set%3Ago-parity%3Agolden/summary",
	},
	{
		ID:         "getPublicReplayMetadata",
		Method:     http.MethodGet,
		Pattern:    "/public/replays/{matchId}/metadata",
		AuthScope:  "public",
		Privacy:    "public",
		SamplePath: "/public/replays/golden%3Av1-7%3Amatch/metadata",
	},
	{
		ID:         "getPublicStrategyPage",
		Method:     http.MethodGet,
		Pattern:    "/public/strategies/{strategyId}",
		AuthScope:  "public",
		Privacy:    "public",
		SamplePath: "/public/strategies/strategy%3Ago-parity%3Asentinel",
	},
	{
		ID:                  "getAnalyticsRunSummary",
		Method:              http.MethodGet,
		Pattern:             "/analytics/runs/{runId}/summary",
		AuthScope:           "owner",
		Privacy:             "owner",
		SamplePath:          "/analytics/runs/analytics-run%3Aworkshop-v1.6-demo%3A2/summary",
		RequiresBearerToken: true,
	},
}

type Server struct {
	health      json.RawMessage
	notFound    json.RawMessage
	forbidden   json.RawMessage
	matchSet    map[string]json.RawMessage
	replay      map[string]json.RawMessage
	strategy    map[string]json.RawMessage
	analysis    map[string]ownerFixture
	ownerTokens map[string]string
}

type ownerFixture struct {
	body        json.RawMessage
	ownerUserID string
}

func NewServer() *Server {
	server, err := NewServerFromFixtureDir(fixtureDir())
	if err != nil {
		panic(err)
	}
	return server
}

func NewServerFromFixtureDir(dir string) (*Server, error) {
	return NewServerFromFixtureDirWithOwnerTokens(dir, ownerTokensFromEnv())
}

func NewServerFromFixtureDirWithOwnerTokens(dir string, ownerTokens map[string]string) (*Server, error) {
	checksums, err := readFixtureChecksumManifest(dir)
	if err != nil {
		return nil, err
	}
	manifest, err := readRouteManifest(dir, checksums)
	if err != nil {
		return nil, err
	}
	if err := validateRouteManifest(manifest); err != nil {
		return nil, err
	}
	health, err := readValidatedFixture(dir, "health.json", "health", checksums)
	if err != nil {
		return nil, err
	}
	publicMatchSet, err := readValidatedFixture(dir, "public-match-set-summary.json", "publicMatchSetSummary", checksums)
	if err != nil {
		return nil, err
	}
	degradedMatchSet, err := readValidatedFixture(dir, "degraded-match-set-summary.json", "publicMatchSetSummary", checksums)
	if err != nil {
		return nil, err
	}
	replay, err := readValidatedFixture(dir, "public-replay-metadata.json", "publicReplayMetadata", checksums)
	if err != nil {
		return nil, err
	}
	strategy, err := readValidatedFixture(dir, "public-strategy-page.json", "publicStrategyPage", checksums)
	if err != nil {
		return nil, err
	}
	analytics, err := readValidatedFixture(dir, "analytics-run-summary.json", "analyticsRunSummary", checksums)
	if err != nil {
		return nil, err
	}
	notFound, err := readValidatedErrorFixture(dir, "not-found-error.json", checksums)
	if err != nil {
		return nil, err
	}
	forbidden, err := readValidatedErrorFixture(dir, "forbidden-error.json", checksums)
	if err != nil {
		return nil, err
	}

	return &Server{
		health:      health,
		notFound:    notFound,
		forbidden:   forbidden,
		ownerTokens: cloneOwnerTokens(ownerTokens),
		matchSet: map[string]json.RawMessage{
			mustStringField(publicMatchSet, "matchSetId"):   publicMatchSet,
			mustStringField(degradedMatchSet, "matchSetId"): degradedMatchSet,
		},
		replay: map[string]json.RawMessage{
			mustStringField(replay, "matchId"): replay,
		},
		strategy: map[string]json.RawMessage{
			mustPublicStrategyIDField(strategy): strategy,
		},
		analysis: map[string]ownerFixture{
			mustStringField(analytics, "runId"): {
				body:        analytics,
				ownerUserID: mustNestedStringField(analytics, "summary", "ownerUserId"),
			},
		},
	}, nil
}

func (server *Server) routes() http.Handler {
	mux := http.NewServeMux()
	for _, route := range routeInventory {
		switch route.ID {
		case "health":
			mux.HandleFunc(route.Method+" "+route.Pattern, server.healthHandler)
		case "getPublicMatchSetSummary":
			mux.HandleFunc(route.Method+" "+route.Pattern, server.matchSetSummary)
		case "getPublicReplayMetadata":
			mux.HandleFunc(route.Method+" "+route.Pattern, server.replayMetadata)
		case "getPublicStrategyPage":
			mux.HandleFunc(route.Method+" "+route.Pattern, server.publicStrategyPage)
		case "getAnalyticsRunSummary":
			mux.HandleFunc(route.Method+" "+route.Pattern, server.analyticsRunSummary)
		default:
			panic(fmt.Sprintf("unsupported route id %q", route.ID))
		}
	}
	return mux
}

func (server *Server) healthHandler(writer http.ResponseWriter, _ *http.Request) {
	writeJSON(writer, http.StatusOK, server.health)
}

func (server *Server) matchSetSummary(writer http.ResponseWriter, request *http.Request) {
	matchSetID := decodePathValue(request.PathValue("matchSetId"))
	dto, ok := server.matchSet[matchSetID]
	if !ok {
		writeJSON(writer, http.StatusNotFound, server.notFound)
		return
	}
	writeJSON(writer, http.StatusOK, dto)
}

func (server *Server) replayMetadata(writer http.ResponseWriter, request *http.Request) {
	matchID := decodePathValue(request.PathValue("matchId"))
	dto, ok := server.replay[matchID]
	if !ok {
		writeJSON(writer, http.StatusNotFound, server.notFound)
		return
	}
	writeJSON(writer, http.StatusOK, dto)
}

func (server *Server) publicStrategyPage(writer http.ResponseWriter, request *http.Request) {
	strategyID := decodePathValue(request.PathValue("strategyId"))
	dto, ok := server.strategy[strategyID]
	if !ok {
		writeJSON(writer, http.StatusNotFound, server.notFound)
		return
	}
	writeJSON(writer, http.StatusOK, dto)
}

func (server *Server) analyticsRunSummary(writer http.ResponseWriter, request *http.Request) {
	runID := decodePathValue(request.PathValue("runId"))
	ownerUserID, authorized := server.authenticatedOwnerUserID(request)
	if !authorized {
		writeJSON(writer, http.StatusForbidden, server.forbidden)
		return
	}
	dto, ok := server.analysis[runID]
	if !ok {
		writeJSON(writer, http.StatusNotFound, server.notFound)
		return
	}
	if ownerUserID != dto.ownerUserID {
		writeJSON(writer, http.StatusNotFound, server.notFound)
		return
	}
	writeJSON(writer, http.StatusOK, dto.body)
}

func (server *Server) authenticatedOwnerUserID(request *http.Request) (string, bool) {
	const prefix = "Bearer "
	authHeader := request.Header.Get("Authorization")
	if !strings.HasPrefix(authHeader, prefix) {
		return "", false
	}
	ownerUserID, ok := server.ownerTokens[strings.TrimPrefix(authHeader, prefix)]
	return ownerUserID, ok
}

func decodePathValue(value string) string {
	decoded, err := url.PathUnescape(value)
	if err != nil {
		return value
	}
	return decoded
}

func readValidatedFixture(dir string, fileName string, expectedKind string, checksums fixtureChecksumManifest) (json.RawMessage, error) {
	bytes, err := os.ReadFile(filepath.Join(dir, fileName))
	if err != nil {
		return nil, fmt.Errorf("read fixture %s: %w", fileName, err)
	}
	if err := validateFixtureChecksum(fileName, bytes, checksums); err != nil {
		return nil, err
	}
	var value any
	if err := json.Unmarshal(bytes, &value); err != nil {
		return nil, fmt.Errorf("fixture %s is not valid JSON: %w", fileName, err)
	}
	if err := validateNoPrivateKeys(value, "$"); err != nil {
		return nil, fmt.Errorf("fixture %s failed privacy validation: %w", fileName, err)
	}
	if err := validateFixtureShape(bytes, expectedKind); err != nil {
		return nil, fmt.Errorf("fixture %s failed schema validation: %w", fileName, err)
	}
	return json.RawMessage(bytes), nil
}

func readValidatedErrorFixture(dir string, fileName string, checksums fixtureChecksumManifest) (json.RawMessage, error) {
	bytes, err := os.ReadFile(filepath.Join(dir, fileName))
	if err != nil {
		return nil, fmt.Errorf("read fixture %s: %w", fileName, err)
	}
	if err := validateFixtureChecksum(fileName, bytes, checksums); err != nil {
		return nil, err
	}
	var value any
	if err := json.Unmarshal(bytes, &value); err != nil {
		return nil, fmt.Errorf("fixture %s is not valid JSON: %w", fileName, err)
	}
	if err := validateNoPrivateKeys(value, "$"); err != nil {
		return nil, fmt.Errorf("fixture %s failed privacy validation: %w", fileName, err)
	}
	var dto serviceErrorFixture
	if err := decodeStrict(bytes, &dto); err != nil {
		return nil, fmt.Errorf("fixture %s failed schema validation: %w", fileName, err)
	}
	if dto.Code == "" || dto.Message == "" || dto.Status < 400 || !dto.PublicSafe {
		return nil, fmt.Errorf("fixture %s has invalid public error shape", fileName)
	}
	return json.RawMessage(bytes), nil
}

type fixtureChecksumManifest struct {
	SchemaVersion string            `json:"schemaVersion"`
	Files         map[string]string `json:"files"`
}

type serviceHealthFixture struct {
	OK      bool   `json:"ok"`
	Service string `json:"service"`
	Version string `json:"version"`
}

type publicMatchSetSummaryFixture struct {
	APIVersion string         `json:"apiVersion"`
	Kind       string         `json:"kind"`
	MatchSetID string         `json:"matchSetId"`
	Result     map[string]any `json:"result"`
}

type publicReplayMetadataFixture struct {
	APIVersion string         `json:"apiVersion"`
	Kind       string         `json:"kind"`
	MatchID    string         `json:"matchId"`
	Metadata   map[string]any `json:"metadata"`
}

type analyticsRunSummaryFixture struct {
	APIVersion string         `json:"apiVersion"`
	Kind       string         `json:"kind"`
	RunID      string         `json:"runId"`
	ProfileID  string         `json:"profileId"`
	Summary    map[string]any `json:"summary"`
}

type publicStrategyPageFixture struct {
	APIVersion    string         `json:"apiVersion"`
	Kind          string         `json:"kind"`
	Page          string         `json:"page"`
	CanonicalHref string         `json:"canonicalHref"`
	Payload       map[string]any `json:"payload"`
}

type serviceErrorFixture struct {
	Code       string `json:"code"`
	Message    string `json:"message"`
	Status     int    `json:"status"`
	PublicSafe bool   `json:"publicSafe"`
}

func validateFixtureShape(raw []byte, expectedKind string) error {
	switch expectedKind {
	case "health":
		var dto serviceHealthFixture
		if err := decodeStrict(raw, &dto); err != nil {
			return err
		}
		if !dto.OK || dto.Service != "cowards-service" || dto.Version != serviceAPIVersion {
			return fmt.Errorf("invalid health fixture")
		}
	case "publicMatchSetSummary":
		var dto publicMatchSetSummaryFixture
		if err := decodeStrict(raw, &dto); err != nil {
			return err
		}
		if dto.APIVersion != serviceAPIVersion || dto.Kind != expectedKind || dto.MatchSetID == "" || len(dto.Result) == 0 {
			return fmt.Errorf("invalid public MatchSet summary fixture")
		}
	case "publicReplayMetadata":
		var dto publicReplayMetadataFixture
		if err := decodeStrict(raw, &dto); err != nil {
			return err
		}
		if dto.APIVersion != serviceAPIVersion || dto.Kind != expectedKind || dto.MatchID == "" || len(dto.Metadata) == 0 {
			return fmt.Errorf("invalid public replay metadata fixture")
		}
	case "publicStrategyPage":
		var dto publicStrategyPageFixture
		if err := decodeStrict(raw, &dto); err != nil {
			return err
		}
		strategy, ok := dto.Payload["strategy"].(map[string]any)
		if dto.APIVersion != serviceAPIVersion || dto.Kind != "publicPage" || dto.Page != "strategy" || dto.CanonicalHref == "" || !ok {
			return fmt.Errorf("invalid public Strategy page fixture")
		}
		if strategyID, ok := strategy["strategyId"].(string); !ok || strategyID == "" {
			return fmt.Errorf("public Strategy page fixture missing strategy id")
		}
	case "analyticsRunSummary":
		var dto analyticsRunSummaryFixture
		if err := decodeStrict(raw, &dto); err != nil {
			return err
		}
		if dto.APIVersion != serviceAPIVersion || dto.Kind != expectedKind || dto.RunID == "" || dto.ProfileID == "" || len(dto.Summary) == 0 {
			return fmt.Errorf("invalid analytics run summary fixture")
		}
		if ownerUserID, ok := dto.Summary["ownerUserId"].(string); !ok || ownerUserID == "" {
			return fmt.Errorf("analytics summary missing owner user id")
		}
	default:
		return fmt.Errorf("unsupported fixture kind %q", expectedKind)
	}
	return nil
}

func decodeStrict(raw []byte, target any) error {
	decoder := json.NewDecoder(bytes.NewReader(raw))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(target); err != nil {
		return err
	}
	var trailing any
	if err := decoder.Decode(&trailing); !errors.Is(err, io.EOF) {
		return fmt.Errorf("fixture contains trailing JSON")
	}
	return nil
}

func readFixtureChecksumManifest(dir string) (fixtureChecksumManifest, error) {
	bytes, err := os.ReadFile(filepath.Join(dir, "fixture-manifest.json"))
	if err != nil {
		return fixtureChecksumManifest{}, fmt.Errorf("read fixture checksum manifest: %w", err)
	}
	var manifest fixtureChecksumManifest
	if err := decodeStrict(bytes, &manifest); err != nil {
		return fixtureChecksumManifest{}, fmt.Errorf("fixture checksum manifest is not valid: %w", err)
	}
	if manifest.SchemaVersion != expectedFixtureChecksumManifest.SchemaVersion {
		return fixtureChecksumManifest{}, fmt.Errorf("unsupported fixture checksum manifest version")
	}
	if !equalStringMap(manifest.Files, expectedFixtureChecksumManifest.Files) {
		return fixtureChecksumManifest{}, fmt.Errorf("fixture checksum manifest does not match embedded TypeScript reference")
	}
	return expectedFixtureChecksumManifest, nil
}

func validateFixtureChecksum(fileName string, bytes []byte, manifest fixtureChecksumManifest) error {
	expected, ok := manifest.Files[fileName]
	if !ok {
		return fmt.Errorf("fixture checksum missing for %s", fileName)
	}
	sum := sha256.Sum256(bytes)
	actual := fmt.Sprintf("sha256:%x", sum)
	if actual != expected {
		return fmt.Errorf("fixture %s checksum mismatch", fileName)
	}
	return nil
}

func equalStringMap(left map[string]string, right map[string]string) bool {
	if len(left) != len(right) {
		return false
	}
	for key, leftValue := range left {
		if right[key] != leftValue {
			return false
		}
	}
	return true
}

func readRouteManifest(dir string, checksums fixtureChecksumManifest) ([]routeSpec, error) {
	bytes, err := os.ReadFile(filepath.Join(dir, "route-manifest.json"))
	if err != nil {
		return nil, fmt.Errorf("read route manifest: %w", err)
	}
	if err := validateFixtureChecksum("route-manifest.json", bytes, checksums); err != nil {
		return nil, err
	}
	var routes []routeSpec
	if err := json.Unmarshal(bytes, &routes); err != nil {
		return nil, fmt.Errorf("route manifest is not valid: %w", err)
	}
	return routes, nil
}

func validateRouteManifest(manifest []routeSpec) error {
	if len(manifest) != len(routeInventory) {
		return fmt.Errorf("route manifest length mismatch")
	}
	for index, route := range routeInventory {
		expected := manifest[index]
		if route != expected {
			return fmt.Errorf("route manifest mismatch for %s", route.ID)
		}
		if route.Method != http.MethodGet {
			return fmt.Errorf("route %s is not read-only", route.ID)
		}
		if route.AuthScope != "public" && route.AuthScope != "owner" {
			return fmt.Errorf("route %s has unsupported auth scope", route.ID)
		}
		if route.AuthScope == "owner" && !route.RequiresBearerToken {
			return fmt.Errorf("owner route %s does not require a bearer token", route.ID)
		}
	}
	return nil
}

func validateNoPrivateKeys(value any, path string) error {
	forbidden := map[string]bool{
		"source":                  true,
		"strategySource":          true,
		"strategyMemory":          true,
		"soldierMemory":           true,
		"objective":               true,
		"objectivePayload":        true,
		"ownerDebug":              true,
		"exactAwarenessGrid":      true,
		"awarenessGrid":           true,
		"rawRuntimeDetails":       true,
		"privateRuntime":          true,
		"privateDiagnostics":      true,
		"stack":                   true,
		"stackTrace":              true,
		"stderr":                  true,
		"password":                true,
		"passwordHash":            true,
		"token":                   true,
		"tokens":                  true,
		"session":                 true,
		"sessions":                true,
		"hostPath":                true,
		"hostPaths":               true,
		"runtimeInternal":         true,
		"runtimeInternals":        true,
		"privateRuntimeInternal":  true,
		"privateRuntimeInternals": true,
	}
	switch node := value.(type) {
	case []any:
		for index, item := range node {
			if err := validateNoPrivateKeys(item, fmt.Sprintf("%s[%d]", path, index)); err != nil {
				return err
			}
		}
	case map[string]any:
		for key, item := range node {
			if forbidden[key] {
				return fmt.Errorf("private key %s.%s", path, key)
			}
			if err := validateNoPrivateKeys(item, path+"."+key); err != nil {
				return err
			}
		}
	}
	return nil
}

func cloneOwnerTokens(ownerTokens map[string]string) map[string]string {
	cloned := make(map[string]string, len(ownerTokens))
	for token, ownerUserID := range ownerTokens {
		cloned[token] = ownerUserID
	}
	return cloned
}

func ownerTokensFromEnv() map[string]string {
	tokens := map[string]string{}
	raw := os.Getenv("COWARDS_GO_BACKEND_OWNER_TOKENS")
	if raw == "" {
		return tokens
	}
	for _, entry := range strings.Split(raw, ",") {
		token, ownerUserID, ok := strings.Cut(entry, "=")
		if !ok || token == "" || ownerUserID == "" {
			continue
		}
		tokens[token] = ownerUserID
	}
	return tokens
}

func mustStringField(raw json.RawMessage, field string) string {
	var value map[string]any
	if err := json.Unmarshal(raw, &value); err != nil {
		panic(err)
	}
	fieldValue, ok := value[field].(string)
	if !ok || fieldValue == "" {
		panic(fmt.Sprintf("fixture missing string field %q", field))
	}
	return fieldValue
}

func mustNestedStringField(raw json.RawMessage, objectField string, field string) string {
	var value map[string]any
	if err := json.Unmarshal(raw, &value); err != nil {
		panic(err)
	}
	nested, ok := value[objectField].(map[string]any)
	if !ok {
		panic(fmt.Sprintf("fixture missing object field %q", objectField))
	}
	fieldValue, ok := nested[field].(string)
	if !ok || fieldValue == "" {
		panic(fmt.Sprintf("fixture missing string field %q.%q", objectField, field))
	}
	return fieldValue
}

func mustPublicStrategyIDField(raw json.RawMessage) string {
	var value map[string]any
	if err := json.Unmarshal(raw, &value); err != nil {
		panic(err)
	}
	payload, ok := value["payload"].(map[string]any)
	if !ok {
		panic("fixture missing payload")
	}
	strategy, ok := payload["strategy"].(map[string]any)
	if !ok {
		panic("fixture missing payload.strategy")
	}
	strategyID, ok := strategy["strategyId"].(string)
	if !ok || strategyID == "" {
		panic("fixture missing payload.strategy.strategyId")
	}
	return strategyID
}

func writeJSON(writer http.ResponseWriter, status int, value json.RawMessage) {
	writer.Header().Set("Content-Type", "application/json")
	writer.WriteHeader(status)
	if _, err := writer.Write(value); err != nil {
		log.Printf("write response: %v", err)
	}
}

func fixtureDir() string {
	dir := os.Getenv("COWARDS_GO_BACKEND_FIXTURE_DIR")
	if dir == "" {
		return "testdata/service-fixtures"
	}
	return dir
}

func listenAddr() string {
	addr := os.Getenv("COWARDS_GO_BACKEND_ADDR")
	if addr == "" {
		return "127.0.0.1:8087"
	}
	return addr
}

func dataMode() string {
	mode := os.Getenv("COWARDS_GO_BACKEND_DATA_MODE")
	if mode == "" {
		return "fixtures"
	}
	return mode
}

func handlerFromEnv(ctx context.Context) (http.Handler, func(), error) {
	switch dataMode() {
	case "fixtures":
		return NewServer().routes(), func() {}, nil
	case "live":
		server, err := NewLiveServer(ctx, os.Getenv("DATABASE_URL"))
		if err != nil {
			return nil, func() {}, err
		}
		return server.routes(), server.Close, nil
	default:
		return nil, func() {}, fmt.Errorf("unsupported COWARDS_GO_BACKEND_DATA_MODE")
	}
}

func main() {
	handler, closeHandler, err := handlerFromEnv(context.Background())
	if err != nil {
		log.Fatal(err)
	}
	defer closeHandler()
	addr := listenAddr()
	log.Printf("cowards-go-backend listening on http://%s mode=%s", addr, dataMode())
	if err := http.ListenAndServe(addr, handler); !errors.Is(err, http.ErrServerClosed) {
		log.Fatal(err)
	}
}
