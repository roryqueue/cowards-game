import type { Pool } from "pg"
import { createPostgresChronicleStore } from "@cowards/persistence/chronicle-store"
import type {
  ChronicleStore,
  StoredChronicle,
} from "@cowards/persistence/chronicle-store"
import { buildPublicMatchSetResultDto } from "@cowards/persistence/competition"
import { getSession } from "@cowards/persistence/auth"
import { listAccountStrategyRevisions } from "@cowards/persistence/account-revisions"
import { buildTrialLadderSeasonDto } from "@cowards/persistence/ladder"
import {
  buildPublicPlayerProfileDto,
  buildPublicStrategyCardDto,
} from "@cowards/persistence/profiles"
import { getWorkshopAnalyticsSnapshot } from "@cowards/persistence/workshop-analytics"
import { getWorkshopTestSummary } from "@cowards/persistence/workshop"
import {
  assertPublicServiceDtoLeakSafe,
  SERVICE_API_VERSION,
  AuthSessionServiceDtoSchema,
  AnalyticsRunSummaryServiceDtoSchema,
  ListStrategyRevisionsServiceDtoSchema,
  PublicLadderPageServiceDtoSchema,
  PublicMatchSetSummaryServiceDtoSchema,
  PublicPlayerPageServiceDtoSchema,
  PublicReplayMetadataServiceDtoSchema,
  PublicStrategyPageServiceDtoSchema,
  MatchSetIdParamsSchema,
  ProfileIdParamsSchema,
  WorkshopAnalyticsSnapshotSchema,
  WorkshopAnalyticsComparisonServiceDtoSchema,
  WorkshopTestSummaryServiceDtoSchema,
  assertAnalyticsPublicSummaryLeakSafe,
  type MatchId,
  type MatchSetId,
  type AnalyticsRunSummaryServiceDto,
  type AuthSessionServiceDto,
  type ListStrategyRevisionsServiceDto,
  type StrategyRevisionSummaryServiceDto,
  type UserId,
  type PublicLadderPageServiceDto,
  type PublicMatchSetSummaryServiceDto,
  type PublicPlayerPageServiceDto,
  type PublicReplayMetadataServiceDto,
  type PublicStrategyPageServiceDto,
  type ServiceErrorDto,
  type ServiceHealthDto,
  type StrategyId,
  type WorkshopAnalyticsComparison,
  type WorkshopAnalyticsComparisonServiceDto,
  type WorkshopAnalyticsSnapshot,
  type WorkshopTestSummaryServiceDto,
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
  getPublicPlayerPage(
    handle: string,
  ): Promise<PublicPlayerPageServiceDto | null>
  getPublicLadderSeason(
    seasonId: string,
  ): Promise<PublicLadderPageServiceDto | null>
  getAuthSession(
    sessionId: string | null | undefined,
  ): Promise<AuthSessionServiceDto>
  listStrategyRevisions(
    sessionId: string | null | undefined,
  ): Promise<ListStrategyRevisionsServiceDto | null>
  getAnalyticsRunSummary(
    viewerUserId: UserId,
    runId: string,
  ): Promise<AnalyticsRunSummaryServiceDto | null>
  getWorkshopAnalyticsSnapshot(): Promise<WorkshopAnalyticsSnapshot>
  getWorkshopTestSummary(
    matchSetId: MatchSetId,
  ): Promise<WorkshopTestSummaryServiceDto | null>
  compareWorkshopAnalyticsRuns(
    profileId: string,
  ): Promise<WorkshopAnalyticsComparisonServiceDto | null>
}

export interface CreateCowardsLocalServiceOptions {
  withPool: WithPool
  createChronicleStore?: ((pool: ServicePool) => ChronicleStore) | undefined
  buildPublicMatchSetResult?: typeof buildPublicMatchSetResultDto | undefined
  buildPublicStrategyCard?: typeof buildPublicStrategyCardDto | undefined
  buildPublicPlayerProfile?: typeof buildPublicPlayerProfileDto | undefined
  buildPublicLadderSeason?: typeof buildTrialLadderSeasonDto | undefined
  getSession?: typeof getSession | undefined
  listAccountRevisions?: typeof listAccountStrategyRevisions | undefined
  getAnalyticsSnapshot?: typeof getWorkshopAnalyticsSnapshot | undefined
  getWorkshopTestSummary?: typeof getWorkshopTestSummary | undefined
}

export const COWARDS_LOCAL_SERVICE_ROLE = {
  normalBackend: false,
  selectedNormalBackend: false,
  roles: [
    "parity-oracle",
    "fixture-generator",
    "rollback-reference",
    "deferred-support",
  ],
  selectedNormalOwner: "go",
  note: "@cowards/service is a local DB-backed TypeScript reference service for parity, fixtures, rollback, and deferred surfaces; selected normal routes must use Go-owned contracts.",
} as const

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
  const buildPublicPlayerProfile =
    options.buildPublicPlayerProfile ?? buildPublicPlayerProfileDto
  const buildPublicLadderSeason =
    options.buildPublicLadderSeason ?? buildTrialLadderSeasonDto
  const getSessionForToken = options.getSession ?? getSession
  const listAccountRevisions =
    options.listAccountRevisions ?? listAccountStrategyRevisions
  const getAnalyticsSnapshot =
    options.getAnalyticsSnapshot ?? getWorkshopAnalyticsSnapshot
  const getTestSummary =
    options.getWorkshopTestSummary ?? getWorkshopTestSummary

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

    async getPublicPlayerPage(handle) {
      return options.withPool(async (pool) => {
        const profile = await buildPublicPlayerProfile(pool, handle)
        if (!profile) {
          return null
        }
        const dto: PublicPlayerPageServiceDto = {
          apiVersion: SERVICE_API_VERSION,
          kind: "publicPage",
          page: "player",
          canonicalHref: `/players/${encodeURIComponent(handle)}`,
          payload: profile,
        }
        assertPublicServiceDtoLeakSafe(dto)
        return PublicPlayerPageServiceDtoSchema.parse(
          dto,
        ) as PublicPlayerPageServiceDto
      })
    },

    async getPublicLadderSeason(seasonId) {
      return options.withPool(async (pool) => {
        const season = await buildPublicLadderSeason(pool, seasonId)
        if (!season) {
          return null
        }
        const dto: PublicLadderPageServiceDto = {
          apiVersion: SERVICE_API_VERSION,
          kind: "publicPage",
          page: "ladder",
          canonicalHref: `/ladder/${encodeURIComponent(season.slug)}`,
          payload: season,
        }
        assertPublicServiceDtoLeakSafe(dto)
        return PublicLadderPageServiceDtoSchema.parse(
          dto,
        ) as PublicLadderPageServiceDto
      })
    },

    async getAuthSession(sessionId) {
      if (!sessionId) {
        return {
          apiVersion: SERVICE_API_VERSION,
          kind: "authSession",
          user: null,
        }
      }
      return options.withPool(async (pool) => {
        const session = await getSessionForToken(pool, sessionId)
        const dto: AuthSessionServiceDto = {
          apiVersion: SERVICE_API_VERSION,
          kind: "authSession",
          user: session
            ? {
                id: session.user.id,
                username: session.user.username,
                handle: session.user.handle,
                displayName: session.user.displayName,
              }
            : null,
        }
        assertPublicServiceDtoLeakSafe(dto)
        return AuthSessionServiceDtoSchema.parse(dto) as AuthSessionServiceDto
      })
    },

    async listStrategyRevisions(sessionId) {
      if (!sessionId) {
        return null
      }
      return options.withPool(async (pool) => {
        const session = await getSessionForToken(pool, sessionId)
        if (!session) {
          return null
        }
        const revisions = await listAccountRevisions(pool, session.user.id)
        const dto: ListStrategyRevisionsServiceDto = {
          apiVersion: SERVICE_API_VERSION,
          kind: "strategyRevisionList",
          revisions: revisions.map(
            (revision): StrategyRevisionSummaryServiceDto => ({
              apiVersion: SERVICE_API_VERSION,
              kind: "strategyRevisionSummary",
              strategyId: revision.strategyId,
              strategyRevisionId: revision.id,
              ...(revision.label ? { label: revision.label } : {}),
              ...(revision.notes ? { notes: revision.notes } : {}),
              ...(revision.tags ? { tags: revision.tags } : {}),
              ...(revision.starterLineage
                ? { starterLineage: revision.starterLineage }
                : {}),
              ...(revision.advancedLineage
                ? { advancedLineage: revision.advancedLineage }
                : {}),
              sourceHash: revision.sourceHash,
              sourceBytes: revision.sourceBytes,
              runtimeSemantics: revision.runtimeSemantics,
              engineCompatibility: revision.engineCompatibility,
              validationStatus: revision.valid ? "valid" : "invalid",
              createdAt: revision.createdAt,
              ...(revision.lockedAt ? { lockedAt: revision.lockedAt } : {}),
            }),
          ),
        }
        assertPublicServiceDtoLeakSafe(dto)
        return ListStrategyRevisionsServiceDtoSchema.parse(
          dto,
        ) as ListStrategyRevisionsServiceDto
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

    async getWorkshopAnalyticsSnapshot() {
      return options.withPool(async (pool) => {
        const snapshot = await getAnalyticsSnapshot(pool)
        assertAnalyticsPublicSummaryLeakSafe(snapshot)
        assertPublicServiceDtoLeakSafe(snapshot)
        const parsed = WorkshopAnalyticsSnapshotSchema.parse(
          snapshot,
        ) as WorkshopAnalyticsSnapshot
        for (const run of parsed.runs) {
          assertAnalyticsPublicSummaryLeakSafe(run.summary)
        }
        assertPublicServiceDtoLeakSafe(parsed)
        return parsed
      })
    },

    async getWorkshopTestSummary(matchSetId) {
      const params = MatchSetIdParamsSchema.parse({ matchSetId })
      return options.withPool(async (pool) => {
        const summary = await getTestSummary(pool, params.matchSetId)
        if (!summary) {
          return null
        }
        const dto = {
          apiVersion: SERVICE_API_VERSION,
          kind: "workshopTestSummary",
          matchSetId: params.matchSetId,
          summary,
        }
        assertPublicServiceDtoLeakSafe(dto)
        const parsed = WorkshopTestSummaryServiceDtoSchema.parse(dto)
        assertPublicServiceDtoLeakSafe(parsed)
        return parsed
      })
    },

    async compareWorkshopAnalyticsRuns(profileId) {
      const params = ProfileIdParamsSchema.parse({ profileId })
      return options.withPool(async (pool) => {
        const snapshot = await getAnalyticsSnapshot(pool)
        const runs = snapshot.runs
          .filter((run) => run.profileId === params.profileId)
          .sort((left, right) => right.runIndex - left.runIndex)
        const [compare, base] = runs
        if (!compare || !base) {
          return null
        }
        if (
          compare.summary.compatibility.hash !== base.summary.compatibility.hash
        ) {
          return null
        }
        const comparison: WorkshopAnalyticsComparison = {
          profileId: params.profileId,
          baseRunId: base.id,
          compareRunId: compare.id,
          compatibilityEquivalent: true,
          delta: {
            wins: compare.summary.totals.wins - base.summary.totals.wins,
            losses: compare.summary.totals.losses - base.summary.totals.losses,
            draws: compare.summary.totals.draws - base.summary.totals.draws,
            points: compare.summary.totals.points - base.summary.totals.points,
          },
        }
        const dto: WorkshopAnalyticsComparisonServiceDto = {
          apiVersion: SERVICE_API_VERSION,
          kind: "workshopAnalyticsComparison",
          profileId: params.profileId,
          comparison,
        }
        assertPublicServiceDtoLeakSafe(dto)
        const parsed = WorkshopAnalyticsComparisonServiceDtoSchema.parse(dto)
        assertPublicServiceDtoLeakSafe(parsed)
        return parsed
      })
    },
  }
}
