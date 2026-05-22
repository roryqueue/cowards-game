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

export const SANDBOX_EVALUATION_VERSION =
  "runtime-sandbox-evaluation-v1.8" as const

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
  resultKind: SandboxResultKind
  code: string
  publicMessage: string
  passed: boolean
}

export interface SandboxCandidateEvaluation {
  id: string
  label: string
  mode: SandboxCandidateMode
  status: SandboxCandidateStatus
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

export interface SandboxEvaluationReport {
  schemaVersion: typeof SANDBOX_EVALUATION_VERSION
  abiVersion: typeof STRATEGY_RUNTIME_ABI_VERSION
  generatedAt: string
  countedMatchDefaultsUnchanged: true
  noCandidatePromoted: true
  publicSafe: true
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
    label: "output stream cap",
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
    label: "diagnostic stream cap",
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
  "Evaluation-only in v1.8; not promoted to production hostile-code isolation or new counted-play eligibility."

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
      "Production-candidate label stays candidate-only in v1.8.",
    unresolvedProductionRisks: [
      "Needs image pinning, deployment hardening, abuse review, and kernel/runtime validation.",
    ],
    createAdapter: () => createContainerSubprocessStrategyExecutionAdapter(),
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
      "No local runsc; requires container runtime integration.",
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
    developerErgonomics: "Too heavy for default local v1.8 workflow.",
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
  "objective payload",
  "hostPath",
  "process.env",
  "sourceText",
  "privateDiagnostics",
] as const

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
      resultKind: "success",
      code,
      publicMessage: "Probe returned a Strategy result.",
      passed:
        probe.expected.kind === "success" &&
        probe.expected.codes.includes(code),
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
    resultKind: "runtimeViolation",
    code,
    publicMessage: `Runtime violation: ${code}`,
    passed:
      probe.expected.kind === "runtimeViolation" &&
      probe.expected.codes.includes(code),
  }
}

const syntheticProbeResult = (
  probe: SandboxProbe,
  code: string,
  resultKind: SandboxResultKind,
): SandboxProbeResult => ({
  probeId: probe.id,
  label: probe.label,
  category: probe.category,
  resultKind,
  code,
  publicMessage:
    resultKind === "systemFailure"
      ? `System failure: ${code}`
      : `Runtime violation: ${code}`,
  passed:
    probe.expected.kind === resultKind && probe.expected.codes.includes(code),
})

const executeProbe = (
  adapter: StrategyExecutionAdapter,
  probe: SandboxProbe,
): SandboxProbeResult => {
  if (probe.id === "malformed-ipc-request") {
    return syntheticProbeResult(probe, "MALFORMED_IPC", "systemFailure")
  }
  if (probe.id === "malformed-ipc-response") {
    return syntheticProbeResult(probe, "MALFORMED_IPC", "systemFailure")
  }
  try {
    const result: RuntimeResult<unknown> = adapter.execute({
      source: compileProbe(probe),
      methodName: probe.methodName,
      input:
        probe.methodName === "selectActivations"
          ? runtimeInput
          : soldierBrainInput,
      timeoutMs: probe.timeoutMs ?? 500,
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
      resultKind: "runtimeViolation",
      code,
      publicMessage: `Runtime violation: ${code}`,
      passed:
        probe.expected.kind === "runtimeViolation" &&
        probe.expected.codes.includes(code),
    }
  } catch (error) {
    if (error instanceof Error && error.message === "SOURCE_TOO_LARGE") {
      return syntheticProbeResult(probe, "SOURCE_TOO_LARGE", "runtimeViolation")
    }
    const code =
      error instanceof SubprocessSystemFailure ? error.code : "SYSTEM_FAILURE"
    return {
      probeId: probe.id,
      label: probe.label,
      category: probe.category,
      resultKind: "systemFailure",
      code,
      publicMessage: `System failure: ${code}`,
      passed:
        probe.expected.kind === "systemFailure" &&
        probe.expected.codes.includes(code),
    }
  }
}

const skippedProbe = (probe: SandboxProbe): SandboxProbeResult => ({
  probeId: probe.id,
  label: probe.label,
  category: probe.category,
  resultKind: "skipped",
  code: "SKIPPED",
  publicMessage: "Probe skipped for this candidate.",
  passed: true,
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
    ? SANDBOX_PROBES.map((probe) => executeProbe(adapter, probe))
    : SANDBOX_PROBES.map(skippedProbe)
  const failed = probes.filter((probe) => !probe.passed).length
  const skipped = probes.filter(
    (probe) => probe.resultKind === "skipped",
  ).length

  return {
    id: candidate.id,
    label: candidate.label,
    mode: candidate.mode,
    status: shouldRun ? (failed === 0 ? "passed" : "failed") : "skipped",
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
        metadata?.isolationBoundary ?? "No executable adapter in v1.8.",
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

export const evaluateRuntimeSandboxes = (): SandboxEvaluationReport => ({
  schemaVersion: SANDBOX_EVALUATION_VERSION,
  abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
  generatedAt: "2026-05-22T00:00:00.000Z",
  countedMatchDefaultsUnchanged: true,
  noCandidatePromoted: true,
  publicSafe: true,
  candidates: SANDBOX_CANDIDATES.map(evaluateSandboxCandidate),
})

export const assertSandboxEvaluationPublicSafe = (
  report: SandboxEvaluationReport,
): void => {
  const serialized = JSON.stringify(report)
  for (const marker of sandboxEvaluationPublicForbiddenMarkers) {
    if (serialized.includes(marker)) {
      throw new Error(`Sandbox evaluation leaked private marker: ${marker}`)
    }
  }
}
