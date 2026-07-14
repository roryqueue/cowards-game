import { createHash } from "node:crypto"
import { encodeCanonicalJson } from "./canonical-json-encode.js"
import { parseCanonicalJson } from "./canonical-json-parse.js"
import {
  CANONICAL_JSON_V1_LIMITS,
  type CanonicalJsonContext,
  type CanonicalJsonError,
  type CanonicalJsonLimits,
  type CanonicalJsonScanOptions,
  type CanonicalJsonScanReceipt,
} from "./canonical-json-scan.js"
import { RUNTIME_ABI_V1_17 } from "./runtime-abi-v1-17.js"
import type { JsonValue } from "./types.js"

export type CanonicalJsonBoundaryProfileId =
  | "authenticated-envelope"
  | "service-response"
  | "canonical-manifest"
  | "host-api-value"
  | "strategy-payload"
  | "strategy-memory"
  | "soldier-memory"
  | "objective"

export interface CanonicalJsonBoundaryProfile {
  readonly id: CanonicalJsonBoundaryProfileId
  readonly context: CanonicalJsonContext
  readonly defaultOperation: CanonicalJsonScanOptions["operation"]
  readonly limits: Readonly<CanonicalJsonLimits>
  readonly fieldCapBytes: number | null
}

export interface CanonicalJsonAdmissionOptions {
  readonly profile: CanonicalJsonBoundaryProfileId
  readonly operation?: CanonicalJsonScanOptions["operation"]
}

export type CanonicalJsonAdmissionResult =
  | Readonly<{
      ok: true
      value: JsonValue
      canonicalBytes: Uint8Array
      canonicalSha256: `sha256:${string}`
      canonicalByteLength: number
      receipt: CanonicalJsonScanReceipt
      profile: CanonicalJsonBoundaryProfileId
    }>
  | Readonly<{
      ok: false
      error: CanonicalJsonError
      profile: CanonicalJsonBoundaryProfileId
    }>

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
    Object.freeze(value)
  }
  return value
}

const boundedLimits = (
  fieldCapBytes: number | null,
): Readonly<CanonicalJsonLimits> =>
  deepFreeze({
    ...CANONICAL_JSON_V1_LIMITS,
    ...(fieldCapBytes === null
      ? {}
      : {
          rawUtf8Bytes: Math.min(
            CANONICAL_JSON_V1_LIMITS.rawUtf8Bytes,
            fieldCapBytes,
          ),
          decodedStringUtf8Bytes: Math.min(
            CANONICAL_JSON_V1_LIMITS.decodedStringUtf8Bytes,
            fieldCapBytes,
          ),
        }),
  })

const profile = (
  id: CanonicalJsonBoundaryProfileId,
  context: CanonicalJsonContext,
  defaultOperation: CanonicalJsonScanOptions["operation"],
  fieldCapBytes: number | null,
): CanonicalJsonBoundaryProfile =>
  deepFreeze({
    id,
    context,
    defaultOperation,
    fieldCapBytes,
    limits: boundedLimits(fieldCapBytes),
  })

export const CANONICAL_JSON_BOUNDARY_PROFILES = deepFreeze({
  "authenticated-envelope": profile(
    "authenticated-envelope",
    "authenticated-outer-envelope",
    "require-canonical",
    RUNTIME_ABI_V1_17.fieldCaps.httpRequest.value,
  ),
  "service-response": profile(
    "service-response",
    "authenticated-outer-envelope",
    "require-canonical",
    RUNTIME_ABI_V1_17.fieldCaps.goResponse.value,
  ),
  "canonical-manifest": profile(
    "canonical-manifest",
    "canonical-manifest",
    "require-canonical",
    null,
  ),
  "host-api-value": profile(
    "host-api-value",
    "host-api-value",
    "parse-and-canonicalize",
    null,
  ),
  "strategy-payload": profile(
    "strategy-payload",
    "decoded-strategy-payload",
    "require-canonical",
    RUNTIME_ABI_V1_17.fieldCaps.invocationOutput.value,
  ),
  "strategy-memory": profile(
    "strategy-memory",
    "decoded-strategy-payload",
    "require-canonical",
    RUNTIME_ABI_V1_17.fieldCaps.strategyMemory.value,
  ),
  "soldier-memory": profile(
    "soldier-memory",
    "decoded-strategy-payload",
    "require-canonical",
    RUNTIME_ABI_V1_17.fieldCaps.soldierMemory.value,
  ),
  objective: profile(
    "objective",
    "decoded-strategy-payload",
    "require-canonical",
    RUNTIME_ABI_V1_17.fieldCaps.objectivePayload.value,
  ),
} as const)

const sha256 = (bytes: Uint8Array): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`

const firstDifference = (
  left: Uint8Array,
  right: Uint8Array,
): number | undefined => {
  const length = Math.min(left.byteLength, right.byteLength)
  for (let index = 0; index < length; index += 1) {
    if (left[index] !== right[index]) return index
  }
  return left.byteLength === right.byteLength ? undefined : length
}

const ownerFor = (
  context: CanonicalJsonContext,
): CanonicalJsonError["owner"] =>
  context === "decoded-strategy-payload" || context === "host-api-value"
    ? "player_violation"
    : "system_failure"

const fieldCapError = (
  error: CanonicalJsonError,
  boundary: CanonicalJsonBoundaryProfile,
): CanonicalJsonError =>
  boundary.fieldCapBytes !== null &&
  (error.code === "MAX_RAW_UTF8_BYTES_EXCEEDED" ||
    error.code === "MAX_DECODED_STRING_UTF8_BYTES_EXCEEDED")
    ? { ...error, code: "FIELD_CAP_EXCEEDED" }
    : error

export const admitCanonicalJsonBytes = (
  bytes: Uint8Array,
  options: CanonicalJsonAdmissionOptions,
): CanonicalJsonAdmissionResult => {
  const boundary = CANONICAL_JSON_BOUNDARY_PROFILES[options.profile]
  const operation = options.operation ?? boundary.defaultOperation
  const parsed = parseCanonicalJson(bytes, {
    context: boundary.context,
    operation,
    limits: boundary.limits,
  })
  if (!parsed.ok) {
    return {
      ok: false,
      error: fieldCapError(parsed.error, boundary),
      profile: boundary.id,
    }
  }
  const encoded = encodeCanonicalJson(parsed.value, {
    context: boundary.context,
    limits: boundary.limits,
  })
  if (!encoded.ok) {
    return {
      ok: false,
      error: fieldCapError(encoded.error, boundary),
      profile: boundary.id,
    }
  }
  if (operation === "require-canonical") {
    const byteOffset = firstDifference(bytes, encoded.bytes)
    if (byteOffset !== undefined) {
      return {
        ok: false,
        error: {
          code: "NON_CANONICAL_ENCODING",
          path: [],
          byteOffset,
          owner: ownerFor(boundary.context),
        },
        profile: boundary.id,
      }
    }
  }
  return {
    ok: true,
    value: parsed.value,
    canonicalBytes: encoded.bytes,
    canonicalSha256: sha256(encoded.bytes),
    canonicalByteLength: encoded.bytes.byteLength,
    receipt: parsed.receipt,
    profile: boundary.id,
  }
}

export const admitCanonicalJsonValue = (
  value: unknown,
  options: Omit<CanonicalJsonAdmissionOptions, "operation">,
): CanonicalJsonAdmissionResult => {
  const boundary = CANONICAL_JSON_BOUNDARY_PROFILES[options.profile]
  const encoded = encodeCanonicalJson(value as JsonValue, {
    context: boundary.context,
    limits: boundary.limits,
  })
  if (!encoded.ok) {
    return {
      ok: false,
      error: fieldCapError(encoded.error, boundary),
      profile: boundary.id,
    }
  }
  return admitCanonicalJsonBytes(encoded.bytes, {
    profile: boundary.id,
    operation: "require-canonical",
  })
}

export { CANONICAL_JSON_V1_LIMITS, encodeCanonicalJson, parseCanonicalJson }
export type {
  CanonicalJsonContext,
  CanonicalJsonError,
  CanonicalJsonLimits,
  CanonicalJsonScanOptions,
  CanonicalJsonScanReceipt,
}
