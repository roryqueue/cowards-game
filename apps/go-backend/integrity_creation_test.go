package main

import (
	"context"
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

func TestCandidateIntegrityCreationV119RequiresExactRevisionAdmissions(t *testing.T) {
	tuple := registeredCompatibilityTuple{
		TupleID: "sha256:37c9a07425d454c74859112debcc3ef362d43e80d5767560d9bde28a3c8d5e73",
		Tuple: canonicalCompatibilityTuple{
			Rules: "canonical-rules-v1.37", Engine: "canonical-engine-v1.37",
			RuntimeABI: "strategy-runtime-abi-v1.19", Chronicle: "canonical-chronicle-v1.37",
			ArenaCatalog: "canonical-arena-catalog-v1.37", SetPolicy: "canonical-set-policy-v1.37-four-condition-v1",
		},
	}
	entrants := make([]goEntrantExecutionEvidence, 0, 2)
	admissions := map[string]candidateRevisionAdmissionV119{}
	for index, key := range []string{"entrant:a", "entrant:b"} {
		hash := fmt.Sprintf("%064x", index+1)
		certificateHash := fmt.Sprintf("%064x", index+11)
		revisionID := "revision:" + key
		lane := goExecutableLaneIdentity{
			ProviderID: "provider:real", LanguageID: []string{"typescript", "python"}[index],
			AdapterID: "lane:real", ArtifactSHA256: hash, SemanticTupleID: tuple.TupleID, SemanticTuple: tuple.Tuple,
		}
		certificate := goExecutionCertificateReference{
			Kind: "conformance", CertificateID: "certificate:" + key,
			CertificateVersion: "v1", CertificateRecordHash: certificateHash, RegistryGeneration: "1",
		}
		entrants = append(entrants, goEntrantExecutionEvidence{
			EntrantKey: key, StrategyRevisionID: revisionID, LaneIdentity: lane,
			ContainmentCertificateRef: certificate, ConformanceCertificateRef: &certificate,
		})
		admissions[key] = candidateRevisionAdmissionV119{
			RevalidationID: "revalidation:" + key, StrategyRevisionID: revisionID,
			SourceHash: hash, SourceBytes: 10, ArtifactSHA256: "sha256:" + hash, ArtifactBytes: 10,
			LanguageID: lane.LanguageID, ProviderID: lane.ProviderID, LaneID: lane.AdapterID,
			RuntimeABIVersion: "strategy-runtime-abi-v1.19", SemanticRuntimeVersion: "runtime-v1.19",
			SemanticTupleID: tuple.TupleID, ExecutionKind: "real_service_execution", SyntheticEvidence: false,
			ExecutionRequestRoot: "sha256:" + strings.Repeat("a", 64), ExecutionResultRoot: "sha256:" + strings.Repeat("b", 64),
			ExecutionReceiptRoot: "sha256:" + strings.Repeat("c", 64), ServiceReceiptVersion: "runtime-semantic-receipt-v1.19",
			ReviewedCertificateID: certificate.CertificateID, ReviewedCertificateSHA256: "sha256:" + certificateHash,
			ReviewStatus: "reviewed", EvidenceStatus: "passed",
		}
	}
	identity := &goMatchSetIntegrityIdentity{Tuple: tuple, Entrants: entrants, ByKey: map[string]goEntrantExecutionEvidence{
		"entrant:a": entrants[0], "entrant:b": entrants[1],
	}}
	if _, err := validateCandidateRevisionAdmissionsV119(identity, admissions); err != nil {
		t.Fatalf("exact revision admissions were rejected: %v", err)
	}

	mutations := map[string]func(map[string]candidateRevisionAdmissionV119){
		"missing": func(values map[string]candidateRevisionAdmissionV119) { delete(values, "entrant:b") },
		"cross-revision": func(values map[string]candidateRevisionAdmissionV119) {
			value := values["entrant:b"]
			value.StrategyRevisionID = "revision:entrant:a"
			values["entrant:b"] = value
		},
		"old-tuple": func(values map[string]candidateRevisionAdmissionV119) {
			value := values["entrant:b"]
			value.SemanticTupleID = "sha256:" + strings.Repeat("d", 64)
			values["entrant:b"] = value
		},
		"synthetic": func(values map[string]candidateRevisionAdmissionV119) {
			value := values["entrant:b"]
			value.SyntheticEvidence = true
			values["entrant:b"] = value
		},
		"artifact-substitution": func(values map[string]candidateRevisionAdmissionV119) {
			value := values["entrant:b"]
			value.ArtifactSHA256 = "sha256:" + strings.Repeat("e", 64)
			values["entrant:b"] = value
		},
		"certificate-substitution": func(values map[string]candidateRevisionAdmissionV119) {
			value := values["entrant:b"]
			value.ReviewedCertificateID = "certificate:other"
			values["entrant:b"] = value
		},
	}
	for name, mutate := range mutations {
		t.Run(name, func(t *testing.T) {
			candidate := map[string]candidateRevisionAdmissionV119{}
			for key, value := range admissions {
				candidate[key] = value
			}
			mutate(candidate)
			if _, err := validateCandidateRevisionAdmissionsV119(identity, candidate); err == nil {
				t.Fatal("inexact candidate admission was accepted")
			}
		})
	}
}

func TestCandidateIntegrityCreationV119OwnsOneAtomicFourConditionTransaction(t *testing.T) {
	source, err := os.ReadFile("live_backend.go")
	if err != nil {
		t.Fatal(err)
	}
	text := string(source)
	for _, required := range []string{
		"BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.Serializable})",
		"insert into set_scenarios", "insert into set_conditions", "insert into matches",
		"insert into match_jobs", "insert into match_set_matches", "tx.Commit(ctx)",
	} {
		if !strings.Contains(text, required) {
			t.Fatalf("candidate transaction is missing %q", required)
		}
	}
}

func TestCandidateIntegrityCreationV119PostgresPublishesExactlyFourOrNothing(t *testing.T) {
	databaseURL := os.Getenv("COWARDS_GO_BACKEND_TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("set COWARDS_GO_BACKEND_TEST_DATABASE_URL for candidate creation PostgreSQL proof")
	}
	ctx := context.Background()
	admin, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		t.Fatal(err)
	}
	defer admin.Close()
	schema := "candidate_creation_" + strings.ReplaceAll(randomID(), "-", "")
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
		sql, readErr := os.ReadFile(file)
		if readErr != nil {
			t.Fatal(readErr)
		}
		if _, migrationErr := pool.Exec(ctx, string(sql)); migrationErr != nil {
			t.Fatalf("migration %s: %v", filepath.Base(file), migrationErr)
		}
	}

	now := time.Date(2026, 7, 17, 12, 0, 0, 0, time.UTC)
	namespace := "candidate:" + randomID()
	userID, strategyID := namespace+":user", namespace+":strategy"
	if _, err := pool.Exec(ctx, "insert into users (id,display_name,handle) values ($1,'Candidate','candidate')", userID); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, "insert into strategies (id,owner_user_id,name) values ($1,$2,'Candidate')", strategyID, userID); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, "insert into arena_variants (id,name,version,config) values ('arena:smoke:v1','Smoke','v1','{}')"); err != nil {
		t.Fatal(err)
	}

	authority, err := candidateSchedulingAuthorityV119("runtime-v1.19")
	if err != nil {
		t.Fatal(err)
	}
	tuple := registeredCompatibilityTuple{TupleID: authority.Tuple.TupleID, Tuple: canonicalCompatibilityTuple{
		Rules: authority.Tuple.Rules, Engine: authority.Tuple.Engine, RuntimeABI: authority.Tuple.RuntimeABI,
		Chronicle: authority.Tuple.Chronicle, ArenaCatalog: authority.Tuple.ArenaCatalog, SetPolicy: authority.Tuple.SetPolicy,
	}}
	setEntrants := make([]candidateSetEntrantV119, 0, 2)
	executionEntrants := make([]goEntrantExecutionEvidence, 0, 2)
	revalidationIDs := make([]string, 0, 2)
	for index, key := range []string{"entrant:a", "entrant:b"} {
		revisionID := namespace + ":revision:" + fmt.Sprint(index)
		language := []string{"typescript", "python"}[index]
		artifactHash := fmt.Sprintf("%064x", 100+index)
		lane := goExecutableLaneIdentity{
			ProviderID: "provider:real", LanguageID: language, RuntimeID: "runtime", RuntimeVersion: "1.19",
			ToolchainID: "toolchain", ToolchainVersion: "1", AdapterID: "lane:real", AdapterVersion: "1",
			PolicyID: "policy", PolicyVersion: "1", CorpusID: "corpus", CorpusVersion: "1",
			ArtifactID: namespace + ":artifact:" + fmt.Sprint(index), ArtifactSHA256: artifactHash,
			ImplementationID: "implementation", BuildID: "build", SemanticTupleID: tuple.TupleID, SemanticTuple: tuple.Tuple,
		}
		if _, err := pool.Exec(ctx, `insert into strategy_revisions (
			id,strategy_id,source,source_hash,source_bytes,runtime,engine_compatibility,validation,
			metadata,compiled_artifact,locked_at
		) values ($1,$2,'return {}',$3,9,$4,'{}','{"valid":true}',$5,$6,$7)`,
			revisionID, strategyID, artifactHash, map[string]any{"language": map[string]any{"id": language}},
			map[string]any{"providerValidation": map[string]any{"providerId": lane.ProviderID}},
			map[string]any{"hash": "sha256:" + artifactHash, "bytes": 9}, now); err != nil {
			t.Fatal(err)
		}

		refs := map[string]goExecutionCertificateReference{}
		laneHash := hashCreationLaneIdentity(lane)
		for kindIndex, kind := range []string{"containment", "conformance"} {
			attestationID := fmt.Sprintf("%s:attestation:%d:%d", namespace, index, kindIndex)
			certificateID := fmt.Sprintf("%s:certificate:%d:%d", namespace, index, kindIndex)
			attestationHash := fmt.Sprintf("%064x", 200+index*10+kindIndex)
			certificateHash := fmt.Sprintf("%064x", 300+index*10+kindIndex)
			graphHash := fmt.Sprintf("%064x", 400+index*10+kindIndex)
			commandHash := fmt.Sprintf("%064x", 500+index*10+kindIndex)
			if _, err := pool.Exec(ctx, `insert into runtime_evidence_verified_attestations (
				id,attestation_sha256,verification_status,certificate_kind,producer_id,producer_key_id,
				trust_domain,schema_version,command_id,command_digest,corpus_id,corpus_hash,policy_id,
				policy_hash,runtime_id,runtime_version,toolchain_id,toolchain_version,adapter_id,adapter_version,
				artifact_id,artifact_hash,lane_identity_hash,semantic_tuple_id,result_manifest_hash,result_graph_hash,
				original_evidence_hash,derived_certificate_version,derived_certificate_record_hash,registry_generation,
				lane_identity,issued_at,valid_until
			) values ($1,$2,'passed',$3,'producer','key','fixture','schema','command',$4,'corpus',$4,
			          'policy',$4,'runtime','1.19','toolchain','1','lane:real','1',$5,$6,$7,$8,$4,$9,$4,
			          'certificate-v1',$10,'1',$11,$12,$13)`,
				attestationID, attestationHash, kind, commandHash, lane.ArtifactID, artifactHash, laneHash,
				tuple.TupleID, graphHash, certificateHash, lane, now.Add(-time.Hour), now.Add(time.Hour)); err != nil {
				t.Fatal(err)
			}
			if _, err := pool.Exec(ctx, `insert into runtime_evidence_certificates (
				id,certificate_kind,certificate_version,certificate_record_hash,certificate_status,
				verified_attestation_id,verified_attestation_status,producer_id,schema_version,command_id,
				command_digest,corpus_id,corpus_hash,policy_id,policy_hash,toolchain_id,toolchain_version,
				artifact_id,artifact_hash,lane_identity_hash,lane_identity,result_graph_hash,registry_generation,
				issued_at,fresh_until
			) values ($1,$2,'certificate-v1',$3,'passed',$4,'passed','producer','schema','command',$5,
			          'corpus',$5,'policy',$5,'toolchain','1',$6,$7,$8,$9,$10,'1',$11,$12)`,
				certificateID, kind, certificateHash, attestationID, commandHash, lane.ArtifactID,
				artifactHash, laneHash, lane, graphHash, now.Add(-time.Hour), now.Add(time.Hour)); err != nil {
				t.Fatal(err)
			}
			refs[kind] = goExecutionCertificateReference{Kind: kind, CertificateID: certificateID,
				CertificateVersion: "certificate-v1", CertificateRecordHash: certificateHash, RegistryGeneration: "1"}
		}
		conformance := refs["conformance"]
		executionEntrants = append(executionEntrants, goEntrantExecutionEvidence{
			EntrantKey: key, StrategyRevisionID: revisionID, LaneIdentity: lane,
			ContainmentCertificateRef: refs["containment"], ConformanceCertificateRef: &conformance,
			SchedulingDecision: goSchedulingDecision{Status: executableLaneEvidenceCounted, ReasonCode: "EXACT_V119",
				EvaluatedAt: now.Format(canonicalJSONInstantLayout), FreshUntil: now.Add(time.Hour).Format(canonicalJSONInstantLayout), RegistryGeneration: "1"},
		})
		revalidationID := namespace + ":revalidation:" + fmt.Sprint(index)
		revalidationIDs = append(revalidationIDs, revalidationID)
		if _, err := pool.Exec(ctx, `insert into strategy_revision_v1_19_revalidations (
			id,strategy_revision_id,source_hash,source_bytes,artifact_sha256,artifact_bytes,language_id,
			provider_id,lane_id,runtime_abi_version,semantic_runtime_version,semantic_tuple_id,
			execution_kind,synthetic_evidence,execution_request_root,execution_result_root,
			execution_receipt_root,service_receipt_version,reviewed_certificate_id,
			reviewed_certificate_sha256,review_status,evidence_status,evidence_created_at
		) values ($1,$2,$3,9,$4,9,$5,$6,$7,'strategy-runtime-abi-v1.19','runtime-v1.19',$8,
		          'real_service_execution',false,$9,$10,$11,'runtime-semantic-receipt-v1.19',$12,$13,
		          'reviewed','passed',$14)`, revalidationID, revisionID, artifactHash, "sha256:"+artifactHash,
			language, lane.ProviderID, lane.AdapterID, tuple.TupleID,
			"sha256:"+fmt.Sprintf("%064x", 600+index*10), "sha256:"+fmt.Sprintf("%064x", 601+index*10),
			"sha256:"+fmt.Sprintf("%064x", 602+index*10), conformance.CertificateID,
			"sha256:"+conformance.CertificateRecordHash, time.Now().UTC().Add(-time.Hour)); err != nil {
			t.Fatal(err)
		}
		setEntrants = append(setEntrants, candidateSetEntrantV119{EntrantKey: key, StrategyRevisionID: revisionID, PlayerID: "player:" + key})
	}
	identity, err := createGoMatchSetIntegrityIdentity(&verifiedRuntimeEvidenceAuthority{
		AuthorityBundleHash: "sha256:" + strings.Repeat("d", 64), RegistryGeneration: "1", CompatibilityTuple: tuple,
	}, executionEntrants)
	if err != nil {
		t.Fatal(err)
	}
	server := &LiveServer{pool: pool, now: func() time.Time { return now }}
	create := func(matchSetID string) error {
		_, err := server.createCandidateFourConditionMatchSetV119(ctx, candidateFourConditionCreationInputV119{
			MatchSetID: matchSetID, CreatorUserID: userID, ArenaID: "arena:smoke:v1", BaseSeed: "seed:fixed",
			EntrantA: setEntrants[0], EntrantB: setEntrants[1], IntegrityIdentity: identity,
		})
		return err
	}
	matchSetID := namespace + ":match-set:success"
	if err := create(matchSetID); err != nil {
		t.Fatalf("candidate creation failed: %v", err)
	}
	var scenarios, conditions, matches, jobs, memberships int
	if err := pool.QueryRow(ctx, `select
		(select count(*) from set_scenarios where match_set_id=$1),
		(select count(*) from set_conditions where match_set_id=$1),
		(select count(*) from matches where successor_match_set_id=$1),
		(select count(*) from match_jobs where integrity_match_set_id=$1),
		(select count(*) from match_set_matches where match_set_id=$1)`, matchSetID).Scan(&scenarios, &conditions, &matches, &jobs, &memberships); err != nil {
		t.Fatal(err)
	}
	if scenarios != 1 || conditions != 4 || matches != 4 || jobs != 4 || memberships != 4 {
		t.Fatalf("candidate matrix is incomplete: scenarios=%d conditions=%d matches=%d jobs=%d memberships=%d", scenarios, conditions, matches, jobs, memberships)
	}
	if _, err := pool.Exec(ctx, `create function reject_candidate_job() returns trigger language plpgsql as $$ begin raise exception 'forced job fault'; end $$;
		create trigger reject_candidate_job before insert on match_jobs for each row execute function reject_candidate_job()`); err != nil {
		t.Fatal(err)
	}
	rollbackID := namespace + ":match-set:rollback"
	if err := create(rollbackID); err == nil {
		t.Fatal("forced late job fault did not fail candidate creation")
	}
	var residual int
	if err := pool.QueryRow(ctx, `select
		(select count(*) from match_sets where id=$1) +
		(select count(*) from set_scenarios where match_set_id=$1) +
		(select count(*) from set_conditions where match_set_id=$1) +
		(select count(*) from matches where successor_match_set_id=$1)`, rollbackID).Scan(&residual); err != nil {
		t.Fatal(err)
	}
	if residual != 0 {
		t.Fatalf("candidate rollback left %d rows", residual)
	}
	if _, err := pool.Exec(ctx, "drop trigger reject_candidate_job on match_jobs"); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, `insert into strategy_revision_v1_19_revalidation_revocations (id,revalidation_id,reason_code,evidence_root) values ($1,$2,'REVOKED',$3)`, namespace+":revocation", revalidationIDs[1], "sha256:"+strings.Repeat("f", 64)); err != nil {
		t.Fatal(err)
	}
	revokedID := namespace + ":match-set:revoked"
	if err := create(revokedID); err == nil {
		t.Fatal("revoked admission was accepted")
	}
	if err := pool.QueryRow(ctx, "select count(*) from match_sets where id=$1", revokedID).Scan(&residual); err != nil {
		t.Fatal(err)
	}
	if residual != 0 {
		t.Fatalf("revoked admission left %d MatchSet rows", residual)
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
	fixture := newDeploymentLaneFixture(t)
	if !creationLaneMatchesEntrant(fixture.Lane, fixture.Entrant, fixture.Tuple, fixture.Registry) {
		t.Fatal("exact configured executable lane was rejected")
	}

	mutations := map[string]func(*goExecutableLaneIdentity){
		"provider-id":       func(value *goExecutableLaneIdentity) { value.ProviderID = "other" },
		"language-id":       func(value *goExecutableLaneIdentity) { value.LanguageID = "other" },
		"runtime-id":        func(value *goExecutableLaneIdentity) { value.RuntimeID = "other" },
		"runtime-version":   func(value *goExecutableLaneIdentity) { value.RuntimeVersion = "other" },
		"toolchain-id":      func(value *goExecutableLaneIdentity) { value.ToolchainID = "other" },
		"toolchain-version": func(value *goExecutableLaneIdentity) { value.ToolchainVersion = "other" },
		"adapter-id":        func(value *goExecutableLaneIdentity) { value.AdapterID = "other" },
		"adapter-version":   func(value *goExecutableLaneIdentity) { value.AdapterVersion = "other" },
		"policy-id":         func(value *goExecutableLaneIdentity) { value.PolicyID = "other" },
		"policy-version":    func(value *goExecutableLaneIdentity) { value.PolicyVersion = "other" },
		"corpus-id":         func(value *goExecutableLaneIdentity) { value.CorpusID = "other" },
		"corpus-version":    func(value *goExecutableLaneIdentity) { value.CorpusVersion = "other" },
		"artifact-id":       func(value *goExecutableLaneIdentity) { value.ArtifactID = "other" },
		"artifact-sha256":   func(value *goExecutableLaneIdentity) { value.ArtifactSHA256 = strings.Repeat("b", 64) },
		"implementation-id": func(value *goExecutableLaneIdentity) { value.ImplementationID = "other" },
		"build-id":          func(value *goExecutableLaneIdentity) { value.BuildID = "other" },
	}
	for name, mutate := range mutations {
		t.Run(name, func(t *testing.T) {
			candidate := fixture.Lane
			mutate(&candidate)
			if creationLaneMatchesEntrant(candidate, fixture.Entrant, fixture.Tuple, fixture.Registry) {
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
