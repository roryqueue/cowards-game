#!/usr/bin/env -S pnpm exec tsx
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
// eslint-disable-next-line no-restricted-imports -- Root evaluators execute the spec source directly.
import {
  assertCompetitionPolicyV136PublicLeakSafe,
  assertPublicCompetitionGovernanceLeakSafe,
  assertPublicOutputLeakSafe,
} from "../packages/spec/src/index.ts"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

export const v136ServiceProofSchemaVersion =
  "v1.36-competition-service-proof" as const
export const v136ServiceProofGeneratedBy =
  "apps/web/e2e/v1-36-competition-service-proof.spec.ts" as const
export const v136UnavailableProofGeneratedBy =
  "scripts/evaluate-v1-36-service-proof.ts" as const
export const v136ServiceProofMaxAgeMs = 24 * 60 * 60 * 1_000

export const v136ServiceProofArtifactPaths = {
  json: ".planning/artifacts/v1.36-competition-service-proof.json",
  markdown: ".planning/artifacts/v1.36-competition-service-proof.md",
} as const

export const requiredV136PositiveScenarioIds = ["counted-season-flow"] as const

export const requiredV136NegativeScenarioIds = [
  "stale-provider-proof",
  "missing-provider-proof",
  "source-artifact-mismatch",
  "unsupported-provider-language",
  "hidden-tinygo",
  "invalid-provenance",
  "unavailable-runtime-lane",
  "package-policy-violation",
  "same-user-duplicate-entry",
  "mid-season-replacement",
] as const

export const requiredV136GovernanceScenarioIds = [
  "degraded-result",
  "explicit-non-counted",
  "general-report-no-suppression",
  "entrant-dispute-hold",
  "under-review-disputed",
  "invalid-result",
  "invalidated-result",
  "restore-counted-complete-evidence",
  "restore-counted-incomplete-evidence-rejected",
  "replay-availability-chronicle-derived",
] as const

export const requiredV136BrowserScenarioIds = [
  "live-result-replay-desktop",
  "live-result-replay-mobile",
  "deterministic-replay-events",
] as const

export type V136ServiceProofStatus =
  | "passed-local-services"
  | "not-run-environment-unavailable"

export type V136ServiceProofScenarioKind =
  | "positive"
  | "negative"
  | "governance"
  | "browser"

export interface V136ServiceProofScenario {
  id: string
  kind: V136ServiceProofScenarioKind
  status: "passed" | "failed" | "not-run"
  outcome: string
  category?: string
  durationMs?: number
  links?: readonly string[]
  hashes?: readonly string[]
}

export interface V136ServiceProofEvidenceHash {
  id: string
  sha256: string
}

export interface V136ServiceProof {
  schemaVersion: typeof v136ServiceProofSchemaVersion
  milestone: "v1.36"
  phase: 255
  generatedAt: string
  generatedBy:
    | typeof v136ServiceProofGeneratedBy
    | typeof v136UnavailableProofGeneratedBy
    | "apps/web/e2e/v1-36-governance-service-proof.spec.ts"
    | "apps/web/e2e/v1-36-competition-realism-proof.spec.ts"
  status: V136ServiceProofStatus
  command: "pnpm e2e:v1.36-service-proof"
  limitation: string | null
  topology: {
    accountRevisionWrite: "selected-go-account-revisions"
    competitionMutation: "next-persistence-baseline"
    execution: "go-worker-runtime-service"
    publicReads: "selected-go-public-reads"
  }
  evidenceHashes: readonly V136ServiceProofEvidenceHash[]
  scenarios: readonly V136ServiceProofScenario[]
}

export interface V136ServiceProofValidationOptions {
  now?: Date
  requireServiceProof?: boolean
}

const sha256Pattern = /^[a-f0-9]{64}$/
const scenarioIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const categoryPattern = /^[a-z0-9]+(?:[-_:][a-z0-9]+)*$/
const generatedByValues = new Set<V136ServiceProof["generatedBy"]>([
  v136ServiceProofGeneratedBy,
  v136UnavailableProofGeneratedBy,
  "apps/web/e2e/v1-36-governance-service-proof.spec.ts",
  "apps/web/e2e/v1-36-competition-realism-proof.spec.ts",
])
const kindValues = new Set<V136ServiceProofScenarioKind>([
  "positive",
  "negative",
  "governance",
  "browser",
])
const statusValues = new Set<V136ServiceProofScenario["status"]>([
  "passed",
  "failed",
  "not-run",
])

interface CoercedServiceProof {
  proof?: V136ServiceProof
  format: "canonical" | "playwright-native" | "unknown"
  failures: string[]
}

const concretePrivateMarkers = [
  "/Users/",
  "/home/",
  "node_modules/",
  "site-packages/",
  "DATABASE_URL",
  "REDIS_URL",
  "COWARDS_GO_BACKEND_INTERNAL_TOKEN",
  "postgres://",
  "postgresql://",
  "Bearer ",
  "PRIVATE_",
  "GOLDEN_PRIVATE_",
  "bytesBase64",
  "artifactBytes",
  "strategyMemory",
  "soldierMemory",
  "objectivePayload",
  "rawDiagnostics",
  "runtimeDetails",
  "reporterUserId",
  "operatorUserId",
  "recoveryEvidence",
] as const

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const hashValue = (value: unknown): string =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex")

const isShortPublicText = (value: unknown, maxLength = 240): value is string =>
  typeof value === "string" &&
  value.trim() === value &&
  value.length > 0 &&
  value.length <= maxLength &&
  !/[\r\n]/.test(value)

const requiredScenarioKind = (
  id: string,
): V136ServiceProofScenarioKind | undefined => {
  if ((requiredV136PositiveScenarioIds as readonly string[]).includes(id)) {
    return "positive"
  }
  if ((requiredV136NegativeScenarioIds as readonly string[]).includes(id)) {
    return "negative"
  }
  if ((requiredV136GovernanceScenarioIds as readonly string[]).includes(id)) {
    return "governance"
  }
  if ((requiredV136BrowserScenarioIds as readonly string[]).includes(id)) {
    return "browser"
  }
  return undefined
}

const nativeScenarioRows = (
  value: Record<string, unknown>,
): V136ServiceProofScenario[] => {
  const rows: V136ServiceProofScenario[] = []
  const append = (
    input: unknown,
    fallbackKind?: V136ServiceProofScenarioKind,
  ): void => {
    if (!Array.isArray(input)) return
    for (const entry of input) {
      if (!isRecord(entry) || typeof entry.id !== "string") continue
      const kind = requiredScenarioKind(entry.id) ?? fallbackKind ?? entry.kind
      if (!kindValues.has(kind as V136ServiceProofScenarioKind)) continue
      rows.push({
        id: entry.id,
        kind: kind as V136ServiceProofScenarioKind,
        status: statusValues.has(
          entry.status as V136ServiceProofScenario["status"],
        )
          ? (entry.status as V136ServiceProofScenario["status"])
          : "failed",
        outcome: isShortPublicText(entry.outcome)
          ? entry.outcome
          : `${entry.id} did not provide a public-safe outcome.`,
        ...(typeof entry.category === "string"
          ? { category: entry.category }
          : {}),
        ...(typeof entry.durationMs === "number"
          ? { durationMs: entry.durationMs }
          : {}),
        ...(Array.isArray(entry.links)
          ? {
              links: entry.links.filter(
                (item): item is string => typeof item === "string",
              ),
            }
          : {}),
        ...(Array.isArray(entry.hashes)
          ? {
              hashes: entry.hashes.filter(
                (item): item is string => typeof item === "string",
              ),
            }
          : {}),
      })
    }
  }
  append(value.scenarios)
  append(value.negativeScenarios, "negative")
  append(value.governanceScenarios, "governance")
  append(value.browserScenarios, "browser")
  return rows
}

const coerceV136ServiceProof = (value: unknown): CoercedServiceProof => {
  if (!isRecord(value)) {
    return {
      format: "unknown",
      failures: ["service proof must be an object"],
    }
  }
  if (value.milestone === "v1.36" && value.phase === 255) {
    return {
      proof: value as unknown as V136ServiceProof,
      format: "canonical",
      failures: [],
    }
  }
  if (
    value.schemaVersion !== v136ServiceProofSchemaVersion ||
    value.status !== "passed-local-services"
  ) {
    return {
      format: "unknown",
      failures: ["service proof does not match a supported artifact shape"],
    }
  }

  const topology = isRecord(value.topology) ? value.topology : {}
  const accounts = isRecord(value.accounts) ? value.accounts : {}
  const season = isRecord(value.season) ? value.season : {}
  const execution = isRecord(value.execution) ? value.execution : {}
  const result = isRecord(value.result) ? value.result : {}
  const standings = isRecord(value.standings) ? value.standings : {}
  const privacy = isRecord(value.privacy) ? value.privacy : {}
  const cleanup = isRecord(value.cleanup) ? value.cleanup : {}
  const positiveFacts = [
    topology.postgres === "healthy",
    topology.redisConfiguration === "present",
    topology.goBackend === "healthy",
    topology.runtimeService === "healthy",
    topology.accountRevisionOwner === "go",
    topology.publicReadOwner === "go",
    Number.isSafeInteger(accounts.count) && Number(accounts.count) >= 2,
    accounts.distinct === true,
    accounts.providerReadyRevisionCount === accounts.count,
    Array.isArray(accounts.sourceHashes) &&
      accounts.sourceHashes.length === accounts.count &&
      accounts.sourceHashes.every(
        (entry) => typeof entry === "string" && sha256Pattern.test(entry),
      ),
    typeof season.seasonId === "string" && season.seasonId.length > 0,
    typeof season.matchSetId === "string" && season.matchSetId.length > 0,
    Number.isSafeInteger(season.entryCount) && Number(season.entryCount) >= 2,
    season.scheduleIdempotent === true,
    Number.isSafeInteger(execution.matchCount) &&
      Number(execution.matchCount) > 0,
    execution.completeMatchCount === execution.matchCount,
    Number.isSafeInteger(execution.chronicleHashCount) &&
      Number(execution.chronicleHashCount) > 0,
    result.status === "complete",
    result.countedState === "counted",
    typeof result.resultHref === "string" && result.resultHref.startsWith("/"),
    typeof result.replayHref === "string" && result.replayHref.startsWith("/"),
    standings.deterministicRepeatedRead === true,
    Number.isSafeInteger(standings.rowCount) && Number(standings.rowCount) >= 2,
    Array.isArray(standings.rows) &&
      standings.rows.length === standings.rowCount,
    privacy.publicResultSafe === true,
    privacy.publicSeasonSafe === true,
    privacy.publicReplaySafe === true,
    privacy.proofArtifactSafe === true,
    cleanup.mutableCompetitionRowsRemoved === true,
    cleanup.sessionsRevoked === true,
    cleanup.adminCapabilityRemoved === true,
    cleanup.appendOnlyLifecycleAuditRetained === true,
  ]
  const failures = positiveFacts.every(Boolean)
    ? []
    : ["Playwright service artifact has incomplete positive-flow facts"]
  const scenarios = nativeScenarioRows(value)
  if (positiveFacts.every(Boolean)) {
    scenarios.push({
      id: "counted-season-flow",
      kind: "positive",
      status: "passed",
      outcome:
        "A counted Season completed through live services with deterministic standings and replay evidence.",
      ...(typeof execution.durationMs === "number"
        ? { durationMs: execution.durationMs }
        : {}),
      links: [season.seasonHref, result.resultHref, result.replayHref].filter(
        (entry): entry is string => typeof entry === "string",
      ),
    })
  }

  return {
    format: "playwright-native",
    failures,
    proof: {
      schemaVersion: v136ServiceProofSchemaVersion,
      milestone: "v1.36",
      phase: 255,
      generatedAt:
        typeof value.generatedAt === "string" ? value.generatedAt : "",
      generatedBy: v136ServiceProofGeneratedBy,
      status: "passed-local-services",
      command: "pnpm e2e:v1.36-service-proof",
      limitation: null,
      topology: {
        accountRevisionWrite: "selected-go-account-revisions",
        competitionMutation: "next-persistence-baseline",
        execution: "go-worker-runtime-service",
        publicReads: "selected-go-public-reads",
      },
      evidenceHashes: [
        { id: "public-result", sha256: hashValue(result) },
        { id: "public-standings", sha256: hashValue(standings) },
        { id: "public-replay", sha256: hashValue({ result, execution }) },
      ],
      scenarios,
    },
  }
}

export const parseV136ServiceProofArtifact = (
  value: unknown,
): CoercedServiceProof => coerceV136ServiceProof(value)

const publicSafetyFailures = (value: unknown): string[] => {
  const failures: string[] = []
  for (const guard of [
    assertPublicOutputLeakSafe,
    assertPublicCompetitionGovernanceLeakSafe,
    assertCompetitionPolicyV136PublicLeakSafe,
  ]) {
    try {
      guard(value)
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error))
    }
  }
  const serialized = JSON.stringify(value)
  for (const marker of concretePrivateMarkers) {
    if (serialized.includes(marker)) {
      failures.push(`service proof contains private marker ${marker}`)
    }
  }
  if (/[A-Za-z]:\\/.test(serialized)) {
    failures.push("service proof contains an absolute Windows path")
  }
  return [...new Set(failures)]
}

const validateScenario = (scenario: unknown, index: number): string[] => {
  const prefix = `scenarios[${index}]`
  if (!isRecord(scenario)) return [`${prefix} must be an object`]
  const errors: string[] = []
  if (typeof scenario.id !== "string" || !scenarioIdPattern.test(scenario.id)) {
    errors.push(`${prefix}.id must be a kebab-case public id`)
  }
  if (!kindValues.has(scenario.kind as V136ServiceProofScenarioKind)) {
    errors.push(`${prefix}.kind is invalid`)
  }
  if (
    !statusValues.has(scenario.status as V136ServiceProofScenario["status"])
  ) {
    errors.push(`${prefix}.status is invalid`)
  }
  if (!isShortPublicText(scenario.outcome)) {
    errors.push(`${prefix}.outcome must be short public-safe text`)
  }
  if (
    scenario.category !== undefined &&
    (typeof scenario.category !== "string" ||
      !categoryPattern.test(scenario.category))
  ) {
    errors.push(`${prefix}.category must be a stable public category`)
  }
  if (
    scenario.durationMs !== undefined &&
    (typeof scenario.durationMs !== "number" ||
      !Number.isSafeInteger(scenario.durationMs) ||
      scenario.durationMs < 0)
  ) {
    errors.push(`${prefix}.durationMs must be a non-negative integer`)
  }
  if (
    scenario.links !== undefined &&
    (!Array.isArray(scenario.links) ||
      scenario.links.some(
        (link) =>
          typeof link !== "string" ||
          !link.startsWith("/") ||
          link.startsWith("//") ||
          link.includes("?") ||
          link.includes("#"),
      ))
  ) {
    errors.push(`${prefix}.links must contain public relative paths only`)
  }
  if (
    scenario.hashes !== undefined &&
    (!Array.isArray(scenario.hashes) ||
      scenario.hashes.some(
        (hash) => typeof hash !== "string" || !sha256Pattern.test(hash),
      ))
  ) {
    errors.push(`${prefix}.hashes must contain lowercase SHA-256 values`)
  }
  if (typeof scenario.id === "string") {
    const expectedKind = requiredScenarioKind(scenario.id)
    if (expectedKind && scenario.kind !== expectedKind) {
      errors.push(`${prefix}.kind must be ${expectedKind} for ${scenario.id}`)
    }
  }
  return errors
}

export const validateV136ServiceProof = (
  input: unknown,
  options: V136ServiceProofValidationOptions = {},
): string[] => {
  const coerced = coerceV136ServiceProof(input)
  if (!coerced.proof) return coerced.failures
  const proof = coerced.proof as unknown as Record<string, unknown>
  const errors: string[] = [...coerced.failures]
  if (proof.schemaVersion !== v136ServiceProofSchemaVersion) {
    errors.push(`schemaVersion must be ${v136ServiceProofSchemaVersion}`)
  }
  if (proof.milestone !== "v1.36") errors.push("milestone must be v1.36")
  if (proof.phase !== 255) errors.push("phase must be 255")
  if (
    !generatedByValues.has(proof.generatedBy as V136ServiceProof["generatedBy"])
  ) {
    errors.push("generatedBy is not an approved proof producer")
  }
  if (
    proof.status !== "passed-local-services" &&
    proof.status !== "not-run-environment-unavailable"
  ) {
    errors.push("status is invalid")
  }
  if (proof.command !== "pnpm e2e:v1.36-service-proof") {
    errors.push("command must use the stable package script")
  }

  const generatedAtMs =
    typeof proof.generatedAt === "string" ? Date.parse(proof.generatedAt) : NaN
  if (!Number.isFinite(generatedAtMs)) {
    errors.push("generatedAt must be an ISO timestamp")
  } else {
    const nowMs = (options.now ?? new Date()).getTime()
    if (generatedAtMs > nowMs + 5 * 60 * 1_000) {
      errors.push("service proof generatedAt is in the future")
    }
    if (nowMs - generatedAtMs > v136ServiceProofMaxAgeMs) {
      errors.push("service proof is stale")
    }
  }

  if (!isRecord(proof.topology)) {
    errors.push("topology must be present")
  } else {
    const expectedTopology: V136ServiceProof["topology"] = {
      accountRevisionWrite: "selected-go-account-revisions",
      competitionMutation: "next-persistence-baseline",
      execution: "go-worker-runtime-service",
      publicReads: "selected-go-public-reads",
    }
    for (const [key, value] of Object.entries(expectedTopology)) {
      if (proof.topology[key] !== value) {
        errors.push(`topology.${key} must be ${value}`)
      }
    }
  }

  if (!Array.isArray(proof.evidenceHashes)) {
    errors.push("evidenceHashes must be an array")
  } else {
    const ids = new Set<string>()
    for (const [index, entry] of proof.evidenceHashes.entries()) {
      if (!isRecord(entry)) {
        errors.push(`evidenceHashes[${index}] must be an object`)
        continue
      }
      if (typeof entry.id !== "string" || !scenarioIdPattern.test(entry.id)) {
        errors.push(
          `evidenceHashes[${index}].id must be a kebab-case public id`,
        )
      } else if (ids.has(entry.id)) {
        errors.push(`duplicate evidence hash id ${entry.id}`)
      } else {
        ids.add(entry.id)
      }
      if (
        typeof entry.sha256 !== "string" ||
        !sha256Pattern.test(entry.sha256)
      ) {
        errors.push(`evidenceHashes[${index}].sha256 must be lowercase SHA-256`)
      }
    }
  }

  if (!Array.isArray(proof.scenarios)) {
    errors.push("scenarios must be an array")
  } else {
    proof.scenarios.forEach((scenario, index) =>
      errors.push(...validateScenario(scenario, index)),
    )
    const ids = proof.scenarios
      .filter(isRecord)
      .map((scenario) => scenario.id)
      .filter((id): id is string => typeof id === "string")
    for (const id of new Set(ids)) {
      if (ids.filter((candidate) => candidate === id).length > 1) {
        errors.push(`duplicate scenario id ${id}`)
      }
    }
  }

  const passed = proof.status === "passed-local-services"
  if (passed) {
    if (proof.limitation !== null) {
      errors.push("passed service proof must not include a limitation")
    }
    if (
      !Array.isArray(proof.evidenceHashes) ||
      proof.evidenceHashes.length < 3
    ) {
      errors.push(
        "passed service proof requires result, standings, and replay hashes",
      )
    }
    const scenarios = Array.isArray(proof.scenarios) ? proof.scenarios : []
    for (const id of [
      ...requiredV136PositiveScenarioIds,
      ...requiredV136NegativeScenarioIds,
    ]) {
      const scenario = scenarios.find(
        (candidate) => isRecord(candidate) && candidate.id === id,
      )
      if (!scenario) errors.push(`missing required service scenario ${id}`)
      else if (scenario.status !== "passed") {
        errors.push(`required service scenario ${id} must be passed`)
      }
    }
  } else {
    if (!isShortPublicText(proof.limitation, 160)) {
      errors.push("unavailable service proof requires a short limitation")
    }
    if (Array.isArray(proof.scenarios) && proof.scenarios.length > 0) {
      errors.push("unavailable service proof must not claim scenario evidence")
    }
    if (
      Array.isArray(proof.evidenceHashes) &&
      proof.evidenceHashes.length > 0
    ) {
      errors.push("unavailable service proof must not claim evidence hashes")
    }
  }

  if (options.requireServiceProof && !passed) {
    errors.push("strict mode requires passed-local-services evidence")
  }
  errors.push(...publicSafetyFailures(input))
  return [...new Set(errors)]
}

const normalizeScenario = (
  scenario: V136ServiceProofScenario,
): V136ServiceProofScenario => ({
  id: scenario.id,
  kind: scenario.kind,
  status: scenario.status,
  outcome: scenario.outcome,
  ...(scenario.category === undefined ? {} : { category: scenario.category }),
  ...(scenario.durationMs === undefined
    ? {}
    : { durationMs: scenario.durationMs }),
  ...(scenario.links === undefined ? {} : { links: [...scenario.links] }),
  ...(scenario.hashes === undefined ? {} : { hashes: [...scenario.hashes] }),
})

export const normalizeV136ServiceProof = (
  proof: V136ServiceProof,
): V136ServiceProof => ({
  schemaVersion: v136ServiceProofSchemaVersion,
  milestone: "v1.36",
  phase: 255,
  generatedAt: proof.generatedAt,
  generatedBy: proof.generatedBy,
  status: proof.status,
  command: "pnpm e2e:v1.36-service-proof",
  limitation: proof.limitation,
  topology: {
    accountRevisionWrite: proof.topology.accountRevisionWrite,
    competitionMutation: proof.topology.competitionMutation,
    execution: proof.topology.execution,
    publicReads: proof.topology.publicReads,
  },
  evidenceHashes: [...proof.evidenceHashes]
    .map((entry) => ({ id: entry.id, sha256: entry.sha256 }))
    .sort((left, right) => left.id.localeCompare(right.id)),
  scenarios: [...proof.scenarios]
    .map(normalizeScenario)
    .sort((left, right) => left.id.localeCompare(right.id)),
})

export const renderV136ServiceProofJson = (proof: V136ServiceProof): string =>
  `${JSON.stringify(normalizeV136ServiceProof(proof), null, 2)}\n`

const escapeMarkdown = (value: string): string =>
  value.replaceAll("|", "\\|").replaceAll("\n", " ")

export const renderV136ServiceProofMarkdown = (
  proof: V136ServiceProof,
): string => {
  const normalized = normalizeV136ServiceProof(proof)
  const limitation = normalized.limitation ?? "None"
  return `# v1.36 Competition Service Proof

**Generated:** ${normalized.generatedAt}  
**Status:** ${normalized.status}  
**Command:** \`${normalized.command}\`

This artifact records public-safe service evidence only. An unavailable status is not passed proof.

## Topology

| Boundary | Selected owner |
| --- | --- |
| Account revision write | ${normalized.topology.accountRevisionWrite} |
| Competition mutation | ${normalized.topology.competitionMutation} |
| Execution | ${normalized.topology.execution} |
| Public reads | ${normalized.topology.publicReads} |

## Scenarios

| ID | Kind | Status | Category | Duration (ms) | Links | Outcome |
| --- | --- | --- | --- | ---: | --- | --- |
${
  normalized.scenarios.length
    ? normalized.scenarios
        .map(
          (scenario) =>
            `| ${scenario.id} | ${scenario.kind} | ${scenario.status} | ${scenario.category ?? "-"} | ${scenario.durationMs ?? "-"} | ${(scenario.links ?? []).join("<br>") || "-"} | ${escapeMarkdown(scenario.outcome)} |`,
        )
        .join("\n")
    : "| None | - | - | - | - | - | No live scenarios were recorded. |"
}

## Evidence Hashes

${
  normalized.evidenceHashes.length
    ? normalized.evidenceHashes
        .map((entry) => `- ${entry.id}: \`${entry.sha256}\``)
        .join("\n")
    : "- None"
}

## Limitation

${escapeMarkdown(limitation)}
`
}

export const createV136UnavailableServiceProof = (
  limitation: string,
  generatedAt = new Date().toISOString(),
): V136ServiceProof => ({
  schemaVersion: v136ServiceProofSchemaVersion,
  milestone: "v1.36",
  phase: 255,
  generatedAt,
  generatedBy: v136UnavailableProofGeneratedBy,
  status: "not-run-environment-unavailable",
  command: "pnpm e2e:v1.36-service-proof",
  limitation,
  topology: {
    accountRevisionWrite: "selected-go-account-revisions",
    competitionMutation: "next-persistence-baseline",
    execution: "go-worker-runtime-service",
    publicReads: "selected-go-public-reads",
  },
  evidenceHashes: [],
  scenarios: [],
})

export const readV136ServiceProofArtifact = (
  repo: string = repoRoot,
): V136ServiceProof => {
  const parsed = JSON.parse(
    readFileSync(path.join(repo, v136ServiceProofArtifactPaths.json), "utf8"),
  ) as unknown
  const coerced = coerceV136ServiceProof(parsed)
  if (!coerced.proof) throw new Error(coerced.failures.join("; "))
  return coerced.proof
}

export const writeV136ServiceProofArtifacts = (
  proof: V136ServiceProof,
  repo: string = repoRoot,
  options: V136ServiceProofValidationOptions = {},
): V136ServiceProof => {
  const normalized = normalizeV136ServiceProof(proof)
  const errors = validateV136ServiceProof(normalized, options)
  if (errors.length) {
    throw new Error(`Invalid v1.36 service proof:\n${errors.join("\n")}`)
  }
  mkdirSync(path.join(repo, ".planning/artifacts"), { recursive: true })
  writeFileSync(
    path.join(repo, v136ServiceProofArtifactPaths.json),
    renderV136ServiceProofJson(normalized),
  )
  writeFileSync(
    path.join(repo, v136ServiceProofArtifactPaths.markdown),
    renderV136ServiceProofMarkdown(normalized),
  )
  return normalized
}

export const checkV136ServiceProofArtifacts = (
  repo: string = repoRoot,
  options: V136ServiceProofValidationOptions = {},
): string[] => {
  const jsonPath = path.join(repo, v136ServiceProofArtifactPaths.json)
  const markdownPath = path.join(repo, v136ServiceProofArtifactPaths.markdown)
  if (!existsSync(jsonPath))
    return [`${v136ServiceProofArtifactPaths.json} is missing`]
  let proof: V136ServiceProof
  let raw: unknown
  try {
    raw = JSON.parse(readFileSync(jsonPath, "utf8")) as unknown
    proof = readV136ServiceProofArtifact(repo)
  } catch {
    return [`${v136ServiceProofArtifactPaths.json} is invalid JSON`]
  }
  const format = coerceV136ServiceProof(raw).format
  const errors = validateV136ServiceProof(raw, options)
  if (
    format === "canonical" &&
    readFileSync(jsonPath, "utf8") !== renderV136ServiceProofJson(proof)
  ) {
    errors.push(`${v136ServiceProofArtifactPaths.json} is not canonical`)
  }
  if (!existsSync(markdownPath)) {
    errors.push(`${v136ServiceProofArtifactPaths.markdown} is missing`)
  } else {
    const markdown = readFileSync(markdownPath, "utf8")
    const stale =
      format === "canonical"
        ? markdown !== renderV136ServiceProofMarkdown(proof)
        : !markdown.includes(proof.generatedAt) ||
          !markdown.includes(proof.status)
    if (stale) {
      errors.push(`${v136ServiceProofArtifactPaths.markdown} is stale`)
    }
  }
  return [...new Set(errors)]
}

const main = (): void => {
  const args = new Set(process.argv.slice(2))
  const requireServiceProof =
    process.env.COWARDS_V1_36_REQUIRE_SERVICE_PROOF === "1"
  if (args.has("--record-unavailable")) {
    const limitation = process.env.COWARDS_V1_36_SERVICE_PROOF_LIMITATION ?? ""
    const proof = createV136UnavailableServiceProof(limitation)
    writeV136ServiceProofArtifacts(proof, repoRoot, {
      requireServiceProof: false,
    })
    console.log("recorded unavailable v1.36 service proof")
    return
  }
  if (args.has("--write")) {
    const proof = readV136ServiceProofArtifact(repoRoot)
    writeV136ServiceProofArtifacts(proof, repoRoot, { requireServiceProof })
    console.log("wrote canonical v1.36 service proof artifacts")
    return
  }
  if (args.has("--check")) {
    const errors = checkV136ServiceProofArtifacts(repoRoot, {
      requireServiceProof,
    })
    if (errors.length) {
      console.error("v1.36 service proof check failed:")
      errors.forEach((error) => console.error(`- ${error}`))
      process.exitCode = 1
      return
    }
    console.log("v1.36 service proof artifacts are current")
    return
  }
  console.error("Use --write, --check, or --record-unavailable.")
  process.exitCode = 1
}

if (import.meta.url === `file://${process.argv[1]}`) main()
