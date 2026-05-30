package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const defaultMatchJobLease = 30 * time.Second

const claimNextMatchJobSQL = `
  select id, match_id, attempts
  from match_jobs
  where
    (status = 'queued' and run_after <= $1)
    or (status = 'running' and lease_expires_at < $1)
  order by run_after asc, created_at asc
  for update skip locked
  limit 1
`

const claimNextMatchJobWithAllowlistSQL = `
  select id, match_id, attempts
  from match_jobs
  where match_id = any($2::text[])
    and (
      (status = 'queued' and run_after <= $1)
      or (status = 'running' and lease_expires_at < $1)
    )
  order by run_after asc, created_at asc
  for update skip locked
  limit 1
`

type matchJobLifecycle struct {
	pool          *pgxpool.Pool
	now           func() time.Time
	newLeaseToken func() (string, error)
}

type claimMatchJobInput struct {
	WorkerID string
	MatchIDs []string
	Lease    time.Duration
}

type claimedMatchJob struct {
	JobID          string
	MatchID        string
	AttemptNumber  int
	LeaseToken     string
	LeaseExpiresAt time.Time
}

type recordAttemptFailureInput struct {
	JobID        string
	LeaseToken   string
	ErrorClass   string
	ErrorMessage string
	Retryable    bool
	Category     string
	Details      map[string]any
}

func newMatchJobLifecycle(pool *pgxpool.Pool) *matchJobLifecycle {
	return &matchJobLifecycle{
		pool:          pool,
		now:           time.Now,
		newLeaseToken: createGoLeaseToken,
	}
}

func createGoLeaseToken() (string, error) {
	var bytes [16]byte
	if _, err := rand.Read(bytes[:]); err != nil {
		return "", err
	}
	return "go-lease:" + hex.EncodeToString(bytes[:]), nil
}

func (lifecycle *matchJobLifecycle) claimNextMatchJob(ctx context.Context, input claimMatchJobInput) (*claimedMatchJob, error) {
	if lifecycle == nil || lifecycle.pool == nil {
		return nil, errors.New("match job lifecycle requires a database pool")
	}
	if input.WorkerID == "" {
		return nil, errors.New("worker id is required")
	}
	now := lifecycle.currentTime()
	lease := input.Lease
	if lease <= 0 {
		lease = defaultMatchJobLease
	}
	leaseToken, err := lifecycle.newLeaseToken()
	if err != nil {
		return nil, fmt.Errorf("create lease token: %w", err)
	}
	leaseExpiresAt := now.Add(lease)

	tx, err := lifecycle.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return nil, err
	}
	defer rollbackTx(ctx, tx)

	var row struct {
		id       string
		matchID  string
		attempts int
	}
	query := claimNextMatchJobSQL
	args := []any{now}
	if input.MatchIDs != nil {
		query = claimNextMatchJobWithAllowlistSQL
		args = []any{now, input.MatchIDs}
	}
	if err := tx.QueryRow(ctx, query, args...).Scan(&row.id, &row.matchID, &row.attempts); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	attemptNumber := row.attempts + 1
	if _, err := tx.Exec(ctx, `
		update match_jobs
		set status = 'running',
		    worker_id = $1,
		    lease_token = $2,
		    lease_expires_at = $3,
		    attempts = $4,
		    updated_at = now()
		where id = $5
	`, input.WorkerID, leaseToken, leaseExpiresAt, attemptNumber, row.id); err != nil {
		return nil, err
	}
	if _, err := tx.Exec(ctx, "update matches set status = 'running' where id = $1", row.matchID); err != nil {
		return nil, err
	}
	if _, err := tx.Exec(ctx, `
		insert into match_job_attempts (
		  id, job_id, attempt_number, worker_id, status
		)
		values ($1, $2, $3, $4, 'running')
	`, fmt.Sprintf("match-job-attempt:%s:%d", row.id, attemptNumber), row.id, attemptNumber, input.WorkerID); err != nil {
		return nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return &claimedMatchJob{
		JobID:          row.id,
		MatchID:        row.matchID,
		AttemptNumber:  attemptNumber,
		LeaseToken:     leaseToken,
		LeaseExpiresAt: leaseExpiresAt,
	}, nil
}

func (lifecycle *matchJobLifecycle) heartbeatMatchJob(ctx context.Context, jobID string, leaseToken string, lease time.Duration) (bool, error) {
	if lifecycle == nil || lifecycle.pool == nil {
		return false, errors.New("match job lifecycle requires a database pool")
	}
	if lease <= 0 {
		lease = defaultMatchJobLease
	}
	leaseExpiresAt := lifecycle.currentTime().Add(lease)
	tag, err := lifecycle.pool.Exec(ctx, `
		update match_jobs
		set lease_expires_at = $1,
		    updated_at = now()
		where id = $2 and lease_token = $3 and status = 'running'
	`, leaseExpiresAt, jobID, leaseToken)
	if err != nil {
		return false, err
	}
	return tag.RowsAffected() > 0, nil
}

func (lifecycle *matchJobLifecycle) recordAttemptFailure(ctx context.Context, input recordAttemptFailureInput) (string, error) {
	if lifecycle == nil || lifecycle.pool == nil {
		return "", errors.New("match job lifecycle requires a database pool")
	}
	sanitizedDetails := sanitizeMatchJobFailureDetails(input.Details)
	details, err := json.Marshal(sanitizedDetails)
	if err != nil {
		return "", fmt.Errorf("encode failure details: %w", err)
	}

	tx, err := lifecycle.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return "", err
	}
	defer rollbackTx(ctx, tx)

	var row struct {
		attempts    int
		maxAttempts int
		matchID     string
	}
	if err := tx.QueryRow(ctx, `
		select attempts, max_attempts, match_id
		from match_jobs
		where id = $1 and lease_token = $2 and status = 'running'
		for update
	`, input.JobID, input.LeaseToken).Scan(&row.attempts, &row.maxAttempts, &row.matchID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", errors.New("cannot record failure for unclaimed job")
		}
		return "", err
	}

	exhausted := shouldExhaustMatchJobRetries(row.attempts, row.maxAttempts, input.Retryable)
	failureCategory := input.Category
	if failureCategory == "" {
		failureCategory = classifyMatchFailure(input.ErrorClass, input.Retryable, sanitizeMatchJobFailureDetails(input.Details)).Category
	}
	if _, err := tx.Exec(ctx, `
		update match_job_attempts
		set finished_at = now(),
		    status = 'failed_system',
		    error_class = $1,
		    error_message = $2,
		    retryable = $3,
		    details = $4
		where job_id = $5 and attempt_number = $6
	`, input.ErrorClass, input.ErrorMessage, input.Retryable, details, input.JobID, row.attempts); err != nil {
		return "", err
	}

	status := "retry_queued"
	if exhausted {
		if _, err := tx.Exec(ctx, `
			update match_jobs
			set status = 'failed_system',
			    updated_at = now()
			where id = $1
		`, input.JobID); err != nil {
			return "", err
		}
		if _, err := tx.Exec(ctx, `
			update matches
			set status = 'failed_system',
			    failure_category = $1,
			    failure_message = $2,
			    completed_at = now()
			where id = $3
		`, failureCategory, input.ErrorMessage, row.matchID); err != nil {
			return "", err
		}
		if err := refreshMatchSetsForMatchTx(ctx, tx, row.matchID); err != nil {
			return "", err
		}
		if err := writeMatchExecutionQuarantineTx(ctx, tx, input, row.attempts, row.maxAttempts, row.matchID, failureCategory, sanitizedDetails); err != nil {
			return "", err
		}
		status = "failed_system"
	} else if _, err := tx.Exec(ctx, `
		update match_jobs
		set status = 'queued',
		    worker_id = null,
		    lease_token = null,
		    lease_expires_at = null,
		    updated_at = now()
		where id = $1
	`, input.JobID); err != nil {
		return "", err
	}

	if err := tx.Commit(ctx); err != nil {
		return "", err
	}
	return status, nil
}

func (lifecycle *matchJobLifecycle) currentTime() time.Time {
	if lifecycle.now == nil {
		return time.Now()
	}
	return lifecycle.now()
}

func shouldExhaustMatchJobRetries(attempts int, maxAttempts int, retryable bool) bool {
	return !retryable || attempts >= maxAttempts
}

func rollbackTx(ctx context.Context, tx pgx.Tx) {
	_ = tx.Rollback(ctx)
}

func sanitizeMatchJobFailureDetails(details map[string]any) map[string]any {
	if details == nil {
		return map[string]any{}
	}
	allowedScalars := map[string]struct{}{
		"workerId":                           {},
		"matchId":                            {},
		"strategyExecutionAdapterId":         {},
		"strategyExecutionAdapterBoundary":   {},
		"strategyExecutionSystemFailureCode": {},
		"cause":                              {},
		"signal":                             {},
		"status":                             {},
		"streamName":                         {},
		"actualBytes":                        {},
		"capBytes":                           {},
		"reason":                             {},
		"slot":                               {},
		"languageId":                         {},
	}
	safe := map[string]any{}
	for key, value := range details {
		if key == "strategyExecutionSystemFailureDetails" {
			if nested, ok := value.(map[string]any); ok {
				nestedSafe := map[string]any{}
				for nestedKey, nestedValue := range nested {
					if _, allowed := allowedScalars[nestedKey]; allowed && isJSONScalar(nestedValue) {
						nestedSafe[nestedKey] = nestedValue
					}
				}
				if len(nestedSafe) > 0 {
					safe[key] = nestedSafe
				}
			}
			continue
		}
		if _, allowed := allowedScalars[key]; allowed && isJSONScalar(value) {
			safe[key] = value
		}
	}
	return safe
}

func isJSONScalar(value any) bool {
	switch value.(type) {
	case nil, string, bool, float64, float32, int, int8, int16, int32, int64, uint, uint8, uint16, uint32, uint64:
		return true
	default:
		return false
	}
}
