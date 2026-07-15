package main

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"strings"
)

const runtimeExecutionServiceVersionV117 = "runtime-execution-service-v1.17"
const strategyRuntimeABIVersionV117 = "strategy-runtime-abi-v1.17"
const canonicalJSONVersionV11 = "canonical-json-v1.1"

// selectedRuntimeServiceContractVersion is the single Go-side activation
// pointer. Plan 258-14 prepares both clients while keeping production on v1.16;
// the activation commit changes only this return value and the route selector.
func selectedRuntimeServiceContractVersion() string {
	return runtimeExecutionServiceVersion
}

type runtimeServiceRequestV117 struct {
	ContractVersion      string `json:"contractVersion"`
	Kind                 string `json:"kind"`
	RequestID            string `json:"requestId"`
	MatchID              string `json:"matchId"`
	CompatibilityTupleID string `json:"compatibilityTupleId"`
	Authority            struct {
		BundleHash         string `json:"bundleHash"`
		SourceManifestHash string `json:"sourceManifestHash"`
		RegistryGeneration string `json:"registryGeneration"`
	} `json:"authority"`
	Entrants struct {
		Bottom runtimeServiceEntrantV117 `json:"bottom"`
		Top    runtimeServiceEntrantV117 `json:"top"`
	} `json:"entrants"`
	Accounting struct {
		BudgetProfileSHA256 string `json:"budgetProfileSha256"`
		LedgerPrestateRoot  string `json:"ledgerPrestateRoot"`
	} `json:"accounting"`
	Match json.RawMessage `json:"match"`
}

type runtimeServiceEntrantV117 struct {
	IdentityManifestRoot string `json:"identityManifestRoot"`
	EvidenceGraphRoot    string `json:"evidenceGraphRoot"`
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
		!isPrefixedLowerSHA256(request.Entrants.Bottom.IdentityManifestRoot) ||
		!isPrefixedLowerSHA256(request.Entrants.Bottom.EvidenceGraphRoot) ||
		!isPrefixedLowerSHA256(request.Entrants.Top.IdentityManifestRoot) ||
		!isPrefixedLowerSHA256(request.Entrants.Top.EvidenceGraphRoot) ||
		!isPrefixedLowerSHA256(request.Accounting.BudgetProfileSHA256) ||
		!isPrefixedLowerSHA256(request.Accounting.LedgerPrestateRoot) || len(request.Match) == 0 {
		return newRuntimeServiceFailure("RuntimeServiceContractMismatch", "Runtime service v1.17 request contract is not supported", false, nil)
	}
	return nil
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
		requestErr != nil || chronicleErr != nil || finalStateErr != nil || outcomeErr != nil ||
		!validRuntimeSemanticReceiptV117(receipt, secret) ||
		receipt.RequestSHA256 != runtimeInvocationV117SHA256Value(requestBytes) ||
		receipt.RequestID != request.RequestID ||
		receipt.MatchID != request.MatchID ||
		receipt.CompatibilityTupleID != request.CompatibilityTupleID ||
		receipt.AuthorityBundleHash != request.Authority.BundleHash ||
		receipt.AuthoritySourceManifestHash != request.Authority.SourceManifestHash ||
		receipt.RegistryGeneration != request.Authority.RegistryGeneration ||
		receipt.BottomIdentityManifestRoot != request.Entrants.Bottom.IdentityManifestRoot ||
		receipt.BottomEvidenceGraphRoot != request.Entrants.Bottom.EvidenceGraphRoot ||
		receipt.TopIdentityManifestRoot != request.Entrants.Top.IdentityManifestRoot ||
		receipt.TopEvidenceGraphRoot != request.Entrants.Top.EvidenceGraphRoot ||
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
