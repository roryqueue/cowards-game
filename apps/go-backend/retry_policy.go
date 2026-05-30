package main

const (
	matchFailureCategorySystemFailure          = "system_failure"
	matchFailureCategoryTimeout                = "timeout"
	matchFailureCategoryRuntimeUnavailable     = "runtime_unavailable"
	matchFailureCategoryMalformedRuntimeResult = "malformed_runtime_result"
	matchFailureCategoryStaleArtifact          = "stale_artifact"
)

type matchFailureClassification struct {
	Category         string
	PublicReason     string
	AppState         string
	RetryDisposition string
	ReplayState      string
	PublicMessageKey string
}

func classifyMatchFailure(errorClass string, retryable bool, details map[string]any) matchFailureClassification {
	category := matchFailureCategorySystemFailure
	switch errorClass {
	case "RuntimeServiceTimeout":
		category = matchFailureCategoryTimeout
	case "RuntimeServiceStopped", "RuntimeServiceTransport", "RuntimeServiceRead", "RuntimeServiceOversizedResponse":
		category = matchFailureCategoryRuntimeUnavailable
	case "RuntimeServiceSourceMismatch", "SOURCE_HASH_MISMATCH", "SOURCE_BYTES_MISMATCH":
		category = matchFailureCategoryStaleArtifact
	case "RuntimeServiceMalformedStrategyOutput":
		category = matchFailureCategoryMalformedRuntimeResult
	case "RuntimeServiceMalformedResponse", "RuntimeServiceContractMismatch", "MALFORMED_REQUEST", "UNSUPPORTED_RUNTIME_ADAPTER", "EXECUTION_EXCEPTION", "RESPONSE_SCHEMA_INVALID":
		category = matchFailureCategorySystemFailure
	}
	if reason := stringValue(details, "reason"); reason == "compiled-artifact-missing" || reason == "compiled-artifact-metadata-invalid" || reason == "compiled-artifact-mismatch" || reason == "compiled-artifact-source-hash-mismatch" {
		category = matchFailureCategoryStaleArtifact
	}

	classification := matchFailureClassification{
		Category:         category,
		PublicReason:     publicReasonForMatchFailureCategory(category),
		AppState:         "failed",
		RetryDisposition: "non_retryable",
		ReplayState:      "none",
		PublicMessageKey: "match_execution." + category,
	}
	if retryable {
		classification.RetryDisposition = "retryable"
	}
	if category == matchFailureCategoryRuntimeUnavailable {
		classification.AppState = "unavailable"
	}
	if category == matchFailureCategoryStaleArtifact {
		classification.ReplayState = "stale"
	}
	return classification
}

func publicReasonForMatchFailureCategory(category string) string {
	switch category {
	case matchFailureCategoryMalformedRuntimeResult:
		return "invalid_result"
	case matchFailureCategoryStaleArtifact:
		return "no_result"
	default:
		return "system_failure"
	}
}

func matchExecutionMetadataForFailureCategory(category string, retryable bool) map[string]any {
	if category == "" {
		return nil
	}
	classification := classifyMatchFailure(category, retryable, nil)
	classification.Category = category
	classification.PublicReason = publicReasonForMatchFailureCategory(category)
	classification.PublicMessageKey = "match_execution." + category
	if category == matchFailureCategoryRuntimeUnavailable {
		classification.AppState = "unavailable"
	}
	if category == matchFailureCategoryStaleArtifact {
		classification.ReplayState = "stale"
	}
	return map[string]any{
		"state":              classification.AppState,
		"failureCategory":    classification.Category,
		"retryDisposition":   classification.RetryDisposition,
		"replayAvailability": classification.ReplayState,
		"publicMessageKey":   classification.PublicMessageKey,
	}
}
