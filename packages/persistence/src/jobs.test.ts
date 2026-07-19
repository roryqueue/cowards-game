import { createHash, randomUUID } from "node:crypto"
import {
  CANONICAL_COMPATIBILITY_TUPLES,
  CURRENT_SEMANTIC_AUTHORITY_GENERATED,
  type ExecutableLaneIdentity,
  type RuntimeEntrantExecutionEvidence,
} from "@cowards/spec"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { Pool } from "pg"
import { migrate } from "./migrations.js"
import { hashEntrantLaneIdentity } from "./integrity-evidence.js"
import { createMatchSetService } from "./matchset-service.js"
import {
  CLAIM_NEXT_MATCH_JOB_SQL,
  DEFAULT_LEASE_MS,
  claimNextMatchJob,
  shouldExhaustRetries,
} from "./jobs.js"
import {
  TEST_CURRENT_SEMANTIC_AUTHORITY_SELECTION,
  TEST_CURRENT_SEMANTIC_AUTHORITY_SELECTION_ROOT,
} from "./test-current-semantic-authority.js"

describe("job claiming", () => {
  it("uses lease-based skip-locked claiming", () => {
    expect(DEFAULT_LEASE_MS).toBe(30_000)
    expect(CLAIM_NEXT_MATCH_JOB_SQL).toContain("for update of job skip locked")
    expect(CLAIM_NEXT_MATCH_JOB_SQL).toContain("lease_expires_at < $1")
  })

  it("binds candidates to the exact installed authority, ordered evidence, and current per-side certificates", () => {
    expect(CLAIM_NEXT_MATCH_JOB_SQL).toContain(
      "runtime_evidence_authority_installed_head",
    )
    expect(CLAIM_NEXT_MATCH_JOB_SQL).not.toContain("event_kind = 'installed'")
    expect(CLAIM_NEXT_MATCH_JOB_SQL).toContain(
      "runtime_evidence_authority_publication_sources",
    )
    expect(CLAIM_NEXT_MATCH_JOB_SQL).toContain(
      "bottom_execution_evidence = bottom_entrant.execution_snapshot",
    )
    expect(CLAIM_NEXT_MATCH_JOB_SQL).toContain(
      "top_execution_evidence = top_entrant.execution_snapshot",
    )
    expect(CLAIM_NEXT_MATCH_JOB_SQL).toContain(
      "runtime_evidence_certificate_revocations",
    )
    expect(CLAIM_NEXT_MATCH_JOB_SQL).toContain(
      "runtime_evidence_certificate_supersessions",
    )
    expect(CLAIM_NEXT_MATCH_JOB_SQL).toContain("runtime_evidence_lane_controls")
    expect(CLAIM_NEXT_MATCH_JOB_SQL).toContain(
      "left join runtime_evidence_certificates bottom_conformance",
    )
    expect(CLAIM_NEXT_MATCH_JOB_SQL).toContain(
      "bottom_entrant.conformance_certificate_id is null",
    )
    expect(CLAIM_NEXT_MATCH_JOB_SQL).toContain(
      "job.semantic_authority_selection_root = match.semantic_authority_selection_root",
    )
    expect(CLAIM_NEXT_MATCH_JOB_SQL).toContain(
      "match.semantic_authority_selection_root = match_set.semantic_authority_selection_root",
    )
  })

  it("returns null without lifecycle mutation when no exact current candidate exists", async () => {
    const calls: string[] = []
    const client = {
      async query(sql: string) {
        calls.push(sql.trim())
        return { rows: [] }
      },
      release() {},
    }
    const pool = {
      async connect() {
        return client
      },
    } as unknown as Pool

    await expect(
      claimNextMatchJob(pool, {
        workerId: "worker:exact",
        now: new Date("2026-07-13T00:00:00.000Z"),
      }),
    ).resolves.toBeNull()

    expect(calls.some((sql) => /^update\s/iu.test(sql))).toBe(false)
    expect(calls.some((sql) => /match_job_attempts/iu.test(sql))).toBe(false)
    expect(calls).toContain("commit")
  })

  it("returns the locked semantic tuple and ordered entrant evidence on a valid claim", async () => {
    const bottom = {
      entrantKey: "bottom",
      strategyRevisionId: "revision:bottom",
    }
    const top = { entrantKey: "top", strategyRevisionId: "revision:top" }
    const calls: string[] = []
    const client = {
      async query(sql: string) {
        calls.push(sql)
        if (sql.includes("with current_authority")) {
          return {
            rows: [
              {
                id: "job:exact",
                match_id: "match:exact",
                attempts: 0,
                compatibility_tuple_id: `sha256:${"a".repeat(64)}`,
                compatibility_rules_version: "rules-v1",
                compatibility_engine_version: "engine-v1",
                compatibility_runtime_abi_version: "abi-v1",
                compatibility_chronicle_version: "chronicle-v1",
                compatibility_arena_catalog_version: "arenas-v1",
                compatibility_set_policy_version: "set-v1",
                authority_bundle_hash: "b".repeat(64),
                authority_registry_generation: "7",
                bottom_execution_evidence: bottom,
                top_execution_evidence: top,
                semantic_authority_selection:
                  TEST_CURRENT_SEMANTIC_AUTHORITY_SELECTION,
                semantic_authority_selection_root:
                  TEST_CURRENT_SEMANTIC_AUTHORITY_SELECTION_ROOT,
              },
            ],
          }
        }
        return { rows: [] }
      },
      release() {},
    }
    const pool = {
      async connect() {
        return client
      },
    } as unknown as Pool

    const claimed = await claimNextMatchJob(pool, {
      workerId: "worker:exact",
      now: new Date("2026-07-13T00:00:00.000Z"),
    })
    expect(claimed?.evidenceSnapshot).toEqual({
      compatibility: {
        tupleId: `sha256:${"a".repeat(64)}`,
        tuple: {
          rules: "rules-v1",
          engine: "engine-v1",
          runtimeAbi: "abi-v1",
          chronicle: "chronicle-v1",
          arenaCatalog: "arenas-v1",
          setPolicy: "set-v1",
        },
      },
      authorityBundleHash: "b".repeat(64),
      registryGeneration: "7",
      entrants: { bottom, top },
    })
    expect(claimed?.semanticAuthority).toEqual({
      selection: TEST_CURRENT_SEMANTIC_AUTHORITY_SELECTION,
      selectionRoot: TEST_CURRENT_SEMANTIC_AUTHORITY_SELECTION_ROOT,
      runtimeRequestSelection: CURRENT_SEMANTIC_AUTHORITY_GENERATED.selection,
    })
    expect(
      calls.some((sql) => sql.includes("semantic_authority_selection_head")),
    ).toBe(false)
  })

  it("exhausts retries at the fixed system failure limit", () => {
    expect(
      shouldExhaustRetries({
        attempts: 2,
        maxAttempts: 3,
        retryable: true,
      }),
    ).toBe(false)
    expect(
      shouldExhaustRetries({
        attempts: 3,
        maxAttempts: 3,
        retryable: true,
      }),
    ).toBe(true)
    expect(
      shouldExhaustRetries({
        attempts: 1,
        maxAttempts: 3,
        retryable: false,
      }),
    ).toBe(true)
  })
})

const databaseUrl = process.env.DATABASE_URL
const describePostgres = databaseUrl ? describe : describe.skip

describePostgres("PostgreSQL integrity identity before claim", () => {
  let admin: Pool
  let pool: Pool
  const schema = `jobs_${randomUUID().replaceAll("-", "")}`

  beforeAll(async () => {
    admin = new Pool({ connectionString: databaseUrl! })
    await admin.query(`create schema ${schema}`)
    pool = new Pool({
      connectionString: databaseUrl!,
      options: `-c search_path=${schema}`,
      max: 1,
    })
    await migrate(pool)
  })

  afterAll(async () => {
    await pool.end()
    await admin.query(`drop schema ${schema} cascade`)
    await admin.end()
  })

  it("leaves a queued job and Match byte-for-byte lifecycle-equivalent when exact authority is absent", async () => {
    const suffix = randomUUID()
    const userId = `user:${suffix}`
    const strategyId = `strategy:${suffix}`
    const bottomRevisionId = `revision:${suffix}:bottom`
    const topRevisionId = `revision:${suffix}:top`
    const arenaId = `arena:${suffix}`
    const matchId = `match:${suffix}`
    const jobId = `match-job:${suffix}`
    await pool.query(
      "insert into users (id, display_name) values ($1, 'Job proof')",
      [userId],
    )
    await pool.query(
      "insert into strategies (id, owner_user_id, name) values ($1, $2, 'Job proof')",
      [strategyId, userId],
    )
    for (const revisionId of [bottomRevisionId, topRevisionId]) {
      await pool.query(
        `insert into strategy_revisions
          (id, strategy_id, source, source_hash, source_bytes, runtime,
           engine_compatibility, validation)
         values ($1, $2, 'return', $3, 6, '{}'::jsonb, '{}'::jsonb,
                 '{"valid":true}'::jsonb)`,
        [revisionId, strategyId, "a".repeat(64)],
      )
    }
    await pool.query(
      "insert into arena_variants (id, name, config) values ($1, 'Job proof', '{}'::jsonb)",
      [arenaId],
    )
    await pool.query(
      `insert into matches
        (id, bottom_strategy_revision_id, top_strategy_revision_id,
         arena_variant_id, seed, bottom_player_id, top_player_id)
       values ($1,$2,$3,$4,'seed','player:bottom','player:top')`,
      [matchId, bottomRevisionId, topRevisionId, arenaId],
    )
    await pool.query("insert into match_jobs (id, match_id) values ($1, $2)", [
      jobId,
      matchId,
    ])
    const before = await pool.query(
      `select j.status, j.attempts, j.worker_id, j.lease_token,
              j.lease_expires_at, m.status as match_status,
              (select count(*)::integer from match_job_attempts a
                where a.job_id = j.id) as attempt_rows
         from match_jobs j join matches m on m.id = j.match_id
        where j.id = $1`,
      [jobId],
    )

    await expect(
      claimNextMatchJob(pool, {
        workerId: "worker:postgres-proof",
        matchIds: [matchId],
        now: new Date("2026-07-13T00:00:00.000Z"),
      }),
    ).resolves.toBeNull()

    const after = await pool.query(
      `select j.status, j.attempts, j.worker_id, j.lease_token,
              j.lease_expires_at, m.status as match_status,
              (select count(*)::integer from match_job_attempts a
                where a.job_id = j.id) as attempt_rows
         from match_jobs j join matches m on m.id = j.match_id
        where j.id = $1`,
      [jobId],
    )
    expect(after.rows[0]).toEqual(before.rows[0])
  })

  it("creates and claims containment-only exhibition entrants with null conformance identity", async () => {
    const suffix = randomUUID()
    const now = new Date()
    const tuple = CANONICAL_COMPATIBILITY_TUPLES[0]!
    const hash = (value: string): string =>
      createHash("sha256").update(value).digest("hex")
    const namespace = `containment-only:${suffix}`
    const userId = `${namespace}:user`
    const strategyId = `${namespace}:strategy`
    const arenaId = `${namespace}:arena`
    const matchSetId = `${namespace}:match-set`
    const matchId = `${namespace}:match`
    const registryGeneration = "1"
    const authorityBundleHash = hash(`${namespace}:authority`)
    const executionEntrants: Record<string, RuntimeEntrantExecutionEvidence> =
      {}
    const attestationIds: string[] = []
    const certificateIds: string[] = []

    await pool.query(
      "insert into users (id, display_name) values ($1, 'Containment only')",
      [userId],
    )
    await pool.query(
      "insert into strategies (id, owner_user_id, name) values ($1,$2,'Containment only')",
      [strategyId, userId],
    )
    await pool.query(
      "insert into arena_variants (id,name,config) values ($1,'Containment only','{}')",
      [arenaId],
    )
    for (const side of ["bottom", "top"] as const) {
      const revisionId = `${namespace}:revision:${side}`
      const entrantKey = `${namespace}:entrant:${side}`
      const lane: ExecutableLaneIdentity = {
        providerId: `${namespace}:provider`,
        languageId: "typescript",
        runtimeId: "node",
        runtimeVersion: "26",
        toolchainId: "typescript",
        toolchainVersion: "6",
        adapterId: "json",
        adapterVersion: "1",
        policyId: `${namespace}:policy`,
        policyVersion: "1",
        corpusId: `${namespace}:corpus`,
        corpusVersion: "1",
        artifactId: `${namespace}:artifact:${side}`,
        artifactSha256: hash(`${namespace}:artifact:${side}`),
        implementationId: `${namespace}:implementation`,
        buildId: `${namespace}:build:${side}`,
        semanticTupleId: tuple.tupleId,
        semanticTuple: { ...tuple.tuple },
      }
      const laneHash = hashEntrantLaneIdentity(lane)
      const attestationId = `${namespace}:attestation:${side}`
      const certificateId = `${namespace}:certificate:${side}`
      const attestationHash = hash(attestationId)
      const certificateHash = hash(certificateId)
      const graphHash = hash(`${namespace}:graph:${side}`)
      attestationIds.push(attestationId)
      certificateIds.push(certificateId)
      await pool.query(
        `insert into strategy_revisions
          (id,strategy_id,source,source_hash,source_bytes,runtime,
           engine_compatibility,validation)
         values ($1,$2,'return',$3,6,'{}','{}','{"valid":true}')`,
        [revisionId, strategyId, lane.artifactSha256],
      )
      await pool.query(
        `insert into runtime_evidence_verified_attestations
          (id,attestation_sha256,verification_status,certificate_kind,
           producer_id,producer_key_id,trust_domain,schema_version,command_id,
           command_digest,corpus_id,corpus_hash,policy_id,policy_hash,runtime_id,
           runtime_version,toolchain_id,toolchain_version,adapter_id,
           adapter_version,artifact_id,artifact_hash,lane_identity_hash,
           semantic_tuple_id,result_manifest_hash,result_graph_hash,
           original_evidence_hash,derived_certificate_version,
           derived_certificate_record_hash,registry_generation,lane_identity,
           issued_at,valid_until)
         values ($1,$2,'passed','containment','producer','key','fixture','schema',
           'command',$3,$4,$3,$5,$3,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$3,
           $16,$3,'certificate-v1',$17,$18,$19,$20,$21)`,
        [
          attestationId,
          attestationHash,
          hash("evidence"),
          lane.corpusId,
          lane.policyId,
          lane.runtimeId,
          lane.runtimeVersion,
          lane.toolchainId,
          lane.toolchainVersion,
          lane.adapterId,
          lane.adapterVersion,
          lane.artifactId,
          lane.artifactSha256,
          laneHash,
          tuple.tupleId,
          graphHash,
          certificateHash,
          registryGeneration,
          lane,
          new Date(now.getTime() - 60_000),
          new Date(now.getTime() + 3_600_000),
        ],
      )
      await pool.query(
        `insert into runtime_evidence_certificates
          (id,certificate_kind,certificate_version,certificate_record_hash,
           certificate_status,verified_attestation_id,
           verified_attestation_status,producer_id,schema_version,command_id,
           command_digest,corpus_id,corpus_hash,policy_id,policy_hash,
           toolchain_id,toolchain_version,artifact_id,artifact_hash,
           lane_identity_hash,lane_identity,result_graph_hash,
           registry_generation,issued_at,fresh_until)
         values ($1,'containment','certificate-v1',$2,'passed',$3,'passed',
           'producer','schema','command',$4,$5,$4,$6,$4,$7,$8,$9,$10,$11,$12,
           $13,$14,$15,$16)`,
        [
          certificateId,
          certificateHash,
          attestationId,
          hash("evidence"),
          lane.corpusId,
          lane.policyId,
          lane.toolchainId,
          lane.toolchainVersion,
          lane.artifactId,
          lane.artifactSha256,
          laneHash,
          lane,
          graphHash,
          registryGeneration,
          new Date(now.getTime() - 60_000),
          new Date(now.getTime() + 3_600_000),
        ],
      )
      executionEntrants[entrantKey] = {
        entrantKey,
        strategyRevisionId: revisionId,
        laneIdentity: lane,
        containmentCertificateRef: {
          kind: "containment",
          certificateId,
          certificateVersion: "certificate-v1",
          certificateRecordHash: certificateHash,
          registryGeneration,
        },
        schedulingDecision: {
          status: "exhibition_only",
          reasonCode: "CONFORMANCE_MISSING",
          evaluatedAt: now.toISOString(),
          freshUntil: new Date(now.getTime() + 3_600_000).toISOString(),
          registryGeneration,
        },
      }
    }
    attestationIds.sort()
    certificateIds.sort()
    const publicationId = `${namespace}:publication`
    const sourceManifestHash = `sha256:${hash(`${namespace}:sources`)}`
    const envelopeHash = `sha256:${hash(`${namespace}:envelope`)}`
    await pool.query(
      `insert into runtime_evidence_authority_publications
        (id,generation,semantic_tuple_manifest_hash,source_manifest_hash,
         payload_sha256,envelope_sha256,signer_key_id,trust_domain,issued_at,
         valid_from,valid_until,payload_bytes,envelope_bytes,attestation_ids,
         certificate_ids,revocation_ids,supersession_ids,lane_control_ids)
       values ($1,1,$2,$3,$4,$5,'key','production',$6,$6,$7,'payload','envelope',
         $8,$9,'[]','[]','[]')`,
      [
        publicationId,
        tuple.tupleId,
        sourceManifestHash,
        `sha256:${authorityBundleHash}`,
        envelopeHash,
        new Date(now.getTime() - 60_000),
        new Date(now.getTime() + 3_600_000),
        JSON.stringify(attestationIds),
        JSON.stringify(certificateIds),
      ],
    )
    for (const [kind, ids] of [
      ["attestation", attestationIds],
      ["certificate", certificateIds],
    ] as const) {
      for (const id of ids) {
        const recordHash = kind === "attestation" ? hash(id) : hash(id)
        await pool.query(
          `insert into runtime_evidence_authority_publication_sources
            (publication_id,source_type,source_id,source_record_hash,
             attestation_id,certificate_id)
           values ($1,$2,$3,$4,$5,$6)`,
          [
            publicationId,
            kind,
            id,
            `sha256:${recordHash}`,
            kind === "attestation" ? id : null,
            kind === "certificate" ? id : null,
          ],
        )
      }
    }
    const sourceIds = {
      attestationIds,
      certificateIds,
      revocationIds: [],
      supersessionIds: [],
      laneControlIds: [],
    }
    await pool.query(
      "update runtime_evidence_authority_publication_head set next_generation=2 where singleton=true",
    )
    await pool.query(
      `insert into runtime_evidence_authority_publication_events
        (id,publication_id,event_kind,attempt_id,envelope_sha256,receipt,occurred_at)
       values ($1,$2,'installed','attempt:1',$3,$4,$5)`,
      [
        `${namespace}:installed`,
        publicationId,
        envelopeHash,
        {
          schemaVersion: "v1.37-runtime-evidence-authority-install-receipt-v1",
          generation: registryGeneration,
          payloadSha256: `sha256:${authorityBundleHash}`,
          envelopeSha256: envelopeHash,
          sourceManifestHash,
          sourceIds,
        },
        now,
      ],
    )

    const [bottom, top] = Object.values(executionEntrants)
    await createMatchSetService(pool).createFromMatrix({
      id: matchSetId,
      semanticAuthorityKey: "runtime-v1.17",
      matches: [
        {
          id: matchId,
          bottomStrategyRevisionId: bottom!.strategyRevisionId,
          topStrategyRevisionId: top!.strategyRevisionId,
          arenaVariantId: arenaId,
          seed: `${namespace}:seed`,
          bottomPlayerId: `${namespace}:player:bottom`,
          topPlayerId: `${namespace}:player:top`,
          bottomEntrantKey: bottom!.entrantKey,
          topEntrantKey: top!.entrantKey,
        },
      ],
      integrityIdentity: {
        compatibility: {
          tupleId: tuple.tupleId,
          tuple: { ...tuple.tuple },
        },
        authorityBundleHash,
        registryGeneration,
        executionEntrants,
      },
    })
    const persisted = await pool.query(
      `select conformance_certificate_id,conformance_certificate_hash
         from match_set_execution_entrants where match_set_id=$1`,
      [matchSetId],
    )
    expect(persisted.rows).toHaveLength(2)
    expect(persisted.rows).toEqual([
      { conformance_certificate_id: null, conformance_certificate_hash: null },
      { conformance_certificate_id: null, conformance_certificate_hash: null },
    ])
    const eligibility = await pool.query<{ claim_at: Date }>(
      `select run_after + interval '1 second' as claim_at
         from match_jobs
        where match_id = $1`,
      [matchId],
    )
    expect(eligibility.rows).toHaveLength(1)
    const claimAt = eligibility.rows[0]?.claim_at
    expect(claimAt).toBeInstanceOf(Date)
    if (!(claimAt instanceof Date)) {
      throw new Error("persisted queued-job eligibility time is unavailable")
    }
    const claimed = await claimNextMatchJob(pool, {
      workerId: `${namespace}:worker`,
      matchIds: [matchId],
      now: claimAt,
    })
    expect(claimed?.matchId).toBe(matchId)
    expect(claimed?.evidenceSnapshot.entrants.bottom).not.toHaveProperty(
      "conformanceCertificateRef",
    )
  })
})
