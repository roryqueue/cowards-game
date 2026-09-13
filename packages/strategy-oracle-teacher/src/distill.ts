/** Only canonical strategy-observation data, its permitted objective, and memory may reach a student. */
export interface LegalStudentInput {
  readonly observation: Readonly<Record<string, unknown>>
  readonly objective: Readonly<Record<string, unknown>> | null
  readonly memory: Readonly<Record<string, unknown>>
}

export type StudentAction = Readonly<{ type: "TURN_TO_STONE" } | { type: "TURN"; direction: "UP" }>

export interface LegalTrainingRecord {
  readonly legalInput: LegalStudentInput
  readonly action: StudentAction
}

export interface DistilledLegalStudent {
  readonly schemaVersion: "teacher-distilled-student-v1"
  readonly rules: readonly Readonly<{ observationKey: string; action: StudentAction }>[]
}

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right)).map(([key, child]) => [key, canonicalize(child)]))
  }
  return value
}
const stable = (value: unknown): string => JSON.stringify(canonicalize(value))
const keyFor = (input: LegalStudentInput) => stable({ observation: input.observation, objective: input.objective, memory: input.memory })

export interface CompiledLegalStudentPolicy {
  readonly representation: "canonical-legal-observation-objective-memory-v1"
  readonly rules: readonly Readonly<{ observationKey: string; action: StudentAction }>[]
}

/** The trusted chooser and source emitter both consume this explicit, stripped representation. */
export const compileLegalStudentPolicy = (student: DistilledLegalStudent): CompiledLegalStudentPolicy => {
  if (student.schemaVersion !== "teacher-distilled-student-v1" || !Array.isArray(student.rules)) throw new TypeError("TEACHER_STUDENT")
  return Object.freeze({ representation: "canonical-legal-observation-objective-memory-v1", rules: student.rules })
}

/** Distillation deliberately accepts only previously stripped legal training records, never teacher receipts. */
export const distillLegalStudent = (records: readonly LegalTrainingRecord[]): DistilledLegalStudent => {
  const byObservation = new Map<string, StudentAction>()
  for (const record of records) byObservation.set(keyFor(record.legalInput), record.action)
  return Object.freeze({ schemaVersion: "teacher-distilled-student-v1", rules: Object.freeze([...byObservation].sort(([a], [b]) => a.localeCompare(b)).map(([observationKey, action]) => Object.freeze({ observationKey, action }))) })
}

export const chooseDistilledStudentAction = (student: DistilledLegalStudent, input: LegalStudentInput): StudentAction =>
  compileLegalStudentPolicy(student).rules.find((rule) => rule.observationKey === keyFor(input))?.action ?? { type: "TURN_TO_STONE" }
