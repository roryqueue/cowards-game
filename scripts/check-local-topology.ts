#!/usr/bin/env -S pnpm exec tsx
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createWorkerRuntimeConfig } from "../apps/worker/src/runtime-config.ts"
import {
  assertRequiredSandboxCandidatesPassed,
  assertRuntimeIsolationReadinessGuardrails,
  evaluateRuntimeSandboxes,
} from "../packages/runtime-js/src/sandbox-evaluation.ts"
import { createCowardsLocalService } from "../packages/service/src/index.ts"
import {
  SERVICE_API_VERSION,
  STRATEGY_RUNTIME_ABI_VERSION,
  PublicLadderPageServiceDtoSchema,
  PublicPlayerPageServiceDtoSchema,
  PublicReplayEvidenceServiceDtoSchema,
  assertPublicOutputLeakSafe,
  assertPublicServiceDtoLeakSafe,
} from "../packages/spec/src/index.ts"

type Layer =
  | "env_setup"
  | "fixture_loading"
  | "typescript_service"
  | "worker_runtime"
  | "runtime_isolation"
  | "runtime_service"
  | "go_lifecycle"
  | "web_process"
  | "web_page_smoke"
  | "web_go_read"
  | "go_readonly"
  | "v115_topology"
  | "failure_drill"
  | "rollback"
  | "promotion_gate"
  | "privacy"

interface TopologyCheck {
  layer: Layer
  name: string
  required: boolean
  ok: boolean
  detail: string
}

interface TopologyOptions {
  webUrl: string | null
  goUrl: string | null
  runtimeServiceUrl: string | null
  requireWeb: boolean
  requireWebPageSmoke: boolean
  requireGo: boolean
  requireWebGoPublicStrategyRead: boolean
  requireRuntimeService: boolean
  requireRuntimeContainer: boolean
  requireV115Lifecycle: boolean
  json: boolean
}

interface RouteManifestEntry {
  id: string
  method: string
  samplePath: string
  authScope: string
  privacyClass: string
  requiresBearerToken?: boolean
}

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

const privateMarkers = [
  "Strategy source",
  "StrategyMemory",
  "SoldierMemory",
  "objective payload",
  "owner debug",
  "privateDiagnostics",
  "sourceText",
  "process.env",
  "stack trace",
  "stderr",
] as const

const localCommands = [
  "pnpm services:up",
  "pnpm dev",
  "pnpm --filter @cowards/worker dev",
  "pnpm --filter @cowards/runtime-service start",
  "cd apps/go-backend && COWARDS_GO_BACKEND_OWNER_TOKENS=<secret>=user:local go run .",
  "cd apps/go-backend && COWARDS_GO_BACKEND_DATA_MODE=live redacted-db-env COWARDS_RUNTIME_SERVICE_URL=http://127.0.0.1:3107 go run .",
  "cd apps/go-backend && redacted-local-test-db-env go test ./... -run TestGoMatchOrchestratorIntegration",
  "pnpm sandbox:evaluate:container",
  "pnpm topology:check -- --web-url http://localhost:3000 --go-url http://127.0.0.1:8087",
  "pnpm topology:check -- --require-web-page-smoke --web-url http://localhost:3000",
  "pnpm topology:check -- --require-v1-15-lifecycle --json",
  "COWARDS_GO_PUBLIC_STRATEGY_READS=1 COWARDS_GO_BACKEND_URL=http://127.0.0.1:8087 pnpm --filter @cowards/web dev",
  "pnpm topology:check -- --require-web-go-public-strategy-read --web-url http://localhost:3000",
] as const

const sensitiveQueryKeys = new Set([
  "access_token",
  "api_key",
  "auth",
  "authorization",
  "bearer",
  "key",
  "password",
  "secret",
  "session",
  "token",
])

export const parseTopologyOptions = (argv: string[]): TopologyOptions => {
  const options: TopologyOptions = {
    webUrl: process.env.COWARDS_WEB_URL ?? null,
    goUrl: process.env.COWARDS_GO_BACKEND_URL ?? null,
    runtimeServiceUrl: process.env.COWARDS_RUNTIME_SERVICE_URL ?? null,
    requireWeb: false,
    requireWebPageSmoke: false,
    requireGo: false,
    requireWebGoPublicStrategyRead: false,
    requireRuntimeService: false,
    requireRuntimeContainer: false,
    requireV115Lifecycle: false,
    json: false,
  }
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    switch (arg) {
      case "--":
        break
      case "--json":
        options.json = true
        break
      case "--require-web":
        options.requireWeb = true
        options.webUrl ??= "http://localhost:3000"
        break
      case "--require-web-page-smoke":
        options.requireWebPageSmoke = true
        options.requireWeb = true
        options.webUrl ??= "http://localhost:3000"
        break
      case "--require-go":
        options.requireGo = true
        options.goUrl ??= "http://127.0.0.1:8087"
        break
      case "--require-web-go-public-strategy-read":
        options.requireWebGoPublicStrategyRead = true
        options.requireWeb = true
        options.requireGo = true
        options.webUrl ??= "http://localhost:3000"
        options.goUrl ??= "http://127.0.0.1:8087"
        break
      case "--require-runtime-container":
        options.requireRuntimeContainer = true
        break
      case "--require-runtime-service":
        options.requireRuntimeService = true
        options.runtimeServiceUrl ??= "http://127.0.0.1:3107"
        break
      case "--require-v1-15-lifecycle":
        options.requireV115Lifecycle = true
        options.requireWeb = true
        options.requireWebPageSmoke = true
        options.requireGo = true
        options.requireWebGoPublicStrategyRead = true
        options.requireRuntimeService = true
        options.webUrl ??= "http://localhost:3000"
        options.goUrl ??= "http://127.0.0.1:8087"
        options.runtimeServiceUrl ??= "http://127.0.0.1:3107"
        break
      case "--web-url":
        options.webUrl = requireOptionValue(argv, index, arg)
        index += 1
        break
      case "--go-url":
        options.goUrl = requireOptionValue(argv, index, arg)
        index += 1
        break
      case "--runtime-service-url":
        options.runtimeServiceUrl = requireOptionValue(argv, index, arg)
        index += 1
        break
      default:
        throw new Error(`Unknown topology option: ${arg}`)
    }
  }
  return options
}

const requireOptionValue = (
  argv: string[],
  index: number,
  flag: string,
): string => {
  const value = argv[index + 1]
  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} requires a URL value`)
  }
  return value
}

export const sanitizeDiagnosticUrl = (raw: string): string => {
  try {
    const url = new URL(raw)
    url.username = ""
    url.password = ""
    for (const key of [...url.searchParams.keys()]) {
      if (sensitiveQueryKeys.has(key.toLowerCase())) {
        url.searchParams.set(key, "[redacted]")
      }
    }
    return url.href
  } catch {
    return raw
  }
}

export const safeDetail = (detail: string): string => {
  let next = detail
  for (const marker of privateMarkers) {
    next = next.split(marker).join("[redacted]")
  }
  next = next.replace(/https?:\/\/[^\s|]+/gi, (match) =>
    sanitizeDiagnosticUrl(match),
  )
  return next.replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
}

const check = async (
  layer: Layer,
  name: string,
  required: boolean,
  run: () => Promise<string> | string,
): Promise<TopologyCheck> => {
  try {
    return { layer, name, required, ok: true, detail: safeDetail(await run()) }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { layer, name, required, ok: false, detail: safeDetail(message) }
  }
}

const readJson = <T>(relativePath: string): T =>
  JSON.parse(readFileSync(path.join(repoRoot, relativePath), "utf8")) as T

const routeManifestPath =
  "apps/go-backend/testdata/service-fixtures/route-manifest.json"
const v115TopologyArtifactPath =
  ".planning/artifacts/v1.15-live-web-go-runtime-topology.json"
const v115FailureDrillsArtifactPath =
  ".planning/artifacts/v1.15-failure-drills.json"
const v115PromotionDecisionPath =
  ".planning/artifacts/v1.15-promotion-decision.md"
const v115TypeScriptSurfaceLabelsPath =
  ".planning/artifacts/v1.15-typescript-surface-labels.json"
const v115GoOrchestrationEvidencePath =
  ".planning/artifacts/v1.15-go-orchestration-e2e.json"

const routeManifest = (): RouteManifestEntry[] =>
  readJson<RouteManifestEntry[]>(routeManifestPath)

const sampleRoute = (id: string): RouteManifestEntry => {
  const route = routeManifest().find((entry) => entry.id === id)
  if (!route) {
    throw new Error(`Go route manifest missing ${id}`)
  }
  return route
}

const fetchJson = async (url: URL): Promise<unknown> => {
  const response = await fetch(url)
  const body = await parseResponseJson(response, url)
  if (!response.ok) {
    throw new Error(
      `${sanitizeDiagnosticUrl(url.href)} returned HTTP ${response.status}`,
    )
  }
  return body
}

const parseResponseJson = async (
  response: Response,
  url: URL,
): Promise<unknown> => {
  const text = await response.text()
  try {
    return text.length ? JSON.parse(text) : null
  } catch {
    throw new Error(
      `${sanitizeDiagnosticUrl(url.href)} returned non-JSON response`,
    )
  }
}

const smokeJson = async (
  baseUrl: string,
  samplePath: string,
): Promise<unknown> => fetchJson(new URL(samplePath, baseUrl))

interface WebPageSmokeTarget {
  name: string
  path: string
  expectedText: readonly string[]
}

const webPageSmokeTargets: readonly WebPageSmokeTarget[] = [
  {
    name: "Workshop",
    path: "/",
    expectedText: ["Strategy Workshop"],
  },
  {
    name: "Sign in",
    path: "/auth/sign-in",
    expectedText: ["Competitive Alpha", "Sign in"],
  },
  {
    name: "Sign up",
    path: "/auth/sign-up",
    expectedText: ["Competitive Alpha", "Create account"],
  },
  {
    name: "Account",
    path: "/account",
    expectedText: ["Competitive account"],
  },
  {
    name: "Exhibition creation",
    path: "/exhibitions/new",
    expectedText: ["Competitive Alpha"],
  },
  {
    name: "Workshop evidence",
    path: "/workshop/evidence",
    expectedText: ["Evidence Explorer"],
  },
  {
    name: "Public player",
    path: "/players/local",
    expectedText: ["Player profile", "Local Player"],
  },
  {
    name: "Public Strategy",
    path: "/strategies/strategy%3Ago-parity%3Asentinel",
    expectedText: ["Public Strategy card", "Go Parity Sentinel"],
  },
  {
    name: "Public ladder",
    path: "/ladder/ladder-season%3Ademo",
    expectedText: ["Competition Trust Beta", "Demo Trial Ladder"],
  },
  {
    name: "Public MatchSet",
    path: "/matchsets/match-set%3Ago-parity%3Agolden",
    expectedText: ["Competitive Alpha", "Smoke exhibition"],
  },
  {
    name: "Public replay",
    path: "/matches/golden%3Av1-7%3Amatch/replay",
    expectedText: ["Replay", "golden:v1-7:match"],
  },
] as const

const checkWebPageLoads = async (
  baseUrl: string,
  target: WebPageSmokeTarget,
): Promise<string> => {
  const url = new URL(target.path, baseUrl)
  const response = await fetch(url)
  const text = await response.text()
  if (!response.ok) {
    throw new Error(
      `${target.name} page ${sanitizeDiagnosticUrl(url.href)} returned HTTP ${response.status}`,
    )
  }
  for (const marker of [
    "Application error",
    "Unhandled Runtime Error",
    "PublicGoReadError",
  ]) {
    if (text.includes(marker)) {
      throw new Error(`${target.name} page rendered ${marker}`)
    }
  }
  for (const expected of target.expectedText) {
    if (!text.includes(expected)) {
      throw new Error(`${target.name} page did not include ${expected}`)
    }
  }
  return `${target.name} loaded ${target.path}`
}

const checkPublicPayload = (value: unknown): string => {
  assertPublicServiceDtoLeakSafe(value)
  const serialized = JSON.stringify(value)
  return `${serialized.length} public-safe bytes`
}

const checkPublicText = (value: string): string => {
  assertPublicOutputLeakSafe({ text: value }, "Public text artifact")
  for (const marker of privateMarkers) {
    if (value.includes(marker)) {
      throw new Error(`public text contains private marker ${marker}`)
    }
  }
  return `${value.length} public-safe text bytes`
}

const asRecord = (value: unknown, label: string): Record<string, unknown> => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`)
  }
  return value as Record<string, unknown>
}

const requireString = (
  value: Record<string, unknown>,
  key: string,
  label: string,
): string => {
  const entry = value[key]
  if (typeof entry !== "string" || entry.length === 0) {
    throw new Error(`${label}.${key} must be a non-empty string`)
  }
  return entry
}

const requireBoolean = (
  value: Record<string, unknown>,
  key: string,
  label: string,
): boolean => {
  const entry = value[key]
  if (typeof entry !== "boolean") {
    throw new Error(`${label}.${key} must be a boolean`)
  }
  return entry
}

const requireRecordArray = (
  value: Record<string, unknown>,
  key: string,
  label: string,
): Record<string, unknown>[] => {
  const entry = value[key]
  if (!Array.isArray(entry)) {
    throw new Error(`${label}.${key} must be an array`)
  }
  return entry.map((item, index) => asRecord(item, `${label}.${key}[${index}]`))
}

const requireStringArray = (
  value: Record<string, unknown>,
  key: string,
  label: string,
): string[] => {
  const entry = value[key]
  if (
    !Array.isArray(entry) ||
    !entry.every((item) => typeof item === "string")
  ) {
    throw new Error(`${label}.${key} must be a string array`)
  }
  return entry
}

const requireStepIds = (
  steps: Record<string, unknown>[],
  requiredIds: readonly string[],
): void => {
  const ids = new Set(
    steps.map((step) => requireString(step, "stepId", "step")),
  )
  for (const stepId of requiredIds) {
    if (!ids.has(stepId)) {
      throw new Error(`v1.15 topology missing step ${stepId}`)
    }
  }
}

const validateV115TopologyArtifact = (): string => {
  const artifact = asRecord(
    readJson<unknown>(v115TopologyArtifactPath),
    v115TopologyArtifactPath,
  )
  if (
    requireString(artifact, "schemaVersion", "topology") !==
    "v1.15-live-web-go-runtime-topology"
  ) {
    throw new Error("v1.15 topology artifact schema drifted")
  }
  if (!requireBoolean(artifact, "ok", "topology")) {
    throw new Error("v1.15 topology artifact is not passing")
  }
  if (!requireBoolean(artifact, "sourceSafe", "topology")) {
    throw new Error("v1.15 topology artifact must be source-safe")
  }
  const steps = requireRecordArray(artifact, "workflow", "topology")
  requireStepIds(steps, [
    "web_frontend_selected_go",
    "go_exhibition_create",
    "go_match_job_lifecycle",
    "go_orchestration_e2e",
    "typescript_runtime_service_boundary",
    "go_chronicle_persistence",
    "go_matchset_scoring",
    "go_public_evidence",
    "browser_replay_realism",
  ])
  for (const step of steps) {
    if (
      requireString(step, "fallbackPolicy", "topology.workflow") !==
      "no_silent_typescript_backend_fallback"
    ) {
      throw new Error(
        `${requireString(step, "stepId", "topology.workflow")} lost no-fallback policy`,
      )
    }
  }
  const requiredCommandIds = new Set([
    "go-test",
    "go-live-db-test",
    "go-parity",
    "topology-v115-live",
    "boundary-monitors",
    "replay-visual",
  ])
  const commandEvidence = requireRecordArray(
    artifact,
    "commandEvidence",
    "topology",
  )
  if (commandEvidence.length !== requiredCommandIds.size) {
    throw new Error("v1.15 topology command evidence count drifted")
  }
  for (const command of commandEvidence) {
    const commandID = requireString(command, "id", "topology.commandEvidence")
    if (!requiredCommandIds.delete(commandID)) {
      throw new Error(`unexpected or duplicate command evidence ${commandID}`)
    }
    if (
      requireString(command, "status", "topology.commandEvidence") !== "pass"
    ) {
      throw new Error(
        `${requireString(command, "command", "topology.commandEvidence")} did not pass`,
      )
    }
    requireString(command, "completedAt", "topology.commandEvidence")
    requireString(command, "repoHead", "topology.commandEvidence")
    requireString(command, "evidenceRef", "topology.commandEvidence")
  }
  if (requiredCommandIds.size > 0) {
    throw new Error(
      `v1.15 topology missing command evidence ${[...requiredCommandIds].join(", ")}`,
    )
  }
  const replayRealism = asRecord(
    artifact.replayRealism,
    "topology.replayRealism",
  )
  if (
    requireString(replayRealism, "status", "topology.replayRealism") !== "pass"
  ) {
    throw new Error("v1.15 replay realism evidence did not pass")
  }
  checkPublicPayload(artifact)
  return `${steps.length} v1.15 topology steps checked`
}

const validateV115FailureDrillsArtifact = (): string => {
  const artifact = asRecord(
    readJson<unknown>(v115FailureDrillsArtifactPath),
    v115FailureDrillsArtifactPath,
  )
  if (
    requireString(artifact, "schemaVersion", "failureDrills") !==
    "v1.15-failure-drills"
  ) {
    throw new Error("v1.15 failure drills schema drifted")
  }
  if (!requireBoolean(artifact, "ok", "failureDrills")) {
    throw new Error("v1.15 failure drills are not passing")
  }
  const stoppedGo = asRecord(artifact.stoppedGo, "failureDrills.stoppedGo")
  if (
    !requireBoolean(stoppedGo, "failClosed", "failureDrills.stoppedGo") ||
    requireBoolean(
      stoppedGo,
      "typescriptFallbackObserved",
      "failureDrills.stoppedGo",
    )
  ) {
    throw new Error("stopped-Go drill no longer proves fail-closed behavior")
  }
  const stoppedRuntime = asRecord(
    artifact.stoppedRuntimeService,
    "failureDrills.stoppedRuntimeService",
  )
  if (
    !["retryable_system_failure", "terminal_system_failure"].includes(
      requireString(
        stoppedRuntime,
        "classification",
        "failureDrills.stoppedRuntimeService",
      ),
    ) ||
    requireBoolean(
      stoppedRuntime,
      "typescriptPersistenceFallbackObserved",
      "failureDrills.stoppedRuntimeService",
    )
  ) {
    throw new Error(
      "stopped-runtime drill no longer proves Go-owned failure classification",
    )
  }
  const rollback = asRecord(artifact.rollback, "failureDrills.rollback")
  if (!requireBoolean(rollback, "noMixedDbOwners", "failureDrills.rollback")) {
    throw new Error("rollback drill allows mixed DB owners")
  }
  const rollbackSteps = requireStringArray(
    rollback,
    "operatorSequence",
    "failureDrills.rollback",
  )
  const expectedRollbackSteps = [
    "stop_go_orchestration",
    "switch_lifecycle_owner_to_typescript",
    "start_typescript_rollback_worker",
  ]
  if (JSON.stringify(rollbackSteps) !== JSON.stringify(expectedRollbackSteps)) {
    throw new Error("rollback drill operatorSequence order drifted")
  }
  checkPublicPayload(artifact)
  return "stopped-Go, stopped-runtime, and rollback drills checked"
}

const validateV115TypeScriptSurfaceLabels = (): string => {
  const labels = asRecord(
    readJson<unknown>(v115TypeScriptSurfaceLabelsPath),
    v115TypeScriptSurfaceLabelsPath,
  )
  if (
    requireString(labels, "schemaVersion", "surfaceLabels") !==
    "v1.15-typescript-surface-labels"
  ) {
    throw new Error("v1.15 TypeScript surface label schema drifted")
  }
  const allowed = new Set(
    requireStringArray(labels, "allowedRoles", "surfaceLabels"),
  )
  for (const role of [
    "frontend",
    "parity_only",
    "rollback_only",
    "test_only",
    "runtime_only",
    "deferred",
  ]) {
    if (!allowed.has(role)) {
      throw new Error(`surface labels missing allowed role ${role}`)
    }
  }
  for (const workflow of [
    "exhibition_create",
    "public_matchset_summary",
    "public_replay_metadata",
    "public_replay_evidence",
  ]) {
    if (
      !requireStringArray(
        labels,
        "selectedNormalGoWorkflows",
        "surfaceLabels",
      ).includes(workflow)
    ) {
      throw new Error(`surface labels missing selected workflow ${workflow}`)
    }
  }
  const surfaces = requireRecordArray(labels, "surfaces", "surfaceLabels")
  for (const surface of surfaces) {
    if (!allowed.has(requireString(surface, "role", "surfaceLabels.surface"))) {
      throw new Error(
        `${requireString(surface, "surface", "surfaceLabels.surface")} has invalid role`,
      )
    }
  }
  const requiredSurfaces = new Map([
    ["apps/runtime-service", "runtime_only"],
    ["apps/worker/src/runner.ts", "rollback_only"],
    ["apps/web/app/matches/server.ts", "frontend"],
    ["packages/persistence/src/chronicle-store.ts", "parity_only"],
    ["apps/web/app/workshop/server.ts", "deferred"],
  ])
  for (const [surfacePath, expectedRole] of requiredSurfaces) {
    const surface = surfaces.find(
      (item) =>
        requireString(item, "surface", "surfaceLabels.surface") === surfacePath,
    )
    if (
      !surface ||
      requireString(surface, "role", "surfaceLabels.surface") !== expectedRole
    ) {
      throw new Error(
        `surface labels missing ${surfacePath} as ${expectedRole}`,
      )
    }
  }
  checkPublicPayload(labels)
  return `${surfaces.length} TypeScript surfaces labeled`
}

const validateV115PromotionDecision = (): string => {
  const text = readFileSync(
    path.join(repoRoot, v115PromotionDecisionPath),
    "utf8",
  )
  checkPublicText(text)
  for (const requiredText of [
    "promote-go-backend-ownership-for-selected-normal-workflows",
    "no silent TypeScript backend fallback",
    "TypeScript runtime execution service remains",
    "production sandbox replacement remains out of scope",
    "final TypeScript runtime retirement remains out of scope",
  ]) {
    if (!text.includes(requiredText)) {
      throw new Error(`promotion decision missing ${requiredText}`)
    }
  }
  return `${text.length} source-safe promotion decision bytes`
}

const validateGoOrchestrationWiring = (): string => {
  const orchestrator = readFileSync(
    path.join(repoRoot, "apps/go-backend/orchestrator.go"),
    "utf8",
  )
  for (const requiredText of [
    "claimNextMatchJob",
    "buildRuntimeServiceRequestForClaimedMatch",
    "executeMatch",
    "completeMatch",
    "recordAttemptFailure",
  ]) {
    if (!orchestrator.includes(requiredText)) {
      throw new Error(`Go orchestrator missing ${requiredText}`)
    }
  }
  const scoring = readFileSync(
    path.join(repoRoot, "apps/go-backend/matchset_status.go"),
    "utf8",
  )
  if (
    !scoring.includes("strategyFailureRevisionIDFromChronicle") ||
    !scoring.includes("RUNTIME_VIOLATION")
  ) {
    throw new Error("Go MatchSet scoring lost runtime-violation attribution")
  }
  return "Go orchestrator wiring and strategy-failure attribution checked"
}

const validateV115GoOrchestrationEvidence = (): string => {
  const artifact = asRecord(
    readJson<unknown>(v115GoOrchestrationEvidencePath),
    v115GoOrchestrationEvidencePath,
  )
  if (
    requireString(artifact, "schemaVersion", "goOrchestrationEvidence") !==
    "v1.15-go-orchestration-e2e"
  ) {
    throw new Error("v1.15 Go orchestration evidence schema drifted")
  }
  if (!requireBoolean(artifact, "ok", "goOrchestrationEvidence")) {
    throw new Error("v1.15 Go orchestration E2E evidence is not passing")
  }
  if (!requireBoolean(artifact, "sourceSafe", "goOrchestrationEvidence")) {
    throw new Error("v1.15 Go orchestration E2E evidence must be source-safe")
  }
  const steps = requireRecordArray(
    artifact,
    "workflow",
    "goOrchestrationEvidence",
  )
  requireStepIds(steps, [
    "go_create_exhibition",
    "go_claim_job",
    "typescript_runtime_service_execute",
    "go_complete_persist_chronicle",
    "go_refresh_matchset_scoring",
    "go_public_replay_evidence",
  ])
  const commands = requireRecordArray(
    artifact,
    "commandEvidence",
    "goOrchestrationEvidence",
  )
  const command = commands.find(
    (item) =>
      requireString(item, "id", "goOrchestrationEvidence.commandEvidence") ===
      "go-orchestration-db-e2e",
  )
  if (!command) {
    throw new Error("v1.15 Go orchestration evidence missing DB E2E command")
  }
  if (
    requireString(
      command,
      "status",
      "goOrchestrationEvidence.commandEvidence",
    ) !== "pass"
  ) {
    throw new Error("v1.15 Go orchestration DB E2E command did not pass")
  }
  for (const key of ["completedAt", "repoHead", "evidenceRef"]) {
    requireString(command, key, "goOrchestrationEvidence.commandEvidence")
  }
  checkPublicPayload(artifact)
  return `${steps.length} Go orchestration E2E steps checked`
}

export const evaluateLocalTopology = async (
  options: TopologyOptions,
): Promise<TopologyCheck[]> => {
  const checks: TopologyCheck[] = []
  const packageJson = readJson<{ scripts: Record<string, string> }>(
    "package.json",
  )

  checks.push(
    await check("env_setup", "topology commands", true, () => {
      for (const script of [
        "services:up",
        "dev",
        "preflight",
        "go:parity",
        "sandbox:evaluate:container",
      ]) {
        if (!packageJson.scripts[script]) {
          throw new Error(`package.json missing ${script}`)
        }
      }
      return `start with: ${localCommands.join(" | ")}`
    }),
  )

  checks.push(
    await check("fixture_loading", "Go route manifest", true, () => {
      const routes = routeManifest()
      const expectedRoutes: Record<
        string,
        {
          authScope: RouteManifestEntry["authScope"]
          privacyClass: RouteManifestEntry["privacyClass"]
          requiresBearerToken?: boolean
        }
      > = {
        health: { authScope: "public", privacyClass: "public" },
        getPublicPlayerPage: {
          authScope: "public",
          privacyClass: "public",
        },
        getPublicLadderSeason: {
          authScope: "public",
          privacyClass: "public",
        },
        getPublicMatchSetSummary: {
          authScope: "public",
          privacyClass: "public",
        },
        getPublicReplayMetadata: {
          authScope: "public",
          privacyClass: "public",
        },
        getPublicReplayEvidence: {
          authScope: "public",
          privacyClass: "public",
        },
        getPublicStrategyPage: {
          authScope: "public",
          privacyClass: "public",
        },
        getAnalyticsRunSummary: {
          authScope: "owner",
          privacyClass: "owner",
          requiresBearerToken: true,
        },
      }
      for (const [routeId, expected] of Object.entries(expectedRoutes)) {
        const route = routes.find((entry) => entry.id === routeId)
        if (!route) {
          throw new Error(`missing route ${routeId}`)
        }
        if (route.method !== "GET") {
          throw new Error(`${routeId} must be GET, got ${route.method}`)
        }
        if (route.authScope !== expected.authScope) {
          throw new Error(
            `${routeId} authScope must be ${expected.authScope}, got ${route.authScope}`,
          )
        }
        if (route.privacyClass !== expected.privacyClass) {
          throw new Error(
            `${routeId} privacyClass must be ${expected.privacyClass}, got ${route.privacyClass}`,
          )
        }
        if (
          expected.requiresBearerToken !== undefined &&
          route.requiresBearerToken !== expected.requiresBearerToken
        ) {
          throw new Error(`${routeId} must declare bearer-token ownership`)
        }
      }
      return `${routes.length} read-only routes from ${routeManifestPath}`
    }),
  )

  checks.push(
    await check("fixture_loading", "Go fixture files", true, () => {
      for (const file of [
        "fixture-manifest.json",
        "health.json",
        "public-player-page.json",
        "public-ladder-page.json",
        "public-match-set-summary.json",
        "public-replay-metadata.json",
        "public-replay-evidence.json",
        "public-strategy-page.json",
        "analytics-run-summary.json",
      ]) {
        const fixturePath = path.join(
          repoRoot,
          "apps/go-backend/testdata/service-fixtures",
          file,
        )
        if (!existsSync(fixturePath)) {
          throw new Error(`missing fixture ${file}`)
        }
        readJson(`apps/go-backend/testdata/service-fixtures/${file}`)
      }
      for (const file of [
        "health.json",
        "public-player-page.json",
        "public-ladder-page.json",
        "public-match-set-summary.json",
        "public-replay-metadata.json",
        "public-replay-evidence.json",
        "public-strategy-page.json",
        "forbidden-error.json",
        "not-found-error.json",
      ]) {
        checkPublicPayload(
          readJson(`apps/go-backend/testdata/service-fixtures/${file}`),
        )
      }
      return "committed Go parity fixtures parse and public fixtures are privacy-safe"
    }),
  )

  checks.push(
    await check("typescript_service", "service health", true, () => {
      const service = createCowardsLocalService({
        withPool: async () => {
          throw new Error("health does not require persistence")
        },
      })
      const health = service.health()
      if (health.version !== SERVICE_API_VERSION) {
        throw new Error(
          `expected ${SERVICE_API_VERSION}, got ${health.version}`,
        )
      }
      return `${health.service} ${health.version}`
    }),
  )

  checks.push(
    await check("worker_runtime", "runtime adapter metadata", true, () => {
      const runtime = createWorkerRuntimeConfig()
      return `${runtime.metadata.id}; abi=${STRATEGY_RUNTIME_ABI_VERSION}; boundary=${runtime.metadata.isolationBoundary}`
    }),
  )

  checks.push(
    await check(
      "runtime_isolation",
      "runtime isolation readiness",
      true,
      () => {
        const report = evaluateRuntimeSandboxes()
        assertRuntimeIsolationReadinessGuardrails(report)
        if (options.requireRuntimeContainer) {
          assertRequiredSandboxCandidatesPassed(report, [
            "container-subprocess",
          ])
        }
        const container = report.candidates.find(
          (candidate) => candidate.id === "container-subprocess",
        )
        return [
          `status=${report.runtimeIsolationReadiness.status}`,
          `selected=${report.runtimeIsolationReadiness.selectedCandidate}`,
          `container=${container?.status ?? "missing"}`,
          `criteria=${report.runtimeIsolationReadiness.criteria.length}`,
          `noFallback=${report.runtimeIsolationReadiness.noSilentFallback}`,
        ].join("; ")
      },
    ),
  )

  if (options.runtimeServiceUrl || options.requireRuntimeService) {
    checks.push(
      await check(
        "runtime_service",
        "runtime service health",
        options.requireRuntimeService,
        async () => {
          const runtimeUrl =
            options.runtimeServiceUrl ?? "http://127.0.0.1:3107"
          const health = asRecord(
            await fetchJson(new URL("/health", runtimeUrl)),
            "runtimeService.health",
          )
          if (
            requireString(health, "service", "runtimeService.health") !==
            "runtime-execution-service-v1.15"
          ) {
            throw new Error("runtime service contract version drifted")
          }
          if (
            requireString(
              health,
              "runtimeAbiVersion",
              "runtimeService.health",
            ) !== STRATEGY_RUNTIME_ABI_VERSION
          ) {
            throw new Error("runtime service ABI drifted")
          }
          checkPublicPayload(health)
          return `runtime service health ok at ${sanitizeDiagnosticUrl(runtimeUrl)}`
        },
      ),
    )
  } else {
    checks.push({
      layer: "runtime_service",
      name: "runtime service health",
      required: false,
      ok: true,
      detail:
        "skipped; pass --runtime-service-url or --require-runtime-service for live runtime-service smoke",
    })
  }

  if (options.webUrl || options.requireWeb) {
    checks.push(
      await check(
        "web_process",
        "web service health route",
        options.requireWeb,
        async () => {
          const health = await fetchJson(
            new URL(
              "/api/service/health",
              options.webUrl ?? "http://localhost:3000",
            ),
          )
          checkPublicPayload(health)
          return `web health ok at ${sanitizeDiagnosticUrl(options.webUrl ?? "http://localhost:3000")}`
        },
      ),
    )
    if (options.requireWebPageSmoke) {
      const webUrl = options.webUrl ?? "http://localhost:3000"
      checks.push(
        await check(
          "web_page_smoke",
          "representative page loads",
          true,
          async () => {
            for (const target of webPageSmokeTargets) {
              await checkWebPageLoads(webUrl, target)
            }
            return `${webPageSmokeTargets.length} representative page types loaded at ${sanitizeDiagnosticUrl(webUrl)}`
          },
        ),
      )
    } else {
      checks.push({
        layer: "web_page_smoke",
        name: "representative page loads",
        required: false,
        ok: true,
        detail:
          "skipped; pass --require-web-page-smoke for representative page-load smoke",
      })
    }
    if (options.requireWebGoPublicStrategyRead) {
      checks.push(
        await check(
          "web_go_read",
          "web-through-Go public Strategy read",
          true,
          async () => {
            const route = sampleRoute("getPublicStrategyPage")
            const response = await fetch(
              new URL(
                route.samplePath.replace("/public", ""),
                options.webUrl ?? "http://localhost:3000",
              ),
            )
            const text = await response.text()
            checkPublicText(text)
            if (!response.ok) {
              throw new Error(
                `web public Strategy page HTTP ${response.status}`,
              )
            }
            if (!text.includes("Go Parity Sentinel")) {
              throw new Error(
                "web public Strategy page did not render the Go parity sentinel; ensure the web process started with COWARDS_GO_PUBLIC_STRATEGY_READS=1 and COWARDS_GO_BACKEND_URL",
              )
            }
            return `web rendered Go parity sentinel through selected route at ${sanitizeDiagnosticUrl(options.webUrl ?? "http://localhost:3000")}`
          },
        ),
      )
    }
  } else {
    checks.push({
      layer: "web_process",
      name: "web service health route",
      required: false,
      ok: true,
      detail: "skipped; pass --web-url or --require-web for live web smoke",
    })
    checks.push({
      layer: "web_page_smoke",
      name: "representative page loads",
      required: false,
      ok: true,
      detail:
        "skipped; pass --web-url with --require-web-page-smoke for representative page-load smoke",
    })
  }

  if (options.goUrl || options.requireGo) {
    const goUrl = options.goUrl ?? "http://127.0.0.1:8087"
    checks.push(
      await check("go_readonly", "Go health", options.requireGo, async () => {
        const health = await smokeJson(goUrl, sampleRoute("health").samplePath)
        checkPublicPayload(health)
        return `go health ok at ${sanitizeDiagnosticUrl(goUrl)}`
      }),
    )
    for (const routeId of [
      "getPublicPlayerPage",
      "getPublicLadderSeason",
      "getPublicMatchSetSummary",
      "getPublicReplayMetadata",
      "getPublicReplayEvidence",
      "getPublicStrategyPage",
    ]) {
      checks.push(
        await check("go_readonly", routeId, options.requireGo, async () => {
          const body = await smokeJson(goUrl, sampleRoute(routeId).samplePath)
          if (routeId === "getPublicPlayerPage") {
            PublicPlayerPageServiceDtoSchema.parse(body)
          }
          if (routeId === "getPublicLadderSeason") {
            PublicLadderPageServiceDtoSchema.parse(body)
          }
          if (routeId === "getPublicReplayEvidence") {
            PublicReplayEvidenceServiceDtoSchema.parse(body)
          }
          return checkPublicPayload(body)
        }),
      )
    }
    checks.push(
      await check(
        "go_readonly",
        "owner analytics auth gate",
        options.requireGo,
        async () => {
          const response = await fetch(
            new URL(sampleRoute("getAnalyticsRunSummary").samplePath, goUrl),
          )
          const body = await parseResponseJson(
            response,
            new URL(sampleRoute("getAnalyticsRunSummary").samplePath, goUrl),
          )
          checkPublicPayload(body)
          if (response.status !== 401 && response.status !== 403) {
            throw new Error(
              `owner analytics expected HTTP 401/403 without bearer token, got HTTP ${response.status}`,
            )
          }
          return `owner analytics rejected unauthenticated request with HTTP ${response.status}`
        },
      ),
    )
  } else {
    checks.push({
      layer: "go_readonly",
      name: "Go live smoke",
      required: false,
      ok: true,
      detail: "skipped; pass --go-url or --require-go for live Go smoke",
    })
  }

  if (options.requireV115Lifecycle) {
    checks.push(
      await check("go_lifecycle", "v1.15 Go orchestration wiring", true, () =>
        validateGoOrchestrationWiring(),
      ),
    )
    checks.push(
      await check(
        "go_lifecycle",
        "v1.15 Go orchestration E2E evidence",
        true,
        () => validateV115GoOrchestrationEvidence(),
      ),
    )
    checks.push(
      await check(
        "v115_topology",
        "v1.15 lifecycle topology evidence",
        true,
        () => validateV115TopologyArtifact(),
      ),
    )
    checks.push(
      await check("failure_drill", "v1.15 stopped-service drills", true, () =>
        validateV115FailureDrillsArtifact(),
      ),
    )
    checks.push(
      await check("rollback", "v1.15 TypeScript surface labels", true, () =>
        validateV115TypeScriptSurfaceLabels(),
      ),
    )
    checks.push(
      await check("promotion_gate", "v1.15 promotion decision", true, () =>
        validateV115PromotionDecision(),
      ),
    )
  }

  checks.push(
    await check("privacy", "diagnostic output", true, () => {
      checkPublicPayload({
        commands: localCommands,
        checks: checks.map(({ layer, name, ok, required, detail }) => ({
          layer,
          name,
          ok,
          required,
          detail,
        })),
      })
      return "diagnostics contain no private markers"
    }),
  )

  return checks
}

const run = async (): Promise<number> => {
  const options = parseTopologyOptions(process.argv.slice(2))
  const checks = await evaluateLocalTopology(options)
  if (options.json) {
    console.log(
      JSON.stringify({ ok: checks.every((item) => item.ok), checks }, null, 2),
    )
  } else {
    console.log("Coward's Game local topology")
    for (const command of localCommands) {
      console.log(`[CMD] ${command}`)
    }
    for (const result of checks) {
      const marker = result.ok ? "PASS" : result.required ? "FAIL" : "WARN"
      console.log(
        `[${marker}] [${result.layer}] ${result.name}: ${result.detail}`,
      )
    }
  }
  return checks.some((result) => result.required && !result.ok) ? 1 : 0
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
