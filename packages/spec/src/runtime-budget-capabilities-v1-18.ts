import {
  RUNTIME_BUDGET_PROFILE_V1_18,
  RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
} from "./runtime-budget-profile-v1-18.js"

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
    Object.freeze(value)
  }
  return value
}

export const RUNTIME_BUDGET_CAPABILITY_LANES_V1_18 = Object.freeze([
  "typescript",
  "python",
  "rust",
  "zig",
] as const)

export const RUNTIME_BUDGET_CAPABILITY_DIMENSIONS_V1_18 = Object.freeze([
  "wall",
  "compute",
  "memory",
  "pids",
  "bytes",
  "cancellation",
  "containment",
  "identity",
] as const)

export const RUNTIME_BUDGET_CAPABILITY_IDENTITY_PINS_V1_18 = Object.freeze([
  "supervisorBinarySha256",
  "supervisorToolchainSha256",
  "linuxKernelSha256",
  "dockerEngineSha256",
  "dockerImageDigest",
  "cgroupDelegationSha256",
  "adapterBuildSha256",
  "runtimeCompilerSha256",
  "artifactSha256",
  "budgetProfileSha256",
] as const)

export type RuntimeBudgetCapabilityLaneV118 =
  (typeof RUNTIME_BUDGET_CAPABILITY_LANES_V1_18)[number]
export type RuntimeBudgetCapabilityDimensionV118 =
  (typeof RUNTIME_BUDGET_CAPABILITY_DIMENSIONS_V1_18)[number]
export type RuntimeBudgetCapabilityIdentityPinV118 =
  (typeof RUNTIME_BUDGET_CAPABILITY_IDENTITY_PINS_V1_18)[number]

export const RUNTIME_BUDGET_CAPABILITY_CONTRACT_V1_18 = deepFreeze({
  schemaVersion: "runtime-budget-capability-contract-v1.18",
  runtimeAbiVersion: "strategy-runtime-abi-v1.18",
  additiveFromRuntimeAbiVersion: "strategy-runtime-abi-v1.17",
  budgetProfileSha256: RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
  soleCountedPlatform: "linux-cgroup-v2-cgroupfs",
  lanes: RUNTIME_BUDGET_CAPABILITY_LANES_V1_18,
  dimensions: RUNTIME_BUDGET_CAPABILITY_DIMENSIONS_V1_18,
  identityPins: RUNTIME_BUDGET_CAPABILITY_IDENTITY_PINS_V1_18,
  policy: {
    everyDimensionRequired: true,
    everyIdentityPinRequired: true,
    missingOrAmbiguousEvidence: "system-failure-no-mutation",
    nativeMacos: "proof-only-non-counted",
    wasmtimeFuel: "defense-in-depth-positive-attribution-only",
    wasmtimeLinearMemory: "defense-in-depth-positive-attribution-only",
    wasmtimeCanSubstituteForCommonMeter: false,
    documentationCanCertify: false,
    gateNameCanCertify: false,
    certificateRequiredForCountedEligibility: true,
  },
  allFourLanesMandatoryForPhaseClosure: true,
} as const)

interface RuntimeBudgetMeterEvidenceV118 {
  source: string
  unit: string
  complete: boolean
}

export interface RuntimeBudgetCapabilityEvidenceV118 {
  laneId: RuntimeBudgetCapabilityLaneV118
  budgetProfileSha256: `sha256:${string}`
  platform: {
    operatingSystem: string
    cgroupVersion: number
    cgroupDriver: string
    delegatedControllers: string[]
  }
  meters: {
    wall: RuntimeBudgetMeterEvidenceV118
    compute: RuntimeBudgetMeterEvidenceV118
    memory: RuntimeBudgetMeterEvidenceV118
    pids: RuntimeBudgetMeterEvidenceV118
    bytes: RuntimeBudgetMeterEvidenceV118
    cancellation: RuntimeBudgetMeterEvidenceV118
  }
  containment: {
    delegated: boolean
    settingsApplied: boolean
    noCgroupEscape: boolean
    emptyAfterReap: boolean
    cleanupVerified: boolean
  }
  identityPins: Record<
    RuntimeBudgetCapabilityIdentityPinV118,
    `sha256:${string}`
  >
  wasmtimeDefenseInDepth: {
    fuelObserved: boolean
    linearMemoryObserved: boolean
    usedAsCommonQuantitativeMeter: boolean
  } | null
}

export type RuntimeBudgetCapabilitySystemFailureCodeV118 =
  | "EVIDENCE_SHAPE_INVALID"
  | "BUDGET_PROFILE_MISMATCH"
  | "COUNTED_PLATFORM_UNAVAILABLE"
  | "CONTROLLERS_UNAVAILABLE"
  | "DELEGATION_UNAVAILABLE"
  | "COMMON_METER_INCOMPLETE"
  | "CONTAINMENT_INCOMPLETE"
  | "IDENTITY_INCOMPLETE"
  | "DEFENSE_IN_DEPTH_INCOMPLETE"
  | "WASMTIME_METER_SUBSTITUTION"

export type RuntimeBudgetCapabilityLaneSnapshotV118 =
  | Readonly<{
      kind: "certificate_candidate"
      laneId: RuntimeBudgetCapabilityLaneV118
      supervisorEligible: true
      certificateEligible: true
      countedEligible: false
      safeCode: "CONFORMANCE_CERTIFICATE_REQUIRED"
      budgetProfileSha256: typeof RUNTIME_BUDGET_PROFILE_V1_18_SHA256
    }>
  | Readonly<{
      kind: "counted_current"
      laneId: RuntimeBudgetCapabilityLaneV118
      supervisorEligible: true
      certificateEligible: true
      countedEligible: true
      safeCode: "CONFORMANCE_CERTIFICATE_CURRENT"
      budgetProfileSha256: typeof RUNTIME_BUDGET_PROFILE_V1_18_SHA256
      certificateId: string
      certificateSha256: `sha256:${string}`
      authorityGeneration: string
    }>
  | Readonly<{
      kind: "system_failure"
      laneId: RuntimeBudgetCapabilityLaneV118
      supervisorEligible: false
      certificateEligible: false
      countedEligible: false
      gameplayDisposition: "no_mutation"
      code: RuntimeBudgetCapabilitySystemFailureCodeV118
    }>

const snapshotAuthority = new WeakSet<object>()

const registerSnapshot = <T extends RuntimeBudgetCapabilityLaneSnapshotV118>(
  snapshot: T,
): T => {
  const frozen = deepFreeze(snapshot) as T
  snapshotAuthority.add(frozen)
  return frozen
}

const laneFromUnknown = (value: unknown): RuntimeBudgetCapabilityLaneV118 => {
  if (
    value !== null &&
    typeof value === "object" &&
    "laneId" in value &&
    RUNTIME_BUDGET_CAPABILITY_LANES_V1_18.includes(
      (value as { laneId: RuntimeBudgetCapabilityLaneV118 }).laneId,
    )
  ) {
    return (value as { laneId: RuntimeBudgetCapabilityLaneV118 }).laneId
  }
  return "typescript"
}

const failure = (
  laneId: RuntimeBudgetCapabilityLaneV118,
  code: RuntimeBudgetCapabilitySystemFailureCodeV118,
): RuntimeBudgetCapabilityLaneSnapshotV118 =>
  registerSnapshot({
    kind: "system_failure",
    laneId,
    supervisorEligible: false,
    certificateEligible: false,
    countedEligible: false,
    gameplayDisposition: "no_mutation",
    code,
  })

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const exactKeys = (
  value: unknown,
  expected: readonly string[],
): value is Record<string, unknown> =>
  isRecord(value) &&
  Object.keys(value).length === expected.length &&
  expected.every((key) => Object.hasOwn(value, key))

const SHA256 = /^sha256:[0-9a-f]{64}$/u

const evidenceShapeIsClosed = (
  value: unknown,
): value is RuntimeBudgetCapabilityEvidenceV118 => {
  if (
    !exactKeys(value, [
      "laneId",
      "budgetProfileSha256",
      "platform",
      "meters",
      "containment",
      "identityPins",
      "wasmtimeDefenseInDepth",
    ]) ||
    !RUNTIME_BUDGET_CAPABILITY_LANES_V1_18.includes(
      value.laneId as RuntimeBudgetCapabilityLaneV118,
    ) ||
    !exactKeys(value.platform, [
      "operatingSystem",
      "cgroupVersion",
      "cgroupDriver",
      "delegatedControllers",
    ]) ||
    !Array.isArray(value.platform.delegatedControllers) ||
    !exactKeys(value.meters, [
      "wall",
      "compute",
      "memory",
      "pids",
      "bytes",
      "cancellation",
    ]) ||
    !exactKeys(value.containment, [
      "delegated",
      "settingsApplied",
      "noCgroupEscape",
      "emptyAfterReap",
      "cleanupVerified",
    ]) ||
    !exactKeys(
      value.identityPins,
      RUNTIME_BUDGET_CAPABILITY_IDENTITY_PINS_V1_18,
    )
  ) {
    return false
  }
  for (const meter of Object.values(value.meters)) {
    if (
      !exactKeys(meter, ["source", "unit", "complete"]) ||
      typeof meter.source !== "string" ||
      typeof meter.unit !== "string" ||
      typeof meter.complete !== "boolean"
    ) {
      return false
    }
  }
  if (
    Object.values(value.containment).some(
      (entry) => typeof entry !== "boolean",
    )
  ) {
    return false
  }
  const defense = value.wasmtimeDefenseInDepth
  return (
    defense === null ||
    (exactKeys(defense, [
      "fuelObserved",
      "linearMemoryObserved",
      "usedAsCommonQuantitativeMeter",
    ]) &&
      Object.values(defense).every((entry) => typeof entry === "boolean"))
  )
}

const exactControllers = (controllers: readonly string[]): boolean =>
  controllers.length ===
    RUNTIME_BUDGET_PROFILE_V1_18.countedPlatform.delegatedControllers.length &&
  controllers.every(
    (controller, index) =>
      controller ===
      RUNTIME_BUDGET_PROFILE_V1_18.countedPlatform.delegatedControllers[index],
  )

const meterDefinitions = {
  wall: {
    source: "monotonic-elapsed-nanoseconds",
    unit: "ceil-milliseconds",
  },
  compute: {
    source: "cgroup-v2-cpu.stat-usage_usec-times-1000",
    unit: "aggregate-cpu-nanoseconds",
  },
  memory: {
    source: "cgroup-v2-memory.peak-and-memory.events",
    unit: "bytes-and-nondecreasing-events",
  },
  pids: {
    source: "cgroup-v2-pids.current-and-pids.events",
    unit: "kernel-tasks-and-nondecreasing-events",
  },
  bytes: {
    source: "raw-request-write-and-capture-boundaries",
    unit: "exact-bytes",
  },
  cancellation: {
    source: "process-group-plus-cgroup.kill",
    unit: "empty-cgroup-receipt",
  },
} as const

const commonMetersComplete = (
  evidence: RuntimeBudgetCapabilityEvidenceV118,
): boolean =>
  (Object.keys(meterDefinitions) as Array<keyof typeof meterDefinitions>).every(
    (dimension) => {
      const meter = evidence.meters[dimension]
      const definition = meterDefinitions[dimension]
      return (
        meter.complete &&
        meter.source === definition.source &&
        meter.unit === definition.unit
      )
    },
  )

const identityPinsComplete = (
  evidence: RuntimeBudgetCapabilityEvidenceV118,
): boolean =>
  RUNTIME_BUDGET_CAPABILITY_IDENTITY_PINS_V1_18.every((pin) => {
    const value = evidence.identityPins[pin]
    return (
      typeof value === "string" &&
      SHA256.test(value) &&
      (pin !== "budgetProfileSha256" ||
        value === RUNTIME_BUDGET_PROFILE_V1_18_SHA256)
    )
  })

export const evaluateRuntimeBudgetCapabilityV118 = (
  evidenceInput: RuntimeBudgetCapabilityEvidenceV118,
): RuntimeBudgetCapabilityLaneSnapshotV118 => {
  const laneId = laneFromUnknown(evidenceInput)
  if (!evidenceShapeIsClosed(evidenceInput)) {
    return failure(laneId, "EVIDENCE_SHAPE_INVALID")
  }
  const evidence = evidenceInput
  if (
    evidence.budgetProfileSha256 !== RUNTIME_BUDGET_PROFILE_V1_18_SHA256
  ) {
    return failure(laneId, "BUDGET_PROFILE_MISMATCH")
  }
  if (
    evidence.platform.operatingSystem !== "linux" ||
    evidence.platform.cgroupVersion !== 2 ||
    evidence.platform.cgroupDriver !== "cgroupfs"
  ) {
    return failure(laneId, "COUNTED_PLATFORM_UNAVAILABLE")
  }
  if (!exactControllers(evidence.platform.delegatedControllers)) {
    return failure(laneId, "CONTROLLERS_UNAVAILABLE")
  }
  if (!evidence.containment.delegated || !evidence.containment.settingsApplied) {
    return failure(laneId, "DELEGATION_UNAVAILABLE")
  }
  if (!commonMetersComplete(evidence)) {
    return failure(laneId, "COMMON_METER_INCOMPLETE")
  }
  if (
    !evidence.containment.noCgroupEscape ||
    !evidence.containment.emptyAfterReap ||
    !evidence.containment.cleanupVerified
  ) {
    return failure(laneId, "CONTAINMENT_INCOMPLETE")
  }
  if (!identityPinsComplete(evidence)) {
    return failure(laneId, "IDENTITY_INCOMPLETE")
  }
  const isWasmtime = laneId === "rust" || laneId === "zig"
  if (isWasmtime) {
    if (
      evidence.wasmtimeDefenseInDepth === null ||
      !evidence.wasmtimeDefenseInDepth.fuelObserved ||
      !evidence.wasmtimeDefenseInDepth.linearMemoryObserved
    ) {
      return failure(laneId, "DEFENSE_IN_DEPTH_INCOMPLETE")
    }
    if (
      evidence.wasmtimeDefenseInDepth.usedAsCommonQuantitativeMeter
    ) {
      return failure(laneId, "WASMTIME_METER_SUBSTITUTION")
    }
  } else if (evidence.wasmtimeDefenseInDepth !== null) {
    return failure(laneId, "EVIDENCE_SHAPE_INVALID")
  }
  return registerSnapshot({
    kind: "certificate_candidate",
    laneId,
    supervisorEligible: true,
    certificateEligible: true,
    countedEligible: false,
    safeCode: "CONFORMANCE_CERTIFICATE_REQUIRED",
    budgetProfileSha256: RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
  })
}

/**
 * Plan 24 deliberately cannot promote a lane. Plan 22 will admit exact verified
 * certificate snapshots into this same predicate; candidate declarations and
 * cloned objects are rejected by the verifier-known snapshot boundary.
 */
export const requireAllFourConformanceLanesV118 = (
  snapshots: readonly RuntimeBudgetCapabilityLaneSnapshotV118[],
): boolean => {
  if (
    snapshots.length !== RUNTIME_BUDGET_CAPABILITY_LANES_V1_18.length ||
    snapshots.some(
      (snapshot) =>
        !snapshotAuthority.has(snapshot) || snapshot.countedEligible !== true,
    )
  ) {
    return false
  }
  const lanes = snapshots.map(({ laneId }) => laneId)
  return RUNTIME_BUDGET_CAPABILITY_LANES_V1_18.every(
    (laneId, index) => lanes[index] === laneId,
  )
}
