import { mkdtempSync, realpathSync, readdirSync, readFileSync, rmSync, cpSync, writeFileSync } from "node:fs"
import { createHash, randomUUID } from "node:crypto"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { MATCH_KERNEL } from "../packages/engine/src/index.js"
import { defaultRuntimeMetadata, admitCanonicalJsonValue } from "@cowards/spec"
import { buildStrategyRevision } from "../packages/runtime-js/src/revision.js"
import { allocationFixture, prospectiveFixture, capacityFixture } from "../packages/strategy-lab/src/league/allocation.test.js"
import { importedCandidateFixture } from "../packages/strategy-lab/src/league/contracts.test.js"
import { createLeagueExecutionAllocation, createLeagueProspectiveAmendment, createProspectiveLeagueExecutionAllocation, createLeagueCapacityReceipt } from "../packages/strategy-lab/src/league/allocation.js"
import { createLeagueRepository, recordLeagueCellStart, publishLeagueCellTerminal, publishLeagueArtifact } from "../packages/strategy-lab/src/league/repository.js"
import { createLeagueCellTerminal, deriveLeagueResultEventRoot, LeaguePayoffProjectionSchema } from "../packages/strategy-lab/src/league/contracts.js"
import { LAB_ADMITTED_ROOTS, labRoot } from "../packages/strategy-lab/src/contracts.js"
import { factoryAssessmentImplementationRoot } from "./v1-38-factory-implementation.js"
import { runSeriousLeague, prepareSeriousLeague, readLeagueRecordGraph, verifyRetainedSeriousLeague, LeagueConnectedSession, LeagueRecordGraph, LeagueRetentionBudget, normalizedGameplayRoot, sameLargeExecution, sameLargeResult, diagnoseLeagueExecutionStorage, seriousLeagueMain, type LeagueCandidateInput, type LeagueFixtureSeams } from "./run-v1-38-serious-league.js"
import { prepareLeagueExecutionStream, readLeagueExecutionStream } from "./lib/v1-38-league-execution-stream.js"
import { createFactoryRepository, publishFactoryArtifact, recordFactoryAttemptStart, publishFactoryAttemptTerminal } from "../packages/strategy-lab/src/factory/repository.js"
import { createFactoryAttemptStart, createFactoryAttemptTerminal } from "../packages/strategy-lab/src/factory/ledger.js"
import { produceLeagueResponse } from "./lib/v1-38-league-response-runtime.js"
import { positiveResponseFixture } from "./lib/v1-38-league-response-runtime.test.js"
import { executeLeagueAuthoring } from "./lib/v1-38-league-authoring.js"
import { countLinkedResponseIterations } from "../packages/strategy-lab/src/league/selection.js"
import { runCanonicalLabMatch, type LabRuntimeEvidence } from "../packages/strategy-lab/src/runtime-bridge.js"
import { advanceLeagueRound } from "../packages/strategy-lab/src/league/psro.js"
import { prepareProspectiveSeriousLeague, preflightProspectiveSeriousLeague, validateProspectiveLeagueInitialCandidates, leagueCurrentSourceIdentity } from "./run-v1-38-serious-league.js"

const directories: string[] = []
afterEach(() => { vi.restoreAllMocks(); for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true }) })
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
      const timedFixture: LeagueFixtureSeams = { ...fixture, capacityContext: undefined, readCandidates() {
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
      const retention = failAfterGrowth === "result-retention" ? { ...input.retention, beforeDispatch: () => input.retention.beforeDispatch(), beforeInvocation: (request: unknown) => input.retention.beforeInvocation(request), append(kind: string, value: unknown, links: readonly string[] = []) {
        if (kind === "response-production-result") throw new Error("injected result retention failure")
        return input.retention.append(kind, value, links as never)
      } } : input.retention
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
