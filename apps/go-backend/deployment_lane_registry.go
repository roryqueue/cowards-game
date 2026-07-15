package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"os"
	"strings"
)

const deploymentLaneRegistrySchemaVersion = "runtime-deployment-lane-registry-v1.37"

var runtimeSuccessorCanonicalTupleV117 = func() canonicalCompatibilityTuple {
	var tuple canonicalCompatibilityTuple
	_ = json.Unmarshal([]byte(runtimeSuccessorSemanticTupleV117), &tuple)
	return tuple
}()

type goDeploymentLaneProfile struct {
	ProviderID                       string                                `json:"providerId"`
	LanguageID                       string                                `json:"languageId"`
	LanguageVersion                  string                                `json:"languageVersion"`
	RuntimeID                        string                                `json:"runtimeId"`
	RuntimeVersion                   string                                `json:"runtimeVersion"`
	ToolchainID                      string                                `json:"toolchainId"`
	ToolchainVersion                 string                                `json:"toolchainVersion"`
	AdapterID                        string                                `json:"adapterId"`
	AdapterVersion                   string                                `json:"adapterVersion"`
	PolicyID                         string                                `json:"policyId"`
	PolicyVersion                    string                                `json:"policyVersion"`
	CorpusID                         string                                `json:"corpusId"`
	CorpusVersion                    string                                `json:"corpusVersion"`
	ArtifactKind                     string                                `json:"artifactKind"`
	ArtifactIDPrefix                 string                                `json:"artifactIdPrefix"`
	ImplementationID                 string                                `json:"implementationId"`
	BuildID                          string                                `json:"buildId"`
	SemanticTupleID                  string                                `json:"semanticTupleId"`
	SemanticTuple                    canonicalCompatibilityTuple           `json:"semanticTuple"`
	SuccessorRuntimeIdentityTemplate *runtimeSuccessorIdentityTemplateV117 `json:"successorRuntimeIdentityTemplate,omitempty"`
}

type goDeploymentLaneRegistry struct {
	SchemaVersion string                    `json:"schemaVersion"`
	RegistryID    string                    `json:"registryId"`
	Lanes         []goDeploymentLaneProfile `json:"lanes"`
}

func loadDeploymentLaneRegistry(path string) (*goDeploymentLaneRegistry, error) {
	if strings.TrimSpace(path) == "" {
		return nil, errors.New("deployment lane registry path is required")
	}
	bytes, err := os.ReadFile(path)
	if err != nil {
		return nil, errors.New("deployment lane registry could not be loaded")
	}
	var registry goDeploymentLaneRegistry
	if err := decodeStrictJSON(bytes, &registry); err != nil || registry.SchemaVersion != deploymentLaneRegistrySchemaVersion || strings.TrimSpace(registry.RegistryID) == "" || len(registry.Lanes) == 0 {
		return nil, errors.New("deployment lane registry is invalid")
	}
	keys := map[string]bool{}
	for _, lane := range registry.Lanes {
		values := []string{lane.ProviderID, lane.LanguageID, lane.LanguageVersion, lane.RuntimeID, lane.RuntimeVersion, lane.ToolchainID, lane.ToolchainVersion, lane.AdapterID, lane.AdapterVersion, lane.PolicyID, lane.PolicyVersion, lane.CorpusID, lane.CorpusVersion, lane.ArtifactIDPrefix, lane.ImplementationID, lane.BuildID, lane.SemanticTupleID, lane.SemanticTuple.Rules, lane.SemanticTuple.Engine, lane.SemanticTuple.RuntimeABI, lane.SemanticTuple.Chronicle, lane.SemanticTuple.ArenaCatalog, lane.SemanticTuple.SetPolicy}
		for _, value := range values {
			if strings.TrimSpace(value) == "" {
				return nil, errors.New("deployment lane registry profile is incomplete")
			}
		}
		if lane.ArtifactKind != "source" && lane.ArtifactKind != "compiled" {
			return nil, errors.New("deployment lane registry artifact kind is invalid")
		}
		if !validDeploymentLaneSemanticTuple(lane.SemanticTupleID, lane.SemanticTuple) {
			return nil, errors.New("deployment lane registry semantic tuple identity is invalid")
		}
		if lane.SemanticTupleID == runtimeSuccessorSemanticTupleIDV117 {
			if lane.SuccessorRuntimeIdentityTemplate == nil || !normalizeRuntimeSuccessorIdentityTemplateV117(lane.SuccessorRuntimeIdentityTemplate) ||
				!successorIdentityTemplateMatchesLaneProfileV117(lane.SuccessorRuntimeIdentityTemplate, lane) {
				return nil, errors.New("deployment lane registry successor identity template is invalid")
			}
		} else if lane.SuccessorRuntimeIdentityTemplate != nil {
			return nil, errors.New("deployment lane registry successor identity template is mixed-version")
		}
		key := strings.Join([]string{lane.LanguageID, lane.LanguageVersion, lane.AdapterID, lane.AdapterVersion}, "\x00")
		if keys[key] {
			return nil, errors.New("deployment lane registry profile is ambiguous")
		}
		keys[key] = true
	}
	return &registry, nil
}

func (registry *goDeploymentLaneRegistry) successorIdentityTemplateForRevision(strategy runtimeServiceStrategyRevision) (*runtimeSuccessorIdentityTemplateV117, bool) {
	if registry == nil {
		return nil, false
	}
	language := mapValue(strategy.Runtime, "language")
	adapter := mapValue(strategy.Runtime, "adapter")
	languageID, languageVersion := stringValue(language, "id"), stringValue(language, "version")
	adapterID, adapterVersion := stringValue(adapter, "id"), stringValue(adapter, "version")
	var resolved *runtimeSuccessorIdentityTemplateV117
	for index := range registry.Lanes {
		profile := &registry.Lanes[index]
		if profile.LanguageID == languageID && profile.LanguageVersion == languageVersion && profile.AdapterID == adapterID && profile.AdapterVersion == adapterVersion {
			if resolved != nil || profile.SuccessorRuntimeIdentityTemplate == nil ||
				!successorIdentityTemplateMatchesLaneProfileV117(profile.SuccessorRuntimeIdentityTemplate, *profile) {
				return nil, false
			}
			resolved = profile.SuccessorRuntimeIdentityTemplate
		}
	}
	if resolved == nil {
		return nil, false
	}
	return cloneRuntimeSuccessorIdentityTemplateV117(resolved), true
}

func loadProductionDeploymentLaneRegistryFromEnvironment() (*goDeploymentLaneRegistry, error) {
	return loadDeploymentLaneRegistry(strings.TrimSpace(os.Getenv("COWARDS_RUNTIME_DEPLOYMENT_LANE_REGISTRY")))
}

func (registry *goDeploymentLaneRegistry) matchesAuthority(authority *verifiedRuntimeEvidenceAuthority) bool {
	if registry == nil || authority == nil || len(registry.Lanes) == 0 {
		return false
	}
	for _, profile := range registry.Lanes {
		if !validDeploymentLaneSemanticTuple(profile.SemanticTupleID, profile.SemanticTuple) ||
			!validDeploymentLaneSemanticTuple(authority.CompatibilityTuple.TupleID, authority.CompatibilityTuple.Tuple) ||
			profile.SemanticTupleID != authority.CompatibilityTuple.TupleID || profile.SemanticTuple != authority.CompatibilityTuple.Tuple {
			return false
		}
	}
	return true
}

func (registry *goDeploymentLaneRegistry) resolveRevision(id string, sourceHash string, sourceBytes int, runtime map[string]any, engine map[string]any, validation map[string]any, metadata map[string]any, tuple registeredCompatibilityTuple) (*goExecutableLaneIdentity, bool) {
	if registry == nil || id == "" || sourceHash == "" || sourceBytes <= 0 {
		return nil, false
	}
	language := mapValue(runtime, "language")
	adapter := mapValue(runtime, "adapter")
	languageID, languageVersion := stringValue(language, "id"), stringValue(language, "version")
	adapterID, adapterVersion := stringValue(adapter, "id"), stringValue(adapter, "version")
	var profile *goDeploymentLaneProfile
	for index := range registry.Lanes {
		candidate := &registry.Lanes[index]
		if candidate.LanguageID == languageID && candidate.LanguageVersion == languageVersion && candidate.AdapterID == adapterID && candidate.AdapterVersion == adapterVersion {
			if profile != nil {
				return nil, false
			}
			profile = candidate
		}
	}
	if profile == nil || !validDeploymentLaneSemanticTuple(profile.SemanticTupleID, profile.SemanticTuple) || !validDeploymentLaneSemanticTuple(tuple.TupleID, tuple.Tuple) || profile.SemanticTupleID != tuple.TupleID || profile.SemanticTuple != tuple.Tuple || stringValue(runtime, "abiVersion") != tuple.Tuple.RuntimeABI || stringValue(engine, "spec") != tuple.Tuple.Rules || stringValue(engine, "engine") != tuple.Tuple.Engine {
		return nil, false
	}
	if profile.SemanticTupleID == runtimeSuccessorSemanticTupleIDV117 {
		if !validSuccessorStrategyRevisionV117(sourceHash, sourceBytes, runtime, engine, validation, metadata) ||
			profile.SuccessorRuntimeIdentityTemplate == nil ||
			!successorIdentityTemplateMatchesLaneProfileV117(profile.SuccessorRuntimeIdentityTemplate, *profile) {
			return nil, false
		}
	}
	provider := mapValue(metadata, "providerValidation")
	if stringValue(provider, "providerId") != profile.ProviderID {
		return nil, false
	}
	artifact := mapValue(metadata, "sourceArtifact")
	providerValid := sourceArtifactProviderValidationMatchesABI(metadata, sourceHash, sourceBytes, profile.ProviderID, profile.LanguageID, tuple.Tuple.RuntimeABI)
	if profile.ArtifactKind == "compiled" {
		artifact = mapValue(metadata, "compiledArtifact")
		providerValid = rustProviderValidationMatches(metadata, sourceHash, sourceBytes, profile.LanguageID)
	}
	if !providerValid || !isLowerSHA256(stringValue(artifact, "hash")) {
		return nil, false
	}
	toolchain := mapValue(artifact, "toolchain")
	if profile.ArtifactKind == "source" {
		if profile.SemanticTupleID == runtimeSuccessorSemanticTupleIDV117 {
			if stringValue(toolchain, "language") != profile.LanguageID || stringValue(toolchain, "runtime") != profile.ToolchainID || stringValue(toolchain, "runtimeVersion") != profile.ToolchainVersion {
				return nil, false
			}
		} else if stringValue(toolchain, "language") != profile.ToolchainID || stringValue(toolchain, "runtime") != profile.RuntimeID || stringValue(toolchain, "runtimeVersion") != profile.ToolchainVersion || profile.RuntimeVersion != profile.ToolchainVersion {
			return nil, false
		}
	} else if stringValue(toolchain, "compiler") != profile.ToolchainID || stringValue(toolchain, "compilerVersion") != profile.ToolchainVersion {
		return nil, false
	}
	identity := &goExecutableLaneIdentity{
		ProviderID: profile.ProviderID, LanguageID: profile.LanguageID,
		RuntimeID: profile.RuntimeID, RuntimeVersion: profile.RuntimeVersion,
		ToolchainID: profile.ToolchainID, ToolchainVersion: profile.ToolchainVersion,
		AdapterID: profile.AdapterID, AdapterVersion: profile.AdapterVersion,
		PolicyID: profile.PolicyID, PolicyVersion: profile.PolicyVersion,
		CorpusID: profile.CorpusID, CorpusVersion: profile.CorpusVersion,
		ArtifactID: profile.ArtifactIDPrefix + id, ArtifactSHA256: stringValue(artifact, "hash"),
		ImplementationID: profile.ImplementationID, BuildID: profile.BuildID,
		SemanticTupleID: profile.SemanticTupleID, SemanticTuple: profile.SemanticTuple,
	}
	return identity, true
}

func successorIdentityTemplateMatchesLaneProfileV117(template *runtimeSuccessorIdentityTemplateV117, profile goDeploymentLaneProfile) bool {
	if !validNormalizedRuntimeSuccessorIdentityTemplateV117(template) || template.ExactPins[1][1] != profile.RuntimeVersion {
		return false
	}
	bindings := runtimeIdentityBindingMapV117(template.Bindings)
	laneProfileHash, ok := hashSuccessorRuntimeLaneProfileV117(profile)
	return ok && template.LaneProfileSHA256 == laneProfileHash &&
		bindings["containmentPolicy"].PublicID == profile.PolicyID &&
		bindings["conformanceCorpus"].PublicID == profile.CorpusID
}

func hashSuccessorRuntimeLaneProfileV117(profile goDeploymentLaneProfile) (string, bool) {
	values := map[string]any{
		"providerId": profile.ProviderID, "languageId": profile.LanguageID, "languageVersion": profile.LanguageVersion,
		"runtimeId": profile.RuntimeID, "runtimeVersion": profile.RuntimeVersion,
		"toolchainId": profile.ToolchainID, "toolchainVersion": profile.ToolchainVersion,
		"adapterId": profile.AdapterID, "adapterVersion": profile.AdapterVersion,
		"policyId": profile.PolicyID, "policyVersion": profile.PolicyVersion,
		"corpusId": profile.CorpusID, "corpusVersion": profile.CorpusVersion,
		"artifactKind": profile.ArtifactKind, "artifactIdPrefix": profile.ArtifactIDPrefix,
		"implementationId": profile.ImplementationID, "buildId": profile.BuildID,
		"semanticTupleId": profile.SemanticTupleID, "semanticTuple": profile.SemanticTuple,
	}
	if len(runtimeSuccessorLaneProfileFieldsV117) != len(values) {
		return "", false
	}
	exact := make(map[string]any, len(values))
	for _, field := range runtimeSuccessorLaneProfileFieldsV117 {
		value, exists := values[field]
		if !exists {
			return "", false
		}
		exact[field] = value
	}
	encoded, err := runtimeInvocationV117CanonicalValue(exact)
	if err != nil {
		return "", false
	}
	hash := sha256.New()
	_, _ = hash.Write([]byte(runtimeSuccessorLaneProfileDomainV117))
	_, _ = hash.Write([]byte{0})
	_, _ = hash.Write(encoded)
	return "sha256:" + hex.EncodeToString(hash.Sum(nil)), true
}

func validSuccessorStrategyRevisionV117(sourceHash string, sourceBytes int, runtime map[string]any, engine map[string]any, validation map[string]any, metadata map[string]any) bool {
	if sourceHash == "" || sourceBytes <= 0 ||
		!runtimeInvocationV117ExactKeys(runtime, "abiVersion", "language", "adapter", "package", "requiredCapabilities", "limits") ||
		stringValue(runtime, "abiVersion") != strategyRuntimeABIVersionV117 ||
		!runtimeInvocationV117ExactKeys(mapValue(runtime, "language"), "id", "version") ||
		!runtimeInvocationV117ExactKeys(mapValue(runtime, "adapter"), "id", "version") ||
		!runtimeInvocationV117ExactKeys(engine, "spec", "engine") {
		return false
	}
	pkg := mapValue(runtime, "package")
	if !runtimeInvocationV117ExactKeys(pkg, "entrypoint", "mode") || stringValue(pkg, "entrypoint") != "default" || stringValue(pkg, "mode") != "none" || !emptyRuntimeCapabilities(runtime["requiredCapabilities"]) {
		return false
	}
	limits := mapValue(runtime, "limits")
	if !validSuccessorRuntimeLimitsV117(limits) || !validSuccessorStrategyValidationV117(validation, sourceHash, sourceBytes, runtime, engine) {
		return false
	}
	providerValidation := mapValue(metadata, "providerValidation")
	artifact := mapValue(metadata, "sourceArtifact")
	return stringValue(providerValidation, "contractVersion") == "runtime-provider-validation-v1.17" &&
		stringValue(providerValidation, "sourceHash") == sourceHash && intValue(providerValidation, "sourceBytes") == sourceBytes &&
		stringValue(providerValidation, "artifactHash") == stringValue(artifact, "hash") &&
		intValue(providerValidation, "artifactBytes") == intValue(artifact, "bytes") &&
		stringValue(artifact, "abiVersion") == strategyRuntimeABIVersionV117 &&
		stringValue(engine, "spec") == runtimeSuccessorCanonicalTupleV117.Rules &&
		stringValue(engine, "engine") == runtimeSuccessorCanonicalTupleV117.Engine
}

func validSuccessorStrategyValidationV117(validation map[string]any, sourceHash string, sourceBytes int, runtime map[string]any, engine map[string]any) bool {
	if !runtimeInvocationV117ExactKeys(validation, "valid", "errors", "warnings", "sourceBytes", "forbiddenPatterns", "sourceHash", "runtimeVersion", "engineCompatibility") ||
		stringValue(validation, "sourceHash") != sourceHash || intValue(validation, "sourceBytes") != sourceBytes ||
		stringValue(validation, "runtimeVersion") != stringValue(mapValue(runtime, "adapter"), "version") {
		return false
	}
	validationEngine := mapValue(validation, "engineCompatibility")
	if !runtimeInvocationV117ExactKeys(validationEngine, "spec", "engine") ||
		stringValue(validationEngine, "spec") != stringValue(engine, "spec") ||
		stringValue(validationEngine, "engine") != stringValue(engine, "engine") {
		return false
	}
	errors, errorsOK := validation["errors"].([]any)
	warnings, warningsOK := validation["warnings"].([]any)
	patterns, patternsOK := validation["forbiddenPatterns"].([]any)
	valid, validOK := validation["valid"].(bool)
	if !validOK || !errorsOK || !warningsOK || !patternsOK {
		return false
	}
	for _, pattern := range patterns {
		if _, ok := pattern.(string); !ok {
			return false
		}
	}
	for _, validationError := range errors {
		if !validSuccessorValidationIssueV117(validationError, "error") {
			return false
		}
	}
	for _, warning := range warnings {
		if !validSuccessorValidationIssueV117(warning, "warning") {
			return false
		}
	}
	if valid != (len(errors) == 0) || !valid {
		return false
	}
	return true
}

func validSuccessorValidationIssueV117(value any, severity string) bool {
	issue, ok := value.(map[string]any)
	if !ok || (severity != "error" && severity != "warning") || len(issue) < 3 || len(issue) > 9 ||
		stringValue(issue, "severity") != severity ||
		!runtimeSuccessorStrategyValidationCodeKnownV117(stringValue(issue, "code")) ||
		stringValue(issue, "message") == "" {
		return false
	}
	for key, candidate := range issue {
		switch key {
		case "code":
			if code, ok := candidate.(string); !ok || !runtimeSuccessorStrategyValidationCodeKnownV117(code) {
				return false
			}
		case "severity":
			if issueSeverity, ok := candidate.(string); !ok || issueSeverity != severity {
				return false
			}
		case "message", "pattern", "constraint", "remediation", "reference":
			if text, ok := candidate.(string); !ok || text == "" {
				return false
			}
		case "line":
			if integer, ok := runtimeInvocationV117Integer(candidate); !ok || integer <= 0 {
				return false
			}
		case "column":
			if integer, ok := runtimeInvocationV117Integer(candidate); !ok || integer < 0 {
				return false
			}
		default:
			return false
		}
	}
	return true
}

func validSuccessorRuntimeLimitsV117(limits map[string]any) bool {
	return runtimeInvocationV117ExactKeys(limits,
		"timeoutMs", "stdoutBytes", "stderrBytes", "sourceBytes", "strategyMemoryBytes", "soldierMemoryBytes", "objectivePayloadBytes",
		"environment", "filesystem", "network", "shell", "packagePolicy",
	) && intValue(limits, "timeoutMs") == 1000 && intValue(limits, "stdoutBytes") == 262144 &&
		intValue(limits, "stderrBytes") == 65536 && intValue(limits, "sourceBytes") == 65536 &&
		intValue(limits, "strategyMemoryBytes") == 32768 && intValue(limits, "soldierMemoryBytes") == 2048 &&
		intValue(limits, "objectivePayloadBytes") == 1024 && stringValue(limits, "environment") == "empty" &&
		stringValue(limits, "filesystem") == "none" && stringValue(limits, "network") == "disabled" &&
		stringValue(limits, "shell") == "disabled" && stringValue(limits, "packagePolicy") == "none"
}

func emptyRuntimeCapabilities(value any) bool {
	switch typed := value.(type) {
	case []any:
		return len(typed) == 0
	case []string:
		return len(typed) == 0
	default:
		return false
	}
}

func validDeploymentLaneSemanticTuple(tupleID string, tuple canonicalCompatibilityTuple) bool {
	return validKnownVersionedCompatibilityTuple(tupleID, tuple)
}
