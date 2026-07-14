package main

import (
	"context"
	"testing"
)

func signedRuntimeInvocationResponseV117ForTest(
	t *testing.T,
	request *runtimeInvocationRequestV117,
	outcome map[string]any,
	identity runtimeInvocationV117SigningIdentity,
) []byte {
	t.Helper()
	var payloadBinding any
	if outcome["kind"] == "success" {
		payloadBytes, err := runtimeInvocationV117CanonicalValue(outcome["value"])
		if err != nil {
			t.Fatal(err)
		}
		payloadBinding = map[string]any{
			"sha256":              runtimeInvocationV117SHA256Value(payloadBytes),
			"canonicalByteLength": len(payloadBytes),
		}
	}
	unsigned := map[string]any{
		"contractVersion": runtimeInvocationV117ContractVersion,
		"candidateStatus": runtimeInvocationV117CandidateStatus,
		"current":         false,
		"envelopeKind":    "runtime-invocation-response",
		"requestBinding":  runtimeInvocationV117RequestBindingMap(request),
		"outcome":         outcome,
		"payloadBinding":  payloadBinding,
	}
	authentication, err := runtimeInvocationV117Authenticate("response", unsigned, identity)
	if err != nil {
		t.Fatal(err)
	}
	unsigned["authentication"] = map[string]any{
		"algorithm":            authentication.Algorithm,
		"keyId":                authentication.KeyID,
		"signatureInputSha256": authentication.SignatureInputSHA256,
		"signature":            authentication.Signature,
	}
	bytes, err := runtimeInvocationV117CanonicalValue(unsigned)
	if err != nil {
		t.Fatal(err)
	}
	return bytes
}

func TestPhase258RuntimeInvocationV117WrongBindingAndAmbiguousNeverRetry(t *testing.T) {
	requestBytes := readRuntimeInvocationV117Fixture(t, "runtime-execution-service-request.v1.17.candidate.json")
	identity := runtimeInvocationV117SigningIdentity{KeyID: runtimeInvocationV117FixtureKeyID, Secret: runtimeInvocationV117FixtureSecret}
	request, failure := verifyRuntimeInvocationRequestV117(requestBytes, identity)
	if failure != nil {
		t.Fatal(failure)
	}

	value := map[string]any{"activationOrders": []any{}, "strategyMemory": map[string]any{}}
	payloadBytes, err := runtimeInvocationV117CanonicalValue(value)
	if err != nil {
		t.Fatal(err)
	}
	wrongBinding := runtimeInvocationV117RequestBindingMap(request)
	wrongBinding["artifactSha256"] = "sha256:eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
	unsigned := map[string]any{
		"contractVersion": runtimeInvocationV117ContractVersion,
		"candidateStatus": runtimeInvocationV117CandidateStatus,
		"current":         false,
		"envelopeKind":    "runtime-invocation-response",
		"requestBinding":  wrongBinding,
		"outcome": map[string]any{
			"kind":  "success",
			"value": value,
			"trace": runtimeInvocationTraceV117ForRequest(request),
		},
		"payloadBinding": map[string]any{
			"sha256":              runtimeInvocationV117SHA256Value(payloadBytes),
			"canonicalByteLength": len(payloadBytes),
		},
	}
	authentication, err := runtimeInvocationV117Authenticate("response", unsigned, identity)
	if err != nil {
		t.Fatal(err)
	}
	unsigned["authentication"] = authentication
	wrongBytes, err := runtimeInvocationV117CanonicalValue(unsigned)
	if err != nil {
		t.Fatal(err)
	}

	calls := 0
	_, failure = executeRuntimeInvocationV117WithRetry(context.Background(), requestBytes, identity, 3, func(_ context.Context, _ []byte) ([]byte, error) {
		calls++
		return wrongBytes, nil
	})
	if failure == nil || failure.Code != "OUTER_FRAME_WRONG_BINDING" || failure.Retryable || calls != 1 {
		t.Fatalf("wrong binding retried or changed ownership: failure=%+v calls=%d", failure, calls)
	}

	ambiguousBytes := signedRuntimeInvocationResponseV117ForTest(t, request, map[string]any{
		"kind": "system_failure",
		"failure": map[string]any{
			"code":          "AMBIGUOUS_ATTRIBUTION",
			"publicMessage": "Runtime system failure.",
			"retryable":     false,
		},
		"trace": runtimeInvocationTraceV117ForRequest(request),
	}, identity)
	calls = 0
	response, failure := executeRuntimeInvocationV117WithRetry(context.Background(), requestBytes, identity, 3, func(_ context.Context, _ []byte) ([]byte, error) {
		calls++
		return ambiguousBytes, nil
	})
	if failure != nil || response == nil || response.Outcome.Kind != "system_failure" || response.Outcome.Failure == nil || response.Outcome.Failure.Retryable || calls != 1 {
		t.Fatalf("ambiguous attribution retried or changed ownership: response=%+v failure=%+v calls=%d", response, failure, calls)
	}
}
