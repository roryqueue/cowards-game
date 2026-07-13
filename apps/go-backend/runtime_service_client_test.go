package main

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"
)

func TestRuntimeServiceClientRejectsShapeOnlySuccessWithoutSemanticReceipt(t *testing.T) {
	request := validRuntimeServiceRequestForTest()
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, httpRequest *http.Request) {
		if httpRequest.URL.Path != "/execute-match" {
			t.Fatalf("unexpected path %s", httpRequest.URL.Path)
		}
		writeRuntimeServiceTestJSON(t, writer, runtimeServiceResponse{
			ContractVersion:   runtimeExecutionServiceVersion,
			OK:                true,
			Kind:              "executionResult",
			RequestID:         request.RequestID,
			MatchID:           request.Match.MatchID,
			RuntimeABIVersion: strategyRuntimeABIVersion,
			Result: &runtimeServiceSuccessResult{
				Chronicle:  map[string]any{"id": "chronicle:test"},
				FinalState: map[string]any{"matchId": request.Match.MatchID},
			},
		})
	}))
	defer server.Close()
	client := newRuntimeServiceClient(server.URL)

	response, failure := client.executeMatch(context.Background(), request)
	if response != nil || failure == nil || failure.ErrorClass != "RuntimeServiceSemanticIntegrity" || !failure.Retryable {
		t.Fatalf("shape-only success bypassed semantic receipt admission: response=%+v failure=%+v", response, failure)
	}
}

func TestRuntimeServiceFailureCodeParityIncludesEveryV116ContractCode(t *testing.T) {
	for _, code := range []string{
		"MALFORMED_REQUEST",
		"SOURCE_HASH_MISMATCH",
		"SOURCE_BYTES_MISMATCH",
		"UNSUPPORTED_RUNTIME_ADAPTER",
		"MATCH_EXECUTION_FAILED",
		"CHRONICLE_INTEGRITY_FAILED",
		"EXECUTION_EXCEPTION",
		"RESPONSE_SCHEMA_INVALID",
		"EVIDENCE_STALE",
		"EVIDENCE_REVOKED",
		"EVIDENCE_IDENTITY_MISMATCH",
		"EVIDENCE_UNVERIFIABLE",
		"EVIDENCE_REGISTRY_DRIFT",
	} {
		if !isRuntimeServiceContractFailureCode(code) {
			t.Fatalf("Go runtime-service failure-code parity omitted %s", code)
		}
	}
}

func TestRuntimeServiceV116ConsumesTypeScriptIssuedWireGolden(t *testing.T) {
	payload, err := os.ReadFile("../../packages/spec/artifacts/runtime-execution-service-response.v1.16.wire.json")
	if err != nil {
		t.Fatal(err)
	}
	for _, marker := range [][]byte{
		[]byte("<>&"),
		[]byte("\u2028"),
		[]byte("\u2029"),
		[]byte("日本語"),
		[]byte(`"zLower"`),
		[]byte(`"AUpper"`),
		[]byte(`"maxSafeInteger":9007199254740991`),
		[]byte(`"minSafeInteger":-9007199254740991`),
		[]byte(`"negativeZero":0`),
		[]byte(`"tinyDecimal":1e-7`),
		[]byte(`"exactDecimal":1.25`),
	} {
		if !bytes.Contains(payload, marker) {
			t.Fatalf("TypeScript wire golden omitted %q", marker)
		}
	}
	if bytes.Index(payload, []byte(`"zLower"`)) >= bytes.Index(payload, []byte(`"AUpper"`)) {
		t.Fatal("TypeScript wire golden did not preserve mixed-case insertion order")
	}
	request := validRuntimeServiceRequestForTest()
	decoded, failure := decodeRuntimeServiceResponseBytesWithSecret(request, payload, "fixture-v1.16-wire-golden-secret")
	if failure != nil || decoded == nil || !decoded.OK {
		t.Fatalf("TypeScript-issued wire golden was rejected: decoded=%+v failure=%+v", decoded, failure)
	}
	var rewritten any
	if err := decodeStrictJSONUseNumber(payload, &rewritten); err != nil {
		t.Fatal(err)
	}
	rewrittenPayload, err := json.Marshal(rewritten)
	if err != nil {
		t.Fatal(err)
	}
	if bytes.Equal(rewrittenPayload, payload) {
		t.Fatal("Go rewrite unexpectedly preserved the TypeScript wire bytes")
	}
	if decoded, failure := decodeRuntimeServiceResponseBytesWithSecret(request, rewrittenPayload, "fixture-v1.16-wire-golden-secret"); decoded != nil || failure == nil {
		t.Fatalf("wire-byte rewrite was admitted: decoded=%+v failure=%+v", decoded, failure)
	}
}

func TestRuntimeServiceV116RejectsUppercaseSignatureAndForbiddenChronicleMetadata(t *testing.T) {
	const secret = "fixture-semantic-receipt-secret-v1"
	request := validRuntimeServiceRequestForTest()
	chronicle := orchestratorChronicleForRequest(request, false)
	finalState := orchestratorFinalStateForRequest(request)

	t.Run("uppercase signature", func(t *testing.T) {
		result := signedRuntimeServiceSuccessResultForTest(t, request, chronicle, finalState, secret)
		result.SemanticReceipt.Signature = "hmac-sha256:" + strings.ToUpper(strings.TrimPrefix(result.SemanticReceipt.Signature, "hmac-sha256:"))
		payload, err := json.Marshal(runtimeServiceResponse{
			ContractVersion: runtimeExecutionServiceVersion, OK: true, Kind: "executionResult",
			RequestID: request.RequestID, MatchID: request.Match.MatchID, RuntimeABIVersion: strategyRuntimeABIVersion,
			Result: result,
		})
		if err != nil {
			t.Fatal(err)
		}
		decoded, failure := decodeRuntimeServiceResponseBytesWithSecret(request, payload, secret)
		if decoded != nil || failure == nil {
			t.Fatalf("uppercase signature was admitted: decoded=%+v failure=%+v", decoded, failure)
		}
	})

	for _, field := range []string{"integrity", "storageMetadata"} {
		t.Run(field, func(t *testing.T) {
			mutated := semanticCloneValue(t, chronicle).(map[string]any)
			mutated[field] = map[string]any{"hostPath": "/private/runtime/storage", "algorithm": "sha256"}
			result := signedRuntimeServiceSuccessResultForTest(t, request, mutated, finalState, secret)
			payload, err := json.Marshal(runtimeServiceResponse{
				ContractVersion: runtimeExecutionServiceVersion, OK: true, Kind: "executionResult",
				RequestID: request.RequestID, MatchID: request.Match.MatchID, RuntimeABIVersion: strategyRuntimeABIVersion,
				Result: result,
			})
			if err != nil {
				t.Fatal(err)
			}
			decoded, failure := decodeRuntimeServiceResponseBytesWithSecret(request, payload, secret)
			if decoded != nil || failure == nil {
				t.Fatalf("forbidden Chronicle %s was admitted: decoded=%+v failure=%+v", field, decoded, failure)
			}
		})
	}
}

func TestRuntimeServiceRetiredCandidateProfileFailsClosed(t *testing.T) {
	request := validRuntimeServiceRequestForTest()
	payload, err := json.Marshal(map[string]any{
		"ok": false, "profile": "candidate_exhibition", "counted": false,
		"publishable": false, "privacy": "internal_candidate_exhibition",
		"failure": map[string]any{
			"classification": "system_failure", "ownership": "system_integrity",
			"code": "CANDIDATE_FINAL_STATE_INVALID", "retryable": false, "playerPenalty": false,
		},
	})
	if err != nil {
		t.Fatal(err)
	}
	response, failure := decodeRuntimeServiceResponseBytes(request, payload)
	if response != nil || failure == nil || failure.ErrorClass != "RuntimeServiceSemanticIntegrity" || !failure.Retryable {
		t.Fatalf("retired candidate profile did not fail closed: response=%+v failure=%+v", response, failure)
	}
	if failure.Details["status"] != semanticIntegrityPublicCategory {
		t.Fatalf("retired profile rejection was not bounded: %+v", failure)
	}
	assertRuntimeServiceFailureSafe(t, failure)
}

func TestRuntimeServiceRequestIntegrityReferenceContract(t *testing.T) {
	request := validRuntimeServiceRequestForTest()
	encoded, err := json.Marshal(request)
	if err != nil {
		t.Fatal(err)
	}
	text := string(encoded)
	for _, required := range []string{
		`"evidenceSnapshot"`, `"compatibility"`, `"tupleId"`,
		`"authorityBundleHash"`, `"registryGeneration"`,
		`"publicationId"`, `"installReceiptId"`, `"sourceManifestHash"`,
		`"laneIdentityHash"`, `"containmentCertificateId"`,
		`"schedulingDecision"`, `"reasonCode"`, `"evaluatedAt"`, `"freshUntil"`,
	} {
		if !strings.Contains(text, required) {
			t.Fatalf("runtime request omitted exact integrity reference %s: %s", required, text)
		}
	}
	for _, forbidden := range []string{`"laneIdentity":`, `"certificates":`, `"attestations":`, `"signatureBase64":`, `"sourceIds":`} {
		if strings.Contains(text, forbidden) {
			t.Fatalf("runtime request carried authority payload %s: %s", forbidden, text)
		}
	}
}

func TestRuntimeServiceClientValidatesPythonProviderSource(t *testing.T) {
	source := "def select_activations(input):\n    return {\"activationOrders\": [], \"strategyMemory\": input[\"strategyMemory\"]}\n\ndef soldier_brain(input):\n    return {\"action\": {\"type\": \"TURN_TO_STONE\"}, \"soldierMemory\": input[\"soldierMemory\"]}\n"
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, httpRequest *http.Request) {
		if httpRequest.URL.Path != "/validate-strategy" {
			t.Fatalf("unexpected path %s", httpRequest.URL.Path)
		}
		writeRuntimeServiceTestJSON(t, writer, runtimeServiceValidationResponse{
			OK:           true,
			Kind:         "strategyValidation",
			SourceFormat: "python",
			Runtime:      pythonRuntimeMetadata(),
			Validation: map[string]any{
				"valid":       true,
				"errors":      []any{},
				"warnings":    []any{},
				"sourceHash":  hashStrategySourceForGo(source),
				"sourceBytes": len([]byte(source)),
			},
			EngineCompatibility: engineCompatibility(),
			Metadata:            map[string]any{"tags": []string{"python", "counted", "provider"}},
			SourceHash:          hashStrategySourceForGo(source),
			SourceBytes:         len([]byte(source)),
		})
	}))
	defer server.Close()
	client := newRuntimeServiceClient(server.URL)

	response, failure := client.validateStrategy(context.Background(), "python", source, "strategy:python")
	if failure != nil {
		t.Fatalf("unexpected failure: %s", runtimeServiceFailureJSONSafe(failure))
	}
	if response == nil || !response.OK || response.SourceFormat != "python" {
		t.Fatalf("expected Python validation success, got %+v", response)
	}
}

func TestRuntimeServiceClientValidatesTypeScriptProviderSourceD01D02D09D10(t *testing.T) {
	t.Setenv("COWARDS_RUNTIME_SERVICE_PRIVATE_ARTIFACT_TOKEN", "cowards-private-artifact-test-token-v1.35")
	source := "export default { selectActivations() { return []; }, soldierBrain() { return { action: { type: \"TURN_TO_STONE\" }, soldierMemory: null }; } }"
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, httpRequest *http.Request) {
		if httpRequest.URL.Path != "/validate-strategy" {
			t.Fatalf("unexpected path %s", httpRequest.URL.Path)
		}
		if got := httpRequest.Header.Get(runtimeServicePrivateArtifactTokenHeader); got != "cowards-private-artifact-test-token-v1.35" {
			t.Fatalf("expected private artifact token header, got %q", got)
		}
		var request map[string]any
		if err := json.NewDecoder(httpRequest.Body).Decode(&request); err != nil {
			t.Fatal(err)
		}
		if request["sourceFormat"] != "typescript" ||
			request["strategyId"] != "strategy:typescript" ||
			request["includePrivateArtifact"] != true {
			t.Fatalf("unexpected TypeScript validation request: %+v", request)
		}
		writeRuntimeServiceTestJSON(t, writer, runtimeServiceValidationResponse{
			OK:           true,
			Kind:         "strategyValidation",
			SourceFormat: "typescript",
			Runtime: map[string]any{
				"language": map[string]any{"id": "typescript"},
				"adapter":  map[string]any{"id": "runtime-service-js-ts"},
				"package":  map[string]any{"mode": "none"},
			},
			Validation: map[string]any{
				"valid":       true,
				"errors":      []any{},
				"warnings":    []any{},
				"sourceHash":  hashStrategySourceForGo(source),
				"sourceBytes": len([]byte(source)),
			},
			EngineCompatibility: engineCompatibility(),
			Metadata: map[string]any{
				"tags": []string{"typescript", "artifact-proven", "counted", "provider"},
				"sourceArtifact": map[string]any{
					"format":      "javascript-module",
					"hash":        "sha256:typescript-artifact-test",
					"bytes":       128,
					"sourceHash":  hashStrategySourceForGo(source),
					"sourceBytes": len([]byte(source)),
				},
				"providerValidation": map[string]any{
					"providerId":      "strategy-language-provider-js-ts",
					"contractVersion": "strategy-language-provider-contract-v1.33",
					"sourceHash":      hashStrategySourceForGo(source),
					"sourceBytes":     len([]byte(source)),
					"artifactHash":    "sha256:typescript-artifact-test",
					"artifactBytes":   128,
					"proof":           "hmac-sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
				},
			},
			SourceHash:  hashStrategySourceForGo(source),
			SourceBytes: len([]byte(source)),
		})
	}))
	defer server.Close()
	client := newRuntimeServiceClient(server.URL)

	response, failure := client.validateStrategy(context.Background(), "typescript", source, "strategy:typescript")
	if failure != nil {
		t.Fatalf("unexpected failure: %s", runtimeServiceFailureJSONSafe(failure))
	}
	if response == nil || !response.OK || response.SourceFormat != "typescript" {
		t.Fatalf("expected TypeScript validation success, got %+v", response)
	}
}

func TestRuntimeServiceClientRejectsTypeScriptValidationDriftD02D04D09D10(t *testing.T) {
	source := "export default { selectActivations() { return []; }, soldierBrain() { return { action: { type: \"TURN_TO_STONE\" }, soldierMemory: null }; } }"

	t.Run("private artifact unauthorized", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, _ *http.Request) {
			writer.WriteHeader(http.StatusForbidden)
			writeRuntimeServiceTestJSON(t, writer, runtimeServiceValidationResponse{
				OK:           false,
				Kind:         "strategyValidation",
				SourceFormat: "typescript",
				Error:        "Private artifact validation evidence is not available.",
			})
		}))
		defer server.Close()
		client := newRuntimeServiceClient(server.URL)

		_, failure := client.validateStrategy(context.Background(), "typescript", source, "strategy:typescript")
		if failure == nil || failure.ErrorClass != "RuntimeServicePrivateArtifactUnauthorized" || failure.Retryable {
			t.Fatalf("expected fail-loud private artifact authorization failure, got %+v", failure)
		}
		assertRuntimeServiceFailureSafe(t, failure)
	})

	t.Run("wrong source format", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, _ *http.Request) {
			writeRuntimeServiceTestJSON(t, writer, runtimeServiceValidationResponse{
				OK:           true,
				Kind:         "strategyValidation",
				SourceFormat: "python",
				Runtime:      map[string]any{"language": map[string]any{"id": "typescript"}},
				Validation:   map[string]any{"valid": true},
				Metadata:     map[string]any{"tags": []string{"typescript"}},
				SourceHash:   hashStrategySourceForGo(source),
				SourceBytes:  len([]byte(source)),
			})
		}))
		defer server.Close()
		client := newRuntimeServiceClient(server.URL)

		_, failure := client.validateStrategy(context.Background(), "typescript", source, "strategy:typescript")
		if failure == nil || failure.ErrorClass != "RuntimeServiceContractMismatch" || !failure.Retryable {
			t.Fatalf("expected retryable contract mismatch, got %+v", failure)
		}
		assertRuntimeServiceFailureSafe(t, failure)
	})

	t.Run("incomplete success", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, _ *http.Request) {
			writeRuntimeServiceTestJSON(t, writer, runtimeServiceValidationResponse{
				OK:           true,
				Kind:         "strategyValidation",
				SourceFormat: "typescript",
				Runtime:      map[string]any{"language": map[string]any{"id": "typescript"}},
				SourceHash:   hashStrategySourceForGo(source),
				SourceBytes:  len([]byte(source)),
			})
		}))
		defer server.Close()
		client := newRuntimeServiceClient(server.URL)

		_, failure := client.validateStrategy(context.Background(), "typescript", source, "strategy:typescript")
		if failure == nil || failure.ErrorClass != "RuntimeServiceMalformedResponse" || !failure.Retryable {
			t.Fatalf("expected retryable malformed response, got %+v", failure)
		}
		assertRuntimeServiceFailureSafe(t, failure)
	})

	t.Run("source identity mismatch", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, _ *http.Request) {
			writeRuntimeServiceTestJSON(t, writer, runtimeServiceValidationResponse{
				OK:                  true,
				Kind:                "strategyValidation",
				SourceFormat:        "typescript",
				Runtime:             map[string]any{"language": map[string]any{"id": "typescript"}},
				Validation:          map[string]any{"valid": true},
				EngineCompatibility: engineCompatibility(),
				Metadata:            map[string]any{"tags": []string{"typescript"}},
				SourceHash:          hashStrategySourceForGo(source + "changed"),
				SourceBytes:         len([]byte(source)),
			})
		}))
		defer server.Close()
		client := newRuntimeServiceClient(server.URL)

		_, failure := client.validateStrategy(context.Background(), "typescript", source, "strategy:typescript")
		if failure == nil || failure.ErrorClass != "RuntimeServiceSourceMismatch" || failure.Retryable {
			t.Fatalf("expected non-retryable source mismatch, got %+v", failure)
		}
		assertRuntimeServiceFailureSafe(t, failure)
	})
}

func TestRuntimeServiceClientRejectsUnsupportedValidationFormatD01(t *testing.T) {
	called := false
	server := httptest.NewServer(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
		called = true
	}))
	defer server.Close()
	client := newRuntimeServiceClient(server.URL)

	_, failure := client.validateStrategy(context.Background(), "javascript", "export default {}", "strategy:javascript")
	if failure == nil || failure.ErrorClass != "RuntimeServiceContractMismatch" || failure.Retryable {
		t.Fatalf("expected non-retryable contract mismatch, got %+v", failure)
	}
	if called {
		t.Fatal("client called runtime service for unsupported source format")
	}
	assertRuntimeServiceFailureSafe(t, failure)
}

func TestRuntimeServiceClientRejectsSourceMismatchBeforeTransport(t *testing.T) {
	called := false
	server := httptest.NewServer(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
		called = true
	}))
	defer server.Close()
	request := validRuntimeServiceRequestForTest()
	request.Strategies.Bottom.SourceHash = "wrong"
	client := newRuntimeServiceClient(server.URL)

	_, failure := client.executeMatch(context.Background(), request)
	if failure == nil || failure.ErrorClass != "RuntimeServiceSourceMismatch" || failure.Retryable {
		t.Fatalf("expected non-retryable source mismatch, got %+v", failure)
	}
	if called {
		t.Fatal("client called runtime service after local source mismatch")
	}
	assertRuntimeServiceFailureSafe(t, failure)
}

func TestRuntimeServiceClientRejectsSourceByteMismatchBeforeTransport(t *testing.T) {
	called := false
	server := httptest.NewServer(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
		called = true
	}))
	defer server.Close()
	request := validRuntimeServiceRequestForTest()
	request.Strategies.Bottom.SourceBytes++
	request.Strategies.Bottom.Validation["sourceBytes"] = request.Strategies.Bottom.SourceBytes
	client := newRuntimeServiceClient(server.URL)

	_, failure := client.executeMatch(context.Background(), request)
	if failure == nil || failure.ErrorClass != "RuntimeServiceSourceMismatch" || failure.Retryable {
		t.Fatalf("expected non-retryable source byte mismatch, got %+v", failure)
	}
	if called {
		t.Fatal("client called runtime service after local source byte mismatch")
	}
	assertRuntimeServiceFailureSafe(t, failure)
}

func TestRuntimeServiceClientRejectsContractMismatchBeforeTransport(t *testing.T) {
	called := false
	server := httptest.NewServer(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
		called = true
	}))
	defer server.Close()
	request := validRuntimeServiceRequestForTest()
	request.Match.BottomStrategyRevisionID = "strategy-revision:other"
	client := newRuntimeServiceClient(server.URL)

	_, failure := client.executeMatch(context.Background(), request)
	if failure == nil || failure.ErrorClass != "RuntimeServiceContractMismatch" || failure.Retryable {
		t.Fatalf("expected non-retryable contract mismatch, got %+v", failure)
	}
	if called {
		t.Fatal("client called runtime service after local contract mismatch")
	}
}

func TestRuntimeServiceClientClassifiesTransportMalformedOversizedAndTimeout(t *testing.T) {
	request := validRuntimeServiceRequestForTest()

	t.Run("stopped service", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {}))
		endpoint := server.URL
		server.Close()
		client := newRuntimeServiceClient(endpoint)
		_, failure := client.executeMatch(context.Background(), request)
		if failure == nil || failure.ErrorClass != "RuntimeServiceTransport" || !failure.Retryable {
			t.Fatalf("expected retryable transport failure, got %+v", failure)
		}
	})

	t.Run("malformed response", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, _ *http.Request) {
			_, _ = writer.Write([]byte(`{"contractVersion":`))
		}))
		defer server.Close()
		client := newRuntimeServiceClient(server.URL)
		_, failure := client.executeMatch(context.Background(), request)
		if failure == nil || failure.ErrorClass != "RuntimeServiceMalformedResponse" || !failure.Retryable {
			t.Fatalf("expected retryable malformed response, got %+v", failure)
		}
	})

	t.Run("oversized response", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, _ *http.Request) {
			_, _ = writer.Write([]byte(strings.Repeat("x", 32)))
		}))
		defer server.Close()
		client := newRuntimeServiceClient(server.URL)
		client.maxResponseBytes = 8
		_, failure := client.executeMatch(context.Background(), request)
		if failure == nil || failure.ErrorClass != "RuntimeServiceOversizedResponse" || !failure.Retryable {
			t.Fatalf("expected retryable oversized response, got %+v", failure)
		}
	})

	t.Run("timeout", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
			time.Sleep(50 * time.Millisecond)
		}))
		defer server.Close()
		client := newRuntimeServiceClient(server.URL)
		client.httpClient.Timeout = 5 * time.Millisecond
		_, failure := client.executeMatch(context.Background(), request)
		if failure == nil || failure.ErrorClass != "RuntimeServiceTimeout" || !failure.Retryable {
			t.Fatalf("expected retryable timeout response, got %+v", failure)
		}
	})
}

func TestRuntimeServiceClientHTTPTimeoutDefaultAndOverride(t *testing.T) {
	t.Setenv("COWARDS_RUNTIME_SERVICE_HTTP_TIMEOUT_MS", "")
	if got := runtimeServiceHTTPTimeout(); got != defaultRuntimeServiceHTTPTimeout {
		t.Fatalf("expected default runtime service timeout %s, got %s", defaultRuntimeServiceHTTPTimeout, got)
	}

	t.Setenv("COWARDS_RUNTIME_SERVICE_HTTP_TIMEOUT_MS", "1234")
	if got := runtimeServiceHTTPTimeout(); got != 1234*time.Millisecond {
		t.Fatalf("expected configured runtime service timeout, got %s", got)
	}

	t.Setenv("COWARDS_RUNTIME_SERVICE_HTTP_TIMEOUT_MS", "-1")
	if got := runtimeServiceHTTPTimeout(); got != defaultRuntimeServiceHTTPTimeout {
		t.Fatalf("expected invalid configured timeout to fall back, got %s", got)
	}
}

func TestRuntimeServiceClientRejectsRuntimeABIDriftInResponse(t *testing.T) {
	request := validRuntimeServiceRequestForTest()
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, _ *http.Request) {
		writeRuntimeServiceTestJSON(t, writer, runtimeServiceResponse{
			ContractVersion:   runtimeExecutionServiceVersion,
			OK:                true,
			Kind:              "executionResult",
			RequestID:         request.RequestID,
			MatchID:           request.Match.MatchID,
			RuntimeABIVersion: "strategy-runtime-abi-v0",
			Result: &runtimeServiceSuccessResult{
				Chronicle:  map[string]any{"id": "chronicle:test"},
				FinalState: map[string]any{"matchId": request.Match.MatchID},
			},
		})
	}))
	defer server.Close()
	client := newRuntimeServiceClient(server.URL)

	_, failure := client.executeMatch(context.Background(), request)
	if failure == nil || failure.ErrorClass != "RuntimeServiceContractMismatch" || !failure.Retryable {
		t.Fatalf("expected retryable response ABI mismatch, got %+v", failure)
	}
}

func TestRuntimeServiceClientSanitizesServiceFailure(t *testing.T) {
	request := validRuntimeServiceRequestForTest()
	privateMarkers := []string{
		"export default strategy source",
		"StrategyMemory ownerDebug",
		"SoldierMemory objectivePayload",
		"raw Awareness Grid stack trace",
		"stderr sessionId token",
		"mysql://user:pass@localhost:3306/cowards",
		"postgres://user:pass@localhost:5432/cowards",
		"hostPath /Users/secret/project",
		"private runtime internals",
	}
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, _ *http.Request) {
		writer.WriteHeader(http.StatusUnprocessableEntity)
		writeRuntimeServiceTestJSON(t, writer, runtimeServiceResponse{
			ContractVersion:   runtimeExecutionServiceVersion,
			OK:                false,
			Kind:              "systemFailure",
			RequestID:         request.RequestID,
			MatchID:           request.Match.MatchID,
			RuntimeABIVersion: strategyRuntimeABIVersion,
			SystemFailure: &runtimeServiceFailure{
				Code:         "EXECUTION_EXCEPTION",
				ErrorMessage: strings.Join(privateMarkers, " | "),
				PublicMessage: strings.Join(
					append([]string{"runtime failed"}, privateMarkers...),
					" | ",
				),
				Retryable: true,
				Details: map[string]any{
					"strategyExecutionAdapterId": "subprocess",
					"stderr":                     "export default {}",
					"hostPath":                   "/Users/secret/project",
					"ownerDebug":                 "owner-only details",
					"sessionId":                  "session-secret",
					"database":                   "mysql://user:pass@localhost:3306/cowards",
					"privateRuntimeInternals":    "hidden runtime state",
					"strategyExecutionSystemFailureDetails": map[string]any{
						"cause":      "bad json with export default strategyMemory",
						"stderr":     "private source",
						"ownerDebug": "nested owner debug",
					},
				},
			},
		})
	}))
	defer server.Close()
	client := newRuntimeServiceClient(server.URL)

	_, failure := client.executeMatch(context.Background(), request)
	if failure == nil || failure.ErrorClass != "EXECUTION_EXCEPTION" || !failure.Retryable {
		t.Fatalf("expected service failure, got %+v", failure)
	}
	assertRuntimeServiceFailureSafe(t, failure)
}

func TestRuntimeServiceClientRejectsUnknownSystemFailureCode(t *testing.T) {
	request := validRuntimeServiceRequestForTest()
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, _ *http.Request) {
		writer.WriteHeader(http.StatusUnprocessableEntity)
		writeRuntimeServiceTestJSON(t, writer, runtimeServiceResponse{
			ContractVersion:   runtimeExecutionServiceVersion,
			OK:                false,
			Kind:              "systemFailure",
			RequestID:         request.RequestID,
			MatchID:           request.Match.MatchID,
			RuntimeABIVersion: strategyRuntimeABIVersion,
			SystemFailure: &runtimeServiceFailure{
				Code:          "SubprocessSystemFailure",
				ErrorMessage:  "Runtime execution failed.",
				PublicMessage: "Runtime execution failed before completion.",
				Retryable:     true,
			},
		})
	}))
	defer server.Close()
	client := newRuntimeServiceClient(server.URL)

	_, failure := client.executeMatch(context.Background(), request)
	if failure == nil || failure.ErrorClass != "RuntimeServiceMalformedResponse" || !failure.Retryable {
		t.Fatalf("expected malformed response for unknown failure code, got %+v", failure)
	}
}

func TestRuntimeServiceClientRejectsNonContractSystemFailureErrorClass(t *testing.T) {
	request := validRuntimeServiceRequestForTest()
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, _ *http.Request) {
		writer.WriteHeader(http.StatusUnprocessableEntity)
		writeRuntimeServiceTestJSON(t, writer, map[string]any{
			"contractVersion":   runtimeExecutionServiceVersion,
			"ok":                false,
			"kind":              "systemFailure",
			"requestId":         request.RequestID,
			"matchId":           request.Match.MatchID,
			"runtimeAbiVersion": strategyRuntimeABIVersion,
			"systemFailure": map[string]any{
				"code":          "EXECUTION_EXCEPTION",
				"errorClass":    "FallbackSystemFailure",
				"message":       "Runtime execution failed.",
				"publicMessage": "Runtime execution failed before completion.",
				"retryable":     true,
			},
		})
	}))
	defer server.Close()
	client := newRuntimeServiceClient(server.URL)

	_, failure := client.executeMatch(context.Background(), request)
	if failure == nil || failure.ErrorClass != "RuntimeServiceMalformedResponse" || !failure.Retryable {
		t.Fatalf("expected malformed response for non-contract errorClass, got %+v", failure)
	}
	assertRuntimeServiceFailureSafe(t, failure)
}

func TestRuntimeServiceClientRejectsResponseContractDrift(t *testing.T) {
	request := validRuntimeServiceRequestForTest()
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, _ *http.Request) {
		writeRuntimeServiceTestJSON(t, writer, map[string]any{
			"contractVersion":   runtimeExecutionServiceVersion,
			"ok":                true,
			"kind":              "executionResult",
			"requestId":         request.RequestID,
			"matchId":           "match:other",
			"runtimeAbiVersion": strategyRuntimeABIVersion,
			"result":            map[string]any{"chronicle": map[string]any{}},
		})
	}))
	defer server.Close()
	client := newRuntimeServiceClient(server.URL)

	_, failure := client.executeMatch(context.Background(), request)
	if failure == nil || failure.ErrorClass != "RuntimeServiceContractMismatch" {
		t.Fatalf("expected contract mismatch, got %+v", failure)
	}
}

func validRuntimeServiceRequestForTest() runtimeServiceRequest {
	bytes, err := os.ReadFile("../../packages/spec/artifacts/runtime-execution-service-request.v1.16.json")
	if err != nil {
		panic(err)
	}
	var request runtimeServiceRequest
	if err := json.Unmarshal(bytes, &request); err != nil {
		panic(err)
	}
	if request.EvidenceSnapshot.Publication.PublicationID == "" {
		request.EvidenceSnapshot.Publication = runtimeServicePublicationReference{
			PublicationID: "publication:fixture", InstallReceiptID: "receipt:fixture",
			PayloadSHA256:  request.EvidenceSnapshot.AuthorityBundleHash,
			EnvelopeSHA256: "sha256:" + strings.Repeat("e", 64), SourceManifestHash: "sha256:" + strings.Repeat("f", 64),
		}
	}
	for _, entrant := range []*runtimeServiceEntrantAuthorityReference{&request.EvidenceSnapshot.Entrants.Bottom, &request.EvidenceSnapshot.Entrants.Top} {
		entrant.SchedulingDecision = runtimeServiceSchedulingDecisionReference{
			Status: entrant.EffectiveStatus, ReasonCode: "EVIDENCE_CURRENT",
			EvaluatedAt: "2026-07-13T12:00:00.000Z", FreshUntil: "2026-07-14T12:00:00.000Z",
			RegistryGeneration: request.EvidenceSnapshot.RegistryGeneration,
		}
		entrant.SchedulingDecisionHash = hashRuntimeServiceSchedulingDecision(request.EvidenceSnapshot, *entrant)
	}
	return request
}

func signedRuntimeServiceSuccessResultForTest(t *testing.T, request runtimeServiceRequest, chronicle map[string]any, finalState map[string]any, secret string) *runtimeServiceSuccessResult {
	t.Helper()
	chronicleHash, chronicleJSON, err := runtimeSemanticChronicleWireBytesHash(chronicle)
	if err != nil {
		t.Fatal(err)
	}
	finalStateHash, finalStateJSON, err := runtimeSemanticFinalStateWireBytesHash(finalState)
	if err != nil {
		t.Fatal(err)
	}
	outcomeHash, outcomeJSON, err := runtimeSemanticOutcomeWireBytesHash(finalState)
	if err != nil {
		t.Fatal(err)
	}
	receipt := runtimeSemanticReceipt{
		SchemaVersion: runtimeSemanticReceiptSchemaVersion, Profile: runtimeSemanticReceiptProfile,
		ServiceContractVersion: runtimeExecutionServiceVersion, RequestID: request.RequestID, MatchID: request.Match.MatchID,
		CompatibilityTupleID: request.EvidenceSnapshot.Compatibility.TupleID,
		RulesVersion:         request.EvidenceSnapshot.Compatibility.Tuple.Rules, EngineVersion: request.EvidenceSnapshot.Compatibility.Tuple.Engine,
		RuntimeABIVersion: request.EvidenceSnapshot.Compatibility.Tuple.RuntimeABI, ChronicleVersion: request.EvidenceSnapshot.Compatibility.Tuple.Chronicle,
		ArenaCatalogVersion: request.EvidenceSnapshot.Compatibility.Tuple.ArenaCatalog, SetPolicyVersion: request.EvidenceSnapshot.Compatibility.Tuple.SetPolicy,
		AuthorityBundleHash: request.EvidenceSnapshot.AuthorityBundleHash, RegistryGeneration: request.EvidenceSnapshot.RegistryGeneration,
		ChronicleWireBytesHash: chronicleHash, FinalStateWireBytesHash: finalStateHash,
		ReconstructedTerminalStateHash: "sha256:" + strings.Repeat("7", 64), OutcomeWireBytesHash: outcomeHash,
		RuntimeViolationEventCount: runtimeSemanticViolationCount(chronicle), Algorithm: runtimeSemanticReceiptAlgorithm, KeyID: runtimeSemanticReceiptKeyID,
	}
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(runtimeSemanticReceiptMessage(receipt))
	receipt.Signature = "hmac-sha256:" + hex.EncodeToString(mac.Sum(nil))
	return &runtimeServiceSuccessResult{
		Privacy: "internal_runtime_result", Chronicle: chronicle, FinalState: finalState,
		RuntimeViolationEventCount: receipt.RuntimeViolationEventCount, SemanticReceipt: receipt,
		SemanticWireEvidence: runtimeSemanticWireEvidence{
			ChronicleJSON: chronicleJSON, FinalStateJSON: finalStateJSON, OutcomeJSON: outcomeJSON,
			ChronicleWireBytesHash: chronicleHash, FinalStateWireBytesHash: finalStateHash, OutcomeWireBytesHash: outcomeHash,
		},
	}
}

func writeRuntimeServiceTestJSON(t *testing.T, writer http.ResponseWriter, value any) {
	t.Helper()
	writer.Header().Set("content-type", "application/json")
	if err := json.NewEncoder(writer).Encode(value); err != nil {
		t.Fatal(err)
	}
}

func assertRuntimeServiceFailureSafe(t *testing.T, failure *runtimeServiceFailure) {
	t.Helper()
	text := runtimeServiceFailureJSONSafe(failure)
	lower := strings.ToLower(text)
	for _, forbidden := range []string{"export default", "stderr", "hostpath", "/users/secret", "strategy source", "strategymemory", "soldiermemory", "objectivepayload", "ownerdebug", "owner debug", "session", "token", "mysql://", "postgres://", "private runtime internals"} {
		if strings.Contains(lower, forbidden) {
			t.Fatalf("runtime service failure leaked %q in %s", forbidden, text)
		}
	}
}
