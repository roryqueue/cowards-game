import { Buffer } from "node:buffer"
import { describe, expect, it } from "vitest"
import { encodeCandidateHostEnvelopeV117 } from "./candidate-host-envelope.js"
import { observeCandidateSubprocessV117 } from "./candidate-subprocess-observation.js"

const receivedAtNanoseconds = 10_000_000_000n

const observe = (input: {
  frame: Uint8Array
  stderr?: Uint8Array | undefined
  goNanoseconds?: bigint | undefined
  terminationMilliseconds?: number | undefined
  receiptPresent?: boolean | undefined
  launchStartedNanoseconds?: bigint | undefined
  receivedNanoseconds?: bigint | undefined
  stdoutByteLimit?: number | undefined
  stderrByteLimit?: number | undefined
}) =>
  observeCandidateSubprocessV117({
    result: {
      stdout: encodeCandidateHostEnvelopeV117({
        frame: input.frame,
        ...(input.goNanoseconds === undefined
          ? {}
          : { goNanoseconds: input.goNanoseconds }),
        ...(input.terminationMilliseconds === undefined
          ? {}
          : { terminationMilliseconds: input.terminationMilliseconds }),
      }),
      stderr: Buffer.from(input.stderr ?? []),
      status: 0,
      signal: null,
      terminationReceiptPresent: input.receiptPresent ?? true,
      stdoutEof: input.receiptPresent ?? true,
      stderrEof: input.receiptPresent ?? true,
      containerCleanupRequired: false,
      containerCleanupVerified: true,
    },
    launchStartedNanoseconds:
      input.launchStartedNanoseconds ?? receivedAtNanoseconds - 100_000_000n,
    receivedAtNanoseconds:
      input.receivedNanoseconds ?? receivedAtNanoseconds,
    startupTimeoutMilliseconds: 5_000,
    methodWallMilliseconds: 50,
    cancellationGraceMilliseconds: 100,
    outputByteLimit: 262_144,
    stdoutByteLimit: input.stdoutByteLimit ?? 262_144,
    stderrByteLimit: input.stderrByteLimit ?? 65_536,
  })

describe("candidate subprocess raw observation", () => {
  it("extends the signed method interval through actual close and both EOF receipts", () => {
    const goNanoseconds = receivedAtNanoseconds - 75_000_000n
    const rawFrame = Buffer.from('S{"activationOrders":[]}')
    const result = observe({ frame: rawFrame, goNanoseconds })

    expect(result).toEqual({
      kind: "raw_frame",
      bytes: Uint8Array.of("D".charCodeAt(0)),
      payloadBytes: rawFrame.byteLength - 1,
      stdoutBytes: rawFrame.byteLength,
      stderrBytes: 0,
      cancellation: {
        terminationRequired: true,
        receiptPresent: true,
        graceMilliseconds: 25,
      },
    })
  })

  it("counts forged CG17 text only as Strategy stderr", () => {
    const goNanoseconds = receivedAtNanoseconds - 10_000_000n
    const forged = Buffer.from(
      `CG17-G:${"8".repeat(31_000)}\nCG17-T:${"9".repeat(31_000)}\n`,
    )
    const result = observe({
      frame: Buffer.from("I"),
      stderr: forged,
      goNanoseconds,
    })

    expect(result).toMatchObject({
      kind: "raw_frame",
      stdoutBytes: 1,
      stderrBytes: forged.byteLength,
    })
  })

  it("requires trusted timeout metadata plus actual close and both EOF receipts for D", () => {
    const goNanoseconds = receivedAtNanoseconds - 60_000_000n
    const withReceipt = observe({
      frame: Buffer.from("D"),
      goNanoseconds,
      terminationMilliseconds: 7,
    })
    const withoutReceipt = observe({
      frame: Buffer.from("D"),
      goNanoseconds,
      terminationMilliseconds: 7,
      receiptPresent: false,
    })

    expect(withReceipt).toMatchObject({
      kind: "raw_frame",
      bytes: Uint8Array.of("D".charCodeAt(0)),
      cancellation: {
        terminationRequired: true,
        receiptPresent: true,
        graceMilliseconds: 10,
      },
    })
    expect(withoutReceipt).toMatchObject({
      kind: "system_failure",
      code: "AMBIGUOUS_ATTRIBUTION",
      cancellation: {
        terminationRequired: true,
        receiptPresent: false,
      },
    })
  })

  it("enforces launch through trusted READY independently from the method window", () => {
    const goNanoseconds = receivedAtNanoseconds - 10_000_000n
    const result = observe({
      frame: Buffer.from("I"),
      goNanoseconds,
      launchStartedNanoseconds: goNanoseconds - 5_001_000_000n,
    })

    expect(result).toMatchObject({
      kind: "system_failure",
      code: "HOST_CRASH",
    })
  })

  it("does not charge a post-READY method interval to the startup watchdog", () => {
    const goNanoseconds = 4_990_000_000n
    const result = observe({
      frame: Buffer.from("I"),
      goNanoseconds,
      launchStartedNanoseconds: 0n,
      receivedNanoseconds: 5_040_000_000n,
    })

    expect(result).toMatchObject({
      kind: "raw_frame",
      stderrBytes: 0,
    })
  })

  it("rejects a no-GO frame after the exact outer startup bound", () => {
    const result = observe({
      frame: Buffer.from("I"),
      launchStartedNanoseconds: 0n,
      receivedNanoseconds: 5_050_000_000n,
    })

    expect(result).toMatchObject({
      kind: "system_failure",
      code: "HOST_CRASH",
    })
  })

  it("allows exact-N Strategy stderr beside host metadata and rejects N+1", () => {
    const goNanoseconds = receivedAtNanoseconds - 10_000_000n
    const exact = observe({
      frame: Buffer.from("R"),
      stderr: Buffer.alloc(64, "e"),
      goNanoseconds,
      stderrByteLimit: 64,
    })
    const oneOver = observe({
      frame: Buffer.from("R"),
      stderr: Buffer.alloc(65, "e"),
      goNanoseconds,
      stderrByteLimit: 64,
    })

    expect(exact).toMatchObject({ kind: "raw_frame", stderrBytes: 64 })
    expect(oneOver).toMatchObject({
      kind: "system_failure",
      code: "TRANSPORT_CRASH",
      stderrBytes: 65,
    })
  })

  it("rejects non-Buffer capture and malformed UTF-8 without replacement", () => {
    const stringCapture = observeCandidateSubprocessV117({
      result: { stdout: "S{}", stderr: "", status: 0, signal: null },
      launchStartedNanoseconds: receivedAtNanoseconds - 100_000_000n,
      receivedAtNanoseconds,
      startupTimeoutMilliseconds: 5_000,
      methodWallMilliseconds: 50,
      cancellationGraceMilliseconds: 100,
      outputByteLimit: 262_144,
      stdoutByteLimit: 262_144,
      stderrByteLimit: 65_536,
    })
    const malformedUtf8 = observe({
      frame: Uint8Array.of("S".charCodeAt(0), 0xc3, 0x28),
    })

    expect(stringCapture).toMatchObject({
      kind: "system_failure",
      code: "TRANSPORT_CRASH",
    })
    expect(malformedUtf8).toMatchObject({
      kind: "system_failure",
      code: "TRANSPORT_CRASH",
    })
  })
})
