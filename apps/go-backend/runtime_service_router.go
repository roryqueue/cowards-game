package main

import (
	"context"
	"strings"
)

// runtimeServiceExecutionRequest is an exact tagged union. A request may not
// carry both service contracts: doing so would let the active route and the
// signed receipt disagree about which bytes were executed.
type runtimeServiceExecutionRequest struct {
	ContractVersion string
	V116            *runtimeServiceRequest
	V117            *runtimeServiceRequestV117
	V118            *runtimeServiceRequestV118
}

type runtimeServiceExecutionResponse struct {
	ContractVersion string
	V116            *runtimeServiceResponse
	V117            *runtimeServiceResponseV117
	V118            *runtimeServiceResponseV118
}

// runtimeServiceExecutionRouter is the production execution and validation
// seam consumed by the orchestrator. Both operations are selected by the one
// service-contract pointer while the immutable v1.16 client remains explicit.
type runtimeServiceExecutionRouter struct {
	v116                   *runtimeServiceClient
	v117                   *runtimeServiceClientV117
	v118                   *runtimeServiceClientV118
	currentContractVersion func() string
}

func newRuntimeServiceExecutionRouter(endpoint string) *runtimeServiceExecutionRouter {
	return newRuntimeServiceExecutionRouterWithSemanticReceiptSecret(endpoint, runtimeServiceSemanticReceiptSecret())
}

func newRuntimeServiceExecutionRouterWithSemanticReceiptSecret(endpoint string, semanticReceiptSecret string) *runtimeServiceExecutionRouter {
	secret := strings.TrimSpace(semanticReceiptSecret)
	v116 := newRuntimeServiceClient(endpoint)
	v117 := newRuntimeServiceClientV117(endpoint)
	v118 := newRuntimeServiceClientV118(endpoint, runtimeSemanticReceiptTrustedKeyFromEnvironmentV118())
	v116.semanticReceiptSecret = secret
	v117.semanticReceiptSecret = secret
	return &runtimeServiceExecutionRouter{
		v116:                   v116,
		v117:                   v117,
		v118:                   v118,
		currentContractVersion: selectedRuntimeServiceContractVersion,
	}
}

func (router *runtimeServiceExecutionRouter) executeMatch(
	ctx context.Context,
	request runtimeServiceExecutionRequest,
) (*runtimeServiceExecutionResponse, *runtimeServiceFailure) {
	if router == nil || router.v116 == nil || router.v117 == nil || router.v118 == nil || router.currentContractVersion == nil {
		return nil, newRuntimeServiceFailure("RuntimeServiceStopped", "Runtime execution service router is not configured", true, nil)
	}
	switch request.ContractVersion {
	case runtimeExecutionServiceVersion:
		if router.currentContractVersion() != runtimeExecutionServiceVersion || request.V116 == nil || request.V117 != nil || request.V118 != nil || request.V116.ContractVersion != runtimeExecutionServiceVersion {
			return nil, newRuntimeServiceFailure("RuntimeServiceContractMismatch", "Historical runtime service request binding is invalid", false, nil)
		}
		response, failure := router.v116.executeMatch(ctx, *request.V116)
		if failure != nil {
			return nil, failure
		}
		return &runtimeServiceExecutionResponse{ContractVersion: runtimeExecutionServiceVersion, V116: response}, nil
	case runtimeExecutionServiceVersionV117:
		if router.currentContractVersion() != runtimeExecutionServiceVersionV117 || request.V117 == nil || request.V116 != nil || request.V118 != nil || request.V117.ContractVersion != runtimeExecutionServiceVersionV117 {
			return nil, newRuntimeServiceFailure("RuntimeServiceContractMismatch", "Current runtime service request binding is invalid", false, nil)
		}
		response, failure := router.v117.executeMatch(ctx, *request.V117)
		if failure != nil {
			return nil, failure
		}
		return &runtimeServiceExecutionResponse{ContractVersion: runtimeExecutionServiceVersionV117, V117: response}, nil
	case runtimeExecutionServiceVersionV118:
		if router.currentContractVersion() != runtimeExecutionServiceVersionV118 || request.V118 == nil || request.V116 != nil || request.V117 != nil || request.V118.ContractVersion != runtimeExecutionServiceVersionV118 {
			return nil, newRuntimeServiceFailure("RuntimeServiceContractMismatch", "Current v1.18 runtime service request binding is invalid", false, nil)
		}
		response, failure := router.v118.executeMatch(ctx, *request.V118)
		if failure != nil {
			return nil, failure
		}
		return &runtimeServiceExecutionResponse{ContractVersion: runtimeExecutionServiceVersionV118, V118: response}, nil
	default:
		return nil, newRuntimeServiceFailure("RuntimeServiceContractMismatch", "Runtime service request contract is not registered", false, nil)
	}
}

func (router *runtimeServiceExecutionRouter) validateStrategy(
	ctx context.Context,
	sourceFormat string,
	source string,
	strategyID string,
) (*runtimeServiceValidationResponse, *runtimeServiceFailure) {
	if router == nil || router.v116 == nil || router.v117 == nil || router.v118 == nil || router.currentContractVersion == nil {
		return nil, newRuntimeServiceFailure("RuntimeServiceStopped", "Runtime execution service router is not configured", true, nil)
	}
	switch router.currentContractVersion() {
	case runtimeExecutionServiceVersion:
		response, failure := router.v116.validateStrategy(ctx, sourceFormat, source, strategyID)
		if failure != nil || response == nil || !response.OK {
			return response, failure
		}
		if stringValue(response.Runtime, "abiVersion") != strategyRuntimeABIVersion {
			return nil, newRuntimeServiceFailure("RuntimeServiceContractMismatch", "Legacy validation response did not match the selected v1.16 runtime authority", true, nil)
		}
		return response, nil
	case runtimeExecutionServiceVersionV117:
		return router.v117.validateStrategy(ctx, sourceFormat, source, strategyID)
	default:
		return nil, newRuntimeServiceFailure("RuntimeServiceContractMismatch", "Runtime service validation contract is not registered", false, nil)
	}
}
