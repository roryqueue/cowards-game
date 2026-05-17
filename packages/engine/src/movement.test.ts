import { describe, expect, it } from "vitest"
import type { Soldier } from "@cowards/spec"
import { resolveAction } from "./movement.js"
import { createInitialGameState } from "./state.js"
import type { GameState } from "./types.js"

const baseInput = {
  matchId: "match-movement",
  seed: "movement-seed",
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
}

const soldier = (overrides: Partial<Soldier> & { id: string }): Soldier => ({
  ownerPlayerId: "bottom",
  status: "ACTIVE",
  position: { x: 5, y: 5 },
  facing: "UP",
  lastSuccessfulMoveDirection: null,
  soldierMemory: {},
  ...overrides,
})

const stateWith = (
  soldiers: Soldier[],
  terrainStones = [] as { x: number; y: number }[],
): GameState => ({
  ...createInitialGameState(baseInput),
  soldiers,
  terrainStones,
})

describe("movement rules", () => {
  it("resolves TURN without an Advance", () => {
    const state = stateWith([soldier({ id: "mover" })])
    const result = resolveAction(
      state,
      "mover",
      { type: "TURN", direction: "LEFT" },
      { advanced: false },
    )
    expect(result.state.soldiers[0]!.facing).toBe("LEFT")
    expect(result.advanced).toBe(false)
  })

  it("resolves TURN_TO_STONE", () => {
    const state = stateWith([soldier({ id: "mover" })])
    const result = resolveAction(
      state,
      "mover",
      { type: "TURN_TO_STONE" },
      { advanced: false },
    )
    expect(result.state.soldiers[0]!.status).toBe("STONE")
    expect(result.terminalReason).toBe("SOLDIER_STONED")
  })

  it("resolves successful MOVE and updates lastSuccessfulMoveDirection", () => {
    const state = stateWith([soldier({ id: "mover" })])
    const result = resolveAction(
      state,
      "mover",
      { type: "MOVE", direction: "UP" },
      { advanced: false },
    )
    expect(result.state.soldiers[0]!.position).toEqual({ x: 5, y: 4 })
    expect(result.state.soldiers[0]!.lastSuccessfulMoveDirection).toBe("UP")
  })

  it("blocks immediate reversal", () => {
    const state = stateWith([
      soldier({ id: "mover", lastSuccessfulMoveDirection: "UP" }),
    ])
    const result = resolveAction(
      state,
      "mover",
      { type: "MOVE", direction: "DOWN" },
      { advanced: false },
    )
    expect(result.terminalReason).toBe("INVALID_MOVE")
  })

  it("makes a Soldier FALLEN when moving off-board", () => {
    const state = stateWith([
      soldier({ id: "mover", position: { x: 0, y: 0 } }),
    ])
    const result = resolveAction(
      state,
      "mover",
      { type: "MOVE", direction: "UP" },
      { advanced: false },
    )
    expect(result.state.soldiers[0]!.status).toBe("FALLEN")
    expect(
      result.events.some(
        (summary) =>
          summary.type === "SOLDIER_FELL" &&
          JSON.stringify(summary.payload).includes("MOVED_OFF_BOARD"),
      ),
    ).toBe(true)
  })

  it("blocks movement into TerrainStone and STONE Soldiers", () => {
    const terrain = stateWith([soldier({ id: "mover" })], [{ x: 5, y: 4 }])
    expect(
      resolveAction(
        terrain,
        "mover",
        { type: "MOVE", direction: "UP" },
        { advanced: false },
      ).terminalReason,
    ).toBe("MOVE_BLOCKED")

    const stone = stateWith([
      soldier({ id: "mover" }),
      soldier({ id: "wall", status: "STONE", position: { x: 5, y: 4 } }),
    ])
    expect(
      resolveAction(
        stone,
        "mover",
        { type: "MOVE", direction: "UP" },
        { advanced: false },
      ).terminalReason,
    ).toBe("MOVE_BLOCKED")
  })

  it("resolves head-to-head collision without push", () => {
    const state = stateWith([
      soldier({ id: "mover" }),
      soldier({
        id: "target",
        ownerPlayerId: "top",
        position: { x: 5, y: 4 },
        facing: "DOWN",
      }),
    ])
    const result = resolveAction(
      state,
      "mover",
      { type: "MOVE", direction: "UP" },
      { advanced: false },
    )
    expect(result.terminalReason).toBe("MOVE_BLOCKED")
    expect(result.state.soldiers.map((entry) => entry.position)).toEqual([
      { x: 5, y: 5 },
      { x: 5, y: 4 },
    ])
  })

  it("blocks same-direction active collision without push", () => {
    const state = stateWith([
      soldier({ id: "mover" }),
      soldier({
        id: "target",
        ownerPlayerId: "top",
        position: { x: 5, y: 4 },
        facing: "UP",
      }),
    ])
    const result = resolveAction(
      state,
      "mover",
      { type: "MOVE", direction: "UP" },
      { advanced: false },
    )

    expect(result.terminalReason).toBe("MOVE_BLOCKED")
    expect(result.advanced).toBe(false)
    expect(result.state.soldiers.map((entry) => entry.position)).toEqual([
      { x: 5, y: 5 },
      { x: 5, y: 4 },
    ])
    expect(result.events[0]?.payload).toMatchObject({
      reason: "ACTIVE_SOLDIER",
      targetSoldierId: "target",
    })
  })

  it("resolves side push and pushed Soldier does not update lastSuccessfulMoveDirection", () => {
    const state = stateWith([
      soldier({ id: "mover", position: { x: 4, y: 5 }, facing: "RIGHT" }),
      soldier({
        id: "pushed Soldier",
        ownerPlayerId: "top",
        position: { x: 5, y: 5 },
        facing: "UP",
        lastSuccessfulMoveDirection: "LEFT",
      }),
    ])
    const result = resolveAction(
      state,
      "mover",
      { type: "MOVE", direction: "RIGHT" },
      { advanced: false },
    )
    expect(result.state.soldiers[0]!.position).toEqual({ x: 5, y: 5 })
    expect(result.state.soldiers[1]!.position).toEqual({ x: 6, y: 5 })
    expect(result.state.soldiers[1]!.lastSuccessfulMoveDirection).toBe("LEFT")
  })

  it("resolves blocked push and push off board", () => {
    const blocked = stateWith([
      soldier({ id: "mover", position: { x: 4, y: 5 }, facing: "RIGHT" }),
      soldier({
        id: "target",
        ownerPlayerId: "top",
        position: { x: 5, y: 5 },
        facing: "UP",
      }),
      soldier({ id: "blocker", position: { x: 6, y: 5 } }),
    ])
    expect(
      resolveAction(
        blocked,
        "mover",
        { type: "MOVE", direction: "RIGHT" },
        { advanced: false },
      ).terminalReason,
    ).toBe("MOVE_BLOCKED")

    const offBoard = stateWith([
      soldier({ id: "mover", position: { x: 9, y: 5 }, facing: "RIGHT" }),
      soldier({
        id: "target",
        ownerPlayerId: "top",
        position: { x: 10, y: 5 },
        facing: "UP",
      }),
    ])
    const result = resolveAction(
      { ...offBoard, bounds: { minX: 0, maxX: 10, minY: 0, maxY: 10 } },
      "mover",
      { type: "MOVE", direction: "RIGHT" },
      { advanced: false },
    )
    expect(result.state.soldiers[1]!.status).toBe("FALLEN")
    expect(result.advanced).toBe(true)
  })
})
