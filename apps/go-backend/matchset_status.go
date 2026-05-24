package main

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type matchSetStatusService struct {
	pool *pgxpool.Pool
}

func newMatchSetStatusService(pool *pgxpool.Pool) *matchSetStatusService {
	return &matchSetStatusService{pool: pool}
}

func (service *matchSetStatusService) refreshMatchSetStatus(ctx context.Context, matchSetID string) (string, matchSetScore, error) {
	if service == nil || service.pool == nil {
		return "", matchSetScore{}, errors.New("MatchSet status refresh requires a database pool")
	}
	tx, err := service.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return "", matchSetScore{}, err
	}
	defer rollbackTx(ctx, tx)

	status, scoring, err := refreshMatchSetStatusTx(ctx, tx, matchSetID)
	if err != nil {
		return "", matchSetScore{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return "", matchSetScore{}, err
	}
	return status, scoring, nil
}

func refreshMatchSetsForMatchTx(ctx context.Context, tx pgx.Tx, matchID string) error {
	rows, err := tx.Query(ctx, "select match_set_id from match_set_matches where match_id = $1", matchID)
	if err != nil {
		return err
	}

	matchSetIDs := []string{}
	for rows.Next() {
		var matchSetID string
		if err := rows.Scan(&matchSetID); err != nil {
			rows.Close()
			return err
		}
		matchSetIDs = append(matchSetIDs, matchSetID)
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		return err
	}
	rows.Close()

	for _, matchSetID := range matchSetIDs {
		if _, _, err := refreshMatchSetStatusTx(ctx, tx, matchSetID); err != nil {
			return err
		}
	}
	return nil
}

func refreshMatchSetStatusTx(ctx context.Context, tx pgx.Tx, matchSetID string) (string, matchSetScore, error) {
	var lockedMatchSetID string
	if err := tx.QueryRow(ctx, "select id from match_sets where id = $1 for update", matchSetID).Scan(&lockedMatchSetID); err != nil {
		return "", matchSetScore{}, err
	}
	matches, statuses, err := listMatchSetScoreInputsTx(ctx, tx, matchSetID)
	if err != nil {
		return "", matchSetScore{}, err
	}
	scoring := scoreMatchSet(matches)
	status := determineMatchSetStatus(scoring, statuses)
	scoringBytes, err := json.Marshal(scoring)
	if err != nil {
		return "", matchSetScore{}, err
	}
	tag, err := tx.Exec(ctx, `
		update match_sets
		set status = $1::match_set_status,
		    scoring = $2,
		    degraded = $3,
		    completed_at = case when $1::match_set_status in ('complete', 'degraded') then now() else completed_at end
		where id = $4
	`, status, scoringBytes, scoring.Degraded, matchSetID)
	if err != nil {
		return "", matchSetScore{}, err
	}
	if tag.RowsAffected() != 1 {
		return "", matchSetScore{}, errors.New("MatchSet status refresh did not update exactly one MatchSet")
	}
	return status, scoring, nil
}

func listMatchSetScoreInputsTx(ctx context.Context, tx pgx.Tx, matchSetID string) ([]matchScoreInput, []string, error) {
	rows, err := tx.Query(ctx, `
		select
		  m.id as match_id,
		  m.status::text,
		  m.bottom_strategy_revision_id,
		  m.top_strategy_revision_id,
		  m.winner_player_id,
		  m.bottom_player_id,
		  m.top_player_id,
		  m.surviving_soldiers,
		  m.bottom_surviving_soldiers,
		  m.top_surviving_soldiers,
		  m.survival_turns,
		  m.bottom_survival_turns,
		  m.top_survival_turns,
		  c.artifact
		from match_set_matches msm
		join matches m on m.id = msm.match_id
		left join chronicles c on c.match_id = m.id
		where msm.match_set_id = $1
		order by msm.matrix_index asc
	`, matchSetID)
	if err != nil {
		return nil, nil, err
	}
	defer rows.Close()

	matches := []matchScoreInput{}
	statuses := []string{}
	for rows.Next() {
		var row struct {
			matchID                  string
			status                   string
			bottomStrategyRevisionID string
			topStrategyRevisionID    string
			winnerPlayerID           *string
			bottomPlayerID           string
			topPlayerID              string
			survivingSoldiers        *int
			bottomSurvivingSoldiers  *int
			topSurvivingSoldiers     *int
			survivalTurns            *int
			bottomSurvivalTurns      *int
			topSurvivalTurns         *int
			chronicleArtifact        []byte
		}
		if err := rows.Scan(&row.matchID, &row.status, &row.bottomStrategyRevisionID, &row.topStrategyRevisionID, &row.winnerPlayerID, &row.bottomPlayerID, &row.topPlayerID, &row.survivingSoldiers, &row.bottomSurvivingSoldiers, &row.topSurvivingSoldiers, &row.survivalTurns, &row.bottomSurvivalTurns, &row.topSurvivalTurns, &row.chronicleArtifact); err != nil {
			return nil, nil, err
		}
		var winnerStrategyRevisionID *string
		if row.winnerPlayerID != nil {
			switch *row.winnerPlayerID {
			case row.bottomPlayerID:
				winnerStrategyRevisionID = stringPtr(row.bottomStrategyRevisionID)
			case row.topPlayerID:
				winnerStrategyRevisionID = stringPtr(row.topStrategyRevisionID)
			}
		}
		survivingSoldiers := intOr(row.survivingSoldiers, 0)
		survivalTurns := intOr(row.survivalTurns, 0)
		matches = append(matches, matchScoreInput{
			MatchID:                  row.matchID,
			BottomStrategyRevisionID: row.bottomStrategyRevisionID,
			TopStrategyRevisionID:    row.topStrategyRevisionID,
			WinnerStrategyRevisionID: winnerStrategyRevisionID,
			StrategyFailureRevisionID: strategyFailureRevisionIDFromChronicle(
				row.chronicleArtifact,
				row.bottomPlayerID,
				row.topPlayerID,
				row.bottomStrategyRevisionID,
				row.topStrategyRevisionID,
			),
			Status:                  row.status,
			SurvivingSoldiers:       survivingSoldiers,
			BottomSurvivingSoldiers: intOr(row.bottomSurvivingSoldiers, survivingSoldiers),
			TopSurvivingSoldiers:    intOr(row.topSurvivingSoldiers, survivingSoldiers),
			SurvivalTurns:           survivalTurns,
			BottomSurvivalTurns:     intOr(row.bottomSurvivalTurns, survivalTurns),
			TopSurvivalTurns:        intOr(row.topSurvivalTurns, survivalTurns),
		})
		statuses = append(statuses, row.status)
	}
	if err := rows.Err(); err != nil {
		return nil, nil, err
	}
	return matches, statuses, nil
}

func intOr(value *int, fallback int) int {
	if value == nil {
		return fallback
	}
	return *value
}

func stringPtr(value string) *string {
	return &value
}

func strategyFailureRevisionIDFromChronicle(artifact []byte, bottomPlayerID string, topPlayerID string, bottomRevisionID string, topRevisionID string) *string {
	if len(artifact) == 0 {
		return nil
	}
	var chronicle map[string]any
	if err := json.Unmarshal(artifact, &chronicle); err != nil {
		return nil
	}
	for _, event := range sliceValue(chronicle, "events") {
		eventMap, ok := event.(map[string]any)
		if !ok || stringValue(eventMap, "type") != "RUNTIME_VIOLATION" {
			continue
		}
		payload, _ := eventMap["payload"].(map[string]any)
		contextMap, _ := eventMap["context"].(map[string]any)
		playerID := firstNonEmptyString(
			stringValue(payload, "ownerPlayerId"),
			stringValue(payload, "playerId"),
			stringValue(contextMap, "actingPlayerId"),
		)
		switch playerID {
		case bottomPlayerID:
			return stringPtr(bottomRevisionID)
		case topPlayerID:
			return stringPtr(topRevisionID)
		}
	}
	return nil
}

func firstNonEmptyString(values ...string) string {
	for _, value := range values {
		if value != "" {
			return value
		}
	}
	return ""
}
