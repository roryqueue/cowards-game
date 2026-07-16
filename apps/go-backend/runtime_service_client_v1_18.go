package main

import (
	"bytes"
	"crypto/ed25519"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/hex"
	"encoding/pem"
	"errors"
	"reflect"
	"regexp"
	"sort"
	"strings"
	"time"
)

const runtimeSemanticReceiptSchemaVersionV118 = "runtime-semantic-receipt-v1.18"
const runtimeSemanticReceiptProfileV118 = "canonical-semantic-admission-v1"
const runtimeExecutionServiceVersionV118 = "runtime-execution-service-v1.18"

var runtimeSemanticReceiptBoundedIdentifierV118 = regexp.MustCompile(`^[A-Za-z0-9][A-Za-z0-9._:-]{0,511}$`)
var runtimeSemanticReceiptFloatingIdentifierV118 = regexp.MustCompile(`(?i)(?:^|[-_.:])(latest|current|default|any|stable|head)(?:$|[-_.:])|[*^~<>]`)
var runtimeSemanticReceiptGenerationV118 = regexp.MustCompile(`^(?:0|[1-9][0-9]{0,15})$`)

type runtimeSemanticTupleComponentsV118 struct {
	Rules        string `json:"rules"`
	Engine       string `json:"engine"`
	RuntimeABI   string `json:"runtimeAbi"`
	Chronicle    string `json:"chronicle"`
	ArenaCatalog string `json:"arenaCatalog"`
	SetPolicy    string `json:"setPolicy"`
}

type runtimeSemanticTupleV118 struct {
	TupleID    string                             `json:"tupleId"`
	Components runtimeSemanticTupleComponentsV118 `json:"components"`
}

type runtimeCertificateSourceIdentityV118 struct {
	Side                   string `json:"side"`
	StrategyRevisionID     string `json:"strategyRevisionId"`
	OriginalSourceSHA256   string `json:"originalSourceSha256"`
	NormalizedSourceSHA256 string `json:"normalizedSourceSha256"`
	ArtifactSHA256         string `json:"artifactSha256"`
	IdentityManifestRoot   string `json:"identityManifestRoot"`
	EvidenceGraphRoot      string `json:"evidenceGraphRoot"`
	LaneIdentityHash       string `json:"laneIdentityHash"`
}

type runtimeCertificateReferenceV118 struct {
	Side                  string                               `json:"side"`
	CertificateID         string                               `json:"certificateId"`
	CertificateRecordHash string                               `json:"certificateRecordHash"`
	RegistryGeneration    string                               `json:"registryGeneration"`
	Lane                  string                               `json:"lane"`
	FreshUntil            string                               `json:"freshUntil"`
	SourceIdentity        runtimeCertificateSourceIdentityV118 `json:"sourceIdentity"`
}

type runtimeCertificateReferencesV118 struct {
	Bottom runtimeCertificateReferenceV118 `json:"bottom"`
	Top    runtimeCertificateReferenceV118 `json:"top"`
}

type runtimeExecutionAccountingResultV118 struct {
	BudgetProfileRoot   string `json:"budgetProfileRoot"`
	LedgerPrestateRoot  string `json:"ledgerPrestateRoot"`
	LedgerPoststateRoot string `json:"ledgerPoststateRoot"`
}

type runtimeSemanticTerminalV118 struct {
	Status string `json:"status"`
	Reason string `json:"reason"`
}

type runtimeSemanticAdmissionResultV118 struct {
	ResultClass    string `json:"resultClass"`
	Ownership      string `json:"ownership"`
	Retryable      bool   `json:"retryable"`
	MutationStatus string `json:"mutationStatus"`
}

type runtimeSemanticAdmissionClaimV118 struct {
	SchemaVersion           string                               `json:"schemaVersion"`
	Profile                 string                               `json:"profile"`
	ServiceContractVersion  string                               `json:"serviceContractVersion"`
	RequestSHA256           string                               `json:"requestSha256"`
	RequestID               string                               `json:"requestId"`
	MatchID                 string                               `json:"matchId"`
	SemanticTuple           runtimeSemanticTupleV118             `json:"semanticTuple"`
	AuthorityGeneration     string                               `json:"authorityGeneration"`
	EvaluationInstant       string                               `json:"evaluationInstant"`
	CertificateReferences   runtimeCertificateReferencesV118     `json:"certificateReferences"`
	ChronicleCanonicalHash  string                               `json:"chronicleCanonicalHash"`
	TransitionTraceRoot     string                               `json:"transitionTraceRoot"`
	FinalStateCanonicalHash string                               `json:"finalStateCanonicalHash"`
	OutcomeCanonicalHash    string                               `json:"outcomeCanonicalHash"`
	Terminal                runtimeSemanticTerminalV118          `json:"terminal"`
	Accounting              runtimeExecutionAccountingResultV118 `json:"accounting"`
	Result                  runtimeSemanticAdmissionResultV118   `json:"result"`
}

type runtimeSemanticReceiptV118 struct {
	Claim           runtimeSemanticAdmissionClaimV118 `json:"claim"`
	Algorithm       string                            `json:"algorithm"`
	KeyID           string                            `json:"keyId"`
	SignatureBase64 string                            `json:"signatureBase64"`
}

type runtimeSemanticReceiptTrustedKeyV118 struct {
	KeyID        string
	PublicKeyPEM string
}

type runtimeSemanticReceiptFailureV118 struct {
	Classification string `json:"classification"`
	Ownership      string `json:"ownership"`
	Code           string `json:"code"`
	PublicMessage  string `json:"publicMessage"`
	Retryable      bool   `json:"retryable"`
	PlayerPenalty  bool   `json:"playerPenalty"`
	MutationStatus string `json:"mutationStatus"`
}

var runtimeSemanticReceiptInvalidFailureV118 = runtimeSemanticReceiptFailureV118{
	Classification: "system_failure",
	Ownership:      "system_integrity",
	Code:           "SEMANTIC_RECEIPT_INVALID",
	PublicMessage:  "Runtime result could not be authenticated.",
	Retryable:      false,
	PlayerPenalty:  false,
	MutationStatus: "none",
}

type publicRuntimeCertificateReferenceV118 struct {
	CertificateID         string `json:"certificateId"`
	CertificateRecordHash string `json:"certificateRecordHash"`
	RegistryGeneration    string `json:"registryGeneration"`
	Lane                  string `json:"lane"`
	FreshUntil            string `json:"freshUntil"`
}

type publicRuntimeSemanticReceiptV118 struct {
	SchemaVersion          string `json:"schemaVersion"`
	ServiceContractVersion string `json:"serviceContractVersion"`
	RequestSHA256          string `json:"requestSha256"`
	RequestID              string `json:"requestId"`
	MatchID                string `json:"matchId"`
	SemanticTupleID        string `json:"semanticTupleId"`
	AuthorityGeneration    string `json:"authorityGeneration"`
	CertificateReferences  struct {
		Bottom publicRuntimeCertificateReferenceV118 `json:"bottom"`
		Top    publicRuntimeCertificateReferenceV118 `json:"top"`
	} `json:"certificateReferences"`
	ChronicleCanonicalHash  string                               `json:"chronicleCanonicalHash"`
	TransitionTraceRoot     string                               `json:"transitionTraceRoot"`
	FinalStateCanonicalHash string                               `json:"finalStateCanonicalHash"`
	OutcomeCanonicalHash    string                               `json:"outcomeCanonicalHash"`
	Terminal                runtimeSemanticTerminalV118          `json:"terminal"`
	Accounting              runtimeExecutionAccountingResultV118 `json:"accounting"`
	Result                  runtimeSemanticAdmissionResultV118   `json:"result"`
}

type verifiedRuntimeSemanticReceiptV118 struct {
	Claim            runtimeSemanticAdmissionClaimV118
	PublicProjection publicRuntimeSemanticReceiptV118
	ReceiptSHA256    string
	ClaimSHA256      string
	authenticated    bool
}

type runtimeSemanticReceiptVerificationInputV118 struct {
	ReceiptBytes  []byte
	TrustedKey    runtimeSemanticReceiptTrustedKeyV118
	ExpectedClaim runtimeSemanticAdmissionClaimV118
}

func runtimeSemanticReceiptFailureResultV118() (*verifiedRuntimeSemanticReceiptV118, *runtimeSemanticReceiptFailureV118) {
	failure := runtimeSemanticReceiptInvalidFailureV118
	return nil, &failure
}

func verifyRuntimeSemanticReceiptV118(
	input runtimeSemanticReceiptVerificationInputV118,
) (*verifiedRuntimeSemanticReceiptV118, *runtimeSemanticReceiptFailureV118) {
	receipt, err := parseRuntimeSemanticReceiptV118(input.ReceiptBytes)
	if err != nil ||
		!validRuntimeSemanticAdmissionClaimV118(input.ExpectedClaim) ||
		receipt.KeyID != input.TrustedKey.KeyID ||
		!reflect.DeepEqual(receipt.Claim, input.ExpectedClaim) {
		return runtimeSemanticReceiptFailureResultV118()
	}
	publicKey, err := parseRuntimeSemanticReceiptPublicKeyV118(input.TrustedKey.PublicKeyPEM)
	if err != nil {
		return runtimeSemanticReceiptFailureResultV118()
	}
	signature, err := base64.StdEncoding.Strict().DecodeString(receipt.SignatureBase64)
	if err != nil || len(signature) != ed25519.SignatureSize ||
		base64.StdEncoding.EncodeToString(signature) != receipt.SignatureBase64 {
		return runtimeSemanticReceiptFailureResultV118()
	}
	message, err := encodeRuntimeSemanticAdmissionClaimV118(receipt.Claim)
	if err != nil || !ed25519.Verify(publicKey, message, signature) {
		return runtimeSemanticReceiptFailureResultV118()
	}
	claimDigest := sha256.Sum256(message)
	return &verifiedRuntimeSemanticReceiptV118{
		Claim:            receipt.Claim,
		PublicProjection: projectPublicRuntimeSemanticReceiptV118(receipt.Claim),
		ReceiptSHA256:    runtimeInvocationV117SHA256Value(input.ReceiptBytes),
		ClaimSHA256:      "sha256:" + hex.EncodeToString(claimDigest[:]),
		authenticated:    true,
	}, nil
}

func parseRuntimeSemanticReceiptV118(serialized []byte) (runtimeSemanticReceiptV118, error) {
	canonical := decodeCanonicalJSONV11(serialized, canonicalJSONV11Options{
		Context:          canonicalJSONV11CanonicalManifest,
		RequireCanonical: true,
	})
	if canonical.Error != nil || !runtimeSemanticReceiptV118ExactShape(canonical.Value) {
		return runtimeSemanticReceiptV118{}, errors.New("runtime semantic receipt v1.18 unavailable")
	}
	var receipt runtimeSemanticReceiptV118
	if err := decodeStrictJSON(canonical.CanonicalBytes, &receipt); err != nil ||
		receipt.Algorithm != "Ed25519" ||
		!validRuntimeSemanticReceiptExactIdentifierV118(receipt.KeyID) ||
		!validRuntimeSemanticAdmissionClaimV118(receipt.Claim) {
		return runtimeSemanticReceiptV118{}, errors.New("runtime semantic receipt v1.18 unavailable")
	}
	signature, err := base64.StdEncoding.Strict().DecodeString(receipt.SignatureBase64)
	if err != nil || len(signature) != ed25519.SignatureSize ||
		base64.StdEncoding.EncodeToString(signature) != receipt.SignatureBase64 {
		return runtimeSemanticReceiptV118{}, errors.New("runtime semantic receipt v1.18 unavailable")
	}
	return receipt, nil
}

func encodeRuntimeSemanticAdmissionClaimV118(claim runtimeSemanticAdmissionClaimV118) ([]byte, error) {
	if !validRuntimeSemanticAdmissionClaimV118(claim) {
		return nil, errors.New("runtime semantic claim v1.18 unavailable")
	}
	canonicalClaim, err := runtimeInvocationV117CanonicalValue(claim)
	if err != nil {
		return nil, errors.New("runtime semantic claim v1.18 unavailable")
	}
	return runtimeInvocationV117Frame(runtimeSemanticReceiptDomainV118, canonicalClaim), nil
}

func parseRuntimeSemanticReceiptPublicKeyV118(serialized string) (ed25519.PublicKey, error) {
	if serialized == "" {
		return nil, errors.New("runtime semantic receipt public key unavailable")
	}
	block, trailing := pem.Decode([]byte(serialized))
	if block == nil || block.Type != "PUBLIC KEY" || len(bytes.TrimSpace(trailing)) != 0 {
		return nil, errors.New("runtime semantic receipt public key unavailable")
	}
	parsed, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		return nil, errors.New("runtime semantic receipt public key unavailable")
	}
	publicKey, ok := parsed.(ed25519.PublicKey)
	if !ok || len(publicKey) != ed25519.PublicKeySize {
		return nil, errors.New("runtime semantic receipt public key unavailable")
	}
	return append(ed25519.PublicKey(nil), publicKey...), nil
}

func validRuntimeSemanticAdmissionClaimV118(claim runtimeSemanticAdmissionClaimV118) bool {
	if claim.SchemaVersion != runtimeSemanticReceiptSchemaVersionV118 ||
		claim.Profile != runtimeSemanticReceiptProfileV118 ||
		claim.ServiceContractVersion != runtimeExecutionServiceVersionV118 ||
		!isPrefixedLowerSHA256(claim.RequestSHA256) ||
		!validRuntimeSemanticReceiptExactIdentifierV118(claim.RequestID) ||
		!validRuntimeSemanticReceiptExactIdentifierV118(claim.MatchID) ||
		!validRuntimeSemanticTupleV118(claim.SemanticTuple) ||
		!runtimeSemanticReceiptGenerationV118.MatchString(claim.AuthorityGeneration) ||
		!isPrefixedLowerSHA256(claim.ChronicleCanonicalHash) ||
		!isPrefixedLowerSHA256(claim.TransitionTraceRoot) ||
		!isPrefixedLowerSHA256(claim.FinalStateCanonicalHash) ||
		!isPrefixedLowerSHA256(claim.OutcomeCanonicalHash) ||
		!validRuntimeSemanticReceiptExactIdentifierV118(claim.Terminal.Status) ||
		!validRuntimeSemanticReceiptExactIdentifierV118(claim.Terminal.Reason) ||
		!isPrefixedLowerSHA256(claim.Accounting.BudgetProfileRoot) ||
		!isPrefixedLowerSHA256(claim.Accounting.LedgerPrestateRoot) ||
		!isPrefixedLowerSHA256(claim.Accounting.LedgerPoststateRoot) ||
		!validRuntimeSemanticAdmissionResultV118(claim.Result) {
		return false
	}
	evaluationInstant, err := parseCanonicalInstant(claim.EvaluationInstant)
	if err != nil {
		return false
	}
	bottom := claim.CertificateReferences.Bottom
	top := claim.CertificateReferences.Top
	return validRuntimeCertificateReferenceV118(bottom, "bottom", claim.AuthorityGeneration, evaluationInstant) &&
		validRuntimeCertificateReferenceV118(top, "top", claim.AuthorityGeneration, evaluationInstant) &&
		bottom.CertificateID != top.CertificateID &&
		bottom.CertificateRecordHash != top.CertificateRecordHash
}

func validRuntimeSemanticTupleV118(tuple runtimeSemanticTupleV118) bool {
	components := tuple.Components
	for _, value := range []string{
		components.Rules, components.Engine, components.RuntimeABI,
		components.Chronicle, components.ArenaCatalog, components.SetPolicy,
	} {
		if !validRuntimeSemanticReceiptBoundedIdentifierV118(value) {
			return false
		}
	}
	canonical, err := runtimeInvocationV117CanonicalValue(components)
	if err != nil {
		return false
	}
	expected := runtimeInvocationV117SHA256Value(
		runtimeInvocationV117Frame(successorCompatibilityTupleDomainTag, canonical),
	)
	return tuple.TupleID == expected
}

func validRuntimeCertificateReferenceV118(
	reference runtimeCertificateReferenceV118,
	side string,
	authorityGeneration string,
	evaluationInstant time.Time,
) bool {
	freshUntil, err := parseCanonicalInstant(reference.FreshUntil)
	if err != nil {
		return false
	}
	source := reference.SourceIdentity
	return reference.Side == side &&
		validRuntimeSemanticReceiptExactIdentifierV118(reference.CertificateID) &&
		isPrefixedLowerSHA256(reference.CertificateRecordHash) &&
		reference.RegistryGeneration == authorityGeneration &&
		runtimeSemanticReceiptGenerationV118.MatchString(reference.RegistryGeneration) &&
		validRuntimeSemanticReceiptExactIdentifierV118(reference.Lane) &&
		freshUntil.After(evaluationInstant) &&
		source.Side == side &&
		validRuntimeSemanticReceiptExactIdentifierV118(source.StrategyRevisionID) &&
		isPrefixedLowerSHA256(source.OriginalSourceSHA256) &&
		isPrefixedLowerSHA256(source.NormalizedSourceSHA256) &&
		isPrefixedLowerSHA256(source.ArtifactSHA256) &&
		isPrefixedLowerSHA256(source.IdentityManifestRoot) &&
		isPrefixedLowerSHA256(source.EvidenceGraphRoot) &&
		isPrefixedLowerSHA256(source.LaneIdentityHash)
}

func validRuntimeSemanticAdmissionResultV118(result runtimeSemanticAdmissionResultV118) bool {
	switch result.ResultClass {
	case "success":
		return result.Ownership == "gameplay" && !result.Retryable && result.MutationStatus == "committed"
	case "player_violation":
		return result.Ownership == "player" && !result.Retryable && result.MutationStatus == "committed"
	case "system_failure":
		return result.Ownership == "system" && result.MutationStatus == "none"
	default:
		return false
	}
}

func validRuntimeSemanticReceiptBoundedIdentifierV118(value string) bool {
	return runtimeSemanticReceiptBoundedIdentifierV118.MatchString(value)
}

func validRuntimeSemanticReceiptExactIdentifierV118(value string) bool {
	return validRuntimeSemanticReceiptBoundedIdentifierV118(value) &&
		!runtimeSemanticReceiptFloatingIdentifierV118.MatchString(value)
}

func projectPublicRuntimeSemanticReceiptV118(
	claim runtimeSemanticAdmissionClaimV118,
) publicRuntimeSemanticReceiptV118 {
	projection := publicRuntimeSemanticReceiptV118{
		SchemaVersion:           "runtime-semantic-receipt-public-v1.18",
		ServiceContractVersion:  claim.ServiceContractVersion,
		RequestSHA256:           claim.RequestSHA256,
		RequestID:               claim.RequestID,
		MatchID:                 claim.MatchID,
		SemanticTupleID:         claim.SemanticTuple.TupleID,
		AuthorityGeneration:     claim.AuthorityGeneration,
		ChronicleCanonicalHash:  claim.ChronicleCanonicalHash,
		TransitionTraceRoot:     claim.TransitionTraceRoot,
		FinalStateCanonicalHash: claim.FinalStateCanonicalHash,
		OutcomeCanonicalHash:    claim.OutcomeCanonicalHash,
		Terminal:                claim.Terminal,
		Accounting:              claim.Accounting,
		Result:                  claim.Result,
	}
	projection.CertificateReferences.Bottom = publicRuntimeCertificateReferenceV118{
		CertificateID:         claim.CertificateReferences.Bottom.CertificateID,
		CertificateRecordHash: claim.CertificateReferences.Bottom.CertificateRecordHash,
		RegistryGeneration:    claim.CertificateReferences.Bottom.RegistryGeneration,
		Lane:                  claim.CertificateReferences.Bottom.Lane,
		FreshUntil:            claim.CertificateReferences.Bottom.FreshUntil,
	}
	projection.CertificateReferences.Top = publicRuntimeCertificateReferenceV118{
		CertificateID:         claim.CertificateReferences.Top.CertificateID,
		CertificateRecordHash: claim.CertificateReferences.Top.CertificateRecordHash,
		RegistryGeneration:    claim.CertificateReferences.Top.RegistryGeneration,
		Lane:                  claim.CertificateReferences.Top.Lane,
		FreshUntil:            claim.CertificateReferences.Top.FreshUntil,
	}
	return projection
}

func runtimeSemanticReceiptV118ExactShape(value any) bool {
	receipt, ok := value.(map[string]any)
	if !ok || !runtimeSemanticExactObjectFieldsV118(receipt, []string{"claim", "algorithm", "keyId", "signatureBase64"}) {
		return false
	}
	claim, ok := receipt["claim"].(map[string]any)
	if !ok || !runtimeSemanticExactObjectFieldsV118(claim, runtimeSemanticReceiptClaimFieldsV118[:]) {
		return false
	}
	tuple, ok := claim["semanticTuple"].(map[string]any)
	if !ok || !runtimeSemanticExactObjectFieldsV118(tuple, []string{"tupleId", "components"}) {
		return false
	}
	components, ok := tuple["components"].(map[string]any)
	if !ok || !runtimeSemanticExactObjectFieldsV118(components, []string{
		"rules", "engine", "runtimeAbi", "chronicle", "arenaCatalog", "setPolicy",
	}) {
		return false
	}
	references, ok := claim["certificateReferences"].(map[string]any)
	if !ok || !runtimeSemanticExactObjectFieldsV118(references, []string{"bottom", "top"}) {
		return false
	}
	for _, side := range []string{"bottom", "top"} {
		reference, ok := references[side].(map[string]any)
		if !ok || !runtimeSemanticExactObjectFieldsV118(reference, runtimeCertificateReferenceFieldsV118[:]) {
			return false
		}
		source, ok := reference["sourceIdentity"].(map[string]any)
		if !ok || !runtimeSemanticExactObjectFieldsV118(source, runtimeCertificateSourceIdentityFieldsV118[:]) {
			return false
		}
	}
	terminal, terminalOK := claim["terminal"].(map[string]any)
	accounting, accountingOK := claim["accounting"].(map[string]any)
	result, resultOK := claim["result"].(map[string]any)
	return terminalOK && runtimeSemanticExactObjectFieldsV118(terminal, []string{"status", "reason"}) &&
		accountingOK && runtimeSemanticExactObjectFieldsV118(accounting, []string{
		"budgetProfileRoot", "ledgerPrestateRoot", "ledgerPoststateRoot",
	}) &&
		resultOK && runtimeSemanticExactObjectFieldsV118(result, []string{
		"resultClass", "ownership", "retryable", "mutationStatus",
	})
}

func runtimeSemanticExactObjectFieldsV118(value map[string]any, expected []string) bool {
	actual := make([]string, 0, len(value))
	for field := range value {
		actual = append(actual, field)
	}
	sort.Strings(actual)
	wanted := append([]string(nil), expected...)
	sort.Strings(wanted)
	return reflect.DeepEqual(actual, wanted)
}

func runtimeSemanticReceiptV118GeneratedTablesMatch() bool {
	return reflect.DeepEqual(runtimeSemanticReceiptClaimFieldsV118[:], runtimeSemanticAdmissionClaimFieldNamesV118()) &&
		reflect.DeepEqual(runtimeCertificateReferenceFieldsV118[:], runtimeCertificateReferenceFieldNamesV118()) &&
		reflect.DeepEqual(runtimeCertificateSourceIdentityFieldsV118[:], runtimeCertificateSourceIdentityFieldNamesV118())
}

func runtimeSemanticAdmissionClaimFieldNamesV118() []string {
	return runtimeSemanticJSONFieldNamesV118(reflect.TypeOf(runtimeSemanticAdmissionClaimV118{}))
}

func runtimeCertificateReferenceFieldNamesV118() []string {
	return runtimeSemanticJSONFieldNamesV118(reflect.TypeOf(runtimeCertificateReferenceV118{}))
}

func runtimeCertificateSourceIdentityFieldNamesV118() []string {
	return runtimeSemanticJSONFieldNamesV118(reflect.TypeOf(runtimeCertificateSourceIdentityV118{}))
}

func runtimeSemanticJSONFieldNamesV118(value reflect.Type) []string {
	fields := make([]string, 0, value.NumField())
	for index := 0; index < value.NumField(); index++ {
		name := strings.Split(value.Field(index).Tag.Get("json"), ",")[0]
		if name != "" && name != "-" {
			fields = append(fields, name)
		}
	}
	return fields
}
