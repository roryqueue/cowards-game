import type {
  JsonValue,
  MatchId,
  MatchSetId,
  StrategyId,
  StrategyRevisionId,
  UserId,
} from "./types.js"
import type { PublicMatchSetResultDto } from "./competition.js"
import type { StrategyRuntimeMetadata } from "./runtime.js"

export const SERVICE_API_VERSION = "service-api-v1.7"

export const SERVICE_API_ROUTES = {
  health: "GET /health",
  authSession: "GET /auth/session",
  createSession: "POST /auth/session",
  revokeSession: "DELETE /auth/session",
  listStrategyRevisions: "GET /account/strategy-revisions",
  createStrategyRevision: "POST /account/strategy-revisions",
  getStrategyRevisionSource:
    "GET /account/strategy-revisions/{strategyRevisionId}/source",
  createMatchSet: "POST /matchsets",
  getPublicMatchSetSummary: "GET /public/matchsets/{matchSetId}/summary",
  getPublicReplayMetadata: "GET /public/replays/{matchId}/metadata",
  listAnalyticsProfiles: "GET /analytics/profiles",
  createAnalyticsRun: "POST /analytics/profiles/{profileId}/runs",
  exportAnalyticsRun: "GET /analytics/runs/{runId}/export",
  listLadderSeasons: "GET /ladders/seasons",
  enterLadderSeason: "POST /ladders/seasons/{seasonId}/entries",
  getPublicPlayerPage: "GET /public/players/{handle}",
  getPublicStrategyPage: "GET /public/strategies/{strategyId}",
} as const

export type ServiceApiRouteId = keyof typeof SERVICE_API_ROUTES

export const SERVICE_ERROR_CODES = [
  "NOT_FOUND",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "VALIDATION_FAILED",
  "STORAGE_UNAVAILABLE",
  "UPSTREAM_UNAVAILABLE",
  "INTERNAL",
] as const

export type ServiceErrorCode = (typeof SERVICE_ERROR_CODES)[number]

export interface ServiceErrorDto {
  code: ServiceErrorCode
  message: string
  status: number
  publicSafe: true
  details?: JsonValue | undefined
}

export interface ServiceHealthDto {
  ok: true
  service: "cowards-service"
  version: typeof SERVICE_API_VERSION
}

export interface AuthSessionServiceDto {
  apiVersion: typeof SERVICE_API_VERSION
  kind: "authSession"
  user: {
    id: UserId
    handle: string
    displayName: string
  } | null
}

export interface StrategyRevisionSummaryServiceDto {
  apiVersion: typeof SERVICE_API_VERSION
  kind: "strategyRevisionSummary"
  strategyId: StrategyId
  strategyRevisionId: StrategyRevisionId
  sourceHash: string
  sourceBytes: number
  runtime: StrategyRuntimeMetadata
  validationStatus: "valid" | "invalid"
  lockedAt?: string | undefined
}

export interface PublicMatchSetSummaryServiceDto {
  apiVersion: typeof SERVICE_API_VERSION
  kind: "publicMatchSetSummary"
  matchSetId: MatchSetId
  result: PublicMatchSetResultDto
}

export interface PublicReplayMetadataServiceDto {
  apiVersion: typeof SERVICE_API_VERSION
  kind: "publicReplayMetadata"
  matchId: MatchId
  metadata: {
    matchId: MatchId
    chronicleId: string
    hash: string
    schemaVersion: string
    eventCount: number
    snapshotCount: number
    bottomPlayerId: string
    topPlayerId: string
    arenaVariantId: string
  }
}

export interface AnalyticsProfileServiceDto {
  apiVersion: typeof SERVICE_API_VERSION
  kind: "analyticsProfile"
  profileId: string
  ownerUserId: UserId
  label: string
  revisionIds: StrategyRevisionId[]
}

export interface AnalyticsRunServiceDto {
  apiVersion: typeof SERVICE_API_VERSION
  kind: "analyticsRun"
  runId: string
  profileId: string
  status: "queued" | "running" | "complete" | "failed"
  summary?: JsonValue | undefined
}

export interface ExportManifestServiceDto {
  apiVersion: typeof SERVICE_API_VERSION
  kind: "exportManifest"
  exportId: string
  format: "json" | "csv"
  href: string
  contentHash: string
}

export interface LadderSeasonServiceDto {
  apiVersion: typeof SERVICE_API_VERSION
  kind: "ladderSeason"
  seasonId: string
  status: string
  publicHref: string
}

export interface PublicPageServiceDto {
  apiVersion: typeof SERVICE_API_VERSION
  kind: "publicPage"
  page: "player" | "strategy" | "matchSet" | "replay" | "ladder"
  canonicalHref: string
  payload: JsonValue
}

export const assertPublicServiceDtoLeakSafe = (value: unknown): void => {
  const forbidden = new Set([
    "source",
    "strategySource",
    "strategyMemory",
    "soldierMemory",
    "objective",
    "objectivePayload",
    "ownerDebug",
    "exactAwarenessGrid",
    "awarenessGrid",
    "rawRuntimeDetails",
    "privateRuntime",
    "privateDiagnostics",
    "stack",
    "stackTrace",
    "stderr",
    "password",
    "passwordHash",
    "token",
    "session",
  ])
  const visit = (node: unknown, path: string): void => {
    if (Array.isArray(node)) {
      node.forEach((item, index) => visit(item, `${path}[${index}]`))
      return
    }
    if (node === null || typeof node !== "object") {
      return
    }
    for (const [key, entryValue] of Object.entries(
      node as Record<string, unknown>,
    )) {
      if (forbidden.has(key)) {
        throw new Error(
          `Public service DTO leaks private field: ${path}.${key}`,
        )
      }
      visit(entryValue, `${path}.${key}`)
    }
  }
  visit(value, "$")
}
