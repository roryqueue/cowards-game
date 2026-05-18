import { describe, expect, it } from "vitest"
import type { RuntimeResult } from "@cowards/engine"
import type { StrategyExecutionAdapter } from "./adapter.js"
import {
  activeStrategyExecutionAdapter,
  getStrategyExecutionAdapterMetadata,
  workerThreadStrategyExecutionAdapterMetadata,
} from "./adapter.js"
import { createWorkerThreadStrategyExecutionAdapter } from "./worker-thread-adapter.js"
import { transpileStrategySource } from "./transpile.js"

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

describe("StrategyExecutionAdapter contract", () => {
  it("exposes worker-thread default metadata and active adapter helpers", () => {
    expect(workerThreadStrategyExecutionAdapterMetadata).toMatchObject({
      id: "worker-thread",
      default: true,
      runtimeControls: {
        timeout: true,
        outputByteLimit: false,
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
})
