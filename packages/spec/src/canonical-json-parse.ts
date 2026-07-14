import { createHash } from "node:crypto"
import {
  scanCanonicalJson,
  type CanonicalJsonError,
  type CanonicalJsonScanOptions,
  type CanonicalJsonScanReceipt,
} from "./canonical-json-scan.js"
import type { JsonValue } from "./types.js"

export type CanonicalJsonParseResult =
  | {
      readonly ok: true
      readonly value: JsonValue
      readonly receipt: CanonicalJsonScanReceipt
    }
  | { readonly ok: false; readonly error: CanonicalJsonError }

type ArrayBuildFrame = { kind: "array"; value: JsonValue[] }
type ObjectBuildFrame = {
  kind: "object"
  value: Record<string, JsonValue>
  pendingKey?: string
}
type BuildFrame = ArrayBuildFrame | ObjectBuildFrame

const systemFailure = (code: string): CanonicalJsonParseResult & { ok: false } => ({
  ok: false,
  error: {
    code,
    path: [],
    byteOffset: 0,
    owner: "system_failure",
  },
})

export const materializeCanonicalJson = (
  bytes: Uint8Array,
  receipt: CanonicalJsonScanReceipt,
): CanonicalJsonParseResult => {
  if (
    bytes.byteLength !== receipt.rawByteLength ||
    createHash("sha256").update(bytes).digest("hex") !== receipt.inputSha256
  ) {
    return systemFailure("CANONICAL_JSON_SCAN_RECEIPT_MISMATCH")
  }

  try {
    const stack: BuildFrame[] = []
    let root: JsonValue | undefined
    let hasRoot = false

    const attach = (value: JsonValue): boolean => {
      const parent = stack[stack.length - 1]
      if (!parent) {
        if (hasRoot) return false
        root = value
        hasRoot = true
        return true
      }
      if (parent.kind === "array") {
        parent.value.push(value)
        return true
      }
      if (parent.pendingKey === undefined) return false
      parent.value[parent.pendingKey] = value
      delete parent.pendingKey
      return true
    }

    for (const token of receipt.tokens) {
      switch (token.kind) {
        case "null":
          if (!attach(null)) return systemFailure("CANONICAL_JSON_MATERIALIZATION_FAILURE")
          break
        case "boolean":
        case "string":
          if (!attach(token.value)) {
            return systemFailure("CANONICAL_JSON_MATERIALIZATION_FAILURE")
          }
          break
        case "number":
          if (
            !Number.isFinite(token.value) ||
            !attach(Object.is(token.value, -0) ? 0 : token.value)
          ) {
            return systemFailure("CANONICAL_JSON_MATERIALIZATION_FAILURE")
          }
          break
        case "array-start": {
          const value: JsonValue[] = []
          if (!attach(value)) return systemFailure("CANONICAL_JSON_MATERIALIZATION_FAILURE")
          stack.push({ kind: "array", value })
          break
        }
        case "array-end":
          if (stack[stack.length - 1]?.kind !== "array") {
            return systemFailure("CANONICAL_JSON_MATERIALIZATION_FAILURE")
          }
          stack.pop()
          break
        case "object-start": {
          const value = Object.create(null) as Record<string, JsonValue>
          if (!attach(value)) return systemFailure("CANONICAL_JSON_MATERIALIZATION_FAILURE")
          stack.push({ kind: "object", value })
          break
        }
        case "key": {
          const object = stack[stack.length - 1]
          if (object?.kind !== "object" || object.pendingKey !== undefined) {
            return systemFailure("CANONICAL_JSON_MATERIALIZATION_FAILURE")
          }
          object.pendingKey = token.value
          break
        }
        case "object-end": {
          const object = stack[stack.length - 1]
          if (object?.kind !== "object" || object.pendingKey !== undefined) {
            return systemFailure("CANONICAL_JSON_MATERIALIZATION_FAILURE")
          }
          stack.pop()
          break
        }
      }
    }
    if (!hasRoot || root === undefined || stack.length !== 0) {
      return systemFailure("CANONICAL_JSON_MATERIALIZATION_FAILURE")
    }
    return { ok: true, value: root, receipt }
  } catch {
    return systemFailure("CANONICAL_JSON_MATERIALIZATION_FAILURE")
  }
}

export const parseCanonicalJson = (
  bytes: Uint8Array,
  options: CanonicalJsonScanOptions,
): CanonicalJsonParseResult => {
  const scanned = scanCanonicalJson(bytes, options)
  if (!scanned.ok) return scanned
  return materializeCanonicalJson(bytes, scanned.receipt)
}
