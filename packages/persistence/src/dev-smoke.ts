import { createHash } from "node:crypto"
import type { MatchSetId } from "@cowards/spec"
import type { Pool } from "pg"
import { migrate } from "./migrations.js"
import { createDevelopmentSeedData } from "./seed.js"
import { createRepositories } from "./repositories.js"
import {
  createMatchSetService,
  resolveMatchSetExecutionEvidence,
  type MatchSetExecutionEvidenceResolver,
} from "./matchset-service.js"
import { refreshMatchSetStatus } from "./matchset-status.js"
import type { MatchSetStatus } from "./schema.js"
import { hashEntrantLaneIdentity } from "./integrity-evidence.js"

export interface DevelopmentMatchSetSmokeResult {
  matchSetId: MatchSetId
  matchIds: string[]
  matchCount: number
  status: MatchSetStatus
  chronicleCount: number
  degraded: boolean
}

const developmentEvidenceHash = (value: string): string =>
  createHash("sha256").update(value).digest("hex")

const seedDevelopmentFixtureEvidence = async (
  pool: Pool,
  executionEntrants: Awaited<
    ReturnType<typeof resolveMatchSetExecutionEvidence>
  >["executionEntrants"],
): Promise<void> => {
  for (const evidence of Object.values(executionEntrants)) {
    const reference = evidence.containmentCertificateRef
    const attestationId = `fixture:attestation:containment:${evidence.strategyRevisionId}`
    const laneHash = hashEntrantLaneIdentity(evidence.laneIdentity)
    const commandId = `fixture:command:containment:${evidence.strategyRevisionId}`
    const evidenceHash = developmentEvidenceHash(
      `fixture:evidence:${evidence.strategyRevisionId}`,
    )
    const graphHash = developmentEvidenceHash(
      `fixture:graph:${evidence.strategyRevisionId}`,
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
       values ($1,$2,'passed','containment',$3,'fixture-key','fixture',$4,$5,
         $6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,
         $23,$24,$25,$26,$27,'2026-01-01T00:00:00Z','2099-12-31T23:59:59Z')
       on conflict (id) do nothing`,
      [
        attestationId,
        developmentEvidenceHash(attestationId),
        evidence.laneIdentity.providerId,
        "runtime-evidence-attestation-v1",
        commandId,
        developmentEvidenceHash(commandId),
        evidence.laneIdentity.corpusId,
        evidenceHash,
        evidence.laneIdentity.policyId,
        evidenceHash,
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
        developmentEvidenceHash(`fixture:manifest:${evidence.strategyRevisionId}`),
        graphHash,
        evidenceHash,
        reference.certificateVersion,
        reference.certificateRecordHash,
        reference.registryGeneration,
        evidence.laneIdentity,
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
       values ($1,'containment',$2,$3,'passed',$4,'passed',$5,$6,$7,$8,$9,
         $10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
         '2026-01-01T00:00:00Z','2099-12-31T23:59:59Z')
       on conflict (id) do nothing`,
      [
        reference.certificateId,
        reference.certificateVersion,
        reference.certificateRecordHash,
        attestationId,
        evidence.laneIdentity.providerId,
        "runtime-evidence-attestation-v1",
        commandId,
        developmentEvidenceHash(commandId),
        evidence.laneIdentity.corpusId,
        evidenceHash,
        evidence.laneIdentity.policyId,
        evidenceHash,
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

export const runDevelopmentMatchSetSmoke = async (
  pool: Pool,
  options: {
    matchSetId?: MatchSetId | undefined
    runQueuedMatch?: (matchIds: readonly string[]) => Promise<unknown>
    evidenceResolver?: MatchSetExecutionEvidenceResolver | undefined
  } = {},
): Promise<DevelopmentMatchSetSmokeResult> => {
  const seed = createDevelopmentSeedData()
  const [bottomRevision, topRevision] = seed.revisions
  if (!bottomRevision || !topRevision) {
    throw new Error("Development seed revisions missing")
  }
  if (options.evidenceResolver?.trustDomain !== "fixture") {
    throw new Error(
      "Development smoke requires explicit fixture-domain evidence authority.",
    )
  }
  const integrityIdentity = await resolveMatchSetExecutionEvidence({
    resolver: options.evidenceResolver,
    purpose: "development",
    evaluationInstant: "2026-05-20T00:00:00.000Z",
    entrants: [bottomRevision, topRevision].map((revision) => ({
      entrantKey: revision.id,
      strategyRevisionId: revision.id,
    })),
  })

  await migrate(pool)

  await seedDevelopmentFixtureEvidence(
    pool,
    integrityIdentity.executionEntrants,
  )
  const repositories = createRepositories(pool)
  for (const user of seed.users) {
    await repositories.upsertUser(user)
  }
  for (const strategy of seed.strategies) {
    await repositories.upsertStrategy(strategy)
  }
  for (const revision of seed.revisions) {
    await repositories.insertStrategyRevision(revision)
  }
  for (const arena of seed.arenas) {
    await repositories.upsertArenaVariant(arena)
  }

  const matchSetId =
    options.matchSetId ?? ("match-set:dev-smoke:v1" as MatchSetId)
  const created = await createMatchSetService(pool).createFromPreset({
    id: matchSetId,
    presetId: "smoke-v1",
    bottomStrategyRevisionId: bottomRevision.id,
    topStrategyRevisionId: topRevision.id,
    bottomPlayerId: "player:bottom",
    topPlayerId: "player:top",
    integrityIdentity,
  })

  await options.runQueuedMatch?.(created.matchIds)
  const refreshed = await refreshMatchSetStatus(pool, matchSetId)
  const chronicles = await pool.query<{ count: string }>(
    `
      select count(*)::text as count
      from match_set_matches msm
      join chronicles c on c.match_id = msm.match_id
      where msm.match_set_id = $1
    `,
    [matchSetId],
  )
  return {
    matchSetId,
    matchIds: created.matchIds,
    matchCount: created.matchIds.length,
    status: refreshed.status,
    chronicleCount: Number(chronicles.rows[0]?.count ?? 0),
    degraded: refreshed.scoring.degraded,
  }
}
