import { describe, expect, it } from "vitest"
import { selectPlannerActivations } from "./assign.js"
import { runPlannerSoldierBrain } from "./brain.js"
import { labRoot } from "../contracts.js"
import type { SoldierBrainInputV119, StrategyInputV119 } from "@cowards/spec"
// Dynamic trusted test helper import keeps root CLI outside the package's build graph.
const { buildPlannerValidationInventory,evaluatePlannerValidation } = await import(new URL("../../../../scripts/run-v1-38-planner-feasibility.ts",import.meta.url).href)

describe("frozen legal-information inventory, trusted modules only", () => {
  it("64 canonical pairs differ privately but have identical input bytes before choices and memory", () => {
    const inventory = buildPlannerValidationInventory()
    for (let pair = 0; pair < 64; pair++) {
      const a = inventory.cases[pair*2]!,b = inventory.cases[pair*2+1]!
      expect(a.hiddenStateRoot).not.toBe(b.hiddenStateRoot)
      expect(a.inputRoot).toBe(b.inputRoot)
      const run = (c: typeof a) => c.method === "selectActivations" ? selectPlannerActivations(c.input as StrategyInputV119) : runPlannerSoldierBrain(c.input as SoldierBrainInputV119)
      expect(labRoot("full-returned-output",run(a))).toBe(labRoot("full-returned-output",run(b)))
    }
  })
  it("tactical positive controls reject constant decisions and distinguish actual calls from static rejection", () => {
    const inventory = buildPlannerValidationInventory()
    const records = inventory.cases.map((c: { ordinal: number; root: string; inputRoot: string; expected: { classification: string }; method: string; family: string; input: unknown }) => {
      const rejection = c.expected.classification !== "success"
      const value = c.method === "selectActivations" ? selectPlannerActivations(c.input as StrategyInputV119) : c.family === "hostile" ? null : runPlannerSoldierBrain(c.input as SoldierBrainInputV119)
      return { ordinal: c.ordinal,caseRoot: c.root,inputRoot: c.inputRoot,classification: c.expected.classification,guestCalls: c.expected.classification === "source_rejection" || c.expected.classification === "input_rejection" ? 0 : 1,value: rejection ? null : value,provenance: "synthetic",cleanupComplete: true }
    })
    expect(evaluatePlannerValidation(inventory,records)).toMatchObject({ passed: false,protocolPassed: true,empirical: false,casesCharged: 256 })
    const constant = structuredClone(records)
    for (const record of constant) if (inventory.cases[record.ordinal]!.family === "tactic") record.value = { action: { type: "TURN_TO_STONE" },soldierMemory: {} }
    expect(evaluatePlannerValidation(inventory,constant).protocolPassed).toBe(false)
  })
})
