#!/usr/bin/env -S pnpm exec tsx
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createWorkerRuntimeConfig } from "../apps/worker/src/runtime-config.ts"
import {
  assertRuntimeIsolationReadinessGuardrails,
  assertSandboxEvaluationPublicSafe,
  type SandboxEvaluationReport,
} from "../packages/runtime-js/src/sandbox-evaluation.ts"
import {
  analyzeServiceBoundaryImports,
  type ServiceBoundaryOffense,
} from "./check-service-boundary-imports.ts"
import { evaluateLocalTopology } from "./check-local-topology.ts"
import {
  SERVICE_API_ROUTES,
  STRATEGY_RUNTIME_ABI_VERSION,
  COMPATIBILITY_VERSIONS,
  assertAnalyticsPublicSummaryLeakSafe,
  assertNonJsRuntimeGuardrails,
  assertPublicServiceDtoLeakSafe,
  describeStrategyRuntimeProductSemantics,
  evaluateStrategyRuntimeCountedEligibility,
  getStrategyRuntimeAdapterRecord,
  NON_JS_RUNTIME_PROMOTION_CRITERIA,
  NON_JS_RUNTIME_SUPPORT_POLICY,
  type StrategyRuntimeAdapterId,
} from "../packages/spec/src/index.ts"

type MonitorLayer =
  | "contract_drift"
  | "privacy"
  | "web_boundary"
  | "runtime_adapter"
  | "runtime_isolation"
  | "non_js_runtime"
  | "go_parity"
  | "go_promotion"
  | "topology"

export interface BoundaryMonitorCheck {
  layer: MonitorLayer
  name: string
  ok: boolean
  detail: string
}

interface OpenApiArtifact {
  openapi: string
  info: { version: string }
  paths: Record<string, Record<string, { "x-route-id"?: string }>>
}

interface GoRouteManifestEntry {
  id: string
  method: string
  path: string
  authScope: string
  privacyClass: string
  requiresBearerToken?: boolean
}

interface RuntimeAdapterBridge {
  selector: string
  specAdapterId: StrategyRuntimeAdapterId
}

interface GoPromotionRouteOwnershipEntry {
  routeId: string
  method: string
  path: string
  currentOwner: string
  eligibleForGoPromotion: boolean
  selectedCandidate: boolean
  privacyClass: string
  fallbackPolicy: string
  rollbackOwner: string
  promotionStatus: string
  blockedReasons: readonly string[]
  disallowedScopes: readonly string[]
}

interface GoPromotionRouteOwnershipManifest {
  milestone: string
  decision: "promote-one-route" | "promote-none-yet"
  selectedRouteId: string | null
  routes: readonly GoPromotionRouteOwnershipEntry[]
}

interface V113RouteOwnershipEntry {
  routeId: string
  method: string
  path: string
  routeFamily:
    | "public_read"
    | "session"
    | "account_revision"
    | "artifact_fork"
    | "mutation"
    | "worker_runtime"
    | "deferred"
  authScope: "public" | "session" | "owner" | "internal"
  privacyClass: string
  currentOwner: string
  selectedOwner: string
  fallbackPolicy: string
  rollbackOwner: string
  diagnosticsClass: string
  promotionStatus:
    | "go_primary"
    | "typescript_primary"
    | "typescript_reference"
    | "worker_owned"
    | "deferred"
    | "blocked"
    | "rolled_back"
    | "evidence_only"
  blockedReasons: readonly string[]
  evidenceRequired: readonly string[]
  disallowedScopes: readonly string[]
}

interface V113RouteOwnershipManifest {
  schemaVersion:
    | "v1.13-route-ownership-manifest"
    | "v1.14-route-ownership-manifest"
  milestone: "v1.13" | "v1.14"
  decision:
    | "aggressive-go-backend-cutover"
    | "artifact-backed-go-forks-with-runtime-boundary"
  typeScriptRole: string
  selectedRouteFamilies: readonly string[]
  allowedPromotionStates: readonly string[]
  routes: readonly V113RouteOwnershipEntry[]
  runtimeBoundary?: {
    abiVersion: string
    executionOwner: string
    explicitNonGoals: readonly string[]
  }
  strategyArtifacts?: {
    schemaVersion: string
    artifactCount: number
    goConsumptionMode: string
  }
}

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

const openApiArtifactPath =
  "packages/spec/artifacts/service-api-v1.8.openapi.json"
const goFixtureDir = "apps/go-backend/testdata/service-fixtures"
const sandboxEvaluationArtifactPath =
  ".planning/artifacts/runtime-sandbox-evaluation.json"
const goPromotionManifestPath =
  ".planning/artifacts/v1.12-route-ownership-manifest.json"
const v113RouteOwnershipManifestPath =
  ".planning/artifacts/v1.13-route-ownership-manifest.json"
const v114RouteOwnershipManifestPath =
  ".planning/artifacts/v1.14-route-ownership-manifest.json"

export const knownReportOnlyBoundaryOffenses = new Set([
  'apps/web/app/api/account/advanced-forks/route.ts:1:competitive/server:import { competitiveServer, getCurrentCompetitiveUser, } from "../../../competitive/server.js"',
  'apps/web/app/api/account/revisions/[revisionId]/source/route.ts:2:competitive/server:import { competitiveServer, getCurrentCompetitiveUser, } from "../../../../../competitive/server.js"',
  'apps/web/app/api/account/starter-forks/route.ts:1:competitive/server:import { competitiveServer, getCurrentCompetitiveUser, } from "../../../competitive/server.js"',
  'apps/web/app/api/admin/matchsets/[matchSetId]/governance/route.ts:1:competitive/server:import { competitiveServer, getCurrentCompetitiveUser, } from "../../../../../competitive/server.js"',
  'apps/web/app/api/auth/sign-in/route.ts:1:competitive/server:import { competitiveServer } from "../../../competitive/server.js"',
  'apps/web/app/api/auth/sign-out/route.ts:1:competitive/server:import { competitiveServer, getSessionIdFromCookies, } from "../../../competitive/server.js"',
  'apps/web/app/api/auth/sign-up/route.ts:1:competitive/server:import { competitiveServer } from "../../../competitive/server.js"',
  'apps/web/app/api/exhibitions/route.ts:2:competitive/server:import { competitiveServer, getCurrentCompetitiveUser, } from "../../competitive/server.js"',
  'apps/web/app/api/ladder/seasons/[seasonId]/entries/route.ts:1:competitive/server:import { competitiveServer, getCurrentCompetitiveUser, } from "../../../../../competitive/server.js"',
  'apps/web/app/api/ladder/seasons/[seasonId]/schedule/route.ts:1:competitive/server:import { competitiveServer, getCurrentCompetitiveUser, } from "../../../../../competitive/server.js"',
  'apps/web/app/api/ladder/seasons/route.ts:1:competitive/server:import { competitiveServer, getCurrentCompetitiveUser, } from "../../../competitive/server.js"',
  'apps/web/app/api/matchsets/[matchSetId]/flags/route.ts:1:competitive/server:import { competitiveServer, getCurrentCompetitiveUser, } from "../../../../competitive/server.js"',
  'apps/web/app/competitive/server.ts:2:@cowards/persistence:import { createDatabasePool } from "@cowards/persistence/db"',
  'apps/web/app/competitive/server.ts:3:@cowards/persistence:import { AuthInputError, authenticateAccount, createAccount, createSession, getSession, revokeSession, type PublicUserAccount, } from "@cowards/persistence/auth"',
  'apps/web/app/competitive/server.ts:12:@cowards/persistence:import { AccountRevisionError, createAccountStrategyRevision, forkAdvancedStrategyToAccount, forkStarterStrategyToAccount, getAccountStrategyRevisionSource, listAccountStrategyRevisions, type AccountStrategyRevisionSummary, } from "@cowards/persistence/account-revisions"',
  'apps/web/app/competitive/server.ts:21:@cowards/persistence:import { ActiveDuplicateExhibitionError, CompetitionInputError, ExhibitionRateLimitError, createManualExhibitionMatchSet, } from "@cowards/persistence/competition"',
  'apps/web/app/competitive/server.ts:28:@cowards/persistence:import { createTrialLadderSeason, enterTrialLadderSeason, LadderInputError, scheduleTrialLadderSeason, setTrialLadderSeasonStatus, withdrawTrialLadderEntry, } from "@cowards/persistence/ladder"',
  'apps/web/app/competitive/server.ts:36:@cowards/persistence:import { assertAdminUser, flagMatchSetResult, GovernanceInputError, markMatchSetGovernanceStatus, } from "@cowards/persistence/governance"',
  'apps/web/app/competitive/server.ts:42:@cowards/persistence:import { findAdvancedStrategy } from "@cowards/persistence/advanced-strategies"',
  'apps/web/app/competitive/server.ts:43:@cowards/persistence:import { findStarterStrategy } from "@cowards/persistence/starter-strategies"',
  'apps/web/app/matches/replay-fixture.ts:6:@cowards/persistence:import { createChronicleMetadata } from "@cowards/persistence/chronicle-store"',
  'apps/web/app/matches/replay-ready.ts:7:@cowards/persistence:import type { StoredChronicle } from "@cowards/persistence/chronicle-store"',
  'apps/web/app/matches/server.test.ts:6:@cowards/persistence:import { createChronicleMetadata, type StoredChronicle, } from "@cowards/persistence"',
  'apps/web/app/matches/server.ts:1:@cowards/persistence:import { createDatabasePool } from "@cowards/persistence/db"',
  'apps/web/app/matches/server.ts:2:@cowards/persistence:import { createPostgresChronicleStore, type ChronicleStore, } from "@cowards/persistence/chronicle-store"',
  'apps/web/app/matches/server.ts:6:@cowards/persistence:import type { Queryable } from "@cowards/persistence/repositories"',
  'apps/web/app/workshop/server.ts:1:@cowards/persistence:import { createDatabasePool } from "@cowards/persistence/db"',
  'apps/web/app/workshop/server.ts:2:@cowards/persistence:import { buildWorkshopRevision, createWorkshopTestMatchSet, getWorkshopRevisionSource, getWorkshopSnapshot, getWorkshopStaticSnapshot, getWorkshopTestSummary, insertWorkshopRevision, type WorkshopTestSummary, validateWorkshopSource, WORKSHOP_STRATEGY_ID, } from "@cowards/persistence/workshop"',
  'apps/web/app/workshop/server.ts:14:@cowards/persistence:import { comparePersistedWorkshopAnalyticsRuns, createWorkshopAnalyticsDemoSnapshot, createWorkshopAnalyticsExport, createPersistedWorkshopAnalyticsRerun, getWorkshopAnalyticsSnapshot, seedWorkshopAnalyticsDemo, } from "@cowards/persistence/workshop-analytics"',
] as const)

const forbiddenPublicArtifactStrings = [
  "strategyMemory",
  "soldierMemory",
  "objectivePayload",
  "ownerDebug",
  "awarenessGrid",
  "stackTrace",
  "stderr",
  "tokens",
  "hostPath",
  "privateRuntimeInternals",
] as const

const runtimeAdapterBridges: RuntimeAdapterBridge[] = [
  {
    selector: "worker-thread",
    specAdapterId: "runtime-js-worker-thread",
  },
  {
    selector: "subprocess",
    specAdapterId: "runtime-js-subprocess",
  },
  {
    selector: "container-subprocess",
    specAdapterId: "runtime-js-container-subprocess",
  },
]

const readJson = <T>(relativePath: string): T =>
  JSON.parse(readFileSync(path.join(repoRoot, relativePath), "utf8")) as T

const offenseKey = (offense: ServiceBoundaryOffense): string =>
  offense.statementText
    ? `${offense.path}:${offense.line}:${offense.pattern}:${offense.statementText}`
    : `${offense.path}:${offense.line}:${offense.pattern}`

export const findUnknownReportOnlyOffenses = (
  offenses: readonly ServiceBoundaryOffense[],
  baseline: ReadonlySet<string> = knownReportOnlyBoundaryOffenses,
): readonly string[] =>
  offenses
    .map(offenseKey)
    .filter((key) => !baseline.has(key))
    .sort()

export const assertMonitorPublicPayload = (value: unknown): void => {
  assertPublicServiceDtoLeakSafe(value)
}

const assertOpenApiPublicSchemaLeakSafe = (
  value: unknown,
  routePath = "$",
): void => {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertOpenApiPublicSchemaLeakSafe(item, `${routePath}[${index}]`),
    )
    return
  }
  if (value === null || typeof value !== "object") {
    return
  }
  for (const [key, entryValue] of Object.entries(
    value as Record<string, unknown>,
  )) {
    if (key === "properties" && entryValue && typeof entryValue === "object") {
      for (const propertyName of Object.keys(
        entryValue as Record<string, unknown>,
      )) {
        try {
          assertPublicServiceDtoLeakSafe({ [propertyName]: null })
        } catch (error) {
          throw new Error(
            `OpenAPI public schema leaks private field at ${routePath}.properties.${propertyName}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          )
        }
      }
    }
    assertOpenApiPublicSchemaLeakSafe(entryValue, `${routePath}.${key}`)
  }
}

const check = async (
  layer: MonitorLayer,
  name: string,
  run: () => Promise<string> | string,
): Promise<BoundaryMonitorCheck> => {
  try {
    return { layer, name, ok: true, detail: await run() }
  } catch (error) {
    return {
      layer,
      name,
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    }
  }
}

const checkOpenApiContract = (): string => {
  const artifact = readJson<OpenApiArtifact>(openApiArtifactPath)
  if (artifact.openapi !== "3.1.0") {
    throw new Error(`OpenAPI version drifted to ${artifact.openapi}`)
  }
  if (artifact.info.version !== "service-api-v1.8") {
    throw new Error(
      `service artifact version drifted to ${artifact.info.version}`,
    )
  }

  const artifactPaths = new Set(Object.keys(artifact.paths))
  for (const route of Object.values(SERVICE_API_ROUTES)) {
    const inArtifact = artifactPaths.has(route.path)
    if (route.privacyClass === "public" && !inArtifact) {
      throw new Error(`public route missing from OpenAPI artifact: ${route.id}`)
    }
    if (route.privacyClass !== "public" && inArtifact) {
      throw new Error(
        `non-public route exposed in OpenAPI artifact: ${route.id}`,
      )
    }
    const operation = artifact.paths[route.path]?.[route.method.toLowerCase()]
    if (
      route.privacyClass === "public" &&
      operation?.["x-route-id"] !== route.id
    ) {
      throw new Error(`route id drift for ${route.id}`)
    }
  }

  const serialized = JSON.stringify(artifact)
  assertOpenApiPublicSchemaLeakSafe(artifact)
  for (const marker of forbiddenPublicArtifactStrings) {
    if (serialized.includes(marker)) {
      throw new Error(`OpenAPI artifact contains private marker ${marker}`)
    }
  }
  return `${artifactPaths.size} public OpenAPI paths checked`
}

const checkPublicServiceExamples = (): string => {
  let count = 0
  for (const route of Object.values(SERVICE_API_ROUTES)) {
    if (route.privacyClass !== "public") {
      continue
    }
    for (const example of route.examples) {
      route.response.parse(example)
      assertMonitorPublicPayload(example)
      count += 1
    }
  }
  return `${count} public route examples checked`
}

const checkGoFixtures = (): string => {
  for (const file of [
    "health.json",
    "public-match-set-summary.json",
    "degraded-match-set-summary.json",
    "public-replay-metadata.json",
    "public-strategy-page.json",
    "not-found-error.json",
    "forbidden-error.json",
  ]) {
    assertMonitorPublicPayload(readJson(`${goFixtureDir}/${file}`))
  }

  const analytics = readJson<{ summary: unknown }>(
    `${goFixtureDir}/analytics-run-summary.json`,
  )
  assertMonitorPublicPayload(analytics)
  assertAnalyticsPublicSummaryLeakSafe(analytics.summary)
  return "Go public and owner-summary fixtures checked"
}

const checkGoRouteManifest = (): string => {
  const manifest = readJson<GoRouteManifestEntry[]>(
    `${goFixtureDir}/route-manifest.json`,
  )
  const expectedRouteIds = new Set([
    "health",
    "getPublicMatchSetSummary",
    "getPublicReplayMetadata",
    "getPublicStrategyPage",
    "getAnalyticsRunSummary",
  ])
  const manifestRouteIds = new Set(manifest.map((entry) => entry.id))
  for (const expectedRouteId of expectedRouteIds) {
    if (!manifestRouteIds.has(expectedRouteId)) {
      throw new Error(`Go route manifest missing ${expectedRouteId}`)
    }
  }
  for (const entry of manifest) {
    if (!expectedRouteIds.has(entry.id)) {
      throw new Error(`Go route manifest contains unexpected route ${entry.id}`)
    }
    if (entry.method !== "GET") {
      throw new Error(`Go route ${entry.id} is not read-only: ${entry.method}`)
    }
    const route =
      SERVICE_API_ROUTES[entry.id as keyof typeof SERVICE_API_ROUTES]
    if (!route) {
      throw new Error(`Go route ${entry.id} is not in SERVICE_API_ROUTES`)
    }
    for (const key of [
      "method",
      "path",
      "authScope",
      "privacyClass",
    ] as const) {
      if (entry[key] !== route[key]) {
        throw new Error(`Go route ${entry.id} ${key} drifted`)
      }
    }
    if (entry.authScope === "owner" && entry.requiresBearerToken !== true) {
      throw new Error(`Go owner route ${entry.id} must require bearer token`)
    }
  }
  return `${manifest.length} Go route manifest entries checked`
}

const checkGoPromotionOwnershipManifest = (): string => {
  const manifest = readJson<GoPromotionRouteOwnershipManifest>(
    goPromotionManifestPath,
  )
  if (manifest.milestone !== "v1.12") {
    throw new Error(
      `promotion manifest milestone drifted to ${manifest.milestone}`,
    )
  }
  const selected = manifest.routes.filter((entry) => entry.selectedCandidate)
  if (selected.length > 1) {
    throw new Error("promotion manifest selects more than one route")
  }
  if (
    selected.length === 1 &&
    selected[0]?.routeId !== "getPublicStrategyPage"
  ) {
    throw new Error(`unexpected selected route ${selected[0]?.routeId}`)
  }
  if (
    manifest.decision === "promote-one-route" &&
    manifest.selectedRouteId !== "getPublicStrategyPage"
  ) {
    throw new Error("promote-one-route must select getPublicStrategyPage")
  }
  for (const entry of manifest.routes) {
    if (entry.method !== "GET") {
      throw new Error(`promotion route ${entry.routeId} is not GET`)
    }
    if (entry.privacyClass !== "public" && entry.privacyClass !== "owner") {
      throw new Error(`promotion route ${entry.routeId} privacy drifted`)
    }
    if (entry.fallbackPolicy !== "no_fallback_when_go_selected") {
      throw new Error(
        `promotion route ${entry.routeId} fallback policy drifted`,
      )
    }
    if (entry.rollbackOwner !== "typescript_service") {
      throw new Error(`promotion route ${entry.routeId} rollback owner drifted`)
    }
    assertMonitorPublicPayload({
      routeId: entry.routeId,
      method: entry.method,
      path: entry.path,
      currentOwner: entry.currentOwner,
      promotionStatus: entry.promotionStatus,
      blockedReasons: entry.blockedReasons,
      disallowedScopes: entry.disallowedScopes,
    })
  }
  return `${manifest.routes.length} route ownership entries checked; decision=${manifest.decision}`
}

const checkV113RouteOwnershipManifest = (): string => {
  const manifest = readJson<V113RouteOwnershipManifest>(
    v113RouteOwnershipManifestPath,
  )
  if (manifest.schemaVersion !== "v1.13-route-ownership-manifest") {
    throw new Error("v1.13 ownership manifest schema version drifted")
  }
  if (manifest.milestone !== "v1.13") {
    throw new Error(`v1.13 manifest milestone drifted to ${manifest.milestone}`)
  }
  if (manifest.decision !== "aggressive-go-backend-cutover") {
    throw new Error("v1.13 manifest decision drifted")
  }
  if (
    manifest.typeScriptRole !== "parity_oracle_and_explicit_rollback_reference"
  ) {
    throw new Error("v1.13 TypeScript role drifted")
  }

  const allowedStates = new Set(manifest.allowedPromotionStates)
  for (const state of [
    "go_primary",
    "typescript_primary",
    "typescript_reference",
    "worker_owned",
    "deferred",
    "blocked",
    "rolled_back",
    "evidence_only",
  ]) {
    if (!allowedStates.has(state)) {
      throw new Error(`v1.13 manifest missing allowed state ${state}`)
    }
  }

  const requiredRouteIds = new Set([
    "getPublicStrategyPage",
    "getPublicPlayerPage",
    "getPublicLadderSeason",
    "getPublicMatchSetSummary",
    "getPublicReplayMetadata",
    "authSession",
    "createSession",
    "signUp",
    "revokeSession",
    "listStrategyRevisions",
    "getStrategyRevisionSource",
    "createStrategyRevision",
    "forkStarterStrategy",
    "forkAdvancedStrategy",
    "createMatchSet",
    "workerRuntime",
    "goOwnedMigrations",
  ])
  const routeIds = new Set(manifest.routes.map((entry) => entry.routeId))
  for (const routeId of requiredRouteIds) {
    if (!routeIds.has(routeId)) {
      throw new Error(`v1.13 ownership manifest missing ${routeId}`)
    }
  }

  for (const entry of manifest.routes) {
    if (!allowedStates.has(entry.promotionStatus)) {
      throw new Error(`${entry.routeId} has invalid promotion status`)
    }
    if (
      entry.selectedOwner === "go_backend" &&
      entry.promotionStatus === "typescript_primary"
    ) {
      throw new Error(
        `${entry.routeId} cannot select Go while remaining TypeScript-primary`,
      )
    }
    if (
      entry.promotionStatus === "blocked" &&
      entry.blockedReasons.length === 0
    ) {
      throw new Error(`${entry.routeId} blocked status requires blockers`)
    }
    if (
      entry.routeFamily !== "worker_runtime" &&
      entry.routeFamily !== "deferred" &&
      entry.fallbackPolicy !== "no_fallback_when_go_selected"
    ) {
      throw new Error(`${entry.routeId} fallback policy drifted`)
    }
    if (
      entry.routeFamily !== "worker_runtime" &&
      entry.routeFamily !== "deferred" &&
      entry.selectedOwner !== "go_backend"
    ) {
      throw new Error(`${entry.routeId} selected owner must be Go`)
    }
    if (
      entry.routeFamily === "worker_runtime" &&
      entry.promotionStatus !== "worker_owned"
    ) {
      throw new Error(`${entry.routeId} must remain worker-owned`)
    }
    if (
      entry.routeFamily === "deferred" &&
      entry.promotionStatus !== "deferred"
    ) {
      throw new Error(`${entry.routeId} must remain deferred`)
    }
    if (entry.evidenceRequired.length === 0) {
      throw new Error(`${entry.routeId} missing evidence requirements`)
    }
    if (entry.disallowedScopes.length === 0) {
      throw new Error(`${entry.routeId} missing disallowed scopes`)
    }
  }
  return `${manifest.routes.length} v1.13 ownership entries checked`
}

const checkV114RouteOwnershipManifest = (): string => {
  const manifest = readJson<V113RouteOwnershipManifest>(
    v114RouteOwnershipManifestPath,
  )
  if (manifest.schemaVersion !== "v1.14-route-ownership-manifest") {
    throw new Error("v1.14 ownership manifest schema version drifted")
  }
  if (manifest.milestone !== "v1.14") {
    throw new Error(`v1.14 manifest milestone drifted to ${manifest.milestone}`)
  }
  if (manifest.decision !== "artifact-backed-go-forks-with-runtime-boundary") {
    throw new Error("v1.14 manifest decision drifted")
  }
  if (
    manifest.typeScriptRole !==
    "parity_oracle_and_strategy_runtime_worker_until_later_migration"
  ) {
    throw new Error("v1.14 TypeScript role drifted")
  }
  if (manifest.runtimeBoundary?.abiVersion !== STRATEGY_RUNTIME_ABI_VERSION) {
    throw new Error("v1.14 runtime boundary ABI drifted")
  }
  if (
    manifest.runtimeBoundary?.explicitNonGoals.some((goal) =>
      /Go executes Strategy code|Node vm/.test(goal),
    ) !== true
  ) {
    throw new Error("v1.14 runtime boundary non-goals drifted")
  }
  if (
    manifest.strategyArtifacts?.schemaVersion !==
      "strategy-artifact-manifest-v1.14" ||
    manifest.strategyArtifacts.artifactCount !== 23 ||
    manifest.strategyArtifacts.goConsumptionMode !== "data_only_no_execution"
  ) {
    throw new Error("v1.14 Strategy Artifact manifest metadata drifted")
  }
  const forkRoutes = manifest.routes.filter(
    (entry) =>
      entry.routeId === "forkStarterStrategy" ||
      entry.routeId === "forkAdvancedStrategy",
  )
  if (forkRoutes.length !== 2) {
    throw new Error("v1.14 fork route ownership entries missing")
  }
  const allowedStates = new Set(manifest.allowedPromotionStates)
  for (const entry of manifest.routes) {
    if (!allowedStates.has(entry.promotionStatus)) {
      throw new Error(`${entry.routeId} has invalid v1.14 promotion status`)
    }
    if (
      entry.routeFamily !== "worker_runtime" &&
      entry.routeFamily !== "deferred" &&
      entry.selectedOwner !== "go_backend"
    ) {
      throw new Error(`${entry.routeId} selected owner must remain Go in v1.14`)
    }
    if (
      entry.routeFamily !== "worker_runtime" &&
      entry.routeFamily !== "deferred" &&
      entry.fallbackPolicy !== "no_fallback_when_go_selected"
    ) {
      throw new Error(`${entry.routeId} v1.14 fallback policy drifted`)
    }
    if (
      entry.promotionStatus === "blocked" &&
      entry.blockedReasons.length === 0
    ) {
      throw new Error(`${entry.routeId} blocked status requires blockers`)
    }
    if (entry.evidenceRequired.length === 0) {
      throw new Error(`${entry.routeId} missing v1.14 evidence requirements`)
    }
    if (entry.disallowedScopes.length === 0) {
      throw new Error(`${entry.routeId} missing v1.14 disallowed scopes`)
    }
  }
  for (const entry of forkRoutes) {
    if (
      entry.routeFamily !== "artifact_fork" ||
      entry.selectedOwner !== "go_backend" ||
      entry.promotionStatus !== "go_primary" ||
      entry.blockedReasons.length !== 0 ||
      entry.fallbackPolicy !== "no_fallback_when_go_selected"
    ) {
      throw new Error(`${entry.routeId} v1.14 ownership metadata drifted`)
    }
    for (const scope of [
      "strategy_execution",
      "node_vm_sandbox",
      "runtime_in_web_or_go_process",
      "owner_private_account_source",
    ]) {
      if (!entry.disallowedScopes.includes(scope)) {
        throw new Error(`${entry.routeId} missing disallowed scope ${scope}`)
      }
    }
  }
  return `${manifest.routes.length} v1.14 ownership entries checked; fork routes promoted`
}

export const checkRuntimeAdapterBridge = (
  bridge: RuntimeAdapterBridge,
): string => {
  const runtime = createWorkerRuntimeConfig({
    strategyExecutionAdapter: bridge.selector,
  })
  const spec = getStrategyRuntimeAdapterRecord(bridge.specAdapterId)
  if (!spec) {
    throw new Error(`missing spec adapter ${bridge.specAdapterId}`)
  }
  if (spec.readiness !== runtime.metadata.productionReadiness) {
    throw new Error(`${bridge.selector} readiness drifted`)
  }
  if (
    spec.limits.environment !== runtime.metadata.runtimeControls.environment
  ) {
    throw new Error(`${bridge.selector} environment limit drifted`)
  }
  if (spec.limits.filesystem !== runtime.metadata.runtimeControls.filesystem) {
    throw new Error(`${bridge.selector} filesystem limit drifted`)
  }
  if (spec.limits.network !== runtime.metadata.runtimeControls.network) {
    throw new Error(`${bridge.selector} network limit drifted`)
  }
  if (spec.limits.shell !== runtime.metadata.runtimeControls.shell) {
    throw new Error(`${bridge.selector} shell limit drifted`)
  }
  if (spec.version !== COMPATIBILITY_VERSIONS.runtimeJs) {
    throw new Error(`${bridge.specAdapterId} version drifted`)
  }
  if (spec.limits.timeoutMs !== 1_000) {
    throw new Error(`${bridge.specAdapterId} timeout limit drifted`)
  }
  if (spec.limits.stdoutBytes !== 256 * 1024) {
    throw new Error(`${bridge.specAdapterId} stdout limit drifted`)
  }
  if (spec.limits.stderrBytes !== 64 * 1024) {
    throw new Error(`${bridge.specAdapterId} stderr limit drifted`)
  }
  if (spec.limits.sourceBytes !== 64 * 1024) {
    throw new Error(`${bridge.specAdapterId} source limit drifted`)
  }
  const isContainerCandidate =
    bridge.specAdapterId === "runtime-js-container-subprocess"
  if (!isContainerCandidate && spec.enabledForNormalPlay !== true) {
    throw new Error(`${bridge.specAdapterId} unexpectedly disabled for JS/TS`)
  }
  if (!isContainerCandidate && spec.countedResultsAllowed !== true) {
    throw new Error(
      `${bridge.specAdapterId} unexpectedly blocked for counted JS/TS`,
    )
  }
  if (
    isContainerCandidate &&
    (spec.enabledForNormalPlay || spec.countedResultsAllowed)
  ) {
    throw new Error(
      "container runtime must remain non-counted until promotion criteria are satisfied",
    )
  }
  if (spec.isolationPromotionState !== "evidence-only") {
    throw new Error(`${bridge.specAdapterId} isolation promotion state drifted`)
  }
  if (
    bridge.specAdapterId === "runtime-js-container-subprocess" &&
    !spec.isolationPromotionCriteria.includes("required-container-probes")
  ) {
    throw new Error("container runtime missing required probe criteria")
  }
  if (!runtime.metadata.runtimeControls.timeout) {
    throw new Error(`${bridge.selector} must expose timeout controls`)
  }
  const metadata = {
    abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
    language: { id: "typescript", version: spec.version },
    adapter: { id: spec.id, version: spec.version },
    package: { mode: "none", entrypoint: "default" },
    requiredCapabilities: [],
    limits: spec.limits,
  } as const
  const semantics = describeStrategyRuntimeProductSemantics(metadata)
  const eligibility = evaluateStrategyRuntimeCountedEligibility(metadata)
  if (isContainerCandidate) {
    if (eligibility.ok || semantics.countedPlayEligible) {
      throw new Error(
        "container runtime product semantics must remain non-counted",
      )
    }
  } else if (!eligibility.ok || !semantics.countedPlayEligible) {
    throw new Error(`${bridge.specAdapterId} product semantics drifted`)
  }
  return `${bridge.selector} -> ${bridge.specAdapterId}`
}

const checkRuntimeAdapters = (): string => {
  for (const bridge of runtimeAdapterBridges) {
    checkRuntimeAdapterBridge(bridge)
  }
  const python = getStrategyRuntimeAdapterRecord(
    "runtime-python-subprocess-experimental",
  )
  if (!python || python.countedResultsAllowed || python.enabledForNormalPlay) {
    throw new Error("Python runtime must remain experimental and non-counted")
  }
  if (python.isolationPromotionState !== "evidence-only") {
    throw new Error(
      "Python runtime isolation promotion state must stay blocked",
    )
  }
  const pythonMetadata = {
    abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
    language: { id: "python", version: "3.9" },
    adapter: { id: python.id, version: python.version },
    package: { mode: "none", entrypoint: "default" },
    requiredCapabilities: [],
    limits: python.limits,
  } as const
  const pythonSemantics =
    describeStrategyRuntimeProductSemantics(pythonMetadata)
  const pythonEligibility =
    evaluateStrategyRuntimeCountedEligibility(pythonMetadata)
  if (pythonEligibility.ok || pythonSemantics.countedPlayEligible) {
    throw new Error("Python runtime product semantics must remain non-counted")
  }
  if (STRATEGY_RUNTIME_ABI_VERSION !== "strategy-runtime-abi-v1.14") {
    throw new Error(`runtime ABI drifted to ${STRATEGY_RUNTIME_ABI_VERSION}`)
  }
  return `${runtimeAdapterBridges.length} JS/TS adapters and Python experimental gate checked`
}

const checkNonJsRuntimeGuardrails = (): string => {
  assertNonJsRuntimeGuardrails()
  if (NON_JS_RUNTIME_SUPPORT_POLICY.publicLanguagePickerAllowed !== false) {
    throw new Error("public non-JS language picker must remain disabled")
  }
  return `${NON_JS_RUNTIME_PROMOTION_CRITERIA.length} non-JS promotion criteria checked; experimental languages=${NON_JS_RUNTIME_SUPPORT_POLICY.experimentalLanguageIds.join(",")}`
}

const checkRuntimeIsolationReadiness = (): string => {
  const report = readJson<SandboxEvaluationReport>(
    sandboxEvaluationArtifactPath,
  )
  assertSandboxEvaluationPublicSafe(report)
  assertRuntimeIsolationReadinessGuardrails(report)
  const container = report.candidates.find(
    (candidate) => candidate.id === "container-subprocess",
  )
  if (!container) {
    throw new Error(
      "container subprocess candidate missing from sandbox report",
    )
  }
  if (container.status === "passed") {
    return `${report.runtimeIsolationReadiness.criteria.length} runtime isolation criteria checked with live container evidence`
  }
  if (container.status !== "skipped") {
    throw new Error(
      `container subprocess candidate has unexpected status ${container.status}`,
    )
  }
  return `${report.runtimeIsolationReadiness.criteria.length} runtime isolation criteria checked; container evidence remains required before promotion`
}

const checkWebBoundary = (): string => {
  const analysis = analyzeServiceBoundaryImports({ repoRoot })
  if (analysis.strictOffenses.length > 0) {
    throw new Error(
      `strict web boundary offenses: ${analysis.strictOffenses.map(offenseKey).join(", ")}`,
    )
  }
  const unknown = findUnknownReportOnlyOffenses(analysis.reportOnlyOffenses)
  if (unknown.length > 0) {
    throw new Error(
      `unknown broad web boundary offenses: ${unknown.join(", ")}`,
    )
  }
  return `${analysis.reportOnlyOffenses.length} known broad web offenses baseline-gated`
}

const checkTopologyDiagnostics = async (): Promise<string> => {
  const checks = await evaluateLocalTopology({
    webUrl: null,
    goUrl: null,
    requireWeb: false,
    requireGo: false,
    requireWebGoPublicStrategyRead: false,
    requireRuntimeContainer: false,
    json: false,
  })
  assertMonitorPublicPayload(checks)
  const failures = checks.filter((item) => !item.ok)
  if (failures.length > 0) {
    throw new Error(
      `static topology checks failed: ${failures.map((item) => item.name).join(", ")}`,
    )
  }
  return `${checks.length} topology diagnostics checked`
}

export const runBoundaryMonitorChecks = async (): Promise<
  BoundaryMonitorCheck[]
> => [
  await check("contract_drift", "OpenAPI public route artifact", () =>
    checkOpenApiContract(),
  ),
  await check("privacy", "public service route examples", () =>
    checkPublicServiceExamples(),
  ),
  await check("privacy", "Go service fixtures", () => checkGoFixtures()),
  await check("web_boundary", "web import drift baseline", () =>
    checkWebBoundary(),
  ),
  await check("runtime_adapter", "runtime registry and adapter metadata", () =>
    checkRuntimeAdapters(),
  ),
  await check(
    "runtime_isolation",
    "runtime isolation readiness guardrails",
    () => checkRuntimeIsolationReadiness(),
  ),
  await check("non_js_runtime", "experimental non-JS guardrails", () =>
    checkNonJsRuntimeGuardrails(),
  ),
  await check("go_parity", "Go route manifest metadata", () =>
    checkGoRouteManifest(),
  ),
  await check("go_promotion", "v1.12 route ownership manifest", () =>
    checkGoPromotionOwnershipManifest(),
  ),
  await check("go_promotion", "v1.13 route ownership manifest", () =>
    checkV113RouteOwnershipManifest(),
  ),
  await check("go_promotion", "v1.14 route ownership manifest", () =>
    checkV114RouteOwnershipManifest(),
  ),
  await check("topology", "static topology diagnostics", () =>
    checkTopologyDiagnostics(),
  ),
]

const run = async (): Promise<number> => {
  const checks = await runBoundaryMonitorChecks()
  console.log("Coward's Game v1.8 boundary monitors")
  for (const result of checks) {
    console.log(
      `[${result.ok ? "PASS" : "FAIL"}] [${result.layer}] ${result.name}: ${result.detail}`,
    )
  }
  return checks.every((result) => result.ok) ? 0 : 1
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run()
    .then((code) => {
      process.exitCode = code
    })
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : String(error))
      process.exitCode = 1
    })
}
