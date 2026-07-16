import { createHash } from "node:crypto"
import { z } from "zod"
import { encodeCanonicalJson } from "./canonical-json-encode.js"
import {
  RUNTIME_BUDGET_PROFILE_V1_18,
  RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
  classifyRuntimeLimitComparisonV118,
  computeFuelFromCpuUsageUsecV118,
  getRuntimeInvocationLimitsV118,
  wallMillisecondsFromMonotonicNanosecondsV118,
  type RuntimeInvocationLimitsV118,
  type RuntimeInvocationMethodV118,
} from "./runtime-budget-profile-v1-18.js"
import type { JsonValue } from "./types.js"

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
    Object.freeze(value)
  }
  return value
}

const NonnegativeSafeIntegerSchema = z
  .number()
  .int()
  .min(0)
  .max(Number.MAX_SAFE_INTEGER)
const PositiveSafeIntegerSchema = NonnegativeSafeIntegerSchema.min(1)
const Sha256Schema = z.string().regex(/^sha256:[0-9a-f]{64}$/u)
const PublicIdSchema = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/u)
const HostNonceSchema = z.string().regex(/^[A-Za-z0-9._:-]{24,255}$/u)
const RuntimeInvocationMethodV118Schema = z.enum([
  "selectActivations",
  "soldierBrain",
])

export interface RuntimeSupervisorIdentityV118 {
  supervisorBinarySha256: `sha256:${string}`
  supervisorToolchainSha256: `sha256:${string}`
  linuxKernelSha256: `sha256:${string}`
  dockerEngineSha256: `sha256:${string}`
  dockerImageDigest: `sha256:${string}`
  cgroupDelegationSha256: `sha256:${string}`
  adapterBuildSha256: `sha256:${string}`
  runtimeCompilerSha256: `sha256:${string}`
  artifactSha256: `sha256:${string}`
}

const RuntimeSupervisorIdentityV118Schema = z
  .object({
    supervisorBinarySha256: Sha256Schema,
    supervisorToolchainSha256: Sha256Schema,
    linuxKernelSha256: Sha256Schema,
    dockerEngineSha256: Sha256Schema,
    dockerImageDigest: Sha256Schema,
    cgroupDelegationSha256: Sha256Schema,
    adapterBuildSha256: Sha256Schema,
    runtimeCompilerSha256: Sha256Schema,
    artifactSha256: Sha256Schema,
  })
  .strict()

const RuntimeInvocationLimitsV118Schema = z
  .object({
    wallMilliseconds: PositiveSafeIntegerSchema,
    computeFuel: PositiveSafeIntegerSchema,
    memoryMaxBytes: PositiveSafeIntegerSchema,
    pidsMax: PositiveSafeIntegerSchema,
    payloadBytes: PositiveSafeIntegerSchema,
    stdoutBytes: PositiveSafeIntegerSchema,
    stderrBytes: PositiveSafeIntegerSchema,
    cpuMax: z
      .object({
        quotaMicroseconds: PositiveSafeIntegerSchema,
        periodMicroseconds: PositiveSafeIntegerSchema,
      })
      .strict(),
    terminationGraceMilliseconds: PositiveSafeIntegerSchema,
  })
  .strict()

const ExecutableIdentityV118Schema = z
  .object({
    executableSha256: Sha256Schema,
    argvSha256: Sha256Schema,
    environmentPolicySha256: Sha256Schema,
  })
  .strict()

export interface RuntimeInvocationCgroupBindingV118 {
  readonly pathIdentitySha256: `sha256:${string}`
  readonly settingsSha256: `sha256:${string}`
}

const RuntimeInvocationCgroupBindingV118Schema = z
  .object({
    pathIdentitySha256: Sha256Schema,
    settingsSha256: Sha256Schema,
  })
  .strict()

export interface CreateRuntimeInvocationRequestV118Input {
  readonly requestId: string
  readonly invocationId: string
  readonly method: RuntimeInvocationMethodV118
  readonly hostNonce: string
  readonly monotonicDeadlineNanoseconds: number
  readonly executable: Readonly<{
    executableSha256: `sha256:${string}`
    argvSha256: `sha256:${string}`
    environmentPolicySha256: `sha256:${string}`
  }>
  readonly expectedIdentity: RuntimeSupervisorIdentityV118
}

const CreateRuntimeInvocationRequestV118InputSchema = z
  .object({
    requestId: PublicIdSchema,
    invocationId: PublicIdSchema,
    method: RuntimeInvocationMethodV118Schema,
    hostNonce: HostNonceSchema,
    monotonicDeadlineNanoseconds: PositiveSafeIntegerSchema,
    executable: ExecutableIdentityV118Schema,
    expectedIdentity: RuntimeSupervisorIdentityV118Schema,
  })
  .strict()

export interface RuntimeInvocationRequestV118 {
  readonly schemaVersion: "runtime-invocation-request-v1.18"
  readonly runtimeAbiVersion: "strategy-runtime-abi-v1.18"
  readonly requestId: string
  readonly invocationId: string
  readonly method: RuntimeInvocationMethodV118
  readonly hostNonce: string
  readonly budgetProfileSha256: typeof RUNTIME_BUDGET_PROFILE_V1_18_SHA256
  readonly monotonicDeadlineNanoseconds: number
  readonly limits: Readonly<RuntimeInvocationLimitsV118>
  readonly executable: CreateRuntimeInvocationRequestV118Input["executable"]
  readonly expectedIdentity: Readonly<RuntimeSupervisorIdentityV118>
  readonly expectedCgroup: Readonly<RuntimeInvocationCgroupBindingV118>
  readonly requestSha256: `sha256:${string}`
}

const RuntimeCgroupPathIdentitySourceV118Schema = z
  .object({
    schemaVersion: z.literal("runtime-invocation-request-v1.18"),
    runtimeAbiVersion: z.literal("strategy-runtime-abi-v1.18"),
    requestId: PublicIdSchema,
    invocationId: PublicIdSchema,
    method: RuntimeInvocationMethodV118Schema,
    hostNonce: HostNonceSchema,
    budgetProfileSha256: z.literal(RUNTIME_BUDGET_PROFILE_V1_18_SHA256),
    monotonicDeadlineNanoseconds: PositiveSafeIntegerSchema,
    limits: RuntimeInvocationLimitsV118Schema,
    executable: ExecutableIdentityV118Schema,
    expectedIdentity: RuntimeSupervisorIdentityV118Schema,
  })
  .strict()

const RuntimeInvocationRequestWithoutHashV118Schema =
  CreateRuntimeInvocationRequestV118InputSchema.extend({
    schemaVersion: z.literal("runtime-invocation-request-v1.18"),
    runtimeAbiVersion: z.literal("strategy-runtime-abi-v1.18"),
    budgetProfileSha256: z.literal(RUNTIME_BUDGET_PROFILE_V1_18_SHA256),
    limits: RuntimeInvocationLimitsV118Schema,
    expectedCgroup: RuntimeInvocationCgroupBindingV118Schema,
  }).strict()

export const RuntimeInvocationRequestV118Schema =
  RuntimeInvocationRequestWithoutHashV118Schema.extend({
    requestSha256: Sha256Schema,
  })
    .strict()
    .superRefine((request, context) => {
      const { requestSha256, ...withoutHash } = request
      if (
        requestSha256 !==
        sha256(canonicalBytes(withoutHash as unknown as JsonValue))
      ) {
        context.addIssue({
          code: "custom",
          path: ["requestSha256"],
          message:
            "runtime invocation v1.18 request hash does not match its body",
        })
      }
      if (
        !cgroupBindingMatchesRequestV118(
          request as RuntimeInvocationRequestV118,
        )
      ) {
        context.addIssue({
          code: "custom",
          path: ["expectedCgroup"],
          message:
            "runtime invocation v1.18 cgroup binding does not match its request",
        })
      }
    })

const canonicalBytes = (value: JsonValue): Uint8Array => {
  const encoded = encodeCanonicalJson(value, {
    context: "authenticated-outer-envelope",
  })
  if (!encoded.ok) {
    throw new TypeError(
      `Runtime invocation v1.18 value is not canonical: ${encoded.error.code}`,
    )
  }
  return encoded.bytes
}

const sha256 = (bytes: Uint8Array): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`

const canonicalEqual = (left: unknown, right: unknown): boolean => {
  try {
    return (
      sha256(canonicalBytes(left as JsonValue)) ===
      sha256(canonicalBytes(right as JsonValue))
    )
  } catch {
    return false
  }
}

export const deriveRuntimeCgroupSettingsSha256V118 = (
  limitsInput: RuntimeInvocationLimitsV118,
): `sha256:${string}` => {
  const limits = RuntimeInvocationLimitsV118Schema.parse(limitsInput)
  return sha256(
    canonicalBytes({
      identityDomain: "cowards-game:runtime-cgroup-settings:v1.18",
      cpuMax: limits.cpuMax,
      memoryMaxBytes: limits.memoryMaxBytes,
      pidsMax: limits.pidsMax,
    }),
  )
}

export const deriveRuntimeCgroupPathIdentityV118 = (
  request: Pick<
    RuntimeInvocationRequestV118,
    | "schemaVersion"
    | "runtimeAbiVersion"
    | "requestId"
    | "invocationId"
    | "method"
    | "hostNonce"
    | "budgetProfileSha256"
    | "monotonicDeadlineNanoseconds"
    | "limits"
    | "executable"
    | "expectedIdentity"
  >,
): `sha256:${string}` => {
  const source = RuntimeCgroupPathIdentitySourceV118Schema.parse({
    schemaVersion: request.schemaVersion,
    runtimeAbiVersion: request.runtimeAbiVersion,
    requestId: request.requestId,
    invocationId: request.invocationId,
    method: request.method,
    hostNonce: request.hostNonce,
    budgetProfileSha256: request.budgetProfileSha256,
    monotonicDeadlineNanoseconds: request.monotonicDeadlineNanoseconds,
    limits: request.limits,
    executable: request.executable,
    expectedIdentity: request.expectedIdentity,
  })
  return sha256(
    canonicalBytes({
      identityDomain: "cowards-game:runtime-cgroup-path-identity:v1.18",
      request: source,
    }),
  )
}

const cgroupBindingMatchesRequestV118 = (
  request: RuntimeInvocationRequestV118,
): boolean =>
  request.expectedCgroup.pathIdentitySha256 ===
    deriveRuntimeCgroupPathIdentityV118(request) &&
  request.expectedCgroup.settingsSha256 ===
    deriveRuntimeCgroupSettingsSha256V118(request.limits)

export const createRuntimeInvocationRequestV118 = (
  inputValue: CreateRuntimeInvocationRequestV118Input,
): RuntimeInvocationRequestV118 => {
  const input = CreateRuntimeInvocationRequestV118InputSchema.parse(
    inputValue,
  ) as CreateRuntimeInvocationRequestV118Input
  const withoutCgroupBinding = {
    schemaVersion: "runtime-invocation-request-v1.18" as const,
    runtimeAbiVersion: "strategy-runtime-abi-v1.18" as const,
    requestId: input.requestId,
    invocationId: input.invocationId,
    method: input.method,
    hostNonce: input.hostNonce,
    budgetProfileSha256: RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
    monotonicDeadlineNanoseconds: input.monotonicDeadlineNanoseconds,
    limits: getRuntimeInvocationLimitsV118(input.method),
    executable: input.executable,
    expectedIdentity: input.expectedIdentity,
  }
  const withoutHash = {
    ...withoutCgroupBinding,
    expectedCgroup: {
      pathIdentitySha256:
        deriveRuntimeCgroupPathIdentityV118(withoutCgroupBinding),
      settingsSha256: deriveRuntimeCgroupSettingsSha256V118(
        withoutCgroupBinding.limits,
      ),
    },
  }
  const request = RuntimeInvocationRequestV118Schema.parse({
    ...withoutHash,
    requestSha256: sha256(canonicalBytes(withoutHash as unknown as JsonValue)),
  }) as RuntimeInvocationRequestV118
  return deepFreeze(request) as RuntimeInvocationRequestV118
}

export const serializeRuntimeInvocationRequestV118 = (
  request: RuntimeInvocationRequestV118,
): Uint8Array => {
  const parsed = RuntimeInvocationRequestV118Schema.safeParse(request)
  if (!parsed.success) {
    throw new TypeError("Runtime invocation v1.18 request hash is invalid")
  }
  return canonicalBytes(parsed.data as unknown as JsonValue)
}

export interface RuntimeMemoryEventsV118 {
  low: number
  high: number
  max: number
  oom: number
  oomKill: number
  oomGroupKill: number
}

export interface RuntimeSupervisorRawReceiptV118 {
  schemaVersion: "runtime-supervisor-raw-receipt-v1.18"
  runtimeAbiVersion: "strategy-runtime-abi-v1.18"
  requestId: string
  invocationId: string
  method: RuntimeInvocationMethodV118
  hostNonce: string
  requestSha256: `sha256:${string}`
  budgetProfileSha256: `sha256:${string}`
  platform: {
    operatingSystem: string
    cgroupVersion: number
    cgroupDriver: string
    delegatedControllers: string[]
  }
  limits: RuntimeInvocationLimitsV118
  cgroup: {
    pathIdentitySha256: `sha256:${string}`
    settingsSha256: `sha256:${string}`
  }
  wall: {
    supervisedSpawnMonotonicNanoseconds: number
    processGroupReapedMonotonicNanoseconds: number
    elapsedNanoseconds: number
    wallMilliseconds: number
  }
  cpu: {
    baselineUsageMicroseconds: number
    finalUsageMicroseconds: number
    computeFuel: number
  }
  memory: {
    peakBytes: number
    eventsBefore: RuntimeMemoryEventsV118
    eventsAfter: RuntimeMemoryEventsV118
  }
  pids: {
    currentBefore: number
    currentPeak: number
    currentAfter: number
    eventsBefore: { max: number }
    eventsAfter: { max: number }
  }
  bytes: {
    payloadBytes: number
    stdoutBytes: number
    stderrBytes: number
    payloadTruncated: boolean
    stdoutTruncated: boolean
    stderrTruncated: boolean
  }
  lifecycle: {
    exitCode: number | null
    signal: string | null
    cancellationRequested: boolean
    cancellationWinner: "none" | "host" | "guest" | "ambiguous"
    cgroupKillUsed: boolean
    lateResultDiscarded: boolean
  }
  containment: {
    processGroupIdentitySha256: `sha256:${string}`
    cgroupEmpty: boolean
    escapedProcessCount: number
    lingeringProcessCount: number
  }
  identity: RuntimeSupervisorIdentityV118
  attribution: "proven_strategy" | "host" | "ambiguous"
}

const MemoryEventsV118Schema = z
  .object({
    low: NonnegativeSafeIntegerSchema,
    high: NonnegativeSafeIntegerSchema,
    max: NonnegativeSafeIntegerSchema,
    oom: NonnegativeSafeIntegerSchema,
    oomKill: NonnegativeSafeIntegerSchema,
    oomGroupKill: NonnegativeSafeIntegerSchema,
  })
  .strict()

export const RuntimeSupervisorRawReceiptV118Schema = z
  .object({
    schemaVersion: z.literal("runtime-supervisor-raw-receipt-v1.18"),
    runtimeAbiVersion: z.literal("strategy-runtime-abi-v1.18"),
    requestId: PublicIdSchema,
    invocationId: PublicIdSchema,
    method: RuntimeInvocationMethodV118Schema,
    hostNonce: HostNonceSchema,
    requestSha256: Sha256Schema,
    budgetProfileSha256: Sha256Schema,
    platform: z
      .object({
        operatingSystem: z.string().min(1).max(32),
        cgroupVersion: NonnegativeSafeIntegerSchema,
        cgroupDriver: z.string().min(1).max(32),
        delegatedControllers: z.array(z.string().min(1).max(32)).max(8),
      })
      .strict(),
    limits: RuntimeInvocationLimitsV118Schema,
    cgroup: z
      .object({
        pathIdentitySha256: Sha256Schema,
        settingsSha256: Sha256Schema,
      })
      .strict(),
    wall: z
      .object({
        supervisedSpawnMonotonicNanoseconds: NonnegativeSafeIntegerSchema,
        processGroupReapedMonotonicNanoseconds: NonnegativeSafeIntegerSchema,
        elapsedNanoseconds: NonnegativeSafeIntegerSchema,
        wallMilliseconds: NonnegativeSafeIntegerSchema,
      })
      .strict(),
    cpu: z
      .object({
        baselineUsageMicroseconds: NonnegativeSafeIntegerSchema,
        finalUsageMicroseconds: NonnegativeSafeIntegerSchema,
        computeFuel: NonnegativeSafeIntegerSchema,
      })
      .strict(),
    memory: z
      .object({
        peakBytes: NonnegativeSafeIntegerSchema,
        eventsBefore: MemoryEventsV118Schema,
        eventsAfter: MemoryEventsV118Schema,
      })
      .strict(),
    pids: z
      .object({
        currentBefore: NonnegativeSafeIntegerSchema,
        currentPeak: NonnegativeSafeIntegerSchema,
        currentAfter: NonnegativeSafeIntegerSchema,
        eventsBefore: z.object({ max: NonnegativeSafeIntegerSchema }).strict(),
        eventsAfter: z.object({ max: NonnegativeSafeIntegerSchema }).strict(),
      })
      .strict(),
    bytes: z
      .object({
        payloadBytes: NonnegativeSafeIntegerSchema,
        stdoutBytes: NonnegativeSafeIntegerSchema,
        stderrBytes: NonnegativeSafeIntegerSchema,
        payloadTruncated: z.boolean(),
        stdoutTruncated: z.boolean(),
        stderrTruncated: z.boolean(),
      })
      .strict(),
    lifecycle: z
      .object({
        exitCode: NonnegativeSafeIntegerSchema.nullable(),
        signal: z.string().min(1).max(64).nullable(),
        cancellationRequested: z.boolean(),
        cancellationWinner: z.enum(["none", "host", "guest", "ambiguous"]),
        cgroupKillUsed: z.boolean(),
        lateResultDiscarded: z.boolean(),
      })
      .strict(),
    containment: z
      .object({
        processGroupIdentitySha256: Sha256Schema,
        cgroupEmpty: z.boolean(),
        escapedProcessCount: NonnegativeSafeIntegerSchema,
        lingeringProcessCount: NonnegativeSafeIntegerSchema,
      })
      .strict(),
    identity: RuntimeSupervisorIdentityV118Schema,
    attribution: z.enum(["proven_strategy", "host", "ambiguous"]),
  })
  .strict()

export type RuntimeInvocationEvidenceFailureCodeV118 =
  | "RAW_RECEIPT_INVALID"
  | "REQUEST_BINDING_MISMATCH"
  | "LIMIT_MISMATCH"
  | "CGROUP_BINDING_MISMATCH"
  | "COUNTED_PLATFORM_UNAVAILABLE"
  | "CONTROLLERS_UNAVAILABLE"
  | "IDENTITY_MISMATCH"
  | "COUNTER_INCONSISTENT"
  | "EVENT_COUNTER_DECREASED"
  | "CONTAINMENT_INCOMPLETE"
  | "LIFECYCLE_CONTRADICTION"
  | "TRUNCATED_CAPTURE"
  | "RESOURCE_ATTRIBUTION_UNPROVEN"
  | "PROCESS_RESULT_UNRESOLVED"

export type RuntimeInvocationResourceDimensionV118 =
  | "wallMilliseconds"
  | "computeFuel"
  | "memoryPeakBytes"
  | "pids"
  | "payloadBytes"
  | "stdoutBytes"
  | "stderrBytes"

export type RuntimeInvocationEvidenceResultV118 =
  | Readonly<{
      kind: "success"
      gameplayDisposition: "accept_success"
      evidence: Readonly<{
        requestSha256: `sha256:${string}`
        budgetProfileSha256: typeof RUNTIME_BUDGET_PROFILE_V1_18_SHA256
        cgroupPathIdentitySha256: `sha256:${string}`
        cgroupSettingsSha256: `sha256:${string}`
        computeFuel: number
        wallMilliseconds: number
        memoryPeakBytes: number
        pidsPeak: number
        payloadBytes: number
        stdoutBytes: number
        stderrBytes: number
        identity: Readonly<RuntimeSupervisorIdentityV118>
      }>
    }>
  | Readonly<{
      kind: "player_violation"
      gameplayDisposition: "apply_player_violation"
      code: "RESOURCE_EXHAUSTION"
      dimensions: readonly RuntimeInvocationResourceDimensionV118[]
    }>
  | Readonly<{
      kind: "system_failure"
      gameplayDisposition: "no_mutation"
      code: RuntimeInvocationEvidenceFailureCodeV118
    }>

const systemFailure = (
  code: RuntimeInvocationEvidenceFailureCodeV118,
): RuntimeInvocationEvidenceResultV118 =>
  Object.freeze({
    kind: "system_failure",
    gameplayDisposition: "no_mutation",
    code,
  })

const countersNondecreasing = (before: object, after: object): boolean => {
  const beforeRecord = before as Record<string, unknown>
  const afterRecord = after as Record<string, unknown>
  return Object.entries(beforeRecord).every(([key, value]) => {
    const candidate = afterRecord[key]
    return (
      typeof value === "number" &&
      typeof candidate === "number" &&
      Number.isSafeInteger(candidate) &&
      candidate >= value
    )
  })
}

const exactPlatform = (
  receipt: RuntimeSupervisorRawReceiptV118,
): RuntimeInvocationEvidenceFailureCodeV118 | undefined => {
  const counted = RUNTIME_BUDGET_PROFILE_V1_18.countedPlatform
  if (
    receipt.platform.operatingSystem !== counted.operatingSystem ||
    receipt.platform.cgroupVersion !== counted.cgroupVersion ||
    receipt.platform.cgroupDriver !== counted.cgroupDriver
  ) {
    return "COUNTED_PLATFORM_UNAVAILABLE"
  }
  return canonicalEqual(
    receipt.platform.delegatedControllers,
    counted.delegatedControllers,
  )
    ? undefined
    : "CONTROLLERS_UNAVAILABLE"
}

const lifecycleIsConsistent = (
  receipt: RuntimeSupervisorRawReceiptV118,
): boolean => {
  const lifecycle = receipt.lifecycle
  if (lifecycle.exitCode !== null && lifecycle.signal !== null) return false
  if (!lifecycle.cancellationRequested) {
    return (
      lifecycle.cancellationWinner === "none" &&
      !lifecycle.cgroupKillUsed &&
      !lifecycle.lateResultDiscarded
    )
  }
  if (lifecycle.cancellationWinner === "ambiguous") return false
  if (lifecycle.cancellationWinner === "host") {
    return lifecycle.cgroupKillUsed && lifecycle.lateResultDiscarded
  }
  return lifecycle.cancellationWinner === "guest"
    ? !lifecycle.cgroupKillUsed
    : false
}

export const evaluateRuntimeSupervisorReceiptV118 = (
  request: RuntimeInvocationRequestV118,
  receiptInput: RuntimeSupervisorRawReceiptV118,
): RuntimeInvocationEvidenceResultV118 => {
  const parsedRequest = RuntimeInvocationRequestV118Schema.safeParse(request)
  const parsedReceipt =
    RuntimeSupervisorRawReceiptV118Schema.safeParse(receiptInput)
  if (!parsedRequest.success || !parsedReceipt.success) {
    return systemFailure("RAW_RECEIPT_INVALID")
  }
  const receipt = parsedReceipt.data as RuntimeSupervisorRawReceiptV118
  if (
    receipt.requestId !== request.requestId ||
    receipt.invocationId !== request.invocationId ||
    receipt.method !== request.method ||
    receipt.hostNonce !== request.hostNonce ||
    receipt.requestSha256 !== request.requestSha256 ||
    receipt.budgetProfileSha256 !== request.budgetProfileSha256
  ) {
    return systemFailure("REQUEST_BINDING_MISMATCH")
  }
  if (!canonicalEqual(receipt.limits, request.limits)) {
    return systemFailure("LIMIT_MISMATCH")
  }
  if (
    receipt.cgroup.pathIdentitySha256 !==
      request.expectedCgroup.pathIdentitySha256 ||
    receipt.cgroup.settingsSha256 !== request.expectedCgroup.settingsSha256
  ) {
    return systemFailure("CGROUP_BINDING_MISMATCH")
  }
  const platformFailure = exactPlatform(receipt)
  if (platformFailure !== undefined) return systemFailure(platformFailure)
  if (!canonicalEqual(receipt.identity, request.expectedIdentity)) {
    return systemFailure("IDENTITY_MISMATCH")
  }
  let expectedWall: number
  let expectedCompute: number
  try {
    expectedWall = wallMillisecondsFromMonotonicNanosecondsV118(
      receipt.wall.supervisedSpawnMonotonicNanoseconds,
      receipt.wall.processGroupReapedMonotonicNanoseconds,
    )
    expectedCompute = computeFuelFromCpuUsageUsecV118(
      receipt.cpu.baselineUsageMicroseconds,
      receipt.cpu.finalUsageMicroseconds,
    )
  } catch {
    return systemFailure("COUNTER_INCONSISTENT")
  }
  if (
    receipt.wall.elapsedNanoseconds !==
      receipt.wall.processGroupReapedMonotonicNanoseconds -
        receipt.wall.supervisedSpawnMonotonicNanoseconds ||
    receipt.wall.wallMilliseconds !== expectedWall ||
    receipt.cpu.computeFuel !== expectedCompute ||
    receipt.cpu.computeFuel % 1000 !== 0
  ) {
    return systemFailure("COUNTER_INCONSISTENT")
  }
  if (
    !countersNondecreasing(
      receipt.memory.eventsBefore,
      receipt.memory.eventsAfter,
    ) ||
    !countersNondecreasing(receipt.pids.eventsBefore, receipt.pids.eventsAfter)
  ) {
    return systemFailure("EVENT_COUNTER_DECREASED")
  }
  if (
    !receipt.containment.cgroupEmpty ||
    receipt.containment.escapedProcessCount !== 0 ||
    receipt.containment.lingeringProcessCount !== 0 ||
    receipt.pids.currentAfter !== 0
  ) {
    return systemFailure("CONTAINMENT_INCOMPLETE")
  }
  if (!lifecycleIsConsistent(receipt)) {
    return systemFailure("LIFECYCLE_CONTRADICTION")
  }
  if (
    receipt.bytes.payloadTruncated ||
    receipt.bytes.stdoutTruncated ||
    receipt.bytes.stderrTruncated
  ) {
    return systemFailure("TRUNCATED_CAPTURE")
  }

  const dimensions: RuntimeInvocationResourceDimensionV118[] = []
  const comparisons = [
    [
      "wallMilliseconds",
      receipt.wall.wallMilliseconds,
      request.limits.wallMilliseconds,
    ],
    ["computeFuel", receipt.cpu.computeFuel, request.limits.computeFuel],
    [
      "memoryPeakBytes",
      receipt.memory.peakBytes,
      request.limits.memoryMaxBytes,
    ],
    ["pids", receipt.pids.currentPeak, request.limits.pidsMax],
    ["payloadBytes", receipt.bytes.payloadBytes, request.limits.payloadBytes],
    ["stdoutBytes", receipt.bytes.stdoutBytes, request.limits.stdoutBytes],
    ["stderrBytes", receipt.bytes.stderrBytes, request.limits.stderrBytes],
  ] as const
  for (const [dimension, observed, maximum] of comparisons) {
    if (
      !classifyRuntimeLimitComparisonV118(dimension, observed, maximum)
        .withinLimit
    ) {
      dimensions.push(dimension)
    }
  }
  if (
    receipt.memory.eventsAfter.max > receipt.memory.eventsBefore.max ||
    receipt.memory.eventsAfter.oom > receipt.memory.eventsBefore.oom ||
    receipt.memory.eventsAfter.oomKill > receipt.memory.eventsBefore.oomKill ||
    receipt.memory.eventsAfter.oomGroupKill >
      receipt.memory.eventsBefore.oomGroupKill
  ) {
    if (!dimensions.includes("memoryPeakBytes")) {
      dimensions.push("memoryPeakBytes")
    }
  }
  if (receipt.pids.eventsAfter.max > receipt.pids.eventsBefore.max) {
    if (!dimensions.includes("pids")) dimensions.push("pids")
  }

  if (dimensions.length > 0) {
    if (receipt.attribution !== "proven_strategy") {
      return systemFailure("RESOURCE_ATTRIBUTION_UNPROVEN")
    }
    return deepFreeze({
      kind: "player_violation" as const,
      gameplayDisposition: "apply_player_violation" as const,
      code: "RESOURCE_EXHAUSTION" as const,
      dimensions,
    }) as RuntimeInvocationEvidenceResultV118
  }
  if (
    receipt.lifecycle.exitCode !== 0 ||
    receipt.lifecycle.signal !== null ||
    receipt.lifecycle.cancellationRequested
  ) {
    return systemFailure("PROCESS_RESULT_UNRESOLVED")
  }
  const evidence = {
    requestSha256: request.requestSha256,
    budgetProfileSha256: RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
    cgroupPathIdentitySha256: receipt.cgroup.pathIdentitySha256,
    cgroupSettingsSha256: receipt.cgroup.settingsSha256,
    computeFuel: receipt.cpu.computeFuel,
    wallMilliseconds: receipt.wall.wallMilliseconds,
    memoryPeakBytes: receipt.memory.peakBytes,
    pidsPeak: receipt.pids.currentPeak,
    payloadBytes: receipt.bytes.payloadBytes,
    stdoutBytes: receipt.bytes.stdoutBytes,
    stderrBytes: receipt.bytes.stderrBytes,
    identity: receipt.identity,
  }
  return deepFreeze({
    kind: "success" as const,
    gameplayDisposition: "accept_success" as const,
    evidence,
  }) as RuntimeInvocationEvidenceResultV118
}
