import { describe, expect, it } from "vitest"
import type {
  SoldierBrainInput,
  StrategyInput,
} from "@cowards/spec"
import type { StrategyRuntime } from "@cowards/engine"
import { buildChronicleFromMatch } from "./build.js"
import { validateChronicle } from "./validate.js"

describe("replay semantic integrity", () => {
  it("missing-semantic-enforcement: replay rejects invalid intermediate state", () => {
    let runtimeCalls = 0
    const runtime: StrategyRuntime = {
      selectActivations(input: StrategyInput) {
        runtimeCalls += 1
        return {
          ok: true,
          value: {
            activationOrders: input.mySoldiers
              .filter((soldier) => soldier.status === "ACTIVE")
              .map((soldier) => ({ soldierId: soldier.id })),
            strategyMemory: {},
          },
        }
      },
      runSoldierBrain(_input: SoldierBrainInput) {
        runtimeCalls += 1
        return {
          ok: true,
          value: {
            action: { type: "TURN_TO_STONE" },
            soldierMemory: {},
          },
        }
      },
    }
    const built = buildChronicleFromMatch({
      matchId: "match:replay-semantic-red",
      seed: "seed:replay-semantic-red",
      arenaVariant: {
        id: "arena:replay-semantic-red",
        name: "Replay semantic RED",
        initialBounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
        terrainStones: [{ x: 2, y: 11 }],
      },
      bottomPlayerId: "player:bottom",
      topPlayerId: "player:top",
      bottomStrategyRevisionId: "revision:bottom",
      topStrategyRevisionId: "revision:top",
      runtime,
    })
    const overlap = built.chronicle.snapshots.find((snapshot) =>
      snapshot.board.soldiers.some(
        (soldier) =>
          soldier.position?.x === 2 && soldier.position.y === 11,
      ),
    )
    expect(overlap?.board.terrainStones).toContainEqual({ x: 2, y: 11 })

    runtimeCalls = 0
    const validation = validateChronicle(built.chronicle)
    expect(runtimeCalls, "replay validation must never schedule gameplay").toBe(0)
    if (!validation.ok) {
      expect(validation.errors.map((error) => error.code)).toContain(
        "ARENA_TERRAIN_START_OVERLAP",
      )
      return
    }

    throw new Error("[EXPECTED_RED:MISSING_SEMANTIC_ENFORCEMENT:REPLAY]")
  })
})
