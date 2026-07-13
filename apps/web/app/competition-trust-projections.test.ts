import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const read = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), "utf8")

describe("public competition trust projections", () => {
  it("renders posture from the spec contract on competition surfaces", () => {
    for (const path of [
      "./competitions/page.tsx",
      "./competitions/[competitionId]/page.tsx",
    ]) {
      const source = read(path)
      expect(source).toContain("COMPETITION_POLICY_V1_36_POSTURE")
      expect(source).toContain("durableRatingPromise")
    }
  })

  it("renders authoritative counted, standings, and governance projections", () => {
    const season = read("./ladder/[seasonId]/page.tsx")
    expect(season).toContain("competitionEvidence.countedMatchSetCount")
    expect(season).toContain("matchSet.countedState.publicLabel")

    const competitionDetail = read(
      "./competitions/[competitionId]/page.tsx",
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

    const result = read("./matchsets/[matchSetId]/page.tsx")
    expect(result).toContain("result.competition?.countedState")
    expect(result).toContain("result.competition?.governance")
    expect(result).not.toContain("result.metadata")

    const resultViewModel = read("./matchsets/result-view-model.ts")
    expect(resultViewModel).toContain("result.competition?.countedState.state")
    expect(resultViewModel).not.toContain("result.metadata")
  })

  it("distinguishes counted trial records from other public evidence", () => {
    const player = read("./players/[handle]/page.tsx")
    const strategy = read("./strategies/[strategyId]/page.tsx")
    expect(player).toContain('result.seasonId ? "Trial Season" : "Exhibition"')
    expect(player).toContain("result.countedState.publicLabel")
    expect(strategy).toContain("Counted trial evidence only")
    expect(strategy).toContain("self-play")
  })
})
