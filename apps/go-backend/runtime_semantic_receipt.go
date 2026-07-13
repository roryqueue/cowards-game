package main

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"regexp"
	"strconv"
	"strings"
)

var runtimeSemanticSignaturePattern = regexp.MustCompile(`^hmac-sha256:[0-9a-f]{64}$`)

type runtimeSemanticWireEvidence struct {
	ChronicleJSON           json.RawMessage
	FinalStateJSON          json.RawMessage
	OutcomeJSON             json.RawMessage
	ChronicleWireBytesHash  string
	FinalStateWireBytesHash string
	OutcomeWireBytesHash    string
}

func (evidence runtimeSemanticWireEvidence) clone() runtimeSemanticWireEvidence {
	return runtimeSemanticWireEvidence{
		ChronicleJSON:           append(json.RawMessage(nil), evidence.ChronicleJSON...),
		FinalStateJSON:          append(json.RawMessage(nil), evidence.FinalStateJSON...),
		OutcomeJSON:             append(json.RawMessage(nil), evidence.OutcomeJSON...),
		ChronicleWireBytesHash:  evidence.ChronicleWireBytesHash,
		FinalStateWireBytesHash: evidence.FinalStateWireBytesHash,
		OutcomeWireBytesHash:    evidence.OutcomeWireBytesHash,
	}
}

func runtimeSemanticReceiptMessage(receipt runtimeSemanticReceipt) []byte {
	return []byte(strings.Join([]string{
		runtimeSemanticReceiptDomain,
		receipt.SchemaVersion,
		receipt.Profile,
		receipt.ServiceContractVersion,
		receipt.RequestID,
		receipt.MatchID,
		receipt.CompatibilityTupleID,
		receipt.RulesVersion,
		receipt.EngineVersion,
		receipt.RuntimeABIVersion,
		receipt.ChronicleVersion,
		receipt.ArenaCatalogVersion,
		receipt.SetPolicyVersion,
		receipt.AuthorityBundleHash,
		receipt.RegistryGeneration,
		receipt.ChronicleWireBytesHash,
		receipt.FinalStateWireBytesHash,
		receipt.ReconstructedTerminalStateHash,
		receipt.OutcomeWireBytesHash,
		strconv.Itoa(receipt.RuntimeViolationEventCount),
		receipt.Algorithm,
		receipt.KeyID,
	}, "\n"))
}

func runtimeSemanticWireBytesHash(domain string, encoded []byte) string {
	hash := sha256.New()
	hash.Write([]byte(domain))
	hash.Write([]byte{0})
	hash.Write(encoded)
	return "sha256:" + hex.EncodeToString(hash.Sum(nil))
}

func runtimeSemanticChronicleWireBytesHash(chronicle map[string]any) (string, json.RawMessage, error) {
	encoded, err := json.Marshal(chronicle)
	if err != nil {
		return "", nil, err
	}
	return runtimeSemanticWireBytesHash(runtimeSemanticChronicleWireDomain, encoded), encoded, nil
}

func runtimeSemanticFinalStateWireBytesHash(finalState map[string]any) (string, json.RawMessage, error) {
	encoded, err := json.Marshal(finalState)
	if err != nil {
		return "", nil, err
	}
	return runtimeSemanticWireBytesHash(runtimeSemanticFinalStateWireDomain, encoded), encoded, nil
}

func runtimeSemanticOutcomeJSON(finalStateJSON json.RawMessage) (json.RawMessage, error) {
	object, err := decodeStrictJSONObject(finalStateJSON)
	if err != nil {
		return nil, err
	}
	outcome, exists := object["outcome"]
	if !exists {
		return json.RawMessage("null"), nil
	}
	return append(json.RawMessage(nil), outcome...), nil
}

func runtimeSemanticOutcomeWireBytesHash(finalState map[string]any) (string, json.RawMessage, error) {
	outcome := finalState["outcome"]
	encoded, err := json.Marshal(outcome)
	if err != nil {
		return "", nil, err
	}
	return runtimeSemanticWireBytesHash(runtimeSemanticOutcomeWireDomain, encoded), encoded, nil
}

func runtimeSemanticViolationCount(chronicle map[string]any) int {
	count := 0
	for _, value := range sliceValue(chronicle, "events") {
		if event, ok := value.(map[string]any); ok && stringValue(event, "type") == "RUNTIME_VIOLATION" {
			count++
		}
	}
	return count
}

type runtimeSemanticReceiptRecord struct {
	SchemaVersion                  string `json:"schemaVersion"`
	Profile                        string `json:"profile"`
	ServiceContractVersion         string `json:"serviceContractVersion"`
	RequestID                      string `json:"requestId"`
	MatchID                        string `json:"matchId"`
	CompatibilityTupleID           string `json:"compatibilityTupleId"`
	RulesVersion                   string `json:"rulesVersion"`
	EngineVersion                  string `json:"engineVersion"`
	RuntimeABIVersion              string `json:"runtimeAbiVersion"`
	ChronicleVersion               string `json:"chronicleVersion"`
	ArenaCatalogVersion            string `json:"arenaCatalogVersion"`
	SetPolicyVersion               string `json:"setPolicyVersion"`
	AuthorityBundleHash            string `json:"authorityBundleHash"`
	RegistryGeneration             string `json:"registryGeneration"`
	ChronicleWireBytesHash         string `json:"chronicleWireBytesHash"`
	FinalStateWireBytesHash        string `json:"finalStateWireBytesHash"`
	ReconstructedTerminalStateHash string `json:"reconstructedTerminalStateHash"`
	OutcomeWireBytesHash           string `json:"outcomeWireBytesHash"`
	RuntimeViolationEventCount     int    `json:"runtimeViolationEventCount"`
	Algorithm                      string `json:"algorithm"`
	KeyID                          string `json:"keyId"`
	Signature                      string `json:"signature"`
}

func runtimeSemanticReceiptRecordJSON(receipt runtimeSemanticReceipt) ([]byte, error) {
	return json.Marshal(runtimeSemanticReceiptRecord{
		SchemaVersion: receipt.SchemaVersion, Profile: receipt.Profile, ServiceContractVersion: receipt.ServiceContractVersion,
		RequestID: receipt.RequestID, MatchID: receipt.MatchID, CompatibilityTupleID: receipt.CompatibilityTupleID,
		RulesVersion: receipt.RulesVersion, EngineVersion: receipt.EngineVersion, RuntimeABIVersion: receipt.RuntimeABIVersion,
		ChronicleVersion: receipt.ChronicleVersion, ArenaCatalogVersion: receipt.ArenaCatalogVersion, SetPolicyVersion: receipt.SetPolicyVersion,
		AuthorityBundleHash: receipt.AuthorityBundleHash, RegistryGeneration: receipt.RegistryGeneration,
		ChronicleWireBytesHash: receipt.ChronicleWireBytesHash, FinalStateWireBytesHash: receipt.FinalStateWireBytesHash,
		ReconstructedTerminalStateHash: receipt.ReconstructedTerminalStateHash, OutcomeWireBytesHash: receipt.OutcomeWireBytesHash,
		RuntimeViolationEventCount: receipt.RuntimeViolationEventCount, Algorithm: receipt.Algorithm, KeyID: receipt.KeyID, Signature: receipt.Signature,
	})
}

func runtimeSemanticReceiptHash(receipt runtimeSemanticReceipt) (string, error) {
	encoded, err := runtimeSemanticReceiptRecordJSON(receipt)
	if err != nil {
		return "", err
	}
	return runtimeSemanticWireBytesHash("cowards-game:runtime-semantic-receipt-record:v1", encoded), nil
}

func validRuntimeSemanticSignature(receipt runtimeSemanticReceipt, secret string) bool {
	if !runtimeSemanticSignaturePattern.MatchString(receipt.Signature) {
		return false
	}
	presented, err := hex.DecodeString(strings.TrimPrefix(receipt.Signature, "hmac-sha256:"))
	if err != nil || len(presented) != sha256.Size {
		return false
	}
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(runtimeSemanticReceiptMessage(receipt))
	return hmac.Equal(presented, mac.Sum(nil))
}

func runtimeSemanticWireEvidenceFromResult(result *runtimeServiceSuccessResult) (runtimeSemanticWireEvidence, error) {
	if result == nil || len(result.ChronicleWire) == 0 || len(result.FinalStateWire) == 0 {
		return runtimeSemanticWireEvidence{}, errors.New("runtime semantic receipt wire values are missing")
	}
	outcomeJSON, err := runtimeSemanticOutcomeJSON(result.FinalStateWire)
	if err != nil {
		return runtimeSemanticWireEvidence{}, err
	}
	return runtimeSemanticWireEvidence{
		ChronicleJSON:           append(json.RawMessage(nil), result.ChronicleWire...),
		FinalStateJSON:          append(json.RawMessage(nil), result.FinalStateWire...),
		OutcomeJSON:             outcomeJSON,
		ChronicleWireBytesHash:  runtimeSemanticWireBytesHash(runtimeSemanticChronicleWireDomain, result.ChronicleWire),
		FinalStateWireBytesHash: runtimeSemanticWireBytesHash(runtimeSemanticFinalStateWireDomain, result.FinalStateWire),
		OutcomeWireBytesHash:    runtimeSemanticWireBytesHash(runtimeSemanticOutcomeWireDomain, outcomeJSON),
	}, nil
}

func validateRuntimeSemanticReceipt(request runtimeServiceRequest, result *runtimeServiceSuccessResult, secret string) *runtimeServiceFailure {
	fail := func(reason string) *runtimeServiceFailure {
		return semanticIntegrityFailure(createSemanticIntegrityResult([]semanticIntegrityIssue{
			semanticIssue(reason, []any{"result", "semanticReceipt"}, nil),
		}))
	}
	if result == nil || result.Privacy != "internal_runtime_result" || len(result.ChronicleWire) == 0 || len(result.FinalStateWire) == 0 {
		return fail("SEMANTIC_RECEIPT_SHAPE_INVALID")
	}
	if strings.TrimSpace(secret) == "" {
		return fail("SEMANTIC_RECEIPT_SECRET_MISSING")
	}
	receipt := result.SemanticReceipt
	tuple := request.EvidenceSnapshot.Compatibility.Tuple
	if receipt.SchemaVersion != runtimeSemanticReceiptSchemaVersion ||
		receipt.Profile != runtimeSemanticReceiptProfile ||
		receipt.ServiceContractVersion != runtimeExecutionServiceVersion ||
		receipt.RequestID != request.RequestID || receipt.MatchID != request.Match.MatchID ||
		receipt.CompatibilityTupleID != request.EvidenceSnapshot.Compatibility.TupleID ||
		receipt.RulesVersion != tuple.Rules || receipt.EngineVersion != tuple.Engine ||
		receipt.RuntimeABIVersion != tuple.RuntimeABI || receipt.ChronicleVersion != tuple.Chronicle ||
		receipt.ArenaCatalogVersion != tuple.ArenaCatalog || receipt.SetPolicyVersion != tuple.SetPolicy ||
		receipt.AuthorityBundleHash != request.EvidenceSnapshot.AuthorityBundleHash ||
		receipt.RegistryGeneration != request.EvidenceSnapshot.RegistryGeneration ||
		receipt.RuntimeViolationEventCount != result.RuntimeViolationEventCount ||
		receipt.Algorithm != runtimeSemanticReceiptAlgorithm || receipt.KeyID != runtimeSemanticReceiptKeyID ||
		!isPrefixedLowerSHA256(receipt.ReconstructedTerminalStateHash) {
		return fail("SEMANTIC_RECEIPT_CLAIM_MISMATCH")
	}
	evidence, err := runtimeSemanticWireEvidenceFromResult(result)
	if err != nil || receipt.ChronicleWireBytesHash != evidence.ChronicleWireBytesHash ||
		receipt.FinalStateWireBytesHash != evidence.FinalStateWireBytesHash || receipt.OutcomeWireBytesHash != evidence.OutcomeWireBytesHash {
		return fail("SEMANTIC_RECEIPT_HASH_MISMATCH")
	}
	if !validRuntimeSemanticSignature(receipt, secret) {
		return fail("SEMANTIC_RECEIPT_SIGNATURE_INVALID")
	}
	var chronicle map[string]any
	var finalState map[string]any
	if err := decodeStrictJSONUseNumber(evidence.ChronicleJSON, &chronicle); err != nil || chronicle == nil {
		return fail("SEMANTIC_RECEIPT_CHRONICLE_INVALID")
	}
	if err := decodeStrictJSONUseNumber(evidence.FinalStateJSON, &finalState); err != nil || finalState == nil {
		return fail("SEMANTIC_RECEIPT_FINAL_STATE_MISMATCH")
	}
	if _, exists := chronicle["integrity"]; exists {
		return fail("SEMANTIC_RECEIPT_CHRONICLE_INVALID")
	}
	if _, exists := chronicle["storageMetadata"]; exists {
		return fail("SEMANTIC_RECEIPT_CHRONICLE_INVALID")
	}
	result.Chronicle = chronicle
	result.FinalState = finalState
	result.SemanticWireEvidence = evidence.clone()
	if stringValue(finalState, "matchId") != request.Match.MatchID {
		return fail("SEMANTIC_RECEIPT_FINAL_STATE_MISMATCH")
	}
	reproducibility, ok := chronicle["reproducibility"].(map[string]any)
	if !ok || stringValue(reproducibility, "matchId") != request.Match.MatchID {
		return fail("SEMANTIC_RECEIPT_CHRONICLE_MISMATCH")
	}
	if validation := validateGoCanonicalGameState(finalState); !validation.OK {
		return semanticIntegrityFailure(validation)
	}
	if err := validateGoChronicleShape(chronicle); err != nil {
		return fail("SEMANTIC_RECEIPT_CHRONICLE_INVALID")
	}
	terminalOutcome, err := terminalChronicleOutcome(sliceValue(chronicle, "snapshots"))
	if err != nil || !jsonValuesEqual(terminalOutcome, finalState["outcome"]) {
		return fail("SEMANTIC_RECEIPT_OUTCOME_MISMATCH")
	}
	if runtimeSemanticViolationCount(chronicle) != result.RuntimeViolationEventCount {
		return fail("SEMANTIC_RECEIPT_HASH_MISMATCH")
	}
	return nil
}

func requireRuntimeSemanticReceiptSecret() error {
	if runtimeServiceSemanticReceiptSecret() == "" {
		return errors.New("runtime semantic receipt secret is unavailable")
	}
	return nil
}

func validateRuntimeSemanticReceiptForCompletion(input completeMatchInput, integrity *claimedMatchIntegrityIdentity, secret string) error {
	if integrity == nil || strings.TrimSpace(secret) == "" {
		return errors.New("runtime semantic receipt completion admission unavailable")
	}
	receipt := input.SemanticReceipt
	if receipt.SchemaVersion != runtimeSemanticReceiptSchemaVersion || receipt.Profile != runtimeSemanticReceiptProfile ||
		receipt.ServiceContractVersion != runtimeExecutionServiceVersion || receipt.MatchID != stringValue(input.FinalState, "matchId") ||
		receipt.CompatibilityTupleID != integrity.CompatibilityTupleID || receipt.RulesVersion != integrity.CompatibilityTuple.Rules ||
		receipt.EngineVersion != integrity.CompatibilityTuple.Engine || receipt.RuntimeABIVersion != integrity.CompatibilityTuple.RuntimeABI ||
		receipt.ChronicleVersion != integrity.CompatibilityTuple.Chronicle || receipt.ArenaCatalogVersion != integrity.CompatibilityTuple.ArenaCatalog ||
		receipt.SetPolicyVersion != integrity.CompatibilityTuple.SetPolicy || receipt.AuthorityBundleHash != integrity.AuthorityBundleHash ||
		receipt.RegistryGeneration != integrity.RegistryGeneration || receipt.Algorithm != runtimeSemanticReceiptAlgorithm || receipt.KeyID != runtimeSemanticReceiptKeyID ||
		!isPrefixedLowerSHA256(receipt.ReconstructedTerminalStateHash) {
		return errors.New("runtime semantic receipt completion claims changed")
	}
	evidence := input.SemanticWireEvidence
	if len(evidence.ChronicleJSON) == 0 || len(evidence.FinalStateJSON) == 0 || len(evidence.OutcomeJSON) == 0 ||
		evidence.ChronicleWireBytesHash != runtimeSemanticWireBytesHash(runtimeSemanticChronicleWireDomain, evidence.ChronicleJSON) ||
		evidence.FinalStateWireBytesHash != runtimeSemanticWireBytesHash(runtimeSemanticFinalStateWireDomain, evidence.FinalStateJSON) ||
		evidence.OutcomeWireBytesHash != runtimeSemanticWireBytesHash(runtimeSemanticOutcomeWireDomain, evidence.OutcomeJSON) ||
		receipt.ChronicleWireBytesHash != evidence.ChronicleWireBytesHash || receipt.FinalStateWireBytesHash != evidence.FinalStateWireBytesHash ||
		receipt.OutcomeWireBytesHash != evidence.OutcomeWireBytesHash {
		return errors.New("runtime semantic receipt completion wire evidence changed")
	}
	outcomeJSON, err := runtimeSemanticOutcomeJSON(evidence.FinalStateJSON)
	if err != nil || !bytes.Equal(outcomeJSON, evidence.OutcomeJSON) {
		return errors.New("runtime semantic receipt completion outcome wire evidence changed")
	}
	var chronicle map[string]any
	var finalState map[string]any
	if err := decodeStrictJSONUseNumber(evidence.ChronicleJSON, &chronicle); err != nil || chronicle == nil {
		return errors.New("runtime semantic receipt completion Chronicle wire evidence is invalid")
	}
	if err := decodeStrictJSONUseNumber(evidence.FinalStateJSON, &finalState); err != nil || finalState == nil {
		return errors.New("runtime semantic receipt completion state wire evidence is invalid")
	}
	if _, exists := chronicle["integrity"]; exists {
		return errors.New("runtime semantic receipt completion Chronicle metadata is forbidden")
	}
	if _, exists := chronicle["storageMetadata"]; exists {
		return errors.New("runtime semantic receipt completion Chronicle metadata is forbidden")
	}
	if !jsonValuesEqual(chronicle, input.Chronicle) || !jsonValuesEqual(finalState, input.FinalState) ||
		receipt.RuntimeViolationEventCount != runtimeSemanticViolationCount(input.Chronicle) {
		return errors.New("runtime semantic receipt completion decoded evidence changed")
	}
	if validation := validateGoCanonicalGameState(input.FinalState); !validation.OK {
		return errors.New("runtime semantic receipt completion state is invalid")
	}
	if !validRuntimeSemanticSignature(receipt, secret) {
		return errors.New("runtime semantic receipt completion signature is invalid")
	}
	return nil
}
