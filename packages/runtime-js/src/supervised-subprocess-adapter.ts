import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import {
  RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
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
import { COUNTED_TYPESCRIPT_RUNTIME_V1_18 } from "./revision-v1-18.js"

const SHA256 = /^sha256:[0-9a-f]{64}$/u
const PUBLIC_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/u

export interface TypeScriptLanguageIdentityV118 {
  readonly adapterBuildSha256: `sha256:${string}`
  readonly runtimeCompilerSha256: `sha256:${string}`
  readonly artifactSha256: `sha256:${string}`
}

export interface TypeScriptSupervisorHostLaunchResultV118 {
  readonly rawReceiptBytes: Uint8Array
  readonly observed: SupervisorObservedOutputV118
}

export type TypeScriptSupervisorHostLaunchV118 = (
  request: SupervisorInvocationRequestV118,
) => TypeScriptSupervisorHostLaunchResultV118

export interface RuntimeEvidenceSignatureV118 {
  readonly algorithm: "Ed25519"
  readonly keyId: string
  readonly signatureBase64: string
}

export interface TypeScriptSignedEvidenceV118 {
  readonly schemaVersion: "runtime-language-evidence-signature-v1.18"
  readonly evidence: Readonly<{
    schemaVersion: "runtime-language-quantitative-evidence-v1.18"
    runtimeAbiVersion: "strategy-runtime-abi-v1.18"
    laneId: "typescript"
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
  readonly signature: RuntimeEvidenceSignatureV118
}

export type CountedTypeScriptSupervisedResultV118 =
  | Readonly<{
      kind: "success"
      gameplayDisposition: "accept_success"
      payloadBytes: Uint8Array
      capability: RuntimeBudgetCapabilityLaneSnapshotV118
      signedEvidence: TypeScriptSignedEvidenceV118
    }>
  | Readonly<{
      kind: "player_violation"
      gameplayDisposition: "apply_player_violation"
      code: "RESOURCE_EXHAUSTION"
      dimensions: readonly string[]
      capability: RuntimeBudgetCapabilityLaneSnapshotV118
      signedEvidence: TypeScriptSignedEvidenceV118
    }>
  | Readonly<{
      kind: "system_failure"
      gameplayDisposition: "no_mutation"
      code:
        | SupervisorVerificationFailureCodeV118
        | "LANGUAGE_IDENTITY_MISMATCH"
        | "SUPERVISOR_LAUNCH_FAILED"
        | "EVIDENCE_SIGNING_FAILED"
    }>

export interface CountedTypeScriptSupervisedExecutionInputV118 {
  readonly invocation: RuntimeInvocationRequestV118
  readonly inputBytes: Uint8Array
  readonly execution: SupervisorExecutionDescriptorV118
  readonly cancellationChannel: Readonly<{
    channelId: string
    channelNonce: string
  }>
}

export interface CountedTypeScriptSupervisedAdapterV118 {
  readonly lane: typeof COUNTED_TYPESCRIPT_RUNTIME_V1_18
  execute(
    input: CountedTypeScriptSupervisedExecutionInputV118,
  ): CountedTypeScriptSupervisedResultV118
}

const canonicalBytes = (value: JsonValue): Uint8Array => {
  const encoded = encodeCanonicalJson(value, {
    context: "authenticated-outer-envelope",
  })
  if (!encoded.ok) throw new TypeError("Evidence is not canonical")
  return encoded.bytes
}

const sha256 = (bytes: Uint8Array): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`

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
    CountedTypeScriptSupervisedResultV118,
    { kind: "system_failure" }
  >["code"],
): CountedTypeScriptSupervisedResultV118 =>
  Object.freeze({
    kind: "system_failure",
    gameplayDisposition: "no_mutation",
    code,
  })

const languageIdentityMatches = (
  invocation: RuntimeInvocationRequestV118,
  expected: TypeScriptLanguageIdentityV118,
): boolean =>
  SHA256.test(expected.adapterBuildSha256) &&
  SHA256.test(expected.runtimeCompilerSha256) &&
  SHA256.test(expected.artifactSha256) &&
  invocation.expectedIdentity.adapterBuildSha256 ===
    expected.adapterBuildSha256 &&
  invocation.expectedIdentity.runtimeCompilerSha256 ===
    expected.runtimeCompilerSha256 &&
  invocation.expectedIdentity.artifactSha256 === expected.artifactSha256

const capabilityFor = (
  evidence: VerifiedSupervisorEvidenceV118,
  invocation: RuntimeInvocationRequestV118,
): RuntimeBudgetCapabilityLaneSnapshotV118 =>
  evaluateRuntimeBudgetCapabilityV118({
    laneId: "typescript",
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

const validSignature = (
  value: RuntimeEvidenceSignatureV118,
): value is RuntimeEvidenceSignatureV118 => {
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
  signEvidence: (bytes: Uint8Array) => RuntimeEvidenceSignatureV118,
): TypeScriptSignedEvidenceV118 | undefined => {
  if (
    capability.kind !== "certificate_candidate" ||
    capability.laneId !== "typescript"
  ) {
    return undefined
  }
  const evidence = deepFreeze({
    schemaVersion: "runtime-language-quantitative-evidence-v1.18" as const,
    runtimeAbiVersion: "strategy-runtime-abi-v1.18" as const,
    laneId: "typescript" as const,
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
    const bytes = canonicalBytes(evidence as unknown as JsonValue)
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
    }) as TypeScriptSignedEvidenceV118
  } catch {
    return undefined
  }
}

export const createCountedTypeScriptSupervisedAdapterV118 = (options: {
  readonly launchSupervisor: TypeScriptSupervisorHostLaunchV118
  readonly signEvidence: (
    canonicalEvidenceBytes: Uint8Array,
  ) => RuntimeEvidenceSignatureV118
  readonly expectedLanguageIdentity: TypeScriptLanguageIdentityV118
}): CountedTypeScriptSupervisedAdapterV118 =>
  Object.freeze({
    lane: COUNTED_TYPESCRIPT_RUNTIME_V1_18,
    execute(input: CountedTypeScriptSupervisedExecutionInputV118) {
      if (
        !languageIdentityMatches(
          input.invocation,
          options.expectedLanguageIdentity,
        )
      ) {
        return systemFailure("LANGUAGE_IDENTITY_MISMATCH")
      }
      let request: SupervisorInvocationRequestV118
      try {
        request = createSupervisorInvocationRequestV118({
          invocation: input.invocation,
          inputBytes: input.inputBytes,
          execution: input.execution,
          cancellationChannel: input.cancellationChannel,
        })
      } catch {
        return systemFailure("REQUEST_SHAPE_INVALID")
      }
      let launched: TypeScriptSupervisorHostLaunchResultV118
      try {
        launched = options.launchSupervisor(request)
      } catch {
        return systemFailure("SUPERVISOR_LAUNCH_FAILED")
      }
      const verified = verifySupervisorRawReceiptV118({
        request,
        rawReceiptBytes: launched.rawReceiptBytes,
        observed: launched.observed,
      })
      if (!verified.ok) return systemFailure(verified.code)
      if (!isVerifiedSupervisorEvidenceV118(verified.value)) {
        return systemFailure("RAW_RECEIPT_INVALID")
      }
      const capability = capabilityFor(verified.value, input.invocation)
      const signature = signedEvidence(
        verified.value,
        input.invocation,
        capability,
        options.signEvidence,
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
