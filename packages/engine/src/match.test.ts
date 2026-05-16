import { describe, expect, it } from "vitest"
import { runMatch } from "./match.js"
import { createFakeRuntime } from "./test/fake-runtime.js"

const input = {
  matchId: "match-golden",
  seed: "same seed",
  arenaVariant: {
    id: "arena",
    name: "Arena",
    initialBounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
    terrainStones: [],
  },
  bottomPlayerId: "bottom",
  topPlayerId: "top",
  bottomStrategyRevisionId: "bottom-rev",
  topStrategyRevisionId: "top-rev",
  runtime: createFakeRuntime({ action: { type: "TURN_TO_STONE" } }),
}

describe("runMatch golden behavior", () => {
  it("same seed and fake strategies produce deterministic completion", () => {
    const first = runMatch(input)
    const second = runMatch(input)
    expect(first.state.outcome).toEqual(second.state.outcome)
    expect(first.events.map((summary) => summary.type)).toEqual(
      second.events.map((summary) => summary.type),
    )
    expect(first.state.outcome?.type).toMatch(/WIN|DRAW|FAILED/)
  })

  it("emits core event summaries without mutating input arena", () => {
    const arenaBefore = JSON.parse(JSON.stringify(input.arenaVariant))
    const result = runMatch(input)
    expect(input.arenaVariant).toEqual(arenaBefore)
    expect(result.events.map((summary) => summary.type)).toContain(
      "MATCH_STARTED",
    )
    expect(result.events.map((summary) => summary.type)).toContain(
      "ROUND_STARTED",
    )
    expect(result.events.map((summary) => summary.type)).toContain(
      "ACTIVATION_STARTED",
    )
    expect(result.events.map((summary) => summary.type)).toContain(
      "MATCH_ENDED",
    )
  })

  it("emits one terminal MATCH_ENDED event", () => {
    const result = runMatch(input)
    expect(
      result.events.filter((summary) => summary.type === "MATCH_ENDED"),
    ).toHaveLength(1)
  })
})
