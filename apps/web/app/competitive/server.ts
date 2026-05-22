import { cookies } from "next/headers.js"
import { createDatabasePool } from "@cowards/persistence/db"
import {
  AuthInputError,
  authenticateAccount,
  createAccount,
  createSession,
  getSession,
  revokeSession,
  type PublicUserAccount,
} from "@cowards/persistence/auth"
import {
  AccountRevisionError,
  createAccountStrategyRevision,
  forkAdvancedStrategyToAccount,
  forkStarterStrategyToAccount,
  getAccountStrategyRevisionSource,
  listAccountStrategyRevisions,
  type AccountStrategyRevisionSummary,
} from "@cowards/persistence/account-revisions"
import {
  ActiveDuplicateExhibitionError,
  CompetitionInputError,
  ExhibitionRateLimitError,
  createManualExhibitionMatchSet,
} from "@cowards/persistence/competition"
import { createCowardsLocalService } from "@cowards/service"
import {
  buildTrialLadderSeasonDto,
  createTrialLadderSeason,
  enterTrialLadderSeason,
  LadderInputError,
  scheduleTrialLadderSeason,
  setTrialLadderSeasonStatus,
  withdrawTrialLadderEntry,
} from "@cowards/persistence/ladder"
import {
  assertAdminUser,
  flagMatchSetResult,
  GovernanceInputError,
  markMatchSetGovernanceStatus,
} from "@cowards/persistence/governance"
import {
  buildPublicPlayerProfileDto,
  buildPublicStrategyCardDto,
} from "@cowards/persistence/profiles"
import { findAdvancedStrategy } from "@cowards/persistence/advanced-strategies"
import { findStarterStrategy } from "@cowards/persistence/starter-strategies"
import {
  COMPETITION_PRESET_IDS,
  COMPETITION_PRESETS,
  type CompetitionPresetId,
  type MatchId,
  type MatchSetId,
  type PublicMatchSetResultDto,
  type PublicPlayerProfileDto,
  type PublicStrategyCardDto,
  type PublicTrialLadderSeasonDto,
  type StrategyRevisionId,
  type TrialLadderSeasonStatus,
} from "@cowards/spec"

export const SESSION_COOKIE_NAME = "cowards_session"
export const COMPETITIVE_SESSION_DAYS = 30

export class CompetitiveInputError extends Error {
  readonly status: number
  readonly retryAfterSeconds?: number | undefined

  constructor(
    message: string,
    options: { status?: number; retryAfterSeconds?: number } = {},
  ) {
    super(message)
    this.name = "CompetitiveInputError"
    this.status = options.status ?? 400
    this.retryAfterSeconds = options.retryAfterSeconds
  }
}

export type CompetitiveUser = PublicUserAccount
export type CompetitiveRevisionSummary = AccountStrategyRevisionSummary

export interface CompetitivePresetSummary {
  id: CompetitionPresetId
  label: string
  description: string
  minEntrants: number
  maxEntrants: number
}

export interface CompetitiveSessionSnapshot {
  user: CompetitiveUser | null
}

export interface ExhibitionCreateRequest {
  presetId: CompetitionPresetId
  revisionIds: StrategyRevisionId[]
}

export interface ExhibitionCreateResult {
  matchSetId: MatchSetId
  status: "queued"
  matchCount: number
}

type PublicEntrantDto = PublicMatchSetResultDto["entrants"][number]
type PublicMatchEvidenceDto = PublicMatchSetResultDto["matches"][number]

export type CompetitiveEntrantDto = PublicEntrantDto & {
  shortHash: string
  isOwner: boolean
  ownerSourceHref?: string | undefined
}

export type CompetitiveMatchLedgerRow = PublicMatchEvidenceDto & {
  bottomLabel: string
  topLabel: string
  replayHref?: string | undefined
}

export interface MatchSetResultDto extends Omit<
  PublicMatchSetResultDto,
  "entrants" | "matches"
> {
  currentUser: CompetitiveUser | null
  entrants: CompetitiveEntrantDto[]
  matches: CompetitiveMatchLedgerRow[]
}

export type TrialLadderSeasonDto = PublicTrialLadderSeasonDto
export type PlayerProfileDto = PublicPlayerProfileDto
export type StrategyCardDto = PublicStrategyCardDto

type PersistencePool = Parameters<typeof createAccount>[0]
type WithPool = <T>(fn: (pool: PersistencePool) => Promise<T>) => Promise<T>

export interface CompetitiveServerDeps {
  withPool?: WithPool | undefined
}

const withDatabasePool: WithPool = async (fn) => {
  const pool = createDatabasePool()
  try {
    return await fn(pool)
  } finally {
    await pool.end()
  }
}

const normalizeText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : ""

const normalizeOptionalText = (value: unknown): string | undefined => {
  const text = normalizeText(value)
  return text.length > 0 ? text : undefined
}

const normalizeRevisionIds = (value: unknown): StrategyRevisionId[] =>
  Array.isArray(value)
    ? value.filter(
        (revisionId): revisionId is StrategyRevisionId =>
          typeof revisionId === "string" && revisionId.length > 0,
      )
    : []

const assertCompetitionPresetId = (value: unknown): CompetitionPresetId => {
  if (
    typeof value === "string" &&
    COMPETITION_PRESET_IDS.includes(value as CompetitionPresetId)
  ) {
    return value as CompetitionPresetId
  }
  throw new CompetitiveInputError("Unknown exhibition preset.")
}

const mapPersistenceError = (error: unknown): never => {
  if (error instanceof CompetitiveInputError) {
    throw error
  }
  if (error instanceof ExhibitionRateLimitError) {
    throw new CompetitiveInputError(error.message, {
      status: 429,
      retryAfterSeconds: error.retryAfterSeconds,
    })
  }
  if (error instanceof ActiveDuplicateExhibitionError) {
    throw new CompetitiveInputError(error.message, { status: 409 })
  }
  if (
    error instanceof AuthInputError ||
    error instanceof AccountRevisionError ||
    error instanceof CompetitionInputError ||
    error instanceof LadderInputError ||
    error instanceof GovernanceInputError
  ) {
    throw new CompetitiveInputError(error.message, { status: 400 })
  }
  if (error instanceof Error && (error as { code?: string }).code === "23505") {
    throw new CompetitiveInputError(
      "That username, handle, or active exhibition already exists.",
      { status: 409 },
    )
  }
  if (
    error instanceof Error &&
    ((error as { code?: string }).code === "42P01" ||
      /does not exist/i.test(error.message))
  ) {
    throw new CompetitiveInputError(
      "Competitive storage is not installed yet; run database migrations and retry.",
      { status: 503 },
    )
  }
  throw error
}

const competitivePresets = (): CompetitivePresetSummary[] =>
  COMPETITION_PRESETS.map((preset) => ({
    id: preset.id,
    label: preset.label,
    description:
      preset.id === "smoke-exhibition-v1"
        ? "Fast mirrored pairwise exhibition for quick checks."
        : "Broader mirrored pairwise exhibition for stronger evidence.",
    minEntrants: preset.entrantCount.min,
    maxEntrants: preset.entrantCount.max,
  }))

const toMatchSetResultDto = (
  result: PublicMatchSetResultDto,
  currentUser: CompetitiveUser | null,
): MatchSetResultDto => {
  const entrantById = new Map(
    result.entrants.map((entrant) => [entrant.entrantId, entrant]),
  )
  const entrants = result.entrants.map((entrant) => {
    const isOwner = currentUser?.id === entrant.ownerUserId
    return {
      ...entrant,
      shortHash: entrant.sourceHash.slice(0, 10),
      isOwner,
      ...(isOwner
        ? {
            ownerSourceHref: `/api/account/revisions/${encodeURIComponent(
              entrant.strategyRevisionId,
            )}/source`,
          }
        : {}),
    }
  })
  const matches = result.matches.map((match) => {
    const bottom = entrantById.get(match.entrants.bottom)
    const top = entrantById.get(match.entrants.top)
    return {
      ...match,
      bottomLabel: bottom?.displayLabel ?? match.entrants.bottom,
      topLabel: top?.displayLabel ?? match.entrants.top,
      ...(match.replayAvailable
        ? { replayHref: `/matches/${encodeURIComponent(match.matchId)}/replay` }
        : {}),
    }
  })
  return {
    ...result,
    currentUser,
    entrants,
    matches,
  }
}

export const createCompetitiveServer = (deps: CompetitiveServerDeps = {}) => {
  const withPool = deps.withPool ?? withDatabasePool
  const cowardsService = createCowardsLocalService({ withPool })

  return {
    listPresets: competitivePresets,

    async signUp(input: {
      username: unknown
      password: unknown
      handle: unknown
      displayName: unknown
    }): Promise<{ user: CompetitiveUser; sessionId: string }> {
      try {
        return await withPool(async (pool) => {
          const user = await createAccount(pool, {
            username: normalizeText(input.username),
            password: normalizeText(input.password),
            handle: normalizeText(input.handle),
            displayName: normalizeText(input.displayName),
          })
          const session = await createSession(pool, { userId: user.id })
          return { user, sessionId: session.token }
        })
      } catch (error) {
        return mapPersistenceError(error)
      }
    },

    async signIn(input: {
      username: unknown
      password: unknown
    }): Promise<{ user: CompetitiveUser; sessionId: string }> {
      try {
        return await withPool(async (pool) => {
          const user = await authenticateAccount(pool, {
            username: normalizeText(input.username),
            password: normalizeText(input.password),
          })
          if (!user) {
            throw new CompetitiveInputError(
              "Username or password is incorrect.",
              {
                status: 401,
              },
            )
          }
          const session = await createSession(pool, { userId: user.id })
          return { user, sessionId: session.token }
        })
      } catch (error) {
        return mapPersistenceError(error)
      }
    },

    async signOut(sessionId: string): Promise<void> {
      if (!sessionId) {
        return
      }
      try {
        await withPool((pool) => revokeSession(pool, sessionId))
      } catch (error) {
        return mapPersistenceError(error)
      }
    },

    async getSnapshot(
      sessionId: string | null | undefined,
    ): Promise<CompetitiveSessionSnapshot> {
      if (!sessionId) {
        return { user: null }
      }
      try {
        return await withPool(async (pool) => {
          const session = await getSession(pool, sessionId)
          return { user: session?.user ?? null }
        })
      } catch (error) {
        return mapPersistenceError(error)
      }
    },

    async listAccountRevisions(
      user: CompetitiveUser,
    ): Promise<CompetitiveRevisionSummary[]> {
      try {
        return await withPool((pool) =>
          listAccountStrategyRevisions(pool, user.id),
        )
      } catch (error) {
        return mapPersistenceError(error)
      }
    },

    async saveAccountRevision(
      user: CompetitiveUser,
      input: {
        source: unknown
        label: unknown
        notes: unknown
        starterId?: unknown
        advancedId?: unknown
      },
    ): Promise<CompetitiveRevisionSummary> {
      try {
        return await withPool(async (pool) => {
          const source = normalizeText(input.source)
          const starter =
            typeof input.starterId === "string"
              ? findStarterStrategy(input.starterId)
              : null
          const advanced =
            typeof input.advancedId === "string"
              ? findAdvancedStrategy(input.advancedId)
              : null
          const starterMatchesSource =
            starter !== null && starter.source === source
          const advancedMatchesSource =
            advanced !== null && advanced.source === source
          const revision = await createAccountStrategyRevision(pool, {
            userId: user.id,
            source,
            label: normalizeOptionalText(input.label),
            notes: normalizeOptionalText(input.notes),
            ...(starterMatchesSource
              ? {
                  tags: starter.tags,
                  strategyName: starter.name,
                  starterLineage: {
                    starterId: starter.id,
                    starterName: starter.name,
                    starterVersion: starter.version,
                    sourceHash: starter.sourceHash,
                  },
                }
              : {}),
            ...(advancedMatchesSource
              ? {
                  tags: advanced.tags,
                  strategyName: advanced.name,
                  advancedLineage: {
                    advancedId: advanced.id,
                    advancedName: advanced.name,
                    advancedVersion: advanced.version,
                    archetype: advanced.primaryArchetype,
                    sourceHash: advanced.sourceHash,
                  },
                }
              : {}),
          })
          const revisions = await listAccountStrategyRevisions(pool, user.id)
          return (
            revisions.find((candidate) => candidate.id === revision.id) ??
            revisions[0]!
          )
        })
      } catch (error) {
        return mapPersistenceError(error)
      }
    },

    async forkStarterStrategy(
      user: CompetitiveUser,
      input: { starterId: unknown },
    ): Promise<CompetitiveRevisionSummary> {
      try {
        return await withPool(async (pool) => {
          const starterId = normalizeText(input.starterId)
          const revision = await forkStarterStrategyToAccount(pool, {
            userId: user.id,
            starterId,
          })
          const revisions = await listAccountStrategyRevisions(pool, user.id)
          return (
            revisions.find((candidate) => candidate.id === revision.id) ??
            revisions[0]!
          )
        })
      } catch (error) {
        return mapPersistenceError(error)
      }
    },

    async forkAdvancedStrategy(
      user: CompetitiveUser,
      input: { advancedId: unknown },
    ): Promise<CompetitiveRevisionSummary> {
      try {
        return await withPool(async (pool) => {
          const advancedId = normalizeText(input.advancedId)
          const revision = await forkAdvancedStrategyToAccount(pool, {
            userId: user.id,
            advancedId,
          })
          const revisions = await listAccountStrategyRevisions(pool, user.id)
          return (
            revisions.find((candidate) => candidate.id === revision.id) ??
            revisions[0]!
          )
        })
      } catch (error) {
        return mapPersistenceError(error)
      }
    },

    async getAccountRevisionSource(
      user: CompetitiveUser,
      revisionId: StrategyRevisionId,
    ): Promise<string | null> {
      try {
        return await withPool((pool) =>
          getAccountStrategyRevisionSource(pool, {
            userId: user.id,
            revisionId,
          }),
        )
      } catch (error) {
        return mapPersistenceError(error)
      }
    },

    async createExhibition(
      user: CompetitiveUser,
      input: { presetId: unknown; revisionIds: unknown },
    ): Promise<ExhibitionCreateResult> {
      try {
        return await withPool(async (pool) => {
          const result = await createManualExhibitionMatchSet(pool, {
            creatorUserId: user.id,
            presetId: assertCompetitionPresetId(input.presetId),
            revisionIds: normalizeRevisionIds(input.revisionIds),
          })
          return {
            matchSetId: result.matchSetId as MatchSetId,
            status: "queued",
            matchCount: result.matchIds.length,
          }
        })
      } catch (error) {
        return mapPersistenceError(error)
      }
    },

    async createTrialLadderSeason(
      user: CompetitiveUser,
      input: {
        name: unknown
        slug: unknown
        description: unknown
        seasonSeed?: unknown
      },
    ): Promise<{ seasonId: string }> {
      try {
        return await withPool(async (pool) => ({
          seasonId: await (async () => {
            await assertAdminUser(pool, user.id)
            return createTrialLadderSeason(pool, {
              name: normalizeText(input.name),
              slug: normalizeText(input.slug),
              description: normalizeOptionalText(input.description),
              seasonSeed: normalizeOptionalText(input.seasonSeed),
            })
          })(),
        }))
      } catch (error) {
        return mapPersistenceError(error)
      }
    },

    async setTrialLadderSeasonStatus(input: {
      seasonId: unknown
      status: unknown
      actorUserId?: string | undefined
      reason: unknown
    }): Promise<void> {
      try {
        return await withPool(async (pool) => {
          if (input.actorUserId) {
            await assertAdminUser(pool, input.actorUserId)
          }
          return setTrialLadderSeasonStatus(pool, {
            seasonId: normalizeText(input.seasonId),
            status: normalizeText(input.status) as TrialLadderSeasonStatus,
            actorUserId: input.actorUserId,
            reason: normalizeText(input.reason),
          })
        })
      } catch (error) {
        return mapPersistenceError(error)
      }
    },

    async enterTrialLadderSeason(
      user: CompetitiveUser,
      input: { seasonId: unknown; revisionId: unknown },
    ): Promise<{ entryId: string }> {
      try {
        return await withPool(async (pool) => ({
          entryId: await enterTrialLadderSeason(pool, {
            seasonId: normalizeText(input.seasonId),
            userId: user.id,
            revisionId: normalizeText(input.revisionId) as StrategyRevisionId,
          }),
        }))
      } catch (error) {
        return mapPersistenceError(error)
      }
    },

    async withdrawTrialLadderEntry(
      user: CompetitiveUser,
      seasonId: string,
    ): Promise<void> {
      try {
        return await withPool((pool) =>
          withdrawTrialLadderEntry(pool, { seasonId, userId: user.id }),
        )
      } catch (error) {
        return mapPersistenceError(error)
      }
    },

    async scheduleTrialLadderSeason(
      user: CompetitiveUser,
      seasonId: string,
    ): Promise<{
      scheduleRunId: string
      createdMatchSetIds: string[]
      leftoverEntryIds: string[]
    }> {
      try {
        return await withPool(async (pool) => {
          await assertAdminUser(pool, user.id)
          return scheduleTrialLadderSeason(pool, {
            seasonId,
            actorUserId: user.id,
          })
        })
      } catch (error) {
        return mapPersistenceError(error)
      }
    },

    async getTrialLadderSeason(
      seasonIdOrSlug: string,
    ): Promise<TrialLadderSeasonDto | null> {
      try {
        return await withPool((pool) =>
          buildTrialLadderSeasonDto(pool, seasonIdOrSlug),
        )
      } catch (error) {
        return mapPersistenceError(error)
      }
    },

    async flagMatchSetResult(
      user: CompetitiveUser,
      input: { matchSetId: unknown; note: unknown },
    ): Promise<{ flagId: string }> {
      try {
        return await withPool(async (pool) => ({
          flagId: await flagMatchSetResult(pool, {
            matchSetId: normalizeText(input.matchSetId),
            userId: user.id,
            note: normalizeText(input.note),
          }),
        }))
      } catch (error) {
        return mapPersistenceError(error)
      }
    },

    async markMatchSetGovernanceStatus(
      user: CompetitiveUser,
      input: Parameters<typeof markMatchSetGovernanceStatus>[1],
    ): Promise<void> {
      try {
        return await withPool((pool) =>
          markMatchSetGovernanceStatus(pool, {
            ...input,
            adminUserId: user.id,
          }),
        )
      } catch (error) {
        return mapPersistenceError(error)
      }
    },

    async getPublicPlayerProfile(
      handle: string,
    ): Promise<PlayerProfileDto | null> {
      try {
        return await withPool((pool) =>
          buildPublicPlayerProfileDto(pool, handle),
        )
      } catch (error) {
        return mapPersistenceError(error)
      }
    },

    async getPublicStrategyCard(
      strategyId: string,
    ): Promise<StrategyCardDto | null> {
      try {
        return await withPool((pool) =>
          buildPublicStrategyCardDto(pool, strategyId),
        )
      } catch (error) {
        return mapPersistenceError(error)
      }
    },

    async getMatchSetResult(
      matchSetId: MatchSetId,
      currentUser: CompetitiveUser | null,
    ): Promise<MatchSetResultDto | null> {
      try {
        const summary =
          await cowardsService.getPublicMatchSetSummary(matchSetId)
        return summary ? toMatchSetResultDto(summary.result, currentUser) : null
      } catch (error) {
        return mapPersistenceError(error)
      }
    },
  }
}

export const competitiveServer = createCompetitiveServer()

export const getSessionIdFromCookies = async (): Promise<string> =>
  (await cookies()).get(SESSION_COOKIE_NAME)?.value ?? ""

export const getCurrentCompetitiveUser =
  async (): Promise<CompetitiveUser | null> =>
    (await competitiveServer.getSnapshot(await getSessionIdFromCookies())).user

export const replayHref = (matchId: MatchId): string =>
  `/matches/${encodeURIComponent(matchId)}/replay`
