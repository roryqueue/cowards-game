import { describe, expect, it } from "vitest"
import {
  createPythonRuntimeFromRevision,
  PYTHON_RUNTIME_ENVIRONMENT,
  pythonExperimentalRuntimeMetadata,
  pythonRuntimeHostArgs,
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

describe("Python subprocess Strategy provider ABI", () => {
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

  it("uses constrained provider metadata for counted Python", () => {
    const metadata = pythonExperimentalRuntimeMetadata()

    expect(metadata.language.id).toBe("python")
    expect(metadata.adapter.id).toBe("runtime-python-subprocess-experimental")
    expect(metadata.limits.network).toBe("disabled")
    expect(metadata.limits.filesystem).toBe("none")
    expect(metadata.package.mode).toBe("none")
  })

  it("launches Python with isolated-mode host args and an empty environment", () => {
    expect(pythonRuntimeHostArgs()).toEqual(
      expect.arrayContaining([
        "-I",
        expect.stringContaining("python_runtime_host.py"),
      ]),
    )
    expect(PYTHON_RUNTIME_ENVIRONMENT).toEqual({})
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

  it("uses AST/compile validation with public-safe diagnostics", () => {
    const invalid = validatePythonStrategySource(
      'def select_activations(input):\n    return {"activationOrders": [}\n',
    )

    expect(invalid.valid).toBe(false)
    expect(invalid.errors.map((issue) => issue.code)).toContain(
      "TRANSPILE_FAILED",
    )
    expect(JSON.stringify(invalid)).not.toContain("return {")
    expect(JSON.stringify(invalid)).not.toContain("Traceback")
    expect(JSON.stringify(invalid)).not.toContain("python_validation_host.py")
  })

  it("runs synchronously for the runtime-service broker adapter", () => {
    const revision = buildPythonStrategyRevision({ source: pythonSource })
    const runtime = createPythonRuntimeFromRevision(revision, {
      timeoutMs: 1_000,
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
    expect(response.ok ? undefined : response.failureKind).toBe(
      "runtimeViolation",
    )
  })

  it("maps stdio flood to a deterministic system failure", () => {
    const source = `${pythonSource}\ndef soldier_brain(input):\n    return {"action": {"type": "TURN_TO_STONE"}, "soldierMemory": {"flood": "x" * 200000}}\n`
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
      stdoutBytes: 64,
    })

    expect(response.ok).toBe(false)
    expect(response.ok ? undefined : response.failureKind).toBe("systemFailure")
    expect(
      response.ok || response.failureKind !== "systemFailure"
        ? undefined
        : response.systemFailure.code,
    ).toBe("STDIO_CAP_EXCEEDED")
  })
})
