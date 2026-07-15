package main

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
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
	requestBytes := readRuntimeInvocationV117Fixture(t, "runtime-invocation-request.v1.17.candidate.json")
	responseBytes := readRuntimeInvocationV117Fixture(t, "runtime-invocation-response.v1.17.candidate.wire.json")
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
	requestBytes := readRuntimeInvocationV117Fixture(t, "runtime-invocation-request.v1.17.candidate.json")
	identity := runtimeInvocationV117SigningIdentity{KeyID: runtimeInvocationV117FixtureKeyID, Secret: runtimeInvocationV117FixtureSecret}

	for _, mutation := range []struct {
		name string
		from []byte
		to   []byte
		code string
	}{
		{name: "unsigned budget", from: []byte(`"maximum":50`), to: []byte(`"maximum":51`), code: "OUTER_FRAME_UNAUTHENTICATED"},
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

	for _, candidate := range []struct {
		name   string
		mutate func(map[string]any)
	}{
		{
			name: "signed nested method budget drift",
			mutate: func(envelope map[string]any) {
				methodLimit := envelope["budget"].(map[string]any)["methodLimit"].(map[string]any)
				methodLimit["counters"].(map[string]any)["wallMilliseconds"].(map[string]any)["maximum"] = json.Number("51")
			},
		},
		{
			name: "signed accounting idempotency drift",
			mutate: func(envelope map[string]any) {
				envelope["accounting"].(map[string]any)["idempotencyKeySha256"] = "sha256:" + strings.Repeat("e", 64)
			},
		},
	} {
		candidate := candidate
		t.Run(candidate.name, func(t *testing.T) {
			envelope, parseFailure := runtimeInvocationV117ParseCanonicalEnvelope(requestBytes)
			if parseFailure != nil {
				t.Fatal(parseFailure)
			}
			candidate.mutate(envelope)
			authentication, err := runtimeInvocationV117Authenticate("request", runtimeInvocationV117WithoutProperty(envelope, "authentication"), identity)
			if err != nil {
				t.Fatal(err)
			}
			envelope["authentication"] = authentication
			signed, err := runtimeInvocationV117CanonicalValue(envelope)
			if err != nil {
				t.Fatal(err)
			}
			request, failure := verifyRuntimeInvocationRequestV117(signed, identity)
			if request != nil || failure == nil || failure.Code != "OUTER_FRAME_WRONG_BINDING" || failure.Retryable {
				t.Fatalf("signed request drift was admitted: request=%+v failure=%+v", request, failure)
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
	requestBytes := readRuntimeInvocationV117Fixture(t, "runtime-invocation-request.v1.17.candidate.json")
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
	requestBytes := readRuntimeInvocationV117Fixture(t, "runtime-invocation-request.v1.17.candidate.json")
	successBytes := readRuntimeInvocationV117Fixture(t, "runtime-invocation-response.v1.17.candidate.wire.json")
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
	result, failure := executeRuntimeInvocationV117(context.Background(), requestBytes, identity, func(_ context.Context, sent []byte) ([]byte, error) {
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
	result, failure = executeRuntimeInvocationV117(context.Background(), requestBytes, identity, func(_ context.Context, sent []byte) ([]byte, error) {
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
	requestBytes := readRuntimeInvocationV117Fixture(t, "runtime-invocation-request.v1.17.candidate.json")
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
		name          string
		method        string
		attempt       int64
		prestateCount int64
		prestate      map[string]any
		wantCalls     int
		wantResult    bool
	}{
		{name: "maximum safe integer attempt is rejected", attempt: 9_007_199_254_740_991},
		{name: "attempt two uses the final local retry", attempt: 2, wantCalls: 1, wantResult: true},
		{name: "attempt three exceeds the local retry policy", attempt: 3},
		{name: "attempt two hundred fifty nine exceeds the local retry policy", attempt: 259},
		{name: "one remaining Match invocation limits calls", method: "soldierBrain", prestateCount: 259, wantCalls: 1, wantResult: true},
		{name: "exhausted Match invocation budget rejects before transport", prestateCount: 260},
		{name: "select exact method boundary permits one call", prestate: runtimeInvocationV117ExecutionPrestateForMethodsForTest(19, 0), wantCalls: 1, wantResult: true},
		{name: "select one over method boundary rejects before transport", prestate: runtimeInvocationV117ExecutionPrestateForMethodsForTest(20, 0)},
		{name: "soldier exact method boundary permits one call", method: "soldierBrain", prestate: runtimeInvocationV117ExecutionPrestateForMethodsForTest(0, 239), wantCalls: 1, wantResult: true},
		{name: "soldier one over method boundary rejects before transport", method: "soldierBrain", prestate: runtimeInvocationV117ExecutionPrestateForMethodsForTest(0, 240)},
	} {
		candidate := candidate
		t.Run(candidate.name, func(t *testing.T) {
			signedRequest := signedMutatedRuntimeInvocationRequestV117ForTest(t, requestBytes, identity, func(envelope map[string]any) {
				if candidate.method != "" {
					envelope["method"] = candidate.method
				}
				envelope["retry"].(map[string]any)["attempt"] = runtimeInvocationV117JSONIntegerForTest(candidate.attempt)
				if candidate.prestate != nil {
					envelope["accounting"].(map[string]any)["prestate"] = candidate.prestate
				} else if candidate.prestateCount > 0 {
					envelope["accounting"].(map[string]any)["prestate"] = runtimeInvocationV117ExecutionPrestateForTest(candidate.prestateCount)
				}
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

	t.Run("cancellation after transport rejects success and player results", func(t *testing.T) {
		request, failure := verifyRuntimeInvocationRequestV117(requestBytes, identity)
		if failure != nil {
			t.Fatal(failure)
		}
		successBytes := readRuntimeInvocationV117Fixture(t, "runtime-invocation-response.v1.17.candidate.wire.json")
		playerBytes := signedRuntimeInvocationResponseV117ForTest(t, request, map[string]any{
			"kind": "player_violation",
			"violation": map[string]any{
				"code":          "INVALID_OUTPUT",
				"publicMessage": "Strategy returned an invalid payload.",
			},
			"trace": runtimeInvocationTraceV117ForRequest(request),
		}, identity)
		for _, candidate := range []struct {
			name    string
			payload []byte
		}{
			{name: "success", payload: successBytes},
			{name: "player violation", payload: playerBytes},
		} {
			candidate := candidate
			t.Run(candidate.name, func(t *testing.T) {
				ctx, cancel := context.WithCancel(context.Background())
				calls := 0
				response, failure := executeRuntimeInvocationV117(ctx, requestBytes, identity, func(_ context.Context, _ []byte) ([]byte, error) {
					calls++
					cancel()
					return candidate.payload, nil
				})
				if calls != 1 || response != nil || failure == nil || failure.Code != "AMBIGUOUS_ATTRIBUTION" || failure.Retryable {
					t.Fatalf("post-transport cancellation classified a result: response=%+v failure=%+v calls=%d", response, failure, calls)
				}
			})
		}
	})
}

func TestPhase258RuntimeInvocationV117GeneratedAuthoritySnapshotsCannotMutateLookup(t *testing.T) {
	historicalVersion := "runtime-execution-service-v1.16"
	original, ok := runtimeInvocationContractForVersion(historicalVersion)
	if !ok || !original.Historical || !original.Current {
		t.Fatalf("historical contract missing before mutation: %+v ok=%v", original, ok)
	}
	contracts := runtimeInvocationContractsSnapshot()
	contracts[historicalVersion] = runtimeInvocationContractDescriptor{}
	delete(contracts, "runtime-invocation-v1.17")
	after, ok := runtimeInvocationContractForVersion(historicalVersion)
	if !ok || after != original {
		t.Fatalf("caller mutation changed version dispatch: before=%+v after=%+v ok=%v", original, after, ok)
	}

	retryability := runtimeInvocationV117SystemFailureRetryabilitySnapshot()
	retryability["ADAPTER_CRASH"] = false
	delete(retryability, "OUTER_FRAME_MISSING")
	retryable, known := runtimeInvocationV117SystemFailureRetryable("ADAPTER_CRASH")
	if !known || !retryable {
		t.Fatalf("caller mutation changed retryability lookup: retryable=%v known=%v", retryable, known)
	}
	if retryable, known := runtimeInvocationV117SystemFailureRetryable("UNKNOWN"); known || retryable {
		t.Fatalf("unknown failure code did not fail closed: retryable=%v known=%v", retryable, known)
	}

	failureCodes := runtimeServiceContractFailureCodesSnapshot()
	expectedFailureCodes := []string{
		"MALFORMED_REQUEST",
		"SOURCE_HASH_MISMATCH",
		"SOURCE_BYTES_MISMATCH",
		"UNSUPPORTED_RUNTIME_ADAPTER",
		"MATCH_EXECUTION_FAILED",
		"CHRONICLE_INTEGRITY_FAILED",
		"EXECUTION_EXCEPTION",
		"RESPONSE_SCHEMA_INVALID",
		"EVIDENCE_STALE",
		"EVIDENCE_REVOKED",
		"EVIDENCE_IDENTITY_MISMATCH",
		"EVIDENCE_UNVERIFIABLE",
		"EVIDENCE_REGISTRY_DRIFT",
	}
	if len(failureCodes) != len(expectedFailureCodes) {
		t.Fatalf("historical failure-code cardinality drifted: want=%d got=%d", len(expectedFailureCodes), len(failureCodes))
	}
	for _, code := range expectedFailureCodes {
		if _, present := failureCodes[code]; !present || !isRuntimeServiceContractFailureCode(code) {
			t.Fatalf("historical failure-code truth table lost %q", code)
		}
	}
	delete(failureCodes, "MALFORMED_REQUEST")
	failureCodes["UNKNOWN"] = struct{}{}
	if !isRuntimeServiceContractFailureCode("MALFORMED_REQUEST") {
		t.Fatal("caller mutation removed a historical v1.16 failure code")
	}
	if isRuntimeServiceContractFailureCode("UNKNOWN") {
		t.Fatal("caller mutation admitted an unknown historical v1.16 failure code")
	}
}
