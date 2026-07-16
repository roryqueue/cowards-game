import { Buffer } from "node:buffer"
import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import {
  RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
  type RuntimeSupervisorRawReceiptV118,
} from "@cowards/spec"
import {
  createSupervisorRawReceiptEnvelopeV118,
  serializeSupervisorRawReceiptEnvelopeV118,
  verifySupervisorRawReceiptV118,
  type SupervisorInvocationRequestV118,
  type SupervisorVerificationResultV118,
} from "./supervisor-contract.js"

export const NATIVE_SUPERVISOR_MANIFEST_SCHEMA_V118 =
  "runtime-native-supervisor-build-manifest-v1.18" as const
export const PINNED_RUNTIME_SUPERVISOR_BUILDER_IMAGE =
  "rust:1.95.0-alpine@sha256:e98196986adced5602f6e21c54babdbf2a8700400c7a78868324a3630e0c5d15" as const
export const PINNED_RUNTIME_SUPERVISOR_RUSTC =
  "rustc 1.95.0 (59807616e 2026-04-14)" as const
export const PINNED_RUNTIME_SUPERVISOR_CARGO =
  "cargo 1.95.0 (f2d3ce0bd 2026-03-21)" as const
export const PINNED_RUNTIME_SUPERVISOR_TARGET =
  "x86_64-unknown-linux-musl" as const

const SHA256 = /^sha256:[0-9a-f]{64}$/u
const NATIVE_RECEIPT_KEYS = [
  "schemaVersion",
  "requestSha256",
  "processGroupIdentitySha256",
  "guestNamespaceUid",
  "supervisorHostUid",
  "wallElapsedNanoseconds",
  "cpuUsageBeforeMicroseconds",
  "cpuUsageAfterMicroseconds",
  "memoryPeakBytes",
  "memoryEventsBefore",
  "memoryEventsAfter",
  "pidsEventsBefore",
  "pidsEventsAfter",
  "pidsPeak",
  "exitCode",
  "signal",
  "timedOut",
  "stdoutBase64",
  "stderrBase64",
  "stdoutTruncated",
  "stderrTruncated",
  "payloadTruncated",
  "cgroupEmpty",
] as const

export interface NativeSupervisorBuildManifestV118 {
  readonly schemaVersion: typeof NATIVE_SUPERVISOR_MANIFEST_SCHEMA_V118
  readonly sourceSha256: `sha256:${string}`
  readonly cargoLockSha256: `sha256:${string}`
  readonly seccompProfileSha256: `sha256:${string}`
  readonly builderImage: typeof PINNED_RUNTIME_SUPERVISOR_BUILDER_IMAGE
  readonly rustcVersion: typeof PINNED_RUNTIME_SUPERVISOR_RUSTC
  readonly cargoVersion: typeof PINNED_RUNTIME_SUPERVISOR_CARGO
  readonly target: typeof PINNED_RUNTIME_SUPERVISOR_TARGET
  readonly operatingSystem: "linux"
  readonly guestNamespaceUid: 65534
  readonly delegatedControllers: readonly ["cpu", "memory", "pids"]
  readonly binarySha256: `sha256:${string}`
}

export interface NativeSupervisorExpectedHashesV118 {
  readonly sourceSha256: `sha256:${string}`
  readonly cargoLockSha256: `sha256:${string}`
  readonly seccompProfileSha256: `sha256:${string}`
  readonly binarySha256: `sha256:${string}`
}

type NativeSpawn = (
  command: string,
  args: readonly string[],
  options: {
    encoding: "buffer"
    env: Record<string, string | undefined>
    input: Uint8Array
    maxBuffer: number
    shell: false
    timeout: number
  },
) => {
  readonly status: number | null
  readonly signal: string | null
  readonly stdout: Buffer
  readonly stderr: Buffer
  readonly error?: Error | undefined
}

const sha256 = (bytes: Uint8Array): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`

const exactKeys = (value: unknown, keys: readonly string[]): boolean =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.keys(value).length === keys.length &&
  keys.every((key) => Object.hasOwn(value, key))

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
    Object.freeze(value)
  }
  return value
}

export const verifyNativeSupervisorManifestV118 = (
  value: NativeSupervisorBuildManifestV118,
  expected: NativeSupervisorExpectedHashesV118,
): Readonly<NativeSupervisorBuildManifestV118> => {
  if (
    !exactKeys(value, [
      "schemaVersion",
      "sourceSha256",
      "cargoLockSha256",
      "seccompProfileSha256",
      "builderImage",
      "rustcVersion",
      "cargoVersion",
      "target",
      "operatingSystem",
      "guestNamespaceUid",
      "delegatedControllers",
      "binarySha256",
    ]) ||
    value.schemaVersion !== NATIVE_SUPERVISOR_MANIFEST_SCHEMA_V118 ||
    value.builderImage !== PINNED_RUNTIME_SUPERVISOR_BUILDER_IMAGE ||
    value.rustcVersion !== PINNED_RUNTIME_SUPERVISOR_RUSTC ||
    value.cargoVersion !== PINNED_RUNTIME_SUPERVISOR_CARGO ||
    value.target !== PINNED_RUNTIME_SUPERVISOR_TARGET ||
    value.operatingSystem !== "linux" ||
    value.guestNamespaceUid !== 65534 ||
    JSON.stringify(value.delegatedControllers) !==
      JSON.stringify(["cpu", "memory", "pids"]) ||
    !SHA256.test(value.sourceSha256) ||
    !SHA256.test(value.cargoLockSha256) ||
    !SHA256.test(value.seccompProfileSha256) ||
    !SHA256.test(value.binarySha256) ||
    value.sourceSha256 !== expected.sourceSha256 ||
    value.cargoLockSha256 !== expected.cargoLockSha256 ||
    value.seccompProfileSha256 !== expected.seccompProfileSha256 ||
    value.binarySha256 !== expected.binarySha256
  ) {
    throw new TypeError("Native supervisor manifest identity is invalid")
  }
  return deepFreeze(globalThis.structuredClone(value))
}

interface NativeReceipt {
  schemaVersion: "cowards-native-supervisor-receipt-v1"
  requestSha256: `sha256:${string}`
  processGroupIdentitySha256: `sha256:${string}`
  guestNamespaceUid: number
  supervisorHostUid: number
  wallElapsedNanoseconds: number
  cpuUsageBeforeMicroseconds: number
  cpuUsageAfterMicroseconds: number
  memoryPeakBytes: number
  memoryEventsBefore: Record<string, number>
  memoryEventsAfter: Record<string, number>
  pidsEventsBefore: { max: number }
  pidsEventsAfter: { max: number }
  pidsPeak: number
  exitCode: number | null
  signal: string | null
  timedOut: boolean
  stdoutBase64: string
  stderrBase64: string
  stdoutTruncated: boolean
  stderrTruncated: boolean
  payloadTruncated: boolean
  cgroupEmpty: boolean
}

const safeInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0

const parseCounterMap = (
  value: unknown,
  keys: readonly string[],
): Record<string, number> => {
  if (!exactKeys(value, keys))
    throw new TypeError("Native counter shape is invalid")
  const output: Record<string, number> = {}
  for (const key of keys) {
    const candidate = (value as Record<string, unknown>)[key]
    if (!safeInteger(candidate)) {
      throw new TypeError("Native counter value is invalid")
    }
    output[key] = candidate
  }
  return output
}

const parseNativeReceipt = (bytes: Uint8Array): NativeReceipt => {
  if (bytes.byteLength === 0 || bytes.byteLength > 256 * 1024) {
    throw new TypeError("Native receipt byte length is invalid")
  }
  const value = JSON.parse(
    new TextDecoder("utf-8", { fatal: true }).decode(bytes),
  )
  if (!exactKeys(value, NATIVE_RECEIPT_KEYS)) {
    throw new TypeError("Native receipt shape is invalid")
  }
  const record = value as Record<string, unknown>
  for (const key of ["requestSha256", "processGroupIdentitySha256"] as const) {
    if (typeof record[key] !== "string" || !SHA256.test(record[key])) {
      throw new TypeError("Native receipt identity is invalid")
    }
  }
  for (const key of [
    "guestNamespaceUid",
    "supervisorHostUid",
    "wallElapsedNanoseconds",
    "cpuUsageBeforeMicroseconds",
    "cpuUsageAfterMicroseconds",
    "memoryPeakBytes",
    "pidsPeak",
  ] as const) {
    if (!safeInteger(record[key])) {
      throw new TypeError("Native receipt counter is invalid")
    }
  }
  for (const key of [
    "timedOut",
    "stdoutTruncated",
    "stderrTruncated",
    "payloadTruncated",
    "cgroupEmpty",
  ] as const) {
    if (typeof record[key] !== "boolean") {
      throw new TypeError("Native receipt lifecycle is invalid")
    }
  }
  if (
    record.schemaVersion !== "cowards-native-supervisor-receipt-v1" ||
    record.guestNamespaceUid !== 65534 ||
    record.supervisorHostUid === record.guestNamespaceUid ||
    (record.exitCode !== null && !safeInteger(record.exitCode)) ||
    (record.signal !== null && typeof record.signal !== "string") ||
    typeof record.stdoutBase64 !== "string" ||
    typeof record.stderrBase64 !== "string"
  ) {
    throw new TypeError("Native receipt value is invalid")
  }
  const canonicalBase64 = (candidate: string): boolean =>
    Buffer.from(candidate, "base64").toString("base64") === candidate
  if (
    !canonicalBase64(record.stdoutBase64) ||
    !canonicalBase64(record.stderrBase64)
  ) {
    throw new TypeError("Native receipt output is invalid")
  }
  return {
    ...(record as unknown as NativeReceipt),
    memoryEventsBefore: parseCounterMap(record.memoryEventsBefore, [
      "high",
      "low",
      "max",
      "oom",
      "oom_group_kill",
      "oom_kill",
      "sock_throttled",
    ]),
    memoryEventsAfter: parseCounterMap(record.memoryEventsAfter, [
      "high",
      "low",
      "max",
      "oom",
      "oom_group_kill",
      "oom_kill",
      "sock_throttled",
    ]),
    pidsEventsBefore: parseCounterMap(record.pidsEventsBefore, ["max"]) as {
      max: number
    },
    pidsEventsAfter: parseCounterMap(record.pidsEventsAfter, ["max"]) as {
      max: number
    },
  }
}

const failure = (
  code:
    | "COUNTED_PLATFORM_UNAVAILABLE"
    | "IDENTITY_MISMATCH"
    | "RAW_RECEIPT_INVALID"
    | "RECEIPT_BINDING_MISMATCH",
): SupervisorVerificationResultV118 => ({
  ok: false,
  gameplayDisposition: "no_mutation",
  code,
})

export const runPinnedNativeSupervisorV118 = (input: {
  readonly platform: string
  readonly manifest: NativeSupervisorBuildManifestV118
  readonly expectedHashes: NativeSupervisorExpectedHashesV118
  readonly request: SupervisorInvocationRequestV118
  readonly binaryPath: string
  readonly cgroupRoot: string
  readonly spawnSync?: NativeSpawn | undefined
  readonly readBinary?: ((path: string) => Uint8Array) | undefined
}): SupervisorVerificationResultV118 => {
  if (input.platform !== "linux") return failure("COUNTED_PLATFORM_UNAVAILABLE")
  let manifest: Readonly<NativeSupervisorBuildManifestV118>
  try {
    manifest = verifyNativeSupervisorManifestV118(
      input.manifest,
      input.expectedHashes,
    )
    if (
      manifest.binarySha256 !==
      input.request.invocation.expectedIdentity.supervisorBinarySha256
    ) {
      return failure("IDENTITY_MISMATCH")
    }
    const binaryBytes = (input.readBinary ?? readFileSync)(input.binaryPath)
    if (sha256(binaryBytes) !== manifest.binarySha256) {
      return failure("IDENTITY_MISMATCH")
    }
  } catch {
    return failure("IDENTITY_MISMATCH")
  }
  const request = input.request
  const result = (input.spawnSync ?? spawnSync)(
    input.binaryPath,
    [
      "run",
      "--cgroup-root",
      input.cgroupRoot,
      "--nonce",
      request.invocation.hostNonce,
      "--cpu-quota-us",
      String(request.invocation.limits.cpuMax.quotaMicroseconds),
      "--cpu-period-us",
      String(request.invocation.limits.cpuMax.periodMicroseconds),
      "--memory-max-bytes",
      String(request.invocation.limits.memoryMaxBytes),
      "--pids-max",
      String(request.invocation.limits.pidsMax),
      "--guest-namespace-uid",
      String(manifest.guestNamespaceUid),
      "--deadline-ms",
      String(request.invocation.limits.wallMilliseconds),
      "--stdout-max",
      String(request.invocation.limits.stdoutBytes),
      "--stderr-max",
      String(request.invocation.limits.stderrBytes),
      "--payload-max",
      String(request.invocation.limits.payloadBytes),
      "--request-sha256",
      request.invocation.requestSha256,
      "--process-group-sha256",
      request.expectedProcessGroupIdentitySha256,
      "--input-path",
      "/proc/self/fd/0",
      "--",
      request.execution.executablePath,
      ...request.execution.argv,
    ],
    {
      encoding: "buffer",
      env: Object.fromEntries(
        request.execution.environment.map(({ name, value }) => [name, value]),
      ),
      input: Buffer.from(request.input.bytesBase64, "base64"),
      maxBuffer:
        request.invocation.limits.payloadBytes +
        request.invocation.limits.stdoutBytes +
        request.invocation.limits.stderrBytes +
        256 * 1024,
      shell: false,
      timeout:
        request.invocation.limits.wallMilliseconds +
        request.invocation.limits.terminationGraceMilliseconds,
    },
  )
  if (result.error || result.status !== 0 || result.signal !== null) {
    return failure("RAW_RECEIPT_INVALID")
  }
  try {
    const native = parseNativeReceipt(result.stdout)
    if (
      native.requestSha256 !== request.invocation.requestSha256 ||
      native.processGroupIdentitySha256 !==
        request.expectedProcessGroupIdentitySha256
    ) {
      return failure("RECEIPT_BINDING_MISMATCH")
    }
    const payloadBytes = Buffer.from(native.stdoutBase64, "base64")
    const stdoutBytes = payloadBytes
    const stderrBytes = Buffer.from(native.stderrBase64, "base64")
    const memory = (events: Record<string, number>) => ({
      low: events.low!,
      high: events.high!,
      max: events.max!,
      oom: events.oom!,
      oomKill: events.oom_kill!,
      oomGroupKill: events.oom_group_kill!,
    })
    const rawReceipt: RuntimeSupervisorRawReceiptV118 = {
      schemaVersion: "runtime-supervisor-raw-receipt-v1.18",
      runtimeAbiVersion: "strategy-runtime-abi-v1.18",
      requestId: request.invocation.requestId,
      invocationId: request.invocation.invocationId,
      method: request.invocation.method,
      hostNonce: request.invocation.hostNonce,
      requestSha256: request.invocation.requestSha256,
      budgetProfileSha256: RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
      platform: {
        operatingSystem: "linux",
        cgroupVersion: 2,
        cgroupDriver: "cgroupfs",
        delegatedControllers: ["cpu", "memory", "pids"],
      },
      limits: request.invocation.limits,
      cgroup: request.invocation.expectedCgroup,
      wall: {
        supervisedSpawnMonotonicNanoseconds: 0,
        processGroupReapedMonotonicNanoseconds: native.wallElapsedNanoseconds,
        elapsedNanoseconds: native.wallElapsedNanoseconds,
        wallMilliseconds: Math.ceil(native.wallElapsedNanoseconds / 1_000_000),
      },
      cpu: {
        baselineUsageMicroseconds: native.cpuUsageBeforeMicroseconds,
        finalUsageMicroseconds: native.cpuUsageAfterMicroseconds,
        computeFuel:
          (native.cpuUsageAfterMicroseconds -
            native.cpuUsageBeforeMicroseconds) *
          1_000,
      },
      memory: {
        peakBytes: native.memoryPeakBytes,
        eventsBefore: memory(native.memoryEventsBefore),
        eventsAfter: memory(native.memoryEventsAfter),
      },
      pids: {
        currentBefore: 0,
        currentPeak: native.pidsPeak,
        currentAfter: 0,
        eventsBefore: native.pidsEventsBefore,
        eventsAfter: native.pidsEventsAfter,
      },
      bytes: {
        payloadBytes: payloadBytes.byteLength,
        stdoutBytes: stdoutBytes.byteLength,
        stderrBytes: stderrBytes.byteLength,
        payloadTruncated: native.payloadTruncated,
        stdoutTruncated: native.stdoutTruncated,
        stderrTruncated: native.stderrTruncated,
      },
      lifecycle: {
        exitCode: native.exitCode,
        signal: native.signal,
        cancellationRequested: native.timedOut,
        cancellationWinner: native.timedOut ? "host" : "none",
        cgroupKillUsed: native.timedOut,
        lateResultDiscarded: native.timedOut,
      },
      containment: {
        processGroupIdentitySha256: native.processGroupIdentitySha256,
        cgroupEmpty: native.cgroupEmpty,
        escapedProcessCount: 0,
        lingeringProcessCount: 0,
      },
      identity: request.invocation.expectedIdentity,
      attribution: native.timedOut ? "host" : "proven_strategy",
    }
    const observed = { payloadBytes, stdoutBytes, stderrBytes }
    const envelope = createSupervisorRawReceiptEnvelopeV118({
      request,
      receipt: rawReceipt,
      observed,
    })
    return verifySupervisorRawReceiptV118({
      request,
      rawReceiptBytes: serializeSupervisorRawReceiptEnvelopeV118(envelope),
      observed,
    })
  } catch {
    return failure("RAW_RECEIPT_INVALID")
  }
}
