import { existsSync, mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { EventEmitter } from "node:events"
import type { ChildProcess } from "node:child_process"
import { labRoot, type LabRoot } from "../packages/strategy-lab/src/contracts.js"
import { DIAGNOSTIC_ONE_CELL_STORE, DIAGNOSTIC_ONE_CELL_PREFLIGHT_ATTEMPT_PATH, DIAGNOSTIC_ONE_CELL_PREFLIGHT_DISPOSITION_PATH, createDiagnosticOneCellAllocation, createDiagnosticOneCellCell, createDiagnosticOneCellStart, openDiagnosticOneCellLedger } from "../packages/strategy-lab/src/league/diagnostic-one-cell.js"
import {
  ONE_CELL_OPERATION_BUDGET,
  admitOneCellPreflightDisposition,
  canStartOneCell,
  createOneCellPreflightAttempt,
  createOneCellPreflightDisposition,
  executeOneCellPreflightOnce,
  observeOneCellHost,
  requireAdmittedOneCellPreflight,
  runOneCellWorkerCell,
  runOneCellWatchdog,
  verifyOneCellComponentBudget,
} from "./run-v1-38-one-cell-diagnostic.js"

const originalCwd = process.cwd(), roots: string[] = []
afterEach(() => { process.chdir(originalCwd); for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }) })
const hash = (value: string): LabRoot => labRoot("one-cell-cli-test", value)
const baseline = { oldAllocationV2: hash("old-v2"), oldAllocationUnversioned: hash("old-v1"), oldResult: hash("old-result"), oldLeagueTree: hash("old-league"), oldFactoryTree: hash("old-factory") }
const allocated = () => createDiagnosticOneCellAllocation({ sourceClosureRoot: hash("source"), implementationRoot: hash("implementation"), gateRoot: hash("gate"), oldEvidenceBaseline: baseline })
const store = () => { const root = realpathSync(mkdtempSync(join(tmpdir(), "one-cell-cli-test-"))); roots.push(root); mkdirSync(join(root, ".strategy-lab"), { mode: 0o700 }); mkdirSync(join(root, DIAGNOSTIC_ONE_CELL_STORE), { mode: 0o700 }); process.chdir(root); return openDiagnosticOneCellLedger(DIAGNOSTIC_ONE_CELL_STORE) }

describe("source-only one-cell v3 command contracts", () => {
  it("durably consumes preflight before injected observation and denies a later recovery", async () => {
    store(); mkdirSync(".planning/artifacts", { recursive: true })
    const allocation = allocated(), approval = hash("approval")
    const result = await executeOneCellPreflightOnce(allocation, approval, async () => { expect(existsSync(DIAGNOSTIC_ONE_CELL_PREFLIGHT_ATTEMPT_PATH)).toBe(true); throw new Error("DIAGNOSTIC_ONE_CELL_CLI_MEMORY_CAPACITY") })
    expect(result.status).toBe("prestart_denied")
    expect(result.observation).toEqual({ denialCode: "memory" })
    expect(JSON.parse(readFileSync(DIAGNOSTIC_ONE_CELL_PREFLIGHT_DISPOSITION_PATH, "utf8"))).toEqual(result)
    let observedAgain = false
    await expect(executeOneCellPreflightOnce(allocation, approval, async () => { observedAgain = true; return {} as never })).rejects.toThrow()
    expect(observedAgain).toBe(false)
  })

  it("uses injected fresh host probes and admits inclusive 2500-bp memory only with all other gates", async () => {
    const allocation = allocated()
    const probe = { fileSystem: () => ({ bavail: 100_000_000_000n, bsize: 1n, ffree: 100_000_000n }), memory: () => ({ ok: true, basisPoints: 2500, availableBytes: 1_073_741_824 }), docker: async (args: readonly string[]) => args[0] === "info" ? { status: 0, stdout: "2|268435456\n", stderr: "", signal: null, error: false } : args[0] === "image" ? { status: 0, stdout: `${hash("image")}|amd64\n`, stderr: "", signal: null, error: false } : { status: 1, stdout: "", stderr: `Error: No such object: ${args[3]}\n`, signal: null, error: false }, readCandidates: () => 44_739 }
    expect((await observeOneCellHost(allocation, probe)).memoryBasisPoints).toBe(2500)
    await expect(observeOneCellHost(allocation, { ...probe, memory: () => ({ ok: true, basisPoints: 2499, availableBytes: 1_073_741_824 }) })).rejects.toThrow("MEMORY_CAPACITY")
  })
  it("roots an exclusive preflight attempt and makes denial permanent", () => {
    const allocation = allocated(), attempt = createOneCellPreflightAttempt(allocation, hash("approval"))
    const denied = createOneCellPreflightDisposition(attempt, { status: "prestart_denied", observation: { denialCode: "filesystem" } })
    expect(admitOneCellPreflightDisposition(attempt, denied)).toEqual(denied)
    expect(() => requireAdmittedOneCellPreflight(allocation, hash("approval"), attempt, denied)).toThrow()
    const admitted = createOneCellPreflightDisposition(attempt, { status: "admitted", observation: { fileSystemBytes: "99999999999", fileSystemInodes: "999999999", memoryBasisPoints: 2500, memoryAvailableBytes: 1073741824, dockerCpus: 2, dockerMemoryBytes: 268435456, imageDigest: hash("image"), architecture: "amd64", ownedNameCollisions: 0, readerMilliseconds: 1 } })
    expect(requireAdmittedOneCellPreflight(allocation, hash("approval"), attempt, admitted)).toEqual(admitted)
    expect(() => requireAdmittedOneCellPreflight(allocation, hash("wrong-approval"), attempt, admitted)).toThrow()
    expect(() => admitOneCellPreflightDisposition(attempt, { ...admitted, extra: "forgery" })).toThrow()
  })

  it("proves hard setup maxima leave the 240-second cell and 30-second reserve inside ten minutes", () => {
    expect(ONE_CELL_OPERATION_BUDGET.readerMilliseconds).toBe(44_739)
    expect(verifyOneCellComponentBudget(ONE_CELL_OPERATION_BUDGET)).toBeGreaterThan(0)
    expect(canStartOneCell(0, 0)).toBe(true)
    expect(canStartOneCell(330_001, 0)).toBe(false)
    expect(() => verifyOneCellComponentBudget({ ...ONE_CELL_OPERATION_BUDGET, sourceCheckMilliseconds: 600_000 })).toThrow()
  })

  it("turns an injected bottom-issuer failure into exactly one invalid terminal and completion signal", async () => {
    const allocation = allocated(), cell = createDiagnosticOneCellCell(allocation, 0), start = createDiagnosticOneCellStart(allocation, cell), ledger = store(), sent: unknown[] = []
    ledger.writeStart(start)
    const outcome = await runOneCellWorkerCell({ allocation, cell, start, ledger, now: () => 100, cellStartedAt: 0, issue: () => { throw new TypeError("DIAGNOSTIC_ONE_CELL_CLI_WORKER_CANDIDATE") }, execute: async () => { throw new Error("unreachable") }, close: () => true, cleanup: async () => true, send: (message) => { sent.push(message); return true } })
    expect(outcome).toBe("stop")
    expect(sent).toEqual([{ kind: "cell-complete", ordinal: 0 }, { kind: "done", status: "process_invalid" }])
    expect(ledger.readTerminal(start.root)).toMatchObject({ disposition: "system_failure", processValidity: "process_invalid", failureStage: "bottom_issuance", cause: "worker_candidate" })
  })

  it("does not retry or promote a durable terminal after lost completion IPC", async () => {
    const allocation = allocated(), cell = createDiagnosticOneCellCell(allocation, 0), start = createDiagnosticOneCellStart(allocation, cell), ledger = store(), sent: unknown[] = []
    ledger.writeStart(start)
    const outcome = await runOneCellWorkerCell({ allocation, cell, start, ledger, now: () => 100, cellStartedAt: 0, issue: (seat) => seat, execute: async (_bottom, _top, enteredKernel, enteredEvidence) => { enteredKernel(); enteredEvidence(); return { disposition: "system_failure", processValidity: "process_invalid", evidenceRoot: null, artifactBytes: 0, artifactRecords: 0, cleanupComplete: true } }, close: () => true, cleanup: async () => true, send: (message) => { sent.push(message); return false } })
    expect(outcome).toBe("stop")
    expect(sent).toEqual([{ kind: "cell-complete", ordinal: 0 }])
    expect(ledger.readTerminal(start.root)).toMatchObject({ processValidity: "process_invalid", code: "system_failure" })
  })

  it("requires one ordered worker completion and exit zero, denying lost or duplicate IPC", async () => {
    const allocation = allocated(), cell = createDiagnosticOneCellCell(allocation, 0), start = createDiagnosticOneCellStart(allocation, cell)
    const exercise = async (messages: readonly unknown[], exitCode = 0) => {
      const child = new EventEmitter() as ChildProcess
      Object.defineProperty(child, "pid", { value: 999_999 })
      child.send = (_message, callback) => { callback?.(null); return true }
      child.kill = () => { queueMicrotask(() => child.emit("exit", null)); return true }
      const outcome = runOneCellWatchdog(allocation, cell, start, 0, {
        now: () => 1,
        spawn: () => { queueMicrotask(() => { for (const message of messages) child.emit("message", message); child.emit("exit", exitCode) }); return child },
        cleanup: async () => true,
      })
      return outcome
    }
    const ready = { kind: "ready", ordinal: 0, startRoot: start.root }
    const started = { kind: "cell-started", ordinal: 0, startRoot: start.root }
    const complete = { kind: "cell-complete", ordinal: 0 }
    const done = { kind: "done", status: "process_valid" }
    expect((await exercise([ready, started, complete, done])).status).toBe("process_valid")
    expect((await exercise([ready, started, done])).status).toBe("process_invalid")
    expect((await exercise([ready, started, complete, complete, done])).status).toBe("process_invalid")
    expect((await exercise([started, complete, done])).status).toBe("process_invalid")
    expect((await exercise([ready, started, complete, done], 1)).status).toBe("process_invalid")
  })
})
