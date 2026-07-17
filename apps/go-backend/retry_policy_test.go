package main

import (
	"strings"
	"testing"
)

func TestClassifyMatchFailure(t *testing.T) {
	tests := []struct {
		name         string
		errorClass   string
		retryable    bool
		details      map[string]any
		wantCategory string
		wantReason   string
		wantRetry    string
		wantReplay   string
		wantState    string
	}{
		{
			name:         "stopped runtime is retryable unavailable",
			errorClass:   "RuntimeServiceStopped",
			retryable:    true,
			wantCategory: matchFailureCategoryRuntimeUnavailable,
			wantReason:   "system_failure",
			wantRetry:    "retryable",
			wantReplay:   "none",
			wantState:    "unavailable",
		},
		{
			name:         "runtime timeout stays retryable timeout",
			errorClass:   "RuntimeServiceTimeout",
			retryable:    true,
			wantCategory: matchFailureCategoryTimeout,
			wantReason:   "system_failure",
			wantRetry:    "retryable",
			wantReplay:   "none",
			wantState:    "failed",
		},
		{
			name:         "malformed strategy output is non retryable invalid result",
			errorClass:   "RuntimeServiceMalformedStrategyOutput",
			retryable:    false,
			wantCategory: matchFailureCategoryMalformedRuntimeResult,
			wantReason:   "invalid_result",
			wantRetry:    "non_retryable",
			wantReplay:   "none",
			wantState:    "failed",
		},
		{
			name:         "artifact mismatch is stale artifact",
			errorClass:   "SOURCE_HASH_MISMATCH",
			retryable:    false,
			details:      map[string]any{"reason": "compiled-artifact-source-hash-mismatch"},
			wantCategory: matchFailureCategoryStaleArtifact,
			wantReason:   "no_result",
			wantRetry:    "non_retryable",
			wantReplay:   "stale",
			wantState:    "failed",
		},
		{
			name:         "malformed service envelope remains retryable system failure",
			errorClass:   "RuntimeServiceMalformedResponse",
			retryable:    true,
			wantCategory: matchFailureCategorySystemFailure,
			wantReason:   "system_failure",
			wantRetry:    "retryable",
			wantReplay:   "none",
			wantState:    "failed",
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			got := classifyMatchFailure(test.errorClass, test.retryable, test.details)
			if got.Category != test.wantCategory || got.PublicReason != test.wantReason || got.RetryDisposition != test.wantRetry || got.ReplayState != test.wantReplay || got.AppState != test.wantState {
				t.Fatalf("unexpected classification: %+v", got)
			}
		})
	}
}

func TestMatchExecutionMetadataForFailureCategory(t *testing.T) {
	metadata := matchExecutionMetadataForFailureCategory(matchFailureCategoryStaleArtifact, false)
	if metadata["failureCategory"] != matchFailureCategoryStaleArtifact || metadata["retryDisposition"] != "non_retryable" || metadata["replayAvailability"] != "stale" {
		t.Fatalf("unexpected stale artifact metadata: %+v", metadata)
	}

	metadata = matchExecutionMetadataForFailureCategory(matchFailureCategoryRuntimeUnavailable, true)
	if metadata["state"] != "unavailable" || metadata["retryDisposition"] != "retryable" {
		t.Fatalf("unexpected unavailable metadata: %+v", metadata)
	}
}

func TestCandidateConditionRetryPolicyV119(t *testing.T) {
	identity := candidateConditionIdentityV119ForTest()
	decision, err := evaluateSuccessorSystemFailureRetryV119(identity, identity, true, 1, 3, false)
	if err != nil || decision.Disposition != "retry" || decision.NextAttemptNumber != 2 || decision.Identity != identity {
		t.Fatalf("exact retry was rejected: decision=%+v err=%v", decision, err)
	}
	decision, err = evaluateSuccessorSystemFailureRetryV119(identity, identity, true, 3, 3, false)
	if err != nil || decision.Disposition != "degraded" || decision.NextAttemptNumber != 0 {
		t.Fatalf("bounded exhaustion was not degraded: decision=%+v err=%v", decision, err)
	}
	decision, err = evaluateSuccessorSystemFailureRetryV119(identity, identity, false, 1, 3, false)
	if err != nil || decision.Disposition != "degraded" {
		t.Fatalf("non-retryable system failure was not degraded: decision=%+v err=%v", decision, err)
	}

	changed := identity
	changed.SignedRequestSHA256 = "sha256:" + strings.Repeat("f", 64)
	if _, err := evaluateSuccessorSystemFailureRetryV119(identity, changed, true, 1, 3, false); err == nil {
		t.Fatal("changed request bytes received retry authority")
	}
	if _, err := evaluateSuccessorSystemFailureRetryV119(identity, identity, true, 1, 3, true); err == nil {
		t.Fatal("player violation received system retry authority")
	}
	for _, attempts := range [][2]int{{0, 3}, {1, 0}, {4, 3}} {
		if _, err := evaluateSuccessorSystemFailureRetryV119(identity, identity, true, attempts[0], attempts[1], false); err == nil {
			t.Fatalf("invalid attempt bounds %v were accepted", attempts)
		}
	}
}
