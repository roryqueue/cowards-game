import { describe, expect, it } from "vitest"
import { runMatch, type RunMatchInput } from "@cowards/engine"
import {
  buildChronicleFromMatch,
  projectOwnerChronicle,
  projectPublicChronicle,
} from "@cowards/replay"
import { createScenarioStateParts } from "@cowards/test-utils"
import { buildStrategyRevision } from "./revision.js"
import { createRuntimeFromRevision } from "./worker.js"

const createInput = (
  source: string,
  overrides: Partial<RunMatchInput> = {},
): RunMatchInput => {
  const scenario = createScenarioStateParts()
  const revision = buildStrategyRevision({ source })

  return {
    matchId: "runtime-js-integration",
    seed: "runtime-js-seed",
    arenaVariant: {
      ...scenario.arenaVariant,
      id: "runtime-js-arena",
      terrainStones: [],
    },
    bottomPlayerId: "bottom",
    topPlayerId: "top",
    bottomStrategyRevisionId: revision.id,
    topStrategyRevisionId: revision.id,
    runtime: createRuntimeFromRevision(revision),
    maxPhases: 1,
    ...overrides,
  }
}

const validSource = `
export default {
  selectActivations(input) {
    return {
      activationOrders: input.mySoldiers.slice(0, input.activationCount).map((soldier) => ({
        soldierId: soldier.id,
        objective: {
          boardSoldiers: input.board.soldiers.length,
          enemies: input.enemySoldiers.length,
        },
      })),
      strategyMemory: {
        boardSoldiers: input.board.soldiers.length,
        mySoldiers: input.mySoldiers.length,
      },
    }
  },
  soldierBrain(input) {
    return {
      action: { type: "TURN_TO_STONE" },
      soldierMemory: {
        self: input.self.id,
        awarenessCells: input.awarenessGrid.cells.length,
        objectiveBoardSoldiers: input.objective.boardSoldiers,
      },
    }
  },
}
`

describe("runtime-js engine and Chronicle integration", () => {
  it("runs a valid default-object strategy revision through runMatch", () => {
    const result = runMatch(createInput(validSource))

    expect(result.events.map((event) => event.type)).toContain(
      "STRATEGY_EVALUATED",
    )
    expect(result.state.players[0].strategyMemory).toEqual({
      boardSoldiers: 16,
      mySoldiers: 8,
    })
  })

  it("selectActivations receives full-board StrategyInput and returns activation orders plus StrategyMemory", () => {
    const revision = buildStrategyRevision({ source: validSource })
    const runtime = createRuntimeFromRevision(revision)
    const result = runtime.selectActivations({
      phaseNumber: 1,
      roundNumber: 1,
      activationCount: 1,
      board: {
        bounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
        soldiers: [
          {
            id: "bottom-1",
            ownerPlayerId: "bottom",
            status: "ACTIVE",
            position: { x: 5, y: 10 },
            facing: "UP",
            lastSuccessfulMoveDirection: null,
          },
          {
            id: "top-1",
            ownerPlayerId: "top",
            status: "ACTIVE",
            position: { x: 5, y: 1 },
            facing: "DOWN",
            lastSuccessfulMoveDirection: null,
          },
        ],
        terrainStones: [],
      },
      mySoldiers: [
        {
          id: "bottom-1",
          ownerPlayerId: "bottom",
          status: "ACTIVE",
          position: { x: 5, y: 10 },
          facing: "UP",
          lastSuccessfulMoveDirection: null,
        },
      ],
      enemySoldiers: [
        {
          id: "top-1",
          ownerPlayerId: "top",
          status: "ACTIVE",
          position: { x: 5, y: 1 },
          facing: "DOWN",
          lastSuccessfulMoveDirection: null,
        },
      ],
      strategyMemory: {},
    })

    expect(result.ok).toBe(true)
    expect(result.ok && result.value.activationOrders).toEqual([
      {
        soldierId: "bottom-1",
        objective: { boardSoldiers: 2, enemies: 1 },
      },
    ])
    expect(result.ok && result.value.strategyMemory).toEqual({
      boardSoldiers: 2,
      mySoldiers: 1,
    })
  })

  it("soldierBrain receives local SoldierBrainInput and returns exactly one Action plus SoldierMemory", () => {
    const result = runMatch(createInput(validSource))
    const bottomSoldier = result.state.soldiers.find(
      (soldier) => soldier.id === "bottom-soldier-1",
    )

    expect(bottomSoldier?.soldierMemory).toEqual({
      self: "bottom-soldier-1",
      awarenessCells: 25,
      objectiveBoardSoldiers: 16,
    })
  })

  it("thrown soldierBrain exception creates private Chronicle runtime violation details", () => {
    const { chronicle } = buildChronicleFromMatch(
      createInput(`
export default {
  selectActivations(input) {
    return {
      activationOrders: input.mySoldiers.slice(0, input.activationCount).map((soldier) => ({ soldierId: soldier.id })),
      strategyMemory: {},
    }
  },
  soldierBrain() {
    throw new Error("owner-only boom")
  },
}
`),
    )
    const publicProjection = projectPublicChronicle(chronicle)
    const ownerProjection = projectOwnerChronicle(chronicle, "bottom")
    const runtimeViolation = publicProjection.events.find(
      (event) => event.type === "RUNTIME_VIOLATION",
    )

    expect(chronicle.events.map((event) => event.type)).toContain(
      "RUNTIME_VIOLATION",
    )
    expect(runtimeViolation?.payload).toEqual({
      ownerPlayerId: "bottom",
      soldierId: "bottom-soldier-1",
      type: "THROWN_EXCEPTION",
    })
    expect(runtimeViolation?.context.soldierId).toBe("bottom-soldier-1")
    expect(JSON.stringify(publicProjection)).not.toContain("owner-only boom")
    expect(JSON.stringify(ownerProjection)).toContain("owner-only boom")
  })

  it("invalid output interrupts activation and stones a Soldier that did not Advance", () => {
    const result = runMatch(
      createInput(`
export default {
  selectActivations(input) {
    return {
      activationOrders: input.mySoldiers.slice(0, input.activationCount).map((soldier) => ({ soldierId: soldier.id })),
      strategyMemory: {},
    }
  },
  soldierBrain() {
    return { action: { type: "FLY" }, soldierMemory: {} }
  },
}
`),
    )

    expect(result.events.map((event) => event.type)).toContain(
      "RUNTIME_VIOLATION",
    )
    expect(result.events.map((event) => event.type)).toContain("SOLDIER_STONED")
    expect(result.events.map((event) => event.type)).not.toContain(
      "MOVE_ADVANCED",
    )
    expect(
      result.events
        .filter((event) => event.type === "SOLDIER_STONED")
        .map((event) => event.payload),
    ).toContainEqual({ soldierId: "bottom-soldier-1" })
  })
})
