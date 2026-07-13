import { randomUUID } from "node:crypto"
import type {
  JsonValue,
  MatchId,
  RuntimeEntrantExecutionEvidence,
  RuntimeExecutionResolvedEvidenceSnapshot,
} from "@cowards/spec"
import type { Pool } from "pg"
import { withTransaction } from "./db.js"

export interface ClaimMatchJobInput {
  workerId: string
  matchIds?: readonly MatchId[] | undefined
  leaseMs?: number
  now?: Date
}

export interface ClaimedMatchJob {
  jobId: string
  matchId: MatchId
  attemptNumber: number
  leaseToken: string
  leaseExpiresAt: Date
  evidenceSnapshot: RuntimeExecutionResolvedEvidenceSnapshot
}

export const DEFAULT_LEASE_MS = 30_000

export const CLAIM_NEXT_MATCH_JOB_SQL = `
  with current_authority as materialized (
    select publication.*
      from runtime_evidence_authority_publications publication
      join runtime_evidence_authority_publication_head authority_head
        on authority_head.singleton = true
       and publication.generation < authority_head.next_generation
      join lateral (
        select event.receipt
          from runtime_evidence_authority_publication_events event
         where event.publication_id = publication.id
           and event.event_kind = 'installed'
           and event.reason_code is null
           and event.envelope_sha256 = publication.envelope_sha256
           and event.receipt->>'schemaVersion' =
             'v1.37-runtime-evidence-authority-install-receipt-v1'
           and event.receipt->>'generation' = publication.generation::text
           and event.receipt->>'payloadSha256' = publication.payload_sha256
           and event.receipt->>'envelopeSha256' = publication.envelope_sha256
           and event.receipt->>'sourceManifestHash' = publication.source_manifest_hash
           and event.receipt->'sourceIds'->'attestationIds' = publication.attestation_ids
           and event.receipt->'sourceIds'->'certificateIds' = publication.certificate_ids
           and event.receipt->'sourceIds'->'revocationIds' = publication.revocation_ids
           and event.receipt->'sourceIds'->'supersessionIds' = publication.supersession_ids
           and event.receipt->'sourceIds'->'laneControlIds' = publication.lane_control_ids
         order by event.occurred_at desc, event.id desc
         limit 1
      ) installed on true
     where publication.issued_at <= $1
       and publication.valid_from <= $1
       and publication.valid_until >= $1
       and (select count(*)
              from runtime_evidence_authority_publication_sources source
             where source.publication_id = publication.id) =
           jsonb_array_length(publication.attestation_ids) +
           jsonb_array_length(publication.certificate_ids) +
           jsonb_array_length(publication.revocation_ids) +
           jsonb_array_length(publication.supersession_ids) +
           jsonb_array_length(publication.lane_control_ids)
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
            and (
              case source.source_type
                when 'attestation' then 'sha256:' || attestation.attestation_sha256
                when 'certificate' then 'sha256:' || certificate.certificate_record_hash
                when 'revocation' then 'sha256:' || revocation.envelope_hash
                when 'supersession' then 'sha256:' || supersession.envelope_hash
                when 'lane-control' then 'sha256:' || lane_control.envelope_hash
              end is distinct from source.source_record_hash
              or case source.source_type
                when 'attestation' then not publication.attestation_ids ? source.source_id
                when 'certificate' then not publication.certificate_ids ? source.source_id
                when 'revocation' then not publication.revocation_ids ? source.source_id
                when 'supersession' then not publication.supersession_ids ? source.source_id
                when 'lane-control' then not publication.lane_control_ids ? source.source_id
              end
            )
       )
     order by publication.generation desc
     limit 1
  )
  select job.id, job.match_id, job.attempts,
         match_set.compatibility_tuple_id,
         match_set.compatibility_rules_version,
         match_set.compatibility_engine_version,
         match_set.compatibility_runtime_abi_version,
         match_set.compatibility_chronicle_version,
         match_set.compatibility_arena_catalog_version,
         match_set.compatibility_set_policy_version,
         match_set.authority_bundle_hash,
         match_set.authority_registry_generation,
         job.bottom_execution_evidence,
         job.top_execution_evidence
    from match_jobs job
    join matches match on match.id = job.match_id
    join match_sets match_set
      on match_set.id = job.integrity_match_set_id
     and match.integrity_match_set_id = match_set.id
    join current_authority authority
      on match_set.authority_registry_generation = authority.generation::text
     and match_set.authority_bundle_hash =
         substring(authority.payload_sha256 from 8)
     and match_set.compatibility_tuple_id =
         authority.semantic_tuple_manifest_hash
    join match_set_execution_entrants bottom_entrant
      on bottom_entrant.match_set_id = match_set.id
     and bottom_entrant.entrant_key = job.bottom_execution_entrant_key
    join match_set_execution_entrants top_entrant
      on top_entrant.match_set_id = match_set.id
     and top_entrant.entrant_key = job.top_execution_entrant_key
    join runtime_evidence_certificates bottom_containment
      on bottom_containment.id = bottom_entrant.containment_certificate_id
     and bottom_containment.certificate_record_hash = bottom_entrant.containment_certificate_hash
     and bottom_containment.registry_generation = authority.generation::text
     and bottom_containment.lane_identity_hash = bottom_entrant.lane_identity_hash
     and bottom_containment.certificate_kind = 'containment'
     and bottom_containment.certificate_status = 'passed'
    join runtime_evidence_certificates top_containment
      on top_containment.id = top_entrant.containment_certificate_id
     and top_containment.certificate_record_hash = top_entrant.containment_certificate_hash
     and top_containment.registry_generation = authority.generation::text
     and top_containment.lane_identity_hash = top_entrant.lane_identity_hash
     and top_containment.certificate_kind = 'containment'
     and top_containment.certificate_status = 'passed'
    left join runtime_evidence_certificates bottom_conformance
      on bottom_conformance.id = bottom_entrant.conformance_certificate_id
     and bottom_conformance.certificate_record_hash = bottom_entrant.conformance_certificate_hash
     and bottom_conformance.registry_generation = authority.generation::text
     and bottom_conformance.lane_identity_hash = bottom_entrant.lane_identity_hash
     and bottom_conformance.certificate_kind = 'conformance'
     and bottom_conformance.certificate_status = 'passed'
    left join runtime_evidence_certificates top_conformance
      on top_conformance.id = top_entrant.conformance_certificate_id
     and top_conformance.certificate_record_hash = top_entrant.conformance_certificate_hash
     and top_conformance.registry_generation = authority.generation::text
     and top_conformance.lane_identity_hash = top_entrant.lane_identity_hash
     and top_conformance.certificate_kind = 'conformance'
     and top_conformance.certificate_status = 'passed'
   where ($2::text[] is null or job.match_id = any($2::text[]))
     and (
       (job.status = 'queued' and job.run_after <= $1)
       or (job.status = 'running' and job.lease_expires_at < $1)
     )
     and job.integrity_match_set_id = match.integrity_match_set_id
     and job.bottom_execution_entrant_key = match.bottom_execution_entrant_key
     and job.top_execution_entrant_key = match.top_execution_entrant_key
     and job.bottom_execution_evidence = match.bottom_execution_evidence
     and job.top_execution_evidence = match.top_execution_evidence
     and job.execution_evidence_pair_hash = match.execution_evidence_pair_hash
     and job.bottom_execution_evidence = bottom_entrant.execution_snapshot
     and job.top_execution_evidence = top_entrant.execution_snapshot
     and bottom_entrant.authority_bundle_hash = match_set.authority_bundle_hash
     and top_entrant.authority_bundle_hash = match_set.authority_bundle_hash
     and bottom_entrant.authority_registry_generation = authority.generation::text
     and top_entrant.authority_registry_generation = authority.generation::text
     and bottom_entrant.scheduling_status <> 'disabled'
     and top_entrant.scheduling_status <> 'disabled'
     and (
       (bottom_entrant.scheduling_status = 'counted'
        and bottom_entrant.conformance_certificate_id is not null
        and bottom_conformance.id is not null)
       or
       (bottom_entrant.scheduling_status = 'exhibition_only'
        and bottom_entrant.conformance_certificate_kind is null
        and bottom_entrant.conformance_certificate_id is null
        and bottom_entrant.conformance_certificate_version is null
        and bottom_entrant.conformance_certificate_hash is null)
     )
     and (
       (top_entrant.scheduling_status = 'counted'
        and top_entrant.conformance_certificate_id is not null
        and top_conformance.id is not null)
       or
       (top_entrant.scheduling_status = 'exhibition_only'
        and top_entrant.conformance_certificate_kind is null
        and top_entrant.conformance_certificate_id is null
        and top_entrant.conformance_certificate_version is null
        and top_entrant.conformance_certificate_hash is null)
     )
     and bottom_containment.issued_at <= $1
     and bottom_containment.fresh_until >= $1
     and top_containment.issued_at <= $1
     and top_containment.fresh_until >= $1
     and (
       bottom_entrant.scheduling_status <> 'counted'
       or (bottom_conformance.issued_at <= $1 and bottom_conformance.fresh_until >= $1)
     )
     and (
       top_entrant.scheduling_status <> 'counted'
       or (top_conformance.issued_at <= $1 and top_conformance.fresh_until >= $1)
     )
     and exists (
       select 1 from runtime_evidence_authority_publication_sources source
        where source.publication_id = authority.id
          and source.source_type = 'certificate'
          and source.source_id = bottom_containment.id
          and source.source_record_hash = 'sha256:' || bottom_containment.certificate_record_hash
     )
     and exists (
       select 1 from runtime_evidence_authority_publication_sources source
        where source.publication_id = authority.id
          and source.source_type = 'certificate'
          and source.source_id = top_containment.id
          and source.source_record_hash = 'sha256:' || top_containment.certificate_record_hash
     )
     and (
       bottom_entrant.scheduling_status <> 'counted'
       or exists (
         select 1 from runtime_evidence_authority_publication_sources source
          where source.publication_id = authority.id
            and source.source_type = 'certificate'
            and source.source_id = bottom_conformance.id
            and source.source_record_hash = 'sha256:' || bottom_conformance.certificate_record_hash
       )
     )
     and (
       top_entrant.scheduling_status <> 'counted'
       or exists (
         select 1 from runtime_evidence_authority_publication_sources source
          where source.publication_id = authority.id
            and source.source_type = 'certificate'
            and source.source_id = top_conformance.id
            and source.source_record_hash = 'sha256:' || top_conformance.certificate_record_hash
       )
     )
     and not exists (
       select 1
         from runtime_evidence_certificate_revocations revocation
         join runtime_evidence_authority_publication_sources source
           on source.publication_id = authority.id
          and source.source_type = 'revocation'
          and source.source_id = revocation.id
        where (revocation.target_certificate_id, revocation.target_certificate_record_hash)
          in ((bottom_containment.id, bottom_containment.certificate_record_hash),
              (top_containment.id, top_containment.certificate_record_hash),
              (bottom_conformance.id, bottom_conformance.certificate_record_hash),
              (top_conformance.id, top_conformance.certificate_record_hash))
     )
     and not exists (
       select 1
         from runtime_evidence_certificate_supersessions supersession
         join runtime_evidence_authority_publication_sources source
           on source.publication_id = authority.id
          and source.source_type = 'supersession'
          and source.source_id = supersession.id
        where supersession.target_certificate_id in (
          bottom_containment.id, top_containment.id,
          bottom_conformance.id, top_conformance.id
        )
     )
     and not exists (
       select 1
         from runtime_evidence_lane_controls disabled
         join runtime_evidence_authority_publication_sources source
           on source.publication_id = authority.id
          and source.source_type = 'lane-control'
          and source.source_id = disabled.id
        where disabled.action = 'disable'
          and disabled.lane_identity_hash in (
            bottom_entrant.lane_identity_hash,
            top_entrant.lane_identity_hash
          )
          and not exists (
            select 1
              from runtime_evidence_lane_controls enabled
              join runtime_evidence_authority_publication_sources enabled_source
                on enabled_source.publication_id = authority.id
               and enabled_source.source_type = 'lane-control'
               and enabled_source.source_id = enabled.id
             where enabled.action = 'enable'
               and enabled.compensates_control_id = disabled.id
          )
     )
   order by job.run_after asc, job.created_at asc
   for update of job skip locked
   limit 1
`

export const createLeaseToken = (): string => randomUUID()

export const shouldExhaustRetries = (input: {
  attempts: number
  maxAttempts: number
  retryable: boolean
}): boolean => !input.retryable || input.attempts >= input.maxAttempts

export const claimNextMatchJob = async (
  pool: Pool,
  input: ClaimMatchJobInput,
): Promise<ClaimedMatchJob | null> => {
  const now = input.now ?? new Date()
  const leaseMs = input.leaseMs ?? DEFAULT_LEASE_MS
  const leaseToken = createLeaseToken()
  const leaseExpiresAt = new Date(now.getTime() + leaseMs)

  return withTransaction(pool, async (client) => {
    await client.query(
      "lock table runtime_evidence_authority_publication_events in share mode",
    )
    await client.query(
      "select next_generation from runtime_evidence_authority_publication_head where singleton = true for share",
    )
    const claim = await client.query<{
      id: string
      match_id: MatchId
      attempts: number
      compatibility_tuple_id: string
      compatibility_rules_version: string
      compatibility_engine_version: string
      compatibility_runtime_abi_version: string
      compatibility_chronicle_version: string
      compatibility_arena_catalog_version: string
      compatibility_set_policy_version: string
      authority_bundle_hash: string
      authority_registry_generation: string
      bottom_execution_evidence: RuntimeEntrantExecutionEvidence
      top_execution_evidence: RuntimeEntrantExecutionEvidence
    }>(CLAIM_NEXT_MATCH_JOB_SQL, [now, input.matchIds ?? null])
    const row = claim.rows[0]
    if (!row) {
      return null
    }
    const attemptNumber = row.attempts + 1
    await client.query(
      `
        update match_jobs
        set status = 'running',
            worker_id = $1,
            lease_token = $2,
            lease_expires_at = $3,
            attempts = $4,
            updated_at = now()
        where id = $5
      `,
      [input.workerId, leaseToken, leaseExpiresAt, attemptNumber, row.id],
    )
    await client.query("update matches set status = 'running' where id = $1", [
      row.match_id,
    ])
    await client.query(
      `
        insert into match_job_attempts (
          id, job_id, attempt_number, worker_id, status
        )
        values ($1, $2, $3, $4, 'running')
      `,
      [
        `match-job-attempt:${row.id}:${attemptNumber}`,
        row.id,
        attemptNumber,
        input.workerId,
      ],
    )
    return {
      jobId: row.id,
      matchId: row.match_id,
      attemptNumber,
      leaseToken,
      leaseExpiresAt,
      evidenceSnapshot: {
        compatibility: {
          tupleId: row.compatibility_tuple_id,
          tuple: {
            rules: row.compatibility_rules_version,
            engine: row.compatibility_engine_version,
            runtimeAbi: row.compatibility_runtime_abi_version,
            chronicle: row.compatibility_chronicle_version,
            arenaCatalog: row.compatibility_arena_catalog_version,
            setPolicy: row.compatibility_set_policy_version,
          },
        },
        authorityBundleHash: row.authority_bundle_hash,
        registryGeneration: row.authority_registry_generation,
        entrants: {
          bottom: row.bottom_execution_evidence,
          top: row.top_execution_evidence,
        },
      },
    }
  })
}

export const heartbeatMatchJob = async (
  pool: Pool,
  input: { jobId: string; leaseToken: string; leaseMs?: number },
): Promise<boolean> => {
  const leaseExpiresAt = new Date(
    Date.now() + (input.leaseMs ?? DEFAULT_LEASE_MS),
  )
  const result = await pool.query(
    `
      update match_jobs
      set lease_expires_at = $1,
          updated_at = now()
      where id = $2 and lease_token = $3 and status = 'running'
    `,
    [leaseExpiresAt, input.jobId, input.leaseToken],
  )
  return (result.rowCount ?? 0) > 0
}

export const recordAttemptFailure = async (
  pool: Pool,
  input: {
    jobId: string
    leaseToken: string
    errorClass: string
    errorMessage: string
    retryable: boolean
    details?: JsonValue
  },
): Promise<"retry_queued" | "failed_system"> =>
  withTransaction(pool, async (client) => {
    const job = await client.query<{
      attempts: number
      max_attempts: number
      match_id: MatchId
    }>(
      `
        select attempts, max_attempts, match_id
        from match_jobs
        where id = $1 and lease_token = $2
        for update
      `,
      [input.jobId, input.leaseToken],
    )
    const row = job.rows[0]
    if (!row) {
      throw new Error("Cannot record failure for unclaimed job")
    }
    const exhausted = shouldExhaustRetries({
      attempts: row.attempts,
      maxAttempts: row.max_attempts,
      retryable: input.retryable,
    })
    await client.query(
      `
        update match_job_attempts
        set finished_at = now(),
            status = 'failed_system',
            error_class = $1,
            error_message = $2,
            retryable = $3,
            details = $4
        where job_id = $5 and attempt_number = $6
      `,
      [
        input.errorClass,
        input.errorMessage,
        input.retryable,
        input.details ?? {},
        input.jobId,
        row.attempts,
      ],
    )
    if (exhausted) {
      await client.query(
        `
          update match_jobs
          set status = 'failed_system',
              updated_at = now()
          where id = $1
        `,
        [input.jobId],
      )
      await client.query(
        `
          update matches
          set status = 'failed_system',
              failure_category = 'SYSTEM',
              failure_message = $1,
              completed_at = now()
          where id = $2
        `,
        [input.errorMessage, row.match_id],
      )
      return "failed_system"
    }
    await client.query(
      `
        update match_jobs
        set status = 'queued',
            worker_id = null,
            lease_token = null,
            lease_expires_at = null,
            updated_at = now()
        where id = $1
      `,
      [input.jobId],
    )
    return "retry_queued"
  })
