import {
  assertPublicMatchSetResultLeakSafe,
  type PublicPlayerProfileDto,
  type PublicStrategyCardDto,
} from "@cowards/spec"
import type { Pool } from "pg"
import type { MatchSetStrategyScore } from "./scoring.js"

const isCountablePublicStatus = (status: string): boolean =>
  status !== "invalid" &&
  status !== "non_competitive" &&
  status !== "under_review" &&
  status !== "non_counted"

const loadPublicRecordsByRevision = async (
  pool: Pool,
  userId: string,
): Promise<
  Map<
    string,
    {
      wins: number
      losses: number
      draws: number
      points: number
      resultLinks: string[]
      replayLinks: string[]
    }
  >
> => {
  const rows = await pool.query<{
    id: string
    scoring: { rankings?: MatchSetStrategyScore[] } | null
    counted_status: string
    match_ids: string[]
  }>(
    `
      select distinct
        ms.id,
        ms.scoring,
        ms.counted_status,
        array_remove(array_agg(distinct msm.match_id order by msm.match_id), null) as match_ids
      from match_sets ms
      join competition_entrants ce on ce.match_set_id = ms.id
      left join match_set_matches msm on msm.match_set_id = ms.id
      where ce.owner_user_id = $1
        and ms.status = 'complete'
        and ms.scoring is not null
      group by ms.id
      order by ms.id desc
    `,
    [userId],
  )
  const records = new Map<
    string,
    {
      wins: number
      losses: number
      draws: number
      points: number
      resultLinks: string[]
      replayLinks: string[]
    }
  >()
  for (const row of rows.rows) {
    if (!isCountablePublicStatus(row.counted_status)) {
      continue
    }
    for (const ranking of row.scoring?.rankings ?? []) {
      const current = records.get(ranking.strategyRevisionId) ?? {
        wins: 0,
        losses: 0,
        draws: 0,
        points: 0,
        resultLinks: [],
        replayLinks: [],
      }
      current.wins += ranking.wins
      current.losses += ranking.losses
      current.draws += ranking.draws
      current.points += ranking.points
      current.resultLinks.push(`/matchsets/${encodeURIComponent(row.id)}`)
      current.replayLinks.push(
        ...row.match_ids.map(
          (matchId) => `/matches/${encodeURIComponent(matchId)}/replay`,
        ),
      )
      records.set(ranking.strategyRevisionId, current)
    }
  }
  return records
}

export const buildPublicPlayerProfileDto = async (
  pool: Pool,
  handle: string,
): Promise<PublicPlayerProfileDto | null> => {
  const userResult = await pool.query<{
    id: string
    handle: string
    display_name: string
  }>(
    `
      select id, handle, display_name
      from users
      where lower(handle) = lower($1)
    `,
    [handle.replace(/^@/, "")],
  )
  const user = userResult.rows[0]
  if (!user) {
    return null
  }
  const strategies = await listPublicStrategyCardsForUser(pool, user.id)
  const recordsByRevision = await loadPublicRecordsByRevision(pool, user.id)
  const ladderRows = await pool.query<{
    season_id: string
    season_name: string
    entry_status: "active" | "withdrawn" | "suspended" | "invalidated" | "stale"
  }>(
    `
      select
        s.id as season_id,
        s.name as season_name,
        e.status as entry_status
      from trial_ladder_entries e
      join trial_ladder_seasons s on s.id = e.season_id
      where e.owner_user_id = $1
      order by s.created_at desc, e.created_at desc
    `,
    [user.id],
  )
  const resultRows = await pool.query<{
    match_set_id: string
    season_id: string | null
    status:
      | "pending"
      | "running"
      | "complete"
      | "failed_system"
      | "blocked"
      | "degraded"
    counted_status: PublicPlayerProfileDto["results"][number]["countedStatus"]
    public_counted_reason:
      | PublicPlayerProfileDto["results"][number]["publicReason"]
      | null
    public_counted_explanation: string | null
  }>(
    `
      select distinct
        ms.id as match_set_id,
        ms.ladder_season_id as season_id,
        ms.status,
        ms.counted_status,
        ms.public_counted_reason,
        ms.public_counted_explanation
      from match_sets ms
      join competition_entrants ce on ce.match_set_id = ms.id
      where ce.owner_user_id = $1
      order by ms.id desc
      limit 20
    `,
    [user.id],
  )
  const dto: PublicPlayerProfileDto = {
    handle: user.handle,
    displayName: user.display_name,
    strategies,
    ladderHistory: ladderRows.rows.map((row) => ({
      seasonId: row.season_id,
      seasonName: row.season_name,
      entryStatus: row.entry_status,
      points: strategies.reduce((total, strategy) => {
        const record = recordsByRevision.get(strategy.strategyRevisionId)
        return total + (record?.points ?? 0)
      }, 0),
    })),
    results: resultRows.rows.map((row) => ({
      matchSetId: row.match_set_id,
      seasonId: row.season_id ?? "",
      status:
        row.status === "pending"
          ? "queued"
          : row.status === "failed_system" || row.status === "blocked"
            ? "failed"
            : row.status,
      countedStatus: row.counted_status,
      ...(row.public_counted_reason
        ? { publicReason: row.public_counted_reason }
        : {}),
      ...(row.public_counted_explanation
        ? { publicExplanation: row.public_counted_explanation }
        : {}),
      entrantIds: [],
      resultHref: `/matchsets/${encodeURIComponent(row.match_set_id)}`,
    })),
  }
  assertPublicMatchSetResultLeakSafe(dto)
  return dto
}

export const listPublicStrategyCardsForUser = async (
  pool: Pool,
  userId: string,
): Promise<PublicStrategyCardDto[]> => {
  const result = await pool.query<{
    strategy_id: string
    strategy_name: string
    strategy_description: string | null
    strategy_tags: string[]
    revision_id: string
    source_hash: string
    source_bytes: number
    runtime: PublicStrategyCardDto["runtime"]
    engine_compatibility: PublicStrategyCardDto["engineCompatibility"]
    validation: { valid: boolean }
    metadata: {
      label?: string
      notes?: string
      tags?: string[]
      starterLineage?: PublicStrategyCardDto["starterLineage"]
    }
    handle: string
  }>(
    `
      select distinct on (s.id)
        s.id as strategy_id,
        s.name as strategy_name,
        s.description as strategy_description,
        s.public_tags as strategy_tags,
        sr.id as revision_id,
        sr.source_hash,
        sr.source_bytes,
        sr.runtime,
        sr.engine_compatibility,
        sr.validation,
        sr.metadata,
        u.handle
      from strategies s
      join users u on u.id = s.owner_user_id
      join strategy_revisions sr on sr.strategy_id = s.id
      where s.owner_user_id = $1
      order by s.id, sr.created_at desc, sr.id desc
    `,
    [userId],
  )
  const recordsByRevision = await loadPublicRecordsByRevision(pool, userId)
  return result.rows.map((row) => ({
    strategyId: row.strategy_id,
    strategyRevisionId: row.revision_id,
    name: row.strategy_name,
    ...(row.strategy_description
      ? { description: row.strategy_description }
      : {}),
    tags: row.strategy_tags.length
      ? row.strategy_tags
      : (row.metadata.tags ?? []),
    authorHandle: row.handle,
    sourceHash: row.source_hash,
    sourceBytes: row.source_bytes,
    runtime: row.runtime,
    engineCompatibility: row.engine_compatibility,
    validationStatus: row.validation.valid ? "valid" : "invalid",
    ...(row.metadata.starterLineage
      ? { starterLineage: row.metadata.starterLineage }
      : {}),
    record: recordsByRevision.get(row.revision_id) ?? {
      wins: 0,
      losses: 0,
      draws: 0,
      points: 0,
      resultLinks: [],
      replayLinks: [],
    },
    resultLinks: recordsByRevision.get(row.revision_id)?.resultLinks ?? [],
    replayLinks: recordsByRevision.get(row.revision_id)?.replayLinks ?? [],
  }))
}

export const buildPublicStrategyCardDto = async (
  pool: Pool,
  strategyId: string,
): Promise<PublicStrategyCardDto | null> => {
  const owner = await pool.query<{ owner_user_id: string }>(
    "select owner_user_id from strategies where id = $1",
    [strategyId],
  )
  const ownerId = owner.rows[0]?.owner_user_id
  if (!ownerId) {
    return null
  }
  const cards = await listPublicStrategyCardsForUser(pool, ownerId)
  const card =
    cards.find((candidate) => candidate.strategyId === strategyId) ?? null
  if (card) {
    assertPublicMatchSetResultLeakSafe(card)
  }
  return card
}
