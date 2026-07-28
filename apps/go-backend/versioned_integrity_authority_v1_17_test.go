package main

import (
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"os"
	"reflect"
	"strings"
	"testing"
)

type versionedIntegrityHashVector struct {
	Name               string                      `json:"name"`
	IdentityProfile    string                      `json:"identityProfile"`
	EncodingID         string                      `json:"encodingId"`
	Tuple              canonicalCompatibilityTuple `json:"tuple"`
	EncodedBytesHex    string                      `json:"encodedBytesHex"`
	EncodedBytesBase64 string                      `json:"encodedBytesBase64"`
	SHA256             string                      `json:"sha256"`
	TupleID            string                      `json:"tupleId"`
}

type versionedIntegrityHashVectors struct {
	SchemaVersion    string                         `json:"schemaVersion"`
	GeneratorVersion string                         `json:"generatorVersion"`
	GeneratedBy      string                         `json:"generatedBy"`
	Vectors          []versionedIntegrityHashVector `json:"vectors"`
}

func TestPhase258VersionedIntegrityAuthorityProfilesRecomputeExactVectors(t *testing.T) {
	manifestBytes, err := os.ReadFile("../../packages/spec/artifacts/v1.37-integrity-authority-v1.17.json")
	if err != nil {
		t.Fatal(err)
	}
	manifest, err := parseVersionedIntegrityAuthorityManifest(manifestBytes)
	if err != nil {
		t.Fatal(err)
	}
	vectorsBytes, err := os.ReadFile("../../packages/spec/artifacts/v1.37-integrity-authority-v1.17-hash-vectors.json")
	if err != nil {
		t.Fatal(err)
	}
	var vectors versionedIntegrityHashVectors
	if err := json.Unmarshal(vectorsBytes, &vectors); err != nil {
		t.Fatal(err)
	}
	if vectors.SchemaVersion != "v1.37-integrity-authority-hash-vectors-v2" ||
		vectors.GeneratorVersion != versionedIntegrityAuthorityGeneratorVersion ||
		vectors.GeneratedBy != manifest.GeneratedBy || len(vectors.Vectors) != len(manifest.CompatibilityTuples) {
		t.Fatalf("invalid versioned integrity hash-vector identity: %#v", vectors)
	}
	for _, name := range []string{legacyCompatibilityTupleIdentityProfile, successorCompatibilityTupleIdentityProfile} {
		known, ok := knownVersionedIntegrityProfile(name)
		if !ok {
			t.Fatalf("missing Go identity profile %s", name)
		}
		if declared, ok := manifest.profilesByName[name]; !ok || !reflect.DeepEqual(declared, known) {
			t.Fatalf("Go identity profile %s drifted from the generated authority", name)
		}
	}
	for _, tupleID := range []string{currentCanonicalTupleID, runtimeSuccessorSemanticTupleIDV117} {
		known, ok := knownVersionedCompatibilityTupleRecord(tupleID)
		if !ok {
			t.Fatalf("missing Go tuple record %s", tupleID)
		}
		if declared, ok := manifest.recordsByID[tupleID]; !ok || !reflect.DeepEqual(declared, known) {
			t.Fatalf("Go tuple record %s drifted from the generated authority", tupleID)
		}
	}
	for _, vector := range vectors.Vectors {
		record, err := manifest.resolveTuple(vector.TupleID, vector.Tuple)
		if err != nil {
			t.Fatalf("resolve %s: %v", vector.Name, err)
		}
		if record.IdentityProfile != vector.IdentityProfile || record.EncodingID != vector.EncodingID || record.SHA256 != vector.SHA256 {
			t.Fatalf("vector %s does not match registered profile/identity", vector.Name)
		}
		profile := manifest.profilesByName[record.IdentityProfile]
		encoded, err := encodeVersionedCompatibilityTuple(*record, profile)
		if err != nil {
			t.Fatalf("encode %s: %v", vector.Name, err)
		}
		if hex.EncodeToString(encoded) != vector.EncodedBytesHex || base64.StdEncoding.EncodeToString(encoded) != vector.EncodedBytesBase64 {
			t.Fatalf("vector %s encoded bytes drifted", vector.Name)
		}
		digest := sha256.Sum256(encoded)
		if hex.EncodeToString(digest[:]) != vector.SHA256 || "sha256:"+vector.SHA256 != vector.TupleID {
			t.Fatalf("vector %s digest drifted", vector.Name)
		}
	}
}

func TestPhase258VersionedIntegrityAuthorityUsesDeclaredProfileNotRuntimeABI(t *testing.T) {
	manifestBytes, err := os.ReadFile("../../packages/spec/artifacts/v1.37-integrity-authority-v1.17.json")
	if err != nil {
		t.Fatal(err)
	}
	manifest, err := parseVersionedIntegrityAuthorityManifest(manifestBytes)
	if err != nil {
		t.Fatal(err)
	}
	successor, ok := manifest.recordsByID[runtimeSuccessorSemanticTupleIDV117]
	if !ok {
		t.Fatal("successor tuple is not registered")
	}
	legacyProfile := manifest.profilesByName[legacyCompatibilityTupleIdentityProfile]
	wrongProfile := successor
	wrongProfile.IdentityProfile = legacyProfile.IdentityProfile
	wrongProfile.EncodingID = legacyProfile.EncodingID
	if validVersionedCompatibilityTupleRecord(wrongProfile, legacyProfile) {
		t.Fatal("successor tuple was accepted under the legacy encoding profile")
	}
	wrongEncoding := successor
	wrongEncoding.EncodingID = legacyCompatibilityTupleEncodingID
	if validVersionedCompatibilityTupleRecord(wrongEncoding, manifest.profilesByName[successor.IdentityProfile]) {
		t.Fatal("successor tuple was accepted with a mismatched declared encoding")
	}
}

func TestPhase258VersionedIntegrityAuthorityRejectsProfileAndTupleDrift(t *testing.T) {
	manifestBytes, err := os.ReadFile("../../packages/spec/artifacts/v1.37-integrity-authority-v1.17.json")
	if err != nil {
		t.Fatal(err)
	}
	var raw map[string]any
	if err := json.Unmarshal(manifestBytes, &raw); err != nil {
		t.Fatal(err)
	}
	profiles := raw["identityProfiles"].([]any)
	profiles[1].(map[string]any)["canonicalJsonContext"] = "host-api-value"
	mutated, err := json.Marshal(raw)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := parseVersionedIntegrityAuthorityManifest(mutated); err == nil {
		t.Fatal("drifted successor identity profile was accepted")
	}

	if err := json.Unmarshal(manifestBytes, &raw); err != nil {
		t.Fatal(err)
	}
	records := raw["compatibilityTuples"].([]any)
	records[1].(map[string]any)["encodingId"] = legacyCompatibilityTupleEncodingID
	mutated, err = json.Marshal(raw)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := parseVersionedIntegrityAuthorityManifest(mutated); err == nil {
		t.Fatal("tuple with drifted encoding declaration was accepted")
	}
}

func TestPhase258VersionedIntegrityAuthorityRejectsDuplicateAndTrailingJSON(t *testing.T) {
	manifestBytes, err := os.ReadFile("../../packages/spec/artifacts/v1.37-integrity-authority-v1.17.json")
	if err != nil {
		t.Fatal(err)
	}
	duplicate := strings.Replace(string(manifestBytes), `"schemaVersion":`, `"schemaVersion":"duplicate","schemaVersion":`, 1)
	if _, err := parseVersionedIntegrityAuthorityManifest([]byte(duplicate)); err == nil {
		t.Fatal("duplicate authority manifest key was accepted")
	}
	if _, err := parseVersionedIntegrityAuthorityManifest(append(append([]byte(nil), manifestBytes...), []byte("{}")...)); err == nil {
		t.Fatal("trailing authority manifest JSON was accepted")
	}
}
