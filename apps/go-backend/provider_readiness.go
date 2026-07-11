package main

type revisionReadinessState string

const (
	revisionReadinessExecutionReady    revisionReadinessState = "execution_ready"
	revisionReadinessNonExecutionDraft revisionReadinessState = "non_execution_draft"
	revisionReadinessInvalid           revisionReadinessState = "invalid"
	revisionReadinessUnavailable       revisionReadinessState = "runtime_service_unavailable"
)

type revisionReadinessResult struct {
	State           revisionReadinessState
	PublicCategory  string
	EntryEligible   bool
	CountedEligible bool
}

type revisionReadinessInput struct {
	SourceFormat        string
	Runtime             map[string]any
	Validation          map[string]any
	Metadata            map[string]any
	EngineCompatibility map[string]any
	SourceHash          string
	SourceBytes         int
	Failure             *runtimeServiceFailure
}

func classifyRevisionReadiness(input revisionReadinessInput) revisionReadinessResult {
	if input.Failure != nil {
		return revisionReadinessResult{
			State:          revisionReadinessUnavailable,
			PublicCategory: "runtime_service_unavailable",
		}
	}
	runtime := input.Runtime
	languageID := stringValue(mapValue(runtime, "language"), "id")
	if input.SourceFormat == "tinygo" || languageID == "tinygo" {
		return revisionReadinessResult{
			State:          revisionReadinessInvalid,
			PublicCategory: "hidden_unsupported_provider",
		}
	}
	if !isProviderSourceFormat(input.SourceFormat) || !isProviderSourceFormat(languageID) {
		return revisionReadinessResult{
			State:          revisionReadinessInvalid,
			PublicCategory: "unsupported_source_format",
		}
	}
	if input.SourceFormat != "" && languageID != "" && input.SourceFormat != languageID {
		return revisionReadinessResult{
			State:          revisionReadinessInvalid,
			PublicCategory: "incompatible_runtime_metadata",
		}
	}
	if validationStatus(input.Validation) != "valid" {
		return revisionReadinessResult{
			State:          revisionReadinessNonExecutionDraft,
			PublicCategory: "invalid_strategy_revision",
		}
	}
	if stringValue(runtime, "abiVersion") != strategyRuntimeABIVersion {
		return revisionReadinessResult{
			State:          revisionReadinessInvalid,
			PublicCategory: "incompatible_runtime_metadata",
		}
	}
	if stringValue(mapValue(runtime, "package"), "mode") != "none" {
		return revisionReadinessResult{
			State:          revisionReadinessInvalid,
			PublicCategory: "package_policy_violation",
		}
	}
	if hasRequiredCapabilities(runtime["requiredCapabilities"]) {
		return revisionReadinessResult{
			State:          revisionReadinessInvalid,
			PublicCategory: "capability_policy_violation",
		}
	}
	if !runtimeMetadataMatchesCountedLane(runtime, languageID) ||
		!engineCompatibilityMatches(input.EngineCompatibility) {
		return revisionReadinessResult{
			State:          revisionReadinessInvalid,
			PublicCategory: "incompatible_runtime_metadata",
		}
	}
	if !providerProofPresent(input.Metadata, languageID) {
		return revisionReadinessResult{
			State:          revisionReadinessInvalid,
			PublicCategory: "provider_proof_missing",
		}
	}
	if providerProofIsStale(input.Metadata, input.SourceHash, input.SourceBytes, languageID) {
		return revisionReadinessResult{
			State:          revisionReadinessInvalid,
			PublicCategory: "provider_proof_stale",
		}
	}
	if !providerProofMatches(input.Metadata, input.SourceHash, input.SourceBytes, languageID) {
		return revisionReadinessResult{
			State:          revisionReadinessInvalid,
			PublicCategory: "provider_proof_mismatched",
		}
	}
	return revisionReadinessResult{
		State:           revisionReadinessExecutionReady,
		PublicCategory:  "provider_validated",
		EntryEligible:   true,
		CountedEligible: true,
	}
}

func hasRequiredCapabilities(value any) bool {
	switch capabilities := value.(type) {
	case []string:
		return len(capabilities) > 0
	case []any:
		return len(capabilities) > 0
	default:
		return false
	}
}

func runtimeMetadataMatchesCountedLane(runtime map[string]any, languageID string) bool {
	adapterID := stringValue(mapValue(runtime, "adapter"), "id")
	switch languageID {
	case "typescript":
		return adapterID == "runtime-js-worker-thread" || adapterID == "runtime-js-subprocess"
	case "python":
		return adapterID == "runtime-python-subprocess-experimental"
	case "rust", "zig":
		return adapterID == "runtime-wasm-wasi-wasmtime-preview1"
	default:
		return false
	}
}

func engineCompatibilityMatches(value map[string]any) bool {
	if value == nil {
		return true
	}
	expected := engineCompatibility()
	return stringValue(value, "spec") == stringValue(expected, "spec") &&
		stringValue(value, "engine") == stringValue(expected, "engine")
}

func isProviderSourceFormat(value string) bool {
	return value == "typescript" || value == "python" || value == "rust" || value == "zig"
}

func providerProofPresent(metadata map[string]any, languageID string) bool {
	validation, ok := metadata["providerValidation"].(map[string]any)
	if !ok || stringValue(validation, "proof") == "" {
		return false
	}
	if languageID == "typescript" || languageID == "python" {
		_, ok := metadata["sourceArtifact"].(map[string]any)
		return ok
	}
	if languageID == "rust" || languageID == "zig" {
		_, ok := metadata["compiledArtifact"].(map[string]any)
		return ok
	}
	return false
}

func providerProofIsStale(metadata map[string]any, sourceHash string, sourceBytes int, languageID string) bool {
	validation := mapValue(metadata, "providerValidation")
	artifactKey := "compiledArtifact"
	if languageID == "typescript" || languageID == "python" {
		artifactKey = "sourceArtifact"
	}
	artifact := mapValue(metadata, artifactKey)
	if sourceHash == "" || sourceBytes <= 0 {
		return true
	}
	if stringValue(validation, "sourceHash") != sourceHash || intValue(validation, "sourceBytes") != sourceBytes {
		return true
	}
	if stringValue(artifact, "sourceHash") != sourceHash {
		return true
	}
	if languageID == "typescript" || languageID == "python" {
		return intValue(artifact, "sourceBytes") != sourceBytes
	}
	return false
}

func providerProofMatches(metadata map[string]any, sourceHash string, sourceBytes int, languageID string) bool {
	switch languageID {
	case "typescript":
		return sourceArtifactProviderValidationMatches(metadata, sourceHash, sourceBytes, "strategy-language-provider-js-ts", "typescript")
	case "python":
		return pythonProviderValidationMatches(metadata, sourceHash, sourceBytes)
	case "rust", "zig":
		return rustProviderValidationMatches(metadata, sourceHash, sourceBytes, languageID)
	default:
		return false
	}
}
