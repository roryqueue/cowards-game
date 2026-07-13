package main

import (
	"encoding/hex"
	"encoding/json"
	"os"
	"reflect"
	"sort"
	"strings"
	"testing"
)

type integrityTupleVectorFile struct {
	DomainTag  string   `json:"domainTag"`
	FieldOrder []string `json:"fieldOrder"`
	Vectors    []struct {
		Name            string                      `json:"name"`
		Tuple           canonicalCompatibilityTuple `json:"tuple"`
		EncodedBytesHex string                      `json:"encodedBytesHex"`
		SHA256          string                      `json:"sha256"`
		TupleID         string                      `json:"tupleId"`
	} `json:"vectors"`
}

func TestIntegrityEvidenceCanonicalTupleVectors(t *testing.T) {
	manifestBytes := readGoBackendArtifact(t, "v1.37-integrity-authority.json")
	manifest, err := parseIntegrityAuthorityManifest(manifestBytes)
	if err != nil {
		t.Fatal(err)
	}
	var vectors integrityTupleVectorFile
	if err := json.Unmarshal(readGoBackendArtifact(t, "v1.37-integrity-authority-hash-vectors.json"), &vectors); err != nil {
		t.Fatal(err)
	}
	if manifest.TupleEncoding.DomainTag != vectors.DomainTag || !reflect.DeepEqual(manifest.TupleEncoding.FieldOrder, vectors.FieldOrder) {
		t.Fatalf("generated manifest/vector tuple encoding drifted")
	}
	for _, vector := range vectors.Vectors {
		t.Run(vector.Name, func(t *testing.T) {
			encoded, err := manifest.encodeTuple(vector.Tuple)
			if err != nil {
				t.Fatal(err)
			}
			if hex.EncodeToString(encoded) != vector.EncodedBytesHex {
				t.Fatalf("tuple bytes differ from committed vector")
			}
			hash := hashCanonicalCompatibilityTuple(encoded)
			if hash != vector.SHA256 || "sha256:"+hash != vector.TupleID {
				t.Fatalf("tuple hash differs: hash=%s tupleId=%s", hash, vector.TupleID)
			}
		})
	}
}

func TestIntegrityEvidenceTupleResolutionIsAtomicAndExact(t *testing.T) {
	manifest, err := parseIntegrityAuthorityManifest(readGoBackendArtifact(t, "v1.37-integrity-authority.json"))
	if err != nil {
		t.Fatal(err)
	}
	registered := manifest.CompatibilityTuples[0]
	resolved, err := manifest.resolveTuple(registered.TupleID, registered.Tuple)
	if err != nil {
		t.Fatal(err)
	}
	if resolved.TupleID != registered.TupleID || !reflect.DeepEqual(resolved.Tuple, registered.Tuple) {
		t.Fatalf("exact tuple resolution changed generated identity: %+v", resolved)
	}

	tests := []struct {
		name    string
		tupleID string
		tuple   canonicalCompatibilityTuple
	}{
		{name: "partial expansion", tupleID: registered.TupleID, tuple: canonicalCompatibilityTuple{Rules: registered.Tuple.Rules}},
		{name: "mixed expansion", tupleID: registered.TupleID, tuple: func() canonicalCompatibilityTuple {
			value := registered.Tuple
			value.Engine = "0.1.4-mixed"
			return value
		}()},
		{name: "latest alias", tupleID: "latest", tuple: registered.Tuple},
		{name: "wildcard", tupleID: "*", tuple: registered.Tuple},
		{name: "range", tupleID: ">=v1.4", tuple: registered.Tuple},
		{name: "unknown exact id", tupleID: "sha256:" + strings.Repeat("f", 64), tuple: registered.Tuple},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if _, err := manifest.resolveTuple(test.tupleID, test.tuple); err == nil {
				t.Fatal("non-exact tuple selector was accepted")
			}
		})
	}
}

func TestIntegrityEvidenceSemanticTupleExcludesExecutableIdentity(t *testing.T) {
	typ := reflect.TypeOf(canonicalCompatibilityTuple{})
	for _, forbidden := range []string{"provider", "language", "toolchain", "adapter", "artifact", "build", "certificate", "corpus"} {
		for index := 0; index < typ.NumField(); index++ {
			field := strings.ToLower(typ.Field(index).Name + " " + typ.Field(index).Tag.Get("json"))
			if strings.Contains(field, forbidden) {
				t.Fatalf("semantic tuple includes executable identity field %q", field)
			}
		}
	}
	if typ.NumField() != 6 {
		t.Fatalf("semantic tuple must contain exactly six behavior fields, got %d", typ.NumField())
	}
	actualTags := make([]string, 0, typ.NumField())
	for index := 0; index < typ.NumField(); index++ {
		actualTags = append(actualTags, typ.Field(index).Tag.Get("json"))
	}
	if !reflect.DeepEqual(actualTags, canonicalCompatibilityTupleFields) {
		t.Fatalf("semantic tuple fields drifted: %v", actualTags)
	}
}

func TestIntegrityEvidenceClassifierMatchesCanonicalStatusFloor(t *testing.T) {
	laneHash := "sha256:" + strings.Repeat("a", 64)
	containment := runtimeEvidenceAuthorityCertificate{
		Kind:                  "containment",
		CertificateID:         "certificate:containment:current",
		CertificateVersion:    "runtime-containment-certificate-v1",
		CertificateRecordHash: "sha256:" + strings.Repeat("b", 64),
		LaneIdentityHash:      laneHash,
		AttestationIDs:        []string{"attestation:containment"},
	}
	conformance := runtimeEvidenceAuthorityCertificate{
		Kind:                  "conformance",
		CertificateID:         "certificate:conformance:current",
		CertificateVersion:    "runtime-conformance-certificate-v1",
		CertificateRecordHash: "sha256:" + strings.Repeat("c", 64),
		LaneIdentityHash:      laneHash,
		AttestationIDs:        []string{"attestation:conformance"},
	}
	authority := &verifiedRuntimeEvidenceAuthority{
		AuthorityBundleHash: "sha256:" + strings.Repeat("d", 64),
		RegistryGeneration:  "9",
		TrustDomain:         runtimeEvidenceAuthorityProductionTrustDomain,
		Payload: runtimeEvidenceAuthorityPayload{
			RegistryGeneration:   "9",
			IssuedAt:             "2026-07-12T00:00:00.000Z",
			ValidFrom:            "2026-07-12T00:00:00.000Z",
			ValidUntil:           "2026-08-12T00:00:00.000Z",
			Certificates:         []runtimeEvidenceAuthorityCertificate{containment, conformance},
			Revocations:          []runtimeEvidenceAuthorityRevocation{},
			Supersessions:        []runtimeEvidenceAuthoritySupersession{},
			OperatorLaneDisables: []runtimeEvidenceAuthorityLaneDisable{},
		},
	}
	containmentRef := runtimeEvidenceCertificateReferenceFor(containment, "9")
	conformanceRef := runtimeEvidenceCertificateReferenceFor(conformance, "9")

	tests := []struct {
		name       string
		input      executableLaneEvidenceInput
		status     executableLaneEvidenceStatus
		reasonCode string
	}{
		{
			name:       "no containment disables execution",
			input:      executableLaneEvidenceInput{Authority: authority, ExpectedLaneIdentityHash: laneHash, EvaluationInstant: "2026-07-13T00:00:00.000Z", ActiveRegistryGeneration: "9"},
			status:     executableLaneEvidenceDisabled,
			reasonCode: "CONTAINMENT_MISSING",
		},
		{
			name:       "containment without conformance is exhibition only",
			input:      executableLaneEvidenceInput{Authority: authority, ExpectedLaneIdentityHash: laneHash, EvaluationInstant: "2026-07-13T00:00:00.000Z", ActiveRegistryGeneration: "9", ContainmentCertificate: &containmentRef},
			status:     executableLaneEvidenceExhibitionOnly,
			reasonCode: "CONFORMANCE_MISSING",
		},
		{
			name:       "complete exact evidence is counted",
			input:      executableLaneEvidenceInput{Authority: authority, ExpectedLaneIdentityHash: laneHash, EvaluationInstant: "2026-07-13T00:00:00.000Z", ActiveRegistryGeneration: "9", ContainmentCertificate: &containmentRef, ConformanceCertificate: &conformanceRef},
			status:     executableLaneEvidenceCounted,
			reasonCode: "EVIDENCE_CURRENT",
		},
		{
			name:       "identity mutation fails closed",
			input:      executableLaneEvidenceInput{Authority: authority, ExpectedLaneIdentityHash: "sha256:" + strings.Repeat("e", 64), EvaluationInstant: "2026-07-13T00:00:00.000Z", ActiveRegistryGeneration: "9", ContainmentCertificate: &containmentRef, ConformanceCertificate: &conformanceRef},
			status:     executableLaneEvidenceDisabled,
			reasonCode: "IDENTITY_MISMATCH",
		},
		{
			name:       "generation mutation fails closed",
			input:      executableLaneEvidenceInput{Authority: authority, ExpectedLaneIdentityHash: laneHash, EvaluationInstant: "2026-07-13T00:00:00.000Z", ActiveRegistryGeneration: "10", ContainmentCertificate: &containmentRef, ConformanceCertificate: &conformanceRef},
			status:     executableLaneEvidenceDisabled,
			reasonCode: "REGISTRY_GENERATION_DRIFT",
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			result := classifyExecutableLaneEvidence(test.input)
			if result.Status != test.status || result.ReasonCode != test.reasonCode {
				t.Fatalf("unexpected evidence classification: %+v", result)
			}
		})
	}

	revoked := *authority
	revoked.Payload = authority.Payload
	revoked.Payload.Revocations = []runtimeEvidenceAuthorityRevocation{{CertificateID: containment.CertificateID, CertificateRecordHash: containment.CertificateRecordHash, RevokedAt: "2026-07-12T12:00:00.000Z", ReasonCode: "REVOKED"}}
	revokedResult := classifyExecutableLaneEvidence(executableLaneEvidenceInput{Authority: &revoked, ExpectedLaneIdentityHash: laneHash, EvaluationInstant: "2026-07-13T00:00:00.000Z", ActiveRegistryGeneration: "9", ContainmentCertificate: &containmentRef, ConformanceCertificate: &conformanceRef})
	if revokedResult.Status != executableLaneEvidenceDisabled || revokedResult.ReasonCode != "CONTAINMENT_REVOKED" {
		t.Fatalf("revoked containment did not disable execution: %+v", revokedResult)
	}

	disabled := *authority
	disabled.Payload = authority.Payload
	disabled.Payload.OperatorLaneDisables = []runtimeEvidenceAuthorityLaneDisable{{LaneIdentityHash: laneHash, DisabledAt: "2026-07-12T12:00:00.000Z", ReasonCode: "OPERATOR_DISABLED"}}
	disabledResult := classifyExecutableLaneEvidence(executableLaneEvidenceInput{Authority: &disabled, ExpectedLaneIdentityHash: laneHash, EvaluationInstant: "2026-07-13T00:00:00.000Z", ActiveRegistryGeneration: "9", ContainmentCertificate: &containmentRef, ConformanceCertificate: &conformanceRef})
	if disabledResult.Status != executableLaneEvidenceDisabled || disabledResult.ReasonCode != "OPERATOR_DISABLED" {
		t.Fatalf("operator switch promoted evidence: %+v", disabledResult)
	}
}

func TestIntegrityEvidencePublicProjectionUsesExactCalmAllowlist(t *testing.T) {
	input := integrityEvidenceProjectionFixture()
	input.ReasonCode = "CONFORMANCE_MISSING"
	input.Status = executableLaneEvidenceExhibitionOnly
	input.Certificates = input.Certificates[:1]

	projection := projectPublicIntegrityEvidence(input)
	serialized, err := json.Marshal(projection)
	if err != nil {
		t.Fatal(err)
	}
	var decoded map[string]any
	if err := json.Unmarshal(serialized, &decoded); err != nil {
		t.Fatal(err)
	}
	keys := make([]string, 0, len(decoded))
	for key := range decoded {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	expected := []string{"evidence", "freshnessDate", "message", "reasonCategory", "semanticTupleId", "status"}
	if !reflect.DeepEqual(keys, expected) {
		t.Fatalf("public integrity keys=%v, want exact allowlist %v", keys, expected)
	}
	if decoded["status"] != "exhibition_only" || decoded["reasonCategory"] != "competitive_evidence_pending" {
		t.Fatalf("public integrity status/copy drifted: %s", serialized)
	}
	message, _ := decoded["message"].(string)
	if message == "" || strings.Contains(message, "panic") || strings.Contains(message, "runtime") || strings.Contains(message, "CONFORMANCE_MISSING") {
		t.Fatalf("public integrity copy is not calm and stable: %q", message)
	}
	if decoded["freshnessDate"] != "2026-08-12" {
		t.Fatalf("public freshness date drifted: %s", serialized)
	}
	if err := assertIntegrityEvidenceProjectionPrivacySafe(projection); err != nil {
		t.Fatalf("public projection was not privacy safe: %v", err)
	}
}

func TestIntegrityEvidenceOperatorProjectionIsDistinctAndRestrictedSafe(t *testing.T) {
	input := integrityEvidenceProjectionFixture()
	projection := projectOperatorIntegrityEvidence(input)
	serialized, err := json.Marshal(projection)
	if err != nil {
		t.Fatal(err)
	}
	text := string(serialized)
	for _, required := range []string{
		`"reasonCode":"EVIDENCE_CURRENT"`,
		`"providerId":"provider:typescript"`,
		`"toolchainVersion":"26.0.0"`,
		`"certificateId":"certificate:containment:current"`,
		`"gateId":"certificate_status"`,
		`"restrictedProofIds"`,
		`"remediation"`,
		`"cohortImpact"`,
	} {
		if !strings.Contains(text, required) {
			t.Fatalf("operator projection omitted %s: %s", required, text)
		}
	}
	for _, publicOnly := range []string{`"reasonCategory"`, `"message"`} {
		if strings.Contains(text, publicOnly) {
			t.Fatalf("operator projection reused public DTO field %s: %s", publicOnly, text)
		}
	}
	if err := assertIntegrityEvidenceProjectionPrivacySafe(projection); err != nil {
		t.Fatalf("operator projection was not restricted-safe: %v", err)
	}
}

func TestIntegrityEvidenceProjectionPrivacyRejectsNestedKeysAndMarkers(t *testing.T) {
	forbiddenKeys := []string{
		"source", "sourceText", "bytesBase64", "artifactBytesBase64", "certificateBytes",
		"evidenceBytes", "originalSourceBytes", "normalizedSourceBytes", "strategySource",
		"strategyMemory", "soldierMemory", "objective", "objectivePayload", "rawRuntimeDetails",
		"privateDiagnostics", "toolchainDiagnostics", "hostDiagnostics", "privateError", "stackTrace",
		"stderr", "password", "authorization", "credential", "apiKey", "token", "sessionId",
		"hostPath", "artifactPath", "proofStoragePath", "evidenceStoragePath", "packagePath",
		"databaseURL", "runtimeInternal", "securityInternals", "exploitDetails",
	}
	for _, key := range forbiddenKeys {
		t.Run("key_"+key, func(t *testing.T) {
			value := map[string]any{"safe": []any{map[string]any{key: "redacted-value"}}}
			if err := assertIntegrityEvidenceProjectionPrivacySafe(value); err == nil {
				t.Fatalf("privacy scan accepted nested forbidden field %q", key)
			}
		})
	}
	for _, marker := range []string{
		"PRIVATE_", "DATABASE_URL", "postgresql://", "Bearer ", "stack trace", "Traceback",
		"site-packages", `File "`, "/python_runtime_host.py", "COWARDS_PROVIDER_VALIDATION_SECRET",
		"/var/lib/cowards/", "exploit payload",
	} {
		t.Run("marker", func(t *testing.T) {
			value := map[string]any{"safe": []any{map[string]any{"detail": "prefix " + marker + " suffix"}}}
			if err := assertIntegrityEvidenceProjectionPrivacySafe(value); err == nil {
				t.Fatalf("privacy scan accepted nested forbidden marker %q", marker)
			}
		})
	}
}

func integrityEvidenceProjectionFixture() integrityEvidenceProjectionInput {
	tuple := canonicalCompatibilityTuple{
		Rules: "cowards-rules-v1.4", Engine: "0.1.4", RuntimeABI: "strategy-runtime-abi-v1.14",
		Chronicle: "chronicle-v1.4", ArenaCatalog: "arena-catalog-v1.4", SetPolicy: "set-policy-v1.4",
	}
	return integrityEvidenceProjectionInput{
		Status: executableLaneEvidenceCounted, ReasonCode: "EVIDENCE_CURRENT",
		EvaluatedAt: "2026-07-13T12:00:00.000Z", RegistryGeneration: "9",
		SemanticTupleID: "sha256:" + strings.Repeat("a", 64),
		Identity: goExecutableLaneIdentity{
			ProviderID: "provider:typescript", LanguageID: "typescript", RuntimeID: "runtime:node",
			RuntimeVersion: "26.0.0", ToolchainID: "toolchain:node", ToolchainVersion: "26.0.0",
			AdapterID: "adapter:subprocess", AdapterVersion: "1", PolicyID: "policy:containment",
			PolicyVersion: "1", CorpusID: "corpus:conformance", CorpusVersion: "1",
			ArtifactID: "artifact:typescript", ArtifactSHA256: strings.Repeat("b", 64),
			ImplementationID: "implementation:typescript", BuildID: "build:typescript:1",
			SemanticTupleID: "sha256:" + strings.Repeat("a", 64), SemanticTuple: tuple,
		},
		Certificates: []integrityEvidenceCertificateProjectionInput{
			{
				Kind: "containment", CertificateID: "certificate:containment:current",
				CertificateVersion: "runtime-containment-certificate-v1", CertificateRecordHash: strings.Repeat("c", 64),
				Status: "passed", IssuedAt: "2026-07-12T00:00:00.000Z", FreshUntil: "2026-08-12T00:00:00.000Z",
				GateResults:          []integrityEvidenceGateResult{{GateID: "certificate_status", Passed: true}},
				RestrictedProofIDs:   []string{"attestation:containment"},
				RestrictedProofLinks: []string{"/internal/integrity/matchsets/match-set%3Acurrent/evidence#certificate-containment-current"},
			},
			{
				Kind: "conformance", CertificateID: "certificate:conformance:current",
				CertificateVersion: "runtime-conformance-certificate-v1", CertificateRecordHash: strings.Repeat("d", 64),
				Status: "passed", IssuedAt: "2026-07-12T00:00:00.000Z", FreshUntil: "2026-08-13T00:00:00.000Z",
				GateResults:          []integrityEvidenceGateResult{{GateID: "certificate_status", Passed: true}},
				RestrictedProofIDs:   []string{"attestation:conformance"},
				RestrictedProofLinks: []string{"/internal/integrity/matchsets/match-set%3Acurrent/evidence#certificate-conformance-current"},
			},
		},
		CohortImpact: "New execution may produce counted results while evidence remains current.",
	}
}

func readGoBackendArtifact(t *testing.T, name string) []byte {
	t.Helper()
	bytes, err := os.ReadFile("../../packages/spec/artifacts/" + name)
	if err != nil {
		t.Fatal(err)
	}
	return bytes
}
