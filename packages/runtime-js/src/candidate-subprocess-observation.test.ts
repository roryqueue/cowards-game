import { Buffer } from "node:buffer"
import { describe, expect, it } from "vitest"
import {
  CANDIDATE_GO_CONTROL_PREFIX,
  CANDIDATE_TERMINATION_CONTROL_PREFIX,
  observeCandidateSubprocessV117,
} from "./candidate-subprocess-observation.js"

const receivedAtNanoseconds = 1_000_000_000n

const observe = (input: {
  stdout: Uint8Array
  stderr: Uint8Array
}) =>
  observeCandidateSubprocessV117({
    result: {
      stdout: Buffer.from(input.stdout),
      stderr: Buffer.from(input.stderr),
      status: 0,
      signal: null,
    },
    launchStartedNanoseconds: receivedAtNanoseconds - 100_000_000n,
    receivedAtNanoseconds,
    startupTimeoutMilliseconds: 5_000,
    methodWallMilliseconds: 50,
    cancellationGraceMilliseconds: 100,
    outputByteLimit: 262_144,
    stdoutByteLimit: 262_144,
    stderrByteLimit: 65_536,
  })

describe("candidate subprocess raw observation", () => {
  it("extends the signed method interval through complete frame and EOF receipt", () => {
    const goNanoseconds = receivedAtNanoseconds - 75_000_000n
    const rawFrame = Buffer.from('S{"activationOrders":[]}')
    const result = observe({
      stdout: rawFrame,
      stderr: Buffer.from(
        `${CANDIDATE_GO_CONTROL_PREFIX}${goNanoseconds}\n`,
      ),
    })

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

  it("excludes only exact host control records from Strategy stderr accounting", () => {
    const goNanoseconds = receivedAtNanoseconds - 10_000_000n
    const unknown = "guest diagnostic\n"
    const result = observe({
      stdout: Buffer.from("I"),
      stderr: Buffer.from(
        `${CANDIDATE_GO_CONTROL_PREFIX}${goNanoseconds}\n${unknown}`,
      ),
    })

    expect(result).toMatchObject({
      kind: "raw_frame",
      stderrBytes: Buffer.byteLength(unknown),
    })
  })

  it("requires both bounded termination and adapter receipt for D", () => {
    const goNanoseconds = receivedAtNanoseconds - 60_000_000n
    const withReceipt = observe({
      stdout: Buffer.from("D"),
      stderr: Buffer.from(
        `${CANDIDATE_GO_CONTROL_PREFIX}${goNanoseconds}\n` +
          `${CANDIDATE_TERMINATION_CONTROL_PREFIX}7\n`,
      ),
    })
    const withoutReceipt = observe({
      stdout: Buffer.from("D"),
      stderr: Buffer.from(
        `${CANDIDATE_GO_CONTROL_PREFIX}${goNanoseconds}\n`,
      ),
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

  it("enforces launch through READY independently from the method window", () => {
    const goNanoseconds = receivedAtNanoseconds - 10_000_000n
    const result = observeCandidateSubprocessV117({
      result: {
        stdout: Buffer.from("S{}"),
        stderr: Buffer.from(
          `${CANDIDATE_GO_CONTROL_PREFIX}${goNanoseconds}\n`,
        ),
        status: 0,
        signal: null,
      },
      launchStartedNanoseconds: goNanoseconds - 5_001_000_000n,
      receivedAtNanoseconds,
      startupTimeoutMilliseconds: 5_000,
      methodWallMilliseconds: 50,
      cancellationGraceMilliseconds: 100,
      outputByteLimit: 262_144,
      stdoutByteLimit: 262_144,
      stderrByteLimit: 65_536,
    })

    expect(result).toMatchObject({
      kind: "system_failure",
      code: "HOST_CRASH",
    })
  })

  it("does not charge a post-READY method interval to the startup watchdog", () => {
    const launchStartedNanoseconds = 0n
    const goNanoseconds = 4_990_000_000n
    const result = observeCandidateSubprocessV117({
      result: {
        stdout: Buffer.from("I"),
        stderr: Buffer.from(
          `${CANDIDATE_GO_CONTROL_PREFIX}${goNanoseconds}\n`,
        ),
        status: 0,
        signal: null,
      },
      launchStartedNanoseconds,
      receivedAtNanoseconds: 5_040_000_000n,
      startupTimeoutMilliseconds: 5_000,
      methodWallMilliseconds: 50,
      cancellationGraceMilliseconds: 100,
      outputByteLimit: 262_144,
      stdoutByteLimit: 262_144,
      stderrByteLimit: 65_536,
    })

    expect(result).toMatchObject({
      kind: "raw_frame",
      stderrBytes: 0,
    })
    if (result.kind === "raw_frame") {
      expect(Array.from(result.bytes)).toEqual(Array.from(Buffer.from("I")))
    }
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
      stdout: Uint8Array.of("S".charCodeAt(0), 0xc3, 0x28),
      stderr: new Uint8Array(),
    })

    expect(stringCapture).toMatchObject({
      kind: "system_failure",
      code: "TRANSPORT_CRASH",
    })
    expect(malformedUtf8).toMatchObject({
      kind: "system_failure",
      code: "TRANSPORT_CRASH",
      stdoutBytes: 3,
    })
  })
})
