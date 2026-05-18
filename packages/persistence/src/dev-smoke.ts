import type { MatchSetId } from "@cowards/spec"
import type { Pool } from "pg"
import { migrate } from "./migrations.js"
import { createDevelopmentSeedData } from "./seed.js"
import { createRepositories } from "./repositories.js"
import { createMatchSetService } from "./matchset-service.js"
import { refreshMatchSetStatus } from "./matchset-status.js"
import type { MatchSetStatus } from "./schema.js"

export interface DevelopmentMatchSetSmokeResult {
  matchSetId: MatchSetId
  matchIds: string[]
  matchCount: number
  status: MatchSetStatus
  chronicleCount: number
  degraded: boolean
}

export const runDevelopmentMatchSetSmoke = async (
  pool: Pool,
  options: {
    matchSetId?: MatchSetId | undefined
    runQueuedMatch?: (matchIds: readonly string[]) => Promise<unknown>
  } = {},
): Promise<DevelopmentMatchSetSmokeResult> => {
  await migrate(pool)
  const seed = createDevelopmentSeedData()
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

  const [bottomRevision, topRevision] = seed.revisions
  if (!bottomRevision || !topRevision) {
    throw new Error("Development seed revisions missing")
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
