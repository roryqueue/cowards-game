import { createHash } from "node:crypto"
import { encodeCanonicalJson } from "./canonical-json-encode.js"
import type { JsonValue } from "./types.js"

export const RUNTIME_BUDGET_CAPABILITY_DIMENSIONS_V1_17 = [
  "wall",
  "compute",
  "memory",
  "payload",
  "stdout",
  "stderr",
  "process",
  "capabilities",
  "cancellation",
  "accountingEvidence",
] as const

export const RUNTIME_BUDGET_CAPABILITY_PINS_V1_17 = [
  "runtimeExecutableDigest",
  "reportedVersion",
  "targetAbi",
  "compilerFlags",
  "adapterBuildDigest",
  "standardLibraryOrSysrootDigest",
  "containmentPolicyId",
  "budgetProfileSha256",
  "canonicalJsonProfileId",
  "behaviorSettingsHash",
] as const

export const RUNTIME_BUDGET_CAPABILITY_LANES_V1_17 = [
  "javascript",
  "typescript",
  "python",
  "rust",
  "zig",
] as const

export type RuntimeBudgetCapabilityDimensionV117 =
  (typeof RUNTIME_BUDGET_CAPABILITY_DIMENSIONS_V1_17)[number]
export type RuntimeBudgetCapabilityPinV117 =
  (typeof RUNTIME_BUDGET_CAPABILITY_PINS_V1_17)[number]
export type RuntimeBudgetCapabilityLaneV117 =
  (typeof RUNTIME_BUDGET_CAPABILITY_LANES_V1_17)[number]
export type RuntimeBudgetCapabilityStatusV117 =
  | "equivalent-enforced"
  | "diagnostic-only"
  | "unsupported"
export type RuntimeBudgetCapabilityPinStatusV117 =
  | "exact-deployment"
  | "local-diagnostic"
  | "floating"
  | "missing"

const deepFreeze = <T>(value: T): T => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
    Object.freeze(value)
  }
  return value
}

const digestValue = (domain: string, value: unknown): `sha256:${string}` => {
  const encoded = encodeCanonicalJson(
    { domain, value } as unknown as JsonValue,
    { context: "canonical-manifest" },
  )
  if (!encoded.ok) {
    throw new TypeError(
      `Runtime budget capability digest input is not canonical: ${encoded.error.code}`,
    )
  }
  return `sha256:${createHash("sha256").update(encoded.bytes).digest("hex")}`
}

const DIMENSION_DEFINITIONS = [
  { id: "wall", equivalentUnit: "monotonic-milliseconds" },
  { id: "compute", equivalentUnit: "language-neutral-instruction-fuel" },
  {
    id: "memory",
    equivalentUnit: "peak-guest-plus-containing-process-bytes",
  },
  { id: "payload", equivalentUnit: "canonical-payload-bytes" },
  { id: "stdout", equivalentUnit: "transport-frame-bytes" },
  { id: "stderr", equivalentUnit: "raw-utf8-bytes" },
  { id: "process", equivalentUnit: "process-thread-child-counts" },
  { id: "capabilities", equivalentUnit: "denied-capability-set" },
  { id: "cancellation", equivalentUnit: "termination-receipt" },
  {
    id: "accountingEvidence",
    equivalentUnit: "signed-monotonic-budget-delta",
  },
] as const

const PIN_DEFINITIONS = [
  {
    id: "runtimeExecutableDigest",
    exactRequirement: "immutable-runtime-executable-sha256",
  },
  {
    id: "reportedVersion",
    exactRequirement: "exact-runtime-or-toolchain-version",
  },
  { id: "targetAbi", exactRequirement: "exact-target-and-runtime-abi" },
  { id: "compilerFlags", exactRequirement: "ordered-compiler-flags-digest" },
  {
    id: "adapterBuildDigest",
    exactRequirement: "immutable-adapter-build-sha256",
  },
  {
    id: "standardLibraryOrSysrootDigest",
    exactRequirement: "immutable-standard-library-or-sysroot-sha256",
  },
  {
    id: "containmentPolicyId",
    exactRequirement: "exact-contained-deployment-policy-id",
  },
  {
    id: "budgetProfileSha256",
    exactRequirement: "exact-runtime-budget-profile-sha256",
  },
  {
    id: "canonicalJsonProfileId",
    exactRequirement: "canonical-json-v1",
  },
  {
    id: "behaviorSettingsHash",
    exactRequirement: "all-behavior-significant-settings-sha256",
  },
] as const

const LANE_DEFINITIONS = [
  {
    laneId: "javascript",
    languageId: "javascript",
    laneRole: "substrate-only",
    entrant: false,
  },
  {
    laneId: "typescript",
    languageId: "typescript",
    laneRole: "entrant-language",
    entrant: true,
  },
  {
    laneId: "python",
    languageId: "python",
    laneRole: "entrant-language",
    entrant: true,
  },
  {
    laneId: "rust",
    languageId: "rust",
    laneRole: "entrant-language",
    entrant: true,
  },
  {
    laneId: "zig",
    languageId: "zig",
    laneRole: "entrant-language",
    entrant: true,
  },
] as const

export const RUNTIME_BUDGET_CAPABILITY_CONTRACT_V1_17 = deepFreeze({
  schemaVersion: "runtime-budget-capability-contract-v1.17",
  runtimeAbiVersion: "strategy-runtime-abi-v1.17",
  dimensions: DIMENSION_DEFINITIONS,
  identityPins: PIN_DEFINITIONS,
  lanes: LANE_DEFINITIONS,
  policy: {
    certificationStatus: "uncertified",
    allDimensionsRequiredInOrder: true,
    allPinsRequiredInOrder: true,
    allPinsMustBeExactDeployment: true,
    productionTrustedProducerRequired: true,
    localDiagnosticsCanCertify: false,
    floatingPinsCanCertify: false,
    missingPinsCanCertify: false,
    phase259ConformanceRequired: true,
  },
} as const)

interface CapabilityInputV117 {
  readonly dimension: RuntimeBudgetCapabilityDimensionV117
  readonly unit: string
  readonly scope: string
  readonly measurement: string
  readonly enforcement: string
  readonly status: RuntimeBudgetCapabilityStatusV117
}

interface PinInputV117 {
  readonly pin: RuntimeBudgetCapabilityPinV117
  readonly status: RuntimeBudgetCapabilityPinStatusV117
  readonly bindingSafeId: string | null
}

interface EvidenceInputV117 {
  readonly laneId: RuntimeBudgetCapabilityLaneV117
  readonly certificationReasons: readonly string[]
  readonly capabilities: readonly CapabilityInputV117[]
  readonly identityPins: readonly PinInputV117[]
  readonly localProbeDisposition: "diagnostic-only"
  readonly productionTrustedProducers: readonly []
}

const capability = (
  dimension: RuntimeBudgetCapabilityDimensionV117,
  unit: string,
  scope: string,
  measurement: string,
  enforcement: string,
  status: RuntimeBudgetCapabilityStatusV117,
): CapabilityInputV117 => ({
  dimension,
  unit,
  scope,
  measurement,
  enforcement,
  status,
})

const pin = (
  pinId: RuntimeBudgetCapabilityPinV117,
  status: RuntimeBudgetCapabilityPinStatusV117,
  bindingSafeId: string | null,
): PinInputV117 => ({ pin: pinId, status, bindingSafeId })

const unavailableCapability = (
  dimension: RuntimeBudgetCapabilityDimensionV117,
  scope: string,
): CapabilityInputV117 =>
  capability(
    dimension,
    "unavailable",
    scope,
    "unavailable",
    "fail-closed-as-system-failure",
    "unsupported",
  )

const BUDGET_PROFILE_DIGEST = digestValue("budget-profile", {
  profileId: "runtime-budget-profile-v1.17-candidate",
})

const commonContractPins = (): readonly PinInputV117[] => [
  pin("budgetProfileSha256", "exact-deployment", BUDGET_PROFILE_DIGEST),
  pin("canonicalJsonProfileId", "exact-deployment", "canonical-json-v1"),
]

const pinsFor = (
  prefix: string,
  options: Readonly<{
    runtime: RuntimeBudgetCapabilityPinStatusV117
    reported: RuntimeBudgetCapabilityPinStatusV117
    target: RuntimeBudgetCapabilityPinStatusV117
    flags: RuntimeBudgetCapabilityPinStatusV117
    adapter: RuntimeBudgetCapabilityPinStatusV117
    stdlib: RuntimeBudgetCapabilityPinStatusV117
    containment: RuntimeBudgetCapabilityPinStatusV117
    settings: RuntimeBudgetCapabilityPinStatusV117
  }>,
): readonly PinInputV117[] => {
  const binding = (
    id: string,
    status: RuntimeBudgetCapabilityPinStatusV117,
  ): string | null => {
    if (status === "missing") return null
    if (status === "floating") return `floating:${prefix}-${id}`
    if (status === "local-diagnostic") return `local-diagnostic:${prefix}-${id}`
    return digestValue(`exact-${prefix}-${id}`, { prefix, id })
  }
  const common = commonContractPins()
  return [
    pin(
      "runtimeExecutableDigest",
      options.runtime,
      binding("runtime-executable", options.runtime),
    ),
    pin(
      "reportedVersion",
      options.reported,
      binding("reported-version", options.reported),
    ),
    pin("targetAbi", options.target, binding("target-abi", options.target)),
    pin(
      "compilerFlags",
      options.flags,
      binding("compiler-flags", options.flags),
    ),
    pin(
      "adapterBuildDigest",
      options.adapter,
      binding("adapter-build", options.adapter),
    ),
    pin(
      "standardLibraryOrSysrootDigest",
      options.stdlib,
      binding("stdlib-sysroot", options.stdlib),
    ),
    pin(
      "containmentPolicyId",
      options.containment,
      binding("containment-policy", options.containment),
    ),
    common[0]!,
    common[1]!,
    pin(
      "behaviorSettingsHash",
      options.settings,
      binding("behavior-settings", options.settings),
    ),
  ]
}

const typescriptLikeCapabilities = (
  laneId: "javascript" | "typescript",
): readonly CapabilityInputV117[] => {
  if (laneId === "javascript") {
    return RUNTIME_BUDGET_CAPABILITY_DIMENSIONS_V1_17.map((dimension) =>
      unavailableCapability(dimension, "substrate-only-not-an-entrant-lane"),
    )
  }
  return [
    capability(
      "wall",
      "monotonic-milliseconds",
      "guest-entry-through-complete-host-response",
      "host-observed-wall-deadline",
      "worker-or-subprocess-termination",
      "diagnostic-only",
    ),
    unavailableCapability("compute", "guest-instruction-execution"),
    capability(
      "memory",
      "optional-container-process-bytes",
      "optional-local-container-process",
      "container-limit-observation-when-present",
      "optional-container-termination",
      "diagnostic-only",
    ),
    capability(
      "payload",
      "canonical-payload-bytes",
      "decoded-strategy-payload-before-materialization",
      "bounded-canonical-parser-byte-count",
      "reject-before-payload-consumption",
      "equivalent-enforced",
    ),
    capability(
      "stdout",
      "transport-frame-bytes",
      "complete-host-owned-response-frame",
      "bounded-host-bridge-byte-count",
      "terminate-or-reject-before-transport-acceptance",
      "equivalent-enforced",
    ),
    capability(
      "stderr",
      "adapter-private-capture-bytes",
      "private-subprocess-diagnostic-stream-when-present",
      "adapter-specific-private-capture",
      "redact-and-fail-closed-on-overrun",
      "diagnostic-only",
    ),
    capability(
      "process",
      "optional-container-process-counts",
      "optional-local-container-process-tree",
      "container-process-observation-when-present",
      "optional-container-process-limit",
      "diagnostic-only",
    ),
    capability(
      "capabilities",
      "host-denial-probe-set",
      "worker-subprocess-and-optional-container-surfaces",
      "hostile-capability-probes",
      "host-bridge-and-containment-denial",
      "diagnostic-only",
    ),
    capability(
      "cancellation",
      "host-termination-observation",
      "worker-or-subprocess-invocation",
      "host-cancellation-observation",
      "host-owned-termination",
      "diagnostic-only",
    ),
    unavailableCapability(
      "accountingEvidence",
      "signed-per-invocation-and-match-cumulative-ledger",
    ),
  ]
}

const pythonCapabilities = (): readonly CapabilityInputV117[] => [
  capability(
    "wall",
    "monotonic-milliseconds",
    "guest-go-signal-through-complete-response-eof",
    "fork-supervisor-monotonic-deadline",
    "uncatchable-parent-termination",
    "diagnostic-only",
  ),
  unavailableCapability("compute", "guest-python-execution"),
  unavailableCapability(
    "memory",
    "guest-plus-containing-python-process-working-set",
  ),
  capability(
    "payload",
    "canonical-payload-bytes",
    "decoded-strategy-payload-before-materialization",
    "bounded-canonical-parser-byte-count",
    "reject-before-payload-consumption",
    "equivalent-enforced",
  ),
  capability(
    "stdout",
    "transport-frame-bytes",
    "complete-host-owned-response-frame",
    "parent-captured-frame-byte-count",
    "terminate-or-reject-before-transport-acceptance",
    "equivalent-enforced",
  ),
  capability(
    "stderr",
    "raw-utf8-bytes",
    "private-child-stderr",
    "bounded-parent-private-capture",
    "terminate-and-redact-on-overrun",
    "diagnostic-only",
  ),
  capability(
    "process",
    "process-thread-child-counts",
    "fork-supervised-python-child",
    "parent-child-lifecycle-observation",
    "single-child-empty-environment-policy",
    "diagnostic-only",
  ),
  capability(
    "capabilities",
    "denied-capability-set",
    "python-validation-and-empty-environment-child",
    "ast-compile-and-host-capability-probes",
    "validation-denial-and-isolated-child-policy",
    "diagnostic-only",
  ),
  capability(
    "cancellation",
    "termination-receipt",
    "fork-supervised-python-child",
    "parent-owned-child-exit-observation",
    "parent-kill-and-eof-requirement",
    "diagnostic-only",
  ),
  unavailableCapability(
    "accountingEvidence",
    "signed-per-invocation-and-match-cumulative-ledger",
  ),
]

const wasmCapabilities = (): readonly CapabilityInputV117[] => [
  capability(
    "wall",
    "monotonic-milliseconds",
    "wasmtime-command-invocation",
    "local-wasmtime-timeout-observation",
    "host-owned-wasmtime-termination",
    "diagnostic-only",
  ),
  capability(
    "compute",
    "wasmtime-fuel-units",
    "wasm-guest-instructions",
    "local-wasmtime-fuel-counter",
    "wasmtime-fuel-ceiling",
    "diagnostic-only",
  ),
  capability(
    "memory",
    "wasm-linear-memory-bytes",
    "wasm-linear-memory-not-containing-process-working-set",
    "local-wasmtime-linear-memory-limit",
    "wasmtime-memory-and-stack-ceilings",
    "diagnostic-only",
  ),
  capability(
    "payload",
    "canonical-payload-bytes",
    "decoded-strategy-payload-before-materialization",
    "bounded-canonical-parser-byte-count",
    "reject-before-payload-consumption",
    "equivalent-enforced",
  ),
  capability(
    "stdout",
    "transport-frame-bytes",
    "complete-host-owned-response-frame",
    "host-stdout-byte-meter",
    "terminate-or-reject-before-transport-acceptance",
    "equivalent-enforced",
  ),
  capability(
    "stderr",
    "shared-post-capture-buffer-bytes",
    "shared-private-capture-not-independent-stderr-meter",
    "post-capture-safety-buffer",
    "fail-closed-without-player-attribution",
    "unsupported",
  ),
  capability(
    "process",
    "process-thread-child-counts",
    "single-wasmtime-command-with-empty-wasi-environment",
    "local-process-lifecycle-observation",
    "single-process-no-preopen-policy",
    "diagnostic-only",
  ),
  capability(
    "capabilities",
    "denied-capability-set",
    "wasi-preview1-import-and-preopen-surface",
    "artifact-import-and-hostile-capability-probes",
    "empty-environment-no-preopen-no-network-policy",
    "diagnostic-only",
  ),
  capability(
    "cancellation",
    "termination-receipt",
    "wasmtime-command-invocation",
    "host-owned-process-exit-observation",
    "host-owned-wasmtime-termination",
    "diagnostic-only",
  ),
  unavailableCapability(
    "accountingEvidence",
    "signed-per-invocation-and-match-cumulative-ledger",
  ),
]

const evidenceInput = (
  laneId: RuntimeBudgetCapabilityLaneV117,
  certificationReasons: readonly string[],
  capabilities: readonly CapabilityInputV117[],
  identityPins: readonly PinInputV117[],
): EvidenceInputV117 => ({
  laneId,
  certificationReasons,
  capabilities,
  identityPins,
  localProbeDisposition: "diagnostic-only",
  productionTrustedProducers: [],
})

export const RUNTIME_BUDGET_CAPABILITY_EVIDENCE_INPUTS_V1_17 = deepFreeze([
  evidenceInput(
    "javascript",
    [
      "javascript-is-a-host-substrate-not-a-Strategy-entrant-language",
      "substrate-observation-cannot-create-counted-language-authority",
    ],
    typescriptLikeCapabilities("javascript"),
    pinsFor("javascript", {
      runtime: "floating",
      reported: "floating",
      target: "missing",
      flags: "missing",
      adapter: "local-diagnostic",
      stdlib: "missing",
      containment: "local-diagnostic",
      settings: "local-diagnostic",
    }),
  ),
  evidenceInput(
    "typescript",
    [
      "language-neutral-compute-and-containing-memory-meters-are-unavailable",
      "process-capability-cancellation-and-accounting-evidence-are-not-exact-deployment-proof",
      "phase-259-full-conformance-and-production-producer-evidence-are-absent",
    ],
    typescriptLikeCapabilities("typescript"),
    pinsFor("typescript", {
      runtime: "floating",
      reported: "local-diagnostic",
      target: "local-diagnostic",
      flags: "missing",
      adapter: "local-diagnostic",
      stdlib: "missing",
      containment: "local-diagnostic",
      settings: "local-diagnostic",
    }),
  ),
  evidenceInput(
    "python",
    [
      "compute-and-containing-memory-meters-are-unavailable",
      "local-runtime-and-containment-observation-is-not-an-exact-deployment-pin",
      "phase-259-full-conformance-and-production-producer-evidence-are-absent",
    ],
    pythonCapabilities(),
    pinsFor("python", {
      runtime: "floating",
      reported: "local-diagnostic",
      target: "missing",
      flags: "missing",
      adapter: "local-diagnostic",
      stdlib: "missing",
      containment: "local-diagnostic",
      settings: "local-diagnostic",
    }),
  ),
  evidenceInput(
    "rust",
    [
      "wasmtime-fuel-and-linear-memory-units-are-not-cross-language-equivalent",
      "stderr-and-cumulative-accounting-evidence-are-unavailable",
      "all-runtime-toolchain-observations-are-local-diagnostic-only",
      "phase-259-full-conformance-and-production-producer-evidence-are-absent",
    ],
    wasmCapabilities(),
    pinsFor("rust", {
      runtime: "local-diagnostic",
      reported: "local-diagnostic",
      target: "local-diagnostic",
      flags: "local-diagnostic",
      adapter: "local-diagnostic",
      stdlib: "local-diagnostic",
      containment: "local-diagnostic",
      settings: "local-diagnostic",
    }),
  ),
  evidenceInput(
    "zig",
    [
      "wasmtime-fuel-and-linear-memory-units-are-not-cross-language-equivalent",
      "stderr-and-cumulative-accounting-evidence-are-unavailable",
      "all-runtime-toolchain-observations-are-local-diagnostic-only",
      "phase-259-full-conformance-and-production-producer-evidence-are-absent",
    ],
    wasmCapabilities(),
    pinsFor("zig", {
      runtime: "local-diagnostic",
      reported: "local-diagnostic",
      target: "local-diagnostic",
      flags: "local-diagnostic",
      adapter: "local-diagnostic",
      stdlib: "local-diagnostic",
      containment: "local-diagnostic",
      settings: "local-diagnostic",
    }),
  ),
] as const satisfies readonly EvidenceInputV117[])

export interface RuntimeBudgetCapabilityFindingV117 {
  readonly code:
    | "INVALID_ROOT"
    | "STRICT_FIELDS_INVALID"
    | "ORDERED_DIMENSIONS_INVALID"
    | "ORDERED_PINS_INVALID"
    | "ORDERED_LANES_INVALID"
    | "CAPABILITY_ROWS_INVALID"
    | "PIN_ROWS_INVALID"
    | "EVIDENCE_INVALID"
    | "FALSE_PROMOTION"
    | "TRUSTED_PRODUCER_FORBIDDEN"
    | "LOCAL_PROBE_PROMOTED"
    | "PRIVACY_LEAK"
    | "ARTIFACT_DRIFT"
    | "INPUT_DRIFT"
  readonly path: string
  readonly message: string
}

export class RuntimeBudgetCapabilitiesV117Error extends Error {
  readonly findings: readonly RuntimeBudgetCapabilityFindingV117[]

  constructor(findings: readonly RuntimeBudgetCapabilityFindingV117[]) {
    super(
      `Runtime budget capabilities v1.17 failed closed:\n${findings
        .map(({ code, path, message }) => `- ${code} ${path}: ${message}`)
        .join("\n")}`,
    )
    this.name = "RuntimeBudgetCapabilitiesV117Error"
    this.findings = findings
  }
}

interface CapabilityArtifactRowV117 extends CapabilityInputV117 {
  readonly evidenceSafeDigest: `sha256:${string}`
}

interface PinArtifactRowV117 extends PinInputV117 {
  readonly evidenceSafeDigest: `sha256:${string}`
}

export interface RuntimeBudgetCapabilitiesArtifactV117 {
  readonly schemaVersion: "runtime-abi-v1.17-budget-capabilities-v1"
  readonly runtimeAbiVersion: "strategy-runtime-abi-v1.17"
  readonly contractDigest: `sha256:${string}`
  readonly evidenceInputsDigest: `sha256:${string}`
  readonly dimensions: readonly {
    readonly id: RuntimeBudgetCapabilityDimensionV117
    readonly equivalentUnit: string
  }[]
  readonly identityPins: readonly {
    readonly id: RuntimeBudgetCapabilityPinV117
    readonly exactRequirement: string
  }[]
  readonly policy: Readonly<{
    certificationStatus: "uncertified"
    allDimensionsRequiredInOrder: true
    allPinsRequiredInOrder: true
    allPinsMustBeExactDeployment: true
    productionTrustedProducerRequired: true
    localDiagnosticsCanCertify: false
    floatingPinsCanCertify: false
    missingPinsCanCertify: false
    phase259ConformanceRequired: true
    countedEligibleLaneIds: readonly []
    productionTrustedProducers: readonly []
  }>
  readonly lanes: readonly Readonly<{
    laneId: RuntimeBudgetCapabilityLaneV117
    languageId: string
    laneRole: "substrate-only" | "entrant-language"
    entrant: boolean
    certificationStatus: "uncertified"
    countedEligible: false
    certificationReasons: readonly string[]
    capabilities: readonly CapabilityArtifactRowV117[]
    identityPins: readonly PinArtifactRowV117[]
    localProbe: Readonly<{
      disposition: "diagnostic-only"
      evidenceSafeDigest: `sha256:${string}`
    }>
    productionTrustedProducers: readonly []
  }>[]
}

const deriveArtifact = (
  contract: typeof RUNTIME_BUDGET_CAPABILITY_CONTRACT_V1_17,
  evidenceInputs: readonly EvidenceInputV117[],
): RuntimeBudgetCapabilitiesArtifactV117 => ({
  schemaVersion: "runtime-abi-v1.17-budget-capabilities-v1",
  runtimeAbiVersion: "strategy-runtime-abi-v1.17",
  contractDigest: digestValue("runtime-budget-capability-contract", contract),
  evidenceInputsDigest: digestValue(
    "runtime-budget-capability-evidence-inputs",
    evidenceInputs,
  ),
  dimensions: contract.dimensions.map(({ id, equivalentUnit }) => ({
    id,
    equivalentUnit,
  })),
  identityPins: contract.identityPins.map(({ id, exactRequirement }) => ({
    id,
    exactRequirement,
  })),
  policy: {
    ...contract.policy,
    countedEligibleLaneIds: [],
    productionTrustedProducers: [],
  },
  lanes: contract.lanes.map((lane) => {
    const input = evidenceInputs.find(({ laneId }) => laneId === lane.laneId)
    if (input === undefined) {
      throw new RuntimeBudgetCapabilitiesV117Error([
        {
          code: "INPUT_DRIFT",
          path: `evidenceInputs.${lane.laneId}`,
          message: "required lane evidence input is absent",
        },
      ])
    }
    return {
      ...lane,
      certificationStatus: "uncertified" as const,
      countedEligible: false as const,
      certificationReasons: [...input.certificationReasons],
      capabilities: input.capabilities.map((row) => ({
        ...row,
        evidenceSafeDigest: digestValue("runtime-budget-capability-row", {
          laneId: lane.laneId,
          ...row,
        }),
      })),
      identityPins: input.identityPins.map((row) => ({
        ...row,
        evidenceSafeDigest: digestValue("runtime-budget-capability-pin", {
          laneId: lane.laneId,
          ...row,
        }),
      })),
      localProbe: {
        disposition: input.localProbeDisposition,
        evidenceSafeDigest: digestValue(
          "runtime-budget-capability-local-probe",
          {
            laneId: lane.laneId,
            disposition: input.localProbeDisposition,
          },
        ),
      },
      productionTrustedProducers: [],
    }
  }),
})

const finding = (
  code: RuntimeBudgetCapabilityFindingV117["code"],
  path: string,
  message: string,
): RuntimeBudgetCapabilityFindingV117 => ({ code, path, message })

const jsonIdentity = (value: unknown): string | null => {
  try {
    return JSON.stringify(value)
  } catch {
    return null
  }
}

export const buildRuntimeBudgetCapabilitiesV117 = (
  options: Readonly<{
    contract?: unknown
    evidenceInputs?: unknown
  }> = {},
): RuntimeBudgetCapabilitiesArtifactV117 => {
  const contract = options.contract ?? RUNTIME_BUDGET_CAPABILITY_CONTRACT_V1_17
  const evidenceInputs =
    options.evidenceInputs ?? RUNTIME_BUDGET_CAPABILITY_EVIDENCE_INPUTS_V1_17
  const findings: RuntimeBudgetCapabilityFindingV117[] = []
  if (
    jsonIdentity(contract) !==
    jsonIdentity(RUNTIME_BUDGET_CAPABILITY_CONTRACT_V1_17)
  ) {
    findings.push(
      finding(
        "INPUT_DRIFT",
        "contract",
        "contract input must equal the frozen capability contract exactly",
      ),
    )
  }
  if (
    jsonIdentity(evidenceInputs) !==
    jsonIdentity(RUNTIME_BUDGET_CAPABILITY_EVIDENCE_INPUTS_V1_17)
  ) {
    findings.push(
      finding(
        "INPUT_DRIFT",
        "evidenceInputs",
        "evidence inputs must equal the frozen diagnostic producers exactly",
      ),
    )
  }
  if (findings.length > 0) {
    throw new RuntimeBudgetCapabilitiesV117Error(findings)
  }
  return deepFreeze(
    deriveArtifact(
      contract as typeof RUNTIME_BUDGET_CAPABILITY_CONTRACT_V1_17,
      evidenceInputs as readonly EvidenceInputV117[],
    ),
  )
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const exactKeys = (
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean => {
  const actual = Object.keys(value).sort()
  const orderedExpected = [...expected].sort()
  return (
    actual.length === orderedExpected.length &&
    actual.every((key, index) => key === orderedExpected[index])
  )
}

const orderedIds = (value: unknown, key: string): readonly unknown[] | null => {
  if (!Array.isArray(value)) return null
  const ids: unknown[] = []
  for (const entry of value) {
    if (!isRecord(entry)) return null
    ids.push(entry[key])
  }
  return ids
}

const orderedEqual = (
  actual: readonly unknown[] | null,
  expected: readonly string[],
): boolean =>
  actual !== null &&
  actual.length === expected.length &&
  actual.every((value, index) => value === expected[index])

const EVIDENCE_DIGEST_PATTERN = /^sha256:[0-9a-f]{64}$/u
const EXACT_BINDING_FORBIDDEN =
  /(^|[:/._-])(floating|latest|path|local|current|default)([:/._-]|$)/iu
const PRIVACY_PATTERNS = [
  /\/Users\//u,
  /[A-Za-z]:\\Users\\/u,
  /token=/iu,
  /StrategyMemory/u,
  /SoldierMemory/u,
  /objectivePayload/u,
  /raw diagnostics/iu,
  /strategy source bytes/iu,
] as const

const privacyFindings = (
  value: unknown,
  path = "$",
): RuntimeBudgetCapabilityFindingV117[] => {
  if (typeof value === "string") {
    return PRIVACY_PATTERNS.some((pattern) => pattern.test(value))
      ? [finding("PRIVACY_LEAK", path, "private evidence is not public-safe")]
      : []
  }
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) =>
      privacyFindings(entry, `${path}[${index}]`),
    )
  }
  if (isRecord(value)) {
    return Object.entries(value).flatMap(([key, entry]) =>
      privacyFindings(entry, `${path}.${key}`),
    )
  }
  return []
}

export const validateRuntimeBudgetCapabilitiesV117 = (
  value: unknown,
): readonly RuntimeBudgetCapabilityFindingV117[] => {
  if (!isRecord(value)) {
    return [finding("INVALID_ROOT", "$", "artifact must be a strict object")]
  }
  const findings: RuntimeBudgetCapabilityFindingV117[] = []
  if (
    !exactKeys(value, [
      "schemaVersion",
      "runtimeAbiVersion",
      "contractDigest",
      "evidenceInputsDigest",
      "dimensions",
      "identityPins",
      "policy",
      "lanes",
    ])
  ) {
    findings.push(
      finding(
        "STRICT_FIELDS_INVALID",
        "$",
        "top-level fields must be closed and complete",
      ),
    )
  }
  if (
    !orderedEqual(
      orderedIds(value.dimensions, "id"),
      RUNTIME_BUDGET_CAPABILITY_DIMENSIONS_V1_17,
    )
  ) {
    findings.push(
      finding(
        "ORDERED_DIMENSIONS_INVALID",
        "$.dimensions",
        "dimensions must appear once in frozen order",
      ),
    )
  }
  if (
    !orderedEqual(
      orderedIds(value.identityPins, "id"),
      RUNTIME_BUDGET_CAPABILITY_PINS_V1_17,
    )
  ) {
    findings.push(
      finding(
        "ORDERED_PINS_INVALID",
        "$.identityPins",
        "identity pins must appear once in frozen order",
      ),
    )
  }
  if (
    !orderedEqual(
      orderedIds(value.lanes, "laneId"),
      RUNTIME_BUDGET_CAPABILITY_LANES_V1_17,
    )
  ) {
    findings.push(
      finding(
        "ORDERED_LANES_INVALID",
        "$.lanes",
        "lanes must appear once in frozen order",
      ),
    )
  }

  const policy = value.policy
  if (
    !isRecord(policy) ||
    !exactKeys(policy, [
      "certificationStatus",
      "allDimensionsRequiredInOrder",
      "allPinsRequiredInOrder",
      "allPinsMustBeExactDeployment",
      "productionTrustedProducerRequired",
      "localDiagnosticsCanCertify",
      "floatingPinsCanCertify",
      "missingPinsCanCertify",
      "phase259ConformanceRequired",
      "countedEligibleLaneIds",
      "productionTrustedProducers",
    ])
  ) {
    findings.push(
      finding(
        "STRICT_FIELDS_INVALID",
        "$.policy",
        "policy fields must be closed and complete",
      ),
    )
  } else {
    if (
      policy.certificationStatus !== "uncertified" ||
      !Array.isArray(policy.countedEligibleLaneIds) ||
      policy.countedEligibleLaneIds.length !== 0
    ) {
      findings.push(
        finding(
          "FALSE_PROMOTION",
          "$.policy",
          "Plan 258-12 cannot certify or count a lane",
        ),
      )
    }
    if (
      !Array.isArray(policy.productionTrustedProducers) ||
      policy.productionTrustedProducers.length !== 0
    ) {
      findings.push(
        finding(
          "TRUSTED_PRODUCER_FORBIDDEN",
          "$.policy.productionTrustedProducers",
          "production trusted producers remain empty until Phase 259",
        ),
      )
    }
  }

  if (Array.isArray(value.lanes)) {
    for (const [laneIndex, lane] of value.lanes.entries()) {
      const lanePath = `$.lanes[${laneIndex}]`
      if (!isRecord(lane)) {
        findings.push(
          finding("STRICT_FIELDS_INVALID", lanePath, "lane must be an object"),
        )
        continue
      }
      if (
        !exactKeys(lane, [
          "laneId",
          "languageId",
          "laneRole",
          "entrant",
          "certificationStatus",
          "countedEligible",
          "certificationReasons",
          "capabilities",
          "identityPins",
          "localProbe",
          "productionTrustedProducers",
        ])
      ) {
        findings.push(
          finding(
            "STRICT_FIELDS_INVALID",
            lanePath,
            "lane fields must be closed and complete",
          ),
        )
      }
      if (
        lane.certificationStatus !== "uncertified" ||
        lane.countedEligible !== false
      ) {
        findings.push(
          finding(
            "FALSE_PROMOTION",
            lanePath,
            "every lane must remain explicitly uncertified and uncounted",
          ),
        )
      }
      if (
        !Array.isArray(lane.certificationReasons) ||
        lane.certificationReasons.length === 0 ||
        lane.certificationReasons.some(
          (reason) => typeof reason !== "string" || reason.length === 0,
        )
      ) {
        findings.push(
          finding(
            "EVIDENCE_INVALID",
            `${lanePath}.certificationReasons`,
            "uncertified posture requires non-empty public-safe reasons",
          ),
        )
      }
      if (
        !Array.isArray(lane.productionTrustedProducers) ||
        lane.productionTrustedProducers.length !== 0
      ) {
        findings.push(
          finding(
            "TRUSTED_PRODUCER_FORBIDDEN",
            `${lanePath}.productionTrustedProducers`,
            "lane producer authority remains empty until Phase 259",
          ),
        )
      }
      const localProbe = lane.localProbe
      if (
        !isRecord(localProbe) ||
        !exactKeys(localProbe, ["disposition", "evidenceSafeDigest"]) ||
        localProbe.disposition !== "diagnostic-only" ||
        typeof localProbe.evidenceSafeDigest !== "string" ||
        !EVIDENCE_DIGEST_PATTERN.test(localProbe.evidenceSafeDigest)
      ) {
        findings.push(
          finding(
            "LOCAL_PROBE_PROMOTED",
            `${lanePath}.localProbe`,
            "local probes must remain digest-only diagnostics",
          ),
        )
      }

      if (
        !orderedEqual(
          orderedIds(lane.capabilities, "dimension"),
          RUNTIME_BUDGET_CAPABILITY_DIMENSIONS_V1_17,
        )
      ) {
        findings.push(
          finding(
            "CAPABILITY_ROWS_INVALID",
            `${lanePath}.capabilities`,
            "each lane requires all ten capability rows in frozen order",
          ),
        )
      }
      if (Array.isArray(lane.capabilities)) {
        for (const [rowIndex, row] of lane.capabilities.entries()) {
          const rowPath = `${lanePath}.capabilities[${rowIndex}]`
          if (
            !isRecord(row) ||
            !exactKeys(row, [
              "dimension",
              "unit",
              "scope",
              "measurement",
              "enforcement",
              "status",
              "evidenceSafeDigest",
            ])
          ) {
            findings.push(
              finding(
                "STRICT_FIELDS_INVALID",
                rowPath,
                "capability row fields must be closed and complete",
              ),
            )
            continue
          }
          if (
            typeof row.unit !== "string" ||
            row.unit.length === 0 ||
            typeof row.scope !== "string" ||
            row.scope.length === 0 ||
            typeof row.measurement !== "string" ||
            row.measurement.length === 0 ||
            typeof row.enforcement !== "string" ||
            row.enforcement.length === 0 ||
            typeof row.evidenceSafeDigest !== "string" ||
            !EVIDENCE_DIGEST_PATTERN.test(row.evidenceSafeDigest)
          ) {
            findings.push(
              finding(
                "EVIDENCE_INVALID",
                rowPath,
                "unit, scope, measurement, enforcement and digest are required",
              ),
            )
          }
          if (
            !["equivalent-enforced", "diagnostic-only", "unsupported"].includes(
              String(row.status),
            )
          ) {
            findings.push(
              finding(
                "CAPABILITY_ROWS_INVALID",
                `${rowPath}.status`,
                "capability status is not registered",
              ),
            )
          }
          const definition = DIMENSION_DEFINITIONS[rowIndex]
          if (
            row.status === "equivalent-enforced" &&
            row.unit !== definition?.equivalentUnit
          ) {
            findings.push(
              finding(
                "FALSE_PROMOTION",
                rowPath,
                "an incomparable unit cannot claim equivalent enforcement",
              ),
            )
          }
        }
      }

      if (
        !orderedEqual(
          orderedIds(lane.identityPins, "pin"),
          RUNTIME_BUDGET_CAPABILITY_PINS_V1_17,
        )
      ) {
        findings.push(
          finding(
            "PIN_ROWS_INVALID",
            `${lanePath}.identityPins`,
            "each lane requires all ten pin rows in frozen order",
          ),
        )
      }
      if (Array.isArray(lane.identityPins)) {
        for (const [pinIndex, row] of lane.identityPins.entries()) {
          const rowPath = `${lanePath}.identityPins[${pinIndex}]`
          if (
            !isRecord(row) ||
            !exactKeys(row, [
              "pin",
              "status",
              "bindingSafeId",
              "evidenceSafeDigest",
            ])
          ) {
            findings.push(
              finding(
                "STRICT_FIELDS_INVALID",
                rowPath,
                "pin row fields must be closed and complete",
              ),
            )
            continue
          }
          if (
            ![
              "exact-deployment",
              "local-diagnostic",
              "floating",
              "missing",
            ].includes(String(row.status)) ||
            typeof row.evidenceSafeDigest !== "string" ||
            !EVIDENCE_DIGEST_PATTERN.test(row.evidenceSafeDigest)
          ) {
            findings.push(
              finding(
                "PIN_ROWS_INVALID",
                rowPath,
                "pin status and evidence-safe digest must be registered",
              ),
            )
          }
          if (
            (row.status === "missing" && row.bindingSafeId !== null) ||
            (row.status !== "missing" &&
              (typeof row.bindingSafeId !== "string" ||
                row.bindingSafeId.length === 0))
          ) {
            findings.push(
              finding(
                "PIN_ROWS_INVALID",
                rowPath,
                "pin binding must agree with its exact/local/floating/missing status",
              ),
            )
          }
          if (
            row.status === "exact-deployment" &&
            typeof row.bindingSafeId === "string" &&
            EXACT_BINDING_FORBIDDEN.test(row.bindingSafeId)
          ) {
            findings.push(
              finding(
                "FALSE_PROMOTION",
                rowPath,
                "floating, latest, PATH, local, current or default cannot be exact",
              ),
            )
          }
        }
      }
    }
  }

  findings.push(...privacyFindings(value))
  if (jsonIdentity(value) !== jsonIdentity(RUNTIME_BUDGET_CAPABILITIES_V1_17)) {
    findings.push(
      finding(
        "ARTIFACT_DRIFT",
        "$",
        "artifact must equal the contract-derived evidence byte-for-byte",
      ),
    )
  }
  return findings
}

export function assertRuntimeBudgetCapabilitiesV117(
  value: unknown,
): asserts value is RuntimeBudgetCapabilitiesArtifactV117 {
  const findings = validateRuntimeBudgetCapabilitiesV117(value)
  if (findings.length > 0) {
    throw new RuntimeBudgetCapabilitiesV117Error(findings)
  }
}

export const renderRuntimeBudgetCapabilitiesV117 = (
  value: unknown = RUNTIME_BUDGET_CAPABILITIES_V1_17,
): string => {
  assertRuntimeBudgetCapabilitiesV117(value)
  return `${JSON.stringify(value, null, 2)}\n`
}

export const RUNTIME_BUDGET_CAPABILITIES_V1_17 =
  buildRuntimeBudgetCapabilitiesV117()
