import { describe, expect, it, vi } from "vitest"
it("one-Match v2 exposes only explicit versioned route commands", () => {
  expect(route.parseLeanPrivateMatchesArgsV2(["metadata-v2", "--source-store", authority.LEAN_PRIVATE_MATCH_SOURCE_STORE_V1])).toEqual({ command: "metadata", sourceStore: authority.LEAN_PRIVATE_MATCH_SOURCE_STORE_V1 })
  expect(() => route.parseLeanPrivateMatchesArgsV1(["metadata-v2", "--source-store", authority.LEAN_PRIVATE_MATCH_SOURCE_STORE_V1])).toThrow()
  expect(route.produceLeanPrivateMatchEvidenceV2).toBeTypeOf("function")
  expect(route.verifyLeanPrivateMatchesStoreV2).toBeTypeOf("function")
})
import * as route from "./run-v1-38-lean-private-matches.js"
import { mkdtempSync, readFileSync, writeFileSync, readdirSync, rmSync, realpathSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { CANONICAL_ARENA_CATALOG_V1_37, BOTTOM_STARTING_POSITIONS, TOP_STARTING_POSITIONS } from "@cowards/spec"
import { labRoot } from "../packages/strategy-lab/src/contracts.js"
import { deriveFactoryOrderedRecordDescriptor } from "../packages/strategy-lab/src/factory/admission.js"
import { leanCanonicalBytes, leanBytesRoot } from "../packages/strategy-lab/src/league/lean-experiment.js"
import type { LabMatchExecution } from "../packages/strategy-lab/src/runtime-bridge.js"
import type { LeanPrivateMatchAllocationV1 } from "./lib/v1-38-lean-experiment-authority.js"
import { readLeanPrivateMatchGitV1 } from "./lib/v1-38-lean-container-match-session.js"
import { LEAN_PRIVATE_MATCH_WINDOW_V1 } from "./lib/v1-38-lean-experiment-authority.js"
import * as authority from "./lib/v1-38-lean-experiment-authority.js"
import * as composer from "./lib/v1-38-lean-baseline-match.js"
import * as source from "./lib/v1-38-lean-baseline-source.js"
const gitCalls = vi.hoisted(() => ({ calls: [] as Array<{ program: string; args: string[]; options: Record<string, unknown> }>, responses: [] as Buffer[] }))
vi.mock("node:child_process", async importOriginal => {
  const actual = await importOriginal<typeof import("node:child_process")>()
  return { ...actual, execFileSync: (program: string, args: string[], options: Record<string, unknown>) => { gitCalls.calls.push({ program, args, options }); return gitCalls.responses.shift() ?? Buffer.from("INERT_METADATA_NOT_AUTHORITY") } }
})

const r = (n: number) => labRoot("inert-private-pair-fixture", n)
const fixture = () => {
  const sources = (["tactical-0", "cold-opponent"] as const).map((role, n) => ({ role, rawRoot: r(n + 1), snapshotRoot: r(n + 3), sourceRoot: r(n + 5), sourceBytes: 1, fileBytes: 1, structureRoot: r(n + 7), packetRoot: r(n + 9), proposalRoot: r(n + 11), validationRoot: r(n + 13), coldRoot: r(15), implementationRoot: r(16), executableRoot: r(n + 17) })) as unknown as LeanPrivateMatchAllocationV1["sources"]
  const rows = [{ name: "scripts/inert.ts", rawRoot: r(20), bytes: 1, allocatedBytes: 4096 }]
  const carryBody = { failedRoot: r(21), successRoot: r(22), retainedBytes: 65536 as const }
  const allocation = route.createLeanPrivateMatchAllocationV1({ sourceHead: "a".repeat(40), sources, sourcePrefix: { root: labRoot("lean-private-match-source-prefix-v1", rows), allocatedBytes: 4096, rows }, priorProbeCarry: { ...carryBody, root: labRoot("lean-private-match-probe-carry-v1", carryBody) } })
  const debitRoot = r(24), bottom = `lean-source-${sources[0].sourceRoot.slice(7)}`, top = `lean-source-${sources[1].sourceRoot.slice(7)}`
  const providerIdentities = sources.map(s => ({ revisionId: "inert-revision", sourceRoot: s.sourceRoot, executableRoot: s.executableRoot!, tupleId: allocation.tupleId, tupleRoot: allocation.tupleRoot, image: allocation.image, harnessRoot: allocation.harnessRoot, budgetRoot: allocation.root, attemptRoot: debitRoot, runtimeLimitsRoot: allocation.runtimeLimitsRoot, nativeLane: { language: "typescript", providerId: "lean-offline-mechanics", runtimeAbi: "strategy-runtime-abi-v1.19", runtimeProfileRoot: allocation.runtimeLimitsRoot, translation: "none" }, factoryPacketRoot: s.packetRoot, factoryProposalRoot: s.proposalRoot, factoryValidationRoot: s.validationRoot }))
  const arena = CANONICAL_ARENA_CATALOG_V1_37.arenas.find(a => a.id === "arena:smoke:v1")!
  const start = { matchId: `lean-${debitRoot.slice(7, 31)}`, phase: "ROUND", phaseNumber: 1, roundNumber: 1, activationCount: 1, initiativePlayerId: bottom, bounds: arena.initialBounds, soldiers: [...BOTTOM_STARTING_POSITIONS.map((position, n) => ({ id: `bottom-soldier-${n + 1}`, ownerPlayerId: bottom, status: "ACTIVE", position, facing: "UP", lastSuccessfulMoveDirection: null, soldierMemory: { secret: "PRIVATE_SENTINEL" } })), ...TOP_STARTING_POSITIONS.map((position, n) => ({ id: `top-soldier-${n + 1}`, ownerPlayerId: top, status: "ACTIVE", position, facing: "DOWN", lastSuccessfulMoveDirection: null, soldierMemory: { secret: "PRIVATE_SENTINEL" } }))], terrainStones: arena.terrainStones, outcome: null, players: [{ strategyMemory: "PRIVATE_SENTINEL" }], input: "PRIVATE_SENTINEL" }
  const final = { ...start, phase: "COMPLETE", outcome: { type: "DRAW", reason: "PRIVATE_SENTINEL" } }
  const accounting = providerIdentities.map((identity, n) => ({ identity, invocationRoot: r(30 + n), requestId: `effect:v1.19:${String(n + 1).repeat(64)}`, method: "selectActivations", inputRoot: r(32 + n), ordinal: 0, charged: true, completed: true, outputBytes: 1, result: { ok: true, value: { input: "PRIVATE_SENTINEL" } } }))
  const descriptor = accounting.map(a => ({ identity: a.identity, invocationRoot: a.invocationRoot, requestId: a.requestId, method: a.method, inputRoot: a.inputRoot, ordinal: a.ordinal, charged: a.charged, completed: a.completed, outputBytes: a.outputBytes, classification: "success" }))
  const compact = { classification: "success" as const, code: "OK" as const, outcome: "DRAW" as const, elapsedMs: 1, cleanupComplete: true, invocationCount: 2, accountingRoot: labRoot("lean-accounting-v1", deriveFactoryOrderedRecordDescriptor("lean-accounting", descriptor)), executionRoot: r(40), telemetry: { transitions: 1, events: 0 } }
  const actual = { kind: "completed", privacy: "private_offline", transitions: [{ beforeState: start, afterState: final, events: [{ payload: "PRIVATE_SENTINEL" }] }], result: { state: final, events: [] }, accounting } as unknown as LabMatchExecution
  return { allocation, binding: { allocation, ordinal: 0 as const, debitRoot, providerIdentities }, actual, compact }
}

describe("dedicated private two-Match HOST route", () => {
  it.each(["composer", "guard", "cap", "terminal-observer", "second-capacity"])("retains charged/partial evidence after inert %s refusal", async fault => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "inert-two-match-stop-"))), f = fixture()
    const resources = { windowRoot: LEAN_PRIVATE_MATCH_WINDOW_V1.root, allocationRoot: f.allocation.root, wallAtMs: 1791669996000, cumulativeElapsedMs: 322054903, remainingSlots: 2, historicalCharged: 40, historicalAllocatedBytes: 29970432, priorProbeBytes: 65536, sourceAllocatedBytes: 4096, newAllocatedBytes: 4096, retainedBytesUpperBound: 29970432 + 65536 + 4096 + 4096 + 2 * (67108864 + 16777216) + 262144, parentRssBytes: 100000000, aggregateMemoryUpperBound: 100000000 + 2 * 268435456 + 512000000 + 335544320, availableDiskBytes: 2000000000 }
    const write = (name: string, value: unknown) => writeFileSync(join(directory, name), leanCanonicalBytes(value), { mode: 0o600 })
    write("allocation.json", f.allocation)
    const clock = vi.spyOn(Date, "now").mockReturnValue(1791669996000)
    const open = vi.spyOn(authority, "openLeanPrivateMatchAdmissionV1").mockImplementation(() => {
      write("entry.json", { resources }); writeFileSync(join(directory, "ledger.ndjson"), "", { mode: 0o600 }); return {} as ReturnType<typeof authority.openLeanPrivateMatchAdmissionV1>
    })
    let capacities = 0, debits = 0
    const capacity = vi.spyOn(authority, "observeLeanPrivateMatchCapacityV1").mockImplementation(() => {
      if (++capacities === 3 && fault === "second-capacity") throw new Error("PRIVATE_SENTINEL")
      return {} as ReturnType<typeof authority.observeLeanPrivateMatchCapacityV1>
    })
    const debit = vi.spyOn(authority, "recordLeanPrivateMatchDebitV1").mockImplementation(() => {
      debits++; const row = { ordinal: 0, root: f.binding.debitRoot, resources }
      write("debit-0.json", row); write("pair-0.json", {}); writeFileSync(join(directory, "ledger.ndjson"), Buffer.concat([Buffer.from(leanCanonicalBytes(row)), Buffer.from("\n")]), { mode: 0o600 })
      return {} as ReturnType<typeof authority.recordLeanPrivateMatchDebitV1>
    })
    const context = vi.spyOn(authority, "readLeanPrivateMatchContextV1").mockReturnValue({ allocation: f.allocation, slot: f.allocation.slots[0], debitRoot: f.binding.debitRoot, storePath: directory })
    const sourceRead = vi.spyOn(source, "readLeanBaselineSource").mockReturnValue({} as ReturnType<typeof source.readLeanBaselineSource>)
    const run = vi.spyOn(composer, "runLeanPrivateFeasibilityMatch").mockImplementation(async () => {
      if (fault === "composer") throw new Error("PRIVATE_SENTINEL")
      const actual = fault === "cap" ? { ...f.actual, transitions: Array.from({ length: 65537 }, () => f.actual.transitions[0]!) } : f.actual
      const compact = fault === "cap" ? { ...f.compact, telemetry: { transitions: 65537, events: 0 } } : f.compact
      return { compact, privateActual: actual, privateProviderIdentities: f.binding.providerIdentities, semanticRoot: r(41) } as unknown as Awaited<ReturnType<typeof composer.runLeanPrivateFeasibilityMatch>>
    })
    let checkpoints = 0
    const checkpoint = vi.spyOn(authority, "checkpointLeanPrivateMatchV1").mockImplementation(() => { if (fault === "guard" && ++checkpoints === 2) throw new Error("PRIVATE_SENTINEL") })
    const observe = vi.spyOn(authority, "observeLeanPrivateMatchResourcesV1").mockImplementation(() => {
      if (fault === "terminal-observer") throw new Error("PRIVATE_SENTINEL")
      return { ...resources, remainingSlots: 1, historicalCharged: 40, priorProbeBytes: 65536 }
    })
    const close = vi.spyOn(authority, "closeLeanPrivateMatchDebitV1").mockReturnValue(true)
    try {
      const result = await route.enterLeanPrivateMatchesV1({ command: "entry", store: directory, allocationCommit: "b".repeat(40), allocationPath: authority.LEAN_PRIVATE_MATCH_ARTIFACT_V1 })
      expect(result.attemptedCount).toBe(1); expect(debits).toBe(1); expect(run).toHaveBeenCalledTimes(1)
      const terminal = JSON.parse(readFileSync(join(directory, "terminal-0.json"), "utf8")), aggregate = JSON.parse(readFileSync(join(directory, "result.json"), "utf8"))
      expect(aggregate.cumulativeCharged).toBe(41); expect(aggregate.unattemptedOrdinals).toEqual([1])
      expect(aggregate.stopCode).toBe(fault === "second-capacity" ? "ADMISSION_STOP" : "CHARGED_ATTEMPT_STOP")
      expect(JSON.stringify(terminal)).not.toContain("PRIVATE_SENTINEL")
      if (fault !== "second-capacity") {
        expect(terminal.evidence).toMatchObject({ classification: "system_failure", boardEvidenceAvailable: false, rowCount: 0 })
        expect(terminal.evidence.cleanupComplete).toBe(fault === "composer" ? null : true)
        expect(terminal.providerIdentities).toHaveLength(fault === "composer" ? 0 : 2)
        if (fault === "guard") { expect(terminal.evidence.observed.executionRoot).toBe(f.compact.executionRoot); expect(terminal.evidence.partialStream.bytes).toBeGreaterThan(0) }
      } else expect(terminal.evidence.classification).toBe("success")
      expect(route.verifyLeanPrivateMatchTerminalV1({ binding: { ...f.binding, providerIdentities: terminal.providerIdentities }, terminal, resultAnchor: aggregate.terminals[0], streamPath: join(directory, "replay-0.ndjson") }).verified).toBe(true)
      if (fault === "guard") {
        const before = readFileSync(join(directory, "replay-0.ndjson")); writeFileSync(join(directory, "replay-0.ndjson"), Buffer.concat([before, Buffer.from("x")]))
        expect(() => route.verifyLeanPrivateMatchTerminalV1({ binding: f.binding, terminal, resultAnchor: aggregate.terminals[0], streamPath: join(directory, "replay-0.ndjson") })).toThrow()
      }
      expect(close).toHaveBeenCalledTimes(fault === "second-capacity" ? 1 : 0)
    } finally {
      for (const mock of [clock, open, capacity, debit, context, sourceRead, run, checkpoint, observe, close]) mock.mockRestore()
      rmSync(directory, { recursive: true, force: true })
    }
  })
  it("uses only finite Git metadata commands with safe argv/timeout/output caps", () => {
    const commit = "a".repeat(40)
    gitCalls.calls.length = 0
    for (const args of [["rev-parse", "HEAD"], ["rev-list", "--parents", "-n", "1", commit], ["show", `${commit}:.planning/artifacts/v1.38-phase-265-private-match-allocation-v1.json`], ["diff", "--name-only", "dd67460e6628aebff6bc35c253adaa2cdfea284e", commit], ["show", `${commit}:scripts/inert.ts`], ["diff", "--name-only", "HEAD", "--", "scripts/run-v1-38-lean-private-matches.ts", "scripts/lib/v1-38-lean-experiment-authority.ts", "scripts/lib/v1-38-lean-baseline-match.ts", "scripts/lib/v1-38-lean-container-match-session.ts"]]) readLeanPrivateMatchGitV1(args)
    expect(gitCalls.calls.map(c => c.options.maxBuffer)).toEqual([128, 256, 65537, 32768, 4194305, 4096])
    expect(gitCalls.calls.every(c => c.program === "git" && c.options.timeout === 1500 && JSON.stringify(c.options.stdio) === '["ignore","pipe","ignore"]')).toBe(true)
    const count = gitCalls.calls.length
    for (const args of [["status"], ["show", `${commit}:scripts/../secret`], ["show", `${commit}:scripts/a\nb`], ["show", `${commit}:scripts/a:b`], ["show", `${commit}:scripts//a`], ["show", `${commit}:(glob)scripts/*`], ["diff", "--name-only", "HEAD", "--", "scripts/inert.ts"], ["show", "HEAD:scripts/inert.ts"], ["show", `${commit}:scripts/inert.ts`, "--"]]) expect(() => readLeanPrivateMatchGitV1(args)).toThrow("LEAN_PRIVATE_MATCH_GIT_METADATA")
    expect(gitCalls.calls).toHaveLength(count)
  })
  it("requires an explicit command and refuses default execution", () => {
    expect(() => route.parseLeanPrivateMatchesArgsV1([])).toThrow()
    expect(() => route.parseLeanPrivateMatchesArgsV1(["run"])).toThrow()
    expect(() => route.parseLeanPrivateMatchesArgsV1(["metadata", "--source-store", "elsewhere"])).toThrow()
  })
  it("refuses a dirty fourth production Git-owner file before source compilation or allocation", () => {
    const clock = vi.spyOn(Date, "now").mockReturnValue(1791669996000)
    gitCalls.responses.push(Buffer.from("a".repeat(40) + "\n"), Buffer.from("scripts/lib/v1-38-lean-container-match-session.ts\n"))
    try {
      expect(() => route.prepareLeanPrivateMatchesV1({ command: "prepare", sourceStore: ".strategy-lab/lean-correction-supervisor-baseline-20261006-v6", sourceHead: "a".repeat(40), candidateRawRoot: r(1), opponentRawRoot: r(2) })).toThrow("LEAN_PRIVATE_MATCH_ROUTE")
      expect(gitCalls.calls.at(-1)?.args).toEqual(["diff", "--name-only", "HEAD", "--", "scripts/run-v1-38-lean-private-matches.ts", "scripts/lib/v1-38-lean-experiment-authority.ts", "scripts/lib/v1-38-lean-baseline-match.ts", "scripts/lib/v1-38-lean-container-match-session.ts"])
    } finally { clock.mockRestore(); gitCalls.responses.length = 0 }
  })
  it("exports concrete public-board producer and independent compact reader", () => {
    expect(route.projectLeanPrivateBoardV1).toBeTypeOf("function")
    expect(route.produceLeanPrivateMatchEvidenceV1).toBeTypeOf("function")
    expect(route.verifyLeanPrivateMatchEvidenceV1).toBeTypeOf("function")
  })
  it("freezes same seed/arena, distinct slots and absolute-bottom side reversal", () => {
    const { allocation } = fixture()
    expect(allocation.slots.map(s => [s.ordinal, s.condition, s.bottomRole, s.topRole])).toEqual([[0, 0, "tactical-0", "cold-opponent"], [1, 2, "cold-opponent", "tactical-0"]])
    expect(allocation.slots[0].root).not.toBe(allocation.slots[1].root)
    expect(allocation.seed).toBe("phase265-private-two-match-20261010")
  })
  it("connects actual safe producer to O_RDONLY reader without private material or writes", () => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "inert-two-match-evidence-"))), streamPath = join(directory, "board.ndjson"), f = fixture()
    try {
      const evidence = route.produceLeanPrivateMatchEvidenceV1({ ...f, semanticRoot: r(41), streamPath, guard() {} })
      const before = readFileSync(streamPath), inventory = readdirSync(directory)
      expect(before.toString("utf8")).not.toMatch(/PRIVATE_SENTINEL|soldierMemory|strategyMemory|payload|players/)
      expect(evidence.fullChronicleVerified).toBe(false)
      expect(route.verifyLeanPrivateMatchEvidenceV1({ binding: f.binding, evidence, streamPath })).toMatchObject({ verified: true, fullChronicleVerified: false })
      expect(readFileSync(streamPath)).toEqual(before); expect(readdirSync(directory)).toEqual(inventory)
    } finally { rmSync(directory, { recursive: true, force: true }) }
  })
  it.each(["facing", "coordinate", "drop", "debit", "accounting", "recomputed-frame", "provider"])("rejects %s compact evidence tamper", mutation => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "inert-two-match-tamper-"))), streamPath = join(directory, "board.ndjson"), f = fixture()
    try {
      const evidence = route.produceLeanPrivateMatchEvidenceV1({ ...f, semanticRoot: r(41), streamPath, guard() {} })
      const rows = readFileSync(streamPath, "utf8").trim().split("\n").map(line => JSON.parse(line))
      const changed = structuredClone(evidence)
      if (mutation === "facing") delete rows[0].after.soldiers[0].facing
      if (mutation === "coordinate") rows[0].after.soldiers[0].position.x = 100
      if (mutation === "drop") rows.splice(1, 1)
      if (mutation === "debit") rows[0].debitRoot = r(50)
      if (mutation === "accounting") changed.accountingRows[0]!.completed = false
      if (mutation === "provider") changed.accountingRows[0]!.identity.sourceRoot = r(51)
      if (mutation === "recomputed-frame") { rows[1].after.soldiers[0].position.x = 1; rows[1].afterRoot = labRoot("lean-private-board-state-v1", rows[1].after); const { frameRoot: _root, ...body } = rows[1]; rows[1].frameRoot = labRoot("lean-private-board-row-v1", body) }
      writeFileSync(streamPath, Buffer.concat(rows.map(row => Buffer.concat([Buffer.from(leanCanonicalBytes(row)), Buffer.from("\n")]))))
      expect(() => route.verifyLeanPrivateMatchEvidenceV1({ binding: f.binding, evidence: changed, streamPath })).toThrow()
    } finally { rmSync(directory, { recursive: true, force: true }) }
  })
  it("anchors actual producer stream to terminal and result; recomputed terminal with stale result refuses", () => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "inert-two-match-anchor-"))), streamPath = join(directory, "board.ndjson"), f = fixture()
    try {
      const evidence = route.produceLeanPrivateMatchEvidenceV1({ ...f, semanticRoot: r(41), streamPath, guard() {} })
      const resources = { windowRoot: LEAN_PRIVATE_MATCH_WINDOW_V1.root, allocationRoot: f.allocation.root, wallAtMs: 1791669996000, cumulativeElapsedMs: 322054903, remainingSlots: 1, historicalCharged: 40, historicalAllocatedBytes: 29970432, priorProbeBytes: 65536, sourceAllocatedBytes: 4096, newAllocatedBytes: 4096, retainedBytesUpperBound: 29970432 + 65536 + 4096 + 4096 + 2 * (67108864 + 16777216) + 262144, parentRssBytes: 100000000, aggregateMemoryUpperBound: 100000000 + 2 * 268435456 + 512000000 + 335544320, availableDiskBytes: 2000000000 }
      const body = { schemaVersion: "lean-private-match-terminal-v1", allocationRoot: f.allocation.root, debitRoot: f.binding.debitRoot, slotRoot: f.allocation.slots[0].root, ordinal: 0, elapsedMs: 1, resources, providerIdentities: f.binding.providerIdentities, evidence }
      const terminal = { ...body, root: labRoot(body.schemaVersion, body) }
      const resultAnchor = { ordinal: 0, root: terminal.root, rawRoot: leanBytesRoot(leanCanonicalBytes(terminal)), streamRawRoot: evidence.streamRawRoot, rowCount: evidence.rowCount, streamBytes: evidence.streamBytes }
      expect(route.verifyLeanPrivateMatchTerminalV1({ binding: f.binding, terminal, resultAnchor, streamPath }).verified).toBe(true)
      const changedBody = { ...body, elapsedMs: 2 }, changed = { ...changedBody, root: labRoot(body.schemaVersion, changedBody) }
      expect(() => route.verifyLeanPrivateMatchTerminalV1({ binding: f.binding, terminal: changed, resultAnchor, streamPath })).toThrow()
      expect(() => route.verifyLeanPrivateMatchTerminalV1({ binding: f.binding, terminal, resultAnchor: { ...resultAnchor, streamBytes: resultAnchor.streamBytes - 1 }, streamPath })).toThrow()
    } finally { rmSync(directory, { recursive: true, force: true }) }
  })
})
