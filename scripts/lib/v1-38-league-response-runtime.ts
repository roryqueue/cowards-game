import { StrategyInputV119Schema, SoldierBrainInputV119Schema, StrategyResultSchema, SoldierBrainResultSchema } from "@cowards/spec"
import { freezeLabValue, labRoot } from "../../packages/strategy-lab/src/contracts.js"
import type { FactorySupervisionProvider } from "../../packages/strategy-lab/src/factory/admission.js"
import type { LabRuntimeEvidence } from "../../packages/strategy-lab/src/runtime-bridge.js"
import type { LeagueProbeFamily } from "../../packages/strategy-lab/src/league/red-team.js"

const fail = (code: string): never => { throw new TypeError(`LEAGUE_PROBE_RUNTIME_${code}`) }
/** Legal observation/output coordinate transformations; the Match kernel is untouched.
 * Memory remains opaque in the Strategy's observed frame for the entire Match. */
export const wrapLeagueProbeProvider = (provider: FactorySupervisionProvider, family: LeagueProbeFamily | undefined, bounds: { minX: number; maxX: number }, retain: (value: unknown) => void): FactorySupervisionProvider => {
  const changed = ["horizontal_symmetry", "opaque_ids", "soldier_order"].includes(String(family)), issued = new WeakMap<object, LabRuntimeEvidence>(), ids = new Map<string, string>(), originals = new Map<string, string>()
  const translate = (value: unknown, reverse = false, key = ""): any => {
    if (/(?:memory|objective)/iu.test(key)) return structuredClone(value)
    if (Array.isArray(value)) { const items = value.map((entry) => translate(entry, reverse, key)); return family === "soldier_order" && !reverse && ["soldiers", "mySoldiers", "enemySoldiers"].includes(key) ? items.reverse() : items }
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([name, item]) => [name, translate(item, reverse, name)]))
    if (family === "horizontal_symmetry") {
      if (typeof value === "number" && ["x", "absoluteX"].includes(key)) return bounds.minX + bounds.maxX - value
      if (typeof value === "number" && key === "dx") return -value
      if (typeof value === "string" && ["facing", "direction", "lastSuccessfulMoveDirection"].includes(key)) return value === "LEFT" ? "RIGHT" : value === "RIGHT" ? "LEFT" : value
    }
    if (family === "opaque_ids" && typeof value === "string" && (key === "id" || /Id$/u.test(key))) {
      if (reverse) return originals.get(value) ?? fail("UNKNOWN_OPAQUE_ID")
      let opaque = ids.get(value)
      if (!opaque) { opaque = `opaque-${String(ids.size + 1).padStart(5, "0")}`; ids.set(value, opaque); originals.set(opaque, value) }
      return opaque
    }
    return value
  }
  return {
    identity: provider.identity,
    async invoke(request, identity) {
      const translatedInput = changed ? translate(request.input) : request.input
      const validated = request.kind === "selectActivations" ? StrategyInputV119Schema.parse(translatedInput) : SoldierBrainInputV119Schema.parse(translatedInput)
      const dispatched = changed ? freezeLabValue({ ...request, input: validated }) as typeof request : request
      const evidence = await provider.invoke(dispatched, identity)
      if (!provider.verify(evidence)) return fail("UNISSUED_EVIDENCE")
      let wrapped = evidence
      if (changed) {
        const result = evidence.result.ok ? { ok: true as const, value: request.kind === "selectActivations" ? StrategyResultSchema.parse(translate(evidence.result.value, true)) : SoldierBrainResultSchema.parse(translate(evidence.result.value, true)) } : evidence.result
        wrapped = freezeLabValue({ ...evidence, inputRoot: labRoot("runtime-input", request.input), invocationRoot: labRoot("league-probe-invocation-v1", { family, originalRoot: evidence.invocationRoot, inputRoot: labRoot("runtime-input", request.input), result }), result }) as LabRuntimeEvidence
      }
      retain({ family: family ?? null, request, dispatched, originalEvidence: evidence, admittedEvidence: wrapped })
      issued.set(wrapped, evidence)
      return wrapped
    },
    verify(evidence) { const original = issued.get(evidence); return original !== undefined && provider.verify(original) },
    close() { return provider.close() },
  }
}
