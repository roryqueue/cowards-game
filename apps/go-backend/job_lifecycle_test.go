package main

import (
	"context"
	"encoding/json"
	"fmt"
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

func TestMatchExecutionQuarantineHelpers(t *testing.T) {
	if got := quarantineReasonForAttempt(3, 3, true); got != matchExecutionQuarantineRetryExhausted {
		t.Fatalf("expected retry exhausted reason, got %q", got)
	}
	if got := quarantineReasonForAttempt(1, 3, false); got != matchExecutionQuarantineNonRetryable {
		t.Fatalf("expected non-retryable reason, got %q", got)
	}
	evidence := sanitizeMatchExecutionOperatorEvidence(map[string]any{
		"errorClass":      "RuntimeServiceSourceMismatch",
		"retryable":       false,
		"attemptNumber":   1,
		"maxAttempts":     3,
		"failureCategory": matchFailureCategoryStaleArtifact,
		"details": map[string]any{
			"workerId": "worker:go",
			"reason":   "compiled-artifact-source-hash-mismatch",
			"source":   "export default {}",
			"stderr":   "host path /Users/secret",
		},
		"leaseToken": "secret",
	})
	bytes, err := json.Marshal(evidence)
	if err != nil {
		t.Fatal(err)
	}
	text := string(bytes)
	for _, forbidden := range []string{"export default", "stderr", "/Users/secret", "leaseToken", "secret"} {
		if strings.Contains(text, forbidden) {
			t.Fatalf("operator evidence leaked %q in %s", forbidden, text)
		}
	}
	for _, required := range []string{"RuntimeServiceSourceMismatch", "compiled-artifact-source-hash-mismatch", matchFailureCategoryStaleArtifact} {
		if !strings.Contains(text, required) {
			t.Fatalf("operator evidence omitted %q in %s", required, text)
		}
	}
}

func TestMatchJobLifecycleIntegrityClaimContract(t *testing.T) {
	for _, required := range []string{
		"runtime_evidence_authority_installed_head",
		"authority_publication_id",
		"authority_install_receipt_id",
		"authority_source_manifest_hash",
		"compatibility_tuple_id",
		"bottom_execution_entrant_key",
		"top_execution_entrant_key",
		"bottom_containment",
		"top_containment",
		"scheduling_status = 'counted'",
		"bottom_containment.fresh_until >= $1",
		"bottom_execution_entrant.scheduling_fresh_until >= $1",
		"runtimeServiceV117",
		"identity_manifest_root",
		"evidence_graph_root",
		"exact_pin_expansion",
		"graph_schema_version",
		"runtime_evidence_v1_17_installed_authorities",
		"successor_authority.authority_bundle_hash",
		"successor_authority.source_manifest_hash",
		"successor_authority.registry_generation",
		"successor_authority.semantic_tuple_manifest_hash",
		"successor_authority.install_receipt_id",
		"successor_authority.install_receipt_hash",
		"bottom_containment.certificate_kind",
		"top_containment.certificate_kind",
	} {
		if !strings.Contains(claimNextMatchJobSQL, required) {
			t.Fatalf("integrity claim SQL is missing %q", required)
		}
	}
	selectIndex := strings.Index(claimNextMatchJobSQL, "runtime_evidence_authority_installed_head")
	updateIndex := strings.Index(claimNextMatchJobSQL, "update match_jobs")
	if selectIndex < 0 || (updateIndex >= 0 && updateIndex < selectIndex) {
		t.Fatal("integrity rejection must precede lifecycle mutation")
	}
	if !strings.Contains(recheckClaimedMatchIntegritySQL, "runtime_evidence_authority_installed_head") ||
		!strings.Contains(recheckClaimedMatchIntegritySQL, "installed_head.install_receipt_id = ms.authority_install_receipt_id") ||
		!strings.Contains(recheckClaimedMatchIntegritySQL, "runtime_evidence_v1_17_installed_authorities") ||
		!strings.Contains(recheckClaimedMatchIntegritySQL, "successor_authority.install_receipt_hash") {
		t.Fatal("in-flight recheck must require the canonical installed authority head")
	}
	if !strings.Contains(claimNextMatchJobSQL, "successor_authority.authority_bundle_hash <> ms.authority_bundle_hash") ||
		!strings.Contains(recheckClaimedMatchIntegritySQL, "successor_authority.authority_bundle_hash <> ms.authority_bundle_hash") {
		t.Fatal("successor and nested legacy authority identities must be distinct")
	}
}

func TestPhase258ClaimedV117IntegrityRequiresExactGraphAndAccountingSnapshot(t *testing.T) {
	now := time.Date(2026, 7, 15, 13, 30, 0, 0, time.UTC)
	authority, identity := claimedIntegrityFixture(t, now)
	authority.CompatibilityTuple.Tuple.RuntimeABI = strategyRuntimeABIVersionV117
	identity.CompatibilityTuple.RuntimeABI = strategyRuntimeABIVersionV117
	identity.Bottom.LaneIdentity.SemanticTuple.RuntimeABI = strategyRuntimeABIVersionV117
	identity.Top.LaneIdentity.SemanticTuple.RuntimeABI = strategyRuntimeABIVersionV117
	for index, entrant := range []goEntrantExecutionEvidence{identity.Bottom, identity.Top} {
		authority.Payload.Certificates[index].LaneIdentityHash = "sha256:" + hashCreationLaneIdentity(entrant.LaneIdentity)
	}
	recomputed, err := createGoMatchSetIntegrityIdentity(authority, []goEntrantExecutionEvidence{identity.Bottom, identity.Top})
	if err != nil {
		t.Fatal(err)
	}
	pair, err := recomputed.pair(identity.Bottom.EntrantKey, identity.Top.EntrantKey, identity.Bottom.StrategyRevisionID, identity.Top.StrategyRevisionID)
	if err != nil {
		t.Fatal(err)
	}
	identity.EvidenceSetHash = recomputed.EvidenceSetHash
	identity.PairHash = pair.PairHash
	if err := validateClaimedMatchIntegrity(authority, identity, now); err == nil {
		t.Fatal("v1.17 claim without exact graph roots, budget profile, and ledger prestate was admitted")
	}
	identity.RuntimeServiceV117 = &claimedRuntimeServiceV117{
		BudgetProfileSHA256: runtimeServiceV117BudgetProfileSHA256,
		LedgerPrestateRoot:  runtimeServiceV117EmptyLedgerRoot,
		Bottom: runtimeServiceEntrantV117{
			IdentityManifestRoot: "sha256:" + strings.Repeat("1", 64),
			EvidenceGraphRoot:    "sha256:" + strings.Repeat("2", 64),
		},
		Top: runtimeServiceEntrantV117{
			IdentityManifestRoot: "sha256:" + strings.Repeat("3", 64),
			EvidenceGraphRoot:    "sha256:" + strings.Repeat("4", 64),
		},
	}
	if err := validateClaimedMatchIntegrity(authority, identity, now); err != nil {
		t.Fatalf("exact v1.17 claim snapshot was rejected: %v", err)
	}
	mutations := []struct {
		name   string
		mutate func(*claimedRuntimeServiceV117)
	}{
		{"budget profile", func(value *claimedRuntimeServiceV117) {
			value.BudgetProfileSHA256 = "sha256:" + strings.Repeat("5", 64)
		}},
		{"ledger prestate", func(value *claimedRuntimeServiceV117) { value.LedgerPrestateRoot = "sha256:" + strings.Repeat("6", 64) }},
		{"bottom identity root", func(value *claimedRuntimeServiceV117) { value.Bottom.IdentityManifestRoot = "" }},
		{"bottom evidence root", func(value *claimedRuntimeServiceV117) { value.Bottom.EvidenceGraphRoot = "" }},
		{"top identity root", func(value *claimedRuntimeServiceV117) { value.Top.IdentityManifestRoot = "" }},
		{"top evidence root", func(value *claimedRuntimeServiceV117) { value.Top.EvidenceGraphRoot = "" }},
	}
	for _, mutation := range mutations {
		t.Run(mutation.name, func(t *testing.T) {
			candidate := *identity
			binding := *identity.RuntimeServiceV117
			candidate.RuntimeServiceV117 = &binding
			mutation.mutate(candidate.RuntimeServiceV117)
			if err := validateClaimedMatchIntegrity(authority, &candidate, now); err == nil {
				t.Fatal("mutated v1.17 claim snapshot was admitted")
			}
		})
	}
}

func TestMatchJobLifecycleIntegrityValidation(t *testing.T) {
	now := time.Date(2026, 7, 13, 12, 0, 0, 0, time.UTC)
	if authority, identity := claimedIntegrityFixture(t, now); validateClaimedMatchIntegrity(authority, identity, now) != nil {
		t.Fatalf("valid heterogeneous claimed identity was rejected: %v", validateClaimedMatchIntegrity(authority, identity, now))
	}
	tests := []struct {
		name   string
		mutate func(*verifiedRuntimeEvidenceAuthority, *claimedMatchIntegrityIdentity)
	}{
		{name: "bundle replacement", mutate: func(_ *verifiedRuntimeEvidenceAuthority, identity *claimedMatchIntegrityIdentity) {
			identity.AuthorityBundleHash = "sha256:" + strings.Repeat("9", 64)
		}},
		{name: "generation drift", mutate: func(_ *verifiedRuntimeEvidenceAuthority, identity *claimedMatchIntegrityIdentity) {
			identity.RegistryGeneration = "2"
		}},
		{name: "tuple drift", mutate: func(_ *verifiedRuntimeEvidenceAuthority, identity *claimedMatchIntegrityIdentity) {
			identity.CompatibilityTuple.Engine = "engine:drift"
		}},
		{name: "ordered pair swap", mutate: func(_ *verifiedRuntimeEvidenceAuthority, identity *claimedMatchIntegrityIdentity) {
			identity.Bottom, identity.Top = identity.Top, identity.Bottom
		}},
		{name: "receipt missing", mutate: func(_ *verifiedRuntimeEvidenceAuthority, identity *claimedMatchIntegrityIdentity) {
			identity.InstallReceiptID = ""
		}},
		{name: "source set missing", mutate: func(_ *verifiedRuntimeEvidenceAuthority, identity *claimedMatchIntegrityIdentity) {
			identity.SourceSet = nil
		}},
		{name: "per-side certificate revoked", mutate: func(authority *verifiedRuntimeEvidenceAuthority, identity *claimedMatchIntegrityIdentity) {
			authority.Payload.Revocations = []runtimeEvidenceAuthorityRevocation{{CertificateID: identity.Top.ContainmentCertificateRef.CertificateID, CertificateRecordHash: "sha256:" + identity.Top.ContainmentCertificateRef.CertificateRecordHash}}
		}},
		{name: "decision stale", mutate: func(_ *verifiedRuntimeEvidenceAuthority, identity *claimedMatchIntegrityIdentity) {
			identity.Bottom.SchedulingDecision.FreshUntil = now.Add(-time.Second).Format(canonicalJSONInstantLayout)
		}},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			authority, identity := claimedIntegrityFixture(t, now)
			test.mutate(authority, identity)
			if err := validateClaimedMatchIntegrity(authority, identity, now); err == nil {
				t.Fatal("expected claimed integrity drift to be rejected")
			}
		})
	}
}

func claimedIntegrityFixture(t *testing.T, now time.Time) (*verifiedRuntimeEvidenceAuthority, *claimedMatchIntegrityIdentity) {
	t.Helper()
	tuple := registeredCompatibilityTuple{TupleID: "sha256:" + strings.Repeat("a", 64), Tuple: canonicalCompatibilityTuple{Rules: "rules-v1", Engine: "engine-v1", RuntimeABI: "abi-v1", Chronicle: "chronicle-v1", ArenaCatalog: "arenas-v1", SetPolicy: "set-v1"}}
	authority := &verifiedRuntimeEvidenceAuthority{
		AuthorityBundleHash: "sha256:" + strings.Repeat("b", 64),
		EnvelopeSHA256:      "sha256:" + strings.Repeat("c", 64), RegistryGeneration: "1",
		SemanticTupleManifestHash: tuple.TupleID, CompatibilityTuple: tuple,
		TrustDomain: runtimeEvidenceAuthorityProductionTrustDomain,
		Payload: runtimeEvidenceAuthorityPayload{
			RegistryGeneration: "1", IssuedAt: now.Add(-time.Hour).Format(canonicalJSONInstantLayout),
			ValidFrom: now.Add(-time.Hour).Format(canonicalJSONInstantLayout), ValidUntil: now.Add(time.Hour).Format(canonicalJSONInstantLayout),
			SemanticTupleManifestHash: tuple.TupleID,
		},
	}
	entrants := make([]goEntrantExecutionEvidence, 0, 2)
	for index, language := range []string{"typescript", "python"} {
		lane := goExecutableLaneIdentity{ProviderID: "provider:" + language, LanguageID: language, RuntimeID: "runtime:" + language, RuntimeVersion: "1", ToolchainID: "toolchain:" + language, ToolchainVersion: "1", AdapterID: "adapter:" + language, AdapterVersion: "1", PolicyID: "policy", PolicyVersion: "1", CorpusID: "corpus", CorpusVersion: "1", ArtifactID: fmt.Sprintf("artifact:%d", index), ArtifactSHA256: fmt.Sprintf("%064x", index+10), ImplementationID: "implementation", BuildID: fmt.Sprintf("build:%d", index), SemanticTupleID: tuple.TupleID, SemanticTuple: tuple.Tuple}
		laneHash := hashCreationLaneIdentity(lane)
		certificate := runtimeEvidenceAuthorityCertificate{Kind: "containment", CertificateID: fmt.Sprintf("certificate:containment:%d", index), CertificateVersion: "certificate-v1", CertificateRecordHash: "sha256:" + fmt.Sprintf("%064x", index+20), LaneIdentityHash: "sha256:" + laneHash}
		authority.Payload.Certificates = append(authority.Payload.Certificates, certificate)
		entrants = append(entrants, goEntrantExecutionEvidence{
			EntrantKey: fmt.Sprintf("entrant:%d", index), StrategyRevisionID: fmt.Sprintf("revision:%d", index), LaneIdentity: lane,
			ContainmentCertificateRef: creationCertificateSnapshot(runtimeEvidenceCertificateReferenceFor(certificate, "1")),
			SchedulingDecision:        goSchedulingDecision{Status: executableLaneEvidenceExhibitionOnly, ReasonCode: "CONFORMANCE_MISSING", EvaluatedAt: now.Format(canonicalJSONInstantLayout), FreshUntil: now.Add(time.Hour).Format(canonicalJSONInstantLayout), RegistryGeneration: "1"},
		})
	}
	recomputed, err := createGoMatchSetIntegrityIdentity(authority, entrants)
	if err != nil {
		t.Fatal(err)
	}
	pair, err := recomputed.pair(entrants[0].EntrantKey, entrants[1].EntrantKey, entrants[0].StrategyRevisionID, entrants[1].StrategyRevisionID)
	if err != nil {
		t.Fatal(err)
	}
	return authority, &claimedMatchIntegrityIdentity{
		MatchSetID: "match-set:integrity", CompatibilityTupleID: tuple.TupleID, CompatibilityTuple: tuple.Tuple,
		AuthorityBundleHash: authority.AuthorityBundleHash, RegistryGeneration: "1", EvidenceSetHash: recomputed.EvidenceSetHash, PairHash: pair.PairHash,
		PublicationID: "publication:1", InstallReceiptID: "receipt:1", PayloadSHA256: authority.AuthorityBundleHash, EnvelopeSHA256: authority.EnvelopeSHA256,
		SourceManifestHash: "sha256:" + strings.Repeat("d", 64), SourceSet: map[string]any{"certificateIds": []any{"certificate:containment:0", "certificate:containment:1"}},
		Bottom: entrants[0], Top: entrants[1],
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
		assertNoPhase97Quarantine(t, ctx, pool, ids.jobID)
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
		assertPhase97Quarantine(t, ctx, pool, ids.jobID, matchExecutionQuarantineRetryExhausted, matchFailureCategorySystemFailure, true, 1)
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

	t.Run("non retryable terminal failure is quarantined immediately with redacted evidence", func(t *testing.T) {
		prefix := "phase97-nonretry-quarantine"
		cleanupPhase97Rows(t, ctx, pool, prefix)
		defer cleanupPhase97Rows(t, ctx, pool, prefix)
		ids := seedPhase97MatchJob(t, ctx, pool, prefix, 3, "queued", 0, nil)
		lifecycle := newTestMatchJobLifecycle(pool, time.Date(2026, 5, 16, 12, 0, 0, 0, time.UTC), "lease:go:nonretry")
		claimed, err := lifecycle.claimNextMatchJob(ctx, claimMatchJobInput{WorkerID: "worker:go:nonretry"})
		if err != nil {
			t.Fatal(err)
		}
		if claimed == nil {
			t.Fatal("expected claimed job")
		}
		status, err := lifecycle.recordAttemptFailure(ctx, recordAttemptFailureInput{
			JobID:        claimed.JobID,
			LeaseToken:   claimed.LeaseToken,
			ErrorClass:   "RuntimeServiceSourceMismatch",
			ErrorMessage: "WASM/WASI artifact source hash mismatch",
			Retryable:    false,
			Category:     matchFailureCategoryStaleArtifact,
			Details: map[string]any{
				"workerId": ids.workerID,
				"reason":   "compiled-artifact-source-hash-mismatch",
				"source":   "export default {}",
				"stderr":   "host path /Users/secret",
			},
		})
		if err != nil {
			t.Fatal(err)
		}
		if status != "failed_system" {
			t.Fatalf("expected failed_system, got %q", status)
		}
		assertPhase97Job(t, ctx, pool, ids.jobID, "failed_system", 1, "worker:go:nonretry", "lease:go:nonretry")
		assertPhase97Quarantine(t, ctx, pool, ids.jobID, matchExecutionQuarantineNonRetryable, matchFailureCategoryStaleArtifact, false, 1)
	})

	t.Run("operator recovery requeues eligible quarantine once with idempotency", func(t *testing.T) {
		prefix := "phase97-recover-requeue"
		cleanupPhase97Rows(t, ctx, pool, prefix)
		defer cleanupPhase97Rows(t, ctx, pool, prefix)
		ids := seedPhase97MatchJob(t, ctx, pool, prefix, 1, "queued", 0, nil)
		lifecycle := newTestMatchJobLifecycle(pool, time.Date(2026, 5, 16, 12, 0, 0, 0, time.UTC), "lease:go:recover")
		claimed, err := lifecycle.claimNextMatchJob(ctx, claimMatchJobInput{WorkerID: "worker:go:recover"})
		if err != nil {
			t.Fatal(err)
		}
		if claimed == nil {
			t.Fatal("expected claimed job")
		}
		if _, err := lifecycle.recordAttemptFailure(ctx, recordAttemptFailureInput{
			JobID:        claimed.JobID,
			LeaseToken:   claimed.LeaseToken,
			ErrorClass:   "RuntimeServiceStopped",
			ErrorMessage: "runtime service unavailable",
			Retryable:    true,
			Category:     matchFailureCategoryRuntimeUnavailable,
			Details:      map[string]any{"workerId": ids.workerID},
		}); err != nil {
			t.Fatal(err)
		}
		service := newMatchExecutionRecoveryService(pool)
		result, err := service.recoverJob(ctx, recoverMatchExecutionJobInput{
			JobID:          ids.jobID,
			OperatorID:     "operator:v1.28",
			IdempotencyKey: "phase97-recover-requeue-key",
			ActionType:     matchExecutionRecoveryActionRequeue,
		})
		if err != nil {
			t.Fatal(err)
		}
		if result.Status != "applied" || result.MatchID != ids.matchID {
			t.Fatalf("expected applied recovery for %s, got %+v", ids.matchID, result)
		}
		assertPhase97JobWithMax(t, ctx, pool, ids.jobID, "queued", 1, 2, "", "")
		assertPhase97MatchStatus(t, ctx, pool, ids.matchID, "pending")
		assertPhase97QuarantineStatus(t, ctx, pool, ids.jobID, "released")
		assertPhase97OperatorActionCount(t, ctx, pool, ids.jobID, 1)

		duplicate, err := service.recoverJob(ctx, recoverMatchExecutionJobInput{
			JobID:          ids.jobID,
			OperatorID:     "operator:v1.28",
			IdempotencyKey: "phase97-recover-requeue-key",
			ActionType:     matchExecutionRecoveryActionRequeue,
		})
		if err != nil {
			t.Fatal(err)
		}
		if duplicate.Status != "duplicate" {
			t.Fatalf("expected duplicate idempotent recovery result, got %+v", duplicate)
		}
		assertPhase97JobWithMax(t, ctx, pool, ids.jobID, "queued", 1, 2, "", "")
		assertPhase97OperatorActionCount(t, ctx, pool, ids.jobID, 1)
	})

	t.Run("operator recovery rejects stale artifact quarantine without source fallback", func(t *testing.T) {
		prefix := "phase97-recover-stale"
		cleanupPhase97Rows(t, ctx, pool, prefix)
		defer cleanupPhase97Rows(t, ctx, pool, prefix)
		ids := seedPhase97MatchJob(t, ctx, pool, prefix, 3, "queued", 0, nil)
		lifecycle := newTestMatchJobLifecycle(pool, time.Date(2026, 5, 16, 12, 0, 0, 0, time.UTC), "lease:go:stale")
		claimed, err := lifecycle.claimNextMatchJob(ctx, claimMatchJobInput{WorkerID: "worker:go:stale"})
		if err != nil {
			t.Fatal(err)
		}
		if claimed == nil {
			t.Fatal("expected claimed job")
		}
		if _, err := lifecycle.recordAttemptFailure(ctx, recordAttemptFailureInput{
			JobID:        claimed.JobID,
			LeaseToken:   claimed.LeaseToken,
			ErrorClass:   "RuntimeServiceSourceMismatch",
			ErrorMessage: "WASM/WASI artifact source hash mismatch",
			Retryable:    false,
			Category:     matchFailureCategoryStaleArtifact,
			Details:      map[string]any{"reason": "compiled-artifact-source-hash-mismatch"},
		}); err != nil {
			t.Fatal(err)
		}
		service := newMatchExecutionRecoveryService(pool)
		result, err := service.recoverJob(ctx, recoverMatchExecutionJobInput{
			JobID:          ids.jobID,
			OperatorID:     "operator:v1.28",
			IdempotencyKey: "phase97-recover-stale-key",
			ActionType:     matchExecutionRecoveryActionRerun,
		})
		if err != nil {
			t.Fatal(err)
		}
		if result.Status != "rejected" || result.Reason != "failure_category_not_recoverable" {
			t.Fatalf("expected stale artifact recovery rejection, got %+v", result)
		}
		assertPhase97JobWithMax(t, ctx, pool, ids.jobID, "failed_system", 1, 3, "worker:go:stale", "lease:go:stale")
		assertPhase97QuarantineStatus(t, ctx, pool, ids.jobID, "active")
		assertPhase97OperatorActionCount(t, ctx, pool, ids.jobID, 1)
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
	lifecycle.allowLegacyTestClaims = true
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

func assertPhase97JobWithMax(t *testing.T, ctx context.Context, pool *pgxpool.Pool, jobID string, wantStatus string, wantAttempts int, wantMaxAttempts int, wantWorkerID string, wantLeaseToken string) {
	t.Helper()
	var status string
	var attempts int
	var maxAttempts int
	var workerID *string
	var leaseToken *string
	if err := pool.QueryRow(ctx, `
		select status::text, attempts, max_attempts, worker_id, lease_token
		from match_jobs
		where id = $1
	`, jobID).Scan(&status, &attempts, &maxAttempts, &workerID, &leaseToken); err != nil {
		t.Fatal(err)
	}
	if status != wantStatus || attempts != wantAttempts || maxAttempts != wantMaxAttempts {
		t.Fatalf("unexpected job state status=%s attempts=%d max_attempts=%d", status, attempts, maxAttempts)
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

func assertPhase97Quarantine(t *testing.T, ctx context.Context, pool *pgxpool.Pool, jobID string, wantReason string, wantCategory string, wantRetryable bool, wantAttempt int) {
	t.Helper()
	var reason string
	var category string
	var retryable bool
	var attempt int
	var evidence []byte
	if err := pool.QueryRow(ctx, `
		select reason, failure_category, retryable, attempt_number, operator_evidence
		from match_execution_quarantines
		where job_id = $1 and status = 'active'
	`, jobID).Scan(&reason, &category, &retryable, &attempt, &evidence); err != nil {
		t.Fatal(err)
	}
	if reason != wantReason || category != wantCategory || retryable != wantRetryable || attempt != wantAttempt {
		t.Fatalf("unexpected quarantine reason=%q category=%q retryable=%v attempt=%d", reason, category, retryable, attempt)
	}
	text := string(evidence)
	for _, forbidden := range []string{"export default", "stderr", "/Users/secret", "leaseToken", "host path"} {
		if strings.Contains(text, forbidden) {
			t.Fatalf("quarantine evidence leaked %q in %s", forbidden, text)
		}
	}
}

func assertNoPhase97Quarantine(t *testing.T, ctx context.Context, pool *pgxpool.Pool, jobID string) {
	t.Helper()
	var count int
	if err := pool.QueryRow(ctx, "select count(*) from match_execution_quarantines where job_id = $1", jobID).Scan(&count); err != nil {
		t.Fatal(err)
	}
	if count != 0 {
		t.Fatalf("expected no quarantine rows for %s, got %d", jobID, count)
	}
}

func assertPhase97QuarantineStatus(t *testing.T, ctx context.Context, pool *pgxpool.Pool, jobID string, wantStatus string) {
	t.Helper()
	var status string
	if err := pool.QueryRow(ctx, "select status from match_execution_quarantines where job_id = $1", jobID).Scan(&status); err != nil {
		t.Fatal(err)
	}
	if status != wantStatus {
		t.Fatalf("expected quarantine status %q, got %q", wantStatus, status)
	}
}

func assertPhase97OperatorActionCount(t *testing.T, ctx context.Context, pool *pgxpool.Pool, jobID string, want int) {
	t.Helper()
	var count int
	if err := pool.QueryRow(ctx, "select count(*) from match_execution_operator_actions where job_id = $1", jobID).Scan(&count); err != nil {
		t.Fatal(err)
	}
	if count != want {
		t.Fatalf("expected %d operator actions for %s, got %d", want, jobID, count)
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
			sql:  "delete from match_execution_operator_actions where job_id like $1 or match_id like $2",
			args: []any{"match-job:" + prefix + "%", "match:" + prefix + "%"},
		},
		{
			sql:  "delete from match_execution_quarantines where job_id like $1 or match_id like $2",
			args: []any{"match-job:" + prefix + "%", "match:" + prefix + "%"},
		},
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
