package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const defaultMatchJobLease = 30 * time.Second

const claimNextMatchJobSQL = `
  select
    j.id,
    j.match_id,
    j.attempts,
    jsonb_build_object(
      'matchSetId', ms.id,
      'compatibilityTupleId', ms.compatibility_tuple_id,
      'compatibilityTuple', jsonb_build_object(
        'rules', ms.compatibility_rules_version,
        'engine', ms.compatibility_engine_version,
        'runtimeAbi', ms.compatibility_runtime_abi_version,
        'chronicle', ms.compatibility_chronicle_version,
        'arenaCatalog', ms.compatibility_arena_catalog_version,
        'setPolicy', ms.compatibility_set_policy_version
      ),
      'authorityBundleHash', 'sha256:' || ms.authority_bundle_hash,
      'registryGeneration', ms.authority_registry_generation,
      'evidenceSetHash', ms.execution_evidence_set_hash,
      'pairHash', j.execution_evidence_pair_hash,
      'publicationId', ms.authority_publication_id,
      'installReceiptId', ms.authority_install_receipt_id,
      'payloadSha256', ms.authority_payload_sha256,
      'envelopeSha256', ms.authority_envelope_sha256,
      'sourceManifestHash', ms.authority_source_manifest_hash,
      'sourceSet', ms.authority_source_set,
      'bottom', bottom_execution_entrant.execution_snapshot,
      'top', top_execution_entrant.execution_snapshot
    ) as integrity_identity
  from match_jobs j
  join matches m on m.id = j.match_id
  join match_sets ms
    on ms.id = j.integrity_match_set_id
   and ms.id = m.integrity_match_set_id
  join match_set_execution_entrants bottom_execution_entrant
    on bottom_execution_entrant.match_set_id = ms.id
   and bottom_execution_entrant.entrant_key = j.bottom_execution_entrant_key
   and bottom_execution_entrant.entrant_key = m.bottom_execution_entrant_key
   and bottom_execution_entrant.strategy_revision_id = m.bottom_strategy_revision_id
   and bottom_execution_entrant.execution_snapshot = j.bottom_execution_evidence
   and bottom_execution_entrant.execution_snapshot = m.bottom_execution_evidence
  join match_set_execution_entrants top_execution_entrant
    on top_execution_entrant.match_set_id = ms.id
   and top_execution_entrant.entrant_key = j.top_execution_entrant_key
   and top_execution_entrant.entrant_key = m.top_execution_entrant_key
   and top_execution_entrant.strategy_revision_id = m.top_strategy_revision_id
   and top_execution_entrant.execution_snapshot = j.top_execution_evidence
   and top_execution_entrant.execution_snapshot = m.top_execution_evidence
  join runtime_evidence_authority_publications publication
    on publication.id = ms.authority_publication_id
   and publication.generation::text = ms.authority_registry_generation
   and publication.semantic_tuple_manifest_hash = ms.compatibility_tuple_id
   and publication.payload_sha256 = ms.authority_payload_sha256
   and publication.envelope_sha256 = ms.authority_envelope_sha256
   and publication.source_manifest_hash = ms.authority_source_manifest_hash
   and publication.trust_domain = 'cowards-game:runtime-evidence-authority:production:v1'
  join runtime_evidence_authority_installed_head installed_head
    on installed_head.publication_id = publication.id
   and installed_head.install_receipt_id = ms.authority_install_receipt_id
   and installed_head.generation::text = ms.authority_registry_generation
   and installed_head.receipt -> 'sourceIds' = ms.authority_source_set
  left join runtime_evidence_certificates bottom_containment
    on bottom_containment.id = bottom_execution_entrant.containment_certificate_id
   and bottom_containment.certificate_kind = 'containment'
   and bottom_containment.certificate_status = 'passed'
   and bottom_containment.certificate_version = bottom_execution_entrant.containment_certificate_version
   and bottom_containment.certificate_record_hash = bottom_execution_entrant.containment_certificate_hash
   and bottom_containment.registry_generation = bottom_execution_entrant.authority_registry_generation
   and bottom_containment.lane_identity_hash = bottom_execution_entrant.lane_identity_hash
  left join runtime_evidence_certificates top_containment
    on top_containment.id = top_execution_entrant.containment_certificate_id
   and top_containment.certificate_kind = 'containment'
   and top_containment.certificate_status = 'passed'
   and top_containment.certificate_version = top_execution_entrant.containment_certificate_version
   and top_containment.certificate_record_hash = top_execution_entrant.containment_certificate_hash
   and top_containment.registry_generation = top_execution_entrant.authority_registry_generation
   and top_containment.lane_identity_hash = top_execution_entrant.lane_identity_hash
  left join runtime_evidence_certificates bottom_conformance
    on bottom_conformance.id = bottom_execution_entrant.conformance_certificate_id
   and bottom_conformance.certificate_kind = 'conformance'
   and bottom_conformance.certificate_status = 'passed'
   and bottom_conformance.certificate_version = bottom_execution_entrant.conformance_certificate_version
   and bottom_conformance.certificate_record_hash = bottom_execution_entrant.conformance_certificate_hash
   and bottom_conformance.registry_generation = bottom_execution_entrant.authority_registry_generation
   and bottom_conformance.lane_identity_hash = bottom_execution_entrant.lane_identity_hash
  left join runtime_evidence_certificates top_conformance
    on top_conformance.id = top_execution_entrant.conformance_certificate_id
   and top_conformance.certificate_kind = 'conformance'
   and top_conformance.certificate_status = 'passed'
   and top_conformance.certificate_version = top_execution_entrant.conformance_certificate_version
   and top_conformance.certificate_record_hash = top_execution_entrant.conformance_certificate_hash
   and top_conformance.registry_generation = top_execution_entrant.authority_registry_generation
   and top_conformance.lane_identity_hash = top_execution_entrant.lane_identity_hash
  where (
      (j.status = 'queued' and j.run_after <= $1)
      or (j.status = 'running' and j.lease_expires_at < $1)
    )
    and m.status in ('pending', 'running')
    and j.bottom_execution_entrant_key <> j.top_execution_entrant_key
    and j.execution_evidence_pair_hash = m.execution_evidence_pair_hash
    and ms.authority_bundle_hash = bottom_execution_entrant.authority_bundle_hash
    and ms.authority_bundle_hash = top_execution_entrant.authority_bundle_hash
    and ms.authority_registry_generation = bottom_execution_entrant.authority_registry_generation
    and ms.authority_registry_generation = top_execution_entrant.authority_registry_generation
    and bottom_containment.id is not null
    and top_containment.id is not null
    and bottom_containment.issued_at <= $1
    and bottom_containment.fresh_until >= $1
    and top_containment.issued_at <= $1
    and top_containment.fresh_until >= $1
    and bottom_execution_entrant.scheduling_evaluated_at <= $1
    and top_execution_entrant.scheduling_evaluated_at <= $1
    and bottom_execution_entrant.scheduling_fresh_until >= $1
    and top_execution_entrant.scheduling_fresh_until >= $1
    and (
      (bottom_execution_entrant.scheduling_status = 'counted' and bottom_conformance.id is not null and bottom_conformance.issued_at <= $1 and bottom_conformance.fresh_until >= $1)
      or (bottom_execution_entrant.scheduling_status = 'exhibition_only' and bottom_execution_entrant.conformance_certificate_id is null)
    )
    and (
      (top_execution_entrant.scheduling_status = 'counted' and top_conformance.id is not null and top_conformance.issued_at <= $1 and top_conformance.fresh_until >= $1)
      or (top_execution_entrant.scheduling_status = 'exhibition_only' and top_execution_entrant.conformance_certificate_id is null)
    )
    and publication.issued_at <= $1
    and publication.valid_from <= $1
    and publication.valid_until >= $1
    and ms.authority_source_set = jsonb_build_object(
      'attestationIds', publication.attestation_ids,
      'certificateIds', publication.certificate_ids,
      'revocationIds', publication.revocation_ids,
      'supersessionIds', publication.supersession_ids,
      'laneControlIds', publication.lane_control_ids
    )
    and (
      select count(*)
        from runtime_evidence_authority_publication_sources source_count
       where source_count.publication_id = publication.id
    ) = jsonb_array_length(publication.attestation_ids)
      + jsonb_array_length(publication.certificate_ids)
      + jsonb_array_length(publication.revocation_ids)
      + jsonb_array_length(publication.supersession_ids)
      + jsonb_array_length(publication.lane_control_ids)
    and not exists (
      select 1
        from runtime_evidence_authority_publication_sources source
        left join runtime_evidence_verified_attestations attestation
          on source.source_type = 'attestation'
         and attestation.id = source.attestation_id
         and attestation.verification_status = 'passed'
        left join runtime_evidence_certificates certificate
          on source.source_type = 'certificate'
         and certificate.id = source.certificate_id
         and certificate.certificate_status = 'passed'
        left join runtime_evidence_certificate_revocations revocation
          on source.source_type = 'revocation'
         and revocation.id = source.revocation_id
         and revocation.verification_status = 'passed'
        left join runtime_evidence_certificate_supersessions supersession
          on source.source_type = 'supersession'
         and supersession.id = source.supersession_id
         and supersession.verification_status = 'passed'
        left join runtime_evidence_lane_controls lane_control
          on source.source_type = 'lane-control'
         and lane_control.id = source.lane_control_id
         and lane_control.verification_status = 'passed'
       where source.publication_id = publication.id
         and source.source_record_hash is distinct from case source.source_type
           when 'attestation' then 'sha256:' || attestation.attestation_sha256
           when 'certificate' then 'sha256:' || certificate.certificate_record_hash
           when 'revocation' then 'sha256:' || revocation.envelope_hash
           when 'supersession' then 'sha256:' || supersession.envelope_hash
           when 'lane-control' then 'sha256:' || lane_control.envelope_hash
         end
    )
  order by j.run_after asc, j.created_at asc
  for update of j, m skip locked
  limit 1
`

var claimNextMatchJobWithAllowlistSQL = strings.Replace(
	claimNextMatchJobSQL,
	"  where (\n",
	"  where j.match_id = any($2::text[]) and (\n",
	1,
)

const claimNextLegacyMatchJobSQL = `
  select id, match_id, attempts, null::jsonb
  from match_jobs
  where
    (status = 'queued' and run_after <= $1)
    or (status = 'running' and lease_expires_at < $1)
  order by run_after asc, created_at asc
  for update skip locked
  limit 1
`

const claimNextLegacyMatchJobWithAllowlistSQL = `
  select id, match_id, attempts, null::jsonb
  from match_jobs
  where match_id = any($2::text[])
    and (
      (status = 'queued' and run_after <= $1)
      or (status = 'running' and lease_expires_at < $1)
    )
  order by run_after asc, created_at asc
  for update skip locked
  limit 1
`

const recheckClaimedMatchIntegritySQL = `
  select jsonb_build_object(
    'matchSetId', ms.id,
    'compatibilityTupleId', ms.compatibility_tuple_id,
    'compatibilityTuple', jsonb_build_object(
      'rules', ms.compatibility_rules_version, 'engine', ms.compatibility_engine_version,
      'runtimeAbi', ms.compatibility_runtime_abi_version, 'chronicle', ms.compatibility_chronicle_version,
      'arenaCatalog', ms.compatibility_arena_catalog_version, 'setPolicy', ms.compatibility_set_policy_version
    ),
    'authorityBundleHash', 'sha256:' || ms.authority_bundle_hash,
    'registryGeneration', ms.authority_registry_generation,
    'evidenceSetHash', ms.execution_evidence_set_hash,
    'pairHash', j.execution_evidence_pair_hash,
    'publicationId', ms.authority_publication_id,
    'installReceiptId', ms.authority_install_receipt_id,
    'payloadSha256', ms.authority_payload_sha256,
    'envelopeSha256', ms.authority_envelope_sha256,
    'sourceManifestHash', ms.authority_source_manifest_hash,
    'sourceSet', ms.authority_source_set,
    'bottom', bottom.execution_snapshot,
    'top', top.execution_snapshot
  )
  from match_jobs j
  join matches m on m.id = j.match_id
  join match_sets ms on ms.id = j.integrity_match_set_id and ms.id = m.integrity_match_set_id
  join match_set_execution_entrants bottom
    on bottom.match_set_id = ms.id and bottom.entrant_key = j.bottom_execution_entrant_key
   and bottom.entrant_key = m.bottom_execution_entrant_key and bottom.strategy_revision_id = m.bottom_strategy_revision_id
   and bottom.execution_snapshot = j.bottom_execution_evidence and bottom.execution_snapshot = m.bottom_execution_evidence
  join match_set_execution_entrants top
    on top.match_set_id = ms.id and top.entrant_key = j.top_execution_entrant_key
   and top.entrant_key = m.top_execution_entrant_key and top.strategy_revision_id = m.top_strategy_revision_id
   and top.execution_snapshot = j.top_execution_evidence and top.execution_snapshot = m.top_execution_evidence
  where j.id = $1 and j.lease_token = $2 and j.status = 'running'
    and m.status = 'running'
    and j.execution_evidence_pair_hash = m.execution_evidence_pair_hash
    and ms.authority_bundle_hash = bottom.authority_bundle_hash
    and ms.authority_bundle_hash = top.authority_bundle_hash
    and ms.authority_registry_generation = bottom.authority_registry_generation
    and ms.authority_registry_generation = top.authority_registry_generation
    and exists (
      select 1
        from runtime_evidence_authority_installed_head installed_head
       where installed_head.publication_id = ms.authority_publication_id
         and installed_head.install_receipt_id = ms.authority_install_receipt_id
         and installed_head.generation::text = ms.authority_registry_generation
    )
  for share of j, m, ms, bottom, top
`

type matchJobLifecycle struct {
	pool                  *pgxpool.Pool
	now                   func() time.Time
	newLeaseToken         func() (string, error)
	loadAuthority         func() (*verifiedRuntimeEvidenceAuthority, error)
	allowLegacyTestClaims bool
}

type claimMatchJobInput struct {
	WorkerID string
	MatchIDs []string
	Lease    time.Duration
}

type claimedMatchJob struct {
	JobID          string
	MatchID        string
	AttemptNumber  int
	LeaseToken     string
	LeaseExpiresAt time.Time
	Integrity      *claimedMatchIntegrityIdentity
}

type claimedMatchIntegrityIdentity struct {
	MatchSetID           string                      `json:"matchSetId"`
	CompatibilityTupleID string                      `json:"compatibilityTupleId"`
	CompatibilityTuple   canonicalCompatibilityTuple `json:"compatibilityTuple"`
	AuthorityBundleHash  string                      `json:"authorityBundleHash"`
	RegistryGeneration   string                      `json:"registryGeneration"`
	EvidenceSetHash      string                      `json:"evidenceSetHash"`
	PairHash             string                      `json:"pairHash"`
	PublicationID        string                      `json:"publicationId"`
	InstallReceiptID     string                      `json:"installReceiptId"`
	PayloadSHA256        string                      `json:"payloadSha256"`
	EnvelopeSHA256       string                      `json:"envelopeSha256"`
	SourceManifestHash   string                      `json:"sourceManifestHash"`
	SourceSet            map[string]any              `json:"sourceSet"`
	Bottom               goEntrantExecutionEvidence  `json:"bottom"`
	Top                  goEntrantExecutionEvidence  `json:"top"`
}

type recordAttemptFailureInput struct {
	JobID        string
	LeaseToken   string
	ErrorClass   string
	ErrorMessage string
	Retryable    bool
	Category     string
	Details      map[string]any
}

func newMatchJobLifecycle(pool *pgxpool.Pool) *matchJobLifecycle {
	return &matchJobLifecycle{
		pool:          pool,
		now:           time.Now,
		newLeaseToken: createGoLeaseToken,
		loadAuthority: loadProductionRuntimeEvidenceAuthorityFromEnvironment,
	}
}

func createGoLeaseToken() (string, error) {
	var bytes [16]byte
	if _, err := rand.Read(bytes[:]); err != nil {
		return "", err
	}
	return "go-lease:" + hex.EncodeToString(bytes[:]), nil
}

func (lifecycle *matchJobLifecycle) claimNextMatchJob(ctx context.Context, input claimMatchJobInput) (*claimedMatchJob, error) {
	if lifecycle == nil || lifecycle.pool == nil {
		return nil, errors.New("match job lifecycle requires a database pool")
	}
	if input.WorkerID == "" {
		return nil, errors.New("worker id is required")
	}
	now := lifecycle.currentTime()
	var authority *verifiedRuntimeEvidenceAuthority
	if !lifecycle.allowLegacyTestClaims {
		if lifecycle.loadAuthority == nil {
			return nil, errors.New("match job claim authority is unavailable")
		}
		loadedAuthority, err := lifecycle.loadAuthority()
		if err != nil || loadedAuthority == nil {
			return nil, errors.New("match job claim authority is unavailable")
		}
		authority = loadedAuthority
	}
	lease := input.Lease
	if lease <= 0 {
		lease = defaultMatchJobLease
	}
	leaseToken, err := lifecycle.newLeaseToken()
	if err != nil {
		return nil, fmt.Errorf("create lease token: %w", err)
	}
	leaseExpiresAt := now.Add(lease)

	tx, err := lifecycle.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return nil, err
	}
	defer rollbackTx(ctx, tx)
	if !lifecycle.allowLegacyTestClaims {
		if err := lockAuthorityPublicationTransitions(ctx, tx); err != nil {
			return nil, err
		}
	}

	var row struct {
		id            string
		matchID       string
		attempts      int
		integrityJSON []byte
	}
	query := claimNextMatchJobSQL
	args := []any{now}
	if lifecycle.allowLegacyTestClaims {
		query = claimNextLegacyMatchJobSQL
	}
	if input.MatchIDs != nil {
		query = claimNextMatchJobWithAllowlistSQL
		if lifecycle.allowLegacyTestClaims {
			query = claimNextLegacyMatchJobWithAllowlistSQL
		}
		args = []any{now, input.MatchIDs}
	}
	if err := tx.QueryRow(ctx, query, args...).Scan(&row.id, &row.matchID, &row.attempts, &row.integrityJSON); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	var integrity *claimedMatchIntegrityIdentity
	if !lifecycle.allowLegacyTestClaims {
		var decoded claimedMatchIntegrityIdentity
		if err := decodeStrictJSON(row.integrityJSON, &decoded); err != nil || validateClaimedMatchIntegrity(authority, &decoded, now) != nil {
			return nil, nil
		}
		integrity = &decoded
	}

	attemptNumber := row.attempts + 1
	if _, err := tx.Exec(ctx, `
		update match_jobs
		set status = 'running',
		    worker_id = $1,
		    lease_token = $2,
		    lease_expires_at = $3,
		    attempts = $4,
		    updated_at = now()
		where id = $5
	`, input.WorkerID, leaseToken, leaseExpiresAt, attemptNumber, row.id); err != nil {
		return nil, err
	}
	if _, err := tx.Exec(ctx, "update matches set status = 'running' where id = $1", row.matchID); err != nil {
		return nil, err
	}
	if _, err := tx.Exec(ctx, `
		insert into match_job_attempts (
		  id, job_id, attempt_number, worker_id, status
		)
		values ($1, $2, $3, $4, 'running')
	`, fmt.Sprintf("match-job-attempt:%s:%d", row.id, attemptNumber), row.id, attemptNumber, input.WorkerID); err != nil {
		return nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return &claimedMatchJob{
		JobID:          row.id,
		MatchID:        row.matchID,
		AttemptNumber:  attemptNumber,
		LeaseToken:     leaseToken,
		LeaseExpiresAt: leaseExpiresAt,
		Integrity:      integrity,
	}, nil
}

func validateClaimedMatchIntegrity(authority *verifiedRuntimeEvidenceAuthority, identity *claimedMatchIntegrityIdentity, now time.Time) error {
	if authority == nil || identity == nil || identity.MatchSetID == "" ||
		identity.CompatibilityTupleID != authority.CompatibilityTuple.TupleID ||
		identity.CompatibilityTuple != authority.CompatibilityTuple.Tuple ||
		identity.AuthorityBundleHash != authority.AuthorityBundleHash ||
		identity.PayloadSHA256 != authority.AuthorityBundleHash ||
		identity.EnvelopeSHA256 != authority.EnvelopeSHA256 ||
		identity.RegistryGeneration != authority.RegistryGeneration ||
		identity.PublicationID == "" || identity.InstallReceiptID == "" ||
		!isPrefixedLowerSHA256(identity.SourceManifestHash) || identity.SourceSet == nil ||
		!isLowerSHA256(identity.EvidenceSetHash) || !isLowerSHA256(identity.PairHash) {
		return errors.New("claimed Match integrity identity is unavailable")
	}
	if err := validateClaimedEntrantIntegrity(authority, identity.Bottom, now); err != nil {
		return err
	}
	if err := validateClaimedEntrantIntegrity(authority, identity.Top, now); err != nil {
		return err
	}
	recomputed, err := createGoMatchSetIntegrityIdentity(authority, []goEntrantExecutionEvidence{identity.Bottom, identity.Top})
	if err != nil || recomputed.EvidenceSetHash != identity.EvidenceSetHash {
		return errors.New("claimed Match evidence set does not match authority")
	}
	pair, err := recomputed.pair(identity.Bottom.EntrantKey, identity.Top.EntrantKey, identity.Bottom.StrategyRevisionID, identity.Top.StrategyRevisionID)
	if err != nil || pair.PairHash != identity.PairHash {
		return errors.New("claimed Match ordered evidence pair does not match authority")
	}
	return nil
}

func validateClaimedEntrantIntegrity(authority *verifiedRuntimeEvidenceAuthority, entrant goEntrantExecutionEvidence, now time.Time) error {
	if entrant.EntrantKey == "" || entrant.StrategyRevisionID == "" ||
		entrant.LaneIdentity.SemanticTupleID != authority.CompatibilityTuple.TupleID ||
		entrant.LaneIdentity.SemanticTuple != authority.CompatibilityTuple.Tuple ||
		entrant.SchedulingDecision.RegistryGeneration != authority.RegistryGeneration ||
		entrant.ContainmentCertificateRef.RegistryGeneration != authority.RegistryGeneration {
		return errors.New("claimed Match entrant identity is unavailable")
	}
	evaluatedAt, evaluatedErr := parseCanonicalInstant(entrant.SchedulingDecision.EvaluatedAt)
	freshUntil, freshErr := parseCanonicalInstant(entrant.SchedulingDecision.FreshUntil)
	if evaluatedErr != nil || freshErr != nil || now.Before(evaluatedAt) || now.After(freshUntil) {
		return errors.New("claimed Match entrant evidence is stale")
	}
	containment := runtimeEvidenceCertificateReference{
		Kind: entrant.ContainmentCertificateRef.Kind, CertificateID: entrant.ContainmentCertificateRef.CertificateID,
		CertificateVersion:    entrant.ContainmentCertificateRef.CertificateVersion,
		CertificateRecordHash: "sha256:" + entrant.ContainmentCertificateRef.CertificateRecordHash,
		RegistryGeneration:    entrant.ContainmentCertificateRef.RegistryGeneration,
	}
	var conformance *runtimeEvidenceCertificateReference
	if entrant.ConformanceCertificateRef != nil {
		conformance = &runtimeEvidenceCertificateReference{
			Kind: entrant.ConformanceCertificateRef.Kind, CertificateID: entrant.ConformanceCertificateRef.CertificateID,
			CertificateVersion:    entrant.ConformanceCertificateRef.CertificateVersion,
			CertificateRecordHash: "sha256:" + entrant.ConformanceCertificateRef.CertificateRecordHash,
			RegistryGeneration:    entrant.ConformanceCertificateRef.RegistryGeneration,
		}
	}
	result := classifyExecutableLaneEvidence(executableLaneEvidenceInput{
		Authority:                authority,
		ExpectedLaneIdentityHash: "sha256:" + hashCreationLaneIdentity(entrant.LaneIdentity),
		EvaluationInstant:        now.UTC().Format(canonicalJSONInstantLayout),
		ActiveRegistryGeneration: authority.RegistryGeneration,
		ContainmentCertificate:   &containment,
		ConformanceCertificate:   conformance,
	})
	if result.Status != entrant.SchedulingDecision.Status || result.ReasonCode != entrant.SchedulingDecision.ReasonCode || result.Status == executableLaneEvidenceDisabled {
		return errors.New("claimed Match entrant decision drifted from authority")
	}
	return nil
}

func (lifecycle *matchJobLifecycle) heartbeatMatchJob(ctx context.Context, jobID string, leaseToken string, lease time.Duration) (bool, error) {
	if lifecycle == nil || lifecycle.pool == nil {
		return false, errors.New("match job lifecycle requires a database pool")
	}
	if lease <= 0 {
		lease = defaultMatchJobLease
	}
	leaseExpiresAt := lifecycle.currentTime().Add(lease)
	tag, err := lifecycle.pool.Exec(ctx, `
		update match_jobs
		set lease_expires_at = $1,
		    updated_at = now()
		where id = $2 and lease_token = $3 and status = 'running'
	`, leaseExpiresAt, jobID, leaseToken)
	if err != nil {
		return false, err
	}
	return tag.RowsAffected() > 0, nil
}

func (lifecycle *matchJobLifecycle) recheckClaimedMatchIntegrity(ctx context.Context, claimed *claimedMatchJob) error {
	if lifecycle == nil || lifecycle.pool == nil || lifecycle.loadAuthority == nil || claimed == nil || claimed.Integrity == nil {
		return errors.New("claimed Match integrity recheck is unavailable")
	}
	authority, err := lifecycle.loadAuthority()
	if err != nil || authority == nil {
		return errors.New("claimed Match integrity recheck is unavailable")
	}
	// READ COMMITTED is deliberate: if a terminal writer acquired the head
	// first, the post-lock evidence query must see that writer's commit.
	tx, err := lifecycle.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return err
	}
	defer rollbackTx(ctx, tx)
	if err := lockAuthorityPublicationTransitions(ctx, tx); err != nil {
		return err
	}
	var serialized []byte
	if err := tx.QueryRow(ctx, recheckClaimedMatchIntegritySQL, claimed.JobID, claimed.LeaseToken).Scan(&serialized); err != nil {
		return errors.New("claimed Match integrity changed in flight")
	}
	var current claimedMatchIntegrityIdentity
	if err := decodeStrictJSON(serialized, &current); err != nil || validateClaimedMatchIntegrity(authority, &current, lifecycle.currentTime()) != nil || !jsonValuesEqual(current, *claimed.Integrity) {
		return errors.New("claimed Match integrity changed in flight")
	}
	receipt, err := (&LiveServer{}).lockInstalledAuthorityReceipt(ctx, tx, authority, lifecycle.currentTime())
	if err != nil || receipt.PublicationID != current.PublicationID || receipt.ReceiptID != current.InstallReceiptID ||
		receipt.PayloadSHA256 != current.PayloadSHA256 || receipt.EnvelopeSHA256 != current.EnvelopeSHA256 ||
		receipt.SourceManifestHash != current.SourceManifestHash || !jsonValuesEqual(receipt.SourceSet, current.SourceSet) {
		return errors.New("claimed Match receipt changed in flight")
	}
	return tx.Commit(ctx)
}

func (lifecycle *matchJobLifecycle) recordAttemptFailure(ctx context.Context, input recordAttemptFailureInput) (string, error) {
	if lifecycle == nil || lifecycle.pool == nil {
		return "", errors.New("match job lifecycle requires a database pool")
	}
	sanitizedDetails := sanitizeMatchJobFailureDetails(input.Details)
	details, err := json.Marshal(sanitizedDetails)
	if err != nil {
		return "", fmt.Errorf("encode failure details: %w", err)
	}

	tx, err := lifecycle.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return "", err
	}
	defer rollbackTx(ctx, tx)

	var row struct {
		attempts    int
		maxAttempts int
		matchID     string
	}
	if err := tx.QueryRow(ctx, `
		select attempts, max_attempts, match_id
		from match_jobs
		where id = $1 and lease_token = $2 and status = 'running'
		for update
	`, input.JobID, input.LeaseToken).Scan(&row.attempts, &row.maxAttempts, &row.matchID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", errors.New("cannot record failure for unclaimed job")
		}
		return "", err
	}

	exhausted := shouldExhaustMatchJobRetries(row.attempts, row.maxAttempts, input.Retryable)
	failureCategory := input.Category
	if failureCategory == "" {
		failureCategory = classifyMatchFailure(input.ErrorClass, input.Retryable, sanitizeMatchJobFailureDetails(input.Details)).Category
	}
	if _, err := tx.Exec(ctx, `
		update match_job_attempts
		set finished_at = now(),
		    status = 'failed_system',
		    error_class = $1,
		    error_message = $2,
		    retryable = $3,
		    details = $4
		where job_id = $5 and attempt_number = $6
	`, input.ErrorClass, input.ErrorMessage, input.Retryable, details, input.JobID, row.attempts); err != nil {
		return "", err
	}

	status := "retry_queued"
	if exhausted {
		if _, err := tx.Exec(ctx, `
			update match_jobs
			set status = 'failed_system',
			    updated_at = now()
			where id = $1
		`, input.JobID); err != nil {
			return "", err
		}
		if _, err := tx.Exec(ctx, `
			update matches
			set status = 'failed_system',
			    failure_category = $1,
			    failure_message = $2,
			    completed_at = now()
			where id = $3
		`, failureCategory, input.ErrorMessage, row.matchID); err != nil {
			return "", err
		}
		if err := refreshMatchSetsForMatchTx(ctx, tx, row.matchID); err != nil {
			return "", err
		}
		if err := writeMatchExecutionQuarantineTx(ctx, tx, input, row.attempts, row.maxAttempts, row.matchID, failureCategory, sanitizedDetails); err != nil {
			return "", err
		}
		status = "failed_system"
	} else if _, err := tx.Exec(ctx, `
		update match_jobs
		set status = 'queued',
		    worker_id = null,
		    lease_token = null,
		    lease_expires_at = null,
		    updated_at = now()
		where id = $1
	`, input.JobID); err != nil {
		return "", err
	}

	if err := tx.Commit(ctx); err != nil {
		return "", err
	}
	return status, nil
}

func (lifecycle *matchJobLifecycle) currentTime() time.Time {
	if lifecycle.now == nil {
		return time.Now()
	}
	return lifecycle.now()
}

func shouldExhaustMatchJobRetries(attempts int, maxAttempts int, retryable bool) bool {
	return !retryable || attempts >= maxAttempts
}

func rollbackTx(ctx context.Context, tx pgx.Tx) {
	_ = tx.Rollback(ctx)
}

func sanitizeMatchJobFailureDetails(details map[string]any) map[string]any {
	if details == nil {
		return map[string]any{}
	}
	allowedScalars := map[string]struct{}{
		"workerId":                           {},
		"matchId":                            {},
		"strategyExecutionAdapterId":         {},
		"strategyExecutionAdapterBoundary":   {},
		"strategyExecutionSystemFailureCode": {},
		"cause":                              {},
		"signal":                             {},
		"status":                             {},
		"streamName":                         {},
		"actualBytes":                        {},
		"capBytes":                           {},
		"reason":                             {},
		"slot":                               {},
		"languageId":                         {},
	}
	safe := map[string]any{}
	for key, value := range details {
		if key == "strategyExecutionSystemFailureDetails" {
			if nested, ok := value.(map[string]any); ok {
				nestedSafe := map[string]any{}
				for nestedKey, nestedValue := range nested {
					if _, allowed := allowedScalars[nestedKey]; allowed && isJSONScalar(nestedValue) {
						nestedSafe[nestedKey] = nestedValue
					}
				}
				if len(nestedSafe) > 0 {
					safe[key] = nestedSafe
				}
			}
			continue
		}
		if _, allowed := allowedScalars[key]; allowed && isJSONScalar(value) {
			safe[key] = value
		}
	}
	return safe
}

func isJSONScalar(value any) bool {
	switch value.(type) {
	case nil, string, bool, float64, float32, int, int8, int16, int32, int64, uint, uint8, uint16, uint32, uint64:
		return true
	default:
		return false
	}
}
