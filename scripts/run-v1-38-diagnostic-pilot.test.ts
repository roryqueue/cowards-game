import { EventEmitter, once } from "node:events"
import { createHash } from "node:crypto"
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { spawn, type ChildProcess } from "node:child_process"
import { describe, expect, it, vi } from "vitest"
import { DIAGNOSTIC_PILOT_STORE, createDiagnosticPilotAllocation, createDiagnosticPilotCell, createDiagnosticPilotStart, createDiagnosticPilotTerminal, createDiagnosticPilotStageCheckpoint, createDiagnosticPilotLifetimeGrant, diagnosticPilotContainerIdentity, openDiagnosticPilotLedger, reopenProspectiveDiagnosticPilotLedger, type DiagnosticPilotLedger } from "../packages/strategy-lab/src/league/diagnostic-pilot.js"
import type { LabMatchExecution } from "../packages/strategy-lab/src/runtime-bridge.js"
import { labRoot } from "../packages/strategy-lab/src/contracts.js"
const testBaseline = Object.fromEntries(["oldAllocationV2", "oldAllocationUnversioned", "oldResult", "oldLeagueTree", "oldFactoryTree"].map((key) => [key, labRoot("pilot-test-old-baseline", key)])) as { oldAllocationV2: `sha256:${string}`; oldAllocationUnversioned: `sha256:${string}`; oldResult: `sha256:${string}`; oldLeagueTree: `sha256:${string}`; oldFactoryTree: `sha256:${string}` }
import { admitFactorySupervisorLifetime } from "./lib/v1-38-factory-supervised-runtime.js"
import { admitPlannerSupervisorLifetime } from "./lib/v1-38-planner-supervised-runtime.js"
import { checkDiagnosticPilotBoundaries } from "./check-v1-38-diagnostic-pilot-boundaries.js"
import {
  DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_MS,
  DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_COMPONENTS,
  DIAGNOSTIC_PILOT_TERMINAL_PROBE_MS,
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
  checkRetainedDiagnosticPilotV1Contract,
  admitDiagnosticPilotHistoricalVerdict,
  runDiagnosticPilotWorkerCell,
  writeDiagnosticPilotTimeout,
  probeRetainedDiagnosticPilotTerminal,
  checkDiagnosticPilotRepairGate,
  diagnosticPilotRepairSourceClosure,
  diagnosticPilotRepairRequiredCommands,
  diagnosticPilotRepairReviewerFingerprint,
  DIAGNOSTIC_PILOT_REPAIR_SOURCE_FILES,
} from "./run-v1-38-diagnostic-pilot.js"

describe("diagnostic pilot source-only watchdog and gate", () => {
  it("denies prospective diagnostic records in public and Go paths", () => {
    const result = checkDiagnosticPilotBoundaries({ files: { "apps/web/src/leak.ts": 'export const leaked = "diagnostic-pilot-terminal-v2"' }, goFiles: { "apps/go-backend/leak.go": 'const leaked = "diagnostic-pilot-result-v2"' } })
    expect(result.violations).toContainEqual({ path: "apps/web/src/leak.ts", rule: "prospective-diagnostic-public-leak" })
    expect(result.violations).toContainEqual({ path: "apps/go-backend/leak.go", rule: "prospective-diagnostic-go-leak" })
  })
  it("completes an injected top-issuance catch only after one v2 terminal reopen", async () => {
    const originalCwd = process.cwd(), directory = realpathSync(mkdtempSync(join(tmpdir(), "pilot-worker-catch-test-")))
    try {
      mkdirSync(join(directory, ".strategy-lab"), { mode: 0o700 }); mkdirSync(join(directory, DIAGNOSTIC_PILOT_STORE), { mode: 0o700 }); process.chdir(directory)
      const id = labRoot("pilot-worker-catch", "source"), allocation = createDiagnosticPilotAllocation({ sourceClosureRoot: id, implementationRoot: id, gateRoot: id, oldEvidenceBaseline: testBaseline })
      const cell = createDiagnosticPilotCell(allocation, 0), start = createDiagnosticPilotStart(allocation, cell), ledger = openDiagnosticPilotLedger(DIAGNOSTIC_PILOT_STORE)
      ledger.writeStart(start)
      const sent: unknown[] = [], closed: string[] = []
      const disposition = await runDiagnosticPilotWorkerCell({ allocation, cell, start, ledger, now: () => 10, cellStartedAt: 0, issue: (seat) => { if (seat === "top") throw new TypeError("DIAGNOSTIC_PILOT_CLI_WORKER_CANDIDATE"); return seat }, execute: async () => { throw new Error("must not execute") }, close: (handle) => { closed.push(handle); return true }, cleanup: async () => true, send: (message) => { sent.push(message); return true } })
      expect(disposition).toBe("stop")
      expect(closed).toEqual(["bottom"])
      expect(sent).toEqual([{ kind: "cell-complete", ordinal: 0 }, { kind: "done", status: "process_invalid" }])
      const reopened = reopenProspectiveDiagnosticPilotLedger(ledger, allocation).records[0]!
      expect(reopened.stages.map((row) => row.stage)).toEqual(["bottom_issuance", "top_issuance", "terminal_publication"])
      expect(reopened.terminal).toMatchObject({ disposition: "system_failure", cause: "worker_candidate", lastEnteredStage: "terminal_publication", failureStage: "top_issuance" })
      expect(ledger.listNames().filter((name) => name.endsWith("terminal-v2.json"))).toHaveLength(1)
    } finally { process.chdir(originalCwd); rmSync(directory, { recursive: true, force: true }) }
  })

  it("preserves a terminal written before an injected post-write fault without a second charge", async () => {
    const originalCwd = process.cwd(), directory = realpathSync(mkdtempSync(join(tmpdir(), "pilot-postwrite-test-")))
    try {
      mkdirSync(join(directory, ".strategy-lab"), { mode: 0o700 }); mkdirSync(join(directory, DIAGNOSTIC_PILOT_STORE), { mode: 0o700 }); process.chdir(directory)
      const id = labRoot("pilot-postwrite", "source"), allocation = createDiagnosticPilotAllocation({ sourceClosureRoot: id, implementationRoot: id, gateRoot: id, oldEvidenceBaseline: testBaseline })
      const cell = createDiagnosticPilotCell(allocation, 0), start = createDiagnosticPilotStart(allocation, cell), ledger = openDiagnosticPilotLedger(DIAGNOSTIC_PILOT_STORE)
      ledger.writeStart(start)
      const sent: unknown[] = []
      await runDiagnosticPilotWorkerCell({ allocation, cell, start, ledger, now: () => 10, cellStartedAt: 0, issue: (seat) => seat, execute: async (_bottom, _top, enteredKernel, enteredEvidence) => { enteredKernel(); enteredEvidence(); return { disposition: "system_failure", processValidity: "process_invalid", evidenceRoot: null, artifactBytes: 0, artifactRecords: 0, cleanupComplete: true } }, close: () => true, cleanup: async () => true, afterTerminalWrite: () => { throw new Error("injected postwrite") }, send: (message) => { sent.push(message); return true } })
      expect(sent).toEqual([{ kind: "cell-complete", ordinal: 0 }, { kind: "done", status: "process_invalid" }])
      expect(reopenProspectiveDiagnosticPilotLedger(ledger, allocation).records[0]?.terminal?.disposition).toBe("system_failure")
      expect(ledger.listNames().filter((name) => name.endsWith("terminal-v2.json"))).toHaveLength(1)
    } finally { process.chdir(originalCwd); rmSync(directory, { recursive: true, force: true }) }
  })
  it("preserves an already-durable success but never promotes its post-write fault to overall success", async () => {
    const originalCwd = process.cwd(), directory = realpathSync(mkdtempSync(join(tmpdir(), "pilot-success-postwrite-test-")))
    try {
      mkdirSync(join(directory, ".strategy-lab"), { mode: 0o700 }); mkdirSync(join(directory, DIAGNOSTIC_PILOT_STORE), { mode: 0o700 }); process.chdir(directory)
      const id = labRoot("pilot-success-postwrite", "source"), allocation = createDiagnosticPilotAllocation({ sourceClosureRoot: id, implementationRoot: id, gateRoot: id, oldEvidenceBaseline: testBaseline })
      const cell = createDiagnosticPilotCell(allocation, 0), start = createDiagnosticPilotStart(allocation, cell), ledger = openDiagnosticPilotLedger(DIAGNOSTIC_PILOT_STORE)
      ledger.writeStart(start)
      const sent: unknown[] = [], execution = { kind: "completed", privacy: "private_offline", result: { state: { testOnly: true }, events: [] }, transitions: [], accounting: [] } as unknown as LabMatchExecution
      await runDiagnosticPilotWorkerCell({ allocation, cell, start, ledger, now: () => 1, cellStartedAt: 0, issue: (seat) => seat, execute: async (_bottom, _top, enteredKernel, enteredEvidence) => { enteredKernel(); enteredEvidence(); const retained = retainDiagnosticPilotExecution(ledger, start, execution); return { disposition: "success", processValidity: "process_valid", evidenceRoot: retained.evidenceRoot, artifactBytes: retained.artifactBytes, artifactRecords: retained.artifactRecords, cleanupComplete: true } }, close: () => true, cleanup: async () => true, afterTerminalWrite: () => { throw new Error("postwrite") }, send: (message) => { sent.push(message); return true } })
      expect(reopenProspectiveDiagnosticPilotLedger(ledger, allocation).records[0]?.terminal?.disposition).toBe("success")
      expect(sent).toEqual([{ kind: "cell-complete", ordinal: 0 }, { kind: "done", status: "process_invalid" }])
    } finally { process.chdir(originalCwd); rmSync(directory, { recursive: true, force: true }) }
  })

  it("distinguishes all six injected durable failure stages without retaining raw errors", async () => {
    for (const target of ["bottom_issuance", "top_issuance", "pre_kernel_binding", "kernel_or_callback", "first_evidence_write", "terminal_publication"] as const) {
      const originalCwd = process.cwd(), directory = realpathSync(mkdtempSync(join(tmpdir(), "pilot-stage-test-")))
      try {
        mkdirSync(join(directory, ".strategy-lab"), { mode: 0o700 }); mkdirSync(join(directory, DIAGNOSTIC_PILOT_STORE), { mode: 0o700 }); process.chdir(directory)
        const id = labRoot("pilot-stage", target), allocation = createDiagnosticPilotAllocation({ sourceClosureRoot: id, implementationRoot: id, gateRoot: id, oldEvidenceBaseline: testBaseline })
        const cell = createDiagnosticPilotCell(allocation, 0), start = createDiagnosticPilotStart(allocation, cell), ledger = openDiagnosticPilotLedger(DIAGNOSTIC_PILOT_STORE)
        ledger.writeStart(start)
        const secret = "raw source /private/host StrategyMemory SoldierMemory objective"
        await runDiagnosticPilotWorkerCell({ allocation, cell, start, ledger, now: () => 10, cellStartedAt: 0,
          issue: (seat) => { if (target === `${seat}_issuance`) throw new Error(secret); return seat },
          execute: async (_bottom, _top, enteredKernel, enteredEvidence) => { if (target === "pre_kernel_binding") throw new Error(secret); enteredKernel(); if (target === "kernel_or_callback") throw new Error(secret); enteredEvidence(); if (target === "first_evidence_write") throw new Error(secret); return { disposition: "system_failure", processValidity: "process_invalid", evidenceRoot: null, artifactBytes: 0, artifactRecords: 0, cleanupComplete: true } },
          close: () => true, cleanup: async () => true, beforeTerminalWrite: target === "terminal_publication" ? () => { throw new Error(secret) } : undefined, send: () => true })
        const reopened = reopenProspectiveDiagnosticPilotLedger(ledger, allocation).records[0]!
        expect(reopened.lastEnteredStage).toBe("terminal_publication")
        if (target === "terminal_publication") { expect(reopened.terminal).toBeNull(); expect(reopened.diagnosis?.failureStage).toBe(target) }
        else expect(reopened.terminal?.failureStage).toBe(target)
        expect(reopened.cause).toBe("unknown_internal")
        expect(JSON.stringify(reopened)).not.toContain(secret)
      } finally { process.chdir(originalCwd); rmSync(directory, { recursive: true, force: true }) }
    }
  })

  it("attempts both issued-handle closes and exact-owner cleanup when each close throws", async () => {
    const originalCwd = process.cwd(), directory = realpathSync(mkdtempSync(join(tmpdir(), "pilot-close-test-")))
    try {
      mkdirSync(join(directory, ".strategy-lab"), { mode: 0o700 }); mkdirSync(join(directory, DIAGNOSTIC_PILOT_STORE), { mode: 0o700 }); process.chdir(directory)
      const id = labRoot("pilot-close", "source"), allocation = createDiagnosticPilotAllocation({ sourceClosureRoot: id, implementationRoot: id, gateRoot: id, oldEvidenceBaseline: testBaseline })
      const cell = createDiagnosticPilotCell(allocation, 0), start = createDiagnosticPilotStart(allocation, cell), ledger = openDiagnosticPilotLedger(DIAGNOSTIC_PILOT_STORE)
      ledger.writeStart(start)
      const closes: string[] = [], sent: unknown[] = [], cleanup = vi.fn(async () => true)
      await runDiagnosticPilotWorkerCell({ allocation, cell, start, ledger, now: () => 1, cellStartedAt: 0, issue: (seat) => seat, execute: async () => { throw new Error("injected") }, close: (handle) => { closes.push(handle); throw new Error("close fault") }, cleanup, send: (message) => { sent.push(message); return true } })
      expect(closes).toEqual(["bottom", "top"])
      expect(cleanup).toHaveBeenCalledTimes(1)
      expect(reopenProspectiveDiagnosticPilotLedger(ledger, allocation).records[0]?.terminal).toMatchObject({ cleanupComplete: false, disposition: "uncertain", processValidity: "process_invalid" })
      expect(sent).toEqual([{ kind: "cell-complete", ordinal: 0 }, { kind: "done", status: "process_invalid" }])
    } finally { process.chdir(originalCwd); rmSync(directory, { recursive: true, force: true }) }
  })

  it("does not mislabel a cleanup fault as first evidence write", async () => {
    const originalCwd = process.cwd(), directory = realpathSync(mkdtempSync(join(tmpdir(), "pilot-cleanup-stage-test-")))
    try {
      mkdirSync(join(directory, ".strategy-lab"), { mode: 0o700 }); mkdirSync(join(directory, DIAGNOSTIC_PILOT_STORE), { mode: 0o700 }); process.chdir(directory)
      const id = labRoot("pilot-cleanup-stage", "source"), allocation = createDiagnosticPilotAllocation({ sourceClosureRoot: id, implementationRoot: id, gateRoot: id, oldEvidenceBaseline: testBaseline })
      const cell = createDiagnosticPilotCell(allocation, 0), start = createDiagnosticPilotStart(allocation, cell), ledger = openDiagnosticPilotLedger(DIAGNOSTIC_PILOT_STORE)
      ledger.writeStart(start)
      let cleanupCalls = 0
      await runDiagnosticPilotWorkerCell({ allocation, cell, start, ledger, now: () => 1, cellStartedAt: 0, issue: (seat) => seat, execute: async (_bottom, _top, enteredKernel, enteredEvidence) => { enteredKernel(); enteredEvidence(); return { disposition: "system_failure", processValidity: "process_invalid", evidenceRoot: null, artifactBytes: 0, artifactRecords: 0, cleanupComplete: true } }, close: () => true, cleanup: async () => { if (++cleanupCalls === 1) throw new Error("injected cleanup fault"); return true }, send: () => true })
      expect(cleanupCalls).toBe(2)
      expect(reopenProspectiveDiagnosticPilotLedger(ledger, allocation).records[0]?.terminal).toMatchObject({ failureStage: "unknown", processValidity: "process_invalid" })
    } finally { process.chdir(originalCwd); rmSync(directory, { recursive: true, force: true }) }
  })

  it("leaves an unretained terminal-publication checkpoint start-only", async () => {
    const originalCwd = process.cwd(), directory = realpathSync(mkdtempSync(join(tmpdir(), "pilot-checkpoint-fault-test-")))
    try {
      mkdirSync(join(directory, ".strategy-lab"), { mode: 0o700 }); mkdirSync(join(directory, DIAGNOSTIC_PILOT_STORE), { mode: 0o700 }); process.chdir(directory)
      const id = labRoot("pilot-checkpoint-fault", "source"), allocation = createDiagnosticPilotAllocation({ sourceClosureRoot: id, implementationRoot: id, gateRoot: id, oldEvidenceBaseline: testBaseline })
      const cell = createDiagnosticPilotCell(allocation, 0), start = createDiagnosticPilotStart(allocation, cell), ledger = openDiagnosticPilotLedger(DIAGNOSTIC_PILOT_STORE)
      ledger.writeStart(start)
      await runDiagnosticPilotWorkerCell({ allocation, cell, start, ledger: { ...ledger, writeStageCheckpoint: (marker) => { if (marker.ordinal === 5) throw new Error("injected atomic link fault"); ledger.writeStageCheckpoint!(marker) } }, now: () => 1, cellStartedAt: 0, issue: (seat) => seat, execute: async (_bottom, _top, enteredKernel, enteredEvidence) => { enteredKernel(); enteredEvidence(); return { disposition: "system_failure", processValidity: "process_invalid", evidenceRoot: null, artifactBytes: 0, artifactRecords: 0, cleanupComplete: true } }, close: () => true, cleanup: async () => true, send: () => true })
      expect(reopenProspectiveDiagnosticPilotLedger(ledger, allocation).records[0]).toMatchObject({ lastEnteredStage: "unknown", cause: "unknown_internal", terminal: null, processValidity: "process_invalid" })
    } finally { process.chdir(originalCwd); rmSync(directory, { recursive: true, force: true }) }
  })

  it("does not claim a checkpoint whose directory sync faulted after link", async () => {
    const originalCwd = process.cwd(), directory = realpathSync(mkdtempSync(join(tmpdir(), "pilot-linked-checkpoint-test-")))
    try {
      mkdirSync(join(directory, ".strategy-lab"), { mode: 0o700 }); mkdirSync(join(directory, DIAGNOSTIC_PILOT_STORE), { mode: 0o700 }); process.chdir(directory)
      const id = labRoot("pilot-linked-checkpoint", "source"), allocation = createDiagnosticPilotAllocation({ sourceClosureRoot: id, implementationRoot: id, gateRoot: id, oldEvidenceBaseline: testBaseline })
      const cell = createDiagnosticPilotCell(allocation, 0), start = createDiagnosticPilotStart(allocation, cell), ledger = openDiagnosticPilotLedger(DIAGNOSTIC_PILOT_STORE, { beforeDirectorySync: (_kind, _usage, target) => { if (target.endsWith("stage-3.json")) throw new Error("injected post-link sync fault") } })
      ledger.writeStart(start)
      await runDiagnosticPilotWorkerCell({ allocation, cell, start, ledger, now: () => 1, cellStartedAt: 0, issue: (seat) => seat, execute: async (_bottom, _top, enteredKernel) => { enteredKernel(); throw new Error("must not continue") }, close: () => true, cleanup: async () => true, send: () => true })
      const reopened = reopenProspectiveDiagnosticPilotLedger(ledger, allocation).records[0]
      expect(reopened?.stages.some((marker) => marker.stage === "kernel_or_callback")).toBe(true)
      expect(reopened).toMatchObject({ lastEnteredStage: "unknown", terminal: null, processValidity: "process_invalid" })
    } finally { process.chdir(originalCwd); rmSync(directory, { recursive: true, force: true }) }
  })
  it("suppresses completion when a terminal write links then throws before directory sync", async () => {
    const originalCwd = process.cwd(), directory = realpathSync(mkdtempSync(join(tmpdir(), "pilot-terminal-link-fault-test-")))
    try {
      mkdirSync(join(directory, ".strategy-lab"), { mode: 0o700 }); mkdirSync(join(directory, DIAGNOSTIC_PILOT_STORE), { mode: 0o700 }); process.chdir(directory)
      const id = labRoot("pilot-terminal-link-fault", "source"), allocation = createDiagnosticPilotAllocation({ sourceClosureRoot: id, implementationRoot: id, gateRoot: id, oldEvidenceBaseline: testBaseline })
      const cell = createDiagnosticPilotCell(allocation, 0), start = createDiagnosticPilotStart(allocation, cell), ledger = openDiagnosticPilotLedger(DIAGNOSTIC_PILOT_STORE, { beforeDirectorySync: (_kind, _usage, target) => { if (target.endsWith("terminal-v2.json")) throw new Error("injected directory sync fault") } })
      ledger.writeStart(start)
      const sent: unknown[] = []
      await runDiagnosticPilotWorkerCell({ allocation, cell, start, ledger, now: () => 1, cellStartedAt: 0, issue: (seat) => seat, execute: async (_bottom, _top, enteredKernel, enteredEvidence) => { enteredKernel(); enteredEvidence(); return { disposition: "system_failure", processValidity: "process_invalid", evidenceRoot: null, artifactBytes: 0, artifactRecords: 0, cleanupComplete: true } }, close: () => true, cleanup: async () => true, send: (message) => { sent.push(message); return true } })
      expect(sent).toEqual([])
      expect(ledger.listNames().filter((name) => name.endsWith("terminal-v2.json"))).toHaveLength(1)
      expect(reopenProspectiveDiagnosticPilotLedger(ledger, allocation).records[0]).toMatchObject({ terminal: { disposition: "system_failure" }, diagnosis: { failureStage: "terminal_publication", cause: "unknown_internal" }, processValidity: "process_invalid" })
    } finally { process.chdir(originalCwd); rmSync(directory, { recursive: true, force: true }) }
  })
  it("diagnoses the catch terminal-write failure, not the earlier issuer failure", async () => {
    const originalCwd = process.cwd(), directory = realpathSync(mkdtempSync(join(tmpdir(), "pilot-publication-cause-test-")))
    try {
      mkdirSync(join(directory, ".strategy-lab"), { mode: 0o700 }); mkdirSync(join(directory, DIAGNOSTIC_PILOT_STORE), { mode: 0o700 }); process.chdir(directory)
      const id = labRoot("pilot-publication-cause", "source"), allocation = createDiagnosticPilotAllocation({ sourceClosureRoot: id, implementationRoot: id, gateRoot: id, oldEvidenceBaseline: testBaseline })
      const cell = createDiagnosticPilotCell(allocation, 0), start = createDiagnosticPilotStart(allocation, cell), ledger = openDiagnosticPilotLedger(DIAGNOSTIC_PILOT_STORE)
      ledger.writeStart(start)
      await runDiagnosticPilotWorkerCell({ allocation, cell, start, ledger: { ...ledger, writeTerminalV2: () => { throw new Error("DIAGNOSTIC_PILOT_LEDGER_CAP") } }, now: () => 1, cellStartedAt: 0, issue: () => { throw new Error("DIAGNOSTIC_PILOT_CLI_WORKER_CANDIDATE") }, execute: async () => { throw new Error("must not execute") }, close: () => true, cleanup: async () => true, send: () => true })
      const reopened = reopenProspectiveDiagnosticPilotLedger(ledger, allocation).records[0]
      expect(reopened).toMatchObject({ cause: "ledger_cap", terminal: null, processValidity: "process_invalid", diagnosis: { failureStage: "terminal_publication", cause: "ledger_cap" } })
    } finally { process.chdir(originalCwd); rmSync(directory, { recursive: true, force: true }) }
  })

  it("does not send done after an injected cell-complete IPC failure", async () => {
    const originalCwd = process.cwd(), directory = realpathSync(mkdtempSync(join(tmpdir(), "pilot-ipc-test-")))
    try {
      mkdirSync(join(directory, ".strategy-lab"), { mode: 0o700 }); mkdirSync(join(directory, DIAGNOSTIC_PILOT_STORE), { mode: 0o700 }); process.chdir(directory)
      const id = labRoot("pilot-ipc", "source"), allocation = createDiagnosticPilotAllocation({ sourceClosureRoot: id, implementationRoot: id, gateRoot: id, oldEvidenceBaseline: testBaseline })
      const cell = createDiagnosticPilotCell(allocation, 0), start = createDiagnosticPilotStart(allocation, cell), ledger = openDiagnosticPilotLedger(DIAGNOSTIC_PILOT_STORE)
      ledger.writeStart(start)
      const sent: unknown[] = []
      await runDiagnosticPilotWorkerCell({ allocation, cell, start, ledger, now: () => 1, cellStartedAt: 0, issue: (seat) => seat, execute: async () => { throw new Error("injected") }, close: () => true, cleanup: async () => true, send: (message) => { sent.push(message); return false } })
      expect(sent).toEqual([{ kind: "cell-complete", ordinal: 0 }])
      expect(reopenProspectiveDiagnosticPilotLedger(ledger, allocation).records[0]?.terminal?.disposition).toBe("system_failure")
    } finally { process.chdir(originalCwd); rmSync(directory, { recursive: true, force: true }) }
  })

  it("keeps one durable charge when the done IPC send fails after completion", async () => {
    const originalCwd = process.cwd(), directory = realpathSync(mkdtempSync(join(tmpdir(), "pilot-done-ipc-test-")))
    try {
      mkdirSync(join(directory, ".strategy-lab"), { mode: 0o700 }); mkdirSync(join(directory, DIAGNOSTIC_PILOT_STORE), { mode: 0o700 }); process.chdir(directory)
      const id = labRoot("pilot-done-ipc", "source"), allocation = createDiagnosticPilotAllocation({ sourceClosureRoot: id, implementationRoot: id, gateRoot: id, oldEvidenceBaseline: testBaseline })
      const cell = createDiagnosticPilotCell(allocation, 0), start = createDiagnosticPilotStart(allocation, cell), ledger = openDiagnosticPilotLedger(DIAGNOSTIC_PILOT_STORE)
      ledger.writeStart(start)
      const sent: unknown[] = []
      await runDiagnosticPilotWorkerCell({ allocation, cell, start, ledger, now: () => 1, cellStartedAt: 0, issue: (seat) => seat, execute: async () => { throw new Error("injected") }, close: () => true, cleanup: async () => true, send: (message) => { sent.push(message); return message.kind !== "done" } })
      expect(sent).toEqual([{ kind: "cell-complete", ordinal: 0 }, { kind: "done", status: "process_invalid" }])
      expect(reopenProspectiveDiagnosticPilotLedger(ledger, allocation).records[0]?.terminal?.disposition).toBe("system_failure")
      expect(ledger.listNames().filter((name) => name.endsWith("terminal-v2.json"))).toHaveLength(1)
    } finally { process.chdir(originalCwd); rmSync(directory, { recursive: true, force: true }) }
  })

  it("leaves a durable terminal present but uncertain when terminal reopen faults", async () => {
    const originalCwd = process.cwd(), directory = realpathSync(mkdtempSync(join(tmpdir(), "pilot-reopen-fault-test-")))
    try {
      mkdirSync(join(directory, ".strategy-lab"), { mode: 0o700 }); mkdirSync(join(directory, DIAGNOSTIC_PILOT_STORE), { mode: 0o700 }); process.chdir(directory)
      const id = labRoot("pilot-reopen-fault", "source"), allocation = createDiagnosticPilotAllocation({ sourceClosureRoot: id, implementationRoot: id, gateRoot: id, oldEvidenceBaseline: testBaseline })
      const cell = createDiagnosticPilotCell(allocation, 0), start = createDiagnosticPilotStart(allocation, cell), ledger = openDiagnosticPilotLedger(DIAGNOSTIC_PILOT_STORE)
      ledger.writeStart(start)
      const sent: unknown[] = []
      await runDiagnosticPilotWorkerCell({ allocation, cell, start, ledger: { ...ledger, readTerminalV2: (root) => { const terminal = ledger.readTerminalV2!(root); if (terminal) throw new Error("injected reopen fault"); return null } }, now: () => 1, cellStartedAt: 0, issue: (seat) => seat, execute: async () => { throw new Error("injected worker fault") }, close: () => true, cleanup: async () => true, send: (message) => { sent.push(message); return true } })
      expect(sent).toEqual([])
      expect(reopenProspectiveDiagnosticPilotLedger(ledger, allocation).records[0]?.terminal?.disposition).toBe("system_failure")
      expect(ledger.listNames().filter((name) => name.endsWith("terminal-v2.json"))).toHaveLength(1)
    } finally { process.chdir(originalCwd); rmSync(directory, { recursive: true, force: true }) }
  })

  it("probes a durable terminal before parent timeout publication after lost worker IPC", async () => {
    const id = labRoot("pilot-parent-probe", "source"), allocation = createDiagnosticPilotAllocation({ sourceClosureRoot: id, implementationRoot: id, gateRoot: id, oldEvidenceBaseline: testBaseline })
    const cell = createDiagnosticPilotCell(allocation, 0), child = Object.assign(new EventEmitter(), { pid: 4545, send: vi.fn() }) as unknown as ChildProcess
    const publishTimeout = vi.fn(async () => "written" as const)
    const pending = runDiagnosticPilotWatchdog("injected-only", { now: () => 1_000, spawnWorker: () => child, killGroup: () => undefined, cleanup: async () => true, probeTerminal: async () => "verified" as const, publishTimeout })
    child.emit("message", { kind: "cell-request", allocation, cell })
    child.emit("exit", 1, null)
    expect(await pending).toBe("process_invalid")
    expect(publishTimeout).not.toHaveBeenCalled()
  })
  it("overlaps the read-only terminal probe with cleanup inside the unchanged reserve", async () => {
    const id = labRoot("pilot-overlapped-probe", "source"), allocation = createDiagnosticPilotAllocation({ sourceClosureRoot: id, implementationRoot: id, gateRoot: id, oldEvidenceBaseline: testBaseline })
    const cell = createDiagnosticPilotCell(allocation, 0), child = Object.assign(new EventEmitter(), { pid: 5656, send: vi.fn() }) as unknown as ChildProcess
    let releaseCleanup: (() => void) | undefined
    const cleanupGate = new Promise<void>((resolve) => { releaseCleanup = resolve })
    const probeTerminal = vi.fn(async () => "verified" as const), publishTimeout = vi.fn(async () => "written" as const)
    const pending = runDiagnosticPilotWatchdog("injected-only", { now: () => 1_000, spawnWorker: () => child, killGroup: () => undefined, cleanup: async () => { await cleanupGate; return true }, probeTerminal, publishTimeout })
    child.emit("message", { kind: "cell-request", allocation, cell })
    child.emit("exit", 1, null)
    await Promise.resolve()
    expect(probeTerminal).toHaveBeenCalledTimes(1)
    releaseCleanup?.()
    expect(await pending).toBe("process_invalid")
    expect(publishTimeout).not.toHaveBeenCalled()
  })
  it("rechecks an exact durable terminal at timeout-write time without overwriting it", async () => {
    const originalCwd = process.cwd(), directory = realpathSync(mkdtempSync(join(tmpdir(), "pilot-timeout-race-test-")))
    try {
      mkdirSync(join(directory, ".strategy-lab"), { mode: 0o700 }); mkdirSync(join(directory, DIAGNOSTIC_PILOT_STORE), { mode: 0o700 }); process.chdir(directory)
      const id = labRoot("pilot-timeout-race", "source"), allocation = createDiagnosticPilotAllocation({ sourceClosureRoot: id, implementationRoot: id, gateRoot: id, oldEvidenceBaseline: testBaseline })
      const cell = createDiagnosticPilotCell(allocation, 0), start = createDiagnosticPilotStart(allocation, cell), ledger = openDiagnosticPilotLedger(DIAGNOSTIC_PILOT_STORE)
      ledger.writeStart(start)
      await runDiagnosticPilotWorkerCell({ allocation, cell, start, ledger, now: () => 1, cellStartedAt: 0, issue: (seat) => seat, execute: async () => { throw new Error("injected") }, close: () => true, cleanup: async () => true, send: () => true })
      const terminal = ledger.readTerminalV2!(start.root)
      expect(probeRetainedDiagnosticPilotTerminal(allocation, cell)).toBe("uncertain")
      expect(writeDiagnosticPilotTimeout(allocation, cell, "publication_uncertain", 2)).toBe("already_terminal")
      expect(ledger.readTerminalV2!(start.root)).toEqual(terminal)
      expect(ledger.listNames().filter((name) => name.endsWith("terminal-v2.json"))).toHaveLength(1)
    } finally { process.chdir(originalCwd); rmSync(directory, { recursive: true, force: true }) }
  })
  it("treats a fresh read-only v2 probe after lost IPC as uncertain and never publishes timeout", async () => {
    const originalCwd = process.cwd(), directory = realpathSync(mkdtempSync(join(tmpdir(), "pilot-fresh-probe-test-")))
    try {
      mkdirSync(join(directory, ".strategy-lab"), { mode: 0o700 }); mkdirSync(join(directory, DIAGNOSTIC_PILOT_STORE), { mode: 0o700 }); process.chdir(directory)
      const id = labRoot("pilot-fresh-probe", "source"), allocation = createDiagnosticPilotAllocation({ sourceClosureRoot: id, implementationRoot: id, gateRoot: id, oldEvidenceBaseline: testBaseline })
      const cell = createDiagnosticPilotCell(allocation, 0), start = createDiagnosticPilotStart(allocation, cell), ledger = openDiagnosticPilotLedger(DIAGNOSTIC_PILOT_STORE)
      ledger.writeStart(start)
      await runDiagnosticPilotWorkerCell({ allocation, cell, start, ledger, now: () => 1, cellStartedAt: 0, issue: (seat) => seat, execute: async () => { throw new Error("injected") }, close: () => true, cleanup: async () => true, send: () => false })
      expect(probeRetainedDiagnosticPilotTerminal(allocation, cell)).toBe("uncertain")
      const child = Object.assign(new EventEmitter(), { pid: 6767, send: vi.fn() }) as unknown as ChildProcess
      const publishTimeout = vi.fn(async () => "written" as const)
      const pending = runDiagnosticPilotWatchdog("injected-only", { now: () => 1_000, spawnWorker: () => child, killGroup: () => undefined, cleanup: async () => true, probeTerminal: async () => probeRetainedDiagnosticPilotTerminal(allocation, cell), publishTimeout })
      child.emit("message", { kind: "cell-request", allocation, cell })
      child.emit("exit", 1, null)
      expect(await pending).toBe("process_invalid")
      expect(publishTimeout).not.toHaveBeenCalled()
      expect(ledger.listNames().filter((name) => name.endsWith("terminal-v2.json"))).toHaveLength(1)
    } finally { process.chdir(originalCwd); rmSync(directory, { recursive: true, force: true }) }
  })
  it("publishes one timeout after a lost worker with a synced stage-only prefix", async () => {
    const originalCwd = process.cwd(), directory = realpathSync(mkdtempSync(join(tmpdir(), "pilot-stage-only-timeout-test-")))
    try {
      mkdirSync(join(directory, ".strategy-lab"), { mode: 0o700 }); mkdirSync(join(directory, DIAGNOSTIC_PILOT_STORE), { mode: 0o700 }); process.chdir(directory)
      const id = labRoot("pilot-stage-only-timeout", "source"), allocation = createDiagnosticPilotAllocation({ sourceClosureRoot: id, implementationRoot: id, gateRoot: id, oldEvidenceBaseline: testBaseline })
      const cell = createDiagnosticPilotCell(allocation, 0), start = createDiagnosticPilotStart(allocation, cell), ledger = openDiagnosticPilotLedger(DIAGNOSTIC_PILOT_STORE)
      ledger.writeStart(start)
      ledger.writeStageCheckpoint!(createDiagnosticPilotStageCheckpoint(start, 0, "bottom_issuance"))
      expect(probeRetainedDiagnosticPilotTerminal(allocation, cell)).toBe("absent")
      const child = Object.assign(new EventEmitter(), { pid: 7878, send: vi.fn() }) as unknown as ChildProcess
      const publishTimeout = vi.fn(async (...args: Parameters<typeof writeDiagnosticPilotTimeout>) => writeDiagnosticPilotTimeout(...args))
      const pending = runDiagnosticPilotWatchdog("injected-only", { now: () => 1_000, spawnWorker: () => child, killGroup: () => undefined, cleanup: async () => true, probeTerminal: async () => probeRetainedDiagnosticPilotTerminal(allocation, cell), publishTimeout })
      child.emit("message", { kind: "cell-request", allocation, cell })
      child.emit("exit", 1, null)
      expect(await pending).toBe("process_invalid")
      expect(publishTimeout).toHaveBeenCalledTimes(1)
      const reopened = reopenProspectiveDiagnosticPilotLedger(openDiagnosticPilotLedger(DIAGNOSTIC_PILOT_STORE), allocation).records[0]
      expect(reopened?.stages.map((marker) => marker.stage)).toEqual(["bottom_issuance", "terminal_publication"])
      expect(reopened?.terminal).toMatchObject({ code: "publication_uncertain", failureStage: "unknown", processValidity: "process_invalid" })
      expect(ledger.listNames().filter((name) => name.endsWith("terminal-v2.json"))).toHaveLength(1)
    } finally { process.chdir(originalCwd); rmSync(directory, { recursive: true, force: true }) }
  })
  it("reopens the consumed historical verdict with exact typed process-invalid accounting", () => {
    const verdict = checkRetainedDiagnosticPilotV1Contract()
    expect(verdict).toMatchObject({ processValidity: "process_invalid", chargedCount: 1, slots: [{ ordinal: 0, status: "system_failure" }, { ordinal: 1, status: "unused" }, { ordinal: 2, status: "unused" }, { ordinal: 3, status: "unused" }] })
    expect(() => admitDiagnosticPilotHistoricalVerdict({ ...verdict, chargedCount: 0 })).toThrow()
    expect(() => admitDiagnosticPilotHistoricalVerdict({ ...verdict, oldEvidenceBaseline: { ...(verdict.oldEvidenceBaseline as Record<string, unknown>), oldResult: labRoot("test", "changed") } })).toThrow()
    expect(() => admitDiagnosticPilotHistoricalVerdict({ ...verdict, sourceClosureRoot: labRoot("test", "current") })).toThrow()
  }, 120_000)
  it("rejects forged repair keys, stale source/review, omitted commands, malformed history and authority flips", () => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "pilot-repair-gate-test-")))
    try {
      const path = join(directory, "gate.json")
      const bytes = Object.fromEntries(DIAGNOSTIC_PILOT_REPAIR_SOURCE_FILES.map((file) => [file, Buffer.from(`test:${file}`)])) as Record<string, Uint8Array>
      const source = diagnosticPilotRepairSourceClosure((file) => bytes[file]!)
      const review = Buffer.from(`Reviewer: test-reviewer\nSource closure: ${source.sourceClosureRoot}\nPublic key fingerprint: ${diagnosticPilotRepairReviewerFingerprint()}\nActionable findings: 0\n`)
      const history = checkRetainedDiagnosticPilotV1Contract()
      const body = { schemaVersion: "diagnostic-pilot-repair-source-gate-v1", sourceFiles: source.sourceFiles, sourceClosureRoot: source.sourceClosureRoot, reviewPath: ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-10-SOURCE-REVIEW.md", reviewSha256: `sha256:${createHash("sha256").update(review).digest("hex")}`, reviewerId: "test-reviewer", authorId: "/root/execute_265_10", actionableFindings: 0, commands: diagnosticPilotRepairRequiredCommands().map((command) => ({ command, exitCode: 0 })), historicalCompatibility: history, oldEvidenceBaseline: history.oldEvidenceBaseline, empiricalAuthority: false, runAllowed: false, leagueRequirementsEvidence: false, freezeAuthorized: false, formationAuthorized: false, holdoutAuthorized: false, counted: false, public: false, productionAuthorized: false }
      const signatureBase64 = Buffer.alloc(64).toString("base64")
      const write = (value: Record<string, unknown>) => writeFileSync(path, JSON.stringify(value))
      const gate = { ...body, signatureBase64, root: labRoot("diagnostic-pilot-repair-source-gate-v1", { ...body, signatureBase64 }) }
      write(gate)
      expect(() => checkDiagnosticPilotRepairGate({ gatePath: path, sourceFiles: bytes, reviewBytes: review })).toThrow(/REPAIR_SIGNATURE/u)
      expect(() => checkDiagnosticPilotRepairGate({ gatePath: path, sourceFiles: { ...bytes, [source.sourceFiles[0]!.path]: Buffer.from("changed") }, reviewBytes: review })).toThrow(/REPAIR_SOURCE_DRIFT/u)
      expect(() => checkDiagnosticPilotRepairGate({ gatePath: path, sourceFiles: bytes, reviewBytes: Buffer.from("changed review") })).toThrow(/REPAIR_REVIEW/u)
      write({ ...gate, commands: gate.commands.slice(1) }); expect(() => checkDiagnosticPilotRepairGate({ gatePath: path, sourceFiles: bytes, reviewBytes: review })).toThrow(/REPAIR_COMMANDS/u)
      write({ ...gate, commands: [{ command: gate.commands[0]!.command, exitCode: 1 }, ...gate.commands.slice(1)] }); expect(() => checkDiagnosticPilotRepairGate({ gatePath: path, sourceFiles: bytes, reviewBytes: review })).toThrow(/REPAIR_COMMANDS/u)
      write({ ...gate, historicalCompatibility: { ...history, chargedCount: 0 } }); expect(() => checkDiagnosticPilotRepairGate({ gatePath: path, sourceFiles: bytes, reviewBytes: review })).toThrow(/HISTORICAL_VERDICT/u)
      write({ ...gate, runAllowed: true }); expect(() => checkDiagnosticPilotRepairGate({ gatePath: path, sourceFiles: bytes, reviewBytes: review })).toThrow(/REPAIR_GATE_SCHEMA/u)
      write({ ...gate, signatureBase64: Buffer.alloc(64, 1).toString("base64") }); expect(() => checkDiagnosticPilotRepairGate({ gatePath: path, sourceFiles: bytes, reviewBytes: review })).toThrow()
    } finally { rmSync(directory, { recursive: true, force: true }) }
  }, 120_000)
  it("places a preemptive kill before both hard deadlines with independent cleanup reserve", () => {
    const reserve = DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_COMPONENTS
    expect(reserve.providerCount * (reserve.streamCloseMilliseconds + reserve.removeMilliseconds + reserve.inspectBeforeMilliseconds + reserve.inspectAfterMilliseconds) + reserve.processGroupKillMilliseconds + reserve.terminalWriterAndFsyncMilliseconds + reserve.schedulerAndFilesystemMarginMilliseconds).toBe(30_000)
    expect(reserve.schedulerAndFilesystemMarginMilliseconds).toBe(7_000)
    expect(DIAGNOSTIC_PILOT_TERMINAL_PROBE_MS).toBeLessThanOrEqual(reserve.providerCount * (reserve.streamCloseMilliseconds + reserve.removeMilliseconds + reserve.inspectBeforeMilliseconds + reserve.inspectAfterMilliseconds))
    expect(DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_MS).toBe(30_000)
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
