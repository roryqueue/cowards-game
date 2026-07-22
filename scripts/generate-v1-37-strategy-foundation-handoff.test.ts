import { describe, expect, it } from "vitest"
import {
  createV137StrategyFoundationFixture,
  renderV137StrategyFoundationJson,
  renderV137StrategyFoundationMarkdown,
  validateV137StrategyFoundation,
} from "./generate-v1-37-strategy-foundation-handoff.js"

describe("v1.37 public-safe Strategy foundation handoff", () => {
  it("accepts the complete certified, non-authorizing foundation", () => {
    const handoff = createV137StrategyFoundationFixture()

    expect(validateV137StrategyFoundation(handoff)).toEqual(handoff)
    expect(handoff.strategyMilestoneAuthorized).toBe(false)
    expect(handoff.authority).toMatchObject({
      semanticAuthorityKey: "runtime-v1.19",
      runtimeAbiVersion: "strategy-runtime-abi-v1.19",
      canonicalJsonVersion: "canonical-json-v1.1",
      runtimeServiceVersion: "runtime-execution-service-v1.17",
      receiptVersion: "runtime-semantic-receipt-v1.18",
    })
    expect(handoff.arenas.active).toHaveLength(2)
    expect(handoff.setPolicy.conditionCount).toBe(4)
    expect(handoff.lanes).toHaveLength(4)
    expect(handoff.lanes.every((lane) => lane.counted === false)).toBe(true)
    expect(handoff.proofBindings).toMatchObject({
      releaseState: "release-ready",
      auditStatus: "release-ready",
      releaseCompletion: false,
    })
    expect(renderV137StrategyFoundationMarkdown(handoff)).toContain(
      "Separate approval is still required",
    )
    expect(renderV137StrategyFoundationJson(handoff)).not.toMatch(
      /tactic|performance|postgresql:\/\/|PRIVATE_|rawEvidence|release complete/i,
    )
  })

  it("rejects authorization, tactical claims, private/raw IDs, activation, release completion, and stale or extra fields", () => {
    const handoff = createV137StrategyFoundationFixture()

    expect(() =>
      validateV137StrategyFoundation({
        ...handoff,
        strategyMilestoneAuthorized: true,
      }),
    ).toThrow("V137_STRATEGY_FOUNDATION_AUTHORIZATION_INVALID")
    expect(() =>
      validateV137StrategyFoundation({
        ...handoff,
        tacticalRecommendation: "attack first",
      }),
    ).toThrow("V137_STRATEGY_FOUNDATION_SHAPE")
    expect(() =>
      validateV137StrategyFoundation({
        ...handoff,
        lanes: [
          { ...handoff.lanes[0]!, rawRunId: "run:private" },
          ...handoff.lanes.slice(1),
        ],
      }),
    ).toThrow("V137_STRATEGY_FOUNDATION_LANES_INVALID")
    expect(() =>
      validateV137StrategyFoundation({
        ...handoff,
        proofBindings: { ...handoff.proofBindings, releaseCompletion: true },
      }),
    ).toThrow("V137_STRATEGY_FOUNDATION_PROOF_BINDINGS_INVALID")
    expect(() =>
      validateV137StrategyFoundation({
        ...handoff,
        authority: { ...handoff.authority, semanticAuthorityKey: "runtime-v1.17" },
      }),
    ).toThrow("V137_STRATEGY_FOUNDATION_AUTHORITY_INVALID")
    expect(() =>
      renderV137StrategyFoundationJson({
        ...handoff,
        limitations: [...handoff.limitations, "postgresql://private"],
      }),
    ).toThrow(/private marker/i)
  })
})
