import { describe, expect, it } from "vitest"
import { getMatchSetPreset } from "./presets.js"
import { generatePresetMatrix } from "./matchset-service.js"
import type { CreateMatchInput } from "./match-service.js"

describe("MatchSet presets", () => {
  it("defines fixed standard-v1 seed and arena lists", () => {
    const preset = getMatchSetPreset("standard-v1")

    expect(preset.arenaVariantIds).toEqual([
      "arena:smoke:v1",
      "arena:standard-cross:v1",
    ])
    expect(preset.seeds).toEqual(["seed:standard:001", "seed:standard:002"])
    expect(preset.mirrorSides).toBe(true)
  })

  it("generates mirrored side assignments for standard-v1", () => {
    const matrix = generatePresetMatrix({
      id: "match-set:test",
      presetId: "standard-v1",
      bottomStrategyRevisionId: "strategy-revision:bottom",
      topStrategyRevisionId: "strategy-revision:top",
      bottomPlayerId: "player:bottom",
      topPlayerId: "player:top",
    })

    expect(matrix).toHaveLength(8)
    expect(matrix[0]).toMatchObject({
      bottomStrategyRevisionId: "strategy-revision:bottom",
      topStrategyRevisionId: "strategy-revision:top",
    })
    expect(matrix[1]).toMatchObject({
      bottomStrategyRevisionId: "strategy-revision:top",
      topStrategyRevisionId: "strategy-revision:bottom",
      seed: "seed:standard:001:mirror",
    })
  })

  it("preserves custom explicit matrix records", () => {
    const explicit: CreateMatchInput[] = [
      {
        id: "match:custom:001",
        bottomStrategyRevisionId: "strategy-revision:a",
        topStrategyRevisionId: "strategy-revision:b",
        arenaVariantId: "arena:smoke:v1",
        seed: "seed:custom:001",
        bottomPlayerId: "player:a",
        topPlayerId: "player:b",
      },
    ]

    expect(JSON.parse(JSON.stringify(explicit))).toEqual(explicit)
  })
})
