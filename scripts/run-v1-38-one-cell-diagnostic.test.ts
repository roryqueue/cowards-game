import { existsSync, linkSync, mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { EventEmitter } from "node:events"
import type { ChildProcess } from "node:child_process"
import { performance } from "node:perf_hooks"
import { createHash, createPublicKey } from "node:crypto"
import { labRoot, type LabRoot } from "../packages/strategy-lab/src/contracts.js"
import { DIAGNOSTIC_ONE_CELL_STORE, DIAGNOSTIC_ONE_CELL_PREFLIGHT_ATTEMPT_PATH, DIAGNOSTIC_ONE_CELL_PREFLIGHT_DISPOSITION_PATH, createDiagnosticOneCellAllocation, createDiagnosticOneCellCell, createDiagnosticOneCellStart, openDiagnosticOneCellLedger } from "../packages/strategy-lab/src/league/diagnostic-one-cell.js"
import {
  ONE_CELL_OPERATION_BUDGET,
  ONE_CELL_GATE_PATH,
  ONE_CELL_PARENT_PERMIT_PATHS,
  ONE_CELL_PREFLIGHT_PENDING_PATH,
  ONE_CELL_PUBLISHER_RECEIPT_PATHS,
  ONE_CELL_RECEIPT_PATH,
  ONE_CELL_REVIEW_PATH,
  ONE_CELL_REVIEWER_PUBLIC_KEY_PEM,
  ONE_CELL_SELECTOR_ATTEMPT_PATHS,
  ONE_CELL_SOURCE_FILES,
  admitOneCellPreflightDisposition,
  canStartOneCell,
  createOneCellPreflightAttempt,
  createOneCellPreflightDisposition,
  createOneCellParentPermit,
  createOneCellPublisherReceipt,
  createOneCellOperatorAuthorization,
  createOneCellSelectorAttempt,
  executeOneCellPreflightOnce,
  observeOneCellHost,
  oneCellRequiredGateCommands,
  oneCellOperatorLiteral,
  prepareOneCellPublisherReceiptAfterCanonicalFsync,
  publishOneCellCommitSequence,
  oneCellSourceClosure,
  checkOneCellSourceGate,
  checkOneCellExactOwnersAbsent,
  requireAdmittedOneCellPreflight,
  requireOneCellPublisherCommit,
  runOneCellWorkerCell,
  runOneCellWatchdog,
  superviseOneCellLive,
  superviseOneCellEmergencyCleanup,
  superviseOneCellSelectorAttempt,
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

  it("keeps a child-admitted preflight pending and unusable if the parent never publishes", async () => {
    store(); mkdirSync(".planning/artifacts", { recursive: true })
    const allocation = allocated(), approval = hash("approval")
    const observation = { fileSystemBytes: "99999999999", fileSystemInodes: "999999999", memoryBasisPoints: 2500, memoryAvailableBytes: 1_073_741_824, dockerCpus: 2, dockerMemoryBytes: 268_435_456, imageDigest: hash("image"), architecture: "amd64" as const, ownedNameCollisions: 0 as const, readerMilliseconds: 1 }
    const pending = await executeOneCellPreflightOnce(allocation, approval, async () => observation, { attempt: DIAGNOSTIC_ONE_CELL_PREFLIGHT_ATTEMPT_PATH, disposition: ONE_CELL_PREFLIGHT_PENDING_PATH })
    expect(pending.status).toBe("admitted")
    expect(existsSync(ONE_CELL_PREFLIGHT_PENDING_PATH)).toBe(true)
    expect(existsSync(DIAGNOSTIC_ONE_CELL_PREFLIGHT_DISPOSITION_PATH)).toBe(false)
    await expect(executeOneCellPreflightOnce(allocation, approval, async () => observation, { attempt: DIAGNOSTIC_ONE_CELL_PREFLIGHT_ATTEMPT_PATH, disposition: ONE_CELL_PREFLIGHT_PENDING_PATH })).rejects.toThrow()
    expect(existsSync(DIAGNOSTIC_ONE_CELL_PREFLIGHT_DISPOSITION_PATH)).toBe(false)
  })

  it("requires the exact surviving publisher receipt after the parent permit and canonical fsync", () => {
    store(); mkdirSync(".planning/artifacts", { recursive: true })
    const gateRoot = hash("gate"), authorizationRoot = hash("authorization"), allocationRoot = hash("allocation")
    const permit = createOneCellParentPermit({ selector: "prepare", status: "finished", token: "11111111-2222-3333-4444-555555555555", gateRoot, authorizationRoot, allocationRoot, context: { pendingRoot: allocationRoot, stageTranscript: ["source", "approval", "history", "reservation"], childElapsedMilliseconds: 12, parentElapsedBeforePublisherMilliseconds: 14 } })
    const receipt = createOneCellPublisherReceipt(permit, allocationRoot, 20)
    writeFileSync(ONE_CELL_PARENT_PERMIT_PATHS.prepare, JSON.stringify(permit))
    expect(() => requireOneCellPublisherCommit("prepare", allocationRoot, gateRoot, authorizationRoot, allocationRoot)).toThrow()
    writeFileSync(ONE_CELL_PUBLISHER_RECEIPT_PATHS.prepare, JSON.stringify(receipt))
    expect(requireOneCellPublisherCommit("prepare", allocationRoot, gateRoot, authorizationRoot, allocationRoot)).toEqual(receipt)
    expect(() => requireOneCellPublisherCommit("prepare", hash("wrong-canonical"), gateRoot, authorizationRoot, allocationRoot)).toThrow()
    expect(() => requireOneCellPublisherCommit("prepare", allocationRoot, gateRoot, hash("wrong-authority"), allocationRoot)).toThrow()
    expect(() => createOneCellPublisherReceipt(permit, allocationRoot, 25_001)).toThrow("DEADLINE")
    // Inject a canonical fsync that returned after the publisher budget. The
    // production path calls this gate before creating the final receipt.
    expect(() => prepareOneCellPublisherReceiptAfterCanonicalFsync(permit, allocationRoot, 0, () => 25_001)).toThrow("DEADLINE")
    expect(prepareOneCellPublisherReceiptAfterCanonicalFsync(permit, allocationRoot, 0, () => 25_000).publisherElapsedMilliseconds).toBe(25_000)
    const latePermit = createOneCellParentPermit({ selector: "prepare", status: "finished", token: "11111111-2222-3333-4444-555555555555", gateRoot, authorizationRoot, allocationRoot, context: { pendingRoot: allocationRoot, stageTranscript: ["source", "approval", "history", "reservation"], childElapsedMilliseconds: 299_000, parentElapsedBeforePublisherMilliseconds: 324_990 } })
    expect(() => createOneCellPublisherReceipt(latePermit, allocationRoot, 11)).toThrow("DEADLINE")
  })

  it("rejects aliased parent permit and receipt paths without following them", () => {
    store(); mkdirSync(".planning/artifacts", { recursive: true })
    const gateRoot = hash("gate"), authorizationRoot = hash("authorization"), allocationRoot = hash("allocation")
    const permit = createOneCellParentPermit({ selector: "prepare", status: "finished", token: "11111111-2222-3333-4444-555555555555", gateRoot, authorizationRoot, allocationRoot, context: { pendingRoot: allocationRoot, stageTranscript: ["source", "approval", "history", "reservation"], childElapsedMilliseconds: 12, parentElapsedBeforePublisherMilliseconds: 14 } })
    const receipt = createOneCellPublisherReceipt(permit, allocationRoot, 20)
    writeFileSync(".planning/artifacts/permit-source", JSON.stringify(permit))
    symlinkSync("permit-source", ONE_CELL_PARENT_PERMIT_PATHS.prepare)
    writeFileSync(ONE_CELL_PUBLISHER_RECEIPT_PATHS.prepare, JSON.stringify(receipt))
    expect(() => requireOneCellPublisherCommit("prepare", allocationRoot, gateRoot, authorizationRoot, allocationRoot)).toThrow()
    rmSync(ONE_CELL_PARENT_PERMIT_PATHS.prepare)
    writeFileSync(ONE_CELL_PARENT_PERMIT_PATHS.prepare, JSON.stringify(permit))
    rmSync(ONE_CELL_PUBLISHER_RECEIPT_PATHS.prepare)
    writeFileSync(".planning/artifacts/receipt-source", JSON.stringify(receipt))
    linkSync(".planning/artifacts/receipt-source", ONE_CELL_PUBLISHER_RECEIPT_PATHS.prepare)
    expect(() => requireOneCellPublisherCommit("prepare", allocationRoot, gateRoot, authorizationRoot, allocationRoot)).toThrow()
  })

  it("binds the exclusive selector attempt to the approved literal before live spawn", async () => {
    const gate = { root: hash("gate"), sourceClosureRoot: hash("source") }
    const authorization = createOneCellOperatorAuthorization(gate, oneCellOperatorLiteral(gate))
    const attempt = createOneCellSelectorAttempt("prepare", gate, authorization, authorization.allocationRoot)
    expect(attempt).toMatchObject({ selector: "prepare", gateRoot: gate.root, authorizationRoot: authorization.root, allocationRoot: authorization.allocationRoot, exclusive: true })
    expect(attempt.operatorLiteralSha256).toMatch(/^sha256:[0-9a-f]{64}$/u)
    expect(ONE_CELL_SELECTOR_ATTEMPT_PATHS).toHaveProperty("run")
    expect(() => createOneCellSelectorAttempt("run", gate, authorization, hash("different-allocation"))).toThrow()
    let spawned = false
    await expect(superviseOneCellLive("prepare", [], { now: () => performance.now(), latch: async () => false, spawn: () => { spawned = true; throw new Error("unreachable") }, killGroup: () => {}, cleanup: async () => true })).rejects.toThrow("SELECTOR_ATTEMPT_INVALID")
    expect(spawned).toBe(false)
  })

  it("faults before or after each selector publication step without inventing a commit receipt", () => {
    const gateRoot = hash("gate"), authorizationRoot = hash("authorization"), allocationRoot = hash("allocation")
    const transcripts = {
      prepare: ["source", "approval", "history", "reservation"],
      preflight: ["source", "approval", "history", "attempt", "reader", "filesystem", "memory_docker", "publication"],
      run: ["source", "approval", "history", "attempt", "reader", "filesystem", "memory_docker", "reservation", "cell", "publication"],
    } as const
    for (const selector of ["prepare", "preflight", "run"] as const) {
      const permit = createOneCellParentPermit({ selector, status: "finished", token: "11111111-2222-3333-4444-555555555555", gateRoot, authorizationRoot, allocationRoot, context: { pendingRoot: allocationRoot, stageTranscript: transcripts[selector], childElapsedMilliseconds: 12, parentElapsedBeforePublisherMilliseconds: 14 } })
      for (const faultAt of ["before_pending", "after_pending", "before_permit", "after_permit", "before_canonical", "after_canonical", "before_receipt", "after_receipt"] as const) {
        const persisted: string[] = []
        const step = (name: "pending" | "permit" | "canonical" | "receipt") => {
          if (faultAt === `before_${name}`) throw new Error(faultAt)
          persisted.push(name)
          if (faultAt === `after_${name}`) throw new Error(faultAt)
        }
        expect(() => publishOneCellCommitSequence(permit, allocationRoot, 0, {
          recheckPending: () => { step("pending"); return allocationRoot },
          writePermit: () => step("permit"),
          writeCanonicalAndFsync: () => step("canonical"),
          writeReceiptAndFsync: () => step("receipt"),
          now: () => 20,
        })).toThrow(faultAt)
        expect(persisted.includes("receipt")).toBe(faultAt === "after_receipt")
        if (persisted.includes("canonical")) expect(persisted.includes("permit")).toBe(true)
      }
    }
  })

  it("refuses a late receipt after an injected slow canonical fsync", () => {
    const allocationRoot = hash("allocation")
    const permit = createOneCellParentPermit({ selector: "run", status: "finished", token: "11111111-2222-3333-4444-555555555555", gateRoot: hash("gate"), authorizationRoot: hash("authorization"), allocationRoot, context: { pendingRoot: allocationRoot, stageTranscript: ["source", "approval", "history", "attempt", "reader", "filesystem", "memory_docker", "reservation", "cell", "publication"], childElapsedMilliseconds: 570_000, parentElapsedBeforePublisherMilliseconds: 574_000 } })
    let now = 0, receiptWritten = false
    expect(() => publishOneCellCommitSequence(permit, allocationRoot, 0, { recheckPending: () => allocationRoot, writePermit: () => {}, writeCanonicalAndFsync: () => { now = 25_001 }, writeReceiptAndFsync: () => { receiptWritten = true }, now: () => now })).toThrow("PUBLISHER_RECEIPT_DEADLINE")
    expect(receiptWritten).toBe(false)
  })

  it("treats latch crash or lost completion IPC as no live invocation permission", async () => {
    const child = new EventEmitter() as ChildProcess
    Object.defineProperty(child, "pid", { value: 999_999 })
    let token = "", kills = 0
    child.send = ((_message: unknown, callback?: (error: Error | null) => void) => { callback?.(null); queueMicrotask(() => child.emit("exit", 0)); return true }) as ChildProcess["send"]
    expect(await superviseOneCellSelectorAttempt("prepare", 100, { spawn: (value) => { token = value; queueMicrotask(() => child.emit("message", { kind: "latch-ready", token })); return child }, killGroup: () => { kills++ } })).toBe(false)
    expect(kills).toBe(0)
  })

  it("uses injected fresh host probes and admits inclusive 2500-bp memory only with all other gates", async () => {
    const allocation = allocated()
    const probe = { fileSystem: () => ({ bavail: 100_000_000_000n, bsize: 1n, ffree: 100_000_000n }), memory: () => ({ ok: true, basisPoints: 2500, availableBytes: 1_073_741_824 }), docker: async (args: readonly string[]) => args[0] === "info" ? { status: 0, stdout: "2|268435456\n", stderr: "", signal: null, error: false } : args[0] === "image" ? { status: 0, stdout: `${hash("image")}|amd64\n`, stderr: "", signal: null, error: false } : { status: 1, stdout: "", stderr: `Error: No such object: ${args[3]}\n`, signal: null, error: false }, readCandidates: () => 44_739 }
    expect((await observeOneCellHost(allocation, probe)).memoryBasisPoints).toBe(2500)
    await expect(observeOneCellHost(allocation, { ...probe, memory: () => ({ ok: true, basisPoints: 2499, availableBytes: 1_073_741_824 }) })).rejects.toThrow("MEMORY_CAPACITY")
    await expect(observeOneCellHost(allocation, { ...probe, docker: async (args: readonly string[]) => args[0] === "image" ? { status: 0, stdout: `${hash("wrong-image")}|arm64\n`, stderr: "", signal: null, error: false } : probe.docker(args) })).rejects.toThrow("DOCKER_IMAGE")
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
    expect(canStartOneCell(300_000, 0)).toBe(true)
    expect(canStartOneCell(300_001, 0)).toBe(false)
    expect(() => verifyOneCellComponentBudget({ ...ONE_CELL_OPERATION_BUDGET, sourceCheckMilliseconds: 600_000 })).toThrow()
  })

  it("rejects a structurally complete forged source-gate signature and any changed source byte", () => {
    const digest = (value: Uint8Array) => `sha256:${createHash("sha256").update(value).digest("hex")}` as LabRoot
    const source = (path: string) => readFileSync(path)
    const closure = oneCellSourceClosure(source)
    const reviewerId = "independent-reviewer", authorId = "source-author"
    const fingerprint = digest(createPublicKey(ONE_CELL_REVIEWER_PUBLIC_KEY_PEM).export({ type: "spki", format: "der" }) as Buffer)
    const review = Buffer.from(`Reviewer: ${reviewerId}\nActionable findings: 0\nPublic key fingerprint: ${fingerprint}\nSource closure: ${closure.sourceClosureRoot}\n`)
    const receiptFields = { schemaVersion: "diagnostic-one-cell-command-receipt-v3", sourceClosureRoot: closure.sourceClosureRoot, commands: oneCellRequiredGateCommands().map((command) => ({ command, exitCode: 0, testCount: 1 })), historicalV1Root: hash("history"), historicalV2GateRoot: "sha256:5cf7974145be0fd6d665dc28127aa83fff1b29ce1749dc5b2d6dc4d04bdad6d1", complete: true }
    const receipt = Buffer.from(JSON.stringify({ ...receiptFields, root: labRoot("diagnostic-one-cell-command-receipt-v3", receiptFields) }))
    const fields = { schemaVersion: "diagnostic-one-cell-source-gate-v3", sourceFiles: closure.sourceFiles, sourceClosureRoot: closure.sourceClosureRoot, reviewPath: ONE_CELL_REVIEW_PATH, reviewSha256: digest(review), receiptPath: ONE_CELL_RECEIPT_PATH, receiptSha256: digest(receipt), reviewerId, authorId, actionableFindings: 0, commandsPassed: true, historicalContinuity: true, empiricalAuthority: false, runAllowed: false, leagueRequirementsEvidence: false, freezeAuthorized: false, formationAuthorized: false, holdoutAuthorized: false, counted: false, public: false, productionAuthorized: false }
    const signatureBase64 = Buffer.alloc(64).toString("base64")
    const gate = Buffer.from(JSON.stringify({ ...fields, signatureBase64, root: labRoot("diagnostic-one-cell-source-gate-v3", { ...fields, signatureBase64 }) }))
    const read = (path: string) => path === ONE_CELL_GATE_PATH ? gate : path === ONE_CELL_REVIEW_PATH ? review : path === ONE_CELL_RECEIPT_PATH ? receipt : source(path)
    expect(() => checkOneCellSourceGate(ONE_CELL_GATE_PATH, read)).toThrow("SOURCE_GATE_SIGNATURE")
    const changedSource = (path: string) => path === ONE_CELL_SOURCE_FILES[0] ? Buffer.from("mutated") : read(path)
    expect(() => checkOneCellSourceGate(ONE_CELL_GATE_PATH, changedSource)).toThrow("SOURCE_GATE_DRIFT")
  })

  it("independently rechecks exact owner absence without removing a container", async () => {
    const allocation = allocated(), cell = createDiagnosticOneCellCell(allocation, 0), commands: string[][] = []
    const absent = async (args: readonly string[]) => { commands.push([...args]); return { status: 1, stdout: "", stderr: `Error: No such object: ${args[3]}\n`, signal: null, error: false } }
    expect(await checkOneCellExactOwnersAbsent(allocation, cell, absent)).toBe(true)
    expect(commands).toHaveLength(2)
    expect(commands.every((args) => args[0] === "inspect")).toBe(true)
    expect(await checkOneCellExactOwnersAbsent(allocation, cell, async () => ({ status: 0, stdout: "owned\n", stderr: "", signal: null, error: false }))).toBe(false)
  })

  it("outer supervision kills a hung stage and never accepts skipped run stages", async () => {
    const exercise = async (firstStage: string, hang: boolean) => {
      const child = new EventEmitter() as ChildProcess
      Object.defineProperty(child, "pid", { value: 999_999 })
      child.send = ((_message: unknown, callback?: (error: Error | null) => void) => { callback?.(null); return true }) as ChildProcess["send"]
      let kills = 0
      const host = { now: () => performance.now(), latch: async () => true, spawn: (token: string) => { queueMicrotask(() => child.emit("message", { kind: "stage-ready", token, stage: firstStage })); return child }, killGroup: () => { kills++; queueMicrotask(() => child.emit("exit", null)) }, cleanup: async () => true, stageLimit: () => hang ? 5 : 100 }
      await expect(superviseOneCellLive("run", [], host)).rejects.toThrow("PROCESS_INVALID")
      expect(kills).toBe(1)
    }
    await exercise("source", true)
    await exercise("publication", false)
  })

  it("publishes canonical bytes only after ordered final IPC and clean exit", async () => {
    const exercise = async (sendFinal: boolean) => {
      const child = new EventEmitter() as ChildProcess
      Object.defineProperty(child, "pid", { value: 999_999 })
      const stages = ["source", "approval", "history", "reservation"] as const
      let token = "", index = 0, published = 0
      const ready = () => child.emit("message", { kind: "stage-ready", token, stage: stages[index] })
      child.send = ((message: { kind: string; stage: string }, callback?: (error: Error | null) => void) => {
        callback?.(null)
        queueMicrotask(() => {
          child.emit("message", { kind: "stage-done", token, stage: message.stage, ok: true })
          index++
          if (index < stages.length) ready()
          else { if (sendFinal) child.emit("message", { kind: "live-complete", token, status: "finished", pendingRoot: hash("pending") }); child.emit("exit", 0) }
        })
        return true
      }) as ChildProcess["send"]
      const host = { now: () => performance.now(), latch: async () => true, spawn: (value: string) => { token = value; queueMicrotask(ready); return child }, killGroup: () => { queueMicrotask(() => child.emit("exit", null)) }, cleanup: async () => true, publish: async () => { published++ } }
      if (sendFinal) await superviseOneCellLive("prepare", [], host)
      else await expect(superviseOneCellLive("prepare", [], host)).rejects.toThrow("PROCESS_INVALID")
      return published
    }
    expect(await exercise(true)).toBe(1)
    expect(await exercise(false)).toBe(0)
  })

  it("does not target an exited child's reused process group from a late IPC callback", async () => {
    const child = new EventEmitter() as ChildProcess
    Object.defineProperty(child, "pid", { value: 999_999 })
    let kills = 0
    child.send = ((_message: unknown, callback?: (error: Error | null) => void) => { queueMicrotask(() => { child.emit("exit", 1); callback?.(new Error("late IPC error")) }); return true }) as ChildProcess["send"]
    await expect(superviseOneCellLive("prepare", [], { now: () => performance.now(), latch: async () => true, spawn: (token) => { queueMicrotask(() => child.emit("message", { kind: "stage-ready", token, stage: "source" })); return child }, killGroup: () => { kills++ }, cleanup: async () => true, publish: async () => { throw new Error("unreachable") } })).rejects.toThrow("PROCESS_INVALID")
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(kills).toBe(0)
  })

  it("bounds emergency cleanup in its own process group and rejects missing completion", async () => {
    const makeChild = () => {
      const child = new EventEmitter() as ChildProcess
      Object.defineProperty(child, "pid", { value: 999_999 })
      child.send = ((_message: unknown, callback?: (error: Error | null) => void) => { callback?.(null); return true }) as ChildProcess["send"]
      return child
    }
    let killed = 0
    const hung = makeChild()
    expect(await superviseOneCellEmergencyCleanup(5, { spawn: () => { queueMicrotask(() => hung.emit("message", { kind: "cleanup-ready", token: "wrong-token" })); return hung }, killGroup: () => { killed++; queueMicrotask(() => hung.emit("exit", null)) } })).toBe(false)
    expect(killed).toBe(1)
    const crashed = makeChild()
    expect(await superviseOneCellEmergencyCleanup(100, { spawn: () => { queueMicrotask(() => crashed.emit("exit", 1)); return crashed }, killGroup: () => { killed++ } })).toBe(false)
    expect(killed).toBe(1)
  })

  it("denies cell permission when the parent's command-entry clock has lost its reserve", async () => {
    const stages = ["source", "approval", "history", "attempt", "reader", "filesystem", "memory_docker", "reservation", "cell"] as const
    const child = new EventEmitter() as ChildProcess
    Object.defineProperty(child, "pid", { value: 999_999 })
    let token = "", index = 0, now = 0, kills = 0
    const emitReady = () => child.emit("message", { kind: "stage-ready", token, stage: stages[index] })
    child.send = ((message: { kind: string; stage: string }, callback?: (error: Error | null) => void) => {
      callback?.(null)
      queueMicrotask(() => { child.emit("message", { kind: "stage-done", token, stage: message.stage, ok: true }); index++; if (index === stages.length - 1) now = 300_001; emitReady() })
      return true
    }) as ChildProcess["send"]
    await expect(superviseOneCellLive("run", [], { now: () => now, latch: async () => true, spawn: (value) => { token = value; queueMicrotask(emitReady); return child }, killGroup: () => { kills++; queueMicrotask(() => child.emit("exit", null)) }, cleanup: async () => true, stageLimit: () => 10_000 }, 0)).rejects.toThrow("PROCESS_INVALID")
    expect(kills).toBe(1)
    expect(index).toBe(stages.length - 1)
  })

  it("keeps the nested worker in the outer owned process group", () => {
    const source = readFileSync("scripts/run-v1-38-one-cell-diagnostic.ts", "utf8")
    expect(source).toMatch(/--internal-live-v3[\s\S]*?detached: true/u)
    expect(source).toMatch(/--internal-worker-v3[\s\S]*?detached: false/u)
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

  it("records the truthful entered stage for top, pre-kernel, kernel and first-evidence faults", async () => {
    for (const failure of ["top_issuance", "pre_kernel_binding", "kernel_or_callback", "first_evidence_write"] as const) {
      const allocation = allocated(), cell = createDiagnosticOneCellCell(allocation, 0), start = createDiagnosticOneCellStart(allocation, cell), ledger = store(), sent: unknown[] = []
      ledger.writeStart(start)
      await runOneCellWorkerCell({ allocation, cell, start, ledger, now: () => 100, cellStartedAt: 0,
        issue: (seat) => { if (failure === "top_issuance" && seat === "top") throw new Error("private Strategy source must never persist"); return seat },
        execute: async (_bottom, _top, enteredKernel, enteredEvidence) => { if (failure === "kernel_or_callback" || failure === "first_evidence_write") enteredKernel(); if (failure === "first_evidence_write") enteredEvidence(); throw new Error("private Strategy source must never persist") },
        close: () => true, cleanup: async () => true, send: (message) => { sent.push(message); return true },
      })
      const terminal = ledger.readTerminal(start.root) as { readonly failureStage?: string; readonly cause?: string } | null
      expect(terminal?.failureStage).toBe(failure)
      expect(terminal?.cause).toBe("unknown_internal")
      expect(JSON.stringify(terminal)).not.toContain("private Strategy source")
      expect(sent).toEqual([{ kind: "cell-complete", ordinal: 0 }, { kind: "done", status: "process_invalid" }])
    }
  })

  it("does not signal success when terminal publication or post-link acknowledgement is uncertain", async () => {
    for (const fault of ["before", "after"] as const) {
      const allocation = allocated(), cell = createDiagnosticOneCellCell(allocation, 0), start = createDiagnosticOneCellStart(allocation, cell), ledger = store(), sent: unknown[] = []
      ledger.writeStart(start)
      await runOneCellWorkerCell({ allocation, cell, start, ledger, now: () => 100, cellStartedAt: 0,
        issue: (seat) => seat,
        execute: async (_bottom, _top, enteredKernel, enteredEvidence) => { enteredKernel(); enteredEvidence(); return { disposition: "system_failure", processValidity: "process_invalid", evidenceRoot: null, artifactBytes: 0, artifactRecords: 0, cleanupComplete: true } },
        close: () => true, cleanup: async () => true, send: (message) => { sent.push(message); return true },
        beforeTerminalWrite: fault === "before" ? () => { throw new Error("publication uncertain") } : undefined,
        afterTerminalWrite: fault === "after" ? () => { throw new Error("post-link acknowledgement uncertain") } : undefined,
      })
      expect((ledger.readTerminal(start.root) as { readonly processValidity?: string } | null)?.processValidity ?? "process_invalid").toBe("process_invalid")
      expect(sent).not.toContainEqual({ kind: "done", status: "process_valid" })
      if (fault === "before") expect(sent).toEqual([])
    }
  })

  it("requires one ordered worker completion and exit zero, denying lost or duplicate IPC", async () => {
    const allocation = allocated(), cell = createDiagnosticOneCellCell(allocation, 0), start = createDiagnosticOneCellStart(allocation, cell)
    const exercise = async (messages: readonly unknown[], exitCode = 0) => {
      const child = new EventEmitter() as ChildProcess
      Object.defineProperty(child, "pid", { value: 999_999 })
      child.send = ((_message: unknown, callback?: (error: Error | null) => void) => { callback?.(null); return true }) as ChildProcess["send"]
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
