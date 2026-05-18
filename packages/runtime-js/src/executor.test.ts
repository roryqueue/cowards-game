import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import type {
  AwarenessCell,
  SoldierBrainInput,
  SoldierSnapshot,
  StrategyInput,
  StrategyRevision,
} from "@cowards/spec"
import type { StrategyExecutionAdapter } from "./adapter.js"
import { createRuntimeFromRevision } from "./executor.js"
import {
  createRuntimeViolation,
  toInvalidOutputViolation,
  toOversizedOutputViolation,
  toThrownExceptionViolation,
} from "./guards.js"
import { buildStrategyRevision } from "./revision.js"

const bottomSoldier: SoldierSnapshot = {
  id: "bottom-1",
  ownerPlayerId: "bottom",
  status: "ACTIVE",
  position: { x: 5, y: 10 },
  facing: "UP",
  lastSuccessfulMoveDirection: null,
}

const topSoldier: SoldierSnapshot = {
  id: "top-1",
  ownerPlayerId: "top",
  status: "ACTIVE",
  position: { x: 5, y: 1 },
  facing: "DOWN",
  lastSuccessfulMoveDirection: null,
}

const awarenessCells = (): AwarenessCell[] => {
  const cells: AwarenessCell[] = []
  for (const dy of [-2, -1, 0, 1, 2] as const) {
    for (const dx of [-2, -1, 0, 1, 2] as const) {
      cells.push({
        dx,
        dy,
        absoluteX: bottomSoldier.position?.x ?? 0,
        absoluteY: bottomSoldier.position?.y ?? 0,
        contents: dx === 0 && dy === 0 ? "FRIENDLY_ACTIVE" : "EMPTY",
      })
    }
  }
  return cells
}

const strategyInput: StrategyInput = {
  phaseNumber: 1,
  roundNumber: 1,
  activationCount: 1,
  board: {
    bounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
    soldiers: [bottomSoldier, topSoldier],
    terrainStones: [],
  },
  mySoldiers: [bottomSoldier],
  enemySoldiers: [topSoldier],
  strategyMemory: {},
}

const soldierBrainInput: SoldierBrainInput = {
  self: bottomSoldier,
  awarenessGrid: { cells: awarenessCells() },
  cycleIndex: 0,
  maxCycles: 12,
  soldierMemory: {},
}

const validSource = `
export default {
  selectActivations(input) {
    return {
      activationOrders: input.mySoldiers.slice(0, input.activationCount).map((soldier) => ({
        soldierId: soldier.id,
        objective: { target: soldier.id },
      })),
      strategyMemory: { seenSoldiers: input.board.soldiers.length },
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

const runtimeForSource = (source: string) =>
  createRuntimeFromRevision(buildStrategyRevision({ source }))

const forgedValidRevision = (source: string): StrategyRevision => {
  const revision = buildStrategyRevision({ source: validSource })
  return {
    ...revision,
    source,
    validation: {
      ...revision.validation,
      valid: true,
      errors: [],
    },
  }
}

describe("runtime guard helpers", () => {
  it("maps ordinary exceptions to THROWN_EXCEPTION", () => {
    expect(toThrownExceptionViolation(new Error("boom")).type).toBe(
      "THROWN_EXCEPTION",
    )
  })

  it("maps forbidden runtime errors to FORBIDDEN_CAPABILITY", () => {
    expect(
      toThrownExceptionViolation(new Error("FORBIDDEN_CAPABILITY: process"))
        .type,
    ).toBe("FORBIDDEN_CAPABILITY")
  })

  it("maps invalid output and oversized output violations", () => {
    expect(toInvalidOutputViolation("bad output").type).toBe("INVALID_OUTPUT")
    expect(toOversizedOutputViolation("too large").type).toBe(
      "OVERSIZED_OUTPUT",
    )
  })

  it("creates typed runtime violations", () => {
    expect(createRuntimeViolation("TIMEOUT", "too slow")).toEqual({
      type: "TIMEOUT",
      message: "too slow",
    })
  })
})

describe("StrategyRuntime execution adapter", () => {
  it("uses a supplied adapter and preserves executor output normalization", () => {
    const calls: string[] = []
    const adapter = {
      metadata: {
        id: "test-adapter",
        label: "Test adapter",
        default: false,
        isolationBoundary: "Unit test double.",
        notes: [],
        runtimeControls: {
          timeout: true,
          outputByteLimit: false,
          environment: "minimal",
          execArgv: "empty",
          resourceLimits: [],
        },
      },
      execute(request) {
        calls.push(request.methodName)
        expect(request.source).toContain("selectActivations")
        expect(request.timeoutMs).toBe(77)

        if (request.methodName === "selectActivations") {
          return {
            ok: true,
            value: {
              activationOrders: [
                { soldierId: "bottom-1", objective: { via: "adapter" } },
              ],
              strategyMemory: { injected: true },
            },
          }
        }

        return {
          ok: true,
          value: {
            action: { type: "TURN_TO_STONE" },
            soldierMemory: { injected: true },
          },
        }
      },
    } satisfies StrategyExecutionAdapter

    const runtime = createRuntimeFromRevision(
      buildStrategyRevision({ source: validSource }),
      { adapter, timeoutMs: 77 },
    )

    expect(runtime.selectActivations(strategyInput)).toEqual({
      ok: true,
      value: {
        activationOrders: [
          { soldierId: "bottom-1", objective: { via: "adapter" } },
        ],
        strategyMemory: { injected: true },
      },
    })
    expect(runtime.runSoldierBrain(soldierBrainInput)).toEqual({
      ok: true,
      value: {
        action: { type: "TURN_TO_STONE" },
        soldierMemory: { injected: true },
      },
    })
    expect(calls).toEqual(["selectActivations", "soldierBrain"])
  })

  it("keeps executable runtime APIs out of the safe root entrypoint", async () => {
    const rootEntrypoint = (await import("./index.js")) as Record<
      string,
      unknown
    >

    expect(rootEntrypoint.createRuntimeFromRevision).toBeUndefined()
    expect(rootEntrypoint.activeStrategyExecutionAdapter).toBeUndefined()
    expect(
      rootEntrypoint.createWorkerThreadStrategyExecutionAdapter,
    ).toBeUndefined()
  })

  it("does not use Node vm in the production worker harness", () => {
    const harnessSource = readFileSync(
      new URL("./worker-harness.ts", import.meta.url),
      "utf8",
    )

    const forbiddenRuntimeBoundaryPattern = new RegExp(
      "node:" + "vm|vm" + "\\.",
    )

    expect(harnessSource).not.toMatch(forbiddenRuntimeBoundaryPattern)
  })

  it("valid selectActivations returns ok true with activation orders and StrategyMemory", () => {
    const result =
      runtimeForSource(validSource).selectActivations(strategyInput)

    expect(result.ok).toBe(true)
    expect(result.ok && result.value.activationOrders).toEqual([
      { soldierId: "bottom-1", objective: { target: "bottom-1" } },
    ])
    expect(result.ok && result.value.strategyMemory).toEqual({
      seenSoldiers: 2,
    })
  })

  it("valid soldierBrain returns ok true with exactly one Action and SoldierMemory", () => {
    const result =
      runtimeForSource(validSource).runSoldierBrain(soldierBrainInput)

    expect(result.ok).toBe(true)
    expect(result.ok && result.value.action).toEqual({ type: "TURN_TO_STONE" })
    expect(result.ok && result.value.soldierMemory).toEqual({ cycle: 0 })
  })

  it("invalid revisions return INVALID_OUTPUT before worker execution", () => {
    const runtime = createRuntimeFromRevision(
      buildStrategyRevision({
        source: "export default { selectActivations() {} }",
      }),
    )

    const result = runtime.selectActivations(strategyInput)

    expect(result.ok).toBe(false)
    expect(!result.ok && result.violation.type).toBe("INVALID_OUTPUT")
    expect(!result.ok && result.violation.message).toBe(
      "Strategy Revision failed runtime validation",
    )
  })

  it("revalidates actual source and rejects forged-valid revision metadata", () => {
    const runtime = createRuntimeFromRevision(
      forgedValidRevision(`
export default {
  selectActivations() {
    import("node:fs")
    return { activationOrders: [], strategyMemory: { forged: true } }
  },
  soldierBrain() {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} }
  },
}
`),
    )

    const result = runtime.selectActivations(strategyInput)

    expect(result.ok).toBe(false)
    expect(!result.ok && result.violation.type).toBe("INVALID_OUTPUT")
    expect(!result.ok && result.violation.message).toBe(
      "Strategy Revision failed runtime validation",
    )
  })

  it("rejects source hash drift even when the current source is valid", () => {
    const revision = buildStrategyRevision({ source: validSource })
    const runtime = createRuntimeFromRevision({
      ...revision,
      sourceHash: "forged-hash",
    })

    const result = runtime.selectActivations(strategyInput)

    expect(result.ok).toBe(false)
    expect(!result.ok && result.violation.type).toBe("INVALID_OUTPUT")
  })

  it("invalid selectActivations output returns INVALID_OUTPUT", () => {
    const result = runtimeForSource(`
export default {
  selectActivations() {
    return { activationOrders: "bad", strategyMemory: {} }
  },
  soldierBrain() {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} }
  },
}
`).selectActivations(strategyInput)

    expect(result.ok).toBe(false)
    expect(!result.ok && result.violation.type).toBe("INVALID_OUTPUT")
  })

  it("invalid soldierBrain output returns INVALID_OUTPUT", () => {
    const result = runtimeForSource(`
export default {
  selectActivations() {
    return { activationOrders: [], strategyMemory: {} }
  },
  soldierBrain() {
    return { action: { type: "FLY" }, soldierMemory: {} }
  },
}
`).runSoldierBrain(soldierBrainInput)

    expect(result.ok).toBe(false)
    expect(!result.ok && result.violation.type).toBe("INVALID_OUTPUT")
  })

  it("oversized StrategyMemory returns OVERSIZED_OUTPUT", () => {
    const result = runtimeForSource(`
export default {
  selectActivations() {
    return { activationOrders: [], strategyMemory: "x".repeat(32769) }
  },
  soldierBrain() {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} }
  },
}
`).selectActivations(strategyInput)

    expect(result.ok).toBe(false)
    expect(!result.ok && result.violation.type).toBe("OVERSIZED_OUTPUT")
  })

  it("oversized SoldierMemory returns OVERSIZED_OUTPUT", () => {
    const result = runtimeForSource(`
export default {
  selectActivations() {
    return { activationOrders: [], strategyMemory: {} }
  },
  soldierBrain() {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: "x".repeat(2049) }
  },
}
`).runSoldierBrain(soldierBrainInput)

    expect(result.ok).toBe(false)
    expect(!result.ok && result.violation.type).toBe("OVERSIZED_OUTPUT")
  })

  it("oversized objective payload returns OVERSIZED_OUTPUT", () => {
    const result = runtimeForSource(`
export default {
  selectActivations() {
    return {
      activationOrders: [{ soldierId: "bottom-1", objective: "x".repeat(1025) }],
      strategyMemory: {},
    }
  },
  soldierBrain() {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} }
  },
}
`).selectActivations(strategyInput)

    expect(result.ok).toBe(false)
    expect(!result.ok && result.violation.type).toBe("OVERSIZED_OUTPUT")
  })

  it("thrown exception returns THROWN_EXCEPTION", () => {
    const result = runtimeForSource(`
export default {
  selectActivations() {
    throw new Error("owner-only failure")
  },
  soldierBrain() {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} }
  },
}
`).selectActivations(strategyInput)

    expect(result.ok).toBe(false)
    expect(!result.ok && result.violation.type).toBe("THROWN_EXCEPTION")
  })

  it("infinite loop returns TIMEOUT", () => {
    const result = runtimeForSource(`
export default {
  selectActivations() {
    while (true) {}
  },
  soldierBrain() {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} }
  },
}
`).selectActivations(strategyInput)

    expect(result.ok).toBe(false)
    expect(!result.ok && result.violation.type).toBe("TIMEOUT")
  })

  it("forged forbidden access attempt fails runtime validation", () => {
    const runtime = createRuntimeFromRevision(
      forgedValidRevision(`
export default {
  selectActivations() {
    globalThis.process
    return { activationOrders: [], strategyMemory: {} }
  },
  soldierBrain() {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} }
  },
}
`),
    )

    const result = runtime.selectActivations(strategyInput)

    expect(result.ok).toBe(false)
    expect(!result.ok && result.violation.type).toBe("INVALID_OUTPUT")
  })

  it("forged runtime-only forbidden globals fail runtime validation", () => {
    const runtime = createRuntimeFromRevision(
      forgedValidRevision(`
export default {
  selectActivations() {
    Math.random()
    return { activationOrders: [], strategyMemory: {} }
  },
  soldierBrain() {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} }
  },
}
`),
    )

    const result = runtime.selectActivations(strategyInput)

    expect(result.ok).toBe(false)
    expect(!result.ok && result.violation.type).toBe("INVALID_OUTPUT")
  })

  it("forged Function constructor recovery fails runtime validation", () => {
    const runtime = createRuntimeFromRevision(
      forgedValidRevision(`
export default {
  selectActivations() {
    return (() => {}).constructor("return process")()
  },
  soldierBrain() {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} }
  },
}
`),
    )

    const result = runtime.selectActivations(strategyInput)

    expect(result.ok).toBe(false)
    expect(!result.ok && result.violation.type).toBe("INVALID_OUTPUT")
  })

  it("executes valid strategies with leading comments before export default", () => {
    const result = runtimeForSource(`
// leading author note should survive transpilation
export default {
  selectActivations() {
    return { activationOrders: [], strategyMemory: { ok: true } }
  },
  soldierBrain() {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} }
  },
}
`).selectActivations(strategyInput)

    expect(result.ok).toBe(true)
    expect(result.ok && result.value.strategyMemory).toEqual({ ok: true })
  })

  it("async Promise return is rejected as INVALID_OUTPUT", () => {
    const result = runtimeForSource(`
export default {
  selectActivations() {
    return Promise.resolve({ activationOrders: [], strategyMemory: {} })
  },
  soldierBrain() {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} }
  },
}
`).selectActivations(strategyInput)

    expect(result.ok).toBe(false)
    expect(!result.ok && result.violation.type).toBe("INVALID_OUTPUT")
  })

  it("returns no success until the full output schema parse succeeds", () => {
    const result = runtimeForSource(`
export default {
  selectActivations() {
    return { activationOrders: [], strategyMemory: undefined }
  },
  soldierBrain() {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} }
  },
}
`).selectActivations(strategyInput)

    expect(result.ok).toBe(false)
    expect(!result.ok && result.violation.type).toBe("INVALID_OUTPUT")
  })
})

describe("runtime failure matrix", () => {
  it("INVALID_OUTPUT repeat failing SoldierBrain is stable and does not mutate input", () => {
    const runtime = runtimeForSource(`
export default {
  selectActivations() {
    return { activationOrders: [], strategyMemory: {} }
  },
  soldierBrain() {
    return { action: { type: "FLY" }, soldierMemory: {} }
  },
}
`)
    const inputBefore = JSON.parse(JSON.stringify(soldierBrainInput))
    const first = runtime.runSoldierBrain(soldierBrainInput)
    const second = runtime.runSoldierBrain(soldierBrainInput)

    expect(first.ok).toBe(false)
    expect(second.ok).toBe(false)
    expect(!first.ok && first.violation.type).toBe("INVALID_OUTPUT")
    expect(!second.ok && second.violation.type).toBe("INVALID_OUTPUT")
    expect(soldierBrainInput).toEqual(inputBefore)
  })
})
