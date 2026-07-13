import type {
  AwarenessGrid5x5,
  JsonValue,
  SoldierBrainInput,
  StrategyInput,
} from "@cowards/spec"
import { describe, expect, it } from "vitest"
import { MATCH_KERNEL, type StrategyRuntime } from "@cowards/engine"
import { recordChronicleFromExecution } from "./record.js"

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

const createMatchInput = (runtime: StrategyRuntime) => ({
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

const metadata = {
  schemaVersion: "chronicle-v1.4" as const,
  semanticTupleId: MATCH_KERNEL.tupleId,
  semanticTuple: MATCH_KERNEL.tuple,
}

const createRecorded = (runtime: StrategyRuntime) => {
  const execution = MATCH_KERNEL.runMatch(createMatchInput(runtime))
  if (execution.kind !== "completed") {
    throw new Error(execution.failure.code)
  }
  const recorded = recordChronicleFromExecution({ execution, metadata })
  if (!recorded.ok) throw new Error(recorded.failure.code)
  return { execution, recorded }
}

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

describe("candidate Chronicle recording", () => {
  it("constructs required events and terminal snapshots from one execution", () => {
    const observedInputs = new Map<string, SoldierBrainInput>()
    const { recorded } = createRecorded(createRecordingRuntime(observedInputs))
    const eventTypes = recorded.chronicle.events.map((event) => event.type)

    expect(eventTypes).toContain("MATCH_STARTED")
    expect(eventTypes).toContain("ROUND_STARTED")
    expect(eventTypes).toContain("STRATEGY_EVALUATED")
    expect(eventTypes).toContain("ACTIVATION_STARTED")
    expect(eventTypes).toContain("AWARENESS_GRID_OBSERVED")
    expect(eventTypes).toContain("ACTION_EMITTED")
    expect(eventTypes).toContain("SOLDIER_STONED")
    expect(eventTypes.filter((type) => type === "MATCH_ENDED")).toHaveLength(1)

    const snapshotKinds = recorded.chronicle.snapshots.map(
      (snapshot) => snapshot.kind,
    )
    expect(snapshotKinds).toContain("MATCH_START")
    expect(snapshotKinds).toContain("ROUND_START")
    expect(snapshotKinds).toContain("MATCH_END")
    expect(snapshotKinds).toContain("TERMINAL")
  })

  it("stores exact owner-only 25-cell Awareness Grid data", () => {
    const observedInputs = new Map<string, SoldierBrainInput>()
    const { recorded } = createRecorded(createRecordingRuntime(observedInputs))
    const awarenessEvent = recorded.chronicle.events.find(
      (event) =>
        event.type === "AWARENESS_GRID_OBSERVED" &&
        event.context.actingPlayerId === "bottom",
    )

    expect(awarenessEvent?.privateRef).toMatch(/^private:event:/)
    const privateRef = awarenessEvent?.privateRef ?? ""
    const bottomPrivate = recorded.chronicle.private?.byPlayerId.bottom
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

  it("records the final outcome of the same driver execution", () => {
    const { execution, recorded } = createRecorded(
      createRecordingRuntime(new Map()),
    )

    expect(recorded.finalState.outcome).toEqual(execution.result.state.outcome)
  })

  it("returns typed failure instead of a partial Chronicle for a failed execution", () => {
    const systemFailureRuntime = {
      selectActivations() {
        return {
          ok: false,
          systemFailure: { code: "FIXTURE_SYSTEM_FAILURE", retryable: true },
        }
      },
      runSoldierBrain() {
        return {
          ok: false,
          systemFailure: { code: "FIXTURE_SYSTEM_FAILURE", retryable: true },
        }
      },
    } as unknown as StrategyRuntime
    const execution = MATCH_KERNEL.runMatch(
      createMatchInput(systemFailureRuntime),
    )
    const recorded = recordChronicleFromExecution({ execution, metadata })

    expect(execution.kind).toBe("failure")
    expect(recorded.ok).toBe(false)
    expect(!recorded.ok && recorded.failure.code).toBe(
      "RECORDER_EXECUTION_NOT_COMPLETED",
    )
    expect(recorded).not.toHaveProperty("chronicle")
  })
})
