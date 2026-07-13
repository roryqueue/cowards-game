package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"reflect"
	"sort"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

func TestCreateExhibitionMatchSetBeginsBeforeIntegritySnapshot(t *testing.T) {
	order := []string{}
	server := &LiveServer{now: func() time.Time {
		return time.Date(2026, 7, 13, 12, 0, 0, 0, time.UTC)
	}}
	dependencies := exhibitionCreationDependencies{
		loadEntrants: func(context.Context, pgx.Tx, string, []string, time.Time) ([]map[string]any, error) {
			order = append(order, "entrants")
			return nil, errors.New("must not load without a transaction")
		},
		loadAuthority: func() (*verifiedRuntimeEvidenceAuthority, error) {
			order = append(order, "authority")
			return &verifiedRuntimeEvidenceAuthority{}, nil
		},
		resolveEvidence: func(context.Context, pgx.Tx, *verifiedRuntimeEvidenceAuthority, []map[string]any, bool, time.Time) (*goMatchSetIntegrityIdentity, error) {
			order = append(order, "evidence")
			return nil, errors.New("provider proof is not executable evidence")
		},
		begin: func(context.Context) (pgx.Tx, error) {
			order = append(order, "begin")
			return nil, errors.New("database unavailable")
		},
	}

	_, err := server.createExhibitionMatchSetWithDependencies(
		context.Background(),
		"user:owner",
		"smoke-exhibition-v1",
		[]string{"revision:bottom", "revision:top"},
		false,
		dependencies,
	)
	if err == nil || !strings.Contains(err.Error(), "database") {
		t.Fatalf("expected transaction failure, got %v", err)
	}
	if !reflect.DeepEqual(order, []string{"begin"}) {
		t.Fatalf("creation did work before opening its transaction: %v", order)
	}
}

func TestCreateExhibitionMatchSetIntegrityPurposeFloors(t *testing.T) {
	tests := []struct {
		name    string
		counted bool
		status  executableLaneEvidenceStatus
		allowed bool
	}{
		{name: "counted requires conformance", counted: true, status: executableLaneEvidenceCounted, allowed: true},
		{name: "counted rejects containment only", counted: true, status: executableLaneEvidenceExhibitionOnly, allowed: false},
		{name: "exhibition accepts containment only", counted: false, status: executableLaneEvidenceExhibitionOnly, allowed: true},
		{name: "exhibition accepts fully proved lane", counted: false, status: executableLaneEvidenceCounted, allowed: true},
		{name: "neither purpose accepts disabled", counted: false, status: executableLaneEvidenceDisabled, allowed: false},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := creationPurposeAllowsStatus(test.counted, test.status); got != test.allowed {
				t.Fatalf("purpose floor returned %v, want %v", got, test.allowed)
			}
		})
	}
}

func TestCreationLaneMatchesEveryExecutableIdentityComponent(t *testing.T) {
	tuple := registeredCompatibilityTuple{TupleID: "sha256:" + strings.Repeat("a", 64), Tuple: canonicalCompatibilityTuple{Rules: "rules-v1", Engine: "engine-v1", RuntimeABI: "abi-v1", Chronicle: "chronicle-v1", ArenaCatalog: "arenas-v1", SetPolicy: "set-v1"}}
	lane := goExecutableLaneIdentity{ProviderID: "provider", LanguageID: "typescript", RuntimeID: "node", RuntimeVersion: "26", ToolchainID: "typescript", ToolchainVersion: "6", AdapterID: "adapter", AdapterVersion: "1", PolicyID: "policy", PolicyVersion: "1", CorpusID: "corpus", CorpusVersion: "1", ArtifactID: "artifact", ArtifactSHA256: strings.Repeat("b", 64), ImplementationID: "runtime-service", BuildID: "build", SemanticTupleID: tuple.TupleID, SemanticTuple: tuple.Tuple}
	laneBytes, err := json.Marshal(lane)
	if err != nil {
		t.Fatal(err)
	}
	var laneMap map[string]any
	if err := json.Unmarshal(laneBytes, &laneMap); err != nil {
		t.Fatal(err)
	}
	entrant := map[string]any{
		"_creationLaneIdentity": laneMap,
		"_creationRuntime": map[string]any{
			"language":   map[string]any{"id": lane.LanguageID},
			"adapter":    map[string]any{"id": lane.AdapterID, "version": lane.AdapterVersion},
			"abiVersion": lane.SemanticTuple.RuntimeABI,
		},
		"_creationMetadata": map[string]any{
			"providerValidation": map[string]any{"providerId": lane.ProviderID},
			"sourceArtifact":     map[string]any{"hash": lane.ArtifactSHA256},
		},
	}
	if !creationLaneMatchesEntrant(lane, entrant, tuple) {
		t.Fatal("exact configured executable lane was rejected")
	}

	mutations := map[string]func(*goExecutableLaneIdentity){
		"runtime-id":        func(value *goExecutableLaneIdentity) { value.RuntimeID = "other" },
		"runtime-version":   func(value *goExecutableLaneIdentity) { value.RuntimeVersion = "other" },
		"toolchain-id":      func(value *goExecutableLaneIdentity) { value.ToolchainID = "other" },
		"toolchain-version": func(value *goExecutableLaneIdentity) { value.ToolchainVersion = "other" },
		"policy-id":         func(value *goExecutableLaneIdentity) { value.PolicyID = "other" },
		"policy-version":    func(value *goExecutableLaneIdentity) { value.PolicyVersion = "other" },
		"corpus-id":         func(value *goExecutableLaneIdentity) { value.CorpusID = "other" },
		"corpus-version":    func(value *goExecutableLaneIdentity) { value.CorpusVersion = "other" },
		"artifact-id":       func(value *goExecutableLaneIdentity) { value.ArtifactID = "other" },
		"implementation-id": func(value *goExecutableLaneIdentity) { value.ImplementationID = "other" },
		"build-id":          func(value *goExecutableLaneIdentity) { value.BuildID = "other" },
	}
	for name, mutate := range mutations {
		t.Run(name, func(t *testing.T) {
			candidate := lane
			mutate(&candidate)
			if creationLaneMatchesEntrant(candidate, entrant, tuple) {
				t.Fatal("distinct executable lane matched the configured revision lane")
			}
		})
	}
}

func TestCreateExhibitionMatchSetIntegrityPostgresReceiptReconciliationAndPropagation(t *testing.T) {
	databaseURL := os.Getenv("COWARDS_GO_BACKEND_TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("set COWARDS_GO_BACKEND_TEST_DATABASE_URL for creation integrity PostgreSQL proof")
	}
	ctx := context.Background()
	admin, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		t.Fatal(err)
	}
	defer admin.Close()
	schema := "integrity_creation_" + strings.ReplaceAll(randomID(), "-", "")
	if _, err := admin.Exec(ctx, "create schema "+pgx.Identifier{schema}.Sanitize()); err != nil {
		t.Fatal(err)
	}
	defer func() { _, _ = admin.Exec(ctx, "drop schema "+pgx.Identifier{schema}.Sanitize()+" cascade") }()

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
	defer pool.Close()
	files, err := filepath.Glob("../../packages/persistence/migrations/*.sql")
	if err != nil {
		t.Fatal(err)
	}
	sort.Strings(files)
	for _, file := range files {
		sql, err := os.ReadFile(file)
		if err != nil {
			t.Fatal(err)
		}
		if _, err := pool.Exec(ctx, string(sql)); err != nil {
			t.Fatalf("migration %s: %v", filepath.Base(file), err)
		}
	}

	now := time.Date(2026, 7, 13, 12, 0, 0, 0, time.UTC)
	namespace := "creation:" + randomID()
	userID, strategyID := namespace+":user", namespace+":strategy"
	if _, err := pool.Exec(ctx, "insert into users (id, display_name) values ($1,'Owner')", userID); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, "update users set handle='owner' where id=$1", userID); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, "insert into strategies (id, owner_user_id, name) values ($1,$2,'Integrity')", strategyID, userID); err != nil {
		t.Fatal(err)
	}

	tuple := registeredCompatibilityTuple{TupleID: "sha256:" + strings.Repeat("a", 64), Tuple: canonicalCompatibilityTuple{Rules: "rules-v1", Engine: "engine-v1", RuntimeABI: "abi-v1", Chronicle: "chronicle-v1", ArenaCatalog: "arenas-v1", SetPolicy: "set-v1"}}
	entrants := make([]map[string]any, 0, 2)
	evidence := make([]goEntrantExecutionEvidence, 0, 2)
	attestationIDs, certificateIDs := []string{}, []string{}
	for index := 0; index < 2; index++ {
		revisionID := fmt.Sprintf("%s:revision:%d", namespace, index)
		entrantKey := fmt.Sprintf("entrant:%d", index)
		artifactHash := fmt.Sprintf("%064x", index+20)
		lane := goExecutableLaneIdentity{ProviderID: "provider", LanguageID: []string{"typescript", "python"}[index], RuntimeID: "runtime", RuntimeVersion: "1", ToolchainID: "toolchain", ToolchainVersion: "1", AdapterID: "adapter", AdapterVersion: "1", PolicyID: "policy", PolicyVersion: "1", CorpusID: "corpus", CorpusVersion: "1", ArtifactID: fmt.Sprintf("artifact:%d", index), ArtifactSHA256: artifactHash, ImplementationID: "implementation", BuildID: fmt.Sprintf("build:%d", index), SemanticTupleID: tuple.TupleID, SemanticTuple: tuple.Tuple}
		laneHash := hashCreationLaneIdentity(lane)
		attestationID := fmt.Sprintf("%s:attestation:%d", namespace, index)
		certificateID := fmt.Sprintf("%s:certificate:%d", namespace, index)
		attestationHash := fmt.Sprintf("%064x", index+30)
		certificateHash := fmt.Sprintf("%064x", index+40)
		graphHash := fmt.Sprintf("%064x", index+50)
		attestationIDs = append(attestationIDs, attestationID)
		certificateIDs = append(certificateIDs, certificateID)
		if _, err := pool.Exec(ctx, `insert into strategy_revisions
			(id,strategy_id,source,source_hash,source_bytes,runtime,engine_compatibility,validation)
			values ($1,$2,'return',$3,6,'{}','{}','{"valid":true}')`, revisionID, strategyID, artifactHash); err != nil {
			t.Fatal(err)
		}
		if _, err := pool.Exec(ctx, `insert into runtime_evidence_verified_attestations
			(id,attestation_sha256,verification_status,certificate_kind,producer_id,producer_key_id,trust_domain,schema_version,command_id,command_digest,corpus_id,corpus_hash,policy_id,policy_hash,runtime_id,runtime_version,toolchain_id,toolchain_version,adapter_id,adapter_version,artifact_id,artifact_hash,lane_identity_hash,semantic_tuple_id,result_manifest_hash,result_graph_hash,original_evidence_hash,derived_certificate_version,derived_certificate_record_hash,registry_generation,lane_identity,issued_at,valid_until)
			values ($1,$2,'passed','containment','producer','key','production','schema','command',$3,'corpus',$3,'policy',$3,'runtime','1','toolchain','1','adapter','1',$4,$5,$6,$7,$3,$8,$3,'certificate-v1',$9,'1',$10,$11,$12)`, attestationID, attestationHash, strings.Repeat("b", 64), lane.ArtifactID, artifactHash, laneHash, tuple.TupleID, graphHash, certificateHash, lane, now.Add(-time.Hour), now.Add(time.Hour)); err != nil {
			t.Fatal(err)
		}
		if _, err := pool.Exec(ctx, `insert into runtime_evidence_certificates
			(id,certificate_kind,certificate_version,certificate_record_hash,certificate_status,verified_attestation_id,verified_attestation_status,producer_id,schema_version,command_id,command_digest,corpus_id,corpus_hash,policy_id,policy_hash,toolchain_id,toolchain_version,artifact_id,artifact_hash,lane_identity_hash,lane_identity,result_graph_hash,registry_generation,issued_at,fresh_until)
			values ($1,'containment','certificate-v1',$2,'passed',$3,'passed','producer','schema','command',$4,'corpus',$4,'policy',$4,'toolchain','1',$5,$6,$7,$8,$9,'1',$10,$11)`, certificateID, certificateHash, attestationID, strings.Repeat("b", 64), lane.ArtifactID, artifactHash, laneHash, lane, graphHash, now.Add(-time.Hour), now.Add(time.Hour)); err != nil {
			t.Fatal(err)
		}
		entrants = append(entrants, map[string]any{"strategyRevisionId": revisionID, "entrantId": entrantKey, "entrantIndex": index, "ownerUserId": userID, "ownerHandle": "owner", "displayLabel": fmt.Sprintf("Entrant %d", index), "sourceHash": artifactHash, "sourceBytes": 6, "runtime": map[string]any{"language": lane.LanguageID}, "engineCompatibility": map[string]any{}})
		evidence = append(evidence, goEntrantExecutionEvidence{EntrantKey: entrantKey, StrategyRevisionID: revisionID, LaneIdentity: lane, ContainmentCertificateRef: goExecutionCertificateReference{Kind: "containment", CertificateID: certificateID, CertificateVersion: "certificate-v1", CertificateRecordHash: certificateHash, RegistryGeneration: "1"}, SchedulingDecision: goSchedulingDecision{Status: executableLaneEvidenceExhibitionOnly, ReasonCode: "CONTAINMENT_CURRENT", EvaluatedAt: now.Format(canonicalJSONInstantLayout), FreshUntil: now.Add(time.Hour).Format(canonicalJSONInstantLayout), RegistryGeneration: "1"}})
	}
	sort.Strings(attestationIDs)
	sort.Strings(certificateIDs)
	authority := &verifiedRuntimeEvidenceAuthority{AuthorityBundleHash: "sha256:" + strings.Repeat("d", 64), EnvelopeSHA256: "sha256:" + strings.Repeat("e", 64), RegistryGeneration: "1", SemanticTupleManifestHash: tuple.TupleID, CompatibilityTuple: tuple, TrustDomain: runtimeEvidenceAuthorityProductionTrustDomain}
	identity, err := createGoMatchSetIntegrityIdentity(authority, evidence)
	if err != nil {
		t.Fatal(err)
	}
	sourceManifestHash := "sha256:" + strings.Repeat("f", 64)
	sourceSet := map[string]any{"attestationIds": attestationIDs, "certificateIds": certificateIDs, "revocationIds": []string{}, "supersessionIds": []string{}, "laneControlIds": []string{}}
	if _, err := pool.Exec(ctx, `insert into runtime_evidence_authority_publications
		(id,generation,semantic_tuple_manifest_hash,source_manifest_hash,payload_sha256,envelope_sha256,signer_key_id,trust_domain,issued_at,valid_from,valid_until,payload_bytes,envelope_bytes,attestation_ids,certificate_ids,revocation_ids,supersession_ids,lane_control_ids)
		values ($1,1,$2,$3,$4,$5,'key',$6,$7,$7,$8,'payload','envelope',$9,$10,'[]','[]','[]')`, namespace+":publication", tuple.TupleID, sourceManifestHash, authority.AuthorityBundleHash, authority.EnvelopeSHA256, runtimeEvidenceAuthorityProductionTrustDomain, now.Add(-time.Hour), now.Add(time.Hour), attestationIDs, certificateIDs); err != nil {
		t.Fatal(err)
	}
	for index, id := range attestationIDs {
		if _, err := pool.Exec(ctx, `insert into runtime_evidence_authority_publication_sources (publication_id,source_type,source_id,source_record_hash,attestation_id) values ($1,'attestation',$2,$3,$2)`, namespace+":publication", id, "sha256:"+fmt.Sprintf("%064x", index+30)); err != nil {
			t.Fatal(err)
		}
	}
	for index, id := range certificateIDs {
		if _, err := pool.Exec(ctx, `insert into runtime_evidence_authority_publication_sources (publication_id,source_type,source_id,source_record_hash,certificate_id) values ($1,'certificate',$2,$3,$2)`, namespace+":publication", id, "sha256:"+fmt.Sprintf("%064x", index+40)); err != nil {
			t.Fatal(err)
		}
	}
	if _, err := pool.Exec(ctx, "update runtime_evidence_authority_publication_head set next_generation=2 where singleton=true"); err != nil {
		t.Fatal(err)
	}
	receipt := map[string]any{"schemaVersion": "v1.37-runtime-evidence-authority-install-receipt-v1", "generation": "1", "payloadSha256": authority.AuthorityBundleHash, "envelopeSha256": authority.EnvelopeSHA256, "sourceManifestHash": sourceManifestHash, "sourceIds": sourceSet}
	if _, err := pool.Exec(ctx, `insert into runtime_evidence_authority_publication_events (id,publication_id,event_kind,attempt_id,envelope_sha256,reason_code,receipt,occurred_at) values ($1,$2,'uncertain','attempt:1',$3,'RENAME_UNCONFIRMED',$4,$5)`, namespace+":event:uncertain", namespace+":publication", authority.EnvelopeSHA256, receipt, now.Add(-time.Minute)); err != nil {
		t.Fatal(err)
	}

	revisionIDs := []string{stringValue(entrants[0], "strategyRevisionId"), stringValue(entrants[1], "strategyRevisionId")}
	server := &LiveServer{pool: pool, now: func() time.Time { return now }}
	tracedConcurrentMutation := false
	dependencies := exhibitionCreationDependencies{loadEntrants: func(ctx context.Context, tx pgx.Tx, userID string, revisionIDs []string, lockedAt time.Time) ([]map[string]any, error) {
		return server.loadOwnedEntrants(ctx, tx, userID, revisionIDs, lockedAt)
	}, loadAuthority: func() (*verifiedRuntimeEvidenceAuthority, error) { return authority, nil }, resolveEvidence: func(context.Context, pgx.Tx, *verifiedRuntimeEvidenceAuthority, []map[string]any, bool, time.Time) (*goMatchSetIntegrityIdentity, error) {
		mutationCtx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
		defer cancel()
		_, mutationErr := pool.Exec(mutationCtx, "update strategy_revisions set source_hash=$2 where id=$1", revisionIDs[0], strings.Repeat("9", 64))
		if !errors.Is(mutationErr, context.DeadlineExceeded) && !errors.Is(mutationCtx.Err(), context.DeadlineExceeded) {
			return nil, fmt.Errorf("concurrent revision mutation was not blocked by creation lock: %v", mutationErr)
		}
		tracedConcurrentMutation = true
		return identity, nil
	}, begin: func(ctx context.Context) (pgx.Tx, error) { return pool.Begin(ctx) }}
	if _, err := server.createExhibitionMatchSetWithDependencies(ctx, userID, "smoke-exhibition-v1", revisionIDs, false, dependencies); err == nil {
		t.Fatal("uncertain receipt unexpectedly created a MatchSet")
	}
	var count int
	if err := pool.QueryRow(ctx, "select count(*) from match_sets").Scan(&count); err != nil || count != 0 {
		t.Fatalf("uncertain receipt wrote %d MatchSets: %v", count, err)
	}
	if _, err := pool.Exec(ctx, `insert into runtime_evidence_authority_publication_events (id,publication_id,event_kind,attempt_id,envelope_sha256,receipt,occurred_at) values ($1,$2,'installed','attempt:2',$3,$4,$5)`, namespace+":event:installed", namespace+":publication", authority.EnvelopeSHA256, receipt, now); err != nil {
		t.Fatal(err)
	}
	created, err := server.createExhibitionMatchSetWithDependencies(ctx, userID, "smoke-exhibition-v1", revisionIDs, false, dependencies)
	if err != nil {
		t.Fatal(err)
	}
	if !tracedConcurrentMutation {
		t.Fatal("creation did not exercise the concurrent revision mutation proof")
	}
	var lockedAt *time.Time
	var persistedSourceHash string
	if err := pool.QueryRow(ctx, "select locked_at,source_hash from strategy_revisions where id=$1", revisionIDs[0]).Scan(&lockedAt, &persistedSourceHash); err != nil || lockedAt == nil || persistedSourceHash != stringValue(entrants[0], "sourceHash") {
		t.Fatalf("locked revision changed during creation: lockedAt=%v sourceHash=%q err=%v", lockedAt, persistedSourceHash, err)
	}
	matchSetID := stringValue(created, "matchSetId")
	var publicationID, receiptID, persistedSetHash string
	if err := pool.QueryRow(ctx, `select authority_publication_id,authority_install_receipt_id,execution_evidence_set_hash from match_sets where id=$1`, matchSetID).Scan(&publicationID, &receiptID, &persistedSetHash); err != nil {
		t.Fatal(err)
	}
	if publicationID != namespace+":publication" || receiptID != namespace+":event:installed" || persistedSetHash != identity.EvidenceSetHash {
		t.Fatalf("receipt-bound MatchSet identity drifted: %q %q %q", publicationID, receiptID, persistedSetHash)
	}
	if err := pool.QueryRow(ctx, `select count(*) from matches m join match_jobs j on j.match_id=m.id where m.integrity_match_set_id=$1 and m.execution_evidence_pair_hash=j.execution_evidence_pair_hash and m.bottom_execution_entrant_key=j.bottom_execution_entrant_key and m.top_execution_entrant_key=j.top_execution_entrant_key`, matchSetID).Scan(&count); err != nil || count != 2 {
		t.Fatalf("ordered Match/job pairs persisted %d rows: %v", count, err)
	}
	if _, err := pool.Exec(ctx, `create function reject_creation_final_insert() returns trigger language plpgsql as $$ begin raise exception 'forced final insert failure'; end $$; create trigger reject_creation_final_insert before insert on competition_submission_events for each row execute function reject_creation_final_insert()`); err != nil {
		t.Fatal(err)
	}
	if _, err := server.createExhibitionMatchSetWithDependencies(ctx, userID, "standard-exhibition-v1", revisionIDs, false, dependencies); err == nil {
		t.Fatal("forced final insert failure unexpectedly committed")
	}
	if err := pool.QueryRow(ctx, "select count(*) from match_sets").Scan(&count); err != nil || count != 1 {
		t.Fatalf("late failure left %d MatchSets: %v", count, err)
	}

	newSourceManifestHash := "sha256:" + strings.Repeat("8", 64)
	newPayloadHash := "sha256:" + strings.Repeat("7", 64)
	newEnvelopeHash := "sha256:" + strings.Repeat("6", 64)
	newPublicationID := namespace + ":publication:2"
	if _, err := pool.Exec(ctx, `insert into runtime_evidence_authority_publications
		(id,generation,semantic_tuple_manifest_hash,source_manifest_hash,payload_sha256,envelope_sha256,signer_key_id,trust_domain,issued_at,valid_from,valid_until,payload_bytes,envelope_bytes,attestation_ids,certificate_ids,revocation_ids,supersession_ids,lane_control_ids)
		values ($1,2,$2,$3,$4,$5,'key',$6,$7,$7,$8,'payload-2','envelope-2',$9,$10,'[]','[]','[]')`, newPublicationID, tuple.TupleID, newSourceManifestHash, newPayloadHash, newEnvelopeHash, runtimeEvidenceAuthorityProductionTrustDomain, now.Add(-time.Minute), now.Add(time.Hour), attestationIDs, certificateIDs); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, `insert into runtime_evidence_authority_publication_sources
		(publication_id,source_type,source_id,source_record_hash,attestation_id,certificate_id)
		select $1,source_type,source_id,source_record_hash,attestation_id,certificate_id
		from runtime_evidence_authority_publication_sources where publication_id=$2`, newPublicationID, namespace+":publication"); err != nil {
		t.Fatal(err)
	}
	newReceipt := map[string]any{"schemaVersion": "v1.37-runtime-evidence-authority-install-receipt-v1", "generation": "2", "payloadSha256": newPayloadHash, "envelopeSha256": newEnvelopeHash, "sourceManifestHash": newSourceManifestHash, "sourceIds": sourceSet}
	if _, err := pool.Exec(ctx, `insert into runtime_evidence_authority_publication_events
		(id,publication_id,event_kind,attempt_id,envelope_sha256,receipt,occurred_at)
		values ($1,$2,'installed','attempt:3',$3,$4,$5)`, namespace+":event:installed:2", newPublicationID, newEnvelopeHash, newReceipt, now.Add(time.Minute)); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, "update runtime_evidence_authority_publication_head set next_generation=3 where singleton=true"); err != nil {
		t.Fatal(err)
	}
	tx, err := pool.Begin(ctx)
	if err != nil {
		t.Fatal(err)
	}
	if receipt, err := server.lockInstalledAuthorityReceipt(ctx, tx, authority, now); err == nil || receipt != nil {
		_ = tx.Rollback(ctx)
		t.Fatalf("older installed generation remained current after generation 2: receipt=%+v err=%v", receipt, err)
	}
	_ = tx.Rollback(ctx)
}
