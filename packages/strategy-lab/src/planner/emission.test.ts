import { describe, expect, it } from "vitest"
import { createHash } from "node:crypto"
import { validateStrategySource } from "../../../runtime-js/src/validation.js"
import { SoldierBrainResultSchema, StrategyResultSchema, encodeCanonicalJson } from "@cowards/spec"
import { emitPlannerSource, buildPlannerCandidate, assertPlannerSourceClosure, mapPlannerMissionCorpus } from "./emit.js"
import { runPlannerSoldierBrain } from "./brain.js"
import { buildFixtureFeasibilityCorpus } from "../feasibility-protocol.js"

describe("static planner source builder (never executes source)", () => {
  it("emits stable complete bytes, valid revision and exact selected runtime binding", () => {
    const a = buildPlannerCandidate(), b = buildPlannerCandidate()
    expect(a).toEqual(b)
    expect(a.source).toBe(emitPlannerSource())
    expect(a.sourceBytes).toBe(Buffer.byteLength(a.source,"utf8"))
    expect(a.sourceRoot).toBe(`sha256:${createHash("sha256").update(a.source).digest("hex")}`)
    expect(a.sourceBytes).toBeLessThan(49152)
    expect(a.revision.runtime).toMatchObject({ abiVersion: "strategy-runtime-abi-v1.19",adapter: { id: "runtime-js-container-subprocess" },package: { mode: "none" },limits: { timeoutMs: 1000 } })
    expect(a.revision.validation.valid).toBe(true)
    for (const name of ["selectPlannerActivations","runPlannerSoldierBrain","createMission","scoreAssignment","reserveBrainFallback"]) expect(a.source).toContain(name)
    expect(a.source).toContain("export default")
    expect(() => assertPlannerSourceClosure(a.source)).not.toThrow()
  },15000)
  it.each(["process.env.SECRET","globalThis.secret","secretTeacherState","Date.now()","Math.random()","eval('1')","new Function('return 1')()","import('node:fs')","Promise.resolve(1)"])("rejects closure/capability: %s", expression => {
    expect(() => assertPlannerSourceClosure(`export default { selectActivations(input) { return ${expression}; }, soldierBrain(input) { return {}; } }`)).toThrow()
  })
  it("canonical source and output caps reject overflow and malformed outputs", () => {
    const source = "export default { selectActivations(input) { return {}; }, soldierBrain(input) { return {}; } };"
    expect(validateStrategySource(source+" ".repeat(65536-Buffer.byteLength(source))).valid).toBe(true)
    expect(validateStrategySource(source+" ".repeat(65537-Buffer.byteLength(source))).valid).toBe(false)
    expect(SoldierBrainResultSchema.safeParse({ action: { type: "FLY" },soldierMemory: {} }).success).toBe(false)
    expect(SoldierBrainResultSchema.safeParse({ action: { type: "TURN_TO_STONE" },soldierMemory: "x".repeat(2048) }).success).toBe(false)
    expect(StrategyResultSchema.safeParse({ activationOrders: [{ soldierId: "a",objective: "x".repeat(1024) }],strategyMemory: {} }).success).toBe(false)
    expect(StrategyResultSchema.safeParse({ activationOrders: [],strategyMemory: "x".repeat(32768) }).success).toBe(false)
  })
  it("explicitly maps fixtureContext to real ten-mission packets before final corpus freeze", () => {
    const original = buildFixtureFeasibilityCorpus(), mapped = mapPlannerMissionCorpus(original)
    expect(mapped.root).not.toBe(original.root)
    expect(new Set(mapped.soldierBrain.filter(c => c.family === "positive").map(c => (c.input.objective as { kind: string }).kind)).size).toBe(10)
    for (const c of mapped.soldierBrain) {
      expect(encodeCanonicalJson(c.input.objective!,{ context: "canonical-manifest" }).ok).toBe(true)
      const result = runPlannerSoldierBrain(c.input)
      if (c.family !== "hostile-schema") expect(result.soldierMemory).not.toMatchObject({ planner: { missionStatus: "invalid" } })
      expect(SoldierBrainResultSchema.safeParse(result).success).toBe(true)
    }
    expect(original.soldierBrain[0]!.input.objective).toHaveProperty("fixtureContext")
  })
})
