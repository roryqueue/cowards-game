package main

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"os"
	"strings"
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
		"kind":      "success",
		"value":     map[string]any{"activationOrders": []any{}, "strategyMemory": map[string]any{}},
		"violation": map[string]any{"code": "INVALID_OUTPUT", "publicMessage": "Strategy returned an invalid payload."},
		"trace":     runtimeInvocationTraceV117ForRequest(request),
	}, identity)
	_, failure = verifyRuntimeInvocationResponseV117(mixed, request, identity)
	if failure == nil || failure.Code != "OUTER_FRAME_UNDECODABLE" || failure.Retryable {
		t.Fatalf("mixed result did not fail closed: %+v", failure)
	}
}

func TestPhase258RuntimeInvocationV117RejectsSignedMalformedAndOversizeSuccessPayloads(t *testing.T) {
	requestBytes := readRuntimeInvocationV117Fixture(t, "runtime-execution-service-request.v1.17.candidate.json")
	identity := runtimeInvocationV117SigningIdentity{KeyID: runtimeInvocationV117FixtureKeyID, Secret: runtimeInvocationV117FixtureSecret}

	type payloadCase struct {
		name   string
		method string
		value  map[string]any
	}
	largeOrders := make([]any, 20_000)
	for index := range largeOrders {
		largeOrders[index] = map[string]any{"soldierId": "soldier"}
	}
	cases := []payloadCase{
		{name: "activation order missing soldier id", method: "selectActivations", value: map[string]any{"activationOrders": []any{map[string]any{}}, "strategyMemory": nil}},
		{name: "activation order empty soldier id", method: "selectActivations", value: map[string]any{"activationOrders": []any{map[string]any{"soldierId": ""}}, "strategyMemory": nil}},
		{name: "activation order has unknown field", method: "selectActivations", value: map[string]any{"activationOrders": []any{map[string]any{"soldierId": "soldier", "unknown": true}}, "strategyMemory": nil}},
		{name: "objective exceeds one KiB", method: "selectActivations", value: map[string]any{"activationOrders": []any{map[string]any{"soldierId": "soldier", "objective": strings.Repeat("o", 1_024)}}, "strategyMemory": nil}},
		{name: "strategy memory exceeds thirty two KiB", method: "selectActivations", value: map[string]any{"activationOrders": []any{}, "strategyMemory": strings.Repeat("m", 32*1_024)}},
		{name: "invocation payload exceeds two hundred fifty six KiB", method: "selectActivations", value: map[string]any{"activationOrders": largeOrders, "strategyMemory": nil}},
		{name: "unknown action", method: "soldierBrain", value: map[string]any{"action": map[string]any{"type": "HOLD"}, "soldierMemory": nil}},
		{name: "move direction invalid", method: "soldierBrain", value: map[string]any{"action": map[string]any{"type": "MOVE", "direction": "NORTH"}, "soldierMemory": nil}},
		{name: "turn to stone carries direction", method: "soldierBrain", value: map[string]any{"action": map[string]any{"type": "TURN_TO_STONE", "direction": "UP"}, "soldierMemory": nil}},
		{name: "action has unknown field", method: "soldierBrain", value: map[string]any{"action": map[string]any{"type": "TURN", "direction": "LEFT", "unknown": true}, "soldierMemory": nil}},
		{name: "soldier memory exceeds two KiB", method: "soldierBrain", value: map[string]any{"action": map[string]any{"type": "TURN_TO_STONE"}, "soldierMemory": strings.Repeat("m", 2*1_024)}},
	}

	for _, candidate := range cases {
		candidate := candidate
		t.Run(candidate.name, func(t *testing.T) {
			signedRequest := signedMutatedRuntimeInvocationRequestV117ForTest(t, requestBytes, identity, func(envelope map[string]any) {
				envelope["method"] = candidate.method
			})
			request, failure := verifyRuntimeInvocationRequestV117(signedRequest, identity)
			if failure != nil {
				t.Fatal(failure)
			}
			responseBytes := signedRuntimeInvocationResponseV117ForTest(t, request, map[string]any{
				"kind":  "success",
				"value": candidate.value,
				"trace": runtimeInvocationTraceV117ForRequest(request),
			}, identity)
			response, failure := verifyRuntimeInvocationResponseV117(responseBytes, request, identity)
			if response != nil || failure == nil || failure.Code != "OUTER_FRAME_UNDECODABLE" || failure.Retryable {
				t.Fatalf("signed malformed success reached authority: response=%+v failure=%+v", response, failure)
			}
		})
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
		"kind":    "system_failure",
		"failure": map[string]any{"code": "TRANSPORT_CRASH", "publicMessage": "Runtime system failure.", "retryable": true},
		"trace":   runtimeInvocationTraceV117ForRequest(request),
	}, identity)
	playerBytes := signedRuntimeInvocationResponseV117ForTest(t, request, map[string]any{
		"kind":      "player_violation",
		"violation": map[string]any{"code": "INVALID_OUTPUT", "publicMessage": "Strategy returned an invalid payload."},
		"trace":     runtimeInvocationTraceV117ForRequest(request),
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

func TestPhase258RuntimeInvocationV117UsesFiniteGoOwnedSignedBudgetRetryPolicy(t *testing.T) {
	requestBytes := readRuntimeInvocationV117Fixture(t, "runtime-execution-service-request.v1.17.candidate.json")
	identity := runtimeInvocationV117SigningIdentity{KeyID: runtimeInvocationV117FixtureKeyID, Secret: runtimeInvocationV117FixtureSecret}

	t.Run("candidate policy caps repeated system retries", func(t *testing.T) {
		request, failure := verifyRuntimeInvocationRequestV117(requestBytes, identity)
		if failure != nil {
			t.Fatal(failure)
		}
		systemBytes := signedRuntimeInvocationResponseV117ForTest(t, request, map[string]any{
			"kind":    "system_failure",
			"failure": map[string]any{"code": "TRANSPORT_CRASH", "publicMessage": "Runtime system failure.", "retryable": true},
			"trace":   runtimeInvocationTraceV117ForRequest(request),
		}, identity)
		calls := 0
		response, failure := executeRuntimeInvocationV117(context.Background(), requestBytes, identity, func(_ context.Context, _ []byte) ([]byte, error) {
			calls++
			return systemBytes, nil
		})
		if failure != nil || response == nil || response.Outcome.Kind != "system_failure" || calls != 3 {
			t.Fatalf("Go-owned retry ceiling drifted: response=%+v failure=%+v calls=%d", response, failure, calls)
		}
	})

	for _, candidate := range []struct {
		name       string
		maximum    int64
		attempt    int64
		wantCalls  int
		wantResult bool
	}{
		{name: "zero signed invocation maximum is rejected", maximum: 0, attempt: 0},
		{name: "over policy signed invocation maximum is rejected", maximum: 261, attempt: 0},
		{name: "maximum safe integer invocation maximum is rejected", maximum: 9_007_199_254_740_991, attempt: 0},
		{name: "attempt at signed maximum is rejected", maximum: 260, attempt: 260},
		{name: "maximum safe integer attempt is rejected", maximum: 260, attempt: 9_007_199_254_740_991},
		{name: "remaining signed budget limits calls", maximum: 1, attempt: 0, wantCalls: 1, wantResult: true},
	} {
		candidate := candidate
		t.Run(candidate.name, func(t *testing.T) {
			signedRequest := signedMutatedRuntimeInvocationRequestV117ForTest(t, requestBytes, identity, func(envelope map[string]any) {
				budget := envelope["budget"].(map[string]any)
				budget["matchCumulative"].(map[string]any)["invocationCountMaximum"] = runtimeInvocationV117JSONIntegerForTest(candidate.maximum)
				envelope["retry"].(map[string]any)["attempt"] = runtimeInvocationV117JSONIntegerForTest(candidate.attempt)
			})
			request, verifyFailure := verifyRuntimeInvocationRequestV117(signedRequest, identity)
			if verifyFailure != nil {
				t.Fatalf("signed fixture was not structurally valid: %+v", verifyFailure)
			}
			systemBytes := signedRuntimeInvocationResponseV117ForTest(t, request, map[string]any{
				"kind":    "system_failure",
				"failure": map[string]any{"code": "TRANSPORT_CRASH", "publicMessage": "Runtime system failure.", "retryable": true},
				"trace":   runtimeInvocationTraceV117ForRequest(request),
			}, identity)
			calls := 0
			response, failure := executeRuntimeInvocationV117(context.Background(), signedRequest, identity, func(_ context.Context, _ []byte) ([]byte, error) {
				calls++
				return systemBytes, nil
			})
			if calls != candidate.wantCalls {
				t.Fatalf("signed budget call limit drifted: want=%d got=%d", candidate.wantCalls, calls)
			}
			if candidate.wantResult {
				if failure != nil || response == nil || response.Outcome.Kind != "system_failure" {
					t.Fatalf("last in-budget result was not returned: response=%+v failure=%+v", response, failure)
				}
				return
			}
			if response != nil || failure == nil || failure.Code != "OUTER_FRAME_WRONG_BINDING" || failure.Retryable {
				t.Fatalf("invalid signed retry budget did not fail closed: response=%+v failure=%+v", response, failure)
			}
		})
	}

	t.Run("pre-cancelled context never reaches transport", func(t *testing.T) {
		ctx, cancel := context.WithCancel(context.Background())
		cancel()
		calls := 0
		response, failure := executeRuntimeInvocationV117(ctx, requestBytes, identity, func(_ context.Context, _ []byte) ([]byte, error) {
			calls++
			return nil, nil
		})
		if calls != 0 || response != nil || failure == nil || failure.Code != "AMBIGUOUS_ATTRIBUTION" || failure.Retryable {
			t.Fatalf("pre-cancelled invocation was not rejected: response=%+v failure=%+v calls=%d", response, failure, calls)
		}
	})

	t.Run("cancellation stops before a retry", func(t *testing.T) {
		request, failure := verifyRuntimeInvocationRequestV117(requestBytes, identity)
		if failure != nil {
			t.Fatal(failure)
		}
		systemBytes := signedRuntimeInvocationResponseV117ForTest(t, request, map[string]any{
			"kind":    "system_failure",
			"failure": map[string]any{"code": "TRANSPORT_CRASH", "publicMessage": "Runtime system failure.", "retryable": true},
			"trace":   runtimeInvocationTraceV117ForRequest(request),
		}, identity)
		ctx, cancel := context.WithCancel(context.Background())
		calls := 0
		response, failure := executeRuntimeInvocationV117(ctx, requestBytes, identity, func(_ context.Context, _ []byte) ([]byte, error) {
			calls++
			cancel()
			return systemBytes, nil
		})
		if calls != 1 || response != nil || failure == nil || failure.Code != "AMBIGUOUS_ATTRIBUTION" || failure.Retryable {
			t.Fatalf("cancellation did not stop retry: response=%+v failure=%+v calls=%d", response, failure, calls)
		}
	})
}
