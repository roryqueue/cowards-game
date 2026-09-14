import { createHash } from "node:crypto"
import {
  ActionSchema,
  SoldierBrainInputV119Schema,
  StrategyInputV119Schema,
  type Action,
  type SoldierBrainResult,
  type StrategyResult,
} from "../../spec/src/index.js"
import {
  TEACHER_CONTROLLER_VERSION,
  controllerActivationFeature,
  controllerBrainFeature,
  controllerSelectActivations,
  controllerSoldierBrain,
  type TeacherActivationFeature,
  type TeacherBrainFeature,
  type TeacherFeaturePolicy,
} from "./controller.js"
import type { TeacherSearchReceipt } from "./teacher.js"

type ParsedStrategyInput = ReturnType<typeof StrategyInputV119Schema.parse>
type ParsedBrainInput = ReturnType<typeof SoldierBrainInputV119Schema.parse>
export type StudentAction = Action
export type LegalTrainingRecord =
  | { readonly kind: "activation"; readonly input: ParsedStrategyInput; readonly target: "press" | "screen" }
  | { readonly kind: "brain"; readonly input: ParsedBrainInput; readonly target: StudentAction }

export interface DistilledLegalStudent {
  readonly schemaVersion: "teacher-distilled-student-v3"
  readonly featurePolicy: TeacherFeaturePolicy
  readonly controllerRoot: `sha256:${string}`
}

export interface CompiledLegalStudentPolicy {
  readonly representation: "canonical-v119-bounded-legal-features-v2"
  readonly student: DistilledLegalStudent
  readonly controllerRoot: `sha256:${string}`
}

const ROOT = /^sha256:[0-9a-f]{64}$/u
const root = (value: unknown): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(JSON.stringify(value)).digest("hex")}`
const fail = (code: string): never => { throw new TypeError(`TEACHER_${code}`) }

const deepFreeze = <T>(value: T): T => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}

function exactKeys(value: unknown, expected: readonly string[], code: string): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) fail(code)
  const actual = Object.keys(value as object).sort()
  const wanted = [...expected].sort()
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) fail(code)
}

const exactValue = (left: unknown, right: unknown): boolean => {
  if (Object.is(left, right)) return true
  if (Array.isArray(left) || Array.isArray(right)) return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((item, index) => exactValue(item, right[index]))
  if (left === null || right === null || typeof left !== "object" || typeof right !== "object") return false
  const leftKeys = Object.keys(left as Record<string, unknown>).sort()
  const rightKeys = Object.keys(right as Record<string, unknown>).sort()
  return leftKeys.length === rightKeys.length && leftKeys.every((key, index) => key === rightKeys[index] && exactValue((left as Record<string, unknown>)[key], (right as Record<string, unknown>)[key]))
}

const parseInputExactly = <T>(schema: { parse(value: unknown): T }, value: unknown, code: string): T => {
  let parsed: T
  try { parsed = schema.parse(value) } catch { return fail(code) }
  if (!exactValue(parsed, value)) fail(code)
  return parsed
}

const parseActionExactly = (value: unknown): Action => {
  let parsed: Action
  try { parsed = ActionSchema.parse(value) } catch { return fail("TRAINING_ACTION") }
  if (!exactValue(parsed, value)) fail("TRAINING_ACTION")
  return parsed
}

const parseRecord = (value: unknown): LegalTrainingRecord => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) fail("TRAINING_RECORD")
  const kind = (value as { kind?: unknown }).kind
  if (kind === "activation") {
    exactKeys(value, ["kind", "input", "target"], "TRAINING_ACTIVATION")
    const target = value.target
    if (target !== "press" && target !== "screen") fail("TRAINING_ACTIVATION")
    return deepFreeze({ kind, input: structuredClone(parseInputExactly(StrategyInputV119Schema, value.input, "TRAINING_ACTIVATION")), target: target as "press" | "screen" })
  }
  if (kind === "brain") {
    exactKeys(value, ["kind", "input", "target"], "TRAINING_BRAIN")
    return deepFreeze({ kind, input: structuredClone(parseInputExactly(SoldierBrainInputV119Schema, value.input, "TRAINING_BRAIN")), target: structuredClone(parseActionExactly(value.target)) })
  }
  return fail("TRAINING_KIND")
}

const actionMode = (action: Action): "move" | "turn" | "stone" =>
  action.type === "MOVE" ? "move" : action.type === "TURN" ? "turn" : "stone"

const most = <T extends string>(values: readonly T[], fallback: T): T => {
  const counts = new Map<T, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  return [...counts.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0]?.[0] ?? fallback
}

const deriveControllerRoot = (featurePolicy: TeacherFeaturePolicy): `sha256:${string}` => root({
  version: TEACHER_CONTROLLER_VERSION,
  representation: "canonical-v119-bounded-legal-features-v2",
  featurePolicy,
})

const parseFeaturePolicy = (value: unknown): TeacherFeaturePolicy => {
  exactKeys(value, ["activationFallback", "brainFallback", "activation", "brain"], "FEATURE_POLICY")
  if (value.activationFallback !== "press" && value.activationFallback !== "screen") fail("FEATURE_POLICY")
  if (!["move", "turn", "stone"].includes(String(value.brainFallback))) fail("FEATURE_POLICY")
  if (!Array.isArray(value.activation) || value.activation.length > 8 || !Array.isArray(value.brain) || value.brain.length > 24) fail("FEATURE_POLICY")
  const activationValue = value.activation as unknown[]
  const brainValue = value.brain as unknown[]
  const activation = activationValue.map((rule) => {
    exactKeys(rule, ["feature", "target"], "FEATURE_POLICY")
    if (!["initiative-contact", "initiative-distant", "response-contact", "response-distant"].includes(String(rule.feature)) || (rule.target !== "press" && rule.target !== "screen")) fail("FEATURE_POLICY")
    return { feature: rule.feature as TeacherActivationFeature, target: rule.target as "press" | "screen" }
  })
  const brain = brainValue.map((rule) => {
    exactKeys(rule, ["feature", "target"], "FEATURE_POLICY")
    if (!/^(?:left|right|vertical):(?:open|blocked):(?:fresh|advanced)$/u.test(String(rule.feature)) || !["move", "turn", "stone"].includes(String(rule.target))) fail("FEATURE_POLICY")
    return { feature: rule.feature as TeacherBrainFeature, target: rule.target as "move" | "turn" | "stone" }
  })
  if (new Set(activation.map((rule) => rule.feature)).size !== activation.length || new Set(brain.map((rule) => rule.feature)).size !== brain.length) fail("FEATURE_POLICY")
  return deepFreeze({ activationFallback: value.activationFallback as "press" | "screen", brainFallback: value.brainFallback as "move" | "turn" | "stone", activation, brain })
}

const parseStudent = (value: unknown): DistilledLegalStudent => {
  exactKeys(value, ["schemaVersion", "featurePolicy", "controllerRoot"], "STUDENT")
  if (value.schemaVersion !== "teacher-distilled-student-v3" || typeof value.controllerRoot !== "string" || !ROOT.test(value.controllerRoot)) fail("STUDENT")
  const featurePolicy = parseFeaturePolicy(value.featurePolicy)
  const expectedRoot = deriveControllerRoot(featurePolicy)
  if (value.controllerRoot !== expectedRoot) fail("STUDENT_ROOT")
  return deepFreeze({ schemaVersion: value.schemaVersion as "teacher-distilled-student-v3", featurePolicy, controllerRoot: expectedRoot })
}

/** Project a private search receipt to exact legal records, discarding scores and teacher state. */
export const projectTeacherSearchToLegalTraining = (value: unknown): readonly LegalTrainingRecord[] => {
  exactKeys(value, ["alternativesEvaluated", "canonicalTransitionRoot", "depthReached", "nodesVisited", "offlineOnly", "outcomeRoots", "outcomes", "selectedLegalTargets", "selectedOutcomeRoot", "selectedTemplate"], "SEARCH_RECEIPT")
  if (value.offlineOnly !== true || typeof value.canonicalTransitionRoot !== "string" || !ROOT.test(value.canonicalTransitionRoot) || typeof value.selectedOutcomeRoot !== "string" || !ROOT.test(value.selectedOutcomeRoot) || (value.selectedTemplate !== null && typeof value.selectedTemplate !== "string")) fail("SEARCH_RECEIPT")
  if (![value.alternativesEvaluated, value.depthReached, value.nodesVisited].every((count) => Number.isSafeInteger(count) && Number(count) >= 0) || !Array.isArray(value.outcomeRoots) || !value.outcomeRoots.every((entry) => typeof entry === "string" && ROOT.test(entry)) || !Array.isArray(value.outcomes) || value.outcomes.length !== value.outcomeRoots.length || !Array.isArray(value.selectedLegalTargets) || value.selectedLegalTargets.length > 256) fail("SEARCH_RECEIPT")
  for (const outcome of value.outcomes as unknown[]) {
    exactKeys(outcome, ["outcomeRoot", "score", "stateRoot", "template", "terminal"], "SEARCH_RECEIPT")
    if (typeof outcome.template !== "string" || !Array.isArray(outcome.score) || outcome.score.length !== 4 || !outcome.score.every((entry) => Number.isSafeInteger(entry)) || typeof outcome.stateRoot !== "string" || !ROOT.test(outcome.stateRoot) || typeof outcome.outcomeRoot !== "string" || !ROOT.test(outcome.outcomeRoot) || !["win", "loss", "draw", "failed", "nonterminal"].includes(String(outcome.terminal))) fail("SEARCH_RECEIPT")
  }
  return deepFreeze((value.selectedLegalTargets as unknown[]).map(parseRecord))
}

/** Distill only bounded legal feature buckets; raw observations and opaque ids are not retained. */
export const distillLegalStudent = (values: readonly unknown[]): DistilledLegalStudent => {
  if (!Array.isArray(values) || values.length === 0 || values.length > 256) fail("TRAINING_COUNT")
  const records = values.map(parseRecord)
  const activationRecords = records.filter((record): record is Extract<LegalTrainingRecord, { kind: "activation" }> => record.kind === "activation")
  const brainRecords = records.filter((record): record is Extract<LegalTrainingRecord, { kind: "brain" }> => record.kind === "brain")
  const activationFeatures = [...new Set(activationRecords.map((record) => controllerActivationFeature(record.input)))].sort()
  const brainFeatures = [...new Set(brainRecords.map((record) => controllerBrainFeature(record.input)))].sort()
  const featurePolicy = parseFeaturePolicy({
    activationFallback: most(activationRecords.map((record) => record.target), "press" as const),
    brainFallback: most(brainRecords.map((record) => actionMode(record.target)), "turn" as const),
    activation: activationFeatures.map((feature) => ({ feature, target: most(activationRecords.filter((record) => controllerActivationFeature(record.input) === feature).map((record) => record.target), "press" as const) })),
    brain: brainFeatures.map((feature) => ({ feature, target: most(brainRecords.filter((record) => controllerBrainFeature(record.input) === feature).map((record) => actionMode(record.target)), "turn" as const) })),
  })
  return deepFreeze({ schemaVersion: "teacher-distilled-student-v3", featurePolicy, controllerRoot: deriveControllerRoot(featurePolicy) })
}

export const compileLegalStudentPolicy = (student: unknown): CompiledLegalStudentPolicy => {
  const parsed = parseStudent(student)
  return deepFreeze({ representation: "canonical-v119-bounded-legal-features-v2", student: parsed, controllerRoot: parsed.controllerRoot })
}

/** Trusted wrappers parse the exact legal ABI before invoking the owned pure controller. */
export const runDistilledActivations = (student: unknown, value: unknown): StrategyResult => {
  const input = parseInputExactly(StrategyInputV119Schema, value, "STUDENT_ACTIVATION_INPUT")
  return deepFreeze(controllerSelectActivations(compileLegalStudentPolicy(student).student.featurePolicy, input) as StrategyResult)
}

export const runDistilledSoldierBrain = (student: unknown, value: unknown): SoldierBrainResult => {
  const input = parseInputExactly(SoldierBrainInputV119Schema, value, "STUDENT_BRAIN_INPUT")
  return deepFreeze(controllerSoldierBrain(compileLegalStudentPolicy(student).student.featurePolicy, input) as SoldierBrainResult)
}

export const chooseDistilledStudentAction = (student: unknown, input: unknown): StudentAction =>
  runDistilledSoldierBrain(student, input).action

/** Type-only assertion keeps receipt producer/consumer drift visible to TypeScript. */
const _receiptCompatibility: TeacherSearchReceipt | undefined = undefined
void _receiptCompatibility
