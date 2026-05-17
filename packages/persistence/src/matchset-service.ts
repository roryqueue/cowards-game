import type {
  MatchId,
  MatchSetId,
  PlayerId,
  StrategyRevisionId,
} from "@cowards/spec"
import type { Pool } from "pg"
import { createRepositories } from "./repositories.js"
import { withTransaction } from "./db.js"
import {
  createMatchJobId,
  validateCreateMatchInput,
  type CreateMatchInput,
} from "./match-service.js"
import { getMatchSetPreset, type MatchSetPresetId } from "./presets.js"
import type { MatchSetStatus } from "./schema.js"

export interface CreateMatchSetFromMatrixInput {
  id: MatchSetId
  matches: CreateMatchInput[]
}

export interface CreateMatchSetFromPresetInput {
  id: MatchSetId
  presetId: MatchSetPresetId
  bottomStrategyRevisionId: StrategyRevisionId
  topStrategyRevisionId: StrategyRevisionId
  bottomPlayerId: PlayerId
  topPlayerId: PlayerId
}

export const generatePresetMatrix = (
  input: CreateMatchSetFromPresetInput,
): CreateMatchInput[] => {
  const preset = getMatchSetPreset(input.presetId)
  const matches: CreateMatchInput[] = []
  let index = 0

  for (const arenaVariantId of preset.arenaVariantIds) {
    for (const seed of preset.seeds) {
      matches.push({
        id: `match:${input.id}:${index}` as MatchId,
        bottomStrategyRevisionId: input.bottomStrategyRevisionId,
        topStrategyRevisionId: input.topStrategyRevisionId,
        arenaVariantId,
        seed,
        bottomPlayerId: input.bottomPlayerId,
        topPlayerId: input.topPlayerId,
      })
      index += 1
      if (preset.mirrorSides) {
        matches.push({
          id: `match:${input.id}:${index}` as MatchId,
          bottomStrategyRevisionId: input.topStrategyRevisionId,
          topStrategyRevisionId: input.bottomStrategyRevisionId,
          arenaVariantId,
          seed: `${seed}:mirror`,
          bottomPlayerId: input.topPlayerId,
          topPlayerId: input.bottomPlayerId,
        })
        index += 1
      }
    }
  }

  return matches
}

const insertMatchSetWithMatrix = async (
  pool: Pool,
  input: CreateMatchSetFromMatrixInput & {
    presetId?: MatchSetPresetId | undefined
    presetVersion?: "v1" | undefined
  },
): Promise<void> => {
  for (const match of input.matches) {
    validateCreateMatchInput(match)
  }

  await withTransaction(pool, async (client) => {
    const repositories = createRepositories(client)
    const revisionIds = new Set<StrategyRevisionId>()

    for (const match of input.matches) {
      await repositories.assertStrategyRevisionCanBeUsed(
        match.bottomStrategyRevisionId,
      )
      await repositories.assertStrategyRevisionCanBeUsed(
        match.topStrategyRevisionId,
      )
      const arena = await repositories.getArenaVariant(match.arenaVariantId)
      if (!arena) {
        throw new Error(`ArenaVariant not found: ${match.arenaVariantId}`)
      }
      revisionIds.add(match.bottomStrategyRevisionId)
      revisionIds.add(match.topStrategyRevisionId)
    }

    for (const revisionId of revisionIds) {
      await repositories.lockStrategyRevision(revisionId)
    }

    await client.query(
      `
        insert into match_sets (id, status, preset_id, preset_version, matrix)
        values ($1, 'pending', $2, $3, $4)
      `,
      [
        input.id,
        input.presetId ?? null,
        input.presetVersion ?? null,
        JSON.stringify(input.matches),
      ],
    )

    for (const [matrixIndex, match] of input.matches.entries()) {
      await client.query(
        `
          insert into matches (
            id, bottom_strategy_revision_id, top_strategy_revision_id,
            arena_variant_id, seed, bottom_player_id, top_player_id, status
          )
          values ($1, $2, $3, $4, $5, $6, $7, 'pending')
        `,
        [
          match.id,
          match.bottomStrategyRevisionId,
          match.topStrategyRevisionId,
          match.arenaVariantId,
          match.seed,
          match.bottomPlayerId,
          match.topPlayerId,
        ],
      )
      await client.query(
        `
          insert into match_jobs (id, match_id, status)
          values ($1, $2, 'queued')
        `,
        [createMatchJobId(match.id), match.id],
      )
      await client.query(
        `
          insert into match_set_matches (match_set_id, match_id, matrix_index)
          values ($1, $2, $3)
        `,
        [input.id, match.id, matrixIndex],
      )
    }
  })
}

export const createMatchSetService = (pool: Pool) => ({
  async createFromMatrix(
    input: CreateMatchSetFromMatrixInput,
  ): Promise<{ matchSetId: MatchSetId; matchIds: MatchId[] }> {
    await insertMatchSetWithMatrix(pool, input)
    return {
      matchSetId: input.id,
      matchIds: input.matches.map((match) => match.id),
    }
  },

  async createFromPreset(
    input: CreateMatchSetFromPresetInput,
  ): Promise<{ matchSetId: MatchSetId; matchIds: MatchId[] }> {
    const preset = getMatchSetPreset(input.presetId)
    const matches = generatePresetMatrix(input)
    await insertMatchSetWithMatrix(pool, {
      id: input.id,
      matches,
      presetId: preset.id,
      presetVersion: preset.version,
    })
    return { matchSetId: input.id, matchIds: matches.map((match) => match.id) }
  },

  async getMatchSetStatus(id: MatchSetId): Promise<MatchSetStatus | null> {
    const result = await pool.query<{ status: MatchSetStatus }>(
      "select status from match_sets where id = $1",
      [id],
    )
    return result.rows[0]?.status ?? null
  },
})
