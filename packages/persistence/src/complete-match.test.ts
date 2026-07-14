import { Buffer } from "node:buffer"
import { createHash, randomUUID } from "node:crypto"
import {
  MATCH_KERNEL,
  type GameState,
  type StrategyRuntime,
} from "@cowards/engine"
import {
  recordChronicleFromExecution,
  type ChronicleBoundaryAnchor,
  type ChronicleRecorderExecution,
} from "@cowards/replay"
import {
  CANONICAL_COMPATIBILITY_TUPLES,
  type Chronicle,
  type ExecutableLaneIdentity,
  type RuntimeEntrantExecutionEvidence,
  type RuntimeExecutionResolvedEvidenceSnapshot,
} from "@cowards/spec"
import { Pool } from "pg"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import {
  MatchCompletionIntegritySystemFailure,
  admitCurrentMatchCompletion,
  completeMatch,
  deriveMatchCompletionFields,
  validateCompletionIntegritySnapshot,
} from "./complete-match.js"
import { migrate } from "./migrations.js"
import {
  createMatchExecutionEvidencePair,
  createMatchSetIntegrityIdentity,
  hashEntrantLaneIdentity,
  matchExecutionEvidencePairSqlValues,
  matchSetExecutionEntrantSqlValues,
  matchSetIntegritySqlValues,
  type MatchExecutionEvidencePair,
  type MatchSetIntegrityIdentity,
} from "./integrity-evidence.js"

const tuple = CANONICAL_COMPATIBILITY_TUPLES[0]!
const sha256 = (value: string): string =>
  createHash("sha256").update(value).digest("hex")

const lane = (
  side: "bottom" | "top",
  namespace: string,
): ExecutableLaneIdentity => ({
  providerId: `${namespace}:provider:${side}`,
  languageId: side === "bottom" ? "typescript" : "python",
  runtimeId: `${namespace}:runtime:${side}`,
  runtimeVersion: "1",
  toolchainId: `${namespace}:toolchain:${side}`,
  toolchainVersion: "1",
  adapterId: `${namespace}:adapter:${side}`,
  adapterVersion: "1",
  policyId: `${namespace}:policy`,
  policyVersion: "1",
  corpusId: `${namespace}:corpus`,
  corpusVersion: "1",
  artifactId: `${namespace}:artifact:${side}`,
  artifactSha256: sha256(`${namespace}:artifact:${side}`),
  implementationId: `${namespace}:implementation:${side}`,
  buildId: `${namespace}:build:${side}`,
  semanticTupleId: tuple.tupleId,
  semanticTuple: { ...tuple.tuple },
})

const entrant = (
  side: "bottom" | "top",
  namespace: string,
): RuntimeEntrantExecutionEvidence => ({
  entrantKey: `${namespace}:entrant:${side}`,
  strategyRevisionId: `${namespace}:revision:${side}`,
  laneIdentity: lane(side, namespace),
  containmentCertificateRef: {
    kind: "containment",
    certificateId: `${namespace}:certificate:containment:${side}`,
    certificateVersion: "runtime-certificate-v1",
    certificateRecordHash: sha256(`${namespace}:containment:${side}`),
    registryGeneration: "1",
  },
  conformanceCertificateRef: {
    kind: "conformance",
    certificateId: `${namespace}:certificate:conformance:${side}`,
    certificateVersion: "runtime-certificate-v1",
    certificateRecordHash: sha256(`${namespace}:conformance:${side}`),
    registryGeneration: "1",
  },
  schedulingDecision: {
    status: "counted",
    reasonCode: "EVIDENCE_CURRENT",
    evaluatedAt: "2026-07-12T12:00:00.000Z",
    freshUntil: "2099-08-12T12:00:00.000Z",
    registryGeneration: "1",
  },
})

const completionIdentity = (namespace: string) => {
  const entrants = [entrant("bottom", namespace), entrant("top", namespace)]
  const identity = createMatchSetIntegrityIdentity({
    compatibility: { tupleId: tuple.tupleId, tuple: { ...tuple.tuple } },
    authorityBundleHash: sha256(`${namespace}:bundle`),
    registryGeneration: "1",
    expectedEntrants: entrants.map((entry) => ({
      entrantKey: entry.entrantKey,
      strategyRevisionId: entry.strategyRevisionId,
    })),
    entrants,
  })
  const pair = createMatchExecutionEvidencePair(identity, {
    bottomEntrantKey: `${namespace}:entrant:bottom`,
    topEntrantKey: `${namespace}:entrant:top`,
    bottomStrategyRevisionId: `${namespace}:revision:bottom`,
    topStrategyRevisionId: `${namespace}:revision:top`,
  })
  return { identity, pair }
}

const responseSnapshot = (
  identity: Readonly<MatchSetIntegrityIdentity>,
  pair: Readonly<MatchExecutionEvidencePair>,
): RuntimeExecutionResolvedEvidenceSnapshot => ({
  compatibility: identity.compatibility,
  authorityBundleHash: identity.authorityBundleHash,
  registryGeneration: identity.registryGeneration,
  entrants: { bottom: pair.bottom, top: pair.top },
})

const builtMatch = (
  namespace: string,
  seed = `${namespace}:seed`,
  runtimeOverride?: StrategyRuntime,
): {
  chronicle: Chronicle
  finalState: GameState
  execution: ChronicleRecorderExecution
  boundaryAnchors: readonly ChronicleBoundaryAnchor[]
} => {
  const runtime: StrategyRuntime = runtimeOverride ?? {
    selectActivations(input) {
      return {
        ok: true,
        value: {
          activationOrders: input.mySoldiers
            .filter(({ status }) => status === "ACTIVE")
            .slice(0, input.activationCount)
            .map(({ id }) => ({ soldierId: id })),
          strategyMemory: input.strategyMemory,
        },
      }
    },
    runSoldierBrain(input) {
      return {
        ok: true,
        value: {
          action: { type: "TURN_TO_STONE" },
          soldierMemory: input.soldierMemory,
        },
      }
    },
  }
  const execution = MATCH_KERNEL.runMatch({
    matchId: `${namespace}:match`,
    seed,
    arenaVariant: {
      id: `${namespace}:arena`,
      name: "Completion integrity",
      initialBounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
      terrainStones: [],
    },
    bottomPlayerId: "player:bottom",
    topPlayerId: "player:top",
    bottomStrategyRevisionId: `${namespace}:revision:bottom`,
    topStrategyRevisionId: `${namespace}:revision:top`,
    runtime,
  })
  const recorded = recordChronicleFromExecution({
    execution,
    metadata: {
      schemaVersion: "chronicle-v1.4",
      semanticTupleId: tuple.tupleId,
      semanticTuple: tuple.tuple,
    },
  })
  if (!recorded.ok) throw new Error(recorded.failure.code)
  return {
    chronicle: recorded.chronicle,
    finalState: recorded.finalState,
    execution,
    boundaryAnchors: recorded.boundaryAnchors,
  }
}

const finalState = {
  matchId: "match:complete:001",
  seed: "seed:complete:001",
  versions: {
    spec: "1.0.0",
    engine: "0.1.0",
    runtimeJs: "0.1.0",
    chronicle: "0.1.0",
    strategyRevision: "0.1.0",
    arenaVariant: "0.1.0",
  },
  arenaVariant: {
    id: "arena:smoke:v1",
    name: "Smoke",
    initialBounds: { minX: 0, maxX: 4, minY: 0, maxY: 4 },
    terrainStones: [],
  },
  players: [
    {
      id: "player:bottom",
      side: "bottom",
      strategyRevisionId: "strategy-revision:bottom",
      strategyMemory: {},
    },
    {
      id: "player:top",
      side: "top",
      strategyRevisionId: "strategy-revision:top",
      strategyMemory: {},
    },
  ],
  phase: "COMPLETE",
  phaseNumber: 2,
  roundNumber: 3,
  activationCount: 4,
  initiativePlayerId: "player:bottom",
  bounds: { minX: 0, maxX: 4, minY: 0, maxY: 4 },
  soldiers: [
    {
      id: "soldier:1",
      ownerPlayerId: "player:bottom",
      status: "ACTIVE",
      position: { x: 1, y: 1 },
      facing: "UP",
      lastSuccessfulMoveDirection: null,
      soldierMemory: {},
    },
    {
      id: "soldier:2",
      ownerPlayerId: "player:top",
      status: "FALLEN",
      position: null,
      facing: null,
      lastSuccessfulMoveDirection: null,
      soldierMemory: {},
    },
  ],
  terrainStones: [],
  outcome: { type: "WIN", winnerPlayerId: "player:bottom" },
} satisfies GameState

describe("Match completion fields", () => {
  it("derives outcome, winner, surviving_soldiers, and survival_turns", () => {
    expect(deriveMatchCompletionFields(finalState)).toEqual({
      matchId: "match:complete:001",
      outcome: { type: "WIN", winnerPlayerId: "player:bottom" },
      winnerPlayerId: "player:bottom",
      survivingSoldiers: 1,
      bottomSurvivingSoldiers: 1,
      topSurvivingSoldiers: 0,
      survivalTurns: 48,
      bottomSurvivalTurns: 48,
      topSurvivalTurns: 48,
    })
  })
})

describe("current Match completion semantic admission", () => {
  it("rejects a Chronicle/final-state pair without execution and boundary anchors", () => {
    const built = builtMatch("completion:semantic-binding")
    expect(() =>
      admitCurrentMatchCompletion({
        chronicle: built.chronicle,
        finalState: {
          ...built.finalState,
          phaseNumber: built.finalState.phaseNumber + 1,
        },
        compatibility: {
          tupleId: tuple.tupleId,
          tuple: tuple.tuple,
        },
        execution: undefined,
        boundaryAnchors: undefined,
      }),
    ).toThrow(/execution|boundary|semantic|reconstruct/iu)
  })
})

describe("Match completion integrity identity", () => {
  it("accepts the exact heterogeneous pair and rejects every side's response drift as system failure", () => {
    const { identity, pair } = completionIdentity("completion:unit")
    const exact = responseSnapshot(identity, pair)

    expect(() =>
      validateCompletionIntegritySnapshot({ identity, pair }, exact),
    ).not.toThrow()

    const cases: RuntimeExecutionResolvedEvidenceSnapshot[] = [
      {
        ...exact,
        entrants: { bottom: exact.entrants.top, top: exact.entrants.bottom },
      },
      {
        ...exact,
        entrants: {
          ...exact.entrants,
          bottom: {
            ...exact.entrants.bottom,
            schedulingDecision: {
              ...exact.entrants.bottom.schedulingDecision,
              freshUntil: "2026-07-12T12:00:00.000Z",
            },
          },
        },
      },
      {
        ...exact,
        entrants: {
          ...exact.entrants,
          top: {
            ...exact.entrants.top,
            schedulingDecision: {
              ...exact.entrants.top.schedulingDecision,
              status: "disabled",
              reasonCode: "CONFORMANCE_REVOKED",
            },
          },
        },
      },
      {
        ...exact,
        registryGeneration: "2",
      },
      {
        ...exact,
        entrants: {
          ...exact.entrants,
          bottom: {
            ...exact.entrants.bottom,
            containmentCertificateRef: {
              ...exact.entrants.bottom.containmentCertificateRef!,
              certificateRecordHash: sha256("stale-bottom-certificate"),
            },
          },
        },
      },
      {
        ...exact,
        entrants: {
          ...exact.entrants,
          top: {
            ...exact.entrants.top,
            laneIdentity: {
              ...exact.entrants.top.laneIdentity,
              buildId: "mixed-top-build",
            },
          },
        },
      },
    ]

    for (const candidate of cases) {
      try {
        validateCompletionIntegritySnapshot({ identity, pair }, candidate)
        throw new Error("expected integrity failure")
      } catch (error) {
        expect(error).toBeInstanceOf(MatchCompletionIntegritySystemFailure)
        expect(error).toMatchObject({
          code: "EVIDENCE_IDENTITY_MISMATCH",
          failureCategory: "system_failure",
          playerPenalty: false,
          retryable: true,
        })
      }
    }
  })
})

const seedCertificateAuthority = async (
  pool: Pool,
  namespace: string,
  evidence: Readonly<RuntimeEntrantExecutionEvidence>,
  index: number,
): Promise<void> => {
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
    await pool.query(
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
    await pool.query(
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

const seedCompletionMatch = async (
  pool: Pool,
  namespace: string,
  identity: Readonly<MatchSetIntegrityIdentity>,
  pair: Readonly<MatchExecutionEvidencePair>,
): Promise<void> => {
  const matchSetId = `${namespace}:match-set`
  const matchId = `${namespace}:match`
  const jobId = `${namespace}:job`
  const values = matchSetIntegritySqlValues(identity)
  const publicationId = `${namespace}:publication`
  const receiptId = `${namespace}:install-receipt`
  const envelopeSha256 = `sha256:${sha256(`${namespace}:envelope`)}`
  const sourceManifestHash = `sha256:${sha256(`${namespace}:sources`)}`
  const sourceSet = {
    attestationIds: [],
    certificateIds: identity.normalizedEntrants.flatMap((evidence) => [
      evidence.containmentCertificateRef.certificateId,
      evidence.conformanceCertificateRef!.certificateId,
    ]),
    revocationIds: [],
    supersessionIds: [],
    laneControlIds: [],
  }
  await pool.query(
    "insert into users (id, display_name) values ($1, 'Completion integrity')",
    [`${namespace}:user`],
  )
  await pool.query(
    "insert into strategies (id, owner_user_id, name) values ($1, $2, 'Completion integrity')",
    [`${namespace}:strategy`, `${namespace}:user`],
  )
  for (const [index, evidence] of identity.normalizedEntrants.entries()) {
    await pool.query(
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
    await seedCertificateAuthority(pool, namespace, evidence, index)
  }
  await pool.query(
    "insert into arena_variants (id, name, config) values ($1, 'Completion integrity', '{}'::jsonb)",
    [`${namespace}:arena`],
  )
  await pool.query(
    `insert into runtime_evidence_authority_publications (
       id, generation, semantic_tuple_manifest_hash, source_manifest_hash,
       payload_sha256, envelope_sha256, signer_key_id, trust_domain,
       issued_at, valid_from, valid_until, payload_bytes, envelope_bytes,
       attestation_ids, certificate_ids, revocation_ids, supersession_ids,
       lane_control_ids
     ) values ($1, 1, $2, $3, $4, $5, 'fixture-key', 'fixture',
       '2026-07-12T12:00:00Z', '2026-07-12T12:00:00Z',
       '2099-08-12T12:00:00Z', $6, $7, '[]'::jsonb, $8::jsonb,
       '[]'::jsonb, '[]'::jsonb, '[]'::jsonb)`,
    [
      publicationId,
      tuple.tupleId,
      sourceManifestHash,
      `sha256:${identity.authorityBundleHash}`,
      envelopeSha256,
      Buffer.from("fixture payload"),
      Buffer.from("fixture envelope"),
      JSON.stringify(sourceSet.certificateIds),
    ],
  )
  for (const evidence of identity.normalizedEntrants) {
    for (const reference of [
      evidence.containmentCertificateRef,
      evidence.conformanceCertificateRef!,
    ]) {
      await pool.query(
        `insert into runtime_evidence_authority_publication_sources
           (publication_id, source_type, source_id, source_record_hash,
            certificate_id)
         values ($1, 'certificate', $2, $3, $2)`,
        [
          publicationId,
          reference.certificateId,
          `sha256:${reference.certificateRecordHash}`,
        ],
      )
    }
  }
  await pool.query(
    `update runtime_evidence_authority_publication_head
        set next_generation = 2
      where singleton = true`,
  )
  await pool.query(
    `insert into runtime_evidence_authority_publication_events
       (id, publication_id, event_kind, attempt_id, envelope_sha256, receipt)
     values ($1, $2, 'installed', $3, $4, $5::jsonb)`,
    [
      receiptId,
      publicationId,
      `${namespace}:install-attempt`,
      envelopeSha256,
      JSON.stringify({
        schemaVersion: "v1.37-runtime-evidence-authority-install-receipt-v1",
        generation: "1",
        payloadSha256: `sha256:${identity.authorityBundleHash}`,
        envelopeSha256,
        sourceManifestHash,
        sourceIds: sourceSet,
      }),
    ],
  )
  await pool.query(
    `insert into match_sets (
       id, matrix, compatibility_tuple_id, compatibility_rules_version,
       compatibility_engine_version, compatibility_runtime_abi_version,
       compatibility_chronicle_version, compatibility_arena_catalog_version,
       compatibility_set_policy_version, authority_bundle_hash,
       authority_registry_generation, execution_evidence_set,
       execution_evidence_set_hash, authority_publication_id,
       authority_install_receipt_id, authority_payload_sha256,
       authority_envelope_sha256, authority_source_manifest_hash,
       authority_source_set
     ) values ($1, '[]'::jsonb, $2, $3, $4, $5, $6, $7, $8, $9, $10,
       $11::jsonb, $12, $13, $14, $15, $16, $17, $18::jsonb)`,
    [
      matchSetId,
      ...values.slice(0, 9),
      JSON.stringify(values[9]),
      values[10],
      publicationId,
      receiptId,
      `sha256:${identity.authorityBundleHash}`,
      envelopeSha256,
      sourceManifestHash,
      JSON.stringify(sourceSet),
    ],
  )
  for (const evidence of identity.normalizedEntrants) {
    await pool.query(
      `insert into match_set_execution_entrants (
         match_set_id, entrant_key, strategy_revision_id, lane_identity,
         lane_identity_hash, containment_certificate_kind,
         containment_certificate_id, containment_certificate_version,
         containment_certificate_hash, conformance_certificate_kind,
         conformance_certificate_id, conformance_certificate_version,
         conformance_certificate_hash, scheduling_status,
         scheduling_reason_code, scheduling_evaluated_at,
         scheduling_fresh_until, authority_registry_generation,
         execution_snapshot, authority_bundle_hash
       ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
         $13, $14, $15, $16, $17, $18, $19, $20)`,
      [
        ...matchSetExecutionEntrantSqlValues(matchSetId, evidence),
        identity.authorityBundleHash,
      ],
    )
  }
  const pairValues = matchExecutionEvidencePairSqlValues(matchSetId, pair)
  await pool.query(
    `insert into matches (
       id, bottom_strategy_revision_id, top_strategy_revision_id,
       arena_variant_id, seed, status, bottom_player_id, top_player_id,
       integrity_match_set_id, bottom_execution_entrant_key,
       top_execution_entrant_key, bottom_execution_evidence,
       top_execution_evidence, execution_evidence_pair_hash, started_at
     ) values ($1, $2, $3, $4, $5, 'running', $6, $7, $8, $9, $10,
       $11, $12, $13, now())`,
    [
      matchId,
      pair.bottom.strategyRevisionId,
      pair.top.strategyRevisionId,
      `${namespace}:arena`,
      `${namespace}:seed`,
      "player:bottom",
      "player:top",
      ...pairValues,
    ],
  )
  await pool.query(
    `insert into match_jobs (
       id, match_id, status, attempts, worker_id, lease_token,
       lease_expires_at, integrity_match_set_id,
       bottom_execution_entrant_key, top_execution_entrant_key,
       bottom_execution_evidence, top_execution_evidence,
       execution_evidence_pair_hash
     ) values ($1, $2, 'running', 1, 'worker:completion', $3,
       '2099-08-12T12:00:00Z', $4, $5, $6, $7, $8, $9)`,
    [jobId, matchId, `${namespace}:lease`, ...pairValues],
  )
  await pool.query(
    `insert into match_job_attempts
       (id, job_id, attempt_number, worker_id, status)
     values ($1, $2, 1, 'worker:completion', 'running')`,
    [`${namespace}:attempt:1`, jobId],
  )
}

const databaseUrl = process.env.DATABASE_URL
const describePostgres = databaseUrl ? describe : describe.skip

const snapshotCanonicalRows = async (pool: Pool) => {
  const snapshot: Record<string, readonly unknown[]> = {}
  const tables = await pool.query<{ tablename: string }>(`
    select tablename
      from pg_tables
     where schemaname = current_schema()
     order by tablename
  `)
  for (const { tablename } of tables.rows) {
    const quotedTable = `"${tablename.replaceAll('"', '""')}"`
    const result = await pool.query<{ snapshot: readonly unknown[] }>(
      `select coalesce(
         jsonb_agg(to_jsonb(row_data) order by to_jsonb(row_data)::text),
         '[]'::jsonb
       ) as snapshot
       from (select * from ${quotedTable}) row_data`,
    )
    snapshot[tablename] = result.rows[0]!.snapshot
  }
  return JSON.stringify(snapshot)
}

describePostgres(
  "PostgreSQL Match completion integrity identity and system failure",
  () => {
    const schema = `completion_${randomUUID().replaceAll("-", "")}`
    const namespace = `completion:${randomUUID()}`
    const { identity, pair } = completionIdentity(namespace)
    const built = builtMatch(namespace)
    let admin: Pool
    let pool: Pool

    beforeAll(async () => {
      admin = new Pool({ connectionString: databaseUrl! })
      await admin.query(`create schema ${schema}`)
      pool = new Pool({
        connectionString: databaseUrl!,
        options: `-c search_path=${schema}`,
        max: 1,
      })
      await migrate(pool)
      await seedCompletionMatch(pool, namespace, identity, pair)
    }, 30_000)

    afterAll(async () => {
      await pool.end()
      await admin.query(`drop schema ${schema} cascade`)
      await admin.end()
    })

    const input = (
      integrityIdentity: RuntimeExecutionResolvedEvidenceSnapshot,
    ) => ({
      jobId: `${namespace}:job`,
      leaseToken: `${namespace}:lease`,
      chronicle: built.chronicle,
      finalState: built.finalState,
      integrityIdentity,
      execution: built.execution,
      boundaryAnchors: built.boundaryAnchors,
    })

    it("keeps Chronicle, gameplay, outcome, attempt, and player state unchanged for every side's drift", async () => {
      const exact = responseSnapshot(identity, pair)
      const before = await snapshotCanonicalRows(pool)
      const driftCases: RuntimeExecutionResolvedEvidenceSnapshot[] = [
        {
          ...exact,
          entrants: { bottom: exact.entrants.top, top: exact.entrants.bottom },
        },
        {
          ...exact,
          entrants: {
            ...exact.entrants,
            bottom: {
              ...exact.entrants.bottom,
              schedulingDecision: {
                ...exact.entrants.bottom.schedulingDecision,
                freshUntil: "2026-07-12T12:00:00.000Z",
              },
            },
          },
        },
        {
          ...exact,
          entrants: {
            ...exact.entrants,
            top: {
              ...exact.entrants.top,
              schedulingDecision: {
                ...exact.entrants.top.schedulingDecision,
                status: "disabled",
                reasonCode: "CONTAINMENT_REVOKED",
              },
            },
          },
        },
        { ...exact, registryGeneration: "2" },
        {
          ...exact,
          entrants: {
            ...exact.entrants,
            bottom: {
              ...exact.entrants.bottom,
              conformanceCertificateRef: {
                ...exact.entrants.bottom.conformanceCertificateRef!,
                certificateRecordHash: sha256("drift-bottom"),
              },
            },
          },
        },
        {
          ...exact,
          entrants: {
            ...exact.entrants,
            top: {
              ...exact.entrants.top,
              laneIdentity: {
                ...exact.entrants.top.laneIdentity,
                buildId: "drift-top",
              },
            },
          },
        },
      ]

      for (const drift of driftCases) {
        await expect(completeMatch(pool, input(drift))).rejects.toMatchObject({
          failureCategory: "system_failure",
          playerPenalty: false,
        })
      }
      expect(await snapshotCanonicalRows(pool)).toEqual(before)

      const state = await pool.query(
        `select m.status as match_status, m.outcome, m.winner_player_id,
              m.surviving_soldiers, j.status as job_status,
              a.status as attempt_status,
              (select count(*)::integer from chronicles where match_id = m.id) as chronicles
         from matches m
         join match_jobs j on j.match_id = m.id
         join match_job_attempts a on a.job_id = j.id and a.attempt_number = 1
        where m.id = $1`,
        [`${namespace}:match`],
      )
      expect(state.rows[0]).toEqual({
        match_status: "running",
        outcome: null,
        winner_player_id: null,
        surviving_soldiers: null,
        job_status: "running",
        attempt_status: "running",
        chronicles: 0,
      })
    })

    it("refuses every stale or not-yet-evaluated entrant scheduling decision without mutation", async () => {
      const cases = [
        {
          entrantKey: pair.bottom.entrantKey,
          column: "scheduling_evaluated_at",
          invalid: "2099-08-12T12:00:00.000Z",
          restore: pair.bottom.schedulingDecision.evaluatedAt,
        },
        {
          entrantKey: pair.bottom.entrantKey,
          column: "scheduling_fresh_until",
          invalid: "2026-07-12T12:00:00.000Z",
          restore: pair.bottom.schedulingDecision.freshUntil,
        },
        {
          entrantKey: pair.top.entrantKey,
          column: "scheduling_evaluated_at",
          invalid: "2099-08-12T12:00:00.000Z",
          restore: pair.top.schedulingDecision.evaluatedAt,
        },
        {
          entrantKey: pair.top.entrantKey,
          column: "scheduling_fresh_until",
          invalid: "2026-07-12T12:00:00.000Z",
          restore: pair.top.schedulingDecision.freshUntil,
        },
      ] as const

      for (const fixture of cases) {
        await pool.query(
          "alter table match_set_execution_entrants disable trigger match_set_execution_entrants_append_only",
        )
        await pool.query(
          `update match_set_execution_entrants
              set ${fixture.column} = $1
            where match_set_id = $2 and entrant_key = $3`,
          [fixture.invalid, `${namespace}:match-set`, fixture.entrantKey],
        )
        await pool.query(
          "alter table match_set_execution_entrants enable trigger match_set_execution_entrants_append_only",
        )
        const before = await snapshotCanonicalRows(pool)
        await expect(
          completeMatch(pool, input(responseSnapshot(identity, pair))),
        ).rejects.toMatchObject({
          code: "MATCH_COMPLETION_OPERATIONAL_FAILURE",
          failureCategory: "system_failure",
          playerPenalty: false,
        })
        expect(await snapshotCanonicalRows(pool)).toEqual(before)
        await pool.query(
          "alter table match_set_execution_entrants disable trigger match_set_execution_entrants_append_only",
        )
        await pool.query(
          `update match_set_execution_entrants
              set ${fixture.column} = $1
            where match_set_id = $2 and entrant_key = $3`,
          [fixture.restore, `${namespace}:match-set`, fixture.entrantKey],
        )
        await pool.query(
          "alter table match_set_execution_entrants enable trigger match_set_execution_entrants_append_only",
        )
      }
    })

    it("persists only the engine-produced player-violation consequence and prior memory", async () => {
      const violationNamespace = `${namespace}:player-violation`
      const violationIdentity = completionIdentity(violationNamespace)
      const soldierInvocations = new Map<string, number>()
      const playerViolationRuntime: StrategyRuntime = {
        selectActivations(input) {
          return {
            ok: true,
            value: {
              activationOrders: input.mySoldiers
                .filter(({ status }) => status === "ACTIVE")
                .slice(0, input.activationCount)
                .map(({ id }) => ({ soldierId: id })),
              strategyMemory: {
                retainedStrategyMemory:
                  input.mySoldiers[0]?.ownerPlayerId ?? "unknown",
              },
            },
          }
        },
        runSoldierBrain(input) {
          const invocation = soldierInvocations.get(input.self.id) ?? 0
          soldierInvocations.set(input.self.id, invocation + 1)
          return invocation === 0
            ? {
                ok: true,
                value: {
                  action: { type: "TURN", direction: "RIGHT" },
                  soldierMemory: {
                    retainedSoldierMemory: input.self.id,
                  },
                },
              }
            : {
                ok: false,
                violation: {
                  type: "INVALID_OUTPUT",
                  message: "fixture engine-owned player violation",
                },
              }
        },
      }
      const violation = builtMatch(
        violationNamespace,
        `${violationNamespace}:seed`,
        playerViolationRuntime,
      )
      expect(
        violation.chronicle.events.some(
          ({ type }) => type === "RUNTIME_VIOLATION",
        ),
      ).toBe(true)
      expect(JSON.stringify(violation.finalState)).toContain(
        "retainedStrategyMemory",
      )
      expect(JSON.stringify(violation.finalState)).toContain(
        "retainedSoldierMemory",
      )

      const violationSchema = `completion_violation_${randomUUID().replaceAll("-", "")}`
      await admin.query(`create schema ${violationSchema}`)
      const violationPool = new Pool({
        connectionString: databaseUrl!,
        options: `-c search_path=${violationSchema}`,
        max: 1,
      })
      try {
        await migrate(violationPool)
        await seedCompletionMatch(
          violationPool,
          violationNamespace,
          violationIdentity.identity,
          violationIdentity.pair,
        )
        const violationInput = {
          jobId: `${violationNamespace}:job`,
          leaseToken: `${violationNamespace}:lease`,
          chronicle: violation.chronicle,
          finalState: violation.finalState,
          integrityIdentity: responseSnapshot(
            violationIdentity.identity,
            violationIdentity.pair,
          ),
          execution: violation.execution,
          boundaryAnchors: violation.boundaryAnchors,
        }
        const adapterProposedState = structuredClone(violation.finalState)
        adapterProposedState.players[0]!.strategyMemory = {
          adapterProposedStrategyMemoryMustNotCommit: true,
        }
        adapterProposedState.soldiers[0]!.soldierMemory = {
          adapterProposedSoldierMemoryMustNotCommit: true,
        }
        const beforeProposedMemory = await snapshotCanonicalRows(violationPool)
        await expect(
          completeMatch(violationPool, {
            ...violationInput,
            finalState: adapterProposedState,
          }),
        ).rejects.toMatchObject({
          failureCategory: "system_failure",
          playerPenalty: false,
        })
        expect(await snapshotCanonicalRows(violationPool)).toEqual(
          beforeProposedMemory,
        )

        await expect(
          completeMatch(violationPool, violationInput),
        ).resolves.toMatchObject({
          status: "complete",
          matchId: `${violationNamespace}:match`,
        })
        const stored = await violationPool.query<{
          artifact: Chronicle
          match_status: string
        }>(
          `select c.artifact, m.status as match_status
             from chronicles c
             join matches m on m.id = c.match_id
            where c.match_id = $1`,
          [`${violationNamespace}:match`],
        )
        expect(stored.rows[0]).toEqual({
          artifact: violation.chronicle,
          match_status: "complete",
        })
        expect(JSON.stringify(stored.rows[0])).not.toContain(
          "adapterProposedStrategyMemoryMustNotCommit",
        )
        expect(JSON.stringify(stored.rows[0])).not.toContain(
          "adapterProposedSoldierMemoryMustNotCommit",
        )
      } finally {
        await violationPool.end()
        await admin.query(`drop schema ${violationSchema} cascade`)
      }
    }, 15_000)

    // This transaction-heavy PostgreSQL matrix consistently needs 6-7 seconds,
    // so Vitest's 5-second default can expire before its deterministic checks finish.
    it("rolls back attempt mismatch and late writes, then proves exact success, idempotence, and conflict refusal", async () => {
      await pool.query(
        `update match_job_attempts
            set status = 'failed_system'
          where job_id = $1 and attempt_number = 1`,
        [`${namespace}:job`],
      )
      const attemptMismatch = await snapshotCanonicalRows(pool)
      await expect(
        completeMatch(pool, input(responseSnapshot(identity, pair))),
      ).rejects.toMatchObject({
        code: "MATCH_COMPLETION_OPERATIONAL_FAILURE",
        playerPenalty: false,
      })
      expect(await snapshotCanonicalRows(pool)).toEqual(attemptMismatch)
      await pool.query(
        `update match_job_attempts
            set status = 'running'
          where job_id = $1 and attempt_number = 1`,
        [`${namespace}:job`],
      )
      const persistenceFaults: readonly {
        readonly name: string
        readonly table: string
        readonly predicate: string
        readonly deferred?: boolean
      }[] = [
        {
          name: "after Chronicle",
          table: "matches",
          predicate: `new.id = '${namespace.replaceAll("'", "''")}:match'`,
        },
        {
          name: "after Match",
          table: "match_jobs",
          predicate: `new.id = '${namespace.replaceAll("'", "''")}:job'`,
        },
        {
          name: "after job",
          table: "match_job_attempts",
          predicate: `new.job_id = '${namespace.replaceAll("'", "''")}:job'`,
        },
        {
          name: "at commit",
          table: "match_job_attempts",
          predicate: `new.job_id = '${namespace.replaceAll("'", "''")}:job'`,
          deferred: true,
        },
      ]
      for (const [index, fault] of persistenceFaults.entries()) {
        const beforeLateFailure = await snapshotCanonicalRows(pool)
        const functionName = `phase258_completion_fault_${index}`
        const triggerName = `phase258_completion_fault_${index}`
        const triggerKind = fault.deferred
          ? `create constraint trigger ${triggerName} after update`
          : `create trigger ${triggerName} before update`
        const deferred = fault.deferred ? " deferrable initially deferred" : ""
        await pool.query(`
          create function ${functionName}() returns trigger language plpgsql as $$
          begin
            if ${fault.predicate} then
              raise exception 'forced Phase 258 persistence fault: ${fault.name}';
            end if;
            return new;
          end; $$;
          ${triggerKind} on ${fault.table}${deferred}
          for each row execute function ${functionName}();
        `)
        await expect(
          completeMatch(pool, input(responseSnapshot(identity, pair))),
        ).rejects.toThrow(
          new RegExp(`forced Phase 258 persistence fault: ${fault.name}`, "iu"),
        )
        expect(await snapshotCanonicalRows(pool)).toEqual(beforeLateFailure)
        await pool.query(
          `drop trigger ${triggerName} on ${fault.table}; drop function ${functionName}()`,
        )
      }
      let rows = await pool.query(
        `select m.status as match_status, j.status as job_status,
              (select count(*)::integer from chronicles where match_id = m.id) as chronicles
         from matches m join match_jobs j on j.match_id = m.id where m.id = $1`,
        [`${namespace}:match`],
      )
      expect(rows.rows[0]).toEqual({
        match_status: "running",
        job_status: "running",
        chronicles: 0,
      })
      await expect(
        completeMatch(pool, input(responseSnapshot(identity, pair))),
      ).resolves.toMatchObject({
        status: "complete",
        matchId: `${namespace}:match`,
      })
      rows = await pool.query(
        `select c.integrity_match_set_id, c.bottom_execution_entrant_key,
              c.top_execution_entrant_key, c.bottom_execution_evidence,
              c.top_execution_evidence, c.execution_evidence_pair_hash,
              c.authority_publication_id, c.authority_install_receipt_id,
              c.authority_payload_sha256, c.authority_envelope_sha256,
              c.authority_source_manifest_hash, c.authority_source_set,
              m.status as match_status, j.status as job_status,
              a.status as attempt_status
         from chronicles c
         join matches m on m.id = c.match_id
         join match_jobs j on j.match_id = m.id
         join match_job_attempts a on a.job_id = j.id and a.attempt_number = 1
        where c.match_id = $1`,
        [`${namespace}:match`],
      )
      expect(rows.rows[0]).toMatchObject({
        integrity_match_set_id: `${namespace}:match-set`,
        bottom_execution_entrant_key: pair.bottom.entrantKey,
        top_execution_entrant_key: pair.top.entrantKey,
        bottom_execution_evidence: pair.bottom,
        top_execution_evidence: pair.top,
        execution_evidence_pair_hash: pair.pairHash,
        authority_publication_id: `${namespace}:publication`,
        authority_install_receipt_id: `${namespace}:install-receipt`,
        authority_payload_sha256: `sha256:${identity.authorityBundleHash}`,
        authority_envelope_sha256: `sha256:${sha256(`${namespace}:envelope`)}`,
        authority_source_manifest_hash: `sha256:${sha256(`${namespace}:sources`)}`,
        authority_source_set: {
          attestationIds: [],
          certificateIds: identity.normalizedEntrants.flatMap((evidence) => [
            evidence.containmentCertificateRef.certificateId,
            evidence.conformanceCertificateRef!.certificateId,
          ]),
          revocationIds: [],
          supersessionIds: [],
          laneControlIds: [],
        },
        match_status: "complete",
        job_status: "complete",
        attempt_status: "complete",
      })

      const completed = await snapshotCanonicalRows(pool)
      await expect(
        completeMatch(pool, input(responseSnapshot(identity, pair))),
      ).resolves.toMatchObject({
        status: "complete",
        matchId: `${namespace}:match`,
      })
      expect(await snapshotCanonicalRows(pool)).toEqual(completed)

      const chronicleIdentityCases = [
        ["compatibility_tuple_id", `sha256:${"f".repeat(64)}`],
        ["compatibility_rules_version", "wrong-rules"],
        ["compatibility_engine_version", "wrong-engine"],
        ["compatibility_runtime_abi_version", "wrong-runtime-abi"],
        ["compatibility_chronicle_version", "wrong-chronicle"],
        ["compatibility_arena_catalog_version", "wrong-arena"],
        ["compatibility_set_policy_version", "wrong-set-policy"],
        ["authority_bundle_hash", "f".repeat(64)],
        ["authority_registry_generation", "999"],
      ] as const
      for (const [column, conflicting] of chronicleIdentityCases) {
        const original = await pool.query<Record<string, string>>(
          `select ${column} from chronicles where match_id = $1`,
          [`${namespace}:match`],
        )
        await pool.query(
          "alter table chronicles disable trigger chronicles_integrity_identity_immutable",
        )
        await pool.query(
          `update chronicles set ${column} = $1 where match_id = $2`,
          [conflicting, `${namespace}:match`],
        )
        await pool.query(
          "alter table chronicles enable trigger chronicles_integrity_identity_immutable",
        )
        const corrupted = await snapshotCanonicalRows(pool)
        await expect(
          completeMatch(pool, input(responseSnapshot(identity, pair))),
        ).rejects.toMatchObject({
          code: "EVIDENCE_IDENTITY_MISMATCH",
          failureCategory: "system_failure",
          playerPenalty: false,
        })
        expect(await snapshotCanonicalRows(pool)).toEqual(corrupted)
        await pool.query(
          "alter table chronicles disable trigger chronicles_integrity_identity_immutable",
        )
        await pool.query(
          `update chronicles set ${column} = $1 where match_id = $2`,
          [original.rows[0]![column], `${namespace}:match`],
        )
        await pool.query(
          "alter table chronicles enable trigger chronicles_integrity_identity_immutable",
        )
      }
      expect(await snapshotCanonicalRows(pool)).toEqual(completed)

      await expect(
        completeMatch(pool, {
          ...input(responseSnapshot(identity, pair)),
          chronicle: builtMatch(namespace, `${namespace}:conflicting-seed`)
            .chronicle,
          finalState: builtMatch(namespace, `${namespace}:conflicting-seed`)
            .finalState,
        }),
      ).rejects.toMatchObject({
        code: "CURRENT_CHRONICLE_RECONSTRUCTION_MISMATCH",
        failureCategory: "system_failure",
        playerPenalty: false,
      })
      expect(await snapshotCanonicalRows(pool)).toEqual(completed)
    }, 30_000)
  },
)

describePostgres("PostgreSQL completion authority-head refusal", () => {
  const schema = `completion_head_${randomUUID().replaceAll("-", "")}`
  const namespace = `completion-head:${randomUUID()}`
  const { identity, pair } = completionIdentity(namespace)
  const built = builtMatch(namespace)
  let admin: Pool
  let pool: Pool

  beforeAll(async () => {
    admin = new Pool({ connectionString: databaseUrl! })
    await admin.query(`create schema ${schema}`)
    pool = new Pool({
      connectionString: databaseUrl!,
      options: `-c search_path=${schema}`,
      max: 1,
    })
    await migrate(pool)
    await seedCompletionMatch(pool, namespace, identity, pair)
    await pool.query(
      `insert into runtime_evidence_authority_publication_events
        (id, publication_id, event_kind, attempt_id, envelope_sha256,
         reason_code, receipt, occurred_at)
       select $1, id, 'uncertain', $2, envelope_sha256,
              'INSTALL_STATE_UNCERTAIN',
              jsonb_build_object(
                'schemaVersion', 'v1.37-runtime-evidence-authority-install-receipt-v1',
                'generation', generation::text,
                'payloadSha256', payload_sha256,
                'envelopeSha256', envelope_sha256,
                'sourceManifestHash', source_manifest_hash,
                'sourceIds', jsonb_build_object(
                  'attestationIds', attestation_ids,
                  'certificateIds', certificate_ids,
                  'revocationIds', revocation_ids,
                  'supersessionIds', supersession_ids,
                  'laneControlIds', lane_control_ids
                )
              ), now() + interval '1 second'
         from runtime_evidence_authority_publications where id = $3`,
      [
        `${namespace}:uncertain-head`,
        `${namespace}:uncertain-attempt`,
        `${namespace}:publication`,
      ],
    )
  }, 30_000)

  afterAll(async () => {
    await pool.end()
    await admin.query(`drop schema ${schema} cascade`)
    await admin.end()
  })

  it("rejects a fully seeded graph whose exact receipt is no longer installed", async () => {
    const before = await snapshotCanonicalRows(pool)
    await expect(
      completeMatch(pool, {
        jobId: `${namespace}:job`,
        leaseToken: `${namespace}:lease`,
        chronicle: built.chronicle,
        finalState: built.finalState,
        integrityIdentity: responseSnapshot(identity, pair),
        execution: built.execution,
        boundaryAnchors: built.boundaryAnchors,
      }),
    ).rejects.toMatchObject({
      code: "MATCH_COMPLETION_OPERATIONAL_FAILURE",
      failureCategory: "system_failure",
      ownership: "system_operation",
      playerPenalty: false,
    })
    expect(await snapshotCanonicalRows(pool)).toEqual(before)
  })
})
