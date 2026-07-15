package main

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

const runtimeServiceV117FixtureSecret = "fixture-only:runtime-service-v1.17:secret"

func loadRuntimeServiceV117Fixture(t *testing.T) (runtimeServiceRequestV117, runtimeServiceResponseV117, []byte) {
	t.Helper()
	requestBytes, err := os.ReadFile("../../packages/spec/artifacts/runtime-execution-service-request.v1.17.candidate.json")
	if err != nil {
		t.Fatal(err)
	}
	responseBytes, err := os.ReadFile("../../packages/spec/artifacts/runtime-execution-service-response.v1.17.candidate.wire.json")
	if err != nil {
		t.Fatal(err)
	}
	var request runtimeServiceRequestV117
	if err := json.Unmarshal(requestBytes, &request); err != nil {
		t.Fatal(err)
	}
	var response runtimeServiceResponseV117
	if err := json.Unmarshal(responseBytes, &response); err != nil {
		t.Fatal(err)
	}
	return request, response, requestBytes
}

func signRuntimeServiceReceiptV117(t *testing.T, receipt *runtimeSemanticReceiptV117) {
	t.Helper()
	receipt.Signature = ""
	message, err := runtimeSemanticReceiptV117Message(*receipt)
	if err != nil {
		t.Fatal(err)
	}
	mac := hmac.New(sha256.New, []byte(runtimeServiceV117FixtureSecret))
	_, _ = mac.Write(message)
	receipt.Signature = "hmac-sha256:" + hex.EncodeToString(mac.Sum(nil))
}

func encodeRuntimeServiceResponseFixtureV117(t *testing.T, response runtimeServiceResponseV117) []byte {
	t.Helper()
	encoded, err := json.Marshal(response)
	if err != nil {
		t.Fatal(err)
	}
	canonical := decodeCanonicalJSONV11(encoded, canonicalJSONV11Options{Context: canonicalJSONV11AuthenticatedOuterEnvelope})
	if canonical.Error != nil {
		t.Fatalf("response fixture is not canonicalizable: %s", canonical.Error.Code)
	}
	return canonical.CanonicalBytes
}

func TestPhase258RuntimeServiceV117WritesCanonicalRequestBytes(t *testing.T) {
	request, response, expectedBytes := loadRuntimeServiceV117Fixture(t)
	var observed []byte
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, incoming *http.Request) {
		defer incoming.Body.Close()
		var err error
		observed, err = io.ReadAll(incoming.Body)
		if err != nil {
			t.Fatal(err)
		}
		writer.Header().Set("content-type", "application/json")
		_, _ = writer.Write(encodeRuntimeServiceResponseFixtureV117(t, response))
	}))
	defer server.Close()
	client := newRuntimeServiceClientV117(server.URL)
	client.semanticReceiptSecret = runtimeServiceV117FixtureSecret
	if result, failure := client.executeMatch(context.Background(), request); failure != nil || result == nil {
		t.Fatalf("canonical v1.17 request failed: result=%+v failure=%+v", result, failure)
	}
	if !bytes.Equal(observed, expectedBytes) {
		t.Fatalf("v1.17 request bytes are not canonical\nwant=%q\n got=%q", expectedBytes, observed)
	}
}

func TestPhase258RuntimeServiceV117RejectsEveryReceiptBindingSubstitution(t *testing.T) {
	request, original, _ := loadRuntimeServiceV117Fixture(t)
	if response, failure := decodeRuntimeServiceResponseV117(request, encodeRuntimeServiceResponseFixtureV117(t, original), runtimeServiceV117FixtureSecret); failure != nil || response == nil {
		t.Fatalf("golden v1.17 response failed: response=%+v failure=%+v", response, failure)
	}
	hash := func(character byte) string { return "sha256:" + string(bytes.Repeat([]byte{character}, 64)) }
	tests := []struct {
		name   string
		mutate func(*runtimeServiceResponseV117)
	}{
		{"request hash", func(response *runtimeServiceResponseV117) {
			response.Result.SemanticReceipt.RequestSHA256 = hash('0')
			signRuntimeServiceReceiptV117(t, &response.Result.SemanticReceipt)
		}},
		{"registry generation", func(response *runtimeServiceResponseV117) {
			response.Result.SemanticReceipt.RegistryGeneration = "8"
			signRuntimeServiceReceiptV117(t, &response.Result.SemanticReceipt)
		}},
		{"bottom identity root", func(response *runtimeServiceResponseV117) {
			response.Result.SemanticReceipt.BottomIdentityManifestRoot = hash('0')
			signRuntimeServiceReceiptV117(t, &response.Result.SemanticReceipt)
		}},
		{"bottom graph root", func(response *runtimeServiceResponseV117) {
			response.Result.SemanticReceipt.BottomEvidenceGraphRoot = hash('0')
			signRuntimeServiceReceiptV117(t, &response.Result.SemanticReceipt)
		}},
		{"top identity root", func(response *runtimeServiceResponseV117) {
			response.Result.SemanticReceipt.TopIdentityManifestRoot = hash('0')
			signRuntimeServiceReceiptV117(t, &response.Result.SemanticReceipt)
		}},
		{"top graph root", func(response *runtimeServiceResponseV117) {
			response.Result.SemanticReceipt.TopEvidenceGraphRoot = hash('0')
			signRuntimeServiceReceiptV117(t, &response.Result.SemanticReceipt)
		}},
		{"budget profile", func(response *runtimeServiceResponseV117) {
			response.Result.SemanticReceipt.BudgetProfileSHA256 = hash('0')
			signRuntimeServiceReceiptV117(t, &response.Result.SemanticReceipt)
		}},
		{"chronicle", func(response *runtimeServiceResponseV117) {
			response.Result.Chronicle = json.RawMessage(`{"mutated":true}`)
		}},
		{"chronicle hash", func(response *runtimeServiceResponseV117) {
			response.Result.SemanticReceipt.ChronicleCanonicalHash = hash('0')
			signRuntimeServiceReceiptV117(t, &response.Result.SemanticReceipt)
		}},
		{"final state", func(response *runtimeServiceResponseV117) {
			response.Result.FinalState = json.RawMessage(`{"mutated":true}`)
		}},
		{"final state hash", func(response *runtimeServiceResponseV117) {
			response.Result.SemanticReceipt.FinalStateCanonicalHash = hash('0')
			signRuntimeServiceReceiptV117(t, &response.Result.SemanticReceipt)
		}},
		{"outcome", func(response *runtimeServiceResponseV117) {
			response.Result.Outcome = json.RawMessage(`{"mutated":true}`)
		}},
		{"outcome hash", func(response *runtimeServiceResponseV117) {
			response.Result.SemanticReceipt.OutcomeCanonicalHash = hash('0')
			signRuntimeServiceReceiptV117(t, &response.Result.SemanticReceipt)
		}},
		{"violation count", func(response *runtimeServiceResponseV117) { response.Result.RuntimeViolationEventCount++ }},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			_, candidate, _ := loadRuntimeServiceV117Fixture(t)
			test.mutate(&candidate)
			decoded, failure := decodeRuntimeServiceResponseV117(request, encodeRuntimeServiceResponseFixtureV117(t, candidate), runtimeServiceV117FixtureSecret)
			if decoded != nil || failure == nil || failure.ErrorClass != "RuntimeServiceSemanticIntegrity" {
				t.Fatalf("substitution accepted: decoded=%+v failure=%+v", decoded, failure)
			}
		})
	}
}

func TestPhase258RuntimeServiceV117PreservesTypedSystemFailure(t *testing.T) {
	request, _, _ := loadRuntimeServiceV117Fixture(t)
	payload := []byte(`{"contractVersion":"runtime-execution-service-v1.17","kind":"systemFailure","matchId":"match:full-service:v1.17:0001","ok":false,"requestId":"request:full-service:v1.17:0001","systemFailure":{"classification":"system_failure","code":"EVIDENCE_UNVERIFIABLE","ownership":"system_integrity","playerPenalty":false,"publicMessage":"Runtime execution failed before completion.","retryable":false}}`)
	response, failure := decodeRuntimeServiceResponseV117(request, payload, runtimeServiceV117FixtureSecret)
	if response != nil || failure == nil || failure.Code != "EVIDENCE_UNVERIFIABLE" || failure.Retryable || failure.PlayerPenalty {
		t.Fatalf("typed system failure collapsed: response=%+v failure=%+v", response, failure)
	}
}

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
	requestV116 := validRuntimeServiceRequestForTest()
	requestV117, _, _ := loadRuntimeServiceV117Fixture(t)
	observed := ""
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, incoming *http.Request) {
		defer incoming.Body.Close()
		payload, err := io.ReadAll(incoming.Body)
		if err != nil {
			t.Fatal(err)
		}
		var envelope map[string]any
		if err := json.Unmarshal(payload, &envelope); err != nil {
			t.Fatal(err)
		}
		observed, _ = envelope["contractVersion"].(string)
		writer.Header().Set("content-type", "application/json")
		writer.WriteHeader(http.StatusUnprocessableEntity)
		if observed == runtimeExecutionServiceVersionV117 {
			_, _ = writer.Write([]byte(`{"contractVersion":"runtime-execution-service-v1.17","kind":"systemFailure","matchId":"match:full-service:v1.17:0001","ok":false,"requestId":"request:full-service:v1.17:0001","systemFailure":{"classification":"system_failure","code":"EVIDENCE_UNVERIFIABLE","ownership":"system_integrity","playerPenalty":false,"publicMessage":"Runtime execution failed before completion.","retryable":false}}`))
			return
		}
		writeRuntimeServiceTestJSON(t, writer, runtimeServiceResponse{
			ContractVersion: runtimeExecutionServiceVersion,
			OK: false, Kind: "systemFailure", RequestID: requestV116.RequestID,
			MatchID: requestV116.Match.MatchID, RuntimeABIVersion: strategyRuntimeABIVersion,
			SystemFailure: &runtimeServiceFailure{Code: "EVIDENCE_UNVERIFIABLE", Retryable: false},
		})
	}))
	defer server.Close()
	router := newRuntimeServiceExecutionRouter(server.URL)
	router.semanticReceiptSecret = runtimeServiceV117FixtureSecret
	routedRequest := runtimeServiceExecutionRequest{ContractVersion: selected}
	if selected == runtimeExecutionServiceVersionV117 {
		routedRequest.V117 = &requestV117
	} else {
		routedRequest.V116 = &requestV116
	}
	if response, failure := router.executeMatch(context.Background(), routedRequest); response != nil || failure == nil {
		t.Fatalf("current route did not consume the real service client: response=%+v failure=%+v", response, failure)
	}
	if observed != selected {
		t.Fatalf("current route used %q, want %q", observed, selected)
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

	request := validRuntimeServiceRequestForTest()
	observed := ""
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, incoming *http.Request) {
		defer incoming.Body.Close()
		payload, err := io.ReadAll(incoming.Body)
		if err != nil {
			t.Fatal(err)
		}
		var envelope map[string]any
		if err := json.Unmarshal(payload, &envelope); err != nil {
			t.Fatal(err)
		}
		observed, _ = envelope["contractVersion"].(string)
		writeRuntimeServiceTestJSON(t, writer, runtimeServiceResponse{
			ContractVersion: runtimeExecutionServiceVersion,
			OK: false, Kind: "systemFailure", RequestID: request.RequestID,
			MatchID: request.Match.MatchID, RuntimeABIVersion: strategyRuntimeABIVersion,
			SystemFailure: &runtimeServiceFailure{Code: "EVIDENCE_UNVERIFIABLE", Retryable: false},
		})
	}))
	defer server.Close()
	router := newRuntimeServiceExecutionRouter(server.URL)
	router.currentContractVersion = func() string { return runtimeExecutionServiceVersionV117 }
	if response, failure := router.executeMatch(context.Background(), runtimeServiceExecutionRequest{
		ContractVersion: runtimeExecutionServiceVersion,
		V116:            &request,
	}); response != nil || failure == nil {
		t.Fatalf("historical route was not executed: response=%+v failure=%+v", response, failure)
	}
	if observed != runtimeExecutionServiceVersion {
		t.Fatalf("historical dispatch drifted to %q", observed)
	}
}
