import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
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
const VERSION_TEXT = /^[A-Za-z0-9][A-Za-z0-9._+(): -]{0,255}$/u

export const COUNTED_PYTHON_RUNTIME_V1_18 = Object.freeze({
  schemaVersion: "counted-runtime-lane-v1.18",
  runtimeAbiVersion: "strategy-runtime-abi-v1.18",
  laneId: "python",
  selectorId: "python-native-supervised-v1.18",
  executionBoundary: "native-linux-cgroup-v2-supervisor",
  isolatedInterpreter: true,
  directSpawnAllowed: false,
  diagnosticFallbackAllowed: false,
  priorDiagnosticAbi: "strategy-runtime-abi-v1.17",
} as const)

const canonicalBytes = (
  value: JsonValue,
  context: "canonical-manifest" | "authenticated-outer-envelope",
): Uint8Array => {
  const encoded = encodeCanonicalJson(value, { context })
  if (!encoded.ok) throw new TypeError("Python identity is not canonical")
  return encoded.bytes
}

const sha256 = (bytes: Uint8Array): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`

export const createPythonRuntimeCompilerIdentityV118 = (input: {
  readonly pythonExecutableSha256: `sha256:${string}`
  readonly pythonVersion: string
  readonly stdlibSha256: `sha256:${string}`
}): `sha256:${string}` => {
  if (
    !SHA256.test(input.pythonExecutableSha256) ||
    !VERSION_TEXT.test(input.pythonVersion) ||
    !SHA256.test(input.stdlibSha256)
  ) {
    throw new TypeError("Python runtime compiler identity is invalid")
  }
  return sha256(
    canonicalBytes(
      {
        identityDomain: "cowards-game:python-runtime-compiler-identity:v1.18",
        pythonExecutableSha256: input.pythonExecutableSha256,
        pythonVersion: input.pythonVersion,
        stdlibSha256: input.stdlibSha256,
      },
      "canonical-manifest",
    ),
  )
}

export const createPythonAdapterBuildIdentityV118 = (input: {
  readonly adapterModuleSha256: `sha256:${string}`
  readonly pythonHostSha256: `sha256:${string}`
}): `sha256:${string}` => {
  if (
    !SHA256.test(input.adapterModuleSha256) ||
    !SHA256.test(input.pythonHostSha256)
  ) {
    throw new TypeError("Python adapter build identity is invalid")
  }
  return sha256(
    canonicalBytes(
      {
        identityDomain: "cowards-game:python-supervised-adapter-build:v1.18",
        adapterModuleSha256: input.adapterModuleSha256,
        pythonHostSha256: input.pythonHostSha256,
      },
      "canonical-manifest",
    ),
  )
}

export interface PythonLanguageIdentityObservationV118 {
  readonly pythonExecutableSha256: `sha256:${string}`
  readonly pythonVersion: string
  readonly stdlibSha256: `sha256:${string}`
  readonly adapterModuleSha256: `sha256:${string}`
  readonly pythonHostSha256: `sha256:${string}`
  readonly artifactSha256: `sha256:${string}`
}

export interface PythonSupervisorHostLaunchResultV118 {
  readonly rawReceiptBytes: Uint8Array
  readonly observed: SupervisorObservedOutputV118
  readonly languageIdentity: PythonLanguageIdentityObservationV118
}

export type PythonSupervisorHostLaunchV118 = (
  request: SupervisorInvocationRequestV118,
) => PythonSupervisorHostLaunchResultV118

export interface PythonRuntimeEvidenceSignatureV118 {
  readonly algorithm: "Ed25519"
  readonly keyId: string
  readonly signatureBase64: string
}

export interface PythonSignedEvidenceV118 {
  readonly schemaVersion: "runtime-language-evidence-signature-v1.18"
  readonly evidence: Readonly<{
    schemaVersion: "runtime-language-quantitative-evidence-v1.18"
    runtimeAbiVersion: "strategy-runtime-abi-v1.18"
    laneId: "python"
    supervisorRequestSha256: `sha256:${string}`
    invocationRequestSha256: `sha256:${string}`
    rawReceiptSha256: `sha256:${string}`
    observed: VerifiedSupervisorEvidenceV118["observed"]
    result: VerifiedSupervisorEvidenceV118["result"]
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
    }>
    capability: Readonly<{
      kind: "certificate_candidate"
      safeCode: "CONFORMANCE_CERTIFICATE_REQUIRED"
      countedEligible: false
    }>
  }>
  readonly evidenceSha256: `sha256:${string}`
  readonly signature: PythonRuntimeEvidenceSignatureV118
}

export type CountedPythonSupervisedResultV118 =
  | Readonly<{
      kind: "success"
      gameplayDisposition: "accept_success"
      payloadBytes: Uint8Array
      capability: RuntimeBudgetCapabilityLaneSnapshotV118
      signedEvidence: PythonSignedEvidenceV118
    }>
  | Readonly<{
      kind: "player_violation"
      gameplayDisposition: "apply_player_violation"
      code: "RESOURCE_EXHAUSTION"
      dimensions: readonly string[]
      capability: RuntimeBudgetCapabilityLaneSnapshotV118
      signedEvidence: PythonSignedEvidenceV118
    }>
  | Readonly<{
      kind: "system_failure"
      gameplayDisposition: "no_mutation"
      code:
        | SupervisorVerificationFailureCodeV118
        | "LANGUAGE_IDENTITY_MISMATCH"
        | "PYTHON_HOST_EXECUTION_INVALID"
        | "SUPERVISOR_LAUNCH_FAILED"
        | "GUEST_PAYLOAD_INVALID"
        | "EVIDENCE_SIGNING_FAILED"
    }>

export interface CountedPythonSupervisedExecutionInputV118 {
  readonly invocation: RuntimeInvocationRequestV118
  readonly inputBytes: Uint8Array
  readonly cancellationChannel: Readonly<{
    channelId: string
    channelNonce: string
  }>
}

export interface CountedPythonSupervisedAdapterV118 {
  readonly lane: typeof COUNTED_PYTHON_RUNTIME_V1_18
  execute(
    input: CountedPythonSupervisedExecutionInputV118,
  ): CountedPythonSupervisedResultV118
}

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
    Object.freeze(value)
  }
  return value
}

const systemFailure = (
  code: Extract<
    CountedPythonSupervisedResultV118,
    { kind: "system_failure" }
  >["code"],
): CountedPythonSupervisedResultV118 =>
  Object.freeze({
    kind: "system_failure",
    gameplayDisposition: "no_mutation",
    code,
  })

const observedIdentity = (
  observation: PythonLanguageIdentityObservationV118,
) => {
  try {
    return {
      adapterBuildSha256: createPythonAdapterBuildIdentityV118({
        adapterModuleSha256: observation.adapterModuleSha256,
        pythonHostSha256: observation.pythonHostSha256,
      }),
      runtimeCompilerSha256: createPythonRuntimeCompilerIdentityV118({
        pythonExecutableSha256: observation.pythonExecutableSha256,
        pythonVersion: observation.pythonVersion,
        stdlibSha256: observation.stdlibSha256,
      }),
      artifactSha256: observation.artifactSha256,
    }
  } catch {
    return undefined
  }
}

const languageIdentityMatches = (
  invocation: RuntimeInvocationRequestV118,
  observation: PythonLanguageIdentityObservationV118,
): boolean => {
  const expected = observedIdentity(observation)
  return (
    expected !== undefined &&
    SHA256.test(expected.artifactSha256) &&
    invocation.expectedIdentity.adapterBuildSha256 ===
      expected.adapterBuildSha256 &&
    invocation.expectedIdentity.runtimeCompilerSha256 ===
      expected.runtimeCompilerSha256 &&
    invocation.expectedIdentity.artifactSha256 === expected.artifactSha256
  )
}

const sameLanguageObservation = (
  left: PythonLanguageIdentityObservationV118,
  right: PythonLanguageIdentityObservationV118,
): boolean => {
  try {
    return (
      left.pythonExecutableSha256 === right.pythonExecutableSha256 &&
      left.pythonVersion === right.pythonVersion &&
      left.stdlibSha256 === right.stdlibSha256 &&
      left.adapterModuleSha256 === right.adapterModuleSha256 &&
      left.pythonHostSha256 === right.pythonHostSha256 &&
      left.artifactSha256 === right.artifactSha256
    )
  } catch {
    return false
  }
}

const executionIsExactPythonHost = (
  execution: SupervisorExecutionDescriptorV118,
  observation: PythonLanguageIdentityObservationV118,
): boolean =>
  path.isAbsolute(execution.executablePath) &&
  execution.executableBytesSha256 === observation.pythonExecutableSha256 &&
  execution.argv.length === 2 &&
  execution.argv[0] === "-I" &&
  typeof execution.argv[1] === "string" &&
  path.isAbsolute(execution.argv[1]) &&
  execution.environment.length === 0

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
  invocation: RuntimeInvocationRequestV118,
): RuntimeBudgetCapabilityLaneSnapshotV118 =>
  evaluateRuntimeBudgetCapabilityV118({
    laneId: "python",
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
    wasmtimeDefenseInDepth: null,
  })

const validSignature = (value: PythonRuntimeEvidenceSignatureV118): boolean => {
  if (
    value === null ||
    typeof value !== "object" ||
    value.algorithm !== "Ed25519" ||
    typeof value.keyId !== "string" ||
    !PUBLIC_ID.test(value.keyId) ||
    typeof value.signatureBase64 !== "string"
  ) {
    return false
  }
  const bytes = Buffer.from(value.signatureBase64, "base64")
  return (
    bytes.byteLength === 64 &&
    bytes.toString("base64") === value.signatureBase64
  )
}

const signedEvidence = (
  verified: VerifiedSupervisorEvidenceV118,
  invocation: RuntimeInvocationRequestV118,
  capability: RuntimeBudgetCapabilityLaneSnapshotV118,
  signEvidence: (
    canonicalEvidenceBytes: Uint8Array,
  ) => PythonRuntimeEvidenceSignatureV118,
): PythonSignedEvidenceV118 | undefined => {
  if (
    capability.kind !== "certificate_candidate" ||
    capability.laneId !== "python"
  ) {
    return undefined
  }
  const evidence = deepFreeze({
    schemaVersion: "runtime-language-quantitative-evidence-v1.18" as const,
    runtimeAbiVersion: "strategy-runtime-abi-v1.18" as const,
    laneId: "python" as const,
    supervisorRequestSha256: verified.supervisorRequestSha256,
    invocationRequestSha256: verified.invocationRequestSha256,
    rawReceiptSha256: verified.rawReceiptSha256,
    observed: verified.observed,
    result: verified.result,
    identityPins: {
      ...invocation.expectedIdentity,
      budgetProfileSha256: RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
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
    if (!validSignature(signature)) return undefined
    return deepFreeze({
      schemaVersion: "runtime-language-evidence-signature-v1.18" as const,
      evidence,
      evidenceSha256: sha256(bytes),
      signature: {
        algorithm: signature.algorithm,
        keyId: signature.keyId,
        signatureBase64: signature.signatureBase64,
      },
    }) as PythonSignedEvidenceV118
  } catch {
    return undefined
  }
}

export const createCountedPythonSupervisedAdapterV118 = (options: {
  readonly launchSupervisor: PythonSupervisorHostLaunchV118
  readonly signEvidence: (
    canonicalEvidenceBytes: Uint8Array,
  ) => PythonRuntimeEvidenceSignatureV118
  readonly execution: SupervisorExecutionDescriptorV118
  readonly expectedLanguageIdentity: PythonLanguageIdentityObservationV118
}): CountedPythonSupervisedAdapterV118 => {
  const launchSupervisor = options.launchSupervisor
  const signEvidence = options.signEvidence
  const execution = deepFreeze(
    globalThis.structuredClone(options.execution),
  ) as SupervisorExecutionDescriptorV118
  const expectedLanguageIdentity = deepFreeze(
    globalThis.structuredClone(options.expectedLanguageIdentity),
  ) as PythonLanguageIdentityObservationV118
  return Object.freeze({
    lane: COUNTED_PYTHON_RUNTIME_V1_18,
    execute(input: CountedPythonSupervisedExecutionInputV118) {
      if (
        !languageIdentityMatches(input.invocation, expectedLanguageIdentity)
      ) {
        return systemFailure("LANGUAGE_IDENTITY_MISMATCH")
      }
      if (!executionIsExactPythonHost(execution, expectedLanguageIdentity)) {
        return systemFailure("PYTHON_HOST_EXECUTION_INVALID")
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
      let launched: PythonSupervisorHostLaunchResultV118
      try {
        launched = launchSupervisor(request)
      } catch {
        return systemFailure("SUPERVISOR_LAUNCH_FAILED")
      }
      if (
        !sameLanguageObservation(
          launched.languageIdentity,
          expectedLanguageIdentity,
        ) ||
        !languageIdentityMatches(input.invocation, launched.languageIdentity)
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
      if (
        verified.value.result.kind === "success" &&
        !guestPayloadIsValid(input.invocation, launched.observed.payloadBytes)
      ) {
        return systemFailure("GUEST_PAYLOAD_INVALID")
      }
      const capability = capabilityFor(input.invocation)
      const signature = signedEvidence(
        verified.value,
        input.invocation,
        capability,
        signEvidence,
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
