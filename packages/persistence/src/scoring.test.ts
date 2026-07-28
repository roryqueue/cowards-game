import { describe, expect, it } from "vitest"
import {
  ARENA_CATALOG_VERSION_V1_37,
  createSetScenarioV137,
} from "@cowards/spec"
import { determineMatchSetStatus } from "./matchset-status.js"
import {
  scoreMatchSet,
  scoreSuccessorMatchSetV119,
  type MatchScoreInput,
  type SuccessorMatchScoreInputV119,
} from "./scoring.js"

const match = (input: Partial<MatchScoreInput>): MatchScoreInput => ({
  matchId: input.matchId ?? "match:test",
  bottomStrategyRevisionId:
    input.bottomStrategyRevisionId ?? "strategy-revision:a",
  topStrategyRevisionId: input.topStrategyRevisionId ?? "strategy-revision:b",
  winnerStrategyRevisionId: input.winnerStrategyRevisionId,
  strategyFailureRevisionId: input.strategyFailureRevisionId,
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

  it("applies strategy failure penalties to competitive points", () => {
    const score = scoreMatchSet([
      match({
        matchId: "match:penalty",
        winnerStrategyRevisionId: "strategy-revision:a",
        strategyFailureRevisionId: "strategy-revision:b",
      }),
    ])

    expect(score.rankings).toEqual([
      expect.objectContaining({
        strategyRevisionId: "strategy-revision:a",
        points: 3,
        penalties: [],
      }),
      expect.objectContaining({
        strategyRevisionId: "strategy-revision:b",
        points: -1,
        penaltyPoints: -1,
        penalties: [
          {
            matchId: "match:penalty",
            reason: "strategy_failure",
            points: -1,
          },
        ],
      }),
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

const successorScenario = () =>
  createSetScenarioV137({
    arenaCatalogVersion: ARENA_CATALOG_VERSION_V1_37,
    arenaSemanticGeometryHash: `sha256:${"1".repeat(64)}`,
    entrantA: { entrantKey: "entrant:a", playerId: "player:a" },
    entrantB: { entrantKey: "entrant:b", playerId: "player:b" },
    baseSeed: "seed:successor-scoring",
  })

const successorMatches = (): SuccessorMatchScoreInputV119[] => {
  const scenario = successorScenario()
  return scenario.conditions.map((condition) => ({
    ...match({
      matchId: `match:${condition.ordinal}`,
      bottomStrategyRevisionId:
        condition.bottomEntrantKey === scenario.entrantA.entrantKey
          ? "strategy-revision:a"
          : "strategy-revision:b",
      topStrategyRevisionId:
        condition.topEntrantKey === scenario.entrantA.entrantKey
          ? "strategy-revision:a"
          : "strategy-revision:b",
      winnerStrategyRevisionId: "strategy-revision:a",
      strategyFailureRevisionId:
        condition.ordinal === 3 ? "strategy-revision:b" : undefined,
    }),
    semanticAuthorityKey: "runtime-v1.19" as const,
    scenarioId: condition.scenarioId,
    conditionId: condition.conditionId,
    conditionOrdinal: condition.ordinal,
    requestIdentity: condition.requestIdentity,
    bottomEntrantKey: condition.bottomEntrantKey,
    topEntrantKey: condition.topEntrantKey,
    initialInitiativeEntrantKey: condition.initialInitiativeEntrantKey,
    terminalKind:
      condition.ordinal === 3
        ? ("player_violation" as const)
        : ("success" as const),
    attemptNumber: 1,
    retryableSystemFailure: false,
    bottomRevisionEvidence: {
      strategyRevisionId:
        condition.bottomEntrantKey === scenario.entrantA.entrantKey
          ? "strategy-revision:a"
          : "strategy-revision:b",
      scheduledRevalidationId: `revalidation:${condition.bottomEntrantKey}`,
      currentRevalidationId: `revalidation:${condition.bottomEntrantKey}`,
      scheduledRevalidationRoot: `sha256:${(condition.bottomEntrantKey === "entrant:a" ? "2" : "3").repeat(64)}`,
      currentRevalidationRoot: `sha256:${(condition.bottomEntrantKey === "entrant:a" ? "2" : "3").repeat(64)}`,
      revoked: false,
    },
    topRevisionEvidence: {
      strategyRevisionId:
        condition.topEntrantKey === scenario.entrantA.entrantKey
          ? "strategy-revision:a"
          : "strategy-revision:b",
      scheduledRevalidationId: `revalidation:${condition.topEntrantKey}`,
      currentRevalidationId: `revalidation:${condition.topEntrantKey}`,
      scheduledRevalidationRoot: `sha256:${(condition.topEntrantKey === "entrant:a" ? "2" : "3").repeat(64)}`,
      currentRevalidationRoot: `sha256:${(condition.topEntrantKey === "entrant:a" ? "2" : "3").repeat(64)}`,
      revoked: false,
    },
  }))
}

describe("runtime-v1.19 exact matrix scoring", () => {
  it("is byte-identical for every insertion and completion permutation", () => {
    const scenario = successorScenario()
    const matches = successorMatches()
    const expected = scoreSuccessorMatchSetV119(scenario, matches)
    for (const permutation of [
      [...matches].reverse(),
      [matches[2]!, matches[0]!, matches[3]!, matches[1]!],
    ]) {
      expect(
        JSON.stringify(scoreSuccessorMatchSetV119(scenario, permutation)),
      ).toBe(JSON.stringify(expected))
    }
    expect(expected).toMatchObject({
      complete: true,
      counted: true,
      degraded: false,
    })
    expect(
      expected.rankings.find(
        ({ strategyRevisionId }) =>
          strategyRevisionId === "strategy-revision:b",
      )?.penaltyPoints,
    ).toBe(-1)
  })

  it("keeps omitted, retryable, exhausted, and invalid D-04 matrices non-counted", () => {
    const scenario = successorScenario()
    const matches = successorMatches()
    expect(
      scoreSuccessorMatchSetV119(scenario, matches.slice(0, 3)),
    ).toMatchObject({
      status: "pending",
      counted: false,
      rankings: [],
    })
    expect(
      scoreSuccessorMatchSetV119(scenario, [
        ...matches.slice(0, 3),
        {
          ...matches[3]!,
          status: "failed_system",
          terminalKind: undefined,
          retryableSystemFailure: true,
        },
      ]),
    ).toMatchObject({ status: "pending", counted: false, rankings: [] })
    expect(
      scoreSuccessorMatchSetV119(scenario, [
        ...matches.slice(0, 3),
        {
          ...matches[3]!,
          status: "failed_system",
          terminalKind: undefined,
          retryableSystemFailure: false,
        },
      ]),
    ).toMatchObject({ status: "degraded", counted: false, rankings: [] })
    expect(
      scoreSuccessorMatchSetV119(scenario, [
        {
          ...matches[0]!,
          bottomRevisionEvidence: {
            ...matches[0]!.bottomRevisionEvidence,
            revoked: true,
          },
        },
        ...matches.slice(1),
      ]),
    ).toMatchObject({ status: "pending", counted: false, rankings: [] })
  })

  it("rejects duplicate, substituted, and generic-four-terminal counterfeits", () => {
    const scenario = successorScenario()
    const matches = successorMatches()
    for (const counterfeit of [
      [matches[0]!, matches[0]!, matches[2]!, matches[3]!],
      [
        {
          ...matches[0]!,
          conditionId: `set-condition:sha256:${"f".repeat(64)}` as const,
        },
        ...matches.slice(1),
      ],
      matches.map((entry, index) => ({
        ...entry,
        conditionOrdinal: index as 0 | 1 | 2 | 3,
        conditionId:
          `set-condition:sha256:${String(index).repeat(64)}` as `set-condition:sha256:${string}`,
      })),
    ]) {
      expect(() => scoreSuccessorMatchSetV119(scenario, counterfeit)).toThrow(
        /membership/iu,
      )
    }
  })
})
