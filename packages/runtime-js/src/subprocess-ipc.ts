import type { RuntimeResult } from "@cowards/engine"
import type { RuntimeViolation, RuntimeViolationType } from "@cowards/spec"
import type { StrategyMethodName } from "./adapter.js"

export const SUBPROCESS_STDOUT_BYTES = 256 * 1024
export const SUBPROCESS_STDERR_BYTES = 64 * 1024

export const SUBPROCESS_SYSTEM_FAILURE_CODES = [
  "MALFORMED_IPC",
  "SPAWN_FAILED",
  "STDIO_CAP_EXCEEDED",
  "SUBPROCESS_EXIT",
  "SUBPROCESS_SIGNAL",
] as const

export type SubprocessSystemFailureCode =
  (typeof SUBPROCESS_SYSTEM_FAILURE_CODES)[number]

export class SubprocessSystemFailure extends Error {
  readonly code: SubprocessSystemFailureCode
  readonly details: Readonly<Record<string, unknown>> | undefined

  constructor(
    code: SubprocessSystemFailureCode,
    message: string,
    details?: Readonly<Record<string, unknown>> | undefined,
  ) {
    super(message)
    this.name = "SubprocessSystemFailure"
    this.code = code
    this.details = details
  }
}

export interface SubprocessIpcRequest {
  source: string
  methodName: StrategyMethodName
  input: JsonValue
}

export type SubprocessIpcResponse = RuntimeResult<JsonValue>

type JsonPrimitive = string | number | boolean | null
type JsonObject = { readonly [key: string]: JsonValue }
type JsonValue = JsonPrimitive | readonly JsonValue[] | JsonObject

const runtimeViolationTypes = new Set<RuntimeViolationType>([
  "INVALID_OUTPUT",
  "TIMEOUT",
  "THROWN_EXCEPTION",
  "FORBIDDEN_CAPABILITY",
  "OVERSIZED_OUTPUT",
])

export const byteLength = (text: string): number =>
  new TextEncoder().encode(text).length

export const assertWithinByteCap = (
  streamName: "stdout" | "stderr",
  text: string,
  capBytes: number,
): void => {
  const actualBytes = byteLength(text)
  if (actualBytes > capBytes) {
    throw new SubprocessSystemFailure(
      "STDIO_CAP_EXCEEDED",
      `Subprocess ${streamName} exceeded ${capBytes} bytes`,
      { streamName, actualBytes, capBytes },
    )
  }
}

const isPlainJsonObject = (
  value: unknown,
): value is Record<string, unknown> => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false
  }

  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

export const isJsonValue = (value: unknown): value is JsonValue => {
  if (value === null) {
    return true
  }

  switch (typeof value) {
    case "string":
    case "boolean":
      return true
    case "number":
      return Number.isFinite(value)
    case "object":
      if (Array.isArray(value)) {
        return value.every(isJsonValue)
      }
      if (!isPlainJsonObject(value)) {
        return false
      }
      return Object.values(value).every(isJsonValue)
    default:
      return false
  }
}

const isStrategyMethodName = (value: unknown): value is StrategyMethodName =>
  value === "selectActivations" || value === "soldierBrain"

const isRuntimeViolation = (value: unknown): value is RuntimeViolation => {
  if (!isPlainJsonObject(value)) {
    return false
  }

  return (
    runtimeViolationTypes.has(value.type as RuntimeViolationType) &&
    typeof value.message === "string" &&
    value.message.length > 0
  )
}

export const isSubprocessIpcRequest = (
  value: unknown,
): value is SubprocessIpcRequest => {
  if (!isPlainJsonObject(value)) {
    return false
  }

  return (
    typeof value.source === "string" &&
    value.source.length > 0 &&
    isStrategyMethodName(value.methodName) &&
    "input" in value &&
    isJsonValue(value.input)
  )
}

export const isSubprocessIpcResponse = (
  value: unknown,
): value is SubprocessIpcResponse => {
  if (!isPlainJsonObject(value) || typeof value.ok !== "boolean") {
    return false
  }

  if (value.ok) {
    return "value" in value && isJsonValue(value.value)
  }

  return "violation" in value && isRuntimeViolation(value.violation)
}

export const encodeSubprocessIpcRequest = (request: unknown): string => {
  if (!isSubprocessIpcRequest(request)) {
    throw new SubprocessSystemFailure(
      "MALFORMED_IPC",
      "Subprocess request is not schema-valid JSON IPC",
    )
  }

  return JSON.stringify(request)
}

export const parseSubprocessIpcResponse = (
  stdout: string,
  capBytes = SUBPROCESS_STDOUT_BYTES,
): SubprocessIpcResponse => {
  assertWithinByteCap("stdout", stdout, capBytes)

  let parsed: unknown
  try {
    parsed = JSON.parse(stdout)
  } catch (error) {
    throw new SubprocessSystemFailure(
      "MALFORMED_IPC",
      "Subprocess stdout was not valid JSON",
      { cause: error instanceof Error ? error.message : String(error) },
    )
  }

  if (!isSubprocessIpcResponse(parsed)) {
    throw new SubprocessSystemFailure(
      "MALFORMED_IPC",
      "Subprocess response is not schema-valid JSON IPC",
    )
  }

  return parsed
}
