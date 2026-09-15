import { mkdtempSync, realpathSync, readdirSync, readFileSync, rmSync, cpSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { MATCH_KERNEL } from "../packages/engine/src/index.js"
import { defaultRuntimeMetadata, admitCanonicalJsonValue } from "@cowards/spec"
import { buildStrategyRevision } from "../packages/runtime-js/src/revision.js"
import { allocationFixture } from "../packages/strategy-lab/src/league/allocation.test.js"
import { importedCandidateFixture } from "../packages/strategy-lab/src/league/contracts.test.js"
import { createLeagueExecutionAllocation } from "../packages/strategy-lab/src/league/allocation.js"
import { createLeagueRepository, recordLeagueCellStart, publishLeagueCellTerminal, publishLeagueArtifact } from "../packages/strategy-lab/src/league/repository.js"
import { createLeagueCellTerminal } from "../packages/strategy-lab/src/league/contracts.js"
import { LAB_ADMITTED_ROOTS, labRoot } from "../packages/strategy-lab/src/contracts.js"
import { factoryAssessmentImplementationRoot } from "./v1-38-factory-implementation.js"
import { runSeriousLeague, prepareSeriousLeague, readLeagueRecordGraph, verifyRetainedSeriousLeague, LeagueRecordGraph, LeagueRetentionBudget, seriousLeagueMain, type LeagueCandidateInput, type LeagueFixtureSeams } from "./run-v1-38-serious-league.js"
import { createFactoryRepository, publishFactoryArtifact } from "../packages/strategy-lab/src/factory/repository.js"
import { produceLeagueResponse } from "./lib/v1-38-league-response-runtime.js"
import { positiveResponseFixture } from "./lib/v1-38-league-response-runtime.test.js"

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
const testRevisions = new Map<string, ReturnType<typeof buildStrategyRevision>>()
const host: LeagueFixtureSeams["host"] = { createFactorySupervisedRuntime({ admission, sourceBytes, executableRoot, attemptRoot, budgetRoot }) {
  const defaults = defaultRuntimeMetadata("typescript"), revision = testRevisions.get(admission.sourceRoot) ?? buildStrategyRevision({ source: new TextDecoder().decode(sourceBytes), runtime: { ...defaults, adapter: { ...defaults.adapter, id: "runtime-js-container-subprocess" } } })
  testRevisions.set(admission.sourceRoot, revision)
  return { identity: { revisionId: revision.id, sourceRoot: admission.sourceRoot, executableRoot, tupleId: "candidate-kernel-v1.19", tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, image: LAB_ADMITTED_ROOTS.image, harnessRoot: labRoot("test-harness", 1), budgetRoot, attemptRoot, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, nativeLane: admission.nativeLane, factoryPacketRoot: admission.packetRoot, factoryProposalRoot: admission.proposalRoot, factoryValidationRoot: admission.validationRoot }, invoke() { throw new Error("No guest or source execution is allowed in the injected command test") }, verify() { return false }, close() { return { cleanupComplete: true, orphanedChild: false } } }
} }

describe("complete private league command", () => {
  it("re-enters a measured positive response into a fresh complete three-candidate matrix and reopens the whole loop", async () => {
    const candidates = [await candidate(1), await candidate(3)], repository = createLeagueRepository(temporary()), responseDirectory = realpathSync(mkdtempSync(join(tmpdir(), "factory-positive-league-test-"))); directories.push(responseDirectory)
    const responseFactoryRepository = createFactoryRepository(responseDirectory), put = (value: unknown) => { const encoded = admitCanonicalJsonValue(value, { profile: "canonical-manifest" }); if (!encoded.ok) throw new Error("fixture encode"); return publishFactoryArtifact(responseFactoryRepository, encoded.canonicalBytes) }, r = (label: string) => labRoot("positive-league-fixture", label), base = allocationFixture()
    const producerInput = { split: "development", doctrineFamily: "source-only-positive-response", provider: { providerId: "source-fixture", modelId: "local", modelVersion: "test", settingsRoot: r("settings"), promptRoot: r("prompt"), contextRoot: r("context") }, build: { buildRoot: r("build"), toolchainRoot: r("toolchain") }, lineage: { predecessorRoot: LAB_ADMITTED_ROOTS.currentStartRoot, correctionRoot: null, retryParentRoot: null } }, producerRequestArtifactRoot = put({ producerIdentity: "emitTacticalFactoryPacket", origin: "tactical-oracle", evidenceClass: "real_producer", producerInput }), disclosureArtifactRoot = put({ participantId: "author", requestArtifactRoot: producerRequestArtifactRoot, sourceAndBuildDisclosed: true, dependencyArtifactRoots: [] }), provenanceArtifactRoot = put({ participantId: "author", priorExposure: "none", conflicts: "none", origin: "tactical-oracle", deterministicDataOnly: true }), reviewArtifactRoot = put({ reviewerId: "reviewer", participantId: "author", disclosureArtifactRoot, provenanceArtifactRoot, disposition: "accepted", reviewMilliseconds: 0 }), reservation = { ...base.channels[0]!.perAttempt, matches: 72, effortMilliseconds: 360000 }, job = { id: "positive-response", channel: "automated" as const, evaluationRole: "development_response" as const, operation: "produce" as const, producerRequestArtifactRoot, disclosureArtifactRoot, provenanceArtifactRoot, reviewArtifactRoot, participantId: "author", reviewerId: "reviewer", reservation, retryParentJobId: null }
    const allocation = createLeagueExecutionAllocation({ ...base, outputDirectories: { league: repository.directory, responseFactory: responseDirectory }, implementationRoot: factoryAssessmentImplementationRoot(), initialCandidatePublicationRoots: candidates.map((row) => row.publicationRoot).sort(), independenceReferencePublicationRoot: candidates[0]!.publicationRoot, opportunities: { ...base.opportunities, attemptedCandidates: 1, acceptedResponseSlots: 1, matches: 500 }, operations: { ...base.operations, maxPopulation: 3, perAttemptMilliseconds: 360000, wallClockMilliseconds: 600000, maxArtifactBytes: 250000000, maxArtifactRecords: 200000 }, channels: base.channels.map((channel) => channel.channel === "automated" ? { ...channel, disposition: "allocated", opportunities: 1, ceilings: reservation, perAttempt: reservation, participants: ["author"], reviewers: ["reviewer"] } : channel), rounds: [{ ordinal: 0, acceptedSlots: 1, jobs: [job] }, base.rounds[1]!] }), productionFixture = positiveResponseFixture(new Set(candidates.map((row) => row.admission.candidate.proposal.source.root)))
    let cells = 0, responseMatches = 0
    const fixture: LeagueFixtureSeams = { candidates, host, run: async ({ match, providers }) => { cells++; const state = MATCH_KERNEL.createMachineV119(match).initialState; expect(state.soldiers).toHaveLength(16); for (const provider of Object.values(providers)) provider.close(); return { kind: "completed", privacy: "private_offline", transitions: [], accounting: [], result: { state: { ...state, outcome: { type: "DRAW" } }, events: [{ type: "MATCH_ENDED", payload: { type: "DRAW" } }] } } as never }, produce: (input) => produceLeagueResponse({ ...input, fixture: { ...productionFixture, run: (request) => { responseMatches++; return productionFixture.run(request) } } }) }
    const result = await runSeriousLeague({ allocation, allocationRoot: allocation.root, repository, factoryRepository: candidates[0]!.factoryRepository, responseFactoryRepository, fixture }), graph = readLeagueRecordGraph(repository, result.headRoot, allocation.operations), head = graph.get(result.headRoot)!.value
    expect(head, JSON.stringify(head)).toMatchObject({ processValidity: "process_valid", executedCells: 122, completedJobs: [job.id] })
    expect(cells).toBe(122); expect(responseMatches).toBe(48)
    expect([...graph.values()].filter((row) => row.kind === "counter-reentry")).toHaveLength(1)
    expect([...graph.values()].filter((row) => row.kind === "complete-matrix").map((row) => row.value.matrix.cells.length).sort((a, b) => a - b)).toEqual([8, 24])
    expect(verifyRetainedSeriousLeague({ repository, factoryRepository: candidates[0]!.factoryRepository, responseFactoryRepository, headRoot: result.headRoot, allocationRoot: allocation.root, limits: allocation.operations, fixtureCandidates: candidates })).toMatchObject({ issued: false, processValidity: "process_valid", empiricalRequirementsComplete: false })
    expect(responseMatches).toBe(48); expect(cells).toBe(122)
  }, 600000)
  it("reopens canonically ordered grouped dependency links and the complete incremental chain", () => {
    const repository = createLeagueRepository(temporary()), graph = new LeagueRecordGraph(repository, { maxArtifactBytes: 4000000, maxArtifactRecords: 2000 })
    const links = Array.from({ length: 130 }, (_, ordinal) => graph.append("increment", { ordinal }))
    const head = graph.append("grouped", { count: links.length }, [...links].reverse()), nodes = readLeagueRecordGraph(repository, head, { maxArtifactBytes: 4000000, maxArtifactRecords: 2000 })
    expect(links.every((root) => nodes.has(root))).toBe(true)
    expect(nodes.get(head)?.value).toEqual({ count: 130 })
  }, 60000)
  it("keeps reserved failure capacity after normal byte or record exhaustion and forbids new charges", () => {
    for (const mode of ["bytes", "records"] as const) {
      const base = allocationFixture(), allocation = createLeagueExecutionAllocation({ ...base, operations: { ...base.operations, ...(mode === "bytes" ? { maxArtifactBytes: 2001000 } : { maxArtifactRecords: 2002 }) } }), budget = new LeagueRetentionBudget(allocation), repository = createLeagueRepository(temporary(), { beforePublication: budget.beforePublication }), cellRoot = labRoot("retention-cell", mode), body = { cellRoot, allocationRoot: allocation.root }, start = { ...body, root: labRoot("league-cell-start-v1", body) }
      recordLeagueCellStart(repository, start)
      const bytes = new Uint8Array(mode === "bytes" ? 600 : 1).fill(65), first = publishLeagueArtifact(repository, bytes), usage = budget.usage
      expect(publishLeagueArtifact(repository, bytes)).toBe(first); expect(budget.usage).toEqual(usage)
      const names = readdirSync(repository.directory).sort()
      expect(() => publishLeagueArtifact(repository, new Uint8Array(600).fill(66))).toThrow("RETENTION_BUDGET")
      expect(readdirSync(repository.directory).sort()).toEqual(names)
      const failure = new LeagueRecordGraph(repository, allocation.operations, budget).append("run-failure", { startRoot: start.root, processValidity: "process_invalid" })
      publishLeagueCellTerminal(repository, start, createLeagueCellTerminal({ cellRoot, disposition: "system_failure", processValidity: "process_invalid", evidenceRoot: failure, projection: null }))
      const next = { cellRoot: labRoot("next-cell", mode), allocationRoot: allocation.root }
      expect(() => recordLeagueCellStart(repository, { ...next, root: labRoot("league-cell-start-v1", next) })).toThrow("RETENTION_DISPATCH_STOP")
      expect(budget.usage.terminalBytes).toBeGreaterThan(0)
      expect(budget.usage.workBytes).toBe(usage.workBytes)
    }
  })
  it("runs all cells, both rounds and all nine probes through fresh host issuance without empirical work", async () => {
    const candidates = [await candidate(1), await candidate(3)], base = allocationFixture(), repository = createLeagueRepository(temporary()), allocation = createLeagueExecutionAllocation({ ...base, outputDirectories: { league: repository.directory, responseFactory: null }, implementationRoot: factoryAssessmentImplementationRoot(), initialCandidatePublicationRoots: candidates.map((candidate) => candidate.publicationRoot).sort(), independenceReferencePublicationRoot: candidates[0]!.publicationRoot, operations: { ...base.operations, wallClockMilliseconds: 120000, maxArtifactRecords: 30000, maxArtifactBytes: 60000000 } })
    let calls = 0
    const fixture: LeagueFixtureSeams = { candidates, host, run: async ({ match, providers }) => {
      calls++
      const machine = MATCH_KERNEL.createMachineV119(match), state = machine.initialState
      expect(state.soldiers).toHaveLength(16)
      for (const soldier of state.soldiers) { expect(soldier.position!.x).toBeGreaterThanOrEqual(state.bounds.minX); expect(soldier.position!.x).toBeLessThanOrEqual(state.bounds.maxX); expect([state.bounds.minY, state.bounds.maxY]).toContain(soldier.position!.y) }
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
    const names = readdirSync(repository.directory).sort(), bytes = names.map((name) => readFileSync(join(repository.directory, name)).toString("hex"))
    const verifyInput = { repository, factoryRepository: candidates[0]!.factoryRepository, responseFactoryRepository: null, headRoot: result.headRoot, allocationRoot: allocation.root, limits: allocation.operations, fixtureCandidates: candidates }
    expect(verifyRetainedSeriousLeague(verifyInput)).toMatchObject({ issued: false, processValidity: "process_valid", empiricalRequirementsComplete: false })
    expect(readdirSync(repository.directory).sort()).toEqual(names)
    expect(names.map((name) => readFileSync(join(repository.directory, name)).toString("hex"))).toEqual(bytes)
    const copiedLeague = createLeagueRepository(temporary()); cpSync(repository.directory, copiedLeague.directory, { recursive: true })
    const copiedCandidates = candidates.map((row) => { const directory = realpathSync(mkdtempSync(join(tmpdir(), "factory-readonly-copy-test-"))); directories.push(directory); cpSync(row.factoryRepository.directory, directory, { recursive: true }); const factoryRepository = createFactoryRepository(directory); return { ...row, factoryRepository, closure: { ...row.closure, factoryRepository } } })
    expect(verifyRetainedSeriousLeague({ ...verifyInput, repository: copiedLeague, factoryRepository: copiedCandidates[0]!.factoryRepository, fixtureCandidates: copiedCandidates })).toMatchObject({ issued: false, processValidity: "process_valid" })
    const incomplete = new LeagueRecordGraph(repository, allocation.operations).append("run-complete", graph.get(result.headRoot)!.value)
    expect(() => verifyRetainedSeriousLeague({ ...verifyInput, headRoot: incomplete })).toThrow("RUN_GRAPH")
    await expect(runSeriousLeague({ allocation, allocationRoot: allocation.root, repository, factoryRepository: candidates[0]!.factoryRepository, responseFactoryRepository: null, fixture })).rejects.toThrow()
    await expect(runSeriousLeague({ allocation, allocationRoot: allocation.root, repository: createLeagueRepository(temporary()), factoryRepository: candidates[0]!.factoryRepository, responseFactoryRepository: null, fixture })).rejects.toThrow("OUTPUT_BINDING")
    expect(calls).toBe(80)
  }, 180000)
  it("rejects partial or stale allocations before any repository side effects", async () => {
    const repository = createLeagueRepository(temporary()), base = allocationFixture(), allocation = createLeagueExecutionAllocation(base)
    expect(() => prepareSeriousLeague(base)).toThrow("STALE_IMPLEMENTATION")
    await expect(runSeriousLeague({ allocation, allocationRoot: allocation.root, repository, factoryRepository: { directory: "/not-opened" } as never, responseFactoryRepository: null })).rejects.toThrow("RUN_AUTHORITY")
    expect(readdirSync(repository.directory)).toEqual([])
    expect(await seriousLeagueMain(["--help"])).toContain("verify-retained is read-only")
    await expect(seriousLeagueMain(["run", "--provider", "caller-provider"])).rejects.toThrow("ARGUMENTS")
  })
})
