import { Buffer } from "node:buffer"
import {
  createHash,
  createPublicKey,
  verify as verifySignature,
  type KeyObject,
} from "node:crypto"
import path from "node:path"
import {
  RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
  SoldierBrainResultV117Schema,
  StrategyResultV117Schema,
  admitCanonicalJsonBytes,
  encodeCanonicalJson,
  evaluateRuntimeBudgetCapabilityV118,
  type JsonValue,
  type RuntimeBudgetCapabilityLaneSnapshotV118,
  type RuntimeInvocationRequestV118,
} from "@cowards/spec"
import {
  createSupervisorInvocationRequestV118,
  deriveSupervisorExecutionIdentityV118,
  isVerifiedSupervisorEvidenceV118,
  verifySupervisorRawReceiptV118,
  type SupervisorExecutionDescriptorV118,
  type SupervisorInvocationRequestV118,
  type SupervisorObservedOutputV118,
  type SupervisorVerificationFailureCodeV118,
  type VerifiedSupervisorEvidenceV118,
} from "@cowards/runtime-supervisor"

const SHA256 = /^sha256:[0-9a-f]{64}$/u
const PUBLIC_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/u
const VERSION_TEXT = /^[A-Za-z0-9][A-Za-z0-9._+(): /-]{0,511}$/u

export type CountedWasmWasiLaneV118 = "rust" | "zig"

export const COUNTED_WASM_WASI_RUNTIMES_V1_18 = Object.freeze([
  Object.freeze({
    schemaVersion: "counted-runtime-lane-v1.18",
    runtimeAbiVersion: "strategy-runtime-abi-v1.18",
    laneId: "rust",
    selectorId: "rust-wasmtime-native-supervised-v1.18",
    executionBoundary: "native-linux-cgroup-v2-supervisor",
    directExecutionAllowed: false,
    containerOnlyFallbackAllowed: false,
    priorDiagnosticAbi: "strategy-runtime-abi-v1.17",
  }),
  Object.freeze({
    schemaVersion: "counted-runtime-lane-v1.18",
    runtimeAbiVersion: "strategy-runtime-abi-v1.18",
    laneId: "zig",
    selectorId: "zig-wasmtime-native-supervised-v1.18",
    executionBoundary: "native-linux-cgroup-v2-supervisor",
    directExecutionAllowed: false,
    containerOnlyFallbackAllowed: false,
    priorDiagnosticAbi: "strategy-runtime-abi-v1.17",
  }),
] as const)

/**
 * These are Wasmtime-local defense-in-depth units. They are intentionally
 * distinct from the common v1.18 cgroup compute and memory observations.
 */
export const WASM_WASI_LOCAL_DEFENSE_LIMITS_V1_18 = Object.freeze({
  schemaVersion: "wasmtime-local-defense-limits-v1.18",
  fuel: Object.freeze({
    maximum: 25_000_000,
    unit: "wasmtime-fuel-units",
  }),
  linearMemory: Object.freeze({
    maximumBytes: 64 * 1024 * 1024,
    unit: "wasm-linear-memory-bytes",
  }),
  wasmStackBytes: 1_048_576,
  trapOnGrowFailure: true,
  usedAsCommonQuantitativeMeter: false,
} as const)

const canonicalBytes = (
  value: JsonValue,
  context: "canonical-manifest" | "authenticated-outer-envelope",
): Uint8Array => {
  const encoded = encodeCanonicalJson(value, { context })
  if (!encoded.ok) throw new TypeError("WASM/WASI evidence is not canonical")
  return encoded.bytes
}

const sha256 = (bytes: Uint8Array): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`

const hashManifest = (value: JsonValue): `sha256:${string}` =>
  sha256(canonicalBytes(value, "canonical-manifest"))

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
    Object.freeze(value)
  }
  return value
}

const hasExactKeys = (
  value: unknown,
  expected: readonly string[],
): value is Record<string, unknown> =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.keys(value).length === expected.length &&
  expected.every((key) => Object.hasOwn(value, key))

const compilerLaneByIdentity = new Map<string, CountedWasmWasiLaneV118>()

export const createWasmWasiRuntimeCompilerIdentityV118 = (input: {
  readonly languageId: CountedWasmWasiLaneV118
  readonly compilerExecutableSha256: `sha256:${string}`
  readonly compilerVersion: string
  readonly targetTriple: "wasm32-wasip1" | "wasm32-wasi"
  readonly flagsSha256: `sha256:${string}`
  readonly sysrootSha256: `sha256:${string}`
  readonly wasmtimeExecutableSha256: `sha256:${string}`
  readonly wasmtimeVersion: string
}): `sha256:${string}` => {
  const expectedTarget =
    input.languageId === "rust" ? "wasm32-wasip1" : "wasm32-wasi"
  if (
    input.targetTriple !== expectedTarget ||
    !SHA256.test(input.compilerExecutableSha256) ||
    !SHA256.test(input.flagsSha256) ||
    !SHA256.test(input.sysrootSha256) ||
    !SHA256.test(input.wasmtimeExecutableSha256) ||
    !VERSION_TEXT.test(input.compilerVersion) ||
    !VERSION_TEXT.test(input.wasmtimeVersion)
  ) {
    throw new TypeError("WASM/WASI runtime compiler identity is invalid")
  }
  const identity = hashManifest({
    identityDomain: "cowards-game:wasm-wasi-runtime-compiler-identity:v1.18",
    languageId: input.languageId,
    compilerExecutableSha256: input.compilerExecutableSha256,
    compilerVersion: input.compilerVersion,
    targetTriple: input.targetTriple,
    flagsSha256: input.flagsSha256,
    sysrootSha256: input.sysrootSha256,
    wasmtimeExecutableSha256: input.wasmtimeExecutableSha256,
    wasmtimeVersion: input.wasmtimeVersion,
  })
  compilerLaneByIdentity.set(identity, input.languageId)
  return identity
}

export const createWasmWasiAdapterBuildIdentityV118 = (input: {
  readonly adapterModuleSha256: `sha256:${string}`
  readonly legacyAdapterSha256: `sha256:${string}`
  readonly supervisorContractSha256: `sha256:${string}`
}): `sha256:${string}` => {
  if (
    !SHA256.test(input.adapterModuleSha256) ||
    !SHA256.test(input.legacyAdapterSha256) ||
    !SHA256.test(input.supervisorContractSha256)
  ) {
    throw new TypeError("WASM/WASI adapter build identity is invalid")
  }
  return hashManifest({
    identityDomain: "cowards-game:wasm-wasi-supervised-adapter-build:v1.18",
    adapterModuleSha256: input.adapterModuleSha256,
    legacyAdapterSha256: input.legacyAdapterSha256,
    supervisorContractSha256: input.supervisorContractSha256,
  })
}

export const createWasmWasiManifestRootV118 = (input: {
  readonly languageId: CountedWasmWasiLaneV118
  readonly sourceOriginalSha256: `sha256:${string}`
  readonly sourceNormalizedSha256: `sha256:${string}`
  readonly runtimeCompilerSha256: `sha256:${string}`
  readonly adapterBuildSha256: `sha256:${string}`
  readonly artifactSha256: `sha256:${string}`
}): `sha256:${string}` => {
  if (
    compilerLaneByIdentity.get(input.runtimeCompilerSha256) !==
      input.languageId ||
    !SHA256.test(input.sourceOriginalSha256) ||
    !SHA256.test(input.sourceNormalizedSha256) ||
    !SHA256.test(input.adapterBuildSha256) ||
    !SHA256.test(input.artifactSha256)
  ) {
    throw new TypeError("WASM/WASI manifest lane or identity is invalid")
  }
  return hashManifest({
    identityDomain: "cowards-game:wasm-wasi-lane-manifest:v1.18",
    ...input,
  })
}

export interface WasmWasiLanguageIdentityObservationV118 {
  readonly languageId: CountedWasmWasiLaneV118
  readonly sourceOriginalSha256: `sha256:${string}`
  readonly sourceNormalizedSha256: `sha256:${string}`
  readonly compilerExecutableSha256: `sha256:${string}`
  readonly compilerVersion: string
  readonly targetTriple: "wasm32-wasip1" | "wasm32-wasi"
  readonly flagsSha256: `sha256:${string}`
  readonly sysrootSha256: `sha256:${string}`
  readonly wasmtimeExecutableSha256: `sha256:${string}`
  readonly wasmtimeVersion: string
  readonly adapterModuleSha256: `sha256:${string}`
  readonly legacyAdapterSha256: `sha256:${string}`
  readonly supervisorContractSha256: `sha256:${string}`
  readonly artifactSha256: `sha256:${string}`
  readonly manifestRootSha256: `sha256:${string}`
}

export interface WasmWasiLocalDefenseObservationV118 {
  readonly schemaVersion: "wasmtime-local-defense-observation-v1.18"
  readonly runtimeExecutableSha256: `sha256:${string}`
  readonly artifactSha256: `sha256:${string}`
  readonly fuel: Readonly<{
    configuredMaximum: number
    unit: "wasmtime-fuel-units"
    enabled: boolean
    exhausted: boolean
  }>
  readonly linearMemory: Readonly<{
    configuredMaximumBytes: number
    unit: "wasm-linear-memory-bytes"
    enabled: boolean
    exhausted: boolean
  }>
  readonly wasmStackBytes: number
  readonly trapOnGrowFailure: boolean
  readonly trapKind:
    | "none"
    | "fuel_exhausted"
    | "linear_memory_exhausted"
    | "other"
  readonly usedAsCommonQuantitativeMeter: boolean
}

export interface WasmWasiSupervisorHostLaunchResultV118 {
  readonly rawReceiptBytes: Uint8Array
  readonly observed: SupervisorObservedOutputV118
  readonly languageIdentity: WasmWasiLanguageIdentityObservationV118
  readonly localDefense: WasmWasiLocalDefenseObservationV118
}

export type WasmWasiSupervisorHostLaunchV118 = (
  request: SupervisorInvocationRequestV118,
) => WasmWasiSupervisorHostLaunchResultV118

export interface WasmWasiRuntimeEvidenceSignatureV118 {
  readonly algorithm: "Ed25519"
  readonly keyId: string
  readonly signatureBase64: string
}

export interface WasmWasiSignedEvidenceV118 {
  readonly schemaVersion: "runtime-language-evidence-signature-v1.18"
  readonly evidence: Readonly<{
    schemaVersion: "runtime-language-quantitative-evidence-v1.18"
    runtimeAbiVersion: "strategy-runtime-abi-v1.18"
    laneId: CountedWasmWasiLaneV118
    supervisorRequestSha256: `sha256:${string}`
    invocationRequestSha256: `sha256:${string}`
    rawReceiptSha256: `sha256:${string}`
    commonMeter: Readonly<{
      observed: VerifiedSupervisorEvidenceV118["observed"]
      result: VerifiedSupervisorEvidenceV118["result"]
    }>
    localDefense: WasmWasiLocalDefenseObservationV118
    identityPins: Readonly<{
      supervisorBinarySha256: `sha256:${string}`
      supervisorToolchainSha256: `sha256:${string}`
      linuxKernelSha256: `sha256:${string}`
      dockerEngineSha256: `sha256:${string}`
      dockerImageDigest: `sha256:${string}`
      cgroupDelegationSha256: `sha256:${string}`
      adapterBuildSha256: `sha256:${string}`
      runtimeCompilerSha256: `sha256:${string}`
      artifactSha256: `sha256:${string}`
      budgetProfileSha256: typeof RUNTIME_BUDGET_PROFILE_V1_18_SHA256
      laneManifestSha256: `sha256:${string}`
    }>
    capability: Readonly<{
      kind: "certificate_candidate"
      safeCode: "CONFORMANCE_CERTIFICATE_REQUIRED"
      countedEligible: false
    }>
  }>
  readonly evidenceSha256: `sha256:${string}`
  readonly signature: WasmWasiRuntimeEvidenceSignatureV118
}

export type CountedWasmWasiSupervisedResultV118 =
  | Readonly<{
      kind: "success"
      gameplayDisposition: "accept_success"
      payloadBytes: Uint8Array
      capability: RuntimeBudgetCapabilityLaneSnapshotV118
      signedEvidence: WasmWasiSignedEvidenceV118
    }>
  | Readonly<{
      kind: "player_violation"
      gameplayDisposition: "apply_player_violation"
      code: "RESOURCE_EXHAUSTION"
      dimensions: readonly string[]
      capability: RuntimeBudgetCapabilityLaneSnapshotV118
      signedEvidence: WasmWasiSignedEvidenceV118
    }>
  | Readonly<{
      kind: "system_failure"
      gameplayDisposition: "no_mutation"
      code:
        | SupervisorVerificationFailureCodeV118
        | "LANGUAGE_IDENTITY_MISMATCH"
        | "WASMTIME_EXECUTION_INVALID"
        | "WASMTIME_DEFENSE_INCOMPLETE"
        | "WASMTIME_METER_SUBSTITUTION"
        | "WASMTIME_TRAP_UNRESOLVED"
        | "SUPERVISOR_LAUNCH_FAILED"
        | "GUEST_PAYLOAD_INVALID"
        | "EVIDENCE_SIGNING_FAILED"
    }>

export interface CountedWasmWasiSupervisedExecutionInputV118 {
  readonly invocation: RuntimeInvocationRequestV118
  readonly inputBytes: Uint8Array
  readonly cancellationChannel: Readonly<{
    channelId: string
    channelNonce: string
  }>
}

export interface CountedWasmWasiSupervisedAdapterV118 {
  readonly lane: (typeof COUNTED_WASM_WASI_RUNTIMES_V1_18)[number]
  execute(
    input: CountedWasmWasiSupervisedExecutionInputV118,
  ): CountedWasmWasiSupervisedResultV118
}

const systemFailure = (
  code: Extract<
    CountedWasmWasiSupervisedResultV118,
    { kind: "system_failure" }
  >["code"],
): CountedWasmWasiSupervisedResultV118 =>
  Object.freeze({
    kind: "system_failure",
    gameplayDisposition: "no_mutation",
    code,
  })

const derivedLanguageIdentity = (
  observation: WasmWasiLanguageIdentityObservationV118,
):
  | Readonly<{
      adapterBuildSha256: `sha256:${string}`
      runtimeCompilerSha256: `sha256:${string}`
      artifactSha256: `sha256:${string}`
      manifestRootSha256: `sha256:${string}`
    }>
  | undefined => {
  try {
    const runtimeCompilerSha256 =
      createWasmWasiRuntimeCompilerIdentityV118(observation)
    const adapterBuildSha256 =
      createWasmWasiAdapterBuildIdentityV118(observation)
    const manifestRootSha256 = createWasmWasiManifestRootV118({
      languageId: observation.languageId,
      sourceOriginalSha256: observation.sourceOriginalSha256,
      sourceNormalizedSha256: observation.sourceNormalizedSha256,
      runtimeCompilerSha256,
      adapterBuildSha256,
      artifactSha256: observation.artifactSha256,
    })
    return {
      adapterBuildSha256,
      runtimeCompilerSha256,
      artifactSha256: observation.artifactSha256,
      manifestRootSha256,
    }
  } catch {
    return undefined
  }
}

const languageIdentityMatches = (
  laneId: CountedWasmWasiLaneV118,
  invocation: RuntimeInvocationRequestV118,
  observation: WasmWasiLanguageIdentityObservationV118,
): boolean => {
  const derived = derivedLanguageIdentity(observation)
  return (
    observation.languageId === laneId &&
    derived !== undefined &&
    derived.manifestRootSha256 === observation.manifestRootSha256 &&
    invocation.expectedIdentity.adapterBuildSha256 ===
      derived.adapterBuildSha256 &&
    invocation.expectedIdentity.runtimeCompilerSha256 ===
      derived.runtimeCompilerSha256 &&
    invocation.expectedIdentity.artifactSha256 === derived.artifactSha256
  )
}

const sameLanguageIdentity = (
  left: WasmWasiLanguageIdentityObservationV118,
  right: WasmWasiLanguageIdentityObservationV118,
): boolean => {
  try {
    return (
      sha256(
        canonicalBytes(left as unknown as JsonValue, "canonical-manifest"),
      ) ===
      sha256(
        canonicalBytes(right as unknown as JsonValue, "canonical-manifest"),
      )
    )
  } catch {
    return false
  }
}

const executionIsExactWasmtime = (
  execution: SupervisorExecutionDescriptorV118,
  observation: WasmWasiLanguageIdentityObservationV118,
  invocation: RuntimeInvocationRequestV118,
): boolean => {
  const args = execution.argv
  const derivedExecutionIdentity =
    deriveSupervisorExecutionIdentityV118(execution)
  return (
    path.isAbsolute(execution.executablePath) &&
    execution.executableBytesSha256 === observation.wasmtimeExecutableSha256 &&
    execution.environment.length === 0 &&
    args.length === 10 &&
    args[0] === "run" &&
    args[1] === "-W" &&
    args[2] === `fuel=${WASM_WASI_LOCAL_DEFENSE_LIMITS_V1_18.fuel.maximum}` &&
    args[3] === "-W" &&
    args[4] ===
      `max-memory-size=${WASM_WASI_LOCAL_DEFENSE_LIMITS_V1_18.linearMemory.maximumBytes}` &&
    args[5] === "-W" &&
    args[6] ===
      `max-wasm-stack=${WASM_WASI_LOCAL_DEFENSE_LIMITS_V1_18.wasmStackBytes}` &&
    args[7] === "-W" &&
    args[8] === "trap-on-grow-failure=y" &&
    typeof args[9] === "string" &&
    path.isAbsolute(args[9]) &&
    derivedExecutionIdentity.executableSha256 ===
      invocation.executable.executableSha256 &&
    derivedExecutionIdentity.argvSha256 === invocation.executable.argvSha256 &&
    derivedExecutionIdentity.environmentPolicySha256 ===
      invocation.executable.environmentPolicySha256
  )
}

const localDefenseFailure = (
  defense: WasmWasiLocalDefenseObservationV118,
  identity: WasmWasiLanguageIdentityObservationV118,
  resultKind: VerifiedSupervisorEvidenceV118["result"]["kind"],
):
  | "WASMTIME_DEFENSE_INCOMPLETE"
  | "WASMTIME_METER_SUBSTITUTION"
  | "WASMTIME_TRAP_UNRESOLVED"
  | undefined => {
  if (
    !hasExactKeys(defense, [
      "schemaVersion",
      "runtimeExecutableSha256",
      "artifactSha256",
      "fuel",
      "linearMemory",
      "wasmStackBytes",
      "trapOnGrowFailure",
      "trapKind",
      "usedAsCommonQuantitativeMeter",
    ]) ||
    !hasExactKeys(defense.fuel, [
      "configuredMaximum",
      "unit",
      "enabled",
      "exhausted",
    ]) ||
    !hasExactKeys(defense.linearMemory, [
      "configuredMaximumBytes",
      "unit",
      "enabled",
      "exhausted",
    ])
  ) {
    return "WASMTIME_DEFENSE_INCOMPLETE"
  }
  if (defense.usedAsCommonQuantitativeMeter) {
    return "WASMTIME_METER_SUBSTITUTION"
  }
  if (
    defense.schemaVersion !== "wasmtime-local-defense-observation-v1.18" ||
    defense.runtimeExecutableSha256 !== identity.wasmtimeExecutableSha256 ||
    defense.artifactSha256 !== identity.artifactSha256 ||
    defense.fuel.configuredMaximum !==
      WASM_WASI_LOCAL_DEFENSE_LIMITS_V1_18.fuel.maximum ||
    defense.fuel.unit !== "wasmtime-fuel-units" ||
    !defense.fuel.enabled ||
    defense.linearMemory.configuredMaximumBytes !==
      WASM_WASI_LOCAL_DEFENSE_LIMITS_V1_18.linearMemory.maximumBytes ||
    defense.linearMemory.unit !== "wasm-linear-memory-bytes" ||
    !defense.linearMemory.enabled ||
    defense.wasmStackBytes !==
      WASM_WASI_LOCAL_DEFENSE_LIMITS_V1_18.wasmStackBytes ||
    defense.trapOnGrowFailure !== true
  ) {
    return "WASMTIME_DEFENSE_INCOMPLETE"
  }
  const trapIsConsistent =
    (defense.trapKind === "none" &&
      !defense.fuel.exhausted &&
      !defense.linearMemory.exhausted) ||
    (defense.trapKind === "fuel_exhausted" &&
      defense.fuel.exhausted &&
      !defense.linearMemory.exhausted) ||
    (defense.trapKind === "linear_memory_exhausted" &&
      !defense.fuel.exhausted &&
      defense.linearMemory.exhausted)
  if (!trapIsConsistent) {
    return "WASMTIME_TRAP_UNRESOLVED"
  }
  if (resultKind === "success" && defense.trapKind !== "none") {
    return "WASMTIME_TRAP_UNRESOLVED"
  }
  return undefined
}

const guestPayloadIsValid = (
  invocation: RuntimeInvocationRequestV118,
  bytes: Uint8Array,
): boolean => {
  const admitted = admitCanonicalJsonBytes(bytes, {
    profile: "strategy-payload",
  })
  if (!admitted.ok) return false
  return (
    invocation.method === "selectActivations"
      ? StrategyResultV117Schema
      : SoldierBrainResultV117Schema
  ).safeParse(admitted.value).success
}

const capabilityFor = (
  laneId: CountedWasmWasiLaneV118,
  invocation: RuntimeInvocationRequestV118,
): RuntimeBudgetCapabilityLaneSnapshotV118 =>
  evaluateRuntimeBudgetCapabilityV118({
    laneId,
    budgetProfileSha256: RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
    platform: {
      operatingSystem: "linux",
      cgroupVersion: 2,
      cgroupDriver: "cgroupfs",
      delegatedControllers: ["cpu", "memory", "pids"],
    },
    meters: {
      wall: {
        source: "monotonic-elapsed-nanoseconds",
        unit: "ceil-milliseconds",
        complete: true,
      },
      compute: {
        source: "cgroup-v2-cpu.stat-usage_usec-times-1000",
        unit: "aggregate-cpu-nanoseconds",
        complete: true,
      },
      memory: {
        source: "cgroup-v2-memory.peak-and-memory.events",
        unit: "bytes-and-nondecreasing-events",
        complete: true,
      },
      pids: {
        source: "cgroup-v2-pids.current-and-pids.events",
        unit: "kernel-tasks-and-nondecreasing-events",
        complete: true,
      },
      bytes: {
        source: "raw-request-write-and-capture-boundaries",
        unit: "exact-bytes",
        complete: true,
      },
      cancellation: {
        source: "process-group-plus-cgroup.kill",
        unit: "empty-cgroup-receipt",
        complete: true,
      },
    },
    containment: {
      delegated: true,
      settingsApplied: true,
      noCgroupEscape: true,
      emptyAfterReap: true,
      cleanupVerified: true,
    },
    identityPins: {
      ...invocation.expectedIdentity,
      budgetProfileSha256: RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
    },
    wasmtimeDefenseInDepth: {
      fuelObserved: true,
      linearMemoryObserved: true,
      usedAsCommonQuantitativeMeter: false,
    },
  })

const validSignature = (
  value: WasmWasiRuntimeEvidenceSignatureV118,
  evidenceBytes: Uint8Array,
  publicKey: KeyObject | undefined,
  expectedKeyId: string,
): boolean => {
  if (
    publicKey === undefined ||
    value === null ||
    typeof value !== "object" ||
    value.algorithm !== "Ed25519" ||
    value.keyId !== expectedKeyId ||
    !PUBLIC_ID.test(value.keyId) ||
    typeof value.signatureBase64 !== "string"
  ) {
    return false
  }
  const signature = Buffer.from(value.signatureBase64, "base64")
  return (
    signature.byteLength === 64 &&
    signature.toString("base64") === value.signatureBase64 &&
    verifySignature(null, evidenceBytes, publicKey, signature)
  )
}

const signedEvidence = (
  laneId: CountedWasmWasiLaneV118,
  verified: VerifiedSupervisorEvidenceV118,
  invocation: RuntimeInvocationRequestV118,
  identity: WasmWasiLanguageIdentityObservationV118,
  localDefense: WasmWasiLocalDefenseObservationV118,
  capability: RuntimeBudgetCapabilityLaneSnapshotV118,
  signEvidence: (
    canonicalEvidenceBytes: Uint8Array,
  ) => WasmWasiRuntimeEvidenceSignatureV118,
  publicKey: KeyObject | undefined,
  expectedKeyId: string,
): WasmWasiSignedEvidenceV118 | undefined => {
  if (
    capability.kind !== "certificate_candidate" ||
    capability.laneId !== laneId
  ) {
    return undefined
  }
  const evidence = deepFreeze({
    schemaVersion: "runtime-language-quantitative-evidence-v1.18" as const,
    runtimeAbiVersion: "strategy-runtime-abi-v1.18" as const,
    laneId,
    supervisorRequestSha256: verified.supervisorRequestSha256,
    invocationRequestSha256: verified.invocationRequestSha256,
    rawReceiptSha256: verified.rawReceiptSha256,
    commonMeter: {
      observed: verified.observed,
      result: verified.result,
    },
    localDefense,
    identityPins: {
      ...invocation.expectedIdentity,
      budgetProfileSha256: RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
      laneManifestSha256: identity.manifestRootSha256,
    },
    capability: {
      kind: capability.kind,
      safeCode: capability.safeCode,
      countedEligible: capability.countedEligible,
    },
  })
  try {
    const bytes = canonicalBytes(
      evidence as unknown as JsonValue,
      "authenticated-outer-envelope",
    )
    const signature = signEvidence(Uint8Array.from(bytes))
    if (!validSignature(signature, bytes, publicKey, expectedKeyId)) {
      return undefined
    }
    return deepFreeze({
      schemaVersion: "runtime-language-evidence-signature-v1.18" as const,
      evidence,
      evidenceSha256: sha256(bytes),
      signature: {
        algorithm: signature.algorithm,
        keyId: signature.keyId,
        signatureBase64: signature.signatureBase64,
      },
    }) as WasmWasiSignedEvidenceV118
  } catch {
    return undefined
  }
}

export const createCountedWasmWasiSupervisedAdapterV118 = (options: {
  readonly languageId: CountedWasmWasiLaneV118
  readonly launchSupervisor: WasmWasiSupervisorHostLaunchV118
  readonly signEvidence: (
    canonicalEvidenceBytes: Uint8Array,
  ) => WasmWasiRuntimeEvidenceSignatureV118
  readonly execution: SupervisorExecutionDescriptorV118
  readonly expectedLanguageIdentity: WasmWasiLanguageIdentityObservationV118
  readonly evidenceSigningPublicKeyPem: string
  readonly expectedSigningKeyId: string
}): CountedWasmWasiSupervisedAdapterV118 => {
  const lane = COUNTED_WASM_WASI_RUNTIMES_V1_18.find(
    ({ laneId }) => laneId === options.languageId,
  )
  if (lane === undefined) {
    throw new TypeError("WASM/WASI counted lane is invalid")
  }
  const launchSupervisor = options.launchSupervisor
  const signEvidenceCallback = options.signEvidence
  const execution = deepFreeze(
    globalThis.structuredClone(options.execution),
  ) as SupervisorExecutionDescriptorV118
  const expectedLanguageIdentity = deepFreeze(
    globalThis.structuredClone(options.expectedLanguageIdentity),
  ) as WasmWasiLanguageIdentityObservationV118
  const expectedSigningKeyId = options.expectedSigningKeyId
  let publicKey: KeyObject | undefined
  try {
    const candidate = createPublicKey(options.evidenceSigningPublicKeyPem)
    if (
      candidate.asymmetricKeyType === "ed25519" &&
      PUBLIC_ID.test(expectedSigningKeyId)
    ) {
      publicKey = candidate
    }
  } catch {
    publicKey = undefined
  }

  return Object.freeze({
    lane,
    execute(input: CountedWasmWasiSupervisedExecutionInputV118) {
      if (
        !languageIdentityMatches(
          lane.laneId,
          input.invocation,
          expectedLanguageIdentity,
        )
      ) {
        return systemFailure("LANGUAGE_IDENTITY_MISMATCH")
      }
      if (
        !executionIsExactWasmtime(
          execution,
          expectedLanguageIdentity,
          input.invocation,
        )
      ) {
        return systemFailure("WASMTIME_EXECUTION_INVALID")
      }
      let request: SupervisorInvocationRequestV118
      try {
        request = createSupervisorInvocationRequestV118({
          invocation: input.invocation,
          inputBytes: input.inputBytes,
          execution,
          cancellationChannel: input.cancellationChannel,
        })
      } catch {
        return systemFailure("REQUEST_SHAPE_INVALID")
      }
      let launched: WasmWasiSupervisorHostLaunchResultV118
      try {
        launched = launchSupervisor(request)
      } catch {
        return systemFailure("SUPERVISOR_LAUNCH_FAILED")
      }
      if (
        !sameLanguageIdentity(
          launched.languageIdentity,
          expectedLanguageIdentity,
        ) ||
        !languageIdentityMatches(
          lane.laneId,
          input.invocation,
          launched.languageIdentity,
        )
      ) {
        return systemFailure("LANGUAGE_IDENTITY_MISMATCH")
      }
      let verified: ReturnType<typeof verifySupervisorRawReceiptV118>
      try {
        verified = verifySupervisorRawReceiptV118({
          request,
          rawReceiptBytes: launched.rawReceiptBytes,
          observed: launched.observed,
        })
      } catch {
        return systemFailure("RAW_RECEIPT_INVALID")
      }
      if (!verified.ok) return systemFailure(verified.code)
      if (!isVerifiedSupervisorEvidenceV118(verified.value)) {
        return systemFailure("RAW_RECEIPT_INVALID")
      }
      const defenseFailure = localDefenseFailure(
        launched.localDefense,
        launched.languageIdentity,
        verified.value.result.kind,
      )
      if (defenseFailure !== undefined) {
        return systemFailure(defenseFailure)
      }
      if (
        verified.value.result.kind === "success" &&
        !guestPayloadIsValid(input.invocation, launched.observed.payloadBytes)
      ) {
        return systemFailure("GUEST_PAYLOAD_INVALID")
      }
      const capability = capabilityFor(lane.laneId, input.invocation)
      const signature = signedEvidence(
        lane.laneId,
        verified.value,
        input.invocation,
        launched.languageIdentity,
        globalThis.structuredClone(launched.localDefense),
        capability,
        signEvidenceCallback,
        publicKey,
        expectedSigningKeyId,
      )
      if (signature === undefined) {
        return systemFailure("EVIDENCE_SIGNING_FAILED")
      }
      if (verified.value.result.kind === "player_violation") {
        return Object.freeze({
          kind: "player_violation" as const,
          gameplayDisposition: "apply_player_violation" as const,
          code: verified.value.result.code,
          dimensions: Object.freeze([...verified.value.result.dimensions]),
          capability,
          signedEvidence: signature,
        })
      }
      return Object.freeze({
        kind: "success" as const,
        gameplayDisposition: "accept_success" as const,
        payloadBytes: Uint8Array.from(launched.observed.payloadBytes),
        capability,
        signedEvidence: signature,
      })
    },
  })
}
