import { Buffer } from "node:buffer"
import { describe, expect, it } from "vitest"
import {
  CANDIDATE_HOST_ENVELOPE_OVERHEAD_V117,
  decodeCandidateHostEnvelopeV117,
  encodeCandidateHostEnvelopeV117,
} from "./candidate-host-envelope.js"

describe("candidate trusted host envelope", () => {
  it("round-trips trusted GO separately from the raw Strategy frame", () => {
    const frame = Buffer.from('S{"activationOrders":[],"strategyMemory":null}')
    const encoded = encodeCandidateHostEnvelopeV117({
      frame,
      goNanoseconds: 123_456_789n,
    })
    const decoded = decodeCandidateHostEnvelopeV117(encoded)

    expect(encoded).toHaveLength(
      CANDIDATE_HOST_ENVELOPE_OVERHEAD_V117 + frame.byteLength,
    )
    expect(decoded).toMatchObject({
      ok: true,
      value: { goNanoseconds: 123_456_789n },
    })
    if (decoded.ok) expect(Array.from(decoded.value.frame)).toEqual(Array.from(frame))
  })

  it("rejects termination metadata outside a D timeout context", () => {
    const encoded = encodeCandidateHostEnvelopeV117({
      frame: Buffer.from("I"),
      goNanoseconds: 123n,
      terminationMilliseconds: 7,
    })

    expect(decodeCandidateHostEnvelopeV117(encoded)).toEqual({
      ok: false,
      reason: "CONTEXT_INCONSISTENT",
    })
  })

  it("rejects D without both trusted GO and termination metadata", () => {
    const encoded = encodeCandidateHostEnvelopeV117({
      frame: Buffer.from("D"),
      goNanoseconds: 123n,
    })

    expect(decodeCandidateHostEnvelopeV117(encoded)).toEqual({
      ok: false,
      reason: "CONTEXT_INCONSISTENT",
    })
  })

  it("rejects trailing bytes instead of accepting a forged second control surface", () => {
    const encoded = encodeCandidateHostEnvelopeV117({
      frame: Buffer.from("I"),
      goNanoseconds: 123n,
    })

    expect(
      decodeCandidateHostEnvelopeV117(
        Buffer.concat([encoded, Buffer.from("CG17-T:999999999")]),
      ),
    ).toEqual({ ok: false, reason: "LENGTH_MISMATCH" })
  })
})
