import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
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

const canonical = (value: unknown): string => {
  const normalize = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(normalize)
    if (item !== null && typeof item === "object") {
      return Object.fromEntries(
        Object.entries(item as Record<string, unknown>)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, child]) => [key, normalize(child)]),
      )
    }
    return item
  }
  return `${JSON.stringify(normalize(value))}\n`
}
const successorSha256 = (value: string): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

type EffectKind = "preflight" | "calibration" | "reproduction"
type EffectStatus = "observed" | "admitted" | "system_failure" | "passed_exact"
type EffectStarted = Readonly<{
  kind: "effect_started"
  effectKind: EffectKind
  effectIdentity: string
  owner: string
  startedAtMilliseconds: number
}>
type EffectFinished = Readonly<{
  kind: "effect_finished"
  effectKind: EffectKind
  effectIdentity: string
  owner: string
  status: EffectStatus
  acceptedCells: number
  completeCleanup: boolean
  completedAtMilliseconds: number
}>
type SuccessorDecision = Readonly<{
  kind:
    | "deadline_expired"
    | "reproduction_exact_terminal"
    | "effect_failure_terminal"
    | "effect_recorded"
  effectIdentity: string
  owner: string
  decidedAtMilliseconds: number
}>
type SuccessorIntegrityEvent = EffectStarted | EffectFinished | SuccessorDecision

export type V138SuccessorIntegrityRecord = Readonly<{
  schemaVersion: "v1.38-retry-integrity-successor-record-v1"
  ordinal: number
  previousRoot: `sha256:${string}`
  event: SuccessorIntegrityEvent
  recordRoot: `sha256:${string}`
}>

const SUCCESSOR_GENESIS = successorSha256(
  "v1.38-retry-integrity-successor-record-v1:genesis",
)

const appendSuccessorRecord = (
  records: readonly V138SuccessorIntegrityRecord[],
  event: SuccessorIntegrityEvent,
): V138SuccessorIntegrityRecord => {
  const body = {
    schemaVersion: "v1.38-retry-integrity-successor-record-v1" as const,
    ordinal: records.length,
    previousRoot: records.at(-1)?.recordRoot ?? SUCCESSOR_GENESIS,
    event,
  }
  return Object.freeze({
    ...body,
    recordRoot: successorSha256(`v138-retry-integrity-successor-v1\0${canonical(body)}`),
  })
}

const authenticateSuccessorRecords = (
  records: readonly V138SuccessorIntegrityRecord[],
): void => {
  let previousRoot = SUCCESSOR_GENESIS
  records.forEach((record, ordinal) => {
    const expected = appendSuccessorRecord(records.slice(0, ordinal), record.event)
    if (
      record.schemaVersion !== "v1.38-retry-integrity-successor-record-v1" ||
      record.ordinal !== ordinal ||
      record.previousRoot !== previousRoot ||
      canonical(record) !== canonical(expected)
    ) {
      fail("V138_RETRY_SUCCESSOR_JOURNAL_INVALID")
    }
    previousRoot = record.recordRoot
  })
}

export type V138SuccessorEffectDisposition =
  | "effect_in_progress"
  | "effect_recorded"
  | "deadline_expired"
  | "reproduction_exact"
  | "effect_failure"

const decisionFor = (
  finish: EffectFinished,
  deadlineMilliseconds: number,
): SuccessorDecision => {
  const base = {
    effectIdentity: finish.effectIdentity,
    owner: finish.owner,
    decidedAtMilliseconds: finish.completedAtMilliseconds,
  }
  if (
    finish.effectKind === "reproduction" &&
    finish.status === "passed_exact" &&
    finish.acceptedCells === 540 &&
    finish.completeCleanup
  ) {
    return { ...base, kind: "reproduction_exact_terminal" }
  }
  if (
    finish.status === "system_failure" ||
    (finish.effectKind === "reproduction" && finish.acceptedCells !== 540) ||
    !finish.completeCleanup
  ) {
    return { ...base, kind: "effect_failure_terminal" }
  }
  if (finish.completedAtMilliseconds >= deadlineMilliseconds) {
    return { ...base, kind: "deadline_expired" }
  }
  return { ...base, kind: "effect_recorded" }
}

export const recoverV138SuccessorEffectDecision = (input: {
  records: readonly V138SuccessorIntegrityRecord[]
  deadlineMilliseconds: number
  appendDurableRecord: (record: V138SuccessorIntegrityRecord) => void
}): Readonly<{
  records: readonly V138SuccessorIntegrityRecord[]
  disposition: V138SuccessorEffectDisposition
  acceptedCells: number
  completeCleanup: boolean
}> => {
  authenticateSuccessorRecords(input.records)
  let records = [...input.records]
  const finish = records.find(
    (record): record is V138SuccessorIntegrityRecord & { event: EffectFinished } =>
      record.event.kind === "effect_finished",
  )?.event
  if (finish === undefined) {
    return Object.freeze({
      records: Object.freeze(records),
      disposition: "effect_in_progress" as const,
      acceptedCells: 0,
      completeCleanup: false,
    })
  }
  let decision = records.find(
    (record): record is V138SuccessorIntegrityRecord & { event: SuccessorDecision } =>
      record.event.kind !== "effect_started" && record.event.kind !== "effect_finished",
  )?.event
  if (decision === undefined) {
    decision = decisionFor(finish, input.deadlineMilliseconds)
    const record = appendSuccessorRecord(records, decision)
    input.appendDurableRecord(record)
    records = [...records, record]
  }
  const disposition: V138SuccessorEffectDisposition =
    decision.kind === "reproduction_exact_terminal"
      ? "reproduction_exact"
      : decision.kind === "deadline_expired"
        ? "deadline_expired"
        : decision.kind === "effect_failure_terminal"
          ? "effect_failure"
          : "effect_recorded"
  return Object.freeze({
    records: Object.freeze(records),
    disposition,
    acceptedCells: finish.acceptedCells,
    completeCleanup: finish.completeCleanup,
  })
}

export const completeV138SuccessorEffect = async (input: {
  records: readonly V138SuccessorIntegrityRecord[]
  effectKind: EffectKind
  effectIdentity: string
  owner: string
  deadlineMilliseconds: number
  monotonicMilliseconds: () => number
  runEffect: () => Promise<
    Readonly<{
      status: EffectStatus
      acceptedCells?: number
      completeCleanup: boolean
    }>
  >
  appendDurableRecord: (record: V138SuccessorIntegrityRecord) => void
}): Promise<ReturnType<typeof recoverV138SuccessorEffectDecision>> => {
  authenticateSuccessorRecords(input.records)
  let records = [...input.records]
  if (records.length !== 0) fail("V138_RETRY_SUCCESSOR_EFFECT_ALREADY_STARTED")
  const started = appendSuccessorRecord(records, {
    kind: "effect_started",
    effectKind: input.effectKind,
    effectIdentity: input.effectIdentity,
    owner: input.owner,
    startedAtMilliseconds: input.monotonicMilliseconds(),
  })
  input.appendDurableRecord(started)
  records.push(started)
  let result: Awaited<ReturnType<typeof input.runEffect>>
  try {
    result = await input.runEffect()
  } catch {
    result = { status: "system_failure", acceptedCells: 0, completeCleanup: false }
  }
  const finished = appendSuccessorRecord(records, {
    kind: "effect_finished",
    effectKind: input.effectKind,
    effectIdentity: input.effectIdentity,
    owner: input.owner,
    status: result.status,
    acceptedCells: result.acceptedCells ?? 0,
    completeCleanup: result.completeCleanup,
    completedAtMilliseconds: input.monotonicMilliseconds(),
  })
  input.appendDurableRecord(finished)
  records.push(finished)
  return recoverV138SuccessorEffectDecision({
    records,
    deadlineMilliseconds: input.deadlineMilliseconds,
    appendDurableRecord: input.appendDurableRecord,
  })
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
