package main

import (
	"errors"
	"os"
	"strings"
)

const deploymentLaneRegistrySchemaVersion = "runtime-deployment-lane-registry-v1.37"

type goDeploymentLaneProfile struct {
	ProviderID       string                      `json:"providerId"`
	LanguageID       string                      `json:"languageId"`
	LanguageVersion  string                      `json:"languageVersion"`
	RuntimeID        string                      `json:"runtimeId"`
	RuntimeVersion   string                      `json:"runtimeVersion"`
	ToolchainID      string                      `json:"toolchainId"`
	ToolchainVersion string                      `json:"toolchainVersion"`
	AdapterID        string                      `json:"adapterId"`
	AdapterVersion   string                      `json:"adapterVersion"`
	PolicyID         string                      `json:"policyId"`
	PolicyVersion    string                      `json:"policyVersion"`
	CorpusID         string                      `json:"corpusId"`
	CorpusVersion    string                      `json:"corpusVersion"`
	ArtifactKind     string                      `json:"artifactKind"`
	ArtifactIDPrefix string                      `json:"artifactIdPrefix"`
	ImplementationID string                      `json:"implementationId"`
	BuildID          string                      `json:"buildId"`
	SemanticTupleID  string                      `json:"semanticTupleId"`
	SemanticTuple    canonicalCompatibilityTuple `json:"semanticTuple"`
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
		key := strings.Join([]string{lane.LanguageID, lane.LanguageVersion, lane.AdapterID, lane.AdapterVersion}, "\x00")
		if keys[key] {
			return nil, errors.New("deployment lane registry profile is ambiguous")
		}
		keys[key] = true
	}
	return &registry, nil
}

func loadProductionDeploymentLaneRegistryFromEnvironment() (*goDeploymentLaneRegistry, error) {
	return loadDeploymentLaneRegistry(strings.TrimSpace(os.Getenv("COWARDS_RUNTIME_DEPLOYMENT_LANE_REGISTRY")))
}

func (registry *goDeploymentLaneRegistry) matchesAuthority(authority *verifiedRuntimeEvidenceAuthority) bool {
	if registry == nil || authority == nil || len(registry.Lanes) == 0 {
		return false
	}
	for _, profile := range registry.Lanes {
		if profile.SemanticTupleID != authority.CompatibilityTuple.TupleID || profile.SemanticTuple != authority.CompatibilityTuple.Tuple {
			return false
		}
	}
	return true
}

func (registry *goDeploymentLaneRegistry) resolveRevision(id string, sourceHash string, sourceBytes int, runtime map[string]any, engine map[string]any, metadata map[string]any, tuple registeredCompatibilityTuple) (*goExecutableLaneIdentity, bool) {
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
	if profile == nil || profile.SemanticTupleID != tuple.TupleID || profile.SemanticTuple != tuple.Tuple || stringValue(runtime, "abiVersion") != tuple.Tuple.RuntimeABI || stringValue(engine, "spec") != tuple.Tuple.Rules || stringValue(engine, "engine") != tuple.Tuple.Engine {
		return nil, false
	}
	provider := mapValue(metadata, "providerValidation")
	if stringValue(provider, "providerId") != profile.ProviderID {
		return nil, false
	}
	artifact := mapValue(metadata, "sourceArtifact")
	providerValid := sourceArtifactProviderValidationMatches(metadata, sourceHash, sourceBytes, profile.ProviderID, profile.LanguageID)
	if profile.ArtifactKind == "compiled" {
		artifact = mapValue(metadata, "compiledArtifact")
		providerValid = rustProviderValidationMatches(metadata, sourceHash, sourceBytes, profile.LanguageID)
	}
	if !providerValid || !isLowerSHA256(stringValue(artifact, "hash")) {
		return nil, false
	}
	toolchain := mapValue(artifact, "toolchain")
	if profile.ArtifactKind == "source" {
		if stringValue(toolchain, "language") != profile.ToolchainID || stringValue(toolchain, "runtime") != profile.RuntimeID || stringValue(toolchain, "runtimeVersion") != profile.ToolchainVersion || profile.RuntimeVersion != profile.ToolchainVersion {
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
