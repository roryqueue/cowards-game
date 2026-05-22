import { createDatabasePool } from "@cowards/persistence/db"
import {
  createPostgresChronicleStore,
  type ChronicleStore,
} from "@cowards/persistence/chronicle-store"
import type { Queryable } from "@cowards/persistence/repositories"
import { createCowardsLocalService } from "@cowards/service"
import type {
  MatchId,
  PlayerId,
  PublicReplayMetadataServiceDto,
} from "@cowards/spec"
import type { GetMatchReplayOptions, ReplayPageData } from "./types.js"
import { buildReadyReplayFromStoredChronicle } from "./replay-ready.js"
import {
  createReplayFixtureData,
  getReplayFixtureScenarioId,
  isReplayFixtureMatch,
} from "./replay-fixture.js"

type WithPool = <T>(fn: (pool: Queryable) => Promise<T>) => Promise<T>
type ResolveAuthorizedReplayOwners = (input: {
  pool: Queryable
  matchId: MatchId
  requestedOwnerPlayerId: PlayerId
  currentPlayerId: PlayerId
}) => Promise<readonly PlayerId[]>

const WORKSHOP_PLAYER_ID = "player:workshop-local" as PlayerId
const WORKSHOP_MATCH_SET_PREFIX = "match-set:workshop:"

export type { GetMatchReplayOptions } from "./types.js"

export interface MatchReplayServerDeps {
  withPool?: WithPool | undefined
  createChronicleStore?:
    | ((pool: Queryable) => Pick<ChronicleStore, "getByMatchId">)
    | undefined
  resolveAuthorizedReplayOwners?: ResolveAuthorizedReplayOwners | undefined
}

const withDatabasePool: WithPool = async (fn) => {
  const pool = createDatabasePool()
  try {
    return await fn(pool)
  } finally {
    await pool.end()
  }
}

const decodeMatchId = (matchId: MatchId): MatchId => {
  try {
    return decodeURIComponent(matchId) as MatchId
  } catch {
    return matchId
  }
}

const resolvePersistedMatchOwners: ResolveAuthorizedReplayOwners = async ({
  pool,
  matchId,
  requestedOwnerPlayerId,
  currentPlayerId,
}) => {
  if (
    currentPlayerId !== WORKSHOP_PLAYER_ID ||
    requestedOwnerPlayerId !== currentPlayerId
  ) {
    return []
  }

  const result = await pool.query<{ authorized: true }>(
    `
      select true as authorized
      from matches m
      join match_set_matches msm on msm.match_id = m.id
      where m.id = $1
        and msm.match_set_id like $2
        and $3 in (m.bottom_player_id, m.top_player_id)
      limit 1
    `,
    [matchId, `${WORKSHOP_MATCH_SET_PREFIX}%`, currentPlayerId],
  )
  const row = result.rows[0]
  if (!row) {
    return []
  }
  return [requestedOwnerPlayerId]
}

export const createMatchReplayServer = (deps: MatchReplayServerDeps = {}) => {
  const withPool = deps.withPool ?? withDatabasePool
  const createStore = deps.createChronicleStore ?? createPostgresChronicleStore
  const resolveAuthorizedReplayOwners =
    deps.resolveAuthorizedReplayOwners ?? resolvePersistedMatchOwners
  const cowardsService = createCowardsLocalService({
    withPool: withPool as never,
    createChronicleStore: ((pool: unknown) =>
      createStore(pool as Queryable)) as never,
  })

  return {
    async getPublicReplayMetadata(
      matchId: MatchId,
    ): Promise<PublicReplayMetadataServiceDto | null> {
      const resolvedMatchId = decodeMatchId(matchId)
      return cowardsService.getPublicReplayMetadata(resolvedMatchId)
    },

    async getMatchReplay(
      matchId: MatchId,
      options: GetMatchReplayOptions = {},
    ): Promise<ReplayPageData> {
      const resolvedMatchId = decodeMatchId(matchId)
      if (isReplayFixtureMatch(resolvedMatchId)) {
        return createReplayFixtureData({
          ...options,
          scenarioId: getReplayFixtureScenarioId(resolvedMatchId) ?? undefined,
        })
      }

      return withPool(async (pool) => {
        const stored = await createStore(pool).getByMatchId(resolvedMatchId)

        if (!stored) {
          return {
            status: "unavailable",
            matchId: resolvedMatchId,
            reason: "missing-chronicle",
            message:
              "Replay unavailable: no Chronicle is stored for this Match.",
          }
        }

        const authorizedRequestedOwners =
          options.allowOwnerDebug === true &&
          options.requestedOwnerPlayerId !== undefined &&
          resolveAuthorizedReplayOwners !== undefined
            ? await resolveAuthorizedReplayOwners({
                pool,
                matchId: resolvedMatchId,
                requestedOwnerPlayerId: options.requestedOwnerPlayerId,
                currentPlayerId: WORKSHOP_PLAYER_ID,
              })
            : []

        return buildReadyReplayFromStoredChronicle(
          stored,
          options,
          authorizedRequestedOwners,
        )
      })
    },
  }
}

export const matchReplayServer = createMatchReplayServer()

export const getMatchReplay = (
  matchId: MatchId,
  options?: GetMatchReplayOptions,
) => matchReplayServer.getMatchReplay(matchId, options)

export type MatchReplayServer = ReturnType<typeof createMatchReplayServer>
