import { execFileSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { buildLeanSchedule, hashLeanValue, LEAN_CURRENT_FORMATION_ROOT, leanRequestRealismRoot } from "./lib/v1-38-lean-runner-feasibility.js"
import {
  LEAN_LIVE_SELECTOR,
  buildCanonicalLeanRequestV118,
  createExclusiveLeanInvocationMarker,
  executePreparedLeanCell,
  parseLeanExecutionResult,
  runLeanFeasibilityInjected,
  type LeanExecutionDependencies,
} from "./run-v1-38-lean-runner-feasibility.js"

const roots = { outcomeRoot: hashLeanValue("outcome"), finalStateRoot: hashLeanValue("state"), transitionEventRoot: hashLeanValue("events"), runtimeAccountingRoot: hashLeanValue("accounting") }
const temporary: string[] = []
afterEach(() => temporary.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true })))

const dependencies = (mutate?: Partial<LeanExecutionDependencies>): LeanExecutionDependencies => ({
  now: (() => { let value = 0; return () => ++value })(),
  execute: async (cell) => ({ classification: "success", cleanupComplete: true, orphanedChild: false, boardRealism: true, integrityValid: true, requestRealismRoot: leanRequestRealismRoot(cell), currentFormationRoot: LEAN_CURRENT_FORMATION_ROOT, ...roots }),
  terminateActive: async () => ({ cleanupComplete: true, orphanedChild: false }),
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
        return { classification: "success", cleanupComplete: true, orphanedChild: false, boardRealism: true, integrityValid: true, requestRealismRoot: leanRequestRealismRoot(cell), currentFormationRoot: LEAN_CURRENT_FORMATION_ROOT, ...roots }
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
        return cell.ordinal === 3
          ? { classification: "system_failure", cleanupComplete: true, orphanedChild: false, boardRealism: true, integrityValid: true }
          : { classification: "success", cleanupComplete: true, orphanedChild: false, boardRealism: true, integrityValid: true, requestRealismRoot: leanRequestRealismRoot(cell), currentFormationRoot: LEAN_CURRENT_FORMATION_ROOT, ...roots }
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
      execute: async (cell, signal) => signal.aborted
        ? { classification: "cancelled", cleanupComplete: true, orphanedChild: false, boardRealism: true, integrityValid: true }
        : { classification: "success", cleanupComplete: true, orphanedChild: false, boardRealism: true, integrityValid: true, requestRealismRoot: leanRequestRealismRoot(cell), currentFormationRoot: LEAN_CURRENT_FORMATION_ROOT, ...roots },
      onAbort: () => { aborted += 1 },
    }))
    expect(aborted).toBe(1)
    expect(result.counts.unlaunched).toBeGreaterThan(0)
    expect(result.result).toBe("non_pass")
  })

  it("interrupts a hung active request and awaits cleanup", async () => {
    let cleaned = 0
    const result = await runLeanFeasibilityInjected(dependencies({
      execute: async () => new Promise(() => undefined),
      armDeadline: (expire) => { queueMicrotask(expire); return () => undefined },
      terminateActive: async () => { cleaned += 1; return { cleanupComplete: true, orphanedChild: false } },
    }))
    expect(cleaned).toBe(1)
    expect(result.counts.cancelled).toBe(1)
    expect(result.counts.unlaunched).toBe(23)
  })

  it("turns thrown execution plus failed cleanup into one invalid stop", async () => {
    let launched = 0
    const result = await runLeanFeasibilityInjected(dependencies({
      execute: async () => { launched += 1; throw new Error("fixture crash") },
      terminateActive: async () => { throw new Error("cleanup crash") },
    }))
    expect(launched).toBe(1)
    expect(result.result).toBe("invalid")
    expect(result.counts.unlaunched).toBe(23)
    expect(result.completeCleanup).toBe(false)
  })

  it("builds an exact canonical request for every cell", () => {
    const initialRoots = new Map<string, string>()
    for (const cell of buildLeanSchedule()) {
      const prepared = buildCanonicalLeanRequestV118(cell)
      const request = prepared.nestedRequest
      expect(prepared.request.contractVersion).toBe("runtime-execution-service-v1.18")
      expect(prepared.initialStateRoot).toMatch(/^sha256:/u)
      expect(prepared.request.semanticTuple.components.runtimeAbi).toBe("strategy-runtime-abi-v1.19")
      expect(request.limits).toEqual(expect.objectContaining({ timeoutMs: expect.any(Number) }))
      const previous = initialRoots.get(cell.baseCellId)
      if (previous === undefined) initialRoots.set(cell.baseCellId, prepared.initialStateRoot)
      else expect(prepared.initialStateRoot).toBe(previous)
      expect(request.match.arenaVariant.id).toBe(cell.arenaId)
      expect(request.match.initialInitiativePlayerId).toBe(`player:${cell.initiativeSide}`)
      const fixtureId = (side: "bottom" | "top") => {
        const metadata = request.strategies[side].metadata
        return metadata.starterLineage?.starterId ?? metadata.advancedLineage?.advancedId
      }
      expect(fixtureId("bottom")).toBe(cell.bottomFixtureId)
      expect(fixtureId("top")).toBe(cell.topFixtureId)
    }
    expect(LEAN_LIVE_SELECTOR).toBe("--run-reviewed-live-gate")
  })

  it("rejects direct child selection before executing any cell", () => {
    expect(() => execFileSync(process.execPath, ["--import", "tsx", "scripts/run-v1-38-lean-runner-feasibility.ts", "--execute-reviewed-cell"], { stdio: "pipe" })).toThrow()
  })

  it("strictly parses child results and rejects extra or malformed roots", () => {
    const cell = buildLeanSchedule()[0]!
    const value = { classification: "success", cleanupComplete: true, orphanedChild: false, boardRealism: true, integrityValid: true, requestRealismRoot: leanRequestRealismRoot(cell), currentFormationRoot: LEAN_CURRENT_FORMATION_ROOT, ...roots }
    expect(parseLeanExecutionResult(value)).toEqual(value)
    expect(() => parseLeanExecutionResult({ ...value, outcomeRoot: "bad" })).toThrow()
    expect(() => parseLeanExecutionResult({ ...value, privateDiagnostics: "secret" })).toThrow()
  })

  it("executes one actual prepared v1.18 fixture path", async () => {
    const result = await executePreparedLeanCell(buildLeanSchedule()[0]!)
    expect(result.classification).toBe("success")
    expect(result.outcomeRoot).toMatch(/^sha256:/u)
    expect(result.cleanupComplete).toBe(true)
    expect(result.orphanedChild).toBe(false)
  }, 50_000)

  it("durably creates an exclusive invocation marker and refuses reuse", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "lean-marker-")); temporary.push(dir)
    const marker = path.join(dir, "invocation.json")
    createExclusiveLeanInvocationMarker(marker, { ordinal: 1, authority: false })
    expect(JSON.parse(readFileSync(marker, "utf8"))).toEqual({ ordinal: 1, authority: false })
    expect(() => createExclusiveLeanInvocationMarker(marker, { ordinal: 1 })).toThrow(/LEAN_INVOCATION_EXISTS/u)
  })
})
