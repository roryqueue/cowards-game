package main

import (
	"context"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"reflect"
	"sort"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
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

	issuedAt := time.Date(2026, 7, 12, 0, 0, 0, 0, time.UTC)
	freshUntil := time.Date(2026, 7, 13, 0, 0, 0, 0, time.UTC)
	containmentState := persistedRuntimeEvidenceCertificateState{Reference: containmentRef, Status: "passed", IssuedAt: issuedAt, FreshUntil: freshUntil}
	conformanceState := persistedRuntimeEvidenceCertificateState{Reference: conformanceRef, Status: "passed", IssuedAt: issuedAt, FreshUntil: freshUntil}
	input := executableLaneEvidenceInput{Authority: authority, ExpectedLaneIdentityHash: laneHash, EvaluationInstant: freshUntil.Format(canonicalJSONInstantLayout), ActiveRegistryGeneration: "9"}
	if result := classifyPersistedExecutableLaneEvidence(input, &containmentState, &conformanceState); result.Status != executableLaneEvidenceCounted {
		t.Fatalf("persisted evidence closed before its inclusive freshness bound: %+v", result)
	}
	input.EvaluationInstant = freshUntil.Add(time.Millisecond).Format(canonicalJSONInstantLayout)
	if result := classifyPersistedExecutableLaneEvidence(input, &containmentState, &conformanceState); result.Status != executableLaneEvidenceDisabled || result.ReasonCode != "CONTAINMENT_STALE" {
		t.Fatalf("persisted containment did not close immediately after freshness: %+v", result)
	}
	containmentState.FreshUntil = freshUntil.Add(time.Hour)
	if result := classifyPersistedExecutableLaneEvidence(input, &containmentState, &conformanceState); result.Status != executableLaneEvidenceExhibitionOnly || result.ReasonCode != "CONFORMANCE_STALE" {
		t.Fatalf("persisted conformance did not close counted readiness at freshness: %+v", result)
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
		"site-packages", `File "`, "/python_" + "runtime_host.py", "COWARDS_PROVIDER_VALIDATION_SECRET",
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

func TestIntegrityEvidenceHistoricalProjectionPreservesOriginalMeaning(t *testing.T) {
	resolved := projectHistoricalIntegrityEvidence(historicalIntegrityEvidenceInput{
		RulesVersion: "cowards-rules-v1.4", ChronicleVersion: "chronicle-v1.4",
		OriginalCountedStatus: "counted",
	})
	serialized, err := json.Marshal(resolved)
	if err != nil {
		t.Fatal(err)
	}
	text := string(serialized)
	for _, required := range []string{
		`"status":"resolved_historical"`, `"rulesVersion":"cowards-rules-v1.4"`,
		`"chronicleVersion":"chronicle-v1.4"`, `"originalCountedStatus":"counted"`,
	} {
		if !strings.Contains(text, required) {
			t.Fatalf("historical projection omitted %s: %s", required, text)
		}
	}
	if strings.Contains(text, `"warning"`) {
		t.Fatalf("historical evidence invented a warning without a finding: %s", text)
	}

	unresolved := projectHistoricalIntegrityEvidence(historicalIntegrityEvidenceInput{
		RulesVersion: "cowards-rules-v1.4", OriginalCountedStatus: "counted",
	})
	unresolvedBytes, _ := json.Marshal(unresolved)
	if !strings.Contains(string(unresolvedBytes), `"status":"legacy_incomplete"`) ||
		!strings.Contains(string(unresolvedBytes), "does not contain enough immutable version evidence") {
		t.Fatalf("legacy history was not left explicitly incomplete: %s", unresolvedBytes)
	}

	warning := projectHistoricalIntegrityEvidence(historicalIntegrityEvidenceInput{
		RulesVersion: "cowards-rules-v1.4", ChronicleVersion: "chronicle-v1.4",
		OriginalCountedStatus: "counted",
		EffectiveFinding: &integrityEvidenceFinding{
			EventID: "integrity-classification:0001:finding", Classification: "invalidated",
			EvidenceHash: strings.Repeat("e", 64), EffectiveAt: "2026-07-13T12:00:00.000Z",
		},
	})
	warningBytes, _ := json.Marshal(warning)
	if !strings.Contains(string(warningBytes), `"warning"`) || strings.Contains(string(warningBytes), "private reason") {
		t.Fatalf("concrete historical finding did not produce a calm warning: %s", warningBytes)
	}
	if err := assertIntegrityEvidenceProjectionPrivacySafe(warning); err != nil {
		t.Fatalf("historical projection leaked restricted evidence: %v", err)
	}
}

func TestIntegrityEvidenceCurrentModelAttachesOnlyPublicShape(t *testing.T) {
	input := integrityEvidenceProjectionFixture()
	bottom := projectPublicIntegrityEvidence(input)
	input.Identity.LanguageID = "python"
	input.Identity.ProviderID = "provider:python"
	top := projectPublicIntegrityEvidence(input)
	model := integrityEvidenceReadModel{
		Profile: "current", SemanticTupleID: input.SemanticTupleID,
		PublicByEntrant: map[string]publicIntegrityEvidenceProjection{"entrant:bottom": bottom, "entrant:top": top},
	}
	entrants := []map[string]any{
		{"entrantId": "entrant:bottom"}, {"entrantId": "entrant:top"},
	}
	attachPublicIntegrityEvidenceToEntrants(entrants, model)
	matches := []map[string]any{{
		"matchId": "match:current", "_bottomExecutionEntrantKey": "entrant:bottom", "_topExecutionEntrantKey": "entrant:top",
	}}
	attachPublicIntegrityEvidenceToMatches(matches, model)
	matchSet := projectPublicMatchSetIntegrityEvidence(model)
	serialized, err := json.Marshal(map[string]any{"entrants": entrants, "matches": matches, "matchSet": matchSet})
	if err != nil {
		t.Fatal(err)
	}
	text := string(serialized)
	for _, forbidden := range []string{"reasonCode", "providerId", "toolchainVersion", "certificateId", "_bottomExecutionEntrantKey", "_topExecutionEntrantKey"} {
		if strings.Contains(text, forbidden) {
			t.Fatalf("public current read leaked operator/internal field %q: %s", forbidden, text)
		}
	}
	if strings.Count(text, `"status":"counted"`) < 4 {
		t.Fatalf("public current evidence was not attached across entrant, Match, and MatchSet shapes: %s", text)
	}
	if err := assertIntegrityEvidenceProjectionPrivacySafe(map[string]any{"entrants": entrants, "matches": matches, "matchSet": matchSet}); err != nil {
		t.Fatalf("attached public current evidence leaked restricted data: %v", err)
	}
}

func TestIntegrityEvidenceRoutesSeparateAuthorizationAndProjectionShapes(t *testing.T) {
	sourceBytes, err := os.ReadFile("live_backend.go")
	if err != nil {
		t.Fatal(err)
	}
	source := string(sourceBytes)
	routes := goFunctionSource(t, source, "routes")
	if !strings.Contains(routes, "/internal/integrity/matchsets/{matchSetId}/evidence") {
		t.Fatal("authorized integrity-evidence route is not wired")
	}
	for _, functionName := range []string{"publicMatchSetResult", "publicReplayMetadata", "publicReplayEvidenceResult"} {
		body := goFunctionSource(t, source, functionName)
		if !strings.Contains(body, "publicIntegrityEvidence") && !strings.Contains(body, "IntegrityEvidence") {
			t.Fatalf("public read %s does not wire integrity evidence", functionName)
		}
		if strings.Contains(body, "projectOperatorIntegrityEvidence") {
			t.Fatalf("public read %s can construct the operator DTO", functionName)
		}
	}

	t.Setenv("COWARDS_GO_BACKEND_INTERNAL_TOKEN", "operator-token")
	request := httptest.NewRequest(http.MethodGet, "/internal/integrity/matchsets/match-set%3Asecret/evidence", nil)
	response := httptest.NewRecorder()
	(&LiveServer{}).routes().ServeHTTP(response, request)
	if response.Code != http.StatusForbidden || strings.Contains(response.Body.String(), "reasonCode") {
		t.Fatalf("unauthorized operator evidence did not fail before projection/query: code=%d body=%s", response.Code, response.Body.String())
	}
}

func TestIntegrityEvidencePostgresHistoricalReadAndConcreteWarning(t *testing.T) {
	databaseURL := os.Getenv("COWARDS_GO_BACKEND_TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("set COWARDS_GO_BACKEND_TEST_DATABASE_URL for integrity evidence PostgreSQL proof")
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
	prefix := "phase256-integrity-read-" + randomID()
	cleanupPhase100Rows(t, ctx, pool, prefix)
	ids := seedPhase100MatchSet(t, ctx, pool, prefix)
	seedPhase100CompetitionEntrants(t, ctx, pool, ids)
	insertPhase100ChronicleRow(t, ctx, pool, ids.matchA, "historical")
	eventID := "integrity-classification:99999999999999999999:" + randomID()
	defer func() {
		_, _ = pool.Exec(ctx, "delete from integrity_cohort_classification_events where id = $1", eventID)
		cleanupPhase100Rows(t, ctx, pool, prefix)
	}()
	if _, err := pool.Exec(ctx, `
		update match_sets set competition_preset_id='smoke-exhibition-v1', competition_preset_version='v1',
		  visibility='public', counted_status='counted' where id=$1
	`, ids.matchSetID); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, `update chronicles set artifact=$1 where match_id=$2`,
		map[string]any{"reproducibility": map[string]any{"specVersion": "cowards-rules-v1.4"}}, ids.matchA); err != nil {
		t.Fatal(err)
	}
	server := &LiveServer{pool: pool, now: func() time.Time { return time.Date(2026, 7, 13, 12, 0, 0, 0, time.UTC) }}
	result, err := server.publicMatchSetResult(ctx, ids.matchSetID)
	if err != nil {
		t.Fatal(err)
	}
	historical := mapValue(result, "integrityEvidence")
	if stringValue(historical, "status") != "resolved_historical" || stringValue(historical, "originalCountedStatus") != "counted" {
		t.Fatalf("historical MatchSet meaning drifted: %+v", historical)
	}
	replay, err := server.publicReplayEvidenceResult(ctx, ids.matchA)
	if err != nil {
		t.Fatal(err)
	}
	replayHistorical := mapValue(mapValue(replay, "metadata"), "integrityEvidence")
	if stringValue(replayHistorical, "status") != "resolved_historical" {
		t.Fatalf("replay historical profile drifted: %+v", replayHistorical)
	}
	if _, present := historical["warning"]; present {
		t.Fatalf("history invented a warning without concrete finding: %+v", historical)
	}
	if _, err := pool.Exec(ctx, `insert into integrity_cohort_classification_events
		(id,predicate_version,predicate,preview_hash,preview_count,evidence_hash,classification,reason,created_at)
		values ($1,'integrity-cohort-predicate-v1',$2,$3,1,$4,'invalidated','private reason must stay restricted',$5)`,
		eventID,
		map[string]any{"ast": map[string]any{"version": "integrity-cohort-predicate-v1", "operator": "match_set_ids", "matchSetIds": []string{ids.matchSetID}}},
		strings.Repeat("a", 64), strings.Repeat("b", 64), time.Date(2026, 7, 13, 12, 0, 0, 0, time.UTC)); err != nil {
		t.Fatal(err)
	}
	result, err = server.publicMatchSetResult(ctx, ids.matchSetID)
	if err != nil {
		t.Fatal(err)
	}
	historical = mapValue(result, "integrityEvidence")
	warning := mapValue(historical, "warning")
	if stringValue(warning, "classification") != "invalidated" || strings.Contains(string(mustIntegrityJSON(t, result)), "private reason") {
		t.Fatalf("concrete finding warning was missing or leaked private reason: %+v", historical)
	}
	if err := assertIntegrityEvidenceProjectionPrivacySafe(result); err != nil {
		t.Fatalf("historical public read failed recursive privacy scan: %v", err)
	}
}

func mustIntegrityJSON(t *testing.T, value any) []byte {
	t.Helper()
	serialized, err := json.Marshal(value)
	if err != nil {
		t.Fatal(err)
	}
	return serialized
}

func readGoBackendArtifact(t *testing.T, name string) []byte {
	t.Helper()
	bytes, err := os.ReadFile("../../packages/spec/artifacts/" + name)
	if err != nil {
		t.Fatal(err)
	}
	return bytes
}
