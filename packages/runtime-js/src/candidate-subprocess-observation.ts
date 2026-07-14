import { Buffer } from "node:buffer"
import type { RuntimeGuestObservationV117 } from "./abi-bridge.js"

export const CANDIDATE_GO_CONTROL_PREFIX = "CG17-G:" as const
export const CANDIDATE_TERMINATION_CONTROL_PREFIX = "CG17-T:" as const

type RawSpawnResult = Readonly<{
  stdout: unknown
  stderr: unknown
  error?: Error | undefined
  signal: string | null
  status: number | null
}>

const rawBytes = (value: unknown): Uint8Array | undefined =>
  Buffer.isBuffer(value) ? Uint8Array.from(value) : undefined

const fatalUtf8 = (bytes: Uint8Array): string | undefined => {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes)
  } catch {
    return undefined
  }
}

const controlInteger = (
  text: string,
  prefix: string,
): string | undefined => {
  const matches = text
    .split("\n")
    .filter((line) => line.startsWith(prefix))
  if (matches.length !== 1) return undefined
  const value = matches[0]?.slice(prefix.length)
  return value !== undefined && /^(0|[1-9][0-9]*)$/u.test(value)
    ? value
    : undefined
}

const observedPayloadBytes = (
  frame: Uint8Array,
  outputByteLimit: number,
): number => {
  const tag = String.fromCharCode(frame[0] ?? 0)
  if (tag === "S") return Math.max(0, frame.byteLength - 1)
  if (tag === "O") return outputByteLimit + 1
  return 0
}

export const observeCandidateSubprocessV117 = (input: {
  result: RawSpawnResult
  launchStartedNanoseconds: bigint
  receivedAtNanoseconds: bigint
  startupTimeoutMilliseconds: number
  methodWallMilliseconds: number
  cancellationGraceMilliseconds: number
  outputByteLimit: number
  stdoutByteLimit: number
  stderrByteLimit: number
}): RuntimeGuestObservationV117 => {
  const stdout = rawBytes(input.result.stdout)
  const stderr = rawBytes(input.result.stderr)
  if (input.result.error !== undefined) {
    return {
      kind: "system_failure",
      code: "HOST_CRASH",
      retryable: true,
      stdoutBytes: stdout?.byteLength ?? 0,
      stderrBytes: stderr?.byteLength ?? 0,
    }
  }
  if (stdout === undefined || stderr === undefined) {
    return {
      kind: "system_failure",
      code: "TRANSPORT_CRASH",
      retryable: true,
    }
  }
  const stdoutBytes = stdout.byteLength
  const stderrBytes = stderr.byteLength
  const stdoutText = fatalUtf8(stdout)
  const stderrText = fatalUtf8(stderr)
  if (
    stdoutText === undefined ||
    stderrText === undefined ||
    stderrBytes > input.stderrByteLimit ||
    stdoutBytes > input.stdoutByteLimit + 1
  ) {
    return {
      kind: "system_failure",
      code: "TRANSPORT_CRASH",
      retryable: true,
      stdoutBytes,
      stderrBytes,
    }
  }

  const goText = controlInteger(stderrText, CANDIDATE_GO_CONTROL_PREFIX)
  const goNanoseconds = goText === undefined ? undefined : BigInt(goText)
  const cancellationWithoutReceipt = goNanoseconds === undefined
    ? undefined
    : {
        terminationRequired: true,
        receiptPresent: false,
        graceMilliseconds: 0,
      }

  if (
    input.result.signal !== null ||
    (input.result.status !== null && input.result.status !== 0)
  ) {
    return {
      kind: "system_failure",
      code: "RUNTIME_CRASH",
      retryable: true,
      stdoutBytes,
      stderrBytes,
      ...(cancellationWithoutReceipt === undefined
        ? {}
        : { cancellation: cancellationWithoutReceipt }),
    }
  }

  if (goNanoseconds === undefined) {
    return {
      kind: "raw_frame",
      bytes: stdout,
      stderrBytes,
    }
  }
  if (
    goNanoseconds < input.launchStartedNanoseconds ||
    goNanoseconds > input.receivedAtNanoseconds
  ) {
    return {
      kind: "system_failure",
      code: "TRANSPORT_CRASH",
      retryable: true,
      stdoutBytes,
      stderrBytes,
    }
  }

  const startupElapsedMilliseconds =
    Number(goNanoseconds - input.launchStartedNanoseconds) / 1_000_000
  if (startupElapsedMilliseconds > input.startupTimeoutMilliseconds) {
    return {
      kind: "system_failure",
      code: "HOST_CRASH",
      retryable: true,
      stdoutBytes,
      stderrBytes,
    }
  }

  const elapsedMilliseconds =
    Number(input.receivedAtNanoseconds - goNanoseconds) / 1_000_000
  const deadlineExceeded = elapsedMilliseconds > input.methodWallMilliseconds
  const rawTag = String.fromCharCode(stdout[0] ?? 0)
  if (!deadlineExceeded && rawTag !== "D") {
    return {
      kind: "raw_frame",
      bytes: stdout,
      stderrBytes,
      cancellation: {
        terminationRequired: false,
        receiptPresent: false,
        graceMilliseconds: 0,
      },
    }
  }

  const terminationText = controlInteger(
    stderrText,
    CANDIDATE_TERMINATION_CONTROL_PREFIX,
  )
  const terminationMilliseconds =
    terminationText === undefined ? undefined : Number(terminationText)
  const receiptGraceMilliseconds = Math.max(
    0,
    Math.ceil(elapsedMilliseconds - input.methodWallMilliseconds),
  )
  const receiptIsBounded =
    receiptGraceMilliseconds <= input.cancellationGraceMilliseconds &&
    (rawTag !== "D" ||
      (terminationMilliseconds !== undefined &&
        terminationMilliseconds <= input.cancellationGraceMilliseconds))
  if (!receiptIsBounded) {
    return {
      kind: "system_failure",
      code: "AMBIGUOUS_ATTRIBUTION",
      retryable: false,
      stdoutBytes,
      stderrBytes,
      cancellation: {
        terminationRequired: true,
        receiptPresent: false,
        graceMilliseconds: 0,
      },
    }
  }

  return {
    kind: "raw_frame",
    bytes: Uint8Array.of("D".charCodeAt(0)),
    payloadBytes: observedPayloadBytes(stdout, input.outputByteLimit),
    stdoutBytes,
    stderrBytes,
    cancellation: {
      terminationRequired: true,
      receiptPresent: true,
      graceMilliseconds: Math.max(
        receiptGraceMilliseconds,
        terminationMilliseconds ?? 0,
      ),
    },
  }
}
