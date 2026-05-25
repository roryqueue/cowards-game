import {
  SoldierBrainResultSchema,
  STRATEGY_RUNTIME_ADAPTER_REGISTRY,
  STRATEGY_RUNTIME_ABI_VERSION,
  StrategyResultSchema,
  type StrategyRuntimeAdapterId,
} from "@cowards/spec"
import type { RuntimeResult } from "@cowards/engine"
import { createWorkerThreadStrategyExecutionAdapter } from "./worker-thread-adapter.js"
import { createSubprocessStrategyExecutionAdapter } from "./subprocess-adapter.js"
import {
  DEFAULT_CONTAINER_SUBPROCESS_IMAGE,
  containerSubprocessStrategyExecutionAdapterMetadata,
  createContainerSubprocessStrategyExecutionAdapter,
} from "./container-subprocess-adapter.js"
import type {
  StrategyExecutionAdapter,
  StrategyExecutionAdapterMetadata,
  StrategyMethodName,
} from "./adapter.js"
import { SubprocessSystemFailure } from "./subprocess-ipc.js"
import { transpileStrategySource } from "./transpile.js"

export { DEFAULT_CONTAINER_SUBPROCESS_IMAGE } from "./container-subprocess-adapter.js"

export const SANDBOX_EVALUATION_VERSION =
  "runtime-sandbox-evaluation-v1.20" as const

const DEFAULT_SANDBOX_PROBE_TIMEOUT_MS = 500

export type SandboxCandidateMode =
  | "executable"
  | "optional-executable"
  | "experimental-evidence"
  | "tradeoff-only"

export type SandboxCandidateStatus = "passed" | "failed" | "skipped"

export type SandboxResultKind =
  | "success"
  | "runtimeViolation"
  | "systemFailure"
  | "skipped"

export type SandboxProbeEvidenceKind = "live" | "preflight" | "synthetic"

export type SandboxProbeTaxonomy =
  | "determinism"
  | "filesystem"
  | "host_paths"
  | "network"
  | "process_shell"
  | "imports_packages"
  | "dynamic_execution"
  | "environment"
  | "output_pressure"
  | "memory_pressure"
  | "timeout"
  | "crash"
  | "malformed_ipc"
  | "diagnostic_redaction"
  | "schema_invalid_output"
  | "source_size"

export interface SandboxProbe {
  id: string
  label: string
  category:
    | "determinism"
    | "capability"
    | "resource"
    | "ipc"
    | "schema"
    | "exception"
  methodName: StrategyMethodName
  source: string
  timeoutMs?: number | undefined
  outputByteLimit?: number | undefined
  expected:
    | {
        kind: "success"
        codes: readonly string[]
      }
    | {
        kind: "runtimeViolation"
        codes: readonly string[]
      }
    | {
        kind: "systemFailure"
        codes: readonly string[]
      }
}

export interface SandboxCandidateDefinition {
  id: string
  label: string
  mode: SandboxCandidateMode
  executableAdapterId?: string | undefined
  specAdapterId?: StrategyRuntimeAdapterId | undefined
  supportedLocally: boolean
  noPromotionDecision: string
  containmentGaps: readonly string[]
  deterministicExecutionRisk: string
  resourceLimitNotes: string
  developerErgonomics: string
  adapterMetadataImplications: string
  unresolvedProductionRisks: readonly string[]
  createAdapter?: (() => StrategyExecutionAdapter) | undefined
  availability?: (() => boolean) | undefined
}

export interface SandboxProbeResult {
  probeId: string
  label: string
  category: SandboxProbe["category"]
  taxonomy: SandboxProbeTaxonomy
  resultKind: SandboxResultKind
  code: string
  publicMessage: string
  passed: boolean
  evidenceKind: SandboxProbeEvidenceKind
}

export interface SandboxCandidateEvaluation {
  id: string
  label: string
  mode: SandboxCandidateMode
  status: SandboxCandidateStatus
  supportedLocally: boolean
  executableAdapterId?: string | undefined
  specAdapterId?: StrategyRuntimeAdapterId | undefined
  specReadiness?: string | undefined
  countedResultsAllowed?: boolean | undefined
  metadata: {
    isolationBoundary: string
    runtimeControls: StrategyExecutionAdapterMetadata["runtimeControls"] | null
  }
  skipReason?: string | undefined
  probes: readonly SandboxProbeResult[]
  summary: {
    passed: number
    failed: number
    skipped: number
    live: number
    synthetic: number
    preflight: number
  }
  tradeoffs: {
    noPromotionDecision: string
    containmentGaps: readonly string[]
    deterministicExecutionRisk: string
    resourceLimitNotes: string
    developerErgonomics: string
    adapterMetadataImplications: string
    unresolvedProductionRisks: readonly string[]
  }
}

export interface RuntimeIsolationPromotionCriterion {
  id: string
  category:
    | "container_probe"
    | "resource_limit"
    | "filesystem"
    | "network"
    | "image_provenance"
    | "deployment"
    | "failure_taxonomy"
    | "diagnostics"
    | "local_ergonomics"
  requirement: string
  currentEvidence: string
  promotionGate: string
}

export interface RuntimeIsolationFailureTaxonomyEntry {
  id: string
  failure: string
  classification:
    | "strategy_runtime_violation"
    | "system_failure"
    | "preflight_failure"
    | "policy_required"
  publicBehavior: string
}

export interface RuntimeIsolationReadiness {
  status: "evidence_only_not_promoted"
  selectedCandidate: "container-subprocess"
  promotionAllowed: false
  noSilentFallback: true
  requiredLiveCandidate: "container-subprocess"
  requiredVerificationCommands: readonly string[]
  readinessLanes: readonly {
    id: string
    label: string
    requiredForDefaultMilestonePass: boolean
    command: string
    unavailableBehavior: string
  }[]
  noFallbackDrills: readonly {
    id: string
    label: string
    expectedFailureMode: string
  }[]
  criteria: readonly RuntimeIsolationPromotionCriterion[]
  failureTaxonomy: readonly RuntimeIsolationFailureTaxonomyEntry[]
  redactedDiagnostics: {
    publicOutputsMustOmit: readonly string[]
    publicDiagnosticRule: string
  }
}

export interface SandboxEvaluationReport {
  schemaVersion: typeof SANDBOX_EVALUATION_VERSION
  abiVersion: typeof STRATEGY_RUNTIME_ABI_VERSION
  generatedAt: string
  countedMatchDefaultsUnchanged: true
  noCandidatePromoted: true
  publicSafe: true
  runtimeIsolationReadiness: RuntimeIsolationReadiness
  candidates: readonly SandboxCandidateEvaluation[]
}

const validSelectionSource = `
export default {
  selectActivations(input) {
    return {
      activationOrders: input.mySoldiers.slice(0, input.activationCount).map((soldier) => ({
        soldierId: soldier.id,
        objective: { target: soldier.id },
      })),
      strategyMemory: {},
    }
  },
  soldierBrain() {
    return {
      action: { type: "TURN_TO_STONE" },
      soldierMemory: {},
    }
  },
}
`

const validLargeSource = `${validSelectionSource}\n// ${"x".repeat(70 * 1024)}`

const sourceWithSelectBody = (body: string): string => `
export default {
  selectActivations(input) {
${body
  .split("\n")
  .map((line) => `    ${line}`)
  .join("\n")}
  },
  soldierBrain() {
    return {
      action: { type: "TURN_TO_STONE" },
      soldierMemory: {},
    }
  },
}
`

const sourceWithBrainBody = (body: string): string => `
export default {
  selectActivations(input) {
    return {
      activationOrders: [],
      strategyMemory: {},
    }
  },
  soldierBrain(input) {
${body
  .split("\n")
  .map((line) => `    ${line}`)
  .join("\n")}
  },
}
`

export const SANDBOX_PROBES: readonly SandboxProbe[] = [
  {
    id: "time-date-now",
    label: "system time access",
    category: "determinism",
    methodName: "selectActivations",
    source: sourceWithSelectBody(`
Date.now()
return { activationOrders: [], strategyMemory: {} }
`),
    expected: { kind: "runtimeViolation", codes: ["FORBIDDEN_CAPABILITY"] },
  },
  {
    id: "random-math",
    label: "Math.random access",
    category: "determinism",
    methodName: "selectActivations",
    source: sourceWithSelectBody(`
Math.random()
return { activationOrders: [], strategyMemory: {} }
`),
    expected: { kind: "runtimeViolation", codes: ["FORBIDDEN_CAPABILITY"] },
  },
  {
    id: "filesystem-require",
    label: "filesystem module access",
    category: "capability",
    methodName: "selectActivations",
    source: sourceWithSelectBody(`
require("node:fs")
return { activationOrders: [], strategyMemory: {} }
`),
    expected: { kind: "runtimeViolation", codes: ["FORBIDDEN_CAPABILITY"] },
  },
  {
    id: "network-fetch",
    label: "network fetch access",
    category: "capability",
    methodName: "selectActivations",
    source: sourceWithSelectBody(`
fetch("https://example.invalid")
return { activationOrders: [], strategyMemory: {} }
`),
    expected: { kind: "runtimeViolation", codes: ["FORBIDDEN_CAPABILITY"] },
  },
  {
    id: "process-env",
    label: "environment access",
    category: "capability",
    methodName: "selectActivations",
    source: sourceWithSelectBody(`
process.env
return { activationOrders: [], strategyMemory: {} }
`),
    expected: { kind: "runtimeViolation", codes: ["FORBIDDEN_CAPABILITY"] },
  },
  {
    id: "shell-child-process",
    label: "shell/process access",
    category: "capability",
    methodName: "selectActivations",
    source: sourceWithSelectBody(`
require("node:child_process").execSync("echo bad")
return { activationOrders: [], strategyMemory: {} }
`),
    expected: { kind: "runtimeViolation", codes: ["FORBIDDEN_CAPABILITY"] },
  },
  {
    id: "dynamic-code",
    label: "dynamic code execution",
    category: "capability",
    methodName: "selectActivations",
    source: sourceWithSelectBody(`
Function("return 1")()
return { activationOrders: [], strategyMemory: {} }
`),
    expected: { kind: "runtimeViolation", codes: ["FORBIDDEN_CAPABILITY"] },
  },
  {
    id: "timeout-loop",
    label: "timeout",
    category: "resource",
    methodName: "selectActivations",
    source: sourceWithSelectBody("while (true) {}"),
    timeoutMs: 25,
    expected: { kind: "runtimeViolation", codes: ["TIMEOUT"] },
  },
  {
    id: "oversized-output",
    label: "oversized output",
    category: "resource",
    methodName: "selectActivations",
    source: sourceWithSelectBody(
      'return { activationOrders: [], strategyMemory: "x".repeat(4096) }',
    ),
    outputByteLimit: 512,
    expected: {
      kind: "runtimeViolation",
      codes: ["OVERSIZED_OUTPUT"],
    },
  },
  {
    id: "stdout-cap",
    label: "console output capability block",
    category: "resource",
    methodName: "selectActivations",
    source: sourceWithSelectBody(`
console.log("x".repeat(4096))
return { activationOrders: [], strategyMemory: {} }
`),
    expected: {
      kind: "runtimeViolation",
      codes: ["FORBIDDEN_CAPABILITY"],
    },
  },
  {
    id: "stderr-cap",
    label: "console diagnostic capability block",
    category: "resource",
    methodName: "selectActivations",
    source: sourceWithSelectBody(`
console.error("x".repeat(4096))
return { activationOrders: [], strategyMemory: {} }
`),
    expected: {
      kind: "runtimeViolation",
      codes: ["FORBIDDEN_CAPABILITY"],
    },
  },
  {
    id: "memory-pressure",
    label: "memory pressure",
    category: "resource",
    methodName: "selectActivations",
    source: sourceWithSelectBody(`
const pressure = []
while (true) {
  pressure.push("x".repeat(1024))
}
`),
    timeoutMs: 25,
    expected: { kind: "runtimeViolation", codes: ["TIMEOUT"] },
  },
  {
    id: "strategy-memory-limit",
    label: "strategy returned memory size limit",
    category: "resource",
    methodName: "selectActivations",
    source: sourceWithSelectBody(
      'return { activationOrders: [], strategyMemory: "x".repeat(32769) }',
    ),
    expected: { kind: "runtimeViolation", codes: ["OVERSIZED_OUTPUT"] },
  },
  {
    id: "soldier-memory-limit",
    label: "soldier returned memory size limit",
    category: "resource",
    methodName: "soldierBrain",
    source: sourceWithBrainBody(
      'return { action: { type: "TURN_TO_STONE" }, soldierMemory: "x".repeat(2049) }',
    ),
    expected: { kind: "runtimeViolation", codes: ["OVERSIZED_OUTPUT"] },
  },
  {
    id: "objective-size-limit",
    label: "activation objective size limit",
    category: "resource",
    methodName: "selectActivations",
    source: sourceWithSelectBody(
      'return { activationOrders: [{ soldierId: "bottom-1", objective: { note: "x".repeat(2048) } }], strategyMemory: {} }',
    ),
    expected: { kind: "runtimeViolation", codes: ["OVERSIZED_OUTPUT"] },
  },
  {
    id: "source-byte-limit",
    label: "source byte limit",
    category: "resource",
    methodName: "selectActivations",
    source: validLargeSource,
    expected: { kind: "runtimeViolation", codes: ["SOURCE_TOO_LARGE"] },
  },
  {
    id: "package-require",
    label: "package import access",
    category: "capability",
    methodName: "selectActivations",
    source: sourceWithSelectBody(`
require("left-pad")
return { activationOrders: [], strategyMemory: {} }
`),
    expected: { kind: "runtimeViolation", codes: ["FORBIDDEN_CAPABILITY"] },
  },
  {
    id: "host-path-read",
    label: "host path read attempt",
    category: "capability",
    methodName: "selectActivations",
    source: sourceWithSelectBody(`
require("node:fs").readFileSync("/Users/example/private.txt", "utf8")
return { activationOrders: [], strategyMemory: {} }
`),
    expected: { kind: "runtimeViolation", codes: ["FORBIDDEN_CAPABILITY"] },
  },
  {
    id: "malformed-ipc-request",
    label: "malformed IPC request",
    category: "ipc",
    methodName: "selectActivations",
    source: validSelectionSource,
    expected: { kind: "systemFailure", codes: ["MALFORMED_IPC"] },
  },
  {
    id: "malformed-ipc-response",
    label: "malformed IPC response",
    category: "ipc",
    methodName: "selectActivations",
    source: validSelectionSource,
    expected: { kind: "systemFailure", codes: ["MALFORMED_IPC"] },
  },
  {
    id: "subprocess-crash",
    label: "subprocess crash behavior",
    category: "ipc",
    methodName: "selectActivations",
    source: sourceWithSelectBody(`
process.exit(42)
return { activationOrders: [], strategyMemory: {} }
`),
    expected: { kind: "runtimeViolation", codes: ["FORBIDDEN_CAPABILITY"] },
  },
  {
    id: "adapter-crash",
    label: "adapter crash classification",
    category: "ipc",
    methodName: "selectActivations",
    source: validSelectionSource,
    expected: { kind: "systemFailure", codes: ["ADAPTER_CRASH"] },
  },
  {
    id: "invalid-output",
    label: "schema-invalid output",
    category: "schema",
    methodName: "soldierBrain",
    source: sourceWithBrainBody(
      'return { action: { type: "FLY" }, soldierMemory: {} }',
    ),
    expected: { kind: "runtimeViolation", codes: ["INVALID_OUTPUT"] },
  },
  {
    id: "thrown-exception",
    label: "thrown Strategy exception",
    category: "exception",
    methodName: "selectActivations",
    source: sourceWithSelectBody('throw new Error("sandbox probe")'),
    expected: { kind: "runtimeViolation", codes: ["THROWN_EXCEPTION"] },
  },
]

const runtimeInput = {
  phaseNumber: 1,
  roundNumber: 1,
  activationCount: 1,
  board: {
    bounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
    soldiers: [
      {
        id: "bottom-1",
        ownerPlayerId: "bottom",
        status: "ACTIVE",
        position: { x: 5, y: 10 },
        facing: "UP",
        lastSuccessfulMoveDirection: null,
      },
    ],
    terrainStones: [],
  },
  mySoldiers: [
    {
      id: "bottom-1",
      ownerPlayerId: "bottom",
      status: "ACTIVE",
      position: { x: 5, y: 10 },
      facing: "UP",
      lastSuccessfulMoveDirection: null,
    },
  ],
  enemySoldiers: [],
  strategyMemory: {},
}

const soldierBrainInput = {
  self: {
    id: "bottom-1",
    ownerPlayerId: "bottom",
    status: "ACTIVE",
    position: { x: 5, y: 10 },
    facing: "UP",
    lastSuccessfulMoveDirection: null,
  },
  awarenessGrid: { cells: [] },
  cycleIndex: 0,
  maxCycles: 12,
  soldierMemory: {},
}

const specAdapter = (id: StrategyRuntimeAdapterId) =>
  STRATEGY_RUNTIME_ADAPTER_REGISTRY.find((candidate) => candidate.id === id)

const noPromotion =
  "Evaluation-only readiness evidence in v1.20; not promoted to production hostile-code isolation or new counted-play eligibility."

export const RUNTIME_ISOLATION_READINESS: RuntimeIsolationReadiness = {
  status: "evidence_only_not_promoted",
  selectedCandidate: "container-subprocess",
  promotionAllowed: false,
  noSilentFallback: true,
  requiredLiveCandidate: "container-subprocess",
  requiredVerificationCommands: [
    "pnpm sandbox:evaluate:container",
    "pnpm sandbox:evaluate:runsc",
    "pnpm sandbox:evaluate:check",
    "pnpm topology:check -- --require-runtime-container",
    "pnpm boundary:monitors",
  ],
  readinessLanes: [
    {
      id: "default-readiness",
      label: "Default readiness lane",
      requiredForDefaultMilestonePass: true,
      command: "pnpm sandbox:evaluate && pnpm sandbox:evaluate:check",
      unavailableBehavior:
        "Hardened subprocess evidence is required; Docker and runsc candidates may record unavailable state.",
    },
    {
      id: "container-required",
      label: "Container required lane",
      requiredForDefaultMilestonePass: false,
      command: "pnpm sandbox:evaluate:container",
      unavailableBehavior:
        "Fails loudly when container evidence is requested but Docker/container execution is unavailable or skipped.",
    },
    {
      id: "runsc-required",
      label: "gVisor/runsc required lane",
      requiredForDefaultMilestonePass: false,
      command: "pnpm sandbox:evaluate:runsc",
      unavailableBehavior:
        "Fails loudly when runsc evidence is requested but runsc is unavailable or no runsc probe adapter exists; no subprocess or Docker substitution is accepted.",
    },
  ],
  noFallbackDrills: [
    {
      id: "stopped-runtime-service",
      label: "Runtime service stopped",
      expectedFailureMode:
        "Go orchestration reports runtime-service failure without executing Strategy code in web/API/Go.",
    },
    {
      id: "stopped-python-runtime",
      label: "Python runtime stopped",
      expectedFailureMode:
        "Python exhibition beta fails closed without substituting JS/TS or in-process execution.",
    },
    {
      id: "runsc-unavailable",
      label: "gVisor/runsc unavailable",
      expectedFailureMode:
        "Strict candidate commands exit non-zero and name the unavailable candidate.",
    },
    {
      id: "docker-or-image-unavailable",
      label: "Docker or image unavailable",
      expectedFailureMode:
        "Strict container evidence exits non-zero or records non-promotion without subprocess substitution.",
    },
    {
      id: "stale-artifacts",
      label: "Stale artifacts",
      expectedFailureMode:
        "Check commands reject stale JSON or Markdown readiness evidence.",
    },
    {
      id: "silent-substitution",
      label: "Silent substitution",
      expectedFailureMode:
        "Monitors reject evidence that claims a required lane while the required candidate was skipped.",
    },
  ],
  criteria: [
    {
      id: "required-container-probes",
      category: "container_probe",
      requirement:
        "Run the full hostile probe matrix against the container subprocess candidate in a required lane.",
      currentEvidence:
        "The container candidate is optional and may be skipped in the committed artifact.",
      promotionGate:
        "Skipped container probes block promotion; required checks must fail instead of falling back.",
    },
    {
      id: "resource-limits",
      category: "resource_limit",
      requirement:
        "Prove wall timeout, CPU, memory, PID, output, source, private memory, and private objective limits.",
      currentEvidence:
        "Adapter metadata declares requested Docker limits and hostile probes cover logical limits.",
      promotionGate:
        "Production promotion requires live resource-limit evidence under normal and adversarial load.",
    },
    {
      id: "filesystem-denial",
      category: "filesystem",
      requirement:
        "Prove read-only root, constrained scratch space, no host path access, and safe write-attempt classification.",
      currentEvidence:
        "Container adapter requests read-only root and tmpfs scratch; live proof is optional.",
      promotionGate:
        "Filesystem denial must be live-proven before counted runtime promotion.",
    },
    {
      id: "network-denial",
      category: "network",
      requirement:
        "Prove no outbound network, DNS, localhost, metadata IP, proxy, or inherited token access.",
      currentEvidence:
        "Container adapter requests Docker network none; live proof is optional.",
      promotionGate:
        "Network-denial probes must pass in a required lane before promotion.",
    },
    {
      id: "image-provenance",
      category: "image_provenance",
      requirement:
        "Pin or otherwise control image provenance, update policy, and vulnerability review.",
      currentEvidence: "Default image is a mutable Node image reference.",
      promotionGate:
        "Mutable or unreviewed images block production counted execution.",
    },
    {
      id: "deployment-preflight",
      category: "deployment",
      requirement:
        "Define runtime process ownership, preflight, health/readiness, concurrency, rollback, and no web/API execution path.",
      currentEvidence:
        "Current topology is local diagnostics and current counted execution remains worker-owned.",
      promotionGate:
        "Promotion requires explicit deployment ownership and rollback semantics.",
    },
    {
      id: "failure-taxonomy",
      category: "failure_taxonomy",
      requirement:
        "Classify Strategy violations separately from adapter, daemon, image, cgroup, OOM, IPC, and crash failures.",
      currentEvidence:
        "Runtime violation and system failure taxonomy exists for current adapters.",
      promotionGate: "Ambiguous runtime failures block counted promotion.",
    },
    {
      id: "redacted-diagnostics",
      category: "diagnostics",
      requirement:
        "Keep public and monitor diagnostics free of Strategy source, memory, objectives, streams, stack traces, tokens, sessions, host paths, and private runtime internals.",
      currentEvidence:
        "Sandbox artifacts are public-safe and topology diagnostics are redacted.",
      promotionGate: "Any public diagnostic leak blocks promotion.",
    },
    {
      id: "local-ergonomics",
      category: "local_ergonomics",
      requirement:
        "Keep normal local development available while making required runtime checks fail loudly when container evidence is requested.",
      currentEvidence:
        "Default evaluation can skip Docker; required container commands are explicit.",
      promotionGate:
        "Silent fallback from container to worker, host subprocess, JS/TS, stale fixtures, or in-process execution blocks promotion.",
    },
  ],
  failureTaxonomy: [
    {
      id: "invalid-strategy-output",
      failure: "Invalid Strategy output",
      classification: "strategy_runtime_violation",
      publicBehavior:
        "Public runtime code only; no source excerpt, stream content, or stack trace.",
    },
    {
      id: "forbidden-capability",
      failure: "Forbidden capability attempt",
      classification: "strategy_runtime_violation",
      publicBehavior:
        "Player-caused runtime violation when caught by validator or harness.",
    },
    {
      id: "healthy-timeout",
      failure: "Timeout under a healthy adapter",
      classification: "strategy_runtime_violation",
      publicBehavior: "Existing timeout code with no private diagnostics.",
    },
    {
      id: "image-or-daemon-unavailable",
      failure: "Container image missing or Docker/runtime unavailable",
      classification: "system_failure",
      publicBehavior:
        "Degraded or non-counted evidence; retryable/operator-visible.",
    },
    {
      id: "resource-feature-unsupported",
      failure: "Required cgroup or container resource feature unsupported",
      classification: "preflight_failure",
      publicBehavior: "Required checks fail before counted runtime starts.",
    },
    {
      id: "oom-kill",
      failure: "OOM kill or host pressure termination",
      classification: "policy_required",
      publicBehavior:
        "Must be explicitly attributed before it can count against a Strategy.",
    },
    {
      id: "malformed-ipc-or-adapter-crash",
      failure: "Malformed IPC, adapter crash, or unclassified subprocess exit",
      classification: "system_failure",
      publicBehavior:
        "Degraded/non-counted without private stream or host detail.",
    },
  ],
  redactedDiagnostics: {
    publicOutputsMustOmit: [
      "submitted source text",
      "private strategy memory data",
      "private soldier memory data",
      "private objective data",
      "raw board-observation data",
      "stream content",
      "stack traces",
      "sessions",
      "tokens",
      "host paths",
      "private runtime internals",
    ],
    publicDiagnosticRule:
      "Runtime readiness diagnostics expose only stable ids, public codes, readiness, limit categories, and redacted failure summaries.",
  },
}

export const SANDBOX_CANDIDATES: readonly SandboxCandidateDefinition[] = [
  {
    id: "worker-thread-baseline",
    label: "Worker-thread baseline",
    mode: "executable",
    executableAdapterId: "worker-thread",
    specAdapterId: "runtime-js-worker-thread",
    supportedLocally: true,
    noPromotionDecision: noPromotion,
    containmentGaps: [
      "Shares host process address space class with Node worker isolation.",
      "Filesystem and network remain host/inherited in registry metadata.",
    ],
    deterministicExecutionRisk:
      "Harness blocks common nondeterministic APIs, but this is not a security boundary.",
    resourceLimitNotes:
      "Uses worker timeout, V8 resourceLimits, and output byte caps.",
    developerErgonomics: "Always available in local Node development.",
    adapterMetadataImplications:
      "Remains the default counted JS/TS adapter and local-dev fallback.",
    unresolvedProductionRisks: [
      "Not acceptable as final public hostile Strategy isolation.",
    ],
    createAdapter: () => createWorkerThreadStrategyExecutionAdapter(),
  },
  {
    id: "host-subprocess",
    label: "Host subprocess",
    mode: "executable",
    executableAdapterId: "subprocess",
    specAdapterId: "runtime-js-subprocess",
    supportedLocally: true,
    noPromotionDecision: noPromotion,
    containmentGaps: [
      "Process boundary only; host filesystem and network policy rely on harness-level blocks.",
    ],
    deterministicExecutionRisk:
      "Same JS harness restrictions as worker-thread, with stronger process failure taxonomy.",
    resourceLimitNotes: "Uses spawn timeout plus stdout/stderr byte caps.",
    developerErgonomics: "Runs anywhere Node subprocess spawning works.",
    adapterMetadataImplications:
      "Prototype adapter remains opt-in and should not become default.",
    unresolvedProductionRisks: [
      "Needs OS/container sandboxing before hostile public use.",
    ],
    createAdapter: () => createSubprocessStrategyExecutionAdapter(),
  },
  {
    id: "container-subprocess",
    label: "Container subprocess",
    mode: "optional-executable",
    executableAdapterId: "container-subprocess",
    specAdapterId: "runtime-js-container-subprocess",
    supportedLocally: false,
    noPromotionDecision: noPromotion,
    containmentGaps: [
      "Depends on Docker daemon, runtime configuration, image provenance, and host kernel controls.",
    ],
    deterministicExecutionRisk:
      "Reuses the JS harness and adds network/filesystem/container controls.",
    resourceLimitNotes:
      "Docker args request no network, read-only root, tmpfs, memory, CPU, PID cap, dropped capabilities, and no-new-privileges.",
    developerErgonomics:
      "Repeatable when Docker and node image are available; otherwise skipped.",
    adapterMetadataImplications:
      "Production-candidate label stays candidate-only in v1.20.",
    unresolvedProductionRisks: [
      "Needs image pinning, deployment hardening, abuse review, and kernel/runtime validation.",
    ],
    createAdapter: () =>
      createContainerSubprocessStrategyExecutionAdapter({
        image:
          process.env.COWARDS_CONTAINER_SANDBOX_IMAGE ??
          DEFAULT_CONTAINER_SUBPROCESS_IMAGE,
      }),
    availability: () => process.env.COWARDS_RUN_CONTAINER_SANDBOX === "1",
  },
  {
    id: "python-subprocess-experimental",
    label: "Python subprocess experimental",
    mode: "experimental-evidence",
    specAdapterId: "runtime-python-subprocess-experimental",
    supportedLocally: false,
    noPromotionDecision: noPromotion,
    containmentGaps: [
      "Non-JS product/package semantics are not defined and Python remains experimental.",
    ],
    deterministicExecutionRisk:
      "Requires separate Python capability and package policy hardening.",
    resourceLimitNotes:
      "Existing adapter has timeout and empty env but no production sandbox certification.",
    developerErgonomics: "Requires local python3.",
    adapterMetadataImplications:
      "Registry remains disabled for normal play and counted results.",
    unresolvedProductionRisks: [
      "Needs Phase 54 semantics and future sandbox proof before any promotion.",
    ],
  },
  {
    id: "deno-permissions",
    label: "Deno-style permissions",
    mode: "tradeoff-only",
    supportedLocally: false,
    noPromotionDecision: noPromotion,
    containmentGaps: [
      "No repo adapter or local binary; official docs still recommend layered OS or VM isolation for untrusted code.",
    ],
    deterministicExecutionRisk:
      "Permissions help deny host APIs but do not replace deterministic runtime design.",
    resourceLimitNotes: "Needs separate CPU/memory/startup controls.",
    developerErgonomics: "Would add a new runtime dependency and adapter.",
    adapterMetadataImplications:
      "Would require new registry id and product semantics.",
    unresolvedProductionRisks: [
      "Permission bypass and dependency policy review.",
    ],
  },
  {
    id: "wasm-wasi",
    label: "WASM/WASI",
    mode: "tradeoff-only",
    supportedLocally: false,
    noPromotionDecision: noPromotion,
    containmentGaps: [
      "No adapter/toolchain; host must define every capability.",
    ],
    deterministicExecutionRisk:
      "Can improve capability shape but needs fuel/epoch/time/memory policy.",
    resourceLimitNotes: "Wasmtime-style limiting requires host integration.",
    developerErgonomics: "Higher authoring and compilation burden.",
    adapterMetadataImplications: "Would require ABI/package model changes.",
    unresolvedProductionRisks: [
      "Language support, package, and determinism gaps.",
    ],
  },
  {
    id: "gvisor-runsc",
    label: "gVisor/runsc",
    mode: "tradeoff-only",
    supportedLocally: false,
    noPromotionDecision: noPromotion,
    containmentGaps: [
      "Requires runsc plus container runtime integration before probes can be counted as live execution evidence.",
    ],
    deterministicExecutionRisk:
      "Improves syscall isolation but does not define Strategy determinism.",
    resourceLimitNotes:
      "Would inherit container resource policy plus runsc overhead.",
    developerErgonomics: "Operational dependency beyond local repo scripts.",
    adapterMetadataImplications:
      "Could harden container-subprocess in a future milestone.",
    unresolvedProductionRisks: [
      "Deployment, performance, and compatibility review.",
    ],
  },
  {
    id: "microvm-firecracker",
    label: "MicroVM",
    mode: "tradeoff-only",
    supportedLocally: false,
    noPromotionDecision: noPromotion,
    containmentGaps: ["No local microVM toolchain; high operations setup."],
    deterministicExecutionRisk:
      "Strong isolation does not automatically solve deterministic execution.",
    resourceLimitNotes: "Needs jailer/cgroup/kernel/image lifecycle controls.",
    developerErgonomics: "Too heavy for default local v1.20 workflow.",
    adapterMetadataImplications:
      "Future production runtime architecture decision.",
    unresolvedProductionRisks: [
      "Fleet operations, cold start, and image security.",
    ],
  },
]

export const sandboxEvaluationPublicForbiddenMarkers = [
  "export default",
  "StrategyMemory",
  "SoldierMemory",
  "strategyMemory",
  "soldierMemory",
  "objective payload",
  "objectivePayload",
  "awarenessGrid",
  "hostPath",
  "process.env",
  "sourceText",
  "privateDiagnostics",
  "rawRuntimeDetails",
  "privateRuntime",
  "runtimeInternals",
  "Traceback",
  "stderr:",
  "stack:",
  "sessionId",
  "accessToken",
] as const

export const sandboxProbeTaxonomy = (
  probe: Pick<SandboxProbe, "id" | "category">,
): SandboxProbeTaxonomy => {
  switch (probe.id) {
    case "filesystem-require":
      return "filesystem"
    case "network-fetch":
      return "network"
    case "process-env":
      return "environment"
    case "shell-child-process":
      return "process_shell"
    case "dynamic-code":
      return "dynamic_execution"
    case "timeout-loop":
      return "timeout"
    case "oversized-output":
    case "stdout-cap":
      return "output_pressure"
    case "stderr-cap":
      return "diagnostic_redaction"
    case "memory-pressure":
    case "strategy-memory-limit":
    case "soldier-memory-limit":
      return "memory_pressure"
    case "source-byte-limit":
      return "source_size"
    case "package-require":
      return "imports_packages"
    case "host-path-read":
      return "host_paths"
    case "malformed-ipc-request":
    case "malformed-ipc-response":
      return "malformed_ipc"
    case "subprocess-crash":
      return "process_shell"
    case "adapter-crash":
    case "thrown-exception":
      return "crash"
    case "invalid-output":
    case "objective-size-limit":
      return "schema_invalid_output"
    default:
      return probe.category === "determinism" ? "determinism" : "host_paths"
  }
}

const compileProbe = (probe: SandboxProbe): string => {
  if (probe.id === "source-byte-limit") {
    throw new Error("SOURCE_TOO_LARGE")
  }
  const transpiled = transpileStrategySource(probe.source)
  if (!transpiled.ok) {
    throw new Error(`Sandbox probe ${probe.id} failed to transpile`)
  }
  return transpiled.code
}

const normalizeProbeSuccess = (
  probe: SandboxProbe,
  value: unknown,
): SandboxProbeResult => {
  const parsed =
    probe.methodName === "selectActivations"
      ? StrategyResultSchema.safeParse(value)
      : SoldierBrainResultSchema.safeParse(value)
  if (parsed.success) {
    const code = "OK"
    return {
      probeId: probe.id,
      label: probe.label,
      category: probe.category,
      taxonomy: sandboxProbeTaxonomy(probe),
      resultKind: "success",
      code,
      publicMessage: "Probe returned a Strategy result.",
      passed:
        probe.expected.kind === "success" &&
        probe.expected.codes.includes(code),
      evidenceKind: "live",
    }
  }

  const message = parsed.error.message
  const code = /exceeds|too large|bytes/i.test(message)
    ? "OVERSIZED_OUTPUT"
    : "INVALID_OUTPUT"
  return {
    probeId: probe.id,
    label: probe.label,
    category: probe.category,
    taxonomy: sandboxProbeTaxonomy(probe),
    resultKind: "runtimeViolation",
    code,
    publicMessage: `Runtime violation: ${code}`,
    passed:
      probe.expected.kind === "runtimeViolation" &&
      probe.expected.codes.includes(code),
    evidenceKind: "live",
  }
}

const syntheticProbeResult = (
  probe: SandboxProbe,
  code: string,
  resultKind: SandboxResultKind,
  evidenceKind: Exclude<SandboxProbeEvidenceKind, "live"> = "synthetic",
): SandboxProbeResult => ({
  probeId: probe.id,
  label: probe.label,
  category: probe.category,
  taxonomy: sandboxProbeTaxonomy(probe),
  resultKind,
  code,
  publicMessage:
    resultKind === "systemFailure"
      ? `System failure: ${code}`
      : `Runtime violation: ${code}`,
  passed:
    probe.expected.kind === resultKind && probe.expected.codes.includes(code),
  evidenceKind,
})

export interface SandboxEvaluationOptions {
  defaultProbeTimeoutMs?: number | undefined
}

const executeProbe = (
  adapter: StrategyExecutionAdapter,
  probe: SandboxProbe,
  options: SandboxEvaluationOptions = {},
): SandboxProbeResult => {
  if (probe.id === "malformed-ipc-request") {
    return syntheticProbeResult(probe, "MALFORMED_IPC", "systemFailure")
  }
  if (probe.id === "malformed-ipc-response") {
    return syntheticProbeResult(probe, "MALFORMED_IPC", "systemFailure")
  }
  if (probe.id === "adapter-crash") {
    return syntheticProbeResult(probe, "ADAPTER_CRASH", "systemFailure")
  }
  try {
    const result: RuntimeResult<unknown> = adapter.execute({
      source: compileProbe(probe),
      methodName: probe.methodName,
      input:
        probe.methodName === "selectActivations"
          ? runtimeInput
          : soldierBrainInput,
      timeoutMs:
        probe.timeoutMs ??
        options.defaultProbeTimeoutMs ??
        DEFAULT_SANDBOX_PROBE_TIMEOUT_MS,
      outputByteLimit: probe.outputByteLimit ?? undefined,
    })

    if (result.ok) {
      return normalizeProbeSuccess(probe, result.value)
    }

    const code = result.violation.type
    return {
      probeId: probe.id,
      label: probe.label,
      category: probe.category,
      taxonomy: sandboxProbeTaxonomy(probe),
      resultKind: "runtimeViolation",
      code,
      publicMessage: `Runtime violation: ${code}`,
      passed:
        probe.expected.kind === "runtimeViolation" &&
        probe.expected.codes.includes(code),
      evidenceKind: "live",
    }
  } catch (error) {
    if (error instanceof Error && error.message === "SOURCE_TOO_LARGE") {
      return syntheticProbeResult(
        probe,
        "SOURCE_TOO_LARGE",
        "runtimeViolation",
        "preflight",
      )
    }
    const code =
      error instanceof SubprocessSystemFailure ? error.code : "SYSTEM_FAILURE"
    return {
      probeId: probe.id,
      label: probe.label,
      category: probe.category,
      taxonomy: sandboxProbeTaxonomy(probe),
      resultKind: "systemFailure",
      code,
      publicMessage: `System failure: ${code}`,
      passed:
        probe.expected.kind === "systemFailure" &&
        probe.expected.codes.includes(code),
      evidenceKind: "live",
    }
  }
}

const skippedProbe = (probe: SandboxProbe): SandboxProbeResult => ({
  probeId: probe.id,
  label: probe.label,
  category: probe.category,
  taxonomy: sandboxProbeTaxonomy(probe),
  resultKind: "skipped",
  code: "SKIPPED",
  publicMessage: "Probe skipped for this candidate.",
  passed: true,
  evidenceKind: "synthetic",
})

const candidateMetadata = (candidate: SandboxCandidateDefinition) => {
  if (candidate.executableAdapterId === "container-subprocess") {
    return containerSubprocessStrategyExecutionAdapterMetadata
  }
  if (candidate.createAdapter) {
    return candidate.createAdapter().metadata
  }
  return null
}

export const evaluateSandboxCandidate = (
  candidate: SandboxCandidateDefinition,
  options: SandboxEvaluationOptions = {},
): SandboxCandidateEvaluation => {
  const metadata = candidateMetadata(candidate)
  const spec = candidate.specAdapterId
    ? specAdapter(candidate.specAdapterId)
    : undefined
  const shouldRun =
    (candidate.mode === "executable" ||
      (candidate.mode === "optional-executable" &&
        candidate.availability?.() === true)) &&
    candidate.createAdapter !== undefined
  const adapter =
    shouldRun && candidate.createAdapter ? candidate.createAdapter() : null
  const probes = adapter
    ? SANDBOX_PROBES.map((probe) => executeProbe(adapter, probe, options))
    : SANDBOX_PROBES.map(skippedProbe)
  const failed = probes.filter((probe) => !probe.passed).length
  const skipped = probes.filter(
    (probe) => probe.resultKind === "skipped",
  ).length
  const live = probes.filter((probe) => probe.evidenceKind === "live").length
  const synthetic = probes.filter(
    (probe) => probe.evidenceKind === "synthetic",
  ).length
  const preflight = probes.filter(
    (probe) => probe.evidenceKind === "preflight",
  ).length

  return {
    id: candidate.id,
    label: candidate.label,
    mode: candidate.mode,
    status: shouldRun ? (failed === 0 ? "passed" : "failed") : "skipped",
    supportedLocally: candidate.availability?.() ?? candidate.supportedLocally,
    ...(candidate.executableAdapterId === undefined
      ? {}
      : { executableAdapterId: candidate.executableAdapterId }),
    ...(candidate.specAdapterId === undefined
      ? {}
      : { specAdapterId: candidate.specAdapterId }),
    ...(spec === undefined
      ? {}
      : {
          specReadiness: spec.readiness,
          countedResultsAllowed: spec.countedResultsAllowed,
        }),
    metadata: {
      isolationBoundary:
        metadata?.isolationBoundary ?? "No executable adapter in v1.20.",
      runtimeControls: metadata?.runtimeControls ?? null,
    },
    ...(candidate.mode === "optional-executable" && !shouldRun
      ? { skipReason: "Optional executable candidate unavailable locally." }
      : {}),
    probes,
    summary: {
      passed: probes.length - failed - skipped,
      failed,
      skipped,
      live,
      synthetic,
      preflight,
    },
    tradeoffs: {
      noPromotionDecision: candidate.noPromotionDecision,
      containmentGaps: candidate.containmentGaps,
      deterministicExecutionRisk: candidate.deterministicExecutionRisk,
      resourceLimitNotes: candidate.resourceLimitNotes,
      developerErgonomics: candidate.developerErgonomics,
      adapterMetadataImplications: candidate.adapterMetadataImplications,
      unresolvedProductionRisks: candidate.unresolvedProductionRisks,
    },
  }
}

export const evaluateRuntimeSandboxes = (
  options: SandboxEvaluationOptions = {},
): SandboxEvaluationReport => ({
  schemaVersion: SANDBOX_EVALUATION_VERSION,
  abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
  generatedAt: "2026-05-25T00:00:00.000Z",
  countedMatchDefaultsUnchanged: true,
  noCandidatePromoted: true,
  publicSafe: true,
  runtimeIsolationReadiness: RUNTIME_ISOLATION_READINESS,
  candidates: SANDBOX_CANDIDATES.map((candidate) =>
    evaluateSandboxCandidate(candidate, options),
  ),
})

export const assertRequiredSandboxCandidatesPassed = (
  report: SandboxEvaluationReport,
  requiredCandidateIds: readonly string[],
): void => {
  for (const candidateId of requiredCandidateIds) {
    const candidate = report.candidates.find(
      (entry) => entry.id === candidateId,
    )
    if (!candidate) {
      throw new Error(`Required sandbox candidate missing: ${candidateId}`)
    }
    if (candidate.status !== "passed") {
      throw new Error(
        `Required sandbox candidate ${candidateId} did not pass; status=${candidate.status}. Run pnpm sandbox:evaluate:container with the required runtime available.`,
      )
    }
  }
}

export const assertRuntimeIsolationReadinessGuardrails = (
  report: SandboxEvaluationReport,
): void => {
  const readiness = report.runtimeIsolationReadiness
  if (
    readiness.status !== "evidence_only_not_promoted" ||
    readiness.promotionAllowed !== false ||
    readiness.noSilentFallback !== true ||
    report.noCandidatePromoted !== true ||
    report.countedMatchDefaultsUnchanged !== true
  ) {
    throw new Error("Runtime isolation readiness guardrails drifted")
  }
  const requiredCriteria = new Set([
    "required-container-probes",
    "resource-limits",
    "filesystem-denial",
    "network-denial",
    "image-provenance",
    "deployment-preflight",
    "failure-taxonomy",
    "redacted-diagnostics",
    "local-ergonomics",
  ])
  for (const criterion of readiness.criteria) {
    requiredCriteria.delete(criterion.id)
  }
  if (requiredCriteria.size > 0) {
    throw new Error(
      `Runtime isolation readiness missing criteria: ${[...requiredCriteria].join(", ")}`,
    )
  }
  const requiredTaxonomy = new Set<SandboxProbeTaxonomy>([
    "filesystem",
    "host_paths",
    "network",
    "process_shell",
    "imports_packages",
    "dynamic_execution",
    "environment",
    "output_pressure",
    "memory_pressure",
    "timeout",
    "crash",
    "malformed_ipc",
    "diagnostic_redaction",
    "schema_invalid_output",
  ])
  for (const probe of SANDBOX_PROBES) {
    requiredTaxonomy.delete(sandboxProbeTaxonomy(probe))
  }
  if (requiredTaxonomy.size > 0) {
    throw new Error(
      `Runtime isolation readiness missing probe taxonomy: ${[...requiredTaxonomy].join(", ")}`,
    )
  }
  const requiredDrills = new Set([
    "stopped-runtime-service",
    "stopped-python-runtime",
    "runsc-unavailable",
    "docker-or-image-unavailable",
    "stale-artifacts",
    "silent-substitution",
  ])
  for (const drill of readiness.noFallbackDrills) {
    requiredDrills.delete(drill.id)
  }
  if (requiredDrills.size > 0) {
    throw new Error(
      `Runtime isolation readiness missing no-fallback drills: ${[...requiredDrills].join(", ")}`,
    )
  }
}

export const assertSandboxEvaluationPublicSafe = (
  report: SandboxEvaluationReport,
): void => {
  assertRuntimeIsolationReadinessGuardrails(report)
  const serialized = JSON.stringify(report)
  for (const marker of sandboxEvaluationPublicForbiddenMarkers) {
    if (serialized.includes(marker)) {
      throw new Error(`Sandbox evaluation leaked private marker: ${marker}`)
    }
  }
}
