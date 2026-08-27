import { createHash } from "node:crypto"

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
const sha256 = (value: string): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

export type V138EffectKindV2 = "preflight" | "calibration" | "reproduction"
export type V138EffectFinishV2 =
  | Readonly<{ effectKind: "preflight"; status: "observed"; acceptedCells: 0; completeCleanup: true }>
  | Readonly<{ effectKind: "calibration"; status: "admitted"; acceptedCells: 0; completeCleanup: true }>
  | Readonly<{ effectKind: "reproduction"; status: "passed_exact"; acceptedCells: 540; completeCleanup: true }>
  | Readonly<{ effectKind: V138EffectKindV2; status: "system_failure"; acceptedCells: 0; completeCleanup: false }>

export type V138EffectEventV2 =
  | Readonly<{
      kind: "effect_started"
      effectKind: V138EffectKindV2
      effectIdentity: string
      owner: string
      startedAtMilliseconds: number
    }>
  | (V138EffectFinishV2 &
      Readonly<{
        kind: "effect_finished"
        effectIdentity: string
        owner: string
        completedAtMilliseconds: number
      }>)
  | Readonly<{
      kind: "effect_decided"
      effectIdentity: string
      owner: string
      decidedAtMilliseconds: number
      disposition: "effect_recorded" | "deadline_expired" | "effect_failure" | "reproduction_exact"
    }>

export type V138EffectRecordV2 = Readonly<{
  schemaVersion: "v1.38-successor-effect-record-v2"
  ordinal: number
  previousRoot: `sha256:${string}`
  event: V138EffectEventV2
  recordRoot: `sha256:${string}`
}>

const GENESIS = sha256("v1.38-successor-effect-record-v2:genesis")

export const appendV138EffectRecordV2 = (
  records: readonly V138EffectRecordV2[],
  event: V138EffectEventV2,
): V138EffectRecordV2 => {
  const body = {
    schemaVersion: "v1.38-successor-effect-record-v2" as const,
    ordinal: records.length,
    previousRoot: records.at(-1)?.recordRoot ?? GENESIS,
    event,
  }
  return Object.freeze({
    ...body,
    recordRoot: sha256(`v138-successor-effect-v2\0${canonical(body)}`),
  })
}

const legalFinish = (finish: Extract<V138EffectEventV2, { kind: "effect_finished" }>): boolean => {
  if (finish.status === "system_failure") {
    return finish.acceptedCells === 0 && finish.completeCleanup === false
  }
  if (finish.effectKind === "preflight") {
    return finish.status === "observed" && finish.acceptedCells === 0 && finish.completeCleanup
  }
  if (finish.effectKind === "calibration") {
    return finish.status === "admitted" && finish.acceptedCells === 0 && finish.completeCleanup
  }
  return finish.status === "passed_exact" && finish.acceptedCells === 540 && finish.completeCleanup
}

const decisionFor = (
  finish: Extract<V138EffectEventV2, { kind: "effect_finished" }>,
  deadlineMilliseconds: number,
): Extract<V138EffectEventV2, { kind: "effect_decided" }> => ({
  kind: "effect_decided",
  effectIdentity: finish.effectIdentity,
  owner: finish.owner,
  decidedAtMilliseconds: finish.completedAtMilliseconds,
  disposition:
    finish.effectKind === "reproduction" &&
    finish.status === "passed_exact" &&
    finish.acceptedCells === 540 &&
    finish.completeCleanup
      ? "reproduction_exact"
      : finish.status === "system_failure"
        ? "effect_failure"
        : finish.completedAtMilliseconds >= deadlineMilliseconds
          ? "deadline_expired"
          : "effect_recorded",
})

export const authenticateV138EffectRecordsV2 = (
  records: readonly V138EffectRecordV2[],
  deadlineMilliseconds: number,
): true => {
  if (records.length > 3) fail("V138_EFFECT_V2_RECORD_COUNT_INVALID")
  let prefix: V138EffectRecordV2[] = []
  for (const record of records) {
    if (canonical(record) !== canonical(appendV138EffectRecordV2(prefix, record.event))) {
      fail("V138_EFFECT_V2_HASH_CHAIN_INVALID")
    }
    prefix = [...prefix, record]
  }
  const [startRecord, finishRecord, decisionRecord] = records
  if (startRecord === undefined || startRecord.event.kind !== "effect_started") {
    fail("V138_EFFECT_V2_START_INVALID")
  }
  if (finishRecord !== undefined) {
    if (finishRecord.event.kind !== "effect_finished" || !legalFinish(finishRecord.event)) {
      fail("V138_EFFECT_V2_FINISH_INVALID")
    }
    if (
      finishRecord.event.effectIdentity !== startRecord.event.effectIdentity ||
      finishRecord.event.owner !== startRecord.event.owner ||
      finishRecord.event.effectKind !== startRecord.event.effectKind ||
      finishRecord.event.completedAtMilliseconds < startRecord.event.startedAtMilliseconds
    ) {
      fail("V138_EFFECT_V2_CONTINUITY_INVALID")
    }
  }
  if (decisionRecord !== undefined) {
    if (finishRecord === undefined || finishRecord.event.kind !== "effect_finished") {
      fail("V138_EFFECT_V2_DECISION_WITHOUT_FINISH")
    }
    const expected = decisionFor(finishRecord.event, deadlineMilliseconds)
    if (decisionRecord.event.kind !== "effect_decided" || canonical(decisionRecord.event) !== canonical(expected)) {
      fail("V138_EFFECT_V2_DECISION_INVALID")
    }
  }
  return true
}

export const recoverV138EffectDecisionV2 = (input: {
  records: readonly V138EffectRecordV2[]
  deadlineMilliseconds: number
  appendDurableRecord: (record: V138EffectRecordV2) => void
}): Readonly<{
  records: readonly V138EffectRecordV2[]
  disposition: "effect_in_progress" | "effect_recorded" | "deadline_expired" | "effect_failure" | "reproduction_exact"
  acceptedCells: number
  completeCleanup: boolean
}> => {
  authenticateV138EffectRecordsV2(input.records, input.deadlineMilliseconds)
  const finish = input.records[1]?.event
  if (finish === undefined || finish.kind !== "effect_finished") {
    return Object.freeze({ records: Object.freeze([...input.records]), disposition: "effect_in_progress", acceptedCells: 0, completeCleanup: false })
  }
  let records = [...input.records]
  let decision = records[2]?.event
  if (decision === undefined) {
    decision = decisionFor(finish, input.deadlineMilliseconds)
    const record = appendV138EffectRecordV2(records, decision)
    input.appendDurableRecord(record)
    records = [...records, record]
  }
  if (decision.kind !== "effect_decided") fail("V138_EFFECT_V2_DECISION_INVALID")
  return Object.freeze({
    records: Object.freeze(records),
    disposition: decision.disposition,
    acceptedCells: finish.acceptedCells,
    completeCleanup: finish.completeCleanup,
  })
}

export const completeV138EffectV2 = async (input: {
  effectKind: V138EffectKindV2
  effectIdentity: string
  owner: string
  deadlineMilliseconds: number
  monotonicMilliseconds: () => number
  runEffect: () => Promise<Omit<V138EffectFinishV2, "effectKind">>
  appendDurableRecord: (record: V138EffectRecordV2) => void
}): Promise<ReturnType<typeof recoverV138EffectDecisionV2>> => {
  let records: V138EffectRecordV2[] = []
  const start = appendV138EffectRecordV2(records, {
    kind: "effect_started",
    effectKind: input.effectKind,
    effectIdentity: input.effectIdentity,
    owner: input.owner,
    startedAtMilliseconds: input.monotonicMilliseconds(),
  })
  input.appendDurableRecord(start)
  records.push(start)
  let result: Omit<V138EffectFinishV2, "effectKind">
  try {
    result = await input.runEffect()
  } catch {
    result = { status: "system_failure", acceptedCells: 0, completeCleanup: false }
  }
  const finish = appendV138EffectRecordV2(records, {
    ...result,
    kind: "effect_finished",
    effectKind: input.effectKind,
    effectIdentity: input.effectIdentity,
    owner: input.owner,
    completedAtMilliseconds: input.monotonicMilliseconds(),
  } as Extract<V138EffectEventV2, { kind: "effect_finished" }>)
  input.appendDurableRecord(finish)
  records.push(finish)
  return recoverV138EffectDecisionV2({ records, deadlineMilliseconds: input.deadlineMilliseconds, appendDurableRecord: input.appendDurableRecord })
}
