import { describe, expect, it } from "vitest"
import { MATCH_KERNEL, runMatch, type RunMatchInput } from "@cowards/engine"
import { adaptRuntimeForCurrentKernel } from "@cowards/engine/test/current-kernel-runtime"
import {
  projectOwnerChronicle,
  projectPublicChronicle,
} from "@cowards/replay"
import { recordCurrentChronicleTestSupport as recordChronicleFromExecution } from "@cowards/replay/test/current-recording"
import {
  CANONICAL_ARENA_CATALOG_V1_37,
  STRATEGY_RUNTIME_ABI_VERSION,
  StrategyInputSchema,
} from "@cowards/spec"
import { buildStrategyRevision } from "./revision.js"
import { createNestedMatchShapeRuntimeFromRevisionTestSupport } from "./executor.js"

const integrationArena = CANONICAL_ARENA_CATALOG_V1_37.arenas.find(
  ({ id }) => id === "arena:smoke:v1",
)!

const selectedStrategyInput = (input: unknown) => ({
  ...StrategyInputSchema.parse(input),
  initialInitiativePlayerId: "bottom",
  hasInitialInitiative: true,
  roundInitiativePlayerId: "bottom",
  hasRoundInitiative: true,
})

const createInput = (
  source: string,
  overrides: Partial<RunMatchInput> = {},
): RunMatchInput => {
  const revision = buildStrategyRevision({ source })

  return {
    matchId: "runtime-js-integration",
    seed: "runtime-js-seed",
    arenaVariant: {
      id: integrationArena.id,
      name: integrationArena.name,
      initialBounds: { ...integrationArena.initialBounds },
      terrainStones: integrationArena.terrainStones.map((position) => ({
        ...position,
      })),
    },
    bottomPlayerId: "bottom",
    topPlayerId: "top",
    bottomStrategyRevisionId: revision.id,
    topStrategyRevisionId: revision.id,
    runtime: adaptRuntimeForCurrentKernel(
      createNestedMatchShapeRuntimeFromRevisionTestSupport(revision),
    ),
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

const recordInput = (input: RunMatchInput) => {
  const execution = MATCH_KERNEL.runMatch(input)
  const recorded = recordChronicleFromExecution({
    execution,
    metadata: {
      schemaVersion: "chronicle-v1.4",
      semanticTupleId: MATCH_KERNEL.tupleId,
      semanticTuple: MATCH_KERNEL.tuple,
    },
  })
  if (!recorded.ok) throw new Error(recorded.failure.code)
  return recorded
}

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
    const runtime =
      createNestedMatchShapeRuntimeFromRevisionTestSupport(revision)
    const result = runtime.selectActivations(
      selectedStrategyInput({
        phaseNumber: 1,
        roundNumber: 1,
        activationCount: 1,
        initialInitiativePlayerId: "bottom",
        hasInitialInitiative: true,
        roundInitiativePlayerId: "bottom",
        hasRoundInitiative: true,
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
      }),
    )

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
    const { chronicle } = recordInput(
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
    if (String(STRATEGY_RUNTIME_ABI_VERSION) === "strategy-runtime-abi-v1.17") {
      expect(JSON.stringify(ownerProjection)).not.toContain("owner-only boom")
      expect(JSON.stringify(ownerProjection)).toContain(
        "Strategy threw an exception.",
      )
    } else {
      expect(JSON.stringify(ownerProjection)).toContain("owner-only boom")
    }
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
