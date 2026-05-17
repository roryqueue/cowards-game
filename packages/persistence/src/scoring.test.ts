import { describe, expect, it } from "vitest"
import { determineMatchSetStatus } from "./matchset-status.js"
import { scoreMatchSet, type MatchScoreInput } from "./scoring.js"

const match = (input: Partial<MatchScoreInput>): MatchScoreInput => ({
  matchId: input.matchId ?? "match:test",
  bottomStrategyRevisionId:
    input.bottomStrategyRevisionId ?? "strategy-revision:a",
  topStrategyRevisionId: input.topStrategyRevisionId ?? "strategy-revision:b",
  winnerStrategyRevisionId: input.winnerStrategyRevisionId,
  status: input.status ?? "complete",
  survivingSoldiers: input.survivingSoldiers ?? 0,
  bottomSurvivingSoldiers: input.bottomSurvivingSoldiers ?? 0,
  topSurvivingSoldiers: input.topSurvivingSoldiers ?? 0,
  survivalTurns: input.survivalTurns ?? 0,
  bottomSurvivalTurns: input.bottomSurvivalTurns ?? 0,
  topSurvivalTurns: input.topSurvivalTurns ?? 0,
})

describe("MatchSet scoring", () => {
  it("orders by wins, surviving soldiers, survivalTurns, then revision id", () => {
    const score = scoreMatchSet([
      match({
        matchId: "match:1",
        winnerStrategyRevisionId: "strategy-revision:b",
        survivingSoldiers: 1,
        bottomSurvivingSoldiers: 0,
        topSurvivingSoldiers: 1,
        survivalTurns: 10,
        bottomSurvivalTurns: 10,
        topSurvivalTurns: 10,
      }),
      match({
        matchId: "match:2",
        bottomStrategyRevisionId: "strategy-revision:c",
        topStrategyRevisionId: "strategy-revision:d",
        winnerStrategyRevisionId: "strategy-revision:c",
        survivingSoldiers: 2,
        bottomSurvivingSoldiers: 2,
        topSurvivingSoldiers: 0,
        survivalTurns: 8,
        bottomSurvivalTurns: 8,
        topSurvivalTurns: 8,
      }),
      match({
        matchId: "match:3",
        bottomStrategyRevisionId: "strategy-revision:e",
        topStrategyRevisionId: "strategy-revision:f",
        winnerStrategyRevisionId: "strategy-revision:e",
        survivingSoldiers: 2,
        bottomSurvivingSoldiers: 2,
        topSurvivingSoldiers: 0,
        survivalTurns: 12,
        bottomSurvivalTurns: 12,
        topSurvivalTurns: 12,
      }),
    ])

    expect(score.rankings.map((entry) => entry.strategyRevisionId)).toEqual([
      "strategy-revision:e",
      "strategy-revision:c",
      "strategy-revision:b",
      "strategy-revision:f",
      "strategy-revision:a",
      "strategy-revision:d",
    ])
  })

  it("uses side-specific surviving soldiers for head-to-head tie-breakers", () => {
    const score = scoreMatchSet([
      match({
        bottomStrategyRevisionId: "strategy-revision:a",
        topStrategyRevisionId: "strategy-revision:b",
        winnerStrategyRevisionId: "strategy-revision:a",
        bottomSurvivingSoldiers: 1,
        topSurvivingSoldiers: 0,
      }),
      match({
        bottomStrategyRevisionId: "strategy-revision:b",
        topStrategyRevisionId: "strategy-revision:a",
        winnerStrategyRevisionId: "strategy-revision:b",
        bottomSurvivingSoldiers: 3,
        topSurvivingSoldiers: 0,
      }),
    ])

    expect(score.rankings.map((entry) => entry.strategyRevisionId)).toEqual([
      "strategy-revision:b",
      "strategy-revision:a",
    ])
    expect(score.rankings.map((entry) => entry.survivingSoldiers)).toEqual([
      3, 1,
    ])
  })

  it("marks failed_system MatchSets as degraded and incomplete", () => {
    const score = scoreMatchSet([
      match({ status: "failed_system", matchId: "match:failed" }),
    ])

    expect(score.degraded).toBe(true)
    expect(score.complete).toBe(false)
    expect(score.rankings[0]?.failedSystemMatches).toBe(1)
    expect(determineMatchSetStatus(score, ["complete", "failed_system"])).toBe(
      "degraded",
    )
  })

  it("reports complete status only when every Match completed without degradation", () => {
    const score = scoreMatchSet([
      match({ winnerStrategyRevisionId: "strategy-revision:a" }),
    ])

    expect(determineMatchSetStatus(score, ["complete"])).toBe("complete")
    expect(determineMatchSetStatus(score, ["pending"])).toBe("pending")
    expect(determineMatchSetStatus(score, ["running"])).toBe("running")
  })
})
