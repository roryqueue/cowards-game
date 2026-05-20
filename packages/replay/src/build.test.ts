import type {
  AwarenessGrid5x5,
  JsonValue,
  SoldierBrainInput,
  StrategyInput,
} from "@cowards/spec"
import { describe, expect, it } from "vitest"
import {
  runMatch,
  type RunMatchInput,
  type StrategyRuntime,
} from "@cowards/engine"
import { buildChronicleFromMatch, buildChronicleFromResult } from "./build.js"

const createRecordingRuntime = (
  observedInputs: Map<string, SoldierBrainInput>,
): StrategyRuntime => ({
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
            debugObjective: `objective:${ownerPlayerId}:${soldier.id}`,
          },
        })),
        strategyMemory: {
          debugStrategyMemory: `strategy:${ownerPlayerId}:${input.roundNumber}`,
        },
      },
    }
  },
  runSoldierBrain(input: SoldierBrainInput) {
    observedInputs.set(`${input.self.id}:${input.cycleIndex}`, input)
    return {
      ok: true,
      value: {
        action: { type: "TURN_TO_STONE" },
        soldierMemory: {
          debugSoldierMemory: `soldier:${input.self.id}:${input.cycleIndex}`,
        },
      },
    }
  },
})

const createMatchInput = (runtime: StrategyRuntime): RunMatchInput => ({
  matchId: "chronicle-build-match",
  seed: "chronicle-seed",
  arenaVariant: {
    id: "chronicle-arena",
    name: "Chronicle Arena",
    initialBounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
    terrainStones: [],
  },
  bottomPlayerId: "bottom",
  topPlayerId: "top",
  bottomStrategyRevisionId: "bottom-rev",
  topStrategyRevisionId: "top-rev",
  runtime,
})

const privatePayloadFor = (
  data: JsonValue | undefined,
  privateRef: string,
): JsonValue | undefined => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return undefined
  }
  return data[privateRef]
}

const readAwarenessGrid = (
  payload: JsonValue | undefined,
): AwarenessGrid5x5 | undefined => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return undefined
  }
  return payload.awarenessGrid as AwarenessGrid5x5 | undefined
}

describe("buildChronicleFromMatch", () => {
  it("constructs required events and terminal snapshots", () => {
    const observedInputs = new Map<string, SoldierBrainInput>()
    const { chronicle } = buildChronicleFromMatch(
      createMatchInput(createRecordingRuntime(observedInputs)),
    )
    const eventTypes = chronicle.events.map((event) => event.type)

    expect(eventTypes).toContain("MATCH_STARTED")
    expect(eventTypes).toContain("ROUND_STARTED")
    expect(eventTypes).toContain("STRATEGY_EVALUATED")
    expect(eventTypes).toContain("ACTIVATION_STARTED")
    expect(eventTypes).toContain("AWARENESS_GRID_OBSERVED")
    expect(eventTypes).toContain("ACTION_EMITTED")
    expect(eventTypes).toContain("SOLDIER_STONED")
    expect(eventTypes.filter((type) => type === "MATCH_ENDED")).toHaveLength(1)

    const snapshotKinds = chronicle.snapshots.map((snapshot) => snapshot.kind)
    expect(snapshotKinds).toContain("MATCH_START")
    expect(snapshotKinds).toContain("ROUND_START")
    expect(snapshotKinds).toContain("MATCH_END")
    expect(snapshotKinds).toContain("TERMINAL")
  })

  it("stores exact owner-only 25-cell Awareness Grid data", () => {
    const observedInputs = new Map<string, SoldierBrainInput>()
    const { chronicle } = buildChronicleFromMatch(
      createMatchInput(createRecordingRuntime(observedInputs)),
    )
    const awarenessEvent = chronicle.events.find(
      (event) =>
        event.type === "AWARENESS_GRID_OBSERVED" &&
        event.context.actingPlayerId === "bottom",
    )

    expect(awarenessEvent?.privateRef).toMatch(/^private:event:/)
    const privateRef = awarenessEvent?.privateRef ?? ""
    const bottomPrivate = chronicle.private?.byPlayerId.bottom
    const privatePayload = privatePayloadFor(bottomPrivate, privateRef)
    const privateAwarenessGrid = readAwarenessGrid(privatePayload)
    const recordedInput = observedInputs.get(
      `${awarenessEvent?.context.soldierId}:${awarenessEvent?.context.cycleIndex}`,
    )

    expect(privateAwarenessGrid?.cells).toHaveLength(25)
    expect(privateAwarenessGrid).toEqual(recordedInput?.awarenessGrid)
    expect(awarenessEvent?.payload).toEqual({
      soldierId: awarenessEvent?.context.soldierId,
      cycleIndex: awarenessEvent?.context.cycleIndex,
    })
  })

  it("matches runMatch final outcome", () => {
    const buildObservedInputs = new Map<string, SoldierBrainInput>()
    const runObservedInputs = new Map<string, SoldierBrainInput>()
    const built = buildChronicleFromMatch(
      createMatchInput(createRecordingRuntime(buildObservedInputs)),
    )
    const direct = runMatch(
      createMatchInput(createRecordingRuntime(runObservedInputs)),
    )

    expect(built.finalState.outcome).toEqual(direct.state.outcome)
  })

  it("returns typed failure instead of a partial Chronicle for existing runMatch results", () => {
    const result = runMatch(createMatchInput(createRecordingRuntime(new Map())))
    const adapted = buildChronicleFromResult({
      input: createMatchInput(createRecordingRuntime(new Map())),
      result,
    })

    expect(adapted.ok).toBe(false)
    expect(!adapted.ok && adapted.errors[0]?.code).toBe("SNAPSHOT_MISSING")
  })
})
