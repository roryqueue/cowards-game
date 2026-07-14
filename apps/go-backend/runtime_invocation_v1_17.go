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
const runtimeInvocationV117BudgetProfileSHA256 = "sha256:13c061efc6954b7734b967177f07300b4c3c0dd18651b55510158b9a3c29c49f"

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

type runtimeInvocationV117CounterLimit struct {
	Semantics string `json:"semantics"`
	Maximum   int64  `json:"maximum"`
}

type runtimeInvocationV117MatchLimitCounters struct {
	InvocationCount  runtimeInvocationV117CounterLimit `json:"invocationCount"`
	WallMilliseconds runtimeInvocationV117CounterLimit `json:"wallMilliseconds"`
	ComputeFuel      runtimeInvocationV117CounterLimit `json:"computeFuel"`
	PayloadBytes     runtimeInvocationV117CounterLimit `json:"payloadBytes"`
	StdoutBytes      runtimeInvocationV117CounterLimit `json:"stdoutBytes"`
	StderrBytes      runtimeInvocationV117CounterLimit `json:"stderrBytes"`
}

type runtimeInvocationV117MatchLimit struct {
	MethodInvocations runtimeInvocationV117MethodInvocations  `json:"methodInvocations"`
	Counters          runtimeInvocationV117MatchLimitCounters `json:"counters"`
	Memory            runtimeInvocationV117MemoryLimit        `json:"memory"`
	Overflow          string                                  `json:"overflow"`
}

type runtimeInvocationV117MemoryLimit struct {
	Semantics    string `json:"semantics"`
	MaximumBytes int64  `json:"maximumBytes"`
}

type runtimeInvocationV117Budget struct {
	ProfileID     string                          `json:"profileId"`
	ProfileSHA256 string                          `json:"profileSha256"`
	MethodLimit   map[string]any                  `json:"methodLimit"`
	MatchLimit    runtimeInvocationV117MatchLimit `json:"matchLimit"`
}

type runtimeInvocationV117LedgerCommitment struct {
	Identity         string   `json:"identity"`
	RequestIdentity  string   `json:"requestIdentity"`
	EvidenceIdentity string   `json:"evidenceIdentity"`
	PrestateRevision int64    `json:"prestateRevision"`
	Scope            string   `json:"scope"`
	Outcome          string   `json:"outcome"`
	Dimensions       []string `json:"dimensions"`
}

type runtimeInvocationV117MethodInvocations struct {
	SelectActivations int64 `json:"selectActivations"`
	SoldierBrain      int64 `json:"soldierBrain"`
}

type runtimeInvocationV117LedgerCumulative struct {
	InvocationCount  int64 `json:"invocationCount"`
	WallMilliseconds int64 `json:"wallMilliseconds"`
	ComputeFuel      int64 `json:"computeFuel"`
	PayloadBytes     int64 `json:"payloadBytes"`
	StdoutBytes      int64 `json:"stdoutBytes"`
	StderrBytes      int64 `json:"stderrBytes"`
	MemoryBytes      int64 `json:"memoryBytes"`
}

type runtimeInvocationV117ExecutionLedger struct {
	SchemaVersion     string                                  `json:"schemaVersion"`
	Domain            string                                  `json:"domain"`
	Revision          int64                                   `json:"revision"`
	MethodInvocations runtimeInvocationV117MethodInvocations  `json:"methodInvocations"`
	Cumulative        runtimeInvocationV117LedgerCumulative   `json:"cumulative"`
	Commitments       []runtimeInvocationV117LedgerCommitment `json:"commitments"`
}

type runtimeInvocationRequestAccountingV117 struct {
	SchemaVersion        string                               `json:"schemaVersion"`
	Domain               string                               `json:"domain"`
	Prestate             runtimeInvocationV117ExecutionLedger `json:"prestate"`
	PrestateSHA256       string                               `json:"prestateSha256"`
	RequestIdentity      string                               `json:"requestIdentity"`
	IdempotencyKeySHA256 string                               `json:"idempotencyKeySha256"`
	IdentitySHA256       string                               `json:"identitySha256"`
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
	ContractVersion string                                 `json:"contractVersion"`
	CandidateStatus string                                 `json:"candidateStatus"`
	Current         bool                                   `json:"current"`
	EnvelopeKind    string                                 `json:"envelopeKind"`
	RequestID       string                                 `json:"requestId"`
	InvocationID    string                                 `json:"invocationId"`
	KernelRequestID string                                 `json:"kernelRequestId"`
	Method          string                                 `json:"method"`
	SemanticTuple   runtimeInvocationV117SemanticTuple     `json:"semanticTuple"`
	SourceIdentity  runtimeInvocationV117SourceIdentity    `json:"sourceIdentity"`
	Budget          runtimeInvocationV117Budget            `json:"budget"`
	Accounting      runtimeInvocationRequestAccountingV117 `json:"accounting"`
	Input           runtimeInvocationV117Input             `json:"input"`
	Retry           runtimeInvocationV117Retry             `json:"retry"`
	Authentication  runtimeInvocationV117Authentication    `json:"authentication"`
	RequestSHA256   string                                 `json:"-"`
	canonicalBytes  []byte
	raw             map[string]any
}

type runtimeInvocationTraceV117 struct {
	RequestID                string   `json:"requestId"`
	InvocationID             string   `json:"invocationId"`
	KernelRequestID          string   `json:"kernelRequestId"`
	Method                   string   `json:"method"`
	RequestSHA256            string   `json:"requestSha256"`
	BudgetProfileSHA256      string   `json:"budgetProfileSha256"`
	InputSHA256              string   `json:"inputSha256"`
	RetryIdentitySHA256      string   `json:"retryIdentitySha256"`
	AccountingIdentitySHA256 string   `json:"accountingIdentitySha256"`
	IdempotencyKeySHA256     string   `json:"idempotencyKeySha256"`
	SafeCodes                []string `json:"safeCodes"`
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
	RequestID                string `json:"requestId"`
	InvocationID             string `json:"invocationId"`
	KernelRequestID          string `json:"kernelRequestId"`
	Method                   string `json:"method"`
	RequestSHA256            string `json:"requestSha256"`
	SemanticTupleID          string `json:"semanticTupleId"`
	RuntimeABIVersion        string `json:"runtimeAbiVersion"`
	StrategyRevisionID       string `json:"strategyRevisionId"`
	ArtifactSHA256           string `json:"artifactSha256"`
	BudgetProfileSHA256      string `json:"budgetProfileSha256"`
	InputSHA256              string `json:"inputSha256"`
	RetryIdentitySHA256      string `json:"retryIdentitySha256"`
	AccountingIdentitySHA256 string `json:"accountingIdentitySha256"`
	IdempotencyKeySHA256     string `json:"idempotencyKeySha256"`
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
	Accounting      map[string]any                       `json:"accounting"`
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
	retryable, _ := runtimeInvocationV117SystemFailureRetryable(code)
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
	var parsed int64
	switch number := value.(type) {
	case json.Number:
		value, err := strconv.ParseInt(number.String(), 10, 64)
		if err != nil {
			return 0, false
		}
		parsed = value
	case int64:
		parsed = number
	case int:
		parsed = int64(number)
	default:
		return 0, false
	}
	return parsed, parsed >= 0 && parsed <= 9_007_199_254_740_991
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

func runtimeInvocationV117ExpectedBudgetMap(method string) map[string]any {
	methodMaximum := int64(20)
	if method == "soldierBrain" {
		methodMaximum = 240
	}
	counter := func(maximum int64) map[string]any {
		return map[string]any{"semantics": "counter", "maximum": maximum}
	}
	return map[string]any{
		"profileId":     "runtime-budget-profile-v1.17-candidate",
		"profileSha256": runtimeInvocationV117BudgetProfileSHA256,
		"methodLimit": map[string]any{
			"method":                 method,
			"invocationCountMaximum": methodMaximum,
			"counters": map[string]any{
				"wallMilliseconds": counter(50), "computeFuel": counter(10_000_000),
				"payloadBytes": counter(262_144), "stdoutBytes": counter(262_144), "stderrBytes": counter(65_536),
			},
			"memory":             map[string]any{"semantics": "peak", "maximumBytes": int64(67_108_864)},
			"process":            map[string]any{"semantics": "predicate", "processes": int64(1), "threads": int64(1), "children": int64(0)},
			"capabilities":       map[string]any{"semantics": "predicate", "filesystem": "none", "network": "disabled", "environment": "empty", "shell": "disabled"},
			"cancellation":       map[string]any{"semantics": "predicate", "terminationGraceMilliseconds": int64(100), "evidence": "adapter-termination-receipt-required"},
			"accountingEvidence": map[string]any{"semantics": "predicate", "required": true},
		},
		"matchLimit": map[string]any{
			"methodInvocations": map[string]any{"selectActivations": int64(20), "soldierBrain": int64(240)},
			"counters": map[string]any{
				"invocationCount": counter(260), "wallMilliseconds": counter(13_000), "computeFuel": counter(2_600_000_000),
				"payloadBytes": counter(68_157_440), "stdoutBytes": counter(68_157_440), "stderrBytes": counter(17_039_360),
			},
			"memory":   map[string]any{"semantics": "peak", "maximumBytes": int64(67_108_864)},
			"overflow": "stop-before-next-invocation-and-classify-by-proven-cause",
		},
	}
}

func runtimeInvocationV117BudgetValid(value any, method string) bool {
	budget, ok := runtimeInvocationV117Object(value)
	if !ok || !runtimeInvocationV117ExactKeys(budget, "profileId", "profileSha256", "methodLimit", "matchLimit") {
		return false
	}
	if _, ok := runtimeInvocationV117ID(budget["profileId"]); !ok {
		return false
	}
	if _, ok := runtimeInvocationV117Hash(budget["profileSha256"]); !ok {
		return false
	}
	counterLimit := func(value any) bool {
		counter, ok := runtimeInvocationV117Object(value)
		if !ok || !runtimeInvocationV117ExactKeys(counter, "semantics", "maximum") || counter["semantics"] != "counter" {
			return false
		}
		_, ok = runtimeInvocationV117Integer(counter["maximum"])
		return ok
	}
	memoryLimit := func(value any) bool {
		memory, ok := runtimeInvocationV117Object(value)
		if !ok || !runtimeInvocationV117ExactKeys(memory, "semantics", "maximumBytes") || memory["semantics"] != "peak" {
			return false
		}
		_, ok = runtimeInvocationV117Integer(memory["maximumBytes"])
		return ok
	}
	methodLimit, ok := runtimeInvocationV117Object(budget["methodLimit"])
	if !ok || !runtimeInvocationV117ExactKeys(methodLimit, "method", "invocationCountMaximum", "counters", "memory", "process", "capabilities", "cancellation", "accountingEvidence") || methodLimit["method"] != method {
		return false
	}
	if _, ok := runtimeInvocationV117Integer(methodLimit["invocationCountMaximum"]); !ok || !memoryLimit(methodLimit["memory"]) {
		return false
	}
	methodCounters, ok := runtimeInvocationV117Object(methodLimit["counters"])
	if !ok || !runtimeInvocationV117ExactKeys(methodCounters, "wallMilliseconds", "computeFuel", "payloadBytes", "stdoutBytes", "stderrBytes") {
		return false
	}
	for _, key := range []string{"wallMilliseconds", "computeFuel", "payloadBytes", "stdoutBytes", "stderrBytes"} {
		if !counterLimit(methodCounters[key]) {
			return false
		}
	}
	process, ok := runtimeInvocationV117Object(methodLimit["process"])
	if !ok || !runtimeInvocationV117ExactKeys(process, "semantics", "processes", "threads", "children") || process["semantics"] != "predicate" {
		return false
	}
	for _, key := range []string{"processes", "threads", "children"} {
		if _, ok := runtimeInvocationV117Integer(process[key]); !ok {
			return false
		}
	}
	capabilities, ok := runtimeInvocationV117Object(methodLimit["capabilities"])
	if !ok || !runtimeInvocationV117ExactKeys(capabilities, "semantics", "filesystem", "network", "environment", "shell") || capabilities["semantics"] != "predicate" {
		return false
	}
	for _, key := range []string{"filesystem", "network", "environment", "shell"} {
		if _, ok := runtimeInvocationV117ID(capabilities[key]); !ok {
			return false
		}
	}
	cancellation, ok := runtimeInvocationV117Object(methodLimit["cancellation"])
	if !ok || !runtimeInvocationV117ExactKeys(cancellation, "semantics", "terminationGraceMilliseconds", "evidence") || cancellation["semantics"] != "predicate" {
		return false
	}
	if _, ok := runtimeInvocationV117Integer(cancellation["terminationGraceMilliseconds"]); !ok {
		return false
	}
	if _, ok := runtimeInvocationV117ID(cancellation["evidence"]); !ok {
		return false
	}
	accountingEvidence, ok := runtimeInvocationV117Object(methodLimit["accountingEvidence"])
	if !ok || !runtimeInvocationV117ExactKeys(accountingEvidence, "semantics", "required") || accountingEvidence["semantics"] != "predicate" || accountingEvidence["required"] != true {
		return false
	}
	matchLimit, ok := runtimeInvocationV117Object(budget["matchLimit"])
	if !ok || !runtimeInvocationV117ExactKeys(matchLimit, "methodInvocations", "counters", "memory", "overflow") || !memoryLimit(matchLimit["memory"]) || matchLimit["overflow"] != "stop-before-next-invocation-and-classify-by-proven-cause" {
		return false
	}
	methodInvocations, ok := runtimeInvocationV117Object(matchLimit["methodInvocations"])
	if !ok || !runtimeInvocationV117ExactKeys(methodInvocations, "selectActivations", "soldierBrain") {
		return false
	}
	for _, key := range []string{"selectActivations", "soldierBrain"} {
		if _, ok := runtimeInvocationV117Integer(methodInvocations[key]); !ok {
			return false
		}
	}
	matchCounters, ok := runtimeInvocationV117Object(matchLimit["counters"])
	if !ok || !runtimeInvocationV117ExactKeys(matchCounters, "invocationCount", "wallMilliseconds", "computeFuel", "payloadBytes", "stdoutBytes", "stderrBytes") {
		return false
	}
	for _, key := range []string{"invocationCount", "wallMilliseconds", "computeFuel", "payloadBytes", "stdoutBytes", "stderrBytes"} {
		if !counterLimit(matchCounters[key]) {
			return false
		}
	}
	return true
}

func runtimeInvocationV117CommitmentValid(value any, index int) bool {
	commitment, ok := runtimeInvocationV117Object(value)
	if !ok || !runtimeInvocationV117ExactKeys(commitment, "identity", "requestIdentity", "evidenceIdentity", "prestateRevision", "scope", "outcome", "dimensions") {
		return false
	}
	identity, identityOK := runtimeInvocationV117ID(commitment["identity"])
	_, requestOK := runtimeInvocationV117Hash(commitment["requestIdentity"])
	_, evidenceOK := runtimeInvocationV117Hash(commitment["evidenceIdentity"])
	revision, revisionOK := runtimeInvocationV117Integer(commitment["prestateRevision"])
	scope, scopeOK := commitment["scope"].(string)
	outcome, outcomeOK := commitment["outcome"].(string)
	dimensions, dimensionsOK := commitment["dimensions"].([]any)
	if !identityOK || identity == "" || !requestOK || !evidenceOK || !revisionOK || revision != int64(index) || !scopeOK || (scope != "selectActivations" && scope != "soldierBrain") || !outcomeOK || (outcome != "success" && outcome != "player_violation") || !dimensionsOK || len(dimensions) > 32 {
		return false
	}
	seen := map[string]bool{}
	for _, value := range dimensions {
		dimension, ok := value.(string)
		if !ok || len(dimension) == 0 || len(dimension) > 128 || seen[dimension] {
			return false
		}
		seen[dimension] = true
	}
	return (outcome == "success" && len(dimensions) == 0) || (outcome == "player_violation" && len(dimensions) > 0)
}

func runtimeInvocationV117ExecutionLedgerShapeValid(value any) bool {
	ledger, ok := runtimeInvocationV117Object(value)
	if !ok || !runtimeInvocationV117ExactKeys(ledger, "schemaVersion", "domain", "revision", "methodInvocations", "cumulative", "commitments") || ledger["schemaVersion"] != "runtime-budget-ledger-v1" || ledger["domain"] != "execution" {
		return false
	}
	_, revisionOK := runtimeInvocationV117Integer(ledger["revision"])
	methods, methodsOK := runtimeInvocationV117Object(ledger["methodInvocations"])
	cumulative, cumulativeOK := runtimeInvocationV117Object(ledger["cumulative"])
	commitments, commitmentsOK := ledger["commitments"].([]any)
	if !revisionOK || !methodsOK || !runtimeInvocationV117ExactKeys(methods, "selectActivations", "soldierBrain") || !cumulativeOK || !runtimeInvocationV117ExactKeys(cumulative, "invocationCount", "wallMilliseconds", "computeFuel", "payloadBytes", "stdoutBytes", "stderrBytes", "memoryBytes") || !commitmentsOK || len(commitments) > 1024 {
		return false
	}
	for _, key := range []string{"selectActivations", "soldierBrain"} {
		if _, ok := runtimeInvocationV117Integer(methods[key]); !ok {
			return false
		}
	}
	for _, key := range []string{"invocationCount", "wallMilliseconds", "computeFuel", "payloadBytes", "stdoutBytes", "stderrBytes", "memoryBytes"} {
		if _, ok := runtimeInvocationV117Integer(cumulative[key]); !ok {
			return false
		}
	}
	for index, commitmentValue := range commitments {
		if !runtimeInvocationV117CommitmentValid(commitmentValue, index) {
			return false
		}
	}
	return true
}

func runtimeInvocationV117ExecutionLedgerValid(value any, nextInvocationID string) bool {
	if !runtimeInvocationV117ExecutionLedgerShapeValid(value) {
		return false
	}
	ledger := value.(map[string]any)
	revision, _ := runtimeInvocationV117Integer(ledger["revision"])
	methods := ledger["methodInvocations"].(map[string]any)
	cumulative := ledger["cumulative"].(map[string]any)
	commitments := ledger["commitments"].([]any)
	if revision != int64(len(commitments)) {
		return false
	}
	selectCount, _ := runtimeInvocationV117Integer(methods["selectActivations"])
	soldierCount, _ := runtimeInvocationV117Integer(methods["soldierBrain"])
	limits := map[string]int64{"invocationCount": 260, "wallMilliseconds": 13_000, "computeFuel": 2_600_000_000, "payloadBytes": 68_157_440, "stdoutBytes": 68_157_440, "stderrBytes": 17_039_360, "memoryBytes": 67_108_864}
	counters := map[string]int64{}
	for key, maximum := range limits {
		counter, _ := runtimeInvocationV117Integer(cumulative[key])
		if counter > maximum {
			return false
		}
		counters[key] = counter
	}
	if selectCount > 20 || soldierCount > 240 || selectCount+soldierCount != revision || counters["invocationCount"] != revision {
		return false
	}
	seen := map[string]bool{}
	actualSelect, actualSoldier := int64(0), int64(0)
	for _, commitmentValue := range commitments {
		commitment := commitmentValue.(map[string]any)
		identity := commitment["identity"].(string)
		if seen[identity] || identity == nextInvocationID {
			return false
		}
		seen[identity] = true
		if commitment["scope"] == "selectActivations" {
			actualSelect++
		} else {
			actualSoldier++
		}
	}
	return actualSelect == selectCount && actualSoldier == soldierCount
}

func runtimeInvocationV117RequestAccountingValid(value any, invocationID string) bool {
	accounting, ok := runtimeInvocationV117Object(value)
	if !ok || !runtimeInvocationV117ExactKeys(accounting, "schemaVersion", "domain", "prestate", "prestateSha256", "requestIdentity", "idempotencyKeySha256", "identitySha256") || accounting["schemaVersion"] != "runtime-invocation-accounting-v1.17" || accounting["domain"] != "execution" || !runtimeInvocationV117ExecutionLedgerShapeValid(accounting["prestate"]) {
		return false
	}
	for _, key := range []string{"prestateSha256", "requestIdentity", "idempotencyKeySha256", "identitySha256"} {
		if _, ok := runtimeInvocationV117Hash(accounting[key]); !ok {
			return false
		}
	}
	return true
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
		"semanticTuple", "sourceIdentity", "budget", "accounting", "input", "retry", "authentication",
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
	invocationID, invocationOK := request["invocationId"].(string)
	return methodOK && (method == "selectActivations" || method == "soldierBrain") &&
		invocationOK &&
		runtimeInvocationV117SemanticTupleValid(request["semanticTuple"]) &&
		runtimeInvocationV117SourceIdentityValid(request["sourceIdentity"]) &&
		runtimeInvocationV117BudgetValid(request["budget"], method) &&
		runtimeInvocationV117RequestAccountingValid(request["accounting"], invocationID) &&
		runtimeInvocationV117InputValid(request["input"]) &&
		runtimeInvocationV117RetryValid(request["retry"]) &&
		runtimeInvocationV117AuthenticationValid(request["authentication"])
}

func runtimeInvocationV117TraceValid(value any) bool {
	trace, ok := runtimeInvocationV117Object(value)
	if !ok || !runtimeInvocationV117ExactKeys(trace, "requestId", "invocationId", "kernelRequestId", "method", "requestSha256", "budgetProfileSha256", "inputSha256", "retryIdentitySha256", "accountingIdentitySha256", "idempotencyKeySha256", "safeCodes") {
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
	for _, key := range []string{"requestSha256", "budgetProfileSha256", "inputSha256", "retryIdentitySha256", "accountingIdentitySha256", "idempotencyKeySha256"} {
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
		expectedRetryable, known := runtimeInvocationV117SystemFailureRetryable(code)
		return codeOK && messageOK && retryableOK && known && message == "Runtime system failure." && retryable == expectedRetryable
	default:
		return false
	}
}

func runtimeInvocationV117RequestBindingValid(value any) bool {
	binding, ok := runtimeInvocationV117Object(value)
	if !ok || !runtimeInvocationV117ExactKeys(binding, "requestId", "invocationId", "kernelRequestId", "method", "requestSha256", "semanticTupleId", "runtimeAbiVersion", "strategyRevisionId", "artifactSha256", "budgetProfileSha256", "inputSha256", "retryIdentitySha256", "accountingIdentitySha256", "idempotencyKeySha256") {
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
	for _, key := range []string{"requestSha256", "semanticTupleId", "artifactSha256", "budgetProfileSha256", "inputSha256", "retryIdentitySha256", "accountingIdentitySha256", "idempotencyKeySha256"} {
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

func runtimeInvocationV117UnavailableEvidence(value map[string]any) bool {
	return runtimeInvocationV117ExactKeys(value, "status") && (value["status"] == "unavailable" || value["status"] == "ambiguous")
}

func runtimeInvocationV117CounterEvidenceValid(value any) bool {
	evidence, ok := runtimeInvocationV117Object(value)
	if !ok {
		return false
	}
	if runtimeInvocationV117UnavailableEvidence(evidence) {
		return true
	}
	if !runtimeInvocationV117ExactKeys(evidence, "status", "delta", "cumulative") || evidence["status"] != "measured" {
		return false
	}
	_, deltaOK := runtimeInvocationV117Integer(evidence["delta"])
	_, cumulativeOK := runtimeInvocationV117Integer(evidence["cumulative"])
	return deltaOK && cumulativeOK
}

func runtimeInvocationV117ReceiptValid(value any) bool {
	receipt, ok := runtimeInvocationV117Object(value)
	if !ok || !runtimeInvocationV117ExactKeys(receipt, "domain", "prestateRevision", "invocationId", "requestIdentity", "evidenceIdentity", "method", "attribution", "counters", "memory", "process", "capabilities", "cancellation", "accountingEvidence") || receipt["domain"] != "execution" {
		return false
	}
	_, revisionOK := runtimeInvocationV117Integer(receipt["prestateRevision"])
	_, invocationOK := runtimeInvocationV117ID(receipt["invocationId"])
	_, requestOK := runtimeInvocationV117Hash(receipt["requestIdentity"])
	_, evidenceOK := runtimeInvocationV117Hash(receipt["evidenceIdentity"])
	method, methodOK := receipt["method"].(string)
	attribution, attributionOK := receipt["attribution"].(string)
	if !revisionOK || !invocationOK || !requestOK || !evidenceOK || !methodOK || (method != "selectActivations" && method != "soldierBrain") || !attributionOK || (attribution != "proven_strategy" && attribution != "host" && attribution != "ambiguous") {
		return false
	}
	counters, ok := runtimeInvocationV117Object(receipt["counters"])
	if !ok || !runtimeInvocationV117ExactKeys(counters, "wallMilliseconds", "computeFuel", "payloadBytes", "stdoutBytes", "stderrBytes") {
		return false
	}
	for _, key := range []string{"wallMilliseconds", "computeFuel", "payloadBytes", "stdoutBytes", "stderrBytes"} {
		if !runtimeInvocationV117CounterEvidenceValid(counters[key]) {
			return false
		}
	}
	memory, ok := runtimeInvocationV117Object(receipt["memory"])
	if !ok {
		return false
	}
	if !runtimeInvocationV117UnavailableEvidence(memory) {
		if !runtimeInvocationV117ExactKeys(memory, "status", "peakBytes", "cumulativePeakBytes") || memory["status"] != "measured" {
			return false
		}
		if _, ok := runtimeInvocationV117Integer(memory["peakBytes"]); !ok {
			return false
		}
		if _, ok := runtimeInvocationV117Integer(memory["cumulativePeakBytes"]); !ok {
			return false
		}
	}
	process, ok := runtimeInvocationV117Object(receipt["process"])
	if !ok {
		return false
	}
	if !runtimeInvocationV117UnavailableEvidence(process) {
		if !runtimeInvocationV117ExactKeys(process, "status", "processes", "threads", "children") || process["status"] != "verified" {
			return false
		}
		for _, key := range []string{"processes", "threads", "children"} {
			if _, ok := runtimeInvocationV117Integer(process[key]); !ok {
				return false
			}
		}
	}
	capabilities, ok := runtimeInvocationV117Object(receipt["capabilities"])
	if !ok {
		return false
	}
	if !runtimeInvocationV117UnavailableEvidence(capabilities) {
		if !runtimeInvocationV117ExactKeys(capabilities, "status", "filesystem", "network", "environment", "shell") || capabilities["status"] != "verified" {
			return false
		}
		for _, key := range []string{"filesystem", "network", "environment", "shell"} {
			if _, ok := runtimeInvocationV117ID(capabilities[key]); !ok {
				return false
			}
		}
	}
	cancellation, ok := runtimeInvocationV117Object(receipt["cancellation"])
	if !ok {
		return false
	}
	if !runtimeInvocationV117UnavailableEvidence(cancellation) {
		if !runtimeInvocationV117ExactKeys(cancellation, "status", "terminationRequired", "receiptPresent", "graceMilliseconds") || cancellation["status"] != "verified" {
			return false
		}
		if _, ok := cancellation["terminationRequired"].(bool); !ok {
			return false
		}
		if _, ok := cancellation["receiptPresent"].(bool); !ok {
			return false
		}
		if _, ok := runtimeInvocationV117Integer(cancellation["graceMilliseconds"]); !ok {
			return false
		}
	}
	accounting, ok := runtimeInvocationV117Object(receipt["accountingEvidence"])
	if !ok {
		return false
	}
	if runtimeInvocationV117UnavailableEvidence(accounting) {
		return true
	}
	if !runtimeInvocationV117ExactKeys(accounting, "status", "signatureVerified", "monotonic") || accounting["status"] != "verified" {
		return false
	}
	_, signatureOK := accounting["signatureVerified"].(bool)
	_, monotonicOK := accounting["monotonic"].(bool)
	return signatureOK && monotonicOK
}

func runtimeInvocationV117ResponseAccountingValid(value any) bool {
	accounting, ok := runtimeInvocationV117Object(value)
	if !ok || !runtimeInvocationV117ExactKeys(accounting, "schemaVersion", "domain", "prestateSha256", "idempotencyKeySha256", "disposition", "receipt", "poststate", "poststateSha256", "identitySha256") || accounting["schemaVersion"] != "runtime-invocation-accounting-v1.17" || accounting["domain"] != "execution" || (accounting["disposition"] != "commit" && accounting["disposition"] != "no_commit") || !runtimeInvocationV117ReceiptValid(accounting["receipt"]) || !runtimeInvocationV117ExecutionLedgerShapeValid(accounting["poststate"]) {
		return false
	}
	for _, key := range []string{"prestateSha256", "idempotencyKeySha256", "poststateSha256", "identitySha256"} {
		if _, ok := runtimeInvocationV117Hash(accounting[key]); !ok {
			return false
		}
	}
	return true
}

func runtimeInvocationV117ResponseShapeValid(response map[string]any) bool {
	if !runtimeInvocationV117ExactKeys(response, "contractVersion", "candidateStatus", "current", "envelopeKind", "requestBinding", "outcome", "payloadBinding", "accounting", "authentication") ||
		response["contractVersion"] != runtimeInvocationV117ContractVersion || response["candidateStatus"] != runtimeInvocationV117CandidateStatus || response["current"] != false || response["envelopeKind"] != "runtime-invocation-response" ||
		!runtimeInvocationV117RequestBindingValid(response["requestBinding"]) || !runtimeInvocationV117ResponseAccountingValid(response["accounting"]) || !runtimeInvocationV117AuthenticationValid(response["authentication"]) {
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

func runtimeInvocationV117FramedValueHash(label string, value any) (string, error) {
	canonical, err := runtimeInvocationV117CanonicalValue(value)
	if err != nil {
		return "", err
	}
	return runtimeInvocationV117SHA256Value(runtimeInvocationV117Frame(
		runtimeInvocationV117IdentityEvidenceBundle,
		[]byte(label),
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
	method := request["method"].(string)
	budget := request["budget"].(map[string]any)
	if !runtimeInvocationV117CanonicalEqual(budget, runtimeInvocationV117ExpectedBudgetMap(method)) {
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
	if err != nil || retry["identitySha256"] != expectedRetry {
		return false
	}
	accounting := request["accounting"].(map[string]any)
	prestate := accounting["prestate"]
	if !runtimeInvocationV117ExecutionLedgerValid(prestate, request["invocationId"].(string)) {
		return false
	}
	prestateSHA256, err := runtimeInvocationV117FramedValueHash("runtime-invocation-v1.17:execution-ledger-prestate", prestate)
	if err != nil || accounting["prestateSha256"] != prestateSHA256 {
		return false
	}
	source := request["sourceIdentity"].(map[string]any)
	requestIdentity, err := runtimeInvocationV117FramedValueHash("runtime-invocation-v1.17:execution-request-identity", map[string]any{
		"invocationId": request["invocationId"], "kernelRequestId": request["kernelRequestId"], "method": method,
		"semanticTupleId": tuple["tupleId"], "strategyRevisionId": source["strategyRevisionId"], "artifactSha256": source["artifactSha256"],
		"budgetProfileSha256": budget["profileSha256"], "inputSha256": input["canonicalSha256"], "prestateSha256": prestateSHA256,
	})
	if err != nil || accounting["requestIdentity"] != requestIdentity {
		return false
	}
	prestateObject := prestate.(map[string]any)
	idempotencyKey, err := runtimeInvocationV117FramedValueHash("runtime-invocation-v1.17:execution-idempotency", map[string]any{
		"invocationId": request["invocationId"], "prestateRevision": prestateObject["revision"], "requestIdentity": requestIdentity,
	})
	if err != nil || accounting["idempotencyKeySha256"] != idempotencyKey {
		return false
	}
	accountingIdentity, err := runtimeInvocationV117FramedValueHash("runtime-invocation-v1.17:execution-accounting-request", runtimeInvocationV117WithoutProperty(accounting, "identitySha256"))
	return err == nil && accounting["identitySha256"] == accountingIdentity
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
		"requestId":                request.RequestID,
		"invocationId":             request.InvocationID,
		"kernelRequestId":          request.KernelRequestID,
		"method":                   request.Method,
		"requestSha256":            request.RequestSHA256,
		"semanticTupleId":          request.SemanticTuple.TupleID,
		"runtimeAbiVersion":        request.SemanticTuple.RuntimeABI,
		"strategyRevisionId":       request.SourceIdentity.StrategyRevisionID,
		"artifactSha256":           request.SourceIdentity.ArtifactSHA256,
		"budgetProfileSha256":      request.Budget.ProfileSHA256,
		"inputSha256":              request.Input.CanonicalSHA256,
		"retryIdentitySha256":      request.Retry.IdentitySHA256,
		"accountingIdentitySha256": request.Accounting.IdentitySHA256,
		"idempotencyKeySha256":     request.Accounting.IdempotencyKeySHA256,
	}
}

func runtimeInvocationTraceV117ForRequest(request *runtimeInvocationRequestV117) map[string]any {
	return map[string]any{
		"requestId":                request.RequestID,
		"invocationId":             request.InvocationID,
		"kernelRequestId":          request.KernelRequestID,
		"method":                   request.Method,
		"requestSha256":            request.RequestSHA256,
		"budgetProfileSha256":      request.Budget.ProfileSHA256,
		"inputSha256":              request.Input.CanonicalSHA256,
		"retryIdentitySha256":      request.Retry.IdentitySHA256,
		"accountingIdentitySha256": request.Accounting.IdentitySHA256,
		"idempotencyKeySha256":     request.Accounting.IdempotencyKeySHA256,
		"safeCodes":                []any{"ADAPTER_AUTHENTICATED", "PAYLOAD_CANONICAL"},
	}
}

func runtimeInvocationV117TraceMatchesRequest(value any, request *runtimeInvocationRequestV117) bool {
	trace, ok := runtimeInvocationV117Object(value)
	if !ok {
		return false
	}
	expected := runtimeInvocationTraceV117ForRequest(request)
	for _, key := range []string{"requestId", "invocationId", "kernelRequestId", "method", "requestSha256", "budgetProfileSha256", "inputSha256", "retryIdentitySha256", "accountingIdentitySha256", "idempotencyKeySha256"} {
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

type runtimeInvocationV117DebitResult struct {
	kind       string
	ledger     map[string]any
	dimensions []string
}

func runtimeInvocationV117CloneObject(value any) (map[string]any, bool) {
	canonical, err := runtimeInvocationV117CanonicalValue(value)
	if err != nil {
		return nil, false
	}
	object, failure := runtimeInvocationV117ParseCanonicalEnvelope(canonical)
	return object, failure == nil
}

func runtimeInvocationV117DebitExecutionLedger(prestate map[string]any, receipt map[string]any) runtimeInvocationV117DebitResult {
	system := func() runtimeInvocationV117DebitResult {
		return runtimeInvocationV117DebitResult{kind: "system_failure", ledger: prestate}
	}
	if receipt["domain"] != "execution" || receipt["invocationId"] == "" || receipt["invocationId"] == nil || receipt["requestIdentity"] == nil || receipt["evidenceIdentity"] == nil {
		return system()
	}
	prestateRevision, ok := runtimeInvocationV117Integer(receipt["prestateRevision"])
	ledgerRevision, ledgerOK := runtimeInvocationV117Integer(prestate["revision"])
	if !ok || !ledgerOK || prestateRevision != ledgerRevision || receipt["attribution"] == "ambiguous" {
		return system()
	}
	method := receipt["method"].(string)
	methods := prestate["methodInvocations"].(map[string]any)
	methodCount, methodOK := runtimeInvocationV117Integer(methods[method])
	methodMaximum := int64(20)
	if method == "soldierBrain" {
		methodMaximum = 240
	}
	cumulative := prestate["cumulative"].(map[string]any)
	invocationCount, invocationOK := runtimeInvocationV117Integer(cumulative["invocationCount"])
	if !methodOK || !invocationOK || methodCount >= methodMaximum || invocationCount >= runtimeInvocationV117CandidateInvocationCountMaximum {
		return system()
	}
	counters := receipt["counters"].(map[string]any)
	counterMaximums := map[string][2]int64{
		"wallMilliseconds": {50, 13_000}, "computeFuel": {10_000_000, 2_600_000_000},
		"payloadBytes": {262_144, 68_157_440}, "stdoutBytes": {262_144, 68_157_440}, "stderrBytes": {65_536, 17_039_360},
	}
	dimensionNames := map[string]string{"wallMilliseconds": "wall", "computeFuel": "compute", "payloadBytes": "payload", "stdoutBytes": "stdout", "stderrBytes": "stderr"}
	nextCounters := map[string]int64{}
	dimensions := []string{}
	for _, key := range []string{"wallMilliseconds", "computeFuel", "payloadBytes", "stdoutBytes", "stderrBytes"} {
		evidence := counters[key].(map[string]any)
		if evidence["status"] != "measured" {
			return system()
		}
		delta, deltaOK := runtimeInvocationV117Integer(evidence["delta"])
		observed, observedOK := runtimeInvocationV117Integer(evidence["cumulative"])
		previous, previousOK := runtimeInvocationV117Integer(cumulative[key])
		if !deltaOK || !observedOK || !previousOK || observed < previous || previous > 9_007_199_254_740_991-delta || observed != previous+delta {
			return system()
		}
		nextCounters[key] = observed
		maximums := counterMaximums[key]
		if delta > maximums[0] {
			dimensions = append(dimensions, "invocation."+dimensionNames[key])
		}
		if observed > maximums[1] {
			dimensions = append(dimensions, "match."+dimensionNames[key])
		}
	}
	memory := receipt["memory"].(map[string]any)
	if memory["status"] != "measured" {
		return system()
	}
	peak, peakOK := runtimeInvocationV117Integer(memory["peakBytes"])
	cumulativePeak, cumulativePeakOK := runtimeInvocationV117Integer(memory["cumulativePeakBytes"])
	previousMemory, previousMemoryOK := runtimeInvocationV117Integer(cumulative["memoryBytes"])
	if !peakOK || !cumulativePeakOK || !previousMemoryOK || cumulativePeak < previousMemory || cumulativePeak != max(previousMemory, peak) {
		return system()
	}
	if peak > 67_108_864 {
		dimensions = append(dimensions, "invocation.memory")
	}
	if cumulativePeak > 67_108_864 {
		dimensions = append(dimensions, "match.memory")
	}
	process := receipt["process"].(map[string]any)
	processes, processOK := runtimeInvocationV117Integer(process["processes"])
	threads, threadsOK := runtimeInvocationV117Integer(process["threads"])
	children, childrenOK := runtimeInvocationV117Integer(process["children"])
	if process["status"] != "verified" || !processOK || !threadsOK || !childrenOK || processes == 0 || threads == 0 || processes > 1 || threads > 1 || children > 0 {
		return system()
	}
	capabilities := receipt["capabilities"].(map[string]any)
	if capabilities["status"] != "verified" || capabilities["filesystem"] != "none" || capabilities["network"] != "disabled" || capabilities["environment"] != "empty" || capabilities["shell"] != "disabled" {
		return system()
	}
	cancellation := receipt["cancellation"].(map[string]any)
	grace, graceOK := runtimeInvocationV117Integer(cancellation["graceMilliseconds"])
	terminationRequired, terminationOK := cancellation["terminationRequired"].(bool)
	receiptPresent, receiptOK := cancellation["receiptPresent"].(bool)
	if cancellation["status"] != "verified" || !graceOK || !terminationOK || !receiptOK || (terminationRequired && (!receiptPresent || grace > 100)) {
		return system()
	}
	accountingEvidence := receipt["accountingEvidence"].(map[string]any)
	signatureVerified, signatureOK := accountingEvidence["signatureVerified"].(bool)
	monotonic, monotonicOK := accountingEvidence["monotonic"].(bool)
	if accountingEvidence["status"] != "verified" || !signatureOK || !monotonicOK || !signatureVerified || !monotonic || receipt["attribution"] == "host" {
		return system()
	}
	next, ok := runtimeInvocationV117CloneObject(prestate)
	if !ok {
		return system()
	}
	next["revision"] = ledgerRevision + 1
	nextMethods := next["methodInvocations"].(map[string]any)
	nextMethods[method] = methodCount + 1
	nextCumulative := next["cumulative"].(map[string]any)
	nextCumulative["invocationCount"] = invocationCount + 1
	for key, value := range nextCounters {
		nextCumulative[key] = value
	}
	nextCumulative["memoryBytes"] = cumulativePeak
	commitments := next["commitments"].([]any)
	outcome := "success"
	if len(dimensions) > 0 {
		outcome = "player_violation"
	}
	next["commitments"] = append(commitments, map[string]any{
		"identity": receipt["invocationId"], "requestIdentity": receipt["requestIdentity"], "evidenceIdentity": receipt["evidenceIdentity"],
		"prestateRevision": prestateRevision, "scope": method, "outcome": outcome, "dimensions": dimensions,
	})
	return runtimeInvocationV117DebitResult{kind: outcome, ledger: next, dimensions: dimensions}
}

func runtimeInvocationV117DebitMatchesOutcome(debit runtimeInvocationV117DebitResult, outcome map[string]any) bool {
	kind, _ := outcome["kind"].(string)
	if debit.kind == "system_failure" {
		return kind == "system_failure"
	}
	if debit.kind == "success" {
		if kind == "success" {
			return true
		}
		if kind != "player_violation" {
			return false
		}
		violation := outcome["violation"].(map[string]any)
		code := violation["code"]
		return code == "INVALID_OUTPUT" || code == "THROWN_EXCEPTION" || code == "FORBIDDEN_CAPABILITY"
	}
	if kind != "player_violation" {
		return false
	}
	violation := outcome["violation"].(map[string]any)
	want := ""
	for _, dimension := range debit.dimensions {
		candidate := "TIMEOUT"
		if regexp.MustCompile(`payload|stdout|stderr`).MatchString(dimension) {
			candidate = "OVERSIZED_OUTPUT"
		}
		if want != "" && want != candidate {
			return false
		}
		want = candidate
	}
	return want != "" && violation["code"] == want
}

func runtimeInvocationV117DeriveResponseAccounting(request *runtimeInvocationRequestV117, outcome map[string]any, receipt map[string]any) (map[string]any, bool) {
	if !runtimeInvocationV117ReceiptValid(receipt) {
		return nil, false
	}
	prestate := request.raw["accounting"].(map[string]any)["prestate"].(map[string]any)
	prestateRevision, _ := runtimeInvocationV117Integer(prestate["revision"])
	receiptRevision, _ := runtimeInvocationV117Integer(receipt["prestateRevision"])
	requestAccounting := request.raw["accounting"].(map[string]any)
	if receiptRevision != prestateRevision || receipt["invocationId"] != request.InvocationID || receipt["requestIdentity"] != requestAccounting["requestIdentity"] || receipt["method"] != request.Method {
		return nil, false
	}
	evidenceIdentity, err := runtimeInvocationV117FramedValueHash("runtime-invocation-v1.17:execution-evidence", runtimeInvocationV117WithoutProperty(receipt, "evidenceIdentity"))
	if err != nil || receipt["evidenceIdentity"] != evidenceIdentity {
		return nil, false
	}
	debit := runtimeInvocationV117DebitExecutionLedger(prestate, receipt)
	if !runtimeInvocationV117DebitMatchesOutcome(debit, outcome) {
		return nil, false
	}
	disposition := "commit"
	if outcome["kind"] == "system_failure" {
		disposition = "no_commit"
	}
	if (disposition == "commit" && debit.kind == "system_failure") || (disposition == "no_commit" && (debit.kind != "system_failure" || !runtimeInvocationV117CanonicalEqual(debit.ledger, prestate))) {
		return nil, false
	}
	poststateSHA256, err := runtimeInvocationV117FramedValueHash("runtime-invocation-v1.17:execution-ledger-poststate", debit.ledger)
	if err != nil {
		return nil, false
	}
	withoutIdentity := map[string]any{
		"schemaVersion": "runtime-invocation-accounting-v1.17", "domain": "execution",
		"prestateSha256": requestAccounting["prestateSha256"], "idempotencyKeySha256": requestAccounting["idempotencyKeySha256"],
		"disposition": disposition, "receipt": receipt, "poststate": debit.ledger, "poststateSha256": poststateSHA256,
	}
	identity, err := runtimeInvocationV117FramedValueHash("runtime-invocation-v1.17:execution-accounting-response", withoutIdentity)
	if err != nil {
		return nil, false
	}
	withoutIdentity["identitySha256"] = identity
	return withoutIdentity, true
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
	receipt := response["accounting"].(map[string]any)["receipt"].(map[string]any)
	expectedAccounting, ok := runtimeInvocationV117DeriveResponseAccounting(request, outcome, receipt)
	if !ok || !runtimeInvocationV117CanonicalEqual(response["accounting"], expectedAccounting) {
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
	maximum := request.Budget.MatchLimit.Counters.InvocationCount.Maximum
	current := request.Retry.Attempt
	consumed := request.Accounting.Prestate.Cumulative.InvocationCount
	if maximum < 1 || maximum > runtimeInvocationV117CandidateInvocationCountMaximum ||
		current < 0 || current >= runtimeInvocationV117CandidateRetryAttemptMaximum || consumed < 0 || consumed >= maximum {
		return 0, runtimeInvocationV117FailureFor("OUTER_FRAME_WRONG_BINDING")
	}
	localRemaining := runtimeInvocationV117CandidateRetryAttemptMaximum - current
	cumulativeRemaining := maximum - consumed
	if cumulativeRemaining < localRemaining {
		localRemaining = cumulativeRemaining
	}
	return int(localRemaining), nil
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
		if failure = runtimeInvocationV117ContextFailure(ctx); failure != nil {
			return nil, failure
		}
		if err != nil {
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
