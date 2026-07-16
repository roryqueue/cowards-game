package main

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"
)

const runtimeServiceV117FixtureSecret = "fixture-only:runtime-service-v1.17:secret"

func runtimeServiceValidationWireV117ForTest(t *testing.T, sourceFormat string, source string) map[string]any {
	t.Helper()
	response := providerReadinessV117ValidationResponse(t, sourceFormat, source)
	encoded, err := json.Marshal(response)
	if err != nil {
		t.Fatal(err)
	}
	var wire map[string]any
	if err := json.Unmarshal(encoded, &wire); err != nil {
		t.Fatal(err)
	}
	wire["provider"] = map[string]any{
		"id":                expectedRuntimeServiceValidationProviderIDV117(sourceFormat),
		"contractVersion":   "runtime-provider-validation-v1.17",
		"runtimeAbiVersion": strategyRuntimeABIVersionV117,
		"abiPosture":        expectedRuntimeServiceValidationABIPostureV117(sourceFormat),
	}
	return wire
}

func TestRuntimeServiceValidationV117AdmitsExactFourLanguageAuthority(t *testing.T) {
	for _, sourceFormat := range []string{"typescript", "python", "rust", "zig"} {
		t.Run(sourceFormat, func(t *testing.T) {
			source := "strategy source for " + sourceFormat + "\r\n"
			server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, _ *http.Request) {
				writeRuntimeServiceTestJSON(t, writer, runtimeServiceValidationWireV117ForTest(t, sourceFormat, source))
			}))
			defer server.Close()
			client := newRuntimeServiceClientV117(server.URL)
			response, failure := client.validateStrategy(context.Background(), sourceFormat, source, "strategy:v1.17:"+sourceFormat)
			if response == nil || failure != nil || !response.OK || stringValue(mapValue(response.Runtime, "language"), "id") != sourceFormat {
				t.Fatalf("exact %s v1.17 validation authority was rejected: response=%+v failure=%+v", sourceFormat, response, failure)
			}
		})
	}
}

func TestRuntimeServiceValidationV117RejectsPerLanguageProviderAndArtifactSubstitution(t *testing.T) {
	type mutation func(map[string]any)
	tests := []struct {
		name         string
		sourceFormat string
		mutate       mutation
	}{
		{name: "typescript provider", sourceFormat: "typescript", mutate: func(wire map[string]any) { mapValue(wire, "provider")["id"] = "strategy-language-provider-python" }},
		{name: "typescript artifact", sourceFormat: "typescript", mutate: func(wire map[string]any) {
			mapValue(mapValue(mapValue(wire, "metadata"), "sourceArtifact"), "toolchain")["runtime"] = "python3"
		}},
		{name: "python provider", sourceFormat: "python", mutate: func(wire map[string]any) { mapValue(wire, "provider")["id"] = "strategy-language-provider-js-ts" }},
		{name: "python artifact", sourceFormat: "python", mutate: func(wire map[string]any) {
			mapValue(mapValue(mapValue(wire, "metadata"), "sourceArtifact"), "toolchain")["validationPolicy"] = "python-source-validation-v1.33"
		}},
		{name: "rust provider", sourceFormat: "rust", mutate: func(wire map[string]any) { mapValue(wire, "provider")["id"] = "strategy-language-provider-zig-wasi" }},
		{name: "rust artifact", sourceFormat: "rust", mutate: func(wire map[string]any) {
			mapValue(mapValue(wire, "metadata"), "compiledArtifact")["targetTriple"] = "wasm32-wasi"
		}},
		{name: "rust counted claim", sourceFormat: "rust", mutate: func(wire map[string]any) {
			mapValue(mapValue(mapValue(wire, "metadata"), "compiledArtifact"), "publicEvidence")["nonCounted"] = false
		}},
		{name: "zig provider", sourceFormat: "zig", mutate: func(wire map[string]any) { mapValue(wire, "provider")["id"] = "strategy-language-provider-rust-wasi" }},
		{name: "zig artifact", sourceFormat: "zig", mutate: func(wire map[string]any) {
			mapValue(mapValue(wire, "metadata"), "compiledArtifact")["abiEnvelope"] = "stdin-stdout-json"
		}},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			source := "strategy source for " + test.sourceFormat + "\r\n"
			wire := runtimeServiceValidationWireV117ForTest(t, test.sourceFormat, source)
			test.mutate(wire)
			server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, _ *http.Request) {
				writeRuntimeServiceTestJSON(t, writer, wire)
			}))
			defer server.Close()
			response, failure := newRuntimeServiceClientV117(server.URL).validateStrategy(context.Background(), test.sourceFormat, source, "strategy:substitution")
			if response != nil || failure == nil || failure.Code != "RuntimeServiceContractMismatch" {
				t.Fatalf("%s substitution was admitted: response=%+v failure=%+v", test.name, response, failure)
			}
		})
	}
}

func TestRuntimeServiceValidationV117RejectsHTTPAndOuterInnerContradictions(t *testing.T) {
	source := "print('ok')\r\n"
	tests := []struct {
		name   string
		status int
		wire   func() map[string]any
	}{
		{name: "ok true with 422", status: http.StatusUnprocessableEntity, wire: func() map[string]any { return runtimeServiceValidationWireV117ForTest(t, "python", source) }},
		{name: "ok true with 500", status: http.StatusInternalServerError, wire: func() map[string]any { return runtimeServiceValidationWireV117ForTest(t, "python", source) }},
		{name: "ok true with error", status: http.StatusOK, wire: func() map[string]any {
			wire := runtimeServiceValidationWireV117ForTest(t, "python", source)
			wire["error"] = "contradictory failure detail"
			return wire
		}},
		{name: "ok false with nested valid", status: http.StatusUnprocessableEntity, wire: func() map[string]any {
			wire := runtimeServiceValidationWireV117ForTest(t, "python", source)
			wire["ok"] = false
			delete(wire, "provider")
			delete(wire, "runtime")
			delete(wire, "engineCompatibility")
			delete(wire, "metadata")
			delete(wire, "sourceHash")
			delete(wire, "sourceBytes")
			return wire
		}},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, _ *http.Request) {
				writer.WriteHeader(test.status)
				writeRuntimeServiceTestJSON(t, writer, test.wire())
			}))
			defer server.Close()
			response, failure := newRuntimeServiceClientV117(server.URL).validateStrategy(context.Background(), "python", source, "strategy:contradiction")
			if response != nil || failure == nil || failure.Code != "RuntimeServiceContractMismatch" {
				t.Fatalf("contradictory validation response was admitted: response=%+v failure=%+v", response, failure)
			}
		})
	}
}

func TestRuntimeServiceValidationV117PreservesOrdinaryInvalidDraft(t *testing.T) {
	source := "invalid strategy\n"
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, _ *http.Request) {
		writer.WriteHeader(http.StatusUnprocessableEntity)
		writeRuntimeServiceTestJSON(t, writer, map[string]any{
			"ok": false, "kind": "strategyValidation", "sourceFormat": "python",
			"validation": map[string]any{"valid": false, "errors": []any{map[string]any{"code": "MISSING_SOLDIER_BRAIN"}}},
		})
	}))
	defer server.Close()
	response, failure := newRuntimeServiceClientV117(server.URL).validateStrategy(context.Background(), "python", source, "strategy:invalid")
	if response == nil || failure != nil || response.OK || boolValue(response.Validation, "valid") {
		t.Fatalf("ordinary invalid Strategy draft was not preserved: response=%+v failure=%+v", response, failure)
	}
}

func TestPhase258ProviderValidationV117Admission(t *testing.T) {
	t.Run("four language exact authority", TestRuntimeServiceValidationV117AdmitsExactFourLanguageAuthority)
	t.Run("provider and artifact substitutions", TestRuntimeServiceValidationV117RejectsPerLanguageProviderAndArtifactSubstitution)
	t.Run("HTTP and outer-inner contradictions", TestRuntimeServiceValidationV117RejectsHTTPAndOuterInnerContradictions)
	t.Run("ordinary invalid draft", TestRuntimeServiceValidationV117PreservesOrdinaryInvalidDraft)
	t.Run("selected validation router", TestRuntimeServiceValidationRouterSelectsExactLegacyAndV117Clients)
	t.Run("mixed validation authority", TestRuntimeServiceValidationRouterRejectsMixedAuthority)
	t.Run("account outer OK seam", TestAccountRevisionWriteHookRejectsOuterFailureWithNestedSuccessEvidence)
}

func historicalPythonRuntimeMetadataV114ForTest() map[string]any {
	runtime := pythonRuntimeMetadata()
	runtime["abiVersion"] = strategyRuntimeABIVersion
	mapValue(runtime, "package")["entrypoint"] = "module"
	return runtime
}

func TestRuntimeServiceValidationRouterSelectsExactLegacyAndV117Clients(t *testing.T) {
	t.Setenv("COWARDS_RUNTIME_SERVICE_PRIVATE_ARTIFACT_TOKEN", "private-validation-v1.17-test")
	source := "print('ok')\r\n"

	t.Run("legacy selected", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
			writeRuntimeServiceTestJSON(t, writer, runtimeServiceValidationResponse{
				OK: true, Kind: "strategyValidation", SourceFormat: "python",
				Runtime: historicalPythonRuntimeMetadataV114ForTest(), Validation: map[string]any{"valid": true},
				EngineCompatibility: engineCompatibility(), Metadata: map[string]any{"tags": []string{"python"}},
				SourceHash: hashStrategySourceForGo(source), SourceBytes: len([]byte(source)),
			})
		}))
		defer server.Close()
		router := newRuntimeServiceExecutionRouter(server.URL)
		router.currentContractVersion = func() string { return runtimeExecutionServiceVersion }
		response, failure := router.validateStrategy(context.Background(), "python", source, "strategy:legacy")
		if failure != nil || response == nil || !response.OK || stringValue(response.Runtime, "abiVersion") != strategyRuntimeABIVersion {
			t.Fatalf("legacy selected validation route failed: response=%+v failure=%+v", response, failure)
		}
	})

	t.Run("v1.17 selected", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
			if request.URL.Path != "/validate-strategy" || request.Header.Get(runtimeServicePrivateArtifactTokenHeader) != "private-validation-v1.17-test" {
				t.Fatalf("v1.17 validation request route/header mismatch: %s", request.URL.Path)
			}
			var body map[string]any
			if err := json.NewDecoder(request.Body).Decode(&body); err != nil {
				t.Fatal(err)
			}
			if body["sourceFormat"] != "python" || body["source"] != source || body["includePrivateArtifact"] != true || body["strategyId"] != "strategy:v1.17" {
				t.Fatalf("v1.17 validation request body drifted: %+v", body)
			}
			writeRuntimeServiceTestJSON(t, writer, runtimeServiceValidationWireV117ForTest(t, "python", source))
		}))
		defer server.Close()
		router := newRuntimeServiceExecutionRouter(server.URL)
		router.currentContractVersion = func() string { return runtimeExecutionServiceVersionV117 }
		response, failure := router.validateStrategy(context.Background(), "python", source, "strategy:v1.17")
		if failure != nil || response == nil || !response.OK || stringValue(response.Runtime, "abiVersion") != strategyRuntimeABIVersionV117 {
			t.Fatalf("v1.17 selected validation route failed: response=%+v failure=%+v", response, failure)
		}
	})
}

func TestRuntimeServiceValidationRouterRejectsMixedAuthority(t *testing.T) {
	source := "print('ok')\r\n"
	legacyWire := runtimeServiceValidationResponse{
		OK: true, Kind: "strategyValidation", SourceFormat: "python",
		Runtime: pythonRuntimeMetadata(), Validation: map[string]any{"valid": true},
		EngineCompatibility: engineCompatibility(), Metadata: map[string]any{"tags": []string{"python"}},
		SourceHash: hashStrategySourceForGo(source), SourceBytes: len([]byte(source)),
	}
	tests := []struct {
		name             string
		selectedContract string
		wire             any
	}{
		{name: "legacy route receives successor evidence", selectedContract: runtimeExecutionServiceVersion, wire: runtimeServiceValidationWireV117ForTest(t, "python", source)},
		{name: "successor route receives legacy evidence", selectedContract: runtimeExecutionServiceVersionV117, wire: legacyWire},
		{name: "successor route receives legacy provider contract", selectedContract: runtimeExecutionServiceVersionV117, wire: func() map[string]any {
			wire := runtimeServiceValidationWireV117ForTest(t, "python", source)
			mapValue(wire, "provider")["contractVersion"] = "strategy-language-provider-contract-v1.33"
			return wire
		}()},
		{name: "successor route receives legacy runtime ABI", selectedContract: runtimeExecutionServiceVersionV117, wire: func() map[string]any {
			wire := runtimeServiceValidationWireV117ForTest(t, "python", source)
			mapValue(wire, "runtime")["abiVersion"] = strategyRuntimeABIVersion
			return wire
		}()},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
				writeRuntimeServiceTestJSON(t, writer, test.wire)
			}))
			defer server.Close()
			router := newRuntimeServiceExecutionRouter(server.URL)
			router.currentContractVersion = func() string { return test.selectedContract }
			response, failure := router.validateStrategy(context.Background(), "python", source, "strategy:mixed")
			if response != nil || failure == nil || failure.Code != "RuntimeServiceContractMismatch" {
				t.Fatalf("mixed validation authority was not rejected: response=%+v failure=%+v", response, failure)
			}
		})
	}

	router := newRuntimeServiceExecutionRouter("http://127.0.0.1:1")
	router.currentContractVersion = func() string { return "runtime-execution-service-v9.99" }
	if response, failure := router.validateStrategy(context.Background(), "python", source, "strategy:unknown"); response != nil || failure == nil || failure.Code != "RuntimeServiceContractMismatch" {
		t.Fatalf("unknown validation authority was not rejected: response=%+v failure=%+v", response, failure)
	}
}

func persistedSourceIdentityFixtureV117(t *testing.T, source string) (runtimeServiceStrategyRevision, goEntrantExecutionEvidence) {
	t.Helper()
	artifactBytes := []byte("runtime-service-v1.17-source-identity-artifact")
	artifactIdentity := runtimeInvocationV117SHA256Value(artifactBytes)
	originalBytes := []byte(source)
	lockedAt := time.Date(2026, 7, 15, 12, 0, 0, 0, time.UTC)
	strategyRevisionID := "strategy-revision:source-identity:v1.17"
	strategy := runtimeServiceStrategyRevision{
		ID:          strategyRevisionID,
		Source:      source,
		SourceHash:  hashString(source),
		SourceBytes: len(originalBytes),
		Runtime: map[string]any{
			"abiVersion": strategyRuntimeABIVersionV117,
			"language":   map[string]any{"id": "python"},
		},
		Metadata: map[string]any{
			"sourceArtifact": map[string]any{
				"hash":           artifactIdentity[len("sha256:"):],
				"bytesBase64":    base64.StdEncoding.EncodeToString(artifactBytes),
				"sourceIdentity": sourceIdentityMetadataV2(source),
			},
		},
		LockedAt: &lockedAt,
	}
	evidence := goEntrantExecutionEvidence{
		StrategyRevisionID: strategyRevisionID,
		LaneIdentity: goExecutableLaneIdentity{
			ArtifactSHA256: artifactIdentity[len("sha256:"):],
		},
	}
	return strategy, evidence
}

func TestRuntimeServiceSourceIdentityV117KeepsPlainInvocationHashesAndValidatesFramedArtifactIdentity(t *testing.T) {
	for _, source := range []string{
		"export default {}\n",
		"export default {}\r\n",
	} {
		strategy, evidence := persistedSourceIdentityFixtureV117(t, source)
		identity, ok := runtimeServiceSourceIdentityFromPersistedRevisionV117(strategy, evidence)
		if !ok {
			t.Fatalf("valid persisted source identity was rejected for %q", source)
		}
		if identity.OriginalSourceSHA256 != runtimeInvocationV117SHA256Value([]byte(source)) ||
			identity.NormalizedSourceSHA256 != runtimeInvocationV117SHA256Value([]byte(normalizeSourceV117(source))) {
			t.Fatalf("runtime invocation identity was not the plain source-byte SHA-256: %+v", identity)
		}
	}
}

func TestRuntimeServiceSourceIdentityV117RejectsPlainAndCrossDomainArtifactSubstitutions(t *testing.T) {
	source := "export default {}\r\n"
	for _, test := range []struct {
		name   string
		mutate func(map[string]any)
	}{
		{
			name: "plain sha substitution",
			mutate: func(declared map[string]any) {
				declared["originalSourceSha256"] = runtimeInvocationV117SHA256Value([]byte(source))
				declared["normalizedSourceSha256"] = runtimeInvocationV117SHA256Value([]byte(normalizeSourceV117(source)))
			},
		},
		{
			name: "cross domain substitution",
			mutate: func(declared map[string]any) {
				declared["originalSourceSha256"] = "sha256:" + framedSourceIdentityHash(normalizedSourceIdentityDomain, []byte(source))
				declared["normalizedSourceSha256"] = "sha256:" + framedSourceIdentityHash(originalSourceIdentityDomain, []byte(normalizeSourceV117(source)))
			},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			strategy, evidence := persistedSourceIdentityFixtureV117(t, source)
			declared := mapValue(mapValue(strategy.Metadata, "sourceArtifact"), "sourceIdentity")
			test.mutate(declared)
			if _, ok := runtimeServiceSourceIdentityFromPersistedRevisionV117(strategy, evidence); ok {
				t.Fatal("mismatched persisted source identity was accepted")
			}
		})
	}
}

func TestRuntimeServiceSourceIdentityV117RejectsRequiredIdentityDeletedAfterPersistence(t *testing.T) {
	strategy, evidence := persistedSourceIdentityFixtureV117(t, "print('ok')\r\n")
	delete(mapValue(strategy.Metadata, "sourceArtifact"), "sourceIdentity")
	if _, ok := runtimeServiceSourceIdentityFromPersistedRevisionV117(strategy, evidence); ok {
		t.Fatal("v1.17 Python persisted metadata deletion bypassed source-identity projection")
	}
}

func loadRuntimeServiceV117Fixture(t *testing.T) (runtimeServiceRequestV117, runtimeServiceResponseV117, []byte) {
	return loadRuntimeServiceV117FixturePaths(t,
		"../../packages/spec/artifacts/runtime-execution-service-request.v1.17.candidate.json",
		"../../packages/spec/artifacts/runtime-execution-service-response.v1.17.candidate.wire.json",
	)
}

func loadCurrentRuntimeServiceV117Fixture(t *testing.T) (runtimeServiceRequestV117, runtimeServiceResponseV117, []byte) {
	return loadRuntimeServiceV117FixturePaths(t,
		"../../packages/spec/artifacts/runtime-execution-service-request.v1.17.json",
		"../../packages/spec/artifacts/runtime-execution-service-response.v1.17.wire.json",
	)
}

func loadRuntimeServiceV117FixturePaths(t *testing.T, requestPath string, responsePath string) (runtimeServiceRequestV117, runtimeServiceResponseV117, []byte) {
	t.Helper()
	requestBytes, err := os.ReadFile(requestPath)
	if err != nil {
		t.Fatal(err)
	}
	responseBytes, err := os.ReadFile(responsePath)
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
	reconstructedTerminalStateHash, err := runtimeSemanticReconstructedTerminalStateHashV117(chronicle, finalState)
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
		ReconstructedTerminalStateHash: reconstructedTerminalStateHash, OutcomeCanonicalHash: outcomeHash,
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
	if historical, ok := runtimeInvocationContractForVersion(runtimeExecutionServiceVersion); !ok || !historical.Historical || historical.ContractVersion != runtimeExecutionServiceVersion {
		t.Fatalf("immutable historical v1.16 verifier dispatch is unavailable: descriptor=%+v ok=%v", historical, ok)
	}
	wireBytes, err := os.ReadFile("../../packages/spec/artifacts/runtime-execution-service-response.v1.16.wire.json")
	if err != nil {
		t.Fatal(err)
	}
	verified, verificationFailure := decodeRuntimeServiceResponseBytesWithSecret(
		validRuntimeServiceRequestForTest(), wireBytes, "fixture-v1.16-wire-golden-secret",
	)
	if verified == nil || verificationFailure != nil || !verified.OK || verified.Result == nil || verified.Result.SemanticReceipt.SchemaVersion != runtimeSemanticReceiptSchemaVersion {
		t.Fatalf("immutable historical v1.16 wire/receipt verification is unavailable: verified=%+v failure=%+v", verified, verificationFailure)
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
	response, failure := router.executeMatch(context.Background(), runtimeServiceExecutionRequest{
		ContractVersion: runtimeExecutionServiceVersion,
		V116:            &request,
	})
	if selectedRuntimeServiceContractVersion() == runtimeExecutionServiceVersion {
		if response != nil || failure == nil || observed != runtimeExecutionServiceVersion {
			t.Fatalf("selected v1.16 route did not preserve its current behavior: response=%+v failure=%+v observed=%q", response, failure, observed)
		}
		return
	}
	if response != nil || failure == nil || failure.ErrorClass != "RuntimeServiceContractMismatch" || observed != "" {
		t.Fatalf("retired v1.16 Match execution was not rejected before HTTP: response=%+v failure=%+v observed=%q", response, failure, observed)
	}
}

func TestPhase258ActivatedDefaultRoutes(t *testing.T) {
	if selectedRuntimeServiceContractVersion() != runtimeExecutionServiceVersionV117 ||
		strategyRuntimeABIVersionV117 != "strategy-runtime-abi-v1.17" ||
		runtimeSemanticReceiptV117SchemaVersion != "runtime-semantic-receipt-v1.17" ||
		canonicalJSONVersionV11 != "canonical-json-v1.1" {
		t.Fatal("atomic runtime v1.17 default tuple is not fully selected")
	}
	request, responseFixture, _ := loadCurrentRuntimeServiceV117Fixture(t)
	if request.CompatibilityTupleID != runtimeSuccessorSemanticTupleIDV117 {
		t.Fatal("activated request did not use the exact successor semantic tuple")
	}
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
		_, _ = writer.Write(encodeRuntimeServiceResponseFixtureV117(t, responseFixture))
	}))
	defer server.Close()
	router := newRuntimeServiceExecutionRouter(server.URL)
	router.semanticReceiptSecret = runtimeServiceV117FixtureSecret
	response, failure := router.executeMatch(context.Background(), runtimeServiceExecutionRequest{
		ContractVersion: runtimeExecutionServiceVersionV117,
		V117:            &request,
	})
	if response == nil || failure != nil || observed != runtimeExecutionServiceVersionV117 {
		t.Fatalf("activated route did not consume exact v1.17 service: response=%+v failure=%+v observed=%q", response, failure, observed)
	}
}
