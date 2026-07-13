import { createHash, randomUUID } from "node:crypto"
import {
  CANONICAL_COMPATIBILITY_TUPLES,
  type ExecutableLaneIdentity,
  type RuntimeEntrantExecutionEvidence,
} from "@cowards/spec"
import type { Pool } from "pg"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { createDatabasePool } from "./db.js"
import {
  IntegrityEvidenceInputError,
  createMatchExecutionEvidencePair,
  createMatchSetIntegrityIdentity,
  matchExecutionEvidencePairSqlValues,
  matchSetIntegritySqlValues,
  parseMatchSetIntegrityIdentityRows,
  persistMatchSetIntegrityIdentity,
} from "./integrity-evidence.js"
import { migrate } from "./migrations.js"

const tupleRecord = CANONICAL_COMPATIBILITY_TUPLES[0]!

const laneIdentity = (index: number): ExecutableLaneIdentity => ({
  providerId: `provider:${index}`,
  languageId: ["typescript", "python", "rust", "zig"][index % 4]!,
  runtimeId: `runtime:${index}`,
  runtimeVersion: `runtime-version:${index}`,
  toolchainId: `toolchain:${index}`,
  toolchainVersion: `toolchain-version:${index}`,
  adapterId: `adapter:${index}`,
  adapterVersion: `adapter-version:${index}`,
  policyId: "policy:1",
  policyVersion: "policy-version:1",
  corpusId: "corpus:1",
  corpusVersion: "corpus-version:1",
  artifactId: `artifact:${index}`,
  artifactSha256: createHash("sha256").update(`artifact:${index}`).digest("hex"),
  implementationId: `implementation:${index}`,
  buildId: `build:${index}`,
  semanticTupleId: tupleRecord.tupleId,
  semanticTuple: { ...tupleRecord.tuple },
})

const entrant = (index: number): RuntimeEntrantExecutionEvidence => ({
  entrantKey: `entrant:${index}`,
  strategyRevisionId: `revision:${index}`,
  laneIdentity: laneIdentity(index),
  containmentCertificateRef: {
    kind: "containment",
    certificateId: `certificate:containment:${index}`,
    certificateVersion: "certificate-v1",
    certificateRecordHash: createHash("sha256")
      .update(`containment:${index}`)
      .digest("hex"),
    registryGeneration: "generation:1",
  },
  conformanceCertificateRef: {
    kind: "conformance",
    certificateId: `certificate:conformance:${index}`,
    certificateVersion: "certificate-v1",
    certificateRecordHash: createHash("sha256")
      .update(`conformance:${index}`)
      .digest("hex"),
    registryGeneration: "generation:1",
  },
  schedulingDecision: {
    status: "counted",
    reasonCode: "EVIDENCE_CURRENT",
    evaluatedAt: "2026-07-12T12:00:00.000Z",
    freshUntil: "2026-08-12T12:00:00.000Z",
    registryGeneration: "generation:1",
  },
})

const identityInput = (count = 2) => {
  const entrants = Array.from({ length: count }, (_, index) => entrant(index))
  return {
    compatibility: {
      tupleId: tupleRecord.tupleId,
      tuple: { ...tupleRecord.tuple },
    },
    authorityBundleHash: createHash("sha256").update("bundle:1").digest("hex"),
    registryGeneration: "generation:1",
    expectedEntrants: entrants.map((entry) => ({
      entrantKey: entry.entrantKey,
      strategyRevisionId: entry.strategyRevisionId,
    })),
    entrants,
  }
}

describe("exact MatchSet integrity identity", () => {
  it.each([2, 3, 4, 5, 6, 7, 8])(
    "normalizes a complete heterogeneous %i-entrant set",
    (count) => {
      const identity = createMatchSetIntegrityIdentity(identityInput(count))
      expect(identity.normalizedEntrants).toHaveLength(count)
      expect(Object.keys(identity.entrantsByKey)).toEqual(
        Array.from({ length: count }, (_, index) => `entrant:${index}`),
      )
      expect(identity.evidenceSetHash).toMatch(/^[0-9a-f]{64}$/u)
      expect(matchSetIntegritySqlValues(identity)).toHaveLength(11)
    },
  )

  it("rejects tuple drift, incomplete coverage, duplicates, and revision mismatch", () => {
    const tupleDrift = identityInput()
    tupleDrift.entrants[1] = {
      ...tupleDrift.entrants[1]!,
      laneIdentity: {
        ...tupleDrift.entrants[1]!.laneIdentity,
        semanticTuple: {
          ...tupleDrift.entrants[1]!.laneIdentity.semanticTuple,
          engine: "mixed-engine",
        },
      },
    }
    expect(() => createMatchSetIntegrityIdentity(tupleDrift)).toThrow(
      IntegrityEvidenceInputError,
    )

    const missing = identityInput()
    missing.entrants.pop()
    expect(() => createMatchSetIntegrityIdentity(missing)).toThrow(
      /coverage/iu,
    )

    const duplicate = identityInput()
    duplicate.entrants[1] = { ...duplicate.entrants[1]!, entrantKey: "entrant:0" }
    expect(() => createMatchSetIntegrityIdentity(duplicate)).toThrow(
      /duplicate/iu,
    )

    const wrongRevision = identityInput()
    wrongRevision.expectedEntrants[1] = {
      entrantKey: "entrant:1",
      strategyRevisionId: "revision:wrong",
    }
    expect(() => createMatchSetIntegrityIdentity(wrongRevision)).toThrow(
      /revision/iu,
    )
  })

  it("rejects singular, partial, uncertified, and extra identity forms", () => {
    expect(() =>
      createMatchSetIntegrityIdentity({
        ...identityInput(),
        laneIdentity: laneIdentity(0),
      }),
    ).toThrow(IntegrityEvidenceInputError)

    const partial = identityInput()
    partial.entrants[0] = {
      ...partial.entrants[0]!,
      conformanceCertificateRef: undefined as never,
    }
    expect(() => createMatchSetIntegrityIdentity(partial)).toThrow(
      IntegrityEvidenceInputError,
    )

    const unknownTuple = identityInput()
    unknownTuple.compatibility.tupleId = `sha256:${"f".repeat(64)}`
    expect(() => createMatchSetIntegrityIdentity(unknownTuple)).toThrow(
      /tuple/iu,
    )

    const extra = identityInput()
    extra.entrants.push(entrant(2))
    expect(() => createMatchSetIntegrityIdentity(extra)).toThrow(/coverage/iu)

    const validated = createMatchSetIntegrityIdentity(identityInput())
    expect(() => matchSetIntegritySqlValues({ ...validated })).toThrow(
      /exact validator/iu,
    )
  })

  it("resolves exact ordered pairs and rejects swaps or unknown keys", () => {
    const identity = createMatchSetIntegrityIdentity(identityInput())
    const pair = createMatchExecutionEvidencePair(identity, {
      bottomEntrantKey: "entrant:0",
      topEntrantKey: "entrant:1",
      bottomStrategyRevisionId: "revision:0",
      topStrategyRevisionId: "revision:1",
    })
    expect(pair.bottom.entrantKey).toBe("entrant:0")
    expect(pair.top.entrantKey).toBe("entrant:1")
    expect(matchExecutionEvidencePairSqlValues("matchset:1", pair)).toHaveLength(6)

    expect(() =>
      createMatchExecutionEvidencePair(identity, {
        bottomEntrantKey: "entrant:0",
        topEntrantKey: "entrant:1",
        bottomStrategyRevisionId: "revision:1",
        topStrategyRevisionId: "revision:0",
      }),
    ).toThrow(/side|revision/iu)
    expect(() =>
      createMatchExecutionEvidencePair(identity, {
        bottomEntrantKey: "entrant:missing",
        topEntrantKey: "entrant:1",
        bottomStrategyRevisionId: "revision:missing",
        topStrategyRevisionId: "revision:1",
      }),
    ).toThrow(/unknown/iu)
  })

  it("maps rows only when their normalized set hash is exact", () => {
    const identity = createMatchSetIntegrityIdentity(identityInput())
    const matchSetValues = matchSetIntegritySqlValues(identity)
    const rows = identity.normalizedEntrants.map((entry) => ({
      match_set_id: "matchset:1",
      entrant_key: entry.entrantKey,
      strategy_revision_id: entry.strategyRevisionId,
      execution_snapshot: entry,
    }))
    expect(
      parseMatchSetIntegrityIdentityRows(
        {
          compatibility_tuple_id: matchSetValues[0] as string,
          compatibility_rules_version: matchSetValues[1] as string,
          compatibility_engine_version: matchSetValues[2] as string,
          compatibility_runtime_abi_version: matchSetValues[3] as string,
          compatibility_chronicle_version: matchSetValues[4] as string,
          compatibility_arena_catalog_version: matchSetValues[5] as string,
          compatibility_set_policy_version: matchSetValues[6] as string,
          authority_bundle_hash: matchSetValues[7] as string,
          authority_registry_generation: matchSetValues[8] as string,
          execution_evidence_set: matchSetValues[9],
          execution_evidence_set_hash: matchSetValues[10] as string,
        },
        rows,
      ).evidenceSetHash,
    ).toBe(identity.evidenceSetHash)

    expect(() =>
      parseMatchSetIntegrityIdentityRows(
        {
          compatibility_tuple_id: matchSetValues[0] as string,
          compatibility_rules_version: matchSetValues[1] as string,
          compatibility_engine_version: matchSetValues[2] as string,
          compatibility_runtime_abi_version: matchSetValues[3] as string,
          compatibility_chronicle_version: matchSetValues[4] as string,
          compatibility_arena_catalog_version: matchSetValues[5] as string,
          compatibility_set_policy_version: matchSetValues[6] as string,
          authority_bundle_hash: matchSetValues[7] as string,
          authority_registry_generation: matchSetValues[8] as string,
          execution_evidence_set: matchSetValues[9],
          execution_evidence_set_hash: "0".repeat(64),
        },
        rows,
      ),
    ).toThrow(/hash/iu)
  })

  it("rolls a fake-pool transaction back after a late entrant insert failure", async () => {
    const calls: string[] = []
    let insertCount = 0
    const client = {
      async query(sql: string) {
        const normalized = sql.replace(/\s+/gu, " ").trim()
        calls.push(normalized)
        if (normalized.includes("update match_sets")) return { rows: [{ id: "matchset:1" }] }
        if (normalized.includes("insert into match_set_execution_entrants")) {
          insertCount += 1
          if (insertCount === 2) throw new Error("late insert failure")
        }
        return { rows: [] }
      },
      release() {},
    }
    const pool = { connect: async () => client } as unknown as Pool
    await expect(
      persistMatchSetIntegrityIdentity(pool, {
        matchSetId: "matchset:1",
        identity: createMatchSetIntegrityIdentity(identityInput()),
      }),
    ).rejects.toThrow("late insert failure")
    expect(calls.at(-1)).toBe("rollback")
  })
})

const databaseUrl = process.env.DATABASE_URL
const describePostgres = databaseUrl ? describe : describe.skip

describePostgres("PostgreSQL integrity schema", () => {
  let pool: Pool
  const suffix = randomUUID()
  const userId = `integrity:user:${suffix}`
  const strategyId = `integrity:strategy:${suffix}`
  const matchSetId = `integrity:matchset:${suffix}`
  const legacyMatchSetId = `integrity:legacy:${suffix}`

  beforeAll(async () => {
    pool = createDatabasePool({ connectionString: databaseUrl! })
    await migrate(pool)
    await pool.query(
      "insert into users (id, display_name) values ($1, 'Integrity test')",
      [userId],
    )
    await pool.query(
      "insert into strategies (id, owner_user_id, name) values ($1, $2, 'Integrity')",
      [strategyId, userId],
    )
    for (const index of [0, 1]) {
      await pool.query(
        `insert into strategy_revisions
          (id, strategy_id, source, source_hash, source_bytes, runtime,
           engine_compatibility, validation)
         values ($1, $2, 'return', $3, 6, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb)`,
        [`revision:${index}:${suffix}`, strategyId, `source:${index}:${suffix}`],
      )
    }
    await pool.query(
      "insert into match_sets (id, matrix) values ($1, '[]'::jsonb), ($2, '[]'::jsonb)",
      [matchSetId, legacyMatchSetId],
    )
  })

  afterAll(async () => {
    await pool.query("delete from match_sets where id in ($1, $2)", [matchSetId, legacyMatchSetId])
    await pool.query("delete from strategy_revisions where strategy_id = $1", [strategyId])
    await pool.query("delete from strategies where id = $1", [strategyId])
    await pool.query("delete from users where id = $1", [userId])
    await pool.end()
  })

  it("PostgreSQL rejects direct certificates, forbidden mutation, and partial identity", async () => {
    await expect(
      pool.query(
        `insert into runtime_evidence_certificates
          (id, certificate_kind, certificate_version, certificate_record_hash,
           certificate_status, verified_attestation_id, verified_attestation_status,
           producer_id, schema_version, command_id, command_digest, corpus_id,
           corpus_hash, policy_id, policy_hash, toolchain_id, toolchain_version,
           artifact_id, artifact_hash, lane_identity_hash, lane_identity,
           result_graph_hash, registry_generation, issued_at, fresh_until)
         values ('forged', 'containment', 'v1', $1, 'passed', 'missing', 'passed',
           'producer', 'schema', 'command', 'digest', 'corpus', 'hash', 'policy',
           'hash', 'toolchain', 'version', 'artifact', 'hash', 'lane', '{}'::jsonb,
           'graph', 'generation', now(), now())`,
        ["a".repeat(64)],
      ),
    ).rejects.toThrow()

    const manifestId = `manifest:${suffix}`
    await pool.query(
      `insert into canonical_release_manifests
        (id, manifest_version, manifest_hash, compatibility_tuple_id,
         compatibility_rules_version, compatibility_engine_version,
         compatibility_runtime_abi_version, compatibility_chronicle_version,
         compatibility_arena_catalog_version, compatibility_set_policy_version,
         original_manifest)
       values ($1, 'v1', $2, $3, $4, $5, $6, $7, $8, $9, '{}'::jsonb)`,
      [
        manifestId,
        createHash("sha256").update(manifestId).digest("hex"),
        tupleRecord.tupleId,
        tupleRecord.tuple.rules,
        tupleRecord.tuple.engine,
        tupleRecord.tuple.runtimeAbi,
        tupleRecord.tuple.chronicle,
        tupleRecord.tuple.arenaCatalog,
        tupleRecord.tuple.setPolicy,
      ],
    )
    await expect(
      pool.query("update canonical_release_manifests set manifest_version = 'changed' where id = $1", [manifestId]),
    ).rejects.toThrow(/append-only/iu)
    await pool.query("delete from canonical_release_manifests where id = $1", [manifestId]).catch(() => undefined)

    await expect(
      pool.query("update match_sets set compatibility_tuple_id = $2 where id = $1", [matchSetId, tupleRecord.tupleId]),
    ).rejects.toThrow()
  })

  it("PostgreSQL rolls back partial entrant sets and preserves historical source rows", async () => {
    const historicalBefore = await pool.query(
      "select id, status::text, matrix, scoring, created_at from match_sets where id = $1",
      [legacyMatchSetId],
    )
    const beforeHash = createHash("sha256")
      .update(JSON.stringify(historicalBefore.rows[0]))
      .digest("hex")

    const input = identityInput()
    input.entrants = input.entrants.map((entry, index) => ({
      ...entry,
      entrantKey: `entrant:${index}:${suffix}`,
      strategyRevisionId: `revision:${index}:${suffix}`,
    }))
    input.expectedEntrants = input.entrants.map((entry) => ({
      entrantKey: entry.entrantKey,
      strategyRevisionId: entry.strategyRevisionId,
    }))

    await expect(
      persistMatchSetIntegrityIdentity(pool, {
        matchSetId,
        identity: createMatchSetIntegrityIdentity(input),
      }),
    ).rejects.toThrow()
    const persisted = await pool.query(
      "select compatibility_tuple_id from match_sets where id = $1",
      [matchSetId],
    )
    expect(persisted.rows[0]?.compatibility_tuple_id).toBeNull()
    const entrantCount = await pool.query(
      "select count(*)::integer as count from match_set_execution_entrants where match_set_id = $1",
      [matchSetId],
    )
    expect(entrantCount.rows[0]?.count).toBe(0)

    const historicalAfter = await pool.query(
      "select id, status::text, matrix, scoring, created_at from match_sets where id = $1",
      [legacyMatchSetId],
    )
    const afterHash = createHash("sha256")
      .update(JSON.stringify(historicalAfter.rows[0]))
      .digest("hex")
    expect(afterHash).toBe(beforeHash)
  })
})
