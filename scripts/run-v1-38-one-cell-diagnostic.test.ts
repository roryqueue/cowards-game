import { mkdtempSync, mkdirSync, realpathSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { labRoot, type LabRoot } from "../packages/strategy-lab/src/contracts.js"
import { DIAGNOSTIC_ONE_CELL_STORE, createDiagnosticOneCellAllocation, createDiagnosticOneCellCell, createDiagnosticOneCellStart, openDiagnosticOneCellLedger } from "../packages/strategy-lab/src/league/diagnostic-one-cell.js"
import {
  ONE_CELL_OPERATION_BUDGET,
  admitOneCellPreflightDisposition,
  canStartOneCell,
  createOneCellPreflightAttempt,
  createOneCellPreflightDisposition,
  requireAdmittedOneCellPreflight,
  runOneCellWorkerCell,
  verifyOneCellComponentBudget,
} from "./run-v1-38-one-cell-diagnostic.js"

const originalCwd = process.cwd(), roots: string[] = []
afterEach(() => { process.chdir(originalCwd); for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }) })
const hash = (value: string): LabRoot => labRoot("one-cell-cli-test", value)
const baseline = { oldAllocationV2: hash("old-v2"), oldAllocationUnversioned: hash("old-v1"), oldResult: hash("old-result"), oldLeagueTree: hash("old-league"), oldFactoryTree: hash("old-factory") }
const allocated = () => createDiagnosticOneCellAllocation({ sourceClosureRoot: hash("source"), implementationRoot: hash("implementation"), gateRoot: hash("gate"), oldEvidenceBaseline: baseline })
const store = () => { const root = realpathSync(mkdtempSync(join(tmpdir(), "one-cell-cli-test-"))); roots.push(root); mkdirSync(join(root, ".strategy-lab"), { mode: 0o700 }); mkdirSync(join(root, DIAGNOSTIC_ONE_CELL_STORE), { mode: 0o700 }); process.chdir(root); return openDiagnosticOneCellLedger(DIAGNOSTIC_ONE_CELL_STORE) }

describe("source-only one-cell v3 command contracts", () => {
  it("roots an exclusive preflight attempt and makes denial permanent", () => {
    const allocation = allocated(), attempt = createOneCellPreflightAttempt(allocation, hash("approval"))
    const denied = createOneCellPreflightDisposition(attempt, { status: "prestart_denied", observationRoot: hash("failed-observation") })
    expect(admitOneCellPreflightDisposition(attempt, denied)).toEqual(denied)
    expect(() => requireAdmittedOneCellPreflight(allocation, hash("approval"), attempt, denied)).toThrow()
    const admitted = createOneCellPreflightDisposition(attempt, { status: "admitted", observationRoot: hash("passed-observation") })
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
})
