import type { SpawnSyncReturns } from "node:child_process"
import { Buffer } from "node:buffer"
import { fileURLToPath } from "node:url"

export const V138_CURRENT_MATRIX_CHILD_PROTOCOL_SCHEMA =
  "v1.38-current-matrix-child-failure-v1" as const

export const V138_CURRENT_MATRIX_CHILD_PROTOCOL_MAX_BYTES = 256 as const

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
  return classifyV138CurrentMatrixChildFailure(value)
}

const canonicalMessage = (failureCode: V138CurrentMatrixChildFailureCode) =>
  `${JSON.stringify({
    failureCode,
    schemaVersion: V138_CURRENT_MATRIX_CHILD_PROTOCOL_SCHEMA,
  })}\n`

const runProtocolFixtureChild = (): void => {
  if (process.argv[1] !== fileURLToPath(import.meta.url) ||
    process.argv[2] !== "--protocol-fixture-child") return
  const mode = process.argv[3]
  const valid = canonicalMessage("RESOURCE_POLICY_SHARD_FAILED")
  switch (mode) {
    case "valid":
      process.stdout.write(valid)
      return
    case "malformed-json":
      process.stdout.write("{\n")
      return
    case "malformed-utf8":
      process.stdout.write(Buffer.from([0xc3, 0x28, 0x0a]))
      return
    case "unknown-key":
      process.stdout.write(`${JSON.stringify({
        schemaVersion: V138_CURRENT_MATRIX_CHILD_PROTOCOL_SCHEMA,
        failureCode: "RESOURCE_POLICY_SHARD_FAILED",
        extra: true,
      })}\n`)
      return
    case "unknown-code":
      process.stdout.write(`${JSON.stringify({
        schemaVersion: V138_CURRENT_MATRIX_CHILD_PROTOCOL_SCHEMA,
        failureCode: "UNKNOWN",
      })}\n`)
      return
    case "duplicate-message":
      process.stdout.write(`${valid}${valid}`)
      return
    case "oversize":
      process.stdout.write(Buffer.alloc(
        V138_CURRENT_MATRIX_CHILD_PROTOCOL_MAX_BYTES + 1,
        0x78,
      ))
      return
    case "stderr-contamination":
      process.stdout.write(valid)
      process.stderr.write("x")
      return
    case "nonzero-exit":
      process.stdout.write(valid)
      process.exitCode = 7
      return
    default:
      process.exitCode = 64
  }
}

runProtocolFixtureChild()
