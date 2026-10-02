import { mkdtempSync, realpathSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { MATCH_KERNEL } from "../../packages/engine/src/index.js"
import { CANONICAL_ARENA_CATALOG_V1_37, admitCanonicalJsonValue } from "@cowards/spec"
import { LAB_ADMITTED_ROOTS, labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import type { LabMatchExecution, LabRuntimeEvidence } from "../../packages/strategy-lab/src/runtime-bridge.js"
import { createLeagueRepository } from "../../packages/strategy-lab/src/league/repository.js"
import { LeagueRecordGraph } from "../run-v1-38-serious-league.js"
import { buildLeagueTacticalCorpus, fillCanonicalTacticalMixture, rehydrateLeagueTacticalCorpus, readTacticalLeagueRecord, isProspectiveTacticalJob, readRetainedTacticalAuthoringContext } from "./v1-38-league-tactical-corpus.js"
import { allocationFixture, prospectiveFixture, prospectiveLifetimeFixture } from "../../packages/strategy-lab/src/league/allocation.test.js"
import { createLeagueExecutionAllocation, createProspectiveLeagueExecutionAllocation, createProspectiveLeagueExecutionAllocationV2 } from "../../packages/strategy-lab/src/league/allocation.js"
import { createFactoryRepository, publishFactoryArtifact, readFactoryArtifact } from "../../packages/strategy-lab/src/factory/repository.js"
import { declareRedTeamAllocation, startRedTeamAttempt } from "../../packages/strategy-lab/src/league/red-team.js"
import { createCompletePayoffSnapshot } from "../../packages/strategy-lab/src/league/contracts.js"
import { solveLeagueSnapshot } from "../../packages/strategy-lab/src/league/solver.js"
import { declareLeagueRound } from "../../packages/strategy-lab/src/league/psro.js"
import { executeLeagueAuthoring, verifyRetainedLeagueAuthoring } from "./v1-38-league-authoring.js"
import { readFactoryIngestion } from "../ingest-v1-38-factory-packet.js"

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
  it("prospective lifetime v1/v2 selects only tactical ordinals 0/3/6 and never legacy or non-jobs", () => {
    for (const allocation of [createProspectiveLeagueExecutionAllocation(prospectiveFixture()), createProspectiveLeagueExecutionAllocationV2(prospectiveLifetimeFixture())]) {
      const jobs = allocation.rounds.flatMap((round) => round.jobs)
      expect(jobs.flatMap((job, index) => isProspectiveTacticalJob(allocation, job) ? [index] : [])).toEqual([0, 3, 6])
      expect(isProspectiveTacticalJob(allocation, { ...jobs[0]!, id: "not-admitted" })).toBe(false)
      expect(isProspectiveTacticalJob(allocation, { ...jobs[0]!, evaluationRole: "validation_opponent" })).toBe(false)
      expect(isProspectiveTacticalJob(createLeagueExecutionAllocation(allocationFixture()), jobs[0]!)).toBe(false)
    }
  })
  it("prospective lifetime v2 traverses retained tactical authoring, profile/envelope and strict target/corpus joins", async () => {
    const fixture = tacticalRetainedFixture(), directory = realpathSync(mkdtempSync(join(tmpdir(), "factory-tactical-author-v2-"))); directories.push(directory)
    const repository = createFactoryRepository(directory), encode = (value: unknown) => { const result = admitCanonicalJsonValue(value, { profile: "canonical-manifest" }); if (!result.ok) throw Error("fixture canonical"); return result.canonicalBytes }, put = (value: unknown) => publishFactoryArtifact(repository, encode(value)), read = (value: LabRoot) => JSON.parse(new TextDecoder().decode(readFactoryArtifact(repository, value)))
    const input = prospectiveLifetimeFixture(), original = input.rounds[0]!.jobs[0]!
    const producerInput = { split: "development", doctrineFamily: "v2-tactical-profile", provider: { providerId: "fixture", modelId: "local", modelVersion: "test", settingsRoot: root("settings"), promptRoot: root("prompt"), contextRoot: root("context") }, build: { buildRoot: root("build"), toolchainRoot: root("toolchain") }, lineage: { predecessorRoot: LAB_ADMITTED_ROOTS.currentStartRoot, correctionRoot: null, retryParentRoot: null } }
    const producerRequestArtifactRoot = put({ producerIdentity: "emitTacticalFactoryPacket", origin: "tactical-oracle", evidenceClass: "real_producer", producerInput }), disclosureArtifactRoot = put({ participantId: original.participantId, requestArtifactRoot: producerRequestArtifactRoot, sourceAndBuildDisclosed: true, dependencyArtifactRoots: [] }), provenanceArtifactRoot = put({ participantId: original.participantId, priorExposure: "none", conflicts: "none", origin: "tactical-oracle", deterministicDataOnly: true }), reviewArtifactRoot = put({ reviewerId: original.reviewerId, participantId: original.participantId, disclosureArtifactRoot, provenanceArtifactRoot, disposition: "accepted", reviewMilliseconds: 0 })
    const job = { ...original, producerRequestArtifactRoot, disclosureArtifactRoot, provenanceArtifactRoot, reviewArtifactRoot }, allocation = createProspectiveLeagueExecutionAllocationV2({ ...input, outputDirectories: { league: fixture.repository.directory, responseFactory: directory }, rounds: input.rounds.map((round, ordinal) => ordinal === 0 ? { ...round, jobs: [job, ...round.jobs.slice(1)] } : round) })
    const candidates = fixture.target.weights.map((row) => row.candidateRoot), projections = candidates.flatMap((entrantCandidateRoot) => candidates.filter((candidate) => candidate > entrantCandidateRoot).flatMap((opponentCandidateRoot) => Array.from({ length: 8 }, (_, index) => ({ entrantCandidateRoot, opponentCandidateRoot, projectionRoot: root(`${entrantCandidateRoot}:${opponentCandidateRoot}:${index}`), halfPoints: 1 }))))
    projections.sort((left, right) => `${left.entrantCandidateRoot}:${left.opponentCandidateRoot}:${left.projectionRoot}`.localeCompare(`${right.entrantCandidateRoot}:${right.opponentCandidateRoot}:${right.projectionRoot}`))
    const snapshot = createCompletePayoffSnapshot({ populationRoot: root("population"), cellChunkRoots: [root("chunk")], solverPayoffRoot: labRoot("league-solver-payoffs-v1", projections), expectedCellCount: projections.length, completedCellCount: projections.length }), solved = solveLeagueSnapshot({ snapshot, solverPayoffBytes: encode(projections) })
    if (solved.status !== "solved") throw Error(`fixture solver ${solved.failureCode}`)
    const { canonicalBytes: _bytes, ...solver } = solved
    const round = declareLeagueRound({ snapshot, solver, responseAllocationRoot: labRoot("league-round-allocation-v1", { allocationRoot: allocation.root, ordinal: 0, seed: allocation.seedBlocks[0] }), roundOrdinal: 0, maximumRounds: allocation.rounds.length, closureRule: "bounded-no-accepted-counter-v1" })
    const matrixRecordRoot = fixture.graph.append("complete-matrix", { schemaVersion: "league-retained-matrix-v2", snapshot, solver, matrix: { cells: fixture.records.map((record) => record.root) } }), built = buildLeagueTacticalCorpus({ roundRoot: round.round.root, strongestPureCandidateRoot: round.target.strongestPureCandidateRoot, vulnerablePureCandidateRoot: round.target.vulnerablePureCandidateRoot, weights: solver.weights, cellResultRoots: fixture.records.map((record) => record.root), readCell: fixture.readCell })
    const target = { roundRoot: round.round.root, candidateRoot: round.target.strongestPureCandidateRoot, targets: [{ seed: allocation.seedBlocks[0], weights: solver.weights, target: round.target }], tacticalAdaptation: { allocationArtifactRoot: put(allocation), matrixRecordRoot, corpusArtifactRoot: put(built.corpus) } }
    expect(readRetainedTacticalAuthoringContext(repository, allocation, job, target)).toEqual(built)
    expect(() => readRetainedTacticalAuthoringContext(repository, allocation, job, { ...target, tacticalAdaptation: undefined })).toThrow("AUTHORING_CONTEXT")
    expect(() => readRetainedTacticalAuthoringContext(repository, allocation, job, { ...target, candidateRoot: root("crossed") })).toThrow("ROUND_BINDING")
    expect(() => readRetainedTacticalAuthoringContext(repository, allocation, job, { ...target, tacticalAdaptation: { ...target.tacticalAdaptation, corpusArtifactRoot: put({ ...built.corpus, roundRoot: root("crossed") }) } })).toThrow("CORPUS_REDERIVATION")
    const ledger = declareRedTeamAllocation({ phase: 265, evidenceClass: allocation.evidenceClass, authorityRoot: allocation.root, channels: allocation.channels, probes: allocation.probes }), start = startRedTeamAttempt({ ledger, channel: job.channel, roundRoot: target.roundRoot, candidateRoot: target.candidateRoot, participantId: job.participantId, reviewerId: job.reviewerId, disclosureRoot: job.disclosureArtifactRoot, provenanceRoot: job.provenanceArtifactRoot, inputRoot: job.producerRequestArtifactRoot, retryParentRoot: null, reservation: job.reservation }).starts[0]!
    const arguments_ = { repository, allocation, jobId: job.id, startArtifactRoot: put(start), targetArtifactRoot: put(target), clock: () => 0 }, result = await executeLeagueAuthoring(arguments_)
    expect(result.disposition).toBe("produced")
    const ingestion = readFactoryIngestion(repository, result.ingestionArtifactRoot!), retained = read(result.evidenceArtifactRoot), producer = ingestion.producerInput as any
    expect(ingestion.producerIdentity).toBe("emitProfiledTacticalFactoryPacket")
    expect(producer.envelope).toMatchObject({ originalRequestArtifactRoot: job.producerRequestArtifactRoot, targetArtifactRoot: arguments_.targetArtifactRoot, corpusArtifactRoot: target.tacticalAdaptation.corpusArtifactRoot, sourceRoot: ingestion.sourceRoot, profileRoot: producer.profile.root })
    expect(read(producer.envelope.selectionArtifactRoot).rows).toHaveLength(100)
    expect(() => verifyRetainedLeagueAuthoring(repository, allocation, result.evidenceArtifactRoot)).not.toThrow()
    for (const change of [{ tacticalEnvelopeArtifactRoot: null }, { targetArtifactRoot: put({ ...target, candidateRoot: root("crossed") }) }, { tacticalEnvelopeArtifactRoot: put({ ...producer.envelope, corpusArtifactRoot: root("crossed") }) }]) {
      const { root: _root, ...body } = { ...retained, ...change }
      expect(() => verifyRetainedLeagueAuthoring(repository, allocation, put({ ...body, root: labRoot("league-authoring-result-v1", body) }))).toThrow()
    }
    expect((await executeLeagueAuthoring({ ...arguments_, targetArtifactRoot: undefined })).disposition).toBe("system_failure")
  }, 180000)
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
