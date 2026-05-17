import {
  buildWorkshopRevision,
  createDatabasePool,
  createWorkshopTestMatchSet,
  getWorkshopRevisionSource,
  getWorkshopSnapshot,
  getWorkshopTestSummary,
  insertWorkshopRevision,
  type WorkshopTestSummary,
  WORKSHOP_STRATEGY_ID,
} from "@cowards/persistence"
import type {
  MatchSetId,
  StrategyRevision,
  StrategyRevisionId,
} from "@cowards/spec"
import { validateStrategySource } from "@cowards/runtime-js"
import type {
  WorkshopLaunchTestRequest,
  WorkshopSubmitRequest,
  WorkshopSubmitResponse,
} from "./types.js"

type WorkshopPool = Parameters<typeof getWorkshopSnapshot>[0]
type WithPool = <T>(fn: (pool: WorkshopPool) => Promise<T>) => Promise<T>

export interface WorkshopServerDeps {
  withPool?: WithPool | undefined
  getSnapshot?: typeof getWorkshopSnapshot | undefined
  getSource?: typeof getWorkshopRevisionSource | undefined
  insertRevision?: typeof insertWorkshopRevision | undefined
  createTestMatchSet?: typeof createWorkshopTestMatchSet | undefined
  getTestSummary?: typeof getWorkshopTestSummary | undefined
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
    sourceHash: revision.sourceHash,
    sourceBytes: revision.sourceBytes,
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

export const createWorkshopServer = (deps: WorkshopServerDeps = {}) => {
  const withPool = deps.withPool ?? withDatabasePool
  const snapshot = deps.getSnapshot ?? getWorkshopSnapshot
  const source = deps.getSource ?? getWorkshopRevisionSource
  const insertRevision = deps.insertRevision ?? insertWorkshopRevision
  const createTest = deps.createTestMatchSet ?? createWorkshopTestMatchSet
  const testSummary = deps.getTestSummary ?? getWorkshopTestSummary

  return {
    getInitialData: () => withPool((pool) => snapshot(pool)),

    async submitSource(
      request: WorkshopSubmitRequest,
    ): Promise<WorkshopSubmitResponse> {
      const validation = validateStrategySource(request.source)
      if (!validation.valid) {
        return { ok: false, validation }
      }

      const revision = buildWorkshopRevision({
        source: request.source,
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

    async launchTest(
      request: WorkshopLaunchTestRequest,
    ): Promise<{ matchSetId: MatchSetId; matchIds: string[] }> {
      return withPool((pool) => createTest(pool, request))
    },

    async getTestSummary(
      matchSetId: MatchSetId,
    ): Promise<WorkshopTestSummary | null> {
      return withPool((pool) => testSummary(pool, matchSetId))
    },
  }
}

export const workshopServer = createWorkshopServer()

export type WorkshopServer = ReturnType<typeof createWorkshopServer>
