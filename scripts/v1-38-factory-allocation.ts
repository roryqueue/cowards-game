import { labRoot, type LabRoot } from "../packages/strategy-lab/src/contracts.js"
const isRoot = (value: unknown): value is LabRoot => typeof value === "string" && /^sha256:[0-9a-f]{64}$/u.test(value)
const fail = (code: string): never => { throw new TypeError(`FACTORY_AUTHOR_${code}`) }

export type FactorySourceSlot = "S01" | "S02" | "S03" | "S04" | "S05" | "S06" | "S07" | "S08" | "S09" | "S10" | "S11" | "S12"
export interface FactoryAuthoringAllocation {
  readonly schemaVersion: "factory-model-authoring-allocation-v1"; readonly root: LabRoot
  readonly attempts: readonly ["A-01", "A-02", "A-03", "A-04"]
  readonly windowMinutes: 30; readonly perAttemptTokenCeiling: 50_000; readonly totalTokenCeiling: 200_000
  readonly providerTokenCapAvailability: "unavailable"; readonly humanExternal: "unused_zero"
  readonly sourceSlots: readonly FactorySourceSlot[]; readonly workloadCount: 48; readonly workloadWindowMinutes: 90
  readonly maxInvocations: 256; readonly maxLifetimeMs: 120_000; readonly perMethodMilliseconds: 1_000
}
export const FACTORY_SOURCE_RECIPES: Readonly<Record<FactorySourceSlot, string>> = Object.freeze({
  S01: "tactical-base-exact", S02: "s01-comment-only", S03: "teacher-base-depth-3-nodes-128", S04: "s03-delegating-wrapper",
  S05: "first-valid-a-slot-model-base", S06: "s05-opaque-id-geometry-roundtrip", S07: "s01-x2-turn-to-stone", S08: "s01-all-turn-to-stone",
  S09: "s03-comment-only", S10: "s03-x2-mutation", S11: "s05-guard-zero-wrapper", S12: "s05-guard-one-turn-to-stone",
})
const sourceSlots = Object.keys(FACTORY_SOURCE_RECIPES) as FactorySourceSlot[]
const allocationValue = (): Omit<FactoryAuthoringAllocation, "root"> => ({ schemaVersion: "factory-model-authoring-allocation-v1", attempts: ["A-01", "A-02", "A-03", "A-04"], windowMinutes: 30, perAttemptTokenCeiling: 50_000, totalTokenCeiling: 200_000, providerTokenCapAvailability: "unavailable", humanExternal: "unused_zero", sourceSlots, workloadCount: 48, workloadWindowMinutes: 90, maxInvocations: 256, maxLifetimeMs: 120_000, perMethodMilliseconds: 1_000 })
export const createFactoryAuthoringAllocation = (): Readonly<FactoryAuthoringAllocation> => { const value = allocationValue(); return Object.freeze({ ...value, root: labRoot("factory-model-authoring-allocation-v1", value) }) }
export const admitFactoryAuthoringAllocation = (value: unknown): Readonly<FactoryAuthoringAllocation> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return fail("ALLOCATION")
  const record = value as Record<string, unknown>, expected = allocationValue()
  if (Object.keys(record).length !== 14 || !isRoot(record.root) || Object.entries(expected).some(([key, item]) => JSON.stringify(record[key]) !== JSON.stringify(item)) || record.root !== labRoot("factory-model-authoring-allocation-v1", expected)) return fail("ALLOCATION")
  return Object.freeze(record as unknown as FactoryAuthoringAllocation)
}
