#!/usr/bin/env -S pnpm exec tsx
import { spawnSync } from "node:child_process"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  assertRequiredSandboxCandidatesPassed,
  assertSandboxEvaluationPublicSafe,
  evaluateRuntimeSandboxes,
} from "../packages/runtime-js/src/sandbox-evaluation.ts"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, "..")
const artifactPath = path.join(
  repoRoot,
  ".planning/artifacts/runtime-sandbox-evaluation.json",
)
const readinessJsonPath = path.join(
  repoRoot,
  ".planning/artifacts/v1.19-runtime-isolation-readiness.json",
)
const readinessMarkdownPath = path.join(
  repoRoot,
  ".planning/artifacts/v1.19-runtime-isolation-readiness.md",
)
const staleMessage =
  "Runtime sandbox evaluation artifact is stale; run pnpm sandbox:evaluate"

const stableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(stableValue)
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entryValue]) => [key, stableValue(entryValue)]),
    )
  }
  return value
}

const serialize = (value: unknown): string =>
  `${JSON.stringify(stableValue(value), null, 2)}\n`

const commandAvailable = (command: string): boolean => {
  const result = spawnSync("sh", ["-lc", `command -v ${command}`], {
    encoding: "utf8",
    shell: false,
    timeout: 1_000,
  })
  return result.status === 0
}

const readinessArtifact = (
  report: ReturnType<typeof evaluateRuntimeSandboxes>,
) =>
  ({
    schemaVersion: "v1.19-runtime-isolation-readiness",
    generatedAt: report.generatedAt,
    abiVersion: report.abiVersion,
    status: report.runtimeIsolationReadiness.status,
    noCandidatePromoted: report.noCandidatePromoted,
    promotionAllowed: report.runtimeIsolationReadiness.promotionAllowed,
    readinessLanes: report.runtimeIsolationReadiness.readinessLanes,
    noFallbackDrills: report.runtimeIsolationReadiness.noFallbackDrills,
    candidates: report.candidates.map((candidate) => ({
      id: candidate.id,
      label: candidate.label,
      mode: candidate.mode,
      status: candidate.status,
      supportedLocally: candidate.supportedLocally,
      specReadiness: candidate.specReadiness,
      countedResultsAllowed: candidate.countedResultsAllowed,
      summary: candidate.summary,
      proves:
        candidate.status === "passed"
          ? "Probe behavior matched the current runtime ABI expectations for this local lane."
          : candidate.supportedLocally
            ? "Availability/compatibility only; no live probe pass is claimed."
            : "Unavailable or unsupported locally; no live proof is claimed.",
      doesNotProve:
        "Production sandbox certification, counted Python eligibility, or broad multi-language support.",
    })),
  }) as const

const readinessMarkdown = (
  report: ReturnType<typeof evaluateRuntimeSandboxes>,
): string => {
  const artifact = readinessArtifact(report)
  const lines = [
    "# v1.19 Runtime Isolation Readiness Evidence",
    "",
    `Generated: ${artifact.generatedAt}`,
    "",
    "## Decision",
    "",
    "- Runtime isolation remains readiness evidence only.",
    "- No candidate is promoted to production sandbox certification.",
    "- Python remains non-counted exhibition beta only.",
    "",
    "## Readiness Lanes",
    "",
    "| Lane | Default gate | Command | Unavailable behavior |",
    "|---|---:|---|---|",
    ...artifact.readinessLanes.map(
      (lane) =>
        `| ${lane.label} | ${lane.requiredForDefaultMilestonePass ? "yes" : "no"} | \`${lane.command}\` | ${lane.unavailableBehavior} |`,
    ),
    "",
    "## Candidate Evidence",
    "",
    "| Candidate | Mode | Status | Local support | Proves | Does not prove |",
    "|---|---|---|---:|---|---|",
    ...artifact.candidates.map(
      (candidate) =>
        `| ${candidate.label} | ${candidate.mode} | ${candidate.status} | ${candidate.supportedLocally ? "yes" : "no"} | ${candidate.proves} | ${candidate.doesNotProve} |`,
    ),
    "",
    "## Explicit No-Fallback Drills",
    "",
    ...artifact.noFallbackDrills.map(
      (drill) => `- ${drill.label}: ${drill.expectedFailureMode}`,
    ),
    "",
  ]
  return `${lines.join("\n")}\n`
}

const report = evaluateRuntimeSandboxes({ defaultProbeTimeoutMs: 5_000 })
assertSandboxEvaluationPublicSafe(report)

const checkMode = process.argv.includes("--check")
const requireContainer = process.argv.includes("--require-container")
const requireRunsc = process.argv.includes("--require-runsc")
const next = serialize(report)
const nextReadinessJson = serialize(readinessArtifact(report))
const nextReadinessMarkdown = readinessMarkdown(report)

if (requireContainer) {
  assertRequiredSandboxCandidatesPassed(report, ["container-subprocess"])
}
if (requireRunsc) {
  if (!commandAvailable("runsc")) {
    throw new Error(
      "Required sandbox candidate gvisor-runsc is unavailable locally; strict evidence lane cannot silently substitute another runtime.",
    )
  }
  throw new Error(
    "Required sandbox candidate gvisor-runsc has no executable probe adapter in v1.19; strict runsc evidence cannot pass until probes run under runsc.",
  )
}

if (checkMode) {
  const current = readFileSync(artifactPath, "utf8")
  if (current !== next) {
    throw new Error(staleMessage)
  }
  const currentReadinessJson = readFileSync(readinessJsonPath, "utf8")
  if (currentReadinessJson !== nextReadinessJson) {
    throw new Error(
      "v1.19 runtime readiness JSON artifact is stale; run pnpm sandbox:evaluate",
    )
  }
  const currentReadinessMarkdown = readFileSync(readinessMarkdownPath, "utf8")
  if (currentReadinessMarkdown !== nextReadinessMarkdown) {
    throw new Error(
      "v1.19 runtime readiness Markdown artifact is stale; run pnpm sandbox:evaluate",
    )
  }
} else {
  mkdirSync(path.dirname(artifactPath), { recursive: true })
  writeFileSync(artifactPath, next)
  writeFileSync(readinessJsonPath, nextReadinessJson)
  writeFileSync(readinessMarkdownPath, nextReadinessMarkdown)
}
