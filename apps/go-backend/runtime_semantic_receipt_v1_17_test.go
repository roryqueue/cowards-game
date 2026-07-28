package main

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"os"
	"testing"
)

func TestPhase258RuntimeSemanticReceiptV117RejectsIncompleteSignedClaims(t *testing.T) {
	fixtureBytes, err := os.ReadFile("../../packages/spec/artifacts/runtime-execution-service-response.v1.17.candidate.wire.json")
	if err != nil {
		t.Fatal(err)
	}
	var wire struct {
		Result struct {
			SemanticReceipt runtimeSemanticReceiptV117 `json:"semanticReceipt"`
		} `json:"result"`
	}
	if err := json.Unmarshal(fixtureBytes, &wire); err != nil {
		t.Fatal(err)
	}
	mutations := []struct {
		name   string
		mutate func(*runtimeSemanticReceiptV117)
	}{
		{"empty request id", func(receipt *runtimeSemanticReceiptV117) { receipt.RequestID = "" }},
		{"empty match id", func(receipt *runtimeSemanticReceiptV117) { receipt.MatchID = "" }},
		{"floating generation", func(receipt *runtimeSemanticReceiptV117) { receipt.RegistryGeneration = "01" }},
		{"unsafe generation", func(receipt *runtimeSemanticReceiptV117) { receipt.RegistryGeneration = "9999999999999999" }},
		{"negative count", func(receipt *runtimeSemanticReceiptV117) { receipt.RuntimeViolationEventCount = -1 }},
		{"unsafe count", func(receipt *runtimeSemanticReceiptV117) { receipt.RuntimeViolationEventCount = 9_007_199_254_740_992 }},
	}
	for _, test := range mutations {
		t.Run(test.name, func(t *testing.T) {
			candidate := wire.Result.SemanticReceipt
			test.mutate(&candidate)
			candidate.Signature = ""
			message, messageErr := runtimeSemanticReceiptV117Message(candidate)
			if messageErr == nil {
				mac := hmac.New(sha256.New, []byte("invalid-claim-secret"))
				_, _ = mac.Write(message)
				candidate.Signature = "hmac-sha256:" + hex.EncodeToString(mac.Sum(nil))
				if validRuntimeSemanticReceiptV117(candidate, "invalid-claim-secret") {
					t.Fatal("invalid signed claims accepted")
				}
			}
		})
	}

	candidate := wire.Result.SemanticReceipt
	candidate.Signature = ""
	message, err := runtimeSemanticReceiptV117Message(candidate)
	if err != nil {
		t.Fatal(err)
	}
	mac := hmac.New(sha256.New, []byte(" \t"))
	_, _ = mac.Write(message)
	candidate.Signature = "hmac-sha256:" + hex.EncodeToString(mac.Sum(nil))
	if validRuntimeSemanticReceiptV117(candidate, " \t") {
		t.Fatal("blank signing secret accepted")
	}
}

func TestPhase258RuntimeSemanticReceiptV117CanonicalHTMLAndUnicode(t *testing.T) {
	receipt := runtimeSemanticReceiptV117{
		SchemaVersion:                     runtimeSemanticReceiptV117SchemaVersion,
		Profile:                           runtimeSemanticReceiptV117Profile,
		ServiceContractVersion:            runtimeSemanticReceiptV117ServiceVersion,
		RequestSHA256:                     "sha256:" + string(bytes.Repeat([]byte("1"), 64)),
		RequestID:                         "request:<>&\u2028\u2029",
		MatchID:                           "match:<>&\u2028\u2029",
		CompatibilityTupleID:              "sha256:" + string(bytes.Repeat([]byte("2"), 64)),
		AuthorityBundleHash:               "sha256:" + string(bytes.Repeat([]byte("3"), 64)),
		AuthoritySourceManifestHash:       "sha256:" + string(bytes.Repeat([]byte("4"), 64)),
		RegistryGeneration:                "7",
		LegacyAuthorityBundleHash:         "sha256:" + string(bytes.Repeat([]byte("0"), 64)),
		LegacyAuthoritySourceManifestHash: "sha256:" + string(bytes.Repeat([]byte("1"), 64)),
		LegacyRegistryGeneration:          "6",
		BottomIdentityManifestRoot:        "sha256:" + string(bytes.Repeat([]byte("5"), 64)),
		BottomEvidenceGraphRoot:           "sha256:" + string(bytes.Repeat([]byte("6"), 64)),
		BottomStrategyRevisionID:          "strategy-revision:bottom:<>&  ",
		BottomLaneIdentityHash:            "sha256:" + string(bytes.Repeat([]byte("2"), 64)),
		BottomOriginalSourceSHA256:        "sha256:" + string(bytes.Repeat([]byte("3"), 64)),
		BottomNormalizedSourceSHA256:      "sha256:" + string(bytes.Repeat([]byte("4"), 64)),
		BottomArtifactSHA256:              "sha256:" + string(bytes.Repeat([]byte("5"), 64)),
		BottomExactPinsSHA256:             "sha256:" + string(bytes.Repeat([]byte("6"), 64)),
		TopIdentityManifestRoot:           "sha256:" + string(bytes.Repeat([]byte("7"), 64)),
		TopEvidenceGraphRoot:              "sha256:" + string(bytes.Repeat([]byte("8"), 64)),
		TopStrategyRevisionID:             "strategy-revision:top:<>&  ",
		TopLaneIdentityHash:               "sha256:" + string(bytes.Repeat([]byte("7"), 64)),
		TopOriginalSourceSHA256:           "sha256:" + string(bytes.Repeat([]byte("8"), 64)),
		TopNormalizedSourceSHA256:         "sha256:" + string(bytes.Repeat([]byte("9"), 64)),
		TopArtifactSHA256:                 "sha256:" + string(bytes.Repeat([]byte("a"), 64)),
		TopExactPinsSHA256:                "sha256:" + string(bytes.Repeat([]byte("b"), 64)),
		BudgetProfileSHA256:               "sha256:" + string(bytes.Repeat([]byte("9"), 64)),
		LedgerPrestateRoot:                "sha256:" + string(bytes.Repeat([]byte("a"), 64)),
		LedgerPoststateRoot:               "sha256:" + string(bytes.Repeat([]byte("b"), 64)),
		ChronicleCanonicalHash:            "sha256:" + string(bytes.Repeat([]byte("c"), 64)),
		FinalStateCanonicalHash:           "sha256:" + string(bytes.Repeat([]byte("d"), 64)),
		ReconstructedTerminalStateHash:    "sha256:" + string(bytes.Repeat([]byte("e"), 64)),
		OutcomeCanonicalHash:              "sha256:" + string(bytes.Repeat([]byte("f"), 64)),
		RuntimeViolationEventCount:        0,
		Algorithm:                         "hmac-sha256",
		KeyID:                             runtimeSemanticReceiptV117KeyID,
	}
	message, err := runtimeSemanticReceiptV117Message(receipt)
	if err != nil {
		t.Fatal(err)
	}
	if bytes.Contains(message, []byte(`\u003c`)) || bytes.Contains(message, []byte(`\u2028`)) || !bytes.Contains(message, []byte("<>&\u2028\u2029")) {
		t.Fatalf("receipt claims are not canonical JSON: %q", message)
	}
}

func TestPhase258RuntimeSemanticReceiptV117GoldenParity(t *testing.T) {
	bytes, err := os.ReadFile("../../packages/spec/artifacts/runtime-execution-service-response.v1.17.candidate.wire.json")
	if err != nil {
		t.Fatal(err)
	}
	var wire struct {
		Result struct {
			SemanticReceipt runtimeSemanticReceiptV117 `json:"semanticReceipt"`
		} `json:"result"`
	}
	if err := json.Unmarshal(bytes, &wire); err != nil {
		t.Fatal(err)
	}
	if !validRuntimeSemanticReceiptV117(wire.Result.SemanticReceipt, "fixture-only:runtime-service-v1.17:secret") {
		t.Fatal("v1.17 semantic receipt rejected")
	}
	claimBytes, err := runtimeSemanticReceiptV117Message(wire.Result.SemanticReceipt)
	if err != nil {
		t.Fatal(err)
	}
	hash := sha256.Sum256(claimBytes)
	descriptor, ok := runtimeInvocationContractForVersion("runtime-execution-service-v1.17")
	if !ok || descriptor.ReceiptClaimSHA256 != hex.EncodeToString(hash[:]) || descriptor.ReceiptSignature != wire.Result.SemanticReceipt.Signature {
		t.Fatalf("generated TS/Go receipt parity drift: %+v", descriptor)
	}
}

func TestPhase258RuntimeSemanticReceiptV117ReconstructsCanonicalTerminalStateHash(t *testing.T) {
	wireBytes, err := os.ReadFile("../../packages/spec/artifacts/runtime-execution-service-response.v1.16.wire.json")
	if err != nil {
		t.Fatal(err)
	}
	var wire struct {
		Result struct {
			Chronicle       map[string]any `json:"chronicle"`
			FinalState      map[string]any `json:"finalState"`
			SemanticReceipt struct {
				ReconstructedTerminalStateHash string `json:"reconstructedTerminalStateHash"`
			} `json:"semanticReceipt"`
		} `json:"result"`
	}
	decoder := json.NewDecoder(bytes.NewReader(wireBytes))
	decoder.UseNumber()
	if err := decoder.Decode(&wire); err != nil {
		t.Fatal(err)
	}
	actual, err := runtimeSemanticReconstructedTerminalStateHashV117(wire.Result.Chronicle, wire.Result.FinalState)
	if err != nil {
		t.Fatal(err)
	}
	if actual != wire.Result.SemanticReceipt.ReconstructedTerminalStateHash {
		t.Fatalf("Go replay projection hash drifted from canonical TS evidence: got %s want %s", actual, wire.Result.SemanticReceipt.ReconstructedTerminalStateHash)
	}
}

func TestPhase258RuntimeSemanticReceiptV117ClosedVersionDispatch(t *testing.T) {
	for _, schema := range []string{"", "runtime-semantic-receipt-v1", "runtime-semantic-receipt-v1.16", "runtime-semantic-receipt-v1.18"} {
		if runtimeSemanticReceiptV117SchemaKnown(schema) {
			t.Fatalf("unknown schema %q accepted", schema)
		}
	}
	if !runtimeSemanticReceiptV117SchemaKnown("runtime-semantic-receipt-v1.17") {
		t.Fatal("v1.17 schema missing")
	}
}
