package main

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"os"
	"testing"
)

const runtimeInvocationV117FixtureKeyID = "fixture-only:runtime-adapter:v1.17-candidate"
const runtimeInvocationV117FixtureSecret = "fixture-only:runtime-invocation-v1.17:secret"

func readRuntimeInvocationV117Fixture(t *testing.T, name string) []byte {
	t.Helper()
	value, err := os.ReadFile("../../packages/spec/artifacts/" + name)
	if err != nil {
		t.Fatal(err)
	}
	return value
}

func TestPhase258RuntimeInvocationV117CanonicalParityAndClosedDispatch(t *testing.T) {
	requestBytes := readRuntimeInvocationV117Fixture(t, "runtime-execution-service-request.v1.17.candidate.json")
	responseBytes := readRuntimeInvocationV117Fixture(t, "runtime-execution-service-response.v1.17.candidate.wire.json")
	identity := runtimeInvocationV117SigningIdentity{KeyID: runtimeInvocationV117FixtureKeyID, Secret: runtimeInvocationV117FixtureSecret}

	request, failure := verifyRuntimeInvocationRequestV117(requestBytes, identity)
	if failure != nil {
		t.Fatalf("candidate request rejected: %+v", failure)
	}
	if request.ContractVersion != "runtime-invocation-v1.17" || request.Method != "selectActivations" {
		t.Fatalf("unexpected candidate request: %+v", request)
	}
	response, failure := verifyRuntimeInvocationResponseV117(responseBytes, request, identity)
	if failure != nil || response.Outcome.Kind != "success" {
		t.Fatalf("candidate response rejected: response=%+v failure=%+v", response, failure)
	}

	for _, version := range []string{"", "runtime-invocation-v1.15", "runtime-invocation-v1.16", "runtime-invocation-v1.18"} {
		if _, ok := runtimeInvocationContractForVersion(version); ok {
			t.Fatalf("unknown version %q did not fail closed", version)
		}
	}
	if historical, ok := runtimeInvocationContractForVersion("runtime-execution-service-v1.16"); !ok || !historical.Historical || historical.CanonicalJSON {
		t.Fatalf("historical v1.16 dispatch drifted: %+v ok=%v", historical, ok)
	}
	if candidate, ok := runtimeInvocationContractForVersion("runtime-invocation-v1.17"); !ok || candidate.Historical || !candidate.CanonicalJSON || candidate.Current {
		t.Fatalf("candidate v1.17 dispatch drifted: %+v ok=%v", candidate, ok)
	}
}

func TestPhase258RuntimeInvocationV117RejectsUnsignedBudgetStaleIdentityAndMixedResult(t *testing.T) {
	requestBytes := readRuntimeInvocationV117Fixture(t, "runtime-execution-service-request.v1.17.candidate.json")
	identity := runtimeInvocationV117SigningIdentity{KeyID: runtimeInvocationV117FixtureKeyID, Secret: runtimeInvocationV117FixtureSecret}

	for _, mutation := range []struct {
		name string
		from []byte
		to   []byte
		code string
	}{
		{name: "unsigned budget", from: []byte(`"wallMilliseconds":50`), to: []byte(`"wallMilliseconds":51`), code: "OUTER_FRAME_UNAUTHENTICATED"},
		{name: "stale artifact", from: []byte("sha256:dddddddd"), to: []byte("sha256:eeeeeeee"), code: "OUTER_FRAME_UNAUTHENTICATED"},
	} {
		t.Run(mutation.name, func(t *testing.T) {
			tampered := bytes.Replace(requestBytes, mutation.from, mutation.to, 1)
			if bytes.Equal(tampered, requestBytes) {
				t.Fatalf("mutation marker missing")
			}
			_, failure := verifyRuntimeInvocationRequestV117(tampered, identity)
			if failure == nil || failure.Code != mutation.code || failure.Retryable {
				t.Fatalf("unexpected failure: %+v", failure)
			}
		})
	}

	request, failure := verifyRuntimeInvocationRequestV117(requestBytes, identity)
	if failure != nil {
		t.Fatal(failure)
	}
	mixed := signedRuntimeInvocationResponseV117ForTest(t, request, map[string]any{
		"kind": "success",
		"value": map[string]any{"activationOrders": []any{}, "strategyMemory": map[string]any{}},
		"violation": map[string]any{"code": "INVALID_OUTPUT", "publicMessage": "Strategy returned an invalid payload."},
		"trace": runtimeInvocationTraceV117ForRequest(request),
	}, identity)
	_, failure = verifyRuntimeInvocationResponseV117(mixed, request, identity)
	if failure == nil || failure.Code != "OUTER_FRAME_UNDECODABLE" || failure.Retryable {
		t.Fatalf("mixed result did not fail closed: %+v", failure)
	}
}

func TestPhase258RuntimeInvocationV117RetriesOnlySystemFailureWithPinnedBytes(t *testing.T) {
	requestBytes := readRuntimeInvocationV117Fixture(t, "runtime-execution-service-request.v1.17.candidate.json")
	successBytes := readRuntimeInvocationV117Fixture(t, "runtime-execution-service-response.v1.17.candidate.wire.json")
	identity := runtimeInvocationV117SigningIdentity{KeyID: runtimeInvocationV117FixtureKeyID, Secret: runtimeInvocationV117FixtureSecret}
	request, failure := verifyRuntimeInvocationRequestV117(requestBytes, identity)
	if failure != nil {
		t.Fatal(failure)
	}
	systemBytes := signedRuntimeInvocationResponseV117ForTest(t, request, map[string]any{
		"kind": "system_failure",
		"failure": map[string]any{"code": "TRANSPORT_CRASH", "publicMessage": "Runtime system failure.", "retryable": true},
		"trace": runtimeInvocationTraceV117ForRequest(request),
	}, identity)
	playerBytes := signedRuntimeInvocationResponseV117ForTest(t, request, map[string]any{
		"kind": "player_violation",
		"violation": map[string]any{"code": "INVALID_OUTPUT", "publicMessage": "Strategy returned an invalid payload."},
		"trace": runtimeInvocationTraceV117ForRequest(request),
	}, identity)

	var observed [][]byte
	result, failure := executeRuntimeInvocationV117WithRetry(context.Background(), requestBytes, identity, 2, func(_ context.Context, sent []byte) ([]byte, error) {
		observed = append(observed, append([]byte(nil), sent...))
		sent[0] ^= 0xff // the transport cannot mutate the pinned retry bytes
		if len(observed) == 1 {
			return systemBytes, nil
		}
		return successBytes, nil
	})
	if failure != nil || result.Outcome.Kind != "success" || len(observed) != 2 {
		t.Fatalf("system retry failed: result=%+v failure=%+v calls=%d", result, failure, len(observed))
	}
	for index, sent := range observed {
		if !bytes.Equal(sent, requestBytes) {
			t.Fatalf("retry %d changed signed request bytes", index)
		}
	}

	observed = nil
	result, failure = executeRuntimeInvocationV117WithRetry(context.Background(), requestBytes, identity, 3, func(_ context.Context, sent []byte) ([]byte, error) {
		observed = append(observed, append([]byte(nil), sent...))
		return playerBytes, nil
	})
	if failure != nil || result.Outcome.Kind != "player_violation" || len(observed) != 1 {
		t.Fatalf("player violation was retried: result=%+v failure=%+v calls=%d", result, failure, len(observed))
	}

	hash := sha256.Sum256(requestBytes)
	if request.RequestSHA256 != "sha256:"+hex.EncodeToString(hash[:]) {
		t.Fatalf("request identity is not pinned to exact bytes: %s", request.RequestSHA256)
	}
}
