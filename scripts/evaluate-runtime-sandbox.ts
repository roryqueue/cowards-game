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
const checkMode = process.argv.includes("--check")
const requireContainer = process.argv.includes("--require-container")
const requireRunsc = process.argv.includes("--require-runsc")
const containerMode =
  requireContainer || process.env.COWARDS_RUN_CONTAINER_SANDBOX === "1"
const artifactSuffix = containerMode ? ".container" : ""
const artifactPath = path.join(
  repoRoot,
  `.planning/artifacts/runtime-sandbox-evaluation${artifactSuffix}.json`,
)
const readinessJsonPath = path.join(
  repoRoot,
  `.planning/artifacts/v1.20-runtime-sandbox-candidate-readiness${artifactSuffix}.json`,
)
const readinessMarkdownPath = path.join(
  repoRoot,
  `.planning/artifacts/v1.20-runtime-sandbox-candidate-readiness${artifactSuffix}.md`,
)
const budgetJsonPath = path.join(
  repoRoot,
  ".planning/artifacts/v1.20-runtime-reliability-budgets.json",
)
const budgetMarkdownPath = path.join(
  repoRoot,
  ".planning/artifacts/v1.20-runtime-reliability-budgets.md",
)
const retryJsonPath = path.join(
  repoRoot,
  ".planning/artifacts/v1.20-exhibition-reliability-retry-semantics.json",
)
const retryMarkdownPath = path.join(
  repoRoot,
  ".planning/artifacts/v1.20-exhibition-reliability-retry-semantics.md",
)
const hostileProbeJsonPath = path.join(
  repoRoot,
  `.planning/artifacts/v1.20-hostile-probe-no-fallback-evidence${artifactSuffix}.json`,
)
const hostileProbeMarkdownPath = path.join(
  repoRoot,
  `.planning/artifacts/v1.20-hostile-probe-no-fallback-evidence${artifactSuffix}.md`,
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

type PreflightValue = boolean | "not-evaluated"

const formatPreflightValue = (value: PreflightValue): string =>
  value === "not-evaluated"
    ? "not evaluated in this lane"
    : value
      ? "yes"
      : "no"

const candidatePreflight = () => {
  const containerImage =
    process.env.COWARDS_CONTAINER_SANDBOX_IMAGE ??
    DEFAULT_CONTAINER_SUBPROCESS_IMAGE
  if (!containerMode) {
    return {
      lane: "default-readiness",
      dockerAvailable: "not-evaluated" as const,
      containerImage,
      imageAvailable: "not-evaluated" as const,
      dockerRuntimes: [] as readonly string[],
      runscOnPath: "not-evaluated" as const,
      runscDockerRuntimeAvailable: "not-evaluated" as const,
      configuredPrimaryCandidate: "container-subprocess",
      executedCandidate: "host-subprocess",
      runscEvidence:
        "not evaluated in default readiness; strict runsc command fails loudly when unavailable",
    } as const
  }
  const dockerAvailable = commandAvailable("docker")
  const imageAvailable = dockerAvailable && dockerImageAvailable(containerImage)
  const runtimes = dockerAvailable ? dockerRuntimeNames() : []
  const runscOnPath = commandAvailable("runsc")
  const runscDockerRuntimeAvailable = runtimes.includes("runsc")
  return {
    lane: "container-required",
    dockerAvailable,
    containerImage,
    imageAvailable,
    dockerRuntimes: runtimes,
    runscOnPath,
    runscDockerRuntimeAvailable,
    configuredPrimaryCandidate: "container-subprocess",
    executedCandidate:
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

const readinessArtifact = (
  report: ReturnType<typeof evaluateRuntimeSandboxes>,
) => {
  const container = report.candidates.find(
    (candidate) => candidate.id === "container-subprocess",
  )
  const hostSubprocess = report.candidates.find(
    (candidate) => candidate.id === "host-subprocess",
  )
  return {
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
    containerControlEvidence: {
      candidateId: "container-subprocess",
      status: container?.status ?? "skipped",
      requestedControls: container?.metadata.runtimeControls ?? null,
      controlEvidenceKind:
        "adapter argv and metadata request; not kernel-level production sandbox certification",
      strictIpc: "schema-validated JSON IPC over stdin/stdout",
      noShell: container?.metadata.runtimeControls?.shell === "disabled",
      evidenceKindCounts: container?.summary ?? null,
    },
    candidateComparison: [
      ...(hostSubprocess
        ? [
            {
              id: hostSubprocess.id,
              status: hostSubprocess.status,
              mode: hostSubprocess.mode,
              evidenceKindCounts: hostSubprocess.summary,
              containment:
                "Host subprocess baseline; process boundary without container filesystem/network controls.",
            },
          ]
        : []),
      ...(container
        ? [
            {
              id: container.id,
              status: container.status,
              mode: container.mode,
              evidenceKindCounts: container.summary,
              containment:
                "Docker/runc container subprocess; requests no network, read-only root, tmpfs scratch, dropped capabilities, no-new-privileges, PID, memory, and CPU controls.",
            },
          ]
        : []),
    ],
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
  } as const
}

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
    `- Lane: ${artifact.candidatePreflight.lane}.`,
    `- Configured primary candidate: ${artifact.candidatePreflight.configuredPrimaryCandidate}.`,
    `- Executed candidate: ${artifact.candidatePreflight.executedCandidate}.`,
    `- Docker available: ${formatPreflightValue(artifact.candidatePreflight.dockerAvailable)}.`,
    `- Container image \`${artifact.candidatePreflight.containerImage}\` available: ${formatPreflightValue(artifact.candidatePreflight.imageAvailable)}.`,
    `- Docker runtimes: ${artifact.candidatePreflight.dockerRuntimes.join(", ") || "none detected"}.`,
    `- runsc on PATH: ${formatPreflightValue(artifact.candidatePreflight.runscOnPath)}.`,
    `- runsc Docker runtime: ${formatPreflightValue(artifact.candidatePreflight.runscDockerRuntimeAvailable)}.`,
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
    "| Candidate | Mode | Status | Local support | Live | Preflight | Synthetic | Proves | Does not prove |",
    "|---|---|---|---:|---:|---:|---:|---|---|",
    ...artifact.candidates.map(
      (candidate) =>
        `| ${candidate.label} | ${candidate.mode} | ${candidate.status} | ${candidate.supportedLocally ? "yes" : "no"} | ${candidate.summary.live ?? 0} | ${candidate.summary.preflight ?? 0} | ${candidate.summary.synthetic ?? 0} | ${candidate.proves} | ${candidate.doesNotProve} |`,
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
    measurementPlan: {
      boundedRepeatCount: 3,
      matchups: ["js-ts-vs-python", "python-vs-python"],
      localEnvironmentMetadata: [
        "runtime adapter ids",
        "language ids",
        "Docker/container candidate lane status",
        "runtime-service HTTP timeout",
        "browser proof timeout",
      ],
      timingSegments: [
        "cold-start",
        "per-call-runtime",
        "whole-match",
        "job-orchestration",
        "result-page",
        "replay-page",
      ],
      stressTest: false,
    },
    budgets: [
      {
        id: "strategy-call",
        owner: "runtime-service adapter",
        defaultBudgetMs: 1_000,
        scope:
          "Single Strategy method call inside the selected runtime implementation.",
        adjustableInV120: false,
        evidence:
          "Uses existing deterministic per-call runtime timeout/cap behavior; not loosened for Python exhibition latency.",
        measurementSegments: ["per-call-runtime"],
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
        measurementSegments: ["whole-match", "per-call-runtime"],
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
        measurementSegments: ["job-orchestration"],
      },
      {
        id: "runtime-service-http",
        owner: "Go runtime service client",
        defaultBudgetMs: 90_000,
        scope: "HTTP request from Go backend to runtime-service for one Match.",
        adjustableInV120: true,
        evidence:
          "Backed by COWARDS_RUNTIME_SERVICE_HTTP_TIMEOUT_MS and classified as retryable system failure on timeout.",
        measurementSegments: ["whole-match"],
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
        measurementSegments: ["result-page", "replay-page"],
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
    "## Measurement Plan",
    "",
    `- Bounded repeat count: ${artifact.measurementPlan.boundedRepeatCount}.`,
    `- Matchups: ${artifact.measurementPlan.matchups.join(", ")}.`,
    `- Timing segments: ${artifact.measurementPlan.timingSegments.join(", ")}.`,
    `- Stress test: ${artifact.measurementPlan.stressTest ? "yes" : "no"}.`,
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

const retryArtifact = (report: ReturnType<typeof evaluateRuntimeSandboxes>) =>
  ({
    schemaVersion: "v1.20-exhibition-reliability-retry-semantics",
    generatedAt: report.generatedAt,
    ownership: {
      retryPolicyOwner: "Go backend job lifecycle",
      matchCompletionOwner: "Go backend",
      scoringOwner: "Go backend",
      publicEvidenceOwner: "Go backend/web public DTOs",
      runtimeServiceOwner:
        "hostile Strategy execution through schema-validated ABI envelopes",
      pythonOwnsBackendBehavior: false,
    },
    publicEvidencePrivateDataSafe: true,
    retryableSystemFailures: [
      "RuntimeServiceStopped",
      "RuntimeServiceTimeout",
      "RuntimeServiceTransport",
      "RuntimeServiceRead",
      "RuntimeServiceOversizedResponse",
      "RuntimeServiceMalformedResponse",
      "RuntimeServiceContractMismatch(response-side)",
      "EXECUTION_EXCEPTION",
      "RESPONSE_SCHEMA_INVALID",
    ],
    internalRuntimeAdapterFailureCodes: [
      "SPAWN_FAILED",
      "STDIO_CAP_EXCEEDED",
      "SUBPROCESS_SIGNAL",
      "SUBPROCESS_EXIT",
      "MALFORMED_IPC",
    ],
    internalRuntimeAdapterFailureHandling:
      "Internal adapter system failure codes are not Go retry classes by name; runtime-service-visible failures surface as EXECUTION_EXCEPTION or RuntimeServiceMalformedResponse, while Python adapter system failures may complete as Match runtime-violation outcomes.",
    nonRetryableFailures: [
      "RuntimeServiceRequestEncode",
      "RuntimeServiceRequestCreate",
      "RuntimeServiceContractMismatch(request/local validation)",
      "RuntimeServiceSourceMismatch",
      "MALFORMED_REQUEST",
      "SOURCE_HASH_MISMATCH",
      "SOURCE_BYTES_MISMATCH",
      "UNSUPPORTED_RUNTIME_ADAPTER",
      "Strategy runtime violation",
      "invalid Strategy output",
      "validation failure",
      "non-counted eligibility violation",
    ],
    playerCausedFailuresAreNotBlindlyRetried: true,
    deterministicStrategyCapsPreserved: true,
    jsTsSupportPreserved: true,
    pythonStatus: "non-counted exhibition beta only",
    pythonCountedEligibility: false,
    productionSandboxCertification: false,
    productionSandboxPromoted: false,
  }) as const

const retryMarkdown = (
  report: ReturnType<typeof evaluateRuntimeSandboxes>,
): string => {
  const artifact = retryArtifact(report)
  const lines = [
    "# v1.20 Exhibition Reliability Retry Semantics",
    "",
    `Generated: ${artifact.generatedAt}`,
    "",
    "## Ownership",
    "",
    `- Retry policy owner: ${artifact.ownership.retryPolicyOwner}.`,
    `- Match completion owner: ${artifact.ownership.matchCompletionOwner}.`,
    `- Scoring owner: ${artifact.ownership.scoringOwner}.`,
    `- Public evidence owner: ${artifact.ownership.publicEvidenceOwner}.`,
    `- Runtime service owner: ${artifact.ownership.runtimeServiceOwner}.`,
    "- Python owns backend behavior: no.",
    "",
    "## Retryable System Failures",
    "",
    ...artifact.retryableSystemFailures.map((failure) => `- ${failure}`),
    "",
    "## Internal Adapter Failure Codes",
    "",
    ...artifact.internalRuntimeAdapterFailureCodes.map(
      (failure) => `- ${failure}`,
    ),
    "",
    artifact.internalRuntimeAdapterFailureHandling,
    "",
    "## Non-Retryable Failures",
    "",
    ...artifact.nonRetryableFailures.map((failure) => `- ${failure}`),
    "",
    "## Guardrails",
    "",
    "- Strategy runtime violations are not blindly retried.",
    "- Deterministic per-Strategy caps are preserved.",
    "- JS/TS support remains intact.",
    "- Python remains non-counted exhibition beta only.",
    "- Python counted eligibility remains false.",
    "- Public evidence remains private-data safe.",
    "- Runtime isolation remains readiness evidence only; no production sandbox certification.",
    "- Runtime sandbox production promotion remains false.",
    "",
  ]
  return `${lines.join("\n")}\n`
}

const hostileProbeArtifact = (
  report: ReturnType<typeof evaluateRuntimeSandboxes>,
) => {
  const lanes = report.candidates
    .filter((candidate) =>
      ["host-subprocess", "container-subprocess"].includes(candidate.id),
    )
    .map((candidate) => ({
      id: candidate.id,
      label: candidate.label,
      status: candidate.status,
      supportedLocally: candidate.supportedLocally,
      summary: candidate.summary,
      probes: candidate.probes.map((probe) => ({
        id: probe.probeId,
        taxonomy: probe.taxonomy,
        resultKind: probe.resultKind,
        code: probe.code,
        passed: probe.passed,
        evidenceKind: probe.evidenceKind,
      })),
    }))
  return {
    schemaVersion: "v1.20-hostile-probe-no-fallback-evidence",
    generatedAt: report.generatedAt,
    candidatePreflight: preflight,
    lanes,
    noFallbackDrills: [
      ...report.runtimeIsolationReadiness.noFallbackDrills,
      {
        id: "docker-unavailable",
        label: "Docker unavailable",
        expectedFailureMode:
          "Container-required evidence exits non-zero or records non-promotion; no subprocess substitution.",
      },
      {
        id: "container-image-unavailable",
        label: "Container image unavailable",
        expectedFailureMode:
          "Strict container lane fails before proof; no mutable hidden pull or candidate substitution.",
      },
      {
        id: "candidate-substitution",
        label: "Candidate substitution",
        expectedFailureMode:
          "Required container evidence cannot be satisfied by worker-thread, host subprocess, stale artifact, or runsc documentation.",
      },
    ],
    redaction: {
      publicOutputsMustOmit:
        report.runtimeIsolationReadiness.redactedDiagnostics
          .publicOutputsMustOmit,
      publicDiagnosticRule:
        report.runtimeIsolationReadiness.redactedDiagnostics
          .publicDiagnosticRule,
    },
    promotionDecision:
      "No production sandbox certification; Python remains non-counted exhibition beta.",
  } as const
}

const hostileProbeMarkdown = (
  report: ReturnType<typeof evaluateRuntimeSandboxes>,
): string => {
  const artifact = hostileProbeArtifact(report)
  const lines = [
    "# v1.20 Hostile Probe and No-Fallback Evidence",
    "",
    `Generated: ${artifact.generatedAt}`,
    "",
    "## Lane Parity",
    "",
    "| Lane | Status | Live | Preflight | Synthetic | Failed | Skipped |",
    "|---|---|---:|---:|---:|---:|---:|",
    ...artifact.lanes.map(
      (lane) =>
        `| ${lane.label} | ${lane.status} | ${lane.summary.live} | ${lane.summary.preflight} | ${lane.summary.synthetic} | ${lane.summary.failed} | ${lane.summary.skipped} |`,
    ),
    "",
    "## No-Fallback Drills",
    "",
    ...artifact.noFallbackDrills.map(
      (drill) => `- ${drill.id}: ${drill.expectedFailureMode}`,
    ),
    "",
    "## Public Redaction",
    "",
    `Rule: ${artifact.redaction.publicDiagnosticRule}`,
    "",
    ...artifact.redaction.publicOutputsMustOmit.map((item) => `- ${item}`),
    "",
    "## Promotion Decision",
    "",
    artifact.promotionDecision,
    "",
  ]
  return `${lines.join("\n")}\n`
}

const report = evaluateRuntimeSandboxes({ defaultProbeTimeoutMs: 5_000 })
assertSandboxEvaluationPublicSafe(report)

const next = serialize(report)
const nextReadinessJson = serialize(readinessArtifact(report))
const nextReadinessMarkdown = readinessMarkdown(report)
const nextBudgetJson = serialize(budgetArtifact(report))
const nextBudgetMarkdown = budgetMarkdown(report)
const nextRetryJson = serialize(retryArtifact(report))
const nextRetryMarkdown = retryMarkdown(report)
const nextHostileProbeJson = serialize(hostileProbeArtifact(report))
const nextHostileProbeMarkdown = hostileProbeMarkdown(report)

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
  const currentRetryJson = readFileSync(retryJsonPath, "utf8")
  if (currentRetryJson !== nextRetryJson) {
    throw new Error(
      "v1.20 exhibition reliability retry semantics JSON artifact is stale; run pnpm sandbox:evaluate",
    )
  }
  const currentRetryMarkdown = readFileSync(retryMarkdownPath, "utf8")
  if (currentRetryMarkdown !== nextRetryMarkdown) {
    throw new Error(
      "v1.20 exhibition reliability retry semantics Markdown artifact is stale; run pnpm sandbox:evaluate",
    )
  }
  const currentHostileProbeJson = readFileSync(hostileProbeJsonPath, "utf8")
  if (currentHostileProbeJson !== nextHostileProbeJson) {
    throw new Error(
      "v1.20 hostile probe/no-fallback JSON artifact is stale; run pnpm sandbox:evaluate",
    )
  }
  const currentHostileProbeMarkdown = readFileSync(
    hostileProbeMarkdownPath,
    "utf8",
  )
  if (currentHostileProbeMarkdown !== nextHostileProbeMarkdown) {
    throw new Error(
      "v1.20 hostile probe/no-fallback Markdown artifact is stale; run pnpm sandbox:evaluate",
    )
  }
} else {
  mkdirSync(path.dirname(artifactPath), { recursive: true })
  writeFileSync(artifactPath, next)
  writeFileSync(readinessJsonPath, nextReadinessJson)
  writeFileSync(readinessMarkdownPath, nextReadinessMarkdown)
  writeFileSync(budgetJsonPath, nextBudgetJson)
  writeFileSync(budgetMarkdownPath, nextBudgetMarkdown)
  writeFileSync(retryJsonPath, nextRetryJson)
  writeFileSync(retryMarkdownPath, nextRetryMarkdown)
  writeFileSync(hostileProbeJsonPath, nextHostileProbeJson)
  writeFileSync(hostileProbeMarkdownPath, nextHostileProbeMarkdown)
}
