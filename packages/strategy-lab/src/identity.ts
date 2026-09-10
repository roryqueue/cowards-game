import { exactLabKeys, freezeLabValue, labRoot, type LabRoot } from "./contracts.js"

export const isLabRoot = (v: unknown): v is LabRoot => typeof v === "string" && /^sha256:[0-9a-f]{64}$/u.test(v)
export interface LabTaskContext { admittedRoot: LabRoot; algorithm: string; candidateRoot: LabRoot; opponentRoot: LabRoot; inputRoot: LabRoot; budgetRoot: LabRoot }
export interface LabTaskIdentity extends LabTaskContext { schemaVersion: "lab-task-identity-v1"; split: "development"; geometryCellRoot: LabRoot; arenaId: string; ordinal: number; purpose: "scientific" | "alias-compatibility" }
export const validateLabTaskContext = (value: unknown): LabTaskContext => {
  if (!exactLabKeys(value, ["admittedRoot", "algorithm", "candidateRoot", "opponentRoot", "inputRoot", "budgetRoot"]) ||
      ![value.admittedRoot, value.candidateRoot, value.opponentRoot, value.inputRoot, value.budgetRoot].every(isLabRoot) ||
      typeof value.algorithm !== "string" || !/^[a-z][a-z0-9-]{0,95}$/u.test(value.algorithm)) throw new TypeError("LAB_TASK_CONTEXT")
  return freezeLabValue(structuredClone(value)) as unknown as LabTaskContext
}
export const deriveLabTaskId = (value: unknown): LabRoot => {
  if (!exactLabKeys(value, ["admittedRoot", "algorithm", "candidateRoot", "opponentRoot", "inputRoot", "budgetRoot", "schemaVersion", "split", "geometryCellRoot", "arenaId", "ordinal", "purpose"])) throw new TypeError("LAB_TASK_IDENTITY")
  const { admittedRoot, algorithm, candidateRoot, opponentRoot, inputRoot, budgetRoot } = value
  validateLabTaskContext({ admittedRoot, algorithm, candidateRoot, opponentRoot, inputRoot, budgetRoot })
  if (value.schemaVersion !== "lab-task-identity-v1" || value.split !== "development" || !isLabRoot(value.geometryCellRoot) ||
      typeof value.arenaId !== "string" || !/^arena:[a-z-]+:v1$/u.test(value.arenaId) ||
      !Number.isSafeInteger(value.ordinal) || Number(value.ordinal) < 0 || Number(value.ordinal) > 11 ||
      (value.purpose !== "scientific" && value.purpose !== "alias-compatibility")) throw new TypeError("LAB_TASK_IDENTITY")
  return labRoot("task-id", value)
}
/** Independent counter blocks, not ambient RNG. Hex preserves all256 bits exactly. */
export const deriveLabStream = (taskId: unknown, purpose: string, counter: number): string => {
  if (!isLabRoot(taskId) || !/^[a-z][a-z0-9-]{0,63}$/u.test(purpose) || !Number.isSafeInteger(counter) || counter < 0) throw new TypeError("LAB_STREAM_INPUT")
  return labRoot("sha256-counter-v1", { taskId, purpose, counter }).slice(7)
}
