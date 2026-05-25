package main

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"
)

const runtimeExecutionServiceVersion = "runtime-execution-service-v1.15"
const strategyRuntimeABIVersion = "strategy-runtime-abi-v1.14"
const defaultRuntimeServiceResponseBytes = 8 * 1024 * 1024
const defaultRuntimeServiceHTTPTimeout = 90 * time.Second

type runtimeServiceClient struct {
	endpoint         string
	httpClient       *http.Client
	maxResponseBytes int64
}

type runtimeServiceMatch struct {
	MatchID                  string         `json:"matchId"`
	Seed                     string         `json:"seed"`
	ArenaVariant             map[string]any `json:"arenaVariant"`
	BottomPlayerID           string         `json:"bottomPlayerId"`
	TopPlayerID              string         `json:"topPlayerId"`
	BottomStrategyRevisionID string         `json:"bottomStrategyRevisionId"`
	TopStrategyRevisionID    string         `json:"topStrategyRevisionId"`
}

type runtimeServiceStrategyRevision struct {
	ID                  string         `json:"id"`
	Source              string         `json:"source"`
	SourceHash          string         `json:"sourceHash"`
	SourceBytes         int            `json:"sourceBytes"`
	Runtime             map[string]any `json:"runtime"`
	EngineCompatibility map[string]any `json:"engineCompatibility"`
	Validation          map[string]any `json:"validation"`
	Metadata            map[string]any `json:"metadata,omitempty"`
}

type runtimeServiceRequest struct {
	ContractVersion string              `json:"contractVersion"`
	Kind            string              `json:"kind"`
	RequestID       string              `json:"requestId"`
	Match           runtimeServiceMatch `json:"match"`
	Strategies      struct {
		Bottom runtimeServiceStrategyRevision `json:"bottom"`
		Top    runtimeServiceStrategyRevision `json:"top"`
	} `json:"strategies"`
	Limits map[string]any `json:"limits"`
}

type runtimeServiceResponse struct {
	ContractVersion   string                 `json:"contractVersion"`
	OK                bool                   `json:"ok"`
	Kind              string                 `json:"kind"`
	RequestID         string                 `json:"requestId"`
	MatchID           string                 `json:"matchId,omitempty"`
	RuntimeABIVersion string                 `json:"runtimeAbiVersion"`
	Result            map[string]any         `json:"result,omitempty"`
	SystemFailure     *runtimeServiceFailure `json:"systemFailure,omitempty"`
}

type runtimeServiceValidationResponse struct {
	OK                  bool           `json:"ok"`
	Kind                string         `json:"kind"`
	SourceFormat        string         `json:"sourceFormat"`
	Runtime             map[string]any `json:"runtime,omitempty"`
	Validation          map[string]any `json:"validation,omitempty"`
	EngineCompatibility map[string]any `json:"engineCompatibility,omitempty"`
	Metadata            map[string]any `json:"metadata,omitempty"`
	SourceHash          string         `json:"sourceHash,omitempty"`
	SourceBytes         int            `json:"sourceBytes,omitempty"`
	Error               string         `json:"error,omitempty"`
}

type runtimeServiceFailure struct {
	Code          string         `json:"code"`
	ErrorClass    string         `json:"-"`
	ErrorMessage  string         `json:"message"`
	PublicMessage string         `json:"publicMessage,omitempty"`
	Retryable     bool           `json:"retryable"`
	Details       map[string]any `json:"diagnostics,omitempty"`
}

func newRuntimeServiceClient(endpoint string) *runtimeServiceClient {
	return &runtimeServiceClient{
		endpoint: strings.TrimRight(endpoint, "/"),
		httpClient: &http.Client{
			Timeout: runtimeServiceHTTPTimeout(),
		},
		maxResponseBytes: defaultRuntimeServiceResponseBytes,
	}
}

func runtimeServiceHTTPTimeout() time.Duration {
	raw := strings.TrimSpace(os.Getenv("COWARDS_RUNTIME_SERVICE_HTTP_TIMEOUT_MS"))
	if raw == "" {
		return defaultRuntimeServiceHTTPTimeout
	}
	timeoutMs, err := strconv.Atoi(raw)
	if err != nil || timeoutMs <= 0 {
		return defaultRuntimeServiceHTTPTimeout
	}
	return time.Duration(timeoutMs) * time.Millisecond
}

func (client *runtimeServiceClient) executeMatch(ctx context.Context, request runtimeServiceRequest) (*runtimeServiceResponse, *runtimeServiceFailure) {
	if failure := validateRuntimeServiceRequest(request); failure != nil {
		return nil, failure
	}
	body, err := json.Marshal(request)
	if err != nil {
		return nil, newRuntimeServiceFailure("RuntimeServiceRequestEncode", "Runtime service request could not be encoded", false, nil)
	}
	httpClient := client.httpClient
	if httpClient == nil {
		httpClient = http.DefaultClient
	}
	endpoint := client.endpoint
	if endpoint == "" {
		return nil, newRuntimeServiceFailure("RuntimeServiceStopped", "Runtime execution service endpoint is not configured", true, nil)
	}
	httpRequest, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint+"/execute-match", bytes.NewReader(body))
	if err != nil {
		return nil, newRuntimeServiceFailure("RuntimeServiceRequestCreate", "Runtime service request could not be created", false, nil)
	}
	httpRequest.Header.Set("content-type", "application/json")
	response, err := httpClient.Do(httpRequest)
	if err != nil {
		if errors.Is(ctx.Err(), context.DeadlineExceeded) || strings.Contains(strings.ToLower(err.Error()), "timeout") {
			return nil, newRuntimeServiceFailure("RuntimeServiceTimeout", "Runtime execution service timed out", true, nil)
		}
		return nil, newRuntimeServiceFailure("RuntimeServiceTransport", "Runtime execution service is unavailable", true, nil)
	}
	defer response.Body.Close()

	maxBytes := client.maxResponseBytes
	if maxBytes <= 0 {
		maxBytes = defaultRuntimeServiceResponseBytes
	}
	payload, err := io.ReadAll(io.LimitReader(response.Body, maxBytes+1))
	if err != nil {
		return nil, newRuntimeServiceFailure("RuntimeServiceRead", "Runtime service response could not be read", true, map[string]any{"status": response.StatusCode})
	}
	if int64(len(payload)) > maxBytes {
		return nil, newRuntimeServiceFailure("RuntimeServiceOversizedResponse", "Runtime service response exceeded the configured byte limit", true, map[string]any{"status": response.StatusCode, "capBytes": maxBytes})
	}

	var decoded runtimeServiceResponse
	decoder := json.NewDecoder(bytes.NewReader(payload))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&decoded); err != nil {
		return nil, newRuntimeServiceFailure("RuntimeServiceMalformedResponse", "Runtime service response did not match the execution contract", true, map[string]any{"actualBytes": len(payload)})
	}
	if failure := validateRuntimeServiceResponse(request, &decoded); failure != nil {
		return nil, failure
	}
	if decoded.SystemFailure != nil {
		failure := sanitizeRuntimeServiceFailure(*decoded.SystemFailure)
		return &decoded, &failure
	}
	return &decoded, nil
}

func (client *runtimeServiceClient) validateStrategy(ctx context.Context, sourceFormat string, source string, strategyID string) (*runtimeServiceValidationResponse, *runtimeServiceFailure) {
	if sourceFormat != "rust" && sourceFormat != "zig" {
		return nil, newRuntimeServiceFailure("RuntimeServiceContractMismatch", "Runtime service validation only supports Rust and Zig WASM/WASI sources in v1.22", false, nil)
	}
	endpoint := client.endpoint
	if endpoint == "" {
		return nil, newRuntimeServiceFailure("RuntimeServiceStopped", "Runtime execution service endpoint is not configured", true, nil)
	}
	requestBody := map[string]any{
		"sourceFormat": sourceFormat,
		"source":       source,
	}
	if strings.TrimSpace(strategyID) != "" {
		requestBody["strategyId"] = strategyID
	}
	body, err := json.Marshal(requestBody)
	if err != nil {
		return nil, newRuntimeServiceFailure("RuntimeServiceRequestEncode", "Runtime service validation request could not be encoded", false, nil)
	}
	httpClient := client.httpClient
	if httpClient == nil {
		httpClient = http.DefaultClient
	}
	httpRequest, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint+"/validate-strategy", bytes.NewReader(body))
	if err != nil {
		return nil, newRuntimeServiceFailure("RuntimeServiceRequestCreate", "Runtime service validation request could not be created", false, nil)
	}
	httpRequest.Header.Set("content-type", "application/json")
	response, err := httpClient.Do(httpRequest)
	if err != nil {
		return nil, newRuntimeServiceFailure("RuntimeServiceTransport", "Runtime execution service is unavailable", true, nil)
	}
	defer response.Body.Close()
	maxBytes := client.maxResponseBytes
	if maxBytes <= 0 {
		maxBytes = defaultRuntimeServiceResponseBytes
	}
	payload, err := io.ReadAll(io.LimitReader(response.Body, maxBytes+1))
	if err != nil {
		return nil, newRuntimeServiceFailure("RuntimeServiceRead", "Runtime service validation response could not be read", true, map[string]any{"status": response.StatusCode})
	}
	if int64(len(payload)) > maxBytes {
		return nil, newRuntimeServiceFailure("RuntimeServiceOversizedResponse", "Runtime service validation response exceeded the configured byte limit", true, map[string]any{"status": response.StatusCode, "capBytes": maxBytes})
	}
	var decoded runtimeServiceValidationResponse
	if err := json.NewDecoder(bytes.NewReader(payload)).Decode(&decoded); err != nil {
		return nil, newRuntimeServiceFailure("RuntimeServiceMalformedResponse", "Runtime service validation response was malformed", true, map[string]any{"actualBytes": len(payload)})
	}
	if decoded.Kind != "strategyValidation" || decoded.SourceFormat != sourceFormat {
		return nil, newRuntimeServiceFailure("RuntimeServiceContractMismatch", fmt.Sprintf("Runtime service validation response contract is not supported: status=%d kind=%q sourceFormat=%q.", response.StatusCode, decoded.Kind, decoded.SourceFormat), true, map[string]any{
			"status":       response.StatusCode,
			"kind":         decoded.Kind,
			"sourceFormat": decoded.SourceFormat,
		})
	}
	if decoded.OK {
		if decoded.Runtime == nil || decoded.Validation == nil || decoded.EngineCompatibility == nil || decoded.Metadata == nil || decoded.SourceHash == "" || decoded.SourceBytes <= 0 {
			return nil, newRuntimeServiceFailure("RuntimeServiceMalformedResponse", "Runtime service validation success response was incomplete", true, nil)
		}
		if decoded.SourceHash != hashStrategySourceForGo(source) || decoded.SourceBytes != len([]byte(source)) {
			return nil, newRuntimeServiceFailure("RuntimeServiceSourceMismatch", "Runtime service validation source identity mismatch", false, nil)
		}
	}
	return &decoded, nil
}

func validateRuntimeServiceRequest(request runtimeServiceRequest) *runtimeServiceFailure {
	if request.ContractVersion != runtimeExecutionServiceVersion || request.Kind != "executeMatch" || request.RequestID == "" {
		return newRuntimeServiceFailure("RuntimeServiceContractMismatch", "Runtime service request contract is not supported", false, nil)
	}
	if request.Match.MatchID == "" || request.Match.Seed == "" || request.Match.BottomPlayerID == "" || request.Match.TopPlayerID == "" {
		return newRuntimeServiceFailure("RuntimeServiceContractMismatch", "Runtime service request Match input is incomplete", false, nil)
	}
	if request.Match.BottomPlayerID == request.Match.TopPlayerID {
		return newRuntimeServiceFailure("RuntimeServiceContractMismatch", "Runtime service request player ids must differ", false, nil)
	}
	if request.Match.BottomStrategyRevisionID != request.Strategies.Bottom.ID || request.Match.TopStrategyRevisionID != request.Strategies.Top.ID {
		return newRuntimeServiceFailure("RuntimeServiceContractMismatch", "Runtime service request Strategy Revision ids do not match Match input", false, nil)
	}
	if !hasString(request.Match.ArenaVariant, "id") || !hasString(request.Match.ArenaVariant, "name") || !hasMap(request.Match.ArenaVariant, "initialBounds") || !hasSlice(request.Match.ArenaVariant, "terrainStones") {
		return newRuntimeServiceFailure("RuntimeServiceContractMismatch", "Runtime service request arena is incomplete", false, nil)
	}
	if !hasRuntimeServiceLimits(request.Limits) {
		return newRuntimeServiceFailure("RuntimeServiceContractMismatch", "Runtime service request limits are incomplete", false, nil)
	}
	if failure := validateRuntimeServiceStrategy("bottom", request.Strategies.Bottom); failure != nil {
		return failure
	}
	if failure := validateRuntimeServiceStrategy("top", request.Strategies.Top); failure != nil {
		return failure
	}
	return nil
}

func validateRuntimeServiceStrategy(side string, revision runtimeServiceStrategyRevision) *runtimeServiceFailure {
	if revision.ID == "" || revision.SourceHash == "" || revision.SourceBytes <= 0 {
		return newRuntimeServiceFailure("RuntimeServiceSourceMismatch", "Strategy Revision source metadata is incomplete", false, map[string]any{"side": side})
	}
	if utf8.RuneCountInString(revision.Source) == 0 {
		return newRuntimeServiceFailure("RuntimeServiceSourceMismatch", "Strategy Revision source is empty", false, map[string]any{"side": side})
	}
	if hashStrategySourceForGo(revision.Source) != revision.SourceHash {
		return newRuntimeServiceFailure("RuntimeServiceSourceMismatch", "Strategy Revision source hash mismatch", false, map[string]any{"side": side})
	}
	if len([]byte(revision.Source)) != revision.SourceBytes {
		return newRuntimeServiceFailure("RuntimeServiceSourceMismatch", "Strategy Revision source byte count mismatch", false, map[string]any{"side": side})
	}
	if stringValue(revision.Runtime, "abiVersion") != strategyRuntimeABIVersion || !hasMap(revision.Runtime, "language") || !hasMap(revision.Runtime, "adapter") || !hasMap(revision.Runtime, "limits") {
		return newRuntimeServiceFailure("RuntimeServiceContractMismatch", "Strategy Revision runtime metadata is incomplete", false, map[string]any{"side": side})
	}
	if !runtimeBrokerMetadataIsRegistered(revision.Runtime) {
		return newRuntimeServiceFailure("RuntimeServiceContractMismatch", "Strategy Revision runtime metadata is not registered", false, map[string]any{"side": side})
	}
	if stringValue(revision.EngineCompatibility, "spec") == "" || stringValue(revision.EngineCompatibility, "engine") == "" {
		return newRuntimeServiceFailure("RuntimeServiceContractMismatch", "Strategy Revision engine compatibility is incomplete", false, map[string]any{"side": side})
	}
	if boolValue(revision.Validation, "valid") != true || stringValue(revision.Validation, "sourceHash") != revision.SourceHash || runtimeServiceIntValue(revision.Validation, "sourceBytes") != revision.SourceBytes {
		return newRuntimeServiceFailure("RuntimeServiceContractMismatch", "Strategy Revision validation metadata is incomplete", false, map[string]any{"side": side})
	}
	if runtimeAdapterID(revision.Runtime) == "runtime-wasm-wasi-wasmtime-preview1" {
		if failure := validateRuntimeServiceCompiledArtifact(side, revision); failure != nil {
			return failure
		}
	}
	return nil
}

func validateRuntimeServiceCompiledArtifact(side string, revision runtimeServiceStrategyRevision) *runtimeServiceFailure {
	artifact := mapValue(revision.Metadata, "compiledArtifact")
	if artifact == nil {
		return newRuntimeServiceFailure("RuntimeServiceSourceMismatch", "WASM/WASI Strategy Revision is missing immutable artifact metadata", false, map[string]any{"side": side})
	}
	expectedTargetTriple := "wasm32-wasip1"
	if stringValue(mapValue(revision.Runtime, "language"), "id") == "zig" {
		expectedTargetTriple = "wasm32-wasi"
	}
	if stringValue(artifact, "format") != "wasm" || stringValue(artifact, "wasiProfile") != "preview1" || stringValue(artifact, "abiEnvelope") != "stdin-stdout-json" || stringValue(artifact, "validationStatus") != "valid" || stringValue(artifact, "abiVersion") != strategyRuntimeABIVersion || stringValue(artifact, "targetTriple") != expectedTargetTriple {
		return newRuntimeServiceFailure("RuntimeServiceContractMismatch", "WASM/WASI artifact metadata is incomplete", false, map[string]any{"side": side})
	}
	if stringValue(artifact, "sourceHash") != revision.SourceHash {
		return newRuntimeServiceFailure("RuntimeServiceSourceMismatch", "WASM/WASI artifact source hash mismatch", false, map[string]any{"side": side})
	}
	raw := stringValue(artifact, "bytesBase64")
	if raw == "" {
		return newRuntimeServiceFailure("RuntimeServiceSourceMismatch", "WASM/WASI artifact bytes are missing", false, map[string]any{"side": side})
	}
	decoded, err := base64.StdEncoding.DecodeString(raw)
	if err != nil {
		return newRuntimeServiceFailure("RuntimeServiceSourceMismatch", "WASM/WASI artifact bytes are malformed", false, map[string]any{"side": side})
	}
	if len(decoded) != runtimeServiceIntValue(artifact, "bytes") {
		return newRuntimeServiceFailure("RuntimeServiceSourceMismatch", "WASM/WASI artifact byte count mismatch", false, map[string]any{"side": side})
	}
	sum := sha256.Sum256(decoded)
	if hex.EncodeToString(sum[:]) != stringValue(artifact, "hash") {
		return newRuntimeServiceFailure("RuntimeServiceSourceMismatch", "WASM/WASI artifact hash mismatch", false, map[string]any{"side": side})
	}
	return nil
}

func runtimeAdapterID(runtime map[string]any) string {
	return stringValue(mapValue(runtime, "adapter"), "id")
}

func runtimeBrokerMetadataIsRegistered(runtime map[string]any) bool {
	language := mapValue(runtime, "language")
	adapter := mapValue(runtime, "adapter")
	pkg := mapValue(runtime, "package")
	languageID := stringValue(language, "id")
	languageVersion := stringValue(language, "version")
	adapterID := stringValue(adapter, "id")
	adapterVersion := stringValue(adapter, "version")
	packageMode := stringValue(pkg, "mode")
	if packageMode == "" {
		packageMode = "none"
	}
	switch {
	case languageID == "javascript" && languageVersion == "0.1.0" && adapterID == "runtime-js-worker-thread" && adapterVersion == "0.1.0" && packageMode == "none":
		return true
	case languageID == "typescript" && languageVersion == "0.1.0" && adapterID == "runtime-js-worker-thread" && adapterVersion == "0.1.0" && packageMode == "none":
		return true
	case languageID == "python" && languageVersion == "3.9" && adapterID == "runtime-python-subprocess-experimental" && adapterVersion == "0.1.0-experimental" && packageMode == "none":
		return true
	case languageID == "rust" && languageVersion == "1.95.0-wasm32-wasip1" && adapterID == "runtime-wasm-wasi-wasmtime-preview1" && adapterVersion == "0.1.0-alpha" && packageMode == "none":
		return true
	case languageID == "zig" && languageVersion == "0.16.0-wasm32-wasi" && adapterID == "runtime-wasm-wasi-wasmtime-preview1" && adapterVersion == "0.1.0-alpha" && packageMode == "none":
		return true
	default:
		return false
	}
}

func validateRuntimeServiceResponse(request runtimeServiceRequest, response *runtimeServiceResponse) *runtimeServiceFailure {
	if response.ContractVersion != runtimeExecutionServiceVersion || response.RequestID != request.RequestID || response.RuntimeABIVersion != strategyRuntimeABIVersion {
		return newRuntimeServiceFailure("RuntimeServiceContractMismatch", "Runtime service response contract is not supported", true, nil)
	}
	if response.OK {
		if response.Kind != "executionResult" {
			return newRuntimeServiceFailure("RuntimeServiceMalformedResponse", "Runtime service success response kind is invalid", true, nil)
		}
		if response.MatchID != request.Match.MatchID {
			return newRuntimeServiceFailure("RuntimeServiceContractMismatch", "Runtime service response Match id did not match the request", true, nil)
		}
		if response.Result == nil || response.SystemFailure != nil {
			return newRuntimeServiceFailure("RuntimeServiceMalformedResponse", "Runtime service success response was incomplete", true, nil)
		}
		return nil
	}
	if response.Kind != "systemFailure" || response.SystemFailure == nil || response.Result != nil {
		return newRuntimeServiceFailure("RuntimeServiceMalformedResponse", "Runtime service failure response was incomplete", true, nil)
	}
	if !isRuntimeServiceContractFailureCode(response.SystemFailure.Code) {
		return newRuntimeServiceFailure("RuntimeServiceMalformedResponse", "Runtime service failure code is outside the execution contract", true, nil)
	}
	return nil
}

func hashStrategySourceForGo(source string) string {
	sum := sha256.Sum256([]byte(source))
	return hex.EncodeToString(sum[:])
}

func newRuntimeServiceFailure(errorClass string, message string, retryable bool, details map[string]any) *runtimeServiceFailure {
	failure := runtimeServiceFailure{
		Code:         errorClass,
		ErrorClass:   errorClass,
		ErrorMessage: message,
		Retryable:    retryable,
		Details:      sanitizeRuntimeServiceDetails(details),
	}
	return &failure
}

func sanitizeRuntimeServiceFailure(failure runtimeServiceFailure) runtimeServiceFailure {
	code := sanitizeRuntimeServiceFailureCode(failure.Code)
	if code == "" {
		code = "RuntimeServiceSystemFailure"
	}
	return runtimeServiceFailure{
		Code:          code,
		ErrorClass:    code,
		ErrorMessage:  redactRuntimeServiceMessage(failure.ErrorMessage),
		PublicMessage: redactRuntimeServiceMessage(failure.PublicMessage),
		Retryable:     failure.Retryable,
		Details:       sanitizeRuntimeServiceDetails(failure.Details),
	}
}

func sanitizeRuntimeServiceFailureCode(code string) string {
	if isRuntimeServiceContractFailureCode(code) {
		return code
	}
	return ""
}

func isRuntimeServiceContractFailureCode(code string) bool {
	switch code {
	case "MALFORMED_REQUEST",
		"SOURCE_HASH_MISMATCH",
		"SOURCE_BYTES_MISMATCH",
		"UNSUPPORTED_RUNTIME_ADAPTER",
		"EXECUTION_EXCEPTION",
		"RESPONSE_SCHEMA_INVALID":
		return true
	default:
		return false
	}
}

func sanitizeRuntimeServiceDetails(details map[string]any) map[string]any {
	safe := sanitizeMatchJobFailureDetails(details)
	return redactRuntimeServiceDetailStrings(safe)
}

func redactRuntimeServiceMessage(message string) string {
	lower := strings.ToLower(message)
	for _, forbidden := range runtimeServicePrivateMarkers {
		if strings.Contains(lower, forbidden) {
			return "Runtime execution service failed with redacted diagnostics"
		}
	}
	return message
}

var runtimeServicePrivateMarkers = []string{
	"export default",
	"strategy source",
	"strategymemory",
	"strategy memory",
	"soldiermemory",
	"soldier memory",
	"objectivepayload",
	"objective payload",
	"ownerdebug",
	"owner debug",
	"raw awareness grid",
	"awareness grid",
	"stderr",
	"stack",
	"sessionid",
	"session id",
	"session",
	"token",
	"database_url",
	"database url",
	"db dsn",
	"dsn",
	"mysql://",
	"postgres://",
	"postgresql://",
	"hostpath",
	"host path",
	"/users/",
	"/home/",
	"/tmp/",
	"private runtime internals",
	"privateruntimeinternals",
}

func redactRuntimeServiceDetailStrings(details map[string]any) map[string]any {
	redacted := map[string]any{}
	for key, value := range details {
		switch typed := value.(type) {
		case string:
			redacted[key] = redactRuntimeServiceMessage(typed)
		case map[string]any:
			redacted[key] = redactRuntimeServiceDetailStrings(typed)
		case []any:
			redactedValues := make([]any, 0, len(typed))
			for _, entry := range typed {
				if text, ok := entry.(string); ok {
					redactedValues = append(redactedValues, redactRuntimeServiceMessage(text))
				} else if nested, ok := entry.(map[string]any); ok {
					redactedValues = append(redactedValues, redactRuntimeServiceDetailStrings(nested))
				} else {
					redactedValues = append(redactedValues, entry)
				}
			}
			redacted[key] = redactedValues
		default:
			redacted[key] = typed
		}
	}
	return redacted
}

func hasString(value map[string]any, key string) bool {
	entry, ok := value[key].(string)
	return ok && entry != ""
}

func hasMap(value map[string]any, key string) bool {
	entry, ok := value[key].(map[string]any)
	return ok && entry != nil
}

func hasSlice(value map[string]any, key string) bool {
	entry, ok := value[key].([]any)
	return ok && entry != nil
}

func hasRuntimeServiceLimits(limits map[string]any) bool {
	for _, key := range []string{"timeoutMs", "stdoutBytes", "stderrBytes", "sourceBytes", "strategyMemoryBytes", "soldierMemoryBytes", "objectivePayloadBytes", "environment", "filesystem", "network", "shell", "packagePolicy"} {
		if _, ok := limits[key]; !ok {
			return false
		}
	}
	return true
}

func runtimeServiceIntValue(value map[string]any, key string) int {
	switch typed := value[key].(type) {
	case int:
		return typed
	case int64:
		return int(typed)
	case float64:
		return int(typed)
	default:
		return 0
	}
}

func runtimeServiceFailureJSONSafe(failure *runtimeServiceFailure) string {
	if failure == nil {
		return ""
	}
	bytes, err := json.Marshal(failure)
	if err != nil {
		return fmt.Sprintf("%s:%s", failure.Code, failure.ErrorMessage)
	}
	return string(bytes)
}
