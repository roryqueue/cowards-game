import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const read = (path: string) => readFileSync(path, "utf8")

describe("public competition trust projections", () => {
  it("renders posture from the spec contract on competition surfaces", () => {
    for (const path of [
      "apps/web/app/competitions/page.tsx",
      "apps/web/app/competitions/[competitionId]/page.tsx",
    ]) {
      const source = read(path)
      expect(source).toContain("COMPETITION_POLICY_V1_36_POSTURE")
      expect(source).toContain("durableRatingPromise")
    }
  })

  it("renders authoritative counted, standings, and governance projections", () => {
    const season = read("apps/web/app/ladder/[seasonId]/page.tsx")
    expect(season).toContain("competitionEvidence.countedMatchSetCount")
    expect(season).toContain("matchSet.countedState.publicLabel")

    const competitionDetail = read(
      "apps/web/app/competitions/[competitionId]/page.tsx",
    )
    expect(competitionDetail).toContain(
      "standing.competitionEvidence.countedMatchSetCount",
    )
    expect(competitionDetail).toContain(
      "standing.competitionEvidence.excludedMatchSetCount",
    )
    expect(competitionDetail).toContain(
      "standing.competitionEvidence.evidenceAvailability",
    )
    expect(competitionDetail).toContain(
      "standing.competitionEvidence.resultLinks.map",
    )
    expect(competitionDetail).toContain(
      "standing.competitionEvidence.replayLinks.map",
    )
    expect(competitionDetail).not.toContain("Public standings")

    const result = read("apps/web/app/matchsets/[matchSetId]/page.tsx")
    expect(result).toContain("result.competition?.countedState")
    expect(result).toContain("result.competition?.governance")
    expect(result).not.toContain("result.metadata")

    const resultViewModel = read("apps/web/app/matchsets/result-view-model.ts")
    expect(resultViewModel).toContain("result.competition?.countedState.state")
    expect(resultViewModel).not.toContain("result.metadata")
  })

  it("distinguishes counted trial records from other public evidence", () => {
    const player = read("apps/web/app/players/[handle]/page.tsx")
    const strategy = read("apps/web/app/strategies/[strategyId]/page.tsx")
    expect(player).toContain('result.seasonId ? "Trial Season" : "Exhibition"')
    expect(player).toContain("result.countedState.publicLabel")
    expect(strategy).toContain("Counted trial evidence only")
    expect(strategy).toContain("self-play")
  })
})
