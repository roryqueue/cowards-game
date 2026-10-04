import { describe, it, expect } from "vitest"
import { labRoot } from "../../packages/strategy-lab/src/contracts.js"
import { buildPlannerCandidate } from "../../packages/strategy-lab/src/planner/emit.js"
import { buildLeanBaselineSource, validateLeanBaselineSource } from "./v1-38-lean-baseline-source.js"

const input = () => ({ role: "final-response", source: buildPlannerCandidate().source, coldRoot: labRoot("cold", "nonlearned"), implementationRoot: labRoot("implementation", "reviewed") })
describe("prospective private baseline source snapshots", () => {
  it("binds static validation and exact authored source without native execution", () => {
    const source = buildLeanBaselineSource(input())
    expect(validateLeanBaselineSource(source)).toEqual(source)
    expect(buildLeanBaselineSource(input()).root).toBe(source.root)
    expect(source.validation.status).toBe("valid")
    expect(source.packet.provider.modelId).toBe("no-model")
    expect(source.packet.lineage.predecessorRoot).toBe(source.coldRoot)
  })
  it("rejects edited source, forged validation and extra payload fields", () => {
    const source = buildLeanBaselineSource(input())
    expect(() => validateLeanBaselineSource({ ...source, source: `${source.source}\n// changed` })).toThrow()
    expect(() => validateLeanBaselineSource({ ...source, validation: { ...source.validation, evidenceRoot: labRoot("forged", 1) } })).toThrow()
    expect(() => validateLeanBaselineSource({ ...source, authority: true })).toThrow()
    expect(() => buildLeanBaselineSource({ ...input(), role: "bracket" })).toThrow()
    expect(() => buildLeanBaselineSource({ ...input(), source: "import fs from 'node:fs'; export default fs;" })).toThrow()
  })
})
