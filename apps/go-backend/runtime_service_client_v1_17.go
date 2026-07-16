package main

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"io"
	"net/http"
	"regexp"
	"strings"
)

const runtimeExecutionServiceVersionV117 = "runtime-execution-service-v1.17"
const strategyRuntimeABIVersionV117 = "strategy-runtime-abi-v1.17"
const canonicalJSONVersionV11 = "canonical-json-v1.1"
const runtimeServiceV117BudgetProfileSHA256 = "sha256:13c061efc6954b7734b967177f07300b4c3c0dd18651b55510158b9a3c29c49f"
const runtimeServiceV117EmptyLedgerRoot = "sha256:2ca3c0a9b5cd9ce685dfccf846334e4980931ea85d11852290952ae4f6fb8e6b"

// selectedRuntimeServiceContractVersion is the single Go-side activation
// pointer. Plan 258-14 prepares both clients while keeping production on v1.16;
// the activation commit changes only this return value and the route selector.
func selectedRuntimeServiceContractVersion() string {
	return runtimeExecutionServiceVersion
}

// selectedStrategyRuntimeABIVersion derives ABI ownership from the same
// indivisible service pointer used by orchestration and routing.
func selectedStrategyRuntimeABIVersion() string {
	switch selectedRuntimeServiceContractVersion() {
	case runtimeExecutionServiceVersion:
		return strategyRuntimeABIVersion
	case runtimeExecutionServiceVersionV117:
		return strategyRuntimeABIVersionV117
	default:
		return ""
	}
}

type runtimeServiceRequestV117 struct {
	ContractVersion      string                      `json:"contractVersion"`
	Kind                 string                      `json:"kind"`
	RequestID            string                      `json:"requestId"`
	MatchID              string                      `json:"matchId"`
	CompatibilityTupleID string                      `json:"compatibilityTupleId"`
	Authority            runtimeServiceAuthorityV117 `json:"authority"`
	LegacyAuthority      runtimeServiceAuthorityV117 `json:"legacyAuthority"`
	Entrants             struct {
		Bottom runtimeServiceEntrantV117 `json:"bottom"`
		Top    runtimeServiceEntrantV117 `json:"top"`
	} `json:"entrants"`
	Accounting struct {
		BudgetProfileSHA256 string `json:"budgetProfileSha256"`
		LedgerPrestateRoot  string `json:"ledgerPrestateRoot"`
	} `json:"accounting"`
	Match json.RawMessage `json:"match"`
}

type runtimeServiceAuthorityV117 struct {
	BundleHash         string `json:"bundleHash"`
	SourceManifestHash string `json:"sourceManifestHash"`
	RegistryGeneration string `json:"registryGeneration"`
}

type runtimeServiceSourceIdentityV117 struct {
	OriginalSourceSHA256   string `json:"originalSourceSha256"`
	NormalizedSourceSHA256 string `json:"normalizedSourceSha256"`
	ArtifactSHA256         string `json:"artifactSha256"`
}

type runtimeServiceExactPinsV117 [10][2]string

type runtimeServiceEntrantV117 struct {
	StrategyRevisionID   string                           `json:"strategyRevisionId"`
	LaneIdentityHash     string                           `json:"laneIdentityHash"`
	SourceIdentity       runtimeServiceSourceIdentityV117 `json:"sourceIdentity"`
	IdentityManifestRoot string                           `json:"identityManifestRoot"`
	EvidenceGraphRoot    string                           `json:"evidenceGraphRoot"`
	ExactPins            runtimeServiceExactPinsV117      `json:"exactPins"`
}

type runtimeServiceSuccessResultV117 struct {
	Privacy                    string                     `json:"privacy"`
	Chronicle                  json.RawMessage            `json:"chronicle"`
	FinalState                 json.RawMessage            `json:"finalState"`
	Outcome                    json.RawMessage            `json:"outcome"`
	LedgerPoststateRoot        string                     `json:"ledgerPoststateRoot"`
	RuntimeViolationEventCount int                        `json:"runtimeViolationEventCount"`
	SemanticReceipt            runtimeSemanticReceiptV117 `json:"semanticReceipt"`
}

type runtimeServiceResponseV117 struct {
	ContractVersion string                           `json:"contractVersion"`
	OK              bool                             `json:"ok"`
	Kind            string                           `json:"kind"`
	RequestID       string                           `json:"requestId"`
	MatchID         string                           `json:"matchId"`
	Result          *runtimeServiceSuccessResultV117 `json:"result,omitempty"`
	SystemFailure   *runtimeServiceFailure           `json:"systemFailure,omitempty"`
}

type runtimeServiceClientV117 struct {
	endpoint              string
	httpClient            *http.Client
	maxResponseBytes      int64
	privateArtifactToken  string
	semanticReceiptSecret string
}

type runtimeServiceValidationProviderV117 struct {
	ID                string `json:"id"`
	ContractVersion   string `json:"contractVersion"`
	RuntimeABIVersion string `json:"runtimeAbiVersion"`
	ABIPosture        string `json:"abiPosture"`
}

type runtimeServiceValidationWireResponseV117 struct {
	OK                  bool                                  `json:"ok"`
	Kind                string                                `json:"kind"`
	SourceFormat        string                                `json:"sourceFormat"`
	Provider            *runtimeServiceValidationProviderV117 `json:"provider,omitempty"`
	Runtime             map[string]any                        `json:"runtime,omitempty"`
	Validation          map[string]any                        `json:"validation,omitempty"`
	EngineCompatibility map[string]any                        `json:"engineCompatibility,omitempty"`
	Metadata            map[string]any                        `json:"metadata,omitempty"`
	SourceHash          string                                `json:"sourceHash,omitempty"`
	SourceBytes         int                                   `json:"sourceBytes,omitempty"`
	Error               string                                `json:"error,omitempty"`
}

func newRuntimeServiceClientV117(endpoint string) *runtimeServiceClientV117 {
	legacy := newRuntimeServiceClient(endpoint)
	return &runtimeServiceClientV117{
		endpoint:              strings.TrimRight(endpoint, "/"),
		httpClient:            legacy.httpClient,
		maxResponseBytes:      legacy.maxResponseBytes,
		privateArtifactToken:  legacy.privateArtifactToken,
		semanticReceiptSecret: legacy.semanticReceiptSecret,
	}
}

func expectedRuntimeServiceValidationProviderIDV117(sourceFormat string) string {
	switch sourceFormat {
	case "typescript":
		return "strategy-language-provider-js-ts"
	case "python":
		return "strategy-language-provider-python"
	case "rust":
		return "strategy-language-provider-rust-wasi"
	case "zig":
		return "strategy-language-provider-zig-wasi"
	default:
		return ""
	}
}

func expectedRuntimeServiceValidationABIPostureV117(sourceFormat string) string {
	switch sourceFormat {
	case "typescript":
		return "runtime-js-source-artifact"
	case "python":
		return "python-source-provenance-json"
	case "rust", "zig":
		return "wasi-preview1-stdin-canonical-request-stdout-raw-canonical-payload"
	default:
		return ""
	}
}

func validRuntimeServiceValidationArtifactAuthorityV117(sourceFormat string, runtime map[string]any, metadata map[string]any) bool {
	language := mapValue(runtime, "language")
	adapter := mapValue(runtime, "adapter")
	artifactKey := "sourceArtifact"
	expectedLanguageVersion := ""
	expectedAdapterID := ""
	expectedAdapterVersion := ""
	expectedToolchain := map[string]string{}
	switch sourceFormat {
	case "typescript":
		expectedLanguageVersion = "0.1.0"
		expectedAdapterID = "runtime-js-worker-thread"
		expectedAdapterVersion = "0.1.0"
		expectedToolchain = map[string]string{
			"language": "typescript", "runtime": "typescript-transpileModule", "runtimeVersion": "6.0.3",
			"commandSummary": "ts.transpileModule isolatedModules CommonJS ES2022", "validationPolicy": "runtime-js-validation-v1.17",
		}
	case "python":
		expectedLanguageVersion = "3.9"
		expectedAdapterID = "runtime-python-subprocess-experimental"
		expectedAdapterVersion = "0.1.0-experimental"
		expectedToolchain = map[string]string{
			"language": "python", "runtime": "python3", "runtimeVersion": "3.9",
			"commandSummary": "python isolated validation host, no packages/imports", "validationPolicy": "python-source-validation-v1.17",
		}
	case "rust":
		artifactKey = "compiledArtifact"
		expectedLanguageVersion = "1.95.0-wasm32-wasip1"
		expectedAdapterID = "runtime-wasm-wasi-wasmtime-preview1"
		expectedAdapterVersion = "v1.17-candidate"
		expectedToolchain = map[string]string{
			"language": "rust", "compiler": "rustc", "targetTriple": "wasm32-wasip1",
			"commandSummary": "rustc --target wasm32-wasip1 -O strategy.rs -o strategy.wasm",
		}
	case "zig":
		artifactKey = "compiledArtifact"
		expectedLanguageVersion = "0.16.0-wasm32-wasi"
		expectedAdapterID = "runtime-wasm-wasi-wasmtime-preview1"
		expectedAdapterVersion = "v1.17-candidate"
		expectedToolchain = map[string]string{
			"language": "zig", "compiler": "zig", "targetTriple": "wasm32-wasi",
			"commandSummary": "zig build-exe strategy.zig -target wasm32-wasi -O ReleaseSmall --cache-dir <temp> --global-cache-dir <temp> -femit-bin=strategy.wasm",
		}
	default:
		return false
	}
	if stringValue(language, "id") != sourceFormat || stringValue(language, "version") != expectedLanguageVersion ||
		stringValue(adapter, "id") != expectedAdapterID || stringValue(adapter, "version") != expectedAdapterVersion {
		return false
	}
	artifact := mapValue(metadata, artifactKey)
	toolchain := mapValue(artifact, "toolchain")
	publicEvidence := mapValue(artifact, "publicEvidence")
	if artifactKey == "sourceArtifact" {
		if !runtimeInvocationV117ExactKeys(toolchain, "language", "runtime", "runtimeVersion", "commandSummary", "validationPolicy") ||
			!runtimeInvocationV117ExactKeys(publicEvidence, "label", "nonCounted", "sandboxClaim") ||
			strings.TrimSpace(stringValue(publicEvidence, "label")) == "" || boolValue(publicEvidence, "nonCounted") ||
			stringValue(publicEvidence, "sandboxClaim") != "provenance-only" {
			return false
		}
	} else {
		if !runtimeInvocationV117ExactKeys(toolchain, "language", "compiler", "compilerVersion", "targetTriple", "commandSummary") ||
			strings.TrimSpace(stringValue(toolchain, "compilerVersion")) == "" ||
			!runtimeInvocationV117ExactKeys(publicEvidence, "label", "nonCounted", "sandboxClaim") ||
			strings.TrimSpace(stringValue(publicEvidence, "label")) == "" || !boolValue(publicEvidence, "nonCounted") ||
			stringValue(publicEvidence, "sandboxClaim") != "candidate-readiness-only" {
			return false
		}
	}
	for key, expected := range expectedToolchain {
		if stringValue(toolchain, key) != expected {
			return false
		}
	}
	return true
}

func (client *runtimeServiceClientV117) validateStrategy(
	ctx context.Context,
	sourceFormat string,
	source string,
	strategyID string,
) (*runtimeServiceValidationResponse, *runtimeServiceFailure) {
	expectedProviderID := expectedRuntimeServiceValidationProviderIDV117(sourceFormat)
	if client == nil || expectedProviderID == "" {
		return nil, newRuntimeServiceFailure("RuntimeServiceContractMismatch", "Runtime service v1.17 validation source format is not registered", false, nil)
	}
	requestBody := map[string]any{
		"sourceFormat": sourceFormat, "source": source, "includePrivateArtifact": true,
	}
	if strings.TrimSpace(strategyID) != "" {
		requestBody["strategyId"] = strategyID
	}
	body, err := json.Marshal(requestBody)
	if err != nil {
		return nil, newRuntimeServiceFailure("RuntimeServiceRequestEncode", "Runtime service v1.17 validation request could not be encoded", false, nil)
	}
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, client.endpoint+"/validate-strategy", bytes.NewReader(body))
	if err != nil {
		return nil, newRuntimeServiceFailure("RuntimeServiceRequestCreate", "Runtime service v1.17 validation request could not be created", false, nil)
	}
	request.Header.Set("content-type", "application/json")
	if token := strings.TrimSpace(client.privateArtifactToken); token != "" {
		request.Header.Set(runtimeServicePrivateArtifactTokenHeader, token)
	}
	httpClient := client.httpClient
	if httpClient == nil {
		httpClient = http.DefaultClient
	}
	response, err := httpClient.Do(request)
	if err != nil {
		return nil, newRuntimeServiceFailure("RuntimeServiceTransport", "Runtime execution service v1.17 validation is unavailable", true, nil)
	}
	defer response.Body.Close()
	maxBytes := client.maxResponseBytes
	if maxBytes <= 0 {
		maxBytes = defaultRuntimeServiceResponseBytes
	}
	payload, err := io.ReadAll(io.LimitReader(response.Body, maxBytes+1))
	if err != nil {
		return nil, newRuntimeServiceFailure("RuntimeServiceRead", "Runtime service v1.17 validation response could not be read", true, nil)
	}
	if int64(len(payload)) > maxBytes {
		return nil, newRuntimeServiceFailure("RuntimeServiceOversizedResponse", "Runtime service v1.17 validation response exceeded the configured byte limit", true, nil)
	}
	if response.StatusCode == http.StatusForbidden {
		return nil, newRuntimeServiceFailure("RuntimeServicePrivateArtifactUnauthorized", "Runtime service v1.17 private validation evidence is not authorized", false, nil)
	}
	var wire runtimeServiceValidationWireResponseV117
	if err := decodeStrictJSONUseNumber(payload, &wire); err != nil {
		return nil, newRuntimeServiceFailure("RuntimeServiceMalformedResponse", "Runtime service v1.17 validation response was malformed", true, nil)
	}
	decoded := &runtimeServiceValidationResponse{
		OK: wire.OK, Kind: wire.Kind, SourceFormat: wire.SourceFormat,
		Runtime: wire.Runtime, Validation: wire.Validation, EngineCompatibility: wire.EngineCompatibility,
		Metadata: wire.Metadata, SourceHash: wire.SourceHash, SourceBytes: wire.SourceBytes, Error: wire.Error,
	}
	if wire.Kind != "strategyValidation" || wire.SourceFormat != sourceFormat {
		return nil, newRuntimeServiceFailure("RuntimeServiceContractMismatch", "Runtime service v1.17 validation response binding mismatch", true, nil)
	}
	if !wire.OK {
		validationValid, validationHasValid := wire.Validation["valid"].(bool)
		if response.StatusCode != http.StatusUnprocessableEntity || wire.Provider != nil || wire.Runtime != nil ||
			wire.EngineCompatibility != nil || wire.Metadata != nil || wire.SourceHash != "" || wire.SourceBytes != 0 ||
			(wire.Validation != nil && (!validationHasValid || validationValid)) {
			return nil, newRuntimeServiceFailure("RuntimeServiceContractMismatch", "Runtime service v1.17 validation failure carried contradictory success authority", true, nil)
		}
		return decoded, nil
	}
	if response.StatusCode != http.StatusOK {
		return nil, newRuntimeServiceFailure("RuntimeServiceContractMismatch", "Runtime service v1.17 validation success used a non-success HTTP status", true, nil)
	}
	rawSourceHash := hashStrategySourceForGo(source)
	rawSourceBytes := len([]byte(source))
	providerValidation := mapValue(wire.Metadata, "providerValidation")
	if wire.Error != "" || wire.Provider == nil || wire.Provider.ID != expectedProviderID ||
		wire.Provider.ContractVersion != "runtime-provider-validation-v1.17" ||
		wire.Provider.RuntimeABIVersion != strategyRuntimeABIVersionV117 ||
		wire.Provider.ABIPosture != expectedRuntimeServiceValidationABIPostureV117(sourceFormat) ||
		wire.SourceHash != rawSourceHash || wire.SourceBytes != rawSourceBytes ||
		stringValue(wire.Runtime, "abiVersion") != strategyRuntimeABIVersionV117 ||
		stringValue(mapValue(wire.Runtime, "language"), "id") != sourceFormat ||
		stringValue(providerValidation, "providerId") != expectedProviderID ||
		stringValue(providerValidation, "contractVersion") != wire.Provider.ContractVersion ||
		!validSuccessorStrategyRevisionV117(rawSourceHash, rawSourceBytes, wire.Runtime, wire.EngineCompatibility, wire.Validation, wire.Metadata) ||
		!validRuntimeServiceValidationArtifactAuthorityV117(sourceFormat, wire.Runtime, wire.Metadata) ||
		!providerArtifactSourceIdentityMatchesWrite(source, sourceFormat, strategyRuntimeABIVersionV117, wire.Metadata) ||
		!providerProofMatches(wire.Metadata, rawSourceHash, rawSourceBytes, sourceFormat, strategyRuntimeABIVersionV117) {
		return nil, newRuntimeServiceFailure("RuntimeServiceContractMismatch", "Runtime service v1.17 validation evidence did not match the selected runtime authority", true, nil)
	}
	return decoded, nil
}

func (client *runtimeServiceClientV117) executeMatch(
	ctx context.Context,
	request runtimeServiceRequestV117,
) (*runtimeServiceResponseV117, *runtimeServiceFailure) {
	if failure := validateRuntimeServiceRequestV117(request); failure != nil {
		return nil, failure
	}
	payload, err := encodeRuntimeServiceRequestV117(request)
	if err != nil {
		return nil, newRuntimeServiceFailure("RuntimeServiceContractMismatch", "Runtime service v1.17 request is invalid", false, nil)
	}
	httpRequest, err := http.NewRequestWithContext(ctx, http.MethodPost, client.endpoint+"/execute-match", bytes.NewReader(payload))
	if err != nil {
		return nil, newRuntimeServiceFailure("RuntimeServiceUnavailable", "Runtime service v1.17 request could not be created", true, nil)
	}
	httpRequest.Header.Set("content-type", "application/json")
	if client.privateArtifactToken != "" {
		httpRequest.Header.Set(runtimeServicePrivateArtifactTokenHeader, client.privateArtifactToken)
	}
	httpResponse, err := client.httpClient.Do(httpRequest)
	if err != nil {
		return nil, newRuntimeServiceFailure("RuntimeServiceUnavailable", "Runtime service v1.17 request failed", true, nil)
	}
	defer httpResponse.Body.Close()
	limited := io.LimitReader(httpResponse.Body, client.maxResponseBytes+1)
	responseBytes, err := io.ReadAll(limited)
	if err != nil || int64(len(responseBytes)) > client.maxResponseBytes {
		return nil, newRuntimeServiceFailure("RuntimeServiceMalformedResponse", "Runtime service v1.17 response was unavailable", true, nil)
	}
	return decodeRuntimeServiceResponseV117(request, responseBytes, client.semanticReceiptSecret)
}

func encodeRuntimeServiceRequestV117(request runtimeServiceRequestV117) ([]byte, error) {
	return runtimeInvocationV117CanonicalValue(request)
}

func validateRuntimeServiceRequestV117(request runtimeServiceRequestV117) *runtimeServiceFailure {
	if request.ContractVersion != runtimeExecutionServiceVersionV117 ||
		request.Kind != "executeMatch" || request.RequestID == "" || request.MatchID == "" ||
		!isPrefixedLowerSHA256(request.CompatibilityTupleID) ||
		!isPrefixedLowerSHA256(request.Authority.BundleHash) ||
		!isPrefixedLowerSHA256(request.Authority.SourceManifestHash) ||
		!validCanonicalGeneration(request.Authority.RegistryGeneration) ||
		!isPrefixedLowerSHA256(request.LegacyAuthority.BundleHash) ||
		!isPrefixedLowerSHA256(request.LegacyAuthority.SourceManifestHash) ||
		!validCanonicalGeneration(request.LegacyAuthority.RegistryGeneration) ||
		request.Authority.BundleHash == request.LegacyAuthority.BundleHash ||
		!validRuntimeServiceEntrantV117(request.Entrants.Bottom) ||
		!validRuntimeServiceEntrantV117(request.Entrants.Top) ||
		!isPrefixedLowerSHA256(request.Accounting.BudgetProfileSHA256) ||
		!isPrefixedLowerSHA256(request.Accounting.LedgerPrestateRoot) || len(request.Match) == 0 {
		return newRuntimeServiceFailure("RuntimeServiceContractMismatch", "Runtime service v1.17 request contract is not supported", false, nil)
	}
	return nil
}

var runtimeServiceExactPinNamesV117 = [10]string{
	"runtimeExecutableDigest",
	"reportedVersion",
	"targetAbi",
	"compilerFlags",
	"adapterBuildDigest",
	"standardLibraryOrSysrootDigest",
	"containmentPolicyId",
	"budgetProfileSha256",
	"canonicalJsonProfileId",
	"behaviorSettingsHash",
}

var runtimeServiceFloatingPinV117 = regexp.MustCompile(`(?i)(?:^|[-_.:])(latest|current|default|any|stable|head)(?:$|[-_.:])|[*^~<>]`)

var runtimeServiceHashPinIndexesV117 = map[int]bool{0: true, 3: true, 4: true, 5: true, 7: true, 9: true}

func validRuntimeServiceExactPinsV117(pins runtimeServiceExactPinsV117) bool {
	for index, pin := range pins {
		if pin[0] != runtimeServiceExactPinNamesV117[index] || !validRuntimeSemanticReceiptV117Identifier(pin[1]) ||
			runtimeServiceFloatingPinV117.MatchString(pin[1]) || (runtimeServiceHashPinIndexesV117[index] && !isPrefixedLowerSHA256(pin[1])) {
			return false
		}
	}
	return true
}

func validRuntimeServiceEntrantV117(entrant runtimeServiceEntrantV117) bool {
	return validRuntimeSemanticReceiptV117Identifier(entrant.StrategyRevisionID) &&
		isPrefixedLowerSHA256(entrant.LaneIdentityHash) &&
		isPrefixedLowerSHA256(entrant.SourceIdentity.OriginalSourceSHA256) &&
		isPrefixedLowerSHA256(entrant.SourceIdentity.NormalizedSourceSHA256) &&
		isPrefixedLowerSHA256(entrant.SourceIdentity.ArtifactSHA256) &&
		isPrefixedLowerSHA256(entrant.IdentityManifestRoot) &&
		isPrefixedLowerSHA256(entrant.EvidenceGraphRoot) &&
		validRuntimeServiceExactPinsV117(entrant.ExactPins)
}

func hashRuntimeServiceExactPinsV117(pins runtimeServiceExactPinsV117) (string, error) {
	encoded, err := runtimeInvocationV117CanonicalValue(pins)
	if err != nil {
		return "", err
	}
	return runtimeInvocationV117SHA256Value(encoded), nil
}

func runtimeServiceSourceIdentityFromPersistedRevisionV117(strategy runtimeServiceStrategyRevision, evidence goEntrantExecutionEvidence) (runtimeServiceSourceIdentityV117, bool) {
	if strategy.LockedAt == nil || strategy.ID != evidence.StrategyRevisionID ||
		strategy.SourceBytes != len([]byte(strategy.Source)) || strategy.SourceHash != hashString(strategy.Source) {
		return runtimeServiceSourceIdentityV117{}, false
	}
	var artifact map[string]any
	for _, key := range []string{"sourceArtifact", "compiledArtifact"} {
		candidate := mapValue(strategy.Metadata, key)
		if stringValue(candidate, "hash") == evidence.LaneIdentity.ArtifactSHA256 {
			if artifact != nil {
				return runtimeServiceSourceIdentityV117{}, false
			}
			artifact = candidate
		}
	}
	encodedArtifact := stringValue(artifact, "bytesBase64")
	artifactBytes, err := base64.StdEncoding.Strict().DecodeString(encodedArtifact)
	if err != nil || len(artifactBytes) == 0 || runtimeInvocationV117SHA256Value(artifactBytes) != "sha256:"+evidence.LaneIdentity.ArtifactSHA256 {
		return runtimeServiceSourceIdentityV117{}, false
	}
	originalBytes := []byte(strategy.Source)
	normalizedBytes := []byte(normalizeSourceV117(strategy.Source))
	identity := runtimeServiceSourceIdentityV117{
		OriginalSourceSHA256:   runtimeInvocationV117SHA256Value(originalBytes),
		NormalizedSourceSHA256: runtimeInvocationV117SHA256Value(normalizedBytes),
		ArtifactSHA256:         runtimeInvocationV117SHA256Value(artifactBytes),
	}
	declaredValue, exists := artifact["sourceIdentity"]
	languageID := stringValue(mapValue(strategy.Runtime, "language"), "id")
	requiresDeclaredIdentity := stringValue(strategy.Runtime, "abiVersion") == strategyRuntimeABIVersionV117 &&
		(languageID == "typescript" || languageID == "python" || languageID == "rust" || languageID == "zig")
	if requiresDeclaredIdentity && !exists {
		return runtimeServiceSourceIdentityV117{}, false
	}
	if exists {
		if !sourceIdentityMetadataV2MatchesSource(declaredValue, strategy.Source) {
			return runtimeServiceSourceIdentityV117{}, false
		}
	}
	return identity, true
}

func projectRuntimeServiceEntrantV117(strategy runtimeServiceStrategyRevision, evidence goEntrantExecutionEvidence, claimed claimedRuntimeServiceEntrantV117, registry *goDeploymentLaneRegistry) (runtimeServiceEntrantV117, bool) {
	template, ok := registry.successorIdentityTemplateForRevision(strategy)
	if !ok || template.ExactPins != claimed.ExactPins {
		return runtimeServiceEntrantV117{}, false
	}
	identityManifestRoot, sourceIdentity, ok := composeRuntimeSuccessorIdentityV117(strategy, evidence, template)
	if !ok || identityManifestRoot != claimed.IdentityManifestRoot || claimed.StrategyRevisionID != strategy.ID ||
		claimed.LaneIdentityHash != "sha256:"+hashCreationLaneIdentity(evidence.LaneIdentity) {
		return runtimeServiceEntrantV117{}, false
	}
	return runtimeServiceEntrantV117{
		StrategyRevisionID:   claimed.StrategyRevisionID,
		LaneIdentityHash:     claimed.LaneIdentityHash,
		SourceIdentity:       sourceIdentity,
		IdentityManifestRoot: claimed.IdentityManifestRoot,
		EvidenceGraphRoot:    claimed.EvidenceGraphRoot,
		ExactPins:            claimed.ExactPins,
	}, true
}

func decodeRuntimeServiceResponseV117(
	request runtimeServiceRequestV117,
	payload []byte,
	secret string,
) (*runtimeServiceResponseV117, *runtimeServiceFailure) {
	canonical := decodeCanonicalJSONV11(payload, canonicalJSONV11Options{
		Context:          canonicalJSONV11AuthenticatedOuterEnvelope,
		RequireCanonical: true,
	})
	if canonical.Error != nil {
		return nil, newRuntimeServiceFailure("RuntimeServiceMalformedResponse", "Runtime service v1.17 response was malformed", true, nil)
	}
	var response runtimeServiceResponseV117
	if err := decodeStrictJSONUseNumber(canonical.CanonicalBytes, &response); err != nil {
		return nil, newRuntimeServiceFailure("RuntimeServiceMalformedResponse", "Runtime service v1.17 response was malformed", true, nil)
	}
	if response.ContractVersion != runtimeExecutionServiceVersionV117 || response.RequestID != request.RequestID {
		return nil, newRuntimeServiceFailure("RuntimeServiceContractMismatch", "Runtime service v1.17 response binding mismatch", true, nil)
	}
	if !response.OK {
		failure := response.SystemFailure
		if response.Kind != "systemFailure" || response.Result != nil || failure == nil ||
			(response.MatchID != "" && response.MatchID != request.MatchID) ||
			failure.Classification != "system_failure" ||
			(failure.Ownership != "runtime_system" && failure.Ownership != "system_integrity" && failure.Ownership != "system_operation") ||
			!runtimeInvocationV117SafeCode.MatchString(failure.Code) ||
			failure.PlayerPenalty || failure.PublicMessage == "" || len([]byte(failure.PublicMessage)) > 256 {
			return nil, newRuntimeServiceFailure("RuntimeServiceMalformedResponse", "Runtime service v1.17 failure response was malformed", true, nil)
		}
		return nil, &runtimeServiceFailure{
			Classification: failure.Classification,
			Ownership:      failure.Ownership,
			Code:           failure.Code,
			ErrorClass:     failure.Code,
			ErrorMessage:   failure.PublicMessage,
			PublicMessage:  failure.PublicMessage,
			Retryable:      failure.Retryable,
			PlayerPenalty:  false,
			Details:        map[string]any{},
		}
	}
	if response.Kind != "executionResult" || response.MatchID != request.MatchID || response.Result == nil || response.SystemFailure != nil {
		return nil, newRuntimeServiceFailure("RuntimeServiceMalformedResponse", "Runtime service v1.17 success response was malformed", true, nil)
	}
	result := response.Result
	requestBytes, requestErr := encodeRuntimeServiceRequestV117(request)
	bottomExactPinsHash, bottomExactPinsErr := hashRuntimeServiceExactPinsV117(request.Entrants.Bottom.ExactPins)
	topExactPinsHash, topExactPinsErr := hashRuntimeServiceExactPinsV117(request.Entrants.Top.ExactPins)
	chronicleHash, chronicleErr := hashRuntimeServiceCanonicalValueV117(
		"cowards-game:runtime-semantic-chronicle-canonical-json:v1.17",
		result.Chronicle,
	)
	finalStateHash, finalStateErr := hashRuntimeServiceCanonicalValueV117(
		"cowards-game:runtime-semantic-final-state-canonical-json:v1.17",
		result.FinalState,
	)
	outcomeHash, outcomeErr := hashRuntimeServiceCanonicalValueV117(
		"cowards-game:runtime-semantic-outcome-canonical-json:v1.17",
		result.Outcome,
	)
	receipt := result.SemanticReceipt
	if result.Privacy != "internal_runtime_result" ||
		!isPrefixedLowerSHA256(result.LedgerPoststateRoot) ||
		result.RuntimeViolationEventCount < 0 ||
		requestErr != nil || bottomExactPinsErr != nil || topExactPinsErr != nil || chronicleErr != nil || finalStateErr != nil || outcomeErr != nil ||
		!validRuntimeSemanticReceiptV117(receipt, secret) ||
		receipt.RequestSHA256 != runtimeInvocationV117SHA256Value(requestBytes) ||
		receipt.RequestID != request.RequestID ||
		receipt.MatchID != request.MatchID ||
		receipt.CompatibilityTupleID != request.CompatibilityTupleID ||
		receipt.AuthorityBundleHash != request.Authority.BundleHash ||
		receipt.AuthoritySourceManifestHash != request.Authority.SourceManifestHash ||
		receipt.RegistryGeneration != request.Authority.RegistryGeneration ||
		receipt.LegacyAuthorityBundleHash != request.LegacyAuthority.BundleHash ||
		receipt.LegacyAuthoritySourceManifestHash != request.LegacyAuthority.SourceManifestHash ||
		receipt.LegacyRegistryGeneration != request.LegacyAuthority.RegistryGeneration ||
		receipt.BottomIdentityManifestRoot != request.Entrants.Bottom.IdentityManifestRoot ||
		receipt.BottomEvidenceGraphRoot != request.Entrants.Bottom.EvidenceGraphRoot ||
		receipt.BottomStrategyRevisionID != request.Entrants.Bottom.StrategyRevisionID ||
		receipt.BottomLaneIdentityHash != request.Entrants.Bottom.LaneIdentityHash ||
		receipt.BottomOriginalSourceSHA256 != request.Entrants.Bottom.SourceIdentity.OriginalSourceSHA256 ||
		receipt.BottomNormalizedSourceSHA256 != request.Entrants.Bottom.SourceIdentity.NormalizedSourceSHA256 ||
		receipt.BottomArtifactSHA256 != request.Entrants.Bottom.SourceIdentity.ArtifactSHA256 ||
		receipt.BottomExactPinsSHA256 != bottomExactPinsHash ||
		receipt.TopIdentityManifestRoot != request.Entrants.Top.IdentityManifestRoot ||
		receipt.TopEvidenceGraphRoot != request.Entrants.Top.EvidenceGraphRoot ||
		receipt.TopStrategyRevisionID != request.Entrants.Top.StrategyRevisionID ||
		receipt.TopLaneIdentityHash != request.Entrants.Top.LaneIdentityHash ||
		receipt.TopOriginalSourceSHA256 != request.Entrants.Top.SourceIdentity.OriginalSourceSHA256 ||
		receipt.TopNormalizedSourceSHA256 != request.Entrants.Top.SourceIdentity.NormalizedSourceSHA256 ||
		receipt.TopArtifactSHA256 != request.Entrants.Top.SourceIdentity.ArtifactSHA256 ||
		receipt.TopExactPinsSHA256 != topExactPinsHash ||
		receipt.BudgetProfileSHA256 != request.Accounting.BudgetProfileSHA256 ||
		receipt.LedgerPrestateRoot != request.Accounting.LedgerPrestateRoot ||
		receipt.LedgerPoststateRoot != result.LedgerPoststateRoot ||
		receipt.ChronicleCanonicalHash != chronicleHash ||
		receipt.FinalStateCanonicalHash != finalStateHash ||
		receipt.OutcomeCanonicalHash != outcomeHash ||
		receipt.RuntimeViolationEventCount != result.RuntimeViolationEventCount {
		return nil, newRuntimeServiceFailure("RuntimeServiceSemanticIntegrity", "Runtime service v1.17 semantic receipt was rejected", true, nil)
	}
	return &response, nil
}

func hashRuntimeServiceCanonicalValueV117(domain string, payload json.RawMessage) (string, error) {
	canonical := decodeCanonicalJSONV11(payload, canonicalJSONV11Options{
		Context: canonicalJSONV11CanonicalManifest,
	})
	if canonical.Error != nil {
		return "", canonicalJSONErrorAsError(canonical.Error)
	}
	return runtimeInvocationV117SHA256Value(
		runtimeInvocationV117Frame(domain, canonical.CanonicalBytes),
	), nil
}

func canonicalJSONErrorAsError(failure *canonicalJSONV11Error) error {
	return &runtimeServiceCanonicalJSONError{code: failure.Code}
}

type runtimeServiceCanonicalJSONError struct{ code string }

func (failure *runtimeServiceCanonicalJSONError) Error() string {
	return "canonical JSON v1.1 rejected runtime service value: " + failure.code
}
