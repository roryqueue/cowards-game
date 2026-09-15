import { mkdtempSync, realpathSync, readdirSync, readFileSync, rmSync, cpSync, writeFileSync } from "node:fs"
import { createHash } from "node:crypto"
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
import { createLeagueCellTerminal, LeaguePayoffProjectionSchema } from "../packages/strategy-lab/src/league/contracts.js"
import { LAB_ADMITTED_ROOTS, labRoot } from "../packages/strategy-lab/src/contracts.js"
import { factoryAssessmentImplementationRoot } from "./v1-38-factory-implementation.js"
import { runSeriousLeague, prepareSeriousLeague, readLeagueRecordGraph, verifyRetainedSeriousLeague, LeagueRecordGraph, LeagueRetentionBudget, seriousLeagueMain, type LeagueCandidateInput, type LeagueFixtureSeams } from "./run-v1-38-serious-league.js"
import { createFactoryRepository, publishFactoryArtifact, recordFactoryAttemptStart, publishFactoryAttemptTerminal } from "../packages/strategy-lab/src/factory/repository.js"
import { createFactoryAttemptStart, createFactoryAttemptTerminal } from "../packages/strategy-lab/src/factory/ledger.js"
import { produceLeagueResponse } from "./lib/v1-38-league-response-runtime.js"
import { positiveResponseFixture } from "./lib/v1-38-league-response-runtime.test.js"
import { executeLeagueAuthoring } from "./lib/v1-38-league-authoring.js"
import { countLinkedResponseIterations } from "../packages/strategy-lab/src/league/selection.js"
import { runCanonicalLabMatch, type LabRuntimeEvidence } from "../packages/strategy-lab/src/runtime-bridge.js"

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
      publishFactoryAttemptTerminal(factory, factoryStart, createFactoryAttemptTerminal({ startRoot: factoryStart.root, disposition: "accepted", outputRoot: r("output"), validationRoot: r("validation"), duplicateEvidenceRoot: r("duplicate"), finalEvidenceRoot: r("final") }))
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
  it.each([false, true, "response-provider"])("re-enters a measured positive response and reopens the whole loop (failure after accepted population growth: %s)", async (failAfterGrowth) => {
    const candidates = [await candidate(1), await candidate(3)], repository = createLeagueRepository(temporary()), responseDirectory = realpathSync(mkdtempSync(join(tmpdir(), "factory-positive-league-test-"))); directories.push(responseDirectory)
    const responseFactoryRepository = createFactoryRepository(responseDirectory), put = (value: unknown) => { const encoded = admitCanonicalJsonValue(value, { profile: "canonical-manifest" }); if (!encoded.ok) throw new Error("fixture encode"); return publishFactoryArtifact(responseFactoryRepository, encoded.canonicalBytes) }, r = (label: string) => labRoot("positive-league-fixture", label), base = allocationFixture()
    const producerInput = { split: "development", doctrineFamily: "source-only-positive-response", provider: { providerId: "source-fixture", modelId: "local", modelVersion: "test", settingsRoot: r("settings"), promptRoot: r("prompt"), contextRoot: r("context") }, build: { buildRoot: r("build"), toolchainRoot: r("toolchain") }, lineage: { predecessorRoot: LAB_ADMITTED_ROOTS.currentStartRoot, correctionRoot: null, retryParentRoot: null } }, producerRequestArtifactRoot = put({ producerIdentity: "emitTacticalFactoryPacket", origin: "tactical-oracle", evidenceClass: "real_producer", producerInput }), disclosureArtifactRoot = put({ participantId: "author", requestArtifactRoot: producerRequestArtifactRoot, sourceAndBuildDisclosed: true, dependencyArtifactRoots: [] }), provenanceArtifactRoot = put({ participantId: "author", priorExposure: "none", conflicts: "none", origin: "tactical-oracle", deterministicDataOnly: true }), reviewArtifactRoot = put({ reviewerId: "reviewer", participantId: "author", disclosureArtifactRoot, provenanceArtifactRoot, disposition: "accepted", reviewMilliseconds: 0 }), reservation = { ...base.channels[0]!.perAttempt, matches: 72, effortMilliseconds: 360000 }, job = { id: "positive-response", channel: "automated" as const, evaluationRole: "development_response" as const, operation: "produce" as const, producerRequestArtifactRoot, disclosureArtifactRoot, provenanceArtifactRoot, reviewArtifactRoot, participantId: "author", reviewerId: "reviewer", reservation, retryParentJobId: null }
    const allocation = createLeagueExecutionAllocation({ ...base, outputDirectories: { league: repository.directory, responseFactory: responseDirectory }, implementationRoot: factoryAssessmentImplementationRoot(), initialCandidatePublicationRoots: candidates.map((row) => row.publicationRoot).sort(), independenceReferencePublicationRoot: candidates[0]!.publicationRoot, opportunities: { ...base.opportunities, attemptedCandidates: 1, acceptedResponseSlots: 1, matches: 500 }, operations: { ...base.operations, maxPopulation: 3, perAttemptMilliseconds: 360000, wallClockMilliseconds: 600000, maxArtifactBytes: 250000000, maxArtifactRecords: 200000 }, channels: base.channels.map((channel) => channel.channel === "automated" ? { ...channel, disposition: "allocated", opportunities: 1, ceilings: reservation, perAttempt: reservation, participants: ["author"], reviewers: ["reviewer"] } : channel), rounds: [{ ordinal: 0, acceptedSlots: 1, jobs: [job] }, base.rounds[1]!] }), productionFixture = positiveResponseFixture(new Set(candidates.map((row) => row.admission.candidate.proposal.source.root)))
    let cells = 0, responseMatches = 0
    const fixture: LeagueFixtureSeams = { candidates, host: { createFactorySupervisedRuntime(request) { const provider = host.createFactorySupervisedRuntime(request); return { ...provider, identity: { ...provider.identity, tupleId: MATCH_KERNEL.tupleId } } } }, run: async ({ match, providers }) => { cells++; if (failAfterGrowth === true && cells === 69) return runCanonicalLabMatch({ match, providers }); const state = MATCH_KERNEL.createMachineV119(match).initialState; expect(state.soldiers).toHaveLength(16); for (const provider of Object.values(providers)) provider.close(); return { kind: "completed", privacy: "private_offline", transitions: [], accounting: [], result: { state: { ...state, outcome: { type: "DRAW" } }, events: [{ type: "MATCH_ENDED", payload: { type: "DRAW" } }] } } as never }, produce: (input) => produceLeagueResponse({ ...input, fixture: { ...productionFixture,
      host: { createFactorySupervisedRuntime(request) {
        const provider = productionFixture.host.createFactorySupervisedRuntime(request)
        return failAfterGrowth === "response-provider" ? { ...provider, identity: { ...provider.identity, tupleId: MATCH_KERNEL.tupleId }, invoke() { throw new Error("inert provider failure") } } : provider
      } },
      run: (request) => { responseMatches++; return failAfterGrowth === "response-provider" ? runCanonicalLabMatch(request) : productionFixture.run(request) }
    } }) }
    const result = await runSeriousLeague({ allocation, allocationRoot: allocation.root, repository, factoryRepository: candidates[0]!.factoryRepository, responseFactoryRepository, fixture }), graph = readLeagueRecordGraph(repository, result.headRoot, allocation.operations), head = graph.get(result.headRoot)!.value
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
