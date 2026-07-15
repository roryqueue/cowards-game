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
	"strings"
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

func signedRuntimeServiceSuccessResponseV117ForTest(
	t *testing.T,
	request runtimeServiceRequestV117,
	chronicle map[string]any,
	finalState map[string]any,
	ledgerPoststateRoot string,
	secret string,
) runtimeServiceResponseV117 {
	t.Helper()
	chronicleBytes, err := runtimeInvocationV117CanonicalValue(chronicle)
	if err != nil {
		t.Fatal(err)
	}
	finalStateBytes, err := runtimeInvocationV117CanonicalValue(finalState)
	if err != nil {
		t.Fatal(err)
	}
	outcomeBytes, err := runtimeInvocationV117CanonicalValue(finalState["outcome"])
	if err != nil {
		t.Fatal(err)
	}
	requestBytes, err := encodeRuntimeServiceRequestV117(request)
	if err != nil {
		t.Fatal(err)
	}
	chronicleHash, err := hashRuntimeServiceCanonicalValueV117("cowards-game:runtime-semantic-chronicle-canonical-json:v1.17", chronicleBytes)
	if err != nil {
		t.Fatal(err)
	}
	finalStateHash, err := hashRuntimeServiceCanonicalValueV117("cowards-game:runtime-semantic-final-state-canonical-json:v1.17", finalStateBytes)
	if err != nil {
		t.Fatal(err)
	}
	outcomeHash, err := hashRuntimeServiceCanonicalValueV117("cowards-game:runtime-semantic-outcome-canonical-json:v1.17", outcomeBytes)
	if err != nil {
		t.Fatal(err)
	}
	bottomExactPinsHash, err := hashRuntimeServiceExactPinsV117(request.Entrants.Bottom.ExactPins)
	if err != nil {
		t.Fatal(err)
	}
	topExactPinsHash, err := hashRuntimeServiceExactPinsV117(request.Entrants.Top.ExactPins)
	if err != nil {
		t.Fatal(err)
	}
	receipt := runtimeSemanticReceiptV117{
		SchemaVersion: runtimeSemanticReceiptV117SchemaVersion, Profile: runtimeSemanticReceiptV117Profile,
		ServiceContractVersion: runtimeSemanticReceiptV117ServiceVersion,
		RequestSHA256:          runtimeInvocationV117SHA256Value(requestBytes), RequestID: request.RequestID, MatchID: request.MatchID,
		CompatibilityTupleID: request.CompatibilityTupleID, AuthorityBundleHash: request.Authority.BundleHash,
		AuthoritySourceManifestHash: request.Authority.SourceManifestHash, RegistryGeneration: request.Authority.RegistryGeneration,
		LegacyAuthorityBundleHash: request.LegacyAuthority.BundleHash, LegacyAuthoritySourceManifestHash: request.LegacyAuthority.SourceManifestHash,
		LegacyRegistryGeneration:   request.LegacyAuthority.RegistryGeneration,
		BottomIdentityManifestRoot: request.Entrants.Bottom.IdentityManifestRoot, BottomEvidenceGraphRoot: request.Entrants.Bottom.EvidenceGraphRoot,
		BottomStrategyRevisionID: request.Entrants.Bottom.StrategyRevisionID, BottomLaneIdentityHash: request.Entrants.Bottom.LaneIdentityHash,
		BottomOriginalSourceSHA256: request.Entrants.Bottom.SourceIdentity.OriginalSourceSHA256, BottomNormalizedSourceSHA256: request.Entrants.Bottom.SourceIdentity.NormalizedSourceSHA256,
		BottomArtifactSHA256: request.Entrants.Bottom.SourceIdentity.ArtifactSHA256, BottomExactPinsSHA256: bottomExactPinsHash,
		TopIdentityManifestRoot: request.Entrants.Top.IdentityManifestRoot, TopEvidenceGraphRoot: request.Entrants.Top.EvidenceGraphRoot,
		TopStrategyRevisionID: request.Entrants.Top.StrategyRevisionID, TopLaneIdentityHash: request.Entrants.Top.LaneIdentityHash,
		TopOriginalSourceSHA256: request.Entrants.Top.SourceIdentity.OriginalSourceSHA256, TopNormalizedSourceSHA256: request.Entrants.Top.SourceIdentity.NormalizedSourceSHA256,
		TopArtifactSHA256: request.Entrants.Top.SourceIdentity.ArtifactSHA256, TopExactPinsSHA256: topExactPinsHash,
		BudgetProfileSHA256: request.Accounting.BudgetProfileSHA256, LedgerPrestateRoot: request.Accounting.LedgerPrestateRoot,
		LedgerPoststateRoot: ledgerPoststateRoot, ChronicleCanonicalHash: chronicleHash, FinalStateCanonicalHash: finalStateHash,
		ReconstructedTerminalStateHash: "sha256:" + strings.Repeat("7", 64), OutcomeCanonicalHash: outcomeHash,
		RuntimeViolationEventCount: runtimeSemanticViolationCount(chronicle), Algorithm: "hmac-sha256", KeyID: runtimeSemanticReceiptV117KeyID,
	}
	previousSecret := runtimeServiceV117FixtureSecret
	if secret != previousSecret {
		receipt.Signature = ""
		message, messageErr := runtimeSemanticReceiptV117Message(receipt)
		if messageErr != nil {
			t.Fatal(messageErr)
		}
		mac := hmac.New(sha256.New, []byte(secret))
		_, _ = mac.Write(message)
		receipt.Signature = "hmac-sha256:" + hex.EncodeToString(mac.Sum(nil))
	} else {
		signRuntimeServiceReceiptV117(t, &receipt)
	}
	return runtimeServiceResponseV117{
		ContractVersion: runtimeExecutionServiceVersionV117, OK: true, Kind: "executionResult",
		RequestID: request.RequestID, MatchID: request.MatchID,
		Result: &runtimeServiceSuccessResultV117{
			Privacy: "internal_runtime_result", Chronicle: chronicleBytes, FinalState: finalStateBytes, Outcome: outcomeBytes,
			LedgerPoststateRoot: ledgerPoststateRoot, RuntimeViolationEventCount: receipt.RuntimeViolationEventCount, SemanticReceipt: receipt,
		},
	}
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
		{"authority bundle", func(response *runtimeServiceResponseV117) {
			response.Result.SemanticReceipt.AuthorityBundleHash = hash('0')
			signRuntimeServiceReceiptV117(t, &response.Result.SemanticReceipt)
		}},
		{"authority source manifest", func(response *runtimeServiceResponseV117) {
			response.Result.SemanticReceipt.AuthoritySourceManifestHash = hash('0')
			signRuntimeServiceReceiptV117(t, &response.Result.SemanticReceipt)
		}},
		{"legacy authority bundle", func(response *runtimeServiceResponseV117) {
			response.Result.SemanticReceipt.LegacyAuthorityBundleHash = hash('0')
			signRuntimeServiceReceiptV117(t, &response.Result.SemanticReceipt)
		}},
		{"legacy authority source manifest", func(response *runtimeServiceResponseV117) {
			response.Result.SemanticReceipt.LegacyAuthoritySourceManifestHash = hash('0')
			signRuntimeServiceReceiptV117(t, &response.Result.SemanticReceipt)
		}},
		{"legacy registry generation", func(response *runtimeServiceResponseV117) {
			response.Result.SemanticReceipt.LegacyRegistryGeneration = "8"
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
		{"bottom strategy revision", func(response *runtimeServiceResponseV117) {
			response.Result.SemanticReceipt.BottomStrategyRevisionID += ":mutated"
			signRuntimeServiceReceiptV117(t, &response.Result.SemanticReceipt)
		}},
		{"bottom lane identity", func(response *runtimeServiceResponseV117) {
			response.Result.SemanticReceipt.BottomLaneIdentityHash = hash('0')
			signRuntimeServiceReceiptV117(t, &response.Result.SemanticReceipt)
		}},
		{"bottom original source", func(response *runtimeServiceResponseV117) {
			response.Result.SemanticReceipt.BottomOriginalSourceSHA256 = hash('0')
			signRuntimeServiceReceiptV117(t, &response.Result.SemanticReceipt)
		}},
		{"bottom normalized source", func(response *runtimeServiceResponseV117) {
			response.Result.SemanticReceipt.BottomNormalizedSourceSHA256 = hash('0')
			signRuntimeServiceReceiptV117(t, &response.Result.SemanticReceipt)
		}},
		{"bottom artifact", func(response *runtimeServiceResponseV117) {
			response.Result.SemanticReceipt.BottomArtifactSHA256 = hash('0')
			signRuntimeServiceReceiptV117(t, &response.Result.SemanticReceipt)
		}},
		{"bottom exact pins", func(response *runtimeServiceResponseV117) {
			response.Result.SemanticReceipt.BottomExactPinsSHA256 = hash('0')
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
		{"top strategy revision", func(response *runtimeServiceResponseV117) {
			response.Result.SemanticReceipt.TopStrategyRevisionID += ":mutated"
			signRuntimeServiceReceiptV117(t, &response.Result.SemanticReceipt)
		}},
		{"top lane identity", func(response *runtimeServiceResponseV117) {
			response.Result.SemanticReceipt.TopLaneIdentityHash = hash('0')
			signRuntimeServiceReceiptV117(t, &response.Result.SemanticReceipt)
		}},
		{"top original source", func(response *runtimeServiceResponseV117) {
			response.Result.SemanticReceipt.TopOriginalSourceSHA256 = hash('f')
			signRuntimeServiceReceiptV117(t, &response.Result.SemanticReceipt)
		}},
		{"top normalized source", func(response *runtimeServiceResponseV117) {
			response.Result.SemanticReceipt.TopNormalizedSourceSHA256 = hash('0')
			signRuntimeServiceReceiptV117(t, &response.Result.SemanticReceipt)
		}},
		{"top artifact", func(response *runtimeServiceResponseV117) {
			response.Result.SemanticReceipt.TopArtifactSHA256 = hash('0')
			signRuntimeServiceReceiptV117(t, &response.Result.SemanticReceipt)
		}},
		{"top exact pins", func(response *runtimeServiceResponseV117) {
			response.Result.SemanticReceipt.TopExactPinsSHA256 = hash('0')
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
	withoutOptionalMatchID := []byte(`{"contractVersion":"runtime-execution-service-v1.17","kind":"systemFailure","ok":false,"requestId":"request:full-service:v1.17:0001","systemFailure":{"classification":"system_failure","code":"EVIDENCE_UNVERIFIABLE","ownership":"system_integrity","playerPenalty":false,"publicMessage":"Runtime execution failed before completion.","retryable":false}}`)
	response, failure = decodeRuntimeServiceResponseV117(request, withoutOptionalMatchID, runtimeServiceV117FixtureSecret)
	if response != nil || failure == nil || failure.Code != "EVIDENCE_UNVERIFIABLE" || failure.Retryable || failure.PlayerPenalty {
		t.Fatalf("optional failure Match id collapsed: response=%+v failure=%+v", response, failure)
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
		if observed == runtimeExecutionServiceVersionV117 {
			_, responseV117, _ := loadRuntimeServiceV117Fixture(t)
			_, _ = writer.Write(encodeRuntimeServiceResponseFixtureV117(t, responseV117))
			return
		}
		chronicle := orchestratorChronicleForRequest(requestV116, false)
		finalState := orchestratorFinalStateForRequest(requestV116)
		writeRuntimeServiceTestJSON(t, writer, runtimeServiceResponse{
			ContractVersion: runtimeExecutionServiceVersion,
			OK:              true, Kind: "executionResult", RequestID: requestV116.RequestID,
			MatchID: requestV116.Match.MatchID, RuntimeABIVersion: strategyRuntimeABIVersion,
			Result: signedRuntimeServiceSuccessResultForTest(t, requestV116, chronicle, finalState, runtimeServiceV117FixtureSecret),
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
	if response, failure := router.executeMatch(context.Background(), routedRequest); response == nil || failure != nil {
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
	payload := []byte(`{"contractVersion":"runtime-execution-service-v1.16","kind":"executionResult","matchId":"match:phase258:mixed","ok":true,"requestId":"request:phase258:mixed"}`)
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
			OK:              false, Kind: "systemFailure", RequestID: request.RequestID,
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
