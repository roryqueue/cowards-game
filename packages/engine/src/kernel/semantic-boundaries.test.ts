import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { ArenaVariantSchema } from "@cowards/spec"
import { createInitialGameState } from "../state.js"

type SemanticCorpus = {
  valid: { arena: unknown }
  vectors: Array<{
    id: string
    mutation?: {
      op: "append"
      path: ["terrainStones"]
      value: { x: number; y: number }
    }
    expected: Array<{ code: string }>
  }>
}

const corpus = JSON.parse(
  readFileSync(
    new URL(
      "../../../spec/src/fixtures/semantic-integrity-vectors.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as SemanticCorpus

describe("candidate semantic boundaries", () => {
  it("missing-semantic-contract: engine boundaries require validator", () => {
    const vector = corpus.vectors.find(
      (candidate) => candidate.id === "arena-terrain-start-overlap",
    )
    expect(vector?.expected.map((issue) => issue.code)).toEqual([
      "ARENA_TERRAIN_START_OVERLAP",
    ])
    const arena = structuredClone(corpus.valid.arena) as {
      id: string
      name: string
      initialBounds: { minX: number; maxX: number; minY: number; maxY: number }
      terrainStones: Array<{ x: number; y: number }>
    }
    arena.terrainStones.push(vector!.mutation!.value)
    expect(ArenaVariantSchema.safeParse(arena).success).toBe(true)

    try {
      createInitialGameState({
        matchId: "match:missing-semantic-engine",
        seed: "seed:missing-semantic-engine",
        arenaVariant: arena,
        bottomPlayerId: "player:bottom",
        topPlayerId: "player:top",
        bottomStrategyRevisionId: "revision:bottom",
        topStrategyRevisionId: "revision:top",
      })
    } catch (error) {
      expect(String(error)).toContain("ARENA_TERRAIN_START_OVERLAP")
      return
    }

    throw new Error("[EXPECTED_RED:MISSING_SEMANTIC_CONTRACT:ENGINE]")
  })
})
