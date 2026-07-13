package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"strconv"
	"strings"
)

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
		receipt.ChronicleHash,
		receipt.FinalStateHash,
		receipt.ReconstructedTerminalStateHash,
		receipt.OutcomeHash,
		strconv.Itoa(receipt.RuntimeViolationEventCount),
		receipt.Algorithm,
		receipt.KeyID,
	}, "\n"))
}

func runtimeSemanticHash(domain string, value any) (string, error) {
	encoded, err := stableJSON(value)
	if err != nil {
		return "", err
	}
	hash := sha256.New()
	hash.Write([]byte(domain))
	hash.Write([]byte{0})
	hash.Write(encoded)
	return "sha256:" + hex.EncodeToString(hash.Sum(nil)), nil
}

func runtimeSemanticChronicleHash(chronicle map[string]any) (string, error) {
	raw, err := hashChronicleArtifact(chronicle)
	if err != nil {
		return "", err
	}
	return runtimeSemanticHash("cowards-game:runtime-semantic-chronicle:v1", "sha256:"+raw)
}

func runtimeSemanticFinalStateHash(finalState map[string]any) (string, error) {
	return runtimeSemanticHash("cowards-game:runtime-semantic-final-state:v1", finalState)
}

func runtimeSemanticOutcomeHash(finalState map[string]any) (string, error) {
	outcome := finalState["outcome"]
	if outcome == nil {
		outcome = nil
	}
	return runtimeSemanticHash("cowards-game:runtime-semantic-outcome:v1", outcome)
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

func runtimeSemanticReceiptHash(receipt runtimeSemanticReceipt) (string, error) {
	return runtimeSemanticHash("cowards-game:runtime-semantic-receipt-record:v1", receipt)
}

func validateRuntimeSemanticReceipt(request runtimeServiceRequest, result *runtimeServiceSuccessResult, secret string) *runtimeServiceFailure {
	fail := func(reason string) *runtimeServiceFailure {
		return semanticIntegrityFailure(createSemanticIntegrityResult([]semanticIntegrityIssue{
			semanticIssue(reason, []any{"result", "semanticReceipt"}, nil),
		}))
	}
	if result == nil || result.Privacy != "internal_runtime_result" || result.Chronicle == nil || result.FinalState == nil {
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
	if stringValue(result.FinalState, "matchId") != request.Match.MatchID {
		return fail("SEMANTIC_RECEIPT_FINAL_STATE_MISMATCH")
	}
	reproducibility, ok := result.Chronicle["reproducibility"].(map[string]any)
	if !ok || stringValue(reproducibility, "matchId") != request.Match.MatchID {
		return fail("SEMANTIC_RECEIPT_CHRONICLE_MISMATCH")
	}
	if validation := validateGoCanonicalGameState(result.FinalState); !validation.OK {
		return semanticIntegrityFailure(validation)
	}
	if err := validateGoChronicleShape(result.Chronicle); err != nil {
		return fail("SEMANTIC_RECEIPT_CHRONICLE_INVALID")
	}
	terminalOutcome, err := terminalChronicleOutcome(sliceValue(result.Chronicle, "snapshots"))
	if err != nil || !jsonValuesEqual(terminalOutcome, result.FinalState["outcome"]) {
		return fail("SEMANTIC_RECEIPT_OUTCOME_MISMATCH")
	}
	chronicleHash, chronicleErr := runtimeSemanticChronicleHash(result.Chronicle)
	finalStateHash, finalStateErr := runtimeSemanticFinalStateHash(result.FinalState)
	outcomeHash, outcomeErr := runtimeSemanticOutcomeHash(result.FinalState)
	if chronicleErr != nil || finalStateErr != nil || outcomeErr != nil ||
		receipt.ChronicleHash != chronicleHash || receipt.FinalStateHash != finalStateHash ||
		receipt.OutcomeHash != outcomeHash || runtimeSemanticViolationCount(result.Chronicle) != result.RuntimeViolationEventCount {
		return fail("SEMANTIC_RECEIPT_HASH_MISMATCH")
	}
	const signaturePrefix = "hmac-sha256:"
	if !strings.HasPrefix(receipt.Signature, signaturePrefix) {
		return fail("SEMANTIC_RECEIPT_SIGNATURE_INVALID")
	}
	presented, err := hex.DecodeString(strings.TrimPrefix(receipt.Signature, signaturePrefix))
	if err != nil || len(presented) != sha256.Size {
		return fail("SEMANTIC_RECEIPT_SIGNATURE_INVALID")
	}
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(runtimeSemanticReceiptMessage(receipt))
	if !hmac.Equal(presented, mac.Sum(nil)) {
		return fail("SEMANTIC_RECEIPT_SIGNATURE_INVALID")
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
	chronicleHash, chronicleErr := runtimeSemanticChronicleHash(input.Chronicle)
	finalStateHash, finalStateErr := runtimeSemanticFinalStateHash(input.FinalState)
	outcomeHash, outcomeErr := runtimeSemanticOutcomeHash(input.FinalState)
	if chronicleErr != nil || finalStateErr != nil || outcomeErr != nil || receipt.ChronicleHash != chronicleHash ||
		receipt.FinalStateHash != finalStateHash || receipt.OutcomeHash != outcomeHash ||
		receipt.RuntimeViolationEventCount != runtimeSemanticViolationCount(input.Chronicle) {
		return errors.New("runtime semantic receipt completion hashes changed")
	}
	if validation := validateGoCanonicalGameState(input.FinalState); !validation.OK {
		return errors.New("runtime semantic receipt completion state is invalid")
	}
	const signaturePrefix = "hmac-sha256:"
	presented, err := hex.DecodeString(strings.TrimPrefix(receipt.Signature, signaturePrefix))
	if err != nil || !strings.HasPrefix(receipt.Signature, signaturePrefix) || len(presented) != sha256.Size {
		return errors.New("runtime semantic receipt completion signature is invalid")
	}
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(runtimeSemanticReceiptMessage(receipt))
	if !hmac.Equal(presented, mac.Sum(nil)) {
		return errors.New("runtime semantic receipt completion signature is invalid")
	}
	return nil
}
