import type { SoldierBrainInput, StrategyInput } from "@cowards/spec"
import { describe, expect, it } from "vitest"
import {
  MATCH_KERNEL,
  type RunMatchInput,
  type StrategyRuntime,
} from "@cowards/engine"
import { createChronicleContentHash } from "./hash.js"
import { normalizeChronicle } from "./normalize.js"
import { recordChronicleFromExecution } from "./record.js"
import { validateCurrentChronicle } from "./validate.js"

const deterministicRuntime: StrategyRuntime = {
  selectActivations(input: StrategyInput) {
    const ownerPlayerId =
      input.mySoldiers.find((soldier) => soldier.status === "ACTIVE")
        ?.ownerPlayerId ?? "unknown"
    return {
      ok: true,
      value: {
        activationOrders: input.mySoldiers
          .filter((soldier) => soldier.status === "ACTIVE")
          .map((soldier) => ({ soldierId: soldier.id })),
        strategyMemory: {
          selectedRound: input.roundNumber,
          selectedPlayer: ownerPlayerId,
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
  const candidate = validateCurrentChronicle({
    profile: "current-exact",
    compatibility: recorded.semanticIdentity,
    chronicle: recorded.chronicle,
    boundaryAnchors: recorded.boundaryAnchors,
    execution,
  })
  if (!candidate.ok) throw new Error(candidate.issues[0]?.code)
  const chronicle = recorded.chronicle
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
  }, 15_000)
})
