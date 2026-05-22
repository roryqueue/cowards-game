import type { Pool } from "pg"
import { createPostgresChronicleStore } from "@cowards/persistence/chronicle-store"
import type {
  ChronicleStore,
  StoredChronicle,
} from "@cowards/persistence/chronicle-store"
import { buildPublicMatchSetResultDto } from "@cowards/persistence/competition"
import { buildPublicStrategyCardDto } from "@cowards/persistence/profiles"
import { getWorkshopAnalyticsSnapshot } from "@cowards/persistence/workshop-analytics"
import {
  assertPublicServiceDtoLeakSafe,
  SERVICE_API_VERSION,
  AnalyticsRunSummaryServiceDtoSchema,
  PublicMatchSetSummaryServiceDtoSchema,
  PublicReplayMetadataServiceDtoSchema,
  PublicStrategyPageServiceDtoSchema,
  assertAnalyticsPublicSummaryLeakSafe,
  type MatchId,
  type MatchSetId,
  type AnalyticsRunSummaryServiceDto,
  type UserId,
  type PublicMatchSetSummaryServiceDto,
  type PublicReplayMetadataServiceDto,
  type PublicStrategyPageServiceDto,
  type ServiceErrorDto,
  type ServiceHealthDto,
  type StrategyId,
} from "@cowards/spec"

export type ServicePool = Pool
export type WithPool = <T>(fn: (pool: ServicePool) => Promise<T>) => Promise<T>

export class CowardsServiceError extends Error {
  readonly dto: ServiceErrorDto

  constructor(dto: ServiceErrorDto) {
    super(dto.message)
    this.name = "CowardsServiceError"
    this.dto = dto
  }
}

export interface CowardsService {
  health(): ServiceHealthDto
  getPublicMatchSetSummary(
    matchSetId: MatchSetId,
  ): Promise<PublicMatchSetSummaryServiceDto | null>
  getPublicReplayMetadata(
    matchId: MatchId,
  ): Promise<PublicReplayMetadataServiceDto | null>
  getPublicStrategyPage(
    strategyId: StrategyId,
  ): Promise<PublicStrategyPageServiceDto | null>
  getAnalyticsRunSummary(
    viewerUserId: UserId,
    runId: string,
  ): Promise<AnalyticsRunSummaryServiceDto | null>
}

export interface CreateCowardsLocalServiceOptions {
  withPool: WithPool
  createChronicleStore?: ((pool: ServicePool) => ChronicleStore) | undefined
  buildPublicMatchSetResult?: typeof buildPublicMatchSetResultDto | undefined
  buildPublicStrategyCard?: typeof buildPublicStrategyCardDto | undefined
  getAnalyticsSnapshot?: typeof getWorkshopAnalyticsSnapshot | undefined
}

const healthDto: ServiceHealthDto = {
  ok: true,
  service: "cowards-service",
  version: SERVICE_API_VERSION,
}

const toReplayMetadataDto = (
  stored: StoredChronicle,
): PublicReplayMetadataServiceDto => ({
  apiVersion: SERVICE_API_VERSION,
  kind: "publicReplayMetadata",
  matchId: stored.metadata.matchId,
  metadata: {
    matchId: stored.metadata.matchId,
    chronicleId: stored.metadata.id,
    hash: stored.metadata.hash,
    schemaVersion: stored.artifact.schemaVersion,
    eventCount: stored.artifact.events.length,
    snapshotCount: stored.artifact.snapshots.length,
    bottomPlayerId: stored.metadata.bottomPlayerId,
    topPlayerId: stored.metadata.topPlayerId,
    arenaVariantId: stored.metadata.arenaVariantId,
  },
})

export const createCowardsLocalService = (
  options: CreateCowardsLocalServiceOptions,
): CowardsService => {
  const createChronicleStore =
    options.createChronicleStore ?? createPostgresChronicleStore
  const buildPublicMatchSetResult =
    options.buildPublicMatchSetResult ?? buildPublicMatchSetResultDto
  const buildPublicStrategyCard =
    options.buildPublicStrategyCard ?? buildPublicStrategyCardDto
  const getAnalyticsSnapshot =
    options.getAnalyticsSnapshot ?? getWorkshopAnalyticsSnapshot

  return {
    health: () => healthDto,

    async getPublicMatchSetSummary(matchSetId) {
      return options.withPool(async (pool) => {
        const result = await buildPublicMatchSetResult(pool, matchSetId)
        if (!result) {
          return null
        }
        const dto: PublicMatchSetSummaryServiceDto = {
          apiVersion: SERVICE_API_VERSION,
          kind: "publicMatchSetSummary",
          matchSetId,
          result,
        }
        const parsed = PublicMatchSetSummaryServiceDtoSchema.parse(dto)
        assertPublicServiceDtoLeakSafe(parsed)
        return parsed
      })
    },

    async getPublicReplayMetadata(matchId) {
      return options.withPool(async (pool) => {
        const stored = await createChronicleStore(pool).getByMatchId(matchId)
        if (!stored) {
          return null
        }
        const dto = toReplayMetadataDto(stored)
        assertPublicServiceDtoLeakSafe(dto)
        return PublicReplayMetadataServiceDtoSchema.parse(dto)
      })
    },

    async getPublicStrategyPage(strategyId) {
      return options.withPool(async (pool) => {
        const card = await buildPublicStrategyCard(pool, strategyId)
        if (!card) {
          return null
        }
        const dto: PublicStrategyPageServiceDto = {
          apiVersion: SERVICE_API_VERSION,
          kind: "publicPage",
          page: "strategy",
          canonicalHref: `/strategies/${encodeURIComponent(strategyId)}`,
          payload: {
            strategy: card,
          },
        }
        assertPublicServiceDtoLeakSafe(dto)
        return PublicStrategyPageServiceDtoSchema.parse(
          dto,
        ) as PublicStrategyPageServiceDto
      })
    },

    async getAnalyticsRunSummary(viewerUserId, runId) {
      return options.withPool(async (pool) => {
        const snapshot = await getAnalyticsSnapshot(pool)
        const run = snapshot.runs.find((candidate) => candidate.id === runId)
        if (!run || run.ownerUserId !== viewerUserId) {
          return null
        }
        assertAnalyticsPublicSummaryLeakSafe(run.summary)
        const dto: AnalyticsRunSummaryServiceDto = {
          apiVersion: SERVICE_API_VERSION,
          kind: "analyticsRunSummary",
          runId: run.id,
          profileId: run.profileId,
          summary: run.summary,
        }
        const parsed = AnalyticsRunSummaryServiceDtoSchema.parse(dto)
        assertPublicServiceDtoLeakSafe(parsed)
        return parsed
      })
    },
  }
}
