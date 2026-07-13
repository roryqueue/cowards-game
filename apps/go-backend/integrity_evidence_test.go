package main

import (
	"encoding/hex"
	"encoding/json"
	"os"
	"reflect"
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

func readGoBackendArtifact(t *testing.T, name string) []byte {
	t.Helper()
	bytes, err := os.ReadFile("../../packages/spec/artifacts/" + name)
	if err != nil {
		t.Fatal(err)
	}
	return bytes
}
