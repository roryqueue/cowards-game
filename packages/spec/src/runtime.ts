import type { JsonValue, StrategyRevisionValidationIssue } from "./types.js"
import { COMPATIBILITY_VERSIONS } from "./versions.js"

export const STRATEGY_RUNTIME_ABI_VERSION = "strategy-runtime-abi-v1.14"

export const STRATEGY_LANGUAGE_IDS = [
  "javascript",
  "typescript",
  "python",
  "rust",
  "zig",
] as const

export type StrategyLanguageId = (typeof STRATEGY_LANGUAGE_IDS)[number]

export const STRATEGY_RUNTIME_ADAPTER_IDS = [
  "runtime-js-worker-thread",
  "runtime-js-subprocess",
  "runtime-js-container-subprocess",
  "runtime-python-subprocess-experimental",
  "runtime-wasm-wasi-wasmtime-preview1",
] as const

export type StrategyRuntimeAdapterId =
  (typeof STRATEGY_RUNTIME_ADAPTER_IDS)[number]

export type StrategyRuntimeReadiness =
  | "production-candidate"
  | "prototype"
  | "local-dev-fallback"
  | "experimental"

export type StrategyRuntimeIsolationPromotionState =
  | "evidence-only"
  | "shadow-only"
  | "production-counted"

export interface StrategyLanguageRecord {
  id: StrategyLanguageId
  label: string
  version: string
  enabledForNormalPlay: boolean
  notes: string[]
}

export interface NonJsRuntimeSupportPolicy {
  status: "experimental-non-counted"
  productionSupportedLanguageIds: readonly StrategyLanguageId[]
  experimentalLanguageIds: readonly StrategyLanguageId[]
  publicLanguagePickerAllowed: false
  countedPlayRequiresProductionSupport: true
}

export interface NonJsRuntimePromotionCriterion {
  id: string
  category:
    | "determinism"
    | "sandbox"
    | "package_policy"
    | "workshop_ux_docs"
    | "compatibility"
    | "counted_eligibility"
    | "replay_export_privacy"
    | "rollback"
    | "deprecation"
  requirement: string
  currentStatus: string
  promotionGate: string
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
  runtimeTarget: "runtime-js" | "runtime-python" | "runtime-wasm-wasi"
  readiness: StrategyRuntimeReadiness
  supportedLanguageIds: StrategyLanguageId[]
  enabledForNormalPlay: boolean
  countedResultsAllowed: boolean
  isolationPromotionState: StrategyRuntimeIsolationPromotionState
  isolationPromotionCriteria: string[]
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
  artifactHash?: string | undefined
  artifactTargetTriple?: string | undefined
  artifactWasiProfile?: string | undefined
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
    text?: string | undefined
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

export const STRATEGY_RUNTIME_PRODUCT_VALIDATION_CODES = [
  "UNSUPPORTED_LANGUAGE",
  "UNSUPPORTED_PACKAGE_METADATA",
  "INCOMPATIBLE_ADAPTER",
  "ABI_MISMATCH",
  "SOURCE_TOO_LARGE",
  "MEMORY_LIMIT_EXCEEDED",
  "TIMEOUT",
  "FORBIDDEN_CAPABILITY",
  "NON_COUNTED_RUNTIME",
] as const

export type StrategyRuntimeProductValidationCode =
  (typeof STRATEGY_RUNTIME_PRODUCT_VALIDATION_CODES)[number]

export interface StrategyRuntimeProductValidationMessage {
  code: StrategyRuntimeProductValidationCode
  message: string
  constraint: string
  remediation: string
  reference: string
}

export interface StrategyRuntimeCountedEligibility {
  ok: boolean
  code: StrategyRuntimeProductValidationCode | null
  publicMessage: string | null
}

export interface StrategyRuntimeProductSemantics {
  languageId: StrategyLanguageId
  adapterId: StrategyRuntimeAdapterId
  languageLabel: string
  adapterLabel: string
  readiness: StrategyRuntimeReadiness | "unknown"
  readinessLabel: string
  experimental: boolean
  countedPlayEligible: boolean
  countedPlayLabel: "Counted eligible" | "Not counted"
  countedPlayReason: string | null
  sourcePolicyLabel: string
  packagePolicyLabel: string
  docsReference: string
  examplesReference: string
  warnings: string[]
  validationIssueCodes: StrategyRuntimeProductValidationCode[]
}

export const RUNTIME_BROKER_REGISTRY_VERSION =
  "runtime-broker-registry-v1.17" as const

export interface RuntimeBrokerRegistryEntry {
  languageId: StrategyLanguageId
  languageVersion: string
  runtimeTarget: StrategyRuntimeAdapterRecord["runtimeTarget"]
  adapterId: StrategyRuntimeAdapterId
  adapterVersion: string
  abiVersion: typeof STRATEGY_RUNTIME_ABI_VERSION
  packagePolicy: StrategyPackageMetadata["mode"]
  readiness: StrategyRuntimeReadiness
  enabledForNormalPlay: boolean
  countedResultsAllowed: boolean
  limits: StrategyRuntimeLimits
}

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
    notes: [
      "Non-counted exhibition beta through the runtime broker only; not ranked or counted play.",
    ],
  },
  {
    id: "rust",
    label: "Rust",
    version: "1.95.0-wasm32-wasip1",
    enabledForNormalPlay: false,
    notes: [
      "Non-counted exhibition beta through immutable WASM/WASI artifacts only; not ranked or counted play.",
    ],
  },
  {
    id: "zig",
    label: "Zig",
    version: "0.16.0-wasm32-wasi",
    enabledForNormalPlay: false,
    notes: [
      "Non-counted exhibition beta only when local Zig compile, artifact, Wasmtime, ABI proof, and signed-in proof pass loudly.",
    ],
  },
] as const satisfies readonly StrategyLanguageRecord[]

export const NON_JS_RUNTIME_SUPPORT_POLICY = {
  status: "experimental-non-counted",
  productionSupportedLanguageIds: ["javascript", "typescript"],
  experimentalLanguageIds: ["python", "rust", "zig"],
  publicLanguagePickerAllowed: false,
  countedPlayRequiresProductionSupport: true,
} as const satisfies NonJsRuntimeSupportPolicy

export const NON_JS_RUNTIME_PROMOTION_CRITERIA = [
  {
    id: "deterministic-language-semantics",
    category: "determinism",
    requirement:
      "Language version, locale, hash behavior, clocks, randomness, IO, dynamic loading, memory, and output behavior are deterministic and documented.",
    currentStatus: "Python is an experimental ABI proof, not certified.",
    promotionGate:
      "Repeated local and CI evidence must prove deterministic behavior before counted eligibility.",
  },
  {
    id: "production-sandbox",
    category: "sandbox",
    requirement:
      "The promoted language runs only inside a production-owned hostile-code isolation boundary.",
    currentStatus:
      "Worker-thread, subprocess, container-subprocess, WASM/WASI, and component-model candidates are readiness labels only; Node node:wasi is not accepted as an untrusted Strategy sandbox.",
    promotionGate:
      "Runtime isolation promotion criteria must pass before non-JS counted play.",
  },
  {
    id: "package-policy",
    category: "package_policy",
    requirement:
      "Package metadata, dependency resolution, native module policy, install/build timing, and supply-chain controls are explicit and reproducible.",
    currentStatus:
      "Counted play accepts self-contained source with no packages.",
    promotionGate:
      "Package policy must be versioned and reflected in compatibility keys before promotion.",
  },
  {
    id: "workshop-ux-docs",
    category: "workshop_ux_docs",
    requirement:
      "Workshop templates, examples, validation copy, documentation, and support matrix distinguish production-supported languages from experimental ones.",
    currentStatus:
      "Product surfaces may show experimental labels, but no public language picker is allowed.",
    promotionGate:
      "A public picker can appear only after at least one non-JS runtime is production-supported.",
  },
  {
    id: "compatibility-keys",
    category: "compatibility",
    requirement:
      "ABI, language version, adapter version, package mode, source hash, spec version, engine version, capabilities, and limits are part of behavior-significant compatibility.",
    currentStatus:
      "Runtime dimensions already exist in compatibility metadata.",
    promotionGate:
      "Gauntlets, ladders, replays, exports, and analytics must refuse unsafe cross-runtime comparison.",
  },
  {
    id: "counted-eligibility",
    category: "counted_eligibility",
    requirement:
      "MatchSet, ladder, gauntlet, analytics, and public entry gates agree on counted eligibility.",
    currentStatus:
      "Python remains disabled for normal play and not counted-play eligible.",
    promotionGate:
      "All counted gates must fail closed unless production support is explicit.",
  },
  {
    id: "replay-export-privacy",
    category: "replay_export_privacy",
    requirement:
      "Public replay, service, export, monitor, and topology outputs omit private Strategy/runtime data by default.",
    currentStatus:
      "Existing public privacy monitors apply to runtime artifacts.",
    promotionGate:
      "Any non-JS public output must pass the same private-data denylist before promotion.",
  },
  {
    id: "rollback-policy",
    category: "rollback",
    requirement:
      "Operators can disable promoted non-JS counted play without silently reclassifying existing evidence.",
    currentStatus: "No non-JS counted evidence exists.",
    promotionGate:
      "Promotion requires rollback semantics for unsafe or nondeterministic runtimes.",
  },
  {
    id: "deprecation-policy",
    category: "deprecation",
    requirement:
      "Language/runtime deprecation rules explain compatibility, replayability, and future submission behavior.",
    currentStatus: "Python is experimental and can remain non-counted.",
    promotionGate:
      "A promoted runtime needs versioned deprecation and migration rules.",
  },
] as const satisfies readonly NonJsRuntimePromotionCriterion[]

export const STRATEGY_RUNTIME_ADAPTER_REGISTRY = [
  {
    id: "runtime-js-worker-thread",
    label: "runtime-js worker thread",
    version: COMPATIBILITY_VERSIONS.runtimeJs,
    runtimeTarget: "runtime-js",
    readiness: "local-dev-fallback",
    supportedLanguageIds: ["javascript", "typescript"],
    enabledForNormalPlay: true,
    countedResultsAllowed: true,
    isolationPromotionState: "evidence-only",
    isolationPromotionCriteria: [
      "not-final-hostile-code-boundary",
      "host-filesystem-network-exposure",
    ],
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
    runtimeTarget: "runtime-js",
    readiness: "prototype",
    supportedLanguageIds: ["javascript", "typescript"],
    enabledForNormalPlay: true,
    countedResultsAllowed: true,
    isolationPromotionState: "evidence-only",
    isolationPromotionCriteria: [
      "host-filesystem-network-exposure",
      "requires-os-container-sandboxing",
    ],
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
    runtimeTarget: "runtime-js",
    readiness: "production-candidate",
    supportedLanguageIds: ["javascript", "typescript"],
    enabledForNormalPlay: false,
    countedResultsAllowed: false,
    isolationPromotionState: "evidence-only",
    isolationPromotionCriteria: [
      "required-container-probes",
      "resource-limits",
      "filesystem-denial",
      "network-denial",
      "image-provenance",
      "deployment-preflight",
      "failure-taxonomy",
      "redacted-diagnostics",
      "local-ergonomics",
    ],
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
    runtimeTarget: "runtime-python",
    readiness: "experimental",
    supportedLanguageIds: ["python"],
    enabledForNormalPlay: false,
    countedResultsAllowed: false,
    isolationPromotionState: "evidence-only",
    isolationPromotionCriteria: [
      "non-js-promotion-criteria",
      "production-sandbox-required",
      "package-policy-required",
      "signed-in-exhibition-proof",
      "hostile-probe-evidence",
    ],
    isolationBoundary:
      "Hardened local subprocess evidence for non-counted exhibition beta; not production hostile-code isolation.",
    limits: {
      ...DEFAULT_RUNTIME_LIMITS,
      filesystem: "none",
      network: "disabled",
      environment: "minimal",
    },
    requiredCapabilities: [],
    notes: [
      "Non-counted exhibition beta only; not public counted MatchSet, ranked ladder, or analytics evidence.",
      "WASM/WASI/component-model are future evaluation paths, not v1.18 promotion paths.",
    ],
  },
  {
    id: "runtime-wasm-wasi-wasmtime-preview1",
    label: "WASM/WASI Wasmtime Preview 1",
    version: "0.1.0-alpha",
    runtimeTarget: "runtime-wasm-wasi",
    readiness: "experimental",
    supportedLanguageIds: ["rust", "zig"],
    enabledForNormalPlay: false,
    countedResultsAllowed: false,
    isolationPromotionState: "evidence-only",
    isolationPromotionCriteria: [
      "immutable-wasm-artifact",
      "wasi-preview1-json-envelope",
      "wasmtime-cli-preflight",
      "fuel-timeout-evidence",
      "filesystem-network-denial",
      "redacted-diagnostics",
      "signed-in-exhibition-proof",
    ],
    isolationBoundary:
      "Wasmtime CLI subprocess candidate for immutable WASM/WASI non-counted exhibition beta; not production hostile-code isolation certification.",
    limits: {
      ...DEFAULT_RUNTIME_LIMITS,
      environment: "empty",
      filesystem: "none",
      network: "disabled",
      stdoutBytes: 256 * 1024,
      stderrBytes: 64 * 1024,
    },
    requiredCapabilities: [],
    notes: [
      "WASI Preview 1 stdin/stdout JSON envelope only.",
      "Rust/Zig remain non-counted exhibition beta only; not ranked, ladder, gauntlet, counted, or broad production multi-language support.",
      "Node node:wasi is not accepted as a hostile-code sandbox.",
    ],
  },
] as const satisfies readonly StrategyRuntimeAdapterRecord[]

export const assertNonJsRuntimeGuardrails = (): void => {
  const experimental = new Set<StrategyLanguageId>(
    NON_JS_RUNTIME_SUPPORT_POLICY.experimentalLanguageIds,
  )
  for (const language of STRATEGY_LANGUAGE_REGISTRY) {
    const isExperimental = experimental.has(language.id)
    if (isExperimental && language.enabledForNormalPlay) {
      throw new Error(`${language.id} must remain experimental in v1.16`)
    }
  }
  for (const adapter of STRATEGY_RUNTIME_ADAPTER_REGISTRY) {
    const supportsNonJs = adapter.supportedLanguageIds.some((languageId) =>
      experimental.has(languageId),
    )
    if (!supportsNonJs) {
      continue
    }
    if (
      adapter.enabledForNormalPlay ||
      adapter.countedResultsAllowed ||
      adapter.readiness !== "experimental" ||
      adapter.isolationPromotionState !== "evidence-only"
    ) {
      throw new Error(
        `${adapter.id} must remain experimental and non-counted in v1.16`,
      )
    }
  }
  if (NON_JS_RUNTIME_SUPPORT_POLICY.publicLanguagePickerAllowed !== false) {
    throw new Error("Public non-JS language picker is not allowed in v1.16")
  }
  const requiredCriteria = new Set([
    "deterministic-language-semantics",
    "production-sandbox",
    "package-policy",
    "workshop-ux-docs",
    "compatibility-keys",
    "counted-eligibility",
    "replay-export-privacy",
    "rollback-policy",
    "deprecation-policy",
  ])
  for (const criterion of NON_JS_RUNTIME_PROMOTION_CRITERIA) {
    requiredCriteria.delete(criterion.id)
  }
  if (requiredCriteria.size > 0) {
    throw new Error(
      `Non-JS promotion criteria missing: ${[...requiredCriteria].join(", ")}`,
    )
  }
}

export const STRATEGY_RUNTIME_PRODUCT_VALIDATION_MESSAGES = {
  UNSUPPORTED_LANGUAGE: {
    code: "UNSUPPORTED_LANGUAGE",
    message: "Strategy language is not supported by this runtime.",
    constraint:
      "Strategy language metadata must name a registered language enabled for the selected adapter.",
    remediation:
      "Select a supported JS/TS runtime or keep the revision experimental.",
    reference: "runtime/languages",
  },
  UNSUPPORTED_PACKAGE_METADATA: {
    code: "UNSUPPORTED_PACKAGE_METADATA",
    message: "Strategy package metadata is not supported for counted play.",
    constraint:
      "v1.8 counted play accepts self-contained Strategy source with no package manifest.",
    remediation:
      "Remove package metadata or keep this revision outside counted play.",
    reference: "runtime/package-policy",
  },
  INCOMPATIBLE_ADAPTER: {
    code: "INCOMPATIBLE_ADAPTER",
    message: "Strategy runtime adapter is not compatible with this language.",
    constraint:
      "Runtime adapter metadata must be registered and support the selected language.",
    remediation: "Revalidate with a compatible JS/TS adapter.",
    reference: "runtime/adapters",
  },
  ABI_MISMATCH: {
    code: "ABI_MISMATCH",
    message: "Strategy runtime ABI does not match this service.",
    constraint: `Runtime metadata must use ${STRATEGY_RUNTIME_ABI_VERSION}.`,
    remediation: "Revalidate and submit a fresh Strategy Revision.",
    reference: "runtime/abi",
  },
  SOURCE_TOO_LARGE: {
    code: "SOURCE_TOO_LARGE",
    message: "Strategy source exceeds the source byte limit.",
    constraint: "Strategy source must fit inside the configured source limit.",
    remediation: "Remove unused source or helper data.",
    reference: "runtime/limits",
  },
  MEMORY_LIMIT_EXCEEDED: {
    code: "MEMORY_LIMIT_EXCEEDED",
    message: "Strategy returned memory exceeds the memory limit.",
    constraint:
      "Strategy returned memory values must fit within runtime limits.",
    remediation: "Store smaller JSON-only memory values.",
    reference: "runtime/limits",
  },
  TIMEOUT: {
    code: "TIMEOUT",
    message: "Strategy execution timed out.",
    constraint: "Strategy methods must finish within the runtime timeout.",
    remediation: "Simplify loops and per-Activation work.",
    reference: "runtime/limits",
  },
  FORBIDDEN_CAPABILITY: {
    code: "FORBIDDEN_CAPABILITY",
    message: "Strategy source uses a forbidden host capability.",
    constraint:
      "Strategies must be deterministic and cannot use host, network, filesystem, time, or random APIs.",
    remediation: "Use only Strategy input data and deterministic local logic.",
    reference: "runtime/capabilities",
  },
  NON_COUNTED_RUNTIME: {
    code: "NON_COUNTED_RUNTIME",
    message: "Strategy runtime is experimental and not counted-play eligible.",
    constraint:
      "Counted MatchSets, ladders, and gauntlets require a registered counted runtime. Python is limited to non-counted exhibition beta in v1.18.",
    remediation:
      "Use the JS/TS runtime for counted play or keep this revision in non-counted exhibition beta.",
    reference: "runtime/counting",
  },
} as const satisfies Record<
  StrategyRuntimeProductValidationCode,
  StrategyRuntimeProductValidationMessage
>

const readinessLabels = {
  "local-dev-fallback": "Local fallback",
  prototype: "Prototype",
  "production-candidate": "Production candidate",
  experimental: "Experimental",
  unknown: "Unknown",
} as const satisfies Record<StrategyRuntimeReadiness | "unknown", string>

const countedMessage = (
  code: StrategyRuntimeProductValidationCode,
): StrategyRuntimeProductValidationMessage =>
  STRATEGY_RUNTIME_PRODUCT_VALIDATION_MESSAGES[code]

const productIssue = (
  code: StrategyRuntimeProductValidationCode,
  severity: StrategyRevisionValidationIssue["severity"] = "error",
): StrategyRevisionValidationIssue => {
  const message = countedMessage(code)
  return {
    code,
    severity,
    message: message.message,
    constraint: message.constraint,
    remediation: message.remediation,
    reference: message.reference,
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

export const getStrategyLanguageRecord = (
  id: unknown,
): StrategyLanguageRecord | null =>
  STRATEGY_LANGUAGE_REGISTRY.find((candidate) => candidate.id === id) ?? null

export const getStrategyRuntimeAdapterRecord = (
  id: unknown,
): StrategyRuntimeAdapterRecord | null =>
  STRATEGY_RUNTIME_ADAPTER_REGISTRY.find((candidate) => candidate.id === id) ??
  null

export const RUNTIME_BROKER_REGISTRY =
  STRATEGY_RUNTIME_ADAPTER_REGISTRY.flatMap(
    (adapter): RuntimeBrokerRegistryEntry[] =>
      adapter.supportedLanguageIds.map((languageId) => {
        const language = getStrategyLanguageRecord(languageId)
        if (!language) {
          throw new Error(
            `Runtime adapter ${adapter.id} references unknown language ${languageId}`,
          )
        }
        return {
          languageId: language.id,
          languageVersion: language.version,
          runtimeTarget: adapter.runtimeTarget,
          adapterId: adapter.id,
          adapterVersion: adapter.version,
          abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
          packagePolicy: "none",
          readiness: adapter.readiness,
          enabledForNormalPlay:
            language.enabledForNormalPlay && adapter.enabledForNormalPlay,
          countedResultsAllowed: adapter.countedResultsAllowed,
          limits: adapter.limits,
        }
      }),
  ) as readonly RuntimeBrokerRegistryEntry[]

export const findRuntimeBrokerRegistryEntry = (
  runtime: StrategyRuntimeMetadata,
): RuntimeBrokerRegistryEntry | null =>
  RUNTIME_BROKER_REGISTRY.find(
    (entry) =>
      entry.abiVersion === runtime.abiVersion &&
      entry.languageId === runtime.language.id &&
      entry.languageVersion === runtime.language.version &&
      entry.adapterId === runtime.adapter.id &&
      entry.adapterVersion === runtime.adapter.version &&
      entry.packagePolicy === runtime.package.mode,
  ) ?? null

export const validateRuntimeBrokerRegistryMatch = (
  value: unknown,
): StrategyRevisionValidationIssue[] => {
  const raw = isRecord(value) ? value : null
  const languageValue = isRecord(raw?.language) ? raw.language : null
  const adapterValue = isRecord(raw?.adapter) ? raw.adapter : null
  const packageValue = isRecord(raw?.package) ? raw.package : null
  if (
    raw?.abiVersion !== STRATEGY_RUNTIME_ABI_VERSION ||
    typeof languageValue?.id !== "string" ||
    typeof languageValue?.version !== "string" ||
    typeof adapterValue?.id !== "string" ||
    typeof adapterValue?.version !== "string" ||
    typeof packageValue?.mode !== "string"
  ) {
    return [productIssue("ABI_MISMATCH")]
  }
  const runtime = coerceStrategyRuntimeMetadata(value)
  if (!runtime) {
    return [productIssue("UNSUPPORTED_LANGUAGE")]
  }
  return findRuntimeBrokerRegistryEntry(runtime)
    ? []
    : [productIssue("INCOMPATIBLE_ADAPTER")]
}

const normalizePackageMetadata = (
  value: unknown,
): StrategyPackageMetadata | null => {
  if (!isRecord(value)) {
    return null
  }
  const mode = value.mode === "declared" ? "declared" : "none"
  const entrypoint =
    typeof value.entrypoint === "string" && value.entrypoint.length > 0
      ? value.entrypoint
      : "default"
  return {
    mode,
    entrypoint,
    ...(typeof value.manifestHash === "string"
      ? { manifestHash: value.manifestHash }
      : {}),
    ...(typeof value.lockfileHash === "string"
      ? { lockfileHash: value.lockfileHash }
      : {}),
    ...(isRecord(value.declaredDependencies)
      ? {
          declaredDependencies: Object.fromEntries(
            Object.entries(value.declaredDependencies).filter(
              (entry): entry is [string, string] =>
                typeof entry[1] === "string",
            ),
          ),
        }
      : {}),
  }
}

const coerceStrategyRuntimeMetadata = (
  value: unknown,
): StrategyRuntimeMetadata | null => {
  const maybeRuntime = value as Record<string, unknown> | null
  if (
    maybeRuntime &&
    typeof maybeRuntime === "object" &&
    (maybeRuntime as LegacyRuntimeMetadata).name === "runtime-js" &&
    typeof (maybeRuntime as LegacyRuntimeMetadata).version === "string"
  ) {
    return defaultRuntimeMetadata("typescript")
  }
  if (!isRecord(maybeRuntime)) {
    return null
  }
  const languageValue = isRecord(maybeRuntime.language)
    ? maybeRuntime.language
    : null
  const adapterValue = isRecord(maybeRuntime.adapter)
    ? maybeRuntime.adapter
    : null
  const language = getStrategyLanguageRecord(languageValue?.id)
  const adapter = getStrategyRuntimeAdapterRecord(adapterValue?.id)
  const packageMetadata = normalizePackageMetadata(maybeRuntime.package)

  if (!language || !adapter || !packageMetadata) {
    return null
  }

  return {
    abiVersion:
      maybeRuntime.abiVersion === STRATEGY_RUNTIME_ABI_VERSION
        ? STRATEGY_RUNTIME_ABI_VERSION
        : STRATEGY_RUNTIME_ABI_VERSION,
    language: {
      id: language.id,
      version:
        typeof languageValue?.version === "string"
          ? languageValue.version
          : language.version,
    },
    adapter: {
      id: adapter.id,
      version:
        typeof adapterValue?.version === "string"
          ? adapterValue.version
          : adapter.version,
    },
    package: packageMetadata,
    requiredCapabilities: Array.isArray(maybeRuntime.requiredCapabilities)
      ? maybeRuntime.requiredCapabilities.filter(
          (capability): capability is string =>
            typeof capability === "string" && capability.length > 0,
        )
      : [],
    limits: isRecord(maybeRuntime.limits)
      ? ({ ...adapter.limits, ...maybeRuntime.limits } as StrategyRuntimeLimits)
      : adapter.limits,
  }
}

export const validateStrategyRuntimeMetadataPolicy = (
  value: unknown,
): StrategyRevisionValidationIssue[] => {
  const raw = isRecord(value) ? value : null
  const languageValue = isRecord(raw?.language) ? raw.language : null
  const adapterValue = isRecord(raw?.adapter) ? raw.adapter : null
  const language = getStrategyLanguageRecord(languageValue?.id)
  const adapter = getStrategyRuntimeAdapterRecord(adapterValue?.id)
  const runtime = coerceStrategyRuntimeMetadata(value)
  const issues: StrategyRevisionValidationIssue[] = []

  if (raw?.abiVersion !== STRATEGY_RUNTIME_ABI_VERSION) {
    issues.push(productIssue("ABI_MISMATCH"))
  }
  if (!language) {
    issues.push(productIssue("UNSUPPORTED_LANGUAGE"))
  }
  if (!adapter) {
    issues.push(productIssue("INCOMPATIBLE_ADAPTER"))
  }
  if (
    language &&
    adapter &&
    !adapter.supportedLanguageIds.includes(language.id)
  ) {
    issues.push(productIssue("INCOMPATIBLE_ADAPTER"))
  }
  if (runtime?.package.mode === "declared") {
    issues.push(productIssue("UNSUPPORTED_PACKAGE_METADATA"))
  }
  if ((runtime?.requiredCapabilities.length ?? 0) > 0) {
    issues.push(productIssue("UNSUPPORTED_PACKAGE_METADATA"))
  }
  if (
    language &&
    adapter &&
    (!language.enabledForNormalPlay ||
      !adapter.enabledForNormalPlay ||
      !adapter.countedResultsAllowed)
  ) {
    issues.push(productIssue("NON_COUNTED_RUNTIME", "warning"))
  }

  return issues
}

export const evaluateStrategyRuntimeCountedEligibility = (
  value: unknown,
): StrategyRuntimeCountedEligibility => {
  const issue =
    validateStrategyRuntimeMetadataPolicy(value).find((candidate) =>
      [
        "ABI_MISMATCH",
        "UNSUPPORTED_LANGUAGE",
        "INCOMPATIBLE_ADAPTER",
        "UNSUPPORTED_PACKAGE_METADATA",
        "NON_COUNTED_RUNTIME",
      ].includes(candidate.code),
    ) ?? null

  return issue
    ? {
        ok: false,
        code: issue.code as StrategyRuntimeProductValidationCode,
        publicMessage: issue.message,
      }
    : { ok: true, code: null, publicMessage: null }
}

export const describeStrategyRuntimeProductSemantics = (
  value: unknown,
): StrategyRuntimeProductSemantics => {
  const runtime = normalizeStrategyRuntimeMetadata(value)
  const language = getStrategyLanguageRecord(runtime.language.id)
  const adapter = getStrategyRuntimeAdapterRecord(runtime.adapter.id)
  const eligibility = evaluateStrategyRuntimeCountedEligibility(value)
  const issues = validateStrategyRuntimeMetadataPolicy(value)
  const readiness = adapter?.readiness ?? "unknown"
  const experimental =
    readiness === "experimental" ||
    language?.enabledForNormalPlay === false ||
    adapter?.enabledForNormalPlay === false
  const warnings = [
    ...(experimental
      ? [
          runtime.language.id === "rust" || runtime.language.id === "zig"
            ? "Non-counted exhibition beta WASM/WASI runtime; not eligible for ranked, ladder, gauntlet, or counted play."
            : "Non-counted exhibition beta runtime; not eligible for ranked or counted play.",
        ]
      : []),
    ...(runtime.package.mode === "declared"
      ? ["Declared package metadata is not supported for counted play in v1.8."]
      : []),
    ...(eligibility.publicMessage ? [eligibility.publicMessage] : []),
  ]

  return {
    languageId: runtime.language.id,
    adapterId: runtime.adapter.id,
    languageLabel: language?.label ?? runtime.language.id,
    adapterLabel: adapter?.label ?? runtime.adapter.id,
    readiness,
    readinessLabel: readinessLabels[readiness],
    experimental,
    countedPlayEligible: eligibility.ok,
    countedPlayLabel: eligibility.ok ? "Counted eligible" : "Not counted",
    countedPlayReason: eligibility.publicMessage,
    sourcePolicyLabel: "Self-contained Strategy source",
    packagePolicyLabel:
      runtime.package.mode === "none"
        ? "No packages"
        : "Declared packages experimental",
    docsReference: "runtime/languages",
    examplesReference:
      runtime.language.id === "python"
        ? "examples/python-experimental"
        : runtime.language.id === "rust"
          ? "examples/rust-wasi-exhibition-beta"
          : runtime.language.id === "zig"
            ? "examples/zig-wasi-exhibition-beta"
            : "samples/minimal-strategy",
    warnings,
    validationIssueCodes: issues.map(
      (issue) => issue.code as StrategyRuntimeProductValidationCode,
    ),
  }
}

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
  artifactHash?: string | undefined
  artifactTargetTriple?: string | undefined
  artifactWasiProfile?: string | undefined
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
  ...(input.artifactHash === undefined
    ? {}
    : { artifactHash: input.artifactHash }),
  ...(input.artifactTargetTriple === undefined
    ? {}
    : { artifactTargetTriple: input.artifactTargetTriple }),
  ...(input.artifactWasiProfile === undefined
    ? {}
    : { artifactWasiProfile: input.artifactWasiProfile }),
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
  return (
    coerceStrategyRuntimeMetadata(value) ?? defaultRuntimeMetadata("typescript")
  )
}
