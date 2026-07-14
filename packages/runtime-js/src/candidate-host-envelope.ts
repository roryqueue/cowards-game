import { Buffer } from "node:buffer"

export const CANDIDATE_HOST_ENVELOPE_MAGIC_V117 = "CG17" as const
export const CANDIDATE_HOST_ENVELOPE_VERSION_V117 = 1 as const
export const CANDIDATE_HOST_ENVELOPE_OVERHEAD_V117 = 24 as const

const FLAG_GO = 1 << 0
const FLAG_TERMINATION = 1 << 1
const KNOWN_FLAGS = FLAG_GO | FLAG_TERMINATION
const MAX_U64 = (1n << 64n) - 1n

export type CandidateHostEnvelopeDecodeResultV117 =
  | Readonly<{
      ok: true
      value: Readonly<{
        frame: Uint8Array
        goNanoseconds?: bigint | undefined
        terminationMilliseconds?: number | undefined
      }>
    }>
  | Readonly<{
      ok: false
      reason:
        | "MALFORMED_HEADER"
        | "LENGTH_MISMATCH"
        | "CONTEXT_INCONSISTENT"
    }>

export const encodeCandidateHostEnvelopeV117 = (input: {
  readonly frame: Uint8Array
  readonly goNanoseconds?: bigint | undefined
  readonly terminationMilliseconds?: number | undefined
}): Buffer => {
  if (input.frame.byteLength === 0 || input.frame.byteLength > 0xffff_ffff) {
    throw new RangeError("Candidate host envelope frame length is invalid")
  }
  if (
    input.goNanoseconds !== undefined &&
    (input.goNanoseconds <= 0n || input.goNanoseconds > MAX_U64)
  ) {
    throw new RangeError("Candidate host envelope GO timestamp is invalid")
  }
  if (
    input.terminationMilliseconds !== undefined &&
    (!Number.isSafeInteger(input.terminationMilliseconds) ||
      input.terminationMilliseconds < 0 ||
      input.terminationMilliseconds > 0xffff_ffff)
  ) {
    throw new RangeError("Candidate host envelope termination duration is invalid")
  }

  const header = Buffer.alloc(CANDIDATE_HOST_ENVELOPE_OVERHEAD_V117)
  header.write(CANDIDATE_HOST_ENVELOPE_MAGIC_V117, 0, "ascii")
  header.writeUInt8(CANDIDATE_HOST_ENVELOPE_VERSION_V117, 4)
  header.writeUInt8(
    (input.goNanoseconds === undefined ? 0 : FLAG_GO) |
      (input.terminationMilliseconds === undefined ? 0 : FLAG_TERMINATION),
    5,
  )
  header.writeUInt16BE(0, 6)
  header.writeBigUInt64BE(input.goNanoseconds ?? 0n, 8)
  header.writeUInt32BE(input.terminationMilliseconds ?? 0, 16)
  header.writeUInt32BE(input.frame.byteLength, 20)
  return Buffer.concat([header, Buffer.from(input.frame)])
}

export const decodeCandidateHostEnvelopeV117 = (
  bytes: Uint8Array,
): CandidateHostEnvelopeDecodeResultV117 => {
  const buffer = Buffer.from(bytes)
  if (buffer.byteLength < CANDIDATE_HOST_ENVELOPE_OVERHEAD_V117) {
    return { ok: false, reason: "MALFORMED_HEADER" }
  }
  const flags = buffer.readUInt8(5)
  if (
    buffer.toString("ascii", 0, 4) !== CANDIDATE_HOST_ENVELOPE_MAGIC_V117 ||
    buffer.readUInt8(4) !== CANDIDATE_HOST_ENVELOPE_VERSION_V117 ||
    (flags & ~KNOWN_FLAGS) !== 0 ||
    buffer.readUInt16BE(6) !== 0
  ) {
    return { ok: false, reason: "MALFORMED_HEADER" }
  }
  const frameLength = buffer.readUInt32BE(20)
  if (
    frameLength === 0 ||
    buffer.byteLength !== CANDIDATE_HOST_ENVELOPE_OVERHEAD_V117 + frameLength
  ) {
    return { ok: false, reason: "LENGTH_MISMATCH" }
  }

  const goPresent = (flags & FLAG_GO) !== 0
  const terminationPresent = (flags & FLAG_TERMINATION) !== 0
  const goNanoseconds = buffer.readBigUInt64BE(8)
  const terminationMilliseconds = buffer.readUInt32BE(16)
  const frame = Uint8Array.from(
    buffer.subarray(CANDIDATE_HOST_ENVELOPE_OVERHEAD_V117),
  )
  const tag = String.fromCharCode(frame[0] ?? 0)
  if (
    (goPresent ? goNanoseconds === 0n : goNanoseconds !== 0n) ||
    (!terminationPresent && terminationMilliseconds !== 0) ||
    (terminationPresent && (!goPresent || tag !== "D")) ||
    (tag === "D" && (!goPresent || !terminationPresent))
  ) {
    return { ok: false, reason: "CONTEXT_INCONSISTENT" }
  }
  return {
    ok: true,
    value: {
      frame,
      ...(goPresent ? { goNanoseconds } : {}),
      ...(terminationPresent ? { terminationMilliseconds } : {}),
    },
  }
}
