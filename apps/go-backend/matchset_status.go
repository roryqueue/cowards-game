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

type successorMatchSetStatusEvidenceV119 struct {
	CanonicalConditionCount     int
	ValidTerminalConditionCount int
	RetryableSystemFailure      bool
	ExhaustedSystemFailure      bool
	InvalidRevisionEvidence     bool
}

type successorMatchSetStatusV119 struct {
	Status  string
	Counted bool
}

func determineSuccessorMatchSetStatusV119(evidence successorMatchSetStatusEvidenceV119) successorMatchSetStatusV119 {
	if evidence.ExhaustedSystemFailure {
		return successorMatchSetStatusV119{Status: matchSetStatusDegraded}
	}
	if evidence.CanonicalConditionCount == 4 && evidence.ValidTerminalConditionCount == 4 &&
		!evidence.RetryableSystemFailure && !evidence.InvalidRevisionEvidence {
		return successorMatchSetStatusV119{Status: matchSetStatusComplete, Counted: true}
	}
	return successorMatchSetStatusV119{Status: matchSetStatusPending}
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
	var compatibilityTupleID *string
	if err := tx.QueryRow(ctx, "select id, compatibility_tuple_id from match_sets where id = $1 for update", matchSetID).Scan(&lockedMatchSetID, &compatibilityTupleID); err != nil {
		return "", matchSetScore{}, err
	}
	if compatibilityTupleID != nil && *compatibilityTupleID == "sha256:37c9a07425d454c74859112debcc3ef362d43e80d5767560d9bde28a3c8d5e73" {
		return refreshSuccessorMatchSetStatusTxV119(ctx, tx, matchSetID)
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

type successorMatchSetRowV119 struct {
	scenarioID, arenaID, arenaCatalogVersion, arenaGeometryHash  string
	entrantAKey, entrantBKey, entrantAPlayerID, entrantBPlayerID string
	baseSeed, matchID, status                                    string
	bottomRevisionID, topRevisionID, bottomPlayerID, topPlayerID string
	winnerPlayerID                                               *string
	survivingSoldiers, bottomSurvivingSoldiers                   *int
	topSurvivingSoldiers, survivalTurns                          *int
	bottomSurvivalTurns, topSurvivalTurns                        *int
	conditionID, requestIdentity                                 string
	conditionOrdinal                                             int
	bottomEntrantKey, topEntrantKey, initialInitiativeEntrantKey string
	attempts, maxAttempts                                        int
	bottomExecutionEvidence, topExecutionEvidence                []byte
}

func currentSuccessorRevisionEvidenceV119(ctx context.Context, tx pgx.Tx, frozen candidateRevisionAdmissionV119) (*string, *string, error) {
	var id, root string
	err := tx.QueryRow(ctx, `
		select evidence.id, evidence.execution_receipt_root
		  from strategy_revision_v1_19_revalidations evidence
		  left join strategy_revision_v1_19_revalidation_revocations revoked
		    on revoked.revalidation_id = evidence.id
		 where evidence.strategy_revision_id = $1
		   and evidence.source_hash = $2 and evidence.source_bytes = $3
		   and evidence.artifact_sha256 = $4 and evidence.artifact_bytes = $5
		   and evidence.language_id = $6 and evidence.provider_id = $7 and evidence.lane_id = $8
		   and evidence.runtime_abi_version = 'strategy-runtime-abi-v1.19'
		   and evidence.semantic_runtime_version = 'runtime-v1.19'
		   and evidence.semantic_tuple_id = 'sha256:37c9a07425d454c74859112debcc3ef362d43e80d5767560d9bde28a3c8d5e73'
		   and evidence.reviewed_certificate_id = $9 and evidence.reviewed_certificate_sha256 = $10
		   and evidence.review_status = 'reviewed' and evidence.evidence_status = 'passed'
		   and revoked.id is null
		 limit 1
	`, frozen.StrategyRevisionID, frozen.SourceHash, frozen.SourceBytes, frozen.ArtifactSHA256,
		frozen.ArtifactBytes, frozen.LanguageID, frozen.ProviderID, frozen.LaneID,
		frozen.ReviewedCertificateID, frozen.ReviewedCertificateSHA256).Scan(&id, &root)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil, nil
	}
	if err != nil {
		return nil, nil, err
	}
	return &id, &root, nil
}

func refreshSuccessorMatchSetStatusTxV119(ctx context.Context, tx pgx.Tx, matchSetID string) (string, matchSetScore, error) {
	rows, err := tx.Query(ctx, `
		select ss.scenario_id, ss.arena_id, ss.arena_catalog_version,
		       ss.arena_semantic_geometry_hash, ss.entrant_a_key, ss.entrant_b_key,
		       ss.entrant_a_player_id, ss.entrant_b_player_id, ss.base_seed,
		       m.id, m.status::text, m.bottom_strategy_revision_id, m.top_strategy_revision_id,
		       m.bottom_player_id, m.top_player_id, m.winner_player_id,
		       m.surviving_soldiers, m.bottom_surviving_soldiers, m.top_surviving_soldiers,
		       m.survival_turns, m.bottom_survival_turns, m.top_survival_turns,
		       sc.condition_id, sc.condition_ordinal, sc.request_identity,
		       sc.bottom_entrant_key, sc.top_entrant_key, sc.initial_initiative_entrant_key,
		       j.attempts, j.max_attempts, m.bottom_execution_evidence,
		       m.top_execution_evidence
		  from set_scenarios ss
		  join set_conditions sc on sc.match_set_id=ss.match_set_id and sc.scenario_id=ss.scenario_id
		  join matches m on m.successor_match_set_id=sc.match_set_id
		   and m.successor_scenario_id=sc.scenario_id and m.successor_condition_id=sc.condition_id
		  join match_jobs j on j.match_id=m.id
		 where ss.match_set_id=$1
		 order by ss.scenario_id, sc.condition_ordinal
	`, matchSetID)
	if err != nil {
		return "", matchSetScore{}, err
	}
	defer rows.Close()
	persisted := []successorMatchSetRowV119{}
	for rows.Next() {
		var row successorMatchSetRowV119
		if err := rows.Scan(&row.scenarioID, &row.arenaID, &row.arenaCatalogVersion, &row.arenaGeometryHash,
			&row.entrantAKey, &row.entrantBKey, &row.entrantAPlayerID, &row.entrantBPlayerID, &row.baseSeed,
			&row.matchID, &row.status, &row.bottomRevisionID, &row.topRevisionID, &row.bottomPlayerID,
			&row.topPlayerID, &row.winnerPlayerID, &row.survivingSoldiers, &row.bottomSurvivingSoldiers,
			&row.topSurvivingSoldiers, &row.survivalTurns, &row.bottomSurvivalTurns, &row.topSurvivalTurns,
			&row.conditionID, &row.conditionOrdinal, &row.requestIdentity, &row.bottomEntrantKey,
			&row.topEntrantKey, &row.initialInitiativeEntrantKey, &row.attempts, &row.maxAttempts,
			&row.bottomExecutionEvidence, &row.topExecutionEvidence); err != nil {
			return "", matchSetScore{}, err
		}
		persisted = append(persisted, row)
	}
	if err := rows.Err(); err != nil {
		return "", matchSetScore{}, err
	}
	if len(persisted) == 0 {
		return "", matchSetScore{}, errors.New("candidate MatchSet has no persisted conditions")
	}

	first := persisted[0]
	revisionByEntrant := map[string]string{}
	for _, row := range persisted {
		revisionByEntrant[row.bottomEntrantKey] = row.bottomRevisionID
		revisionByEntrant[row.topEntrantKey] = row.topRevisionID
	}
	expected, err := generateCandidateFourConditionMatchesV119("runtime-v1.19", matchSetID, first.arenaID, first.baseSeed,
		candidateSetEntrantV119{EntrantKey: first.entrantAKey, StrategyRevisionID: revisionByEntrant[first.entrantAKey], PlayerID: first.entrantAPlayerID},
		candidateSetEntrantV119{EntrantKey: first.entrantBKey, StrategyRevisionID: revisionByEntrant[first.entrantBKey], PlayerID: first.entrantBPlayerID})
	if err != nil {
		return "", matchSetScore{}, err
	}
	candidates := make([]successorMatchScoreInputV119, 0, len(persisted))
	for _, row := range persisted {
		var bottomFrozen, topFrozen candidateEntrantExecutionEvidenceV119
		if err := json.Unmarshal(row.bottomExecutionEvidence, &bottomFrozen); err != nil {
			return "", matchSetScore{}, errors.New("candidate bottom D-04 evidence is invalid")
		}
		if err := json.Unmarshal(row.topExecutionEvidence, &topFrozen); err != nil {
			return "", matchSetScore{}, errors.New("candidate top D-04 evidence is invalid")
		}
		bottomCurrentID, bottomCurrentRoot, err := currentSuccessorRevisionEvidenceV119(ctx, tx, bottomFrozen.RevisionAdmission)
		if err != nil {
			return "", matchSetScore{}, err
		}
		topCurrentID, topCurrentRoot, err := currentSuccessorRevisionEvidenceV119(ctx, tx, topFrozen.RevisionAdmission)
		if err != nil {
			return "", matchSetScore{}, err
		}
		var winnerRevisionID *string
		if row.winnerPlayerID != nil {
			if *row.winnerPlayerID == row.bottomPlayerID {
				winnerRevisionID = stringPtr(row.bottomRevisionID)
			} else if *row.winnerPlayerID == row.topPlayerID {
				winnerRevisionID = stringPtr(row.topRevisionID)
			}
		}
		surviving := intOr(row.survivingSoldiers, 0)
		turns := intOr(row.survivalTurns, 0)
		terminalKind := ""
		if row.status == matchStatusComplete {
			terminalKind = "success"
		}
		candidates = append(candidates, successorMatchScoreInputV119{
			matchScoreInput: matchScoreInput{MatchID: row.matchID, BottomStrategyRevisionID: row.bottomRevisionID,
				TopStrategyRevisionID: row.topRevisionID, WinnerStrategyRevisionID: winnerRevisionID,
				Status: row.status, SurvivingSoldiers: surviving,
				BottomSurvivingSoldiers: intOr(row.bottomSurvivingSoldiers, surviving), TopSurvivingSoldiers: intOr(row.topSurvivingSoldiers, surviving),
				SurvivalTurns: turns, BottomSurvivalTurns: intOr(row.bottomSurvivalTurns, turns), TopSurvivalTurns: intOr(row.topSurvivalTurns, turns)},
			SemanticAuthorityKey: "runtime-v1.19", ScenarioID: row.scenarioID, ConditionID: row.conditionID,
			ConditionOrdinal: row.conditionOrdinal, RequestIdentity: row.requestIdentity,
			BottomEntrantKey: row.bottomEntrantKey, TopEntrantKey: row.topEntrantKey,
			InitialInitiativeEntrantKey: row.initialInitiativeEntrantKey, TerminalKind: terminalKind,
			AttemptNumber: row.attempts, RetryableSystemFailure: row.status == matchStatusFailedSystem && row.attempts < row.maxAttempts,
			BottomRevisionEvidence: successorRevisionEvidenceV119{StrategyRevisionID: row.bottomRevisionID,
				ScheduledRevalidationID: bottomFrozen.RevisionAdmission.RevalidationID, CurrentRevalidationID: bottomCurrentID,
				ScheduledRevalidationRoot: bottomFrozen.RevisionAdmission.ExecutionReceiptRoot, CurrentRevalidationRoot: bottomCurrentRoot,
				Revoked: bottomCurrentID == nil},
			TopRevisionEvidence: successorRevisionEvidenceV119{StrategyRevisionID: row.topRevisionID,
				ScheduledRevalidationID: topFrozen.RevisionAdmission.RevalidationID, CurrentRevalidationID: topCurrentID,
				ScheduledRevalidationRoot: topFrozen.RevisionAdmission.ExecutionReceiptRoot, CurrentRevalidationRoot: topCurrentRoot,
				Revoked: topCurrentID == nil},
		})
	}
	successor, err := scoreSuccessorMatchSetV119(expected, candidates)
	if err != nil {
		return "", matchSetScore{}, err
	}
	scoringBytes, err := json.Marshal(successor)
	if err != nil {
		return "", matchSetScore{}, err
	}
	countedStatus := "pending"
	var publicReason *string
	if successor.Counted {
		countedStatus = "counted"
	} else if successor.Status == matchSetStatusDegraded {
		countedStatus = "degraded_system_failure"
		publicReason = stringPtr("system_failure")
	}
	if _, err := tx.Exec(ctx, `
		update match_sets set status=$1::match_set_status, scoring=$2, degraded=$3,
		       counted_status=$4, public_counted_reason=$5,
		       completed_at=case when $1::match_set_status in ('complete','degraded') then now() else completed_at end
		 where id=$6
	`, successor.Status, scoringBytes, successor.Degraded, countedStatus, publicReason, matchSetID); err != nil {
		return "", matchSetScore{}, err
	}
	return successor.Status, matchSetScore{Degraded: successor.Degraded, Complete: successor.Complete, Rankings: successor.Rankings}, nil
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
