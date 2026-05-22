import type { JsonValue } from "./types.js"
import { COMPATIBILITY_VERSIONS } from "./versions.js"

export const STRATEGY_RUNTIME_ABI_VERSION = "strategy-runtime-abi-v1.7"

export const STRATEGY_LANGUAGE_IDS = [
  "javascript",
  "typescript",
  "python",
] as const

export type StrategyLanguageId = (typeof STRATEGY_LANGUAGE_IDS)[number]

export const STRATEGY_RUNTIME_ADAPTER_IDS = [
  "runtime-js-worker-thread",
  "runtime-js-subprocess",
  "runtime-js-container-subprocess",
  "runtime-python-subprocess-experimental",
] as const

export type StrategyRuntimeAdapterId =
  (typeof STRATEGY_RUNTIME_ADAPTER_IDS)[number]

export type StrategyRuntimeReadiness =
  | "production-candidate"
  | "prototype"
  | "local-dev-fallback"
  | "experimental"

export interface StrategyLanguageRecord {
  id: StrategyLanguageId
  label: string
  version: string
  enabledForNormalPlay: boolean
  notes: string[]
}

export interface StrategyRuntimeLimits {
  timeoutMs: number
  stdoutBytes: number
  stderrBytes: number
  sourceBytes: number
  strategyMemoryBytes: number
  soldierMemoryBytes: number
  objectivePayloadBytes: number
  environment: "empty" | "minimal" | "inherited"
  filesystem: "none" | "read-only-root" | "host"
  network: "disabled" | "inherited"
  shell: "disabled" | "inherited"
  packagePolicy: "none" | "experimental"
}

export interface StrategyRuntimeAdapterRecord {
  id: StrategyRuntimeAdapterId
  label: string
  version: string
  readiness: StrategyRuntimeReadiness
  supportedLanguageIds: StrategyLanguageId[]
  enabledForNormalPlay: boolean
  countedResultsAllowed: boolean
  isolationBoundary: string
  limits: StrategyRuntimeLimits
  requiredCapabilities: string[]
  notes: string[]
}

export interface StrategyPackageMetadata {
  mode: "none" | "declared"
  entrypoint: string
  manifestHash?: string | undefined
  lockfileHash?: string | undefined
  declaredDependencies?: Record<string, string> | undefined
}

export interface StrategyRuntimeMetadata {
  abiVersion: typeof STRATEGY_RUNTIME_ABI_VERSION
  language: {
    id: StrategyLanguageId
    version: string
  }
  adapter: {
    id: StrategyRuntimeAdapterId
    version: string
  }
  package: StrategyPackageMetadata
  requiredCapabilities: string[]
  limits: StrategyRuntimeLimits
}

export interface StrategyRuntimeCompatibilityKey {
  abiVersion: string
  languageId: StrategyLanguageId
  languageVersion: string
  adapterId: StrategyRuntimeAdapterId
  adapterVersion: string
  packageMode: StrategyPackageMetadata["mode"]
  sourceHash: string
  specVersion: string
  engineVersion: string
  requiredCapabilities: string[]
  limits: StrategyRuntimeLimits
}

export type StrategyRuntimeMethodName = "selectActivations" | "soldierBrain"

export interface StrategyRuntimeRequestEnvelope<
  TInput extends JsonValue = JsonValue,
> {
  abiVersion: typeof STRATEGY_RUNTIME_ABI_VERSION
  methodName: StrategyRuntimeMethodName
  runtime: StrategyRuntimeMetadata
  source: {
    text: string
    hash: string
    bytes: number
    entrypoint: string
  }
  input: TInput
}

export interface StrategyRuntimeSuccessEnvelope<
  TValue extends JsonValue = JsonValue,
> {
  ok: true
  abiVersion: typeof STRATEGY_RUNTIME_ABI_VERSION
  value: TValue
}

export const STRATEGY_RUNTIME_VIOLATION_CODES = [
  "INVALID_OUTPUT",
  "TIMEOUT",
  "THROWN_EXCEPTION",
  "FORBIDDEN_CAPABILITY",
  "OVERSIZED_OUTPUT",
] as const

export type StrategyRuntimeViolationCode =
  (typeof STRATEGY_RUNTIME_VIOLATION_CODES)[number]

export const STRATEGY_RUNTIME_SYSTEM_FAILURE_CODES = [
  "MALFORMED_IPC",
  "SPAWN_FAILED",
  "STDIO_CAP_EXCEEDED",
  "SUBPROCESS_EXIT",
  "SUBPROCESS_SIGNAL",
] as const

export type StrategyRuntimeSystemFailureCode =
  (typeof STRATEGY_RUNTIME_SYSTEM_FAILURE_CODES)[number]

export interface StrategyRuntimeFailureDiagnostics {
  stderr?: string | undefined
  stack?: string | undefined
  details?: JsonValue | undefined
}

export interface StrategyRuntimeViolationEnvelope {
  ok: false
  abiVersion: typeof STRATEGY_RUNTIME_ABI_VERSION
  failureKind: "runtimeViolation"
  violation: {
    code: StrategyRuntimeViolationCode
    message: string
    publicMessage: string
    privateDiagnostics?: StrategyRuntimeFailureDiagnostics | undefined
  }
}

export interface StrategyRuntimeSystemFailureEnvelope {
  ok: false
  abiVersion: typeof STRATEGY_RUNTIME_ABI_VERSION
  failureKind: "systemFailure"
  systemFailure: {
    code: StrategyRuntimeSystemFailureCode
    message: string
    publicMessage: string
    privateDiagnostics?: StrategyRuntimeFailureDiagnostics | undefined
  }
}

export type StrategyRuntimeResponseEnvelope<
  TValue extends JsonValue = JsonValue,
> =
  | StrategyRuntimeSuccessEnvelope<TValue>
  | StrategyRuntimeViolationEnvelope
  | StrategyRuntimeSystemFailureEnvelope

export const DEFAULT_RUNTIME_LIMITS: StrategyRuntimeLimits = {
  timeoutMs: 1_000,
  stdoutBytes: 256 * 1024,
  stderrBytes: 64 * 1024,
  sourceBytes: 64 * 1024,
  strategyMemoryBytes: 32 * 1024,
  soldierMemoryBytes: 2 * 1024,
  objectivePayloadBytes: 1 * 1024,
  environment: "minimal",
  filesystem: "host",
  network: "inherited",
  shell: "disabled",
  packagePolicy: "none",
}

export const STRATEGY_LANGUAGE_REGISTRY = [
  {
    id: "javascript",
    label: "JavaScript",
    version: COMPATIBILITY_VERSIONS.runtimeJs,
    enabledForNormalPlay: true,
    notes: ["Current fully enabled Strategy language through runtime-js."],
  },
  {
    id: "typescript",
    label: "TypeScript",
    version: COMPATIBILITY_VERSIONS.runtimeJs,
    enabledForNormalPlay: true,
    notes: ["Transpiled to JavaScript before runtime-js execution."],
  },
  {
    id: "python",
    label: "Python",
    version: "3.9",
    enabledForNormalPlay: false,
    notes: ["Experimental v1.7 ABI spike only; not public counted play."],
  },
] as const satisfies readonly StrategyLanguageRecord[]

export const STRATEGY_RUNTIME_ADAPTER_REGISTRY = [
  {
    id: "runtime-js-worker-thread",
    label: "runtime-js worker thread",
    version: COMPATIBILITY_VERSIONS.runtimeJs,
    readiness: "local-dev-fallback",
    supportedLanguageIds: ["javascript", "typescript"],
    enabledForNormalPlay: true,
    countedResultsAllowed: true,
    isolationBoundary:
      "Worker-thread containment for local/dev compatibility; not production hostile-code isolation.",
    limits: { ...DEFAULT_RUNTIME_LIMITS, environment: "empty" },
    requiredCapabilities: [],
    notes: ["Default existing runtime-js adapter."],
  },
  {
    id: "runtime-js-subprocess",
    label: "runtime-js subprocess",
    version: COMPATIBILITY_VERSIONS.runtimeJs,
    readiness: "prototype",
    supportedLanguageIds: ["javascript", "typescript"],
    enabledForNormalPlay: true,
    countedResultsAllowed: true,
    isolationBoundary: "Host subprocess with one-shot JSON IPC.",
    limits: DEFAULT_RUNTIME_LIMITS,
    requiredCapabilities: [],
    notes: [
      "Prototype process boundary; still not production hostile-code isolation.",
    ],
  },
  {
    id: "runtime-js-container-subprocess",
    label: "runtime-js container subprocess",
    version: COMPATIBILITY_VERSIONS.runtimeJs,
    readiness: "production-candidate",
    supportedLanguageIds: ["javascript", "typescript"],
    enabledForNormalPlay: true,
    countedResultsAllowed: true,
    isolationBoundary:
      "Containerized subprocess production-candidate boundary.",
    limits: {
      ...DEFAULT_RUNTIME_LIMITS,
      filesystem: "read-only-root",
      network: "disabled",
    },
    requiredCapabilities: [],
    notes: ["Candidate for future hostile-code boundary hardening."],
  },
  {
    id: "runtime-python-subprocess-experimental",
    label: "Python subprocess experimental",
    version: "0.1.0-experimental",
    readiness: "experimental",
    supportedLanguageIds: ["python"],
    enabledForNormalPlay: false,
    countedResultsAllowed: false,
    isolationBoundary: "Local subprocess spike for ABI parity only.",
    limits: {
      ...DEFAULT_RUNTIME_LIMITS,
      filesystem: "none",
      network: "disabled",
      environment: "minimal",
    },
    requiredCapabilities: [],
    notes: [
      "Dev/test only; not public counted MatchSet or analytics evidence.",
    ],
  },
] as const satisfies readonly StrategyRuntimeAdapterRecord[]

export const defaultRuntimeMetadata = (
  languageId: Extract<
    StrategyLanguageId,
    "javascript" | "typescript"
  > = "typescript",
): StrategyRuntimeMetadata => {
  const adapter = STRATEGY_RUNTIME_ADAPTER_REGISTRY[0]
  const language =
    STRATEGY_LANGUAGE_REGISTRY.find(
      (candidate) => candidate.id === languageId,
    ) ?? STRATEGY_LANGUAGE_REGISTRY[1]
  return {
    abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
    language: {
      id: language.id,
      version: language.version,
    },
    adapter: {
      id: adapter.id,
      version: adapter.version,
    },
    package: {
      mode: "none",
      entrypoint: "default",
    },
    requiredCapabilities: [],
    limits: adapter.limits,
  }
}

export const runtimeCompatibilityKey = (input: {
  runtime: StrategyRuntimeMetadata
  sourceHash: string
  specVersion: string
  engineVersion: string
}): StrategyRuntimeCompatibilityKey => ({
  abiVersion: input.runtime.abiVersion,
  languageId: input.runtime.language.id,
  languageVersion: input.runtime.language.version,
  adapterId: input.runtime.adapter.id,
  adapterVersion: input.runtime.adapter.version,
  packageMode: input.runtime.package.mode,
  sourceHash: input.sourceHash,
  specVersion: input.specVersion,
  engineVersion: input.engineVersion,
  requiredCapabilities: [...input.runtime.requiredCapabilities].sort(),
  limits: input.runtime.limits,
})

type LegacyRuntimeMetadata = {
  name?: unknown
  version?: unknown
}

export const normalizeStrategyRuntimeMetadata = (
  value: unknown,
): StrategyRuntimeMetadata => {
  const maybeRuntime = value as Record<string, unknown> | null
  if (
    maybeRuntime &&
    typeof maybeRuntime === "object" &&
    (maybeRuntime as LegacyRuntimeMetadata).name === "runtime-js" &&
    typeof (maybeRuntime as LegacyRuntimeMetadata).version === "string"
  ) {
    return defaultRuntimeMetadata("typescript")
  }
  if (
    maybeRuntime &&
    typeof maybeRuntime === "object" &&
    maybeRuntime.abiVersion === STRATEGY_RUNTIME_ABI_VERSION &&
    maybeRuntime.language &&
    maybeRuntime.adapter &&
    maybeRuntime.package &&
    maybeRuntime.limits
  ) {
    return maybeRuntime as unknown as StrategyRuntimeMetadata
  }
  return defaultRuntimeMetadata("typescript")
}
