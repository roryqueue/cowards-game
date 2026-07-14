package main

import (
	"crypto/sha256"
	"encoding/binary"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"testing"
)

const missingCanonicalJSONGoCodecSentinel = "[EXPECTED_RED:MISSING_CANONICAL_JSON_GO_CODEC]"

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
	RawPath       string                         `json:"rawPath"`
	RawByteLength int                            `json:"rawByteLength"`
	RawSHA256     string                         `json:"rawSha256"`
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
		case "error":
			if !errorCode.MatchString(vector.Expectation.Code) || vector.Expectation.ByteOffset < 0 || (vector.Expectation.Owner != "player_violation" && vector.Expectation.Owner != "system_failure") || vector.Expectation.Path == nil {
				t.Fatalf("incomplete error expectation for %s", vector.ID)
			}
		default:
			t.Fatalf("unknown expectation kind for %s: %q", vector.ID, vector.Expectation.Kind)
		}
	}
	if actual := hex.EncodeToString(root.Sum(nil)); actual != corpus.VectorRootSHA256 {
		t.Fatalf("vector root drift: want=%s got=%s", corpus.VectorRootSHA256, actual)
	}
	fmt.Printf("[CANONICAL_JSON_CORPUS:GO] count=%d root=%s enumeration=%s\n", corpus.VectorCount, corpus.VectorRootSHA256, hex.EncodeToString(enumeration.Sum(nil)))
	t.Fatal(missingCanonicalJSONGoCodecSentinel)
}
