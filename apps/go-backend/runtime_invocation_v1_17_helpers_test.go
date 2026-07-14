package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"
	"testing"
	"time"
)

func signedMutatedRuntimeInvocationRequestV117ForTest(
	t *testing.T,
	requestBytes []byte,
	identity runtimeInvocationV117SigningIdentity,
	mutate func(map[string]any),
) []byte {
	t.Helper()
	envelope, failure := runtimeInvocationV117ParseCanonicalEnvelope(requestBytes)
	if failure != nil {
		t.Fatal(failure)
	}
	mutate(envelope)
	method := envelope["method"].(string)
	envelope["budget"] = runtimeInvocationV117ExpectedBudgetMap(method)
	retry := envelope["retry"].(map[string]any)
	retryHash, err := runtimeInvocationV117RetryIdentityHash(
		runtimeInvocationV117WithoutProperty(retry, "identitySha256"),
	)
	if err != nil {
		t.Fatal(err)
	}
	retry["identitySha256"] = retryHash
	accounting := envelope["accounting"].(map[string]any)
	prestate := accounting["prestate"].(map[string]any)
	prestateSHA256, err := runtimeInvocationV117FramedValueHash("runtime-invocation-v1.17:execution-ledger-prestate", prestate)
	if err != nil {
		t.Fatal(err)
	}
	accounting["prestateSha256"] = prestateSHA256
	tuple := envelope["semanticTuple"].(map[string]any)
	source := envelope["sourceIdentity"].(map[string]any)
	budget := envelope["budget"].(map[string]any)
	input := envelope["input"].(map[string]any)
	requestIdentity, err := runtimeInvocationV117FramedValueHash("runtime-invocation-v1.17:execution-request-identity", map[string]any{
		"invocationId": envelope["invocationId"], "kernelRequestId": envelope["kernelRequestId"], "method": method,
		"semanticTupleId": tuple["tupleId"], "strategyRevisionId": source["strategyRevisionId"], "artifactSha256": source["artifactSha256"],
		"budgetProfileSha256": budget["profileSha256"], "inputSha256": input["canonicalSha256"], "prestateSha256": prestateSHA256,
	})
	if err != nil {
		t.Fatal(err)
	}
	accounting["requestIdentity"] = requestIdentity
	idempotencyKey, err := runtimeInvocationV117FramedValueHash("runtime-invocation-v1.17:execution-idempotency", map[string]any{
		"invocationId": envelope["invocationId"], "prestateRevision": prestate["revision"], "requestIdentity": requestIdentity,
	})
	if err != nil {
		t.Fatal(err)
	}
	accounting["idempotencyKeySha256"] = idempotencyKey
	accountingIdentity, err := runtimeInvocationV117FramedValueHash("runtime-invocation-v1.17:execution-accounting-request", runtimeInvocationV117WithoutProperty(accounting, "identitySha256"))
	if err != nil {
		t.Fatal(err)
	}
	accounting["identitySha256"] = accountingIdentity
	authentication, err := runtimeInvocationV117Authenticate(
		"request",
		runtimeInvocationV117WithoutProperty(envelope, "authentication"),
		identity,
	)
	if err != nil {
		t.Fatal(err)
	}
	envelope["authentication"] = authentication
	canonical, err := runtimeInvocationV117CanonicalValue(envelope)
	if err != nil {
		t.Fatal(err)
	}
	return canonical
}

func runtimeInvocationV117ReceiptForTest(t *testing.T, request *runtimeInvocationRequestV117, outcome map[string]any) map[string]any {
	t.Helper()
	prestate := request.raw["accounting"].(map[string]any)["prestate"].(map[string]any)
	cumulative := prestate["cumulative"].(map[string]any)
	measured := map[string]any{}
	for _, key := range []string{"wallMilliseconds", "computeFuel", "payloadBytes", "stdoutBytes", "stderrBytes"} {
		previous, ok := runtimeInvocationV117Integer(cumulative[key])
		if !ok {
			t.Fatalf("invalid prestate counter %s", key)
		}
		measured[key] = map[string]any{"status": "measured", "delta": int64(1), "cumulative": previous + 1}
	}
	if outcome["kind"] == "player_violation" {
		violation := outcome["violation"].(map[string]any)
		key, delta := "", int64(0)
		if violation["code"] == "TIMEOUT" {
			key, delta = "wallMilliseconds", 51
		} else if violation["code"] == "OVERSIZED_OUTPUT" {
			key, delta = "payloadBytes", 262_145
		}
		if key != "" {
			previous, _ := runtimeInvocationV117Integer(cumulative[key])
			measured[key] = map[string]any{"status": "measured", "delta": delta, "cumulative": previous + delta}
		}
	}
	previousMemory, _ := runtimeInvocationV117Integer(cumulative["memoryBytes"])
	revision, _ := runtimeInvocationV117Integer(prestate["revision"])
	attribution := "proven_strategy"
	if outcome["kind"] == "system_failure" {
		attribution = "ambiguous"
	}
	withoutIdentity := map[string]any{
		"domain": "execution", "prestateRevision": revision, "invocationId": request.InvocationID,
		"requestIdentity": request.Accounting.RequestIdentity, "method": request.Method, "attribution": attribution,
		"counters":           measured,
		"memory":             map[string]any{"status": "measured", "peakBytes": int64(1), "cumulativePeakBytes": max(previousMemory, int64(1))},
		"process":            map[string]any{"status": "verified", "processes": int64(1), "threads": int64(1), "children": int64(0)},
		"capabilities":       map[string]any{"status": "verified", "filesystem": "none", "network": "disabled", "environment": "empty", "shell": "disabled"},
		"cancellation":       map[string]any{"status": "verified", "terminationRequired": false, "receiptPresent": false, "graceMilliseconds": int64(0)},
		"accountingEvidence": map[string]any{"status": "verified", "signatureVerified": true, "monotonic": true},
	}
	evidenceIdentity, err := runtimeInvocationV117FramedValueHash("runtime-invocation-v1.17:execution-evidence", withoutIdentity)
	if err != nil {
		t.Fatal(err)
	}
	withoutIdentity["evidenceIdentity"] = evidenceIdentity
	return withoutIdentity
}

func runtimeInvocationV117ResponseAccountingForTest(t *testing.T, request *runtimeInvocationRequestV117, outcome map[string]any) map[string]any {
	t.Helper()
	receipt := runtimeInvocationV117ReceiptForTest(t, request, outcome)
	accounting, ok := runtimeInvocationV117DeriveResponseAccounting(request, outcome, receipt)
	if !ok {
		prestate := request.raw["accounting"].(map[string]any)["prestate"].(map[string]any)
		t.Fatalf("failed to derive response accounting: receiptValid=%v debit=%+v outcome=%v receipt=%v", runtimeInvocationV117ReceiptValid(receipt), runtimeInvocationV117DebitExecutionLedger(prestate, receipt), outcome["kind"], receipt)
	}
	return accounting
}

func runtimeInvocationV117JSONIntegerForTest(value int64) json.Number {
	return json.Number(strconv.FormatInt(value, 10))
}

func runtimeInvocationV117ExecutionPrestateForTest(count int64) map[string]any {
	selectCount := min(count, int64(20))
	soldierCount := count - selectCount
	commitments := make([]any, 0, count)
	for index := int64(0); index < count; index++ {
		scope := "selectActivations"
		if index >= selectCount {
			scope = "soldierBrain"
		}
		commitments = append(commitments, map[string]any{
			"identity":         fmt.Sprintf("prior-invocation:%03d", index),
			"requestIdentity":  "sha256:" + strings.Repeat("a", 64),
			"evidenceIdentity": "sha256:" + strings.Repeat("b", 64),
			"prestateRevision": index, "scope": scope, "outcome": "success", "dimensions": []any{},
		})
	}
	return map[string]any{
		"schemaVersion": "runtime-budget-ledger-v1", "domain": "execution", "revision": count,
		"methodInvocations": map[string]any{"selectActivations": selectCount, "soldierBrain": soldierCount},
		"cumulative": map[string]any{
			"invocationCount": count, "wallMilliseconds": int64(0), "computeFuel": int64(0), "payloadBytes": int64(0),
			"stdoutBytes": int64(0), "stderrBytes": int64(0), "memoryBytes": int64(0),
		},
		"commitments": commitments,
	}
}

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
		"accounting":      runtimeInvocationV117ResponseAccountingForTest(t, request, outcome),
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

func TestPhase258RuntimeInvocationV117AccountingIsBoundNoCommitAndReplayStable(t *testing.T) {
	requestBytes := readRuntimeInvocationV117Fixture(t, "runtime-execution-service-request.v1.17.candidate.json")
	responseBytes := readRuntimeInvocationV117Fixture(t, "runtime-execution-service-response.v1.17.candidate.wire.json")
	identity := runtimeInvocationV117SigningIdentity{KeyID: runtimeInvocationV117FixtureKeyID, Secret: runtimeInvocationV117FixtureSecret}
	request, failure := verifyRuntimeInvocationRequestV117(requestBytes, identity)
	if failure != nil {
		t.Fatal(failure)
	}

	first, failure := verifyRuntimeInvocationResponseV117(responseBytes, request, identity)
	if failure != nil {
		t.Fatal(failure)
	}
	second, failure := verifyRuntimeInvocationResponseV117(responseBytes, request, identity)
	if failure != nil || !runtimeInvocationV117CanonicalEqual(first.raw, second.raw) || !runtimeInvocationV117CanonicalEqual(first.Accounting, second.Accounting) {
		t.Fatalf("exact response replay drifted: first=%+v second=%+v failure=%+v", first, second, failure)
	}

	systemOutcome := map[string]any{
		"kind":    "system_failure",
		"failure": map[string]any{"code": "AMBIGUOUS_ATTRIBUTION", "publicMessage": "Runtime system failure.", "retryable": false},
		"trace":   runtimeInvocationTraceV117ForRequest(request),
	}
	systemBytes := signedRuntimeInvocationResponseV117ForTest(t, request, systemOutcome, identity)
	system, failure := verifyRuntimeInvocationResponseV117(systemBytes, request, identity)
	if failure != nil || system.Accounting["disposition"] != "no_commit" || !runtimeInvocationV117CanonicalEqual(system.Accounting["poststate"], request.raw["accounting"].(map[string]any)["prestate"]) {
		t.Fatalf("system failure mutated signed execution prestate: response=%+v failure=%+v", system, failure)
	}

	tampered, parseFailure := runtimeInvocationV117ParseCanonicalEnvelope(responseBytes)
	if parseFailure != nil {
		t.Fatal(parseFailure)
	}
	poststate := tampered["accounting"].(map[string]any)["poststate"].(map[string]any)
	poststate["cumulative"].(map[string]any)["wallMilliseconds"] = json.Number("2")
	authentication, err := runtimeInvocationV117Authenticate("response", runtimeInvocationV117WithoutProperty(tampered, "authentication"), identity)
	if err != nil {
		t.Fatal(err)
	}
	tampered["authentication"] = authentication
	tamperedBytes, err := runtimeInvocationV117CanonicalValue(tampered)
	if err != nil {
		t.Fatal(err)
	}
	response, failure := verifyRuntimeInvocationResponseV117(tamperedBytes, request, identity)
	if response != nil || failure == nil || failure.Code != "OUTER_FRAME_WRONG_BINDING" || failure.Retryable {
		t.Fatalf("signed accounting drift was admitted: response=%+v failure=%+v", response, failure)
	}
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
		"accounting": runtimeInvocationV117ResponseAccountingForTest(t, request, map[string]any{
			"kind": "success", "value": value, "trace": runtimeInvocationTraceV117ForRequest(request),
		}),
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
	_, failure = executeRuntimeInvocationV117(context.Background(), requestBytes, identity, func(_ context.Context, _ []byte) ([]byte, error) {
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
	response, failure := executeRuntimeInvocationV117(context.Background(), requestBytes, identity, func(_ context.Context, _ []byte) ([]byte, error) {
		calls++
		return ambiguousBytes, nil
	})
	if failure != nil || response == nil || response.Outcome.Kind != "system_failure" || response.Outcome.Failure == nil || response.Outcome.Failure.Retryable || calls != 1 {
		t.Fatalf("ambiguous attribution retried or changed ownership: response=%+v failure=%+v calls=%d", response, failure, calls)
	}
}

func TestPhase258CanonicalRetryPostgres(t *testing.T) {
	databaseURL := os.Getenv("COWARDS_GO_BACKEND_TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Fatal("COWARDS_GO_BACKEND_TEST_DATABASE_URL is required for TestPhase258CanonicalRetryPostgres")
	}
	ctx := context.Background()
	pool := semanticCurrentIsolatedPool(t, ctx, databaseURL)
	fixture := seedSemanticCurrentAuthority(t, ctx, pool, time.Date(2026, 7, 14, 16, 30, 0, 0, time.UTC))
	requestBytes := readRuntimeInvocationV117Fixture(t, "runtime-execution-service-request.v1.17.candidate.json")
	successBytes := readRuntimeInvocationV117Fixture(t, "runtime-execution-service-response.v1.17.candidate.wire.json")
	identity := runtimeInvocationV117SigningIdentity{KeyID: runtimeInvocationV117FixtureKeyID, Secret: runtimeInvocationV117FixtureSecret}
	request, failure := verifyRuntimeInvocationRequestV117(requestBytes, identity)
	if failure != nil {
		t.Fatal(failure)
	}

	signedSystem := func(code string, retryable bool) []byte {
		return signedRuntimeInvocationResponseV117ForTest(t, request, map[string]any{
			"kind": "system_failure",
			"failure": map[string]any{
				"code":          code,
				"publicMessage": "Runtime system failure.",
				"retryable":     retryable,
			},
			"trace": runtimeInvocationTraceV117ForRequest(request),
		}, identity)
	}
	signedPlayer := func(code string, publicMessage string) []byte {
		return signedRuntimeInvocationResponseV117ForTest(t, request, map[string]any{
			"kind": "player_violation",
			"violation": map[string]any{
				"code":          code,
				"publicMessage": publicMessage,
			},
			"trace": runtimeInvocationTraceV117ForRequest(request),
		}, identity)
	}

	type transportStep struct {
		payload []byte
		err     error
	}
	type retryCase struct {
		name            string
		request         []byte
		steps           []transportStep
		expectedCalls   int
		expectedOutcome string
		expectedFailure string
	}
	cases := []retryCase{
		{
			name: "proven timeout is one player-owned attempt", request: requestBytes,
			steps:         []transportStep{{payload: signedPlayer("TIMEOUT", "Strategy exhausted its invocation budget.")}},
			expectedCalls: 1, expectedOutcome: "player_violation",
		},
		{
			name: "adapter crash retries from identical bytes", request: requestBytes,
			steps:         []transportStep{{payload: signedSystem("ADAPTER_CRASH", true)}, {payload: successBytes}},
			expectedCalls: 2, expectedOutcome: "success",
		},
		{
			name: "transport error retries from identical bytes", request: requestBytes,
			steps:         []transportStep{{err: errors.New("fixture transport crash")}, {payload: successBytes}},
			expectedCalls: 2, expectedOutcome: "success",
		},
		{
			name: "malformed truncated envelope retries", request: requestBytes,
			steps:         []transportStep{{payload: []byte("{")}, {payload: successBytes}},
			expectedCalls: 2, expectedOutcome: "success",
		},
		{
			name: "unavailable accounting is ambiguous and nonretryable", request: requestBytes,
			steps:         []transportStep{{payload: signedSystem("AMBIGUOUS_ATTRIBUTION", false)}},
			expectedCalls: 1, expectedOutcome: "system_failure",
		},
		{
			name: "signed system transport crash retries", request: requestBytes,
			steps:         []transportStep{{payload: signedSystem("TRANSPORT_CRASH", true)}, {payload: successBytes}},
			expectedCalls: 2, expectedOutcome: "success",
		},
		{
			name: "invalid output is one player-owned attempt", request: requestBytes,
			steps:         []transportStep{{payload: signedPlayer("INVALID_OUTPUT", "Strategy returned an invalid payload.")}},
			expectedCalls: 1, expectedOutcome: "player_violation",
		},
	}
	staleRequest := bytes.Replace(requestBytes, []byte("sha256:dddddddd"), []byte("sha256:eeeeeeee"), 1)
	if bytes.Equal(staleRequest, requestBytes) {
		t.Fatal("stale artifact mutation marker missing")
	}
	cases = append(cases, retryCase{
		name: "stale artifact fails before transport", request: staleRequest,
		expectedCalls: 0, expectedFailure: "OUTER_FRAME_UNAUTHENTICATED",
	})

	for index, candidate := range cases {
		candidate := candidate
		t.Run(candidate.name, func(t *testing.T) {
			fixture.seedMatch(t, ctx, pool, "canonical-retry-"+strconv.Itoa(index))
			before := semanticCompletionSnapshot(t, ctx, pool)
			calls := 0
			response, failure := executeRuntimeInvocationV117(ctx, candidate.request, identity, func(_ context.Context, sent []byte) ([]byte, error) {
				if calls >= len(candidate.steps) {
					t.Fatalf("unexpected transport call %d", calls+1)
				}
				if !bytes.Equal(sent, requestBytes) {
					t.Fatalf("transport call %d did not receive exact pinned request bytes", calls+1)
				}
				step := candidate.steps[calls]
				calls++
				sent[0] ^= 0xff
				return step.payload, step.err
			})
			if calls != candidate.expectedCalls {
				t.Fatalf("unexpected call count: want=%d got=%d", candidate.expectedCalls, calls)
			}
			if candidate.expectedFailure != "" {
				if failure == nil || failure.Code != candidate.expectedFailure || failure.Retryable {
					t.Fatalf("unexpected failure: %+v", failure)
				}
			} else {
				if failure != nil || response == nil || response.Outcome.Kind != candidate.expectedOutcome {
					t.Fatalf("unexpected response/failure: response=%+v failure=%+v", response, failure)
				}
			}
			after := semanticCompletionSnapshot(t, ctx, pool)
			if !jsonValuesEqual(before, after) {
				t.Fatalf("runtime outcome mutated canonical gameplay, memory, result, standing, or idempotency state: before=%s after=%s", before, after)
			}
		})
	}
}
