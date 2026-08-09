import type { SpawnSyncReturns } from "node:child_process"
import { Buffer } from "node:buffer"

export const V138_CURRENT_MATRIX_CHILD_PROTOCOL_SCHEMA =
  "v1.38-current-matrix-child-failure-v1" as const

export const V138_CURRENT_MATRIX_CHILD_PROTOCOL_MAX_BYTES = 256 as const

export const V138_CURRENT_MATRIX_CHILD_PROTOCOL_V2_SCHEMA =
  "v1.38-current-matrix-child-control-v2" as const

export const V138_CURRENT_MATRIX_CHILD_PROTOCOL_V2_MAX_BYTES = 512 as const

export const V138_CURRENT_MATRIX_CHILD_INTEGRITY_FAMILIES = Object.freeze([
  "CHILD_BOOTSTRAP_FAILED",
  "CHILD_TRANSPORT_FAILED",
  "RUNTIME_EXECUTION_FAILED",
  "SHARD_COORDINATION_FAILED",
] as const)

export type V138CurrentMatrixChildIntegrityFamily =
  (typeof V138_CURRENT_MATRIX_CHILD_INTEGRITY_FAMILIES)[number]

export type V138CurrentMatrixChildProtocolV2Terminal =
  | "success"
  | "RUNTIME_EXECUTION_FAILED"
  | "SHARD_COORDINATION_FAILED"

export interface V138CurrentMatrixChildProtocolV2State {
  readonly ready: true
  readonly terminal: V138CurrentMatrixChildProtocolV2Terminal
}

export type V138CurrentMatrixChildProtocolV2Classification =
  | Readonly<{ classification: "success" }>
  | Readonly<{
      classification: "system_failure"
      code: V138CurrentMatrixChildIntegrityFamily
      retryable: false
    }>

export interface V138CurrentMatrixChildProtocolV2Observation {
  readonly spawned: boolean
  readonly controlBytes: Uint8Array
  readonly stderrBytes: Uint8Array
  readonly exitStatus: number | null
  readonly signal: string | null
  readonly timedOut: boolean
}

export const V138_CURRENT_MATRIX_CHILD_FAILURE_CODES = Object.freeze([
  "RESOURCE_SAMPLER_SPAWN_DENIED",
  "RESOURCE_MEASUREMENT_UNAVAILABLE",
  "RESOURCE_POLICY_CHILD_RSS",
  "RESOURCE_POLICY_AGGREGATE_RSS",
  "RESOURCE_POLICY_HOST_HEADROOM",
  "RESOURCE_POLICY_SHARD_TIMEOUT",
  "RESOURCE_POLICY_TOTAL_TIMEOUT",
  "RESOURCE_POLICY_SHARD_OUTPUT_INVALID",
  "RESOURCE_POLICY_SHARD_SPAWN_FAILED",
  "RESOURCE_POLICY_SHARD_FAILED",
  "SHARD_EXECUTION_FAILED",
  "SHARD_RUNNER_EXCEPTION",
  "CLEANUP_PROOF_FAILED",
  "PARENT_EXCEPTION",
  "PARENT_INTERRUPT",
] as const)

export type V138CurrentMatrixChildFailureCode =
  (typeof V138_CURRENT_MATRIX_CHILD_FAILURE_CODES)[number]

export interface V138CurrentMatrixChildFailureMessage {
  readonly schemaVersion: typeof V138_CURRENT_MATRIX_CHILD_PROTOCOL_SCHEMA
  readonly failureCode: V138CurrentMatrixChildFailureCode
}

export interface V138CurrentMatrixPublicFailureClassification {
  readonly classification: "system_failure"
  readonly code: V138CurrentMatrixChildFailureCode
  readonly retryable: false
}

const failureCodes = new Set<string>(V138_CURRENT_MATRIX_CHILD_FAILURE_CODES)
const integrityFamilies = new Set<string>(
  V138_CURRENT_MATRIX_CHILD_INTEGRITY_FAMILIES,
)

const fail = (code: string): never => {
  throw new TypeError(code)
}

const exactKeys = (value: Record<string, unknown>, keys: readonly string[]) => {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length &&
    actual.every((key, index) => key === expected[index])
}

export const checkV138CurrentMatrixChildFailureMessage = (
  value: unknown,
): Readonly<V138CurrentMatrixChildFailureMessage> => {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    !exactKeys(value as Record<string, unknown>, [
      "schemaVersion",
      "failureCode",
    ])
  ) fail("V138_CHILD_PROTOCOL_SCHEMA_INVALID")
  const message = value as Record<string, unknown>
  if (
    message.schemaVersion !== V138_CURRENT_MATRIX_CHILD_PROTOCOL_SCHEMA ||
    typeof message.failureCode !== "string" ||
    !failureCodes.has(message.failureCode)
  ) fail("V138_CHILD_PROTOCOL_CODE_INVALID")
  return Object.freeze({
    schemaVersion: V138_CURRENT_MATRIX_CHILD_PROTOCOL_SCHEMA,
    failureCode: message.failureCode as V138CurrentMatrixChildFailureCode,
  })
}

export const classifyV138CurrentMatrixChildFailure = (
  value: unknown,
): Readonly<V138CurrentMatrixPublicFailureClassification> => {
  const message = checkV138CurrentMatrixChildFailureMessage(value)
  return Object.freeze({
    classification: "system_failure" as const,
    code: message.failureCode,
    retryable: false as const,
  })
}

const decodeUtf8 = (bytes: Uint8Array): string => {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes)
  } catch {
    return fail("V138_CHILD_PROTOCOL_ENCODING_INVALID")
  }
}

const canonicalV2Ready = (): string => `${JSON.stringify({
  frame: "ready",
  schemaVersion: V138_CURRENT_MATRIX_CHILD_PROTOCOL_V2_SCHEMA,
})}\n`

const canonicalV2Terminal = (
  outcome: V138CurrentMatrixChildProtocolV2Terminal,
): string => outcome === "success"
  ? `${JSON.stringify({
      frame: "terminal",
      outcome,
      schemaVersion: V138_CURRENT_MATRIX_CHILD_PROTOCOL_V2_SCHEMA,
    })}\n`
  : `${JSON.stringify({
      failureFamily: outcome,
      frame: "terminal",
      outcome: "integrity_failure",
      schemaVersion: V138_CURRENT_MATRIX_CHILD_PROTOCOL_V2_SCHEMA,
    })}\n`

export const encodeV138CurrentMatrixChildProtocolV2Ready = (): Buffer =>
  Buffer.from(canonicalV2Ready(), "utf8")

export const encodeV138CurrentMatrixChildProtocolV2Terminal = (
  outcome: V138CurrentMatrixChildProtocolV2Terminal,
): Buffer => {
  if (outcome !== "success" && !integrityFamilies.has(outcome)) {
    fail("V138_CHILD_PROTOCOL_V2_TERMINAL_INVALID")
  }
  if (outcome === "CHILD_BOOTSTRAP_FAILED" ||
      outcome === "CHILD_TRANSPORT_FAILED") {
    fail("V138_CHILD_PROTOCOL_V2_PARENT_FAMILY_INVALID")
  }
  return Buffer.from(canonicalV2Terminal(outcome), "utf8")
}

const parseV2Frame = (bytes: Buffer, expected: "ready" | "terminal") => {
  const decoded = decodeUtf8(bytes)
  if (!decoded.endsWith("\n") || /[\r\n]/u.test(decoded.slice(0, -1))) {
    fail("V138_CHILD_PROTOCOL_V2_FRAME_BOUNDARY_INVALID")
  }
  let value: unknown
  try {
    value = JSON.parse(decoded.slice(0, -1))
  } catch {
    fail("V138_CHILD_PROTOCOL_V2_JSON_INVALID")
  }
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    fail("V138_CHILD_PROTOCOL_V2_SCHEMA_INVALID")
  }
  const frame = value as Record<string, unknown>
  if (frame.schemaVersion !== V138_CURRENT_MATRIX_CHILD_PROTOCOL_V2_SCHEMA ||
      frame.frame !== expected) {
    fail("V138_CHILD_PROTOCOL_V2_DISCRIMINANT_INVALID")
  }
  if (expected === "ready") {
    if (!exactKeys(frame, ["frame", "schemaVersion"]) ||
        decoded !== canonicalV2Ready()) {
      fail("V138_CHILD_PROTOCOL_V2_READY_INVALID")
    }
    return "ready" as const
  }
  if (frame.outcome === "success") {
    if (!exactKeys(frame, ["frame", "outcome", "schemaVersion"]) ||
        decoded !== canonicalV2Terminal("success")) {
      fail("V138_CHILD_PROTOCOL_V2_TERMINAL_INVALID")
    }
    return "success" as const
  }
  if (!exactKeys(frame, [
    "failureFamily", "frame", "outcome", "schemaVersion",
  ]) || frame.outcome !== "integrity_failure" ||
      (frame.failureFamily !== "RUNTIME_EXECUTION_FAILED" &&
        frame.failureFamily !== "SHARD_COORDINATION_FAILED")) {
    fail("V138_CHILD_PROTOCOL_V2_TERMINAL_INVALID")
  }
  const failureFamily = frame.failureFamily as
    | "RUNTIME_EXECUTION_FAILED"
    | "SHARD_COORDINATION_FAILED"
  if (decoded !== canonicalV2Terminal(failureFamily)) {
    fail("V138_CHILD_PROTOCOL_V2_CANONICAL_BYTES_INVALID")
  }
  return failureFamily
}

export const decodeV138CurrentMatrixChildProtocolV2 = (
  bytes: Uint8Array,
): Readonly<V138CurrentMatrixChildProtocolV2State> => {
  if (bytes.byteLength === 0 ||
      bytes.byteLength > V138_CURRENT_MATRIX_CHILD_PROTOCOL_V2_MAX_BYTES) {
    fail("V138_CHILD_PROTOCOL_V2_SIZE_INVALID")
  }
  const buffer = Buffer.from(bytes)
  const firstBoundary = buffer.indexOf(0x0a)
  if (firstBoundary < 0 || firstBoundary === buffer.byteLength - 1 ||
      buffer[buffer.byteLength - 1] !== 0x0a ||
      buffer.indexOf(0x0a, firstBoundary + 1) !== buffer.byteLength - 1) {
    fail("V138_CHILD_PROTOCOL_V2_CARDINALITY_INVALID")
  }
  const readyBytes = buffer.subarray(0, firstBoundary + 1)
  const terminalBytes = buffer.subarray(firstBoundary + 1)
  parseV2Frame(readyBytes, "ready")
  const terminal = parseV2Frame(terminalBytes, "terminal")
  return Object.freeze({ ready: true as const, terminal })
}

const protocolV2Failure = (
  code: V138CurrentMatrixChildIntegrityFamily,
): Readonly<V138CurrentMatrixChildProtocolV2Classification> => Object.freeze({
  classification: "system_failure" as const,
  code,
  retryable: false as const,
})

export const reduceV138CurrentMatrixChildProtocolV2Observation = (
  observation: Readonly<V138CurrentMatrixChildProtocolV2Observation>,
): Readonly<V138CurrentMatrixChildProtocolV2Classification> => {
  if (!observation.spawned) return protocolV2Failure("CHILD_TRANSPORT_FAILED")
  const canonicalReady = encodeV138CurrentMatrixChildProtocolV2Ready()
  const observedReady = observation.controlBytes.byteLength >=
      canonicalReady.byteLength &&
    Buffer.from(observation.controlBytes)
      .subarray(0, canonicalReady.byteLength)
      .equals(canonicalReady)
  if (!observedReady) return protocolV2Failure("CHILD_BOOTSTRAP_FAILED")
  if (observation.stderrBytes.byteLength !== 0) {
    return protocolV2Failure("CHILD_TRANSPORT_FAILED")
  }
  let state: Readonly<V138CurrentMatrixChildProtocolV2State>
  try {
    state = decodeV138CurrentMatrixChildProtocolV2(observation.controlBytes)
  } catch {
    return protocolV2Failure("CHILD_TRANSPORT_FAILED")
  }
  if (state.terminal === "RUNTIME_EXECUTION_FAILED" ||
      state.terminal === "SHARD_COORDINATION_FAILED") {
    return protocolV2Failure(state.terminal)
  }
  if (observation.timedOut || observation.exitStatus !== 0 ||
      observation.signal !== null) {
    return protocolV2Failure("CHILD_TRANSPORT_FAILED")
  }
  return Object.freeze({ classification: "success" as const })
}

export const decodeV138CurrentMatrixChildProtocolResult = (
  result: Pick<SpawnSyncReturns<Buffer>,
    "stdout" | "stderr" | "status" | "signal" | "error">,
): Readonly<V138CurrentMatrixPublicFailureClassification> => {
  if (result.error !== undefined || result.status !== 0 ||
    result.signal !== null) {
    fail("V138_CHILD_PROTOCOL_EXIT_INVALID")
  }
  if (result.stderr.byteLength !== 0) {
    fail("V138_CHILD_PROTOCOL_STDERR_INVALID")
  }
  if (result.stdout.byteLength === 0 ||
    result.stdout.byteLength > V138_CURRENT_MATRIX_CHILD_PROTOCOL_MAX_BYTES) {
    fail("V138_CHILD_PROTOCOL_SIZE_INVALID")
  }
  const decoded = decodeUtf8(result.stdout)
  if (!decoded.endsWith("\n") || decoded.slice(0, -1).includes("\n") ||
    decoded.slice(0, -1).includes("\r")) {
    fail("V138_CHILD_PROTOCOL_MESSAGE_COUNT_INVALID")
  }
  let value: unknown
  try {
    value = JSON.parse(decoded.slice(0, -1))
  } catch {
    fail("V138_CHILD_PROTOCOL_JSON_INVALID")
  }
  const checked = checkV138CurrentMatrixChildFailureMessage(value)
  const expected = canonicalMessage(checked.failureCode)
  if (!result.stdout.equals(Buffer.from(expected, "utf8"))) {
    // This also rejects duplicate JSON keys: JSON.parse would otherwise keep
    // only the final occurrence and silently normalize ambiguous bytes.
    fail("V138_CHILD_PROTOCOL_CANONICAL_BYTES_INVALID")
  }
  return classifyV138CurrentMatrixChildFailure(checked)
}

const canonicalMessage = (failureCode: V138CurrentMatrixChildFailureCode) =>
  `${JSON.stringify({
    failureCode,
    schemaVersion: V138_CURRENT_MATRIX_CHILD_PROTOCOL_SCHEMA,
  })}\n`
