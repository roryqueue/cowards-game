import type { RunMatchInput, StrategyRuntime } from "@cowards/engine"
import type {
  SoldierBrainInput,
  StrategyInput,
  StrategyResult,
} from "@cowards/spec"

export const GOLDEN_PARITY_VERSION = "golden-parity-v1.7"

export const privateMarkers = {
  strategyMemory: "GOLDEN_PRIVATE_STRATEGY_MEMORY",
  soldierMemory: "GOLDEN_PRIVATE_SOLDIER_MEMORY",
  objective: "GOLDEN_PRIVATE_OBJECTIVE",
} as const

export const goldenRuntime: StrategyRuntime = {
  selectActivations(input: StrategyInput) {
    const active = input.mySoldiers.filter(
      (soldier) => soldier.status === "ACTIVE",
    )
    const activationOrders: StrategyResult["activationOrders"] = active
      .slice(0, input.activationCount)
      .map((soldier) => ({
        soldierId: soldier.id,
        objective: {
          marker: `${privateMarkers.objective}:${soldier.ownerPlayerId}:${soldier.id}`,
        },
      }))
    return {
      ok: true,
      value: {
        activationOrders,
        strategyMemory: {
          marker: `${privateMarkers.strategyMemory}:${input.mySoldiers[0]?.ownerPlayerId ?? "unknown"}:${input.roundNumber}`,
        },
      },
    }
  },

  runSoldierBrain(input: SoldierBrainInput) {
    return {
      ok: true,
      value: {
        action: { type: "TURN_TO_STONE" },
        soldierMemory: {
          marker: `${privateMarkers.soldierMemory}:${input.self.ownerPlayerId}:${input.self.id}`,
        },
      },
    }
  },
}

export const createGoldenMatchInput = (): RunMatchInput => ({
  matchId: "golden:v1-7:match",
  seed: "golden:v1-7:seed",
  arenaVariant: {
    id: "golden:v1-7:arena",
    name: "v1.7 Golden Arena",
    initialBounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
    terrainStones: [
      { x: 4, y: 4 },
      { x: 7, y: 7 },
    ],
  },
  bottomPlayerId: "bottom",
  topPlayerId: "top",
  bottomStrategyRevisionId: "strategy-revision:golden-bottom",
  topStrategyRevisionId: "strategy-revision:golden-top",
  runtime: goldenRuntime,
})
