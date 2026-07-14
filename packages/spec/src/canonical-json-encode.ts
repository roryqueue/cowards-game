import {
  CANONICAL_JSON_V1_LIMITS,
  type CanonicalJsonContext,
  type CanonicalJsonError,
  type CanonicalJsonLimits,
} from "./canonical-json-scan.js"
import type { JsonValue } from "./types.js"

export interface CanonicalJsonEncodeOptions {
  context: CanonicalJsonContext
  limits?: CanonicalJsonLimits
}

export type CanonicalJsonEncodeResult =
  | { readonly ok: true; readonly bytes: Uint8Array }
  | { readonly ok: false; readonly error: CanonicalJsonError }

type EncodedString = {
  readonly bytes: Uint8Array
  readonly sortBytes: Uint8Array
}

type ObjectEntry = {
  readonly key: string
  readonly keyBytes: Uint8Array
  readonly sortBytes: Uint8Array
  readonly value: JsonValue
}

type ArrayFrame = {
  readonly kind: "array"
  readonly value: JsonValue[]
  readonly path: readonly (string | number)[]
  index: number
}

type ObjectFrame = {
  readonly kind: "object"
  readonly value: Record<string, JsonValue>
  readonly path: readonly (string | number)[]
  readonly entries: readonly ObjectEntry[]
  index: number
}

type Frame = ArrayFrame | ObjectFrame
type CurrentValue = { value: JsonValue; path: readonly (string | number)[] }

const textEncoder = new TextEncoder()
const ascii = (value: string): Uint8Array => textEncoder.encode(value)

const ownerFor = (context: CanonicalJsonContext): "player_violation" | "system_failure" =>
  context === "decoded-strategy-payload" || context === "host-api-value"
    ? "player_violation"
    : "system_failure"

const compareUnsignedBytes = (left: Uint8Array, right: Uint8Array): number => {
  const length = Math.min(left.byteLength, right.byteLength)
  for (let index = 0; index < length; index += 1) {
    const difference = left[index]! - right[index]!
    if (difference !== 0) return difference
  }
  return left.byteLength - right.byteLength
}

const canonicalNumber = (value: number): string | undefined => {
  if (!Number.isFinite(value)) return undefined
  if (Object.is(value, -0)) return "0"
  const shortest = Number.prototype.toString.call(value).toLowerCase()
  const exponentAt = shortest.indexOf("e")
  if (exponentAt < 0) return shortest
  const mantissa = shortest.slice(0, exponentAt)
  let exponent = shortest.slice(exponentAt + 1)
  let sign = ""
  if (exponent.startsWith("-")) {
    sign = "-"
    exponent = exponent.slice(1)
  } else if (exponent.startsWith("+")) {
    exponent = exponent.slice(1)
  }
  exponent = exponent.replace(/^0+(?=[0-9])/, "")
  return `${mantissa}e${sign}${exponent}`
}

export const encodeCanonicalJson = (
  root: JsonValue,
  options: CanonicalJsonEncodeOptions,
): CanonicalJsonEncodeResult => {
  const limits: CanonicalJsonLimits = {
    ...(options.limits ?? CANONICAL_JSON_V1_LIMITS),
  }
  for (const [name, value] of Object.entries(limits)) {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new TypeError(`canonical JSON limit ${name} must be a nonnegative safe integer`)
    }
  }
  const owner = ownerFor(options.context)
  const failure = (
    code: string,
    path: readonly (string | number)[] = [],
    byteOffset = 0,
  ): CanonicalJsonEncodeResult & { ok: false } => ({
    ok: false,
    error: { code, path: [...path], byteOffset, owner },
  })

  const chunks: Uint8Array[] = []
  let outputBytes = 0
  const append = (bytes: Uint8Array): CanonicalJsonEncodeResult & { ok: false } | undefined => {
    if (outputBytes + bytes.byteLength > limits.rawUtf8Bytes) {
      return failure("MAX_RAW_UTF8_BYTES_EXCEEDED", [], limits.rawUtf8Bytes)
    }
    outputBytes += bytes.byteLength
    chunks.push(bytes)
    return undefined
  }

  const encodeString = (
    value: string,
    path: readonly (string | number)[],
  ): EncodedString | (CanonicalJsonEncodeResult & { ok: false }) => {
    const pieces: string[] = ['"']
    let segmentStart = 0
    let decodedBytes = 0
    const flush = (end: number): void => {
      if (segmentStart < end) pieces.push(value.slice(segmentStart, end))
    }
    for (let index = 0; index < value.length; index += 1) {
      const unit = value.charCodeAt(index)
      let width = unit <= 0x7f ? 1 : unit <= 0x7ff ? 2 : 3
      if (unit >= 0xd800 && unit <= 0xdbff) {
        const low = value.charCodeAt(index + 1)
        if (!(low >= 0xdc00 && low <= 0xdfff)) {
          return failure("INVALID_UNICODE_SCALAR", path)
        }
        width = 4
        index += 1
      } else if (unit >= 0xdc00 && unit <= 0xdfff) {
        return failure("INVALID_UNICODE_SCALAR", path)
      }
      if (decodedBytes + width > limits.decodedStringUtf8Bytes) {
        return failure("MAX_DECODED_STRING_UTF8_BYTES_EXCEEDED", path)
      }
      decodedBytes += width
      const consumedEnd = index + 1
      const escape =
        unit === 0x22
          ? '\\"'
          : unit === 0x5c
            ? "\\\\"
            : unit === 0x08
              ? "\\b"
              : unit === 0x0c
                ? "\\f"
                : unit === 0x0a
                  ? "\\n"
                  : unit === 0x0d
                    ? "\\r"
                    : unit === 0x09
                      ? "\\t"
                      : unit < 0x20
                        ? `\\u${unit.toString(16).padStart(4, "0")}`
                        : undefined
      if (escape !== undefined) {
        flush(consumedEnd - 1)
        pieces.push(escape)
        segmentStart = consumedEnd
      }
    }
    flush(value.length)
    pieces.push('"')
    return { bytes: textEncoder.encode(pieces.join("")), sortBytes: textEncoder.encode(value) }
  }

  const stack: Frame[] = []
  const activeContainers = new Set<object>()
  let current: CurrentValue | undefined = { value: root, path: [] }
  let nodeCount = 0

  while (current || stack.length > 0) {
    if (current) {
      if (nodeCount >= limits.nodes) {
        return failure("MAX_NODES_EXCEEDED", current.path, outputBytes)
      }
      nodeCount += 1
      const active: CurrentValue = current
      const value: JsonValue = active.value
      const path: readonly (string | number)[] = active.path
      current = undefined
      if (value === null) {
        const error = append(ascii("null"))
        if (error) return error
        continue
      }
      if (typeof value === "boolean") {
        const error = append(ascii(value ? "true" : "false"))
        if (error) return error
        continue
      }
      if (typeof value === "number") {
        const encoded = canonicalNumber(value)
        if (encoded === undefined) return failure("NON_CANONICAL_NUMBER", path)
        const error = append(ascii(encoded))
        if (error) return error
        continue
      }
      if (typeof value === "string") {
        const encoded = encodeString(value, path)
        if ("ok" in encoded) return encoded
        const error = append(encoded.bytes)
        if (error) return error
        continue
      }
      if (typeof value !== "object") return failure("INVALID_GRAMMAR", path)
      const depth = stack.length + 1
      if (depth > limits.depth) return failure("MAX_DEPTH_EXCEEDED", path, outputBytes)
      if (activeContainers.has(value)) return failure("INVALID_GRAMMAR", path, outputBytes)

      if (Array.isArray(value)) {
        if (value.length > limits.arrayEntries) {
          return failure("MAX_ARRAY_ENTRIES_EXCEEDED", path, outputBytes)
        }
        activeContainers.add(value)
        let error = append(ascii("["))
        if (error) return error
        if (value.length === 0) {
          error = append(ascii("]"))
          activeContainers.delete(value)
          if (error) return error
          continue
        }
        const frame: ArrayFrame = { kind: "array", value, path, index: 0 }
        stack.push(frame)
        current = { value: value[0] as JsonValue, path: [...path, 0] }
        continue
      }

      const prototype = Object.getPrototypeOf(value)
      if (prototype !== null && prototype !== Object.prototype) {
        return failure("INVALID_GRAMMAR", path, outputBytes)
      }
      const keys: string[] = []
      for (const key in value) {
        if (!Object.hasOwn(value, key)) continue
        keys.push(key)
        if (keys.length > limits.objectEntries) {
          return failure("MAX_OBJECT_ENTRIES_EXCEEDED", path, outputBytes)
        }
      }
      const entries: ObjectEntry[] = []
      for (const key of keys) {
        const descriptor = Object.getOwnPropertyDescriptor(value, key)
        if (!descriptor || !("value" in descriptor)) {
          return failure("INVALID_GRAMMAR", [...path, key], outputBytes)
        }
        const encodedKey = encodeString(key, [...path, key])
        if ("ok" in encodedKey) return encodedKey
        entries.push({
          key,
          keyBytes: encodedKey.bytes,
          sortBytes: encodedKey.sortBytes,
          value: descriptor.value as JsonValue,
        })
      }
      entries.sort((left, right) => compareUnsignedBytes(left.sortBytes, right.sortBytes))
      activeContainers.add(value)
      let error = append(ascii("{"))
      if (error) return error
      if (entries.length === 0) {
        error = append(ascii("}"))
        activeContainers.delete(value)
        if (error) return error
        continue
      }
      const frame: ObjectFrame = {
        kind: "object",
        value: value as Record<string, JsonValue>,
        path,
        entries,
        index: 0,
      }
      stack.push(frame)
      error = append(entries[0]!.keyBytes)
      if (error) return error
      error = append(ascii(":"))
      if (error) return error
      current = { value: entries[0]!.value, path: [...path, entries[0]!.key] }
      continue
    }

    const frame = stack[stack.length - 1]!
    frame.index += 1
    if (frame.kind === "array") {
      if (frame.index < frame.value.length) {
        const error = append(ascii(","))
        if (error) return error
        current = {
          value: frame.value[frame.index] as JsonValue,
          path: [...frame.path, frame.index],
        }
        continue
      }
      const error = append(ascii("]"))
      if (error) return error
      activeContainers.delete(frame.value)
      stack.pop()
      continue
    }
    if (frame.index < frame.entries.length) {
      let error = append(ascii(","))
      if (error) return error
      const entry = frame.entries[frame.index]!
      error = append(entry.keyBytes)
      if (error) return error
      error = append(ascii(":"))
      if (error) return error
      current = { value: entry.value, path: [...frame.path, entry.key] }
      continue
    }
    const error = append(ascii("}"))
    if (error) return error
    activeContainers.delete(frame.value)
    stack.pop()
  }

  const bytes = new Uint8Array(outputBytes)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return { ok: true, bytes }
}
