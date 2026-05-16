import type { MatchId, MatchSetId, StrategyRevisionId } from "@cowards/spec"
import type { Pool } from "pg"
import {
  scoreMatchSet,
  type MatchScoreInput,
  type MatchSetScore,
} from "./scoring.js"
import type { MatchSetStatus, MatchStatus } from "./schema.js"

export const listMatchStatusesForSet = async (
  pool: Pool,
  matchSetId: MatchSetId,
): Promise<Array<{ matchId: MatchId; status: MatchStatus }>> => {
  const result = await pool.query<{ match_id: MatchId; status: MatchStatus }>(
    `
      select m.id as match_id, m.status
      from match_set_matches msm
      join matches m on m.id = msm.match_id
      where msm.match_set_id = $1
      order by msm.matrix_index asc
    `,
    [matchSetId],
  )
  return result.rows.map((row) => ({
    matchId: row.match_id,
    status: row.status,
  }))
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
    survival_turns: number | null
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
        m.survival_turns
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
    survivalTurns: row.survival_turns ?? 0,
  }))
  const scoring = scoreMatchSet(matches)
  const status = determineMatchSetStatus(
    scoring,
    result.rows.map((row) => row.status),
  )
  await pool.query(
    `
      update match_sets
      set status = $1,
          scoring = $2,
          degraded = $3,
          completed_at = case when $1 in ('complete', 'degraded') then now() else completed_at end
      where id = $4
    `,
    [status, scoring, scoring.degraded, matchSetId],
  )
  return { status, scoring }
}
