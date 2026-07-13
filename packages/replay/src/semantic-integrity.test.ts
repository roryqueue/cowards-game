import { describe, expect, it } from "vitest"
import type { SoldierBrainInput, StrategyInput } from "@cowards/spec"
import { CANDIDATE_MATCH_KERNEL, type StrategyRuntime } from "@cowards/engine"
import { recordChronicleFromExecution } from "./record.js"
import { validateCandidateReplaySemantics } from "./validate.js"

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
    const execution = CANDIDATE_MATCH_KERNEL.runMatch({
      matchId: "match:replay-semantic-red",
      seed: "seed:replay-semantic-red",
      arenaVariant: {
        id: "arena:replay-semantic-red",
        name: "Replay semantic RED",
        initialBounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
        terrainStones: [],
      },
      bottomPlayerId: "player:bottom",
      topPlayerId: "player:top",
      bottomStrategyRevisionId: "revision:bottom",
      topStrategyRevisionId: "revision:top",
      runtime,
    })
    const recorded = recordChronicleFromExecution({
      execution,
      metadata: {
        schemaVersion: "chronicle-v1.4",
        semanticTupleId: CANDIDATE_MATCH_KERNEL.tupleId,
        semanticTuple: CANDIDATE_MATCH_KERNEL.tuple,
      },
    })
    if (!recorded.ok || execution.kind !== "completed") {
      throw new Error("candidate execution did not complete")
    }
    const initialState = globalThis.structuredClone(
      execution.recorderMaterial.initialState,
    )
    initialState.arenaVariant.terrainStones.push({ x: 2, y: 11 })
    const invalidExecution = {
      ...execution,
      recorderMaterial: {
        ...execution.recorderMaterial,
        initialState,
      },
    }

    runtimeCalls = 0
    const validation = validateCandidateReplaySemantics({
      profile: "candidate-v1.37",
      compatibility: recorded.semanticIdentity,
      chronicle: recorded.chronicle,
      boundaryAnchors: recorded.boundaryAnchors,
      execution: invalidExecution,
    })
    expect(runtimeCalls, "replay validation must never schedule gameplay").toBe(
      0,
    )
    if (!validation.ok) {
      expect(validation.issues.map((issue) => issue.code)).toContain(
        "ARENA_TERRAIN_START_OVERLAP",
      )
      return
    }

    throw new Error("[EXPECTED_RED:MISSING_SEMANTIC_ENFORCEMENT:REPLAY]")
  })
})
