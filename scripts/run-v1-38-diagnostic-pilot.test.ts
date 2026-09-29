import { EventEmitter } from "node:events"
import { createHash } from "node:crypto"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { ChildProcess } from "node:child_process"
import { describe, expect, it, vi } from "vitest"
import { createDiagnosticPilotAllocation, createDiagnosticPilotCell, createDiagnosticPilotStart, type DiagnosticPilotLedger } from "../packages/strategy-lab/src/league/diagnostic-pilot.js"
import type { LabMatchExecution } from "../packages/strategy-lab/src/runtime-bridge.js"
import { labRoot } from "../packages/strategy-lab/src/contracts.js"
import {
  DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_MS,
  computeDiagnosticPilotDeadlines,
  canStartDiagnosticPilotCell,
  checkDiagnosticPilotGate,
  cleanupDiagnosticPilotContainers,
  runDiagnosticPilotWatchdog,
  retainDiagnosticPilotExecution,
  verifyRetainedDiagnosticPilotExecution,
  preflightDiagnosticPilot,
  type DiagnosticPilotSourceGate,
  diagnosticPilotSourceClosure,
  diagnosticPilotRequiredGateCommands,
} from "./run-v1-38-diagnostic-pilot.js"

describe("diagnostic pilot source-only watchdog and gate", () => {
  it("places a preemptive kill before both hard deadlines with independent cleanup reserve", () => {
    const schedule = computeDiagnosticPilotDeadlines({ overallStartedAt: 1000, cellStartedAt: 2000 })
    expect(schedule.cellHardAt).toBe(242_000)
    expect(schedule.overallHardAt).toBe(1_801_000)
    expect(schedule.killAt).toBeLessThan(schedule.cellHardAt)
    expect(schedule.cellHardAt - schedule.killAt).toBeGreaterThanOrEqual(DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_MS)
    expect(canStartDiagnosticPilotCell(1_801_000 - 240_000 - DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_MS + 1, 1000)).toBe(false)
  })

  it("rejects an absent or unreviewed source gate before any allocation read", () => {
    expect(() => checkDiagnosticPilotGate({ gatePath: "missing-gate.json", sourceFiles: {} })).toThrow()
  })

  it("preempts an inert child before the 240-second cell limit and publishes only after exact-owner cleanup", async () => {
    vi.useFakeTimers()
    try {
      const identity = "sha256:" + "a".repeat(64) as `sha256:${string}`
      const allocation = createDiagnosticPilotAllocation({ sourceClosureRoot: identity, implementationRoot: identity, gateRoot: identity })
      const cell = createDiagnosticPilotCell(allocation, 0)
      const child = Object.assign(new EventEmitter(), { pid: 4242, send: vi.fn() }) as unknown as ChildProcess
      let now = 1000
      const order: string[] = []
      const pending = runDiagnosticPilotWatchdog("injected-only", {
        now: () => now,
        spawnWorker: () => child,
        killGroup: () => { order.push("kill") },
        cleanup: async () => { order.push("cleanup"); return true },
        publishTimeout: async () => { order.push("terminal"); return "written" },
      })
      child.emit("message", { kind: "cell-request", allocation, cell })
      expect(child.send).toHaveBeenCalledWith({ kind: "cell-go", ordinal: 0 })
      now += 240_000 - DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_MS
      await vi.advanceTimersByTimeAsync(240_000 - DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_MS)
      expect(await pending).toBe("process_invalid")
      expect(order).toEqual(["kill", "cleanup", "terminal"])
    } finally { vi.useRealTimers() }
  })

  it("does not remove a foreign-label container", async () => {
    const identity = "sha256:" + "b".repeat(64) as `sha256:${string}`
    const allocation = createDiagnosticPilotAllocation({ sourceClosureRoot: identity, implementationRoot: identity, gateRoot: identity })
    const cell = createDiagnosticPilotCell(allocation, 0)
    const command = vi.fn(async (args: readonly string[]) => ({ status: 0, signal: null, error: false, stdout: "foreign-label\n", stderr: "" }))
    expect(await cleanupDiagnosticPilotContainers(allocation, cell, { command })).toBe(false)
    expect(command).toHaveBeenCalledTimes(1)
    expect(command.mock.calls[0]?.[0][0]).toBe("inspect")
  })

  it("preserves injected private accounting and transition bytes through bounded evidence chunks", () => {
    const identity = "sha256:" + "c".repeat(64) as `sha256:${string}`
    const allocation = createDiagnosticPilotAllocation({ sourceClosureRoot: identity, implementationRoot: identity, gateRoot: identity })
    const start = createDiagnosticPilotStart(allocation, createDiagnosticPilotCell(allocation, 0))
    const blobs = new Map<string, Uint8Array>()
    const ledger = {
      writeEvidence: (_startRoot: string, bytes: Uint8Array) => { const hash = `sha256:${createHash("sha256").update(bytes).digest("hex")}` as `sha256:${string}`; blobs.set(hash, bytes); return hash },
      readEvidence: (_startRoot: string, hash: string) => blobs.get(hash) ?? (() => { throw new Error("missing") })(),
    } as unknown as DiagnosticPilotLedger
    const execution = { kind: "completed", privacy: "private_offline", result: { state: { testOnly: true }, events: [] }, transitions: [{ event: "a".repeat(130_000) }, { event: "雪".repeat(1_000) }], accounting: [{ charged: true, testOnly: true }] } as unknown as LabMatchExecution
    expect(() => retainDiagnosticPilotExecution(ledger, start, execution)).toThrow(/EVIDENCE_ROW_CAP/u)
    const bounded = { ...execution, transitions: [{ event: "雪".repeat(2_000) }] } as unknown as LabMatchExecution
    const retained = retainDiagnosticPilotExecution(ledger, start, bounded)
    expect(verifyRetainedDiagnosticPilotExecution(ledger, start, retained.evidenceRoot)).toEqual({ transitionCount: 1, accountingCount: 1, artifactBytes: retained.artifactBytes, artifactRecords: retained.artifactRecords })
  })

  it("settles process-invalid if injected cleanup blocks beyond the reserved hard deadline", async () => {
    vi.useFakeTimers()
    try {
      const identity = "sha256:" + "d".repeat(64) as `sha256:${string}`
      const allocation = createDiagnosticPilotAllocation({ sourceClosureRoot: identity, implementationRoot: identity, gateRoot: identity })
      const cell = createDiagnosticPilotCell(allocation, 0)
      const child = Object.assign(new EventEmitter(), { pid: 4243, send: vi.fn() }) as unknown as ChildProcess
      let now = 1000
      const pending = runDiagnosticPilotWatchdog("injected-only", { now: () => now, spawnWorker: () => child, killGroup: () => undefined, cleanup: () => new Promise<boolean>(() => undefined), publishTimeout: async () => "uncertain" })
      child.emit("message", { kind: "cell-request", allocation, cell })
      now += 240_000
      await vi.advanceTimersByTimeAsync(240_000)
      expect(await pending).toBe("process_invalid")
    } finally { vi.useRealTimers() }
  })

  it("denies a charge on injected byte or inode shortfall before any provider path", () => {
    const gate = { readerCeilingMilliseconds: 44_055 } as DiagnosticPilotSourceGate
    const base = { historicalStoreIsDirectory: () => true, pilotStoreExists: () => false }
    expect(() => preflightDiagnosticPilot(gate, "fresh", { ...base, statfs: () => ({ bavail: 1n, bsize: 4096n, ffree: 1_000_000_000n }) })).toThrow(/CAPACITY/u)
    expect(() => preflightDiagnosticPilot(gate, "fresh", { ...base, statfs: () => ({ bavail: 1_000_000_000n, bsize: 4096n, ffree: 1n }) })).toThrow(/CAPACITY/u)
    expect(preflightDiagnosticPilot(gate, "fresh", { ...base, statfs: () => ({ bavail: 1_000_000_000n, bsize: 4096n, ffree: 1_000_000_000n }) }).consuming).toBe(false)
  })

  it("fails an injected evidence publication instead of minting a success root", () => {
    const identity = "sha256:" + "e".repeat(64) as `sha256:${string}`
    const allocation = createDiagnosticPilotAllocation({ sourceClosureRoot: identity, implementationRoot: identity, gateRoot: identity })
    const start = createDiagnosticPilotStart(allocation, createDiagnosticPilotCell(allocation, 0))
    const ledger = { writeEvidence: () => { throw new Error("injected blocked publication") }, readEvidence: () => new Uint8Array() } as unknown as DiagnosticPilotLedger
    const execution = { kind: "completed", privacy: "private_offline", result: { state: {}, events: [] }, transitions: [{ testOnly: true }], accounting: [] } as unknown as LabMatchExecution
    expect(() => retainDiagnosticPilotExecution(ledger, start, execution)).toThrow(/injected blocked publication/u)
  })

  it("rejects injected source, test, reviewer and exit-code drift from a rooted gate", () => {
    const directory = mkdtempSync(join(tmpdir(), "pilot-source-gate-test-"))
    try {
      const gatePath = join(directory, "gate.json")
      const sourceBytes: Record<string, Uint8Array> = {}
      const source = diagnosticPilotSourceClosure((path) => sourceBytes[path] = readFileSync(path))
      const reviewBytes = Buffer.from(`Reviewer: independent-test-reviewer\nAuthor: source-test-author\nSource closure: ${source.sourceClosureRoot}\nActionable findings: 0\n`)
      const fields = { schemaVersion: "diagnostic-pilot-source-gate-v1", sourceFiles: source.sourceFiles, sourceClosureRoot: source.sourceClosureRoot, reviewPath: ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-08-PILOT-SOURCE-REVIEW.md", reviewSha256: `sha256:${createHash("sha256").update(reviewBytes).digest("hex")}`, reviewerId: "independent-test-reviewer", authorId: "source-test-author", actionableFindings: 0, commands: diagnosticPilotRequiredGateCommands().map((command) => ({ command, exitCode: 0 })), readerSamplesMilliseconds: [13_803, 14_055, 13_908], readerCeilingMilliseconds: 44_055, capacityVersion: "diagnostic-pilot-capacity-v1", watchdogVersion: "diagnostic-pilot-watchdog-v1", empiricalAuthority: false } as const
      writeFileSync(gatePath, JSON.stringify({ ...fields, root: labRoot("diagnostic-pilot-source-gate-v1", fields) }))
      expect(checkDiagnosticPilotGate({ gatePath, sourceFiles: sourceBytes, reviewBytes }).sourceClosureRoot).toBe(source.sourceClosureRoot)
      const changed = { ...sourceBytes, [source.sourceFiles[0]!.path]: Buffer.from("mutated source") }
      expect(() => checkDiagnosticPilotGate({ gatePath, sourceFiles: changed, reviewBytes })).toThrow(/GATE_SOURCE_DRIFT/u)
      expect(() => checkDiagnosticPilotGate({ gatePath, sourceFiles: sourceBytes, reviewBytes: Buffer.from("fabricated review") })).toThrow(/GATE_REVIEW/u)
      writeFileSync(gatePath, JSON.stringify({ ...fields, commands: [{ command: fields.commands[0]!.command, exitCode: 1 }, ...fields.commands.slice(1)], root: labRoot("diagnostic-pilot-source-gate-v1", fields) }))
      expect(() => checkDiagnosticPilotGate({ gatePath, sourceFiles: sourceBytes, reviewBytes })).toThrow(/GATE_EVIDENCE/u)
    } finally { rmSync(directory, { recursive: true, force: true }) }
  })
})
