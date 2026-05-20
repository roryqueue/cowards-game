import { describe, expect, it } from "vitest"
import { resolveRound, runMatch } from "./match.js"
import { createInitialGameState } from "./state.js"
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

  it("interleaves selected Soldier slots by Cycle layer", () => {
    const calls: string[] = []
    const state = {
      ...createInitialGameState(input),
      roundNumber: 3 as const,
      activationCount: 3 as const,
      initiativePlayerId: "bottom",
    }
    const runtime = createFakeRuntime({
      action: (brainInput) => {
        calls.push(`${brainInput.self.id}:${brainInput.cycleIndex}`)
        return { type: "TURN", direction: brainInput.self.facing ?? "UP" }
      },
    })

    resolveRound(state, runtime)

    expect(calls.slice(0, 12)).toEqual([
      "bottom-soldier-1:0",
      "top-soldier-1:0",
      "top-soldier-2:0",
      "bottom-soldier-2:0",
      "bottom-soldier-3:0",
      "top-soldier-3:0",
      "bottom-soldier-1:1",
      "top-soldier-1:1",
      "top-soldier-2:1",
      "bottom-soldier-2:1",
      "bottom-soldier-3:1",
      "top-soldier-3:1",
    ])
  })
})
