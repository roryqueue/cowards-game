package main

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/binary"
	"encoding/hex"
	"encoding/json"
	"errors"
	"regexp"
	"strings"
	"unicode/utf8"
)

const runtimeSemanticReceiptV117SchemaVersion = "runtime-semantic-receipt-v1.17"
const runtimeSemanticReceiptV117Profile = "canonical-full-service-v1"
const runtimeSemanticReceiptV117ServiceVersion = "runtime-execution-service-v1.17"
const runtimeSemanticReceiptV117Domain = "cowards-game:runtime-semantic-receipt:v1.17"
const runtimeSemanticReceiptV117KeyID = "runtime-service-semantic-receipt:v1.17"

var runtimeSemanticReceiptV117Hash = regexp.MustCompile(`^sha256:[0-9a-f]{64}$`)
var runtimeSemanticReceiptV117Signature = regexp.MustCompile(`^hmac-sha256:[0-9a-f]{64}$`)
var runtimeSemanticReceiptV117Generation = regexp.MustCompile(`^(?:0|[1-9][0-9]{0,15})$`)

type runtimeSemanticReceiptV117 struct {
	SchemaVersion                  string `json:"schemaVersion"`
	Profile                        string `json:"profile"`
	ServiceContractVersion         string `json:"serviceContractVersion"`
	RequestSHA256                  string `json:"requestSha256"`
	RequestID                      string `json:"requestId"`
	MatchID                        string `json:"matchId"`
	CompatibilityTupleID           string `json:"compatibilityTupleId"`
	AuthorityBundleHash            string `json:"authorityBundleHash"`
	AuthoritySourceManifestHash    string `json:"authoritySourceManifestHash"`
	RegistryGeneration             string `json:"registryGeneration"`
	BottomIdentityManifestRoot     string `json:"bottomIdentityManifestRoot"`
	BottomEvidenceGraphRoot        string `json:"bottomEvidenceGraphRoot"`
	TopIdentityManifestRoot        string `json:"topIdentityManifestRoot"`
	TopEvidenceGraphRoot           string `json:"topEvidenceGraphRoot"`
	BudgetProfileSHA256            string `json:"budgetProfileSha256"`
	LedgerPrestateRoot             string `json:"ledgerPrestateRoot"`
	LedgerPoststateRoot            string `json:"ledgerPoststateRoot"`
	ChronicleCanonicalHash         string `json:"chronicleCanonicalHash"`
	FinalStateCanonicalHash        string `json:"finalStateCanonicalHash"`
	ReconstructedTerminalStateHash string `json:"reconstructedTerminalStateHash"`
	OutcomeCanonicalHash           string `json:"outcomeCanonicalHash"`
	RuntimeViolationEventCount     int    `json:"runtimeViolationEventCount"`
	Algorithm                      string `json:"algorithm"`
	KeyID                          string `json:"keyId"`
	Signature                      string `json:"signature"`
}

func runtimeSemanticReceiptV117SchemaKnown(schema string) bool {
	return schema == runtimeSemanticReceiptV117SchemaVersion
}

func runtimeSemanticReceiptV117Message(receipt runtimeSemanticReceiptV117) ([]byte, error) {
	if !runtimeSemanticReceiptV117SchemaKnown(receipt.SchemaVersion) ||
		receipt.Profile != runtimeSemanticReceiptV117Profile ||
		receipt.ServiceContractVersion != runtimeSemanticReceiptV117ServiceVersion ||
		receipt.Algorithm != "hmac-sha256" || receipt.KeyID != runtimeSemanticReceiptV117KeyID ||
		!validRuntimeSemanticReceiptV117Identifier(receipt.RequestID) ||
		!validRuntimeSemanticReceiptV117Identifier(receipt.MatchID) ||
		!runtimeSemanticReceiptV117Generation.MatchString(receipt.RegistryGeneration) ||
		receipt.RuntimeViolationEventCount < 0 ||
		int64(receipt.RuntimeViolationEventCount) > 9_007_199_254_740_991 {
		return nil, errors.New("runtime semantic receipt v1.17 unavailable")
	}
	encoded, err := json.Marshal(receipt)
	if err != nil {
		return nil, errors.New("runtime semantic receipt v1.17 unavailable")
	}
	var claims map[string]any
	if err := json.Unmarshal(encoded, &claims); err != nil {
		return nil, errors.New("runtime semantic receipt v1.17 unavailable")
	}
	delete(claims, "signature")
	var loose bytes.Buffer
	encoder := json.NewEncoder(&loose)
	encoder.SetEscapeHTML(false)
	if err := encoder.Encode(claims); err != nil {
		return nil, errors.New("runtime semantic receipt v1.17 unavailable")
	}
	encodedClaims := bytes.TrimSuffix(loose.Bytes(), []byte("\n"))
	canonical := decodeCanonicalJSONV11(encodedClaims, canonicalJSONV11Options{
		Context: canonicalJSONV11CanonicalManifest,
	})
	if canonical.Error != nil {
		return nil, errors.New("runtime semantic receipt v1.17 unavailable")
	}
	claimBytes := canonical.CanonicalBytes
	domain := []byte(runtimeSemanticReceiptV117Domain)
	result := make([]byte, 8+len(domain)+8+len(claimBytes))
	binary.BigEndian.PutUint64(result[0:8], uint64(len(domain)))
	copy(result[8:], domain)
	offset := 8 + len(domain)
	binary.BigEndian.PutUint64(result[offset:offset+8], uint64(len(claimBytes)))
	copy(result[offset+8:], claimBytes)
	return result, nil
}

func validRuntimeSemanticReceiptV117(receipt runtimeSemanticReceiptV117, secret string) bool {
	if strings.TrimSpace(secret) == "" || !runtimeSemanticReceiptV117Signature.MatchString(receipt.Signature) {
		return false
	}
	for _, value := range []string{
		receipt.RequestSHA256, receipt.CompatibilityTupleID,
		receipt.AuthorityBundleHash, receipt.AuthoritySourceManifestHash,
		receipt.BottomIdentityManifestRoot, receipt.BottomEvidenceGraphRoot,
		receipt.TopIdentityManifestRoot, receipt.TopEvidenceGraphRoot,
		receipt.BudgetProfileSHA256, receipt.LedgerPrestateRoot,
		receipt.LedgerPoststateRoot, receipt.ChronicleCanonicalHash,
		receipt.FinalStateCanonicalHash, receipt.ReconstructedTerminalStateHash,
		receipt.OutcomeCanonicalHash,
	} {
		if !runtimeSemanticReceiptV117Hash.MatchString(value) {
			return false
		}
	}
	message, err := runtimeSemanticReceiptV117Message(receipt)
	if err != nil {
		return false
	}
	mac := hmac.New(sha256.New, []byte(secret))
	_, _ = mac.Write(message)
	expected := mac.Sum(nil)
	actual, err := hex.DecodeString(receipt.Signature[len("hmac-sha256:"):])
	return err == nil && hmac.Equal(actual, expected)
}

func validRuntimeSemanticReceiptV117Identifier(value string) bool {
	return value != "" && utf8.ValidString(value) && !strings.ContainsRune(value, '\x00') && len([]byte(value)) <= 512
}
