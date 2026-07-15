package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"os"
	"path/filepath"
	"reflect"
	"sort"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func seedExactSemanticSuccessorAuthorityFixtureV117(t *testing.T, ctx context.Context, pool *pgxpool.Pool, now time.Time) (*semanticCurrentAuthorityFixture, *goDeploymentLaneRegistry) {
	t.Helper()
	fixture := loadRuntimeSuccessorAuthorityFixtureV117(t)
	payloadBytes, payload := fixture.decodedPayload(t)
	envelopeBytes, err := base64.StdEncoding.Strict().DecodeString(fixture.InstallFixture.EnvelopeBytesBase64)
	if err != nil {
		t.Fatal(err)
	}
	issuedAt := mustParseFixtureInstantV117(t, payload.IssuedAt)
	validFrom := mustParseFixtureInstantV117(t, payload.ValidFrom)
	validUntil := mustParseFixtureInstantV117(t, payload.ValidUntil)
	installedAt := mustParseFixtureInstantV117(t, fixture.InstallFixture.InstalledAt)
	if now.Before(validFrom) || now.After(validUntil) || payload.RegistryGeneration != fixture.InstallFixture.Expected.RegistryGeneration ||
		payload.SemanticTupleManifestHash != fixture.SemanticTupleID || payload.SourceManifestHash != fixture.InstallFixture.Expected.SourceManifestHash {
		t.Fatal("exact successor authority fixture is not valid at the DB proof instant")
	}

	strategies := map[string]runtimeServiceStrategyRevision{}
	vectorByRoot := map[string]runtimeSuccessorRevisionVectorV117{}
	registryValue := &goDeploymentLaneRegistry{
		SchemaVersion: deploymentLaneRegistrySchemaVersion,
		RegistryID:    "fixture:exact-successor-authority:v1.17",
	}
	for _, vector := range fixture.RevisionVectors {
		strategy := vector.strategy(t, now)
		strategies[vector.Side] = strategy
		vectorByRoot[vector.Expected.IdentityManifestRoot] = vector
		profile := goDeploymentLaneProfile{
			ProviderID: vector.Deployed.ProviderID, LanguageID: vector.Deployed.LanguageID,
			LanguageVersion: stringValue(mapValue(strategy.Runtime, "language"), "version"),
			RuntimeID:       vector.Deployed.RuntimeID, RuntimeVersion: vector.Deployed.RuntimeVersion,
			ToolchainID: vector.Deployed.ToolchainID, ToolchainVersion: vector.Deployed.ToolchainVersion,
			AdapterID: vector.Deployed.AdapterID, AdapterVersion: vector.Deployed.AdapterVersion,
			PolicyID: vector.Deployed.PolicyID, PolicyVersion: vector.Deployed.PolicyVersion,
			CorpusID: vector.Deployed.CorpusID, CorpusVersion: vector.Deployed.CorpusVersion,
			ArtifactKind: "source", ArtifactIDPrefix: strings.TrimSuffix(vector.Deployed.ArtifactID, strategy.ID),
			ImplementationID: vector.Deployed.ImplementationID, BuildID: vector.Deployed.BuildID,
			SemanticTupleID: vector.Deployed.SemanticTupleID, SemanticTuple: vector.Deployed.SemanticTuple,
			SuccessorRuntimeIdentityTemplate: cloneRuntimeSuccessorIdentityTemplateV117(&fixture.Template),
		}
		if len(registryValue.Lanes) == 0 {
			registryValue.Lanes = append(registryValue.Lanes, profile)
		} else if !reflect.DeepEqual(registryValue.Lanes[0], profile) {
			t.Fatal("successor parity revisions do not share one exact deployment lane profile")
		}
	}
	registryBytes, err := json.Marshal(registryValue)
	if err != nil {
		t.Fatal(err)
	}
	registryPath := filepath.Join(t.TempDir(), "exact-successor-registry.json")
	if err := os.WriteFile(registryPath, registryBytes, 0o600); err != nil {
		t.Fatal(err)
	}
	registry, err := loadDeploymentLaneRegistry(registryPath)
	if err != nil {
		t.Fatalf("exact successor registry is not consumable: %v", err)
	}

	baseRequest := validRuntimeServiceRequestForTest()
	baseRequest.Match.BottomPlayerID = "fixture:player:bottom:v1.17"
	baseRequest.Match.TopPlayerID = "fixture:player:top:v1.17"
	baseRequest.Strategies.Bottom = strategies["bottom"]
	baseRequest.Strategies.Top = strategies["top"]
	baseRequest.Match.BottomStrategyRevisionID = strategies["bottom"].ID
	baseRequest.Match.TopStrategyRevisionID = strategies["top"].ID
	baseRequest.Match.ArenaVariant["id"] = "fixture:arena:v1.17"
	baseRequest.Match.ArenaVariant["name"] = "Fixture isolated successor arena"
	baseRequest.Limits = defaultRuntimeServiceLimitsV117()

	if _, err := pool.Exec(ctx, `insert into users(id,display_name) values ('fixture:user:v1.17','Fixture v1.17')`); err != nil {
		t.Fatal(err)
	}
	seenStrategies := map[string]bool{}
	for _, vector := range fixture.RevisionVectors {
		strategy := strategies[vector.Side]
		if !seenStrategies[vector.Revision.StrategyID] {
			if _, err := pool.Exec(ctx, `insert into strategies(id,owner_user_id,name) values ($1,'fixture:user:v1.17',$2)`, vector.Revision.StrategyID, "Fixture "+vector.Side+" v1.17"); err != nil {
				t.Fatal(err)
			}
			seenStrategies[vector.Revision.StrategyID] = true
		}
		if _, err := pool.Exec(ctx, `insert into strategy_revisions
			(id,strategy_id,source,source_hash,source_bytes,runtime,engine_compatibility,validation,metadata,locked_at)
			values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, strategy.ID, vector.Revision.StrategyID, strategy.Source, strategy.SourceHash, strategy.SourceBytes, strategy.Runtime, strategy.EngineCompatibility, strategy.Validation, strategy.Metadata, now); err != nil {
			t.Fatal(err)
		}
	}
	if _, err := pool.Exec(ctx, `insert into arena_variants(id,name,version,config) values ($1,$2,'0.1.0',$3)`, baseRequest.Match.ArenaVariant["id"], baseRequest.Match.ArenaVariant["name"], baseRequest.Match.ArenaVariant); err != nil {
		t.Fatal(err)
	}

	templateBindings := runtimeIdentityBindingMapV117(fixture.Template.Bindings)
	certificatesByID := map[string]runtimeEvidenceAuthorityCertificate{}
	attestationSourceHashes := map[string]string{}
	certificateSourceHashes := map[string]string{}
	authority := &verifiedRuntimeEvidenceAuthority{
		AuthorityBundleHash: runtimeInvocationV117SHA256Value([]byte("fixture:legacy-projection:" + fixture.InstallFixture.Expected.AuthorityBundleHash)),
		EnvelopeSHA256:      runtimeInvocationV117SHA256Value([]byte("fixture:legacy-envelope:" + fixture.InstallFixture.Expected.EnvelopeSHA256)),
		RegistryGeneration:  payload.RegistryGeneration, SemanticTupleManifestHash: fixture.SemanticTupleID,
		CompatibilityTuple: registeredCompatibilityTuple{TupleID: fixture.SemanticTupleID, Tuple: fixture.SemanticTuple},
		TrustDomain:        runtimeEvidenceAuthorityProductionTrustDomain,
		KeyID:              fixture.InstallFixture.SignerKeyID,
		Payload: runtimeEvidenceAuthorityPayload{
			SchemaVersion: "v1.37-runtime-evidence-authority-payload-v1", BundleVersion: "fixture-legacy-projection-v1.17",
			RegistryGeneration: payload.RegistryGeneration, IssuedAt: payload.IssuedAt, ValidFrom: payload.ValidFrom,
			ValidUntil: payload.ValidUntil, SemanticTupleManifestHash: fixture.SemanticTupleID,
			Revocations: []runtimeEvidenceAuthorityRevocation{}, Supersessions: []runtimeEvidenceAuthoritySupersession{},
			OperatorLaneDisables: []runtimeEvidenceAuthorityLaneDisable{},
		},
	}
	for _, attestation := range payload.Attestations {
		certificate, ok := certificateForFixtureAttestationV117(payload.Certificates, attestation.AttestationID)
		if !ok {
			t.Fatalf("exact attestation %s does not own one certificate", attestation.AttestationID)
		}
		vector, ok := vectorByRoot[attestation.Binding.IdentityManifestRoot]
		if !ok || certificate.Binding != attestation.Binding {
			t.Fatalf("exact attestation %s has no revision/binding", attestation.AttestationID)
		}
		lane := vector.Deployed
		laneHash := strings.TrimPrefix(vector.LaneIdentityHash, "sha256:")
		attestationHash := strings.TrimPrefix(attestation.AttestationHash, "sha256:")
		certificateHash := strings.TrimPrefix(certificate.CertificateRecordHash, "sha256:")
		identityRoot := strings.TrimPrefix(attestation.Binding.IdentityManifestRoot, "sha256:")
		evidenceRoot := strings.TrimPrefix(attestation.Binding.EvidenceGraphRoot, "sha256:")
		commandID := "fixture:command:" + vector.Side + ":" + certificate.CertificateKind + ":v1.17"
		schemaVersion := "runtime-evidence-attestation-v1.17"
		if _, err := pool.Exec(ctx, `insert into runtime_evidence_verified_attestations
			(id,attestation_sha256,verification_status,certificate_kind,producer_id,producer_key_id,trust_domain,schema_version,command_id,command_digest,corpus_id,corpus_hash,policy_id,policy_hash,runtime_id,runtime_version,toolchain_id,toolchain_version,adapter_id,adapter_version,artifact_id,artifact_hash,lane_identity_hash,semantic_tuple_id,result_manifest_hash,result_graph_hash,original_evidence_hash,derived_certificate_version,derived_certificate_record_hash,registry_generation,lane_identity,issued_at,valid_until,graph_schema_version,graph_profile,identity_manifest_root,evidence_graph_root,exact_pin_expansion)
			values ($1,$2,'passed',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37)`,
			attestation.AttestationID, attestationHash, certificate.CertificateKind, attestation.ProducerID, attestation.ProducerKeyID, attestation.TrustDomain,
			schemaVersion, commandID, lane.ArtifactSHA256, lane.CorpusID, templateBindings["conformanceCorpus"].SHA256,
			lane.PolicyID, templateBindings["containmentPolicy"].SHA256, lane.RuntimeID, lane.RuntimeVersion, lane.ToolchainID, lane.ToolchainVersion,
			lane.AdapterID, lane.AdapterVersion, lane.ArtifactID, lane.ArtifactSHA256, laneHash, fixture.SemanticTupleID,
			identityRoot, evidenceRoot, attestationHash, certificate.CertificateVersion, certificateHash, payload.RegistryGeneration,
			lane, issuedAt, validUntil, attestation.Binding.GraphSchemaVersion, attestation.Binding.GraphProfile, identityRoot, evidenceRoot, attestation.Binding.ExactPins); err != nil {
			t.Fatal(err)
		}
		if _, err := pool.Exec(ctx, `insert into runtime_evidence_certificates
			(id,certificate_kind,certificate_version,certificate_record_hash,certificate_status,verified_attestation_id,verified_attestation_status,producer_id,schema_version,command_id,command_digest,corpus_id,corpus_hash,policy_id,policy_hash,toolchain_id,toolchain_version,artifact_id,artifact_hash,lane_identity_hash,lane_identity,result_graph_hash,registry_generation,issued_at,fresh_until,graph_schema_version,graph_profile,identity_manifest_root,evidence_graph_root,exact_pin_expansion)
			values ($1,$2,$3,$4,'passed',$5,'passed',$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28)`,
			certificate.CertificateID, certificate.CertificateKind, certificate.CertificateVersion, certificateHash, attestation.AttestationID,
			attestation.ProducerID, schemaVersion, commandID, lane.ArtifactSHA256, lane.CorpusID, templateBindings["conformanceCorpus"].SHA256,
			lane.PolicyID, templateBindings["containmentPolicy"].SHA256, lane.ToolchainID, lane.ToolchainVersion, lane.ArtifactID, lane.ArtifactSHA256,
			laneHash, lane, evidenceRoot, payload.RegistryGeneration, issuedAt, validUntil,
			attestation.Binding.GraphSchemaVersion, attestation.Binding.GraphProfile, identityRoot, evidenceRoot, attestation.Binding.ExactPins); err != nil {
			t.Fatal(err)
		}
		if _, err := pool.Exec(ctx, `insert into runtime_evidence_v1_17_candidates
			(attestation_id,attestation_sha256,certificate_kind,certificate_id,certificate_version,certificate_record_hash,producer_id,producer_key_id,trust_domain,managed_identity,graph_schema_version,graph_profile,identity_manifest_root,evidence_graph_root,exact_pin_expansion,registry_generation,issued_at,valid_until)
			values ($1,$2,$3,$4,$5,$6,$7,$8,'fixture',true,$9,$10,$11,$12,$13,$14,$15,$16)`,
			attestation.AttestationID, attestationHash, certificate.CertificateKind, certificate.CertificateID, certificate.CertificateVersion,
			certificate.CertificateRecordHash, attestation.ProducerID, attestation.ProducerKeyID, attestation.Binding.GraphSchemaVersion,
			attestation.Binding.GraphProfile, identityRoot, evidenceRoot, attestation.Binding.ExactPins, payload.RegistryGeneration, issuedAt, validUntil); err != nil {
			t.Fatal(err)
		}

		authority.Payload.Attestations = append(authority.Payload.Attestations, runtimeEvidenceAuthorityAttestation{
			AttestationID: attestation.AttestationID, AttestationHash: attestation.AttestationHash, Verified: true,
			Imports: append([]string{}, attestation.Imports...),
		})
		projectedCertificate := runtimeEvidenceAuthorityCertificate{
			Kind: certificate.CertificateKind, CertificateID: certificate.CertificateID, CertificateVersion: certificate.CertificateVersion,
			CertificateRecordHash: certificate.CertificateRecordHash, LaneIdentityHash: vector.LaneIdentityHash, LaneIdentity: lane,
			IssuedAt: payload.IssuedAt, FreshUntil: payload.ValidUntil, AttestationIDs: []string{attestation.AttestationID},
		}
		authority.Payload.Certificates = append(authority.Payload.Certificates, projectedCertificate)
		certificatesByID[certificate.CertificateID] = projectedCertificate
		attestationSourceHashes[attestation.AttestationID] = attestation.AttestationHash
		certificateSourceHashes[certificate.CertificateID] = certificate.CertificateRecordHash
	}
	if err := validateRuntimeEvidenceAuthorityGraph(authority.Payload); err != nil {
		if detail, ok := err.(*runtimeEvidenceAuthorityError); ok {
			t.Fatalf("exact successor evidence could not project into current claim validation: %s", detail.Code)
		}
		t.Fatalf("exact successor evidence could not project into current claim validation: %v", err)
	}

	entrants := make([]goEntrantExecutionEvidence, 0, len(fixture.RevisionVectors))
	for _, vector := range fixture.RevisionVectors {
		containment := certificateForFixtureSideAndKindV117(t, payload, vector, "containment")
		conformance := certificateForFixtureSideAndKindV117(t, payload, vector, "conformance")
		containmentRuntimeReference := runtimeEvidenceCertificateReferenceFor(certificatesByID[containment.CertificateID], payload.RegistryGeneration)
		conformanceRuntimeReference := runtimeEvidenceCertificateReferenceFor(certificatesByID[conformance.CertificateID], payload.RegistryGeneration)
		decision := classifyExecutableLaneEvidence(executableLaneEvidenceInput{
			Authority: authority, ExpectedLaneIdentityHash: vector.LaneIdentityHash,
			EvaluationInstant: now.Format(canonicalJSONInstantLayout), ActiveRegistryGeneration: payload.RegistryGeneration,
			ContainmentCertificate: &containmentRuntimeReference, ConformanceCertificate: &conformanceRuntimeReference,
		})
		if decision.Status != executableLaneEvidenceCounted {
			t.Fatalf("exact successor %s lane is not counted: %+v", vector.Side, decision)
		}
		containmentReference := creationCertificateSnapshot(containmentRuntimeReference)
		conformanceReference := creationCertificateSnapshot(conformanceRuntimeReference)
		entrants = append(entrants, goEntrantExecutionEvidence{
			EntrantKey: "fixture:entrant:" + vector.Side + ":v1.17", StrategyRevisionID: vector.StrategyRevisionID, LaneIdentity: vector.Deployed,
			ContainmentCertificateRef: containmentReference, ConformanceCertificateRef: &conformanceReference,
			SchedulingDecision: goSchedulingDecision{
				Status: decision.Status, ReasonCode: decision.ReasonCode, EvaluatedAt: now.Format(canonicalJSONInstantLayout),
				FreshUntil: payload.ValidUntil, RegistryGeneration: payload.RegistryGeneration,
			},
		})
	}
	sort.Slice(entrants, func(left, right int) bool { return entrants[left].EntrantKey < entrants[right].EntrantKey })
	integrity, err := createGoMatchSetIntegrityIdentity(authority, entrants)
	if err != nil {
		t.Fatal(err)
	}
	pair, err := integrity.pair(entrants[0].EntrantKey, entrants[1].EntrantKey, entrants[0].StrategyRevisionID, entrants[1].StrategyRevisionID)
	if err != nil {
		t.Fatal(err)
	}
	attestationIDs := append([]string(nil), fixture.InstallFixture.Expected.AttestationIDs...)
	certificateIDs := append([]string(nil), fixture.InstallFixture.Expected.CertificateIDs...)
	sourceSet := map[string]any{"attestationIds": attestationIDs, "certificateIds": certificateIDs, "revocationIds": []string{}, "supersessionIds": []string{}, "laneControlIds": []string{}}
	identity := &claimedMatchIntegrityIdentity{
		MatchSetID: "fixture:match-set:v1.17", CompatibilityTupleID: fixture.SemanticTupleID, CompatibilityTuple: fixture.SemanticTuple,
		AuthorityBundleHash: authority.AuthorityBundleHash, RegistryGeneration: payload.RegistryGeneration,
		EvidenceSetHash: integrity.EvidenceSetHash, PairHash: pair.PairHash,
		PublicationID: "fixture:legacy-projection:publication:v1.17", InstallReceiptID: "fixture:legacy-projection:installed:v1.17",
		PayloadSHA256: authority.AuthorityBundleHash, EnvelopeSHA256: authority.EnvelopeSHA256,
		SourceManifestHash: payload.SourceManifestHash, SourceSet: sourceSet,
		Bottom: entrants[0], Top: entrants[1],
	}
	if identity.Bottom.LaneIdentity.LanguageID != "typescript" || identity.Bottom.StrategyRevisionID != baseRequest.Match.BottomStrategyRevisionID {
		identity.Bottom, identity.Top = identity.Top, identity.Bottom
	}
	identity.RuntimeServiceV117 = exactClaimedRuntimeServiceFixtureV117(t, fixture, payload, *identity)
	if err := validateClaimedMatchIntegrity(authority, identity, now); err != nil {
		t.Fatalf("exact successor claimed identity is invalid before persistence: %v", err)
	}

	receipt := semanticCurrentReceipt(identity)
	if _, err := pool.Exec(ctx, `insert into runtime_evidence_authority_publications
		(id,generation,semantic_tuple_manifest_hash,source_manifest_hash,payload_sha256,envelope_sha256,signer_key_id,trust_domain,issued_at,valid_from,valid_until,payload_bytes,envelope_bytes,attestation_ids,certificate_ids,revocation_ids,supersession_ids,lane_control_ids)
		values ($1,$2::bigint,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'[]','[]','[]')`,
		identity.PublicationID, payload.RegistryGeneration, identity.CompatibilityTupleID, identity.SourceManifestHash, identity.PayloadSHA256,
		identity.EnvelopeSHA256, fixture.InstallFixture.SignerKeyID, runtimeEvidenceAuthorityProductionTrustDomain,
		issuedAt, validFrom, validUntil, []byte("fixture legacy projection "+identity.PayloadSHA256), []byte("fixture legacy envelope "+identity.EnvelopeSHA256), attestationIDs, certificateIDs); err != nil {
		t.Fatal(err)
	}
	for _, sourceID := range attestationIDs {
		if _, err := pool.Exec(ctx, `insert into runtime_evidence_authority_publication_sources(publication_id,source_type,source_id,source_record_hash,attestation_id) values ($1,'attestation',$2,$3,$2)`, identity.PublicationID, sourceID, attestationSourceHashes[sourceID]); err != nil {
			t.Fatal(err)
		}
	}
	for _, sourceID := range certificateIDs {
		if _, err := pool.Exec(ctx, `insert into runtime_evidence_authority_publication_sources(publication_id,source_type,source_id,source_record_hash,certificate_id) values ($1,'certificate',$2,$3,$2)`, identity.PublicationID, sourceID, certificateSourceHashes[sourceID]); err != nil {
			t.Fatal(err)
		}
	}
	if _, err := pool.Exec(ctx, `insert into runtime_evidence_authority_publication_events
		(id,publication_id,event_kind,attempt_id,envelope_sha256,receipt,occurred_at)
		values ($1,$2,'installed','fixture:legacy-projection:attempt:v1.17',$3,$4,$5)`, identity.InstallReceiptID, identity.PublicationID, identity.EnvelopeSHA256, receipt, now); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, `insert into runtime_evidence_v1_17_installed_authorities
		(id,authority_bundle_hash,source_manifest_hash,registry_generation,semantic_tuple_manifest_hash,envelope_sha256,trust_domain,signer_key_id,install_receipt_id,install_receipt_hash,issued_at,valid_from,valid_until,installed_at,payload_bytes,envelope_bytes,attestation_ids,certificate_ids,install_receipt)
		values ($1,$2,$3,$4,$5,$6,$7,$8,$1,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
		fixture.InstallFixture.Expected.InstallReceiptID, fixture.InstallFixture.Expected.AuthorityBundleHash,
		fixture.InstallFixture.Expected.SourceManifestHash, fixture.InstallFixture.Expected.RegistryGeneration,
		fixture.InstallFixture.Expected.SemanticTupleManifestHash, fixture.InstallFixture.Expected.EnvelopeSHA256,
		fixture.InstallFixture.TrustDomain, fixture.InstallFixture.SignerKeyID, fixture.InstallFixture.Expected.InstallReceiptHash,
		issuedAt, validFrom, validUntil, installedAt, payloadBytes, envelopeBytes, attestationIDs, certificateIDs,
		fixture.InstallFixture.Expected.InstallReceipt); err != nil {
		t.Fatal(err)
	}
	assertExactInstalledSuccessorFixtureV117(t, ctx, pool, fixture, payloadBytes, envelopeBytes)

	if _, err := pool.Exec(ctx, `insert into match_sets
		(id,status,matrix,compatibility_tuple_id,compatibility_rules_version,compatibility_engine_version,compatibility_runtime_abi_version,compatibility_chronicle_version,compatibility_arena_catalog_version,compatibility_set_policy_version,authority_bundle_hash,authority_registry_generation,execution_evidence_set,execution_evidence_set_hash,authority_publication_id,authority_install_receipt_id,authority_payload_sha256,authority_envelope_sha256,authority_source_manifest_hash,authority_source_set)
		values ($1,'running','{}',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
		identity.MatchSetID, identity.CompatibilityTupleID, fixture.SemanticTuple.Rules, fixture.SemanticTuple.Engine, fixture.SemanticTuple.RuntimeABI,
		fixture.SemanticTuple.Chronicle, fixture.SemanticTuple.ArenaCatalog, fixture.SemanticTuple.SetPolicy,
		strings.TrimPrefix(identity.AuthorityBundleHash, "sha256:"), payload.RegistryGeneration, entrants, identity.EvidenceSetHash,
		identity.PublicationID, identity.InstallReceiptID, identity.PayloadSHA256, identity.EnvelopeSHA256, identity.SourceManifestHash, identity.SourceSet); err != nil {
		t.Fatal(err)
	}
	for _, entrant := range entrants {
		if entrant.ConformanceCertificateRef == nil {
			t.Fatal("exact successor entrant lacks conformance evidence")
		}
		if _, err := pool.Exec(ctx, `insert into match_set_execution_entrants
			(match_set_id,entrant_key,strategy_revision_id,lane_identity,lane_identity_hash,containment_certificate_kind,containment_certificate_id,containment_certificate_version,containment_certificate_hash,conformance_certificate_kind,conformance_certificate_id,conformance_certificate_version,conformance_certificate_hash,scheduling_status,scheduling_reason_code,scheduling_evaluated_at,scheduling_fresh_until,authority_bundle_hash,authority_registry_generation,execution_snapshot)
			values ($1,$2,$3,$4,$5,'containment',$6,$7,$8,'conformance',$9,$10,$11,'counted',$12,$13,$14,$15,$16,$17)`,
			identity.MatchSetID, entrant.EntrantKey, entrant.StrategyRevisionID, entrant.LaneIdentity, hashCreationLaneIdentity(entrant.LaneIdentity),
			entrant.ContainmentCertificateRef.CertificateID, entrant.ContainmentCertificateRef.CertificateVersion, entrant.ContainmentCertificateRef.CertificateRecordHash,
			entrant.ConformanceCertificateRef.CertificateID, entrant.ConformanceCertificateRef.CertificateVersion, entrant.ConformanceCertificateRef.CertificateRecordHash,
			entrant.SchedulingDecision.ReasonCode, now, validUntil, strings.TrimPrefix(identity.AuthorityBundleHash, "sha256:"), payload.RegistryGeneration, entrant); err != nil {
			t.Fatal(err)
		}
	}
	return &semanticCurrentAuthorityFixture{authority: authority, identity: identity, request: baseRequest}, registry
}

func mustParseFixtureInstantV117(t *testing.T, value string) time.Time {
	t.Helper()
	instant, err := parseCanonicalInstant(value)
	if err != nil {
		t.Fatal(err)
	}
	return instant
}

func certificateForFixtureAttestationV117(certificates []runtimeSuccessorCertificateFixtureV117, attestationID string) (runtimeSuccessorCertificateFixtureV117, bool) {
	var result runtimeSuccessorCertificateFixtureV117
	found := false
	for _, certificate := range certificates {
		if certificate.AttestationID == attestationID {
			if found {
				return runtimeSuccessorCertificateFixtureV117{}, false
			}
			result, found = certificate, true
		}
	}
	return result, found
}

func certificateForFixtureSideAndKindV117(t *testing.T, payload runtimeSuccessorAuthorityPayloadFixtureV117, vector runtimeSuccessorRevisionVectorV117, kind string) runtimeSuccessorCertificateFixtureV117 {
	t.Helper()
	var result runtimeSuccessorCertificateFixtureV117
	found := false
	for _, certificate := range payload.Certificates {
		if certificate.CertificateKind == kind && certificate.Binding.IdentityManifestRoot == vector.Expected.IdentityManifestRoot {
			if found {
				t.Fatalf("fixture has ambiguous %s %s certificate", vector.Side, kind)
			}
			result, found = certificate, true
		}
	}
	if !found {
		t.Fatalf("fixture lacks %s %s certificate", vector.Side, kind)
	}
	return result
}

func exactClaimedRuntimeServiceFixtureV117(t *testing.T, fixture runtimeSuccessorAuthorityFixtureV117, payload runtimeSuccessorAuthorityPayloadFixtureV117, identity claimedMatchIntegrityIdentity) *claimedRuntimeServiceV117 {
	t.Helper()
	entrant := func(evidence goEntrantExecutionEvidence) claimedRuntimeServiceEntrantV117 {
		var vector *runtimeSuccessorRevisionVectorV117
		for index := range fixture.RevisionVectors {
			if fixture.RevisionVectors[index].StrategyRevisionID == evidence.StrategyRevisionID {
				vector = &fixture.RevisionVectors[index]
				break
			}
		}
		if vector == nil || evidence.ConformanceCertificateRef == nil {
			t.Fatal("exact claimed successor entrant is incomplete")
		}
		conformanceID, conformanceKind := evidence.ConformanceCertificateRef.CertificateID, evidence.ConformanceCertificateRef.Kind
		return claimedRuntimeServiceEntrantV117{
			StrategyRevisionID: evidence.StrategyRevisionID, LaneIdentityHash: vector.LaneIdentityHash,
			ContainmentCertificateID: evidence.ContainmentCertificateRef.CertificateID, ContainmentCertificateKind: evidence.ContainmentCertificateRef.Kind,
			ConformanceCertificateID: &conformanceID, ConformanceCertificateKind: &conformanceKind,
			IdentityManifestRoot: vector.Expected.IdentityManifestRoot,
			EvidenceGraphRoot:    certificateForFixtureSideAndKindV117(t, payload, *vector, "containment").Binding.EvidenceGraphRoot,
			ExactPins:            vector.Expected.ExactPins,
		}
	}
	return &claimedRuntimeServiceV117{
		Authority: claimedRuntimeServiceAuthorityV117{
			BundleHash: fixture.InstallFixture.Expected.AuthorityBundleHash, SourceManifestHash: fixture.InstallFixture.Expected.SourceManifestHash,
			RegistryGeneration: fixture.InstallFixture.Expected.RegistryGeneration, SemanticTupleManifestHash: fixture.InstallFixture.Expected.SemanticTupleManifestHash,
			InstallReceiptID: fixture.InstallFixture.Expected.InstallReceiptID, InstallReceiptHash: fixture.InstallFixture.Expected.InstallReceiptHash,
		},
		BudgetProfileSHA256: runtimeServiceV117BudgetProfileSHA256, LedgerPrestateRoot: runtimeServiceV117EmptyLedgerRoot,
		Bottom: entrant(identity.Bottom), Top: entrant(identity.Top),
	}
}

func assertExactInstalledSuccessorFixtureV117(t *testing.T, ctx context.Context, pool *pgxpool.Pool, fixture runtimeSuccessorAuthorityFixtureV117, payloadBytes []byte, envelopeBytes []byte) {
	t.Helper()
	var bundleHash, sourceHash, tupleID, envelopeHash, receiptID, receiptHash string
	var storedPayload, storedEnvelope []byte
	var attestationIDs, certificateIDs []string
	var receipt map[string]any
	if err := pool.QueryRow(ctx, `select authority_bundle_hash,source_manifest_hash,semantic_tuple_manifest_hash,envelope_sha256,install_receipt_id,install_receipt_hash,payload_bytes,envelope_bytes,attestation_ids,certificate_ids,install_receipt from runtime_evidence_v1_17_installed_authorities where id=$1`, fixture.InstallFixture.Expected.InstallReceiptID).Scan(
		&bundleHash, &sourceHash, &tupleID, &envelopeHash, &receiptID, &receiptHash, &storedPayload, &storedEnvelope, &attestationIDs, &certificateIDs, &receipt,
	); err != nil {
		t.Fatal(err)
	}
	if bundleHash != fixture.InstallFixture.Expected.AuthorityBundleHash || sourceHash != fixture.InstallFixture.Expected.SourceManifestHash ||
		tupleID != fixture.InstallFixture.Expected.SemanticTupleManifestHash || envelopeHash != fixture.InstallFixture.Expected.EnvelopeSHA256 ||
		receiptID != fixture.InstallFixture.Expected.InstallReceiptID || receiptHash != fixture.InstallFixture.Expected.InstallReceiptHash ||
		!reflect.DeepEqual(storedPayload, payloadBytes) || !reflect.DeepEqual(storedEnvelope, envelopeBytes) ||
		!reflect.DeepEqual(attestationIDs, fixture.InstallFixture.Expected.AttestationIDs) ||
		!reflect.DeepEqual(certificateIDs, fixture.InstallFixture.Expected.CertificateIDs) ||
		!jsonValuesEqual(receipt, fixture.InstallFixture.Expected.InstallReceipt) {
		t.Fatal("persisted successor authority is not the exact signed fixture row")
	}
}
