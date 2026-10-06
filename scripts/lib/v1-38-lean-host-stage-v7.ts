/** Host-private provenance, never an exception-property or runtime-label parser. */
export type LeanHostFailureStageV7 = "match_preparation" | "match_composition_postprocessing" | "compact_replay_retention_publication" | "terminal_result_publication" | "unknown"
export interface LeanHostFailureBindingV7 { readonly route: "diagnostic" | "baseline"; readonly allocationRoot: string; readonly chargeRoot: string; readonly slotRoot: string }
export interface LeanTrustedHostFailureV7 { readonly toJSON: () => never }
const brands = new WeakMap<object, Readonly<LeanHostFailureBindingV7 & { stage: LeanHostFailureStageV7 }>>()
const stages = new Set<LeanHostFailureStageV7>(["match_preparation", "match_composition_postprocessing", "compact_replay_retention_publication", "terminal_result_publication", "unknown"])
const isRoot = (v: unknown) => typeof v === "string" && /^sha256:[a-f0-9]{64}$/u.test(v)
export const readLeanTrustedHostFailureStageV7 = (value: unknown, binding?: LeanHostFailureBindingV7): LeanHostFailureStageV7 => {
  const branded = typeof value === "object" && value !== null ? brands.get(value) : undefined
  return branded && (!binding || Object.entries(binding).every(([key, v]) => branded[key as keyof LeanHostFailureBindingV7] === v)) ? branded.stage : "unknown"
}
export const captureLeanHostFailureV7 = (stage: LeanHostFailureStageV7, binding: LeanHostFailureBindingV7, caught?: unknown): LeanTrustedHostFailureV7 => {
  if (!stages.has(stage) || !["diagnostic", "baseline"].includes(binding.route) || ![binding.allocationRoot, binding.chargeRoot, binding.slotRoot].every(isRoot)) throw new TypeError("LEAN_HOST_STAGE_V7_BINDING")
  const prior = readLeanTrustedHostFailureStageV7(caught, binding)
  const value = Object.freeze({ toJSON(): never { throw new TypeError("LEAN_HOST_STAGE_V7_PRIVATE") } })
  brands.set(value, Object.freeze({ ...binding, stage: prior === "unknown" ? stage : prior }))
  return value
}
