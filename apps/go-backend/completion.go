package main

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"reflect"
	"sort"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type matchCompletionService struct {
	pool *pgxpool.Pool
}

type completeMatchInput struct {
	JobID      string
	LeaseToken string
	Chronicle  map[string]any
	FinalState map[string]any
}

type completeMatchResult struct {
	Status      string
	MatchID     string
	ChronicleID string
}

type matchCompletionFields struct {
	MatchID                 string
	Outcome                 any
	WinnerPlayerID          *string
	SurvivingSoldiers       int
	BottomSurvivingSoldiers int
	TopSurvivingSoldiers    int
	SurvivalTurns           int
	BottomSurvivalTurns     int
	TopSurvivalTurns        int
}

type chronicleMetadata struct {
	ID                       string
	MatchID                  string
	SchemaVersion            string
	Hash                     string
	Outcome                  any
	EventCount               int
	SnapshotCount            int
	BottomPlayerID           string
	TopPlayerID              string
	BottomStrategyRevisionID string
	TopStrategyRevisionID    string
	ArenaVariantID           string
}

type matchCompletionOwnershipRow struct {
	BottomStrategyRevisionID string
	TopStrategyRevisionID    string
	ArenaVariantID           string
	BottomPlayerID           string
	TopPlayerID              string
}

func newMatchCompletionService(pool *pgxpool.Pool) *matchCompletionService {
	return &matchCompletionService{pool: pool}
}

func (service *matchCompletionService) completeMatch(ctx context.Context, input completeMatchInput) (*completeMatchResult, error) {
	if service == nil || service.pool == nil {
		return nil, errors.New("match completion requires a database pool")
	}
	fields, err := deriveGoMatchCompletionFields(input.FinalState)
	if err != nil {
		return nil, err
	}
	metadata, err := createGoChronicleMetadata(input.Chronicle)
	if err != nil {
		return nil, err
	}
	if err := validateCompletionCompatibility(fields, metadata); err != nil {
		return nil, err
	}
	artifact, err := json.Marshal(input.Chronicle)
	if err != nil {
		return nil, err
	}
	outcome, err := json.Marshal(metadata.Outcome)
	if err != nil {
		return nil, err
	}
	matchOutcome, err := json.Marshal(fields.Outcome)
	if err != nil {
		return nil, err
	}

	tx, err := service.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return nil, err
	}
	defer rollbackTx(ctx, tx)

	var jobID string
	var jobMatchID string
	if err := tx.QueryRow(ctx, `
		select id, match_id
		from match_jobs
		where id = $1 and lease_token = $2 and status = 'running'
		for update
	`, input.JobID, input.LeaseToken).Scan(&jobID, &jobMatchID); err != nil {
		if !errors.Is(err, pgx.ErrNoRows) {
			return nil, err
		}
		compatible, chronicleID, err := existingCompatibleChronicle(ctx, tx, metadata)
		if err != nil {
			return nil, err
		}
		if !compatible {
			return nil, errors.New("cannot complete Match without a valid running lease")
		}
		if err := tx.Commit(ctx); err != nil {
			return nil, err
		}
		return &completeMatchResult{Status: "complete", MatchID: metadata.MatchID, ChronicleID: chronicleID}, nil
	}
	if jobMatchID != fields.MatchID || jobMatchID != metadata.MatchID {
		return nil, errors.New("running lease belongs to a different Match")
	}
	ownership, err := loadCompletionMatchOwnership(ctx, tx, fields.MatchID)
	if err != nil {
		return nil, err
	}
	if err := validateCompletionOwnership(ownership, metadata); err != nil {
		return nil, err
	}

	if _, err := tx.Exec(ctx, `
		insert into chronicles (
		  id, match_id, schema_version, hash, outcome, event_count,
		  snapshot_count, bottom_player_id, top_player_id,
		  bottom_strategy_revision_id, top_strategy_revision_id,
		  arena_variant_id, artifact
		)
		values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
	`, metadata.ID, metadata.MatchID, metadata.SchemaVersion, metadata.Hash, outcome, metadata.EventCount, metadata.SnapshotCount, metadata.BottomPlayerID, metadata.TopPlayerID, metadata.BottomStrategyRevisionID, metadata.TopStrategyRevisionID, metadata.ArenaVariantID, artifact); err != nil {
		return nil, err
	}
	tag, err := tx.Exec(ctx, `
		update matches
		set status = 'complete',
		    outcome = $1,
		    winner_player_id = $2,
		    surviving_soldiers = $3,
		    bottom_surviving_soldiers = $4,
		    top_surviving_soldiers = $5,
		    survival_turns = $6,
		    bottom_survival_turns = $7,
		    top_survival_turns = $8,
		    completed_at = now()
		where id = $9
	`, matchOutcome, fields.WinnerPlayerID, fields.SurvivingSoldiers, fields.BottomSurvivingSoldiers, fields.TopSurvivingSoldiers, fields.SurvivalTurns, fields.BottomSurvivalTurns, fields.TopSurvivalTurns, fields.MatchID)
	if err != nil {
		return nil, err
	}
	if tag.RowsAffected() != 1 {
		return nil, errors.New("completion did not update exactly one Match")
	}
	tag, err = tx.Exec(ctx, `
		update match_jobs
		set status = 'complete',
		    updated_at = now()
		where id = $1
	`, input.JobID)
	if err != nil {
		return nil, err
	}
	if tag.RowsAffected() != 1 {
		return nil, errors.New("completion did not update exactly one job")
	}
	tag, err = tx.Exec(ctx, `
		update match_job_attempts
		set finished_at = now(),
		    status = 'complete'
		where job_id = $1
		  and attempt_number = (
		    select attempts from match_jobs where id = $1
		  )
	`, input.JobID)
	if err != nil {
		return nil, err
	}
	if tag.RowsAffected() != 1 {
		return nil, errors.New("completion did not finish exactly one job attempt")
	}
	if err := refreshMatchSetsForMatchTx(ctx, tx, fields.MatchID); err != nil {
		return nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return &completeMatchResult{Status: "complete", MatchID: metadata.MatchID, ChronicleID: metadata.ID}, nil
}

func deriveGoMatchCompletionFields(finalState map[string]any) (matchCompletionFields, error) {
	matchID := stringValue(finalState, "matchId")
	if matchID == "" {
		return matchCompletionFields{}, errors.New("final state missing Match id")
	}
	bottomPlayerID, topPlayerID := sidePlayerIDs(finalState)
	survivalTurns := runtimeServiceIntValue(finalState, "phaseNumber")*16 + runtimeServiceIntValue(finalState, "roundNumber")*4 + runtimeServiceIntValue(finalState, "activationCount")
	outcome := finalState["outcome"]
	winner := winnerPlayerID(outcome)
	return matchCompletionFields{
		MatchID:                 matchID,
		Outcome:                 outcome,
		WinnerPlayerID:          winner,
		SurvivingSoldiers:       countGoSurvivingSoldiers(finalState, ""),
		BottomSurvivingSoldiers: countGoSurvivingSoldiers(finalState, bottomPlayerID),
		TopSurvivingSoldiers:    countGoSurvivingSoldiers(finalState, topPlayerID),
		SurvivalTurns:           survivalTurns,
		BottomSurvivalTurns:     survivalTurns,
		TopSurvivalTurns:        survivalTurns,
	}, nil
}

func sidePlayerIDs(finalState map[string]any) (string, string) {
	var bottom, top string
	for _, player := range sliceValue(finalState, "players") {
		row, ok := player.(map[string]any)
		if !ok {
			continue
		}
		switch stringValue(row, "side") {
		case "bottom":
			bottom = stringValue(row, "id")
		case "top":
			top = stringValue(row, "id")
		}
	}
	return bottom, top
}

func countGoSurvivingSoldiers(finalState map[string]any, ownerPlayerID string) int {
	count := 0
	for _, soldier := range sliceValue(finalState, "soldiers") {
		row, ok := soldier.(map[string]any)
		if !ok || stringValue(row, "status") == "FALLEN" {
			continue
		}
		if ownerPlayerID == "" || stringValue(row, "ownerPlayerId") == ownerPlayerID {
			count++
		}
	}
	return count
}

func winnerPlayerID(outcome any) *string {
	row, ok := outcome.(map[string]any)
	if !ok || stringValue(row, "type") != "WIN" {
		return nil
	}
	winner := stringValue(row, "winnerPlayerId")
	if winner == "" {
		return nil
	}
	return &winner
}

func createGoChronicleMetadata(chronicle map[string]any) (chronicleMetadata, error) {
	if hasPrivateOutputMarker(chronicle) {
		return chronicleMetadata{}, errors.New("Chronicle contains private output markers")
	}
	if err := validateGoChronicleShape(chronicle); err != nil {
		return chronicleMetadata{}, err
	}
	reproducibility, ok := chronicle["reproducibility"].(map[string]any)
	if !ok {
		return chronicleMetadata{}, errors.New("Chronicle missing reproducibility")
	}
	events := sliceValue(chronicle, "events")
	snapshots := sliceValue(chronicle, "snapshots")
	if len(events) == 0 || len(snapshots) == 0 {
		return chronicleMetadata{}, errors.New("Chronicle missing events or snapshots")
	}
	outcome, err := terminalChronicleOutcome(snapshots)
	if err != nil {
		return chronicleMetadata{}, err
	}
	strategyRevisionIDs := sliceValue(reproducibility, "strategyRevisionIds")
	if len(strategyRevisionIDs) < 2 {
		return chronicleMetadata{}, errors.New("Chronicle missing Strategy Revision ids")
	}
	hash, err := hashChronicleArtifact(chronicle)
	if err != nil {
		return chronicleMetadata{}, err
	}
	bottomPlayerID, topPlayerID := chroniclePlayerIDs(events)
	return chronicleMetadata{
		ID:                       "chronicle:" + hash,
		MatchID:                  stringValue(reproducibility, "matchId"),
		SchemaVersion:            stringValue(chronicle, "schemaVersion"),
		Hash:                     hash,
		Outcome:                  outcome,
		EventCount:               len(events),
		SnapshotCount:            len(snapshots),
		BottomPlayerID:           fallbackString(bottomPlayerID, "player:bottom"),
		TopPlayerID:              fallbackString(topPlayerID, "player:top"),
		BottomStrategyRevisionID: stringFromAny(strategyRevisionIDs[0]),
		TopStrategyRevisionID:    stringFromAny(strategyRevisionIDs[1]),
		ArenaVariantID:           stringValue(reproducibility, "arenaVariantId"),
	}, nil
}

func terminalChronicleOutcome(snapshots []any) (any, error) {
	for _, snapshot := range snapshots {
		row, ok := snapshot.(map[string]any)
		if ok && stringValue(row, "kind") == "TERMINAL" && row["outcome"] != nil {
			return row["outcome"], nil
		}
	}
	return nil, errors.New("Chronicle terminal snapshot is missing an outcome")
}

func chroniclePlayerIDs(events []any) (string, string) {
	distinct := []string{}
	seen := map[string]struct{}{}
	for _, event := range events {
		row, ok := event.(map[string]any)
		if !ok {
			continue
		}
		payload, _ := row["payload"].(map[string]any)
		context, _ := row["context"].(map[string]any)
		playerID := stringValue(payload, "playerId")
		if playerID == "" {
			playerID = stringValue(context, "actingPlayerId")
		}
		if playerID == "" {
			continue
		}
		if _, ok := seen[playerID]; !ok {
			seen[playerID] = struct{}{}
			distinct = append(distinct, playerID)
		}
	}
	if len(distinct) < 2 {
		return "player:bottom", "player:top"
	}
	return distinct[0], distinct[1]
}

func validateCompletionCompatibility(fields matchCompletionFields, metadata chronicleMetadata) error {
	if fields.MatchID != metadata.MatchID {
		return errors.New("completion Match id does not match Chronicle")
	}
	if !jsonValuesEqual(fields.Outcome, metadata.Outcome) {
		return errors.New("completion outcome does not match Chronicle terminal outcome")
	}
	if metadata.SchemaVersion == "" || metadata.ArenaVariantID == "" || metadata.BottomStrategyRevisionID == "" || metadata.TopStrategyRevisionID == "" {
		return errors.New("Chronicle metadata is incomplete")
	}
	return nil
}

func loadCompletionMatchOwnership(ctx context.Context, tx pgx.Tx, matchID string) (matchCompletionOwnershipRow, error) {
	var row matchCompletionOwnershipRow
	if err := tx.QueryRow(ctx, `
		select bottom_strategy_revision_id, top_strategy_revision_id, arena_variant_id, bottom_player_id, top_player_id
		from matches
		where id = $1
		for update
	`, matchID).Scan(&row.BottomStrategyRevisionID, &row.TopStrategyRevisionID, &row.ArenaVariantID, &row.BottomPlayerID, &row.TopPlayerID); err != nil {
		return matchCompletionOwnershipRow{}, err
	}
	return row, nil
}

func validateCompletionOwnership(row matchCompletionOwnershipRow, metadata chronicleMetadata) error {
	switch {
	case row.BottomStrategyRevisionID != metadata.BottomStrategyRevisionID:
		return errors.New("Chronicle bottom Strategy Revision does not match Match")
	case row.TopStrategyRevisionID != metadata.TopStrategyRevisionID:
		return errors.New("Chronicle top Strategy Revision does not match Match")
	case row.ArenaVariantID != metadata.ArenaVariantID:
		return errors.New("Chronicle arena variant does not match Match")
	case row.BottomPlayerID != metadata.BottomPlayerID:
		return errors.New("Chronicle bottom player does not match Match")
	case row.TopPlayerID != metadata.TopPlayerID:
		return errors.New("Chronicle top player does not match Match")
	default:
		return nil
	}
}

func existingCompatibleChronicle(ctx context.Context, tx pgx.Tx, metadata chronicleMetadata) (bool, string, error) {
	var existing chronicleMetadata
	var outcomeBytes []byte
	err := tx.QueryRow(ctx, `
		select c.id, c.match_id, c.schema_version, c.hash, c.outcome, c.event_count,
		       c.snapshot_count, c.bottom_player_id, c.top_player_id,
		       c.bottom_strategy_revision_id, c.top_strategy_revision_id, c.arena_variant_id
		from matches m
		join chronicles c on c.match_id = m.id
		where m.id = $1 and m.status = 'complete'
	`, metadata.MatchID).Scan(&existing.ID, &existing.MatchID, &existing.SchemaVersion, &existing.Hash, &outcomeBytes, &existing.EventCount, &existing.SnapshotCount, &existing.BottomPlayerID, &existing.TopPlayerID, &existing.BottomStrategyRevisionID, &existing.TopStrategyRevisionID, &existing.ArenaVariantID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return false, "", nil
		}
		return false, "", err
	}
	if err := json.Unmarshal(outcomeBytes, &existing.Outcome); err != nil {
		return false, "", err
	}
	compatible := existing.ID == metadata.ID &&
		existing.MatchID == metadata.MatchID &&
		existing.SchemaVersion == metadata.SchemaVersion &&
		existing.Hash == metadata.Hash &&
		existing.EventCount == metadata.EventCount &&
		existing.SnapshotCount == metadata.SnapshotCount &&
		existing.BottomPlayerID == metadata.BottomPlayerID &&
		existing.TopPlayerID == metadata.TopPlayerID &&
		existing.BottomStrategyRevisionID == metadata.BottomStrategyRevisionID &&
		existing.TopStrategyRevisionID == metadata.TopStrategyRevisionID &&
		existing.ArenaVariantID == metadata.ArenaVariantID &&
		jsonValuesEqual(existing.Outcome, metadata.Outcome)
	return compatible, existing.ID, nil
}

func hashChronicleArtifact(chronicle map[string]any) (string, error) {
	normalized := map[string]any{
		"schemaVersion":   chronicle["schemaVersion"],
		"reproducibility": chronicle["reproducibility"],
		"events":          chronicle["events"],
		"snapshots":       chronicle["snapshots"],
	}
	if privateSection, ok := chronicle["private"]; ok {
		normalized["private"] = privateSection
	}
	bytes, err := stableJSON(normalized)
	if err != nil {
		return "", err
	}
	sum := sha256.Sum256(bytes)
	return hex.EncodeToString(sum[:]), nil
}

func hasPrivateOutputMarker(value any) bool {
	return hasPrivateOutputMarkerAt(value, false)
}

func hasPrivateOutputMarkerAt(value any, insidePrivateSection bool) bool {
	switch typed := value.(type) {
	case string:
		if insidePrivateSection {
			return false
		}
		lower := strings.ToLower(typed)
		for _, marker := range []string{"private_", "golden_private_", "database_url", "postgres://", "postgresql://", "bearer ", "stack trace", "/users/", "/home/"} {
			if strings.Contains(lower, marker) {
				return true
			}
		}
		return false
	case []any:
		for _, item := range typed {
			if hasPrivateOutputMarkerAt(item, insidePrivateSection) {
				return true
			}
		}
		return false
	case map[string]any:
		for key, entry := range typed {
			privateScope := insidePrivateSection || key == "private"
			if !privateScope && forbiddenPublicOutputKey(key) {
				return true
			}
			if hasPrivateOutputMarkerAt(entry, privateScope) {
				return true
			}
		}
		return false
	default:
		return false
	}
}

func forbiddenPublicOutputKey(key string) bool {
	normalized := normalizePublicOutputKey(key)
	for _, forbidden := range []string{
		"source", "sourcetext", "strategysource", "strategymemory", "soldiermemory",
		"objective", "objectivepayload", "ownerdebug", "exactawarenessgrid",
		"awarenessgrid", "rawawarenessgrid", "rawruntimedetails", "runtimedetails",
		"privateruntime", "privatediagnostics", "privateerror", "stack", "stacktrace",
		"stderr", "password", "passwordhash", "authorization", "token", "tokens",
		"accesstoken", "refreshtoken", "session", "sessions", "sessionid", "hostpath",
		"hostpaths", "databaseurl", "dbdsn", "dsn", "runtimeinternal",
		"runtimeinternals", "privateruntimeinternal", "privateruntimeinternals",
	} {
		if normalized == forbidden {
			return true
		}
	}
	return false
}

func validateGoChronicleShape(chronicle map[string]any) error {
	schemaVersion := stringValue(chronicle, "schemaVersion")
	if schemaVersion != "chronicle-v1.4" {
		return fmt.Errorf("unsupported Chronicle schema version %q", schemaVersion)
	}
	reproducibility, ok := chronicle["reproducibility"].(map[string]any)
	if !ok || stringValue(reproducibility, "matchId") == "" || stringValue(reproducibility, "arenaVariantId") == "" {
		return errors.New("Chronicle reproducibility is incomplete")
	}
	events := sliceValue(chronicle, "events")
	snapshots := sliceValue(chronicle, "snapshots")
	if err := validateChronicleEventSequence(events); err != nil {
		return err
	}
	if err := validateChronicleSnapshots(snapshots); err != nil {
		return err
	}
	return nil
}

func validateChronicleEventSequence(events []any) error {
	if len(events) == 0 {
		return errors.New("Chronicle missing events")
	}
	sawStart := false
	sawEnd := false
	for index, event := range events {
		row, ok := event.(map[string]any)
		if !ok {
			return errors.New("Chronicle event is not an object")
		}
		if runtimeServiceIntValue(row, "sequence") != index {
			return errors.New("Chronicle event sequence is not contiguous")
		}
		switch stringValue(row, "type") {
		case "MATCH_STARTED":
			sawStart = sawStart || index == 0
		case "MATCH_ENDED":
			sawEnd = true
		}
	}
	if !sawStart || !sawEnd {
		return errors.New("Chronicle must include Match start and end events")
	}
	return nil
}

func validateChronicleSnapshots(snapshots []any) error {
	if len(snapshots) == 0 {
		return errors.New("Chronicle missing snapshots")
	}
	sawStart := false
	sawTerminal := false
	lastSequence := -1
	for _, snapshot := range snapshots {
		row, ok := snapshot.(map[string]any)
		if !ok {
			return errors.New("Chronicle snapshot is not an object")
		}
		sequence := runtimeServiceIntValue(row, "sequence")
		if sequence < lastSequence {
			return errors.New("Chronicle snapshot sequence moves backward")
		}
		lastSequence = sequence
		if err := validateChronicleBoard(row["board"]); err != nil {
			return err
		}
		switch stringValue(row, "kind") {
		case "MATCH_START":
			sawStart = true
		case "TERMINAL":
			if row["outcome"] == nil {
				return errors.New("Chronicle terminal snapshot is missing an outcome")
			}
			sawTerminal = true
		}
	}
	if !sawStart || !sawTerminal {
		return errors.New("Chronicle must include Match start and terminal snapshots")
	}
	return nil
}

func validateChronicleBoard(value any) error {
	board, ok := value.(map[string]any)
	if !ok {
		return errors.New("Chronicle snapshot board is missing")
	}
	bounds, ok := board["bounds"].(map[string]any)
	if !ok {
		return errors.New("Chronicle snapshot board bounds are missing")
	}
	for _, key := range []string{"minX", "maxX", "minY", "maxY"} {
		if _, ok := numericJSONValue(bounds[key]); !ok {
			return fmt.Errorf("Chronicle snapshot board bound %s is missing", key)
		}
	}
	if _, ok := board["soldiers"].([]any); !ok {
		return errors.New("Chronicle snapshot board soldiers are missing")
	}
	if _, ok := board["terrainStones"].([]any); !ok {
		return errors.New("Chronicle snapshot board terrain stones are missing")
	}
	return nil
}

func numericJSONValue(value any) (float64, bool) {
	switch typed := value.(type) {
	case float64:
		return typed, true
	case int:
		return float64(typed), true
	case int32:
		return float64(typed), true
	case int64:
		return float64(typed), true
	case json.Number:
		number, err := typed.Float64()
		return number, err == nil
	default:
		return 0, false
	}
}

func jsonValuesEqual(left any, right any) bool {
	normalizedLeft, err := normalizeJSONComparable(left)
	if err != nil {
		return false
	}
	normalizedRight, err := normalizeJSONComparable(right)
	if err != nil {
		return false
	}
	return reflect.DeepEqual(normalizedLeft, normalizedRight)
}

func normalizeJSONComparable(value any) (any, error) {
	bytes, err := json.Marshal(value)
	if err != nil {
		return nil, err
	}
	var normalized any
	if err := json.Unmarshal(bytes, &normalized); err != nil {
		return nil, err
	}
	return normalized, nil
}

func stableJSON(value any) ([]byte, error) {
	var builder strings.Builder
	if err := writeStableJSON(&builder, value); err != nil {
		return nil, err
	}
	return []byte(builder.String()), nil
}

func writeStableJSON(builder *strings.Builder, value any) error {
	switch typed := value.(type) {
	case map[string]any:
		keys := make([]string, 0, len(typed))
		for key := range typed {
			keys = append(keys, key)
		}
		sort.Strings(keys)
		builder.WriteByte('{')
		for index, key := range keys {
			if index > 0 {
				builder.WriteByte(',')
			}
			keyBytes, _ := json.Marshal(key)
			builder.Write(keyBytes)
			builder.WriteByte(':')
			if err := writeStableJSON(builder, typed[key]); err != nil {
				return err
			}
		}
		builder.WriteByte('}')
		return nil
	case []any:
		builder.WriteByte('[')
		for index, item := range typed {
			if index > 0 {
				builder.WriteByte(',')
			}
			if err := writeStableJSON(builder, item); err != nil {
				return err
			}
		}
		builder.WriteByte(']')
		return nil
	default:
		bytes, err := json.Marshal(typed)
		if err != nil {
			return err
		}
		builder.Write(bytes)
		return nil
	}
}

func sliceValue(value map[string]any, key string) []any {
	entry, ok := value[key].([]any)
	if !ok {
		return nil
	}
	return entry
}

func stringFromAny(value any) string {
	text, _ := value.(string)
	return text
}

func fallbackString(value string, fallback string) string {
	if value == "" {
		return fallback
	}
	return value
}

func maybeStringPtrValue(value *string) any {
	if value == nil {
		return nil
	}
	return *value
}

func mustJSONMap(value map[string]any) []byte {
	bytes, err := json.Marshal(value)
	if err != nil {
		panic(fmt.Sprintf("marshal JSON: %v", err))
	}
	return bytes
}
