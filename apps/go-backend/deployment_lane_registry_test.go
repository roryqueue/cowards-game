package main

import (
	"encoding/base64"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func TestPhase258SuccessorProviderProofUsesExactV117Contract(t *testing.T) {
	sourceHash := strings.Repeat("a", 64)
	artifactHash := strings.Repeat("b", 64)
	proof := providerValidationProofV117(
		"provider", "runtime-provider-validation-v1.17",
		sourceHash, 3, artifactHash, 4,
	)
	if proof != "sha256:93ada36fcf39aed8096a022954c5b6b0b64ca4ece37cf29d4c87554e755536c0" {
		t.Fatalf("Go v1.17 provider proof diverged from the TypeScript vector: %q", proof)
	}
	artifactBytes := []byte{1, 2, 3, 4}
	artifactHash = strings.TrimPrefix(runtimeInvocationV117SHA256Value(artifactBytes), "sha256:")
	metadata := map[string]any{
		"sourceArtifact": map[string]any{
			"format": "transpiled-javascript", "sourceHash": sourceHash, "sourceBytes": 3,
			"abiVersion": strategyRuntimeABIVersionV117, "validationStatus": "valid",
			"hash": artifactHash, "bytes": len(artifactBytes), "bytesBase64": base64.StdEncoding.EncodeToString(artifactBytes),
			"toolchain": map[string]any{"language": "typescript"},
		},
		"providerValidation": map[string]any{
			"providerId": "provider", "contractVersion": "runtime-provider-validation-v1.17",
			"sourceHash": sourceHash, "sourceBytes": 3,
			"artifactHash": artifactHash, "artifactBytes": len(artifactBytes),
		},
	}
	provider := mapValue(metadata, "providerValidation")
	provider["proof"] = providerValidationProofV117("provider", "runtime-provider-validation-v1.17", sourceHash, 3, artifactHash, len(artifactBytes))
	if !sourceArtifactProviderValidationMatchesABI(metadata, sourceHash, 3, "provider", "typescript", strategyRuntimeABIVersionV117) {
		t.Fatal("exact v1.17 provider proof was rejected")
	}
	provider["contractVersion"] = "strategy-language-provider-contract-v1.33"
	if sourceArtifactProviderValidationMatchesABI(metadata, sourceHash, 3, "provider", "typescript", strategyRuntimeABIVersionV117) {
		t.Fatal("legacy provider contract was accepted on the successor ABI")
	}
}

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
	tuple := registeredCompatibilityTuple{TupleID: currentCanonicalTupleID, Tuple: currentCanonicalTuple}
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
	lane, ok := registry.resolveRevision(revisionID, sourceHash, sourceBytes, runtime, engine, nil, metadata, tuple)
	if !ok || lane == nil {
		t.Fatal("deployment registry did not resolve exact fixture revision")
	}
	lockedAt := time.Date(2026, 7, 13, 12, 0, 0, 0, time.UTC)
	return deploymentLaneFixture{
		Tuple: tuple, Registry: registry, Lane: *lane,
		Entrant: map[string]any{
			"strategyRevisionId": revisionID, "sourceHash": sourceHash, "sourceBytes": sourceBytes,
			"runtime": runtime, "engineCompatibility": engine,
			"_creationRuntime": runtime, "_creationValidation": map[string]any{"valid": true, "sourceHash": sourceHash, "sourceBytes": sourceBytes}, "_creationMetadata": metadata,
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
		insert.EngineCompatibility, insert.Validation, insert.Metadata, fixture.Tuple,
	)
	if !ok || lane == nil || *lane != fixture.Lane {
		t.Fatalf("saved provider validation did not resolve through backend registry: %+v", lane)
	}
	savedEntrant := cloneMap(fixture.Entrant)
	savedEntrant["sourceHash"] = insert.SourceHash
	savedEntrant["sourceBytes"] = insert.SourceBytes
	savedEntrant["engineCompatibility"] = insert.EngineCompatibility
	savedEntrant["_creationRuntime"] = insert.Runtime
	savedEntrant["_creationValidation"] = insert.Validation
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
			resolved, ok := candidate.Registry.resolveRevision(candidate.Strategy.ID, candidate.Strategy.SourceHash, candidate.Strategy.SourceBytes, candidate.Strategy.Runtime, candidate.Strategy.EngineCompatibility, candidate.Strategy.Validation, candidate.Strategy.Metadata, candidate.Tuple)
			if ok && resolved != nil && *resolved == fixture.Lane {
				t.Fatal("manifest/revision drift retained certified executable identity")
			}
		})
	}
}

func TestPhase258DeploymentLaneRegistryKeepsRuntimeAndToolchainVersionsDistinct(t *testing.T) {
	authorityFixture := loadRuntimeSuccessorAuthorityFixtureV117(t)
	vector := authorityFixture.RevisionVectors[0]
	strategy := vector.strategy(t, time.Date(2026, 7, 15, 12, 0, 0, 0, time.UTC))
	profile := goDeploymentLaneProfile{
		ProviderID: vector.Deployed.ProviderID, LanguageID: vector.Deployed.LanguageID,
		LanguageVersion: stringValue(mapValue(strategy.Runtime, "language"), "version"),
		RuntimeID:       vector.Deployed.RuntimeID, RuntimeVersion: vector.Deployed.RuntimeVersion,
		ToolchainID: vector.Deployed.ToolchainID, ToolchainVersion: vector.Deployed.ToolchainVersion,
		AdapterID: vector.Deployed.AdapterID, AdapterVersion: vector.Deployed.AdapterVersion,
		PolicyID: vector.Deployed.PolicyID, PolicyVersion: vector.Deployed.PolicyVersion,
		CorpusID: vector.Deployed.CorpusID, CorpusVersion: vector.Deployed.CorpusVersion,
		ArtifactKind: "source", ArtifactIDPrefix: strings.TrimSuffix(vector.Deployed.ArtifactID, strategy.ID),
		ImplementationID: vector.Deployed.ImplementationID, BuildID: vector.Deployed.BuildID,
		SemanticTupleID: vector.Deployed.SemanticTupleID, SemanticTuple: vector.Deployed.SemanticTuple,
		SuccessorRuntimeIdentityTemplate: cloneRuntimeSuccessorIdentityTemplateV117(&authorityFixture.Template),
	}
	registry := &goDeploymentLaneRegistry{SchemaVersion: deploymentLaneRegistrySchemaVersion, RegistryID: "fixture:runtime-toolchain-split:v1.17", Lanes: []goDeploymentLaneProfile{profile}}
	lane, ok := registry.resolveRevision(
		strategy.ID,
		strategy.SourceHash,
		strategy.SourceBytes,
		strategy.Runtime,
		strategy.EngineCompatibility,
		strategy.Validation,
		strategy.Metadata,
		registeredCompatibilityTuple{TupleID: authorityFixture.SemanticTupleID, Tuple: authorityFixture.SemanticTuple},
	)
	if !ok || lane == nil || lane.RuntimeID != "node" || lane.RuntimeVersion != "node-v26.0.0" ||
		lane.ToolchainID != "typescript-transpileModule" || lane.ToolchainVersion != "6.0.3" || *lane != vector.Deployed {
		t.Fatalf("distinct runtime/toolchain versions did not resolve exactly: %+v", lane)
	}
}

func successorCompiledDeploymentRegistryForTest(t *testing.T, languageID string, runtime map[string]any, metadata map[string]any) (*goDeploymentLaneRegistry, registeredCompatibilityTuple) {
	t.Helper()
	authorityFixture := loadRuntimeSuccessorAuthorityFixtureV117(t)
	template := cloneRuntimeSuccessorIdentityTemplateV117(&authorityFixture.Template)
	artifact := mapValue(metadata, "compiledArtifact")
	toolchain := mapValue(artifact, "toolchain")
	bindings := runtimeIdentityBindingMapV117(template.Bindings)
	profile := goDeploymentLaneProfile{
		ProviderID: stringValue(mapValue(metadata, "providerValidation"), "providerId"),
		LanguageID: languageID, LanguageVersion: stringValue(mapValue(runtime, "language"), "version"),
		RuntimeID: "wasmtime", RuntimeVersion: "wasmtime-v1.17-test",
		ToolchainID: stringValue(toolchain, "compiler"), ToolchainVersion: stringValue(toolchain, "compilerVersion"),
		AdapterID: stringValue(mapValue(runtime, "adapter"), "id"), AdapterVersion: stringValue(mapValue(runtime, "adapter"), "version"),
		PolicyID: bindings["containmentPolicy"].PublicID, PolicyVersion: "v1.17",
		CorpusID: bindings["conformanceCorpus"].PublicID, CorpusVersion: "v1.17",
		ArtifactKind: "compiled", ArtifactIDPrefix: "strategy-revision-artifact:",
		ImplementationID: "runtime-execution-service", BuildID: "runtime-execution-service-v1.17-test",
		SemanticTupleID: runtimeSuccessorSemanticTupleIDV117, SemanticTuple: runtimeSuccessorCanonicalTupleV117,
	}
	template.ExactPins[1][1] = profile.RuntimeVersion
	laneProfileSHA256, ok := hashSuccessorRuntimeLaneProfileV117(profile)
	if !ok {
		t.Fatal("compiled successor lane profile did not hash")
	}
	template.LaneProfileSHA256 = laneProfileSHA256
	profile.SuccessorRuntimeIdentityTemplate = template
	return &goDeploymentLaneRegistry{
		SchemaVersion: deploymentLaneRegistrySchemaVersion,
		RegistryID:    "test:compiled-successor:" + languageID,
		Lanes:         []goDeploymentLaneProfile{profile},
	}, registeredCompatibilityTuple{TupleID: runtimeSuccessorSemanticTupleIDV117, Tuple: runtimeSuccessorCanonicalTupleV117}
}

func TestPhase258DeploymentLaneRegistryResolvesPersistedV117RustAndZigArtifacts(t *testing.T) {
	source := "pub fn main() {}\r\n"
	for _, languageID := range []string{"rust", "zig"} {
		t.Run(languageID, func(t *testing.T) {
			validation := providerReadinessV117ValidationResponse(t, languageID, source)
			wire, err := json.Marshal(validation)
			if err != nil {
				t.Fatal(err)
			}
			var roundTripped runtimeServiceValidationResponse
			if err := decodeStrictJSONUseNumber(wire, &roundTripped); err != nil {
				t.Fatal(err)
			}
			insert, readiness := accountRevisionInsertFromProviderValidationForSelectedABI(
				"user:compiled-successor", strategyRevisionCreateBody{Source: source, SourceFormat: languageID},
				&roundTripped, strategyRuntimeABIVersionV117,
			)
			if readiness.State != revisionReadinessExecutionDisabled || readiness.PublicCategory != "containment_missing" {
				t.Fatalf("valid %s account write did not reach containment gate: %+v", languageID, readiness)
			}
			persistedWire, err := json.Marshal(insert)
			if err != nil {
				t.Fatal(err)
			}
			var persisted accountRevisionInsert
			if err := decodeStrictJSONUseNumber(persistedWire, &persisted); err != nil {
				t.Fatal(err)
			}
			registry, tuple := successorCompiledDeploymentRegistryForTest(t, languageID, persisted.Runtime, persisted.Metadata)
			resolved, ok := registry.resolveRevision(
				"strategy-revision:persisted:"+languageID, persisted.SourceHash, persisted.SourceBytes,
				persisted.Runtime, persisted.EngineCompatibility, persisted.Validation, persisted.Metadata, tuple,
			)
			if !ok || resolved == nil || resolved.LanguageID != languageID || resolved.ArtifactSHA256 != stringValue(mapValue(persisted.Metadata, "compiledArtifact"), "hash") {
				t.Fatalf("persisted %s compiled revision did not resolve exactly: %+v", languageID, resolved)
			}

			mixed := cloneMap(persisted.Metadata)
			mixed["sourceArtifact"] = cloneMap(mapValue(mixed, "compiledArtifact"))
			if resolved, ok := registry.resolveRevision(
				"strategy-revision:mixed:"+languageID, persisted.SourceHash, persisted.SourceBytes,
				persisted.Runtime, persisted.EngineCompatibility, persisted.Validation, mixed, tuple,
			); ok || resolved != nil {
				t.Fatalf("%s accepted an extra source artifact beside the compiled artifact", languageID)
			}

			swapped := cloneMap(persisted.Metadata)
			swapped["sourceArtifact"] = cloneMap(mapValue(swapped, "compiledArtifact"))
			delete(swapped, "compiledArtifact")
			if resolved, ok := registry.resolveRevision(
				"strategy-revision:swapped:"+languageID, persisted.SourceHash, persisted.SourceBytes,
				persisted.Runtime, persisted.EngineCompatibility, persisted.Validation, swapped, tuple,
			); ok || resolved != nil {
				t.Fatalf("%s accepted a source artifact in the compiled lane", languageID)
			}
		})
	}
}

func TestPhase258SuccessorRuntimeLimitsRequireExactIntegersAfterJSONDecoding(t *testing.T) {
	limits := defaultRuntimeServiceLimitsV117()
	limits["timeoutMs"] = json.Number("1000")
	if !validSuccessorRuntimeLimitsV117(limits) {
		t.Fatal("exact JSON-number successor limits were rejected")
	}
	for _, fractional := range []any{1000.5, json.Number("1000.5")} {
		limits["timeoutMs"] = fractional
		if validSuccessorRuntimeLimitsV117(limits) {
			t.Fatalf("fractional successor runtime limit was truncated and accepted: %v", fractional)
		}
	}
}

func TestPhase258SuccessorValidationIssuesUseExactGeneratedSpecAuthority(t *testing.T) {
	fixture := loadRuntimeSuccessorAuthorityFixtureV117(t)
	strategy := fixture.RevisionVectors[0].strategy(t, time.Date(2026, 7, 15, 12, 0, 0, 0, time.UTC))
	validate := func(validation map[string]any) bool {
		return validSuccessorStrategyValidationV117(
			validation,
			strategy.SourceHash,
			strategy.SourceBytes,
			strategy.Runtime,
			strategy.EngineCompatibility,
		)
	}
	if !validate(strategy.Validation) {
		t.Fatal("exact generated successor validation report was rejected")
	}

	codes := runtimeSuccessorStrategyValidationCodesV117()
	if len(codes) != 17 {
		t.Fatalf("generated Strategy validation authority has %d codes, want 17", len(codes))
	}
	for _, code := range codes {
		t.Run("accepts "+code, func(t *testing.T) {
			if !runtimeSuccessorStrategyValidationCodeKnownV117(code) {
				t.Fatalf("generated code %q is absent from its own authority", code)
			}
			candidate := cloneMap(strategy.Validation)
			candidate["warnings"] = []any{map[string]any{
				"code": code, "severity": "warning", "message": "warning",
				"pattern": "pattern", "line": 1, "column": 0,
				"constraint": "constraint", "remediation": "remediation", "reference": "reference",
			}}
			if !validate(candidate) {
				t.Fatalf("spec-owned Strategy validation code %q was rejected", code)
			}
		})
	}
	if runtimeSuccessorStrategyValidationCodeKnownV117("UNKNOWN") {
		t.Fatal("unknown Strategy validation code entered generated authority")
	}
	if !validSuccessorValidationIssueV117(map[string]any{"code": codes[0], "severity": "error", "message": "error"}, "error") {
		t.Fatal("exact spec-owned error issue was rejected")
	}

	baseIssue := func() map[string]any {
		return map[string]any{"code": codes[0], "severity": "warning", "message": "warning"}
	}
	rejections := []struct {
		name   string
		mutate func(map[string]any)
	}{
		{"unknown code", func(issue map[string]any) { issue["code"] = "UNKNOWN" }},
		{"severity mismatch", func(issue map[string]any) { issue["severity"] = "error" }},
		{"empty message", func(issue map[string]any) { issue["message"] = "" }},
		{"missing message", func(issue map[string]any) { delete(issue, "message") }},
		{"unknown key", func(issue map[string]any) { issue["detail"] = "private" }},
		{"zero line", func(issue map[string]any) { issue["line"] = 0 }},
		{"negative column", func(issue map[string]any) { issue["column"] = -1 }},
		{"fractional column", func(issue map[string]any) { issue["column"] = json.Number("1.5") }},
		{"empty optional string", func(issue map[string]any) { issue["reference"] = "" }},
	}
	for _, rejection := range rejections {
		t.Run("rejects "+rejection.name, func(t *testing.T) {
			issue := baseIssue()
			rejection.mutate(issue)
			candidate := cloneMap(strategy.Validation)
			candidate["warnings"] = []any{issue}
			if validate(candidate) {
				t.Fatalf("invalid successor Strategy validation issue was accepted: %+v", issue)
			}
		})
	}

	t.Run("rejects valid errors parity mismatch", func(t *testing.T) {
		candidate := cloneMap(strategy.Validation)
		candidate["errors"] = []any{map[string]any{"code": codes[0], "severity": "error", "message": "error"}}
		if validate(candidate) {
			t.Fatal("valid=true was accepted with a nonempty errors array")
		}
	})
	t.Run("rejects invalid empty errors parity mismatch", func(t *testing.T) {
		candidate := cloneMap(strategy.Validation)
		candidate["valid"] = false
		if validate(candidate) {
			t.Fatal("valid=false was accepted with an empty errors array")
		}
	})
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
	authority.CompatibilityTuple = fixture.Tuple
	authority.CompatibilityTuple.TupleID = "sha256:" + strings.Repeat("a", 64)
	if loaded.matchesAuthority(authority) {
		t.Fatal("authority tuple identity/expansion mismatch retained deployment registry")
	}
	if err := os.WriteFile(path, append(bytes[:len(bytes)-1], []byte(`,"unexpected":true}`)...), 0o600); err != nil {
		t.Fatal(err)
	}
	if _, err := loadDeploymentLaneRegistry(path); err == nil {
		t.Fatal("unknown registry field was accepted")
	}
}

func TestPhase258DeploymentLaneRegistryOwnsAndNormalizesSuccessorTemplate(t *testing.T) {
	fixture := newDeploymentLaneFixture(t)
	fixture.Registry.Lanes[0].SemanticTupleID = runtimeSuccessorSemanticTupleIDV117
	fixture.Registry.Lanes[0].SemanticTuple = runtimeSuccessorCanonicalTupleV117
	directory := t.TempDir()
	path := filepath.Join(directory, "successor-deployment-lanes.json")
	write := func() {
		bytes, err := json.Marshal(fixture.Registry)
		if err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(path, bytes, 0o600); err != nil {
			t.Fatal(err)
		}
	}
	write()
	if _, err := loadDeploymentLaneRegistry(path); err == nil {
		t.Fatal("v1.17 deployment lane without an immutable identity template was accepted")
	}
	template := runtimeSuccessorIdentityTemplateFixtureV117(runtimeServiceExactPinsFixtureV117(1))
	for left, right := 0, len(template.Bindings)-1; left < right; left, right = left+1, right-1 {
		template.Bindings[left], template.Bindings[right] = template.Bindings[right], template.Bindings[left]
	}
	templateBindings := runtimeIdentityBindingMapV117(template.Bindings)
	fixture.Registry.Lanes[0].RuntimeVersion = template.ExactPins[1][1]
	fixture.Registry.Lanes[0].PolicyID = templateBindings["containmentPolicy"].PublicID
	fixture.Registry.Lanes[0].CorpusID = templateBindings["conformanceCorpus"].PublicID
	laneProfileHash, ok := hashSuccessorRuntimeLaneProfileV117(fixture.Registry.Lanes[0])
	if !ok {
		t.Fatal("successor lane profile could not be hashed")
	}
	template.LaneProfileSHA256 = laneProfileHash
	fixture.Registry.Lanes[0].SuccessorRuntimeIdentityTemplate = template
	write()
	loaded, err := loadDeploymentLaneRegistry(path)
	if err != nil {
		t.Fatalf("valid unordered successor template was rejected: %v", err)
	}
	for index, binding := range loaded.Lanes[0].SuccessorRuntimeIdentityTemplate.Bindings {
		if binding.Domain != runtimeSuccessorIdentityTemplateDomainsV117[index] {
			t.Fatal("successor template was not normalized to the spec-owned domain order")
		}
	}
	originalProfileHash, ok := hashSuccessorRuntimeLaneProfileV117(loaded.Lanes[0])
	if !ok || originalProfileHash != loaded.Lanes[0].SuccessorRuntimeIdentityTemplate.LaneProfileSHA256 {
		t.Fatal("successor template did not preserve the exact 19-field lane profile hash")
	}
	for _, field := range runtimeSuccessorLaneProfileFieldsV117 {
		drifted := loaded.Lanes[0]
		mutateSuccessorLaneProfileFieldForTest(t, &drifted, field)
		driftedHash, hashed := hashSuccessorRuntimeLaneProfileV117(drifted)
		if !hashed || driftedHash == originalProfileHash || successorIdentityTemplateMatchesLaneProfileV117(drifted.SuccessorRuntimeIdentityTemplate, drifted) {
			t.Fatalf("successor template retained drifted lane profile field %s", field)
		}
	}
	resolvedTemplate, ok := loaded.successorIdentityTemplateForRevision(fixture.Strategy)
	if !ok || resolvedTemplate == nil {
		t.Fatal("successor template was not resolved for the exact revision lane")
	}
	resolvedTemplate.Bindings[0].PublicID = "mutated-by-caller"
	if loaded.Lanes[0].SuccessorRuntimeIdentityTemplate.Bindings[0].PublicID == "mutated-by-caller" {
		t.Fatal("caller mutation changed the deployment registry's canonical template")
	}
	fixture.Registry.Lanes[0].SemanticTupleID = currentCanonicalTupleID
	fixture.Registry.Lanes[0].SemanticTuple = currentCanonicalTuple
	write()
	if _, err := loadDeploymentLaneRegistry(path); err == nil {
		t.Fatal("successor identity template was admitted on a historical runtime ABI lane")
	}
}

func mutateSuccessorLaneProfileFieldForTest(t *testing.T, profile *goDeploymentLaneProfile, field string) {
	t.Helper()
	switch field {
	case "providerId":
		profile.ProviderID += ".drift"
	case "languageId":
		profile.LanguageID += ".drift"
	case "languageVersion":
		profile.LanguageVersion += ".drift"
	case "runtimeId":
		profile.RuntimeID += ".drift"
	case "runtimeVersion":
		profile.RuntimeVersion += ".drift"
	case "toolchainId":
		profile.ToolchainID += ".drift"
	case "toolchainVersion":
		profile.ToolchainVersion += ".drift"
	case "adapterId":
		profile.AdapterID += ".drift"
	case "adapterVersion":
		profile.AdapterVersion += ".drift"
	case "policyId":
		profile.PolicyID += ".drift"
	case "policyVersion":
		profile.PolicyVersion += ".drift"
	case "corpusId":
		profile.CorpusID += ".drift"
	case "corpusVersion":
		profile.CorpusVersion += ".drift"
	case "artifactKind":
		profile.ArtifactKind = "compiled"
	case "artifactIdPrefix":
		profile.ArtifactIDPrefix += "drift:"
	case "implementationId":
		profile.ImplementationID += ".drift"
	case "buildId":
		profile.BuildID += ".drift"
	case "semanticTupleId":
		profile.SemanticTupleID = currentCanonicalTupleID
	case "semanticTuple":
		profile.SemanticTuple.Engine += ".drift"
	default:
		t.Fatalf("uncovered successor lane profile field %q", field)
	}
}

func TestPhase258DeploymentLaneRegistryRejectsTupleIdentityExpansionMismatch(t *testing.T) {
	fixture := newDeploymentLaneFixture(t)
	directory := t.TempDir()
	path := filepath.Join(directory, "tuple-mismatch-deployment-lanes.json")
	fixture.Registry.Lanes[0].SemanticTupleID = "sha256:" + strings.Repeat("a", 64)
	bytes, err := json.Marshal(fixture.Registry)
	if err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, bytes, 0o600); err != nil {
		t.Fatal(err)
	}
	if _, err := loadDeploymentLaneRegistry(path); err == nil {
		t.Fatal("registry loaded an internally inconsistent tuple identity and expansion")
	}
	if _, ok := fixture.Registry.resolveRevision(
		fixture.Strategy.ID,
		fixture.Strategy.SourceHash,
		fixture.Strategy.SourceBytes,
		fixture.Strategy.Runtime,
		fixture.Strategy.EngineCompatibility,
		fixture.Strategy.Validation,
		fixture.Strategy.Metadata,
		fixture.Tuple,
	); ok {
		t.Fatal("registry resolved through an internally inconsistent tuple identity and expansion")
	}
}
