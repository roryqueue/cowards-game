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
	payload, err := json.Marshal(request)
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
	var response runtimeServiceResponseV117
	if err := decodeStrictJSONUseNumber(payload, &response); err != nil {
		return nil, newRuntimeServiceFailure("RuntimeServiceMalformedResponse", "Runtime service v1.17 response was malformed", true, nil)
	}
	if response.ContractVersion != runtimeExecutionServiceVersionV117 || response.RequestID != request.RequestID || response.MatchID != request.MatchID {
		return nil, newRuntimeServiceFailure("RuntimeServiceContractMismatch", "Runtime service v1.17 response binding mismatch", true, nil)
	}
	if !response.OK || response.Kind != "executionResult" || response.Result == nil || response.SystemFailure != nil {
		return nil, newRuntimeServiceFailure("RuntimeServiceSystemFailure", "Runtime service v1.17 did not return an admitted result", true, nil)
	}
	result := response.Result
	if result.Privacy != "internal_runtime_result" ||
		!isPrefixedLowerSHA256(result.LedgerPoststateRoot) ||
		result.RuntimeViolationEventCount < 0 ||
		!validRuntimeSemanticReceiptV117(result.SemanticReceipt, secret) ||
		result.SemanticReceipt.RequestID != request.RequestID ||
		result.SemanticReceipt.MatchID != request.MatchID ||
		result.SemanticReceipt.CompatibilityTupleID != request.CompatibilityTupleID ||
		result.SemanticReceipt.AuthorityBundleHash != request.Authority.BundleHash ||
		result.SemanticReceipt.AuthoritySourceManifestHash != request.Authority.SourceManifestHash ||
		result.SemanticReceipt.LedgerPrestateRoot != request.Accounting.LedgerPrestateRoot ||
		result.SemanticReceipt.LedgerPoststateRoot != result.LedgerPoststateRoot {
		return nil, newRuntimeServiceFailure("RuntimeServiceSemanticIntegrity", "Runtime service v1.17 semantic receipt was rejected", true, nil)
	}
	return &response, nil
}
