package main

import (
	"bytes"
	"crypto/sha256"
	"encoding/binary"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"math"
	"os"
	"path/filepath"
	"reflect"
	"regexp"
	"testing"
)

type canonicalJSONCorpusExpectation struct {
	Kind                string `json:"kind"`
	CanonicalPath       string `json:"canonicalPath"`
	CanonicalByteLength int    `json:"canonicalByteLength"`
	CanonicalSHA256     string `json:"canonicalSha256"`
	Code                string `json:"code"`
	Path                []any  `json:"path"`
	ByteOffset          int    `json:"byteOffset"`
	Owner               string `json:"owner"`
}

type canonicalJSONCorpusVector struct {
	ID            string                         `json:"id"`
	Context       canonicalJSONV11Context        `json:"context"`
	Operation     string                         `json:"operation"`
	RawPath       string                         `json:"rawPath"`
	RawByteLength int                            `json:"rawByteLength"`
	RawSHA256     string                         `json:"rawSha256"`
	Limits        canonicalJSONV11Limits         `json:"limits"`
	Expectation   canonicalJSONCorpusExpectation `json:"expectation"`
}

type canonicalJSONCorpusIndex struct {
	SchemaVersion    string                      `json:"schemaVersion"`
	VectorRootDomain string                      `json:"vectorRootDomain"`
	VectorRootSHA256 string                      `json:"vectorRootSha256"`
	VectorCount      int                         `json:"vectorCount"`
	Vectors          []canonicalJSONCorpusVector `json:"vectors"`
}

func canonicalJSONFrame(value []byte) []byte {
	framed := make([]byte, 8+len(value))
	binary.BigEndian.PutUint64(framed[:8], uint64(len(value)))
	copy(framed[8:], value)
	return framed
}

func TestCanonicalJSONV11SharedCorpus(t *testing.T) {
	repoRoot := filepath.Clean(filepath.Join("..", ".."))
	serialized, err := os.ReadFile(filepath.Join(repoRoot, "packages/spec/src/fixtures/canonical-json-v1-1-vectors.json"))
	if err != nil {
		t.Fatal(err)
	}
	var corpus canonicalJSONCorpusIndex
	if err := json.Unmarshal(serialized, &corpus); err != nil {
		t.Fatal(err)
	}
	if corpus.SchemaVersion != "canonical-json-v1.1-corpus-v1" || corpus.VectorCount == 0 || len(corpus.Vectors) != corpus.VectorCount {
		t.Fatalf("invalid canonical JSON corpus identity/count: schema=%s count=%d vectors=%d", corpus.SchemaVersion, corpus.VectorCount, len(corpus.Vectors))
	}

	root := sha256.New()
	root.Write(canonicalJSONFrame([]byte(corpus.VectorRootDomain)))
	enumeration := sha256.New()
	enumeration.Write(canonicalJSONFrame([]byte("cowards-game:canonical-json-v1.1-enumeration:v1")))
	previousID := ""
	errorCode := regexp.MustCompile(`^[A-Z][A-Z0-9_]+$`)
	for _, vector := range corpus.Vectors {
		if vector.ID <= previousID {
			t.Fatalf("corpus IDs are not strictly ordered at %q", vector.ID)
		}
		previousID = vector.ID
		raw, err := os.ReadFile(filepath.Join(repoRoot, vector.RawPath))
		if err != nil {
			t.Fatal(err)
		}
		rawDigest := sha256.Sum256(raw)
		if len(raw) != vector.RawByteLength || hex.EncodeToString(rawDigest[:]) != vector.RawSHA256 {
			t.Fatalf("raw identity drift for %s", vector.ID)
		}
		root.Write(canonicalJSONFrame([]byte(vector.ID)))
		root.Write(canonicalJSONFrame(raw))
		enumeration.Write(canonicalJSONFrame([]byte(vector.ID)))
		enumeration.Write(canonicalJSONFrame([]byte(vector.RawSHA256)))

		switch vector.Expectation.Kind {
		case "success":
			canonical, err := os.ReadFile(filepath.Join(repoRoot, vector.Expectation.CanonicalPath))
			if err != nil {
				t.Fatal(err)
			}
			canonicalDigest := sha256.Sum256(canonical)
			if len(canonical) != vector.Expectation.CanonicalByteLength || hex.EncodeToString(canonicalDigest[:]) != vector.Expectation.CanonicalSHA256 {
				t.Fatalf("canonical identity drift for %s", vector.ID)
			}
			decoded := decodeCanonicalJSONV11(raw, canonicalJSONV11Options{
				Context:          vector.Context,
				RequireCanonical: false,
				Limits:           &vector.Limits,
			})
			if decoded.Error != nil {
				t.Fatalf("%s unexpectedly rejected: %+v", vector.ID, decoded.Error)
			}
			if !bytes.Equal(decoded.CanonicalBytes, canonical) {
				t.Fatalf("%s canonical bytes differ\nwant=%q\n got=%q", vector.ID, canonical, decoded.CanonicalBytes)
			}
			strict := decodeCanonicalJSONV11(canonical, canonicalJSONV11Options{
				Context:          vector.Context,
				RequireCanonical: true,
				Limits:           &vector.Limits,
			})
			if strict.Error != nil || !bytes.Equal(strict.CanonicalBytes, canonical) {
				t.Fatalf("%s canonical form was not accepted exactly: %+v", vector.ID, strict.Error)
			}
		case "error":
			if !errorCode.MatchString(vector.Expectation.Code) || vector.Expectation.ByteOffset < 0 || (vector.Expectation.Owner != "player_violation" && vector.Expectation.Owner != "system_failure") || vector.Expectation.Path == nil {
				t.Fatalf("incomplete error expectation for %s", vector.ID)
			}
			decoded := canonicalJSONV11Result{}
			if vector.Operation == "host-encode" {
				hostValue := math.NaN()
				if vector.ID == "number-host-positive-infinity" {
					hostValue = math.Inf(1)
				} else if vector.ID == "number-host-negative-infinity" {
					hostValue = math.Inf(-1)
				}
				decoded = encodeCanonicalJSONV11(hostValue, canonicalJSONV11Options{Context: vector.Context, Limits: &vector.Limits})
			} else {
				decoded = decodeCanonicalJSONV11(raw, canonicalJSONV11Options{
					Context:          vector.Context,
					RequireCanonical: false,
					Limits:           &vector.Limits,
				})
			}
			if decoded.Error == nil {
				t.Fatalf("%s unexpectedly succeeded", vector.ID)
			}
			if decoded.Error.Code != vector.Expectation.Code || decoded.Error.ByteOffset != vector.Expectation.ByteOffset || decoded.Error.Owner != vector.Expectation.Owner || !reflect.DeepEqual(decoded.Error.Path, vector.Expectation.Path) {
				t.Fatalf("%s error mismatch\nwant=%+v\n got=%+v", vector.ID, vector.Expectation, decoded.Error)
			}
		default:
			t.Fatalf("unknown expectation kind for %s: %q", vector.ID, vector.Expectation.Kind)
		}
	}
	if actual := hex.EncodeToString(root.Sum(nil)); actual != corpus.VectorRootSHA256 {
		t.Fatalf("vector root drift: want=%s got=%s", corpus.VectorRootSHA256, actual)
	}
	fmt.Printf("[CANONICAL_JSON_CORPUS:GO] count=%d root=%s enumeration=%s\n", corpus.VectorCount, corpus.VectorRootSHA256, hex.EncodeToString(enumeration.Sum(nil)))
}

func TestCanonicalJSONV11StrictAdmissionBoundaries(t *testing.T) {
	tests := []struct {
		name       string
		raw        string
		byteOffset int
	}{
		{name: "leading whitespace", raw: " 1", byteOffset: 0},
		{name: "trailing whitespace", raw: "1 ", byteOffset: 1},
		{name: "non-shortest decimal", raw: "1.2300", byteOffset: 4},
		{name: "uppercase signed exponent", raw: "1E+21", byteOffset: 1},
		{name: "escaped ASCII", raw: `"\u0061"`, byteOffset: 1},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			strict := decodeCanonicalJSONV11([]byte(test.raw), canonicalJSONV11Options{
				Context:          canonicalJSONV11DecodedStrategyPayload,
				RequireCanonical: true,
			})
			if strict.Error == nil {
				t.Fatalf("strict admission unexpectedly accepted %q", test.raw)
			}
			if strict.Error.Code != "NON_CANONICAL_ENCODING" || strict.Error.ByteOffset != test.byteOffset || strict.Error.Owner != "player_violation" || !reflect.DeepEqual(strict.Error.Path, []any{}) {
				t.Fatalf("strict error mismatch for %q: %+v", test.raw, strict.Error)
			}

			loose := decodeCanonicalJSONV11([]byte(test.raw), canonicalJSONV11Options{
				Context: canonicalJSONV11DecodedStrategyPayload,
			})
			if loose.Error != nil {
				t.Fatalf("non-strict admission unexpectedly rejected %q: %+v", test.raw, loose.Error)
			}
		})
	}

	keyOrder := decodeCanonicalJSONV11([]byte(`{"z":1,"a":2}`), canonicalJSONV11Options{
		Context:          canonicalJSONV11CanonicalManifest,
		RequireCanonical: true,
	})
	if keyOrder.Error == nil || keyOrder.Error.Code != "NON_CANONICAL_KEY_ORDER" || keyOrder.Error.ByteOffset != 7 || keyOrder.Error.Owner != "system_failure" || !reflect.DeepEqual(keyOrder.Error.Path, []any{"a"}) {
		t.Fatalf("key-order precedence mismatch: %+v", keyOrder.Error)
	}

	authenticated := decodeCanonicalJSONV11([]byte(" 1"), canonicalJSONV11Options{
		Context:          canonicalJSONV11AuthenticatedOuterEnvelope,
		RequireCanonical: true,
	})
	if authenticated.Error == nil || authenticated.Error.Code != "NON_CANONICAL_ENCODING" || authenticated.Error.ByteOffset != 0 || authenticated.Error.Owner != "system_failure" || !reflect.DeepEqual(authenticated.Error.Path, []any{}) {
		t.Fatalf("authenticated ownership mismatch: %+v", authenticated.Error)
	}
}

func TestCanonicalJSONV11LexicalIntegerSafetyPreservesFiniteExponentNumbers(t *testing.T) {
	for _, raw := range []string{"9007199254740992", "-9007199254740992"} {
		decoded := decodeCanonicalJSONV11([]byte(raw), canonicalJSONV11Options{Context: canonicalJSONV11DecodedStrategyPayload})
		if decoded.Error == nil || decoded.Error.Code != "NUMBER_OUT_OF_RANGE" || decoded.Error.ByteOffset != 0 || decoded.Error.Owner != "player_violation" || !reflect.DeepEqual(decoded.Error.Path, []any{}) {
			t.Fatalf("unsafe integer lexeme %q mismatch: %+v", raw, decoded.Error)
		}
	}

	for _, raw := range []string{"1e21", "1.7976931348623157e308"} {
		decoded := decodeCanonicalJSONV11([]byte(raw), canonicalJSONV11Options{Context: canonicalJSONV11DecodedStrategyPayload})
		if decoded.Error != nil {
			t.Fatalf("finite exponent binary64 %q unexpectedly rejected: %+v", raw, decoded.Error)
		}
	}
}
