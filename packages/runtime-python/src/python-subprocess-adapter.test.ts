import { describe, expect, it } from "vitest"
import {
  createPythonRuntimeFromRevision,
  pythonExperimentalRuntimeMetadata,
  runPythonStrategyMethod,
  runPythonStrategyMethodSync,
} from "./python-subprocess-adapter.js"
import {
  buildPythonStrategyRevision,
  validatePythonStrategySource,
} from "./validation.js"

const pythonSource = `
def select_activations(input):
    soldiers = [soldier for soldier in input["mySoldiers"] if soldier["status"] == "ACTIVE"]
    return {
        "activationOrders": [{"soldierId": soldier["id"]} for soldier in soldiers[: input["activationCount"]]],
        "strategyMemory": input["strategyMemory"],
    }

def soldier_brain(input):
    return {
        "action": {"type": "TURN_TO_STONE"},
        "soldierMemory": input["soldierMemory"],
    }
`

describe("Python experimental subprocess Strategy ABI", () => {
  it("runs selectActivations through the v1.7 JSON ABI", async () => {
    const response = await runPythonStrategyMethod({
      sourceText: pythonSource,
      methodName: "selectActivations",
      input: {
        phaseNumber: 1,
        roundNumber: 1,
        activationCount: 1,
        board: {
          bounds: { minX: 0, maxX: 1, minY: 0, maxY: 1 },
          soldiers: [],
          terrainStones: [],
        },
        mySoldiers: [
          {
            id: "soldier:1",
            ownerPlayerId: "player:bottom",
            status: "ACTIVE",
            position: { x: 0, y: 0 },
            facing: "UP",
            lastSuccessfulMoveDirection: null,
          },
        ],
        enemySoldiers: [],
        strategyMemory: {},
      },
    })

    expect(response.ok).toBe(true)
    expect(response.ok ? response.value : undefined).toEqual({
      activationOrders: [{ soldierId: "soldier:1" }],
      strategyMemory: {},
    })
  })

  it("marks the adapter experimental and not counted", () => {
    const metadata = pythonExperimentalRuntimeMetadata()

    expect(metadata.language.id).toBe("python")
    expect(metadata.adapter.id).toBe("runtime-python-subprocess-experimental")
    expect(metadata.limits.network).toBe("disabled")
  })

  it("validates Python source without accepting imports or missing methods", () => {
    const invalid = validatePythonStrategySource("import os\n")

    expect(invalid.valid).toBe(false)
    expect(invalid.errors.map((issue) => issue.code)).toContain(
      "IMPORT_NOT_ALLOWED",
    )
    expect(invalid.errors.map((issue) => issue.code)).toContain(
      "MISSING_SELECT_ACTIVATIONS",
    )
    expect(JSON.stringify(invalid)).not.toContain("Traceback")
  })

  it("runs synchronously for the runtime-service broker adapter", () => {
    const revision = buildPythonStrategyRevision({ source: pythonSource })
    const runtime = createPythonRuntimeFromRevision(revision, {
      timeoutMs: 500,
      stdoutBytes: 32 * 1024,
      stderrBytes: 4 * 1024,
    })
    const result = runtime.runSoldierBrain({
      self: {
        id: "soldier:1",
        ownerPlayerId: "player:bottom",
        status: "ACTIVE",
        position: { x: 0, y: 0 },
        facing: "UP",
        lastSuccessfulMoveDirection: null,
      },
      awarenessGrid: { cells: [] },
      cycleIndex: 0,
      maxCycles: 12,
      soldierMemory: {},
    })

    expect(result.ok).toBe(true)
    expect(result.ok ? result.value.action : undefined).toEqual({
      type: "TURN_TO_STONE",
    })
  })

  it("maps timeout to a runtime violation", () => {
    const source = `${pythonSource}\ndef soldier_brain(input):\n    while True:\n        pass\n`
    const revision = buildPythonStrategyRevision({ source })
    const response = runPythonStrategyMethodSync({
      sourceText: revision.source,
      sourceHash: revision.sourceHash,
      methodName: "soldierBrain",
      input: {
        self: {
          id: "soldier:1",
          ownerPlayerId: "player:bottom",
          status: "ACTIVE",
          position: { x: 0, y: 0 },
          facing: "UP",
          lastSuccessfulMoveDirection: null,
        },
        awarenessGrid: { cells: [] },
        cycleIndex: 0,
        maxCycles: 12,
        soldierMemory: {},
      },
      timeoutMs: 10,
    })

    expect(response.ok).toBe(false)
  })
})
