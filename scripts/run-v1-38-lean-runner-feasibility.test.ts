import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { buildLeanSchedule, hashLeanValue } from "./lib/v1-38-lean-runner-feasibility.js"
import {
  createExclusiveLeanInvocationMarker,
  runLeanFeasibilityInjected,
  type LeanExecutionDependencies,
} from "./run-v1-38-lean-runner-feasibility.js"

const roots = { outcomeRoot: hashLeanValue("outcome"), finalStateRoot: hashLeanValue("state"), transitionEventRoot: hashLeanValue("events"), runtimeAccountingRoot: hashLeanValue("accounting") }
const temporary: string[] = []
afterEach(() => temporary.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true })))

const dependencies = (mutate?: Partial<LeanExecutionDependencies>): LeanExecutionDependencies => ({
  now: (() => { let value = 0; return () => ++value })(),
  execute: async () => ({ classification: "success", cleanupComplete: true, orphanedChild: false, ...roots }),
  ...mutate,
})

describe("bounded lean runner", () => {
  it("executes pass A then B serially exactly once", async () => {
    const active = new Set<string>()
    const seen: string[] = []
    const result = await runLeanFeasibilityInjected(dependencies({
      execute: async (cell) => {
        expect(active.size).toBe(0)
        active.add(cell.cellId)
        seen.push(cell.cellId)
        active.delete(cell.cellId)
        return { classification: "success", cleanupComplete: true, orphanedChild: false, ...roots }
      },
    }))
    expect(seen).toEqual(buildLeanSchedule().map(({ cellId }) => cellId))
    expect(result.result).toBe("pass")
  })

  it("does not retry failures", async () => {
    const seen: string[] = []
    const result = await runLeanFeasibilityInjected(dependencies({
      execute: async (cell) => {
        seen.push(cell.cellId)
        return { classification: cell.ordinal === 3 ? "system_failure" : "success", cleanupComplete: true, orphanedChild: false, ...roots }
      },
    }))
    expect(seen).toHaveLength(24)
    expect(new Set(seen).size).toBe(24)
    expect(result.result).toBe("non_pass")
  })

  it("aborts once at the outer deadline and marks the suffix unlaunched", async () => {
    let tick = 0
    let aborted = 0
    const result = await runLeanFeasibilityInjected(dependencies({
      now: () => (tick += 500_000),
      execute: async (_cell, signal) => ({
        classification: signal.aborted ? "cancelled" : "success",
        cleanupComplete: true, orphanedChild: false, ...roots,
      }),
      onAbort: () => { aborted += 1 },
    }))
    expect(aborted).toBe(1)
    expect(result.counts.unlaunched).toBeGreaterThan(0)
    expect(result.result).toBe("non_pass")
  })

  it("durably creates an exclusive invocation marker and refuses reuse", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "lean-marker-")); temporary.push(dir)
    const marker = path.join(dir, "invocation.json")
    createExclusiveLeanInvocationMarker(marker, { ordinal: 1, authority: false })
    expect(JSON.parse(readFileSync(marker, "utf8"))).toEqual({ ordinal: 1, authority: false })
    expect(() => createExclusiveLeanInvocationMarker(marker, { ordinal: 1 })).toThrow(/LEAN_INVOCATION_EXISTS/u)
  })
})
