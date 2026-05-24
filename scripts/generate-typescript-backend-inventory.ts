#!/usr/bin/env -S pnpm exec tsx
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

export const schemaVersion = "v1.16-typescript-backend-inventory" as const
export const milestone = "v1.16" as const
export const generatedAt = "2026-05-24" as const

export const allowedRoles = [
  "frontend-only",
  "runtime-service",
  "runtime-adapter",
  "parity-only",
  "fixture-only",
  "test-only",
  "rollback-only",
  "deferred",
  "quarantined",
  "deleted",
] as const

type TypeScriptBackendRole = (typeof allowedRoles)[number]

type SurfaceKind =
  | "next-api-route"
  | "web-server-module"
  | "web-frontend-module"
  | "web-lib-module"
  | "worker-module"
  | "runtime-service-module"
  | "runtime-adapter-module"
  | "persistence-module"
  | "service-module"

type RetirementAction =
  | "keep-frontend-go-adapter"
  | "keep-runtime-service-boundary"
  | "keep-runtime-adapter-boundary"
  | "quarantine-for-parity"
  | "quarantine-for-rollback"
  | "quarantine-for-test"
  | "quarantine-for-fixtures"
  | "defer-to-future-phase"
  | "delete-in-retirement-phase"
  | "quarantine-until-deleted"

interface ImportEvidence {
  line: number
  source: string
  statementText: string
}

interface ScannerFinding {
  code: string
  detail: string
}

export interface TypeScriptBackendSurface {
  id: string
  path: string
  kind: SurfaceKind
  role: TypeScriptBackendRole
  retirementAction: RetirementAction
  owner: string
  reason: string
  gate: string
  risk: string
  futureMigration: string
  currentOwner: string
  normalBackendOwner: string
  fallbackPolicy: string
  privacyClass: string
  enforcementStatus: string
  routeMethods: readonly string[]
  routePath: string | null
  routeFamily: string
  goRouteIds: readonly string[]
  imports: readonly ImportEvidence[]
  persistenceImports: readonly ImportEvidence[]
  serviceImports: readonly ImportEvidence[]
  runtimeImports: readonly ImportEvidence[]
  localBackendImports: readonly string[]
  usesDatabase: boolean
  claimsJobs: boolean
  completesMatches: boolean
  persistsChronicles: boolean
  refreshesScoring: boolean
  servesPublicEvidence: boolean
  executesStrategy: boolean
  ownerDebugAccess: boolean
  testOnlyGate: string | null
  rollbackGate: string | null
  deferredGate: string | null
  sourceRefs: readonly string[]
  scannerFindings: readonly ScannerFinding[]
}

export interface TypeScriptBackendInventory {
  schemaVersion: typeof schemaVersion
  milestone: typeof milestone
  generatedAt: typeof generatedAt
  allowedRoles: readonly TypeScriptBackendRole[]
  baselineReferences: {
    goBackendBaselineArtifacts: readonly string[]
    goBackendBaselineCapabilities: readonly string[]
    typeScriptSurfaceSeed: string
  }
  globalPolicies: {
    normalTypeScriptBackendAllowed: false
    fallbackPolicy: "no_silent_typescript_backend_fallback"
    strategyRuntimeAbi: "strategy-runtime-abi-v1.14"
    runtimeExecutionService: "runtime-execution-service-v1.15"
    goExecutesStrategyCode: false
    webExecutesStrategyCode: false
    nodeVmSecurityBoundaryAllowed: false
    nodeWasiUntrustedSandboxAllowed: false
    productionSandboxReplacementInScope: false
    runtimeBrokerImplementationInScope: false
    countedNonJsPlayInScope: false
    goMigrationSchemaOwnershipInScope: false
    cloudDeploymentInScope: false
    publicOutputForbiddenByDefault: readonly string[]
    nonGoals: readonly string[]
  }
  scanner: {
    generatedBy: "scripts/generate-typescript-backend-inventory.ts"
    roots: readonly string[]
    classificationSeed: string
    strictBoundaryBaseline: {
      strictOffenses: 0
      reportOnlyOffenses: 29
      source: string
    }
  }
  surfaces: readonly TypeScriptBackendSurface[]
}

export interface GenerateTypeScriptBackendInventoryOptions {
  repoRoot?: string
}

interface SourceRecord {
  repoPath: string
  sourceText: string
  imports: readonly ImportEvidence[]
  routeMethods: readonly string[]
}

interface ClassificationSeedEntry {
  surface: string
  role: string
  normalBackendOwner: string
  fallbackPolicy: string
}

const sourceExtensions = new Set([".ts", ".tsx"])
const excludedDirectories = new Set([
  ".next",
  ".turbo",
  "coverage",
  "dist",
  "node_modules",
  "playwright-report",
  "test-results",
])
const httpMethods = new Set([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
])
const disallowedRoles = new Set([
  "typescript-backend",
  "typescript_backend",
  "legacy",
  "backend",
  "normal-backend",
  "normal_backend",
  "typescript",
])

const scannerRoots = [
  "apps/web/app/api/**/route.ts",
  "apps/web/app/**/*.ts(x)",
  "apps/web/lib/**/*.ts",
  "apps/worker/src/**/*.ts",
  "apps/runtime-service/src/**/*.ts",
  "packages/persistence/src/**/*.ts",
  "packages/service/src/**/*.ts",
  "packages/runtime-js/src/**/*.ts",
] as const

const publicOutputForbiddenByDefault = [
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

const goBackendBaselineCapabilities = [
  "normal orchestration",
  "persistence-facing API behavior",
  "Match lifecycle",
  "Chronicle persistence handoff",
  "MatchSet scoring/status refresh",
  "selected exhibition creation",
  "public MatchSet summary",
  "public replay metadata",
  "selected public replay evidence",
] as const

const nonGoals = [
  "No Strategy execution in Go, web, or API processes.",
  "No Node vm security boundary for hostile Strategy code.",
  "No Node node:wasi untrusted sandbox promotion.",
  "No production sandbox replacement.",
  "No Runtime Broker implementation.",
  "No counted non-JS play promotion.",
  "No Go migration/schema ownership.",
  "No cloud deployment, Kubernetes, service mesh, or production observability work.",
] as const

const toRepoPath = (root: string, absolutePath: string): string =>
  path.relative(root, absolutePath).split(path.sep).join("/")

const sourceKindForPath = (repoPath: string): ts.ScriptKind =>
  repoPath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS

const isSourceFile = (absolutePath: string): boolean =>
  sourceExtensions.has(path.extname(absolutePath))

const isExcludedDirectory = (directoryName: string): boolean =>
  excludedDirectories.has(directoryName)

const walkSourceFiles = (
  root: string,
  rootRelativePath: string,
): readonly string[] => {
  const absoluteRoot = path.join(root, rootRelativePath)
  if (!existsSync(absoluteRoot)) {
    return []
  }

  const files: string[] = []
  const visit = (absolutePath: string) => {
    const stats = statSync(absolutePath)
    if (stats.isDirectory()) {
      if (isExcludedDirectory(path.basename(absolutePath))) {
        return
      }
      for (const entry of readdirSync(absolutePath)) {
        visit(path.join(absolutePath, entry))
      }
      return
    }

    if (stats.isFile() && isSourceFile(absolutePath)) {
      files.push(toRepoPath(root, absolutePath))
    }
  }

  visit(absoluteRoot)
  return files.sort()
}

const uniqueSorted = (values: readonly string[]): readonly string[] =>
  [...new Set(values)].sort()

const createSourceFile = (
  repoPath: string,
  sourceText: string,
): ts.SourceFile =>
  ts.createSourceFile(
    repoPath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    sourceKindForPath(repoPath),
  )

const isExported = (node: { modifiers?: ts.NodeArray<ts.ModifierLike> }) =>
  node.modifiers?.some(
    (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
  )

const extractImports = (
  repoPath: string,
  sourceFile: ts.SourceFile,
): readonly ImportEvidence[] => {
  const imports: ImportEvidence[] = []
  for (const statement of sourceFile.statements) {
    if (
      ts.isImportDeclaration(statement) ||
      (ts.isExportDeclaration(statement) && statement.moduleSpecifier)
    ) {
      const { line } = sourceFile.getLineAndCharacterOfPosition(
        statement.getStart(sourceFile),
      )
      const source = ts.isStringLiteral(statement.moduleSpecifier)
        ? statement.moduleSpecifier.text
        : ""
      imports.push({
        line: line + 1,
        source,
        statementText: statement.getText(sourceFile),
      })
    }
  }
  return imports.sort((left, right) =>
    `${left.line}:${left.source}`.localeCompare(
      `${right.line}:${right.source}`,
    ),
  )
}

const extractRouteMethods = (
  repoPath: string,
  sourceFile: ts.SourceFile,
): readonly string[] => {
  if (
    !repoPath.startsWith("apps/web/app/api/") ||
    !repoPath.endsWith("/route.ts")
  ) {
    return []
  }

  const methods: string[] = []
  for (const statement of sourceFile.statements) {
    if (
      ts.isFunctionDeclaration(statement) &&
      statement.name &&
      isExported(statement) &&
      httpMethods.has(statement.name.text)
    ) {
      methods.push(statement.name.text)
    }

    if (ts.isVariableStatement(statement) && isExported(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (
          ts.isIdentifier(declaration.name) &&
          httpMethods.has(declaration.name.text)
        ) {
          methods.push(declaration.name.text)
        }
      }
    }

    if (
      ts.isExportDeclaration(statement) &&
      statement.exportClause &&
      ts.isNamedExports(statement.exportClause)
    ) {
      for (const element of statement.exportClause.elements) {
        if (httpMethods.has(element.name.text)) {
          methods.push(element.name.text)
        }
      }
    }
  }

  return uniqueSorted(methods)
}

const resolveSourceFile = (
  root: string,
  repoPath: string,
): string | undefined => {
  const normalized = path.normalize(repoPath).split(path.sep).join("/")
  const absolutePath = path.join(root, normalized)
  if (existsSync(absolutePath) && isSourceFile(absolutePath)) {
    return normalized
  }

  const extension = path.extname(normalized)
  const candidates =
    extension.length > 0
      ? [
          `${normalized.slice(0, -extension.length)}.ts`,
          `${normalized.slice(0, -extension.length)}.tsx`,
        ]
      : [
          `${normalized}.ts`,
          `${normalized}.tsx`,
          path.join(normalized, "index.ts"),
          path.join(normalized, "index.tsx"),
        ]

  return candidates
    .map((candidate) => path.normalize(candidate).split(path.sep).join("/"))
    .find((candidate) => existsSync(path.join(root, candidate)))
}

const resolveLocalImport = (
  root: string,
  fromRepoPath: string,
  source: string,
): string | undefined => {
  if (!source.startsWith(".")) {
    return undefined
  }
  const target = path
    .normalize(path.join(path.dirname(fromRepoPath), source))
    .split(path.sep)
    .join("/")
  return resolveSourceFile(root, target)
}

const discoverSourceRecords = (root: string): readonly SourceRecord[] => {
  const routeFiles = walkSourceFiles(root, "apps/web/app/api").filter(
    (repoPath) => repoPath.endsWith("/route.ts"),
  )
  const files = uniqueSorted([
    ...routeFiles,
    ...walkSourceFiles(root, "apps/web/app"),
    ...walkSourceFiles(root, "apps/web/lib"),
    ...walkSourceFiles(root, "apps/worker/src"),
    ...walkSourceFiles(root, "apps/runtime-service/src"),
    ...walkSourceFiles(root, "packages/persistence/src"),
    ...walkSourceFiles(root, "packages/service/src"),
    ...walkSourceFiles(root, "packages/runtime-js/src"),
  ])

  return files.map((repoPath) => {
    const sourceText = readFileSync(path.join(root, repoPath), "utf8")
    const sourceFile = createSourceFile(repoPath, sourceText)
    return {
      repoPath,
      sourceText,
      imports: extractImports(repoPath, sourceFile),
      routeMethods: extractRouteMethods(repoPath, sourceFile),
    }
  })
}

const loadClassificationSeed = (
  root: string,
): ReadonlyMap<string, ClassificationSeedEntry> => {
  const seedPath = path.join(
    root,
    ".planning/artifacts/v1.15-typescript-surface-labels.json",
  )
  if (!existsSync(seedPath)) {
    return new Map()
  }
  const parsed = JSON.parse(readFileSync(seedPath, "utf8")) as {
    surfaces?: ClassificationSeedEntry[]
  }
  return new Map((parsed.surfaces ?? []).map((entry) => [entry.surface, entry]))
}

const seedForPath = (
  seed: ReadonlyMap<string, ClassificationSeedEntry>,
  repoPath: string,
): ClassificationSeedEntry | undefined => {
  const exact = seed.get(repoPath)
  if (exact) {
    return exact
  }
  return [...seed.entries()]
    .filter(
      ([surface]) => repoPath === surface || repoPath.startsWith(`${surface}/`),
    )
    .sort(
      ([left], [right]) =>
        right.length - left.length || left.localeCompare(right),
    )[0]?.[1]
}

const routePathFor = (repoPath: string): string | null => {
  if (
    !repoPath.startsWith("apps/web/app/api/") ||
    !repoPath.endsWith("/route.ts")
  ) {
    return null
  }
  return repoPath
    .slice("apps/web/app/api".length, -"/route.ts".length)
    .replace(/\[([^\]]+)\]/g, ":$1")
    .replace(/\/+/g, "/")
}

const routeFamilyFor = (repoPath: string): string => {
  if (repoPath.includes("/api/test-support/")) return "test-support"
  if (repoPath.includes("/api/auth/")) return "session"
  if (repoPath.includes("/api/account/")) return "account-revision"
  if (repoPath.includes("/api/exhibitions/")) return "exhibition-create"
  if (repoPath.includes("/api/matchsets/")) return "public-matchset"
  if (repoPath.includes("/api/replays/")) return "public-replay"
  if (repoPath.includes("/api/workshop/")) return "workshop"
  if (repoPath.includes("/api/ladder/")) return "ladder"
  if (repoPath.includes("/api/admin/")) return "governance"
  if (repoPath.includes("/matches/")) return "replay"
  if (repoPath.includes("/workshop/")) return "workshop"
  if (repoPath.includes("workshop-")) return "workshop"
  if (repoPath.includes("/ladder/")) return "ladder"
  if (repoPath.includes("/competitive/")) return "competitive"
  if (repoPath.includes("runtime-service")) return "runtime-service"
  if (repoPath.includes("runtime-js")) return "runtime-adapter"
  if (repoPath.includes("worker")) return "worker-lifecycle"
  if (repoPath.includes("persistence")) return "persistence"
  if (repoPath.includes("service")) return "service"
  return "frontend"
}

const kindForPath = (repoPath: string): SurfaceKind => {
  if (
    repoPath.startsWith("apps/web/app/api/") &&
    repoPath.endsWith("/route.ts")
  ) {
    return "next-api-route"
  }
  if (repoPath.startsWith("apps/web/app/") && repoPath.endsWith("/server.ts")) {
    return "web-server-module"
  }
  if (repoPath.startsWith("apps/web/app/")) {
    return "web-frontend-module"
  }
  if (repoPath.startsWith("apps/web/lib/")) {
    return "web-lib-module"
  }
  if (repoPath.startsWith("apps/worker/src/")) {
    return "worker-module"
  }
  if (repoPath.startsWith("apps/runtime-service/src/")) {
    return "runtime-service-module"
  }
  if (repoPath.startsWith("packages/runtime-js/src/")) {
    return "runtime-adapter-module"
  }
  if (repoPath.startsWith("packages/persistence/src/")) {
    return "persistence-module"
  }
  return "service-module"
}

const isTestPath = (repoPath: string): boolean =>
  repoPath.includes(".test.") || repoPath.includes("/api/test-support/")

const classifyRole = (
  repoPath: string,
  seedEntry: ClassificationSeedEntry | undefined,
  indicators: {
    usesDatabase?: boolean
    hasServiceImports?: boolean
    hasLocalBackendImports?: boolean
  } = {},
): TypeScriptBackendRole => {
  if (isTestPath(repoPath)) return "test-only"
  if (repoPath.startsWith("apps/runtime-service/src/")) return "runtime-service"
  if (repoPath.startsWith("packages/runtime-js/src/")) return "runtime-adapter"
  if (repoPath.startsWith("apps/worker/src/")) return "rollback-only"
  if (repoPath.startsWith("packages/service/src/")) return "parity-only"
  if (repoPath.startsWith("packages/persistence/src/")) {
    if (repoPath.includes("preset") || repoPath.includes("seed")) {
      return "fixture-only"
    }
    if (
      repoPath.includes("workshop") ||
      repoPath.includes("ladder") ||
      repoPath.includes("governance") ||
      repoPath.includes("account-revisions") ||
      repoPath.includes("auth")
    ) {
      return "deferred"
    }
    if (repoPath.includes("jobs") || repoPath.includes("complete-match")) {
      return "rollback-only"
    }
    return "parity-only"
  }
  if (repoPath.includes("/workshop/")) return "deferred"
  if (repoPath.includes("workshop-")) return "deferred"
  if (repoPath.includes("/ladder/") || repoPath.includes("/admin/"))
    return "deferred"
  if (repoPath.includes("/competitive/server.ts")) return "deferred"
  if (repoPath.includes("/matches/server.ts")) return "deferred"
  if (
    repoPath.includes("workshop-analytics-service-adapter.ts") ||
    repoPath.includes("workshop-read-service-adapter.ts")
  ) {
    return "deferred"
  }
  if (
    repoPath.endsWith("service-adapter.ts") &&
    (indicators.usesDatabase ||
      indicators.hasServiceImports ||
      indicators.hasLocalBackendImports)
  ) {
    return "deferred"
  }
  if (repoPath.includes("service-adapter.ts")) {
    return seedEntry?.role === "deferred" ? "deferred" : "frontend-only"
  }
  return "frontend-only"
}

const retirementActionFor = (role: TypeScriptBackendRole): RetirementAction => {
  switch (role) {
    case "frontend-only":
      return "keep-frontend-go-adapter"
    case "runtime-service":
      return "keep-runtime-service-boundary"
    case "runtime-adapter":
      return "keep-runtime-adapter-boundary"
    case "parity-only":
      return "quarantine-for-parity"
    case "fixture-only":
      return "quarantine-for-fixtures"
    case "test-only":
      return "quarantine-for-test"
    case "rollback-only":
      return "quarantine-for-rollback"
    case "deferred":
      return "defer-to-future-phase"
    case "quarantined":
      return "quarantine-until-deleted"
    case "deleted":
      return "delete-in-retirement-phase"
  }
}

const defaultOwnerFor = (role: TypeScriptBackendRole): string => {
  switch (role) {
    case "frontend-only":
      return "web_frontend"
    case "runtime-service":
      return "typescript_runtime_service"
    case "runtime-adapter":
      return "runtime_js_adapter"
    case "parity-only":
      return "parity_fixture_maintainer"
    case "fixture-only":
      return "fixture_maintainer"
    case "test-only":
      return "test_infrastructure"
    case "rollback-only":
      return "operator_rollback_owner"
    case "deferred":
      return "future_phase_owner"
    case "quarantined":
      return "retirement_owner"
    case "deleted":
      return "retirement_owner"
  }
}

const normalBackendOwnerFor = (
  role: TypeScriptBackendRole,
  routeFamily: string,
  seedEntry: ClassificationSeedEntry | undefined,
): string => {
  if (seedEntry?.normalBackendOwner) {
    return seedEntry.normalBackendOwner
  }
  if (role === "runtime-service")
    return "go_backend_invokes_runtime_service_only"
  if (role === "runtime-adapter") return "runtime_service_boundary_only"
  if (role === "test-only" || role === "fixture-only") return "none"
  if (routeFamily === "workshop") return "deferred_until_workshop_go_migration"
  if (routeFamily === "ladder") return "deferred_until_ladder_go_migration"
  if (routeFamily === "governance")
    return "deferred_until_governance_go_migration"
  return "go_backend"
}

const reasonFor = (
  role: TypeScriptBackendRole,
  routeFamily: string,
  repoPath: string,
): string => {
  if (role === "frontend-only") {
    return "TypeScript is allowed here only as frontend or Go-calling adapter code, not as a normal backend owner."
  }
  if (role === "runtime-service") {
    return "JS/TS Strategy execution remains isolated behind the runtime execution service boundary."
  }
  if (role === "runtime-adapter") {
    return "Runtime adapter code executes Strategy ABI work only inside the runtime boundary."
  }
  if (role === "rollback-only") {
    return "v1.15 Go ownership is the normal backend baseline; TypeScript lifecycle code may remain only for explicit operator rollback."
  }
  if (role === "parity-only") {
    return "TypeScript service or persistence behavior remains as parity oracle or reference fixture, not normal backend behavior."
  }
  if (role === "fixture-only") {
    return "This path seeds or describes local fixture data and cannot serve normal product runtime traffic."
  }
  if (role === "test-only") {
    return "This path is test infrastructure gated away from normal product runtime traffic."
  }
  if (role === "deferred") {
    return `${routeFamily} TypeScript behavior is intentionally deferred for a later v1.16 phase and must not become silent fallback.`
  }
  if (role === "deleted") {
    return "Unused TypeScript backend-like behavior should be deleted by the retirement phases."
  }
  return `${repoPath} is quarantined until a later phase deletes or relabels it.`
}

const gateFor = (role: TypeScriptBackendRole, routeFamily: string): string => {
  if (role === "frontend-only")
    return "Go ownership flags and schema validation"
  if (role === "runtime-service")
    return "runtime-execution-service-v1.15 schema and DB-free boundary"
  if (role === "runtime-adapter")
    return "strategy-runtime-abi-v1.14 adapter contract"
  if (role === "rollback-only")
    return "explicit rollback operator gate; no mixed Go and TypeScript DB owners"
  if (role === "parity-only")
    return "parity fixture generation or monitor-only reference gate"
  if (role === "fixture-only") return "fixture generation and local test gate"
  if (role === "test-only")
    return "test-support route or Vitest/Playwright gate only"
  if (role === "deferred")
    return `Phase 105-107 ${routeFamily} migration or relabeling gate`
  if (role === "deleted") return "retirement deletion gate"
  return "quarantine gate"
}

const riskFor = (role: TypeScriptBackendRole, routeFamily: string): string => {
  if (role === "frontend-only")
    return "silent TypeScript backend fallback if Go adapter checks drift"
  if (role === "runtime-service" || role === "runtime-adapter") {
    return "runtime boundary drift into DB, job lifecycle, scoring, public API, or unredacted diagnostics"
  }
  if (role === "rollback-only")
    return "mixed Go and TypeScript DB ownership during rollback"
  if (role === "parity-only")
    return "parity reference accidentally used as normal product backend"
  if (role === "fixture-only" || role === "test-only") {
    return "test or fixture path exposed to product runtime"
  }
  if (role === "deferred")
    return `deferred ${routeFamily} path masking missing Go ownership or leaking private data`
  if (role === "deleted") return "deleted path remains reachable"
  return "quarantined path remains reachable"
}

const futureMigrationFor = (
  role: TypeScriptBackendRole,
  routeFamily: string,
): string => {
  if (role === "runtime-service" || role === "runtime-adapter") {
    return "May be fronted or replaced by a language-neutral Strategy Execution Service / Runtime Broker in a future phase."
  }
  if (role === "frontend-only") {
    return "Keep as frontend adapter while Phase 105 removes any remaining TypeScript backend fallback."
  }
  if (role === "rollback-only") {
    return "Document rollback order, then quarantine or delete after no-TypeScript-backend topology is strict."
  }
  if (role === "parity-only") {
    return "Keep only as fixture/parity source until monitors no longer need TypeScript reference output."
  }
  if (role === "fixture-only" || role === "test-only") {
    return "Keep gated for tests and fixtures; delete if future monitors no longer require it."
  }
  if (role === "deferred") {
    return `Migrate, delete, or explicitly relabel ${routeFamily} behavior in Phases 105-107.`
  }
  return "Delete or relabel during TypeScript backend retirement phases."
}

const goRouteIdsFor = (routeFamily: string, routePath: string | null) => {
  if (routeFamily === "session") return ["auth.session"]
  if (routeFamily === "account-revision") return ["account.revisions"]
  if (routeFamily === "exhibition-create") return ["exhibitions.create"]
  if (routeFamily === "public-matchset") return ["matchsets.summary"]
  if (routeFamily === "public-replay")
    return ["replays.metadata", "replays.publicEvidence"]
  if (routePath === "/service/health") return ["service.health"]
  return []
}

const importSourcesMatching = (
  imports: readonly ImportEvidence[],
  predicate: (source: string, statement: string) => boolean,
) => imports.filter((entry) => predicate(entry.source, entry.statementText))

const containsAny = (sourceText: string, needles: readonly string[]) =>
  needles.some((needle) => sourceText.includes(needle))

const localBackendImportsFor = (
  root: string,
  recordsByPath: ReadonlyMap<string, SourceRecord>,
  record: SourceRecord,
): readonly string[] => {
  const seen = new Set<string>()
  const queue = record.imports
    .map((entry) => resolveLocalImport(root, record.repoPath, entry.source))
    .filter((value): value is string => Boolean(value))

  while (queue.length > 0) {
    const repoPath = queue.shift()!
    if (seen.has(repoPath)) {
      continue
    }
    seen.add(repoPath)
    const next = recordsByPath.get(repoPath)
    if (!next) {
      continue
    }
    for (const entry of next.imports) {
      const resolved = resolveLocalImport(root, next.repoPath, entry.source)
      if (resolved && !seen.has(resolved)) {
        queue.push(resolved)
      }
    }
  }

  return [...seen]
    .filter((repoPath) => {
      const localRecord = recordsByPath.get(repoPath)
      return (
        repoPath.includes("/competitive/server") ||
        repoPath.includes("/matches/server") ||
        repoPath.includes("/workshop/server") ||
        repoPath.startsWith("apps/worker/") ||
        repoPath.startsWith("packages/persistence/") ||
        repoPath.startsWith("packages/service/") ||
        Boolean(
          localRecord &&
          containsAny(localRecord.sourceText, [
            "@cowards/persistence",
            "@cowards/service",
            "claimNextMatchJob",
            "completeMatch",
            "createPostgresChronicleStore",
            "refreshMatchSetStatus",
          ]),
        )
      )
    })
    .sort()
}

const sourceRefsFor = (
  repoPath: string,
  routePath: string | null,
  role: TypeScriptBackendRole,
): readonly string[] =>
  uniqueSorted(
    [
      repoPath,
      ".planning/artifacts/v1.15-lifecycle-ownership-manifest.json",
      ".planning/artifacts/v1.15-typescript-surface-labels.json",
      ".planning/artifacts/v1.15-live-web-go-runtime-topology.json",
      routePath ? ".planning/artifacts/v1.15-promotion-decision.md" : "",
      role === "runtime-service" || role === "runtime-adapter"
        ? "strategy-runtime-abi-v1.14"
        : "",
    ].filter(Boolean),
  )

const createSurface = (
  root: string,
  recordsByPath: ReadonlyMap<string, SourceRecord>,
  seed: ReadonlyMap<string, ClassificationSeedEntry>,
  record: SourceRecord,
): TypeScriptBackendSurface => {
  const seedEntry = seedForPath(seed, record.repoPath)
  const kind = kindForPath(record.repoPath)
  const routePath = routePathFor(record.repoPath)
  const routeFamily = routeFamilyFor(record.repoPath)
  const persistenceImports = importSourcesMatching(
    record.imports,
    (source, statement) =>
      source.startsWith("@cowards/persistence") ||
      statement.includes("@cowards/persistence"),
  )
  const serviceImports = importSourcesMatching(
    record.imports,
    (source, statement) =>
      source.startsWith("@cowards/service") ||
      statement.includes("@cowards/service"),
  )
  const runtimeImports = importSourcesMatching(
    record.imports,
    (source, statement) =>
      source.startsWith("@cowards/runtime-js") ||
      source.includes("runtime-js") ||
      statement.includes("@cowards/runtime-js"),
  )
  const localBackendImports = localBackendImportsFor(
    root,
    recordsByPath,
    record,
  )
  const sourceText = record.sourceText
  const usesDatabase =
    persistenceImports.length > 0 ||
    containsAny(sourceText, ["createDatabasePool", "Queryable", "DATABASE_URL"])
  const role = classifyRole(record.repoPath, seedEntry, {
    usesDatabase,
    hasServiceImports: serviceImports.length > 0,
    hasLocalBackendImports: localBackendImports.length > 0,
  })
  const retirementAction = retirementActionFor(role)
  const claimsJobs = containsAny(sourceText, [
    "claimNextMatchJob",
    "claim",
    "lease",
    "heartbeat",
  ])
  const completesMatches = containsAny(sourceText, [
    "completeMatch",
    "completeMatchFromChronicle",
    "markMatch",
  ])
  const persistsChronicles = containsAny(sourceText, [
    "ChronicleStore",
    "createPostgresChronicleStore",
    "persistChronicle",
    "chronicle-store",
  ])
  const refreshesScoring = containsAny(sourceText, [
    "refreshMatchSetStatus",
    "scoreMatchSet",
    "matchset-status",
    "scoring",
  ])
  const servesPublicEvidence =
    routeFamily === "public-replay" ||
    routeFamily === "public-matchset" ||
    containsAny(sourceText, [
      "public replay",
      "publicEvidence",
      "getPublicReplay",
    ])
  const executesStrategy =
    runtimeImports.length > 0 ||
    containsAny(sourceText, [
      "executeStrategyRuntimeAbiV114",
      "executeMatch",
      "StrategyExecutionAdapter",
      "transpileStrategySource",
    ])
  const ownerDebugAccess = containsAny(sourceText, [
    "ownerDebug",
    "owner-debug",
    "includePrivate",
    "owner debug",
  ])

  const scannerFindings: ScannerFinding[] = []
  if (record.routeMethods.length > 0) {
    scannerFindings.push({
      code: "next_api_route",
      detail: `exports ${record.routeMethods.join(", ")}`,
    })
  }
  if (persistenceImports.length > 0) {
    scannerFindings.push({
      code: "persistence_import",
      detail: persistenceImports.map((entry) => entry.source).join(", "),
    })
  }
  if (serviceImports.length > 0) {
    scannerFindings.push({
      code: "service_import",
      detail: serviceImports.map((entry) => entry.source).join(", "),
    })
  }
  if (runtimeImports.length > 0) {
    scannerFindings.push({
      code: "runtime_import",
      detail: runtimeImports.map((entry) => entry.source).join(", "),
    })
  }
  if (localBackendImports.length > 0) {
    scannerFindings.push({
      code: "local_backend_import_chain",
      detail: localBackendImports.join(", "),
    })
  }

  return {
    id: record.repoPath
      .replace(/\.(tsx|ts)$/, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase(),
    path: record.repoPath,
    kind,
    role,
    retirementAction,
    owner: defaultOwnerFor(role),
    reason: reasonFor(role, routeFamily, record.repoPath),
    gate: gateFor(role, routeFamily),
    risk: riskFor(role, routeFamily),
    futureMigration: futureMigrationFor(role, routeFamily),
    currentOwner:
      role === "frontend-only"
        ? "typescript_frontend"
        : role === "runtime-service"
          ? "typescript_runtime_service"
          : role === "runtime-adapter"
            ? "typescript_runtime_adapter"
            : "typescript_non_normal_reference",
    normalBackendOwner: normalBackendOwnerFor(role, routeFamily, seedEntry),
    fallbackPolicy:
      seedEntry?.fallbackPolicy ?? "no_silent_typescript_backend_fallback",
    privacyClass:
      ownerDebugAccess || routeFamily === "workshop"
        ? "private-or-owner-scoped"
        : servesPublicEvidence || routeFamily.startsWith("public")
          ? "public-redacted"
          : "source-safe-inventory-only",
    enforcementStatus:
      role === "deferred"
        ? "phase-103-inventory-now-phase-105-107-follow-up"
        : role === "frontend-only"
          ? "phase-103-inventory-now-phase-105-strictness-follow-up"
          : "phase-103-inventory-now-phase-108-monitor-ready",
    routeMethods: record.routeMethods,
    routePath,
    routeFamily,
    goRouteIds: goRouteIdsFor(routeFamily, routePath),
    imports: record.imports,
    persistenceImports,
    serviceImports,
    runtimeImports,
    localBackendImports,
    usesDatabase,
    claimsJobs,
    completesMatches,
    persistsChronicles,
    refreshesScoring,
    servesPublicEvidence,
    executesStrategy,
    ownerDebugAccess,
    testOnlyGate: role === "test-only" ? gateFor(role, routeFamily) : null,
    rollbackGate: role === "rollback-only" ? gateFor(role, routeFamily) : null,
    deferredGate: role === "deferred" ? gateFor(role, routeFamily) : null,
    sourceRefs: sourceRefsFor(record.repoPath, routePath, role),
    scannerFindings,
  }
}

export const validateTypeScriptBackendInventory = (
  inventory: TypeScriptBackendInventory,
): readonly string[] => {
  const errors: string[] = []
  if (inventory.schemaVersion !== schemaVersion) {
    errors.push(`schemaVersion must be ${schemaVersion}`)
  }
  if (inventory.milestone !== milestone) {
    errors.push(`milestone must be ${milestone}`)
  }
  if (inventory.globalPolicies.normalTypeScriptBackendAllowed !== false) {
    errors.push("normalTypeScriptBackendAllowed must be false")
  }
  if (!inventory.allowedRoles.every((role) => allowedRoles.includes(role))) {
    errors.push("allowedRoles contains a role outside the Phase 103 taxonomy")
  }
  const allowed = new Set(allowedRoles)
  const requiredFields = [
    "owner",
    "reason",
    "gate",
    "risk",
    "futureMigration",
  ] as const

  for (const role of inventory.allowedRoles) {
    if (disallowedRoles.has(role)) {
      errors.push(`disallowed role label found in allowedRoles: ${role}`)
    }
  }

  for (const surface of inventory.surfaces) {
    if (!allowed.has(surface.role)) {
      errors.push(`${surface.path} has invalid role ${surface.role}`)
    }
    if (disallowedRoles.has(surface.role)) {
      errors.push(`${surface.path} has disallowed role ${surface.role}`)
    }
    if (disallowedRoles.has(surface.normalBackendOwner)) {
      errors.push(
        `${surface.path} uses disallowed normal backend owner ${surface.normalBackendOwner}`,
      )
    }
    if (surface.role === "deferred" || surface.role === "rollback-only") {
      for (const field of requiredFields) {
        if (surface[field].trim().length === 0) {
          errors.push(`${surface.path} ${surface.role} entry missing ${field}`)
        }
      }
    }
    if (
      surface.role === "frontend-only" &&
      surface.path.includes("workshop") &&
      (surface.usesDatabase ||
        surface.persistenceImports.length > 0 ||
        surface.serviceImports.length > 0 ||
        surface.localBackendImports.length > 0)
    ) {
      errors.push(
        `${surface.path} frontend-only row claims TypeScript backend imports or database access`,
      )
    }
    if (
      surface.role === "runtime-service" &&
      (surface.usesDatabase ||
        surface.claimsJobs ||
        surface.completesMatches ||
        surface.persistsChronicles ||
        surface.refreshesScoring ||
        surface.servesPublicEvidence)
    ) {
      errors.push(
        `${surface.path} runtime-service row claims backend capability`,
      )
    }
    if (
      surface.role === "runtime-adapter" &&
      (surface.usesDatabase ||
        surface.claimsJobs ||
        surface.completesMatches ||
        surface.persistsChronicles ||
        surface.refreshesScoring ||
        surface.servesPublicEvidence)
    ) {
      errors.push(
        `${surface.path} runtime-adapter row claims backend capability`,
      )
    }
  }

  const paths = new Set(inventory.surfaces.map((surface) => surface.path))
  if (paths.size !== inventory.surfaces.length) {
    errors.push("surface paths must be unique")
  }

  return errors
}

export const generateTypeScriptBackendInventory = (
  options: GenerateTypeScriptBackendInventoryOptions = {},
): TypeScriptBackendInventory => {
  const root = options.repoRoot ?? repoRoot
  const records = discoverSourceRecords(root)
  const recordsByPath = new Map(
    records.map((record) => [record.repoPath, record]),
  )
  const seed = loadClassificationSeed(root)
  const surfaces = records
    .map((record) => createSurface(root, recordsByPath, seed, record))
    .sort((left, right) =>
      `${left.kind}:${left.path}:${left.id}`.localeCompare(
        `${right.kind}:${right.path}:${right.id}`,
      ),
    )

  const inventory: TypeScriptBackendInventory = {
    schemaVersion,
    milestone,
    generatedAt,
    allowedRoles,
    baselineReferences: {
      goBackendBaselineArtifacts: [
        ".planning/artifacts/v1.15-lifecycle-ownership-manifest.json",
        ".planning/artifacts/v1.15-typescript-surface-labels.json",
        ".planning/artifacts/v1.15-live-web-go-runtime-topology.json",
        ".planning/artifacts/v1.15-failure-drills.json",
        ".planning/artifacts/v1.15-promotion-decision.md",
        ".planning/artifacts/v1.15-boundary-baseline.md",
      ],
      goBackendBaselineCapabilities,
      typeScriptSurfaceSeed:
        ".planning/artifacts/v1.15-typescript-surface-labels.json",
    },
    globalPolicies: {
      normalTypeScriptBackendAllowed: false,
      fallbackPolicy: "no_silent_typescript_backend_fallback",
      strategyRuntimeAbi: "strategy-runtime-abi-v1.14",
      runtimeExecutionService: "runtime-execution-service-v1.15",
      goExecutesStrategyCode: false,
      webExecutesStrategyCode: false,
      nodeVmSecurityBoundaryAllowed: false,
      nodeWasiUntrustedSandboxAllowed: false,
      productionSandboxReplacementInScope: false,
      runtimeBrokerImplementationInScope: false,
      countedNonJsPlayInScope: false,
      goMigrationSchemaOwnershipInScope: false,
      cloudDeploymentInScope: false,
      publicOutputForbiddenByDefault,
      nonGoals,
    },
    scanner: {
      generatedBy: "scripts/generate-typescript-backend-inventory.ts",
      roots: scannerRoots,
      classificationSeed:
        ".planning/artifacts/v1.15-typescript-surface-labels.json",
      strictBoundaryBaseline: {
        strictOffenses: 0,
        reportOnlyOffenses: 29,
        source: ".planning/artifacts/v1.15-boundary-baseline.md",
      },
    },
    surfaces,
  }

  const errors = validateTypeScriptBackendInventory(inventory)
  if (errors.length > 0) {
    throw new Error(
      `Invalid TypeScript backend inventory:\n${errors.join("\n")}`,
    )
  }

  return inventory
}

const markdownEscape = (value: string | null | readonly string[]): string => {
  const text = Array.isArray(value) ? value.join(", ") : (value ?? "")
  return text.replaceAll("|", "\\|").replaceAll("\n", " ")
}

export const renderTypeScriptBackendInventoryMarkdown = (
  inventory: TypeScriptBackendInventory,
): string => {
  const rows = inventory.surfaces
    .map(
      (surface) =>
        `| ${markdownEscape(surface.id)} | ${markdownEscape(surface.path)} | ${markdownEscape(surface.kind)} | ${markdownEscape(surface.role)} | ${markdownEscape(surface.retirementAction)} | ${markdownEscape(surface.normalBackendOwner)} | ${markdownEscape(surface.fallbackPolicy)} | ${markdownEscape(surface.privacyClass)} | ${markdownEscape(surface.gate)} | ${markdownEscape(surface.risk)} | ${markdownEscape(surface.futureMigration)} | ${markdownEscape(surface.routeMethods)} | ${markdownEscape(surface.goRouteIds)} | ${markdownEscape(surface.sourceRefs)} |`,
    )
    .join("\n")

  return `# TypeScript Backend Inventory

**Schema:** ${inventory.schemaVersion}
**Milestone:** ${inventory.milestone}
**Generated:** ${inventory.generatedAt}

## Contract

- Normal TypeScript backend allowed: ${inventory.globalPolicies.normalTypeScriptBackendAllowed}
- Fallback policy: ${inventory.globalPolicies.fallbackPolicy}
- Strategy runtime ABI: ${inventory.globalPolicies.strategyRuntimeAbi}
- Runtime execution service: ${inventory.globalPolicies.runtimeExecutionService}
- Go backend baseline: ${inventory.baselineReferences.goBackendBaselineCapabilities.join(", ")}
- Allowed roles: ${inventory.allowedRoles.join(", ")}

## Non-Goals

${inventory.globalPolicies.nonGoals.map((goal) => `- ${goal}`).join("\n")}

## Public Output Forbidden By Default

${inventory.globalPolicies.publicOutputForbiddenByDefault
  .map((marker) => `- ${marker}`)
  .join("\n")}

## Surface Matrix

| ID | Path | Kind | Role | Retirement Action | Normal Backend Owner | Fallback Policy | Privacy Class | Gate | Risk | Future Migration | Route Methods | Go Route IDs | Source Refs |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows}
`
}

export const renderTypeScriptBackendInventoryJson = (
  inventory: TypeScriptBackendInventory,
): string => `${JSON.stringify(inventory, null, 2)}\n`

const artifactPaths = {
  json: ".planning/artifacts/v1.16-typescript-backend-inventory.json",
  markdown: ".planning/artifacts/v1.16-typescript-backend-inventory.md",
} as const

export const writeTypeScriptBackendInventoryArtifacts = (
  options: GenerateTypeScriptBackendInventoryOptions = {},
): TypeScriptBackendInventory => {
  const root = options.repoRoot ?? repoRoot
  const inventory = generateTypeScriptBackendInventory({ repoRoot: root })
  const jsonPath = path.join(root, artifactPaths.json)
  const markdownPath = path.join(root, artifactPaths.markdown)
  mkdirSync(path.dirname(jsonPath), { recursive: true })
  mkdirSync(path.dirname(markdownPath), { recursive: true })
  writeFileSync(jsonPath, renderTypeScriptBackendInventoryJson(inventory))
  writeFileSync(
    markdownPath,
    renderTypeScriptBackendInventoryMarkdown(inventory),
  )
  return inventory
}

export const checkTypeScriptBackendInventoryArtifacts = (
  options: GenerateTypeScriptBackendInventoryOptions = {},
): readonly string[] => {
  const root = options.repoRoot ?? repoRoot
  const inventory = generateTypeScriptBackendInventory({ repoRoot: root })
  const expectedJson = renderTypeScriptBackendInventoryJson(inventory)
  const expectedMarkdown = renderTypeScriptBackendInventoryMarkdown(inventory)
  const checks = [
    [artifactPaths.json, expectedJson],
    [artifactPaths.markdown, expectedMarkdown],
  ] as const
  const failures: string[] = []
  for (const [relativePath, expected] of checks) {
    const absolutePath = path.join(root, relativePath)
    if (!existsSync(absolutePath)) {
      failures.push(`${relativePath} is missing`)
      continue
    }
    const actual = readFileSync(absolutePath, "utf8")
    if (actual !== expected) {
      failures.push(`${relativePath} is stale`)
    }
  }
  return failures
}

const runCli = () => {
  const args = new Set(process.argv.slice(2))
  if (args.has("--write")) {
    const inventory = writeTypeScriptBackendInventoryArtifacts()
    console.log(
      `Wrote ${artifactPaths.json} and ${artifactPaths.markdown} (${inventory.surfaces.length} surfaces)`,
    )
    return
  }
  if (args.has("--check")) {
    const failures = checkTypeScriptBackendInventoryArtifacts()
    if (failures.length > 0) {
      console.error(`TypeScript backend inventory artifacts are stale:`)
      for (const failure of failures) {
        console.error(`- ${failure}`)
      }
      process.exitCode = 1
      return
    }
    console.log("TypeScript backend inventory artifacts are current")
    return
  }

  const inventory = generateTypeScriptBackendInventory()
  process.stdout.write(renderTypeScriptBackendInventoryJson(inventory))
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCli()
}
