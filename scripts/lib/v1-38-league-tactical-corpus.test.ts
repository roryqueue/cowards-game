import { mkdtempSync, realpathSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { MATCH_KERNEL } from "../../packages/engine/src/index.js"
import { CANONICAL_ARENA_CATALOG_V1_37 } from "@cowards/spec"
import { LAB_ADMITTED_ROOTS, labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import type { LabMatchExecution, LabRuntimeEvidence } from "../../packages/strategy-lab/src/runtime-bridge.js"
import { createLeagueRepository } from "../../packages/strategy-lab/src/league/repository.js"
import { LeagueRecordGraph } from "../run-v1-38-serious-league.js"
import { buildLeagueTacticalCorpus, fillCanonicalTacticalMixture, rehydrateLeagueTacticalCorpus, readTacticalLeagueRecord } from "./v1-38-league-tactical-corpus.js"

const directories: string[] = []
afterEach(() => { for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true }) })
const root = (value: string) => labRoot("tactical-corpus-fixture", value)
const limits = { maxArtifactBytes: 20_000_000, maxArtifactRecords: 20_000 }

/** Recorded fixture values drive the pure kernel; no source, provider or Match runner. */
export const tacticalRetainedFixture = () => {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), "league-tactical-corpus-test-"))); directories.push(directory)
  const repository = createLeagueRepository(directory), graph = new LeagueRecordGraph(repository, limits)
  const candidates = [root("candidate-a"), root("candidate-b"), root("candidate-c")].sort() as LabRoot[], roundRoot = root("round")
  const records = Array.from({ length: 4 }, (_, slot) => {
    const bottomCandidateRoot = candidates[slot % 3]!, topCandidateRoot = candidates[(slot + 1) % 3]!
    const player = (candidate: LabRoot) => `player-${candidate.slice(7, 31)}`
    const match = { matchId: `tactical-fixture-${slot}`, seed: `fixture-${slot}`, arenaVariant: CANONICAL_ARENA_CATALOG_V1_37.arenas.find((arena) => arena.status === "active" && arena.terrainStones.length === 0)!, bottomPlayerId: player(bottomCandidateRoot), topPlayerId: player(topCandidateRoot), bottomStrategyRevisionId: "fixture-bottom", topStrategyRevisionId: "fixture-top", initialInitiativePlayerId: player(bottomCandidateRoot) }
    let machine = MATCH_KERNEL.createMachineV119(match)
    const accounting: LabRuntimeEvidence[] = [], transitions: any[] = [], ordinals = new Map<string, number>()
    for (let step = 0; step < 10_000; step++) {
      let next = MATCH_KERNEL.stepMatch(machine, { kind: "advance" })
      if (next.kind === "effect") {
        const request = next.request, acting = String(request.coordinates.actingPlayerId), ordinal = ordinals.get(acting) ?? 0
        const value = request.kind === "selectActivations" ? { activationOrders: request.input.mySoldiers.filter((soldier) => soldier.status === "ACTIVE").slice(0, request.input.activationCount).map((soldier) => ({ soldierId: soldier.id, objective: null })), strategyMemory: {} } : { action: { type: "TURN_TO_STONE" }, soldierMemory: {} }
        const identity = { revisionId: acting === match.bottomPlayerId ? match.bottomStrategyRevisionId : match.topStrategyRevisionId, sourceRoot: root(acting), executableRoot: root(`executable:${acting}`), tupleId: machine.semanticTuple.tupleId, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, image: LAB_ADMITTED_ROOTS.image, harnessRoot: root("harness"), budgetRoot: root("budget"), attemptRoot: root("attempt"), runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot }
        const result = { ok: true as const, value }
        accounting.push({ identity, requestId: request.requestId, method: request.kind, inputRoot: labRoot("runtime-input", request.input), ordinal, invocationRoot: root(`${slot}:${request.requestId}`), charged: true, completed: true, outputBytes: new TextEncoder().encode(JSON.stringify(result)).length, result })
        ordinals.set(acting, ordinal + 1)
        next = MATCH_KERNEL.stepMatch(next.machine, { kind: "runtime_resume", requestId: request.requestId, effectKind: request.kind, classification: "success", value })
      }
      if (next.kind === "effect" || next.kind === "failure") throw Error("fixture kernel failure")
      transitions.push(next.record); machine = next.machine
      if (next.kind === "completed") break
    }
    const execution: LabMatchExecution = { kind: "completed", privacy: "private_offline", result: { state: machine.state, events: transitions.flatMap((transition) => transition.events) }, transitions, accounting }
    const value = { match, execution, bottomCandidateRoot, topCandidateRoot, options: {}, terminal: { disposition: "success" } }
    return { root: graph.append("cell-result", value), value }
  }, 180000)
  const target = { roundRoot, strongestPureCandidateRoot: candidates[0]!, vulnerablePureCandidateRoot: candidates[1]!, weights: candidates.map((candidateRoot) => ({ candidateRoot, numerator: "1", denominator: "3" })) }
  const readCell = (recordRoot: LabRoot) => readTacticalLeagueRecord(repository, recordRoot, limits)
  return { repository, graph, records, target, readCell }
}

describe("retained tactical corpus", () => {
  it("fills mixture observations by global canonical cell order, not candidate groups", () => {
    const cells = [root("mixture-cell-1"), root("mixture-cell-2"), root("mixture-cell-3")].sort(), candidates = [root("mixture-candidate-a"), root("mixture-candidate-b")].sort()
    const row = (cellResultRoot: LabRoot, targetCandidateRoot: LabRoot) => ({ observation: { cellResultRoot, targetCandidateRoot, invocationRoot: root(`invocation:${cellResultRoot}:${targetCandidateRoot}`), selectRequestRoot: root(`request:${cellResultRoot}:${targetCandidateRoot}`) } })
    const byCell = new Map([[cells[0]!, [row(cells[0]!, candidates[1]!)]], [cells[1]!, [row(cells[1]!, candidates[0]!)]], [cells[2]!, [row(cells[2]!, candidates[0]!)]]])
    const selected = fillCanonicalTacticalMixture({ cellResultRoots: [...cells].reverse(), usedCellRoots: new Set<LabRoot>(), mixtureCandidateRoots: new Set(candidates), eligible: (cell) => byCell.get(cell) ?? [], count: 2 })
    expect(selected.map((entry) => entry.observation.cellResultRoot)).toEqual(cells.slice(0, 2))
    expect(selected.map((entry) => entry.observation.targetCandidateRoot)).toEqual([candidates[1], candidates[0]])
    expect(fillCanonicalTacticalMixture({ cellResultRoots: cells, usedCellRoots: new Set([cells[0]!]), mixtureCandidateRoots: new Set(candidates), eligible: (cell) => byCell.get(cell) ?? [], count: 1 }).map((entry) => entry.observation.cellResultRoot)).toEqual([cells[1]])
  })
  it("reserves named pure coverage, fills four distinct current cells and exactly rehydrates", () => {
    const fixture = tacticalRetainedFixture(), input = { ...fixture.target, cellResultRoots: fixture.records.map((record) => record.root), readCell: fixture.readCell }
    const built = buildLeagueTacticalCorpus(input)
    expect(built.corpus.observations).toHaveLength(4)
    expect(new Set(built.corpus.observations.map((row) => row.cellResultRoot)).size).toBe(4)
    expect(built.corpus.observations.some((row) => row.roles.includes("strongest_pure"))).toBe(true)
    expect(built.corpus.observations.some((row) => row.roles.includes("vulnerable_pure"))).toBe(true)
    expect(buildLeagueTacticalCorpus({ ...input, cellResultRoots: [...input.cellResultRoots].reverse() })).toEqual(built)
    expect(rehydrateLeagueTacticalCorpus(built.corpus, fixture.readCell)).toEqual(built.inputs)
    expect(built.corpus.observations.every((row) => row.selectedSoldierId.startsWith("soldier-"))).toBe(true)
  }, 180000)
  it("rejects absent coverage, noncanonical order and changed kernel accounting instead of synthetic fallback", () => {
    const fixture = tacticalRetainedFixture(), input = { ...fixture.target, cellResultRoots: fixture.records.map((record) => record.root), readCell: fixture.readCell }, built = buildLeagueTacticalCorpus(input)
    expect(() => buildLeagueTacticalCorpus({ ...input, cellResultRoots: input.cellResultRoots.slice(0, 3) })).toThrow()
    expect(() => buildLeagueTacticalCorpus({ ...input, strongestPureCandidateRoot: root("absent") })).toThrow()
    const changed = structuredClone(built.corpus) as any; changed.observations[0]!.soldierBrainInputRoot = root("forged")
    expect(() => rehydrateLeagueTacticalCorpus(changed, fixture.readCell)).toThrow()
    const bad = structuredClone(fixture.records[0]!.value); bad.execution.accounting[0]!.inputRoot = root("wrong-input")
    const badRoot = fixture.graph.append("cell-result", bad)
    expect(() => buildLeagueTacticalCorpus({ ...input, cellResultRoots: [badRoot, ...input.cellResultRoots.slice(1)] })).toThrow()
  }, 180000)
})
