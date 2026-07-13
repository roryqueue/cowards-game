package main

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"sort"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"
)

const integrityAuthoritySchemaVersion = "v1.37-integrity-authority-v1"
const integrityAuthorityGeneratorVersion = "generate-v1-37-integrity-authority-v1"

var canonicalCompatibilityTupleFields = []string{
	"rules",
	"engine",
	"runtimeAbi",
	"chronicle",
	"arenaCatalog",
	"setPolicy",
}

type canonicalCompatibilityTuple struct {
	Rules        string `json:"rules"`
	Engine       string `json:"engine"`
	RuntimeABI   string `json:"runtimeAbi"`
	Chronicle    string `json:"chronicle"`
	ArenaCatalog string `json:"arenaCatalog"`
	SetPolicy    string `json:"setPolicy"`
}

type integrityTupleEncoding struct {
	DomainTag     string   `json:"domainTag"`
	FieldOrder    []string `json:"fieldOrder"`
	Separator     string   `json:"separator"`
	LengthUnit    string   `json:"lengthUnit"`
	HashAlgorithm string   `json:"hashAlgorithm"`
	TupleIDFormat string   `json:"tupleIdFormat"`
}

type integrityAuthorityOwner struct {
	Domain      string `json:"domain"`
	PackageName string `json:"packageName"`
	Symbol      string `json:"symbol"`
}

type registeredCompatibilityTuple struct {
	TupleID   string                      `json:"tupleId"`
	Algorithm string                      `json:"algorithm"`
	SHA256    string                      `json:"sha256"`
	Tuple     canonicalCompatibilityTuple `json:"tuple"`
}

type integrityAuthorityManifest struct {
	SchemaVersion       string                         `json:"schemaVersion"`
	GeneratorVersion    string                         `json:"generatorVersion"`
	GeneratedBy         string                         `json:"generatedBy"`
	TupleEncoding       integrityTupleEncoding         `json:"tupleEncoding"`
	AuthorityRegistry   []integrityAuthorityOwner      `json:"authorityRegistry"`
	CompatibilityTuples []registeredCompatibilityTuple `json:"compatibilityTuples"`

	byTupleID map[string]registeredCompatibilityTuple
}

type executableLaneEvidenceStatus string

const (
	executableLaneEvidenceDisabled       executableLaneEvidenceStatus = "disabled"
	executableLaneEvidenceExhibitionOnly executableLaneEvidenceStatus = "exhibition_only"
	executableLaneEvidenceCounted        executableLaneEvidenceStatus = "counted"
)

type runtimeEvidenceCertificateReference struct {
	Kind                  string
	CertificateID         string
	CertificateVersion    string
	CertificateRecordHash string
	RegistryGeneration    string
}

type executableLaneEvidenceInput struct {
	Authority                *verifiedRuntimeEvidenceAuthority
	ExpectedLaneIdentityHash string
	EvaluationInstant        string
	ActiveRegistryGeneration string
	ContainmentCertificate   *runtimeEvidenceCertificateReference
	ConformanceCertificate   *runtimeEvidenceCertificateReference
}

type executableLaneEvidenceResult struct {
	Status     executableLaneEvidenceStatus
	ReasonCode string
}

type integrityEvidenceGateResult struct {
	GateID string `json:"gateId"`
	Passed bool   `json:"passed"`
}

type integrityEvidenceCertificateProjectionInput struct {
	Kind                  string
	CertificateID         string
	CertificateVersion    string
	CertificateRecordHash string
	Status                string
	IssuedAt              string
	FreshUntil            string
	GateResults           []integrityEvidenceGateResult
	RestrictedProofIDs    []string
	RestrictedProofLinks  []string
}

type integrityEvidenceProjectionInput struct {
	Status             executableLaneEvidenceStatus
	ReasonCode         string
	EvaluatedAt        string
	RegistryGeneration string
	SemanticTupleID    string
	Identity           goExecutableLaneIdentity
	Certificates       []integrityEvidenceCertificateProjectionInput
	CohortImpact       string
}

type publicIntegrityEvidenceRecord struct {
	Kind       string `json:"kind"`
	Version    string `json:"version"`
	Hash       string `json:"hash"`
	FreshUntil string `json:"freshUntil"`
}

type publicIntegrityEvidenceProjection struct {
	Status          executableLaneEvidenceStatus    `json:"status"`
	ReasonCategory  string                          `json:"reasonCategory"`
	Message         string                          `json:"message"`
	SemanticTupleID string                          `json:"semanticTupleId"`
	Evidence        []publicIntegrityEvidenceRecord `json:"evidence"`
	FreshnessDate   string                          `json:"freshnessDate"`
}

type operatorIntegrityEvidenceCertificate struct {
	Kind                  string                        `json:"kind"`
	CertificateID         string                        `json:"certificateId"`
	CertificateVersion    string                        `json:"certificateVersion"`
	CertificateRecordHash string                        `json:"certificateRecordHash"`
	Status                string                        `json:"status"`
	IssuedAt              string                        `json:"issuedAt"`
	FreshUntil            string                        `json:"freshUntil"`
	GateResults           []integrityEvidenceGateResult `json:"gateResults"`
	RestrictedProofIDs    []string                      `json:"restrictedProofIds"`
	RestrictedProofLinks  []string                      `json:"restrictedProofLinks"`
}

type operatorIntegrityEvidenceProjection struct {
	Status             executableLaneEvidenceStatus           `json:"status"`
	ReasonCode         string                                 `json:"reasonCode"`
	EvaluatedAt        string                                 `json:"evaluatedAt"`
	RegistryGeneration string                                 `json:"registryGeneration"`
	Identity           goExecutableLaneIdentity               `json:"identity"`
	Gates              []operatorIntegrityEvidenceCertificate `json:"gates"`
	Remediation        string                                 `json:"remediation"`
	CohortImpact       string                                 `json:"cohortImpact"`
}

type integrityEvidenceReasonCopy struct {
	Category    string
	Message     string
	Remediation string
}

var integrityEvidenceReasonPolicy = map[string]integrityEvidenceReasonCopy{
	"EVIDENCE_CURRENT": {
		Category: "ready", Message: "Current safety and competitive evidence is available.",
		Remediation: "Keep the exact authority generation and both certificate references current.",
	},
	"OPERATOR_DISABLED": {
		Category: "operator_disabled", Message: "This Strategy lane is temporarily unavailable.",
		Remediation: "Remove the operator disable only after the incident is resolved; evidence will then be re-evaluated.",
	},
	"CONTAINMENT_MISSING": {
		Category: "safety_evidence_unavailable", Message: "This Strategy lane is temporarily unavailable while current safety evidence is checked.",
		Remediation: "Import a current containment certificate for the exact executable identity.",
	},
	"CONTAINMENT_STALE": {
		Category: "safety_evidence_unavailable", Message: "This Strategy lane is temporarily unavailable while current safety evidence is refreshed.",
		Remediation: "Refresh containment evidence and publish a current certificate reference.",
	},
	"CONTAINMENT_REVOKED": {
		Category: "safety_evidence_unavailable", Message: "This Strategy lane is temporarily unavailable while safety evidence is reviewed.",
		Remediation: "Resolve the revocation and import a new exact containment certificate.",
	},
	"CONTAINMENT_FAILED": {
		Category: "safety_evidence_unavailable", Message: "This Strategy lane is unavailable because current safety checks did not pass.",
		Remediation: "Repair the failed containment gates and recertify the exact lane identity.",
	},
	"CONTAINMENT_UNVERIFIABLE": {
		Category: "safety_evidence_unavailable", Message: "This Strategy lane is temporarily unavailable while safety evidence is verified.",
		Remediation: "Repair the trusted containment evidence path and publish a verifiable reference.",
	},
	"CONFORMANCE_MISSING": {
		Category: "competitive_evidence_pending", Message: "This Strategy lane is available for exhibitions while current competitive evidence is checked.",
		Remediation: "Run the required executable conformance corpus and import its exact certificate.",
	},
	"CONFORMANCE_STALE": {
		Category: "competitive_evidence_pending", Message: "This Strategy lane is available for exhibitions while competitive evidence is refreshed.",
		Remediation: "Re-run the executable conformance corpus and refresh the certificate.",
	},
	"CONFORMANCE_REVOKED": {
		Category: "competitive_evidence_pending", Message: "This Strategy lane is available for exhibitions while competitive evidence is reviewed.",
		Remediation: "Resolve the revocation and publish new exact conformance evidence.",
	},
	"CONFORMANCE_FAILED": {
		Category: "competitive_evidence_pending", Message: "This Strategy lane remains exhibition-only because current competitive checks did not pass.",
		Remediation: "Repair the failed conformance gates and rerun the complete corpus.",
	},
	"CONFORMANCE_UNVERIFIABLE": {
		Category: "competitive_evidence_pending", Message: "This Strategy lane is available for exhibitions while competitive evidence is verified.",
		Remediation: "Repair the trusted conformance evidence path and publish a verifiable reference.",
	},
	"IDENTITY_MISMATCH": {
		Category: "safety_evidence_unavailable", Message: "This Strategy lane is temporarily unavailable while its current identity is verified.",
		Remediation: "Rebuild evidence for the exact active provider, toolchain, adapter, artifact, build, and tuple identity.",
	},
	"TUPLE_UNKNOWN": {
		Category: "safety_evidence_unavailable", Message: "This Strategy lane is unavailable for the requested compatibility profile.",
		Remediation: "Use an exact registered semantic tuple identifier and complete expansion.",
	},
	"TUPLE_UNCERTIFIED": {
		Category: "safety_evidence_unavailable", Message: "This Strategy lane is unavailable for the requested compatibility profile.",
		Remediation: "Register and certify the exact semantic tuple before requesting execution.",
	},
	"REGISTRY_GENERATION_DRIFT": {
		Category: "safety_evidence_unavailable", Message: "This Strategy lane is temporarily unavailable while current evidence is refreshed.",
		Remediation: "Reload the active authority generation and obtain matching certificate references.",
	},
	"EVIDENCE_UNVERIFIABLE": {
		Category: "safety_evidence_unavailable", Message: "This Strategy lane is temporarily unavailable while current evidence is verified.",
		Remediation: "Restore the verified authority path before retrying.",
	},
}

func projectPublicIntegrityEvidence(input integrityEvidenceProjectionInput) publicIntegrityEvidenceProjection {
	status, reasonCode, copy := normalizedIntegrityEvidenceDecision(input.Status, input.ReasonCode)
	_ = reasonCode
	evidence := make([]publicIntegrityEvidenceRecord, 0, len(input.Certificates))
	freshnessDate := ""
	for _, certificate := range sortedIntegrityEvidenceCertificates(input.Certificates) {
		evidence = append(evidence, publicIntegrityEvidenceRecord{
			Kind: certificate.Kind, Version: certificate.CertificateVersion,
			Hash: canonicalSafeEvidenceHash(certificate.CertificateRecordHash), FreshUntil: certificate.FreshUntil,
		})
		if parsed, err := time.Parse(canonicalJSONInstantLayout, certificate.FreshUntil); err == nil {
			date := parsed.UTC().Format("2006-01-02")
			if freshnessDate == "" || date < freshnessDate {
				freshnessDate = date
			}
		}
	}
	projection := publicIntegrityEvidenceProjection{
		Status: status, ReasonCategory: copy.Category, Message: copy.Message,
		SemanticTupleID: input.SemanticTupleID, Evidence: evidence, FreshnessDate: freshnessDate,
	}
	if err := assertIntegrityEvidenceProjectionPrivacySafe(projection); err != nil {
		return publicIntegrityEvidenceProjection{
			Status: executableLaneEvidenceDisabled, ReasonCategory: integrityEvidenceReasonPolicy["EVIDENCE_UNVERIFIABLE"].Category,
			Message:         integrityEvidenceReasonPolicy["EVIDENCE_UNVERIFIABLE"].Message,
			SemanticTupleID: input.SemanticTupleID, Evidence: []publicIntegrityEvidenceRecord{}, FreshnessDate: "",
		}
	}
	return projection
}

func projectOperatorIntegrityEvidence(input integrityEvidenceProjectionInput) operatorIntegrityEvidenceProjection {
	status, reasonCode, copy := normalizedIntegrityEvidenceDecision(input.Status, input.ReasonCode)
	certificates := sortedIntegrityEvidenceCertificates(input.Certificates)
	gates := make([]operatorIntegrityEvidenceCertificate, 0, len(certificates))
	for _, certificate := range certificates {
		gates = append(gates, operatorIntegrityEvidenceCertificate{
			Kind: certificate.Kind, CertificateID: certificate.CertificateID,
			CertificateVersion:    certificate.CertificateVersion,
			CertificateRecordHash: canonicalSafeEvidenceHash(certificate.CertificateRecordHash),
			Status:                certificate.Status, IssuedAt: certificate.IssuedAt, FreshUntil: certificate.FreshUntil,
			GateResults:          append([]integrityEvidenceGateResult{}, certificate.GateResults...),
			RestrictedProofIDs:   append([]string{}, certificate.RestrictedProofIDs...),
			RestrictedProofLinks: append([]string{}, certificate.RestrictedProofLinks...),
		})
	}
	projection := operatorIntegrityEvidenceProjection{
		Status: status, ReasonCode: reasonCode, EvaluatedAt: input.EvaluatedAt,
		RegistryGeneration: input.RegistryGeneration, Identity: input.Identity, Gates: gates,
		Remediation: copy.Remediation, CohortImpact: integrityEvidenceCohortImpact(status, input.CohortImpact),
	}
	if err := assertIntegrityEvidenceProjectionPrivacySafe(projection); err != nil {
		return operatorIntegrityEvidenceProjection{
			Status: executableLaneEvidenceDisabled, ReasonCode: "EVIDENCE_UNVERIFIABLE",
			EvaluatedAt: input.EvaluatedAt, RegistryGeneration: input.RegistryGeneration,
			Gates:        []operatorIntegrityEvidenceCertificate{},
			Remediation:  integrityEvidenceReasonPolicy["EVIDENCE_UNVERIFIABLE"].Remediation,
			CohortImpact: integrityEvidenceCohortImpact(executableLaneEvidenceDisabled, ""),
		}
	}
	return projection
}

func normalizedIntegrityEvidenceDecision(status executableLaneEvidenceStatus, reasonCode string) (executableLaneEvidenceStatus, string, integrityEvidenceReasonCopy) {
	copy, known := integrityEvidenceReasonPolicy[reasonCode]
	if !known {
		reasonCode = "EVIDENCE_UNVERIFIABLE"
		copy = integrityEvidenceReasonPolicy[reasonCode]
		status = executableLaneEvidenceDisabled
	}
	if status != executableLaneEvidenceDisabled && status != executableLaneEvidenceExhibitionOnly && status != executableLaneEvidenceCounted {
		status = executableLaneEvidenceDisabled
		reasonCode = "EVIDENCE_UNVERIFIABLE"
		copy = integrityEvidenceReasonPolicy[reasonCode]
	}
	return status, reasonCode, copy
}

func sortedIntegrityEvidenceCertificates(values []integrityEvidenceCertificateProjectionInput) []integrityEvidenceCertificateProjectionInput {
	cloned := append([]integrityEvidenceCertificateProjectionInput{}, values...)
	sort.Slice(cloned, func(i, j int) bool {
		return cloned[i].Kind < cloned[j].Kind || (cloned[i].Kind == cloned[j].Kind && cloned[i].CertificateID < cloned[j].CertificateID)
	})
	return cloned
}

func canonicalSafeEvidenceHash(value string) string {
	if isPrefixedLowerSHA256(value) {
		return value
	}
	if isLowerSHA256(value) {
		return "sha256:" + value
	}
	return ""
}

func integrityEvidenceCohortImpact(status executableLaneEvidenceStatus, configured string) string {
	if strings.TrimSpace(configured) != "" {
		return configured
	}
	switch status {
	case executableLaneEvidenceCounted:
		return "New execution may produce counted results while evidence remains current."
	case executableLaneEvidenceExhibitionOnly:
		return "New execution may produce exhibition evidence only; counted results are blocked."
	default:
		return "New execution is disabled; no counted or exhibition result may be produced."
	}
}

var integrityEvidenceForbiddenFields = []string{
	"source", "sourceText", "bytesBase64", "artifactBytesBase64", "certificateBytes", "certificateBytesBase64",
	"evidenceBytes", "evidenceBytesBase64", "originalSourceBytes", "normalizedSourceBytes", "strategySource",
	"strategyMemory", "soldierMemory", "objective", "objectivePayload", "ownerDebug", "ownerPrivate",
	"exactAwarenessGrid", "awarenessGrid", "rawAwarenessGrid", "rawRuntimeDetails", "runtimeDetails",
	"privateRuntime", "privateDiagnostics", "toolchainDiagnostics", "hostDiagnostics", "privateError",
	"stack", "stackTrace", "stderr", "password", "passwordHash", "authorization", "credential", "credentials",
	"apiKey", "token", "tokens", "accessToken", "refreshToken", "session", "sessions", "sessionId",
	"hostPath", "hostPaths", "artifactPath", "artifactPaths", "proofStoragePath", "proofStoragePaths",
	"evidenceStoragePath", "evidenceStoragePaths", "packagePath", "packagePaths", "pythonRuntime",
	"databaseUrl", "databaseURL", "dbDsn", "dbDSN", "dsn", "runtimeInternal", "runtimeInternals",
	"privateRuntimeInternal", "privateRuntimeInternals", "securityInternals", "exploitDetails",
}

var integrityEvidenceForbiddenMarkers = []string{
	"PRIVATE_", "GOLDEN_PRIVATE_", "DATABASE_URL", "postgres://", "postgresql://", "Bearer ",
	"stack trace", "Traceback", "site-packages", "File \"", "/python_runtime_host.py",
	"COWARDS_PROVIDER_VALIDATION_SECRET", "/var/lib/cowards/", "exploit payload",
}

func assertIntegrityEvidenceProjectionPrivacySafe(value any) error {
	serialized, err := json.Marshal(value)
	if err != nil {
		return errors.New("integrity evidence projection is not serializable")
	}
	var decoded any
	if err := json.Unmarshal(serialized, &decoded); err != nil {
		return errors.New("integrity evidence projection is not valid JSON")
	}
	forbidden := make(map[string]struct{}, len(integrityEvidenceForbiddenFields))
	for _, field := range integrityEvidenceForbiddenFields {
		forbidden[normalizePublicOutputKey(field)] = struct{}{}
	}
	return visitIntegrityEvidenceProjection(decoded, "$", forbidden)
}

func visitIntegrityEvidenceProjection(value any, path string, forbidden map[string]struct{}) error {
	switch typed := value.(type) {
	case []any:
		for index, item := range typed {
			if err := visitIntegrityEvidenceProjection(item, fmt.Sprintf("%s[%d]", path, index), forbidden); err != nil {
				return err
			}
		}
	case map[string]any:
		for key, item := range typed {
			if _, denied := forbidden[normalizePublicOutputKey(key)]; denied {
				return errors.New("integrity evidence projection contains a forbidden field")
			}
			if err := visitIntegrityEvidenceProjection(item, path+"."+key, forbidden); err != nil {
				return err
			}
		}
	case string:
		for _, marker := range integrityEvidenceForbiddenMarkers {
			if strings.Contains(typed, marker) {
				return errors.New("integrity evidence projection contains a forbidden marker")
			}
		}
	}
	return nil
}

func parseIntegrityAuthorityManifest(serialized []byte) (*integrityAuthorityManifest, error) {
	var manifest integrityAuthorityManifest
	if err := decodeStrictJSON(serialized, &manifest); err != nil {
		return nil, fmt.Errorf("integrity authority manifest is invalid")
	}
	if manifest.SchemaVersion != integrityAuthoritySchemaVersion ||
		manifest.GeneratorVersion != integrityAuthorityGeneratorVersion ||
		manifest.GeneratedBy == "" ||
		manifest.TupleEncoding.DomainTag == "" ||
		manifest.TupleEncoding.Separator != "NUL" ||
		manifest.TupleEncoding.LengthUnit != "UTF-8 bytes" ||
		manifest.TupleEncoding.HashAlgorithm != "sha256" ||
		manifest.TupleEncoding.TupleIDFormat != "sha256:<lowercase-hex>" ||
		!equalStrings(manifest.TupleEncoding.FieldOrder, canonicalCompatibilityTupleFields) ||
		len(manifest.AuthorityRegistry) == 0 || len(manifest.CompatibilityTuples) == 0 {
		return nil, errors.New("integrity authority manifest contract is invalid")
	}
	manifest.byTupleID = make(map[string]registeredCompatibilityTuple, len(manifest.CompatibilityTuples))
	for _, registered := range manifest.CompatibilityTuples {
		if registered.Algorithm != "sha256" || !isLowerSHA256(registered.SHA256) || registered.TupleID != "sha256:"+registered.SHA256 {
			return nil, errors.New("integrity authority tuple identity is invalid")
		}
		encoded, err := manifest.encodeTuple(registered.Tuple)
		if err != nil || hashCanonicalCompatibilityTuple(encoded) != registered.SHA256 {
			return nil, errors.New("integrity authority tuple expansion does not match its identity")
		}
		if _, exists := manifest.byTupleID[registered.TupleID]; exists {
			return nil, errors.New("integrity authority tuple identity is duplicated")
		}
		manifest.byTupleID[registered.TupleID] = registered
	}
	for _, owner := range manifest.AuthorityRegistry {
		if owner.Domain == "" || owner.PackageName == "" || owner.Symbol == "" {
			return nil, errors.New("integrity authority owner is incomplete")
		}
	}
	return &manifest, nil
}

func (manifest *integrityAuthorityManifest) encodeTuple(tuple canonicalCompatibilityTuple) ([]byte, error) {
	if manifest == nil || manifest.TupleEncoding.DomainTag == "" || !equalStrings(manifest.TupleEncoding.FieldOrder, canonicalCompatibilityTupleFields) {
		return nil, errors.New("tuple encoding authority is unavailable")
	}
	values := map[string]string{
		"rules":        tuple.Rules,
		"engine":       tuple.Engine,
		"runtimeAbi":   tuple.RuntimeABI,
		"chronicle":    tuple.Chronicle,
		"arenaCatalog": tuple.ArenaCatalog,
		"setPolicy":    tuple.SetPolicy,
	}
	encoded := make([]byte, 0, 256)
	encoded = append(encoded, []byte(manifest.TupleEncoding.DomainTag)...)
	encoded = append(encoded, 0)
	for _, field := range manifest.TupleEncoding.FieldOrder {
		value := values[field]
		if value == "" || !utf8.ValidString(value) {
			return nil, fmt.Errorf("canonical tuple field %s is invalid", field)
		}
		valueBytes := []byte(value)
		encoded = append(encoded, []byte(field)...)
		encoded = append(encoded, 0)
		encoded = strconv.AppendInt(encoded, int64(len(valueBytes)), 10)
		encoded = append(encoded, 0)
		encoded = append(encoded, valueBytes...)
		encoded = append(encoded, 0)
	}
	return encoded, nil
}

func hashCanonicalCompatibilityTuple(encoded []byte) string {
	digest := sha256.Sum256(encoded)
	return hex.EncodeToString(digest[:])
}

func (manifest *integrityAuthorityManifest) resolveTuple(tupleID string, expansion canonicalCompatibilityTuple) (*registeredCompatibilityTuple, error) {
	if manifest == nil || !isPrefixedLowerSHA256(tupleID) {
		return nil, errors.New("canonical tuple selector must be an exact registered identity")
	}
	registered, exists := manifest.byTupleID[tupleID]
	if !exists {
		return nil, errors.New("canonical tuple is unknown")
	}
	encoded, err := manifest.encodeTuple(expansion)
	if err != nil || "sha256:"+hashCanonicalCompatibilityTuple(encoded) != tupleID || expansion != registered.Tuple {
		return nil, errors.New("canonical tuple expansion does not match the registered identity")
	}
	copy := registered
	return &copy, nil
}

func (manifest *integrityAuthorityManifest) hasTupleID(tupleID string) bool {
	if manifest == nil {
		return false
	}
	_, exists := manifest.byTupleID[tupleID]
	return exists
}

func runtimeEvidenceCertificateReferenceFor(certificate runtimeEvidenceAuthorityCertificate, generation string) runtimeEvidenceCertificateReference {
	return runtimeEvidenceCertificateReference{
		Kind:                  certificate.Kind,
		CertificateID:         certificate.CertificateID,
		CertificateVersion:    certificate.CertificateVersion,
		CertificateRecordHash: certificate.CertificateRecordHash,
		RegistryGeneration:    generation,
	}
}

func classifyExecutableLaneEvidence(input executableLaneEvidenceInput) executableLaneEvidenceResult {
	disabled := func(reason string) executableLaneEvidenceResult {
		return executableLaneEvidenceResult{Status: executableLaneEvidenceDisabled, ReasonCode: reason}
	}
	authority := input.Authority
	if authority == nil || authority.TrustDomain != runtimeEvidenceAuthorityProductionTrustDomain || !isPrefixedLowerSHA256(authority.AuthorityBundleHash) {
		return disabled("EVIDENCE_UNVERIFIABLE")
	}
	if !isPrefixedLowerSHA256(input.ExpectedLaneIdentityHash) {
		return disabled("IDENTITY_MISMATCH")
	}
	if !validCanonicalGeneration(input.ActiveRegistryGeneration) ||
		authority.RegistryGeneration != input.ActiveRegistryGeneration ||
		authority.Payload.RegistryGeneration != input.ActiveRegistryGeneration {
		return disabled("REGISTRY_GENERATION_DRIFT")
	}
	evaluatedAt, err := parseCanonicalInstant(input.EvaluationInstant)
	if err != nil {
		return disabled("EVIDENCE_UNVERIFIABLE")
	}
	issuedAt, issuedErr := parseCanonicalInstant(authority.Payload.IssuedAt)
	validFrom, fromErr := parseCanonicalInstant(authority.Payload.ValidFrom)
	validUntil, untilErr := parseCanonicalInstant(authority.Payload.ValidUntil)
	if issuedErr != nil || fromErr != nil || untilErr != nil || evaluatedAt.Before(issuedAt) || evaluatedAt.Before(validFrom) || evaluatedAt.After(validUntil) {
		return disabled("EVIDENCE_UNVERIFIABLE")
	}
	for _, laneDisable := range authority.Payload.OperatorLaneDisables {
		if laneDisable.LaneIdentityHash == input.ExpectedLaneIdentityHash {
			return disabled("OPERATOR_DISABLED")
		}
	}
	containment, reason := resolveRuntimeEvidenceCertificate(authority, input.ExpectedLaneIdentityHash, "containment", input.ContainmentCertificate)
	if reason != "" {
		return disabled(reason)
	}
	conformance, reason := resolveRuntimeEvidenceCertificate(authority, input.ExpectedLaneIdentityHash, "conformance", input.ConformanceCertificate)
	if reason != "" {
		return executableLaneEvidenceResult{Status: executableLaneEvidenceExhibitionOnly, ReasonCode: reason}
	}
	if containment == nil || conformance == nil {
		return disabled("EVIDENCE_UNVERIFIABLE")
	}
	return executableLaneEvidenceResult{Status: executableLaneEvidenceCounted, ReasonCode: "EVIDENCE_CURRENT"}
}

func resolveRuntimeEvidenceCertificate(authority *verifiedRuntimeEvidenceAuthority, expectedLaneHash string, kind string, reference *runtimeEvidenceCertificateReference) (*runtimeEvidenceAuthorityCertificate, string) {
	prefix := "CONTAINMENT"
	if kind == "conformance" {
		prefix = "CONFORMANCE"
	}
	if reference == nil {
		return nil, prefix + "_MISSING"
	}
	if reference.Kind != kind || reference.RegistryGeneration != authority.RegistryGeneration || !validAuthorityIdentifier(reference.CertificateID) || !validAuthorityIdentifier(reference.CertificateVersion) || !isPrefixedLowerSHA256(reference.CertificateRecordHash) {
		return nil, prefix + "_UNVERIFIABLE"
	}
	var resolved *runtimeEvidenceAuthorityCertificate
	for index := range authority.Payload.Certificates {
		certificate := &authority.Payload.Certificates[index]
		if certificate.CertificateID == reference.CertificateID {
			if resolved != nil {
				return nil, prefix + "_UNVERIFIABLE"
			}
			resolved = certificate
		}
	}
	if resolved == nil || resolved.Kind != kind || resolved.CertificateVersion != reference.CertificateVersion || resolved.CertificateRecordHash != reference.CertificateRecordHash {
		return nil, prefix + "_UNVERIFIABLE"
	}
	if resolved.LaneIdentityHash != expectedLaneHash {
		return nil, "IDENTITY_MISMATCH"
	}
	for _, revocation := range authority.Payload.Revocations {
		if revocation.CertificateID == resolved.CertificateID && revocation.CertificateRecordHash == resolved.CertificateRecordHash {
			return nil, prefix + "_REVOKED"
		}
	}
	for _, supersession := range authority.Payload.Supersessions {
		if supersession.CertificateID == resolved.CertificateID {
			return nil, prefix + "_UNVERIFIABLE"
		}
	}
	copy := *resolved
	return &copy, ""
}

func decodeStrictJSON(serialized []byte, destination any) error {
	if len(serialized) == 0 || !utf8.Valid(serialized) {
		return errors.New("JSON bytes are empty or invalid UTF-8")
	}
	if err := rejectDuplicateJSONKeys(serialized); err != nil {
		return err
	}
	decoder := json.NewDecoder(bytes.NewReader(serialized))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(destination); err != nil {
		return err
	}
	if err := requireJSONEOF(decoder); err != nil {
		return err
	}
	return nil
}

func rejectDuplicateJSONKeys(serialized []byte) error {
	decoder := json.NewDecoder(bytes.NewReader(serialized))
	decoder.UseNumber()
	if err := walkStrictJSONValue(decoder); err != nil {
		return err
	}
	return requireJSONEOF(decoder)
}

func walkStrictJSONValue(decoder *json.Decoder) error {
	token, err := decoder.Token()
	if err != nil {
		return err
	}
	delimiter, ok := token.(json.Delim)
	if !ok {
		return nil
	}
	switch delimiter {
	case '{':
		seen := map[string]struct{}{}
		for decoder.More() {
			keyToken, err := decoder.Token()
			if err != nil {
				return err
			}
			key, ok := keyToken.(string)
			if !ok {
				return errors.New("JSON object key is invalid")
			}
			if _, exists := seen[key]; exists {
				return fmt.Errorf("duplicate JSON key %q", key)
			}
			seen[key] = struct{}{}
			if err := walkStrictJSONValue(decoder); err != nil {
				return err
			}
		}
		closing, err := decoder.Token()
		if err != nil || closing != json.Delim('}') {
			return errors.New("JSON object is not closed")
		}
	case '[':
		for decoder.More() {
			if err := walkStrictJSONValue(decoder); err != nil {
				return err
			}
		}
		closing, err := decoder.Token()
		if err != nil || closing != json.Delim(']') {
			return errors.New("JSON array is not closed")
		}
	default:
		return errors.New("unexpected JSON delimiter")
	}
	return nil
}

func requireJSONEOF(decoder *json.Decoder) error {
	var trailing any
	err := decoder.Decode(&trailing)
	if errors.Is(err, io.EOF) {
		return nil
	}
	if err != nil {
		return err
	}
	return errors.New("JSON contains trailing data")
}

func equalStrings(left []string, right []string) bool {
	if len(left) != len(right) {
		return false
	}
	for index := range left {
		if left[index] != right[index] {
			return false
		}
	}
	return true
}
