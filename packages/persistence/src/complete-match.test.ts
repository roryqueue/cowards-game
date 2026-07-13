import { Buffer } from "node:buffer"
import { createHash, randomUUID } from "node:crypto"
import type { GameState, StrategyRuntime } from "@cowards/engine"
import { buildChronicleFromMatch } from "@cowards/replay"
import {
  CANONICAL_COMPATIBILITY_TUPLES,
  type ExecutableLaneIdentity,
  type RuntimeEntrantExecutionEvidence,
  type RuntimeExecutionResolvedEvidenceSnapshot,
  type SoldierBrainInput,
  type StrategyInput,
} from "@cowards/spec"
import { Pool } from "pg"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import {
  MatchCompletionIntegritySystemFailure,
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

const passiveRuntime: StrategyRuntime = {
  selectActivations(input: StrategyInput) {
    return {
      ok: true,
      value: {
        activationOrders: input.mySoldiers
          .filter((soldier) => soldier.status === "ACTIVE")
          .map((soldier) => ({ soldierId: soldier.id })),
        strategyMemory: {},
      },
    }
  },
  runSoldierBrain(_input: SoldierBrainInput) {
    return {
      ok: true,
      value: { action: { type: "TURN_TO_STONE" }, soldierMemory: {} },
    }
  },
}

const builtMatch = (namespace: string) =>
  buildChronicleFromMatch({
    matchId: `${namespace}:match`,
    seed: `${namespace}:seed`,
    arenaVariant: {
      id: `${namespace}:arena`,
      name: "Completion integrity",
      initialBounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
      terrainStones: [],
    },
    bottomPlayerId: `${namespace}:player:bottom`,
    topPlayerId: `${namespace}:player:top`,
    bottomStrategyRevisionId: `${namespace}:revision:bottom`,
    topStrategyRevisionId: `${namespace}:revision:top`,
    runtime: passiveRuntime,
  })

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
    certificateIds: [],
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
       '2099-08-12T12:00:00Z', $6, $7, '[]'::jsonb, '[]'::jsonb,
       '[]'::jsonb, '[]'::jsonb, '[]'::jsonb)`,
    [
      publicationId,
      `sha256:${sha256(`${namespace}:tuple-manifest`)}`,
      sourceManifestHash,
      `sha256:${identity.authorityBundleHash}`,
      envelopeSha256,
      Buffer.from("fixture payload"),
      Buffer.from("fixture envelope"),
    ],
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
      `${namespace}:player:bottom`,
      `${namespace}:player:top`,
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
    })

    it("keeps Chronicle, gameplay, outcome, attempt, and player state unchanged for every side's drift", async () => {
      const exact = responseSnapshot(identity, pair)
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

    it("rolls back a late write and then copies the locked pair exactly on success", async () => {
      await pool.query(`
      create function reject_completion_update() returns trigger language plpgsql as $$
      begin raise exception 'forced late completion failure'; end; $$;
      create trigger reject_completion_update before update on matches
      for each row when (new.status = 'complete') execute function reject_completion_update();
    `)
      await expect(
        completeMatch(pool, input(responseSnapshot(identity, pair))),
      ).rejects.toThrow(/forced late completion failure/iu)
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
      await pool.query("drop trigger reject_completion_update on matches")
      await pool.query("drop function reject_completion_update()")

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
          certificateIds: [],
          revocationIds: [],
          supersessionIds: [],
          laneControlIds: [],
        },
        match_status: "complete",
        job_status: "complete",
        attempt_status: "complete",
      })
    })
  },
)
