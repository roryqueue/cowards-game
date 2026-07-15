package main

import (
	"context"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func TestPhase258PersistedSuccessorValidationDriftStopsBeforeHTTPWithZeroGameplay(t *testing.T) {
	databaseURL := os.Getenv("COWARDS_GO_BACKEND_TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Fatal("COWARDS_GO_BACKEND_TEST_DATABASE_URL is required")
	}
	mutations := []struct {
		name  string
		apply func(context.Context, *pgxpool.Pool, string) error
	}{
		{"validation source hash", func(ctx context.Context, pool *pgxpool.Pool, revisionID string) error {
			_, err := pool.Exec(ctx, `update strategy_revisions set validation=jsonb_set(validation,'{sourceHash}',to_jsonb($2::text),true) where id=$1`, revisionID, strings.Repeat("f", 64))
			return err
		}},
		{"validation source bytes", func(ctx context.Context, pool *pgxpool.Pool, revisionID string) error {
			_, err := pool.Exec(ctx, `update strategy_revisions set validation=jsonb_set(validation,'{sourceBytes}',to_jsonb(1),true) where id=$1`, revisionID)
			return err
		}},
		{"validation runtime version", func(ctx context.Context, pool *pgxpool.Pool, revisionID string) error {
			_, err := pool.Exec(ctx, `update strategy_revisions set validation=jsonb_set(validation,'{runtimeVersion}',to_jsonb('drifted-adapter'::text),true) where id=$1`, revisionID)
			return err
		}},
		{"validation engine compatibility", func(ctx context.Context, pool *pgxpool.Pool, revisionID string) error {
			_, err := pool.Exec(ctx, `update strategy_revisions set validation=jsonb_set(validation,'{engineCompatibility,engine}',to_jsonb('drifted-engine'::text),true) where id=$1`, revisionID)
			return err
		}},
		{"validation warning unknown code", func(ctx context.Context, pool *pgxpool.Pool, revisionID string) error {
			_, err := pool.Exec(ctx, `update strategy_revisions set validation=jsonb_set(validation,'{warnings}','[{"code":"UNKNOWN","severity":"warning","message":"x"}]'::jsonb,true) where id=$1`, revisionID)
			return err
		}},
		{"runtime adapter identity", func(ctx context.Context, pool *pgxpool.Pool, revisionID string) error {
			_, err := pool.Exec(ctx, `update strategy_revisions set runtime=jsonb_set(runtime,'{adapter,version}',to_jsonb('drifted-adapter'::text),true) where id=$1`, revisionID)
			return err
		}},
		{"provider source identity", func(ctx context.Context, pool *pgxpool.Pool, revisionID string) error {
			_, err := pool.Exec(ctx, `update strategy_revisions set metadata=jsonb_set(metadata,'{providerValidation,sourceHash}',to_jsonb('drifted-provider-hash'::text),true) where id=$1`, revisionID)
			return err
		}},
	}
	for _, mutation := range mutations {
		t.Run(mutation.name, func(t *testing.T) {
			ctx := context.Background()
			pool := semanticCurrentIsolatedPool(t, ctx, databaseURL)
			now := time.Date(2026, 7, 15, 13, 50, 0, 0, time.UTC)
			fixture, registry := preparePhase258V117ClaimFixture(t, ctx, pool, now)
			seeded := fixture.seedMatch(t, ctx, pool, "validation-drift")
			if _, err := pool.Exec(ctx, `delete from match_job_attempts where job_id=$1`, seeded.jobID); err != nil {
				t.Fatal(err)
			}
			if _, err := pool.Exec(ctx, `update match_jobs set status='queued',attempts=0,worker_id=null,lease_token=null,lease_expires_at=null,run_after=$2 where id=$1`, seeded.jobID, now); err != nil {
				t.Fatal(err)
			}
			if _, err := pool.Exec(ctx, `update matches set status='pending',outcome=null,winner_player_id=null,completed_at=null where id=$1`, seeded.matchID); err != nil {
				t.Fatal(err)
			}
			// Bypass the immutable-row trigger only inside this isolated schema to
			// model persisted corruption below the normal write boundary.
			if _, err := pool.Exec(ctx, `alter table strategy_revisions disable trigger user`); err != nil {
				t.Fatal(err)
			}
			mutationErr := mutation.apply(ctx, pool, fixture.identity.Bottom.StrategyRevisionID)
			if _, err := pool.Exec(ctx, `alter table strategy_revisions enable trigger user`); err != nil {
				t.Fatal(err)
			}
			if mutationErr != nil {
				t.Fatal(mutationErr)
			}

			var requests atomic.Int64
			runtimeServer := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, _ *http.Request) {
				requests.Add(1)
				http.Error(writer, "runtime must not be reached", http.StatusInternalServerError)
			}))
			defer runtimeServer.Close()
			orchestrator := newGoMatchOrchestrator(pool, runtimeServer.URL)
			orchestrator.deploymentLanes = registry
			orchestrator.workerID = "phase258:validation-drift:v117"
			orchestrator.lifecycle.now = func() time.Time { return now }
			orchestrator.lifecycle.newLeaseToken = func() (string, error) { return "phase258:validation-drift:lease:v117", nil }
			orchestrator.lifecycle.loadAuthority = func() (*verifiedRuntimeEvidenceAuthority, error) { return fixture.authority, nil }
			orchestrator.lifecycle.successorAuthorityTrustDomain = runtimeEvidenceAuthorityFixtureTrustDomain
			orchestrator.completion.loadAuthority = func() (*verifiedRuntimeEvidenceAuthority, error) { return fixture.authority, nil }
			orchestrator.completion.successorAuthorityTrustDomain = runtimeEvidenceAuthorityFixtureTrustDomain
			orchestrator.runtime.currentContractVersion = func() string { return runtimeExecutionServiceVersionV117 }

			result, err := orchestrator.runOnce(ctx, []string{seeded.matchID})
			if err != nil {
				t.Fatal(err)
			}
			if result.Status != "failed_system" || requests.Load() != 0 {
				t.Fatalf("persisted validation drift escaped pre-HTTP fail-closed gate: result=%+v requests=%d", result, requests.Load())
			}
			var errorClass string
			if err := pool.QueryRow(ctx, `select error_class from match_job_attempts where job_id=$1 and attempt_number=1`, seeded.jobID).Scan(&errorClass); err != nil {
				t.Fatal(err)
			}
			if errorClass != "RuntimeServiceContractMismatch" {
				t.Fatalf("persisted validation drift lost its typed system failure: %q", errorClass)
			}
			var chronicleCount int
			if err := pool.QueryRow(ctx, `select count(*) from chronicles where match_id=$1`, seeded.matchID).Scan(&chronicleCount); err != nil {
				t.Fatal(err)
			}
			var zeroGameplay bool
			if err := pool.QueryRow(ctx, `select outcome is null and winner_player_id is null and surviving_soldiers is null and bottom_surviving_soldiers is null and top_surviving_soldiers is null and survival_turns is null and bottom_survival_turns is null and top_survival_turns is null from matches where id=$1`, seeded.matchID).Scan(&zeroGameplay); err != nil {
				t.Fatal(err)
			}
			if chronicleCount != 0 || !zeroGameplay {
				t.Fatalf("system failure mutated gameplay: chronicles=%d zeroGameplay=%t", chronicleCount, zeroGameplay)
			}
		})
	}
}
