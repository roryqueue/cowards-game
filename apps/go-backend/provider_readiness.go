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
	SourceFormat string
	Runtime      map[string]any
	Validation   map[string]any
	Metadata     map[string]any
	SourceHash   string
	SourceBytes  int
	Failure      *runtimeServiceFailure
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
	if len(stringSliceFromAny(runtime["requiredCapabilities"])) != 0 {
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

func isProviderSourceFormat(value string) bool {
	return value == "typescript" || value == "python" || value == "rust" || value == "zig"
}

func providerProofPresent(metadata map[string]any, languageID string) bool {
	if _, ok := metadata["providerValidation"].(map[string]any); !ok {
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
