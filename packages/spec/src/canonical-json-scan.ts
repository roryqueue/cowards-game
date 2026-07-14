import { createHash } from "node:crypto"
import { RUNTIME_ABI_V1_17 } from "./runtime-abi-v1-17.js"

export interface CanonicalJsonLimits {
  rawUtf8Bytes: number
  depth: number
  nodes: number
  decodedStringUtf8Bytes: number
  arrayEntries: number
  objectEntries: number
}

export type CanonicalJsonContext =
  | "decoded-strategy-payload"
  | "authenticated-outer-envelope"
  | "canonical-manifest"
  | "host-api-value"

export interface CanonicalJsonScanOptions {
  context: CanonicalJsonContext
  operation: "parse-and-canonicalize" | "require-canonical"
  limits?: CanonicalJsonLimits
}

export type CanonicalJsonErrorOwner = "player_violation" | "system_failure"

export interface CanonicalJsonError {
  code: string
  path: readonly (string | number)[]
  byteOffset: number
  owner: CanonicalJsonErrorOwner
}

type ValueToken =
  | { readonly kind: "null"; readonly path: readonly (string | number)[] }
  | {
      readonly kind: "boolean"
      readonly path: readonly (string | number)[]
      readonly value: boolean
    }
  | {
      readonly kind: "number"
      readonly path: readonly (string | number)[]
      readonly value: number
    }
  | {
      readonly kind: "string"
      readonly path: readonly (string | number)[]
      readonly value: string
    }
  | { readonly kind: "array-start"; readonly path: readonly (string | number)[] }
  | { readonly kind: "array-end"; readonly path: readonly (string | number)[] }
  | { readonly kind: "object-start"; readonly path: readonly (string | number)[] }
  | { readonly kind: "object-end"; readonly path: readonly (string | number)[] }
  | {
      readonly kind: "key"
      readonly path: readonly (string | number)[]
      readonly value: string
    }

export type CanonicalJsonToken = ValueToken

export interface CanonicalJsonScanReceipt {
  readonly profile: "canonical-json-v1"
  readonly inputSha256: string
  readonly rawByteLength: number
  readonly context: CanonicalJsonContext
  readonly operation: CanonicalJsonScanOptions["operation"]
  readonly limits: Readonly<CanonicalJsonLimits>
  readonly nodeCount: number
  readonly maximumDepth: number
  readonly tokens: readonly CanonicalJsonToken[]
}

export type CanonicalJsonScanResult =
  | { readonly ok: true; readonly receipt: CanonicalJsonScanReceipt }
  | { readonly ok: false; readonly error: CanonicalJsonError }

type ArrayFrame = {
  kind: "array"
  path: readonly (string | number)[]
  entries: number
  state: "first-value-or-end" | "value" | "comma-or-end"
}

type ObjectFrame = {
  kind: "object"
  path: readonly (string | number)[]
  entries: number
  state: "first-key-or-end" | "key" | "colon" | "value" | "comma-or-end"
  keys: Set<string>
  pendingKey?: string
  previousKeyBytes?: Uint8Array
}

type Frame = ArrayFrame | ObjectFrame
type StringRead = { value: string; nextOffset: number }
type NumberRead = { value: number; nextOffset: number }
type ReadFailure = { error: CanonicalJsonError }

export const CANONICAL_JSON_V1_LIMITS: Readonly<CanonicalJsonLimits> =
  RUNTIME_ABI_V1_17.canonicalJson.ceilings

const textDecoder = new TextDecoder("utf-8", { fatal: true })
const textEncoder = new TextEncoder()
const whitespace = new Set([0x09, 0x0a, 0x0d, 0x20])

const ownerFor = (context: CanonicalJsonContext): CanonicalJsonErrorOwner =>
  context === "decoded-strategy-payload" || context === "host-api-value"
    ? "player_violation"
    : "system_failure"

const isFailure = (value: StringRead | NumberRead | ReadFailure): value is ReadFailure =>
  "error" in value

const assertLimits = (limits: CanonicalJsonLimits): void => {
  for (const [name, value] of Object.entries(limits)) {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new TypeError(`canonical JSON limit ${name} must be a nonnegative safe integer`)
    }
  }
}

const compareUnsignedBytes = (left: Uint8Array, right: Uint8Array): number => {
  const length = Math.min(left.byteLength, right.byteLength)
  for (let index = 0; index < length; index += 1) {
    const difference = left[index]! - right[index]!
    if (difference !== 0) return difference
  }
  return left.byteLength - right.byteLength
}

const utf8Width = (
  bytes: Uint8Array,
  offset: number,
): { width: number; codePoint: number } | undefined => {
  const first = bytes[offset]!
  if (first <= 0x7f) return { width: 1, codePoint: first }
  const second = bytes[offset + 1]
  if (first >= 0xc2 && first <= 0xdf) {
    if (second === undefined || second < 0x80 || second > 0xbf) return undefined
    return { width: 2, codePoint: ((first & 0x1f) << 6) | (second & 0x3f) }
  }
  const third = bytes[offset + 2]
  if (first >= 0xe0 && first <= 0xef) {
    if (
      second === undefined ||
      third === undefined ||
      second < (first === 0xe0 ? 0xa0 : 0x80) ||
      second > (first === 0xed ? 0x9f : 0xbf) ||
      third < 0x80 ||
      third > 0xbf
    ) {
      return undefined
    }
    return {
      width: 3,
      codePoint: ((first & 0x0f) << 12) | ((second & 0x3f) << 6) | (third & 0x3f),
    }
  }
  const fourth = bytes[offset + 3]
  if (first >= 0xf0 && first <= 0xf4) {
    if (
      second === undefined ||
      third === undefined ||
      fourth === undefined ||
      second < (first === 0xf0 ? 0x90 : 0x80) ||
      second > (first === 0xf4 ? 0x8f : 0xbf) ||
      third < 0x80 ||
      third > 0xbf ||
      fourth < 0x80 ||
      fourth > 0xbf
    ) {
      return undefined
    }
    return {
      width: 4,
      codePoint:
        ((first & 0x07) << 18) |
        ((second & 0x3f) << 12) |
        ((third & 0x3f) << 6) |
        (fourth & 0x3f),
    }
  }
  return undefined
}

const hexValue = (byte: number | undefined): number | undefined => {
  if (byte === undefined) return undefined
  if (byte >= 0x30 && byte <= 0x39) return byte - 0x30
  if (byte >= 0x41 && byte <= 0x46) return byte - 0x41 + 10
  if (byte >= 0x61 && byte <= 0x66) return byte - 0x61 + 10
  return undefined
}

const readHexQuad = (bytes: Uint8Array, offset: number): number | undefined => {
  let value = 0
  for (let index = 0; index < 4; index += 1) {
    const digit = hexValue(bytes[offset + index])
    if (digit === undefined) return undefined
    value = value * 16 + digit
  }
  return value
}

export const scanCanonicalJson = (
  bytes: Uint8Array,
  options: CanonicalJsonScanOptions,
): CanonicalJsonScanResult => {
  const limits: CanonicalJsonLimits = {
    ...(options.limits ?? CANONICAL_JSON_V1_LIMITS),
  }
  assertLimits(limits)
  const owner = ownerFor(options.context)
  const failure = (
    code: string,
    byteOffset: number,
    path: readonly (string | number)[] = [],
  ): CanonicalJsonScanResult & { ok: false } => ({
    ok: false,
    error: { code, path: [...path], byteOffset, owner },
  })
  if (bytes.byteLength > limits.rawUtf8Bytes) {
    return failure("MAX_RAW_UTF8_BYTES_EXCEEDED", limits.rawUtf8Bytes)
  }
  for (let offset = 0; offset < bytes.byteLength; ) {
    const decoded = utf8Width(bytes, offset)
    if (!decoded) return failure("INVALID_UTF8", offset)
    offset += decoded.width
  }

  const readString = (start: number, path: readonly (string | number)[]): StringRead | ReadFailure => {
    const pieces: string[] = []
    let decodedBytes = 0
    let offset = start + 1
    let segmentStart = offset
    const addWidth = (width: number, errorOffset: number): ReadFailure | undefined => {
      if (decodedBytes + width > limits.decodedStringUtf8Bytes) {
        return {
          error: failure(
            "MAX_DECODED_STRING_UTF8_BYTES_EXCEEDED",
            errorOffset,
            path,
          ).error,
        }
      }
      decodedBytes += width
      return undefined
    }
    while (offset < bytes.byteLength) {
      const byte = bytes[offset]!
      if (byte === 0x22) {
        if (segmentStart < offset) pieces.push(textDecoder.decode(bytes.subarray(segmentStart, offset)))
        return { value: pieces.join(""), nextOffset: offset + 1 }
      }
      if (byte === 0x5c) {
        if (segmentStart < offset) pieces.push(textDecoder.decode(bytes.subarray(segmentStart, offset)))
        const escapeOffset = offset
        const escaped = bytes[offset + 1]
        const simpleEscapes: Readonly<Record<number, string>> = {
          0x22: '"',
          0x2f: "/",
          0x5c: "\\",
          0x62: "\b",
          0x66: "\f",
          0x6e: "\n",
          0x72: "\r",
          0x74: "\t",
        }
        if (escaped !== undefined && escaped in simpleEscapes) {
          const widthFailure = addWidth(1, escapeOffset)
          if (widthFailure) return widthFailure
          pieces.push(simpleEscapes[escaped]!)
          offset += 2
          segmentStart = offset
          continue
        }
        if (escaped !== 0x75) {
          return { error: failure("INVALID_GRAMMAR", escapeOffset, path).error }
        }
        const firstUnit = readHexQuad(bytes, offset + 2)
        if (firstUnit === undefined) {
          return { error: failure("INVALID_GRAMMAR", escapeOffset, path).error }
        }
        let codePoint = firstUnit
        let consumed = 6
        if (firstUnit >= 0xd800 && firstUnit <= 0xdbff) {
          if (bytes[offset + 6] !== 0x5c || bytes[offset + 7] !== 0x75) {
            return {
              error: failure("INVALID_UNICODE_SCALAR", escapeOffset, path).error,
            }
          }
          const secondUnit = readHexQuad(bytes, offset + 8)
          if (secondUnit === undefined || secondUnit < 0xdc00 || secondUnit > 0xdfff) {
            return {
              error: failure("INVALID_UNICODE_SCALAR", escapeOffset, path).error,
            }
          }
          codePoint = 0x10000 + ((firstUnit - 0xd800) << 10) + (secondUnit - 0xdc00)
          consumed = 12
        } else if (firstUnit >= 0xdc00 && firstUnit <= 0xdfff) {
          return { error: failure("INVALID_UNICODE_SCALAR", escapeOffset, path).error }
        }
        const width = codePoint <= 0x7f ? 1 : codePoint <= 0x7ff ? 2 : codePoint <= 0xffff ? 3 : 4
        const widthFailure = addWidth(width, escapeOffset)
        if (widthFailure) return widthFailure
        pieces.push(String.fromCodePoint(codePoint))
        offset += consumed
        segmentStart = offset
        continue
      }
      if (byte < 0x20) {
        return { error: failure("INVALID_GRAMMAR", offset, path).error }
      }
      const decoded = utf8Width(bytes, offset)
      if (!decoded) return { error: failure("INVALID_UTF8", offset, path).error }
      const widthFailure = addWidth(decoded.width, offset)
      if (widthFailure) return widthFailure
      offset += decoded.width
    }
    return { error: failure("INVALID_GRAMMAR", bytes.byteLength, path).error }
  }

  const isDigit = (byte: number | undefined): boolean =>
    byte !== undefined && byte >= 0x30 && byte <= 0x39
  const readNumber = (start: number, path: readonly (string | number)[]): NumberRead | ReadFailure => {
    let offset = start
    if (bytes[offset] === 0x2d) offset += 1
    if (!isDigit(bytes[offset])) {
      return { error: failure("INVALID_GRAMMAR", start, path).error }
    }
    if (bytes[offset] === 0x30) {
      offset += 1
    } else {
      while (isDigit(bytes[offset])) offset += 1
    }
    if (bytes[offset] === 0x2e) {
      const decimalOffset = offset
      offset += 1
      if (!isDigit(bytes[offset])) {
        return { error: failure("INVALID_GRAMMAR", decimalOffset, path).error }
      }
      while (isDigit(bytes[offset])) offset += 1
    }
    if (bytes[offset] === 0x65 || bytes[offset] === 0x45) {
      const exponentOffset = offset
      offset += 1
      if (bytes[offset] === 0x2b || bytes[offset] === 0x2d) offset += 1
      if (!isDigit(bytes[offset])) {
        return { error: failure("INVALID_GRAMMAR", exponentOffset, path).error }
      }
      while (isDigit(bytes[offset])) offset += 1
    }
    const lexical = textDecoder.decode(bytes.subarray(start, offset))
    const value = Number(lexical)
    if (!Number.isFinite(value)) {
      return { error: failure("NUMBER_OUT_OF_RANGE", start, path).error }
    }
    if (/^-?(?:0|[1-9][0-9]*)$/.test(lexical) && !Number.isSafeInteger(value)) {
      return { error: failure("NUMBER_OUT_OF_RANGE", start, path).error }
    }
    return { value, nextOffset: offset }
  }

  const tokens: CanonicalJsonToken[] = []
  const stack: Frame[] = []
  let offset = 0
  let nodeCount = 0
  let maximumDepth = 0
  let rootStarted = false
  let rootComplete = false

  const skipWhitespace = (): void => {
    while (offset < bytes.byteLength && whitespace.has(bytes[offset]!)) offset += 1
  }

  const readValue = (
    path: readonly (string | number)[],
  ): { container: boolean } | (CanonicalJsonScanResult & { ok: false }) => {
    if (nodeCount >= limits.nodes) return failure("MAX_NODES_EXCEEDED", offset)
    const start = offset
    const byte = bytes[offset]
    if (byte === undefined) return failure("INVALID_GRAMMAR", offset, path)
    if (byte === 0x5b || byte === 0x7b) {
      const depth = stack.length + 1
      if (depth > limits.depth) return failure("MAX_DEPTH_EXCEEDED", offset)
      nodeCount += 1
      maximumDepth = Math.max(maximumDepth, depth)
      offset += 1
      if (byte === 0x5b) {
        tokens.push({ kind: "array-start", path: [...path] })
        stack.push({ kind: "array", path: [...path], entries: 0, state: "first-value-or-end" })
      } else {
        tokens.push({ kind: "object-start", path: [...path] })
        stack.push({
          kind: "object",
          path: [...path],
          entries: 0,
          state: "first-key-or-end",
          keys: new Set(),
        })
      }
      return { container: true }
    }
    nodeCount += 1
    if (byte === 0x22) {
      const decoded = readString(offset, path)
      if (isFailure(decoded)) return { ok: false, error: decoded.error }
      offset = decoded.nextOffset
      tokens.push({ kind: "string", path: [...path], value: decoded.value })
      return { container: false }
    }
    if (byte === 0x74 && textDecoder.decode(bytes.subarray(offset, offset + 4)) === "true") {
      offset += 4
      tokens.push({ kind: "boolean", path: [...path], value: true })
      return { container: false }
    }
    if (byte === 0x66 && textDecoder.decode(bytes.subarray(offset, offset + 5)) === "false") {
      offset += 5
      tokens.push({ kind: "boolean", path: [...path], value: false })
      return { container: false }
    }
    if (byte === 0x6e && textDecoder.decode(bytes.subarray(offset, offset + 4)) === "null") {
      offset += 4
      tokens.push({ kind: "null", path: [...path] })
      return { container: false }
    }
    if (byte === 0x2d || isDigit(byte)) {
      const number = readNumber(start, path)
      if (isFailure(number)) return { ok: false, error: number.error }
      offset = number.nextOffset
      tokens.push({ kind: "number", path: [...path], value: number.value })
      return { container: false }
    }
    return failure("INVALID_GRAMMAR", offset, path)
  }

  while (true) {
    skipWhitespace()
    if (stack.length === 0) {
      if (rootComplete) {
        if (offset !== bytes.byteLength) return failure("INVALID_GRAMMAR", offset)
        return {
          ok: true,
          receipt: {
            profile: "canonical-json-v1",
            inputSha256: createHash("sha256").update(bytes).digest("hex"),
            rawByteLength: bytes.byteLength,
            context: options.context,
            operation: options.operation,
            limits,
            nodeCount,
            maximumDepth,
            tokens,
          },
        }
      }
      if (rootStarted) return failure("INVALID_GRAMMAR", offset)
      rootStarted = true
      const value = readValue([])
      if ("ok" in value) return value
      if (!value.container) rootComplete = true
      continue
    }

    const frame = stack[stack.length - 1]!
    if (frame.kind === "array") {
      if (frame.state === "first-value-or-end" && bytes[offset] === 0x5d) {
        offset += 1
        tokens.push({ kind: "array-end", path: frame.path })
        stack.pop()
        if (stack.length === 0) rootComplete = true
        continue
      }
      if (frame.state === "comma-or-end") {
        if (bytes[offset] === 0x5d) {
          offset += 1
          tokens.push({ kind: "array-end", path: frame.path })
          stack.pop()
          if (stack.length === 0) rootComplete = true
          continue
        }
        if (bytes[offset] !== 0x2c) return failure("INVALID_GRAMMAR", offset, frame.path)
        offset += 1
        frame.state = "value"
        continue
      }
      if (frame.entries >= limits.arrayEntries) {
        return failure("MAX_ARRAY_ENTRIES_EXCEEDED", offset)
      }
      const entryPath = [...frame.path, frame.entries]
      const value = readValue(entryPath)
      if ("ok" in value) return value
      frame.entries += 1
      frame.state = "comma-or-end"
      continue
    }

    if (frame.state === "first-key-or-end" && bytes[offset] === 0x7d) {
      offset += 1
      tokens.push({ kind: "object-end", path: frame.path })
      stack.pop()
      if (stack.length === 0) rootComplete = true
      continue
    }
    if (frame.state === "comma-or-end") {
      if (bytes[offset] === 0x7d) {
        offset += 1
        tokens.push({ kind: "object-end", path: frame.path })
        stack.pop()
        if (stack.length === 0) rootComplete = true
        continue
      }
      if (bytes[offset] !== 0x2c) return failure("INVALID_GRAMMAR", offset, frame.path)
      offset += 1
      frame.state = "key"
      continue
    }
    if (frame.state === "first-key-or-end" || frame.state === "key") {
      if (frame.entries >= limits.objectEntries) {
        return failure("MAX_OBJECT_ENTRIES_EXCEEDED", offset)
      }
      if (bytes[offset] !== 0x22) return failure("INVALID_GRAMMAR", offset, frame.path)
      const keyOffset = offset
      const key = readString(offset, frame.path)
      if (isFailure(key)) return { ok: false, error: key.error }
      const keyPath = [...frame.path, key.value]
      if (frame.keys.has(key.value)) return failure("DUPLICATE_KEY", keyOffset, keyPath)
      const keyBytes = textEncoder.encode(key.value)
      if (
        options.operation === "require-canonical" &&
        frame.previousKeyBytes &&
        compareUnsignedBytes(frame.previousKeyBytes, keyBytes) >= 0
      ) {
        return failure("NON_CANONICAL_KEY_ORDER", keyOffset, keyPath)
      }
      frame.keys.add(key.value)
      frame.previousKeyBytes = keyBytes
      frame.pendingKey = key.value
      frame.state = "colon"
      offset = key.nextOffset
      tokens.push({ kind: "key", path: keyPath, value: key.value })
      continue
    }
    if (frame.state === "colon") {
      if (bytes[offset] !== 0x3a) return failure("INVALID_GRAMMAR", offset, frame.path)
      offset += 1
      frame.state = "value"
      continue
    }
    if (frame.state === "value") {
      const valuePath = [...frame.path, frame.pendingKey!]
      const value = readValue(valuePath)
      if ("ok" in value) return value
      frame.entries += 1
      delete frame.pendingKey
      frame.state = "comma-or-end"
      continue
    }
  }
}
