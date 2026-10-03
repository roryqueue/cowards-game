import { fsync, mkdtempSync, realpathSync, readdirSync, readFileSync, rmSync, cpSync, copyFileSync, writeFileSync } from "node:fs"
import { createHash, randomUUID } from "node:crypto"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { MATCH_KERNEL } from "../packages/engine/src/index.js"
import { defaultRuntimeMetadata, admitCanonicalJsonValue } from "@cowards/spec"
import { buildStrategyRevision } from "../packages/runtime-js/src/revision.js"
import * as revisionApi from "../packages/runtime-js/src/revision.js"
import { allocationFixture, prospectiveFixture, prospectiveLifetimeFixture, capacityFixture } from "../packages/strategy-lab/src/league/allocation.test.js"
import { importedCandidateFixture } from "../packages/strategy-lab/src/league/contracts.test.js"
import { createLeagueExecutionAllocation, createLeagueProspectiveAmendment, createProspectiveLeagueExecutionAllocation, createLeagueCapacityReceipt } from "../packages/strategy-lab/src/league/allocation.js"
import { createLeagueProspectiveAmendmentV2, createProspectiveLeagueExecutionAllocationV2 } from "../packages/strategy-lab/src/league/allocation.js"
import { createLeagueProspectiveAmendmentV3, createProspectiveLeagueExecutionAllocationV3 } from "../packages/strategy-lab/src/league/allocation.js"
import { claimProspectiveLeagueHostReceiptAuthority } from "./lib/v1-38-league-host-receipt.js"
import { createLeagueRepository, recordLeagueCellStart, publishLeagueCellTerminal, publishLeagueArtifact } from "../packages/strategy-lab/src/league/repository.js"
import { createLeagueCellTerminal, deriveLeagueResultEventRoot, LeaguePayoffProjectionSchema } from "../packages/strategy-lab/src/league/contracts.js"
import { LAB_ADMITTED_ROOTS, labRoot } from "../packages/strategy-lab/src/contracts.js"
import { factoryAssessmentImplementationRoot, factoryAssessmentImplementationManifest } from "./v1-38-factory-implementation.js"
import { claimProspectiveLeagueLifetimeAuthority } from "./lib/v1-38-league-prospective-lifetime.js"
import { runSeriousLeague, prepareSeriousLeague, readLeagueRecordGraph, verifyRetainedSeriousLeague, verifyRetainedCellJournalBijection, LeagueConnectedSession, LeagueRecordGraph, LeagueRetentionBudget, normalizedGameplayRoot, sameLargeExecution, sameLargeResult, diagnoseLeagueExecutionStorage, seriousLeagueMain, retainedSupervisorFailureDiagnostic, readLeagueInitialCandidates, readLeanPilotInitialCandidates, type LeagueCandidateInput, type LeagueFixtureSeams } from "./run-v1-38-serious-league.js"
import { prepareLeagueExecutionStream, readLeagueExecutionStream } from "./lib/v1-38-league-execution-stream.js"
import { createFactoryRepository, publishFactoryArtifact, recordFactoryAttemptStart, publishFactoryAttemptTerminal } from "../packages/strategy-lab/src/factory/repository.js"
import * as assessmentModule from "./assess-v1-38-factory-independence.js"
import { readFactoryArtifact } from "../packages/strategy-lab/src/factory/repository.js"
import { createFactoryAttemptStart, createFactoryAttemptTerminal } from "../packages/strategy-lab/src/factory/ledger.js"
import { produceLeagueResponse, wrapLeagueProbeProvider, verifyRetainedLeagueProbeInvocations } from "./lib/v1-38-league-response-runtime.js"
import { positiveResponseFixture } from "./lib/v1-38-league-response-runtime.test.js"
import { executeLeagueAuthoring } from "./lib/v1-38-league-authoring.js"
import * as leagueAuthoring from "./lib/v1-38-league-authoring.js"
import { ingestNamedFactoryPacket, readFactoryIngestion } from "./ingest-v1-38-factory-packet.js"
import { declareRedTeamAllocation, startRedTeamAttempt, terminalizeRedTeamAttempt } from "../packages/strategy-lab/src/league/red-team.js"
import { verifyRetainedProductionFailures } from "./run-v1-38-serious-league.js"
import * as supervisionArtifacts from "../packages/strategy-lab/src/factory/supervision-artifacts.js"
import { countLinkedResponseIterations } from "../packages/strategy-lab/src/league/selection.js"
import { runCanonicalLabMatch, type LabRuntimeEvidence } from "../packages/strategy-lab/src/runtime-bridge.js"
import { advanceLeagueRound } from "../packages/strategy-lab/src/league/psro.js"
import * as redTeamModule from "../packages/strategy-lab/src/league/red-team.js"
import { prepareProspectiveSeriousLeague, preflightProspectiveSeriousLeague, validateProspectiveLeagueInitialCandidates, leagueCurrentSourceIdentity, leagueEffectiveAvailableMemoryBytes, observeLeagueAvailableMemoryBytes } from "./run-v1-38-serious-league.js"
import { createCompleteHistoricalFactoryFixture } from "./fixtures/factory-complete-historical-assessment-fixture.js"

const directories: string[] = []
const descriptorSyncFailure = vi.hoisted(() => ({ active: false, error: null as Error | null }))
vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>()
  return { ...actual, fsyncSync(fd: number) { if (descriptorSyncFailure.active && !actual.fstatSync(fd).isDirectory()) throw descriptorSyncFailure.error ?? Error("descriptor file fsync failed"); return actual.fsyncSync(fd) } }
})
afterEach(() => { descriptorSyncFailure.active = false; descriptorSyncFailure.error = null; vi.restoreAllMocks(); for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true }) })
const temporary = () => { const directory = realpathSync(mkdtempSync(join(tmpdir(), "league-command-test-"))); directories.push(directory); return directory }

it("imports two synthetic candidates through both genuine historical verifier paths", async () => {
  const fixture = await createCompleteHistoricalFactoryFixture(); directories.push(fixture.directory)
  const publicationRoots = (["S01", "S03"] as const).map(slot => fixture.candidates.find(candidate => candidate.slot === slot)!.publicationRoot)
  const selection = { initialCandidatePublicationRoots: publicationRoots, factoryAssessmentArtifactRoots: [fixture.assessment.assessmentArtifactRoot!], operations: { maxArtifactBytes: 64 * 1024 * 1024, maxArtifactRecords: 50_000 } }
  const ordinary = readLeagueInitialCandidates(fixture.repository, selection)
  let reopenedCells = 0
  const bounded = readLeanPilotInitialCandidates(fixture.repository, selection, () => { reopenedCells++ })
  expect(reopenedCells).toBe(48)
  expect(ordinary.map(candidate => candidate.admission.root)).toEqual(bounded.map(candidate => candidate.admission.root))
  expect(bounded.map(candidate => candidate.admission.importEvidence?.sourceSlot)).toEqual(["S01", "S03"])
  expect(bounded.every(candidate => candidate.admission.importEvidence?.qualification === "base_distinct")).toBe(true)
  expect(bounded.map(candidate => candidate.admission.importEvidence?.assessmentRoot)).toEqual([fixture.assessment.assessmentRoot, fixture.assessment.assessmentRoot])
  expect(bounded.map(candidate => candidate.admission.importEvidence?.thresholdArtifactRoot)).toEqual([fixture.assessment.thresholdArtifactRoot, fixture.assessment.thresholdArtifactRoot])
}, 180000)

it("lean import authenticates one selected assessment for two candidate closures without changing legacy roots", async () => {
  const first = await importedCandidateFixture(1), second = await importedCandidateFixture(3), repository = first.factoryRepository
  for (const name of readdirSync(second.factoryRepository.directory)) {
    if (!name.startsWith("factory-artifact-")) continue
    const destination = join(repository.directory, name)
    if (!readdirSync(repository.directory).includes(name)) copyFileSync(join(second.factoryRepository.directory, name), destination)
  }
  for (const fixture of [first, second]) {
    recordFactoryAttemptStart(repository, fixture.input.attemptStart)
    publishFactoryAttemptTerminal(repository, fixture.input.attemptStart, fixture.input.attemptTerminal)
  }
  const read = (artifactRoot: typeof first.input.assessmentArtifactRoot) => JSON.parse(new TextDecoder().decode(readFactoryArtifact(repository, artifactRoot))) as Record<string, any>
  const priorThreshold = read(first.candidateAdmission.importEvidence!.thresholdArtifactRoot)
  const sourceRoots = [...priorThreshold.sourceRoots]
  sourceRoots[2] = second.candidateAdmission.candidate.proposal.source.root
  const { root: _oldThresholdRoot, ...thresholdBody } = priorThreshold
  const newThresholdBody = { ...thresholdBody, sourceRoots }
  const thresholdArtifactRoot = first.put({ ...newThresholdBody, root: labRoot("factory-numeric-threshold-v1", newThresholdBody) })
  const priorAssessment = read(first.input.assessmentArtifactRoot)
  const { root: _oldAssessmentRoot, ...assessmentBody } = priorAssessment
  const joined = { ...assessmentBody, thresholdArtifactRoot, input: { ...assessmentBody.input, candidateArtifactRoots: [first.input.publicationArtifactRoot, second.input.publicationArtifactRoot], supervisionArtifactRoots: [first.input.supervisionArtifactRoot, second.input.supervisionArtifactRoot], terminalRoots: [first.input.attemptTerminal.root, second.input.attemptTerminal.root] } }
  const assessmentRoot = labRoot("factory-independence-assessment-v1", joined), assessmentArtifactRoot = first.put({ ...joined, root: assessmentRoot })
  const verifier = vi.spyOn(assessmentModule, "verifyHistoricalFactoryAssessmentForLeague").mockReturnValue({ status: "affirmed", reasons: [], assessmentRoot, assessmentArtifactRoot: null, thresholdArtifactRoot, manifestRoot: (joined as Record<string, any>).manifestRoot, allocationRoot: (joined as Record<string, any>).allocationRoot, issued: false, historicalProducerImplementationRoot: assessmentRoot, historicalAssessmentImplementationRoot: assessmentRoot, currentReaderImplementationRoot: assessmentRoot })
  const selection = { initialCandidatePublicationRoots: [first.input.publicationArtifactRoot, second.input.publicationArtifactRoot], factoryAssessmentArtifactRoots: [assessmentArtifactRoot], operations: { maxArtifactBytes: 64 * 1024 * 1024, maxArtifactRecords: 50_000 } }
  const oldCandidates = readLeagueInitialCandidates(repository, selection)
  expect(verifier).toHaveBeenCalledTimes(3)
  verifier.mockClear()
  const leanCandidates = readLeanPilotInitialCandidates(repository, selection)
  expect(verifier).toHaveBeenCalledTimes(1)
  expect(leanCandidates.map((candidate) => candidate.admission.root)).toEqual(oldCandidates.map((candidate) => candidate.admission.root))
  for (const candidate of leanCandidates) expect(candidate.importedAssessment!.verifyRetainedAssessment(repository, assessmentArtifactRoot).assessmentRoot).toBe(assessmentRoot)
  expect(verifier).toHaveBeenCalledTimes(1)
  expect(() => leanCandidates[0]!.importedAssessment!.verifyRetainedAssessment(second.factoryRepository, assessmentArtifactRoot)).toThrow("CANDIDATE_ASSESSMENT")
}, 60000)

it.each(["authoring-append", "validation-publication", "selected-validation", "validated-before-charge"])("host response receipt V3 retains honest zero-charge produced author failure (%s)", async (stage) => {
  const candidates = [await candidate(1), await candidate(3), await candidate(5)], factoryDirectory = realpathSync(mkdtempSync(join(tmpdir(), "factory-retained-v3-"))), league = createLeagueRepository(temporary()), input = prospectiveLifetimeFixture()
  directories.push(factoryDirectory)
  const repository = createFactoryRepository(factoryDirectory)
  const put = (value: unknown) => { const encoded = admitCanonicalJsonValue(value, { profile: "canonical-manifest" }); if (!encoded.ok) throw Error("fixture canonical"); return publishFactoryArtifact(repository, encoded.canonicalBytes) }, r = (value: unknown) => labRoot("retained-v3-precharge-fixture", value)
  const { root: _root, schemaVersion: _schema, ...body } = input.amendment
  const amendment = createLeagueProspectiveAmendmentV3({ ...body, policy: { ...body.policy, operations: { ...body.policy.operations, hostResponseReceiptMilliseconds: 5000 } }, hostReceiptApproval: "265-PROSPECTIVE-HOST-RECEIPT-APPROVAL-20261002", bases: body.bases.map((base, index) => ({ ...base, publicationArtifactRoot: candidates[index]!.publicationRoot, candidateAdmissionRoot: candidates[index]!.admission.root, sourceRoot: candidates[index]!.closure.sourceArtifactRoot, supervisionArtifactRoot: candidates[index]!.admission.importEvidence!.supervisionArtifactRoot })) })
  const allocation = createProspectiveLeagueExecutionAllocationV3({ ...input, amendment, operations: amendment.policy.operations, initialCandidatePublicationRoots: candidates.map((row) => row.publicationRoot).sort(), independenceReferencePublicationRoot: candidates[0]!.publicationRoot, outputDirectories: { league: league.directory, responseFactory: repository.directory } }), job = allocation.rounds[0]!.jobs[0]!
  let ledger = declareRedTeamAllocation({ phase: 265, evidenceClass: "injected_fixture", authorityRoot: allocation.root, channels: allocation.channels, probes: allocation.probes })
  ledger = startRedTeamAttempt({ ledger, channel: job.channel, roundRoot: r("round"), candidateRoot: candidates[0]!.admission.candidate.root, participantId: job.participantId, reviewerId: job.reviewerId, disclosureRoot: job.disclosureArtifactRoot, provenanceRoot: job.provenanceArtifactRoot, inputRoot: job.producerRequestArtifactRoot, retryParentRoot: null, reservation: job.reservation })
  const start = ledger.starts[0]!, graph = new LeagueRecordGraph(league, allocation.operations), target = { roundRoot: start.roundRoot, candidateRoot: start.candidateRoot, targets: [{ seed: allocation.seedBlocks[0], target: {}, weights: [] }], candidates: candidates.map((row) => { const bytes = readFactoryArtifact(row.closure.factoryRepository, row.closure.sourceArtifactRoot); publishFactoryArtifact(repository, bytes); return { candidateRoot: row.admission.candidate.root, sourceArtifactRoot: row.closure.sourceArtifactRoot, byteLength: bytes.length } }) }
  const stop = Error(`finite precharge fixture: ${stage}`), host = vi.fn(() => { throw Error("unexpected mock provider construction") }), run = vi.fn(async () => { throw Error("unexpected mock Match execution") })
  await expect(produceLeagueResponse({ allocation, job, start, startArtifactRoot: put(start), targetArtifactRoot: put(target), remainingWallMilliseconds: allocation.operations.wallClockMilliseconds, repository, opponents: candidates.map((row) => ({ candidateRoot: row.admission.candidate.root, closure: row.closure })), threshold: { repository: candidates[0]!.factoryRepository, artifactRoot: candidates[0]!.admission.importEvidence!.thresholdArtifactRoot }, retention: {
    append(kind, value, links) { if (kind === (stage === "authoring-append" ? "response-authoring" : stage === "validation-publication" ? "response-validation" : "never")) throw stop; return graph.append(kind, value, links) },
    beforeDispatch() { throw stop }, beforeInvocation() { throw Error("unexpected mock invocation") },
  }, fixture: { host: { createFactorySupervisedRuntime: host }, run, author: async () => {
    const result = await ingestNamedFactoryPacket({ producerIdentity: "emitTacticalFactoryPacket", origin: "tactical-oracle", evidenceClass: "real_producer", producerInput: { split: "development", doctrineFamily: "finite-precharge-v3", provider: { providerId: "source-fixture", modelId: "local", modelVersion: "test", settingsRoot: r("settings"), promptRoot: r("prompt"), contextRoot: r("context") }, build: { buildRoot: r("build"), toolchainRoot: r("toolchain") }, lineage: { predecessorRoot: LAB_ADMITTED_ROOTS.currentStartRoot, correctionRoot: null, retryParentRoot: null } } }, repository)
    if (result.disposition !== "accepted") throw Error("fixture ingestion")
    const ingestion = readFactoryIngestion(repository, result.artifactRoot)
    // This reader regression authenticates the result projection; full author validation is independently tested.
    vi.spyOn(leagueAuthoring, "verifyRetainedLeagueAuthoring").mockReturnValue({ ingestion } as never)
    if (stage === "selected-validation") {
      const actual = revisionApi.buildStrategyRevision
      vi.spyOn(revisionApi, "buildStrategyRevision").mockImplementation((request) => { const revision = actual(request); return request.source === ingestion.sourceUtf8 ? { ...revision, validation: { ...revision.validation, valid: false } } : revision })
    }
    const body = { disposition: "produced" as const, allocationRoot: allocation.root, startRoot: start.root, jobId: job.id, ingestionArtifactRoot: result.artifactRoot, modelTokens: 0, elapsedMilliseconds: 0 }
    return { disposition: body.disposition, startRoot: start.root, ingestionArtifactRoot: result.artifactRoot, modelTokens: 0, elapsedMilliseconds: 0, evidenceArtifactRoot: put({ ...body, root: labRoot("league-authoring-result-v1", body) }) }
  } } })).rejects.toThrow(stage === "selected-validation" ? "RESPONSE_VALIDATION" : stop.message)
  expect(host).not.toHaveBeenCalled(); expect(run).not.toHaveBeenCalled()
  const failureRoot = graph.latestRoot!, records = readLeagueRecordGraph(league, failureRoot, allocation.operations)
  expect(records.get(failureRoot)!.value.matchCount).toBe(0)
  for (const kind of ["response-match-start", "response-match-result", "response-runtime-cleanup", "response-runtime-invocation", "response-runtime-invocation-failure"]) expect(records.roots(kind)).toHaveLength(0)
  expect(records.roots("response-validation")).toHaveLength(stage === "validated-before-charge" ? 1 : 0)
  ledger = terminalizeRedTeamAttempt({ ledger, startRoot: start.root, disposition: "system_failure", usage: null, evidenceRoots: [failureRoot], candidateAdmissionRoot: null })
  const blocks = [{ seed: allocation.seedBlocks[0], round: { round: { root: start.roundRoot }, roundOrdinal: 0, target: {} }, matrix: { solver: { weights: [] } }, candidateRoots: candidates.map((row) => row.admission.candidate.root) }] as never
  expect(() => verifyRetainedProductionFailures(repository, allocation, records, ledger, blocks, candidates)).not.toThrow()
  for (const kind of ["response-runtime-cleanup", "response-runtime-invocation", "response-runtime-invocation-failure", "response-match-result", "response-match-execution-failure"]) {
    const rogue = { ...records, *entries() { yield* records.entries(); yield [r(kind), { kind, value: { identity: { sourceRoot: "foreign" } }, links: [records.roots("response-production-start")[0]!] }] as never } }
    expect(() => verifyRetainedProductionFailures(repository, allocation, rogue, ledger, blocks, candidates), kind).toThrow("RETAINED_RESPONSE_RUNTIME_CHARGE")
  }
  if (stage === "validated-before-charge") {
    const validationRoot = records.roots("response-validation")[0]!
    for (const field of ["proposalRoot", "sourceRoot", "revisionId", "validation", "exactNativeLane"]) {
      const node = structuredClone(records.get(validationRoot)!), wrong = { ...records, get(root: typeof validationRoot) { return root === validationRoot ? node : records.get(root) } }
      node.value[field] = "wrong"
      expect(() => verifyRetainedProductionFailures(repository, allocation, wrong, ledger, blocks, candidates), field).toThrow("RETAINED_FAILED_RESPONSE_VALIDATION")
    }
  }
}, 120000)

it.each(["issuance", "execution", "prefix"])("host response receipt V3 retained failed response joins every available provider (%s)", async (stage) => {
  const candidates = [await candidate(1), await candidate(3), await candidate(5)], factoryDirectory = realpathSync(mkdtempSync(join(tmpdir(), "factory-retained-v3-"))), league = createLeagueRepository(temporary()), input = prospectiveLifetimeFixture()
  directories.push(factoryDirectory)
  const repository = createFactoryRepository(factoryDirectory)
  const put = (value: unknown) => { const encoded = admitCanonicalJsonValue(value, { profile: "canonical-manifest" }); if (!encoded.ok) throw Error("fixture canonical"); return publishFactoryArtifact(repository, encoded.canonicalBytes) }, r = (value: unknown) => labRoot("retained-v3-failure-fixture", value)
  const { root: _root, schemaVersion: _schema, ...body } = input.amendment
  const amendment = createLeagueProspectiveAmendmentV3({ ...body, policy: { ...body.policy, operations: { ...body.policy.operations, hostResponseReceiptMilliseconds: 5000 } }, hostReceiptApproval: "265-PROSPECTIVE-HOST-RECEIPT-APPROVAL-20261002", bases: body.bases.map((base, index) => ({ ...base, publicationArtifactRoot: candidates[index]!.publicationRoot, candidateAdmissionRoot: candidates[index]!.admission.root, sourceRoot: candidates[index]!.closure.sourceArtifactRoot, supervisionArtifactRoot: candidates[index]!.admission.importEvidence!.supervisionArtifactRoot })) })
  const allocation = createProspectiveLeagueExecutionAllocationV3({ ...input, amendment, operations: amendment.policy.operations, initialCandidatePublicationRoots: candidates.map((row) => row.publicationRoot).sort(), independenceReferencePublicationRoot: candidates[0]!.publicationRoot, outputDirectories: { league: league.directory, responseFactory: repository.directory } }), job = allocation.rounds[0]!.jobs[0]!
  let ledger = declareRedTeamAllocation({ phase: 265, evidenceClass: "injected_fixture", authorityRoot: allocation.root, channels: allocation.channels, probes: allocation.probes })
  ledger = startRedTeamAttempt({ ledger, channel: job.channel, roundRoot: r("round"), candidateRoot: candidates[0]!.admission.candidate.root, participantId: job.participantId, reviewerId: job.reviewerId, disclosureRoot: job.disclosureArtifactRoot, provenanceRoot: job.provenanceArtifactRoot, inputRoot: job.producerRequestArtifactRoot, retryParentRoot: null, reservation: job.reservation })
  const start = ledger.starts[0]!, graph = new LeagueRecordGraph(league, allocation.operations), target = { roundRoot: start.roundRoot, candidateRoot: start.candidateRoot, targets: [{ seed: allocation.seedBlocks[0], target: {}, weights: [] }], candidates: candidates.map((row) => { const bytes = readFactoryArtifact(row.closure.factoryRepository, row.closure.sourceArtifactRoot); publishFactoryArtifact(repository, bytes); return { candidateRoot: row.admission.candidate.root, sourceArtifactRoot: row.closure.sourceArtifactRoot, byteLength: bytes.length } }) }
  const synthetic = positiveResponseFixture(new Set(candidates.map((row) => row.closure.sourceArtifactRoot))), stop = Error("finite fixture stop")
  let constructors = 0, runs = 0
  await expect(produceLeagueResponse({ allocation, job, start, startArtifactRoot: put(start), targetArtifactRoot: put(target), remainingWallMilliseconds: allocation.operations.wallClockMilliseconds, repository, opponents: candidates.map((row) => ({ candidateRoot: row.admission.candidate.root, closure: row.closure })), threshold: { repository: candidates[0]!.factoryRepository, artifactRoot: candidates[0]!.admission.importEvidence!.thresholdArtifactRoot }, retention: graph, fixture: {
    author: async () => {
      const result = await ingestNamedFactoryPacket({ producerIdentity: "emitTacticalFactoryPacket", origin: "tactical-oracle", evidenceClass: "real_producer", producerInput: { split: "development", doctrineFamily: "finite-retained-v3", provider: { providerId: "source-fixture", modelId: "local", modelVersion: "test", settingsRoot: r("settings"), promptRoot: r("prompt"), contextRoot: r("context") }, build: { buildRoot: r("build"), toolchainRoot: r("toolchain") }, lineage: { predecessorRoot: LAB_ADMITTED_ROOTS.currentStartRoot, correctionRoot: null, retryParentRoot: null } } }, repository)
      if (result.disposition !== "accepted") throw Error("fixture ingestion")
      const ingestion = readFactoryIngestion(repository, result.artifactRoot)
      // Author-validation is outside this focused failed-provider reader test.
      vi.spyOn(leagueAuthoring, "verifyRetainedLeagueAuthoring").mockReturnValue({ ingestion } as never)
      const body = { disposition: "produced" as const, allocationRoot: allocation.root, startRoot: start.root, jobId: job.id, ingestionArtifactRoot: result.artifactRoot, modelTokens: 0, elapsedMilliseconds: 0 }
      return { disposition: body.disposition, startRoot: start.root, ingestionArtifactRoot: result.artifactRoot, modelTokens: 0, elapsedMilliseconds: 0, evidenceArtifactRoot: put({ ...body, root: labRoot("league-authoring-result-v1", body) }) }
    }, host: { createFactorySupervisedRuntime(request) {
      if (++constructors === (stage === "issuance" ? 2 : stage === "prefix" ? 20 : -1)) throw stop
      const provider = synthetic.host.createFactorySupervisedRuntime(request)
      Object.assign(provider.identity, { tupleId: MATCH_KERNEL.tupleId })
      return stage === "execution" ? { ...provider, invoke() { throw stop } } : provider
    } }, run: async (request) => { runs++; return stage === "execution" ? runCanonicalLabMatch(request) : synthetic.run(request) },
  } })).rejects.toThrow()
  const failureRoot = graph.latestRoot!, records = readLeagueRecordGraph(league, failureRoot, allocation.operations)
  ledger = terminalizeRedTeamAttempt({ ledger, startRoot: start.root, disposition: "system_failure", usage: null, evidenceRoots: [failureRoot], candidateAdmissionRoot: null })
  const blocks = [{ seed: allocation.seedBlocks[0], round: { round: { root: start.roundRoot }, roundOrdinal: 0, target: {} }, matrix: { solver: { weights: [] } }, candidateRoots: candidates.map((row) => row.admission.candidate.root) }] as never
  expect(() => verifyRetainedProductionFailures(repository, allocation, records, ledger, blocks, candidates)).not.toThrow()
  if (stage === "issuance") {
    const validationRoot = records.roots("response-validation")[0]!
    const missing = { ...records, roots(kind: string) { return kind === "response-validation" ? [] : records.roots(kind) } }
    expect(() => verifyRetainedProductionFailures(repository, allocation, missing, ledger, blocks, candidates)).toThrow("RETAINED_FAILED_RESPONSE_VALIDATION")
    const node = structuredClone(records.get(validationRoot)!), wrong = { ...records, get(root: typeof validationRoot) { return root === validationRoot ? node : records.get(root) } }
    node.value.sourceRoot = "wrong"
    expect(() => verifyRetainedProductionFailures(repository, allocation, wrong, ledger, blocks, candidates)).toThrow("RETAINED_FAILED_RESPONSE_VALIDATION")
  }
  expect(runs).toBe(stage === "issuance" ? 0 : stage === "execution" ? 1 : 9)
  expect(records.roots("response-runtime-cleanup")).toHaveLength(stage === "issuance" ? 1 : stage === "execution" ? 2 : 19)
  const mutations = ["image", "runtimeLimitsRoot", "tupleId", "tupleRoot", "factoryPacketRoot", "factoryProposalRoot", "factoryValidationRoot", "sourceRoot", "executableRoot", "attemptRoot", "budgetRoot", "revisionId"]
  for (const kind of ["response-runtime-cleanup", "response-runtime-invocation", "response-runtime-invocation-failure", "response-match-result", "response-match-execution-failure"]) {
    const selectedRoot = records.roots(kind)[0]
    if (!selectedRoot) continue
    for (const field of mutations) {
      const node = structuredClone(records.get(selectedRoot)!), wrong = { ...records, get(root: typeof selectedRoot) { return root === selectedRoot ? node : records.get(root) } }
      if (kind === "response-runtime-invocation") node.value.originalEvidence.identity[field] = "wrong"
      else if (kind === "response-match-result" || kind === "response-match-execution-failure") { if (!node.value.execution.accounting.length) continue; node.value.execution.accounting[0].identity[field] = "wrong" }
      else node.value.identity[field] = "wrong"
      expect(() => verifyRetainedProductionFailures(repository, allocation, wrong, ledger, blocks, candidates), `${stage}:${kind}:${field}`).toThrow(/RETAINED_RESPONSE_PROSPECTIVE_PROVIDER|RETAINED_FAILED_RESPONSE_IDENTITY/u)
    }
  }
  if (stage === "prefix") {
    const original = supervisionArtifacts.readFactorySupervisionArtifactRecords
    for (const field of ["image", "runtimeLimitsRoot", "tupleRoot", "factoryPacketRoot", "factoryProposalRoot", "factoryValidationRoot", "sourceRoot", "executableRoot"]) {
      const spy = vi.spyOn(supervisionArtifacts, "readFactorySupervisionArtifactRecords").mockImplementation((...args) => {
        const stored = original(...args), records = stored.records.map((row) => {
          if (row.kind !== "receipt") return row
          const value = row.value
          if (!value || typeof value !== "object" || !("candidateIdentity" in value) || !value.candidateIdentity || typeof value.candidateIdentity !== "object") throw Error("fixture receipt identity")
          return { ...row, value: { ...value, candidateIdentity: { ...value.candidateIdentity, [field]: "wrong" } } }
        })
        return { ...stored, records }
      })
      expect(() => verifyRetainedProductionFailures(repository, allocation, records, ledger, blocks, candidates)).toThrow("RETAINED_RESPONSE_PROSPECTIVE_PROVIDER")
      spy.mockRestore()
    }
  }
}, 120000)
it("prospective lifetime preparation binds current reviewed roots before candidate reads", () => {
  const input = prospectiveLifetimeFixture(), source = leagueCurrentSourceIdentity(), readCandidates = vi.fn(() => { throw Error("reached v2 candidate seam") })
  expect(() => prepareProspectiveSeriousLeague(input, { factoryRepository: {} as never, fixture: { readCandidates } })).toThrow("STALE_IMPLEMENTATION")
  expect(readCandidates).not.toHaveBeenCalled()
  const { root: _root, schemaVersion: _schema, ...amendment } = input.amendment
  const current = { ...input, implementationRoot: source.implementationRoot, amendment: createLeagueProspectiveAmendmentV2({ ...amendment, implementationRoot: source.implementationRoot, sourceRoot: source.sourceRoot }) }
  // The constructor, not a stale precomputed root, must select prospective-v2.
  expect(() => prepareProspectiveSeriousLeague(current, { factoryRepository: {} as never, fixture: { readCandidates } })).toThrow("reached v2 candidate seam")
})
it("host response receipt V3 preparation explicitly admits exact current roots before candidate reads", () => {
  const input = prospectiveLifetimeFixture(), { root: _root, schemaVersion: _schema, ...body } = input.amendment, source = leagueCurrentSourceIdentity()
  const policy = { ...body.policy, operations: { ...body.policy.operations, hostResponseReceiptMilliseconds: 5000 as const } }
  const amendment = createLeagueProspectiveAmendmentV3({ ...body, ...source, policy, hostReceiptApproval: "265-PROSPECTIVE-HOST-RECEIPT-APPROVAL-20261002" })
  const current = { ...input, implementationRoot: source.implementationRoot, operations: policy.operations, amendment }, readCandidates = vi.fn(() => { throw Error("reached v3 candidate seam") })
  expect(() => prepareProspectiveSeriousLeague(current, { factoryRepository: {} as never, fixture: { readCandidates } })).toThrow("reached v3 candidate seam")
  expect(readCandidates).toHaveBeenCalledOnce()
  const stale = { ...current, implementationRoot: input.implementationRoot, amendment: createLeagueProspectiveAmendmentV3({ ...body, policy, hostReceiptApproval: "265-PROSPECTIVE-HOST-RECEIPT-APPROVAL-20261002" }) }
  readCandidates.mockClear()
  expect(() => prepareProspectiveSeriousLeague(stale, { factoryRepository: {} as never, fixture: { readCandidates } })).toThrow("STALE_IMPLEMENTATION")
  expect(readCandidates).not.toHaveBeenCalled()
})
it("prospective lifetime source closure inventories each changed production byte", () => {
  const manifest = factoryAssessmentImplementationManifest(), current = leagueCurrentSourceIdentity()
  for (const path of ["packages/strategy-lab/src/league/allocation.ts", "scripts/lib/v1-38-league-host-receipt.ts", "scripts/lib/v1-38-lean-container-match-session.ts", "scripts/lib/v1-38-league-prospective-lifetime.ts", "scripts/lib/v1-38-factory-supervised-runtime.ts", "scripts/lib/v1-38-planner-supervised-runtime.ts", "scripts/run-v1-38-serious-league.ts", "scripts/lib/v1-38-league-response-runtime.ts"]) {
    const entry = manifest.entries.find((entry) => entry.path === path)
    expect(entry?.root).toBe(`sha256:${createHash("sha256").update(readFileSync(path)).digest("hex")}`)
    const changed = manifest.entries.map((entry) => entry.path === path ? { ...entry, root: labRoot("modified-production-byte", path) } : entry)
    expect(labRoot("factory-reviewed-implementation-v2", changed)).not.toBe(current.implementationRoot)
    expect(labRoot("league-reviewed-source-bytes-v1", changed)).not.toBe(current.sourceRoot)
  }
})
const controlledGraphSyncs = () => {
  const pending: Array<(error?: Error) => Promise<void>> = []
  const syncFile = (fd: number) => new Promise<void>((resolve, reject) => {
    pending.push((error) => new Promise<void>((done) => fsync(fd, (actual) => { if (error || actual) reject(error ?? actual); else resolve(); done() })))
  })
  return { pending, syncFile }
}
describe("asynchronous invocation graph retention", () => {
  const limits = { maxArtifactBytes: 2_000_000, maxArtifactRecords: 100 }
  const snapshot = (directory: string) => readdirSync(directory).sort().map((name) => [name, readFileSync(join(directory, name)).toString("hex")])
  it.each(["runtime-invocation", "response-runtime-invocation"])("retains exact sync bytes/roots/charges for %s including prior links", async (kind) => {
    const syncBase = createLeagueRepository(temporary()), asyncBase = createLeagueRepository(temporary())
    const syncCharges: number[] = [], asyncCharges: number[] = [], sync = new LeagueRecordGraph(createLeagueRepository(syncBase.directory, { beforePublication: ({ byteLength }) => { syncCharges.push(byteLength) } }), limits)
    const syncs = controlledGraphSyncs(), barriers: number[] = []
    const graph = new LeagueRecordGraph(createLeagueRepository(asyncBase.directory, { syncFile: syncs.syncFile, beforePublication: ({ byteLength }) => { asyncCharges.push(byteLength) }, syncDirectory(directory) { barriers.push(readdirSync(directory).length); asyncBase.durability.syncDirectory(directory) } }), limits)
    const prior = sync.append("prior", { prior: true }); expect(graph.append("prior", { prior: true })).toBe(prior)
    barriers.length = 0
    const expected = sync.append(kind, { ordinal: 1 }, [prior, prior]), work = graph.appendInvocation(kind, { ordinal: 1 }, [prior, prior])
    expect(syncs.pending).toHaveLength(2); expect(graph.latestRoot).toBe(prior)
    const before = snapshot(asyncBase.directory)
    expect(() => graph.append("failure", {})).toThrow("PENDING")
    await expect(graph.appendInvocation(kind, {})).rejects.toThrow("PENDING")
    expect(() => graph.beforeDispatch()).toThrow("PENDING"); expect(() => graph.beforeInvocation({})).toThrow("PENDING")
    expect(snapshot(asyncBase.directory)).toEqual(before)
    await syncs.pending[1]!(); expect(barriers).toEqual([]); expect(graph.latestRoot).toBe(prior)
    await syncs.pending[0]!(); expect(await work).toBe(expected)
    // A concurrent refusal is not a failure of the active legitimate write.
    expect(() => graph.beforeDispatch()).not.toThrow(); expect(() => graph.beforeInvocation({})).not.toThrow()
    expect(barriers).toEqual([5, 6]); expect(snapshot(asyncBase.directory)).toEqual(snapshot(syncBase.directory)); expect(asyncCharges).toEqual(syncCharges)
    expect(readLeagueRecordGraph(asyncBase, expected, limits).get(expected)?.kind).toBe(kind)
  })
  it.each(["runtime-invocation", "response-runtime-invocation"])("CR-01 latches %s preparation and multi-chunk publication failures graph-wide", async (kind) => {
    for (const boundary of ["file", "directory", "link-group", "canonical"] as const) {
      const base = createLeagueRepository(temporary()), error = Error(`original ${boundary} failure`)
      const budget = new LeagueRetentionBudget(createLeagueExecutionAllocation(allocationFixture()))
      const repository = createLeagueRepository(base.directory, {
        beforePublication(value) { budget.beforePublication(value); if (boundary === "link-group") throw error },
        syncDirectory(directory) { if (boundary === "directory") throw error; base.durability.syncDirectory(directory) },
      }), graph = new LeagueRecordGraph(repository, limits, budget)
      if (boundary === "file") { descriptorSyncFailure.active = true; descriptorSyncFailure.error = error }
      const links = boundary === "link-group" ? Array.from({ length: 129 }, (_, i) => labRoot("CR-01-links", i)) : []
      const caught = await graph.appendInvocation(kind, boundary === "canonical" ? undefined : { text: "A".repeat(140000) }, links).catch((caught) => caught)
      descriptorSyncFailure.active = false; descriptorSyncFailure.error = null
      if (boundary === "canonical") expect(caught.message).toBe("SERIOUS_LEAGUE_CANONICAL")
      else expect(caught).toBe(error)
      expect(graph.latestRoot).toBeNull(); expect(graph.invocationPending).toBe(false)
      expect(budget.usage).toMatchObject({ workRecords: boundary === "canonical" ? 0 : 1, terminalRecords: 0, exhausted: false })
      const charges = { ...budget.usage }
      expect(() => graph.beforeDispatch()).toThrow("RETENTION_DISPATCH_STOP")
      expect(() => graph.beforeInvocation({})).toThrow("RETENTION_DISPATCH_STOP")
      await expect(graph.appendInvocation(kind, {})).rejects.toThrow("RETENTION_DISPATCH_STOP")
      let guestCalls = 0
      // A fresh wrapper must consult the shared graph, not only its local latch.
      const provider = { identity: {} as never, invoke() { guestCalls++; throw Error("guest must not run") }, verify() { return false }, close() { return { cleanupComplete: true, orphanedChild: false } } }
      const other = wrapLeagueProbeProvider(provider, undefined, { minX: 0, maxX: 11 }, () => {}, (request) => graph.beforeInvocation(request), graph)
      await expect(other.invoke({} as never, provider.identity)).rejects.toThrow("RETENTION_DISPATCH_STOP")
      expect(guestCalls).toBe(0); expect(budget.usage).toEqual(charges)
      expect(readdirSync(repository.directory).filter((name) => name.endsWith(".bin"))).toHaveLength(boundary === "directory" ? 1 : 0)
    }
  })
  it("waits through sibling failure before gate/cleanup and stops dispatch without claiming budget exhaustion", async () => {
    const base = createLeagueRepository(temporary()), syncs = controlledGraphSyncs(), error = Error("dependency failed"), allocation = createLeagueExecutionAllocation(allocationFixture()), budget = new LeagueRetentionBudget(allocation)
    const graph = new LeagueRecordGraph(createLeagueRepository(base.directory, { syncFile: syncs.syncFile, beforePublication: budget.beforePublication }), limits, budget)
    const prior = graph.append("prior", { value: true }); let rejected = false, gated = false
    const work = graph.appendInvocation("runtime-invocation", { ordinal: 1 }).catch((caught) => { rejected = true; return caught })
    const gate = graph.settlePending().then(() => { gated = true })
    await syncs.pending[0]!(error); await Promise.resolve()
    expect(rejected).toBe(false); expect(gated).toBe(false); expect(graph.latestRoot).toBe(prior)
    await syncs.pending[1]!(); expect(await work).toBe(error); await gate
    expect(budget.usage).toMatchObject({ workRecords: 5, exhausted: false })
    expect(() => graph.beforeDispatch()).toThrow("RETENTION_DISPATCH_STOP")
    expect(() => graph.beforeInvocation({})).toThrow("RETENTION_DISPATCH_STOP")
    expect(() => graph.append("runtime-invocation-failure", { failed: true })).not.toThrow()
  })
  it.each([1, 2])("does not credit a head on directory barrier %i failure", async (boundary) => {
    const base = createLeagueRepository(temporary()); let barriers = 0
    const graph = new LeagueRecordGraph(createLeagueRepository(base.directory, { syncDirectory(directory) { if (++barriers === boundary) throw Error("barrier failed"); base.durability.syncDirectory(directory) } }), limits)
    await expect(graph.appendInvocation("response-runtime-invocation", {})).rejects.toThrow("barrier failed")
    expect(graph.latestRoot).toBeNull(); expect(readdirSync(base.directory)).toHaveLength(boundary === 1 ? 2 : 3)
  })
  it("does not credit a head when the real serial descriptor file fsync boundary fails", async () => {
    const repository = createLeagueRepository(temporary()), charges: string[] = []
    const graph = new LeagueRecordGraph(createLeagueRepository(repository.directory, { beforePublication: ({ target }) => { charges.push(target) } }), limits)
    descriptorSyncFailure.active = true
    await expect(graph.appendInvocation("runtime-invocation", {})).rejects.toThrow("descriptor file fsync failed")
    expect(graph.latestRoot).toBeNull(); expect(charges).toHaveLength(3)
    expect(readdirSync(repository.directory).filter((name) => name.includes(".tmp-"))).toHaveLength(1)
    expect(() => graph.beforeDispatch()).toThrow("RETENTION_DISPATCH_STOP")
  })
  it.each([0, 1, 2])("keeps exact bytes and one dependency barrier when %i dependencies already exist", async (existing) => {
    const reference = createLeagueRepository(temporary()), expected = new LeagueRecordGraph(reference, limits).append("runtime-invocation", { ordinal: 1 })
    const payload = Buffer.from('{"ordinal":1}'), root = `sha256:${createHash("sha256").update(payload).digest("hex")}`
    const dependencies = readdirSync(reference.directory).filter((name) => !name.includes(expected.slice(7))).sort((left) => left.includes(root.slice(7)) ? -1 : 1)
    const repository = createLeagueRepository(temporary())
    for (const name of dependencies.slice(0, existing)) publishLeagueArtifact(repository, readFileSync(join(reference.directory, name)))
    let syncs = 0, barriers = 0, charges = 0
    const graph = new LeagueRecordGraph(createLeagueRepository(repository.directory, { syncFile(fd) { syncs++; return new Promise<void>((resolve, reject) => fsync(fd, (error) => { if (error) reject(error); else resolve() })) }, syncDirectory(directory) { barriers++; repository.durability.syncDirectory(directory) }, beforePublication() { charges++ } }), limits)
    expect(await graph.appendInvocation("runtime-invocation", { ordinal: 1 })).toBe(expected)
    expect(syncs).toBe(2 - existing); expect(charges).toBe(3 - existing); expect(barriers).toBe(2)
    expect(snapshot(repository.directory)).toEqual(snapshot(reference.directory))
  })
  it("prechecks complete-group byte/record/reserve caps before writing", async () => {
    for (const constrained of [{ maxArtifactBytes: 1, maxArtifactRecords: 100 }, { maxArtifactBytes: 2_000_000, maxArtifactRecords: 2 }]) {
      const base = createLeagueRepository(temporary()), graph = new LeagueRecordGraph(base, constrained)
      await expect(graph.appendInvocation("runtime-invocation", {})).rejects.toThrow("RETENTION_BUDGET")
      expect(readdirSync(base.directory)).toEqual([])
    }
    const base = createLeagueRepository(temporary()), graph = new LeagueRecordGraph(base, limits)
    await expect(graph.appendInvocation("runtime-invocation", {}, [], { bytes: limits.maxArtifactBytes, records: 0 })).rejects.toThrow("RETENTION_BUDGET")
    expect(readdirSync(base.directory)).toEqual([])
  })
  it("retains partial charge on callback refusal, refuses uncertain republication and leaves sync fallback intact", async () => {
    const base = createLeagueRepository(temporary()), budget = new LeagueRetentionBudget(createLeagueExecutionAllocation(allocationFixture())); let calls = 0
    const graph = new LeagueRecordGraph(createLeagueRepository(base.directory, { beforePublication(value) { if (++calls === 2) throw Error("refused"); budget.beforePublication(value) } }), limits, budget)
    await expect(graph.appendInvocation("runtime-invocation", {})).rejects.toThrow("refused")
    expect(budget.usage.workRecords).toBe(1); expect(readdirSync(base.directory)).toEqual([])
    expect(() => graph.append("runtime-invocation", {})).toThrow("UNCERTAIN_REPUBLICATION")
    for (const [kind, value, expected] of [["runtime-invocation", { text: "A".repeat(140000) }, 5], ["runtime-cleanup", { closed: true }, 3]] as const) {
      const fallback = createLeagueRepository(temporary()); let barriers = 0, syncs = 0
      const writer = new LeagueRecordGraph(createLeagueRepository(fallback.directory, { syncFile: async () => { syncs++ }, syncDirectory(directory) { barriers++; fallback.durability.syncDirectory(directory) } }), limits)
      const root = await writer.appendInvocation(kind, value)
      expect(barriers).toBe(expected); expect(syncs).toBe(0); expect(readLeagueRecordGraph(fallback, root, limits).get(root)?.value).toEqual(value)
    }
  })
  it.each([
    { race: "same-wrapper", fault: "none" }, { race: "shared-graph", fault: "none" },
    { race: "shared-graph CR-02", fault: "persistent" }, { race: "shared-graph CR-02", fault: "cell-failure" },
    { race: "shared-graph CR-02", fault: "journal" },
    { race: "shared-graph CR-02", fault: "persistent-close" },
  ])("ordinary $race adapter waits for settlement with secondary fault=$fault", async ({ race, fault }) => {
    const candidates = [await candidate(1), await candidate(3)], base = allocationFixture(), syncs = controlledGraphSyncs()
    let syncReady!: () => void, raceReady!: () => void
    const syncing = new Promise<void>((resolve) => { syncReady = resolve }), racing = new Promise<void>((resolve) => { raceReady = resolve })
    let secondaryActive = false, budget: LeagueRetentionBudget | undefined
    const secondary = Error("secondary retention fault")
    const repository = createLeagueRepository(temporary(), {
      beforePublication(value) { budget?.beforePublication(value); if (secondaryActive && (fault.startsWith("persistent") || fault === "journal" && value.target.endsWith(".terminal.json"))) throw secondary },
      syncFile(fd) { const work = syncs.syncFile(fd); if (syncs.pending.length === 2) syncReady(); return work },
    })
    const allocation = createLeagueExecutionAllocation({ ...base, outputDirectories: { league: repository.directory, responseFactory: null }, implementationRoot: factoryAssessmentImplementationRoot(), initialCandidatePublicationRoots: candidates.map((row) => row.publicationRoot).sort(), independenceReferencePublicationRoot: candidates[0]!.publicationRoot })
    let guestCalls = 0, closes = 0, firstError: unknown, raceError: unknown, issued = false
    const error = Error("original dependency error")
    const fixture: LeagueFixtureSeams = { candidates, host: { createFactorySupervisedRuntime(request) {
      const provider = host.createFactorySupervisedRuntime(request), identities = new WeakSet<object>()
      return { ...provider, invoke(request) { guestCalls++; const evidence = { identity: provider.identity, requestId: request.requestId, method: request.kind, inputRoot: labRoot("runtime-input", request.input), ordinal: 0, invocationRoot: labRoot("async-ordinary-fixture", request), charged: true, completed: true, outputBytes: 2, result: { ok: true as const, value: { activationOrders: [], strategyMemory: {} } } }; identities.add(evidence); return evidence }, verify(evidence) { return identities.has(evidence) }, close() { closes++; if (fault === "persistent-close" && closes === 1) throw secondary; return { cleanupComplete: true, orphanedChild: false } } }
    } }, run: async ({ match, providers }) => {
      const state = MATCH_KERNEL.createMachineV119(match).initialState, [first, other] = Object.values(providers)
      const request = { kind: "selectActivations", requestId: "source-only-ordinary", semanticTupleId: "candidate-kernel-v1.19", coordinates: { phaseNumber: 1, roundNumber: 1, stage: "select_bottom", ordinal: 0, actingPlayerId: match.bottomPlayerId }, input: { phaseNumber: 1, roundNumber: 1, activationCount: 1, board: { bounds: state.bounds, soldiers: state.soldiers, terrainStones: [] }, mySoldiers: state.soldiers.filter((row) => row.ownerPlayerId === match.bottomPlayerId), enemySoldiers: state.soldiers.filter((row) => row.ownerPlayerId !== match.bottomPlayerId), strategyMemory: {}, initialInitiativePlayerId: match.initialInitiativePlayerId, hasInitialInitiative: true, roundInitiativePlayerId: match.initialInitiativePlayerId, hasRoundInitiative: true } } as const
      const invocation = Promise.resolve(first!.invoke(request as never, first!.identity)).then(() => { issued = true }, (caught) => { firstError = caught })
      await syncing
      const target = race === "same-wrapper" ? first! : other!
      const rejected = Promise.resolve(target.invoke(request as never, target.identity)).catch((caught) => { raceError = caught })
      expect(() => target.close()).toThrow("PENDING"); raceReady()
      await Promise.all([invocation, rejected]); throw firstError
    } }
    budget = new LeagueRetentionBudget(allocation)
    const session = new LeagueConnectedSession({ allocation, allocationRoot: allocation.root, repository, factoryRepository: candidates[0]!.factoryRepository, responseFactoryRepository: null, fixture }, allocation, budget)
    if (fault === "cell-failure") {
      const append = session.graph.append.bind(session.graph)
      vi.spyOn(session.graph, "append").mockImplementation((kind, ...args) => { if (secondaryActive && kind === "cell-issuance-failure") throw secondary; return append(kind, ...args) })
    }
    const pending = session.matrix(candidates, allocation.seedBlocks[0]!).catch((caught) => caught)
    await racing
    const prior = session.graph.latestRoot, before = readdirSync(repository.directory).sort()
    expect(guestCalls).toBe(1); expect(closes).toBe(0); expect(issued).toBe(false)
    expect(readLeagueRecordGraph(repository, prior!, allocation.operations).roots("runtime-invocation-failure")).toEqual([])
    await syncs.pending[0]!(error); await Promise.resolve()
    expect(firstError).toBeUndefined(); expect(raceError).toBeUndefined(); expect(closes).toBe(0); expect(session.graph.latestRoot).toBe(prior)
    expect(readdirSync(repository.directory).sort()).toEqual(before)
    const chargedBeforeFailure = { ...budget.usage }; secondaryActive = true
    await syncs.pending[1]!(); expect(await pending).toBe(error); expect(firstError).toBe(error)
    expect((raceError as Error).message).toContain("PENDING"); expect(guestCalls).toBe(1); expect(issued).toBe(false); expect(closes).toBe(2)
    const reopened = readLeagueRecordGraph(repository, session.graph.latestRoot!, allocation.operations)
    expect(reopened.roots("runtime-invocation")).toEqual([]); expect(reopened.roots("runtime-invocation-failure")).toHaveLength(fault.startsWith("persistent") ? 0 : 2); expect(reopened.roots("runtime-cleanup")).toHaveLength(fault.startsWith("persistent") ? 0 : 2)
    expect(reopened.roots("runtime-cleanup-failure")).toEqual([])
    if (fault.startsWith("persistent")) { expect(session.graph.latestRoot).toBe(prior); expect(reopened.roots("cell-issuance-failure")).toEqual([]) }
    expect(readdirSync(repository.directory).filter((name) => name.endsWith(".terminal.json"))).toHaveLength(fault === "none" ? 1 : 0)
    expect(budget.usage.workRecords).toBeGreaterThanOrEqual(chargedBeforeFailure.workRecords); expect(budget.usage.workBytes).toBeGreaterThanOrEqual(chargedBeforeFailure.workBytes)
    expect(() => session.graph.beforeInvocation({})).toThrow("RETENTION_DISPATCH_STOP")
  })
})
describe("graph dependency durability", () => {
  const limits = { maxArtifactBytes: 2_000_000, maxArtifactRecords: 100 }
  const digest = (bytes: Uint8Array) => `sha256:${createHash("sha256").update(bytes).digest("hex")}` as const
  const expectedArtifacts = (value: unknown) => {
    const encoded = admitCanonicalJsonValue(value, { profile: "canonical-manifest" })
    if (!encoded.ok) throw Error("invalid injected value")
    const chunkRoot = digest(encoded.canonicalBytes)
    const node = { schemaVersion: "league-record-chunk-v1", ordinal: 0, previousRoot: null, bytesRoot: chunkRoot, byteLength: encoded.canonicalByteLength }
    const nodeBytes = admitCanonicalJsonValue(node, { profile: "canonical-manifest" })
    if (!nodeBytes.ok) throw Error("invalid injected node")
    const body = { schemaVersion: "league-record-v1", privacy: "private_offline", kind: "runtime-invocation", byteLength: encoded.canonicalByteLength, recordRoot: chunkRoot, chunkCount: 1, tailRoot: digest(nodeBytes.canonicalBytes), links: [] }
    const descriptor = admitCanonicalJsonValue({ ...body, root: labRoot("league-record-v1", body) }, { profile: "canonical-manifest" })
    if (!descriptor.ok) throw Error("invalid injected descriptor")
    return { roots: [chunkRoot, digest(nodeBytes.canonicalBytes), digest(descriptor.canonicalBytes)], bytes: [encoded.canonicalBytes, nodeBytes.canonicalBytes, descriptor.canonicalBytes] }
  }
  it("keeps exact artifact bytes, charges and dependency-before-descriptor barriers", () => {
    const value = { ordinal: 1 }, expected = expectedArtifacts(value), events: string[] = []
    const base = createLeagueRepository(temporary())
    const repository = createLeagueRepository(base.directory, {
      beforePublication({ target }) { events.push(`charge:${target.split("/").at(-1)}`) },
      syncDirectory(directory) {
        const files = readdirSync(directory).sort()
        events.push(`barrier:${files.length}`)
        if (files.length === 2) expect(files).not.toContain(`league-artifact-${expected.roots[2]!.slice(7)}.bin`)
        base.durability.syncDirectory(directory)
      },
    })
    const graph = new LeagueRecordGraph(repository, limits)
    expect(graph.append("runtime-invocation", value)).toBe(expected.roots[2])
    expect(events).toEqual([
      ...expected.roots.slice(0, 2).map((root) => `charge:league-artifact-${root.slice(7)}.bin`),
      "barrier:2", `charge:league-artifact-${expected.roots[2]!.slice(7)}.bin`, "barrier:3",
    ])
    for (const [index, root] of expected.roots.entries()) expect(new Uint8Array(readFileSync(join(repository.directory, `league-artifact-${root.slice(7)}.bin`)))).toEqual(expected.bytes[index])
    expect(readLeagueRecordGraph(repository, graph.latestRoot!, limits).get(graph.latestRoot!)!.value).toEqual(value)
  })
  it.each(["dependency", "descriptor"] as const)("keeps charges and does not advance head after %s barrier failure", (stage) => {
    const base = createLeagueRepository(temporary()), input = allocationFixture()
    const allocation = createLeagueExecutionAllocation(input), budget = new LeagueRetentionBudget(allocation)
    let barriers = 0
    const repository = createLeagueRepository(base.directory, {
      beforePublication: budget.beforePublication,
      syncDirectory(directory) {
        barriers++
        if (barriers === (stage === "dependency" ? 1 : 2)) throw Error(`injected ${stage} barrier failure`)
        base.durability.syncDirectory(directory)
      },
    })
    const graph = new LeagueRecordGraph(repository, limits, budget), expected = expectedArtifacts({ ordinal: 1 })
    expect(() => graph.append("runtime-invocation", { ordinal: 1 })).toThrow(`injected ${stage} barrier failure`)
    expect(graph.latestRoot).toBeNull()
    expect(budget.usage).toMatchObject({ workRecords: stage === "dependency" ? 2 : 3, terminalRecords: 0, exhausted: false })
    expect(readdirSync(base.directory)).toHaveLength(stage === "dependency" ? 2 : 3)
    expect(readdirSync(base.directory).includes(`league-artifact-${expected.roots[2]!.slice(7)}.bin`)).toBe(stage === "descriptor")
    // Residual files are inspection evidence, not a returned/credited graph head.
  })
  it("does not advance an existing head when the next dependency group is refused", () => {
    const base = createLeagueRepository(temporary())
    let refuse = false
    const repository = createLeagueRepository(base.directory, { beforePublication() { if (refuse) throw Error("injected refusal") } })
    const graph = new LeagueRecordGraph(repository, limits), prior = graph.append("runtime-invocation", { ordinal: 1 })
    refuse = true
    expect(() => graph.append("runtime-invocation", { ordinal: 2 })).toThrow("injected refusal")
    expect(graph.latestRoot).toBe(prior)
    expect(readLeagueRecordGraph(base, prior, limits).size).toBe(1)
  })
  it("preserves per-artifact barriers for large invocation and other record kinds", () => {
    for (const [kind, value, expected] of [
      ["runtime-invocation", { text: "A".repeat(140000) }, 5],
      ["runtime-cleanup", { closed: true }, 3],
    ] as const) {
      const base = createLeagueRepository(temporary()); let barriers = 0
      const repository = createLeagueRepository(base.directory, { syncDirectory(directory) { barriers++; base.durability.syncDirectory(directory) } })
      const graph = new LeagueRecordGraph(repository, limits), root = graph.append(kind, value)
      expect(barriers).toBe(expected)
      expect(readLeagueRecordGraph(base, root, limits).get(root)!.value).toEqual(value)
    }
  })
})
describe("retained supervisor diagnostics", () => {
  it("retains only an exact reviewed runtime failure code", () => {
    expect(retainedSupervisorFailureDiagnostic(new TypeError("FACTORY_RUNTIME_REQUEST_IDENTITY"))).toEqual({ error: "TypeError", supervisorCode: "FACTORY_RUNTIME_REQUEST_IDENTITY" })
    expect(retainedSupervisorFailureDiagnostic(new TypeError("LAB_RUNTIME_STOPPED"))).toEqual({ error: "TypeError", supervisorCode: "LAB_RUNTIME_STOPPED" })
  })
  it("drops unknown and sensitive messages, custom names, stacks and payloads", () => {
    const secret = "source=private strategyMemory=secret stack=/private/path"
    const cases: unknown[] = [new TypeError(`FACTORY_RUNTIME_REQUEST_IDENTITY ${secret}`), new TypeError(`LAB_UNREVIEWED_${secret}`), new Error("LAB_RUNTIME_STOPPED"), { message: "LAB_RUNTIME_STOPPED", source: secret }, secret]
    const named = new Error(secret); named.name = secret; cases.push(named)
    for (const error of cases) {
      const diagnostic = retainedSupervisorFailureDiagnostic(error)
      expect(diagnostic.supervisorCode).toBeNull()
      expect(JSON.stringify(diagnostic)).not.toContain(secret)
      expect(Object.keys(diagnostic).sort()).toEqual(["error", "supervisorCode"])
    }
  })
  it("reopens coded and historical uncoded failure records without private messages", () => {
    const repository = createLeagueRepository(temporary()), limits = { maxArtifactBytes: 1000000, maxArtifactRecords: 100 }
    const writer = new LeagueRecordGraph(repository, limits)
    const historical = writer.append("runtime-invocation-failure", { error: "TypeError" })
    const current = writer.append("runtime-invocation-failure", retainedSupervisorFailureDiagnostic(new TypeError("FACTORY_RUNTIME_LIFETIME_EXHAUSTED")), [historical])
    const reopened = readLeagueRecordGraph(repository, current, limits)
    expect(reopened.get(historical)?.value).toEqual({ error: "TypeError" })
    expect(reopened.get(current)?.value).toEqual({ error: "TypeError", supervisorCode: "FACTORY_RUNTIME_LIFETIME_EXHAUSTED" })
  })
})
describe("retained cell journal bijection", () => {
  const fixture = () => {
    const allocationRoot = labRoot("join", "allocation"), cellRoot = labRoot("join", "cell"), start = { root: labRoot("join", "start"), cellRoot, allocationRoot }
    const cell = { root: cellRoot }, terminal = createLeagueCellTerminal({ cellRoot, disposition: "system_failure", processValidity: "process_invalid", evidenceRoot: labRoot("join", "evidence"), projection: null })
    const fields = { start, cell, bottomCandidateRoot: labRoot("join", "bottom"), topCandidateRoot: labRoot("join", "top"), seed: "seed", options: {} }
    const startRoot = labRoot("join", "start-record"), resultRoot = labRoot("join", "result-record")
    const reopened = { issued: false as const, remnants: [], records: [{ start, terminal, terminalProvenance: "persisted" as const }] }
    const cellStarts = [[startRoot, { value: fields }]] as const, cellResults = [[resultRoot, { value: { ...fields, terminal } }]] as const
    return { reopened, cellStarts, cellResults, allocationRoot, executedCells: 1 }
  }
  it("joins journal, unique start and result values without inferring an explicit grouped edge", () => {
    const input = fixture(), repository = createLeagueRepository(temporary()), limits = { maxArtifactBytes: 1024 * 1024, maxArtifactRecords: 100 }
    const writer = new LeagueRecordGraph(repository, limits)
    const startRecord = writer.append("cell-start", input.cellStarts[0][1].value)
    const implicit = writer.append("record-links", { count: 1 }, []) // latestRoot is an unlabeled, implicit edge to start.
    const nested = writer.append("record-links", { count: 1 }, [implicit])
    const resultRoot = writer.append("cell-result", input.cellResults[0][1].value, [nested])
    const graph = readLeagueRecordGraph(repository, resultRoot, limits)
    expect(graph.get(resultRoot)?.links).not.toContain(startRecord)
    expect(graph.get(implicit)?.links).toContain(startRecord)
    expect(graph.get(nested)?.links).toContain(implicit)
    const joined = verifyRetainedCellJournalBijection({ ...input, cellStarts: [[startRecord, graph.get(startRecord)!]], cellResults: [[resultRoot, graph.get(resultRoot)!]] })
    expect(joined.resultByStartRoot.size).toBe(1)
  })
  it("rejects missing starts, duplicate result starts, journal tampering and mismatched start/result values", () => {
    const input = fixture(), wrongRoot = labRoot("join", "wrong")
    expect(() => verifyRetainedCellJournalBijection({ ...input, cellStarts: [] })).toThrow("RETAINED_JOURNAL_COVERAGE")
    expect(() => verifyRetainedCellJournalBijection({ ...input, executedCells: 2, cellResults: [...input.cellResults, [wrongRoot, input.cellResults[0][1]]] })).toThrow("RETAINED_JOURNAL_COVERAGE")
    expect(() => verifyRetainedCellJournalBijection({ ...input, reopened: { ...input.reopened, records: [{ ...input.reopened.records[0]!, start: { ...input.reopened.records[0]!.start, cellRoot: wrongRoot } }] } })).toThrow("RETAINED_CHARGE")
    expect(() => verifyRetainedCellJournalBijection({ ...input, cellResults: [[input.cellResults[0][0], { value: { ...input.cellResults[0][1].value, seed: "tampered" } }]] })).toThrow("RETAINED_CELL_JOURNAL")
    expect(() => verifyRetainedCellJournalBijection({ ...input, cellResults: [[input.cellResults[0][0], { value: { ...input.cellResults[0][1].value, bottomCandidateRoot: wrongRoot } }]] })).toThrow("RETAINED_CELL_JOURNAL")
  })
  it("keeps a persisted no-result failure charge paired to its start, without inventing a result", () => {
    const input = fixture(), noResult = { ...input, cellResults: [], executedCells: 0 }
    const joined = verifyRetainedCellJournalBijection(noResult)
    expect(joined.journals.size).toBe(1)
    expect(joined.startByRoot.size).toBe(1)
    expect(joined.resultByStartRoot.size).toBe(0)
    // The enclosing verifier still requires the linked issuance-failure and
    // process-invalid terminal; this join never authorizes their absence.
    expect(() => verifyRetainedCellJournalBijection({ ...noResult, cellStarts: [] })).toThrow("RETAINED_JOURNAL_COVERAGE")
    expect(() => verifyRetainedCellJournalBijection({ ...noResult, reopened: { ...input.reopened, records: [{ ...input.reopened.records[0]!, terminal: { ...input.reopened.records[0]!.terminal, cellRoot: labRoot("join", "wrong-cell") } }] } })).toThrow("RETAINED_CHARGE")
  })
  it("rejects top-candidate, options and cell value mismatches despite matching roots elsewhere", () => {
    const input = fixture(), [resultRoot, result] = input.cellResults[0]!, wrongRoot = labRoot("join", "wrong")
    const changed = (value: unknown) => verifyRetainedCellJournalBijection({ ...input, cellResults: [[resultRoot, { value }]] })
    expect(() => changed({ ...result.value, topCandidateRoot: wrongRoot })).toThrow("RETAINED_CELL_JOURNAL")
    expect(() => changed({ ...result.value, options: { transform: "tampered" } })).toThrow("RETAINED_CELL_JOURNAL")
    expect(() => changed({ ...result.value, cell: { root: wrongRoot } })).toThrow("RETAINED_CELL_JOURNAL")
    expect(() => changed({ ...result.value, cell: { ...result.value.cell, extra: "tampered" } })).toThrow("RETAINED_CELL_JOURNAL")
  })
})
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

describe("CR-03 public runner initiating-error handoff", () => {
  let candidates: LeagueCandidateInput[]
  beforeEach(async () => { candidates = [await candidate(1), await candidate(3)] })
  it.each([
    { path: "ordinary", fault: "persistent" }, { path: "ordinary", fault: "run-failure" }, { path: "ordinary", fault: "none" },
    { path: "development", fault: "red-team-process-failure", regression: "CR-04" }, { path: "development", fault: "red-team-terminal", regression: "CR-04" },
    { path: "independent", fault: "red-team-process-failure", regression: "CR-04" }, { path: "independent", fault: "red-team-terminal", regression: "CR-04" },
    { path: "development", fault: "persistent" }, { path: "independent", fault: "persistent" },
  ])("$path public boundary preserves the initiating error with $fault secondary faults $regression", async ({ path, fault }) => {
    const base = allocationFixture(), syncs = controlledGraphSyncs()
    const primary = Error("primary CR-03 dependency error"), secondary = Error("secondary CR-03 publication error")
    let ready!: () => void, graph!: LeagueRecordGraph, secondaryActive = false, faults = 0, guestCalls = 0, closes = 0, producerCalls = 0
    const syncing = new Promise<void>((resolve) => { ready = resolve })
    const repository = createLeagueRepository(temporary(), { syncFile(fd) { const work = syncs.syncFile(fd); if (syncs.pending.length === 2) ready(); return work } })
    const responseDirectory = realpathSync(mkdtempSync(join(tmpdir(), "factory-public-handoff-test-"))); directories.push(responseDirectory)
    const responseFactoryRepository = createFactoryRepository(responseDirectory), r = (value: unknown) => labRoot("CR-03-fixture", value)
    const put = (value: unknown) => { const encoded = admitCanonicalJsonValue(value, { profile: "canonical-manifest" }); if (!encoded.ok) throw Error("fixture canonical"); return publishFactoryArtifact(responseFactoryRepository, encoded.canonicalBytes) }
    const producerInput = { split: "development", doctrineFamily: "source-only-public-handoff", provider: { providerId: "source-fixture", modelId: "local", modelVersion: "test", settingsRoot: r("settings"), promptRoot: r("prompt"), contextRoot: r("context") }, build: { buildRoot: r("build"), toolchainRoot: r("toolchain") }, lineage: { predecessorRoot: LAB_ADMITTED_ROOTS.currentStartRoot, correctionRoot: null, retryParentRoot: null } }
    const producerRequestArtifactRoot = put({ producerIdentity: "emitTacticalFactoryPacket", origin: "tactical-oracle", evidenceClass: "real_producer", producerInput }), disclosureArtifactRoot = put({ participantId: "author", requestArtifactRoot: producerRequestArtifactRoot, sourceAndBuildDisclosed: true, dependencyArtifactRoots: [] }), provenanceArtifactRoot = put({ participantId: "author", priorExposure: "none", conflicts: "none", origin: "tactical-oracle", deterministicDataOnly: true }), reviewArtifactRoot = put({ reviewerId: "reviewer", participantId: "author", disclosureArtifactRoot, provenanceArtifactRoot, disposition: "accepted", reviewMilliseconds: 0 })
    const reservation = { ...base.channels[0]!.perAttempt, matches: 48, effortMilliseconds: 180000 }, response = path !== "ordinary"
    const job = { id: "public-handoff", channel: "automated" as const, evaluationRole: path === "independent" ? "independent_probe_opponent" as const : "development_response" as const, operation: "produce" as const, producerRequestArtifactRoot, disclosureArtifactRoot, provenanceArtifactRoot, reviewArtifactRoot, participantId: "author", reviewerId: "reviewer", reservation, retryParentJobId: null }
    const allocation = createLeagueExecutionAllocation({ ...base, outputDirectories: { league: repository.directory, responseFactory: response ? responseDirectory : null }, implementationRoot: factoryAssessmentImplementationRoot(), initialCandidatePublicationRoots: candidates.map((row) => row.publicationRoot).sort(), independenceReferencePublicationRoot: candidates[0]!.publicationRoot,
      opportunities: { ...base.opportunities, attemptedCandidates: response ? 1 : 0, matches: 300 }, operations: { ...base.operations, wallClockMilliseconds: 60000, perAttemptMilliseconds: 180000 },
      channels: base.channels.map((channel) => response && channel.channel === "automated" ? { ...channel, disposition: "allocated", opportunities: 1, ceilings: reservation, perAttempt: reservation, participants: ["author"], reviewers: ["reviewer"] } : channel),
      rounds: [{ ordinal: 0, acceptedSlots: 0, jobs: response && path === "development" ? [job] : [] }, { ordinal: 1, acceptedSlots: 0, jobs: response && path === "independent" ? [job] : [] }],
    })
    const append = LeagueRecordGraph.prototype.append, appendKinds: string[] = []
    let fixtureEvidence: typeof allocation.root | null = null
    // This test targets failure handoff, not prerequisite probe validation or
    // retained-history generation. Keep those synthetic prerequisites inert.
    if (response) vi.spyOn(redTeamModule, "recordLeagueProbe").mockImplementation(({ ledger }) => ledger)
    vi.spyOn(LeagueRecordGraph.prototype, "append").mockImplementation(function (this: LeagueRecordGraph, kind, ...args) {
      appendKinds.push(kind)
      if (response && ["complete-matrix", "declared-round", "probe-ledger", "layout-verification", "round-advance"].includes(kind)) return fixtureEvidence!
      const failWrite = secondaryActive && (fault === "persistent" || fault === kind && (kind === "run-failure" || faults === 0))
      if (failWrite) { faults++; descriptorSyncFailure.active = true; descriptorSyncFailure.error = secondary }
      try { return append.call(this, kind, ...args) } finally { descriptorSyncFailure.active = false; descriptorSyncFailure.error = null }
    })
    const execute = LeagueConnectedSession.prototype.execute
    vi.spyOn(LeagueConnectedSession.prototype, "execute").mockImplementation(async function (this: LeagueConnectedSession, cell, bottom, top, seed, options) {
      graph = this.graph
      if (!response) return execute.call(this, cell, bottom, top, seed, options)
      // Bound the prerequisite matrix/probes to pure synthetic DRAW terminals;
      // do not run their provider schedule or retain full execution histories.
      fixtureEvidence ??= this.graph.append("source-only-prerequisite", { synthetic: true })
      const body = { schemaVersion: "league-payoff-projection-v1" as const, privacy: "private_offline" as const, cellRoot: cell.root, outcomeRoot: r("draw"), resultEventRoot: r("event"), entrantCandidateRoot: cell.entrantCandidateRoot, conditionRoot: cell.conditionRoot, semanticGeometryHash: cell.semanticGeometryHash, halfPoints: 1 as const }
      const projection = LeaguePayoffProjectionSchema.parse({ ...body, root: labRoot("league-payoff-projection-v1", body) }), terminal = createLeagueCellTerminal({ cellRoot: cell.root, disposition: "success", processValidity: "process_valid", evidenceRoot: fixtureEvidence, projection })
      return { cell, startRoot: r(cell.root), terminal, recordRoot: fixtureEvidence, canonicalBytes: r("same-synthetic-draw"), bottomCandidateRoot: bottom.admission.candidate.root, topCandidateRoot: top.admission.candidate.root }
    })
    const productionFixture = positiveResponseFixture(new Set(candidates.map((row) => row.admission.candidate.proposal.source.root)))
    const fixtureHost: LeagueFixtureSeams["host"] = { createFactorySupervisedRuntime(request) {
      const provider = productionFixture.host.createFactorySupervisedRuntime(request)
      return { ...provider, invoke(...args) { guestCalls++; return provider.invoke(...args) }, close() { closes++; return provider.close() } }
    } }
    const fixture: LeagueFixtureSeams = { candidates, host: fixtureHost, run: async ({ match, providers }) => {
      const state = MATCH_KERNEL.createMachineV119(match).initialState, [playerId, provider] = Object.entries(providers)[0]!
      const request = { kind: "selectActivations", requestId: "public-handoff-ordinary", semanticTupleId: "candidate-kernel-v1.19", coordinates: { phaseNumber: 1, roundNumber: 1, stage: "select_bottom", ordinal: 0, actingPlayerId: playerId }, input: { phaseNumber: 1, roundNumber: 1, activationCount: 1, board: { bounds: state.bounds, soldiers: state.soldiers, terrainStones: [] }, mySoldiers: state.soldiers.filter((row) => row.ownerPlayerId === playerId), enemySoldiers: state.soldiers.filter((row) => row.ownerPlayerId !== playerId), strategyMemory: {}, initialInitiativePlayerId: match.initialInitiativePlayerId, hasInitialInitiative: true, roundInitiativePlayerId: match.initialInitiativePlayerId, hasRoundInitiative: true } } as const
      await provider.invoke(request as never, provider.identity)
      throw Error("fixture must stop at the first failed retention")
    }, produce: (input) => { producerCalls++; return produceLeagueResponse({ ...input, fixture: { ...productionFixture, host: fixtureHost } }) } }
    const pending = runSeriousLeague({ allocation, allocationRoot: allocation.root, repository, factoryRepository: candidates[0]!.factoryRepository, responseFactoryRepository: response ? responseFactoryRepository : null, fixture }).then((result) => ({ result }), (error: unknown) => ({ error }))
    await syncing
    const prior = graph.latestRoot!, before = appendKinds.length, usage = { ...graph.budget!.usage }, files = { league: readdirSync(repository.directory).sort(), factory: readdirSync(responseDirectory).sort() }
    expect(syncs.pending).toHaveLength(2); expect(graph.invocationPending).toBe(true); expect(guestCalls).toBe(1); expect(closes).toBe(0); expect(producerCalls).toBe(response ? 1 : 0)
    secondaryActive = true
    await syncs.pending[0]!(primary); await Promise.resolve()
    expect(graph.latestRoot).toBe(prior); expect(graph.invocationPending).toBe(true); expect(closes).toBe(0); expect(appendKinds).toHaveLength(before); expect(faults).toBe(0)
    expect({ league: readdirSync(repository.directory).sort(), factory: readdirSync(responseDirectory).sort() }).toEqual(files)
    await syncs.pending[1]!()
    const outcome = await pending
    expect(guestCalls).toBe(1); expect(closes).toBe(2); expect(graph.invocationPending).toBe(false)
    expect(graph.budget!.usage.workBytes).toBeGreaterThanOrEqual(usage.workBytes); expect(graph.budget!.usage.workRecords).toBeGreaterThanOrEqual(usage.workRecords)
    expect(() => graph.beforeInvocation({})).toThrow("RETENTION_DISPATCH_STOP")
    if (response || ["persistent", "run-failure"].includes(fault)) {
      expect(outcome).toEqual({ error: primary }); expect("error" in outcome && outcome.error).toBe(primary)
      const retained = readLeagueRecordGraph(repository, graph.latestRoot!, allocation.operations)
      expect(retained.roots("run-failure")).toEqual([])
      if (response) { expect(appendKinds).not.toContain("run-failure"); expect(retained.roots("red-team-start")).toHaveLength(1); expect(retained.roots("red-team-terminal")).toEqual([]) }
      if (fault === "persistent") { expect(graph.latestRoot).toBe(prior); expect(retained.roots("red-team-terminal")).toEqual([]) }
    } else {
      if (!("result" in outcome)) throw outcome.error
      expect(outcome.result.processValidity).toBe("process_invalid")
      const retained = readLeagueRecordGraph(repository, outcome.result.headRoot, allocation.operations)
      expect(retained.get(outcome.result.headRoot)).toMatchObject({ kind: "run-failure", value: { error: primary.message, processValidity: "process_invalid" } })
      expect(retained.roots("red-team-start")).toEqual([]); expect(retained.roots("red-team-terminal")).toEqual([])
      const ledger = redTeamModule.declareRedTeamAllocation({ phase: 265, evidenceClass: allocation.evidenceClass, authorityRoot: allocation.root, channels: allocation.channels, probes: allocation.probes })
      expect(ledger.starts).toEqual([]); expect(ledger.terminals).toEqual([]); expect(retained.get(outcome.result.headRoot)!.value.ledgerRoot).toBe(ledger.root)
    }
    const retained = readLeagueRecordGraph(repository, graph.latestRoot!, allocation.operations)
    expect(retained.roots(response ? "response-runtime-invocation" : "runtime-invocation")).toEqual([])
    if (fault === "persistent") expect(faults).toBeGreaterThan(0)
    else expect(faults).toBe(fault === "none" ? 0 : 1)
  })
})

describe("Darwin league available-memory observation", () => {
  const result = (percentage: number) => ({ stdout: new TextEncoder().encode(`The system has 17179869184 (4194304 pages with a page size of 4096).\nSystem-wide memory free percentage: ${percentage}%\n`), stderr: new Uint8Array(), exitCode: 0, signal: null, timedOut: false })
  it("derives conservative bytes without importing the separate Phase 262 percentage gate", () => {
    expect(leagueEffectiveAvailableMemoryBytes(result(75))).toBe(12 * 2 ** 30)
    expect(leagueEffectiveAvailableMemoryBytes(result(10))).toBe(Math.floor(17179869184 / 10))
    expect(leagueEffectiveAvailableMemoryBytes(result(0))).toBe(0)
  })
  it("fails closed on command, grammar, and output errors", () => {
    expect(() => leagueEffectiveAvailableMemoryBytes({ ...result(75), exitCode: 1 })).toThrow("CAPACITY_MEMORY_MEASUREMENT")
    expect(() => leagueEffectiveAvailableMemoryBytes({ ...result(75), timedOut: true })).toThrow("CAPACITY_MEMORY_MEASUREMENT")
    expect(() => leagueEffectiveAvailableMemoryBytes({ ...result(75), stderr: new TextEncoder().encode("unexpected") })).toThrow("CAPACITY_MEMORY_MEASUREMENT")
    expect(() => leagueEffectiveAvailableMemoryBytes({ ...result(75), stdout: new TextEncoder().encode("75%") })).toThrow("CAPACITY_MEMORY_MEASUREMENT")
  })
  it("uses the bounded no-shell C-locale command and wipes owned output", () => {
    const stdout = Buffer.from(result(75).stdout), stderr = Buffer.alloc(0)
    const execute = vi.fn(() => ({ stdout, stderr, status: 0, signal: null, error: undefined }))
    expect(observeLeagueAvailableMemoryBytes(execute as unknown as typeof import("node:child_process").spawnSync)).toBe(12 * 2 ** 30)
    expect(execute).toHaveBeenCalledWith("/usr/bin/memory_pressure", ["-Q"], expect.objectContaining({ env: { LC_ALL: "C", LANG: "C", PATH: "/usr/bin:/bin:/usr/sbin:/sbin" }, stdio: ["ignore", "pipe", "pipe"], timeout: 200, killSignal: "SIGKILL", maxBuffer: 4096, shell: false }))
    expect([...stdout].every((byte) => byte === 0)).toBe(true)
    const failedStdout = Buffer.from(result(75).stdout), failedStderr = Buffer.alloc(0)
    const timeout = vi.fn(() => ({ stdout: failedStdout, stderr: failedStderr, status: null, signal: "SIGKILL", error: new Error("timed out") }))
    expect(() => observeLeagueAvailableMemoryBytes(timeout as unknown as typeof import("node:child_process").spawnSync)).toThrow("CAPACITY_MEMORY_MEASUREMENT")
    expect([...failedStdout].every((byte) => byte === 0)).toBe(true)
  })
})

it.each([false, true])("host response receipt prospective lifetime main cell retains charge before issuing two actual provider identities; v3=%s", async (v3) => {
  const rows = [await candidate(1), await candidate(3), await candidate(5)], input = prospectiveLifetimeFixture(), source = leagueCurrentSourceIdentity()
  const { root: _root, schemaVersion: _schema, ...body } = input.amendment
  const amendmentBody = { ...body, ...source, bases: rows.map((row, index) => ({ sourceSlot: ["S01", "S03", "S05"][index] as "S01" | "S03" | "S05", publicationArtifactRoot: row.publicationRoot, candidateAdmissionRoot: row.admission.root, sourceRoot: row.admission.candidate.proposal.source.root, supervisionArtifactRoot: row.admission.importEvidence!.supervisionArtifactRoot })) }
  const amendment = v3 ? createLeagueProspectiveAmendmentV3({ ...amendmentBody, policy: { ...body.policy, operations: { ...body.policy.operations, hostResponseReceiptMilliseconds: 5000 } }, hostReceiptApproval: "265-PROSPECTIVE-HOST-RECEIPT-APPROVAL-20261002" }) : createLeagueProspectiveAmendmentV2(amendmentBody)
  const repository = createLeagueRepository(temporary()), allocationInput = { ...input, operations: amendment.policy.operations, implementationRoot: source.implementationRoot, amendment, initialCandidatePublicationRoots: rows.map((row) => row.publicationRoot).sort(), independenceReferencePublicationRoot: rows[0]!.publicationRoot, outputDirectories: { league: repository.directory, responseFactory: "/fixture/factory-lifetime" } }
  const allocation = amendment.schemaVersion === "league-prospective-measurement-amendment-v3" ? createProspectiveLeagueExecutionAllocationV3({ ...allocationInput, amendment, operations: amendment.policy.operations }) : createProspectiveLeagueExecutionAllocationV2({ ...allocationInput, amendment })
  const capacity = capacityFixture(allocation), capacityReceipt = createLeagueCapacityReceipt(capacity, allocation), captured: any[] = []
  let session: LeagueConnectedSession
  const fixture: LeagueFixtureSeams = { candidates: rows, capacityContext: { ...source, nowMilliseconds: 1001, filesystemDevice: capacity.filesystemDevice, freeFilesystemBytes: capacity.freeFilesystemBytes, availableMemoryBytes: capacity.availableMemoryBytes }, host: { createFactorySupervisedRuntime(request) {
    const options = request as any, authority = options.prospectiveLifetimeAuthority
    expect(session.graph.latestRoot).not.toBeNull()
    const retained = readLeagueRecordGraph(repository, session.graph.latestRoot!, allocation.operations), charge = retained.get(retained.roots("cell-start")[0]!)!.value.start
    expect(readdirSync(repository.directory).some((name) => name.includes(charge.root.slice(7)) && name.endsWith(".started.json"))).toBe(true)
    expect(options.prospectiveLifetimeMs).toBe(600000); expect(authority.runtime.sourceRoot).toBe(request.admission.sourceRoot)
    expect(authority.runtime.factoryAuthorizationRoot).toBe(request.admission.authorizationRoot)
    const binding = { budgetRoot: request.budgetRoot, attemptRoot: request.attemptRoot, matchId: `league-${charge.root.slice(7, 31)}`, containerName: `league-${charge.root.slice(7, 25)}-${captured.length}`, ownershipLabel: `league-${allocation.root.slice(7, 25)}`, runtime: authority.runtime }
    expect(claimProspectiveLeagueLifetimeAuthority(authority, binding, 600000, "factory")).toBe(600000)
    expect(claimProspectiveLeagueLifetimeAuthority(authority, binding, 600000, "planner")).toBe(600000)
    if (v3) { for (const layer of ["factory", "planner", "session"] as const) expect(claimProspectiveLeagueHostReceiptAuthority(options.prospectiveHostReceiptAuthority, binding, layer)).toBe(5000) }
    else expect(options).not.toHaveProperty("prospectiveHostReceiptAuthority")
    captured.push(options); return host.createFactorySupervisedRuntime(request)
  } }, run: async () => { throw Error("unit stop after provider join") } }
  session = new LeagueConnectedSession({ allocation, allocationRoot: allocation.root, capacityReceipt, repository, factoryRepository: rows[0]!.factoryRepository, responseFactoryRepository: null, fixture }, allocation)
  await expect(session.matrix(rows, allocation.seedBlocks[0]!)).rejects.toThrow()
  expect(captured).toHaveLength(2)
  expect(captured[0].prospectiveLifetimeAuthority).not.toBe(captured[1].prospectiveLifetimeAuthority)
  expect(captured.map((row) => row.prospectiveLifetimeAuthority.seat)).toEqual(["bottom", "top"])
  expect(captured[0].attemptRoot).toBe(captured[1].attemptRoot)
  if (v3) expect(captured[0].prospectiveHostReceiptAuthority).not.toBe(captured[1].prospectiveHostReceiptAuthority)
})
describe("prospective CLI source-only gates", () => {
  const inputWithCurrentSource = () => {
    const input = prospectiveFixture(), { root: _root, schemaVersion: _schema, ...body } = input.amendment, source = leagueCurrentSourceIdentity()
    return { ...input, implementationRoot: source.implementationRoot, amendment: createLeagueProspectiveAmendment({ ...body, ...source }) }
  }
  const importedRows = (input: ReturnType<typeof prospectiveFixture>) => input.amendment.bases.map((base) => ({ publicationRoot: base.publicationArtifactRoot, admission: { root: base.candidateAdmissionRoot, schemaVersion: "league-candidate-import-v1", candidate: { proposal: { source: { root: base.sourceRoot } } }, importEvidence: { sourcePhase: 264, sourceSlot: base.sourceSlot, qualification: "base_distinct", publicationArtifactRoot: base.publicationArtifactRoot, supervisionArtifactRoot: base.supervisionArtifactRoot, assessmentArtifactRoot: input.amendment.historicalAssessment.artifactRoot, assessmentRoot: input.amendment.historicalAssessment.assessmentRoot, thresholdArtifactRoot: input.amendment.historicalAssessment.thresholdArtifactRoot } } })) as unknown as LeagueCandidateInput[]
  it("requires exactly data-reader-qualified S01/S03/S05 before prospective preparation returns", () => {
    const input = inputWithCurrentSource(), rows = importedRows(input), factoryRepository = { directory: "/never-opened" } as never
    let reads = 0
    const prepared = prepareProspectiveSeriousLeague(input, { factoryRepository, fixture: { readCandidates: () => { reads++; return rows } } })
    expect(reads).toBe(1)
    expect(prepared.schemaVersion).toBe("league-prospective-execution-allocation-v1")
    for (const mutate of [(v: any[]) => v.pop(), (v: any[]) => v[1].admission.importEvidence.sourceSlot = "S02", (v: any[]) => v[1].admission.importEvidence.qualification = "control_or_unresolved", (v: any[]) => v[0].publicationRoot = v[1].publicationRoot, (v: any[]) => v[0].admission.importEvidence.assessmentRoot = labRoot("substitute", 1)]) {
      const changed = structuredClone(rows); mutate(changed)
      expect(() => prepareProspectiveSeriousLeague(input, { factoryRepository, fixture: { readCandidates: () => changed } })).toThrow("PROSPECTIVE_BASE")
    }
    expect(() => validateProspectiveLeagueInitialCandidates(prepared, rows)).not.toThrow()
    expect(() => prepareProspectiveSeriousLeague(prospectiveFixture(), { factoryRepository, fixture: { readCandidates: () => { throw Error("must reject source before reader") } } })).toThrow("STALE_IMPLEMENTATION")
  })
  it("rejects absent, mismatched and stale receipts before provider issuance or durable run effects", async () => {
    const input = inputWithCurrentSource(), repository = createLeagueRepository(temporary()), responseDirectory = realpathSync(mkdtempSync(join(tmpdir(), "factory-prospective-test-"))); directories.push(responseDirectory)
    const allocation = createProspectiveLeagueExecutionAllocation({ ...input, outputDirectories: { league: repository.directory, responseFactory: responseDirectory } }), capacity = capacityFixture(allocation), receipt = createLeagueCapacityReceipt(capacity, allocation)
    let providers = 0
    const request = { allocation, allocationRoot: allocation.root, repository, factoryRepository: { directory: "/never-opened" } as never, responseFactoryRepository: createFactoryRepository(responseDirectory), fixture: { candidates: [], host: { createFactorySupervisedRuntime() { providers++; throw Error("never") } }, run: async () => { throw Error("never") } } }
    for (const capacityReceipt of [undefined, { ...receipt, allocationRoot: labRoot("wrong-allocation", 1) }, receipt]) await expect(runSeriousLeague({ ...request, capacityReceipt })).rejects.toThrow(/CAPACITY/u)
    expect(providers).toBe(0); expect(readdirSync(repository.directory)).toEqual([]); expect(readdirSync(responseDirectory)).toEqual([])
  })
  it("advertises only the exact prospective admission and rejects legacy prepare reinterpretation", async () => {
    const help = await seriousLeagueMain(["--help"])
    expect(help).toContain("prepare-prospective")
    expect(help).toContain("--capacity-receipt")
    expect(help).toContain("run --capacity-input performs static verification")
    expect(help).toContain("old receipt authority is never refreshed")
    expect(help).toContain("verify-retained is read-only")
    const path = join(temporary(), "input.json"), input = inputWithCurrentSource(), canonical = admitCanonicalJsonValue(input, { profile: "canonical-manifest" })
    if (!canonical.ok) throw Error("fixture canonical")
    writeFileSync(path, canonical.canonicalBytes)
    await expect(seriousLeagueMain(["prepare", "--allocation", path])).rejects.toThrow("DOCUMENT")
    await expect(seriousLeagueMain(["prepare-lean", "--allocation", path])).rejects.toThrow("ARGUMENTS")
    await expect(seriousLeagueMain(["run", "--allocation", path, "--capacity-input", "never-open-plan", "--capacity-receipt", "never-open-receipt"])).rejects.toThrow("ARGUMENTS")
  })
  it.each(["charged failure", "reserved crash", "partial reservation", "fresh plan", "stale after static", "static reader failure", "static closure failure", "static authoring failure", "insufficient host", "unavailable host", "live disk drop", "live memory drop", "fresh preflight", "fresh reservation crash"] as const)("retains the receipt or consumed allocation after an injected %s without redispatch", async (failure) => {
    const rows = [await candidate(1), await candidate(3), await candidate(5)], input = inputWithCurrentSource()
    const history = input.amendment.historicalAssessment
    const candidates = rows.map((row, index) => {
      const importEvidence = { ...row.admission.importEvidence!, sourceSlot: ["S01", "S03", "S05"][index]!, qualification: "base_distinct" as const, assessmentArtifactRoot: history.artifactRoot, assessmentRoot: history.assessmentRoot, thresholdArtifactRoot: history.thresholdArtifactRoot }
      const { root: _root, ...body } = row.admission, value = { ...body, importEvidence, provenanceRoot: labRoot("league-import-provenance-v1", importEvidence) }, admission = { ...value, root: labRoot("league-candidate-import-v1", value) }
      return { ...row, admission, candidateAdmission: admission }
    })
    const { root: _amendmentRoot, schemaVersion: _schema, ...body } = input.amendment
    const amendment = createLeagueProspectiveAmendment({ ...body, bases: candidates.map((row, index) => ({ sourceSlot: ["S01", "S03", "S05"][index] as "S01" | "S03" | "S05", publicationArtifactRoot: row.publicationRoot, candidateAdmissionRoot: row.admission.root, sourceRoot: row.admission.candidate.proposal.source.root, supervisionArtifactRoot: row.admission.importEvidence!.supervisionArtifactRoot })) })
    const repository = createLeagueRepository(temporary()), responseDirectory = realpathSync(mkdtempSync(join(tmpdir(), "factory-prospective-retained-test-"))); directories.push(responseDirectory)
    const responseFactoryRepository = createFactoryRepository(responseDirectory)
    let providerCalls = 0
    // The complete allocation is preserved. Explicit preflight packet records
    // below are inert and never consumed by a producer or model.
    const encodeFixture = (value: unknown) => { const encoded = admitCanonicalJsonValue(value, { profile: "canonical-manifest" }); if (!encoded.ok) throw Error("fixture canonical"); return encoded.canonicalBytes }
    const put = (value: unknown) => publishFactoryArtifact(responseFactoryRepository, encodeFixture(value))
    const auth = join(temporary(), "inert-auth.json"); writeFileSync(auth, "{}")
    const rounds = input.rounds.map((round) => ({ ...round, jobs: round.jobs.map((job) => {
      const role = input.participantRoles.find((role) => role.jobId === job.id)!, producerIdentity = { tactical: "emitTacticalFactoryPacket", teacher: "emitTeacherFactoryPacket", model: "emitModelFactoryPacket" }[role.producer], origin = `${role.producer}-oracle`, sourceMessage = "Inert source-only fixture; never dispatch.", dependencyArtifactRoots: never[] = []
      const producerInput = role.producer === "model" ? { authoring: { sourceMessage, codexExecutable: process.execPath, clientVersion: "injected", stateDirectory: join(responseDirectory, `${job.id}-state`), disclosedDirectory: join(responseDirectory, `${job.id}-disclosed`), existingAuthFile: auth, requestedModel: "gpt-5.6-sol", requestedProvider: "injected", path: "/usr/bin:/bin", settingsRoot: labRoot("inert-settings", 1), promptRoot: `sha256:${createHash("sha256").update(sourceMessage).digest("hex")}`, contextRoot: labRoot("league-disclosed-context-v1", { dependencyArtifactRoots }) }, request: {} } : role.producer === "teacher" ? { searches: [{ maxNodes: 50, maxDepth: 1 }, { maxNodes: 50, maxDepth: 1 }], request: {} } : {}
      const producerRequestArtifactRoot = put({ producerIdentity, origin, evidenceClass: "real_producer", producerInput }), disclosureArtifactRoot = put({ participantId: job.participantId, requestArtifactRoot: producerRequestArtifactRoot, sourceAndBuildDisclosed: true, dependencyArtifactRoots }), provenanceArtifactRoot = put({ participantId: job.participantId, priorExposure: "none", conflicts: "none", origin, deterministicDataOnly: true }), reviewArtifactRoot = put({ reviewerId: job.reviewerId, participantId: job.participantId, disclosureArtifactRoot, provenanceArtifactRoot, disposition: "accepted", reviewMilliseconds: 900000 })
      return { ...job, producerRequestArtifactRoot, disclosureArtifactRoot, provenanceArtifactRoot, reviewArtifactRoot }
    }) }))
    const allocation = createProspectiveLeagueExecutionAllocation({ ...input, amendment, rounds, initialCandidatePublicationRoots: candidates.map((row) => row.publicationRoot).sort(), independenceReferencePublicationRoot: candidates[0]!.publicationRoot, outputDirectories: { league: repository.directory, responseFactory: responseDirectory } }), capacity = capacityFixture(allocation), capacityReceipt = createLeagueCapacityReceipt(capacity, allocation)
    const capacityContext = { ...leagueCurrentSourceIdentity(), nowMilliseconds: 1001, filesystemDevice: capacity.filesystemDevice, freeFilesystemBytes: capacity.freeFilesystemBytes, availableMemoryBytes: capacity.availableMemoryBytes }
    const fixture: LeagueFixtureSeams = { candidates, capacityContext, host: { createFactorySupervisedRuntime() { providerCalls++; throw Error("injected issuance failure, no guest") } }, run: async () => { throw Error("no Match") } }
    const request = { allocation, allocationRoot: allocation.root, capacityReceipt, repository, factoryRepository: candidates[0]!.factoryRepository, responseFactoryRepository, fixture }
    if (!["charged failure", "reserved crash", "partial reservation"].includes(failure)) {
      const { measuredAtMilliseconds: _measured, expiresAtMilliseconds: _expires, filesystemDevice: _device, freeFilesystemBytes: _free, availableMemoryBytes: _memory, ...capacityInput } = capacity
      // New host observations deliberately differ from the old receipt: none
      // of its device/free-space/memory values may be relabeled as current.
      const freshContext = failure === "stale after static" ? capacityContext : { ...capacityContext, filesystemDevice: "fresh-observed-device", freeFilesystemBytes: capacity.freeFilesystemBytes - 1024, availableMemoryBytes: capacity.availableMemoryBytes - 1024 }
      let now = 1001, staticReads = 0, observations = 0
      vi.spyOn(Date, "now").mockImplementation(() => now)
      const timedFixture: LeagueFixtureSeams = { ...fixture, capacityContext: undefined as unknown as NonNullable<LeagueFixtureSeams["capacityContext"]>, readCandidates() {
        staticReads++; now += 300001
        if (failure === "static reader failure") throw Error("injected static reader failure")
        if (failure === "static closure failure") return candidates.map((row, index) => index ? row : { ...row, closure: candidates[1]!.closure })
        return candidates
      }, observeCapacity() {
        observations++
        if (failure === "unavailable host") throw Error("injected unavailable host observation")
        const reserved = readdirSync(repository.directory).length > 0
        return { ...freshContext, nowMilliseconds: now, freeFilesystemBytes: failure === "insufficient host" || failure === "live disk drop" && reserved ? 1 : freshContext.freeFilesystemBytes, availableMemoryBytes: failure === "live memory drop" && reserved ? 1 : freshContext.availableMemoryBytes }
      } }
      const timedRequest = { ...request, capacityReceipt: undefined, capacityInput, fixture: timedFixture }
      if (failure === "fresh plan") {
        await expect(runSeriousLeague({ ...timedRequest, capacityReceipt })).rejects.toThrow("CAPACITY_INPUT_EXCLUSIVE")
        await expect(runSeriousLeague({ ...timedRequest, capacityInput: capacityReceipt })).rejects.toThrow("DOCUMENT")
        expect(staticReads).toBe(0); expect(observations).toBe(0); expect(providerCalls).toBe(0); expect(readdirSync(repository.directory)).toEqual([])
      }
      if (failure === "static authoring failure") writeFileSync(join(responseDirectory, `factory-artifact-${allocation.rounds[0]!.jobs[0]!.producerRequestArtifactRoot.slice(7)}.bin`), "corrupt injected packet")
      if (failure.startsWith("static ")) {
        await expect(runSeriousLeague(timedRequest)).rejects.toThrow()
        expect(staticReads).toBe(1); expect(observations).toBe(0); expect(providerCalls).toBe(0); expect(readdirSync(repository.directory)).toEqual([])
        return
      }
      if (failure === "stale after static") {
        await expect(runSeriousLeague({ ...timedRequest, capacityInput: undefined, capacityReceipt })).rejects.toThrow("CAPACITY_STALE")
        expect(staticReads).toBe(1); expect(now).toBeGreaterThan(capacityReceipt.expiresAtMilliseconds)
        expect(providerCalls).toBe(0); expect(readdirSync(repository.directory)).toEqual([])
        return
      }
      if (failure === "insufficient host" || failure === "unavailable host") {
        await expect(runSeriousLeague(timedRequest)).rejects.toThrow(failure === "insufficient host" ? "CAPACITY_MARGIN" : "unavailable host observation")
        expect(staticReads).toBe(1); expect(observations).toBe(1); expect(providerCalls).toBe(0); expect(readdirSync(repository.directory)).toEqual([])
        return
      }
      if (failure === "fresh preflight") {
        const receipt = preflightProspectiveSeriousLeague({ allocation, capacity: capacityInput, factoryRepository: request.factoryRepository, fixture: timedFixture })
        expect(staticReads).toBe(1); expect(observations).toBe(1)
        expect(receipt).toEqual(createLeagueCapacityReceipt({ ...capacityInput, measuredAtMilliseconds: now, expiresAtMilliseconds: now + 300000, filesystemDevice: freshContext.filesystemDevice, freeFilesystemBytes: freshContext.freeFilesystemBytes, availableMemoryBytes: freshContext.availableMemoryBytes }, allocation))
        expect(receipt.measuredAtMilliseconds).toBeGreaterThan(capacityReceipt.expiresAtMilliseconds)
        expect(providerCalls).toBe(0); expect(readdirSync(repository.directory)).toEqual([])
        return
      }
      if (failure === "fresh reservation crash") {
        const interruptedRepository = createLeagueRepository(repository.directory, { syncDirectory() { throw Error("injected fresh reservation crash") } })
        await expect(runSeriousLeague({ ...timedRequest, repository: interruptedRepository })).rejects.toThrow("fresh reservation crash")
        const names = readdirSync(repository.directory), before = names.map((name) => readFileSync(join(repository.directory, name)).toString("hex"))
        expect(names).toHaveLength(1)
        await expect(runSeriousLeague(timedRequest)).rejects.toThrow("EEXIST")
        expect(staticReads).toBe(2); expect(now).toBe(601003); expect(providerCalls).toBe(0)
        expect(readdirSync(repository.directory)).toEqual(names); expect(names.map((name) => readFileSync(join(repository.directory, name)).toString("hex"))).toEqual(before)
        return
      }
      const result = await runSeriousLeague(timedRequest), graph = readLeagueRecordGraph(repository, result.headRoot, allocation.operations), initial = graph.get(graph.roots("run-start")[0]!)!.value
      expect(staticReads).toBe(1); expect(now).toBe(301002)
      expect(initial.capacityAtStart).toEqual({ ...freshContext, nowMilliseconds: now })
      expect(initial.capacityReceipt).toEqual(createLeagueCapacityReceipt({ ...capacityInput, measuredAtMilliseconds: now, expiresAtMilliseconds: now + 300000, filesystemDevice: freshContext.filesystemDevice, freeFilesystemBytes: freshContext.freeFilesystemBytes, availableMemoryBytes: freshContext.availableMemoryBytes }, allocation))
      expect(initial.capacityReceipt.root).not.toBe(capacityReceipt.root)
      expect(initial.capacityReceipt.costs).toEqual(capacityInput.costs)
      expect(result.processValidity).toBe("process_invalid")
      expect(providerCalls).toBe(failure === "fresh plan" ? 1 : 0)
      expect(graph.roots("cell-start")).toHaveLength(failure === "fresh plan" ? 1 : 0)
      expect(graph.get(result.headRoot)!.value.error).toContain(failure === "fresh plan" ? "injected issuance failure" : "CAPACITY_DISPATCH_STOP")
      if (failure === "fresh plan") {
        const names = readdirSync(repository.directory).sort()
        await expect(runSeriousLeague(timedRequest)).rejects.toThrow("NONEMPTY_RUN_REPOSITORY")
        expect(providerCalls).toBe(1); expect(readdirSync(repository.directory).sort()).toEqual(names)
      }
      return
    }
    if (failure !== "charged failure") {
      const interruptedRepository = createLeagueRepository(repository.directory, { syncDirectory() { throw Error("injected crash immediately after reservation") } })
      await expect(runSeriousLeague({ ...request, repository: interruptedRepository })).rejects.toThrow("immediately after reservation")
      const names = readdirSync(repository.directory).sort()
      expect(names).toHaveLength(1)
      expect(names[0]).toMatch(/^league-artifact-.*\.bin$/u)
      const reservation = JSON.parse(readFileSync(join(repository.directory, names[0]!), "utf8"))
      expect(reservation).toMatchObject({ schemaVersion: "league-prospective-allocation-reservation-v1", allocationRoot: allocation.root })
      if (failure === "partial reservation") writeFileSync(join(repository.directory, names[0]!), "")
      const before = names.map((name) => readFileSync(join(repository.directory, name)).toString("hex"))
      const refreshed = createLeagueCapacityReceipt({ ...capacity, measuredAtMilliseconds: 400000, expiresAtMilliseconds: 700000 }, allocation)
      expect(refreshed.root).not.toBe(capacityReceipt.root)
      await expect(runSeriousLeague({ ...request, capacityReceipt: refreshed, fixture: { ...fixture, capacityContext: { ...capacityContext, nowMilliseconds: 400001 } } })).rejects.toThrow("EEXIST")
      expect(providerCalls).toBe(0)
      expect(readdirSync(repository.directory).sort()).toEqual(names)
      expect(names.map((name) => readFileSync(join(repository.directory, name)).toString("hex"))).toEqual(before)
      return
    }
    const result = await runSeriousLeague(request)
    expect(providerCalls).toBe(1)
    expect(result.processValidity).toBe("process_invalid")
    const graph = readLeagueRecordGraph(repository, result.headRoot, allocation.operations), initial = graph.get(graph.roots("run-start")[0]!)!.value
    expect(initial.capacityReceipt).toEqual(capacityReceipt)
    const names = readdirSync(repository.directory).sort(), before = names.map((name) => readFileSync(join(repository.directory, name)).toString("hex"))
    const verified = verifyRetainedSeriousLeague({ repository, factoryRepository: candidates[0]!.factoryRepository, responseFactoryRepository, headRoot: result.headRoot, allocationRoot: allocation.root, limits: allocation.operations, fixtureCandidates: candidates })
    expect(verified).toMatchObject({ issued: false, processValidity: "process_invalid" })
    expect(providerCalls).toBe(1)
    expect(readdirSync(repository.directory).sort()).toEqual(names)
    expect(names.map((name) => readFileSync(join(repository.directory, name)).toString("hex"))).toEqual(before)
    const bad = new LeagueRecordGraph(createLeagueRepository(temporary()), allocation.operations)
    const missingReceipt = bad.append("run-start", { ...initial, capacityReceipt: null })
    const headRoot = bad.append("run-failure", graph.get(result.headRoot)!.value, [missingReceipt])
    expect(() => verifyRetainedSeriousLeague({ repository: bad.repository, factoryRepository: candidates[0]!.factoryRepository, responseFactoryRepository, headRoot, allocationRoot: allocation.root, limits: allocation.operations, fixtureCandidates: candidates })).toThrow("PROSPECTIVE_DOCUMENT")
  }, 60000)
})

describe("complete private league command", () => {
  it("propagates live capacity stops to dispatch and invocation while preserving terminal retention", () => {
    const allocation = createLeagueExecutionAllocation(allocationFixture())
    let capacityAvailable = true, checks = 0
    const budget = new LeagueRetentionBudget(allocation, () => { checks++; if (!capacityAvailable) throw Error("injected host headroom stop") })
    const repository = createLeagueRepository(temporary(), { beforePublication: budget.beforePublication }), graph = new LeagueRecordGraph(repository, allocation.operations, budget)
    graph.beforeDispatch(); graph.beforeInvocation({})
    expect(checks).toBe(2)
    capacityAvailable = false
    expect(() => graph.beforeDispatch()).toThrow("host headroom stop")
    expect(() => graph.beforeInvocation({})).toThrow("RETENTION_DISPATCH_STOP")
    const failureRoot = graph.append("response-production-failure", { charged: true, matchCount: 0 })
    expect(readLeagueRecordGraph(repository, failureRoot, allocation.operations).get(failureRoot)!.value).toEqual({ charged: true, matchCount: 0 })
    expect(budget.usage).toMatchObject({ exhausted: true, workRecords: 0, terminalRecords: 3 })
  })
  it("streams over-node and over-byte private executions while preserving the exact small v1 root", () => {
    const repository = createLeagueRepository(temporary()), limits = { maxArtifactBytes: 50000000, maxArtifactRecords: 10000 }, graph = new LeagueRecordGraph(repository, limits)
    const digest = (bytes: Uint8Array) => `sha256:${createHash("sha256").update(bytes).digest("hex")}` as const
    const canonical = (value: unknown) => { const admitted = admitCanonicalJsonValue(value, { profile: "canonical-manifest" }); if (!admitted.ok) throw Error("test canonical"); return admitted.canonicalBytes }
    const smallExecution = { kind: "completed", privacy: "private_offline", result: { state: { outcome: { type: "DRAW" } }, events: [{ type: "MATCH_ENDED", payload: { type: "DRAW" } }] }, transitions: [], accounting: [] }
    const smallValue = { execution: smallExecution }, smallBytes = canonical(smallValue), smallChunk = { schemaVersion: "league-record-chunk-v1", ordinal: 0, previousRoot: null, bytesRoot: digest(smallBytes), byteLength: smallBytes.length }, smallNode = canonical(smallChunk)
    const body = { schemaVersion: "league-record-v1", privacy: "private_offline", kind: "cell-result", byteLength: smallBytes.length, recordRoot: digest(smallBytes), chunkCount: 1, tailRoot: digest(smallNode), links: [] }
    const smallRoot = graph.append("cell-result", smallValue)
    expect(smallRoot).toBe(digest(canonical({ ...body, root: labRoot("league-record-v1", body) })))
    const nodes = Array.from({ length: 550 }, (_, ordinal) => ({ ordinal, afterState: { soldiers: Array.from({ length: 300 }, (_, index) => ({ id: index })) } }))
    const overNodes = { ...smallExecution, transitions: nodes }
    expect(admitCanonicalJsonValue({ execution: overNodes }, { profile: "canonical-manifest" })).toMatchObject({ ok: false, error: { code: "MAX_NODES_EXCEEDED" } })
    const nodeRoot = graph.append("cell-result", { execution: overNodes })
    const events = Array.from({ length: 80 }, (_, ordinal) => ({ type: "ROUND_STARTED", ordinal, payload: { text: String.fromCharCode(65 + ordinal % 26).repeat(115000) } }))
    const overBytes = { ...smallExecution, result: { ...smallExecution.result, events } }
    expect(admitCanonicalJsonValue({ execution: overBytes }, { profile: "canonical-manifest" })).toMatchObject({ ok: false, error: { code: "MAX_RAW_UTF8_BYTES_EXCEEDED" } })
    const responseRoot = graph.append("response-match-result", { matchCharge: { parentStartRoot: labRoot("fixture-start", 1), ordinal: 0 }, execution: overBytes })
    const failed = { kind: "failure", privacy: "private_offline", unchangedState: {}, failure: { classification: "system_failure", code: "INJECTED" }, transitions: [], accounting: events }
    const failureRoot = graph.append("response-match-execution-failure", { execution: failed })
    const read = readLeagueRecordGraph(repository, failureRoot, limits)
    expect(read.get(smallRoot)?.value.execution).toEqual(smallExecution)
    expect(read.get(nodeRoot)?.value.execution.transitions).toHaveLength(550)
    expect(read.get(responseRoot)?.value.execution.result.events[79]).toEqual(events[79])
    expect(read.get(failureRoot)?.value.execution.accounting[79]).toEqual(events[79])
    expect(normalizedGameplayRoot(overBytes as never)).toMatch(/^sha256:[a-f0-9]{64}$/u)
    expect(normalizedGameplayRoot(overBytes as never)).not.toBe(normalizedGameplayRoot({ ...overBytes, result: { ...overBytes.result, events: [...events.slice(0, -1), { ...events[79]!, ordinal: 999 }] } } as never))
    expect(deriveLeagueResultEventRoot(smallExecution.result.events)).toBe(labRoot("league-result-events-v1", smallExecution.result.events))
    expect(deriveLeagueResultEventRoot(events)).toMatch(/^sha256:[a-f0-9]{64}$/u)
    expect(sameLargeResult(overBytes.result, read.get(responseRoot)!.value.execution.result)).toBe(true)
    expect(sameLargeResult(overBytes.result, { ...overBytes.result, events: events.slice(1) })).toBe(false)
    expect(sameLargeExecution(failed as never, read.get(failureRoot)!.value.execution)).toBe(true)
    const diagnostic = diagnoseLeagueExecutionStorage(createLeagueRepository(temporary()), overBytes as never, limits)
    expect(diagnostic).toMatchObject({ headRoot: expect.stringMatching(/^sha256:/u), artifactRecords: expect.any(Number) })
    expect(diagnostic.storedBytes).toBeGreaterThan(diagnostic.inputJsonBytes)
    const exhausted = new LeagueRecordGraph(createLeagueRepository(temporary()), { maxArtifactBytes: 1000000, maxArtifactRecords: 10000 })
    expect(() => exhausted.append("cell-result", { execution: overBytes })).toThrow("RETENTION_BUDGET")
  }, 120000)

  it("reopens more execution frames than the physical artifact record cap", () => {
    const repository = createLeagueRepository(temporary()), limits = { maxArtifactBytes: 50000000, maxArtifactRecords: 100 }
    const execution = { kind: "completed", privacy: "private_offline", result: { state: {}, events: [] }, transitions: Array.from({ length: 550 }, (_, ordinal) => ({ ordinal, afterState: { soldiers: Array.from({ length: 300 }, (_, id) => ({ id })) } })), accounting: [] }
    expect(admitCanonicalJsonValue({ execution }, { profile: "canonical-manifest" })).toMatchObject({ ok: false, error: { code: "MAX_NODES_EXCEEDED" } })
    const root = new LeagueRecordGraph(repository, limits).append("cell-result", { execution })
    const artifacts = readdirSync(repository.directory).filter((name) => name.startsWith("league-artifact-")).length
    expect(execution.transitions.length + 2).toBeGreaterThan(limits.maxArtifactRecords)
    expect(artifacts).toBeLessThan(limits.maxArtifactRecords)
    expect(readLeagueRecordGraph(repository, root, limits).get(root)?.value.execution).toEqual(execution)
  }, 120000)

  it("rejects missing, changed, reordered and falsely declared private stream records", () => {
    const execution = { kind: "completed", privacy: "private_offline", result: { state: {}, events: [{ type: "one" }, { type: "two" }] }, transitions: [], accounting: [] } as never
    const prepared = prepareLeagueExecutionStream(execution), digest = (bytes: Uint8Array) => `sha256:${createHash("sha256").update(bytes).digest("hex")}` as const
    const canonical = (value: unknown) => { const admitted = admitCanonicalJsonValue(value, { profile: "canonical-manifest" }); if (!admitted.ok) throw Error("test canonical"); return admitted.canonicalBytes }
    const artifacts = new Map(prepared.artifacts.map((bytes) => [digest(bytes), bytes])), limits = { maxArtifactBytes: 1000000, maxArtifactRecords: 100 }
    const read = (root: `sha256:${string}`) => artifacts.get(root) ?? (() => { throw Error("missing artifact") })()
    expect(readLeagueExecutionStream(prepared.reference, read, limits)).toEqual(execution)
    const chunkRoot = digest(prepared.artifacts[0]!), original = prepared.artifacts[0]!
    artifacts.delete(chunkRoot); expect(() => readLeagueExecutionStream(prepared.reference, read, limits)).toThrow("missing artifact"); artifacts.set(chunkRoot, original)
    artifacts.set(chunkRoot, new TextEncoder().encode("changed")); expect(() => readLeagueExecutionStream(prepared.reference, read, limits)).toThrow("ARTIFACT_ROOT"); artifacts.set(chunkRoot, original)
    const descriptor = JSON.parse(new TextDecoder().decode(prepared.artifacts.at(-1)!))
    const forged = (changes: Record<string, unknown>) => { const { root: _root, ...body } = { ...descriptor, ...changes }, bytes = canonical({ ...body, root: labRoot("league-execution-stream-v2", body) }), artifactRoot = digest(bytes); artifacts.set(artifactRoot, bytes); return { schemaVersion: "league-execution-ref-v2" as const, artifactRoot } }
    expect(() => readLeagueExecutionStream(forged({ counts: { ...descriptor.counts, resultEvents: 3 } }), read, limits)).toThrow("DESCRIPTOR")
    expect(() => readLeagueExecutionStream(forged({ chainRoot: labRoot("wrong-chain", 1) }), read, limits)).toThrow("RECORD_COUNT")
    expect(() => readLeagueExecutionStream(forged({ executionRoot: labRoot("wrong-execution", 1) }), read, limits)).toThrow("EXECUTION_COMMITMENT")
    const node = JSON.parse(new TextDecoder().decode(prepared.artifacts[1]!)), badNode = canonical({ ...node, ordinal: 1 }), badNodeRoot = digest(badNode); artifacts.set(badNodeRoot, badNode)
    expect(() => readLeagueExecutionStream(forged({ tailRoot: badNodeRoot }), read, limits)).toThrow("CHUNK")
    const lines = new TextDecoder().decode(original).trimEnd().split("\n"), swapped = [...lines]; [swapped[2], swapped[3]] = [swapped[3]!, swapped[2]!]
    const reordered = new TextEncoder().encode(swapped.join("\n") + "\n"), reorderedRoot = digest(reordered), reorderedNode = canonical({ ...node, bytesRoot: reorderedRoot, byteLength: reordered.length }), reorderedNodeRoot = digest(reorderedNode)
    artifacts.set(reorderedRoot, reordered); artifacts.set(reorderedNodeRoot, reorderedNode)
    expect(() => readLeagueExecutionStream(forged({ tailRoot: reorderedNodeRoot }), read, limits)).toThrow("RECORD_ORDER")
    const multi = prepareLeagueExecutionStream({ kind: "completed", privacy: "private_offline", result: { state: {}, events: [{ type: "large", text: "A".repeat(150000) }] }, transitions: [], accounting: [] } as never)
    const multiArtifacts = new Map(multi.artifacts.map((bytes) => [digest(bytes), bytes]))
    const multiRead = (root: `sha256:${string}`) => multiArtifacts.get(root) ?? (() => { throw Error("missing artifact") })()
    expect(readLeagueExecutionStream(multi.reference, multiRead, limits).kind).toBe("completed")
    const firstChunkRoot = digest(multi.artifacts[0]!), secondChunkRoot = digest(multi.artifacts[2]!)
    multiArtifacts.set(firstChunkRoot, multi.artifacts[2]!); multiArtifacts.set(secondChunkRoot, multi.artifacts[0]!)
    expect(() => readLeagueExecutionStream(multi.reference, multiRead, limits)).toThrow("ARTIFACT_ROOT")
    expect(() => readLeagueExecutionStream(multi.reference, multiRead, { ...limits, maxArtifactRecords: 4 })).toThrow("DESCRIPTOR")
  }, 30000)

  it("reopens charged prefixes when execution, large graph retention or later terminal publication fails", async () => {
    for (const stage of ["execution", "graph", "terminal"] as const) {
      const candidates = [await candidate(1), await candidate(3)], base = allocationFixture()
      let rejectTerminal = stage === "terminal"
      const repository = createLeagueRepository(temporary(), { temporaryName(target) {
        if (target.endsWith(".terminal.json") && rejectTerminal) { rejectTerminal = false; throw Error("INJECTED_TERMINAL_IO") }
        return `${target}.tmp-${randomUUID()}`
      } })
      const allocation = createLeagueExecutionAllocation({ ...base, outputDirectories: { league: repository.directory, responseFactory: null }, implementationRoot: factoryAssessmentImplementationRoot(), initialCandidatePublicationRoots: candidates.map((row) => row.publicationRoot).sort(), independenceReferencePublicationRoot: candidates[0]!.publicationRoot, operations: { ...base.operations, maxArtifactBytes: stage === "graph" ? 5000000 : 20000000, terminalReserveBytes: 2000000, wallClockMilliseconds: 60000 } })
      const fixture: LeagueFixtureSeams = { candidates, host, run: async ({ match, providers }) => {
        if (stage === "execution") throw Error("INJECTED_EXECUTION_FAILURE")
        const state = MATCH_KERNEL.createMachineV119(match).initialState
        for (const provider of Object.values(providers)) provider.close()
        const events = stage === "graph" ? Array.from({ length: 80 }, (_, ordinal) => ({ type: "ROUND_STARTED", payload: { ordinal, synthetic: "A".repeat(115000) } })) : []
        return { kind: "completed", privacy: "private_offline", transitions: [], accounting: [], result: { state: { ...state, outcome: { type: "DRAW" } }, events: [...events, { type: "MATCH_ENDED", payload: { type: "DRAW" } }] } } as never
      } }
      const result = await runSeriousLeague({ allocation, allocationRoot: allocation.root, repository, factoryRepository: candidates[0]!.factoryRepository, responseFactoryRepository: null, fixture })
      const graph = readLeagueRecordGraph(repository, result.headRoot, allocation.operations), journals = readdirSync(repository.directory).filter((name) => name.endsWith(".started.json"))
      expect(result).toMatchObject({ processValidity: "process_invalid" })
      expect(graph.get(result.headRoot)?.value.executedCells).toBe(stage === "terminal" ? 1 : 0)
      expect(journals).toHaveLength(1)
      expect(graph.roots("cell-result")).toHaveLength(stage === "terminal" ? 1 : 0)
      expect(graph.roots("cell-issuance-failure")).toHaveLength(1)
      expect(verifyRetainedSeriousLeague({ repository, factoryRepository: candidates[0]!.factoryRepository, responseFactoryRepository: null, headRoot: result.headRoot, allocationRoot: allocation.root, limits: allocation.operations, fixtureCandidates: candidates })).toMatchObject({ issued: false, processValidity: "process_invalid", empiricalRequirementsComplete: false })
    }
  }, 120000)
  it("preflights the journal-start and graph-start boundary before any provider work", async () => {
    const candidates = [await candidate(1), await candidate(3)], base = allocationFixture(), repository = createLeagueRepository(temporary())
    // Marker + run-start consume four records, leaving exactly two ordinary
    // records: enough for a journal pair, but not its three-record graph node.
    const allocation = createLeagueExecutionAllocation({ ...base, outputDirectories: { league: repository.directory, responseFactory: null }, implementationRoot: factoryAssessmentImplementationRoot(), initialCandidatePublicationRoots: candidates.map((row) => row.publicationRoot).sort(), independenceReferencePublicationRoot: candidates[0]!.publicationRoot, operations: { ...base.operations, terminalReserveRecords: 24, maxArtifactRecords: 30, wallClockMilliseconds: 60000 } })
    let providers = 0
    const result = await runSeriousLeague({ allocation, allocationRoot: allocation.root, repository, factoryRepository: candidates[0]!.factoryRepository, responseFactoryRepository: null, fixture: { candidates, host: { createFactorySupervisedRuntime() { providers++; throw new Error("no dispatch capacity") } }, run: async () => { throw new Error("no execution capacity") } } })
    expect(providers).toBe(0)
    expect(result.processValidity).toBe("process_invalid")
    expect(verifyRetainedSeriousLeague({ repository, factoryRepository: candidates[0]!.factoryRepository, responseFactoryRepository: null, headRoot: result.headRoot, allocationRoot: allocation.root, limits: allocation.operations, fixtureCandidates: candidates })).toMatchObject({ issued: false, processValidity: "process_invalid" })
    expect(readdirSync(repository.directory).filter((name) => name.endsWith(".started.json"))).toHaveLength(0)
  }, 60000)
  it.each([0, 2])("reopens a NEW synthetic charged incomplete failure after %i completed effects", async (completedPrefix) => {
    const candidates = [await candidate(1), await candidate(3)], base = allocationFixture(), repository = createLeagueRepository(temporary())
    const allocation = createLeagueExecutionAllocation({ ...base, outputDirectories: { league: repository.directory, responseFactory: null }, implementationRoot: factoryAssessmentImplementationRoot(), initialCandidatePublicationRoots: candidates.map((row) => row.publicationRoot).sort(), independenceReferencePublicationRoot: candidates[0]!.publicationRoot, operations: { ...base.operations, wallClockMilliseconds: 60000 } })
    let calls = 0
    const failingHost: LeagueFixtureSeams["host"] = { createFactorySupervisedRuntime(request) {
      const provider = host.createFactorySupervisedRuntime(request), identity = { ...provider.identity, tupleId: MATCH_KERNEL.tupleId }, issued = new WeakSet<object>()
      let ordinal = 0
      return { ...provider, identity, invoke(request) {
        const completed = calls++ < completedPrefix
        const result = completed ? { ok: true, value: request.kind === "selectActivations" ? { activationOrders: [], strategyMemory: (request.input as any).strategyMemory } : { action: { type: "TURN_TO_STONE" }, soldierMemory: (request.input as any).soldierMemory } } : { ok: false, violation: { type: "INVALID_OUTPUT", message: "Runtime system failure" }, systemFailure: { code: "SUBPROCESS_EXIT", retryable: false } }
        const evidence = { identity, requestId: request.requestId, method: request.kind, inputRoot: labRoot("runtime-input", request.input), ordinal: ordinal++, invocationRoot: labRoot("incomplete-failure-fixture-invocation", request), charged: true, completed, outputBytes: completed ? Buffer.byteLength(JSON.stringify(result)) : 0, result } as LabRuntimeEvidence
        issued.add(evidence); return evidence
      }, verify(evidence) { return issued.has(evidence) } }
    } }
    const result = await runSeriousLeague({ allocation, allocationRoot: allocation.root, repository, factoryRepository: candidates[0]!.factoryRepository, responseFactoryRepository: null, fixture: { candidates, host: failingHost, run: runCanonicalLabMatch } })
    const graph = readLeagueRecordGraph(repository, result.headRoot, allocation.operations), failed = [...graph.values()].find((row) => row.kind === "cell-result")!
    expect(calls).toBe(completedPrefix + 1)
    expect(failed.value.execution).toMatchObject({ kind: "failure", transitions: [], failure: { classification: "system_failure", code: "LAB_SUPERVISOR_FAILURE" } })
    expect(failed.value.execution.accounting).toHaveLength(completedPrefix + 1)
    expect(failed.value.execution.accounting.at(-1)).toMatchObject({ charged: true, completed: false, outputBytes: 0 })
    expect(failed.value.terminal).toMatchObject({ disposition: "system_failure", projection: null })
    const verify = { repository, factoryRepository: candidates[0]!.factoryRepository, responseFactoryRepository: null, headRoot: result.headRoot, allocationRoot: allocation.root, limits: allocation.operations, fixtureCandidates: candidates }
    expect(verifyRetainedSeriousLeague(verify)).toMatchObject({ issued: false, processValidity: "process_invalid", empiricalRequirementsComplete: false })
    const rewrite = (execution: any, alterRaw?: (row: any) => void) => {
      // Rebuild the reachable NEW synthetic graph in dependency order. Both
      // raw views and accounting are updated coherently; no old route is read.
      const writer = new LeagueRecordGraph(repository, allocation.operations), roots = new Map<string, ReturnType<typeof labRoot>>()
      let index = 0
      for (const [root, node] of graph.entries()) {
        const value = structuredClone(node.value)
        if (node.kind === "cell-result") value.execution = execution
        if (node.kind === "runtime-invocation") {
          value.originalEvidence = structuredClone(execution.accounting[index])
          value.admittedEvidence = structuredClone(execution.accounting[index++])
          alterRaw?.(value)
        }
        roots.set(root, writer.append(node.kind, value, node.links.map((link) => roots.get(link) ?? link)))
      }
      return roots.get(result.headRoot)!
    }
    const coherent = (headRoot: ReturnType<typeof labRoot>, execution: any) => {
      const altered = readLeagueRecordGraph(repository, headRoot, allocation.operations)
      const raw = [...altered.values()].filter((row) => row.kind === "runtime-invocation").map((row) => row.value)
      expect(verifyRetainedLeagueProbeInvocations(raw, execution.accounting, failed.value.options.transform, failed.value.match.arenaVariant.initialBounds)).toEqual({ issued: false })
      expect(altered.roots("cell-result")).toHaveLength(1)
      return { ...verify, headRoot }
    }
    const unchanged = structuredClone(failed.value.execution)
    expect(verifyRetainedSeriousLeague(coherent(rewrite(unchanged), unchanged))).toMatchObject({ issued: false, processValidity: "process_invalid" })
    const rejects = (name: string, change: (execution: any, last: any) => void, code = "RETAINED_INVOCATION", join = true) => {
      const execution = structuredClone(failed.value.execution), last = execution.accounting.at(-1)
      change(execution, last)
      const headRoot = rewrite(execution), input = join ? coherent(headRoot, execution) : { ...verify, headRoot }
      expect(() => verifyRetainedSeriousLeague(input), name).toThrow(`SERIOUS_LEAGUE_${code}`)
    }
    if (completedPrefix === 0) {
      const resultCases: Array<[string, (result: any) => void]> = [
        ["unknown code", (r) => { r.systemFailure.code = "UNRECOGNIZED" }],
        ["missing code", (r) => { delete r.systemFailure.code }],
        ["number code", (r) => { r.systemFailure.code = 1 }],
        ["object code", (r) => { r.systemFailure.code = {} }],
        ["retryable true", (r) => { r.systemFailure.retryable = true }],
        ["missing retryable", (r) => { delete r.systemFailure.retryable }],
        ["string retryable", (r) => { r.systemFailure.retryable = "false" }],
        ["null retryable", (r) => { r.systemFailure.retryable = null }],
        ["number retryable", (r) => { r.systemFailure.retryable = 0 }],
        ["null failure", (r) => { r.systemFailure = null }],
        ["array failure", (r) => { r.systemFailure = [] }],
        ["primitive failure", (r) => { r.systemFailure = "SUBPROCESS_EXIT" }],
        ["missing failure", (r) => { delete r.systemFailure }],
        ["surplus failure", (r) => { r.systemFailure.extra = "private" }],
        ["ok true", (r) => { r.ok = true }],
        ["ok null", (r) => { r.ok = null }],
        ["ok number", (r) => { r.ok = 0 }],
        ["ok string", (r) => { r.ok = "false" }],
        ["missing ok", (r) => { delete r.ok }],
        ["player violation", (r) => { r.violation.type = "FORBIDDEN_CAPABILITY" }],
        ["private violation text", (r) => { r.violation.message = "private" }],
        ["missing violation type", (r) => { delete r.violation.type }],
        ["missing violation message", (r) => { delete r.violation.message }],
        ["missing violation", (r) => { delete r.violation }],
        ["null violation", (r) => { r.violation = null }],
        ["array violation", (r) => { r.violation = [] }],
        ["surplus violation", (r) => { r.violation.extra = "private" }],
        ["forbidden success payload", (r) => { r.value = { activationOrders: [] } }],
        ["surplus result", (r) => { r.extra = "private" }],
      ]
      for (const [name, change] of resultCases) rejects(name, (_e, last) => change(last.result))
      for (const result of [null, [], false]) rejects(`malformed result ${JSON.stringify(result)}`, (_e, last) => { last.result = result })
      for (const value of [false, 1, "true", null]) rejects(`nontrue charged ${JSON.stringify(value)}`, (_e, last) => { last.charged = value })
      for (const value of [0, "false", null]) rejects(`nonboolean completed ${JSON.stringify(value)}`, (_e, last) => { last.completed = value })
      for (const value of [1, -1, 0.5, 262145]) rejects(`invalid incomplete outputBytes ${value}`, (_e, last) => { last.outputBytes = value })
      rejects("incomplete COMPLETED execution", (e) => {
        e.kind = "completed"; e.result = { state: e.unchangedState, events: [] }
        // Supply every pure transition before the pending effect, so this
        // reaches the completion guard rather than an absent-record failure.
        let machine = MATCH_KERNEL.createMachineV119(failed.value.match)
        for (let ordinal = 0; ordinal < 1000; ordinal++) {
          const next = MATCH_KERNEL.stepMatch(machine, { kind: "advance" })
          if (next.kind === "effect") break
          if (next.kind === "failure") throw Error("unexpected synthetic prefix failure")
          e.transitions.push(next.record); machine = next.machine
        }
      })
      rejects("wrong requestId", (_e, last) => { last.requestId = "wrong" }, "RETAINED_INVOCATION", false)
      rejects("wrong method", (_e, last) => { last.method = "soldierBrain" }, "RETAINED_INVOCATION", false)
      rejects("wrong input root", (_e, last) => { last.inputRoot = labRoot("wrong", 0) }, "RETAINED_INVOCATION", false)
      rejects("wrong provider ordinal", (_e, last) => { last.ordinal++ })
      rejects("wrong failure cause", (e) => { e.failure.code = "WRONG" }, "RETAINED_FAILURE_CAUSE")
      rejects("wrong failure classification", (e) => { e.failure.classification = "player_violation" }, "RETAINED_FAILURE_STATE")
      rejects("noninitial failure state", (e) => { e.unchangedState.roundNumber = 2 }, "RETAINED_FAILURE_STATE")
      rejects("nonempty failure transitions", (e) => { e.transitions = [{ synthetic: true }] }, "RETAINED_FAILURE_STATE")
      for (const code of ["MALFORMED_IPC", "SPAWN_FAILED", "STDIO_CAP_EXCEEDED", "SUBPROCESS_SIGNAL"]) {
        const execution = structuredClone(failed.value.execution); execution.accounting.at(-1).result.systemFailure.code = code
        expect(verifyRetainedSeriousLeague(coherent(rewrite(execution), execution))).toMatchObject({ issued: false, processValidity: "process_invalid" })
      }
      const wrongJoin = rewrite(unchanged, (raw) => { raw.admittedEvidence.invocationRoot = labRoot("wrong-join", 0) })
      expect(() => verifyRetainedSeriousLeague({ ...verify, headRoot: wrongJoin })).toThrow("RETAINED_RAW_ACCOUNTING")
    } else {
      rejects("trailing accounting after incomplete", (e, last) => { e.accounting.push(structuredClone(last)) }, "RETAINED_INVOCATION", false)
      rejects("duplicate consumed invocation root", (e, last) => { last.invocationRoot = e.accounting[0].invocationRoot }, "RETAINED_INVOCATION", false)
    }
  }, 120000)
  it("reopens charged player and system failures with no fabricated payoff and rejects tampered failure evidence", async () => {
    for (const classification of ["player_violation", "system_failure"] as const) {
      const candidates = [await candidate(1), await candidate(3)], base = allocationFixture(), repository = createLeagueRepository(temporary())
      const allocation = createLeagueExecutionAllocation({ ...base, outputDirectories: { league: repository.directory, responseFactory: null }, implementationRoot: factoryAssessmentImplementationRoot(), initialCandidatePublicationRoots: candidates.map((row) => row.publicationRoot).sort(), independenceReferencePublicationRoot: candidates[0]!.publicationRoot, operations: { ...base.operations, wallClockMilliseconds: 60000 } })
      const failingHost: LeagueFixtureSeams["host"] = { createFactorySupervisedRuntime(request) {
        const provider = host.createFactorySupervisedRuntime(request), identity = { ...provider.identity, tupleId: MATCH_KERNEL.tupleId }, issued = new WeakSet<object>()
        let ordinal = 0
        return { ...provider, identity, invoke(request) {
          const evidence = { identity, requestId: request.requestId, method: request.kind, inputRoot: labRoot("runtime-input", request.input), ordinal: ordinal++, invocationRoot: labRoot("failure-fixture-invocation", request), charged: true, completed: true, outputBytes: 0, result: classification === "player_violation" ? { ok: false, violation: { type: "INVALID_OUTPUT", message: "inert fixture" } } : { ok: false, systemFailure: { code: "FIXTURE_SYSTEM_FAILURE", message: "inert fixture" } } } as LabRuntimeEvidence
          issued.add(evidence); return evidence
        }, verify(evidence) { return issued.has(evidence) } }
      } }
      const result = await runSeriousLeague({ allocation, allocationRoot: allocation.root, repository, factoryRepository: candidates[0]!.factoryRepository, responseFactoryRepository: null, fixture: { candidates, host: failingHost, run: runCanonicalLabMatch } })
      const graph = readLeagueRecordGraph(repository, result.headRoot, allocation.operations), failed = [...graph.values()].find((row) => row.kind === "cell-result")!
      expect(result).toMatchObject({ processValidity: "process_invalid", empiricalRequirementsComplete: false })
      expect(failed.value.terminal, JSON.stringify(failed.value.execution)).toMatchObject({ disposition: classification, projection: null })
      expect([...graph.values()].filter((row) => row.kind === "runtime-invocation")).not.toHaveLength(0)
      expect([...graph.values()].filter((row) => row.kind === "runtime-cleanup").length).toBeGreaterThanOrEqual(2)
      const verify = { repository, factoryRepository: candidates[0]!.factoryRepository, responseFactoryRepository: null, headRoot: result.headRoot, allocationRoot: allocation.root, limits: allocation.operations, fixtureCandidates: candidates }
      expect(verifyRetainedSeriousLeague(verify)).toMatchObject({ issued: false, processValidity: "process_invalid" })
      const changed = new LeagueRecordGraph(repository, allocation.operations)
      const wrong = changed.append("cell-result", { ...failed.value, execution: { ...failed.value.execution, accounting: [] } }, [result.headRoot])
      const headRoot = changed.append("run-failure", graph.get(result.headRoot)!.value, [wrong])
      expect(() => verifyRetainedSeriousLeague({ ...verify, headRoot })).toThrow()
    }
  }, 120000)
  it("retains two distinct consecutive responses beating their own preceding frozen targets", async () => {
    const candidates = [await candidate(1), await candidate(3)], repository = createLeagueRepository(temporary()), responseDirectory = realpathSync(mkdtempSync(join(tmpdir(), "factory-two-response-test-"))); directories.push(responseDirectory)
    const responseFactoryRepository = createFactoryRepository(responseDirectory), base = allocationFixture(), r = (value: unknown) => labRoot("two-response-fixture", value)
    const put = (value: unknown) => { const encoded = admitCanonicalJsonValue(value, { profile: "canonical-manifest" }); if (!encoded.ok) throw new Error("fixture encoding"); return publishFactoryArtifact(responseFactoryRepository, encoded.canonicalBytes) }
    const auth = join(responseDirectory, "inert-auth.json")
    writeFileSync(auth, "{}", { flag: "wx" }) // Inert local fixture: no credential access or transport process.
    const reservation = { ...base.channels[0]!.perAttempt, matches: 96, modelTokens: 30, effortMilliseconds: 360000 }
    const jobs = [0, 1].map((ordinal) => {
      const sourceMessage = `Return explicit TypeScript source only. Inert fixture ${ordinal}.`
      const producerInput = {
        authoring: { sourceMessage, codexExecutable: process.execPath, clientVersion: "injected-test", stateDirectory: join(responseDirectory, `state-${ordinal}`), disclosedDirectory: join(responseDirectory, `disclosed-${ordinal}`), existingAuthFile: auth, requestedModel: "fixture-model", requestedProvider: "fixture-provider", path: "/usr/bin:/bin", settingsRoot: r("settings"), promptRoot: `sha256:${createHash("sha256").update(sourceMessage).digest("hex")}`, contextRoot: labRoot("league-disclosed-context-v1", { dependencyArtifactRoots: [] }) },
        request: { split: "development", doctrineFamily: `inert-response-${ordinal}`, build: { buildRoot: r("build"), toolchainRoot: r("toolchain") }, lineage: { predecessorRoot: LAB_ADMITTED_ROOTS.currentStartRoot, correctionRoot: null, retryParentRoot: null } },
      }
      const producerRequestArtifactRoot = put({ producerIdentity: "emitModelFactoryPacket", origin: "model-oracle", evidenceClass: "real_producer", producerInput })
      const disclosureArtifactRoot = put({ participantId: "author", requestArtifactRoot: producerRequestArtifactRoot, sourceAndBuildDisclosed: true, dependencyArtifactRoots: [] }), provenanceArtifactRoot = put({ participantId: "author", priorExposure: "none", conflicts: "none", origin: "model-oracle", deterministicDataOnly: true }), reviewArtifactRoot = put({ reviewerId: "reviewer", participantId: "author", disclosureArtifactRoot, provenanceArtifactRoot, disposition: "accepted", reviewMilliseconds: 0 })
      return { id: `response-${ordinal}`, channel: "model" as const, evaluationRole: "development_response" as const, operation: "produce" as const, producerRequestArtifactRoot, disclosureArtifactRoot, provenanceArtifactRoot, reviewArtifactRoot, participantId: "author", reviewerId: "reviewer", reservation, retryParentJobId: null }
    })
    const ceilings = Object.fromEntries(Object.entries(reservation).map(([key, value]) => [key, value * 2])) as typeof reservation
    const allocation = createLeagueExecutionAllocation({ ...base, outputDirectories: { league: repository.directory, responseFactory: responseDirectory }, implementationRoot: factoryAssessmentImplementationRoot(), initialCandidatePublicationRoots: candidates.map((row) => row.publicationRoot).sort(), independenceReferencePublicationRoot: candidates[0]!.publicationRoot, opportunities: { ...base.opportunities, attemptedCandidates: 2, acceptedResponseSlots: 2, responseRounds: 3, modelAttempts: 2, modelTokens: 60, matches: 1000 }, operations: { ...base.operations, maxPopulation: 4, perAttemptMilliseconds: 360000, wallClockMilliseconds: 600000, maxArtifactBytes: 400000000, maxArtifactRecords: 300000 }, channels: base.channels.map((channel) => channel.channel === "model" ? { ...channel, disposition: "allocated", opportunities: 2, ceilings, perAttempt: reservation, participants: ["author"], reviewers: ["reviewer"] } : channel), rounds: [{ ordinal: 0, acceptedSlots: 1, jobs: [jobs[0]!] }, { ordinal: 1, acceptedSlots: 1, jobs: [jobs[1]!] }, { ordinal: 2, acceptedSlots: 0, jobs: [] }] })
    let authorCalls = 0
    const fixture: LeagueFixtureSeams = {
      candidates, host,
      run: async ({ match, providers }) => { const state = MATCH_KERNEL.createMachineV119(match).initialState; for (const provider of Object.values(providers)) provider.close(); return { kind: "completed", privacy: "private_offline", transitions: [], accounting: [], result: { state: { ...state, outcome: { type: "DRAW" } }, events: [{ type: "MATCH_ENDED", payload: { type: "DRAW" } }] } } as never },
      produce: (input) => {
        const injected = positiveResponseFixture(new Set(input.opponents.map((row) => row.closure.sourceArtifactRoot)))
        return produceLeagueResponse({ ...input, fixture: { ...injected, author: (authorInput) => executeLeagueAuthoring({ ...authorInput, clock: () => 0, transportFactory: async (options) => {
          const ordinal = authorCalls++, coefficients = Array.from({ length: 80 }, (_, index) => index + 100 * ordinal + 1)
          const sourceMessage = JSON.stringify({ source: `const coefficients = [${coefficients.join(",")}]; export default { selectActivations(input) { return { activationOrders: [], strategyMemory: { score: coefficients.reduce((sum, weight) => sum + weight, 0) } }; }, soldierBrain(input) { return { action: { type: "WAIT" }, soldierMemory: null }; } };` })
          const usage = { inputTokens: 2, cachedInputTokens: 0, outputTokens: 1, reasoningOutputTokens: 0, totalTokens: 3 }
          const messages = [{ result: { thread: { id: `thread-${ordinal}` }, model: "fixture-model", modelProvider: "fixture-provider", cwd: options.cwd, sandbox: { type: "readOnly", networkAccess: false }, approvalPolicy: "never", instructionSources: [] } }, { result: { turn: { id: `turn-${ordinal}` } } }, { method: "item/completed", params: { turnId: `turn-${ordinal}`, item: { type: "agentMessage", text: sourceMessage } } }, { method: "thread/tokenUsage/updated", params: { turnId: `turn-${ordinal}`, tokenUsage: { total: usage } } }, { method: "turn/completed", params: { turn: { id: `turn-${ordinal}`, status: "completed" } } }]
          return { threadId: `thread-${ordinal}`, reportedModel: "fixture-model", async startTurn() { return { sourceMessage, usage, reportedModel: "fixture-model", rawJsonl: new TextEncoder().encode(messages.map((row) => JSON.stringify(row)).join("\n") + "\n") } }, async close() { return "sigterm" } }
        } }) } }).then((produced) => { expect(produced.comparisons.map((row) => row.relation), JSON.stringify(produced.comparisons)).toEqual(input.opponents.map(() => "distinct")); return produced })
      },
    }
    const result = await runSeriousLeague({ allocation, allocationRoot: allocation.root, repository, factoryRepository: candidates[0]!.factoryRepository, responseFactoryRepository, fixture })
    const graph = readLeagueRecordGraph(repository, result.headRoot, allocation.operations), head = graph.get(result.headRoot)!
    expect(head.value, JSON.stringify(head.value)).toMatchObject({ processValidity: "process_valid", completedJobs: jobs.map((row) => row.id) })
    expect(authorCalls).toBe(2)
    const evidence = [...graph.values()].find((row) => row.kind === "selection")!.value.evidence
    expect(evidence.iterations, JSON.stringify([...graph.values()].filter((row) => row.kind === "red-team-assessment").map((row) => row.value))).toHaveLength(2)
    expect(evidence.iterations.map((row: any) => row.blocks[0].numerator / row.blocks[0].denominator)).toEqual([1, 1])
    expect(countLinkedResponseIterations(evidence, evidence.iterations[1].candidateAdmissionRoot)).toBe(2)
    expect(countLinkedResponseIterations(evidence, candidates[0]!.admission.root)).toBe(0)
    const verify = { repository, factoryRepository: candidates[0]!.factoryRepository, responseFactoryRepository, headRoot: result.headRoot, allocationRoot: allocation.root, limits: allocation.operations, fixtureCandidates: candidates }
    expect(verifyRetainedSeriousLeague(verify)).toMatchObject({ issued: false, processValidity: "process_valid", empiricalRequirementsComplete: false })
    const selection = [...graph.values()].find((row) => row.kind === "selection")!.value
    const { root: _evidenceRoot, ...originalEvidence } = evidence
    const contemporaneous = { ...originalEvidence, iterations: evidence.iterations.map((row: any) => ({ ...row, blocks: row.blocks.map((block: any) => ({ ...block, snapshotRoot: block.nextSnapshotRoot })) })) }
    const changed = new LeagueRecordGraph(repository, allocation.operations)
    const changedSelection = changed.append("selection", { ...selection, evidence: { ...contemporaneous, root: labRoot("league-selection-evidence-v5", contemporaneous) } }, [result.headRoot])
    const changedHead = changed.append("run-complete", head.value, [changedSelection])
    expect(() => verifyRetainedSeriousLeague({ ...verify, headRoot: changedHead })).toThrow("RETAINED_SELECTION")
  }, 600000)
  it("retains many successful journals in both fresh stores with the minimum emergency reserve", () => {
    const base = allocationFixture(), allocation = createLeagueExecutionAllocation({ ...base, operations: { ...base.operations, terminalReserveBytes: 6 * 262144, terminalReserveRecords: 24 } }), budget = new LeagueRetentionBudget(allocation)
    const repository = createLeagueRepository(temporary(), { beforePublication: budget.beforePublication }), directory = realpathSync(mkdtempSync(join(tmpdir(), "factory-retention-test-"))); directories.push(directory)
    const factory = createFactoryRepository(directory, { beforePublication: budget.beforePublication }), r = (value: unknown) => labRoot("journal-success-test", value)
    for (let ordinal = 0; ordinal < 40; ordinal++) {
      const cellRoot = r(ordinal), body = { cellRoot, allocationRoot: allocation.root }, start = { ...body, root: labRoot("league-cell-start-v1", body) }
      recordLeagueCellStart(repository, start)
      const projectionBody = { schemaVersion: "league-payoff-projection-v1", privacy: "private_offline", cellRoot, outcomeRoot: r("outcome"), resultEventRoot: r("event"), entrantCandidateRoot: r("entrant"), conditionRoot: r("condition"), semanticGeometryHash: r("arena"), halfPoints: 1 }
      const projection = LeaguePayoffProjectionSchema.parse({ ...projectionBody, root: labRoot("league-payoff-projection-v1", projectionBody) })
      publishLeagueCellTerminal(repository, start, createLeagueCellTerminal({ cellRoot, disposition: "success", processValidity: "process_valid", evidenceRoot: r("evidence"), projection }))
      const factoryStart = createFactoryAttemptStart({ taskRoot: r(ordinal), budgetRoot: allocation.root, candidateRoot: r("candidate"), authoringMechanism: "automated-oracle", inputRoot: r("input"), resourceAccountingRoot: r("resources"), retryParentRoot: null })
      recordFactoryAttemptStart(factory, factoryStart)
      const disposition = (["accepted", "rejected", "duplicate", "legal_but_weak", "unresolved"] as const)[ordinal % 5]!
      publishFactoryAttemptTerminal(factory, factoryStart, createFactoryAttemptTerminal({ startRoot: factoryStart.root, disposition, outputRoot: r("output"), validationRoot: r("validation"), duplicateEvidenceRoot: r("duplicate"), finalEvidenceRoot: r("final") }))
    }
    expect(budget.usage).toMatchObject({ workRecords: 160, terminalBytes: 0, terminalRecords: 0, exhausted: false })
    const pendingBody = { cellRoot: r("pending"), allocationRoot: allocation.root }, pending = { ...pendingBody, root: labRoot("league-cell-start-v1", pendingBody) }
    const factoryPending = createFactoryAttemptStart({ taskRoot: r("pending"), budgetRoot: allocation.root, candidateRoot: r("candidate"), authoringMechanism: "automated-oracle", inputRoot: r("input"), resourceAccountingRoot: r("resources"), retryParentRoot: null })
    recordLeagueCellStart(repository, pending); recordFactoryAttemptStart(factory, factoryPending)
    expect(() => budget.checkCapacity(allocation.operations.maxArtifactBytes, 1)).toThrow("RETENTION_BUDGET")
    const failure = new LeagueRecordGraph(repository, allocation.operations, budget).append("run-failure", { processValidity: "process_invalid" })
    publishLeagueCellTerminal(repository, pending, createLeagueCellTerminal({ cellRoot: pending.cellRoot, disposition: "system_failure", processValidity: "process_invalid", evidenceRoot: failure, projection: null }))
    publishFactoryAttemptTerminal(factory, factoryPending, createFactoryAttemptTerminal({ startRoot: factoryPending.root, disposition: "system_failure", outputRoot: null, validationRoot: r("validation"), duplicateEvidenceRoot: r("duplicate"), finalEvidenceRoot: failure }))
    expect(readLeagueRecordGraph(repository, failure, allocation.operations).get(failure)!.kind).toBe("run-failure")
    expect(budget.usage).toMatchObject({ workRecords: 162, terminalRecords: 5, exhausted: true })
  }, 60000)
  it.each([false, true, "response-provider", "result-retention", "last-round", "capacity-before-development", "capacity-before-independent"])("re-enters a measured positive response and reopens the whole loop (failure after accepted population growth: %s)", async (failAfterGrowth) => {
    const candidates = [await candidate(1), await candidate(3)], repository = createLeagueRepository(temporary()), responseDirectory = realpathSync(mkdtempSync(join(tmpdir(), "factory-positive-league-test-"))); directories.push(responseDirectory)
    const responseFactoryRepository = createFactoryRepository(responseDirectory), put = (value: unknown) => { const encoded = admitCanonicalJsonValue(value, { profile: "canonical-manifest" }); if (!encoded.ok) throw new Error("fixture encode"); return publishFactoryArtifact(responseFactoryRepository, encoded.canonicalBytes) }, r = (label: string) => labRoot("positive-league-fixture", label), base = allocationFixture()
    const producerInput = { split: "development", doctrineFamily: "source-only-positive-response", provider: { providerId: "source-fixture", modelId: "local", modelVersion: "test", settingsRoot: r("settings"), promptRoot: r("prompt"), contextRoot: r("context") }, build: { buildRoot: r("build"), toolchainRoot: r("toolchain") }, lineage: { predecessorRoot: LAB_ADMITTED_ROOTS.currentStartRoot, correctionRoot: null, retryParentRoot: null } }, producerRequestArtifactRoot = put({ producerIdentity: "emitTacticalFactoryPacket", origin: "tactical-oracle", evidenceClass: "real_producer", producerInput }), disclosureArtifactRoot = put({ participantId: "author", requestArtifactRoot: producerRequestArtifactRoot, sourceAndBuildDisclosed: true, dependencyArtifactRoots: [] }), provenanceArtifactRoot = put({ participantId: "author", priorExposure: "none", conflicts: "none", origin: "tactical-oracle", deterministicDataOnly: true }), reviewArtifactRoot = put({ reviewerId: "reviewer", participantId: "author", disclosureArtifactRoot, provenanceArtifactRoot, disposition: "accepted", reviewMilliseconds: 0 }), reservation = { ...base.channels[0]!.perAttempt, matches: 72, effortMilliseconds: 360000 }, job = { id: "positive-response", channel: "automated" as const, evaluationRole: "development_response" as const, operation: "produce" as const, producerRequestArtifactRoot, disclosureArtifactRoot, provenanceArtifactRoot, reviewArtifactRoot, participantId: "author", reviewerId: "reviewer", reservation, retryParentJobId: null }
    const lastRound = failAfterGrowth === "last-round", evaluationJob = { ...job, id: "independent-probe", evaluationRole: "independent_probe_opponent" as const }, opportunities = lastRound ? 2 : 1
    const capacityStop = failAfterGrowth === "capacity-before-development" || failAfterGrowth === "capacity-before-independent"
    const rounds = capacityStop ? [{ ordinal: 0, acceptedSlots: 0, jobs: failAfterGrowth === "capacity-before-development" ? [job] : [] }, { ordinal: 1, acceptedSlots: 0, jobs: failAfterGrowth === "capacity-before-independent" ? [evaluationJob] : [] }] : lastRound ? [{ ordinal: 0, acceptedSlots: 0, jobs: [] }, { ordinal: 1, acceptedSlots: 1, jobs: [job, evaluationJob] }] : [{ ordinal: 0, acceptedSlots: 1, jobs: [job] }, base.rounds[1]!]
    const allocation = createLeagueExecutionAllocation({ ...base, outputDirectories: { league: repository.directory, responseFactory: responseDirectory }, implementationRoot: factoryAssessmentImplementationRoot(), initialCandidatePublicationRoots: candidates.map((row) => row.publicationRoot).sort(), independenceReferencePublicationRoot: candidates[0]!.publicationRoot, opportunities: { ...base.opportunities, attemptedCandidates: opportunities, acceptedResponseSlots: capacityStop ? 0 : 1, matches: 500 }, operations: { ...base.operations, maxPopulation: 3, perAttemptMilliseconds: 360000, wallClockMilliseconds: 600000, maxArtifactBytes: 250000000, maxArtifactRecords: 200000 }, channels: base.channels.map((channel) => channel.channel === "automated" ? { ...channel, disposition: "allocated", opportunities, ceilings: Object.fromEntries(Object.entries(reservation).map(([key, value]) => [key, value * opportunities])) as typeof reservation, perAttempt: reservation, participants: ["author"], reviewers: ["reviewer"] } : channel), rounds }), productionFixture = positiveResponseFixture(new Set(candidates.map((row) => row.admission.candidate.proposal.source.root)))
    if (capacityStop) vi.spyOn(LeagueRecordGraph.prototype, "beforeDispatch").mockImplementation(() => { throw Error("injected pre-producer capacity stop") })
    let cells = 0, responseMatches = 0
    const productionJobs: string[] = []
    const fixture: LeagueFixtureSeams = { candidates, host: { createFactorySupervisedRuntime(request) { const provider = host.createFactorySupervisedRuntime(request); return { ...provider, identity: { ...provider.identity, tupleId: MATCH_KERNEL.tupleId } } } }, run: async ({ match, providers }) => { cells++; if (failAfterGrowth === true && cells === 69) return runCanonicalLabMatch({ match, providers }); const state = MATCH_KERNEL.createMachineV119(match).initialState; expect(state.soldiers).toHaveLength(16); for (const provider of Object.values(providers)) provider.close(); return { kind: "completed", privacy: "private_offline", transitions: [], accounting: [], result: { state: { ...state, outcome: { type: "DRAW" } }, events: [{ type: "MATCH_ENDED", payload: { type: "DRAW" } }] } } as never }, produce: (input) => {
      productionJobs.push(input.job.id)
      if (input.job.evaluationRole !== "development_response") throw new Error("independent evaluation must not start before closure")
      const retention = failAfterGrowth === "result-retention" ? { ...input.retention, appendInvocation: input.retention.appendInvocation?.bind(input.retention), settlePending: input.retention.settlePending?.bind(input.retention), get invocationPending() { return input.retention.invocationPending }, beforeDispatch: () => input.retention.beforeDispatch(), beforeInvocation: (request: unknown) => input.retention.beforeInvocation(request), append(kind: string, value: unknown, links: readonly string[] = []) {
        if (kind === "response-production-result") throw new Error("injected result retention failure")
        return input.retention.append(kind, value, links as never)
      } } as typeof input.retention : input.retention
      return produceLeagueResponse({ ...input, retention, fixture: { ...productionFixture,
      host: { createFactorySupervisedRuntime(request) {
        const provider = productionFixture.host.createFactorySupervisedRuntime(request)
        return failAfterGrowth === "response-provider" ? { ...provider, identity: { ...provider.identity, tupleId: MATCH_KERNEL.tupleId }, invoke() { throw new Error("inert provider failure") } } : provider
      } },
      run: (request) => { responseMatches++; return failAfterGrowth === "response-provider" ? runCanonicalLabMatch(request) : productionFixture.run(request) }
    } }) } }
    const result = await runSeriousLeague({ allocation, allocationRoot: allocation.root, repository, factoryRepository: candidates[0]!.factoryRepository, responseFactoryRepository, fixture }), graph = readLeagueRecordGraph(repository, result.headRoot, allocation.operations), head = graph.get(result.headRoot)!.value
    if (capacityStop) {
      expect(head).toMatchObject({ processValidity: "process_invalid", error: "injected pre-producer capacity stop", reservedResponseMatches: 0, completedJobs: [] })
      expect(productionJobs).toEqual([]); expect(responseMatches).toBe(0)
      expect([...graph.values()].filter((row) => ["red-team-start", "response-production-start", "response-match-start"].includes(row.kind))).toHaveLength(0)
      expect(readdirSync(responseDirectory).filter((name) => name.endsWith(".started.json"))).toHaveLength(0)
      return
    }
    if (lastRound) {
      expect(head, JSON.stringify(head)).toMatchObject({ processValidity: "process_valid", result: "response_round_budget_exhausted", closure: "not_closed", executedCells: 104, completedJobs: [job.id], undispatchedJobIds: [evaluationJob.id], reservedResponseMatches: 72 })
      expect(productionJobs).toEqual([job.id]); expect(responseMatches).toBe(48)
      expect([...graph.values()].filter((row) => row.kind === "counter-reentry")).toHaveLength(1)
      expect([...graph.values()].filter((row) => ["selection", "report", "independent-evaluation", "red-team-close"].includes(row.kind))).toHaveLength(0)
      expect([...graph.values()].filter((row) => row.kind === "complete-matrix").map((row) => row.value.population.candidateAdmissionRoots.length).sort()).toEqual([2, 3])
      const verify = { repository, factoryRepository: candidates[0]!.factoryRepository, responseFactoryRepository, headRoot: result.headRoot, allocationRoot: allocation.root, limits: allocation.operations, fixtureCandidates: candidates }
      expect(verifyRetainedSeriousLeague(verify)).toMatchObject({ issued: false, processValidity: "process_valid", result: "response_round_budget_exhausted", closure: "not_closed" })
      const last = [...graph.values()].find((row) => row.kind === "round-advance" && row.value.round.roundOrdinal === 1)!.value
      const wrong = new LeagueRecordGraph(repository, allocation.operations), request = { round: last.round, admissions: [], requestClosure: true }, advanceRoot = wrong.append("round-advance", { ...request, advanced: advanceLeagueRound(request) }, [result.headRoot])
      expect(() => verifyRetainedSeriousLeague({ ...verify, headRoot: wrong.append("run-budget-exhausted", { ...head, closureRoot: advanceRoot }, [advanceRoot]) })).toThrow("RETAINED_ADVANCE_CHAIN")
      return
    }
    if (failAfterGrowth === "response-provider") {
      expect(head, JSON.stringify(head)).toMatchObject({ processValidity: "process_invalid", executedCells: 44, reservedResponseMatches: 72, completedJobs: [] })
      expect([...graph.values()].filter((row) => row.kind === "response-runtime-invocation-failure")).toHaveLength(1)
      expect([...graph.values()].filter((row) => row.kind === "response-runtime-cleanup")).toHaveLength(2)
      const failed = [...graph.values()].find((row) => row.kind === "response-match-execution-failure")!
      expect(failed.value.execution).toMatchObject({ kind: "failure", accounting: [], failure: { classification: "system_failure", code: "LAB_SUPERVISOR_FAILURE" } })
      const verify = { repository, factoryRepository: candidates[0]!.factoryRepository, responseFactoryRepository, headRoot: result.headRoot, allocationRoot: allocation.root, limits: allocation.operations, fixtureCandidates: candidates }
      expect(verifyRetainedSeriousLeague(verify)).toMatchObject({ issued: false, processValidity: "process_invalid" })
      const wrong = new LeagueRecordGraph(repository, allocation.operations)
      const altered = wrong.append("response-production-failure", { ...[...graph.values()].find((row) => row.kind === "response-production-failure")!.value, matchCount: 0 }, [result.headRoot])
      expect(() => verifyRetainedSeriousLeague({ ...verify, headRoot: wrong.append("run-failure", head, [altered]) })).toThrow("RETAINED_RESPONSE_FAILURE_START")
      return
    }
    if (failAfterGrowth === "result-retention") {
      expect(head).toMatchObject({ processValidity: "process_invalid", completedJobs: [], reservedResponseMatches: 72 })
      const failure = [...graph.values()].find((row) => row.kind === "response-production-failure")!.value
      expect(failure.matchCount).toBe(48)
      expect([...graph.values()].filter((row) => row.kind === "response-production-result")).toHaveLength(0)
      const terminalPath = join(responseDirectory, `factory-attempt-${failure.start.root.slice(7)}.terminal.json`)
      const acceptedTerminal = JSON.parse(readFileSync(terminalPath, "utf8"))
      expect(acceptedTerminal).toMatchObject({ disposition: "accepted", startRoot: failure.start.root })
      const verify = { repository, factoryRepository: candidates[0]!.factoryRepository, responseFactoryRepository, headRoot: result.headRoot, allocationRoot: allocation.root, limits: allocation.operations, fixtureCandidates: candidates }
      expect(verifyRetainedSeriousLeague(verify)).toMatchObject({ issued: false, processValidity: "process_invalid", empiricalRequirementsComplete: false })
      expect(JSON.parse(readFileSync(terminalPath, "utf8"))).toEqual(acceptedTerminal)
      const copiedDirectory = realpathSync(mkdtempSync(join(tmpdir(), "factory-forged-terminal-test-"))); directories.push(copiedDirectory)
      cpSync(responseDirectory, copiedDirectory, { recursive: true })
      const forged = createFactoryAttemptTerminal({ startRoot: acceptedTerminal.startRoot, disposition: "accepted", outputRoot: r("wrong-candidate"), validationRoot: acceptedTerminal.validationRoot, duplicateEvidenceRoot: acceptedTerminal.duplicateEvidenceRoot, finalEvidenceRoot: acceptedTerminal.finalEvidenceRoot })
      const encoded = admitCanonicalJsonValue(forged, { profile: "canonical-manifest" }); if (!encoded.ok) throw new Error("fixture terminal encoding")
      writeFileSync(join(copiedDirectory, `factory-attempt-${failure.start.root.slice(7)}.terminal.json`), encoded.canonicalBytes)
      expect(() => verifyRetainedSeriousLeague({ ...verify, responseFactoryRepository: createFactoryRepository(copiedDirectory) })).toThrow("RETAINED_RESPONSE_FAILURE_TERMINAL")
      return
    }
    if (failAfterGrowth === true) {
      expect(head).toMatchObject({ processValidity: "process_invalid", executedCells: 69, completedJobs: [job.id] })
      expect([...graph.values()].filter((row) => row.kind === "counter-reentry")).toHaveLength(1)
      expect([...graph.values()].filter((row) => row.kind === "complete-matrix").map((row) => row.value.population.candidateAdmissionRoots.length).sort()).toEqual([2, 3])
      const verify = { repository, factoryRepository: candidates[0]!.factoryRepository, responseFactoryRepository, headRoot: result.headRoot, allocationRoot: allocation.root, limits: allocation.operations, fixtureCandidates: candidates }
      expect(verifyRetainedSeriousLeague(verify)).toMatchObject({ issued: false, processValidity: "process_invalid", empiricalRequirementsComplete: false })
      const wrong = new LeagueRecordGraph(repository, allocation.operations).append("run-failure", { ...head, ledgerRoot: r("tampered-failure-ledger") }, [result.headRoot])
      expect(() => verifyRetainedSeriousLeague({ ...verify, headRoot: wrong })).toThrow("RETAINED_RED_TEAM_CLOSE")
      return
    }
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
  it("indexes multiple large authenticated payloads without retaining decoded values", () => {
    const repository = createLeagueRepository(temporary()), limits = { maxArtifactBytes: 8000000, maxArtifactRecords: 1000 }, writer = new LeagueRecordGraph(repository, limits)
    const roots = Array.from({ length: 8 }, (_, ordinal) => writer.append("synthetic-execution", { ordinal, execution: String.fromCharCode(65 + ordinal).repeat(350000) + ordinal }))
    const parentStartRoot = labRoot("synthetic-response-parent", 1)
    const matchRoots = Array.from({ length: 4 }, (_, ordinal) => writer.append("response-match-result", { matchCharge: { parentStartRoot, ordinal }, execution: String.fromCharCode(75 + ordinal).repeat(250000) }))
    const graph = readLeagueRecordGraph(repository, matchRoots.at(-1)!, limits)
    expect(graph.roots("synthetic-execution")).toHaveLength(8)
    expect(graph.matches("response-match-result", parentStartRoot)).toEqual(matchRoots.map((root, ordinal) => ({ root, ordinal })))
    expect(JSON.stringify(graph.matches("response-match-result", parentStartRoot))).not.toContain("execution")
    for (const root of roots) {
      const node = graph.get(root)!, descriptor = Object.getOwnPropertyDescriptor(node, "value")
      expect(typeof descriptor?.get).toBe("function")
      expect(descriptor?.value).toBeUndefined()
      expect(node.value.execution).toHaveLength(350001)
      expect(node.value).not.toBe(node.value) // Every read decodes afresh; the index has no payload cache.
    }
    expect(() => readLeagueRecordGraph(repository, matchRoots.at(-1)!, { maxArtifactBytes: 1000000, maxArtifactRecords: 1000 })).toThrow("GRAPH_READ_BUDGET")
  }, 60000)
  it("keeps only compact matrix receipts after each trusted synthetic Match", async () => {
    const candidates = [await candidate(1), await candidate(3)], repository = createLeagueRepository(temporary()), base = allocationFixture()
    const allocation = createLeagueExecutionAllocation({ ...base, outputDirectories: { league: repository.directory, responseFactory: null }, implementationRoot: factoryAssessmentImplementationRoot(), initialCandidatePublicationRoots: candidates.map((row) => row.publicationRoot).sort(), independenceReferencePublicationRoot: candidates[0]!.publicationRoot, operations: { ...base.operations, wallClockMilliseconds: 60000 } })
    const fixture: LeagueFixtureSeams = { candidates, host, run: async ({ match, providers }) => {
      const state = MATCH_KERNEL.createMachineV119(match).initialState
      for (const provider of Object.values(providers)) provider.close()
      return { kind: "completed", privacy: "private_offline", transitions: [{ syntheticPayload: "L".repeat(150000) }], accounting: [], result: { state: { ...state, outcome: { type: "DRAW" } }, events: [{ type: "MATCH_ENDED", payload: { type: "DRAW" } }] } } as never
    } }
    const session = new LeagueConnectedSession({ allocation, allocationRoot: allocation.root, repository, factoryRepository: candidates[0]!.factoryRepository, responseFactoryRepository: null, fixture }, allocation)
    const matrix = await session.matrix(candidates, allocation.seedBlocks[0]!)
    expect(matrix.results).toHaveLength(8)
    expect(session.executedCells).toBe(8)
    expect("cells" in session).toBe(false)
    expect(matrix.results.every((row) => !("execution" in row))).toBe(true)
    expect(matrix.results[0]!.terminal.disposition).toBe("success")
    const graph = readLeagueRecordGraph(repository, matrix.recordRoot, allocation.operations)
    expect(graph.roots("cell-result")).toHaveLength(8)
    expect(graph.get(matrix.results[0]!.recordRoot)!.value.execution.transitions[0].syntheticPayload).toHaveLength(150000)
  }, 60000)
  it("keeps reserved failure capacity after normal byte or record exhaustion and forbids new charges", () => {
    for (const mode of ["bytes", "records"] as const) {
      const base = allocationFixture(), allocation = createLeagueExecutionAllocation({ ...base, operations: { ...base.operations, ...(mode === "bytes" ? { maxArtifactBytes: 2263144 } : { maxArtifactRecords: 2002 }) } }), budget = new LeagueRetentionBudget(allocation), repository = createLeagueRepository(temporary(), { beforePublication: budget.beforePublication }), cellRoot = labRoot("retention-cell", mode), body = { cellRoot, allocationRoot: allocation.root }, start = { ...body, root: labRoot("league-cell-start-v1", body) }
      recordLeagueCellStart(repository, start)
      const bytes = new Uint8Array(mode === "bytes" ? 262144 : 1).fill(65), first = publishLeagueArtifact(repository, bytes), usage = budget.usage
      expect(publishLeagueArtifact(repository, bytes)).toBe(first); expect(budget.usage).toEqual(usage)
      const names = readdirSync(repository.directory).sort()
      expect(() => publishLeagueArtifact(repository, new Uint8Array(1024).fill(66))).toThrow("RETENTION_BUDGET")
      expect(readdirSync(repository.directory).sort()).toEqual(names)
      const failure = new LeagueRecordGraph(repository, allocation.operations, budget).append("run-failure", { startRoot: start.root, processValidity: "process_invalid" })
      publishLeagueCellTerminal(repository, start, createLeagueCellTerminal({ cellRoot, disposition: "system_failure", processValidity: "process_invalid", evidenceRoot: failure, projection: null }))
      const next = { cellRoot: labRoot("next-cell", mode), allocationRoot: allocation.root }
      expect(() => recordLeagueCellStart(repository, { ...next, root: labRoot("league-cell-start-v1", next) })).toThrow("RETENTION_DISPATCH_STOP")
      expect(budget.usage.terminalBytes).toBeGreaterThan(0)
      expect(budget.usage.workBytes).toBe(usage.workBytes)
    }
  })
  it("reopens an authenticated first-seed report when second-seed publication exhausts retention", async () => {
    const candidates = [await candidate(1), await candidate(3)], base = allocationFixture(), repository = createLeagueRepository(temporary())
    const seeds = ["first-seed", "second-seed"]
    const allocation = createLeagueExecutionAllocation({ ...base, seedBlocks: seeds, outputDirectories: { league: repository.directory, responseFactory: null }, implementationRoot: factoryAssessmentImplementationRoot(), initialCandidatePublicationRoots: candidates.map((row) => row.publicationRoot).sort(), independenceReferencePublicationRoot: candidates[0]!.publicationRoot, opportunities: { ...base.opportunities, matches: 320 }, operations: { ...base.operations, wallClockMilliseconds: 300000, maxArtifactBytes: 120000000, maxArtifactRecords: 60000 } })
    let calls = 0, publicationChecks = 0
    const fixture: LeagueFixtureSeams = { candidates, host, run: async ({ match, providers }) => {
      calls++
      const state = MATCH_KERNEL.createMachineV119(match).initialState
      for (const provider of Object.values(providers)) provider.close()
      return { kind: "completed", privacy: "private_offline", transitions: [], accounting: [], result: { state: { ...state, outcome: { type: "DRAW" } }, events: [{ type: "MATCH_ENDED", payload: { type: "DRAW" } }] } } as never
    }, beforeReportPublication(seed, budget) {
      publicationChecks++
      if (seed === seeds[1]) expect(() => budget.checkCapacity(allocation.operations.maxArtifactBytes, 1)).toThrow("RETENTION_BUDGET")
    } }
    const result = await runSeriousLeague({ allocation, allocationRoot: allocation.root, repository, factoryRepository: candidates[0]!.factoryRepository, responseFactoryRepository: null, fixture })
    const graph = readLeagueRecordGraph(repository, result.headRoot, allocation.operations), head = graph.get(result.headRoot)!.value
    const reports = [...graph.values()].filter((node) => node.kind === "report"), selections = [...graph.values()].filter((node) => node.kind === "selection")
    expect(calls).toBe(160); expect(publicationChecks).toBe(2)
    expect(result).toMatchObject({ processValidity: "process_invalid", empiricalRequirementsComplete: false })
    expect(reports).toHaveLength(1); expect(selections).toHaveLength(2)
    expect(head).toMatchObject({ processValidity: "process_invalid", executedCells: 160, completedJobs: [], retentionUsage: { exhausted: true } })
    const verify = { repository, factoryRepository: candidates[0]!.factoryRepository, responseFactoryRepository: null, headRoot: result.headRoot, allocationRoot: allocation.root, limits: allocation.operations, fixtureCandidates: candidates }
    expect(verifyRetainedSeriousLeague(verify)).toMatchObject({ issued: false, processValidity: "process_invalid", empiricalRequirementsComplete: false })
    const first = reports[0]!.value, initial = [...graph.values()].find((node) => node.kind === "run-start")!.value
    const closedRoot = [...graph.entries()].find(([, node]) => node.kind === "red-team-close")![0]
    const forgedComplete = new LeagueRecordGraph(repository, allocation.operations).append("run-complete", { ...head, processValidity: "process_valid", result: "bounded_league_complete", ledgerRoot: closedRoot, candidates: initial.candidates, reports: [first.report] }, [result.headRoot])
    expect(() => verifyRetainedSeriousLeague({ ...verify, headRoot: forgedComplete })).toThrow("RETAINED_REPORT_COVERAGE")
    const reportPath = join(repository.directory, `league-artifact-${first.report.reportRoot.slice(7)}.bin`)
    writeFileSync(reportPath, new Uint8Array([65]))
    expect(() => verifyRetainedSeriousLeague(verify)).toThrow("ARTIFACT_DIGEST")
  }, 300000)
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
    const retainedMatrix = [...graph.values()].find((node) => node.kind === "complete-matrix")!
    for (const cells of [retainedMatrix.value.matrix.cells.slice(1), [...retainedMatrix.value.matrix.cells].reverse(), [...retainedMatrix.value.matrix.cells, retainedMatrix.value.matrix.cells[0]], [result.headRoot, ...retainedMatrix.value.matrix.cells.slice(1)]]) {
      const altered = new LeagueRecordGraph(repository, allocation.operations), matrixRoot = altered.append("complete-matrix", { ...retainedMatrix.value, matrix: { ...retainedMatrix.value.matrix, cells } }, [result.headRoot, ...retainedMatrix.links])
      const headRoot = altered.append("run-complete", graph.get(result.headRoot)!.value, [matrixRoot])
      expect(() => verifyRetainedSeriousLeague({ ...verifyInput, headRoot })).toThrow("RETAINED_MATRIX_")
    }
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
  it("rejects unrepresentable declared population before any durable charge", async () => {
    const repository = createLeagueRepository(temporary()), base = allocationFixture(), allocation = createLeagueExecutionAllocation({ ...base, implementationRoot: factoryAssessmentImplementationRoot(), outputDirectories: { league: repository.directory, responseFactory: null }, operations: { ...base.operations, maxPopulation: 84 }, opportunities: { ...base.opportunities, matches: 1000000 } })
    await expect(runSeriousLeague({ allocation, allocationRoot: allocation.root, repository, factoryRepository: { directory: "/never-opened" } as never, responseFactoryRepository: null, fixture: { candidates: [], host, run: async () => { throw new Error("must not run") } } })).rejects.toThrow("DECLARED_PAYOFF_CAPACITY")
    expect(readdirSync(repository.directory)).toEqual([])
  })
})
