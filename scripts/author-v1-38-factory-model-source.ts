import { labRoot, type LabRoot } from "../packages/strategy-lab/src/contracts.js"

const ROOT = /^sha256:[0-9a-f]{64}$/u
const fail = (code: string): never => { throw new TypeError(`FACTORY_AUTHOR_${code}`) }
const root = (value: unknown): value is LabRoot => typeof value === "string" && ROOT.test(value)

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
const slots = Object.keys(FACTORY_SOURCE_RECIPES) as FactorySourceSlot[]
const allocationValue = (): Omit<FactoryAuthoringAllocation, "root"> => ({
  schemaVersion: "factory-model-authoring-allocation-v1", attempts: ["A-01", "A-02", "A-03", "A-04"], windowMinutes: 30,
  perAttemptTokenCeiling: 50_000, totalTokenCeiling: 200_000, providerTokenCapAvailability: "unavailable", humanExternal: "unused_zero",
  sourceSlots: slots, workloadCount: 48, workloadWindowMinutes: 90, maxInvocations: 256, maxLifetimeMs: 120_000, perMethodMilliseconds: 1_000,
})
export const createFactoryAuthoringAllocation = (): Readonly<FactoryAuthoringAllocation> => {
  const value = allocationValue(); return Object.freeze({ ...value, root: labRoot("factory-model-authoring-allocation-v1", value) })
}
export const admitFactoryAuthoringAllocation = (value: unknown): Readonly<FactoryAuthoringAllocation> => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return fail("ALLOCATION")
  const record = value as Record<string, unknown>, expected = allocationValue()
  if (Object.keys(record).length !== 14 || !root(record.root) || Object.entries(expected).some(([key, item]) => JSON.stringify(record[key]) !== JSON.stringify(item)) || record.root !== labRoot("factory-model-authoring-allocation-v1", expected)) return fail("ALLOCATION")
  return Object.freeze(record as unknown as FactoryAuthoringAllocation)
}
export interface ModelUsageRecord { readonly inputTokens: number; readonly outputTokens: number; readonly cachedInputTokens: number; readonly totalTokens: number }
/** Missing or over-ceiling usage consumes the slot and stops replacement, but does not claim a provider hard cap. */
export const assessAuthoringUsage = (usage: ModelUsageRecord | null): "within_ceiling" | "charged_terminal_stop" => {
  if (!usage || ![usage.inputTokens, usage.outputTokens, usage.cachedInputTokens, usage.totalTokens].every(Number.isSafeInteger) || usage.inputTokens < 0 || usage.outputTokens < 0 || usage.cachedInputTokens < 0 || usage.cachedInputTokens > usage.inputTokens || usage.totalTokens !== usage.inputTokens + usage.outputTokens || usage.totalTokens > 50_000) return "charged_terminal_stop"
  return "within_ceiling"
}
export interface AuthoringCapability { readonly documentedReadOnlyDefault: boolean; readonly documentedJson: boolean; readonly documentedEphemeral: boolean; readonly documentedIgnoreUserConfig: boolean }
export const buildFactoryAuthorCommand = (allocation: FactoryAuthoringAllocation, packetRoot: LabRoot, capability: AuthoringCapability): Readonly<{ status: "ready"; cwd: "disclosed-packet-only"; argv: readonly string[]; packetRoot: LabRoot }> | Readonly<{ status: "authoring_context_capability_unavailable" }> => {
  admitFactoryAuthoringAllocation(allocation)
  if (!root(packetRoot) || !capability.documentedReadOnlyDefault || !capability.documentedJson || !capability.documentedEphemeral || !capability.documentedIgnoreUserConfig) return Object.freeze({ status: "authoring_context_capability_unavailable" as const })
  return Object.freeze({ status: "ready" as const, cwd: "disclosed-packet-only" as const, packetRoot, argv: Object.freeze(["codex", "exec", "--ephemeral", "--json", "--ignore-user-config", "Author only the disclosed ABI packet; emit explicit TypeScript source as JSON data."]) })
}

if (process.argv.includes("--help")) process.stdout.write("Usage: author-v1-38-factory-model-source --help (constructs no model request)\n")
