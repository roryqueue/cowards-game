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
			name: "D-02 TypeScript provider proof without containment stays disabled",
			input: revisionReadinessInput{
				SourceFormat: "typescript",
				Runtime:      validRuntime,
				Validation:   validValidation,
				Metadata:     validMetadata,
				SourceHash:   sourceHash,
				SourceBytes:  sourceBytes,
			},
			state:    revisionReadinessExecutionDisabled,
			category: "containment_missing",
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
			state:    revisionReadinessExecutionDisabled,
			category: "containment_missing",
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
			state:    revisionReadinessExecutionDisabled,
			category: "containment_missing",
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
			state:    revisionReadinessExecutionDisabled,
			category: "containment_missing",
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
			state:    revisionReadinessExecutionDisabled,
			category: "containment_missing",
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

func TestProviderReadinessQuarantinesCurrentLanguagesWithoutCanonicalCertificates(t *testing.T) {
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
			if result.State != revisionReadinessExecutionDisabled || result.PublicCategory != "containment_missing" || result.EntryEligible || result.CountedEligible {
				t.Fatalf("expected current %s provider proof to remain quarantined, got %+v", test.language, result)
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

	if readiness.State != revisionReadinessExecutionDisabled || readiness.EntryEligible || readiness.CountedEligible {
		t.Fatalf("expected account save assembly to remain quarantined, got %+v", readiness)
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
	if input.Metadata["readinessState"] != string(revisionReadinessExecutionDisabled) ||
		input.Metadata["readinessCategory"] != "containment_missing" ||
		input.Metadata["entryEligible"] != false ||
		input.Metadata["countedEligible"] != false {
		t.Fatalf("save assembly omitted readiness labels: %+v", input.Metadata)
	}
}

func TestProviderReadinessRejectsMixedMissingAndStaleProofBeforePersistence(t *testing.T) {
	t.Setenv("COWARDS_PROVIDER_VALIDATION_SECRET", "cowards-provider-validation-test-secret-v1.33")
	source := "export default { selectActivations() { return []; }, soldierBrain() { return {}; } }"
	sourceHash := hashString(source)
	sourceBytes := len([]byte(source))

	tests := []struct {
		name   string
		mutate func(map[string]any)
	}{
		{
			name: "mixed provider contract",
			mutate: func(metadata map[string]any) {
				provider := mapValue(metadata, "providerValidation")
				if selectedStrategyRuntimeABIVersionForTest() == strategyRuntimeABIVersionV117 {
					provider["contractVersion"] = "strategy-language-provider-contract-v1.33"
				} else {
					provider["contractVersion"] = "runtime-provider-validation-v1.17"
				}
			},
		},
		{
			name: "missing proof",
			mutate: func(metadata map[string]any) {
				delete(mapValue(metadata, "providerValidation"), "proof")
			},
		},
		{
			name: "stale source binding",
			mutate: func(metadata map[string]any) {
				mapValue(metadata, "providerValidation")["sourceHash"] = sourceHash + ":stale"
			},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			metadata := providerReadinessSourceArtifactMetadata(t, "typescript", "strategy-language-provider-js-ts", sourceHash, sourceBytes, true)
			test.mutate(metadata)
			input, readiness := accountRevisionInsertFromProviderValidation("user:proof-rejection", strategyRevisionCreateBody{
				Source: source, SourceFormat: "typescript",
			}, &runtimeServiceValidationResponse{
				OK: true, Kind: "strategyValidation", SourceFormat: "typescript",
				Runtime: defaultRuntimeMetadata(), Validation: map[string]any{"valid": true, "sourceHash": sourceHash, "sourceBytes": sourceBytes},
				EngineCompatibility: engineCompatibility(), Metadata: metadata,
				SourceHash: sourceHash, SourceBytes: sourceBytes,
			})
			if readiness.State != revisionReadinessInvalid || readiness.PublicCategory != "incompatible_runtime_metadata" || readiness.EntryEligible || readiness.CountedEligible {
				t.Fatalf("invalid provider proof reached persistence admission: %+v", readiness)
			}
			if input.Metadata["readinessState"] != string(revisionReadinessInvalid) || input.Metadata["entryEligible"] != false || input.Metadata["countedEligible"] != false {
				t.Fatalf("invalid provider proof was not marked fail-closed: %+v", input.Metadata)
			}
		})
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
	runtimeABI := selectedStrategyRuntimeABIVersionForTest()
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
		"abiVersion":       runtimeABI,
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
	contractVersion, proof := providerReadinessValidationProof(runtimeABI, providerID, sourceHash, sourceBytes, artifactHash, artifactBytes)
	return map[string]any{
		"tags":           []string{languageID, "artifact-proven", "counted", "provider"},
		"sourceArtifact": artifact,
		"providerValidation": map[string]any{
			"providerId":      providerID,
			"contractVersion": contractVersion,
			"sourceHash":      sourceHash,
			"sourceBytes":     sourceBytes,
			"artifactHash":    artifactHash,
			"artifactBytes":   artifactBytes,
			"proof":           proof,
		},
	}
}

func providerReadinessCompiledArtifactMetadata(t *testing.T, languageID string, sourceHash string, sourceBytes int) map[string]any {
	t.Helper()
	return providerReadinessCompiledArtifactMetadataForABI(t, languageID, sourceHash, sourceBytes, selectedStrategyRuntimeABIVersionForTest())
}

func providerReadinessCompiledArtifactMetadataForABI(t *testing.T, languageID string, sourceHash string, sourceBytes int, runtimeABI string) map[string]any {
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
	abiEnvelope := "stdin-stdout-json"
	artifactSourceHash := sourceHash
	sourceIdentity := map[string]any(nil)
	if runtimeABI == strategyRuntimeABIVersionV117 {
		abiEnvelope = "stdin-canonical-request-stdout-raw-canonical-payload"
		artifactSourceHash = "sha256:" + hashString("normalized:"+sourceHash)
		sourceIdentity = map[string]any{"normalizedSourceSha256": artifactSourceHash}
	}
	contractVersion, proof := providerReadinessValidationProof(runtimeABI, providerID, sourceHash, sourceBytes, artifactHash, artifactBytes)
	return map[string]any{
		"compiledArtifact": map[string]any{
			"format":           "wasm",
			"hash":             artifactHash,
			"bytes":            artifactBytes,
			"bytesBase64":      base64.StdEncoding.EncodeToString(artifactPayload),
			"sourceHash":       artifactSourceHash,
			"targetTriple":     targetTriple,
			"wasiProfile":      "preview1",
			"abiEnvelope":      abiEnvelope,
			"abiVersion":       runtimeABI,
			"validationStatus": "valid",
			"sourceIdentity":   sourceIdentity,
		},
		"providerValidation": map[string]any{
			"providerId":      providerID,
			"contractVersion": contractVersion,
			"sourceHash":      sourceHash,
			"sourceBytes":     sourceBytes,
			"artifactHash":    artifactHash,
			"artifactBytes":   artifactBytes,
			"proof":           proof,
		},
	}
}

func providerReadinessV117ArtifactIdentityMetadata(t *testing.T, languageID string, source string) map[string]any {
	t.Helper()
	sourceIdentity := sourceIdentityMetadataV2(source)
	if languageID == "typescript" || languageID == "python" {
		artifactBytes := []byte(normalizeSourceV117(source))
		if languageID == "typescript" {
			artifactBytes = []byte("transpiled-typescript-v1.17-artifact")
		}
		return map[string]any{
			"sourceArtifact": map[string]any{
				"hash":           hashString(string(artifactBytes)),
				"bytes":          len(artifactBytes),
				"bytesBase64":    base64.StdEncoding.EncodeToString(artifactBytes),
				"sourceHash":     hashString(source),
				"sourceBytes":    len([]byte(source)),
				"sourceIdentity": sourceIdentity,
			},
		}
	}
	return map[string]any{
		"compiledArtifact": map[string]any{
			"sourceHash":     stringValue(sourceIdentity, "normalizedSourceSha256"),
			"sourceIdentity": sourceIdentity,
		},
	}
}

func providerReadinessV117ValidationResponse(t *testing.T, languageID string, source string) *runtimeServiceValidationResponse {
	t.Helper()
	sourceHash := hashString(source)
	sourceBytes := len([]byte(source))
	metadata := providerReadinessV117ArtifactIdentityMetadata(t, languageID, source)
	providerID := "strategy-language-provider-python"
	artifact := mapValue(metadata, "sourceArtifact")
	if languageID == "typescript" || languageID == "python" {
		format := "python-source-bundle"
		if languageID == "typescript" {
			providerID = "strategy-language-provider-js-ts"
			format = "transpiled-javascript"
		}
		artifact["format"] = format
		artifact["abiVersion"] = strategyRuntimeABIVersionV117
		artifact["validationStatus"] = "valid"
		artifact["publicEvidence"] = map[string]any{
			"label": languageID + " v1.17 source artifact", "nonCounted": false, "sandboxClaim": "provenance-only",
		}
		if languageID == "typescript" {
			artifact["toolchain"] = map[string]any{
				"language": "typescript", "runtime": "typescript-transpileModule", "runtimeVersion": "6.0.3",
				"commandSummary": "ts.transpileModule isolatedModules CommonJS ES2022", "validationPolicy": "runtime-js-validation-v1.17",
			}
		} else {
			artifact["toolchain"] = map[string]any{
				"language": "python", "runtime": "python3", "runtimeVersion": "3.9",
				"commandSummary": "python isolated validation host, no packages/imports", "validationPolicy": "python-source-validation-v1.17",
			}
		}
	} else {
		providerID = "strategy-language-provider-rust-wasi"
		targetTriple := "wasm32-wasip1"
		if languageID == "zig" {
			providerID = "strategy-language-provider-zig-wasi"
			targetTriple = "wasm32-wasi"
		}
		artifact = mapValue(metadata, "compiledArtifact")
		artifactBytes := []byte(languageID + "-v1.17-account-write-artifact")
		artifact["format"] = "wasm"
		artifact["hash"] = hashString(string(artifactBytes))
		artifact["bytes"] = len(artifactBytes)
		artifact["bytesBase64"] = base64.StdEncoding.EncodeToString(artifactBytes)
		artifact["targetTriple"] = targetTriple
		artifact["wasiProfile"] = "preview1"
		artifact["abiEnvelope"] = "stdin-canonical-request-stdout-raw-canonical-payload"
		artifact["abiVersion"] = strategyRuntimeABIVersionV117
		artifact["validationStatus"] = "valid"
		artifact["publicEvidence"] = map[string]any{
			"label": languageID + " v1.17 raw-payload candidate artifact", "nonCounted": true, "sandboxClaim": "candidate-readiness-only",
		}
		commandSummary := "rustc --target wasm32-wasip1 -O strategy.rs -o strategy.wasm"
		compiler := "rustc"
		if languageID == "zig" {
			compiler = "zig"
			commandSummary = "zig build-exe strategy.zig -target wasm32-wasi -O ReleaseSmall --cache-dir <temp> --global-cache-dir <temp> -femit-bin=strategy.wasm"
		}
		artifact["toolchain"] = map[string]any{
			"language": languageID, "compiler": compiler, "compilerVersion": "v1.17-test",
			"targetTriple": targetTriple, "commandSummary": commandSummary,
		}
	}
	contractVersion, proof := providerReadinessValidationProof(
		strategyRuntimeABIVersionV117, providerID, sourceHash, sourceBytes,
		stringValue(artifact, "hash"), intValue(artifact, "bytes"),
	)
	metadata["providerValidation"] = map[string]any{
		"providerId": providerID, "contractVersion": contractVersion,
		"sourceHash": sourceHash, "sourceBytes": sourceBytes,
		"artifactHash": stringValue(artifact, "hash"), "artifactBytes": intValue(artifact, "bytes"),
		"proof": proof,
	}
	runtime := runtimeMetadataForSourceFormat(languageID)
	runtime["abiVersion"] = strategyRuntimeABIVersionV117
	if languageID == "rust" || languageID == "zig" {
		mapValue(runtime, "adapter")["version"] = "v1.17-candidate"
	}
	if languageID == "python" {
		mapValue(runtime, "package")["entrypoint"] = "default"
	}
	if languageID == "typescript" {
		limits := mapValue(runtime, "limits")
		limits["environment"] = "empty"
		limits["filesystem"] = "none"
		limits["network"] = "disabled"
		limits["shell"] = "disabled"
		limits["packagePolicy"] = "none"
	}
	engine := engineCompatibility()
	return &runtimeServiceValidationResponse{
		OK: true, Kind: "strategyValidation", SourceFormat: languageID,
		Runtime: runtime,
		Validation: map[string]any{
			"valid": true, "errors": []any{}, "warnings": []any{},
			"sourceHash": sourceHash, "sourceBytes": sourceBytes, "forbiddenPatterns": []any{},
			"runtimeVersion":      stringValue(mapValue(runtime, "adapter"), "version"),
			"engineCompatibility": cloneMap(engine),
		},
		EngineCompatibility: engine, Metadata: metadata,
		SourceHash: sourceHash, SourceBytes: sourceBytes,
	}
}

func TestProviderArtifactSourceIdentityWriteBoundaryAcceptsV117LFAndCRLF(t *testing.T) {
	for _, languageID := range []string{"typescript", "python", "rust", "zig"} {
		for _, source := range []string{"print('ok')\n", "print('ok')\r\n"} {
			metadata := providerReadinessV117ArtifactIdentityMetadata(t, languageID, source)
			if !providerArtifactSourceIdentityMatchesWrite(source, languageID, strategyRuntimeABIVersionV117, metadata) {
				t.Fatalf("%s rejected exact v1.17 source identity for %q", languageID, source)
			}
		}
	}
}

func TestProviderArtifactSourceIdentityWriteBoundaryRejectsV117Substitutions(t *testing.T) {
	source := "print('ok')\r\n"
	tests := []struct {
		name       string
		languageID string
		mutate     func(map[string]any)
	}{
		{
			name: "missing identity", languageID: "python",
			mutate: func(metadata map[string]any) { delete(mapValue(metadata, "sourceArtifact"), "sourceIdentity") },
		},
		{
			name: "plain hash substitution", languageID: "python",
			mutate: func(metadata map[string]any) {
				mapValue(mapValue(metadata, "sourceArtifact"), "sourceIdentity")["originalSourceSha256"] = runtimeInvocationV117SHA256Value([]byte(source))
			},
		},
		{
			name: "cross domain substitution", languageID: "rust",
			mutate: func(metadata map[string]any) {
				mapValue(mapValue(metadata, "compiledArtifact"), "sourceIdentity")["normalizedSourceSha256"] = "sha256:" + framedSourceIdentityHash(originalSourceIdentityDomain, []byte(normalizeSourceV117(source)))
			},
		},
		{
			name: "byte count substitution", languageID: "zig",
			mutate: func(metadata map[string]any) {
				identity := mapValue(mapValue(metadata, "compiledArtifact"), "sourceIdentity")
				identity["normalizedSourceBytes"] = intValue(identity, "normalizedSourceBytes") + 1
			},
		},
		{
			name: "policy substitution", languageID: "python",
			mutate: func(metadata map[string]any) {
				mapValue(mapValue(metadata, "sourceArtifact"), "sourceIdentity")["normalizationPolicy"] = "source-line-endings-preserve-v0"
			},
		},
		{
			name: "python artifact bytes substitution", languageID: "python",
			mutate: func(metadata map[string]any) {
				artifact := mapValue(metadata, "sourceArtifact")
				artifact["bytesBase64"] = base64.StdEncoding.EncodeToString([]byte(source))
			},
		},
		{
			name: "compiled normalized identity substitution", languageID: "rust",
			mutate: func(metadata map[string]any) {
				mapValue(metadata, "compiledArtifact")["sourceHash"] = hashString(source)
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			metadata := providerReadinessV117ArtifactIdentityMetadata(t, test.languageID, source)
			test.mutate(metadata)
			if providerArtifactSourceIdentityMatchesWrite(source, test.languageID, strategyRuntimeABIVersionV117, metadata) {
				t.Fatal("v1.17 write boundary accepted substituted source identity")
			}
		})
	}
}

func TestAccountRevisionWriteHookRejectsV117ProviderSourceIdentityTampering(t *testing.T) {
	source := "print('ok')\r\n"
	artifactForLanguage := func(metadata map[string]any, languageID string) map[string]any {
		if languageID == "rust" || languageID == "zig" {
			return mapValue(metadata, "compiledArtifact")
		}
		return mapValue(metadata, "sourceArtifact")
	}
	for _, languageID := range []string{"typescript", "python", "rust", "zig"} {
		body := strategyRevisionCreateBody{Source: source, SourceFormat: languageID}
		_, baseline := accountRevisionInsertFromProviderValidationForSelectedABI(
			"user:v1.17-source-identity", body,
			providerReadinessV117ValidationResponse(t, languageID, source),
			strategyRuntimeABIVersionV117,
		)
		if baseline.State != revisionReadinessExecutionDisabled || baseline.PublicCategory != "containment_missing" {
			t.Fatalf("%s exact v1.17 write response did not reach containment gate: %+v", languageID, baseline)
		}
	}

	tests := []struct {
		name       string
		languageID string
		mutate     func(map[string]any)
	}{
		{name: "typescript missing identity", languageID: "typescript", mutate: func(artifact map[string]any) { delete(artifact, "sourceIdentity") }},
		{name: "python missing identity", languageID: "python", mutate: func(artifact map[string]any) { delete(artifact, "sourceIdentity") }},
		{name: "rust missing identity", languageID: "rust", mutate: func(artifact map[string]any) { delete(artifact, "sourceIdentity") }},
		{name: "zig missing identity", languageID: "zig", mutate: func(artifact map[string]any) { delete(artifact, "sourceIdentity") }},
		{name: "line ending count", languageID: "python", mutate: func(artifact map[string]any) {
			lineEndings := mapValue(mapValue(artifact, "sourceIdentity"), "lineEndings")
			lineEndings["crlf"] = intValue(lineEndings, "crlf") + 1
		}},
		{name: "line ending kind", languageID: "rust", mutate: func(artifact map[string]any) {
			mapValue(mapValue(artifact, "sourceIdentity"), "lineEndings")["kind"] = "lf"
		}},
		{name: "final newline", languageID: "zig", mutate: func(artifact map[string]any) {
			mapValue(artifact, "sourceIdentity")["hasFinalNewline"] = false
		}},
		{name: "typescript normalized identity", languageID: "typescript", mutate: func(artifact map[string]any) {
			mapValue(artifact, "sourceIdentity")["normalizedSourceSha256"] = runtimeInvocationV117SHA256Value([]byte(normalizeSourceV117(source)))
		}},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			validation := providerReadinessV117ValidationResponse(t, test.languageID, source)
			test.mutate(artifactForLanguage(validation.Metadata, test.languageID))
			_, readiness := accountRevisionInsertFromProviderValidationForSelectedABI(
				"user:v1.17-source-identity", strategyRevisionCreateBody{Source: source, SourceFormat: test.languageID},
				validation, strategyRuntimeABIVersionV117,
			)
			if readiness.State != revisionReadinessInvalid || readiness.PublicCategory != "incompatible_runtime_metadata" || readiness.EntryEligible || readiness.CountedEligible {
				t.Fatalf("actual account write hook accepted %s: %+v", test.name, readiness)
			}
		})
	}
}

func TestAccountRevisionWriteHookRejectsOuterFailureWithNestedSuccessEvidence(t *testing.T) {
	source := "print('ok')\r\n"
	validation := providerReadinessV117ValidationResponse(t, "python", source)
	validation.OK = false
	insert, readiness := accountRevisionInsertFromProviderValidationForSelectedABI(
		"user:v1.17-outer-failure", strategyRevisionCreateBody{Source: source, SourceFormat: "python"},
		validation, strategyRuntimeABIVersionV117,
	)
	_, sourceArtifactPersisted := insert.Metadata["sourceArtifact"]
	_, compiledArtifactPersisted := insert.Metadata["compiledArtifact"]
	if readiness.State != revisionReadinessNonExecutionDraft || readiness.PublicCategory != "invalid_strategy_revision" ||
		readiness.EntryEligible || readiness.CountedEligible ||
		validationStatus(insert.Validation) == "valid" || sourceArtifactPersisted || compiledArtifactPersisted || insert.EngineCompatibility != nil {
		t.Fatalf("outer provider failure copied nested success evidence into persistence: insert=%+v readiness=%+v", insert, readiness)
	}
}

func TestProviderProofRejectsNonCanonicalBase64(t *testing.T) {
	t.Setenv("COWARDS_PROVIDER_VALIDATION_SECRET", "cowards-provider-validation-test-secret-v1.33")
	sourceHash := hashString("noncanonical-base64")
	sourceBytes := len([]byte("noncanonical-base64"))
	sourceMetadata := providerReadinessSourceArtifactMetadata(t, "python", "strategy-language-provider-python", sourceHash, sourceBytes, true)
	mapValue(sourceMetadata, "sourceArtifact")["bytesBase64"] = stringValue(mapValue(sourceMetadata, "sourceArtifact"), "bytesBase64") + "\n"
	if pythonProviderValidationMatchesABI(sourceMetadata, sourceHash, sourceBytes, selectedStrategyRuntimeABIVersionForTest()) {
		t.Fatal("source provider proof accepted noncanonical base64")
	}
	compiledMetadata := providerReadinessCompiledArtifactMetadata(t, "rust", sourceHash, sourceBytes)
	mapValue(compiledMetadata, "compiledArtifact")["bytesBase64"] = stringValue(mapValue(compiledMetadata, "compiledArtifact"), "bytesBase64") + "\n"
	if rustProviderValidationMatchesABI(compiledMetadata, sourceHash, sourceBytes, "rust", selectedStrategyRuntimeABIVersionForTest()) {
		t.Fatal("compiled provider proof accepted noncanonical base64")
	}
}

func TestCompiledProviderValidationRejectsMixedABIEnvelopesBothDirections(t *testing.T) {
	t.Setenv("COWARDS_PROVIDER_VALIDATION_SECRET", "cowards-provider-validation-test-secret-v1.33")
	sourceHash := hashString("compiled-provider-envelope-binding")
	sourceBytes := len([]byte("compiled-provider-envelope-binding"))

	tests := []struct {
		name          string
		runtimeABI    string
		wrongEnvelope string
	}{
		{
			name:          "legacy proof with successor envelope",
			runtimeABI:    strategyRuntimeABIVersion,
			wrongEnvelope: "stdin-canonical-request-stdout-raw-canonical-payload",
		},
		{
			name:          "successor proof with legacy envelope",
			runtimeABI:    strategyRuntimeABIVersionV117,
			wrongEnvelope: "stdin-stdout-json",
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			metadata := providerReadinessCompiledArtifactMetadataForABI(t, "rust", sourceHash, sourceBytes, test.runtimeABI)
			if !rustProviderValidationMatchesABI(metadata, sourceHash, sourceBytes, "rust", test.runtimeABI) {
				t.Fatalf("matching %s compiled provider evidence was rejected", test.runtimeABI)
			}
			mapValue(metadata, "compiledArtifact")["abiEnvelope"] = test.wrongEnvelope
			if rustProviderValidationMatchesABI(metadata, sourceHash, sourceBytes, "rust", test.runtimeABI) {
				t.Fatalf("%s accepted mixed ABI envelope %q", test.runtimeABI, test.wrongEnvelope)
			}
		})
	}
}

func providerReadinessValidationProof(runtimeABI string, providerID string, sourceHash string, sourceBytes int, artifactHash string, artifactBytes int) (string, string) {
	switch runtimeABI {
	case strategyRuntimeABIVersion:
		return "strategy-language-provider-contract-v1.33", providerValidationProof(providerID, sourceHash, sourceBytes, artifactHash, artifactBytes)
	case strategyRuntimeABIVersionV117:
		contractVersion := "runtime-provider-validation-v1.17"
		return contractVersion, providerValidationProofV117(providerID, contractVersion, sourceHash, sourceBytes, artifactHash, artifactBytes)
	default:
		return "", ""
	}
}
