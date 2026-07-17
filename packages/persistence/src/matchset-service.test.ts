import { createHash, randomUUID } from "node:crypto"
import {
  ARENA_CATALOG_VERSION_V1_37,
  CANONICAL_ARENA_CATALOG_V1_37,
  CANONICAL_COMPATIBILITY_TUPLES,
  CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE,
  CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID,
  createSetScenarioV137,
  type ExecutableLaneIdentity,
  type MatchId,
  type RuntimeEntrantExecutionEvidence,
} from "@cowards/spec"
import type { Pool, PoolClient } from "pg"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { createDatabasePool } from "./db.js"
import { hashEntrantLaneIdentity } from "./integrity-evidence.js"
import { createRepositories } from "./repositories.js"
import {
  createFixtureMatchSetEvidenceResolver,
  createMatchSetService,
  generateCandidatePresetMatrixV119,
  generatePresetMatrix,
  insertMatchSetWithMatrixOnClient,
  resolveMatchSetExecutionEvidence,
  type CreateMatchSetFromMatrixInput,
} from "./matchset-service.js"
import type {
  CreateMatchRecordInput,
  CreateMatchRecordInputV119,
} from "./match-service.js"
import { migrate } from "./migrations.js"
import { getMatchSetPreset } from "./presets.js"
import {
  ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION,
  ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION_ROOT,
  REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION,
  REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION_ROOT,
} from "./semantic-authority-selection-head.js"

const tuple = CANONICAL_COMPATIBILITY_TUPLES[0]!
const sha256 = (value: string): string =>
  createHash("sha256").update(value).digest("hex")
const languages = ["typescript", "python", "rust", "zig"] as const

const lane = (
  index: number,
  namespace = "fixture",
): ExecutableLaneIdentity => ({
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

const candidateEntrant = (
  side: "a" | "b",
  namespace = "candidate",
): RuntimeEntrantExecutionEvidence => {
  const index = side === "a" ? 0 : 1
  const base = entrant(index, namespace)
  return {
    ...base,
    laneIdentity: {
      ...base.laneIdentity,
      languageId: "typescript",
      providerId: `${namespace}:provider:${side}`,
      artifactId: `${namespace}:artifact:${side}`,
      artifactSha256: sha256(`${namespace}:artifact:${side}`),
      semanticTupleId: CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID,
      semanticTuple: { ...CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE },
    },
    conformanceCertificateRef: {
      kind: "conformance",
      certificateId: `${namespace}:reviewed-certificate:${side}`,
      certificateVersion: "runtime-conformance-certificate-v1.19",
      certificateRecordHash: sha256(`${namespace}:certificate:${side}`),
      registryGeneration: `${namespace}:generation:1`,
    },
    containmentCertificateRef: {
      ...base.containmentCertificateRef,
      registryGeneration: `${namespace}:generation:1`,
    },
    schedulingDecision: {
      ...base.schedulingDecision,
      registryGeneration: `${namespace}:generation:1`,
    },
  }
}

const candidateInput = (
  namespace = "candidate",
): CreateMatchSetFromMatrixInput => {
  const entrantA = candidateEntrant("a", namespace)
  const entrantB = candidateEntrant("b", namespace)
  const arena = CANONICAL_ARENA_CATALOG_V1_37.arenas.find(
    ({ id }) => id === "arena:smoke:v1",
  )!
  const scenario = createSetScenarioV137({
    arenaCatalogVersion: ARENA_CATALOG_VERSION_V1_37,
    arenaSemanticGeometryHash: arena.semanticGeometryHash,
    entrantA: {
      entrantKey: entrantA.entrantKey,
      playerId: `${namespace}:player:a`,
    },
    entrantB: {
      entrantKey: entrantB.entrantKey,
      playerId: `${namespace}:player:b`,
    },
    baseSeed: `${namespace}:base-seed:001`,
  })
  const revisionByEntrant = new Map([
    [entrantA.entrantKey, entrantA.strategyRevisionId],
    [entrantB.entrantKey, entrantB.strategyRevisionId],
  ])
  return {
    id: `${namespace}:match-set`,
    semanticAuthorityKey: "runtime-v1.19",
    matches: scenario.conditions.map(
      (condition): CreateMatchRecordInputV119 => ({
        id: `${namespace}:match:${condition.ordinal}` as MatchId,
        bottomStrategyRevisionId: revisionByEntrant.get(
          condition.bottomEntrantKey,
        )!,
        topStrategyRevisionId: revisionByEntrant.get(condition.topEntrantKey)!,
        arenaVariantId: arena.id,
        seed: scenario.baseSeed,
        bottomPlayerId: condition.bottomPlayerId,
        topPlayerId: condition.topPlayerId,
        bottomEntrantKey: condition.bottomEntrantKey,
        topEntrantKey: condition.topEntrantKey,
        semanticAuthorityKey: "runtime-v1.19",
        setPolicyVersion: scenario.setPolicyVersion,
        scenarioId: scenario.scenarioId,
        conditionId: condition.conditionId,
        conditionOrdinal: condition.ordinal,
        conditionSuffix: condition.suffix,
        requestIdentity: condition.requestIdentity,
        arenaCatalogVersion: scenario.arenaCatalogVersion,
        arenaSemanticGeometryHash: scenario.arenaSemanticGeometryHash,
        initialInitiativeEntrantKey: condition.initialInitiativeEntrantKey,
        initialInitiativePlayerId: condition.initialInitiativePlayerId,
      }),
    ),
    integrityIdentity: {
      compatibility: {
        tupleId: CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID,
        tuple: { ...CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE },
      },
      authorityBundleHash: sha256(`${namespace}:bundle`),
      registryGeneration: `${namespace}:generation:1`,
      executionEntrants: {
        [entrantA.entrantKey]: entrantA,
        [entrantB.entrantKey]: entrantB,
      },
    },
  }
}

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

const fakeDatabase = (
  failOn = "",
  options: {
    omitCandidateAdmissionSide?: "a" | "b"
    semanticHead?: "active" | "absent" | "pending" | "file-mismatch"
  } = {},
) => {
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
      if (normalized.includes("from semantic_authority_selection_head")) {
        if (options.semanticHead === "absent") {
          return { rowCount: 0, rows: [] }
        }
        if (options.semanticHead === "file-mismatch") {
          return {
            rowCount: 1,
            rows: [
              {
                state: "active-v1.19-finalized",
                revision: "2",
                active_selection: REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION,
                active_selection_root:
                  REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION_ROOT,
                pending_intent: null,
                finalization: {
                  activationId: "activation:test-file-mismatch",
                  proofDigest: `sha256:${"1".repeat(64)}`,
                  commitSha: "2".repeat(40),
                  treeSha: "3".repeat(40),
                  selectorManifestRoot: `sha256:${"4".repeat(64)}`,
                },
                compensation: null,
              },
            ],
          }
        }
        return {
          rowCount: 1,
          rows: [
            {
              state:
                options.semanticHead === "pending"
                  ? "pending-precommit"
                  : "active-v1.17-bootstrap",
              revision: options.semanticHead === "pending" ? "1" : "0",
              active_selection: ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION,
              active_selection_root:
                ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION_ROOT,
              pending_intent: options.semanticHead === "pending" ? {} : null,
              finalization: null,
              compensation: null,
            },
          ],
        }
      }
      if (normalized.startsWith("select * from arena_catalog_entries")) {
        const arena = CANONICAL_ARENA_CATALOG_V1_37.arenas.find(
          ({ id }) => id === values[1],
        )!
        return {
          rows: [
            {
              catalog_version: values[0],
              arena_id: arena.id,
              arena_version: arena.version,
              arena_name: arena.name,
              arena_status: arena.status,
              schedulable: arena.schedulable,
              alias_of_arena_id: arena.aliasOf ?? null,
              geometry_hash_profile: "arena-semantic-geometry-v1",
              semantic_geometry_hash: arena.semanticGeometryHash,
              config: arena,
            },
          ],
        }
      }
      if (
        normalized.startsWith(
          "select evidence.* from strategy_revision_v1_19_revalidations",
        )
      ) {
        const revisionId = String(values[0])
        const side = revisionId.endsWith(":0") ? "a" : "b"
        const namespace = revisionId.replace(/:revision:[01]$/u, "")
        const evidence = candidateEntrant(side, namespace)
        if (options.omitCandidateAdmissionSide === side) {
          return { rows: [] }
        }
        return {
          rows: [
            {
              id: `${namespace}:revalidation:${side}`,
              strategy_revision_id: evidence.strategyRevisionId,
              source_hash: sha256(`${namespace}:source:${side}`),
              source_bytes: 64,
              artifact_sha256: `sha256:${evidence.laneIdentity.artifactSha256}`,
              artifact_bytes: 128,
              language_id: evidence.laneIdentity.languageId,
              provider_id: evidence.laneIdentity.providerId,
              lane_id: evidence.laneIdentity.adapterId,
              runtime_abi_version: "strategy-runtime-abi-v1.19",
              semantic_runtime_version: "runtime-v1.19",
              semantic_tuple_id: CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID,
              execution_request_root: `sha256:${sha256(`${namespace}:request:${side}`)}`,
              execution_result_root: `sha256:${sha256(`${namespace}:result:${side}`)}`,
              execution_receipt_root: `sha256:${sha256(`${namespace}:receipt:${side}`)}`,
              reviewed_certificate_id:
                evidence.conformanceCertificateRef!.certificateId,
              reviewed_certificate_sha256: `sha256:${evidence.conformanceCertificateRef!.certificateRecordHash}`,
            },
          ],
        }
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

const seedRuntimeEvidenceCertificate = async (
  client: PoolClient,
  evidence: RuntimeEntrantExecutionEvidence,
  kind: "containment" | "conformance",
  namespace: string,
  index: number,
): Promise<void> => {
  const reference =
    kind === "containment"
      ? evidence.containmentCertificateRef
      : evidence.conformanceCertificateRef!
  const producer = `${namespace}:producer:${kind}:${index}`
  const command = `${namespace}:command:${kind}:${index}`
  const graphHash = sha256(`${namespace}:graph:${kind}:${index}`)
  const attestationId = `${namespace}:attestation:${kind}:${index}`
  const laneHash = hashEntrantLaneIdentity(evidence.laneIdentity)
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
      evidence.laneIdentity.semanticTupleId,
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
  it("generates one exact candidate scenario with four explicit rows and no seed suffix fairness", () => {
    const matches = generateCandidatePresetMatrixV119({
      id: "candidate:preset-set",
      semanticAuthorityKey: "runtime-v1.19",
      presetId: "smoke-v1",
      bottomStrategyRevisionId: "candidate:revision:a",
      topStrategyRevisionId: "candidate:revision:b",
      bottomPlayerId: "candidate:player:a",
      topPlayerId: "candidate:player:b",
    })
    expect(matches).toHaveLength(4)
    expect(new Set(matches.map(({ scenarioId }) => scenarioId))).toHaveLength(1)
    expect(new Set(matches.map(({ seed }) => seed))).toEqual(
      new Set(["seed:smoke:001"]),
    )
    expect(matches.map(({ conditionOrdinal }) => conditionOrdinal)).toEqual([
      0, 1, 2, 3,
    ])
    expect(
      matches.filter(
        ({ bottomStrategyRevisionId }) =>
          bottomStrategyRevisionId === "candidate:revision:a",
      ),
    ).toHaveLength(2)
    expect(
      matches.filter(
        ({ initialInitiativePlayerId }) =>
          initialInitiativePlayerId === "candidate:player:a",
      ),
    ).toHaveLength(2)
    expect(matches.some(({ seed }) => seed.includes("mirror"))).toBe(false)
  })

  it("freezes candidate revisions and catalog before atomically publishing exactly four jobs", async () => {
    const fake = fakeDatabase()
    const input = candidateInput()
    await expect(
      createMatchSetService(fake.pool).createFromMatrix(input),
    ).resolves.toEqual({
      matchSetId: input.id,
      matchIds: input.matches.map(({ id }) => id),
    })

    expect(fake.calls.at(0)?.sql).toBe("begin isolation level serializable")
    const firstWrite = fake.calls.findIndex((call) =>
      call.sql.startsWith("insert into match_sets"),
    )
    const catalogLock = fake.calls.findIndex((call) =>
      call.sql.startsWith("select * from arena_catalog_entries"),
    )
    const admissionLocks = fake.calls
      .map((call, index) => ({ call, index }))
      .filter(({ call }) =>
        call.sql.startsWith(
          "select evidence.* from strategy_revision_v1_19_revalidations",
        ),
      )
    expect(catalogLock).toBeGreaterThanOrEqual(0)
    expect(catalogLock).toBeLessThan(firstWrite)
    expect(admissionLocks).toHaveLength(2)
    expect(admissionLocks.every(({ index }) => index < firstWrite)).toBe(true)
    expect(
      fake.calls.filter((call) =>
        call.sql.startsWith("insert into set_scenarios"),
      ),
    ).toHaveLength(1)
    expect(
      fake.calls.filter((call) =>
        call.sql.startsWith("insert into set_conditions"),
      ),
    ).toHaveLength(4)
    expect(
      fake.calls.filter((call) => call.sql.startsWith("insert into matches")),
    ).toHaveLength(4)
    expect(
      fake.calls.filter((call) =>
        call.sql.startsWith("insert into match_jobs"),
      ),
    ).toHaveLength(4)
    expect(fake.calls.at(-1)?.sql).toBe("commit")
  })

  it.each([
    ["missing", (input: CreateMatchSetFromMatrixInput) => input.matches.pop()],
    [
      "duplicate",
      (input: CreateMatchSetFromMatrixInput) => {
        input.matches[3] = { ...input.matches[2]! }
      },
    ],
    [
      "substituted initiative",
      (input: CreateMatchSetFromMatrixInput) => {
        input.matches[1] = {
          ...input.matches[1]!,
          initialInitiativePlayerId: input.matches[1]!.bottomPlayerId,
        } as CreateMatchRecordInputV119
      },
    ],
    [
      "old tuple",
      (input: CreateMatchSetFromMatrixInput) => {
        input.integrityIdentity.compatibility = {
          tupleId: tuple.tupleId,
          tuple: { ...tuple.tuple },
        }
      },
    ],
  ] as const)(
    "rejects candidate %s before the first SQL statement",
    async (_, mutate) => {
      const fake = fakeDatabase()
      const input = candidateInput()
      mutate(input)
      await expect(
        insertMatchSetWithMatrixOnClient(fake.client, input),
      ).rejects.toThrow()
      expect(fake.calls).toEqual([])
    },
  )

  it("rolls back without candidate rows when exact revision admission is absent", async () => {
    const fake = fakeDatabase("", { omitCandidateAdmissionSide: "a" })
    await expect(
      createMatchSetService(fake.pool).createFromMatrix(candidateInput()),
    ).rejects.toThrow(/admission evidence/iu)
    expect(
      fake.calls.some((call) => call.sql.startsWith("insert into match_sets")),
    ).toBe(false)
    expect(fake.calls.at(-1)?.sql).toBe("rollback")
  })

  it("rolls back every candidate write family after a forced late job failure", async () => {
    const fake = fakeDatabase("insert into match_jobs")
    await expect(
      createMatchSetService(fake.pool).createFromMatrix(candidateInput()),
    ).rejects.toThrow("forced late child failure")
    expect(
      fake.calls.some((call) =>
        call.sql.startsWith("insert into set_scenarios"),
      ),
    ).toBe(true)
    expect(
      fake.calls.some((call) =>
        call.sql.startsWith("insert into set_conditions"),
      ),
    ).toBe(true)
    expect(fake.calls.at(-1)?.sql).toBe("rollback")
  })

  it.each([2, 3, 8])(
    "resolves complete fixture-domain evidence for %i heterogeneous entrants without collapsing languages",
    async (count) => {
      const bindings = Array.from({ length: count }, (_, index) => ({
        entrantKey: `fixture:entrant:${index}`,
        strategyRevisionId: `fixture:revision:${index}`,
      }))
      const resolved = await resolveMatchSetExecutionEvidence({
        resolver: createFixtureMatchSetEvidenceResolver({
          languageIdsByRevision: Object.fromEntries(
            bindings.map((binding, index) => [
              binding.strategyRevisionId,
              languages[index % languages.length]!,
            ]),
          ),
        }),
        purpose: "exhibition",
        evaluationInstant: "2026-07-12T12:00:00.000Z",
        entrants: bindings,
      })

      expect(Object.keys(resolved.executionEntrants)).toEqual(
        bindings.map((binding) => binding.entrantKey),
      )
      expect(
        Object.values(resolved.executionEntrants).map(
          (evidence) => evidence.laneIdentity.languageId,
        ),
      ).toEqual(
        Array.from(
          { length: count },
          (_, index) => languages[index % languages.length],
        ),
      )
    },
  )

  it("rejects one missing entrant and fixture-domain counted scheduling before SQL", async () => {
    const resolver = createFixtureMatchSetEvidenceResolver({
      omitStrategyRevisionIds: ["fixture:revision:1"],
    })
    const entrants = [0, 1].map((index) => ({
      entrantKey: `fixture:entrant:${index}`,
      strategyRevisionId: `fixture:revision:${index}`,
    }))
    await expect(
      resolveMatchSetExecutionEvidence({
        resolver,
        purpose: "exhibition",
        evaluationInstant: "2026-07-12T12:00:00.000Z",
        entrants,
      }),
    ).rejects.toThrow(/coverage|missing/iu)
    await expect(
      resolveMatchSetExecutionEvidence({
        resolver: createFixtureMatchSetEvidenceResolver(),
        purpose: "counted",
        evaluationInstant: "2026-07-12T12:00:00.000Z",
        entrants,
      }),
    ).rejects.toThrow(/fixture.*counted/iu)
  })

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
        genericEntrants.map(
          (call) =>
            (call.values.at(-2) as RuntimeEntrantExecutionEvidence).laneIdentity
              .languageId,
        ),
      ).toEqual(
        Array.from(
          { length: count },
          (_, index) => languages[index % languages.length],
        ),
      )
      for (const [index, match] of matches.entries()) {
        expect(match.values.slice(-7)).toEqual(jobs[index]!.values.slice(-7))
        expect(match.values.at(-6)).toBe(input.matches[index]!.bottomEntrantKey)
        expect(match.values.at(-5)).toBe(input.matches[index]!.topEntrantKey)
      }
      expect(fake.calls.at(0)?.sql).toBe("begin")
      expect(fake.calls.at(-1)?.sql).toBe("commit")
    },
  )

  it("locks the exact default head and freezes the complete selection through all work rows", async () => {
    const fake = fakeDatabase()
    await createMatchSetService(fake.pool).createFromMatrix(inputFor(2))

    const headRead = fake.calls.find((call) =>
      call.sql.includes("from semantic_authority_selection_head"),
    )
    const matchSetInsert = fake.calls.find((call) =>
      call.sql.startsWith("insert into match_sets"),
    )!
    const matchInsert = fake.calls.find((call) =>
      call.sql.startsWith("insert into matches"),
    )!
    const jobInsert = fake.calls.find((call) =>
      call.sql.startsWith("insert into match_jobs"),
    )!
    expect(headRead?.sql).toContain("for update")
    expect(matchSetInsert.sql).toContain("semantic_authority_selection")
    expect(matchSetInsert.values).toContainEqual(
      ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION,
    )
    expect(matchSetInsert.values).toContain(
      ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION_ROOT,
    )
    expect(matchInsert.values).toContain(
      ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION_ROOT,
    )
    expect(jobInsert.values).toContain(
      ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION_ROOT,
    )
  })

  it("freezes the explicit candidate selection without consulting the current head", async () => {
    const fake = fakeDatabase()
    await createMatchSetService(fake.pool).createFromMatrix(candidateInput())

    expect(
      fake.calls.some((call) =>
        call.sql.includes("from semantic_authority_selection_head"),
      ),
    ).toBe(false)
    const matchSetInsert = fake.calls.find((call) =>
      call.sql.startsWith("insert into match_sets"),
    )!
    expect(matchSetInsert.values).toContainEqual(
      REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION,
    )
    expect(matchSetInsert.values).toContain(
      REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION_ROOT,
    )
  })

  it.each(["absent", "pending", "file-mismatch"] as const)(
    "fails closed before work writes when the default semantic head is %s",
    async (semanticHead) => {
      const fake = fakeDatabase("", { semanticHead })
      await expect(
        createMatchSetService(fake.pool).createFromMatrix(inputFor(2)),
      ).rejects.toThrow()
      expect(
        fake.calls.some((call) =>
          call.sql.startsWith("insert into match_sets"),
        ),
      ).toBe(false)
      expect(fake.calls.at(-1)?.sql).toBe("rollback")
    },
  )

  it.each([
    [
      "missing",
      (input: CreateMatchSetFromMatrixInput) => {
        delete (
          input.integrityIdentity.executionEntrants as Record<string, unknown>
        )["fixture:entrant:1"]
      },
    ],
    [
      "extra",
      (input: CreateMatchSetFromMatrixInput) => {
        ;(input.integrityIdentity.executionEntrants as Record<string, unknown>)[
          "fixture:entrant:extra"
        ] = entrant(7)
      },
    ],
    [
      "wrong revision",
      (input: CreateMatchSetFromMatrixInput) => {
        const evidence =
          input.integrityIdentity.executionEntrants["fixture:entrant:1"]!
        ;(input.integrityIdentity.executionEntrants as Record<string, unknown>)[
          "fixture:entrant:1"
        ] = { ...evidence, strategyRevisionId: "fixture:revision:wrong" }
      },
    ],
    [
      "swapped side",
      (input: CreateMatchSetFromMatrixInput) => {
        input.matches[0] = {
          ...input.matches[0]!,
          bottomEntrantKey: input.matches[0]!.topEntrantKey,
        }
      },
    ],
    [
      "stale",
      (input: CreateMatchSetFromMatrixInput) => {
        const evidence =
          input.integrityIdentity.executionEntrants["fixture:entrant:1"]!
        ;(input.integrityIdentity.executionEntrants as Record<string, unknown>)[
          "fixture:entrant:1"
        ] = {
          ...evidence,
          schedulingDecision: {
            ...evidence.schedulingDecision,
            freshUntil: "2020-01-01T00:00:00.000Z",
          },
        }
      },
    ],
  ] as const)(
    "rejects %s evidence before the first SQL statement",
    async (_, mutate) => {
      const fake = fakeDatabase()
      const input = inputFor(2)
      mutate(input)
      await expect(
        insertMatchSetWithMatrixOnClient(fake.client, input),
      ).rejects.toThrow()
      expect(fake.calls).toEqual([])
    },
  )

  it("rolls the complete matrix back after a forced late child failure", async () => {
    const fake = fakeDatabase("insert into match_jobs")
    await expect(
      createMatchSetService(fake.pool).createFromMatrix(inputFor(3)),
    ).rejects.toThrow("forced late child failure")
    expect(
      fake.calls.some((call) => call.sql.startsWith("insert into match_sets")),
    ).toBe(true)
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
            : evidence.conformanceCertificateRef!
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
      `select compatibility_tuple_id, execution_evidence_set,
              execution_evidence_set_hash
         from match_sets where id = $1`,
      [postgresInput.id],
    )
    const executionEntrants = await client.query(
      `select entrant_key, strategy_revision_id, execution_snapshot
         from match_set_execution_entrants
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
              m.bottom_execution_evidence, m.top_execution_evidence,
              j.bottom_execution_entrant_key as job_bottom,
              j.top_execution_entrant_key as job_top,
              j.execution_evidence_pair_hash as job_hash,
              j.bottom_execution_evidence as job_bottom_evidence,
              j.top_execution_evidence as job_top_evidence
         from matches m join match_jobs j on j.match_id = m.id
        where m.integrity_match_set_id = $1 order by m.id`,
      [postgresInput.id],
    )

    expect(matchSet.rows).toEqual([
      expect.objectContaining({
        compatibility_tuple_id: tuple.tupleId,
        execution_evidence_set: expect.arrayContaining(
          Object.values(postgresInput.integrityIdentity.executionEntrants),
        ),
        execution_evidence_set_hash: expect.stringMatching(/^[0-9a-f]{64}$/u),
      }),
    ])
    expect(executionEntrants.rows).toHaveLength(4)
    for (const row of executionEntrants.rows) {
      expect(row.execution_snapshot).toEqual(
        postgresInput.integrityIdentity.executionEntrants[row.entrant_key],
      )
    }
    expect(
      competitionEntrants.rows.map((row) => row.execution_entrant_key),
    ).toEqual(Object.keys(postgresInput.integrityIdentity.executionEntrants))
    expect(pairs.rows).toHaveLength(postgresInput.matches.length)
    for (const pair of pairs.rows) {
      expect(pair.bottom_execution_entrant_key).toBe(pair.job_bottom)
      expect(pair.top_execution_entrant_key).toBe(pair.job_top)
      expect(pair.execution_evidence_pair_hash).toBe(pair.job_hash)
      expect(pair.bottom_execution_evidence).toEqual(pair.job_bottom_evidence)
      expect(pair.top_execution_evidence).toEqual(pair.job_top_evidence)
    }
  })

  it("keeps every record family at zero for rejected PostgreSQL input", async () => {
    const rejected = inputFor(2, `${namespace}:rejected`)
    delete (
      rejected.integrityIdentity.executionEntrants as Record<string, unknown>
    )[`${namespace}:rejected:entrant:1`]
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

describePostgres("PostgreSQL runtime-v1.19 atomic scenario creation", () => {
  let pool: Pool
  let client: PoolClient
  const namespace = `candidate:${randomUUID()}`
  const input = candidateInput(namespace)

  beforeAll(async () => {
    pool = createDatabasePool({ connectionString: databaseUrl! })
    await migrate(pool)
    await createRepositories(pool).installReleasedArenaCatalog(
      CANONICAL_ARENA_CATALOG_V1_37,
    )
    client = await pool.connect()
    await client.query("begin isolation level serializable")
    await client.query(
      "insert into users (id, display_name) values ($1, 'Candidate owner')",
      [`${namespace}:user`],
    )
    await client.query(
      "insert into strategies (id, owner_user_id, name) values ($1, $2, 'Candidate')",
      [`${namespace}:strategy`, `${namespace}:user`],
    )
    const smoke = CANONICAL_ARENA_CATALOG_V1_37.arenas.find(
      ({ id }) => id === "arena:smoke:v1",
    )!
    await client.query(
      `insert into arena_variants (id, name, config)
       values ($1, $2, $3) on conflict (id) do nothing`,
      [smoke.id, smoke.name, smoke],
    )

    for (const side of ["a", "b"] as const) {
      const evidence = candidateEntrant(side, namespace)
      const revisionIndex = side === "a" ? 0 : 1
      await client.query(
        `insert into strategy_revisions (
           id, strategy_id, source, source_hash, source_bytes, runtime,
           engine_compatibility, validation, metadata, compiled_artifact,
           locked_at
         ) values (
           $1, $2, 'return', $3, 64, $4, '{}'::jsonb,
           '{"valid":true}'::jsonb, $5, $6, now()
         )`,
        [
          evidence.strategyRevisionId,
          `${namespace}:strategy`,
          sha256(`${namespace}:source:${side}`),
          { language: { id: "typescript" } },
          {
            providerValidation: {
              providerId: evidence.laneIdentity.providerId,
              artifactBytes: 128,
            },
            sourceArtifact: {
              artifactHash: `sha256:${evidence.laneIdentity.artifactSha256}`,
              bytes: 128,
            },
          },
          {
            hash: `sha256:${evidence.laneIdentity.artifactSha256}`,
            bytes: 128,
            revisionIndex,
          },
        ],
      )
      await seedRuntimeEvidenceCertificate(
        client,
        evidence,
        "containment",
        namespace,
        revisionIndex,
      )
      await seedRuntimeEvidenceCertificate(
        client,
        evidence,
        "conformance",
        namespace,
        revisionIndex,
      )
      await createRepositories(client).appendStrategyRevisionV119Revalidation({
        id: `${namespace}:revalidation:${side}`,
        strategyRevisionId: evidence.strategyRevisionId,
        sourceHash: sha256(`${namespace}:source:${side}`),
        sourceBytes: 64,
        artifactSha256: `sha256:${evidence.laneIdentity.artifactSha256}`,
        artifactBytes: 128,
        languageId: "typescript",
        providerId: evidence.laneIdentity.providerId,
        laneId: evidence.laneIdentity.adapterId,
        runtimeAbiVersion: "strategy-runtime-abi-v1.19",
        semanticRuntimeVersion: "runtime-v1.19",
        semanticTupleId: CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID,
        executionKind: "real_service_execution",
        syntheticEvidence: false,
        executionRequestRoot: `sha256:${sha256(`${namespace}:request:${side}`)}`,
        executionResultRoot: `sha256:${sha256(`${namespace}:result:${side}`)}`,
        executionReceiptRoot: `sha256:${sha256(`${namespace}:receipt:${side}`)}`,
        serviceReceiptVersion: "runtime-semantic-receipt-v1.19",
        reviewedCertificateId:
          evidence.conformanceCertificateRef!.certificateId,
        reviewedCertificateSha256: `sha256:${evidence.conformanceCertificateRef!.certificateRecordHash}`,
        reviewStatus: "reviewed",
        evidenceStatus: "passed",
        evidenceCreatedAt: "2026-07-17T00:00:00.000Z",
      })
    }
  })

  afterAll(async () => {
    await client.query("rollback").catch(() => undefined)
    client.release()
    await pool.end()
  })

  it("persists the exact four conditions, successor Match identity, and jobs together", async () => {
    await insertMatchSetWithMatrixOnClient(client, input)
    const counts = await client.query(
      `select
         (select count(*) from set_scenarios where match_set_id = $1)::integer as scenarios,
         (select count(*) from set_conditions where match_set_id = $1)::integer as conditions,
         (select count(*) from matches where successor_match_set_id = $1)::integer as matches,
         (select count(*) from match_jobs where integrity_match_set_id = $1)::integer as jobs`,
      [input.id],
    )
    expect(counts.rows[0]).toEqual({
      scenarios: 1,
      conditions: 4,
      matches: 4,
      jobs: 4,
    })
    const rows = await client.query(
      `select successor_condition_ordinal, seed, bottom_player_id,
              top_player_id, initial_initiative_player_id,
              successor_arena_semantic_geometry_hash
         from matches where successor_match_set_id = $1
         order by successor_condition_ordinal`,
      [input.id],
    )
    expect(
      rows.rows.map(
        ({ successor_condition_ordinal }) => successor_condition_ordinal,
      ),
    ).toEqual([0, 1, 2, 3])
    expect(new Set(rows.rows.map(({ seed }) => seed))).toEqual(
      new Set([`${namespace}:base-seed:001`]),
    )
    expect(
      rows.rows.filter(
        ({ initial_initiative_player_id }) =>
          initial_initiative_player_id === `${namespace}:player:a`,
      ),
    ).toHaveLength(2)
  })

  it("rolls back a complete second candidate after revision evidence revocation", async () => {
    await createRepositories(client).revokeStrategyRevisionV119Revalidation({
      id: `${namespace}:revocation:a`,
      revalidationId: `${namespace}:revalidation:a`,
      reasonCode: "TEST_REVOKED",
      evidenceRoot: `sha256:${sha256(`${namespace}:revocation-root:a`)}`,
    })
    await expect(
      insertMatchSetWithMatrixOnClient(client, {
        ...input,
        id: `${namespace}:revoked-set`,
        matches: input.matches.map((match, index) => ({
          ...match,
          id: `${namespace}:revoked-match:${index}` as MatchId,
        })),
      }),
    ).rejects.toThrow(/admission evidence/iu)
    const counts = await client.query(
      `select
         (select count(*) from match_sets where id = $1)::integer as match_sets,
         (select count(*) from set_scenarios where match_set_id = $1)::integer as scenarios,
         (select count(*) from set_conditions where match_set_id = $1)::integer as conditions,
         (select count(*) from matches where successor_match_set_id = $1)::integer as matches,
         (select count(*) from match_jobs where integrity_match_set_id = $1)::integer as jobs`,
      [`${namespace}:revoked-set`],
    )
    expect(counts.rows[0]).toEqual({
      match_sets: 0,
      scenarios: 0,
      conditions: 0,
      matches: 0,
      jobs: 0,
    })
  })
})
