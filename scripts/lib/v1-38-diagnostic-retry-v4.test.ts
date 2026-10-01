import { createHash } from "node:crypto"
import { mkdirSync, mkdtempSync, realpathSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { CANONICAL_ARENA_CATALOG_V1_37 } from "@cowards/spec"
import { MATCH_KERNEL } from "../../packages/engine/src/index.js"
import { LAB_ADMITTED_ROOTS, labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { runCanonicalLabMatch, type LabRuntimeEvidence, type LabSupervisedProvider } from "../../packages/strategy-lab/src/runtime-bridge.js"
import * as diagnosticApi from "./v1-38-diagnostic-retry-v4.js"
import { runDiagnosticRetryV4CanonicalFromBridge } from "./v1-38-diagnostic-retry-v4-bridge.js"
vi.mock("./v1-38-diagnostic-retry-v4-bridge.js", async (original) => ({ ...await original<typeof import("./v1-38-diagnostic-retry-v4-bridge.js")>(), runDiagnosticRetryV4CanonicalFromBridge: vi.fn() }))
import {
  createDiagnosticRetryV4Allocation, admitDiagnosticRetryV4Allocation,
  createDiagnosticRetryV4Cell, createDiagnosticRetryV4Start, createDiagnosticRetryV4Stage,
  openDiagnosticRetryV4Ledger, reopenDiagnosticRetryV4Ledger,
  requireDiagnosticRetryV4LifetimeGrant, verifyDiagnosticRetryV4Ledger,
  verifyRetainedDiagnosticRetryV4Execution, safeDiagnosticRetryV4Cause,
  runAndRetainCanonicalDiagnosticRetryV4, createDiagnosticRetryV4Terminal,
  type DiagnosticRetryV4Ledger,
} from "./v1-38-diagnostic-retry-v4.js"

const originalCwd = process.cwd(), temporaryRoots: string[] = []
afterEach(() => { process.chdir(originalCwd); for (const path of temporaryRoots.splice(0)) rmSync(path, { recursive: true, force: true }) })
const hash = (value: string): LabRoot => labRoot("retry-v4-unit-only", value)
const baseline = { oldAllocationV2: hash("v2"), oldAllocationUnversioned: hash("v1"), oldResult: hash("old-result"), oldLeagueTree: hash("old-league"), oldFactoryTree: hash("old-factory") }
const allocation = (ordinal = 1) => createDiagnosticRetryV4Allocation({ attemptOrdinal: ordinal, envelopeRoot: hash("envelope"), sourceClosureRoot: hash("source"), implementationRoot: hash("implementation"), gateRoot: hash("review"), oldEvidenceBaseline: baseline })
const setup = (ordinal = 1) => {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), "retry-v4-unit-")))
  temporaryRoots.push(directory)
  process.chdir(directory)
  mkdirSync(".strategy-lab", { mode: 0o700 })
  const a = allocation(ordinal)
  mkdirSync(a.store, { mode: 0o700 })
  const cell = createDiagnosticRetryV4Cell(a, 0), start = createDiagnosticRetryV4Start(a, cell)
  const ledger = openDiagnosticRetryV4Ledger(a.store)
  ledger.writeStart(start)
  for (let index = 0; index < 3; index++) ledger.writeStage(createDiagnosticRetryV4Stage(start, index, ["bottom_issuance", "top_issuance", "pre_kernel_binding"][index] as never))
  const runPermit = ledger.writeRunAttempt(start)
  ledger.writeStage(createDiagnosticRetryV4Stage(start, 3, "kernel_or_callback"))
  return { a, cell, start, ledger, runPermit }
}

/** Genuine canonical transitions, but exclusively injected inert effects. No
 * guest source, Docker, host preflight or operational allocation is executed. */
const kernelFixture = async (f: ReturnType<typeof setup>) => {
  const provider = (side: "bottom" | "top"): LabSupervisedProvider => {
    let ordinal = 0
    const identity = { revisionId: `fixture-${side}`, sourceRoot: hash(side), executableRoot: hash(side), tupleId: MATCH_KERNEL.tupleId, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, image: LAB_ADMITTED_ROOTS.image, harnessRoot: hash("fixture-harness"), budgetRoot: f.a.root, attemptRoot: f.start.root, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot }
    const issued = new WeakSet<object>()
    return { identity, invoke(request) {
      const evidence: LabRuntimeEvidence = { identity, requestId: request.requestId, method: request.kind, inputRoot: labRoot("runtime-input", request.input), ordinal: ordinal++, invocationRoot: hash(request.requestId), charged: true, completed: true, outputBytes: 45, result: { ok: true, value: { activationOrders: [], strategyMemory: null } } }
      issued.add(evidence); return evidence
    }, verify: (e) => issued.has(e), close: () => ({ cleanupComplete: true, orphanedChild: false }) }
  }
  const execution = await runCanonicalLabMatch({ match: { matchId: "source-only-retry-v4-effect-fixture", seed: f.a.seed, arenaVariant: CANONICAL_ARENA_CATALOG_V1_37.arenas.find((arena) => arena.id === "arena:smoke:v1")!, bottomPlayerId: "bottom", topPlayerId: "top", bottomStrategyRevisionId: "fixture-bottom", topStrategyRevisionId: "fixture-top", initialInitiativePlayerId: "bottom", maxPhases: 1 }, providers: { bottom: provider("bottom"), top: provider("top") } })
  expect(execution.kind).toBe("completed")
  if (execution.kind !== "completed") throw Error("canonical fixture failed")
  expect(execution.transitions.some((row, index) => index > 0 && execution.transitions[index - 1]!.afterMachineHash !== row.beforeMachineHash)).toBe(true)
  expect(execution.transitions.every((row, index) => index === 0 || execution.transitions[index - 1]!.afterStateHash === row.beforeStateHash)).toBe(true)
  return execution
}

/** Dependency injection exists only in this test module. Production exposes no
 * result mint or complete retainer. The real wrapper consumes its durable permit. */
const retainFixture = async (f: ReturnType<typeof setup>, execution: Awaited<ReturnType<typeof kernelFixture>>) => {
  vi.mocked(runDiagnosticRetryV4CanonicalFromBridge).mockResolvedValueOnce(execution)
  return runAndRetainCanonicalDiagnosticRetryV4({ ledger: f.ledger, allocation: f.a, cell: f.cell, start: f.start, runPermit: f.runPermit, bridgePermit: {} as never, onKernelEntry: () => {}, onEvidenceStart: () => {} })
}
/** Reroot a mutation rather than relying on an easy byte-hash mismatch. All
 * physical fixture bytes stay untouched; the reader sees a complete overlay. */
const mutateRetained = (f: ReturnType<typeof setup>, evidenceRoot: LabRoot, mutate: (rows: Record<string, unknown>[]) => void) => {
  const blobs = new Map<LabRoot, Uint8Array>()
  for (const name of f.ledger.listNames()) {
    const match = /\.evidence-([a-f0-9]{64})\.bin$/u.exec(name)
    if (match) { const root = `sha256:${match[1]}` as LabRoot; blobs.set(root, f.ledger.readEvidence(f.start.root, root)) }
  }
  const put = (value: unknown, raw = false): LabRoot => { const bytes = Buffer.from(raw ? value as string : JSON.stringify(value), "utf8"), root = `sha256:${createHash("sha256").update(bytes).digest("hex")}` as LabRoot; blobs.set(root, bytes); return root }
  const manifest = JSON.parse(Buffer.from(blobs.get(evidenceRoot)!).toString("utf8"))
  const roots: LabRoot[] = manifest.transitionIndexRoots.flatMap((root: LabRoot) => JSON.parse(Buffer.from(blobs.get(root)!).toString("utf8")).roots)
  const rows = Buffer.concat(roots.map((root) => Buffer.from(blobs.get(root)!))).toString("utf8").trimEnd().split("\n").map((line) => JSON.parse(line))
  mutate(rows)
  blobs.delete(evidenceRoot)
  for (const root of [...roots, ...manifest.transitionIndexRoots]) blobs.delete(root)
  const transitionRoot = put(rows.map((row) => JSON.stringify(row)).join("\n") + "\n", true)
  const page = put({ schemaVersion: "diagnostic-retry-evidence-index-v4", roots: [transitionRoot] })
  const mutatedRoot = put({ ...manifest, transitionIndexRoots: [page], transitionChunkCount: 1 })
  const ledger = { ...f.ledger, readEvidence: (_start: LabRoot, root: LabRoot) => { const bytes = blobs.get(root); if (!bytes) throw Error("missing overlay evidence"); return bytes }, listNames: () => [...f.ledger.listNames().filter((name) => !name.includes(".evidence-")), ...[...blobs.keys()].map((root) => `diagnostic-retry-${f.start.root.slice(7)}.evidence-${root.slice(7)}.bin`)].sort() } satisfies DiagnosticRetryV4Ledger
  return { ledger, mutatedRoot }
}

describe("retry-v4 source-only evidence and durable grant contracts", () => {
  it("measures genuine effect/resume row sizes without exposing private payloads", async () => {
    const execution = await kernelFixture(setup())
    const sizes = execution.transitions.map((row) => Buffer.byteLength(JSON.stringify(row)))
    console.info(JSON.stringify({ fixture: "inert-canonical-effect-resume", transitions: sizes.length, maximumTransitionBytes: Math.max(...sizes), rowsAboveLegacy8192: sizes.filter((size) => size > 8192).length }))
    expect(Math.max(...sizes)).toBeGreaterThan(8192)
  })
  it("limits additional ordinals to five with distinct namespaces and identical seed/condition/runtime bounds", () => {
    const all = [1, 2, 3, 4, 5].map(allocation)
    expect(new Set(all.map((a) => a.root)).size).toBe(5)
    expect(new Set(all.map((a) => a.store)).size).toBe(5)
    expect(new Set(all.map((a) => a.seed)).size).toBe(1)
    expect(new Set(all.map((a) => a.cells[0].requestIdentity)).size).toBe(1)
    for (const a of all) {
      expect(admitDiagnosticRetryV4Allocation(a)).toEqual(a)
      expect(a).toMatchObject({ perMatchMilliseconds: 240000, overallMilliseconds: 600000, cleanupReserveMilliseconds: 30000, retryCount: 0, leagueRequirementsEvidence: false, formationAuthorized: false, holdoutAuthorized: false, counted: false, public: false, productionAuthorized: false })
    }
    for (const ordinal of [0, 6, 1.5]) expect(() => allocation(ordinal)).toThrow("ALLOCATION_SOURCE")
    expect(() => admitDiagnosticRetryV4Allocation({ ...all[0], store: ".strategy-lab/league-265-one-cell-diagnostic-v3-20260929-a" })).toThrow("ALLOCATION_MISMATCH")
  })

  it("retains and reopens genuine canonical effect/resume rows despite machine-hash gaps", async () => {
    const f = setup(), execution = await kernelFixture(f)
    const retained = await retainFixture(f, execution)
    expect(verifyRetainedDiagnosticRetryV4Execution(f.ledger, f.a, f.cell, f.start, retained.evidenceRoot)).toMatchObject({ disposition: "success", transitionCount: execution.transitions.length, accountingCount: execution.accounting.length, artifactBytes: retained.artifactBytes, artifactRecords: retained.artifactRecords })
    const initial = MATCH_KERNEL.createMachineV119({ matchId: "board-fixture", seed: f.a.seed, arenaVariant: CANONICAL_ARENA_CATALOG_V1_37.arenas.find((arena) => arena.id === "arena:smoke:v1")!, bottomPlayerId: "bottom", topPlayerId: "top", bottomStrategyRevisionId: "fixture-bottom", topStrategyRevisionId: "fixture-top", initialInitiativePlayerId: "bottom" }).initialState
    expect(initial.soldiers).toHaveLength(16)
    for (const position of [...initial.soldiers.map((s) => s.position), ...initial.terrainStones]) {
      expect(position).not.toBeNull()
      expect(position!.x).toBeGreaterThanOrEqual(initial.bounds.minX); expect(position!.x).toBeLessThanOrEqual(initial.bounds.maxX)
      expect(position!.y).toBeGreaterThanOrEqual(initial.bounds.minY); expect(position!.y).toBeLessThanOrEqual(initial.bounds.maxY)
    }
  })

  it("rejects mutated gameplay continuity in both producer and hash-valid reopened evidence", async () => {
    const f = setup(), execution = await kernelFixture(f)
    const mutated = structuredClone(execution)
    ;(mutated.transitions[1] as { beforeStateHash: string }).beforeStateHash = hash("wrong-state")
    const invalid = setup(2)
    await expect(retainFixture(invalid, mutated)).rejects.toThrow("EVIDENCE_TRANSITION_CHAIN")
    process.chdir(originalCwd)
    process.chdir(join(f.ledger.directory, "../.."))
    const retained = await retainFixture(f, execution)
    const overlay = mutateRetained(f, retained.evidenceRoot, (rows) => { rows[1]!.beforeStateHash = hash("wrong-state") })
    expect(() => verifyRetainedDiagnosticRetryV4Execution(overlay.ledger, f.a, f.cell, f.start, overlay.mutatedRoot)).toThrow("EVIDENCE_TRANSITION")
  })

  it.each(["machine-hash", "schema", "events", "terminal"])("rejects hash-valid %s mutation without discarding other checks", async (fault) => {
    const f = setup(), execution = await kernelFixture(f), retained = await retainFixture(f, execution)
    const overlay = mutateRetained(f, retained.evidenceRoot, (rows) => {
      if (fault === "machine-hash") rows[0]!.beforeMachineHash = "invalid"
      if (fault === "schema") rows[0]!.privateMemory = "must not be admitted"
      if (fault === "events") rows[0]!.events = [{ type: "invented-event" }]
      if (fault === "terminal") rows.at(-1)!.terminalStatus = { type: "not-canonical" }
    })
    expect(() => verifyRetainedDiagnosticRetryV4Execution(overlay.ledger, f.a, f.cell, f.start, overlay.mutatedRoot)).toThrow()
  })

  it("rejects orphan and missing evidence and accounting identity substitutions", async () => {
    const f = setup(), execution = await kernelFixture(f), retained = await retainFixture(f, execution)
    const wrongAccounting = structuredClone(execution)
    wrongAccounting.accounting[0]!.identity.attemptRoot = hash("different-attempt")
    const g = setup(2)
    const adjusted = structuredClone(wrongAccounting)
    for (const row of adjusted.accounting) row.identity.budgetRoot = g.a.root
    await expect(retainFixture(g, adjusted)).rejects.toThrow("EVIDENCE_ACCOUNTING")
    process.chdir(join(f.ledger.directory, "../.."))
    expect(() => verifyRetainedDiagnosticRetryV4Execution({ ...f.ledger, readEvidence: () => { throw Error("missing bytes") } }, f.a, f.cell, f.start, retained.evidenceRoot)).toThrow("missing bytes")
    f.ledger.writeEvidence(f.start.root, Buffer.from("unreferenced unit fixture"))
    expect(() => verifyRetainedDiagnosticRetryV4Execution(f.ledger, f.a, f.cell, f.start, retained.evidenceRoot)).toThrow("EVIDENCE_ORPHAN")
  })

  it("exposes neither a complete producer nor a lifetime mint, and rejects unissued claims", () => {
    expect("retainDiagnosticRetryV4Execution" in diagnosticApi).toBe(false)
    expect("issueDiagnosticRetryV4LifetimeGrant" in diagnosticApi).toBe(false)
    const f = setup()
    expect(() => requireDiagnosticRetryV4LifetimeGrant({ schemaVersion: "diagnostic-retry-lifetime-grant-v4" }, {} as never)).toThrow("GRANT_UNISSUED")
    expect(() => requireDiagnosticRetryV4LifetimeGrant({ schemaVersion: "diagnostic-one-cell-lifetime-grant-v3" }, {} as never)).toThrow("GRANT_UNISSUED")
    expect(() => f.ledger.writeRunAttempt(f.start)).toThrow("PRECONDITION")
  })

  it("burns a run permit before callback failure and rejects synthetic or reused permits", async () => {
    const f = setup(), input = { ledger: f.ledger, allocation: f.a, cell: f.cell, start: f.start, runPermit: f.runPermit, bridgePermit: {} as never, onKernelEntry: () => { throw Error("injected unit callback") }, onEvidenceStart: () => {} }
    await expect(runAndRetainCanonicalDiagnosticRetryV4(input)).rejects.toThrow("injected unit callback")
    await expect(runAndRetainCanonicalDiagnosticRetryV4(input)).rejects.toThrow("CANONICAL_RUN_PERMIT")
    await expect(runAndRetainCanonicalDiagnosticRetryV4({ ...input, runPermit: {} as never })).rejects.toThrow("CANONICAL_RUN_PERMIT")
  })

  it("never retains arbitrary error text or private payloads as causes", () => {
    expect(safeDiagnosticRetryV4Cause(new Error("DIAGNOSTIC_RETRY_V4_EVIDENCE_ROW_CAP"))).toBe("evidence_row_cap")
    for (const value of [new Error("private Strategy source /secret/path"), "DIAGNOSTIC_RETRY_V4_EVIDENCE_ROW_CAP", { message: "secret memory" }, null]) expect(safeDiagnosticRetryV4Cause(value)).toBe("unknown_internal")
    expect(safeDiagnosticRetryV4Cause(new Error("DIAGNOSTIC_RETRY_V4_EVIDENCE_TRANSITION_CHAIN"))).not.toBe("unknown_internal")
  })

  it("refuses an uncharged start and blocks grants after uncertain durable publication", () => {
    const f = setup(), directory = realpathSync(mkdtempSync(join(tmpdir(), "retry-v4-uncertain-unit-")))
    temporaryRoots.push(directory); process.chdir(directory); mkdirSync(".strategy-lab", { mode: 0o700 })
    const a = allocation(2), cell = createDiagnosticRetryV4Cell(a, 0), start = createDiagnosticRetryV4Start(a, cell)
    mkdirSync(a.store, { mode: 0o700 })
    const ordinary = openDiagnosticRetryV4Ledger(a.store)
    ordinary.writeStart(start)
    expect(() => verifyDiagnosticRetryV4Ledger(ordinary, a, cell, start)).toThrow("PRECHARGE_ABSENT_OR_TERMINAL")
    for (let index = 0; index < 3; index++) ordinary.writeStage(createDiagnosticRetryV4Stage(start, index, ["bottom_issuance", "top_issuance", "pre_kernel_binding"][index] as never))
    const uncertain = openDiagnosticRetryV4Ledger(a.store, { beforeDirectorySync: () => { throw Error("injected fsync refusal") } })
    expect(() => uncertain.writeRunAttempt(start)).toThrow("injected fsync refusal")
    expect(uncertain.hasUncertainPublication()).toBe(true)
    expect(() => verifyDiagnosticRetryV4Ledger(uncertain, a, cell, start)).toThrow("PRECHARGE_ABSENT_OR_TERMINAL")
    expect(() => uncertain.writeRunAttempt(start)).toThrow("PRECONDITION")
    expect(f.a.attemptOrdinal).toBe(1)
  })
})
