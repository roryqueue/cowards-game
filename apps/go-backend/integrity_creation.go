package main

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

const creationEvidenceSetDomain = "cowards-game:match-set-execution-evidence-set:v1"
const creationEvidencePairDomain = "cowards-game:match-execution-evidence-pair:v1"
const creationLaneIdentityDomain = "cowards-game:executable-lane-identity:v1"

type exhibitionCreationDependencies struct {
	loadEntrants    func(context.Context, string, []string, time.Time) ([]map[string]any, error)
	loadAuthority   func() (*verifiedRuntimeEvidenceAuthority, error)
	resolveEvidence func(context.Context, *verifiedRuntimeEvidenceAuthority, []map[string]any, bool, time.Time) (*goMatchSetIntegrityIdentity, error)
	begin           func(context.Context) (pgx.Tx, error)
}

type goExecutableLaneIdentity struct {
	ProviderID       string                      `json:"providerId"`
	LanguageID       string                      `json:"languageId"`
	RuntimeID        string                      `json:"runtimeId"`
	RuntimeVersion   string                      `json:"runtimeVersion"`
	ToolchainID      string                      `json:"toolchainId"`
	ToolchainVersion string                      `json:"toolchainVersion"`
	AdapterID        string                      `json:"adapterId"`
	AdapterVersion   string                      `json:"adapterVersion"`
	PolicyID         string                      `json:"policyId"`
	PolicyVersion    string                      `json:"policyVersion"`
	CorpusID         string                      `json:"corpusId"`
	CorpusVersion    string                      `json:"corpusVersion"`
	ArtifactID       string                      `json:"artifactId"`
	ArtifactSHA256   string                      `json:"artifactSha256"`
	ImplementationID string                      `json:"implementationId"`
	BuildID          string                      `json:"buildId"`
	SemanticTupleID  string                      `json:"semanticTupleId"`
	SemanticTuple    canonicalCompatibilityTuple `json:"semanticTuple"`
}

type goExecutionCertificateReference struct {
	Kind                  string `json:"kind"`
	CertificateID         string `json:"certificateId"`
	CertificateVersion    string `json:"certificateVersion"`
	CertificateRecordHash string `json:"certificateRecordHash"`
	RegistryGeneration    string `json:"registryGeneration"`
}

type goSchedulingDecision struct {
	Status             executableLaneEvidenceStatus `json:"status"`
	ReasonCode         string                       `json:"reasonCode"`
	EvaluatedAt        string                       `json:"evaluatedAt"`
	FreshUntil         string                       `json:"freshUntil"`
	RegistryGeneration string                       `json:"registryGeneration"`
}

type goEntrantExecutionEvidence struct {
	EntrantKey                string                           `json:"entrantKey"`
	StrategyRevisionID        string                           `json:"strategyRevisionId"`
	LaneIdentity              goExecutableLaneIdentity         `json:"laneIdentity"`
	ContainmentCertificateRef goExecutionCertificateReference  `json:"containmentCertificateRef"`
	ConformanceCertificateRef *goExecutionCertificateReference `json:"conformanceCertificateRef"`
	SchedulingDecision        goSchedulingDecision             `json:"schedulingDecision"`
}

type goMatchSetIntegrityIdentity struct {
	Tuple               registeredCompatibilityTuple
	AuthorityBundleHash string
	RegistryGeneration  string
	Entrants            []goEntrantExecutionEvidence
	ByKey               map[string]goEntrantExecutionEvidence
	EvidenceSetHash     string
}

type goExecutionEvidencePair struct {
	Bottom   goEntrantExecutionEvidence
	Top      goEntrantExecutionEvidence
	PairHash string
}

type installedAuthorityReceipt struct {
	PublicationID      string         `json:"publicationId"`
	ReceiptID          string         `json:"receiptId"`
	Generation         string         `json:"generation"`
	PayloadSHA256      string         `json:"payloadSha256"`
	EnvelopeSHA256     string         `json:"envelopeSha256"`
	SourceManifestHash string         `json:"sourceManifestHash"`
	SourceSet          map[string]any `json:"sourceSet"`
}

type creationCertificateRow struct {
	ID                 string
	Kind               string
	Version            string
	RecordHash         string
	LaneHash           string
	Lane               goExecutableLaneIdentity
	RegistryGeneration string
	IssuedAt           time.Time
	FreshUntil         time.Time
}

func creationPurposeAllowsStatus(counted bool, status executableLaneEvidenceStatus) bool {
	if counted {
		return status == executableLaneEvidenceCounted
	}
	return status == executableLaneEvidenceExhibitionOnly || status == executableLaneEvidenceCounted
}

func (server *LiveServer) defaultExhibitionCreationDependencies() exhibitionCreationDependencies {
	return exhibitionCreationDependencies{
		loadEntrants: func(ctx context.Context, userID string, revisionIDs []string, lockedAt time.Time) ([]map[string]any, error) {
			return server.loadOwnedEntrants(ctx, userID, revisionIDs, lockedAt)
		},
		loadAuthority: func() (*verifiedRuntimeEvidenceAuthority, error) {
			if server.loadAuthority != nil {
				return server.loadAuthority()
			}
			if server.authority == nil {
				return nil, errors.New("creation authority unavailable")
			}
			return server.authority, nil
		},
		resolveEvidence: server.resolveCreationEvidence,
		begin: func(ctx context.Context) (pgx.Tx, error) {
			if server.pool == nil {
				return nil, errors.New("creation database unavailable")
			}
			return server.pool.Begin(ctx)
		},
	}
}

func (server *LiveServer) resolveCreationEvidence(ctx context.Context, authority *verifiedRuntimeEvidenceAuthority, entrants []map[string]any, counted bool, now time.Time) (*goMatchSetIntegrityIdentity, error) {
	if server.pool == nil || authority == nil || authority.TrustDomain != runtimeEvidenceAuthorityProductionTrustDomain || authority.RegistryGeneration == "" || authority.CompatibilityTuple.TupleID == "" {
		return nil, errors.New("creation integrity unavailable")
	}
	certificateIDs := make([]string, 0, len(authority.Payload.Certificates))
	authorityCertificateByID := make(map[string]runtimeEvidenceAuthorityCertificate, len(authority.Payload.Certificates))
	for _, certificate := range authority.Payload.Certificates {
		certificateIDs = append(certificateIDs, certificate.CertificateID)
		authorityCertificateByID[certificate.CertificateID] = certificate
	}
	if len(certificateIDs) == 0 {
		return nil, errors.New("creation integrity unavailable")
	}
	rows, err := server.pool.Query(ctx, `
		select id, certificate_kind, certificate_version,
		       certificate_record_hash, lane_identity_hash, lane_identity,
		       registry_generation, issued_at, fresh_until
		  from runtime_evidence_certificates
		 where id = any($1::text[]) and certificate_status = 'passed'
		 order by id
	`, certificateIDs)
	if err != nil {
		return nil, errors.New("creation integrity unavailable")
	}
	defer rows.Close()
	certificateRows := []creationCertificateRow{}
	for rows.Next() {
		var row creationCertificateRow
		var laneJSON []byte
		if err := rows.Scan(&row.ID, &row.Kind, &row.Version, &row.RecordHash, &row.LaneHash, &laneJSON, &row.RegistryGeneration, &row.IssuedAt, &row.FreshUntil); err != nil {
			return nil, errors.New("creation integrity unavailable")
		}
		if err := decodeStrictJSON(laneJSON, &row.Lane); err != nil {
			return nil, errors.New("creation integrity unavailable")
		}
		authorityCertificate, ok := authorityCertificateByID[row.ID]
		if !ok || authorityCertificate.Kind != row.Kind || authorityCertificate.CertificateVersion != row.Version || authorityCertificate.CertificateRecordHash != "sha256:"+row.RecordHash || authorityCertificate.LaneIdentityHash != "sha256:"+row.LaneHash || authorityCertificate.LaneIdentity != row.Lane || row.RegistryGeneration != authority.RegistryGeneration || row.LaneHash != hashCreationLaneIdentity(row.Lane) || now.Before(row.IssuedAt) || now.After(row.FreshUntil) {
			return nil, errors.New("creation integrity unavailable")
		}
		certificateRows = append(certificateRows, row)
	}
	if err := rows.Err(); err != nil || len(certificateRows) != len(authority.Payload.Certificates) {
		return nil, errors.New("creation integrity unavailable")
	}

	evaluatedAt := now.UTC().Format(canonicalJSONInstantLayout)
	evidence := make([]goEntrantExecutionEvidence, 0, len(entrants))
	for _, entrant := range entrants {
		matching := map[string][]creationCertificateRow{}
		for _, certificate := range certificateRows {
			if creationLaneMatchesEntrant(certificate.Lane, entrant, authority.CompatibilityTuple) {
				matching[certificate.Kind] = append(matching[certificate.Kind], certificate)
			}
		}
		containments := matching["containment"]
		conformances := matching["conformance"]
		if len(containments) != 1 || len(conformances) > 1 {
			return nil, errors.New("creation integrity unavailable")
		}
		containment := containments[0]
		containmentRef := runtimeEvidenceCertificateReferenceFor(authorityCertificateByID[containment.ID], authority.RegistryGeneration)
		var conformanceRef *runtimeEvidenceCertificateReference
		var conformanceSnapshot *goExecutionCertificateReference
		freshUntil := containment.FreshUntil
		if len(conformances) == 1 {
			conformance := conformances[0]
			value := runtimeEvidenceCertificateReferenceFor(authorityCertificateByID[conformance.ID], authority.RegistryGeneration)
			conformanceRef = &value
			if conformance.FreshUntil.Before(freshUntil) {
				freshUntil = conformance.FreshUntil
			}
			converted := creationCertificateSnapshot(value)
			conformanceSnapshot = &converted
		}
		result := classifyExecutableLaneEvidence(executableLaneEvidenceInput{
			Authority: authority, ExpectedLaneIdentityHash: "sha256:" + containment.LaneHash,
			EvaluationInstant: evaluatedAt, ActiveRegistryGeneration: authority.RegistryGeneration,
			ContainmentCertificate: &containmentRef, ConformanceCertificate: conformanceRef,
		})
		if !creationPurposeAllowsStatus(counted, result.Status) {
			return nil, errors.New("creation integrity unavailable")
		}
		evidence = append(evidence, goEntrantExecutionEvidence{
			EntrantKey: stringValue(entrant, "entrantId"), StrategyRevisionID: stringValue(entrant, "strategyRevisionId"),
			LaneIdentity: containment.Lane, ContainmentCertificateRef: creationCertificateSnapshot(containmentRef),
			ConformanceCertificateRef: conformanceSnapshot,
			SchedulingDecision:        goSchedulingDecision{Status: result.Status, ReasonCode: result.ReasonCode, EvaluatedAt: evaluatedAt, FreshUntil: freshUntil.UTC().Format(canonicalJSONInstantLayout), RegistryGeneration: authority.RegistryGeneration},
		})
	}
	return createGoMatchSetIntegrityIdentity(authority, evidence)
}

func creationCertificateSnapshot(reference runtimeEvidenceCertificateReference) goExecutionCertificateReference {
	return goExecutionCertificateReference{Kind: reference.Kind, CertificateID: reference.CertificateID, CertificateVersion: reference.CertificateVersion, CertificateRecordHash: strings.TrimPrefix(reference.CertificateRecordHash, "sha256:"), RegistryGeneration: reference.RegistryGeneration}
}

func creationLaneMatchesEntrant(lane goExecutableLaneIdentity, entrant map[string]any, tuple registeredCompatibilityTuple) bool {
	if lane.SemanticTupleID != tuple.TupleID || lane.SemanticTuple != tuple.Tuple {
		return false
	}
	expectedMap := mapValue(entrant, "_creationLaneIdentity")
	if len(expectedMap) == 0 {
		return false
	}
	expectedBytes, err := json.Marshal(expectedMap)
	if err != nil {
		return false
	}
	var expected goExecutableLaneIdentity
	if err := decodeStrictJSON(expectedBytes, &expected); err != nil || expected != lane || hashCreationLaneIdentity(expected) != hashCreationLaneIdentity(lane) {
		return false
	}
	runtime := mapValue(entrant, "_creationRuntime")
	metadata := mapValue(entrant, "_creationMetadata")
	if lane.LanguageID != stringValue(mapValue(runtime, "language"), "id") || lane.AdapterID != stringValue(mapValue(runtime, "adapter"), "id") || lane.AdapterVersion != stringValue(mapValue(runtime, "adapter"), "version") || lane.SemanticTuple.RuntimeABI != stringValue(runtime, "abiVersion") {
		return false
	}
	provider := mapValue(metadata, "providerValidation")
	if lane.ProviderID != stringValue(provider, "providerId") {
		return false
	}
	artifact := mapValue(metadata, "sourceArtifact")
	if len(artifact) == 0 {
		artifact = mapValue(metadata, "compiledArtifact")
	}
	return lane.ArtifactSHA256 != "" && lane.ArtifactSHA256 == stringValue(artifact, "hash")
}

func createGoMatchSetIntegrityIdentity(authority *verifiedRuntimeEvidenceAuthority, entrants []goEntrantExecutionEvidence) (*goMatchSetIntegrityIdentity, error) {
	if authority == nil || len(entrants) < 2 || len(entrants) > 8 || !isPrefixedLowerSHA256(authority.AuthorityBundleHash) {
		return nil, errors.New("creation integrity unavailable")
	}
	sort.Slice(entrants, func(i, j int) bool { return entrants[i].EntrantKey < entrants[j].EntrantKey })
	byKey := map[string]goEntrantExecutionEvidence{}
	values := []string{authority.CompatibilityTuple.TupleID, authority.CompatibilityTuple.Tuple.Rules, authority.CompatibilityTuple.Tuple.Engine, authority.CompatibilityTuple.Tuple.RuntimeABI, authority.CompatibilityTuple.Tuple.Chronicle, authority.CompatibilityTuple.Tuple.ArenaCatalog, authority.CompatibilityTuple.Tuple.SetPolicy, strings.TrimPrefix(authority.AuthorityBundleHash, "sha256:"), authority.RegistryGeneration}
	for _, entrant := range entrants {
		if entrant.EntrantKey == "" || entrant.StrategyRevisionID == "" || byKey[entrant.EntrantKey].EntrantKey != "" {
			return nil, errors.New("creation integrity unavailable")
		}
		byKey[entrant.EntrantKey] = entrant
		values = append(values, creationEntrantHashValues(entrant)...)
	}
	return &goMatchSetIntegrityIdentity{Tuple: authority.CompatibilityTuple, AuthorityBundleHash: strings.TrimPrefix(authority.AuthorityBundleHash, "sha256:"), RegistryGeneration: authority.RegistryGeneration, Entrants: entrants, ByKey: byKey, EvidenceSetHash: framedCreationHash(creationEvidenceSetDomain, values)}, nil
}

func creationEntrantHashValues(entrant goEntrantExecutionEvidence) []string {
	lane := entrant.LaneIdentity
	values := []string{entrant.EntrantKey, entrant.StrategyRevisionID, lane.ProviderID, lane.LanguageID, lane.RuntimeID, lane.RuntimeVersion, lane.ToolchainID, lane.ToolchainVersion, lane.AdapterID, lane.AdapterVersion, lane.PolicyID, lane.PolicyVersion, lane.CorpusID, lane.CorpusVersion, lane.ArtifactID, lane.ArtifactSHA256, lane.ImplementationID, lane.BuildID, lane.SemanticTupleID, lane.SemanticTuple.Rules, lane.SemanticTuple.Engine, lane.SemanticTuple.RuntimeABI, lane.SemanticTuple.Chronicle, lane.SemanticTuple.ArenaCatalog, lane.SemanticTuple.SetPolicy}
	values = append(values, creationCertificateHashValues(&entrant.ContainmentCertificateRef)...)
	values = append(values, creationCertificateHashValues(entrant.ConformanceCertificateRef)...)
	return append(values, string(entrant.SchedulingDecision.Status), entrant.SchedulingDecision.ReasonCode, entrant.SchedulingDecision.EvaluatedAt, entrant.SchedulingDecision.FreshUntil, entrant.SchedulingDecision.RegistryGeneration)
}

func creationCertificateHashValues(reference *goExecutionCertificateReference) []string {
	if reference == nil {
		return []string{"", "", "", "", ""}
	}
	return []string{reference.Kind, reference.CertificateID, reference.CertificateVersion, reference.CertificateRecordHash, reference.RegistryGeneration}
}

func hashCreationLaneIdentity(lane goExecutableLaneIdentity) string {
	values := creationEntrantHashValues(goEntrantExecutionEvidence{LaneIdentity: lane})[2:25]
	return framedCreationHash(creationLaneIdentityDomain, values)
}

func framedCreationHash(domain string, values []string) string {
	hash := sha256.New()
	_, _ = hash.Write([]byte(domain))
	_, _ = hash.Write([]byte{0})
	for _, value := range values {
		bytes := []byte(value)
		_, _ = hash.Write([]byte(fmt.Sprintf("%d", len(bytes))))
		_, _ = hash.Write([]byte{0})
		_, _ = hash.Write(bytes)
		_, _ = hash.Write([]byte{0})
	}
	return hex.EncodeToString(hash.Sum(nil))
}

func (identity *goMatchSetIntegrityIdentity) pair(bottomKey string, topKey string, bottomRevision string, topRevision string) (goExecutionEvidencePair, error) {
	bottom, bottomOK := identity.ByKey[bottomKey]
	top, topOK := identity.ByKey[topKey]
	if !bottomOK || !topOK || bottomKey == topKey || bottom.StrategyRevisionID != bottomRevision || top.StrategyRevisionID != topRevision {
		return goExecutionEvidencePair{}, errors.New("creation integrity unavailable")
	}
	return goExecutionEvidencePair{Bottom: bottom, Top: top, PairHash: framedCreationHash(creationEvidencePairDomain, []string{identity.EvidenceSetHash, bottomKey, bottomRevision, topKey, topRevision})}, nil
}

func (server *LiveServer) lockInstalledAuthorityReceipt(ctx context.Context, tx pgx.Tx, authority *verifiedRuntimeEvidenceAuthority, now time.Time) (*installedAuthorityReceipt, error) {
	var publicationID, generation, tupleID, sourceHash, payloadHash, envelopeHash, trustDomain string
	var receiptID, eventKind, eventEnvelope string
	var reasonCode *string
	var receiptJSON, attestationIDs, certificateIDs, revocationIDs, supersessionIDs, laneControlIDs []byte
	err := tx.QueryRow(ctx, `
		select p.id, p.generation::text, p.semantic_tuple_manifest_hash,
		       p.source_manifest_hash, p.payload_sha256, p.envelope_sha256,
		       p.trust_domain, p.attestation_ids, p.certificate_ids,
		       p.revocation_ids, p.supersession_ids, p.lane_control_ids,
		       e.id, e.event_kind, e.envelope_sha256, e.reason_code, e.receipt
		  from runtime_evidence_authority_publication_head h
		  join runtime_evidence_authority_publications p
		    on p.generation = $1::bigint and p.generation < h.next_generation
		  join lateral (
		    select id, event_kind, envelope_sha256, reason_code, receipt
		      from runtime_evidence_authority_publication_events
		     where publication_id = p.id and event_kind in ('installed','failed','uncertain')
		     order by occurred_at desc, id desc limit 1
		  ) e on true
		 where h.singleton = true and p.issued_at <= $2 and p.valid_from <= $2 and p.valid_until >= $2
		 for share of h, p
	`, authority.RegistryGeneration, now).Scan(&publicationID, &generation, &tupleID, &sourceHash, &payloadHash, &envelopeHash, &trustDomain, &attestationIDs, &certificateIDs, &revocationIDs, &supersessionIDs, &laneControlIDs, &receiptID, &eventKind, &eventEnvelope, &reasonCode, &receiptJSON)
	if err != nil || eventKind != "installed" || reasonCode != nil || generation != authority.RegistryGeneration || tupleID != authority.SemanticTupleManifestHash || payloadHash != authority.AuthorityBundleHash || envelopeHash != authority.EnvelopeSHA256 || eventEnvelope != envelopeHash || trustDomain != runtimeEvidenceAuthorityProductionTrustDomain {
		return nil, errors.New("creation integrity unavailable")
	}
	var receipt map[string]any
	if err := decodeStrictJSON(receiptJSON, &receipt); err != nil || stringValue(receipt, "schemaVersion") != "v1.37-runtime-evidence-authority-install-receipt-v1" || stringValue(receipt, "generation") != generation || stringValue(receipt, "payloadSha256") != payloadHash || stringValue(receipt, "envelopeSha256") != envelopeHash || stringValue(receipt, "sourceManifestHash") != sourceHash {
		return nil, errors.New("creation integrity unavailable")
	}
	sourceSet := map[string]any{}
	for key, raw := range map[string][]byte{"attestationIds": attestationIDs, "certificateIds": certificateIDs, "revocationIds": revocationIDs, "supersessionIds": supersessionIDs, "laneControlIds": laneControlIDs} {
		var ids []string
		if err := json.Unmarshal(raw, &ids); err != nil || !sort.StringsAreSorted(ids) {
			return nil, errors.New("creation integrity unavailable")
		}
		sourceSet[key] = ids
	}
	if !jsonSemanticEqual(mapValue(receipt, "sourceIds"), sourceSet) {
		return nil, errors.New("creation integrity unavailable")
	}
	sourceRows, err := tx.Query(ctx, `
		select s.source_type, s.source_id, s.source_record_hash,
		       case s.source_type
		         when 'attestation' then 'sha256:' || a.attestation_sha256
		         when 'certificate' then 'sha256:' || c.certificate_record_hash
		         when 'revocation' then 'sha256:' || r.envelope_hash
		         when 'supersession' then 'sha256:' || x.envelope_hash
		         when 'lane-control' then 'sha256:' || l.envelope_hash
		       end as current_hash
		  from runtime_evidence_authority_publication_sources s
		  left join runtime_evidence_verified_attestations a on s.source_type='attestation' and a.id=s.attestation_id and a.verification_status='passed'
		  left join runtime_evidence_certificates c on s.source_type='certificate' and c.id=s.certificate_id and c.certificate_status='passed'
		  left join runtime_evidence_certificate_revocations r on s.source_type='revocation' and r.id=s.revocation_id and r.verification_status='passed'
		  left join runtime_evidence_certificate_supersessions x on s.source_type='supersession' and x.id=s.supersession_id and x.verification_status='passed'
		  left join runtime_evidence_lane_controls l on s.source_type='lane-control' and l.id=s.lane_control_id and l.verification_status='passed'
		 where s.publication_id=$1 order by s.source_type, s.source_id for share of s
	`, publicationID)
	if err != nil {
		return nil, errors.New("creation integrity unavailable")
	}
	defer sourceRows.Close()
	count := 0
	for sourceRows.Next() {
		var sourceType, sourceID, storedHash string
		var currentHash *string
		if sourceRows.Scan(&sourceType, &sourceID, &storedHash, &currentHash) != nil || currentHash == nil || storedHash != *currentHash || !sourceSetContains(sourceSet, sourceType, sourceID) {
			return nil, errors.New("creation integrity unavailable")
		}
		count++
	}
	if sourceRows.Err() != nil || count != sourceSetCount(sourceSet) {
		return nil, errors.New("creation integrity unavailable")
	}
	return &installedAuthorityReceipt{PublicationID: publicationID, ReceiptID: receiptID, Generation: generation, PayloadSHA256: payloadHash, EnvelopeSHA256: envelopeHash, SourceManifestHash: sourceHash, SourceSet: sourceSet}, nil
}

func sourceSetContains(sourceSet map[string]any, sourceType string, sourceID string) bool {
	key := map[string]string{"attestation": "attestationIds", "certificate": "certificateIds", "revocation": "revocationIds", "supersession": "supersessionIds", "lane-control": "laneControlIds"}[sourceType]
	for _, id := range sourceSet[key].([]string) {
		if id == sourceID {
			return true
		}
	}
	return false
}

func sourceSetCount(sourceSet map[string]any) int {
	count := 0
	for _, value := range sourceSet {
		count += len(value.([]string))
	}
	return count
}

func jsonSemanticEqual(left any, right any) bool {
	leftBytes, leftErr := json.Marshal(left)
	rightBytes, rightErr := json.Marshal(right)
	return leftErr == nil && rightErr == nil && string(leftBytes) == string(rightBytes)
}
