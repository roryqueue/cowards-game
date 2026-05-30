package main

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/jackc/pgx/v5"
)

const (
	matchExecutionQuarantineStatusActive   = "active"
	matchExecutionQuarantineRetryExhausted = "retry_exhausted"
	matchExecutionQuarantineNonRetryable   = "non_retryable_terminal"
)

type matchExecutionQuarantineRecord struct {
	ID               string         `json:"id"`
	JobID            string         `json:"jobId"`
	MatchID          string         `json:"matchId"`
	Status           string         `json:"status"`
	Reason           string         `json:"reason"`
	FailureCategory  string         `json:"failureCategory"`
	Retryable        bool           `json:"retryable"`
	AttemptNumber    int            `json:"attemptNumber"`
	OperatorEvidence map[string]any `json:"operatorEvidence"`
}

func quarantineReasonForAttempt(attempts int, maxAttempts int, retryable bool) string {
	if retryable && attempts >= maxAttempts {
		return matchExecutionQuarantineRetryExhausted
	}
	return matchExecutionQuarantineNonRetryable
}

func matchExecutionQuarantineID(jobID string) string {
	return "match-execution-quarantine:" + jobID
}

func writeMatchExecutionQuarantineTx(ctx context.Context, tx pgx.Tx, input recordAttemptFailureInput, attempts int, maxAttempts int, matchID string, failureCategory string, sanitizedDetails map[string]any) error {
	reason := quarantineReasonForAttempt(attempts, maxAttempts, input.Retryable)
	evidence := map[string]any{
		"errorClass":      input.ErrorClass,
		"retryable":       input.Retryable,
		"attemptNumber":   attempts,
		"maxAttempts":     maxAttempts,
		"failureCategory": failureCategory,
		"details":         sanitizedDetails,
	}
	evidenceBytes, err := json.Marshal(sanitizeMatchExecutionOperatorEvidence(evidence))
	if err != nil {
		return fmt.Errorf("encode quarantine evidence: %w", err)
	}
	_, err = tx.Exec(ctx, `
		insert into match_execution_quarantines (
		  id, job_id, match_id, status, reason, failure_category,
		  retryable, attempt_number, operator_evidence
		)
		values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		on conflict (job_id) do update
		set status = excluded.status,
		    reason = excluded.reason,
		    failure_category = excluded.failure_category,
		    retryable = excluded.retryable,
		    attempt_number = excluded.attempt_number,
		    operator_evidence = excluded.operator_evidence,
		    updated_at = now()
	`, matchExecutionQuarantineID(input.JobID), input.JobID, matchID, matchExecutionQuarantineStatusActive, reason, failureCategory, input.Retryable, attempts, evidenceBytes)
	return err
}

func sanitizeMatchExecutionOperatorEvidence(evidence map[string]any) map[string]any {
	if evidence == nil {
		return map[string]any{}
	}
	allowedScalars := map[string]struct{}{
		"errorClass":      {},
		"retryable":       {},
		"attemptNumber":   {},
		"maxAttempts":     {},
		"failureCategory": {},
	}
	safe := map[string]any{}
	for key, value := range evidence {
		if key == "details" {
			if nested, ok := value.(map[string]any); ok {
				safe[key] = sanitizeMatchJobFailureDetails(nested)
			}
			continue
		}
		if _, allowed := allowedScalars[key]; allowed && isJSONScalar(value) {
			safe[key] = value
		}
	}
	return safe
}
