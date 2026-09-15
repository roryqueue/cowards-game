import { createHash } from "node:crypto"
import { mkdtempSync, realpathSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { admitCanonicalJsonValue } from "@cowards/spec"
import { labRoot, type LabRoot } from "../contracts.js"
import { factoryCandidateFixture, factoryOraclePacketFixture, factoryProposalFromPacket, factoryValidationFixture } from "../factory/contracts.js"
import { deriveFactoryCandidateRoot, deriveFactoryOraclePacketRoot } from "../factory/identity.js"
import { createFactoryRepository, publishFactoryArtifact } from "../factory/repository.js"
import { createFactoryAttemptStart, createFactoryAttemptTerminal } from "../factory/ledger.js"
import { createLeagueCandidateAdmission, createLeagueMixture, LeagueCandidateAdmissionSchema } from "./contracts.js"
import { deriveLeaguePortfolio, selectRobustPure } from "./selection.js"

const dirs: string[] = []
const root = (label: string): LabRoot => labRoot("selection-test-root-v2", { label })
const sourceRoot = (source: string): LabRoot => `sha256:${createHash("sha256").update(source).digest("hex")}` as LabRoot
const repo = () => { const directory = realpathSync(mkdtempSync(join(tmpdir(), "factory-selection-test-"))); dirs.push(directory); return createFactoryRepository(directory) }
afterEach(() => { for (const directory of dirs.splice(0)) rmSync(directory, { recursive: true, force: true }) })

const candidate = (label: string, correlated = false) => {
  const repository = repo(), sourceUtf8 = `export default { selectActivations(){ return { activationOrders: [], strategyMemory: {} } }, soldierBrain(){ return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} } } }; // ${label}`, source = sourceRoot(sourceUtf8)
  const fixture = factoryOraclePacketFixture(), packetValue = { ...fixture, source: { ...fixture.source, root: source, sha256: source, byteLength: sourceUtf8.length } }, packet = { ...packetValue, root: deriveFactoryOraclePacketRoot(packetValue) }, proposal = factoryProposalFromPacket(packet), validation = factoryValidationFixture(proposal)
  const original = factoryCandidateFixture(proposal, validation, root(`supervision:${label}`)), candidateValue = { ...original, fingerprints: { sourceStructureRoot: root(`structure:${label}`), lineageRoot: root(`lineage:${label}`), dependencyRoot: root(`dependency:${label}`), legalInputDecisionRoot: root(`legal:${label}`), chronicleBehaviorRoot: root(`behavior:${label}`), matchupResponseRoot: root(`response:${label}`) } }
  const admittedCandidate = { ...candidateValue, root: deriveFactoryCandidateRoot(candidateValue) }
  const start = createFactoryAttemptStart({ taskRoot: root(`task:${label}`), budgetRoot: root(`budget:${label}`), candidateRoot: admittedCandidate.root, authoringMechanism: "automated-oracle", inputRoot: root(`input:${label}`), resourceAccountingRoot: root(`accounting:${label}`), retryParentRoot: null })
  const admission = createLeagueCandidateAdmission({ candidate: admittedCandidate, supervisionReceiptRoot: admittedCandidate.supervisionReceiptRoot, fingerprintRoot: labRoot("factory-fingerprint-roots-v1", admittedCandidate.fingerprints), lineageRoot: labRoot("factory-lineage-v1", admittedCandidate.lineage), tupleRoot: proposal.build.compatibilityTupleRoot, runtimeRoot: proposal.nativeLane.runtimeProfileRoot, provenanceRoot: root(`provenance:${label}`), attemptStart: start, attemptTerminal: createFactoryAttemptTerminal({ startRoot: start.root, disposition: "accepted", outputRoot: root(`output:${label}`), validationRoot: root(`attempt-validation:${label}`), duplicateEvidenceRoot: root(`duplicate:${label}`), finalEvidenceRoot: root(`final:${label}`) }) })
  LeagueCandidateAdmissionSchema.parse(admission)
  const producerValue = { schemaVersion: "factory-ingestion-v1", privacy: "private_offline", producerIdentity: "emitTacticalFactoryPacket", origin: "tactical-oracle", evidenceClass: "real_producer", packetRoot: packet.root, sourceRoot: source, runtimeProfileRoot: proposal.nativeLane.runtimeProfileRoot, nativeLane: proposal.nativeLane, packet, sourceUtf8, producerInput: {}, modelCompanion: null }
  const producer = { ...producerValue, root: labRoot("factory-ingestion-v1", producerValue) }, producerEncoded = admitCanonicalJsonValue(producer, { profile: "canonical-manifest" }); if (!producerEncoded.ok) throw new Error("producer"); const producerRoot = publishFactoryArtifact(repository, producerEncoded.canonicalBytes)
  const evidenceValue = { schemaVersion: "factory-fingerprint-evidence-v1", privacy: "private_offline", proposalRoot: proposal.root, validationRoot: validation.root, supervisionReceiptRoot: admittedCandidate.supervisionReceiptRoot, producerIdentity: "emitTacticalFactoryPacket", origin: "tactical-oracle", evidenceClass: "real_producer", producerArtifactRoot: producerRoot, authorshipRoots: [root(`author:${label}`)], lineageNodes: [{ root: root(`lineage-node:${label}`), artifactRoot: root(`lineage-artifact:${label}`), parents: [] }], dependencyNodes: [{ root: root(`dependency-node:${label}`), artifactRoot: root(`dependency-artifact:${label}`), dependencies: [] }], matchupResponses: [{ supervisionReceiptRoot: admittedCandidate.supervisionReceiptRoot, conditionRoot: root(`condition-one:${label}`), opponentRoot: root(`opponent-one:${label}`), side: "bottom", initialInitiative: true, outcome: "draw", responseRoot: root(`matchup-one:${label}`) }, { supervisionReceiptRoot: admittedCandidate.supervisionReceiptRoot, conditionRoot: root(`condition-two:${label}`), opponentRoot: root(`opponent-two:${label}`), side: "top", initialInitiative: false, outcome: "bottom", responseRoot: root(`matchup-two:${label}`) }], counterfactualPairs: [{ leftRoot: root(`pair-left:${label}`), rightRoot: root(`pair-right:${label}`), relation: correlated ? "correlated" : "distinct" }], failureModes: ["accepted"] }
  const evidence = { ...evidenceValue, root: labRoot("factory-fingerprint-evidence-v1", evidenceValue) }, encoded = admitCanonicalJsonValue(evidence, { profile: "canonical-manifest" }); if (!encoded.ok) throw new Error("evidence")
  return { candidateAdmission: admission, factoryRepository: repository, fingerprintArtifactRoot: publishFactoryArtifact(repository, encoded.canonicalBytes) }
}

const selectionEvidence = (snapshotRoot: LabRoot, populationRoot: LabRoot, solverOutputRoot: LabRoot, candidates: readonly LabRoot[], selected: LabRoot, response = 56, probe = 61, redTeam = 59) => {
  const scores = (score: number, prefix: string) => [{ candidateAdmissionRoot: selected, conditionRoot: root(`${prefix}:one`), numerator: score, denominator: 100, evidenceRoot: root(`${prefix}:evidence-one`) }, { candidateAdmissionRoot: selected, conditionRoot: root(`${prefix}:two`), numerator: score, denominator: 100, evidenceRoot: root(`${prefix}:evidence-two`) }]
  const value = { schemaVersion: "league-selection-evidence-v2" as const, privacy: "private_offline" as const, snapshotRoot, populationRoot, policyRoot: "sha256:7c0df85ac1dc0f983619fb93066c70ee4cd7eab727e730e8a25bb3f61b9a8e95" as LabRoot, solverOutputRoot, responseRows: scores(response, "response"), probeRows: scores(probe, "probe"), redTeamRows: scores(redTeam, "red-team"), invarianceRows: ["side", "initiative", "symmetry", "opaque_ids", "soldier_order", "source_order", "repeat"].map((probeName) => ({ candidateAdmissionRoot: selected, probe: probeName as never, observations: 1, mismatches: 0, evidenceRoot: root(`invariance:${probeName}`) })), terminalRows: ["legality", "privacy", "runtime"].map((boundary) => ({ candidateAdmissionRoot: selected, boundary: boundary as never, disposition: "success" as const, processValidity: "process_valid" as const, evidenceRoot: root(`terminal:${boundary}`) })), worstCases: candidates.flatMap((candidateRoot, index) => candidates.map((opponentAdmissionRoot) => ({ candidateAdmissionRoot: candidateRoot, opponentAdmissionRoot, numerator: candidateRoot === selected ? 3 : index === 1 ? 2 : 1, denominator: 4, evidenceRoot: root(`worst:${candidateRoot}:${opponentAdmissionRoot}`) }))) }
  return { ...value, root: labRoot("league-selection-evidence-v2", value) }
}

describe("source-bound portfolio and robust-pure selection", () => {
  it("rejects arbitrary roots and independent labels, while only retained source-backed FactoryFingerprintEvidence can create a portfolio", () => {
    const snapshotRoot = root("snapshot"), mixture = createLeagueMixture({ solverOutputRoot: root("solver"), weightRoot: root("weights"), snapshotRoot })
    expect(() => deriveLeaguePortfolio({ snapshotRoot, mixture, candidates: [{ candidateAdmission: { root: root("fake") }, factoryRepository: {} as never, fingerprintArtifactRoot: root("fake-evidence") }] })).toThrow("LEAGUE_")
    const first = candidate("first"), second = candidate("second", true), third = candidate("third")
    const portfolio = deriveLeaguePortfolio({ snapshotRoot, mixture, candidates: [first, second, third] })
    expect(portfolio.portfolio.candidateAdmissionRoots).toEqual([first.candidateAdmission.root, third.candidateAdmission.root].sort())
    expect(portfolio.rejections).toMatchObject([{ candidateAdmissionRoot: second.candidateAdmission.root, reason: "clone_or_correlation" }])
  })

  it("recomputes strict frozen policy boundaries and qualified maximin rather than accepting pass flags or another candidate's proof", () => {
    const snapshotRoot = root("snapshot"), populationRoot = root("population"), mixture = createLeagueMixture({ solverOutputRoot: root("solver"), weightRoot: root("weights"), snapshotRoot })
    const entries = [candidate("one"), candidate("two"), candidate("three")], portfolio = deriveLeaguePortfolio({ snapshotRoot, mixture, candidates: entries }).portfolio, selected = entries[0]!.candidateAdmission.root
    const evidence = selectionEvidence(snapshotRoot, populationRoot, mixture.solverOutputRoot, portfolio.candidateAdmissionRoots, selected)
    expect(selectRobustPure({ snapshotRoot, populationRoot, mixture, portfolio, candidateAdmissionRoot: selected, evidence })).toMatchObject({ kind: "robust_pure_finalist", candidateAdmissionRoot: selected })
    expect(selectRobustPure({ snapshotRoot, populationRoot, mixture, portfolio, candidateAdmissionRoot: selected, evidence: selectionEvidence(snapshotRoot, populationRoot, mixture.solverOutputRoot, portfolio.candidateAdmissionRoots, selected, 55) })).toMatchObject({ kind: "no_robust_pure_finalist_found" })
    expect(selectRobustPure({ snapshotRoot, populationRoot, mixture, portfolio, candidateAdmissionRoot: selected, evidence: selectionEvidence(snapshotRoot, populationRoot, mixture.solverOutputRoot, portfolio.candidateAdmissionRoots, selected, 56, 60) })).toMatchObject({ kind: "no_robust_pure_finalist_found" })
    const stale = { ...evidence, responseRows: evidence.responseRows.map((row) => ({ ...row, candidateAdmissionRoot: entries[1]!.candidateAdmission.root })) }; const rerooted = { ...stale, root: labRoot("league-selection-evidence-v2", (() => { const { root: _root, ...body } = stale; return body })()) }
    expect(selectRobustPure({ snapshotRoot, populationRoot, mixture, portfolio, candidateAdmissionRoot: selected, evidence: rerooted })).toMatchObject({ kind: "no_robust_pure_finalist_found" })
  })
})
