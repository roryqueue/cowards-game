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
	lifecycle       *matchJobLifecycle
	completion      *matchCompletionService
	runtime         *runtimeServiceExecutionRouter
	deploymentLanes *goDeploymentLaneRegistry
	workerID        string
	pollInterval    time.Duration
	logger          *log.Logger
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
		runtime:      newRuntimeServiceExecutionRouter(runtimeServiceURL),
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
	if err := orchestrator.lifecycle.recheckClaimedMatchIntegrity(ctx, claimed); err != nil {
		status, recordErr := orchestrator.lifecycle.recordAttemptFailure(ctx, recordAttemptFailureInput{
			JobID: claimed.JobID, LeaseToken: claimed.LeaseToken,
			ErrorClass: "RuntimeServiceEvidenceDrift", ErrorMessage: "Runtime execution evidence changed before execution",
			Retryable: true, Category: matchFailureCategorySystemFailure,
			Details: map[string]any{"matchId": claimed.MatchID, "workerId": workerID, "cause": "authority evidence drift"},
		})
		if recordErr != nil {
			return nil, recordErr
		}
		return &goMatchOrchestrationResult{Status: status, JobID: claimed.JobID, MatchID: claimed.MatchID}, nil
	}

	request, err := buildRuntimeServiceExecutionRequestForClaimedJob(ctx, orchestrator.lifecycle.pool, claimed, orchestrator.deploymentLanes)
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
	if err := orchestrator.lifecycle.recheckClaimedMatchIntegrity(ctx, claimed); err != nil {
		status, recordErr := orchestrator.lifecycle.recordAttemptFailure(ctx, recordAttemptFailureInput{
			JobID: claimed.JobID, LeaseToken: claimed.LeaseToken,
			ErrorClass: "RuntimeServiceEvidenceDrift", ErrorMessage: "Runtime execution evidence changed in flight",
			Retryable: true, Category: matchFailureCategorySystemFailure,
			Details: map[string]any{"matchId": claimed.MatchID, "workerId": workerID, "cause": "authority evidence drift"},
		})
		if recordErr != nil {
			return nil, recordErr
		}
		return &goMatchOrchestrationResult{Status: status, JobID: claimed.JobID, MatchID: claimed.MatchID}, nil
	}
	completionInput := completeMatchInput{
		JobID: claimed.JobID, LeaseToken: claimed.LeaseToken, Integrity: claimed.Integrity,
	}
	switch response.ContractVersion {
	case runtimeExecutionServiceVersionV118:
		if response.V118 == nil || response.V117 != nil || response.V116 != nil ||
			request.V118 == nil || response.V118.Verified == nil ||
			response.V118.Chronicle == nil || response.V118.FinalState == nil {
			return nil, errors.New("runtime service v1.18 completion contract is incomplete")
		}
		completionInput.Chronicle = response.V118.Chronicle
		completionInput.FinalState = response.V118.FinalState
		completionInput.RuntimeRequestV118 = request.V118
		completionInput.VerifiedReceiptV118 = response.V118.Verified
		completionInput.ReceiptBytesV118 = response.V118.ReceiptBytes
	case runtimeExecutionServiceVersion:
		if response.V116 == nil || response.V117 != nil || response.V118 != nil {
			return nil, errors.New("runtime service completion contract is mixed-version")
		}
		chronicle, finalState, semanticReceipt, semanticWireEvidence, err := runtimeServiceCompletionPayload(response.V116)
		if err != nil {
			return nil, err
		}
		completionInput.Chronicle = chronicle
		completionInput.FinalState = finalState
		completionInput.SemanticReceipt = semanticReceipt
		completionInput.SemanticWireEvidence = semanticWireEvidence
	case runtimeExecutionServiceVersionV117:
		if response.V117 == nil || response.V116 != nil || response.V118 != nil || request.V117 == nil {
			return nil, errors.New("runtime service completion contract is mixed-version")
		}
		chronicle, finalState, semanticReceipt, err := runtimeServiceCompletionPayloadV117(response.V117)
		if err != nil {
			return nil, err
		}
		completionInput.Chronicle = chronicle
		completionInput.FinalState = finalState
		completionInput.RuntimeRequestV117 = request.V117
		completionInput.SemanticReceiptV117 = &semanticReceipt
	default:
		return nil, errors.New("runtime service completion contract is not active")
	}
	completed, err := orchestrator.completion.completeMatch(ctx, completionInput)
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

func buildRuntimeServiceExecutionRequestForClaimedJob(ctx context.Context, pool *pgxpool.Pool, claimed *claimedMatchJob, registry *goDeploymentLaneRegistry) (*runtimeServiceExecutionRequest, error) {
	if claimed == nil || claimed.Integrity == nil || claimed.Integrity.CompatibilityTuple.RuntimeABI != selectedStrategyRuntimeABIVersion() {
		return nil, errors.New("claimed Match runtime ABI is not the selected execution authority")
	}
	request, err := buildRuntimeServiceRequestForClaimedJob(ctx, pool, claimed, registry)
	if err != nil {
		return nil, err
	}
	if claimed == nil || claimed.Integrity == nil {
		return nil, errors.New("claimed Match integrity identity is unavailable")
	}
	if selectedRuntimeServiceContractVersion() == runtimeExecutionServiceVersionV118 {
		binding := claimed.Integrity.RuntimeServiceV117
		if !validClaimedRuntimeServiceV117(binding, claimed.Integrity) {
			return nil, errors.New("successor runtime evidence roots and accounting are unavailable")
		}
		bottom, bottomOK := runtimeCertificateReferenceForClaimV118(
			request.Strategies.Bottom,
			claimed.Integrity.Bottom,
			binding.Bottom,
			"bottom",
			registry,
		)
		top, topOK := runtimeCertificateReferenceForClaimV118(
			request.Strategies.Top,
			claimed.Integrity.Top,
			binding.Top,
			"top",
			registry,
		)
		if !bottomOK || !topOK ||
			claimed.Integrity.Bottom.SchedulingDecision.EvaluatedAt != claimed.Integrity.Top.SchedulingDecision.EvaluatedAt {
			return nil, errors.New("v1.18 two-sided certificate source identity is unavailable")
		}
		matchBytes, err := runtimeInvocationV117CanonicalValue(request)
		if err != nil {
			return nil, errors.New("v1.18 nested Match envelope is not canonical")
		}
		successor := runtimeServiceRequestV118{
			ContractVersion: runtimeExecutionServiceVersionV118,
			Kind:            "executeMatch", RequestID: request.RequestID, MatchID: request.Match.MatchID,
			SemanticTuple: runtimeSemanticTupleV118{
				TupleID: claimed.Integrity.CompatibilityTupleID,
				Components: runtimeSemanticTupleComponentsV118{
					Rules: claimed.Integrity.CompatibilityTuple.Rules, Engine: claimed.Integrity.CompatibilityTuple.Engine,
					RuntimeABI: claimed.Integrity.CompatibilityTuple.RuntimeABI, Chronicle: claimed.Integrity.CompatibilityTuple.Chronicle,
					ArenaCatalog: claimed.Integrity.CompatibilityTuple.ArenaCatalog, SetPolicy: claimed.Integrity.CompatibilityTuple.SetPolicy,
				},
			},
			AuthorityGeneration:   binding.Authority.RegistryGeneration,
			EvaluationInstant:     claimed.Integrity.Bottom.SchedulingDecision.EvaluatedAt,
			CertificateReferences: runtimeCertificateReferencesV118{Bottom: bottom, Top: top},
			Match:                 matchBytes,
		}
		successor.Accounting.BudgetProfileRoot = binding.BudgetProfileSHA256
		successor.Accounting.LedgerPrestateRoot = binding.LedgerPrestateRoot
		if err := validateRuntimeServiceRequestV118(successor); err != nil {
			return nil, errors.New("claimed Match v1.18 runtime request is invalid")
		}
		return &runtimeServiceExecutionRequest{
			ContractVersion: runtimeExecutionServiceVersionV118,
			V118:            &successor,
		}, nil
	}
	switch claimed.Integrity.CompatibilityTuple.RuntimeABI {
	case strategyRuntimeABIVersion:
		return &runtimeServiceExecutionRequest{
			ContractVersion: runtimeExecutionServiceVersion,
			V116:            request,
		}, nil
	case strategyRuntimeABIVersionV117:
		binding := claimed.Integrity.RuntimeServiceV117
		if !validClaimedRuntimeServiceV117(binding, claimed.Integrity) {
			return nil, errors.New("successor runtime evidence roots and accounting are unavailable")
		}
		bottom, bottomOK := projectRuntimeServiceEntrantV117(request.Strategies.Bottom, claimed.Integrity.Bottom, binding.Bottom, registry)
		top, topOK := projectRuntimeServiceEntrantV117(request.Strategies.Top, claimed.Integrity.Top, binding.Top, registry)
		if !bottomOK || !topOK {
			return nil, errors.New("successor runtime source and artifact identity are unavailable")
		}
		matchBytes, err := runtimeInvocationV117CanonicalValue(request)
		if err != nil {
			return nil, errors.New("successor runtime Match envelope is not canonical")
		}
		successor := runtimeServiceRequestV117{
			ContractVersion:      runtimeExecutionServiceVersionV117,
			Kind:                 "executeMatch",
			RequestID:            request.RequestID,
			MatchID:              request.Match.MatchID,
			CompatibilityTupleID: claimed.Integrity.CompatibilityTupleID,
			Match:                matchBytes,
		}
		successor.Authority.BundleHash = binding.Authority.BundleHash
		successor.Authority.SourceManifestHash = binding.Authority.SourceManifestHash
		successor.Authority.RegistryGeneration = binding.Authority.RegistryGeneration
		successor.LegacyAuthority.BundleHash = claimed.Integrity.AuthorityBundleHash
		successor.LegacyAuthority.SourceManifestHash = claimed.Integrity.SourceManifestHash
		successor.LegacyAuthority.RegistryGeneration = claimed.Integrity.RegistryGeneration
		successor.Entrants.Bottom = bottom
		successor.Entrants.Top = top
		successor.Accounting.BudgetProfileSHA256 = binding.BudgetProfileSHA256
		successor.Accounting.LedgerPrestateRoot = binding.LedgerPrestateRoot
		if failure := validateRuntimeServiceRequestV117(successor); failure != nil {
			return nil, errors.New("claimed Match successor runtime request is invalid")
		}
		return &runtimeServiceExecutionRequest{
			ContractVersion: runtimeExecutionServiceVersionV117,
			V117:            &successor,
		}, nil
	default:
		return nil, errors.New("claimed Match runtime ABI has no service dispatch")
	}
}

func runtimeCertificateReferenceForClaimV118(
	strategy runtimeServiceStrategyRevision,
	evidence goEntrantExecutionEvidence,
	claimed claimedRuntimeServiceEntrantV117,
	side string,
	registry *goDeploymentLaneRegistry,
) (runtimeCertificateReferenceV118, bool) {
	if evidence.ConformanceCertificateRef == nil ||
		claimed.ConformanceLaneID == nil ||
		evidence.ConformanceCertificateRef.RegistryGeneration != evidence.SchedulingDecision.RegistryGeneration {
		return runtimeCertificateReferenceV118{}, false
	}
	projected, ok := projectRuntimeServiceEntrantV117(strategy, evidence, claimed, registry)
	if !ok {
		return runtimeCertificateReferenceV118{}, false
	}
	return runtimeCertificateReferenceV118{
		Side:                  side,
		CertificateID:         evidence.ConformanceCertificateRef.CertificateID,
		CertificateRecordHash: "sha256:" + evidence.ConformanceCertificateRef.CertificateRecordHash,
		RegistryGeneration:    evidence.ConformanceCertificateRef.RegistryGeneration,
		Lane:                  *claimed.ConformanceLaneID,
		FreshUntil:            evidence.SchedulingDecision.FreshUntil,
		SourceIdentity: runtimeCertificateSourceIdentityV118{
			Side: side, StrategyRevisionID: evidence.StrategyRevisionID,
			OriginalSourceSHA256:   projected.SourceIdentity.OriginalSourceSHA256,
			NormalizedSourceSHA256: projected.SourceIdentity.NormalizedSourceSHA256,
			ArtifactSHA256:         projected.SourceIdentity.ArtifactSHA256,
			IdentityManifestRoot:   claimed.IdentityManifestRoot,
			EvidenceGraphRoot:      claimed.EvidenceGraphRoot,
			LaneIdentityHash:       claimed.LaneIdentityHash,
		},
	}, true
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

func buildRuntimeServiceRequestForClaimedJob(ctx context.Context, pool *pgxpool.Pool, claimed *claimedMatchJob, registry *goDeploymentLaneRegistry) (*runtimeServiceRequest, error) {
	if claimed == nil || claimed.Integrity == nil {
		return nil, errors.New("claimed Match integrity identity is unavailable")
	}
	request, err := buildRuntimeServiceRequestForClaimedMatch(ctx, pool, claimed.MatchID, claimed.JobID)
	if err != nil {
		return nil, err
	}
	claimedTuple := registeredCompatibilityTuple{TupleID: claimed.Integrity.CompatibilityTupleID, Tuple: claimed.Integrity.CompatibilityTuple}
	if !runtimeServiceStrategyMatchesClaim(request.Strategies.Bottom, claimed.Integrity.Bottom, claimedTuple, registry) ||
		!runtimeServiceStrategyMatchesClaim(request.Strategies.Top, claimed.Integrity.Top, claimedTuple, registry) {
		return nil, errors.New("claimed Match Strategy Revision drifted from its executable lane evidence")
	}
	snapshot, err := runtimeServiceSnapshotForClaim(claimed.Integrity)
	if err != nil {
		return nil, err
	}
	request.EvidenceSnapshot = snapshot
	var failure *runtimeServiceFailure
	if claimed.Integrity.CompatibilityTuple.RuntimeABI == strategyRuntimeABIVersionV117 {
		request.Limits = defaultRuntimeServiceLimitsV117()
		failure = validateNestedRuntimeServiceRequestV117(*request)
	} else {
		failure = validateRuntimeServiceRequest(*request)
	}
	if failure != nil {
		return nil, errors.New("claimed Match integrity request is invalid")
	}
	return request, nil
}

// The successor full-service envelope carries the actual current Match input.
// Its nested shape is v1.16-compatible, while its Strategy ABI pins are v1.17.
// Normalize only those already-checked ABI pins on a private clone so the
// immutable historical validator can continue to own every shared field.
func validateNestedRuntimeServiceRequestV117(request runtimeServiceRequest) *runtimeServiceFailure {
	if !validSuccessorRuntimeLimitsV117(request.Limits) {
		return newRuntimeServiceFailure("RuntimeServiceContractMismatch", "Successor runtime request limits are invalid", false, nil)
	}
	normalized := request
	normalize := func(revision runtimeServiceStrategyRevision) (runtimeServiceStrategyRevision, bool) {
		if stringValue(revision.Runtime, "abiVersion") != strategyRuntimeABIVersionV117 {
			return revision, false
		}
		revision.Runtime = cloneMap(revision.Runtime)
		revision.Metadata = cloneMap(revision.Metadata)
		if revision.Runtime == nil || revision.Metadata == nil {
			return revision, false
		}
		revision.Runtime["abiVersion"] = strategyRuntimeABIVersion
		if runtimeAdapterID(revision.Runtime) == "runtime-wasm-wasi-wasmtime-preview1" {
			artifact := mapValue(revision.Metadata, "compiledArtifact")
			if stringValue(artifact, "abiVersion") != strategyRuntimeABIVersionV117 {
				return revision, false
			}
			artifact["abiVersion"] = strategyRuntimeABIVersion
			revision.Metadata["compiledArtifact"] = artifact
		}
		return revision, true
	}
	var ok bool
	normalized.Strategies.Bottom, ok = normalize(request.Strategies.Bottom)
	if !ok {
		return newRuntimeServiceFailure("RuntimeServiceContractMismatch", "Successor runtime request bottom Strategy ABI is invalid", false, nil)
	}
	normalized.Strategies.Top, ok = normalize(request.Strategies.Top)
	if !ok {
		return newRuntimeServiceFailure("RuntimeServiceContractMismatch", "Successor runtime request top Strategy ABI is invalid", false, nil)
	}
	return validateRuntimeServiceRequest(normalized)
}

func runtimeServiceStrategyMatchesClaim(strategy runtimeServiceStrategyRevision, evidence goEntrantExecutionEvidence, tuple registeredCompatibilityTuple, registry *goDeploymentLaneRegistry) bool {
	if strategy.LockedAt == nil || strategy.ID != evidence.StrategyRevisionID {
		return false
	}
	return creationLaneMatchesEntrant(evidence.LaneIdentity, map[string]any{
		"strategyRevisionId":  strategy.ID,
		"sourceHash":          strategy.SourceHash,
		"sourceBytes":         strategy.SourceBytes,
		"engineCompatibility": strategy.EngineCompatibility,
		"_creationRuntime":    strategy.Runtime,
		"_creationValidation": strategy.Validation,
		"_creationMetadata":   strategy.Metadata,
	}, tuple, registry)
}

func runtimeServiceSnapshotForClaim(identity *claimedMatchIntegrityIdentity) (runtimeServiceEvidenceSnapshot, error) {
	if identity == nil {
		return runtimeServiceEvidenceSnapshot{}, errors.New("claimed Match integrity identity is unavailable")
	}
	snapshot := runtimeServiceEvidenceSnapshot{
		Compatibility:       runtimeServiceCompatibilityReference{TupleID: identity.CompatibilityTupleID, Tuple: identity.CompatibilityTuple},
		AuthorityBundleHash: identity.AuthorityBundleHash, RegistryGeneration: identity.RegistryGeneration,
		Publication: runtimeServicePublicationReference{PublicationID: identity.PublicationID, InstallReceiptID: identity.InstallReceiptID, PayloadSHA256: identity.PayloadSHA256, EnvelopeSHA256: identity.EnvelopeSHA256, SourceManifestHash: identity.SourceManifestHash},
	}
	snapshot.Entrants.Bottom = runtimeServiceEntrantReference(identity, identity.Bottom)
	snapshot.Entrants.Top = runtimeServiceEntrantReference(identity, identity.Top)
	return snapshot, nil
}

func runtimeServiceEntrantReference(identity *claimedMatchIntegrityIdentity, entrant goEntrantExecutionEvidence) runtimeServiceEntrantAuthorityReference {
	decision := runtimeServiceSchedulingDecisionReference{Status: entrant.SchedulingDecision.Status, ReasonCode: entrant.SchedulingDecision.ReasonCode, EvaluatedAt: entrant.SchedulingDecision.EvaluatedAt, FreshUntil: entrant.SchedulingDecision.FreshUntil, RegistryGeneration: entrant.SchedulingDecision.RegistryGeneration}
	decisionID := "scheduling-decision:sha256:" + framedCreationHash("cowards-game:runtime-authority-scheduling-decision:v1", []string{entrant.EntrantKey, entrant.StrategyRevisionID, string(decision.Status), decision.ReasonCode, decision.EvaluatedAt, decision.FreshUntil, decision.RegistryGeneration})
	reference := runtimeServiceEntrantAuthorityReference{
		EntrantKey: entrant.EntrantKey, StrategyRevisionID: entrant.StrategyRevisionID,
		LaneIdentityHash: "sha256:" + hashCreationLaneIdentity(entrant.LaneIdentity), EffectiveStatus: entrant.SchedulingDecision.Status,
		SchedulingDecisionID: decisionID, SchedulingDecision: decision,
		ContainmentCertificateID:   entrant.ContainmentCertificateRef.CertificateID,
		ContainmentCertificateHash: "sha256:" + entrant.ContainmentCertificateRef.CertificateRecordHash,
	}
	if entrant.ConformanceCertificateRef != nil {
		reference.ConformanceCertificateID = entrant.ConformanceCertificateRef.CertificateID
		reference.ConformanceCertificateHash = "sha256:" + entrant.ConformanceCertificateRef.CertificateRecordHash
	}
	temporary := runtimeServiceEvidenceSnapshot{Compatibility: runtimeServiceCompatibilityReference{TupleID: identity.CompatibilityTupleID, Tuple: identity.CompatibilityTuple}, AuthorityBundleHash: identity.AuthorityBundleHash, RegistryGeneration: identity.RegistryGeneration, Publication: runtimeServicePublicationReference{PublicationID: identity.PublicationID, InstallReceiptID: identity.InstallReceiptID, PayloadSHA256: identity.PayloadSHA256, EnvelopeSHA256: identity.EnvelopeSHA256, SourceManifestHash: identity.SourceManifestHash}}
	reference.SchedulingDecisionHash = hashRuntimeServiceSchedulingDecision(temporary, reference)
	return reference
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
		  bottom.locked_at,
		  top.id,
		  top.source,
		  top.source_hash,
		  top.source_bytes,
		  top.runtime,
		  top.engine_compatibility,
		  top.validation,
		  top.metadata,
		  top.locked_at
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
		&row.BottomStrategy.LockedAt,
		&row.TopStrategy.ID,
		&row.TopStrategy.Source,
		&row.TopStrategy.SourceHash,
		&row.TopStrategy.SourceBytes,
		&topRuntimeRaw,
		&topEngineRaw,
		&topValidationRaw,
		&topMetadataRaw,
		&row.TopStrategy.LockedAt,
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

func runtimeServiceCompletionPayload(response *runtimeServiceResponse) (map[string]any, map[string]any, runtimeSemanticReceipt, runtimeSemanticWireEvidence, error) {
	if response == nil || !response.OK || response.Result == nil {
		return nil, nil, runtimeSemanticReceipt{}, runtimeSemanticWireEvidence{}, errors.New("runtime service response did not include a completion result")
	}
	if response.Result.Chronicle == nil {
		return nil, nil, runtimeSemanticReceipt{}, runtimeSemanticWireEvidence{}, errors.New("runtime service result missing Chronicle")
	}
	if response.Result.FinalState == nil {
		return nil, nil, runtimeSemanticReceipt{}, runtimeSemanticWireEvidence{}, errors.New("runtime service result missing final state")
	}
	return response.Result.Chronicle, response.Result.FinalState, response.Result.SemanticReceipt, response.Result.SemanticWireEvidence.clone(), nil
}

func runtimeServiceCompletionPayloadV117(response *runtimeServiceResponseV117) (map[string]any, map[string]any, runtimeSemanticReceiptV117, error) {
	if response == nil || !response.OK || response.Result == nil {
		return nil, nil, runtimeSemanticReceiptV117{}, errors.New("runtime service v1.17 response did not include a completion result")
	}
	var chronicle map[string]any
	if err := decodeStrictJSONUseNumber(response.Result.Chronicle, &chronicle); err != nil || chronicle == nil {
		return nil, nil, runtimeSemanticReceiptV117{}, errors.New("runtime service v1.17 result missing Chronicle")
	}
	var finalState map[string]any
	if err := decodeStrictJSONUseNumber(response.Result.FinalState, &finalState); err != nil || finalState == nil {
		return nil, nil, runtimeSemanticReceiptV117{}, errors.New("runtime service v1.17 result missing final state")
	}
	var outcome any
	if err := decodeStrictJSONUseNumber(response.Result.Outcome, &outcome); err != nil || !jsonValuesEqual(outcome, finalState["outcome"]) {
		return nil, nil, runtimeSemanticReceiptV117{}, errors.New("runtime service v1.17 result outcome changed")
	}
	return chronicle, finalState, response.Result.SemanticReceipt, nil
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

func defaultRuntimeServiceLimitsV117() map[string]any {
	return map[string]any{
		"timeoutMs":             1000,
		"stdoutBytes":           262144,
		"stderrBytes":           65536,
		"sourceBytes":           65536,
		"strategyMemoryBytes":   32768,
		"soldierMemoryBytes":    2048,
		"objectivePayloadBytes": 1024,
		"environment":           "empty",
		"filesystem":            "none",
		"network":               "disabled",
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
