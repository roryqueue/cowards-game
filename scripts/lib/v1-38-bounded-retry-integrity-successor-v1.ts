import { Buffer } from "node:buffer"
import {
  closeSync,
  constants,
  fsyncSync,
  openSync,
  writeSync,
} from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  V138_BOUNDED_RETRY_V2_POLICY,
  appendV138RetryV2JournalRecord,
  checkV138InactiveRetryV2Envelope,
  deriveV138RetryV2State,
  type V138InactiveRetryV2Envelope,
  type V138RetryV2JournalRecord,
} from "./v1-38-bounded-retry-envelope-v2.js"

const fail = (code: string): never => {
  throw new TypeError(code)
}

export const V138_RETRY_INTEGRITY_SUCCESSOR_CLI = fileURLToPath(import.meta.url)

/**
 * Additive recovery for the immutable v2 controller's admitted-observation
 * crash gap. This function never re-observes headroom. It either charges the
 * admitted observation to the next route or closes the envelope at its exact
 * inclusive deadline.
 */
export const recoverV138AdmittedObservationWithoutRoute = (input: {
  envelope: V138InactiveRetryV2Envelope
  records: readonly V138RetryV2JournalRecord[]
  owner: string
  nowMilliseconds: number
  appendDurableRecord: (record: V138RetryV2JournalRecord) => void
}): readonly V138RetryV2JournalRecord[] => {
  const envelope = checkV138InactiveRetryV2Envelope(input.envelope)
  const state = deriveV138RetryV2State(envelope, input.records)
  if (state.disposition !== "active") return Object.freeze([...input.records])

  const admitted = input.records.find(
    (record) =>
      record.kind === "observe_preflight" &&
      record.effectiveAvailableBasisPoints >=
        V138_BOUNDED_RETRY_V2_POLICY.minimumEffectiveAvailableBasisPoints &&
      !input.records.some(
        (candidate) =>
          candidate.kind === "reserve_route" &&
          candidate.preflightIdentity === record.identity,
      ),
  )
  if (admitted === undefined) return Object.freeze([...input.records])
  if (admitted.owner !== input.owner) return fail("V138_RETRY_SUCCESSOR_OWNER_MISMATCH")

  const deadline =
    state.firstObservationMilliseconds === null
      ? null
      : state.firstObservationMilliseconds +
        V138_BOUNDED_RETRY_V2_POLICY.envelopeLifetimeMilliseconds
  const event =
    deadline !== null && input.nowMilliseconds >= deadline
      ? ({
          kind: "time_window_expired",
          owner: input.owner,
          reason: "time_window_expired",
        } as const)
      : state.nextRouteIdentity === null
        ? fail("V138_RETRY_SUCCESSOR_ADMITTED_WITHOUT_ROUTE_CAPACITY")
        : ({
            kind: "reserve_route",
            identity: state.nextRouteIdentity,
            owner: input.owner,
            preflightIdentity: admitted.identity,
          } as const)
  const next = appendV138RetryV2JournalRecord(
    input.records,
    event,
    input.nowMilliseconds,
    envelope.envelopeRoot,
  )
  input.appendDurableRecord(next.at(-1)!)
  return Object.freeze([...next])
}

const writeCrashProbe = (
  journalPath: string,
  recordsBase64: string,
  boundary: string,
): never => {
  const records = JSON.parse(
    Buffer.from(recordsBase64, "base64").toString("utf8"),
  ) as V138RetryV2JournalRecord[]
  const descriptor = openSync(
    path.resolve(journalPath),
    constants.O_WRONLY |
      constants.O_CREAT |
      constants.O_EXCL |
      (constants.O_NOFOLLOW ?? 0),
    0o600,
  )
  try {
    for (const record of records) {
      writeSync(descriptor, `${JSON.stringify(record)}\n`)
      fsyncSync(descriptor)
      if (record.kind === boundary) process.kill(process.pid, "SIGKILL")
    }
  } finally {
    closeSync(descriptor)
  }
  return fail("V138_RETRY_SUCCESSOR_CRASH_BOUNDARY_NOT_FOUND")
}

if (process.argv[2] === "--crash-probe") {
  const [, , command, journalPath, recordsBase64, boundary] = process.argv
  if (
    command !== "--crash-probe" ||
    journalPath === undefined ||
    recordsBase64 === undefined ||
    boundary === undefined
  ) {
    fail("V138_RETRY_SUCCESSOR_SOURCE_ONLY")
  }
  writeCrashProbe(journalPath, recordsBase64, boundary)
}
