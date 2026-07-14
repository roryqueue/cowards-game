package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

type deploymentLaneFixture struct {
	Tuple    registeredCompatibilityTuple
	Registry *goDeploymentLaneRegistry
	Lane     goExecutableLaneIdentity
	Entrant  map[string]any
	Strategy runtimeServiceStrategyRevision
}

func newDeploymentLaneFixture(t *testing.T) deploymentLaneFixture {
	t.Helper()
	t.Setenv("COWARDS_PROVIDER_VALIDATION_SECRET", "cowards-provider-validation-test-secret-v1.33")
	source := "export default { selectActivations() { return []; }, soldierBrain() { return {}; } }"
	sourceHash := hashString(source)
	sourceBytes := len([]byte(source))
	metadata := providerReadinessSourceArtifactMetadata(t, "typescript", "strategy-language-provider-js-ts", sourceHash, sourceBytes, true)
	toolchain := mapValue(mapValue(metadata, "sourceArtifact"), "toolchain")
	toolchain["runtime"] = "typescript-transpileModule"
	toolchain["runtimeVersion"] = "6.0.3"
	engine := engineCompatibility()
	tuple := registeredCompatibilityTuple{
		TupleID: "sha256:" + strings.Repeat("a", 64),
		Tuple: canonicalCompatibilityTuple{
			Rules: "cowards-rules-v1.4", Engine: stringValue(engine, "engine"), RuntimeABI: strategyRuntimeABIVersion,
			Chronicle: "chronicle-v1.4", ArenaCatalog: "canonical-arena-catalog-v1.4", SetPolicy: "canonical-set-policy-v1.4",
		},
	}
	profile := goDeploymentLaneProfile{
		ProviderID: "strategy-language-provider-js-ts", LanguageID: "typescript", LanguageVersion: "0.1.0",
		RuntimeID: "typescript-transpileModule", RuntimeVersion: "6.0.3", ToolchainID: "typescript", ToolchainVersion: "6.0.3",
		AdapterID: "runtime-js-worker-thread", AdapterVersion: "0.1.0", PolicyID: "package-none-policy", PolicyVersion: "v1.37",
		CorpusID: "four-language-conformance", CorpusVersion: "v1.37", ArtifactKind: "source", ArtifactIDPrefix: "strategy-revision-artifact:",
		ImplementationID: "runtime-execution-service", BuildID: "runtime-execution-service-v1.37", SemanticTupleID: tuple.TupleID, SemanticTuple: tuple.Tuple,
	}
	registry := &goDeploymentLaneRegistry{SchemaVersion: deploymentLaneRegistrySchemaVersion, RegistryID: "test:deployment-lanes", Lanes: []goDeploymentLaneProfile{profile}}
	revisionID := "strategy-revision:test:typescript"
	runtime := defaultRuntimeMetadata()
	lane, ok := registry.resolveRevision(revisionID, sourceHash, sourceBytes, runtime, engine, metadata, tuple)
	if !ok || lane == nil {
		t.Fatal("deployment registry did not resolve exact fixture revision")
	}
	lockedAt := time.Date(2026, 7, 13, 12, 0, 0, 0, time.UTC)
	return deploymentLaneFixture{
		Tuple: tuple, Registry: registry, Lane: *lane,
		Entrant: map[string]any{
			"strategyRevisionId": revisionID, "sourceHash": sourceHash, "sourceBytes": sourceBytes,
			"runtime": runtime, "engineCompatibility": engine,
			"_creationRuntime": runtime, "_creationMetadata": metadata,
		},
		Strategy: runtimeServiceStrategyRevision{
			ID: revisionID, Source: source, SourceHash: sourceHash, SourceBytes: sourceBytes,
			Runtime: runtime, EngineCompatibility: engine, Validation: map[string]any{"valid": true, "sourceHash": sourceHash, "sourceBytes": sourceBytes}, Metadata: metadata, LockedAt: &lockedAt,
		},
	}
}

func TestDeploymentLaneRegistryOwnsNormalValidationToCreationIdentity(t *testing.T) {
	fixture := newDeploymentLaneFixture(t)
	body := strategyRevisionCreateBody{StrategyID: "strategy:test", Source: fixture.Strategy.Source, SourceFormat: "typescript"}
	validation := &runtimeServiceValidationResponse{
		OK: true, Kind: "strategyValidation", SourceFormat: "typescript",
		Runtime: fixture.Strategy.Runtime, Validation: fixture.Strategy.Validation,
		EngineCompatibility: fixture.Strategy.EngineCompatibility, Metadata: fixture.Strategy.Metadata,
		SourceHash: fixture.Strategy.SourceHash, SourceBytes: fixture.Strategy.SourceBytes,
	}
	insert, readiness := accountRevisionInsertFromProviderValidation("user:test", body, validation)
	if readiness.State == revisionReadinessInvalid {
		t.Fatalf("normal provider validation was rejected: %+v", readiness)
	}
	if _, exists := insert.Metadata["executableLaneIdentity"]; exists {
		t.Fatal("provider response metadata became executable lane authority")
	}
	lane, ok := fixture.Registry.resolveRevision(
		fixture.Strategy.ID, insert.SourceHash, insert.SourceBytes, insert.Runtime,
		insert.EngineCompatibility, insert.Metadata, fixture.Tuple,
	)
	if !ok || lane == nil || *lane != fixture.Lane {
		t.Fatalf("saved provider validation did not resolve through backend registry: %+v", lane)
	}
	savedEntrant := cloneMap(fixture.Entrant)
	savedEntrant["sourceHash"] = insert.SourceHash
	savedEntrant["sourceBytes"] = insert.SourceBytes
	savedEntrant["engineCompatibility"] = insert.EngineCompatibility
	savedEntrant["_creationRuntime"] = insert.Runtime
	savedEntrant["_creationMetadata"] = insert.Metadata
	if !creationLaneMatchesEntrant(fixture.Lane, savedEntrant, fixture.Tuple, fixture.Registry) {
		t.Fatal("normal saved revision could not bind to certified creation lane")
	}

	drifts := []struct {
		name   string
		mutate func(*deploymentLaneFixture)
	}{
		{name: "manifest build", mutate: func(value *deploymentLaneFixture) { value.Registry.Lanes[0].BuildID = "other-build" }},
		{name: "manifest toolchain", mutate: func(value *deploymentLaneFixture) { value.Registry.Lanes[0].ToolchainVersion = "other-toolchain" }},
		{name: "revision adapter", mutate: func(value *deploymentLaneFixture) {
			mapValue(value.Strategy.Runtime, "adapter")["version"] = "other-adapter"
		}},
		{name: "revision artifact", mutate: func(value *deploymentLaneFixture) {
			mapValue(value.Strategy.Metadata, "sourceArtifact")["hash"] = strings.Repeat("b", 64)
		}},
		{name: "revision provider", mutate: func(value *deploymentLaneFixture) {
			mapValue(value.Strategy.Metadata, "providerValidation")["providerId"] = "other-provider"
		}},
	}
	for _, drift := range drifts {
		t.Run(drift.name, func(t *testing.T) {
			candidate := newDeploymentLaneFixture(t)
			drift.mutate(&candidate)
			resolved, ok := candidate.Registry.resolveRevision(candidate.Strategy.ID, candidate.Strategy.SourceHash, candidate.Strategy.SourceBytes, candidate.Strategy.Runtime, candidate.Strategy.EngineCompatibility, candidate.Strategy.Metadata, candidate.Tuple)
			if ok && resolved != nil && *resolved == fixture.Lane {
				t.Fatal("manifest/revision drift retained certified executable identity")
			}
		})
	}
}

func TestDeploymentLaneRegistryFileIsStrictAndAuthorityBound(t *testing.T) {
	fixture := newDeploymentLaneFixture(t)
	directory := t.TempDir()
	path := filepath.Join(directory, "deployment-lanes.json")
	bytes, err := json.Marshal(fixture.Registry)
	if err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, bytes, 0o600); err != nil {
		t.Fatal(err)
	}
	loaded, err := loadDeploymentLaneRegistry(path)
	if err != nil || loaded.RegistryID != fixture.Registry.RegistryID {
		t.Fatalf("strict deployment registry did not load: %+v %v", loaded, err)
	}
	authority := &verifiedRuntimeEvidenceAuthority{CompatibilityTuple: fixture.Tuple}
	if !loaded.matchesAuthority(authority) {
		t.Fatal("exact deployment registry did not match authority tuple")
	}
	authority.CompatibilityTuple.Tuple.Engine = "drifted-engine"
	if loaded.matchesAuthority(authority) {
		t.Fatal("authority tuple drift retained deployment registry")
	}
	if err := os.WriteFile(path, append(bytes[:len(bytes)-1], []byte(`,"unexpected":true}`)...), 0o600); err != nil {
		t.Fatal(err)
	}
	if _, err := loadDeploymentLaneRegistry(path); err == nil {
		t.Fatal("unknown registry field was accepted")
	}
}
