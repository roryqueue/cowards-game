#!/usr/bin/env -S pnpm exec tsx
import { spawnSync } from "node:child_process"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  DEFAULT_CONTAINER_SUBPROCESS_IMAGE,
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
  ".planning/artifacts/v1.20-runtime-sandbox-candidate-readiness.json",
)
const readinessMarkdownPath = path.join(
  repoRoot,
  ".planning/artifacts/v1.20-runtime-sandbox-candidate-readiness.md",
)
const budgetJsonPath = path.join(
  repoRoot,
  ".planning/artifacts/v1.20-runtime-reliability-budgets.json",
)
const budgetMarkdownPath = path.join(
  repoRoot,
  ".planning/artifacts/v1.20-runtime-reliability-budgets.md",
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

const dockerImageAvailable = (image: string): boolean => {
  const result = spawnSync("docker", ["image", "inspect", image], {
    encoding: "utf8",
    shell: false,
    timeout: 2_000,
  })
  return result.status === 0
}

const dockerRuntimeNames = (): readonly string[] => {
  const result = spawnSync(
    "docker",
    ["info", "--format", "{{json .Runtimes}}"],
    {
      encoding: "utf8",
      shell: false,
      timeout: 2_000,
    },
  )
  if (result.status !== 0) {
    return []
  }
  try {
    const parsed = JSON.parse(result.stdout) as Record<string, unknown>
    return Object.keys(parsed).sort()
  } catch {
    return []
  }
}

const candidatePreflight = () => {
  const dockerAvailable = commandAvailable("docker")
  const containerImage =
    process.env.COWARDS_CONTAINER_SANDBOX_IMAGE ??
    DEFAULT_CONTAINER_SUBPROCESS_IMAGE
  const imageAvailable = dockerAvailable && dockerImageAvailable(containerImage)
  const runtimes = dockerAvailable ? dockerRuntimeNames() : []
  const runscOnPath = commandAvailable("runsc")
  const runscDockerRuntimeAvailable = runtimes.includes("runsc")
  return {
    dockerAvailable,
    containerImage,
    imageAvailable,
    dockerRuntimes: runtimes,
    runscOnPath,
    runscDockerRuntimeAvailable,
    selectedExecutableCandidate:
      dockerAvailable && imageAvailable
        ? "container-subprocess"
        : "host-subprocess",
    runscEvidence:
      runscOnPath && runscDockerRuntimeAvailable
        ? "host runtime present but no executable runsc adapter is implemented"
        : "fail-loud host runtime preflight: runsc is not installed as an executable Docker runtime",
  } as const
}

const preflight = candidatePreflight()
if (
  !process.env.COWARDS_RUN_CONTAINER_SANDBOX &&
  preflight.dockerAvailable &&
  preflight.imageAvailable
) {
  process.env.COWARDS_RUN_CONTAINER_SANDBOX = "1"
}

const readinessArtifact = (
  report: ReturnType<typeof evaluateRuntimeSandboxes>,
) =>
  ({
    schemaVersion: "v1.20-runtime-sandbox-candidate-readiness",
    generatedAt: report.generatedAt,
    abiVersion: report.abiVersion,
    baseline: {
      priorMilestone: "v1.19",
      archivedArtifactsPreserved: [
        ".planning/artifacts/v1.19-runtime-isolation-readiness.json",
        ".planning/artifacts/v1.19-runtime-isolation-readiness.md",
        ".planning/artifacts/v1.19-exhibition-beta-proof.json",
        ".planning/artifacts/v1.19-promotion-decision.md",
      ],
      topology:
        "web frontend -> Go backend -> Strategy Execution Service / Runtime Broker -> isolated runtime implementation(s)",
      jsTsCountedPathIntact: true,
      pythonStatus: "non-counted exhibition beta only",
    },
    candidatePreflight: preflight,
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
    "# v1.20 Runtime Sandbox Candidate Readiness Evidence",
    "",
    `Generated: ${artifact.generatedAt}`,
    "",
    "## Baseline",
    "",
    `- Prior milestone floor: ${artifact.baseline.priorMilestone}.`,
    `- Topology: ${artifact.baseline.topology}.`,
    "- JS/TS remains the counted Strategy path.",
    "- Python remains non-counted exhibition beta only.",
    "",
    "## Decision",
    "",
    "- Runtime isolation remains readiness evidence only.",
    "- No candidate is promoted to production sandbox certification.",
    "- Python remains non-counted exhibition beta only.",
    "- Docker/runc container subprocess is the selected executable candidate when Docker and the configured image are available.",
    "- gVisor/runsc remains fail-loud until installed as a host Docker runtime and backed by executable probe evidence.",
    "",
    "## Candidate Preflight",
    "",
    `- Docker available: ${artifact.candidatePreflight.dockerAvailable ? "yes" : "no"}.`,
    `- Container image \`${artifact.candidatePreflight.containerImage}\` available: ${artifact.candidatePreflight.imageAvailable ? "yes" : "no"}.`,
    `- Docker runtimes: ${artifact.candidatePreflight.dockerRuntimes.join(", ") || "none detected"}.`,
    `- runsc on PATH: ${artifact.candidatePreflight.runscOnPath ? "yes" : "no"}.`,
    `- runsc Docker runtime: ${artifact.candidatePreflight.runscDockerRuntimeAvailable ? "yes" : "no"}.`,
    `- runsc evidence: ${artifact.candidatePreflight.runscEvidence}.`,
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

const budgetArtifact = (report: ReturnType<typeof evaluateRuntimeSandboxes>) =>
  ({
    schemaVersion: "v1.20-runtime-reliability-budgets",
    generatedAt: report.generatedAt,
    budgetPolicy:
      "Outer runtime-service, job, MatchSet, and browser proof budgets may be tuned from evidence; deterministic per-Strategy caps remain unchanged.",
    deterministicStrategyCapsPreserved: true,
    budgets: [
      {
        id: "strategy-call",
        owner: "runtime-service adapter",
        defaultBudgetMs: 500,
        scope:
          "Single Strategy method call inside the selected runtime implementation.",
        adjustableInV120: false,
        evidence:
          "Uses existing deterministic per-call runtime timeout/cap behavior; not loosened for Python exhibition latency.",
      },
      {
        id: "match-execution",
        owner: "Go Match lifecycle plus runtime-service",
        defaultBudgetMs: 90_000,
        scope:
          "Whole Match execution through runtime-service, including repeated Strategy calls.",
        adjustableInV120: true,
        evidence:
          "v1.19 proved whole-Match Python exhibitions need a larger outer HTTP budget than individual Strategy calls.",
      },
      {
        id: "matchset-job-orchestration",
        owner: "Go job lifecycle",
        defaultBudgetMs: 180_000,
        scope:
          "Bounded local proof window for MatchSet jobs, retries, status refresh, and replay availability.",
        adjustableInV120: true,
        evidence:
          "Used to distinguish queued/running/slow/degraded states from runtime Strategy violations.",
      },
      {
        id: "runtime-service-http",
        owner: "Go runtime service client",
        defaultBudgetMs: 90_000,
        scope: "HTTP request from Go backend to runtime-service for one Match.",
        adjustableInV120: true,
        evidence:
          "Backed by COWARDS_RUNTIME_SERVICE_HTTP_TIMEOUT_MS and classified as retryable system failure on timeout.",
      },
      {
        id: "browser-proof",
        owner: "Playwright proof",
        defaultBudgetMs: 360_000,
        scope:
          "Bounded signed-in browser proof covering account, revisions, exhibitions, result, and replay pages.",
        adjustableInV120: true,
        evidence:
          "v1.20 proof remains bounded to three cycles and is not a stress test.",
      },
    ],
  }) as const

const budgetMarkdown = (
  report: ReturnType<typeof evaluateRuntimeSandboxes>,
): string => {
  const artifact = budgetArtifact(report)
  const lines = [
    "# v1.20 Runtime Reliability Budget Evidence",
    "",
    `Generated: ${artifact.generatedAt}`,
    "",
    `Policy: ${artifact.budgetPolicy}`,
    "",
    "| Budget | Owner | Default | Adjustable in v1.20 | Scope |",
    "|---|---|---:|---:|---|",
    ...artifact.budgets.map(
      (budget) =>
        `| ${budget.id} | ${budget.owner} | ${budget.defaultBudgetMs} ms | ${budget.adjustableInV120 ? "yes" : "no"} | ${budget.scope} |`,
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
const nextBudgetJson = serialize(budgetArtifact(report))
const nextBudgetMarkdown = budgetMarkdown(report)

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
    "Required sandbox candidate gvisor-runsc has no executable probe adapter in v1.20; strict runsc evidence cannot pass until probes run under runsc.",
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
      "v1.20 runtime candidate readiness JSON artifact is stale; run pnpm sandbox:evaluate",
    )
  }
  const currentReadinessMarkdown = readFileSync(readinessMarkdownPath, "utf8")
  if (currentReadinessMarkdown !== nextReadinessMarkdown) {
    throw new Error(
      "v1.20 runtime candidate readiness Markdown artifact is stale; run pnpm sandbox:evaluate",
    )
  }
  const currentBudgetJson = readFileSync(budgetJsonPath, "utf8")
  if (currentBudgetJson !== nextBudgetJson) {
    throw new Error(
      "v1.20 runtime reliability budget JSON artifact is stale; run pnpm sandbox:evaluate",
    )
  }
  const currentBudgetMarkdown = readFileSync(budgetMarkdownPath, "utf8")
  if (currentBudgetMarkdown !== nextBudgetMarkdown) {
    throw new Error(
      "v1.20 runtime reliability budget Markdown artifact is stale; run pnpm sandbox:evaluate",
    )
  }
} else {
  mkdirSync(path.dirname(artifactPath), { recursive: true })
  writeFileSync(artifactPath, next)
  writeFileSync(readinessJsonPath, nextReadinessJson)
  writeFileSync(readinessMarkdownPath, nextReadinessMarkdown)
  writeFileSync(budgetJsonPath, nextBudgetJson)
  writeFileSync(budgetMarkdownPath, nextBudgetMarkdown)
}
