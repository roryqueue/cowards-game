import { describe, expect, it } from "vitest"
import {
  classifyCompetitionCountedState,
  type CompetitionCountedStateProjection,
} from "@cowards/spec"
import {
  recomputeSeasonStandings,
  type ClassifiedSeasonMatchSet,
  type SeasonStandingEntrant,
} from "./standings-recompute.js"

const entrants: SeasonStandingEntrant[] = [
  {
    entrantId: "entry:b",
    strategyRevisionId: "revision:b",
    ownerHandle: "bravo",
    displayLabel: "Bravo",
    sourceHash: "hash:b",
  },
  {
    entrantId: "entry:a",
    strategyRevisionId: "revision:a",
    ownerHandle: "alpha",
    displayLabel: "Alpha",
    sourceHash: "hash:a",
  },
]

const projection = (
  state: Parameters<
    typeof classifyCompetitionCountedState
  >[0]["storedState"] = "counted",
): CompetitionCountedStateProjection =>
  classifyCompetitionCountedState({
    executionStatus:
      state === "retrying"
        ? "running"
        : state === "degraded_system_failure"
          ? "failed"
          : "complete",
    origin: "trial",
    expectedMatchCount: 2,
    chronicleMatchCount: state === "pending" ? 1 : 2,
    scoringAvailable: true,
    reviewState: "none",
    storedState: state,
  })

const matchSet = (
  id: string,
  countedState = projection("counted"),
): ClassifiedSeasonMatchSet => ({
  matchSetId: id,
  strategyRevisionIds: ["revision:a", "revision:b"],
  countedState,
  scoring: {
    rankings: [
      {
        strategyRevisionId: "revision:a",
        wins: 1,
        losses: 0,
        draws: 1,
        points: 4,
        penaltyPoints: 0,
        penalties: [],
        failedSystemMatches: 0,
        survivingSoldiers: 4,
        survivalTurns: 12,
      },
      {
        strategyRevisionId: "revision:b",
        wins: 0,
        losses: 1,
        draws: 1,
        points: 1,
        penaltyPoints: 0,
        penalties: [],
        failedSystemMatches: 0,
        survivingSoldiers: 2,
        survivalTurns: 8,
      },
    ],
  },
  resultHref: `/matchsets/${id}`,
  replayHref: `/matches/${id}:match/replay`,
})

describe("Season standings recompute", () => {
  it("is byte-equivalent across repeated and permuted input", () => {
    const first = recomputeSeasonStandings({
      entrants,
      matchSets: [matchSet("matchset:2"), matchSet("matchset:1")],
    })
    const repeated = recomputeSeasonStandings({
      entrants: [...entrants].reverse(),
      matchSets: [matchSet("matchset:1"), matchSet("matchset:2")],
    })
    expect(JSON.stringify(repeated)).toBe(JSON.stringify(first))
    expect(first[0]).toMatchObject({
      strategyRevisionId: "revision:a",
      points: 8,
      competitionEvidence: {
        countedMatchSetCount: 2,
        excludedMatchSetCount: 0,
        evidenceAvailability: "available",
      },
    })
  })

  it.each([
    "degraded_system_failure",
    "pending",
    "retrying",
    "non_counted",
    "non_competitive",
    "under_review",
    "disputed",
    "invalid",
    "invalidated",
  ] as const)("keeps %s visible while excluding all score", (state) => {
    const standings = recomputeSeasonStandings({
      entrants,
      matchSets: [matchSet(`matchset:${state}`, projection(state))],
    })
    expect(standings.map((standing) => standing.points)).toEqual([0, 0])
    expect(standings[0]?.competitionEvidence).toMatchObject({
      countedMatchSetCount: 0,
      excludedMatchSetCount: 1,
      resultLinks: [`/matchsets/matchset:${state}`],
      replayLinks: [`/matches/matchset:${state}:match/replay`],
    })
  })

  it("uses the unchanged stable tie-break order", () => {
    const standings = recomputeSeasonStandings({ entrants, matchSets: [] })
    expect(standings.map((standing) => standing.strategyRevisionId)).toEqual([
      "revision:a",
      "revision:b",
    ])
    expect(standings[0]?.tieBreakerPath).toEqual([
      "points",
      "wins",
      "survivingSoldiers",
      "survivalTurns",
      "strategyRevisionId",
    ])
  })

  it("cannot include a MatchSet omitted from the Season input", () => {
    const otherSeason = matchSet("matchset:other-season")
    expect(
      recomputeSeasonStandings({ entrants, matchSets: [] }).some((standing) =>
        standing.competitionEvidence?.resultLinks.includes(
          otherSeason.resultHref,
        ),
      ),
    ).toBe(false)
  })
})
