package main

import "strings"

type revisionReadinessState string

const (
	revisionReadinessExecutionReady    revisionReadinessState = "execution_ready"
	revisionReadinessExhibitionReady   revisionReadinessState = "exhibition_ready"
	revisionReadinessExecutionDisabled revisionReadinessState = "execution_disabled"
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
	ExecutionEvidence   *executableLaneEvidenceInput
}

func classifyRevisionReadiness(input revisionReadinessInput) revisionReadinessResult {
	return classifyRevisionReadinessForSelectedABI(input, selectedStrategyRuntimeABIVersion())
}

func classifyRevisionReadinessForSelectedABI(input revisionReadinessInput, selectedRuntimeABI string) revisionReadinessResult {
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
	runtimeABI := stringValue(runtime, "abiVersion")
	if runtimeABI != selectedRuntimeABI {
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
	if !engineCompatibilityMatches(input.EngineCompatibility) {
		return revisionReadinessResult{
			State:          revisionReadinessInvalid,
			PublicCategory: "incompatible_runtime_metadata",
		}
	}
	if input.ExecutionEvidence == nil {
		return revisionReadinessResult{
			State:          revisionReadinessExecutionDisabled,
			PublicCategory: "containment_missing",
		}
	}
	if !providerProofMatches(input.Metadata, input.SourceHash, input.SourceBytes, languageID, runtimeABI) {
		return revisionReadinessResult{
			State:          revisionReadinessInvalid,
			PublicCategory: "incompatible_runtime_metadata",
		}
	}
	evidence := classifyExecutableLaneEvidence(*input.ExecutionEvidence)
	switch evidence.Status {
	case executableLaneEvidenceCounted:
		return revisionReadinessResult{
			State:           revisionReadinessExecutionReady,
			PublicCategory:  "evidence_current",
			EntryEligible:   true,
			CountedEligible: true,
		}
	case executableLaneEvidenceExhibitionOnly:
		return revisionReadinessResult{
			State:          revisionReadinessExhibitionReady,
			PublicCategory: strings.ToLower(evidence.ReasonCode),
			EntryEligible:  true,
		}
	default:
		return revisionReadinessResult{
			State:          revisionReadinessExecutionDisabled,
			PublicCategory: strings.ToLower(evidence.ReasonCode),
		}
	}
}

func publicCountedEntryEligibilityCategory(readiness revisionReadinessResult, locked bool) string {
	switch readiness.State {
	case revisionReadinessExecutionReady:
		if locked {
			return "provider_validated"
		}
		return "mutable_draft"
	case revisionReadinessExhibitionReady:
		return "runtime_lane_exhibition_only"
	case revisionReadinessExecutionDisabled:
		return "runtime_lane_disabled"
	case revisionReadinessNonExecutionDraft:
		return "invalid_strategy_revision"
	case revisionReadinessUnavailable:
		return "runtime_service_unavailable"
	case revisionReadinessInvalid:
		return readiness.PublicCategory
	default:
		return "runtime_lane_disabled"
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

func engineCompatibilityMatches(value map[string]any) bool {
	if value == nil {
		return false
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

func providerProofMatches(metadata map[string]any, sourceHash string, sourceBytes int, languageID string, runtimeABI string) bool {
	switch languageID {
	case "typescript":
		return sourceArtifactProviderValidationMatchesABI(metadata, sourceHash, sourceBytes, "strategy-language-provider-js-ts", "typescript", runtimeABI)
	case "python":
		return pythonProviderValidationMatchesABI(metadata, sourceHash, sourceBytes, runtimeABI)
	case "rust", "zig":
		return rustProviderValidationMatchesABI(metadata, sourceHash, sourceBytes, languageID, runtimeABI)
	default:
		return false
	}
}
