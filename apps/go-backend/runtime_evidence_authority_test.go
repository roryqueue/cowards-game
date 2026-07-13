package main

import (
	"crypto/ed25519"
	"crypto/rand"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"
)

type runtimeAuthorityVectorFile struct {
	FixtureKey struct {
		KeyID               string `json:"keyId"`
		TrustDomain         string `json:"trustDomain"`
		PublicKeySPKIBase64 string `json:"publicKeySpkiBase64"`
	} `json:"fixtureKey"`
	Valid struct {
		FixtureDomain struct {
			Envelope          json.RawMessage `json:"envelope"`
			EvaluationInstant string          `json:"evaluationInstant"`
		} `json:"fixtureDomain"`
	} `json:"valid"`
	InvalidEnvelopeVectors []struct {
		Name              string          `json:"name"`
		Envelope          json.RawMessage `json:"envelope"`
		EvaluationInstant string          `json:"evaluationInstant"`
	} `json:"invalidEnvelopeVectors"`
}

func TestRuntimeEvidenceAuthorityMatchesCommittedNodeVectors(t *testing.T) {
	manifest := mustIntegrityManifest(t)
	vectors := readRuntimeAuthorityVectors(t)
	der, err := base64.StdEncoding.DecodeString(vectors.FixtureKey.PublicKeySPKIBase64)
	if err != nil {
		t.Fatal(err)
	}
	parsed, err := x509.ParsePKIXPublicKey(der)
	if err != nil {
		t.Fatal(err)
	}
	publicKey, ok := parsed.(ed25519.PublicKey)
	if !ok {
		t.Fatal("fixture key is not Ed25519")
	}
	verified, err := inspectRuntimeEvidenceAuthorityBundle(vectors.Valid.FixtureDomain.Envelope, runtimeEvidenceAuthorityInspectOptions{
		ExpectedTrustDomain: vectors.FixtureKey.TrustDomain,
		EvaluationInstant:   vectors.Valid.FixtureDomain.EvaluationInstant,
		TrustedKeys:         map[string]ed25519.PublicKey{vectors.FixtureKey.KeyID: publicKey},
		IntegrityManifest:   manifest,
	})
	if err != nil {
		t.Fatal(err)
	}
	if verified.RegistryGeneration != "7" || verified.AuthorityBundleHash != "sha256:77bc327fcec0903a40b46135a0364735b96f44999c81a435277b317f7c1e24c1" {
		t.Fatalf("Go reported different bundle identity: %+v", verified)
	}

	for _, vector := range vectors.InvalidEnvelopeVectors {
		t.Run(vector.Name, func(t *testing.T) {
			instant := vector.EvaluationInstant
			if instant == "" {
				instant = vectors.Valid.FixtureDomain.EvaluationInstant
			}
			if _, err := inspectRuntimeEvidenceAuthorityBundle(vector.Envelope, runtimeEvidenceAuthorityInspectOptions{
				ExpectedTrustDomain: vectors.FixtureKey.TrustDomain,
				EvaluationInstant:   instant,
				TrustedKeys:         map[string]ed25519.PublicKey{vectors.FixtureKey.KeyID: publicKey},
				IntegrityManifest:   manifest,
			}); err == nil {
				t.Fatal("invalid committed authority vector was accepted")
			}
		})
	}
	if _, err := inspectRuntimeEvidenceAuthorityBundle(vectors.Valid.FixtureDomain.Envelope, runtimeEvidenceAuthorityInspectOptions{
		ExpectedTrustDomain: runtimeEvidenceAuthorityProductionTrustDomain,
		EvaluationInstant:   vectors.Valid.FixtureDomain.EvaluationInstant,
		TrustedKeys:         map[string]ed25519.PublicKey{vectors.FixtureKey.KeyID: publicKey},
		IntegrityManifest:   manifest,
	}); err == nil {
		t.Fatal("fixture-domain authority was accepted as production authority")
	}
}

func TestRuntimeEvidenceAuthoritySignatureBindsEnvelopeIdentity(t *testing.T) {
	dir := t.TempDir()
	manifest := mustIntegrityManifest(t)
	publicKey, privateKey, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		t.Fatal(err)
	}
	paths := writeRuntimeAuthorityFiles(t, dir, manifest, publicKey, privateKey, authorityFixtureOptions{Generation: "7"})
	serialized, err := os.ReadFile(paths.bundle)
	if err != nil {
		t.Fatal(err)
	}
	var original runtimeEvidenceAuthorityEnvelope
	if err := json.Unmarshal(serialized, &original); err != nil {
		t.Fatal(err)
	}

	for name, change := range map[string]func(*runtimeEvidenceAuthorityEnvelope){
		"trust-domain": func(envelope *runtimeEvidenceAuthorityEnvelope) {
			envelope.TrustDomain = runtimeEvidenceAuthorityFixtureTrustDomain
		},
		"key-id":    func(envelope *runtimeEvidenceAuthorityEnvelope) { envelope.KeyID = "same-public-key-alias" },
		"algorithm": func(envelope *runtimeEvidenceAuthorityEnvelope) { envelope.Algorithm = "Ed448" },
		"schema": func(envelope *runtimeEvidenceAuthorityEnvelope) {
			envelope.SchemaVersion = "v1.37-runtime-evidence-authority-envelope-v2"
		},
	} {
		t.Run(name, func(t *testing.T) {
			relabeled := original
			change(&relabeled)
			bytes, err := json.Marshal(relabeled)
			if err != nil {
				t.Fatal(err)
			}
			expectedDomain := runtimeEvidenceAuthorityProductionTrustDomain
			if name == "trust-domain" {
				expectedDomain = runtimeEvidenceAuthorityFixtureTrustDomain
			}
			if _, err := inspectRuntimeEvidenceAuthorityBundle(bytes, runtimeEvidenceAuthorityInspectOptions{
				ExpectedTrustDomain: expectedDomain,
				EvaluationInstant:   "2026-07-13T00:00:00.000Z",
				TrustedKeys: map[string]ed25519.PublicKey{
					original.KeyID:          publicKey,
					"same-public-key-alias": publicKey,
				},
				IntegrityManifest: manifest,
			}); err == nil {
				t.Fatal("relabeled envelope retained authority without resigning")
			}
		})
	}
}

func TestRuntimeEvidenceAuthorityBootstrapRefreshRestartAndRollback(t *testing.T) {
	dir := t.TempDir()
	manifest := mustIntegrityManifest(t)
	publicKey, privateKey, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		t.Fatal(err)
	}
	paths := writeRuntimeAuthorityFiles(t, dir, manifest, publicKey, privateKey, authorityFixtureOptions{Generation: "7"})
	loader := newRuntimeEvidenceAuthorityLoader(runtimeEvidenceAuthorityLoaderConfig{
		BundlePath:                paths.bundle,
		PublicKeyPath:             paths.publicKey,
		HighWaterPath:             paths.highWater,
		MinimumRegistryGeneration: "7",
		MinimumBundleHash:         paths.payloadHash,
		Bootstrap:                 true,
		ExpectedTrustDomain:       runtimeEvidenceAuthorityProductionTrustDomain,
		EvaluationInstant:         func() string { return "2026-07-13T00:00:00.000Z" },
		IntegrityManifest:         manifest,
	})
	first, err := loader.Load()
	if err != nil {
		t.Fatal(err)
	}
	if first.RegistryGeneration != "7" {
		t.Fatalf("unexpected bootstrap generation %s", first.RegistryGeneration)
	}
	assertHighWater(t, paths.highWater, "7", paths.payloadHash)

	restarted := newRuntimeEvidenceAuthorityLoader(runtimeEvidenceAuthorityLoaderConfig{
		BundlePath:                paths.bundle,
		PublicKeyPath:             paths.publicKey,
		HighWaterPath:             paths.highWater,
		MinimumRegistryGeneration: "7",
		MinimumBundleHash:         paths.payloadHash,
		Bootstrap:                 false,
		ExpectedTrustDomain:       runtimeEvidenceAuthorityProductionTrustDomain,
		EvaluationInstant:         func() string { return "2026-07-13T00:00:00.000Z" },
		IntegrityManifest:         manifest,
	})
	if _, err := restarted.Load(); err != nil {
		t.Fatalf("restart rejected installed exact authority: %v", err)
	}

	oldEnvelope, err := os.ReadFile(paths.bundle)
	if err != nil {
		t.Fatal(err)
	}
	newPaths := writeRuntimeAuthorityFiles(t, dir, manifest, publicKey, privateKey, authorityFixtureOptions{
		Generation:   "8",
		Revoked:      true,
		LaneDisabled: true,
	})
	newAuthority, err := restarted.Load()
	if err != nil {
		t.Fatal(err)
	}
	if newAuthority.RegistryGeneration != "8" || len(newAuthority.Payload.Revocations) != 1 || len(newAuthority.Payload.OperatorLaneDisables) != 1 {
		t.Fatalf("new revocation/kill-switch authority was not loaded: %+v", newAuthority)
	}
	assertHighWater(t, paths.highWater, "8", newPaths.payloadHash)

	if err := os.WriteFile(paths.bundle, oldEnvelope, 0o600); err != nil {
		t.Fatal(err)
	}
	if _, err := restarted.Load(); err == nil {
		t.Fatal("cold rollback after refresh was accepted")
	}
	if current := restarted.Current(); current == nil || current.RegistryGeneration != "8" {
		t.Fatalf("rollback replaced last-good authority: %+v", current)
	}
}

func TestRuntimeEvidenceAuthorityRejectsForkCorruptMissingAndUnwritableAnchors(t *testing.T) {
	manifest := mustIntegrityManifest(t)
	publicKey, privateKey, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		t.Fatal(err)
	}
	t.Run("same generation fork", func(t *testing.T) {
		dir := t.TempDir()
		paths := writeRuntimeAuthorityFiles(t, dir, manifest, publicKey, privateKey, authorityFixtureOptions{Generation: "7"})
		loader := newAuthorityTestLoader(manifest, paths, true, nil)
		if _, err := loader.Load(); err != nil {
			t.Fatal(err)
		}
		writeRuntimeAuthorityFiles(t, dir, manifest, publicKey, privateKey, authorityFixtureOptions{Generation: "7", LaneDisabled: true})
		if _, err := loader.Load(); err == nil {
			t.Fatal("same-generation fork was accepted")
		}
	})
	t.Run("missing anchor in normal mode", func(t *testing.T) {
		dir := t.TempDir()
		paths := writeRuntimeAuthorityFiles(t, dir, manifest, publicKey, privateKey, authorityFixtureOptions{Generation: "7"})
		if _, err := newAuthorityTestLoader(manifest, paths, false, nil).Load(); err == nil {
			t.Fatal("normal mode accepted missing anchor")
		}
	})
	t.Run("corrupt anchor", func(t *testing.T) {
		dir := t.TempDir()
		paths := writeRuntimeAuthorityFiles(t, dir, manifest, publicKey, privateKey, authorityFixtureOptions{Generation: "7"})
		if err := os.WriteFile(paths.highWater, []byte("{broken"), 0o600); err != nil {
			t.Fatal(err)
		}
		if _, err := newAuthorityTestLoader(manifest, paths, false, nil).Load(); err == nil {
			t.Fatal("corrupt anchor was accepted")
		}
	})
	for _, failure := range []string{"open", "sync", "rename", "directory-sync"} {
		t.Run(failure, func(t *testing.T) {
			dir := t.TempDir()
			paths := writeRuntimeAuthorityFiles(t, dir, manifest, publicKey, privateKey, authorityFixtureOptions{Generation: "7"})
			fileSystem := &runtimeAuthorityFailingFileSystem{runtimeEvidenceAuthorityFileSystem: osRuntimeEvidenceAuthorityFileSystem{}, failOperation: failure, highWaterPath: paths.highWater}
			loader := newAuthorityTestLoader(manifest, paths, true, fileSystem)
			if _, err := loader.Load(); err == nil {
				t.Fatalf("%s failure was accepted", failure)
			}
			if loader.Current() != nil {
				t.Fatal("failed anchor install advanced current authority")
			}
		})
	}
}

func TestRuntimeEvidenceAuthorityConcurrentRefreshInstallsOneExactHighWater(t *testing.T) {
	dir := t.TempDir()
	manifest := mustIntegrityManifest(t)
	publicKey, privateKey, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		t.Fatal(err)
	}
	paths := writeRuntimeAuthorityFiles(t, dir, manifest, publicKey, privateKey, authorityFixtureOptions{Generation: "7"})
	loader := newAuthorityTestLoader(manifest, paths, true, nil)
	var wg sync.WaitGroup
	errorsFound := make(chan error, 8)
	for index := 0; index < 8; index++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			_, err := loader.Load()
			errorsFound <- err
		}()
	}
	wg.Wait()
	close(errorsFound)
	for err := range errorsFound {
		if err != nil {
			t.Fatalf("concurrent load failed: %v", err)
		}
	}
	assertHighWater(t, paths.highWater, "7", paths.payloadHash)
}

func TestRuntimeEvidenceAuthorityLoaderReturnsDeepClones(t *testing.T) {
	dir := t.TempDir()
	manifest := mustIntegrityManifest(t)
	publicKey, privateKey, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		t.Fatal(err)
	}
	paths := writeRuntimeAuthorityFiles(t, dir, manifest, publicKey, privateKey, authorityFixtureOptions{Generation: "7", Revoked: true, LaneDisabled: true})
	loader := newAuthorityTestLoader(manifest, paths, true, nil)
	loaded, err := loader.Load()
	if err != nil {
		t.Fatal(err)
	}
	loaded.Payload.Attestations[0].Imports = append(loaded.Payload.Attestations[0].Imports, "attestation:mutated")
	loaded.Payload.Certificates[0].AttestationIDs[0] = "attestation:mutated"
	loaded.Payload.Revocations[0].ReasonCode = "MUTATED"
	loaded.Payload.OperatorLaneDisables[0].ReasonCode = "MUTATED"

	current := loader.Current()
	if current == nil {
		t.Fatal("loader lost its last-good authority")
	}
	if len(current.Payload.Attestations[0].Imports) != 0 || current.Payload.Certificates[0].AttestationIDs[0] != "attestation:fixture" || current.Payload.Revocations[0].ReasonCode != "FIXTURE_REVOKED" || current.Payload.OperatorLaneDisables[0].ReasonCode != "FIXTURE_DISABLED" {
		t.Fatalf("caller mutation changed loader authority: %+v", current.Payload)
	}
	current.Payload.Certificates[0].CertificateID = "certificate:mutated"
	if later := loader.Current(); later == nil || later.Payload.Certificates[0].CertificateID != "certificate:containment:fixture" {
		t.Fatalf("Current returned a mutable alias: %+v", later)
	}
}

func TestProductionRuntimeEvidenceAuthorityLoaderKeepsUncertainLatch(t *testing.T) {
	dir := t.TempDir()
	manifest := mustIntegrityManifest(t)
	publicKey, privateKey, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		t.Fatal(err)
	}
	paths := writeRuntimeAuthorityFiles(t, dir, manifest, publicKey, privateKey, authorityFixtureOptions{Generation: "7"})
	fileSystem := &runtimeAuthorityFailingFileSystem{runtimeEvidenceAuthorityFileSystem: osRuntimeEvidenceAuthorityFileSystem{}, failOperation: "directory-sync", highWaterPath: paths.highWater}
	loader := newAuthorityTestLoader(manifest, paths, true, fileSystem)

	productionRuntimeEvidenceAuthorityState.Lock()
	prior := productionRuntimeEvidenceAuthorityState.loader
	productionRuntimeEvidenceAuthorityState.loader = loader
	productionRuntimeEvidenceAuthorityState.Unlock()
	defer func() {
		productionRuntimeEvidenceAuthorityState.Lock()
		productionRuntimeEvidenceAuthorityState.loader = prior
		productionRuntimeEvidenceAuthorityState.Unlock()
	}()

	if _, err := loadProductionRuntimeEvidenceAuthorityFromEnvironment(); err == nil {
		t.Fatal("post-rename directory-sync failure was accepted")
	}
	fileSystem.failOperation = ""
	if _, err := loadProductionRuntimeEvidenceAuthorityFromEnvironment(); err == nil {
		t.Fatal("environment wrapper forgot the process-long uncertain latch")
	}
	if _, err := loadProductionRuntimeEvidenceAuthorityFromEnvironment(); err == nil {
		t.Fatal("later production load recovered without explicit repair")
	}
}

type authorityFixtureOptions struct {
	Generation   string
	Revoked      bool
	LaneDisabled bool
}

type authorityFixturePaths struct{ bundle, publicKey, highWater, payloadHash string }

func writeRuntimeAuthorityFiles(t *testing.T, dir string, manifest *integrityAuthorityManifest, publicKey ed25519.PublicKey, privateKey ed25519.PrivateKey, options authorityFixtureOptions) authorityFixturePaths {
	t.Helper()
	if options.Generation == "" {
		options.Generation = "7"
	}
	certificate := runtimeEvidenceAuthorityCertificate{
		Kind:                  "containment",
		CertificateID:         "certificate:containment:fixture",
		CertificateVersion:    "runtime-containment-certificate-v1",
		CertificateRecordHash: "sha256:" + strings.Repeat("2", 64),
		LaneIdentityHash:      "sha256:" + strings.Repeat("3", 64),
		AttestationIDs:        []string{"attestation:fixture"},
	}
	payload := runtimeEvidenceAuthorityPayload{
		SchemaVersion:             runtimeEvidenceAuthorityPayloadSchemaVersion,
		BundleVersion:             "v1.37-go-test",
		RegistryGeneration:        options.Generation,
		IssuedAt:                  "2026-07-12T00:00:00.000Z",
		ValidFrom:                 "2026-07-12T00:00:00.000Z",
		ValidUntil:                "2026-08-12T00:00:00.000Z",
		SemanticTupleManifestHash: manifest.CompatibilityTuples[0].TupleID,
		Attestations:              []runtimeEvidenceAuthorityAttestation{{AttestationID: "attestation:fixture", AttestationHash: "sha256:" + strings.Repeat("1", 64), Verified: true, Imports: []string{}}},
		Certificates:              []runtimeEvidenceAuthorityCertificate{certificate},
		Revocations:               []runtimeEvidenceAuthorityRevocation{},
		Supersessions:             []runtimeEvidenceAuthoritySupersession{},
		OperatorLaneDisables:      []runtimeEvidenceAuthorityLaneDisable{},
	}
	if options.Revoked {
		payload.Revocations = append(payload.Revocations, runtimeEvidenceAuthorityRevocation{CertificateID: certificate.CertificateID, CertificateRecordHash: certificate.CertificateRecordHash, RevokedAt: "2026-07-12T12:00:00.000Z", ReasonCode: "FIXTURE_REVOKED"})
	}
	if options.LaneDisabled {
		payload.OperatorLaneDisables = append(payload.OperatorLaneDisables, runtimeEvidenceAuthorityLaneDisable{LaneIdentityHash: certificate.LaneIdentityHash, DisabledAt: "2026-07-12T12:00:00.000Z", ReasonCode: "FIXTURE_DISABLED"})
	}
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		t.Fatal(err)
	}
	payloadHash := hashRuntimeEvidenceAuthorityPayload(payloadBytes)
	envelope := runtimeEvidenceAuthorityEnvelope{
		SchemaVersion: runtimeEvidenceAuthorityEnvelopeSchemaVersion,
		TrustDomain:   runtimeEvidenceAuthorityProductionTrustDomain,
		KeyID:         "go-test-ed25519-key",
		Algorithm:     "Ed25519",
		PayloadBase64: base64.StdEncoding.EncodeToString(payloadBytes),
		PayloadSHA256: payloadHash,
	}
	envelope.SignatureBase64 = base64.StdEncoding.EncodeToString(ed25519.Sign(privateKey, encodeRuntimeEvidenceAuthoritySignatureMessage(envelope, payloadBytes)))
	envelopeBytes, err := json.Marshal(envelope)
	if err != nil {
		t.Fatal(err)
	}
	publicDER, err := x509.MarshalPKIXPublicKey(publicKey)
	if err != nil {
		t.Fatal(err)
	}
	descriptor := runtimeEvidenceAuthorityPublicKeyDescriptor{
		SchemaVersion: runtimeEvidenceAuthorityPublicKeySchemaVersion,
		KeyID:         envelope.KeyID,
		Algorithm:     "Ed25519",
		PublicKeyPEM:  string(pem.EncodeToMemory(&pem.Block{Type: "PUBLIC KEY", Bytes: publicDER})),
	}
	descriptorBytes, err := json.Marshal(descriptor)
	if err != nil {
		t.Fatal(err)
	}
	bundlePath := filepath.Join(dir, "authority.json")
	publicKeyPath := filepath.Join(dir, "authority-key.json")
	if err := os.WriteFile(bundlePath, envelopeBytes, 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(publicKeyPath, descriptorBytes, 0o600); err != nil {
		t.Fatal(err)
	}
	return authorityFixturePaths{bundle: bundlePath, publicKey: publicKeyPath, highWater: filepath.Join(dir, "authority.high-water.json"), payloadHash: payloadHash}
}

func newAuthorityTestLoader(manifest *integrityAuthorityManifest, paths authorityFixturePaths, bootstrap bool, fileSystem runtimeEvidenceAuthorityFileSystem) *runtimeEvidenceAuthorityLoader {
	return newRuntimeEvidenceAuthorityLoader(runtimeEvidenceAuthorityLoaderConfig{
		BundlePath:                paths.bundle,
		PublicKeyPath:             paths.publicKey,
		HighWaterPath:             paths.highWater,
		MinimumRegistryGeneration: "7",
		MinimumBundleHash:         paths.payloadHash,
		Bootstrap:                 bootstrap,
		ExpectedTrustDomain:       runtimeEvidenceAuthorityProductionTrustDomain,
		EvaluationInstant:         func() string { return "2026-07-13T00:00:00.000Z" },
		IntegrityManifest:         manifest,
		FileSystem:                fileSystem,
	})
}

func assertHighWater(t *testing.T, path string, generation string, payloadHash string) {
	t.Helper()
	bytes, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	record, err := parseRuntimeEvidenceAuthorityHighWater(bytes)
	if err != nil {
		t.Fatal(err)
	}
	if record.RegistryGeneration != generation || record.PayloadSHA256 != payloadHash {
		t.Fatalf("unexpected high-water record: %+v", record)
	}
}

func mustIntegrityManifest(t *testing.T) *integrityAuthorityManifest {
	t.Helper()
	manifest, err := parseIntegrityAuthorityManifest(readGoBackendArtifact(t, "v1.37-integrity-authority.json"))
	if err != nil {
		t.Fatal(err)
	}
	return manifest
}

func readRuntimeAuthorityVectors(t *testing.T) runtimeAuthorityVectorFile {
	t.Helper()
	var vectors runtimeAuthorityVectorFile
	if err := json.Unmarshal(readGoBackendArtifact(t, "v1.37-runtime-evidence-authority-vectors.json"), &vectors); err != nil {
		t.Fatal(err)
	}
	return vectors
}

type runtimeAuthorityFailingFileSystem struct {
	runtimeEvidenceAuthorityFileSystem
	failOperation string
	highWaterPath string
}

func (fileSystem *runtimeAuthorityFailingFileSystem) Open(path string) (runtimeEvidenceAuthorityFile, error) {
	file, err := fileSystem.runtimeEvidenceAuthorityFileSystem.Open(path)
	if err != nil {
		return nil, err
	}
	return &runtimeAuthorityFailingFile{runtimeEvidenceAuthorityFile: file, path: path, owner: fileSystem}, nil
}

func (fileSystem *runtimeAuthorityFailingFileSystem) OpenFile(path string, flag int, permission os.FileMode) (runtimeEvidenceAuthorityFile, error) {
	if fileSystem.failOperation == "open" && strings.HasPrefix(path, fileSystem.highWaterPath+".tmp-") {
		return nil, errors.New("injected open failure")
	}
	file, err := fileSystem.runtimeEvidenceAuthorityFileSystem.OpenFile(path, flag, permission)
	if err != nil {
		return nil, err
	}
	return &runtimeAuthorityFailingFile{runtimeEvidenceAuthorityFile: file, path: path, owner: fileSystem}, nil
}

func (fileSystem *runtimeAuthorityFailingFileSystem) Rename(from string, to string) error {
	if fileSystem.failOperation == "rename" && to == fileSystem.highWaterPath {
		return errors.New("injected rename failure")
	}
	return fileSystem.runtimeEvidenceAuthorityFileSystem.Rename(from, to)
}

type runtimeAuthorityFailingFile struct {
	runtimeEvidenceAuthorityFile
	path  string
	owner *runtimeAuthorityFailingFileSystem
}

func (file *runtimeAuthorityFailingFile) Sync() error {
	if file.owner.failOperation == "sync" && strings.HasPrefix(file.path, file.owner.highWaterPath+".tmp-") {
		return errors.New("injected file sync failure")
	}
	if file.owner.failOperation == "directory-sync" && file.path == filepath.Dir(file.owner.highWaterPath) {
		return errors.New("injected directory sync failure")
	}
	return file.runtimeEvidenceAuthorityFile.Sync()
}
