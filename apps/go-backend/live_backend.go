package main

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/scrypt"
)

const sessionCookieName = "cowards_session"
const sessionDuration = 30 * 24 * time.Hour
const strategySourceBytes = 64 * 1024
const exhibitionRateLimit = 5
const exhibitionRateLimitWindow = time.Hour

type LiveServer struct {
	pool              *pgxpool.Pool
	now               func() time.Time
	strategyArtifacts map[string]strategyArtifact
	orchestrator      *goMatchOrchestrator
	stopOrchestrator  context.CancelFunc
}

func NewLiveServer(ctx context.Context, databaseURL string) (*LiveServer, error) {
	if strings.TrimSpace(databaseURL) == "" {
		return nil, errors.New("live Go backend requires DATABASE_URL")
	}
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, fmt.Errorf("create live database pool")
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("connect live database")
	}
	artifacts, err := loadStrategyArtifactManifest(defaultStrategyArtifactManifestPath())
	if err != nil {
		pool.Close()
		return nil, fmt.Errorf("load strategy artifacts: %w", err)
	}
	server := &LiveServer{
		pool:              pool,
		now:               time.Now,
		strategyArtifacts: artifacts,
		orchestrator:      newGoMatchOrchestrator(pool, os.Getenv("COWARDS_RUNTIME_SERVICE_URL")),
	}
	orchestrationMode := strings.TrimSpace(os.Getenv("COWARDS_GO_ORCHESTRATION"))
	runtimeServiceURL := strings.TrimSpace(os.Getenv("COWARDS_RUNTIME_SERVICE_URL"))
	if orchestrationMode != "0" && runtimeServiceURL != "" {
		server.stopOrchestrator = server.orchestrator.start(ctx)
	}
	if orchestrationMode == "1" && runtimeServiceURL == "" {
		pool.Close()
		return nil, errors.New("live Go orchestration requires COWARDS_RUNTIME_SERVICE_URL")
	}
	return server, nil
}

func (server *LiveServer) Close() {
	if server.stopOrchestrator != nil {
		server.stopOrchestrator()
	}
	server.pool.Close()
}

func (server *LiveServer) routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", server.healthHandler)
	mux.HandleFunc("GET /public/strategies/{strategyId}", server.publicStrategyPage)
	mux.HandleFunc("GET /public/players/{handle}", server.publicPlayerPage)
	mux.HandleFunc("GET /public/ladders/{seasonId}", server.publicLadderPage)
	mux.HandleFunc("GET /public/matchsets/{matchSetId}/summary", server.publicMatchSetSummary)
	mux.HandleFunc("GET /public/replays/{matchId}/metadata", server.publicReplayMetadata)
	mux.HandleFunc("GET /public/replays/{matchId}/evidence", server.publicReplayEvidence)
	mux.HandleFunc("GET /auth/session", server.authSession)
	mux.HandleFunc("POST /auth/session", server.signIn)
	mux.HandleFunc("POST /auth/sign-up", server.signUp)
	mux.HandleFunc("DELETE /auth/session", server.signOut)
	mux.HandleFunc("GET /account/strategy-revisions", server.listStrategyRevisions)
	mux.HandleFunc("POST /account/strategy-revisions", server.createStrategyRevision)
	mux.HandleFunc("GET /account/strategy-revisions/{strategyRevisionId}/source", server.strategyRevisionSource)
	mux.HandleFunc("POST /account/starter-forks", server.forkStarterStrategy)
	mux.HandleFunc("POST /account/advanced-forks", server.forkAdvancedStrategy)
	mux.HandleFunc("POST /matchsets", server.createExhibition)
	mux.HandleFunc("POST /internal/match-jobs/run-once", server.runMatchJobOnce)
	return mux
}

func (server *LiveServer) runMatchJobOnce(writer http.ResponseWriter, request *http.Request) {
	token := os.Getenv("COWARDS_GO_BACKEND_INTERNAL_TOKEN")
	if token == "" || request.Header.Get("X-Cowards-Internal-Token") != token {
		writeServiceError(writer, http.StatusForbidden, "FORBIDDEN", "Forbidden.")
		return
	}
	result, err := server.orchestrator.runOnce(request.Context(), nil)
	if err != nil {
		server.orchestrator.logf("manual Go orchestration run failed: %v", err)
		goOrchestrationHTTPError(writer, http.StatusBadGateway)
		return
	}
	writeGoOrchestrationResult(writer, http.StatusOK, result)
}

func (server *LiveServer) healthHandler(writer http.ResponseWriter, _ *http.Request) {
	writeJSONValue(writer, http.StatusOK, map[string]any{
		"ok":      true,
		"service": "cowards-service",
		"version": serviceAPIVersion,
	})
}

type publicUser struct {
	ID          string
	Username    string
	Handle      string
	DisplayName string
	CreatedAt   time.Time
}

type revisionRow struct {
	ID                  string
	StrategyID          string
	StrategyName        string
	StrategyDescription *string
	StrategyTags        []string
	OwnerUserID         string
	OwnerHandle         string
	SourceHash          string
	SourceBytes         int
	Runtime             map[string]any
	Engine              map[string]any
	Validation          map[string]any
	Metadata            map[string]any
	CreatedAt           time.Time
	LockedAt            *time.Time
}

type strategyArtifactManifest struct {
	SchemaVersion string             `json:"schemaVersion"`
	ArtifactCount int                `json:"artifactCount"`
	Artifacts     []strategyArtifact `json:"artifacts"`
}

type strategyArtifact struct {
	ID               string         `json:"id"`
	Kind             string         `json:"kind"`
	SourceVisibility string         `json:"sourceVisibility"`
	ForkEligibility  map[string]any `json:"forkEligibility"`
	Source           struct {
		Text  string `json:"text"`
		Hash  string `json:"hash"`
		Bytes int    `json:"bytes"`
	} `json:"source"`
	Runtime             map[string]any `json:"runtime"`
	EngineCompatibility map[string]any `json:"engineCompatibility"`
	Validation          map[string]any `json:"validation"`
	PublicMetadata      map[string]any `json:"publicMetadata"`
	Lineage             map[string]any `json:"lineage"`
}

type accountRevisionInsert struct {
	UserID              string
	StrategyID          string
	Source              string
	Label               string
	Notes               string
	StrategyName        string
	Metadata            map[string]any
	SourceHash          string
	SourceBytes         int
	Runtime             map[string]any
	EngineCompatibility map[string]any
	Validation          map[string]any
}

func (server *LiveServer) publicStrategyPage(writer http.ResponseWriter, request *http.Request) {
	strategyID := decodePathValue(request.PathValue("strategyId"))
	card, err := server.publicStrategyCard(request.Context(), strategyID)
	if err != nil {
		writeStorageError(writer)
		return
	}
	if card == nil {
		writeServiceError(writer, http.StatusNotFound, "NOT_FOUND", "Strategy not found.")
		return
	}
	writeJSONValue(writer, http.StatusOK, map[string]any{
		"apiVersion":    serviceAPIVersion,
		"kind":          "publicPage",
		"page":          "strategy",
		"canonicalHref": "/strategies/" + urlPathEscape(strategyID),
		"payload": map[string]any{
			"strategy": card,
		},
	})
}

func (server *LiveServer) publicPlayerPage(writer http.ResponseWriter, request *http.Request) {
	handle := strings.TrimPrefix(decodePathValue(request.PathValue("handle")), "@")
	user, err := server.publicUserByHandle(request.Context(), handle)
	if err != nil {
		writeStorageError(writer)
		return
	}
	if user == nil {
		writeServiceError(writer, http.StatusNotFound, "NOT_FOUND", "Player not found.")
		return
	}
	cards, err := server.publicCardsForUser(request.Context(), user.ID)
	if err != nil {
		writeStorageError(writer)
		return
	}
	results, err := server.publicPlayerResults(request.Context(), user.ID)
	if err != nil {
		writeStorageError(writer)
		return
	}
	ladderHistory, err := server.publicPlayerLadderHistory(request.Context(), user.ID)
	if err != nil {
		writeStorageError(writer)
		return
	}
	writeJSONValue(writer, http.StatusOK, map[string]any{
		"apiVersion":    serviceAPIVersion,
		"kind":          "publicPage",
		"page":          "player",
		"canonicalHref": "/players/" + urlPathEscape(user.Handle),
		"payload": map[string]any{
			"handle":        user.Handle,
			"displayName":   user.DisplayName,
			"strategies":    cards,
			"ladderHistory": ladderHistory,
			"results":       results,
		},
	})
}

func (server *LiveServer) publicLadderPage(writer http.ResponseWriter, request *http.Request) {
	seasonID := decodePathValue(request.PathValue("seasonId"))
	season, err := server.publicLadder(request.Context(), seasonID)
	if err != nil {
		writeStorageError(writer)
		return
	}
	if season == nil {
		writeServiceError(writer, http.StatusNotFound, "NOT_FOUND", "Ladder not found.")
		return
	}
	writeJSONValue(writer, http.StatusOK, map[string]any{
		"apiVersion":    serviceAPIVersion,
		"kind":          "publicPage",
		"page":          "ladder",
		"canonicalHref": "/ladder/" + urlPathEscape(stringValue(season, "slug")),
		"payload":       season,
	})
}

func (server *LiveServer) publicMatchSetSummary(writer http.ResponseWriter, request *http.Request) {
	matchSetID := decodePathValue(request.PathValue("matchSetId"))
	result, err := server.publicMatchSetResult(request.Context(), matchSetID)
	if err != nil {
		writeStorageError(writer)
		return
	}
	if result == nil {
		writeServiceError(writer, http.StatusNotFound, "NOT_FOUND", "MatchSet not found.")
		return
	}
	writeJSONValue(writer, http.StatusOK, map[string]any{
		"apiVersion": serviceAPIVersion,
		"kind":       "publicMatchSetSummary",
		"matchSetId": matchSetID,
		"result":     result,
	})
}

func (server *LiveServer) publicReplayMetadata(writer http.ResponseWriter, request *http.Request) {
	matchID := decodePathValue(request.PathValue("matchId"))
	var chronicleID, schemaVersion, hash, bottomPlayerID, topPlayerID, arenaVariantID string
	var eventCount, snapshotCount int
	err := server.pool.QueryRow(request.Context(), `
		select id, schema_version, hash, event_count, snapshot_count,
		       bottom_player_id, top_player_id, arena_variant_id
		from chronicles
		where match_id = $1
	`, matchID).Scan(
		&chronicleID,
		&schemaVersion,
		&hash,
		&eventCount,
		&snapshotCount,
		&bottomPlayerID,
		&topPlayerID,
		&arenaVariantID,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		writeServiceError(writer, http.StatusNotFound, "NOT_FOUND", "Replay metadata not found.")
		return
	}
	if err != nil {
		writeStorageError(writer)
		return
	}
	writeJSONValue(writer, http.StatusOK, map[string]any{
		"apiVersion": serviceAPIVersion,
		"kind":       "publicReplayMetadata",
		"matchId":    matchID,
		"metadata": map[string]any{
			"matchId":        matchID,
			"chronicleId":    chronicleID,
			"hash":           hash,
			"schemaVersion":  schemaVersion,
			"eventCount":     eventCount,
			"snapshotCount":  snapshotCount,
			"bottomPlayerId": bottomPlayerID,
			"topPlayerId":    topPlayerID,
			"arenaVariantId": arenaVariantID,
		},
	})
}

func (server *LiveServer) publicReplayEvidence(writer http.ResponseWriter, request *http.Request) {
	matchID := request.PathValue("matchId")
	result, err := server.publicReplayEvidenceResult(request.Context(), matchID)
	if err != nil {
		writeStorageError(writer)
		return
	}
	if result == nil {
		writeServiceError(writer, http.StatusNotFound, "NOT_FOUND", "Replay evidence not found.")
		return
	}
	writeJSONValue(writer, http.StatusOK, result)
}

func (server *LiveServer) signUp(writer http.ResponseWriter, request *http.Request) {
	var body struct {
		Username    string `json:"username"`
		Password    string `json:"password"`
		Handle      string `json:"handle"`
		DisplayName string `json:"displayName"`
	}
	if !decodeBody(writer, request, &body) {
		return
	}
	username := normalizeUsername(body.Username)
	handle := normalizeHandle(body.Handle)
	if !validUsername(username) || !validUsername(handle) || strings.TrimSpace(body.DisplayName) == "" {
		writeServiceError(writer, http.StatusBadRequest, "VALIDATION_FAILED", "Invalid signup request.")
		return
	}
	passwordHash, err := createPasswordHash(body.Password)
	if err != nil {
		writeServiceError(writer, http.StatusBadRequest, "VALIDATION_FAILED", "Invalid signup request.")
		return
	}
	userID := "user:" + randomID()
	var user publicUser
	err = server.pool.QueryRow(request.Context(), `
		insert into users (id, username, handle, display_name, password_hash)
		values ($1, $2, $3, $4, $5)
		returning id, username, handle, display_name, created_at
	`, userID, username, handle, strings.TrimSpace(body.DisplayName), passwordHash).Scan(
		&user.ID,
		&user.Username,
		&user.Handle,
		&user.DisplayName,
		&user.CreatedAt,
	)
	if err != nil {
		writeServiceError(writer, http.StatusConflict, "VALIDATION_FAILED", "Account could not be created.")
		return
	}
	token, err := server.createSessionToken(request.Context(), user.ID)
	if err != nil {
		writeStorageError(writer)
		return
	}
	setSessionCookie(writer, token)
	writeJSONValue(writer, http.StatusCreated, authSessionDTO(&user))
}

func (server *LiveServer) signIn(writer http.ResponseWriter, request *http.Request) {
	var body struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if !decodeBody(writer, request, &body) {
		return
	}
	user, passwordHash, err := server.userPasswordHash(request.Context(), normalizeUsername(body.Username))
	if errors.Is(err, pgx.ErrNoRows) {
		writeServiceError(writer, http.StatusUnauthorized, "UNAUTHORIZED", "Username or password is incorrect.")
		return
	}
	if err != nil {
		writeStorageError(writer)
		return
	}
	ok, err := verifyPasswordHash(body.Password, passwordHash)
	if err != nil || !ok {
		writeServiceError(writer, http.StatusUnauthorized, "UNAUTHORIZED", "Username or password is incorrect.")
		return
	}
	token, err := server.createSessionToken(request.Context(), user.ID)
	if err != nil {
		writeStorageError(writer)
		return
	}
	setSessionCookie(writer, token)
	writeJSONValue(writer, http.StatusOK, authSessionDTO(user))
}

func (server *LiveServer) signOut(writer http.ResponseWriter, request *http.Request) {
	token := sessionTokenFromRequest(request)
	if token != "" {
		_, err := server.pool.Exec(request.Context(), `
			update user_sessions
			set revoked_at = coalesce(revoked_at, $1)
			where token_hash = $2
		`, server.now(), hashSessionToken(token))
		if err != nil {
			writeStorageError(writer)
			return
		}
	}
	clearSessionCookie(writer)
	writeJSONValue(writer, http.StatusOK, map[string]any{
		"apiVersion": serviceAPIVersion,
		"kind":       "sessionRevoked",
		"revoked":    true,
	})
}

func (server *LiveServer) authSession(writer http.ResponseWriter, request *http.Request) {
	user, err := server.authenticatedUser(request.Context(), request, true)
	if err != nil {
		writeStorageError(writer)
		return
	}
	writeJSONValue(writer, http.StatusOK, authSessionDTO(user))
}

func (server *LiveServer) listStrategyRevisions(writer http.ResponseWriter, request *http.Request) {
	user, err := server.requireUser(writer, request)
	if err != nil || user == nil {
		return
	}
	revisions, err := server.accountRevisionSummaries(request.Context(), user.ID)
	if err != nil {
		writeStorageError(writer)
		return
	}
	writeJSONValue(writer, http.StatusOK, map[string]any{
		"apiVersion": serviceAPIVersion,
		"kind":       "strategyRevisionList",
		"revisions":  revisions,
	})
}

func (server *LiveServer) strategyRevisionSource(writer http.ResponseWriter, request *http.Request) {
	user, err := server.requireUser(writer, request)
	if err != nil || user == nil {
		return
	}
	revisionID := decodePathValue(request.PathValue("strategyRevisionId"))
	var source, sourceHash string
	err = server.pool.QueryRow(request.Context(), `
		select sr.source, sr.source_hash
		from strategy_revisions sr
		join strategies s on s.id = sr.strategy_id
		where sr.id = $1 and s.owner_user_id = $2
	`, revisionID, user.ID).Scan(&source, &sourceHash)
	if errors.Is(err, pgx.ErrNoRows) {
		writeServiceError(writer, http.StatusNotFound, "NOT_FOUND", "Strategy Revision source not found.")
		return
	}
	if err != nil {
		writeStorageError(writer)
		return
	}
	writer.Header().Set("Cache-Control", "private, no-store")
	writePrivateJSONValue(writer, http.StatusOK, map[string]any{
		"apiVersion":         serviceAPIVersion,
		"kind":               "strategyRevisionSource",
		"strategyRevisionId": revisionID,
		"source":             source,
		"sourceHash":         sourceHash,
	})
}

func (server *LiveServer) createStrategyRevision(writer http.ResponseWriter, request *http.Request) {
	user, err := server.requireUser(writer, request)
	if err != nil || user == nil {
		return
	}
	var body struct {
		StrategyID string `json:"strategyId"`
		Source     string `json:"source"`
		Label      string `json:"label"`
		Notes      string `json:"notes"`
		StarterID  string `json:"starterId"`
		AdvancedID string `json:"advancedId"`
	}
	if !decodeBody(writer, request, &body) {
		return
	}
	input := accountRevisionInsert{
		UserID:     user.ID,
		StrategyID: body.StrategyID,
		Source:     body.Source,
		Label:      body.Label,
		Notes:      body.Notes,
	}
	if artifact, ok := server.matchSubmittedArtifact(body.Source, body.StarterID, "starter"); ok {
		input.applyArtifact(artifact)
	}
	if artifact, ok := server.matchSubmittedArtifact(body.Source, body.AdvancedID, "advanced"); ok {
		input.applyArtifact(artifact)
	}
	revision, err := server.insertAccountRevision(request.Context(), input)
	if err != nil {
		writeServiceError(writer, http.StatusBadRequest, "VALIDATION_FAILED", "Strategy Revision could not be saved.")
		return
	}
	writeJSONValue(writer, http.StatusCreated, map[string]any{
		"apiVersion":         serviceAPIVersion,
		"kind":               "strategyRevisionCreated",
		"strategyId":         revision["strategyId"],
		"strategyRevisionId": revision["strategyRevisionId"],
		"validationStatus":   revision["validationStatus"],
	})
}

func (server *LiveServer) forkStarterStrategy(writer http.ResponseWriter, request *http.Request) {
	user, err := server.requireUser(writer, request)
	if err != nil || user == nil {
		return
	}
	var body struct {
		StarterID string `json:"starterId"`
	}
	if !decodeBody(writer, request, &body) {
		return
	}
	artifact, err := server.forkableStrategyArtifact("starter", body.StarterID)
	if err != nil {
		writeServiceError(writer, http.StatusBadRequest, "VALIDATION_FAILED", "Starter Strategy could not be forked.")
		return
	}
	revision, err := server.insertAccountRevision(request.Context(), artifact.accountRevisionInsert(user.ID))
	if err != nil {
		writeServiceError(writer, http.StatusBadRequest, "VALIDATION_FAILED", "Starter Strategy could not be forked.")
		return
	}
	writeJSONValue(writer, http.StatusCreated, map[string]any{
		"apiVersion":         serviceAPIVersion,
		"kind":               "strategyRevisionCreated",
		"strategyId":         revision["strategyId"],
		"strategyRevisionId": revision["strategyRevisionId"],
		"validationStatus":   revision["validationStatus"],
	})
}

func (server *LiveServer) forkAdvancedStrategy(writer http.ResponseWriter, request *http.Request) {
	user, err := server.requireUser(writer, request)
	if err != nil || user == nil {
		return
	}
	var body struct {
		AdvancedID string `json:"advancedId"`
	}
	if !decodeBody(writer, request, &body) {
		return
	}
	artifact, err := server.forkableStrategyArtifact("advanced", body.AdvancedID)
	if err != nil {
		writeServiceError(writer, http.StatusBadRequest, "VALIDATION_FAILED", "Advanced Strategy could not be forked.")
		return
	}
	revision, err := server.insertAccountRevision(request.Context(), artifact.accountRevisionInsert(user.ID))
	if err != nil {
		writeServiceError(writer, http.StatusBadRequest, "VALIDATION_FAILED", "Advanced Strategy could not be forked.")
		return
	}
	writeJSONValue(writer, http.StatusCreated, map[string]any{
		"apiVersion":         serviceAPIVersion,
		"kind":               "strategyRevisionCreated",
		"strategyId":         revision["strategyId"],
		"strategyRevisionId": revision["strategyRevisionId"],
		"validationStatus":   revision["validationStatus"],
	})
}

func (server *LiveServer) forkableStrategyArtifact(kind string, artifactID string) (strategyArtifact, error) {
	normalizedID := normalizeStrategyArtifactID(kind, artifactID)
	artifact, ok := server.strategyArtifacts[normalizedID]
	if !ok {
		return strategyArtifact{}, errors.New("strategy artifact not found")
	}
	if artifact.Kind != kind || artifact.SourceVisibility != "built-in-forkable" || !boolValue(artifact.ForkEligibility, "forkable") {
		return strategyArtifact{}, errors.New("strategy artifact is not forkable")
	}
	if !boolValue(artifact.Validation, "valid") || artifact.Source.Text == "" || artifact.Source.Hash == "" {
		return strategyArtifact{}, errors.New("strategy artifact is not valid")
	}
	if artifact.Source.Bytes != len([]byte(artifact.Source.Text)) || intValue(artifact.Validation, "sourceBytes") != artifact.Source.Bytes {
		return strategyArtifact{}, errors.New("strategy artifact source bytes drift")
	}
	if stringValue(artifact.Validation, "sourceHash") != artifact.Source.Hash || artifact.Source.Hash != hashString(artifact.Source.Text) {
		return strategyArtifact{}, errors.New("strategy artifact source hash drift")
	}
	if !runtimeAllowsCountedPlay(artifact.Runtime) {
		return strategyArtifact{}, errors.New("strategy artifact runtime is not counted-play eligible")
	}
	return artifact, nil
}

func (server *LiveServer) matchSubmittedArtifact(source string, artifactID string, kind string) (strategyArtifact, bool) {
	if artifactID == "" {
		return strategyArtifact{}, false
	}
	artifact, err := server.forkableStrategyArtifact(kind, artifactID)
	if err != nil {
		return strategyArtifact{}, false
	}
	if artifact.Source.Hash != hashString(source) {
		return strategyArtifact{}, false
	}
	return artifact, true
}

func (artifact strategyArtifact) accountRevisionInsert(userID string) accountRevisionInsert {
	input := accountRevisionInsert{
		UserID:              userID,
		Source:              artifact.Source.Text,
		Label:               stringValue(artifact.PublicMetadata, "name"),
		Notes:               stringValue(artifact.PublicMetadata, "description"),
		StrategyName:        stringValue(artifact.PublicMetadata, "name"),
		Metadata:            map[string]any{},
		SourceHash:          artifact.Source.Hash,
		SourceBytes:         artifact.Source.Bytes,
		Runtime:             cloneMap(artifact.Runtime),
		EngineCompatibility: cloneMap(artifact.EngineCompatibility),
		Validation:          cloneMap(artifact.Validation),
	}
	if tags := stringSliceFromAny(artifact.PublicMetadata["tags"]); len(tags) > 0 {
		input.Metadata["tags"] = tags
	}
	copyOptional(input.Metadata, artifact.Lineage, "starterLineage")
	copyOptional(input.Metadata, artifact.Lineage, "advancedLineage")
	return input
}

func (input *accountRevisionInsert) applyArtifact(artifact strategyArtifact) {
	if input.Source == "" {
		input.Source = artifact.Source.Text
	}
	if input.Label == "" {
		input.Label = stringValue(artifact.PublicMetadata, "name")
	}
	if input.Notes == "" {
		input.Notes = stringValue(artifact.PublicMetadata, "description")
	}
	if input.StrategyName == "" {
		input.StrategyName = stringValue(artifact.PublicMetadata, "name")
	}
	if input.Metadata == nil {
		input.Metadata = map[string]any{}
	}
	if tags := stringSliceFromAny(artifact.PublicMetadata["tags"]); len(tags) > 0 {
		input.Metadata["tags"] = tags
	}
	copyOptional(input.Metadata, artifact.Lineage, "starterLineage")
	copyOptional(input.Metadata, artifact.Lineage, "advancedLineage")
	input.SourceHash = artifact.Source.Hash
	input.SourceBytes = artifact.Source.Bytes
	input.Runtime = cloneMap(artifact.Runtime)
	input.EngineCompatibility = cloneMap(artifact.EngineCompatibility)
	input.Validation = cloneMap(artifact.Validation)
}

func (server *LiveServer) createExhibition(writer http.ResponseWriter, request *http.Request) {
	user, err := server.requireUser(writer, request)
	if err != nil || user == nil {
		return
	}
	var body struct {
		PresetID           string   `json:"presetId"`
		RevisionIDs        []string `json:"revisionIds"`
		EntrantRevisionIDs []string `json:"entrantRevisionIds"`
	}
	if !decodeBody(writer, request, &body) {
		return
	}
	revisionIDs := body.EntrantRevisionIDs
	if len(revisionIDs) == 0 {
		revisionIDs = body.RevisionIDs
	}
	result, err := server.createExhibitionMatchSet(request.Context(), user.ID, body.PresetID, revisionIDs)
	if err != nil {
		if errors.Is(err, errRateLimited) {
			writeServiceError(writer, http.StatusTooManyRequests, "VALIDATION_FAILED", "Too many exhibition creates. Retry later.")
			return
		}
		if errors.Is(err, errActiveDuplicate) {
			writeServiceError(writer, http.StatusConflict, "VALIDATION_FAILED", "An active duplicate exhibition already exists.")
			return
		}
		writeServiceError(writer, http.StatusBadRequest, "VALIDATION_FAILED", "Exhibition could not be created.")
		return
	}
	writeJSONValue(writer, http.StatusCreated, result)
}

func (server *LiveServer) publicUserByHandle(ctx context.Context, handle string) (*publicUser, error) {
	var user publicUser
	err := server.pool.QueryRow(ctx, `
		select id, username, handle, display_name, created_at
		from users
		where lower(handle) = lower($1)
	`, strings.TrimPrefix(handle, "@")).Scan(
		&user.ID,
		&user.Username,
		&user.Handle,
		&user.DisplayName,
		&user.CreatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return &user, err
}

func (server *LiveServer) publicStrategyCard(ctx context.Context, strategyID string) (map[string]any, error) {
	rows, err := server.publicCards(ctx, "s.id = $1", strategyID)
	if err != nil || len(rows) == 0 {
		return nil, err
	}
	return rows[0], nil
}

func (server *LiveServer) publicCardsForUser(ctx context.Context, userID string) ([]map[string]any, error) {
	return server.publicCards(ctx, "s.owner_user_id = $1", userID)
}

func (server *LiveServer) publicCards(ctx context.Context, where string, arg string) ([]map[string]any, error) {
	rows, err := server.pool.Query(ctx, `
		select distinct on (s.id)
			s.id,
			s.name,
			s.description,
			coalesce(to_json(s.public_tags), '[]'::json),
			s.owner_user_id,
			u.handle,
			sr.id,
			sr.source_hash,
			sr.source_bytes,
			sr.runtime,
			sr.engine_compatibility,
			sr.validation,
			sr.metadata,
			sr.created_at,
			sr.locked_at
		from strategies s
		join users u on u.id = s.owner_user_id
		join strategy_revisions sr on sr.strategy_id = s.id
		where `+where+`
		order by s.id, sr.created_at desc, sr.id desc
	`, arg)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	cards := []map[string]any{}
	for rows.Next() {
		var row revisionRow
		var tagsRaw, runtimeRaw, engineRaw, validationRaw, metadataRaw []byte
		if err := rows.Scan(
			&row.StrategyID,
			&row.StrategyName,
			&row.StrategyDescription,
			&tagsRaw,
			&row.OwnerUserID,
			&row.OwnerHandle,
			&row.ID,
			&row.SourceHash,
			&row.SourceBytes,
			&runtimeRaw,
			&engineRaw,
			&validationRaw,
			&metadataRaw,
			&row.CreatedAt,
			&row.LockedAt,
		); err != nil {
			return nil, err
		}
		row.StrategyTags = jsonStringArray(tagsRaw)
		row.Runtime = jsonMap(runtimeRaw)
		row.Engine = jsonMap(engineRaw)
		row.Validation = jsonMap(validationRaw)
		row.Metadata = jsonMap(metadataRaw)
		cards = append(cards, row.publicCard())
	}
	return cards, rows.Err()
}

func (row revisionRow) publicCard() map[string]any {
	tags := row.StrategyTags
	if len(tags) == 0 {
		tags = stringSliceFromAny(row.Metadata["tags"])
	}
	card := map[string]any{
		"strategyId":          row.StrategyID,
		"strategyRevisionId":  row.ID,
		"name":                row.StrategyName,
		"tags":                tags,
		"authorHandle":        row.OwnerHandle,
		"sourceHash":          row.SourceHash,
		"sourceBytes":         row.SourceBytes,
		"runtime":             publicRuntimeMetadata(row.Runtime),
		"engineCompatibility": row.Engine,
		"validationStatus":    validationStatus(row.Validation),
		"record": map[string]any{
			"wins":   0,
			"losses": 0,
			"draws":  0,
			"points": 0,
		},
		"resultLinks": []string{},
		"replayLinks": []string{},
	}
	if row.StrategyDescription != nil && *row.StrategyDescription != "" {
		card["description"] = *row.StrategyDescription
	}
	copyOptional(card, row.Metadata, "starterLineage")
	copyOptional(card, row.Metadata, "advancedLineage")
	return card
}

func (server *LiveServer) publicPlayerResults(ctx context.Context, userID string) ([]map[string]any, error) {
	rows, err := server.pool.Query(ctx, `
		select distinct ms.id, coalesce(ms.ladder_season_id, ''), ms.status,
		       ms.counted_status, ms.public_counted_reason, ms.public_counted_explanation
		from match_sets ms
		join competition_entrants ce on ce.match_set_id = ms.id
		where ce.owner_user_id = $1
		  and ms.ladder_season_id is not null
		order by ms.id desc
		limit 20
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	results := []map[string]any{}
	for rows.Next() {
		var matchSetID, seasonID, status, countedStatus string
		var reason, explanation *string
		if err := rows.Scan(&matchSetID, &seasonID, &status, &countedStatus, &reason, &explanation); err != nil {
			return nil, err
		}
		result := ladderMatchSetSummary(matchSetID, seasonID, status, countedStatus, reason, explanation, []string{})
		results = append(results, result)
	}
	return results, rows.Err()
}

func (server *LiveServer) publicPlayerLadderHistory(ctx context.Context, userID string) ([]map[string]any, error) {
	rows, err := server.pool.Query(ctx, `
		select s.id, s.name, e.status
		from trial_ladder_entries e
		join trial_ladder_seasons s on s.id = e.season_id
		where e.owner_user_id = $1
		order by s.created_at desc, e.created_at desc
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	history := []map[string]any{}
	for rows.Next() {
		var seasonID, seasonName, status string
		if err := rows.Scan(&seasonID, &seasonName, &status); err != nil {
			return nil, err
		}
		history = append(history, map[string]any{
			"seasonId":    seasonID,
			"seasonName":  seasonName,
			"entryStatus": status,
			"points":      0,
		})
	}
	return history, rows.Err()
}

func (server *LiveServer) publicLadder(ctx context.Context, seasonIDOrSlug string) (map[string]any, error) {
	var seasonID, slug, name, status, seed, stalePolicy string
	var description *string
	var minEntries, targetPodSize int
	err := server.pool.QueryRow(ctx, `
		select id, slug, name, description, status, season_seed,
		       minimum_entries, target_pod_size, stale_revision_policy
		from trial_ladder_seasons
		where id = $1 or slug = $1
	`, seasonIDOrSlug).Scan(&seasonID, &slug, &name, &description, &status, &seed, &minEntries, &targetPodSize, &stalePolicy)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	entries, err := server.ladderEntries(ctx, seasonID)
	if err != nil {
		return nil, err
	}
	matchSets, standings, err := server.ladderMatchSetsAndStandings(ctx, seasonID, entries)
	if err != nil {
		return nil, err
	}
	dto := map[string]any{
		"seasonId":    seasonID,
		"slug":        slug,
		"name":        name,
		"status":      status,
		"statusLabel": trialLadderStatusLabel(status),
		"seasonSeed":  seed,
		"policy": map[string]any{
			"oneEntryPerUser":     true,
			"replacementPolicy":   "next-season-only",
			"staleRevisionPolicy": stalePolicy,
			"standingsReset":      true,
			"noPermanentRatings":  true,
			"minimumEntries":      minEntries,
			"targetPodSize":       targetPodSize,
		},
		"entries":   entries,
		"standings": standings,
		"matchSets": matchSets,
		"publication": map[string]any{
			"publicEntries":        true,
			"publicStandings":      true,
			"publicReplayEvidence": true,
			"privateFieldsExcluded": []string{
				"Strategy source",
				"StrategyMemory",
				"SoldierMemory",
				"objective payloads",
				"owner debug",
				"private runtime internals",
			},
		},
	}
	if description != nil && *description != "" {
		dto["description"] = *description
	}
	return dto, nil
}

func (server *LiveServer) ladderEntries(ctx context.Context, seasonID string) ([]map[string]any, error) {
	rows, err := server.pool.Query(ctx, `
		select snapshot, status
		from trial_ladder_entries
		where season_id = $1
		order by entry_index asc
	`, seasonID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	entries := []map[string]any{}
	for rows.Next() {
		var snapshotRaw []byte
		var status string
		if err := rows.Scan(&snapshotRaw, &status); err != nil {
			return nil, err
		}
		entry := jsonMap(snapshotRaw)
		entry["status"] = status
		entries = append(entries, entry)
	}
	return entries, rows.Err()
}

func (server *LiveServer) ladderMatchSetsAndStandings(ctx context.Context, seasonID string, entries []map[string]any) ([]map[string]any, []map[string]any, error) {
	rows, err := server.pool.Query(ctx, `
		select
		  ms.id,
		  ms.status::text,
		  ms.ladder_schedule_run_id,
		  ms.ladder_pod_index,
		  ms.counted_status,
		  ms.public_counted_reason,
		  ms.public_counted_explanation,
		  count(distinct c.match_id)::integer as chronicle_count,
		  count(distinct msm.match_id)::integer as match_count
		from match_sets ms
		left join match_set_matches msm on msm.match_set_id = ms.id
		left join chronicles c on c.match_id = msm.match_id
		where ms.ladder_season_id = $1
		group by ms.id
		order by ms.created_at asc, ms.id asc
	`, seasonID)
	if err != nil {
		return nil, nil, err
	}
	defer rows.Close()
	matchSets := []map[string]any{}
	totals := map[string]*matchSetStrategyScore{}
	for rows.Next() {
		var matchSetID, status, countedStatus string
		var scheduleRunID *string
		var podIndex *int
		var reason, explanation *string
		var chronicleCount, matchCount int
		if err := rows.Scan(&matchSetID, &status, &scheduleRunID, &podIndex, &countedStatus, &reason, &explanation, &chronicleCount, &matchCount); err != nil {
			return nil, nil, err
		}
		refreshedStatus, refreshedScoring, err := newMatchSetStatusService(server.pool).refreshMatchSetStatus(ctx, matchSetID)
		if err != nil {
			return nil, nil, err
		}
		classification := classifyLadderCountedStatus(refreshedStatus, countedStatus, reason, explanation, chronicleCount, matchCount)
		if stringValue(classification, "countedStatus") == "counted" {
			for _, ranking := range refreshedScoring.Rankings {
				addMatchSetScore(totals, ranking)
			}
		}
		entrantIDs, err := server.ladderMatchSetEntrantIDs(ctx, matchSetID)
		if err != nil {
			return nil, nil, err
		}
		summary := ladderMatchSetSummary(matchSetID, seasonID, refreshedStatus, stringValue(classification, "countedStatus"), stringPtrFromMap(classification, "publicReason"), stringPtrFromMap(classification, "publicExplanation"), entrantIDs)
		if scheduleRunID != nil && *scheduleRunID != "" {
			summary["scheduleRunId"] = *scheduleRunID
		}
		if podIndex != nil {
			summary["podIndex"] = *podIndex
		}
		matchSets = append(matchSets, summary)
	}
	if err := rows.Err(); err != nil {
		return nil, nil, err
	}
	return matchSets, ladderStandingsFromScores(totals, entries), nil
}

func (server *LiveServer) ladderMatchSetEntrantIDs(ctx context.Context, matchSetID string) ([]string, error) {
	rows, err := server.pool.Query(ctx, `
		select snapshot
		from competition_entrants
		where match_set_id = $1
		order by entrant_index asc
	`, matchSetID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	entrantIDs := []string{}
	for rows.Next() {
		var snapshotRaw []byte
		if err := rows.Scan(&snapshotRaw); err != nil {
			return nil, err
		}
		snapshot := jsonMap(snapshotRaw)
		entrantIDs = append(entrantIDs, fallbackString(stringValue(snapshot, "entryId"), stringValue(snapshot, "entrantId")))
	}
	return entrantIDs, rows.Err()
}

func classifyLadderCountedStatus(status string, storedCountedStatus string, storedReason *string, storedExplanation *string, chronicleCount int, matchCount int) map[string]any {
	if storedCountedStatus != "" && storedCountedStatus != "pending" {
		result := map[string]any{
			"countedStatus": storedCountedStatus,
			"publicExplanation": func() string {
				if storedCountedStatus == "under_review" {
					return "Result is under review and excluded until review completes."
				}
				return valueOr(storedExplanation, "Result does not count for standings.")
			}(),
		}
		if storedReason != nil && *storedReason != "" {
			result["publicReason"] = *storedReason
		}
		return result
	}
	if status == matchSetStatusComplete && matchCount > 0 && chronicleCount == matchCount {
		return map[string]any{
			"countedStatus":     "counted",
			"publicExplanation": "Counts for trial ladder standings.",
		}
	}
	if status == matchSetStatusFailedSystem || status == matchSetStatusDegraded {
		return map[string]any{
			"countedStatus":     "non_counted",
			"publicReason":      "system_failure",
			"publicExplanation": "System failure prevented complete evidence; this result is excluded.",
		}
	}
	countedStatus := "pending"
	if status == matchSetStatusRunning {
		countedStatus = "retrying"
	}
	return map[string]any{
		"countedStatus":     countedStatus,
		"publicReason":      "incomplete_evidence",
		"publicExplanation": "Waiting for complete replay-backed evidence.",
	}
}

func stringPtrFromMap(value map[string]any, key string) *string {
	text := stringValue(value, key)
	if text == "" {
		return nil
	}
	return &text
}

func addMatchSetScore(totals map[string]*matchSetStrategyScore, entry matchSetStrategyScore) {
	current := totals[entry.StrategyRevisionID]
	if current == nil {
		current = &matchSetStrategyScore{
			StrategyRevisionID: entry.StrategyRevisionID,
			Penalties:          []scorePenalty{},
		}
		totals[entry.StrategyRevisionID] = current
	}
	current.Wins += entry.Wins
	current.Losses += entry.Losses
	current.Draws += entry.Draws
	current.Points += entry.Points
	current.PenaltyPoints += entry.PenaltyPoints
	current.Penalties = append(current.Penalties, entry.Penalties...)
	current.FailedSystemMatches += entry.FailedSystemMatches
	current.SurvivingSoldiers += entry.SurvivingSoldiers
	current.SurvivalTurns += entry.SurvivalTurns
}

func ladderStandingsFromScores(totals map[string]*matchSetStrategyScore, entries []map[string]any) []map[string]any {
	rankings := make([]matchSetStrategyScore, 0, len(totals))
	for _, ranking := range totals {
		rankings = append(rankings, *ranking)
	}
	sort.Slice(rankings, func(leftIndex, rightIndex int) bool {
		left := rankings[leftIndex]
		right := rankings[rightIndex]
		if left.Points != right.Points {
			return left.Points > right.Points
		}
		if left.Wins != right.Wins {
			return left.Wins > right.Wins
		}
		if left.SurvivingSoldiers != right.SurvivingSoldiers {
			return left.SurvivingSoldiers > right.SurvivingSoldiers
		}
		if left.SurvivalTurns != right.SurvivalTurns {
			return left.SurvivalTurns > right.SurvivalTurns
		}
		return left.StrategyRevisionID < right.StrategyRevisionID
	})

	entryByRevision := map[string]map[string]any{}
	for _, entry := range entries {
		entryByRevision[stringValue(entry, "strategyRevisionId")] = entry
	}
	standings := []map[string]any{}
	for index, ranking := range rankings {
		entry := entryByRevision[ranking.StrategyRevisionID]
		standings = append(standings, map[string]any{
			"rank":               index + 1,
			"entrantId":          fallbackString(stringValue(entry, "entryId"), ranking.StrategyRevisionID),
			"strategyRevisionId": ranking.StrategyRevisionID,
			"ownerHandle":        fallbackString(stringValue(entry, "ownerHandle"), "unknown"),
			"displayLabel":       fallbackString(stringValue(entry, "displayLabel"), ranking.StrategyRevisionID),
			"sourceHash":         stringValue(entry, "sourceHash"),
			"points":             ranking.Points,
			"wins":               ranking.Wins,
			"draws":              ranking.Draws,
			"losses":             ranking.Losses,
			"penalties":          publicPenaltiesFromScorePenalties(ranking.Penalties),
			"survivingSoldiers":  ranking.SurvivingSoldiers,
			"survivalTurns":      ranking.SurvivalTurns,
			"tieBreakerPath":     []string{"points", "wins", "survivingSoldiers", "survivalTurns", "strategyRevisionId"},
		})
	}
	return standings
}

func (server *LiveServer) publicMatchSetResult(ctx context.Context, matchSetID string) (map[string]any, error) {
	if ok, err := server.publicCompetitionMatchSetExists(ctx, matchSetID); err != nil {
		return nil, err
	} else if !ok {
		return nil, nil
	}
	if _, _, err := newMatchSetStatusService(server.pool).refreshMatchSetStatus(ctx, matchSetID); err != nil {
		return nil, err
	}
	var status string
	var competitionPresetID, competitionPresetVersion, scoringPolicyVersion, visibility *string
	var scoringRaw []byte
	err := server.pool.QueryRow(ctx, `
		select status, competition_preset_id, competition_preset_version,
		       scoring_policy_version, visibility, scoring
		from match_sets
		where id = $1
	`, matchSetID).Scan(&status, &competitionPresetID, &competitionPresetVersion, &scoringPolicyVersion, &visibility, &scoringRaw)
	if errors.Is(err, pgx.ErrNoRows) || competitionPresetID == nil {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	entrants, err := server.matchSetEntrants(ctx, matchSetID)
	if err != nil {
		return nil, err
	}
	matches, err := server.matchSetEvidence(ctx, matchSetID, entrants)
	if err != nil {
		return nil, err
	}
	return map[string]any{
		"matchSetId": matchSetID,
		"preset": map[string]any{
			"id":      *competitionPresetID,
			"version": valueOr(competitionPresetVersion, "v1"),
			"label":   competitionPresetLabel(*competitionPresetID),
		},
		"status":     mapMatchSetStatus(status),
		"visibility": valueOr(visibility, "public"),
		"scoringPolicy": map[string]any{
			"id":                           "exhibition-points-v1",
			"version":                      "v1",
			"winPoints":                    3,
			"drawPoints":                   1,
			"lossPoints":                   0,
			"strategyFailurePenaltyPoints": -1,
		},
		"entrants":  entrants,
		"standings": standingsFromScoring(scoringRaw, entrants),
		"matches":   matches,
		"provenance": map[string]any{
			"matchSetId":           matchSetID,
			"presetId":             *competitionPresetID,
			"scoringPolicyVersion": valueOr(scoringPolicyVersion, "v1"),
			"entrantSnapshotIds":   []string{},
			"chronicleHashes":      []string{},
		},
		"publication": map[string]any{
			"publicResults":        true,
			"publicReplayEvidence": true,
			"privateFieldsExcluded": []string{
				"Strategy source",
				"StrategyMemory",
				"SoldierMemory",
				"objective payloads",
			},
		},
	}, nil
}

func (server *LiveServer) publicCompetitionMatchSetExists(ctx context.Context, matchSetID string) (bool, error) {
	var competitionPresetID *string
	if err := server.pool.QueryRow(ctx, "select competition_preset_id from match_sets where id = $1", matchSetID).Scan(&competitionPresetID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return false, nil
		}
		return false, err
	}
	return competitionPresetID != nil && *competitionPresetID != "", nil
}

func (server *LiveServer) publicReplayEvidenceResult(ctx context.Context, matchID string) (map[string]any, error) {
	resolvedMatchID := decodePathValue(matchID)
	var row struct {
		chronicleID    string
		schemaVersion  string
		hash           string
		outcome        []byte
		eventCount     int
		snapshotCount  int
		bottomPlayerID string
		topPlayerID    string
		arenaVariantID string
		artifact       []byte
	}
	err := server.pool.QueryRow(ctx, `
		select id, schema_version, hash, outcome, event_count, snapshot_count,
		       bottom_player_id, top_player_id, arena_variant_id, artifact
		from chronicles
		where match_id = $1
	`, resolvedMatchID).Scan(&row.chronicleID, &row.schemaVersion, &row.hash, &row.outcome, &row.eventCount, &row.snapshotCount, &row.bottomPlayerID, &row.topPlayerID, &row.arenaVariantID, &row.artifact)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	var artifact map[string]any
	if err := json.Unmarshal(row.artifact, &artifact); err != nil {
		return nil, err
	}
	var outcome any
	if err := json.Unmarshal(row.outcome, &outcome); err != nil {
		return nil, err
	}
	return map[string]any{
		"apiVersion": serviceAPIVersion,
		"kind":       "publicReplayEvidence",
		"matchId":    resolvedMatchID,
		"metadata": map[string]any{
			"matchId":        resolvedMatchID,
			"chronicleId":    row.chronicleID,
			"hash":           row.hash,
			"schemaVersion":  row.schemaVersion,
			"eventCount":     row.eventCount,
			"snapshotCount":  row.snapshotCount,
			"outcome":        outcome,
			"bottomPlayerId": row.bottomPlayerID,
			"topPlayerId":    row.topPlayerID,
			"arenaVariantId": row.arenaVariantID,
		},
		"projection": publicReplayProjectionFromChronicle(artifact),
	}, nil
}

func publicReplayProjectionFromChronicle(chronicle map[string]any) map[string]any {
	return map[string]any{
		"schemaVersion":   stringValue(chronicle, "schemaVersion"),
		"viewer":          map[string]any{"access": "public"},
		"reproducibility": sanitizePublicReplayJSON(chronicle["reproducibility"]),
		"events":          publicReplayEvents(sliceValue(chronicle, "events")),
		"snapshots":       sanitizePublicReplayJSON(sliceValue(chronicle, "snapshots")),
	}
}

func publicReplayEvents(events []any) []map[string]any {
	projected := []map[string]any{}
	for _, event := range events {
		row, ok := event.(map[string]any)
		if !ok {
			continue
		}
		projected = append(projected, map[string]any{
			"type":     stringValue(row, "type"),
			"sequence": runtimeServiceIntValue(row, "sequence"),
			"context":  sanitizePublicReplayJSON(row["context"]),
			"payload":  publicReplayEventPayload(row),
		})
	}
	return projected
}

func publicReplayEventPayload(event map[string]any) any {
	payload := mapValue(event, "payload")
	if stringValue(event, "type") != "RUNTIME_VIOLATION" {
		return sanitizePublicReplayJSON(payload)
	}
	result := map[string]any{}
	for _, key := range []string{"type", "category", "playerId", "ownerPlayerId", "soldierId"} {
		if value := stringValue(payload, key); value != "" {
			result[key] = value
		}
	}
	return result
}

func sanitizePublicReplayJSON(value any) any {
	switch typed := value.(type) {
	case []any:
		items := make([]any, 0, len(typed))
		for _, item := range typed {
			items = append(items, sanitizePublicReplayJSON(item))
		}
		return items
	case map[string]any:
		result := map[string]any{}
		for key, item := range typed {
			if forbiddenPublicOutputKey(key) || key == "privateRef" {
				continue
			}
			result[key] = sanitizePublicReplayJSON(item)
		}
		return result
	case string:
		for _, marker := range publicOutputForbiddenMarkers {
			if strings.Contains(typed, marker) {
				return "[redacted]"
			}
		}
		return typed
	default:
		return typed
	}
}

func (server *LiveServer) matchSetEntrants(ctx context.Context, matchSetID string) ([]map[string]any, error) {
	rows, err := server.pool.Query(ctx, `
		select snapshot
		from competition_entrants
		where match_set_id = $1
		order by entrant_index asc
	`, matchSetID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	entrants := []map[string]any{}
	for rows.Next() {
		var snapshotRaw []byte
		if err := rows.Scan(&snapshotRaw); err != nil {
			return nil, err
		}
		entrants = append(entrants, jsonMap(snapshotRaw))
	}
	return entrants, rows.Err()
}

func (server *LiveServer) matchSetEvidence(ctx context.Context, matchSetID string, entrants []map[string]any) ([]map[string]any, error) {
	entrantByRevision := map[string]string{}
	for _, entrant := range entrants {
		revisionID := stringValue(entrant, "strategyRevisionId")
		if revisionID != "" {
			entrantByRevision[revisionID] = fallbackString(stringValue(entrant, "entryId"), stringValue(entrant, "entrantId"))
		}
	}
	rows, err := server.pool.Query(ctx, `
		select m.id, m.status, m.bottom_strategy_revision_id, m.top_strategy_revision_id,
		       m.arena_variant_id, c.hash
		from match_set_matches msm
		join matches m on m.id = msm.match_id
		left join chronicles c on c.match_id = m.id
		where msm.match_set_id = $1
		order by msm.matrix_index asc
	`, matchSetID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	matches := []map[string]any{}
	for rows.Next() {
		var matchID, status, bottomRevisionID, topRevisionID, arenaVariantID string
		var chronicleHash *string
		if err := rows.Scan(&matchID, &status, &bottomRevisionID, &topRevisionID, &arenaVariantID, &chronicleHash); err != nil {
			return nil, err
		}
		dto := map[string]any{
			"matchId":         matchID,
			"status":          status,
			"replayAvailable": chronicleHash != nil,
			"entrants": map[string]any{
				"bottom": fallbackString(entrantByRevision[bottomRevisionID], bottomRevisionID),
				"top":    fallbackString(entrantByRevision[topRevisionID], topRevisionID),
			},
			"arenaVariantId": arenaVariantID,
		}
		if chronicleHash != nil {
			dto["chronicleHash"] = *chronicleHash
		}
		if status == matchStatusFailedSystem {
			dto["publicReason"] = "system_failure"
		}
		matches = append(matches, dto)
	}
	return matches, rows.Err()
}

func (server *LiveServer) authenticatedUser(ctx context.Context, request *http.Request, updateLastSeen bool) (*publicUser, error) {
	token := sessionTokenFromRequest(request)
	if token == "" {
		return nil, nil
	}
	now := server.now()
	var user publicUser
	var sessionID string
	err := server.pool.QueryRow(ctx, `
		select s.id, u.id, u.username, u.handle, u.display_name, u.created_at
		from user_sessions s
		join users u on u.id = s.user_id
		where s.token_hash = $1
		  and s.revoked_at is null
		  and s.expires_at > $2
	`, hashSessionToken(token), now).Scan(
		&sessionID,
		&user.ID,
		&user.Username,
		&user.Handle,
		&user.DisplayName,
		&user.CreatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if updateLastSeen {
		if _, err := server.pool.Exec(ctx, "update user_sessions set last_seen_at = $1 where id = $2", now, sessionID); err != nil {
			return nil, err
		}
	}
	return &user, nil
}

func (server *LiveServer) requireUser(writer http.ResponseWriter, request *http.Request) (*publicUser, error) {
	user, err := server.authenticatedUser(request.Context(), request, true)
	if err != nil {
		writeStorageError(writer)
		return nil, err
	}
	if user == nil {
		writeServiceError(writer, http.StatusUnauthorized, "UNAUTHORIZED", "Sign in is required.")
		return nil, nil
	}
	return user, nil
}

func (server *LiveServer) userPasswordHash(ctx context.Context, username string) (*publicUser, string, error) {
	var user publicUser
	var passwordHash string
	err := server.pool.QueryRow(ctx, `
		select id, username, handle, display_name, created_at, password_hash
		from users
		where lower(username) = $1 and password_hash is not null
	`, username).Scan(
		&user.ID,
		&user.Username,
		&user.Handle,
		&user.DisplayName,
		&user.CreatedAt,
		&passwordHash,
	)
	return &user, passwordHash, err
}

func (server *LiveServer) createSessionToken(ctx context.Context, userID string) (string, error) {
	token := randomToken()
	expiresAt := server.now().Add(sessionDuration)
	_, err := server.pool.Exec(ctx, `
		insert into user_sessions (id, user_id, token_hash, expires_at, metadata)
		values ($1, $2, $3, $4, '{}'::jsonb)
	`, "session:"+randomID(), userID, hashSessionToken(token), expiresAt)
	return token, err
}

func (server *LiveServer) accountRevisionSummaries(ctx context.Context, userID string) ([]map[string]any, error) {
	rows, err := server.pool.Query(ctx, `
		select sr.id, sr.strategy_id, sr.source_hash, sr.source_bytes,
		       sr.runtime, sr.engine_compatibility, sr.validation, sr.metadata,
		       sr.created_at, sr.locked_at
		from strategy_revisions sr
		join strategies s on s.id = sr.strategy_id
		where s.owner_user_id = $1
		order by sr.created_at desc, sr.id desc
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	summaries := []map[string]any{}
	for rows.Next() {
		var row revisionRow
		var runtimeRaw, engineRaw, validationRaw, metadataRaw []byte
		if err := rows.Scan(
			&row.ID,
			&row.StrategyID,
			&row.SourceHash,
			&row.SourceBytes,
			&runtimeRaw,
			&engineRaw,
			&validationRaw,
			&metadataRaw,
			&row.CreatedAt,
			&row.LockedAt,
		); err != nil {
			return nil, err
		}
		row.Runtime = jsonMap(runtimeRaw)
		row.Engine = jsonMap(engineRaw)
		row.Validation = jsonMap(validationRaw)
		row.Metadata = jsonMap(metadataRaw)
		summary := map[string]any{
			"apiVersion":          serviceAPIVersion,
			"kind":                "strategyRevisionSummary",
			"strategyId":          row.StrategyID,
			"strategyRevisionId":  row.ID,
			"sourceHash":          row.SourceHash,
			"sourceBytes":         row.SourceBytes,
			"runtimeSemantics":    runtimeSemantics(row.Runtime),
			"engineCompatibility": row.Engine,
			"validationStatus":    validationStatus(row.Validation),
			"createdAt":           row.CreatedAt.Format(time.RFC3339Nano),
		}
		copyOptional(summary, row.Metadata, "label")
		copyOptional(summary, row.Metadata, "notes")
		copyOptional(summary, row.Metadata, "tags")
		copyOptional(summary, row.Metadata, "starterLineage")
		copyOptional(summary, row.Metadata, "advancedLineage")
		if row.LockedAt != nil {
			summary["lockedAt"] = row.LockedAt.Format(time.RFC3339Nano)
		}
		summaries = append(summaries, summary)
	}
	return summaries, rows.Err()
}

func (server *LiveServer) insertAccountRevision(ctx context.Context, input accountRevisionInsert) (map[string]any, error) {
	userID := input.UserID
	strategyID := input.StrategyID
	source := input.Source
	label := input.Label
	notes := input.Notes
	if source == "" || utf8.RuneCountInString(source) == 0 || len([]byte(source)) > strategySourceBytes {
		return nil, errors.New("invalid source")
	}
	sourceHash := hashString(source)
	if input.SourceHash != "" {
		sourceHash = input.SourceHash
	}
	sourceBytes := len([]byte(source))
	if input.SourceBytes > 0 {
		sourceBytes = input.SourceBytes
	}
	createStrategy := strategyID == ""
	if createStrategy {
		strategyID = "strategy:account:" + userID + ":" + randomID()
	}
	runtime := defaultRuntimeMetadata()
	if input.Runtime != nil {
		runtime = input.Runtime
	}
	validation := validateSourceMetadata(source)
	if input.Validation != nil {
		validation = input.Validation
	}
	engine := engineCompatibility()
	if input.EngineCompatibility != nil {
		engine = input.EngineCompatibility
	}
	revisionID := "strategy-revision:" + hashString(stableRevisionIdentity(sourceHash, strategyID))
	metadata := cloneMap(input.Metadata)
	if metadata == nil {
		metadata = map[string]any{}
	}
	if label != "" {
		metadata["label"] = strings.TrimSpace(label)
	}
	if notes != "" {
		metadata["notes"] = strings.TrimSpace(notes)
	}
	tx, err := server.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()
	strategyName := "Account Strategy"
	if label != "" {
		strategyName = strings.TrimSpace(label)
	}
	if input.StrategyName != "" {
		strategyName = strings.TrimSpace(input.StrategyName)
	}
	strategyMetadata := map[string]any{"accountOwned": true}
	copyOptional(strategyMetadata, metadata, "starterLineage")
	copyOptional(strategyMetadata, metadata, "advancedLineage")
	if !createStrategy {
		var ownedStrategyID string
		err := tx.QueryRow(ctx, `
			select id
			from strategies
			where id = $1 and owner_user_id = $2
			for update
		`, strategyID, userID).Scan(&ownedStrategyID)
		if err != nil {
			return nil, err
		}
		if _, err := tx.Exec(ctx, `
			update strategies
			set name = $3,
			    metadata = metadata || $4::jsonb
			where id = $1 and owner_user_id = $2
		`, strategyID, userID, strategyName, strategyMetadata); err != nil {
			return nil, err
		}
	} else {
		if _, err := tx.Exec(ctx, `
			insert into strategies (id, owner_user_id, name, metadata)
			values ($1, $2, $3, $4)
		`, strategyID, userID, strategyName, strategyMetadata); err != nil {
			return nil, err
		}
	}
	if _, err := tx.Exec(ctx, `
		insert into strategy_revisions (
			id, strategy_id, source, source_hash, source_bytes,
			runtime, engine_compatibility, validation, metadata
		)
		values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		on conflict (id) do nothing
	`, revisionID, strategyID, source, sourceHash, sourceBytes, runtime, engine, validation, metadata); err != nil {
		return nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return map[string]any{
		"strategyId":         strategyID,
		"strategyRevisionId": revisionID,
		"validationStatus":   validationStatus(validation),
	}, nil
}

func (server *LiveServer) createExhibitionMatchSet(ctx context.Context, userID string, presetID string, revisionIDs []string) (map[string]any, error) {
	matchSetPresetID, err := competitionMatchSetPresetID(presetID)
	if err != nil || len(revisionIDs) < 2 || len(revisionIDs) > 8 {
		return nil, errors.New("invalid exhibition input")
	}
	seen := map[string]bool{}
	for _, revisionID := range revisionIDs {
		if revisionID == "" || seen[revisionID] {
			return nil, errors.New("invalid revision ids")
		}
		seen[revisionID] = true
	}
	now := server.now()
	matchSetID := "match-set:exhibition:" + randomID()
	entrants, err := server.loadOwnedEntrants(ctx, userID, revisionIDs, now)
	if err != nil {
		return nil, err
	}
	if len(entrants) != len(revisionIDs) {
		return nil, errors.New("revision ownership mismatch")
	}
	matches := generatePairwiseMatches(matchSetID, matchSetPresetID, entrants)
	duplicateKey := buildDuplicateKey(userID, presetID, revisionIDs)
	tx, err := server.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()
	var activeDuplicate string
	err = tx.QueryRow(ctx, `
		select id
		from match_sets
		where creator_user_id = $1
		  and competition_preset_id = $2
		  and duplicate_key = $3
		  and status in ('pending', 'running')
		order by created_at asc, id asc
		limit 1
	`, userID, presetID, duplicateKey).Scan(&activeDuplicate)
	if err == nil {
		return nil, errActiveDuplicate
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}
	if err := assertExhibitionCreateRateLimit(ctx, tx, userID, now); err != nil {
		return nil, err
	}
	if err := ensureCompetitionArenas(ctx, tx); err != nil {
		return nil, err
	}
	if _, err := tx.Exec(ctx, `
		insert into match_sets (
			id, status, preset_id, preset_version, matrix, creator_user_id,
			competition_preset_id, competition_preset_version, scoring_policy_version,
			visibility, entrant_snapshot_set, publication_policy, duplicate_key, locked_at
		)
		values ($1, 'pending', $2, 'v1', $3, $4, $5, 'v1',
		        'exhibition-points-v1:v1', 'public', $6, $7, $8, $9)
	`, matchSetID, matchSetPresetID, matches, userID, presetID, entrants, map[string]any{
		"publicResults":               true,
		"publicReplayEvidence":        true,
		"excludesPrivateStrategyData": true,
	}, duplicateKey, now); err != nil {
		return nil, err
	}
	for _, entrant := range entrants {
		if _, err := tx.Exec(ctx, `
			insert into competition_entrants (
				id, match_set_id, entrant_index, strategy_revision_id, owner_user_id,
				owner_handle, display_label, source_hash, source_bytes, runtime,
				engine_compatibility, snapshot
			)
			values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		`, matchSetID+":"+stringValue(entrant, "entrantId"), matchSetID, intValue(entrant, "entrantIndex"), stringValue(entrant, "strategyRevisionId"), stringValue(entrant, "ownerUserId"), stringValue(entrant, "ownerHandle"), stringValue(entrant, "displayLabel"), stringValue(entrant, "sourceHash"), intValue(entrant, "sourceBytes"), entrant["runtime"], entrant["engineCompatibility"], entrant); err != nil {
			return nil, err
		}
		if _, err := tx.Exec(ctx, "update strategy_revisions set locked_at = coalesce(locked_at, $2) where id = $1", stringValue(entrant, "strategyRevisionId"), now); err != nil {
			return nil, err
		}
	}
	for index, match := range matches {
		if _, err := tx.Exec(ctx, `
			insert into matches (
				id, bottom_strategy_revision_id, top_strategy_revision_id,
				arena_variant_id, seed, bottom_player_id, top_player_id, status
			)
			values ($1, $2, $3, $4, $5, $6, $7, 'pending')
		`, match["id"], match["bottomStrategyRevisionId"], match["topStrategyRevisionId"], match["arenaVariantId"], match["seed"], match["bottomPlayerId"], match["topPlayerId"]); err != nil {
			return nil, err
		}
		if _, err := tx.Exec(ctx, "insert into match_jobs (id, match_id, status) values ($1, $2, 'queued')", "match-job:"+stringValue(match, "id"), match["id"]); err != nil {
			return nil, err
		}
		if _, err := tx.Exec(ctx, "insert into match_set_matches (match_set_id, match_id, matrix_index) values ($1, $2, $3)", matchSetID, match["id"], index); err != nil {
			return nil, err
		}
	}
	if _, err := tx.Exec(ctx, `
		insert into competition_submission_events (
			id, user_id, action, preset_id, match_set_id, metadata, created_at
		)
		values ($1, $2, 'create_exhibition', $3, $4, $5, $6)
	`, "competition-event:"+randomID(), userID, presetID, matchSetID, map[string]any{"revisionIds": sortedCopy(revisionIDs)}, now); err != nil {
		return nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return map[string]any{
		"apiVersion": serviceAPIVersion,
		"kind":       "matchSetCreated",
		"matchSetId": matchSetID,
		"publicHref": "/matchsets/" + urlPathEscape(matchSetID),
		"status":     "queued",
		"matchCount": len(matches),
	}, nil
}

func (server *LiveServer) loadOwnedEntrants(ctx context.Context, userID string, revisionIDs []string, lockedAt time.Time) ([]map[string]any, error) {
	rows, err := server.pool.Query(ctx, `
		select sr.id, sr.source_hash, sr.source_bytes, sr.runtime,
		       sr.engine_compatibility, sr.validation, sr.metadata,
		       s.owner_user_id, u.handle
		from strategy_revisions sr
		join strategies s on s.id = sr.strategy_id
		join users u on u.id = s.owner_user_id
		where sr.id = any($1::text[]) and s.owner_user_id = $2
	`, revisionIDs, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	byID := map[string]map[string]any{}
	for rows.Next() {
		var id, sourceHash, ownerUserID, handle string
		var sourceBytes int
		var runtimeRaw, engineRaw, validationRaw, metadataRaw []byte
		if err := rows.Scan(&id, &sourceHash, &sourceBytes, &runtimeRaw, &engineRaw, &validationRaw, &metadataRaw, &ownerUserID, &handle); err != nil {
			return nil, err
		}
		validation := jsonMap(validationRaw)
		if validationStatus(validation) != "valid" {
			return nil, errors.New("invalid revision")
		}
		runtime := jsonMap(runtimeRaw)
		if !runtimeAllowsCountedPlay(runtime) {
			return nil, errors.New("runtime is not counted-play eligible")
		}
		metadata := jsonMap(metadataRaw)
		label := stringValue(metadata, "label")
		if label == "" {
			label = id
		}
		byID[id] = map[string]any{
			"strategyRevisionId":  id,
			"ownerUserId":         ownerUserID,
			"ownerHandle":         handle,
			"displayLabel":        "@" + handle + " / \"" + label + "\" / " + shortHash(sourceHash),
			"sourceHash":          sourceHash,
			"sourceBytes":         sourceBytes,
			"runtime":             publicRuntimeMetadata(runtime),
			"engineCompatibility": jsonMap(engineRaw),
			"lockedAt":            lockedAt.Format(time.RFC3339Nano),
		}
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	entrants := []map[string]any{}
	for index, revisionID := range revisionIDs {
		entrant, ok := byID[revisionID]
		if !ok {
			return nil, errors.New("revision not owned")
		}
		entrant["entrantId"] = fmt.Sprintf("entrant:%d", index)
		entrant["entrantIndex"] = index
		entrants = append(entrants, entrant)
	}
	return entrants, nil
}

func writeJSONValue(writer http.ResponseWriter, status int, value any) {
	if err := validateNoPrivateKeys(value, "$"); err != nil {
		writeServiceError(writer, http.StatusInternalServerError, "INTERNAL", "Response failed privacy validation.")
		return
	}
	writePrivateJSONValue(writer, status, value)
}

func writePrivateJSONValue(writer http.ResponseWriter, status int, value any) {
	bytes, err := json.Marshal(value)
	if err != nil {
		writeServiceError(writer, http.StatusInternalServerError, "INTERNAL", "Response serialization failed.")
		return
	}
	writer.Header().Set("Content-Type", "application/json")
	writer.WriteHeader(status)
	if _, err := writer.Write(bytes); err != nil {
		logWriteError(err)
	}
}

func writeStorageError(writer http.ResponseWriter) {
	writeServiceError(writer, http.StatusServiceUnavailable, "STORAGE_UNAVAILABLE", "Storage is unavailable.")
}

func writeServiceError(writer http.ResponseWriter, status int, code string, message string) {
	body := serviceErrorFixture{
		Code:       code,
		Message:    message,
		Status:     status,
		PublicSafe: true,
	}
	bytes, _ := json.Marshal(body)
	writer.Header().Set("Content-Type", "application/json")
	writer.WriteHeader(status)
	if _, err := writer.Write(bytes); err != nil {
		logWriteError(err)
	}
}

func decodeBody(writer http.ResponseWriter, request *http.Request, target any) bool {
	decoder := json.NewDecoder(request.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(target); err != nil {
		writeServiceError(writer, http.StatusBadRequest, "VALIDATION_FAILED", "Request body is invalid.")
		return false
	}
	return true
}

func authSessionDTO(user *publicUser) map[string]any {
	var userDTO any
	if user != nil {
		userDTO = map[string]any{
			"id":          user.ID,
			"username":    user.Username,
			"handle":      user.Handle,
			"displayName": user.DisplayName,
		}
	}
	return map[string]any{
		"apiVersion": serviceAPIVersion,
		"kind":       "authSession",
		"user":       userDTO,
	}
}

func sessionTokenFromRequest(request *http.Request) string {
	if cookie, err := request.Cookie(sessionCookieName); err == nil {
		return cookie.Value
	}
	const prefix = "Bearer "
	auth := request.Header.Get("Authorization")
	if strings.HasPrefix(auth, prefix) {
		return strings.TrimPrefix(auth, prefix)
	}
	return ""
}

func setSessionCookie(writer http.ResponseWriter, token string) {
	http.SetCookie(writer, &http.Cookie{
		Name:     sessionCookieName,
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   secureSessionCookie(),
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int(sessionDuration.Seconds()),
	})
}

func clearSessionCookie(writer http.ResponseWriter) {
	http.SetCookie(writer, &http.Cookie{
		Name:     sessionCookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   secureSessionCookie(),
		SameSite: http.SameSiteLaxMode,
		MaxAge:   0,
	})
}

func secureSessionCookie() bool {
	return os.Getenv("NODE_ENV") == "production" ||
		strings.EqualFold(os.Getenv("COWARDS_SECURE_COOKIES"), "1") ||
		strings.EqualFold(os.Getenv("COWARDS_SECURE_COOKIES"), "true")
}

func createPasswordHash(password string) (string, error) {
	if len(password) < 12 ||
		!strings.ContainsAny(password, "0123456789") ||
		!strings.ContainsAny(strings.ToLower(password), "abcdefghijklmnopqrstuvwxyz") {
		return "", errors.New("password policy failed")
	}
	salt := randomTokenN(16)
	key, err := scrypt.Key([]byte(password), []byte(salt), 16384, 8, 1, 64)
	if err != nil {
		return "", err
	}
	return "scrypt$16384$8$1$" + salt + "$" + base64.RawURLEncoding.EncodeToString(key), nil
}

func verifyPasswordHash(password string, encodedHash string) (bool, error) {
	parts := strings.Split(encodedHash, "$")
	if len(parts) != 6 || parts[0] != "scrypt" {
		return false, nil
	}
	expected, err := base64.RawURLEncoding.DecodeString(parts[5])
	if err != nil {
		return false, err
	}
	key, err := scrypt.Key([]byte(password), []byte(parts[4]), 16384, 8, 1, len(expected))
	if err != nil {
		return false, err
	}
	return subtle.ConstantTimeCompare(key, expected) == 1, nil
}

func hashSessionToken(token string) string {
	return hashString(token)
}

func hashString(value string) string {
	sum := sha256.Sum256([]byte(value))
	return hex.EncodeToString(sum[:])
}

func randomToken() string {
	return randomTokenN(32)
}

func randomID() string {
	return randomTokenN(16)
}

func randomTokenN(size int) string {
	bytes := make([]byte, size)
	if _, err := rand.Read(bytes); err != nil {
		panic("crypto random unavailable")
	}
	return base64.RawURLEncoding.EncodeToString(bytes)
}

func normalizeUsername(value string) string {
	return strings.ToLower(strings.TrimSpace(value))
}

func normalizeHandle(value string) string {
	return strings.ToLower(strings.TrimPrefix(strings.TrimSpace(value), "@"))
}

func validUsername(value string) bool {
	if len(value) < 3 || len(value) > 32 {
		return false
	}
	for index, char := range value {
		if index == 0 && (char == '_' || char == '-') {
			return false
		}
		if (char >= 'a' && char <= 'z') || (char >= '0' && char <= '9') || char == '_' || char == '-' {
			continue
		}
		return false
	}
	return true
}

func defaultRuntimeMetadata() map[string]any {
	return map[string]any{
		"abiVersion": "strategy-runtime-abi-v1.14",
		"language": map[string]any{
			"id":      "typescript",
			"version": "0.1.0",
		},
		"adapter": map[string]any{
			"id":      "runtime-js-worker-thread",
			"version": "0.1.0",
		},
		"package": map[string]any{
			"mode":       "none",
			"entrypoint": "default",
		},
		"requiredCapabilities": []string{},
		"limits": map[string]any{
			"timeoutMs":             1000,
			"stdoutBytes":           262144,
			"stderrBytes":           65536,
			"sourceBytes":           strategySourceBytes,
			"strategyMemoryBytes":   32768,
			"soldierMemoryBytes":    2048,
			"objectivePayloadBytes": 1024,
			"environment":           "empty",
			"filesystem":            "host",
			"network":               "inherited",
			"shell":                 "disabled",
			"packagePolicy":         "none",
		},
	}
}

func engineCompatibility() map[string]any {
	return map[string]any{
		"spec":   "cowards-rules-v1.4",
		"engine": "0.1.4",
	}
}

func validateSourceMetadata(source string) map[string]any {
	errors := []map[string]any{}
	if len([]byte(source)) > strategySourceBytes {
		errors = append(errors, validationIssue("SOURCE_TOO_LARGE", "Strategy source is too large."))
	}
	if !strings.Contains(source, "export default") {
		errors = append(errors, validationIssue("MISSING_DEFAULT_EXPORT", "Strategy source must contain export default."))
	}
	if !strings.Contains(source, "selectActivations") {
		errors = append(errors, validationIssue("MISSING_SELECT_ACTIVATIONS", "Strategy source must define selectActivations."))
	}
	if !strings.Contains(source, "soldierBrain") {
		errors = append(errors, validationIssue("MISSING_SOLDIER_BRAIN", "Strategy source must define soldierBrain."))
	}
	return map[string]any{
		"valid":               len(errors) == 0,
		"errors":              errors,
		"warnings":            []map[string]any{},
		"sourceBytes":         len([]byte(source)),
		"forbiddenPatterns":   []string{},
		"sourceHash":          hashString(source),
		"runtimeVersion":      "0.1.0",
		"engineCompatibility": engineCompatibility(),
	}
}

func validationIssue(code string, message string) map[string]any {
	return map[string]any{
		"code":     code,
		"message":  message,
		"severity": "error",
	}
}

func runtimeSemantics(runtime map[string]any) map[string]any {
	return map[string]any{
		"languageLabel":        "TypeScript",
		"adapterLabel":         "runtime-js worker thread",
		"readiness":            "local-dev-fallback",
		"readinessLabel":       "Local/dev fallback",
		"experimental":         false,
		"countedPlayEligible":  true,
		"countedPlayLabel":     "Counted eligible",
		"countedPlayReason":    nil,
		"sourcePolicyLabel":    "Self-contained Strategy source",
		"packagePolicyLabel":   "No packages",
		"docsReference":        "runtime/languages",
		"examplesReference":    "samples/minimal-strategy",
		"warnings":             []string{},
		"validationIssueCodes": []string{},
	}
}

func publicRuntimeMetadata(runtime map[string]any) map[string]any {
	publicRuntime := cloneMap(runtime)
	if publicRuntime == nil {
		return map[string]any{}
	}
	delete(publicRuntime, "limits")
	return publicRuntime
}

func validationStatus(validation map[string]any) string {
	if valid, ok := validation["valid"].(bool); ok && valid {
		return "valid"
	}
	return "invalid"
}

func runtimeAllowsCountedPlay(runtime map[string]any) bool {
	if stringValue(runtime, "abiVersion") != "strategy-runtime-abi-v1.14" {
		return false
	}
	language := mapValue(runtime, "language")
	adapter := mapValue(runtime, "adapter")
	packageMetadata := mapValue(runtime, "package")
	languageID := stringValue(language, "id")
	adapterID := stringValue(adapter, "id")
	if languageID != "javascript" && languageID != "typescript" {
		return false
	}
	if adapterID != "runtime-js-worker-thread" && adapterID != "runtime-js-subprocess" {
		return false
	}
	if stringValue(packageMetadata, "mode") != "none" {
		return false
	}
	return len(stringSliceFromAny(runtime["requiredCapabilities"])) == 0
}

func competitionMatchSetPresetID(presetID string) (string, error) {
	switch presetID {
	case "smoke-exhibition-v1":
		return "smoke-v1", nil
	case "standard-exhibition-v1":
		return "standard-v1", nil
	default:
		return "", errors.New("unknown competition preset")
	}
}

var errRateLimited = errors.New("exhibition rate limited")
var errActiveDuplicate = errors.New("active duplicate exhibition")

func assertExhibitionCreateRateLimit(ctx context.Context, tx pgx.Tx, userID string, now time.Time) error {
	var count int
	if err := tx.QueryRow(ctx, `
		select count(*)::integer
		from competition_submission_events
		where user_id = $1
		  and action = 'create_exhibition'
		  and created_at >= $2::timestamptz - ($3::integer * interval '1 second')
	`, userID, now, int(exhibitionRateLimitWindow.Seconds())).Scan(&count); err != nil {
		return err
	}
	if count < exhibitionRateLimit {
		return nil
	}
	return errRateLimited
}

func matchSetPresetSpec(matchSetPresetID string) ([]string, []string, bool) {
	switch matchSetPresetID {
	case "smoke-v1":
		return []string{"arena:smoke:v1"}, []string{"seed:smoke:001"}, true
	case "standard-v1":
		return []string{"arena:smoke:v1", "arena:standard-cross:v1"}, []string{"seed:standard:001", "seed:standard:002"}, true
	default:
		return []string{"arena:smoke:v1"}, []string{"seed:smoke:001"}, true
	}
}

func generatePairwiseMatches(matchSetID string, matchSetPresetID string, entrants []map[string]any) []map[string]any {
	arenaVariantIDs, seeds, mirrorSides := matchSetPresetSpec(matchSetPresetID)
	matches := []map[string]any{}
	index := 0
	for left := 0; left < len(entrants); left++ {
		for right := left + 1; right < len(entrants); right++ {
			for _, arenaVariantID := range arenaVariantIDs {
				for _, seed := range seeds {
					for _, mirror := range []bool{false, true} {
						if mirror && !mirrorSides {
							continue
						}
						bottom := entrants[left]
						top := entrants[right]
						seedSuffix := fmt.Sprintf("pair:%d-%d", left, right)
						if mirror {
							bottom = entrants[right]
							top = entrants[left]
							seedSuffix += ":mirror"
						}
						matches = append(matches, map[string]any{
							"id":                       fmt.Sprintf("match:%s:%d", matchSetID, index),
							"bottomStrategyRevisionId": stringValue(bottom, "strategyRevisionId"),
							"topStrategyRevisionId":    stringValue(top, "strategyRevisionId"),
							"arenaVariantId":           arenaVariantID,
							"seed":                     seed + ":" + seedSuffix,
							"bottomPlayerId":           fmt.Sprintf("player:%s:entrant:%d", matchSetID, intValue(bottom, "entrantIndex")),
							"topPlayerId":              fmt.Sprintf("player:%s:entrant:%d", matchSetID, intValue(top, "entrantIndex")),
						})
						index++
					}
				}
			}
		}
	}
	return matches
}

func ensureCompetitionArenas(ctx context.Context, tx pgx.Tx) error {
	for _, arena := range competitionArenaDefinitions() {
		if _, err := tx.Exec(ctx, `
			insert into arena_variants (id, name, config)
			values ($1, $2, $3)
			on conflict (id) do update
			set name = excluded.name,
			    config = excluded.config
		`, stringValue(arena, "id"), stringValue(arena, "name"), arena); err != nil {
			return err
		}
	}
	return nil
}

func competitionArenaDefinitions() []map[string]any {
	initialBounds := map[string]any{"minX": 0, "maxX": 11, "minY": 0, "maxY": 11}
	return []map[string]any{
		{
			"id":            "arena:smoke:v1",
			"name":          "Smoke",
			"initialBounds": initialBounds,
			"terrainStones": []map[string]any{},
		},
		{
			"id":            "arena:standard-cross:v1",
			"name":          "Standard Cross",
			"initialBounds": initialBounds,
			"terrainStones": []map[string]any{
				{"x": 3, "y": 2},
				{"x": 2, "y": 3},
				{"x": 4, "y": 3},
				{"x": 3, "y": 4},
			},
		},
	}
}

func buildDuplicateKey(userID string, presetID string, revisionIDs []string) string {
	return userID + "|" + presetID + "|" + strings.Join(sortedCopy(revisionIDs), "|")
}

func sortedCopy(values []string) []string {
	next := append([]string{}, values...)
	sort.Strings(next)
	return next
}

func jsonMap(raw []byte) map[string]any {
	if len(raw) == 0 {
		return map[string]any{}
	}
	var value map[string]any
	if err := json.Unmarshal(raw, &value); err != nil {
		return map[string]any{}
	}
	return value
}

func loadStrategyArtifactManifest(path string) (map[string]strategyArtifact, error) {
	bytes, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var manifest strategyArtifactManifest
	if err := json.Unmarshal(bytes, &manifest); err != nil {
		return nil, err
	}
	if manifest.SchemaVersion != "strategy-artifact-manifest-v1.14" || manifest.ArtifactCount != len(manifest.Artifacts) {
		return nil, errors.New("invalid strategy artifact manifest")
	}
	artifacts := map[string]strategyArtifact{}
	for _, artifact := range manifest.Artifacts {
		if artifact.ID == "" {
			return nil, errors.New("strategy artifact missing id")
		}
		if _, exists := artifacts[artifact.ID]; exists {
			return nil, errors.New("duplicate strategy artifact id")
		}
		artifacts[artifact.ID] = artifact
	}
	return artifacts, nil
}

func defaultStrategyArtifactManifestPath() string {
	if path := strings.TrimSpace(os.Getenv("COWARDS_STRATEGY_ARTIFACT_MANIFEST")); path != "" {
		return path
	}
	candidates := []string{
		filepath.Join("..", "..", "packages", "spec", "artifacts", "strategy-artifacts.v1.14.json"),
		filepath.Join("packages", "spec", "artifacts", "strategy-artifacts.v1.14.json"),
	}
	for _, candidate := range candidates {
		if _, err := os.Stat(candidate); err == nil {
			return candidate
		}
	}
	return candidates[0]
}

func normalizeStrategyArtifactID(kind string, value string) string {
	id := strings.TrimSpace(value)
	if strings.HasPrefix(id, "strategy-artifact:") {
		return id
	}
	if strings.HasPrefix(id, kind+":") {
		return "strategy-artifact:" + id
	}
	return "strategy-artifact:" + kind + ":" + id
}

func cloneMap(value map[string]any) map[string]any {
	if value == nil {
		return nil
	}
	bytes, err := json.Marshal(value)
	if err != nil {
		return nil
	}
	var cloned map[string]any
	if err := json.Unmarshal(bytes, &cloned); err != nil {
		return nil
	}
	return cloned
}

func jsonStringArray(raw []byte) []string {
	var values []string
	if err := json.Unmarshal(raw, &values); err != nil {
		return []string{}
	}
	return values
}

func stringSliceFromAny(value any) []string {
	items, ok := value.([]any)
	if !ok {
		return []string{}
	}
	values := []string{}
	for _, item := range items {
		if value, ok := item.(string); ok {
			values = append(values, value)
		}
	}
	return values
}

func copyOptional(target map[string]any, source map[string]any, key string) {
	if value, ok := source[key]; ok {
		target[key] = value
	}
}

func stringValue(value map[string]any, key string) string {
	item, _ := value[key].(string)
	return item
}

func boolValue(value map[string]any, key string) bool {
	item, _ := value[key].(bool)
	return item
}

func mapValue(value map[string]any, key string) map[string]any {
	item, _ := value[key].(map[string]any)
	if item == nil {
		return map[string]any{}
	}
	return item
}

func intValue(value map[string]any, key string) int {
	switch item := value[key].(type) {
	case int:
		return item
	case float64:
		return int(item)
	default:
		return 0
	}
}

func valueOr(value *string, fallback string) string {
	if value == nil || *value == "" {
		return fallback
	}
	return *value
}

func shortHash(hash string) string {
	if len(hash) < 10 {
		return hash
	}
	return hash[:10]
}

func urlPathEscape(value string) string {
	replacer := strings.NewReplacer(":", "%3A", "/", "%2F", " ", "%20")
	return replacer.Replace(value)
}

func ladderMatchSetSummary(matchSetID string, seasonID string, status string, countedStatus string, reason *string, explanation *string, entrantIDs []string) map[string]any {
	dto := map[string]any{
		"matchSetId":        matchSetID,
		"seasonId":          seasonID,
		"status":            mapMatchSetStatus(status),
		"countedStatus":     countedStatus,
		"publicExplanation": valueOr(explanation, "Waiting for complete replay-backed evidence."),
		"entrantIds":        entrantIDs,
		"resultHref":        "/matchsets/" + urlPathEscape(matchSetID),
	}
	if reason != nil && *reason != "" {
		dto["publicReason"] = *reason
	}
	return dto
}

func mapMatchSetStatus(status string) string {
	switch status {
	case "pending":
		return "queued"
	case "failed_system", "blocked":
		return "failed"
	default:
		return status
	}
}

func trialLadderStatusLabel(status string) string {
	switch status {
	case "draft":
		return "Preparing"
	case "open":
		return "Open for entries"
	case "scheduling":
		return "Scheduling matches"
	case "active":
		return "Matches running"
	case "completed":
		return "Complete"
	case "archived":
		return "Archived"
	default:
		return status
	}
}

func competitionPresetLabel(presetID string) string {
	switch presetID {
	case "smoke-exhibition-v1":
		return "Smoke Exhibition"
	case "standard-exhibition-v1":
		return "Standard Exhibition"
	default:
		return presetID
	}
}

func standingsFromScoring(raw []byte, entrants []map[string]any) []map[string]any {
	if len(raw) == 0 {
		return []map[string]any{}
	}
	var scoring map[string]any
	if err := json.Unmarshal(raw, &scoring); err != nil {
		return []map[string]any{}
	}
	rankings, ok := scoring["rankings"].([]any)
	if !ok {
		return []map[string]any{}
	}
	entrantByRevision := map[string]map[string]any{}
	for _, entrant := range entrants {
		entrantByRevision[stringValue(entrant, "strategyRevisionId")] = entrant
	}
	standings := []map[string]any{}
	for index, ranking := range rankings {
		rankingMap, ok := ranking.(map[string]any)
		if !ok {
			continue
		}
		revisionID := stringValue(rankingMap, "strategyRevisionId")
		entrant := entrantByRevision[revisionID]
		standings = append(standings, map[string]any{
			"rank":               index + 1,
			"entrantId":          stringValue(entrant, "entrantId"),
			"strategyRevisionId": revisionID,
			"ownerHandle":        stringValue(entrant, "ownerHandle"),
			"displayLabel":       stringValue(entrant, "displayLabel"),
			"sourceHash":         stringValue(entrant, "sourceHash"),
			"points":             intValue(rankingMap, "points"),
			"wins":               intValue(rankingMap, "wins"),
			"draws":              intValue(rankingMap, "draws"),
			"losses":             intValue(rankingMap, "losses"),
			"penalties":          publicPenaltiesFromScoring(rankingMap),
			"survivingSoldiers":  intValue(rankingMap, "survivingSoldiers"),
			"survivalTurns":      intValue(rankingMap, "survivalTurns"),
			"tieBreakerPath":     []string{"points", "wins", "survivingSoldiers", "survivalTurns", "strategyRevisionId"},
		})
	}
	return standings
}

func publicPenaltiesFromScoring(ranking map[string]any) []map[string]any {
	rawPenalties, ok := ranking["penalties"].([]any)
	if !ok {
		return []map[string]any{}
	}
	penalties := []map[string]any{}
	for _, rawPenalty := range rawPenalties {
		penalty, ok := rawPenalty.(map[string]any)
		if !ok {
			continue
		}
		reason := stringValue(penalty, "reason")
		if reason != "strategy_failure" {
			continue
		}
		penalties = append(penalties, map[string]any{
			"matchId": stringValue(penalty, "matchId"),
			"reason":  reason,
			"points":  intValue(penalty, "points"),
		})
	}
	return penalties
}

func publicPenaltiesFromScorePenalties(rawPenalties []scorePenalty) []map[string]any {
	penalties := []map[string]any{}
	for _, penalty := range rawPenalties {
		if penalty.Reason != "strategy_failure" {
			continue
		}
		penalties = append(penalties, map[string]any{
			"matchId": penalty.MatchID,
			"reason":  penalty.Reason,
			"points":  penalty.Points,
		})
	}
	return penalties
}

func stableRevisionIdentity(sourceHash string, strategyID string) string {
	return `{"engineVersion":"0.1.4","runtimeVersion":"0.1.0","sourceHash":"` + sourceHash + `","specVersion":"cowards-rules-v1.4","strategyId":"` + strategyID + `","strategyRevisionVersion":"0.1.4"}`
}

func logWriteError(err error) {
	if err != nil {
		fmt.Printf("write response failed\n")
	}
}
