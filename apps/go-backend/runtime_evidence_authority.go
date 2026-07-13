package main

import (
	"bytes"
	"crypto/ed25519"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"
	"unicode/utf8"
)

const runtimeEvidenceAuthorityEnvelopeSchemaVersion = "v1.37-runtime-evidence-authority-envelope-v1"
const runtimeEvidenceAuthorityPayloadSchemaVersion = "v1.37-runtime-evidence-authority-payload-v1"
const runtimeEvidenceAuthorityHighWaterSchemaVersion = "v1.37-runtime-evidence-authority-high-water-v1"
const runtimeEvidenceAuthorityPublicKeySchemaVersion = "v1.37-runtime-evidence-authority-public-key-v1"
const runtimeEvidenceAuthorityProductionTrustDomain = "cowards-game:runtime-evidence-authority:production:v1"
const runtimeEvidenceAuthorityFixtureTrustDomain = "cowards-game:runtime-evidence-authority:fixture:v1"
const runtimeEvidenceAuthorityEnvelopeByteLimit = 1_500_000
const runtimeEvidenceAuthorityPayloadByteLimit = 1_000_000
const runtimeEvidenceAuthorityPublicKeyByteLimit = 16 * 1024
const runtimeEvidenceAuthorityHighWaterByteLimit = 4 * 1024
const runtimeEvidenceAuthorityCollectionLimit = 4_096
const runtimeEvidenceAuthorityReferenceLimit = 256
const runtimeEvidenceAuthorityIdentifierByteLimit = 512
const canonicalJSONInstantLayout = "2006-01-02T15:04:05.000Z"
const maximumCanonicalGeneration = uint64(9_007_199_254_740_991)

const runtimeEvidenceAuthorityBundlePathEnvironment = "COWARDS_RUNTIME_EVIDENCE_AUTHORITY_BUNDLE_PATH"
const runtimeEvidenceAuthorityPublicKeyPathEnvironment = "COWARDS_RUNTIME_EVIDENCE_AUTHORITY_PUBLIC_KEY_PATH"
const runtimeEvidenceAuthorityHighWaterPathEnvironment = "COWARDS_RUNTIME_EVIDENCE_AUTHORITY_HIGH_WATER_PATH"
const runtimeEvidenceAuthorityMinimumGenerationEnvironment = "COWARDS_RUNTIME_EVIDENCE_AUTHORITY_MIN_GENERATION"
const runtimeEvidenceAuthorityMinimumBundleHashEnvironment = "COWARDS_RUNTIME_EVIDENCE_AUTHORITY_MIN_BUNDLE_HASH"
const runtimeEvidenceAuthorityBootstrapEnvironment = "COWARDS_RUNTIME_EVIDENCE_AUTHORITY_BOOTSTRAP"
const integrityAuthorityManifestPathEnvironment = "COWARDS_INTEGRITY_AUTHORITY_MANIFEST_PATH"

var generationPattern = regexp.MustCompile(`^(?:0|[1-9][0-9]{0,15})$`)

type runtimeEvidenceAuthorityEnvelope struct {
	SchemaVersion   string `json:"schemaVersion"`
	TrustDomain     string `json:"trustDomain"`
	KeyID           string `json:"keyId"`
	Algorithm       string `json:"algorithm"`
	PayloadBase64   string `json:"payloadBase64"`
	PayloadSHA256   string `json:"payloadSha256"`
	SignatureBase64 string `json:"signatureBase64"`
}

type runtimeEvidenceAuthorityAttestation struct {
	AttestationID   string   `json:"attestationId"`
	AttestationHash string   `json:"attestationHash"`
	Verified        bool     `json:"verified"`
	Imports         []string `json:"imports"`
}

type runtimeEvidenceAuthorityCertificate struct {
	Kind                  string   `json:"kind"`
	CertificateID         string   `json:"certificateId"`
	CertificateVersion    string   `json:"certificateVersion"`
	CertificateRecordHash string   `json:"certificateRecordHash"`
	LaneIdentityHash      string   `json:"laneIdentityHash"`
	AttestationIDs        []string `json:"attestationIds"`
}

type runtimeEvidenceAuthorityRevocation struct {
	CertificateID         string `json:"certificateId"`
	CertificateRecordHash string `json:"certificateRecordHash"`
	RevokedAt             string `json:"revokedAt"`
	ReasonCode            string `json:"reasonCode"`
}

type runtimeEvidenceAuthoritySupersession struct {
	CertificateID             string `json:"certificateId"`
	SupersededByCertificateID string `json:"supersededByCertificateId"`
}

type runtimeEvidenceAuthorityLaneDisable struct {
	LaneIdentityHash string `json:"laneIdentityHash"`
	DisabledAt       string `json:"disabledAt"`
	ReasonCode       string `json:"reasonCode"`
}

type runtimeEvidenceAuthorityPayload struct {
	SchemaVersion             string                                 `json:"schemaVersion"`
	BundleVersion             string                                 `json:"bundleVersion"`
	RegistryGeneration        string                                 `json:"registryGeneration"`
	IssuedAt                  string                                 `json:"issuedAt"`
	ValidFrom                 string                                 `json:"validFrom"`
	ValidUntil                string                                 `json:"validUntil"`
	SemanticTupleManifestHash string                                 `json:"semanticTupleManifestHash"`
	Attestations              []runtimeEvidenceAuthorityAttestation  `json:"attestations"`
	Certificates              []runtimeEvidenceAuthorityCertificate  `json:"certificates"`
	Revocations               []runtimeEvidenceAuthorityRevocation   `json:"revocations"`
	Supersessions             []runtimeEvidenceAuthoritySupersession `json:"supersessions"`
	OperatorLaneDisables      []runtimeEvidenceAuthorityLaneDisable  `json:"operatorLaneDisables"`
}

type runtimeEvidenceAuthorityPublicKeyDescriptor struct {
	SchemaVersion string `json:"schemaVersion"`
	KeyID         string `json:"keyId"`
	Algorithm     string `json:"algorithm"`
	PublicKeyPEM  string `json:"publicKeyPem"`
}

type runtimeEvidenceAuthorityHighWater struct {
	SchemaVersion      string `json:"schemaVersion"`
	RegistryGeneration string `json:"registryGeneration"`
	PayloadSHA256      string `json:"payloadSha256"`
}

type verifiedRuntimeEvidenceAuthority struct {
	AuthorityBundleHash       string
	RegistryGeneration        string
	SemanticTupleManifestHash string
	TrustDomain               string
	KeyID                     string
	Payload                   runtimeEvidenceAuthorityPayload
}

type runtimeEvidenceAuthorityInspectOptions struct {
	ExpectedTrustDomain string
	EvaluationInstant   string
	TrustedKeys         map[string]ed25519.PublicKey
	IntegrityManifest   *integrityAuthorityManifest
}

type runtimeEvidenceAuthorityLoaderConfig struct {
	BundlePath                string
	PublicKeyPath             string
	HighWaterPath             string
	MinimumRegistryGeneration string
	MinimumBundleHash         string
	Bootstrap                 bool
	ExpectedTrustDomain       string
	EvaluationInstant         func() string
	IntegrityManifest         *integrityAuthorityManifest
	FileSystem                runtimeEvidenceAuthorityFileSystem
}

type runtimeEvidenceAuthorityLoader struct {
	config          runtimeEvidenceAuthorityLoaderConfig
	fileSystem      runtimeEvidenceAuthorityFileSystem
	mutex           sync.Mutex
	lastGood        *verifiedRuntimeEvidenceAuthority
	anchorUncertain bool
}

type runtimeEvidenceAuthorityError struct {
	Code string
}

func (err *runtimeEvidenceAuthorityError) Error() string {
	return "runtime evidence authority is unavailable"
}

func authorityError(code string) error {
	return &runtimeEvidenceAuthorityError{Code: code}
}

func loadProductionRuntimeEvidenceAuthorityFromEnvironment() (*verifiedRuntimeEvidenceAuthority, error) {
	manifestPath := strings.TrimSpace(os.Getenv(integrityAuthorityManifestPathEnvironment))
	if manifestPath == "" {
		manifestPath = defaultIntegrityAuthorityManifestPath()
	}
	manifestBytes, err := os.ReadFile(manifestPath)
	if err != nil || len(manifestBytes) > runtimeEvidenceAuthorityPayloadByteLimit {
		return nil, authorityError("CONFIGURATION")
	}
	manifest, err := parseIntegrityAuthorityManifest(manifestBytes)
	if err != nil {
		return nil, authorityError("CONFIGURATION")
	}
	bootstrapValue := strings.TrimSpace(os.Getenv(runtimeEvidenceAuthorityBootstrapEnvironment))
	if bootstrapValue == "" {
		bootstrapValue = "0"
	}
	if bootstrapValue != "0" && bootstrapValue != "1" {
		return nil, authorityError("CONFIGURATION")
	}
	loader := newRuntimeEvidenceAuthorityLoader(runtimeEvidenceAuthorityLoaderConfig{
		BundlePath:                strings.TrimSpace(os.Getenv(runtimeEvidenceAuthorityBundlePathEnvironment)),
		PublicKeyPath:             strings.TrimSpace(os.Getenv(runtimeEvidenceAuthorityPublicKeyPathEnvironment)),
		HighWaterPath:             strings.TrimSpace(os.Getenv(runtimeEvidenceAuthorityHighWaterPathEnvironment)),
		MinimumRegistryGeneration: strings.TrimSpace(os.Getenv(runtimeEvidenceAuthorityMinimumGenerationEnvironment)),
		MinimumBundleHash:         strings.TrimSpace(os.Getenv(runtimeEvidenceAuthorityMinimumBundleHashEnvironment)),
		Bootstrap:                 bootstrapValue == "1",
		ExpectedTrustDomain:       runtimeEvidenceAuthorityProductionTrustDomain,
		EvaluationInstant: func() string {
			return time.Now().UTC().Format(canonicalJSONInstantLayout)
		},
		IntegrityManifest: manifest,
	})
	return loader.Load()
}

func defaultIntegrityAuthorityManifestPath() string {
	candidates := []string{
		filepath.Join("..", "..", "packages", "spec", "artifacts", "v1.37-integrity-authority.json"),
		filepath.Join("packages", "spec", "artifacts", "v1.37-integrity-authority.json"),
	}
	for _, candidate := range candidates {
		if _, err := os.Stat(candidate); err == nil {
			return candidate
		}
	}
	return candidates[0]
}

func inspectRuntimeEvidenceAuthorityBundle(serialized []byte, options runtimeEvidenceAuthorityInspectOptions) (*verifiedRuntimeEvidenceAuthority, error) {
	if len(serialized) == 0 || len(serialized) > runtimeEvidenceAuthorityEnvelopeByteLimit {
		return nil, authorityError("ENVELOPE_LIMIT")
	}
	if options.ExpectedTrustDomain != runtimeEvidenceAuthorityProductionTrustDomain && options.ExpectedTrustDomain != runtimeEvidenceAuthorityFixtureTrustDomain {
		return nil, authorityError("TRUST_DOMAIN")
	}
	if options.IntegrityManifest == nil {
		return nil, authorityError("TUPLE_MANIFEST")
	}
	var envelope runtimeEvidenceAuthorityEnvelope
	if err := decodeStrictJSON(serialized, &envelope); err != nil {
		return nil, authorityError("ENVELOPE_JSON")
	}
	if envelope.SchemaVersion != runtimeEvidenceAuthorityEnvelopeSchemaVersion ||
		envelope.Algorithm != "Ed25519" ||
		!validAuthorityIdentifier(envelope.TrustDomain) ||
		!validAuthorityIdentifier(envelope.KeyID) ||
		envelope.TrustDomain != options.ExpectedTrustDomain ||
		!isPrefixedLowerSHA256(envelope.PayloadSHA256) {
		return nil, authorityError("ENVELOPE")
	}
	publicKey, trusted := options.TrustedKeys[envelope.KeyID]
	if !trusted || len(publicKey) != ed25519.PublicKeySize {
		return nil, authorityError("UNKNOWN_KEY")
	}
	payloadBytes, err := decodeCanonicalBase64(envelope.PayloadBase64)
	if err != nil || len(payloadBytes) == 0 || len(payloadBytes) > runtimeEvidenceAuthorityPayloadByteLimit {
		return nil, authorityError("PAYLOAD_LIMIT")
	}
	signature, err := decodeCanonicalBase64(envelope.SignatureBase64)
	if err != nil || len(signature) != ed25519.SignatureSize {
		return nil, authorityError("SIGNATURE_LENGTH")
	}
	payloadHash := hashRuntimeEvidenceAuthorityPayload(payloadBytes)
	if payloadHash != envelope.PayloadSHA256 {
		return nil, authorityError("PAYLOAD_HASH")
	}
	if !ed25519.Verify(publicKey, payloadBytes, signature) {
		return nil, authorityError("SIGNATURE")
	}
	payload, err := parseRuntimeEvidenceAuthorityPayload(payloadBytes)
	if err != nil {
		return nil, err
	}
	evaluation, err := parseCanonicalInstant(options.EvaluationInstant)
	if err != nil {
		return nil, authorityError("EVALUATION_INSTANT")
	}
	issuedAt, _ := parseCanonicalInstant(payload.IssuedAt)
	validFrom, _ := parseCanonicalInstant(payload.ValidFrom)
	validUntil, _ := parseCanonicalInstant(payload.ValidUntil)
	if evaluation.Before(issuedAt) || evaluation.Before(validFrom) || evaluation.After(validUntil) {
		return nil, authorityError("VALIDITY")
	}
	if !options.IntegrityManifest.hasTupleID(payload.SemanticTupleManifestHash) {
		return nil, authorityError("TUPLE_MANIFEST")
	}
	if options.ExpectedTrustDomain == runtimeEvidenceAuthorityProductionTrustDomain {
		for _, certificate := range payload.Certificates {
			if certificate.Kind == "conformance" {
				return nil, authorityError("CONFORMANCE_NOT_ENABLED")
			}
		}
	}
	return &verifiedRuntimeEvidenceAuthority{
		AuthorityBundleHash:       payloadHash,
		RegistryGeneration:        payload.RegistryGeneration,
		SemanticTupleManifestHash: payload.SemanticTupleManifestHash,
		TrustDomain:               envelope.TrustDomain,
		KeyID:                     envelope.KeyID,
		Payload:                   payload,
	}, nil
}

func parseRuntimeEvidenceAuthorityPayload(serialized []byte) (runtimeEvidenceAuthorityPayload, error) {
	var payload runtimeEvidenceAuthorityPayload
	if len(serialized) == 0 || len(serialized) > runtimeEvidenceAuthorityPayloadByteLimit || !utf8.Valid(serialized) {
		return payload, authorityError("PAYLOAD_LIMIT")
	}
	if err := decodeStrictJSON(serialized, &payload); err != nil {
		return payload, authorityError("PAYLOAD_JSON")
	}
	if payload.SchemaVersion != runtimeEvidenceAuthorityPayloadSchemaVersion ||
		!validAuthorityIdentifier(payload.BundleVersion) ||
		!validCanonicalGeneration(payload.RegistryGeneration) ||
		!isPrefixedLowerSHA256(payload.SemanticTupleManifestHash) ||
		payload.Attestations == nil || payload.Certificates == nil || payload.Revocations == nil || payload.Supersessions == nil || payload.OperatorLaneDisables == nil ||
		len(payload.Attestations) > runtimeEvidenceAuthorityCollectionLimit || len(payload.Certificates) > runtimeEvidenceAuthorityCollectionLimit || len(payload.Revocations) > runtimeEvidenceAuthorityCollectionLimit || len(payload.Supersessions) > runtimeEvidenceAuthorityCollectionLimit || len(payload.OperatorLaneDisables) > runtimeEvidenceAuthorityCollectionLimit {
		return payload, authorityError("PAYLOAD_SHAPE")
	}
	issuedAt, err := parseCanonicalInstant(payload.IssuedAt)
	if err != nil {
		return payload, authorityError("INVALID_INSTANT")
	}
	validFrom, err := parseCanonicalInstant(payload.ValidFrom)
	if err != nil {
		return payload, authorityError("INVALID_INSTANT")
	}
	validUntil, err := parseCanonicalInstant(payload.ValidUntil)
	if err != nil {
		return payload, authorityError("INVALID_INSTANT")
	}
	if issuedAt.After(validFrom) || !validFrom.Before(validUntil) {
		return payload, authorityError("INVALID_VALIDITY")
	}
	if err := validateRuntimeEvidenceAuthorityGraph(payload); err != nil {
		return payload, err
	}
	return payload, nil
}

func validateRuntimeEvidenceAuthorityGraph(payload runtimeEvidenceAuthorityPayload) error {
	attestations := make(map[string]runtimeEvidenceAuthorityAttestation, len(payload.Attestations))
	for _, attestation := range payload.Attestations {
		if !validAuthorityIdentifier(attestation.AttestationID) || !isPrefixedLowerSHA256(attestation.AttestationHash) || !attestation.Verified || attestation.Imports == nil || len(attestation.Imports) > runtimeEvidenceAuthorityReferenceLimit || hasDuplicateStrings(attestation.Imports) {
			return authorityError("INVALID_ATTESTATION")
		}
		if _, exists := attestations[attestation.AttestationID]; exists {
			return authorityError("DUPLICATE_ID")
		}
		for _, importedID := range attestation.Imports {
			if !validAuthorityIdentifier(importedID) {
				return authorityError("INVALID_ATTESTATION")
			}
		}
		attestations[attestation.AttestationID] = attestation
	}
	certificates := make(map[string]runtimeEvidenceAuthorityCertificate, len(payload.Certificates))
	for _, certificate := range payload.Certificates {
		if (certificate.Kind != "containment" && certificate.Kind != "conformance") || !validAuthorityIdentifier(certificate.CertificateID) || !validAuthorityIdentifier(certificate.CertificateVersion) || !isPrefixedLowerSHA256(certificate.CertificateRecordHash) || !isPrefixedLowerSHA256(certificate.LaneIdentityHash) || len(certificate.AttestationIDs) == 0 || len(certificate.AttestationIDs) > runtimeEvidenceAuthorityReferenceLimit || hasDuplicateStrings(certificate.AttestationIDs) {
			return authorityError("INVALID_CERTIFICATE")
		}
		if _, exists := certificates[certificate.CertificateID]; exists {
			return authorityError("DUPLICATE_ID")
		}
		certificates[certificate.CertificateID] = certificate
	}
	for _, attestation := range payload.Attestations {
		for _, importedID := range attestation.Imports {
			if _, exists := attestations[importedID]; !exists {
				return authorityError("DANGLING_GRAPH")
			}
		}
	}
	for _, certificate := range payload.Certificates {
		for _, attestationID := range certificate.AttestationIDs {
			if _, exists := attestations[attestationID]; !exists {
				return authorityError("DANGLING_GRAPH")
			}
		}
	}
	revocations := map[string]struct{}{}
	for _, revocation := range payload.Revocations {
		certificate, exists := certificates[revocation.CertificateID]
		key := revocation.CertificateID + "\x00" + revocation.CertificateRecordHash
		if !exists || certificate.CertificateRecordHash != revocation.CertificateRecordHash || !validAuthorityIdentifier(revocation.ReasonCode) {
			return authorityError("DANGLING_GRAPH")
		}
		if _, err := parseCanonicalInstant(revocation.RevokedAt); err != nil {
			return authorityError("INVALID_REVOCATION")
		}
		if _, exists := revocations[key]; exists {
			return authorityError("DUPLICATE_ID")
		}
		revocations[key] = struct{}{}
	}
	supersededBy := map[string]string{}
	for _, supersession := range payload.Supersessions {
		if _, exists := certificates[supersession.CertificateID]; !exists {
			return authorityError("DANGLING_GRAPH")
		}
		if _, exists := certificates[supersession.SupersededByCertificateID]; !exists {
			return authorityError("DANGLING_GRAPH")
		}
		if supersession.CertificateID == supersession.SupersededByCertificateID {
			return authorityError("SUPERSESSION_CYCLE")
		}
		if _, exists := supersededBy[supersession.CertificateID]; exists {
			return authorityError("DUPLICATE_ID")
		}
		supersededBy[supersession.CertificateID] = supersession.SupersededByCertificateID
	}
	for origin := range supersededBy {
		seen := map[string]struct{}{}
		for cursor := origin; cursor != ""; cursor = supersededBy[cursor] {
			if _, exists := seen[cursor]; exists {
				return authorityError("SUPERSESSION_CYCLE")
			}
			seen[cursor] = struct{}{}
		}
	}
	disables := map[string]struct{}{}
	for _, disable := range payload.OperatorLaneDisables {
		if !isPrefixedLowerSHA256(disable.LaneIdentityHash) || !validAuthorityIdentifier(disable.ReasonCode) {
			return authorityError("INVALID_LANE_DISABLE")
		}
		if _, err := parseCanonicalInstant(disable.DisabledAt); err != nil {
			return authorityError("INVALID_LANE_DISABLE")
		}
		if _, exists := disables[disable.LaneIdentityHash]; exists {
			return authorityError("DUPLICATE_ID")
		}
		disables[disable.LaneIdentityHash] = struct{}{}
	}
	return nil
}

func newRuntimeEvidenceAuthorityLoader(config runtimeEvidenceAuthorityLoaderConfig) *runtimeEvidenceAuthorityLoader {
	fileSystem := config.FileSystem
	if fileSystem == nil {
		fileSystem = osRuntimeEvidenceAuthorityFileSystem{}
	}
	return &runtimeEvidenceAuthorityLoader{config: config, fileSystem: fileSystem}
}

func (loader *runtimeEvidenceAuthorityLoader) Load() (*verifiedRuntimeEvidenceAuthority, error) {
	loader.mutex.Lock()
	defer loader.mutex.Unlock()
	if loader.anchorUncertain {
		return nil, authorityError("ANCHOR_IO")
	}
	if err := validateRuntimeEvidenceAuthorityLoaderConfig(loader.config); err != nil {
		return nil, err
	}
	bundleBytes, err := readBoundedAuthorityFile(loader.fileSystem, loader.config.BundlePath, runtimeEvidenceAuthorityEnvelopeByteLimit)
	if err != nil {
		return nil, authorityError("AUTHORITY_IO")
	}
	keyBytes, err := readBoundedAuthorityFile(loader.fileSystem, loader.config.PublicKeyPath, runtimeEvidenceAuthorityPublicKeyByteLimit)
	if err != nil {
		return nil, authorityError("PUBLIC_KEY")
	}
	descriptor, publicKey, err := parseRuntimeEvidenceAuthorityPublicKey(keyBytes)
	if err != nil {
		return nil, err
	}
	verified, err := inspectRuntimeEvidenceAuthorityBundle(bundleBytes, runtimeEvidenceAuthorityInspectOptions{
		ExpectedTrustDomain: loader.config.ExpectedTrustDomain,
		EvaluationInstant:   loader.config.EvaluationInstant(),
		TrustedKeys:         map[string]ed25519.PublicKey{descriptor.KeyID: publicKey},
		IntegrityManifest:   loader.config.IntegrityManifest,
	})
	if err != nil {
		return nil, err
	}
	candidate := runtimeEvidenceAuthorityHighWater{SchemaVersion: runtimeEvidenceAuthorityHighWaterSchemaVersion, RegistryGeneration: verified.RegistryGeneration, PayloadSHA256: verified.AuthorityBundleHash}
	pathLock := authorityPathMutex(loader.config.HighWaterPath)
	pathLock.Lock()
	defer pathLock.Unlock()
	lockPath := loader.config.HighWaterPath + ".lock"
	if err := loader.fileSystem.Mkdir(lockPath, 0o700); err != nil {
		return nil, authorityError("ANCHOR_IO")
	}
	lockRemoved := false
	defer func() {
		if !lockRemoved {
			if err := loader.fileSystem.Remove(lockPath); err != nil {
				loader.anchorUncertain = true
			}
		}
	}()
	highWater, err := readRuntimeEvidenceAuthorityHighWater(loader.fileSystem, loader.config.HighWaterPath)
	if err != nil {
		return nil, err
	}
	decision, err := evaluateRuntimeEvidenceAuthorityAntiRollback(candidate, loader.config.MinimumRegistryGeneration, loader.config.MinimumBundleHash, loader.config.Bootstrap, highWater)
	if err != nil {
		return nil, err
	}
	if decision.installRequired {
		renamed, installErr := installRuntimeEvidenceAuthorityHighWater(loader.fileSystem, loader.config.HighWaterPath, decision.next)
		if installErr != nil {
			if renamed {
				loader.anchorUncertain = true
			}
			return nil, authorityError("ANCHOR_IO")
		}
	}
	installed, err := readRuntimeEvidenceAuthorityHighWater(loader.fileSystem, loader.config.HighWaterPath)
	if err != nil || installed == nil || *installed != candidate {
		return nil, authorityError("ANCHOR_NOT_INSTALLED")
	}
	if err := loader.fileSystem.Remove(lockPath); err != nil {
		loader.anchorUncertain = true
		return nil, authorityError("ANCHOR_IO")
	}
	lockRemoved = true
	copy := *verified
	loader.lastGood = &copy
	return &copy, nil
}

func (loader *runtimeEvidenceAuthorityLoader) Current() *verifiedRuntimeEvidenceAuthority {
	loader.mutex.Lock()
	defer loader.mutex.Unlock()
	if loader.lastGood == nil {
		return nil
	}
	copy := *loader.lastGood
	return &copy
}

func validateRuntimeEvidenceAuthorityLoaderConfig(config runtimeEvidenceAuthorityLoaderConfig) error {
	if config.BundlePath == "" || config.PublicKeyPath == "" || config.HighWaterPath == "" || config.EvaluationInstant == nil || config.IntegrityManifest == nil || !validCanonicalGeneration(config.MinimumRegistryGeneration) || !isPrefixedLowerSHA256(config.MinimumBundleHash) || (config.ExpectedTrustDomain != runtimeEvidenceAuthorityProductionTrustDomain && config.ExpectedTrustDomain != runtimeEvidenceAuthorityFixtureTrustDomain) {
		return authorityError("CONFIGURATION")
	}
	return nil
}

func parseRuntimeEvidenceAuthorityPublicKey(serialized []byte) (runtimeEvidenceAuthorityPublicKeyDescriptor, ed25519.PublicKey, error) {
	var descriptor runtimeEvidenceAuthorityPublicKeyDescriptor
	if err := decodeStrictJSON(serialized, &descriptor); err != nil || descriptor.SchemaVersion != runtimeEvidenceAuthorityPublicKeySchemaVersion || descriptor.Algorithm != "Ed25519" || !validAuthorityIdentifier(descriptor.KeyID) || descriptor.PublicKeyPEM == "" {
		return descriptor, nil, authorityError("PUBLIC_KEY")
	}
	block, trailing := pem.Decode([]byte(descriptor.PublicKeyPEM))
	if block == nil || len(bytes.TrimSpace(trailing)) != 0 || block.Type != "PUBLIC KEY" {
		return descriptor, nil, authorityError("PUBLIC_KEY")
	}
	parsed, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		return descriptor, nil, authorityError("PUBLIC_KEY")
	}
	publicKey, ok := parsed.(ed25519.PublicKey)
	if !ok || len(publicKey) != ed25519.PublicKeySize {
		return descriptor, nil, authorityError("PUBLIC_KEY")
	}
	return descriptor, publicKey, nil
}

type authorityAntiRollbackDecision struct {
	installRequired bool
	next            runtimeEvidenceAuthorityHighWater
}

func evaluateRuntimeEvidenceAuthorityAntiRollback(candidate runtimeEvidenceAuthorityHighWater, minimumGeneration string, minimumHash string, bootstrap bool, highWater *runtimeEvidenceAuthorityHighWater) (authorityAntiRollbackDecision, error) {
	candidateGeneration, ok := parseCanonicalGeneration(candidate.RegistryGeneration)
	if !ok || !isPrefixedLowerSHA256(candidate.PayloadSHA256) {
		return authorityAntiRollbackDecision{}, authorityError("CANDIDATE")
	}
	minimum, ok := parseCanonicalGeneration(minimumGeneration)
	if !ok || !isPrefixedLowerSHA256(minimumHash) {
		return authorityAntiRollbackDecision{}, authorityError("BOOTSTRAP_PIN")
	}
	if candidateGeneration < minimum {
		return authorityAntiRollbackDecision{}, authorityError("ROLLBACK")
	}
	if candidateGeneration == minimum && candidate.PayloadSHA256 != minimumHash {
		return authorityAntiRollbackDecision{}, authorityError("PIN_FORK")
	}
	if highWater == nil {
		if !bootstrap {
			return authorityAntiRollbackDecision{}, authorityError("HIGH_WATER_MISSING")
		}
		if candidateGeneration != minimum || candidate.PayloadSHA256 != minimumHash {
			return authorityAntiRollbackDecision{}, authorityError("BOOTSTRAP_PIN")
		}
		return authorityAntiRollbackDecision{installRequired: true, next: candidate}, nil
	}
	highGeneration, ok := parseCanonicalGeneration(highWater.RegistryGeneration)
	if !ok || !isPrefixedLowerSHA256(highWater.PayloadSHA256) {
		return authorityAntiRollbackDecision{}, authorityError("HIGH_WATER")
	}
	if candidateGeneration < highGeneration {
		return authorityAntiRollbackDecision{}, authorityError("ROLLBACK")
	}
	if candidateGeneration == highGeneration && candidate.PayloadSHA256 != highWater.PayloadSHA256 {
		return authorityAntiRollbackDecision{}, authorityError("GENERATION_FORK")
	}
	return authorityAntiRollbackDecision{installRequired: candidateGeneration > highGeneration, next: candidate}, nil
}

func parseRuntimeEvidenceAuthorityHighWater(serialized []byte) (runtimeEvidenceAuthorityHighWater, error) {
	var record runtimeEvidenceAuthorityHighWater
	if len(serialized) == 0 || len(serialized) > runtimeEvidenceAuthorityHighWaterByteLimit || decodeStrictJSON(serialized, &record) != nil || record.SchemaVersion != runtimeEvidenceAuthorityHighWaterSchemaVersion || !validCanonicalGeneration(record.RegistryGeneration) || !isPrefixedLowerSHA256(record.PayloadSHA256) {
		return record, authorityError("HIGH_WATER")
	}
	return record, nil
}

func readRuntimeEvidenceAuthorityHighWater(fileSystem runtimeEvidenceAuthorityFileSystem, path string) (*runtimeEvidenceAuthorityHighWater, error) {
	serialized, err := readBoundedAuthorityFile(fileSystem, path, runtimeEvidenceAuthorityHighWaterByteLimit)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return nil, nil
		}
		return nil, authorityError("HIGH_WATER")
	}
	record, err := parseRuntimeEvidenceAuthorityHighWater(serialized)
	if err != nil {
		return nil, err
	}
	return &record, nil
}

func installRuntimeEvidenceAuthorityHighWater(fileSystem runtimeEvidenceAuthorityFileSystem, path string, record runtimeEvidenceAuthorityHighWater) (bool, error) {
	sequence := atomic.AddUint64(&authorityTemporarySequence, 1)
	temporaryPath := fmt.Sprintf("%s.tmp-%d-%d", path, os.Getpid(), sequence)
	serialized, err := json.Marshal(record)
	if err != nil {
		return false, err
	}
	serialized = append(serialized, '\n')
	file, err := fileSystem.OpenFile(temporaryPath, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o600)
	if err != nil {
		return false, err
	}
	renamed := false
	closed := false
	defer func() {
		if !closed {
			_ = file.Close()
		}
		if !renamed {
			_ = fileSystem.Remove(temporaryPath)
		}
	}()
	if _, err := file.Write(serialized); err != nil {
		return false, err
	}
	if err := file.Sync(); err != nil {
		return false, err
	}
	if err := file.Close(); err != nil {
		return false, err
	}
	closed = true
	if err := fileSystem.Rename(temporaryPath, path); err != nil {
		return false, err
	}
	renamed = true
	directory, err := fileSystem.Open(filepath.Dir(path))
	if err != nil {
		return true, err
	}
	directoryClosed := false
	defer func() {
		if !directoryClosed {
			_ = directory.Close()
		}
	}()
	if err := directory.Sync(); err != nil {
		return true, err
	}
	if err := directory.Close(); err != nil {
		return true, err
	}
	directoryClosed = true
	return true, nil
}

type runtimeEvidenceAuthorityFile interface {
	io.Reader
	io.Writer
	Stat() (os.FileInfo, error)
	Sync() error
	Close() error
}

type runtimeEvidenceAuthorityFileSystem interface {
	Open(path string) (runtimeEvidenceAuthorityFile, error)
	OpenFile(path string, flag int, permission os.FileMode) (runtimeEvidenceAuthorityFile, error)
	Rename(from string, to string) error
	Remove(path string) error
	Mkdir(path string, permission os.FileMode) error
}

type osRuntimeEvidenceAuthorityFileSystem struct{}

func (osRuntimeEvidenceAuthorityFileSystem) Open(path string) (runtimeEvidenceAuthorityFile, error) {
	return os.Open(path)
}
func (osRuntimeEvidenceAuthorityFileSystem) OpenFile(path string, flag int, permission os.FileMode) (runtimeEvidenceAuthorityFile, error) {
	return os.OpenFile(path, flag, permission)
}
func (osRuntimeEvidenceAuthorityFileSystem) Rename(from string, to string) error {
	return os.Rename(from, to)
}
func (osRuntimeEvidenceAuthorityFileSystem) Remove(path string) error { return os.Remove(path) }
func (osRuntimeEvidenceAuthorityFileSystem) Mkdir(path string, permission os.FileMode) error {
	return os.Mkdir(path, permission)
}

func readBoundedAuthorityFile(fileSystem runtimeEvidenceAuthorityFileSystem, path string, limit int64) ([]byte, error) {
	file, err := fileSystem.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()
	info, err := file.Stat()
	if err != nil || !info.Mode().IsRegular() || info.Size() <= 0 || info.Size() > limit {
		return nil, authorityError("FILE_LIMIT")
	}
	serialized, err := io.ReadAll(io.LimitReader(file, limit+1))
	if err != nil || int64(len(serialized)) > limit {
		return nil, authorityError("FILE_LIMIT")
	}
	return serialized, nil
}

func decodeCanonicalBase64(value string) ([]byte, error) {
	if value == "" || len(value)%4 != 0 {
		return nil, errors.New("base64 is not canonical")
	}
	decoded, err := base64.StdEncoding.DecodeString(value)
	if err != nil || base64.StdEncoding.EncodeToString(decoded) != value {
		return nil, errors.New("base64 is not canonical")
	}
	return decoded, nil
}

func hashRuntimeEvidenceAuthorityPayload(payload []byte) string {
	digest := sha256.Sum256(payload)
	return "sha256:" + hex.EncodeToString(digest[:])
}

func validAuthorityIdentifier(value string) bool {
	return value != "" && utf8.ValidString(value) && len([]byte(value)) <= runtimeEvidenceAuthorityIdentifierByteLimit
}

func isLowerSHA256(value string) bool {
	if len(value) != 64 {
		return false
	}
	for _, character := range value {
		if (character < '0' || character > '9') && (character < 'a' || character > 'f') {
			return false
		}
	}
	return true
}

func isPrefixedLowerSHA256(value string) bool {
	return len(value) == 71 && value[:7] == "sha256:" && isLowerSHA256(value[7:])
}

func parseCanonicalGeneration(value string) (uint64, bool) {
	if !generationPattern.MatchString(value) {
		return 0, false
	}
	generation, err := strconv.ParseUint(value, 10, 64)
	return generation, err == nil && generation <= maximumCanonicalGeneration
}

func validCanonicalGeneration(value string) bool { _, ok := parseCanonicalGeneration(value); return ok }

func parseCanonicalInstant(value string) (time.Time, error) {
	if !validAuthorityIdentifier(value) {
		return time.Time{}, errors.New("instant is invalid")
	}
	parsed, err := time.Parse(canonicalJSONInstantLayout, value)
	if err != nil || parsed.Format(canonicalJSONInstantLayout) != value {
		return time.Time{}, errors.New("instant is invalid")
	}
	return parsed, nil
}

func hasDuplicateStrings(values []string) bool {
	seen := make(map[string]struct{}, len(values))
	for _, value := range values {
		if !validAuthorityIdentifier(value) {
			return true
		}
		if _, exists := seen[value]; exists {
			return true
		}
		seen[value] = struct{}{}
	}
	return false
}

var authorityTemporarySequence uint64
var authorityPathLocks sync.Map

func authorityPathMutex(path string) *sync.Mutex {
	value, _ := authorityPathLocks.LoadOrStore(path, &sync.Mutex{})
	return value.(*sync.Mutex)
}
