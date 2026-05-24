package main

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"
)

func TestRuntimeServiceClientSuccess(t *testing.T) {
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
			Result: map[string]any{
				"chronicle":  map[string]any{"id": "chronicle:test"},
				"finalState": map[string]any{"matchId": request.Match.MatchID},
			},
		})
	}))
	defer server.Close()
	client := newRuntimeServiceClient(server.URL)

	response, failure := client.executeMatch(context.Background(), request)
	if failure != nil {
		t.Fatalf("unexpected failure: %s", runtimeServiceFailureJSONSafe(failure))
	}
	if response == nil || !response.OK || response.Kind != "executionResult" {
		t.Fatalf("expected success response, got %+v", response)
	}
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
			Result: map[string]any{
				"chronicle":  map[string]any{"id": "chronicle:test"},
				"finalState": map[string]any{"matchId": request.Match.MatchID},
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
				Code:         "SubprocessSystemFailure-ownerDebug-sessionId",
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
	if failure == nil || failure.ErrorClass != "RuntimeServiceSystemFailure" || !failure.Retryable {
		t.Fatalf("expected service failure, got %+v", failure)
	}
	assertRuntimeServiceFailureSafe(t, failure)
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
	bytes, err := os.ReadFile("../../packages/spec/artifacts/runtime-execution-service-request.v1.15.json")
	if err != nil {
		panic(err)
	}
	var request runtimeServiceRequest
	if err := json.Unmarshal(bytes, &request); err != nil {
		panic(err)
	}
	return request
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
