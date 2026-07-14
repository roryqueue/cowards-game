import { Buffer } from "node:buffer"
import type { RuntimeGuestObservationV117 } from "./abi-bridge.js"
import {
  CANDIDATE_HOST_ENVELOPE_OVERHEAD_V117,
  decodeCandidateHostEnvelopeV117,
} from "./candidate-host-envelope.js"

type RawSpawnResult = Readonly<{
  stdout: unknown
  stderr: unknown
  error?: Error | undefined
  signal: string | null
  status: number | null
  stdoutOverflow?: boolean | undefined
  stderrOverflow?: boolean | undefined
  terminationReceiptPresent?: boolean | undefined
  stdoutEof?: boolean | undefined
  stderrEof?: boolean | undefined
  containerCleanupRequired?: boolean | undefined
  containerCleanupVerified?: boolean | undefined
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

const observedPayloadBytes = (
  frame: Uint8Array,
  outputByteLimit: number,
): number => {
  const tag = String.fromCharCode(frame[0] ?? 0)
  if (tag === "S") return Math.max(0, frame.byteLength - 1)
  if (tag === "O") return outputByteLimit + 1
  return 0
}

const hasActualTransportReceipt = (result: RawSpawnResult): boolean =>
  result.terminationReceiptPresent === true &&
  result.stdoutEof === true &&
  result.stderrEof === true &&
  (result.containerCleanupRequired !== true ||
    result.containerCleanupVerified === true)

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
  const rawStdout = rawBytes(input.result.stdout)
  const rawStderr = rawBytes(input.result.stderr)
  const outerLaunchElapsedMilliseconds =
    Number(input.receivedAtNanoseconds - input.launchStartedNanoseconds) /
    1_000_000
  if (outerLaunchElapsedMilliseconds < 0) {
    return {
      kind: "system_failure",
      code: "TRANSPORT_CRASH",
      retryable: true,
      stdoutBytes: rawStdout?.byteLength ?? 0,
      stderrBytes: rawStderr?.byteLength ?? 0,
    }
  }
  if (input.result.error !== undefined) {
    return {
      kind: "system_failure",
      code: "HOST_CRASH",
      retryable: true,
      stdoutBytes: rawStdout?.byteLength ?? 0,
      stderrBytes: rawStderr?.byteLength ?? 0,
    }
  }
  if (rawStdout === undefined || rawStderr === undefined) {
    return {
      kind: "system_failure",
      code: "TRANSPORT_CRASH",
      retryable: true,
    }
  }
  const rawStdoutBytes = rawStdout.byteLength
  const stderrBytes = rawStderr.byteLength
  const stderrText = fatalUtf8(rawStderr)
  if (
    stderrText === undefined ||
    input.result.stdoutOverflow === true ||
    input.result.stderrOverflow === true ||
    stderrBytes > input.stderrByteLimit ||
    rawStdoutBytes >
      CANDIDATE_HOST_ENVELOPE_OVERHEAD_V117 + input.stdoutByteLimit + 1
  ) {
    return {
      kind: "system_failure",
      code: "TRANSPORT_CRASH",
      retryable: true,
      stdoutBytes: rawStdoutBytes,
      stderrBytes,
    }
  }

  const decoded = decodeCandidateHostEnvelopeV117(rawStdout)
  if (!decoded.ok || fatalUtf8(decoded.value.frame) === undefined) {
    return {
      kind: "system_failure",
      code: "TRANSPORT_CRASH",
      retryable: true,
      stdoutBytes: rawStdoutBytes,
      stderrBytes,
    }
  }
  const frame = decoded.value.frame
  const stdoutBytes = frame.byteLength
  if (stdoutBytes > input.stdoutByteLimit + 1) {
    return {
      kind: "system_failure",
      code: "TRANSPORT_CRASH",
      retryable: true,
      stdoutBytes,
      stderrBytes,
    }
  }

  const goNanoseconds = decoded.value.goNanoseconds
  const cancellationWithoutReceipt = goNanoseconds === undefined
    ? undefined
    : {
        terminationRequired: true,
        receiptPresent: false,
        graceMilliseconds: 0,
      }

  if (
    goNanoseconds === undefined &&
    outerLaunchElapsedMilliseconds > input.startupTimeoutMilliseconds
  ) {
    return {
      kind: "system_failure",
      code: "HOST_CRASH",
      retryable: true,
      stdoutBytes,
      stderrBytes,
    }
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
      bytes: frame,
      stdoutBytes,
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
  const rawTag = String.fromCharCode(frame[0] ?? 0)
  if (!deadlineExceeded && rawTag !== "D") {
    return {
      kind: "raw_frame",
      bytes: frame,
      stdoutBytes,
      stderrBytes,
      cancellation: {
        terminationRequired: false,
        receiptPresent: false,
        graceMilliseconds: 0,
      },
    }
  }

  const terminationMilliseconds = decoded.value.terminationMilliseconds
  const receiptGraceMilliseconds = Math.max(
    0,
    Math.ceil(elapsedMilliseconds - input.methodWallMilliseconds),
  )
  const receiptIsBounded =
    hasActualTransportReceipt(input.result) &&
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
    payloadBytes: observedPayloadBytes(frame, input.outputByteLimit),
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
