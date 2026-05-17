import { describe, expect, it } from "vitest"
import { transpileStrategySource } from "./transpile.js"

describe("transpileStrategySource", () => {
  it("transpiles TypeScript parameter annotations", () => {
    const result = transpileStrategySource(`
export default {
  selectActivations(input: { activationCount: number }) {
    return { activationOrders: [], strategyMemory: { count: input.activationCount } }
  },
  soldierBrain(input: { cycleIndex: number }) {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: { cycle: input.cycleIndex } }
  },
}
    `)

    expect(result.ok).toBe(true)
    expect(result.ok && result.code).toContain("exports.default")
    expect(result.ok && result.code).not.toContain("input:")
  })

  it("does not require full typecheck for structurally valid source", () => {
    const result = transpileStrategySource(`
export default {
  selectActivations() {
    return missingRuntimeValue
  },
  soldierBrain() {
    return anotherMissingRuntimeValue
  },
}
`)

    expect(result.ok).toBe(true)
  })

  it("returns ok false for syntax failures", () => {
    const result = transpileStrategySource("export default {")

    expect(result.ok).toBe(false)
    expect(result.ok === false && result.message.length > 0).toBe(true)
  })
})
