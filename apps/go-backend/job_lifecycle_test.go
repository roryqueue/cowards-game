package main

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func TestShouldExhaustMatchJobRetries(t *testing.T) {
	tests := []struct {
		name        string
		attempts    int
		maxAttempts int
		retryable   bool
		want        bool
	}{
		{name: "retryable below max", attempts: 1, maxAttempts: 3, retryable: true, want: false},
		{name: "retryable at max", attempts: 3, maxAttempts: 3, retryable: true, want: true},
		{name: "non retryable", attempts: 1, maxAttempts: 3, retryable: false, want: true},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			got := shouldExhaustMatchJobRetries(test.attempts, test.maxAttempts, test.retryable)
			if got != test.want {
				t.Fatalf("expected %v, got %v", test.want, got)
			}
		})
	}
}

func TestSanitizeMatchJobFailureDetails(t *testing.T) {
	safe := sanitizeMatchJobFailureDetails(map[string]any{
		"workerId":                           "worker:go",
		"matchId":                            "match:test",
		"strategyExecutionAdapterId":         "subprocess",
		"strategyExecutionSystemFailureCode": "MALFORMED_IPC",
		"strategyExecutionSystemFailureDetails": map[string]any{
			"cause":  "unexpected token",
			"stderr": "strategy source leak",
		},
		"stderr":       "do not persist",
		"stack":        "host path stack trace",
		"leaseToken":   "secret token",
		"source":       "export default {}",
		"nestedUnsafe": map[string]any{"stderr": "leak"},
	})
	bytes, err := json.Marshal(safe)
	if err != nil {
		t.Fatal(err)
	}
	text := string(bytes)
	for _, forbidden := range []string{"stderr", "stack", "leaseToken", "export default", "strategy source leak"} {
		if strings.Contains(text, forbidden) {
			t.Fatalf("sanitized details leaked %q in %s", forbidden, text)
		}
	}
	for _, required := range []string{"worker:go", "match:test", "subprocess", "MALFORMED_IPC", "unexpected token"} {
		if !strings.Contains(text, required) {
			t.Fatalf("sanitized details omitted %q in %s", required, text)
		}
	}
}

func TestMatchJobLifecycleIntegration(t *testing.T) {
	databaseURL := os.Getenv("COWARDS_GO_BACKEND_TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("set COWARDS_GO_BACKEND_TEST_DATABASE_URL for Go job lifecycle integration tests")
	}
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()
	if err := ensurePersistenceSchema(ctx, pool); err != nil {
		t.Fatal(err)
	}

	t.Run("claim idle heartbeat and duplicate prevention", func(t *testing.T) {
		prefix := "phase97-claim"
		cleanupPhase97Rows(t, ctx, pool, prefix)
		defer cleanupPhase97Rows(t, ctx, pool, prefix)
		ids := seedPhase97MatchJob(t, ctx, pool, prefix, 3, "queued", 0, nil)
		now := time.Date(2026, 5, 16, 12, 0, 0, 0, time.UTC)
		lifecycle := newTestMatchJobLifecycle(pool, now, "lease:go:claim")

		emptyAllowlistClaim, err := lifecycle.claimNextMatchJob(ctx, claimMatchJobInput{
			WorkerID: "worker:go:empty-allowlist",
			MatchIDs: []string{},
		})
		if err != nil {
			t.Fatal(err)
		}
		if emptyAllowlistClaim != nil {
			t.Fatalf("empty allowlist claimed a job: %+v", emptyAllowlistClaim)
		}

		claimed, err := lifecycle.claimNextMatchJob(ctx, claimMatchJobInput{
			WorkerID: "worker:go:claim",
			Lease:    time.Minute,
		})
		if err != nil {
			t.Fatal(err)
		}
		if claimed == nil {
			t.Fatal("expected a claimed job")
		}
		if claimed.JobID != ids.jobID || claimed.MatchID != ids.matchID || claimed.AttemptNumber != 1 || claimed.LeaseToken != "lease:go:claim" {
			t.Fatalf("unexpected claim: %+v", claimed)
		}
		assertPhase97Job(t, ctx, pool, ids.jobID, "running", 1, "worker:go:claim", "lease:go:claim")
		assertPhase97MatchStatus(t, ctx, pool, ids.matchID, "running")

		second, err := lifecycle.claimNextMatchJob(ctx, claimMatchJobInput{WorkerID: "worker:go:other"})
		if err != nil {
			t.Fatal(err)
		}
		if second != nil {
			t.Fatalf("running unexpired job was double-claimed: %+v", second)
		}

		ok, err := lifecycle.heartbeatMatchJob(ctx, ids.jobID, "wrong-token", time.Minute)
		if err != nil {
			t.Fatal(err)
		}
		if ok {
			t.Fatal("heartbeat accepted a stale lease token")
		}
		ok, err = lifecycle.heartbeatMatchJob(ctx, ids.jobID, "lease:go:claim", time.Minute)
		if err != nil {
			t.Fatal(err)
		}
		if !ok {
			t.Fatal("heartbeat rejected the active lease token")
		}
	})

	t.Run("expired lease can be reclaimed", func(t *testing.T) {
		prefix := "phase97-reclaim"
		cleanupPhase97Rows(t, ctx, pool, prefix)
		defer cleanupPhase97Rows(t, ctx, pool, prefix)
		expiredAt := time.Date(2026, 5, 16, 11, 59, 0, 0, time.UTC)
		ids := seedPhase97MatchJob(t, ctx, pool, prefix, 3, "running", 1, &expiredAt)
		now := time.Date(2026, 5, 16, 12, 0, 0, 0, time.UTC)
		lifecycle := newTestMatchJobLifecycle(pool, now, "lease:go:reclaimed")

		claimed, err := lifecycle.claimNextMatchJob(ctx, claimMatchJobInput{WorkerID: "worker:go:reclaim"})
		if err != nil {
			t.Fatal(err)
		}
		if claimed == nil || claimed.JobID != ids.jobID || claimed.AttemptNumber != 2 {
			t.Fatalf("expected expired job reclaim attempt 2, got %+v", claimed)
		}
		assertPhase97Job(t, ctx, pool, ids.jobID, "running", 2, "worker:go:reclaim", "lease:go:reclaimed")
	})

	t.Run("retryable failure queues another attempt", func(t *testing.T) {
		prefix := "phase97-retry"
		cleanupPhase97Rows(t, ctx, pool, prefix)
		defer cleanupPhase97Rows(t, ctx, pool, prefix)
		ids := seedPhase97MatchJob(t, ctx, pool, prefix, 3, "queued", 0, nil)
		lifecycle := newTestMatchJobLifecycle(pool, time.Date(2026, 5, 16, 12, 0, 0, 0, time.UTC), "lease:go:retry")
		claimed, err := lifecycle.claimNextMatchJob(ctx, claimMatchJobInput{WorkerID: "worker:go:retry"})
		if err != nil {
			t.Fatal(err)
		}
		if claimed == nil {
			t.Fatal("expected claimed job")
		}
		status, err := lifecycle.recordAttemptFailure(ctx, recordAttemptFailureInput{
			JobID:        claimed.JobID,
			LeaseToken:   claimed.LeaseToken,
			ErrorClass:   "SubprocessSystemFailure",
			ErrorMessage: "runtime worker unavailable",
			Retryable:    true,
			Details: map[string]any{
				"workerId": ids.workerID,
				"stderr":   "must not persist",
			},
		})
		if err != nil {
			t.Fatal(err)
		}
		if status != "retry_queued" {
			t.Fatalf("expected retry_queued, got %q", status)
		}
		assertPhase97Job(t, ctx, pool, ids.jobID, "queued", 1, "", "")
		assertPhase97Attempt(t, ctx, pool, ids.jobID, 1, "failed_system")
	})

	t.Run("exhausted failure marks job and match failed_system", func(t *testing.T) {
		prefix := "phase97-exhausted"
		cleanupPhase97Rows(t, ctx, pool, prefix)
		defer cleanupPhase97Rows(t, ctx, pool, prefix)
		ids := seedPhase97MatchJob(t, ctx, pool, prefix, 1, "queued", 0, nil)
		lifecycle := newTestMatchJobLifecycle(pool, time.Date(2026, 5, 16, 12, 0, 0, 0, time.UTC), "lease:go:exhausted")
		claimed, err := lifecycle.claimNextMatchJob(ctx, claimMatchJobInput{WorkerID: "worker:go:exhausted"})
		if err != nil {
			t.Fatal(err)
		}
		if claimed == nil {
			t.Fatal("expected claimed job")
		}
		status, err := lifecycle.recordAttemptFailure(ctx, recordAttemptFailureInput{
			JobID:        claimed.JobID,
			LeaseToken:   claimed.LeaseToken,
			ErrorClass:   "SubprocessSystemFailure",
			ErrorMessage: "runtime worker crashed",
			Retryable:    true,
			Details:      map[string]any{"workerId": ids.workerID},
		})
		if err != nil {
			t.Fatal(err)
		}
		if status != "failed_system" {
			t.Fatalf("expected failed_system, got %q", status)
		}
		assertPhase97Job(t, ctx, pool, ids.jobID, "failed_system", 1, "worker:go:exhausted", "lease:go:exhausted")
		assertPhase97MatchStatus(t, ctx, pool, ids.matchID, "failed_system")
		if _, err := lifecycle.recordAttemptFailure(ctx, recordAttemptFailureInput{
			JobID:        claimed.JobID,
			LeaseToken:   claimed.LeaseToken,
			ErrorClass:   "SubprocessSystemFailure",
			ErrorMessage: "stale duplicate failure",
			Retryable:    true,
		}); err == nil {
			t.Fatal("expected duplicate terminal failure recording to be rejected")
		}
		assertPhase97Job(t, ctx, pool, ids.jobID, "failed_system", 1, "worker:go:exhausted", "lease:go:exhausted")
		assertPhase97MatchStatus(t, ctx, pool, ids.matchID, "failed_system")
	})

	t.Run("failure recording rejects terminal complete jobs", func(t *testing.T) {
		prefix := "phase97-complete-stale"
		cleanupPhase97Rows(t, ctx, pool, prefix)
		defer cleanupPhase97Rows(t, ctx, pool, prefix)
		ids := seedPhase97MatchJob(t, ctx, pool, prefix, 3, "queued", 0, nil)
		lifecycle := newTestMatchJobLifecycle(pool, time.Date(2026, 5, 16, 12, 0, 0, 0, time.UTC), "lease:go:complete")
		claimed, err := lifecycle.claimNextMatchJob(ctx, claimMatchJobInput{WorkerID: "worker:go:complete"})
		if err != nil {
			t.Fatal(err)
		}
		if claimed == nil {
			t.Fatal("expected claimed job")
		}
		if _, err := pool.Exec(ctx, "update match_jobs set status = 'complete' where id = $1", ids.jobID); err != nil {
			t.Fatal(err)
		}
		if _, err := pool.Exec(ctx, "update matches set status = 'complete' where id = $1", ids.matchID); err != nil {
			t.Fatal(err)
		}
		if _, err := lifecycle.recordAttemptFailure(ctx, recordAttemptFailureInput{
			JobID:        claimed.JobID,
			LeaseToken:   claimed.LeaseToken,
			ErrorClass:   "Error",
			ErrorMessage: "late stale failure",
			Retryable:    true,
		}); err == nil {
			t.Fatal("expected complete job failure recording to be rejected")
		}
		assertPhase97Job(t, ctx, pool, ids.jobID, "complete", 1, "worker:go:complete", "lease:go:complete")
		assertPhase97MatchStatus(t, ctx, pool, ids.matchID, "complete")
	})

	t.Run("failure recording rejects invalid lease", func(t *testing.T) {
		prefix := "phase97-invalid-lease"
		cleanupPhase97Rows(t, ctx, pool, prefix)
		defer cleanupPhase97Rows(t, ctx, pool, prefix)
		ids := seedPhase97MatchJob(t, ctx, pool, prefix, 3, "queued", 0, nil)
		lifecycle := newTestMatchJobLifecycle(pool, time.Date(2026, 5, 16, 12, 0, 0, 0, time.UTC), "lease:go:invalid")
		if _, err := lifecycle.claimNextMatchJob(ctx, claimMatchJobInput{WorkerID: "worker:go:invalid"}); err != nil {
			t.Fatal(err)
		}
		if _, err := lifecycle.recordAttemptFailure(ctx, recordAttemptFailureInput{
			JobID:        ids.jobID,
			LeaseToken:   "wrong-token",
			ErrorClass:   "Error",
			ErrorMessage: "nope",
			Retryable:    true,
		}); err == nil {
			t.Fatal("expected invalid lease failure")
		}
	})
}

type phase97IDs struct {
	prefix   string
	userID   string
	strategy string
	revision string
	arenaID  string
	matchID  string
	jobID    string
	workerID string
}

func newTestMatchJobLifecycle(pool *pgxpool.Pool, now time.Time, token string) *matchJobLifecycle {
	lifecycle := newMatchJobLifecycle(pool)
	lifecycle.now = func() time.Time { return now }
	lifecycle.newLeaseToken = func() (string, error) { return token, nil }
	return lifecycle
}

func seedPhase97MatchJob(t *testing.T, ctx context.Context, pool *pgxpool.Pool, prefix string, maxAttempts int, status string, attempts int, leaseExpiresAt *time.Time) phase97IDs {
	t.Helper()
	ids := phase97IDs{
		prefix:   prefix,
		userID:   "user:" + prefix,
		strategy: "strategy:" + prefix,
		revision: "strategy-revision:" + prefix,
		arenaID:  "arena:" + prefix,
		matchID:  "match:" + prefix,
		jobID:    "match-job:" + prefix,
		workerID: "worker:" + prefix,
	}
	if _, err := pool.Exec(ctx, `
		insert into users (id, display_name, metadata) values ($1, $2, '{}'::jsonb)
		on conflict (id) do nothing
	`, ids.userID, prefix); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, `
		insert into strategies (id, owner_user_id, name, metadata) values ($1, $2, $3, '{}'::jsonb)
		on conflict (id) do nothing
	`, ids.strategy, ids.userID, prefix); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, `
		insert into strategy_revisions (
		  id, strategy_id, source, source_hash, source_bytes, runtime,
		  engine_compatibility, validation, metadata
		)
		values ($1, $2, 'export default {}', 'sha256:test', 17, '{}'::jsonb, '{}'::jsonb, '{"valid":true}'::jsonb, '{}'::jsonb)
		on conflict (id) do nothing
	`, ids.revision, ids.strategy); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, `
		insert into arena_variants (id, name, version, config, metadata)
		values ($1, $2, 'arena-v1', '{}'::jsonb, '{}'::jsonb)
		on conflict (id) do nothing
	`, ids.arenaID, prefix); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, `
		insert into matches (
		  id, bottom_strategy_revision_id, top_strategy_revision_id, arena_variant_id,
		  seed, bottom_player_id, top_player_id, status
		)
		values ($1, $2, $2, $3, $4, $5, $6, 'pending')
	`, ids.matchID, ids.revision, ids.arenaID, "seed:"+prefix, "player:bottom:"+prefix, "player:top:"+prefix); err != nil {
		t.Fatal(err)
	}
	var leaseToken any
	if status == "running" {
		leaseToken = "lease:old:" + prefix
	}
	if _, err := pool.Exec(ctx, `
		insert into match_jobs (
		  id, match_id, status, attempts, max_attempts, worker_id, lease_token, lease_expires_at, run_after
		)
		values ($1, $2, $3, $4, $5, $6, $7, $8, '2026-05-16T11:59:00Z'::timestamptz)
	`, ids.jobID, ids.matchID, status, attempts, maxAttempts, nullableString(ids.workerID, status == "running"), leaseToken, leaseExpiresAt); err != nil {
		t.Fatal(err)
	}
	if status == "running" && attempts > 0 {
		if _, err := pool.Exec(ctx, `
			insert into match_job_attempts (id, job_id, attempt_number, worker_id, status)
			values ($1, $2, $3, $4, 'running')
		`, "match-job-attempt:"+ids.jobID+":1", ids.jobID, attempts, ids.workerID); err != nil {
			t.Fatal(err)
		}
	}
	return ids
}

func nullableString(value string, ok bool) any {
	if !ok {
		return nil
	}
	return value
}

func assertPhase97Job(t *testing.T, ctx context.Context, pool *pgxpool.Pool, jobID string, wantStatus string, wantAttempts int, wantWorkerID string, wantLeaseToken string) {
	t.Helper()
	var status string
	var attempts int
	var workerID *string
	var leaseToken *string
	if err := pool.QueryRow(ctx, `
		select status::text, attempts, worker_id, lease_token
		from match_jobs
		where id = $1
	`, jobID).Scan(&status, &attempts, &workerID, &leaseToken); err != nil {
		t.Fatal(err)
	}
	if status != wantStatus || attempts != wantAttempts {
		t.Fatalf("unexpected job state status=%s attempts=%d", status, attempts)
	}
	if stringPtrValue(workerID) != wantWorkerID || stringPtrValue(leaseToken) != wantLeaseToken {
		t.Fatalf("unexpected lease owner worker=%q lease=%q", stringPtrValue(workerID), stringPtrValue(leaseToken))
	}
}

func assertPhase97Attempt(t *testing.T, ctx context.Context, pool *pgxpool.Pool, jobID string, attempt int, wantStatus string) {
	t.Helper()
	var status string
	if err := pool.QueryRow(ctx, `
		select status from match_job_attempts
		where job_id = $1 and attempt_number = $2
	`, jobID, attempt).Scan(&status); err != nil {
		t.Fatal(err)
	}
	if status != wantStatus {
		t.Fatalf("expected attempt status %q, got %q", wantStatus, status)
	}
}

func assertPhase97MatchStatus(t *testing.T, ctx context.Context, pool *pgxpool.Pool, matchID string, wantStatus string) {
	t.Helper()
	var status string
	if err := pool.QueryRow(ctx, "select status::text from matches where id = $1", matchID).Scan(&status); err != nil {
		t.Fatal(err)
	}
	if status != wantStatus {
		t.Fatalf("expected Match status %q, got %q", wantStatus, status)
	}
}

func stringPtrValue(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

func cleanupPhase97Rows(t *testing.T, ctx context.Context, pool *pgxpool.Pool, prefix string) {
	t.Helper()
	if _, err := pool.Exec(ctx, `
		with phase_jobs as (
		  select id from match_jobs where id like $1 or match_id like $2
		)
		delete from match_job_attempts where job_id in (select id from phase_jobs)
	`, "match-job:"+prefix+"%", "match:"+prefix+"%"); err != nil {
		t.Fatal(err)
	}
	statements := []struct {
		sql  string
		args []any
	}{
		{
			sql:  "delete from match_jobs where id like $1 or match_id like $2",
			args: []any{"match-job:" + prefix + "%", "match:" + prefix + "%"},
		},
		{
			sql:  "delete from chronicles where match_id like $1",
			args: []any{"match:" + prefix + "%"},
		},
		{
			sql:  "delete from match_set_matches where match_id like $1",
			args: []any{"match:" + prefix + "%"},
		},
		{
			sql:  "delete from matches where id like $1",
			args: []any{"match:" + prefix + "%"},
		},
		{
			sql:  "delete from arena_variants where id like $1",
			args: []any{"arena:" + prefix + "%"},
		},
		{
			sql:  "delete from strategy_revisions where id like $1",
			args: []any{"strategy-revision:" + prefix + "%"},
		},
		{
			sql:  "delete from strategies where id like $1",
			args: []any{"strategy:" + prefix + "%"},
		},
		{
			sql:  "delete from users where id like $1",
			args: []any{"user:" + prefix + "%"},
		},
	}
	for _, statement := range statements {
		if _, err := pool.Exec(ctx, statement.sql, statement.args...); err != nil {
			t.Fatal(err)
		}
	}
}

func ensurePersistenceSchema(ctx context.Context, pool *pgxpool.Pool) error {
	var hasMatches *string
	if err := pool.QueryRow(ctx, "select to_regclass('public.matches')::text").Scan(&hasMatches); err != nil {
		return err
	}
	if hasMatches != nil {
		return nil
	}
	if _, err := pool.Exec(ctx, `
		create table if not exists schema_migrations (
		  filename text primary key,
		  applied_at timestamptz not null default now()
		)
	`); err != nil {
		return err
	}
	files, err := filepath.Glob("../../packages/persistence/migrations/*.sql")
	if err != nil {
		return err
	}
	sort.Strings(files)
	for _, file := range files {
		name := filepath.Base(file)
		var exists bool
		if err := pool.QueryRow(ctx, "select exists(select 1 from schema_migrations where filename = $1)", name).Scan(&exists); err != nil {
			return err
		}
		if exists {
			continue
		}
		sql, err := os.ReadFile(file)
		if err != nil {
			return err
		}
		tx, err := pool.Begin(ctx)
		if err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, string(sql)); err != nil {
			_ = tx.Rollback(ctx)
			return err
		}
		if _, err := tx.Exec(ctx, "insert into schema_migrations (filename) values ($1)", name); err != nil {
			_ = tx.Rollback(ctx)
			return err
		}
		if err := tx.Commit(ctx); err != nil {
			return err
		}
	}
	return nil
}
