import type {
  JsonValue,
  MatchId,
  MatchSetId,
  PlayerId,
  StrategyRevisionId,
} from "@cowards/spec"
import type { Pool } from "pg"
import {
  scoreMatchSet,
  type MatchScoreInput,
  type MatchSetScore,
} from "./scoring.js"
import type { MatchSetStatus, MatchStatus } from "./schema.js"

export interface MatchSetMatchSummary {
  matchId: MatchId
  status: MatchStatus
  outcome?: JsonValue | undefined
  winnerPlayerId?: PlayerId | undefined
  hasReplay: boolean
}

export const LIST_MATCH_STATUSES_FOR_SET_SQL = `
  select
    m.id as match_id,
    m.status,
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
  outcome: JsonValue | null
  winner_player_id: PlayerId | null
  chronicle_match_id: MatchId | null
}): MatchSetMatchSummary => ({
  matchId: row.match_id,
  status: row.status,
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
