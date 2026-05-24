#!/usr/bin/env -S pnpm exec tsx
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { assertPublicOutputLeakSafe } from "../packages/spec/src/public-output-privacy.ts"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

export const finalTypeScriptSurfaceLabelSchemaVersion =
  "v1.16-final-typescript-surface-labels" as const
const milestone = "v1.16" as const
const phase = "107" as const
const generatedAt = "2026-05-24" as const

const sourceInventoryPath =
  ".planning/artifacts/v1.16-typescript-backend-inventory.json" as const

const artifactPaths = {
  json: ".planning/artifacts/v1.16-final-typescript-surface-labels.json",
  markdown: ".planning/artifacts/v1.16-final-typescript-surface-labels.md",
} as const

const phase107DecisionCoverage = [
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
] as const

const requiredTaxonomyRoles = [
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

const requiredCapabilityGroups = [
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

const publicOutputForbiddenMarkers = [
  "strategyMemory",
  "soldierMemory",
  "objectivePayload",
  "ownerDebug",
  "ownerPrivate",
  "rawAwarenessGrid",
  "stack",
  "stderr",
  "token",
  "session",
  "databaseUrl",
  "dbDsn",
  "hostPath",
  "privateRuntimeInternals",
] as const

type TaxonomyRole = (typeof requiredTaxonomyRoles)[number]

interface InventorySurface {
  path: string
  role: TaxonomyRole
  kind: string
  owner: string
  reason: string
  risk: string
  privacyClass: string
  gate: string
  futureMigration: string
  routeFamily: string
  routeMethods: readonly string[]
  normalBackendOwner: string
  fallbackPolicy: string
  usesDatabase: boolean
  claimsJobs: boolean
  completesMatches: boolean
  persistsChronicles: boolean
  refreshesScoring: boolean
  servesPublicEvidence: boolean
  executesStrategy: boolean
  ownerDebugAccess: boolean
}

interface InventoryArtifact {
  schemaVersion: "v1.16-typescript-backend-inventory"
  surfaces: readonly InventorySurface[]
}

export interface FinalTypeScriptSurfaceLabel {
  id: string
  path: string
  kind: string
  taxonomyRole: TaxonomyRole
  surfaceLabel: string
  capabilityGroup: string
  owner: string
  reason: string
  risk: string
  privacyClass: string
  gate: string
  futureMigration: string
  monitorStatus: string
  selectedNormal: boolean
  selectedNormalJustification: string
  publicOutputPrivacy: "public-redacted" | "owner-private" | "not-public-output"
  noPublicFallback: boolean
  normalBackendAuthority: false
  routeMethods: readonly string[]
  routeFamily: string
  sourceInventoryRole: TaxonomyRole
  publicOutputExample: Record<string, unknown>
}

export interface FinalTypeScriptSurfaceLabelsArtifact {
  schemaVersion: typeof finalTypeScriptSurfaceLabelSchemaVersion
  milestone: typeof milestone
  phase: typeof phase
  generatedAt: typeof generatedAt
  generatedBy: "scripts/generate-typescript-surface-labels.ts"
  sourceInventoryPath: typeof sourceInventoryPath
  sourceInventorySurfaceCount: number
  globalPolicies: {
    normalTypeScriptBackendAllowed: false
    publicOutputPrivacyRequired: true
    selectedNormalRequiresNoBackendAuthority: true
    ownerDebugPublicEvidenceFallbackAllowed: false
    testSupportNormalProductTrafficAllowed: false
  }
  roleCounts: Record<string, number>
  capabilityGroups: Record<string, number>
  publicOutputForbiddenMarkers: readonly string[]
  phase107DecisionCoverage: readonly string[]
  surfaces: readonly FinalTypeScriptSurfaceLabel[]
}

export interface GenerateFinalTypeScriptSurfaceLabelsOptions {
  repoRoot?: string
}

const readJson = <T>(root: string, relativePath: string): T =>
  JSON.parse(readFileSync(path.join(root, relativePath), "utf8")) as T

const countBy = <T>(
  values: readonly T[],
  select: (value: T) => string,
): Record<string, number> => {
  const counts: Record<string, number> = {}
  for (const value of values) {
    const key = select(value)
    counts[key] = (counts[key] ?? 0) + 1
  }
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)))
}

const idFor = (repoPath: string): string =>
  repoPath
    .replace(/\.(tsx|ts)$/, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()

const isWorkshopPath = (repoPath: string): boolean =>
  repoPath.includes("/workshop/") ||
  repoPath.includes("workshop-") ||
  repoPath.endsWith("/workshop.ts")

const classifyWorkshopLabel = (repoPath: string): string => {
  if (repoPath.includes("/validate/")) return "deferred-workshop-validation"
  if (
    repoPath.includes("/source/") ||
    repoPath.includes("/revisions/") ||
    repoPath.includes("/submit/") ||
    repoPath.includes("monaco-editor") ||
    repoPath.includes("workshop-client")
  ) {
    return "deferred-workshop-private-source"
  }
  if (
    repoPath.includes("/tests/") ||
    repoPath.includes("/test/") ||
    repoPath.endsWith("/tests/route.ts") ||
    repoPath.endsWith("/test/route.ts")
  ) {
    return "deferred-workshop-test-launch"
  }
  if (repoPath.includes("/analytics/export/")) return "deferred-workshop-export"
  if (repoPath.includes("/analytics/profiles/route.ts")) {
    return "deferred-workshop-profile-save"
  }
  if (repoPath.includes("/analytics/")) return "deferred-workshop-analytics-rerun"
  if (
    repoPath.includes("/workshop/evidence/") ||
    repoPath.includes("heatmap") ||
    repoPath.includes("/workshop/page") ||
    repoPath.includes("/workshop/types") ||
    repoPath.includes("analytics-test-fixture")
  ) {
    return "deferred-workshop-ui"
  }
  return "deferred-workshop-runtime-support"
}

const classifySurface = (
  surface: InventorySurface,
): Pick<
  FinalTypeScriptSurfaceLabel,
  | "surfaceLabel"
  | "capabilityGroup"
  | "gate"
  | "futureMigration"
  | "privacyClass"
  | "publicOutputPrivacy"
  | "noPublicFallback"
  | "selectedNormal"
  | "selectedNormalJustification"
  | "monitorStatus"
> => {
  const repoPath = surface.path
  if (isWorkshopPath(repoPath)) {
    return {
      surfaceLabel: classifyWorkshopLabel(repoPath),
      capabilityGroup: "Workshop",
      gate:
        "deferred Workshop owner/session/local gate; private revision text and diagnostics are not public output",
      futureMigration:
        "Future Go Workshop migration may select validation, private revision, test launch, analytics rerun, profile save, export, or runtime support one slice at a time.",
      privacyClass: repoPath.includes("source")
        ? "owner-private-source"
        : "owner-private-workshop",
      publicOutputPrivacy: "owner-private",
      noPublicFallback: true,
      selectedNormal: false,
      selectedNormalJustification: "Deferred Workshop behavior is not selected normal backend traffic.",
      monitorStatus: "phase-107-monitor-enforced",
    }
  }
  if (
    repoPath.includes("/api/ladder/") ||
    repoPath.includes("/ladder/") ||
    repoPath.endsWith("/ladder.ts")
  ) {
    return {
      surfaceLabel: "deferred-ladder-mutation",
      capabilityGroup: "ladder",
      gate: "deferred ladder owner/session/admin gate; no selected normal TypeScript mutation ownership",
      futureMigration: "Future Go ladder mutation and scheduling migration target.",
      privacyClass: "session-or-public-redacted",
      publicOutputPrivacy: "not-public-output",
      noPublicFallback: true,
      selectedNormal: false,
      selectedNormalJustification: "Broader ladder mutation remains deferred.",
      monitorStatus: "phase-107-monitor-enforced",
    }
  }
  if (repoPath.includes("/api/admin/") || repoPath.includes("governance")) {
    return {
      surfaceLabel: "deferred-governance-admin-mutation",
      capabilityGroup: "governance-admin",
      gate: "deferred admin authorization gate; public output is limited to redacted governance status",
      futureMigration: "Future Go governance/admin mutation migration target.",
      privacyClass: "admin-private",
      publicOutputPrivacy: "not-public-output",
      noPublicFallback: true,
      selectedNormal: false,
      selectedNormalJustification: "Governance/admin mutation remains deferred.",
      monitorStatus: "phase-107-monitor-enforced",
    }
  }
  if (repoPath.includes("owner-debug") || surface.ownerDebugAccess) {
    return {
      surfaceLabel: "private-owner-debug-replay",
      capabilityGroup: "owner-debug",
      gate:
        "requires PLAYWRIGHT_TEST=1, NODE_ENV=test, or COWARDS_ENABLE_OWNER_DEBUG_REPLAY=1 plus ownerDebug/debug query, COWARDS_OWNER_DEBUG_REQUESTER_PLAYER_ID, and persisted owner authorization",
      futureMigration:
        "Future Go owner-debug replay projection migration; public replay evidence must not fallback to this path.",
      privacyClass: "owner-private-replay-debug",
      publicOutputPrivacy: "owner-private",
      noPublicFallback: true,
      selectedNormal: false,
      selectedNormalJustification: "Owner-debug replay is private/deferred and never public evidence fallback.",
      monitorStatus: "phase-107-monitor-enforced",
    }
  }
  if (repoPath.includes("/api/test-support/")) {
    return {
      surfaceLabel: "test-support-route",
      capabilityGroup: "test-support",
      gate: "PLAYWRIGHT_TEST=1 or NODE_ENV=test test-support route gate; 404 in normal product runtime",
      futureMigration: "Keep only for automated tests; delete when external verification no longer needs it.",
      privacyClass: "test-diagnostics-redacted",
      publicOutputPrivacy: "not-public-output",
      noPublicFallback: true,
      selectedNormal: false,
      selectedNormalJustification: "Test-support routes cannot serve normal product runtime traffic.",
      monitorStatus: "phase-107-monitor-enforced",
    }
  }
  if (surface.role === "fixture-only" || repoPath.includes("fixture")) {
    return {
      surfaceLabel: "fixture-only",
      capabilityGroup: "fixture",
      gate: "PLAYWRIGHT_TEST=1, NODE_ENV=test, or explicit fixture env gate; no development-mode product traffic",
      futureMigration: "Keep as local fixture support only; delete when replay/page smoke no longer needs it.",
      privacyClass: "fixture-public-redacted",
      publicOutputPrivacy: "not-public-output",
      noPublicFallback: true,
      selectedNormal: false,
      selectedNormalJustification: "Fixtures are local/test support, not normal runtime.",
      monitorStatus: "phase-107-monitor-enforced",
    }
  }
  if (surface.role === "parity-only") {
    return {
      surfaceLabel: "parity-reference",
      capabilityGroup: "parity",
      gate: "parity fixture generation or monitor-only reference gate",
      futureMigration: "Delete or further quarantine after Go parity evidence no longer depends on TypeScript reference output.",
      privacyClass: "parity-reference-not-public",
      publicOutputPrivacy: "not-public-output",
      noPublicFallback: true,
      selectedNormal: false,
      selectedNormalJustification: "Parity reference code is not normal product backend traffic.",
      monitorStatus: "phase-107-monitor-enforced",
    }
  }
  if (surface.role === "rollback-only") {
    return {
      surfaceLabel: "rollback-only",
      capabilityGroup: "rollback",
      gate: "explicit rollback operator gate with single Go or TypeScript lifecycle owner",
      futureMigration: "Delete or keep quarantined after no-TypeScript-backend topology reaches strict closure.",
      privacyClass: "rollback-diagnostics-redacted",
      publicOutputPrivacy: "not-public-output",
      noPublicFallback: true,
      selectedNormal: false,
      selectedNormalJustification: "Rollback paths require operator selection and cannot be mixed with Go normal ownership.",
      monitorStatus: "phase-107-monitor-enforced",
    }
  }
  if (surface.role === "quarantined") {
    return {
      surfaceLabel: "quarantined-lifecycle",
      capabilityGroup: "rollback",
      gate: "quarantine subpath import gate; absent from normal persistence root",
      futureMigration: "Delete or narrow after all rollback and replay-owner debug dependencies are retired.",
      privacyClass: "quarantined-private",
      publicOutputPrivacy: "not-public-output",
      noPublicFallback: true,
      selectedNormal: false,
      selectedNormalJustification: "Quarantined lifecycle code is not normal product backend traffic.",
      monitorStatus: "phase-107-monitor-enforced",
    }
  }
  if (surface.role === "runtime-service") {
    return {
      surfaceLabel: "runtime-service-execution-boundary",
      capabilityGroup: "runtime-service",
      gate: "runtime-execution-service-v1.15 schema, DB-free boundary, and no backend authority",
      futureMigration: "May be fronted or replaced by a language-neutral Strategy Execution Service / Runtime Broker.",
      privacyClass: "internal-runtime-redacted",
      publicOutputPrivacy: "not-public-output",
      noPublicFallback: true,
      selectedNormal: true,
      selectedNormalJustification: "Allowed selected TypeScript role is isolated runtime execution service with no backend authority.",
      monitorStatus: "phase-107-monitor-enforced",
    }
  }
  if (surface.role === "runtime-adapter") {
    return {
      surfaceLabel: "runtime-adapter-execution-boundary",
      capabilityGroup: "runtime-adapter",
      gate: "strategy-runtime-abi-v1.14 adapter contract within isolated runtime boundary",
      futureMigration: "May be fronted by a future Runtime Broker while preserving ABI envelopes.",
      privacyClass: "internal-runtime-redacted",
      publicOutputPrivacy: "not-public-output",
      noPublicFallback: true,
      selectedNormal: true,
      selectedNormalJustification: "Allowed selected TypeScript role is runtime adapter code inside the execution boundary.",
      monitorStatus: "phase-107-monitor-enforced",
    }
  }
  if (surface.role === "test-only") {
    return {
      surfaceLabel: "test-only",
      capabilityGroup: "test-support",
      gate: "Vitest/Playwright-only test infrastructure gate",
      futureMigration: "Keep only while focused monitors and tests require it.",
      privacyClass: "test-only",
      publicOutputPrivacy: "not-public-output",
      noPublicFallback: true,
      selectedNormal: false,
      selectedNormalJustification: "Tests cannot serve product runtime traffic.",
      monitorStatus: "phase-107-monitor-enforced",
    }
  }
  if (surface.role === "deferred") {
    const privateSource =
      repoPath.includes("account-revisions") ||
      repoPath.includes("auth") ||
      repoPath.includes("account-service-adapter")
    return {
      surfaceLabel: privateSource
        ? "deferred-account-private-source"
        : "deferred-service-support",
      capabilityGroup: privateSource ? "Workshop" : "owner-debug",
      gate: privateSource
        ? "deferred owner/session authorization gate; private revision text and session data are not public output"
        : "deferred support gate; selected public Go paths must not fallback to local TypeScript service behavior",
      futureMigration: privateSource
        ? "Future selected Go/account or Workshop migration should retire this private deferred support path."
        : "Future Go migration or deletion should retire this deferred TypeScript support path.",
      privacyClass: privateSource
        ? "owner-private-source"
        : "deferred-private-support",
      publicOutputPrivacy: "owner-private",
      noPublicFallback: true,
      selectedNormal: false,
      selectedNormalJustification:
        "Deferred TypeScript support is not selected normal backend traffic.",
      monitorStatus: "phase-107-monitor-enforced",
    }
  }
  return {
    surfaceLabel: repoPath.includes("/api/account/revisions") && repoPath.includes("/source/")
      ? "frontend-go-private-source-adapter"
      : "frontend-go-adapter",
    capabilityGroup: "frontend-only",
    gate: "selected Go adapter/schema validation/no TypeScript backend fallback gate",
    futureMigration: "Keep as frontend or Go adapter only; remove any future local backend fallback drift.",
    privacyClass: repoPath.includes("/source/")
      ? "owner-private-source-through-go"
      : "frontend-public-or-session-redacted",
    publicOutputPrivacy: repoPath.includes("/source/")
      ? "owner-private"
      : "public-redacted",
    noPublicFallback: true,
    selectedNormal: true,
    selectedNormalJustification: "Allowed selected TypeScript role is frontend or Go adapter with no backend authority.",
    monitorStatus: "phase-107-monitor-enforced",
  }
}

const publicOutputExampleFor = (
  surface: InventorySurface,
  label: ReturnType<typeof classifySurface>,
): Record<string, unknown> => ({
  path: surface.path,
  taxonomyRole: surface.role,
  surfaceLabel: label.surfaceLabel,
  capabilityGroup: label.capabilityGroup,
  selectedNormal: label.selectedNormal,
  noPublicFallback: label.noPublicFallback,
})

const createFinalRow = (
  surface: InventorySurface,
): FinalTypeScriptSurfaceLabel => {
  const label = classifySurface(surface)
  return {
    id: idFor(surface.path),
    path: surface.path,
    kind: surface.kind,
    taxonomyRole: surface.role,
    surfaceLabel: label.surfaceLabel,
    capabilityGroup: label.capabilityGroup,
    owner: surface.owner || "phase_107_surface_owner",
    reason: `${surface.reason} Phase 107 final label: ${label.selectedNormalJustification}`,
    risk: label.surfaceLabel === "frontend-go-adapter" ? surface.risk : `${surface.risk}; ${label.selectedNormalJustification}`,
    privacyClass: label.privacyClass,
    gate: label.gate,
    futureMigration: label.futureMigration,
    monitorStatus: label.monitorStatus,
    selectedNormal: label.selectedNormal,
    selectedNormalJustification: label.selectedNormalJustification,
    publicOutputPrivacy: label.publicOutputPrivacy,
    noPublicFallback: label.noPublicFallback,
    normalBackendAuthority: false,
    routeMethods: surface.routeMethods,
    routeFamily: surface.routeFamily,
    sourceInventoryRole: surface.role,
    publicOutputExample: publicOutputExampleFor(surface, label),
  }
}

export const generateFinalTypeScriptSurfaceLabels = (
  options: GenerateFinalTypeScriptSurfaceLabelsOptions = {},
): FinalTypeScriptSurfaceLabelsArtifact => {
  const root = options.repoRoot ?? repoRoot
  const inventory = readJson<InventoryArtifact>(root, sourceInventoryPath)
  const surfaces = inventory.surfaces.map(createFinalRow)
  const artifact: FinalTypeScriptSurfaceLabelsArtifact = {
    schemaVersion: finalTypeScriptSurfaceLabelSchemaVersion,
    milestone,
    phase,
    generatedAt,
    generatedBy: "scripts/generate-typescript-surface-labels.ts",
    sourceInventoryPath,
    sourceInventorySurfaceCount: inventory.surfaces.length,
    globalPolicies: {
      normalTypeScriptBackendAllowed: false,
      publicOutputPrivacyRequired: true,
      selectedNormalRequiresNoBackendAuthority: true,
      ownerDebugPublicEvidenceFallbackAllowed: false,
      testSupportNormalProductTrafficAllowed: false,
    },
    roleCounts: countBy(surfaces, (surface) => surface.taxonomyRole),
    capabilityGroups: countBy(surfaces, (surface) => surface.capabilityGroup),
    publicOutputForbiddenMarkers,
    phase107DecisionCoverage,
    surfaces,
  }
  const errors = validateFinalTypeScriptSurfaceLabels(artifact)
  if (errors.length > 0) {
    throw new Error(`Invalid final TypeScript surface labels:\n${errors.join("\n")}`)
  }
  return artifact
}

export const validateFinalTypeScriptSurfaceLabels = (
  artifact: FinalTypeScriptSurfaceLabelsArtifact,
): readonly string[] => {
  const errors: string[] = []
  if (artifact.schemaVersion !== finalTypeScriptSurfaceLabelSchemaVersion) {
    errors.push(`schemaVersion must be ${finalTypeScriptSurfaceLabelSchemaVersion}`)
  }
  if (artifact.globalPolicies.normalTypeScriptBackendAllowed !== false) {
    errors.push("normal TypeScript backend must not be allowed")
  }
  if (artifact.globalPolicies.publicOutputPrivacyRequired !== true) {
    errors.push("public output privacy must be required")
  }
  for (const decision of phase107DecisionCoverage) {
    if (!artifact.phase107DecisionCoverage.includes(decision)) {
      errors.push(`missing decision coverage ${decision}`)
    }
  }
  const paths = new Set<string>()
  for (const role of requiredTaxonomyRoles) {
    if (!Object.hasOwn(artifact.roleCounts, role)) {
      errors.push(`missing taxonomy role ${role}`)
    }
  }
  for (const group of requiredCapabilityGroups) {
    if (!Object.hasOwn(artifact.capabilityGroups, group)) {
      errors.push(`missing capability group ${group}`)
    }
  }
  for (const surface of artifact.surfaces) {
    if (paths.has(surface.path)) {
      errors.push(`duplicate surface path ${surface.path}`)
    }
    paths.add(surface.path)
    if (surface.taxonomyRole.includes("backend")) {
      errors.push(`${surface.path} claims normal TypeScript backend taxonomy role`)
    }
    if (surface.normalBackendAuthority !== false) {
      errors.push(`${surface.path} must not claim normal backend authority`)
    }
    for (const field of [
      "owner",
      "reason",
      "risk",
      "privacyClass",
      "gate",
      "futureMigration",
      "monitorStatus",
      "surfaceLabel",
    ] as const) {
      if (surface[field].trim().length === 0) {
        errors.push(`${surface.path} missing ${field}`)
      }
    }
    if (
      surface.taxonomyRole === "deferred" &&
      surface.futureMigration.trim().length === 0
    ) {
      errors.push(`${surface.path} deferred row missing future migration`)
    }
    if (
      surface.selectedNormal &&
      ![
        "frontend-only",
        "runtime-service",
        "runtime-adapter",
      ].includes(surface.taxonomyRole)
    ) {
      errors.push(`${surface.path} selectedNormal is not allowed for ${surface.taxonomyRole}`)
    }
    if (
      surface.surfaceLabel === "private-owner-debug-replay" &&
      !/PLAYWRIGHT_TEST|NODE_ENV=test|COWARDS_ENABLE_OWNER_DEBUG_REPLAY/.test(surface.gate)
    ) {
      errors.push(`${surface.path} owner-debug label missing enablement gate`)
    }
    if (
      surface.surfaceLabel === "private-owner-debug-replay" &&
      !/authorization|owner/.test(surface.gate) &&
      !/authorization|owner/.test(surface.futureMigration)
    ) {
      errors.push(`${surface.path} owner-debug label missing owner authorization`)
    }
    if (
      surface.surfaceLabel === "private-owner-debug-replay" &&
      surface.noPublicFallback !== true
    ) {
      errors.push(`${surface.path} owner-debug label allows public evidence fallback`)
    }
    if (
      (surface.surfaceLabel === "test-support-route" ||
        surface.surfaceLabel === "fixture-only") &&
      !/PLAYWRIGHT_TEST|NODE_ENV=test|fixture|Vitest|Playwright/.test(surface.gate)
    ) {
      errors.push(`${surface.path} test/fixture label missing test gate`)
    }
    try {
      assertPublicOutputLeakSafe(surface.publicOutputExample, surface.path)
    } catch (error) {
      errors.push(
        `${surface.path} public output leak: ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
    }
  }
  if (artifact.sourceInventorySurfaceCount !== artifact.surfaces.length) {
    errors.push("source inventory count does not match final label rows")
  }
  return errors
}

const markdownEscape = (value: string | boolean | readonly string[]): string => {
  const text = Array.isArray(value) ? value.join(", ") : String(value)
  return text.replaceAll("|", "\\|").replaceAll("\n", " ")
}

export const renderFinalTypeScriptSurfaceLabelsMarkdown = (
  artifact: FinalTypeScriptSurfaceLabelsArtifact,
): string => {
  const groups = Object.entries(artifact.capabilityGroups)
    .map(([group, count]) => `- ${group}: ${count}`)
    .join("\n")
  const rows = artifact.surfaces
    .map(
      (surface) =>
        `| ${markdownEscape(surface.path)} | ${markdownEscape(surface.taxonomyRole)} | ${markdownEscape(surface.surfaceLabel)} | ${markdownEscape(surface.capabilityGroup)} | ${markdownEscape(surface.selectedNormal)} | ${markdownEscape(surface.privacyClass)} | ${markdownEscape(surface.gate)} | ${markdownEscape(surface.futureMigration)} | ${markdownEscape(surface.monitorStatus)} |`,
    )
    .join("\n")

  return `# Deferred Surface Relabeling

**Schema:** ${artifact.schemaVersion}
**Milestone:** ${artifact.milestone}
**Phase:** ${artifact.phase}
**Source inventory:** ${artifact.sourceInventoryPath}
**Surface count:** ${artifact.sourceInventorySurfaceCount}

## Global Policies

- Normal TypeScript backend allowed: ${artifact.globalPolicies.normalTypeScriptBackendAllowed}
- Public output privacy required: ${artifact.globalPolicies.publicOutputPrivacyRequired}
- Owner-debug public evidence fallback allowed: ${artifact.globalPolicies.ownerDebugPublicEvidenceFallbackAllowed}
- Test-support normal product traffic allowed: ${artifact.globalPolicies.testSupportNormalProductTrafficAllowed}

## Capability Groups

${groups}

## Decision Coverage

${artifact.phase107DecisionCoverage.map((decision) => `- ${decision}`).join("\n")}

## Surface Labels

| Path | Taxonomy Role | Surface Label | Capability Group | Selected Normal | Privacy Class | Gate | Future Migration | Monitor Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows}
`
}

export const renderFinalTypeScriptSurfaceLabelsJson = (
  artifact: FinalTypeScriptSurfaceLabelsArtifact,
): string => `${JSON.stringify(artifact, null, 2)}\n`

export const writeFinalTypeScriptSurfaceLabelArtifacts = (
  options: GenerateFinalTypeScriptSurfaceLabelsOptions = {},
): FinalTypeScriptSurfaceLabelsArtifact => {
  const root = options.repoRoot ?? repoRoot
  const artifact = generateFinalTypeScriptSurfaceLabels({ repoRoot: root })
  const jsonPath = path.join(root, artifactPaths.json)
  const markdownPath = path.join(root, artifactPaths.markdown)
  mkdirSync(path.dirname(jsonPath), { recursive: true })
  mkdirSync(path.dirname(markdownPath), { recursive: true })
  writeFileSync(jsonPath, renderFinalTypeScriptSurfaceLabelsJson(artifact))
  writeFileSync(markdownPath, renderFinalTypeScriptSurfaceLabelsMarkdown(artifact))
  return artifact
}

export const checkFinalTypeScriptSurfaceLabelArtifacts = (
  options: GenerateFinalTypeScriptSurfaceLabelsOptions = {},
): readonly string[] => {
  const root = options.repoRoot ?? repoRoot
  const artifact = generateFinalTypeScriptSurfaceLabels({ repoRoot: root })
  const checks = [
    [artifactPaths.json, renderFinalTypeScriptSurfaceLabelsJson(artifact)],
    [artifactPaths.markdown, renderFinalTypeScriptSurfaceLabelsMarkdown(artifact)],
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
    const artifact = writeFinalTypeScriptSurfaceLabelArtifacts()
    console.log(
      `Wrote ${artifactPaths.json} and ${artifactPaths.markdown} (${artifact.surfaces.length} surfaces)`,
    )
    return
  }
  if (args.has("--check")) {
    const failures = checkFinalTypeScriptSurfaceLabelArtifacts()
    if (failures.length > 0) {
      console.error("Final TypeScript surface label artifacts are stale:")
      for (const failure of failures) {
        console.error(`- ${failure}`)
      }
      process.exitCode = 1
      return
    }
    console.log("Final TypeScript surface label artifacts are current")
    return
  }
  process.stdout.write(
    renderFinalTypeScriptSurfaceLabelsJson(generateFinalTypeScriptSurfaceLabels()),
  )
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCli()
}
