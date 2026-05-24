import type { SpawnSyncReturns } from "node:child_process"
import { describe, expect, it } from "vitest"
import type { RuntimeResult } from "@cowards/engine"
import type { StrategyInput } from "@cowards/spec"
import type { StrategyExecutionAdapter } from "./adapter.js"
import {
  activeStrategyExecutionAdapter,
  getStrategyExecutionAdapterMetadata,
  workerThreadStrategyExecutionAdapterMetadata,
} from "./adapter.js"
import { createWorkerThreadStrategyExecutionAdapter } from "./worker-thread-adapter.js"
import { transpileStrategySource } from "./transpile.js"
import { createRuntimeFromRevision } from "./executor.js"
import { executeStrategyRuntimeAbiV114 } from "./abi-bridge.js"
import { buildStrategyRevision } from "./revision.js"
import { createSubprocessStrategyExecutionAdapter } from "./subprocess-adapter.js"
import { SubprocessSystemFailure } from "./subprocess-ipc.js"

const validStrategySource = `
export default {
  selectActivations(input) {
    return {
      activationOrders: input.mySoldiers.slice(0, input.activationCount).map((soldier) => ({
        soldierId: soldier.id,
        objective: { target: soldier.id },
      })),
      strategyMemory: { adapter: "worker-thread" },
    }
  },
  soldierBrain(input) {
    return {
      action: { type: "TURN_TO_STONE" },
      soldierMemory: { cycle: input.cycleIndex },
    }
  },
}
`

const transpiledSource = (): string => {
  const transpiled = transpileStrategySource(validStrategySource)
  if (!transpiled.ok) {
    throw new Error(transpiled.message)
  }
  return transpiled.code
}

const transpileOrThrow = (source: string): string => {
  const transpiled = transpileStrategySource(source)
  if (!transpiled.ok) {
    throw new Error(transpiled.message)
  }
  return transpiled.code
}

const runtimeInput: StrategyInput = {
  phaseNumber: 1,
  roundNumber: 1,
  activationCount: 1,
  board: {
    bounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
    soldiers: [
      {
        id: "bottom-1",
        ownerPlayerId: "bottom",
        status: "ACTIVE",
        position: { x: 5, y: 10 },
        facing: "UP",
        lastSuccessfulMoveDirection: null,
      },
    ],
    terrainStones: [],
  },
  mySoldiers: [
    {
      id: "bottom-1",
      ownerPlayerId: "bottom",
      status: "ACTIVE",
      position: { x: 5, y: 10 },
      facing: "UP",
      lastSuccessfulMoveDirection: null,
    },
  ],
  enemySoldiers: [],
  strategyMemory: {},
}

const invalidOutputStrategySource = `
export default {
  selectActivations() {
    return { activationOrders: "bad", strategyMemory: {} }
  },
  soldierBrain() {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} }
  },
}
`

const timeoutStrategySource = `
export default {
  selectActivations() {
    while (true) {}
  },
  soldierBrain() {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} }
  },
}
`

const adapterFactories: readonly {
  label: string
  createAdapter: () => StrategyExecutionAdapter
}[] = [
  {
    label: "worker-thread",
    createAdapter: createWorkerThreadStrategyExecutionAdapter,
  },
  {
    label: "subprocess",
    createAdapter: createSubprocessStrategyExecutionAdapter,
  },
]

describe("StrategyExecutionAdapter contract", () => {
  it("exposes worker-thread default metadata and active adapter helpers", () => {
    expect(workerThreadStrategyExecutionAdapterMetadata).toMatchObject({
      id: "worker-thread",
      default: true,
      runtimeControls: {
        timeout: true,
        outputByteLimit: true,
        environment: "empty",
        execArgv: "empty",
      },
    })
    expect(workerThreadStrategyExecutionAdapterMetadata.label).toContain(
      "worker",
    )
    expect(
      workerThreadStrategyExecutionAdapterMetadata.isolationBoundary,
    ).toContain("Default compatibility containment")
    expect(activeStrategyExecutionAdapter).toBe(
      workerThreadStrategyExecutionAdapterMetadata,
    )
    expect(getStrategyExecutionAdapterMetadata()).toBe(
      workerThreadStrategyExecutionAdapterMetadata,
    )
  })

  it("exports active adapter metadata from the executable worker entrypoint", async () => {
    const workerEntrypoint = await import("./worker.js")

    expect(workerEntrypoint.activeStrategyExecutionAdapter.id).toBe(
      "worker-thread",
    )
    expect(workerEntrypoint.getStrategyExecutionAdapterMetadata().default).toBe(
      true,
    )
  })

  it("describes worker threads as containment, not the final sandbox", () => {
    const metadataText = [
      workerThreadStrategyExecutionAdapterMetadata.isolationBoundary,
      ...workerThreadStrategyExecutionAdapterMetadata.notes,
    ].join(" ")

    expect(metadataText).toMatch(/prototype boundary/i)
    expect(metadataText).toMatch(/not a final sandbox/i)
    expect(metadataText).not.toMatch(/is a final sandbox/i)
  })

  it("accepts source, methodName, input, timeout, and output cap options", () => {
    const adapter = {
      metadata: {
        id: "contract-test",
        label: "Contract test adapter",
        default: false,
        isolationBoundary: "In-memory test double.",
        notes: [],
        runtimeControls: {
          timeout: true,
          outputByteLimit: true,
          environment: "minimal",
          execArgv: "empty",
          resourceLimits: [],
        },
      },
      execute(request) {
        expect(request.source).toBe("source text")
        expect(request.methodName).toBe("soldierBrain")
        expect(request.input).toEqual({ cycleIndex: 1 })
        expect(request.timeoutMs).toBe(25)
        expect(request.outputByteLimit).toBe(512)
        return { ok: true, value: { accepted: true } }
      },
    } satisfies StrategyExecutionAdapter

    const result: RuntimeResult<unknown> = adapter.execute({
      source: "source text",
      methodName: "soldierBrain",
      input: { cycleIndex: 1 },
      timeoutMs: 25,
      outputByteLimit: 512,
    })

    expect(result).toEqual({ ok: true, value: { accepted: true } })
    expect(getStrategyExecutionAdapterMetadata(adapter)).toBe(adapter.metadata)
  })

  it("runs adapter calls through the v1.14 ABI conformance bridge", () => {
    const revision = buildStrategyRevision({ source: validStrategySource })
    const adapter = {
      metadata: workerThreadStrategyExecutionAdapterMetadata,
      execute(request) {
        expect(request.methodName).toBe("selectActivations")
        expect(request.input).toEqual(runtimeInput)
        expect(request.source).toContain("selectActivations")
        return {
          ok: true,
          value: { activationOrders: [], strategyMemory: {} },
        }
      },
    } satisfies StrategyExecutionAdapter

    expect(
      executeStrategyRuntimeAbiV114({
        adapter,
        revision,
        executableSource: transpileOrThrow(validStrategySource),
        methodName: "selectActivations",
        input: runtimeInput,
        timeoutMs: 25,
        outputByteLimit: 512,
      }),
    ).toEqual({ ok: true, value: { activationOrders: [], strategyMemory: {} } })
  })

  it("worker-thread adapter delegates valid calls to the worker bridge", () => {
    const adapter = createWorkerThreadStrategyExecutionAdapter()

    const result = adapter.execute({
      source: transpiledSource(),
      methodName: "selectActivations",
      input: {
        activationCount: 1,
        mySoldiers: [{ id: "bottom-1" }],
      },
      timeoutMs: 1_000,
    })

    expect(result.ok).toBe(true)
    expect(result.ok && result.value).toEqual({
      activationOrders: [
        { soldierId: "bottom-1", objective: { target: "bottom-1" } },
      ],
      strategyMemory: { adapter: "worker-thread" },
    })
  })

  it("worker-thread adapter keeps timeout behavior mapped to TIMEOUT", () => {
    const adapter = createWorkerThreadStrategyExecutionAdapter()

    const result = adapter.execute({
      source: transpileOrThrow(`
export default {
  selectActivations() {
    while (true) {}
  },
  soldierBrain() {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} }
  },
}
`),
      methodName: "selectActivations",
      input: {},
      timeoutMs: 1,
    })

    expect(result.ok).toBe(false)
    expect(!result.ok && result.violation.type).toBe("TIMEOUT")
  })

  it("worker-thread adapter enforces output byte caps before host normalization", () => {
    const adapter = createWorkerThreadStrategyExecutionAdapter()

    const result = adapter.execute({
      source: transpileOrThrow(`
export default {
  selectActivations() {
    return { activationOrders: [], strategyMemory: "x".repeat(2048) }
  },
  soldierBrain() {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} }
  },
}
`),
      methodName: "selectActivations",
      input: {},
      timeoutMs: 1_000,
      outputByteLimit: 128,
    })

    expect(result.ok).toBe(false)
    expect(!result.ok && result.violation.type).toBe("OVERSIZED_OUTPUT")
  })

  it("worker-thread adapter rejects cloneable non-JSON output before posting to host", () => {
    const adapter = createWorkerThreadStrategyExecutionAdapter()

    const result = adapter.execute({
      source: transpileOrThrow(`
export default {
  selectActivations() {
    return { activationOrders: [], strategyMemory: new ArrayBuffer(1024 * 1024) }
  },
  soldierBrain() {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} }
  },
}
`),
      methodName: "selectActivations",
      input: {},
      timeoutMs: 1_000,
      outputByteLimit: 128,
    })

    expect(result.ok).toBe(false)
    expect(!result.ok && result.violation.type).toBe("INVALID_OUTPUT")
  })

  for (const adapterFactory of adapterFactories) {
    describe(`${adapterFactory.label} runtime contract`, () => {
      it.each([
        ["crypto.randomUUID()", "crypto.randomUUID()"],
        ["performance.now()", "performance.now()"],
        ["Buffer.from", 'Buffer.from("abc")'],
      ])(
        "blocks nondeterministic global %s at the adapter boundary",
        (_label, expression) => {
          const adapter = adapterFactory.createAdapter()

          const result = adapter.execute({
            source: transpileOrThrow(`
export default {
  selectActivations() {
    ${expression}
    return { activationOrders: [], strategyMemory: {} }
  },
  soldierBrain() {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} }
  },
}
`),
            methodName: "selectActivations",
            input: runtimeInput,
            timeoutMs: 1_000,
          })

          expect(result.ok).toBe(false)
          expect(!result.ok && result.violation.type).toBe(
            "FORBIDDEN_CAPABILITY",
          )
        },
      )

      it("returns schema-normalized valid Strategy output", () => {
        const runtime = createRuntimeFromRevision(
          buildStrategyRevision({ source: validStrategySource }),
          { adapter: adapterFactory.createAdapter(), timeoutMs: 1_000 },
        )

        const result = runtime.selectActivations(runtimeInput)

        expect(result).toEqual({
          ok: true,
          value: {
            activationOrders: [
              { soldierId: "bottom-1", objective: { target: "bottom-1" } },
            ],
            strategyMemory: { adapter: "worker-thread" },
          },
        })
      })

      it("returns player-caused invalid output as a RuntimeResult failure", () => {
        const runtime = createRuntimeFromRevision(
          buildStrategyRevision({ source: invalidOutputStrategySource }),
          { adapter: adapterFactory.createAdapter(), timeoutMs: 1_000 },
        )

        const result = runtime.selectActivations(runtimeInput)

        expect(result.ok).toBe(false)
        expect(!result.ok && result.violation.type).toBe("INVALID_OUTPUT")
      })

      it("returns player-caused timeout as a RuntimeResult failure", () => {
        const runtime = createRuntimeFromRevision(
          buildStrategyRevision({ source: timeoutStrategySource }),
          { adapter: adapterFactory.createAdapter(), timeoutMs: 10 },
        )

        const result = runtime.selectActivations(runtimeInput)

        expect(result.ok).toBe(false)
        expect(!result.ok && result.violation.type).toBe("TIMEOUT")
      })
    })
  }

  it("keeps subprocess infrastructure failures in the system-failure channel", () => {
    const adapter = createSubprocessStrategyExecutionAdapter({
      spawnSync: () =>
        ({
          pid: 123,
          output: ["", "not json", ""],
          stdout: "not json",
          stderr: "",
          status: 0,
          signal: null,
        }) as SpawnSyncReturns<string>,
    })
    const runtime = createRuntimeFromRevision(
      buildStrategyRevision({ source: validStrategySource }),
      { adapter, timeoutMs: 1_000 },
    )

    expect(() => runtime.selectActivations(runtimeInput)).toThrow(
      SubprocessSystemFailure,
    )
    try {
      runtime.selectActivations(runtimeInput)
    } catch (error) {
      expect((error as SubprocessSystemFailure).code).toBe("MALFORMED_IPC")
    }
  })
})
