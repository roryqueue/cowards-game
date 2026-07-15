package main

import (
	"context"
)

// runtimeServiceExecutionRequest is an exact tagged union. A request may not
// carry both service contracts: doing so would let the active route and the
// signed receipt disagree about which bytes were executed.
type runtimeServiceExecutionRequest struct {
	ContractVersion string
	V116            *runtimeServiceRequest
	V117            *runtimeServiceRequestV117
}

type runtimeServiceExecutionResponse struct {
	ContractVersion string
	V116            *runtimeServiceResponse
	V117            *runtimeServiceResponseV117
}

// runtimeServiceExecutionRouter is the production execution seam consumed by
// the orchestrator. Validation remains on the immutable v1.16 client; Match
// execution is dispatched here by the exact request contract.
type runtimeServiceExecutionRouter struct {
	v116                   *runtimeServiceClient
	v117                   *runtimeServiceClientV117
	currentContractVersion func() string
	semanticReceiptSecret  string
}

func newRuntimeServiceExecutionRouter(endpoint string) *runtimeServiceExecutionRouter {
	return &runtimeServiceExecutionRouter{
		v116:                   newRuntimeServiceClient(endpoint),
		v117:                   newRuntimeServiceClientV117(endpoint),
		currentContractVersion: selectedRuntimeServiceContractVersion,
	}
}

func (router *runtimeServiceExecutionRouter) executeMatch(
	ctx context.Context,
	request runtimeServiceExecutionRequest,
) (*runtimeServiceExecutionResponse, *runtimeServiceFailure) {
	if router == nil || router.v116 == nil || router.v117 == nil || router.currentContractVersion == nil {
		return nil, newRuntimeServiceFailure("RuntimeServiceStopped", "Runtime execution service router is not configured", true, nil)
	}
	router.v116.semanticReceiptSecret = router.semanticReceiptSecret
	router.v117.semanticReceiptSecret = router.semanticReceiptSecret
	switch request.ContractVersion {
	case runtimeExecutionServiceVersion:
		if request.V116 == nil || request.V117 != nil || request.V116.ContractVersion != runtimeExecutionServiceVersion {
			return nil, newRuntimeServiceFailure("RuntimeServiceContractMismatch", "Historical runtime service request binding is invalid", false, nil)
		}
		response, failure := router.v116.executeMatch(ctx, *request.V116)
		if failure != nil {
			return nil, failure
		}
		return &runtimeServiceExecutionResponse{ContractVersion: runtimeExecutionServiceVersion, V116: response}, nil
	case runtimeExecutionServiceVersionV117:
		if router.currentContractVersion() != runtimeExecutionServiceVersionV117 || request.V117 == nil || request.V116 != nil || request.V117.ContractVersion != runtimeExecutionServiceVersionV117 {
			return nil, newRuntimeServiceFailure("RuntimeServiceContractMismatch", "Current runtime service request binding is invalid", false, nil)
		}
		response, failure := router.v117.executeMatch(ctx, *request.V117)
		if failure != nil {
			return nil, failure
		}
		return &runtimeServiceExecutionResponse{ContractVersion: runtimeExecutionServiceVersionV117, V117: response}, nil
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
	if router == nil || router.v116 == nil {
		return nil, newRuntimeServiceFailure("RuntimeServiceStopped", "Runtime execution service router is not configured", true, nil)
	}
	return router.v116.validateStrategy(ctx, sourceFormat, source, strategyID)
}
