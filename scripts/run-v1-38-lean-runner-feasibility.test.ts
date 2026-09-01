import { execFileSync } from "node:child_process"
import { EventEmitter } from "node:events"
import { PassThrough } from "node:stream"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { buildLeanSchedule, hashLeanValue, LEAN_CURRENT_FORMATION_ROOT, LEAN_DEADLINE_MS, leanRequestRealismRoot } from "./lib/v1-38-lean-runner-feasibility.js"
import {
  LEAN_CORRECTIVE_RECOVERY_ONLY_SELECTOR,
  LEAN_CORRECTIVE_SELECTOR,
  LEAN_CELL_DEADLINE_MS,
  LEAN_CLEANUP_DEADLINE_MS,
  LEAN_LIVE_SELECTOR,
  buildCanonicalLeanRequestV118,
  createSupervisedLeanExecutionDependencies,
  createExclusiveLeanInvocationMarker,
  executePreparedLeanCell,
  parseLeanExecutionResult,
  runLeanFeasibilityInjected,
  runLeanCorrectiveRecoveryOnlyInjected,
  runLeanCorrectiveWrapperInjected,
  type LeanExecutionDependencies,
} from "./run-v1-38-lean-runner-feasibility.js"
import * as leanRunnerModule from "./run-v1-38-lean-runner-feasibility.js"

const roots = { outcomeRoot: hashLeanValue("outcome"), finalStateRoot: hashLeanValue("state"), transitionEventRoot: hashLeanValue("events"), runtimeAccountingRoot: hashLeanValue("accounting") }
const temporary: string[] = []
afterEach(() => temporary.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true })))

const dependencies = (mutate?: Partial<LeanExecutionDependencies>): LeanExecutionDependencies => ({
  now: (() => { let value = 0; return () => ++value })(),
  execute: async (cell) => ({ classification: "success", cleanupComplete: true, orphanedChild: false, boardRealism: true, integrityValid: true, requestRealismRoot: leanRequestRealismRoot(cell), currentFormationRoot: LEAN_CURRENT_FORMATION_ROOT, ...roots }),
  terminateActive: async () => ({ cleanupComplete: true, orphanedChild: false }),
  ...mutate,
})

class FakeLeanChild extends EventEmitter {
  exitCode: number | null = null
  signalCode: NodeJS.Signals | null = null
  pid: number | undefined
  stderr = new PassThrough()
  sent: unknown[] = []
  killCalls = 0
  send(message: unknown): boolean { this.sent.push(message); return true }
  kill(): boolean { this.killCalls += 1; return true }
  cleanExit(): void { this.exitCode = 0; this.emit("exit", 0, null) }
  killedExit(): void { this.signalCode = "SIGKILL"; this.emit("exit", null, "SIGKILL") }
}

const childResult = (cell = buildLeanSchedule()[0]!) => ({
  classification: "success" as const,
  cleanupComplete: true,
  orphanedChild: false,
  boardRealism: true,
  integrityValid: true,
  requestRealismRoot: leanRequestRealismRoot(cell),
  currentFormationRoot: LEAN_CURRENT_FORMATION_ROOT,
  ...roots,
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

  it("keeps a successful child active until the same child exits cleanly", async () => {
    const child = new FakeLeanChild()
    const deps = createSupervisedLeanExecutionDependencies("a".repeat(64), {
      spawnChild: () => child as never,
      cellDeadlineMilliseconds: 500,
      cleanupDeadlineMilliseconds: 50,
    })
    const cell = buildLeanSchedule()[0]!
    let settled = false
    const execution = deps.execute(cell, new AbortController().signal).finally(() => { settled = true })
    child.emit("message", { kind: "ready", capability: "a".repeat(64) })
    child.emit("message", { kind: "result", capability: "a".repeat(64), result: childResult(cell) })
    await Promise.resolve()
    expect(settled).toBe(false)
    await expect(deps.execute(buildLeanSchedule()[1]!, new AbortController().signal)).rejects.toThrow(/LEAN_CHILD_ALREADY_ACTIVE/u)
    child.cleanExit()
    await expect(execution).resolves.toEqual(childResult(cell))
  })

  it("fails closed when success IPC is followed by a nonzero exit", async () => {
    const child = new FakeLeanChild()
    const deps = createSupervisedLeanExecutionDependencies("b".repeat(64), {
      spawnChild: () => child as never,
      cellDeadlineMilliseconds: 500,
      cleanupDeadlineMilliseconds: 50,
    })
    const cell = buildLeanSchedule()[0]!
    const execution = deps.execute(cell, new AbortController().signal)
    child.emit("message", { kind: "ready", capability: "b".repeat(64) })
    child.emit("message", { kind: "result", capability: "b".repeat(64), result: childResult(cell) })
    child.exitCode = 7
    child.emit("exit", 7, null)
    await expect(execution).rejects.toThrow(/LEAN_CHILD_FAILED/u)
  })

  it("uses one bounded termination barrier for abort and refuses an unproved exit", async () => {
    const child = new FakeLeanChild()
    const deps = createSupervisedLeanExecutionDependencies("c".repeat(64), {
      spawnChild: () => child as never,
      cellDeadlineMilliseconds: 500,
      cleanupDeadlineMilliseconds: 5,
    })
    const controller = new AbortController()
    const execution = deps.execute(buildLeanSchedule()[0]!, controller.signal)
    controller.abort()
    await expect(execution).resolves.toEqual(expect.objectContaining({
      classification: "cancelled", cleanupComplete: false, orphanedChild: true,
    }))
    expect(child.killCalls).toBe(1)
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
      expect(request.match.arenaVariant.id).toBe(cell.executionArenaId)
      expect(request.match.arenaVariant.name).toBe(cell.executionArenaLabel)
      expect(request.match.initialInitiativePlayerId).toBe(`player:${cell.initiativeSide}`)
      const fixtureId = (side: "bottom" | "top") => {
        const metadata = request.strategies[side].metadata
        return metadata.starterLineage?.starterId ?? metadata.advancedLineage?.advancedId
      }
      expect(fixtureId("bottom")).toBe(cell.bottomFixtureId)
      expect(fixtureId("top")).toBe(cell.topFixtureId)
    }
    expect(LEAN_LIVE_SELECTOR).toBe("--run-reviewed-live-gate")
    expect(LEAN_CORRECTIVE_SELECTOR).toBe("--run-reviewed-corrective-gate")
    expect(LEAN_CORRECTIVE_RECOVERY_ONLY_SELECTOR).toBe("--recover-reviewed-corrective-interruption")
  }, 30_000)

  it("uses a test-only fixture budget without changing production deadlines", () => {
    expect(LEAN_DEADLINE_MS).toBe(15 * 60 * 1_000)
    expect(LEAN_CELL_DEADLINE_MS).toBe(45_000)
    expect(LEAN_CLEANUP_DEADLINE_MS).toBe(2_000)
    const source = readFileSync("scripts/run-v1-38-lean-runner-feasibility.test.ts", "utf8")
    const start = source.indexOf('it("builds an exact canonical request for every cell"')
    const end = source.indexOf('it("uses a test-only fixture budget', start)
    expect(source.slice(start, end)).toMatch(/\}, 30_000\)\s*$/u)
  })

  it("always recovers and postchecks the normal corrective wrapper", async () => {
    const calls: string[] = []
    await expect(runLeanCorrectiveWrapperInjected({
      invoke: async () => { calls.push("invoke"); throw new Error("interrupted") },
      recover: async () => { calls.push("recover") },
      postcheck: async () => { calls.push("postcheck") },
    })).rejects.toThrow("interrupted")
    expect(calls).toEqual(["invoke", "recover", "postcheck"])
  })

  it("checks corrective admission immediately before invoke", async () => {
    const calls: string[] = []
    await runLeanCorrectiveWrapperInjected({
      preflight: async () => { calls.push("preflight") },
      invoke: async () => { calls.push("invoke") },
      recover: async () => { calls.push("recover") },
      postcheck: async () => { calls.push("postcheck") },
    })
    expect(calls).toEqual(["preflight", "invoke", "recover", "postcheck"])
    await expect(runLeanCorrectiveWrapperInjected({
      preflight: async () => { throw new TypeError("LEAN_CORRECTIVE_TERMINAL_EXISTS") },
      invoke: async () => { calls.push("forbidden-invoke") },
      recover: async () => { calls.push("forbidden-recover") },
      postcheck: async () => { calls.push("forbidden-postcheck") },
    })).rejects.toThrow(/LEAN_CORRECTIVE_TERMINAL_EXISTS/u)
    expect(calls).not.toContain("forbidden-invoke")
  })

  it("recovery-only accepts only marker-present terminal-absent and launches nothing", async () => {
    const calls: string[] = []
    await runLeanCorrectiveRecoveryOnlyInjected({
      markerPresent: true,
      terminalPresent: false,
      cleanup: async () => { calls.push("cleanup") },
      terminalizeInvalid: async () => { calls.push("terminalize") },
      postcheck: async () => { calls.push("postcheck") },
    })
    expect(calls).toEqual(["cleanup", "terminalize", "postcheck"])
    await expect(runLeanCorrectiveRecoveryOnlyInjected({
      markerPresent: false, terminalPresent: false,
      cleanup: async () => undefined, terminalizeInvalid: async () => undefined, postcheck: async () => undefined,
    })).rejects.toThrow(/LEAN_CORRECTIVE_MARKER_REQUIRED/u)
    await expect(runLeanCorrectiveRecoveryOnlyInjected({
      markerPresent: true, terminalPresent: true,
      cleanup: async () => undefined, terminalizeInvalid: async () => undefined, postcheck: async () => undefined,
    })).rejects.toThrow(/LEAN_CORRECTIVE_TERMINAL_EXISTS/u)
  })

  it("durably records child ownership before corrective admission and clears it after exit", async () => {
    const child = new FakeLeanChild()
    child.pid = 4312
    const calls: string[] = []
    const token = "f".repeat(64)
    const deps = createSupervisedLeanExecutionDependencies("c".repeat(64), {
      spawnChild: () => child as never,
      correctiveOwnership: {
        token,
        persist: (pid, processGroupId, actualToken) => { calls.push(`persist:${pid}:${processGroupId}:${actualToken}`) },
        clear: (actualToken) => { calls.push(`clear:${actualToken}`) },
      },
    })
    const cell = buildLeanSchedule()[0]!
    const execution = deps.execute(cell, new AbortController().signal)
    child.emit("message", { kind: "ownership-ready", token })
    expect(calls).toEqual([`persist:4312:4312:${token}`])
    expect(child.sent).toEqual([{ kind: "admit", token }])
    child.emit("message", { kind: "ready", capability: "c".repeat(64) })
    child.emit("message", { kind: "result", capability: "c".repeat(64), result: childResult(cell) })
    child.cleanExit()
    await expect(execution).resolves.toMatchObject({ classification: "success" })
    expect(calls).toEqual([`persist:4312:4312:${token}`, `clear:${token}`])
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

  it("records a prepared system failure without attaching semantic-only roots", () => {
    const finalize = (leanRunnerModule as unknown as {
      finalizePreparedLeanProjection: (projection: unknown, requestRealismRoot: string) => unknown
    }).finalizePreparedLeanProjection
    expect(() => finalize({ classification: "system_failure" }, leanRequestRealismRoot(buildLeanSchedule()[0]!))).not.toThrow()
    expect(finalize({ classification: "system_failure" }, leanRequestRealismRoot(buildLeanSchedule()[0]!))).toEqual({
      classification: "system_failure",
      cleanupComplete: true,
      orphanedChild: false,
      boardRealism: true,
      integrityValid: true,
    })
  })

  it.each([
    ["primitive", "invalid"],
    ["extra ready key", { kind: "ready", capability: "d".repeat(64), extra: true }],
  ])("rejects a %s IPC envelope even if valid output follows", async (_label, invalidMessage) => {
    const child = new FakeLeanChild()
    const deps = createSupervisedLeanExecutionDependencies("d".repeat(64), {
      spawnChild: () => child as never,
      cellDeadlineMilliseconds: 500,
      cleanupDeadlineMilliseconds: 50,
    })
    const cell = buildLeanSchedule()[0]!
    const execution = deps.execute(cell, new AbortController().signal)
    child.emit("message", invalidMessage)
    child.emit("message", { kind: "ready", capability: "d".repeat(64) })
    child.emit("message", { kind: "result", capability: "d".repeat(64), result: childResult(cell) })
    child.cleanExit()
    expect(child.sent).toEqual([])
    await expect(execution).rejects.toThrow(/LEAN_CHILD_PROTOCOL_INVALID/u)
  })

  it("rejects a result IPC envelope with extra keys", async () => {
    const child = new FakeLeanChild()
    const deps = createSupervisedLeanExecutionDependencies("e".repeat(64), {
      spawnChild: () => child as never,
      cellDeadlineMilliseconds: 500,
      cleanupDeadlineMilliseconds: 50,
    })
    const cell = buildLeanSchedule()[0]!
    const execution = deps.execute(cell, new AbortController().signal)
    child.emit("message", { kind: "ready", capability: "e".repeat(64) })
    child.emit("message", { kind: "result", capability: "e".repeat(64), result: childResult(cell), extra: true })
    child.cleanExit()
    await expect(execution).rejects.toThrow(/LEAN_CHILD_PROTOCOL_INVALID/u)
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
