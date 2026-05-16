import type { SoldierBrainInput, StrategyInput } from "@cowards/spec"
import { describe, expect, it } from "vitest"
import type { RunMatchInput, StrategyRuntime } from "@cowards/engine"
import { buildChronicleFromMatch } from "./build.js"
import { createChronicleContentHash } from "./hash.js"
import { normalizeChronicle } from "./normalize.js"

const deterministicRuntime: StrategyRuntime = {
  selectActivations(input: StrategyInput) {
    return {
      ok: true,
      value: {
        activationOrders: input.mySoldiers
          .filter((soldier) => soldier.status === "ACTIVE")
          .map((soldier) => ({ soldierId: soldier.id })),
        strategyMemory: {
          selectedRound: input.roundNumber,
          selectedPlayer: input.playerId,
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
          observedCycle: input.cycleIndex,
          observedSoldier: input.self.id,
        },
      },
    }
  },
}

const createMatchInput = (
  overrides: Partial<RunMatchInput> = {},
): RunMatchInput => ({
  matchId: "determinism-match",
  seed: "determinism-seed",
  arenaVariant: {
    id: "determinism-arena",
    name: "Determinism Arena",
    initialBounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
    terrainStones: [],
  },
  bottomPlayerId: "bottom",
  topPlayerId: "top",
  bottomStrategyRevisionId: "bottom-rev",
  topStrategyRevisionId: "top-rev",
  runtime: deterministicRuntime,
  ...overrides,
})

const buildNormalized = (input: RunMatchInput) => {
  const { chronicle } = buildChronicleFromMatch(input)
  return {
    normalized: normalizeChronicle(chronicle),
    hash: createChronicleContentHash(chronicle),
  }
}

describe("Chronicle determinism", () => {
  it("produces equal normalized content and content hashes for identical deterministic inputs", () => {
    const first = buildNormalized(createMatchInput())
    const second = buildNormalized(createMatchInput())

    expect(first.normalized).toEqual(second.normalized)
    expect(first.hash).toEqual(second.hash)
  })

  it("changes the normalized content hash when seed or Strategy Revision identity changes", () => {
    const baseline = buildNormalized(createMatchInput())
    const seedChanged = buildNormalized(
      createMatchInput({ seed: "determinism-seed-changed" }),
    )
    const strategyChanged = buildNormalized(
      createMatchInput({ bottomStrategyRevisionId: "bottom-rev-changed" }),
    )

    expect(seedChanged.hash).not.toEqual(baseline.hash)
    expect(strategyChanged.hash).not.toEqual(baseline.hash)
  })
})
