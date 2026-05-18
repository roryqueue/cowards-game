import { createDatabasePool } from "@cowards/persistence/db"
import {
  createPostgresChronicleStore,
  type ChronicleStore,
} from "@cowards/persistence/chronicle-store"
import type { Queryable } from "@cowards/persistence/repositories"
import type { MatchId, PlayerId } from "@cowards/spec"
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
}) => Promise<readonly PlayerId[]>

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
}) => {
  const result = await pool.query<{
    bottom_player_id: PlayerId
    top_player_id: PlayerId
  }>(
    `
      select bottom_player_id, top_player_id
      from matches
      where id = $1
        and $2 in (bottom_player_id, top_player_id)
      limit 1
    `,
    [matchId, requestedOwnerPlayerId],
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

  return {
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
