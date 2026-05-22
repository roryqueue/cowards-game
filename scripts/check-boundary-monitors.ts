#!/usr/bin/env -S pnpm exec tsx
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createWorkerRuntimeConfig } from "../apps/worker/src/runtime-config.ts"
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
  assertPublicServiceDtoLeakSafe,
  describeStrategyRuntimeProductSemantics,
  evaluateStrategyRuntimeCountedEligibility,
  getStrategyRuntimeAdapterRecord,
  type StrategyRuntimeAdapterId,
} from "../packages/spec/src/index.ts"

type MonitorLayer =
  | "contract_drift"
  | "privacy"
  | "web_boundary"
  | "runtime_adapter"
  | "go_parity"
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

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

const openApiArtifactPath =
  "packages/spec/artifacts/service-api-v1.8.openapi.json"
const goFixtureDir = "apps/go-backend/testdata/service-fixtures"

export const knownReportOnlyBoundaryOffenses = new Set([
  'apps/web/app/account/page.tsx:1:competitive/server:import { competitiveServer, getCurrentCompetitiveUser, } from "../competitive/server.js"',
  'apps/web/app/api/account/advanced-forks/route.ts:1:competitive/server:import { competitiveServer, getCurrentCompetitiveUser, } from "../../../competitive/server.js"',
  'apps/web/app/api/account/revisions/[revisionId]/source/route.ts:2:competitive/server:import { competitiveServer, getCurrentCompetitiveUser, } from "../../../../../competitive/server.js"',
  'apps/web/app/api/account/revisions/route.ts:2:competitive/server:import { competitiveServer, getCurrentCompetitiveUser, } from "../../../competitive/server.js"',
  'apps/web/app/api/account/starter-forks/route.ts:1:competitive/server:import { competitiveServer, getCurrentCompetitiveUser, } from "../../../competitive/server.js"',
  'apps/web/app/api/admin/matchsets/[matchSetId]/governance/route.ts:1:competitive/server:import { competitiveServer, getCurrentCompetitiveUser, } from "../../../../../competitive/server.js"',
  'apps/web/app/api/auth/session/route.ts:1:competitive/server:import { competitiveServer, getSessionIdFromCookies, } from "../../../competitive/server.js"',
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
  'apps/web/app/competitive/server.ts:28:@cowards/persistence:import { buildTrialLadderSeasonDto, createTrialLadderSeason, enterTrialLadderSeason, LadderInputError, scheduleTrialLadderSeason, setTrialLadderSeasonStatus, withdrawTrialLadderEntry, } from "@cowards/persistence/ladder"',
  'apps/web/app/competitive/server.ts:37:@cowards/persistence:import { assertAdminUser, flagMatchSetResult, GovernanceInputError, markMatchSetGovernanceStatus, } from "@cowards/persistence/governance"',
  'apps/web/app/competitive/server.ts:43:@cowards/persistence:import { buildPublicPlayerProfileDto } from "@cowards/persistence/profiles"',
  'apps/web/app/competitive/server.ts:44:@cowards/persistence:import { findAdvancedStrategy } from "@cowards/persistence/advanced-strategies"',
  'apps/web/app/competitive/server.ts:45:@cowards/persistence:import { findStarterStrategy } from "@cowards/persistence/starter-strategies"',
  'apps/web/app/exhibitions/new/exhibition-client.tsx:4:competitive/server:import type { CompetitivePresetSummary, CompetitiveRevisionSummary, } from "../../competitive/server.js"',
  'apps/web/app/exhibitions/new/page.tsx:1:competitive/server:import { competitiveServer, getCurrentCompetitiveUser, } from "../../competitive/server.js"',
  'apps/web/app/ladder/[seasonId]/page.tsx:1:competitive/server:import { competitiveServer, getCurrentCompetitiveUser, } from "../../competitive/server.js"',
  'apps/web/app/matches/replay-fixture.ts:6:@cowards/persistence:import { createChronicleMetadata } from "@cowards/persistence/chronicle-store"',
  'apps/web/app/matches/replay-ready.ts:7:@cowards/persistence:import type { StoredChronicle } from "@cowards/persistence/chronicle-store"',
  'apps/web/app/matches/server.test.ts:6:@cowards/persistence:import { createChronicleMetadata, type StoredChronicle, } from "@cowards/persistence"',
  'apps/web/app/matches/server.ts:1:@cowards/persistence:import { createDatabasePool } from "@cowards/persistence/db"',
  'apps/web/app/matches/server.ts:2:@cowards/persistence:import { createPostgresChronicleStore, type ChronicleStore, } from "@cowards/persistence/chronicle-store"',
  'apps/web/app/matches/server.ts:6:@cowards/persistence:import type { Queryable } from "@cowards/persistence/repositories"',
  'apps/web/app/players/[handle]/page.tsx:1:competitive/server:import { competitiveServer } from "../../competitive/server.js"',
  'apps/web/app/workshop/evidence/evidence-state.test.ts:1:@cowards/persistence:import { createWorkshopAnalyticsDemoSnapshot } from "@cowards/persistence/workshop-analytics"',
  'apps/web/app/workshop/heatmap-state.test.ts:1:@cowards/persistence:import { createWorkshopAnalyticsDemoSnapshot } from "@cowards/persistence/workshop-analytics"',
  'apps/web/app/workshop/server.ts:1:@cowards/persistence:import { createDatabasePool } from "@cowards/persistence/db"',
  'apps/web/app/workshop/server.ts:2:@cowards/persistence:import { buildWorkshopRevision, createWorkshopTestMatchSet, getWorkshopRevisionSource, getWorkshopSnapshot, getWorkshopStaticSnapshot, getWorkshopTestSummary, insertWorkshopRevision, type WorkshopTestSummary, validateWorkshopSource, WORKSHOP_STRATEGY_ID, } from "@cowards/persistence/workshop"',
  'apps/web/app/workshop/server.ts:14:@cowards/persistence:import { comparePersistedWorkshopAnalyticsRuns, createWorkshopAnalyticsDemoSnapshot, createWorkshopAnalyticsExport, createPersistedWorkshopAnalyticsRerun, getWorkshopAnalyticsSnapshot, seedWorkshopAnalyticsDemo, } from "@cowards/persistence/workshop-analytics"',
  'apps/web/app/workshop/types.ts:6:@cowards/persistence:import type { WorkshopAnalyticsSnapshot } from "@cowards/persistence/workshop-analytics"',
  'apps/web/app/workshop/types.ts:7:@cowards/persistence:import type { WorkshopOpponentSummary, WorkshopPresetSummary, WorkshopRevisionSummary, WorkshopSnapshot, WorkshopSampleSummary, WorkshopTemplateSummary, WorkshopTestSummary, } from "@cowards/persistence/workshop"',
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
  if (
    spec.enabledForNormalPlay !== true ||
    spec.countedResultsAllowed !== true
  ) {
    throw new Error(`${bridge.specAdapterId} unexpectedly disabled for JS/TS`)
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
  if (!eligibility.ok || !semantics.countedPlayEligible) {
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
  if (STRATEGY_RUNTIME_ABI_VERSION !== "strategy-runtime-abi-v1.7") {
    throw new Error(`runtime ABI drifted to ${STRATEGY_RUNTIME_ABI_VERSION}`)
  }
  return `${runtimeAdapterBridges.length} JS/TS adapters and Python experimental gate checked`
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
  await check("go_parity", "Go route manifest metadata", () =>
    checkGoRouteManifest(),
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
