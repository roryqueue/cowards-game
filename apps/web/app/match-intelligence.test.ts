import { describe, expect, it } from "vitest"
import {
  MATCH_EXECUTION_CONTRACT_FIXTURES_V1,
  type PublicMatchSetSummaryServiceDto,
} from "@cowards/spec"
import { createReplayFixtureData } from "./matches/replay-fixture.js"
import type { PublicReadMatchSetResultDto } from "../lib/public-service-boundary.js"
import {
  buildReplayIntelligenceViewModel,
  buildResultIntelligenceViewModel,
} from "./match-intelligence.js"

const forbiddenPublicMarkers = [
  "StrategyMemory",
  "SoldierMemory",
  "objectivePayload",
  "strategySource",
  "rawDiagnostics",
  "ownerPrivate",
  "awarenessGrid",
  "databaseUrl",
  "Bearer ",
] as const

const readResult = (
  summary: PublicMatchSetSummaryServiceDto,
): PublicReadMatchSetResultDto => {
  const result = summary.result
  const contract =
    MATCH_EXECUTION_CONTRACT_FIXTURES_V1.find(
      (fixture) => fixture.service.matchSetSummary === summary,
    )?.app.matchSetSummary ?? null
  if (!contract) {
    throw new Error(`Missing app contract for ${summary.matchSetId}`)
  }
  const entrantById = new Map(
    result.entrants.map((entrant) => [entrant.entrantId, entrant]),
  )
  return {
    ...result,
    contract,
    lifecycle: contract.lifecycle,
    currentUser: null,
    entrants: result.entrants.map((entrant) => ({
      ...entrant,
      shortHash: entrant.sourceHash.slice(0, 10),
      isOwner: false,
    })),
    matches: result.matches.map((match) => ({
      ...match,
      bottomLabel:
        entrantById.get(match.entrants.bottom)?.displayLabel ??
        match.entrants.bottom,
      topLabel:
        entrantById.get(match.entrants.top)?.displayLabel ?? match.entrants.top,
      ...(match.replayAvailable
        ? { replayHref: `/matches/${encodeURIComponent(match.matchId)}/replay` }
        : {}),
    })),
  }
}

describe("public Match intelligence derivation", () => {
  it("derives state-specific result intelligence for every frozen fixture", () => {
    for (const fixture of MATCH_EXECUTION_CONTRACT_FIXTURES_V1) {
      if (!fixture.service.matchSetSummary) {
        continue
      }
      const model = buildResultIntelligenceViewModel(
        readResult(fixture.service.matchSetSummary),
        ["JS/TS - counted eligible"],
      )
      const serialized = JSON.stringify(model)

      expect(model.headline).not.toHaveLength(0)
      expect(model.metrics.map((metric) => metric.label)).toEqual([
        "evidence",
        "confidence",
        "replay-backed Matches",
        "public Match mix",
      ])
      expect(model.comparisonRows.length).toBeGreaterThan(0)
      for (const marker of forbiddenPublicMarkers) {
        expect(serialized).not.toContain(marker)
      }
    }
  })

  it("derives replay annotations and tactical panels from public projection data", () => {
    const data = createReplayFixtureData({ scenarioId: "compound-tour" })
    if (data.status !== "ready") {
      throw new Error("compound-tour fixture should be replay-ready")
    }

    const model = buildReplayIntelligenceViewModel(data)
    const serialized = JSON.stringify(model)

    expect(model.availability).toBe("ready")
    expect(model.annotations.length).toBeGreaterThan(0)
    expect(model.annotations.map((annotation) => annotation.category)).toEqual(
      expect.arrayContaining(["movement", "status", "contraction", "outcome"]),
    )
    expect(model.soldiers.length).toBeGreaterThan(0)
    expect(model.panels.map((panel) => panel.id)).toEqual([
      "board-control",
      "terrain-stone",
      "action-mix",
    ])
    expect(serialized).toContain("FALLEN")
    expect(serialized).toContain("STONE")
    for (const marker of forbiddenPublicMarkers) {
      expect(serialized).not.toContain(marker)
    }
  })

  it("keeps unavailable replay intelligence honest and empty", () => {
    const model = buildReplayIntelligenceViewModel({
      status: "unavailable",
      matchId: "match:fixture:missing-chronicle",
      reason: "missing-chronicle",
      message: "Replay unavailable: missing-chronicle privacy-safe state.",
    })

    expect(model.availability).toBe("unavailable")
    expect(model.confidence).toBe("none")
    expect(model.annotations).toEqual([])
    expect(model.soldiers).toEqual([])
    expect(model.panels).toEqual([])
  })
})
