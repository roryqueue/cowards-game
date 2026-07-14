package main

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/binary"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"regexp"
	"strconv"
)

const runtimeInvocationV117ContractVersion = "runtime-invocation-v1.17"
const runtimeInvocationV117RuntimeABI = "strategy-runtime-abi-v1.17"
const runtimeInvocationV117CandidateStatus = "inactive-candidate"
const runtimeInvocationV117IdentityEvidenceBundle = "cowards-game:runtime-identity:v1:evidence-bundle"
const runtimeInvocationV117IdentitySemanticTuple = "cowards-game:runtime-identity:v1:semantic-tuple"
const runtimeInvocationV117IdentityBudgetProfile = "cowards-game:runtime-identity:v1:budget-profile"
const runtimeInvocationV117StrategyMemoryMaximumBytes = 32 * 1024
const runtimeInvocationV117SoldierMemoryMaximumBytes = 2 * 1024
const runtimeInvocationV117ObjectiveMaximumBytes = 1024
const runtimeInvocationV117OutputMaximumBytes = 256 * 1024
const runtimeInvocationV117CandidateRetryAttemptMaximum int64 = 3
const runtimeInvocationV117CandidateInvocationCountMaximum int64 = 260

type runtimeInvocationV117SigningIdentity struct {
	KeyID  string
	Secret string
}

type runtimeInvocationV117Authentication struct {
	Algorithm            string `json:"algorithm"`
	KeyID                string `json:"keyId"`
	SignatureInputSHA256 string `json:"signatureInputSha256"`
	Signature            string `json:"signature"`
}

type runtimeInvocationV117SemanticTuple struct {
	TupleID      string `json:"tupleId"`
	Rules        string `json:"rules"`
	Engine       string `json:"engine"`
	RuntimeABI   string `json:"runtimeAbi"`
	Chronicle    string `json:"chronicle"`
	ArenaCatalog string `json:"arenaCatalog"`
	SetPolicy    string `json:"setPolicy"`
}

type runtimeInvocationV117SourceIdentity struct {
	StrategyRevisionID     string `json:"strategyRevisionId"`
	OriginalSourceSHA256   string `json:"originalSourceSha256"`
	NormalizedSourceSHA256 string `json:"normalizedSourceSha256"`
	ArtifactSHA256         string `json:"artifactSha256"`
}

type runtimeInvocationV117MatchCumulativeBudget struct {
	InvocationCountMaximum int64  `json:"invocationCountMaximum"`
	WallMilliseconds       int64  `json:"wallMilliseconds"`
	ComputeFuel            int64  `json:"computeFuel"`
	PayloadBytes           int64  `json:"payloadBytes"`
	StdoutBytes            int64  `json:"stdoutBytes"`
	StderrBytes            int64  `json:"stderrBytes"`
	MemoryBytes            int64  `json:"memoryBytes"`
	Accounting             string `json:"accounting"`
	Overflow               string `json:"overflow"`
}

type runtimeInvocationV117Budget struct {
	ProfileID        string                                     `json:"profileId"`
	ProfileSHA256    string                                     `json:"profileSha256"`
	WallMilliseconds int64                                      `json:"wallMilliseconds"`
	ComputeFuel      int64                                      `json:"computeFuel"`
	MemoryBytes      int64                                      `json:"memoryBytes"`
	OutputBytes      int64                                      `json:"outputBytes"`
	ProcessLimit     int64                                      `json:"processLimit"`
	MatchCumulative  runtimeInvocationV117MatchCumulativeBudget `json:"matchCumulative"`
}

type runtimeInvocationV117Input struct {
	Value               any    `json:"value"`
	CanonicalSHA256     string `json:"canonicalSha256"`
	CanonicalByteLength int64  `json:"canonicalByteLength"`
}

type runtimeInvocationV117Retry struct {
	RetryID               string  `json:"retryId"`
	Attempt               int64   `json:"attempt"`
	PreviousRequestSHA256 *string `json:"previousRequestSha256"`
	IdentitySHA256        string  `json:"identitySha256"`
}

type runtimeInvocationRequestV117 struct {
	ContractVersion string                              `json:"contractVersion"`
	CandidateStatus string                              `json:"candidateStatus"`
	Current         bool                                `json:"current"`
	EnvelopeKind    string                              `json:"envelopeKind"`
	RequestID       string                              `json:"requestId"`
	InvocationID    string                              `json:"invocationId"`
	KernelRequestID string                              `json:"kernelRequestId"`
	Method          string                              `json:"method"`
	SemanticTuple   runtimeInvocationV117SemanticTuple  `json:"semanticTuple"`
	SourceIdentity  runtimeInvocationV117SourceIdentity `json:"sourceIdentity"`
	Budget          runtimeInvocationV117Budget         `json:"budget"`
	Input           runtimeInvocationV117Input          `json:"input"`
	Retry           runtimeInvocationV117Retry          `json:"retry"`
	Authentication  runtimeInvocationV117Authentication `json:"authentication"`
	RequestSHA256   string                              `json:"-"`
	canonicalBytes  []byte
	raw             map[string]any
}

type runtimeInvocationTraceV117 struct {
	RequestID           string   `json:"requestId"`
	InvocationID        string   `json:"invocationId"`
	KernelRequestID     string   `json:"kernelRequestId"`
	Method              string   `json:"method"`
	RequestSHA256       string   `json:"requestSha256"`
	BudgetProfileSHA256 string   `json:"budgetProfileSha256"`
	InputSHA256         string   `json:"inputSha256"`
	RetryIdentitySHA256 string   `json:"retryIdentitySha256"`
	SafeCodes           []string `json:"safeCodes"`
}

type runtimeInvocationV117Violation struct {
	Code          string `json:"code"`
	PublicMessage string `json:"publicMessage"`
}

type runtimeInvocationV117SystemFailure struct {
	Code          string `json:"code"`
	PublicMessage string `json:"publicMessage"`
	Retryable     bool   `json:"retryable"`
}

type runtimeInvocationOutcomeV117 struct {
	Kind      string                              `json:"kind"`
	Value     any                                 `json:"value,omitempty"`
	Violation *runtimeInvocationV117Violation     `json:"violation,omitempty"`
	Failure   *runtimeInvocationV117SystemFailure `json:"failure,omitempty"`
	Trace     runtimeInvocationTraceV117          `json:"trace"`
}

type runtimeInvocationRequestBindingV117 struct {
	RequestID           string `json:"requestId"`
	InvocationID        string `json:"invocationId"`
	KernelRequestID     string `json:"kernelRequestId"`
	Method              string `json:"method"`
	RequestSHA256       string `json:"requestSha256"`
	SemanticTupleID     string `json:"semanticTupleId"`
	RuntimeABIVersion   string `json:"runtimeAbiVersion"`
	StrategyRevisionID  string `json:"strategyRevisionId"`
	ArtifactSHA256      string `json:"artifactSha256"`
	BudgetProfileSHA256 string `json:"budgetProfileSha256"`
	InputSHA256         string `json:"inputSha256"`
	RetryIdentitySHA256 string `json:"retryIdentitySha256"`
}

type runtimeInvocationPayloadBindingV117 struct {
	SHA256              string `json:"sha256"`
	CanonicalByteLength int64  `json:"canonicalByteLength"`
}

type runtimeInvocationResponseV117 struct {
	ContractVersion string                               `json:"contractVersion"`
	CandidateStatus string                               `json:"candidateStatus"`
	Current         bool                                 `json:"current"`
	EnvelopeKind    string                               `json:"envelopeKind"`
	RequestBinding  runtimeInvocationRequestBindingV117  `json:"requestBinding"`
	Outcome         runtimeInvocationOutcomeV117         `json:"outcome"`
	PayloadBinding  *runtimeInvocationPayloadBindingV117 `json:"payloadBinding"`
	Authentication  runtimeInvocationV117Authentication  `json:"authentication"`
	raw             map[string]any
}

type runtimeInvocationV117Failure struct {
	Code          string
	PublicMessage string
	Retryable     bool
}

var runtimeInvocationV117PublicID = regexp.MustCompile(`^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$`)
var runtimeInvocationV117SHA256 = regexp.MustCompile(`^sha256:[0-9a-f]{64}$`)
var runtimeInvocationV117HMAC = regexp.MustCompile(`^hmac-sha256:[0-9a-f]{64}$`)
var runtimeInvocationV117SafeCode = regexp.MustCompile(`^[A-Z][A-Z0-9_]{0,63}$`)

func runtimeInvocationV117SHA256Value(bytes []byte) string {
	digest := sha256.Sum256(bytes)
	return "sha256:" + hex.EncodeToString(digest[:])
}

func runtimeInvocationV117FailureFor(code string) *runtimeInvocationV117Failure {
	retryable := runtimeInvocationV117SystemFailureRetryability[code]
	return &runtimeInvocationV117Failure{Code: code, PublicMessage: "Runtime system failure.", Retryable: retryable}
}

func runtimeInvocationV117Frame(domain string, segments ...[]byte) []byte {
	total := 8 + len(domain)
	for _, segment := range segments {
		total += 8 + len(segment)
	}
	framed := make([]byte, 0, total)
	appendSegment := func(segment []byte) {
		length := make([]byte, 8)
		binary.BigEndian.PutUint64(length, uint64(len(segment)))
		framed = append(framed, length...)
		framed = append(framed, segment...)
	}
	appendSegment([]byte(domain))
	for _, segment := range segments {
		appendSegment(segment)
	}
	return framed
}

func runtimeInvocationV117CanonicalValue(value any) ([]byte, error) {
	encoded, err := json.Marshal(value)
	if err != nil {
		return nil, err
	}
	decoded := decodeCanonicalJSONV11(encoded, canonicalJSONV11Options{
		Context:          canonicalJSONV11AuthenticatedOuterEnvelope,
		RequireCanonical: false,
	})
	if decoded.Error != nil {
		return nil, fmt.Errorf("canonical JSON: %s", decoded.Error.Code)
	}
	return decoded.CanonicalBytes, nil
}

func runtimeInvocationV117ParseCanonicalEnvelope(payload []byte) (map[string]any, *runtimeInvocationV117Failure) {
	if len(payload) == 0 {
		return nil, runtimeInvocationV117FailureFor("OUTER_FRAME_MISSING")
	}
	decoded := decodeCanonicalJSONV11(payload, canonicalJSONV11Options{
		Context:          canonicalJSONV11AuthenticatedOuterEnvelope,
		RequireCanonical: true,
	})
	if decoded.Error != nil {
		code := "OUTER_FRAME_UNDECODABLE"
		if decoded.Error.ByteOffset >= len(payload) {
			code = "OUTER_FRAME_TRUNCATED"
		}
		return nil, runtimeInvocationV117FailureFor(code)
	}
	decoder := json.NewDecoder(bytes.NewReader(decoded.CanonicalBytes))
	decoder.UseNumber()
	var value any
	if err := decoder.Decode(&value); err != nil {
		return nil, runtimeInvocationV117FailureFor("OUTER_FRAME_UNDECODABLE")
	}
	if _, err := decoder.Token(); err != io.EOF {
		return nil, runtimeInvocationV117FailureFor("OUTER_FRAME_UNDECODABLE")
	}
	object, ok := value.(map[string]any)
	if !ok {
		return nil, runtimeInvocationV117FailureFor("OUTER_FRAME_UNDECODABLE")
	}
	return object, nil
}

func runtimeInvocationV117ExactKeys(value map[string]any, keys ...string) bool {
	if len(value) != len(keys) {
		return false
	}
	for _, key := range keys {
		if _, ok := value[key]; !ok {
			return false
		}
	}
	return true
}

func runtimeInvocationV117Object(value any) (map[string]any, bool) {
	object, ok := value.(map[string]any)
	return object, ok
}

func runtimeInvocationV117String(value any, validate func(string) bool) (string, bool) {
	text, ok := value.(string)
	return text, ok && validate(text)
}

func runtimeInvocationV117ID(value any) (string, bool) {
	return runtimeInvocationV117String(value, runtimeInvocationV117PublicID.MatchString)
}

func runtimeInvocationV117Hash(value any) (string, bool) {
	return runtimeInvocationV117String(value, runtimeInvocationV117SHA256.MatchString)
}

func runtimeInvocationV117Integer(value any) (int64, bool) {
	number, ok := value.(json.Number)
	if !ok {
		return 0, false
	}
	parsed, err := strconv.ParseInt(number.String(), 10, 64)
	return parsed, err == nil && parsed >= 0 && parsed <= 9_007_199_254_740_991
}

func runtimeInvocationV117AuthenticationValid(value any) bool {
	authentication, ok := runtimeInvocationV117Object(value)
	if !ok || !runtimeInvocationV117ExactKeys(authentication, "algorithm", "keyId", "signatureInputSha256", "signature") {
		return false
	}
	algorithm, algorithmOK := authentication["algorithm"].(string)
	_, keyOK := runtimeInvocationV117ID(authentication["keyId"])
	_, inputOK := runtimeInvocationV117Hash(authentication["signatureInputSha256"])
	signature, signatureOK := authentication["signature"].(string)
	return algorithmOK && algorithm == "hmac-sha256" && keyOK && inputOK && signatureOK && runtimeInvocationV117HMAC.MatchString(signature)
}

func runtimeInvocationV117SemanticTupleValid(value any) bool {
	tuple, ok := runtimeInvocationV117Object(value)
	if !ok || !runtimeInvocationV117ExactKeys(tuple, "tupleId", "rules", "engine", "runtimeAbi", "chronicle", "arenaCatalog", "setPolicy") {
		return false
	}
	_, tupleIDOK := runtimeInvocationV117Hash(tuple["tupleId"])
	for _, key := range []string{"rules", "engine", "chronicle", "arenaCatalog", "setPolicy"} {
		if _, ok := runtimeInvocationV117ID(tuple[key]); !ok {
			return false
		}
	}
	runtimeABI, runtimeABIOK := tuple["runtimeAbi"].(string)
	return tupleIDOK && runtimeABIOK && runtimeABI == runtimeInvocationV117RuntimeABI
}

func runtimeInvocationV117SourceIdentityValid(value any) bool {
	identity, ok := runtimeInvocationV117Object(value)
	if !ok || !runtimeInvocationV117ExactKeys(identity, "strategyRevisionId", "originalSourceSha256", "normalizedSourceSha256", "artifactSha256") {
		return false
	}
	if _, ok := runtimeInvocationV117ID(identity["strategyRevisionId"]); !ok {
		return false
	}
	for _, key := range []string{"originalSourceSha256", "normalizedSourceSha256", "artifactSha256"} {
		if _, ok := runtimeInvocationV117Hash(identity[key]); !ok {
			return false
		}
	}
	return true
}

func runtimeInvocationV117BudgetValid(value any) bool {
	budget, ok := runtimeInvocationV117Object(value)
	if !ok || !runtimeInvocationV117ExactKeys(budget, "profileId", "profileSha256", "wallMilliseconds", "computeFuel", "memoryBytes", "outputBytes", "processLimit", "matchCumulative") {
		return false
	}
	if _, ok := runtimeInvocationV117ID(budget["profileId"]); !ok {
		return false
	}
	if _, ok := runtimeInvocationV117Hash(budget["profileSha256"]); !ok {
		return false
	}
	for _, key := range []string{"wallMilliseconds", "computeFuel", "memoryBytes", "outputBytes", "processLimit"} {
		if _, ok := runtimeInvocationV117Integer(budget[key]); !ok {
			return false
		}
	}
	cumulative, ok := runtimeInvocationV117Object(budget["matchCumulative"])
	if !ok || !runtimeInvocationV117ExactKeys(cumulative, "invocationCountMaximum", "wallMilliseconds", "computeFuel", "payloadBytes", "stdoutBytes", "stderrBytes", "memoryBytes", "accounting", "overflow") {
		return false
	}
	for _, key := range []string{"invocationCountMaximum", "wallMilliseconds", "computeFuel", "payloadBytes", "stdoutBytes", "stderrBytes", "memoryBytes"} {
		if _, ok := runtimeInvocationV117Integer(cumulative[key]); !ok {
			return false
		}
	}
	return cumulative["accounting"] == "signed-monotonic-per-invocation-deltas-plus-cumulative-total" && cumulative["overflow"] == "stop-before-next-invocation-and-classify-by-proven-cause"
}

func runtimeInvocationV117InputValid(value any) bool {
	input, ok := runtimeInvocationV117Object(value)
	if !ok || !runtimeInvocationV117ExactKeys(input, "value", "canonicalSha256", "canonicalByteLength") {
		return false
	}
	_, hashOK := runtimeInvocationV117Hash(input["canonicalSha256"])
	_, lengthOK := runtimeInvocationV117Integer(input["canonicalByteLength"])
	return hashOK && lengthOK
}

func runtimeInvocationV117RetryValid(value any) bool {
	retry, ok := runtimeInvocationV117Object(value)
	if !ok || !runtimeInvocationV117ExactKeys(retry, "retryId", "attempt", "previousRequestSha256", "identitySha256") {
		return false
	}
	_, retryIDOK := runtimeInvocationV117ID(retry["retryId"])
	_, attemptOK := runtimeInvocationV117Integer(retry["attempt"])
	_, identityOK := runtimeInvocationV117Hash(retry["identitySha256"])
	previousOK := retry["previousRequestSha256"] == nil
	if !previousOK {
		_, previousOK = runtimeInvocationV117Hash(retry["previousRequestSha256"])
	}
	return retryIDOK && attemptOK && identityOK && previousOK
}

func runtimeInvocationV117RequestShapeValid(request map[string]any) bool {
	if !runtimeInvocationV117ExactKeys(request,
		"contractVersion", "candidateStatus", "current", "envelopeKind",
		"requestId", "invocationId", "kernelRequestId", "method",
		"semanticTuple", "sourceIdentity", "budget", "input", "retry", "authentication",
	) {
		return false
	}
	if request["contractVersion"] != runtimeInvocationV117ContractVersion ||
		request["candidateStatus"] != runtimeInvocationV117CandidateStatus ||
		request["current"] != false || request["envelopeKind"] != "runtime-invocation-request" {
		return false
	}
	for _, key := range []string{"requestId", "invocationId", "kernelRequestId"} {
		if _, ok := runtimeInvocationV117ID(request[key]); !ok {
			return false
		}
	}
	method, methodOK := request["method"].(string)
	return methodOK && (method == "selectActivations" || method == "soldierBrain") &&
		runtimeInvocationV117SemanticTupleValid(request["semanticTuple"]) &&
		runtimeInvocationV117SourceIdentityValid(request["sourceIdentity"]) &&
		runtimeInvocationV117BudgetValid(request["budget"]) &&
		runtimeInvocationV117InputValid(request["input"]) &&
		runtimeInvocationV117RetryValid(request["retry"]) &&
		runtimeInvocationV117AuthenticationValid(request["authentication"])
}

func runtimeInvocationV117TraceValid(value any) bool {
	trace, ok := runtimeInvocationV117Object(value)
	if !ok || !runtimeInvocationV117ExactKeys(trace, "requestId", "invocationId", "kernelRequestId", "method", "requestSha256", "budgetProfileSha256", "inputSha256", "retryIdentitySha256", "safeCodes") {
		return false
	}
	for _, key := range []string{"requestId", "invocationId", "kernelRequestId"} {
		if _, ok := runtimeInvocationV117ID(trace[key]); !ok {
			return false
		}
	}
	method, methodOK := trace["method"].(string)
	if !methodOK || (method != "selectActivations" && method != "soldierBrain") {
		return false
	}
	for _, key := range []string{"requestSha256", "budgetProfileSha256", "inputSha256", "retryIdentitySha256"} {
		if _, ok := runtimeInvocationV117Hash(trace[key]); !ok {
			return false
		}
	}
	codes, ok := trace["safeCodes"].([]any)
	if !ok || len(codes) > 32 {
		return false
	}
	for _, code := range codes {
		text, ok := code.(string)
		if !ok || !runtimeInvocationV117SafeCode.MatchString(text) {
			return false
		}
	}
	return true
}

var runtimeInvocationV117ViolationMessages = map[string]string{
	"INVALID_OUTPUT":       "Strategy returned an invalid payload.",
	"TIMEOUT":              "Strategy exhausted its invocation budget.",
	"THROWN_EXCEPTION":     "Strategy threw an exception.",
	"FORBIDDEN_CAPABILITY": "Strategy attempted a forbidden capability.",
	"OVERSIZED_OUTPUT":     "Strategy exceeded its output budget.",
}

func runtimeInvocationV117CanonicalWithin(value any, maximumBytes int) bool {
	canonical, err := runtimeInvocationV117CanonicalValue(value)
	return err == nil && len(canonical) <= maximumBytes
}

func runtimeInvocationV117StrategyResultValid(payload map[string]any) bool {
	if !runtimeInvocationV117ExactKeys(payload, "activationOrders", "strategyMemory") ||
		!runtimeInvocationV117CanonicalWithin(payload["strategyMemory"], runtimeInvocationV117StrategyMemoryMaximumBytes) {
		return false
	}
	orders, ok := payload["activationOrders"].([]any)
	if !ok || len(orders) > canonicalJSONV11DefaultLimits.ArrayEntries {
		return false
	}
	for _, value := range orders {
		order, ok := runtimeInvocationV117Object(value)
		if !ok {
			return false
		}
		_, hasObjective := order["objective"]
		if (!hasObjective && !runtimeInvocationV117ExactKeys(order, "soldierId")) ||
			(hasObjective && !runtimeInvocationV117ExactKeys(order, "soldierId", "objective")) {
			return false
		}
		soldierID, ok := order["soldierId"].(string)
		if !ok || soldierID == "" {
			return false
		}
		if hasObjective && !runtimeInvocationV117CanonicalWithin(order["objective"], runtimeInvocationV117ObjectiveMaximumBytes) {
			return false
		}
	}
	return true
}

func runtimeInvocationV117ActionValid(value any) bool {
	action, ok := runtimeInvocationV117Object(value)
	if !ok {
		return false
	}
	actionType, ok := action["type"].(string)
	if !ok {
		return false
	}
	if actionType == "TURN_TO_STONE" {
		return runtimeInvocationV117ExactKeys(action, "type")
	}
	if (actionType != "MOVE" && actionType != "TURN") || !runtimeInvocationV117ExactKeys(action, "type", "direction") {
		return false
	}
	direction, ok := action["direction"].(string)
	return ok && (direction == "UP" || direction == "DOWN" || direction == "LEFT" || direction == "RIGHT")
}

func runtimeInvocationV117SoldierBrainResultValid(payload map[string]any) bool {
	return runtimeInvocationV117ExactKeys(payload, "action", "soldierMemory") &&
		runtimeInvocationV117ActionValid(payload["action"]) &&
		runtimeInvocationV117CanonicalWithin(payload["soldierMemory"], runtimeInvocationV117SoldierMemoryMaximumBytes)
}

func runtimeInvocationV117OutcomeValid(value any, method string) bool {
	outcome, ok := runtimeInvocationV117Object(value)
	if !ok {
		return false
	}
	kind, ok := outcome["kind"].(string)
	if !ok {
		return false
	}
	switch kind {
	case "success":
		if !runtimeInvocationV117ExactKeys(outcome, "kind", "value", "trace") || !runtimeInvocationV117TraceValid(outcome["trace"]) {
			return false
		}
		payload, ok := runtimeInvocationV117Object(outcome["value"])
		if !ok || !runtimeInvocationV117CanonicalWithin(payload, runtimeInvocationV117OutputMaximumBytes) {
			return false
		}
		if method == "selectActivations" {
			return runtimeInvocationV117StrategyResultValid(payload)
		}
		return runtimeInvocationV117SoldierBrainResultValid(payload)
	case "player_violation":
		if !runtimeInvocationV117ExactKeys(outcome, "kind", "violation", "trace") || !runtimeInvocationV117TraceValid(outcome["trace"]) {
			return false
		}
		violation, ok := runtimeInvocationV117Object(outcome["violation"])
		if !ok || !runtimeInvocationV117ExactKeys(violation, "code", "publicMessage") {
			return false
		}
		code, codeOK := violation["code"].(string)
		message, messageOK := violation["publicMessage"].(string)
		expected, known := runtimeInvocationV117ViolationMessages[code]
		return codeOK && messageOK && known && message == expected
	case "system_failure":
		if !runtimeInvocationV117ExactKeys(outcome, "kind", "failure", "trace") || !runtimeInvocationV117TraceValid(outcome["trace"]) {
			return false
		}
		failure, ok := runtimeInvocationV117Object(outcome["failure"])
		if !ok || !runtimeInvocationV117ExactKeys(failure, "code", "publicMessage", "retryable") {
			return false
		}
		code, codeOK := failure["code"].(string)
		message, messageOK := failure["publicMessage"].(string)
		retryable, retryableOK := failure["retryable"].(bool)
		expectedRetryable, known := runtimeInvocationV117SystemFailureRetryability[code]
		return codeOK && messageOK && retryableOK && known && message == "Runtime system failure." && retryable == expectedRetryable
	default:
		return false
	}
}

func runtimeInvocationV117RequestBindingValid(value any) bool {
	binding, ok := runtimeInvocationV117Object(value)
	if !ok || !runtimeInvocationV117ExactKeys(binding, "requestId", "invocationId", "kernelRequestId", "method", "requestSha256", "semanticTupleId", "runtimeAbiVersion", "strategyRevisionId", "artifactSha256", "budgetProfileSha256", "inputSha256", "retryIdentitySha256") {
		return false
	}
	for _, key := range []string{"requestId", "invocationId", "kernelRequestId", "strategyRevisionId"} {
		if _, ok := runtimeInvocationV117ID(binding[key]); !ok {
			return false
		}
	}
	method, methodOK := binding["method"].(string)
	if !methodOK || (method != "selectActivations" && method != "soldierBrain") || binding["runtimeAbiVersion"] != runtimeInvocationV117RuntimeABI {
		return false
	}
	for _, key := range []string{"requestSha256", "semanticTupleId", "artifactSha256", "budgetProfileSha256", "inputSha256", "retryIdentitySha256"} {
		if _, ok := runtimeInvocationV117Hash(binding[key]); !ok {
			return false
		}
	}
	return true
}

func runtimeInvocationV117PayloadBindingValid(value any) bool {
	binding, ok := runtimeInvocationV117Object(value)
	if !ok || !runtimeInvocationV117ExactKeys(binding, "sha256", "canonicalByteLength") {
		return false
	}
	_, hashOK := runtimeInvocationV117Hash(binding["sha256"])
	_, lengthOK := runtimeInvocationV117Integer(binding["canonicalByteLength"])
	return hashOK && lengthOK
}

func runtimeInvocationV117ResponseShapeValid(response map[string]any) bool {
	if !runtimeInvocationV117ExactKeys(response, "contractVersion", "candidateStatus", "current", "envelopeKind", "requestBinding", "outcome", "payloadBinding", "authentication") ||
		response["contractVersion"] != runtimeInvocationV117ContractVersion || response["candidateStatus"] != runtimeInvocationV117CandidateStatus || response["current"] != false || response["envelopeKind"] != "runtime-invocation-response" ||
		!runtimeInvocationV117RequestBindingValid(response["requestBinding"]) || !runtimeInvocationV117AuthenticationValid(response["authentication"]) {
		return false
	}
	binding := response["requestBinding"].(map[string]any)
	method, _ := binding["method"].(string)
	if !runtimeInvocationV117OutcomeValid(response["outcome"], method) {
		return false
	}
	outcome := response["outcome"].(map[string]any)
	if outcome["kind"] == "success" {
		return runtimeInvocationV117PayloadBindingValid(response["payloadBinding"])
	}
	return response["payloadBinding"] == nil
}

func runtimeInvocationV117WithoutProperty(value map[string]any, property string) map[string]any {
	result := make(map[string]any, len(value)-1)
	for key, entry := range value {
		if key != property {
			result[key] = entry
		}
	}
	return result
}

func runtimeInvocationV117IdentityHash(domain string, value any) (string, error) {
	canonical, err := runtimeInvocationV117CanonicalValue(value)
	if err != nil {
		return "", err
	}
	return runtimeInvocationV117SHA256Value(runtimeInvocationV117Frame(domain, canonical)), nil
}

func runtimeInvocationV117RetryIdentityHash(value any) (string, error) {
	canonical, err := runtimeInvocationV117CanonicalValue(value)
	if err != nil {
		return "", err
	}
	return runtimeInvocationV117SHA256Value(runtimeInvocationV117Frame(
		runtimeInvocationV117IdentityEvidenceBundle,
		[]byte("runtime-invocation-v1.17:retry-identity"),
		canonical,
	)), nil
}

func runtimeInvocationV117Authenticate(label string, unsigned map[string]any, identity runtimeInvocationV117SigningIdentity) (runtimeInvocationV117Authentication, error) {
	canonical, err := runtimeInvocationV117CanonicalValue(unsigned)
	if err != nil {
		return runtimeInvocationV117Authentication{}, err
	}
	input := runtimeInvocationV117Frame(
		runtimeInvocationV117IdentityEvidenceBundle,
		[]byte("runtime-invocation-v1.17:"+label),
		canonical,
	)
	digest := hmac.New(sha256.New, []byte(identity.Secret))
	_, _ = digest.Write(input)
	return runtimeInvocationV117Authentication{
		Algorithm:            "hmac-sha256",
		KeyID:                identity.KeyID,
		SignatureInputSHA256: runtimeInvocationV117SHA256Value(input),
		Signature:            "hmac-sha256:" + hex.EncodeToString(digest.Sum(nil)),
	}, nil
}

func runtimeInvocationV117AuthenticationMatches(label string, envelope map[string]any, identity runtimeInvocationV117SigningIdentity) bool {
	authentication, ok := runtimeInvocationV117Object(envelope["authentication"])
	if !ok || authentication["keyId"] != identity.KeyID {
		return false
	}
	expected, err := runtimeInvocationV117Authenticate(label, runtimeInvocationV117WithoutProperty(envelope, "authentication"), identity)
	if err != nil || authentication["signatureInputSha256"] != expected.SignatureInputSHA256 {
		return false
	}
	actual, actualOK := authentication["signature"].(string)
	if !actualOK || len(actual) != len(expected.Signature) {
		return false
	}
	return subtle.ConstantTimeCompare([]byte(actual), []byte(expected.Signature)) == 1
}

func runtimeInvocationV117DerivedRequestBindingsMatch(request map[string]any) bool {
	tuple := request["semanticTuple"].(map[string]any)
	expectedTuple, err := runtimeInvocationV117IdentityHash(
		runtimeInvocationV117IdentitySemanticTuple,
		runtimeInvocationV117WithoutProperty(tuple, "tupleId"),
	)
	if err != nil || tuple["tupleId"] != expectedTuple {
		return false
	}
	budget := request["budget"].(map[string]any)
	expectedBudget, err := runtimeInvocationV117IdentityHash(
		runtimeInvocationV117IdentityBudgetProfile,
		runtimeInvocationV117WithoutProperty(budget, "profileSha256"),
	)
	if err != nil || budget["profileSha256"] != expectedBudget {
		return false
	}
	input := request["input"].(map[string]any)
	inputBytes, err := runtimeInvocationV117CanonicalValue(input["value"])
	if err != nil || input["canonicalSha256"] != runtimeInvocationV117SHA256Value(inputBytes) {
		return false
	}
	inputLength, ok := runtimeInvocationV117Integer(input["canonicalByteLength"])
	if !ok || inputLength != int64(len(inputBytes)) {
		return false
	}
	retry := request["retry"].(map[string]any)
	expectedRetry, err := runtimeInvocationV117RetryIdentityHash(
		runtimeInvocationV117WithoutProperty(retry, "identitySha256"),
	)
	return err == nil && retry["identitySha256"] == expectedRetry
}

func runtimeInvocationV117DecodeInto(value map[string]any, target any) error {
	encoded, err := json.Marshal(value)
	if err != nil {
		return err
	}
	decoder := json.NewDecoder(bytes.NewReader(encoded))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(target); err != nil {
		return err
	}
	if _, err := decoder.Token(); err != io.EOF {
		return fmt.Errorf("trailing JSON token")
	}
	return nil
}

func verifyRuntimeInvocationRequestV117(bytes []byte, identity runtimeInvocationV117SigningIdentity) (*runtimeInvocationRequestV117, *runtimeInvocationV117Failure) {
	envelope, failure := runtimeInvocationV117ParseCanonicalEnvelope(bytes)
	if failure != nil {
		return nil, failure
	}
	if !runtimeInvocationV117RequestShapeValid(envelope) {
		return nil, runtimeInvocationV117FailureFor("OUTER_FRAME_UNDECODABLE")
	}
	if !runtimeInvocationV117AuthenticationMatches("request", envelope, identity) {
		return nil, runtimeInvocationV117FailureFor("OUTER_FRAME_UNAUTHENTICATED")
	}
	if !runtimeInvocationV117DerivedRequestBindingsMatch(envelope) {
		return nil, runtimeInvocationV117FailureFor("OUTER_FRAME_WRONG_BINDING")
	}
	var request runtimeInvocationRequestV117
	if err := runtimeInvocationV117DecodeInto(envelope, &request); err != nil {
		return nil, runtimeInvocationV117FailureFor("OUTER_FRAME_UNDECODABLE")
	}
	request.RequestSHA256 = runtimeInvocationV117SHA256Value(bytes)
	request.canonicalBytes = append([]byte(nil), bytes...)
	request.raw = envelope
	return &request, nil
}

func runtimeInvocationV117RequestBindingMap(request *runtimeInvocationRequestV117) map[string]any {
	return map[string]any{
		"requestId":           request.RequestID,
		"invocationId":        request.InvocationID,
		"kernelRequestId":     request.KernelRequestID,
		"method":              request.Method,
		"requestSha256":       request.RequestSHA256,
		"semanticTupleId":     request.SemanticTuple.TupleID,
		"runtimeAbiVersion":   request.SemanticTuple.RuntimeABI,
		"strategyRevisionId":  request.SourceIdentity.StrategyRevisionID,
		"artifactSha256":      request.SourceIdentity.ArtifactSHA256,
		"budgetProfileSha256": request.Budget.ProfileSHA256,
		"inputSha256":         request.Input.CanonicalSHA256,
		"retryIdentitySha256": request.Retry.IdentitySHA256,
	}
}

func runtimeInvocationTraceV117ForRequest(request *runtimeInvocationRequestV117) map[string]any {
	return map[string]any{
		"requestId":           request.RequestID,
		"invocationId":        request.InvocationID,
		"kernelRequestId":     request.KernelRequestID,
		"method":              request.Method,
		"requestSha256":       request.RequestSHA256,
		"budgetProfileSha256": request.Budget.ProfileSHA256,
		"inputSha256":         request.Input.CanonicalSHA256,
		"retryIdentitySha256": request.Retry.IdentitySHA256,
		"safeCodes":           []any{"ADAPTER_AUTHENTICATED", "PAYLOAD_CANONICAL"},
	}
}

func runtimeInvocationV117TraceMatchesRequest(value any, request *runtimeInvocationRequestV117) bool {
	trace, ok := runtimeInvocationV117Object(value)
	if !ok {
		return false
	}
	expected := runtimeInvocationTraceV117ForRequest(request)
	for _, key := range []string{"requestId", "invocationId", "kernelRequestId", "method", "requestSha256", "budgetProfileSha256", "inputSha256", "retryIdentitySha256"} {
		if trace[key] != expected[key] {
			return false
		}
	}
	return true
}

func runtimeInvocationV117CanonicalEqual(left any, right any) bool {
	leftBytes, leftErr := runtimeInvocationV117CanonicalValue(left)
	rightBytes, rightErr := runtimeInvocationV117CanonicalValue(right)
	return leftErr == nil && rightErr == nil && bytes.Equal(leftBytes, rightBytes)
}

func runtimeInvocationV117ResponseBindingsMatch(response map[string]any, request *runtimeInvocationRequestV117) bool {
	expectedBinding := runtimeInvocationV117RequestBindingMap(request)
	if !runtimeInvocationV117CanonicalEqual(response["requestBinding"], expectedBinding) {
		return false
	}
	outcome := response["outcome"].(map[string]any)
	if !runtimeInvocationV117TraceMatchesRequest(outcome["trace"], request) {
		return false
	}
	if outcome["kind"] == "success" {
		payloadBytes, err := runtimeInvocationV117CanonicalValue(outcome["value"])
		if err != nil {
			return false
		}
		payloadBinding := response["payloadBinding"].(map[string]any)
		length, ok := runtimeInvocationV117Integer(payloadBinding["canonicalByteLength"])
		return ok && length == int64(len(payloadBytes)) && payloadBinding["sha256"] == runtimeInvocationV117SHA256Value(payloadBytes)
	}
	return response["payloadBinding"] == nil
}

func verifyRuntimeInvocationResponseV117(payload []byte, request *runtimeInvocationRequestV117, identity runtimeInvocationV117SigningIdentity) (*runtimeInvocationResponseV117, *runtimeInvocationV117Failure) {
	if request == nil || !runtimeInvocationV117RequestShapeValid(request.raw) || !runtimeInvocationV117DerivedRequestBindingsMatch(request.raw) || !runtimeInvocationV117AuthenticationMatches("request", request.raw, identity) || runtimeInvocationV117SHA256Value(request.canonicalBytes) != request.RequestSHA256 {
		return nil, runtimeInvocationV117FailureFor("OUTER_FRAME_WRONG_BINDING")
	}
	recomputedRequest, err := runtimeInvocationV117CanonicalValue(request.raw)
	if err != nil || !bytes.Equal(recomputedRequest, request.canonicalBytes) {
		return nil, runtimeInvocationV117FailureFor("OUTER_FRAME_WRONG_BINDING")
	}
	envelope, failure := runtimeInvocationV117ParseCanonicalEnvelope(payload)
	if failure != nil {
		return nil, failure
	}
	if !runtimeInvocationV117ResponseShapeValid(envelope) {
		return nil, runtimeInvocationV117FailureFor("OUTER_FRAME_UNDECODABLE")
	}
	if !runtimeInvocationV117AuthenticationMatches("response", envelope, identity) {
		return nil, runtimeInvocationV117FailureFor("OUTER_FRAME_UNAUTHENTICATED")
	}
	if !runtimeInvocationV117ResponseBindingsMatch(envelope, request) {
		return nil, runtimeInvocationV117FailureFor("OUTER_FRAME_WRONG_BINDING")
	}
	var response runtimeInvocationResponseV117
	if err := runtimeInvocationV117DecodeInto(envelope, &response); err != nil {
		return nil, runtimeInvocationV117FailureFor("OUTER_FRAME_UNDECODABLE")
	}
	response.raw = envelope
	return &response, nil
}

type runtimeInvocationV117Transport func(context.Context, []byte) ([]byte, error)

func runtimeInvocationV117RetryAttemptLimit(request *runtimeInvocationRequestV117) (int, *runtimeInvocationV117Failure) {
	maximum := request.Budget.MatchCumulative.InvocationCountMaximum
	current := request.Retry.Attempt
	if maximum < 1 || maximum > runtimeInvocationV117CandidateInvocationCountMaximum || current < 0 || current >= maximum {
		return 0, runtimeInvocationV117FailureFor("OUTER_FRAME_WRONG_BINDING")
	}
	remaining := maximum - current
	if remaining > runtimeInvocationV117CandidateRetryAttemptMaximum {
		remaining = runtimeInvocationV117CandidateRetryAttemptMaximum
	}
	return int(remaining), nil
}

func runtimeInvocationV117ContextFailure(ctx context.Context) *runtimeInvocationV117Failure {
	if ctx == nil {
		return runtimeInvocationV117FailureFor("AMBIGUOUS_ATTRIBUTION")
	}
	select {
	case <-ctx.Done():
		return runtimeInvocationV117FailureFor("AMBIGUOUS_ATTRIBUTION")
	default:
		return nil
	}
}

func executeRuntimeInvocationV117(ctx context.Context, requestBytes []byte, identity runtimeInvocationV117SigningIdentity, transport runtimeInvocationV117Transport) (*runtimeInvocationResponseV117, *runtimeInvocationV117Failure) {
	pinnedBytes := append([]byte(nil), requestBytes...)
	request, failure := verifyRuntimeInvocationRequestV117(pinnedBytes, identity)
	if failure != nil {
		return nil, failure
	}
	maximumAttempts, failure := runtimeInvocationV117RetryAttemptLimit(request)
	if failure != nil {
		return nil, failure
	}
	for attempt := 0; attempt < maximumAttempts; attempt++ {
		if failure = runtimeInvocationV117ContextFailure(ctx); failure != nil {
			return nil, failure
		}
		responseBytes, err := transport(ctx, append([]byte(nil), pinnedBytes...))
		if err != nil {
			if failure = runtimeInvocationV117ContextFailure(ctx); failure != nil {
				return nil, failure
			}
			failure = runtimeInvocationV117FailureFor("TRANSPORT_CRASH")
			if attempt+1 < maximumAttempts {
				continue
			}
			return nil, failure
		}
		response, verifyFailure := verifyRuntimeInvocationResponseV117(responseBytes, request, identity)
		if verifyFailure != nil {
			if verifyFailure.Retryable && attempt+1 < maximumAttempts {
				continue
			}
			return nil, verifyFailure
		}
		if response.Outcome.Kind == "system_failure" && response.Outcome.Failure != nil && response.Outcome.Failure.Retryable && attempt+1 < maximumAttempts {
			continue
		}
		return response, nil
	}
	return nil, runtimeInvocationV117FailureFor("TRANSPORT_CRASH")
}
