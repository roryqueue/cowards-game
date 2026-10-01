import { EventEmitter } from "node:events"
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, lstatSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { labRoot } from "../packages/strategy-lab/src/contracts.js"
import { createDiagnosticRetryV4Allocation, createDiagnosticRetryV4Cell, createDiagnosticRetryV4Start, diagnosticRetryV4ContainerIdentity, createDiagnosticRetryV4Stage, createDiagnosticRetryV4Terminal, openDiagnosticRetryV4Ledger, retainDiagnosticRetryV4PartialEvidence } from "../packages/strategy-lab/src/league/diagnostic-retry-v4.js"
import {
  RETRY_V4_BOUNDS, RETRY_V4_REQUIRED_COMMANDS, diagnosticRetryV4SourceClosure, diagnosticRetryV4SourcePaths,
  parseDiagnosticRetryV4Review, createDiagnosticRetryV4Envelope, createDiagnosticRetryV4AllocationSet,
  admitDiagnosticRetryV4Envelope, createDiagnosticRetryV4PreflightAttempt, createDiagnosticRetryV4PreflightDisposition,
  requireDiagnosticRetryV4Preflight, decideDiagnosticRetryV4Next, runDiagnosticRetryV4Sequence,
  cleanupDiagnosticRetryV4ExactOwners, durableRetryV4Create, superviseDiagnosticRetryV4Attempt, runDiagnosticRetryV4Live, checkDiagnosticRetryV4Retained, main,
} from "./run-v1-38-diagnostic-retry-v4.js"

const originalCwd = process.cwd(), temporary: string[] = []
afterEach(() => { process.chdir(originalCwd); for (const path of temporary.splice(0)) rmSync(path, { recursive: true, force: true }); vi.restoreAllMocks() })
const hash = (value: string) => labRoot("retry-v4-cli-unit-only", value)
const oldEvidenceBaseline = { oldAllocationV2: hash("v2"), oldAllocationUnversioned: hash("v1"), oldResult: hash("result"), oldLeagueTree: hash("league"), oldFactoryTree: hash("factory") }
const allocation = (attemptOrdinal = 1) => createDiagnosticRetryV4Allocation({ attemptOrdinal, envelopeRoot: hash("envelope"), sourceClosureRoot: hash("source"), implementationRoot: hash("implementation"), gateRoot: hash("review"), oldEvidenceBaseline })
const temp = () => { const path = realpathSync(mkdtempSync(join(tmpdir(), "retry-v4-cli-unit-"))); temporary.push(path); process.chdir(path); return path }
const observation = { fileSystemBytes: "30000000000", fileSystemInodes: "5000000", memoryBasisPoints: 3000, memoryAvailableBytes: 2_000_000_000, dockerCpus: 2, dockerMemoryBytes: 268_435_456, imageDigest: hash("image"), architecture: "amd64" as const, ownedNameCollisions: 0 as const, readerMilliseconds: 100 }
const envelope = () => createDiagnosticRetryV4Envelope({ authorizationMessage: "Actual direct user message: up to 5 retries.", sourceClosureRoot: hash("source"), closureRoot: hash("closure"), reviewHash: hash("review"), implementationRoot: hash("implementation"), closurePath: "closure.json", reviewPath: "review.md", historical: { oldEvidenceBaseline, historicalFiles: [{ path: "historical.json", sha256: hash("old") }], historicalRoot: hash("history") } })

describe("single retry-v4 harness with injected source-only fixtures", () => {
  it("is import-safe and fixes five attempts and all unchanged bounds", () => {
    expect(RETRY_V4_BOUNDS).toEqual({ maxAttempts: 5, cellMilliseconds: 240000, runEntryMilliseconds: 600000, cleanupMilliseconds: 30000 })
    expect(typeof main).toBe("function")
  })
  it("captures the user message exactly once and allocates five distinct roots and stores", () => {
    const e = envelope(), allocations = createDiagnosticRetryV4AllocationSet(e)
    expect(e.authorizationMessage).toBe("Actual direct user message: up to 5 retries.")
    expect(allocations.allocations.map((a) => a.attemptOrdinal)).toEqual([1, 2, 3, 4, 5])
    expect(new Set(allocations.allocations.map((a) => a.store)).size).toBe(5)
    expect(admitDiagnosticRetryV4Envelope(e, allocations).envelope).toEqual(e)
    expect(() => admitDiagnosticRetryV4Envelope({ ...e, authorizationMessage: "changed" }, allocations)).toThrow()
    expect(() => admitDiagnosticRetryV4Envelope(e, { ...allocations, maxAttempts: 6 })).toThrow()
  })
  it("requires each ordinal's own fresh preflight and rejects prior ordinal disposition", () => {
    const a = allocation(), b = allocation(2)
    const attempt = createDiagnosticRetryV4PreflightAttempt(a), admitted = createDiagnosticRetryV4PreflightDisposition(a, observation)
    expect(requireDiagnosticRetryV4Preflight(a, attempt, admitted).status).toBe("admitted")
    expect(() => requireDiagnosticRetryV4Preflight(b, attempt, admitted)).toThrow("PREFLIGHT_ATTEMPT")
    expect(() => requireDiagnosticRetryV4Preflight(a, attempt, { ...admitted, status: "prestart_denied" })).toThrow()
    expect(requireDiagnosticRetryV4Preflight(a, attempt, createDiagnosticRetryV4PreflightDisposition(a, null)).status).toBe("prestart_denied")
  })
  it.each([
    ["memoryBasisPoints", 2499], ["memoryAvailableBytes", 1], ["dockerCpus", 1], ["dockerMemoryBytes", 1],
    ["fileSystemBytes", "1"], ["fileSystemInodes", "1"], ["ownedNameCollisions", 1], ["architecture", "arm64"], ["readerMilliseconds", 60001],
  ])("denies capacity drift at %s before charge", (field, value) => {
    const a = allocation(), d = createDiagnosticRetryV4PreflightDisposition(a, { ...observation, [field]: value } as never)
    expect(() => requireDiagnosticRetryV4Preflight(a, createDiagnosticRetryV4PreflightAttempt(a), d)).toThrow("PREFLIGHT_OBSERVATION")
  })
  it.each([
    [{ processValidity: "process_valid" }, "process_valid"],
    [{ preflightAdmitted: false }, "preflight_denied"],
    [{ cleanupComplete: false }, "cleanup_unresolved"],
    [{ publicationCertain: false }, "publication_uncertain"],
    [{ integrityValid: false }, "integrity_failure"],
  ])("stops serial work at the first prescribed terminal", (change, expected) => {
    expect(decideDiagnosticRetryV4Next(1, { processValidity: "process_invalid", cleanupComplete: true, publicationCertain: true, integrityValid: true, preflightAdmitted: true, ...change })).toBe(expected)
  })
  it("rechecks, preflights and executes each ordinal serially; stops first valid result", async () => {
    const order: string[] = []
    const result = await runDiagnosticRetryV4Sequence({
      recheck: (ordinal) => { order.push(`source-${ordinal}`) },
      preflight: async (ordinal) => { order.push(`preflight-${ordinal}`); return true },
      execute: async (ordinal) => { order.push(`run-${ordinal}`); return { processValidity: ordinal === 3 ? "process_valid" : "process_invalid", cleanupComplete: true, publicationCertain: true, integrityValid: true } },
    })
    expect(result).toEqual({ attempts: [1, 2, 3], stopReason: "process_valid" })
    expect(order).toEqual(["source-1", "preflight-1", "run-1", "source-2", "preflight-2", "run-2", "source-3", "preflight-3", "run-3"])
  })
  it("cannot bypass a denied source or fresh preflight and never exceeds five", async () => {
    const execute = vi.fn(async () => ({ processValidity: "process_invalid" as const, cleanupComplete: true, publicationCertain: true, integrityValid: true }))
    expect(await runDiagnosticRetryV4Sequence({ recheck: () => { throw Error("drift") }, preflight: async () => true, execute })).toEqual({ attempts: [], stopReason: "integrity_failure" })
    expect(execute).not.toHaveBeenCalled()
    expect(await runDiagnosticRetryV4Sequence({ recheck: () => {}, preflight: async () => false, execute })).toEqual({ attempts: [], stopReason: "preflight_denied" })
    expect(execute).not.toHaveBeenCalled()
    expect(await runDiagnosticRetryV4Sequence({ recheck: () => {}, preflight: async () => true, execute })).toEqual({ attempts: [1, 2, 3, 4, 5], stopReason: "cap" })
    expect(execute).toHaveBeenCalledTimes(5)
  })
  it("enumerates all scripts and package sources/configs, with canonical sorting", () => {
    const paths = diagnosticRetryV4SourcePaths()
    expect(paths).toEqual([...paths].sort())
    for (const path of ["scripts/run-v1-38-diagnostic-retry-v4.ts", "scripts/run-v1-38-diagnostic-retry-v4.test.ts", "packages/engine/src/kernel/step.ts", "packages/strategy-lab/src/runtime-bridge.ts", "packages/strategy-lab/tsconfig.json", "packages/strategy-lab/package.json", "pnpm-lock.yaml", "tsconfig.base.json", "tsconfig.json"]) expect(paths).toContain(path)
    expect(paths.some((p) => p.endsWith("SOURCE-REVIEW.md"))).toBe(false)
  })
  it("binds independent structured Markdown review and exact successful command receipts", () => {
    const cwd = temp(); durableRetryV4Create(join(cwd, "fixture.json"), { inert: true })
    const closure = diagnosticRetryV4SourceClosure(["fixture.json"])
    const review = { schemaVersion: "diagnostic-retry-source-review-v4", sourceClosureRoot: closure.sourceClosureRoot, closureRoot: closure.root, reviewer: "independent unit fixture reviewer", independent: true, disposition: "accepted", unresolvedActionableFindings: 0, commands: RETRY_V4_REQUIRED_COMMANDS.map((command) => ({ command, exitCode: 0 })) }
    const md = (v: unknown) => "# Actual independent review\n\n```json\n" + JSON.stringify(v) + "\n```\n"
    expect(parseDiagnosticRetryV4Review(md(review), closure).reviewer).toBe(review.reviewer)
    for (const mutation of [{ sourceClosureRoot: hash("stale") }, { independent: false }, { unresolvedActionableFindings: 1 }, { disposition: "rejected" }, { commands: [] }]) expect(() => parseDiagnosticRetryV4Review(md({ ...review, ...mutation }), closure)).toThrow()
    expect(() => parseDiagnosticRetryV4Review(md(review) + md(review), closure)).toThrow("REVIEW_BLOCK")
    expect(() => diagnosticRetryV4SourceClosure(["../outside"])).toThrow()
  })
  it("writes exclusive immutable artifacts at0600 and never overwrites a latch", () => {
    const cwd = temp(), path = join(cwd, "record.json")
    durableRetryV4Create(path, { fixture: "inert" })
    expect(lstatSync(path).mode & 0o777).toBe(0o600)
    expect(JSON.parse(readFileSync(path, "utf8"))).toEqual({ fixture: "inert" })
    expect(() => durableRetryV4Create(path, { fixture: "replacement" })).toThrow()
    mkdirSync("private", { mode: 0o700 })
    expect(lstatSync("private").mode & 0o777).toBe(0o700)
  })
  it("cleans only exact v4-owned names and refuses foreign labels", async () => {
    const a = allocation(), cell = createDiagnosticRetryV4Cell(a, 0), owner = diagnosticRetryV4ContainerIdentity(a, cell, "bottom")
    const calls: readonly string[][] = []
    const foreign = async (args: readonly string[]) => { (calls as string[][]).push([...args]); return { status: 0, signal: null, stdout: "foreign-owner\n", stderr: "", error: false } }
    expect(await cleanupDiagnosticRetryV4ExactOwners(a, foreign)).toBe(false)
    expect(calls).toEqual([["inspect", "--format", '{{index .Config.Labels "v1.38-lean-owner"}}', owner.containerName]])
    const missing = async (args: readonly string[]) => ({ status: 1, signal: null, stdout: "", stderr: `Error: No such object: ${args.at(-1)}\n`, error: false })
    expect(await cleanupDiagnosticRetryV4ExactOwners(a, missing)).toBe(true)
  })
  it("requires ordered parent IPC, clean exit and cleanup with injected children only", async () => {
    const a = allocation(), start = createDiagnosticRetryV4Start(a, createDiagnosticRetryV4Cell(a, 0))
    const child = new EventEmitter() as any
    child.pid = 99999999; child.stdout = new EventEmitter(); child.stderr = new EventEmitter(); child.kill = vi.fn()
    let now = 0
    const task = superviseDiagnosticRetryV4Attempt(a, 0, { now: () => now, cleanup: async () => true, spawn: () => child })
    child.emit("message", { kind: "started", startRoot: start.root }); now = 50
    child.emit("message", { kind: "done", startRoot: start.root, terminalRoot: hash("terminal"), status: "process_valid" }); child.emit("exit", 0)
    expect(await task).toMatchObject({ status: "process_valid", cleanupComplete: true, terminalRoot: hash("terminal"), elapsedMilliseconds: 50 })
  })
  it("executes the real serial harness and reopens all five durable fixture failures without host work", async () => {
    temp()
    const e = envelope(), allocations = createDiagnosticRetryV4AllocationSet(e)
    const checkEnvelope = vi.fn(() => ({ envelope: e, allocations }))
    const observed: number[] = [], supervised: number[] = []
    const repository = ".strategy-lab/league-265-retry-v4"
    await runDiagnosticRetryV4Live("inert-envelope", "inert-allocation", repository, {
      checkEnvelope, observe: async (a) => { observed.push(a.attemptOrdinal); return observation },
      supervise: async (a) => {
        supervised.push(a.attemptOrdinal)
        const cell = createDiagnosticRetryV4Cell(a, 0), start = createDiagnosticRetryV4Start(a, cell), ledger = openDiagnosticRetryV4Ledger(a.store)
        ledger.writeStart(start)
        for (const [ordinal, stage] of ["bottom_issuance", "top_issuance", "pre_kernel_binding"].entries()) ledger.writeStage(createDiagnosticRetryV4Stage(start, ordinal, stage as never))
        ledger.writeRunAttempt(start); ledger.writeStage(createDiagnosticRetryV4Stage(start, 3, "kernel_or_callback"))
        const partial = retainDiagnosticRetryV4PartialEvidence(ledger, start)
        ledger.writeStage(createDiagnosticRetryV4Stage(start, 5, "terminal_publication"))
        const terminal = createDiagnosticRetryV4Terminal(start, { disposition: "system_failure", processValidity: "process_invalid", evidenceRoot: partial.evidenceRoot, cleanupComplete: true, elapsedMilliseconds: 100, artifactBytes: partial.artifactBytes, artifactRecords: partial.artifactRecords, code: "system_failure", lastEnteredStage: "terminal_publication", failureStage: "kernel_or_callback", cause: "unknown_internal" })
        ledger.writeTerminal(terminal)
        return { status: "process_invalid", cleanupComplete: true, timedOut: false, exitCode: 0, terminalRoot: terminal.root, elapsedMilliseconds: 100 }
      },
    })
    expect(observed).toEqual([1, 2, 3, 4, 5]); expect(supervised).toEqual(observed)
    const reopened = checkDiagnosticRetryV4Retained("inert-envelope", "inert-allocation", repository, checkEnvelope)
    expect(reopened.stopReason).toBe("cap")
    expect(reopened.entries).toHaveLength(5)
    expect(reopened.entries.every((entry) => entry.chargedCount === 1 && entry.status === "process_invalid")).toBe(true)
    expect(reopened.unusedOrdinals).toEqual([])
    await expect(runDiagnosticRetryV4Live("inert-envelope", "inert-allocation", repository, { checkEnvelope, observe: async () => observation })).rejects.toThrow()
  })
  it("refuses all live selectors without a reviewed envelope before creating stores", async () => {
    temp()
    await expect(main(["run", "--envelope", "missing.json", "--allocation", "missing.json", "--repository", ".strategy-lab/league-265-retry-v4"])).rejects.toThrow()
    await expect(main(["prepare-envelope", "--closure", "missing.json", "--review", "missing.md", "--authorization-message", "missing.txt", "--envelope", "envelope.json", "--allocation", "allocation.json"])).rejects.toThrow()
  })
})
