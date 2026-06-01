import { describe, expect, it } from "vitest"
import {
  buildStrategyRevision,
  createStrategyRevisionId,
  hashStrategySource,
  isValidStrategyRevision,
} from "./index.js"
import { stableStringify } from "./hash.js"
import { StrategyRevisionSchema } from "@cowards/spec"

const validSource = `
export default {
  selectActivations() {
    return { activationOrders: [], strategyMemory: {} }
  },
  soldierBrain() {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} }
  },
}
`

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

  it("buildStrategyRevision creates deterministic immutable artifacts", () => {
    const first = buildStrategyRevision({
      source: validSource,
      strategyId: "strategy-1",
      metadata: { label: "Fixture" },
    })
    const second = buildStrategyRevision({
      source: validSource,
      strategyId: "strategy-1",
      metadata: { label: "Fixture" },
    })

    expect(first.id).toBe(second.id)
    expect(first.source).toBe(validSource)
    expect(first.sourceHash).toBe(hashStrategySource(validSource))
    expect(first.metadata.sourceArtifact).toMatchObject({
      format: "transpiled-javascript",
      sourceHash: first.sourceHash,
      sourceBytes: first.sourceBytes,
      validationStatus: "valid",
      publicEvidence: {
        sandboxClaim: "provenance-only",
      },
    })
    expect(first.metadata.sourceArtifact?.bytesBase64).toEqual(
      expect.any(String),
    )
    expect(StrategyRevisionSchema.parse(first)).toEqual(first)
    expect(isValidStrategyRevision(first)).toBe(true)
    expect(Object.isFrozen(first)).toBe(true)
    expect(Object.isFrozen(first.runtime)).toBe(true)
    expect(Object.isFrozen(first.validation.errors)).toBe(true)
  })

  it("changing source changes Strategy Revision ID", () => {
    const first = buildStrategyRevision({ source: validSource })
    const second = buildStrategyRevision({
      source: validSource.replace("TURN_TO_STONE", "TURN"),
    })

    expect(first.id).not.toBe(second.id)
  })

  it("returns invalid artifacts for normal validation failures without throwing", () => {
    const revision = buildStrategyRevision({
      source: "export default { selectActivations() {} }",
    })

    expect(revision.validation.valid).toBe(false)
    expect(revision.validation.errors.map((error) => error.code)).toContain(
      "MISSING_SOLDIER_BRAIN",
    )
    expect(isValidStrategyRevision(revision)).toBe(true)
  })
})
