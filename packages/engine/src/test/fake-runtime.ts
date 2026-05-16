import type {
  Action,
  ActivationOrder,
  SoldierBrainInput,
  SoldierSnapshot,
  StrategyInput,
} from "@cowards/spec"
import { success, type StrategyRuntime } from "../types.js"

export interface FakeRuntimeOptions {
  selectActivations?: (input: StrategyInput) => ActivationOrder[]
  action?: Action | ((input: SoldierBrainInput) => Action)
}

export const createFakeRuntime = (
  options: FakeRuntimeOptions = {},
): StrategyRuntime => ({
  selectActivations: (input) =>
    success({
      activationOrders:
        options.selectActivations?.(input) ??
        input.mySoldiers
          .filter((soldier: SoldierSnapshot) => soldier.status === "ACTIVE")
          .slice(0, input.activationCount)
          .map((soldier: SoldierSnapshot) => ({ soldierId: soldier.id })),
      strategyMemory: input.strategyMemory,
    }),
  runSoldierBrain: (input) =>
    success({
      action:
        typeof options.action === "function"
          ? options.action(input)
          : (options.action ?? { type: "TURN_TO_STONE" }),
      soldierMemory: input.soldierMemory,
    }),
})
