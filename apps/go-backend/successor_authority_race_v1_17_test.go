package main

import (
	"context"
	"crypto/ed25519"
	"encoding/base64"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
)

const runtimeEvidenceV117EnvelopeHashDomain = "cowards-game:runtime-evidence-authority-envelope:v1.17"
const runtimeEvidenceV117InstallIDDomain = "cowards-game:runtime-evidence-authority-install-id:v1.17"
const runtimeEvidenceV117InstallReceiptHashDomain = "cowards-game:runtime-evidence-authority-install-receipt:v1.17"
const runtimeEvidenceV117InstallReceiptSchema = "v1.37-runtime-evidence-authority-install-receipt-v1.17"

type signedCompetingSuccessorAuthorityV117 struct {
	id, bundleHash, sourceHash, generation, tupleID, envelopeHash, keyID, receiptHash string
	issuedAt, validFrom, validUntil, installedAt                                      time.Time
	payloadBytes, envelopeBytes                                                       []byte
	attestationIDs, certificateIDs                                                    []string
	receipt                                                                           map[string]any
}

func TestPhase258CompletionAdmissionSerializesAgainstSuccessorInstall(t *testing.T) {
	publisherSource, err := os.ReadFile("../../packages/persistence/src/runtime-evidence-authority-publisher.ts")
	if err != nil || !strings.Contains(string(publisherSource), `"`+runtimeEvidenceV117InstalledAuthorityHeadLockSQL+`"`) {
		t.Fatal("Go completion admission and the TypeScript successor publisher do not share one exact lock identity")
	}
	databaseURL := os.Getenv("COWARDS_GO_BACKEND_TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Fatal("COWARDS_GO_BACKEND_TEST_DATABASE_URL is required")
	}
	ctx := context.Background()
	pool := semanticCurrentIsolatedPool(t, ctx, databaseURL)
	now := time.Date(2026, 7, 15, 13, 55, 0, 0, time.UTC)
	fixture, _ := preparePhase258V117ClaimFixture(t, ctx, pool, now)
	seeded := fixture.seedMatch(t, ctx, pool, "successor-install-race")
	service := newMatchCompletionService(pool)
	service.now = func() time.Time { return now }
	service.loadAuthority = func() (*verifiedRuntimeEvidenceAuthority, error) { return fixture.authority, nil }
	service.successorAuthorityTrustDomain = runtimeEvidenceAuthorityFixtureTrustDomain

	completionTx, err := pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		t.Fatal(err)
	}
	defer rollbackTx(ctx, completionTx)
	if err := lockAuthorityPublicationTransitions(ctx, completionTx); err != nil {
		t.Fatal(err)
	}
	if _, err := service.lockCompletionIntegrity(ctx, completionTx, seeded.jobID, seeded.leaseToken, fixture.identity); err != nil {
		t.Fatalf("completion admission failed before the competing install: %v", err)
	}

	installerConn, err := pool.Acquire(ctx)
	if err != nil {
		t.Fatal(err)
	}
	defer installerConn.Release()
	installerTx, err := installerConn.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.Serializable})
	if err != nil {
		t.Fatal(err)
	}
	defer rollbackTx(ctx, installerTx)
	var installerPID int
	if err := installerTx.QueryRow(ctx, `select pg_backend_pid()`).Scan(&installerPID); err != nil {
		t.Fatal(err)
	}
	competing := newSignedCompetingSuccessorAuthorityV117(t, now)
	installResult := make(chan error, 1)
	go func() {
		if _, err := installerTx.Exec(ctx, runtimeEvidenceV117InstalledAuthorityHeadLockSQL); err != nil {
			installResult <- err
			return
		}
		_, err := installerTx.Exec(ctx, `insert into runtime_evidence_v1_17_installed_authorities
			(id,authority_bundle_hash,source_manifest_hash,registry_generation,semantic_tuple_manifest_hash,envelope_sha256,trust_domain,signer_key_id,install_receipt_id,install_receipt_hash,issued_at,valid_from,valid_until,installed_at,payload_bytes,envelope_bytes,attestation_ids,certificate_ids,install_receipt)
			values ($1,$2,$3,$4,$5,$6,$7,$8,$1,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
			competing.id, competing.bundleHash, competing.sourceHash, competing.generation, competing.tupleID, competing.envelopeHash,
			runtimeEvidenceAuthorityFixtureTrustDomain, competing.keyID, competing.receiptHash,
			competing.issuedAt, competing.validFrom, competing.validUntil, competing.installedAt,
			competing.payloadBytes, competing.envelopeBytes, competing.attestationIDs, competing.certificateIDs, competing.receipt)
		installResult <- err
	}()

	deadline := time.Now().Add(3 * time.Second)
	waiting := false
	for time.Now().Before(deadline) {
		if err := pool.QueryRow(ctx, `select exists(select 1 from pg_locks where pid=$1 and locktype='advisory' and not granted)`, installerPID).Scan(&waiting); err != nil {
			t.Fatal(err)
		}
		if waiting {
			break
		}
		time.Sleep(10 * time.Millisecond)
	}
	if !waiting {
		t.Fatal("competing successor installer was not observed waiting on the completion-admission lock")
	}
	select {
	case err := <-installResult:
		t.Fatalf("competing installer crossed completion admission before commit: %v", err)
	default:
	}
	var installedBeforeCommit int
	if err := pool.QueryRow(ctx, `select count(*) from runtime_evidence_v1_17_installed_authorities`).Scan(&installedBeforeCommit); err != nil {
		t.Fatal(err)
	}
	if installedBeforeCommit != 1 {
		t.Fatalf("competing authority became visible inside completion admission: count=%d", installedBeforeCommit)
	}
	if err := completionTx.Commit(ctx); err != nil {
		t.Fatal(err)
	}
	select {
	case err := <-installResult:
		if err != nil {
			t.Fatal(err)
		}
	case <-time.After(3 * time.Second):
		t.Fatal("competing successor installer did not resume after completion admission committed")
	}
	if err := installerTx.Commit(ctx); err != nil {
		t.Fatal(err)
	}
	var installedAfterCommit int
	if err := pool.QueryRow(ctx, `select count(*) from runtime_evidence_v1_17_installed_authorities`).Scan(&installedAfterCommit); err != nil {
		t.Fatal(err)
	}
	if installedAfterCommit != 2 {
		t.Fatalf("serialized competing authority was not installed after admission commit: count=%d", installedAfterCommit)
	}

	postInstallTx, err := pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		t.Fatal(err)
	}
	defer rollbackTx(ctx, postInstallTx)
	if err := lockAuthorityPublicationTransitions(ctx, postInstallTx); err != nil {
		t.Fatal(err)
	}
	if _, err := service.lockCompletionIntegrity(ctx, postInstallTx, seeded.jobID, seeded.leaseToken, fixture.identity); err == nil {
		t.Fatal("completion admission accepted an ambiguous successor authority after the competing install")
	}
}

func newSignedCompetingSuccessorAuthorityV117(t *testing.T, installedAt time.Time) signedCompetingSuccessorAuthorityV117 {
	t.Helper()
	fixture := loadRuntimeSuccessorAuthorityFixtureV117(t)
	originalPayloadBytes, originalPayload := fixture.decodedPayload(t)
	var payload map[string]any
	if err := decodeStrictJSONUseNumber(originalPayloadBytes, &payload); err != nil {
		t.Fatal(err)
	}
	payload["bundleVersion"] = "bundle:successor-race-fixture:v1.17"
	payloadBytes, err := runtimeInvocationV117CanonicalValue(payload)
	if err != nil {
		t.Fatal(err)
	}
	bundleHash := runtimeInvocationV117SHA256Value(payloadBytes)
	publicKey, privateKey, err := ed25519.GenerateKey(nil)
	if err != nil {
		t.Fatal(err)
	}
	envelope := runtimeEvidenceAuthorityEnvelope{
		SchemaVersion: runtimeEvidenceAuthorityEnvelopeSchemaVersion,
		TrustDomain:   runtimeEvidenceAuthorityFixtureTrustDomain,
		KeyID:         "fixture-only-race-ed25519-key-v1", Algorithm: "Ed25519",
		PayloadBase64: base64.StdEncoding.EncodeToString(payloadBytes), PayloadSHA256: bundleHash,
	}
	envelope.SignatureBase64 = base64.StdEncoding.EncodeToString(ed25519.Sign(privateKey, encodeRuntimeEvidenceAuthoritySignatureMessage(envelope, payloadBytes)))
	if !ed25519.Verify(publicKey, encodeRuntimeEvidenceAuthoritySignatureMessage(envelope, payloadBytes), mustDecodeFixtureBase64V117(t, envelope.SignatureBase64)) {
		t.Fatal("competing successor fixture signature did not verify")
	}
	envelopeBytes, err := runtimeInvocationV117CanonicalValue(envelope)
	if err != nil {
		t.Fatal(err)
	}
	envelopeHash := runtimeEvidenceV117DomainHash(runtimeEvidenceV117EnvelopeHashDomain, envelopeBytes)
	attestationIDs := append([]string(nil), fixture.InstallFixture.Expected.AttestationIDs...)
	certificateIDs := append([]string(nil), fixture.InstallFixture.Expected.CertificateIDs...)
	instant := installedAt.Format(canonicalJSONInstantLayout)
	identity := map[string]any{
		"schemaVersion":       runtimeEvidenceV117InstallReceiptSchema,
		"authorityBundleHash": bundleHash, "sourceManifestHash": originalPayload.SourceManifestHash,
		"registryGeneration": originalPayload.RegistryGeneration, "semanticTupleManifestHash": originalPayload.SemanticTupleManifestHash,
		"envelopeSha256": envelopeHash, "installedAt": instant,
		"attestationIds": attestationIDs, "certificateIds": certificateIDs,
	}
	identityBytes, err := runtimeInvocationV117CanonicalValue(identity)
	if err != nil {
		t.Fatal(err)
	}
	id := "runtime-authority-install:v1.17:" + runtimeEvidenceV117DomainHash(runtimeEvidenceV117InstallIDDomain, identityBytes)[len("sha256:"):]
	receipt := cloneMap(identity)
	receipt["installReceiptId"] = id
	receiptBytes, err := runtimeInvocationV117CanonicalValue(receipt)
	if err != nil {
		t.Fatal(err)
	}
	issuedAt := mustParseFixtureInstantV117(t, originalPayload.IssuedAt)
	validFrom := mustParseFixtureInstantV117(t, originalPayload.ValidFrom)
	validUntil := mustParseFixtureInstantV117(t, originalPayload.ValidUntil)
	if installedAt.Before(validFrom) || installedAt.After(validUntil) || bundleHash == fixture.InstallFixture.Expected.AuthorityBundleHash {
		t.Fatal("competing signed successor fixture identity is invalid")
	}
	return signedCompetingSuccessorAuthorityV117{
		id: id, bundleHash: bundleHash, sourceHash: originalPayload.SourceManifestHash,
		generation: originalPayload.RegistryGeneration, tupleID: originalPayload.SemanticTupleManifestHash,
		envelopeHash: envelopeHash, keyID: envelope.KeyID,
		receiptHash: runtimeEvidenceV117DomainHash(runtimeEvidenceV117InstallReceiptHashDomain, receiptBytes),
		issuedAt:    issuedAt, validFrom: validFrom, validUntil: validUntil, installedAt: installedAt,
		payloadBytes: payloadBytes, envelopeBytes: envelopeBytes,
		attestationIDs: attestationIDs, certificateIDs: certificateIDs, receipt: receipt,
	}
}

func runtimeEvidenceV117DomainHash(domain string, bytes []byte) string {
	framed := append(append([]byte{}, []byte(domain)...), 0)
	framed = append(framed, bytes...)
	return runtimeInvocationV117SHA256Value(framed)
}

func mustDecodeFixtureBase64V117(t *testing.T, value string) []byte {
	t.Helper()
	decoded, err := base64.StdEncoding.Strict().DecodeString(value)
	if err != nil {
		t.Fatal(err)
	}
	return decoded
}
