import { afterEach, describe, expect, it } from "vitest"
import { createHash } from "node:crypto"
import { mkdtempSync, realpathSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { admitCanonicalJsonValue } from "@cowards/spec"
import { admitFactory, authorizeFactorySupervision, superviseFactory } from "../factory/admission.js"
import { createFactoryRepository, publishFactoryArtifact } from "../factory/repository.js"
import { publishFactorySupervisionArtifacts } from "../factory/supervision-artifacts.js"
import { deriveFactoryCandidateRoot, deriveFactoryOraclePacketRoot } from "../factory/identity.js"
import { NUMERIC_DIMENSIONS, freezeNumericCalibrationThreshold, type NumericComparison, type NumericControlTable } from "../factory/numeric-calibration.js"
import { labRoot, type LabRoot } from "../contracts.js"
import { factoryCandidateFixture, factoryOraclePacketFixture, factoryProposalFromPacket, factoryValidationFixture } from "../factory/contracts.js"
import { createFactoryAttemptStart, createFactoryAttemptTerminal } from "../factory/ledger.js"
import { admitLeagueCandidate, createLeagueCandidateAdmission, importAssessedFactoryCandidate, projectCanonicalKernelOutcomeToEntrantHalfPoints } from "./contracts.js"

const directories: string[] = []
afterEach(() => { for (const path of directories.splice(0)) rmSync(path, { recursive: true, force: true }) })
/** Injected source-only evidence; no container, provider process or canonical Match is run. */
export const importedCandidateFixture = async (slot: number) => {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), "factory-league-import-test-"))); directories.push(directory)
  const repository = createFactoryRepository(directory)
  const put = (value: unknown) => { const bytes = admitCanonicalJsonValue(value, { profile: "canonical-manifest" }); if (!bytes.ok) throw new Error("test encoding"); return publishFactoryArtifact(repository, bytes.canonicalBytes) }
  const rooted = <T extends object>(domain: string, fields: T) => { const body = { schemaVersion: domain, ...fields }; return { ...body, root: labRoot(domain, body) } }
  const sourceUtf8 = `export default { selectActivations(){return {activationOrders:[],strategyMemory:{}}},soldierBrain(){return {action:{type:"TURN_TO_STONE"},soldierMemory:{}}}}; // slot ${slot}`
  const bytes = new TextEncoder().encode(sourceUtf8), sourceRoot = `sha256:${createHash("sha256").update(bytes).digest("hex")}` as LabRoot
  const packetBase = factoryOraclePacketFixture(), packetValue = { ...packetBase, source: { ...packetBase.source, root: sourceRoot, sha256: sourceRoot, byteLength: bytes.length } }, packet = { ...packetValue, root: deriveFactoryOraclePacketRoot(packetValue) }, proposal = factoryProposalFromPacket(packet), validation = factoryValidationFixture(proposal)
  const admitted = authorizeFactorySupervision({ sourceAdmission: admitFactory({ packet, proposal, sourceBytes: bytes, repository }), validation, repository })
  const start = createFactoryAttemptStart({ taskRoot: root("1"), budgetRoot: root("2"), candidateRoot: packet.root, authoringMechanism: "automated-oracle", inputRoot: root("3"), resourceAccountingRoot: root("4"), retryParentRoot: null })
  const identity = { revisionId: "test-candidate", sourceRoot, executableRoot: sourceRoot, tupleId: "test", tupleRoot: proposal.build.compatibilityTupleRoot, image: "test", harnessRoot: root("5"), budgetRoot: start.budgetRoot, attemptRoot: start.root, runtimeLimitsRoot: proposal.nativeLane.runtimeProfileRoot, nativeLane: proposal.nativeLane, factoryPacketRoot: packet.root, factoryProposalRoot: proposal.root, factoryValidationRoot: validation.root }
  const request = { kind: "selectActivations", requestId: "fixture:1", semanticTupleId: "test", coordinates: { phaseNumber: 1, roundNumber: 1, stage: "select_bottom", ordinal: 0, actingPlayerId: "candidate" }, input: { phaseNumber: 1, roundNumber: 1, activationCount: 1, board: { bounds: { minX: 0, maxX: 1, minY: 0, maxY: 1 }, soldiers: [], terrainStones: [] }, mySoldiers: [], enemySoldiers: [], strategyMemory: null, initialInitiativePlayerId: "candidate", hasInitialInitiative: true, roundInitiativePlayerId: "candidate", hasRoundInitiative: true } }
  const observation = { identity, requestId: request.requestId, method: request.kind, inputRoot: labRoot("runtime-input", request.input), ordinal: 0, invocationRoot: root("a"), charged: true, completed: true, outputBytes: 2, result: { ok: true, value: { activationOrders: [], strategyMemory: {} } } }
  const receipt = await superviseFactory(admitted, "candidate", { match: { bottomPlayerId: "candidate", topPlayerId: "opponent" } as never, providers: { candidate: { identity, invoke() { return observation as never }, verify() { return true }, close() { return { cleanupComplete: true, orphanedChild: false } } } } }, async ({ providers }) => { const accounting = await providers.candidate!.invoke(request as never, identity); return { kind: "completed", privacy: "private_offline", result: { state: {}, events: [] }, transitions: [], accounting: [accounting] } as never })
  const stored = publishFactorySupervisionArtifacts(repository, receipt)
  const candidateBase = factoryCandidateFixture(proposal, validation, receipt.root), fingerprints = Object.fromEntries(Object.keys(candidateBase.fingerprints).map((key) => [key, labRoot("import-test-fingerprint", { slot, key })])) as unknown as typeof candidateBase.fingerprints
  const candidateValue = { ...candidateBase, fingerprints }, candidate = { ...candidateValue, root: deriveFactoryCandidateRoot(candidateValue) }
  const producer = rooted("factory-ingestion-v1", { privacy: "private_offline", producerIdentity: "emitTacticalFactoryPacket", origin: "tactical-oracle", evidenceClass: "real_producer", packetRoot: packet.root, sourceRoot, runtimeProfileRoot: packet.nativeLane.runtimeProfileRoot, nativeLane: packet.nativeLane, packet, sourceUtf8, producerInput: {}, modelCompanion: null })
  const fingerprint = rooted("factory-fingerprint-evidence-v1", { privacy: "private_offline", proposalRoot: proposal.root, validationRoot: validation.root, supervisionReceiptRoot: receipt.root, producerIdentity: producer.producerIdentity, origin: producer.origin, evidenceClass: "real_producer", producerArtifactRoot: put(producer), authorshipRoots: [root("a")], lineageNodes: [{ root: proposal.root, artifactRoot: root("b"), parents: [] }], dependencyNodes: [{ root: sourceRoot, artifactRoot: sourceRoot, dependencies: [] }], matchupResponses: [{ supervisionReceiptRoot: receipt.root, conditionRoot: root("c"), opponentRoot: root("d"), side: "bottom", initialInitiative: true, outcome: "draw", responseRoot: root("e") }], counterfactualPairs: [{ leftRoot: proposal.root, rightRoot: proposal.root, relation: "borderline" }], failureModes: ["accepted"] })
  const fingerprintArtifactRoot = put(fingerprint)
  const publicationArtifactRoot = put(rooted("factory-candidate-publication-v1", { privacy: "private_offline", candidate, independenceReceipt: { evidenceRoot: fingerprint.root, evidenceArtifactRoot: fingerprintArtifactRoot }, supervisionReceiptRoot: receipt.root, independenceStatus: "unresolved" }))
  const terminal = createFactoryAttemptTerminal({ startRoot: start.root, disposition: "unresolved", outputRoot: stored.artifactRoot, validationRoot: validation.root, duplicateEvidenceRoot: root("6"), finalEvidenceRoot: root("7") })
  const score = (score: number): NumericComparison => ({ dimensions: Object.fromEntries(NUMERIC_DIMENSIONS.map((key) => [key, { score, informativeCount: 4 }])) as NumericComparison["dimensions"], informativeDimensions: 6, weightedMean: score })
  const controls: NumericControlTable = { "S01/S02": score(.9), "S03/S04": score(.95), "S05/S06": score(.9), "S01/S07": score(.7), "S01/S08": score(.3), "S11/S12": score(.7) }, fit = freezeNumericCalibrationThreshold(controls)
  if (fit.status !== "frozen") throw new Error("test calibration")
  const sourceRoots = Array.from({ length: 12 }, (_, index) => index + 1 === slot ? sourceRoot : labRoot("import-test-source", index))
  const threshold = rooted("factory-numeric-threshold-v1", { manifestRoot: root("8"), allocationRoot: root("9"), sourceRoots, controls, threshold: fit.threshold }), thresholdArtifactRoot = put(threshold)
  const assessment = rooted("factory-independence-assessment-v1", { privacy: "private_offline", input: { candidateArtifactRoots: [publicationArtifactRoot], supervisionArtifactRoots: [stored.artifactRoot], terminalRoots: [terminal.root] }, manifestRoot: root("8"), allocationRoot: root("9"), status: "affirmed", reasons: [], thresholdArtifactRoot, baseEdges: { "S01/S03": score(.1), "S01/S05": score(.2), "S03/S05": score(.25) } }), assessmentArtifactRoot = put(assessment)
  const verifyRetainedAssessment = () => ({ status: "affirmed", assessmentRoot: assessment.root, thresholdArtifactRoot })
  const input = { repository, publicationArtifactRoot, supervisionArtifactRoot: stored.artifactRoot, assessmentArtifactRoot, attemptStart: start, attemptTerminal: terminal, maxBytes: 1000000, maxRecords: 1000, verifyRetainedAssessment }
  return { input, candidateAdmission: importAssessedFactoryCandidate(input), factoryRepository: repository, fingerprintArtifactRoot, fingerprint, put, importedAssessment: { maxBytes: input.maxBytes, maxRecords: input.maxRecords, verifyRetainedAssessment } }
}

const root = (letter: string): LabRoot => `sha256:${letter.repeat(64)}` as LabRoot
const candidate = () => {
  const proposal = factoryProposalFromPacket(factoryOraclePacketFixture())
  return factoryCandidateFixture(proposal, factoryValidationFixture(proposal))
}
const admission = () => {
  const value = candidate()
  const start = createFactoryAttemptStart({ taskRoot: root("1"), budgetRoot: root("2"), candidateRoot: value.root, authoringMechanism: "automated-oracle", inputRoot: root("3"), resourceAccountingRoot: root("4"), retryParentRoot: null })
  const terminal = createFactoryAttemptTerminal({ startRoot: start.root, disposition: "accepted", outputRoot: root("5"), validationRoot: root("6"), duplicateEvidenceRoot: root("7"), finalEvidenceRoot: root("8") })
  return { candidate: value, start, terminal, league: createLeagueCandidateAdmission({
    candidate: value, supervisionReceiptRoot: value.supervisionReceiptRoot,
    fingerprintRoot: labRoot("factory-fingerprint-roots-v1", value.fingerprints), lineageRoot: labRoot("factory-lineage-v1", value.lineage),
    tupleRoot: value.proposal.build.compatibilityTupleRoot, runtimeRoot: value.proposal.nativeLane.runtimeProfileRoot,
    provenanceRoot: root("9"), attemptStart: start, attemptTerminal: terminal,
  }) }
}
const completed = (winner: "bottom" | "top" | "DRAW") => {
  const outcome = winner === "DRAW" ? { type: "DRAW" as const } : { type: "WIN" as const, winnerPlayerId: winner }
  const events = [{ type: "MATCH_ENDED", payload: outcome }]
  return { execution: { kind: "completed", privacy: "private_offline", result: { state: { outcome }, events }, transitions: [], accounting: [] } as never, resultEventRoot: labRoot("league-result-events-v1", events) }
}
const projection = (winner: "bottom" | "top" | "DRAW", entrant: "bottom" | "top") => {
  const result = completed(winner)
  return projectCanonicalKernelOutcomeToEntrantHalfPoints({
    execution: result.execution, entrantCandidateRoot: entrant === "bottom" ? root("a") : root("b"), bottomCandidateRoot: root("a"), topCandidateRoot: root("b"),
    bottomPlayerId: "bottom", topPlayerId: "top", cellRoot: root("c"), conditionRoot: root("d"), semanticGeometryHash: root("e"), resultEventRoot: result.resultEventRoot,
  })
}

describe("private league contracts", () => {
  it("imports finalized packet-reserved evidence without rewriting unresolved historical terminals", async () => {
    const fixture = await importedCandidateFixture(1), original = JSON.stringify(fixture.input.attemptTerminal)
    expect(fixture.candidateAdmission.importEvidence).toMatchObject({ sourceSlot: "S01", qualification: "base_distinct" })
    expect(fixture.candidateAdmission.attemptTerminal.disposition).toBe("unresolved")
    expect(() => importAssessedFactoryCandidate({ ...fixture.input, verifyRetainedAssessment: () => ({ status: "unresolved", assessmentRoot: root("a"), thresholdArtifactRoot: null }) })).toThrow("IMPORT_ASSESSMENT")
    expect(() => importAssessedFactoryCandidate({ ...fixture.input, publicationArtifactRoot: root("b") })).toThrow("IMPORT_MEMBERSHIP")
    expect(() => importAssessedFactoryCandidate({ ...fixture.input, attemptStart: createFactoryAttemptStart({ ...fixture.input.attemptStart, candidateRoot: root("c") }) })).toThrow()
    expect(JSON.stringify(fixture.input.attemptTerminal)).toBe(original)
    expect((await importedCandidateFixture(2)).candidateAdmission.importEvidence!.qualification).toBe("control_or_unresolved")
  })
  it("admits a factory candidate only through revalidated issued evidence, never a claimed boolean", () => {
    const evidence = admission()
    const issuer = { verifyCandidate: (value: typeof evidence.candidate) => value.root === evidence.candidate.root }
    expect(admitLeagueCandidate(issuer, evidence.league)).toMatchObject({ candidate: { root: evidence.candidate.root } })
    expect(() => admitLeagueCandidate({ verifyCandidate: () => false }, evidence.league)).toThrow()
    expect(() => admitLeagueCandidate(issuer, { ...evidence.league, issued: true })).toThrow()
  })

  it("projects one completed canonical outcome by entrant, not by bottom/top score", () => {
    expect(projection("bottom", "bottom").halfPoints).toBe(2)
    expect(projection("bottom", "top").halfPoints).toBe(0)
    expect(projection("top", "bottom").halfPoints).toBe(0)
    expect(projection("top", "top").halfPoints).toBe(2)
    expect(projection("DRAW", "bottom").halfPoints).toBe(1)
    expect(projection("DRAW", "top").halfPoints).toBe(1)
  })

  it("rejects a caller-selected event root or a nonterminal execution", () => {
    const result = completed("bottom")
    expect(() => projectCanonicalKernelOutcomeToEntrantHalfPoints({ execution: result.execution, entrantCandidateRoot: root("a"), bottomCandidateRoot: root("a"), topCandidateRoot: root("b"), bottomPlayerId: "bottom", topPlayerId: "top", cellRoot: root("c"), conditionRoot: root("d"), semanticGeometryHash: root("e"), resultEventRoot: root("f") })).toThrow()
    expect(() => projectCanonicalKernelOutcomeToEntrantHalfPoints({ execution: { kind: "failure" } as never, entrantCandidateRoot: root("a"), bottomCandidateRoot: root("a"), topCandidateRoot: root("b"), bottomPlayerId: "bottom", topPlayerId: "top", cellRoot: root("c"), conditionRoot: root("d"), semanticGeometryHash: root("e"), resultEventRoot: root("f") })).toThrow()
  })
})
