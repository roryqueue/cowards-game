import { createDatabasePool } from "@cowards/persistence/db"
import {
  createPostgresChronicleStore,
  type ChronicleMetadata,
  type ChronicleStore,
} from "@cowards/persistence/quarantine-lifecycle"
import type { Queryable } from "@cowards/persistence/repositories"
import type {
  MatchId,
  PlayerId,
  PublicReplayEvidenceServiceDto,
  PublicReplayMetadataServiceDto,
} from "@cowards/spec"
import {
  SERVICE_API_VERSION,
  type MatchExecutionLifecycleV1,
  toMatchExecutionReplayEvidenceV1,
} from "@cowards/spec"
import type {
  GetMatchReplayOptions,
  ReplayPageData,
  ReplayUnavailableReason,
} from "./types.js"
import {
  buildReadyReplayFromPublicEvidence,
  buildReadyReplayFromStoredChronicle,
} from "./replay-ready.js"
import {
  createPublicGoReadClient,
  type PublicGoReadClient,
} from "../../lib/public-go-read-client.js"
import {
  resolvePublicReadRouteOwnership,
  type PublicReadRouteOwnershipEnv,
} from "../../lib/public-service-adapter.js"
import { createMatchExecutionFixturePublicReadClient } from "../../lib/match-execution-fixture-adapter.js"
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

const WORKSHOP_MATCH_SET_PREFIX = "match-set:workshop:"

const isOwnerDebugReplayRequestEnabled = (
  env: PublicReadRouteOwnershipEnv,
): boolean =>
  env.PLAYWRIGHT_TEST === "1" ||
  env.NODE_ENV === "test" ||
  env.COWARDS_ENABLE_OWNER_DEBUG_REPLAY === "1"

export type { GetMatchReplayOptions } from "./types.js"

export interface MatchReplayServerDeps {
  withPool?: WithPool | undefined
  createChronicleStore?:
    | ((pool: Queryable) => Pick<ChronicleStore, "getByMatchId">)
    | undefined
  resolveAuthorizedReplayOwners?: ResolveAuthorizedReplayOwners | undefined
  env?: PublicReadRouteOwnershipEnv | undefined
  publicReplayEvidenceClient?:
    | Pick<PublicGoReadClient, "getPublicReplayEvidence">
    | undefined
  publicReplayReadClient?:
    | Pick<
        PublicGoReadClient,
        "getPublicReplayEvidence" | "getPublicReplayMetadata"
      >
    | undefined
  fetchImpl?: typeof fetch | undefined
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

const publicReplayUnavailableMessage = (
  reason: ReplayUnavailableReason,
): string => {
  switch (reason) {
    case "missing-chronicle":
      return "Replay unavailable: no public Chronicle is stored for this Match."
    case "invalid-chronicle":
      return "Replay unavailable: the public Chronicle could not be validated for safe playback."
    case "missing-public-evidence":
      return "Replay unavailable: no public replay evidence is available for this Match yet."
    case "stale-evidence":
      return "Replay unavailable: the public replay evidence is stale and cannot be trusted for playback."
    case "no-result":
      return "Replay unavailable: this Match has no public result evidence to replay."
    default:
      return "Replay unavailable: public replay evidence is not available."
  }
}

const lifecycleFailureLabel = (
  category: MatchExecutionLifecycleV1["failureCategory"],
): string => {
  switch (category) {
    case "strategy_failure":
      return "Strategy failure"
    case "system_failure":
      return "System failure"
    case "timeout":
      return "Timeout"
    case "runtime_unavailable":
      return "Unavailable runtime"
    case "malformed_runtime_result":
      return "Malformed runtime result"
    case "stale_artifact":
      return "Stale artifact"
    case "blocked":
      return "Blocked"
    case "missing_chronicle":
      return "Missing Chronicle"
    case "no_result":
      return "No public result"
    default:
      return "Not applicable"
  }
}

const replayUnavailableFromLifecycle = (
  matchId: MatchId,
  lifecycle: MatchExecutionLifecycleV1,
): ReplayPageData => {
  const reason =
    lifecycle.replayAvailability === "stale"
      ? "stale-evidence"
      : lifecycle.failureCategory === "missing_chronicle" ||
          lifecycle.replayAvailability === "missing"
        ? "missing-chronicle"
        : lifecycle.failureCategory === "no_result"
          ? "no-result"
          : "missing-public-evidence"
  return {
    status: "unavailable",
    matchId,
    reason,
    message: publicReplayUnavailableMessage(reason),
    evidenceRows: [
      { label: "lifecycle", value: lifecycle.state },
      { label: "result", value: lifecycle.resultAvailability },
      { label: "replay", value: lifecycle.replayAvailability },
      { label: "retry", value: lifecycle.retryDisposition },
      ...(lifecycle.failureCategory
        ? [
            {
              label: "category",
              value: lifecycleFailureLabel(lifecycle.failureCategory),
            },
          ]
        : []),
      {
        label: "privacy",
        value:
          "Public replay output excludes private Strategy data, owner-only debug data, raw diagnostics, and internal recovery details.",
      },
    ],
  }
}

const resolvePersistedMatchOwners: ResolveAuthorizedReplayOwners = async ({
  pool,
  matchId,
  requestedOwnerPlayerId,
  currentPlayerId,
}) => {
  if (
    currentPlayerId !== requestedOwnerPlayerId ||
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
  const env = deps.env ?? process.env
  const publicReadOwnership = resolvePublicReadRouteOwnership(env)
  const selectedPublicReplayEvidence =
    publicReadOwnership.selectedRoutes.includes("getPublicReplayEvidence")
  const selectedPublicReplayMetadata =
    publicReadOwnership.selectedRoutes.includes("getPublicReplayMetadata")
  const createdPublicReplayReadClient = env.COWARDS_GO_BACKEND_URL
    ? createPublicGoReadClient({
        baseUrl: env.COWARDS_GO_BACKEND_URL,
        ...(deps.fetchImpl ? { fetchImpl: deps.fetchImpl } : {}),
      })
    : null
  const publicReplayMetadataClient =
    deps.publicReplayReadClient ?? createdPublicReplayReadClient
  const publicReplayEvidenceClient =
    deps.publicReplayReadClient ??
    deps.publicReplayEvidenceClient ??
    createdPublicReplayReadClient
  const matchExecutionFixtureClient =
    createMatchExecutionFixturePublicReadClient(env)

  return {
    async getPublicReplayMetadata(
      matchId: MatchId,
    ): Promise<PublicReplayMetadataServiceDto | null> {
      const resolvedMatchId = decodeMatchId(matchId)
      const fixture =
        await matchExecutionFixtureClient?.getPublicReplayMetadata(
          resolvedMatchId,
        )
      if (fixture) {
        return fixture
      }
      if (selectedPublicReplayMetadata) {
        if (!publicReplayMetadataClient) {
          throw new Error(
            "getPublicReplayMetadata Go ownership requires COWARDS_GO_BACKEND_URL",
          )
        }
        return publicReplayMetadataClient.getPublicReplayMetadata(
          resolvedMatchId,
        )
      }
      return withPool(async (pool) => {
        const stored = await createStore(pool).getByMatchId(resolvedMatchId)
        return stored === null ? null : toPublicReplayMetadata(stored.metadata)
      })
    },

    async getMatchReplay(
      matchId: MatchId,
      options: GetMatchReplayOptions = {},
    ): Promise<ReplayPageData> {
      const resolvedMatchId = decodeMatchId(matchId)
      if (isReplayFixtureMatch(resolvedMatchId, env)) {
        return createReplayFixtureData({
          ...options,
          scenarioId: getReplayFixtureScenarioId(resolvedMatchId) ?? undefined,
        })
      }
      const fixtureEvidence =
        await matchExecutionFixtureClient?.getPublicReplayEvidence(
          resolvedMatchId,
        )
      if (fixtureEvidence) {
        return buildReadyReplayFromGoEvidence(fixtureEvidence, options)
      }
      const fixtureReplayState =
        await matchExecutionFixtureClient?.getPublicReplayState(resolvedMatchId)
      if (fixtureReplayState) {
        return replayUnavailableFromLifecycle(
          resolvedMatchId,
          fixtureReplayState.lifecycle,
        )
      }
      const currentRequesterPlayerId = options.currentRequesterPlayerId
      const allowOwnerDebug =
        options.allowOwnerDebug === true &&
        isOwnerDebugReplayRequestEnabled(env) &&
        currentRequesterPlayerId !== undefined &&
        options.requestedOwnerPlayerId === currentRequesterPlayerId
      if (selectedPublicReplayEvidence && !allowOwnerDebug) {
        if (!publicReplayEvidenceClient) {
          throw new Error(
            "getPublicReplayEvidence Go ownership requires COWARDS_GO_BACKEND_URL",
          )
        }
        const evidence =
          await publicReplayEvidenceClient.getPublicReplayEvidence(
            resolvedMatchId,
          )
        return evidence === null
          ? {
              status: "unavailable",
              matchId: resolvedMatchId,
              reason: "missing-public-evidence",
              message: publicReplayUnavailableMessage(
                "missing-public-evidence",
              ),
            }
          : buildReadyReplayFromGoEvidence(evidence, options)
      }

      return withPool(async (pool) => {
        const stored = await createStore(pool).getByMatchId(resolvedMatchId)

        if (!stored) {
          return {
            status: "unavailable",
            matchId: resolvedMatchId,
            reason: "missing-chronicle",
            message: publicReplayUnavailableMessage("missing-chronicle"),
          }
        }

        const authorizedRequestedOwners =
          allowOwnerDebug &&
          options.requestedOwnerPlayerId !== undefined &&
          resolveAuthorizedReplayOwners !== undefined
            ? await resolveAuthorizedReplayOwners({
                pool,
                matchId: resolvedMatchId,
                requestedOwnerPlayerId: options.requestedOwnerPlayerId,
                currentPlayerId: currentRequesterPlayerId,
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

const toPublicReplayMetadata = (
  metadata: ChronicleMetadata,
): PublicReplayMetadataServiceDto => ({
  apiVersion: SERVICE_API_VERSION,
  kind: "publicReplayMetadata",
  matchId: metadata.matchId,
  metadata: {
    matchId: metadata.matchId,
    chronicleId: metadata.id,
    hash: metadata.hash,
    schemaVersion: metadata.schemaVersion,
    eventCount: metadata.eventCount,
    snapshotCount: metadata.snapshotCount,
    bottomPlayerId: metadata.bottomPlayerId,
    topPlayerId: metadata.topPlayerId,
    arenaVariantId: metadata.arenaVariantId,
  },
})

const buildReadyReplayFromGoEvidence = (
  evidence: PublicReplayEvidenceServiceDto,
  options: GetMatchReplayOptions,
): ReplayPageData =>
  buildReadyReplayFromPublicEvidence({
    metadata: evidence.metadata,
    contract: toMatchExecutionReplayEvidenceV1(evidence),
    projection: evidence.projection,
    options,
  })

export const matchReplayServer = createMatchReplayServer()

export const getMatchReplay = (
  matchId: MatchId,
  options?: GetMatchReplayOptions,
) => matchReplayServer.getMatchReplay(matchId, options)

export type MatchReplayServer = ReturnType<typeof createMatchReplayServer>
