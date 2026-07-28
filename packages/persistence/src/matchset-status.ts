import type {
  ARENA_CATALOG_VERSION_V1_37,
  JsonValue,
  MatchId,
  MatchSetId,
  PlayerId,
  StrategyRevisionId,
} from "@cowards/spec"
import {
  CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID,
  createSetScenarioV137,
} from "@cowards/spec"
import type { Pool } from "pg"
import {
  scoreMatchSet,
  scoreSuccessorMatchSetV119,
  type MatchScoreInput,
  type MatchSetScore,
  type SuccessorMatchScoreInputV119,
} from "./scoring.js"
import type { MatchSetStatus, MatchStatus } from "./schema.js"

export interface MatchSetMatchSummary {
  matchId: MatchId
  status: MatchStatus
  bottomPlayerId: PlayerId
  topPlayerId: PlayerId
  outcome?: JsonValue | undefined
  winnerPlayerId?: PlayerId | undefined
  hasReplay: boolean
}

export const LIST_MATCH_STATUSES_FOR_SET_SQL = `
  select
    m.id as match_id,
    m.status,
    m.bottom_player_id,
    m.top_player_id,
    m.outcome,
    m.winner_player_id,
    c.match_id as chronicle_match_id
  from match_set_matches msm
  join matches m on m.id = msm.match_id
  left join chronicles c on c.match_id = m.id
  where msm.match_set_id = $1
  order by msm.matrix_index asc
`

export const mapMatchSetMatchSummaryRow = (row: {
  match_id: MatchId
  status: MatchStatus
  bottom_player_id: PlayerId
  top_player_id: PlayerId
  outcome: JsonValue | null
  winner_player_id: PlayerId | null
  chronicle_match_id: MatchId | null
}): MatchSetMatchSummary => ({
  matchId: row.match_id,
  status: row.status,
  bottomPlayerId: row.bottom_player_id,
  topPlayerId: row.top_player_id,
  ...(row.outcome === null ? {} : { outcome: row.outcome }),
  ...(row.winner_player_id === null
    ? {}
    : { winnerPlayerId: row.winner_player_id }),
  hasReplay: row.status === "complete" && row.chronicle_match_id !== null,
})

export const listMatchStatusesForSet = async (
  pool: Pool,
  matchSetId: MatchSetId,
): Promise<MatchSetMatchSummary[]> => {
  const result = await pool.query<{
    match_id: MatchId
    status: MatchStatus
    bottom_player_id: PlayerId
    top_player_id: PlayerId
    outcome: JsonValue | null
    winner_player_id: PlayerId | null
    chronicle_match_id: MatchId | null
  }>(LIST_MATCH_STATUSES_FOR_SET_SQL, [matchSetId])
  return result.rows.map(mapMatchSetMatchSummaryRow)
}

export const determineMatchSetStatus = (
  scoring: MatchSetScore,
  statuses: readonly MatchStatus[],
): MatchSetStatus => {
  if (
    statuses.length === 0 ||
    statuses.every((status) => status === "pending")
  ) {
    return "pending"
  }
  if (statuses.some((status) => status === "running")) {
    return statuses.some((status) => status === "failed_system")
      ? "degraded"
      : "running"
  }
  if (scoring.degraded) {
    return statuses.every(
      (status) => status === "complete" || status === "failed_system",
    )
      ? "degraded"
      : "running"
  }
  return statuses.every((status) => status === "complete")
    ? "complete"
    : "running"
}

export interface SuccessorMatchSetStatusEvidenceV119 {
  canonicalConditionCount: number
  validTerminalConditionCount: number
  retryableSystemFailure: boolean
  exhaustedSystemFailure: boolean
  invalidRevisionEvidence: boolean
}

export const determineSuccessorMatchSetStatusV119 = (
  evidence: SuccessorMatchSetStatusEvidenceV119,
): Readonly<{
  status: "pending" | "complete" | "degraded"
  counted: boolean
}> => {
  const exactComplete =
    evidence.canonicalConditionCount === 4 &&
    evidence.validTerminalConditionCount === 4 &&
    !evidence.invalidRevisionEvidence &&
    !evidence.retryableSystemFailure &&
    !evidence.exhaustedSystemFailure
  if (exactComplete) {
    return Object.freeze({ status: "complete", counted: true })
  }
  return Object.freeze({
    status: evidence.exhaustedSystemFailure ? "degraded" : "pending",
    counted: false,
  })
}

export const refreshMatchSetStatus = async (
  pool: Pool,
  matchSetId: MatchSetId,
): Promise<{ status: MatchSetStatus; scoring: MatchSetScore }> => {
  const result = await pool.query<{
    match_id: MatchId
    status: MatchStatus
    bottom_strategy_revision_id: StrategyRevisionId
    top_strategy_revision_id: StrategyRevisionId
    winner_player_id: string | null
    bottom_player_id: string
    top_player_id: string
    surviving_soldiers: number | null
    bottom_surviving_soldiers: number | null
    top_surviving_soldiers: number | null
    survival_turns: number | null
    bottom_survival_turns: number | null
    top_survival_turns: number | null
  }>(
    `
      select
        m.id as match_id,
        m.status,
        m.bottom_strategy_revision_id,
        m.top_strategy_revision_id,
        m.winner_player_id,
        m.bottom_player_id,
        m.top_player_id,
        m.surviving_soldiers,
        m.bottom_surviving_soldiers,
        m.top_surviving_soldiers,
        m.survival_turns,
        m.bottom_survival_turns,
        m.top_survival_turns
      from match_set_matches msm
      join matches m on m.id = msm.match_id
      where msm.match_set_id = $1
      order by msm.matrix_index asc
    `,
    [matchSetId],
  )
  const matches: MatchScoreInput[] = result.rows.map((row) => ({
    matchId: row.match_id,
    bottomStrategyRevisionId: row.bottom_strategy_revision_id,
    topStrategyRevisionId: row.top_strategy_revision_id,
    winnerStrategyRevisionId:
      row.winner_player_id === row.bottom_player_id
        ? row.bottom_strategy_revision_id
        : row.winner_player_id === row.top_player_id
          ? row.top_strategy_revision_id
          : undefined,
    status: row.status,
    survivingSoldiers: row.surviving_soldiers ?? 0,
    bottomSurvivingSoldiers:
      row.bottom_surviving_soldiers ?? row.surviving_soldiers ?? 0,
    topSurvivingSoldiers:
      row.top_surviving_soldiers ?? row.surviving_soldiers ?? 0,
    survivalTurns: row.survival_turns ?? 0,
    bottomSurvivalTurns: row.bottom_survival_turns ?? row.survival_turns ?? 0,
    topSurvivalTurns: row.top_survival_turns ?? row.survival_turns ?? 0,
  }))

  const successor = await pool.query<{
    compatibility_tuple_id: string
    scenario_id: `set-scenario:sha256:${string}`
    arena_catalog_version: typeof ARENA_CATALOG_VERSION_V1_37
    arena_semantic_geometry_hash: `sha256:${string}`
    entrant_a_key: string
    entrant_b_key: string
    entrant_a_player_id: string
    entrant_b_player_id: string
    base_seed: string
    match_id: MatchId
    status: MatchStatus
    bottom_strategy_revision_id: StrategyRevisionId
    top_strategy_revision_id: StrategyRevisionId
    winner_player_id: string | null
    bottom_player_id: string
    top_player_id: string
    surviving_soldiers: number | null
    bottom_surviving_soldiers: number | null
    top_surviving_soldiers: number | null
    survival_turns: number | null
    bottom_survival_turns: number | null
    top_survival_turns: number | null
    condition_id: `set-condition:sha256:${string}`
    condition_ordinal: 0 | 1 | 2 | 3
    request_identity: `set-request:sha256:${string}`
    bottom_entrant_key: string
    top_entrant_key: string
    initial_initiative_entrant_key: string
    attempts: number
    max_attempts: number
    bottom_revalidation_id: string | null
    bottom_revalidation_root: `sha256:${string}` | null
    top_revalidation_id: string | null
    top_revalidation_root: `sha256:${string}` | null
  }>(
    `select ms.compatibility_tuple_id,
            ss.scenario_id, ss.arena_catalog_version,
            ss.arena_semantic_geometry_hash, ss.entrant_a_key,
            ss.entrant_b_key, ss.entrant_a_player_id, ss.entrant_b_player_id,
            ss.base_seed, m.id as match_id, m.status,
            m.bottom_strategy_revision_id, m.top_strategy_revision_id,
            m.winner_player_id, m.bottom_player_id, m.top_player_id,
            m.surviving_soldiers, m.bottom_surviving_soldiers,
            m.top_surviving_soldiers, m.survival_turns,
            m.bottom_survival_turns, m.top_survival_turns,
            sc.condition_id, sc.condition_ordinal, sc.request_identity,
            sc.bottom_entrant_key, sc.top_entrant_key,
            sc.initial_initiative_entrant_key, j.attempts, j.max_attempts,
            bottom_evidence.id as bottom_revalidation_id,
            bottom_evidence.execution_receipt_root as bottom_revalidation_root,
            top_evidence.id as top_revalidation_id,
            top_evidence.execution_receipt_root as top_revalidation_root
       from match_sets ms
       join set_scenarios ss on ss.match_set_id = ms.id
       join set_conditions sc
         on sc.match_set_id = ss.match_set_id
        and sc.scenario_id = ss.scenario_id
       join matches m
         on m.successor_match_set_id = sc.match_set_id
        and m.successor_scenario_id = sc.scenario_id
        and m.successor_condition_id = sc.condition_id
       join match_jobs j on j.match_id = m.id
       join strategy_revisions bottom_revision
         on bottom_revision.id = m.bottom_strategy_revision_id
       join strategy_revisions top_revision
         on top_revision.id = m.top_strategy_revision_id
       left join lateral (
         select evidence.id, evidence.execution_receipt_root
           from strategy_revision_v1_19_revalidations evidence
           left join strategy_revision_v1_19_revalidation_revocations revoked
             on revoked.revalidation_id = evidence.id
          where evidence.strategy_revision_id = m.bottom_strategy_revision_id
            and evidence.semantic_runtime_version = 'runtime-v1.19'
            and evidence.runtime_abi_version = 'strategy-runtime-abi-v1.19'
            and evidence.semantic_tuple_id = ms.compatibility_tuple_id
            and evidence.source_hash = bottom_revision.source_hash
            and evidence.source_bytes = bottom_revision.source_bytes
            and evidence.artifact_sha256 = bottom_revision.compiled_artifact ->> 'hash'
            and evidence.artifact_bytes = (bottom_revision.compiled_artifact ->> 'bytes')::integer
            and evidence.language_id = m.bottom_execution_evidence -> 'laneIdentity' ->> 'languageId'
            and evidence.provider_id = m.bottom_execution_evidence -> 'laneIdentity' ->> 'providerId'
            and evidence.lane_id = m.bottom_execution_evidence -> 'laneIdentity' ->> 'adapterId'
            and evidence.reviewed_certificate_id = m.bottom_execution_evidence -> 'conformanceCertificateRef' ->> 'certificateId'
            and evidence.reviewed_certificate_sha256 = 'sha256:' || (m.bottom_execution_evidence -> 'conformanceCertificateRef' ->> 'certificateRecordHash')
            and revoked.id is null
          limit 1
       ) bottom_evidence on true
       left join lateral (
         select evidence.id, evidence.execution_receipt_root
           from strategy_revision_v1_19_revalidations evidence
           left join strategy_revision_v1_19_revalidation_revocations revoked
             on revoked.revalidation_id = evidence.id
          where evidence.strategy_revision_id = m.top_strategy_revision_id
            and evidence.semantic_runtime_version = 'runtime-v1.19'
            and evidence.runtime_abi_version = 'strategy-runtime-abi-v1.19'
            and evidence.semantic_tuple_id = ms.compatibility_tuple_id
            and evidence.source_hash = top_revision.source_hash
            and evidence.source_bytes = top_revision.source_bytes
            and evidence.artifact_sha256 = top_revision.compiled_artifact ->> 'hash'
            and evidence.artifact_bytes = (top_revision.compiled_artifact ->> 'bytes')::integer
            and evidence.language_id = m.top_execution_evidence -> 'laneIdentity' ->> 'languageId'
            and evidence.provider_id = m.top_execution_evidence -> 'laneIdentity' ->> 'providerId'
            and evidence.lane_id = m.top_execution_evidence -> 'laneIdentity' ->> 'adapterId'
            and evidence.reviewed_certificate_id = m.top_execution_evidence -> 'conformanceCertificateRef' ->> 'certificateId'
            and evidence.reviewed_certificate_sha256 = 'sha256:' || (m.top_execution_evidence -> 'conformanceCertificateRef' ->> 'certificateRecordHash')
            and revoked.id is null
          limit 1
       ) top_evidence on true
      where ms.id = $1
        and ms.compatibility_tuple_id = $2
      order by ss.scenario_id, sc.condition_ordinal`,
    [matchSetId, CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID],
  )
  if (successor.rows.length > 0) {
    const scenarios = [
      ...new Map(
        successor.rows.map((row) => [row.scenario_id, row] as const),
      ).values(),
    ].map((row) =>
      createSetScenarioV137({
        arenaCatalogVersion: row.arena_catalog_version,
        arenaSemanticGeometryHash: row.arena_semantic_geometry_hash,
        entrantA: {
          entrantKey: row.entrant_a_key,
          playerId: row.entrant_a_player_id,
        },
        entrantB: {
          entrantKey: row.entrant_b_key,
          playerId: row.entrant_b_player_id,
        },
        baseSeed: row.base_seed,
      }),
    )
    const candidateMatches: SuccessorMatchScoreInputV119[] = successor.rows.map(
      (row) => ({
        matchId: row.match_id,
        bottomStrategyRevisionId: row.bottom_strategy_revision_id,
        topStrategyRevisionId: row.top_strategy_revision_id,
        winnerStrategyRevisionId:
          row.winner_player_id === row.bottom_player_id
            ? row.bottom_strategy_revision_id
            : row.winner_player_id === row.top_player_id
              ? row.top_strategy_revision_id
              : undefined,
        status: row.status,
        survivingSoldiers: row.surviving_soldiers ?? 0,
        bottomSurvivingSoldiers:
          row.bottom_surviving_soldiers ?? row.surviving_soldiers ?? 0,
        topSurvivingSoldiers:
          row.top_surviving_soldiers ?? row.surviving_soldiers ?? 0,
        survivalTurns: row.survival_turns ?? 0,
        bottomSurvivalTurns:
          row.bottom_survival_turns ?? row.survival_turns ?? 0,
        topSurvivalTurns: row.top_survival_turns ?? row.survival_turns ?? 0,
        semanticAuthorityKey: "runtime-v1.19",
        scenarioId: row.scenario_id,
        conditionId: row.condition_id,
        conditionOrdinal: row.condition_ordinal,
        requestIdentity: row.request_identity,
        bottomEntrantKey: row.bottom_entrant_key,
        topEntrantKey: row.top_entrant_key,
        initialInitiativeEntrantKey: row.initial_initiative_entrant_key,
        terminalKind: row.status === "complete" ? "success" : undefined,
        attemptNumber: Math.max(row.attempts, 1),
        retryableSystemFailure:
          row.status === "failed_system" && row.attempts < row.max_attempts,
        bottomRevisionEvidence: {
          strategyRevisionId: row.bottom_strategy_revision_id,
          scheduledRevalidationId: row.bottom_revalidation_id ?? "missing",
          currentRevalidationId: row.bottom_revalidation_id,
          scheduledRevalidationRoot:
            row.bottom_revalidation_root ?? `sha256:${"0".repeat(64)}`,
          currentRevalidationRoot: row.bottom_revalidation_root,
          revoked: row.bottom_revalidation_id === null,
        },
        topRevisionEvidence: {
          strategyRevisionId: row.top_strategy_revision_id,
          scheduledRevalidationId: row.top_revalidation_id ?? "missing",
          currentRevalidationId: row.top_revalidation_id,
          scheduledRevalidationRoot:
            row.top_revalidation_root ?? `sha256:${"0".repeat(64)}`,
          currentRevalidationRoot: row.top_revalidation_root,
          revoked: row.top_revalidation_id === null,
        },
      }),
    )
    const candidateScoring = scoreSuccessorMatchSetV119(
      scenarios,
      candidateMatches,
    )
    await pool.query(
      `update match_sets
          set status = $1::match_set_status,
              scoring = $2,
              degraded = $3,
              counted_status = $4,
              public_counted_reason = $5,
              completed_at = case when $1::match_set_status in ('complete', 'degraded') then now() else completed_at end
        where id = $6`,
      [
        candidateScoring.status,
        candidateScoring,
        candidateScoring.degraded,
        candidateScoring.counted
          ? "counted"
          : candidateScoring.status === "degraded"
            ? "degraded_system_failure"
            : "pending",
        candidateScoring.status === "degraded" ? "system_failure" : null,
        matchSetId,
      ],
    )
    return { status: candidateScoring.status, scoring: candidateScoring }
  }
  const scoring = scoreMatchSet(matches)
  const status = determineMatchSetStatus(
    scoring,
    result.rows.map((row) => row.status),
  )
  await pool.query(
    `
      update match_sets
      set status = $1::match_set_status,
          scoring = $2,
          degraded = $3,
          completed_at = case when $1::match_set_status in ('complete', 'degraded') then now() else completed_at end
      where id = $4
    `,
    [status, scoring, scoring.degraded, matchSetId],
  )
  return { status, scoring }
}
