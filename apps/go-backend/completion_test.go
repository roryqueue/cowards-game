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

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

func TestGoMatchCompletionFields(t *testing.T) {
	fields, err := deriveGoMatchCompletionFields(completionFinalStateForTest("match:complete:001"))
	if err != nil {
		t.Fatal(err)
	}
	if fields.MatchID != "match:complete:001" || fields.SurvivingSoldiers != 1 || fields.BottomSurvivingSoldiers != 1 || fields.TopSurvivingSoldiers != 0 || fields.SurvivalTurns != 48 {
		t.Fatalf("unexpected completion fields: %+v", fields)
	}
	if fields.WinnerPlayerID == nil || *fields.WinnerPlayerID != "player:bottom:complete:001" {
		t.Fatalf("unexpected winner: %+v", fields.WinnerPlayerID)
	}
}

func TestMatchCompletionIntegrityContract(t *testing.T) {
	source, err := os.ReadFile("completion.go")
	if err != nil {
		t.Fatal(err)
	}
	text := string(source)
	lockIndex := strings.Index(text, "lockCompletionIntegrity")
	insertIndex := strings.Index(text, "insert into chronicles")
	if lockIndex < 0 || insertIndex < 0 || lockIndex > insertIndex {
		t.Fatal("completion must lock and compare exact integrity before Chronicle insertion")
	}
	for _, required := range []string{
		"integrity_match_set_id", "compatibility_tuple_id", "compatibility_rules_version",
		"authority_publication_id", "authority_install_receipt_id", "authority_source_manifest_hash",
		"bottom_execution_entrant_key", "top_execution_entrant_key", "execution_evidence_pair_hash",
	} {
		if !strings.Contains(text, required) {
			t.Fatalf("completion omitted Chronicle integrity field %q", required)
		}
	}
}

func TestGoChronicleMetadataValidation(t *testing.T) {
	chronicle := completionChronicleForTest("match:complete:001")
	metadata, err := createGoChronicleMetadata(chronicle)
	if err != nil {
		t.Fatal(err)
	}
	if metadata.MatchID != "match:complete:001" || metadata.EventCount != 4 || metadata.SnapshotCount != 2 || metadata.Outcome == nil || metadata.ID == "" || metadata.Hash == "" {
		t.Fatalf("unexpected metadata: %+v", metadata)
	}
	invalid := completionChronicleForTest("match:private")
	invalidEvents := invalid["events"].([]any)
	invalidEvents[1].(map[string]any)["payload"] = map[string]any{"ownerDebug": "leak"}
	if _, err := createGoChronicleMetadata(invalid); err == nil {
		t.Fatal("expected private marker validation failure")
	}
	ownerPrivate := completionChronicleForTest("match:owner-private")
	ownerPrivate["private"] = map[string]any{"byPlayerId": map[string]any{"player:bottom": map[string]any{"strategyMemory": "PRIVATE_allowed_in_private_section"}}}
	if _, err := createGoChronicleMetadata(ownerPrivate); err != nil {
		t.Fatalf("expected owner-private Chronicle section to persist without public leak failure: %v", err)
	}
	missingTerminal := completionChronicleForTest("match:missing-terminal")
	missingTerminal["snapshots"] = []any{}
	if _, err := createGoChronicleMetadata(missingTerminal); err == nil {
		t.Fatal("expected missing terminal validation failure")
	}
	nonContiguous := completionChronicleForTest("match:non-contiguous")
	nonContiguousEvents := nonContiguous["events"].([]any)
	nonContiguousEvents[2].(map[string]any)["sequence"] = 9
	if _, err := createGoChronicleMetadata(nonContiguous); err == nil {
		t.Fatal("expected non-contiguous event sequence validation failure")
	}
	invalidBoard := completionChronicleForTest("match:invalid-board")
	invalidSnapshots := invalidBoard["snapshots"].([]any)
	invalidSnapshots[0].(map[string]any)["board"] = map[string]any{}
	if _, err := createGoChronicleMetadata(invalidBoard); err == nil {
		t.Fatal("expected invalid board validation failure")
	}
	withIntegrity := completionChronicleForTest("match:hash-parity")
	withIntegrity["integrity"] = map[string]any{"normalizedContentHash": "ignored"}
	withIntegrity["storageMetadata"] = map[string]any{"hostPath": "/Users/private/ignored"}
	hashWithExtra, err := hashChronicleArtifact(withIntegrity)
	if err != nil {
		t.Fatal(err)
	}
	withoutIntegrity := completionChronicleForTest("match:hash-parity")
	hashWithoutExtra, err := hashChronicleArtifact(withoutIntegrity)
	if err != nil {
		t.Fatal(err)
	}
	if hashWithExtra != hashWithoutExtra {
		t.Fatalf("expected Chronicle hash to ignore integrity/storage metadata: %s != %s", hashWithExtra, hashWithoutExtra)
	}
}

func TestGoMatchCompletionIntegration(t *testing.T) {
	databaseURL := os.Getenv("COWARDS_GO_BACKEND_TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("set COWARDS_GO_BACKEND_TEST_DATABASE_URL for Go completion integration tests")
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

	t.Run("completes atomically with Chronicle", func(t *testing.T) {
		prefix := "phase99-complete"
		cleanupPhase97Rows(t, ctx, pool, prefix)
		if _, err := pool.Exec(ctx, "delete from match_sets where id = $1", "match-set:"+prefix); err != nil {
			t.Fatal(err)
		}
		defer cleanupPhase97Rows(t, ctx, pool, prefix)
		defer func() {
			if _, err := pool.Exec(ctx, "delete from match_sets where id = $1", "match-set:"+prefix); err != nil {
				t.Fatal(err)
			}
		}()
		ids := seedPhase97MatchJob(t, ctx, pool, prefix, 3, "queued", 0, nil)
		if _, err := pool.Exec(ctx, "insert into match_sets (id, status, matrix) values ($1, 'pending', '{}'::jsonb)", "match-set:"+prefix); err != nil {
			t.Fatal(err)
		}
		if _, err := pool.Exec(ctx, "insert into match_set_matches (match_set_id, match_id, matrix_index) values ($1, $2, 0)", "match-set:"+prefix, ids.matchID); err != nil {
			t.Fatal(err)
		}
		lifecycle := newTestMatchJobLifecycle(pool, time.Date(2026, 5, 16, 12, 0, 0, 0, time.UTC), "lease:go:complete")
		claimed, err := lifecycle.claimNextMatchJob(ctx, claimMatchJobInput{WorkerID: "worker:go:complete"})
		if err != nil {
			t.Fatal(err)
		}
		service := newMatchCompletionService(pool)
		service.allowLegacyTestCompletion = true
		result, err := service.completeMatch(ctx, completeMatchInput{
			JobID:      claimed.JobID,
			LeaseToken: claimed.LeaseToken,
			Chronicle:  completionChronicleForTest(ids.matchID),
			FinalState: completionFinalStateForTest(ids.matchID),
		})
		if err != nil {
			t.Fatal(err)
		}
		if result.Status != "complete" || result.MatchID != ids.matchID || result.ChronicleID == "" {
			t.Fatalf("unexpected completion result: %+v", result)
		}
		assertPhase97Job(t, ctx, pool, ids.jobID, "complete", 1, "worker:go:complete", "lease:go:complete")
		assertPhase97MatchStatus(t, ctx, pool, ids.matchID, "complete")
		assertChronicleExists(t, ctx, pool, ids.matchID)
		assertPhase97Attempt(t, ctx, pool, ids.jobID, 1, "complete")
		assertPhase100MatchSetStored(t, ctx, pool, "match-set:"+prefix, matchSetStatusComplete, false, true)

		duplicate, err := service.completeMatch(ctx, completeMatchInput{
			JobID:      claimed.JobID,
			LeaseToken: claimed.LeaseToken,
			Chronicle:  completionChronicleForTest(ids.matchID),
			FinalState: completionFinalStateForTest(ids.matchID),
		})
		if err != nil {
			t.Fatal(err)
		}
		if duplicate.ChronicleID != result.ChronicleID {
			t.Fatalf("duplicate completion returned different Chronicle: %+v", duplicate)
		}
	})

	t.Run("fails closed on invalid lease or invalid Chronicle", func(t *testing.T) {
		prefix := "phase99-invalid"
		cleanupPhase97Rows(t, ctx, pool, prefix)
		defer cleanupPhase97Rows(t, ctx, pool, prefix)
		ids := seedPhase97MatchJob(t, ctx, pool, prefix, 3, "queued", 0, nil)
		lifecycle := newTestMatchJobLifecycle(pool, time.Date(2026, 5, 16, 12, 0, 0, 0, time.UTC), "lease:go:invalid")
		claimed, err := lifecycle.claimNextMatchJob(ctx, claimMatchJobInput{WorkerID: "worker:go:invalid"})
		if err != nil {
			t.Fatal(err)
		}
		service := newMatchCompletionService(pool)
		service.allowLegacyTestCompletion = true
		if _, err := service.completeMatch(ctx, completeMatchInput{
			JobID:      claimed.JobID,
			LeaseToken: "wrong-token",
			Chronicle:  completionChronicleForTest(ids.matchID),
			FinalState: completionFinalStateForTest(ids.matchID),
		}); err == nil {
			t.Fatal("expected invalid lease completion to fail")
		}
		invalidChronicle := completionChronicleForTest(ids.matchID)
		invalidChronicle["snapshots"] = []any{}
		if _, err := service.completeMatch(ctx, completeMatchInput{
			JobID:      claimed.JobID,
			LeaseToken: claimed.LeaseToken,
			Chronicle:  invalidChronicle,
			FinalState: completionFinalStateForTest(ids.matchID),
		}); err == nil {
			t.Fatal("expected invalid Chronicle completion to fail")
		}
		assertPhase97Job(t, ctx, pool, ids.jobID, "running", 1, "worker:go:invalid", "lease:go:invalid")
	})

	t.Run("rejects a lease for a different Match", func(t *testing.T) {
		prefixA := "phase99-wrong-job-a"
		prefixB := "phase99-wrong-job-b"
		cleanupPhase97Rows(t, ctx, pool, prefixA)
		cleanupPhase97Rows(t, ctx, pool, prefixB)
		defer cleanupPhase97Rows(t, ctx, pool, prefixA)
		defer cleanupPhase97Rows(t, ctx, pool, prefixB)
		idsA := seedPhase97MatchJob(t, ctx, pool, prefixA, 3, "queued", 0, nil)
		idsB := seedPhase97MatchJob(t, ctx, pool, prefixB, 3, "queued", 0, nil)
		lifecycle := newTestMatchJobLifecycle(pool, time.Date(2026, 5, 16, 12, 0, 0, 0, time.UTC), "lease:go:wrong-job")
		claimed, err := lifecycle.claimNextMatchJob(ctx, claimMatchJobInput{WorkerID: "worker:go:wrong-job"})
		if err != nil {
			t.Fatal(err)
		}
		if claimed.JobID != idsA.jobID {
			t.Fatalf("expected first seeded job to be claimed, got %s", claimed.JobID)
		}
		service := newMatchCompletionService(pool)
		service.allowLegacyTestCompletion = true
		if _, err := service.completeMatch(ctx, completeMatchInput{
			JobID:      claimed.JobID,
			LeaseToken: claimed.LeaseToken,
			Chronicle:  completionChronicleForTest(idsB.matchID),
			FinalState: completionFinalStateForTest(idsB.matchID),
		}); err == nil {
			t.Fatal("expected wrong-job lease completion to fail")
		}
		assertPhase97MatchStatus(t, ctx, pool, idsB.matchID, "pending")
	})

	t.Run("rejects outcome drift between final state and Chronicle", func(t *testing.T) {
		prefix := "phase99-outcome-drift"
		cleanupPhase97Rows(t, ctx, pool, prefix)
		defer cleanupPhase97Rows(t, ctx, pool, prefix)
		ids := seedPhase97MatchJob(t, ctx, pool, prefix, 3, "queued", 0, nil)
		lifecycle := newTestMatchJobLifecycle(pool, time.Date(2026, 5, 16, 12, 0, 0, 0, time.UTC), "lease:go:outcome-drift")
		claimed, err := lifecycle.claimNextMatchJob(ctx, claimMatchJobInput{WorkerID: "worker:go:outcome-drift"})
		if err != nil {
			t.Fatal(err)
		}
		chronicle := completionChronicleForTest(ids.matchID)
		snapshots := chronicle["snapshots"].([]any)
		snapshots[1].(map[string]any)["outcome"] = map[string]any{"type": "WIN", "winnerPlayerId": "player:top:" + strings.TrimPrefix(ids.matchID, "match:")}
		service := newMatchCompletionService(pool)
		service.allowLegacyTestCompletion = true
		if _, err := service.completeMatch(ctx, completeMatchInput{
			JobID:      claimed.JobID,
			LeaseToken: claimed.LeaseToken,
			Chronicle:  chronicle,
			FinalState: completionFinalStateForTest(ids.matchID),
		}); err == nil {
			t.Fatal("expected outcome drift to fail")
		}
		assertPhase97Job(t, ctx, pool, ids.jobID, "running", 1, "worker:go:outcome-drift", "lease:go:outcome-drift")
	})
}

func TestMatchCompletionSemanticDatabase(t *testing.T) {
	databaseURL := os.Getenv("COWARDS_GO_BACKEND_TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("set COWARDS_GO_BACKEND_TEST_DATABASE_URL for semantic completion PostgreSQL proof")
	}
	ctx := context.Background()
	pool := semanticCandidateIsolatedPool(t, ctx, databaseURL)
	now := time.Date(2026, 7, 13, 16, 0, 0, 0, time.UTC)
	fixture := seedSemanticCandidateAuthority(t, ctx, pool, now)
	service := newMatchCompletionService(pool)
	service.loadAuthority = func() (*verifiedRuntimeEvidenceAuthority, error) { return fixture.authority, nil }
	service.now = func() time.Time { return now }

	t.Run("early invalidity leaves canonical rows exact", func(t *testing.T) {
		candidate := fixture.seedMatch(t, ctx, pool, "early")
		before := semanticCompletionSnapshot(t, ctx, pool)
		tampered := *candidate.evidence
		tampered.FinalState = semanticCloneMap(candidate.evidence.FinalState)
		tampered.FinalState["matchId"] = "match:tampered"
		if _, err := service.completeMatch(ctx, completeMatchInput{
			JobID: candidate.jobID, LeaseToken: candidate.leaseToken, Chronicle: candidate.evidence.Chronicle,
			FinalState: candidate.evidence.FinalState, Integrity: fixture.identity, CandidateEvidence: &tampered,
		}); err == nil {
			t.Fatal("semantically mutated candidate reached completion")
		}
		after := semanticCompletionSnapshot(t, ctx, pool)
		if !jsonValuesEqual(before, after) {
			t.Fatalf("early semantic failure mutated canonical rows: before=%s after=%s", before, after)
		}
	})

	t.Run("post Chronicle insert failure rolls back exact rows", func(t *testing.T) {
		candidate := fixture.seedMatch(t, ctx, pool, "rollback")
		before := semanticCompletionSnapshot(t, ctx, pool)
		if _, err := pool.Exec(ctx, fmt.Sprintf(`
			create function %s() returns trigger language plpgsql as $$
			begin
			  if new.id = %s and new.status = 'complete' then
			    raise exception 'forced semantic completion rollback';
			  end if;
			  return new;
			end $$;
			create trigger %s before update on matches for each row execute function %s()
		`, pgx.Identifier{"reject_semantic_completion"}.Sanitize(), semanticSQLLiteral(candidate.matchID), pgx.Identifier{"reject_semantic_completion"}.Sanitize(), pgx.Identifier{"reject_semantic_completion"}.Sanitize())); err != nil {
			t.Fatal(err)
		}
		if _, err := service.completeMatch(ctx, candidate.input(fixture.identity)); err == nil {
			t.Fatal("forced post-insert failure unexpectedly committed")
		}
		after := semanticCompletionSnapshot(t, ctx, pool)
		if !jsonValuesEqual(before, after) {
			t.Fatalf("post-insert failure escaped transaction: before=%s after=%s", before, after)
		}
		if _, err := pool.Exec(ctx, "drop trigger reject_semantic_completion on matches; drop function reject_semantic_completion()"); err != nil {
			t.Fatal(err)
		}
	})

	t.Run("exact candidate stores one locked Chronicle and is idempotent", func(t *testing.T) {
		candidate := fixture.seedMatch(t, ctx, pool, "success")
		result, err := service.completeMatch(ctx, candidate.input(fixture.identity))
		if err != nil {
			t.Fatal(err)
		}
		if result.Status != "complete" || result.MatchID != candidate.matchID || result.ChronicleID == "" {
			t.Fatalf("unexpected candidate completion result: %+v", result)
		}
		first := semanticCompletionSnapshot(t, ctx, pool)
		duplicate, err := service.completeMatch(ctx, candidate.input(fixture.identity))
		if err != nil {
			t.Fatal(err)
		}
		second := semanticCompletionSnapshot(t, ctx, pool)
		if duplicate.ChronicleID != result.ChronicleID || !jsonValuesEqual(first, second) {
			t.Fatalf("candidate completion was not exact/idempotent: first=%s second=%s duplicate=%+v", first, second, duplicate)
		}
		var tupleID, engine, publicationID string
		if err := pool.QueryRow(ctx, `select compatibility_tuple_id,compatibility_engine_version,authority_publication_id from chronicles where match_id=$1`, candidate.matchID).Scan(&tupleID, &engine, &publicationID); err != nil {
			t.Fatal(err)
		}
		if tupleID != inactiveCandidateTupleID || engine != inactiveCandidateTuple.Engine || publicationID != fixture.identity.PublicationID {
			t.Fatalf("persisted Chronicle lost locked candidate identity: %q %q %q", tupleID, engine, publicationID)
		}
	})

	t.Run("late installed receipt drift leaves gameplay exact", func(t *testing.T) {
		candidate := fixture.seedMatch(t, ctx, pool, "receipt-drift")
		before := semanticCompletionSnapshot(t, ctx, pool)
		receipt := semanticCandidateReceipt(fixture.identity)
		if _, err := pool.Exec(ctx, `insert into runtime_evidence_authority_publication_events
			(id,publication_id,event_kind,attempt_id,envelope_sha256,reason_code,receipt,occurred_at)
			values ($1,$2,'uncertain','attempt:late',$3,'RENAME_UNCONFIRMED',$4,$5)`,
			"candidate:event:uncertain", fixture.identity.PublicationID, fixture.identity.EnvelopeSHA256, receipt, now.Add(time.Minute)); err != nil {
			t.Fatal(err)
		}
		if _, err := service.completeMatch(ctx, candidate.input(fixture.identity)); err == nil {
			t.Fatal("late installed receipt drift reached completion")
		}
		after := semanticCompletionSnapshot(t, ctx, pool)
		if !jsonValuesEqual(before, after) {
			t.Fatalf("late receipt drift mutated gameplay rows: before=%s after=%s", before, after)
		}
	})
}

type semanticCandidateAuthorityFixture struct {
	authority *verifiedRuntimeEvidenceAuthority
	identity  *claimedMatchIntegrityIdentity
	request   runtimeServiceRequest
	nextIndex int
}

type semanticCandidateMatchFixture struct {
	matchID    string
	jobID      string
	leaseToken string
	evidence   *candidateRuntimeEvidence
}

func (candidate semanticCandidateMatchFixture) input(identity *claimedMatchIntegrityIdentity) completeMatchInput {
	return completeMatchInput{
		JobID: candidate.jobID, LeaseToken: candidate.leaseToken,
		Chronicle: candidate.evidence.Chronicle, FinalState: candidate.evidence.FinalState,
		Integrity: identity, CandidateEvidence: candidate.evidence,
	}
}

func semanticCandidateIsolatedPool(t *testing.T, ctx context.Context, databaseURL string) *pgxpool.Pool {
	t.Helper()
	admin, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(admin.Close)
	schema := "semantic_completion_" + strings.ReplaceAll(randomID(), "-", "")
	if _, err := admin.Exec(ctx, "create schema "+pgx.Identifier{schema}.Sanitize()); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _, _ = admin.Exec(ctx, "drop schema "+pgx.Identifier{schema}.Sanitize()+" cascade") })
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		t.Fatal(err)
	}
	config.AfterConnect = func(ctx context.Context, connection *pgx.Conn) error {
		_, err := connection.Exec(ctx, "set search_path to "+pgx.Identifier{schema}.Sanitize())
		return err
	}
	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(pool.Close)
	files, err := filepath.Glob("../../packages/persistence/migrations/*.sql")
	if err != nil {
		t.Fatal(err)
	}
	sort.Strings(files)
	for _, file := range files {
		migration, err := os.ReadFile(file)
		if err != nil {
			t.Fatal(err)
		}
		if _, err := pool.Exec(ctx, string(migration)); err != nil {
			t.Fatalf("migration %s: %v", filepath.Base(file), err)
		}
	}
	return pool
}

func seedSemanticCandidateAuthority(t *testing.T, ctx context.Context, pool *pgxpool.Pool, now time.Time) *semanticCandidateAuthorityFixture {
	t.Helper()
	tuple := registeredCompatibilityTuple{TupleID: inactiveCandidateTupleID, Tuple: inactiveCandidateTuple}
	authority := &verifiedRuntimeEvidenceAuthority{
		AuthorityBundleHash: "sha256:" + strings.Repeat("b", 64), EnvelopeSHA256: "sha256:" + strings.Repeat("c", 64),
		RegistryGeneration: "1", SemanticTupleManifestHash: tuple.TupleID, CompatibilityTuple: tuple,
		TrustDomain: runtimeEvidenceAuthorityProductionTrustDomain,
		Payload: runtimeEvidenceAuthorityPayload{
			RegistryGeneration: "1", IssuedAt: now.Add(-time.Hour).Format(canonicalJSONInstantLayout),
			ValidFrom: now.Add(-time.Hour).Format(canonicalJSONInstantLayout), ValidUntil: now.Add(time.Hour).Format(canonicalJSONInstantLayout),
			SemanticTupleManifestHash: tuple.TupleID,
		},
	}
	baseRequest := validRuntimeServiceRequestForTest()
	baseRequest.Match.BottomPlayerID = "candidate:player:bottom"
	baseRequest.Match.TopPlayerID = "candidate:player:top"
	baseRequest.Match.BottomStrategyRevisionID = "candidate:revision:bottom"
	baseRequest.Match.TopStrategyRevisionID = "candidate:revision:top"
	baseRequest.Strategies.Bottom.ID = baseRequest.Match.BottomStrategyRevisionID
	baseRequest.Strategies.Top.ID = baseRequest.Match.TopStrategyRevisionID
	baseRequest.Match.ArenaVariant["id"] = "candidate:arena"
	baseRequest.Match.ArenaVariant["name"] = "Candidate isolated arena"

	if _, err := pool.Exec(ctx, `insert into users(id,display_name) values ('candidate:user','Candidate')`); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, `insert into strategies(id,owner_user_id,name) values ('candidate:strategy','candidate:user','Candidate')`); err != nil {
		t.Fatal(err)
	}
	for _, revisionID := range []string{baseRequest.Match.BottomStrategyRevisionID, baseRequest.Match.TopStrategyRevisionID} {
		if _, err := pool.Exec(ctx, `insert into strategy_revisions
			(id,strategy_id,source,source_hash,source_bytes,runtime,engine_compatibility,validation,locked_at)
			values ($1,'candidate:strategy','return','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',6,'{}','{}','{"valid":true}',$2)`, revisionID, now); err != nil {
			t.Fatal(err)
		}
	}
	if _, err := pool.Exec(ctx, `insert into arena_variants(id,name,version,config) values ($1,'Candidate isolated arena','0.1.0',$2)`, baseRequest.Match.ArenaVariant["id"], baseRequest.Match.ArenaVariant); err != nil {
		t.Fatal(err)
	}

	entrants := make([]goEntrantExecutionEvidence, 0, 2)
	attestationIDs := make([]string, 0, 2)
	certificateIDs := make([]string, 0, 2)
	sourceHashes := map[string]string{}
	for index, revisionID := range []string{baseRequest.Match.BottomStrategyRevisionID, baseRequest.Match.TopStrategyRevisionID} {
		lane := goExecutableLaneIdentity{
			ProviderID: "candidate:provider", LanguageID: []string{"typescript", "python"}[index], RuntimeID: "candidate:runtime", RuntimeVersion: "1",
			ToolchainID: "candidate:toolchain", ToolchainVersion: "1", AdapterID: "candidate:adapter", AdapterVersion: "1",
			PolicyID: "candidate:policy", PolicyVersion: "1", CorpusID: "candidate:corpus", CorpusVersion: "1",
			ArtifactID: fmt.Sprintf("candidate:artifact:%d", index), ArtifactSHA256: fmt.Sprintf("%064x", index+10),
			ImplementationID: "candidate:implementation", BuildID: fmt.Sprintf("candidate:build:%d", index),
			SemanticTupleID: tuple.TupleID, SemanticTuple: tuple.Tuple,
		}
		laneHash := hashCreationLaneIdentity(lane)
		attestationID := fmt.Sprintf("candidate:attestation:%d", index)
		certificateID := fmt.Sprintf("candidate:certificate:%d", index)
		attestationHash := fmt.Sprintf("%064x", index+20)
		certificateHash := fmt.Sprintf("%064x", index+30)
		graphHash := fmt.Sprintf("%064x", index+40)
		attestationIDs = append(attestationIDs, attestationID)
		certificateIDs = append(certificateIDs, certificateID)
		sourceHashes[attestationID] = "sha256:" + attestationHash
		sourceHashes[certificateID] = "sha256:" + certificateHash
		if _, err := pool.Exec(ctx, `insert into runtime_evidence_verified_attestations
			(id,attestation_sha256,verification_status,certificate_kind,producer_id,producer_key_id,trust_domain,schema_version,command_id,command_digest,corpus_id,corpus_hash,policy_id,policy_hash,runtime_id,runtime_version,toolchain_id,toolchain_version,adapter_id,adapter_version,artifact_id,artifact_hash,lane_identity_hash,semantic_tuple_id,result_manifest_hash,result_graph_hash,original_evidence_hash,derived_certificate_version,derived_certificate_record_hash,registry_generation,lane_identity,issued_at,valid_until)
			values ($1,$2,'passed','containment','candidate:producer','candidate:key','production','candidate:schema','candidate:command',$3,'candidate:corpus',$3,'candidate:policy',$3,'candidate:runtime','1','candidate:toolchain','1','candidate:adapter','1',$4,$5,$6,$7,$3,$8,$3,'candidate:certificate-v1',$9,'1',$10,$11,$12)`,
			attestationID, attestationHash, strings.Repeat("d", 64), lane.ArtifactID, lane.ArtifactSHA256, laneHash, tuple.TupleID, graphHash, certificateHash, lane, now.Add(-time.Hour), now.Add(time.Hour)); err != nil {
			t.Fatal(err)
		}
		if _, err := pool.Exec(ctx, `insert into runtime_evidence_certificates
			(id,certificate_kind,certificate_version,certificate_record_hash,certificate_status,verified_attestation_id,verified_attestation_status,producer_id,schema_version,command_id,command_digest,corpus_id,corpus_hash,policy_id,policy_hash,toolchain_id,toolchain_version,artifact_id,artifact_hash,lane_identity_hash,lane_identity,result_graph_hash,registry_generation,issued_at,fresh_until)
			values ($1,'containment','candidate:certificate-v1',$2,'passed',$3,'passed','candidate:producer','candidate:schema','candidate:command',$4,'candidate:corpus',$4,'candidate:policy',$4,'candidate:toolchain','1',$5,$6,$7,$8,$9,'1',$10,$11)`,
			certificateID, certificateHash, attestationID, strings.Repeat("d", 64), lane.ArtifactID, lane.ArtifactSHA256, laneHash, lane, graphHash, now.Add(-time.Hour), now.Add(time.Hour)); err != nil {
			t.Fatal(err)
		}
		certificate := runtimeEvidenceAuthorityCertificate{
			Kind: "containment", CertificateID: certificateID, CertificateVersion: "candidate:certificate-v1",
			CertificateRecordHash: "sha256:" + certificateHash, LaneIdentityHash: "sha256:" + laneHash,
		}
		authority.Payload.Certificates = append(authority.Payload.Certificates, certificate)
		entrants = append(entrants, goEntrantExecutionEvidence{
			EntrantKey: fmt.Sprintf("candidate:entrant:%d", index), StrategyRevisionID: revisionID, LaneIdentity: lane,
			ContainmentCertificateRef: creationCertificateSnapshot(runtimeEvidenceCertificateReferenceFor(certificate, "1")),
			SchedulingDecision:        goSchedulingDecision{Status: executableLaneEvidenceExhibitionOnly, ReasonCode: "CONFORMANCE_MISSING", EvaluatedAt: now.Format(canonicalJSONInstantLayout), FreshUntil: now.Add(time.Hour).Format(canonicalJSONInstantLayout), RegistryGeneration: "1"},
		})
	}
	integrity, err := createGoMatchSetIntegrityIdentity(authority, entrants)
	if err != nil {
		t.Fatal(err)
	}
	pair, err := integrity.pair(entrants[0].EntrantKey, entrants[1].EntrantKey, entrants[0].StrategyRevisionID, entrants[1].StrategyRevisionID)
	if err != nil {
		t.Fatal(err)
	}
	sort.Strings(attestationIDs)
	sort.Strings(certificateIDs)
	sourceSet := map[string]any{"attestationIds": attestationIDs, "certificateIds": certificateIDs, "revocationIds": []string{}, "supersessionIds": []string{}, "laneControlIds": []string{}}
	identity := &claimedMatchIntegrityIdentity{
		MatchSetID: "candidate:match-set", CompatibilityTupleID: tuple.TupleID, CompatibilityTuple: tuple.Tuple,
		AuthorityBundleHash: authority.AuthorityBundleHash, RegistryGeneration: "1", EvidenceSetHash: integrity.EvidenceSetHash, PairHash: pair.PairHash,
		PublicationID: "candidate:publication", InstallReceiptID: "candidate:event:installed", PayloadSHA256: authority.AuthorityBundleHash,
		EnvelopeSHA256: authority.EnvelopeSHA256, SourceManifestHash: "sha256:" + strings.Repeat("e", 64), SourceSet: sourceSet,
		Bottom: entrants[0], Top: entrants[1],
	}
	receipt := semanticCandidateReceipt(identity)
	if _, err := pool.Exec(ctx, `insert into runtime_evidence_authority_publications
		(id,generation,semantic_tuple_manifest_hash,source_manifest_hash,payload_sha256,envelope_sha256,signer_key_id,trust_domain,issued_at,valid_from,valid_until,payload_bytes,envelope_bytes,attestation_ids,certificate_ids,revocation_ids,supersession_ids,lane_control_ids)
		values ($1,1,$2,$3,$4,$5,'candidate:key',$6,$7,$7,$8,'candidate-payload','candidate-envelope',$9,$10,'[]','[]','[]')`,
		identity.PublicationID, identity.CompatibilityTupleID, identity.SourceManifestHash, identity.PayloadSHA256, identity.EnvelopeSHA256, runtimeEvidenceAuthorityProductionTrustDomain, now.Add(-time.Hour), now.Add(time.Hour), attestationIDs, certificateIDs); err != nil {
		t.Fatal(err)
	}
	for _, sourceID := range attestationIDs {
		if _, err := pool.Exec(ctx, `insert into runtime_evidence_authority_publication_sources(publication_id,source_type,source_id,source_record_hash,attestation_id) values ($1,'attestation',$2,$3,$2)`, identity.PublicationID, sourceID, sourceHashes[sourceID]); err != nil {
			t.Fatal(err)
		}
	}
	for _, sourceID := range certificateIDs {
		if _, err := pool.Exec(ctx, `insert into runtime_evidence_authority_publication_sources(publication_id,source_type,source_id,source_record_hash,certificate_id) values ($1,'certificate',$2,$3,$2)`, identity.PublicationID, sourceID, sourceHashes[sourceID]); err != nil {
			t.Fatal(err)
		}
	}
	if _, err := pool.Exec(ctx, `insert into runtime_evidence_authority_publication_events
		(id,publication_id,event_kind,attempt_id,envelope_sha256,receipt,occurred_at)
		values ($1,$2,'installed','attempt:installed',$3,$4,$5)`, identity.InstallReceiptID, identity.PublicationID, identity.EnvelopeSHA256, receipt, now); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, `insert into match_sets
		(id,status,matrix,compatibility_tuple_id,compatibility_rules_version,compatibility_engine_version,compatibility_runtime_abi_version,compatibility_chronicle_version,compatibility_arena_catalog_version,compatibility_set_policy_version,authority_bundle_hash,authority_registry_generation,execution_evidence_set,execution_evidence_set_hash,authority_publication_id,authority_install_receipt_id,authority_payload_sha256,authority_envelope_sha256,authority_source_manifest_hash,authority_source_set)
		values ($1,'running','{}',$2,$3,$4,$5,$6,$7,$8,$9,'1',$10,$11,$12,$13,$14,$15,$16,$17)`,
		identity.MatchSetID, identity.CompatibilityTupleID, tuple.Tuple.Rules, tuple.Tuple.Engine, tuple.Tuple.RuntimeABI, tuple.Tuple.Chronicle, tuple.Tuple.ArenaCatalog, tuple.Tuple.SetPolicy,
		strings.TrimPrefix(identity.AuthorityBundleHash, "sha256:"), entrants, identity.EvidenceSetHash, identity.PublicationID, identity.InstallReceiptID, identity.PayloadSHA256, identity.EnvelopeSHA256, identity.SourceManifestHash, identity.SourceSet); err != nil {
		t.Fatal(err)
	}
	for _, entrant := range entrants {
		if _, err := pool.Exec(ctx, `insert into match_set_execution_entrants
			(match_set_id,entrant_key,strategy_revision_id,lane_identity,lane_identity_hash,containment_certificate_kind,containment_certificate_id,containment_certificate_version,containment_certificate_hash,scheduling_status,scheduling_reason_code,scheduling_evaluated_at,scheduling_fresh_until,authority_bundle_hash,authority_registry_generation,execution_snapshot)
			values ($1,$2,$3,$4,$5,'containment',$6,$7,$8,'exhibition_only','CONFORMANCE_MISSING',$9,$10,$11,'1',$12)`,
			identity.MatchSetID, entrant.EntrantKey, entrant.StrategyRevisionID, entrant.LaneIdentity, hashCreationLaneIdentity(entrant.LaneIdentity),
			entrant.ContainmentCertificateRef.CertificateID, entrant.ContainmentCertificateRef.CertificateVersion, entrant.ContainmentCertificateRef.CertificateRecordHash,
			now, now.Add(time.Hour), strings.TrimPrefix(identity.AuthorityBundleHash, "sha256:"), entrant); err != nil {
			t.Fatal(err)
		}
	}
	return &semanticCandidateAuthorityFixture{authority: authority, identity: identity, request: baseRequest}
}

func semanticCandidateReceipt(identity *claimedMatchIntegrityIdentity) map[string]any {
	return map[string]any{
		"schemaVersion": "v1.37-runtime-evidence-authority-install-receipt-v1", "generation": identity.RegistryGeneration,
		"payloadSha256": identity.PayloadSHA256, "envelopeSha256": identity.EnvelopeSHA256,
		"sourceManifestHash": identity.SourceManifestHash, "sourceIds": identity.SourceSet,
	}
}

func (fixture *semanticCandidateAuthorityFixture) seedMatch(t *testing.T, ctx context.Context, pool *pgxpool.Pool, suffix string) semanticCandidateMatchFixture {
	t.Helper()
	request := semanticCloneRuntimeServiceRequest(fixture.request)
	request.RequestID = "candidate:request:" + suffix
	request.Match.MatchID = "candidate:match:" + suffix
	request.Match.Seed = "candidate:seed:" + suffix
	response := candidateRuntimeResponseForTest(t, request)
	serialized, err := json.Marshal(response)
	if err != nil {
		t.Fatal(err)
	}
	decoded, failure := decodeRuntimeServiceResponseBytes(request, serialized)
	if failure != nil || decoded == nil || decoded.CandidateEvidence == nil {
		t.Fatalf("candidate response setup failed: response=%+v failure=%+v", decoded, failure)
	}
	matchID := request.Match.MatchID
	jobID := "candidate:job:" + suffix
	leaseToken := "candidate:lease:" + suffix
	if _, err := pool.Exec(ctx, `insert into matches
		(id,bottom_strategy_revision_id,top_strategy_revision_id,arena_variant_id,seed,status,bottom_player_id,top_player_id,integrity_match_set_id,bottom_execution_entrant_key,top_execution_entrant_key,bottom_execution_evidence,top_execution_evidence,execution_evidence_pair_hash)
		values ($1,$2,$3,$4,$5,'running',$6,$7,$8,$9,$10,$11,$12,$13)`,
		matchID, request.Match.BottomStrategyRevisionID, request.Match.TopStrategyRevisionID, request.Match.ArenaVariant["id"], request.Match.Seed,
		request.Match.BottomPlayerID, request.Match.TopPlayerID, fixture.identity.MatchSetID, fixture.identity.Bottom.EntrantKey, fixture.identity.Top.EntrantKey,
		fixture.identity.Bottom, fixture.identity.Top, fixture.identity.PairHash); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, `insert into match_set_matches(match_set_id,match_id,matrix_index) values ($1,$2,$3)`, fixture.identity.MatchSetID, matchID, fixture.nextIndex); err != nil {
		t.Fatal(err)
	}
	fixture.nextIndex++
	if _, err := pool.Exec(ctx, `insert into match_jobs
		(id,match_id,status,attempts,max_attempts,worker_id,lease_token,lease_expires_at,integrity_match_set_id,bottom_execution_entrant_key,top_execution_entrant_key,bottom_execution_evidence,top_execution_evidence,execution_evidence_pair_hash)
		values ($1,$2,'running',1,3,'candidate:worker',$3,now()+interval '5 minutes',$4,$5,$6,$7,$8,$9)`,
		jobID, matchID, leaseToken, fixture.identity.MatchSetID, fixture.identity.Bottom.EntrantKey, fixture.identity.Top.EntrantKey,
		fixture.identity.Bottom, fixture.identity.Top, fixture.identity.PairHash); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, `insert into match_job_attempts(id,job_id,attempt_number,worker_id,status) values ($1,$2,1,'candidate:worker','running')`, "candidate:attempt:"+suffix, jobID); err != nil {
		t.Fatal(err)
	}
	return semanticCandidateMatchFixture{matchID: matchID, jobID: jobID, leaseToken: leaseToken, evidence: decoded.CandidateEvidence}
}

func semanticCompletionSnapshot(t *testing.T, ctx context.Context, pool *pgxpool.Pool) map[string]any {
	t.Helper()
	var serialized []byte
	if err := pool.QueryRow(ctx, `select jsonb_build_object(
		'matches',coalesce((select jsonb_agg(to_jsonb(row) order by row.id) from matches row),'[]'::jsonb),
		'jobs',coalesce((select jsonb_agg(to_jsonb(row) order by row.id) from match_jobs row),'[]'::jsonb),
		'attempts',coalesce((select jsonb_agg(to_jsonb(row) order by row.id) from match_job_attempts row),'[]'::jsonb),
		'chronicles',coalesce((select jsonb_agg(to_jsonb(row) order by row.id) from chronicles row),'[]'::jsonb),
		'matchSets',coalesce((select jsonb_agg(to_jsonb(row) order by row.id) from match_sets row),'[]'::jsonb),
		'matchSetMatches',coalesce((select jsonb_agg(to_jsonb(row) order by row.match_set_id,row.match_id) from match_set_matches row),'[]'::jsonb),
		'resultFlags',coalesce((select jsonb_agg(to_jsonb(row) order by row.id) from result_flags row),'[]'::jsonb),
		'standings',coalesce((select jsonb_agg(to_jsonb(row) order by row.id) from trial_ladder_entries row),'[]'::jsonb)
	)`).Scan(&serialized); err != nil {
		t.Fatal(err)
	}
	var snapshot map[string]any
	if err := decodeStrictJSONUseNumber(serialized, &snapshot); err != nil {
		t.Fatal(err)
	}
	return snapshot
}

func semanticSQLLiteral(value string) string {
	return "'" + strings.ReplaceAll(value, "'", "''") + "'"
}

func completionFinalStateForTest(matchID string) map[string]any {
	suffix := strings.TrimPrefix(matchID, "match:")
	bottomPlayerID := "player:bottom:" + suffix
	topPlayerID := "player:top:" + suffix
	return map[string]any{
		"matchId":         matchID,
		"seed":            "seed:" + matchID,
		"phaseNumber":     2,
		"roundNumber":     3,
		"activationCount": 4,
		"players": []any{
			map[string]any{"id": bottomPlayerID, "side": "bottom", "strategyRevisionId": "strategy-revision:" + suffix, "strategyMemory": map[string]any{}},
			map[string]any{"id": topPlayerID, "side": "top", "strategyRevisionId": "strategy-revision:" + suffix, "strategyMemory": map[string]any{}},
		},
		"soldiers": []any{
			map[string]any{"id": "soldier:bottom:" + suffix, "ownerPlayerId": bottomPlayerID, "status": "ACTIVE"},
			map[string]any{"id": "soldier:top:" + suffix, "ownerPlayerId": topPlayerID, "status": "FALLEN"},
		},
		"outcome": map[string]any{"type": "WIN", "winnerPlayerId": bottomPlayerID},
	}
}

func completionChronicleForTest(matchID string) map[string]any {
	suffix := strings.TrimPrefix(matchID, "match:")
	bottomPlayerID := "player:bottom:" + suffix
	topPlayerID := "player:top:" + suffix
	board := map[string]any{
		"bounds": map[string]any{"minX": 0, "maxX": 4, "minY": 0, "maxY": 4},
		"soldiers": []any{
			map[string]any{"id": "soldier:bottom:" + suffix, "ownerPlayerId": bottomPlayerID, "status": "ACTIVE", "position": map[string]any{"x": 1, "y": 3}},
			map[string]any{"id": "soldier:top:" + suffix, "ownerPlayerId": topPlayerID, "status": "FALLEN", "position": map[string]any{"x": 3, "y": 1}},
		},
		"terrainStones": []any{
			map[string]any{"x": 2, "y": 2},
		},
	}
	return map[string]any{
		"schemaVersion": "chronicle-v1.4",
		"reproducibility": map[string]any{
			"matchId":             matchID,
			"seed":                "seed:" + matchID,
			"arenaVariantId":      "arena:" + suffix,
			"arenaVariantVersion": "arena-v1",
			"strategyRevisionIds": []any{"strategy-revision:" + suffix, "strategy-revision:" + suffix},
			"versions":            map[string]any{"spec": "cowards-rules-v1.4", "engine": "0.1.4", "runtimeJs": "0.1.0", "chronicle": "chronicle-v1.4", "strategyRevision": "0.1.0", "arenaVariant": "arena-v1"},
		},
		"events": []any{
			map[string]any{"type": "MATCH_STARTED", "sequence": 0, "context": map[string]any{}, "privacy": "public", "payload": map[string]any{"matchId": matchID}},
			map[string]any{"type": "STRATEGY_EVALUATED", "sequence": 1, "context": map[string]any{"actingPlayerId": bottomPlayerID}, "privacy": "private", "privateRef": "private:event:1", "payload": map[string]any{"playerId": bottomPlayerID}},
			map[string]any{"type": "STRATEGY_EVALUATED", "sequence": 2, "context": map[string]any{"actingPlayerId": topPlayerID}, "privacy": "private", "privateRef": "private:event:2", "payload": map[string]any{"playerId": topPlayerID}},
			map[string]any{"type": "MATCH_ENDED", "sequence": 3, "context": map[string]any{}, "privacy": "public", "payload": map[string]any{"type": "WIN", "winnerPlayerId": bottomPlayerID}},
		},
		"snapshots": []any{
			map[string]any{"kind": "MATCH_START", "sequence": 0, "context": map[string]any{}, "board": board},
			map[string]any{"kind": "TERMINAL", "sequence": 3, "context": map[string]any{}, "outcome": map[string]any{"type": "WIN", "winnerPlayerId": bottomPlayerID}, "board": board},
		},
	}
}

func assertChronicleExists(t *testing.T, ctx context.Context, pool *pgxpool.Pool, matchID string) {
	t.Helper()
	var count int
	if err := pool.QueryRow(ctx, "select count(*) from chronicles where match_id = $1", matchID).Scan(&count); err != nil {
		t.Fatal(err)
	}
	if count != 1 {
		t.Fatalf("expected one Chronicle, got %d", count)
	}
}

func decodeJSONMapForCompletion(t *testing.T, bytes []byte) map[string]any {
	t.Helper()
	var value map[string]any
	if err := json.Unmarshal(bytes, &value); err != nil {
		t.Fatal(err)
	}
	return value
}
