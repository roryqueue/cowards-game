package main

import (
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"reflect"
	"sort"
	"strings"
	"sync"
	"testing"
	"time"
)

type runtimeSuccessorAuthorityFixtureV117 struct {
	SchemaVersion   string                               `json:"schemaVersion"`
	GeneratedBy     string                               `json:"generatedBy"`
	NonProduction   bool                                 `json:"nonProduction"`
	SemanticTupleID string                               `json:"semanticTupleId"`
	SemanticTuple   canonicalCompatibilityTuple          `json:"semanticTuple"`
	Template        runtimeSuccessorIdentityTemplateV117 `json:"template"`
	RevisionVectors []runtimeSuccessorRevisionVectorV117 `json:"revisionVectors"`
	NegativeVectors []map[string]any                     `json:"negativeVectors"`
	InstallFixture  runtimeSuccessorInstallFixtureV117   `json:"installFixture"`
}

type runtimeSuccessorRevisionFixtureV117 struct {
	ID                  string         `json:"id"`
	StrategyID          string         `json:"strategyId"`
	Source              string         `json:"source"`
	SourceHash          string         `json:"sourceHash"`
	SourceBytes         int            `json:"sourceBytes"`
	Runtime             map[string]any `json:"runtime"`
	EngineCompatibility map[string]any `json:"engineCompatibility"`
	Validation          map[string]any `json:"validation"`
	Metadata            map[string]any `json:"metadata"`
}

type runtimeSuccessorRevisionVectorV117 struct {
	Side                      string                               `json:"side"`
	StrategyRevisionID        string                               `json:"strategyRevisionId"`
	LaneIdentityHash          string                               `json:"laneIdentityHash"`
	OriginalSourceBytesBase64 string                               `json:"originalSourceBytesBase64"`
	ArtifactBytesBase64       string                               `json:"artifactBytesBase64"`
	DeployedArtifactSHA256    string                               `json:"deployedArtifactSha256"`
	Deployed                  goExecutableLaneIdentity             `json:"deployed"`
	Revision                  runtimeSuccessorRevisionFixtureV117  `json:"revision"`
	Expected                  runtimeSuccessorRevisionExpectedV117 `json:"expected"`
}

type runtimeSuccessorRevisionExpectedV117 struct {
	SourceIdentity       runtimeServiceSourceIdentityV117 `json:"sourceIdentity"`
	IdentityManifest     runtimeIdentityManifestV117      `json:"identityManifest"`
	IdentityManifestRoot string                           `json:"identityManifestRoot"`
	ExactPins            runtimeServiceExactPinsV117      `json:"exactPins"`
}

type runtimeSuccessorInstallFixtureV117 struct {
	TrustDomain         string                              `json:"trustDomain"`
	SignerKeyID         string                              `json:"signerKeyId"`
	PublicKeyPEM        string                              `json:"publicKeyPem"`
	EvaluationInstant   string                              `json:"evaluationInstant"`
	InstalledAt         string                              `json:"installedAt"`
	PayloadBytesBase64  string                              `json:"payloadBytesBase64"`
	EnvelopeBytesBase64 string                              `json:"envelopeBytesBase64"`
	Expected            runtimeSuccessorInstallExpectedV117 `json:"expected"`
}

type runtimeSuccessorInstallExpectedV117 struct {
	InstallReceiptID          string         `json:"installReceiptId"`
	InstallReceiptHash        string         `json:"installReceiptHash"`
	AuthorityBundleHash       string         `json:"authorityBundleHash"`
	SourceManifestHash        string         `json:"sourceManifestHash"`
	RegistryGeneration        string         `json:"registryGeneration"`
	SemanticTupleManifestHash string         `json:"semanticTupleManifestHash"`
	EnvelopeSHA256            string         `json:"envelopeSha256"`
	AttestationIDs            []string       `json:"attestationIds"`
	CertificateIDs            []string       `json:"certificateIds"`
	InstallReceipt            map[string]any `json:"installReceipt"`
}

type runtimeSuccessorEvidenceBindingFixtureV117 struct {
	GraphSchemaVersion   string                      `json:"graphSchemaVersion"`
	GraphProfile         string                      `json:"graphProfile"`
	IdentityManifestRoot string                      `json:"identityManifestRoot"`
	EvidenceGraphRoot    string                      `json:"evidenceGraphRoot"`
	ExactPins            runtimeServiceExactPinsV117 `json:"exactPins"`
}

type runtimeSuccessorAttestationFixtureV117 struct {
	AttestationID   string                                     `json:"attestationId"`
	AttestationHash string                                     `json:"attestationHash"`
	ProducerID      string                                     `json:"producerId"`
	ProducerKeyID   string                                     `json:"producerKeyId"`
	TrustDomain     string                                     `json:"trustDomain"`
	ManagedIdentity bool                                       `json:"managedIdentity"`
	Imports         []string                                   `json:"imports"`
	Binding         runtimeSuccessorEvidenceBindingFixtureV117 `json:"binding"`
}

type runtimeSuccessorCertificateFixtureV117 struct {
	CertificateID         string                                     `json:"certificateId"`
	CertificateVersion    string                                     `json:"certificateVersion"`
	CertificateRecordHash string                                     `json:"certificateRecordHash"`
	CertificateKind       string                                     `json:"certificateKind"`
	AttestationID         string                                     `json:"attestationId"`
	Binding               runtimeSuccessorEvidenceBindingFixtureV117 `json:"binding"`
}

type runtimeSuccessorAuthorityPayloadFixtureV117 struct {
	SchemaVersion             string                                   `json:"schemaVersion"`
	BundleVersion             string                                   `json:"bundleVersion"`
	RegistryGeneration        string                                   `json:"registryGeneration"`
	IssuedAt                  string                                   `json:"issuedAt"`
	ValidFrom                 string                                   `json:"validFrom"`
	ValidUntil                string                                   `json:"validUntil"`
	SemanticTupleManifestHash string                                   `json:"semanticTupleManifestHash"`
	SourceManifestHash        string                                   `json:"sourceManifestHash"`
	Attestations              []runtimeSuccessorAttestationFixtureV117 `json:"attestations"`
	Certificates              []runtimeSuccessorCertificateFixtureV117 `json:"certificates"`
}

func loadRuntimeSuccessorAuthorityFixtureV117(t *testing.T) runtimeSuccessorAuthorityFixtureV117 {
	t.Helper()
	bytes := []byte(runtimeSuccessorAuthorityFixtureV117JSON)
	digest := sha256.Sum256(bytes)
	if hex.EncodeToString(digest[:]) != runtimeSuccessorAuthorityFixtureV117SHA256 {
		t.Fatal("generated successor authority fixture checksum drifted")
	}
	var fixture runtimeSuccessorAuthorityFixtureV117
	if err := decodeStrictJSON(bytes, &fixture); err != nil {
		t.Fatalf("generated successor authority fixture is invalid: %v", err)
	}
	if fixture.SchemaVersion != "runtime-successor-authority-fixture-v1.17" || !fixture.NonProduction ||
		fixture.SemanticTupleID != runtimeSuccessorSemanticTupleIDV117 || len(fixture.RevisionVectors) != 2 || len(fixture.NegativeVectors) != 2 {
		t.Fatal("generated successor authority fixture contract drifted")
	}
	var generatedTuple canonicalCompatibilityTuple
	if err := json.Unmarshal([]byte(runtimeSuccessorSemanticTupleV117), &generatedTuple); err != nil || generatedTuple != fixture.SemanticTuple {
		t.Fatal("generated successor semantic tuple expansion drifted")
	}
	return fixture
}

func (fixture runtimeSuccessorAuthorityFixtureV117) decodedPayload(t *testing.T) ([]byte, runtimeSuccessorAuthorityPayloadFixtureV117) {
	t.Helper()
	bytes, err := base64.StdEncoding.Strict().DecodeString(fixture.InstallFixture.PayloadBytesBase64)
	if err != nil {
		t.Fatal(err)
	}
	var payload runtimeSuccessorAuthorityPayloadFixtureV117
	if err := decodeStrictJSON(bytes, &payload); err != nil {
		t.Fatalf("generated successor authority payload is invalid: %v", err)
	}
	return bytes, payload
}

func (vector runtimeSuccessorRevisionVectorV117) strategy(t *testing.T, lockedAt time.Time) runtimeServiceStrategyRevision {
	t.Helper()
	sourceBytes, err := base64.StdEncoding.Strict().DecodeString(vector.OriginalSourceBytesBase64)
	if err != nil || string(sourceBytes) != vector.Revision.Source {
		t.Fatal("successor revision source bytes drifted")
	}
	artifactBytes, err := base64.StdEncoding.Strict().DecodeString(vector.ArtifactBytesBase64)
	if err != nil || runtimeInvocationV117SHA256Value(artifactBytes) != "sha256:"+vector.DeployedArtifactSHA256 {
		t.Fatal("successor revision artifact bytes drifted")
	}
	return runtimeServiceStrategyRevision{
		ID: vector.Revision.ID, Source: vector.Revision.Source, SourceHash: vector.Revision.SourceHash,
		SourceBytes: vector.Revision.SourceBytes, Runtime: cloneMap(vector.Revision.Runtime),
		EngineCompatibility: cloneMap(vector.Revision.EngineCompatibility), Validation: cloneMap(vector.Revision.Validation),
		Metadata: cloneMap(vector.Revision.Metadata), LockedAt: &lockedAt,
	}
}

func TestPhase258GeneratedSuccessorAuthorityFixtureHasExactGoIdentityParity(t *testing.T) {
	fixture := loadRuntimeSuccessorAuthorityFixtureV117(t)
	template := fixture.Template
	if !normalizeRuntimeSuccessorIdentityTemplateV117(&template) || !reflect.DeepEqual(template, fixture.Template) {
		t.Fatal("generated successor identity template was not already canonical")
	}
	lockedAt := time.Date(2026, 7, 15, 12, 0, 0, 0, time.UTC)
	seenRoots := map[string]bool{}
	for _, vector := range fixture.RevisionVectors {
		strategy := vector.strategy(t, lockedAt)
		if vector.StrategyRevisionID != strategy.ID || vector.Deployed.SemanticTupleID != fixture.SemanticTupleID ||
			vector.Deployed.SemanticTuple != fixture.SemanticTuple ||
			vector.LaneIdentityHash != "sha256:"+hashCreationLaneIdentity(vector.Deployed) ||
			vector.Deployed.ArtifactSHA256 != vector.DeployedArtifactSHA256 {
			t.Fatalf("generated %s revision/lane identity drifted: ids=%q/%q tuple=%q/%q lane=%q/%q artifact=%q/%q", vector.Side,
				vector.StrategyRevisionID, strategy.ID, vector.Deployed.SemanticTupleID, fixture.SemanticTupleID,
				vector.LaneIdentityHash, "sha256:"+hashCreationLaneIdentity(vector.Deployed), vector.Deployed.ArtifactSHA256, vector.DeployedArtifactSHA256)
		}
		registry := &goDeploymentLaneRegistry{
			SchemaVersion: deploymentLaneRegistrySchemaVersion,
			RegistryID:    "fixture:exact-successor-authority:v1.17",
			Lanes: []goDeploymentLaneProfile{{
				ProviderID: vector.Deployed.ProviderID, LanguageID: vector.Deployed.LanguageID,
				LanguageVersion: stringValue(mapValue(strategy.Runtime, "language"), "version"),
				RuntimeID:       vector.Deployed.RuntimeID, RuntimeVersion: vector.Deployed.RuntimeVersion,
				ToolchainID: vector.Deployed.ToolchainID, ToolchainVersion: vector.Deployed.ToolchainVersion,
				AdapterID: vector.Deployed.AdapterID, AdapterVersion: vector.Deployed.AdapterVersion,
				PolicyID: vector.Deployed.PolicyID, PolicyVersion: vector.Deployed.PolicyVersion,
				CorpusID: vector.Deployed.CorpusID, CorpusVersion: vector.Deployed.CorpusVersion,
				ArtifactKind: "source", ArtifactIDPrefix: strings.TrimSuffix(vector.Deployed.ArtifactID, strategy.ID),
				ImplementationID: vector.Deployed.ImplementationID, BuildID: vector.Deployed.BuildID,
				SemanticTupleID: vector.Deployed.SemanticTupleID, SemanticTuple: vector.Deployed.SemanticTuple,
				SuccessorRuntimeIdentityTemplate: cloneRuntimeSuccessorIdentityTemplateV117(&template),
			}},
		}
		if !validSuccessorStrategyRevisionV117(strategy.SourceHash, strategy.SourceBytes, strategy.Runtime, strategy.EngineCompatibility, strategy.Validation, strategy.Metadata) {
			t.Fatalf("generated %s revision failed the Go v1.17 revision contract", vector.Side)
		}
		if !sourceArtifactProviderValidationMatchesABI(strategy.Metadata, strategy.SourceHash, strategy.SourceBytes, vector.Deployed.ProviderID, vector.Deployed.LanguageID, strategyRuntimeABIVersionV117) {
			t.Fatalf("generated %s revision failed the Go v1.17 provider proof", vector.Side)
		}
		if !successorIdentityTemplateMatchesLaneProfileV117(registry.Lanes[0].SuccessorRuntimeIdentityTemplate, registry.Lanes[0]) {
			t.Fatalf("generated %s revision failed the Go v1.17 template/lane binding", vector.Side)
		}
		resolved, ok := registry.resolveRevision(strategy.ID, strategy.SourceHash, strategy.SourceBytes, strategy.Runtime, strategy.EngineCompatibility, strategy.Validation, strategy.Metadata, registeredCompatibilityTuple{
			TupleID: fixture.SemanticTupleID, Tuple: fixture.SemanticTuple,
		})
		if !ok || resolved == nil || *resolved != vector.Deployed {
			t.Fatalf("generated %s revision was not consumable by the exact Go deployment registry: %+v", vector.Side, resolved)
		}
		driftedRuntime := cloneMap(strategy.Runtime)
		mapValue(driftedRuntime, "limits")["filesystem"] = "host"
		if resolved, ok := registry.resolveRevision(strategy.ID, strategy.SourceHash, strategy.SourceBytes, driftedRuntime, strategy.EngineCompatibility, strategy.Validation, strategy.Metadata, registeredCompatibilityTuple{
			TupleID: fixture.SemanticTupleID, Tuple: fixture.SemanticTuple,
		}); ok || resolved != nil {
			t.Fatalf("generated %s revision admitted unsafe successor runtime limits", vector.Side)
		}
		manifestBytes, err := runtimeInvocationV117CanonicalValue(vector.Expected.IdentityManifest)
		if err != nil {
			t.Fatal(err)
		}
		manifestHash, ok := hashRuntimeIdentityBytesV117("evidenceBundle", manifestBytes)
		if !ok || "sha256:"+manifestHash != vector.Expected.IdentityManifestRoot {
			t.Fatalf("generated %s full identity manifest/root drifted", vector.Side)
		}
		root, sourceIdentity, composed := composeRuntimeSuccessorIdentityV117(
			strategy,
			goEntrantExecutionEvidence{StrategyRevisionID: strategy.ID, LaneIdentity: vector.Deployed},
			&template,
		)
		if !composed || root != vector.Expected.IdentityManifestRoot || sourceIdentity != vector.Expected.SourceIdentity ||
			!reflect.DeepEqual(template.ExactPins, vector.Expected.ExactPins) {
			t.Fatalf("Go %s composition diverged from the TypeScript fixture: root=%q source=%+v", vector.Side, root, sourceIdentity)
		}
		if seenRoots[root] {
			t.Fatal("separate fixture revisions collapsed to one successor identity root")
		}
		seenRoots[root] = true
	}
	payloadBytes, payload := fixture.decodedPayload(t)
	payloadDigest := sha256.Sum256(payloadBytes)
	computedBundle := "sha256:" + hex.EncodeToString(payloadDigest[:])
	payloadAttestationIDs := make([]string, 0, len(payload.Attestations))
	for _, attestation := range payload.Attestations {
		payloadAttestationIDs = append(payloadAttestationIDs, attestation.AttestationID)
	}
	sort.Strings(payloadAttestationIDs)
	payloadCertificateIDs := make([]string, 0, len(payload.Certificates))
	for _, certificate := range payload.Certificates {
		payloadCertificateIDs = append(payloadCertificateIDs, certificate.CertificateID)
	}
	sort.Strings(payloadCertificateIDs)
	if computedBundle != fixture.InstallFixture.Expected.AuthorityBundleHash ||
		payload.SemanticTupleManifestHash != fixture.SemanticTupleID || payload.RegistryGeneration != fixture.InstallFixture.Expected.RegistryGeneration ||
		!reflect.DeepEqual(fixture.InstallFixture.Expected.AttestationIDs, payloadAttestationIDs) ||
		!reflect.DeepEqual(fixture.InstallFixture.Expected.CertificateIDs, payloadCertificateIDs) {
		t.Fatalf("signed successor payload did not preserve its exact generated identity: bundle=%q/%q tuple=%q/%q generation=%q/%q attestations=%v/%v", computedBundle,
			fixture.InstallFixture.Expected.AuthorityBundleHash, payload.SemanticTupleManifestHash, fixture.SemanticTupleID, payload.RegistryGeneration,
			fixture.InstallFixture.Expected.RegistryGeneration, fixture.InstallFixture.Expected.AttestationIDs, payloadAttestationIDs)
	}
}

func successorIdentitySameLaneRevisionsForTest(t *testing.T) (
	*goDeploymentLaneRegistry,
	runtimeServiceStrategyRevision,
	goEntrantExecutionEvidence,
	runtimeServiceStrategyRevision,
	goEntrantExecutionEvidence,
) {
	t.Helper()
	fixture := newDeploymentLaneFixture(t)
	fixture.Tuple = registeredCompatibilityTuple{TupleID: runtimeSuccessorSemanticTupleIDV117, Tuple: runtimeSuccessorCanonicalTupleV117}
	fixture.Registry.Lanes[0].SemanticTupleID = fixture.Tuple.TupleID
	fixture.Registry.Lanes[0].SemanticTuple = fixture.Tuple.Tuple
	template := runtimeSuccessorIdentityTemplateFixtureV117(runtimeServiceExactPinsFixtureV117(1))
	templateBindings := runtimeIdentityBindingMapV117(template.Bindings)
	fixture.Registry.Lanes[0].RuntimeID = "fixture-execution-runtime-v1.17"
	fixture.Registry.Lanes[0].RuntimeVersion = template.ExactPins[1][1]
	fixture.Registry.Lanes[0].ToolchainID = stringValue(mapValue(mapValue(fixture.Strategy.Metadata, "sourceArtifact"), "toolchain"), "runtime")
	fixture.Registry.Lanes[0].PolicyID = templateBindings["containmentPolicy"].PublicID
	fixture.Registry.Lanes[0].CorpusID = templateBindings["conformanceCorpus"].PublicID
	laneProfileHash, ok := hashSuccessorRuntimeLaneProfileV117(fixture.Registry.Lanes[0])
	if !ok {
		t.Fatal("successor identity test lane profile could not be hashed")
	}
	template.LaneProfileSHA256 = laneProfileHash
	fixture.Registry.Lanes[0].SuccessorRuntimeIdentityTemplate = template
	first := fixture.Strategy
	first.Runtime = cloneMap(first.Runtime)
	first.Runtime["abiVersion"] = strategyRuntimeABIVersionV117
	first.Metadata = cloneMap(first.Metadata)
	mapValue(first.Metadata, "sourceArtifact")["abiVersion"] = strategyRuntimeABIVersionV117
	firstEvidence := goEntrantExecutionEvidence{StrategyRevisionID: first.ID, LaneIdentity: fixture.Lane}
	firstEvidence.LaneIdentity.RuntimeID = fixture.Registry.Lanes[0].RuntimeID
	firstEvidence.LaneIdentity.RuntimeVersion = fixture.Registry.Lanes[0].RuntimeVersion
	firstEvidence.LaneIdentity.ToolchainID = fixture.Registry.Lanes[0].ToolchainID
	firstEvidence.LaneIdentity.PolicyID = fixture.Registry.Lanes[0].PolicyID
	firstEvidence.LaneIdentity.CorpusID = fixture.Registry.Lanes[0].CorpusID
	firstEvidence.LaneIdentity.SemanticTupleID = fixture.Tuple.TupleID
	firstEvidence.LaneIdentity.SemanticTuple = fixture.Tuple.Tuple
	second := first
	second.ID = first.ID + ":second"
	second.Source = first.Source + "\r\n// second revision"
	second.SourceHash = hashString(second.Source)
	second.SourceBytes = len([]byte(second.Source))
	second.Metadata = cloneMap(first.Metadata)
	secondArtifact := []byte("typescript-artifact-second-revision")
	secondArtifactHash := runtimeInvocationV117SHA256Value(secondArtifact)
	sourceArtifact := mapValue(second.Metadata, "sourceArtifact")
	sourceArtifact["hash"] = secondArtifactHash[len("sha256:"):]
	sourceArtifact["bytes"] = len(secondArtifact)
	sourceArtifact["bytesBase64"] = base64.StdEncoding.EncodeToString(secondArtifact)
	sourceArtifact["sourceHash"] = second.SourceHash
	sourceArtifact["sourceBytes"] = second.SourceBytes
	delete(sourceArtifact, "sourceIdentity")
	second.Metadata["sourceArtifact"] = sourceArtifact
	secondLane := firstEvidence.LaneIdentity
	secondLane.ArtifactID += ":second"
	secondLane.ArtifactSHA256 = secondArtifactHash[len("sha256:"):]
	secondEvidence := goEntrantExecutionEvidence{StrategyRevisionID: second.ID, LaneIdentity: secondLane}
	return fixture.Registry, first, firstEvidence, second, secondEvidence
}

func TestPhase258SuccessorIdentityCompositionIsRevisionSpecificAndImmutable(t *testing.T) {
	registry, first, firstEvidence, second, secondEvidence := successorIdentitySameLaneRevisionsForTest(t)
	template := registry.Lanes[0].SuccessorRuntimeIdentityTemplate
	before, err := runtimeInvocationV117CanonicalValue(template)
	if err != nil {
		t.Fatal(err)
	}
	firstRoot, firstSource, firstOK := composeRuntimeSuccessorIdentityV117(first, firstEvidence, template)
	secondRoot, secondSource, secondOK := composeRuntimeSuccessorIdentityV117(second, secondEvidence, template)
	if !firstOK || !secondOK || firstRoot == secondRoot || firstSource == secondSource {
		t.Fatalf("same-lane revisions did not compose distinct exact identities: first=%q/%+v second=%q/%+v", firstRoot, firstSource, secondRoot, secondSource)
	}
	differentLaneTemplate := cloneRuntimeSuccessorIdentityTemplateV117(template)
	differentLaneTemplate.LaneProfileSHA256 = "sha256:" + hashString("different exact lane profile")
	differentLaneRoot, _, differentLaneOK := composeRuntimeSuccessorIdentityV117(first, firstEvidence, differentLaneTemplate)
	if !differentLaneOK || differentLaneRoot == firstRoot {
		t.Fatal("successor identity root did not bind the exact lane-profile hash")
	}

	const workers = 64
	results := make(chan string, workers)
	var wait sync.WaitGroup
	for index := 0; index < workers; index++ {
		wait.Add(1)
		go func(useSecond bool) {
			defer wait.Done()
			strategy, evidence, expected := first, firstEvidence, firstRoot
			if useSecond {
				strategy, evidence, expected = second, secondEvidence, secondRoot
			}
			root, _, ok := composeRuntimeSuccessorIdentityV117(strategy, evidence, template)
			if !ok || root != expected {
				results <- root
			}
		}(index%2 == 1)
	}
	wait.Wait()
	close(results)
	for unexpected := range results {
		t.Fatalf("concurrent successor identity composition drifted: %q", unexpected)
	}
	after, err := runtimeInvocationV117CanonicalValue(template)
	if err != nil || string(after) != string(before) {
		t.Fatal("successor identity composition mutated the shared installed template")
	}
}

func TestPhase258SuccessorIdentityRejectsSourceArtifactAndRootSwaps(t *testing.T) {
	registry, first, firstEvidence, second, secondEvidence := successorIdentitySameLaneRevisionsForTest(t)
	template := registry.Lanes[0].SuccessorRuntimeIdentityTemplate
	firstRoot, _, firstOK := composeRuntimeSuccessorIdentityV117(first, firstEvidence, template)
	secondRoot, _, secondOK := composeRuntimeSuccessorIdentityV117(second, secondEvidence, template)
	if !firstOK || !secondOK {
		t.Fatal("successor identity fixtures did not compose")
	}

	sourceSwap := second
	sourceSwap.Source = first.Source
	if _, _, ok := composeRuntimeSuccessorIdentityV117(sourceSwap, secondEvidence, template); ok {
		t.Fatal("persisted source bytes were swappable independently of their locked revision identity")
	}
	artifactSwap := second
	artifactSwap.Metadata = cloneMap(second.Metadata)
	artifact := mapValue(artifactSwap.Metadata, "sourceArtifact")
	artifact["bytesBase64"] = base64.StdEncoding.EncodeToString([]byte("swapped-artifact"))
	artifactSwap.Metadata["sourceArtifact"] = artifact
	if _, _, ok := composeRuntimeSuccessorIdentityV117(artifactSwap, secondEvidence, template); ok {
		t.Fatal("persisted artifact bytes were swappable independently of their locked artifact hash")
	}
	claimed := claimedRuntimeServiceEntrantV117{
		StrategyRevisionID:   second.ID,
		LaneIdentityHash:     "sha256:" + hashCreationLaneIdentity(secondEvidence.LaneIdentity),
		IdentityManifestRoot: firstRoot,
		EvidenceGraphRoot:    "sha256:" + hashString("graph:second"),
		ExactPins:            template.ExactPins,
	}
	if projected, ok := projectRuntimeServiceEntrantV117(second, secondEvidence, claimed, registry); ok || projected.IdentityManifestRoot == secondRoot {
		t.Fatal("a composed root from another revision was admitted")
	}
}

func TestPhase258SuccessorTemplateRejectsWrongSemanticTupleBinding(t *testing.T) {
	fixture := loadRuntimeSuccessorAuthorityFixtureV117(t)
	for _, mutation := range []struct {
		name   string
		mutate func(*runtimeIdentityBindingV117)
	}{
		{"public id", func(binding *runtimeIdentityBindingV117) { binding.PublicID = currentCanonicalTupleID }},
		{"hash", func(binding *runtimeIdentityBindingV117) {
			binding.SHA256 = strings.TrimPrefix(currentCanonicalTupleID, "sha256:")
		}},
	} {
		t.Run(mutation.name, func(t *testing.T) {
			template := fixture.Template
			template.Bindings = append([]runtimeIdentityBindingV117(nil), fixture.Template.Bindings...)
			for index := range template.Bindings {
				if template.Bindings[index].Domain == "semanticTuple" {
					mutation.mutate(&template.Bindings[index])
				}
			}
			if normalizeRuntimeSuccessorIdentityTemplateV117(&template) {
				t.Fatal("successor template admitted the wrong exact semantic tuple binding")
			}
		})
	}
}
