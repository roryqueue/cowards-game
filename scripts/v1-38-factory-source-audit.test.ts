import { describe, expect, it } from "vitest"
import { auditFactorySource } from "./v1-38-factory-source-audit.js"
describe("source-backed dependency audit", () => {
  it("derives concrete calls and substantial cloned bodies from parsed source", () => {
    const value = auditFactorySource("function tactical(input) { const active = input.soldiers.filter(s => s.status === 'ACTIVE'); return active.map(s => ({ soldierId: s.id, objective: null })); } export default { selectActivations(input) { return tactical(input); } }")
    expect(value.dependencyEdges).toContainEqual({ label: "calls", from: "selectActivations", to: "tactical" })
    expect(value.functionBodies.length).toBeGreaterThan(0)
    expect(value.forbiddenModuleCount).toBe(0)
  })
  it("detects module and dynamic import edges without importing anything", () => {
    expect(auditFactorySource("import x from './strategic-core'; const y = import('./other');").forbiddenModuleCount).toBe(2)
  })
})
