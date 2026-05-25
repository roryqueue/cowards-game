#!/usr/bin/env -S pnpm exec tsx
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
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
import {
  evaluateLocalTopology,
  parseTopologyOptions,
  validateV116NoTypeScriptBackendTopologyArtifact,
} from "./check-local-topology.ts"

export { validateV116NoTypeScriptBackendTopologyArtifact }
import {
  SERVICE_API_ROUTES,
  STRATEGY_RUNTIME_ABI_VERSION,
  RUNTIME_EXECUTION_SERVICE_VERSION,
  COMPATIBILITY_VERSIONS,
  assertAnalyticsPublicSummaryLeakSafe,
  assertPublicOutputLeakSafe,
  assertNonJsRuntimeGuardrails,
  assertPublicServiceDtoLeakSafe,
  describeStrategyRuntimeProductSemantics,
  evaluateStrategyRuntimeCountedEligibility,
  getStrategyRuntimeAdapterRecord,
  NON_JS_RUNTIME_PROMOTION_CRITERIA,
  NON_JS_RUNTIME_SUPPORT_POLICY,
  RUNTIME_BROKER_REGISTRY,
  RUNTIME_BROKER_REGISTRY_VERSION,
  validateRuntimeBrokerRegistryMatch,
  type StrategyRuntimeAdapterId,
} from "../packages/spec/src/index.ts"

type MonitorLayer =
  | "contract_drift"
  | "privacy"
  | "web_boundary"
  | "runtime_adapter"
  | "runtime_isolation"
  | "worker_quarantine"
  | "surface_labels"
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

export interface SelectedGoRouteManifestEntry {
  routeId: string
  routeFamily:
    | "health"
    | "auth_session"
    | "account_revision"
    | "account_fork"
    | "exhibition"
    | "public_read"
    | "public_replay"
  method: "GET" | "POST" | "DELETE"
  goPath: string
  nextPath: string
  authScope: "public" | "session" | "owner"
  privacyClass: "public" | "session" | "owner-private-source"
  selectedNormal: boolean
  fallbackPolicy: "no_typescript_backend_fallback"
  stoppedGoBehavior: "fail_closed_classified"
  nonNormalClassification: "selected-normal" | "frontend-health"
}

export interface SelectedGoRouteManifest {
  schemaVersion: "v1.16-selected-go-route-manifest"
  milestone: "v1.16"
  fallbackPolicy: "no_typescript_backend_fallback"
  routes: readonly SelectedGoRouteManifestEntry[]
  explicitlyOutOfScope: readonly string[]
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

type V115TypeScriptRole =
  | "frontend"
  | "parity_only"
  | "rollback_only"
  | "test_only"
  | "runtime_only"
  | "deferred"

interface V115LifecycleSurface {
  surfaceId: string
  surfaceKind: string
  capability: string
  currentOwner: string
  selectedOwner: string
  typeScriptRole: V115TypeScriptRole
  fallbackPolicy: string
  rollbackOwner: string
  stoppedGoBehavior: string
  stoppedRuntimeBehavior: string
  codeReferences: readonly string[]
  evidenceRequired: readonly string[]
  disallowedScopes: readonly string[]
}

interface V115LifecycleOwnershipManifest {
  schemaVersion: "v1.15-lifecycle-ownership-manifest"
  milestone: "v1.15"
  decision: "go-backend-lifecycle-ownership-completion"
  typeScriptRole: string
  allowedTypeScriptRoles: readonly V115TypeScriptRole[]
  monitorBaseline: {
    strictOffenses: number
    reportOnlyOffenses: number
    source: string
  }
  globalPolicies: {
    fallbackPolicy: string
    mixedDbCompletingOwnersAllowed: boolean
    runtimeAbiVersion: string
    goExecutesStrategyCode: boolean
    nodeVmSecurityBoundaryAllowed: boolean
    productionSandboxPromotionInScope: boolean
    typescriptRuntimeRetirementInScope: boolean
  }
  publicOutputForbiddenByDefault: readonly string[]
  surfaces: readonly V115LifecycleSurface[]
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
const sandboxEvaluationContainerArtifactPath =
  ".planning/artifacts/runtime-sandbox-evaluation.container.json"
const v120ReadinessArtifactPath =
  ".planning/artifacts/v1.20-runtime-sandbox-candidate-readiness.json"
const v120ReadinessMarkdownPath =
  ".planning/artifacts/v1.20-runtime-sandbox-candidate-readiness.md"
const v120ContainerReadinessArtifactPath =
  ".planning/artifacts/v1.20-runtime-sandbox-candidate-readiness.container.json"
const v120BudgetArtifactPath =
  ".planning/artifacts/v1.20-runtime-reliability-budgets.json"
const v120BudgetMarkdownPath =
  ".planning/artifacts/v1.20-runtime-reliability-budgets.md"
const v120RetryArtifactPath =
  ".planning/artifacts/v1.20-exhibition-reliability-retry-semantics.json"
const v120RetryMarkdownPath =
  ".planning/artifacts/v1.20-exhibition-reliability-retry-semantics.md"
const v120HostileProbeArtifactPath =
  ".planning/artifacts/v1.20-hostile-probe-no-fallback-evidence.json"
const v120HostileProbeMarkdownPath =
  ".planning/artifacts/v1.20-hostile-probe-no-fallback-evidence.md"
const v120ContainerHostileProbeArtifactPath =
  ".planning/artifacts/v1.20-hostile-probe-no-fallback-evidence.container.json"
const v120SignedInReliabilityProofArtifactPath =
  ".planning/artifacts/v1.20-signed-in-reliability-proof.json"
const v120SignedInReliabilityProofMarkdownPath =
  ".planning/artifacts/v1.20-signed-in-reliability-proof.md"
const goPromotionManifestPath =
  ".planning/artifacts/v1.12-route-ownership-manifest.json"
const v113RouteOwnershipManifestPath =
  ".planning/artifacts/v1.13-route-ownership-manifest.json"
const v114RouteOwnershipManifestPath =
  ".planning/artifacts/v1.14-route-ownership-manifest.json"
const v115LifecycleOwnershipManifestPath =
  ".planning/artifacts/v1.15-lifecycle-ownership-manifest.json"
const v116RuntimeServiceBoundaryArtifactPath =
  ".planning/artifacts/v1.16-runtime-service-boundary.json"
const v116SelectedGoRouteManifestPath =
  ".planning/artifacts/v1.16-selected-go-route-manifest.json"
const v116TypeScriptWorkerQuarantineArtifactPath =
  ".planning/artifacts/v1.16-typescript-worker-quarantine.json"
const v116FinalTypeScriptSurfaceLabelsPath =
  ".planning/artifacts/v1.16-final-typescript-surface-labels.json"
const v116TypeScriptBackendInventoryPath =
  ".planning/artifacts/v1.16-typescript-backend-inventory.json"
const v117RuntimeBrokerRegistryArtifactPath =
  ".planning/artifacts/v1.17-runtime-broker-registry.json"

export const knownReportOnlyBoundaryOffenses = new Set([
  'apps/web/app/api/admin/matchsets/[matchSetId]/governance/route.ts:1:competitive/server:import { competitiveServer, getCurrentCompetitiveUser, } from "../../../../../competitive/server.js"',
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
  'apps/web/app/matches/replay-fixture.ts:6:@cowards/persistence:import { createChronicleMetadata } from "@cowards/persistence/quarantine-lifecycle"',
  'apps/web/app/matches/replay-ready.ts:7:@cowards/persistence:import type { StoredChronicle } from "@cowards/persistence/quarantine-lifecycle"',
  'apps/web/app/matches/server.test.ts:7:@cowards/persistence:import { createChronicleMetadata, type StoredChronicle, } from "@cowards/persistence/quarantine-lifecycle"',
  'apps/web/app/matches/server.ts:1:@cowards/persistence:import { createDatabasePool } from "@cowards/persistence/db"',
  'apps/web/app/matches/server.ts:2:@cowards/persistence:import { createPostgresChronicleStore, type ChronicleMetadata, type ChronicleStore, } from "@cowards/persistence/quarantine-lifecycle"',
  'apps/web/app/matches/server.ts:7:@cowards/persistence:import type { Queryable } from "@cowards/persistence/repositories"',
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

const forbiddenWorkerArtifactStrings = [
  ...forbiddenPublicArtifactStrings,
  "strategySource",
  "strategy_source",
  "Strategy source",
  "StrategyMemory",
  "SoldierMemory",
  "objective_payload",
  "rawAwarenessGrid",
  "owner debug",
  "owner_debug",
  "database_url",
  "databaseUrl",
  "DATABASE_URL",
  "postgres://",
  "postgresql://",
  "dsn",
  "stack",
  "source",
  "sourceText",
  "source text",
  "session",
  "accessToken",
  "token",
  "dbDsn",
  "DB DSN",
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

export const selectedGoRouteManifest: SelectedGoRouteManifest = {
  schemaVersion: "v1.16-selected-go-route-manifest",
  milestone: "v1.16",
  fallbackPolicy: "no_typescript_backend_fallback",
  explicitlyOutOfScope: [
    "Workshop validation, submission, source, test, analytics, export, and runtime flows",
    "broader ladder scheduling and mutation routes",
    "governance and admin routes",
    "owner-debug/private Chronicle migration",
    "test-support routes and fixture generators",
    "rollback and parity paths",
    "migrations and schema ownership",
    "runtime service replacement or Runtime Broker implementation",
  ],
  routes: [
    {
      routeId: "health",
      routeFamily: "health",
      method: "GET",
      goPath: "/health",
      nextPath: "/api/service/health",
      authScope: "public",
      privacyClass: "public",
      selectedNormal: true,
      fallbackPolicy: "no_typescript_backend_fallback",
      stoppedGoBehavior: "fail_closed_classified",
      nonNormalClassification: "frontend-health",
    },
    {
      routeId: "authSession",
      routeFamily: "auth_session",
      method: "GET",
      goPath: "/auth/session",
      nextPath: "/api/auth/session",
      authScope: "session",
      privacyClass: "session",
      selectedNormal: true,
      fallbackPolicy: "no_typescript_backend_fallback",
      stoppedGoBehavior: "fail_closed_classified",
      nonNormalClassification: "selected-normal",
    },
    {
      routeId: "createSession",
      routeFamily: "auth_session",
      method: "POST",
      goPath: "/auth/session",
      nextPath: "/api/auth/sign-in",
      authScope: "public",
      privacyClass: "session",
      selectedNormal: true,
      fallbackPolicy: "no_typescript_backend_fallback",
      stoppedGoBehavior: "fail_closed_classified",
      nonNormalClassification: "selected-normal",
    },
    {
      routeId: "signUp",
      routeFamily: "auth_session",
      method: "POST",
      goPath: "/auth/sign-up",
      nextPath: "/api/auth/sign-up",
      authScope: "public",
      privacyClass: "session",
      selectedNormal: true,
      fallbackPolicy: "no_typescript_backend_fallback",
      stoppedGoBehavior: "fail_closed_classified",
      nonNormalClassification: "selected-normal",
    },
    {
      routeId: "revokeSession",
      routeFamily: "auth_session",
      method: "DELETE",
      goPath: "/auth/session",
      nextPath: "/api/auth/sign-out",
      authScope: "session",
      privacyClass: "session",
      selectedNormal: true,
      fallbackPolicy: "no_typescript_backend_fallback",
      stoppedGoBehavior: "fail_closed_classified",
      nonNormalClassification: "selected-normal",
    },
    {
      routeId: "listStrategyRevisions",
      routeFamily: "account_revision",
      method: "GET",
      goPath: "/account/strategy-revisions",
      nextPath: "/api/account/revisions",
      authScope: "session",
      privacyClass: "session",
      selectedNormal: true,
      fallbackPolicy: "no_typescript_backend_fallback",
      stoppedGoBehavior: "fail_closed_classified",
      nonNormalClassification: "selected-normal",
    },
    {
      routeId: "createStrategyRevision",
      routeFamily: "account_revision",
      method: "POST",
      goPath: "/account/strategy-revisions",
      nextPath: "/api/account/revisions/save",
      authScope: "session",
      privacyClass: "session",
      selectedNormal: true,
      fallbackPolicy: "no_typescript_backend_fallback",
      stoppedGoBehavior: "fail_closed_classified",
      nonNormalClassification: "selected-normal",
    },
    {
      routeId: "getStrategyRevisionSource",
      routeFamily: "account_revision",
      method: "GET",
      goPath: "/account/strategy-revisions/{strategyRevisionId}/source",
      nextPath: "/api/account/revisions/[revisionId]/source",
      authScope: "owner",
      privacyClass: "owner-private-source",
      selectedNormal: true,
      fallbackPolicy: "no_typescript_backend_fallback",
      stoppedGoBehavior: "fail_closed_classified",
      nonNormalClassification: "selected-normal",
    },
    {
      routeId: "forkStarterStrategy",
      routeFamily: "account_fork",
      method: "POST",
      goPath: "/account/starter-forks",
      nextPath: "/api/account/starter-forks",
      authScope: "session",
      privacyClass: "session",
      selectedNormal: true,
      fallbackPolicy: "no_typescript_backend_fallback",
      stoppedGoBehavior: "fail_closed_classified",
      nonNormalClassification: "selected-normal",
    },
    {
      routeId: "forkAdvancedStrategy",
      routeFamily: "account_fork",
      method: "POST",
      goPath: "/account/advanced-forks",
      nextPath: "/api/account/advanced-forks",
      authScope: "session",
      privacyClass: "session",
      selectedNormal: true,
      fallbackPolicy: "no_typescript_backend_fallback",
      stoppedGoBehavior: "fail_closed_classified",
      nonNormalClassification: "selected-normal",
    },
    {
      routeId: "createMatchSet",
      routeFamily: "exhibition",
      method: "POST",
      goPath: "/matchsets",
      nextPath: "/api/exhibitions",
      authScope: "session",
      privacyClass: "session",
      selectedNormal: true,
      fallbackPolicy: "no_typescript_backend_fallback",
      stoppedGoBehavior: "fail_closed_classified",
      nonNormalClassification: "selected-normal",
    },
    {
      routeId: "getPublicStrategyPage",
      routeFamily: "public_read",
      method: "GET",
      goPath: "/public/strategies/{strategyId}",
      nextPath: "/strategies/[strategyId]",
      authScope: "public",
      privacyClass: "public",
      selectedNormal: true,
      fallbackPolicy: "no_typescript_backend_fallback",
      stoppedGoBehavior: "fail_closed_classified",
      nonNormalClassification: "selected-normal",
    },
    {
      routeId: "getPublicPlayerPage",
      routeFamily: "public_read",
      method: "GET",
      goPath: "/public/players/{handle}",
      nextPath: "/players/[handle]",
      authScope: "public",
      privacyClass: "public",
      selectedNormal: true,
      fallbackPolicy: "no_typescript_backend_fallback",
      stoppedGoBehavior: "fail_closed_classified",
      nonNormalClassification: "selected-normal",
    },
    {
      routeId: "getPublicLadderSeason",
      routeFamily: "public_read",
      method: "GET",
      goPath: "/public/ladders/{seasonId}",
      nextPath: "/ladder/[seasonId]",
      authScope: "public",
      privacyClass: "public",
      selectedNormal: true,
      fallbackPolicy: "no_typescript_backend_fallback",
      stoppedGoBehavior: "fail_closed_classified",
      nonNormalClassification: "selected-normal",
    },
    {
      routeId: "getPublicMatchSetSummary",
      routeFamily: "public_read",
      method: "GET",
      goPath: "/public/matchsets/{matchSetId}/summary",
      nextPath: "/matchsets/[matchSetId]",
      authScope: "public",
      privacyClass: "public",
      selectedNormal: true,
      fallbackPolicy: "no_typescript_backend_fallback",
      stoppedGoBehavior: "fail_closed_classified",
      nonNormalClassification: "selected-normal",
    },
    {
      routeId: "getPublicReplayMetadata",
      routeFamily: "public_replay",
      method: "GET",
      goPath: "/public/replays/{matchId}/metadata",
      nextPath: "/api/replays/[matchId]/metadata",
      authScope: "public",
      privacyClass: "public",
      selectedNormal: true,
      fallbackPolicy: "no_typescript_backend_fallback",
      stoppedGoBehavior: "fail_closed_classified",
      nonNormalClassification: "selected-normal",
    },
    {
      routeId: "getPublicReplayEvidence",
      routeFamily: "public_replay",
      method: "GET",
      goPath: "/public/replays/{matchId}/evidence",
      nextPath: "/matches/[matchId]/replay",
      authScope: "public",
      privacyClass: "public",
      selectedNormal: true,
      fallbackPolicy: "no_typescript_backend_fallback",
      stoppedGoBehavior: "fail_closed_classified",
      nonNormalClassification: "selected-normal",
    },
  ],
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const stringArray = (value: unknown, field: string): readonly string[] => {
  if (
    !Array.isArray(value) ||
    value.some((entry) => typeof entry !== "string")
  ) {
    throw new Error(`${field} must be a string array`)
  }
  return value as string[]
}

const requireRecord = (
  value: unknown,
  field: string,
): Record<string, unknown> => {
  if (!isRecord(value)) {
    throw new Error(`${field} must be an object`)
  }
  return value
}

const listFiles = (
  relativeDir: string,
  predicate: (relativePath: string) => boolean,
): readonly string[] => {
  const root = path.join(repoRoot, relativeDir)
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((entry) => {
      if (entry === "node_modules" || entry === "dist" || entry === ".next") {
        return []
      }
      const absolute = path.join(dir, entry)
      const stat = statSync(absolute)
      if (stat.isDirectory()) {
        return walk(absolute)
      }
      const relative = path.relative(repoRoot, absolute)
      return predicate(relative) ? [relative] : []
    })
  return walk(root).sort()
}

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

export const assertReportOnlyBoundaryOffenseCount = (
  count: number,
  baseline: ReadonlySet<string> = knownReportOnlyBoundaryOffenses,
): void => {
  if (count > baseline.size) {
    throw new Error(
      `report-only offense baseline grew: expected at most ${baseline.size}, got ${count}`,
    )
  }
}

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
    "public-player-page.json",
    "public-ladder-page.json",
    "public-match-set-summary.json",
    "degraded-match-set-summary.json",
    "public-replay-metadata.json",
    "public-replay-evidence.json",
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
    "getPublicPlayerPage",
    "getPublicLadderSeason",
    "getPublicMatchSetSummary",
    "getPublicReplayMetadata",
    "getPublicReplayEvidence",
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

export const validateSelectedGoRouteManifest = (
  manifest: SelectedGoRouteManifest,
): string => {
  if (manifest.schemaVersion !== "v1.16-selected-go-route-manifest") {
    throw new Error("v1.16 selected Go route manifest schema drifted")
  }
  if (manifest.milestone !== "v1.16") {
    throw new Error("v1.16 selected Go route manifest milestone drifted")
  }
  if (manifest.fallbackPolicy !== "no_typescript_backend_fallback") {
    throw new Error("v1.16 selected Go route manifest fallback policy drifted")
  }
  const requiredRouteIds = new Set([
    "health",
    "authSession",
    "createSession",
    "signUp",
    "revokeSession",
    "listStrategyRevisions",
    "createStrategyRevision",
    "getStrategyRevisionSource",
    "forkStarterStrategy",
    "forkAdvancedStrategy",
    "createMatchSet",
    "getPublicStrategyPage",
    "getPublicPlayerPage",
    "getPublicLadderSeason",
    "getPublicMatchSetSummary",
    "getPublicReplayMetadata",
    "getPublicReplayEvidence",
  ])
  const routeIds = new Set(manifest.routes.map((route) => route.routeId))
  for (const routeId of requiredRouteIds) {
    if (!routeIds.has(routeId)) {
      throw new Error(`v1.16 selected Go route manifest missing ${routeId}`)
    }
  }
  for (const routeId of routeIds) {
    if (!requiredRouteIds.has(routeId)) {
      throw new Error(
        `v1.16 selected Go route manifest has unexpected route ${routeId}`,
      )
    }
  }
  if (routeIds.size !== manifest.routes.length) {
    throw new Error("v1.16 selected Go route manifest has duplicate route ids")
  }
  const liveBackend = readFileSync(
    path.join(repoRoot, "apps/go-backend/live_backend.go"),
    "utf8",
  )
  for (const route of manifest.routes) {
    if (route.selectedNormal !== true) {
      throw new Error(`${route.routeId} must be selected normal`)
    }
    if (route.fallbackPolicy !== "no_typescript_backend_fallback") {
      throw new Error(`${route.routeId} fallback policy drifted`)
    }
    if (route.stoppedGoBehavior !== "fail_closed_classified") {
      throw new Error(`${route.routeId} stopped-Go behavior drifted`)
    }
    if (
      route.privacyClass === "owner-private-source" &&
      route.routeId !== "getStrategyRevisionSource"
    ) {
      throw new Error(`${route.routeId} cannot use owner-private-source`)
    }
    const registration = `mux.HandleFunc("${route.method} ${route.goPath}"`
    if (!liveBackend.includes(registration)) {
      throw new Error(`${route.routeId} missing live Go route ${registration}`)
    }
    const nextFile = selectedGoRouteNextFile(route.nextPath)
    if (!existsSync(path.join(repoRoot, nextFile))) {
      throw new Error(`${route.routeId} missing Next route/page ${nextFile}`)
    }
    if (route.nextPath.startsWith("/api/")) {
      const source = readFileSync(path.join(repoRoot, nextFile), "utf8")
      for (const forbidden of [
        "competitiveServer",
        "getCurrentCompetitiveUser",
        "@cowards/persistence",
        "@cowards/service",
      ]) {
        if (source.includes(forbidden)) {
          throw new Error(
            `${route.routeId} selected Next adapter imports ${forbidden}`,
          )
        }
      }
    }
    for (const expected of selectedGoRouteBoundaryTokens(route.routeId)) {
      const source = readFileSync(path.join(repoRoot, nextFile), "utf8")
      if (!source.includes(expected)) {
        throw new Error(
          `${route.routeId} selected Next route/page missing boundary token ${expected}`,
        )
      }
    }
    assertMonitorPublicPayload({
      routeId: route.routeId,
      routeFamily: route.routeFamily,
      method: route.method,
      goPath: route.goPath,
      nextPath: route.nextPath,
      authScope: route.authScope,
      privacyClass: route.privacyClass,
      fallbackPolicy: route.fallbackPolicy,
      stoppedGoBehavior: route.stoppedGoBehavior,
      nonNormalClassification: route.nonNormalClassification,
    })
  }
  for (const excluded of [
    "Workshop",
    "broader ladder",
    "governance",
    "owner-debug",
    "test-support",
    "rollback",
    "migrations",
    "runtime service replacement",
  ]) {
    if (
      !manifest.explicitlyOutOfScope.some((item) => item.includes(excluded))
    ) {
      throw new Error(
        `v1.16 selected Go route manifest missing out-of-scope ${excluded}`,
      )
    }
  }
  return `${manifest.routes.length} v1.16 selected Go routes checked`
}

const selectedGoRouteNextFile = (nextPath: string): string => {
  const relative = nextPath.startsWith("/") ? nextPath.slice(1) : nextPath
  if (relative.startsWith("api/")) {
    return path.join("apps/web/app", relative, "route.ts")
  }
  return path.join("apps/web/app", relative, "page.tsx")
}

const selectedGoRouteBoundaryTokens = (routeId: string): readonly string[] => {
  switch (routeId) {
    case "health":
      return ["COWARDS_NO_TYPESCRIPT_BACKEND", "go_backend_unavailable"]
    case "authSession":
      return ["getAccountSession"]
    case "createSession":
      return ["requireSelectedGoBackendClient", "createSession"]
    case "signUp":
      return ["requireSelectedGoBackendClient", "createAccount"]
    case "revokeSession":
      return ["requireSelectedGoBackendClient", "revokeSession"]
    case "listStrategyRevisions":
      return ["listAccountReadRevisions"]
    case "createStrategyRevision":
      return ["saveAccountRevisionFromRequest"]
    case "getStrategyRevisionSource":
      return ["requireSelectedGoBackendClient", "getStrategyRevisionSource"]
    case "forkStarterStrategy":
      return ["requireSelectedGoBackendClient", "forkStarterStrategy"]
    case "forkAdvancedStrategy":
      return ["requireSelectedGoBackendClient", "forkAdvancedStrategy"]
    case "createMatchSet":
      return ["requireSelectedGoBackendClient", "createMatchSet"]
    case "getPublicStrategyPage":
      return ["getPublicStrategyCard"]
    case "getPublicPlayerPage":
      return ["getPublicPlayerProfile"]
    case "getPublicLadderSeason":
      return ["getPublicLadderSeason"]
    case "getPublicMatchSetSummary":
      return ["getPublicMatchSetResult"]
    case "getPublicReplayMetadata":
      return ["getPublicReplayMetadata"]
    case "getPublicReplayEvidence":
      return ["getMatchReplay"]
    default:
      return []
  }
}

const checkSelectedGoRouteManifest = (): string => {
  const artifact = readJson<SelectedGoRouteManifest>(
    v116SelectedGoRouteManifestPath,
  )
  const expected = JSON.stringify(selectedGoRouteManifest)
  const actual = JSON.stringify(artifact)
  if (actual !== expected) {
    throw new Error("v1.16 selected Go route manifest artifact drifted")
  }
  return validateSelectedGoRouteManifest(artifact)
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

const requiredV115SurfaceIds = [
  "publicReads",
  "accountAndExhibitionRoutes",
  "matchJobLifecycle",
  "runtimeExecutionService",
  "matchCompletion",
  "chroniclePersistence",
  "matchSetScoring",
  "publicEvidenceDelivery",
  "workshopAndAdminDeferred",
  "topologyAndPromotionGate",
] as const

const requiredV115PublicOutputForbidden = [
  "Strategy source",
  "StrategyMemory",
  "SoldierMemory",
  "objective payloads",
  "owner debug",
  "raw Awareness Grid",
  "stack traces",
  "stderr",
  "sessions",
  "tokens",
  "host paths",
  "DB DSNs",
  "private runtime internals",
] as const

const requiredRuntimeOnlyDisallowedScopes = [
  "db_job_claiming",
  "match_completion",
  "chronicle_persistence",
  "matchset_scoring",
  "product_api_fallback",
] as const

const requiredV116DecisionCoverage = [
  "D-01",
  "D-02",
  "D-03",
  "D-04",
  "D-05",
  "D-06",
  "D-07",
  "D-08",
  "D-09",
  "D-10",
  "D-11",
  "D-12",
  "D-13",
  "D-14",
  "D-15",
  "D-16",
  "D-17",
  "D-18",
] as const

const requiredV116FailurePrivacyDenylist = [
  "Strategy source",
  "StrategyMemory",
  "SoldierMemory",
  "objective payloads",
  "owner debug",
  "raw Awareness Grid",
  "stack traces",
  "stderr",
  "sessions",
  "tokens",
  "DB DSNs",
  "host paths",
  "private runtime internals",
] as const

const forbiddenRuntimeServiceAuthorityMarkers = [
  "@cowards/persistence",
  "@cowards/service",
  "claimNextMatchJob",
  "completeMatch",
  "recordAttemptFailure",
  "createPostgresChronicleStore",
  "matchset-status",
  "MatchSet scoring",
  "retired TypeScript backend",
] as const

const forbiddenStrategyExecutionOutsideBoundaryMarkers = [
  "@cowards/runtime-js/worker",
  "@cowards/runtime-python",
  "createRuntimeFromRevision",
  "createPythonRuntimeFromRevision",
  "runPythonStrategyMethod",
  "python_runtime_host.py",
  "runtimeJsWorkerEntrypoint",
  "node:vm",
  "node:wasi",
  'from "vm"',
  "from 'vm'",
  'require("vm")',
  "require('vm')",
] as const

const requiredMixedDbOwnerSurfaceIds = [
  "matchJobLifecycle",
  "matchCompletion",
] as const

export const validateV115LifecycleOwnershipManifest = (
  manifest: V115LifecycleOwnershipManifest,
): string => {
  if (manifest.schemaVersion !== "v1.15-lifecycle-ownership-manifest") {
    throw new Error("v1.15 lifecycle manifest schema version drifted")
  }
  if (manifest.milestone !== "v1.15") {
    throw new Error(`v1.15 lifecycle manifest milestone drifted`)
  }
  if (manifest.decision !== "go-backend-lifecycle-ownership-completion") {
    throw new Error("v1.15 lifecycle manifest decision drifted")
  }
  if (manifest.monitorBaseline.strictOffenses !== 0) {
    throw new Error("v1.15 strict offense baseline drifted")
  }
  if (manifest.monitorBaseline.reportOnlyOffenses !== 29) {
    throw new Error("v1.15 report-only offense baseline drifted")
  }
  if (
    manifest.globalPolicies.fallbackPolicy !==
    "no_silent_typescript_backend_fallback"
  ) {
    throw new Error("v1.15 global fallback policy drifted")
  }
  if (manifest.globalPolicies.mixedDbCompletingOwnersAllowed !== false) {
    throw new Error("v1.15 mixed DB-completing owners must stay forbidden")
  }
  if (
    manifest.globalPolicies.runtimeAbiVersion !== STRATEGY_RUNTIME_ABI_VERSION
  ) {
    throw new Error("v1.15 runtime ABI drifted")
  }
  if (manifest.globalPolicies.goExecutesStrategyCode !== false) {
    throw new Error("Go must not execute Strategy code in v1.15")
  }
  if (manifest.globalPolicies.nodeVmSecurityBoundaryAllowed !== false) {
    throw new Error("Node vm must not be a v1.15 security boundary")
  }
  if (
    manifest.globalPolicies.productionSandboxPromotionInScope ||
    manifest.globalPolicies.typescriptRuntimeRetirementInScope
  ) {
    throw new Error("v1.15 manifest pulled v1.16 runtime scope into milestone")
  }
  for (const marker of requiredV115PublicOutputForbidden) {
    if (!manifest.publicOutputForbiddenByDefault.includes(marker)) {
      throw new Error(`v1.15 public-output denylist missing ${marker}`)
    }
  }

  const allowedRoles = new Set<V115TypeScriptRole>([
    "frontend",
    "parity_only",
    "rollback_only",
    "test_only",
    "runtime_only",
    "deferred",
  ])
  for (const role of manifest.allowedTypeScriptRoles) {
    if (!allowedRoles.has(role)) {
      throw new Error(`v1.15 manifest has invalid allowed role ${role}`)
    }
  }

  const surfaceById = new Map(
    manifest.surfaces.map((surface) => [surface.surfaceId, surface]),
  )
  for (const surfaceId of requiredV115SurfaceIds) {
    if (!surfaceById.has(surfaceId)) {
      throw new Error(`v1.15 lifecycle manifest missing ${surfaceId}`)
    }
  }

  for (const surface of manifest.surfaces) {
    if (!allowedRoles.has(surface.typeScriptRole)) {
      throw new Error(`${surface.surfaceId} has invalid TypeScript role`)
    }
    if (surface.evidenceRequired.length === 0) {
      throw new Error(`${surface.surfaceId} missing evidence requirements`)
    }
    if (surface.disallowedScopes.length === 0) {
      throw new Error(`${surface.surfaceId} missing disallowed scopes`)
    }
    if (surface.codeReferences.length === 0) {
      throw new Error(`${surface.surfaceId} missing code references`)
    }
    if (
      surface.selectedOwner === "go_backend" &&
      surface.fallbackPolicy !== "no_silent_typescript_backend_fallback"
    ) {
      throw new Error(`${surface.surfaceId} selected Go without no-fallback`)
    }
    if (
      surface.selectedOwner === "go_backend" &&
      surface.rollbackOwner.trim().length === 0
    ) {
      throw new Error(`${surface.surfaceId} selected Go without rollback owner`)
    }
    if (surface.typeScriptRole === "runtime_only") {
      for (const scope of requiredRuntimeOnlyDisallowedScopes) {
        if (!surface.disallowedScopes.includes(scope)) {
          throw new Error(
            `${surface.surfaceId} missing runtime-only prohibition ${scope}`,
          )
        }
      }
    }
    if (
      requiredMixedDbOwnerSurfaceIds.includes(
        surface.surfaceId as (typeof requiredMixedDbOwnerSurfaceIds)[number],
      ) &&
      !surface.disallowedScopes.includes("mixed_db_completing_owners")
    ) {
      throw new Error(`${surface.surfaceId} missing mixed DB owner prohibition`)
    }
    if (
      surface.surfaceId !== "workshopAndAdminDeferred" &&
      surface.disallowedScopes.includes("mixed_db_completing_owners") &&
      manifest.globalPolicies.mixedDbCompletingOwnersAllowed
    ) {
      throw new Error(`${surface.surfaceId} allows mixed DB owners`)
    }
  }

  const runtimeSurface = surfaceById.get("runtimeExecutionService")
  if (runtimeSurface?.typeScriptRole !== "runtime_only") {
    throw new Error("runtimeExecutionService must stay runtime_only")
  }
  if (runtimeSurface.selectedOwner !== "typescript_runtime_service") {
    throw new Error("runtimeExecutionService selected owner drifted")
  }

  for (const surfaceId of [
    "matchJobLifecycle",
    "matchCompletion",
    "chroniclePersistence",
    "matchSetScoring",
    "publicEvidenceDelivery",
  ]) {
    const surface = surfaceById.get(surfaceId)
    if (surface?.selectedOwner !== "go_backend") {
      throw new Error(`${surfaceId} must select Go backend in v1.15`)
    }
  }

  assertMonitorPublicPayload({
    schemaVersion: manifest.schemaVersion,
    milestone: manifest.milestone,
    decision: manifest.decision,
    globalPolicies: manifest.globalPolicies,
    surfaces: manifest.surfaces.map((surface) => ({
      surfaceId: surface.surfaceId,
      surfaceKind: surface.surfaceKind,
      capability: surface.capability,
      currentOwner: surface.currentOwner,
      selectedOwner: surface.selectedOwner,
      typeScriptRole: surface.typeScriptRole,
      fallbackPolicy: surface.fallbackPolicy,
      rollbackOwner: surface.rollbackOwner,
      stoppedGoBehavior: surface.stoppedGoBehavior,
      stoppedRuntimeBehavior: surface.stoppedRuntimeBehavior,
      evidenceRequired: surface.evidenceRequired,
      disallowedScopes: surface.disallowedScopes,
    })),
  })

  return `${manifest.surfaces.length} v1.15 lifecycle ownership surfaces checked`
}

const checkV115LifecycleOwnershipManifest = (): string =>
  validateV115LifecycleOwnershipManifest(
    readJson<V115LifecycleOwnershipManifest>(
      v115LifecycleOwnershipManifestPath,
    ),
  )

export const validateV116RuntimeServiceBoundaryArtifact = (
  artifact: unknown,
): string => {
  const root = requireRecord(artifact, "v1.16 runtime boundary artifact")
  if (root.schemaVersion !== "v1.16-runtime-service-boundary") {
    throw new Error("v1.16 runtime boundary schema version drifted")
  }

  const service = requireRecord(
    root.strategyExecutionService,
    "strategyExecutionService",
  )
  if (
    service.publicName !== "Strategy Execution Service / Runtime Broker" ||
    service.futureBrokerReady !== true
  ) {
    throw new Error("Strategy Execution Service / Runtime Broker name drifted")
  }

  const implementation = requireRecord(
    root.currentImplementation,
    "currentImplementation",
  )
  if (implementation.label !== "isolated JS/TS runtime service") {
    throw new Error("current runtime implementation label drifted")
  }
  if (implementation.notBackend !== true) {
    throw new Error("current runtime implementation must be not a backend")
  }
  if (implementation.notFinalRuntimeBroker !== true) {
    throw new Error("current runtime implementation must not be final broker")
  }

  const transport = requireRecord(root.transport, "transport")
  if (
    transport.currentBinding !== "HTTP+JSON" ||
    transport.transportNeutralContract !== true
  ) {
    throw new Error("v1.16 transport binding drifted")
  }

  const runtimeAbi = requireRecord(root.runtimeAbi, "runtimeAbi")
  if (runtimeAbi.serviceContractVersion !== RUNTIME_EXECUTION_SERVICE_VERSION) {
    throw new Error("runtime execution service contract version drifted")
  }
  if (runtimeAbi.strategyRuntimeAbiVersion !== STRATEGY_RUNTIME_ABI_VERSION) {
    throw new Error("runtime ABI version drifted")
  }
  if (runtimeAbi.languageSpecificShortcutsAllowed !== false) {
    throw new Error("language-specific shortcut contracts must stay forbidden")
  }

  const authority = requireRecord(root.authority, "authority")
  const disallowed = stringArray(authority.disallowed, "authority.disallowed")
  for (const scope of [
    "claim-jobs",
    "complete-matches",
    "persist-chronicles",
    "refresh-matchset-scoring",
    "serve-product-api-routes",
    "read-web-session-state",
    "deliver-public-evidence",
    "fallback-to-retired-typescript-backend",
  ]) {
    if (!disallowed.includes(scope)) {
      throw new Error(`runtime authority missing prohibition ${scope}`)
    }
  }

  const artifactPolicy = requireRecord(
    root.submissionArtifactPolicy,
    "submissionArtifactPolicy",
  )
  if (
    artifactPolicy.executeImmutableRevisionsOnly !== true ||
    artifactPolicy.goAndWebApiMayImportEvaluateTranspileOrExecuteStrategySource !==
      false
  ) {
    throw new Error("runtime submission artifact policy drifted")
  }

  const failurePrivacy = requireRecord(root.failurePrivacy, "failurePrivacy")
  const denylist = stringArray(
    failurePrivacy.privateDenylist,
    "failurePrivacy.privateDenylist",
  )
  for (const marker of requiredV116FailurePrivacyDenylist) {
    if (!denylist.includes(marker)) {
      throw new Error(`v1.16 failure privacy denylist missing ${marker}`)
    }
  }
  if (failurePrivacy.successResultPrivacy !== "internal_runtime_result") {
    throw new Error("runtime success privacy marker drifted")
  }

  const noFallback = requireRecord(root.noFallback, "noFallback")
  if (
    noFallback.runtimeFailureMayFallbackToRetiredTypeScriptBackend !== false ||
    noFallback.goMustClassifyRuntimeFailure !== true ||
    noFallback.webApiMayExecuteStrategySourceOnFailure !== false
  ) {
    throw new Error("runtime no-fallback policy drifted")
  }

  const nonPromotion = requireRecord(root.nonPromotion, "nonPromotion")
  for (const [key, value] of Object.entries(nonPromotion)) {
    if (value !== false) {
      if (key === "nodeWasiAcceptedAsSandbox") {
        throw new Error("node:wasi must not be accepted as a Strategy sandbox")
      }
      throw new Error(`deferred runtime idea promoted: ${key}`)
    }
  }

  const decisions = stringArray(root.decisionCoverage, "decisionCoverage")
  for (const decision of requiredV116DecisionCoverage) {
    if (!decisions.includes(decision)) {
      throw new Error(`v1.16 runtime boundary missing ${decision}`)
    }
  }

  const publicArtifactPolicy = requireRecord(
    root.publicArtifactPolicy,
    "publicArtifactPolicy",
  )
  if (
    publicArtifactPolicy.containsRealTokensDsnsOrHostSecrets !== false ||
    publicArtifactPolicy.privateStrategyMaterialIncluded !== false
  ) {
    throw new Error("v1.16 runtime artifact public-safety policy drifted")
  }

  return `${service.publicName} ${runtimeAbi.serviceContractVersion} boundary checked`
}

const checkV116RuntimeServiceBoundaryArtifact = (): string =>
  validateV116RuntimeServiceBoundaryArtifact(
    readJson(v116RuntimeServiceBoundaryArtifactPath),
  )

const requiredV116WorkerRollbackStates = [
  "queued_jobs",
  "running_jobs",
  "expired_leases",
  "retries",
  "exhausted_failures",
  "incomplete_matchsets",
  "scoring_public_evidence",
  "stopped_go",
  "stopped_runtime_service",
] as const

const forbiddenWorkerArtifactStringMarkers = forbiddenWorkerArtifactStrings.map(
  (marker) => marker.toLowerCase(),
)

const forbiddenWorkerArtifactKeyMarkers = new Set(
  [
    "strategySource",
    "strategy_source",
    "strategyMemory",
    "strategy_memory",
    "soldierMemory",
    "soldier_memory",
    "objectivePayload",
    "objective_payload",
    "ownerDebug",
    "owner_debug",
    "owner-debug",
    "rawAwarenessGrid",
    "awarenessGrid",
    "database_url",
    "databaseUrl",
    "DATABASE_URL",
    "dsn",
    "dbDsn",
    "source",
    "sourceText",
    "session",
    "accessToken",
    "access_token",
    "token",
    "tokens",
    "hostPath",
    "privateRuntimeInternals",
    "stack",
    "stackTrace",
    "stderr",
  ].map((marker) => marker.toLowerCase().replace(/[-_]/g, "")),
)

const assertArtifactPrivacyLeakSafe = (
  value: unknown,
  pathLabel = "$",
): void => {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertArtifactPrivacyLeakSafe(item, `${pathLabel}[${index}]`),
    )
    return
  }
  if (value === null || typeof value !== "object") {
    if (typeof value === "string") {
      const lowerValue = value.toLowerCase()
      for (const marker of forbiddenWorkerArtifactStringMarkers) {
        if (lowerValue.includes(marker)) {
          throw new Error(
            `artifact privacy marker ${marker} found at ${pathLabel}`,
          )
        }
      }
    }
    return
  }

  for (const [key, nested] of Object.entries(value)) {
    const normalizedKey = key.toLowerCase().replace(/[-_]/g, "")
    if (forbiddenWorkerArtifactKeyMarkers.has(normalizedKey)) {
      throw new Error(`artifact private field ${key} found at ${pathLabel}`)
    }
    assertArtifactPrivacyLeakSafe(nested, `${pathLabel}.${key}`)
  }
}

export const validateV116TypeScriptWorkerQuarantineArtifact = (
  artifact: unknown,
): string => {
  const root = requireRecord(artifact, "v1.16 TypeScript worker quarantine")
  assertArtifactPrivacyLeakSafe(root)
  if (root.schemaVersion !== "v1.16-typescript-worker-quarantine") {
    throw new Error("v1.16 TypeScript worker quarantine schema drifted")
  }
  if (root.milestone !== "v1.16" || root.phase !== "106") {
    throw new Error("v1.16 TypeScript worker quarantine phase drifted")
  }

  const policies = requireRecord(root.globalPolicies, "globalPolicies")
  if (policies.mixedGoAndTypeScriptOwnersAllowed !== false) {
    throw new Error("mixed Go and TypeScript owners must stay forbidden")
  }
  if (policies.normalTypeScriptWorkerAllowed !== false) {
    throw new Error("normal TypeScript worker startup must stay forbidden")
  }
  if (policies.requiredWorkerPurpose !== "rollback") {
    throw new Error("rollback worker purpose requirement drifted")
  }
  const allowedPurposes = stringArray(
    policies.allowedTypeScriptWorkerPurposes,
    "globalPolicies.allowedTypeScriptWorkerPurposes",
  )
  for (const purpose of ["rollback", "test", "parity"]) {
    if (!allowedPurposes.includes(purpose)) {
      throw new Error(`worker quarantine missing purpose ${purpose}`)
    }
  }

  const rollbackStates = requireRecord(root.rollbackStates, "rollbackStates")
  for (const state of requiredV116WorkerRollbackStates) {
    if (!isRecord(rollbackStates[state])) {
      throw new Error(`rollback artifact missing ${state}`)
    }
  }

  const ownership = requireRecord(root.ownership, "ownership")
  if (
    ownership.normalOwner !== "go" ||
    ownership.typeScriptRole !== "rollback_test_parity_only" ||
    ownership.singleOwnerRequired !== true
  ) {
    throw new Error("TypeScript worker ownership contract drifted")
  }

  const sourceChecks = stringArray(root.sourceChecks, "sourceChecks")
  for (const marker of [
    "assertTypeScriptWorkerEntrypointAllowed",
    "@cowards/persistence/quarantine-lifecycle",
    "COWARDS_TYPESCRIPT_WORKER_PURPOSE",
  ]) {
    if (!sourceChecks.includes(marker)) {
      throw new Error(`worker quarantine source check missing ${marker}`)
    }
  }

  return "v1.16 TypeScript worker quarantine single owner rollback contract checked"
}

const checkV116TypeScriptWorkerQuarantineArtifact = (): string =>
  validateV116TypeScriptWorkerQuarantineArtifact(
    readJson(v116TypeScriptWorkerQuarantineArtifactPath),
  )

const requiredFinalLabelCapabilityGroups = [
  "Workshop",
  "ladder",
  "governance-admin",
  "owner-debug",
  "test-support",
  "fixture",
  "parity",
  "rollback",
  "runtime-service",
  "runtime-adapter",
  "frontend-only",
] as const

const requiredFinalLabelRoles = [
  "deferred",
  "fixture-only",
  "frontend-only",
  "parity-only",
  "quarantined",
  "rollback-only",
  "runtime-adapter",
  "runtime-service",
  "test-only",
] as const

const allowedFinalSurfaceLabels = new Set([
  "deferred-account-private-source",
  "deferred-governance-admin-mutation",
  "deferred-ladder-mutation",
  "deferred-service-support",
  "deferred-workshop-analytics-rerun",
  "deferred-workshop-export",
  "deferred-workshop-private-source",
  "deferred-workshop-profile-save",
  "deferred-workshop-runtime-support",
  "deferred-workshop-test-launch",
  "deferred-workshop-ui",
  "deferred-workshop-validation",
  "fixture-only",
  "frontend-go-adapter",
  "frontend-go-private-source-adapter",
  "parity-reference",
  "private-owner-debug-replay",
  "quarantined-lifecycle",
  "rollback-only",
  "runtime-adapter-execution-boundary",
  "runtime-service-execution-boundary",
  "test-only",
  "test-support-route",
] as const)

const allowedFinalPrivacyClasses = new Set([
  "admin-private",
  "deferred-private-support",
  "fixture-public-redacted",
  "frontend-public-or-session-redacted",
  "internal-runtime-redacted",
  "owner-private-replay-debug",
  "owner-private-source",
  "owner-private-source-through-go",
  "owner-private-workshop",
  "parity-reference-not-public",
  "quarantined-private",
  "rollback-diagnostics-redacted",
  "session-or-public-redacted",
  "test-diagnostics-redacted",
  "test-only",
] as const)

const allowedFinalPublicOutputPrivacy = new Set([
  "not-public-output",
  "owner-private",
  "public-redacted",
] as const)

const requiredV116PathSemanticLabels = new Map(
  Object.entries({
    "packages/persistence/src/workshop.ts": {
      surfaceLabel: "deferred-workshop-runtime-support",
      capabilityGroup: "Workshop",
      taxonomyRole: "deferred",
      privacyClass: "owner-private-workshop",
      publicOutputPrivacy: "owner-private",
    },
    "packages/persistence/src/ladder.ts": {
      surfaceLabel: "deferred-ladder-mutation",
      capabilityGroup: "ladder",
      taxonomyRole: "deferred",
      privacyClass: "session-or-public-redacted",
      publicOutputPrivacy: "not-public-output",
    },
    "packages/persistence/src/governance.ts": {
      surfaceLabel: "deferred-governance-admin-mutation",
      capabilityGroup: "governance-admin",
      taxonomyRole: "deferred",
      privacyClass: "admin-private",
      publicOutputPrivacy: "not-public-output",
    },
  }),
)

export const validateV116FinalTypeScriptSurfaceLabels = (
  artifact: unknown,
): string => {
  const root = requireRecord(artifact, "v1.16 final TypeScript surface labels")
  if (root.schemaVersion !== "v1.16-final-typescript-surface-labels") {
    throw new Error("final TypeScript surface labels schema drifted")
  }
  if (root.milestone !== "v1.16" || root.phase !== "107") {
    throw new Error("final TypeScript surface labels phase drifted")
  }

  const policies = requireRecord(root.globalPolicies, "globalPolicies")
  if (policies.normalTypeScriptBackendAllowed !== false) {
    throw new Error("normal TypeScript backend must remain disallowed")
  }
  if (policies.publicOutputPrivacyRequired !== true) {
    throw new Error("public output privacy must remain required")
  }
  if (policies.ownerDebugPublicEvidenceFallbackAllowed !== false) {
    throw new Error(
      "owner-debug public evidence fallback must remain forbidden",
    )
  }
  if (policies.testSupportNormalProductTrafficAllowed !== false) {
    throw new Error("test-support normal product traffic must remain forbidden")
  }

  const inventory = readJson<{ surfaces: readonly unknown[] }>(
    v116TypeScriptBackendInventoryPath,
  )
  const inventoryPaths = new Set(
    inventory.surfaces.map((item) => {
      const surface = requireRecord(item, "inventory surface")
      if (typeof surface.path !== "string" || surface.path.length === 0) {
        throw new Error("inventory surface missing path")
      }
      return surface.path
    }),
  )
  const sourceInventorySurfaceCount = root.sourceInventorySurfaceCount
  if (
    typeof sourceInventorySurfaceCount !== "number" ||
    sourceInventorySurfaceCount !== inventory.surfaces.length
  ) {
    throw new Error("source inventory count drifted")
  }

  const capabilityGroups = requireRecord(
    root.capabilityGroups,
    "capabilityGroups",
  )
  for (const group of requiredFinalLabelCapabilityGroups) {
    if (
      typeof capabilityGroups[group] !== "number" ||
      capabilityGroups[group] <= 0
    ) {
      throw new Error(`missing capability group ${group}`)
    }
  }
  const roleCounts = requireRecord(root.roleCounts, "roleCounts")
  for (const role of requiredFinalLabelRoles) {
    if (typeof roleCounts[role] !== "number" || roleCounts[role] <= 0) {
      throw new Error(`missing taxonomy role ${role}`)
    }
  }

  const decisions = stringArray(
    root.phase107DecisionCoverage,
    "phase107DecisionCoverage",
  )
  for (const decision of [
    "D-01",
    "D-02",
    "D-03",
    "D-04",
    "D-05",
    "D-06",
    "D-07",
    "D-08",
    "D-09",
    "D-10",
    "D-11",
    "D-12",
    "D-13",
    "D-14",
    "D-15",
  ]) {
    if (!decisions.includes(decision)) {
      throw new Error(`final labels missing decision ${decision}`)
    }
  }

  if (!Array.isArray(root.surfaces)) {
    throw new Error("final labels surfaces must be an array")
  }
  if (root.surfaces.length !== inventory.surfaces.length) {
    throw new Error("source inventory count does not match final label rows")
  }
  const seen = new Set<string>()
  for (const item of root.surfaces) {
    const surface = requireRecord(item, "surface")
    const pathValue = surface.path
    const taxonomyRole = surface.taxonomyRole
    const surfaceLabel = surface.surfaceLabel
    if (typeof pathValue !== "string" || pathValue.length === 0) {
      throw new Error("surface missing path")
    }
    if (seen.has(pathValue)) {
      throw new Error(`duplicate final label path ${pathValue}`)
    }
    seen.add(pathValue)
    if (!inventoryPaths.has(pathValue)) {
      throw new Error(
        `final label path ${pathValue} is not in source inventory`,
      )
    }
    if (typeof taxonomyRole !== "string") {
      throw new Error(`${pathValue} missing taxonomy role`)
    }
    if (
      !(requiredFinalLabelRoles as readonly string[]).includes(taxonomyRole)
    ) {
      throw new Error(`${pathValue} has invalid taxonomyRole ${taxonomyRole}`)
    }
    if (taxonomyRole.includes("backend")) {
      throw new Error(`${pathValue} claims normal TypeScript backend role`)
    }
    if (typeof surfaceLabel !== "string" || surfaceLabel.length === 0) {
      throw new Error(`${pathValue} missing surface label`)
    }
    if (!allowedFinalSurfaceLabels.has(surfaceLabel as never)) {
      throw new Error(`${pathValue} has invalid surfaceLabel ${surfaceLabel}`)
    }
    const capabilityGroup = surface.capabilityGroup
    if (typeof capabilityGroup !== "string" || capabilityGroup.length === 0) {
      throw new Error(`${pathValue} missing capabilityGroup`)
    }
    if (typeof capabilityGroups[capabilityGroup] !== "number") {
      throw new Error(
        `${pathValue} has invalid capabilityGroup ${capabilityGroup}`,
      )
    }
    for (const field of [
      "owner",
      "reason",
      "risk",
      "privacyClass",
      "gate",
      "futureMigration",
      "monitorStatus",
    ]) {
      if (
        typeof surface[field] !== "string" ||
        surface[field].trim().length === 0
      ) {
        throw new Error(`${pathValue} missing ${field}`)
      }
    }
    const privacyClass = String(surface.privacyClass)
    if (!allowedFinalPrivacyClasses.has(privacyClass as never)) {
      throw new Error(`${pathValue} has invalid privacyClass ${privacyClass}`)
    }
    const publicOutputPrivacy = surface.publicOutputPrivacy
    if (
      typeof publicOutputPrivacy !== "string" ||
      !allowedFinalPublicOutputPrivacy.has(publicOutputPrivacy as never)
    ) {
      throw new Error(
        `${pathValue} has invalid publicOutputPrivacy ${String(publicOutputPrivacy)}`,
      )
    }
    const semanticExpectation = requiredV116PathSemanticLabels.get(pathValue)
    if (semanticExpectation) {
      for (const [field, expected] of Object.entries(semanticExpectation)) {
        if (surface[field] !== expected) {
          throw new Error(
            `${pathValue} semantic label drift: ${field} must be ${expected}`,
          )
        }
      }
    }
    if (
      surface.selectedNormal === true &&
      taxonomyRole !== "frontend-only" &&
      taxonomyRole !== "runtime-service" &&
      taxonomyRole !== "runtime-adapter"
    ) {
      throw new Error(
        `${pathValue} selectedNormal is not allowed for ${taxonomyRole}`,
      )
    }
    if (surface.normalBackendAuthority !== false) {
      throw new Error(`${pathValue} must not claim backend authority`)
    }
    if (
      taxonomyRole === "deferred" &&
      (String(surface.gate).trim().length === 0 ||
        String(surface.futureMigration).trim().length === 0 ||
        String(surface.owner).trim().length === 0 ||
        String(surface.risk).trim().length === 0 ||
        String(surface.privacyClass).trim().length === 0 ||
        String(surface.monitorStatus).trim().length === 0)
    ) {
      throw new Error(`${pathValue} deferred row missing monitor metadata`)
    }
    if (surfaceLabel === "private-owner-debug-replay") {
      const combined = `${surface.gate} ${surface.futureMigration} ${surface.selectedNormalJustification}`
      if (
        !/PLAYWRIGHT_TEST|NODE_ENV=test|COWARDS_ENABLE_OWNER_DEBUG_REPLAY/.test(
          combined,
        )
      ) {
        throw new Error(`${pathValue} owner-debug missing enablement gates`)
      }
      if (!/COWARDS_OWNER_DEBUG_REQUESTER_PLAYER_ID/.test(combined)) {
        throw new Error(
          `${pathValue} owner-debug missing requester identity gate`,
        )
      }
      if (
        !/owner authorization|persisted owner authorization|owner/.test(
          combined,
        )
      ) {
        throw new Error(`${pathValue} owner-debug missing owner authorization`)
      }
      if (
        !/fallback|public replay evidence|public evidence/.test(combined) ||
        surface.noPublicFallback !== true
      ) {
        throw new Error(
          `${pathValue} owner-debug public fallback policy missing`,
        )
      }
    }
    if (surfaceLabel === "test-support-route") {
      const gate = String(surface.gate)
      if (
        !/PLAYWRIGHT_TEST|NODE_ENV=test|test-support/.test(gate) ||
        !/404|normal product runtime/.test(gate)
      ) {
        throw new Error(`${pathValue} test-support gate is insufficient`)
      }
    }
    if (surfaceLabel === "fixture-only") {
      const gate = String(surface.gate)
      if (
        !/PLAYWRIGHT_TEST|NODE_ENV=test|COWARDS_ENABLE_REPLAY_FIXTURES|fixture env gate/.test(
          gate,
        ) ||
        !/normal product traffic|product traffic/.test(gate)
      ) {
        throw new Error(`${pathValue} fixture gate is insufficient`)
      }
    }
    try {
      assertPublicOutputLeakSafe(
        {
          surfaceLabel: surface.surfaceLabel,
          capabilityGroup: surface.capabilityGroup,
          taxonomyRole: surface.taxonomyRole,
          publicOutputPrivacy: surface.publicOutputPrivacy,
          owner: surface.owner,
          reason: surface.reason,
          risk: surface.risk,
          privacyClass: surface.privacyClass,
          gate: surface.gate,
          futureMigration: surface.futureMigration,
          monitorStatus: surface.monitorStatus,
          selectedNormalJustification: surface.selectedNormalJustification,
        },
        `${pathValue} shareable label fields`,
      )
      assertMonitorPublicPayload(surface.publicOutputExample ?? {})
    } catch (error) {
      throw new Error(
        `${pathValue} public output/shareable label leak: ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
    }
  }
  for (const inventoryPath of inventoryPaths) {
    if (!seen.has(inventoryPath)) {
      throw new Error(
        `source inventory path ${inventoryPath} missing final label`,
      )
    }
  }

  return `${root.surfaces.length} final TypeScript surface labels checked`
}

const checkV116FinalTypeScriptSurfaceLabels = (): string =>
  validateV116FinalTypeScriptSurfaceLabels(
    readJson(v116FinalTypeScriptSurfaceLabelsPath),
  )

const checkTypeScriptWorkerQuarantineSource = (): string => {
  const indexSource = readFileSync(
    path.join(repoRoot, "apps/worker/src/index.ts"),
    "utf8",
  )
  const runnerSource = readFileSync(
    path.join(repoRoot, "apps/worker/src/runner.ts"),
    "utf8",
  )
  const persistenceRoot = readFileSync(
    path.join(repoRoot, "packages/persistence/src/index.ts"),
    "utf8",
  )
  const persistenceQuarantine = readFileSync(
    path.join(repoRoot, "packages/persistence/src/quarantine-lifecycle.ts"),
    "utf8",
  )
  const persistencePackage = readJson<{ exports?: Record<string, string> }>(
    "packages/persistence/package.json",
  )
  const serviceSource = readFileSync(
    path.join(repoRoot, "packages/service/src/index.ts"),
    "utf8",
  )
  const competitionSource = readFileSync(
    path.join(repoRoot, "packages/persistence/src/competition.ts"),
    "utf8",
  )
  const replayPageSource = readFileSync(
    path.join(repoRoot, "apps/web/app/matches/[matchId]/replay/page.tsx"),
    "utf8",
  )
  const replayServerSource = readFileSync(
    path.join(repoRoot, "apps/web/app/matches/server.ts"),
    "utf8",
  )

  const guardIndex = indexSource.indexOf(
    "assertTypeScriptWorkerEntrypointAllowed",
  )
  const poolIndex = indexSource.indexOf("const pool = createDatabasePool")
  if (guardIndex < 0 || poolIndex < 0 || guardIndex > poolIndex) {
    throw new Error("worker entrypoint guard must run before pool creation")
  }
  if (!indexSource.includes("COWARDS_TYPESCRIPT_WORKER_PURPOSE")) {
    throw new Error("worker entrypoint must document purpose env gate")
  }
  if (
    runnerSource.includes("explicitly selected as lifecycle owner") ||
    runnerSource.includes("allows normal TypeScript job ownership")
  ) {
    throw new Error("runner still contains normal TypeScript owner language")
  }
  if (
    !runnerSource.includes("@cowards/persistence/quarantine-lifecycle") ||
    runnerSource.includes("@cowards/persistence/jobs") ||
    runnerSource.includes("@cowards/persistence/complete-match")
  ) {
    throw new Error(
      "worker must import lifecycle helpers from quarantine subpath",
    )
  }
  for (const symbol of [
    "jobs",
    "complete-match",
    "chronicle-store",
    "matchset-status",
    "matchset-service",
    "competition",
  ]) {
    if (persistenceRoot.includes(`"./${symbol}.js"`)) {
      throw new Error(`normal persistence root exports ${symbol}`)
    }
  }
  if (
    persistencePackage.exports?.["./chronicle-store"] !== undefined ||
    persistencePackage.exports?.["./quarantine-lifecycle"] !==
      "./src/quarantine-lifecycle.ts"
  ) {
    throw new Error("persistence package quarantine lifecycle export drifted")
  }
  if (
    !persistenceQuarantine.includes("createPostgresChronicleStore") ||
    !persistenceQuarantine.includes("createChronicleMetadata")
  ) {
    throw new Error(
      "Chronicle persistence must be exported only via quarantine",
    )
  }
  if (
    !replayPageSource.includes('from "../../server.js"') ||
    !replayServerSource.includes("@cowards/persistence/quarantine-lifecycle")
  ) {
    throw new Error(
      "selected replay page import chain must expose quarantined Chronicle boundary",
    )
  }
  if (
    replayServerSource.includes("@cowards/persistence/chronicle-store") ||
    replayServerSource.includes('from "@cowards/persistence"')
  ) {
    throw new Error("replay server bypasses Chronicle quarantine boundary")
  }
  if (
    !serviceSource.includes("COWARDS_LOCAL_SERVICE_ROLE") ||
    !serviceSource.includes("selectedNormalBackend: false")
  ) {
    throw new Error("@cowards/service missing non-normal role metadata")
  }
  if (
    !competitionSource.includes("TYPESCRIPT_COMPETITION_PERSISTENCE_ROLE") ||
    !competitionSource.includes("createManualExhibitionMatchSet") ||
    !competitionSource.includes("buildPublicMatchSetResultDto")
  ) {
    throw new Error("competition persistence missing quarantine role metadata")
  }

  return "worker guard, quarantine import/export boundary, and service labels checked"
}

const checkRuntimeServiceProductionAuthority = (): string => {
  const sourceFiles = listFiles(
    "apps/runtime-service/src",
    (relative) => relative.endsWith(".ts") && !relative.endsWith(".test.ts"),
  )
  const sourceText = sourceFiles
    .map((file) => readFileSync(path.join(repoRoot, file), "utf8"))
    .join("\n")
  const importText = sourceText
    .split("\n")
    .filter((line) => line.trimStart().startsWith("import "))
    .join("\n")
  const packageJson = readJson<{
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
  }>("apps/runtime-service/package.json")
  const dependencyNames = new Set([
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.devDependencies ?? {}),
  ])

  for (const marker of forbiddenRuntimeServiceAuthorityMarkers) {
    if (importText.includes(marker) || dependencyNames.has(marker)) {
      throw new Error(
        `runtime service gained backend authority marker ${marker}`,
      )
    }
  }
  for (const marker of forbiddenRuntimeServiceAuthorityMarkers.filter(
    (marker) =>
      marker !== "@cowards/persistence" && marker !== "@cowards/service",
  )) {
    if (sourceText.includes(marker)) {
      throw new Error(
        `runtime service source contains backend authority ${marker}`,
      )
    }
  }
  return `${sourceFiles.length} runtime-service production files checked`
}

const checkNoStrategyExecutionOutsideRuntimeBoundary = (): string => {
  const files = [
    ...listFiles("apps/go-backend", (relative) => relative.endsWith(".go")),
    ...listFiles(
      "apps/web",
      (relative) =>
        (relative.endsWith(".ts") ||
          relative.endsWith(".tsx") ||
          relative.endsWith(".mjs")) &&
        !relative.endsWith(".test.ts") &&
        !relative.endsWith(".test.tsx"),
    ),
  ]
  for (const file of files) {
    const text = readFileSync(path.join(repoRoot, file), "utf8")
    for (const marker of forbiddenStrategyExecutionOutsideBoundaryMarkers) {
      if (text.includes(marker)) {
        throw new Error(
          `${file} contains forbidden runtime boundary marker ${marker}`,
        )
      }
    }
  }
  return `${files.length} Go/web files checked for no Strategy execution imports`
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

const brokerEntryKey = (entry: {
  abiVersion: string
  languageId: string
  languageVersion: string
  adapterId: string
  adapterVersion: string
  packagePolicy: string
}): string =>
  [
    entry.abiVersion,
    entry.languageId,
    entry.languageVersion,
    entry.adapterId,
    entry.adapterVersion,
    entry.packagePolicy,
  ].join("|")

const checkRuntimeBrokerRegistryArtifact = (): string => {
  const artifact = readJson<{
    schemaVersion?: unknown
    baseline?: Record<string, unknown>
    contract?: Record<string, unknown>
    entries?: unknown
  }>(v117RuntimeBrokerRegistryArtifactPath)
  if (artifact.schemaVersion !== RUNTIME_BROKER_REGISTRY_VERSION) {
    throw new Error("v1.17 runtime broker registry schema version drifted")
  }
  if (artifact.baseline?.pythonBackendOwner !== false) {
    throw new Error("v1.17 registry must forbid Python backend ownership")
  }
  if (
    artifact.contract?.strategyRuntimeAbiVersion !==
      STRATEGY_RUNTIME_ABI_VERSION ||
    artifact.contract?.selectionPolicy !==
      "exact-language-runtime-adapter-abi-package-match" ||
    artifact.contract?.fallbackPolicy !== "fail-closed-no-js-ts-or-go-fallback"
  ) {
    throw new Error("v1.17 runtime broker contract drifted")
  }
  if (!Array.isArray(artifact.entries)) {
    throw new Error("v1.17 runtime broker registry entries missing")
  }

  const registryByKey = new Map(
    RUNTIME_BROKER_REGISTRY.map((entry) => [brokerEntryKey(entry), entry]),
  )
  const artifactKeys = new Set<string>()
  for (const rawEntry of artifact.entries) {
    const entry = requireRecord(rawEntry, "v1.17 runtime broker entry")
    const key = brokerEntryKey({
      abiVersion: String(entry.abiVersion),
      languageId: String(entry.languageId),
      languageVersion: String(entry.languageVersion),
      adapterId: String(entry.adapterId),
      adapterVersion: String(entry.adapterVersion),
      packagePolicy: String(entry.packagePolicy),
    })
    const registryEntry = registryByKey.get(key)
    if (!registryEntry) {
      throw new Error(`v1.17 runtime broker artifact has unknown entry ${key}`)
    }
    artifactKeys.add(key)
    if (
      entry.runtimeTarget !== registryEntry.runtimeTarget ||
      entry.readiness !== registryEntry.readiness ||
      entry.enabledForNormalPlay !== registryEntry.enabledForNormalPlay ||
      entry.countedResultsAllowed !== registryEntry.countedResultsAllowed
    ) {
      throw new Error(`v1.17 runtime broker artifact drifted for ${key}`)
    }
    const issues = validateRuntimeBrokerRegistryMatch({
      abiVersion: entry.abiVersion,
      language: {
        id: entry.languageId,
        version: entry.languageVersion,
      },
      adapter: {
        id: entry.adapterId,
        version: entry.adapterVersion,
      },
      package: {
        mode: entry.packagePolicy,
        entrypoint: "default",
      },
      requiredCapabilities: [],
      limits: registryEntry.limits,
    })
    if (issues.length > 0) {
      throw new Error(`v1.17 runtime broker cannot validate ${key}`)
    }
  }

  const missing = [...registryByKey.keys()].filter(
    (key) => !artifactKeys.has(key),
  )
  if (missing.length > 0) {
    throw new Error(
      `v1.17 runtime broker artifact missing registry entries ${missing.join(", ")}`,
    )
  }
  const pythonEntry = [...registryByKey.values()].find(
    (entry) => entry.languageId === "python",
  )
  if (
    !pythonEntry ||
    pythonEntry.enabledForNormalPlay ||
    pythonEntry.countedResultsAllowed
  ) {
    throw new Error("Python runtime broker entry must remain non-counted")
  }
  return `${artifact.entries.length} v1.17 runtime broker registry entries checked`
}

const checkV118IsolationBaselineArtifact = (): string => {
  const artifact = readJson<{
    schemaVersion?: unknown
    milestone?: unknown
    baselineInheritedFrom?: unknown
    normalTopology?: unknown
    productionSandboxCertified?: unknown
    pythonCountedEligible?: unknown
    pythonRankedEligible?: unknown
    silentFallbackAllowed?: unknown
    threatCategories?: unknown
    promotionGates?: unknown
  }>(".planning/artifacts/v1.18-isolation-baseline.json")
  if (artifact.schemaVersion !== "v1.18-isolation-baseline") {
    throw new Error("v1.18 isolation baseline schema drifted")
  }
  if (
    artifact.milestone !== "v1.18" ||
    artifact.baselineInheritedFrom !== "v1.17"
  ) {
    throw new Error("v1.18 isolation baseline must inherit from v1.17")
  }
  if (
    artifact.normalTopology !==
    "web frontend -> Go backend -> Strategy Execution Service / Runtime Broker -> isolated runtime implementation(s)"
  ) {
    throw new Error("v1.18 normal topology drifted")
  }
  for (const [field, value] of [
    ["productionSandboxCertified", artifact.productionSandboxCertified],
    ["pythonCountedEligible", artifact.pythonCountedEligible],
    ["pythonRankedEligible", artifact.pythonRankedEligible],
    ["silentFallbackAllowed", artifact.silentFallbackAllowed],
  ]) {
    if (value !== false) {
      throw new Error(`v1.18 isolation baseline ${field} must be false`)
    }
  }
  const threats = new Set(
    stringArray(artifact.threatCategories, "v1.18 threatCategories"),
  )
  for (const required of [
    "filesystem",
    "network",
    "package-import",
    "shell-process",
    "environment",
    "memory-output",
    "timeout",
    "crash-malformed-ipc",
    "stderr-stack-path-redaction",
    "public-output-privacy",
  ]) {
    if (!threats.has(required)) {
      throw new Error(`v1.18 isolation baseline missing threat ${required}`)
    }
  }
  const gates = requireRecord(artifact.promotionGates, "v1.18 promotionGates")
  if (
    gates.pythonExhibitionBeta !== "signed-in-proof-and-monitors" ||
    gates.productionSandboxCertification !== "out-of-scope-evidence-only"
  ) {
    throw new Error("v1.18 promotion gates drifted")
  }
  const markdown = readFileSync(
    path.join(repoRoot, ".planning/artifacts/v1.18-isolation-baseline.md"),
    "utf8",
  )
  for (const required of [
    "non-counted exhibition beta",
    "not production sandbox certification",
    "no silent fallback",
    "JS/TS support remains intact",
  ]) {
    if (!markdown.includes(required)) {
      throw new Error(`v1.18 isolation baseline markdown missing ${required}`)
    }
  }
  return `${threats.size} v1.18 threat categories and promotion gates checked`
}

const checkV118RuntimeIsolationSources = (): string => {
  const runtimeHostConfig = readFileSync(
    path.join(repoRoot, "packages/runtime-python/src/python-host-config.ts"),
    "utf8",
  )
  const adapter = readFileSync(
    path.join(
      repoRoot,
      "packages/runtime-python/src/python-subprocess-adapter.ts",
    ),
    "utf8",
  )
  const validation = readFileSync(
    path.join(repoRoot, "packages/runtime-python/src/validation.ts"),
    "utf8",
  )
  const validationHost = readFileSync(
    path.join(
      repoRoot,
      "packages/runtime-python/src/python_validation_host.py",
    ),
    "utf8",
  )
  const goBackend = readFileSync(
    path.join(repoRoot, "apps/go-backend/live_backend.go"),
    "utf8",
  )
  const workshop = readFileSync(
    path.join(repoRoot, "apps/web/app/workshop/workshop-client.tsx"),
    "utf8",
  )
  const proof = readFileSync(
    path.join(repoRoot, "apps/web/e2e/v1-18-exhibition-proof.spec.ts"),
    "utf8",
  )

  for (const [label, text, markers] of [
    [
      "python host config",
      runtimeHostConfig,
      ["Object.freeze({})", '"-I"', "pythonIsolatedHostArgs"],
    ],
    [
      "python adapter",
      adapter,
      ["shell: false", "STDIO_CAP_EXCEEDED", "MALFORMED_IPC"],
    ],
    [
      "python validation",
      validation,
      ["python_validation_host.py", "spawnSync", "NON_COUNTED_RUNTIME"],
    ],
    [
      "python validation host",
      validationHost,
      ["ast.parse", "compile(tree", "visit_Import"],
    ],
    [
      "Go Python revision metadata",
      goBackend,
      ["SourceFormat", "pythonRuntimeMetadata", "validatePythonSourceMetadata"],
    ],
    [
      "web Python label",
      workshop,
      ["PY beta", "non-counted exhibition beta", "sourceFormat"],
    ],
    [
      "signed-in exhibition proof",
      proof,
      ["RUN_V1_18_PROOF", 'sourceFormat: "python"', "run-once", "Replay"],
    ],
  ] as const) {
    for (const marker of markers) {
      if (!text.includes(marker)) {
        throw new Error(`${label} missing v1.18 marker ${marker}`)
      }
    }
  }
  return "v1.18 runtime hardening, validation, account revision, label, and proof sources checked"
}

const checkV118ExhibitionProofArtifact = (): string => {
  const artifact = readJson<{
    schemaVersion?: unknown
    matchSetId?: unknown
    matchIds?: unknown
    flow?: unknown
    runtimeViolations?: unknown
    boardVisible?: unknown
    publicPrivateLeakMarkers?: unknown
  }>(".planning/artifacts/v1.18-exhibition-beta-proof.json")
  if (artifact.schemaVersion !== "v1.18-exhibition-beta-proof") {
    throw new Error("v1.18 exhibition proof schema drifted")
  }
  if (
    typeof artifact.matchSetId !== "string" ||
    !artifact.matchSetId.startsWith("match-set:exhibition:")
  ) {
    throw new Error("v1.18 exhibition proof missing MatchSet id")
  }
  if (stringArray(artifact.matchIds, "v1.18 proof matchIds").length < 2) {
    throw new Error("v1.18 exhibition proof must include at least two Matches")
  }
  const flow = new Set(stringArray(artifact.flow, "v1.18 proof flow"))
  for (const required of [
    "sign-up",
    "save-js-ts-account-revision",
    "save-python-account-revision",
    "create-non-counted-exhibition",
    "execute-through-go-runtime-service-runtime-implementation",
    "open-replay-evidence",
  ]) {
    if (!flow.has(required)) {
      throw new Error(`v1.18 exhibition proof missing flow step ${required}`)
    }
  }
  if (artifact.runtimeViolations !== 0 || artifact.boardVisible !== true) {
    throw new Error(
      "v1.18 exhibition proof must be realistic and replay-visible",
    )
  }
  if (
    stringArray(
      artifact.publicPrivateLeakMarkers,
      "v1.18 proof publicPrivateLeakMarkers",
    ).length !== 0
  ) {
    throw new Error("v1.18 exhibition proof leaked private markers")
  }
  return `${stringArray(artifact.matchIds, "v1.18 proof matchIds").length} v1.18 proof Matches checked`
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
  const containerReport = readJson<SandboxEvaluationReport>(
    sandboxEvaluationContainerArtifactPath,
  )
  const readiness = readJson<{
    schemaVersion?: unknown
    generatedAt?: unknown
    abiVersion?: unknown
    promotionAllowed?: unknown
    readinessLanes?: unknown
    noFallbackDrills?: unknown
    candidates?: unknown
  }>(v120ReadinessArtifactPath)
  const containerReadiness = readJson<{
    schemaVersion?: unknown
    generatedAt?: unknown
    abiVersion?: unknown
    candidates?: unknown
    containerControlEvidence?: unknown
  }>(v120ContainerReadinessArtifactPath)
  const budgets = readJson<{
    schemaVersion?: unknown
    deterministicStrategyCapsPreserved?: unknown
    measurementPlan?: unknown
    budgets?: unknown
  }>(v120BudgetArtifactPath)
  const retrySemantics = readJson<{
    schemaVersion?: unknown
    playerCausedFailuresAreNotBlindlyRetried?: unknown
    deterministicStrategyCapsPreserved?: unknown
    jsTsSupportPreserved?: unknown
    pythonStatus?: unknown
    pythonCountedEligibility?: unknown
    publicEvidencePrivateDataSafe?: unknown
    productionSandboxCertification?: unknown
    productionSandboxPromoted?: unknown
    retryableSystemFailures?: unknown
    internalRuntimeAdapterFailureCodes?: unknown
    internalRuntimeAdapterFailureHandling?: unknown
    nonRetryableFailures?: unknown
    ownership?: unknown
  }>(v120RetryArtifactPath)
  const hostileProbeEvidence = readJson<{
    schemaVersion?: unknown
    generatedAt?: unknown
    lanes?: unknown
    noFallbackDrills?: unknown
    redaction?: unknown
  }>(v120HostileProbeArtifactPath)
  const containerHostileProbeEvidence = readJson<{
    schemaVersion?: unknown
    generatedAt?: unknown
    lanes?: unknown
  }>(v120ContainerHostileProbeArtifactPath)
  const signedInProof = readJson<{
    schemaVersion?: unknown
    boundedRepeatCount?: unknown
    cycles?: unknown
    totals?: unknown
    runtimePath?: unknown
    runtimeServiceAdapterEvidence?: unknown
    candidateEvidence?: unknown
    promotionDecision?: unknown
  }>(v120SignedInReliabilityProofArtifactPath)
  const markdown = readFileSync(
    path.join(repoRoot, v120ReadinessMarkdownPath),
    "utf8",
  )
  const budgetMarkdown = readFileSync(
    path.join(repoRoot, v120BudgetMarkdownPath),
    "utf8",
  )
  const retryMarkdown = readFileSync(
    path.join(repoRoot, v120RetryMarkdownPath),
    "utf8",
  )
  const hostileProbeMarkdown = readFileSync(
    path.join(repoRoot, v120HostileProbeMarkdownPath),
    "utf8",
  )
  const signedInProofMarkdown = readFileSync(
    path.join(repoRoot, v120SignedInReliabilityProofMarkdownPath),
    "utf8",
  )
  assertSandboxEvaluationPublicSafe(report)
  assertRuntimeIsolationReadinessGuardrails(report)
  assertSandboxEvaluationPublicSafe(containerReport)
  assertRuntimeIsolationReadinessGuardrails(containerReport)
  if (readiness.schemaVersion !== "v1.20-runtime-sandbox-candidate-readiness") {
    throw new Error("v1.20 runtime candidate readiness schema drifted")
  }
  if (
    containerReadiness.schemaVersion !==
    "v1.20-runtime-sandbox-candidate-readiness"
  ) {
    throw new Error("v1.20 container readiness schema drifted")
  }
  if (
    readiness.generatedAt !== report.generatedAt ||
    readiness.abiVersion !== report.abiVersion
  ) {
    throw new Error("v1.20 readiness artifact is stale against base report")
  }
  if (
    containerReadiness.generatedAt !== containerReport.generatedAt ||
    containerReadiness.abiVersion !== containerReport.abiVersion
  ) {
    throw new Error(
      "v1.20 container readiness artifact is stale against container report",
    )
  }
  if (readiness.promotionAllowed !== false) {
    throw new Error("v1.20 runtime readiness must not promote sandbox status")
  }
  if (
    budgets.schemaVersion !== "v1.20-runtime-reliability-budgets" ||
    budgets.deterministicStrategyCapsPreserved !== true
  ) {
    throw new Error("v1.20 runtime reliability budget schema drifted")
  }
  if (
    retrySemantics.schemaVersion !==
      "v1.20-exhibition-reliability-retry-semantics" ||
    retrySemantics.playerCausedFailuresAreNotBlindlyRetried !== true ||
    retrySemantics.deterministicStrategyCapsPreserved !== true ||
    retrySemantics.jsTsSupportPreserved !== true ||
    retrySemantics.pythonStatus !== "non-counted exhibition beta only" ||
    retrySemantics.pythonCountedEligibility !== false ||
    retrySemantics.publicEvidencePrivateDataSafe !== true ||
    retrySemantics.productionSandboxCertification !== false ||
    retrySemantics.productionSandboxPromoted !== false
  ) {
    throw new Error("v1.20 retry semantics schema drifted")
  }
  const retryOwnership = retrySemantics.ownership as
    | {
        retryPolicyOwner?: unknown
        matchCompletionOwner?: unknown
        scoringOwner?: unknown
        publicEvidenceOwner?: unknown
        pythonOwnsBackendBehavior?: unknown
      }
    | undefined
  if (
    retryOwnership?.retryPolicyOwner !== "Go backend job lifecycle" ||
    retryOwnership.matchCompletionOwner !== "Go backend" ||
    retryOwnership.scoringOwner !== "Go backend" ||
    retryOwnership.pythonOwnsBackendBehavior !== false ||
    typeof retryOwnership.publicEvidenceOwner !== "string" ||
    !retryOwnership.publicEvidenceOwner.includes("Go backend")
  ) {
    throw new Error("v1.20 retry ownership guardrails drifted")
  }
  if (
    hostileProbeEvidence.schemaVersion !==
    "v1.20-hostile-probe-no-fallback-evidence"
  ) {
    throw new Error("v1.20 hostile probe/no-fallback schema drifted")
  }
  if (
    containerHostileProbeEvidence.schemaVersion !==
    "v1.20-hostile-probe-no-fallback-evidence"
  ) {
    throw new Error("v1.20 container hostile probe schema drifted")
  }
  if (signedInProof.schemaVersion !== "v1.20-signed-in-reliability-proof") {
    throw new Error("v1.20 signed-in reliability proof schema drifted")
  }
  if (hostileProbeEvidence.generatedAt !== report.generatedAt) {
    throw new Error("v1.20 hostile probe artifact is stale against base report")
  }
  if (
    containerHostileProbeEvidence.generatedAt !== containerReport.generatedAt
  ) {
    throw new Error(
      "v1.20 container hostile probe artifact is stale against container report",
    )
  }
  const proofTotals = signedInProof.totals as
    | {
        matchSetCount?: unknown
        workerIterations?: unknown
        privateMarkerScanPassed?: unknown
        jsTsRegressionChecked?: unknown
        pythonVsPythonChecked?: unknown
        mixedJsTsVsPythonChecked?: unknown
      }
    | undefined
  if (
    signedInProof.boundedRepeatCount !== 3 ||
    proofTotals?.matchSetCount !== 6 ||
    proofTotals.privateMarkerScanPassed !== true ||
    proofTotals.jsTsRegressionChecked !== true ||
    proofTotals.pythonVsPythonChecked !== true ||
    proofTotals.mixedJsTsVsPythonChecked !== true ||
    typeof proofTotals.workerIterations !== "number" ||
    proofTotals.workerIterations < 18 ||
    proofTotals.workerIterations > 54
  ) {
    throw new Error("v1.20 signed-in reliability proof totals drifted")
  }
  if (
    typeof signedInProof.runtimePath !== "string" ||
    !signedInProof.runtimePath.includes("Go backend") ||
    !signedInProof.runtimePath.includes("Runtime Broker") ||
    signedInProof.runtimeServiceAdapterEvidence !== "container-subprocess"
  ) {
    throw new Error("v1.20 signed-in proof runtime path evidence drifted")
  }
  const proofPromotion = signedInProof.promotionDecision as
    | { pythonStatus?: unknown; runtimeIsolationStatus?: unknown }
    | undefined
  if (
    proofPromotion?.pythonStatus !== "non-counted exhibition beta only" ||
    typeof proofPromotion.runtimeIsolationStatus !== "string" ||
    !proofPromotion.runtimeIsolationStatus.includes(
      "no production sandbox certification",
    )
  ) {
    throw new Error("v1.20 signed-in proof promotion decision drifted")
  }
  const proofCandidateEvidence = signedInProof.candidateEvidence as
    | {
        containerReadiness?: { schemaVersion?: unknown }
        runscFailLoud?: unknown
      }
    | undefined
  if (
    proofCandidateEvidence?.containerReadiness?.schemaVersion !==
      "v1.20-runtime-sandbox-candidate-readiness" ||
    typeof proofCandidateEvidence.runscFailLoud !== "string" ||
    !proofCandidateEvidence.runscFailLoud.includes("fail-loud")
  ) {
    throw new Error("v1.20 signed-in proof candidate evidence drifted")
  }
  const proofCycles = signedInProof.cycles as
    | {
        cycle?: unknown
        settleMs?: unknown
        workerStatuses?: unknown
        exhibitions?: unknown
      }[]
    | undefined
  if (!Array.isArray(proofCycles) || proofCycles.length !== 3) {
    throw new Error("v1.20 signed-in proof cycle count drifted")
  }
  for (const cycle of proofCycles) {
    if (
      typeof cycle.cycle !== "number" ||
      typeof cycle.settleMs !== "number" ||
      cycle.settleMs <= 0 ||
      cycle.settleMs > 180_000 ||
      !Array.isArray(cycle.workerStatuses)
    ) {
      throw new Error("v1.20 signed-in proof cycle timing drifted")
    }
    const exhibitions = cycle.exhibitions as
      | {
          matchup?: unknown
          matchSetId?: unknown
          observedStatus?: unknown
          observedMatchStatuses?: unknown
          resultPageMs?: unknown
          replayPageMs?: unknown
        }[]
      | undefined
    if (!Array.isArray(exhibitions) || exhibitions.length !== 2) {
      throw new Error("v1.20 signed-in proof exhibition count drifted")
    }
    const matchups = new Set(
      exhibitions.map((exhibition) => exhibition.matchup),
    )
    for (const matchup of ["js-ts-vs-python", "python-vs-python"]) {
      if (!matchups.has(matchup)) {
        throw new Error(`v1.20 signed-in proof missing ${matchup}`)
      }
    }
    for (const exhibition of exhibitions) {
      if (
        typeof exhibition.matchSetId !== "string" ||
        exhibition.observedStatus !== "complete" ||
        !Array.isArray(exhibition.observedMatchStatuses) ||
        exhibition.observedMatchStatuses.some(
          (status) => status !== "complete",
        ) ||
        typeof exhibition.resultPageMs !== "number" ||
        exhibition.resultPageMs <= 0 ||
        typeof exhibition.replayPageMs !== "number" ||
        exhibition.replayPageMs <= 0
      ) {
        throw new Error("v1.20 signed-in proof exhibition evidence drifted")
      }
    }
  }
  const lanes = stringArray(
    (readiness.readinessLanes as { id?: unknown }[] | undefined)?.map(
      (lane) => lane.id,
    ) ?? [],
    "v1.20 readiness lanes",
  )
  for (const lane of [
    "default-readiness",
    "container-required",
    "runsc-required",
  ]) {
    if (!lanes.includes(lane)) {
      throw new Error(`v1.20 readiness missing lane ${lane}`)
    }
  }
  const budgetIds = stringArray(
    (budgets.budgets as { id?: unknown }[] | undefined)?.map(
      (budget) => budget.id,
    ) ?? [],
    "v1.20 runtime reliability budgets",
  )
  for (const budget of [
    "strategy-call",
    "match-execution",
    "matchset-job-orchestration",
    "runtime-service-http",
    "browser-proof",
  ]) {
    if (!budgetIds.includes(budget)) {
      throw new Error(`v1.20 reliability budgets missing ${budget}`)
    }
  }
  const budgetEntries = budgets.budgets as
    | { id?: unknown; defaultBudgetMs?: unknown; adjustableInV120?: unknown }[]
    | undefined
  const strategyCallBudget = budgetEntries?.find(
    (budget) => budget.id === "strategy-call",
  )
  if (
    strategyCallBudget?.defaultBudgetMs !== 1000 ||
    strategyCallBudget.adjustableInV120 !== false
  ) {
    throw new Error("v1.20 Strategy call budget drifted")
  }
  const measurementPlan = budgets.measurementPlan as
    | {
        boundedRepeatCount?: unknown
        matchups?: unknown
        timingSegments?: unknown
        stressTest?: unknown
      }
    | undefined
  if (
    measurementPlan?.boundedRepeatCount !== 3 ||
    measurementPlan.stressTest !== false
  ) {
    throw new Error("v1.20 reliability measurement plan drifted")
  }
  const timingSegments = stringArray(
    measurementPlan?.timingSegments ?? [],
    "v1.20 timing segments",
  )
  for (const segment of [
    "cold-start",
    "per-call-runtime",
    "whole-match",
    "job-orchestration",
    "result-page",
    "replay-page",
  ]) {
    if (!timingSegments.includes(segment)) {
      throw new Error(`v1.20 reliability missing timing segment ${segment}`)
    }
  }
  const retryable = stringArray(
    retrySemantics.retryableSystemFailures ?? [],
    "v1.20 retryable failures",
  )
  const nonRetryable = stringArray(
    retrySemantics.nonRetryableFailures ?? [],
    "v1.20 non-retryable failures",
  )
  const internalAdapterFailureCodes = stringArray(
    retrySemantics.internalRuntimeAdapterFailureCodes ?? [],
    "v1.20 internal adapter failure codes",
  )
  for (const failure of [
    "RuntimeServiceStopped",
    "RuntimeServiceTimeout",
    "RuntimeServiceTransport",
    "RuntimeServiceRead",
    "RuntimeServiceOversizedResponse",
    "RuntimeServiceMalformedResponse",
    "RuntimeServiceContractMismatch(response-side)",
    "EXECUTION_EXCEPTION",
    "RESPONSE_SCHEMA_INVALID",
  ]) {
    if (!retryable.includes(failure)) {
      throw new Error(`v1.20 retry semantics missing retryable ${failure}`)
    }
  }
  for (const failure of [
    "SPAWN_FAILED",
    "STDIO_CAP_EXCEEDED",
    "SUBPROCESS_SIGNAL",
    "SUBPROCESS_EXIT",
    "MALFORMED_IPC",
  ]) {
    if (retryable.includes(failure)) {
      throw new Error(
        `v1.20 retry semantics must not list internal adapter code ${failure} as a Go retry class`,
      )
    }
    if (!internalAdapterFailureCodes.includes(failure)) {
      throw new Error(
        `v1.20 retry semantics missing internal adapter code ${failure}`,
      )
    }
  }
  if (
    typeof retrySemantics.internalRuntimeAdapterFailureHandling !== "string" ||
    !retrySemantics.internalRuntimeAdapterFailureHandling.includes(
      "not Go retry classes by name",
    ) ||
    !retrySemantics.internalRuntimeAdapterFailureHandling.includes(
      "EXECUTION_EXCEPTION",
    )
  ) {
    throw new Error("v1.20 internal adapter failure handling drifted")
  }
  for (const failure of [
    "RuntimeServiceRequestEncode",
    "RuntimeServiceRequestCreate",
    "RuntimeServiceContractMismatch(request/local validation)",
    "Strategy runtime violation",
    "invalid Strategy output",
    "RuntimeServiceSourceMismatch",
    "MALFORMED_REQUEST",
    "SOURCE_HASH_MISMATCH",
    "SOURCE_BYTES_MISMATCH",
    "UNSUPPORTED_RUNTIME_ADAPTER",
  ]) {
    if (!nonRetryable.includes(failure)) {
      throw new Error(`v1.20 retry semantics missing non-retryable ${failure}`)
    }
  }
  const drills = stringArray(
    (readiness.noFallbackDrills as { id?: unknown }[] | undefined)?.map(
      (drill) => drill.id,
    ) ?? [],
    "v1.20 no-fallback drills",
  )
  for (const drill of [
    "stopped-runtime-service",
    "stopped-python-runtime",
    "runsc-unavailable",
    "docker-or-image-unavailable",
    "stale-artifacts",
    "silent-substitution",
  ]) {
    if (!drills.includes(drill)) {
      throw new Error(`v1.20 readiness missing drill ${drill}`)
    }
  }
  const hostileLanes = stringArray(
    (hostileProbeEvidence.lanes as { id?: unknown }[] | undefined)?.map(
      (lane) => lane.id,
    ) ?? [],
    "v1.20 hostile probe lanes",
  )
  for (const lane of ["host-subprocess", "container-subprocess"]) {
    if (!hostileLanes.includes(lane)) {
      throw new Error(`v1.20 hostile probe evidence missing lane ${lane}`)
    }
  }
  const containerHostileLanes = stringArray(
    (
      containerHostileProbeEvidence.lanes as
        | { id?: unknown; status?: unknown; summary?: unknown }[]
        | undefined
    )?.map((lane) => lane.id) ?? [],
    "v1.20 container hostile probe lanes",
  )
  for (const lane of ["host-subprocess", "container-subprocess"]) {
    if (!containerHostileLanes.includes(lane)) {
      throw new Error(
        `v1.20 container hostile probe evidence missing lane ${lane}`,
      )
    }
  }
  const hostileDrills = stringArray(
    (
      hostileProbeEvidence.noFallbackDrills as { id?: unknown }[] | undefined
    )?.map((drill) => drill.id) ?? [],
    "v1.20 hostile no-fallback drills",
  )
  for (const drill of [
    "docker-unavailable",
    "container-image-unavailable",
    "runsc-unavailable",
    "candidate-substitution",
  ]) {
    if (!hostileDrills.includes(drill)) {
      throw new Error(`v1.20 hostile evidence missing drill ${drill}`)
    }
  }
  for (const required of [
    "No candidate is promoted to production sandbox certification.",
    "Python remains non-counted exhibition beta only.",
    "gVisor/runsc required lane",
    "Docker/runc container subprocess is the selected executable candidate",
  ]) {
    if (!markdown.includes(required)) {
      throw new Error(`v1.20 readiness markdown missing ${required}`)
    }
  }
  for (const required of [
    "strategy-call",
    "runtime-service-http",
    "browser-proof",
    "Timing segments",
  ]) {
    if (!budgetMarkdown.includes(required)) {
      throw new Error(`v1.20 reliability budget markdown missing ${required}`)
    }
  }
  for (const required of [
    "Strategy runtime violations are not blindly retried.",
    "RuntimeServiceTimeout",
    "RuntimeServiceContractMismatch(response-side)",
    "RuntimeServiceContractMismatch(request/local validation)",
    "Internal Adapter Failure Codes",
    "not Go retry classes by name",
    "Python counted eligibility remains false.",
    "Public evidence remains private-data safe.",
    "Python remains non-counted exhibition beta only.",
    "no production sandbox certification",
    "Runtime sandbox production promotion remains false.",
  ]) {
    if (!retryMarkdown.includes(required)) {
      throw new Error(`v1.20 retry semantics markdown missing ${required}`)
    }
  }
  for (const required of [
    "Lane Parity",
    "candidate-substitution",
    "No production sandbox certification",
  ]) {
    if (!hostileProbeMarkdown.includes(required)) {
      throw new Error(`v1.20 hostile evidence markdown missing ${required}`)
    }
  }
  for (const required of [
    "Observed Exhibitions",
    "js-ts-vs-python",
    "python-vs-python",
    "non-counted exhibition beta only",
    "no production sandbox certification",
  ]) {
    if (!signedInProofMarkdown.includes(required)) {
      throw new Error(`v1.20 signed-in proof markdown missing ${required}`)
    }
  }
  const orchestratorSource = readFileSync(
    path.join(repoRoot, "apps/go-backend/orchestrator.go"),
    "utf8",
  )
  const orchestratorTestSource = readFileSync(
    path.join(repoRoot, "apps/go-backend/orchestrator_test.go"),
    "utf8",
  )
  for (const required of [
    "runtimeServiceLeaseGrace",
    "matchJobLeaseForRuntimeService()",
    "Lease:    matchJobLeaseForRuntimeService()",
  ]) {
    if (!orchestratorSource.includes(required)) {
      throw new Error(`v1.20 Go runtime lease source missing ${required}`)
    }
  }
  if (
    !orchestratorTestSource.includes("TestMatchJobLeaseForRuntimeServiceBudget")
  ) {
    throw new Error("v1.20 Go runtime lease test is missing")
  }
  const container = report.candidates.find(
    (candidate) => candidate.id === "container-subprocess",
  )
  const strictContainer = containerReport.candidates.find(
    (candidate) => candidate.id === "container-subprocess",
  )
  if (!container) {
    throw new Error(
      "container subprocess candidate missing from sandbox report",
    )
  }
  if (!strictContainer) {
    throw new Error("container subprocess candidate missing from strict report")
  }
  const readinessContainer = (
    readiness.candidates as
      | {
          id?: unknown
          status?: unknown
          supportedLocally?: unknown
          summary?: unknown
        }[]
      | undefined
  )?.find((candidate) => candidate.id === "container-subprocess")
  const strictReadinessContainer = (
    containerReadiness.candidates as
      | {
          id?: unknown
          status?: unknown
          supportedLocally?: unknown
          summary?: unknown
        }[]
      | undefined
  )?.find((candidate) => candidate.id === "container-subprocess")
  const baseHostileContainer = (
    hostileProbeEvidence.lanes as
      | { id?: unknown; status?: unknown; summary?: unknown }[]
      | undefined
  )?.find((lane) => lane.id === "container-subprocess")
  const strictHostileContainer = (
    containerHostileProbeEvidence.lanes as
      | { id?: unknown; status?: unknown; summary?: unknown }[]
      | undefined
  )?.find((lane) => lane.id === "container-subprocess")
  const assertCandidateMatches = (
    label: string,
    reportCandidate: typeof container,
    derivative:
      | { status?: unknown; supportedLocally?: unknown; summary?: unknown }
      | undefined,
  ): void => {
    if (!derivative) {
      throw new Error(`${label} missing derivative container candidate`)
    }
    if (
      derivative.status !== reportCandidate.status ||
      derivative.supportedLocally !== reportCandidate.supportedLocally ||
      JSON.stringify(derivative.summary) !==
        JSON.stringify(reportCandidate.summary)
    ) {
      throw new Error(`${label} derivative container candidate is stale`)
    }
  }
  const assertHostileLaneMatches = (
    label: string,
    reportCandidate: typeof container,
    lane: { status?: unknown; summary?: unknown } | undefined,
  ): void => {
    if (!lane) {
      throw new Error(`${label} missing hostile container lane`)
    }
    if (
      lane.status !== reportCandidate.status ||
      JSON.stringify(lane.summary) !== JSON.stringify(reportCandidate.summary)
    ) {
      throw new Error(`${label} hostile container lane is stale`)
    }
  }
  assertCandidateMatches("base readiness", container, readinessContainer)
  assertCandidateMatches(
    "strict readiness",
    strictContainer,
    strictReadinessContainer,
  )
  assertHostileLaneMatches(
    "base hostile evidence",
    container,
    baseHostileContainer,
  )
  assertHostileLaneMatches(
    "strict hostile evidence",
    strictContainer,
    strictHostileContainer,
  )
  if (strictContainer.status === "passed") {
    return `${report.runtimeIsolationReadiness.criteria.length} runtime isolation criteria checked with strict live container evidence, ${lanes.length} v1.20 readiness lanes, ${budgetIds.length} reliability budgets, and ${hostileLanes.length}/${containerHostileLanes.length} hostile probe lanes`
  }
  if (container.status !== "skipped" || strictContainer.status !== "skipped") {
    throw new Error(
      `container subprocess candidate has unexpected status base=${container.status} strict=${strictContainer.status}`,
    )
  }
  return `${report.runtimeIsolationReadiness.criteria.length} runtime isolation criteria checked; container evidence remains required before promotion; ${lanes.length} v1.20 readiness lanes, ${budgetIds.length} reliability budgets, and ${hostileLanes.length} hostile probe lanes checked`
}

const checkV119ExhibitionTrustSources = (): string => {
  const sources = [
    {
      label: "MatchSet evidence panel",
      path: "apps/web/app/matchsets/[matchSetId]/page.tsx",
      markers: [
        'data-testid="matchset-evidence-panel"',
        "Python · non-counted exhibition beta",
        "matchSetEvidenceRows",
      ],
    },
    {
      label: "Replay evidence panel",
      path: "apps/web/app/matches/[matchId]/replay/replay-client.tsx",
      markers: ['data-testid="replay-evidence-panel"', "replayEvidenceRows"],
    },
    {
      label: "Reliability evidence copy",
      path: "apps/web/app/matchsets/evidence-copy.ts",
      markers: [
        "Public runtime labels below; execution-path proof is gated.",
        "Replay DTO shows public outcome evidence, not runtime internals.",
        "runtime internals excluded",
      ],
    },
    {
      label: "Python sample catalog",
      path: "packages/persistence/src/workshop.ts",
      markers: [
        "sample:python-screen-and-stone",
        "sample:python-push-pressure",
        "sample:python-backstab-lane",
      ],
    },
    {
      label: "v1.19 signed-in proof",
      path: "apps/web/e2e/v1-19-exhibition-proof.spec.ts",
      markers: [
        "RUN_V1_19_PROOF",
        "v1.19 JS/TS proof revision",
        "v1.19 Python screen beta revision",
        "v1.19 Python pressure beta revision",
        "matchset-evidence-panel",
        "replay-evidence-panel",
      ],
    },
  ]
  for (const source of sources) {
    const content = readFileSync(path.join(repoRoot, source.path), "utf8")
    for (const marker of source.markers) {
      if (!content.includes(marker)) {
        throw new Error(`${source.label} missing v1.19 marker ${marker}`)
      }
    }
  }
  return `${sources.length} v1.19 exhibition trust source surfaces checked`
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
  assertReportOnlyBoundaryOffenseCount(analysis.reportOnlyOffenses.length)
  return `${analysis.reportOnlyOffenses.length}/${knownReportOnlyBoundaryOffenses.size} known broad web offenses remain baseline-gated`
}

const checkTopologyDiagnostics = async (): Promise<string> => {
  const requireLiveTopology = process.env.COWARDS_REQUIRE_LIVE_TOPOLOGY === "1"
  const strictOptions = requireLiveTopology
    ? parseTopologyOptions(["--require-v1-16-no-typescript-backend"])
    : parseTopologyOptions([])
  const checks = await evaluateLocalTopology({
    ...strictOptions,
    webUrl: process.env.COWARDS_WEB_URL ?? strictOptions.webUrl,
    goUrl: process.env.COWARDS_GO_BACKEND_URL ?? strictOptions.goUrl,
    runtimeServiceUrl:
      process.env.COWARDS_RUNTIME_SERVICE_URL ??
      strictOptions.runtimeServiceUrl,
    json: false,
  })
  assertMonitorPublicPayload(checks)
  const failures = checks.filter((item) => !item.ok)
  if (failures.length > 0) {
    throw new Error(
      `live v1.15 topology checks failed: ${failures.map((item) => item.name).join(", ")}`,
    )
  }
  return requireLiveTopology
    ? `${checks.length} required live v1.16 no-TypeScript-backend topology diagnostics checked`
    : `${checks.length} optional topology diagnostics checked; set COWARDS_REQUIRE_LIVE_TOPOLOGY=1 for live v1.16 strict mode`
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
  await check("runtime_adapter", "v1.17 runtime broker registry artifact", () =>
    checkRuntimeBrokerRegistryArtifact(),
  ),
  await check("runtime_adapter", "v1.18 isolation baseline artifact", () =>
    checkV118IsolationBaselineArtifact(),
  ),
  await check("runtime_isolation", "v1.18 runtime isolation sources", () =>
    checkV118RuntimeIsolationSources(),
  ),
  await check("runtime_isolation", "v1.18 exhibition proof artifact", () =>
    checkV118ExhibitionProofArtifact(),
  ),
  await check(
    "runtime_adapter",
    "v1.16 runtime service boundary artifact",
    () => checkV116RuntimeServiceBoundaryArtifact(),
  ),
  await check(
    "worker_quarantine",
    "v1.16 TypeScript worker quarantine artifact",
    () => checkV116TypeScriptWorkerQuarantineArtifact(),
  ),
  await check(
    "worker_quarantine",
    "TypeScript worker and lifecycle quarantine source",
    () => checkTypeScriptWorkerQuarantineSource(),
  ),
  await check("surface_labels", "v1.16 final TypeScript surface labels", () =>
    checkV116FinalTypeScriptSurfaceLabels(),
  ),
  await check("runtime_adapter", "runtime service production authority", () =>
    checkRuntimeServiceProductionAuthority(),
  ),
  await check(
    "runtime_adapter",
    "no Strategy execution outside runtime boundary",
    () => checkNoStrategyExecutionOutsideRuntimeBoundary(),
  ),
  await check(
    "runtime_isolation",
    "runtime isolation readiness guardrails",
    () => checkRuntimeIsolationReadiness(),
  ),
  await check("runtime_isolation", "v1.19 exhibition trust sources", () =>
    checkV119ExhibitionTrustSources(),
  ),
  await check("non_js_runtime", "experimental non-JS guardrails", () =>
    checkNonJsRuntimeGuardrails(),
  ),
  await check("go_parity", "Go route manifest metadata", () =>
    checkGoRouteManifest(),
  ),
  await check("go_promotion", "v1.16 selected Go route manifest", () =>
    checkSelectedGoRouteManifest(),
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
  await check("go_promotion", "v1.15 lifecycle ownership manifest", () =>
    checkV115LifecycleOwnershipManifest(),
  ),
  await check("topology", "v1.16 no-TypeScript-backend topology artifact", () =>
    validateV116NoTypeScriptBackendTopologyArtifact(),
  ),
  await check("topology", "live v1.15 topology diagnostics", () =>
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
