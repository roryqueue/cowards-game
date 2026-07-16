import { createHash } from "node:crypto"
import { encodeCanonicalJson } from "./canonical-json-encode.js"
import type { JsonValue } from "./types.js"

const KiB = 1024
const MiB = 1024 * KiB
const CPU_NANOSECONDS_PER_USAGE_MICROSECOND = 1000
const NANOSECONDS_PER_MILLISECOND = 1_000_000

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
    Object.freeze(value)
  }
  return value
}

const nonnegativeSafeInteger = (value: number, name: string): number => {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`${name} must be a nonnegative safe integer`)
  }
  return value
}

const positiveSafeInteger = (value: number, name: string): number => {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new TypeError(`${name} must be a positive safe integer`)
  }
  return value
}

const framedLength = (length: number): Uint8Array => {
  const bytes = new Uint8Array(8)
  new DataView(bytes.buffer).setBigUint64(0, BigInt(length), false)
  return bytes
}

const frame = (segments: readonly Uint8Array[]): Uint8Array => {
  const byteLength = segments.reduce(
    (total, segment) => total + 8 + segment.byteLength,
    0,
  )
  const output = new Uint8Array(byteLength)
  let offset = 0
  for (const segment of segments) {
    output.set(framedLength(segment.byteLength), offset)
    offset += 8
    output.set(segment, offset)
    offset += segment.byteLength
  }
  return output
}

export type RuntimeInvocationMethodV118 =
  | "selectActivations"
  | "soldierBrain"

export interface RuntimeInvocationLimitsV118 {
  readonly wallMilliseconds: number
  readonly computeFuel: number
  readonly memoryMaxBytes: number
  readonly pidsMax: number
  readonly payloadBytes: number
  readonly stdoutBytes: number
  readonly stderrBytes: number
  readonly cpuMax: Readonly<{
    quotaMicroseconds: number
    periodMicroseconds: number
  }>
  readonly terminationGraceMilliseconds: number
}

const invocationLimits = deepFreeze({
  wallMilliseconds: 50,
  computeFuel: 100_000_000,
  memoryMaxBytes: 64 * MiB,
  pidsMax: 64,
  payloadBytes: 256 * KiB,
  stdoutBytes: 256 * KiB,
  stderrBytes: 64 * KiB,
  cpuMax: {
    quotaMicroseconds: 100_000,
    periodMicroseconds: 100_000,
  },
  terminationGraceMilliseconds: 100,
} as const satisfies RuntimeInvocationLimitsV118)

export const RUNTIME_BUDGET_PROFILE_V1_18_DOMAIN =
  "cowards-game:runtime-budget-profile:v1.18" as const

/**
 * Additive counted-runtime profile. Numeric v1.17 values remain untouched and
 * independently dispatchable; v1.18 gives the quantitative fields new,
 * language-neutral cgroup-v2 meanings and therefore a distinct identity root.
 */
export const RUNTIME_BUDGET_PROFILE_V1_18 = deepFreeze({
  schemaVersion: "runtime-budget-profile-v1.18",
  runtimeAbiVersion: "strategy-runtime-abi-v1.18",
  additiveFromRuntimeAbiVersion: "strategy-runtime-abi-v1.17",
  identityDomain: RUNTIME_BUDGET_PROFILE_V1_18_DOMAIN,
  countedPlatform: {
    operatingSystem: "linux",
    cgroupVersion: 2,
    cgroupDriver: "cgroupfs",
    delegatedControllers: ["cpu", "memory", "pids"],
    nativeMacosDisposition: "proof-only-non-counted",
    otherPlatformDisposition: "fail-closed-system-failure",
  },
  meters: {
    wallMilliseconds: {
      source: "monotonic-elapsed-nanoseconds",
      unit: "milliseconds",
      rounding: "ceil-to-whole-millisecond",
      boundary:
        "immediately-before-supervised-spawn-through-fully-reaped-process-group",
    },
    computeFuel: {
      source: "cgroup-v2-cpu.stat-usage_usec",
      unit: "aggregate-cpu-nanoseconds",
      multiplier: CPU_NANOSECONDS_PER_USAGE_MICROSECOND,
      quantum: CPU_NANOSECONDS_PER_USAGE_MICROSECOND,
      calculation: "final-minus-baseline-then-multiply",
      aggregation: "all-cgroup-threads-and-descendants",
      prohibitedSubstitutes: [
        "instruction-fuel",
        "per-process-rusage",
        "wasmtime-fuel",
      ],
    },
    memoryPeakBytes: {
      source: "cgroup-v2-memory.peak",
      unit: "bytes",
      aggregation: "complete-invocation-cgroup",
    },
    pids: {
      sources: ["pids.current", "pids.events"],
      unit: "kernel-tasks",
      aggregation: "complete-invocation-cgroup",
    },
    memoryEvents: {
      source: "cgroup-v2-memory.events",
      fields: ["low", "high", "max", "oom", "oomKill", "oomGroupKill"],
      semantics: "final-minus-baseline-nondecreasing-counters",
    },
    bytes: {
      payload: "exact-canonical-payload-bytes-at-request-write-boundary",
      stdout: "exact-raw-captured-stdout-bytes",
      stderr: "exact-raw-captured-stderr-bytes",
      overflow:
        "accept-exact-N-reject-N-plus-1-never-accept-truncated-success",
    },
    cancellation: {
      boundary: "process-group-plus-cgroup-kill-through-empty-cgroup",
      lateResult: "discard",
      ambiguousRace: "system-failure-no-mutation",
    },
  },
  invocations: {
    selectActivations: invocationLimits,
    soldierBrain: invocationLimits,
  },
  matchCumulative: {
    invocationCountMaximum: 260,
    wallMilliseconds: 13_000,
    computeFuel: 26_000_000_000,
    memoryPeakBytes: 64 * MiB,
    payloadBytes: 68_157_440,
    stdoutBytes: 68_157_440,
    stderrBytes: 17_039_360,
    pidsMax: invocationLimits.pidsMax,
    overflow: "stop-before-next-invocation-and-classify-by-proven-cause",
  },
  failureOwnership: {
    success: "commit-validated-values",
    playerViolation:
      "apply-only-canonical-player-consequence-discard-proposed-values",
    systemFailure: "no-gameplay-or-memory-mutation",
    unavailableOrAmbiguousEvidence: "system-failure",
  },
} as const)

const encodedProfile = encodeCanonicalJson(
  RUNTIME_BUDGET_PROFILE_V1_18 as unknown as JsonValue,
  { context: "canonical-manifest" },
)

if (!encodedProfile.ok) {
  throw new TypeError(
    `Runtime budget profile v1.18 is not canonical: ${encodedProfile.error.code}`,
  )
}

export const RUNTIME_BUDGET_PROFILE_V1_18_SHA256 =
  `sha256:${createHash("sha256")
    .update(
      frame([
        new TextEncoder().encode(RUNTIME_BUDGET_PROFILE_V1_18_DOMAIN),
        encodedProfile.bytes,
      ]),
    )
    .digest("hex")}` as const

export const computeFuelFromCpuUsageUsecV118 = (
  baselineUsageMicroseconds: number,
  finalUsageMicroseconds: number,
): number => {
  const baseline = nonnegativeSafeInteger(
    baselineUsageMicroseconds,
    "baseline usage",
  )
  const final = nonnegativeSafeInteger(finalUsageMicroseconds, "final usage")
  if (final < baseline) {
    throw new RangeError("final usage must not precede baseline")
  }
  const delta = final - baseline
  const computeFuel = delta * CPU_NANOSECONDS_PER_USAGE_MICROSECOND
  if (!Number.isSafeInteger(computeFuel)) {
    throw new RangeError("computeFuel must remain a safe integer")
  }
  return computeFuel
}

export const wallMillisecondsFromMonotonicNanosecondsV118 = (
  supervisedSpawnMonotonicNanoseconds: number,
  processGroupReapedMonotonicNanoseconds: number,
): number => {
  const spawn = nonnegativeSafeInteger(
    supervisedSpawnMonotonicNanoseconds,
    "spawn time",
  )
  const reaped = nonnegativeSafeInteger(
    processGroupReapedMonotonicNanoseconds,
    "reap time",
  )
  if (reaped < spawn) {
    throw new RangeError("reap time must not precede spawn")
  }
  return Math.ceil((reaped - spawn) / NANOSECONDS_PER_MILLISECOND)
}

export const getRuntimeInvocationLimitsV118 = (
  method: RuntimeInvocationMethodV118,
): Readonly<RuntimeInvocationLimitsV118> =>
  RUNTIME_BUDGET_PROFILE_V1_18.invocations[method]

export const classifyRuntimeLimitComparisonV118 = (
  dimension: string,
  observedInput: number,
  maximumInput: number,
): Readonly<{
  withinLimit: boolean
  dimension: string
  observed: number
  maximum: number
}> => {
  const observed = nonnegativeSafeInteger(observedInput, "observed value")
  const maximum = positiveSafeInteger(maximumInput, "positive maximum")
  return Object.freeze({
    withinLimit: observed <= maximum,
    dimension,
    observed,
    maximum,
  })
}

export const cloneRuntimeBudgetProfileV118 = (): typeof RUNTIME_BUDGET_PROFILE_V1_18 =>
  structuredClone(RUNTIME_BUDGET_PROFILE_V1_18)
