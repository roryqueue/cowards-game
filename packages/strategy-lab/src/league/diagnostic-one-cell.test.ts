import { mkdtempSync, mkdirSync, realpathSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { CANONICAL_ARENA_CATALOG_V1_37 } from "@cowards/spec"
import { MATCH_KERNEL } from "@cowards/engine"
import { labRoot, type LabRoot } from "../contracts.js"
import {
  DIAGNOSTIC_ONE_CELL_STORE,
  DIAGNOSTIC_ONE_CELL_SEED,
  admitDiagnosticOneCellAllocation,
  admitDiagnosticOneCellCell,
  admitDiagnosticOneCellStart,
  admitDiagnosticOneCellTerminal,
  createDiagnosticOneCellAllocation,
  createDiagnosticOneCellCell,
  createDiagnosticOneCellStart,
  createDiagnosticOneCellStage,
  createDiagnosticOneCellTerminal,
  openDiagnosticOneCellLedger,
  reopenDiagnosticOneCellLedger,
  retainDiagnosticOneCellExecution,
  verifyRetainedDiagnosticOneCellExecution,
  createDiagnosticOneCellResult,
} from "./diagnostic-one-cell.js"
import { createDiagnosticPilotAllocation } from "./diagnostic-pilot.js"

const oldCwd = process.cwd()
const roots: string[] = []
afterEach(() => { process.chdir(oldCwd); for (const path of roots.splice(0)) rmSync(path, { recursive: true, force: true }) })
const hash = (value: string): LabRoot => labRoot("diagnostic-one-cell-test", value)
const baseline = Object.freeze({ oldAllocationV2: hash("allocation-v2"), oldAllocationUnversioned: hash("allocation-v1"), oldResult: hash("result"), oldLeagueTree: hash("league"), oldFactoryTree: hash("factory") })
const allocation = () => createDiagnosticOneCellAllocation({ sourceClosureRoot: hash("source"), implementationRoot: hash("implementation"), gateRoot: hash("gate"), oldEvidenceBaseline: baseline })
const store = () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "diagnostic-one-cell-")))
  roots.push(root)
  mkdirSync(join(root, ".strategy-lab"), { mode: 0o700 })
  mkdirSync(join(root, DIAGNOSTIC_ONE_CELL_STORE), { mode: 0o700 })
  process.chdir(root)
  return DIAGNOSTIC_ONE_CELL_STORE
}

describe("version-disjoint one-cell diagnostic", () => {
  it("uses a plausible current-edge Smoke start with all Soldiers and terrain inside the declared board", () => {
    const value = allocation(), cell = createDiagnosticOneCellCell(value, 0)
    const smoke = CANONICAL_ARENA_CATALOG_V1_37.arenas.find((arena) => arena.id === "arena:smoke:v1")!
    const bottomPlayerId = `league-${cell.bottomCandidateRoot.slice(7)}`, topPlayerId = `league-${cell.topCandidateRoot.slice(7)}`
    const machine = MATCH_KERNEL.createMachineV119({ matchId: "source-only-board-fixture", seed: value.seed, arenaVariant: smoke, bottomPlayerId, topPlayerId, initialInitiativePlayerId: bottomPlayerId, bottomStrategyRevisionId: "source-only-bottom", topStrategyRevisionId: "source-only-top" })
    const initial = machine.initialState
    expect(initial.soldiers).toHaveLength(16)
    const inside = ({ x, y }: { x: number; y: number }) => x >= initial.bounds.minX && x <= initial.bounds.maxX && y >= initial.bounds.minY && y <= initial.bounds.maxY
    expect(initial.soldiers.every((soldier) => soldier.position && inside(soldier.position))).toBe(true)
    expect(initial.terrainStones.every(inside)).toBe(true)
    expect(initial.soldiers.filter((soldier) => soldier.ownerPlayerId === bottomPlayerId).map((soldier) => soldier.position?.y)).toEqual(Array(8).fill(11))
    expect(initial.soldiers.filter((soldier) => soldier.ownerPlayerId === topPlayerId).map((soldier) => soldier.position?.y)).toEqual(Array(8).fill(0))
  })
  it("derives exactly one fresh S01/S03 Smoke condition and rejects old or extra cells", () => {
    const value = allocation()
    expect(value.schemaVersion).toBe("diagnostic-one-cell-allocation-v3")
    expect(value.seed).toBe(DIAGNOSTIC_ONE_CELL_SEED)
    expect(value.cells).toHaveLength(1)
    expect(value.cells[0]).toMatchObject({ ordinal: 0, bottomCandidateRoot: value.candidateRoots[0], topCandidateRoot: value.candidateRoots[1], initialInitiativeCandidateRoot: value.candidateRoots[0] })
    expect(value.cells[0]?.conditionId).toContain("set-condition:sha256:")
    expect(admitDiagnosticOneCellAllocation(value)).toEqual(value)
    expect(() => admitDiagnosticOneCellAllocation({ ...value, cells: [...value.cells, value.cells[0]] })).toThrow()
    expect(() => admitDiagnosticOneCellAllocation({ ...value, store: "legacy" })).toThrow()
    expect(() => admitDiagnosticOneCellAllocation(createDiagnosticPilotAllocation({ sourceClosureRoot: hash("source"), implementationRoot: hash("implementation"), gateRoot: hash("gate"), oldEvidenceBaseline: baseline }))).toThrow()
    expect(() => createDiagnosticOneCellCell(value, 1)).toThrow()
    const cell = createDiagnosticOneCellCell(value, 0), start = createDiagnosticOneCellStart(value, cell)
    expect(admitDiagnosticOneCellCell(value, cell)).toEqual(cell)
    expect(admitDiagnosticOneCellStart(value, cell, start)).toEqual(start)
  })

  it("keeps stage-only and failed records process-invalid and never admits a bare success terminal", () => {
    const value = allocation(), cell = createDiagnosticOneCellCell(value, 0), start = createDiagnosticOneCellStart(value, cell)
    expect(createDiagnosticOneCellStage(start, 0, "bottom_issuance").stage).toBe("bottom_issuance")
    expect(() => createDiagnosticOneCellStage(start, 0, "kernel_or_callback")).toThrow()
    const terminal = createDiagnosticOneCellTerminal(start, { disposition: "system_failure", processValidity: "process_invalid", evidenceRoot: null, cleanupComplete: true, elapsedMilliseconds: 100, artifactBytes: 0, artifactRecords: 0, code: "system_failure", lastEnteredStage: "bottom_issuance", failureStage: "bottom_issuance", cause: "unknown_internal" })
    expect(admitDiagnosticOneCellTerminal(start, terminal)).toEqual(terminal)
    expect(() => admitDiagnosticOneCellTerminal(start, { ...terminal, rawError: "/private/secret" })).toThrow()
    expect(() => createDiagnosticOneCellTerminal(start, { ...terminal, disposition: "success", processValidity: "process_valid", code: "completed" })).toThrow()
  })

  it("opens only the new 0700 store and retains one charge without manufacturing payoff", () => {
    const directory = store(), value = allocation(), cell = createDiagnosticOneCellCell(value, 0), start = createDiagnosticOneCellStart(value, cell)
    expect(() => openDiagnosticOneCellLedger(".strategy-lab/league-265-diagnostic-pilot-20260923-a")).toThrow()
    const ledger = openDiagnosticOneCellLedger(directory)
    ledger.writeStart(start)
    expect(() => ledger.writeStart(start)).toThrow()
    const reopened = reopenDiagnosticOneCellLedger(openDiagnosticOneCellLedger(directory), value)
    expect(reopened.records).toHaveLength(1)
    expect(reopened.records[0]).toMatchObject({ start, terminal: null, processValidity: "process_invalid" })
  })

  it("requires a complete reopened execution manifest for any diagnostic-only positive", () => {
    const directory = store(), value = allocation(), cell = createDiagnosticOneCellCell(value, 0), start = createDiagnosticOneCellStart(value, cell), ledger = openDiagnosticOneCellLedger(directory)
    ledger.writeStart(start)
    const execution = { kind: "completed", privacy: "private_offline", transitions: [], accounting: [], result: { state: { outcome: { type: "DRAW" } }, events: [] } } as never
    const retained = retainDiagnosticOneCellExecution(ledger, value, cell, start, execution)
    expect(verifyRetainedDiagnosticOneCellExecution(ledger, value, cell, start, retained.evidenceRoot)).toMatchObject({ disposition: "success", artifactBytes: retained.artifactBytes, artifactRecords: retained.artifactRecords })
    for (let ordinal = 0; ordinal < 6; ordinal++) ledger.writeStage(createDiagnosticOneCellStage(start, ordinal, ["bottom_issuance", "top_issuance", "pre_kernel_binding", "kernel_or_callback", "first_evidence_write", "terminal_publication"][ordinal] as never))
    const terminal = createDiagnosticOneCellTerminal(start, { disposition: "success", processValidity: "process_valid", evidenceRoot: retained.evidenceRoot, cleanupComplete: true, elapsedMilliseconds: 20, artifactBytes: retained.artifactBytes, artifactRecords: retained.artifactRecords, code: "completed", lastEnteredStage: "terminal_publication", failureStage: "unknown", cause: "unknown_internal" })
    ledger.writeTerminal(terminal)
    expect(createDiagnosticOneCellResult(value, ledger, 21, true)).toMatchObject({ processValidity: "process_valid", leagueRequirementsEvidence: false, freezeAuthorized: false, counted: false, public: false })
    expect(() => createDiagnosticOneCellResult(value, ledger, 21, false)).toThrow()
  })
})
