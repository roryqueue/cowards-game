package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"os"
	"testing"
)

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
