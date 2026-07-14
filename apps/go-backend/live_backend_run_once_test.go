package main

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"reflect"
	"strings"
	"testing"
)

func TestRunMatchJobOnceForwardsOptionalMatchAllowlist(t *testing.T) {
	t.Setenv("COWARDS_GO_BACKEND_INTERNAL_TOKEN", "operator-token")
	tests := []struct {
		name     string
		body     string
		expected []string
	}{
		{
			name:     "exact allowlist",
			body:     `{"matchIds":["match:phase258:a","match:phase258:b"]}`,
			expected: []string{"match:phase258:a", "match:phase258:b"},
		},
		{
			name:     "legacy empty body",
			body:     "",
			expected: nil,
		},
		{
			name:     "legacy whitespace body",
			body:     " \n\t ",
			expected: nil,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			calls := 0
			var forwarded []string
			server := &LiveServer{
				runOrchestrationOnce: func(_ context.Context, matchIDs []string) (*goMatchOrchestrationResult, error) {
					calls++
					forwarded = matchIDs
					return &goMatchOrchestrationResult{Status: "idle"}, nil
				},
			}
			request := httptest.NewRequest(http.MethodPost, "/internal/match-jobs/run-once", strings.NewReader(test.body))
			request.Header.Set("X-Cowards-Internal-Token", "operator-token")
			response := httptest.NewRecorder()

			server.routes().ServeHTTP(response, request)

			if response.Code != http.StatusOK || calls != 1 {
				t.Fatalf("run-once forwarding failed: status=%d calls=%d body=%s", response.Code, calls, response.Body.String())
			}
			if !reflect.DeepEqual(forwarded, test.expected) {
				t.Fatalf("forwarded match allowlist mismatch: got=%#v expected=%#v", forwarded, test.expected)
			}
		})
	}
}

func TestRunMatchJobOnceRejectsInvalidBodyBeforeOrchestration(t *testing.T) {
	t.Setenv("COWARDS_GO_BACKEND_INTERNAL_TOKEN", "operator-token")
	tooMany, err := json.Marshal(map[string]any{"matchIds": func() []string {
		ids := make([]string, 101)
		for index := range ids {
			ids[index] = "match:phase258:limit:" + strings.Repeat("x", index%3+1) + string(rune('a'+index%26))
		}
		return ids
	}()})
	if err != nil {
		t.Fatal(err)
	}
	tests := []struct {
		name string
		body string
	}{
		{name: "missing matchIds", body: `{}`},
		{name: "unknown field", body: `{"matchIds":["match:a"],"privateDiagnostics":"must-not-leak"}`},
		{name: "duplicate field", body: `{"matchIds":["match:a"],"matchIds":["match:b"]}`},
		{name: "duplicate match id", body: `{"matchIds":["match:a","match:a"]}`},
		{name: "empty list", body: `{"matchIds":[]}`},
		{name: "null list", body: `{"matchIds":null}`},
		{name: "non-string id", body: `{"matchIds":[1]}`},
		{name: "empty id", body: `{"matchIds":[""]}`},
		{name: "whitespace id", body: `{"matchIds":["  "]}`},
		{name: "over list limit", body: string(tooMany)},
		{name: "trailing value", body: `{"matchIds":["match:a"]}{"private":"tail"}`},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			calls := 0
			server := &LiveServer{
				runOrchestrationOnce: func(_ context.Context, _ []string) (*goMatchOrchestrationResult, error) {
					calls++
					return &goMatchOrchestrationResult{Status: "idle"}, nil
				},
			}
			request := httptest.NewRequest(http.MethodPost, "/internal/match-jobs/run-once", strings.NewReader(test.body))
			request.Header.Set("X-Cowards-Internal-Token", "operator-token")
			response := httptest.NewRecorder()

			server.routes().ServeHTTP(response, request)

			if response.Code != http.StatusBadRequest || calls != 0 {
				t.Fatalf("invalid run-once body reached orchestration: status=%d calls=%d body=%s", response.Code, calls, response.Body.String())
			}
			var serviceError serviceErrorFixture
			if err := json.Unmarshal(response.Body.Bytes(), &serviceError); err != nil {
				t.Fatal(err)
			}
			if serviceError.Code != "VALIDATION_FAILED" || serviceError.Message != "Request body is invalid." || !serviceError.PublicSafe {
				t.Fatalf("invalid body returned unsafe error: %+v", serviceError)
			}
			for _, forbidden := range []string{"privateDiagnostics", "must-not-leak", "match:a", "duplicate JSON key"} {
				if strings.Contains(response.Body.String(), forbidden) {
					t.Fatalf("validation error leaked %q: %s", forbidden, response.Body.String())
				}
			}
		})
	}
}

func TestRunMatchJobOnceAuthenticatesBeforeBodyAdmission(t *testing.T) {
	t.Setenv("COWARDS_GO_BACKEND_INTERNAL_TOKEN", "operator-token")
	calls := 0
	server := &LiveServer{
		runOrchestrationOnce: func(_ context.Context, _ []string) (*goMatchOrchestrationResult, error) {
			calls++
			return &goMatchOrchestrationResult{Status: "idle"}, nil
		},
	}
	request := httptest.NewRequest(http.MethodPost, "/internal/match-jobs/run-once", strings.NewReader(`{"matchIds":"private malformed body"}`))
	response := httptest.NewRecorder()

	server.routes().ServeHTTP(response, request)

	if response.Code != http.StatusForbidden || calls != 0 {
		t.Fatalf("run-once auth ordering drifted: status=%d calls=%d body=%s", response.Code, calls, response.Body.String())
	}
	if strings.Contains(response.Body.String(), "private malformed body") {
		t.Fatalf("forbidden response leaked request body: %s", response.Body.String())
	}
}
