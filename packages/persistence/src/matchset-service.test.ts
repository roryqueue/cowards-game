import { createHash, randomUUID } from "node:crypto"
import {
  CANONICAL_COMPATIBILITY_TUPLES,
  type ExecutableLaneIdentity,
  type MatchId,
  type RuntimeEntrantExecutionEvidence,
} from "@cowards/spec"
import type { Pool, PoolClient } from "pg"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { createDatabasePool } from "./db.js"
import { hashEntrantLaneIdentity } from "./integrity-evidence.js"
import {
  createMatchSetService,
  generatePresetMatrix,
  insertMatchSetWithMatrixOnClient,
  type CreateMatchSetFromMatrixInput,
} from "./matchset-service.js"
import type { CreateMatchRecordInput } from "./match-service.js"
import { migrate } from "./migrations.js"
import { getMatchSetPreset } from "./presets.js"

const tuple = CANONICAL_COMPATIBILITY_TUPLES[0]!
const sha256 = (value: string): string =>
  createHash("sha256").update(value).digest("hex")
const languages = ["typescript", "python", "rust", "zig"] as const

const lane = (index: number, namespace = "fixture"): ExecutableLaneIdentity => ({
  providerId: `${namespace}:provider:${index}`,
  languageId: languages[index % languages.length]!,
  runtimeId: `${namespace}:runtime:${index}`,
  runtimeVersion: "1",
  toolchainId: `${namespace}:toolchain:${index}`,
  toolchainVersion: "1",
  adapterId: `${namespace}:adapter:${index}`,
  adapterVersion: "1",
  policyId: `${namespace}:policy`,
  policyVersion: "1",
  corpusId: `${namespace}:corpus`,
  corpusVersion: "1",
  artifactId: `${namespace}:artifact:${index}`,
  artifactSha256: sha256(`${namespace}:artifact:${index}`),
  implementationId: `${namespace}:implementation:${index}`,
  buildId: `${namespace}:build:${index}`,
  semanticTupleId: tuple.tupleId,
  semanticTuple: { ...tuple.tuple },
})

const entrant = (
  index: number,
  namespace = "fixture",
): RuntimeEntrantExecutionEvidence => ({
  entrantKey: `${namespace}:entrant:${index}`,
  strategyRevisionId: `${namespace}:revision:${index}`,
  laneIdentity: lane(index, namespace),
  containmentCertificateRef: {
    kind: "containment",
    certificateId: `${namespace}:certificate:containment:${index}`,
    certificateVersion: "runtime-certificate-v1",
    certificateRecordHash: sha256(`${namespace}:containment:${index}`),
    registryGeneration: `${namespace}:generation:1`,
  },
  conformanceCertificateRef: {
    kind: "conformance",
    certificateId: `${namespace}:certificate:conformance:${index}`,
    certificateVersion: "runtime-certificate-v1",
    certificateRecordHash: sha256(`${namespace}:conformance:${index}`),
    registryGeneration: `${namespace}:generation:1`,
  },
  schedulingDecision: {
    status: "counted",
    reasonCode: "EVIDENCE_CURRENT",
    evaluatedAt: "2026-07-12T12:00:00.000Z",
    freshUntil: "2099-08-12T12:00:00.000Z",
    registryGeneration: `${namespace}:generation:1`,
  },
})

const matchRecords = (
  count: number,
  namespace = "fixture",
): CreateMatchRecordInput[] =>
  Array.from({ length: count === 2 ? 1 : count }, (_, index) => {
    const top = (index + 1) % count
    return {
      id: `${namespace}:match:${index}` as MatchId,
      bottomStrategyRevisionId: `${namespace}:revision:${index}`,
      topStrategyRevisionId: `${namespace}:revision:${top}`,
      arenaVariantId: `${namespace}:arena`,
      seed: `${namespace}:seed:${index}`,
      bottomPlayerId: `${namespace}:player:${index}`,
      topPlayerId: `${namespace}:player:${top}`,
      bottomEntrantKey: `${namespace}:entrant:${index}`,
      topEntrantKey: `${namespace}:entrant:${top}`,
    }
  })

const inputFor = (
  count: number,
  namespace = "fixture",
): CreateMatchSetFromMatrixInput => {
  const executionEntrants = Object.fromEntries(
    Array.from({ length: count }, (_, index) => {
      const evidence = entrant(index, namespace)
      return [evidence.entrantKey, evidence]
    }),
  )
  return {
    id: `${namespace}:match-set`,
    matches: matchRecords(count, namespace),
    integrityIdentity: {
      compatibility: {
        tupleId: tuple.tupleId,
        tuple: { ...tuple.tuple },
      },
      authorityBundleHash: sha256(`${namespace}:bundle`),
      registryGeneration: `${namespace}:generation:1`,
      executionEntrants,
    },
    competitionEntrants: Object.values(executionEntrants).map(
      (evidence, entrantIndex) => ({
        id: `${namespace}:competition-entrant:${entrantIndex}`,
        entrantIndex,
        executionEntrantKey: evidence.entrantKey,
        strategyRevisionId: evidence.strategyRevisionId,
        ownerUserId: `${namespace}:user`,
        ownerHandle: `${namespace}-owner`,
        displayLabel: `Entrant ${entrantIndex}`,
        sourceHash: sha256(`${namespace}:source:${entrantIndex}`),
        sourceBytes: 6,
        runtime: {},
        engineCompatibility: {},
        snapshot: { entrantIndex },
      }),
    ),
  } as CreateMatchSetFromMatrixInput
}

const fakeDatabase = (failOn = "") => {
  const calls: Array<{ sql: string; values: readonly unknown[] }> = []
  const client = {
    async query(sql: string, values: readonly unknown[] = []) {
      const normalized = sql.replace(/\s+/gu, " ").trim()
      calls.push({ sql: normalized, values })
      if (failOn && normalized.startsWith(failOn)) {
        throw new Error("forced late child failure")
      }
      if (normalized.startsWith("select * from strategy_revisions")) {
        return {
          rows: [
            {
              id: values[0],
              strategy_id: null,
              source: "return",
              source_hash: "source-hash",
              source_bytes: 6,
              runtime: {},
              engine_compatibility: {},
              validation: { valid: true },
              metadata: {},
              compiled_artifact: null,
            },
          ],
        }
      }
      if (normalized.startsWith("select config from arena_variants")) {
        return { rows: [{ config: { id: values[0] } }] }
      }
      return { rows: [], rowCount: 1 }
    },
    release() {},
  }
  return {
    client: client as unknown as PoolClient,
    pool: { connect: async () => client } as unknown as Pool,
    calls,
  }
}

describe("MatchSet presets", () => {
  it("defines fixed standard-v1 seed and arena lists", () => {
    const preset = getMatchSetPreset("standard-v1")

    expect(preset.arenaVariantIds).toEqual([
      "arena:smoke:v1",
      "arena:standard-cross:v1",
    ])
    expect(preset.seeds).toEqual(["seed:standard:001", "seed:standard:002"])
    expect(preset.mirrorSides).toBe(true)
  })

  it("generates mirrored side assignments with stable entrant keys", () => {
    const matrix = generatePresetMatrix({
      id: "match-set:test",
      presetId: "standard-v1",
      bottomStrategyRevisionId: "strategy-revision:bottom",
      topStrategyRevisionId: "strategy-revision:top",
      bottomPlayerId: "player:bottom",
      topPlayerId: "player:top",
    })

    expect(matrix).toHaveLength(8)
    expect(matrix[0]).toMatchObject({
      bottomStrategyRevisionId: "strategy-revision:bottom",
      topStrategyRevisionId: "strategy-revision:top",
      bottomEntrantKey: "strategy-revision:bottom",
      topEntrantKey: "strategy-revision:top",
    })
    expect(matrix[1]).toMatchObject({
      bottomStrategyRevisionId: "strategy-revision:top",
      topStrategyRevisionId: "strategy-revision:bottom",
      bottomEntrantKey: "strategy-revision:top",
      topEntrantKey: "strategy-revision:bottom",
      seed: "seed:standard:001:mirror",
    })
  })
})

describe("exact MatchSet creation", () => {
  it.each([2, 3, 8])(
    "persists one tuple, %i heterogeneous entrants, and ordered Match/job pairs",
    async (count) => {
      const fake = fakeDatabase()
      const input = inputFor(count)
      await createMatchSetService(fake.pool).createFromMatrix(input)

      const matchSetInsert = fake.calls.find((call) =>
        call.sql.startsWith("insert into match_sets"),
      )!
      const genericEntrants = fake.calls.filter((call) =>
        call.sql.startsWith("insert into match_set_execution_entrants"),
      )
      const competitionEntrants = fake.calls.filter((call) =>
        call.sql.startsWith("insert into competition_entrants"),
      )
      const matches = fake.calls.filter((call) =>
        call.sql.startsWith("insert into matches"),
      )
      const jobs = fake.calls.filter((call) =>
        call.sql.startsWith("insert into match_jobs"),
      )

      expect(matchSetInsert.values).toContain(tuple.tupleId)
      expect(genericEntrants).toHaveLength(count)
      expect(competitionEntrants).toHaveLength(count)
      expect(matches).toHaveLength(input.matches.length)
      expect(jobs).toHaveLength(input.matches.length)
      expect(
        genericEntrants.map((call) =>
          (call.values.at(-2) as RuntimeEntrantExecutionEvidence).laneIdentity
            .languageId,
        ),
      ).toEqual(
        Array.from({ length: count }, (_, index) =>
          languages[index % languages.length],
        ),
      )
      for (const [index, match] of matches.entries()) {
        expect(match.values.slice(-6)).toEqual(jobs[index]!.values.slice(-6))
        expect(match.values.at(-5)).toBe(input.matches[index]!.bottomEntrantKey)
        expect(match.values.at(-4)).toBe(input.matches[index]!.topEntrantKey)
      }
      expect(fake.calls.at(0)?.sql).toBe("begin")
      expect(fake.calls.at(-1)?.sql).toBe("commit")
    },
  )

  it.each([
    ["missing", (input: CreateMatchSetFromMatrixInput) => {
      delete (input.integrityIdentity.executionEntrants as Record<string, unknown>)[
        "fixture:entrant:1"
      ]
    }],
    ["extra", (input: CreateMatchSetFromMatrixInput) => {
      ;(input.integrityIdentity.executionEntrants as Record<string, unknown>)[
        "fixture:entrant:extra"
      ] = entrant(7)
    }],
    ["wrong revision", (input: CreateMatchSetFromMatrixInput) => {
      const evidence = input.integrityIdentity.executionEntrants[
        "fixture:entrant:1"
      ]!
      ;(input.integrityIdentity.executionEntrants as Record<string, unknown>)[
        "fixture:entrant:1"
      ] = { ...evidence, strategyRevisionId: "fixture:revision:wrong" }
    }],
    ["swapped side", (input: CreateMatchSetFromMatrixInput) => {
      input.matches[0] = {
        ...input.matches[0]!,
        bottomEntrantKey: input.matches[0]!.topEntrantKey,
      }
    }],
    ["stale", (input: CreateMatchSetFromMatrixInput) => {
      const evidence = input.integrityIdentity.executionEntrants[
        "fixture:entrant:1"
      ]!
      ;(input.integrityIdentity.executionEntrants as Record<string, unknown>)[
        "fixture:entrant:1"
      ] = {
        ...evidence,
        schedulingDecision: {
          ...evidence.schedulingDecision,
          freshUntil: "2020-01-01T00:00:00.000Z",
        },
      }
    }],
  ] as const)("rejects %s evidence before the first SQL statement", async (_, mutate) => {
    const fake = fakeDatabase()
    const input = inputFor(2)
    mutate(input)
    await expect(
      insertMatchSetWithMatrixOnClient(fake.client, input),
    ).rejects.toThrow()
    expect(fake.calls).toEqual([])
  })

  it("rolls the complete matrix back after a forced late child failure", async () => {
    const fake = fakeDatabase("insert into match_jobs")
    await expect(
      createMatchSetService(fake.pool).createFromMatrix(inputFor(3)),
    ).rejects.toThrow("forced late child failure")
    expect(fake.calls.some((call) => call.sql.startsWith("insert into match_sets"))).toBe(
      true,
    )
    expect(fake.calls.at(-1)?.sql).toBe("rollback")
  })
})

const databaseUrl = process.env.DATABASE_URL
const describePostgres = databaseUrl ? describe : describe.skip

describePostgres("PostgreSQL MatchSet integrity identity and zero rows", () => {
  let pool: Pool
  let client: PoolClient
  const namespace = `matrix:${randomUUID()}`
  const postgresInput = inputFor(4, namespace)

  beforeAll(async () => {
    pool = createDatabasePool({ connectionString: databaseUrl! })
    await migrate(pool)
    client = await pool.connect()
    await client.query("begin")
    await client.query(
      "insert into users (id, display_name) values ($1, 'Matrix identity')",
      [`${namespace}:user`],
    )
    await client.query(
      "insert into strategies (id, owner_user_id, name) values ($1, $2, 'Matrix')",
      [`${namespace}:strategy`, `${namespace}:user`],
    )
    await client.query(
      "insert into arena_variants (id, name, config) values ($1, 'Matrix', '{}'::jsonb)",
      [`${namespace}:arena`],
    )
    for (const [index, evidence] of Object.values(
      postgresInput.integrityIdentity.executionEntrants,
    ).entries()) {
      await client.query(
        `insert into strategy_revisions
          (id, strategy_id, source, source_hash, source_bytes, runtime,
           engine_compatibility, validation)
         values ($1, $2, 'return', $3, 6, '{}'::jsonb, '{}'::jsonb,
           '{"valid":true}'::jsonb)`,
        [
          evidence.strategyRevisionId,
          `${namespace}:strategy`,
          sha256(`${namespace}:source:${index}`),
        ],
      )
      const laneHash = hashEntrantLaneIdentity(evidence.laneIdentity)
      for (const kind of ["containment", "conformance"] as const) {
        const reference =
          kind === "containment"
            ? evidence.containmentCertificateRef
            : evidence.conformanceCertificateRef
        const producer = `${namespace}:producer:${kind}:${index}`
        const command = `${namespace}:command:${kind}:${index}`
        const graphHash = sha256(`${namespace}:graph:${kind}:${index}`)
        const attestationId = `${namespace}:attestation:${kind}:${index}`
        await client.query(
          `insert into runtime_evidence_verified_attestations
            (id, attestation_sha256, verification_status, certificate_kind,
             producer_id, producer_key_id, trust_domain, schema_version,
             command_id, command_digest, corpus_id, corpus_hash, policy_id,
             policy_hash, runtime_id, runtime_version, toolchain_id,
             toolchain_version, adapter_id, adapter_version, artifact_id,
             artifact_hash, lane_identity_hash, semantic_tuple_id,
             result_manifest_hash, result_graph_hash, original_evidence_hash,
             derived_certificate_version, derived_certificate_record_hash,
             registry_generation, lane_identity, issued_at, valid_until)
           values ($1, $2, 'passed', $3, $4, 'fixture-key', 'fixture',
             'runtime-evidence-attestation-v1', $5, $6, $7, $8, $9, $10,
             $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21,
             $22, $23, $24, $25, $26, $27, '2026-07-12T12:00:00Z',
             '2099-08-12T12:00:00Z')`,
          [
            attestationId,
            sha256(attestationId),
            kind,
            producer,
            command,
            sha256(command),
            evidence.laneIdentity.corpusId,
            sha256(evidence.laneIdentity.corpusId),
            evidence.laneIdentity.policyId,
            sha256(evidence.laneIdentity.policyId),
            evidence.laneIdentity.runtimeId,
            evidence.laneIdentity.runtimeVersion,
            evidence.laneIdentity.toolchainId,
            evidence.laneIdentity.toolchainVersion,
            evidence.laneIdentity.adapterId,
            evidence.laneIdentity.adapterVersion,
            evidence.laneIdentity.artifactId,
            evidence.laneIdentity.artifactSha256,
            laneHash,
            tuple.tupleId,
            sha256(`${namespace}:manifest:${kind}:${index}`),
            graphHash,
            sha256(`${namespace}:original:${kind}:${index}`),
            reference.certificateVersion,
            reference.certificateRecordHash,
            reference.registryGeneration,
            evidence.laneIdentity,
          ],
        )
        await client.query(
          `insert into runtime_evidence_certificates
            (id, certificate_kind, certificate_version,
             certificate_record_hash, certificate_status,
             verified_attestation_id, verified_attestation_status, producer_id,
             schema_version, command_id, command_digest, corpus_id, corpus_hash,
             policy_id, policy_hash, toolchain_id, toolchain_version, artifact_id,
             artifact_hash, lane_identity_hash, lane_identity, result_graph_hash,
             registry_generation, issued_at, fresh_until)
           values ($1, $2, $3, $4, 'passed', $5, 'passed', $6,
             'runtime-evidence-attestation-v1', $7, $8, $9, $10, $11, $12,
             $13, $14, $15, $16, $17, $18, $19, $20,
             '2026-07-12T12:00:00Z', '2099-08-12T12:00:00Z')`,
          [
            reference.certificateId,
            kind,
            reference.certificateVersion,
            reference.certificateRecordHash,
            attestationId,
            producer,
            command,
            sha256(command),
            evidence.laneIdentity.corpusId,
            sha256(evidence.laneIdentity.corpusId),
            evidence.laneIdentity.policyId,
            sha256(evidence.laneIdentity.policyId),
            evidence.laneIdentity.toolchainId,
            evidence.laneIdentity.toolchainVersion,
            evidence.laneIdentity.artifactId,
            evidence.laneIdentity.artifactSha256,
            laneHash,
            evidence.laneIdentity,
            graphHash,
            reference.registryGeneration,
          ],
        )
      }
    }
  })

  afterAll(async () => {
    await client.query("rollback").catch(() => undefined)
    client.release()
    await pool.end()
  })

  it("persists exact MatchSet, entrant, Match, and job identities in PostgreSQL", async () => {
    await insertMatchSetWithMatrixOnClient(client, postgresInput)
    const matchSet = await client.query(
      `select compatibility_tuple_id, execution_evidence_set_hash
         from match_sets where id = $1`,
      [postgresInput.id],
    )
    const executionEntrants = await client.query(
      `select entrant_key, strategy_revision_id from match_set_execution_entrants
         where match_set_id = $1 order by entrant_key`,
      [postgresInput.id],
    )
    const competitionEntrants = await client.query(
      `select execution_entrant_key from competition_entrants
         where match_set_id = $1 order by entrant_index`,
      [postgresInput.id],
    )
    const pairs = await client.query(
      `select m.id, m.bottom_execution_entrant_key,
              m.top_execution_entrant_key, m.execution_evidence_pair_hash,
              j.bottom_execution_entrant_key as job_bottom,
              j.top_execution_entrant_key as job_top,
              j.execution_evidence_pair_hash as job_hash
         from matches m join match_jobs j on j.match_id = m.id
        where m.integrity_match_set_id = $1 order by m.id`,
      [postgresInput.id],
    )

    expect(matchSet.rows).toEqual([
      expect.objectContaining({
        compatibility_tuple_id: tuple.tupleId,
        execution_evidence_set_hash: expect.stringMatching(/^[0-9a-f]{64}$/u),
      }),
    ])
    expect(executionEntrants.rows).toHaveLength(4)
    expect(competitionEntrants.rows.map((row) => row.execution_entrant_key)).toEqual(
      Object.keys(postgresInput.integrityIdentity.executionEntrants),
    )
    expect(pairs.rows).toHaveLength(postgresInput.matches.length)
    for (const pair of pairs.rows) {
      expect(pair.bottom_execution_entrant_key).toBe(pair.job_bottom)
      expect(pair.top_execution_entrant_key).toBe(pair.job_top)
      expect(pair.execution_evidence_pair_hash).toBe(pair.job_hash)
    }
  })

  it("keeps every record family at zero for rejected PostgreSQL input", async () => {
    const rejected = inputFor(2, `${namespace}:rejected`)
    delete (rejected.integrityIdentity.executionEntrants as Record<string, unknown>)[
      `${namespace}:rejected:entrant:1`
    ]
    await expect(
      insertMatchSetWithMatrixOnClient(client, rejected),
    ).rejects.toThrow(/coverage|missing/iu)
    const counts = await client.query(
      `select
         (select count(*) from match_sets where id = $1)::integer as match_sets,
         (select count(*) from match_set_execution_entrants where match_set_id = $1)::integer as execution_entrants,
         (select count(*) from competition_entrants where match_set_id = $1)::integer as competition_entrants,
         (select count(*) from matches where integrity_match_set_id = $1)::integer as matches,
         (select count(*) from match_jobs where integrity_match_set_id = $1)::integer as jobs`,
      [rejected.id],
    )
    expect(counts.rows[0]).toEqual({
      match_sets: 0,
      execution_entrants: 0,
      competition_entrants: 0,
      matches: 0,
      jobs: 0,
    })
  })
})
