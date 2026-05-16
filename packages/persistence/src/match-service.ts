import type {
  ArenaVariantId,
  MatchId,
  PlayerId,
  StrategyRevisionId,
} from "@cowards/spec"
import type { Pool } from "pg"
import { withTransaction } from "./db.js"
import { createRepositories } from "./repositories.js"
import { DEFAULT_MAX_JOB_ATTEMPTS, type MatchStatus } from "./schema.js"

export interface CreateMatchInput {
  id: MatchId
  bottomStrategyRevisionId: StrategyRevisionId
  topStrategyRevisionId: StrategyRevisionId
  arenaVariantId: ArenaVariantId
  seed: string
  bottomPlayerId: PlayerId
  topPlayerId: PlayerId
}

export interface CreateMatchResult {
  matchId: MatchId
  jobId: string
  status: MatchStatus
}

export const createMatchJobId = (matchId: MatchId): string =>
  `match-job:${matchId}`

export const validateCreateMatchInput = (input: CreateMatchInput): void => {
  if (!input.seed.trim()) {
    throw new Error("Match seed is required")
  }
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string" && value.length === 0) {
      throw new Error(`CreateMatchInput.${key} is required`)
    }
  }
}

export const createMatchService = (pool: Pool) => ({
  async createMatch(input: CreateMatchInput): Promise<CreateMatchResult> {
    validateCreateMatchInput(input)
    const jobId = createMatchJobId(input.id)

    await withTransaction(pool, async (client) => {
      const repositories = createRepositories(client)
      await repositories.assertStrategyRevisionCanBeUsed(
        input.bottomStrategyRevisionId,
      )
      await repositories.assertStrategyRevisionCanBeUsed(
        input.topStrategyRevisionId,
      )
      const arena = await repositories.getArenaVariant(input.arenaVariantId)
      if (!arena) {
        throw new Error(`ArenaVariant not found: ${input.arenaVariantId}`)
      }
      await repositories.lockStrategyRevision(input.bottomStrategyRevisionId)
      await repositories.lockStrategyRevision(input.topStrategyRevisionId)
      await client.query(
        `
          insert into matches (
            id, bottom_strategy_revision_id, top_strategy_revision_id,
            arena_variant_id, seed, bottom_player_id, top_player_id, status
          )
          values ($1, $2, $3, $4, $5, $6, $7, 'pending')
        `,
        [
          input.id,
          input.bottomStrategyRevisionId,
          input.topStrategyRevisionId,
          input.arenaVariantId,
          input.seed,
          input.bottomPlayerId,
          input.topPlayerId,
        ],
      )
      await client.query(
        `
          insert into match_jobs (id, match_id, status, attempts, max_attempts)
          values ($1, $2, 'queued', 0, $3)
        `,
        [jobId, input.id, DEFAULT_MAX_JOB_ATTEMPTS],
      )
    })

    return { matchId: input.id, jobId, status: "pending" }
  },

  async getMatchStatus(id: MatchId): Promise<MatchStatus | null> {
    const result = await pool.query<{ status: MatchStatus }>(
      "select status from matches where id = $1",
      [id],
    )
    return result.rows[0]?.status ?? null
  },
})
