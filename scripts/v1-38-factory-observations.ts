import type { StoredFactorySupervisionRecord } from "../packages/strategy-lab/src/factory/supervision-artifacts.js"
import type { ConcreteEdgeToken, NumericCalibrationEvidence } from "../packages/strategy-lab/src/factory/numeric-calibration.js"

type RecordValue = Readonly<Record<string, unknown>>
const KINDS = new Set(["receipt", "execution", "transition", "accounting", "result-state", "result-event", "unchanged-state", "trace"])
const CELL = /^[A-Za-z0-9][A-Za-z0-9:._-]{0,191}$/u
const FORBIDDEN = /(?:memory|objective|private|root|hash)/iu
// Only engine-owned public geometry/Action/Chronicle fields enter comparisons.
const FIELDS = new Set("action activationOrders soldierId self id ownerPlayerId status position x y facing awarenessGrid cells dx dy contents cycleIndex maxCycles hasAdvancedThisActivation phaseNumber roundNumber activationCount board bounds minX maxX minY maxY soldiers terrain mySoldiers enemySoldiers initiativePlayerId hasInitiative initialInitiativePlayerId type sequence payload reason context phase round activation cycle from to direction cause outcome winnerPlayerId players bottomPlayerId topPlayerId transitionKind classification coordinates events beforeState afterState terminalStatus alive active fallen stone shrinkingBounds count duration effectiveTurn priority".split(" "))
const fail = (code: string): never => { throw new TypeError(`FACTORY_OBSERVATION_${code}`) }
const record = (value: unknown, code: string): RecordValue => value !== null && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : fail(code)

export interface VerifiedFactoryCellKey {
  readonly key: string
  readonly block: "block-a" | "block-b"
  readonly candidateSide: "bottom" | "top"
  readonly initialInitiative: "candidate" | "opponent"
}
export interface FactoryObservationFacts {
  readonly legalInputScope: "privacy_safe_projection_only"
  readonly soldierBrainDecisionCount: number
  readonly turnToStoneCount: number
  readonly nonStoneToStoneCount: number
  readonly nonStoneToStoneDecisionCount: number
  readonly allSoldierBrainActionsStone: boolean | null
  readonly matchedPositiveDecisionCount: number
  readonly decisionSignatures: readonly string[]
  readonly guardBehaviors: readonly Readonly<{ sampleKey: string; hasAdvancedThisActivation: boolean | null; actionType: string | null }>[]
}
export interface VerifiedFactoryCellObservation {
  readonly evidence: NumericCalibrationEvidence
  readonly facts: FactoryObservationFacts
}
export interface VerifiedFactoryCellObservationInput {
  readonly sourceUtf8: string
  readonly cell: VerifiedFactoryCellKey
  readonly lineageEdges: readonly ConcreteEdgeToken[]
  readonly dependencyEdges: readonly ConcreteEdgeToken[]
  /** Records have already been reopened and content/root verified by the caller. */
  readonly records: readonly StoredFactorySupervisionRecord[]
}

const tokensFor = (value: unknown, side: "bottom" | "top", ids: Map<string, string>, path = "value"): string[] => {
  if (value === null) return [`${path}=null`]
  if (typeof value === "string") return [`${path}=${value}`]
  if (typeof value === "boolean") return [`${path}=${String(value)}`]
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return fail("RECORDS")
    const coordinate = side === "top" && /\.(?:x|y)$/u.test(path) ? 11 - value : side === "top" && /\.(?:dx|dy)$/u.test(path) ? -value : value
    return [`${path}=${coordinate}`]
  }
  if (Array.isArray(value)) return value.flatMap((entry, index) => tokensFor(entry, side, ids, `${path}[${index}]`))
  const object = record(value, "RECORDS"), output: string[] = []
  for (const key of Object.keys(object).sort()) {
    if (FORBIDDEN.test(key) || !FIELDS.has(key)) continue
    const entry = object[key], next = `${path}.${key}`
    if (/(?:^|_)id$/iu.test(key) || /Id$/u.test(key)) {
      if (typeof entry !== "string" || entry.length === 0) return fail("RECORDS")
      let normalized = ids.get(entry); if (!normalized) { normalized = `entity-${ids.size + 1}`; ids.set(entry, normalized) }
      output.push(`${next}=${normalized}`)
    } else output.push(...tokensFor(entry, side, ids, next))
  }
  return output
}

export const createNumericObservationFromVerifiedCell = (input: VerifiedFactoryCellObservationInput): Readonly<VerifiedFactoryCellObservation> => {
  if (!input.cell || !CELL.test(input.cell.key) || !["block-a", "block-b"].includes(input.cell.block) || !["bottom", "top"].includes(input.cell.candidateSide) || !["candidate", "opponent"].includes(input.cell.initialInitiative) || typeof input.sourceUtf8 !== "string" || input.sourceUtf8.length === 0 || !Array.isArray(input.records) || input.records.length === 0) return fail("RECORDS")
  if (input.records.some((item) => !item || !KINDS.has(item.kind) || !Number.isSafeInteger(item.ordinal) || item.ordinal < 0)) return fail("RECORDS")
  const executions = input.records.filter((item) => item.kind === "execution")
  if (executions.length !== 1 || record(executions[0]!.value, "EXECUTION").kind !== "completed") return fail("EXECUTION")
  const traces = input.records.filter((item) => item.kind === "trace")
  if (traces.length === 0) return fail("RECORDS")
  const ids = new Map<string, string>(), legalInputSamples: Record<string, readonly string[]> = {}, chronicleSamples: Record<string, readonly string[]> = {}, matchupSamples: Record<string, readonly string[]> = {}
  const decisionSignatures: string[] = [], guardBehaviors: Array<{ sampleKey: string; hasAdvancedThisActivation: boolean | null; actionType: string | null }> = []
  let soldierBrainDecisionCount = 0, turnToStoneCount = 0, nonStoneToStoneDecisionCount = 0
  const nonStoneIds = new Set<string>()
  const conditionKey = `${input.cell.block}:${input.cell.initialInitiative}`
  for (const item of traces) {
    const trace = record(item.value, "RECORDS"), method = trace.method
    if ((method !== "selectActivations" && method !== "soldierBrain") || trace.ordinal !== item.ordinal || !["success", "player_violation", "system_failure"].includes(String(trace.classification))) return fail("RECORDS")
    const request = record(trace.requestProjection, "RECORDS"), decision = record(trace.decisionProjection, "RECORDS"), sampleKey = `${conditionKey}:${method}:${item.ordinal}`
    const sampleTokens = [...tokensFor(request, input.cell.candidateSide, ids, "request"), ...tokensFor(decision, input.cell.candidateSide, ids, "decision"), `classification=${String(trace.classification)}`]
    legalInputSamples[sampleKey] = Object.freeze(sampleTokens)
    if (method === "soldierBrain") {
      soldierBrainDecisionCount += 1
      const action = decision.action === null ? null : record(decision.action, "RECORDS"), actionType = typeof action?.type === "string" ? action.type : null
      if (actionType === "TURN_TO_STONE") turnToStoneCount += 1
      const self = request.self === null ? null : record(request.self, "RECORDS"), status = typeof self?.status === "string" ? self.status : null
      if (status !== null && status !== "STONE" && typeof self?.id === "string") nonStoneIds.add(self.id)
      if (actionType === "TURN_TO_STONE" && status !== null && status !== "STONE") nonStoneToStoneDecisionCount += 1
      const signature = tokensFor(decision, input.cell.candidateSide, ids, "decision").join("|"); decisionSignatures.push(signature)
      guardBehaviors.push(Object.freeze({ sampleKey, hasAdvancedThisActivation: typeof request.hasAdvancedThisActivation === "boolean" ? request.hasAdvancedThisActivation : null, actionType }))
    }
  }
  for (const item of input.records) {
    if (item.kind === "transition" || item.kind === "result-event") chronicleSamples[`${conditionKey}:${item.kind === "transition" ? "transition" : "event"}:${item.ordinal}`] = Object.freeze([`record-kind=${item.kind}`, `record-ordinal=${item.ordinal}`, ...tokensFor(item.value, input.cell.candidateSide, ids, item.kind)])
    if (item.kind === "result-state" || item.kind === "result-event") matchupSamples[`${conditionKey}:${item.kind === "result-state" ? "final-state" : "final-event"}:${item.ordinal}`] = Object.freeze([`record-kind=${item.kind}`, `record-ordinal=${item.ordinal}`, ...tokensFor(item.value, input.cell.candidateSide, ids, item.kind)])
  }
  if (Object.keys(chronicleSamples).length === 0 || Object.keys(matchupSamples).length === 0) return fail("RECORDS")
  const counts = new Map<string, number>(); for (const signature of decisionSignatures) counts.set(signature, (counts.get(signature) ?? 0) + 1)
  const nonStoneToStoneCount = input.records.filter((entry) => {
    if (entry.kind !== "result-event") return false
    const event = record(entry.value, "RECORDS")
    if (event.type !== "SOLDIER_STONED") return false
    const payload = record(event.payload, "RECORDS")
    return typeof payload.soldierId === "string" && nonStoneIds.has(payload.soldierId)
  }).length
  const facts: FactoryObservationFacts = Object.freeze({ legalInputScope: "privacy_safe_projection_only", soldierBrainDecisionCount, turnToStoneCount, nonStoneToStoneCount, nonStoneToStoneDecisionCount, allSoldierBrainActionsStone: soldierBrainDecisionCount === 0 ? null : turnToStoneCount === soldierBrainDecisionCount, matchedPositiveDecisionCount: [...counts.values()].reduce((sum, count) => sum + Math.max(0, count - 1), 0), decisionSignatures: Object.freeze(decisionSignatures), guardBehaviors: Object.freeze(guardBehaviors) })
  return Object.freeze({ evidence: Object.freeze({ sourceUtf8: input.sourceUtf8, lineageEdgeTokens: input.lineageEdges, dependencyEdgeTokens: input.dependencyEdges, legalInputSamples: Object.freeze(legalInputSamples), chronicleSamples: Object.freeze(chronicleSamples), matchupSamples: Object.freeze(matchupSamples) }), facts })
}
