package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	matchExecutionRecoveryActionRequeue = "requeue"
	matchExecutionRecoveryActionRerun   = "rerun"
)

type matchExecutionRecoveryService struct {
	pool *pgxpool.Pool
}

type recoverMatchExecutionJobInput struct {
	JobID          string
	OperatorID     string
	IdempotencyKey string
	ActionType     string
}

type recoverMatchExecutionJobResult struct {
	Status         string         `json:"status"`
	ActionID       string         `json:"actionId"`
	ActionType     string         `json:"actionType"`
	JobID          string         `json:"jobId"`
	MatchID        string         `json:"matchId"`
	IdempotencyKey string         `json:"idempotencyKey"`
	OperatorID     string         `json:"-"`
	Reason         string         `json:"reason,omitempty"`
	Result         map[string]any `json:"result,omitempty"`
}

func newMatchExecutionRecoveryService(pool *pgxpool.Pool) *matchExecutionRecoveryService {
	return &matchExecutionRecoveryService{pool: pool}
}

func (service *matchExecutionRecoveryService) recoverJob(ctx context.Context, input recoverMatchExecutionJobInput) (*recoverMatchExecutionJobResult, error) {
	if service == nil || service.pool == nil {
		return nil, errors.New("match execution recovery requires a database pool")
	}
	normalized, err := normalizeRecoverMatchExecutionJobInput(input)
	if err != nil {
		return nil, err
	}

	tx, err := service.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return nil, err
	}
	defer rollbackTx(ctx, tx)

	existing, err := loadRecoveryActionByIdempotencyKey(ctx, tx, normalized.IdempotencyKey)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		if err := tx.Commit(ctx); err != nil {
			return nil, err
		}
		existing.Status = "duplicate"
		return existing, nil
	}

	row, err := loadRecoverableExecutionJob(ctx, tx, normalized.JobID)
	if err != nil {
		return nil, err
	}
	actionID := matchExecutionOperatorActionID(normalized.IdempotencyKey)
	if row == nil {
		if err := tx.Commit(ctx); err != nil {
			return nil, err
		}
		return rejectedRecoveryResult(normalized, actionID, "job_not_found"), nil
	}
	result := recoveryResultForRow(normalized, actionID, *row)
	if result.Status == "applied" {
		if _, err := tx.Exec(ctx, `
			update match_jobs
			set status = 'queued',
			    max_attempts = greatest(max_attempts, attempts + 1),
			    worker_id = null,
			    lease_token = null,
			    lease_expires_at = null,
			    run_after = now(),
			    updated_at = now()
			where id = $1
		`, row.JobID); err != nil {
			return nil, err
		}
		if _, err := tx.Exec(ctx, `
			update matches
			set status = 'pending',
			    failure_category = null,
			    failure_message = null,
			    completed_at = null
			where id = $1
		`, row.MatchID); err != nil {
			return nil, err
		}
		if _, err := tx.Exec(ctx, `
			update match_execution_quarantines
			set status = 'released',
			    updated_at = now()
			where job_id = $1
		`, row.JobID); err != nil {
			return nil, err
		}
	}
	if err := insertRecoveryActionTx(ctx, tx, result, result.Status); err != nil {
		return nil, err
	}
	if result.Status == "applied" {
		if err := refreshMatchSetsForMatchTx(ctx, tx, row.MatchID); err != nil {
			return nil, err
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return result, nil
}

type recoverableExecutionJobRow struct {
	JobID            string
	MatchID          string
	JobStatus        string
	MatchStatus      string
	Attempts         int
	MaxAttempts      int
	FailureCategory  string
	QuarantineStatus string
	QuarantineReason string
	HasChronicle     bool
}

func normalizeRecoverMatchExecutionJobInput(input recoverMatchExecutionJobInput) (recoverMatchExecutionJobInput, error) {
	input.JobID = strings.TrimSpace(input.JobID)
	input.OperatorID = strings.TrimSpace(input.OperatorID)
	input.IdempotencyKey = strings.TrimSpace(input.IdempotencyKey)
	input.ActionType = strings.TrimSpace(input.ActionType)
	if input.ActionType == "" {
		input.ActionType = matchExecutionRecoveryActionRequeue
	}
	if input.JobID == "" {
		return input, errors.New("job id is required")
	}
	if input.OperatorID == "" {
		return input, errors.New("operator id is required")
	}
	if input.IdempotencyKey == "" {
		return input, errors.New("idempotency key is required")
	}
	if input.ActionType != matchExecutionRecoveryActionRequeue && input.ActionType != matchExecutionRecoveryActionRerun {
		return input, errors.New("unsupported recovery action")
	}
	return input, nil
}

func loadRecoverableExecutionJob(ctx context.Context, tx pgx.Tx, jobID string) (*recoverableExecutionJobRow, error) {
	var row recoverableExecutionJobRow
	err := tx.QueryRow(ctx, `
		select
		  j.id,
		  j.match_id,
		  j.status::text,
		  m.status::text,
		  j.attempts,
		  j.max_attempts,
		  coalesce(m.failure_category, ''),
		  q.status,
		  q.reason,
		  exists(select 1 from chronicles c where c.match_id = j.match_id)
		from match_jobs j
		join matches m on m.id = j.match_id
		join match_execution_quarantines q on q.job_id = j.id
		where j.id = $1
		for update
	`, jobID).Scan(&row.JobID, &row.MatchID, &row.JobStatus, &row.MatchStatus, &row.Attempts, &row.MaxAttempts, &row.FailureCategory, &row.QuarantineStatus, &row.QuarantineReason, &row.HasChronicle)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &row, nil
}

func recoveryResultForRow(input recoverMatchExecutionJobInput, actionID string, row recoverableExecutionJobRow) *recoverMatchExecutionJobResult {
	result := &recoverMatchExecutionJobResult{
		Status:         "applied",
		ActionID:       actionID,
		ActionType:     input.ActionType,
		JobID:          row.JobID,
		MatchID:        row.MatchID,
		IdempotencyKey: input.IdempotencyKey,
		OperatorID:     input.OperatorID,
		Result: map[string]any{
			"previousJobStatus":       row.JobStatus,
			"previousMatchStatus":     row.MatchStatus,
			"previousAttempts":        row.Attempts,
			"previousMaxAttempts":     row.MaxAttempts,
			"quarantineReason":        row.QuarantineReason,
			"failureCategory":         row.FailureCategory,
			"authorizedAdditionalRun": true,
			"publicContractChanged":   false,
		},
	}
	if row.QuarantineStatus != matchExecutionQuarantineStatusActive {
		return rejectRecoveryResult(result, "quarantine_not_active")
	}
	if row.JobStatus != "failed_system" || row.MatchStatus != "failed_system" {
		return rejectRecoveryResult(result, "job_not_terminal_failed")
	}
	if row.HasChronicle {
		return rejectRecoveryResult(result, "chronicle_exists")
	}
	if !canOperatorRecoverFailureCategory(row.FailureCategory) {
		return rejectRecoveryResult(result, "failure_category_not_recoverable")
	}
	return result
}

func canOperatorRecoverFailureCategory(category string) bool {
	switch category {
	case matchFailureCategoryMalformedRuntimeResult, matchFailureCategoryStaleArtifact:
		return false
	default:
		return true
	}
}

func rejectRecoveryResult(result *recoverMatchExecutionJobResult, reason string) *recoverMatchExecutionJobResult {
	result.Status = "rejected"
	result.Reason = reason
	if result.Result == nil {
		result.Result = map[string]any{}
	}
	result.Result["rejectedReason"] = reason
	result.Result["publicContractChanged"] = false
	return result
}

func rejectedRecoveryResult(input recoverMatchExecutionJobInput, actionID string, reason string) *recoverMatchExecutionJobResult {
	return rejectRecoveryResult(&recoverMatchExecutionJobResult{
		ActionID:       actionID,
		ActionType:     input.ActionType,
		JobID:          input.JobID,
		IdempotencyKey: input.IdempotencyKey,
		OperatorID:     input.OperatorID,
		Result:         map[string]any{},
	}, reason)
}

func insertRecoveryActionTx(ctx context.Context, tx pgx.Tx, result *recoverMatchExecutionJobResult, status string) error {
	payload, err := json.Marshal(result.Result)
	if err != nil {
		return fmt.Errorf("encode recovery action result: %w", err)
	}
	_, err = tx.Exec(ctx, `
		insert into match_execution_operator_actions (
		  id, idempotency_key, action_type, job_id, match_id, operator_id, status, result
		)
		values ($1, $2, $3, $4, $5, $6, $7, $8)
	`, result.ActionID, result.IdempotencyKey, result.ActionType, result.JobID, result.MatchID, result.OperatorID, status, payload)
	if err != nil {
		return err
	}
	return nil
}

func loadRecoveryActionByIdempotencyKey(ctx context.Context, tx pgx.Tx, key string) (*recoverMatchExecutionJobResult, error) {
	var result recoverMatchExecutionJobResult
	var status string
	var payload []byte
	err := tx.QueryRow(ctx, `
		select id, action_type, job_id, match_id, idempotency_key, status, result
		from match_execution_operator_actions
		where idempotency_key = $1
	`, key).Scan(&result.ActionID, &result.ActionType, &result.JobID, &result.MatchID, &result.IdempotencyKey, &status, &payload)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	result.Status = status
	result.Result = map[string]any{}
	if len(payload) > 0 {
		if err := json.Unmarshal(payload, &result.Result); err != nil {
			return nil, err
		}
	}
	if reason, ok := result.Result["rejectedReason"].(string); ok {
		result.Reason = reason
	}
	return &result, nil
}

func matchExecutionOperatorActionID(idempotencyKey string) string {
	return "match-execution-operator-action:" + idempotencyKey
}
