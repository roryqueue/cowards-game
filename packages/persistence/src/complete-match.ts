import { isDeepStrictEqual } from "node:util"
import type { GameState } from "@cowards/engine"
import {
  createChronicleContentHash,
  INACTIVE_V1_37_REPLAY_TUPLE,
  type CandidateReplaySemanticInput,
  type ChronicleBoundaryAnchor,
  type ChronicleRecorderExecution,
} from "@cowards/replay"
import {
  CANONICAL_COMPATIBILITY_TUPLES,
  RuntimeExecutionFinalStateSchema,
  RuntimeExecutionResolvedEvidenceSnapshotSchema,
  validateCanonicalGameState,
  type Chronicle,
  type MatchId,
  type MatchOutcome,
  type RuntimeExecutionResolvedEvidenceSnapshot,
} from "@cowards/spec"
import type { Pool } from "pg"
import {
  createCandidateChronicleAdmission,
  createPostgresChronicleStore,
  type CandidateChronicleAdmission,
} from "./chronicle-store.js"
import { withTransaction } from "./db.js"
import {
  createMatchExecutionEvidencePair,
  matchSetIntegritySqlValues,
  parseMatchSetIntegrityIdentityRows,
  type MatchExecutionEvidencePair,
  type MatchSetExecutionEntrantRow,
  type MatchSetIntegrityIdentity,
  type MatchSetIntegrityRow,
} from "./integrity-evidence.js"

export interface CompleteMatchInput {
  jobId: string
  leaseToken: string
  chronicle: Chronicle
  finalState: GameState
  integrityIdentity: RuntimeExecutionResolvedEvidenceSnapshot
}

export interface CandidateCompleteMatchInput {
  profile: "candidate-v1.37"
  compatibility: CandidateReplaySemanticInput["compatibility"]
  chronicle: Chronicle
  boundaryAnchors: readonly ChronicleBoundaryAnchor[]
  execution: ChronicleRecorderExecution
  jobId: string
  leaseToken: string
  finalState: GameState
  terminalStateHash: string
  outcome: MatchOutcome
  integrityIdentity: RuntimeExecutionResolvedEvidenceSnapshot
}

export type CompleteMatchRequest =
  | CompleteMatchInput
  | CandidateCompleteMatchInput

export class MatchCompletionIntegritySystemFailure extends Error {
  readonly code = "EVIDENCE_IDENTITY_MISMATCH"
  readonly failureCategory = "system_failure"
  readonly playerPenalty = false
  readonly retryable = true

  constructor() {
    super(
      "Match completion integrity identity no longer matches its locked scheduling snapshot.",
    )
    this.name = "MatchCompletionIntegritySystemFailure"
  }
}

export class MatchCompletionSemanticSystemFailure extends Error {
  readonly code: string
  readonly failureCategory = "system_failure"
  readonly ownership = "system_integrity"
  readonly playerPenalty = false
  readonly retryable = false

  constructor(code = "CANONICAL_COMPLETION_INVALID") {
    super(`Canonical Match completion was rejected: ${code}.`)
    this.name = "MatchCompletionSemanticSystemFailure"
    this.code = code
  }
}

export class MatchCompletionOperationalSystemFailure extends Error {
  readonly code = "MATCH_COMPLETION_OPERATIONAL_FAILURE"
  readonly failureCategory = "system_failure"
  readonly ownership = "system_operation"
  readonly playerPenalty = false
  readonly retryable = true

  constructor(
    message = "Match completion has no exact running lease and attempt.",
  ) {
    super(message)
    this.name = "MatchCompletionOperationalSystemFailure"
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const hasExactKeys = (
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean => {
  const actual = Object.keys(value).sort()
  const sortedExpected = [...expected].sort()
  return (
    actual.length === sortedExpected.length &&
    actual.every((key, index) => key === sortedExpected[index])
  )
}

interface PreparedCompletion {
  readonly profile: "current-exact" | "candidate-v1.37"
  readonly jobId: string
  readonly leaseToken: string
  readonly chronicle: Chronicle
  readonly finalState: GameState
  readonly integrityIdentity: RuntimeExecutionResolvedEvidenceSnapshot
  readonly candidateAdmission?: Readonly<CandidateChronicleAdmission>
}

const candidateCompleteKeys = [
  "profile",
  "compatibility",
  "chronicle",
  "boundaryAnchors",
  "execution",
  "jobId",
  "leaseToken",
  "finalState",
  "terminalStateHash",
  "outcome",
  "integrityIdentity",
] as const

const currentCompleteKeys = [
  "jobId",
  "leaseToken",
  "chronicle",
  "finalState",
  "integrityIdentity",
] as const

const exactTupleMatches = (
  actual: RuntimeExecutionResolvedEvidenceSnapshot["compatibility"],
  expected: Readonly<RuntimeExecutionResolvedEvidenceSnapshot["compatibility"]>,
): boolean =>
  actual.tupleId === expected.tupleId &&
  isDeepStrictEqual(actual.tuple, expected.tuple)

const prepareCompletion = (input: CompleteMatchRequest): PreparedCompletion => {
  if (!isRecord(input)) {
    throw new MatchCompletionSemanticSystemFailure("COMPLETION_ROUTE_INVALID")
  }

  // Parse the entire response evidence before route selection, semantic
  // admission, cloning any gameplay document, or deriving persisted fields.
  // This prevents a partial type cast from influencing either route.
  const parsedIdentity =
    RuntimeExecutionResolvedEvidenceSnapshotSchema.safeParse(
      input.integrityIdentity,
    )
  if (!parsedIdentity.success) {
    throw new MatchCompletionSemanticSystemFailure(
      "COMPLETION_EVIDENCE_SHAPE_INVALID",
    )
  }
  const integrityIdentity = globalThis.structuredClone(parsedIdentity.data)
  const candidateEnvelope = hasExactKeys(input, candidateCompleteKeys)
  const currentEnvelope = hasExactKeys(input, currentCompleteKeys)

  if (currentEnvelope) {
    const activeCurrent = CANONICAL_COMPATIBILITY_TUPLES[0]
    if (
      !activeCurrent ||
      !exactTupleMatches(integrityIdentity.compatibility, activeCurrent)
    ) {
      throw new MatchCompletionSemanticSystemFailure(
        "CURRENT_ROUTE_TUPLE_INVALID",
      )
    }
    const current = input as unknown as CompleteMatchInput
    return {
      profile: "current-exact",
      jobId: current.jobId,
      leaseToken: current.leaseToken,
      chronicle: globalThis.structuredClone(current.chronicle),
      finalState: globalThis.structuredClone(current.finalState),
      integrityIdentity,
    }
  }

  // Candidate routing is established by the exact candidate envelope and the
  // engine/replay admission brand below. The caller-controlled profile string
  // is never sufficient to select this route.
  if (!candidateEnvelope) {
    throw new MatchCompletionSemanticSystemFailure("CANDIDATE_ROUTE_INVALID")
  }
  const candidate = input as unknown as CandidateCompleteMatchInput
  if (candidate.profile !== "candidate-v1.37") {
    throw new MatchCompletionSemanticSystemFailure("CANDIDATE_ROUTE_INVALID")
  }
  let admission: Readonly<CandidateChronicleAdmission>
  try {
    const semanticInput: CandidateReplaySemanticInput = {
      profile: "candidate-v1.37",
      compatibility: candidate.compatibility,
      chronicle: candidate.chronicle,
      boundaryAnchors: candidate.boundaryAnchors,
      execution: candidate.execution,
    }
    admission = createCandidateChronicleAdmission(semanticInput)
  } catch (error) {
    throw new MatchCompletionSemanticSystemFailure(
      error instanceof Error ? error.message : "CANDIDATE_SEMANTIC_INVALID",
    )
  }
  const finalState = globalThis.structuredClone(candidate.finalState)
  const parsedFinal = RuntimeExecutionFinalStateSchema.safeParse(finalState)
  if (!parsedFinal.success) {
    throw new MatchCompletionSemanticSystemFailure(
      "CANDIDATE_FINAL_STATE_SHAPE_INVALID",
    )
  }
  const finalSemantic = validateCanonicalGameState(parsedFinal.data)
  if (!finalSemantic.ok) {
    throw new MatchCompletionSemanticSystemFailure(
      finalSemantic.issues[0]?.code ?? "CANDIDATE_FINAL_STATE_INVALID",
    )
  }
  const bottom = finalState.players.filter((player) => player.side === "bottom")
  const top = finalState.players.filter((player) => player.side === "top")
  const chronicle = admission.chronicle
  if (
    finalState.phase !== "COMPLETE" ||
    finalState.outcome === undefined ||
    !isDeepStrictEqual(finalState, admission.finalState) ||
    candidate.terminalStateHash !== admission.terminalStateHash ||
    !isDeepStrictEqual(candidate.outcome, admission.outcome) ||
    !isDeepStrictEqual(finalState.outcome, admission.outcome) ||
    chronicle.reproducibility.matchId !== finalState.matchId ||
    chronicle.reproducibility.seed !== finalState.seed ||
    chronicle.reproducibility.arenaVariantId !== finalState.arenaVariant.id ||
    chronicle.reproducibility.arenaVariantVersion !==
      finalState.versions.arenaVariant ||
    !isDeepStrictEqual(
      chronicle.reproducibility.versions,
      finalState.versions,
    ) ||
    bottom.length !== 1 ||
    top.length !== 1 ||
    chronicle.reproducibility.strategyRevisionIds[0] !==
      bottom[0]!.strategyRevisionId ||
    chronicle.reproducibility.strategyRevisionIds[1] !==
      top[0]!.strategyRevisionId ||
    !isRecord(integrityIdentity) ||
    !isRecord(integrityIdentity.compatibility) ||
    integrityIdentity.compatibility.tupleId !==
      INACTIVE_V1_37_REPLAY_TUPLE.tupleId ||
    !isDeepStrictEqual(
      integrityIdentity.compatibility.tuple,
      INACTIVE_V1_37_REPLAY_TUPLE.tuple,
    ) ||
    !isRecord(integrityIdentity.entrants) ||
    !isRecord(integrityIdentity.entrants.bottom) ||
    !isRecord(integrityIdentity.entrants.top) ||
    integrityIdentity.entrants.bottom.strategyRevisionId !==
      bottom[0]!.strategyRevisionId ||
    integrityIdentity.entrants.top.strategyRevisionId !==
      top[0]!.strategyRevisionId
  ) {
    throw new MatchCompletionSemanticSystemFailure(
      "CANDIDATE_CROSS_DOCUMENT_IDENTITY_INVALID",
    )
  }
  return {
    profile: "candidate-v1.37",
    jobId: candidate.jobId,
    leaseToken: candidate.leaseToken,
    chronicle,
    finalState,
    integrityIdentity,
    candidateAdmission: admission,
  }
}

export const validateCompletionIntegritySnapshot = (
  locked: {
    identity: Readonly<MatchSetIntegrityIdentity>
    pair: Readonly<MatchExecutionEvidencePair>
  },
  response: RuntimeExecutionResolvedEvidenceSnapshot | unknown,
): void => {
  try {
    matchSetIntegritySqlValues(locked.identity)
    const expectedPair = createMatchExecutionEvidencePair(locked.identity, {
      bottomEntrantKey: locked.pair.bottom.entrantKey,
      topEntrantKey: locked.pair.top.entrantKey,
      bottomStrategyRevisionId: locked.pair.bottom.strategyRevisionId,
      topStrategyRevisionId: locked.pair.top.strategyRevisionId,
    })
    if (
      locked.pair.bottom !== expectedPair.bottom ||
      locked.pair.top !== expectedPair.top ||
      locked.pair.pairHash !== expectedPair.pairHash
    ) {
      throw new Error("locked pair mismatch")
    }
    const parsed =
      RuntimeExecutionResolvedEvidenceSnapshotSchema.parse(response)
    const expected: RuntimeExecutionResolvedEvidenceSnapshot = {
      compatibility: locked.identity.compatibility,
      authorityBundleHash: locked.identity.authorityBundleHash,
      registryGeneration: locked.identity.registryGeneration,
      entrants: {
        bottom: locked.pair.bottom,
        top: locked.pair.top,
      },
    }
    if (!isDeepStrictEqual(parsed, expected)) {
      throw new Error("response identity drift")
    }
  } catch {
    throw new MatchCompletionIntegritySystemFailure()
  }
}

export interface MatchCompletionFields {
  matchId: MatchId
  outcome: GameState["outcome"]
  winnerPlayerId: string | null
  survivingSoldiers: number
  bottomSurvivingSoldiers: number
  topSurvivingSoldiers: number
  survivalTurns: number
  bottomSurvivalTurns: number
  topSurvivalTurns: number
}

const countSurvivingSoldiers = (
  finalState: GameState,
  ownerPlayerId?: string | undefined,
): number =>
  finalState.soldiers.filter(
    (soldier) =>
      soldier.status !== "FALLEN" &&
      (ownerPlayerId === undefined || soldier.ownerPlayerId === ownerPlayerId),
  ).length

export const deriveMatchCompletionFields = (
  finalState: GameState,
): MatchCompletionFields => {
  const bottomPlayerId = finalState.players.find(
    (player) => player.side === "bottom",
  )?.id
  const topPlayerId = finalState.players.find(
    (player) => player.side === "top",
  )?.id
  const survivalTurns =
    finalState.phaseNumber * 16 +
    finalState.roundNumber * 4 +
    finalState.activationCount

  return {
    matchId: finalState.matchId,
    outcome: finalState.outcome,
    winnerPlayerId:
      finalState.outcome?.type === "WIN"
        ? finalState.outcome.winnerPlayerId
        : null,
    survivingSoldiers: countSurvivingSoldiers(finalState),
    bottomSurvivingSoldiers: countSurvivingSoldiers(finalState, bottomPlayerId),
    topSurvivingSoldiers: countSurvivingSoldiers(finalState, topPlayerId),
    survivalTurns,
    bottomSurvivalTurns: survivalTurns,
    topSurvivalTurns: survivalTurns,
  }
}

interface LockedCompletionRow extends MatchSetIntegrityRow {
  job_id: string
  job_attempts: number
  attempt_id: string
  match_id: MatchId
  match_seed: string
  arena_variant_id: string
  bottom_player_id: string
  top_player_id: string
  integrity_match_set_id: string
  bottom_strategy_revision_id: string
  top_strategy_revision_id: string
  match_bottom_execution_entrant_key: string
  match_top_execution_entrant_key: string
  match_bottom_execution_evidence: unknown
  match_top_execution_evidence: unknown
  match_execution_evidence_pair_hash: string
  job_bottom_execution_entrant_key: string
  job_top_execution_entrant_key: string
  job_bottom_execution_evidence: unknown
  job_top_execution_evidence: unknown
  job_execution_evidence_pair_hash: string
  authority_publication_id: string
  authority_install_receipt_id: string
  authority_payload_sha256: string
  authority_envelope_sha256: string
  authority_source_manifest_hash: string
  authority_source_set: unknown
  publication_id: string
  publication_generation: string
  publication_tuple_manifest_hash: string
  publication_payload_sha256: string
  publication_envelope_sha256: string
  publication_source_manifest_hash: string
  publication_source_set: unknown
  installed_receipt_id: string
  installed_receipt: unknown
}

interface IdempotentCompletionRow extends LockedCompletionRow {
  match_status: string
  match_outcome: unknown
  winner_player_id: string | null
  surviving_soldiers: number | null
  bottom_surviving_soldiers: number | null
  top_surviving_soldiers: number | null
  survival_turns: number | null
  bottom_survival_turns: number | null
  top_survival_turns: number | null
  job_status: string
  attempt_status: string
  lease_token: string | null
  chronicle_id: string
  chronicle_schema_version: string
  chronicle_hash: string
  chronicle_artifact: Chronicle
  chronicle_outcome: unknown
  chronicle_event_count: number
  chronicle_snapshot_count: number
  chronicle_bottom_player_id: string
  chronicle_top_player_id: string
  chronicle_bottom_strategy_revision_id: string
  chronicle_top_strategy_revision_id: string
  chronicle_arena_variant_id: string
  chronicle_match_set_id: string
  chronicle_bottom_execution_entrant_key: string
  chronicle_top_execution_entrant_key: string
  chronicle_bottom_execution_evidence: unknown
  chronicle_top_execution_evidence: unknown
  chronicle_execution_evidence_pair_hash: string
  chronicle_compatibility_tuple_id: string
  chronicle_compatibility_rules_version: string
  chronicle_compatibility_engine_version: string
  chronicle_compatibility_runtime_abi_version: string
  chronicle_compatibility_chronicle_version: string
  chronicle_compatibility_arena_catalog_version: string
  chronicle_compatibility_set_policy_version: string
  chronicle_authority_bundle_hash: string
  chronicle_authority_registry_generation: string
  chronicle_authority_publication_id: string
  chronicle_authority_install_receipt_id: string
  chronicle_authority_payload_sha256: string
  chronicle_authority_envelope_sha256: string
  chronicle_authority_source_manifest_hash: string
  chronicle_authority_source_set: unknown
}

const assertLockedOrderedPair = (
  row: LockedCompletionRow,
  pair: Readonly<MatchExecutionEvidencePair>,
): void => {
  if (
    row.match_bottom_execution_entrant_key !== pair.bottom.entrantKey ||
    row.match_top_execution_entrant_key !== pair.top.entrantKey ||
    row.job_bottom_execution_entrant_key !== pair.bottom.entrantKey ||
    row.job_top_execution_entrant_key !== pair.top.entrantKey ||
    row.match_execution_evidence_pair_hash !== pair.pairHash ||
    row.job_execution_evidence_pair_hash !== pair.pairHash ||
    !isDeepStrictEqual(row.match_bottom_execution_evidence, pair.bottom) ||
    !isDeepStrictEqual(row.match_top_execution_evidence, pair.top) ||
    !isDeepStrictEqual(row.job_bottom_execution_evidence, pair.bottom) ||
    !isDeepStrictEqual(row.job_top_execution_evidence, pair.top)
  ) {
    throw new MatchCompletionIntegritySystemFailure()
  }
}

const assertCandidateDatabaseIdentity = (
  prepared: PreparedCompletion,
  locked: LockedCompletionRow,
): void => {
  if (prepared.profile !== "candidate-v1.37") return
  const bottom = prepared.finalState.players.find(
    (player) => player.side === "bottom",
  )!
  const top = prepared.finalState.players.find(
    (player) => player.side === "top",
  )!
  if (
    locked.match_id !== prepared.finalState.matchId ||
    locked.match_seed !== prepared.finalState.seed ||
    locked.arena_variant_id !== prepared.finalState.arenaVariant.id ||
    locked.bottom_player_id !== bottom.id ||
    locked.top_player_id !== top.id ||
    locked.bottom_strategy_revision_id !== bottom.strategyRevisionId ||
    locked.top_strategy_revision_id !== top.strategyRevisionId
  ) {
    throw new MatchCompletionSemanticSystemFailure(
      "CANDIDATE_DATABASE_IDENTITY_INVALID",
    )
  }
}

const assertLockedAuthorityClaim = (row: LockedCompletionRow): void => {
  const sourceSet = {
    attestationIds: [],
    certificateIds: [],
    revocationIds: [],
    supersessionIds: [],
    laneControlIds: [],
    ...(isRecord(row.publication_source_set) ? row.publication_source_set : {}),
  }
  const receipt = row.installed_receipt
  if (
    row.authority_publication_id !== row.publication_id ||
    row.authority_install_receipt_id !== row.installed_receipt_id ||
    row.authority_registry_generation !== row.publication_generation ||
    row.authority_bundle_hash !==
      row.publication_payload_sha256.replace(/^sha256:/u, "") ||
    row.compatibility_tuple_id !== row.publication_tuple_manifest_hash ||
    row.authority_payload_sha256 !== row.publication_payload_sha256 ||
    row.authority_envelope_sha256 !== row.publication_envelope_sha256 ||
    row.authority_source_manifest_hash !==
      row.publication_source_manifest_hash ||
    !isDeepStrictEqual(row.authority_source_set, sourceSet) ||
    !isRecord(receipt) ||
    receipt.generation !== row.publication_generation ||
    receipt.payloadSha256 !== row.publication_payload_sha256 ||
    receipt.envelopeSha256 !== row.publication_envelope_sha256 ||
    receipt.sourceManifestHash !== row.publication_source_manifest_hash ||
    !isDeepStrictEqual(receipt.sourceIds, sourceSet)
  ) {
    throw new MatchCompletionIntegritySystemFailure()
  }
}

const currentAuthorityCte = `
  with current_authority as materialized (
    select publication.*,
           installed_head.install_receipt_id,
           installed_head.receipt as installed_receipt,
           jsonb_build_object(
             'attestationIds', publication.attestation_ids,
             'certificateIds', publication.certificate_ids,
             'revocationIds', publication.revocation_ids,
             'supersessionIds', publication.supersession_ids,
             'laneControlIds', publication.lane_control_ids
           ) as source_set
      from runtime_evidence_authority_installed_head installed_head
      join runtime_evidence_authority_publications publication
        on publication.id = installed_head.publication_id
      join runtime_evidence_authority_publication_head authority_head
        on authority_head.singleton = true
       and publication.generation < authority_head.next_generation
     where publication.issued_at <= now()
       and publication.valid_from <= now()
       and publication.valid_until >= now()
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
`

export const completeMatch = async (
  pool: Pool,
  input: CompleteMatchRequest,
): Promise<{ status: "complete"; matchId: MatchId; chronicleId: string }> => {
  // Candidate evidence is fully admitted and cloned before any derived result
  // is computed and before a database connection/transaction is opened.
  const prepared = prepareCompletion(input)
  const fields = deriveMatchCompletionFields(prepared.finalState)
  let chronicleId: string | undefined

  await withTransaction(pool, async (client) => {
    await client.query(
      "select next_generation from runtime_evidence_authority_publication_head where singleton = true for share",
    )
    const job = await client.query<LockedCompletionRow>(
      `${currentAuthorityCte}
        select
          j.id as job_id,
          j.attempts as job_attempts,
          attempt.id as attempt_id,
          m.id as match_id,
          m.seed as match_seed,
          m.arena_variant_id,
          m.bottom_player_id,
          m.top_player_id,
          m.integrity_match_set_id,
          m.bottom_strategy_revision_id,
          m.top_strategy_revision_id,
          m.bottom_execution_entrant_key as match_bottom_execution_entrant_key,
          m.top_execution_entrant_key as match_top_execution_entrant_key,
          m.bottom_execution_evidence as match_bottom_execution_evidence,
          m.top_execution_evidence as match_top_execution_evidence,
          m.execution_evidence_pair_hash as match_execution_evidence_pair_hash,
          j.bottom_execution_entrant_key as job_bottom_execution_entrant_key,
          j.top_execution_entrant_key as job_top_execution_entrant_key,
          j.bottom_execution_evidence as job_bottom_execution_evidence,
          j.top_execution_evidence as job_top_execution_evidence,
          j.execution_evidence_pair_hash as job_execution_evidence_pair_hash,
          ms.compatibility_tuple_id,
          ms.compatibility_rules_version,
          ms.compatibility_engine_version,
          ms.compatibility_runtime_abi_version,
          ms.compatibility_chronicle_version,
          ms.compatibility_arena_catalog_version,
          ms.compatibility_set_policy_version,
          ms.authority_bundle_hash,
          ms.authority_registry_generation,
          ms.execution_evidence_set,
          ms.execution_evidence_set_hash,
          ms.authority_publication_id,
          ms.authority_install_receipt_id,
          ms.authority_payload_sha256,
          ms.authority_envelope_sha256,
          ms.authority_source_manifest_hash,
          ms.authority_source_set,
          authority.id as publication_id,
          authority.generation::text as publication_generation,
          authority.semantic_tuple_manifest_hash as publication_tuple_manifest_hash,
          authority.payload_sha256 as publication_payload_sha256,
          authority.envelope_sha256 as publication_envelope_sha256,
          authority.source_manifest_hash as publication_source_manifest_hash,
          authority.source_set as publication_source_set,
          authority.install_receipt_id as installed_receipt_id,
          authority.installed_receipt
        from match_jobs j
        join matches m on m.id = j.match_id
        join match_sets ms on ms.id = m.integrity_match_set_id
        join current_authority authority
          on authority.id = ms.authority_publication_id
         and authority.install_receipt_id = ms.authority_install_receipt_id
         and authority.generation::text = ms.authority_registry_generation
         and authority.payload_sha256 = ms.authority_payload_sha256
         and authority.envelope_sha256 = ms.authority_envelope_sha256
         and authority.source_manifest_hash = ms.authority_source_manifest_hash
         and authority.source_set = ms.authority_source_set
         and substring(authority.payload_sha256 from 8) = ms.authority_bundle_hash
         and authority.semantic_tuple_manifest_hash = ms.compatibility_tuple_id
        join match_set_execution_entrants bottom_entrant
          on bottom_entrant.match_set_id = ms.id
         and bottom_entrant.entrant_key = j.bottom_execution_entrant_key
        join match_set_execution_entrants top_entrant
          on top_entrant.match_set_id = ms.id
         and top_entrant.entrant_key = j.top_execution_entrant_key
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
        join match_job_attempts attempt
          on attempt.job_id = j.id
         and attempt.attempt_number = j.attempts
         and attempt.status = 'running'
         and attempt.worker_id = j.worker_id
        where j.id = $1
          and j.lease_token = $2
          and j.status = 'running'
          and j.lease_expires_at >= now()
          and m.id = $3
          and m.status = 'running'
          and j.integrity_match_set_id = m.integrity_match_set_id
          and j.bottom_execution_entrant_key = m.bottom_execution_entrant_key
          and j.top_execution_entrant_key = m.top_execution_entrant_key
          and j.bottom_execution_evidence = m.bottom_execution_evidence
          and j.top_execution_evidence = m.top_execution_evidence
          and j.execution_evidence_pair_hash = m.execution_evidence_pair_hash
          and j.bottom_execution_evidence = bottom_entrant.execution_snapshot
          and j.top_execution_evidence = top_entrant.execution_snapshot
          and bottom_entrant.authority_bundle_hash = ms.authority_bundle_hash
          and top_entrant.authority_bundle_hash = ms.authority_bundle_hash
          and bottom_entrant.authority_registry_generation = authority.generation::text
          and top_entrant.authority_registry_generation = authority.generation::text
          and bottom_entrant.scheduling_status <> 'disabled'
          and top_entrant.scheduling_status <> 'disabled'
          and bottom_entrant.scheduling_evaluated_at <= now()
          and bottom_entrant.scheduling_fresh_until >= now()
          and top_entrant.scheduling_evaluated_at <= now()
          and top_entrant.scheduling_fresh_until >= now()
          and (
            (bottom_entrant.scheduling_status = 'counted'
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
             and top_conformance.id is not null)
            or
            (top_entrant.scheduling_status = 'exhibition_only'
             and top_entrant.conformance_certificate_kind is null
             and top_entrant.conformance_certificate_id is null
             and top_entrant.conformance_certificate_version is null
             and top_entrant.conformance_certificate_hash is null)
          )
          and bottom_containment.issued_at <= now()
          and bottom_containment.fresh_until >= now()
          and top_containment.issued_at <= now()
          and top_containment.fresh_until >= now()
          and (bottom_entrant.scheduling_status <> 'counted'
               or (bottom_conformance.issued_at <= now()
                   and bottom_conformance.fresh_until >= now()))
          and (top_entrant.scheduling_status <> 'counted'
               or (top_conformance.issued_at <= now()
                   and top_conformance.fresh_until >= now()))
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
          and (bottom_entrant.scheduling_status <> 'counted' or exists (
            select 1 from runtime_evidence_authority_publication_sources source
             where source.publication_id = authority.id
               and source.source_type = 'certificate'
               and source.source_id = bottom_conformance.id
               and source.source_record_hash = 'sha256:' || bottom_conformance.certificate_record_hash
          ))
          and (top_entrant.scheduling_status <> 'counted' or exists (
            select 1 from runtime_evidence_authority_publication_sources source
             where source.publication_id = authority.id
               and source.source_type = 'certificate'
               and source.source_id = top_conformance.id
               and source.source_record_hash = 'sha256:' || top_conformance.certificate_record_hash
          ))
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
        for update of j, m, ms, attempt
      `,
      [prepared.jobId, prepared.leaseToken, fields.matchId],
    )
    const locked = job.rows[0]
    if (!locked) {
      const existing = await client.query<IdempotentCompletionRow>(
        `
          select
            j.id as job_id, j.attempts as job_attempts,
            attempt.id as attempt_id,
            m.id as match_id, m.seed as match_seed, m.arena_variant_id,
            m.bottom_player_id, m.top_player_id, m.integrity_match_set_id,
            m.bottom_strategy_revision_id, m.top_strategy_revision_id,
            m.bottom_execution_entrant_key as match_bottom_execution_entrant_key,
            m.top_execution_entrant_key as match_top_execution_entrant_key,
            m.bottom_execution_evidence as match_bottom_execution_evidence,
            m.top_execution_evidence as match_top_execution_evidence,
            m.execution_evidence_pair_hash as match_execution_evidence_pair_hash,
            j.bottom_execution_entrant_key as job_bottom_execution_entrant_key,
            j.top_execution_entrant_key as job_top_execution_entrant_key,
            j.bottom_execution_evidence as job_bottom_execution_evidence,
            j.top_execution_evidence as job_top_execution_evidence,
            j.execution_evidence_pair_hash as job_execution_evidence_pair_hash,
            ms.compatibility_tuple_id, ms.compatibility_rules_version,
            ms.compatibility_engine_version, ms.compatibility_runtime_abi_version,
            ms.compatibility_chronicle_version, ms.compatibility_arena_catalog_version,
            ms.compatibility_set_policy_version, ms.authority_bundle_hash,
            ms.authority_registry_generation, ms.execution_evidence_set,
            ms.execution_evidence_set_hash, ms.authority_publication_id,
            ms.authority_install_receipt_id, ms.authority_payload_sha256,
            ms.authority_envelope_sha256, ms.authority_source_manifest_hash,
            ms.authority_source_set,
            publication.id as publication_id,
            publication.generation::text as publication_generation,
            publication.semantic_tuple_manifest_hash as publication_tuple_manifest_hash,
            publication.payload_sha256 as publication_payload_sha256,
            publication.envelope_sha256 as publication_envelope_sha256,
            publication.source_manifest_hash as publication_source_manifest_hash,
            jsonb_build_object(
              'attestationIds', publication.attestation_ids,
              'certificateIds', publication.certificate_ids,
              'revocationIds', publication.revocation_ids,
              'supersessionIds', publication.supersession_ids,
              'laneControlIds', publication.lane_control_ids
            ) as publication_source_set,
            installed.id as installed_receipt_id,
            installed.receipt as installed_receipt,
            m.status as match_status, m.outcome as match_outcome,
            m.winner_player_id, m.surviving_soldiers,
            m.bottom_surviving_soldiers, m.top_surviving_soldiers,
            m.survival_turns, m.bottom_survival_turns, m.top_survival_turns,
            j.status as job_status, j.lease_token, attempt.status as attempt_status,
            c.id as chronicle_id, c.schema_version as chronicle_schema_version,
            c.hash as chronicle_hash,
            c.artifact as chronicle_artifact, c.outcome as chronicle_outcome,
            c.event_count as chronicle_event_count,
            c.snapshot_count as chronicle_snapshot_count,
            c.bottom_player_id as chronicle_bottom_player_id,
            c.top_player_id as chronicle_top_player_id,
            c.bottom_strategy_revision_id as chronicle_bottom_strategy_revision_id,
            c.top_strategy_revision_id as chronicle_top_strategy_revision_id,
            c.arena_variant_id as chronicle_arena_variant_id,
            c.integrity_match_set_id as chronicle_match_set_id,
            c.bottom_execution_entrant_key as chronicle_bottom_execution_entrant_key,
            c.top_execution_entrant_key as chronicle_top_execution_entrant_key,
            c.bottom_execution_evidence as chronicle_bottom_execution_evidence,
            c.top_execution_evidence as chronicle_top_execution_evidence,
            c.execution_evidence_pair_hash as chronicle_execution_evidence_pair_hash,
            c.compatibility_tuple_id as chronicle_compatibility_tuple_id,
            c.compatibility_rules_version as chronicle_compatibility_rules_version,
            c.compatibility_engine_version as chronicle_compatibility_engine_version,
            c.compatibility_runtime_abi_version as chronicle_compatibility_runtime_abi_version,
            c.compatibility_chronicle_version as chronicle_compatibility_chronicle_version,
            c.compatibility_arena_catalog_version as chronicle_compatibility_arena_catalog_version,
            c.compatibility_set_policy_version as chronicle_compatibility_set_policy_version,
            c.authority_bundle_hash as chronicle_authority_bundle_hash,
            c.authority_registry_generation as chronicle_authority_registry_generation,
            c.authority_publication_id as chronicle_authority_publication_id,
            c.authority_install_receipt_id as chronicle_authority_install_receipt_id,
            c.authority_payload_sha256 as chronicle_authority_payload_sha256,
            c.authority_envelope_sha256 as chronicle_authority_envelope_sha256,
            c.authority_source_manifest_hash as chronicle_authority_source_manifest_hash,
            c.authority_source_set as chronicle_authority_source_set
          from matches m
          join chronicles c on c.match_id = m.id
          join match_jobs j on j.match_id = m.id
          join match_job_attempts attempt
            on attempt.job_id = j.id and attempt.attempt_number = j.attempts
          join match_sets ms on ms.id = m.integrity_match_set_id
          join runtime_evidence_authority_publications publication
            on publication.id = ms.authority_publication_id
           and publication.generation::text = ms.authority_registry_generation
           and publication.semantic_tuple_manifest_hash = ms.compatibility_tuple_id
           and publication.payload_sha256 = ms.authority_payload_sha256
           and publication.envelope_sha256 = ms.authority_envelope_sha256
           and publication.source_manifest_hash = ms.authority_source_manifest_hash
          join runtime_evidence_authority_publication_events installed
            on installed.id = ms.authority_install_receipt_id
           and installed.publication_id = publication.id
           and installed.event_kind = 'installed'
           and installed.reason_code is null
          where m.id = $1 and j.id = $2 and m.status = 'complete'
          for share of m, j, attempt, ms
        `,
        [fields.matchId, prepared.jobId],
      )
      const row = existing.rows[0]
      if (!row) {
        throw new MatchCompletionOperationalSystemFailure()
      }
      const entrantRows = await client.query<MatchSetExecutionEntrantRow>(
        `select match_set_id, entrant_key, strategy_revision_id,
                execution_snapshot
           from match_set_execution_entrants
          where match_set_id = $1
          order by entrant_key
          for share`,
        [row.integrity_match_set_id],
      )
      let identity: Readonly<MatchSetIntegrityIdentity>
      let pair: Readonly<MatchExecutionEvidencePair>
      try {
        identity = parseMatchSetIntegrityIdentityRows(row, entrantRows.rows)
        pair = createMatchExecutionEvidencePair(identity, {
          bottomEntrantKey: row.match_bottom_execution_entrant_key,
          topEntrantKey: row.match_top_execution_entrant_key,
          bottomStrategyRevisionId: row.bottom_strategy_revision_id,
          topStrategyRevisionId: row.top_strategy_revision_id,
        })
        assertLockedOrderedPair(row, pair)
        assertLockedAuthorityClaim(row)
        validateCompletionIntegritySnapshot(
          { identity, pair },
          prepared.integrityIdentity,
        )
        assertCandidateDatabaseIdentity(prepared, row)
      } catch (error) {
        if (error instanceof MatchCompletionSemanticSystemFailure) throw error
        throw new MatchCompletionIntegritySystemFailure()
      }
      const contentHash = createChronicleContentHash(
        prepared.chronicle,
      ).normalizedContentHash
      const bottomPlayer = prepared.finalState.players.find(
        (player) => player.side === "bottom",
      )
      const topPlayer = prepared.finalState.players.find(
        (player) => player.side === "top",
      )
      if (
        row.job_status !== "complete" ||
        row.attempt_status !== "complete" ||
        row.lease_token !== prepared.leaseToken ||
        !isDeepStrictEqual(row.match_outcome, fields.outcome) ||
        row.winner_player_id !== fields.winnerPlayerId ||
        row.surviving_soldiers !== fields.survivingSoldiers ||
        row.bottom_surviving_soldiers !== fields.bottomSurvivingSoldiers ||
        row.top_surviving_soldiers !== fields.topSurvivingSoldiers ||
        row.survival_turns !== fields.survivalTurns ||
        row.bottom_survival_turns !== fields.bottomSurvivalTurns ||
        row.top_survival_turns !== fields.topSurvivalTurns ||
        row.chronicle_schema_version !== prepared.chronicle.schemaVersion ||
        row.chronicle_hash !== contentHash ||
        !isDeepStrictEqual(row.chronicle_artifact, prepared.chronicle) ||
        !isDeepStrictEqual(row.chronicle_outcome, fields.outcome) ||
        row.chronicle_event_count !== prepared.chronicle.events.length ||
        row.chronicle_snapshot_count !== prepared.chronicle.snapshots.length ||
        !bottomPlayer ||
        !topPlayer ||
        row.chronicle_bottom_player_id !== bottomPlayer.id ||
        row.chronicle_top_player_id !== topPlayer.id ||
        row.chronicle_bottom_strategy_revision_id !==
          bottomPlayer.strategyRevisionId ||
        row.chronicle_top_strategy_revision_id !==
          topPlayer.strategyRevisionId ||
        row.chronicle_arena_variant_id !==
          prepared.finalState.arenaVariant.id ||
        row.chronicle_match_set_id !== row.integrity_match_set_id ||
        row.chronicle_bottom_execution_entrant_key !== pair.bottom.entrantKey ||
        row.chronicle_top_execution_entrant_key !== pair.top.entrantKey ||
        !isDeepStrictEqual(
          row.chronicle_bottom_execution_evidence,
          pair.bottom,
        ) ||
        !isDeepStrictEqual(row.chronicle_top_execution_evidence, pair.top) ||
        row.chronicle_execution_evidence_pair_hash !== pair.pairHash ||
        row.chronicle_compatibility_tuple_id !== row.compatibility_tuple_id ||
        row.chronicle_compatibility_rules_version !==
          row.compatibility_rules_version ||
        row.chronicle_compatibility_engine_version !==
          row.compatibility_engine_version ||
        row.chronicle_compatibility_runtime_abi_version !==
          row.compatibility_runtime_abi_version ||
        row.chronicle_compatibility_chronicle_version !==
          row.compatibility_chronicle_version ||
        row.chronicle_compatibility_arena_catalog_version !==
          row.compatibility_arena_catalog_version ||
        row.chronicle_compatibility_set_policy_version !==
          row.compatibility_set_policy_version ||
        row.chronicle_authority_bundle_hash !== row.authority_bundle_hash ||
        row.chronicle_authority_registry_generation !==
          row.authority_registry_generation ||
        row.chronicle_authority_publication_id !==
          row.authority_publication_id ||
        row.chronicle_authority_install_receipt_id !==
          row.authority_install_receipt_id ||
        row.chronicle_authority_payload_sha256 !==
          row.authority_payload_sha256 ||
        row.chronicle_authority_envelope_sha256 !==
          row.authority_envelope_sha256 ||
        row.chronicle_authority_source_manifest_hash !==
          row.authority_source_manifest_hash ||
        !isDeepStrictEqual(
          row.chronicle_authority_source_set,
          row.authority_source_set,
        )
      ) {
        throw new MatchCompletionIntegritySystemFailure()
      }
      chronicleId = row.chronicle_id
      return
    }
    const entrantRows = await client.query<MatchSetExecutionEntrantRow>(
      `
        select match_set_id, entrant_key, strategy_revision_id,
               execution_snapshot
        from match_set_execution_entrants
        where match_set_id = $1
        order by entrant_key
        for share
      `,
      [locked.integrity_match_set_id],
    )
    let identity: Readonly<MatchSetIntegrityIdentity>
    let pair: Readonly<MatchExecutionEvidencePair>
    try {
      identity = parseMatchSetIntegrityIdentityRows(locked, entrantRows.rows)
      pair = createMatchExecutionEvidencePair(identity, {
        bottomEntrantKey: locked.match_bottom_execution_entrant_key,
        topEntrantKey: locked.match_top_execution_entrant_key,
        bottomStrategyRevisionId: locked.bottom_strategy_revision_id,
        topStrategyRevisionId: locked.top_strategy_revision_id,
      })
      assertLockedOrderedPair(locked, pair)
    } catch {
      throw new MatchCompletionIntegritySystemFailure()
    }
    validateCompletionIntegritySnapshot(
      { identity, pair },
      prepared.integrityIdentity,
    )
    assertLockedAuthorityClaim(locked)
    assertCandidateDatabaseIdentity(prepared, locked)

    const store = createPostgresChronicleStore(client)
    const integrityIdentity = {
      matchSetId: locked.integrity_match_set_id,
      identity,
      evidencePair: pair,
    }
    const stored = await store.put(
      prepared.profile === "candidate-v1.37"
        ? {
            candidateAdmission: prepared.candidateAdmission!,
            integrityIdentity,
          }
        : { chronicle: prepared.chronicle, integrityIdentity },
    )
    chronicleId = stored.metadata.id
    const completedMatch = await client.query(
      `
        update matches
        set status = 'complete',
            outcome = $1,
            winner_player_id = $2,
            surviving_soldiers = $3,
            bottom_surviving_soldiers = $4,
            top_surviving_soldiers = $5,
            survival_turns = $6,
            bottom_survival_turns = $7,
            top_survival_turns = $8,
            completed_at = now()
        where id = $9 and status = 'running'
        returning id
      `,
      [
        fields.outcome,
        fields.winnerPlayerId,
        fields.survivingSoldiers,
        fields.bottomSurvivingSoldiers,
        fields.topSurvivingSoldiers,
        fields.survivalTurns,
        fields.bottomSurvivalTurns,
        fields.topSurvivalTurns,
        fields.matchId,
      ],
    )
    if ((completedMatch.rowCount ?? 0) !== 1) {
      throw new MatchCompletionIntegritySystemFailure()
    }
    const completedJob = await client.query(
      `
        update match_jobs
        set status = 'complete',
            updated_at = now()
        where id = $1
          and lease_token = $2
          and status = 'running'
          and attempts = $3
        returning id
      `,
      [prepared.jobId, prepared.leaseToken, locked.job_attempts],
    )
    if ((completedJob.rowCount ?? 0) !== 1) {
      throw new MatchCompletionOperationalSystemFailure(
        "Match completion lost its exact running lease.",
      )
    }
    const completedAttempt = await client.query(
      `
        update match_job_attempts
        set finished_at = now(),
            status = 'complete'
        where id = $1
          and job_id = $2
          and attempt_number = $3
          and status = 'running'
        returning id
      `,
      [locked.attempt_id, prepared.jobId, locked.job_attempts],
    )
    if ((completedAttempt.rowCount ?? 0) !== 1) {
      throw new MatchCompletionOperationalSystemFailure(
        "Match completion lost its exact running attempt.",
      )
    }
  })

  return {
    status: "complete",
    matchId: fields.matchId,
    chronicleId: chronicleId ?? "",
  }
}
