package main

import (
	"crypto/sha256"
	"encoding/hex"
	"os"
	"path/filepath"
	"testing"
)

func TestPhase258CurrentDefaultRuntimeServiceContract(t *testing.T) {
	selected := selectedRuntimeServiceContractVersion()
	if selected != runtimeExecutionServiceVersion && selected != runtimeExecutionServiceVersionV117 {
		t.Fatalf("selected runtime service contract is unknown: %s", selected)
	}
	if selected == runtimeExecutionServiceVersionV117 && strategyRuntimeABIVersionV117 != "strategy-runtime-abi-v1.17" {
		t.Fatal("v1.17 service selected without its exact runtime ABI")
	}
}

func TestPhase258CurrentDefaultRoutes(t *testing.T) {
	selected := selectedRuntimeServiceContractVersion()
	switch selected {
	case runtimeExecutionServiceVersion:
		if newRuntimeServiceClient("http://runtime.invalid") == nil {
			t.Fatal("current v1.16 route client is unavailable")
		}
	case runtimeExecutionServiceVersionV117:
		if newRuntimeServiceClientV117("http://runtime.invalid") == nil {
			t.Fatal("current v1.17 route client is unavailable")
		}
	default:
		t.Fatalf("current route has no exact client: %s", selected)
	}
}

func TestPhase258MixedRuntimeContractFailsClosed(t *testing.T) {
	request := runtimeServiceRequestV117{
		ContractVersion: runtimeExecutionServiceVersionV117,
		Kind:            "executeMatch",
		RequestID:       "request:phase258:mixed",
		MatchID:         "match:phase258:mixed",
	}
	payload := []byte(`{"contractVersion":"runtime-execution-service-v1.16","ok":true,"kind":"executionResult","requestId":"request:phase258:mixed","matchId":"match:phase258:mixed"}`)
	response, failure := decodeRuntimeServiceResponseV117(request, payload, "fixture-secret")
	if response != nil || failure == nil || failure.ErrorClass != "RuntimeServiceContractMismatch" {
		t.Fatalf("mixed v1.16/v1.17 response did not fail closed: response=%+v failure=%+v", response, failure)
	}
}

func TestPhase258HistoricalV116Dispatch(t *testing.T) {
	if runtimeExecutionServiceVersion != "runtime-execution-service-v1.16" ||
		runtimeSemanticReceiptSchemaVersion != "runtime-semantic-receipt-v1" ||
		runtimeSemanticReceiptDomain != "cowards-game:runtime-semantic-receipt:v1" {
		t.Fatal("historical v1.16 dispatch identity changed")
	}
	expected := map[string]string{
		"../../packages/spec/src/runtime-execution-service.ts":                     "9a0a0411056d06ce4b426b7749256460369124fa752c6c2f81912b8b0bfb31fc",
		"runtime_service_client.go":                                                "9c72e5b0ee3ddfb36a7aec51a5a1ead508b2fae29eace27a73b9fda7d55ce23c",
		"runtime_semantic_receipt.go":                                              "36052047a870068ab81ced8c78f3b7f4e8130034a57ee8d16bc3873a50507d1d",
		"../../packages/persistence/migrations/0017_runtime_semantic_receipts.sql": "ac19e1d825217dfb72142685eb65e62933cea49541ceb39338235b32d2430a69",
	}
	for path, expectedSHA256 := range expected {
		bytes, err := os.ReadFile(filepath.Clean(path))
		if err != nil {
			t.Fatal(err)
		}
		sum := sha256.Sum256(bytes)
		if actual := hex.EncodeToString(sum[:]); actual != expectedSHA256 {
			t.Fatalf("historical v1.16 bytes changed for %s: %s", path, actual)
		}
	}
}
