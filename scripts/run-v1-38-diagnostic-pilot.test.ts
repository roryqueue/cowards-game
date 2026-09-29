import { EventEmitter, once } from "node:events"
import { createHash } from "node:crypto"
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { spawn, type ChildProcess } from "node:child_process"
import { describe, expect, it, vi } from "vitest"
import { DIAGNOSTIC_PILOT_STORE, createDiagnosticPilotAllocation, createDiagnosticPilotCell, createDiagnosticPilotStart, createDiagnosticPilotTerminal, createDiagnosticPilotLifetimeGrant, diagnosticPilotContainerIdentity, openDiagnosticPilotLedger, type DiagnosticPilotLedger } from "../packages/strategy-lab/src/league/diagnostic-pilot.js"
import type { LabMatchExecution } from "../packages/strategy-lab/src/runtime-bridge.js"
import { labRoot } from "../packages/strategy-lab/src/contracts.js"
const testBaseline = Object.fromEntries(["oldAllocationV2", "oldAllocationUnversioned", "oldResult", "oldLeagueTree", "oldFactoryTree"].map((key) => [key, labRoot("pilot-test-old-baseline", key)])) as { oldAllocationV2: `sha256:${string}`; oldAllocationUnversioned: `sha256:${string}`; oldResult: `sha256:${string}`; oldLeagueTree: `sha256:${string}`; oldFactoryTree: `sha256:${string}` }
import { admitFactorySupervisorLifetime } from "./lib/v1-38-factory-supervised-runtime.js"
import { admitPlannerSupervisorLifetime } from "./lib/v1-38-planner-supervised-runtime.js"
import {
  DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_MS,
  computeDiagnosticPilotDeadlines,
  canStartDiagnosticPilotCell,
  checkDiagnosticPilotGate,
  cleanupDiagnosticPilotContainers,
  verifyDiagnosticPilotContainersAbsent,
  runDiagnosticPilotWatchdog,
  retainDiagnosticPilotExecution,
  retainDiagnosticPilotPartialEvidence,
  verifyRetainedDiagnosticPilotExecution,
  verifyRetainedDiagnosticPilotPartialEvidence,
  preflightDiagnosticPilot,
  createDiagnosticPilotAttemptMarker,
  classifyDiagnosticPilotAttemptMarker,
  reserveDiagnosticPilotAttempt,
  createDiagnosticPilotResult,
  hashDiagnosticPilotOldTree,
  parseDiagnosticPilotTimeoutPayload,
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
      const allocation = createDiagnosticPilotAllocation({ sourceClosureRoot: identity, implementationRoot: identity, gateRoot: identity, oldEvidenceBaseline: testBaseline })
      const cell = createDiagnosticPilotCell(allocation, 0)
      const child = Object.assign(new EventEmitter(), { pid: 4242, send: vi.fn() }) as unknown as ChildProcess
      let now = 1000
      const order: string[] = []
      const pending = runDiagnosticPilotWatchdog("injected-only", {
        now: () => now,
        spawnWorker: () => child,
        killGroup: () => { order.push("kill") },
        cleanup: async () => { order.push("cleanup"); return true },
        publishTimeout: async (chargedAllocation, chargedCell, code, elapsedMilliseconds) => { expect(parseDiagnosticPilotTimeoutPayload({ allocation: chargedAllocation, cell: chargedCell, code, elapsedMilliseconds })).toMatchObject({ code: "cell_deadline", elapsedMilliseconds: 240_000 - DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_MS }); order.push("terminal"); return "written" },
      })
      child.emit("message", { kind: "cell-request", allocation, cell })
      expect(child.send).toHaveBeenCalledWith(expect.objectContaining({ kind: "cell-go", ordinal: 0, allocationRoot: allocation.root, cellRoot: cell.root, startRoot: createDiagnosticPilotStart(allocation, cell).root }))
      now += 240_000 - DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_MS
      await vi.advanceTimersByTimeAsync(240_000 - DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_MS)
      expect(await pending).toBe("process_invalid")
      expect(order).toEqual(["kill", "cleanup", "terminal"])
    } finally { vi.useRealTimers() }
  })

  it("kills a real separately blocked Node child at the injected preemptive deadline", async () => {
    vi.useFakeTimers()
    let child: ChildProcess | null = null
    try {
      const identity = labRoot("pilot-os-preemption", "source")
      const allocation = createDiagnosticPilotAllocation({ sourceClosureRoot: identity, implementationRoot: identity, gateRoot: identity, oldEvidenceBaseline: testBaseline })
      const cell = createDiagnosticPilotCell(allocation, 0)
      let now = 1_000
      const pending = runDiagnosticPilotWatchdog("injected-only", {
        now: () => now,
        spawnWorker: () => {
          child = spawn(process.execPath, ["-e", "process.send({kind:'cell-request', allocation:JSON.parse(process.env.TEST_ALLOCATION), cell:JSON.parse(process.env.TEST_CELL)}); Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,60000)"], { detached: true, stdio: ["ignore", "ignore", "ignore", "ipc"], env: { TEST_ALLOCATION: JSON.stringify(allocation), TEST_CELL: JSON.stringify(cell) } })
          return child
        },
        killGroup: (target) => { if (target.pid) process.kill(-target.pid, "SIGKILL") },
        cleanup: async () => true,
        publishTimeout: async () => "written",
      })
      const blocked = child as ChildProcess | null
      if (!blocked) throw new Error("child absent")
      await once(blocked, "message")
      const exited = once(blocked, "exit")
      now += 240_000 - DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_MS
      await vi.advanceTimersByTimeAsync(240_000 - DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_MS)
      expect(await pending).toBe("process_invalid")
      await exited
      expect(blocked.signalCode).toBe("SIGKILL")
    } finally { const running = child as ChildProcess | null; if (running?.pid && running.exitCode === null) { try { process.kill(-running.pid, "SIGKILL") } catch { /* already exited */ } }; vi.useRealTimers() }
  }, 10_000)

  it("reconciles an abnormal duplicate IPC request while a cell is active", async () => {
    const identity = labRoot("pilot-abnormal-ipc", "source")
    const allocation = createDiagnosticPilotAllocation({ sourceClosureRoot: identity, implementationRoot: identity, gateRoot: identity, oldEvidenceBaseline: testBaseline })
    const cell = createDiagnosticPilotCell(allocation, 0)
    const child = Object.assign(new EventEmitter(), { pid: 4244, send: vi.fn() }) as unknown as ChildProcess
    const order: string[] = []
    const pending = runDiagnosticPilotWatchdog("injected-only", { now: () => 1_000, spawnWorker: () => child, killGroup: () => { order.push("kill") }, cleanup: async () => { order.push("cleanup"); return true }, publishTimeout: async (_a, _c, code) => { expect(code).toBe("publication_uncertain"); order.push("terminal"); return "written" } })
    child.emit("message", { kind: "cell-request", allocation, cell })
    child.emit("message", { kind: "cell-request", allocation, cell })
    expect(await pending).toBe("process_invalid")
    expect(order).toEqual(["kill", "cleanup", "terminal"])
  })

  it("does not remove a foreign-label container", async () => {
    const identity = "sha256:" + "b".repeat(64) as `sha256:${string}`
    const allocation = createDiagnosticPilotAllocation({ sourceClosureRoot: identity, implementationRoot: identity, gateRoot: identity, oldEvidenceBaseline: testBaseline })
    const cell = createDiagnosticPilotCell(allocation, 0)
    const command = vi.fn(async (args: readonly string[]) => ({ status: 0, signal: null, error: false, stdout: "foreign-label\n", stderr: "" }))
    expect(await cleanupDiagnosticPilotContainers(allocation, cell, { command })).toBe(false)
    expect(command).toHaveBeenCalledTimes(1)
    expect(command.mock.calls[0]?.[0][0]).toBe("inspect")
  })

  it("requires all eight exact pilot container names absent without mutating Docker", async () => {
    const identity = labRoot("pilot-container-absence", "source")
    const allocation = createDiagnosticPilotAllocation({ sourceClosureRoot: identity, implementationRoot: identity, gateRoot: identity, oldEvidenceBaseline: testBaseline })
    const names: string[] = []
    const docker = { command: async (args: readonly string[]) => { names.push(args[3]!); return { status: 1, signal: null, error: false, stdout: "", stderr: `Error: No such object: ${args[3]}\n` } } }
    expect(await verifyDiagnosticPilotContainersAbsent(allocation, docker)).toBe(true)
    expect(names).toHaveLength(8)
    expect(new Set(names).size).toBe(8)
    expect(names.every((name) => name.startsWith("cg-v138-pilot-"))).toBe(true)
  })

  it("preserves injected private accounting and transition bytes through bounded evidence chunks", () => {
    const identity = "sha256:" + "c".repeat(64) as `sha256:${string}`
    const allocation = createDiagnosticPilotAllocation({ sourceClosureRoot: identity, implementationRoot: identity, gateRoot: identity, oldEvidenceBaseline: testBaseline })
    const start = createDiagnosticPilotStart(allocation, createDiagnosticPilotCell(allocation, 0))
    const blobs = new Map<string, Uint8Array>()
    const ledger = {
      writeEvidence: (_startRoot: string, bytes: Uint8Array) => { const hash = `sha256:${createHash("sha256").update(bytes).digest("hex")}` as `sha256:${string}`; blobs.set(hash, bytes); return hash },
      readEvidence: (_startRoot: string, hash: string) => blobs.get(hash) ?? (() => { throw new Error("missing") })(),
      listNames: () => [...blobs.keys()].map((hash) => `diagnostic-pilot-${start.root.slice(7)}.evidence-${hash.slice(7)}.bin`).sort(),
    } as unknown as DiagnosticPilotLedger
    const execution = { kind: "completed", privacy: "private_offline", result: { state: { testOnly: true }, events: [] }, transitions: [{ event: "a".repeat(130_000) }, { event: "雪".repeat(1_000) }], accounting: [{ charged: true, outputBytes: 0, result: { ok: true }, testOnly: true }] } as unknown as LabMatchExecution
    expect(() => retainDiagnosticPilotExecution(ledger, start, execution)).toThrow(/EVIDENCE_ROW_CAP/u)
    const bounded = { ...execution, transitions: [{ event: "雪".repeat(2_000) }] } as unknown as LabMatchExecution
    const retained = retainDiagnosticPilotExecution(ledger, start, bounded)
    expect(verifyRetainedDiagnosticPilotExecution(ledger, start, retained.evidenceRoot)).toEqual({ transitionCount: 1, accountingCount: 1, outputBytes: 0, disposition: "success", artifactBytes: retained.artifactBytes, artifactRecords: retained.artifactRecords })
    const tooLargeFailure = { kind: "failure", privacy: "private_offline", transitions: [], accounting: [], unchangedState: { injected: "x".repeat(262_144) }, failure: { classification: "system_failure", code: "TEST_ONLY" } } as unknown as LabMatchExecution
    expect(() => retainDiagnosticPilotExecution(ledger, start, tooLargeFailure)).toThrow(/EVIDENCE_OUTCOME_CAP/u)
  })

  it("counts deduplicated physical chunks and roots all unordered surviving fragments", () => {
    const identity = labRoot("pilot-physical-evidence", "source")
    const allocation = createDiagnosticPilotAllocation({ sourceClosureRoot: identity, implementationRoot: identity, gateRoot: identity, oldEvidenceBaseline: testBaseline })
    const start = createDiagnosticPilotStart(allocation, createDiagnosticPilotCell(allocation, 0))
    const blobs = new Map<string, Uint8Array>()
    const ledger = {
      writeEvidence: (_startRoot: string, bytes: Uint8Array) => { const hash = `sha256:${createHash("sha256").update(bytes).digest("hex")}` as `sha256:${string}`; blobs.set(hash, bytes); return hash },
      readEvidence: (_startRoot: string, hash: string) => blobs.get(hash) ?? (() => { throw new Error("missing") })(),
      listNames: () => [...blobs.keys()].map((hash) => `diagnostic-pilot-${start.root.slice(7)}.evidence-${hash.slice(7)}.bin`).sort(),
    } as unknown as DiagnosticPilotLedger
    const lineOverhead = Buffer.byteLength(JSON.stringify({ event: "" }) + "\n")
    const row = { event: "x".repeat(1_024 - lineOverhead) }
    const execution = { kind: "completed", privacy: "private_offline", result: { state: { retained: true }, events: [] }, transitions: Array(256).fill(row), accounting: [] } as unknown as LabMatchExecution
    const retained = retainDiagnosticPilotExecution(ledger, start, execution)
    expect(verifyRetainedDiagnosticPilotExecution(ledger, start, retained.evidenceRoot).artifactRecords).toBe(retained.artifactRecords)
    expect(blobs.size).toBe(retained.artifactRecords)
    const partial = retainDiagnosticPilotPartialEvidence(ledger, start)
    expect(partial.evidenceRoot).not.toBeNull()
    expect(verifyRetainedDiagnosticPilotPartialEvidence(ledger, start, partial.evidenceRoot!).artifactRecords).toBe(partial.artifactRecords)
    const stray = Buffer.from("orphan fragment")
    ledger.writeEvidence!(start.root, stray)
    expect(() => verifyRetainedDiagnosticPilotPartialEvidence(ledger, start, partial.evidenceRoot!)).toThrow(/PARTIAL_EVIDENCE_ORPHAN/u)
  })

  it("reserves a disposable one-shot attempt marker and rejects symlinked old tree input", () => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "pilot-attempt-test-")))
    try {
      const identity = labRoot("pilot-attempt", "source")
      const allocation = createDiagnosticPilotAllocation({ sourceClosureRoot: identity, implementationRoot: identity, gateRoot: identity, oldEvidenceBaseline: testBaseline })
      const path = join(directory, "attempt.json")
      reserveDiagnosticPilotAttempt(path, allocation)
      expect(JSON.parse(readFileSync(path, "utf8"))).toEqual(createDiagnosticPilotAttemptMarker(allocation))
      expect(classifyDiagnosticPilotAttemptMarker(path, allocation)).toEqual({ status: "attempted_uncertain", processValidity: "process_invalid" })
      expect(() => reserveDiagnosticPilotAttempt(path, allocation)).toThrow()
      expect(createDiagnosticPilotResult(allocation, null, 5, "safe_no_start").status).toBe("prestart_denied")
      writeFileSync(join(directory, "file"), "historical")
      symlinkSync(join(directory, "file"), join(directory, "link"))
      expect(() => hashDiagnosticPilotOldTree(directory)).toThrow(/OLD_TREE_LINK/u)
    } finally { rmSync(directory, { recursive: true, force: true }) }
  })

  it("classifies a complete retained system-failure Match as a diagnostic prefix, not unordered fragments", () => {
    const originalCwd = process.cwd(), directory = realpathSync(mkdtempSync(join(tmpdir(), "pilot-result-test-")))
    try {
      mkdirSync(join(directory, ".strategy-lab"), { mode: 0o700 })
      mkdirSync(join(directory, DIAGNOSTIC_PILOT_STORE), { mode: 0o700 })
      process.chdir(directory)
      const identity = labRoot("pilot-failure-result", "source")
      const allocation = createDiagnosticPilotAllocation({ sourceClosureRoot: identity, implementationRoot: identity, gateRoot: identity, oldEvidenceBaseline: testBaseline })
      const start = createDiagnosticPilotStart(allocation, createDiagnosticPilotCell(allocation, 0)), ledger = openDiagnosticPilotLedger(DIAGNOSTIC_PILOT_STORE)
      ledger.writeStart(start)
      const execution = { kind: "failure", privacy: "private_offline", transitions: [], unchangedState: null, failure: { classification: "system_failure", code: "TEST_ONLY" }, accounting: [] } as unknown as LabMatchExecution
      const evidence = retainDiagnosticPilotExecution(ledger, start, execution)
      ledger.writeTerminal(createDiagnosticPilotTerminal(start, { disposition: "system_failure", processValidity: "process_invalid", evidenceRoot: evidence.evidenceRoot, cleanupComplete: true, elapsedMilliseconds: 10, artifactBytes: evidence.artifactBytes, artifactRecords: evidence.artifactRecords, code: "system_failure" }))
      const result = createDiagnosticPilotResult(allocation, ledger, 20, "process_invalid")
      expect(result.status).toBe("diagnostic_prefix")
      expect(result.processValidity).toBe("process_invalid")
      expect(result.slots[0]?.evidenceKind).toBe("complete")
      expect(result.slots[0]?.invocationRecords).toBe(0)
      expect(result.slots.slice(1).every((slot) => slot.status === "unused")).toBe(true)
    } finally { process.chdir(originalCwd); rmSync(directory, { recursive: true, force: true }) }
  })

  it("settles process-invalid if injected cleanup blocks beyond the reserved hard deadline", async () => {
    vi.useFakeTimers()
    try {
      const identity = "sha256:" + "d".repeat(64) as `sha256:${string}`
      const allocation = createDiagnosticPilotAllocation({ sourceClosureRoot: identity, implementationRoot: identity, gateRoot: identity, oldEvidenceBaseline: testBaseline })
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
    const allocation = createDiagnosticPilotAllocation({ sourceClosureRoot: identity, implementationRoot: identity, gateRoot: identity, oldEvidenceBaseline: testBaseline })
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
      const fields = { schemaVersion: "diagnostic-pilot-source-gate-v1", sourceFiles: source.sourceFiles, sourceClosureRoot: source.sourceClosureRoot, reviewPath: ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-08-PILOT-SOURCE-REVIEW.md", reviewSha256: `sha256:${createHash("sha256").update(reviewBytes).digest("hex")}`, reviewerId: "independent-test-reviewer", authorId: "source-test-author", actionableFindings: 0, commands: diagnosticPilotRequiredGateCommands().map((command) => ({ command, exitCode: 0 })), readerSamplesMilliseconds: [13_803, 14_055, 13_908], readerCeilingMilliseconds: 44_055, capacityVersion: "diagnostic-pilot-capacity-v1", watchdogVersion: "diagnostic-pilot-watchdog-v1", empiricalAuthority: false, signatureBase64: Buffer.alloc(64).toString("base64") } as const
      writeFileSync(gatePath, JSON.stringify({ ...fields, root: labRoot("diagnostic-pilot-source-gate-v1", fields) }))
      expect(() => checkDiagnosticPilotGate({ gatePath, sourceFiles: sourceBytes, reviewBytes })).toThrow(/GATE_REVIEWER_SIGNATURE/u)
      const changed = { ...sourceBytes, [source.sourceFiles[0]!.path]: Buffer.from("mutated source") }
      expect(() => checkDiagnosticPilotGate({ gatePath, sourceFiles: changed, reviewBytes })).toThrow(/GATE_SOURCE_DRIFT/u)
      expect(() => checkDiagnosticPilotGate({ gatePath, sourceFiles: sourceBytes, reviewBytes: Buffer.from("fabricated review") })).toThrow(/GATE_REVIEW/u)
      writeFileSync(gatePath, JSON.stringify({ ...fields, commands: [{ command: fields.commands[0]!.command, exitCode: 1 }, ...fields.commands.slice(1)], root: labRoot("diagnostic-pilot-source-gate-v1", fields) }))
      expect(() => checkDiagnosticPilotGate({ gatePath, sourceFiles: sourceBytes, reviewBytes })).toThrow(/GATE_EVIDENCE/u)
    } finally { rmSync(directory, { recursive: true, force: true }) }
  })

  it("keeps ordinary 120-second lifetime and admits at most 240 seconds through both private pilot gates", () => {
    const originalCwd = process.cwd(), directory = realpathSync(mkdtempSync(join(tmpdir(), "pilot-lifetime-test-")))
    try {
      mkdirSync(join(directory, ".strategy-lab"), { mode: 0o700 })
      mkdirSync(join(directory, DIAGNOSTIC_PILOT_STORE), { mode: 0o700 })
      process.chdir(directory)
      const identity = "sha256:" + "f".repeat(64) as `sha256:${string}`
      const allocation = createDiagnosticPilotAllocation({ sourceClosureRoot: identity, implementationRoot: identity, gateRoot: identity, oldEvidenceBaseline: testBaseline })
      const cell = createDiagnosticPilotCell(allocation, 0), start = createDiagnosticPilotStart(allocation, cell), ledger = openDiagnosticPilotLedger(DIAGNOSTIC_PILOT_STORE)
      ledger.writeStart(start)
      const container = diagnosticPilotContainerIdentity(allocation, cell, "bottom")
      const grant = createDiagnosticPilotLifetimeGrant(ledger, allocation, cell, start, "bottom")
      const binding = { budgetRoot: allocation.root, attemptRoot: start.root, ...container }
      expect(admitFactorySupervisorLifetime({ ...binding })).toBe(120_000)
      expect(() => admitFactorySupervisorLifetime({ ...binding, factoryLifetimeMs: 120_001 })).toThrow(/LIFETIME/u)
      expect(admitFactorySupervisorLifetime({ ...binding, factoryLifetimeMs: 240_000, pilotLifetimeGrant: grant })).toBe(240_000)
      expect(admitPlannerSupervisorLifetime({ ...binding }, 24_800)).toBe(120_000)
      expect(admitPlannerSupervisorLifetime({ ...binding, pilotLifetimeMs: 240_000, pilotLifetimeGrant: grant }, 24_800)).toBe(240_000)
      expect(() => admitFactorySupervisorLifetime({ ...binding, factoryLifetimeMs: 240_001, pilotLifetimeGrant: grant })).toThrow()
      expect(() => admitPlannerSupervisorLifetime({ ...binding, pilotLifetimeMs: 240_001, pilotLifetimeGrant: grant }, 24_800)).toThrow()
      expect(() => admitPlannerSupervisorLifetime({ ...binding, pilotLifetimeMs: 240_000, pilotLifetimeGrant: { ...grant } }, 24_800)).toThrow(/GRANT_UNISSUED/u)
      expect(() => admitFactorySupervisorLifetime({ ...binding, ownershipLabel: "foreign", factoryLifetimeMs: 240_000, pilotLifetimeGrant: grant })).toThrow(/GRANT_BINDING/u)
      expect(readFileSync(join(originalCwd, "scripts/lib/v1-38-planner-supervised-runtime.ts"), "utf8")).toContain("timeoutMs: 1000")
    } finally { process.chdir(originalCwd); rmSync(directory, { recursive: true, force: true }) }
  })
})
