/**
 * Shared source embedded in the inactive Node guest harnesses. The encoder
 * writes directly into a payload-budget-sized frame and stops on the first
 * attempted byte past the limit. It never builds a complete JSON string or a
 * second complete payload buffer.
 */
export const CANDIDATE_BOUNDED_CANONICAL_SOURCE = String.raw`
const compareUnsignedBytes = (left, right) => {
  const length = Math.min(left.length, right.length)
  for (let index = 0; index < length; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index]
  }
  return left.length - right.length
}
const boundedCanonicalFrame = (root, outputByteLimit) => {
  if (!Number.isSafeInteger(outputByteLimit) || outputByteLimit < 0 || outputByteLimit > 262144) {
    return frame("T")
  }
  const output = new Uint8Array(outputByteLimit + 1)
  output[0] = 83
  let offset = 1
  let overflow = false
  let nodes = 0
  const active = new Set()
  const appendByte = (byte) => {
    if (offset - 1 >= outputByteLimit) {
      overflow = true
      return false
    }
    output[offset] = byte
    offset += 1
    return true
  }
  const appendAscii = (text) => {
    for (let index = 0; index < text.length; index += 1) {
      if (!appendByte(text.charCodeAt(index))) return false
    }
    return true
  }
  const appendScalar = (scalar) => {
    if (scalar <= 0x7f) return appendByte(scalar)
    if (scalar <= 0x7ff) {
      return appendByte(0xc0 | (scalar >> 6)) &&
        appendByte(0x80 | (scalar & 0x3f))
    }
    if (scalar <= 0xffff) {
      return appendByte(0xe0 | (scalar >> 12)) &&
        appendByte(0x80 | ((scalar >> 6) & 0x3f)) &&
        appendByte(0x80 | (scalar & 0x3f))
    }
    return appendByte(0xf0 | (scalar >> 18)) &&
      appendByte(0x80 | ((scalar >> 12) & 0x3f)) &&
      appendByte(0x80 | ((scalar >> 6) & 0x3f)) &&
      appendByte(0x80 | (scalar & 0x3f))
  }
  const scalarAt = (value, index) => {
    const first = value.charCodeAt(index)
    if (first >= 0xd800 && first <= 0xdbff) {
      const second = value.charCodeAt(index + 1)
      if (!(second >= 0xdc00 && second <= 0xdfff)) throw new Error("INVALID_OUTPUT")
      return { scalar: 0x10000 + ((first - 0xd800) << 10) + second - 0xdc00, width: 2 }
    }
    if (first >= 0xdc00 && first <= 0xdfff) throw new Error("INVALID_OUTPUT")
    return { scalar: first, width: 1 }
  }
  const appendString = (value) => {
    if (!appendByte(0x22)) return false
    for (let index = 0; index < value.length;) {
      const current = scalarAt(value, index)
      index += current.width
      const scalar = current.scalar
      const escape = scalar === 0x22
        ? '\\"'
        : scalar === 0x5c
          ? '\\\\'
          : scalar === 0x08
            ? '\\b'
            : scalar === 0x0c
              ? '\\f'
              : scalar === 0x0a
                ? '\\n'
                : scalar === 0x0d
                  ? '\\r'
                  : scalar === 0x09
                    ? '\\t'
                    : scalar < 0x20
                      ? '\\u' + scalar.toString(16).padStart(4, "0")
                      : undefined
      if (escape === undefined ? !appendScalar(scalar) : !appendAscii(escape)) return false
    }
    return appendByte(0x22)
  }
  const sortBytes = (value, remaining) => {
    const bytes = []
    for (let index = 0; index < value.length;) {
      const current = scalarAt(value, index)
      index += current.width
      const scalar = current.scalar
      const encoded = scalar <= 0x7f
        ? [scalar]
        : scalar <= 0x7ff
          ? [0xc0 | (scalar >> 6), 0x80 | (scalar & 0x3f)]
          : scalar <= 0xffff
            ? [0xe0 | (scalar >> 12), 0x80 | ((scalar >> 6) & 0x3f), 0x80 | (scalar & 0x3f)]
            : [0xf0 | (scalar >> 18), 0x80 | ((scalar >> 12) & 0x3f), 0x80 | ((scalar >> 6) & 0x3f), 0x80 | (scalar & 0x3f)]
      if (bytes.length + encoded.length > remaining) return undefined
      bytes.push(...encoded)
    }
    return Uint8Array.from(bytes)
  }
  const appendValue = (value, depth) => {
    if (overflow) return
    nodes += 1
    if (nodes > 262144) throw new Error("INVALID_OUTPUT")
    if (value === null) {
      appendAscii("null")
      return
    }
    if (typeof value === "boolean") {
      appendAscii(value ? "true" : "false")
      return
    }
    if (typeof value === "number") {
      if (!Number.isFinite(value)) throw new Error("INVALID_OUTPUT")
      appendAscii(Object.is(value, -0) ? "0" : JSON.stringify(value).replace("e+", "e"))
      return
    }
    if (typeof value === "string") {
      appendString(value)
      return
    }
    if (typeof value !== "object" || value === undefined || active.has(value)) {
      throw new Error("INVALID_OUTPUT")
    }
    if (depth > 64) throw new Error("INVALID_OUTPUT")
    active.add(value)
    if (Array.isArray(value)) {
      if (value.length > 65536) throw new Error("INVALID_OUTPUT")
      appendByte(0x5b)
      for (let index = 0; index < value.length && !overflow; index += 1) {
        if (index > 0) appendByte(0x2c)
        if (!overflow) appendValue(value[index], depth + 1)
      }
      if (!overflow) appendByte(0x5d)
      active.delete(value)
      return
    }
    const prototype = Object.getPrototypeOf(value)
    if (prototype !== Object.prototype && prototype !== null) throw new Error("INVALID_OUTPUT")
    const entries = []
    let keyBytes = 0
    for (const key in value) {
      if (!Object.hasOwn(value, key)) continue
      if (entries.length >= 65536) throw new Error("INVALID_OUTPUT")
      const bytes = sortBytes(key, outputByteLimit + 1 - keyBytes)
      if (bytes === undefined) {
        overflow = true
        break
      }
      keyBytes += bytes.length
      entries.push({ key, bytes })
    }
    entries.sort((left, right) => compareUnsignedBytes(left.bytes, right.bytes))
    appendByte(0x7b)
    for (let index = 0; index < entries.length && !overflow; index += 1) {
      const entry = entries[index]
      const descriptor = Object.getOwnPropertyDescriptor(value, entry.key)
      if (!descriptor || !("value" in descriptor)) throw new Error("INVALID_OUTPUT")
      if (index > 0) appendByte(0x2c)
      if (!overflow) appendString(entry.key)
      if (!overflow) appendByte(0x3a)
      if (!overflow) appendValue(descriptor.value, depth + 1)
    }
    if (!overflow) appendByte(0x7d)
    active.delete(value)
  }
  appendValue(root, 1)
  return overflow ? frame("O") : output.subarray(0, offset)
}
`
