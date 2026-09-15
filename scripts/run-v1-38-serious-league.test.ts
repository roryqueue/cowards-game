import { mkdtempSync, realpathSync, readdirSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { MATCH_KERNEL } from "../packages/engine/src/index.js"
import { defaultRuntimeMetadata } from "@cowards/spec"
import { buildStrategyRevision } from "../packages/runtime-js/src/revision.js"
import { allocationFixture } from "../packages/strategy-lab/src/league/allocation.test.js"
import { importedCandidateFixture } from "../packages/strategy-lab/src/league/contracts.test.js"
import { createLeagueExecutionAllocation } from "../packages/strategy-lab/src/league/allocation.js"
import { createLeagueRepository } from "../packages/strategy-lab/src/league/repository.js"
import { LAB_ADMITTED_ROOTS, labRoot } from "../packages/strategy-lab/src/contracts.js"
import { factoryAssessmentImplementationRoot } from "./v1-38-factory-implementation.js"
import { runSeriousLeague, prepareSeriousLeague, readLeagueRecordGraph, type LeagueCandidateInput, type LeagueFixtureSeams } from "./run-v1-38-serious-league.js"

const directories: string[] = []
afterEach(() => { for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true }) })
const temporary = () => { const directory = realpathSync(mkdtempSync(join(tmpdir(), "league-command-test-"))); directories.push(directory); return directory }
const candidate = async (slot: number): Promise<LeagueCandidateInput> => {
  const fixture = await importedCandidateFixture(slot), admission = fixture.candidateAdmission, packet = admission.candidate.proposal
  const closure = { factoryRepository: fixture.factoryRepository, candidatePublicationArtifactRoot: fixture.input.publicationArtifactRoot, sourceArtifactRoot: packet.source.root, packetArtifactRoot: packet.packetRoot, proposalArtifactRoot: fixture.put(packet), validationArtifactRoot: fixture.put(admission.candidate.validation) }
  // Resolve the exact packet by its immutable domain identity, not a historical selector.
  for (const name of readdirSync(fixture.factoryRepository.directory)) { if (!name.endsWith(".bin")) continue; try { const value = JSON.parse(readFileSync(join(fixture.factoryRepository.directory, name), "utf8")); if (value.root === packet.packetRoot) closure.packetArtifactRoot = fixture.put(value) } catch { /* Raw source is not a JSON record. */ } }
  return { admission, candidateAdmission: admission, closure, publicationRoot: fixture.input.publicationArtifactRoot, factoryRepository: fixture.factoryRepository, fingerprintArtifactRoot: fixture.fingerprintArtifactRoot, importedAssessment: fixture.importedAssessment }
}
const host: LeagueFixtureSeams["host"] = { createFactorySupervisedRuntime({ admission, sourceBytes, executableRoot, attemptRoot, budgetRoot }) {
  const defaults = defaultRuntimeMetadata("typescript"), revision = buildStrategyRevision({ source: new TextDecoder().decode(sourceBytes), runtime: { ...defaults, adapter: { ...defaults.adapter, id: "runtime-js-container-subprocess" } } })
  return { identity: { revisionId: revision.id, sourceRoot: admission.sourceRoot, executableRoot, tupleId: "candidate-kernel-v1.19", tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, image: LAB_ADMITTED_ROOTS.image, harnessRoot: labRoot("test-harness", 1), budgetRoot, attemptRoot, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, nativeLane: admission.nativeLane, factoryPacketRoot: admission.packetRoot, factoryProposalRoot: admission.proposalRoot, factoryValidationRoot: admission.validationRoot }, invoke() { throw new Error("No guest or source execution is allowed in the injected command test") }, verify() { return false }, close() { return { cleanupComplete: true, orphanedChild: false } } }
} }

describe("complete private league command", () => {
  it("runs all cells, both rounds and all nine probes through fresh host issuance without empirical work", async () => {
    const candidates = [await candidate(1), await candidate(3)], base = allocationFixture(), allocation = createLeagueExecutionAllocation({ ...base, implementationRoot: factoryAssessmentImplementationRoot(), initialCandidatePublicationRoots: candidates.map((candidate) => candidate.publicationRoot).sort(), operations: { ...base.operations, wallClockMilliseconds: 60000, maxArtifactRecords: 30000, maxArtifactBytes: 60000000 } })
    let calls = 0
    const repository = createLeagueRepository(temporary())
    const fixture: LeagueFixtureSeams = { candidates, host, run: async ({ match, providers }) => {
      calls++
      const machine = MATCH_KERNEL.createMachineV119(match), state = machine.initialState
      expect(state.soldiers).toHaveLength(16)
      for (const soldier of state.soldiers) { expect(soldier.position.x).toBeGreaterThanOrEqual(state.bounds.minX); expect(soldier.position.x).toBeLessThanOrEqual(state.bounds.maxX); expect([state.bounds.minY, state.bounds.maxY]).toContain(soldier.position.y) }
      for (const provider of Object.values(providers)) provider.close()
      return { kind: "completed", privacy: "private_offline", transitions: [], accounting: [], result: { state: { ...state, outcome: { type: "DRAW" } }, events: [{ type: "MATCH_ENDED", payload: { type: "DRAW" } }] } } as never
    } }
    const result = await runSeriousLeague({ allocation, allocationRoot: allocation.root, repository, factoryRepository: candidates[0]!.factoryRepository, responseFactoryRepository: null, fixture })
    const graph = readLeagueRecordGraph(repository, result.headRoot, allocation.operations)
    expect(graph.get(result.headRoot)?.value, JSON.stringify(graph.get(result.headRoot)?.value)).toMatchObject({ processValidity: "process_valid", executedCells: 80, completedJobs: [] })
    expect(calls).toBe(80)
    expect([...graph.values()].filter((node) => node.kind === "complete-matrix")).toHaveLength(1)
    expect([...graph.values()].filter((node) => node.kind === "declared-round")).toHaveLength(2)
    expect(result.empiricalRequirementsComplete).toBe(false)
    await expect(runSeriousLeague({ allocation, allocationRoot: allocation.root, repository, factoryRepository: candidates[0]!.factoryRepository, responseFactoryRepository: null, fixture })).rejects.toThrow()
    expect(calls).toBe(80)
  }, 60000)
  it("rejects partial or stale allocations before any repository side effects", async () => {
    const repository = createLeagueRepository(temporary()), base = allocationFixture(), allocation = createLeagueExecutionAllocation(base)
    expect(() => prepareSeriousLeague(base)).toThrow("STALE_IMPLEMENTATION")
    await expect(runSeriousLeague({ allocation, allocationRoot: allocation.root, repository, factoryRepository: { directory: "/not-opened" } as never, responseFactoryRepository: null })).rejects.toThrow("RUN_AUTHORITY")
    expect(readdirSync(repository.directory)).toEqual([])
  })
})
