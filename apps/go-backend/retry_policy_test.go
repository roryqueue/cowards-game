package main

import "testing"

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
