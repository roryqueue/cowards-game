package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"unicode/utf8"
)

const versionedIntegrityAuthoritySchemaVersion = "v1.37-integrity-authority-v2"
const versionedIntegrityAuthorityGeneratorVersion = "generate-v1-37-integrity-authority-v2"

const legacyCompatibilityTupleIdentityProfile = "legacy-compatibility-tuple-v1"
const legacyCompatibilityTupleEncodingID = "nul-delimited-decimal-length-utf8-v1"
const successorCompatibilityTupleIdentityProfile = runtimeSuccessorSemanticTupleIdentityProfileV117
const successorCompatibilityTupleEncodingID = runtimeSuccessorSemanticTupleEncodingIDV117

const successorCompatibilityTupleDomainTag = "cowards-game:runtime-identity:v1:semantic-tuple"

type versionedIntegrityIdentityProfile struct {
	IdentityProfile      string   `json:"identityProfile"`
	EncodingID           string   `json:"encodingId"`
	Kind                 string   `json:"kind"`
	DomainTag            string   `json:"domainTag"`
	FieldOrder           []string `json:"fieldOrder,omitempty"`
	Separator            string   `json:"separator,omitempty"`
	LengthUnit           string   `json:"lengthUnit,omitempty"`
	LengthEncoding       string   `json:"lengthEncoding,omitempty"`
	CanonicalJSONProfile string   `json:"canonicalJsonProfile,omitempty"`
	CanonicalJSONContext string   `json:"canonicalJsonContext,omitempty"`
	Framing              string   `json:"framing,omitempty"`
	Segments             []string `json:"segments,omitempty"`
	HashAlgorithm        string   `json:"hashAlgorithm"`
	TupleIDFormat        string   `json:"tupleIdFormat"`
}

type versionedCompatibilityTupleRecord struct {
	IdentityProfile string                      `json:"identityProfile"`
	EncodingID      string                      `json:"encodingId"`
	TupleID         string                      `json:"tupleId"`
	Algorithm       string                      `json:"algorithm"`
	SHA256          string                      `json:"sha256"`
	Tuple           canonicalCompatibilityTuple `json:"tuple"`
}

type versionedIntegrityAuthorityManifest struct {
	SchemaVersion       string                              `json:"schemaVersion"`
	GeneratorVersion    string                              `json:"generatorVersion"`
	GeneratedBy         string                              `json:"generatedBy"`
	IdentityProfiles    []versionedIntegrityIdentityProfile `json:"identityProfiles"`
	AuthorityRegistry   []integrityAuthorityOwner           `json:"authorityRegistry"`
	CompatibilityTuples []versionedCompatibilityTupleRecord `json:"compatibilityTuples"`

	profilesByName map[string]versionedIntegrityIdentityProfile
	recordsByID    map[string]versionedCompatibilityTupleRecord
}

func knownVersionedIntegrityProfile(name string) (versionedIntegrityIdentityProfile, bool) {
	switch name {
	case legacyCompatibilityTupleIdentityProfile:
		return versionedIntegrityIdentityProfile{
			IdentityProfile: legacyCompatibilityTupleIdentityProfile,
			EncodingID:      legacyCompatibilityTupleEncodingID,
			Kind:            "legacy-nul-field-tuple",
			DomainTag:       canonicalCompatibilityTupleDomainTag,
			FieldOrder:      append([]string(nil), canonicalCompatibilityTupleFields...),
			Separator:       "NUL",
			LengthUnit:      "UTF-8 bytes",
			LengthEncoding:  "decimal",
			HashAlgorithm:   "sha256",
			TupleIDFormat:   "sha256:<lowercase-hex>",
		}, true
	case successorCompatibilityTupleIdentityProfile:
		return versionedIntegrityIdentityProfile{
			IdentityProfile:      successorCompatibilityTupleIdentityProfile,
			EncodingID:           successorCompatibilityTupleEncodingID,
			Kind:                 "canonical-json-domain-frame",
			DomainTag:            successorCompatibilityTupleDomainTag,
			CanonicalJSONProfile: "canonical-json-v1.1",
			CanonicalJSONContext: string(canonicalJSONV11CanonicalManifest),
			Framing:              "u64be-length-prefixed-segments",
			Segments:             []string{"domainTag", "canonicalJsonTuple"},
			HashAlgorithm:        "sha256",
			TupleIDFormat:        "sha256:<lowercase-hex>",
		}, true
	default:
		return versionedIntegrityIdentityProfile{}, false
	}
}

func knownVersionedCompatibilityTupleRecord(tupleID string) (versionedCompatibilityTupleRecord, bool) {
	switch tupleID {
	case currentCanonicalTupleID:
		return versionedCompatibilityTupleRecord{
			IdentityProfile: legacyCompatibilityTupleIdentityProfile,
			EncodingID:      legacyCompatibilityTupleEncodingID,
			TupleID:         currentCanonicalTupleID,
			Algorithm:       "sha256",
			SHA256:          currentCanonicalTupleID[len("sha256:"):],
			Tuple:           currentCanonicalTuple,
		}, true
	case runtimeSuccessorSemanticTupleIDV117:
		return versionedCompatibilityTupleRecord{
			IdentityProfile: successorCompatibilityTupleIdentityProfile,
			EncodingID:      successorCompatibilityTupleEncodingID,
			TupleID:         runtimeSuccessorSemanticTupleIDV117,
			Algorithm:       "sha256",
			SHA256:          runtimeSuccessorSemanticTupleIDV117[len("sha256:"):],
			Tuple:           runtimeSuccessorCanonicalTupleV117,
		}, true
	default:
		return versionedCompatibilityTupleRecord{}, false
	}
}

func validKnownVersionedCompatibilityTuple(tupleID string, tuple canonicalCompatibilityTuple) bool {
	record, exists := knownVersionedCompatibilityTupleRecord(tupleID)
	if !exists || record.Tuple != tuple {
		return false
	}
	profile, exists := knownVersionedIntegrityProfile(record.IdentityProfile)
	return exists && validVersionedCompatibilityTupleRecord(record, profile)
}

func knownVersionedAuthorityRegistry() []integrityAuthorityOwner {
	return []integrityAuthorityOwner{
		{Domain: "rules", PackageName: "@cowards/spec", Symbol: "COMPATIBILITY_VERSIONS"},
		{Domain: "transition-semantics", PackageName: "@cowards/engine", Symbol: "runMatch"},
		{Domain: "runtime-classification", PackageName: "@cowards/spec", Symbol: "evaluateStrategyRuntimeCountedEligibility"},
		{Domain: "chronicle-validation", PackageName: "@cowards/replay", Symbol: "validateCurrentChronicle"},
		{Domain: "arena-authority", PackageName: "@cowards/spec", Symbol: "validateCanonicalArena"},
		{Domain: "set-scheduling-policy", PackageName: "@cowards/persistence", Symbol: "scheduleTrialLadderSeason"},
	}
}

func parseVersionedIntegrityAuthorityManifest(serialized []byte) (*versionedIntegrityAuthorityManifest, error) {
	var manifest versionedIntegrityAuthorityManifest
	if err := decodeStrictJSON(serialized, &manifest); err != nil {
		return nil, errors.New("versioned integrity authority manifest is invalid")
	}
	if manifest.SchemaVersion != versionedIntegrityAuthoritySchemaVersion ||
		manifest.GeneratorVersion != versionedIntegrityAuthorityGeneratorVersion ||
		manifest.GeneratedBy == "" || len(manifest.IdentityProfiles) != 2 ||
		!equalIntegrityAuthorityOwners(manifest.AuthorityRegistry, knownVersionedAuthorityRegistry()) ||
		len(manifest.CompatibilityTuples) != 2 {
		return nil, errors.New("versioned integrity authority manifest identity is invalid")
	}
	manifest.profilesByName = make(map[string]versionedIntegrityIdentityProfile, len(manifest.IdentityProfiles))
	for _, profile := range manifest.IdentityProfiles {
		if _, exists := manifest.profilesByName[profile.IdentityProfile]; exists || !validVersionedIdentityProfile(profile) {
			return nil, errors.New("versioned integrity authority profile is invalid")
		}
		manifest.profilesByName[profile.IdentityProfile] = profile
	}
	manifest.recordsByID = make(map[string]versionedCompatibilityTupleRecord, len(manifest.CompatibilityTuples))
	for _, record := range manifest.CompatibilityTuples {
		profile, exists := manifest.profilesByName[record.IdentityProfile]
		if !exists || profile.EncodingID != record.EncodingID || !validVersionedCompatibilityTupleRecord(record, profile) {
			return nil, errors.New("versioned integrity authority tuple is invalid")
		}
		if _, exists := manifest.recordsByID[record.TupleID]; exists {
			return nil, errors.New("versioned integrity authority tuple is ambiguous")
		}
		manifest.recordsByID[record.TupleID] = record
	}
	for _, tupleID := range []string{currentCanonicalTupleID, runtimeSuccessorSemanticTupleIDV117} {
		known, exists := knownVersionedCompatibilityTupleRecord(tupleID)
		registered, registeredExists := manifest.recordsByID[tupleID]
		if !exists || !registeredExists || registered != known {
			return nil, errors.New("versioned integrity authority registered tuple drifted")
		}
	}
	return &manifest, nil
}

func validVersionedIdentityProfile(profile versionedIntegrityIdentityProfile) bool {
	if profile.HashAlgorithm != "sha256" || profile.TupleIDFormat != "sha256:<lowercase-hex>" {
		return false
	}
	switch profile.IdentityProfile {
	case legacyCompatibilityTupleIdentityProfile:
		return profile.EncodingID == legacyCompatibilityTupleEncodingID &&
			profile.Kind == "legacy-nul-field-tuple" &&
			profile.DomainTag == canonicalCompatibilityTupleDomainTag &&
			profile.Separator == "NUL" && profile.LengthUnit == "UTF-8 bytes" &&
			profile.LengthEncoding == "decimal" &&
			equalStrings(profile.FieldOrder, canonicalCompatibilityTupleFields) &&
			profile.CanonicalJSONProfile == "" && profile.CanonicalJSONContext == "" &&
			profile.Framing == "" && len(profile.Segments) == 0
	case successorCompatibilityTupleIdentityProfile:
		return profile.EncodingID == successorCompatibilityTupleEncodingID &&
			profile.Kind == "canonical-json-domain-frame" &&
			profile.DomainTag == successorCompatibilityTupleDomainTag &&
			profile.CanonicalJSONProfile == "canonical-json-v1.1" &&
			profile.CanonicalJSONContext == string(canonicalJSONV11CanonicalManifest) &&
			profile.Framing == "u64be-length-prefixed-segments" &&
			equalStrings(profile.Segments, []string{"domainTag", "canonicalJsonTuple"}) &&
			len(profile.FieldOrder) == 0 && profile.Separator == "" &&
			profile.LengthUnit == "" && profile.LengthEncoding == ""
	default:
		return false
	}
}

func encodeVersionedCompatibilityTuple(record versionedCompatibilityTupleRecord, profile versionedIntegrityIdentityProfile) ([]byte, error) {
	if record.IdentityProfile != profile.IdentityProfile || record.EncodingID != profile.EncodingID || !validVersionedIdentityProfile(profile) {
		return nil, errors.New("canonical tuple identity profile is invalid")
	}
	switch profile.IdentityProfile {
	case legacyCompatibilityTupleIdentityProfile:
		legacy := integrityAuthorityManifest{TupleEncoding: integrityTupleEncoding{
			DomainTag: profile.DomainTag, FieldOrder: profile.FieldOrder,
		}}
		return legacy.encodeTuple(record.Tuple)
	case successorCompatibilityTupleIdentityProfile:
		loose, err := json.Marshal(record.Tuple)
		if err != nil {
			return nil, errors.New("canonical tuple cannot be serialized")
		}
		canonical := decodeCanonicalJSONV11(loose, canonicalJSONV11Options{
			Context: canonicalJSONV11CanonicalManifest,
		})
		if canonical.Error != nil {
			return nil, errors.New("canonical tuple cannot be encoded")
		}
		return runtimeInvocationV117Frame(profile.DomainTag, canonical.CanonicalBytes), nil
	default:
		return nil, errors.New("canonical tuple identity profile is unknown")
	}
}

func validVersionedCompatibilityTupleRecord(record versionedCompatibilityTupleRecord, profile versionedIntegrityIdentityProfile) bool {
	if record.Algorithm != "sha256" || !isPrefixedLowerSHA256(record.TupleID) ||
		record.TupleID != "sha256:"+record.SHA256 || !isLowerSHA256(record.SHA256) ||
		!validCanonicalCompatibilityTupleExpansion(record.Tuple) {
		return false
	}
	encoded, err := encodeVersionedCompatibilityTuple(record, profile)
	if err != nil {
		return false
	}
	digest := sha256.Sum256(encoded)
	return record.SHA256 == hex.EncodeToString(digest[:])
}

func validCanonicalCompatibilityTupleExpansion(tuple canonicalCompatibilityTuple) bool {
	for _, value := range []string{tuple.Rules, tuple.Engine, tuple.RuntimeABI, tuple.Chronicle, tuple.ArenaCatalog, tuple.SetPolicy} {
		if value == "" || !utf8.ValidString(value) {
			return false
		}
	}
	return true
}

func equalIntegrityAuthorityOwners(left []integrityAuthorityOwner, right []integrityAuthorityOwner) bool {
	if len(left) != len(right) {
		return false
	}
	for index := range left {
		if left[index] != right[index] {
			return false
		}
	}
	return true
}

func (manifest *versionedIntegrityAuthorityManifest) resolveTuple(tupleID string, expansion canonicalCompatibilityTuple) (*versionedCompatibilityTupleRecord, error) {
	if manifest == nil || !isPrefixedLowerSHA256(tupleID) {
		return nil, errors.New("versioned tuple selector is invalid")
	}
	record, exists := manifest.recordsByID[tupleID]
	if !exists || record.Tuple != expansion {
		return nil, errors.New("versioned tuple selector is not registered")
	}
	profile, exists := manifest.profilesByName[record.IdentityProfile]
	if !exists || !validVersionedCompatibilityTupleRecord(record, profile) {
		return nil, errors.New("versioned tuple selector identity is invalid")
	}
	copy := record
	return &copy, nil
}
