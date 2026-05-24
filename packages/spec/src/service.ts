import type { z } from "zod"
import type {
  JsonValue,
  MatchId,
  MatchSetId,
  StrategyId,
  StrategyRevisionMetadata,
  StrategyRevisionId,
  UserId,
} from "./types.js"
import type {
  PublicMatchSetResultDto,
  PublicPlayerProfileDto,
  PublicStrategyCardDto,
  PublicTrialLadderSeasonDto,
} from "./competition.js"
import type { AnalyticsGauntletRunSummary } from "./analytics.js"
import type { StrategyRuntimeProductSemantics } from "./runtime.js"
import type {
  WorkshopAnalyticsComparisonSchema,
  WorkshopTestSummarySchema,
} from "./schemas.js"
import {
  AuthSessionServiceDtoSchema,
  CreateAnalyticsRunRequestBodySchema,
  CreateAnalyticsRunServiceDtoSchema,
  AnalyticsRunSummaryServiceDtoSchema,
  CreateMatchSetRequestBodySchema,
  CreateMatchSetServiceDtoSchema,
  CreateSessionRequestBodySchema,
  CreateSessionServiceDtoSchema,
  EmptyBodySchema,
  EmptyParamsSchema,
  EmptyQuerySchema,
  EnterLadderSeasonRequestBodySchema,
  EnterLadderSeasonServiceDtoSchema,
  ExportAnalyticsRunServiceDtoSchema,
  HandleParamsSchema,
  ListAnalyticsProfilesServiceDtoSchema,
  ListLadderSeasonsServiceDtoSchema,
  ListStrategyRevisionsServiceDtoSchema,
  MatchIdParamsSchema,
  MatchSetIdParamsSchema,
  ProfileIdParamsSchema,
  PublicMatchSetSummaryServiceDtoSchema,
  PublicLadderPageServiceDtoSchema,
  PublicPlayerPageServiceDtoSchema,
  PublicReplayMetadataServiceDtoSchema,
  PublicStrategyPageServiceDtoSchema,
  RevokeSessionServiceDtoSchema,
  RunIdParamsSchema,
  SeasonIdParamsSchema,
  ServiceErrorDtoSchema,
  ServiceHealthDtoSchema,
  StrategyRevisionIdParamsSchema,
  StrategyRevisionSourceServiceDtoSchema,
  StrategyRevisionSubmissionBodySchema,
  StrategyRevisionSubmissionServiceDtoSchema,
  StrategyIdParamsSchema,
} from "./schemas.js"

export const SERVICE_API_VERSION = "service-api-v1.8"

type Schema = z.ZodType

export type ServiceRouteMethod = "GET" | "POST" | "DELETE"
export type ServiceRouteAuthScope = "public" | "session" | "owner" | "admin"
export type ServiceRoutePrivacyClass = "public" | "owner" | "internal"

export interface ServiceRouteRequestContract {
  params: Schema
  query: Schema
  body: Schema
}

export interface ServiceRouteContract {
  id: string
  operationId: string
  method: ServiceRouteMethod
  path: string
  signature: string
  authScope: ServiceRouteAuthScope
  privacyClass: ServiceRoutePrivacyClass
  request: ServiceRouteRequestContract
  response: Schema
  error: Schema
  examples: readonly unknown[]
  fixtureRefs: readonly string[]
}

const request = (
  params: Schema = EmptyParamsSchema,
  query: Schema = EmptyQuerySchema,
  body: Schema = EmptyBodySchema,
): ServiceRouteRequestContract => ({ params, query, body })

export const SERVICE_API_ROUTES = {
  health: {
    id: "health",
    operationId: "getServiceHealth",
    method: "GET",
    path: "/health",
    signature: "GET /health",
    authScope: "public",
    privacyClass: "public",
    request: request(),
    response: ServiceHealthDtoSchema,
    error: ServiceErrorDtoSchema,
    examples: [
      { ok: true, service: "cowards-service", version: SERVICE_API_VERSION },
    ],
    fixtureRefs: ["serviceHealthExample"],
  },
  authSession: {
    id: "authSession",
    operationId: "getAuthSession",
    method: "GET",
    path: "/auth/session",
    signature: "GET /auth/session",
    authScope: "session",
    privacyClass: "owner",
    request: request(),
    response: AuthSessionServiceDtoSchema,
    error: ServiceErrorDtoSchema,
    examples: [
      {
        apiVersion: SERVICE_API_VERSION,
        kind: "authSession",
        user: {
          id: "user:demo",
          username: "demo-player",
          handle: "demo-player",
          displayName: "Demo Player",
        },
      },
    ],
    fixtureRefs: ["authSessionExample"],
  },
  createSession: {
    id: "createSession",
    operationId: "createSession",
    method: "POST",
    path: "/auth/session",
    signature: "POST /auth/session",
    authScope: "public",
    privacyClass: "owner",
    request: request(
      EmptyParamsSchema,
      EmptyQuerySchema,
      CreateSessionRequestBodySchema,
    ),
    response: CreateSessionServiceDtoSchema,
    error: ServiceErrorDtoSchema,
    examples: [
      {
        apiVersion: SERVICE_API_VERSION,
        kind: "authSession",
        user: {
          id: "user:demo",
          username: "demo-player",
          handle: "demo-player",
          displayName: "Demo Player",
        },
      },
    ],
    fixtureRefs: ["createSessionExample"],
  },
  revokeSession: {
    id: "revokeSession",
    operationId: "revokeSession",
    method: "DELETE",
    path: "/auth/session",
    signature: "DELETE /auth/session",
    authScope: "session",
    privacyClass: "owner",
    request: request(),
    response: RevokeSessionServiceDtoSchema,
    error: ServiceErrorDtoSchema,
    examples: [
      {
        apiVersion: SERVICE_API_VERSION,
        kind: "sessionRevoked",
        revoked: true,
      },
    ],
    fixtureRefs: ["revokeSessionExample"],
  },
  listStrategyRevisions: {
    id: "listStrategyRevisions",
    operationId: "listStrategyRevisions",
    method: "GET",
    path: "/account/strategy-revisions",
    signature: "GET /account/strategy-revisions",
    authScope: "owner",
    privacyClass: "owner",
    request: request(),
    response: ListStrategyRevisionsServiceDtoSchema,
    error: ServiceErrorDtoSchema,
    examples: [
      {
        apiVersion: SERVICE_API_VERSION,
        kind: "strategyRevisionList",
        revisions: [],
      },
    ],
    fixtureRefs: ["listStrategyRevisionsExample"],
  },
  createStrategyRevision: {
    id: "createStrategyRevision",
    operationId: "createStrategyRevision",
    method: "POST",
    path: "/account/strategy-revisions",
    signature: "POST /account/strategy-revisions",
    authScope: "owner",
    privacyClass: "owner",
    request: request(
      EmptyParamsSchema,
      EmptyQuerySchema,
      StrategyRevisionSubmissionBodySchema,
    ),
    response: StrategyRevisionSubmissionServiceDtoSchema,
    error: ServiceErrorDtoSchema,
    examples: [
      {
        apiVersion: SERVICE_API_VERSION,
        kind: "strategyRevisionCreated",
        strategyId: "strategy:demo",
        strategyRevisionId: "strategy-revision:demo",
        validationStatus: "valid",
      },
    ],
    fixtureRefs: ["createStrategyRevisionExample"],
  },
  getStrategyRevisionSource: {
    id: "getStrategyRevisionSource",
    operationId: "getStrategyRevisionSource",
    method: "GET",
    path: "/account/strategy-revisions/{strategyRevisionId}/source",
    signature: "GET /account/strategy-revisions/{strategyRevisionId}/source",
    authScope: "owner",
    privacyClass: "owner",
    request: request(StrategyRevisionIdParamsSchema),
    response: StrategyRevisionSourceServiceDtoSchema,
    error: ServiceErrorDtoSchema,
    examples: [
      {
        apiVersion: SERVICE_API_VERSION,
        kind: "strategyRevisionSource",
        strategyRevisionId: "strategy-revision:demo",
        source: "export default strategy",
        sourceHash: "sourcehash-demo",
      },
    ],
    fixtureRefs: ["getStrategyRevisionSourceExample"],
  },
  createMatchSet: {
    id: "createMatchSet",
    operationId: "createMatchSet",
    method: "POST",
    path: "/matchsets",
    signature: "POST /matchsets",
    authScope: "owner",
    privacyClass: "owner",
    request: request(
      EmptyParamsSchema,
      EmptyQuerySchema,
      CreateMatchSetRequestBodySchema,
    ),
    response: CreateMatchSetServiceDtoSchema,
    error: ServiceErrorDtoSchema,
    examples: [
      {
        apiVersion: SERVICE_API_VERSION,
        kind: "matchSetCreated",
        matchSetId: "match-set:demo",
        publicHref: "/matchsets/match-set:demo",
      },
    ],
    fixtureRefs: ["createMatchSetExample"],
  },
  getPublicMatchSetSummary: {
    id: "getPublicMatchSetSummary",
    operationId: "getPublicMatchSetSummary",
    method: "GET",
    path: "/public/matchsets/{matchSetId}/summary",
    signature: "GET /public/matchsets/{matchSetId}/summary",
    authScope: "public",
    privacyClass: "public",
    request: request(MatchSetIdParamsSchema),
    response: PublicMatchSetSummaryServiceDtoSchema,
    error: ServiceErrorDtoSchema,
    examples: [
      {
        apiVersion: SERVICE_API_VERSION,
        kind: "publicMatchSetSummary",
        matchSetId: "match-set:demo",
        result: {
          matchSetId: "match-set:demo",
          preset: {
            id: "smoke-exhibition-v1",
            version: "v1",
            label: "Smoke Exhibition",
          },
          status: "complete",
          visibility: "public",
          scoringPolicy: {
            id: "exhibition-points-v1",
            version: "v1",
            winPoints: 3,
            drawPoints: 1,
            lossPoints: 0,
            strategyFailurePenaltyPoints: -1,
          },
          entrants: [],
          standings: [],
          matches: [],
          provenance: {
            matchSetId: "match-set:demo",
            presetId: "smoke-exhibition-v1",
            scoringPolicyVersion: "v1",
            entrantSnapshotIds: [],
            chronicleHashes: [],
          },
          publication: {
            publicResults: true,
            publicReplayEvidence: true,
            privateFieldsExcluded: [
              "Strategy source",
              "StrategyMemory",
              "SoldierMemory",
              "objective payloads",
            ],
          },
        },
      },
    ],
    fixtureRefs: ["publicMatchSetSummaryExample"],
  },
  getPublicReplayMetadata: {
    id: "getPublicReplayMetadata",
    operationId: "getPublicReplayMetadata",
    method: "GET",
    path: "/public/replays/{matchId}/metadata",
    signature: "GET /public/replays/{matchId}/metadata",
    authScope: "public",
    privacyClass: "public",
    request: request(MatchIdParamsSchema),
    response: PublicReplayMetadataServiceDtoSchema,
    error: ServiceErrorDtoSchema,
    examples: [
      {
        apiVersion: SERVICE_API_VERSION,
        kind: "publicReplayMetadata",
        matchId: "match:demo",
        metadata: {
          matchId: "match:demo",
          chronicleId: "chronicle:demo",
          hash: "chroniclehash-demo",
          schemaVersion: "chronicle-v1.4",
          eventCount: 42,
          snapshotCount: 5,
          bottomPlayerId: "player:bottom",
          topPlayerId: "player:top",
          arenaVariantId: "arena:standard",
        },
      },
    ],
    fixtureRefs: ["publicReplayMetadataExample"],
  },
  listAnalyticsProfiles: {
    id: "listAnalyticsProfiles",
    operationId: "listAnalyticsProfiles",
    method: "GET",
    path: "/analytics/profiles",
    signature: "GET /analytics/profiles",
    authScope: "owner",
    privacyClass: "owner",
    request: request(),
    response: ListAnalyticsProfilesServiceDtoSchema,
    error: ServiceErrorDtoSchema,
    examples: [
      {
        apiVersion: SERVICE_API_VERSION,
        kind: "analyticsProfileList",
        profiles: [
          {
            apiVersion: SERVICE_API_VERSION,
            kind: "analyticsProfile",
            profileId: "analytics-profile:demo",
            ownerUserId: "user:demo",
            label: "Demo gauntlet",
            revisionIds: ["strategy-revision:demo"],
          },
        ],
      },
    ],
    fixtureRefs: ["listAnalyticsProfilesExample"],
  },
  createAnalyticsRun: {
    id: "createAnalyticsRun",
    operationId: "createAnalyticsRun",
    method: "POST",
    path: "/analytics/profiles/{profileId}/runs",
    signature: "POST /analytics/profiles/{profileId}/runs",
    authScope: "owner",
    privacyClass: "owner",
    request: request(
      ProfileIdParamsSchema,
      EmptyQuerySchema,
      CreateAnalyticsRunRequestBodySchema,
    ),
    response: CreateAnalyticsRunServiceDtoSchema,
    error: ServiceErrorDtoSchema,
    examples: [
      {
        apiVersion: SERVICE_API_VERSION,
        kind: "analyticsRun",
        runId: "analytics-run:demo",
        profileId: "analytics-profile:demo",
        status: "queued",
      },
    ],
    fixtureRefs: ["createAnalyticsRunExample"],
  },
  getAnalyticsRunSummary: {
    id: "getAnalyticsRunSummary",
    operationId: "getAnalyticsRunSummary",
    method: "GET",
    path: "/analytics/runs/{runId}/summary",
    signature: "GET /analytics/runs/{runId}/summary",
    authScope: "owner",
    privacyClass: "owner",
    request: request(RunIdParamsSchema),
    response: AnalyticsRunSummaryServiceDtoSchema,
    error: ServiceErrorDtoSchema,
    examples: [
      {
        apiVersion: SERVICE_API_VERSION,
        kind: "analyticsRunSummary",
        runId: "analytics-run:demo",
        profileId: "analytics-profile:demo",
        summary: {
          summarySchemaVersion: "analytics-summary-v1.6",
          profileId: "analytics-profile:demo",
          runId: "analytics-run:demo",
          ownerUserId: "user:demo",
          lifecycleStatus: "complete",
          compatibility: {
            hash: "sha256:analytics-demo",
            key: {
              profileSchemaVersion: "analytics-profile-v1.6",
              candidateRevisionIds: ["strategy-revision:demo"],
              opponentRevisionIds: ["strategy-revision:opponent"],
              presetId: "smoke-exhibition-v1",
              seeds: ["seed:demo"],
              mirrorSides: true,
              scoringPolicyVersion: "v1",
              ruleVersion: "cowards-rules-v1.4",
              chronicleVersion: "chronicle-v1.4",
              runtimeAdapter: "runtime-js-worker-thread",
              runtimeVersion: "runtime-js-v1",
              matrixOrder: ["strategy-revision:demo"],
            },
            equivalent: true,
            mismatches: [],
          },
          totals: {
            wins: 1,
            losses: 0,
            draws: 0,
            points: 3,
            matchups: 1,
            completedMatches: 1,
            failedMatches: 0,
          },
          matchupRecords: [],
          provenance: {
            matchSetIds: ["match-set:demo"],
            generatedAt: "2026-05-22T00:00:00.000Z",
            runSchemaVersion: "analytics-run-v1.6",
          },
          privacy: {
            ownerSafe: true,
            publicFieldsExcluded: [
              "Strategy source",
              "StrategyMemory",
              "SoldierMemory",
              "objective payloads",
            ],
          },
        },
      },
    ],
    fixtureRefs: ["analyticsRunSummaryExample"],
  },
  exportAnalyticsRun: {
    id: "exportAnalyticsRun",
    operationId: "exportAnalyticsRun",
    method: "GET",
    path: "/analytics/runs/{runId}/export",
    signature: "GET /analytics/runs/{runId}/export",
    authScope: "owner",
    privacyClass: "owner",
    request: request(RunIdParamsSchema),
    response: ExportAnalyticsRunServiceDtoSchema,
    error: ServiceErrorDtoSchema,
    examples: [
      {
        apiVersion: SERVICE_API_VERSION,
        kind: "exportManifest",
        exportId: "export:demo",
        format: "json",
        href: "/analytics/runs/analytics-run:demo/export",
        contentHash: "exporthash-demo",
      },
    ],
    fixtureRefs: ["exportAnalyticsRunExample"],
  },
  listLadderSeasons: {
    id: "listLadderSeasons",
    operationId: "listLadderSeasons",
    method: "GET",
    path: "/ladders/seasons",
    signature: "GET /ladders/seasons",
    authScope: "public",
    privacyClass: "public",
    request: request(),
    response: ListLadderSeasonsServiceDtoSchema,
    error: ServiceErrorDtoSchema,
    examples: [
      {
        apiVersion: SERVICE_API_VERSION,
        kind: "ladderSeasonList",
        seasons: [
          {
            apiVersion: SERVICE_API_VERSION,
            kind: "ladderSeason",
            seasonId: "ladder-season:demo",
            status: "open",
            publicHref: "/ladder/demo",
          },
        ],
      },
    ],
    fixtureRefs: ["listLadderSeasonsExample"],
  },
  enterLadderSeason: {
    id: "enterLadderSeason",
    operationId: "enterLadderSeason",
    method: "POST",
    path: "/ladders/seasons/{seasonId}/entries",
    signature: "POST /ladders/seasons/{seasonId}/entries",
    authScope: "owner",
    privacyClass: "owner",
    request: request(
      SeasonIdParamsSchema,
      EmptyQuerySchema,
      EnterLadderSeasonRequestBodySchema,
    ),
    response: EnterLadderSeasonServiceDtoSchema,
    error: ServiceErrorDtoSchema,
    examples: [
      {
        apiVersion: SERVICE_API_VERSION,
        kind: "ladderEntryCreated",
        seasonId: "ladder-season:demo",
        entryId: "ladder-entry:demo",
        status: "active",
      },
    ],
    fixtureRefs: ["enterLadderSeasonExample"],
  },
  getPublicPlayerPage: {
    id: "getPublicPlayerPage",
    operationId: "getPublicPlayerPage",
    method: "GET",
    path: "/public/players/{handle}",
    signature: "GET /public/players/{handle}",
    authScope: "public",
    privacyClass: "public",
    request: request(HandleParamsSchema),
    response: PublicPlayerPageServiceDtoSchema,
    error: ServiceErrorDtoSchema,
    examples: [
      {
        apiVersion: SERVICE_API_VERSION,
        kind: "publicPage",
        page: "player",
        canonicalHref: "/players/demo-player",
        payload: {
          handle: "demo-player",
          displayName: "Demo Player",
          strategies: [],
          ladderHistory: [],
          results: [],
        },
      },
    ],
    fixtureRefs: ["publicPlayerPageExample"],
  },
  getPublicLadderSeason: {
    id: "getPublicLadderSeason",
    operationId: "getPublicLadderSeason",
    method: "GET",
    path: "/public/ladders/{seasonId}",
    signature: "GET /public/ladders/{seasonId}",
    authScope: "public",
    privacyClass: "public",
    request: request(SeasonIdParamsSchema),
    response: PublicLadderPageServiceDtoSchema,
    error: ServiceErrorDtoSchema,
    examples: [
      {
        apiVersion: SERVICE_API_VERSION,
        kind: "publicPage",
        page: "ladder",
        canonicalHref: "/ladder/demo-season",
        payload: {
          seasonId: "ladder-season:demo",
          slug: "demo-season",
          name: "Demo Trial Ladder",
          status: "open",
          statusLabel: "Open",
          seasonSeed: "trial-ladder-demo-seed",
          policy: {
            oneEntryPerUser: true,
            replacementPolicy: "next-season-only",
            staleRevisionPolicy:
              "Immutable revisions stay eligible for the current season.",
            standingsReset: true,
            noPermanentRatings: true,
            minimumEntries: 2,
            targetPodSize: 4,
          },
          entries: [],
          standings: [],
          matchSets: [],
          publication: {
            publicEntries: true,
            publicStandings: true,
            publicReplayEvidence: true,
            privateFieldsExcluded: [
              "Strategy source",
              "StrategyMemory",
              "SoldierMemory",
              "objective payloads",
              "owner debug",
              "private runtime internals",
            ],
          },
        },
      },
    ],
    fixtureRefs: ["publicLadderPageExample"],
  },
  getPublicStrategyPage: {
    id: "getPublicStrategyPage",
    operationId: "getPublicStrategyPage",
    method: "GET",
    path: "/public/strategies/{strategyId}",
    signature: "GET /public/strategies/{strategyId}",
    authScope: "public",
    privacyClass: "public",
    request: request(StrategyIdParamsSchema),
    response: PublicStrategyPageServiceDtoSchema,
    error: ServiceErrorDtoSchema,
    examples: [
      {
        apiVersion: SERVICE_API_VERSION,
        kind: "publicPage",
        page: "strategy",
        canonicalHref: "/strategies/strategy:demo",
        payload: {
          strategy: {
            strategyId: "strategy:demo",
            strategyRevisionId: "strategy-revision:demo",
            name: "Demo Strategy",
            tags: ["starter"],
            authorHandle: "demo-player",
            sourceHash: "sourcehash-demo",
            sourceBytes: 256,
            runtime: {
              abiVersion: "strategy-runtime-abi-v1.14",
              language: { id: "typescript", version: "runtime-js-v1" },
              adapter: {
                id: "runtime-js-worker-thread",
                version: "runtime-js-v1",
              },
              package: { mode: "none", entrypoint: "default" },
              requiredCapabilities: [],
            },
            engineCompatibility: {
              spec: "cowards-rules-v1.4",
              engine: "engine-v1",
            },
            validationStatus: "valid",
            record: {
              wins: 3,
              losses: 1,
              draws: 0,
              points: 9,
            },
            resultLinks: ["/matchsets/match-set:demo"],
            replayLinks: ["/replays/match:demo"],
          },
        },
      },
    ],
    fixtureRefs: ["publicStrategyPageExample"],
  },
} as const satisfies Record<string, ServiceRouteContract>

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
    username: string
    handle: string
    displayName: string
  } | null
}

export interface StrategyRevisionSummaryServiceDto {
  apiVersion: typeof SERVICE_API_VERSION
  kind: "strategyRevisionSummary"
  strategyId: StrategyId
  strategyRevisionId: StrategyRevisionId
  label?: string | undefined
  notes?: string | undefined
  tags?: string[] | undefined
  starterLineage?: StrategyRevisionMetadata["starterLineage"] | undefined
  advancedLineage?: StrategyRevisionMetadata["advancedLineage"] | undefined
  sourceHash: string
  sourceBytes: number
  runtimeSemantics: StrategyRuntimeProductSemantics
  engineCompatibility: {
    spec: string
    engine: string
  }
  validationStatus: "valid" | "invalid"
  createdAt: string
  lockedAt?: string | undefined
}

export interface ListStrategyRevisionsServiceDto {
  apiVersion: typeof SERVICE_API_VERSION
  kind: "strategyRevisionList"
  revisions: StrategyRevisionSummaryServiceDto[]
}

export interface PublicMatchSetSummaryServiceDto {
  apiVersion: typeof SERVICE_API_VERSION
  kind: "publicMatchSetSummary"
  matchSetId: MatchSetId
  result: PublicMatchSetResultDto
}

export type WorkshopTestSummary = z.infer<typeof WorkshopTestSummarySchema>

export interface WorkshopTestSummaryServiceDto {
  apiVersion: typeof SERVICE_API_VERSION
  kind: "workshopTestSummary"
  matchSetId: MatchSetId
  summary: WorkshopTestSummary
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

export interface AnalyticsRunSummaryServiceDto {
  apiVersion: typeof SERVICE_API_VERSION
  kind: "analyticsRunSummary"
  runId: string
  profileId: string
  summary: AnalyticsGauntletRunSummary
}

export type WorkshopAnalyticsComparison = z.infer<
  typeof WorkshopAnalyticsComparisonSchema
>

export interface WorkshopAnalyticsComparisonServiceDto {
  apiVersion: typeof SERVICE_API_VERSION
  kind: "workshopAnalyticsComparison"
  profileId: string
  comparison: WorkshopAnalyticsComparison
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

export interface PublicPlayerPageServiceDto extends Omit<
  PublicPageServiceDto,
  "page" | "payload"
> {
  page: "player"
  payload: PublicPlayerProfileDto
}

export interface PublicLadderPageServiceDto extends Omit<
  PublicPageServiceDto,
  "page" | "payload"
> {
  page: "ladder"
  payload: PublicTrialLadderSeasonDto
}

export interface PublicStrategyPageServiceDto extends Omit<
  PublicPageServiceDto,
  "page" | "payload"
> {
  page: "strategy"
  payload: {
    strategy: PublicStrategyCardDto
  }
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
    "tokens",
    "session",
    "sessions",
    "hostPath",
    "hostPaths",
    "runtimeInternal",
    "runtimeInternals",
    "privateRuntimeInternal",
    "privateRuntimeInternals",
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
