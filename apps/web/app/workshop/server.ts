import { createDatabasePool } from "@cowards/persistence/db"
import {
  buildWorkshopRevision,
  createWorkshopTestMatchSet,
  getWorkshopRevisionSource,
  getWorkshopSnapshot,
  getWorkshopStaticSnapshot,
  getWorkshopTestSummary,
  insertWorkshopRevision,
  type WorkshopTestSummary,
  validateWorkshopSource,
  WORKSHOP_STRATEGY_ID,
} from "@cowards/persistence/workshop"
import {
  comparePersistedWorkshopAnalyticsRuns,
  createWorkshopAnalyticsDemoSnapshot,
  createWorkshopAnalyticsExport,
  createPersistedWorkshopAnalyticsRerun,
  getWorkshopAnalyticsSnapshot,
  seedWorkshopAnalyticsDemo,
} from "@cowards/persistence/workshop-analytics"
import type {
  MatchSetId,
  StrategyRevision,
  StrategyRevisionId,
} from "@cowards/spec"
import type {
  WorkshopLaunchTestRequest,
  WorkshopInitialData,
  WorkshopSubmitRequest,
  WorkshopSubmitResponse,
} from "./types.js"
import { isStorageUnavailableError } from "../../lib/storage-unavailable-error.js"

type WorkshopPool = Parameters<typeof getWorkshopSnapshot>[0]
type WithPool = <T>(fn: (pool: WorkshopPool) => Promise<T>) => Promise<T>

export interface WorkshopServerDeps {
  withPool?: WithPool | undefined
  getSnapshot?: typeof getWorkshopSnapshot | undefined
  getSource?: typeof getWorkshopRevisionSource | undefined
  insertRevision?: typeof insertWorkshopRevision | undefined
  createTestMatchSet?: typeof createWorkshopTestMatchSet | undefined
  getTestSummary?: typeof getWorkshopTestSummary | undefined
  getAnalyticsSnapshot?: typeof getWorkshopAnalyticsSnapshot | undefined
}

const withDatabasePool: WithPool = async (fn) => {
  const pool = createDatabasePool()
  try {
    return await fn(pool)
  } finally {
    await pool.end()
  }
}

const revisionToSummary = (
  revision: StrategyRevision,
): WorkshopSubmitResponse & { ok: true } => ({
  ok: true,
  validation: revision.validation,
  revision: {
    id: revision.id,
    strategyId: WORKSHOP_STRATEGY_ID,
    label: revision.metadata.label,
    notes: revision.metadata.notes,
    createdBy: revision.metadata.createdBy,
    sourceHash: revision.sourceHash,
    sourceBytes: revision.sourceBytes,
    sourceFormat:
      revision.runtime.language.id === "python"
        ? "python"
        : revision.runtime.language.id === "rust"
          ? "rust"
          : revision.runtime.language.id === "zig"
            ? "zig"
            : "typescript",
    valid: revision.validation.valid,
    validation: revision.validation,
    metadata: revision.metadata,
    createdAt: new Date().toISOString(),
    usedInMatches: 0,
  },
})

const normalizeOptionalText = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined

export { isStorageUnavailableError }

export const createWorkshopServer = (deps: WorkshopServerDeps = {}) => {
  const withPool = deps.withPool ?? withDatabasePool
  const snapshot = deps.getSnapshot ?? getWorkshopSnapshot
  const source = deps.getSource ?? getWorkshopRevisionSource
  const insertRevision = deps.insertRevision ?? insertWorkshopRevision
  const createTest = deps.createTestMatchSet ?? createWorkshopTestMatchSet
  const testSummary = deps.getTestSummary ?? getWorkshopTestSummary
  const analyticsSnapshot =
    deps.getAnalyticsSnapshot ?? getWorkshopAnalyticsSnapshot
  const loadInitialData = async (): Promise<WorkshopInitialData> => {
    try {
      return await withPool(async (pool) => ({
        ...(await snapshot(pool)),
        analytics: await analyticsSnapshot(pool),
      }))
    } catch (error) {
      if (!isStorageUnavailableError(error)) {
        throw error
      }
      return {
        ...getWorkshopStaticSnapshot(),
        analytics: createWorkshopAnalyticsDemoSnapshot(),
      }
    }
  }

  return {
    getInitialData: loadInitialData,

    validateSource: (
      source: string,
      sourceFormat: WorkshopSubmitRequest["sourceFormat"] = "typescript",
    ) => validateWorkshopSource(source, sourceFormat),

    async submitSource(
      request: WorkshopSubmitRequest,
    ): Promise<WorkshopSubmitResponse> {
      const validation =
        request.validation ??
        validateWorkshopSource(request.source, request.sourceFormat)
      if (!validation.valid) {
        return { ok: false, validation }
      }
      if (
        request.sourceFormat === "python" &&
        request.runtimeServiceValidated !== true
      ) {
        throw new Error(
          "Python Workshop revisions require runtime-service provider validation.",
        )
      }

      const revision = buildWorkshopRevision({
        source: request.source,
        sourceFormat: request.sourceFormat,
        runtime: request.runtime,
        validation,
        engineCompatibility: request.engineCompatibility,
        metadata: request.metadata,
        runtimeServiceValidated: request.runtimeServiceValidated,
        label: normalizeOptionalText(request.label) ?? "Workshop revision",
        notes: normalizeOptionalText(request.notes),
      })

      if (revision.strategyId !== WORKSHOP_STRATEGY_ID) {
        throw new Error("Invalid Workshop revision strategy id")
      }

      await withPool((pool) => insertRevision(pool, revision))
      return revisionToSummary(revision)
    },

    async getRevisionSource(
      revisionId: StrategyRevisionId,
    ): Promise<string | null> {
      return withPool((pool) => source(pool, revisionId))
    },

    async launchTest(request: WorkshopLaunchTestRequest): Promise<{
      matchSetId: MatchSetId
      matchIds: string[]
      status: WorkshopTestSummary["status"]
      matchCount: number
      matches: WorkshopTestSummary["matches"]
      scoring: WorkshopTestSummary["scoring"]
    }> {
      return withPool((pool) => createTest(pool, request))
    },

    async getTestSummary(
      matchSetId: MatchSetId,
    ): Promise<WorkshopTestSummary | null> {
      return withPool((pool) => testSummary(pool, matchSetId))
    },

    async exportAnalytics(format: "json" | "csv") {
      const analytics = await loadInitialData().then((data) => data.analytics)
      return createWorkshopAnalyticsExport(analytics, format)
    },

    async saveAnalyticsProfile() {
      return withPool(async (pool) => {
        const analytics = await seedWorkshopAnalyticsDemo(pool)
        return analytics.profiles[0] ?? null
      })
    },

    async rerunAnalyticsProfile(profileId: string) {
      return withPool((pool) =>
        createPersistedWorkshopAnalyticsRerun(pool, profileId),
      )
    },

    async compareAnalyticsRuns(profileId: string) {
      return withPool((pool) =>
        comparePersistedWorkshopAnalyticsRuns(pool, profileId),
      )
    },
  }
}

export const workshopServer = createWorkshopServer()

export const getWorkshopInitialData = () => workshopServer.getInitialData()

export type WorkshopServer = ReturnType<typeof createWorkshopServer>
