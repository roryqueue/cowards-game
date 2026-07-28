package main

import (
	"crypto/ed25519"
	"crypto/rand"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"encoding/pem"
	"os"
	"reflect"
	"strings"
	"testing"
)

type runtimeServiceResponseFixtureV118 struct {
	Result struct {
		SemanticReceipt runtimeSemanticReceiptV118 `json:"semanticReceipt"`
	} `json:"result"`
}

func loadRuntimeServiceFixtureV118(t *testing.T) (runtimeServiceRequestV118, []byte) {
	t.Helper()
	requestBytes, err := os.ReadFile("../../packages/spec/artifacts/runtime-execution-service-request.v1.18.candidate.json")
	if err != nil {
		t.Fatal(err)
	}
	var request runtimeServiceRequestV118
	if err := json.Unmarshal(requestBytes, &request); err != nil {
		t.Fatal(err)
	}
	responseBytes, err := os.ReadFile("../../packages/spec/artifacts/runtime-execution-service-response.v1.18.candidate.wire.json")
	if err != nil {
		t.Fatal(err)
	}
	return request, responseBytes
}

func loadRuntimeSemanticReceiptFixtureV118(t *testing.T) ([]byte, runtimeSemanticReceiptV118) {
	t.Helper()
	fixtureBytes, err := os.ReadFile("../../packages/spec/artifacts/runtime-execution-service-response.v1.18.candidate.wire.json")
	if err != nil {
		t.Fatal(err)
	}
	var fixture runtimeServiceResponseFixtureV118
	if err := json.Unmarshal(fixtureBytes, &fixture); err != nil {
		t.Fatal(err)
	}
	receiptBytes, err := runtimeInvocationV117CanonicalValue(fixture.Result.SemanticReceipt)
	if err != nil {
		t.Fatal(err)
	}
	return receiptBytes, fixture.Result.SemanticReceipt
}

func generatedRuntimeSemanticReceiptTrustedKeyV118() runtimeSemanticReceiptTrustedKeyV118 {
	return runtimeSemanticReceiptTrustedKeyV118{
		KeyID:        runtimeSemanticReceiptKeyIDV118,
		PublicKeyPEM: runtimeSemanticReceiptPublicKeyPEMV118,
	}
}

func signRuntimeSemanticReceiptForTestV118(
	t *testing.T,
	claim runtimeSemanticAdmissionClaimV118,
) ([]byte, runtimeSemanticReceiptV118, runtimeSemanticReceiptTrustedKeyV118) {
	t.Helper()
	publicKey, privateKey, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		t.Fatal(err)
	}
	canonicalClaim, err := runtimeInvocationV117CanonicalValue(claim)
	if err != nil {
		t.Fatal(err)
	}
	message := runtimeInvocationV117Frame(runtimeSemanticReceiptDomainV118, canonicalClaim)
	publicDER, err := x509.MarshalPKIXPublicKey(publicKey)
	if err != nil {
		t.Fatal(err)
	}
	trustedKey := runtimeSemanticReceiptTrustedKeyV118{
		KeyID: "fixture-only:go-v1.18-test-key",
		PublicKeyPEM: string(pem.EncodeToMemory(&pem.Block{
			Type:  "PUBLIC KEY",
			Bytes: publicDER,
		})),
	}
	receipt := runtimeSemanticReceiptV118{
		Claim:           claim,
		Algorithm:       "Ed25519",
		KeyID:           trustedKey.KeyID,
		SignatureBase64: base64.StdEncoding.EncodeToString(ed25519.Sign(privateKey, message)),
	}
	receiptBytes, err := runtimeInvocationV117CanonicalValue(receipt)
	if err != nil {
		t.Fatal(err)
	}
	return receiptBytes, receipt, trustedKey
}

func cloneRuntimeSemanticReceiptV118(t *testing.T, receipt runtimeSemanticReceiptV118) runtimeSemanticReceiptV118 {
	t.Helper()
	encoded, err := json.Marshal(receipt)
	if err != nil {
		t.Fatal(err)
	}
	var cloned runtimeSemanticReceiptV118
	if err := json.Unmarshal(encoded, &cloned); err != nil {
		t.Fatal(err)
	}
	return cloned
}

func assertRuntimeSemanticReceiptFailureV118(t *testing.T, failure *runtimeSemanticReceiptFailureV118) {
	t.Helper()
	if failure == nil || *failure != runtimeSemanticReceiptInvalidFailureV118 {
		t.Fatalf("unexpected v1.18 receipt failure: %+v", failure)
	}
}

func TestPhase259RuntimeSemanticReceiptV118AcceptsExactGeneratedVector(t *testing.T) {
	receiptBytes, receipt := loadRuntimeSemanticReceiptFixtureV118(t)
	verified, failure := verifyRuntimeSemanticReceiptV118(runtimeSemanticReceiptVerificationInputV118{
		ReceiptBytes:  receiptBytes,
		TrustedKey:    generatedRuntimeSemanticReceiptTrustedKeyV118(),
		ExpectedClaim: receipt.Claim,
	})
	if failure != nil || verified == nil {
		t.Fatalf("exact v1.18 receipt rejected: verified=%+v failure=%+v", verified, failure)
	}
	if !verified.authenticated || verified.Claim != receipt.Claim {
		t.Fatalf("verified receipt lost its authenticated claim: %+v", verified)
	}
	if verified.ClaimSHA256 != "sha256:"+mustRuntimeSemanticClaimHashV118(t, receipt.Claim) {
		t.Fatalf("claim hash drifted: %+v", verified)
	}
	descriptor, ok := runtimeInvocationContractForVersion("runtime-execution-service-v1.18")
	if !ok || strings.TrimPrefix(verified.ClaimSHA256, "sha256:") != descriptor.ReceiptClaimSHA256 ||
		verified.ReceiptSHA256 != runtimeInvocationV117SHA256Value(receiptBytes) ||
		receipt.SignatureBase64 != descriptor.ReceiptSignature {
		t.Fatalf("generated TypeScript/Go v1.18 parity drift: verified=%+v descriptor=%+v", verified, descriptor)
	}
}

func TestPhase259RuntimeServiceV118AdmitsOnlyTheExactAuthenticatedPublicResponse(t *testing.T) {
	request, responseBytes := loadRuntimeServiceFixtureV118(t)
	response, failure := decodeRuntimeServiceResponseV118(
		request,
		responseBytes,
		generatedRuntimeSemanticReceiptTrustedKeyV118(),
	)
	if failure != nil || response == nil || response.Verified == nil || !response.Verified.authenticated {
		t.Fatalf("exact v1.18 public service response rejected: response=%+v failure=%+v", response, failure)
	}
	var mutated map[string]any
	if err := json.Unmarshal(responseBytes, &mutated); err != nil {
		t.Fatal(err)
	}
	mutated["result"].(map[string]any)["transitionTraceRoot"] = "sha256:" + strings.Repeat("a", 64)
	encoded, err := runtimeInvocationV117CanonicalValue(mutated)
	if err != nil {
		t.Fatal(err)
	}
	response, failure = decodeRuntimeServiceResponseV118(
		request,
		encoded,
		generatedRuntimeSemanticReceiptTrustedKeyV118(),
	)
	if response != nil || failure == nil || failure.PlayerPenalty {
		t.Fatalf("unsigned outer-root substitution admitted: response=%+v failure=%+v", response, failure)
	}
}

func mustRuntimeSemanticClaimHashV118(t *testing.T, claim runtimeSemanticAdmissionClaimV118) string {
	t.Helper()
	message, err := encodeRuntimeSemanticAdmissionClaimV118(claim)
	if err != nil {
		t.Fatal(err)
	}
	digest := sha256.Sum256(message)
	return hex.EncodeToString(digest[:])
}

func TestPhase259RuntimeSemanticReceiptV118RejectsEveryExpectedClaimMutation(t *testing.T) {
	receiptBytes, receipt := loadRuntimeSemanticReceiptFixtureV118(t)
	hash := func(character string) string { return "sha256:" + strings.Repeat(character, 64) }
	mutations := []struct {
		name   string
		mutate func(*runtimeSemanticAdmissionClaimV118)
	}{
		{"schema version", func(claim *runtimeSemanticAdmissionClaimV118) { claim.SchemaVersion = "runtime-semantic-receipt-v1.17" }},
		{"profile", func(claim *runtimeSemanticAdmissionClaimV118) { claim.Profile = "canonical-full-service-v1" }},
		{"service version", func(claim *runtimeSemanticAdmissionClaimV118) {
			claim.ServiceContractVersion = "runtime-execution-service-v1.17"
		}},
		{"request hash", func(claim *runtimeSemanticAdmissionClaimV118) { claim.RequestSHA256 = hash("a") }},
		{"request id", func(claim *runtimeSemanticAdmissionClaimV118) { claim.RequestID = "request:changed" }},
		{"match id", func(claim *runtimeSemanticAdmissionClaimV118) { claim.MatchID = "match:changed" }},
		{"tuple id", func(claim *runtimeSemanticAdmissionClaimV118) { claim.SemanticTuple.TupleID = hash("b") }},
		{"tuple rules", func(claim *runtimeSemanticAdmissionClaimV118) {
			claim.SemanticTuple.Components.Rules = "cowards-rules-v9"
		}},
		{"authority generation", func(claim *runtimeSemanticAdmissionClaimV118) { claim.AuthorityGeneration = "24" }},
		{"evaluation instant", func(claim *runtimeSemanticAdmissionClaimV118) { claim.EvaluationInstant = "2026-07-16T12:00:01.000Z" }},
		{"bottom certificate id", func(claim *runtimeSemanticAdmissionClaimV118) {
			claim.CertificateReferences.Bottom.CertificateID = "certificate:changed"
		}},
		{"bottom certificate hash", func(claim *runtimeSemanticAdmissionClaimV118) {
			claim.CertificateReferences.Bottom.CertificateRecordHash = hash("c")
		}},
		{"bottom generation", func(claim *runtimeSemanticAdmissionClaimV118) {
			claim.CertificateReferences.Bottom.RegistryGeneration = "24"
		}},
		{"bottom lane", func(claim *runtimeSemanticAdmissionClaimV118) {
			claim.CertificateReferences.Bottom.Lane = "python-linux-amd64"
		}},
		{"bottom freshness", func(claim *runtimeSemanticAdmissionClaimV118) {
			claim.CertificateReferences.Bottom.FreshUntil = "2026-08-02T00:00:00.000Z"
		}},
		{"bottom source revision", func(claim *runtimeSemanticAdmissionClaimV118) {
			claim.CertificateReferences.Bottom.SourceIdentity.StrategyRevisionID = "strategy-revision:changed"
		}},
		{"bottom original source", func(claim *runtimeSemanticAdmissionClaimV118) {
			claim.CertificateReferences.Bottom.SourceIdentity.OriginalSourceSHA256 = hash("d")
		}},
		{"bottom normalized source", func(claim *runtimeSemanticAdmissionClaimV118) {
			claim.CertificateReferences.Bottom.SourceIdentity.NormalizedSourceSHA256 = hash("e")
		}},
		{"bottom artifact", func(claim *runtimeSemanticAdmissionClaimV118) {
			claim.CertificateReferences.Bottom.SourceIdentity.ArtifactSHA256 = hash("f")
		}},
		{"bottom manifest", func(claim *runtimeSemanticAdmissionClaimV118) {
			claim.CertificateReferences.Bottom.SourceIdentity.IdentityManifestRoot = hash("0")
		}},
		{"bottom evidence graph", func(claim *runtimeSemanticAdmissionClaimV118) {
			claim.CertificateReferences.Bottom.SourceIdentity.EvidenceGraphRoot = hash("3")
		}},
		{"bottom lane identity", func(claim *runtimeSemanticAdmissionClaimV118) {
			claim.CertificateReferences.Bottom.SourceIdentity.LaneIdentityHash = hash("4")
		}},
		{"top certificate id", func(claim *runtimeSemanticAdmissionClaimV118) {
			claim.CertificateReferences.Top.CertificateID = "certificate:changed:top"
		}},
		{"top source revision", func(claim *runtimeSemanticAdmissionClaimV118) {
			claim.CertificateReferences.Top.SourceIdentity.StrategyRevisionID = "strategy-revision:changed:top"
		}},
		{"chronicle hash", func(claim *runtimeSemanticAdmissionClaimV118) { claim.ChronicleCanonicalHash = hash("5") }},
		{"transition root", func(claim *runtimeSemanticAdmissionClaimV118) { claim.TransitionTraceRoot = hash("6") }},
		{"final state hash", func(claim *runtimeSemanticAdmissionClaimV118) { claim.FinalStateCanonicalHash = hash("7") }},
		{"outcome hash", func(claim *runtimeSemanticAdmissionClaimV118) { claim.OutcomeCanonicalHash = hash("8") }},
		{"terminal status", func(claim *runtimeSemanticAdmissionClaimV118) { claim.Terminal.Status = "failed" }},
		{"terminal reason", func(claim *runtimeSemanticAdmissionClaimV118) { claim.Terminal.Reason = "changed" }},
		{"budget root", func(claim *runtimeSemanticAdmissionClaimV118) { claim.Accounting.BudgetProfileRoot = hash("9") }},
		{"ledger prestate", func(claim *runtimeSemanticAdmissionClaimV118) { claim.Accounting.LedgerPrestateRoot = hash("a") }},
		{"ledger poststate", func(claim *runtimeSemanticAdmissionClaimV118) { claim.Accounting.LedgerPoststateRoot = hash("b") }},
		{"result class", func(claim *runtimeSemanticAdmissionClaimV118) {
			claim.Result.ResultClass = "player_violation"
			claim.Result.Ownership = "player"
		}},
	}
	for _, test := range mutations {
		t.Run(test.name, func(t *testing.T) {
			candidate := cloneRuntimeSemanticReceiptV118(t, receipt).Claim
			test.mutate(&candidate)
			verified, failure := verifyRuntimeSemanticReceiptV118(runtimeSemanticReceiptVerificationInputV118{
				ReceiptBytes:  receiptBytes,
				TrustedKey:    generatedRuntimeSemanticReceiptTrustedKeyV118(),
				ExpectedClaim: candidate,
			})
			if verified != nil {
				t.Fatalf("mutation %q admitted: %+v", test.name, verified)
			}
			assertRuntimeSemanticReceiptFailureV118(t, failure)
		})
	}
}

func TestPhase259RuntimeSemanticReceiptV118RejectsClosedShapeAndSemanticInvalidity(t *testing.T) {
	_, original := loadRuntimeSemanticReceiptFixtureV118(t)
	mutations := []struct {
		name   string
		mutate func(*runtimeSemanticAdmissionClaimV118)
	}{
		{"swapped certificate sides", func(claim *runtimeSemanticAdmissionClaimV118) {
			claim.CertificateReferences.Bottom, claim.CertificateReferences.Top =
				claim.CertificateReferences.Top, claim.CertificateReferences.Bottom
		}},
		{"duplicate certificate", func(claim *runtimeSemanticAdmissionClaimV118) {
			claim.CertificateReferences.Top.CertificateID = claim.CertificateReferences.Bottom.CertificateID
		}},
		{"duplicate certificate hash", func(claim *runtimeSemanticAdmissionClaimV118) {
			claim.CertificateReferences.Top.CertificateRecordHash = claim.CertificateReferences.Bottom.CertificateRecordHash
		}},
		{"source side mismatch", func(claim *runtimeSemanticAdmissionClaimV118) {
			claim.CertificateReferences.Bottom.SourceIdentity.Side = "top"
		}},
		{"stale certificate", func(claim *runtimeSemanticAdmissionClaimV118) {
			claim.CertificateReferences.Bottom.FreshUntil = claim.EvaluationInstant
		}},
		{"generation mismatch", func(claim *runtimeSemanticAdmissionClaimV118) {
			claim.CertificateReferences.Bottom.RegistryGeneration = "22"
		}},
		{"floating certificate id", func(claim *runtimeSemanticAdmissionClaimV118) {
			claim.CertificateReferences.Bottom.CertificateID = "certificate:latest"
		}},
		{"ownership mismatch", func(claim *runtimeSemanticAdmissionClaimV118) {
			claim.Result = runtimeSemanticAdmissionResultV118{
				ResultClass: "system_failure", Ownership: "player", Retryable: false, MutationStatus: "committed",
			}
		}},
	}
	for _, test := range mutations {
		t.Run(test.name, func(t *testing.T) {
			claim := cloneRuntimeSemanticReceiptV118(t, original).Claim
			test.mutate(&claim)
			receiptBytes, _, trustedKey := signRuntimeSemanticReceiptForTestV118(t, claim)
			verified, failure := verifyRuntimeSemanticReceiptV118(runtimeSemanticReceiptVerificationInputV118{
				ReceiptBytes: receiptBytes, TrustedKey: trustedKey, ExpectedClaim: claim,
			})
			if verified != nil {
				t.Fatalf("invalid signed claim %q admitted", test.name)
			}
			assertRuntimeSemanticReceiptFailureV118(t, failure)
		})
	}
}

func TestPhase259RuntimeSemanticReceiptV118RejectsWireKeyAndVersionConfusion(t *testing.T) {
	receiptBytes, receipt := loadRuntimeSemanticReceiptFixtureV118(t)
	var raw map[string]any
	if err := json.Unmarshal(receiptBytes, &raw); err != nil {
		t.Fatal(err)
	}
	mutations := []struct {
		name   string
		mutate func(map[string]any)
	}{
		{"extra field", func(value map[string]any) { value["diagnostics"] = "private-host-data" }},
		{"wrong algorithm", func(value map[string]any) { value["algorithm"] = "hmac-sha256" }},
		{"wrong key id", func(value map[string]any) { value["keyId"] = "fixture-only:wrong-key" }},
		{"invalid signature", func(value map[string]any) { value["signatureBase64"] = strings.Repeat("A", 86) + "==" }},
		{"cross version", func(value map[string]any) {
			value["claim"].(map[string]any)["schemaVersion"] = "runtime-semantic-receipt-v1.17"
		}},
		{"missing bottom certificate", func(value map[string]any) {
			delete(value["claim"].(map[string]any)["certificateReferences"].(map[string]any), "bottom")
		}},
		{"missing top certificate", func(value map[string]any) {
			delete(value["claim"].(map[string]any)["certificateReferences"].(map[string]any), "top")
		}},
		{"singular certificate", func(value map[string]any) {
			claim := value["claim"].(map[string]any)
			references := claim["certificateReferences"].(map[string]any)
			claim["certificateReference"] = references["bottom"]
			delete(claim, "certificateReferences")
		}},
	}
	for _, test := range mutations {
		t.Run(test.name, func(t *testing.T) {
			var candidate map[string]any
			encoded, _ := json.Marshal(raw)
			_ = json.Unmarshal(encoded, &candidate)
			test.mutate(candidate)
			canonical, err := runtimeInvocationV117CanonicalValue(candidate)
			if err != nil {
				t.Fatal(err)
			}
			verified, failure := verifyRuntimeSemanticReceiptV118(runtimeSemanticReceiptVerificationInputV118{
				ReceiptBytes: canonical, TrustedKey: generatedRuntimeSemanticReceiptTrustedKeyV118(), ExpectedClaim: receipt.Claim,
			})
			if verified != nil {
				t.Fatalf("wire mutation %q admitted", test.name)
			}
			assertRuntimeSemanticReceiptFailureV118(t, failure)
		})
	}
	noncanonical := append([]byte(" "), receiptBytes...)
	verified, failure := verifyRuntimeSemanticReceiptV118(runtimeSemanticReceiptVerificationInputV118{
		ReceiptBytes: noncanonical, TrustedKey: generatedRuntimeSemanticReceiptTrustedKeyV118(), ExpectedClaim: receipt.Claim,
	})
	if verified != nil {
		t.Fatal("noncanonical receipt bytes admitted")
	}
	assertRuntimeSemanticReceiptFailureV118(t, failure)

	wrongPublic, _, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		t.Fatal(err)
	}
	wrongDER, err := x509.MarshalPKIXPublicKey(wrongPublic)
	if err != nil {
		t.Fatal(err)
	}
	verified, failure = verifyRuntimeSemanticReceiptV118(runtimeSemanticReceiptVerificationInputV118{
		ReceiptBytes: receiptBytes,
		TrustedKey: runtimeSemanticReceiptTrustedKeyV118{
			KeyID: receipt.KeyID,
			PublicKeyPEM: string(pem.EncodeToMemory(&pem.Block{
				Type: "PUBLIC KEY", Bytes: wrongDER,
			})),
		},
		ExpectedClaim: receipt.Claim,
	})
	if verified != nil {
		t.Fatal("wrong Ed25519 key admitted")
	}
	assertRuntimeSemanticReceiptFailureV118(t, failure)
}

func TestPhase259RuntimeSemanticReceiptV118MatchesStringGenerationGrammar(t *testing.T) {
	_, receipt := loadRuntimeSemanticReceiptFixtureV118(t)
	claim := receipt.Claim
	claim.AuthorityGeneration = "9999999999999999"
	claim.CertificateReferences.Bottom.RegistryGeneration = claim.AuthorityGeneration
	claim.CertificateReferences.Top.RegistryGeneration = claim.AuthorityGeneration
	receiptBytes, signed, trustedKey := signRuntimeSemanticReceiptForTestV118(t, claim)
	verified, failure := verifyRuntimeSemanticReceiptV118(runtimeSemanticReceiptVerificationInputV118{
		ReceiptBytes: receiptBytes, TrustedKey: trustedKey, ExpectedClaim: signed.Claim,
	})
	if failure != nil || verified == nil {
		t.Fatalf("spec-valid 16-digit string generation rejected: %+v", failure)
	}

	claim.AuthorityGeneration = "01"
	claim.CertificateReferences.Bottom.RegistryGeneration = claim.AuthorityGeneration
	claim.CertificateReferences.Top.RegistryGeneration = claim.AuthorityGeneration
	receiptBytes, signed, trustedKey = signRuntimeSemanticReceiptForTestV118(t, claim)
	verified, failure = verifyRuntimeSemanticReceiptV118(runtimeSemanticReceiptVerificationInputV118{
		ReceiptBytes: receiptBytes, TrustedKey: trustedKey, ExpectedClaim: signed.Claim,
	})
	if verified != nil {
		t.Fatal("noncanonical leading-zero generation admitted")
	}
	assertRuntimeSemanticReceiptFailureV118(t, failure)
}

func TestPhase259RuntimeSemanticReceiptV118UsesGeneratedClosedTables(t *testing.T) {
	if !runtimeSemanticReceiptV118GeneratedTablesMatch() {
		t.Fatal("Go v1.18 receipt structs drifted from generated spec field tables")
	}
	if !reflect.DeepEqual(runtimeSemanticReceiptClaimFieldsV118[:], runtimeSemanticAdmissionClaimFieldNamesV118()) ||
		!reflect.DeepEqual(runtimeCertificateReferenceFieldsV118[:], runtimeCertificateReferenceFieldNamesV118()) ||
		!reflect.DeepEqual(runtimeCertificateSourceIdentityFieldsV118[:], runtimeCertificateSourceIdentityFieldNamesV118()) {
		t.Fatal("generated v1.18 field tables are not the Go parser authority")
	}
	expectedVectors := []string{
		"missing-bottom-certificate", "missing-top-certificate", "swapped-certificate-sides",
		"duplicate-certificate-reference", "stale-certificate", "generation-mismatch",
		"source-identity-mismatch", "trace-root-mismatch", "accounting-root-mismatch",
		"signature-mismatch", "key-id-mismatch", "cross-version-relabel", "private-output-field",
	}
	if !reflect.DeepEqual(runtimeSemanticReceiptNegativeVectorsV118[:], expectedVectors) {
		t.Fatal("generated v1.18 negative-vector inventory drifted")
	}
}

func TestPhase259RuntimeSemanticReceiptV118ProjectionAndFailureArePrivacySafe(t *testing.T) {
	receiptBytes, receipt := loadRuntimeSemanticReceiptFixtureV118(t)
	receipt.Claim.CertificateReferences.Bottom.SourceIdentity.StrategyRevisionID = "private-source-secret-bottom"
	receipt.Claim.CertificateReferences.Top.SourceIdentity.StrategyRevisionID = "private-source-secret-top"
	signedBytes, signed, trustedKey := signRuntimeSemanticReceiptForTestV118(t, receipt.Claim)
	verified, failure := verifyRuntimeSemanticReceiptV118(runtimeSemanticReceiptVerificationInputV118{
		ReceiptBytes: signedBytes, TrustedKey: trustedKey, ExpectedClaim: signed.Claim,
	})
	if failure != nil || verified == nil {
		t.Fatalf("privacy fixture rejected: %+v", failure)
	}
	serialized, err := json.Marshal(verified.PublicProjection)
	if err != nil {
		t.Fatal(err)
	}
	for _, forbidden := range []string{
		"private-source-secret", "originalSource", "normalizedSource", "artifactSha",
		"identityManifest", "evidenceGraph", "laneIdentity", "memory", "objective",
		"diagnostics", "host", "signature", "publicKey", "keyId",
	} {
		if strings.Contains(string(serialized), forbidden) {
			t.Fatalf("public v1.18 projection leaked %q: %s", forbidden, serialized)
		}
	}

	verified, failure = verifyRuntimeSemanticReceiptV118(runtimeSemanticReceiptVerificationInputV118{
		ReceiptBytes: receiptBytes,
		TrustedKey: runtimeSemanticReceiptTrustedKeyV118{
			KeyID: "private-key-or-host-poison", PublicKeyPEM: "database-url-and-private-key-poison",
		},
		ExpectedClaim: receipt.Claim,
	})
	if verified != nil {
		t.Fatal("poison key material was admitted")
	}
	assertRuntimeSemanticReceiptFailureV118(t, failure)
	failureBytes, err := json.Marshal(failure)
	if err != nil {
		t.Fatal(err)
	}
	for _, poison := range []string{"private-key", "database-url", "host-poison"} {
		if strings.Contains(string(failureBytes), poison) {
			t.Fatalf("safe failure leaked %q: %s", poison, failureBytes)
		}
	}
}

func TestPhase259RuntimeSemanticReceiptV118PreservesPriorVersionsAndNoSemanticAuthority(t *testing.T) {
	v116Before, ok116 := runtimeInvocationContractForVersion("runtime-execution-service-v1.16")
	v117Before, ok117 := runtimeInvocationContractForVersion("runtime-execution-service-v1.17")
	if !ok116 || !ok117 || runtimeSemanticReceiptV117SchemaKnown("runtime-semantic-receipt-v1.18") {
		t.Fatal("prior-version dispatch changed")
	}
	sourceBytes, err := os.ReadFile("runtime_service_client_v1_18.go")
	if err != nil {
		t.Fatal(err)
	}
	source := string(sourceBytes)
	for _, forbidden := range []string{
		"parseChronicleEvent", "validateGoChronicle", "applyReplay",
		"validateCurrentReplayReconstruction", "runMatch(", "soldierBrain(",
		"selectActivations(", "StrategyMemory", "SoldierMemory",
	} {
		if strings.Contains(source, forbidden) {
			t.Fatalf("Go v1.18 verifier imported semantic authority %q", forbidden)
		}
	}
	v116After, _ := runtimeInvocationContractForVersion("runtime-execution-service-v1.16")
	v117After, _ := runtimeInvocationContractForVersion("runtime-execution-service-v1.17")
	if v116Before != v116After || v117Before != v117After {
		t.Fatal("v1.18 receipt verification mutated prior-version descriptors")
	}
}
