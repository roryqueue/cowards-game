import { describe, expect, it } from "vitest"
import {
  createStrategyRevisionId,
  hashStrategySource,
  stableStringify,
} from "./hash.js"

describe("Strategy Revision hashing", () => {
  it("stableStringify sorts object keys recursively", () => {
    expect(stableStringify({ b: 2, a: { d: 4, c: 3 } })).toBe(
      '{"a":{"c":3,"d":4},"b":2}',
    )
  })

  it("hashStrategySource returns deterministic lowercase SHA-256 hex", () => {
    const hash = hashStrategySource("export default {}")

    expect(hash).toMatch(/^[a-f0-9]{64}$/)
    expect(hash).toBe(hashStrategySource("export default {}"))
  })

  it("createStrategyRevisionId derives deterministic content IDs", () => {
    const input = {
      sourceHash: hashStrategySource("export default {}"),
      runtimeVersion: "0.1.0",
      specVersion: "1.0.0",
      engineVersion: "0.1.0",
      strategyRevisionVersion: "0.1.0",
    }

    expect(createStrategyRevisionId(input)).toBe(
      createStrategyRevisionId(input),
    )
    expect(createStrategyRevisionId(input)).toContain("strategy-revision:")
  })
})
