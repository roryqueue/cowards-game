import { SoldierBrainInputV119Schema, StrategyInputV119Schema, type Action, type SoldierBrainInputV119, type SoldierBrainResult, type StrategyInputV119, type StrategyResult } from "../../spec/src/index.js"
import { createHash } from "node:crypto"

export type StudentAction = Action
export type LegalTrainingRecord = { readonly kind: "activation"; readonly input: unknown; readonly target: "press" | "screen" } | { readonly kind: "brain"; readonly input: unknown; readonly target: StudentAction }
export interface DistilledLegalStudent { readonly schemaVersion: "teacher-distilled-student-v2"; readonly activationMode: "press" | "screen"; readonly brainMode: "move" | "turn" | "stone"; readonly controllerRoot: `sha256:${string}` }
export interface CompiledLegalStudentPolicy { readonly representation: "canonical-v119-legal-features-v1"; readonly student: DistilledLegalStudent; readonly controllerRoot: `sha256:${string}` }
const root = (value: unknown): `sha256:${string}` => `sha256:${createHash("sha256").update(JSON.stringify(value)).digest("hex")}`
const actionType = (action: Action): "move" | "turn" | "stone" => action.type === "MOVE" ? "move" : action.type === "TURN" ? "turn" : "stone"
const most = <T extends string>(items: readonly T[], fallback: T): T => [...items].sort((left, right) => items.filter((item) => item === right).length - items.filter((item) => item === left).length || left.localeCompare(right))[0] ?? fallback

/** Rejects malformed training records and strips every field except schema-admitted legal features. */
export const distillLegalStudent = (records: readonly LegalTrainingRecord[]): DistilledLegalStudent => {
  const activation: ("press" | "screen")[] = [], brain: ("move" | "turn" | "stone")[] = []
  for (const record of records) {
    if (record.kind === "activation") { if (!StrategyInputV119Schema.safeParse(record.input).success) throw new TypeError("TEACHER_TRAINING_ACTIVATION"); activation.push(record.target) }
    else { if (!SoldierBrainInputV119Schema.safeParse(record.input).success) throw new TypeError("TEACHER_TRAINING_BRAIN"); brain.push(actionType(record.target)) }
  }
  const value = { schemaVersion: "teacher-distilled-student-v2" as const, activationMode: most(activation, "press"), brainMode: most(brain, "move"), controllerRoot: root({ representation: "canonical-v119-legal-features-v1", activation: most(activation, "press"), brain: most(brain, "move") }) }
  return Object.freeze(value)
}
export const compileLegalStudentPolicy = (student: DistilledLegalStudent): CompiledLegalStudentPolicy => {
  if (student.schemaVersion !== "teacher-distilled-student-v2" || !["press", "screen"].includes(student.activationMode) || !["move", "turn", "stone"].includes(student.brainMode)) throw new TypeError("TEACHER_STUDENT")
  return Object.freeze({ representation: "canonical-v119-legal-features-v1", student, controllerRoot: student.controllerRoot })
}
const direction = (dx: number, dy: number): "UP" | "RIGHT" | "DOWN" | "LEFT" => Math.abs(dx) >= Math.abs(dy) ? dx >= 0 ? "RIGHT" : "LEFT" : dy >= 0 ? "DOWN" : "UP"
const active = (input: StrategyInputV119) => input.mySoldiers.filter((soldier) => soldier.status === "ACTIVE" && soldier.position).sort((left, right) => (left.position!.x + left.position!.y) - (right.position!.x + right.position!.y) || left.id.localeCompare(right.id))

/** Trusted controller over schema-admitted Strategy input; no teacher/search state can enter. */
export const runDistilledActivations = (student: DistilledLegalStudent, value: unknown): StrategyResult => {
  const input = StrategyInputV119Schema.parse(value), policy = compileLegalStudentPolicy(student), selected = active(input).slice(0, input.activationCount)
  return { activationOrders: selected.map((soldier) => ({ soldierId: soldier.id, objective: { schemaVersion: "teacher-legal-mission-v1", mode: policy.student.activationMode, goal: soldier.position } })), strategyMemory: { teacher: { schemaVersion: "teacher-student-v2", mode: policy.student.activationMode } } }
}
/** Trusted controller over schema-admitted 5x5 awareness. It chooses ordinary MOVE/TURN/STONE Actions, never an exact-input default. */
export const runDistilledSoldierBrain = (student: DistilledLegalStudent, value: unknown): SoldierBrainResult => {
  const input = SoldierBrainInputV119Schema.parse(value), policy = compileLegalStudentPolicy(student), enemy = input.awarenessGrid.cells.filter((cell) => cell.contents === "ENEMY_ACTIVE").sort((left, right) => Math.abs(left.dx) + Math.abs(left.dy) - Math.abs(right.dx) - Math.abs(right.dy))[0]
  const facing = enemy ? direction(enemy.dx, enemy.dy) : input.self.facing ?? "UP", cell = input.awarenessGrid.cells.find((entry) => entry.dx === (facing === "RIGHT" ? 1 : facing === "LEFT" ? -1 : 0) && entry.dy === (facing === "DOWN" ? 1 : facing === "UP" ? -1 : 0))
  const action: Action = policy.student.brainMode === "stone" && !input.hasAdvancedThisActivation ? { type: "TURN_TO_STONE" } : policy.student.brainMode === "turn" || input.hasAdvancedThisActivation || cell?.contents !== "EMPTY" ? { type: "TURN", direction: facing } : { type: "MOVE", direction: facing }
  return { action, soldierMemory: { teacher: { schemaVersion: "teacher-brain-v2", mode: policy.student.brainMode } } }
}
export const chooseDistilledStudentAction = (student: DistilledLegalStudent, input: unknown): StudentAction => runDistilledSoldierBrain(student, input).action
