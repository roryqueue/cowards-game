package main

import (
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"testing"
)

func TestProviderReadinessClassifiesPhase244StatesD02D03D04D09D10D11(t *testing.T) {
	t.Setenv("COWARDS_PROVIDER_VALIDATION_SECRET", "cowards-provider-validation-test-secret-v1.33")
	source := "export default { selectActivations() { return []; }, soldierBrain() { return { action: { type: \"TURN_TO_STONE\" }, soldierMemory: null }; } }"
	sourceHash := hashString(source)
	sourceBytes := len([]byte(source))
	validRuntime := defaultRuntimeMetadata()
	validValidation := map[string]any{
		"valid":       true,
		"errors":      []any{},
		"warnings":    []any{},
		"sourceHash":  sourceHash,
		"sourceBytes": sourceBytes,
	}
	validMetadata := providerReadinessSourceArtifactMetadata(t, "typescript", "strategy-language-provider-js-ts", sourceHash, sourceBytes, true)

	tests := []struct {
		name          string
		input         revisionReadinessInput
		state         revisionReadinessState
		category      string
		entryEligible bool
	}{
		{
			name: "D-02 TypeScript provider proof with private artifact bytes is execution ready",
			input: revisionReadinessInput{
				SourceFormat: "typescript",
				Runtime:      validRuntime,
				Validation:   validValidation,
				Metadata:     validMetadata,
				SourceHash:   sourceHash,
				SourceBytes:  sourceBytes,
			},
			state:         revisionReadinessExecutionReady,
			category:      "provider_validated",
			entryEligible: true,
		},
		{
			name: "D-04 public-redacted artifact identity is not execution ready",
			input: revisionReadinessInput{
				SourceFormat: "typescript",
				Runtime:      validRuntime,
				Validation:   validValidation,
				Metadata:     providerReadinessSourceArtifactMetadata(t, "typescript", "strategy-language-provider-js-ts", sourceHash, sourceBytes, false),
				SourceHash:   sourceHash,
				SourceBytes:  sourceBytes,
			},
			state:    revisionReadinessInvalid,
			category: "provider_proof_mismatched",
		},
		{
			name: "D-04 missing provider proof is not eligible",
			input: revisionReadinessInput{
				SourceFormat: "typescript",
				Runtime:      validRuntime,
				Validation:   validValidation,
				Metadata:     map[string]any{"sourceArtifact": validMetadata["sourceArtifact"]},
				SourceHash:   sourceHash,
				SourceBytes:  sourceBytes,
			},
			state:    revisionReadinessInvalid,
			category: "provider_proof_missing",
		},
		{
			name: "D-04 stale source identity has a distinct public category",
			input: revisionReadinessInput{
				SourceFormat: "typescript",
				Runtime:      validRuntime,
				Validation:   validValidation,
				Metadata:     validMetadata,
				SourceHash:   sourceHash + ":stale",
				SourceBytes:  sourceBytes,
			},
			state:    revisionReadinessInvalid,
			category: "provider_proof_stale",
		},
		{
			name: "D-03 invalid validation persists only as non-execution draft",
			input: revisionReadinessInput{
				SourceFormat: "typescript",
				Runtime:      validRuntime,
				Validation: map[string]any{
					"valid":       false,
					"errors":      []any{map[string]any{"code": "MISSING_SELECT_ACTIVATIONS"}},
					"warnings":    []any{},
					"sourceHash":  sourceHash,
					"sourceBytes": sourceBytes,
				},
				Metadata:    map[string]any{"tags": []string{"typescript", "provider", "invalid"}},
				SourceHash:  sourceHash,
				SourceBytes: sourceBytes,
			},
			state:    revisionReadinessNonExecutionDraft,
			category: "invalid_strategy_revision",
		},
		{
			name: "D-04 runtime-service unavailable fails closed",
			input: revisionReadinessInput{
				SourceFormat: "typescript",
				Failure:      newRuntimeServiceFailure("RuntimeServiceTransport", "Runtime execution service is unavailable", true, nil),
			},
			state:    revisionReadinessUnavailable,
			category: "runtime_service_unavailable",
		},
		{
			name: "D-11 package mode other than none is rejected",
			input: revisionReadinessInput{
				SourceFormat: "typescript",
				Runtime: map[string]any{
					"abiVersion": "strategy-runtime-abi-v1.14",
					"language":   map[string]any{"id": "typescript"},
					"adapter":    map[string]any{"id": "runtime-js-worker-thread"},
					"package":    map[string]any{"mode": "npm"},
				},
				Validation:  validValidation,
				Metadata:    validMetadata,
				SourceHash:  sourceHash,
				SourceBytes: sourceBytes,
			},
			state:    revisionReadinessInvalid,
			category: "package_policy_violation",
		},
		{
			name: "v1.36 required capabilities are rejected distinctly",
			input: revisionReadinessInput{
				SourceFormat: "typescript",
				Runtime: func() map[string]any {
					runtime := defaultRuntimeMetadata()
					runtime["requiredCapabilities"] = []string{"filesystem"}
					return runtime
				}(),
				Validation:  validValidation,
				Metadata:    validMetadata,
				SourceHash:  sourceHash,
				SourceBytes: sourceBytes,
			},
			state:    revisionReadinessInvalid,
			category: "capability_policy_violation",
		},
		{
			name: "v1.36 unsupported source format stays rejected",
			input: revisionReadinessInput{
				SourceFormat: "javascript",
				Runtime:      defaultRuntimeMetadata(),
				Validation:   validValidation,
				Metadata:     validMetadata,
				SourceHash:   sourceHash,
				SourceBytes:  sourceBytes,
			},
			state:    revisionReadinessInvalid,
			category: "unsupported_source_format",
		},
		{
			name: "v1.36 mismatched source and runtime language is incompatible",
			input: revisionReadinessInput{
				SourceFormat: "python",
				Runtime:      defaultRuntimeMetadata(),
				Validation:   validValidation,
				Metadata:     validMetadata,
				SourceHash:   sourceHash,
				SourceBytes:  sourceBytes,
			},
			state:    revisionReadinessInvalid,
			category: "incompatible_runtime_metadata",
		},
		{
			name: "v1.36 unavailable adapter is incompatible",
			input: revisionReadinessInput{
				SourceFormat: "typescript",
				Runtime: func() map[string]any {
					runtime := defaultRuntimeMetadata()
					runtime["adapter"] = map[string]any{"id": "runtime-unknown"}
					return runtime
				}(),
				Validation:  validValidation,
				Metadata:    validMetadata,
				SourceHash:  sourceHash,
				SourceBytes: sourceBytes,
			},
			state:    revisionReadinessInvalid,
			category: "incompatible_runtime_metadata",
		},
		{
			name: "D-11 TinyGo stays hidden unsupported provider",
			input: revisionReadinessInput{
				SourceFormat: "tinygo",
				Runtime:      wasmWasiRuntimeMetadata("tinygo"),
				Validation:   validValidation,
				Metadata:     validMetadata,
				SourceHash:   sourceHash,
				SourceBytes:  sourceBytes,
			},
			state:    revisionReadinessInvalid,
			category: "hidden_unsupported_provider",
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if test.input.EngineCompatibility == nil {
				test.input.EngineCompatibility = engineCompatibility()
			}
			result := classifyRevisionReadiness(test.input)
			if result.State != test.state || result.PublicCategory != test.category || result.EntryEligible != test.entryEligible {
				t.Fatalf("unexpected readiness result: %+v", result)
			}
			if result.State != revisionReadinessExecutionReady && result.CountedEligible {
				t.Fatalf("non-ready state must not be counted eligible: %+v", result)
			}
		})
	}
}

func TestProviderReadinessAcceptsCurrentCountedLanguages(t *testing.T) {
	t.Setenv("COWARDS_PROVIDER_VALIDATION_SECRET", "cowards-provider-validation-test-secret-v1.33")
	sourceHash := hashString("current provider proof")
	sourceBytes := len([]byte("current provider proof"))
	validation := map[string]any{"valid": true, "sourceHash": sourceHash, "sourceBytes": sourceBytes}

	tests := []struct {
		language string
		runtime  map[string]any
		metadata map[string]any
	}{
		{
			language: "typescript",
			runtime:  defaultRuntimeMetadata(),
			metadata: providerReadinessSourceArtifactMetadata(t, "typescript", "strategy-language-provider-js-ts", sourceHash, sourceBytes, true),
		},
		{
			language: "python",
			runtime:  pythonRuntimeMetadata(),
			metadata: providerReadinessSourceArtifactMetadata(t, "python", "strategy-language-provider-python", sourceHash, sourceBytes, true),
		},
		{
			language: "rust",
			runtime:  wasmWasiRuntimeMetadata("rust"),
			metadata: providerReadinessCompiledArtifactMetadata(t, "rust", sourceHash, sourceBytes),
		},
		{
			language: "zig",
			runtime:  wasmWasiRuntimeMetadata("zig"),
			metadata: providerReadinessCompiledArtifactMetadata(t, "zig", sourceHash, sourceBytes),
		},
	}

	for _, test := range tests {
		t.Run(test.language, func(t *testing.T) {
			result := classifyRevisionReadiness(revisionReadinessInput{
				SourceFormat:        test.language,
				Runtime:             test.runtime,
				Validation:          validation,
				Metadata:            test.metadata,
				EngineCompatibility: engineCompatibility(),
				SourceHash:          sourceHash,
				SourceBytes:         sourceBytes,
			})
			if result.State != revisionReadinessExecutionReady || result.PublicCategory != "provider_validated" || !result.EntryEligible || !result.CountedEligible {
				t.Fatalf("expected current %s evidence to be counted eligible, got %+v", test.language, result)
			}
		})
	}
}

func TestProviderReadinessAccountSaveAssemblyD02D03(t *testing.T) {
	t.Setenv("COWARDS_PROVIDER_VALIDATION_SECRET", "cowards-provider-validation-test-secret-v1.33")
	source := "export default { selectActivations() { return []; }, soldierBrain() { return { action: { type: \"TURN_TO_STONE\" }, soldierMemory: null }; } }"
	sourceHash := hashString(source)
	sourceBytes := len([]byte(source))
	metadata := providerReadinessSourceArtifactMetadata(t, "typescript", "strategy-language-provider-js-ts", sourceHash, sourceBytes, true)

	input, readiness := accountRevisionInsertFromProviderValidation("user:phase-244", strategyRevisionCreateBody{
		StrategyID:   "strategy:phase-244",
		Source:       source,
		SourceFormat: "typescript",
		Label:        "Proof backed",
		Notes:        "phase 244 deterministic substitute",
	}, &runtimeServiceValidationResponse{
		OK:                  true,
		Kind:                "strategyValidation",
		SourceFormat:        "typescript",
		Runtime:             defaultRuntimeMetadata(),
		Validation:          map[string]any{"valid": true, "sourceHash": sourceHash, "sourceBytes": sourceBytes},
		EngineCompatibility: engineCompatibility(),
		Metadata:            metadata,
		SourceHash:          sourceHash,
		SourceBytes:         sourceBytes,
	})

	if readiness.State != revisionReadinessExecutionReady || !readiness.EntryEligible || !readiness.CountedEligible {
		t.Fatalf("expected execution-ready account save assembly, got %+v", readiness)
	}
	if input.Runtime == nil || input.Validation == nil || input.EngineCompatibility == nil || input.Metadata == nil {
		t.Fatalf("save assembly omitted provider fields: %+v", input)
	}
	if input.SourceHash != sourceHash || input.SourceBytes != sourceBytes {
		t.Fatalf("save assembly omitted source identity")
	}
	if mapValue(input.Metadata, "sourceArtifact") == nil || mapValue(input.Metadata, "providerValidation") == nil {
		t.Fatalf("save assembly omitted artifact identity or provider validation: %+v", input.Metadata)
	}
	if input.Metadata["readinessState"] != string(revisionReadinessExecutionReady) ||
		input.Metadata["readinessCategory"] != "provider_validated" ||
		input.Metadata["entryEligible"] != true ||
		input.Metadata["countedEligible"] != true {
		t.Fatalf("save assembly omitted readiness labels: %+v", input.Metadata)
	}
}

func TestProviderReadinessRejectsMissingEngineEvidence(t *testing.T) {
	t.Setenv("COWARDS_PROVIDER_VALIDATION_SECRET", "cowards-provider-validation-test-secret-v1.33")
	source := "export default { selectActivations() { return []; }, soldierBrain() { return { action: { type: \"TURN_TO_STONE\" }, soldierMemory: null }; } }"
	sourceHash := hashString(source)
	sourceBytes := len([]byte(source))

	input, readiness := accountRevisionInsertFromProviderValidation("user:missing-engine", strategyRevisionCreateBody{
		Source:       source,
		SourceFormat: "typescript",
	}, &runtimeServiceValidationResponse{
		OK:          true,
		Runtime:     defaultRuntimeMetadata(),
		Validation:  map[string]any{"valid": true, "sourceHash": sourceHash, "sourceBytes": sourceBytes},
		Metadata:    providerReadinessSourceArtifactMetadata(t, "typescript", "strategy-language-provider-js-ts", sourceHash, sourceBytes, true),
		SourceHash:  sourceHash,
		SourceBytes: sourceBytes,
	})

	if input.EngineCompatibility != nil {
		t.Fatalf("missing runtime-service engine evidence must not be synthesized: %+v", input.EngineCompatibility)
	}
	if readiness.State != revisionReadinessInvalid || readiness.PublicCategory != "incompatible_runtime_metadata" || readiness.EntryEligible || readiness.CountedEligible {
		t.Fatalf("missing engine evidence must fail counted readiness: %+v", readiness)
	}
}

func TestRevisionReadinessProviderProofNeverPromotesWithoutCanonicalEvidence(t *testing.T) {
	t.Setenv("COWARDS_PROVIDER_VALIDATION_SECRET", "cowards-provider-validation-test-secret-v1.33")
	sourceHash := hashString("provider proof is not authority")
	sourceBytes := len([]byte("provider proof is not authority"))
	validation := map[string]any{"valid": true, "sourceHash": sourceHash, "sourceBytes": sourceBytes}
	tests := []struct {
		language string
		runtime  map[string]any
		metadata map[string]any
	}{
		{language: "typescript", runtime: defaultRuntimeMetadata(), metadata: providerReadinessSourceArtifactMetadata(t, "typescript", "strategy-language-provider-js-ts", sourceHash, sourceBytes, true)},
		{language: "python", runtime: pythonRuntimeMetadata(), metadata: providerReadinessSourceArtifactMetadata(t, "python", "strategy-language-provider-python", sourceHash, sourceBytes, true)},
		{language: "rust", runtime: wasmWasiRuntimeMetadata("rust"), metadata: providerReadinessCompiledArtifactMetadata(t, "rust", sourceHash, sourceBytes)},
		{language: "zig", runtime: wasmWasiRuntimeMetadata("zig"), metadata: providerReadinessCompiledArtifactMetadata(t, "zig", sourceHash, sourceBytes)},
	}
	for _, test := range tests {
		t.Run(test.language, func(t *testing.T) {
			result := classifyRevisionReadiness(revisionReadinessInput{
				SourceFormat:        test.language,
				Runtime:             test.runtime,
				Validation:          validation,
				Metadata:            test.metadata,
				EngineCompatibility: engineCompatibility(),
				SourceHash:          sourceHash,
				SourceBytes:         sourceBytes,
			})
			if result.State != revisionReadinessExecutionDisabled || result.PublicCategory != "containment_missing" || result.EntryEligible || result.CountedEligible {
				t.Fatalf("%s provider declaration promoted without canonical evidence: %+v", test.language, result)
			}
		})
	}
}

func providerReadinessSourceArtifactMetadata(t *testing.T, languageID string, providerID string, sourceHash string, sourceBytes int, includeBytes bool) map[string]any {
	t.Helper()
	artifactPayload := []byte(languageID + "-artifact")
	artifactDigest := sha256.Sum256(artifactPayload)
	artifactHash := hex.EncodeToString(artifactDigest[:])
	artifactBytes := len(artifactPayload)
	artifact := map[string]any{
		"format":           "transpiled-javascript",
		"hash":             artifactHash,
		"bytes":            artifactBytes,
		"sourceHash":       sourceHash,
		"sourceBytes":      sourceBytes,
		"abiVersion":       strategyRuntimeABIVersion,
		"validationStatus": "valid",
		"toolchain": map[string]any{
			"language": languageID,
		},
	}
	if languageID == "python" {
		artifact["format"] = "python-source-bundle"
	}
	if includeBytes {
		artifact["bytesBase64"] = base64.StdEncoding.EncodeToString(artifactPayload)
	}
	return map[string]any{
		"tags":           []string{languageID, "artifact-proven", "counted", "provider"},
		"sourceArtifact": artifact,
		"providerValidation": map[string]any{
			"providerId":      providerID,
			"contractVersion": "strategy-language-provider-contract-v1.33",
			"sourceHash":      sourceHash,
			"sourceBytes":     sourceBytes,
			"artifactHash":    artifactHash,
			"artifactBytes":   artifactBytes,
			"proof":           providerValidationProof(providerID, sourceHash, sourceBytes, artifactHash, artifactBytes),
		},
	}
}

func providerReadinessCompiledArtifactMetadata(t *testing.T, languageID string, sourceHash string, sourceBytes int) map[string]any {
	t.Helper()
	artifactPayload := []byte(languageID + "-wasm-artifact")
	artifactDigest := sha256.Sum256(artifactPayload)
	artifactHash := hex.EncodeToString(artifactDigest[:])
	artifactBytes := len(artifactPayload)
	providerID := "strategy-language-provider-rust-wasi"
	targetTriple := "wasm32-wasip1"
	if languageID == "zig" {
		providerID = "strategy-language-provider-zig-wasi"
		targetTriple = "wasm32-wasi"
	}
	return map[string]any{
		"compiledArtifact": map[string]any{
			"format":           "wasm",
			"hash":             artifactHash,
			"bytes":            artifactBytes,
			"bytesBase64":      base64.StdEncoding.EncodeToString(artifactPayload),
			"sourceHash":       sourceHash,
			"targetTriple":     targetTriple,
			"wasiProfile":      "preview1",
			"abiEnvelope":      "stdin-stdout-json",
			"abiVersion":       strategyRuntimeABIVersion,
			"validationStatus": "valid",
		},
		"providerValidation": map[string]any{
			"providerId":      providerID,
			"contractVersion": "strategy-language-provider-contract-v1.33",
			"sourceHash":      sourceHash,
			"sourceBytes":     sourceBytes,
			"artifactHash":    artifactHash,
			"artifactBytes":   artifactBytes,
			"proof":           providerValidationProof(providerID, sourceHash, sourceBytes, artifactHash, artifactBytes),
		},
	}
}
