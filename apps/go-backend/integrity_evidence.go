package main

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"strconv"
	"unicode/utf8"
)

const integrityAuthoritySchemaVersion = "v1.37-integrity-authority-v1"
const integrityAuthorityGeneratorVersion = "generate-v1-37-integrity-authority-v1"

var canonicalCompatibilityTupleFields = []string{
	"rules",
	"engine",
	"runtimeAbi",
	"chronicle",
	"arenaCatalog",
	"setPolicy",
}

type canonicalCompatibilityTuple struct {
	Rules        string `json:"rules"`
	Engine       string `json:"engine"`
	RuntimeABI   string `json:"runtimeAbi"`
	Chronicle    string `json:"chronicle"`
	ArenaCatalog string `json:"arenaCatalog"`
	SetPolicy    string `json:"setPolicy"`
}

type integrityTupleEncoding struct {
	DomainTag     string   `json:"domainTag"`
	FieldOrder    []string `json:"fieldOrder"`
	Separator     string   `json:"separator"`
	LengthUnit    string   `json:"lengthUnit"`
	HashAlgorithm string   `json:"hashAlgorithm"`
	TupleIDFormat string   `json:"tupleIdFormat"`
}

type integrityAuthorityOwner struct {
	Domain      string `json:"domain"`
	PackageName string `json:"packageName"`
	Symbol      string `json:"symbol"`
}

type registeredCompatibilityTuple struct {
	TupleID   string                      `json:"tupleId"`
	Algorithm string                      `json:"algorithm"`
	SHA256    string                      `json:"sha256"`
	Tuple     canonicalCompatibilityTuple `json:"tuple"`
}

type integrityAuthorityManifest struct {
	SchemaVersion       string                         `json:"schemaVersion"`
	GeneratorVersion    string                         `json:"generatorVersion"`
	GeneratedBy         string                         `json:"generatedBy"`
	TupleEncoding       integrityTupleEncoding         `json:"tupleEncoding"`
	AuthorityRegistry   []integrityAuthorityOwner      `json:"authorityRegistry"`
	CompatibilityTuples []registeredCompatibilityTuple `json:"compatibilityTuples"`

	byTupleID map[string]registeredCompatibilityTuple
}

func parseIntegrityAuthorityManifest(serialized []byte) (*integrityAuthorityManifest, error) {
	var manifest integrityAuthorityManifest
	if err := decodeStrictJSON(serialized, &manifest); err != nil {
		return nil, fmt.Errorf("integrity authority manifest is invalid")
	}
	if manifest.SchemaVersion != integrityAuthoritySchemaVersion ||
		manifest.GeneratorVersion != integrityAuthorityGeneratorVersion ||
		manifest.GeneratedBy == "" ||
		manifest.TupleEncoding.DomainTag == "" ||
		manifest.TupleEncoding.Separator != "NUL" ||
		manifest.TupleEncoding.LengthUnit != "UTF-8 bytes" ||
		manifest.TupleEncoding.HashAlgorithm != "sha256" ||
		manifest.TupleEncoding.TupleIDFormat != "sha256:<lowercase-hex>" ||
		!equalStrings(manifest.TupleEncoding.FieldOrder, canonicalCompatibilityTupleFields) ||
		len(manifest.AuthorityRegistry) == 0 || len(manifest.CompatibilityTuples) == 0 {
		return nil, errors.New("integrity authority manifest contract is invalid")
	}
	manifest.byTupleID = make(map[string]registeredCompatibilityTuple, len(manifest.CompatibilityTuples))
	for _, registered := range manifest.CompatibilityTuples {
		if registered.Algorithm != "sha256" || !isLowerSHA256(registered.SHA256) || registered.TupleID != "sha256:"+registered.SHA256 {
			return nil, errors.New("integrity authority tuple identity is invalid")
		}
		encoded, err := manifest.encodeTuple(registered.Tuple)
		if err != nil || hashCanonicalCompatibilityTuple(encoded) != registered.SHA256 {
			return nil, errors.New("integrity authority tuple expansion does not match its identity")
		}
		if _, exists := manifest.byTupleID[registered.TupleID]; exists {
			return nil, errors.New("integrity authority tuple identity is duplicated")
		}
		manifest.byTupleID[registered.TupleID] = registered
	}
	for _, owner := range manifest.AuthorityRegistry {
		if owner.Domain == "" || owner.PackageName == "" || owner.Symbol == "" {
			return nil, errors.New("integrity authority owner is incomplete")
		}
	}
	return &manifest, nil
}

func (manifest *integrityAuthorityManifest) encodeTuple(tuple canonicalCompatibilityTuple) ([]byte, error) {
	if manifest == nil || manifest.TupleEncoding.DomainTag == "" || !equalStrings(manifest.TupleEncoding.FieldOrder, canonicalCompatibilityTupleFields) {
		return nil, errors.New("tuple encoding authority is unavailable")
	}
	values := map[string]string{
		"rules":        tuple.Rules,
		"engine":       tuple.Engine,
		"runtimeAbi":   tuple.RuntimeABI,
		"chronicle":    tuple.Chronicle,
		"arenaCatalog": tuple.ArenaCatalog,
		"setPolicy":    tuple.SetPolicy,
	}
	encoded := make([]byte, 0, 256)
	encoded = append(encoded, []byte(manifest.TupleEncoding.DomainTag)...)
	encoded = append(encoded, 0)
	for _, field := range manifest.TupleEncoding.FieldOrder {
		value := values[field]
		if value == "" || !utf8.ValidString(value) {
			return nil, fmt.Errorf("canonical tuple field %s is invalid", field)
		}
		valueBytes := []byte(value)
		encoded = append(encoded, []byte(field)...)
		encoded = append(encoded, 0)
		encoded = strconv.AppendInt(encoded, int64(len(valueBytes)), 10)
		encoded = append(encoded, 0)
		encoded = append(encoded, valueBytes...)
		encoded = append(encoded, 0)
	}
	return encoded, nil
}

func hashCanonicalCompatibilityTuple(encoded []byte) string {
	digest := sha256.Sum256(encoded)
	return hex.EncodeToString(digest[:])
}

func (manifest *integrityAuthorityManifest) resolveTuple(tupleID string, expansion canonicalCompatibilityTuple) (*registeredCompatibilityTuple, error) {
	if manifest == nil || !isPrefixedLowerSHA256(tupleID) {
		return nil, errors.New("canonical tuple selector must be an exact registered identity")
	}
	registered, exists := manifest.byTupleID[tupleID]
	if !exists {
		return nil, errors.New("canonical tuple is unknown")
	}
	encoded, err := manifest.encodeTuple(expansion)
	if err != nil || "sha256:"+hashCanonicalCompatibilityTuple(encoded) != tupleID || expansion != registered.Tuple {
		return nil, errors.New("canonical tuple expansion does not match the registered identity")
	}
	copy := registered
	return &copy, nil
}

func (manifest *integrityAuthorityManifest) hasTupleID(tupleID string) bool {
	if manifest == nil {
		return false
	}
	_, exists := manifest.byTupleID[tupleID]
	return exists
}

func decodeStrictJSON(serialized []byte, destination any) error {
	if len(serialized) == 0 || !utf8.Valid(serialized) {
		return errors.New("JSON bytes are empty or invalid UTF-8")
	}
	if err := rejectDuplicateJSONKeys(serialized); err != nil {
		return err
	}
	decoder := json.NewDecoder(bytes.NewReader(serialized))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(destination); err != nil {
		return err
	}
	if err := requireJSONEOF(decoder); err != nil {
		return err
	}
	return nil
}

func rejectDuplicateJSONKeys(serialized []byte) error {
	decoder := json.NewDecoder(bytes.NewReader(serialized))
	decoder.UseNumber()
	if err := walkStrictJSONValue(decoder); err != nil {
		return err
	}
	return requireJSONEOF(decoder)
}

func walkStrictJSONValue(decoder *json.Decoder) error {
	token, err := decoder.Token()
	if err != nil {
		return err
	}
	delimiter, ok := token.(json.Delim)
	if !ok {
		return nil
	}
	switch delimiter {
	case '{':
		seen := map[string]struct{}{}
		for decoder.More() {
			keyToken, err := decoder.Token()
			if err != nil {
				return err
			}
			key, ok := keyToken.(string)
			if !ok {
				return errors.New("JSON object key is invalid")
			}
			if _, exists := seen[key]; exists {
				return fmt.Errorf("duplicate JSON key %q", key)
			}
			seen[key] = struct{}{}
			if err := walkStrictJSONValue(decoder); err != nil {
				return err
			}
		}
		closing, err := decoder.Token()
		if err != nil || closing != json.Delim('}') {
			return errors.New("JSON object is not closed")
		}
	case '[':
		for decoder.More() {
			if err := walkStrictJSONValue(decoder); err != nil {
				return err
			}
		}
		closing, err := decoder.Token()
		if err != nil || closing != json.Delim(']') {
			return errors.New("JSON array is not closed")
		}
	default:
		return errors.New("unexpected JSON delimiter")
	}
	return nil
}

func requireJSONEOF(decoder *json.Decoder) error {
	var trailing any
	err := decoder.Decode(&trailing)
	if errors.Is(err, io.EOF) {
		return nil
	}
	if err != nil {
		return err
	}
	return errors.New("JSON contains trailing data")
}

func equalStrings(left []string, right []string) bool {
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
