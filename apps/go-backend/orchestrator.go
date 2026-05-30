package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	defaultGoOrchestratorWorkerID     = "go-backend:orchestrator:v1.15"
	defaultGoOrchestratorPollInterval = 2 * time.Second
	runtimeServiceLeaseGrace          = 5 * time.Second
)

type goMatchOrchestrator struct {
	lifecycle    *matchJobLifecycle
	completion   *matchCompletionService
	runtime      *runtimeServiceClient
	workerID     string
	pollInterval time.Duration
	logger       *log.Logger
}

type goMatchOrchestrationResult struct {
	Status      string `json:"status"`
	JobID       string `json:"jobId,omitempty"`
	MatchID     string `json:"matchId,omitempty"`
	ChronicleID string `json:"chronicleId,omitempty"`
}

type runtimeServiceMatchInputRow struct {
	MatchID                  string
	Seed                     string
	ArenaVariant             map[string]any
	BottomPlayerID           string
	TopPlayerID              string
	BottomStrategyRevisionID string
	TopStrategyRevisionID    string
	BottomStrategy           runtimeServiceStrategyRevision
	TopStrategy              runtimeServiceStrategyRevision
}

func newGoMatchOrchestrator(pool *pgxpool.Pool, runtimeServiceURL string) *goMatchOrchestrator {
	return &goMatchOrchestrator{
		lifecycle:    newMatchJobLifecycle(pool),
		completion:   newMatchCompletionService(pool),
		runtime:      newRuntimeServiceClient(runtimeServiceURL),
		workerID:     defaultGoOrchestratorWorkerID,
		pollInterval: defaultGoOrchestratorPollInterval,
		logger:       log.Default(),
	}
}

func (orchestrator *goMatchOrchestrator) start(ctx context.Context) context.CancelFunc {
	runCtx, cancel := context.WithCancel(ctx)
	go func() {
		ticker := time.NewTicker(orchestrator.pollInterval)
		defer ticker.Stop()
		for {
			if _, err := orchestrator.runOnce(runCtx, nil); err != nil && !errors.Is(err, context.Canceled) {
				orchestrator.logf("go orchestration run failed: %v", err)
			}
			select {
			case <-runCtx.Done():
				return
			case <-ticker.C:
			}
		}
	}()
	return cancel
}

func (orchestrator *goMatchOrchestrator) runOnce(ctx context.Context, matchIDs []string) (*goMatchOrchestrationResult, error) {
	if orchestrator == nil || orchestrator.lifecycle == nil || orchestrator.completion == nil || orchestrator.runtime == nil {
		return nil, errors.New("Go Match orchestration is not configured")
	}
	workerID := orchestrator.workerID
	if workerID == "" {
		workerID = defaultGoOrchestratorWorkerID
	}
	claimed, err := orchestrator.lifecycle.claimNextMatchJob(ctx, claimMatchJobInput{
		WorkerID: workerID,
		MatchIDs: matchIDs,
		Lease:    matchJobLeaseForRuntimeService(),
	})
	if err != nil {
		return nil, err
	}
	if claimed == nil {
		return &goMatchOrchestrationResult{Status: "idle"}, nil
	}

	request, err := buildRuntimeServiceRequestForClaimedMatch(ctx, orchestrator.lifecycle.pool, claimed.MatchID, claimed.JobID)
	if err != nil {
		status, recordErr := orchestrator.lifecycle.recordAttemptFailure(ctx, recordAttemptFailureInput{
			JobID:        claimed.JobID,
			LeaseToken:   claimed.LeaseToken,
			ErrorClass:   "RuntimeServiceContractMismatch",
			ErrorMessage: "Runtime service request could not be built from claimed Match input",
			Retryable:    false,
			Category:     matchFailureCategorySystemFailure,
			Details: map[string]any{
				"matchId":  claimed.MatchID,
				"workerId": workerID,
				"cause":    err.Error(),
			},
		})
		if recordErr != nil {
			return nil, recordErr
		}
		return &goMatchOrchestrationResult{Status: status, JobID: claimed.JobID, MatchID: claimed.MatchID}, nil
	}
	response, failure := orchestrator.runtime.executeMatch(ctx, *request)
	if failure != nil {
		classification := classifyMatchFailure(failure.Code, failure.Retryable, failure.Details)
		status, err := orchestrator.lifecycle.recordAttemptFailure(ctx, recordAttemptFailureInput{
			JobID:        claimed.JobID,
			LeaseToken:   claimed.LeaseToken,
			ErrorClass:   failure.Code,
			ErrorMessage: failure.ErrorMessage,
			Retryable:    failure.Retryable,
			Category:     classification.Category,
			Details: map[string]any{
				"matchId":                               claimed.MatchID,
				"workerId":                              workerID,
				"strategyExecutionSystemFailureCode":    failure.Code,
				"strategyExecutionSystemFailureDetails": failure.Details,
			},
		})
		if err != nil {
			return nil, err
		}
		return &goMatchOrchestrationResult{Status: status, JobID: claimed.JobID, MatchID: claimed.MatchID}, nil
	}

	chronicle, finalState, err := runtimeServiceCompletionPayload(response)
	if err != nil {
		return nil, err
	}
	completed, err := orchestrator.completion.completeMatch(ctx, completeMatchInput{
		JobID:      claimed.JobID,
		LeaseToken: claimed.LeaseToken,
		Chronicle:  chronicle,
		FinalState: finalState,
	})
	if err != nil {
		return nil, err
	}
	return &goMatchOrchestrationResult{
		Status:      completed.Status,
		JobID:       claimed.JobID,
		MatchID:     completed.MatchID,
		ChronicleID: completed.ChronicleID,
	}, nil
}

func matchJobLeaseForRuntimeService() time.Duration {
	lease := runtimeServiceHTTPTimeout() + runtimeServiceLeaseGrace
	if lease < defaultMatchJobLease {
		return defaultMatchJobLease
	}
	return lease
}

func buildRuntimeServiceRequestForClaimedMatch(ctx context.Context, pool *pgxpool.Pool, matchID string, jobID string) (*runtimeServiceRequest, error) {
	row, err := loadRuntimeServiceMatchInput(ctx, pool, matchID)
	if err != nil {
		return nil, err
	}
	request := runtimeServiceRequest{
		ContractVersion: runtimeExecutionServiceVersion,
		Kind:            "executeMatch",
		RequestID:       "runtime-request:" + jobID,
		Match: runtimeServiceMatch{
			MatchID:                  row.MatchID,
			Seed:                     row.Seed,
			ArenaVariant:             row.ArenaVariant,
			BottomPlayerID:           row.BottomPlayerID,
			TopPlayerID:              row.TopPlayerID,
			BottomStrategyRevisionID: row.BottomStrategyRevisionID,
			TopStrategyRevisionID:    row.TopStrategyRevisionID,
		},
		Limits: defaultRuntimeServiceLimits(),
	}
	request.Strategies.Bottom = row.BottomStrategy
	request.Strategies.Top = row.TopStrategy
	return &request, nil
}

func loadRuntimeServiceMatchInput(ctx context.Context, pool *pgxpool.Pool, matchID string) (runtimeServiceMatchInputRow, error) {
	var row runtimeServiceMatchInputRow
	var arenaRaw []byte
	var bottomRuntimeRaw []byte
	var bottomEngineRaw []byte
	var bottomValidationRaw []byte
	var bottomMetadataRaw []byte
	var topRuntimeRaw []byte
	var topEngineRaw []byte
	var topValidationRaw []byte
	var topMetadataRaw []byte
	err := pool.QueryRow(ctx, `
		select
		  m.id,
		  m.seed,
		  av.config,
		  m.bottom_player_id,
		  m.top_player_id,
		  m.bottom_strategy_revision_id,
		  m.top_strategy_revision_id,
		  bottom.id,
		  bottom.source,
		  bottom.source_hash,
		  bottom.source_bytes,
		  bottom.runtime,
		  bottom.engine_compatibility,
		  bottom.validation,
		  bottom.metadata,
		  top.id,
		  top.source,
		  top.source_hash,
		  top.source_bytes,
		  top.runtime,
		  top.engine_compatibility,
		  top.validation,
		  top.metadata
		from matches m
		join arena_variants av on av.id = m.arena_variant_id
		join strategy_revisions bottom on bottom.id = m.bottom_strategy_revision_id
		join strategy_revisions top on top.id = m.top_strategy_revision_id
		where m.id = $1
	`, matchID).Scan(
		&row.MatchID,
		&row.Seed,
		&arenaRaw,
		&row.BottomPlayerID,
		&row.TopPlayerID,
		&row.BottomStrategyRevisionID,
		&row.TopStrategyRevisionID,
		&row.BottomStrategy.ID,
		&row.BottomStrategy.Source,
		&row.BottomStrategy.SourceHash,
		&row.BottomStrategy.SourceBytes,
		&bottomRuntimeRaw,
		&bottomEngineRaw,
		&bottomValidationRaw,
		&bottomMetadataRaw,
		&row.TopStrategy.ID,
		&row.TopStrategy.Source,
		&row.TopStrategy.SourceHash,
		&row.TopStrategy.SourceBytes,
		&topRuntimeRaw,
		&topEngineRaw,
		&topValidationRaw,
		&topMetadataRaw,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return row, errors.New("claimed Match input was not found")
		}
		return row, err
	}
	row.ArenaVariant = jsonMap(arenaRaw)
	row.BottomStrategy.Runtime = jsonMap(bottomRuntimeRaw)
	row.BottomStrategy.EngineCompatibility = jsonMap(bottomEngineRaw)
	row.BottomStrategy.Validation = jsonMap(bottomValidationRaw)
	row.BottomStrategy.Metadata = jsonMap(bottomMetadataRaw)
	row.TopStrategy.Runtime = jsonMap(topRuntimeRaw)
	row.TopStrategy.EngineCompatibility = jsonMap(topEngineRaw)
	row.TopStrategy.Validation = jsonMap(topValidationRaw)
	row.TopStrategy.Metadata = jsonMap(topMetadataRaw)
	return row, nil
}

func runtimeServiceCompletionPayload(response *runtimeServiceResponse) (map[string]any, map[string]any, error) {
	if response == nil || !response.OK || response.Result == nil {
		return nil, nil, errors.New("runtime service response did not include a completion result")
	}
	chronicle, ok := response.Result["chronicle"].(map[string]any)
	if !ok {
		return nil, nil, errors.New("runtime service result missing Chronicle")
	}
	finalState, ok := response.Result["finalState"].(map[string]any)
	if !ok {
		return nil, nil, errors.New("runtime service result missing final state")
	}
	return chronicle, finalState, nil
}

func defaultRuntimeServiceLimits() map[string]any {
	return map[string]any{
		"timeoutMs":             1000,
		"stdoutBytes":           32768,
		"stderrBytes":           65536,
		"sourceBytes":           65536,
		"strategyMemoryBytes":   32768,
		"soldierMemoryBytes":    2048,
		"objectivePayloadBytes": 1024,
		"environment":           "minimal",
		"filesystem":            "host",
		"network":               "inherited",
		"shell":                 "disabled",
		"packagePolicy":         "none",
	}
}

func (orchestrator *goMatchOrchestrator) logf(format string, values ...any) {
	if orchestrator != nil && orchestrator.logger != nil {
		orchestrator.logger.Printf(format, values...)
	}
}

func writeGoOrchestrationResult(writer http.ResponseWriter, status int, result *goMatchOrchestrationResult) {
	if result == nil {
		result = &goMatchOrchestrationResult{Status: "error"}
	}
	writeJSONValue(writer, status, result)
}

func goOrchestrationHTTPError(writer http.ResponseWriter, status int) {
	writeJSONValue(writer, status, map[string]any{
		"status":  "error",
		"message": "Go orchestration failed.",
	})
}
