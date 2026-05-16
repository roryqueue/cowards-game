import type { SoldierBrainInput, StrategyInput } from "@cowards/spec"
import { describe, expect, it } from "vitest"
import type { RunMatchInput, StrategyRuntime } from "@cowards/engine"
import { buildChronicleFromMatch } from "./build.js"
import { createChronicleContentHash } from "./hash.js"
import { projectOwnerChronicle, projectPublicChronicle } from "./project.js"
import { createReplay } from "./reconstruct.js"
import { validateChronicle } from "./validate.js"

const PRIVATE_STRATEGY_MEMORY_MARKER = "INTEGRATION_PRIVATE_STRATEGY_MEMORY"
const PRIVATE_SOLDIER_MEMORY_MARKER = "INTEGRATION_PRIVATE_SOLDIER_MEMORY"
const PRIVATE_OBJECTIVE_PAYLOAD_MARKER = "INTEGRATION_PRIVATE_OBJECTIVE"
const PRIVATE_AWARENESS_GRID_MARKER = "awarenessGrid"

const deterministicRuntime: StrategyRuntime = {
  selectActivations(input: StrategyInput) {
    const activeSoldiers = input.mySoldiers.filter(
      (soldier) => soldier.status === "ACTIVE",
    )
    const ownerPlayerId = activeSoldiers[0]?.ownerPlayerId ?? "unknown"
    return {
      ok: true,
      value: {
        activationOrders: activeSoldiers.map((soldier) => ({
          soldierId: soldier.id,
          objective: {
            marker: `${PRIVATE_OBJECTIVE_PAYLOAD_MARKER}:${ownerPlayerId}:${soldier.id}`,
          },
        })),
        strategyMemory: {
          marker: `${PRIVATE_STRATEGY_MEMORY_MARKER}:${ownerPlayerId}:${input.roundNumber}`,
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
          marker: `${PRIVATE_SOLDIER_MEMORY_MARKER}:${input.self.ownerPlayerId}:${input.self.id}`,
        },
      },
    }
  },
}

const createMatchInput = (): RunMatchInput => ({
  matchId: "replay-integration-match",
  seed: "replay-integration-seed",
  arenaVariant: {
    id: "replay-integration-arena",
    name: "Replay Integration Arena",
    initialBounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
    terrainStones: [],
  },
  bottomPlayerId: "bottom",
  topPlayerId: "top",
  bottomStrategyRevisionId: "bottom-rev",
  topStrategyRevisionId: "top-rev",
  runtime: deterministicRuntime,
})

describe("replay package integration", () => {
  it("builds, validates, hashes, reconstructs, iterates, and projects a deterministic Match", () => {
    const { chronicle, finalState } =
      buildChronicleFromMatch(createMatchInput())
    const chronicleWithIntegrity = {
      ...chronicle,
      integrity: createChronicleContentHash(chronicle),
    }

    expect(validateChronicle(chronicleWithIntegrity)).toEqual({ ok: true })

    const replay = createReplay(chronicleWithIntegrity)
    expect(replay.ok).toBe(true)
    if (!replay.ok) {
      return
    }

    const lastSequence = chronicleWithIntegrity.events.at(-1)?.sequence ?? 0
    const finalReplayState = replay.replay.stateAt(lastSequence)
    expect(finalReplayState.ok).toBe(true)
    expect(
      finalReplayState.ok ? finalReplayState.state.outcome : undefined,
    ).toEqual(finalState.outcome)

    const timeline = [...replay.replay.iterateReplay()]
    expect(timeline).toHaveLength(chronicleWithIntegrity.events.length)
    expect(timeline.at(-1)?.state.outcome).toEqual(finalState.outcome)

    const eventTypes = chronicleWithIntegrity.events.map((event) => event.type)
    expect(eventTypes).toEqual(
      expect.arrayContaining([
        "MATCH_STARTED",
        "ROUND_STARTED",
        "STRATEGY_EVALUATED",
        "ACTIVATION_STARTED",
        "AWARENESS_GRID_OBSERVED",
        "ACTION_EMITTED",
        "SOLDIER_STONED",
        "MATCH_ENDED",
      ]),
    )
    expect(eventTypes.filter((type) => type === "MATCH_ENDED")).toHaveLength(1)

    const publicProjection = projectPublicChronicle(chronicleWithIntegrity)
    const ownerProjection = projectOwnerChronicle(
      chronicleWithIntegrity,
      "bottom",
    )
    const publicSerialized = JSON.stringify(publicProjection)
    const ownerSerialized = JSON.stringify(ownerProjection.ownerPrivate)

    expect(publicProjection.events.map((event) => event.type)).toContain(
      "AWARENESS_GRID_OBSERVED",
    )
    expect(publicSerialized).not.toContain(PRIVATE_STRATEGY_MEMORY_MARKER)
    expect(publicSerialized).not.toContain(PRIVATE_SOLDIER_MEMORY_MARKER)
    expect(publicSerialized).not.toContain(PRIVATE_OBJECTIVE_PAYLOAD_MARKER)
    expect(publicSerialized).not.toContain(PRIVATE_AWARENESS_GRID_MARKER)

    expect(ownerProjection.viewer).toEqual({
      access: "owner",
      playerId: "bottom",
    })
    expect(ownerSerialized).toContain(PRIVATE_STRATEGY_MEMORY_MARKER)
    expect(ownerSerialized).toContain(PRIVATE_SOLDIER_MEMORY_MARKER)
    expect(ownerSerialized).toContain(PRIVATE_OBJECTIVE_PAYLOAD_MARKER)
    expect(ownerSerialized).toContain(PRIVATE_AWARENESS_GRID_MARKER)
    expect(ownerSerialized).not.toContain(
      `${PRIVATE_STRATEGY_MEMORY_MARKER}:top`,
    )
  })
})
