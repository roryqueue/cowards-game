import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"

export const V138_DARWIN_HEADROOM_METRIC_ID =
  "darwin-memorystatus-effective-available-basis-points-v1" as const
export const V138_DARWIN_HEADROOM_PROVIDER_ID =
  "apple-memory-pressure-q-v1" as const
export const V138_DARWIN_HEADROOM_PARSER_ID =
  "apple-memory-pressure-q-c-locale-parser-v1" as const
export const V138_DARWIN_HEADROOM_THRESHOLD_BASIS_POINTS = 2_500 as const

export const MEMORY_PRESSURE_Q_REQUEST = Object.freeze({
  executable: "/usr/bin/memory_pressure" as const,
  args: Object.freeze(["-Q"] as const),
  env: Object.freeze({
    LC_ALL: "C" as const,
    LANG: "C" as const,
    PATH: "/usr/bin:/bin:/usr/sbin:/sbin" as const,
  }),
  stdin: "ignore" as const,
  timeoutMilliseconds: 200 as const,
  maximumOutputBytes: 4_096 as const,
  shell: false as const,
})

export interface MemoryPressureQCommandResult {
  readonly stdout: Uint8Array
  readonly stderr: Uint8Array
  readonly exitCode: number | null
  readonly signal: NodeJS.Signals | null
  readonly timedOut: boolean
}

export interface V138DarwinHeadroomObservation {
  readonly metricId: typeof V138_DARWIN_HEADROOM_METRIC_ID
  readonly providerId: typeof V138_DARWIN_HEADROOM_PROVIDER_ID
  readonly parserId: typeof V138_DARWIN_HEADROOM_PARSER_ID
  readonly stdoutByteLength: number
  readonly stdoutSha256: `sha256:${string}`
  readonly totalBytes: number
  readonly pageCount: number
  readonly pageSizeBytes: number
  readonly percentage: number
  readonly observedBasisPoints: number
  readonly disposition: "preflight_admitted" | "preflight_refused"
}

export type V138DarwinHeadroomResult =
  | Readonly<{ ok: true; observation: Readonly<V138DarwinHeadroomObservation> }>
  | Readonly<{
      ok: false
      reason: "resource_measurement_unavailable"
    }>

const unavailable = Object.freeze({
  ok: false as const,
  reason: "resource_measurement_unavailable" as const,
})

const exactOutput =
  /^The system has ([1-9][0-9]*) \(([1-9][0-9]*) pages with a page size of ([1-9][0-9]*)\)\.\nSystem-wide memory free percentage: (100|[1-9]?[0-9])%\n$/u

const safePositiveInteger = (value: string): number | undefined => {
  if (!/^[1-9][0-9]*$/u.test(value)) return undefined
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined
}

/**
 * Pure parser for the exact C-locale `memory_pressure -Q` contract.
 * The raw host bytes never cross the return boundary.
 */
export const parseMemoryPressureQ = (
  result: Readonly<MemoryPressureQCommandResult>,
): V138DarwinHeadroomResult => {
  if (
    !(result.stdout instanceof Uint8Array) ||
    !(result.stderr instanceof Uint8Array) ||
    result.exitCode !== 0 ||
    result.signal !== null ||
    result.timedOut ||
    result.stderr.byteLength !== 0 ||
    result.stdout.byteLength === 0 ||
    result.stdout.byteLength > MEMORY_PRESSURE_Q_REQUEST.maximumOutputBytes ||
    result.stdout.includes(0)
  ) {
    return unavailable
  }
  const decoder = new TextDecoder("utf-8", { fatal: true })
  let text: string
  try {
    text = decoder.decode(result.stdout)
  } catch {
    return unavailable
  }
  const match = exactOutput.exec(text)
  if (match === null) return unavailable
  const totalBytes = safePositiveInteger(match[1]!)
  const pageCount = safePositiveInteger(match[2]!)
  const pageSizeBytes = safePositiveInteger(match[3]!)
  const percentage = Number(match[4])
  if (
    totalBytes === undefined ||
    pageCount === undefined ||
    pageSizeBytes === undefined ||
    !Number.isSafeInteger(percentage) ||
    percentage < 0 ||
    percentage > 100 ||
    pageCount !== Math.floor(totalBytes / pageSizeBytes)
  ) {
    return unavailable
  }
  const observedBasisPoints = percentage * 100
  const observation = Object.freeze({
    metricId: V138_DARWIN_HEADROOM_METRIC_ID,
    providerId: V138_DARWIN_HEADROOM_PROVIDER_ID,
    parserId: V138_DARWIN_HEADROOM_PARSER_ID,
    stdoutByteLength: result.stdout.byteLength,
    stdoutSha256: `sha256:${createHash("sha256")
      .update(result.stdout)
      .digest("hex")}` as const,
    totalBytes,
    pageCount,
    pageSizeBytes,
    percentage,
    observedBasisPoints,
    disposition:
      observedBasisPoints >= V138_DARWIN_HEADROOM_THRESHOLD_BASIS_POINTS
        ? ("preflight_admitted" as const)
        : ("preflight_refused" as const),
  })
  return Object.freeze({ ok: true as const, observation })
}

export type V138DarwinHeadroomExecutor = (
  request: typeof MEMORY_PRESSURE_Q_REQUEST,
) => Promise<Readonly<MemoryPressureQCommandResult>>

/**
 * Injected provider boundary. Production wiring supplies one bounded process
 * invocation; tests supply bytes and can prove that no host observation occurs.
 */
export const observeDarwinHeadroom = async (
  execute: V138DarwinHeadroomExecutor,
): Promise<V138DarwinHeadroomResult> => {
  let owned: MemoryPressureQCommandResult | undefined
  try {
    const result = await execute(MEMORY_PRESSURE_Q_REQUEST)
    // The live adapter takes ownership of mutable copies so the command-result
    // object and its diagnostic buffers never cross the projection boundary.
    owned = {
      stdout: Uint8Array.from(result.stdout),
      stderr: Uint8Array.from(result.stderr),
      exitCode: result.exitCode,
      signal: result.signal,
      timedOut: result.timedOut,
    }
    return parseMemoryPressureQ(owned)
  } catch {
    return unavailable
  } finally {
    // JavaScript cannot guarantee when the decoder's immutable string is
    // collected. It can guarantee that the owned mutable diagnostic buffers
    // are overwritten immediately after validation, digest, and projection.
    owned?.stdout.fill(0)
    owned?.stderr.fill(0)
    owned = undefined
  }
}
